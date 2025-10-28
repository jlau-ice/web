<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElNotification, ElMessageBox } from 'element-plus'

// ==================== 类型定义 ====================
interface TestCase {
  id: string
  name: string
  description: string
  serviceId: string
  serviceName: string
  enabled: boolean
  status: 'success' | 'failed' | 'error' | 'running' | 'pending'
  lastExecutionTime: string
  executionCount: number
  successCount: number
  failedCount: number
  inputParams: Record<string, any>
  expectedOutput: Record<string, any>
  actualOutput?: Record<string, any>
  createdAt: string
  updatedAt: string
}

interface ExecutionHistory {
  id: string
  testCaseId: string
  executionTime: string
  result: 'success' | 'failed' | 'error'
  duration: number
  logs: string[]
  inputParams: Record<string, any>
  expectedOutput: Record<string, any>
  actualOutput: Record<string, any>
}

interface Service {
  id: string
  name: string
  description: string
}

// ==================== 状态管理 ====================
const loading = ref(false)
const searchKeyword = ref('')
const statusFilter = ref('all')
const selectedCases = ref<string[]>([])

// 测试用例列表
const testCaseList = ref<TestCase[]>([])
const serviceList = ref<Service[]>([])
const executionHistoryList = ref<ExecutionHistory[]>([])

// 对话框状态
const dialogVisible = ref(false)
const dialogTitle = ref('新增测试用例')
const isEditing = ref(false)
const selectedCase = ref<TestCase | null>(null)

// 执行详情对话框
const executionDialogVisible = ref(false)
const executionLogs = ref<string[]>([])
const executionProgress = ref(0)
const isExecuting = ref(false)

// 执行历史对话框
const historyDialogVisible = ref(false)
const currentHistory = ref<ExecutionHistory[]>([])

// 详情对话框
const detailDialogVisible = ref(false)

// 表单数据
const formData = reactive<Partial<TestCase>>({
  name: '',
  description: '',
  serviceId: '',
  serviceName: '',
  enabled: true,
  status: 'pending',
  inputParams: {},
  expectedOutput: {},
})

// 临时参数编辑
const tempInputParams = ref<Array<{ key: string; value: any; type: string }>>([])
const tempExpectedOutput = ref<Array<{ key: string; value: any; type: string }>>([])

// 统计数据
const statistics = reactive({
  total: 0,
  enabled: 0,
  disabled: 0,
  success: 0,
  failed: 0,
  pending: 0,
  successRate: 0,
})

