<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 定义隐患类型
type HazardType = 'smoke' | 'flame' | 'temperature' | 'gas'

// 定义危险等级
type DangerLevel = 'safe' | 'observe' | 'warning' | 'alarm'

// 定义处理状态
type HandleStatus = 'pending' | 'processing' | 'completed' | 'ignored'

// 定义传感器状态
type SensorStatus = 'normal' | 'warning' | 'exceed' | 'fault'

// 监控摄像头接口
interface Camera {
  id: string
  name: string
  location: string
  status: 'online' | 'offline'
  detecting: boolean
  fireLevel: DangerLevel
  detectedHazards: DetectedHazard[]
}

// 检测到的火灾隐患接口
interface DetectedHazard {
  id: string
  type: HazardType
  confidence: number
  dangerLevel: DangerLevel
  x: number
  y: number
  width: number
  height: number
  timestamp: Date
}

// 传感器数据接口
interface SensorData {
  id: string
  location: string
  temperature: number
  smokeConcentration: number
  coConcentration: number
  status: SensorStatus
  lastUpdate: Date
}

// 预警信息接口
interface AlertInfo {
  id: string
  type: HazardType
  dangerLevel: DangerLevel
  cameraId: string
  cameraName: string
  location: string
  time: Date
  handled: boolean
  handleStatus: HandleStatus
  handler?: string
  feedback?: string
  snapshot: string
  description: string
}

// 隐患记录接口
interface HazardRecord {
  id: string
  time: Date
  location: string
  type: HazardType
  dangerLevel: DangerLevel
  handleStatus: HandleStatus
  handler?: string
  handleTime?: Date
  description: string
}

// 检测配置接口
interface DetectionConfig {
  smokeSensitivity: number
  flameSensitivity: number
  temperatureThreshold: number
  smokeThreshold: number
  coThreshold: number
  autoAlert: boolean
  alertSound: boolean
  alertMessage: boolean
  fireProtectionLevel: 'low' | 'medium' | 'high'
}

// 页面状态
const activeTab = ref('monitor')
const cameraLayout = ref<'2x2' | '3x3' | '4x4'>('2x2')

// 监控摄像头列表
const cameras = ref<Camera[]>([])

// 传感器数据列表
const sensors = ref<SensorData[]>([])

// 预警信息列表
const alertList = ref<AlertInfo[]>([])
const unhandledAlertCount = computed(() => alertList.value.filter(a => !a.handled).length)

// 隐患记录列表
const hazardRecords = ref<HazardRecord[]>([])
const recordsLoading = ref(false)
const recordTypeFilter = ref<HazardType | ''>('')
const recordLevelFilter = ref<DangerLevel | ''>('')
const recordDateRange = ref<[Date, Date] | null>(null)

// 检测配置
const detectionConfig = ref<DetectionConfig>({
  smokeSensitivity: 75,
  flameSensitivity: 80,
  temperatureThreshold: 60,
  smokeThreshold: 150,
  coThreshold: 50,
  autoAlert: true,
  alertSound: true,
  alertMessage: true,
  fireProtectionLevel: 'high'
})

// 对话框状态
const alertDialogVisible = ref(false)
const configDialogVisible = ref(false)

// 当前查看的预警
const currentAlert = ref<AlertInfo | null>(null)

// 模拟数据定时器
let dataSimulationTimer: number | null = null
let sensorUpdateTimer: number | null = null

// 隐患类型配置
const hazardTypeConfig = {
  smoke: { label: '烟雾检测', color: '#909399', icon: '🌫️' },
  flame: { label: '火焰识别', color: '#F56C6C', icon: '🔥' },
  temperature: { label: '温度异常', color: '#E6A23C', icon: '🌡️' },
  gas: { label: '气体超标', color: '#67C23A', icon: '💨' }
}

// 危险等级配置
const dangerLevelConfig = {
  safe: { label: '安全', color: 'success', textColor: '#67C23A' },
  observe: { label: '观察', color: 'info', textColor: '#409EFF' },
  warning: { label: '预警', color: 'warning', textColor: '#E6A23C' },
  alarm: { label: '报警', color: 'danger', textColor: '#F56C6C' }
}

// 处理状态配置
const handleStatusConfig = {
  pending: { label: '待处理', color: 'danger' },
  processing: { label: '处理中', color: 'warning' },
  completed: { label: '已完成', color: 'success' },
  ignored: { label: '已忽略', color: 'info' }
}

// 传感器状态配置
const sensorStatusConfig = {
  normal: { label: '正常', color: 'success' },
  warning: { label: '预警', color: 'warning' },
  exceed: { label: '超标', color: 'danger' },
  fault: { label: '故障', color: 'info' }
}

// 统计数据
const statistics = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const todayRecords = hazardRecords.value.filter(r => r.time >= today)
  const alarmRecords = hazardRecords.value.filter(r => r.dangerLevel === 'alarm')
  const unhandledRecords = hazardRecords.value.filter(r => r.handleStatus === 'pending')
  
  return {
    total: hazardRecords.value.length,
    today: todayRecords.length,
    alarm: alarmRecords.length,
    unhandled: unhandledRecords.length
  }
})

