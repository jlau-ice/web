<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// 接口定义
interface InterfaceStandard {
  id: number
  interfaceName: string
  interfaceCode: string
  systemService: string
  requestMethod: string
  requestParams: string
  responseParams: string
  protocol: string
  description: string
  status: 'enabled' | 'disabled'
  enabled: boolean
  createTime: string
  updateTime: string
}

interface SearchForm {
  keyword: string
  systemService: string
  requestMethod: string
  status: string
}

// 响应式数据
const loading = ref(false)
const tableData = ref<InterfaceStandard[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 搜索表单
const searchForm = reactive<SearchForm>({
  keyword: '',
  systemService: '',
  requestMethod: '',
  status: ''
})

// 弹窗相关
const dialogVisible = ref(false)
const dialogTitle = ref('新增接口标准')
const formRef = ref<FormInstance>()

// 表单数据
const form = reactive<Partial<InterfaceStandard>>({
  id: undefined,
  interfaceName: '',
  interfaceCode: '',
  systemService: '',
  requestMethod: '',
  requestParams: '',
  responseParams: '',
  protocol: '',
  description: '',
  status: 'enabled',
  enabled: true
})

// 所属系统/服务选项
const systemServiceOptions = [
  { label: '用户服务', value: 'user-service' },
  { label: '订单服务', value: 'order-service' },
  { label: '支付服务', value: 'payment-service' },
  { label: '产品服务', value: 'product-service' },
  { label: '物流服务', value: 'logistics-service' },
  { label: '消息服务', value: 'message-service' },
  { label: '认证服务', value: 'auth-service' },
  { label: '数据服务', value: 'data-service' }
]

// 请求方法选项
const requestMethodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'PATCH', value: 'PATCH' }
]

// 协议选项
const protocolOptions = [
  { label: 'HTTP/HTTPS', value: 'HTTP' },
  { label: 'WebSocket', value: 'WebSocket' },
  { label: 'gRPC', value: 'gRPC' },
  { label: 'REST', value: 'REST' },
  { label: 'GraphQL', value: 'GraphQL' }
]

// 状态选项
const statusOptions = [
  { label: '启用', value: 'enabled' },
  { label: '停用', value: 'disabled' }
]

