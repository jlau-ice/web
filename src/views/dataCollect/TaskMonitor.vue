<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

interface TaskMonitor {
  id: number
  taskName: string
  taskType: string
  scheduleTime: string
  status: 'running' | 'success' | 'failed' | 'warning' | 'pending'
  duration: number
  retryCount: number
  latestLog: string
  executeNode: string
  scheduleCycle: string
}

interface TaskDetail {
  id: number
  taskName: string
  scheduleCycle: string
  executeNode: string
  logs: LogEntry[]
  retryRecords: RetryRecord[]
  alertRecords: AlertRecord[]
}

interface LogEntry {
  time: string
  level: 'info' | 'warning' | 'error'
  content: string
}

interface RetryRecord {
  time: string
  reason: string
  status: 'success' | 'failed'
}

interface AlertRecord {
  time: string
  channel: 'email' | 'dingtalk'
  status: 'sent' | 'failed'
}

interface Alert {
  id: number
  taskName: string
  alertTime: string
  channel: string
  content: string
  status: 'pending' | 'sent' | 'failed'
}

interface AlertConfig {
  enabled: boolean
  failureThreshold: number
  retryInterval: number
  channels: string[]
  emails: string
  dingtalk: string
}

// 时间范围
const timeRange = ref('1h')
const timeRangeOptions = [
  { label: '最近1小时', value: '1h' },
  { label: '今天', value: 'today' },
  { label: '最近7天', value: '7d' }
]

// 统计数据
const stats = reactive({
  total: 0,
  running: 0,
  success: 0,
  failed: 0,
  warning: 0,
  pending: 0
})

// 任务列表
const taskList = ref<TaskMonitor[]>([])
const filteredTaskList = computed(() => {
  let list = taskList.value
  if (searchText.value) {
    list = list.filter(task => task.taskName.includes(searchText.value))
  }
  if (statusFilter.value) {
    list = list.filter(task => task.status === statusFilter.value)
  }
  const start = (currentPage.value - 1) * pageSize.value
  return list.slice(start, start + pageSize.value)
})

// 搜索与筛选
const searchText = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = computed(() => {
  let list = taskList.value
  if (searchText.value) {
    list = list.filter(task => task.taskName.includes(searchText.value))
  }
  if (statusFilter.value) {
    list = list.filter(task => task.status === statusFilter.value)
  }
  return list.length
})

// 任务详情弹窗
const detailDialogVisible = ref(false)
const currentTaskDetail = ref<TaskDetail | null>(null)
const isRetrying = ref(false)

// 告警管理
const activeTab = ref('monitor')
const alertList = ref<Alert[]>([])
const alertConfig = reactive<AlertConfig>({
  enabled: true,
  failureThreshold: 3,
  retryInterval: 5,
  channels: ['email', 'dingtalk'],
  emails: 'admin@example.com, dev@example.com',
  dingtalk: 'https://oapi.dingtalk.com/robot/send?access_token=xxx'
})

// 自动刷新
let autoRefreshTimer: number | null = null

// Mock 数据初始化
const initMockData = () => {
  const taskTypes = ['数据采集', '数据清洗', '数据转换', '数据同步', '报表生成']
  const statuses: Array<'running' | 'success' | 'failed' | 'warning' | 'pending'> = ['running', 'success', 'failed', 'warning', 'pending']
  const nodes = ['Node-01', 'Node-02', 'Node-03', 'Node-04']
  const cycles = ['0 */5 * * * ?', '0 0 */1 * * ?', '0 0 0 * * ?', '0 30 2 * * ?']

  const tasks: TaskMonitor[] = []
  for (let i = 1; i <= 25; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    tasks.push({
      id: i,
      taskName: `任务_${i}_${taskTypes[i % taskTypes.length]}`,
      taskType: taskTypes[i % taskTypes.length],
      scheduleTime: `2025-10-28 ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
      status,
      duration: Math.floor(Math.random() * 300) + 10,
      retryCount: status === 'failed' || status === 'warning' ? Math.floor(Math.random() * 3) : 0,
      latestLog: status === 'failed' ? '连接超时' : status === 'warning' ? '部分数据处理失败' : '执行成功',
      executeNode: nodes[i % nodes.length],
      scheduleCycle: cycles[i % cycles.length]
    })
  }
  taskList.value = tasks
  updateStats()

  // Mock 告警数据
  const alerts: Alert[] = []
  for (let i = 1; i <= 10; i++) {
    const channels = ['邮件', '钉钉', '企业微信']
    const alertStatuses: Array<'pending' | 'sent' | 'failed'> = ['sent', 'sent', 'sent', 'failed']
    alerts.push({
      id: i,
      taskName: tasks[Math.floor(Math.random() * tasks.length)].taskName,
      alertTime: `2025-10-${String(20 + Math.floor(i / 2)).padStart(2, '0')} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
      channel: channels[i % channels.length],
      content: `任务执行失败，已重试${Math.floor(Math.random() * 3) + 1}次`,
      status: alertStatuses[i % alertStatuses.length]
    })
  }
  alertList.value = alerts
}

