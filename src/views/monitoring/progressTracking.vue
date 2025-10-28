<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'

// 任务进度状态枚举
enum ProgressStatus {
  RUNNING = 'running',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  WARNING = 'warning',
  ERROR = 'error'
}

// 任务进度接口
interface TaskProgress {
  id: number
  taskName: string
  startTime: string
  elapsedTime: number // 已执行时长（秒）
  progress: number // 进度百分比
  estimatedRemaining: number // 剩余时间预估（秒）
  status: ProgressStatus
  stage: string // 当前阶段
  totalStages: number // 总阶段数
  currentStage: number // 当前阶段编号
  confidence: number // 预测可信度
}

// 进度详情接口
interface ProgressDetail {
  taskId: number
  stages: Array<{
    name: string
    status: 'completed' | 'running' | 'pending'
    startTime?: string
    endTime?: string
    duration?: number
  }>
  timeline: Array<{
    time: string
    event: string
    type: 'info' | 'success' | 'warning' | 'error'
  }>
  logs: Array<{
    time: string
    message: string
    level: 'info' | 'warn' | 'error'
  }>
}

// 进度提醒配置接口
interface ReminderConfig {
  enabled: boolean
  progressThreshold: number
  timeThreshold: number
  notifyEmail: boolean
  notifySystem: boolean
}

// 预测参数配置接口
interface PredictionParams {
  algorithm: 'linear' | 'exponential' | 'ai'
  historicalWeight: number
  smoothingFactor: number
}

// 数据状态
const loading = ref(false)
const autoRefresh = ref(true)
const refreshInterval = ref<number | null>(null)
const searchForm = reactive({
  taskName: '',
  status: ''
})

// 进度数据
const progressList = ref<TaskProgress[]>([])
const selectedTask = ref<TaskProgress | null>(null)
const progressDetail = ref<ProgressDetail | null>(null)

// 进度概览统计
const overviewStats = computed(() => {
  const total = progressList.value.length
  const running = progressList.value.filter(t => t.status === ProgressStatus.RUNNING).length
  const completed = progressList.value.filter(t => t.status === ProgressStatus.COMPLETED).length
  const warning = progressList.value.filter(t => t.status === ProgressStatus.WARNING).length
  const error = progressList.value.filter(t => t.status === ProgressStatus.ERROR).length
  
  const avgProgress = total > 0 
    ? Math.round(progressList.value.reduce((sum, t) => sum + t.progress, 0) / total)
    : 0
  
  return {
    total,
    running,
    completed,
    warning,
    error,
    avgProgress
  }
})

// 今日进度统计
const todayStats = reactive({
  completedToday: 12,
  avgDuration: '2h 35m',
  trend: 15.6 // 正数表示增长，负数表示下降
})

// 筛选后的列表
const filteredList = computed(() => {
  return progressList.value.filter(task => {
    const nameMatch = !searchForm.taskName || 
      task.taskName.toLowerCase().includes(searchForm.taskName.toLowerCase())
    const statusMatch = !searchForm.status || task.status === searchForm.status
    return nameMatch && statusMatch
  })
})

// 进度提醒配置
const reminderConfig = reactive<ReminderConfig>({
  enabled: true,
  progressThreshold: 80,
  timeThreshold: 3600,
  notifyEmail: true,
  notifySystem: true
})

// 预测参数配置
const predictionParams = reactive<PredictionParams>({
  algorithm: 'linear',
  historicalWeight: 70,
  smoothingFactor: 0.3
})

const showReminderDialog = ref(false)
const showPredictionDialog = ref(false)
const showDetailDrawer = ref(false)

// 工具函数：格式化时间
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 工具函数：获取状态颜色
const getStatusColor = (status: ProgressStatus): string => {
  const colorMap = {
    [ProgressStatus.RUNNING]: 'primary',
    [ProgressStatus.COMPLETED]: 'success',
    [ProgressStatus.PAUSED]: 'info',
    [ProgressStatus.WARNING]: 'warning',
    [ProgressStatus.ERROR]: 'danger'
  }
  return colorMap[status] || 'info'
}

