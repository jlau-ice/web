<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { 
  Warning, 
  CircleClose, 
  Refresh, 
  Delete, 
  Document, 
  Tools,
  View,
  Download,
  Edit,
  Check,
  Close,
  MoreFilled,
  Search,
  Filter
} from '@element-plus/icons-vue'

// 异常类型枚举
enum ExceptionType {
  TIMEOUT = 'timeout',
  RESOURCE = 'resource',
  DATA = 'data',
  NETWORK = 'network',
  LOGIC = 'logic',
  SYSTEM = 'system'
}

// 异常级别枚举
enum ExceptionLevel {
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// 处理状态枚举
enum HandleStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  HANDLED = 'handled',
  IGNORED = 'ignored'
}

// 异常任务接口
interface ExceptionTask {
  id: string
  taskName: string
  taskId: string
  exceptionType: ExceptionType
  exceptionLevel: ExceptionLevel
  occurTime: string
  retryCount: number
  maxRetries: number
  handleStatus: HandleStatus
  errorMessage: string
  stackTrace?: string
  executionContext?: any
  systemState?: any
  handledBy?: string
  handledTime?: string
  remark?: string
}

// 处理策略接口
interface HandleStrategy {
  id: number
  name: string
  autoRetry: boolean
  retryCount: number
  retryInterval: number // 秒
  failureCallback: {
    notification: boolean
    logging: boolean
    rollback: boolean
  }
  escalation: {
    enabled: boolean
    failureThreshold: number
    action: 'manual' | 'alert' | 'stop'
  }
  isTemplate: boolean
  createTime: string
}

// 统计数据接口
interface ExceptionStats {
  total: number
  pending: number
  processing: number
  handled: number
  ignored: number
  byType: Array<{ type: string; count: number }>
  byLevel: Array<{ level: string; count: number }>
  handleEfficiency: number // 处理效率百分比
}

// 异常级别配置
const levelConfig = {
  [ExceptionLevel.WARNING]: {
    label: '警告',
    color: '#E6A23C',
    type: 'warning'
  },
  [ExceptionLevel.ERROR]: {
    label: '错误',
    color: '#F56C6C',
    type: 'danger'
  },
  [ExceptionLevel.CRITICAL]: {
    label: '严重',
    color: '#F56C6C',
    type: 'danger'
  }
}

// 处理状态配置
const statusConfig = {
  [HandleStatus.PENDING]: {
    label: '待处理',
    color: '#909399',
    type: 'info'
  },
  [HandleStatus.PROCESSING]: {
    label: '处理中',
    color: '#409EFF',
    type: 'primary'
  },
  [HandleStatus.HANDLED]: {
    label: '已处理',
    color: '#67C23A',
    type: 'success'
  },
  [HandleStatus.IGNORED]: {
    label: '已忽略',
    color: '#909399',
    type: 'info'
  }
}

// 异常类型配置
const typeConfig = {
  [ExceptionType.TIMEOUT]: '执行超时',
  [ExceptionType.RESOURCE]: '资源不足',
  [ExceptionType.DATA]: '数据异常',
  [ExceptionType.NETWORK]: '网络异常',
  [ExceptionType.LOGIC]: '逻辑错误',
  [ExceptionType.SYSTEM]: '系统错误'
}

// 搜索表单
const searchForm = reactive({
  taskName: '',
  exceptionType: '',
  exceptionLevel: '',
  handleStatus: ''
})

// 数据状态
const tableData = ref<ExceptionTask[]>([])
const tableLoading = ref(false)
const selectedTasks = ref<ExceptionTask[]>([])

// 异常详情
const detailDialogVisible = ref(false)
const currentException = ref<ExceptionTask | null>(null)

// 策略配置
const strategyDialogVisible = ref(false)
const strategyFormRef = ref<FormInstance>()
const strategyList = ref<HandleStrategy[]>([])
const currentStrategy = ref<HandleStrategy | null>(null)
const strategyForm = reactive({
  id: 0,
  name: '',
  autoRetry: true,
  retryCount: 3,
  retryInterval: 60,
  failureCallback: {
    notification: true,
    logging: true,
    rollback: false
  },
  escalation: {
    enabled: true,
    failureThreshold: 3,
    action: 'manual' as 'manual' | 'alert' | 'stop'
  },
  isTemplate: false
})

// 转人工处理
const manualDialogVisible = ref(false)
const manualForm = reactive({
  taskId: '',
  remark: '',
  assignTo: ''
})

// 统计数据
const statistics = ref<ExceptionStats>({
  total: 0,
  pending: 0,
  processing: 0,
  handled: 0,
  ignored: 0,
  byType: [],
  byLevel: [],
  handleEfficiency: 0
})

