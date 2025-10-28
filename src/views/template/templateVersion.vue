<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// 接口定义
interface TemplateVersion {
  id: number
  templateName: string
  templateCode: string
  versionNumber: string
  category: string
  templateType: string
  modifier: string
  modifyTime: string
  changeLog: string
  content: string
  status: 'current' | 'history' | 'draft'
  isCurrent: boolean
  createTime: string
}

interface SearchForm {
  keyword: string
  category: string
  templateType: string
  status: string
}

// 响应式数据
const loading = ref(false)
const tableData = ref<TemplateVersion[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 搜索表单
const searchForm = reactive<SearchForm>({
  keyword: '',
  category: '',
  templateType: '',
  status: ''
})

// 弹窗相关
const dialogVisible = ref(false)
const compareDialogVisible = ref(false)
const dialogTitle = ref('新增版本')
const formRef = ref<FormInstance>()

// 表单数据
const form = reactive<Partial<TemplateVersion>>({
  id: undefined,
  templateName: '',
  templateCode: '',
  versionNumber: '',
  category: '',
  templateType: '',
  modifier: '',
  changeLog: '',
  content: '',
  status: 'draft',
  isCurrent: false
})

// 版本比较数据
const compareData = reactive({
  oldVersion: null as TemplateVersion | null,
  newVersion: null as TemplateVersion | null
})

// 模板分类选项
const categoryOptions = [
  { label: '数据模板', value: 'data' },
  { label: '接口模板', value: 'interface' },
  { label: '报表模板', value: 'report' },
  { label: '流程模板', value: 'workflow' },
  { label: '表单模板', value: 'form' },
  { label: '文档模板', value: 'document' },
  { label: '代码模板', value: 'code' },
  { label: '配置模板', value: 'config' }
]

// 模板类型选项
const templateTypeOptions = [
  { label: '基础模板', value: 'basic' },
  { label: '业务模板', value: 'business' },
  { label: '标准模板', value: 'standard' },
  { label: '自定义模板', value: 'custom' }
]

// 状态选项
const statusOptions = [
  { label: '当前版本', value: 'current' },
  { label: '历史版本', value: 'history' },
  { label: '草稿', value: 'draft' }
]

// 表单验证规则
const rules = reactive<FormRules>({
  templateName: [
    { required: true, message: '请输入模板名称', trigger: 'blur' }
  ],
  templateCode: [
    { required: true, message: '请输入模板编码', trigger: 'blur' }
  ],
  versionNumber: [
    { required: true, message: '请输入版本号', trigger: 'blur' },
    { pattern: /^\d+\.\d+\.\d+$/, message: '版本号格式为：x.y.z', trigger: 'blur' }
  ],
  changeLog: [
    { required: true, message: '请输入变更说明', trigger: 'blur' }
  ]
})

// Mock 数据
const mockData: TemplateVersion[] = [
  {
    id: 1,
    templateName: '用户信息数据元模板',
    templateCode: 'TPL_USER_DATA_ELEMENT',
    versionNumber: '1.2.0',
    category: 'data',
    templateType: 'standard',
    modifier: '张三',
    modifyTime: '2024-01-25 10:30:00',
    changeLog: '新增birthDate字段，优化email字段验证规则',
    content: '{ userId, userName, idCard, phone, email, gender, birthDate }',
    status: 'current',
    isCurrent: true,
    createTime: '2024-01-25 10:30:00'
  },
  {
    id: 2,
    templateName: '用户信息数据元模板',
    templateCode: 'TPL_USER_DATA_ELEMENT',
    versionNumber: '1.1.0',
    category: 'data',
    templateType: 'standard',
    modifier: '张三',
    modifyTime: '2024-01-15 14:20:00',
    changeLog: '新增gender字段',
    content: '{ userId, userName, idCard, phone, email, gender }',
    status: 'history',
    isCurrent: false,
    createTime: '2024-01-15 14:20:00'
  },
  {
    id: 3,
    templateName: '用户信息数据元模板',
    templateCode: 'TPL_USER_DATA_ELEMENT',
    versionNumber: '1.0.0',
    category: 'data',
    templateType: 'standard',
    modifier: '李四',
    modifyTime: '2024-01-01 09:00:00',
    changeLog: '初始版本，包含用户基础字段',
    content: '{ userId, userName, idCard, phone, email }',
    status: 'history',
    isCurrent: false,
    createTime: '2024-01-01 09:00:00'
  },
  {
    id: 4,
    templateName: 'RESTful API接口模板',
    templateCode: 'TPL_RESTFUL_API',
    versionNumber: '2.0.0',
    category: 'interface',
    templateType: 'standard',
    modifier: '王五',
    modifyTime: '2024-01-20 16:45:00',
    changeLog: '重构响应结构，新增traceId字段用于链路追踪',
    content: '{ code, message, data, traceId, pagination: { page, size, total } }',
    status: 'current',
    isCurrent: true,
    createTime: '2024-01-20 16:45:00'
  },
  {
    id: 5,
    templateName: 'RESTful API接口模板',
    templateCode: 'TPL_RESTFUL_API',
    versionNumber: '1.0.0',
    category: 'interface',
    templateType: 'standard',
    modifier: '王五',
    modifyTime: '2024-01-10 11:30:00',
    changeLog: '初始版本，定义基础响应格式',
    content: '{ code, message, data, pagination: { page, size, total } }',
    status: 'history',
    isCurrent: false,
    createTime: '2024-01-10 11:30:00'
  },
  {
    id: 6,
    templateName: '订单数据标准模板',
    templateCode: 'TPL_ORDER_DATA',
    versionNumber: '1.1.0',
    category: 'data',
    templateType: 'business',
    modifier: '赵六',
    modifyTime: '2024-01-22 13:15:00',
    changeLog: '新增优惠券信息字段',
    content: '{ orderId, orderNo, userId, products[], amount, coupon, status, logistics }',
    status: 'current',
    isCurrent: true,
    createTime: '2024-01-22 13:15:00'
  },
  {
    id: 7,
    templateName: '订单数据标准模板',
    templateCode: 'TPL_ORDER_DATA',
    versionNumber: '1.0.0',
    category: 'data',
    templateType: 'business',
    modifier: '赵六',
    modifyTime: '2024-01-12 10:20:00',
    changeLog: '初始版本，定义订单基础结构',
    content: '{ orderId, orderNo, userId, products[], amount, status, logistics }',
    status: 'history',
    isCurrent: false,
    createTime: '2024-01-12 10:20:00'
  },
  {
    id: 8,
    templateName: '审批流程模板',
    templateCode: 'TPL_APPROVAL_WORKFLOW',
    versionNumber: '2.1.0',
    category: 'workflow',
    templateType: 'standard',
    modifier: '孙七',
    modifyTime: '2024-01-24 15:40:00',
    changeLog: '支持条件分支，新增超时自动审批功能',
    content: 'BPMN 2.0 with conditional gateway and timeout',
    status: 'draft',
    isCurrent: false,
    createTime: '2024-01-24 15:40:00'
  },
  {
    id: 9,
    templateName: '审批流程模板',
    templateCode: 'TPL_APPROVAL_WORKFLOW',
    versionNumber: '2.0.0',
    category: 'workflow',
    templateType: 'standard',
    modifier: '孙七',
    modifyTime: '2024-01-18 14:30:00',
    changeLog: '支持多级审批和会签',
    content: 'BPMN 2.0 with multi-level approval',
    status: 'current',
    isCurrent: true,
    createTime: '2024-01-18 14:30:00'
  },
  {
    id: 10,
    templateName: '审批流程模板',
    templateCode: 'TPL_APPROVAL_WORKFLOW',
    versionNumber: '1.0.0',
    category: 'workflow',
    templateType: 'standard',
    modifier: '周八',
    modifyTime: '2024-01-05 09:15:00',
    changeLog: '初始版本，基础审批流程',
    content: 'BPMN 2.0 basic workflow',
    status: 'history',
    isCurrent: false,
    createTime: '2024-01-05 09:15:00'
  }
]

// 计算属性：过滤后的数据
const filteredData = computed(() => {
  let data = [...mockData]
  
  // 关键字搜索
  if (searchForm.keyword) {
    const keyword = searchForm.keyword.toLowerCase()
    data = data.filter(item => 
      item.templateName.toLowerCase().includes(keyword) ||
      item.templateCode.toLowerCase().includes(keyword) ||
      item.versionNumber.includes(keyword) ||
      item.modifier.toLowerCase().includes(keyword)
    )
  }
  
  // 分类筛选
  if (searchForm.category) {
    data = data.filter(item => item.category === searchForm.category)
  }
  
  // 模板类型筛选
  if (searchForm.templateType) {
    data = data.filter(item => item.templateType === searchForm.templateType)
  }
  
  // 状态筛选
  if (searchForm.status) {
    data = data.filter(item => item.status === searchForm.status)
  }
  
  return data
})

// 获取分类标签
const getCategoryLabel = (value: string) => {
  const option = categoryOptions.find(opt => opt.value === value)
  return option ? option.label : value
}

// 获取类型标签
const getTypeLabel = (value: string) => {
  const option = templateTypeOptions.find(opt => opt.value === value)
  return option ? option.label : value
}

// 获取状态标签类型
const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    current: 'success',
    history: 'info',
    draft: 'warning'
  }
  return typeMap[status] || ''
}

