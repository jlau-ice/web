<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'

// 调试状态枚举
enum DebugStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ERROR = 'error'
}

// 调试速度枚举
enum DebugSpeed {
  SLOW = 1000,
  NORMAL = 500,
  FAST = 200
}

// 执行节点接口
interface ExecutionNode {
  id: number
  name: string
  type: string
  status: 'pending' | 'running' | 'completed' | 'error'
  startTime?: string
  endTime?: string
  duration?: number
  logs: string[]
}

// 变量监视接口
interface WatchVariable {
  name: string
  value: any
  type: string
  changed: boolean
}

// 调试历史接口
interface DebugHistory {
  id: number
  timestamp: string
  inputData: any
  status: DebugStatus
  duration: number
  result?: any
  error?: string
}

// 调试状态
const debugStatus = ref<DebugStatus>(DebugStatus.IDLE)
const debugSpeed = ref<DebugSpeed>(DebugSpeed.NORMAL)
const executionTime = ref(0)
const currentNodeIndex = ref(-1)

// 输入配置
const inputData = ref(`{
  "userId": "12345",
  "requestType": "query",
  "parameters": {
    "keyword": "test",
    "limit": 10,
    "offset": 0
  }
}`)
const inputTemplates = [
  {
    label: '用户查询',
    value: `{
  "userId": "12345",
  "requestType": "query",
  "parameters": {
    "keyword": "test",
    "limit": 10,
    "offset": 0
  }
}`
  },
  {
    label: '数据更新',
    value: `{
  "userId": "12345",
  "requestType": "update",
  "data": {
    "id": "abc123",
    "name": "Updated Name",
    "status": "active"
  }
}`
  },
  {
    label: '批量操作',
    value: `{
  "userId": "12345",
  "requestType": "batch",
  "operations": [
    {"action": "create", "data": {"name": "Item 1"}},
    {"action": "update", "data": {"id": "123", "name": "Item 2"}},
    {"action": "delete", "data": {"id": "456"}}
  ]
}`
  }
]

// 执行节点
const executionNodes = ref<ExecutionNode[]>([
  {
    id: 1,
    name: '请求验证',
    type: 'validation',
    status: 'pending',
    logs: []
  },
  {
    id: 2,
    name: '数据预处理',
    type: 'preprocessing',
    status: 'pending',
    logs: []
  },
  {
    id: 3,
    name: '业务逻辑执行',
    type: 'business',
    status: 'pending',
    logs: []
  },
  {
    id: 4,
    name: '数据库操作',
    type: 'database',
    status: 'pending',
    logs: []
  },
  {
    id: 5,
    name: '结果封装',
    type: 'formatting',
    status: 'pending',
    logs: []
  },
  {
    id: 6,
    name: '响应返回',
    type: 'response',
    status: 'pending',
    logs: []
  }
])

// 变量监视
const watchedVariables = ref<WatchVariable[]>([
  { name: 'userId', value: '12345', type: 'string', changed: false },
  { name: 'requestType', value: 'query', type: 'string', changed: false },
  { name: 'validationResult', value: true, type: 'boolean', changed: false },
  { name: 'processedData', value: null, type: 'object', changed: false }
])

// 调试结果
const debugOutput = ref<string>('')
const debugError = ref<string>('')
const debugResult = ref<any>(null)

// 调试历史
const debugHistory = ref<DebugHistory[]>([])

// 定时器
let executionTimer: number | null = null
let timeCounter: number | null = null

// 计算属性
const statusConfig = computed(() => {
  const configs = {
    [DebugStatus.IDLE]: { color: '#909399', text: '未开始', icon: 'DocumentCopy' },
    [DebugStatus.RUNNING]: { color: '#409EFF', text: '运行中', icon: 'VideoPlay' },
    [DebugStatus.PAUSED]: { color: '#E6A23C', text: '已暂停', icon: 'VideoPause' },
    [DebugStatus.COMPLETED]: { color: '#67C23A', text: '已完成', icon: 'CircleCheck' },
    [DebugStatus.ERROR]: { color: '#F56C6C', text: '执行错误', icon: 'CircleClose' }
  }
  return configs[debugStatus.value]
})