// 更新统计数据
const updateStats = () => {
  stats.total = taskList.value.length
  stats.running = taskList.value.filter(t => t.status === 'running').length
  stats.success = taskList.value.filter(t => t.status === 'success').length
  stats.failed = taskList.value.filter(t => t.status === 'failed').length
  stats.warning = taskList.value.filter(t => t.status === 'warning').length
  stats.pending = taskList.value.filter(t => t.status === 'pending').length
}

// 刷新任务状态
const handleRefresh = () => {
  ElMessage.success('正在刷新...')
  setTimeout(() => {
    autoRefreshStatus()
    ElMessage.success('刷新成功')
  }, 500)
}

// 自动刷新状态模拟
const autoRefreshStatus = () => {
  const statuses: Array<'running' | 'success' | 'failed' | 'warning' | 'pending'> = ['running', 'success', 'failed', 'warning', 'pending']
  taskList.value.forEach(task => {
    if (Math.random() > 0.85) {
      const oldStatus = task.status
      task.status = statuses[Math.floor(Math.random() * statuses.length)]

      // 如果任务失败，模拟触发告警
      if (task.status === 'failed' && oldStatus !== 'failed') {
        task.retryCount++
        if (task.retryCount >= alertConfig.failureThreshold && alertConfig.enabled) {
          // 添加新告警
          alertList.value.unshift({
            id: Date.now(),
            taskName: task.taskName,
            alertTime: new Date().toLocaleString('zh-CN'),
            channel: alertConfig.channels.includes('email') ? '邮件' : '钉钉',
            content: `任务执行失败，已重试${task.retryCount}次`,
            status: 'sent'
          })
        }
      }

      // 如果任务成功，重置重试次数
      if (task.status === 'success') {
        task.retryCount = 0
      }
    }

    // 更新任务耗时
    if (task.status === 'running') {
      task.duration = Math.floor(Math.random() * 300) + 10
    }
  })
  updateStats()
}

// 时间范围切换
const handleTimeRangeChange = (value: string) => {
  timeRange.value = value
  ElMessage.success(`已切换到${timeRangeOptions.find(opt => opt.value === value)?.label}`)
}

// 查看详情
const handleViewDetail = (row: TaskMonitor) => {
  // Mock 任务详情数据
  const logs: LogEntry[] = []
  const logLevels: Array<'info' | 'warning' | 'error'> = ['info', 'info', 'info', 'warning', 'error']
  const logContents = [
    '任务开始执行',
    '正在连接数据源...',
    '数据源连接成功',
    '开始提取数据...',
    '数据提取完成，共 10,000 条',
    '开始数据转换...',
    '数据转换完成',
    '开始写入目标库...',
    '写入完成',
    '任务执行成功'
  ]

  if (row.status === 'failed') {
    logContents.push('错误：连接超时', '任务执行失败')
  } else if (row.status === 'warning') {
    logContents.push('警告：部分数据处理失败', '任务执行完成（有警告）')
  }

  for (let i = 0; i < logContents.length; i++) {
    const baseTime = new Date()
    baseTime.setSeconds(baseTime.getSeconds() - (logContents.length - i) * 5)
    logs.push({
      time: baseTime.toLocaleString('zh-CN'),
      level: row.status === 'failed' && i >= logContents.length - 2 ? 'error' :
             row.status === 'warning' && i >= logContents.length - 2 ? 'warning' : 'info',
      content: logContents[i]
    })
  }

  const retryRecords: RetryRecord[] = []
  for (let i = 0; i < row.retryCount; i++) {
    const retryTime = new Date()
    retryTime.setMinutes(retryTime.getMinutes() - (row.retryCount - i) * alertConfig.retryInterval)
    retryRecords.push({
      time: retryTime.toLocaleString('zh-CN'),
      reason: i === row.retryCount - 1 ? '连接超时' : '数据源不可用',
      status: i === row.retryCount - 1 ? 'failed' : 'failed'
    })
  }

  const alertRecords: AlertRecord[] = []
  if (row.retryCount >= alertConfig.failureThreshold && alertConfig.enabled) {
    alertConfig.channels.forEach(channel => {
      alertRecords.push({
        time: new Date().toLocaleString('zh-CN'),
        channel: channel as 'email' | 'dingtalk',
        status: Math.random() > 0.1 ? 'sent' : 'failed'
      })
    })
  }

  currentTaskDetail.value = {
    id: row.id,
    taskName: row.taskName,
    scheduleCycle: row.scheduleCycle,
    executeNode: row.executeNode,
    logs,
    retryRecords,
    alertRecords
  }
  detailDialogVisible.value = true
}

