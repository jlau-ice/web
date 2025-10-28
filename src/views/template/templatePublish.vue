<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// 接口定义
interface TemplateRelease {
  id: number
  templateName: string
  templateCode: string
  versionNumber: string
  category: string
  templateType: string
  publisher: string
  publishTime: string
  approver: string
  approveTime: string
  approveComment: string
  status: 'pending' | 'approving' | 'published' | 'withdrawn' | 'rejected'
  environment: string
  description: string
  createTime: string
}

interface PublishHistory {
  id: number
  operationType: string
  operator: string
  operateTime: string
  version: string
  comment: string
}

interface SearchForm {
  keyword: string
  category: string
  status: string
  environment: string
}

// 响应式数据
const loading = ref(false)
const tableData = ref<TemplateRelease[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 搜索表单
const searchForm = reactive<SearchForm>({
  keyword: '',
  category: '',
  status: '',
  environment: ''
})

// 弹窗相关
const publishDialogVisible = ref(false)
const historyDialogVisible = ref(false)
const formRef = ref<FormInstance>()

// 表单数据
const form = reactive({
  id: undefined as number | undefined,
  environment: '',
  description: ''
})

// 发布历史数据
const historyData = ref<PublishHistory[]>([])
const currentTemplate = ref<TemplateRelease | null>(null)

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

// 发布环境选项
const environmentOptions = [
  { label: '开发环境', value: 'dev' },
  { label: '测试环境', value: 'test' },
  { label: '预发布环境', value: 'staging' },
  { label: '生产环境', value: 'production' }
]

// 状态选项
const statusOptions = [
  { label: '待发布', value: 'pending' },
  { label: '审批中', value: 'approving' },
  { label: '已发布', value: 'published' },
  { label: '已撤回', value: 'withdrawn' },
  { label: '审批拒绝', value: 'rejected' }
]

// 表单验证规则
const rules = reactive<FormRules>({
  environment: [
    { required: true, message: '请选择发布环境', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入发布说明', trigger: 'blur' }
  ]
})

// Mock 数据
const mockData: TemplateRelease[] = [
  {
    id: 1,
    templateName: '用户信息数据元模板',
    templateCode: 'TPL_USER_DATA_ELEMENT',
    versionNumber: '1.2.0',
    category: 'data',
    templateType: 'standard',
    publisher: '张三',
    publishTime: '2024-01-25 11:00:00',
    approver: '李经理',
    approveTime: '2024-01-25 10:45:00',
    approveComment: '审批通过，符合数据标准要求',
    status: 'published',
    environment: 'production',
    description: '用户信息数据元模板v1.2.0正式发布，新增birthDate字段',
    createTime: '2024-01-25 10:30:00'
  },
  {
    id: 2,
    templateName: 'RESTful API接口模板',
    templateCode: 'TPL_RESTFUL_API',
    versionNumber: '2.0.0',
    category: 'interface',
    templateType: 'standard',
    publisher: '王五',
    publishTime: '2024-01-24 16:30:00',
    approver: '赵总监',
    approveTime: '2024-01-24 16:15:00',
    approveComment: '架构优化合理，同意发布',
    status: 'published',
    environment: 'production',
    description: 'RESTful API接口模板v2.0.0发布，重构响应结构',
    createTime: '2024-01-24 15:00:00'
  },
  {
    id: 3,
    templateName: '订单数据标准模板',
    templateCode: 'TPL_ORDER_DATA',
    versionNumber: '1.1.0',
    category: 'data',
    templateType: 'business',
    publisher: '赵六',
    publishTime: '',
    approver: '李经理',
    approveTime: '',
    approveComment: '',
    status: 'approving',
    environment: 'production',
    description: '订单数据标准模板v1.1.0待审批，新增优惠券字段',
    createTime: '2024-01-23 14:00:00'
  },
  {
    id: 4,
    templateName: '审批流程模板',
    templateCode: 'TPL_APPROVAL_WORKFLOW',
    versionNumber: '2.1.0',
    category: 'workflow',
    templateType: 'standard',
    publisher: '孙七',
    publishTime: '',
    approver: '',
    approveTime: '',
    approveComment: '',
    status: 'pending',
    environment: '',
    description: '审批流程模板v2.1.0待发布，支持条件分支',
    createTime: '2024-01-22 17:00:00'
  },
  {
    id: 5,
    templateName: '用户注册表单模板',
    templateCode: 'TPL_USER_REGISTER_FORM',
    versionNumber: '1.0.0',
    category: 'form',
    templateType: 'basic',
    publisher: '周八',
    publishTime: '2024-01-20 15:20:00',
    approver: '李经理',
    approveTime: '2024-01-20 15:10:00',
    approveComment: '表单设计合理，同意发布',
    status: 'published',
    environment: 'production',
    description: '用户注册表单模板v1.0.0发布',
    createTime: '2024-01-20 14:30:00'
  },
  {
    id: 6,
    templateName: 'Vue组件代码模板',
    templateCode: 'TPL_VUE_COMPONENT',
    versionNumber: '1.1.0',
    category: 'code',
    templateType: 'basic',
    publisher: '吴九',
    publishTime: '2024-01-19 10:30:00',
    approver: '赵总监',
    approveTime: '',
    approveComment: '代码规范性不足，暂不通过',
    status: 'rejected',
    environment: 'production',
    description: 'Vue组件代码模板v1.1.0发布申请',
    createTime: '2024-01-19 09:00:00'
  },
  {
    id: 7,
    templateName: '技术文档模板',
    templateCode: 'TPL_TECH_DOCUMENT',
    versionNumber: '1.0.0',
    category: 'document',
    templateType: 'standard',
    publisher: '郑十',
    publishTime: '2024-01-18 11:00:00',
    approver: '李经理',
    approveTime: '2024-01-18 10:50:00',
    approveComment: '文档结构清晰，批准发布',
    status: 'withdrawn',
    environment: 'production',
    description: '技术文档模板v1.0.0已撤回',
    createTime: '2024-01-18 10:00:00'
  },
  {
    id: 8,
    templateName: '月度销售报表模板',
    templateCode: 'TPL_SALES_REPORT_MONTHLY',
    versionNumber: '1.0.0',
    category: 'report',
    templateType: 'business',
    publisher: '刘十一',
    publishTime: '2024-01-17 16:00:00',
    approver: '赵总监',
    approveTime: '2024-01-17 15:45:00',
    approveComment: '报表指标完整，同意上线',
    status: 'published',
    environment: 'production',
    description: '月度销售报表模板v1.0.0正式发布',
    createTime: '2024-01-17 14:00:00'
  },
  {
    id: 9,
    templateName: '数据库表设计模板',
    templateCode: 'TPL_DATABASE_TABLE',
    versionNumber: '1.0.0',
    category: 'data',
    templateType: 'standard',
    publisher: '陈十二',
    publishTime: '',
    approver: '',
    approveTime: '',
    approveComment: '',
    status: 'pending',
    environment: '',
    description: '数据库表设计模板v1.0.0待发布',
    createTime: '2024-01-16 13:00:00'
  },
  {
    id: 10,
    templateName: '微服务配置模板',
    templateCode: 'TPL_MICROSERVICE_CONFIG',
    versionNumber: '1.0.0',
    category: 'config',
    templateType: 'standard',
    publisher: '杨十三',
    publishTime: '',
    approver: '赵总监',
    approveTime: '',
    approveComment: '',
    status: 'approving',
    environment: 'production',
    description: '微服务配置模板v1.0.0审批中',
    createTime: '2024-01-15 10:00:00'
  }
]

// Mock 发布历史数据
const mockHistoryData: Record<number, PublishHistory[]> = {
  1: [
    { id: 1, operationType: '创建', operator: '张三', operateTime: '2024-01-25 10:30:00', version: '1.2.0', comment: '创建模板版本' },
    { id: 2, operationType: '提交审批', operator: '张三', operateTime: '2024-01-25 10:35:00', version: '1.2.0', comment: '提交审批' },
    { id: 3, operationType: '审批通过', operator: '李经理', operateTime: '2024-01-25 10:45:00', version: '1.2.0', comment: '审批通过，符合数据标准要求' },
    { id: 4, operationType: '发布', operator: '张三', operateTime: '2024-01-25 11:00:00', version: '1.2.0', comment: '发布到生产环境' }
  ],
  2: [
    { id: 1, operationType: '创建', operator: '王五', operateTime: '2024-01-24 15:00:00', version: '2.0.0', comment: '创建模板版本' },
    { id: 2, operationType: '提交审批', operator: '王五', operateTime: '2024-01-24 15:30:00', version: '2.0.0', comment: '提交审批' },
    { id: 3, operationType: '审批通过', operator: '赵总监', operateTime: '2024-01-24 16:15:00', version: '2.0.0', comment: '架构优化合理，同意发布' },
    { id: 4, operationType: '发布', operator: '王五', operateTime: '2024-01-24 16:30:00', version: '2.0.0', comment: '发布到生产环境' }
  ]
}

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
      item.publisher.toLowerCase().includes(keyword)
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
  
  // 环境筛选
  if (searchForm.environment) {
    data = data.filter(item => item.environment === searchForm.environment)
  }
  
  return data
})

