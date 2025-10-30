<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage } from 'element-plus'

// 类型定义
interface Camera {
  id: string
  name: string
  location: string
  status: 'online' | 'offline' | 'warning' | 'error'
  streamQuality: 'smooth' | 'normal' | 'lag' | 'interrupted'
  aiEnabled: boolean
  confidence: number
  coverageArea: string
  resolution: string
  fps: number
  detections: Detection[]
}

interface Detection {
  type: string
  confidence: number
  position: { x: number; y: number }
  timestamp: string
}

interface MonitorArea {
  id: string
  name: string
  cameras: string[]
  priority: 'high' | 'medium' | 'low'
  coverageRate: number
  status: 'normal' | 'warning' | 'danger'
}

interface DeviceStatus {
  totalDevices: number
  onlineDevices: number
  offlineDevices: number
  warningDevices: number
  onlineRate: number
  maintenanceCount: number
}

interface SystemMetric {
  title: string
  value: number | string
  unit: string
  icon: string
  color: string
  status: 'normal' | 'warning' | 'danger'
}

interface ConfigItem {
  label: string
  value: number | boolean
  type: 'slider' | 'switch'
  min?: number
  max?: number
}

// 响应式数据
const loading = ref(true)
const cameras = ref<Camera[]>([])
const monitorAreas = ref<MonitorArea[]>([])
const selectedArea = ref<string>('all')
const selectedCamera = ref<Camera | null>(null)
const deviceStatus = ref<DeviceStatus>({
  totalDevices: 0,
  onlineDevices: 0,
  offlineDevices: 0,
  warningDevices: 0,
  onlineRate: 0,
  maintenanceCount: 0
})
const systemMetrics = ref<SystemMetric[]>([])
const videoLayout = ref<'1x1' | '2x2' | '3x3' | '4x4'>('2x2')
const fullscreenCamera = ref<Camera | null>(null)
const autoRefresh = ref(true)
const refreshInterval = ref<number | null>(null)

// 配置项
const aiConfig = ref<Record<string, ConfigItem>>({
  sensitivity: {
    label: 'AI检测灵敏度',
    value: 75,
    type: 'slider',
    min: 0,
    max: 100
  },
  confidenceThreshold: {
    label: '置信度阈值',
    value: 80,
    type: 'slider',
    min: 50,
    max: 100
  },
  autoRecord: {
    label: '自动录像',
    value: true,
    type: 'switch'
  },
  motionDetection: {
    label: '运动检测',
    value: true,
    type: 'switch'
  },
  nightMode: {
    label: '夜间模式',
    value: false,
    type: 'switch'
  }
})

// 计算属性
const filteredCameras = computed(() => {
  if (selectedArea.value === 'all') {
    return cameras.value
  }
  const area = monitorAreas.value.find(a => a.id === selectedArea.value)
  return cameras.value.filter(c => area?.cameras.includes(c.id))
})

const displayedCameras = computed(() => {
  if (fullscreenCamera.value) {
    return [fullscreenCamera.value]
  }
  const layoutMap = {
    '1x1': 1,
    '2x2': 4,
    '3x3': 9,
    '4x4': 16
  }
  return filteredCameras.value.slice(0, layoutMap[videoLayout.value])
})

const gridCols = computed(() => {
  const colMap = {
    '1x1': 1,
    '2x2': 2,
    '3x3': 3,
    '4x4': 4
  }
  return colMap[videoLayout.value]
})

// 获取状态配置
const getStatusConfig = (status: string) => {
  const configs: Record<string, { label: string; color: string; type: any }> = {
    online: { label: '在线', color: '#67C23A', type: 'success' },
    offline: { label: '离线', color: '#909399', type: 'info' },
    warning: { label: '预警', color: '#E6A23C', type: 'warning' },
    error: { label: '异常', color: '#F56C6C', type: 'danger' }
  }
  return configs[status] || configs.offline
}

const getQualityConfig = (quality: string) => {
  const configs: Record<string, { label: string; color: string; type: any }> = {
    smooth: { label: '流畅', color: '#67C23A', type: 'success' },
    normal: { label: '一般', color: '#409EFF', type: '' },
    lag: { label: '卡顿', color: '#E6A23C', type: 'warning' },
    interrupted: { label: '中断', color: '#F56C6C', type: 'danger' }
  }
  return configs[quality] || configs.interrupted
}