// 计算统计数据
const computeStatistics = () => {
  const total = tableData.value.length
  const pending = tableData.value.filter(t => t.handleStatus === HandleStatus.PENDING).length
  const processing = tableData.value.filter(t => t.handleStatus === HandleStatus.PROCESSING).length
  const handled = tableData.value.filter(t => t.handleStatus === HandleStatus.HANDLED).length
  const ignored = tableData.value.filter(t => t.handleStatus === HandleStatus.IGNORED).length
  
  // 按类型统计
  const byType: Record<string, number> = {}
  tableData.value.forEach(t => {
    byType[t.exceptionType] = (byType[t.exceptionType] || 0) + 1
  })
  
  // 按级别统计
  const byLevel: Record<string, number> = {}
  tableData.value.forEach(t => {
    byLevel[t.exceptionLevel] = (byLevel[t.exceptionLevel] || 0) + 1
  })
  
  // 计算处理效率
  const handleEfficiency = total > 0 ? Math.round(((handled + ignored) / total) * 100) : 0
  
  statistics.value = {
    total,
    pending,
    processing,
    handled,
    ignored,
    byType: Object.entries(byType).map(([type, count]) => ({ 
      type: typeConfig[type as ExceptionType], 
      count 
    })),
    byLevel: Object.entries(byLevel).map(([level, count]) => ({ 
      level: levelConfig[level as ExceptionLevel].label, 
      count 
    })),
    handleEfficiency
  }
}

// 筛选后的数据
const filteredTableData = computed(() => {
  let data = tableData.value
  
  if (searchForm.taskName) {
    data = data.filter(t => 
      t.taskName.toLowerCase().includes(searchForm.taskName.toLowerCase()) ||
      t.taskId.toLowerCase().includes(searchForm.taskName.toLowerCase())
    )
  }
  
  if (searchForm.exceptionType) {
    data = data.filter(t => t.exceptionType === searchForm.exceptionType)
  }
  
  if (searchForm.exceptionLevel) {
    data = data.filter(t => t.exceptionLevel === searchForm.exceptionLevel)
  }
  
  if (searchForm.handleStatus) {
    data = data.filter(t => t.handleStatus === searchForm.handleStatus)
  }
  
  return data
})

// Mock 数据生成
const generateMockData = (): ExceptionTask[] => {
  const taskNames = [
    '数据同步任务',
    '报表生成任务',
    '数据清洗任务',
    '模型训练任务',
    'ETL处理任务',
    '数据备份任务',
    '实时计算任务',
    '批处理任务',
    '数据导入任务',
    '日志分析任务'
  ]
  
  const exceptionTypes = Object.values(ExceptionType)
  const exceptionLevels = Object.values(ExceptionLevel)
  const handleStatuses = Object.values(HandleStatus)
  
  const data: ExceptionTask[] = []
  
  for (let i = 1; i <= 15; i++) {
    const exceptionType = exceptionTypes[Math.floor(Math.random() * exceptionTypes.length)]
    const exceptionLevel = exceptionLevels[Math.floor(Math.random() * exceptionLevels.length)]
    const handleStatus = handleStatuses[Math.floor(Math.random() * handleStatuses.length)]
    const occurTime = new Date(Date.now() - Math.random() * 86400000 * 3) // 最近3天
    
    const task: ExceptionTask = {
      id: `exc-${1000 + i}`,
      taskName: taskNames[Math.floor(Math.random() * taskNames.length)],
      taskId: `task-${100 + i}`,
      exceptionType,
      exceptionLevel,
      occurTime: occurTime.toISOString(),
      retryCount: Math.floor(Math.random() * 3),
      maxRetries: 3,
      handleStatus,
      errorMessage: getErrorMessage(exceptionType),
      stackTrace: generateStackTrace(),
      executionContext: {
        executor: 'Node-' + (Math.floor(Math.random() * 5) + 1),
        memoryUsage: Math.floor(Math.random() * 2048) + 512 + 'MB',
        cpuUsage: Math.floor(Math.random() * 80) + 10 + '%',
        dataSize: Math.floor(Math.random() * 10000) + 1000
      },
      systemState: {
        availableMemory: Math.floor(Math.random() * 4096) + 2048 + 'MB',
        diskSpace: Math.floor(Math.random() * 500) + 100 + 'GB',
        networkLatency: Math.floor(Math.random() * 200) + 10 + 'ms'
      }
    }
    
    if (handleStatus === HandleStatus.HANDLED) {
      task.handledBy = '系统管理员'
      task.handledTime = new Date(occurTime.getTime() + Math.random() * 3600000).toISOString()
      task.remark = '已通过自动重试解决'
    }
    
    data.push(task)
  }
  
  return data.sort((a, b) => new Date(b.occurTime).getTime() - new Date(a.occurTime).getTime())
}

