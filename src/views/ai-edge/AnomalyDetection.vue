<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import {
  VideoCamera,
  Warning,
  BellFilled,
  Setting,
  DocumentCopy,
  CircleCheck,
  CircleClose,
  Clock,
  View,
  EditPen,
  Delete,
  Plus,
  RefreshRight,
  TrendCharts
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 告警级别类型
type AlertLevel = 'critical' | 'important' | 'normal' | 'info'
// 处理状态类型
type ProcessStatus = 'pending' | 'processing' | 'completed' | 'false_alarm'
// 异常类型
type AnomalyType = 'intrusion' | 'behavior' | 'environment' | 'equipment' | 'safety'
// 响应方式
type ResponseType = 'alarm' | 'notification' | 'device_link' | 'record'

// 视频监控接口
interface VideoMonitor {
  id: string
  name: string
  location: string
  status: 'active' | 'inactive'
  hasAnomaly: boolean
  anomalyType?: string
  confidence?: number
  anomalyRegion?: { x: number; y: number; width: number; height: number }
}

// 告警信息接口
interface AlertInfo {
  id: string
  videoId: string
  videoName: string
  type: AnomalyType
  level: AlertLevel
  status: ProcessStatus
  description: string
  confidence: number
  location: string
  timestamp: string
  responseTime?: number
  processResult?: string
  operator?: string
}

// 响应规则接口
interface ResponseRule {
  id: string
  name: string
  anomalyType: AnomalyType
  level: AlertLevel
  responseTypes: ResponseType[]
  priority: number
  enabled: boolean
  conditions: string
}

// 异常规则接口
interface AnomalyRule {
  id: string
  name: string
  type: AnomalyType
  description: string
  sensitivity: number
  confidenceThreshold: number
  enabled: boolean
  detectArea: string
  createdAt: string
}

// 效果分析接口
interface EffectAnalysis {
  totalAlerts: number
  accuracyRate: number
  avgResponseTime: number
  manualInterventionRate: number
  falseAlarmRate: number
  processingRate: number
}

// 视频监控数据
const videoMonitors = ref<VideoMonitor[]>([])

// 告警列表数据
const alertList = ref<AlertInfo[]>([])
const alertFilter = reactive({
  level: '',
  status: '',
  type: ''
})

// 响应规则数据
const responseRules = ref<ResponseRule[]>([])
const showResponseDialog = ref(false)
const currentResponseRule = ref<Partial<ResponseRule>>({})

// 异常规则数据
const anomalyRules = ref<AnomalyRule[]>([])
const showRuleDialog = ref(false)
const currentRule = ref<Partial<AnomalyRule>>({})

// 效果分析数据
const effectAnalysis = ref<EffectAnalysis>({
  totalAlerts: 0,
  accuracyRate: 0,
  avgResponseTime: 0,
  manualInterventionRate: 0,
  falseAlarmRate: 0,
  processingRate: 0
})

// 当前选中的告警
const selectedAlert = ref<AlertInfo | null>(null)
const showAlertDetail = ref(false)

// 页面加载状态
const loading = ref(true)

// 实时刷新定时器
let refreshTimer: ReturnType<typeof setInterval> | null = null

// 初始化视频监控数据
const initVideoMonitors = () => {
  const locations = ['东门入口', '西门广场', '停车场A区', '仓库1号', '生产车间', '办公楼大厅']
  videoMonitors.value = locations.map((location, index) => ({
    id: `video-${index + 1}`,
    name: `摄像头-${index + 1}`,
    location,
    status: 'active',
    hasAnomaly: Math.random() > 0.7,
    anomalyType: ['区域闯入', '异常行为', '环境变化'][Math.floor(Math.random() * 3)],
    confidence: Math.floor(Math.random() * 30 + 70),
    anomalyRegion: {
      x: Math.random() * 60 + 10,
      y: Math.random() * 60 + 10,
      width: Math.random() * 20 + 15,
      height: Math.random() * 20 + 15
    }
  }))
}

// 初始化告警数据
const initAlertList = () => {
  const types: AnomalyType[] = ['intrusion', 'behavior', 'environment', 'equipment', 'safety']
  const levels: AlertLevel[] = ['critical', 'important', 'normal', 'info']
  const statuses: ProcessStatus[] = ['pending', 'processing', 'completed', 'false_alarm']

  alertList.value = Array.from({ length: 15 }, (_, i) => {
    const timestamp = new Date(Date.now() - Math.random() * 3600000 * 24)
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    return {
      id: `alert-${i + 1}`,
      videoId: `video-${Math.floor(Math.random() * 6) + 1}`,
      videoName: `摄像头-${Math.floor(Math.random() * 6) + 1}`,
      type: types[Math.floor(Math.random() * types.length)],
      level: levels[Math.floor(Math.random() * levels.length)],
      status,
      description: ['检测到非授权人员闯入', '发现异常行为活动', '环境参数超出阈值', '设备运行异常', '安全隐患'][
        Math.floor(Math.random() * 5)
      ],
      confidence: Math.floor(Math.random() * 30 + 70),
      location: ['东门入口', '西门广场', '停车场A区', '仓库1号', '生产车间', '办公楼大厅'][
        Math.floor(Math.random() * 6)
      ],
      timestamp: timestamp.toLocaleString(),
      responseTime: status !== 'pending' ? Math.floor(Math.random() * 300 + 30) : undefined,
      processResult: status === 'completed' ? '已处理，情况正常' : status === 'false_alarm' ? '误报' : undefined,
      operator: status !== 'pending' ? ['张三', '李四', '王五'][Math.floor(Math.random() * 3)] : undefined
    }
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

// 初始化响应规则
const initResponseRules = () => {
  responseRules.value = [
    {
      id: 'rule-1',
      name: '紧急入侵响应',
      anomalyType: 'intrusion',
      level: 'critical',
      responseTypes: ['alarm', 'notification', 'device_link', 'record'],
      priority: 1,
      enabled: true,
      conditions: '置信度>90%且发生在敏感区域'
    },
    {
      id: 'rule-2',
      name: '异常行为告警',
      anomalyType: 'behavior',
      level: 'important',
      responseTypes: ['notification', 'record'],
      priority: 2,
      enabled: true,
      conditions: '置信度>80%'
    },
    {
      id: 'rule-3',
      name: '环境变化通知',
      anomalyType: 'environment',
      level: 'normal',
      responseTypes: ['notification'],
      priority: 3,
      enabled: true,
      conditions: '连续检测到3次以上'
    }
  ]
}

// 初始化异常规则
const initAnomalyRules = () => {
  anomalyRules.value = [
    {
      id: 'anomaly-1',
      name: '禁区闯入检测',
      type: 'intrusion',
      description: '检测非授权人员进入限制区域',
      sensitivity: 85,
      confidenceThreshold: 90,
      enabled: true,
      detectArea: '仓库区域、生产车间',
      createdAt: '2024-01-15 10:30:00'
    },
    {
      id: 'anomaly-2',
      name: '异常行为识别',
      type: 'behavior',
      description: '识别打架、跌倒、聚集等异常行为',
      sensitivity: 75,
      confidenceThreshold: 80,
      enabled: true,
      detectArea: '全区域',
      createdAt: '2024-01-16 14:20:00'
    },
    {
      id: 'anomaly-3',
      name: '烟雾火焰检测',
      type: 'safety',
      description: '检测烟雾、火焰等安全隐患',
      sensitivity: 95,
      confidenceThreshold: 95,
      enabled: true,
      detectArea: '全区域',
      createdAt: '2024-01-17 09:00:00'
    }
  ]
}

// 初始化效果分析数据
const initEffectAnalysis = () => {
  setTimeout(() => {
    effectAnalysis.value = {
      totalAlerts: 1247,
      accuracyRate: 94.5,
      avgResponseTime: 45,
      manualInterventionRate: 12.3,
      falseAlarmRate: 5.5,
      processingRate: 98.2
    }
  }, 500)
}

// 获取告警级别配置
const getAlertLevelConfig = (level: AlertLevel) => {
  const configs = {
    critical: { text: '紧急', type: 'danger' as const },
    important: { text: '重要', type: 'warning' as const },
    normal: { text: '一般', type: '' as const },
    info: { text: '提示', type: 'info' as const }
  }
  return configs[level]
}

// 获取处理状态配置
const getProcessStatusConfig = (status: ProcessStatus) => {
  const configs = {
    pending: { text: '待处理', type: 'danger' as const },
    processing: { text: '处理中', type: 'primary' as const },
    completed: { text: '已处理', type: 'success' as const },
    false_alarm: { text: '误报', type: 'info' as const }
  }
  return configs[status]
}

// 获取异常类型文本
const getAnomalyTypeText = (type: AnomalyType) => {
  const texts = {
    intrusion: '区域闯入',
    behavior: '行为异常',
    environment: '环境变化',
    equipment: '设备异常',
    safety: '安全隐患'
  }
  return texts[type]
}

// 获取响应类型文本
const getResponseTypeText = (type: ResponseType) => {
  const texts = {
    alarm: '声光报警',
    notification: '消息推送',
    device_link: '设备联动',
    record: '录像存档'
  }
  return texts[type]
}

// 筛选告警列表
const filteredAlertList = ref<AlertInfo[]>([])
const filterAlerts = () => {
  filteredAlertList.value = alertList.value.filter((alert) => {
    if (alertFilter.level && alert.level !== alertFilter.level) return false
    if (alertFilter.status && alert.status !== alertFilter.status) return false
    if (alertFilter.type && alert.type !== alertFilter.type) return false
    return true
  })
}

// 查看告警详情
const viewAlertDetail = (alert: AlertInfo) => {
  selectedAlert.value = alert
  showAlertDetail.value = true
}

// 处理告警
const handleAlert = (alert: AlertInfo) => {
  ElMessageBox.prompt('请输入处理结果', '处理告警', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    inputPlaceholder: '请描述处理结果'
  })
    .then(({ value }) => {
      alert.status = 'completed'
      alert.processResult = value
      alert.operator = '当前用户'
      alert.responseTime = Math.floor(Math.random() * 300 + 30)
      ElMessage.success('告警处理成功')
      filterAlerts()
    })
    .catch(() => {})
}

// 标记为误报
const markFalseAlarm = (alert: AlertInfo) => {
  ElMessageBox.confirm('确认将此告警标记为误报？', '确认操作', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      alert.status = 'false_alarm'
      alert.processResult = '误报'
      alert.operator = '当前用户'
      ElMessage.success('已标记为误报')
      filterAlerts()
    })
    .catch(() => {})
}

// 添加/编辑响应规则
const editResponseRule = (rule?: ResponseRule) => {
  if (rule) {
    currentResponseRule.value = { ...rule }
  } else {
    currentResponseRule.value = {
      name: '',
      anomalyType: 'intrusion',
      level: 'critical',
      responseTypes: [],
      priority: 1,
      enabled: true,
      conditions: ''
    }
  }
  showResponseDialog.value = true
}

// 保存响应规则
const saveResponseRule = () => {
  if (!currentResponseRule.value.name) {
    ElMessage.warning('请输入规则名称')
    return
  }
  if (!currentResponseRule.value.responseTypes || currentResponseRule.value.responseTypes.length === 0) {
    ElMessage.warning('请选择至少一种响应方式')
    return
  }

  if (currentResponseRule.value.id) {
    const index = responseRules.value.findIndex((r) => r.id === currentResponseRule.value.id)
    if (index > -1) {
      responseRules.value[index] = currentResponseRule.value as ResponseRule
    }
    ElMessage.success('响应规则更新成功')
  } else {
    responseRules.value.push({
      ...currentResponseRule.value,
      id: `rule-${Date.now()}`
    } as ResponseRule)
    ElMessage.success('响应规则添加成功')
  }
  showResponseDialog.value = false
}

// 删除响应规则
const deleteResponseRule = (rule: ResponseRule) => {
  ElMessageBox.confirm('确认删除此响应规则？', '确认操作', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      const index = responseRules.value.findIndex((r) => r.id === rule.id)
      if (index > -1) {
        responseRules.value.splice(index, 1)
        ElMessage.success('删除成功')
      }
    })
    .catch(() => {})
}

// 添加/编辑异常规则
const editAnomalyRule = (rule?: AnomalyRule) => {
  if (rule) {
    currentRule.value = { ...rule }
  } else {
    currentRule.value = {
      name: '',
      type: 'intrusion',
      description: '',
      sensitivity: 80,
      confidenceThreshold: 85,
      enabled: true,
      detectArea: ''
    }
  }
  showRuleDialog.value = true
}

// 保存异常规则
const saveAnomalyRule = () => {
  if (!currentRule.value.name) {
    ElMessage.warning('请输入规则名称')
    return
  }

  if (currentRule.value.id) {
    const index = anomalyRules.value.findIndex((r) => r.id === currentRule.value.id)
    if (index > -1) {
      anomalyRules.value[index] = currentRule.value as AnomalyRule
    }
    ElMessage.success('异常规则更新成功')
  } else {
    anomalyRules.value.push({
      ...currentRule.value,
      id: `anomaly-${Date.now()}`,
      createdAt: new Date().toLocaleString()
    } as AnomalyRule)
    ElMessage.success('异常规则添加成功')
  }
  showRuleDialog.value = false
}

// 删除异常规则
const deleteAnomalyRule = (rule: AnomalyRule) => {
  ElMessageBox.confirm('确认删除此异常规则？', '确认操作', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      const index = anomalyRules.value.findIndex((r) => r.id === rule.id)
      if (index > -1) {
        anomalyRules.value.splice(index, 1)
        ElMessage.success('删除成功')
      }
    })
    .catch(() => {})
}

