<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import {
  Monitor,
  VideoCamera,
  Position,
  Setting,
  DocumentCopy,
  Warning,
  SuccessFilled,
  CircleClose,
  Loading
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 设备状态类型
type DeviceStatus = 'online' | 'offline' | 'overload' | 'warning'
type LatencyLevel = 'excellent' | 'good' | 'fair' | 'poor'
type TaskStatus = 'running' | 'pending' | 'completed' | 'failed'
type ModelStatus = 'active' | 'inactive' | 'updating'

// 边缘设备接口
interface EdgeDevice {
  id: string
  name: string
  location: string
  status: DeviceStatus
  cpu: number
  memory: number
  storage: number
  network: number
  videoStreams: number
  lastUpdate: string
  ip: string
}

// 视频流接口
interface VideoStream {
  id: string
  deviceId: string
  name: string
  status: string
  fps: number
  resolution: string
  latency: number
  latencyLevel: LatencyLevel
}

// 任务接口
interface Task {
  id: string
  name: string
  deviceId: string
  priority: string
  status: TaskStatus
  progress: number
  startTime: string
  cpuUsage: number
  memoryUsage: number
}

// AI模型接口
interface AIModel {
  id: string
  name: string
  version: string
  deviceId: string
  status: ModelStatus
  accuracy: number
  avgInferenceTime: number
  deployTime: string
}

// 性能指标接口
interface PerformanceMetrics {
  totalStreams: number
  activeStreams: number
  avgLatency: number
  totalThroughput: number
  taskQueueLength: number
  avgProcessingTime: number
}

// 数据状态
const loading = ref(true)
const activeTab = ref('monitor')
const devices = ref<EdgeDevice[]>([])
const videoStreams = ref<VideoStream[]>([])
const tasks = ref<Task[]>([])
const models = ref<AIModel[]>([])
const performanceMetrics = ref<PerformanceMetrics>({
  totalStreams: 0,
  activeStreams: 0,
  avgLatency: 0,
  totalThroughput: 0,
  taskQueueLength: 0,
  avgProcessingTime: 0
})

// 选中的设备
const selectedDevice = ref<string>('')

// 定时器
let refreshTimer: number | null = null

// 配置表单
const configForm = reactive({
  frameRate: 25,
  resolution: '1920x1080',
  compressionRate: 80,
  bufferSize: 512,
  maxConcurrentTasks: 10,
  loadBalanceEnabled: true,
  autoScaleEnabled: true,
  alertThreshold: 80
})

// 获取设备状态标签类型
const getDeviceStatusType = (status: DeviceStatus) => {
  const map = {
    online: 'success',
    offline: 'info',
    overload: 'danger',
    warning: 'warning'
  }
  return map[status]
}

// 获取设备状态文本
const getDeviceStatusText = (status: DeviceStatus) => {
  const map = {
    online: '在线',
    offline: '离线',
    overload: '过载',
    warning: '异常'
  }
  return map[status]
}

// 获取设备状态颜色
const getDeviceStatusColor = (status: DeviceStatus) => {
  const map = {
    online: '#67c23a',
    offline: '#909399',
    overload: '#f56c6c',
    warning: '#e6a23c'
  }
  return map[status]
}

// 获取延迟等级类型
const getLatencyType = (level: LatencyLevel) => {
  const map = {
    excellent: 'success',
    good: 'primary',
    fair: 'warning',
    poor: 'danger'
  }
  return map[level]
}

// 获取延迟等级文本
const getLatencyText = (level: LatencyLevel) => {
  const map = {
    excellent: '优秀',
    good: '良好',
    fair: '一般',
    poor: '较差'
  }
  return map[level]
}

// 获取任务状态类型
const getTaskStatusType = (status: TaskStatus) => {
  const map = {
    running: 'success',
    pending: 'warning',
    completed: 'info',
    failed: 'danger'
  }
  return map[status]
}

// 获取任务状态文本
const getTaskStatusText = (status: TaskStatus) => {
  const map = {
    running: '运行中',
    pending: '等待中',
    completed: '已完成',
    failed: '失败'
  }
  return map[status]
}

// 获取模型状态类型
const getModelStatusType = (status: ModelStatus) => {
  const map = {
    active: 'success',
    inactive: 'info',
    updating: 'warning'
  }
  return map[status]
}

// 获取模型状态文本
const getModelStatusText = (status: ModelStatus) => {
  const map = {
    active: '活动',
    inactive: '未激活',
    updating: '更新中'
  }
  return map[status]
}

// Mock 数据生成
const mockDevices = (): EdgeDevice[] => {
  return [
    {
      id: 'device-001',
      name: '边缘节点-A区-01',
      location: 'A区1号摄像头',
      status: 'online',
      cpu: 45,
      memory: 62,
      storage: 38,
      network: 156,
      videoStreams: 4,
      lastUpdate: new Date().toLocaleString(),
      ip: '192.168.1.101'
    },
    {
      id: 'device-002',
      name: '边缘节点-A区-02',
      location: 'A区2号摄像头',
      status: 'online',
      cpu: 58,
      memory: 71,
      storage: 45,
      network: 203,
      videoStreams: 5,
      lastUpdate: new Date().toLocaleString(),
      ip: '192.168.1.102'
    },
    {
      id: 'device-003',
      name: '边缘节点-B区-01',
      location: 'B区1号摄像头',
      status: 'warning',
      cpu: 78,
      memory: 85,
      storage: 67,
      network: 289,
      videoStreams: 6,
      lastUpdate: new Date().toLocaleString(),
      ip: '192.168.1.103'
    },
    {
      id: 'device-004',
      name: '边缘节点-B区-02',
      location: 'B区2号摄像头',
      status: 'overload',
      cpu: 92,
      memory: 94,
      storage: 82,
      network: 412,
      videoStreams: 8,
      lastUpdate: new Date().toLocaleString(),
      ip: '192.168.1.104'
    },
    {
      id: 'device-005',
      name: '边缘节点-C区-01',
      location: 'C区1号摄像头',
      status: 'online',
      cpu: 35,
      memory: 48,
      storage: 29,
      network: 128,
      videoStreams: 3,
      lastUpdate: new Date().toLocaleString(),
      ip: '192.168.1.105'
    },
    {
      id: 'device-006',
      name: '边缘节点-C区-02',
      location: 'C区2号摄像头',
      status: 'offline',
      cpu: 0,
      memory: 0,
      storage: 0,
      network: 0,
      videoStreams: 0,
      lastUpdate: '10分钟前',
      ip: '192.168.1.106'
    }
  ]
}

const mockVideoStreams = (): VideoStream[] => {
  return [
    {
      id: 'stream-001',
      deviceId: 'device-001',
      name: 'A区1号-主视角',
      status: '正常',
      fps: 25,
      resolution: '1920x1080',
      latency: 45,
      latencyLevel: 'excellent'
    },
    {
      id: 'stream-002',
      deviceId: 'device-001',
      name: 'A区1号-辅视角',
      status: '正常',
      fps: 25,
      resolution: '1280x720',
      latency: 52,
      latencyLevel: 'excellent'
    },
    {
      id: 'stream-003',
      deviceId: 'device-002',
      name: 'A区2号-主视角',
      status: '正常',
      fps: 30,
      resolution: '1920x1080',
      latency: 78,
      latencyLevel: 'good'
    },
    {
      id: 'stream-004',
      deviceId: 'device-003',
      name: 'B区1号-主视角',
      status: '轻微延迟',
      fps: 24,
      resolution: '1920x1080',
      latency: 156,
      latencyLevel: 'fair'
    },
    {
      id: 'stream-005',
      deviceId: 'device-004',
      name: 'B区2号-主视角',
      status: '延迟严重',
      fps: 18,
      resolution: '1920x1080',
      latency: 328,
      latencyLevel: 'poor'
    },
    {
      id: 'stream-006',
      deviceId: 'device-005',
      name: 'C区1号-主视角',
      status: '正常',
      fps: 25,
      resolution: '1920x1080',
      latency: 38,
      latencyLevel: 'excellent'
    }
  ]
}

const mockTasks = (): Task[] => {
  return [
    {
      id: 'task-001',
      name: '人员识别-A区',
      deviceId: 'device-001',
      priority: '高',
      status: 'running',
      progress: 75,
      startTime: '10:23:15',
      cpuUsage: 45,
      memoryUsage: 512
    },
    {
      id: 'task-002',
      name: '车辆检测-A区',
      deviceId: 'device-002',
      priority: '中',
      status: 'running',
      progress: 62,
      startTime: '10:18:42',
      cpuUsage: 38,
      memoryUsage: 384
    },
    {
      id: 'task-003',
      name: '异常行为分析-B区',
      deviceId: 'device-003',
      priority: '高',
      status: 'running',
      progress: 88,
      startTime: '10:15:30',
      cpuUsage: 65,
      memoryUsage: 768
    },
    {
      id: 'task-004',
      name: '人流统计-B区',
      deviceId: 'device-004',
      priority: '低',
      status: 'pending',
      progress: 0,
      startTime: '-',
      cpuUsage: 0,
      memoryUsage: 0
    },
    {
      id: 'task-005',
      name: '物体追踪-C区',
      deviceId: 'device-005',
      priority: '中',
      status: 'running',
      progress: 45,
      startTime: '10:25:08',
      cpuUsage: 28,
      memoryUsage: 256
    }
  ]
}

const mockModels = (): AIModel[] => {
  return [
    {
      id: 'model-001',
      name: 'YOLOv8-人员检测',
      version: 'v1.2.3',
      deviceId: 'device-001',
      status: 'active',
      accuracy: 96.8,
      avgInferenceTime: 23,
      deployTime: '2025-10-28 09:15'
    },
    {
      id: 'model-002',
      name: 'RetinaNet-车辆识别',
      version: 'v2.0.1',
      deviceId: 'device-002',
      status: 'active',
      accuracy: 94.5,
      avgInferenceTime: 28,
      deployTime: '2025-10-27 14:30'
    },
    {
      id: 'model-003',
      name: 'LSTM-行为分析',
      version: 'v1.5.0',
      deviceId: 'device-003',
      status: 'active',
      accuracy: 89.2,
      avgInferenceTime: 45,
      deployTime: '2025-10-26 11:20'
    },
    {
      id: 'model-004',
      name: 'DeepSORT-目标追踪',
      version: 'v3.1.2',
      deviceId: 'device-005',
      status: 'active',
      accuracy: 92.1,
      avgInferenceTime: 18,
      deployTime: '2025-10-29 08:45'
    },
    {
      id: 'model-005',
      name: 'ResNet50-特征提取',
      version: 'v2.3.0',
      deviceId: 'device-004',
      status: 'updating',
      accuracy: 91.5,
      avgInferenceTime: 32,
      deployTime: '2025-10-25 16:00'
    }
  ]
}

const mockPerformanceMetrics = (): PerformanceMetrics => {
  return {
    totalStreams: 32,
    activeStreams: 28,
    avgLatency: 89,
    totalThroughput: 1856,
    taskQueueLength: 12,
    avgProcessingTime: 156
  }
}

// 加载数据
const loadData = () => {
  loading.value = true
  setTimeout(() => {
    devices.value = mockDevices()
    videoStreams.value = mockVideoStreams()
    tasks.value = mockTasks()
    models.value = mockModels()
    performanceMetrics.value = mockPerformanceMetrics()
    loading.value = false
  }, 800)
}

// 刷新数据（模拟实时更新）
const refreshData = () => {
  // 随机更新设备状态
  devices.value.forEach(device => {
    if (device.status !== 'offline') {
      device.cpu = Math.min(100, Math.max(20, device.cpu + (Math.random() - 0.5) * 10))
      device.memory = Math.min(100, Math.max(30, device.memory + (Math.random() - 0.5) * 8))
      device.network = Math.max(50, device.network + (Math.random() - 0.5) * 30)
      device.lastUpdate = new Date().toLocaleString()
    }
  })

  // 随机更新任务进度
  tasks.value.forEach(task => {
    if (task.status === 'running') {
      task.progress = Math.min(100, task.progress + Math.random() * 5)
      if (task.progress >= 100) {
        task.status = 'completed'
      }
    }
  })

  // 更新性能指标
  performanceMetrics.value.avgLatency = Math.max(50, performanceMetrics.value.avgLatency + (Math.random() - 0.5) * 20)
  performanceMetrics.value.totalThroughput = Math.max(1500, performanceMetrics.value.totalThroughput + (Math.random() - 0.5) * 100)
}

// 选择设备
const selectDevice = (deviceId: string) => {
  selectedDevice.value = deviceId
  ElMessage.success(`已选择设备: ${devices.value.find(d => d.id === deviceId)?.name}`)
}

// 重启设备
const restartDevice = (device: EdgeDevice) => {
  ElMessage.success(`正在重启设备: ${device.name}`)
}

// 查看设备详情
const viewDeviceDetail = (device: EdgeDevice) => {
  selectedDevice.value = device.id
  activeTab.value = 'monitor'
  ElMessage.info(`查看设备详情: ${device.name}`)
}

// 停止任务
const stopTask = (task: Task) => {
  ElMessage.warning(`正在停止任务: ${task.name}`)
  task.status = 'completed'
}

// 重新运行任务
const rerunTask = (task: Task) => {
  ElMessage.success(`正在重新运行任务: ${task.name}`)
  task.status = 'running'
  task.progress = 0
}

// 更新模型
const updateModel = (model: AIModel) => {
  ElMessage.success(`正在更新模型: ${model.name}`)
  model.status = 'updating'
}

// 激活/停用模型
const toggleModel = (model: AIModel) => {
  if (model.status === 'active') {
    model.status = 'inactive'
    ElMessage.info(`已停用模型: ${model.name}`)
  } else if (model.status === 'inactive') {
    model.status = 'active'
    ElMessage.success(`已激活模型: ${model.name}`)
  }
}

// 保存配置
const saveConfig = () => {
  ElMessage.success('配置已保存')
}

// 应用配置模板
const applyTemplate = () => {
  ElMessage.success('已应用配置模板')
}

// 导出配置
const exportConfig = () => {
  ElMessage.success('配置已导出')
}

// 组件挂载
onMounted(() => {
  loadData()
  // 每5秒刷新一次数据
  refreshTimer = window.setInterval(refreshData, 5000)
})

// 组件卸载
onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<template>
  <div class="edge-processing-container">
    <!-- 页面标题和操作栏 -->
    <div class="header-section">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">AI边缘计算处理</h2>
          <p class="text-sm text-gray-500 mt-1">实时监控边缘设备运行状态，管理视频流处理和AI模型部署</p>
        </div>
        <div class="flex gap-3">
          <el-button type="primary" :icon="Position">拓扑视图</el-button>
          <el-button :icon="DocumentCopy" @click="exportConfig">导出配置</el-button>
          <el-button :icon="Setting">系统设置</el-button>
        </div>
      </div>

      <!-- 关键指标展示 -->
      <el-row :gutter="16" class="metrics-row">
        <el-col :xs="12" :sm="8" :md="4">
          <el-card shadow="hover" class="metric-card">
            <el-statistic title="设备总数" :value="devices.length">
              <template #suffix>台</template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="8" :md="4">
          <el-card shadow="hover" class="metric-card">
            <el-statistic 
              title="在线设备" 
              :value="devices.filter(d => d.status === 'online').length"
              class="text-green-600"
            >
              <template #suffix>台</template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="8" :md="4">
          <el-card shadow="hover" class="metric-card">
            <el-statistic title="视频流总数" :value="performanceMetrics.totalStreams">
              <template #suffix>路</template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="8" :md="4">
          <el-card shadow="hover" class="metric-card">
            <el-statistic title="活动流" :value="performanceMetrics.activeStreams" class="text-blue-600">
              <template #suffix>路</template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="8" :md="4">
          <el-card shadow="hover" class="metric-card">
            <el-statistic title="平均延迟" :value="performanceMetrics.avgLatency" :precision="0">
              <template #suffix>ms</template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="8" :md="4">
          <el-card shadow="hover" class="metric-card">
            <el-statistic title="任务队列" :value="performanceMetrics.taskQueueLength">
              <template #suffix>个</template>
            </el-statistic>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 主要内容区域 -->
    <el-row :gutter="16" class="main-content">
      <!-- 左侧：设备监控 -->
      <el-col :xs="24" :lg="8" class="left-panel">
        <el-card shadow="always" class="panel-card">
          <template #header>
            <div class="card-header">
              <span class="flex items-center">
                <el-icon class="mr-2"><Monitor /></el-icon>
                边缘设备监控
              </span>
              <el-tag type="success" size="small">{{ devices.filter(d => d.status === 'online').length }} 在线</el-tag>
            </div>
          </template>

          <div v-loading="loading" class="device-list">
            <div 
              v-for="device in devices" 
              :key="device.id" 
              class="device-item"
              :class="{ 'selected': selectedDevice === device.id }"
              @click="selectDevice(device.id)"
            >
              <div class="device-header">
                <div class="flex items-center">
                  <div 
                    class="status-dot" 
                    :style="{ backgroundColor: getDeviceStatusColor(device.status) }"
                  ></div>
                  <div>
                    <div class="device-name">{{ device.name }}</div>
                    <div class="device-location">{{ device.location }}</div>
                  </div>
                </div>
                <el-tag :type="getDeviceStatusType(device.status)" size="small">
                  {{ getDeviceStatusText(device.status) }}
                </el-tag>
              </div>

              <div class="device-info">
                <div class="info-item">
                  <span class="label">IP地址:</span>
                  <span class="value">{{ device.ip }}</span>
                </div>
                <div class="info-item">
                  <span class="label">视频流:</span>
                  <span class="value">{{ device.videoStreams }} 路</span>
                </div>
                <div class="info-item">
                  <span class="label">更新时间:</span>
                  <span class="value">{{ device.lastUpdate }}</span>
                </div>
              </div>

              <div class="resource-metrics">
                <div class="metric-item">
                  <div class="flex justify-between mb-1">
                    <span class="text-xs">CPU</span>
                    <span class="text-xs font-semibold">{{ device.cpu.toFixed(0) }}%</span>
                  </div>
                  <el-progress 
                    :percentage="device.cpu" 
                    :stroke-width="6"
                    :color="device.cpu > 80 ? '#f56c6c' : device.cpu > 60 ? '#e6a23c' : '#67c23a'"
                    :show-text="false"
                  />
                </div>
                <div class="metric-item">
                  <div class="flex justify-between mb-1">
                    <span class="text-xs">内存</span>
                    <span class="text-xs font-semibold">{{ device.memory.toFixed(0) }}%</span>
                  </div>
                  <el-progress 
                    :percentage="device.memory" 
                    :stroke-width="6"
                    :color="device.memory > 80 ? '#f56c6c' : device.memory > 60 ? '#e6a23c' : '#67c23a'"
                    :show-text="false"
                  />
                </div>
              </div>

              <div class="device-actions">
                <el-button size="small" text @click.stop="viewDeviceDetail(device)">详情</el-button>
                <el-button size="small" text type="warning" @click.stop="restartDevice(device)">重启</el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 中间：实时处理看板 -->
      <el-col :xs="24" :lg="10" class="middle-panel">
        <el-card shadow="always" class="panel-card">
          <template #header>
            <div class="card-header">
              <span class="flex items-center">
                <el-icon class="mr-2"><VideoCamera /></el-icon>
                实时处理看板
              </span>
              <el-button size="small" type="primary" text>刷新</el-button>
            </div>
          </template>

          <div v-loading="loading">
            <!-- 性能告警 -->
            <div class="mb-4">
              <el-alert 
                v-if="devices.some(d => d.status === 'overload')"
                title="设备过载警告"
                type="error"
                description="检测到部分设备处于过载状态，请及时处理或调整任务分配"
                show-icon
                :closable="false"
              />
              <el-alert 
                v-else-if="devices.some(d => d.status === 'warning')"
                title="设备异常提醒"
                type="warning"
                description="部分设备资源使用率较高，建议关注设备运行状态"
                show-icon
                :closable="false"
              />
            </div>

            <!-- 视频流处理状态 -->
            <div class="section-title">视频流处理状态</div>
            <el-table :data="videoStreams" size="small" max-height="280" stripe>
              <el-table-column prop="name" label="视频流名称" min-width="140" />
              <el-table-column label="分辨率" width="100">
                <template #default="{ row }">
                  <span class="text-xs">{{ row.resolution }}</span>
                </template>
              </el-table-column>
              <el-table-column label="帧率" width="70" align="center">
                <template #default="{ row }">
                  <span class="text-xs">{{ row.fps }} fps</span>
                </template>
              </el-table-column>
              <el-table-column label="延迟" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="getLatencyType(row.latencyLevel)" size="small">
                    {{ row.latency }}ms
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="90">
                <template #default="{ row }">
                  <span class="text-xs">{{ row.status }}</span>
                </template>
              </el-table-column>
            </el-table>

            <!-- 处理性能统计 -->
            <div class="section-title mt-4">处理性能统计</div>
            <el-row :gutter="12">
              <el-col :span="12">
                <div class="stat-box">
                  <div class="stat-label">平均处理时间</div>
                  <div class="stat-value">{{ performanceMetrics.avgProcessingTime }} ms</div>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="stat-box">
                  <div class="stat-label">总吞吐量</div>
                  <div class="stat-value">{{ performanceMetrics.totalThroughput }} MB/s</div>
                </div>
              </el-col>
            </el-row>

            <!-- 任务队列状态 -->
            <div class="section-title mt-4">任务执行进度</div>
            <div class="task-progress-list">
              <div v-for="task in tasks.slice(0, 4)" :key="task.id" class="task-progress-item">
                <div class="flex justify-between mb-2">
                  <span class="text-sm font-medium">{{ task.name }}</span>
                  <el-tag :type="getTaskStatusType(task.status)" size="small">
                    {{ getTaskStatusText(task.status) }}
                  </el-tag>
                </div>
                <el-progress 
                  v-if="task.status !== 'pending'"
                  :percentage="task.progress" 
                  :stroke-width="8"
                  :color="task.status === 'completed' ? '#67c23a' : '#409eff'"
                />
                <div v-else class="text-xs text-gray-400">等待执行中...</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：任务管理和配置 -->
      <el-col :xs="24" :lg="6" class="right-panel">
        <!-- 任务调度管理 -->
        <el-card shadow="always" class="panel-card mb-4">
          <template #header>
            <div class="card-header">
              <span class="flex items-center text-sm">
                <el-icon class="mr-2"><Loading /></el-icon>
                任务调度
              </span>
            </div>
          </template>

          <div v-loading="loading" class="task-list">
            <div v-for="task in tasks" :key="task.id" class="task-item">
              <div class="flex justify-between items-start mb-2">
                <div class="flex-1">
                  <div class="text-sm font-medium">{{ task.name }}</div>
                  <div class="text-xs text-gray-500 mt-1">
                    <span>优先级: </span>
                    <el-tag 
                      :type="task.priority === '高' ? 'danger' : task.priority === '中' ? 'warning' : 'info'" 
                      size="small"
                    >
                      {{ task.priority }}
                    </el-tag>
                  </div>
                </div>
                <el-tag :type="getTaskStatusType(task.status)" size="small">
                  {{ getTaskStatusText(task.status) }}
                </el-tag>
              </div>
              
              <div class="text-xs text-gray-600 mb-2">
                <div>CPU: {{ task.cpuUsage }}% | 内存: {{ task.memoryUsage }}MB</div>
                <div v-if="task.startTime !== '-'">开始: {{ task.startTime }}</div>
              </div>

              <div class="flex gap-2">
                <el-button 
                  v-if="task.status === 'running'" 
                  size="small" 
                  type="warning" 
                  text
                  @click="stopTask(task)"
                >
                  停止
                </el-button>
                <el-button 
                  v-if="task.status === 'completed' || task.status === 'failed'" 
                  size="small" 
                  type="primary" 
                  text
                  @click="rerunTask(task)"
                >
                  重新运行
                </el-button>
              </div>
            </div>
          </div>
        </el-card>

        <!-- AI模型管理 -->
        <el-card shadow="always" class="panel-card mb-4">
          <template #header>
            <div class="card-header">
              <span class="flex items-center text-sm">
                <el-icon class="mr-2"><Setting /></el-icon>
                AI模型
              </span>
            </div>
          </template>

          <div v-loading="loading" class="model-list">
            <div v-for="model in models.slice(0, 3)" :key="model.id" class="model-item">
              <div class="flex justify-between items-start mb-2">
                <div class="flex-1">
                  <div class="text-sm font-medium">{{ model.name }}</div>
                  <div class="text-xs text-gray-500">{{ model.version }}</div>
                </div>
                <el-tag :type="getModelStatusType(model.status)" size="small">
                  {{ getModelStatusText(model.status) }}
                </el-tag>
              </div>
              
              <div class="text-xs text-gray-600 mb-2">
                <div>准确率: {{ model.accuracy }}%</div>
                <div>推理时间: {{ model.avgInferenceTime }}ms</div>
              </div>

              <div class="flex gap-2">
                <el-button size="small" type="primary" text @click="updateModel(model)">
                  更新
                </el-button>
                <el-button size="small" type="info" text @click="toggleModel(model)">
                  {{ model.status === 'active' ? '停用' : '激活' }}
                </el-button>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 性能优化配置 -->
        <el-card shadow="always" class="panel-card">
          <template #header>
            <div class="card-header">
              <span class="flex items-center text-sm">
                <el-icon class="mr-2"><Setting /></el-icon>
                性能配置
              </span>
            </div>
          </template>

          <div class="config-form">
            <div class="config-item">
              <label class="text-xs text-gray-600">帧率:</label>
              <el-input-number 
                v-model="configForm.frameRate" 
                :min="15" 
                :max="60" 
                size="small"
                class="w-full"
              />
            </div>
            
            <div class="config-item">
              <label class="text-xs text-gray-600">分辨率:</label>
              <el-select v-model="configForm.resolution" size="small" class="w-full">
                <el-option label="3840x2160" value="3840x2160" />
                <el-option label="1920x1080" value="1920x1080" />
                <el-option label="1280x720" value="1280x720" />
              </el-select>
            </div>

            <div class="config-item">
              <label class="text-xs text-gray-600">压缩率: {{ configForm.compressionRate }}%</label>
              <el-slider v-model="configForm.compressionRate" :min="50" :max="100" />
            </div>

            <div class="config-item">
              <label class="text-xs text-gray-600">最大并发:</label>
              <el-input-number 
                v-model="configForm.maxConcurrentTasks" 
                :min="1" 
                :max="20" 
                size="small"
                class="w-full"
              />
            </div>

            <div class="config-item">
              <el-checkbox v-model="configForm.loadBalanceEnabled">负载均衡</el-checkbox>
            </div>

            <div class="config-item">
              <el-checkbox v-model="configForm.autoScaleEnabled">自动扩缩容</el-checkbox>
            </div>

            <div class="flex gap-2 mt-4">
              <el-button type="primary" size="small" @click="saveConfig" class="flex-1">
                保存配置
              </el-button>
              <el-button size="small" @click="applyTemplate" class="flex-1">
                应用模板
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.edge-processing-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.header-section {
  margin-bottom: 20px;
}

.metrics-row {
  margin-top: 16px;
}

.metric-card {
  text-align: center;
  
  :deep(.el-card__body) {
    padding: 16px 12px;
  }
}

.main-content {
  margin-top: 16px;
}

.panel-card {
  height: 100%;
  
  :deep(.el-card__body) {
    padding: 16px;
    max-height: calc(100vh - 320px);
    overflow-y: auto;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

/* 设备列表样式 */
.device-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.device-item {
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  &.selected {
    border-color: #409eff;
    background-color: #ecf5ff;
  }
}

.device-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
  flex-shrink: 0;
}

.device-name {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
}

.device-location {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.device-info {
  margin-bottom: 12px;
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 4px;

  &:last-child {
    margin-bottom: 0;
  }

  .label {
    color: #909399;
  }

  .value {
    color: #606266;
    font-weight: 500;
  }
}

.resource-metrics {
  margin-bottom: 12px;
}

.metric-item {
  margin-bottom: 10px;

  &:last-child {
    margin-bottom: 0;
  }
}

.device-actions {
  display: flex;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #e4e7ed;
}

/* 实时处理看板样式 */
.section-title {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid #409eff;
}

.stat-box {
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  text-align: center;
  color: white;
}

.stat-label {
  font-size: 12px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
}

.task-progress-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-progress-item {
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 6px;
}

/* 任务列表样式 */
.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

/* 模型列表样式 */
.model-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.model-item {
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

/* 配置表单样式 */
.config-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.config-item {
  label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
  }
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .left-panel,
  .middle-panel,
  .right-panel {
    margin-bottom: 16px;
  }
}

/* 滚动条样式 */
:deep(.el-card__body)::-webkit-scrollbar {
  width: 6px;
}

:deep(.el-card__body)::-webkit-scrollbar-thumb {
  background-color: #dcdfe6;
  border-radius: 3px;
}

:deep(.el-card__body)::-webkit-scrollbar-thumb:hover {
  background-color: #c0c4cc;
}
</style>