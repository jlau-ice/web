<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'

// 定义类型
interface Device {
  id: string
  name: string
  type: string
  status: 'healthy' | 'warning' | 'error' | 'offline'
  health: number
  cpu: number
  memory: number
  gpu: number
  ip: string
  location: string
  models: string[]
  lastUpdate: string
}

interface ComputeTask {
  id: string
  name: string
  deviceId: string
  deviceName: string
  priority: 'high' | 'medium' | 'low'
  cpu: number
  memory: number
  gpu: number
  status: 'running' | 'pending' | 'completed' | 'failed'
  progress: number
}

interface ModelDeployment {
  id: string
  modelName: string
  version: string
  targetDevices: string[]
  deployType: 'full' | 'gray'
  status: 'deploying' | 'success' | 'failed' | 'rollback'
  progress: number
  startTime: string
  endTime?: string
}

interface MaintenanceTask {
  id: string
  type: 'inspection' | 'maintenance' | 'upgrade'
  deviceIds: string[]
  schedule: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  executor: string
  result?: string
  createTime: string
}

interface PerformanceMetric {
  deviceId: string
  deviceName: string
  avgCpu: number
  avgMemory: number
  avgGpu: number
  throughput: number
  latency: number
  errorRate: number
  score: number
  suggestions: string[]
}

// 响应式数据
const loading = ref(false)
const activeTab = ref('cluster')

// 设备集群数据
const devices = ref<Device[]>([])
const selectedDevice = ref<Device | null>(null)

// 集群统计
const clusterStats = reactive({
  totalDevices: 0,
  onlineDevices: 0,
  healthyDevices: 0,
  warningDevices: 0,
  errorDevices: 0,
  avgCpu: 0,
  avgMemory: 0,
  avgGpu: 0,
  totalTasks: 0
})

// 算力调度
const computeTasks = ref<ComputeTask[]>([])
const scheduleDialogVisible = ref(false)
const scheduleForm = reactive({
  taskName: '',
  deviceId: '',
  priority: 'medium' as 'high' | 'medium' | 'low',
  cpu: 50,
  memory: 50,
  gpu: 50
})

// 模型部署
const deployments = ref<ModelDeployment[]>([])
const deployDialogVisible = ref(false)
const deployForm = reactive({
  modelName: '',
  version: '',
  targetDevices: [] as string[],
  deployType: 'full' as 'full' | 'gray'
})

// 运维任务
const maintenanceTasks = ref<MaintenanceTask[]>([])
const taskDialogVisible = ref(false)
const taskForm = reactive({
  type: 'inspection' as 'inspection' | 'maintenance' | 'upgrade',
  deviceIds: [] as string[],
  schedule: '',
  executor: ''
})

// 性能分析
const performanceMetrics = ref<PerformanceMetric[]>([])
const selectedMetric = ref<PerformanceMetric | null>(null)

// 计算属性
const deviceStatusCount = computed(() => {
  const counts = { healthy: 0, warning: 0, error: 0, offline: 0 }
  devices.value.forEach(d => counts[d.status]++)
  return counts
})

const computeLoadLevel = (value: number) => {
  if (value < 30) return { level: 'idle', color: 'success', text: '空闲' }
  if (value < 60) return { level: 'normal', color: 'primary', text: '正常' }
  if (value < 80) return { level: 'high', color: 'warning', text: '较高' }
  return { level: 'overload', color: 'danger', text: '过载' }
}

const getStatusType = (status: string) => {
  const map: Record<string, any> = {
    healthy: 'success',
    warning: 'warning',
    error: 'danger',
    offline: 'info',
    running: 'primary',
    pending: 'info',
    completed: 'success',
    failed: 'danger',
    deploying: 'primary',
    success: 'success',
    rollback: 'warning'
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    healthy: '健康',
    warning: '预警',
    error: '异常',
    offline: '离线',
    running: '运行中',
    pending: '待处理',
    completed: '已完成',
    failed: '失败',
    deploying: '部署中',
    success: '成功',
    rollback: '已回滚',
    inspection: '巡检',
    maintenance: '维护',
    upgrade: '升级',
    full: '全量部署',
    gray: '灰度发布',
    high: '高',
    medium: '中',
    low: '低'
  }
  return map[status] || status
}

