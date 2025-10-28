<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// ==================== 类型定义 ====================
interface DataSourceConfig {
  id: number
  tagName: string
  sourceName: string
  sourceType: 'database' | 'api' | 'file' | 'thirdParty'
  dataTableOrPath: string
  updateTime: string
  status: boolean
  creator: string
  remark: string
  // 数据库类型配置
  dbConfig?: {
    host: string
    port: number
    database: string
    tableName: string
    querySql: string
  }
  // 接口类型配置
  apiConfig?: {
    url: string
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    params: string
  }
  // 文件类型配置
  fileConfig?: {
    filePath: string
    fileType: string
  }
  // 第三方系统配置
  thirdPartyConfig?: {
    systemId: string
    authMethod: string
  }
  refreshFrequency: 'manual' | 'scheduled' | 'realtime'
  lastTestResult?: {
    success: boolean
    message: string
    duration: number
  }
}

interface SearchForm {
  keyword: string
  sourceType: string
  status: string
  dateRange: string[]
}

// ==================== Mock 数据 ====================
const mockTags = ['用户标签', '商品标签', '订单标签', '营销标签', '行为标签']

const mockDataSources = ['MySQL主库', 'PostgreSQL从库', 'Redis缓存', 'MongoDB文档库', 'API网关']

// 生成 Mock 数据列表
const generateMockData = (): DataSourceConfig[] => {
  return [
    {
      id: 1,
      tagName: '用户标签',
      sourceName: 'MySQL主库',
      sourceType: 'database',
      dataTableOrPath: 'user_info',
      updateTime: '2025-10-28 10:30:00',
      status: true,
      creator: '张三',
      remark: '用户基础信息表',
      dbConfig: {
        host: '192.168.1.100',
        port: 3306,
        database: 'user_db',
        tableName: 'user_info',
        querySql: 'SELECT * FROM user_info WHERE status = 1'
      },
      refreshFrequency: 'scheduled',
      lastTestResult: {
        success: true,
        message: '连接成功',
        duration: 125
      }
    },
    {
      id: 2,
      tagName: '商品标签',
      sourceName: 'API网关',
      sourceType: 'api',
      dataTableOrPath: '/api/v1/products',
      updateTime: '2025-10-27 15:20:00',
      status: true,
      creator: '李四',
      remark: '商品数据接口',
      apiConfig: {
        url: 'https://api.example.com/v1/products',
        method: 'GET',
        params: '{"pageSize": 100, "category": "all"}'
      },
      refreshFrequency: 'realtime',
      lastTestResult: {
        success: true,
        message: '接口调用成功',
        duration: 89
      }
    },
    {
      id: 3,
      tagName: '订单标签',
      sourceName: 'PostgreSQL从库',
      sourceType: 'database',
      dataTableOrPath: 'order_info',
      updateTime: '2025-10-26 09:15:00',
      status: false,
      creator: '王五',
      remark: '订单信息表',
      dbConfig: {
        host: '192.168.1.101',
        port: 5432,
        database: 'order_db',
        tableName: 'order_info',
        querySql: 'SELECT * FROM order_info WHERE create_time > NOW() - INTERVAL \'30 days\''
      },
      refreshFrequency: 'manual',
      lastTestResult: {
        success: false,
        message: '连接超时',
        duration: 5000
      }
    },
    {
      id: 4,
      tagName: '营销标签',
      sourceName: 'MongoDB文档库',
      sourceType: 'file',
      dataTableOrPath: '/data/marketing/campaigns.json',
      updateTime: '2025-10-25 14:30:00',
      status: true,
      creator: '赵六',
      remark: '营销活动数据文件',
      fileConfig: {
        filePath: '/data/marketing/campaigns.json',
        fileType: 'JSON'
      },
      refreshFrequency: 'scheduled'
    },
    {
      id: 5,
      tagName: '行为标签',
      sourceName: '第三方系统',
      sourceType: 'thirdParty',
      dataTableOrPath: 'behavior_tracking',
      updateTime: '2025-10-24 11:00:00',
      status: true,
      creator: '孙七',
      remark: '用户行为追踪系统',
      thirdPartyConfig: {
        systemId: 'BEHAVIOR_SYS_001',
        authMethod: 'OAuth 2.0'
      },
      refreshFrequency: 'realtime'
    }
  ]
}

