<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'

// 类型定义
interface MonitorCamera {
  id: string
  name: string
  location: string
  status: 'online' | 'offline'
  videoUrl: string
}

interface ViolationBehavior {
  id: string
  cameraId: string
  type: string
  confidence: number
  level: 'high' | 'medium' | 'low'
  position: { x: number; y: number; width: number; height: number }
  timestamp: string
}

interface AlertInfo {
  id: string
  time: string
  location: string
  type: string
  level: 'high' | 'medium' | 'low'
  status: 'pending' | 'processing' | 'completed'
  description: string
  responseTime?: string
}

interface ViolationRecord {
  id: string
  time: string
  location: string
  type: string
  status: 'pending' | 'processing' | 'completed'
  handler?: string
  result?: string
}

interface DetectionConfig {
  sensitivity: number
  autoAlert: boolean
  detectionTypes: {
    climbing: boolean
    dangerousTransport: boolean
    equipmentMisuse: boolean
    noHelmet: boolean
    restrictedArea: boolean
  }
}

interface Statistics {
  todayTotal: number
  todayHandled: number
  monthlyTrend: number
  commonType: string
}

// 响应式数据
const loading = ref(false)
const cameras = ref<MonitorCamera[]>([])
const activeCamera = ref<string>('')
const currentViolations = ref<ViolationBehavior[]>([])
const alerts = ref<AlertInfo[]>([])
const records = ref<ViolationRecord[]>([])
const statistics = ref<Statistics>({
  todayTotal: 0,
  todayHandled: 0,
  monthlyTrend: 0,
  commonType: ''
})

const config = ref<DetectionConfig>({
  sensitivity: 75,
  autoAlert: true,
  detectionTypes: {
    climbing: true,
    dangerousTransport: true,
    equipmentMisuse: true,
    noHelmet: true,
    restrictedArea: true
  }
})

// 查询条件
const queryForm = ref({
  dateRange: [] as string[],
  violationType: ''
})

const violationTypes = [
  { label: '违规攀爬', value: 'climbing' },
  { label: '危险搬运', value: 'dangerous_transport' },
  { label: '设备误操作', value: 'equipment_misuse' },
  { label: '未佩戴安全帽', value: 'no_helmet' },
  { label: '进入禁区', value: 'restricted_area' }
]

let simulationTimer: number | null = null

// Mock 数据生成
const generateMockCameras = (): MonitorCamera[] => {
  return [
    {
      id: 'cam_001',
      name: '1号摄像头',
      location: 'A区-货架区域',
      status: 'online',
      videoUrl: '/mock/video1.mp4'
    },
    {
      id: 'cam_002',
      name: '2号摄像头',
      location: 'B区-装卸区域',
      status: 'online',
      videoUrl: '/mock/video2.mp4'
    },
    {
      id: 'cam_003',
      name: '3号摄像头',
      location: 'C区-存储区域',
      status: 'online',
      videoUrl: '/mock/video3.mp4'
    },
    {
      id: 'cam_004',
      name: '4号摄像头',
      location: 'D区-通道区域',
      status: 'offline',
      videoUrl: '/mock/video4.mp4'
    }
  ]
}

const generateMockAlerts = (): AlertInfo[] => {
  const types = ['违规攀爬', '危险搬运', '设备误操作', '未佩戴安全帽', '进入禁区']
  const levels: ('high' | 'medium' | 'low')[] = ['high', 'medium', 'low']
  const statuses: ('pending' | 'processing' | 'completed')[] = ['pending', 'processing', 'completed']
  const locations = ['A区-货架区域', 'B区-装卸区域', 'C区-存储区域', 'D区-通道区域']

  return Array.from({ length: 8 }, (_, i) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    return {
      id: `alert_${Date.now()}_${i}`,
      time: new Date(Date.now() - Math.random() * 3600000).toLocaleString('zh-CN'),
      location: locations[Math.floor(Math.random() * locations.length)],
      type: types[Math.floor(Math.random() * types.length)],
      level: levels[Math.floor(Math.random() * levels.length)],
      status,
      description: '检测到异常操作行为，请及时处理',
      responseTime: status === 'completed' ? `${Math.floor(Math.random() * 20 + 1)}分钟` : undefined
    }
  })
}