// 加载模拟数据
const loadMockData = () => {
  loading.value = true
  
  setTimeout(() => {
    // 生成设备数据
    devices.value = Array.from({ length: 12 }, (_, i) => {
      const statuses: Array<'healthy' | 'warning' | 'error' | 'offline'> = ['healthy', 'warning', 'error', 'offline']
      const status = i < 7 ? 'healthy' : i < 9 ? 'warning' : i < 11 ? 'error' : 'offline'
      const health = status === 'healthy' ? 85 + Math.random() * 15 
                   : status === 'warning' ? 60 + Math.random() * 25
                   : status === 'error' ? 30 + Math.random() * 30
                   : 0
      
      return {
        id: `device-${i + 1}`,
        name: `边缘设备-${String(i + 1).padStart(2, '0')}`,
        type: ['边缘计算节点', '边缘网关', '边缘服务器'][i % 3],
        status,
        health: Math.round(health),
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        gpu: Math.random() * 100,
        ip: `192.168.${Math.floor(i / 10)}.${10 + i}`,
        location: ['北京', '上海', '深圳', '杭州'][i % 4],
        models: [`模型-A-v1.${i}`, `模型-B-v2.${i}`],
        lastUpdate: new Date(Date.now() - Math.random() * 3600000).toLocaleString()
      }
    })

    // 生成算力任务
    computeTasks.value = Array.from({ length: 8 }, (_, i) => ({
      id: `task-${i + 1}`,
      name: `计算任务-${i + 1}`,
      deviceId: `device-${(i % 12) + 1}`,
      deviceName: `边缘设备-${String((i % 12) + 1).padStart(2, '0')}`,
      priority: ['high', 'medium', 'low'][i % 3] as 'high' | 'medium' | 'low',
      cpu: 20 + Math.random() * 60,
      memory: 30 + Math.random() * 50,
      gpu: 40 + Math.random() * 50,
      status: ['running', 'pending', 'completed'][i % 3] as 'running' | 'pending' | 'completed',
      progress: i % 3 === 0 ? Math.random() * 100 : i % 3 === 1 ? 0 : 100
    }))

    // 生成模型部署
    deployments.value = Array.from({ length: 6 }, (_, i) => ({
      id: `deploy-${i + 1}`,
      modelName: `AI模型-${String.fromCharCode(65 + i)}`,
      version: `v2.${i + 1}.0`,
      targetDevices: [`device-${i + 1}`, `device-${i + 2}`],
      deployType: i % 2 === 0 ? 'full' as const : 'gray' as const,
      status: ['deploying', 'success', 'failed'][i % 3] as 'deploying' | 'success' | 'failed',
      progress: i % 3 === 0 ? 30 + Math.random() * 50 : i % 3 === 1 ? 100 : 45,
      startTime: new Date(Date.now() - Math.random() * 7200000).toLocaleString(),
      endTime: i % 3 === 1 ? new Date(Date.now() - Math.random() * 3600000).toLocaleString() : undefined
    }))

    // 生成运维任务
    maintenanceTasks.value = Array.from({ length: 5 }, (_, i) => ({
      id: `maint-${i + 1}`,
      type: ['inspection', 'maintenance', 'upgrade'][i % 3] as 'inspection' | 'maintenance' | 'upgrade',
      deviceIds: [`device-${i + 1}`, `device-${i + 2}`],
      schedule: new Date(Date.now() + i * 86400000).toLocaleDateString(),
      status: ['pending', 'running', 'completed'][i % 3] as 'pending' | 'running' | 'completed',
      executor: `运维人员-${i + 1}`,
      result: i % 3 === 2 ? '任务执行成功，所有检查项通过' : undefined,
      createTime: new Date(Date.now() - Math.random() * 86400000).toLocaleString()
    }))

    // 生成性能指标
    performanceMetrics.value = devices.value.slice(0, 8).map(device => {
      const avgCpu = 40 + Math.random() * 40
      const avgMemory = 50 + Math.random() * 30
      const avgGpu = 30 + Math.random() * 50
      const errorRate = Math.random() * 5
      const score = 100 - (avgCpu * 0.3 + avgMemory * 0.3 + avgGpu * 0.2 + errorRate * 5)
      
      const suggestions = []
      if (avgCpu > 70) suggestions.push('CPU使用率较高，建议优化算法或增加算力')
      if (avgMemory > 75) suggestions.push('内存使用率偏高，建议清理缓存或扩容')
      if (avgGpu > 80) suggestions.push('GPU负载过重，考虑任务分流')
      if (errorRate > 2) suggestions.push('错误率偏高，需检查设备状态和网络连接')
      if (suggestions.length === 0) suggestions.push('设备运行状态良好')
      
      return {
        deviceId: device.id,
        deviceName: device.name,
        avgCpu: Math.round(avgCpu),
        avgMemory: Math.round(avgMemory),
        avgGpu: Math.round(avgGpu),
        throughput: Math.round(1000 + Math.random() * 4000),
        latency: Math.round(10 + Math.random() * 90),
        errorRate: Math.round(errorRate * 100) / 100,
        score: Math.round(score),
        suggestions
      }
    })

    // 计算统计数据
    clusterStats.totalDevices = devices.value.length
    clusterStats.onlineDevices = devices.value.filter(d => d.status !== 'offline').length
    clusterStats.healthyDevices = devices.value.filter(d => d.status === 'healthy').length
    clusterStats.warningDevices = devices.value.filter(d => d.status === 'warning').length
    clusterStats.errorDevices = devices.value.filter(d => d.status === 'error').length
    clusterStats.avgCpu = Math.round(devices.value.reduce((sum, d) => sum + d.cpu, 0) / devices.value.length)
    clusterStats.avgMemory = Math.round(devices.value.reduce((sum, d) => sum + d.memory, 0) / devices.value.length)
    clusterStats.avgGpu = Math.round(devices.value.reduce((sum, d) => sum + d.gpu, 0) / devices.value.length)
    clusterStats.totalTasks = computeTasks.value.length

    loading.value = false
    ElMessage.success('数据加载成功')
  }, 800)
}