// 表单验证规则
const rules = reactive<FormRules>({
  interfaceName: [
    { required: true, message: '请输入接口名称', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  interfaceCode: [
    { required: true, message: '请输入接口编码', trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9_/.-]*$/, message: '以字母开头，可包含字母、数字、下划线、点、斜杠和横杠', trigger: 'blur' }
  ],
  systemService: [
    { required: true, message: '请选择所属系统/服务', trigger: 'change' }
  ],
  requestMethod: [
    { required: true, message: '请选择请求方法', trigger: 'change' }
  ],
  protocol: [
    { required: true, message: '请选择协议类型', trigger: 'change' }
  ]
})

// Mock 数据
const mockData: InterfaceStandard[] = [
  {
    id: 1,
    interfaceName: '用户登录接口',
    interfaceCode: '/api/v1/auth/login',
    systemService: 'auth-service',
    requestMethod: 'POST',
    requestParams: '{ username: string, password: string }',
    responseParams: '{ token: string, userInfo: object }',
    protocol: 'HTTP',
    description: '用户登录认证接口，返回访问令牌和用户基本信息',
    status: 'enabled',
    enabled: true,
    createTime: '2024-01-15 10:30:00',
    updateTime: '2024-01-15 10:30:00'
  },
  {
    id: 2,
    interfaceName: '用户注册接口',
    interfaceCode: '/api/v1/auth/register',
    systemService: 'auth-service',
    requestMethod: 'POST',
    requestParams: '{ username: string, password: string, email: string, phone: string }',
    responseParams: '{ userId: number, message: string }',
    protocol: 'HTTP',
    description: '新用户注册接口，创建用户账号',
    status: 'enabled',
    enabled: true,
    createTime: '2024-01-16 14:20:00',
    updateTime: '2024-01-16 14:20:00'
  },
  {
    id: 3,
    interfaceName: '获取用户信息',
    interfaceCode: '/api/v1/user/:id',
    systemService: 'user-service',
    requestMethod: 'GET',
    requestParams: '{ id: number }',
    responseParams: '{ userId: number, username: string, email: string, phone: string, avatar: string }',
    protocol: 'REST',
    description: '根据用户ID获取用户详细信息',
    status: 'enabled',
    enabled: true,
    createTime: '2024-01-17 09:15:00',
    updateTime: '2024-01-17 09:15:00'
  },
  {
    id: 4,
    interfaceName: '创建订单接口',
    interfaceCode: '/api/v1/order/create',
    systemService: 'order-service',
    requestMethod: 'POST',
    requestParams: '{ userId: number, productId: number, quantity: number, addressId: number }',
    responseParams: '{ orderId: string, orderNo: string, amount: number, status: string }',
    protocol: 'HTTP',
    description: '创建新订单，生成订单号并返回订单信息',
    status: 'enabled',
    enabled: true,
    createTime: '2024-01-18 11:45:00',
    updateTime: '2024-01-18 11:45:00'
  },
  {
    id: 5,
    interfaceName: '查询订单详情',
    interfaceCode: '/api/v1/order/:orderId',
    systemService: 'order-service',
    requestMethod: 'GET',
    requestParams: '{ orderId: string }',
    responseParams: '{ order: object, products: array, logistics: object }',
    protocol: 'REST',
    description: '根据订单ID查询订单详细信息，包括商品和物流信息',
    status: 'enabled',
    enabled: true,
    createTime: '2024-01-19 16:30:00',
    updateTime: '2024-01-19 16:30:00'
  },
  {
    id: 6,
    interfaceName: '支付订单接口',
    interfaceCode: '/api/v1/payment/pay',
    systemService: 'payment-service',
    requestMethod: 'POST',
    requestParams: '{ orderId: string, payMethod: string, amount: number }',
    responseParams: '{ paymentId: string, payUrl: string, qrCode: string }',
    protocol: 'HTTP',
    description: '订单支付接口，支持多种支付方式',
    status: 'enabled',
    enabled: true,
    createTime: '2024-01-20 13:20:00',
    updateTime: '2024-01-20 13:20:00'
  },
  {
    id: 7,
    interfaceName: '支付回调接口',
    interfaceCode: '/api/v1/payment/callback',
    systemService: 'payment-service',
    requestMethod: 'POST',
    requestParams: '{ paymentId: string, status: string, tradeNo: string }',
    responseParams: '{ success: boolean, message: string }',
    protocol: 'HTTP',
    description: '第三方支付平台回调接口，更新支付状态',
    status: 'enabled',
    enabled: true,
    createTime: '2024-01-21 10:00:00',
    updateTime: '2024-01-21 10:00:00'
  },
  {
    id: 8,
    interfaceName: '商品列表查询',
    interfaceCode: '/api/v1/product/list',
    systemService: 'product-service',
    requestMethod: 'GET',
    requestParams: '{ page: number, size: number, category: string, keyword: string }',
    responseParams: '{ products: array, total: number, page: number }',
    protocol: 'REST',
    description: '分页查询商品列表，支持分类和关键字筛选',
    status: 'enabled',
    enabled: true,
    createTime: '2024-01-22 15:30:00',
    updateTime: '2024-01-22 15:30:00'
  },
  {
    id: 9,
    interfaceName: '物流追踪接口',
    interfaceCode: '/api/v1/logistics/track',
    systemService: 'logistics-service',
    requestMethod: 'GET',
    requestParams: '{ trackingNo: string }',
    responseParams: '{ status: string, location: string, timeline: array }',
    protocol: 'HTTP',
    description: '根据物流单号查询物流信息和配送进度',
    status: 'enabled',
    enabled: true,
    createTime: '2024-01-23 09:20:00',
    updateTime: '2024-01-23 09:20:00'
  },
  {
    id: 10,
    interfaceName: '消息推送接口',
    interfaceCode: '/api/v1/message/push',
    systemService: 'message-service',
    requestMethod: 'POST',
    requestParams: '{ userId: number, title: string, content: string, type: string }',
    responseParams: '{ messageId: string, success: boolean }',
    protocol: 'HTTP',
    description: '向指定用户推送系统消息或通知',
    status: 'disabled',
    enabled: false,
    createTime: '2024-01-24 14:40:00',
    updateTime: '2024-01-24 14:40:00'
  },
  {
    id: 11,
    interfaceName: 'WebSocket连接',
    interfaceCode: '/ws/v1/realtime',
    systemService: 'message-service',
    requestMethod: 'GET',
    requestParams: '{ token: string }',
    responseParams: '{ connection: websocket }',
    protocol: 'WebSocket',
    description: '建立WebSocket长连接，用于实时消息推送',
    status: 'enabled',
    enabled: true,
    createTime: '2024-01-25 11:15:00',
    updateTime: '2024-01-25 11:15:00'
  },
  {
    id: 12,
    interfaceName: '数据导出接口',
    interfaceCode: '/api/v1/data/export',
    systemService: 'data-service',
    requestMethod: 'POST',
    requestParams: '{ type: string, startDate: string, endDate: string, format: string }',
    responseParams: '{ fileUrl: string, fileName: string }',
    protocol: 'HTTP',
    description: '数据导出接口，支持多种格式（Excel、CSV、JSON）',
    status: 'enabled',
    enabled: true,
    createTime: '2024-01-26 16:50:00',
    updateTime: '2024-01-26 16:50:00'
  }
]

// 计算属性：过滤后的数据
const filteredData = computed(() => {
  let data = [...mockData]
  
  // 关键字搜索
  if (searchForm.keyword) {
    const keyword = searchForm.keyword.toLowerCase()
    data = data.filter(item => 
      item.interfaceName.toLowerCase().includes(keyword) ||
      item.interfaceCode.toLowerCase().includes(keyword) ||
      item.description.toLowerCase().includes(keyword)
    )
  }
  
  // 系统/服务筛选
  if (searchForm.systemService) {
    data = data.filter(item => item.systemService === searchForm.systemService)
  }
  
  // 请求方法筛选
  if (searchForm.requestMethod) {
    data = data.filter(item => item.requestMethod === searchForm.requestMethod)
  }
  
  // 状态筛选
  if (searchForm.status) {
    data = data.filter(item => item.status === searchForm.status)
  }
  
  return data
})

// 获取系统/服务标签
const getSystemServiceLabel = (value: string) => {
  const option = systemServiceOptions.find(opt => opt.value === value)
  return option ? option.label : value
}

// 获取请求方法颜色
const getMethodColor = (method: string) => {
  const colorMap: Record<string, string> = {
    GET: 'success',
    POST: 'primary',
    PUT: 'warning',
    DELETE: 'danger',
    PATCH: 'info'
  }
  return colorMap[method] || ''
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
  searchForm.systemService = ''
  searchForm.requestMethod = ''
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
  dialogTitle.value = '新增接口标准'
  resetForm()
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: InterfaceStandard) => {
  dialogTitle.value = '编辑接口标准'
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

// 查看详情
const handleView = (row: InterfaceStandard) => {
  ElMessageBox.alert(
    `
      <div style="line-height: 2;">
        <p><strong>接口名称：</strong>${row.interfaceName}</p>
        <p><strong>接口编码：</strong><code style="padding: 2px 6px; background: #f5f7fa; border-radius: 3px;">${row.interfaceCode}</code></p>
        <p><strong>所属系统：</strong>${getSystemServiceLabel(row.systemService)}</p>
        <p><strong>请求方法：</strong><span style="color: #409eff;">${row.requestMethod}</span></p>
        <p><strong>协议类型：</strong>${row.protocol}</p>
        <p><strong>请求参数：</strong></p>
        <pre style="background: #f5f7fa; padding: 10px; border-radius: 4px; font-size: 12px; overflow-x: auto;">${row.requestParams}</pre>
        <p><strong>响应参数：</strong></p>
        <pre style="background: #f5f7fa; padding: 10px; border-radius: 4px; font-size: 12px; overflow-x: auto;">${row.responseParams}</pre>
        <p><strong>接口描述：</strong>${row.description}</p>
        <p><strong>状态：</strong>${row.status === 'enabled' ? '启用' : '停用'}</p>
        <p><strong>创建时间：</strong>${row.createTime}</p>
        <p><strong>更新时间：</strong>${row.updateTime}</p>
      </div>
    `,
    '接口标准详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '关闭',
      customStyle: { width: '700px' }
    }
  )
}

// 删除
const handleDelete = (row: InterfaceStandard) => {
  ElMessageBox.confirm(
    `确定要删除接口"${row.interfaceName}"吗？此操作不可恢复。`,
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
const handleStatusChange = (row: InterfaceStandard) => {
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
            } as InterfaceStandard
          }
          ElMessage.success('编辑成功')
        } else {
          // 新增
          const newItem: InterfaceStandard = {
            id: Math.max(...mockData.map(item => item.id)) + 1,
            interfaceName: form.interfaceName!,
            interfaceCode: form.interfaceCode!,
            systemService: form.systemService!,
            requestMethod: form.requestMethod!,
            requestParams: form.requestParams!,
            responseParams: form.responseParams!,
            protocol: form.protocol!,
            description: form.description!,
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
  form.interfaceName = ''
  form.interfaceCode = ''
  form.systemService = ''
  form.requestMethod = ''
  form.requestParams = ''
  form.responseParams = ''
  form.protocol = ''
  form.description = ''
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
  <div class="interface-standard-container">
    <!-- 页面标题 -->
    <el-card class="header-card" shadow="never">
      <div class="page-header">
        <div>
          <h2 class="page-title">接口标准管理</h2>
          <p class="page-description">
            规范不同应用、服务或组件之间进行数据交换时的技术协议和数据格式，降低系统集成复杂度，提高数据交互效率和可靠性
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
            placeholder="请输入接口名称或编码"
            clearable
            style="width: 240px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        
        <el-form-item label="所属系统">
          <el-select
            v-model="searchForm.systemService"
            placeholder="请选择系统"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="item in systemServiceOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="请求方法">
          <el-select
            v-model="searchForm.requestMethod"
            placeholder="请选择方法"
            clearable
            style="width: 120px"
          >
            <el-option
              v-for="item in requestMethodOptions"
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
          <span class="card-title">接口标准列表</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增接口
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
        
        <el-table-column prop="interfaceName" label="接口名称" min-width="150" show-overflow-tooltip />
        
        <el-table-column prop="interfaceCode" label="接口编码" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <code class="interface-code">{{ row.interfaceCode }}</code>
          </template>
        </el-table-column>
        
        <el-table-column prop="systemService" label="所属系统" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="primary" size="small">{{ getSystemServiceLabel(row.systemService) }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="requestMethod" label="请求方法" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getMethodColor(row.requestMethod)" size="small">
              {{ row.requestMethod }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="protocol" label="协议" width="110" align="center">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.protocol }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="requestParams" label="请求参数" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <code class="params-code">{{ row.requestParams }}</code>
          </template>
        </el-table-column>
        
        <el-table-column prop="responseParams" label="响应参数" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <code class="params-code">{{ row.responseParams }}</code>
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
            <el-form-item label="接口名称" prop="interfaceName">
              <el-input
                v-model="form.interfaceName"
                placeholder="如：用户登录接口"
                clearable
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="接口编码" prop="interfaceCode">
              <el-input
                v-model="form.interfaceCode"
                placeholder="如：/api/v1/auth/login"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属系统" prop="systemService">
              <el-select
                v-model="form.systemService"
                placeholder="请选择所属系统"
                style="width: 100%"
              >
                <el-option
                  v-for="item in systemServiceOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="请求方法" prop="requestMethod">
              <el-select
                v-model="form.requestMethod"
                placeholder="请选择请求方法"
                style="width: 100%"
              >
                <el-option
                  v-for="item in requestMethodOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="协议类型" prop="protocol">
          <el-select
            v-model="form.protocol"
            placeholder="请选择协议类型"
            style="width: 100%"
          >
            <el-option
              v-for="item in protocolOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="请求参数" prop="requestParams">
          <el-input
            v-model="form.requestParams"
            type="textarea"
            :rows="3"
            placeholder="如：{ username: string, password: string }"
          />
        </el-form-item>
        
        <el-form-item label="响应参数" prop="responseParams">
          <el-input
            v-model="form.responseParams"
            type="textarea"
            :rows="3"
            placeholder="如：{ token: string, userInfo: object }"
          />
        </el-form-item>
        
        <el-form-item label="接口描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入接口的详细描述"
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
.interface-standard-container {
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

    .interface-code,
    .params-code {
      padding: 2px 8px;
      background-color: #f5f7fa;
      border: 1px solid #e4e7ed;
      border-radius: 3px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      color: #409eff;
      display: inline-block;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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