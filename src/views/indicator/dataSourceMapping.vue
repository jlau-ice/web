<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// ==================== 类型定义 ====================
interface DataSourceMapping {
  id: number
  indicatorName: string
  indicatorCode: string
  dataSource: string
  dataTable: string
  fieldNames: string[]
  aggregateMethod: string
  filterCondition: string
  updateStrategy: string
  enabled: boolean
  updateTime: string
}

interface SearchParams {
  keyword: string
  dataSource: string
  status: string
}

interface MappingFormData {
  id?: number
  indicatorName: string
  indicatorCode: string
  dataSource: string
  dataTable: string
  fieldNames: string[]
  aggregateMethod: string
  filterCondition: string
  updateStrategy: string
  enabled: boolean
}

interface PreviewData {
  columns: string[]
  rows: Record<string, any>[]
}

// ==================== 响应式数据 ====================
const loading = ref(false)
const tableData = ref<DataSourceMapping[]>([])
const total = ref(0)

// 搜索参数
const searchForm = reactive<SearchParams>({
  keyword: '',
  dataSource: '',
  status: ''
})

// 分页参数
const pagination = reactive({
  currentPage: 1,
  pageSize: 10
})

// 对话框控制
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref<FormInstance>()

// 表单数据
const formData = reactive<MappingFormData>({
  indicatorName: '',
  indicatorCode: '',
  dataSource: '',
  dataTable: '',
  fieldNames: [],
  aggregateMethod: '',
  filterCondition: '',
  updateStrategy: '',
  enabled: true
})

// 预览对话框
const previewDialogVisible = ref(false)
const previewData = ref<PreviewData>({
  columns: [],
  rows: []
})
const previewLoading = ref(false)

// ==================== Mock 数据 ====================
const mockMappings: DataSourceMapping[] = [
  {
    id: 1,
    indicatorName: '用户活跃度',
    indicatorCode: 'user_activity',
    dataSource: 'MySQL',
    dataTable: 'user_behavior',
    fieldNames: ['user_id', 'active_days'],
    aggregateMethod: 'COUNT',
    filterCondition: 'status = "active"',
    updateStrategy: '每日同步',
    enabled: true,
    updateTime: '2025-10-28 10:30:00'
  },
  {
    id: 2,
    indicatorName: '订单金额总计',
    indicatorCode: 'total_order_amount',
    dataSource: 'PostgreSQL',
    dataTable: 'orders',
    fieldNames: ['order_id', 'amount'],
    aggregateMethod: 'SUM',
    filterCondition: 'order_status = "completed"',
    updateStrategy: '实时更新',
    enabled: true,
    updateTime: '2025-10-28 11:20:00'
  },
  {
    id: 3,
    indicatorName: '平均客单价',
    indicatorCode: 'avg_order_price',
    dataSource: 'Hive',
    dataTable: 'dw_orders',
    fieldNames: ['customer_id', 'order_amount'],
    aggregateMethod: 'AVG',
    filterCondition: 'order_date >= "2025-01-01"',
    updateStrategy: '每日同步',
    enabled: false,
    updateTime: '2025-10-27 09:15:00'
  },
  {
    id: 4,
    indicatorName: '新增用户数',
    indicatorCode: 'new_users',
    dataSource: 'MySQL',
    dataTable: 'users',
    fieldNames: ['user_id', 'create_time'],
    aggregateMethod: 'COUNT',
    filterCondition: 'DATE(create_time) = CURDATE()',
    updateStrategy: '每小时同步',
    enabled: true,
    updateTime: '2025-10-28 12:00:00'
  },
  {
    id: 5,
    indicatorName: '转化率',
    indicatorCode: 'conversion_rate',
    dataSource: 'PostgreSQL',
    dataTable: 'conversion_funnel',
    fieldNames: ['visitor_id', 'converted'],
    aggregateMethod: 'AVG',
    filterCondition: 'source = "organic"',
    updateStrategy: '实时更新',
    enabled: true,
    updateTime: '2025-10-28 13:45:00'
  }
]