// 测试规则
const testRule = (rule: AnomalyRule) => {
  ElMessage.info('正在测试规则效果...')
  setTimeout(() => {
    ElMessage.success(`规则测试完成：检出率 ${Math.floor(Math.random() * 20 + 80)}%，误报率 ${Math.floor(Math.random() * 10 + 1)}%`)
  }, 1500)
}

// 刷新数据
const refreshData = () => {
  loading.value = true
  setTimeout(() => {
    initVideoMonitors()
    // 模拟新增告警
    if (Math.random() > 0.7) {
      const types: AnomalyType[] = ['intrusion', 'behavior', 'environment', 'equipment', 'safety']
      const levels: AlertLevel[] = ['critical', 'important', 'normal', 'info']
      const newAlert: AlertInfo = {
        id: `alert-${Date.now()}`,
        videoId: `video-${Math.floor(Math.random() * 6) + 1}`,
        videoName: `摄像头-${Math.floor(Math.random() * 6) + 1}`,
        type: types[Math.floor(Math.random() * types.length)],
        level: levels[Math.floor(Math.random() * levels.length)],
        status: 'pending',
        description: '检测到新的异常情况',
        confidence: Math.floor(Math.random() * 30 + 70),
        location: ['东门入口', '西门广场', '停车场A区'][Math.floor(Math.random() * 3)],
        timestamp: new Date().toLocaleString()
      }
      alertList.value.unshift(newAlert)
      if (newAlert.level === 'critical') {
        ElMessage.error(`紧急告警：${newAlert.description}`)
      }
    }
    filterAlerts()
    loading.value = false
  }, 1000)
}