// 工具函数：获取状态文本
const getStatusText = (status: ProgressStatus): string => {
  const textMap = {
    [ProgressStatus.RUNNING]: '执行中',
    [ProgressStatus.COMPLETED]: '已完成',
    [ProgressStatus.PAUSED]: '已暂停',
    [ProgressStatus.WARNING]: '预警',
    [ProgressStatus.ERROR]: '异常'
  }
  return textMap[status] || '未知'
}

// 工具函数：获取进度条颜色
const getProgressColor = (progress: number, status: ProgressStatus): string => {
  if (status === ProgressStatus.ERROR) return '#f56c6c'
  if (status === ProgressStatus.WARNING) return '#e6a23c'
  return '#409eff'
}

// Mock 数据生成
const generateMockData = (): TaskProgress[] => {
  const tasks: TaskProgress[] = []
  const statuses = [
    ProgressStatus.RUNNING,
    ProgressStatus.COMPLETED,
    ProgressStatus.WARNING,
    ProgressStatus.PAUSED
  ]
  
  const taskNames = [
    '数据分析任务-A1',
    '模型训练任务-B2',
    '数据清洗任务-C3',
    '特征工程任务-D4',
    '模型评估任务-E5',
    '数据导入任务-F6',
    '报表生成任务-G7',
    '数据同步任务-H8',
    '批处理任务-I9',
    '实时计算任务-J10'
  ]
  
  for (let i = 0; i < 10; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const progress = status === ProgressStatus.COMPLETED 
      ? 100 
      : Math.floor(Math.random() * 90) + 5
    
    const elapsedTime = Math.floor(Math.random() * 7200) + 300
    const estimatedTotal = Math.floor(elapsedTime / (progress / 100))
    const estimatedRemaining = Math.max(0, estimatedTotal - elapsedTime)
    
    const startTime = new Date(Date.now() - elapsedTime * 1000)
    
    tasks.push({
      id: i + 1,
      taskName: taskNames[i],
      startTime: startTime.toLocaleString('zh-CN'),
      elapsedTime,
      progress,
      estimatedRemaining,
      status,
      stage: `阶段 ${Math.min(Math.floor(progress / 25) + 1, 4)}`,
      totalStages: 4,
      currentStage: Math.min(Math.floor(progress / 25) + 1, 4),
      confidence: Math.floor(Math.random() * 30) + 70
    })
  }
  
  return tasks
}