const getPriorityConfig = (priority: string) => {
  const configs: Record<string, { label: string; color: string }> = {
    high: { label: '高优先级', color: '#F56C6C' },
    medium: { label: '中优先级', color: '#E6A23C' },
    low: { label: '低优先级', color: '#409EFF' }
  }
  return configs[priority] || configs.low
}

// Mock 数据加载
const loadMockData = () => {
  loading.value = true

  setTimeout(() => {
    // 监控区域数据
    monitorAreas.value = [
      {
        id: 'area1',
        name: '主仓储区',
        cameras: ['CAM001', 'CAM002', 'CAM003'],
        priority: 'high',
        coverageRate: 95,
        status: 'normal'
      },
      {
        id: 'area2',
        name: '副仓储区',
        cameras: ['CAM004', 'CAM005'],
        priority: 'medium',
        coverageRate: 88,
        status: 'normal'
      },
      {
        id: 'area3',
        name: '货物通道A',
        cameras: ['CAM006', 'CAM007'],
        priority: 'high',
        coverageRate: 92,
        status: 'warning'
      },
      {
        id: 'area4',
        name: '货物通道B',
        cameras: ['CAM008'],
        priority: 'medium',
        coverageRate: 85,
        status: 'normal'
      },
      {
        id: 'area5',
        name: '装卸区域',
        cameras: ['CAM009', 'CAM010'],
        priority: 'high',
        coverageRate: 90,
        status: 'normal'
      },
      {
        id: 'area6',
        name: '办公区域',
        cameras: ['CAM011', 'CAM012'],
        priority: 'low',
        coverageRate: 75,
        status: 'normal'
      }
    ]

    // 摄像头数据
    cameras.value = [
      {
        id: 'CAM001',
        name: '主仓储-东北角',
        location: '主仓储区A1',
        status: 'online',
        streamQuality: 'smooth',
        aiEnabled: true,
        confidence: 95,
        coverageArea: '150㎡',
        resolution: '1920x1080',
        fps: 30,
        detections: [
          { type: '人员', confidence: 96, position: { x: 120, y: 80 }, timestamp: '14:35:21' },
          { type: '叉车', confidence: 92, position: { x: 200, y: 150 }, timestamp: '14:35:18' }
        ]
      },
      {
        id: 'CAM002',
        name: '主仓储-西北角',
        location: '主仓储区A2',
        status: 'online',
        streamQuality: 'smooth',
        aiEnabled: true,
        confidence: 93,
        coverageArea: '150㎡',
        resolution: '1920x1080',
        fps: 30,
        detections: [
          { type: '货物堆叠', confidence: 89, position: { x: 180, y: 120 }, timestamp: '14:35:20' }
        ]
      },
      {
        id: 'CAM003',
        name: '主仓储-南侧',
        location: '主仓储区A3',
        status: 'warning',
        streamQuality: 'normal',
        aiEnabled: true,
        confidence: 88,
        coverageArea: '180㎡',
        resolution: '1920x1080',
        fps: 25,
        detections: []
      },
      {
        id: 'CAM004',
        name: '副仓储-入口',
        location: '副仓储区B1',
        status: 'online',
        streamQuality: 'smooth',
        aiEnabled: true,
        confidence: 91,
        coverageArea: '120㎡',
        resolution: '1920x1080',
        fps: 30,
        detections: [
          { type: '人员', confidence: 94, position: { x: 160, y: 100 }, timestamp: '14:35:19' }
        ]
      },
      {
        id: 'CAM005',
        name: '副仓储-货架区',
        location: '副仓储区B2',
        status: 'online',
        streamQuality: 'smooth',
        aiEnabled: true,
        confidence: 90,
        coverageArea: '140㎡',
        resolution: '1920x1080',
        fps: 30,
        detections: []
      },
      {
        id: 'CAM006',
        name: '通道A-1段',
        location: '货物通道A-1',
        status: 'online',
        streamQuality: 'lag',
        aiEnabled: true,
        confidence: 85,
        coverageArea: '80㎡',
        resolution: '1280x720',
        fps: 20,
        detections: [
          { type: '叉车', confidence: 87, position: { x: 140, y: 90 }, timestamp: '14:35:15' }
        ]
      },
      {
        id: 'CAM007',
        name: '通道A-2段',
        location: '货物通道A-2',
        status: 'online',
        streamQuality: 'normal',
        aiEnabled: true,
        confidence: 86,
        coverageArea: '80㎡',
        resolution: '1920x1080',
        fps: 25,
        detections: []
      },
      {
        id: 'CAM008',
        name: '通道B-全景',
        location: '货物通道B',
        status: 'online',
        streamQuality: 'smooth',
        aiEnabled: true,
        confidence: 92,
        coverageArea: '160㎡',
        resolution: '1920x1080',
        fps: 30,
        detections: []
      },
      {
        id: 'CAM009',
        name: '装卸区-北侧',
        location: '装卸区域C1',
        status: 'online',
        streamQuality: 'smooth',
        aiEnabled: true,
        confidence: 94,
        coverageArea: '200㎡',
        resolution: '2560x1440',
        fps: 30,
        detections: [
          { type: '卡车', confidence: 95, position: { x: 220, y: 140 }, timestamp: '14:35:22' },
          { type: '人员', confidence: 93, position: { x: 180, y: 110 }, timestamp: '14:35:21' }
        ]
      },
      {
        id: 'CAM010',
        name: '装卸区-南侧',
        location: '装卸区域C2',
        status: 'online',
        streamQuality: 'smooth',
        aiEnabled: true,
        confidence: 91,
        coverageArea: '200㎡',
        resolution: '1920x1080',
        fps: 30,
        detections: []
      },
      {
        id: 'CAM011',
        name: '办公区-大厅',
        location: '办公区域D1',
        status: 'online',
        streamQuality: 'normal',
        aiEnabled: false,
        confidence: 0,
        coverageArea: '100㎡',
        resolution: '1280x720',
        fps: 25,
        detections: []
      },
      {
        id: 'CAM012',
        name: '办公区-走廊',
        location: '办公区域D2',
        status: 'offline',
        streamQuality: 'interrupted',
        aiEnabled: false,
        confidence: 0,
        coverageArea: '60㎡',
        resolution: '1280x720',
        fps: 0,
        detections: []
      }
    ]

    // 设备状态统计
    const onlineCount = cameras.value.filter(c => c.status === 'online').length
    const offlineCount = cameras.value.filter(c => c.status === 'offline').length
    const warningCount = cameras.value.filter(c => c.status === 'warning' || c.status === 'error').length

    deviceStatus.value = {
      totalDevices: cameras.value.length,
      onlineDevices: onlineCount,
      offlineDevices: offlineCount,
      warningDevices: warningCount,
      onlineRate: Math.round((onlineCount / cameras.value.length) * 100),
      maintenanceCount: 2
    }

    // 系统指标
    systemMetrics.value = [
      {
        title: '在线设备',
        value: onlineCount,
        unit: '台',
        icon: '📹',
        color: '#67C23A',
        status: 'normal'
      },
      {
        title: '在线率',
        value: deviceStatus.value.onlineRate,
        unit: '%',
        icon: '✅',
        color: '#67C23A',
        status: 'normal'
      },
      {
        title: 'AI分析',
        value: cameras.value.filter(c => c.aiEnabled).length,
        unit: '路',
        icon: '🤖',
        color: '#409EFF',
        status: 'normal'
      },
      {
        title: '实时检测',
        value: cameras.value.reduce((sum, c) => sum + c.detections.length, 0),
        unit: '项',
        icon: '🎯',
        color: '#E6A23C',
        status: 'warning'
      },
      {
        title: '覆盖率',
        value: 92,
        unit: '%',
        icon: '🗺️',
        color: '#67C23A',
        status: 'normal'
      },
      {
        title: '待维护',
        value: deviceStatus.value.maintenanceCount,
        unit: '台',
        icon: '🔧',
        color: '#E6A23C',
        status: 'warning'
      }
    ]

    loading.value = false
    ElMessage.success('监控数据加载成功')
  }, 1200)
}