// 指标选项
const indicatorOptions = [
  { name: '用户活跃度', code: 'user_activity' },
  { name: '订单金额总计', code: 'total_order_amount' },
  { name: '平均客单价', code: 'avg_order_price' },
  { name: '新增用户数', code: 'new_users' },
  { name: '转化率', code: 'conversion_rate' },
  { name: '留存率', code: 'retention_rate' },
  { name: '点击率', code: 'click_rate' }
]

// 数据源选项
const dataSourceOptions = [
  { label: 'MySQL', value: 'MySQL' },
  { label: 'PostgreSQL', value: 'PostgreSQL' },
  { label: 'Hive', value: 'Hive' },
  { label: 'ClickHouse', value: 'ClickHouse' },
  { label: 'MongoDB', value: 'MongoDB' }
]

// 聚合方式选项
const aggregateOptions = [
  { label: 'SUM（求和）', value: 'SUM' },
  { label: 'AVG（平均值）', value: 'AVG' },
  { label: 'COUNT（计数）', value: 'COUNT' },
  { label: 'MAX（最大值）', value: 'MAX' },
  { label: 'MIN（最小值）', value: 'MIN' }
]

// 更新策略选项
const updateStrategyOptions = [
  { label: '实时更新', value: '实时更新' },
  { label: '每小时同步', value: '每小时同步' },
  { label: '每日同步', value: '每日同步' },
  { label: '每周同步', value: '每周同步' },
  { label: '手动触发', value: '手动触发' }
]

// 数据表选项（根据数据源动态变化）
const dataTableOptions = computed(() => {
  const tables: Record<string, string[]> = {
    MySQL: ['user_behavior', 'orders', 'users', 'products', 'transactions'],
    PostgreSQL: ['orders', 'conversion_funnel', 'customer_events', 'analytics'],
    Hive: ['dw_orders', 'dw_users', 'dw_products', 'ods_events'],
    ClickHouse: ['events', 'user_actions', 'metrics', 'logs'],
    MongoDB: ['user_profiles', 'sessions', 'events', 'logs']
  }
  return tables[formData.dataSource] || []
})

// 字段名称选项（根据数据表动态变化）
const fieldNameOptions = computed(() => {
  const fields: Record<string, string[]> = {
    user_behavior: ['user_id', 'active_days', 'page_views', 'session_time'],
    orders: ['order_id', 'amount', 'customer_id', 'order_status', 'order_date'],
    users: ['user_id', 'create_time', 'status', 'email', 'phone'],
    dw_orders: ['customer_id', 'order_amount', 'order_date', 'product_id'],
    conversion_funnel: ['visitor_id', 'converted', 'source', 'timestamp'],
    products: ['product_id', 'name', 'price', 'category'],
    customer_events: ['event_id', 'customer_id', 'event_type', 'timestamp']
  }
  return fields[formData.dataTable] || []
})

// 表单验证规则
const formRules: FormRules = {
  indicatorName: [{ required: true, message: '请选择指标名称', trigger: 'change' }],
  dataSource: [{ required: true, message: '请选择数据源', trigger: 'change' }],
  dataTable: [{ required: true, message: '请选择数据表', trigger: 'change' }],
  fieldNames: [{ required: true, message: '请选择字段名称', trigger: 'change' }],
  aggregateMethod: [{ required: true, message: '请选择聚合方式', trigger: 'change' }],
  updateStrategy: [{ required: true, message: '请选择更新策略', trigger: 'change' }]
}

// ==================== 计算属性 ====================
const filteredTableData = computed(() => {
  let data = [...tableData.value]

  // 关键字搜索
  if (searchForm.keyword) {
    const keyword = searchForm.keyword.toLowerCase()
    data = data.filter(
      (item) =>
        item.indicatorName.toLowerCase().includes(keyword) ||
        item.indicatorCode.toLowerCase().includes(keyword) ||
        item.dataSource.toLowerCase().includes(keyword) ||
        item.dataTable.toLowerCase().includes(keyword) ||
        item.fieldNames.some((field) => field.toLowerCase().includes(keyword))
    )
  }

  // 数据源筛选
  if (searchForm.dataSource) {
    data = data.filter((item) => item.dataSource === searchForm.dataSource)
  }

  // 状态筛选
  if (searchForm.status !== '') {
    const enabled = searchForm.status === 'enabled'
    data = data.filter((item) => item.enabled === enabled)
  }

  total.value = data.length

  // 分页
  const start = (pagination.currentPage - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return data.slice(start, end)
})

// ==================== 方法 ====================

// 加载数据
const loadData = async () => {
  loading.value = true
  // 模拟异步加载
  await new Promise((resolve) => setTimeout(resolve, 500))
  tableData.value = [...mockMappings]
  loading.value = false
}

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1
  // 使用计算属性，无需额外操作
}