// 手动重试
const handleManualRetry = () => {
  ElMessageBox.confirm('确定要手动重试该任务吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    isRetrying.value = true
    ElMessage.info('正在重试...')

    setTimeout(() => {
      isRetrying.value = false
      ElMessage.success('重试成功，任务已重新执行')

      // 更新任务状态
      if (currentTaskDetail.value) {
        const task = taskList.value.find(t => t.id === currentTaskDetail.value!.id)
        if (task) {
          task.status = Math.random() > 0.3 ? 'success' : 'failed'
          task.retryCount = task.status === 'failed' ? task.retryCount + 1 : 0
          updateStats()
        }
      }

      detailDialogVisible.value = false
    }, 2000)
  })
}

// 保存告警配置
const handleSaveAlertConfig = () => {
  setTimeout(() => {
    ElMessage.success('配置已更新')
  }, 300)
}

// 获取状态标签类型
const getStatusType = (status: string) => {
  const map: Record<string, 'success' | 'danger' | 'warning' | 'info' | ''> = {
    running: 'info',
    success: 'success',
    failed: 'danger',
    warning: 'warning',
    pending: ''
  }
  return map[status] || 'info'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    running: '运行中',
    success: '成功',
    failed: '失败',
    warning: '告警中',
    pending: '待执行'
  }
  return map[status] || status
}

// 获取日志级别标签类型
const getLogLevelType = (level: string) => {
  const map: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
    info: 'info',
    warning: 'warning',
    error: 'danger'
  }
  return map[level] || 'info'
}

// 获取告警状态标签类型
const getAlertStatusType = (status: string) => {
  const map: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
    sent: 'success',
    failed: 'danger',
    pending: 'info'
  }
  return map[status] || 'info'
}

// 获取告警状态文本
const getAlertStatusText = (status: string) => {
  const map: Record<string, string> = {
    sent: '已发送',
    failed: '发送失败',
    pending: '待发送'
  }
  return map[status] || status
}

onMounted(() => {
  initMockData()
  // 每 3 秒自动刷新状态
  autoRefreshTimer = window.setInterval(autoRefreshStatus, 3000)
})

onUnmounted(() => {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
  }
})
</script>

