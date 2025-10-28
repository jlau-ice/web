<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Refresh, 
  VideoPlay, 
  RefreshRight, 
  View, 
  Delete,
  Clock,
  Select,
  CircleClose,
  Document,
  TrendCharts,
  Timer,
  Search
} from '@element-plus/icons-vue'

// 任务状态枚举
enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// 任务执行记录接口
interface TaskExecution {
  id: string
  taskName: string
  taskId: string
  executeNode: string
  startTime: string
  endTime?: string
  status: TaskStatus
  progress: number
  duration: number // 持续时间（秒）
  errorMsg?: string
}

// 状态配置
const statusConfig = {
  [TaskStatus.PENDING]: {
    label: '等待中',
    color: '#909399',
    type: 'info'
  },
  [TaskStatus.RUNNING]: {
    label: '运行中',
    color: '#409EFF',
    type: 'primary'
  },
  [TaskStatus.COMPLETED]: {
    label: '已完成',
    color: '#67C23A',
    type: 'success'
  },
  [TaskStatus.FAILED]: {
    label: '失败',
    color: '#F56C6C',
    type: 'danger'
  }
}

// 搜索表单
const searchForm = reactive({
  taskName: '',
  status: ''
})

// 表格数据
const tableData = ref<TaskExecution[]>([])
const tableLoading = ref(false)
const selectedStatus = ref<string>('')

// 自动刷新配置
const autoRefresh = ref(false)
const refreshInterval = ref(10) // 默认10秒
const lastUpdateTime = ref('')
let refreshTimer: ReturnType<typeof setInterval> | null = null

// 统计数据
const statistics = computed(() => {
  const total = tableData.value.length
  const pending = tableData.value.filter(t => t.status === TaskStatus.PENDING).length
  const running = tableData.value.filter(t => t.status === TaskStatus.RUNNING).length
  const completed = tableData.value.filter(t => t.status === TaskStatus.COMPLETED).length
  const failed = tableData.value.filter(t => t.status === TaskStatus.FAILED).length
  
  // 计算今日数据
  const today = new Date().toDateString()
  const todayTasks = tableData.value.filter(t => 
    new Date(t.startTime).toDateString() === today
  )
  const todayTotal = todayTasks.length
  const todayCompleted = todayTasks.filter(t => t.status === TaskStatus.COMPLETED).length
  const todayFailed = todayTasks.filter(t => t.status === TaskStatus.FAILED).length
  const successRate = todayTotal > 0 ? ((todayCompleted / todayTotal) * 100).toFixed(1) : '0.0'
  
  // 计算平均耗时
  const completedTasks = todayTasks.filter(t => t.status === TaskStatus.COMPLETED)
  const avgDuration = completedTasks.length > 0
    ? (completedTasks.reduce((sum, t) => sum + t.duration, 0) / completedTasks.length).toFixed(1)
    : '0.0'

  return {
    total,
    pending,
    running,
    completed,
    failed,
    todayTotal,
    successRate,
    avgDuration
  }
})

// 筛选后的表格数据
const filteredTableData = computed(() => {
  let data = tableData.value
  
  // 按选中的状态筛选
  if (selectedStatus.value) {
    data = data.filter(t => t.status === selectedStatus.value)
  }
  
  // 按搜索条件筛选
  if (searchForm.taskName) {
    data = data.filter(t => 
      t.taskName.toLowerCase().includes(searchForm.taskName.toLowerCase()) ||
      t.taskId.toLowerCase().includes(searchForm.taskName.toLowerCase())
    )
  }
  
  if (searchForm.status) {
    data = data.filter(t => t.status === searchForm.status)
  }
  
  return data
})

