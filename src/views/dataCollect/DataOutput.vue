<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'

// 类型定义
interface OutputTarget {
  id: number
  targetName: string
  targetType: 'Hive' | 'MySQL' | 'Elasticsearch'
  host: string
  port: number
  username: string
  password: string
  status: 'connected' | 'disconnected' | 'testing'
  createTime: string
}

interface OutputStrategy {
  id: number
  strategyName: string
  targetId: number
  targetName: string
  tableName: string
  fields: string[]
  outputFormat: 'JSON' | 'CSV' | 'Parquet'
  partitionStrategy: string
  outputMode: 'batch' | 'incremental' | 'realtime'
  enabled: boolean
}

interface OutputTask {
  id: number
  taskName: string
  targetName: string
  strategyId: number
  fieldCount: number
  outputFormat: string
  status: 'pending' | 'running' | 'success' | 'failed'
  progress: number
  startTime: string
  endTime: string
  recordCount: number
}

interface TaskLog {
  id: number
  time: string
  level: 'info' | 'warning' | 'error' | 'success'
  message: string
}

// 状态管理
const loading = ref(false)
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const statusFilter = ref<string>('all')

// 输出目标数据
const outputTargets = ref<OutputTarget[]>([
  {
    id: 1,
    targetName: 'Hive数据仓库',
    targetType: 'Hive',
    host: '192.168.1.100',
    port: 10000,
    username: 'hive_admin',
    password: '******',
    status: 'connected',
    createTime: '2025-10-20 09:00:00'
  },
  {
    id: 2,
    targetName: 'MySQL业务库',
    targetType: 'MySQL',
    host: '192.168.1.101',
    port: 3306,
    username: 'mysql_user',
    password: '******',
    status: 'connected',
    createTime: '2025-10-20 10:00:00'
  },
  {
    id: 3,
    targetName: 'ES搜索引擎',
    targetType: 'Elasticsearch',
    host: '192.168.1.102',
    port: 9200,
    username: 'elastic',
    password: '******',
    status: 'disconnected',
    createTime: '2025-10-21 11:00:00'
  }
])

// 输出策略数据
const outputStrategies = ref<OutputStrategy[]>([
  {
    id: 1,
    strategyName: '用户数据批量输出',
    targetId: 1,
    targetName: 'Hive数据仓库',
    tableName: 'user_info',
    fields: ['user_id', 'username', 'email', 'phone', 'create_time'],
    outputFormat: 'Parquet',
    partitionStrategy: 'date',
    outputMode: 'batch',
    enabled: true
  },
  {
    id: 2,
    strategyName: '订单数据增量同步',
    targetId: 2,
    targetName: 'MySQL业务库',
    tableName: 'order_info',
    fields: ['order_id', 'user_id', 'amount', 'status', 'create_time'],
    outputFormat: 'JSON',
    partitionStrategy: 'hour',
    outputMode: 'incremental',
    enabled: true
  },
  {
    id: 3,
    strategyName: '日志实时写入',
    targetId: 3,
    targetName: 'ES搜索引擎',
    tableName: 'system_log',
    fields: ['log_id', 'level', 'message', 'timestamp'],
    outputFormat: 'JSON',
    partitionStrategy: 'none',
    outputMode: 'realtime',
    enabled: false
  }
])

// 输出任务数据
const outputTasks = ref<OutputTask[]>([
  {
    id: 1,
    taskName: '用户数据批量输出',
    targetName: 'Hive数据仓库',
    strategyId: 1,
    fieldCount: 5,
    outputFormat: 'Parquet',
    status: 'success',
    progress: 100,
    startTime: '2025-10-28 08:00:00',
    endTime: '2025-10-28 08:15:32',
    recordCount: 150000
  },
  {
    id: 2,
    taskName: '订单数据增量同步',
    targetName: 'MySQL业务库',
    strategyId: 2,
    fieldCount: 5,
    outputFormat: 'JSON',
    status: 'running',
    progress: 65,
    startTime: '2025-10-28 09:00:00',
    endTime: '',
    recordCount: 32500
  },
  {
    id: 3,
    taskName: '日志实时写入',
    targetName: 'ES搜索引擎',
    strategyId: 3,
    fieldCount: 4,
    outputFormat: 'JSON',
    status: 'pending',
    progress: 0,
    startTime: '',
    endTime: '',
    recordCount: 0
  },
  {
    id: 4,
    taskName: '商品数据全量导出',
    targetName: 'Hive数据仓库',
    strategyId: 1,
    fieldCount: 8,
    outputFormat: 'CSV',
    status: 'failed',
    progress: 45,
    startTime: '2025-10-28 07:30:00',
    endTime: '2025-10-28 07:42:18',
    recordCount: 45000
  }
])