// 获取状态标签文本
const getStatusLabel = (status: string) => {
  const labelMap: Record<string, string> = {
    current: '当前版本',
    history: '历史版本',
    draft: '草稿'
  }
  return labelMap[status] || status
}

// 加载表格数据
const loadTableData = () => {
  loading.value = true
  
  // 模拟异步请求
  setTimeout(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    tableData.value = filteredData.value.slice(start, end)
    total.value = filteredData.value.length
    loading.value = false
  }, 300)
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  loadTableData()
}

// 重置搜索
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.category = ''
  searchForm.templateType = ''
  searchForm.status = ''
  currentPage.value = 1
  loadTableData()
}

// 分页改变
const handlePageChange = (page: number) => {
  currentPage.value = page
  loadTableData()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadTableData()
}

// 新增
const handleAdd = () => {
  dialogTitle.value = '新增版本'
  resetForm()
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: TemplateVersion) => {
  dialogTitle.value = '编辑版本'
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

// 查看详情
const handleView = (row: TemplateVersion) => {
  ElMessageBox.alert(
    `
      <div style="line-height: 2;">
        <p><strong>模板名称：</strong>${row.templateName}</p>
        <p><strong>模板编码：</strong><code style="padding: 2px 6px; background: #f5f7fa; border-radius: 3px;">${row.templateCode}</code></p>
        <p><strong>版本号：</strong><span style="color: #409eff; font-weight: 600;">${row.versionNumber}</span></p>
        <p><strong>所属分类：</strong>${getCategoryLabel(row.category)}</p>
        <p><strong>模板类型：</strong>${getTypeLabel(row.templateType)}</p>
        <p><strong>修改人：</strong>${row.modifier}</p>
        <p><strong>修改时间：</strong>${row.modifyTime}</p>
        <p><strong>版本状态：</strong>${getStatusLabel(row.status)}</p>
        <p><strong>变更说明：</strong></p>
        <div style="background: #f5f7fa; padding: 10px; border-radius: 4px; margin: 8px 0;">${row.changeLog}</div>
        <p><strong>模板内容：</strong></p>
        <pre style="background: #f5f7fa; padding: 10px; border-radius: 4px; font-size: 12px; overflow-x: auto;">${row.content}</pre>
      </div>
    `,
    '版本详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '关闭',
      customStyle: { width: '700px' }
    }
  )
}