// 设备操作
const handleDeviceClick = (device: Device) => {
  selectedDevice.value = device
  ElMessage.info(`已选择设备: ${device.name}`)
}

const handleDeviceRestart = (device: Device) => {
  ElMessageBox.confirm(`确定要重启设备 ${device.name} 吗?`, '设备重启', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('设备重启命令已发送')
  }).catch(() => {})
}

// 算力调度
const handleScheduleTask = () => {
  scheduleDialogVisible.value = true
  Object.assign(scheduleForm, {
    taskName: '',
    deviceId: '',
    priority: 'medium',
    cpu: 50,
    memory: 50,
    gpu: 50
  })
}

const submitScheduleTask = () => {
  if (!scheduleForm.taskName || !scheduleForm.deviceId) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  const device = devices.value.find(d => d.id === scheduleForm.deviceId)
  computeTasks.value.unshift({
    id: `task-${Date.now()}`,
    name: scheduleForm.taskName,
    deviceId: scheduleForm.deviceId,
    deviceName: device?.name || '',
    priority: scheduleForm.priority,
    cpu: scheduleForm.cpu,
    memory: scheduleForm.memory,
    gpu: scheduleForm.gpu,
    status: 'pending',
    progress: 0
  })
  
  scheduleDialogVisible.value = false
  ElMessage.success('算力调度任务已创建')
}

const handleAdjustCompute = (task: ComputeTask) => {
  ElMessage.info(`调整任务 ${task.name} 的算力分配`)
}

// 模型部署
const handleDeployModel = () => {
  deployDialogVisible.value = true
  Object.assign(deployForm, {
    modelName: '',
    version: '',
    targetDevices: [],
    deployType: 'full'
  })
}

