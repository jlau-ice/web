<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// 定义数据标准接口
interface DataStandardItem {
  id: number
  standardName: string
  standardCode: string
  category: string
  applicableObject: string
  status: string
  isEnabled: boolean
  description: string
  ruleContent: string
  createTime: string
  updateTime: string
}

// 定义表单数据接口
interface DataStandardForm {
  id?: number
  standardName: string
  standardCode: string
  category: string
  applicableObject: string
  status: string
  isEnabled: boolean
  description: string
  ruleContent: string
}

// 搜索表单
const searchForm = reactive({
  keyword: '',
  category: '',
  status: ''
})

// 分页数据
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 表格数据
const tableData = ref<DataStandardItem[]>([])
const loading = ref(false)

// 弹窗控制
const dialogVisible = ref(false)
const dialogTitle = ref('新增数据标准')
const formRef = ref<FormInstance>()

// 表单数据
const formData = reactive<DataStandardForm>({
  standardName: '',
  standardCode: '',
  category: '',
  applicableObject: '',
  status: '草稿',
  isEnabled: true,
  description: '',
  ruleContent: ''
})

// Mock 数据源 - 农业数据标准
const mockData: DataStandardItem[] = [
  {
    id: 1,
    standardName: '农产品编码规范',
    standardCode: 'STD-AGR-001',
    category: '编码标准',
    applicableObject: '农产品信息',
    status: '已发布',
    isEnabled: true,
    description: '定义农产品的统一编码规则，确保产品标识的唯一性和可追溯性',
    ruleContent: '编码格式：AGR-类别码(2位)-产地码(2位)-流水号(6位)，如：AGR-01-01-000001',
    createTime: '2024-01-10 09:30:00',
    updateTime: '2024-03-15 14:20:00'
  },
  {
    id: 2,
    standardName: '土地面积计量单位标准',
    standardCode: 'STD-AGR-002',
    category: '度量标准',
    applicableObject: '土地管理',
    status: '已发布',
    isEnabled: true,
    description: '规定土地面积的统一计量单位和换算关系',
    ruleContent: '统一使用"亩"作为基本单位，1亩=666.67平方米，精度保留2位小数',
    createTime: '2024-01-15 10:00:00',
    updateTime: '2024-03-20 11:30:00'
  },
  {
    id: 3,
    standardName: '种植日期格式规范',
    standardCode: 'STD-AGR-003',
    category: '格式标准',
    applicableObject: '种植记录',
    status: '已发布',
    isEnabled: true,
    description: '定义种植、施肥、收获等日期的统一格式',
    ruleContent: '日期格式：YYYY-MM-DD HH:mm:ss，时区：UTC+8（北京时间）',
    createTime: '2024-02-01 15:45:00',
    updateTime: '2024-02-01 15:45:00'
  },
  {
    id: 4,
    standardName: '农药使用安全标准',
    standardCode: 'STD-AGR-004',
    category: '质量标准',
    applicableObject: '农药管理',
    status: '已发布',
    isEnabled: true,
    description: '规定农药使用的安全剂量和间隔期要求',
    ruleContent: '农药残留量≤国家标准GB 2763，安全间隔期不少于标注天数',
    createTime: '2024-02-10 11:20:00',
    updateTime: '2024-03-10 16:40:00'
  },
  {
    id: 5,
    standardName: '有机认证标准',
    standardCode: 'STD-AGR-005',
    category: '质量标准',
    applicableObject: '有机农产品',
    status: '已发布',
    isEnabled: true,
    description: '定义有机农产品的认证标准和流程',
    ruleContent: '符合GB/T 19630有机产品标准，3年转换期，年检合格率100%',
    createTime: '2024-02-15 14:15:00',
    updateTime: '2024-03-12 09:25:00'
  },
  {
    id: 6,
    standardName: '农产品质量等级标准',
    standardCode: 'STD-AGR-006',
    category: '质量标准',
    applicableObject: '农产品分级',
    status: '审核中',
    isEnabled: false,
    description: '定义农产品的质量等级划分标准（特级、一级、二级、三级）',
    ruleContent: '按照外观、大小、重量、糖度、水分等指标综合评定，待细化',
    createTime: '2024-03-01 10:30:00',
    updateTime: '2024-03-15 17:00:00'
  },
  {
    id: 7,
    standardName: '农机设备编码标准',
    standardCode: 'STD-AGR-007',
    category: '编码标准',
    applicableObject: '农机管理',
    status: '已发布',
    isEnabled: true,
    description: '定义农业机械设备的统一编码规则',
    ruleContent: '编码格式：MACH-类型码(3位)-品牌码(2位)-型号(4位)-序列号(5位)',
    createTime: '2024-02-20 09:00:00',
    updateTime: '2024-03-18 13:50:00'
  },
  {
    id: 8,
    standardName: '农产品冷链温度标准',
    standardCode: 'STD-AGR-008',
    category: '度量标准',
    applicableObject: '冷链物流',
    status: '已发布',
    isEnabled: true,
    description: '规定不同农产品在冷链运输中的温度要求',
    ruleContent: '叶菜类：0-4℃，水果类：2-8℃，肉类：-18℃以下，温度波动≤±2℃',
    createTime: '2024-02-25 14:30:00',
    updateTime: '2024-03-22 10:15:00'
  },
  {
    id: 9,
    standardName: '种子质量检测标准',
    standardCode: 'STD-AGR-009',
    category: '质量标准',
    applicableObject: '种子管理',
    status: '草稿',
    isEnabled: false,
    description: '定义种子发芽率、纯度、水分等质量指标',
    ruleContent: '发芽率≥85%，纯度≥98%，水分含量≤13%，需完善检测方法',
    createTime: '2024-03-05 16:20:00',
    updateTime: '2024-03-25 11:20:00'
  },
  {
    id: 10,
    standardName: '农业气象数据采集标准',
    standardCode: 'STD-AGR-010',
    category: '格式标准',
    applicableObject: '气象数据',
    status: '已发布',
    isEnabled: true,
    description: '规定气温、湿度、降雨量等气象数据的采集和存储规范',
    ruleContent: '采集频率：每小时一次，温度精度：0.1℃，湿度精度：1%RH',
    createTime: '2024-03-08 08:00:00',
    updateTime: '2024-03-08 08:00:00'
  },
  {
    id: 11,
    standardName: '农产品溯源信息标准',
    standardCode: 'STD-AGR-011',
    category: '编码标准',
    applicableObject: '溯源系统',
    status: '已发布',
    isEnabled: true,
    description: '定义农产品从种植到销售全流程的溯源信息标准',
    ruleContent: '包含种植地、种植人、种植时间、投入品记录、检测报告、流通记录等',
    createTime: '2024-03-10 10:00:00',
    updateTime: '2024-03-28 11:30:00'
  },
  {
    id: 12,
    standardName: '化肥施用量标准',
    standardCode: 'STD-AGR-012',
    category: '度量标准',
    applicableObject: '施肥管理',
    status: '审核中',
    isEnabled: true,
    description: '规定不同作物的化肥推荐施用量和施用方法',
    ruleContent: '按作物类型、土壤条件制定，氮磷钾比例因地制宜，待专家评审',
    createTime: '2024-03-15 15:45:00',
    updateTime: '2024-03-29 16:20:00'
  }
]