const generateMockRecords = (): ViolationRecord[] => {
  const types = ['违规攀爬', '危险搬运', '设备误操作', '未佩戴安全帽', '进入禁区']
  const statuses: ('pending' | 'processing' | 'completed')[] = ['pending', 'processing', 'completed']
  const locations = ['A区-货架区域', 'B区-装卸区域', 'C区-存储区域', 'D区-通道区域']
  const handlers = ['张三', '李四', '王五', '赵六']

  return Array.from({ length: 50 }, (_, i) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    return {
      id: `record_${1000 + i}`,
      time: new Date(Date.now() - Math.random() * 7 * 24 * 3600000).toLocaleString('zh-CN'),
      location: locations[Math.floor(Math.random() * locations.length)],
      type: types[Math.floor(Math.random() * types.length)],
      status,
      handler: status !== 'pending' ? handlers[Math.floor(Math.random() * handlers.length)] : undefined,
      result: status === 'completed' ? '已处理，已对相关人员进行安全教育' : undefined
    }
  }).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
}

const generateMockStatistics = (): Statistics => {
  return {
    todayTotal: Math.floor(Math.random() * 30 + 10),
    todayHandled: Math.floor(Math.random() * 20 + 5),
    monthlyTrend: Math.floor(Math.random() * 20 - 10),
    commonType: '未佩戴安全帽'
  }
}

// 模拟实时违规检测
const simulateViolationDetection = () => {
  if (Math.random() > 0.7 && currentViolations.value.length < 3) {
    const types = ['违规攀爬', '危险搬运', '设备误操作', '未佩戴安全帽', '进入禁区']
    const levels: ('high' | 'medium' | 'low')[] = ['high', 'medium', 'low']
    const level = levels[Math.floor(Math.random() * levels.length)]
    
    const violation: ViolationBehavior = {
      id: `vio_${Date.now()}`,
      cameraId: activeCamera.value || cameras.value[0]?.id,
      type: types[Math.floor(Math.random() * types.length)],
      confidence: Math.random() * 0.3 + 0.7, // 70%-100%
      level,
      position: {
        x: Math.random() * 60 + 10,
        y: Math.random() * 60 + 10,
        width: Math.random() * 15 + 10,
        height: Math.random() * 15 + 10
      },
      timestamp: new Date().toLocaleString('zh-CN')
    }

    currentViolations.value.push(violation)

    // 生成预警
    if (config.value.autoAlert) {
      const newAlert: AlertInfo = {
        id: `alert_${Date.now()}`,
        time: new Date().toLocaleString('zh-CN'),
        location: cameras.value.find(c => c.id === violation.cameraId)?.location || '未知位置',
        type: violation.type,
        level: violation.level,
        status: 'pending',
        description: `检测到${violation.type}，置信度：${(violation.confidence * 100).toFixed(1)}%`
      }
      alerts.value.unshift(newAlert)
      
      if (alerts.value.length > 10) {
        alerts.value = alerts.value.slice(0, 10)
      }
    }

    // 5秒后移除违规标注
    setTimeout(() => {
      currentViolations.value = currentViolations.value.filter(v => v.id !== violation.id)
    }, 5000)
  }
}

// 加载数据
const loadData = () => {
  loading.value = true
  setTimeout(() => {
    cameras.value = generateMockCameras()
    activeCamera.value = cameras.value[0]?.id
    alerts.value = generateMockAlerts()
    records.value = generateMockRecords()
    statistics.value = generateMockStatistics()
    loading.value = false
  }, 800)
}