const isInputValid = computed(() => {
  try {
    JSON.parse(inputData.value)
    return true
  } catch {
    return false
  }
})

const currentNode = computed(() => {
  if (currentNodeIndex.value >= 0 && currentNodeIndex.value < executionNodes.value.length) {
    return executionNodes.value[currentNodeIndex.value]
  }
  return null
})

const progressPercentage = computed(() => {
  if (executionNodes.value.length === 0) return 0
  const completedCount = executionNodes.value.filter(node => node.status === 'completed').length
  return Math.round((completedCount / executionNodes.value.length) * 100)
})

// 方法：验证输入数据
const validateInput = () => {
  try {
    JSON.parse(inputData.value)
    ElMessage.success('输入数据格式验证通过')
    return true
  } catch (error: any) {
    ElMessage.error('JSON 格式错误: ' + error.message)
    return false
  }
}

// 方法：加载模板
const loadTemplate = (template: string) => {
  inputData.value = template
  ElMessage.success('模板加载成功')
}

// 方法：保存输入数据
const saveInputData = () => {
  if (!isInputValid.value) {
    ElMessage.error('请先修正输入数据格式')
    return
  }
  localStorage.setItem('debugInputData', inputData.value)
  ElMessage.success('输入数据已保存')
}

// 方法：加载保存的数据
const loadSavedData = () => {
  const saved = localStorage.getItem('debugInputData')
  if (saved) {
    inputData.value = saved
    ElMessage.success('已加载保存的数据')
  } else {
    ElMessage.warning('没有找到保存的数据')
  }
}

// 方法：开始调试
const startDebug = async () => {
  if (!validateInput()) return

  // 重置状态
  resetDebugState()
  debugStatus.value = DebugStatus.RUNNING
  currentNodeIndex.value = 0
  executionTime.value = 0
  debugOutput.value = ''
  debugError.value = ''

  // 添加日志
  addLog('调试会话开始...')
  addLog('输入数据: ' + inputData.value)

  // 启动时间计数器
  startTimeCounter()

  // 执行调试
  await executeNextNode()
}

// 方法：暂停调试
const pauseDebug = () => {
  if (debugStatus.value === DebugStatus.RUNNING) {
    debugStatus.value = DebugStatus.PAUSED
    if (executionTimer) {
      clearTimeout(executionTimer)
      executionTimer = null
    }
    if (timeCounter) {
      clearInterval(timeCounter)
      timeCounter = null
    }
    addLog('调试已暂停')
    ElMessage.info('调试已暂停')
  }
}

// 方法：继续调试
const continueDebug = async () => {
  if (debugStatus.value === DebugStatus.PAUSED) {
    debugStatus.value = DebugStatus.RUNNING
    addLog('调试继续执行...')
    startTimeCounter()
    await executeNextNode()
  }
}

// 方法：停止调试
const stopDebug = () => {
  if (executionTimer) {
    clearTimeout(executionTimer)
    executionTimer = null
  }
  if (timeCounter) {
    clearInterval(timeCounter)
    timeCounter = null
  }

  if (debugStatus.value === DebugStatus.RUNNING || debugStatus.value === DebugStatus.PAUSED) {
    debugStatus.value = DebugStatus.IDLE
    addLog('调试已停止')
    ElMessage.warning('调试已停止')

    // 保存到历史记录
    saveToHistory(DebugStatus.IDLE)
  }
}

// 方法：单步执行
const stepDebug = async () => {
  if (debugStatus.value === DebugStatus.IDLE) {
    // 第一次单步，初始化
    resetDebugState()
    debugStatus.value = DebugStatus.PAUSED
    currentNodeIndex.value = 0
    executionTime.value = 0
    addLog('单步调试开始...')
  }

  if (currentNodeIndex.value < executionNodes.value.length) {
    await executeCurrentNode()
    currentNodeIndex.value++

    if (currentNodeIndex.value >= executionNodes.value.length) {
      completeDebug()
    }
  }
}

