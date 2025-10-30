<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'

// 任务状态枚举
enum TaskStatus {
  WAITING = 'waiting',
  READY = 'ready',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// 优先级枚举
enum Priority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

// 任务接口定义
interface Task {
  id: string
  name: string
  status: TaskStatus
  priority: Priority
  startTime: string
  endTime: string
  duration: number // 分钟
  progress: number
  dependencies: string[] // 依赖的任务ID
  resources: {
    cpu: number
    memory: number
  }
}

// 调度策略接口
interface SchedulePolicy {
  type: 'time' | 'event' | 'dependency'
  name: string
  value: string
  enabled: boolean
}

// 数据定义
const loading = ref(false)
const tasks = ref<Task[]>([])
const selectedTask = ref<Task | null>(null)
const schedulePolicies = ref<SchedulePolicy[]>([])

// 统计数据
const statistics = computed(() => {
  const total = tasks.value.length
  const completed = tasks.value.filter(t => t.status === TaskStatus.COMPLETED).length
  const running = tasks.value.filter(t => t.status === TaskStatus.RUNNING).length
  const failed = tasks.value.filter(t => t.status === TaskStatus.FAILED).length
  const avgProgress = tasks.value.reduce((sum, t) => sum + t.progress, 0) / total || 0
  
  return {
    total,
    completed,
    running,
    failed,
    waiting: total - completed - running - failed,
    completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : 0,
    avgProgress: avgProgress.toFixed(1)
  }
})

// 资源利用率
const resourceUsage = computed(() => {
  const runningTasks = tasks.value.filter(t => t.status === TaskStatus.RUNNING)
  const totalCPU = runningTasks.reduce((sum, t) => sum + t.resources.cpu, 0)
  const totalMemory = runningTasks.reduce((sum, t) => sum + t.resources.memory, 0)
  
  return {
    cpu: Math.min(totalCPU, 100),
    memory: Math.min(totalMemory, 100)
  }
})

// 获取任务状态颜色
const getStatusColor = (status: TaskStatus) => {
  const colorMap = {
    [TaskStatus.WAITING]: '#909399',
    [TaskStatus.READY]: '#409EFF',
    [TaskStatus.RUNNING]: '#67C23A',
    [TaskStatus.COMPLETED]: '#E6A23C',
    [TaskStatus.FAILED]: '#F56C6C'
  }
  return colorMap[status]
}

// 获取任务状态标签类型
const getStatusType = (status: TaskStatus) => {
  const typeMap = {
    [TaskStatus.WAITING]: 'info',
    [TaskStatus.READY]: 'primary',
    [TaskStatus.RUNNING]: 'success',
    [TaskStatus.COMPLETED]: 'warning',
    [TaskStatus.FAILED]: 'danger'
  }
  return typeMap[status] as any
}

// 获取优先级颜色
const getPriorityColor = (priority: Priority) => {
  const colorMap = {
    [Priority.HIGH]: '#F56C6C',
    [Priority.MEDIUM]: '#E6A23C',
    [Priority.LOW]: '#409EFF'
  }
  return colorMap[priority]
}

// 获取优先级标签类型
const getPriorityType = (priority: Priority) => {
  const typeMap = {
    [Priority.HIGH]: 'danger',
    [Priority.MEDIUM]: 'warning',
    [Priority.LOW]: 'primary'
  }
  return typeMap[priority] as any
}

// 获取状态文本
const getStatusText = (status: TaskStatus) => {
  const textMap = {
    [TaskStatus.WAITING]: '等待',
    [TaskStatus.READY]: '就绪',
    [TaskStatus.RUNNING]: '运行中',
    [TaskStatus.COMPLETED]: '已完成',
    [TaskStatus.FAILED]: '失败'
  }
  return textMap[status]
}

// 获取优先级文本
const getPriorityText = (priority: Priority) => {
  const textMap = {
    [Priority.HIGH]: '高',
    [Priority.MEDIUM]: '中',
    [Priority.LOW]: '低'
  }
  return textMap[priority]
}

// 模拟加载数据
const loadData = async () => {
  loading.value = true
  
  // 模拟异步加载
  await new Promise(resolve => setTimeout(resolve, 800))
  
  // Mock 任务数据
  tasks.value = [
    {
      id: 'task-001',
      name: '数据采集任务',
      status: TaskStatus.COMPLETED,
      priority: Priority.HIGH,
      startTime: '08:00',
      endTime: '08:30',
      duration: 30,
      progress: 100,
      dependencies: [],
      resources: { cpu: 0, memory: 0 }
    },
    {
      id: 'task-002',
      name: '数据清洗任务',
      status: TaskStatus.RUNNING,
      priority: Priority.HIGH,
      startTime: '08:30',
      endTime: '09:15',
      duration: 45,
      progress: 65,
      dependencies: ['task-001'],
      resources: { cpu: 45, memory: 60 }
    },
    {
      id: 'task-003',
      name: '特征工程任务',
      status: TaskStatus.READY,
      priority: Priority.MEDIUM,
      startTime: '09:15',
      endTime: '10:00',
      duration: 45,
      progress: 0,
      dependencies: ['task-002'],
      resources: { cpu: 0, memory: 0 }
    },
    {
      id: 'task-004',
      name: '模型训练任务',
      status: TaskStatus.WAITING,
      priority: Priority.HIGH,
      startTime: '10:00',
      endTime: '12:00',
      duration: 120,
      progress: 0,
      dependencies: ['task-003'],
      resources: { cpu: 0, memory: 0 }
    },
    {
      id: 'task-005',
      name: '模型评估任务',
      status: TaskStatus.WAITING,
      priority: Priority.MEDIUM,
      startTime: '12:00',
      endTime: '12:30',
      duration: 30,
      progress: 0,
      dependencies: ['task-004'],
      resources: { cpu: 0, memory: 0 }
    },
    {
      id: 'task-006',
      name: '实时监控任务',
      status: TaskStatus.RUNNING,
      priority: Priority.LOW,
      startTime: '08:00',
      endTime: '18:00',
      duration: 600,
      progress: 35,
      dependencies: [],
      resources: { cpu: 15, memory: 25 }
    },
    {
      id: 'task-007',
      name: '异常检测任务',
      status: TaskStatus.COMPLETED,
      priority: Priority.MEDIUM,
      startTime: '08:00',
      endTime: '08:45',
      duration: 45,
      progress: 100,
      dependencies: [],
      resources: { cpu: 0, memory: 0 }
    },
    {
      id: 'task-008',
      name: '报表生成任务',
      status: TaskStatus.READY,
      priority: Priority.LOW,
      startTime: '12:30',
      endTime: '13:00',
      duration: 30,
      progress: 0,
      dependencies: ['task-005'],
      resources: { cpu: 0, memory: 0 }
    }
  ]
  
  // Mock 调度策略
  schedulePolicies.value = [
    { type: 'time', name: '每日定时调度', value: '每天 08:00', enabled: true },
    { type: 'time', name: '每周汇总', value: '每周一 09:00', enabled: true },
    { type: 'event', name: '数据到达触发', value: '新数据上传时', enabled: true },
    { type: 'dependency', name: '依赖自动触发', value: '前置任务完成时', enabled: true },
    { type: 'time', name: '小时级调度', value: '每小时执行', enabled: false }
  ]
  
  loading.value = false
}

// 选择任务
const selectTask = (task: Task) => {
  selectedTask.value = task
}

// 启动任务
const startTask = (task: Task) => {
  if (task.status === TaskStatus.READY) {
    task.status = TaskStatus.RUNNING
    ElMessage.success(`任务 ${task.name} 已启动`)
  } else {
    ElMessage.warning('只能启动就绪状态的任务')
  }
}

// 停止任务
const stopTask = (task: Task) => {
  if (task.status === TaskStatus.RUNNING) {
    task.status = TaskStatus.READY
    ElMessage.info(`任务 ${task.name} 已停止`)
  } else {
    ElMessage.warning('只能停止运行中的任务')
  }
}

// 切换策略状态
const togglePolicy = (policy: SchedulePolicy) => {
  policy.enabled = !policy.enabled
  ElMessage.success(`策略 ${policy.name} 已${policy.enabled ? '启用' : '禁用'}`)
}

// 优化调度
const optimizeSchedule = () => {
  ElMessage.success('调度优化已完成，预计可提升资源利用率 15%')
}

// 获取依赖任务名称
const getDependencyNames = (dependencies: string[]) => {
  return dependencies.map(id => {
    const task = tasks.value.find(t => t.id === id)
    return task ? task.name : id
  }).join(', ')
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="task-scheduling" v-loading="loading">
    <!-- 顶部统计 -->
    <el-row :gutter="20" class="statistics">
      <el-col :span="4">
        <el-card shadow="hover">
          <el-statistic title="总任务数" :value="statistics.total">
            <template #suffix>个</template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover">
          <el-statistic title="运行中" :value="statistics.running">
            <template #suffix>
              <span style="color: #67C23A">个</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover">
          <el-statistic title="已完成" :value="statistics.completed">
            <template #suffix>
              <span style="color: #E6A23C">个</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover">
          <el-statistic title="完成率" :value="statistics.completionRate">
            <template #suffix>%</template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover">
          <el-statistic title="CPU使用率" :value="resourceUsage.cpu.toFixed(1)">
            <template #suffix>%</template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover">
          <el-statistic title="内存使用率" :value="resourceUsage.memory.toFixed(1)">
            <template #suffix>%</template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- 主内容区 -->
    <el-row :gutter="20" class="main-content">
      <!-- 左侧：任务列表 -->
      <el-col :span="8">
        <el-card shadow="hover" class="task-list-card">
          <template #header>
            <div class="card-header">
              <span>任务列表</span>
              <el-button type="primary" size="small" @click="optimizeSchedule">
                智能优化
              </el-button>
            </div>
          </template>
          
          <div class="task-list">
            <div 
              v-for="task in tasks" 
              :key="task.id"
              class="task-item"
              :class="{ 'selected': selectedTask?.id === task.id }"
              @click="selectTask(task)"
            >
              <div class="task-header">
                <div class="task-title">
                  <el-tag 
                    :type="getPriorityType(task.priority)" 
                    size="small"
                    style="margin-right: 8px"
                  >
                    {{ getPriorityText(task.priority) }}
                  </el-tag>
                  <span class="task-name">{{ task.name }}</span>
                </div>
                <el-tag :type="getStatusType(task.status)" size="small">
                  {{ getStatusText(task.status) }}
                </el-tag>
              </div>
              
              <div class="task-info">
                <div class="info-item">
                  <span class="label">时间:</span>
                  <span>{{ task.startTime }} - {{ task.endTime }}</span>
                </div>
                <div class="info-item" v-if="task.dependencies.length > 0">
                  <span class="label">依赖:</span>
                  <span class="dependency-text">{{ getDependencyNames(task.dependencies) }}</span>
                </div>
              </div>
              
              <el-progress 
                :percentage="task.progress" 
                :color="getStatusColor(task.status)"
                :stroke-width="6"
              />
              
              <div class="task-actions" v-if="task.status === TaskStatus.RUNNING || task.status === TaskStatus.READY">
                <el-button 
                  v-if="task.status === TaskStatus.READY"
                  type="success" 
                  size="small"
                  @click.stop="startTask(task)"
                >
                  启动
                </el-button>
                <el-button 
                  v-if="task.status === TaskStatus.RUNNING"
                  type="warning" 
                  size="small"
                  @click.stop="stopTask(task)"
                >
                  停止
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 中间：任务时间线 -->
      <el-col :span="10">
        <el-card shadow="hover" class="timeline-card">
          <template #header>
            <span>任务调度时间线</span>
          </template>
          
          <el-timeline>
            <el-timeline-item
              v-for="task in tasks"
              :key="task.id"
              :timestamp="task.startTime"
              placement="top"
              :color="getStatusColor(task.status)"
            >
              <el-card>
                <div class="timeline-task">
                  <div class="timeline-header">
                    <h4>{{ task.name }}</h4>
                    <el-tag :type="getStatusType(task.status)" size="small">
                      {{ getStatusText(task.status) }}
                    </el-tag>
                  </div>
                  <p class="timeline-time">
                    执行时间: {{ task.startTime }} - {{ task.endTime }} ({{ task.duration }}分钟)
                  </p>
                  <p v-if="task.dependencies.length > 0" class="timeline-deps">
                    依赖任务: {{ getDependencyNames(task.dependencies) }}
                  </p>
                  <div class="timeline-resources" v-if="task.status === TaskStatus.RUNNING">
                    <div class="resource-item">
                      <span>CPU:</span>
                      <el-progress 
                        :percentage="task.resources.cpu" 
                        :stroke-width="8"
                        style="width: 100px; margin-left: 8px"
                      />
                    </div>
                    <div class="resource-item">
                      <span>内存:</span>
                      <el-progress 
                        :percentage="task.resources.memory" 
                        :stroke-width="8"
                        style="width: 100px; margin-left: 8px"
                      />
                    </div>
                  </div>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>

      <!-- 右侧：策略配置 -->
      <el-col :span="6">
        <!-- 调度策略 -->
        <el-card shadow="hover" class="policy-card">
          <template #header>
            <span>调度策略配置</span>
          </template>
          
          <div class="policy-list">
            <div v-for="policy in schedulePolicies" :key="policy.name" class="policy-item">
              <div class="policy-header">
                <el-tag 
                  :type="policy.type === 'time' ? 'primary' : policy.type === 'event' ? 'success' : 'warning'"
                  size="small"
                >
                  {{ policy.type }}
                </el-tag>
                <el-switch 
                  v-model="policy.enabled"
                  @change="togglePolicy(policy)"
                />
              </div>
              <div class="policy-name">{{ policy.name }}</div>
              <div class="policy-value">{{ policy.value }}</div>
            </div>
          </div>
        </el-card>

        <!-- 资源监控 -->
        <el-card shadow="hover" class="resource-card" style="margin-top: 20px">
          <template #header>
            <span>资源使用监控</span>
          </template>
          
          <div class="resource-monitor">
            <div class="monitor-item">
              <div class="monitor-label">CPU 使用率</div>
              <el-progress 
                type="dashboard" 
                :percentage="resourceUsage.cpu"
                :color="resourceUsage.cpu > 80 ? '#F56C6C' : '#67C23A'"
              />
            </div>
            <div class="monitor-item">
              <div class="monitor-label">内存使用率</div>
              <el-progress 
                type="dashboard" 
                :percentage="resourceUsage.memory"
                :color="resourceUsage.memory > 80 ? '#F56C6C' : '#67C23A'"
              />
            </div>
          </div>

          <el-alert
            v-if="resourceUsage.cpu > 80 || resourceUsage.memory > 80"
            title="资源使用率较高"
            type="warning"
            description="建议优化任务调度或增加资源配额"
            :closable="false"
            style="margin-top: 15px"
          />

          <el-alert
            v-else
            title="资源使用正常"
            type="success"
            description="当前资源利用率良好"
            :closable="false"
            style="margin-top: 15px"
          />
        </el-card>

        <!-- 调度效果 -->
        <el-card shadow="hover" style="margin-top: 20px">
          <template #header>
            <span>调度效果分析</span>
          </template>
          
          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item label="平均完成率">
              {{ statistics.completionRate }}%
            </el-descriptions-item>
            <el-descriptions-item label="准时完成">
              {{ statistics.completed }} / {{ statistics.total }}
            </el-descriptions-item>
            <el-descriptions-item label="延迟任务">
              {{ statistics.failed }}
            </el-descriptions-item>
            <el-descriptions-item label="资源利用率">
              优秀
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.task-scheduling {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.statistics {
  margin-bottom: 20px;
}

.main-content {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

// 任务列表样式
.task-list-card {
  height: calc(100vh - 220px);
  
  :deep(.el-card__body) {
    height: calc(100% - 60px);
    overflow-y: auto;
  }
}

.task-list {
  .task-item {
    padding: 15px;
    margin-bottom: 12px;
    background: #f9fafc;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      background: #ecf5ff;
      border-color: #409EFF;
      transform: translateX(4px);
    }

    &.selected {
      background: #ecf5ff;
      border-color: #409EFF;
      box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
    }
  }

  .task-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .task-title {
    display: flex;
    align-items: center;
    flex: 1;
  }

  .task-name {
    font-weight: 500;
    font-size: 14px;
  }

  .task-info {
    margin-bottom: 10px;
    font-size: 12px;
    color: #606266;

    .info-item {
      margin-bottom: 4px;

      .label {
        color: #909399;
        margin-right: 4px;
      }

      .dependency-text {
        font-size: 11px;
        color: #409EFF;
      }
    }
  }

  .task-actions {
    margin-top: 10px;
    display: flex;
    gap: 8px;
  }
}

// 时间线样式
.timeline-card {
  height: calc(100vh - 220px);
  
  :deep(.el-card__body) {
    height: calc(100% - 60px);
    overflow-y: auto;
  }
}

.timeline-task {
  .timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;

    h4 {
      margin: 0;
      font-size: 14px;
    }
  }

  .timeline-time {
    margin: 6px 0;
    font-size: 12px;
    color: #606266;
  }

  .timeline-deps {
    margin: 6px 0;
    font-size: 12px;
    color: #409EFF;
  }

  .timeline-resources {
    margin-top: 10px;

    .resource-item {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      font-size: 12px;

      span {
        min-width: 40px;
      }
    }
  }
}

// 策略配置样式
.policy-card {
  :deep(.el-card__body) {
    padding: 15px;
  }
}

.policy-list {
  .policy-item {
    padding: 12px;
    margin-bottom: 10px;
    background: #f9fafc;
    border-radius: 6px;
    border: 1px solid #e4e7ed;

    .policy-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .policy-name {
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 4px;
      color: #303133;
    }

    .policy-value {
      font-size: 12px;
      color: #909399;
    }
  }
}

// 资源监控样式
.resource-card {
  :deep(.el-card__body) {
    padding: 15px;
  }
}

.resource-monitor {
  display: flex;
  justify-content: space-around;
  margin-bottom: 15px;

  .monitor-item {
    text-align: center;

    .monitor-label {
      font-size: 12px;
      color: #606266;
      margin-bottom: 10px;
    }
  }
}
</style>