// 分类选项
const categoryOptions = [
  { label: '编码标准', value: '编码标准' },
  { label: '格式标准', value: '格式标准' },
  { label: '度量标准', value: '度量标准' },
  { label: '质量标准', value: '质量标准' },
  { label: '命名标准', value: '命名标准' }
]

// 状态选项
const statusOptions = [
  { label: '全部', value: '' },
  { label: '草稿', value: '草稿' },
  { label: '审核中', value: '审核中' },
  { label: '已发布', value: '已发布' },
  { label: '已废止', value: '已废止' }
]

// 适用对象选项
const applicableObjectOptions = [
  '农产品信息',
  '土地管理',
  '种植记录',
  '农药管理',
  '有机农产品',
  '农产品分级',
  '农机管理',
  '冷链物流',
  '种子管理',
  '气象数据',
  '溯源系统',
  '施肥管理'
]

// 状态颜色映射
const statusColorMap: Record<string, string> = {
  '草稿': 'info',
  '审核中': 'warning',
  '已发布': 'success',
  '已废止': 'danger'
}

// 表单验证规则
const rules: FormRules = {
  standardName: [
    { required: true, message: '请输入标准名称', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  standardCode: [
    { required: true, message: '请输入标准编码', trigger: 'blur' },
    { 
      pattern: /^STD-[A-Z]+-\d{3}$/, 
      message: '格式：STD-类型-编号（如：STD-AGR-001）', 
      trigger: 'blur' 
    },
    {
      validator: (rule, value, callback) => {
        // 唯一性校验
        const exists = mockData.some(item => 
          item.standardCode === value && item.id !== formData.id
        )
        if (exists) {
          callback(new Error('该标准编码已存在，请使用其他编码'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  category: [
    { required: true, message: '请选择所属分类', trigger: 'change' }
  ],
  applicableObject: [
    { required: true, message: '请选择适用对象', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ],
  ruleContent: [
    { required: true, message: '请输入规则内容', trigger: 'blur' }
  ]
}

// 计算过滤后的数据
const filteredData = computed(() => {
  let data = [...mockData]

  // 关键字搜索
  if (searchForm.keyword) {
    const keyword = searchForm.keyword.toLowerCase()
    data = data.filter(item => 
      item.standardName.toLowerCase().includes(keyword) ||
      item.standardCode.toLowerCase().includes(keyword) ||
      item.description.toLowerCase().includes(keyword) ||
      item.applicableObject.toLowerCase().includes(keyword)
    )
  }

  // 分类筛选
  if (searchForm.category) {
    data = data.filter(item => item.category === searchForm.category)
  }

  // 状态筛选
  if (searchForm.status) {
    data = data.filter(item => item.status === searchForm.status)
  }

  return data
})

// 模拟加载数据
const loadData = () => {
  loading.value = true
  
  setTimeout(() => {
    const start = (pagination.currentPage - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    tableData.value = filteredData.value.slice(start, end)
    pagination.total = filteredData.value.length
    loading.value = false
  }, 300)
}

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1
  loadData()
}

// 重置搜索
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.category = ''
  searchForm.status = ''
  pagination.currentPage = 1
  loadData()
}

// 页码改变
const handleCurrentChange = (page: number) => {
  pagination.currentPage = page
  loadData()
}

// 每页条数改变
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.currentPage = 1
  loadData()
}

// 打开新增弹窗
const handleAdd = () => {
  dialogTitle.value = '新增数据标准'
  resetForm()
  dialogVisible.value = true
}

// 打开编辑弹窗
const handleEdit = (row: DataStandardItem) => {
  dialogTitle.value = '编辑数据标准'
  Object.assign(formData, {
    id: row.id,
    standardName: row.standardName,
    standardCode: row.standardCode,
    category: row.category,
    applicableObject: row.applicableObject,
    status: row.status,
    isEnabled: row.isEnabled,
    description: row.description,
    ruleContent: row.ruleContent
  })
  dialogVisible.value = true
}

// 查看详情
const handleView = (row: DataStandardItem) => {
  ElMessageBox.alert(
    `
    <div style="line-height: 2;">
      <p><strong>标准名称：</strong>${row.standardName}</p>
      <p><strong>标准编码：</strong>${row.standardCode}</p>
      <p><strong>所属分类：</strong>${row.category}</p>
      <p><strong>适用对象：</strong>${row.applicableObject}</p>
      <p><strong>状态：</strong>${row.status}</p>
      <p><strong>启用状态：</strong>${row.isEnabled ? '已启用' : '已禁用'}</p>
      <p><strong>标准描述：</strong>${row.description}</p>
      <p style="margin-top: 15px;"><strong>规则内容：</strong></p>
      <p style="padding: 10px; background: #f5f7fa; border-radius: 4px; line-height: 1.6;">${row.ruleContent}</p>
      <p style="margin-top: 10px;"><strong>创建时间：</strong>${row.createTime}</p>
      <p><strong>更新时间：</strong>${row.updateTime}</p>
    </div>
    `,
    '数据标准详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '关闭',
      customClass: 'detail-message-box'
    }
  )
}

// 删除
const handleDelete = (row: DataStandardItem) => {
  ElMessageBox.confirm(
    `确定要删除数据标准 "${row.standardName}" (${row.standardCode}) 吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 模拟删除操作
    setTimeout(() => {
      const index = mockData.findIndex(item => item.id === row.id)
      if (index > -1) {
        mockData.splice(index, 1)
      }
      ElMessage.success('删除成功')
      loadData()
    }, 300)
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      
      // 模拟提交操作
      setTimeout(() => {
        const currentTime = new Date().toLocaleString('zh-CN', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).replace(/\//g, '-')

        if (formData.id) {
          // 编辑
          const index = mockData.findIndex(item => item.id === formData.id)
          if (index > -1) {
            mockData[index] = {
              ...mockData[index],
              standardName: formData.standardName,
              standardCode: formData.standardCode,
              category: formData.category,
              applicableObject: formData.applicableObject,
              status: formData.status,
              isEnabled: formData.isEnabled,
              description: formData.description,
              ruleContent: formData.ruleContent,
              updateTime: currentTime
            }
          }
          ElMessage.success('编辑成功')
        } else {
          // 新增
          const newItem: DataStandardItem = {
            id: Math.max(...mockData.map(item => item.id)) + 1,
            standardName: formData.standardName,
            standardCode: formData.standardCode,
            category: formData.category,
            applicableObject: formData.applicableObject,
            status: formData.status,
            isEnabled: formData.isEnabled,
            description: formData.description,
            ruleContent: formData.ruleContent,
            createTime: currentTime,
            updateTime: currentTime
          }
          mockData.unshift(newItem)
          ElMessage.success('新增成功')
        }
        
        loading.value = false
        dialogVisible.value = false
        loadData()
      }, 500)
    }
  })
}

// 重置表单
const resetForm = () => {
  formData.id = undefined
  formData.standardName = ''
  formData.standardCode = ''
  formData.category = ''
  formData.applicableObject = ''
  formData.status = '草稿'
  formData.isEnabled = true
  formData.description = ''
  formData.ruleContent = ''
  formRef.value?.clearValidate()
}

// 关闭弹窗
const handleClose = () => {
  dialogVisible.value = false
  resetForm()
}

// 生成标准编码建议
const generateStandardCode = () => {
  if (!formData.category) {
    ElMessage.warning('请先选择所属分类')
    return
  }

  // 根据分类生成前缀
  const prefixMap: Record<string, string> = {
    '编码标准': 'COD',
    '格式标准': 'FMT',
    '度量标准': 'MSR',
    '质量标准': 'QUA',
    '命名标准': 'NAM'
  }

  const typePrefix = prefixMap[formData.category] || 'STD'
  
  // 获取同分类的最大编号
  const sameCategoryItems = mockData.filter(item => item.category === formData.category)
  const maxNum = sameCategoryItems.reduce((max, item) => {
    const match = item.standardCode.match(/\d+$/)
    if (match) {
      const num = parseInt(match[0])
      return num > max ? num : max
    }
    return max
  }, 0)

  const newNum = String(maxNum + 1).padStart(3, '0')
  formData.standardCode = `STD-${typePrefix}-${newNum}`
  
  ElMessage.success('标准编码已生成')
}

// 快速启用/禁用
const handleToggleStatus = (row: DataStandardItem) => {
  ElMessageBox.confirm(
    `确定要${row.isEnabled ? '禁用' : '启用'}数据标准 "${row.standardName}" 吗？`,
    '状态变更确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    setTimeout(() => {
      const index = mockData.findIndex(item => item.id === row.id)
      if (index > -1) {
        mockData[index].isEnabled = !mockData[index].isEnabled
        mockData[index].updateTime = new Date().toLocaleString('zh-CN', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).replace(/\//g, '-')
      }
      ElMessage.success(`${row.isEnabled ? '禁用' : '启用'}成功`)
      loadData()
    }, 300)
  }).catch(() => {
    ElMessage.info('已取消操作')
  })
}

// 初始化加载数据
onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="data-standard-manage-container">
    <!-- 页面标题 -->
    <el-card class="header-card" shadow="never">
      <div class="page-header">
        <div class="header-content">
          <h2 class="page-title">数据标准管理</h2>
          <p class="page-description">定义、发布和执行数据的统一规范，从源头确保数据的一致性和可比性</p>
        </div>
      </div>
    </el-card>

    <!-- 搜索筛选区域 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" label-width="80px">
        <el-row :gutter="20">
          <el-col :span="5">
            <el-form-item label="关键字">
              <el-input
                v-model="searchForm.keyword"
                placeholder="名称/编码/描述/对象"
                clearable
                @keyup.enter="handleSearch"
              />
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="所属分类">
              <el-select
                v-model="searchForm.category"
                placeholder="请选择分类"
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="cat in categoryOptions"
                  :key="cat.value"
                  :label="cat.label"
                  :value="cat.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="状态">
              <el-select
                v-model="searchForm.status"
                placeholder="请选择状态"
                style="width: 100%"
              >
                <el-option
                  v-for="status in statusOptions"
                  :key="status.value"
                  :label="status.label"
                  :value="status.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4" class="search-actions">
            <el-button type="primary" @click="handleSearch">
              <el-icon class="btn-icon"><Search /></el-icon>
              搜索
            </el-button>
            <el-button @click="handleReset">
              <el-icon class="btn-icon"><Refresh /></el-icon>
              重置
            </el-button>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 操作按钮区域 -->
    <el-card class="toolbar-card" shadow="never">
      <div class="toolbar">
        <el-button type="primary" @click="handleAdd">
          <el-icon class="btn-icon"><Plus /></el-icon>
          新增标准
        </el-button>
        <div class="toolbar-info">
          共 <span class="info-number">{{ pagination.total }}</span> 条数据
        </div>
      </div>
    </el-card>

    <!-- 数据表格区域 -->
    <el-card class="table-card" shadow="never">
      <el-table
        :data="tableData"
        :loading="loading"
        stripe
        border
        style="width: 100%"
        height="calc(100vh - 500px)"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="standardName" label="标准名称" width="200" show-overflow-tooltip />
        <el-table-column prop="standardCode" label="标准编码" width="140" show-overflow-tooltip />
        <el-table-column label="所属分类" width="110" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="primary">{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="applicableObject" label="适用对象" width="120" show-overflow-tooltip />
        <el-table-column prop="description" label="标准描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusColorMap[row.status]" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="启用状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="row.isEnabled"
              @click="handleToggleStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" show-overflow-tooltip />
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row)">
              查看
            </el-button>
            <el-button link type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      :close-on-click-modal="false"
      @close="handleClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="标准名称" prop="standardName">
              <el-input
                v-model="formData.standardName"
                placeholder="请输入标准名称"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属分类" prop="category">
              <el-select
                v-model="formData.category"
                placeholder="请选择分类"
                style="width: 100%"
              >
                <el-option
                  v-for="cat in categoryOptions"
                  :key="cat.value"
                  :label="cat.label"
                  :value="cat.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="标准编码" prop="standardCode">
          <el-input
            v-model="formData.standardCode"
            placeholder="格式：STD-AGR-001"
            clearable
          >
            <template #append>
              <el-button @click="generateStandardCode">
                <el-icon><MagicStick /></el-icon>
                自动生成
              </el-button>
            </template>
          </el-input>
          <div class="form-tip">
            <el-icon><InfoFilled /></el-icon>
            格式说明：STD-类型代码-编号（如：STD-AGR-001）
          </div>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="适用对象" prop="applicableObject">
              <el-select
                v-model="formData.applicableObject"
                placeholder="请选择适用对象"
                clearable
                filterable
                allow-create
                style="width: 100%"
              >
                <el-option
                  v-for="obj in applicableObjectOptions"
                  :key="obj"
                  :label="obj"
                  :value="obj"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select
                v-model="formData.status"
                placeholder="请选择状态"
                style="width: 100%"
              >
                <el-option label="草稿" value="草稿" />
                <el-option label="审核中" value="审核中" />
                <el-option label="已发布" value="已发布" />
                <el-option label="已废止" value="已废止" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="标准描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="2"
            placeholder="请输入标准描述"
            clearable
          />
        </el-form-item>

        <el-form-item label="规则内容" prop="ruleContent">
          <el-input
            v-model="formData.ruleContent"
            type="textarea"
            :rows="4"
            placeholder="请输入详细的规则内容，包括格式、要求、示例等"
            clearable
          />
        </el-form-item>

        <el-form-item label="是否启用">
          <el-switch v-model="formData.isEnabled" />
          <span style="margin-left: 10px; color: #909399; font-size: 12px">
            {{ formData.isEnabled ? '已启用' : '已禁用' }}
          </span>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleClose">取消</el-button>
          <el-button type="primary" :loading="loading" @click="handleSubmit">
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.data-standard-manage-container {
  min-height: calc(100vh - 60px);

  .header-card {
    margin-bottom: 20px;

    .page-header {
      .header-content {
        .page-title {
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 600;
          color: #303133;
        }

        .page-description {
          margin: 0;
          font-size: 14px;
          color: #909399;
        }
      }
    }
  }

  .search-card {
    margin-bottom: 20px;

    :deep(.el-card__body) {
      padding: 20px 20px 0 20px;
    }

    .search-actions {
      text-align: right;
      margin-bottom: 20px;

      .el-button {
        margin-left: 10px;
      }
    }
  }

  .toolbar-card {
    margin-bottom: 20px;

    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .toolbar-info {
        font-size: 14px;
        color: #606266;

        .info-number {
          color: #409eff;
          font-weight: 600;
          margin: 0 2px;
        }
      }
    }
  }

  .table-card {
    .pagination-container {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
    }
  }

  .btn-icon {
    margin-right: 4px;
  }

  :deep(.el-table) {
    .el-table__header {
      th {
        background-color: #f5f7fa;
        color: #606266;
        font-weight: 600;
      }
    }
  }

  :deep(.el-form-item) {
    margin-bottom: 18px;
  }

  .form-tip {
    display: flex;
    align-items: center;
    margin-top: 5px;
    font-size: 12px;
    color: #909399;

    .el-icon {
      margin-right: 4px;
      font-size: 14px;
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
}

// 详情弹窗样式
:deep(.detail-message-box) {
  width: 600px;
  max-width: 90%;
  
  .el-message-box__message {
    p {
      margin: 8px 0;
      
      strong {
        color: #606266;
        display: inline-block;
        min-width: 90px;
      }
    }
  }
}
</style>