// 方法：执行下一个节点
const executeNextNode = async () => {
  if (debugStatus.value !== DebugStatus.RUNNING) return

  if (currentNodeIndex.value < executionNodes.value.length) {
    await executeCurrentNode()
    currentNodeIndex.value++

    if (currentNodeIndex.value < executionNodes.value.length) {
      // 继续下一个节点
      executionTimer = window.setTimeout(() => {
        executeNextNode()
      }, debugSpeed.value)
    } else {
      // 所有节点执行完成
      completeDebug()
    }
  }
}

// 方法：执行当前节点
const executeCurrentNode = async () => {
  const node = executionNodes.value[currentNodeIndex.value]
  if (!node) return

  return new Promise<void>((resolve) => {
    node.status = 'running'
    node.startTime = new Date().toLocaleTimeString()
    addLog(`开始执行: ${node.name}`)

    // 模拟节点执行
    setTimeout(() => {
      node.endTime = new Date().toLocaleTimeString()
      node.duration = Math.floor(Math.random() * 500) + 100

      // 模拟90%成功率
      if (Math.random() > 0.1) {
        node.status = 'completed'
        addLog(`${node.name} 执行成功 (耗时: ${node.duration}ms)`)

        // 模拟变量变化
        updateVariables(currentNodeIndex.value)

        // 添加节点特定的日志
        addNodeSpecificLogs(node)
      } else {
        node.status = 'error'
        debugStatus.value = DebugStatus.ERROR
        const errorMsg = `${node.name} 执行失败: 模拟错误`
        addLog(errorMsg)
        debugError.value = errorMsg

        if (timeCounter) {
          clearInterval(timeCounter)
          timeCounter = null
        }

        saveToHistory(DebugStatus.ERROR, errorMsg)
      }

      resolve()
    }, 300)
  })
}

// 方法：添加节点特定日志
const addNodeSpecificLogs = (node: ExecutionNode) => {
  const logTemplates: Record<string, string[]> = {
    'validation': [
      '验证请求参数完整性...',
      '检查 userId 格式: 通过',
      '检查 requestType 有效性: 通过',
      '参数验证通过'
    ],
    'preprocessing': [
      '开始数据预处理...',
      '解析 JSON 数据结构',
      '提取关键字段: userId, requestType, parameters',
      '数据预处理完成'
    ],
    'business': [
      '执行业务逻辑...',
      '加载业务规则配置',
      '应用业务规则: rule_001, rule_002',
      '业务逻辑执行完成'
    ],
    'database': [
      '连接数据库...',
      '执行查询: SELECT * FROM users WHERE id = "12345"',
      '查询返回 1 条记录',
      '数据库操作完成'
    ],
    'formatting': [
      '封装返回结果...',
      '格式化数据结构',
      '添加响应头信息',
      '结果封装完成'
    ],
    'response': [
      '准备响应数据...',
      '设置状态码: 200',
      '设置响应头: Content-Type: application/json',
      '响应返回完成'
    ]
  }

  const logs = logTemplates[node.type] || ['执行完成']
  logs.forEach(log => {
    node.logs.push(`[${new Date().toLocaleTimeString()}] ${log}`)
  })
}

// 方法：更新变量
const updateVariables = (nodeIndex: number) => {
  // 重置所有变量的 changed 标志
  watchedVariables.value.forEach(v => v.changed = false)

  // 根据节点索引模拟变量变化
  switch (nodeIndex) {
    case 0: // 请求验证
      updateVariable('validationResult', true, 'boolean')
      break
    case 1: // 数据预处理
      updateVariable('processedData', {
        userId: '12345',
        requestType: 'query',
        parameters: { keyword: 'test', limit: 10 }
      }, 'object')
      break
    case 2: // 业务逻辑执行
      updateVariable('businessResult', { status: 'processed', ruleApplied: true }, 'object')
      break
    case 3: // 数据库操作
      updateVariable('dbResult', [{ id: 1, name: 'Test User', email: 'test@example.com' }], 'array')
      break
    case 4: // 结果封装
      updateVariable('formattedResult', {
        code: 200,
        message: 'Success',
        data: { user: 'Test User' }
      }, 'object')
      break
  }
}