// 获取分类标签
const getCategoryLabel = (value: string) => {
  const option = categoryOptions.find(opt => opt.value === value)
  return option ? option.label : value
}

// 获取环境标签
const getEnvironmentLabel = (value: string) => {
  const option = environmentOptions.find(opt => opt.value === value)
  return option ? option.label : value
}

// 获取状态标签类型
const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    pending: 'info',
    approving: 'warning',
    published: 'success',
    withdrawn: '',
    rejected: 'danger'
  }
  return typeMap[status] || ''
}

// 获取状态标签文本
const getStatusLabel = (status: string) => {
  const labelMap: Record<string, string> = {
    pending: '待发布',
    approving: '审批中',
    published: '已发布',
    withdrawn: '已撤回',
    rejected: '审批拒绝'
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
  searchForm.status = ''
  searchForm.environment = ''
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

// 查看详情
const handleView = (row: TemplateRelease) => {
  const statusInfo = row.status === 'published' ? `
    <p><strong>审批人：</strong>${row.approver}</p>
    <p><strong>审批时间：</strong>${row.approveTime}</p>
    <p><strong>审批意见：</strong>${row.approveComment}</p>
    <p><strong>发布时间：</strong>${row.publishTime}</p>
  ` : row.status === 'approving' ? `
    <p><strong>审批人：</strong>${row.approver}</p>
    <p><strong>审批状态：</strong>审批中</p>
  ` : row.status === 'rejected' ? `
    <p><strong>审批人：</strong>${row.approver}</p>
    <p><strong>审批意见：</strong>${row.approveComment}</p>
  ` : '<p><strong>状态：</strong>待发布</p>'
  
  ElMessageBox.alert(
    `
      <div style="line-height: 2;">
        <p><strong>模板名称：</strong>${row.templateName}</p>
        <p><strong>模板编码：</strong><code style="padding: 2px 6px; background: #f5f7fa; border-radius: 3px;">${row.templateCode}</code></p>
        <p><strong>版本号：</strong><span style="color: #409eff; font-weight: 600;">v${row.versionNumber}</span></p>
        <p><strong>所属分类：</strong>${getCategoryLabel(row.category)}</p>
        <p><strong>发布人：</strong>${row.publisher}</p>
        <p><strong>发布环境：</strong>${row.environment ? getEnvironmentLabel(row.environment) : '未指定'}</p>
        ${statusInfo}
        <p><strong>发布说明：</strong></p>
        <div style="background: #f5f7fa; padding: 10px; border-radius: 4px; margin: 8px 0;">${row.description}</div>
        <p><strong>创建时间：</strong>${row.createTime}</p>
      </div>
    `,
    '发布详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '关闭',
      customStyle: { width: '700px' }
    }
  )
}

// 发布
const handlePublish = (row: TemplateRelease) => {
  if (row.status === 'published') {
    ElMessage.warning('该模板已发布')
    return
  }
  
  if (row.status === 'approving') {
    ElMessage.warning('该模板正在审批中，请等待审批完成')
    return
  }
  
  if (row.status === 'rejected') {
    ElMessage.warning('该模板审批被拒绝，请修改后重新提交')
    return
  }
  
  form.id = row.id
  form.environment = row.environment || 'production'
  form.description = row.description
  publishDialogVisible.value = true
}

// 撤回
const handleWithdraw = (row: TemplateRelease) => {
  if (row.status !== 'published') {
    ElMessage.warning('只能撤回已发布的模板')
    return
  }
  
  ElMessageBox.confirm(
    `确定要撤回模板"${row.templateName} v${row.versionNumber}"吗？`,
    '确认撤回',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    loading.value = true
    // 模拟撤回操作
    setTimeout(() => {
      const item = mockData.find(item => item.id === row.id)
      if (item) {
        item.status = 'withdrawn'
        item.publishTime = new Date().toLocaleString('zh-CN', { 
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
      ElMessage.success('撤回成功')
      loadTableData()
    }, 500)
  }).catch(() => {
    // 取消撤回
  })
}

// 查看发布历史
const handleHistory = (row: TemplateRelease) => {
  currentTemplate.value = row
  historyData.value = mockHistoryData[row.id] || []
  historyDialogVisible.value = true
}

// 提交发布
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      
      // 模拟发布操作
      setTimeout(() => {
        const item = mockData.find(item => item.id === form.id)
        if (item) {
          item.status = 'approving'
          item.environment = form.environment
          item.description = form.description
          item.approver = '李经理' // 模拟审批人
          
          const currentTime = new Date().toLocaleString('zh-CN', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false 
          }).replace(/\//g, '-')
          
          // 模拟审批通过
          setTimeout(() => {
            item.status = 'published'
            item.publishTime = currentTime
            item.approveTime = currentTime
            item.approveComment = '审批通过'
            loadTableData()
          }, 1000)
        }
        
        loading.value = false
        publishDialogVisible.value = false
        ElMessage.success('发布申请已提交，等待审批')
        loadTableData()
      }, 500)
    }
  })
}