// 生成错误信息
const getErrorMessage = (type: ExceptionType): string => {
  const messages = {
    [ExceptionType.TIMEOUT]: '任务执行超时，超过最大允许时间 300 秒',
    [ExceptionType.RESOURCE]: '系统资源不足，内存使用率超过 90%',
    [ExceptionType.DATA]: '数据格式不符合预期，缺少必需字段',
    [ExceptionType.NETWORK]: '网络连接失败，无法访问远程服务器',
    [ExceptionType.LOGIC]: '业务逻辑处理异常，数据校验失败',
    [ExceptionType.SYSTEM]: '系统内部错误，服务暂时不可用'
  }
  return messages[type]
}

// 生成堆栈信息
const generateStackTrace = (): string => {
  return `Error: Task execution failed
    at TaskExecutor.execute (executor.js:156:23)
    at TaskManager.runTask (manager.js:89:15)
    at Scheduler.processQueue (scheduler.js:234:18)
    at async Scheduler.start (scheduler.js:67:5)`
}

// 生成 Mock 策略数据
const generateMockStrategies = (): HandleStrategy[] => {
  return [
    {
      id: 1,
      name: '超时异常标准策略',
      autoRetry: true,
      retryCount: 3,
      retryInterval: 60,
      failureCallback: {
        notification: true,
        logging: true,
        rollback: false
      },
      escalation: {
        enabled: true,
        failureThreshold: 3,
        action: 'manual'
      },
      isTemplate: true,
      createTime: '2024-01-15 10:00:00'
    },
    {
      id: 2,
      name: '资源异常快速重试',
      autoRetry: true,
      retryCount: 5,
      retryInterval: 30,
      failureCallback: {
        notification: true,
        logging: true,
        rollback: true
      },
      escalation: {
        enabled: true,
        failureThreshold: 5,
        action: 'alert'
      },
      isTemplate: true,
      createTime: '2024-01-20 14:30:00'
    }
  ]
}

// 加载数据
const loadData = async () => {
  tableLoading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    tableData.value = generateMockData()
    strategyList.value = generateMockStrategies()
    computeStatistics()
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    tableLoading.value = false
  }
}

// 刷新数据
const handleRefresh = () => {
  ElMessage.info('正在刷新数据...')
  loadData()
}

// 重置搜索
const handleReset = () => {
  searchForm.taskName = ''
  searchForm.exceptionType = ''
  searchForm.exceptionLevel = ''
  searchForm.handleStatus = ''
}

// 查看详情
const handleViewDetail = (row: ExceptionTask) => {
  currentException.value = row
  detailDialogVisible.value = true
}