// Mock 数据生成
const generateMockData = (): TaskExecution[] => {
  const taskNames = [
    '数据同步任务',
    '报表生成任务',
    '数据清洗任务',
    '模型训练任务',
    '数据备份任务',
    '日志归档任务',
    'ETL数据处理',
    '机器学习推理',
    '实时数据分析',
    '定时批处理任务'
  ]
  
  const nodes = ['Node-01', 'Node-02', 'Node-03', 'Node-04', 'Node-05']
  const statuses = [TaskStatus.PENDING, TaskStatus.RUNNING, TaskStatus.COMPLETED, TaskStatus.FAILED]
  
  const data: TaskExecution[] = []
  
  for (let i = 1; i <= 20; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const startTime = new Date(Date.now() - Math.random() * 86400000 * 2) // 最近2天
    const duration = Math.floor(Math.random() * 3600) // 0-3600秒
    
    let progress = 0
    if (status === TaskStatus.PENDING) {
      progress = 0
    } else if (status === TaskStatus.RUNNING) {
      progress = Math.floor(Math.random() * 90) + 5 // 5-95%
    } else {
      progress = 100
    }
    
    const task: TaskExecution = {
      id: `exec-${1000 + i}`,
      taskName: taskNames[Math.floor(Math.random() * taskNames.length)],
      taskId: `task-${100 + i}`,
      executeNode: nodes[Math.floor(Math.random() * nodes.length)],
      startTime: startTime.toISOString(),
      status,
      progress,
      duration,
      errorMsg: status === TaskStatus.FAILED ? '执行超时，任务被强制终止' : undefined
    }
    
    if (status === TaskStatus.COMPLETED || status === TaskStatus.FAILED) {
      task.endTime = new Date(startTime.getTime() + duration * 1000).toISOString()
    }
    
    data.push(task)
  }
  
  // 按开始时间降序排序
  return data.sort((a, b) => 
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  )
}

// 模拟更新运行中任务的进度
const updateRunningTasks = () => {
  tableData.value.forEach(task => {
    if (task.status === TaskStatus.RUNNING) {
      // 随机增加进度
      task.progress = Math.min(task.progress + Math.floor(Math.random() * 10), 95)
      task.duration += refreshInterval.value
      
      // 有小概率任务完成或失败
      const random = Math.random()
      if (random < 0.05) { // 5% 概率完成
        task.status = TaskStatus.COMPLETED
        task.progress = 100
        task.endTime = new Date().toISOString()
        ElMessage.success(`任务 ${task.taskName} 执行完成`)
      } else if (random < 0.08) { // 3% 概率失败
        task.status = TaskStatus.FAILED
        task.progress = 100
        task.endTime = new Date().toISOString()
        task.errorMsg = '执行过程中出现异常错误'
        ElMessage.error(`任务 ${task.taskName} 执行失败`)
      }
    } else if (task.status === TaskStatus.PENDING) {
      // 有小概率等待任务开始运行
      if (Math.random() < 0.1) { // 10% 概率开始运行
        task.status = TaskStatus.RUNNING
        task.progress = 5
        task.startTime = new Date().toISOString()
        ElMessage.info(`任务 ${task.taskName} 开始执行`)
      }
    }
  })
}

// 加载数据
const loadData = async () => {
  tableLoading.value = true
  try {
    // 模拟异步加载
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (tableData.value.length === 0) {
      // 首次加载生成 mock 数据
      tableData.value = generateMockData()
    } else {
      // 更新运行中的任务
      updateRunningTasks()
    }
    
    lastUpdateTime.value = new Date().toLocaleString()
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    tableLoading.value = false
  }
}

// 手动刷新
const handleRefresh = () => {
  ElMessage.info('正在刷新数据...')
  loadData()
}

// 重置搜索
const handleReset = () => {
  searchForm.taskName = ''
  searchForm.status = ''
  selectedStatus.value = ''
}

// 状态卡片点击
const handleStatusClick = (status: string) => {
  if (selectedStatus.value === status) {
    selectedStatus.value = ''
  } else {
    selectedStatus.value = status
  }
}