// 切换摄像头
const switchCamera = (cameraId: string) => {
  activeCamera.value = cameraId
  currentViolations.value = []
  ElMessage.success('已切换摄像头')
}

// 处理预警
const handleAlert = (alert: AlertInfo) => {
  alert.status = 'processing'
  ElMessage.success('预警已标记为处理中')
  
  // 模拟处理完成
  setTimeout(() => {
    alert.status = 'completed'
    alert.responseTime = '5分钟'
    statistics.value.todayHandled++
    ElMessage.success('预警处理完成')
  }, 3000)
}

// 处理违规记录
const handleRecord = (record: ViolationRecord) => {
  record.status = 'processing'
  ElMessage.success('记录已标记为处理中')
  
  setTimeout(() => {
    record.status = 'completed'
    record.handler = '当前用户'
    record.result = '已处理，已对相关人员进行安全教育'
    ElMessage.success('记录处理完成')
  }, 2000)
}

// 查看详情
const viewDetail = (record: ViolationRecord) => {
  ElMessage.info(`查看记录详情：${record.id}`)
}

// 查询记录
const queryRecords = () => {
  loading.value = true
  setTimeout(() => {
    // 模拟筛选
    records.value = generateMockRecords()
    loading.value = false
    ElMessage.success('查询完成')
  }, 500)
}

// 重置查询
const resetQuery = () => {
  queryForm.value = {
    dateRange: [],
    violationType: ''
  }
  queryRecords()
}

// 导出记录
const exportRecords = () => {
  ElMessage.success('导出功能开发中...')
}

// 测试识别规则
const testDetection = () => {
  ElMessage.info('正在测试识别规则...')
  setTimeout(() => {
    ElMessage.success('识别规则测试通过')
  }, 1500)
}

// 保存配置
const saveConfig = () => {
  ElMessage.success('配置已保存')
}

// 获取预警级别颜色
const getAlertLevelColor = (level: string) => {
  const colors = {
    high: '#f56c6c',
    medium: '#e6a23c',
    low: '#f0c639'
  }
  return colors[level as keyof typeof colors] || '#909399'
}

// 获取预警级别标签
const getAlertLevelLabel = (level: string) => {
  const labels = {
    high: '高危',
    medium: '中危',
    low: '低危'
  }
  return labels[level as keyof typeof labels] || '未知'
}

// 获取状态类型
const getStatusType = (status: string) => {
  const types = {
    pending: 'danger',
    processing: 'primary',
    completed: 'success'
  }
  return types[status as keyof typeof types] || 'info'
}

// 获取状态标签
const getStatusLabel = (status: string) => {
  const labels = {
    pending: '待处理',
    processing: '处理中',
    completed: '已处理'
  }
  return labels[status as keyof typeof labels] || '未知'
}

// 生命周期
onMounted(() => {
  loadData()
  // 启动模拟检测
  simulationTimer = window.setInterval(() => {
    simulateViolationDetection()
  }, 3000)
})

onUnmounted(() => {
  if (simulationTimer) {
    clearInterval(simulationTimer)
  }
})
</script>

