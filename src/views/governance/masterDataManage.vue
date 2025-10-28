<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// 定义主数据接口
interface MasterDataItem {
  id: number
  entityType: string
  entityName: string
  uniqueId: string
  category: string
  businessTag: string[]
  status: string
  isEnabled: boolean
  description: string
  createTime: string
  updateTime: string
}

// 定义表单数据接口
interface MasterDataForm {
  id?: number
  entityType: string
  entityName: string
  uniqueId: string
  category: string
  businessTag: string[]
  status: string
  isEnabled: boolean
  description: string
}

// 搜索表单
const searchForm = reactive({
  keyword: '',
  entityType: '',
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
const tableData = ref<MasterDataItem[]>([])
const loading = ref(false)

// 弹窗控制
const dialogVisible = ref(false)
const dialogTitle = ref('新增主数据')
const formRef = ref<FormInstance>()

// 表单数据
const formData = reactive<MasterDataForm>({
  entityType: '',
  entityName: '',
  uniqueId: '',
  category: '',
  businessTag: [],
  status: '正常',
  isEnabled: true,
  description: ''
})

// Mock 数据源 - 农业相关
const mockData: MasterDataItem[] = [
  {
    id: 1,
    entityType: '客户',
    entityName: '绿源农业合作社',
    uniqueId: 'CUST-2024-001',
    category: '企业客户',
    businessTag: ['核心客户', 'VIP'],
    status: '正常',
    isEnabled: true,
    description: '专业从事绿色有机农产品种植和销售的农业合作社',
    createTime: '2024-01-10 09:30:00',
    updateTime: '2024-03-15 14:20:00'
  },
  {
    id: 2,
    entityType: '客户',
    entityName: '金穗农业科技有限公司',
    uniqueId: 'CUST-2024-002',
    category: '企业客户',
    businessTag: ['核心客户', '互联网'],
    status: '正常',
    isEnabled: true,
    description: '专注于智慧农业技术研发与推广的现代农业企业',
    createTime: '2024-01-15 10:00:00',
    updateTime: '2024-03-20 11:30:00'
  },
  {
    id: 3,
    entityType: '客户',
    entityName: '李明（种植户）',
    uniqueId: 'CUST-2024-003',
    category: '个人客户',
    businessTag: ['普通客户'],
    status: '正常',
    isEnabled: true,
    description: '长期合作的水稻种植户，种植面积200亩',
    createTime: '2024-02-01 15:45:00',
    updateTime: '2024-02-01 15:45:00'
  },
  {
    id: 4,
    entityType: '产品',
    entityName: '有机水稻种子（隆平1号）',
    uniqueId: 'PROD-2024-001',
    category: '日用品',
    businessTag: ['热销产品', '高端'],
    status: '正常',
    isEnabled: true,
    description: '高产优质杂交水稻种子，适合南方地区种植',
    createTime: '2024-01-20 11:20:00',
    updateTime: '2024-03-10 16:40:00'
  },
  {
    id: 5,
    entityType: '产品',
    entityName: '生物有机肥料',
    uniqueId: 'PROD-2024-002',
    category: '日用品',
    businessTag: ['热销产品', '国产'],
    status: '正常',
    isEnabled: true,
    description: '采用微生物发酵技术，富含有益菌群的有机肥料',
    createTime: '2024-02-05 14:15:00',
    updateTime: '2024-03-12 09:25:00'
  },
  {
    id: 6,
    entityType: '产品',
    entityName: '智能灌溉设备',
    uniqueId: 'PROD-2024-003',
    category: '电子产品',
    businessTag: ['办公设备'],
    status: '停用',
    isEnabled: false,
    description: '第一代智能灌溉设备，已升级换代停产',
    createTime: '2024-01-05 10:30:00',
    updateTime: '2024-02-28 17:00:00'
  },
  {
    id: 7,
    entityType: '供应商',
    entityName: '先正达种业集团',
    uniqueId: 'SUPP-2024-001',
    category: '原材料供应商',
    businessTag: ['战略供应商', '一级'],
    status: '正常',
    isEnabled: true,
    description: '全球领先的农业科技公司，提供优质种子和植保产品',
    createTime: '2024-01-08 09:00:00',
    updateTime: '2024-03-18 13:50:00'
  },
  {
    id: 8,
    entityType: '供应商',
    entityName: '约翰迪尔农机',
    uniqueId: 'SUPP-2024-002',
    category: '制造商',
    businessTag: ['核心供应商', '物流'],
    status: '正常',
    isEnabled: true,
    description: '世界知名农业机械制造商，提供拖拉机、收割机等设备',
    createTime: '2024-01-12 14:30:00',
    updateTime: '2024-03-22 10:15:00'
  },
  {
    id: 9,
    entityType: '供应商',
    entityName: '中农冷链物流',
    uniqueId: 'SUPP-2024-003',
    category: '物流服务商',
    businessTag: ['普通供应商', '物流'],
    status: '待审核',
    isEnabled: false,
    description: '专业从事农产品冷链运输和仓储服务',
    createTime: '2024-03-01 16:20:00',
    updateTime: '2024-03-01 16:20:00'
  },
  {
    id: 10,
    entityType: '组织',
    entityName: '农业技术推广中心',
    uniqueId: 'ORG-2024-001',
    category: '技术部门',
    businessTag: ['核心部门'],
    status: '正常',
    isEnabled: true,
    description: '负责新品种、新技术的试验示范和推广工作',
    createTime: '2024-01-01 08:00:00',
    updateTime: '2024-01-01 08:00:00'
  },
  {
    id: 11,
    entityType: '组织',
    entityName: '农产品销售部',
    uniqueId: 'ORG-2024-002',
    category: '业务部门',
    businessTag: ['核心部门'],
    status: '正常',
    isEnabled: true,
    description: '负责农产品市场开拓和销售渠道建设',
    createTime: '2024-01-01 08:00:00',
    updateTime: '2024-02-15 11:30:00'
  },
  {
    id: 12,
    entityType: '组织',
    entityName: '农资采购部',
    uniqueId: 'ORG-2024-003',
    category: '职能部门',
    businessTag: ['支持部门'],
    status: '正常',
    isEnabled: true,
    description: '负责种子、化肥、农药等农业生产资料的采购管理',
    createTime: '2024-01-01 08:00:00',
    updateTime: '2024-03-05 15:45:00'
  }
]

// 实体类型选项
const entityTypeOptions = [
  { label: '客户', value: '客户' },
  { label: '产品', value: '产品' },
  { label: '供应商', value: '供应商' },
  { label: '组织', value: '组织' }
]

// 类别选项（根据实体类型动态变化）
const categoryOptionsMap: Record<string, string[]> = {
  '客户': ['企业客户', '个人客户', '政府客户', '合作伙伴'],
  '产品': ['电子产品', '日用品', '服务产品', '软件产品'],
  '供应商': ['制造商', '物流服务商', '原材料供应商', '技术服务商'],
  '组织': ['技术部门', '业务部门', '职能部门', '分支机构']
}

// 业务标签选项
const businessTagOptions = [
  '核心客户',
  'VIP',
  '普通客户',
  '互联网',
  '热销产品',
  '高端',
  '国产',
  '办公设备',
  '战略供应商',
  '一级',
  '核心供应商',
  '物流',
  '普通供应商',
  '核心部门',
  '支持部门'
]

// 状态选项
const statusOptions = [
  { label: '全部', value: '' },
  { label: '正常', value: '正常' },
  { label: '停用', value: '停用' },
  { label: '待审核', value: '待审核' }
]

// 计算类别选项
const categoryOptions = computed(() => {
  return categoryOptionsMap[formData.entityType] || []
})

// 表单验证规则
const rules: FormRules = {
  entityType: [
    { required: true, message: '请选择实体类型', trigger: 'change' }
  ],
  entityName: [
    { required: true, message: '请输入实体名称', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  uniqueId: [
    { required: true, message: '请输入唯一标识', trigger: 'blur' },
    { 
      pattern: /^[A-Z]+-\d{4}-\d{3,6}$/, 
      message: '格式：类型前缀-年份-编号（如：CUST-2024-001）', 
      trigger: 'blur' 
    },
    {
      validator: (rule, value, callback) => {
        // 唯一性校验
        const exists = mockData.some(item => 
          item.uniqueId === value && item.id !== formData.id
        )
        if (exists) {
          callback(new Error('该唯一标识已存在，请使用其他标识'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  category: [
    { required: true, message: '请选择所属类别', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

// 计算过滤后的数据
const filteredData = computed(() => {
  let data = [...mockData]

  // 关键字搜索
  if (searchForm.keyword) {
    const keyword = searchForm.keyword.toLowerCase()
    data = data.filter(item => 
      item.entityName.toLowerCase().includes(keyword) ||
      item.uniqueId.toLowerCase().includes(keyword) ||
      item.description.toLowerCase().includes(keyword)
    )
  }

  // 实体类型筛选
  if (searchForm.entityType) {
    data = data.filter(item => item.entityType === searchForm.entityType)
  }

  // 类别筛选
  if (searchForm.category) {
    data = data.filter(item => item.category === searchForm.category)
  }

  // 状态筛选
  if (searchForm.status) {
    data = data.filter(item => item.status === searchForm.status)
  }

  return data
})

// 获取类别列表（根据当前选择的实体类型）
const categoryList = computed(() => {
  if (!searchForm.entityType) {
    // 如果没有选择实体类型，返回所有类别
    return Array.from(new Set(mockData.map(item => item.category)))
  }
  return categoryOptionsMap[searchForm.entityType] || []
})

// 实体类型颜色映射
const entityTypeColorMap: Record<string, string> = {
  '客户': 'success',
  '产品': 'primary',
  '供应商': 'warning',
  '组织': 'info'
}

// 状态颜色映射
const statusColorMap: Record<string, string> = {
  '正常': 'success',
  '停用': 'danger',
  '待审核': 'warning'
}

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
  searchForm.entityType = ''
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
  dialogTitle.value = '新增主数据'
  resetForm()
  dialogVisible.value = true
}

// 打开编辑弹窗
const handleEdit = (row: MasterDataItem) => {
  dialogTitle.value = '编辑主数据'
  Object.assign(formData, {
    id: row.id,
    entityType: row.entityType,
    entityName: row.entityName,
    uniqueId: row.uniqueId,
    category: row.category,
    businessTag: [...row.businessTag],
    status: row.status,
    isEnabled: row.isEnabled,
    description: row.description
  })
  dialogVisible.value = true
}

// 查看详情
const handleView = (row: MasterDataItem) => {
  ElMessageBox.alert(
    `
    <div style="line-height: 2;">
      <p><strong>实体类型：</strong>${row.entityType}</p>
      <p><strong>实体名称：</strong>${row.entityName}</p>
      <p><strong>唯一标识：</strong>${row.uniqueId}</p>
      <p><strong>所属类别：</strong>${row.category}</p>
      <p><strong>业务标签：</strong>${row.businessTag.join(', ') || '无'}</p>
      <p><strong>状态：</strong>${row.status}</p>
      <p><strong>启用状态：</strong>${row.isEnabled ? '已启用' : '已禁用'}</p>
      <p><strong>描述：</strong>${row.description || '无'}</p>
      <p><strong>创建时间：</strong>${row.createTime}</p>
      <p><strong>更新时间：</strong>${row.updateTime}</p>
    </div>
    `,
    '主数据详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '关闭',
      customClass: 'detail-message-box'
    }
  )
}

// 删除
const handleDelete = (row: MasterDataItem) => {
  ElMessageBox.confirm(
    `确定要删除主数据 "${row.entityName}" (${row.uniqueId}) 吗？`,
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
              entityType: formData.entityType,
              entityName: formData.entityName,
              uniqueId: formData.uniqueId,
              category: formData.category,
              businessTag: [...formData.businessTag],
              status: formData.status,
              isEnabled: formData.isEnabled,
              description: formData.description,
              updateTime: currentTime
            }
          }
          ElMessage.success('编辑成功')
        } else {
          // 新增
          const newItem: MasterDataItem = {
            id: Math.max(...mockData.map(item => item.id)) + 1,
            entityType: formData.entityType,
            entityName: formData.entityName,
            uniqueId: formData.uniqueId,
            category: formData.category,
            businessTag: [...formData.businessTag],
            status: formData.status,
            isEnabled: formData.isEnabled,
            description: formData.description,
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
  formData.entityType = ''
  formData.entityName = ''
  formData.uniqueId = ''
  formData.category = ''
  formData.businessTag = []
  formData.status = '正常'
  formData.isEnabled = true
  formData.description = ''
  formRef.value?.clearValidate()
}

// 关闭弹窗
const handleClose = () => {
  dialogVisible.value = false
  resetForm()
}

// 实体类型改变时，重置类别
const handleEntityTypeChange = () => {
  formData.category = ''
}

// 生成唯一标识建议
const generateUniqueId = () => {
  if (!formData.entityType) {
    ElMessage.warning('请先选择实体类型')
    return
  }

  const prefixMap: Record<string, string> = {
    '客户': 'CUST',
    '产品': 'PROD',
    '供应商': 'SUPP',
    '组织': 'ORG'
  }

  const prefix = prefixMap[formData.entityType]
  const year = new Date().getFullYear()
  
  // 获取同类型的最大编号
  const sameTypeItems = mockData.filter(item => item.entityType === formData.entityType)
  const maxNum = sameTypeItems.reduce((max, item) => {
    const match = item.uniqueId.match(/\d+$/)
    if (match) {
      const num = parseInt(match[0])
      return num > max ? num : max
    }
    return max
  }, 0)

  const newNum = String(maxNum + 1).padStart(3, '0')
  formData.uniqueId = `${prefix}-${year}-${newNum}`
}

// 初始化加载数据
onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="master-data-manage-container">
    <!-- 页面标题 -->
    <el-card class="header-card" shadow="never">
      <div class="page-header">
        <div class="header-content">
          <h2 class="page-title">主数据管理</h2>
          <p class="page-description">对核心业务实体进行全生命周期管理，确保跨部门、跨系统业务协作基于同一套"事实"</p>
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
                placeholder="名称/标识/描述"
                clearable
                @keyup.enter="handleSearch"
              />
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="实体类型">
              <el-select
                v-model="searchForm.entityType"
                placeholder="请选择实体类型"
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="type in entityTypeOptions"
                  :key="type.value"
                  :label="type.label"
                  :value="type.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="所属类别">
              <el-select
                v-model="searchForm.category"
                placeholder="请选择类别"
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="cat in categoryList"
                  :key="cat"
                  :label="cat"
                  :value="cat"
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
          新增主数据
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
        height="calc(100vh - 520px)"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="实体类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="entityTypeColorMap[row.entityType]" size="small">
              {{ row.entityType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="entityName" label="实体名称" width="180" show-overflow-tooltip />
        <el-table-column prop="uniqueId" label="唯一标识" width="150" show-overflow-tooltip />
        <el-table-column prop="category" label="所属类别" width="120" show-overflow-tooltip />
        <el-table-column label="业务标签" width="200">
          <template #default="{ row }">
            <el-tag
              v-for="tag in row.businessTag"
              :key="tag"
              size="small"
              style="margin-right: 5px"
            >
              {{ tag }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusColorMap[row.status]" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="启用状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isEnabled ? 'success' : 'info'" size="small">
              {{ row.isEnabled ? '已启用' : '已禁用' }}
            </el-tag>
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
      width="650px"
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
            <el-form-item label="实体类型" prop="entityType">
              <el-select
                v-model="formData.entityType"
                placeholder="请选择实体类型"
                style="width: 100%"
                @change="handleEntityTypeChange"
              >
                <el-option
                  v-for="type in entityTypeOptions"
                  :key="type.value"
                  :label="type.label"
                  :value="type.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属类别" prop="category">
              <el-select
                v-model="formData.category"
                placeholder="请选择类别"
                :disabled="!formData.entityType"
                style="width: 100%"
              >
                <el-option
                  v-for="cat in categoryOptions"
                  :key="cat"
                  :label="cat"
                  :value="cat"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="实体名称" prop="entityName">
          <el-input
            v-model="formData.entityName"
            placeholder="请输入实体名称"
            clearable
          />
        </el-form-item>

        <el-form-item label="唯一标识" prop="uniqueId">
          <el-input
            v-model="formData.uniqueId"
            placeholder="格式：CUST-2024-001"
            clearable
          >
            <template #append>
              <el-button @click="generateUniqueId">
                <el-icon><MagicStick /></el-icon>
                自动生成
              </el-button>
            </template>
          </el-input>
          <div class="form-tip">
            <el-icon><InfoFilled /></el-icon>
            格式说明：CUST(客户)/PROD(产品)/SUPP(供应商)/ORG(组织)-年份-编号
          </div>
        </el-form-item>

        <el-form-item label="业务标签">
          <el-select
            v-model="formData.businessTag"
            multiple
            placeholder="请选择业务标签"
            style="width: 100%"
          >
            <el-option
              v-for="tag in businessTagOptions"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select
                v-model="formData.status"
                placeholder="请选择状态"
                style="width: 100%"
              >
                <el-option label="正常" value="正常" />
                <el-option label="停用" value="停用" />
                <el-option label="待审核" value="待审核" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否启用">
              <el-switch v-model="formData.isEnabled" />
              <span style="margin-left: 10px; color: #909399; font-size: 12px">
                {{ formData.isEnabled ? '已启用' : '已禁用' }}
              </span>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述信息"
            clearable
          />
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
.master-data-manage-container {
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
  width: 500px;
  
  .el-message-box__message {
    p {
      margin: 8px 0;
      
      strong {
        color: #606266;
        display: inline-block;
        min-width: 80px;
      }
    }
  }
}
</style>