// Mock 详情数据
const generateMockDetail = (taskId: number): ProgressDetail => {
  const task = progressList.value.find(t => t.id === taskId)
  if (!task) {
    return {
      taskId,
      stages: [],
      timeline: [],
      logs: []
    }
  }
  
  const currentStage = task.currentStage
  
  return {
    taskId,
    stages: [
      {
        name: '初始化阶段',
        status: currentStage >= 1 ? 'completed' : 'pending',
        startTime: task.startTime,
        endTime: currentStage > 1 ? new Date(new Date(task.startTime).getTime() + 300000).toLocaleString('zh-CN') : undefined,
        duration: currentStage > 1 ? 300 : undefined
      },
      {
        name: '数据处理阶段',
        status: currentStage === 2 ? 'running' : currentStage > 2 ? 'completed' : 'pending',
        startTime: currentStage >= 2 ? new Date(new Date(task.startTime).getTime() + 300000).toLocaleString('zh-CN') : undefined,
        endTime: currentStage > 2 ? new Date(new Date(task.startTime).getTime() + 900000).toLocaleString('zh-CN') : undefined,
        duration: currentStage > 2 ? 600 : undefined
      },
      {
        name: '执行计算阶段',
        status: currentStage === 3 ? 'running' : currentStage > 3 ? 'completed' : 'pending',
        startTime: currentStage >= 3 ? new Date(new Date(task.startTime).getTime() + 900000).toLocaleString('zh-CN') : undefined,
        endTime: currentStage > 3 ? new Date(new Date(task.startTime).getTime() + 1800000).toLocaleString('zh-CN') : undefined,
        duration: currentStage > 3 ? 900 : undefined
      },
      {
        name: '完成收尾阶段',
        status: currentStage === 4 ? 'running' : currentStage > 4 ? 'completed' : 'pending',
        startTime: currentStage >= 4 ? new Date(new Date(task.startTime).getTime() + 1800000).toLocaleString('zh-CN') : undefined,
        endTime: task.status === ProgressStatus.COMPLETED ? new Date(new Date(task.startTime).getTime() + 2100000).toLocaleString('zh-CN') : undefined,
        duration: task.status === ProgressStatus.COMPLETED ? 300 : undefined
      }
    ],
    timeline: [
      {
        time: task.startTime,
        event: '任务开始执行',
        type: 'success'
      },
      {
        time: new Date(new Date(task.startTime).getTime() + 300000).toLocaleString('zh-CN'),
        event: '初始化完成',
        type: 'info'
      },
      {
        time: new Date(new Date(task.startTime).getTime() + 600000).toLocaleString('zh-CN'),
        event: '数据加载完成',
        type: 'info'
      },
      ...(task.status === ProgressStatus.WARNING ? [{
        time: new Date(new Date(task.startTime).getTime() + 900000).toLocaleString('zh-CN'),
        event: '检测到性能预警',
        type: 'warning' as const
      }] : []),
      ...(currentStage >= 3 ? [{
        time: new Date(new Date(task.startTime).getTime() + 1200000).toLocaleString('zh-CN'),
        event: '计算进度达到50%',
        type: 'info' as const
      }] : [])
    ],
    logs: [
      {
        time: task.startTime,
        message: '[INFO] 任务启动，正在初始化环境...',
        level: 'info'
      },
      {
        time: new Date(new Date(task.startTime).getTime() + 120000).toLocaleString('zh-CN'),
        message: '[INFO] 环境初始化完成，开始加载数据',
        level: 'info'
      },
      {
        time: new Date(new Date(task.startTime).getTime() + 300000).toLocaleString('zh-CN'),
        message: '[INFO] 数据加载完成，共 150,000 条记录',
        level: 'info'
      },
      {
        time: new Date(new Date(task.startTime).getTime() + 480000).toLocaleString('zh-CN'),
        message: '[INFO] 数据预处理中，已完成 45%',
        level: 'info'
      },
      ...(task.status === ProgressStatus.WARNING ? [{
        time: new Date(new Date(task.startTime).getTime() + 600000).toLocaleString('zh-CN'),
        message: '[WARN] CPU 使用率较高，建议关注',
        level: 'warn' as const
      }] : []),
      {
        time: new Date(new Date(task.startTime).getTime() + 720000).toLocaleString('zh-CN'),
        message: '[INFO] 进入计算阶段，预计剩余时间 ' + formatDuration(task.estimatedRemaining),
        level: 'info'
      }
    ]
  }
}

// 加载进度数据
const loadProgressData = async () => {
  loading.value = true
  
  // 模拟异步加载
  setTimeout(() => {
    progressList.value = generateMockData()
    loading.value = false
    
    // 如果当前有选中的任务，更新详情
    if (selectedTask.value) {
      const updated = progressList.value.find(t => t.id === selectedTask.value!.id)
      if (updated) {
        selectedTask.value = updated
        progressDetail.value = generateMockDetail(updated.id)
      }
    }
  }, 500)
}

// 查看任务详情
const viewTaskDetail = (task: TaskProgress) => {
  selectedTask.value = task
  progressDetail.value = generateMockDetail(task.id)
  showDetailDrawer.value = true
}

// 更新任务进度（模拟实时更新）
const updateProgress = () => {
  progressList.value = progressList.value.map(task => {
    if (task.status === ProgressStatus.RUNNING && task.progress < 100) {
      // 随机增加进度
      const increment = Math.random() * 3
      const newProgress = Math.min(100, task.progress + increment)
      
      // 更新已执行时间
      const newElapsedTime = task.elapsedTime + 5
      
      // 重新计算剩余时间
      const estimatedTotal = Math.floor(newElapsedTime / (newProgress / 100))
      const estimatedRemaining = Math.max(0, estimatedTotal - newElapsedTime)
      
      // 更新当前阶段
      const newCurrentStage = Math.min(Math.floor(newProgress / 25) + 1, 4)
      
      // 检查是否完成
      const newStatus = newProgress >= 100 ? ProgressStatus.COMPLETED : task.status
      
      return {
        ...task,
        progress: Math.round(newProgress),
        elapsedTime: newElapsedTime,
        estimatedRemaining,
        currentStage: newCurrentStage,
        stage: `阶段 ${newCurrentStage}`,
        status: newStatus
      }
    }
    return task
  })
}