// 重置搜索
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.dataSource = ''
  searchForm.status = ''
  pagination.currentPage = 1
}

// 新增映射
const handleAdd = () => {
  dialogTitle.value = '新增数据来源映射'
  resetForm()
  dialogVisible.value = true
}

// 编辑映射
const handleEdit = (row: DataSourceMapping) => {
  dialogTitle.value = '编辑数据来源映射'
  Object.assign(formData, {
    id: row.id,
    indicatorName: row.indicatorName,
    indicatorCode: row.indicatorCode,
    dataSource: row.dataSource,
    dataTable: row.dataTable,
    fieldNames: [...row.fieldNames],
    aggregateMethod: row.aggregateMethod,
    filterCondition: row.filterCondition,
    updateStrategy: row.updateStrategy,
    enabled: row.enabled
  })
  dialogVisible.value = true
}

// 删除映射
const handleDelete = async (row: DataSourceMapping) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除指标"${row.indicatorName}"的映射关系吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    loading.value = true
    // 模拟异步删除
    await new Promise((resolve) => setTimeout(resolve, 500))

    const index = tableData.value.findIndex((item) => item.id === row.id)
    if (index > -1) {
      tableData.value.splice(index, 1)
    }

    ElMessage.success('删除成功')
    loading.value = false
  } catch {
    // 取消删除
  }
}

// 测试连接
const handleTestConnection = async (row: DataSourceMapping) => {
  loading.value = true
  ElMessage.info('正在测试数据源连接...')

  // 模拟异步测试
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // 随机成功或失败（演示用）
  const success = Math.random() > 0.2

  loading.value = false

  if (success) {
    ElMessage.success(`数据源"${row.dataSource}"连接成功！`)
  } else {
    ElMessage.error(`数据源"${row.dataSource}"连接失败，请检查配置！`)
  }
}

// 预览数据
const handlePreview = async (row: DataSourceMapping) => {
  previewDialogVisible.value = true
  previewLoading.value = true

  // 模拟异步加载预览数据
  await new Promise((resolve) => setTimeout(resolve, 800))

  // Mock 预览数据
  const mockColumns = row.fieldNames
  const mockRows = Array.from({ length: 5 }, (_, index) => {
    const rowData: Record<string, any> = { _index: index + 1 }
    row.fieldNames.forEach((field) => {
      if (field.includes('id')) {
        rowData[field] = Math.floor(Math.random() * 10000)
      } else if (field.includes('amount') || field.includes('price')) {
        rowData[field] = (Math.random() * 1000).toFixed(2)
      } else if (field.includes('time') || field.includes('date')) {
        rowData[field] = new Date(Date.now() - Math.random() * 86400000 * 30)
          .toISOString()
          .split('T')[0]
      } else if (field.includes('status')) {
        rowData[field] = ['active', 'completed', 'pending'][
          Math.floor(Math.random() * 3)
        ]
      } else {
        rowData[field] = `${field}_value_${index + 1}`
      }
    })
    return rowData
  })

  previewData.value = {
    columns: mockColumns,
    rows: mockRows
  }

  previewLoading.value = false
}

// 指标选择变化
const handleIndicatorChange = (value: string) => {
  const indicator = indicatorOptions.find((item) => item.name === value)
  if (indicator) {
    formData.indicatorCode = indicator.code
  }
}

// 数据源变化时清空数据表和字段
const handleDataSourceChange = () => {
  formData.dataTable = ''
  formData.fieldNames = []
}

// 数据表变化时清空字段
const handleDataTableChange = () => {
  formData.fieldNames = []
}