// 手动重试
const handleRetry = async (row: ExceptionTask) => {
  try {
    await ElMessageBox.confirm(
      `确定要重试任务 "${row.taskName}" 吗？`,
      '重试确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    tableLoading.value = true
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 模拟重试
    row.retryCount++
    row.handleStatus = HandleStatus.PROCESSING
    
    // 50% 概率成功
    setTimeout(() => {
      if (Math.random() > 0.5) {
        row.handleStatus = HandleStatus.HANDLED
        row.handledBy = '系统自动'
        row.handledTime = new Date().toISOString()
        row.remark = '重试成功'
        ElMessage.success('重试成功，任务已恢复正常')
      } else {
        row.handleStatus = HandleStatus.PENDING
        ElMessage.warning('重试失败，任务仍存在异常')
      }
      computeStatistics()
      tableLoading.value = false
    }, 2000)
  } catch {
    // 用户取消
  }
}

// 终止任务
const handleTerminate = async (row: ExceptionTask) => {
  try {
    await ElMessageBox.confirm(
      `确定要终止任务 "${row.taskName}" 吗？此操作不可恢复。`,
      '终止确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
    
    await new Promise(resolve => setTimeout(resolve, 500))
    
    row.handleStatus = HandleStatus.IGNORED
    row.handledBy = '系统管理员'
    row.handledTime = new Date().toISOString()
    row.remark = '任务已终止'
    
    computeStatistics()
    ElMessage.success('任务已终止')
  } catch {
    // 用户取消
  }
}

// 跳过异常
const handleSkip = async (row: ExceptionTask) => {
  try {
    await ElMessageBox.confirm(
      `确定要跳过此异常吗？任务将继续执行后续步骤。`,
      '跳过确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await new Promise(resolve => setTimeout(resolve, 500))
    
    row.handleStatus = HandleStatus.HANDLED
    row.handledBy = '系统管理员'
    row.handledTime = new Date().toISOString()
    row.remark = '已跳过异常继续执行'
    
    computeStatistics()
    ElMessage.success('已跳过异常')
  } catch {
    // 用户取消
  }
}

// 转人工处理
const handleManualProcess = (row: ExceptionTask) => {
  manualForm.taskId = row.id
  manualForm.remark = ''
  manualForm.assignTo = ''
  manualDialogVisible.value = true
}

// 提交人工处理
const submitManualProcess = async () => {
  if (!manualForm.remark) {
    ElMessage.warning('请填写处理备注')
    return
  }
  
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const task = tableData.value.find(t => t.id === manualForm.taskId)
  if (task) {
    task.handleStatus = HandleStatus.PROCESSING
    task.remark = manualForm.remark
    computeStatistics()
  }
  
  manualDialogVisible.value = false
  ElMessage.success('已转人工处理')
}

// 批量处理
const handleBatchProcess = async () => {
  if (selectedTasks.value.length === 0) {
    ElMessage.warning('请先选择要处理的任务')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要批量重试选中的 ${selectedTasks.value.length} 个任务吗？`,
      '批量处理确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    tableLoading.value = true
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    let successCount = 0
    selectedTasks.value.forEach(task => {
      task.retryCount++
      if (Math.random() > 0.3) {
        task.handleStatus = HandleStatus.HANDLED
        task.handledBy = '批量处理'
        task.handledTime = new Date().toISOString()
        successCount++
      } else {
        task.handleStatus = HandleStatus.PROCESSING
      }
    })
    
    computeStatistics()
    tableLoading.value = false
    selectedTasks.value = []
    ElMessage.success(`批量处理完成，成功 ${successCount} 个`)
  } catch {
    tableLoading.value = false
  }
}

// 批量忽略
const handleBatchIgnore = async () => {
  if (selectedTasks.value.length === 0) {
    ElMessage.warning('请先选择要忽略的任务')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要批量忽略选中的 ${selectedTasks.value.length} 个任务吗？`,
      '批量忽略确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await new Promise(resolve => setTimeout(resolve, 500))
    
    selectedTasks.value.forEach(task => {
      task.handleStatus = HandleStatus.IGNORED
      task.handledBy = '批量处理'
      task.handledTime = new Date().toISOString()
      task.remark = '批量忽略'
    })
    
    computeStatistics()
    selectedTasks.value = []
    ElMessage.success('批量忽略成功')
  } catch {
    // 用户取消
  }
}

// 表格选择变化
const handleSelectionChange = (selection: ExceptionTask[]) => {
  selectedTasks.value = selection
}

// 打开策略配置
const handleOpenStrategy = (strategy?: HandleStrategy) => {
  if (strategy) {
    Object.assign(strategyForm, strategy)
  } else {
    Object.assign(strategyForm, {
      id: 0,
      name: '',
      autoRetry: true,
      retryCount: 3,
      retryInterval: 60,
      failureCallback: {
        notification: true,
        logging: true,
        rollback: false
      },
      escalation: {
        enabled: true,
        failureThreshold: 3,
        action: 'manual'
      },
      isTemplate: false
    })
  }
  strategyDialogVisible.value = true
}

// 保存策略
const saveStrategy = async () => {
  if (!strategyFormRef.value) return
  
  await strategyFormRef.value.validate(async (valid) => {
    if (valid) {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      if (strategyForm.id) {
        const index = strategyList.value.findIndex(s => s.id === strategyForm.id)
        if (index !== -1) {
          strategyList.value[index] = { ...strategyForm } as HandleStrategy
        }
        ElMessage.success('策略更新成功')
      } else {
        const newStrategy: HandleStrategy = {
          ...strategyForm,
          id: Date.now(),
          createTime: new Date().toLocaleString()
        } as HandleStrategy
        strategyList.value.push(newStrategy)
        ElMessage.success('策略创建成功')
      }
      
      strategyDialogVisible.value = false
    }
  })
}

// 删除策略
const deleteStrategy = async (strategy: HandleStrategy) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除策略 "${strategy.name}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
    
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const index = strategyList.value.findIndex(s => s.id === strategy.id)
    if (index !== -1) {
      strategyList.value.splice(index, 1)
      ElMessage.success('策略删除成功')
    }
  } catch {
    // 用户取消
  }
}

// 导出报告
const handleExport = async () => {
  ElMessage.info('正在生成异常报告...')
  
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  const reportData = {
    exportTime: new Date().toLocaleString(),
    statistics: statistics.value,
    tasks: filteredTableData.value
  }
  
  console.log('Export report:', reportData)
  ElMessage.success('报告导出成功')
}

// 格式化时间
const formatTime = (time: string): string => {
  return new Date(time).toLocaleString()
}

// 生命周期
onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="exception-handling-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>异常任务处理</h2>
      <div class="header-actions">
        <el-button type="primary" :icon="Refresh" @click="handleRefresh" :loading="tableLoading">
          刷新
        </el-button>
      </div>
    </div>

    <!-- 统计概览区 -->
    <div class="statistics-section">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8" :lg="4">
          <el-card shadow="hover" class="stat-card total-card">
            <div class="card-content">
              <div class="card-icon">
                <el-icon :size="32"><Document /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-label">异常总数</div>
                <div class="card-value">{{ statistics.total }}</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :md="8" :lg="4">
          <el-card shadow="hover" class="stat-card pending-card">
            <div class="card-content">
              <div class="card-icon">
                <el-icon :size="32"><Warning /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-label">待处理</div>
                <div class="card-value">{{ statistics.pending }}</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :md="8" :lg="4">
          <el-card shadow="hover" class="stat-card processing-card">
            <div class="card-content">
              <div class="card-icon">
                <el-icon :size="32"><Tools /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-label">处理中</div>
                <div class="card-value">{{ statistics.processing }}</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :md="8" :lg="4">
          <el-card shadow="hover" class="stat-card handled-card">
            <div class="card-content">
              <div class="card-icon">
                <el-icon :size="32"><Check /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-label">已处理</div>
                <div class="card-value">{{ statistics.handled }}</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :md="8" :lg="4">
          <el-card shadow="hover" class="stat-card ignored-card">
            <div class="card-content">
              <div class="card-icon">
                <el-icon :size="32"><Close /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-label">已忽略</div>
                <div class="card-value">{{ statistics.ignored }}</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :md="8" :lg="4">
          <el-card shadow="hover" class="stat-card efficiency-card">
            <div class="card-content">
              <div class="card-icon">
                <el-icon :size="32"><CircleClose /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-label">处理效率</div>
                <div class="card-value">{{ statistics.handleEfficiency }}%</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 异常类型和级别分布 -->
      <el-row :gutter="20" class="distribution-row">
        <el-col :xs="24" :sm="12" :md="12">
          <el-card shadow="hover">
            <template #header>
              <span class="card-title">异常类型分布</span>
            </template>
            <div class="distribution-content">
              <div v-for="item in statistics.byType" :key="item.type" class="distribution-item">
                <div class="item-label">{{ item.type }}</div>
                <el-progress 
                  :percentage="Math.round((item.count / statistics.total) * 100)" 
                  :stroke-width="20"
                />
                <div class="item-count">{{ item.count }} 个</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :md="12">
          <el-card shadow="hover">
            <template #header>
              <span class="card-title">异常级别分布</span>
            </template>
            <div class="distribution-content">
              <div v-for="item in statistics.byLevel" :key="item.level" class="distribution-item">
                <div class="item-label">{{ item.level }}</div>
                <el-progress 
                  :percentage="Math.round((item.count / statistics.total) * 100)"
                  :stroke-width="20"
                  :color="item.level === '严重' ? '#F56C6C' : item.level === '错误' ? '#E6A23C' : '#409EFF'"
                />
                <div class="item-count">{{ item.count }} 个</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <el-divider />

    <!-- 搜索和操作区 -->
    <div class="search-section">
      <el-card shadow="hover">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="6">
            <el-input
              v-model="searchForm.taskName"
              placeholder="搜索任务名称或ID"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-select
              v-model="searchForm.exceptionType"
              placeholder="异常类型"
              clearable
              style="width: 100%"
            >
              <el-option 
                v-for="(label, value) in typeConfig" 
                :key="value"
                :label="label" 
                :value="value" 
              />
            </el-select>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-select
              v-model="searchForm.exceptionLevel"
              placeholder="异常级别"
              clearable
              style="width: 100%"
            >
              <el-option label="警告" value="warning" />
              <el-option label="错误" value="error" />
              <el-option label="严重" value="critical" />
            </el-select>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-select
              v-model="searchForm.handleStatus"
              placeholder="处理状态"
              clearable
              style="width: 100%"
            >
              <el-option label="待处理" value="pending" />
              <el-option label="处理中" value="processing" />
              <el-option label="已处理" value="handled" />
              <el-option label="已忽略" value="ignored" />
            </el-select>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="action-row">
          <el-col :span="24">
            <div class="action-buttons">
              <el-button @click="handleReset">重置</el-button>
              <el-button type="primary" @click="handleOpenStrategy()">
                <el-icon><Tools /></el-icon>
                <span>策略配置</span>
              </el-button>
              <el-button type="success" @click="handleBatchProcess" :disabled="selectedTasks.length === 0">
                批量重试 ({{ selectedTasks.length }})
              </el-button>
              <el-button type="warning" @click="handleBatchIgnore" :disabled="selectedTasks.length === 0">
                批量忽略 ({{ selectedTasks.length }})
              </el-button>
              <el-button type="info" @click="handleExport">
                <el-icon><Download /></el-icon>
                <span>导出报告</span>
              </el-button>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 异常任务列表 -->
    <div class="table-section">
      <el-card shadow="hover">
        <template #header>
          <div class="card-header">
            <span class="card-title">异常任务列表</span>
            <el-tag>共 {{ filteredTableData.length }} 条</el-tag>
          </div>
        </template>

        <el-table
          :data="filteredTableData"
          :loading="tableLoading"
          stripe
          @selection-change="handleSelectionChange"
          style="width: 100%"
          :height="450"
        >
          <el-table-column type="selection" width="55" fixed />
          <el-table-column prop="taskName" label="任务名称" width="180" fixed />
          <el-table-column label="异常类型" width="120">
            <template #default="{ row }">
              <el-tag type="info">{{ typeConfig[row.exceptionType] }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="异常级别" width="100">
            <template #default="{ row }">
              <el-tag 
                :type="levelConfig[row.exceptionLevel].type"
                :color="levelConfig[row.exceptionLevel].color"
                effect="dark"
              >
                {{ levelConfig[row.exceptionLevel].label }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="occurTime" label="发生时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.occurTime) }}
            </template>
          </el-table-column>
          <el-table-column label="重试次数" width="120" align="center">
            <template #default="{ row }">
              <span :style="{ color: row.retryCount >= row.maxRetries ? '#F56C6C' : '#606266' }">
                {{ row.retryCount }} / {{ row.maxRetries }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="处理状态" width="100">
            <template #default="{ row }">
              <el-tag :type="statusConfig[row.handleStatus].type">
                {{ statusConfig[row.handleStatus].label }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="errorMessage" label="错误信息" min-width="200" show-overflow-tooltip />
          <el-table-column label="操作" width="300" fixed="right">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                :icon="View"
                @click="handleViewDetail(row)"
              >
                详情
              </el-button>
              <el-button
                v-if="row.handleStatus === HandleStatus.PENDING && row.retryCount < row.maxRetries"
                type="warning"
                size="small"
                :icon="Refresh"
                @click="handleRetry(row)"
              >
                重试
              </el-button>
              <el-dropdown v-if="row.handleStatus !== HandleStatus.HANDLED" trigger="click">
                <el-button size="small" :icon="MoreFilled">
                  更多
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="handleSkip(row)">
                      <el-icon><Check /></el-icon>
                      跳过异常
                    </el-dropdown-item>
                    <el-dropdown-item @click="handleTerminate(row)">
                      <el-icon><Delete /></el-icon>
                      终止任务
                    </el-dropdown-item>
                    <el-dropdown-item @click="handleManualProcess(row)">
                      <el-icon><Edit /></el-icon>
                      转人工处理
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 异常详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="异常详情"
      width="70%"
      :close-on-click-modal="false"
    >
      <div v-if="currentException" class="detail-content">
        <!-- 基本信息 -->
        <el-card shadow="never" class="detail-section">
          <template #header>
            <span class="section-title">基本信息</span>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="任务名称">{{ currentException.taskName }}</el-descriptions-item>
            <el-descriptions-item label="任务ID">{{ currentException.taskId }}</el-descriptions-item>
            <el-descriptions-item label="异常类型">
              <el-tag>{{ typeConfig[currentException.exceptionType] }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="异常级别">
              <el-tag 
                :type="levelConfig[currentException.exceptionLevel].type"
                :color="levelConfig[currentException.exceptionLevel].color"
                effect="dark"
              >
                {{ levelConfig[currentException.exceptionLevel].label }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="发生时间">{{ formatTime(currentException.occurTime) }}</el-descriptions-item>
            <el-descriptions-item label="处理状态">
              <el-tag :type="statusConfig[currentException.handleStatus].type">
                {{ statusConfig[currentException.handleStatus].label }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="重试次数">
              {{ currentException.retryCount }} / {{ currentException.maxRetries }}
            </el-descriptions-item>
            <el-descriptions-item label="处理人">
              {{ currentException.handledBy || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 错误信息 -->
        <el-card shadow="never" class="detail-section">
          <template #header>
            <span class="section-title">错误信息</span>
          </template>
          <el-alert :title="currentException.errorMessage" type="error" :closable="false" show-icon />
        </el-card>

        <!-- 异常堆栈 -->
        <el-card shadow="never" class="detail-section">
          <template #header>
            <span class="section-title">异常堆栈</span>
          </template>
          <div class="stack-trace">
            <pre>{{ currentException.stackTrace }}</pre>
          </div>
        </el-card>

        <!-- 执行上下文 -->
        <el-card shadow="never" class="detail-section">
          <template #header>
            <span class="section-title">执行上下文</span>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="执行节点">
              {{ currentException.executionContext?.executor }}
            </el-descriptions-item>
            <el-descriptions-item label="内存使用">
              {{ currentException.executionContext?.memoryUsage }}
            </el-descriptions-item>
            <el-descriptions-item label="CPU使用率">
              {{ currentException.executionContext?.cpuUsage }}
            </el-descriptions-item>
            <el-descriptions-item label="数据量">
              {{ currentException.executionContext?.dataSize }} 条
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 系统状态 -->
        <el-card shadow="never" class="detail-section">
          <template #header>
            <span class="section-title">系统状态（异常发生时）</span>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="可用内存">
              {{ currentException.systemState?.availableMemory }}
            </el-descriptions-item>
            <el-descriptions-item label="磁盘空间">
              {{ currentException.systemState?.diskSpace }}
            </el-descriptions-item>
            <el-descriptions-item label="网络延迟">
              {{ currentException.systemState?.networkLatency }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 处理记录 -->
        <el-card v-if="currentException.handledBy" shadow="never" class="detail-section">
          <template #header>
            <span class="section-title">处理记录</span>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="处理人">{{ currentException.handledBy }}</el-descriptions-item>
            <el-descriptions-item label="处理时间">
              {{ currentException.handledTime ? formatTime(currentException.handledTime) : '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="处理备注" :span="2">
              {{ currentException.remark || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </div>
    </el-dialog>

    <!-- 处理策略配置对话框 -->
    <el-dialog
      v-model="strategyDialogVisible"
      title="处理策略配置"
      width="60%"
      :close-on-click-modal="false"
    >
      <!-- 策略模板列表 -->
      <el-card shadow="never" class="strategy-templates">
        <template #header>
          <div class="card-header">
            <span class="section-title">策略模板</span>
            <el-button type="primary" size="small" @click="handleOpenStrategy()">
              新建策略
            </el-button>
          </div>
        </template>
        <el-table :data="strategyList" stripe>
          <el-table-column prop="name" label="策略名称" />
          <el-table-column label="自动重试" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.autoRetry ? 'success' : 'info'">
                {{ row.autoRetry ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="重试配置" width="150">
            <template #default="{ row }">
              {{ row.retryCount }}次 / {{ row.retryInterval }}秒
            </template>
          </el-table-column>
          <el-table-column label="失败升级" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.escalation.enabled ? 'warning' : 'info'">
                {{ row.escalation.enabled ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column label="操作" width="150" align="center">
            <template #default="{ row }">
              <el-button 
                type="primary" 
                size="small" 
                link 
                :icon="Edit"
                @click="handleOpenStrategy(row)"
              >
                编辑
              </el-button>
              <el-button 
                type="danger" 
                size="small" 
                link 
                :icon="Delete"
                @click="deleteStrategy(row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 策略编辑表单 -->
      <el-card v-if="strategyForm.id !== undefined" shadow="never" class="strategy-form">
        <template #header>
          <span class="section-title">{{ strategyForm.id ? '编辑策略' : '新建策略' }}</span>
        </template>
        <el-form ref="strategyFormRef" :model="strategyForm" label-width="140px">
          <el-form-item label="策略名称" required>
            <el-input v-model="strategyForm.name" placeholder="请输入策略名称" />
          </el-form-item>

          <el-divider content-position="left">自动重试配置</el-divider>
          <el-form-item label="启用自动重试">
            <el-switch v-model="strategyForm.autoRetry" />
          </el-form-item>
          <el-form-item label="重试次数">
            <el-input-number 
              v-model="strategyForm.retryCount" 
              :min="1" 
              :max="10"
              :disabled="!strategyForm.autoRetry"
            />
          </el-form-item>
          <el-form-item label="重试间隔(秒)">
            <el-input-number 
              v-model="strategyForm.retryInterval" 
              :min="10" 
              :max="3600"
              :disabled="!strategyForm.autoRetry"
            />
          </el-form-item>

          <el-divider content-position="left">失败回调配置</el-divider>
          <el-form-item label="通知">
            <el-switch v-model="strategyForm.failureCallback.notification" />
          </el-form-item>
          <el-form-item label="日志记录">
            <el-switch v-model="strategyForm.failureCallback.logging" />
          </el-form-item>
          <el-form-item label="数据回滚">
            <el-switch v-model="strategyForm.failureCallback.rollback" />
          </el-form-item>

          <el-divider content-position="left">异常升级规则</el-divider>
          <el-form-item label="启用升级">
            <el-switch v-model="strategyForm.escalation.enabled" />
          </el-form-item>
          <el-form-item label="失败阈值">
            <el-input-number 
              v-model="strategyForm.escalation.failureThreshold" 
              :min="1" 
              :max="10"
              :disabled="!strategyForm.escalation.enabled"
            />
            <span class="form-tip">连续失败超过此次数后触发升级</span>
          </el-form-item>
          <el-form-item label="升级动作">
            <el-select 
              v-model="strategyForm.escalation.action" 
              :disabled="!strategyForm.escalation.enabled"
              style="width: 200px"
            >
              <el-option label="转人工处理" value="manual" />
              <el-option label="发送告警" value="alert" />
              <el-option label="停止任务" value="stop" />
            </el-select>
          </el-form-item>

          <el-form-item label="保存为模板">
            <el-switch v-model="strategyForm.isTemplate" />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="saveStrategy">保存策略</el-button>
            <el-button @click="strategyDialogVisible = false">取消</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </el-dialog>

    <!-- 转人工处理对话框 -->
    <el-dialog
      v-model="manualDialogVisible"
      title="转人工处理"
      width="500px"
    >
      <el-form :model="manualForm" label-width="100px">
        <el-form-item label="指派给">
          <el-select v-model="manualForm.assignTo" placeholder="请选择处理人" style="width: 100%">
            <el-option label="张三" value="zhangsan" />
            <el-option label="李四" value="lisi" />
            <el-option label="王五" value="wangwu" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理备注" required>
          <el-input
            v-model="manualForm.remark"
            type="textarea"
            :rows="4"
            placeholder="请输入处理备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="manualDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitManualProcess">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  h2 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: #303133;
  }
}

.statistics-section {
  margin-bottom: 24px;

  .stat-card {
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .card-content {
      display: flex;
      align-items: center;
      gap: 16px;

      .card-icon {
        width: 60px;
        height: 60px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
      }

      .card-info {
        flex: 1;

        .card-label {
          font-size: 14px;
          color: #909399;
          margin-bottom: 8px;
        }

        .card-value {
          font-size: 28px;
          font-weight: 600;
          color: #303133;
        }
      }
    }

    &.total-card .card-icon {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    &.pending-card .card-icon {
      background: linear-gradient(135deg, #E6A23C 0%, #f5c570 100%);
    }

    &.processing-card .card-icon {
      background: linear-gradient(135deg, #409EFF 0%, #66b1ff 100%);
    }

    &.handled-card .card-icon {
      background: linear-gradient(135deg, #67C23A 0%, #85ce61 100%);
    }

    &.ignored-card .card-icon {
      background: linear-gradient(135deg, #909399 0%, #b3b6bb 100%);
    }

    &.efficiency-card .card-icon {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }
  }

  .distribution-row {
    margin-top: 20px;

    .card-title {
      font-weight: 600;
      font-size: 16px;
    }

    .distribution-content {
      .distribution-item {
        margin-bottom: 20px;

        &:last-child {
          margin-bottom: 0;
        }

        .item-label {
          margin-bottom: 8px;
          color: #606266;
          font-weight: 500;
        }

        .item-count {
          margin-top: 4px;
          color: #909399;
          font-size: 14px;
        }
      }
    }
  }
}

.search-section {
  margin-bottom: 20px;

  .el-row {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .action-row {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #EBEEF5;
  }

  .action-buttons {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
}

.table-section {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .card-title {
      font-weight: 600;
      font-size: 16px;
    }
  }
}

.detail-content {
  .detail-section {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }

    .section-title {
      font-weight: 600;
      font-size: 16px;
      color: #303133;
    }
  }

  .stack-trace {
    background-color: #1e1e1e;
    padding: 16px;
    border-radius: 4px;
    overflow-x: auto;

    pre {
      margin: 0;
      color: #f48771;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.6;
      white-space: pre-wrap;
    }
  }
}

.strategy-templates {
  margin-bottom: 20px;
}

.strategy-form {
  .form-tip {
    margin-left: 12px;
    font-size: 12px;
    color: #909399;
  }
}

// 响应式设计
@media screen and (max-width: 768px) {
  .exception-handling-container {
    padding: 12px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;

    h2 {
      font-size: 20px;
    }
  }

  .statistics-section {
    .el-col {
      margin-bottom: 12px;
    }
  }

  .action-buttons {
    flex-direction: column;

    .el-button {
      width: 100%;
    }
  }
}
</style>