// 版本比较
const handleCompare = (row: TemplateVersion) => {
  // 找到同一模板的其他版本
  const sameTemplateVersions = mockData.filter(
    item => item.templateCode === row.templateCode && item.id !== row.id
  ).sort((a, b) => b.versionNumber.localeCompare(a.versionNumber))
  
  if (sameTemplateVersions.length === 0) {
    ElMessage.warning('该模板暂无其他版本可供比较')
    return
  }
  
  // 默认与上一个版本比较
  compareData.newVersion = row
  compareData.oldVersion = sameTemplateVersions[0]
  compareDialogVisible.value = true
}

// 回滚版本
const handleRollback = (row: TemplateVersion) => {
  if (row.isCurrent) {
    ElMessage.warning('当前版本无需回滚')
    return
  }
  
  ElMessageBox.confirm(
    `确定要将版本 ${row.versionNumber} 回滚为当前有效版本吗？`,
    '确认回滚',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    loading.value = true
    // 模拟回滚操作
    setTimeout(() => {
      // 将该模板的所有当前版本改为历史版本
      mockData.forEach(item => {
        if (item.templateCode === row.templateCode && item.isCurrent) {
          item.status = 'history'
          item.isCurrent = false
        }
      })
      
      // 将选中版本设为当前版本
      const item = mockData.find(item => item.id === row.id)
      if (item) {
        item.status = 'current'
        item.isCurrent = true
        item.modifyTime = new Date().toLocaleString('zh-CN', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false 
        }).replace(/\//g, '-')
      }
      
      loading.value = false
      ElMessage.success('版本回滚成功')
      loadTableData()
    }, 500)
  }).catch(() => {
    // 取消回滚
  })
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      
      // 模拟保存操作
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
        
        if (form.id) {
          // 编辑
          const index = mockData.findIndex(item => item.id === form.id)
          if (index > -1) {
            mockData[index] = {
              ...mockData[index],
              ...form,
              modifyTime: currentTime
            } as TemplateVersion
          }
          ElMessage.success('编辑成功')
        } else {
          // 新增
          const newItem: TemplateVersion = {
            id: Math.max(...mockData.map(item => item.id)) + 1,
            templateName: form.templateName!,
            templateCode: form.templateCode!,
            versionNumber: form.versionNumber!,
            category: form.category!,
            templateType: form.templateType!,
            modifier: form.modifier || '当前用户',
            modifyTime: currentTime,
            changeLog: form.changeLog!,
            content: form.content!,
            status: 'draft',
            isCurrent: false,
            createTime: currentTime
          }
          mockData.unshift(newItem)
          ElMessage.success('新增成功')
        }
        
        loading.value = false
        dialogVisible.value = false
        loadTableData()
      }, 500)
    }
  })
}