// Mock 数据预览样本
const mockDataPreview = [
  { fieldName: 'user_id', fieldType: 'VARCHAR(50)', sampleValue: 'U10001' },
  { fieldName: 'user_name', fieldType: 'VARCHAR(100)', sampleValue: '张三' },
  { fieldName: 'age', fieldType: 'INT', sampleValue: '28' },
  { fieldName: 'gender', fieldType: 'VARCHAR(10)', sampleValue: '男' },
  { fieldName: 'register_time', fieldType: 'DATETIME', sampleValue: '2023-05-15 10:30:00' },
  { fieldName: 'status', fieldType: 'INT', sampleValue: '1' }
]

// ==================== 响应式状态 ====================
const tableData = ref<DataSourceConfig[]>([])
const filteredData = ref<DataSourceConfig[]>([])
const loading = ref(false)
const total = ref(0)

// 分页
const currentPage = ref(1)
const pageSize = ref(10)

// 搜索表单
const searchForm = reactive<SearchForm>({
  keyword: '',
  sourceType: '',
  status: '',
  dateRange: []
})

// 配置弹窗
const dialogVisible = ref(false)
const dialogTitle = ref('新建配置')
const configFormRef = ref<FormInstance>()
const configForm = reactive<Partial<DataSourceConfig>>({
  tagName: '',
  sourceName: '',
  sourceType: 'database',
  dataTableOrPath: '',
  status: true,
  remark: '',
  dbConfig: {
    host: '',
    port: 3306,
    database: '',
    tableName: '',
    querySql: ''
  },
  apiConfig: {
    url: '',
    method: 'GET',
    params: ''
  },
  fileConfig: {
    filePath: '',
    fileType: ''
  },
  thirdPartyConfig: {
    systemId: '',
    authMethod: ''
  },
  refreshFrequency: 'manual'
})

// 表单验证规则
const configFormRules = reactive<FormRules>({
  tagName: [{ required: true, message: '请选择标签名称', trigger: 'change' }],
  sourceName: [{ required: true, message: '请选择数据源名称', trigger: 'change' }],
  sourceType: [{ required: true, message: '请选择数据源类型', trigger: 'change' }],
  refreshFrequency: [{ required: true, message: '请选择数据刷新频率', trigger: 'change' }]
})

// 详情抽屉
const drawerVisible = ref(false)
const currentDetail = ref<DataSourceConfig | null>(null)

// 数据预览
const previewDialogVisible = ref(false)
const previewData = ref<any[]>([])
const previewSearchKeyword = ref('')

// 批量操作
const selectedRows = ref<DataSourceConfig[]>([])

// 数据源类型选项
const sourceTypeOptions = [
  { label: '数据库', value: 'database' },
  { label: '接口', value: 'api' },
  { label: '文件', value: 'file' },
  { label: '第三方系统', value: 'thirdParty' }
]

// 刷新频率选项
const refreshFrequencyOptions = [
  { label: '手动', value: 'manual' },
  { label: '定时', value: 'scheduled' },
  { label: '实时', value: 'realtime' }
]

// 请求方式选项
const methodOptions = ['GET', 'POST', 'PUT', 'DELETE']

// ==================== 计算属性 ====================
const sourceTypeLabel = (type: string) => {
  const typeMap: Record<string, string> = {
    database: '数据库',
    api: '接口',
    file: '文件',
    thirdParty: '第三方系统'
  }
  return typeMap[type] || type
}

const refreshFrequencyLabel = (freq: string) => {
  const freqMap: Record<string, string> = {
    manual: '手动',
    scheduled: '定时',
    realtime: '实时'
  }
  return freqMap[freq] || freq
}

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredData.value.slice(start, end)
})

const filteredPreviewData = computed(() => {
  if (!previewSearchKeyword.value) return previewData.value
  return previewData.value.filter(item =>
    item.fieldName.toLowerCase().includes(previewSearchKeyword.value.toLowerCase())
  )
})