// ==================== Mock 数据 ====================
const loadMockData = async () => {
  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 800))

  // 服务列表
  serviceList.value = [
    { id: 'service_001', name: '用户认证服务', description: '负责用户登录、注册、权限验证' },
    { id: 'service_002', name: '订单处理服务', description: '处理订单创建、更新、查询' },
    { id: 'service_003', name: '支付网关服务', description: '对接第三方支付平台' },
    { id: 'service_004', name: '消息通知服务', description: '发送邮件、短信、推送通知' },
    { id: 'service_005', name: '数据分析服务', description: '业务数据统计分析' },
  ]

  // 测试用例列表
  testCaseList.value = [
    {
      id: 'case_001',
      name: '用户登录-正常流程',
      description: '测试用户使用正确的用户名和密码登录',
      serviceId: 'service_001',
      serviceName: '用户认证服务',
      enabled: true,
      status: 'success',
      lastExecutionTime: '2024-01-25 14:30:25',
      executionCount: 156,
      successCount: 154,
      failedCount: 2,
      inputParams: {
        username: 'testuser',
        password: 'Test@123456',
      },
      expectedOutput: {
        code: 200,
        message: '登录成功',
        token: 'string',
      },
      actualOutput: {
        code: 200,
        message: '登录成功',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
      createdAt: '2024-01-10 10:00:00',
      updatedAt: '2024-01-25 14:30:25',
    },
    {
      id: 'case_002',
      name: '用户登录-密码错误',
      description: '测试用户使用错误密码登录时的处理',
      serviceId: 'service_001',
      serviceName: '用户认证服务',
      enabled: true,
      status: 'success',
      lastExecutionTime: '2024-01-25 14:28:15',
      executionCount: 89,
      successCount: 89,
      failedCount: 0,
      inputParams: {
        username: 'testuser',
        password: 'wrongpassword',
      },
      expectedOutput: {
        code: 401,
        message: '用户名或密码错误',
      },
      actualOutput: {
        code: 401,
        message: '用户名或密码错误',
      },
      createdAt: '2024-01-10 10:15:00',
      updatedAt: '2024-01-25 14:28:15',
    },
    {
      id: 'case_003',
      name: '创建订单-成功',
      description: '测试创建新订单的正常流程',
      serviceId: 'service_002',
      serviceName: '订单处理服务',
      enabled: true,
      status: 'failed',
      lastExecutionTime: '2024-01-25 13:45:10',
      executionCount: 67,
      successCount: 65,
      failedCount: 2,
      inputParams: {
        userId: 'user_12345',
        productId: 'prod_001',
        quantity: 2,
        totalAmount: 299.8,
      },
      expectedOutput: {
        code: 200,
        orderId: 'string',
        status: 'pending',
      },
      actualOutput: {
        code: 500,
        message: '库存不足',
      },
      createdAt: '2024-01-12 09:30:00',
      updatedAt: '2024-01-25 13:45:10',
    },
    {
      id: 'case_004',
      name: '支付处理-微信支付',
      description: '测试微信支付流程',
      serviceId: 'service_003',
      serviceName: '支付网关服务',
      enabled: true,
      status: 'success',
      lastExecutionTime: '2024-01-25 12:20:30',
      executionCount: 45,
      successCount: 43,
      failedCount: 2,
      inputParams: {
        orderId: 'order_12345',
        amount: 299.8,
        paymentMethod: 'wechat',
      },
      expectedOutput: {
        code: 200,
        transactionId: 'string',
        status: 'success',
      },
      actualOutput: {
        code: 200,
        transactionId: 'wx_20240125122030_001',
        status: 'success',
      },
      createdAt: '2024-01-15 11:00:00',
      updatedAt: '2024-01-25 12:20:30',
    },
    {
      id: 'case_005',
      name: '发送邮件通知',
      description: '测试邮件发送功能',
      serviceId: 'service_004',
      serviceName: '消息通知服务',
      enabled: false,
      status: 'pending',
      lastExecutionTime: '2024-01-20 10:15:00',
      executionCount: 23,
      successCount: 22,
      failedCount: 1,
      inputParams: {
        to: 'user@example.com',
        subject: '订单确认',
        content: '您的订单已确认',
      },
      expectedOutput: {
        code: 200,
        messageId: 'string',
        status: 'sent',
      },
      createdAt: '2024-01-18 14:00:00',
      updatedAt: '2024-01-20 10:15:00',
    },
    {
      id: 'case_006',
      name: '数据统计-日报表',
      description: '测试生成日报表功能',
      serviceId: 'service_005',
      serviceName: '数据分析服务',
      enabled: true,
      status: 'success',
      lastExecutionTime: '2024-01-25 08:00:00',
      executionCount: 120,
      successCount: 118,
      failedCount: 2,
      inputParams: {
        date: '2024-01-24',
        reportType: 'daily',
      },
      expectedOutput: {
        code: 200,
        data: {
          totalOrders: 'number',
          totalRevenue: 'number',
        },
      },
      actualOutput: {
        code: 200,
        data: {
          totalOrders: 1234,
          totalRevenue: 56789.5,
        },
      },
      createdAt: '2024-01-05 08:00:00',
      updatedAt: '2024-01-25 08:00:00',
    },
  ]

  // 更新统计数据
  updateStatistics()

  loading.value = false
}

// ==================== 计算属性 ====================
const filteredTestCases = computed(() => {
  let filtered = testCaseList.value

  // 状态筛选
  if (statusFilter.value !== 'all') {
    if (statusFilter.value === 'enabled') {
      filtered = filtered.filter(tc => tc.enabled)
    } else if (statusFilter.value === 'disabled') {
      filtered = filtered.filter(tc => !tc.enabled)
    }
  }

  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(
      tc =>
        tc.name.toLowerCase().includes(keyword) ||
        tc.serviceName.toLowerCase().includes(keyword) ||
        tc.description.toLowerCase().includes(keyword)
    )
  }

  return filtered
})

const statusTagType = (status: string) => {
  const typeMap: Record<string, any> = {
    success: 'success',
    failed: 'danger',
    error: 'danger',
    running: 'primary',
    pending: 'info',
  }
  return typeMap[status] || 'info'
}

const statusText = (status: string) => {
  const textMap: Record<string, string> = {
    success: '成功',
    failed: '失败',
    error: '错误',
    running: '执行中',
    pending: '未执行',
  }
  return textMap[status] || '未知'
}

// ==================== 核心功能 ====================