// 取消
const handleCancel = () => {
  dialogVisible.value = false
  resetForm()
}

// 重置表单
const resetForm = () => {
  form.id = undefined
  form.templateName = ''
  form.templateCode = ''
  form.versionNumber = ''
  form.category = ''
  form.templateType = ''
  form.modifier = ''
  form.changeLog = ''
  form.content = ''
  form.status = 'draft'
  form.isCurrent = false
  
  formRef.value?.clearValidate()
}

// 生命周期
onMounted(() => {
  loadTableData()
})
</script>

<template>
  <div class="template-version-container">
    <!-- 页面标题 -->
    <el-card class="header-card" shadow="never">
      <div class="page-header">
        <div>
          <h2 class="page-title">模板版本控制</h2>
          <p class="page-description">
            对模板在整个生命周期内的所有变更进行追踪和管理，确保模板的可追溯性，允许在必要时回滚到历史版本
          </p>
        </div>
      </div>
    </el-card>

    <!-- 搜索筛选区 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键字">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入模板名称、编码或版本号"
            clearable
            style="width: 260px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        
        <el-form-item label="所属分类">
          <el-select
            v-model="searchForm.category"
            placeholder="请选择分类"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="item in categoryOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="模板类型">
          <el-select
            v-model="searchForm.templateType"
            placeholder="请选择类型"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="item in templateTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="版本状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 130px"
          >
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格区 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">版本列表</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增版本
          </el-button>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        border
        style="width: 100%"
        :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        
        <el-table-column prop="templateName" label="模板名称" min-width="160" show-overflow-tooltip />
        
        <el-table-column prop="templateCode" label="模板编码" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <code class="template-code">{{ row.templateCode }}</code>
          </template>
        </el-table-column>
        
        <el-table-column prop="versionNumber" label="版本号" width="100" align="center">
          <template #default="{ row }">
            <span style="color: #409eff; font-weight: 600">v{{ row.versionNumber }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="category" label="所属分类" width="110" align="center">
          <template #default="{ row }">
            <el-tag type="primary" size="small">{{ getCategoryLabel(row.category) }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="templateType" label="模板类型" width="110" align="center">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ getTypeLabel(row.templateType) }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="modifier" label="修改人" width="100" align="center" />
        
        <el-table-column prop="modifyTime" label="修改时间" width="160" show-overflow-tooltip />
        
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="280" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              size="small"
              @click="handleView(row)"
            >
              <el-icon><View /></el-icon>
              详情
            </el-button>
            <el-button
              type="primary"
              link
              size="small"
              @click="handleCompare(row)"
            >
              <el-icon><Operation /></el-icon>
              比较
            </el-button>
            <el-button
              v-if="!row.isCurrent"
              type="warning"
              link
              size="small"
              @click="handleRollback(row)"
            >
              <el-icon><RefreshLeft /></el-icon>
              回滚
            </el-button>
            <el-tag v-else type="success" size="small" style="margin-left: 8px">
              当前
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      :close-on-click-modal="false"
      @close="handleCancel"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="模板名称" prop="templateName">
              <el-input
                v-model="form.templateName"
                placeholder="请输入模板名称"
                clearable
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="模板编码" prop="templateCode">
              <el-input
                v-model="form.templateCode"
                placeholder="请输入模板编码"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="版本号" prop="versionNumber">
              <el-input
                v-model="form.versionNumber"
                placeholder="如：1.0.0"
                clearable
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="修改人" prop="modifier">
              <el-input
                v-model="form.modifier"
                placeholder="请输入修改人"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属分类" prop="category">
              <el-select
                v-model="form.category"
                placeholder="请选择所属分类"
                style="width: 100%"
              >
                <el-option
                  v-for="item in categoryOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="模板类型" prop="templateType">
              <el-select
                v-model="form.templateType"
                placeholder="请选择模板类型"
                style="width: 100%"
              >
                <el-option
                  v-for="item in templateTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="变更说明" prop="changeLog">
          <el-input
            v-model="form.changeLog"
            type="textarea"
            :rows="3"
            placeholder="请输入本次变更的详细说明"
          />
        </el-form-item>
        
        <el-form-item label="模板内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="4"
            placeholder="请输入模板的具体内容"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" :loading="loading" @click="handleSubmit">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 版本比较弹窗 -->
    <el-dialog
      v-model="compareDialogVisible"
      title="版本比较"
      width="900px"
    >
      <div v-if="compareData.oldVersion && compareData.newVersion" class="compare-container">
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="version-panel old-version">
              <div class="version-header">
                <h3>
                  旧版本 
                  <el-tag type="info" size="small">v{{ compareData.oldVersion.versionNumber }}</el-tag>
                </h3>
                <p class="version-info">{{ compareData.oldVersion.modifyTime }} by {{ compareData.oldVersion.modifier }}</p>
              </div>
              <div class="version-content">
                <div class="content-item">
                  <label>模板名称：</label>
                  <span>{{ compareData.oldVersion.templateName }}</span>
                </div>
                <div class="content-item">
                  <label>变更说明：</label>
                  <div class="change-log">{{ compareData.oldVersion.changeLog }}</div>
                </div>
                <div class="content-item">
                  <label>模板内容：</label>
                  <pre class="content-code">{{ compareData.oldVersion.content }}</pre>
                </div>
              </div>
            </div>
          </el-col>
          
          <el-col :span="12">
            <div class="version-panel new-version">
              <div class="version-header">
                <h3>
                  新版本 
                  <el-tag type="success" size="small">v{{ compareData.newVersion.versionNumber }}</el-tag>
                </h3>
                <p class="version-info">{{ compareData.newVersion.modifyTime }} by {{ compareData.newVersion.modifier }}</p>
              </div>
              <div class="version-content">
                <div class="content-item">
                  <label>模板名称：</label>
                  <span>{{ compareData.newVersion.templateName }}</span>
                </div>
                <div class="content-item">
                  <label>变更说明：</label>
                  <div class="change-log highlight">{{ compareData.newVersion.changeLog }}</div>
                </div>
                <div class="content-item">
                  <label>模板内容：</label>
                  <pre class="content-code highlight">{{ compareData.newVersion.content }}</pre>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
        
        <div class="compare-summary">
          <el-alert
            title="版本差异说明"
            type="info"
            :closable="false"
          >
            <p>右侧（新版本）高亮显示的内容表示与左侧（旧版本）相比发生的变更</p>
          </el-alert>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.template-version-container {
  min-height: calc(100vh - 120px);

  .header-card {
    margin-bottom: 16px;
    
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .page-title {
        margin: 0 0 8px 0;
        font-size: 20px;
        font-weight: 600;
        color: #303133;
      }

      .page-description {
        margin: 0;
        font-size: 14px;
        color: #606266;
        line-height: 1.6;
      }
    }
  }

  .search-card {
    margin-bottom: 16px;

    :deep(.el-form) {
      margin-bottom: 0;
    }

    :deep(.el-form-item) {
      margin-bottom: 0;
    }
  }

  .table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .card-title {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }
    }

    .template-code {
      padding: 2px 8px;
      background-color: #f5f7fa;
      border: 1px solid #e4e7ed;
      border-radius: 3px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      color: #409eff;
    }

    .pagination-container {
      margin-top: 16px;
      display: flex;
      justify-content: flex-end;
    }
  }

  .compare-container {
    .version-panel {
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      overflow: hidden;

      &.old-version {
        .version-header {
          background-color: #f5f7fa;
        }
      }

      &.new-version {
        .version-header {
          background-color: #e1f3f8;
        }
      }

      .version-header {
        padding: 12px 16px;
        border-bottom: 1px solid #dcdfe6;

        h3 {
          margin: 0 0 8px 0;
          font-size: 16px;
          color: #303133;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .version-info {
          margin: 0;
          font-size: 13px;
          color: #909399;
        }
      }

      .version-content {
        padding: 16px;

        .content-item {
          margin-bottom: 16px;

          &:last-child {
            margin-bottom: 0;
          }

          label {
            display: block;
            font-weight: 600;
            color: #606266;
            margin-bottom: 8px;
            font-size: 14px;
          }

          span {
            color: #303133;
          }

          .change-log {
            padding: 12px;
            background-color: #f5f7fa;
            border-radius: 4px;
            line-height: 1.6;
            color: #606266;

            &.highlight {
              background-color: #fef0f0;
              border: 1px solid #fde2e2;
              color: #f56c6c;
            }
          }

          .content-code {
            padding: 12px;
            background-color: #f5f7fa;
            border-radius: 4px;
            font-size: 12px;
            line-height: 1.6;
            color: #606266;
            overflow-x: auto;
            margin: 0;
            font-family: 'Courier New', Courier, monospace;

            &.highlight {
              background-color: #f0f9ff;
              border: 1px solid #b3d8ff;
              color: #409eff;
            }
          }
        }
      }
    }

    .compare-summary {
      margin-top: 20px;
    }
  }

  :deep(.el-card__body) {
    padding: 20px;
  }

  :deep(.el-table) {
    font-size: 14px;

    .el-button + .el-button {
      margin-left: 0;
    }
  }

  :deep(.el-dialog__body) {
    padding: 20px;
  }
}
</style>