// ==================== 方法 ====================
// 加载数据
const loadData = async () => {
  loading.value = true
  // 模拟接口请求
  await new Promise(resolve => setTimeout(resolve, 500))
  tableData.value = generateMockData()
  applyFilters()
  loading.value = false
}

// 应用筛选
const applyFilters = () => {
  let data = [...tableData.value]

  // 关键字搜索
  if (searchForm.keyword) {
    const keyword = searchForm.keyword.toLowerCase()
    data = data.filter(item =>
      item.tagName.toLowerCase().includes(keyword) ||
      item.sourceName.toLowerCase().includes(keyword)
    )
  }

  // 数据源类型筛选
  if (searchForm.sourceType) {
    data = data.filter(item => item.sourceType === searchForm.sourceType)
  }

  // 状态筛选
  if (searchForm.status !== '') {
    const status = searchForm.status === 'true'
    data = data.filter(item => item.status === status)
  }

  // 时间范围筛选
  if (searchForm.dateRange && searchForm.dateRange.length === 2) {
    const [start, end] = searchForm.dateRange
    data = data.filter(item => {
      const updateTime = new Date(item.updateTime)
      return updateTime >= new Date(start) && updateTime <= new Date(end)
    })
  }

  filteredData.value = data
  total.value = data.length
  currentPage.value = 1
}

// 搜索
const handleSearch = () => {
  applyFilters()
}

// 重置搜索
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.sourceType = ''
  searchForm.status = ''
  searchForm.dateRange = []
  applyFilters()
}

// 新建配置
const handleCreate = () => {
  dialogTitle.value = '新建配置'
  resetConfigForm()
  dialogVisible.value = true
}

// 编辑配置
const handleEdit = (row: DataSourceConfig) => {
  dialogTitle.value = '编辑配置'
  Object.assign(configForm, JSON.parse(JSON.stringify(row)))
  dialogVisible.value = true
}

// 查看详情
const handleView = (row: DataSourceConfig) => {
  currentDetail.value = row
  drawerVisible.value = true
}

// 删除配置
const handleDelete = async (row: DataSourceConfig) => {
  try {
    await ElMessageBox.confirm('确定要删除该配置吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    loading.value = true
    // 模拟删除接口
    await new Promise(resolve => setTimeout(resolve, 500))

    const index = tableData.value.findIndex(item => item.id === row.id)
    if (index !== -1) {
      tableData.value.splice(index, 1)
    }

    ElMessage.success('删除成功')
    applyFilters()
    loading.value = false
  } catch {
    // 取消删除
  }
}

// 切换状态
const handleStatusChange = async (row: DataSourceConfig) => {
  loading.value = true
  // 模拟接口请求
  await new Promise(resolve => setTimeout(resolve, 300))
  ElMessage.success(`已${row.status ? '启用' : '停用'}`)
  loading.value = false
}

// 提交配置表单
const handleSubmit = async () => {
  if (!configFormRef.value) return

  await configFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true

      // 模拟保存接口
      await new Promise(resolve => setTimeout(resolve, 800))

      if (configForm.id) {
        // 编辑
        const index = tableData.value.findIndex(item => item.id === configForm.id)
        if (index !== -1) {
          tableData.value[index] = {
            ...tableData.value[index],
            ...configForm,
            updateTime: new Date().toLocaleString('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            }).replace(/\//g, '-')
          } as DataSourceConfig
        }
        ElMessage.success('编辑成功')
      } else {
        // 新建
        const newConfig: DataSourceConfig = {
          ...configForm,
          id: Date.now(),
          updateTime: new Date().toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          }).replace(/\//g, '-'),
          creator: '当前用户'
        } as DataSourceConfig
        tableData.value.unshift(newConfig)
        ElMessage.success('创建成功')
      }

      dialogVisible.value = false
      applyFilters()
      loading.value = false
    }
  })
}