<template>
  <div class="violation-ops-container">
    <!-- 顶部统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-label">今日检测违规</div>
            <div class="stat-value">{{ statistics.todayTotal }}</div>
            <div class="stat-sub">次</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-label">今日已处理</div>
            <div class="stat-value">{{ statistics.todayHandled }}</div>
            <div class="stat-sub">次</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-label">月度趋势</div>
            <div class="stat-value" :style="{ color: statistics.monthlyTrend > 0 ? '#f56c6c' : '#67c23a' }">
              {{ statistics.monthlyTrend > 0 ? '+' : '' }}{{ statistics.monthlyTrend }}%
            </div>
            <div class="stat-sub">较上月</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-label">常见违规类型</div>
            <div class="stat-value" style="font-size: 18px">{{ statistics.commonType }}</div>
            <div class="stat-sub">高频</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 主要内容区域 -->
    <el-row :gutter="16" class="main-content">
      <!-- 左侧：监控视图 -->
      <el-col :span="12">
        <el-card shadow="hover" class="monitor-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">实时监控视图</span>
              <el-tag type="success" size="small">
                <span class="status-dot"></span>
                监控中
              </el-tag>
            </div>
          </template>

          <!-- 摄像头切换 -->
          <div class="camera-tabs">
            <el-button
              v-for="camera in cameras"
              :key="camera.id"
              :type="activeCamera === camera.id ? 'primary' : 'default'"
              size="small"
              @click="switchCamera(camera.id)"
              :disabled="camera.status === 'offline'"
            >
              {{ camera.name }}
              <el-tag
                :type="camera.status === 'online' ? 'success' : 'danger'"
                size="small"
                style="margin-left: 8px"
              >
                {{ camera.status === 'online' ? '在线' : '离线' }}
              </el-tag>
            </el-button>
          </div>

          <!-- 视频监控画面 -->
          <div class="video-container">
            <div class="video-placeholder">
              <div class="video-info">
                <div class="location-info">
                  <i class="el-icon-location"></i>
                  {{ cameras.find(c => c.id === activeCamera)?.location }}
                </div>
                <div class="time-info">
                  {{ new Date().toLocaleString('zh-CN') }}
                </div>
              </div>
              
              <!-- 模拟视频画面 -->
              <div class="video-scene"></div>

              <!-- 违规行为标注 -->
              <div
                v-for="violation in currentViolations.filter(v => v.cameraId === activeCamera)"
                :key="violation.id"
                class="violation-box"
                :style="{
                  left: violation.position.x + '%',
                  top: violation.position.y + '%',
                  width: violation.position.width + '%',
                  height: violation.position.height + '%',
                  borderColor: getAlertLevelColor(violation.level)
                }"
              >
                <div class="violation-label" :style="{ backgroundColor: getAlertLevelColor(violation.level) }">
                  {{ violation.type }} ({{ (violation.confidence * 100).toFixed(1) }}%)
                </div>
              </div>
            </div>
          </div>

          <!-- 当前违规行为列表 -->
          <div v-if="currentViolations.length > 0" class="current-violations">
            <el-alert
              v-for="violation in currentViolations"
              :key="violation.id"
              :type="violation.level === 'high' ? 'error' : violation.level === 'medium' ? 'warning' : 'info'"
              :title="`检测到${violation.type}`"
              :description="`位置：${cameras.find(c => c.id === violation.cameraId)?.location} | 置信度：${(violation.confidence * 100).toFixed(1)}%`"
              show-icon
              style="margin-top: 10px"
            />
          </div>
        </el-card>
      </el-col>

      <!-- 中间：实时预警信息 -->
      <el-col :span="6">
        <el-card shadow="hover" class="alert-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">实时预警</span>
              <el-tag type="warning" size="small">{{ alerts.filter(a => a.status === 'pending').length }} 待处理</el-tag>
            </div>
          </template>

          <div class="alert-list">
            <div
              v-for="alert in alerts"
              :key="alert.id"
              class="alert-item"
              :class="{ 'alert-handled': alert.status === 'completed' }"
            >
              <div class="alert-header">
                <el-tag :type="getStatusType(alert.status)" size="small">
                  {{ getStatusLabel(alert.status) }}
                </el-tag>
                <div
                  class="alert-level"
                  :style="{ backgroundColor: getAlertLevelColor(alert.level) }"
                >
                  {{ getAlertLevelLabel(alert.level) }}
                </div>
              </div>
              <div class="alert-type">{{ alert.type }}</div>
              <div class="alert-location">
                <i class="el-icon-location"></i>
                {{ alert.location }}
              </div>
              <div class="alert-time">{{ alert.time }}</div>
              <div class="alert-desc">{{ alert.description }}</div>
              <div v-if="alert.responseTime" class="alert-response">
                响应时间：{{ alert.responseTime }}
              </div>
              <el-button
                v-if="alert.status === 'pending'"
                type="primary"
                size="small"
                style="margin-top: 8px; width: 100%"
                @click="handleAlert(alert)"
              >
                处理预警
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：配置和统计 -->
      <el-col :span="6">
        <el-card shadow="hover" class="config-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">识别配置</span>
              <el-button type="primary" size="small" @click="saveConfig">保存</el-button>
            </div>
          </template>

          <div class="config-content">
            <div class="config-item">
              <div class="config-label">检测敏感度</div>
              <el-slider v-model="config.sensitivity" :min="0" :max="100" show-input />
            </div>

            <div class="config-item">
              <div class="config-label">自动预警</div>
              <el-switch v-model="config.autoAlert" />
            </div>

            <div class="config-item">
              <div class="config-label">检测类型</div>
              <div class="detection-types">
                <div class="detection-type-item">
                  <el-switch v-model="config.detectionTypes.climbing" size="small" />
                  <span>违规攀爬</span>
                </div>
                <div class="detection-type-item">
                  <el-switch v-model="config.detectionTypes.dangerousTransport" size="small" />
                  <span>危险搬运</span>
                </div>
                <div class="detection-type-item">
                  <el-switch v-model="config.detectionTypes.equipmentMisuse" size="small" />
                  <span>设备误操作</span>
                </div>
                <div class="detection-type-item">
                  <el-switch v-model="config.detectionTypes.noHelmet" size="small" />
                  <span>未佩戴安全帽</span>
                </div>
                <div class="detection-type-item">
                  <el-switch v-model="config.detectionTypes.restrictedArea" size="small" />
                  <span>进入禁区</span>
                </div>
              </div>
            </div>

            <el-button type="info" size="small" style="width: 100%; margin-top: 16px" @click="testDetection">
              测试识别规则
            </el-button>
          </div>
        </el-card>

        <!-- 处理进度 -->
        <el-card shadow="hover" class="progress-card" style="margin-top: 16px">
          <template #header>
            <span class="card-title">今日处理进度</span>
          </template>
          <el-progress
            :percentage="statistics.todayTotal > 0 ? Math.round((statistics.todayHandled / statistics.todayTotal) * 100) : 0"
            :color="statistics.todayHandled === statistics.todayTotal ? '#67c23a' : '#409eff'"
          />
          <div style="margin-top: 12px; text-align: center; color: #909399; font-size: 14px">
            已处理 {{ statistics.todayHandled }} / {{ statistics.todayTotal }}
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 违规记录查询 -->
    <el-card shadow="hover" class="record-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">违规记录查询</span>
          <el-button type="primary" size="small" @click="exportRecords">
            导出记录
          </el-button>
        </div>
      </template>

      <!-- 查询表单 -->
      <el-form :model="queryForm" inline class="query-form">
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="queryForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            size="default"
          />
        </el-form-item>
        <el-form-item label="违规类型">
          <el-select v-model="queryForm.violationType" placeholder="请选择" clearable size="default">
            <el-option
              v-for="type in violationTypes"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="queryRecords">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 记录表格 -->
      <el-table :data="records" v-loading="loading" stripe border style="width: 100%">
        <el-table-column prop="id" label="记录编号" width="120" />
        <el-table-column prop="time" label="违规时间" width="180" />
        <el-table-column prop="location" label="监控位置" width="150" />
        <el-table-column prop="type" label="违规类型" width="140">
          <template #default="{ row }">
            <el-tag type="warning">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="处理状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="handler" label="处理人" width="100" />
        <el-table-column prop="result" label="处理结果" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewDetail(row)">
              详情
            </el-button>
            <el-button
              v-if="row.status === 'pending'"
              type="success"
              size="small"
              @click="handleRecord(row)"
            >
              处理
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.violation-ops-container {

  .stats-row {
    margin-bottom: 16px;
  }

  .stat-card {
    .stat-content {
      text-align: center;
      
      .stat-label {
        font-size: 14px;
        color: #909399;
        margin-bottom: 8px;
      }
      
      .stat-value {
        font-size: 32px;
        font-weight: bold;
        color: #409eff;
        margin-bottom: 4px;
      }
      
      .stat-sub {
        font-size: 12px;
        color: #c0c4cc;
      }
    }
  }

  .main-content {
    margin-bottom: 16px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .card-title {
      font-size: 16px;
      font-weight: bold;
      color: #303133;
    }
  }

  .status-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #67c23a;
    margin-right: 4px;
    animation: blink 1.5s infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  .monitor-card {
    height: 100%;
    
    .camera-tabs {
      margin-bottom: 16px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    
    .video-container {
      .video-placeholder {
        position: relative;
        width: 100%;
        height: 400px;
        background-image: url('https://img1.baidu.com/it/u=4247703827,2989654601&fm=253&fmt=auto&app=138&f=JPEG?w=889&h=500');
        border-radius: 8px;
        overflow: hidden;
        
        .video-info {
          position: absolute;
          top: 12px;
          left: 12px;
          right: 12px;
          display: flex;
          justify-content: space-between;
          z-index: 10;
          
          .location-info,
          .time-info {
            background: rgba(0, 0, 0, 0.6);
            padding: 6px 12px;
            border-radius: 4px;
            color: #fff;
            font-size: 12px;
          }
        }
        
        .video-scene {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 30% 40%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                      radial-gradient(circle at 70% 60%, rgba(255, 255, 255, 0.08) 0%, transparent 50%);
        }
        
        .violation-box {
          position: absolute;
          border: 3px solid;
          border-radius: 4px;
          animation: pulse 1s infinite;
          z-index: 5;
          
          .violation-label {
            position: absolute;
            top: -26px;
            left: 0;
            padding: 4px 8px;
            color: #fff;
            font-size: 12px;
            border-radius: 4px;
            white-space: nowrap;
          }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      }
    }
    
    .current-violations {
      margin-top: 16px;
    }
  }

  .alert-card {
    height: 100%;
    
    .alert-list {
      max-height: 600px;
      overflow-y: auto;
      
      .alert-item {
        padding: 12px;
        margin-bottom: 12px;
        border: 1px solid #e4e7ed;
        border-radius: 8px;
        background: #fff;
        transition: all 0.3s;
        
        &:hover {
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        }
        
        &.alert-handled {
          opacity: 0.7;
          background: #f5f7fa;
        }
        
        .alert-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          
          .alert-level {
            padding: 2px 8px;
            border-radius: 4px;
            color: #fff;
            font-size: 12px;
          }
        }
        
        .alert-type {
          font-size: 16px;
          font-weight: bold;
          color: #303133;
          margin-bottom: 6px;
        }
        
        .alert-location {
          font-size: 13px;
          color: #606266;
          margin-bottom: 4px;
        }
        
        .alert-time {
          font-size: 12px;
          color: #909399;
          margin-bottom: 8px;
        }
        
        .alert-desc {
          font-size: 13px;
          color: #606266;
          line-height: 1.5;
        }
        
        .alert-response {
          font-size: 12px;
          color: #67c23a;
          margin-top: 4px;
        }
      }
    }
  }

  .config-card {
    .config-content {
      .config-item {
        margin-bottom: 24px;
        
        .config-label {
          font-size: 14px;
          color: #606266;
          margin-bottom: 12px;
          font-weight: 500;
        }
        
        .detection-types {
          .detection-type-item {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
            
            span {
              font-size: 14px;
              color: #606266;
            }
          }
        }
      }
    }
  }

  .progress-card {
    .card-title {
      font-size: 14px;
      font-weight: 500;
      color: #606266;
    }
  }

  .record-card {
    .query-form {
      margin-bottom: 16px;
    }
  }
}
</style>