// 更新统计数据
const updateStatistics = () => {
  statistics.total = testCaseList.value.length
  statistics.enabled = testCaseList.value.filter(tc => tc.enabled).length
  statistics.disabled = testCaseList.value.filter(tc => !tc.enabled).length
  statistics.success = testCaseList.value.filter(tc => tc.status === 'success').length
  statistics.failed = testCaseList.value.filter(tc => tc.status === 'failed' || tc.status === 'error').length
  statistics.pending = testCaseList.value.filter(tc => tc.status === 'pending').length
  
  const totalExecutions = testCaseList.value.reduce((sum, tc) => sum + tc.executionCount, 0)
  const totalSuccess = testCaseList.value.reduce((sum, tc) => sum + tc.successCount, 0)
  statistics.successRate = totalExecutions > 0 ? Math.round((totalSuccess / totalExecutions) * 100) : 0
}

// 新增测试用例
const handleAdd = () => {
  isEditing.value = false
  dialogTitle.value = '新增测试用例'
  Object.assign(formData, {
    name: '',
    description: '',
    serviceId: '',
    serviceName: '',
    enabled: true,
    status: 'pending',
    inputParams: {},
    expectedOutput: {},
  })
  tempInputParams.value = []
  tempExpectedOutput.value = []
  dialogVisible.value = true
}

// 编辑测试用例
const handleEdit = (testCase: TestCase) => {
  isEditing.value = true
  dialogTitle.value = '编辑测试用例'
  selectedCase.value = testCase
  Object.assign(formData, {
    ...testCase,
  })
  
  // 转换为编辑格式
  tempInputParams.value = Object.entries(testCase.inputParams).map(([key, value]) => ({
    key,
    value,
    type: typeof value,
  }))
  tempExpectedOutput.value = Object.entries(testCase.expectedOutput).map(([key, value]) => ({
    key,
    value,
    type: typeof value,
  }))
  
  dialogVisible.value = true
}