// 保存表单
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true

    // 模拟异步保存
    await new Promise((resolve) => setTimeout(resolve, 800))

    if (formData.id) {
      // 编辑
      const index = tableData.value.findIndex((item) => item.id === formData.id)
      if (index > -1) {
        tableData.value[index] = {
          ...tableData.value[index],
          indicatorName: formData.indicatorName,
          indicatorCode: formData.indicatorCode,
          dataSource: formData.dataSource,
          dataTable: formData.dataTable,
          fieldNames: [...formData.fieldNames],
          aggregateMethod: formData.aggregateMethod,
          filterCondition: formData.filterCondition,
          updateStrategy: formData.updateStrategy,
          enabled: formData.enabled,
          updateTime: new Date().toLocaleString('zh-CN')
        }
      }
      ElMessage.success('编辑成功')
    } else {
      // 新增
      const newMapping: DataSourceMapping = {
        id: Date.now(),
        indicatorName: formData.indicatorName,
        indicatorCode: formData.indicatorCode,
        dataSource: formData.dataSource,
        dataTable: formData.dataTable,
        fieldNames: [...formData.fieldNames],
        aggregateMethod: formData.aggregateMethod,
        filterCondition: formData.filterCondition,
        updateStrategy: formData.updateStrategy,
        enabled: formData.enabled,
        updateTime: new Date().toLocaleString('zh-CN')
      }
      tableData.value.unshift(newMapping)
      ElMessage.success('新增成功')
    }

    loading.value = false
    dialogVisible.value = false
  })
}

// 重置表单
const resetForm = () => {
  formData.id = undefined
  formData.indicatorName = ''
  formData.indicatorCode = ''
  formData.dataSource = ''
  formData.dataTable = ''
  formData.fieldNames = []
  formData.aggregateMethod = ''
  formData.filterCondition = ''
  formData.updateStrategy = ''
  formData.enabled = true
  formRef.value?.clearValidate()
}

// 取消对话框
const handleCancel = () => {
  dialogVisible.value = false
  resetForm()
}

// 分页变化
const handlePageChange = (page: number) => {
  pagination.currentPage = page
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.currentPage = 1
}