// 手动刷新
const handleRefresh = () => {
  loadProgressData()
  ElMessage.success('刷新成功')
}

// 搜索/重置
const handleSearch = () => {
  // 筛选逻辑已在 computed 中处理
}

const handleReset = () => {
  searchForm.taskName = ''
  searchForm.status = ''
}

// 暂停/恢复任务
const toggleTaskPause = async (task: TaskProgress) => {
  const action = task.status === ProgressStatus.PAUSED ? '恢复' : '暂停'
  
  try {
    await ElMessageBox.confirm(
      `确定要${action}任务"${task.taskName}"吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 模拟操作
    setTimeout(() => {
      const index = progressList.value.findIndex(t => t.id === task.id)
      if (index !== -1) {
        progressList.value[index].status = 
          task.status === ProgressStatus.PAUSED 
            ? ProgressStatus.RUNNING 
            : ProgressStatus.PAUSED
      }
      ElMessage.success(`${action}成功`)
    }, 300)
  } catch {
    // 用户取消
  }
}

// 手动更新进度
const manualUpdateProgress = (task: TaskProgress) => {
  ElMessageBox.prompt('请输入新的进度值（0-100）', '手动更新进度', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^([0-9]|[1-9][0-9]|100)$/,
    inputErrorMessage: '请输入 0-100 之间的数字'
  }).then(({ value }) => {
    setTimeout(() => {
      const index = progressList.value.findIndex(t => t.id === task.id)
      if (index !== -1) {
        const newProgress = parseInt(value)
        progressList.value[index].progress = newProgress
        progressList.value[index].currentStage = Math.min(Math.floor(newProgress / 25) + 1, 4)
        progressList.value[index].stage = `阶段 ${progressList.value[index].currentStage}`
        
        if (newProgress >= 100) {
          progressList.value[index].status = ProgressStatus.COMPLETED
        }
      }
      ElMessage.success('进度更新成功')
    }, 300)
  }).catch(() => {
    // 用户取消
  })
}

// 导出报表
const exportReport = () => {
  ElMessage.info('正在生成报表...')
  
  setTimeout(() => {
    // 模拟导出
    const data = {
      exportTime: new Date().toLocaleString('zh-CN'),
      totalTasks: overviewStats.value.total,
      completedTasks: overviewStats.value.completed,
      runningTasks: overviewStats.value.running,
      avgProgress: overviewStats.value.avgProgress,
      tasks: filteredList.value
    }
    
    console.log('Export data:', data)
    ElMessage.success('报表导出成功')
  }, 1000)
}

// 保存提醒配置
const saveReminderConfig = () => {
  setTimeout(() => {
    ElMessage.success('提醒配置已保存')
    showReminderDialog.value = false
  }, 300)
}

// 保存预测参数
const savePredictionParams = () => {
  setTimeout(() => {
    ElMessage.success('预测参数已保存')
    showPredictionDialog.value = false
  }, 300)
}

// 切换自动刷新
const toggleAutoRefresh = (value: boolean) => {
  if (value) {
    startAutoRefresh()
    ElMessage.success('已启用自动刷新')
  } else {
    stopAutoRefresh()
    ElMessage.info('已停止自动刷新')
  }
}

// 启动自动刷新
const startAutoRefresh = () => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
  
  refreshInterval.value = window.setInterval(() => {
    updateProgress()
  }, 5000) // 每5秒更新一次
}

// 停止自动刷新
const stopAutoRefresh = () => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
}

// 组件挂载
onMounted(() => {
  loadProgressData()
  if (autoRefresh.value) {
    startAutoRefresh()
  }
})

// 组件卸载
onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<template>
  <div class="progress-tracking-container">
    <!-- 进度概览区 -->
    <el-row :gutter="16" class="overview-section">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover">
          <el-statistic title="总任务数" :value="overviewStats.total">
            <template #suffix>个</template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover">
          <el-statistic title="执行中" :value="overviewStats.running">
            <template #suffix>
              <el-tag type="primary" size="small">运行</el-tag>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover">
          <el-statistic title="已完成" :value="overviewStats.completed">
            <template #suffix>
              <el-tag type="success" size="small">完成</el-tag>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover">
          <el-statistic title="平均进度" :value="overviewStats.avgProgress">
            <template #suffix>%</template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- 整体进度展示 -->
    <el-card class="overall-progress-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>整体进度</span>
          <el-switch
            v-model="autoRefresh"
            active-text="自动刷新"
            @change="toggleAutoRefresh"
          />
        </div>
      </template>
      <div class="progress-container">
        <el-progress
          :percentage="overviewStats.avgProgress"
          :stroke-width="20"
          :color="getProgressColor(overviewStats.avgProgress, ProgressStatus.RUNNING)"
          striped
          striped-flow
        />
        <div class="progress-stats">
          <div class="stat-item">
            <span class="label">今日完成：</span>
            <span class="value">{{ todayStats.completedToday }} 个</span>
          </div>
          <div class="stat-item">
            <span class="label">平均耗时：</span>
            <span class="value">{{ todayStats.avgDuration }}</span>
          </div>
          <div class="stat-item">
            <span class="label">效率趋势：</span>
            <span class="value" :class="todayStats.trend > 0 ? 'trend-up' : 'trend-down'">
              {{ todayStats.trend > 0 ? '↑' : '↓' }} {{ Math.abs(todayStats.trend) }}%
            </span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 预警提示 -->
    <el-alert
      v-if="overviewStats.warning > 0 || overviewStats.error > 0"
      :title="`检测到 ${overviewStats.warning} 个预警任务，${overviewStats.error} 个异常任务`"
      type="warning"
      show-icon
      :closable="false"
      class="alert-section"
    />

    <!-- 搜索筛选区 -->
    <el-card shadow="hover" class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="任务名称">
          <el-input
            v-model="searchForm.taskName"
            placeholder="请输入任务名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 150px"
          >
            <el-option label="执行中" :value="ProgressStatus.RUNNING" />
            <el-option label="已完成" :value="ProgressStatus.COMPLETED" />
            <el-option label="已暂停" :value="ProgressStatus.PAUSED" />
            <el-option label="预警" :value="ProgressStatus.WARNING" />
            <el-option label="异常" :value="ProgressStatus.ERROR" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button @click="handleRefresh" :icon="'Refresh'">刷新</el-button>
        </el-form-item>
      </el-form>
      <div class="action-buttons">
        <el-button type="success" @click="exportReport">导出报表</el-button>
        <el-button type="primary" @click="showReminderDialog = true">进度提醒</el-button>
        <el-button type="warning" @click="showPredictionDialog = true">预测参数</el-button>
      </div>
    </el-card>

    <!-- 任务进度列表 -->
    <el-card shadow="hover" class="table-card">
      <template #header>
        <div class="card-header">
          <span>任务进度列表</span>
          <el-tag>共 {{ filteredList.length }} 条</el-tag>
        </div>
      </template>
      <el-table
        :data="filteredList"
        v-loading="loading"
        stripe
        border
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="taskName" label="任务名称" min-width="180" />
        <el-table-column prop="startTime" label="开始时间" width="180" />
        <el-table-column label="已执行时长" width="120" align="center">
          <template #default="{ row }">
            <span class="time-display">{{ formatDuration(row.elapsedTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="进度" width="200">
          <template #default="{ row }">
            <div class="progress-cell">
              <el-progress
                :percentage="row.progress"
                :color="getProgressColor(row.progress, row.status)"
                :stroke-width="12"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="剩余时间预估" width="140" align="center">
          <template #default="{ row }">
            <span v-if="row.status !== ProgressStatus.COMPLETED" class="time-display">
              {{ formatDuration(row.estimatedRemaining) }}
            </span>
            <el-tag v-else type="success" size="small">已完成</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="当前阶段" width="120" align="center">
          <template #default="{ row }">
            <span>{{ row.stage }}</span>
            <div class="stage-info">{{ row.currentStage }}/{{ row.totalStages }}</div>
          </template>
        </el-table-column>
        <el-table-column label="可信度" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.confidence >= 80 ? 'success' : row.confidence >= 60 ? 'warning' : 'danger'" size="small">
              {{ row.confidence }}%
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusColor(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="viewTaskDetail(row)">
              查看详情
            </el-button>
            <el-button
              v-if="row.status === ProgressStatus.RUNNING || row.status === ProgressStatus.PAUSED"
              link
              type="warning"
              size="small"
              @click="toggleTaskPause(row)"
            >
              {{ row.status === ProgressStatus.PAUSED ? '恢复' : '暂停' }}
            </el-button>
            <el-button
              link
              type="success"
              size="small"
              @click="manualUpdateProgress(row)"
            >
              更新进度
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 进度详情抽屉 -->
    <el-drawer
      v-model="showDetailDrawer"
      title="进度详情"
      size="60%"
      direction="rtl"
    >
      <div v-if="selectedTask && progressDetail" class="detail-content">
        <!-- 任务基本信息 -->
        <el-card shadow="never" class="detail-card">
          <template #header>
            <span class="detail-title">基本信息</span>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="任务名称">{{ selectedTask.taskName }}</el-descriptions-item>
            <el-descriptions-item label="任务状态">
              <el-tag :type="getStatusColor(selectedTask.status)">
                {{ getStatusText(selectedTask.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="开始时间">{{ selectedTask.startTime }}</el-descriptions-item>
            <el-descriptions-item label="已执行时长">{{ formatDuration(selectedTask.elapsedTime) }}</el-descriptions-item>
            <el-descriptions-item label="当前进度">
              <el-progress
                :percentage="selectedTask.progress"
                :color="getProgressColor(selectedTask.progress, selectedTask.status)"
              />
            </el-descriptions-item>
            <el-descriptions-item label="剩余时间">
              {{ selectedTask.status !== ProgressStatus.COMPLETED ? formatDuration(selectedTask.estimatedRemaining) : '已完成' }}
            </el-descriptions-item>
            <el-descriptions-item label="当前阶段">{{ selectedTask.stage }}</el-descriptions-item>
            <el-descriptions-item label="预测可信度">
              <el-tag :type="selectedTask.confidence >= 80 ? 'success' : selectedTask.confidence >= 60 ? 'warning' : 'danger'">
                {{ selectedTask.confidence }}%
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 阶段划分 -->
        <el-card shadow="never" class="detail-card">
          <template #header>
            <span class="detail-title">阶段划分</span>
          </template>
          <el-steps :active="selectedTask.currentStage - 1" align-center>
            <el-step
              v-for="(stage, index) in progressDetail.stages"
              :key="index"
              :title="stage.name"
              :description="stage.status === 'completed' 
                ? `耗时: ${formatDuration(stage.duration || 0)}` 
                : stage.status === 'running' 
                  ? '进行中...' 
                  : '等待中'"
              :status="stage.status === 'completed' ? 'success' : stage.status === 'running' ? 'process' : 'wait'"
            />
          </el-steps>
        </el-card>

        <!-- 执行时间线 -->
        <el-card shadow="never" class="detail-card">
          <template #header>
            <span class="detail-title">执行时间线</span>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(item, index) in progressDetail.timeline"
              :key="index"
              :timestamp="item.time"
              :type="item.type"
            >
              {{ item.event }}
            </el-timeline-item>
          </el-timeline>
        </el-card>

        <!-- 执行日志 -->
        <el-card shadow="never" class="detail-card">
          <template #header>
            <span class="detail-title">执行日志</span>
          </template>
          <div class="log-container">
            <div
              v-for="(log, index) in progressDetail.logs"
              :key="index"
              class="log-item"
              :class="`log-${log.level}`"
            >
              <span class="log-time">{{ log.time }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
        </el-card>
      </div>
    </el-drawer>

    <!-- 进度提醒配置对话框 -->
    <el-dialog
      v-model="showReminderDialog"
      title="进度提醒配置"
      width="500px"
    >
      <el-form :model="reminderConfig" label-width="120px">
        <el-form-item label="启用提醒">
          <el-switch v-model="reminderConfig.enabled" />
        </el-form-item>
        <el-form-item label="进度阈值">
          <el-slider
            v-model="reminderConfig.progressThreshold"
            :min="0"
            :max="100"
            :disabled="!reminderConfig.enabled"
            show-input
          />
          <span class="form-tip">进度达到该值时提醒</span>
        </el-form-item>
        <el-form-item label="时间阈值">
          <el-slider
            v-model="reminderConfig.timeThreshold"
            :min="300"
            :max="7200"
            :step="300"
            :disabled="!reminderConfig.enabled"
            :format-tooltip="formatDuration"
          />
          <span class="form-tip">剩余时间少于该值时提醒</span>
        </el-form-item>
        <el-form-item label="邮件通知">
          <el-switch v-model="reminderConfig.notifyEmail" :disabled="!reminderConfig.enabled" />
        </el-form-item>
        <el-form-item label="系统通知">
          <el-switch v-model="reminderConfig.notifySystem" :disabled="!reminderConfig.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReminderDialog = false">取消</el-button>
        <el-button type="primary" @click="saveReminderConfig">保存</el-button>
      </template>
    </el-dialog>

    <!-- 预测参数配置对话框 -->
    <el-dialog
      v-model="showPredictionDialog"
      title="预测参数配置"
      width="500px"
    >
      <el-form :model="predictionParams" label-width="120px">
        <el-form-item label="预测算法">
          <el-select v-model="predictionParams.algorithm" style="width: 100%">
            <el-option label="线性预测" value="linear" />
            <el-option label="指数平滑" value="exponential" />
            <el-option label="AI 智能预测" value="ai" />
          </el-select>
        </el-form-item>
        <el-form-item label="历史权重">
          <el-slider
            v-model="predictionParams.historicalWeight"
            :min="0"
            :max="100"
            show-input
          />
          <span class="form-tip">历史数据在预测中的权重占比</span>
        </el-form-item>
        <el-form-item label="平滑因子">
          <el-slider
            v-model="predictionParams.smoothingFactor"
            :min="0"
            :max="1"
            :step="0.1"
            show-input
          />
          <span class="form-tip">用于指数平滑算法的平滑系数</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPredictionDialog = false">取消</el-button>
        <el-button type="primary" @click="savePredictionParams">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.progress-tracking-container {
  min-height: 100vh;
}

.overview-section {
  margin-bottom: 20px;

  .el-col {
    margin-bottom: 16px;
  }
}

.overall-progress-card {
  margin-bottom: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
  }

  .progress-container {
    .el-progress {
      margin-bottom: 20px;
    }

    .progress-stats {
      display: flex;
      justify-content: space-around;
      padding: 10px 0;

      .stat-item {
        .label {
          color: #909399;
          margin-right: 8px;
        }

        .value {
          font-weight: 600;
          color: #303133;

          &.trend-up {
            color: #67c23a;
          }

          &.trend-down {
            color: #f56c6c;
          }
        }
      }
    }
  }
}

.alert-section {
  margin-bottom: 20px;
}

.search-card {
  margin-bottom: 20px;

  .el-form {
    margin-bottom: 16px;
  }

  .action-buttons {
    display: flex;
    gap: 10px;
  }
}

.table-card {
  margin-bottom: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
  }

  .time-display {
    font-family: 'Courier New', monospace;
    font-weight: 600;
    color: #409eff;
  }

  .progress-cell {
    padding: 5px 0;
  }

  .stage-info {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }
}

.detail-content {
  .detail-card {
    margin-bottom: 20px;

    .detail-title {
      font-weight: 600;
      font-size: 16px;
    }
  }

  .log-container {
    max-height: 400px;
    overflow-y: auto;
    background-color: #1e1e1e;
    padding: 15px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 13px;

    .log-item {
      margin-bottom: 8px;
      display: flex;
      line-height: 1.6;

      .log-time {
        color: #858585;
        margin-right: 12px;
        flex-shrink: 0;
      }

      .log-message {
        flex: 1;
      }

      &.log-info .log-message {
        color: #4ec9b0;
      }

      &.log-warn .log-message {
        color: #dcdcaa;
      }

      &.log-error .log-message {
        color: #f48771;
      }
    }
  }
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-left: 10px;
}

// 响应式设计
@media (max-width: 768px) {
  .progress-tracking-container {
    padding: 10px;
  }

  .search-card {
    .el-form {
      .el-form-item {
        display: block;
        margin-right: 0;
      }
    }

    .action-buttons {
      flex-direction: column;

      .el-button {
        width: 100%;
      }
    }
  }

  .table-card {
    :deep(.el-table) {
      font-size: 12px;
    }
  }
}
</style>