// 删除测试用例
const handleDelete = async (testCase: TestCase) => {
  try {
    await ElMessageBox.confirm(`确定要删除测试用例 "${testCase.name}" 吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await new Promise(resolve => setTimeout(resolve, 300))
    testCaseList.value = testCaseList.value.filter(tc => tc.id !== testCase.id)
    updateStatistics()
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}

// 切换启用状态
const handleToggleEnabled = async (testCase: TestCase) => {
  await new Promise(resolve => setTimeout(resolve, 300))
  testCase.enabled = !testCase.enabled
  updateStatistics()
  ElMessage.success(testCase.enabled ? '已启用' : '已禁用')
}

// 保存测试用例
const handleSave = async () => {
  if (!formData.name) {
    ElMessage.warning('请输入用例名称')
    return
  }
  if (!formData.serviceId) {
    ElMessage.warning('请选择关联服务')
    return
  }

  // 转换参数格式
  const inputParams: Record<string, any> = {}
  tempInputParams.value.forEach(item => {
    if (item.key) {
      inputParams[item.key] = item.value
    }
  })

  const expectedOutput: Record<string, any> = {}
  tempExpectedOutput.value.forEach(item => {
    if (item.key) {
      expectedOutput[item.key] = item.value
    }
  })

  formData.inputParams = inputParams
  formData.expectedOutput = expectedOutput

  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 500))

  if (isEditing.value && selectedCase.value) {
    // 更新
    Object.assign(selectedCase.value, {
      ...formData,
      serviceName: serviceList.value.find(s => s.id === formData.serviceId)?.name || '',
      updatedAt: new Date().toLocaleString('zh-CN'),
    })
    ElMessage.success('更新成功')
  } else {
    // 新增
    const newCase: TestCase = {
      id: `case_${Date.now()}`,
      name: formData.name!,
      description: formData.description || '',
      serviceId: formData.serviceId!,
      serviceName: serviceList.value.find(s => s.id === formData.serviceId)?.name || '',
      enabled: formData.enabled!,
      status: 'pending',
      lastExecutionTime: '-',
      executionCount: 0,
      successCount: 0,
      failedCount: 0,
      inputParams,
      expectedOutput,
      createdAt: new Date().toLocaleString('zh-CN'),
      updatedAt: new Date().toLocaleString('zh-CN'),
    }
    testCaseList.value.push(newCase)
    ElMessage.success('新增成功')
  }

  loading.value = false
  dialogVisible.value = false
  updateStatistics()
}

// 复制测试用例
const handleCopy = (testCase: TestCase) => {
  const newCase: TestCase = {
    ...JSON.parse(JSON.stringify(testCase)),
    id: `case_${Date.now()}`,
    name: `${testCase.name} (副本)`,
    status: 'pending',
    lastExecutionTime: '-',
    executionCount: 0,
    successCount: 0,
    failedCount: 0,
    createdAt: new Date().toLocaleString('zh-CN'),
    updatedAt: new Date().toLocaleString('zh-CN'),
  }
  testCaseList.value.push(newCase)
  updateStatistics()
  ElMessage.success('复制成功')
}

// 添加输入参数
const addInputParam = () => {
  tempInputParams.value.push({ key: '', value: '', type: 'string' })
}

// 删除输入参数
const removeInputParam = (index: number) => {
  tempInputParams.value.splice(index, 1)
}

// 添加预期输出
const addExpectedOutput = () => {
  tempExpectedOutput.value.push({ key: '', value: '', type: 'string' })
}

// 删除预期输出
const removeExpectedOutput = (index: number) => {
  tempExpectedOutput.value.splice(index, 1)
}

// 执行单个测试用例
const executeTestCase = async (testCase: TestCase) => {
  selectedCase.value = testCase
  executionLogs.value = []
  executionProgress.value = 0
  isExecuting.value = true
  executionDialogVisible.value = true

  // 模拟执行过程
  const logs = [
    '开始执行测试用例...',
    `测试用例: ${testCase.name}`,
    `关联服务: ${testCase.serviceName}`,
    '准备输入参数...',
    `输入参数: ${JSON.stringify(testCase.inputParams)}`,
    '发送请求...',
  ]

  for (let i = 0; i < logs.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 400))
    executionLogs.value.push(logs[i])
    executionProgress.value = Math.round(((i + 1) / (logs.length + 4)) * 100)
  }

  await new Promise(resolve => setTimeout(resolve, 600))
  executionLogs.value.push('接收响应...')
  executionProgress.value = 70

  await new Promise(resolve => setTimeout(resolve, 500))
  
  // 随机生成执行结果
  const isSuccess = Math.random() > 0.2
  const result = isSuccess ? 'success' : 'failed'
  
  if (isSuccess) {
    executionLogs.value.push('验证输出结果...')
    executionProgress.value = 85
    await new Promise(resolve => setTimeout(resolve, 400))
    executionLogs.value.push('✅ 测试通过！')
    testCase.status = 'success'
    testCase.successCount++
  } else {
    executionLogs.value.push('❌ 测试失败！')
    executionLogs.value.push('错误: 实际输出与预期不符')
    testCase.status = 'failed'
    testCase.failedCount++
  }

  executionProgress.value = 100
  testCase.executionCount++
  testCase.lastExecutionTime = new Date().toLocaleString('zh-CN')
  testCase.updatedAt = new Date().toLocaleString('zh-CN')

  isExecuting.value = false
  updateStatistics()

  ElNotification({
    title: isSuccess ? '执行成功' : '执行失败',
    message: `测试用例 "${testCase.name}" ${isSuccess ? '执行通过' : '执行失败'}`,
    type: isSuccess ? 'success' : 'error',
  })
}

// 批量执行测试用例
const executeBatch = async () => {
  if (selectedCases.value.length === 0) {
    ElMessage.warning('请选择要执行的测试用例')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要执行选中的 ${selectedCases.value.length} 个测试用例吗？`,
      '批量执行确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    for (const caseId of selectedCases.value) {
      const testCase = testCaseList.value.find(tc => tc.id === caseId)
      if (testCase) {
        await executeTestCase(testCase)
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    selectedCases.value = []
    ElMessage.success('批量执行完成')
  } catch {
    // 用户取消
  }
}

// 查看执行历史
const viewHistory = (testCase: TestCase) => {
  selectedCase.value = testCase
  
  // Mock 执行历史数据
  currentHistory.value = [
    {
      id: 'history_001',
      testCaseId: testCase.id,
      executionTime: testCase.lastExecutionTime,
      result: testCase.status === 'success' ? 'success' : 'failed',
      duration: 1234,
      logs: ['执行日志1', '执行日志2', '执行日志3'],
      inputParams: testCase.inputParams,
      expectedOutput: testCase.expectedOutput,
      actualOutput: testCase.actualOutput || {},
    },
    {
      id: 'history_002',
      testCaseId: testCase.id,
      executionTime: '2024-01-24 15:30:00',
      result: 'success',
      duration: 1156,
      logs: ['执行日志1', '执行日志2'],
      inputParams: testCase.inputParams,
      expectedOutput: testCase.expectedOutput,
      actualOutput: testCase.expectedOutput,
    },
  ]
  
  historyDialogVisible.value = true
}

// 查看详情
const viewDetail = (testCase: TestCase) => {
  selectedCase.value = testCase
  detailDialogVisible.value = true
}

// 导出测试用例
const exportTestCases = () => {
  const data = {
    version: '1.0',
    exportTime: new Date().toISOString(),
    testCases: testCaseList.value,
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `test_cases_${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)

  ElMessage.success('导出成功')
}

// 导入测试用例
const importTestCases = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e: any) => {
    const file = e.target?.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (!data.testCases || !Array.isArray(data.testCases)) {
          throw new Error('无效的文件格式')
        }
        testCaseList.value = data.testCases
        updateStatistics()
        ElMessage.success(`成功导入 ${data.testCases.length} 个测试用例`)
      } catch (err: any) {
        ElMessage.error('导入失败：' + err.message)
      }
    }
    reader.readAsText(file)
  }
  input.click()
}

// 生成测试报告
const generateReport = () => {
  const report = {
    reportTime: new Date().toLocaleString('zh-CN'),
    statistics,
    testCases: testCaseList.value.map(tc => ({
      name: tc.name,
      service: tc.serviceName,
      status: statusText(tc.status),
      executionCount: tc.executionCount,
      successRate: tc.executionCount > 0 
        ? Math.round((tc.successCount / tc.executionCount) * 100) 
        : 0,
    })),
  }

  const content = `
测试报告
=====================================
生成时间: ${report.reportTime}

统计信息:
- 总用例数: ${report.statistics.total}
- 启用数: ${report.statistics.enabled}
- 禁用数: ${report.statistics.disabled}
- 成功数: ${report.statistics.success}
- 失败数: ${report.statistics.failed}
- 未执行: ${report.statistics.pending}
- 成功率: ${report.statistics.successRate}%

详细信息:
${report.testCases.map((tc, idx) => `
${idx + 1}. ${tc.name}
   服务: ${tc.service}
   状态: ${tc.status}
   执行次数: ${tc.executionCount}
   成功率: ${tc.successRate}%
`).join('\n')}
=====================================
  `

  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `test_report_${Date.now()}.txt`
  a.click()
  URL.revokeObjectURL(url)

  ElMessage.success('报告已生成')
}

// 表格选择变化
const handleSelectionChange = (selection: TestCase[]) => {
  selectedCases.value = selection.map(tc => tc.id)
}

// ==================== 生命周期 ====================
onMounted(async () => {
  await loadMockData()
})
</script>

<template>
  <div class="test-case-manage" v-loading="loading">
    <!-- 顶部工具栏 -->
    <el-card shadow="never" class="toolbar-card">
      <div class="toolbar">
        <div class="toolbar-left">
          <h2 class="title">
            <el-icon>
              <DocumentChecked />
            </el-icon>
            测试用例管理
          </h2>
          <span class="subtitle">管理服务测试用例，确保服务质量和测试可重复性</span>
        </div>
        <div class="toolbar-right">
          <el-button type="primary" :icon="'Plus'" @click="handleAdd">
            新增用例
          </el-button>
          <el-button :icon="'VideoPlay'" @click="executeBatch">
            批量执行
          </el-button>
          <el-button :icon="'Upload'" @click="importTestCases">导入用例</el-button>
          <el-button :icon="'Download'" @click="exportTestCases">导出用例</el-button>
          <el-button :icon="'Document'" @click="generateReport">生成报告</el-button>
        </div>
      </div>
    </el-card>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="statistics-row">
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon total">
              <el-icon><Files /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.total }}</div>
              <div class="stat-label">总用例数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon success">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.success }}</div>
              <div class="stat-label">成功用例</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon failed">
              <el-icon><CircleClose /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.failed }}</div>
              <div class="stat-label">失败用例</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon pending">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.pending }}</div>
              <div class="stat-label">未执行</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon enabled">
              <el-icon><Select /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.enabled }}</div>
              <div class="stat-label">已启用</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon rate">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.successRate }}%</div>
              <div class="stat-label">成功率</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索和筛选 -->
    <el-card shadow="never" class="filter-card">
      <el-row :gutter="20" align="middle">
        <el-col :span="8">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索用例名称、关联服务或描述..."
            :prefix-icon="'Search'"
            clearable
          />
        </el-col>
        <el-col :span="8">
          <el-radio-group v-model="statusFilter">
            <el-radio-button label="all">全部</el-radio-button>
            <el-radio-button label="enabled">已启用</el-radio-button>
            <el-radio-button label="disabled">已禁用</el-radio-button>
          </el-radio-group>
        </el-col>
        <el-col :span="8" class="text-right">
          <el-tag type="info" size="large">
            共 {{ filteredTestCases.length }} 条测试用例
          </el-tag>
        </el-col>
      </el-row>
    </el-card>

    <!-- 测试用例列表 -->
    <el-card shadow="never" class="table-card">
      <el-table
        :data="filteredTestCases"
        stripe
        border
        style="width: 100%"
        :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column type="index" label="序号" width="60" align="center" />

        <el-table-column prop="name" label="用例名称" min-width="100">
          <template #default="{ row }">
            <div class="case-name">
              <el-tag
                :type="row.enabled ? 'success' : 'info'"
                size="small"
                effect="dark"
                style="margin-right: 8px"
              >
                {{ row.enabled ? '启用' : '禁用' }}
              </el-tag>
              <strong>{{ row.name }}</strong>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="serviceName" label="关联服务" align="center">
          <template #default="{ row }">
            <el-tag type="primary" effect="plain">{{ row.serviceName }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="执行状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" effect="dark">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="执行统计" width="180" align="center">
          <template #default="{ row }">
            <div class="execution-stats">
              <div class="stat-row">
                <span class="label">总次数:</span>
                <span class="value">{{ row.executionCount }}</span>
              </div>
              <div class="stat-row">
                <span class="label success">成功:</span>
                <span class="value">{{ row.successCount }}</span>
                <span class="label failed">失败:</span>
                <span class="value">{{ row.failedCount }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="lastExecutionTime" label="最后执行时间" width="200" align="center" />

        <el-table-column label="操作" width="550" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              size="small"
              type="primary"
              :icon="'VideoPlay'"
              @click="executeTestCase(row)"
            >
              执行
            </el-button>
            <el-button
              size="small"
              :icon="'View'"
              @click="viewDetail(row)"
            >
              详情
            </el-button>
            <el-button
              size="small"
              :icon="'Clock'"
              @click="viewHistory(row)"
            >
              历史
            </el-button>
            <el-button
              size="small"
              :type="row.enabled ? 'warning' : 'success'"
              :icon="row.enabled ? 'VideoPause' : 'VideoPlay'"
              @click="handleToggleEnabled(row)"
            >
              {{ row.enabled ? '禁用' : '启用' }}
            </el-button>
            <el-button
              size="small"
              :icon="'Edit'"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              size="small"
              :icon="'CopyDocument'"
              @click="handleCopy(row)"
            >
              复制
            </el-button>
            <el-button
              size="small"
              type="danger"
              :icon="'Delete'"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="filteredTestCases.length === 0" description="暂无测试用例数据" :image-size="120" />
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="900px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form :model="formData" label-width="120px" label-position="right">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用例名称" required>
              <el-input
                v-model="formData.name"
                placeholder="请输入用例名称"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联服务" required>
              <el-select v-model="formData.serviceId" placeholder="请选择关联服务" style="width: 100%">
                <el-option
                  v-for="service in serviceList"
                  :key="service.id"
                  :label="service.name"
                  :value="service.id"
                >
                  <div class="service-option">
                    <span>{{ service.name }}</span>
                    <span class="desc">{{ service.description }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="用例描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="2"
            placeholder="请输入用例描述"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="启用状态">
          <el-switch v-model="formData.enabled" active-text="启用" inactive-text="禁用" />
        </el-form-item>

        <el-divider content-position="left">
          <el-icon><Upload /></el-icon>
          输入参数配置
        </el-divider>

        <div class="params-builder">
          <div v-for="(param, index) in tempInputParams" :key="index" class="param-item">
            <el-row :gutter="12">
              <el-col :span="8">
                <el-input v-model="param.key" placeholder="参数名" />
              </el-col>
              <el-col :span="6">
                <el-select v-model="param.type" placeholder="类型">
                  <el-option label="字符串" value="string" />
                  <el-option label="数字" value="number" />
                  <el-option label="布尔值" value="boolean" />
                </el-select>
              </el-col>
              <el-col :span="8">
                <el-input v-if="param.type === 'string'" v-model="param.value" placeholder="参数值" />
                <el-input-number
                  v-else-if="param.type === 'number'"
                  v-model="param.value"
                  style="width: 100%"
                />
                <el-switch v-else-if="param.type === 'boolean'" v-model="param.value" />
              </el-col>
              <el-col :span="2">
                <el-button type="danger" :icon="'Delete'" circle @click="removeInputParam(index)" />
              </el-col>
            </el-row>
          </div>
          <el-button type="primary" :icon="'Plus'" @click="addInputParam" plain style="width: 100%">
            添加输入参数
          </el-button>
        </div>

        <el-divider content-position="left">
          <el-icon><Download /></el-icon>
          预期输出配置
        </el-divider>

        <div class="params-builder">
          <div v-for="(output, index) in tempExpectedOutput" :key="index" class="param-item">
            <el-row :gutter="12">
              <el-col :span="8">
                <el-input v-model="output.key" placeholder="字段名" />
              </el-col>
              <el-col :span="6">
                <el-select v-model="output.type" placeholder="类型">
                  <el-option label="字符串" value="string" />
                  <el-option label="数字" value="number" />
                  <el-option label="布尔值" value="boolean" />
                </el-select>
              </el-col>
              <el-col :span="8">
                <el-input v-if="output.type === 'string'" v-model="output.value" placeholder="期望值" />
                <el-input-number
                  v-else-if="output.type === 'number'"
                  v-model="output.value"
                  style="width: 100%"
                />
                <el-switch v-else-if="output.type === 'boolean'" v-model="output.value" />
              </el-col>
              <el-col :span="2">
                <el-button type="danger" :icon="'Delete'" circle @click="removeExpectedOutput(index)" />
              </el-col>
            </el-row>
          </div>
          <el-button type="primary" :icon="'Plus'" @click="addExpectedOutput" plain style="width: 100%">
            添加预期输出
          </el-button>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="loading">
          保存用例
        </el-button>
      </template>
    </el-dialog>

    <!-- 执行详情对话框 -->
    <el-dialog
      v-model="executionDialogVisible"
      title="测试执行"
      width="700px"
      :close-on-click-modal="false"
    >
      <div v-if="selectedCase">
        <el-alert :title="`执行用例: ${selectedCase.name}`" type="info" :closable="false" show-icon style="margin-bottom: 20px" />

        <el-progress
          :percentage="executionProgress"
          :status="isExecuting ? undefined : 'success'"
          :stroke-width="20"
          style="margin-bottom: 20px"
        />

        <el-divider content-position="left">
          <el-icon><Document /></el-icon>
          执行日志
        </el-divider>

        <div class="execution-logs">
          <div v-for="(log, index) in executionLogs" :key="index" class="log-item">
            <span class="log-time">{{ new Date().toLocaleTimeString() }}</span>
            <span class="log-content">{{ log }}</span>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 执行历史对话框 -->
    <el-dialog
      v-model="historyDialogVisible"
      title="执行历史"
      width="900px"
      destroy-on-close
    >
      <div v-if="selectedCase">
        <el-alert :title="`用例: ${selectedCase.name}`" type="info" :closable="false" style="margin-bottom: 20px" />

        <el-table :data="currentHistory" border stripe>
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="executionTime" label="执行时间" width="160" align="center" />
          <el-table-column label="执行结果" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="statusTagType(row.result)" effect="dark">
                {{ statusText(row.result) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="duration" label="耗时(ms)" width="100" align="center" />
          <el-table-column label="详细信息" min-width="200">
            <template #default>
              <el-button size="small" :icon="'View'" text type="primary">
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="用例详情"
      width="800px"
      destroy-on-close
    >
      <div v-if="selectedCase">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="用例名称">{{ selectedCase.name }}</el-descriptions-item>
          <el-descriptions-item label="关联服务">{{ selectedCase.serviceName }}</el-descriptions-item>
          <el-descriptions-item label="启用状态">
            <el-tag :type="selectedCase.enabled ? 'success' : 'info'">
              {{ selectedCase.enabled ? '已启用' : '已禁用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="执行状态">
            <el-tag :type="statusTagType(selectedCase.status)">
              {{ statusText(selectedCase.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="执行次数">{{ selectedCase.executionCount }}</el-descriptions-item>
          <el-descriptions-item label="成功次数">{{ selectedCase.successCount }}</el-descriptions-item>
          <el-descriptions-item label="失败次数">{{ selectedCase.failedCount }}</el-descriptions-item>
          <el-descriptions-item label="最后执行时间">{{ selectedCase.lastExecutionTime }}</el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">{{ selectedCase.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="更新时间" :span="2">{{ selectedCase.updatedAt }}</el-descriptions-item>
          <el-descriptions-item label="用例描述" :span="2">{{ selectedCase.description || '-' }}</el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">输入参数</el-divider>
        <pre class="json-preview">{{ JSON.stringify(selectedCase.inputParams, null, 2) }}</pre>

        <el-divider content-position="left">预期输出</el-divider>
        <pre class="json-preview">{{ JSON.stringify(selectedCase.expectedOutput, null, 2) }}</pre>

        <el-divider content-position="left" v-if="selectedCase.actualOutput">实际输出</el-divider>
        <pre class="json-preview" v-if="selectedCase.actualOutput">{{ JSON.stringify(selectedCase.actualOutput, null, 2) }}</pre>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.test-case-manage {
  min-height: 100vh;

  // 工具栏卡片
  .toolbar-card {
    margin-bottom: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .toolbar-left {
        .title {
          margin: 0 0 6px 0;
          font-size: 22px;
          font-weight: 700;
          color: #409eff;
          display: flex;
          align-items: center;
          gap: 10px;

          .el-icon {
            color: #409eff;
            font-size: 24px;
          }
        }

        .subtitle {
          font-size: 13px;
          color: #909399;
        }
      }

      .toolbar-right {
        display: flex;
        gap: 12px;
      }
    }
  }

  // 统计卡片
  .statistics-row {
    margin-bottom: 20px;

    .stat-card {
      border-radius: 12px;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      }

      .stat-content {
        display: flex;
        align-items: center;
        gap: 16px;

        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          color: #fff;

          &.total {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          &.success {
            background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
          }
          &.failed {
            background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
          }
          &.pending {
            background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
          }
          &.enabled {
            background: linear-gradient(135deg, #fccb90 0%, #d57eeb 100%);
          }
          &.rate {
            background: linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%);
          }
        }

        .stat-info {
          flex: 1;

          .stat-value {
            font-size: 28px;
            font-weight: 700;
            color: #303133;
            line-height: 1;
            margin-bottom: 8px;
          }

          .stat-label {
            font-size: 14px;
            color: #909399;
          }
        }
      }
    }
  }

  // 筛选卡片
  .filter-card {
    margin-bottom: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

    .text-right {
      text-align: right;
    }
  }

  // 表格卡片
  .table-card {
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

    .case-name {
      display: flex;
      align-items: center;
    }

    .execution-stats {
      .stat-row {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        margin-bottom: 4px;

        .label {
          color: #909399;
          font-weight: 500;

          &.success {
            color: #67c23a;
          }
          &.failed {
            color: #f56c6c;
          }
        }

        .value {
          color: #303133;
          font-weight: 600;
        }
      }
    }
  }

  // 参数构建器
  .params-builder {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;

    .param-item {
      margin-bottom: 12px;
      padding: 12px;
      background: #fff;
      border-radius: 8px;
      border: 1px solid #e4e7ed;
    }
  }

  // 服务选项
  .service-option {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .desc {
      font-size: 12px;
      color: #909399;
    }
  }

  // 执行日志
  .execution-logs {
    max-height: 400px;
    overflow-y: auto;
    background: #f5f7fa;
    padding: 16px;
    border-radius: 8px;
    font-family: 'Monaco', 'Menlo', 'Consolas', monospace;

    .log-item {
      margin-bottom: 8px;
      line-height: 1.6;

      .log-time {
        color: #909399;
        font-size: 12px;
        margin-right: 12px;
      }

      .log-content {
        color: #303133;
        font-size: 14px;
      }
    }
  }

  // JSON预览
  .json-preview {
    background: #f5f7fa;
    padding: 16px;
    border-radius: 8px;
    font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
    font-size: 13px;
    line-height: 1.6;
    color: #303133;
    overflow-x: auto;
  }
}

// 全局样式
:deep(.el-table) {
  font-size: 14px;

  .el-table__header th {
    font-weight: 600;
  }
}

:deep(.el-dialog) {
  border-radius: 12px;
  overflow: hidden;

  .el-dialog__header {
    background: #409eff;
    color: #ffffff;
    padding: 20px;
    margin-right: 0;

    .el-dialog__title {
      color: #ffffff;
      font-size: 18px;
      font-weight: 700;
    }

    .el-dialog__headerbtn .el-dialog__close {
      color: #ffffff;
    }
  }

  .el-dialog__body {
    padding: 24px;
  }
}
</style>