// 测试连接
const handleTestConnection = async () => {
  const loadingInstance = ElLoading.service({
    lock: true,
    text: '正在测试连接...',
    background: 'rgba(0, 0, 0, 0.7)'
  })

  // 模拟测试连接
  await new Promise(resolve => setTimeout(resolve, 2000))

  const success = Math.random() > 0.3 // 70% 成功率

  loadingInstance.close()

  if (success) {
    ElMessage.success('连接测试成功！')
    configForm.lastTestResult = {
      success: true,
      message: '连接成功',
      duration: Math.floor(Math.random() * 200) + 50
    }
  } else {
    ElMessage.error('连接测试失败，请检查配置信息')
    configForm.lastTestResult = {
      success: false,
      message: '连接失败：超时或配置错误',
      duration: 5000
    }
  }
}

// 数据预览
const handleDataPreview = async (row: DataSourceConfig) => {
  const loadingInstance = ElLoading.service({
    lock: true,
    text: '正在加载数据预览...',
    background: 'rgba(0, 0, 0, 0.7)'
  })

  // 模拟加载数据
  await new Promise(resolve => setTimeout(resolve, 1500))

  previewData.value = mockDataPreview
  previewDialogVisible.value = true

  loadingInstance.close()
}

// 重置配置表单
const resetConfigForm = () => {
  if (configFormRef.value) {
    configFormRef.value.resetFields()
  }
  Object.assign(configForm, {
    tagName: '',
    sourceName: '',
    sourceType: 'database',
    dataTableOrPath: '',
    status: true,
    remark: '',
    dbConfig: {
      host: '',
      port: 3306,
      database: '',
      tableName: '',
      querySql: ''
    },
    apiConfig: {
      url: '',
      method: 'GET',
      params: ''
    },
    fileConfig: {
      filePath: '',
      fileType: ''
    },
    thirdPartyConfig: {
      systemId: '',
      authMethod: ''
    },
    refreshFrequency: 'manual'
  })
}

// 批量选择
const handleSelectionChange = (selection: DataSourceConfig[]) => {
  selectedRows.value = selection
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请至少选择一条数据')
    return
  }

  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 条配置吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    loading.value = true
    // 模拟批量删除
    await new Promise(resolve => setTimeout(resolve, 800))

    const ids = selectedRows.value.map(item => item.id)
    tableData.value = tableData.value.filter(item => !ids.includes(item.id))

    ElMessage.success('批量删除成功')
    applyFilters()
    loading.value = false
  } catch {
    // 取消删除
  }
}

// 批量启用
const handleBatchEnable = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请至少选择一条数据')
    return
  }

  loading.value = true
  // 模拟批量启用
  await new Promise(resolve => setTimeout(resolve, 500))

  selectedRows.value.forEach(row => {
    const item = tableData.value.find(i => i.id === row.id)
    if (item) item.status = true
  })

  ElMessage.success('批量启用成功')
  applyFilters()
  loading.value = false
}

// 批量停用
const handleBatchDisable = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请至少选择一条数据')
    return
  }

  loading.value = true
  // 模拟批量停用
  await new Promise(resolve => setTimeout(resolve, 500))

  selectedRows.value.forEach(row => {
    const item = tableData.value.find(i => i.id === row.id)
    if (item) item.status = false
  })

  ElMessage.success('批量停用成功')
  applyFilters()
  loading.value = false
}

// 导出配置
const handleExport = () => {
  const dataToExport = selectedRows.value.length > 0 ? selectedRows.value : tableData.value

  const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
    type: 'application/json'
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `数据源配置_${new Date().getTime()}.json`
  link.click()
  URL.revokeObjectURL(url)

  ElMessage.success('导出成功')
}

// 导入配置
const handleImport = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return

    const loadingInstance = ElLoading.service({
      lock: true,
      text: '正在导入配置...',
      background: 'rgba(0, 0, 0, 0.7)'
    })

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      // 模拟导入处理
      await new Promise(resolve => setTimeout(resolve, 1000))

      if (Array.isArray(data)) {
        // 为导入的数据分配新 ID
        const importedData = data.map(item => ({
          ...item,
          id: Date.now() + Math.random(),
          updateTime: new Date().toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          }).replace(/\//g, '-')
        }))
        tableData.value.unshift(...importedData)
        applyFilters()
        ElMessage.success(`成功导入 ${importedData.length} 条配置`)
      } else {
        ElMessage.error('文件格式不正确')
      }
    } catch (error) {
      ElMessage.error('导入失败，请检查文件格式')
    } finally {
      loadingInstance.close()
    }
  }
  input.click()
}