<template>
  <div class="task-monitor-container">
    <el-tabs v-model="activeTab" class="main-tabs">
      <!-- 任务监控 Tab -->
      <el-tab-pane label="任务监控" name="monitor">
        <div class="monitor-section">
          <!-- 顶部操作栏 -->
          <div class="monitor-header">
            <div class="time-range-selector">
              <span class="label">时间范围：</span>
              <el-radio-group v-model="timeRange" @change="handleTimeRangeChange">
                <el-radio-button
                  v-for="option in timeRangeOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </el-radio-button>
              </el-radio-group>
            </div>
            <el-button type="primary" @click="handleRefresh">
              <span>刷新</span>
            </el-button>
          </div>

          <!-- 统计卡片 -->
          <div class="stats-cards">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-title">任务总数</div>
                <div class="stat-value total">{{ stats.total }}</div>
              </div>
            </el-card>
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-title">运行中</div>
                <div class="stat-value running">{{ stats.running }}</div>
              </div>
            </el-card>
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-title">成功</div>
                <div class="stat-value success">{{ stats.success }}</div>
              </div>
            </el-card>
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-title">失败</div>
                <div class="stat-value failed">{{ stats.failed }}</div>
              </div>
            </el-card>
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-title">告警中</div>
                <div class="stat-value warning">{{ stats.warning }}</div>
              </div>
            </el-card>
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-title">待执行</div>
                <div class="stat-value pending">{{ stats.pending }}</div>
              </div>
            </el-card>
          </div>

          <!-- 搜索栏 -->
          <div class="search-bar">
            <el-input
              v-model="searchText"
              placeholder="请输入任务名称"
              style="width: 250px; margin-right: 10px"
              clearable
            />
            <el-select
              v-model="statusFilter"
              placeholder="任务状态"
              clearable
              style="width: 150px; margin-right: 10px"
            >
              <el-option label="全部" value="" />
              <el-option label="运行中" value="running" />
              <el-option label="成功" value="success" />
              <el-option label="失败" value="failed" />
              <el-option label="告警中" value="warning" />
              <el-option label="待执行" value="pending" />
            </el-select>
          </div>

          <!-- 任务列表 -->
          <el-table :data="filteredTaskList" border stripe style="width: 100%; margin-top: 20px">
            <el-table-column prop="taskName" label="任务名称" width="200" />
            <el-table-column prop="taskType" label="任务类型" width="120" />
            <el-table-column prop="scheduleTime" label="调度时间" width="180" />
            <el-table-column label="运行状态" width="120">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="duration" label="执行耗时(秒)" width="130" />
            <el-table-column prop="retryCount" label="重试次数" width="100" />
            <el-table-column prop="latestLog" label="最新日志" min-width="150" show-overflow-tooltip />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="handleViewDetail(row)">
                  查看详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="total"
            layout="total, prev, pager, next, jumper"
            style="margin-top: 20px; text-align: right"
          />
        </div>
      </el-tab-pane>

      <!-- 告警管理 Tab -->
      <el-tab-pane label="告警管理" name="alert">
        <div class="alert-section">
          <el-tabs>
            <!-- 告警列表 -->
            <el-tab-pane label="告警列表" name="alertList">
              <el-table :data="alertList" border stripe style="width: 100%">
                <el-table-column prop="taskName" label="任务名称" width="200" />
                <el-table-column prop="alertTime" label="告警时间" width="180" />
                <el-table-column prop="channel" label="告警渠道" width="120" />
                <el-table-column prop="content" label="告警内容" min-width="200" />
                <el-table-column label="状态" width="120">
                  <template #default="{ row }">
                    <el-tag :type="getAlertStatusType(row.status)">
                      {{ getAlertStatusText(row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>

            <!-- 告警配置 -->
            <el-tab-pane label="告警配置" name="alertConfig">
              <el-form :model="alertConfig" label-width="120px" style="max-width: 800px">
                <el-form-item label="启用告警">
                  <el-switch v-model="alertConfig.enabled" />
                </el-form-item>
                <el-form-item label="失败次数阈值">
                  <el-input-number
                    v-model="alertConfig.failureThreshold"
                    :min="1"
                    :max="10"
                    :disabled="!alertConfig.enabled"
                  />
                  <span style="margin-left: 10px; color: #999">连续失败次数达到此值时触发告警</span>
                </el-form-item>
                <el-form-item label="重试间隔">
                  <el-input-number
                    v-model="alertConfig.retryInterval"
                    :min="1"
                    :max="60"
                    :disabled="!alertConfig.enabled"
                  />
                  <span style="margin-left: 10px; color: #999">分钟</span>
                </el-form-item>
                <el-form-item label="告警渠道">
                  <el-checkbox-group v-model="alertConfig.channels" :disabled="!alertConfig.enabled">
                    <el-checkbox value="email">邮件</el-checkbox>
                    <el-checkbox value="dingtalk">钉钉</el-checkbox>
                    <el-checkbox value="wechat">企业微信</el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
                <el-form-item label="通知人邮箱">
                  <el-input
                    v-model="alertConfig.emails"
                    type="textarea"
                    :rows="3"
                    placeholder="多个邮箱用逗号分隔"
                    :disabled="!alertConfig.enabled || !alertConfig.channels.includes('email')"
                  />
                </el-form-item>
                <el-form-item label="钉钉 Webhook">
                  <el-input
                    v-model="alertConfig.dingtalk"
                    placeholder="请输入钉钉机器人 Webhook 地址"
                    :disabled="!alertConfig.enabled || !alertConfig.channels.includes('dingtalk')"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="handleSaveAlertConfig">保存配置</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 任务详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="任务详情"
      width="900px"
      :close-on-click-modal="false"
    >
      <div v-if="currentTaskDetail" class="task-detail">
        <el-tabs>
          <!-- 基本信息 -->
          <el-tab-pane label="基本信息" name="basicInfo">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="任务ID">{{ currentTaskDetail.id }}</el-descriptions-item>
              <el-descriptions-item label="任务名称">{{ currentTaskDetail.taskName }}</el-descriptions-item>
              <el-descriptions-item label="调度周期">{{ currentTaskDetail.scheduleCycle }}</el-descriptions-item>
              <el-descriptions-item label="执行节点">{{ currentTaskDetail.executeNode }}</el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>

          <!-- 运行日志 -->
          <el-tab-pane label="运行日志" name="logs">
            <el-scrollbar height="400px">
              <div class="log-list">
                <div v-for="(log, index) in currentTaskDetail.logs" :key="index" class="log-item">
                  <el-tag :type="getLogLevelType(log.level)" size="small" style="margin-right: 10px">
                    {{ log.level.toUpperCase() }}
                  </el-tag>
                  <span class="log-time">{{ log.time }}</span>
                  <span class="log-content">{{ log.content }}</span>
                </div>
              </div>
            </el-scrollbar>
          </el-tab-pane>

          <!-- 重试记录 -->
          <el-tab-pane label="重试记录" name="retry">
            <el-table :data="currentTaskDetail.retryRecords" border stripe>
              <el-table-column prop="time" label="重试时间" width="180" />
              <el-table-column prop="reason" label="失败原因" />
              <el-table-column label="状态" width="120">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'success' ? 'success' : 'danger'">
                    {{ row.status === 'success' ? '成功' : '失败' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="currentTaskDetail.retryRecords.length === 0" description="暂无重试记录" />
          </el-tab-pane>

          <!-- 告警推送记录 -->
          <el-tab-pane label="告警推送记录" name="alert">
            <el-table :data="currentTaskDetail.alertRecords" border stripe>
              <el-table-column prop="time" label="推送时间" width="180" />
              <el-table-column label="推送渠道" width="120">
                <template #default="{ row }">
                  {{ row.channel === 'email' ? '邮件' : '钉钉' }}
                </template>
              </el-table-column>
              <el-table-column label="推送状态" width="120">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'sent' ? 'success' : 'danger'">
                    {{ row.status === 'sent' ? '已发送' : '发送失败' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="currentTaskDetail.alertRecords.length === 0" description="暂无告警推送记录" />
          </el-tab-pane>
        </el-tabs>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" :loading="isRetrying" @click="handleManualRetry">
          手动重试
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.task-monitor-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 100px);

  .main-tabs {
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }

  .monitor-section {
    .monitor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      .time-range-selector {
        display: flex;
        align-items: center;

        .label {
          margin-right: 10px;
          font-weight: 500;
          color: #606266;
        }
      }
    }

    .stats-cards {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 15px;
      margin-bottom: 20px;

      .stat-card {
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }

        .stat-content {
          text-align: center;

          .stat-title {
            font-size: 14px;
            color: #909399;
            margin-bottom: 10px;
          }

          .stat-value {
            font-size: 28px;
            font-weight: bold;

            &.total {
              color: #303133;
            }

            &.running {
              color: #409eff;
            }

            &.success {
              color: #67c23a;
            }

            &.failed {
              color: #f56c6c;
            }

            &.warning {
              color: #e6a23c;
            }

            &.pending {
              color: #909399;
            }
          }
        }
      }
    }

    .search-bar {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
    }
  }

  .alert-section {
    .el-form {
      margin-top: 20px;
    }
  }

  .task-detail {
    .log-list {
      padding: 10px;

      .log-item {
        display: flex;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;

        &:last-child {
          border-bottom: none;
        }

        .log-time {
          color: #909399;
          font-size: 12px;
          margin-right: 15px;
          min-width: 150px;
        }

        .log-content {
          flex: 1;
          color: #606266;
          font-size: 13px;
        }
      }
    }
  }
}

@media (max-width: 1400px) {
  .stats-cards {
    grid-template-columns: repeat(3, 1fr) !important;
  }
}

@media (max-width: 768px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}
</style>