// ==================== 生命周期 ====================
onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="data-source-mapping">
    <!-- 搜索区域 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键字">
          <el-input
            v-model="searchForm.keyword"
            placeholder="指标名称/编码/数据源/数据表/字段"
            clearable
            style="width: 280px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="数据源">
          <el-select
            v-model="searchForm.dataSource"
            placeholder="请选择数据源"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="item in dataSourceOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="启用" value="enabled" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作栏 -->
    <el-card class="action-card !gap-2" shadow="never">
      <el-button type="primary" @click="handleAdd">新增映射</el-button>
      <div class="tips">
        <el-tag type="info">提示：数据来源映射确保指标数据可追溯、可验证</el-tag>
      </div>
    </el-card>

    <!-- 表格区域 -->
    <el-card class="table-card" shadow="never">
      <el-table
        :data="filteredTableData"
        v-loading="loading"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="indicatorName" label="指标名称" min-width="120">
          <template #default="{ row }">
            <div>
              <div class="indicator-name">{{ row.indicatorName }}</div>
              <div class="indicator-code">{{ row.indicatorCode }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="dataSource" label="数据源" width="120" align="center">
          <template #default="{ row }">
            <el-tag
              :type="
                row.dataSource === 'MySQL'
                  ? 'primary'
                  : row.dataSource === 'PostgreSQL'
                  ? 'success'
                  : row.dataSource === 'Hive'
                  ? 'warning'
                  : 'info'
              "
            >
              {{ row.dataSource }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dataTable" label="数据表" width="150" />
        <el-table-column prop="fieldNames" label="字段名称" min-width="180">
          <template #default="{ row }">
            <el-tag
              v-for="field in row.fieldNames"
              :key="field"
              size="small"
              style="margin: 2px"
            >
              {{ field }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="aggregateMethod"
          label="聚合方式"
          width="100"
          align="center"
        />
        <el-table-column prop="filterCondition" label="过滤条件" min-width="160">
          <template #default="{ row }">
            <el-tooltip
              v-if="row.filterCondition"
              :content="row.filterCondition"
              placement="top"
            >
              <span class="filter-condition">{{ row.filterCondition }}</span>
            </el-tooltip>
            <span v-else class="empty-text">-</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="updateStrategy"
          label="更新策略"
          width="120"
          align="center"
        >
          <template #default="{ row }">
            <el-tag
              :type="row.updateStrategy === '实时更新' ? 'danger' : 'info'"
              size="small"
            >
              {{ row.updateStrategy }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="enabled" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'">
              {{ row.enabled ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="updateTime"
          label="更新时间"
          width="160"
          align="center"
        />
        <el-table-column label="操作" width="280" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button
              type="success"
              link
              size="small"
              @click="handleTestConnection(row)"
            >
              测试连接
            </el-button>
            <el-button type="info" link size="small" @click="handlePreview(row)">
              预览数据
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      :close-on-click-modal="false"
      @close="handleCancel"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="指标名称" prop="indicatorName">
              <el-select
                v-model="formData.indicatorName"
                placeholder="请选择指标"
                style="width: 100%"
                @change="handleIndicatorChange"
              >
                <el-option
                  v-for="item in indicatorOptions"
                  :key="item.code"
                  :label="item.name"
                  :value="item.name"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="指标编码">
              <el-input v-model="formData.indicatorCode" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="数据源" prop="dataSource">
              <el-select
                v-model="formData.dataSource"
                placeholder="请选择数据源"
                style="width: 100%"
                @change="handleDataSourceChange"
              >
                <el-option
                  v-for="item in dataSourceOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="数据表" prop="dataTable">
              <el-select
                v-model="formData.dataTable"
                placeholder="请选择数据表"
                style="width: 100%"
                :disabled="!formData.dataSource"
                @change="handleDataTableChange"
              >
                <el-option
                  v-for="table in dataTableOptions"
                  :key="table"
                  :label="table"
                  :value="table"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="字段名称" prop="fieldNames">
              <el-select
                v-model="formData.fieldNames"
                placeholder="请选择字段（可多选）"
                multiple
                style="width: 100%"
                :disabled="!formData.dataTable"
              >
                <el-option
                  v-for="field in fieldNameOptions"
                  :key="field"
                  :label="field"
                  :value="field"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="聚合方式" prop="aggregateMethod">
              <el-select
                v-model="formData.aggregateMethod"
                placeholder="请选择聚合方式"
                style="width: 100%"
              >
                <el-option
                  v-for="item in aggregateOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="更新策略" prop="updateStrategy">
              <el-select
                v-model="formData.updateStrategy"
                placeholder="请选择更新策略"
                style="width: 100%"
              >
                <el-option
                  v-for="item in updateStrategyOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="过滤条件">
              <el-input
                v-model="formData.filterCondition"
                type="textarea"
                :rows="3"
                placeholder="请输入SQL WHERE条件表达式，例如：status = 'active' AND date >= '2025-01-01'"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="是否启用">
              <el-switch v-model="formData.enabled" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 预览数据对话框 -->
    <el-dialog
      v-model="previewDialogVisible"
      title="数据预览"
      width="800px"
      :close-on-click-modal="false"
    >
      <div v-loading="previewLoading">
        <el-alert
          title="以下为数据样例，仅供参考"
          type="info"
          :closable="false"
          style="margin-bottom: 15px"
        />
        <el-table
          :data="previewData.rows"
          border
          stripe
          max-height="400"
          style="width: 100%"
        >
          <el-table-column
            prop="_index"
            label="#"
            width="60"
            align="center"
            fixed
          />
          <el-table-column
            v-for="column in previewData.columns"
            :key="column"
            :prop="column"
            :label="column"
            min-width="150"
          >
            <template #default="{ row }">
              {{ row[column] }}
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <el-button type="primary" @click="previewDialogVisible = false">
          关闭
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.data-source-mapping {
  .search-card,
  .action-card,
  .table-card {
    margin-bottom: 20px;
  }

  .action-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    .tips {
      flex: 1;
      text-align: right;
    }
    :deep() {
      .el-card__body {
        display: flex;
        align-items: baseline;
        gap: 10px;
      }
    }
  }

  .indicator-name {
    font-weight: 500;
    color: #303133;
  }

  .indicator-code {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }

  .filter-condition {
    display: inline-block;
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: help;
  }

  .empty-text {
    color: #c0c4cc;
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}

</style>