// 分页变化
const handlePageChange = (page: number) => {
  currentPage.value = page
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

// ==================== 生命周期 ====================
onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="data-source-config-container">
    <!-- 顶部搜索操作区 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键字">
          <el-input
            v-model="searchForm.keyword"
            placeholder="标签名称/数据源名称"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="数据源类型">
          <el-select v-model="searchForm.sourceType" placeholder="请选择" clearable style="width: 150px">
            <el-option
              v-for="item in sourceTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable style="width: 120px">
            <el-option label="启用" value="true" />
            <el-option label="停用" value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="更新时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="operation-buttons">
        <el-button type="primary" @click="handleCreate">新建配置</el-button>
        <el-button type="success" @click="handleBatchEnable" :disabled="selectedRows.length === 0">
          批量启用
        </el-button>
        <el-button type="warning" @click="handleBatchDisable" :disabled="selectedRows.length === 0">
          批量停用
        </el-button>
        <el-button type="danger" @click="handleBatchDelete" :disabled="selectedRows.length === 0">
          批量删除
        </el-button>
        <el-button @click="handleExport">导出配置</el-button>
        <el-button @click="handleImport">导入配置</el-button>
      </div>
    </el-card>

    <!-- 数据源配置表格区 -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="paginatedData"
        border
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="tagName" label="标签名称"  />
        <el-table-column prop="sourceName" label="数据源名称" />
        <el-table-column prop="sourceType" label="数据源类型">
          <template #default="{ row }">
            <el-tag :type="row.sourceType === 'database' ? 'primary' : row.sourceType === 'api' ? 'success' : row.sourceType === 'file' ? 'warning' : 'info'">
              {{ sourceTypeLabel(row.sourceType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dataTableOrPath" label="数据表/接口路径" show-overflow-tooltip />
        <el-table-column prop="updateTime" label="更新时间" width="180" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              active-text="启用"
              inactive-text="停用"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="success" link size="small" @click="handleDataPreview(row)">数据预览</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 底部分页区 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <!-- 新建/编辑配置弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      :close-on-click-modal="false"
      @close="resetConfigForm"
    >
      <el-form
        ref="configFormRef"
        :model="configForm"
        :rules="configFormRules"
        label-width="120px"
      >
        <el-form-item label="标签名称" prop="tagName">
          <el-select v-model="configForm.tagName" placeholder="请选择标签" style="width: 100%">
            <el-option v-for="tag in mockTags" :key="tag" :label="tag" :value="tag" />
          </el-select>
        </el-form-item>

        <el-form-item label="数据源名称" prop="sourceName">
          <el-select v-model="configForm.sourceName" placeholder="请选择数据源" style="width: 100%">
            <el-option v-for="source in mockDataSources" :key="source" :label="source" :value="source" />
          </el-select>
        </el-form-item>

        <el-form-item label="数据源类型" prop="sourceType">
          <el-radio-group v-model="configForm.sourceType">
            <el-radio
              v-for="item in sourceTypeOptions"
              :key="item.value"
              :label="item.value"
            >
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-divider content-position="left">连接信息</el-divider>

        <!-- 数据库配置 -->
        <template v-if="configForm.sourceType === 'database'">
          <el-form-item label="主机地址">
            <el-input v-model="configForm.dbConfig!.host" placeholder="例如：192.168.1.100" />
          </el-form-item>
          <el-form-item label="端口">
            <el-input-number v-model="configForm.dbConfig!.port" :min="1" :max="65535" style="width: 100%" />
          </el-form-item>
          <el-form-item label="数据库名">
            <el-input v-model="configForm.dbConfig!.database" placeholder="请输入数据库名称" />
          </el-form-item>
          <el-form-item label="表名">
            <el-input v-model="configForm.dbConfig!.tableName" placeholder="请输入表名" />
          </el-form-item>
          <el-form-item label="查询语句">
            <el-input
              v-model="configForm.dbConfig!.querySql"
              type="textarea"
              :rows="4"
              placeholder="请输入 SQL 查询语句"
            />
          </el-form-item>
        </template>

        <!-- 接口配置 -->
        <template v-if="configForm.sourceType === 'api'">
          <el-form-item label="接口 URL">
            <el-input v-model="configForm.apiConfig!.url" placeholder="例如：https://api.example.com/v1/data" />
          </el-form-item>
          <el-form-item label="请求方式">
            <el-select v-model="configForm.apiConfig!.method" placeholder="请选择" style="width: 100%">
              <el-option v-for="method in methodOptions" :key="method" :label="method" :value="method" />
            </el-select>
          </el-form-item>
          <el-form-item label="参数定义">
            <el-input
              v-model="configForm.apiConfig!.params"
              type="textarea"
              :rows="4"
              placeholder="JSON 格式参数，例如：{&quot;pageSize&quot;: 100}"
            />
          </el-form-item>
        </template>

        <!-- 文件配置 -->
        <template v-if="configForm.sourceType === 'file'">
          <el-form-item label="文件路径">
            <el-input v-model="configForm.fileConfig!.filePath" placeholder="例如：/data/files/export.csv" />
          </el-form-item>
          <el-form-item label="文件类型">
            <el-select v-model="configForm.fileConfig!.fileType" placeholder="请选择" style="width: 100%">
              <el-option label="CSV" value="CSV" />
              <el-option label="JSON" value="JSON" />
              <el-option label="XML" value="XML" />
              <el-option label="Excel" value="Excel" />
            </el-select>
          </el-form-item>
        </template>

        <!-- 第三方系统配置 -->
        <template v-if="configForm.sourceType === 'thirdParty'">
          <el-form-item label="系统标识">
            <el-input v-model="configForm.thirdPartyConfig!.systemId" placeholder="请输入系统唯一标识" />
          </el-form-item>
          <el-form-item label="授权方式">
            <el-select v-model="configForm.thirdPartyConfig!.authMethod" placeholder="请选择" style="width: 100%">
              <el-option label="OAuth 2.0" value="OAuth 2.0" />
              <el-option label="API Key" value="API Key" />
              <el-option label="JWT Token" value="JWT Token" />
              <el-option label="Basic Auth" value="Basic Auth" />
            </el-select>
          </el-form-item>
        </template>

        <el-divider />

        <el-form-item label="数据刷新频率" prop="refreshFrequency">
          <el-radio-group v-model="configForm.refreshFrequency">
            <el-radio
              v-for="item in refreshFrequencyOptions"
              :key="item.value"
              :label="item.value"
            >
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="状态">
          <el-switch v-model="configForm.status" active-text="启用" inactive-text="停用" />
        </el-form-item>

        <el-form-item label="备注说明">
          <el-input
            v-model="configForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="warning" @click="handleTestConnection">测试连接</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 配置详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      title="配置详情"
      size="600px"
    >
      <template v-if="currentDetail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="标签名称">
            {{ currentDetail.tagName }}
          </el-descriptions-item>
          <el-descriptions-item label="数据源名称">
            {{ currentDetail.sourceName }}
          </el-descriptions-item>
          <el-descriptions-item label="数据源类型">
            <el-tag>{{ sourceTypeLabel(currentDetail.sourceType) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="数据表/接口路径">
            {{ currentDetail.dataTableOrPath }}
          </el-descriptions-item>
          <el-descriptions-item label="刷新频率">
            <el-tag type="success">{{ refreshFrequencyLabel(currentDetail.refreshFrequency) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentDetail.status ? 'success' : 'danger'">
              {{ currentDetail.status ? '启用' : '停用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建人">
            {{ currentDetail.creator }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ currentDetail.updateTime }}
          </el-descriptions-item>
          <el-descriptions-item label="备注">
            {{ currentDetail.remark || '无' }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">连接配置详情</el-divider>

        <!-- 数据库配置详情 -->
        <el-descriptions v-if="currentDetail.sourceType === 'database' && currentDetail.dbConfig" :column="1" border>
          <el-descriptions-item label="主机地址">{{ currentDetail.dbConfig.host }}</el-descriptions-item>
          <el-descriptions-item label="端口">{{ currentDetail.dbConfig.port }}</el-descriptions-item>
          <el-descriptions-item label="数据库名">{{ currentDetail.dbConfig.database }}</el-descriptions-item>
          <el-descriptions-item label="表名">{{ currentDetail.dbConfig.tableName }}</el-descriptions-item>
          <el-descriptions-item label="查询语句">
            <pre style="margin: 0">{{ currentDetail.dbConfig.querySql }}</pre>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 接口配置详情 -->
        <el-descriptions v-if="currentDetail.sourceType === 'api' && currentDetail.apiConfig" :column="1" border>
          <el-descriptions-item label="接口 URL">{{ currentDetail.apiConfig.url }}</el-descriptions-item>
          <el-descriptions-item label="请求方式">
            <el-tag>{{ currentDetail.apiConfig.method }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="参数定义">
            <pre style="margin: 0">{{ currentDetail.apiConfig.params }}</pre>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 文件配置详情 -->
        <el-descriptions v-if="currentDetail.sourceType === 'file' && currentDetail.fileConfig" :column="1" border>
          <el-descriptions-item label="文件路径">{{ currentDetail.fileConfig.filePath }}</el-descriptions-item>
          <el-descriptions-item label="文件类型">{{ currentDetail.fileConfig.fileType }}</el-descriptions-item>
        </el-descriptions>

        <!-- 第三方系统配置详情 -->
        <el-descriptions v-if="currentDetail.sourceType === 'thirdParty' && currentDetail.thirdPartyConfig" :column="1" border>
          <el-descriptions-item label="系统标识">{{ currentDetail.thirdPartyConfig.systemId }}</el-descriptions-item>
          <el-descriptions-item label="授权方式">{{ currentDetail.thirdPartyConfig.authMethod }}</el-descriptions-item>
        </el-descriptions>

        <!-- 连接测试结果 -->
        <template v-if="currentDetail.lastTestResult">
          <el-divider content-position="left">最近一次连接测试</el-divider>
          <el-alert
            :type="currentDetail.lastTestResult.success ? 'success' : 'error'"
            :title="currentDetail.lastTestResult.message"
            :closable="false"
            show-icon
          >
            <template #default>
              <div>耗时：{{ currentDetail.lastTestResult.duration }}ms</div>
            </template>
          </el-alert>
        </template>

        <!-- 数据抽样预览 -->
        <el-divider content-position="left">数据抽样预览</el-divider>
        <el-button type="primary" @click="handleDataPreview(currentDetail)">
          加载数据预览
        </el-button>
      </template>
    </el-drawer>

    <!-- 数据预览弹窗 -->
    <el-dialog
      v-model="previewDialogVisible"
      title="数据预览"
      width="900px"
    >
      <div class="preview-search">
        <el-input
          v-model="previewSearchKeyword"
          placeholder="搜索字段名称"
          clearable
          style="width: 300px"
        />
      </div>

      <el-table :data="filteredPreviewData" border stripe max-height="400">
        <el-table-column prop="fieldName" label="字段名称" width="200" />
        <el-table-column prop="fieldType" label="字段类型" width="150" />
        <el-table-column prop="sampleValue" label="样例值" min-width="200" />
      </el-table>

      <template #footer>
        <el-button @click="previewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.data-source-config-container {
  .search-card {
    margin-bottom: 20px;

    .operation-buttons {
      margin-top: 16px;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
  }

  .table-card {
    .pagination-container {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }

  .preview-search {
    margin-bottom: 16px;
  }

  :deep(.el-descriptions__label) {
    width: 140px;
  }

  :deep(.el-table) {
    .el-button + .el-button {
      margin-left: 8px;
    }
  }

  pre {
    white-space: pre-wrap;
    word-wrap: break-word;
    font-size: 13px;
    line-height: 1.5;
  }
}
</style>