// 任务日志数据
const taskLogs = ref<TaskLog[]>([
  { id: 1, time: '2025-10-28 09:00:00', level: 'info', message: '任务开始执行' },
  { id: 2, time: '2025-10-28 09:00:05', level: 'info', message: '连接到目标数据库成功' },
  { id: 3, time: '2025-10-28 09:00:10', level: 'info', message: '开始读取源数据' },
  { id: 4, time: '2025-10-28 09:05:30', level: 'success', message: '已处理 10000 条记录' },
  { id: 5, time: '2025-10-28 09:10:45', level: 'success', message: '已处理 20000 条记录' },
  { id: 6, time: '2025-10-28 09:15:20', level: 'warning', message: '检测到部分字段为空，已自动填充默认值' },
  { id: 7, time: '2025-10-28 09:20:00', level: 'success', message: '已处理 30000 条记录' },
  { id: 8, time: '2025-10-28 09:22:15', level: 'info', message: '当前进度: 65%' }
])

// 目标对话框
const targetDialogVisible = ref(false)
const targetFormRef = ref<FormInstance>()
const targetForm = reactive({
  id: 0,
  targetName: '',
  targetType: 'Hive' as 'Hive' | 'MySQL' | 'Elasticsearch',
  host: '',
  port: 10000,
  username: '',
  password: '',
  status: 'disconnected' as 'connected' | 'disconnected' | 'testing'
})

const targetFormRules = {
  targetName: [{ required: true, message: '请输入目标名称', trigger: 'blur' }],
  targetType: [{ required: true, message: '请选择目标类型', trigger: 'change' }],
  host: [{ required: true, message: '请输入主机地址', trigger: 'blur' }],
  port: [{ required: true, message: '请输入端口号', trigger: 'blur' }],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

// 策略对话框
const strategyDialogVisible = ref(false)
const strategyFormRef = ref<FormInstance>()
const strategyForm = reactive({
  id: 0,
  strategyName: '',
  targetId: 0,
  tableName: '',
  fields: '',
  outputFormat: 'JSON' as 'JSON' | 'CSV' | 'Parquet',
  partitionStrategy: 'date',
  outputMode: 'batch' as 'batch' | 'incremental' | 'realtime',
  enabled: true
})

const strategyFormRules = {
  strategyName: [{ required: true, message: '请输入策略名称', trigger: 'blur' }],
  targetId: [{ required: true, message: '请选择输出目标', trigger: 'change' }],
  tableName: [{ required: true, message: '请输入表名', trigger: 'blur' }],
  fields: [{ required: true, message: '请输入字段列表', trigger: 'blur' }]
}

// 日志对话框
const logDialogVisible = ref(false)
const currentTask = ref<OutputTask | null>(null)

// 统计数据
const taskStats = computed(() => {
  const total = outputTasks.value.length
  const running = outputTasks.value.filter(t => t.status === 'running').length
  const success = outputTasks.value.filter(t => t.status === 'success').length
  const failed = outputTasks.value.filter(t => t.status === 'failed').length
  const totalRecords = outputTasks.value.reduce((sum, t) => sum + t.recordCount, 0)
  
  return { total, running, success, failed, totalRecords }
})

// 筛选后的任务
const filteredTasks = computed(() => {
  let tasks = outputTasks.value
  
  if (statusFilter.value && statusFilter.value !== 'all') {
    tasks = tasks.filter(t => t.status === statusFilter.value)
  }
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    tasks = tasks.filter(t =>
      t.taskName.toLowerCase().includes(keyword) ||
      t.targetName.toLowerCase().includes(keyword)
    )
  }
  
  return tasks
})