// 查看任务详情
const handleViewDetail = (row: TaskExecution) => {
  const statusInfo = statusConfig[row.status]
  const details = `
    <div style="text-align: left;">
      <p><strong>任务ID：</strong>${row.taskId}</p>
      <p><strong>任务名称：</strong>${row.taskName}</p>
      <p><strong>执行节点：</strong>${row.executeNode}</p>
      <p><strong>状态：</strong><span style="color: ${statusInfo.color}">${statusInfo.label}</span></p>
      <p><strong>进度：</strong>${row.progress}%</p>
      <p><strong>开始时间：</strong>${new Date(row.startTime).toLocaleString()}</p>
      ${row.endTime ? `<p><strong>结束时间：</strong>${new Date(row.endTime).toLocaleString()}</p>` : ''}
      <p><strong>执行时长：</strong>${formatDuration(row.duration)}</p>
      ${row.errorMsg ? `<p><strong>错误信息：</strong><span style="color: #F56C6C">${row.errorMsg}</span></p>` : ''}
    </div>
  `
  
  ElMessageBox.alert(details, '任务详情', {
    confirmButtonText: '关闭',
    dangerouslyUseHTMLString: true
  })
}

// 停止任务
const handleStopTask = (row: TaskExecution) => {
  ElMessageBox.confirm(
    `确定要停止任务 "${row.taskName}" 吗？`,
    '停止任务',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 模拟停止任务
    row.status = TaskStatus.FAILED
    row.progress = 100
    row.endTime = new Date().toISOString()
    row.errorMsg = '任务被手动停止'
    ElMessage.success('任务已停止')
  }).catch(() => {
    // 取消操作
  })
}

// 重试任务
const handleRetryTask = (row: TaskExecution) => {
  ElMessageBox.confirm(
    `确定要重试任务 "${row.taskName}" 吗？`,
    '重试任务',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    // 模拟重试任务
    row.status = TaskStatus.PENDING
    row.progress = 0
    row.startTime = new Date().toISOString()
    row.endTime = undefined
    row.errorMsg = undefined
    row.duration = 0
    ElMessage.success('任务已加入执行队列')
    
    // 2秒后开始运行
    setTimeout(() => {
      if (row.status === TaskStatus.PENDING) {
        row.status = TaskStatus.RUNNING
        row.progress = 5
      }
    }, 2000)
  }).catch(() => {
    // 取消操作
  })
}

// 查看日志
const handleViewLog = (row: TaskExecution) => {
  ElMessage.info(`正在打开任务 ${row.taskId} 的执行日志...`)
  // 实际项目中这里会打开日志查看页面或对话框
}