// 初始化 mock 数据
const initMockData = () => {
  // 初始化摄像头数据
  cameras.value = [
    { id: 'cam1', name: '摄像头1', location: '一楼大厅', status: 'online', detecting: true, fireLevel: 'safe', detectedHazards: [] },
    { id: 'cam2', name: '摄像头2', location: '二楼走廊', status: 'online', detecting: true, fireLevel: 'safe', detectedHazards: [] },
    { id: 'cam3', name: '摄像头3', location: '配电房', status: 'online', detecting: true, fireLevel: 'safe', detectedHazards: [] },
    { id: 'cam4', name: '摄像头4', location: '仓库区域', status: 'online', detecting: true, fireLevel: 'safe', detectedHazards: [] },
    { id: 'cam5', name: '摄像头5', location: '停车场', status: 'online', detecting: false, fireLevel: 'safe', detectedHazards: [] },
    { id: 'cam6', name: '摄像头6', location: '楼梯间', status: 'offline', detecting: false, fireLevel: 'safe', detectedHazards: [] }
  ]

  // 初始化传感器数据
  sensors.value = [
    { id: 'sensor1', location: '一楼大厅', temperature: 22, smokeConcentration: 30, coConcentration: 5, status: 'normal', lastUpdate: new Date() },
    { id: 'sensor2', location: '二楼走廊', temperature: 24, smokeConcentration: 35, coConcentration: 8, status: 'normal', lastUpdate: new Date() },
    { id: 'sensor3', location: '配电房', temperature: 45, smokeConcentration: 80, coConcentration: 25, status: 'warning', lastUpdate: new Date() },
    { id: 'sensor4', location: '仓库区域', temperature: 26, smokeConcentration: 40, coConcentration: 10, status: 'normal', lastUpdate: new Date() }
  ]

  // 初始化历史隐患记录
  const now = new Date()
  hazardRecords.value = [
    {
      id: 'record1',
      time: new Date(now.getTime() - 3600000 * 2),
      location: '配电房',
      type: 'temperature',
      dangerLevel: 'warning',
      handleStatus: 'completed',
      handler: '张三',
      handleTime: new Date(now.getTime() - 3600000),
      description: '配电房温度异常升高，已检查确认为设备正常运行产生'
    },
    {
      id: 'record2',
      time: new Date(now.getTime() - 3600000 * 5),
      location: '二楼走廊',
      type: 'smoke',
      dangerLevel: 'observe',
      handleStatus: 'completed',
      handler: '李四',
      handleTime: new Date(now.getTime() - 3600000 * 4),
      description: '检测到轻微烟雾，已确认为装修产生的粉尘'
    },
    {
      id: 'record3',
      time: new Date(now.getTime() - 86400000),
      location: '仓库区域',
      type: 'flame',
      dangerLevel: 'alarm',
      handleStatus: 'completed',
      handler: '王五',
      handleTime: new Date(now.getTime() - 86400000 + 1800000),
      description: '检测到明火，消防队已到场处理，为员工违规吸烟导致'
    },
    {
      id: 'record4',
      time: new Date(now.getTime() - 86400000 * 2),
      location: '配电房',
      type: 'gas',
      dangerLevel: 'warning',
      handleStatus: 'completed',
      handler: '赵六',
      handleTime: new Date(now.getTime() - 86400000 * 2 + 3600000),
      description: 'CO浓度超标，已加强通风，设备检修正常'
    },
    {
      id: 'record5',
      time: new Date(now.getTime() - 86400000 * 3),
      location: '一楼大厅',
      type: 'smoke',
      dangerLevel: 'observe',
      handleStatus: 'completed',
      handler: '张三',
      handleTime: new Date(now.getTime() - 86400000 * 3 + 1800000),
      description: '烟感器误报，已清洁传感器'
    }
  ]
}

// 模拟实时火灾隐患检测
const simulateHazardDetection = () => {
  cameras.value.forEach(camera => {
    if (camera.status === 'online' && camera.detecting) {
      // 随机生成火灾隐患检测
      if (Math.random() > 0.8) {
        const hazardTypes: HazardType[] = ['smoke', 'flame', 'temperature', 'gas']
        const dangerLevels: DangerLevel[] = ['safe', 'observe', 'warning', 'alarm']
        const type = hazardTypes[Math.floor(Math.random() * hazardTypes.length)]
        const dangerLevel = dangerLevels[Math.floor(Math.random() * 4)]
        
        const detectedHazard: DetectedHazard = {
          id: `hazard_${Date.now()}_${Math.random()}`,
          type: type,
          confidence: 70 + Math.random() * 30,
          dangerLevel: dangerLevel,
          x: Math.random() * 60 + 10,
          y: Math.random() * 60 + 10,
          width: Math.random() * 15 + 15,
          height: Math.random() * 15 + 15,
          timestamp: new Date()
        }
        
        camera.detectedHazards = [detectedHazard]
        camera.fireLevel = dangerLevel
        
        // 如果是预警或报警级别，生成预警信息
        if (dangerLevel === 'warning' || dangerLevel === 'alarm') {
          const alert: AlertInfo = {
            id: `alert_${Date.now()}`,
            type: type,
            dangerLevel: dangerLevel,
            cameraId: camera.id,
            cameraName: camera.name,
            location: camera.location,
            time: new Date(),
            handled: false,
            handleStatus: 'pending',
            snapshot: 'https://img2.baidu.com/it/u=3945764719,3280546007&fm=253&fmt=auto?w=710&h=393',
            description: `${hazardTypeConfig[type].label}，置信度：${detectedHazard.confidence.toFixed(1)}%`
          }
          alertList.value.unshift(alert)
          
          // 添加到隐患记录
          const record: HazardRecord = {
            id: `record_${Date.now()}`,
            time: new Date(),
            location: camera.location,
            type: type,
            dangerLevel: dangerLevel,
            handleStatus: 'pending',
            description: alert.description
          }
          hazardRecords.value.unshift(record)
          
          // 播放预警提示
          if (detectionConfig.value.alertSound) {
            const levelText = dangerLevelConfig[dangerLevel].label
            ElMessage({
              type: dangerLevel === 'alarm' ? 'error' : 'warning',
              message: `${levelText}：${camera.location} 检测到${hazardTypeConfig[type].label}！`,
              duration: 5000
            })
          }
        }
        
        // 一段时间后清除检测框
        setTimeout(() => {
          camera.detectedHazards = []
          if (camera.fireLevel !== 'safe') {
            camera.fireLevel = 'safe'
          }
        }, 4000)
      }
    }
  })
}