// 分页后的任务
const paginatedTasks = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredTasks.value.slice(start, end)
})

// 输出目标操作
const handleAddTarget = () => {
  Object.assign(targetForm, {
    id: 0,
    targetName: '',
    targetType: 'Hive',
    host: '',
    port: 10000,
    username: '',
    password: '',
    status: 'disconnected'
  })
  targetDialogVisible.value = true
}

const handleEditTarget = (row: OutputTarget) => {
  Object.assign(targetForm, { ...row })
  targetDialogVisible.value = true
}

const handleDeleteTarget = (row: OutputTarget) => {
  ElMessageBox.confirm('确认删除该输出目标？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    loading.value = true
    setTimeout(() => {
      const index = outputTargets.value.findIndex(item => item.id === row.id)
      if (index > -1) {
        outputTargets.value.splice(index, 1)
        ElMessage.success('删除成功')
      }
      loading.value = false
    }, 500)
  }).catch(() => {})
}

const handleTestConnection = (row: OutputTarget) => {
  row.status = 'testing'
  loading.value = true
  ElMessage.info('正在测试连接...')
  setTimeout(() => {
    const success = Math.random() > 0.3
    row.status = success ? 'connected' : 'disconnected'
    ElMessage[success ? 'success' : 'error'](success ? '连接成功' : '连接失败')
    loading.value = false
  }, 2000)
}

const submitTargetForm = async () => {
  if (!targetFormRef.value) return
  await targetFormRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      setTimeout(() => {
        if (targetForm.id === 0) {
          const newTarget = {
            ...targetForm,
            id: Date.now(),
            createTime: new Date().toLocaleString('zh-CN')
          }
          outputTargets.value.push(newTarget)
          ElMessage.success('添加成功')
        } else {
          const index = outputTargets.value.findIndex(item => item.id === targetForm.id)
          if (index > -1) {
            outputTargets.value[index] = {
              ...targetForm,
              createTime: outputTargets.value[index].createTime
            }
            ElMessage.success('更新成功')
          }
        }
        targetDialogVisible.value = false
        loading.value = false
      }, 800)
    }
  })
}

// 输出策略操作
const handleAddStrategy = () => {
  Object.assign(strategyForm, {
    id: 0,
    strategyName: '',
    targetId: 0,
    tableName: '',
    fields: '',
    outputFormat: 'JSON',
    partitionStrategy: 'date',
    outputMode: 'batch',
    enabled: true
  })
  strategyDialogVisible.value = true
}

const handleEditStrategy = (row: OutputStrategy) => {
  Object.assign(strategyForm, {
    ...row,
    fields: row.fields.join(', ')
  })
  strategyDialogVisible.value = true
}

const handleDeleteStrategy = (row: OutputStrategy) => {
  ElMessageBox.confirm('确认删除该输出策略？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    loading.value = true
    setTimeout(() => {
      const index = outputStrategies.value.findIndex(item => item.id === row.id)
      if (index > -1) {
        outputStrategies.value.splice(index, 1)
        ElMessage.success('删除成功')
      }
      loading.value = false
    }, 500)
  }).catch(() => {})
}

const submitStrategyForm = async () => {
  if (!strategyFormRef.value) return
  await strategyFormRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      setTimeout(() => {
        const target = outputTargets.value.find(t => t.id === strategyForm.targetId)
        const fieldsArray = strategyForm.fields.split(',').map(f => f.trim())
        
        if (strategyForm.id === 0) {
          const newStrategy = {
            ...strategyForm,
            id: Date.now(),
            targetName: target?.targetName || '',
            fields: fieldsArray
          }
          outputStrategies.value.push(newStrategy)
          ElMessage.success('策略添加成功')
        } else {
          const index = outputStrategies.value.findIndex(item => item.id === strategyForm.id)
          if (index > -1) {
            outputStrategies.value[index] = {
              ...strategyForm,
              targetName: target?.targetName || '',
              fields: fieldsArray
            }
            ElMessage.success('策略更新成功')
          }
        }
        strategyDialogVisible.value = false
        loading.value = false
      }, 800)
    }
  })
}