// 格式化持续时间
const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}秒`
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}分${secs}秒`
  } else {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}小时${minutes}分`
  }
}

// 格式化时间
const formatTime = (time: string): string => {
  return new Date(time).toLocaleString()
}

// 自动刷新切换
const handleAutoRefreshChange = (value: boolean) => {
  if (value) {
    startAutoRefresh()
    ElMessage.success(`已开启自动刷新，间隔 ${refreshInterval.value} 秒`)
  } else {
    stopAutoRefresh()
    ElMessage.info('已关闭自动刷新')
  }
}

// 刷新间隔变化
const handleRefreshIntervalChange = (value: number) => {
  if (autoRefresh.value) {
    stopAutoRefresh()
    startAutoRefresh()
    ElMessage.success(`刷新间隔已更新为 ${value} 秒`)
  }
}

// 启动自动刷新
const startAutoRefresh = () => {
  stopAutoRefresh() // 先清除已有的定时器
  refreshTimer = setInterval(() => {
    loadData()
  }, refreshInterval.value * 1000)
}

// 停止自动刷新
const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// 生命周期
onMounted(() => {
  loadData()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<template>
  <div class="execution-status-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>执行状态监控</h2>
      <div class="header-actions">
        <span class="last-update">最后更新：{{ lastUpdateTime }}</span>
        <el-button 
          type="primary" 
          :icon="Refresh" 
          @click="handleRefresh"
          :loading="tableLoading"
        >
          刷新
        </el-button>
      </div>
    </div>

    <!-- 统计概览区 -->
    <div class="statistics-section">
      <el-row :gutter="20">
        <!-- 状态分布卡片 -->
        <el-col :xs="12" :sm="6" :md="6" :lg="6">
          <el-card 
            shadow="hover" 
            class="status-card pending-card"
            :class="{ active: selectedStatus === TaskStatus.PENDING }"
            @click="handleStatusClick(TaskStatus.PENDING)"
          >
            <div class="card-content">
              <div class="card-icon pending-icon">
                <el-icon :size="32"><Clock /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-label">等待中</div>
                <div class="card-value">{{ statistics.pending }}</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="12" :sm="6" :md="6" :lg="6">
          <el-card 
            shadow="hover" 
            class="status-card running-card"
            :class="{ active: selectedStatus === TaskStatus.RUNNING }"
            @click="handleStatusClick(TaskStatus.RUNNING)"
          >
            <div class="card-content">
              <div class="card-icon running-icon">
                <el-icon :size="32"><VideoPlay /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-label">运行中</div>
                <div class="card-value">{{ statistics.running }}</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="12" :sm="6" :md="6" :lg="6">
          <el-card 
            shadow="hover" 
            class="status-card completed-card"
            :class="{ active: selectedStatus === TaskStatus.COMPLETED }"
            @click="handleStatusClick(TaskStatus.COMPLETED)"
          >
            <div class="card-content">
              <div class="card-icon completed-icon">
                <el-icon :size="32"><Select /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-label">已完成</div>
                <div class="card-value">{{ statistics.completed }}</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="12" :sm="6" :md="6" :lg="6">
          <el-card 
            shadow="hover" 
            class="status-card failed-card"
            :class="{ active: selectedStatus === TaskStatus.FAILED }"
            @click="handleStatusClick(TaskStatus.FAILED)"
          >
            <div class="card-content">
              <div class="card-icon failed-icon">
                <el-icon :size="32"><CircleClose /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-label">失败</div>
                <div class="card-value">{{ statistics.failed }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 今日统计 -->
      <el-row :gutter="20" class="today-statistics">
        <el-col :xs="24" :sm="8" :md="8" :lg="8">
          <el-statistic title="今日任务总数" :value="statistics.todayTotal">
            <template #prefix>
              <el-icon><Document /></el-icon>
            </template>
          </el-statistic>
        </el-col>
        <el-col :xs="24" :sm="8" :md="8" :lg="8">
          <el-statistic title="今日成功率" :value="statistics.successRate" suffix="%">
            <template #prefix>
              <el-icon><TrendCharts /></el-icon>
            </template>
          </el-statistic>
        </el-col>
        <el-col :xs="24" :sm="8" :md="8" :lg="8">
          <el-statistic title="平均耗时" :value="statistics.avgDuration" suffix="秒">
            <template #prefix>
              <el-icon><Timer /></el-icon>
            </template>
          </el-statistic>
        </el-col>
      </el-row>
    </div>

    <el-divider />

    <!-- 搜索和控制区 -->
    <div class="search-section">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8" :lg="6">
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
        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <el-select
            v-model="searchForm.status"
            placeholder="选择状态"
            clearable
            style="width: 100%"
          >
            <el-option label="等待中" :value="TaskStatus.PENDING" />
            <el-option label="运行中" :value="TaskStatus.RUNNING" />
            <el-option label="已完成" :value="TaskStatus.COMPLETED" />
            <el-option label="失败" :value="TaskStatus.FAILED" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="24" :md="8" :lg="6">
          <el-button @click="handleReset">重置</el-button>
        </el-col>
      </el-row>

      <!-- 自动刷新控制 -->
      <div class="auto-refresh-control">
        <div class="refresh-item">
          <span class="refresh-label">自动刷新：</span>
          <el-switch
            v-model="autoRefresh"
            @change="handleAutoRefreshChange"
          />
        </div>
        <div class="refresh-item">
          <span class="refresh-label">刷新间隔：</span>
          <el-select
            v-model="refreshInterval"
            @change="handleRefreshIntervalChange"
            style="width: 120px"
            :disabled="!autoRefresh"
          >
            <el-option label="5秒" :value="5" />
            <el-option label="10秒" :value="10" />
            <el-option label="30秒" :value="30" />
            <el-option label="60秒" :value="60" />
          </el-select>
        </div>
      </div>
    </div>

    <!-- 任务列表 -->
    <div class="table-section">
      <el-alert
        v-if="selectedStatus"
        :title="`当前筛选：${statusConfig[selectedStatus].label}`"
        type="info"
        closable
        @close="selectedStatus = ''"
        style="margin-bottom: 16px"
      />

      <el-table
        :data="filteredTableData"
        :loading="tableLoading"
        stripe
        style="width: 100%"
        :height="500"
      >
        <el-table-column prop="taskId" label="任务ID" width="120" fixed />
        <el-table-column prop="taskName" label="任务名称" width="180" />
        <el-table-column prop="executeNode" label="执行节点" width="120" />
        <el-table-column prop="startTime" label="开始时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag 
              :type="statusConfig[row.status].type"
              effect="dark"
            >
              {{ statusConfig[row.status].label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="进度" width="200">
          <template #default="{ row }">
            <el-progress 
              :percentage="row.progress"
              :status="row.status === 'failed' ? 'exception' : 
                       row.status === 'completed' ? 'success' : undefined"
              :stroke-width="12"
            />
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="执行时长" width="140">
          <template #default="{ row }">
            {{ formatDuration(row.duration) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
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
              v-if="row.status === TaskStatus.RUNNING"
              type="danger"
              size="small"
              :icon="Delete"
              @click="handleStopTask(row)"
            >
              停止
            </el-button>
            <el-button
              v-if="row.status === TaskStatus.FAILED"
              type="warning"
              size="small"
              :icon="RefreshRight"
              @click="handleRetryTask(row)"
            >
              重试
            </el-button>
            <el-button
              size="small"
              @click="handleViewLog(row)"
            >
              日志
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 底部信息 -->
    <div class="footer-info">
      <span>共 {{ filteredTableData.length }} 条记录</span>
    </div>
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

  .header-actions {
    display: flex;
    align-items: center;
    gap: 16px;

    .last-update {
      color: #909399;
      font-size: 14px;
    }
  }
}

.statistics-section {
  margin-bottom: 24px;

  .status-card {
    cursor: pointer;
    transition: all 0.3s;
    border: 2px solid transparent;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    &.active {
      border-color: #409EFF;
      box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
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

      .pending-icon {
        background: linear-gradient(135deg, #909399 0%, #b3b6bb 100%);
      }

      .running-icon {
        background: linear-gradient(135deg, #409EFF 0%, #66b1ff 100%);
      }

      .completed-icon {
        background: linear-gradient(135deg, #67C23A 0%, #85ce61 100%);
      }

      .failed-icon {
        background: linear-gradient(135deg, #F56C6C 0%, #f78989 100%);
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
  }

  .today-statistics {
    margin-top: 20px;
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    :deep(.el-statistic) {
      text-align: center;

      .el-statistic__head {
        font-size: 14px;
        color: #909399;
      }

      .el-statistic__content {
        font-size: 32px;
        font-weight: 600;
        color: #303133;
      }
    }
  }
}

.search-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  .auto-refresh-control {
    display: flex;
    align-items: center;
    gap: 24px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #EBEEF5;

    .refresh-item {
      display: flex;
      align-items: center;
      gap: 8px;

      .refresh-label {
        font-size: 14px;
        color: #606266;
      }
    }
  }
}

.table-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;

  :deep(.el-table) {
    .el-progress {
      .el-progress__text {
        font-size: 12px;
      }
    }
  }
}

.footer-info {
  text-align: center;
  color: #909399;
  font-size: 14px;
  padding: 12px 0;
}

// 响应式设计
@media screen and (max-width: 768px) {
  .execution-status-container {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;

    h2 {
      font-size: 20px;
    }

    .header-actions {
      width: 100%;
      justify-content: space-between;
    }
  }

  .statistics-section {
    .status-card {
      margin-bottom: 12px;

      .card-content {
        .card-icon {
          width: 48px;
          height: 48px;

          .el-icon {
            font-size: 24px;
          }
        }

        .card-info {
          .card-value {
            font-size: 24px;
          }
        }
      }
    }

    .today-statistics {
      :deep(.el-col) {
        margin-bottom: 16px;
      }
    }
  }

  .search-section {
    .el-row .el-col {
      margin-bottom: 12px;
    }

    .auto-refresh-control {
      flex-direction: column;
      align-items: flex-start;
    }
  }

  .table-section {
    padding: 12px;
    overflow-x: auto;
  }
}
</style>