const submitDeployModel = () => {
  if (!deployForm.modelName || !deployForm.version || deployForm.targetDevices.length === 0) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  deployments.value.unshift({
    id: `deploy-${Date.now()}`,
    modelName: deployForm.modelName,
    version: deployForm.version,
    targetDevices: [...deployForm.targetDevices],
    deployType: deployForm.deployType,
    status: 'deploying',
    progress: 0,
    startTime: new Date().toLocaleString()
  })
  
  deployDialogVisible.value = false
  ElMessage.success('模型部署任务已创建')
}

const handleRollback = (deployment: ModelDeployment) => {
  ElMessageBox.confirm(`确定要回滚 ${deployment.modelName} 的部署吗?`, '模型回滚', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    deployment.status = 'rollback'
    ElMessage.success('模型回滚成功')
  }).catch(() => {})
}

// 运维任务
const handleCreateTask = () => {
  taskDialogVisible.value = true
  Object.assign(taskForm, {
    type: 'inspection',
    deviceIds: [],
    schedule: '',
    executor: ''
  })
}

const submitMaintenanceTask = () => {
  if (!taskForm.schedule || !taskForm.executor || taskForm.deviceIds.length === 0) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  maintenanceTasks.value.unshift({
    id: `maint-${Date.now()}`,
    type: taskForm.type,
    deviceIds: [...taskForm.deviceIds],
    schedule: taskForm.schedule,
    status: 'pending',
    executor: taskForm.executor,
    createTime: new Date().toLocaleString()
  })
  
  taskDialogVisible.value = false
  ElMessage.success('运维任务已创建')
}

const handleExecuteTask = (task: MaintenanceTask) => {
  task.status = 'running'
  ElMessage.success('运维任务开始执行')
}

// 性能分析
const handleViewDetail = (metric: PerformanceMetric) => {
  selectedMetric.value = metric
  ElMessage.info(`查看 ${metric.deviceName} 的详细性能分析`)
}