// 任务操作
const handleStartTask = (row: OutputTask) => {
  if (row.status === 'running') {
    ElMessage.warning('任务正在运行中')
    return
  }
  
  loading.value = true
  ElMessage.info('启动任务...')
  setTimeout(() => {
    row.status = 'running'
    row.progress = 0
    row.startTime = new Date().toLocaleString('zh-CN')
    row.endTime = ''
    ElMessage.success('任务已启动')
    loading.value = false
    
    // 模拟进度更新
    simulateProgress(row)
  }, 1000)
}

const handlePauseTask = (row: OutputTask) => {
  if (row.status !== 'running') {
    ElMessage.warning('任务未在运行')
    return
  }
  
  loading.value = true
  setTimeout(() => {
    row.status = 'pending'
    ElMessage.success('任务已暂停')
    loading.value = false
  }, 500)
}

const handleRetryTask = (row: OutputTask) => {
  loading.value = true
  ElMessage.info('重试任务...')
  setTimeout(() => {
    row.status = 'running'
    row.progress = 0
    row.startTime = new Date().toLocaleString('zh-CN')
    row.endTime = ''
    row.recordCount = 0
    ElMessage.success('任务已重新启动')
    loading.value = false
    simulateProgress(row)
  }, 1000)
}

const handleViewLog = (row: OutputTask) => {
  currentTask.value = row
  logDialogVisible.value = true
}

// 模拟进度更新
const simulateProgress = (task: OutputTask) => {
  const interval = setInterval(() => {
    if (task.status !== 'running') {
      clearInterval(interval)
      return
    }
    
    task.progress += Math.floor(Math.random() * 10) + 5
    task.recordCount += Math.floor(Math.random() * 5000) + 1000
    
    if (task.progress >= 100) {
      task.progress = 100
      task.status = Math.random() > 0.2 ? 'success' : 'failed'
      task.endTime = new Date().toLocaleString('zh-CN')
      clearInterval(interval)
      
      ElMessage[task.status === 'success' ? 'success' : 'error'](
        task.status === 'success' ? '任务执行成功' : '任务执行失败'
      )
    }
  }, 2000)
}

// 获取状态标签
const getStatusTag = (status: string) => {
  const statusMap: Record<string, { label: string; type: any }> = {
    pending: { label: '未执行', type: 'info' },
    running: { label: '执行中', type: 'warning' },
    success: { label: '成功', type: 'success' },
    failed: { label: '失败', type: 'danger' },
    connected: { label: '已连接', type: 'success' },
    disconnected: { label: '未连接', type: 'info' },
    testing: { label: '测试中', type: 'warning' }
  }
  return statusMap[status] || { label: status, type: 'info' }
}

// 获取日志级别标签
const getLogLevelTag = (level: string) => {
  const levelMap: Record<string, any> = {
    info: 'info',
    warning: 'warning',
    error: 'danger',
    success: 'success'
  }
  return levelMap[level] || 'info'
}
</script>