// 切换监控区域
const switchArea = (areaId: string) => {
  selectedArea.value = areaId
  ElMessage.info(`切换到: ${areaId === 'all' ? '全部区域' : monitorAreas.value.find(a => a.id === areaId)?.name}`)
}

// 切换视频布局
const switchLayout = (layout: '1x1' | '2x2' | '3x3' | '4x4') => {
  videoLayout.value = layout
  fullscreenCamera.value = null
}

// 查看摄像头详情
const viewCameraDetail = (camera: Camera) => {
  selectedCamera.value = camera
  ElMessage.info(`查看摄像头: ${camera.name}`)
}

// 全屏查看
const viewFullscreen = (camera: Camera) => {
  fullscreenCamera.value = camera
  ElMessage.info(`全屏查看: ${camera.name}`)
}

// 退出全屏
const exitFullscreen = () => {
  fullscreenCamera.value = null
}

// 刷新监控数据
const refreshData = () => {
  ElMessage.info('刷新监控数据...')
  loadMockData()
}

// 自动刷新控制
const toggleAutoRefresh = (value: boolean) => {
  autoRefresh.value = value
  if (value) {
    startAutoRefresh()
    ElMessage.success('已开启自动刷新')
  } else {
    stopAutoRefresh()
    ElMessage.warning('已关闭自动刷新')
  }
}