// 方法：更新单个变量
const updateVariable = (name: string, value: any, type: string) => {
  const variable = watchedVariables.value.find(v => v.name === name)
  if (variable) {
    variable.value = value
    variable.type = type
    variable.changed = true
  } else {
    watchedVariables.value.push({ name, value, type, changed: true })
  }
}

// 方法：添加日志
const addLog = (message: string) => {
  const timestamp = new Date().toLocaleTimeString()
  debugOutput.value += `[${timestamp}] ${message}\n`
}

// 方法：完成调试
const completeDebug = () => {
  debugStatus.value = DebugStatus.COMPLETED

  if (timeCounter) {
    clearInterval(timeCounter)
    timeCounter = null
  }

  // 生成最终结果
  debugResult.value = {
    code: 200,
    message: 'Success',
    data: {
      userId: '12345',
      result: 'Query executed successfully',
      items: [
        { id: 1, name: 'Item 1', status: 'active' },
        { id: 2, name: 'Item 2', status: 'active' }
      ],
      totalCount: 2
    },
    executionTime: executionTime.value + 'ms'
  }

  addLog('调试会话完成')
  addLog('最终结果: ' + JSON.stringify(debugResult.value, null, 2))

  ElMessage.success('调试执行完成')

  // 保存到历史记录
  saveToHistory(DebugStatus.COMPLETED)
}

// 方法：重置调试状态
const resetDebugState = () => {
  currentNodeIndex.value = -1
  executionNodes.value.forEach(node => {
    node.status = 'pending'
    node.startTime = undefined
    node.endTime = undefined
    node.duration = undefined
    node.logs = []
  })
  watchedVariables.value.forEach(v => v.changed = false)
}

// 方法：启动时间计数器
const startTimeCounter = () => {
  if (timeCounter) {
    clearInterval(timeCounter)
  }
  timeCounter = window.setInterval(() => {
    executionTime.value += 10
  }, 10)
}

// 方法：保存到历史记录
const saveToHistory = (status: DebugStatus, error?: string) => {
  try {
    const history: DebugHistory = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      inputData: JSON.parse(inputData.value),
      status,
      duration: executionTime.value,
      result: debugResult.value,
      error
    }

    debugHistory.value.unshift(history)

    // 最多保存20条记录
    if (debugHistory.value.length > 20) {
      debugHistory.value = debugHistory.value.slice(0, 20)
    }

    // 保存到本地存储
    localStorage.setItem('debugHistory', JSON.stringify(debugHistory.value))
  } catch (error) {
    console.error('保存历史记录失败:', error)
  }
}

// 方法：加载历史记录
const loadHistory = () => {
  try {
    const saved = localStorage.getItem('debugHistory')
    if (saved) {
      debugHistory.value = JSON.parse(saved)
    }
  } catch (error) {
    console.error('加载历史记录失败:', error)
  }
}

// 方法：重放历史记录
const replayHistory = (history: DebugHistory) => {
  inputData.value = JSON.stringify(history.inputData, null, 2)
  ElMessage.success('已加载历史调试数据，点击"开始调试"重新执行')
}

// 方法：清空历史记录
const clearHistory = () => {
  ElMessageBox.confirm('确定要清空所有调试历史记录吗？', '确认操作', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    debugHistory.value = []
    localStorage.removeItem('debugHistory')
    ElMessage.success('历史记录已清空')
  }).catch(() => { })
}

