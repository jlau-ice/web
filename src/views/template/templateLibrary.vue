<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// 接口定义
interface Template {
  id: number
  templateName: string
  templateCode: string
  category: string
  templateType: string
  tags: string[]
  description: string
  content: string
  usageCount: number
  status: 'enabled' | 'disabled'
  enabled: boolean
  createTime: string
  updateTime: string
}

interface SearchForm {
  keyword: string
  category: string
  templateType: string
  status: string
}

// 响应式数据
const loading = ref(false)
const tableData = ref<Template[]>([])
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
const dialogTitle = ref('新增模板')
const formRef = ref<FormInstance>()

// 表单数据
const form = reactive<Partial<Template>>({
  id: undefined,
  templateName: '',
  templateCode: '',
  category: '',
  templateType: '',
  tags: [],
  description: '',
  content: '',
  status: 'enabled',
  enabled: true
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
  { label: '启用', value: 'enabled' },
  { label: '停用', value: 'disabled' }
]

// 标签选项
const tagOptions = [
  { label: '常用', value: 'common' },
  { label: '推荐', value: 'recommended' },
  { label: '新增', value: 'new' },
  { label: '热门', value: 'hot' },
  { label: '企业级', value: 'enterprise' },
  { label: '轻量级', value: 'lightweight' }
]

// 表单验证规则
const rules = reactive<FormRules>({
  templateName: [
    { required: true, message: '请输入模板名称', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  templateCode: [
    { required: true, message: '请输入模板编码', trigger: 'blur' },
    { pattern: /^[A-Z][A-Z0-9_]*$/, message: '以大写字母开头，只能包含大写字母、数字和下划线', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择所属分类', trigger: 'change' }
  ],
  templateType: [
    { required: true, message: '请选择模板类型', trigger: 'change' }
  ]
})

// Mock 数据
const mockData: Template[] = [
  {
    id: 1,
    templateName: '用户信息数据元模板',
    templateCode: 'TPL_USER_DATA_ELEMENT',
    category: 'data',
    templateType: 'standard',
    tags: ['common', 'recommended'],
    description: '包含用户基础信息的数据元标准模板，包括姓名、身份证号、手机号、邮箱等常用字段',
    content: '{ userId, userName, idCard, phone, email, gender, birthDate }',
    usageCount: 156,
    status: 'enabled',
    enabled: true,
    createTime: '2024-01-15 10:30:00',
    updateTime: '2024-01-15 10:30:00'
  },
  {
    id: 2,
    templateName: 'RESTful API接口模板',
    templateCode: 'TPL_RESTFUL_API',
    category: 'interface',
    templateType: 'standard',
    tags: ['common', 'hot'],
    description: '标准RESTful API接口模板，包含统一的请求响应格式、错误处理和分页结构',
    content: '{ code, message, data, pagination: { page, size, total } }',
    usageCount: 289,
    status: 'enabled',
    enabled: true,
    createTime: '2024-01-16 14:20:00',
    updateTime: '2024-01-16 14:20:00'
  },
  {
    id: 3,
    templateName: '订单数据标准模板',
    templateCode: 'TPL_ORDER_DATA',
    category: 'data',
    templateType: 'business',
    tags: ['recommended', 'enterprise'],
    description: '电商订单数据标准模板，涵盖订单基本信息、商品明细、物流信息等',
    content: '{ orderId, orderNo, userId, products[], amount, status, logistics }',
    usageCount: 198,
    status: 'enabled',
    enabled: true,
    createTime: '2024-01-17 09:15:00',
    updateTime: '2024-01-17 09:15:00'
  },
  {
    id: 4,
    templateName: '月度销售报表模板',
    templateCode: 'TPL_SALES_REPORT_MONTHLY',
    category: 'report',
    templateType: 'business',
    tags: ['common'],
    description: '月度销售统计报表模板，包含销售额、订单量、客户数等关键指标',
    content: 'Excel template with charts and pivot tables',
    usageCount: 87,
    status: 'enabled',
    enabled: true,
    createTime: '2024-01-18 11:45:00',
    updateTime: '2024-01-18 11:45:00'
  },
  {
    id: 5,
    templateName: '审批流程模板',
    templateCode: 'TPL_APPROVAL_WORKFLOW',
    category: 'workflow',
    templateType: 'standard',
    tags: ['common', 'enterprise'],
    description: '通用审批流程模板，支持多级审批、会签、加签等功能',
    content: 'BPMN 2.0 workflow definition',
    usageCount: 134,
    status: 'enabled',
    enabled: true,
    createTime: '2024-01-19 16:30:00',
    updateTime: '2024-01-19 16:30:00'
  },
  {
    id: 6,
    templateName: '用户注册表单模板',
    templateCode: 'TPL_USER_REGISTER_FORM',
    category: 'form',
    templateType: 'basic',
    tags: ['common', 'lightweight'],
    description: '标准用户注册表单模板，包含必填项验证和实时校验',
    content: 'Form fields: username, password, email, phone, verification code',
    usageCount: 245,
    status: 'enabled',
    enabled: true,
    createTime: '2024-01-20 13:20:00',
    updateTime: '2024-01-20 13:20:00'
  },
  {
    id: 7,
    templateName: '技术文档模板',
    templateCode: 'TPL_TECH_DOCUMENT',
    category: 'document',
    templateType: 'standard',
    tags: ['recommended'],
    description: '技术设计文档标准模板，包含需求分析、系统设计、接口定义等章节',
    content: 'Markdown template with standard sections',
    usageCount: 76,
    status: 'enabled',
    enabled: true,
    createTime: '2024-01-21 10:00:00',
    updateTime: '2024-01-21 10:00:00'
  },
  {
    id: 8,
    templateName: 'Vue组件代码模板',
    templateCode: 'TPL_VUE_COMPONENT',
    category: 'code',
    templateType: 'basic',
    tags: ['common', 'new'],
    description: 'Vue 3 + TypeScript组件代码模板，包含完整的script、template、style结构',
    content: 'Vue 3 Composition API component template',
    usageCount: 312,
    status: 'enabled',
    enabled: true,
    createTime: '2024-01-22 15:30:00',
    updateTime: '2024-01-22 15:30:00'
  },
  {
    id: 9,
    templateName: '微服务配置模板',
    templateCode: 'TPL_MICROSERVICE_CONFIG',
    category: 'config',
    templateType: 'standard',
    tags: ['enterprise'],
    description: '微服务应用配置模板，包含服务注册、配置中心、监控等配置项',
    content: 'YAML configuration template',
    usageCount: 89,
    status: 'disabled',
    enabled: false,
    createTime: '2024-01-23 09:20:00',
    updateTime: '2024-01-23 09:20:00'
  },
  {
    id: 10,
    templateName: '数据库表设计模板',
    templateCode: 'TPL_DATABASE_TABLE',
    category: 'data',
    templateType: 'standard',
    tags: ['common', 'recommended'],
    description: '数据库表结构设计模板，包含主键、索引、字段类型等规范',
    content: 'DDL template with best practices',
    usageCount: 167,
    status: 'enabled',
    enabled: true,
    createTime: '2024-01-24 14:40:00',
    updateTime: '2024-01-24 14:40:00'
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
      item.description.toLowerCase().includes(keyword)
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

// 获取分类颜色
const getCategoryColor = (category: string) => {
  const colorMap: Record<string, string> = {
    data: 'primary',
    interface: 'success',
    report: 'warning',
    workflow: 'danger',
    form: 'info',
    document: '',
    code: 'primary',
    config: 'warning'
  }
  return colorMap[category] || ''
}

// 获取标签颜色
const getTagColor = (tag: string) => {
  const colorMap: Record<string, string> = {
    common: '',
    recommended: 'success',
    new: 'danger',
    hot: 'warning',
    enterprise: 'primary',
    lightweight: 'info'
  }
  return colorMap[tag] || ''
}

// 获取标签标签
const getTagLabel = (value: string) => {
  const option = tagOptions.find(opt => opt.value === value)
  return option ? option.label : value
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
  dialogTitle.value = '新增模板'
  resetForm()
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: Template) => {
  dialogTitle.value = '编辑模板'
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

// 查看详情
const handleView = (row: Template) => {
  const tagsHtml = row.tags.map(tag => 
    `<span style="display: inline-block; margin-right: 8px; padding: 2px 8px; background: #e1f3f8; color: #409eff; border-radius: 3px; font-size: 12px;">${getTagLabel(tag)}</span>`
  ).join('')
  
  ElMessageBox.alert(
    `
      <div style="line-height: 2;">
        <p><strong>模板名称：</strong>${row.templateName}</p>
        <p><strong>模板编码：</strong><code style="padding: 2px 6px; background: #f5f7fa; border-radius: 3px;">${row.templateCode}</code></p>
        <p><strong>所属分类：</strong>${getCategoryLabel(row.category)}</p>
        <p><strong>模板类型：</strong>${getTypeLabel(row.templateType)}</p>
        <p><strong>模板标签：</strong>${tagsHtml || '无'}</p>
        <p><strong>使用次数：</strong>${row.usageCount} 次</p>
        <p><strong>模板描述：</strong>${row.description}</p>
        <p><strong>模板内容：</strong></p>
        <pre style="background: #f5f7fa; padding: 10px; border-radius: 4px; font-size: 12px; overflow-x: auto;">${row.content}</pre>
        <p><strong>状态：</strong>${row.status === 'enabled' ? '启用' : '停用'}</p>
        <p><strong>创建时间：</strong>${row.createTime}</p>
        <p><strong>更新时间：</strong>${row.updateTime}</p>
      </div>
    `,
    '模板详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '关闭',
      customStyle: { width: '700px' }
    }
  )
}

// 删除
const handleDelete = (row: Template) => {
  ElMessageBox.confirm(
    `确定要删除模板"${row.templateName}"吗？此操作不可恢复。`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    loading.value = true
    // 模拟删除操作
    setTimeout(() => {
      const index = mockData.findIndex(item => item.id === row.id)
      if (index > -1) {
        mockData.splice(index, 1)
      }
      loading.value = false
      ElMessage.success('删除成功')
      loadTableData()
    }, 500)
  }).catch(() => {
    // 取消删除
  })
}

// 切换状态
const handleStatusChange = (row: Template) => {
  loading.value = true
  // 模拟状态切换
  setTimeout(() => {
    const item = mockData.find(item => item.id === row.id)
    if (item) {
      item.enabled = row.enabled
      item.status = row.enabled ? 'enabled' : 'disabled'
      item.updateTime = new Date().toLocaleString('zh-CN', { 
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
    ElMessage.success(`已${row.enabled ? '启用' : '停用'}`)
    loadTableData()
  }, 300)
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
              updateTime: currentTime
            } as Template
          }
          ElMessage.success('编辑成功')
        } else {
          // 新增
          const newItem: Template = {
            id: Math.max(...mockData.map(item => item.id)) + 1,
            templateName: form.templateName!,
            templateCode: form.templateCode!,
            category: form.category!,
            templateType: form.templateType!,
            tags: form.tags || [],
            description: form.description!,
            content: form.content!,
            usageCount: 0,
            status: form.enabled ? 'enabled' : 'disabled',
            enabled: form.enabled!,
            createTime: currentTime,
            updateTime: currentTime
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
  form.category = ''
  form.templateType = ''
  form.tags = []
  form.description = ''
  form.content = ''
  form.status = 'enabled'
  form.enabled = true
  
  formRef.value?.clearValidate()
}

// 生命周期
onMounted(() => {
  loadTableData()
})
</script>

<template>
  <div class="template-library-container">
    <!-- 页面标题 -->
    <el-card class="header-card" shadow="never">
      <div class="page-header">
        <div>
          <h2 class="page-title">模板库管理</h2>
          <p class="page-description">
            将各类标准封装成可复用、场景化的模板，提供预设标准组件和结构，大幅提升数据标准在新建项目或系统中的应用效率
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
            placeholder="请输入模板名称或编码"
            clearable
            style="width: 240px"
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
        
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 120px"
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
          <span class="card-title">模板列表</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增模板
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
        
        <el-table-column prop="templateName" label="模板名称" min-width="180" show-overflow-tooltip />
        
        <el-table-column prop="templateCode" label="模板编码" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <code class="template-code">{{ row.templateCode }}</code>
          </template>
        </el-table-column>
        
        <el-table-column prop="category" label="所属分类" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="getCategoryColor(row.category)" size="small">
              {{ getCategoryLabel(row.category) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="templateType" label="模板类型" width="110" align="center">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ getTypeLabel(row.templateType) }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="tags" label="标签" min-width="150">
          <template #default="{ row }">
            <el-tag
              v-for="tag in row.tags"
              :key="tag"
              :type="getTagColor(tag)"
              size="small"
              style="margin-right: 4px"
            >
              {{ getTagLabel(tag) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="usageCount" label="使用次数" width="100" align="center">
          <template #default="{ row }">
            <span style="color: #409eff; font-weight: 500">{{ row.usageCount }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.enabled"
              :loading="loading"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        
        <el-table-column prop="createTime" label="创建时间" width="160" show-overflow-tooltip />
        
        <el-table-column label="操作" width="220" align="center" fixed="right">
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
              @click="handleEdit(row)"
            >
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button
              type="danger"
              link
              size="small"
              @click="handleDelete(row)"
            >
              <el-icon><Delete /></el-icon>
              删除
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
                placeholder="如：用户信息数据元模板"
                clearable
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="模板编码" prop="templateCode">
              <el-input
                v-model="form.templateCode"
                placeholder="如：TPL_USER_DATA"
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
        
        <el-form-item label="模板标签" prop="tags">
          <el-select
            v-model="form.tags"
            multiple
            placeholder="请选择模板标签"
            style="width: 100%"
          >
            <el-option
              v-for="item in tagOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="模板描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入模板的详细描述"
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
        
        <el-form-item label="是否启用">
          <el-switch v-model="form.enabled" />
          <span style="margin-left: 10px; color: #909399; font-size: 13px">
            {{ form.enabled ? '启用' : '停用' }}
          </span>
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
  </div>
</template>

<style scoped lang="scss">
.template-library-container {
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