// 取消发布
const handleCancel = () => {
  publishDialogVisible.value = false
  form.id = undefined
  form.environment = ''
  form.description = ''
  formRef.value?.clearValidate()
}

// 生命周期
onMounted(() => {
  loadTableData()
})
</script>

<template>
  <div class="template-publish-container">
    <!-- 页面标题 -->
    <el-card class="header-card" shadow="never">
      <div class="page-header">
        <div>
          <h2 class="page-title">模板发布管理</h2>
          <p class="page-description">
            管理模板从定稿到正式生效的全过程，确保只有经过充分评审和批准的标准化模板才能投入使用
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
        
        <el-form-item label="发布状态">
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
        
        <el-form-item label="发布环境">
          <el-select
            v-model="searchForm.environment"
            placeholder="请选择环境"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="item in environmentOptions"
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
          <span class="card-title">发布列表</span>
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
        
        <el-table-column prop="publisher" label="发布人" width="100" align="center" />
        
        <el-table-column prop="environment" label="发布环境" width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.environment" type="success" size="small">
              {{ getEnvironmentLabel(row.environment) }}
            </el-tag>
            <span v-else style="color: #909399">未指定</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="publishTime" label="发布时间" width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.publishTime">{{ row.publishTime }}</span>
            <span v-else style="color: #909399">-</span>
          </template>
        </el-table-column>
        
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
              v-if="row.status === 'pending' || row.status === 'rejected'"
              type="success"
              link
              size="small"
              @click="handlePublish(row)"
            >
              <el-icon><Upload /></el-icon>
              发布
            </el-button>
            <el-button
              v-if="row.status === 'published'"
              type="warning"
              link
              size="small"
              @click="handleWithdraw(row)"
            >
              <el-icon><Download /></el-icon>
              撤回
            </el-button>
            <el-button
              type="primary"
              link
              size="small"
              @click="handleHistory(row)"
            >
              <el-icon><Clock /></el-icon>
              历史
            </el-button>
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

    <!-- 发布弹窗 -->
    <el-dialog
      v-model="publishDialogVisible"
      title="发布模板"
      width="600px"
      :close-on-click-modal="false"
      @close="handleCancel"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="发布环境" prop="environment">
          <el-select
            v-model="form.environment"
            placeholder="请选择发布环境"
            style="width: 100%"
          >
            <el-option
              v-for="item in environmentOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="发布说明" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入发布说明，包括本次发布的主要内容和注意事项"
          />
        </el-form-item>
        
        <el-alert
          title="发布提示"
          type="info"
          :closable="false"
          style="margin-top: 10px"
        >
          <p>1. 模板发布后将进入审批流程</p>
          <p>2. 审批通过后模板将自动部署到选定环境</p>
          <p>3. 生产环境发布需谨慎，建议先在测试环境验证</p>
        </el-alert>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" :loading="loading" @click="handleSubmit">
            提交审批
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 发布历史弹窗 -->
    <el-dialog
      v-model="historyDialogVisible"
      title="发布历史"
      width="800px"
    >
      <div v-if="currentTemplate" class="history-header">
        <h3>{{ currentTemplate.templateName }} <el-tag size="small">v{{ currentTemplate.versionNumber }}</el-tag></h3>
        <p class="template-code-info">{{ currentTemplate.templateCode }}</p>
      </div>
      
      <el-timeline class="history-timeline">
        <el-timeline-item
          v-for="item in historyData"
          :key="item.id"
          :timestamp="item.operateTime"
          placement="top"
        >
          <el-card>
            <div class="history-item">
              <div class="history-title">
                <el-tag :type="item.operationType === '发布' ? 'success' : item.operationType === '审批通过' ? 'success' : 'info'" size="small">
                  {{ item.operationType }}
                </el-tag>
                <span class="operator">{{ item.operator }}</span>
              </div>
              <div class="history-content">
                <p><strong>版本：</strong>v{{ item.version }}</p>
                <p><strong>说明：</strong>{{ item.comment }}</p>
              </div>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
      
      <el-empty v-if="historyData.length === 0" description="暂无历史记录" />
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.template-publish-container {
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

  .history-header {
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #ebeef5;

    h3 {
      margin: 0 0 8px 0;
      font-size: 18px;
      color: #303133;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .template-code-info {
      margin: 0;
      font-size: 13px;
      color: #909399;
      font-family: 'Courier New', Courier, monospace;
    }
  }

  .history-timeline {
    padding: 10px 0;

    .history-item {
      .history-title {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;

        .operator {
          font-weight: 600;
          color: #303133;
        }
      }

      .history-content {
        p {
          margin: 5px 0;
          font-size: 14px;
          color: #606266;
          line-height: 1.6;

          strong {
            color: #303133;
          }
        }
      }
    }

    :deep(.el-card) {
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    :deep(.el-card__body) {
      padding: 15px;
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

  :deep(.el-alert) {
    p {
      margin: 5px 0;
      line-height: 1.6;
    }
  }
}
</style>