// 方法：导出结果
const exportResult = () => {
  const result = {
    timestamp: new Date().toLocaleString(),
    inputData: inputData.value,
    executionTime: executionTime.value,
    output: debugOutput.value,
    error: debugError.value,
    finalResult: debugResult.value,
    executionNodes: executionNodes.value.map(node => ({
      name: node.name,
      status: node.status,
      duration: node.duration,
      logs: node.logs
    }))
  }

  const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `debug-result-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)

  ElMessage.success('调试结果已导出')
}

// 方法：复制变量值
const copyVariableValue = (variable: WatchVariable) => {
  const value = typeof variable.value === 'object'
    ? JSON.stringify(variable.value, null, 2)
    : String(variable.value)

  navigator.clipboard.writeText(value).then(() => {
    ElMessage.success(`已复制变量 ${variable.name} 的值`)
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

// 方法：格式化 JSON
const formatJSON = () => {
  try {
    const obj = JSON.parse(inputData.value)
    inputData.value = JSON.stringify(obj, null, 2)
    ElMessage.success('JSON 格式化成功')
  } catch (error: any) {
    ElMessage.error('格式化失败: ' + error.message)
  }
}

// 生命周期
onMounted(() => {
  loadHistory()
})

onUnmounted(() => {
  if (executionTimer) {
    clearTimeout(executionTimer)
  }
  if (timeCounter) {
    clearInterval(timeCounter)
  }
})
</script>

<template>
    <div class="online-debug-tool">
        <!-- 页面标题 -->
        <div class="page-header">
            <h2>在线调试工具</h2>
            <p>实时调试环境，支持服务的逐步调试和问题排查</p>
        </div>
    
        <!-- 主要内容区域 -->
        <el-row :gutter="20" class="debug-container">
            <!-- 左侧：调试控制面板 -->
            <el-col :span="6">
                <el-card class="control-panel" shadow="hover">
                    <template #header>
                        <div class="card-header">
                            <span>调试控制面板</span>
                        </div>
                    </template>
    
                    <!-- 当前状态 -->
                    <div class="status-section">
                        <el-alert :title="statusConfig.text" :type="debugStatus === DebugStatus.COMPLETED ? 'success' : 
                         debugStatus === DebugStatus.ERROR ? 'error' : 
                         debugStatus === DebugStatus.RUNNING ? 'info' : 
                         debugStatus === DebugStatus.PAUSED ? 'warning' : 'info'" :closable="false" show-icon />
    
                        <div class="execution-time">
                            <span>执行时间:</span>
                            <el-tag :type="debugStatus === DebugStatus.RUNNING ? 'primary' : 'info'" size="large">
                                {{ executionTime }}ms
                            </el-tag>
                        </div>
    
                        <el-progress :percentage="progressPercentage" :status="debugStatus === DebugStatus.ERROR ? 'exception' : 
                           debugStatus === DebugStatus.COMPLETED ? 'success' : undefined" />
                    </div>
    
                    <el-divider />
    
                    <!-- 控制按钮 -->
                    <div class="control-buttons">
                        <el-button type="primary" :icon="debugStatus === DebugStatus.RUNNING ? 'VideoPause' : 'VideoPlay'"
                            @click="startDebug"
                            :disabled="debugStatus === DebugStatus.RUNNING || debugStatus === DebugStatus.PAUSED"
                            style="width: 100%">
                            开始调试
                        </el-button>
    
                        <el-row :gutter="10">
                            <el-col :span="12">
                                <el-button :icon="'VideoPause'" @click="pauseDebug"
                                    :disabled="debugStatus !== DebugStatus.RUNNING" style="width: 100%">
                                    暂停
                                </el-button>
                            </el-col>
                            <el-col :span="12">
                                <el-button :icon="'VideoPlay'" @click="continueDebug"
                                    :disabled="debugStatus !== DebugStatus.PAUSED" style="width: 100%">
                                    继续
                                </el-button>
                            </el-col>
                        </el-row>
    
                        <el-row :gutter="10">
                            <el-col :span="12">
                                <el-button :icon="'DArrowRight'" @click="stepDebug"
                                    :disabled="debugStatus === DebugStatus.RUNNING || debugStatus === DebugStatus.COMPLETED"
                                    style="width: 100%">
                                    单步
                                </el-button>
                            </el-col>
                            <el-col :span="12">
                                <el-button type="danger" :icon="'Close'" @click="stopDebug"
                                    :disabled="debugStatus === DebugStatus.IDLE || debugStatus === DebugStatus.COMPLETED"
                                    style="width: 100%">
                                    停止
                                </el-button>
                            </el-col>
                        </el-row>
                    </div>
    
                    <el-divider />
    
                    <!-- 调试速度 -->
                    <div class="speed-control">
                        <div class="control-label">调试速度</div>
                        <el-radio-group v-model="debugSpeed" size="small" style="width: 100%">
                            <el-radio-button :value="DebugSpeed.SLOW" style="width: 33.33%">慢速</el-radio-button>
                            <el-radio-button :value="DebugSpeed.NORMAL" style="width: 33.33%">正常</el-radio-button>
                            <el-radio-button :value="DebugSpeed.FAST" style="width: 33.34%">快速</el-radio-button>
                        </el-radio-group>
                    </div>
    
                    <el-divider />
    
                    <!-- 服务输入配置 -->
                    <div class="input-config">
                        <div class="control-label">
                            <span>输入数据</span>
                            <el-tag :type="isInputValid ? 'success' : 'danger'" size="small">
                                {{ isInputValid ? '格式正确' : '格式错误' }}
                            </el-tag>
                        </div>
    
                        <el-input v-model="inputData" type="textarea" :rows="8" placeholder="请输入 JSON 格式的调试数据"
                            class="input-editor" />
    
                        <div class="input-actions">
                            <el-button size="small" @click="validateInput" style="width: 48%">验证</el-button>
                            <el-button size="small" @click="formatJSON" style="width: 48%">格式化</el-button>
                        </div>
    
                        <div class="input-actions">
                            <el-button size="small" @click="saveInputData" style="width: 48%">保存</el-button>
                            <el-button size="small" @click="loadSavedData" style="width: 48%">加载</el-button>
                        </div>
    
                        <div class="control-label" style="margin-top: 10px">数据模板</div>
                        <el-button v-for="template in inputTemplates" :key="template.label" size="small"
                            @click="loadTemplate(template.value)" style="width: 100%; margin-bottom: 5px">
                            {{ template.label }}
                        </el-button>
                    </div>
                </el-card>
            </el-col>
    
            <!-- 中间：执行过程监控 -->
            <el-col :span="12">
                <el-card class="execution-monitor" shadow="hover">
                    <template #header>
                        <div class="card-header">
                            <span>执行过程监控</span>
                        </div>
                    </template>
    
                    <!-- 执行流程可视化 -->
                    <div class="execution-flow">
                        <el-timeline>
                            <el-timeline-item v-for="node in executionNodes" :key="node.id"
                                :timestamp="node.startTime || ''" :color="node.status === 'completed' ? '#67C23A' : 
                            node.status === 'running' ? '#409EFF' : 
                            node.status === 'error' ? '#F56C6C' : '#909399'" :hollow="node.status === 'pending'"
                                :size="node.status === 'running' ? 'large' : 'normal'">
                                <el-card :class="['node-card', { 
                        'node-running': node.status === 'running',
                        'node-completed': node.status === 'completed',
                        'node-error': node.status === 'error'
                      }]">
                                    <div class="node-header">
                                        <div class="node-info">
                                            <span class="node-name">{{ node.name }}</span>
                                            <el-tag :type="node.status === 'completed' ? 'success' : 
                                   node.status === 'running' ? 'primary' : 
                                   node.status === 'error' ? 'danger' : 'info'" size="small">
                                                {{ node.status === 'completed' ? '已完成' :
                                                node.status === 'running' ? '执行中' :
                                                node.status === 'error' ? '错误' : '待执行' }}
                                            </el-tag>
                                        </div>
                                        <div v-if="node.duration" class="node-duration">
                                            耗时: {{ node.duration }}ms
                                        </div>
                                    </div>
    
                                    <!-- 节点日志 -->
                                    <el-collapse v-if="node.logs.length > 0" style="margin-top: 10px">
                                        <el-collapse-item title="查看执行日志" name="1">
                                            <div class="node-logs">
                                                <div v-for="(log, logIndex) in node.logs" :key="logIndex" class="log-item">
                                                    {{ log }}
                                                </div>
                                            </div>
                                        </el-collapse-item>
                                    </el-collapse>
                                </el-card>
                            </el-timeline-item>
                        </el-timeline>
                    </div>
                </el-card>
            </el-col>
    
            <!-- 右侧：变量监视和结果展示 -->
            <el-col :span="6">
                <!-- 变量监视面板 -->
                <el-card class="variable-watch" shadow="hover" style="margin-bottom: 20px">
                    <template #header>
                        <div class="card-header">
                            <span>变量监视</span>
                        </div>
                    </template>
    
                    <div class="variables-list">
                        <div v-for="variable in watchedVariables" :key="variable.name"
                            :class="['variable-item', { 'variable-changed': variable.changed }]">
                            <div class="variable-header">
                                <span class="variable-name">{{ variable.name }}</span>
                                <el-tag size="small" type="info">{{ variable.type }}</el-tag>
                            </div>
                            <div class="variable-value">
                                <code>{{ typeof variable.value === 'object' ? JSON.stringify(variable.value, null, 2) :
                                    variable.value }}</code>
                            </div>
                            <el-button size="small" text @click="copyVariableValue(variable)" style="margin-top: 5px">
                                复制值
                            </el-button>
                        </div>
    
                        <el-empty v-if="watchedVariables.length === 0" description="暂无监视变量" :image-size="80" />
                    </div>
                </el-card>
    
                <!-- 调试结果展示 -->
                <el-card class="debug-result" shadow="hover">
                    <template #header>
                        <div class="card-header">
                            <span>调试结果</span>
                            <el-button size="small" @click="exportResult" :disabled="!debugResult">
                                导出结果
                            </el-button>
                        </div>
                    </template>
    
                    <el-tabs type="border-card">
                        <el-tab-pane label="执行日志">
                            <div class="output-content">
                                <pre>{{ debugOutput || '暂无日志输出' }}</pre>
                            </div>
                        </el-tab-pane>
    
                        <el-tab-pane label="执行结果">
                            <div class="output-content">
                                <div v-if="debugResult" class="result-success">
                                    <pre>{{ JSON.stringify(debugResult, null, 2) }}</pre>
                                </div>
                                <el-empty v-else description="暂无执行结果" :image-size="80" />
                            </div>
                        </el-tab-pane>
    
                        <el-tab-pane label="错误信息">
                            <div class="output-content">
                                <div v-if="debugError" class="result-error">
                                    <pre>{{ debugError }}</pre>
                                </div>
                                <el-empty v-else description="无错误信息" :image-size="80" />
                            </div>
                        </el-tab-pane>
                    </el-tabs>
                </el-card>
            </el-col>
        </el-row>
    
        <!-- 调试历史记录 -->
        <el-card class="debug-history" shadow="hover" style="margin-top: 20px">
            <template #header>
                <div class="card-header">
                    <span>调试历史记录</span>
                    <el-button size="small" type="danger" @click="clearHistory" :disabled="debugHistory.length === 0">
                        清空历史
                    </el-button>
                </div>
            </template>
    
            <el-table :data="debugHistory" style="width: 100%" max-height="300">
                <el-table-column prop="timestamp" label="时间" width="180" />
                <el-table-column label="状态" width="120">
                    <template #default="scope">
                        <el-tag :type="scope.row.status === DebugStatus.COMPLETED ? 'success' : 
                         scope.row.status === DebugStatus.ERROR ? 'danger' : 'info'">
                            {{ scope.row.status === DebugStatus.COMPLETED ? '成功' :
                            scope.row.status === DebugStatus.ERROR ? '失败' : '已停止' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="duration" label="执行时长" width="120">
                    <template #default="scope">
                        {{ scope.row.duration }}ms
                    </template>
                </el-table-column>
                <el-table-column label="输入数据" min-width="300">
                    <template #default="scope">
                        <code style="font-size: 12px">{{ JSON.stringify(scope.row.inputData) }}</code>
                    </template>
                </el-table-column>
                <el-table-column label="错误信息" min-width="200">
                    <template #default="scope">
                        <span v-if="scope.row.error" style="color: #F56C6C">{{ scope.row.error }}</span>
                        <span v-else style="color: #909399">-</span>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="100" fixed="right">
                    <template #default="scope">
                        <el-button size="small" type="primary" link @click="replayHistory(scope.row)">
                            重放
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
    
            <el-empty v-if="debugHistory.length === 0" description="暂无调试历史" />
        </el-card>
    </div>
</template>

<style scoped lang="scss">
.online-debug-tool {
    min-height: calc(100vh - 120px);

    .page-header {
        background: white;
        padding: 24px;
        border-radius: 8px;
        margin-bottom: 20px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

        h2 {
            margin: 0 0 8px 0;
            color: #303133;
            font-size: 24px;
        }

        p {
            margin: 0;
            color: #909399;
            font-size: 14px;
        }
    }

    .debug-container {
        margin: 0;
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 600;
    }

    // 控制面板样式
    .control-panel {
        .status-section {
            margin-bottom: 20px;

            .execution-time {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin: 15px 0;
                font-size: 14px;
                color: #606266;
            }
        }

        .control-buttons {
            display: flex;
            flex-direction: column;
            gap: 10px;

            .el-button {
                margin: 0;
            }
        }

        .speed-control {
            .control-label {
                margin-bottom: 10px;
                font-size: 14px;
                color: #606266;
                font-weight: 500;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
        }

        .input-config {
            .input-editor {
                margin: 10px 0;
                font-family: 'Courier New', monospace;
            }

            .input-actions {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;

                .el-button {
                    margin: 0;
                }
            }
        }
    }

    // 执行监控样式
    .execution-monitor {
        min-height: 800px;

        .execution-flow {
            .node-card {
                margin-top: 8px;
                transition: all 0.3s;

                &.node-running {
                    border-color: #409EFF;
                    box-shadow: 0 0 8px rgba(64, 158, 255, 0.3);
                    animation: pulse 1.5s infinite;
                }

                &.node-completed {
                    border-color: #67C23A;
                }

                &.node-error {
                    border-color: #F56C6C;
                }

                .node-header {
                    .node-info {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 5px;

                        .node-name {
                            font-weight: 600;
                            color: #303133;
                        }
                    }

                    .node-duration {
                        font-size: 12px;
                        color: #909399;
                        margin-top: 5px;
                    }
                }

                .node-logs {
                    max-height: 200px;
                    overflow-y: auto;
                    background: #f5f7fa;
                    padding: 10px;
                    border-radius: 4px;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;

                    .log-item {
                        padding: 3px 0;
                        color: #606266;
                        line-height: 1.5;
                    }
                }
            }
        }
    }

    // 变量监视样式
    .variable-watch {
        .variables-list {
            max-height: 300px;
            overflow-y: auto;

            .variable-item {
                padding: 12px;
                margin-bottom: 10px;
                border: 1px solid #EBEEF5;
                border-radius: 4px;
                background: #f5f7fa;
                transition: all 0.3s;

                &.variable-changed {
                    background: #FEF0F0;
                    border-color: #F56C6C;
                    animation: highlight 0.5s;
                }

                .variable-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;

                    .variable-name {
                        font-weight: 600;
                        color: #303133;
                        font-family: 'Courier New', monospace;
                    }
                }

                .variable-value {
                    background: white;
                    padding: 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    word-break: break-all;
                    max-height: 150px;
                    overflow-y: auto;

                    code {
                        color: #E6A23C;
                        white-space: pre-wrap;
                    }
                }
            }
        }
    }

    // 调试结果样式
    .debug-result {
        .output-content {
            max-height: 400px;
            overflow-y: auto;

            pre {
                background: #f5f7fa;
                padding: 12px;
                border-radius: 4px;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                line-height: 1.5;
                margin: 0;
                white-space: pre-wrap;
                word-break: break-all;
            }

            .result-success pre {
                background: #F0F9FF;
                color: #409EFF;
            }

            .result-error pre {
                background: #FEF0F0;
                color: #F56C6C;
            }
        }
    }

    // 历史记录样式
    .debug-history {
        :deep(.el-table) {
            .el-table__empty-block {
                display: none;
            }
        }
    }

    // 动画
    @keyframes pulse {

        0%,
        100% {
            box-shadow: 0 0 8px rgba(64, 158, 255, 0.3);
        }

        50% {
            box-shadow: 0 0 16px rgba(64, 158, 255, 0.6);
        }
    }

    @keyframes highlight {
        0% {
            background: #FEF0F0;
        }

        50% {
            background: #FDE2E2;
        }

        100% {
            background: #FEF0F0;
        }
    }
}
</style>