<template>
  <div class="data-output-container">
    <!-- 页面标题 -->
    <el-card class="header-card" shadow="never">
      <div class="header-content">
        <div class="header-left">
          <h2>数据汇聚与输出</h2>
          <p class="subtitle">统一写入数据湖或中间层，支持多目标输出</p>
        </div>
        <div class="header-right">
          <el-button type="primary" @click="handleAddTarget">
            <el-icon><Connection /></el-icon>
            添加目标
          </el-button>
          <el-button type="success" @click="handleAddStrategy">
            <el-icon><SetUp /></el-icon>
            配置策略
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <div class="stat-icon total">
              <el-icon><Folder /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ taskStats.total }}</div>
              <div class="stat-label">总任务数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <div class="stat-icon running">
              <el-icon><Loading /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ taskStats.running }}</div>
              <div class="stat-label">运行中</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <div class="stat-icon success">
              <el-icon><Select /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ taskStats.success }}</div>
              <div class="stat-label">成功任务</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <div class="stat-icon records">
              <el-icon><DataLine /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ (taskStats.totalRecords / 10000).toFixed(1) }}w</div>
              <div class="stat-label">总记录数</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 输出目标配置 -->
    <el-card class="section-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><Connection /></el-icon>
            输出目标配置
          </span>
        </div>
      </template>

      <el-table :data="outputTargets" :loading="loading" stripe style="width: 100%">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="targetName" label="目标名称" min-width="150" />
        <el-table-column label="目标类型" width="120">
          <template #default="{ row }">
            <el-tag
              :type="row.targetType === 'Hive' ? 'primary' : row.targetType === 'MySQL' ? 'success' : 'warning'"
              size="small"
            >
              {{ row.targetType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="host" label="主机地址" width="150" />
        <el-table-column prop="port" label="端口" width="80" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status).type" size="small">
              {{ getStatusTag(row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleTestConnection(row)">
              <el-icon><Link /></el-icon>
              测试连接
            </el-button>
            <el-button link type="primary" @click="handleEditTarget(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button link type="danger" @click="handleDeleteTarget(row)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 输出策略配置 -->
    <el-card class="section-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><SetUp /></el-icon>
            输出策略配置
          </span>
        </div>
      </template>

      <el-table :data="outputStrategies" :loading="loading" stripe style="width: 100%">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="strategyName" label="策略名称" min-width="180" />
        <el-table-column prop="targetName" label="输出目标" width="150" />
        <el-table-column prop="tableName" label="表名" width="120" />
        <el-table-column label="字段列表" min-width="200">
          <template #default="{ row }">
            <el-tag
              v-for="(field, index) in row.fields.slice(0, 3)"
              :key="index"
              size="small"
              style="margin-right: 5px"
            >
              {{ field }}
            </el-tag>
            <span v-if="row.fields.length > 3" class="more-fields">
              +{{ row.fields.length - 3 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="outputFormat" label="输出格式" width="100" />
        <el-table-column label="输出模式" width="100">
          <template #default="{ row }">
            <el-tag
              :type="row.outputMode === 'batch' ? 'primary' : row.outputMode === 'incremental' ? 'success' : 'warning'"
              size="small"
            >
              {{ row.outputMode === 'batch' ? '批量' : row.outputMode === 'incremental' ? '增量' : '实时' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
              {{ row.enabled ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEditStrategy(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button link type="danger" @click="handleDeleteStrategy(row)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 输出任务列表 -->
    <el-card class="section-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><List /></el-icon>
            输出任务列表
          </span>
          <div class="card-actions">
            <el-select v-model="statusFilter" placeholder="筛选状态" style="width: 120px; margin-right: 10px">
              <el-option label="全部" value="all" />
              <el-option label="未执行" value="pending" />
              <el-option label="执行中" value="running" />
              <el-option label="成功" value="success" />
              <el-option label="失败" value="failed" />
            </el-select>
            <el-input
              v-model="searchKeyword"
              placeholder="搜索任务名"
              clearable
              style="width: 200px"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
        </div>
      </template>

      <el-table :data="paginatedTasks" :loading="loading" stripe style="width: 100%">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="taskName" label="任务名称" min-width="180" />
        <el-table-column prop="targetName" label="输出目标" width="150" />
        <el-table-column prop="fieldCount" label="字段数" width="80" />
        <el-table-column prop="outputFormat" label="输出格式" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status).type" size="small">
              {{ getStatusTag(row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="进度" width="180">
          <template #default="{ row }">
            <el-progress
              :percentage="row.progress"
              :status="row.status === 'failed' ? 'exception' : row.status === 'success' ? 'success' : undefined"
              :stroke-width="8"
            />
          </template>
        </el-table-column>
        <el-table-column prop="recordCount" label="记录数" width="100">
          <template #default="{ row }">
            <span class="record-count">{{ row.recordCount.toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="success"
              @click="handleStartTask(row)"
              :disabled="row.status === 'running'"
            >
              <el-icon><VideoPlay /></el-icon>
              启动
            </el-button>
            <el-button
              link
              type="warning"
              @click="handlePauseTask(row)"
              :disabled="row.status !== 'running'"
            >
              <el-icon><VideoPause /></el-icon>
              暂停
            </el-button>
            <el-button
              link
              type="primary"
              @click="handleRetryTask(row)"
              :disabled="row.status === 'running'"
            >
              <el-icon><Refresh /></el-icon>
              重试
            </el-button>
            <el-button link type="primary" @click="handleViewLog(row)">
              <el-icon><Document /></el-icon>
              日志
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[5, 10, 20, 50]"
          :total="filteredTasks.length"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </el-card>

    <!-- 目标配置对话框 -->
    <el-dialog
      v-model="targetDialogVisible"
      :title="targetForm.id ? '编辑输出目标' : '添加输出目标'"
      width="600px"
    >
      <el-form
        ref="targetFormRef"
        :model="targetForm"
        :rules="targetFormRules"
        label-width="100px"
      >
        <el-form-item label="目标名称" prop="targetName">
          <el-input v-model="targetForm.targetName" placeholder="请输入目标名称" />
        </el-form-item>
        <el-form-item label="目标类型" prop="targetType">
          <el-select v-model="targetForm.targetType" style="width: 100%">
            <el-option label="Hive" value="Hive" />
            <el-option label="MySQL" value="MySQL" />
            <el-option label="Elasticsearch" value="Elasticsearch" />
          </el-select>
        </el-form-item>
        <el-form-item label="主机地址" prop="host">
          <el-input v-model="targetForm.host" placeholder="请输入主机地址" />
        </el-form-item>
        <el-form-item label="端口号" prop="port">
          <el-input-number v-model="targetForm.port" :min="1" :max="65535" style="width: 100%" />
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="targetForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="targetForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="targetDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitTargetForm" :loading="loading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 策略配置对话框 -->
    <el-dialog
      v-model="strategyDialogVisible"
      :title="strategyForm.id ? '编辑输出策略' : '配置输出策略'"
      width="600px"
    >
      <el-form
        ref="strategyFormRef"
        :model="strategyForm"
        :rules="strategyFormRules"
        label-width="100px"
      >
        <el-form-item label="策略名称" prop="strategyName">
          <el-input v-model="strategyForm.strategyName" placeholder="请输入策略名称" />
        </el-form-item>
        <el-form-item label="输出目标" prop="targetId">
          <el-select v-model="strategyForm.targetId" style="width: 100%">
            <el-option
              v-for="target in outputTargets"
              :key="target.id"
              :label="target.targetName"
              :value="target.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="表名" prop="tableName">
          <el-input v-model="strategyForm.tableName" placeholder="请输入表名" />
        </el-form-item>
        <el-form-item label="字段列表" prop="fields">
          <el-input
            v-model="strategyForm.fields"
            type="textarea"
            :rows="3"
            placeholder="请输入字段列表，用逗号分隔，如: user_id, username, email"
          />
        </el-form-item>
        <el-form-item label="输出格式">
          <el-radio-group v-model="strategyForm.outputFormat">
            <el-radio label="JSON">JSON</el-radio>
            <el-radio label="CSV">CSV</el-radio>
            <el-radio label="Parquet">Parquet</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="分区策略">
          <el-select v-model="strategyForm.partitionStrategy" style="width: 100%">
            <el-option label="按日期分区" value="date" />
            <el-option label="按小时分区" value="hour" />
            <el-option label="按月份分区" value="month" />
            <el-option label="不分区" value="none" />
          </el-select>
        </el-form-item>
        <el-form-item label="输出模式">
          <el-radio-group v-model="strategyForm.outputMode">
            <el-radio label="batch">批量</el-radio>
            <el-radio label="incremental">增量</el-radio>
            <el-radio label="realtime">实时</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="strategyForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="strategyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitStrategyForm" :loading="loading">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 任务日志对话框 -->
    <el-dialog v-model="logDialogVisible" title="任务执行日志" width="900px">
      <div v-if="currentTask" class="log-header">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="任务名称">
            {{ currentTask.taskName }}
          </el-descriptions-item>
          <el-descriptions-item label="输出目标">
            {{ currentTask.targetName }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTag(currentTask.status).type" size="small">
              {{ getStatusTag(currentTask.status).label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="开始时间">
            {{ currentTask.startTime }}
          </el-descriptions-item>
          <el-descriptions-item label="结束时间">
            {{ currentTask.endTime || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="记录数">
            {{ currentTask.recordCount.toLocaleString() }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="progress-section">
          <div class="progress-label">执行进度</div>
          <el-progress
            :percentage="currentTask.progress"
            :status="currentTask.status === 'failed' ? 'exception' : currentTask.status === 'success' ? 'success' : undefined"
            :stroke-width="20"
          />
        </div>
      </div>

      <div class="log-content">
        <div class="log-title">执行日志</div>
        <div class="log-list">
          <div
            v-for="log in taskLogs"
            :key="log.id"
            class="log-item"
            :class="`log-${log.level}`"
          >
            <el-tag :type="getLogLevelTag(log.level)" size="small" class="log-tag">
              {{ log.level.toUpperCase() }}
            </el-tag>
            <span class="log-time">{{ log.time }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button type="primary" @click="logDialogVisible = false">
          关闭
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.data-output-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;

  .header-card {
    margin-bottom: 20px;
    border-radius: 8px;

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-left {
        h2 {
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 600;
          color: #303133;
        }

        .subtitle {
          margin: 0;
          font-size: 14px;
          color: #909399;
        }
      }

      .header-right {
        display: flex;
        gap: 10px;
      }
    }
  }

  .stats-row {
    margin-bottom: 20px;

    .stat-card {
      border-radius: 8px;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-4px);
      }

      .stat-item {
        display: flex;
        align-items: center;
        gap: 16px;

        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: white;

          &.total {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }

          &.running {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          }

          &.success {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
          }

          &.records {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          }
        }

        .stat-info {
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

  .section-card {
    margin-bottom: 20px;
    border-radius: 8px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .card-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }

      .card-actions {
        display: flex;
        align-items: center;
      }
    }
  }

  .more-fields {
    color: #909399;
    font-size: 12px;
  }

  .record-count {
    font-weight: 500;
    color: #409eff;
  }

  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .log-header {
    margin-bottom: 20px;

    .progress-section {
      margin-top: 20px;
      padding: 16px;
      background: #f5f7fa;
      border-radius: 8px;

      .progress-label {
        margin-bottom: 12px;
        font-size: 14px;
        font-weight: 500;
        color: #303133;
      }
    }
  }

  .log-content {
    .log-title {
      margin-bottom: 12px;
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }

    .log-list {
      max-height: 400px;
      overflow-y: auto;
      background: #1e1e1e;
      border-radius: 8px;
      padding: 12px;

      .log-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 12px;
        margin-bottom: 8px;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        font-size: 13px;

        .log-tag {
          min-width: 60px;
          text-align: center;
        }

        .log-time {
          color: #909399;
          min-width: 160px;
        }

        .log-message {
          color: #dcdfe6;
          flex: 1;
        }

        &.log-error {
          background: rgba(245, 108, 108, 0.1);
        }

        &.log-warning {
          background: rgba(230, 162, 60, 0.1);
        }

        &.log-success {
          background: rgba(103, 194, 58, 0.1);
        }
      }
    }
  }

  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid #ebeef5;
  }

  :deep(.el-card__body) {
    padding: 20px;
  }

  :deep(.el-table) {
    font-size: 14px;
  }

  :deep(.el-button + .el-button) {
    margin-left: 0;
  }

  :deep(.el-descriptions) {
    margin-top: 10px;
  }
}
</style>