// 模拟传感器数据更新
const updateSensorData = () => {
  sensors.value.forEach(sensor => {
    // 随机波动传感器数据
    sensor.temperature += (Math.random() - 0.5) * 2
    sensor.smokeConcentration += (Math.random() - 0.5) * 10
    sensor.coConcentration += (Math.random() - 0.5) * 5
    
    // 限制范围
    sensor.temperature = Math.max(20, Math.min(80, sensor.temperature))
    sensor.smokeConcentration = Math.max(0, Math.min(300, sensor.smokeConcentration))
    sensor.coConcentration = Math.max(0, Math.min(100, sensor.coConcentration))
    
    // 更新状态
    if (sensor.temperature > detectionConfig.value.temperatureThreshold ||
        sensor.smokeConcentration > detectionConfig.value.smokeThreshold ||
        sensor.coConcentration > detectionConfig.value.coThreshold) {
      sensor.status = 'exceed'
    } else if (sensor.temperature > detectionConfig.value.temperatureThreshold * 0.8 ||
               sensor.smokeConcentration > detectionConfig.value.smokeThreshold * 0.7 ||
               sensor.coConcentration > detectionConfig.value.coThreshold * 0.7) {
      sensor.status = 'warning'
    } else {
      sensor.status = 'normal'
    }
    
    sensor.lastUpdate = new Date()
  })
}

// 加载隐患记录
const loadHazardRecords = () => {
  recordsLoading.value = true
  setTimeout(() => {
    recordsLoading.value = false
  }, 500)
}

// 筛选隐患记录
const filteredHazardRecords = computed(() => {
  return hazardRecords.value.filter(record => {
    if (recordTypeFilter.value && record.type !== recordTypeFilter.value) return false
    if (recordLevelFilter.value && record.dangerLevel !== recordLevelFilter.value) return false
    if (recordDateRange.value) {
      const [start, end] = recordDateRange.value
      if (record.time < start || record.time > end) return false
    }
    return true
  })
})

// 处理预警
const handleAlert = (alert: AlertInfo) => {
  currentAlert.value = alert
  alertDialogVisible.value = true
}

// 提交预警处理
const submitAlertHandle = (status: HandleStatus, feedback: string) => {
  if (currentAlert.value) {
    currentAlert.value.handled = true
    currentAlert.value.handleStatus = status
    currentAlert.value.handler = '当前用户'
    currentAlert.value.feedback = feedback
    
    // 更新对应的隐患记录
    const record = hazardRecords.value.find(r => 
      r.location === currentAlert.value!.location && 
      Math.abs(r.time.getTime() - currentAlert.value!.time.getTime()) < 1000
    )
    if (record) {
      record.handleStatus = status
      record.handler = '当前用户'
      record.handleTime = new Date()
    }
    
    ElMessage.success('预警处理完成')
    alertDialogVisible.value = false
  }
}

// 导出隐患记录
const exportRecords = () => {
  ElMessage.success('导出成功，共导出 ' + filteredHazardRecords.value.length + ' 条记录')
}

// 保存检测配置
const saveConfig = () => {
  ElMessage.success('配置保存成功')
  configDialogVisible.value = false
}

// 重置检测配置
const resetConfig = () => {
  ElMessageBox.confirm('确定要重置为默认配置吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    detectionConfig.value = {
      smokeSensitivity: 75,
      flameSensitivity: 80,
      temperatureThreshold: 60,
      smokeThreshold: 150,
      coThreshold: 50,
      autoAlert: true,
      alertSound: true,
      alertMessage: true,
      fireProtectionLevel: 'high'
    }
    ElMessage.success('配置已重置')
  }).catch(() => {})
}

// 测试预警系统
const testAlert = () => {
  ElMessage.info('开始测试预警系统...')
  setTimeout(() => {
    ElMessage.success('预警系统测试完成，运行正常')
  }, 2000)
}

// 切换摄像头布局
const changeCameraLayout = (layout: '2x2' | '3x3' | '4x4') => {
  cameraLayout.value = layout
}

// 获取布局网格数
const getLayoutGrid = computed(() => {
  const layoutMap = {
    '2x2': 4,
    '3x3': 9,
    '4x4': 16
  }
  return layoutMap[cameraLayout.value]
})

// 获取要显示的摄像头列表
const displayCameras = computed(() => {
  return cameras.value.slice(0, getLayoutGrid.value)
})