const handleOptimize = (metric: PerformanceMetric) => {
  ElMessageBox.confirm('确定要应用系统推荐的优化配置吗?', '性能优化', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(() => {
    ElMessage.success('优化配置已应用，预计15分钟后生效')
  }).catch(() => {})
}

// 刷新数据
const handleRefresh = () => {
  loadMockData()
}

// 生命周期
onMounted(() => {
  loadMockData()
})
</script>

<template>
  <div class="edge-ops-container">
    <!-- 顶部统计面板 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="设备总数" :value="clusterStats.totalDevices">
            <template #suffix>台</template>
          </el-statistic>
          <div class="stat-detail">
            <span class="stat-item success">在线: {{ clusterStats.onlineDevices }}</span>
            <span class="stat-item danger">离线: {{ clusterStats.totalDevices - clusterStats.onlineDevices }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="设备健康度" :value="clusterStats.healthyDevices">
            <template #suffix>/ {{ clusterStats.totalDevices }}</template>
          </el-statistic>
          <div class="stat-detail">
            <span class="stat-item warning">预警: {{ clusterStats.warningDevices }}</span>
            <span class="stat-item danger">异常: {{ clusterStats.errorDevices }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="平均CPU使用率" :value="clusterStats.avgCpu" :precision="0">
            <template #suffix>%</template>
          </el-statistic>
          <el-progress :percentage="clusterStats.avgCpu" :color="computeLoadLevel(clusterStats.avgCpu).color" :show-text="false" style="margin-top: 8px;" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="运行任务数" :value="clusterStats.totalTasks">
            <template #suffix>个</template>
          </el-statistic>
          <div class="stat-detail">
            <span class="stat-item primary">运行中: {{ computeTasks.filter(t => t.status === 'running').length }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 主内容区 -->
    <el-row :gutter="16" class="main-content">
      <!-- 左侧：设备集群拓扑 -->
      <el-col :span="8">
        <el-card shadow="always" class="section-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">设备集群拓扑</span>
              <el-button size="small" @click="handleRefresh">刷新</el-button>
            </div>
          </template>
          
          <div class="device-topology" v-loading="loading">
            <div class="device-grid">
              <div 
                v-for="device in devices" 
                :key="device.id"
                class="device-node"
                :class="[device.status, { selected: selectedDevice?.id === device.id }]"
                @click="handleDeviceClick(device)"
              >
                <div class="device-icon">
                  <i class="el-icon-monitor"></i>
                </div>
                <div class="device-info">
                  <div class="device-name">{{ device.name }}</div>
                  <div class="device-type">{{ device.type }}</div>
                  <el-tag :type="getStatusType(device.status)" size="small">
                    {{ getStatusText(device.status) }}
                  </el-tag>
                </div>
                <div class="device-health">
                  <el-progress 
                    type="circle" 
                    :percentage="device.health" 
                    :width="50"
                    :color="device.status === 'healthy' ? '#67c23a' : device.status === 'warning' ? '#e6a23c' : '#f56c6c'"
                  />
                </div>
              </div>
            </div>

            <!-- 设备详情 -->
            <el-card v-if="selectedDevice" shadow="never" class="device-detail">
              <template #header>
                <span>{{ selectedDevice.name }} 详细信息</span>
              </template>
              <el-descriptions :column="2" size="small" border>
                <el-descriptions-item label="设备类型">{{ selectedDevice.type }}</el-descriptions-item>
                <el-descriptions-item label="IP地址">{{ selectedDevice.ip }}</el-descriptions-item>
                <el-descriptions-item label="位置">{{ selectedDevice.location }}</el-descriptions-item>
                <el-descriptions-item label="健康度">{{ selectedDevice.health }}%</el-descriptions-item>
                <el-descriptions-item label="CPU">
                  <el-progress :percentage="Math.round(selectedDevice.cpu)" :color="computeLoadLevel(selectedDevice.cpu).color" />
                </el-descriptions-item>
                <el-descriptions-item label="内存">
                  <el-progress :percentage="Math.round(selectedDevice.memory)" :color="computeLoadLevel(selectedDevice.memory).color" />
                </el-descriptions-item>
                <el-descriptions-item label="GPU" :span="2">
                  <el-progress :percentage="Math.round(selectedDevice.gpu)" :color="computeLoadLevel(selectedDevice.gpu).color" />
                </el-descriptions-item>
                <el-descriptions-item label="部署模型" :span="2">
                  <el-tag v-for="model in selectedDevice.models" :key="model" size="small" style="margin-right: 5px;">
                    {{ model }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="最后更新" :span="2">{{ selectedDevice.lastUpdate }}</el-descriptions-item>
              </el-descriptions>
              <div style="margin-top: 10px; text-align: right;">
                <el-button size="small" type="primary" @click="handleDeviceRestart(selectedDevice)">重启设备</el-button>
              </div>
            </el-card>
          </div>
        </el-card>
      </el-col>

      <!-- 中间：监控指标面板 -->
      <el-col :span="10">
        <el-card shadow="always" class="section-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">运维管理中心</span>
            </div>
          </template>

          <el-tabs v-model="activeTab" class="ops-tabs">
            <!-- 算力资源调度 -->
            <el-tab-pane label="算力调度" name="cluster">
              <div class="tab-actions">
                <el-button type="primary" size="small" @click="handleScheduleTask">创建调度任务</el-button>
              </div>
              
              <el-table :data="computeTasks" style="width: 100%" max-height="450">
                <el-table-column prop="name" label="任务名称" width="140" />
                <el-table-column prop="deviceName" label="目标设备" width="130" />
                <el-table-column label="优先级" width="80">
                  <template #default="{ row }">
                    <el-tag :type="row.priority === 'high' ? 'danger' : row.priority === 'medium' ? 'warning' : 'info'" size="small">
                      {{ getStatusText(row.priority) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="资源占用" width="180">
                  <template #default="{ row }">
                    <div style="font-size: 12px;">
                      <div>CPU: {{ Math.round(row.cpu) }}%</div>
                      <div>内存: {{ Math.round(row.memory) }}%</div>
                      <div>GPU: {{ Math.round(row.gpu) }}%</div>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="getStatusType(row.status)" size="small">
                      {{ getStatusText(row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="进度" width="120">
                  <template #default="{ row }">
                    <el-progress :percentage="Math.round(row.progress)" />
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="100">
                  <template #default="{ row }">
                    <el-button link type="primary" size="small" @click="handleAdjustCompute(row)">调整</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>

            <!-- 模型部署管理 -->
            <el-tab-pane label="模型部署" name="deploy">
              <div class="tab-actions">
                <el-button type="primary" size="small" @click="handleDeployModel">部署模型</el-button>
              </div>
              
              <el-table :data="deployments" style="width: 100%" max-height="450">
                <el-table-column prop="modelName" label="模型名称" width="130" />
                <el-table-column prop="version" label="版本" width="100" />
                <el-table-column label="部署类型" width="100">
                  <template #default="{ row }">
                    <el-tag :type="row.deployType === 'full' ? 'primary' : 'warning'" size="small">
                      {{ getStatusText(row.deployType) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="目标设备" width="100">
                  <template #default="{ row }">
                    {{ row.targetDevices.length }} 台
                  </template>
                </el-table-column>
                <el-table-column label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="getStatusType(row.status)" size="small">
                      {{ getStatusText(row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="进度" width="120">
                  <template #default="{ row }">
                    <el-progress :percentage="Math.round(row.progress)" />
                  </template>
                </el-table-column>
                <el-table-column prop="startTime" label="开始时间" width="150" show-overflow-tooltip />
                <el-table-column label="操作" width="100">
                  <template #default="{ row }">
                    <el-button v-if="row.status === 'success'" link type="warning" size="small" @click="handleRollback(row)">回滚</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>

            <!-- 运维任务管理 -->
            <el-tab-pane label="运维任务" name="maintenance">
              <div class="tab-actions">
                <el-button type="primary" size="small" @click="handleCreateTask">创建任务</el-button>
              </div>
              
              <el-table :data="maintenanceTasks" style="width: 100%" max-height="450">
                <el-table-column label="任务类型" width="100">
                  <template #default="{ row }">
                    <el-tag :type="row.type === 'inspection' ? 'primary' : row.type === 'maintenance' ? 'warning' : 'danger'" size="small">
                      {{ getStatusText(row.type) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="目标设备" width="100">
                  <template #default="{ row }">
                    {{ row.deviceIds.length }} 台
                  </template>
                </el-table-column>
                <el-table-column prop="schedule" label="计划时间" width="120" />
                <el-table-column prop="executor" label="执行人" width="120" />
                <el-table-column label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="getStatusType(row.status)" size="small">
                      {{ getStatusText(row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="result" label="结果" show-overflow-tooltip />
                <el-table-column prop="createTime" label="创建时间" width="150" show-overflow-tooltip />
                <el-table-column label="操作" width="100">
                  <template #default="{ row }">
                    <el-button v-if="row.status === 'pending'" link type="primary" size="small" @click="handleExecuteTask(row)">执行</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>

      <!-- 右侧：性能优化分析 -->
      <el-col :span="6">
        <el-card shadow="always" class="section-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">性能优化分析</span>
            </div>
          </template>

          <div class="performance-list">
            <el-card 
              v-for="metric in performanceMetrics" 
              :key="metric.deviceId"
              shadow="hover"
              class="performance-item"
            >
              <div class="perf-header">
                <span class="perf-name">{{ metric.deviceName }}</span>
                <el-tag :type="metric.score >= 80 ? 'success' : metric.score >= 60 ? 'warning' : 'danger'" size="small">
                  评分: {{ metric.score }}
                </el-tag>
              </div>
              
              <div class="perf-metrics">
                <div class="metric-row">
                  <span class="metric-label">CPU:</span>
                  <el-progress :percentage="metric.avgCpu" :color="computeLoadLevel(metric.avgCpu).color" :show-text="false" />
                  <span class="metric-value">{{ metric.avgCpu }}%</span>
                </div>
                <div class="metric-row">
                  <span class="metric-label">内存:</span>
                  <el-progress :percentage="metric.avgMemory" :color="computeLoadLevel(metric.avgMemory).color" :show-text="false" />
                  <span class="metric-value">{{ metric.avgMemory }}%</span>
                </div>
                <div class="metric-row">
                  <span class="metric-label">GPU:</span>
                  <el-progress :percentage="metric.avgGpu" :color="computeLoadLevel(metric.avgGpu).color" :show-text="false" />
                  <span class="metric-value">{{ metric.avgGpu }}%</span>
                </div>
              </div>

              <div class="perf-stats">
                <div class="stat-item-small">
                  <span class="label">吞吐量:</span>
                  <span class="value">{{ metric.throughput }}/s</span>
                </div>
                <div class="stat-item-small">
                  <span class="label">延迟:</span>
                  <span class="value">{{ metric.latency }}ms</span>
                </div>
                <div class="stat-item-small">
                  <span class="label">错误率:</span>
                  <span class="value" :class="{ 'error-high': metric.errorRate > 2 }">{{ metric.errorRate }}%</span>
                </div>
              </div>

              <el-alert 
                v-if="metric.suggestions.length > 0"
                :title="metric.suggestions[0]"
                type="info"
                :closable="false"
                style="margin-top: 10px; font-size: 12px;"
              />

              <div class="perf-actions">
                <el-button size="small" type="text" @click="handleViewDetail(metric)">详情</el-button>
                <el-button size="small" type="primary" @click="handleOptimize(metric)">优化</el-button>
              </div>
            </el-card>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 创建调度任务对话框 -->
    <el-dialog v-model="scheduleDialogVisible" title="创建算力调度任务" width="500px">
      <el-form :model="scheduleForm" label-width="100px">
        <el-form-item label="任务名称">
          <el-input v-model="scheduleForm.taskName" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="目标设备">
          <el-select v-model="scheduleForm.deviceId" placeholder="选择设备" style="width: 100%">
            <el-option 
              v-for="device in devices.filter(d => d.status !== 'offline')" 
              :key="device.id"
              :label="device.name"
              :value="device.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-radio-group v-model="scheduleForm.priority">
            <el-radio label="high">高</el-radio>
            <el-radio label="medium">中</el-radio>
            <el-radio label="low">低</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="CPU占用">
          <el-slider v-model="scheduleForm.cpu" :marks="{ 0: '0%', 50: '50%', 100: '100%' }" />
        </el-form-item>
        <el-form-item label="内存占用">
          <el-slider v-model="scheduleForm.memory" :marks="{ 0: '0%', 50: '50%', 100: '100%' }" />
        </el-form-item>
        <el-form-item label="GPU占用">
          <el-slider v-model="scheduleForm.gpu" :marks="{ 0: '0%', 50: '50%', 100: '100%' }" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="scheduleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitScheduleTask">确定</el-button>
      </template>
    </el-dialog>

    <!-- 部署模型对话框 -->
    <el-dialog v-model="deployDialogVisible" title="部署AI模型" width="500px">
      <el-form :model="deployForm" label-width="100px">
        <el-form-item label="模型名称">
          <el-input v-model="deployForm.modelName" placeholder="请输入模型名称" />
        </el-form-item>
        <el-form-item label="模型版本">
          <el-input v-model="deployForm.version" placeholder="如: v2.1.0" />
        </el-form-item>
        <el-form-item label="目标设备">
          <el-select v-model="deployForm.targetDevices" multiple placeholder="选择目标设备" style="width: 100%">
            <el-option 
              v-for="device in devices.filter(d => d.status !== 'offline')" 
              :key="device.id"
              :label="device.name"
              :value="device.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="部署方式">
          <el-radio-group v-model="deployForm.deployType">
            <el-radio label="full">全量部署</el-radio>
            <el-radio label="gray">灰度发布</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="deployDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitDeployModel">确定</el-button>
      </template>
    </el-dialog>

    <!-- 创建运维任务对话框 -->
    <el-dialog v-model="taskDialogVisible" title="创建运维任务" width="500px">
      <el-form :model="taskForm" label-width="100px">
        <el-form-item label="任务类型">
          <el-radio-group v-model="taskForm.type">
            <el-radio label="inspection">设备巡检</el-radio>
            <el-radio label="maintenance">设备维护</el-radio>
            <el-radio label="upgrade">系统升级</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="目标设备">
          <el-select v-model="taskForm.deviceIds" multiple placeholder="选择设备" style="width: 100%">
            <el-option 
              v-for="device in devices" 
              :key="device.id"
              :label="device.name"
              :value="device.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="计划时间">
          <el-input v-model="taskForm.schedule" type="date" placeholder="选择日期" />
        </el-form-item>
        <el-form-item label="执行人">
          <el-input v-model="taskForm.executor" placeholder="请输入执行人" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="taskDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitMaintenanceTask">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.edge-ops-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 120px);

  .stats-row {
    margin-bottom: 16px;

    .el-card {
      height: 100%;
      
      .stat-detail {
        margin-top: 12px;
        display: flex;
        gap: 12px;
        font-size: 13px;

        .stat-item {
          &.success { color: #67c23a; }
          &.warning { color: #e6a23c; }
          &.danger { color: #f56c6c; }
          &.primary { color: #409eff; }
        }
      }
    }
  }

  .main-content {
    .section-card {
      height: 700px;
      overflow: hidden;

      .el-card__body {
        height: calc(100% - 56px);
        overflow-y: auto;
      }
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .card-title {
        font-weight: bold;
        font-size: 16px;
      }
    }
  }

  // 设备拓扑样式
  .device-topology {
    .device-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 16px;

      .device-node {
        border: 2px solid #dcdfe6;
        border-radius: 8px;
        padding: 12px;
        cursor: pointer;
        transition: all 0.3s;
        background: #fff;
        display: flex;
        flex-direction: column;
        gap: 8px;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        &.selected {
          border-color: #409eff;
          background: #ecf5ff;
        }

        &.healthy {
          border-left: 4px solid #67c23a;
        }
        &.warning {
          border-left: 4px solid #e6a23c;
        }
        &.error {
          border-left: 4px solid #f56c6c;
        }
        &.offline {
          border-left: 4px solid #909399;
          opacity: 0.6;
        }

        .device-icon {
          text-align: center;
          font-size: 32px;
          color: #409eff;
        }

        .device-info {
          text-align: center;

          .device-name {
            font-weight: bold;
            margin-bottom: 4px;
          }

          .device-type {
            font-size: 12px;
            color: #909399;
            margin-bottom: 6px;
          }
        }

        .device-health {
          display: flex;
          justify-content: center;
        }
      }
    }

    .device-detail {
      margin-top: 16px;
    }
  }

  // 运维标签页样式
  .ops-tabs {
    .tab-actions {
      margin-bottom: 12px;
      text-align: right;
    }
  }

  // 性能分析样式
  .performance-list {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .performance-item {
      .perf-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        .perf-name {
          font-weight: bold;
        }
      }

      .perf-metrics {
        .metric-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;

          .metric-label {
            width: 50px;
            font-size: 12px;
            color: #606266;
          }

          .el-progress {
            flex: 1;
          }

          .metric-value {
            width: 50px;
            text-align: right;
            font-size: 12px;
            font-weight: bold;
          }
        }
      }

      .perf-stats {
        display: flex;
        justify-content: space-between;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #ebeef5;

        .stat-item-small {
          display: flex;
          flex-direction: column;
          font-size: 12px;

          .label {
            color: #909399;
            margin-bottom: 4px;
          }

          .value {
            font-weight: bold;
            color: #303133;

            &.error-high {
              color: #f56c6c;
            }
          }
        }
      }

      .perf-actions {
        margin-top: 12px;
        text-align: right;
      }
    }
  }
}
</style>