// 页面加载
onMounted(() => {
  setTimeout(() => {
    initVideoMonitors()
    initAlertList()
    initResponseRules()
    initAnomalyRules()
    initEffectAnalysis()
    filterAlerts()
    loading.value = false
  }, 1000)

  // 启动实时刷新
  refreshTimer = setInterval(() => {
    refreshData()
  }, 30000) // 30秒刷新一次
})

// 页面卸载
onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<template>
  <div class="anomaly-detection-container" v-loading="loading">
    <!-- 顶部统计概览 -->
    <el-row :gutter="20" class="statistics-row">
      <el-col :span="4">
        <el-card shadow="hover">
          <el-statistic title="总告警数" :value="effectAnalysis.totalAlerts">
            <template #prefix>
              <el-icon color="#409EFF"><BellFilled /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover">
          <el-statistic title="识别准确率" :value="effectAnalysis.accuracyRate" suffix="%">
            <template #prefix>
              <el-icon color="#67C23A"><CircleCheck /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover">
          <el-statistic title="平均响应时间" :value="effectAnalysis.avgResponseTime" suffix="秒">
            <template #prefix>
              <el-icon color="#E6A23C"><Clock /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover">
          <el-statistic title="人工干预率" :value="effectAnalysis.manualInterventionRate" suffix="%">
            <template #prefix>
              <el-icon color="#909399"><EditPen /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover">
          <el-statistic title="误报率" :value="effectAnalysis.falseAlarmRate" suffix="%">
            <template #prefix>
              <el-icon color="#F56C6C"><Warning /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover">
          <el-statistic title="处理完成率" :value="effectAnalysis.processingRate" suffix="%">
            <template #prefix>
              <el-icon color="#409EFF"><TrendCharts /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- 主要内容区 -->
    <el-row :gutter="20" class="main-content-row">
      <!-- 左侧：实时视频监控 -->
      <el-col :span="8">
        <el-card class="video-monitor-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><VideoCamera /></el-icon> 实时视频监控</span>
              <el-button type="primary" size="small" :icon="RefreshRight" @click="refreshData">刷新</el-button>
            </div>
          </template>
          <div class="video-grid">
            <div v-for="video in videoMonitors" :key="video.id" class="video-item">
              <div class="video-frame" :class="{ 'has-anomaly': video.hasAnomaly }">
                <el-icon class="video-icon"><VideoCamera /></el-icon>
                <div class="video-info">
                  <div class="video-name">{{ video.name }}</div>
                  <div class="video-location">{{ video.location }}</div>
                </div>
                <!-- 异常标注 -->
                <div
                  v-if="video.hasAnomaly && video.anomalyRegion"
                  class="anomaly-region"
                  :style="{
                    left: video.anomalyRegion.x + '%',
                    top: video.anomalyRegion.y + '%',
                    width: video.anomalyRegion.width + '%',
                    height: video.anomalyRegion.height + '%'
                  }"
                >
                  <div class="anomaly-label">
                    {{ video.anomalyType }}
                    <br />
                    {{ video.confidence }}%
                  </div>
                </div>
                <!-- 异常标识 -->
                <div v-if="video.hasAnomaly" class="anomaly-badge">
                  <el-tag type="danger" size="small" effect="dark">
                    <el-icon><Warning /></el-icon> 异常
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 中间：告警信息列表 -->
      <el-col :span="10">
        <el-card class="alert-list-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><BellFilled /></el-icon> 告警信息列表</span>
            </div>
          </template>

          <!-- 筛选条件 -->
          <div class="filter-bar">
            <el-select v-model="alertFilter.level" placeholder="告警级别" clearable size="small" @change="filterAlerts">
              <el-option label="紧急" value="critical" />
              <el-option label="重要" value="important" />
              <el-option label="一般" value="normal" />
              <el-option label="提示" value="info" />
            </el-select>
            <el-select v-model="alertFilter.status" placeholder="处理状态" clearable size="small" @change="filterAlerts">
              <el-option label="待处理" value="pending" />
              <el-option label="处理中" value="processing" />
              <el-option label="已处理" value="completed" />
              <el-option label="误报" value="false_alarm" />
            </el-select>
            <el-select v-model="alertFilter.type" placeholder="异常类型" clearable size="small" @change="filterAlerts">
              <el-option label="区域闯入" value="intrusion" />
              <el-option label="行为异常" value="behavior" />
              <el-option label="环境变化" value="environment" />
              <el-option label="设备异常" value="equipment" />
              <el-option label="安全隐患" value="safety" />
            </el-select>
          </div>

          <!-- 告警列表 -->
          <div class="alert-list">
            <el-timeline>
              <el-timeline-item
                v-for="alert in filteredAlertList.slice(0, 10)"
                :key="alert.id"
                :timestamp="alert.timestamp"
                :color="getAlertLevelConfig(alert.level).type === 'danger' ? '#F56C6C' : '#409EFF'"
              >
                <el-card shadow="hover" class="alert-item">
                  <div class="alert-content">
                    <div class="alert-header">
                      <el-tag :type="getAlertLevelConfig(alert.level).type" size="small">
                        {{ getAlertLevelConfig(alert.level).text }}
                      </el-tag>
                      <el-tag :type="getProcessStatusConfig(alert.status).type" size="small">
                        {{ getProcessStatusConfig(alert.status).text }}
                      </el-tag>
                      <span class="alert-type">{{ getAnomalyTypeText(alert.type) }}</span>
                    </div>
                    <div class="alert-description">{{ alert.description }}</div>
                    <div class="alert-details">
                      <span>位置：{{ alert.location }}</span>
                      <span>置信度：{{ alert.confidence }}%</span>
                      <span v-if="alert.responseTime">响应：{{ alert.responseTime }}秒</span>
                    </div>
                    <div class="alert-actions">
                      <el-button type="primary" size="small" :icon="View" @click="viewAlertDetail(alert)">详情</el-button>
                      <el-button
                        v-if="alert.status === 'pending'"
                        type="success"
                        size="small"
                        :icon="CircleCheck"
                        @click="handleAlert(alert)"
                      >
                        处理
                      </el-button>
                      <el-button
                        v-if="alert.status === 'pending'"
                        type="warning"
                        size="small"
                        :icon="CircleClose"
                        @click="markFalseAlarm(alert)"
                      >
                        误报
                      </el-button>
                    </div>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：响应配置和规则管理 -->
      <el-col :span="6">
        <!-- 响应规则配置 -->
        <el-card class="response-config-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><Setting /></el-icon> 联动响应配置</span>
              <el-button type="primary" size="small" :icon="Plus" @click="editResponseRule()">添加</el-button>
            </div>
          </template>
          <div class="rule-list">
            <div v-for="rule in responseRules" :key="rule.id" class="rule-item">
              <div class="rule-header">
                <span class="rule-name">{{ rule.name }}</span>
                <el-switch v-model="rule.enabled" size="small" />
              </div>
              <div class="rule-info">
                <el-tag size="small">{{ getAnomalyTypeText(rule.anomalyType) }}</el-tag>
                <el-tag :type="getAlertLevelConfig(rule.level).type" size="small">
                  {{ getAlertLevelConfig(rule.level).text }}
                </el-tag>
                <el-tag type="info" size="small">优先级: {{ rule.priority }}</el-tag>
              </div>
              <div class="rule-response">
                <span v-for="type in rule.responseTypes" :key="type" class="response-tag">
                  {{ getResponseTypeText(type) }}
                </span>
              </div>
              <div class="rule-actions">
                <el-button type="primary" size="small" link :icon="EditPen" @click="editResponseRule(rule)">编辑</el-button>
                <el-button type="danger" size="small" link :icon="Delete" @click="deleteResponseRule(rule)">删除</el-button>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 异常规则管理 -->
        <el-card class="anomaly-rule-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><DocumentCopy /></el-icon> 异常规则管理</span>
              <el-button type="primary" size="small" :icon="Plus" @click="editAnomalyRule()">添加</el-button>
            </div>
          </template>
          <div class="rule-list">
            <div v-for="rule in anomalyRules" :key="rule.id" class="rule-item">
              <div class="rule-header">
                <span class="rule-name">{{ rule.name }}</span>
                <el-switch v-model="rule.enabled" size="small" />
              </div>
              <div class="rule-description">{{ rule.description }}</div>
              <div class="rule-params">
                <el-progress :percentage="rule.sensitivity" :stroke-width="6">
                  <span class="progress-label">敏感度</span>
                </el-progress>
                <el-progress :percentage="rule.confidenceThreshold" :stroke-width="6" :color="'#67C23A'">
                  <span class="progress-label">置信度阈值</span>
                </el-progress>
              </div>
              <div class="rule-actions">
                <el-button type="primary" size="small" link :icon="EditPen" @click="editAnomalyRule(rule)">编辑</el-button>
                <el-button type="success" size="small" link @click="testRule(rule)">测试</el-button>
                <el-button type="danger" size="small" link :icon="Delete" @click="deleteAnomalyRule(rule)">删除</el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 告警详情对话框 -->
    <el-dialog v-model="showAlertDetail" title="告警详情" width="600px">
      <el-descriptions v-if="selectedAlert" :column="2" border>
        <el-descriptions-item label="告警ID">{{ selectedAlert.id }}</el-descriptions-item>
        <el-descriptions-item label="视频源">{{ selectedAlert.videoName }}</el-descriptions-item>
        <el-descriptions-item label="异常类型">
          <el-tag>{{ getAnomalyTypeText(selectedAlert.type) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="告警级别">
          <el-tag :type="getAlertLevelConfig(selectedAlert.level).type">
            {{ getAlertLevelConfig(selectedAlert.level).text }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="处理状态">
          <el-tag :type="getProcessStatusConfig(selectedAlert.status).type">
            {{ getProcessStatusConfig(selectedAlert.status).text }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="置信度">{{ selectedAlert.confidence }}%</el-descriptions-item>
        <el-descriptions-item label="位置">{{ selectedAlert.location }}</el-descriptions-item>
        <el-descriptions-item label="时间">{{ selectedAlert.timestamp }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ selectedAlert.description }}</el-descriptions-item>
        <el-descriptions-item v-if="selectedAlert.responseTime" label="响应时间">
          {{ selectedAlert.responseTime }}秒
        </el-descriptions-item>
        <el-descriptions-item v-if="selectedAlert.operator" label="处理人">
          {{ selectedAlert.operator }}
        </el-descriptions-item>
        <el-descriptions-item v-if="selectedAlert.processResult" label="处理结果" :span="2">
          {{ selectedAlert.processResult }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 响应规则编辑对话框 -->
    <el-dialog v-model="showResponseDialog" :title="currentResponseRule.id ? '编辑响应规则' : '添加响应规则'" width="600px">
      <el-form :model="currentResponseRule" label-width="120px">
        <el-form-item label="规则名称">
          <el-input v-model="currentResponseRule.name" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="异常类型">
          <el-select v-model="currentResponseRule.anomalyType" placeholder="请选择">
            <el-option label="区域闯入" value="intrusion" />
            <el-option label="行为异常" value="behavior" />
            <el-option label="环境变化" value="environment" />
            <el-option label="设备异常" value="equipment" />
            <el-option label="安全隐患" value="safety" />
          </el-select>
        </el-form-item>
        <el-form-item label="告警级别">
          <el-select v-model="currentResponseRule.level" placeholder="请选择">
            <el-option label="紧急" value="critical" />
            <el-option label="重要" value="important" />
            <el-option label="一般" value="normal" />
            <el-option label="提示" value="info" />
          </el-select>
        </el-form-item>
        <el-form-item label="响应方式">
          <el-checkbox-group v-model="currentResponseRule.responseTypes">
            <el-checkbox label="alarm">声光报警</el-checkbox>
            <el-checkbox label="notification">消息推送</el-checkbox>
            <el-checkbox label="device_link">设备联动</el-checkbox>
            <el-checkbox label="record">录像存档</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="优先级">
          <el-input-number v-model="currentResponseRule.priority" :min="1" :max="10" />
        </el-form-item>
        <el-form-item label="执行条件">
          <el-input
            v-model="currentResponseRule.conditions"
            type="textarea"
            :rows="3"
            placeholder="请输入执行条件，如：置信度>90%且发生在敏感区域"
          />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="currentResponseRule.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showResponseDialog = false">取消</el-button>
        <el-button type="primary" @click="saveResponseRule">保存</el-button>
      </template>
    </el-dialog>

    <!-- 异常规则编辑对话框 -->
    <el-dialog v-model="showRuleDialog" :title="currentRule.id ? '编辑异常规则' : '添加异常规则'" width="600px">
      <el-form :model="currentRule" label-width="120px">
        <el-form-item label="规则名称">
          <el-input v-model="currentRule.name" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="异常类型">
          <el-select v-model="currentRule.type" placeholder="请选择">
            <el-option label="区域闯入" value="intrusion" />
            <el-option label="行为异常" value="behavior" />
            <el-option label="环境变化" value="environment" />
            <el-option label="设备异常" value="equipment" />
            <el-option label="安全隐患" value="safety" />
          </el-select>
        </el-form-item>
        <el-form-item label="规则描述">
          <el-input v-model="currentRule.description" type="textarea" :rows="3" placeholder="请输入规则描述" />
        </el-form-item>
        <el-form-item label="检测区域">
          <el-input v-model="currentRule.detectArea" placeholder="如：仓库区域、生产车间" />
        </el-form-item>
        <el-form-item label="敏感度">
          <el-slider v-model="currentRule.sensitivity" :min="0" :max="100" show-input />
        </el-form-item>
        <el-form-item label="置信度阈值">
          <el-slider v-model="currentRule.confidenceThreshold" :min="0" :max="100" show-input />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="currentRule.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRuleDialog = false">取消</el-button>
        <el-button type="primary" @click="saveAnomalyRule">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.anomaly-detection-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 140px);

  .statistics-row {
    margin-bottom: 20px;

    .el-card {
      height: 100%;
    }
  }

  .main-content-row {
    .el-card {
      margin-bottom: 20px;
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    span {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
    }
  }

  // 视频监控样式
  .video-monitor-card {
    .video-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      max-height: calc(100vh - 360px);
      overflow-y: auto;

      .video-item {
        .video-frame {
          position: relative;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 8px;
          padding: 16px;
          height: 160px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          transition: all 0.3s;

          &.has-anomaly {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            box-shadow: 0 0 20px rgba(245, 87, 108, 0.6);
            animation: pulse 2s ease-in-out infinite;
          }

          &:hover {
            transform: translateY(-4px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
          }

          .video-icon {
            font-size: 48px;
            color: rgba(255, 255, 255, 0.9);
            margin-bottom: 12px;
          }

          .video-info {
            text-align: center;
            color: white;

            .video-name {
              font-weight: 600;
              font-size: 14px;
              margin-bottom: 4px;
            }

            .video-location {
              font-size: 12px;
              opacity: 0.9;
            }
          }

          .anomaly-region {
            position: absolute;
            border: 2px solid #f5576c;
            border-radius: 4px;
            background: rgba(245, 87, 108, 0.2);
            animation: blink 1s ease-in-out infinite;

            .anomaly-label {
              position: absolute;
              top: -30px;
              left: 0;
              background: rgba(245, 87, 108, 0.95);
              color: white;
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 11px;
              white-space: nowrap;
              font-weight: 600;
            }
          }

          .anomaly-badge {
            position: absolute;
            top: 8px;
            right: 8px;
          }
        }
      }
    }
  }

  // 告警列表样式
  .alert-list-card {
    .filter-bar {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;

      .el-select {
        flex: 1;
      }
    }

    .alert-list {
      max-height: calc(100vh - 420px);
      overflow-y: auto;

      .alert-item {
        margin-bottom: 12px;

        .alert-content {
          .alert-header {
            display: flex;
            gap: 8px;
            align-items: center;
            margin-bottom: 8px;

            .alert-type {
              margin-left: auto;
              font-size: 13px;
              color: #606266;
            }
          }

          .alert-description {
            margin-bottom: 8px;
            font-size: 14px;
            color: #303133;
            line-height: 1.5;
          }

          .alert-details {
            display: flex;
            gap: 16px;
            margin-bottom: 12px;
            font-size: 12px;
            color: #909399;

            span {
              display: flex;
              align-items: center;
            }
          }

          .alert-actions {
            display: flex;
            gap: 8px;
          }
        }
      }
    }
  }

  // 响应配置和规则管理样式
  .response-config-card,
  .anomaly-rule-card {
    .rule-list {
      max-height: 380px;
      overflow-y: auto;

      .rule-item {
        padding: 16px;
        background: #f9fafb;
        border-radius: 8px;
        margin-bottom: 12px;
        transition: all 0.3s;

        &:hover {
          background: #f0f2f5;
          transform: translateX(4px);
        }

        .rule-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;

          .rule-name {
            font-weight: 600;
            font-size: 14px;
            color: #303133;
          }
        }

        .rule-description {
          font-size: 12px;
          color: #606266;
          margin-bottom: 8px;
          line-height: 1.5;
        }

        .rule-info {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }

        .rule-response {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 8px;

          .response-tag {
            font-size: 11px;
            padding: 2px 8px;
            background: #e8f4ff;
            color: #409eff;
            border-radius: 4px;
          }
        }

        .rule-params {
          margin-bottom: 12px;

          .el-progress {
            margin-bottom: 8px;

            .progress-label {
              font-size: 12px;
              margin-left: 8px;
            }
          }
        }

        .rule-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }
      }
    }
  }

  // 动画效果
  @keyframes pulse {
    0%,
    100% {
      box-shadow: 0 0 20px rgba(245, 87, 108, 0.6);
    }
    50% {
      box-shadow: 0 0 40px rgba(245, 87, 108, 0.9);
    }
  }

  @keyframes blink {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  // 滚动条样式
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;

    &:hover {
      background: #a8a8a8;
    }
  }
}
</style>