const startAutoRefresh = () => {
  if (refreshInterval.value) return
  refreshInterval.value = window.setInterval(() => {
    // 模拟数据更新
    cameras.value.forEach(camera => {
      if (camera.status === 'online' && camera.aiEnabled) {
        camera.confidence = Math.round(85 + Math.random() * 15)
      }
    })
  }, 5000)
}

const stopAutoRefresh = () => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
}

// 配置更新
const updateConfig = (key: string, value: any) => {
  aiConfig.value[key].value = value
  ElMessage.success(`配置已更新: ${aiConfig.value[key].label}`)
}

// 导出监控配置
const exportConfig = () => {
  ElMessage.success('导出监控配置成功')
}

// 导入监控配置
const importConfig = () => {
  ElMessage.success('导入监控配置成功')
}

// 设备维护
const maintenanceDevice = (camera: Camera) => {
  ElMessage.warning(`提交维护申请: ${camera.name}`)
}

// 生命周期
onMounted(() => {
  loadMockData()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<template>
  <div class="real-time-monitor" v-loading="loading">
    <!-- 顶部：系统指标概览 -->
    <div class="metrics-overview">
      <el-row :gutter="12">
        <el-col :xs="12" :sm="8" :md="6" :lg="4" v-for="metric in systemMetrics" :key="metric.title">
          <el-card class="metric-card" shadow="hover">
            <div class="metric-icon">{{ metric.icon }}</div>
            <div class="metric-content">
              <div class="metric-title">{{ metric.title }}</div>
              <div class="metric-value">
                <span class="value">{{ metric.value }}</span>
                <span class="unit">{{ metric.unit }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 主要内容区 -->
    <div class="main-content">
      <el-row :gutter="16">
        <!-- 左侧：监控区域导航 -->
        <el-col :xs="24" :sm="24" :md="6" :lg="5">
          <el-card shadow="never" class="area-nav-card">
            <template #header>
              <div class="card-header">
                <span class="title">📍 监控区域</span>
              </div>
            </template>

            <div class="area-list">
              <div 
                class="area-item"
                :class="{ active: selectedArea === 'all' }"
                @click="switchArea('all')"
              >
                <div class="area-name">🏢 全部区域</div>
                <div class="area-info">
                  <el-tag size="small" type="info">{{ cameras.length }}台</el-tag>
                </div>
              </div>

              <el-divider style="margin: 12px 0;" />

              <div 
                v-for="area in monitorAreas" 
                :key="area.id"
                class="area-item"
                :class="{ active: selectedArea === area.id }"
                @click="switchArea(area.id)"
              >
                <div class="area-header">
                  <div class="area-name">{{ area.name }}</div>
                  <el-tag 
                    size="small" 
                    :type="area.status === 'normal' ? 'success' : area.status === 'warning' ? 'warning' : 'danger'"
                  >
                    {{ area.status === 'normal' ? '正常' : area.status === 'warning' ? '预警' : '异常' }}
                  </el-tag>
                </div>
                <div class="area-info">
                  <div class="info-item">
                    <span class="label">摄像头：</span>
                    <span>{{ area.cameras.length }}台</span>
                  </div>
                  <div class="info-item">
                    <span class="label">覆盖率：</span>
                    <el-progress 
                      :percentage="area.coverageRate" 
                      :stroke-width="6"
                      :show-text="false"
                      :color="area.coverageRate >= 90 ? '#67C23A' : area.coverageRate >= 80 ? '#409EFF' : '#E6A23C'"
                    />
                    <span class="percentage">{{ area.coverageRate }}%</span>
                  </div>
                  <div class="info-item">
                    <el-tag 
                      size="small" 
                      :color="getPriorityConfig(area.priority).color"
                      effect="dark"
                    >
                      {{ getPriorityConfig(area.priority).label }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 设备状态统计 -->
          <el-card shadow="never" class="device-status-card" style="margin-top: 16px;">
            <template #header>
              <div class="card-header">
                <span class="title">📊 设备状态</span>
              </div>
            </template>

            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="设备总数">
                <strong style="color: #409EFF;">{{ deviceStatus.totalDevices }}</strong> 台
              </el-descriptions-item>
              <el-descriptions-item label="在线设备">
                <strong style="color: #67C23A;">{{ deviceStatus.onlineDevices }}</strong> 台
              </el-descriptions-item>
              <el-descriptions-item label="离线设备">
                <strong style="color: #909399;">{{ deviceStatus.offlineDevices }}</strong> 台
              </el-descriptions-item>
              <el-descriptions-item label="预警设备">
                <strong style="color: #E6A23C;">{{ deviceStatus.warningDevices }}</strong> 台
              </el-descriptions-item>
              <el-descriptions-item label="在线率">
                <el-progress 
                  :percentage="deviceStatus.onlineRate"
                  :color="deviceStatus.onlineRate >= 90 ? '#67C23A' : deviceStatus.onlineRate >= 80 ? '#409EFF' : '#E6A23C'"
                />
              </el-descriptions-item>
              <el-descriptions-item label="待维护">
                <strong style="color: #E6A23C;">{{ deviceStatus.maintenanceCount }}</strong> 台
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>

        <!-- 中间：视频监控区 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card shadow="never" class="video-area-card">
            <template #header>
              <div class="card-header">
                <span class="title">📹 实时监控</span>
                <div class="header-actions">
                  <el-button-group>
                    <el-button 
                      size="small" 
                      :type="videoLayout === '1x1' ? 'primary' : ''"
                      @click="switchLayout('1x1')"
                    >
                      1x1
                    </el-button>
                    <el-button 
                      size="small" 
                      :type="videoLayout === '2x2' ? 'primary' : ''"
                      @click="switchLayout('2x2')"
                    >
                      2x2
                    </el-button>
                    <el-button 
                      size="small" 
                      :type="videoLayout === '3x3' ? 'primary' : ''"
                      @click="switchLayout('3x3')"
                    >
                      3x3
                    </el-button>
                    <el-button 
                      size="small" 
                      :type="videoLayout === '4x4' ? 'primary' : ''"
                      @click="switchLayout('4x4')"
                    >
                      4x4
                    </el-button>
                  </el-button-group>
                  <el-button size="small" @click="refreshData">刷新</el-button>
                  <el-button 
                    size="small" 
                    v-if="fullscreenCamera"
                    type="warning"
                    @click="exitFullscreen"
                  >
                    退出全屏
                  </el-button>
                </div>
              </div>
            </template>

            <div class="video-grid" :style="{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }">
              <div 
                v-for="camera in displayedCameras" 
                :key="camera.id"
                class="video-item"
                :class="{ 
                  'status-online': camera.status === 'online',
                  'status-offline': camera.status === 'offline',
                  'status-warning': camera.status === 'warning',
                  'status-error': camera.status === 'error'
                }"
                @click="viewCameraDetail(camera)"
              >
                <!-- 视频画面模拟 -->
                <div class="video-frame">
                  <div class="video-placeholder">
                    <div class="camera-icon">📹</div>
                    <div class="camera-id">{{ camera.id }}</div>
                  </div>

                  <!-- AI检测标注 -->
                  <div class="ai-detections" v-if="camera.aiEnabled && camera.detections.length > 0">
                    <div 
                      v-for="(detection, idx) in camera.detections" 
                      :key="idx"
                      class="detection-box"
                      :style="{
                        left: detection.position.x + 'px',
                        top: detection.position.y + 'px'
                      }"
                    >
                      <div class="detection-label">
                        {{ detection.type }} {{ detection.confidence }}%
                      </div>
                    </div>
                  </div>

                  <!-- 状态标签 -->
                  <div class="video-status">
                    <el-tag 
                      size="small" 
                      :type="getStatusConfig(camera.status).type"
                      effect="dark"
                    >
                      {{ getStatusConfig(camera.status).label }}
                    </el-tag>
                    <el-tag 
                      size="small" 
                      :type="getQualityConfig(camera.streamQuality).type"
                      effect="dark"
                      style="margin-left: 4px;"
                    >
                      {{ getQualityConfig(camera.streamQuality).label }}
                    </el-tag>
                  </div>

                  <!-- AI分析状态 -->
                  <div class="ai-status" v-if="camera.aiEnabled">
                    <el-tag size="small" type="success" effect="dark">
                      🤖 AI {{ camera.confidence }}%
                    </el-tag>
                  </div>

                  <!-- 操作按钮 -->
                  <div class="video-actions">
                    <el-button 
                      size="small" 
                      circle
                      @click.stop="viewFullscreen(camera)"
                      v-if="!fullscreenCamera"
                    >
                      🔍
                    </el-button>
                  </div>
                </div>

                <!-- 摄像头信息 -->
                <div class="camera-info">
                  <div class="camera-name">{{ camera.name }}</div>
                  <div class="camera-location">{{ camera.location }}</div>
                  <div class="camera-specs">
                    {{ camera.resolution }} | {{ camera.fps }}fps
                  </div>
                </div>
              </div>
            </div>

            <!-- 空状态 -->
            <el-empty 
              v-if="displayedCameras.length === 0"
              description="暂无监控画面"
            />
          </el-card>
        </el-col>

        <!-- 右侧：状态信息和配置面板 -->
        <el-col :xs="24" :sm="24" :md="6" :lg="7">
          <!-- 选中摄像头详情 -->
          <el-card shadow="never" class="camera-detail-card" v-if="selectedCamera">
            <template #header>
              <div class="card-header">
                <span class="title">📷 摄像头详情</span>
                <el-button size="small" text @click="selectedCamera = null">关闭</el-button>
              </div>
            </template>

            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="设备ID">{{ selectedCamera.id }}</el-descriptions-item>
              <el-descriptions-item label="名称">{{ selectedCamera.name }}</el-descriptions-item>
              <el-descriptions-item label="位置">{{ selectedCamera.location }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="getStatusConfig(selectedCamera.status).type" size="small">
                  {{ getStatusConfig(selectedCamera.status).label }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="画质">
                <el-tag :type="getQualityConfig(selectedCamera.streamQuality).type" size="small">
                  {{ getQualityConfig(selectedCamera.streamQuality).label }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="AI分析">
                <el-switch 
                  :model-value="selectedCamera.aiEnabled"
                  disabled
                />
              </el-descriptions-item>
              <el-descriptions-item label="置信度" v-if="selectedCamera.aiEnabled">
                <el-progress :percentage="selectedCamera.confidence" />
              </el-descriptions-item>
              <el-descriptions-item label="覆盖面积">{{ selectedCamera.coverageArea }}</el-descriptions-item>
              <el-descriptions-item label="分辨率">{{ selectedCamera.resolution }}</el-descriptions-item>
              <el-descriptions-item label="帧率">{{ selectedCamera.fps }} fps</el-descriptions-item>
              <el-descriptions-item label="检测数">
                <strong style="color: #E6A23C;">{{ selectedCamera.detections.length }}</strong> 项
              </el-descriptions-item>
            </el-descriptions>

            <!-- 检测详情 -->
            <div class="detections-list" v-if="selectedCamera.detections.length > 0" style="margin-top: 12px;">
              <el-divider content-position="left">实时检测</el-divider>
              <div v-for="(detection, idx) in selectedCamera.detections" :key="idx" class="detection-item">
                <div class="detection-info">
                  <span class="detection-type">{{ detection.type }}</span>
                  <el-tag size="small">{{ detection.confidence }}%</el-tag>
                </div>
                <div class="detection-time">{{ detection.timestamp }}</div>
              </div>
            </div>

            <div style="margin-top: 12px;">
              <el-button 
                type="warning" 
                size="small" 
                style="width: 100%;"
                @click="maintenanceDevice(selectedCamera)"
                v-if="selectedCamera.status === 'warning' || selectedCamera.status === 'offline'"
              >
                申请维护
              </el-button>
            </div>
          </el-card>

          <!-- AI分析配置 -->
          <el-card shadow="never" class="config-card" :style="{ marginTop: selectedCamera ? '16px' : '0' }">
            <template #header>
              <div class="card-header">
                <span class="title">⚙️ 监控配置</span>
                <div class="header-actions">
                  <el-button size="small" text @click="exportConfig">导出</el-button>
                  <el-button size="small" text @click="importConfig">导入</el-button>
                </div>
              </div>
            </template>

            <div class="config-list">
              <div v-for="(config, key) in aiConfig" :key="key" class="config-item">
                <div class="config-label">{{ config.label }}</div>
                <div class="config-control">
                  <el-slider 
                    v-if="config.type === 'slider'"
                    :model-value="Number(config.value)"
                    @update:model-value="(val) => updateConfig(key, val)"
                    :min="config.min"
                    :max="config.max"
                    show-input
                    :show-input-controls="false"
                    size="small"
                  />
                  <el-switch 
                    v-else-if="config.type === 'switch'"
                    :model-value="Boolean(config.value)"
                    @update:model-value="(val) => updateConfig(key, val)"
                  />
                </div>
              </div>
            </div>

            <el-divider />

            <!-- 系统设置 -->
            <div class="system-settings">
              <div class="setting-item">
                <span class="setting-label">自动刷新</span>
                <el-switch 
                  :model-value="autoRefresh"
                  @update:model-value="toggleAutoRefresh"
                />
              </div>
            </div>
          </el-card>

          <!-- 快捷操作 -->
          <el-card shadow="never" class="actions-card" style="margin-top: 16px;">
            <template #header>
              <div class="card-header">
                <span class="title">🔧 快捷操作</span>
              </div>
            </template>

            <div class="quick-actions">
              <el-button type="primary" style="width: 100%; margin-bottom: 8px;">
                导出监控报告
              </el-button>
              <el-button type="success" style="width: 100%; margin-bottom: 8px;">
                配置告警规则
              </el-button>
              <el-button type="warning" style="width: 100%; margin-bottom: 8px;">
                查看历史录像
              </el-button>
              <el-button type="info" style="width: 100%;">
                设备维护记录
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 底部提示 -->
    <el-alert
      title="💡 智能监控提示"
      type="info"
      :closable="false"
      style="margin-top: 16px;"
    >
      <template #default>
        <div style="line-height: 1.8;">
          系统正在对 <strong style="color: #409EFF;">{{ cameras.filter(c => c.aiEnabled).length }}</strong> 路视频进行AI智能分析，
          当前在线率 <strong style="color: #67C23A;">{{ deviceStatus.onlineRate }}%</strong>，
          共检测到 <strong style="color: #E6A23C;">{{ cameras.reduce((sum, c) => sum + c.detections.length, 0) }}</strong> 项目标，
          覆盖率达到 <strong style="color: #67C23A;">92%</strong>，
          实现了全方位、无死角的智能安全监控。
        </div>
      </template>
    </el-alert>
  </div>
</template>

<style scoped lang="scss">
.real-time-monitor {
  padding: 20px;
  background: #f0f2f5;
  min-height: calc(100vh - 120px);

  .metrics-overview {
    margin-bottom: 20px;

    .metric-card {
      height: 100px;
      border-radius: 8px;
      transition: all 0.3s;
      cursor: pointer;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
      }

      :deep(.el-card__body) {
        padding: 12px;
        display: flex;
        align-items: center;
        height: 100%;
      }

      .metric-icon {
        font-size: 36px;
        margin-right: 12px;
      }

      .metric-content {
        flex: 1;

        .metric-title {
          font-size: 12px;
          color: #909399;
          margin-bottom: 6px;
        }

        .metric-value {
          .value {
            font-size: 24px;
            font-weight: bold;
            color: #303133;
          }

          .unit {
            font-size: 12px;
            color: #909399;
            margin-left: 4px;
          }
        }
      }
    }
  }

  .main-content {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .title {
        font-size: 16px;
        font-weight: bold;
        color: #303133;
      }

      .header-actions {
        display: flex;
        gap: 8px;
      }
    }

    // 左侧区域导航
    .area-nav-card {
      .area-list {
        max-height: 600px;
        overflow-y: auto;

        .area-item {
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.3s;
          border: 2px solid transparent;

          &:hover {
            background: #f5f7fa;
          }

          &.active {
            background: #ecf5ff;
            border-color: #409EFF;
          }

          .area-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
          }

          .area-name {
            font-weight: bold;
            color: #303133;
            font-size: 14px;
          }

          .area-info {
            .info-item {
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 6px;
              font-size: 13px;

              &:last-child {
                margin-bottom: 0;
              }

              .label {
                color: #909399;
                min-width: 60px;
              }

              .el-progress {
                flex: 1;
              }

              .percentage {
                font-weight: 600;
                color: #606266;
                min-width: 40px;
                text-align: right;
              }
            }
          }
        }
      }
    }

    .device-status-card {
      :deep(.el-descriptions__label) {
        width: 100px;
      }
    }

    // 中间视频区
    .video-area-card {
      .video-grid {
        display: grid;
        gap: 12px;
        
        .video-item {
          border-radius: 8px;
          overflow: hidden;
          border: 3px solid #dcdfe6;
          transition: all 0.3s;
          cursor: pointer;

          &:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }

          &.status-online {
            border-color: #67C23A;
          }

          &.status-offline {
            border-color: #909399;
          }

          &.status-warning {
            border-color: #E6A23C;
          }

          &.status-error {
            border-color: #F56C6C;
          }

          .video-frame {
            position: relative;
            width: 100%;
            padding-bottom: 75%; // 4:3 aspect ratio
            background: #000;

            .video-placeholder {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);

              .camera-icon {
                font-size: 48px;
                margin-bottom: 8px;
              }

              .camera-id {
                color: #fff;
                font-weight: bold;
                font-size: 16px;
              }
            }

            .ai-detections {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              pointer-events: none;

              .detection-box {
                position: absolute;
                border: 2px solid #67C23A;
                border-radius: 4px;
                background: rgba(103, 194, 58, 0.2);
                padding: 2px 6px;

                .detection-label {
                  color: #67C23A;
                  font-size: 10px;
                  font-weight: bold;
                  white-space: nowrap;
                  text-shadow: 0 0 2px rgba(0, 0, 0, 0.8);
                }
              }
            }

            .video-status {
              position: absolute;
              top: 8px;
              left: 8px;
            }

            .ai-status {
              position: absolute;
              top: 8px;
              right: 8px;
            }

            .video-actions {
              position: absolute;
              bottom: 8px;
              right: 8px;
              display: flex;
              gap: 4px;
            }
          }

          .camera-info {
            padding: 8px;
            background: #fff;

            .camera-name {
              font-weight: bold;
              color: #303133;
              font-size: 13px;
              margin-bottom: 4px;
            }

            .camera-location {
              color: #606266;
              font-size: 12px;
              margin-bottom: 4px;
            }

            .camera-specs {
              color: #909399;
              font-size: 11px;
            }
          }
        }
      }
    }

    // 右侧配置面板
    .camera-detail-card {
      .detections-list {
        .detection-item {
          padding: 8px;
          background: #f5f7fa;
          border-radius: 4px;
          margin-bottom: 8px;

          &:last-child {
            margin-bottom: 0;
          }

          .detection-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4px;

            .detection-type {
              font-weight: 600;
              color: #303133;
              font-size: 13px;
            }
          }

          .detection-time {
            color: #909399;
            font-size: 12px;
          }
        }
      }
    }

    .config-card {
      .config-list {
        .config-item {
          margin-bottom: 20px;

          &:last-child {
            margin-bottom: 0;
          }

          .config-label {
            font-weight: 600;
            color: #606266;
            font-size: 13px;
            margin-bottom: 8px;
          }

          .config-control {
            :deep(.el-slider) {
              padding: 0;
            }

            :deep(.el-input-number) {
              width: 80px;
            }
          }
        }
      }

      .system-settings {
        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;

          .setting-label {
            font-weight: 600;
            color: #606266;
            font-size: 13px;
          }
        }
      }
    }

    .actions-card {
      .quick-actions {
        display: flex;
        flex-direction: column;
      }
    }
  }
}

// 响应式优化
@media (max-width: 768px) {
  .real-time-monitor {
    padding: 12px;

    .main-content {
      .el-col {
        margin-bottom: 16px;
      }
    }
  }
}
</style>