// 获取传感器状态颜色
const getSensorStatusColor = (value: number, threshold: number): string => {
  if (value > threshold) return '#F56C6C'
  if (value > threshold * 0.8) return '#E6A23C'
  return '#67C23A'
}

// 生命周期
onMounted(() => {
  initMockData()
  loadHazardRecords()
  
  // 启动模拟数据生成
  dataSimulationTimer = window.setInterval(() => {
    simulateHazardDetection()
  }, 6000)
  
  // 启动传感器数据更新
  sensorUpdateTimer = window.setInterval(() => {
    updateSensorData()
  }, 2000)
})

onUnmounted(() => {
  if (dataSimulationTimer) {
    clearInterval(dataSimulationTimer)
  }
  if (sensorUpdateTimer) {
    clearInterval(sensorUpdateTimer)
  }
})
</script>

<template>
  <div class="fire-hazard-container">
    <!-- 顶部工具栏 -->
    <el-card class="toolbar-card" shadow="never">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-radio-group v-model="activeTab" size="default">
            <el-radio-button value="monitor">实时监控</el-radio-button>
            <el-radio-button value="records">隐患记录</el-radio-button>
            <el-radio-button value="statistics">统计分析</el-radio-button>
          </el-radio-group>
        </div>
        <div class="toolbar-right">
          <el-button type="primary" @click="configDialogVisible = true">
            检测配置
          </el-button>
          <el-button type="success" @click="exportRecords">
            导出数据
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 实时监控视图 -->
      <div v-show="activeTab === 'monitor'" class="monitor-view">
        <el-row :gutter="20">
          <!-- 左侧：监控画面区 -->
          <el-col :span="12">
            <el-card class="monitor-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <span>实时监控画面</span>
                  <div class="layout-switch">
                    <el-radio-group v-model="cameraLayout" size="small" @change="changeCameraLayout">
                      <el-radio-button value="2x2">2x2</el-radio-button>
                      <el-radio-button value="3x3">3x3</el-radio-button>
                      <el-radio-button value="4x4">4x4</el-radio-button>
                    </el-radio-group>
                  </div>
                </div>
              </template>
              
              <div class="camera-grid" :class="`grid-${cameraLayout}`">
                <div
                  v-for="camera in displayCameras"
                  :key="camera.id"
                  class="camera-item"
                  :class="{ offline: camera.status === 'offline' }"
                >
                  <div class="camera-header">
                    <span class="camera-name">{{ camera.name }}</span>
                    <el-tag :type="camera.status === 'online' ? 'success' : 'danger'" size="small">
                      {{ camera.status === 'online' ? '在线' : '离线' }}
                    </el-tag>
                  </div>
                  
                  <div class="camera-view">
                    <!-- 模拟视频画面 -->
                    <div class="video-placeholder">
                      <i class="el-icon-video-camera"></i>
                      <p>{{ camera.location }}</p>
                    </div>
                    
                    <!-- 火灾隐患检测框 -->
                    <div
                      v-for="hazard in camera.detectedHazards"
                      :key="hazard.id"
                      class="hazard-box"
                      :style="{
                        left: `${hazard.x}%`,
                        top: `${hazard.y}%`,
                        width: `${hazard.width}%`,
                        height: `${hazard.height}%`
                      }"
                      :class="`hazard-box-${hazard.dangerLevel}`"
                    >
                      <div class="hazard-info">
                        <div class="hazard-type">{{ hazardTypeConfig[hazard.type].icon }} {{ hazardTypeConfig[hazard.type].label }}</div>
                        <div class="hazard-confidence">置信度：{{ hazard.confidence.toFixed(1) }}%</div>
                        <el-tag
                          :type="dangerLevelConfig[hazard.dangerLevel].color"
                          size="small"
                          effect="dark"
                        >
                          {{ dangerLevelConfig[hazard.dangerLevel].label }}
                        </el-tag>
                      </div>
                    </div>
                  </div>
                  
                  <div class="camera-footer">
                    <span class="camera-location">{{ camera.location }}</span>
                    <el-tag :type="dangerLevelConfig[camera.fireLevel].color" size="small">
                      {{ dangerLevelConfig[camera.fireLevel].label }}
                    </el-tag>
                    <el-switch
                      v-model="camera.detecting"
                      :disabled="camera.status === 'offline'"
                      active-text="检测"
                      size="small"
                    />
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>

          <!-- 中间：传感器数据面板 -->
          <el-col :span="6">
            <el-card class="sensor-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <span>传感器数据</span>
                </div>
              </template>
              
              <div class="sensor-list">
                <div
                  v-for="sensor in sensors"
                  :key="sensor.id"
                  class="sensor-item"
                >
                  <div class="sensor-header">
                    <span class="sensor-location">{{ sensor.location }}</span>
                    <el-tag :type="sensorStatusConfig[sensor.status].color" size="small">
                      {{ sensorStatusConfig[sensor.status].label }}
                    </el-tag>
                  </div>
                  
                  <div class="sensor-data">
                    <div class="data-item">
                      <span class="data-label">🌡️ 温度</span>
                      <div class="data-value-wrapper">
                        <el-progress
                          :percentage="(sensor.temperature / 100) * 100"
                          :color="getSensorStatusColor(sensor.temperature, detectionConfig.temperatureThreshold)"
                          :show-text="false"
                        />
                        <span class="data-value" :style="{ color: getSensorStatusColor(sensor.temperature, detectionConfig.temperatureThreshold) }">
                          {{ sensor.temperature.toFixed(1) }}°C
                        </span>
                      </div>
                    </div>
                    
                    <div class="data-item">
                      <span class="data-label">🌫️ 烟雾</span>
                      <div class="data-value-wrapper">
                        <el-progress
                          :percentage="(sensor.smokeConcentration / 300) * 100"
                          :color="getSensorStatusColor(sensor.smokeConcentration, detectionConfig.smokeThreshold)"
                          :show-text="false"
                        />
                        <span class="data-value" :style="{ color: getSensorStatusColor(sensor.smokeConcentration, detectionConfig.smokeThreshold) }">
                          {{ sensor.smokeConcentration.toFixed(0) }} ppm
                        </span>
                      </div>
                    </div>
                    
                    <div class="data-item">
                      <span class="data-label">💨 CO浓度</span>
                      <div class="data-value-wrapper">
                        <el-progress
                          :percentage="(sensor.coConcentration / 100) * 100"
                          :color="getSensorStatusColor(sensor.coConcentration, detectionConfig.coThreshold)"
                          :show-text="false"
                        />
                        <span class="data-value" :style="{ color: getSensorStatusColor(sensor.coConcentration, detectionConfig.coThreshold) }">
                          {{ sensor.coConcentration.toFixed(0) }} ppm
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="sensor-footer">
                    <span class="update-time">{{ sensor.lastUpdate.toLocaleTimeString('zh-CN') }}</span>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>

          <!-- 右侧：预警信息和配置区 -->
          <el-col :span="6">
            <el-card class="alert-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <span>实时预警</span>
                  <el-badge :value="unhandledAlertCount" type="danger" />
                </div>
              </template>
              
              <div class="alert-list">
                <el-empty v-if="alertList.length === 0" description="暂无预警信息" />
                
                <div
                  v-for="alert in alertList.slice(0, 10)"
                  :key="alert.id"
                  class="alert-item"
                  :class="{ handled: alert.handled }"
                  @click="handleAlert(alert)"
                >
                  <div class="alert-header">
                    <el-tag :type="dangerLevelConfig[alert.dangerLevel].color" size="small">
                      {{ dangerLevelConfig[alert.dangerLevel].label }}
                    </el-tag>
                    <span class="alert-time">{{ alert.time.toLocaleTimeString('zh-CN') }}</span>
                  </div>
                  
                  <div class="alert-content">
                    <div class="alert-icon">{{ hazardTypeConfig[alert.type].icon }}</div>
                    <div class="alert-info">
                      <div class="alert-type">{{ hazardTypeConfig[alert.type].label }}</div>
                      <div class="alert-location">
                        <i class="el-icon-location"></i>
                        {{ alert.location }}
                      </div>
                      <div class="alert-description">{{ alert.description }}</div>
                    </div>
                  </div>
                  
                  <div class="alert-footer">
                    <el-tag v-if="alert.handled" :type="handleStatusConfig[alert.handleStatus].color" size="small">
                      {{ handleStatusConfig[alert.handleStatus].label }}
                    </el-tag>
                    <el-tag v-else type="danger" size="small" effect="dark">待处理</el-tag>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 隐患记录管理 -->
      <div v-show="activeTab === 'records'" class="records-view">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>火灾隐患记录</span>
            </div>
          </template>

          <!-- 筛选条件 -->
          <div class="filter-bar">
            <el-select v-model="recordTypeFilter" placeholder="隐患类型" clearable style="width: 150px">
              <el-option label="烟雾检测" value="smoke" />
              <el-option label="火焰识别" value="flame" />
              <el-option label="温度异常" value="temperature" />
              <el-option label="气体超标" value="gas" />
            </el-select>
            <el-select v-model="recordLevelFilter" placeholder="危险等级" clearable style="width: 120px">
              <el-option label="安全" value="safe" />
              <el-option label="观察" value="observe" />
              <el-option label="预警" value="warning" />
              <el-option label="报警" value="alarm" />
            </el-select>
            <el-date-picker
              v-model="recordDateRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              style="width: 380px"
            />
          </div>

          <!-- 隐患记录列表 -->
          <el-table :data="filteredHazardRecords" :loading="recordsLoading" stripe>
            <el-table-column prop="time" label="发现时间" width="180">
              <template #default="{ row }">
                {{ row.time.toLocaleString('zh-CN') }}
              </template>
            </el-table-column>
            <el-table-column prop="location" label="监控位置" width="150" />
            <el-table-column prop="type" label="隐患类型" width="150">
              <template #default="{ row }">
                <span>{{ hazardTypeConfig[row.type].icon }} {{ hazardTypeConfig[row.type].label }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="dangerLevel" label="危险等级" width="120">
              <template #default="{ row }">
                <el-tag :type="dangerLevelConfig[row.dangerLevel].color">
                  {{ dangerLevelConfig[row.dangerLevel].label }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="handleStatus" label="处理状态" width="120">
              <template #default="{ row }">
                <el-tag :type="handleStatusConfig[row.handleStatus].color">
                  {{ handleStatusConfig[row.handleStatus].label }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="handler" label="处理人" width="100" />
            <el-table-column prop="handleTime" label="处理时间" width="180">
              <template #default="{ row }">
                {{ row.handleTime ? row.handleTime.toLocaleString('zh-CN') : '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" min-width="200" />
          </el-table>
        </el-card>
      </div>

      <!-- 统计分析 -->
      <div v-show="activeTab === 'statistics'" class="statistics-view">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card shadow="never">
              <el-statistic title="隐患总数" :value="statistics.total">
                <template #suffix>
                  <span style="font-size: 16px">条</span>
                </template>
              </el-statistic>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="never">
              <el-statistic title="今日隐患" :value="statistics.today">
                <template #suffix>
                  <span style="font-size: 16px">条</span>
                </template>
              </el-statistic>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="never">
              <el-statistic title="报警次数" :value="statistics.alarm">
                <template #suffix>
                  <span style="font-size: 16px">次</span>
                </template>
              </el-statistic>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="never">
              <el-statistic title="待处理" :value="statistics.unhandled">
                <template #suffix>
                  <span style="font-size: 16px">条</span>
                </template>
              </el-statistic>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" style="margin-top: 20px">
          <el-col :span="12">
            <el-card shadow="never">
              <template #header>
                <span>隐患类型分布</span>
              </template>
              <div class="chart-placeholder">
                <div v-for="(config, type) in hazardTypeConfig" :key="type" class="type-stat">
                  <span class="type-icon">{{ config.icon }}</span>
                  <span class="type-label">{{ config.label }}</span>
                  <el-progress
                    :percentage="(hazardRecords.filter(r => r.type === type).length / hazardRecords.length) * 100"
                    :color="config.color"
                  />
                  <span class="type-count">{{ hazardRecords.filter(r => r.type === type).length }} 条</span>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="never">
              <template #header>
                <span>危险等级分布</span>
              </template>
              <div class="chart-placeholder">
                <div v-for="(config, level) in dangerLevelConfig" :key="level" class="level-stat">
                  <span class="level-label">{{ config.label }}</span>
                  <el-progress
                    :percentage="(hazardRecords.filter(r => r.dangerLevel === level).length / hazardRecords.length) * 100"
                    :color="config.textColor"
                  />
                  <span class="level-count">{{ hazardRecords.filter(r => r.dangerLevel === level).length }} 条</span>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-row style="margin-top: 20px">
          <el-col :span="24">
            <el-card shadow="never">
              <template #header>
                <span>处理状态统计</span>
              </template>
              <div class="chart-placeholder">
                <div v-for="(config, status) in handleStatusConfig" :key="status" class="status-stat">
                  <span class="status-label">{{ config.label }}</span>
                  <el-progress
                    :percentage="(hazardRecords.filter(r => r.handleStatus === status).length / hazardRecords.length) * 100"
                    :color="config.color === 'success' ? '#67C23A' : config.color === 'warning' ? '#E6A23C' : config.color === 'danger' ? '#F56C6C' : '#909399'"
                  />
                  <span class="status-count">{{ hazardRecords.filter(r => r.handleStatus === status).length }} 条</span>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- 预警处理对话框 -->
    <el-dialog
      v-model="alertDialogVisible"
      title="预警详情"
      width="600px"
    >
      <div v-if="currentAlert" class="alert-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="隐患类型">
            <span>{{ hazardTypeConfig[currentAlert.type].icon }} {{ hazardTypeConfig[currentAlert.type].label }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="危险等级">
            <el-tag :type="dangerLevelConfig[currentAlert.dangerLevel].color">
              {{ dangerLevelConfig[currentAlert.dangerLevel].label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="监控位置">
            {{ currentAlert.location }}
          </el-descriptions-item>
          <el-descriptions-item label="摄像头">
            {{ currentAlert.cameraName }}
          </el-descriptions-item>
          <el-descriptions-item label="发现时间" :span="2">
            {{ currentAlert.time.toLocaleString('zh-CN') }}
          </el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">
            {{ currentAlert.description }}
          </el-descriptions-item>
          <el-descriptions-item label="现场画面" :span="2">
            <el-image :src="currentAlert.snapshot" style="width: 100%; max-height: 300px" fit="cover" />
          </el-descriptions-item>
          <el-descriptions-item v-if="currentAlert.handled" label="处理人">
            {{ currentAlert.handler }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentAlert.handled" label="处理状态">
            <el-tag :type="handleStatusConfig[currentAlert.handleStatus].color">
              {{ handleStatusConfig[currentAlert.handleStatus].label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentAlert.handled" label="处理反馈" :span="2">
            {{ currentAlert.feedback }}
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="!currentAlert.handled" class="alert-handle-form">
          <el-divider />
          <h4>处理指引</h4>
          <el-alert
            v-if="currentAlert.dangerLevel === 'alarm'"
            type="error"
            :closable="false"
            style="margin-bottom: 15px"
          >
            <template #title>
              紧急报警！请立即：<br>
              1. 通知消防部门<br>
              2. 启动应急预案<br>
              3. 组织人员疏散<br>
              4. 使用消防设施灭火
            </template>
          </el-alert>
          <el-alert
            v-else-if="currentAlert.dangerLevel === 'warning'"
            type="warning"
            :closable="false"
            style="margin-bottom: 15px"
          >
            <template #title>
              预警提示！建议：<br>
              1. 派人前往现场查看<br>
              2. 确认隐患原因<br>
              3. 采取相应措施<br>
              4. 做好应急准备
            </template>
          </el-alert>
          <el-form>
            <el-form-item label="处理反馈">
              <el-input
                v-model="currentAlert.feedback"
                type="textarea"
                :rows="4"
                placeholder="请输入处理反馈信息"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>
      <template #footer>
        <el-button @click="alertDialogVisible = false">关闭</el-button>
        <template v-if="currentAlert && !currentAlert.handled">
          <el-button type="info" @click="submitAlertHandle('ignored', currentAlert.feedback || '')">
            误报忽略
          </el-button>
          <el-button type="warning" @click="submitAlertHandle('processing', currentAlert.feedback || '')">
            处理中
          </el-button>
          <el-button type="success" @click="submitAlertHandle('completed', currentAlert.feedback || '')">
            已完成
          </el-button>
        </template>
      </template>
    </el-dialog>

    <!-- 检测配置对话框 -->
    <el-dialog
      v-model="configDialogVisible"
      title="检测参数配置"
      width="700px"
    >
      <el-form :model="detectionConfig" label-width="140px">
        <el-divider content-position="left">识别敏感度配置</el-divider>
        
        <el-form-item label="烟雾识别敏感度">
          <el-slider v-model="detectionConfig.smokeSensitivity" :min="0" :max="100" show-input />
          <span class="form-item-tip">敏感度越高，检测越灵敏，但可能误报率增加</span>
        </el-form-item>
        
        <el-form-item label="火焰识别敏感度">
          <el-slider v-model="detectionConfig.flameSensitivity" :min="0" :max="100" show-input />
          <span class="form-item-tip">敏感度越高，检测越灵敏，但可能误报率增加</span>
        </el-form-item>

        <el-divider content-position="left">传感器报警阈值</el-divider>
        
        <el-form-item label="温度报警阈值">
          <el-slider v-model="detectionConfig.temperatureThreshold" :min="30" :max="100" show-input />
          <span class="form-item-tip">当前阈值：{{ detectionConfig.temperatureThreshold }}°C，超过此温度将触发报警</span>
        </el-form-item>
        
        <el-form-item label="烟雾浓度阈值">
          <el-slider v-model="detectionConfig.smokeThreshold" :min="50" :max="300" show-input />
          <span class="form-item-tip">当前阈值：{{ detectionConfig.smokeThreshold }} ppm，超过此浓度将触发报警</span>
        </el-form-item>
        
        <el-form-item label="CO浓度阈值">
          <el-slider v-model="detectionConfig.coThreshold" :min="20" :max="100" show-input />
          <span class="form-item-tip">当前阈值：{{ detectionConfig.coThreshold }} ppm，超过此浓度将触发报警</span>
        </el-form-item>

        <el-divider content-position="left">防火等级与联动规则</el-divider>
        
        <el-form-item label="监控区域防火等级">
          <el-radio-group v-model="detectionConfig.fireProtectionLevel">
            <el-radio value="low">低风险区域</el-radio>
            <el-radio value="medium">中风险区域</el-radio>
            <el-radio value="high">高风险区域</el-radio>
          </el-radio-group>
          <div class="form-item-tip">
            高风险区域将使用更严格的检测标准和更快的响应速度
          </div>
        </el-form-item>
        
        <el-form-item label="自动预警">
          <el-switch v-model="detectionConfig.autoAlert" />
          <span class="form-item-tip">检测到隐患时自动发送预警</span>
        </el-form-item>
        
        <el-form-item label="声音预警">
          <el-switch v-model="detectionConfig.alertSound" />
          <span class="form-item-tip">触发预警时播放声音提示</span>
        </el-form-item>
        
        <el-form-item label="消息推送">
          <el-switch v-model="detectionConfig.alertMessage" />
          <span class="form-item-tip">触发预警时推送消息通知</span>
        </el-form-item>
        
        <el-form-item>
          <el-button type="warning" @click="testAlert">测试预警系统</el-button>
          <el-button @click="resetConfig">重置为默认配置</el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="configDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveConfig">保存配置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.fire-hazard-container {
  min-height: calc(100vh - 120px);

  .toolbar-card {
    margin-bottom: 20px;

    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .toolbar-left {
        flex: 1;
      }

      .toolbar-right {
        display: flex;
        gap: 10px;
      }
    }
  }

  .main-content {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .layout-switch {
        margin-left: auto;
      }
    }

    .filter-bar {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }
  }

  // 实时监控样式
  .monitor-view {
    .monitor-card {
      margin-bottom: 20px;
    }

    .camera-grid {
      display: grid;
      gap: 10px;

      &.grid-2x2 {
        grid-template-columns: repeat(2, 1fr);
      }

      &.grid-3x3 {
        grid-template-columns: repeat(3, 1fr);
      }

      &.grid-4x4 {
        grid-template-columns: repeat(4, 1fr);
      }

      .camera-item {
        border: 1px solid #dcdfe6;
        border-radius: 4px;
        overflow: hidden;
        background: #fff;

        &.offline {
          opacity: 0.6;
        }

        .camera-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          background: #f5f7fa;
          border-bottom: 1px solid #dcdfe6;

          .camera-name {
            font-weight: bold;
            font-size: 14px;
          }
        }

        .camera-view {
          position: relative;
          width: 100%;
          padding-bottom: 75%; // 4:3 宽高比
          background-image: url('https://ns-strategy.cdn.bcebos.com/ns-strategy/upload/fc_big_pic/part-00203-2682.jpg');
          background-size: cover;
          background-position: center;

          .video-placeholder {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: rgba(255, 255, 255, 0.7);
            font-size: 48px;
            background: rgba(0, 0, 0, 0.3);

            p {
              margin-top: 10px;
              font-size: 14px;
            }
          }

          .hazard-box {
            position: absolute;
            border: 3px solid;
            border-radius: 4px;
            box-sizing: border-box;
            transition: all 0.3s ease;

            &.hazard-box-safe {
              border-color: #67c23a;
            }

            &.hazard-box-observe {
              border-color: #409eff;
            }

            &.hazard-box-warning {
              border-color: #e6a23c;
              animation: pulse 1.5s infinite;
            }

            &.hazard-box-alarm {
              border-color: #f56c6c;
              animation: blink 1s infinite;
            }

            .hazard-info {
              position: absolute;
              bottom: -70px;
              left: 0;
              background: rgba(0, 0, 0, 0.85);
              color: #fff;
              padding: 8px 12px;
              border-radius: 4px;
              font-size: 12px;
              white-space: nowrap;
              z-index: 10;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

              .hazard-type {
                font-weight: bold;
                margin-bottom: 3px;
                font-size: 13px;
              }

              .hazard-confidence {
                margin-bottom: 5px;
                color: #e0e0e0;
              }
            }
          }

          @keyframes blink {
            0%, 100% {
              border-color: #f56c6c;
              box-shadow: 0 0 10px #f56c6c;
            }
            50% {
              border-color: #fff;
              box-shadow: 0 0 20px #f56c6c;
            }
          }

          @keyframes pulse {
            0%, 100% {
              border-color: #e6a23c;
              box-shadow: 0 0 5px #e6a23c;
            }
            50% {
              border-color: #f0ad4e;
              box-shadow: 0 0 15px #e6a23c;
            }
          }
        }

        .camera-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          background: #f5f7fa;
          border-top: 1px solid #dcdfe6;
          gap: 10px;

          .camera-location {
            font-size: 12px;
            color: #606266;
            flex: 1;
          }
        }
      }
    }

    // 传感器卡片样式
    .sensor-card {
      margin-bottom: 20px;
      height: calc(100vh - 260px);

      .sensor-list {
        height: calc(100vh - 340px);
        overflow-y: auto;

        .sensor-item {
          padding: 15px;
          margin-bottom: 15px;
          border: 1px solid #dcdfe6;
          border-radius: 8px;
          background: #f9fafc;
          transition: all 0.3s ease;

          &:hover {
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
          }

          .sensor-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;

            .sensor-location {
              font-weight: bold;
              font-size: 15px;
              color: #303133;
            }
          }

          .sensor-data {
            .data-item {
              margin-bottom: 12px;

              .data-label {
                display: block;
                font-size: 13px;
                color: #606266;
                margin-bottom: 5px;
              }

              .data-value-wrapper {
                display: flex;
                align-items: center;
                gap: 10px;

                :deep(.el-progress) {
                  flex: 1;
                }

                .data-value {
                  font-weight: bold;
                  font-size: 14px;
                  min-width: 80px;
                  text-align: right;
                }
              }
            }
          }

          .sensor-footer {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #e4e7ed;
            text-align: right;

            .update-time {
              font-size: 12px;
              color: #909399;
            }
          }
        }
      }
    }

    // 预警卡片样式
    .alert-card {
      height: calc(100vh - 260px);

      .alert-list {
        height: calc(100vh - 340px);
        overflow-y: auto;

        .alert-item {
          padding: 15px;
          margin-bottom: 10px;
          border: 1px solid #dcdfe6;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          background: #fff;

          &:hover {
            background: #f5f7fa;
            border-color: #409eff;
            box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
          }

          &.handled {
            opacity: 0.65;
          }

          .alert-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;

            .alert-time {
              font-size: 12px;
              color: #909399;
            }
          }

          .alert-content {
            display: flex;
            gap: 12px;
            margin-bottom: 12px;

            .alert-icon {
              font-size: 32px;
              line-height: 1;
            }

            .alert-info {
              flex: 1;

              .alert-type {
                font-weight: bold;
                font-size: 15px;
                margin-bottom: 5px;
                color: #303133;
              }

              .alert-location {
                font-size: 13px;
                color: #606266;
                margin-bottom: 5px;

                i {
                  margin-right: 4px;
                }
              }

              .alert-description {
                font-size: 12px;
                color: #909399;
              }
            }
          }

          .alert-footer {
            display: flex;
            justify-content: flex-end;
          }
        }
      }
    }
  }

  // 隐患记录样式
  .records-view {
    .filter-bar {
      margin-bottom: 20px;
    }
  }

  // 统计分析样式
  .statistics-view {
    .chart-placeholder {
      padding: 20px;

      .type-stat,
      .level-stat,
      .status-stat {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 20px;

        .type-icon {
          font-size: 24px;
          width: 40px;
          text-align: center;
        }

        .type-label,
        .level-label,
        .status-label {
          min-width: 100px;
          font-weight: 500;
          color: #303133;
        }

        :deep(.el-progress) {
          flex: 1;
        }

        .type-count,
        .level-count,
        .status-count {
          min-width: 60px;
          text-align: right;
          font-weight: bold;
          color: #606266;
        }
      }
    }
  }

  // 对话框样式
  .alert-detail {
    .alert-handle-form {
      margin-top: 20px;

      h4 {
        margin-bottom: 10px;
        color: #303133;
      }
    }
  }

  .form-item-tip {
    display: block;
    margin-top: 5px;
    font-size: 12px;
    color: #909399;
    line-height: 1.5;
  }
}
</style>