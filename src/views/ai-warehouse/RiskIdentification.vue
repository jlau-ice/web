<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage } from 'element-plus'

// 类型定义
interface MonitorPoint {
  id: string
  name: string
  location: string
  status: 'online' | 'offline' | 'warning'
  riskLevel: 'normal' | 'low' | 'medium' | 'high'
  detections: RiskDetection[]
  streamUrl: string
  lastUpdate: string
}

interface RiskDetection {
  id: string
  type: 'fire' | 'theft' | 'violation' | 'cargo'
  subType: string
  riskLevel: 'low' | 'medium' | 'high'
  confidence: number
  position: { x: number; y: number; width: number; height: number }
  timestamp: string
  status: 'pending' | 'confirmed' | 'handled' | 'ignored'
}

interface RiskAlert {
  id: string
  monitorPoint: string
  location: string
  type: 'fire' | 'theft' | 'violation' | 'cargo'
  subType: string
  riskLevel: 'low' | 'medium' | 'high'
  confidence: number
  description: string
  timestamp: string
  status: 'pending' | 'confirmed' | 'handled' | 'ignored'
  handledBy?: string
  handledAt?: string
}

interface RiskRule {
  id: string
  type: 'fire' | 'theft' | 'violation' | 'cargo'
  subType: string
  enabled: boolean
  threshold: number
  sensitivity: number
  responseStrategy: string
  notifyLevel: 'low' | 'medium' | 'high'
}

interface RiskStatistics {
  total: number
  byType: Record<string, number>
  byLevel: Record<string, number>
  trend: number
  hotspots: HotspotArea[]
}

interface HotspotArea {
  location: string
  count: number
  mainType: string
  riskScore: number
}

// 响应式数据
const loading = ref(true)
const monitorPoints = ref<MonitorPoint[]>([])
const selectedPoint = ref<MonitorPoint | null>(null)
const alerts = ref<RiskAlert[]>([])
const riskRules = ref<RiskRule[]>([])
const statistics = ref<RiskStatistics>({
  total: 0,
  byType: {},
  byLevel: {},
  trend: 0,
  hotspots: []
})
const activeTab = ref('monitor')
const alertFilter = ref<'all' | 'fire' | 'theft' | 'violation' | 'cargo'>('all')
const levelFilter = ref<'all' | 'low' | 'medium' | 'high'>('all')
const statusFilter = ref<'all' | 'pending' | 'confirmed' | 'handled' | 'ignored'>('all')
const autoRefresh = ref(true)
const refreshInterval = ref<number | null>(null)

// 风险类型配置
const riskTypeConfig = {
  fire: { 
    label: '火灾风险', 
    color: '#F56C6C', 
    icon: '🔥',
    subTypes: ['烟雾检测', '火焰识别', '高温区域']
  },
  theft: { 
    label: '安全风险', 
    color: '#E6A23C', 
    icon: '🚨',
    subTypes: ['异常入侵', '区域闯入', '人员徘徊']
  },
  violation: { 
    label: '违规操作', 
    color: '#F0C84C', 
    icon: '⚠️',
    subTypes: ['吸烟识别', '安全装备检测', '违规区域']
  },
  cargo: { 
    label: '货物异常', 
    color: '#409EFF', 
    icon: '📦',
    subTypes: ['堆放不规范', '倒塌风险', '货损识别']
  }
}

// 风险等级配置
const riskLevelConfig = {
  normal: { label: '正常', color: '#67C23A' },
  low: { label: '低危', color: '#F0C84C' },
  medium: { label: '中危', color: '#E6A23C' },
  high: { label: '高危', color: '#F56C6C' }
}

// 计算属性
const filteredAlerts = computed(() => {
  return alerts.value.filter(alert => {
    const typeMatch = alertFilter.value === 'all' || alert.type === alertFilter.value
    const levelMatch = levelFilter.value === 'all' || alert.riskLevel === levelFilter.value
    const statusMatch = statusFilter.value === 'all' || alert.status === statusFilter.value
    return typeMatch && levelMatch && statusMatch
  }).sort((a, b) => {
    const levelPriority = { high: 3, medium: 2, low: 1 }
    return levelPriority[b.riskLevel] - levelPriority[a.riskLevel]
  })
})

const totalRiskCount = computed(() => {
  return alerts.value.filter(a => a.status === 'pending' || a.status === 'confirmed').length
})

const highRiskCount = computed(() => {
  return alerts.value.filter(a => a.riskLevel === 'high' && a.status === 'pending').length
})

const mediumRiskCount = computed(() => {
  return alerts.value.filter(a => a.riskLevel === 'medium' && a.status === 'pending').length
})

const lowRiskCount = computed(() => {
  return alerts.value.filter(a => a.riskLevel === 'low' && a.status === 'pending').length
})

const handledRate = computed(() => {
  const total = alerts.value.length
  const handled = alerts.value.filter(a => a.status === 'handled').length
  return total > 0 ? ((handled / total) * 100).toFixed(1) : '0'
})

// Mock 数据加载
const loadMockData = () => {
  loading.value = true
  
  setTimeout(() => {
    // 模拟监控点数据
    monitorPoints.value = [
      {
        id: 'mp001',
        name: '1号库区北门',
        location: 'A区-北门',
        status: 'warning',
        riskLevel: 'high',
        streamUrl: 'stream://monitor/1',
        lastUpdate: new Date().toLocaleString(),
        detections: [
          {
            id: 'det001',
            type: 'fire',
            subType: '烟雾检测',
            riskLevel: 'high',
            confidence: 92,
            position: { x: 120, y: 80, width: 60, height: 60 },
            timestamp: new Date().toLocaleString(),
            status: 'pending'
          }
        ]
      },
      {
        id: 'mp002',
        name: '2号库区东侧',
        location: 'B区-东侧',
        status: 'online',
        riskLevel: 'medium',
        streamUrl: 'stream://monitor/2',
        lastUpdate: new Date().toLocaleString(),
        detections: [
          {
            id: 'det002',
            type: 'violation',
            subType: '安全装备检测',
            riskLevel: 'medium',
            confidence: 85,
            position: { x: 200, y: 150, width: 50, height: 80 },
            timestamp: new Date().toLocaleString(),
            status: 'pending'
          }
        ]
      },
      {
        id: 'mp003',
        name: '3号库区中心',
        location: 'C区-中心',
        status: 'online',
        riskLevel: 'low',
        streamUrl: 'stream://monitor/3',
        lastUpdate: new Date().toLocaleString(),
        detections: [
          {
            id: 'det003',
            type: 'cargo',
            subType: '堆放不规范',
            riskLevel: 'low',
            confidence: 78,
            position: { x: 150, y: 200, width: 100, height: 80 },
            timestamp: new Date().toLocaleString(),
            status: 'confirmed'
          }
        ]
      },
      {
        id: 'mp004',
        name: '4号库区南门',
        location: 'D区-南门',
        status: 'online',
        riskLevel: 'normal',
        streamUrl: 'stream://monitor/4',
        lastUpdate: new Date().toLocaleString(),
        detections: []
      },
      {
        id: 'mp005',
        name: '5号库区西侧',
        location: 'A区-西侧',
        status: 'warning',
        riskLevel: 'medium',
        streamUrl: 'stream://monitor/5',
        lastUpdate: new Date().toLocaleString(),
        detections: [
          {
            id: 'det004',
            type: 'theft',
            subType: '异常入侵',
            riskLevel: 'medium',
            confidence: 88,
            position: { x: 180, y: 120, width: 40, height: 70 },
            timestamp: new Date().toLocaleString(),
            status: 'pending'
          }
        ]
      },
      {
        id: 'mp006',
        name: '6号库区通道',
        location: 'B区-通道',
        status: 'online',
        riskLevel: 'normal',
        streamUrl: 'stream://monitor/6',
        lastUpdate: new Date().toLocaleString(),
        detections: []
      }
    ]

    // 模拟预警数据
    alerts.value = [
      {
        id: 'alert001',
        monitorPoint: '1号库区北门',
        location: 'A区-北门',
        type: 'fire',
        subType: '烟雾检测',
        riskLevel: 'high',
        confidence: 92,
        description: '检测到疑似烟雾，请立即确认现场情况',
        timestamp: new Date(Date.now() - 5 * 60000).toLocaleString(),
        status: 'pending'
      },
      {
        id: 'alert002',
        monitorPoint: '5号库区西侧',
        location: 'A区-西侧',
        type: 'theft',
        subType: '异常入侵',
        riskLevel: 'medium',
        confidence: 88,
        description: '检测到非授权人员进入监控区域',
        timestamp: new Date(Date.now() - 15 * 60000).toLocaleString(),
        status: 'pending'
      },
      {
        id: 'alert003',
        monitorPoint: '2号库区东侧',
        location: 'B区-东侧',
        type: 'violation',
        subType: '安全装备检测',
        riskLevel: 'medium',
        confidence: 85,
        description: '检测到作业人员未佩戴安全帽',
        timestamp: new Date(Date.now() - 25 * 60000).toLocaleString(),
        status: 'confirmed'
      },
      {
        id: 'alert004',
        monitorPoint: '3号库区中心',
        location: 'C区-中心',
        type: 'cargo',
        subType: '堆放不规范',
        riskLevel: 'low',
        confidence: 78,
        description: '货物堆放高度超过安全线',
        timestamp: new Date(Date.now() - 45 * 60000).toLocaleString(),
        status: 'handled',
        handledBy: '张三',
        handledAt: new Date(Date.now() - 30 * 60000).toLocaleString()
      },
      {
        id: 'alert005',
        monitorPoint: '1号库区北门',
        location: 'A区-北门',
        type: 'fire',
        subType: '高温区域',
        riskLevel: 'high',
        confidence: 95,
        description: '检测到高温异常区域，温度持续上升',
        timestamp: new Date(Date.now() - 60 * 60000).toLocaleString(),
        status: 'handled',
        handledBy: '李四',
        handledAt: new Date(Date.now() - 50 * 60000).toLocaleString()
      },
      {
        id: 'alert006',
        monitorPoint: '4号库区南门',
        location: 'D区-南门',
        type: 'violation',
        subType: '吸烟识别',
        riskLevel: 'high',
        confidence: 91,
        description: '检测到禁烟区域有人员吸烟',
        timestamp: new Date(Date.now() - 90 * 60000).toLocaleString(),
        status: 'handled',
        handledBy: '王五',
        handledAt: new Date(Date.now() - 75 * 60000).toLocaleString()
      },
      {
        id: 'alert007',
        monitorPoint: '2号库区东侧',
        location: 'B区-东侧',
        type: 'cargo',
        subType: '倒塌风险',
        riskLevel: 'medium',
        confidence: 82,
        description: '货物堆叠角度异常，存在倒塌风险',
        timestamp: new Date(Date.now() - 120 * 60000).toLocaleString(),
        status: 'ignored'
      }
    ]

    // 模拟风险规则数据
    riskRules.value = [
      {
        id: 'rule001',
        type: 'fire',
        subType: '烟雾检测',
        enabled: true,
        threshold: 75,
        sensitivity: 85,
        responseStrategy: '立即通知消防部门',
        notifyLevel: 'high'
      },
      {
        id: 'rule002',
        type: 'fire',
        subType: '火焰识别',
        enabled: true,
        threshold: 80,
        sensitivity: 90,
        responseStrategy: '触发自动灭火系统',
        notifyLevel: 'high'
      },
      {
        id: 'rule003',
        type: 'fire',
        subType: '高温区域',
        enabled: true,
        threshold: 70,
        sensitivity: 80,
        responseStrategy: '启动降温措施',
        notifyLevel: 'high'
      },
      {
        id: 'rule004',
        type: 'theft',
        subType: '异常入侵',
        enabled: true,
        threshold: 75,
        sensitivity: 85,
        responseStrategy: '通知安保人员',
        notifyLevel: 'medium'
      },
      {
        id: 'rule005',
        type: 'theft',
        subType: '区域闯入',
        enabled: true,
        threshold: 80,
        sensitivity: 88,
        responseStrategy: '触发警报系统',
        notifyLevel: 'medium'
      },
      {
        id: 'rule006',
        type: 'violation',
        subType: '吸烟识别',
        enabled: true,
        threshold: 85,
        sensitivity: 90,
        responseStrategy: '现场警告并记录',
        notifyLevel: 'high'
      },
      {
        id: 'rule007',
        type: 'violation',
        subType: '安全装备检测',
        enabled: true,
        threshold: 75,
        sensitivity: 80,
        responseStrategy: '提醒并要求整改',
        notifyLevel: 'medium'
      },
      {
        id: 'rule008',
        type: 'cargo',
        subType: '堆放不规范',
        enabled: true,
        threshold: 70,
        sensitivity: 75,
        responseStrategy: '通知整改',
        notifyLevel: 'low'
      },
      {
        id: 'rule009',
        type: 'cargo',
        subType: '倒塌风险',
        enabled: true,
        threshold: 80,
        sensitivity: 85,
        responseStrategy: '立即加固处理',
        notifyLevel: 'medium'
      }
    ]

    // 模拟统计数据
    statistics.value = {
      total: 247,
      byType: {
        fire: 45,
        theft: 38,
        violation: 89,
        cargo: 75
      },
      byLevel: {
        high: 28,
        medium: 95,
        low: 124
      },
      trend: -12.5,
      hotspots: [
        { location: 'A区-北门', count: 42, mainType: '火灾风险', riskScore: 85 },
        { location: 'B区-东侧', count: 38, mainType: '违规操作', riskScore: 72 },
        { location: 'C区-中心', count: 35, mainType: '货物异常', riskScore: 68 },
        { location: 'D区-南门', count: 28, mainType: '安全风险', riskScore: 65 },
        { location: 'A区-西侧', count: 25, mainType: '违规操作', riskScore: 58 }
      ]
    }

    selectedPoint.value = monitorPoints.value[0]
    loading.value = false
    ElMessage.success('风险识别数据加载成功')
  }, 1000)
}

// 方法
const selectMonitorPoint = (point: MonitorPoint) => {
  selectedPoint.value = point
}

const handleAlert = (alert: RiskAlert, action: 'confirm' | 'handle' | 'ignore') => {
  const index = alerts.value.findIndex(a => a.id === alert.id)
  if (index !== -1) {
    if (action === 'confirm') {
      alerts.value[index].status = 'confirmed'
      ElMessage.success('预警已确认')
    } else if (action === 'handle') {
      alerts.value[index].status = 'handled'
      alerts.value[index].handledBy = '当前用户'
      alerts.value[index].handledAt = new Date().toLocaleString()
      ElMessage.success('预警已处置')
    } else if (action === 'ignore') {
      alerts.value[index].status = 'ignored'
      ElMessage.info('预警已忽略')
    }
  }
}

const updateRule = (rule: RiskRule) => {
  ElMessage.success(`规则"${rule.subType}"已更新`)
}

const testRule = (rule: RiskRule) => {
  ElMessage.info(`正在测试规则"${rule.subType}"...`)
  setTimeout(() => {
    ElMessage.success('规则测试通过')
  }, 1500)
}

const exportReport = () => {
  ElMessage.info('正在生成风险评估报告...')
  setTimeout(() => {
    ElMessage.success('报告导出成功')
  }, 2000)
}

const refreshData = () => {
  loadMockData()
}

// 生命周期
onMounted(() => {
  loadMockData()
  
  if (autoRefresh.value) {
    refreshInterval.value = window.setInterval(() => {
      // 模拟数据更新
      monitorPoints.value.forEach(point => {
        point.lastUpdate = new Date().toLocaleString()
      })
    }, 30000) // 每30秒刷新一次
  }
})

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
})
</script>

<template>
  <div class="risk-identification-container">
    <!-- 顶部统计面板 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card">
          <el-statistic :value="totalRiskCount" title="待处理风险">
            <template #prefix>
              <span class="stat-icon" style="color: #F56C6C;">⚠️</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card high-risk">
          <el-statistic :value="highRiskCount" title="高危预警">
            <template #prefix>
              <span class="stat-icon" style="color: #F56C6C;">🔴</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card medium-risk">
          <el-statistic :value="mediumRiskCount" title="中危预警">
            <template #prefix>
              <span class="stat-icon" style="color: #E6A23C;">🟠</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card low-risk">
          <el-statistic :value="lowRiskCount" title="低危预警">
            <template #prefix>
              <span class="stat-icon" style="color: #F0C84C;">🟡</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card">
          <el-statistic :value="handledRate" title="处置率">
            <template #suffix>%</template>
            <template #prefix>
              <span class="stat-icon" style="color: #67C23A;">✓</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card">
          <el-statistic :value="statistics.trend" :precision="1" title="风险趋势">
            <template #suffix>%</template>
            <template #prefix>
              <span class="stat-icon" :style="{ color: statistics.trend < 0 ? '#67C23A' : '#F56C6C' }">
                {{ statistics.trend < 0 ? '↓' : '↑' }}
              </span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- 主要内容区域 -->
    <el-row :gutter="16" class="main-content">
      <!-- 左侧：监控视图 -->
      <el-col :span="10">
        <el-card shadow="hover" class="monitor-card">
          <template #header>
            <div class="card-header">
              <span>🎥 风险识别监控</span>
              <el-button type="primary" size="small" @click="refreshData">刷新数据</el-button>
            </div>
          </template>

          <!-- 监控点选择 -->
          <div class="monitor-points">
            <el-tag
              v-for="point in monitorPoints"
              :key="point.id"
              :type="point.riskLevel === 'high' ? 'danger' : point.riskLevel === 'medium' ? 'warning' : point.riskLevel === 'low' ? 'info' : 'success'"
              :effect="selectedPoint?.id === point.id ? 'dark' : 'plain'"
              @click="selectMonitorPoint(point)"
              class="monitor-tag"
            >
              {{ point.name }}
              <span v-if="point.detections.length > 0" class="detection-badge">{{ point.detections.length }}</span>
            </el-tag>
          </div>

          <!-- 视频画面 -->
          <div class="video-container" v-if="selectedPoint">
            <div class="video-screen">
              <div class="video-info">
                <div class="info-item">
                  <span class="label">监控点：</span>
                  <span class="value">{{ selectedPoint.name }}</span>
                </div>
                <div class="info-item">
                  <span class="label">位置：</span>
                  <span class="value">{{ selectedPoint.location }}</span>
                </div>
                <div class="info-item">
                  <span class="label">状态：</span>
                  <el-tag :type="selectedPoint.status === 'online' ? 'success' : 'danger'" size="small">
                    {{ selectedPoint.status === 'online' ? '在线' : selectedPoint.status === 'offline' ? '离线' : '预警' }}
                  </el-tag>
                </div>
                <div class="info-item">
                  <span class="label">风险等级：</span>
                  <el-tag :type="selectedPoint.riskLevel === 'high' ? 'danger' : selectedPoint.riskLevel === 'medium' ? 'warning' : selectedPoint.riskLevel === 'low' ? 'info' : 'success'" size="small">
                    {{ riskLevelConfig[selectedPoint.riskLevel].label }}
                  </el-tag>
                </div>
              </div>

              <!-- 模拟视频画面 -->
              <div class="video-frame">
                <div class="video-placeholder">
                  <span class="video-icon">📹</span>
                  <p>{{ selectedPoint.name }}</p>
                  <p class="video-time">{{ selectedPoint.lastUpdate }}</p>
                </div>

                <!-- 风险标注框 -->
                <div
                  v-for="detection in selectedPoint.detections"
                  :key="detection.id"
                  class="risk-box"
                  :style="{
                    left: detection.position.x + 'px',
                    top: detection.position.y + 'px',
                    width: detection.position.width + 'px',
                    height: detection.position.height + 'px',
                    borderColor: riskLevelConfig[detection.riskLevel].color
                  }"
                >
                  <div class="risk-label" :style="{ background: riskLevelConfig[detection.riskLevel].color }">
                    <span>{{ detection.subType }}</span>
                    <span class="confidence">{{ detection.confidence }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 检测列表 -->
          <div class="detection-list" v-if="selectedPoint && selectedPoint.detections.length > 0">
            <h4>当前检测项</h4>
            <el-timeline>
              <el-timeline-item
                v-for="detection in selectedPoint.detections"
                :key="detection.id"
                :timestamp="detection.timestamp"
                :color="riskLevelConfig[detection.riskLevel].color"
              >
                <div class="detection-item">
                  <span class="type-icon">{{ riskTypeConfig[detection.type].icon }}</span>
                  <span class="type-label">{{ detection.subType }}</span>
                  <el-tag :type="detection.riskLevel === 'high' ? 'danger' : detection.riskLevel === 'medium' ? 'warning' : 'info'" size="small">
                    {{ riskLevelConfig[detection.riskLevel].label }}
                  </el-tag>
                  <span class="confidence-text">置信度: {{ detection.confidence }}%</span>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>
          <el-empty v-else-if="selectedPoint && selectedPoint.detections.length === 0" description="当前无风险检测" />
        </el-card>
      </el-col>

      <!-- 中间：预警信息列表 -->
      <el-col :span="8">
        <el-card shadow="hover" class="alert-card">
          <template #header>
            <div class="card-header">
              <span>🚨 实时预警信息</span>
            </div>
          </template>

          <!-- 筛选器 -->
          <div class="filters">
            <el-select v-model="alertFilter" placeholder="风险类型" size="small" style="width: 100px;">
              <el-option label="全部" value="all" />
              <el-option v-for="(config, key) in riskTypeConfig" :key="key" :label="config.label" :value="key" />
            </el-select>
            <el-select v-model="levelFilter" placeholder="风险等级" size="small" style="width: 100px; margin-left: 8px;">
              <el-option label="全部" value="all" />
              <el-option label="高危" value="high" />
              <el-option label="中危" value="medium" />
              <el-option label="低危" value="low" />
            </el-select>
            <el-select v-model="statusFilter" placeholder="状态" size="small" style="width: 100px; margin-left: 8px;">
              <el-option label="全部" value="all" />
              <el-option label="待处理" value="pending" />
              <el-option label="已确认" value="confirmed" />
              <el-option label="已处置" value="handled" />
              <el-option label="已忽略" value="ignored" />
            </el-select>
          </div>

          <!-- 预警列表 -->
          <div class="alert-list">
            <el-scrollbar height="700px">
              <div
                v-for="alert in filteredAlerts"
                :key="alert.id"
                class="alert-item"
                :class="'alert-' + alert.riskLevel"
              >
                <div class="alert-header">
                  <span class="alert-icon">{{ riskTypeConfig[alert.type].icon }}</span>
                  <span class="alert-title">{{ alert.subType }}</span>
                  <el-tag :type="alert.riskLevel === 'high' ? 'danger' : alert.riskLevel === 'medium' ? 'warning' : 'info'" size="small">
                    {{ riskLevelConfig[alert.riskLevel].label }}
                  </el-tag>
                </div>
                <div class="alert-info">
                  <div class="info-row">
                    <span class="label">位置：</span>
                    <span class="value">{{ alert.location }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">描述：</span>
                    <span class="value">{{ alert.description }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">置信度：</span>
                    <el-progress :percentage="alert.confidence" :color="riskLevelConfig[alert.riskLevel].color" :stroke-width="8" style="width: 100px;" />
                  </div>
                  <div class="info-row">
                    <span class="label">时间：</span>
                    <span class="value">{{ alert.timestamp }}</span>
                  </div>
                  <div class="info-row" v-if="alert.status === 'handled'">
                    <span class="label">处置人：</span>
                    <span class="value">{{ alert.handledBy }} ({{ alert.handledAt }})</span>
                  </div>
                </div>
                <div class="alert-actions" v-if="alert.status === 'pending' || alert.status === 'confirmed'">
                  <el-button v-if="alert.status === 'pending'" type="warning" size="small" @click="handleAlert(alert, 'confirm')">确认</el-button>
                  <el-button type="success" size="small" @click="handleAlert(alert, 'handle')">处置</el-button>
                  <el-button type="info" size="small" @click="handleAlert(alert, 'ignore')">忽略</el-button>
                </div>
                <div class="alert-status" v-else>
                  <el-tag :type="alert.status === 'handled' ? 'success' : 'info'" size="small">
                    {{ alert.status === 'handled' ? '已处置' : alert.status === 'ignored' ? '已忽略' : '' }}
                  </el-tag>
                </div>
              </div>
              <el-empty v-if="filteredAlerts.length === 0" description="暂无预警信息" />
            </el-scrollbar>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：配置和分析面板 -->
      <el-col :span="6">
        <el-card shadow="hover" class="config-card">
          <template #header>
            <div class="card-header">
              <span>⚙️ 配置与分析</span>
            </div>
          </template>

          <el-tabs v-model="activeTab" class="config-tabs">
            <!-- 风险规则配置 -->
            <el-tab-pane label="规则配置" name="rules">
              <el-scrollbar height="700px">
                <div v-for="rule in riskRules" :key="rule.id" class="rule-item">
                  <div class="rule-header">
                    <span class="rule-icon">{{ riskTypeConfig[rule.type].icon }}</span>
                    <span class="rule-name">{{ rule.subType }}</span>
                    <el-switch v-model="rule.enabled" size="small" @change="updateRule(rule)" />
                  </div>
                  <div class="rule-config" v-if="rule.enabled">
                    <div class="config-item">
                      <span class="config-label">识别阈值</span>
                      <el-slider v-model="rule.threshold" :min="0" :max="100" @change="updateRule(rule)" />
                      <span class="config-value">{{ rule.threshold }}%</span>
                    </div>
                    <div class="config-item">
                      <span class="config-label">敏感度</span>
                      <el-slider v-model="rule.sensitivity" :min="0" :max="100" @change="updateRule(rule)" />
                      <span class="config-value">{{ rule.sensitivity }}%</span>
                    </div>
                    <div class="config-item">
                      <span class="config-label">响应策略</span>
                      <span class="config-text">{{ rule.responseStrategy }}</span>
                    </div>
                    <div class="config-item">
                      <span class="config-label">通知等级</span>
                      <el-tag :type="rule.notifyLevel === 'high' ? 'danger' : rule.notifyLevel === 'medium' ? 'warning' : 'info'" size="small">
                        {{ rule.notifyLevel === 'high' ? '高' : rule.notifyLevel === 'medium' ? '中' : '低' }}
                      </el-tag>
                    </div>
                    <el-button type="primary" size="small" @click="testRule(rule)" style="margin-top: 8px;">测试规则</el-button>
                  </div>
                </div>
              </el-scrollbar>
            </el-tab-pane>

            <!-- 统计分析 -->
            <el-tab-pane label="统计分析" name="statistics">
              <el-scrollbar height="700px">
                <!-- 总体统计 -->
                <div class="stats-section">
                  <h4>📊 风险统计概览</h4>
                  <el-descriptions :column="1" border size="small">
                    <el-descriptions-item label="总风险数">{{ statistics.total }}</el-descriptions-item>
                    <el-descriptions-item label="高危风险">
                      <el-tag type="danger">{{ statistics.byLevel.high }}</el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="中危风险">
                      <el-tag type="warning">{{ statistics.byLevel.medium }}</el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="低危风险">
                      <el-tag type="info">{{ statistics.byLevel.low }}</el-tag>
                    </el-descriptions-item>
                  </el-descriptions>
                </div>

                <!-- 类型分布 -->
                <div class="stats-section">
                  <h4>📈 类型分布</h4>
                  <div class="type-stats">
                    <div v-for="(count, type) in statistics.byType" :key="type" class="type-stat-item">
                      <div class="type-label">
                        <span class="type-icon">{{ riskTypeConfig[type].icon }}</span>
                        <span>{{ riskTypeConfig[type].label }}</span>
                      </div>
                      <div class="type-value">
                        <el-progress :percentage="Math.round((count / statistics.total) * 100)" :color="riskTypeConfig[type].color" />
                        <span class="count">{{ count }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 热点区域 -->
                <div class="stats-section">
                  <h4>🔥 风险热点区域</h4>
                  <div class="hotspot-list">
                    <div v-for="(hotspot, index) in statistics.hotspots" :key="index" class="hotspot-item">
                      <div class="hotspot-rank">{{ index + 1 }}</div>
                      <div class="hotspot-info">
                        <div class="hotspot-location">{{ hotspot.location }}</div>
                        <div class="hotspot-detail">
                          <span class="hotspot-type">{{ hotspot.mainType }}</span>
                          <span class="hotspot-count">{{ hotspot.count }}次</span>
                        </div>
                        <el-progress :percentage="hotspot.riskScore" :color="hotspot.riskScore > 80 ? '#F56C6C' : hotspot.riskScore > 60 ? '#E6A23C' : '#409EFF'" :stroke-width="6" />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 导出报告 -->
                <div class="stats-section">
                  <el-button type="primary" style="width: 100%;" @click="exportReport">
                    📄 导出风险评估报告
                  </el-button>
                </div>
              </el-scrollbar>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.risk-identification-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 120px);
}

.stats-row {
  margin-bottom: 16px;

  .stat-card {
    text-align: center;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-4px);
    }

    .stat-icon {
      font-size: 24px;
      margin-right: 8px;
    }

    &.high-risk {
      border-left: 4px solid #F56C6C;
    }

    &.medium-risk {
      border-left: 4px solid #E6A23C;
    }

    &.low-risk {
      border-left: 4px solid #F0C84C;
    }
  }
}

.main-content {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
  }
}

// 监控卡片
.monitor-card {
  height: 880px;
  overflow: hidden;

  .monitor-points {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;

    .monitor-tag {
      cursor: pointer;
      position: relative;
      transition: all 0.3s;

      &:hover {
        transform: scale(1.05);
      }

      .detection-badge {
        position: absolute;
        top: -8px;
        right: -8px;
        background: #F56C6C;
        color: white;
        border-radius: 50%;
        width: 18px;
        height: 18px;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }

  .video-container {
    .video-screen {
      border: 2px solid #dcdfe6;
      border-radius: 8px;
      overflow: hidden;
      background: #000;

      .video-info {
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 12px;
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;

        .info-item {
          margin: 4px 8px;

          .label {
            color: #999;
            margin-right: 4px;
          }

          .value {
            color: white;
          }
        }
      }

      .video-frame {
        position: relative;
        width: 100%;
        height: 400px;
        background: #1a1a1a;

        .video-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #666;

          .video-icon {
            font-size: 48px;
            margin-bottom: 16px;
          }

          p {
            margin: 4px 0;
            color: #999;
          }

          .video-time {
            font-size: 12px;
            color: #666;
          }
        }

        .risk-box {
          position: absolute;
          border: 3px solid;
          border-radius: 4px;
          animation: pulse 2s infinite;

          .risk-label {
            position: absolute;
            top: -28px;
            left: 0;
            padding: 4px 8px;
            color: white;
            font-size: 12px;
            border-radius: 4px;
            white-space: nowrap;
            display: flex;
            gap: 8px;

            .confidence {
              font-weight: bold;
            }
          }
        }
      }
    }
  }

  .detection-list {
    margin-top: 16px;

    h4 {
      margin-bottom: 12px;
      color: #303133;
    }

    .detection-item {
      display: flex;
      align-items: center;
      gap: 8px;

      .type-icon {
        font-size: 18px;
      }

      .type-label {
        font-weight: 600;
        flex: 1;
      }

      .confidence-text {
        font-size: 12px;
        color: #909399;
        margin-left: 8px;
      }
    }
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

// 预警卡片
.alert-card {
  height: 880px;
  overflow: hidden;

  .filters {
    margin-bottom: 16px;
    display: flex;
    align-items: center;
  }

  .alert-list {
    .alert-item {
      border: 1px solid #dcdfe6;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;
      transition: all 0.3s;

      &:hover {
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
      }

      &.alert-high {
        border-left: 4px solid #F56C6C;
        background: #fef0f0;
      }

      &.alert-medium {
        border-left: 4px solid #E6A23C;
        background: #fdf6ec;
      }

      &.alert-low {
        border-left: 4px solid #F0C84C;
        background: #fdfae8;
      }

      .alert-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;

        .alert-icon {
          font-size: 20px;
        }

        .alert-title {
          font-weight: 600;
          flex: 1;
          color: #303133;
        }
      }

      .alert-info {
        margin-bottom: 12px;

        .info-row {
          margin: 6px 0;
          display: flex;
          align-items: center;
          font-size: 13px;

          .label {
            color: #909399;
            min-width: 60px;
          }

          .value {
            color: #606266;
            flex: 1;
          }
        }
      }

      .alert-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }

      .alert-status {
        text-align: right;
      }
    }
  }
}

// 配置卡片
.config-card {
  height: 880px;
  overflow: hidden;

  .config-tabs {
    height: 100%;

    .rule-item {
      border: 1px solid #dcdfe6;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;

      .rule-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;

        .rule-icon {
          font-size: 20px;
        }

        .rule-name {
          font-weight: 600;
          flex: 1;
          color: #303133;
        }
      }

      .rule-config {
        padding: 8px;
        background: #f5f7fa;
        border-radius: 4px;

        .config-item {
          margin: 12px 0;

          .config-label {
            display: block;
            font-size: 13px;
            color: #606266;
            margin-bottom: 4px;
          }

          .config-value {
            display: inline-block;
            margin-left: 8px;
            font-weight: 600;
            color: #409EFF;
          }

          .config-text {
            font-size: 13px;
            color: #606266;
          }
        }
      }
    }

    .stats-section {
      margin-bottom: 24px;

      h4 {
        margin-bottom: 12px;
        color: #303133;
        font-size: 14px;
      }

      .type-stats {
        .type-stat-item {
          margin-bottom: 16px;

          .type-label {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
            font-size: 13px;
            color: #606266;

            .type-icon {
              font-size: 18px;
            }
          }

          .type-value {
            display: flex;
            align-items: center;
            gap: 12px;

            .count {
              font-weight: 600;
              color: #303133;
              min-width: 40px;
              text-align: right;
            }
          }
        }
      }

      .hotspot-list {
        .hotspot-item {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          padding: 12px;
          background: #f5f7fa;
          border-radius: 8px;

          .hotspot-rank {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            flex-shrink: 0;
          }

          .hotspot-info {
            flex: 1;

            .hotspot-location {
              font-weight: 600;
              color: #303133;
              margin-bottom: 4px;
            }

            .hotspot-detail {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              color: #909399;
              margin-bottom: 8px;

              .hotspot-type {
                color: #606266;
              }

              .hotspot-count {
                color: #409EFF;
                font-weight: 600;
              }
            }
          }
        }
      }
    }
  }
}

:deep(.el-card__body) {
  height: calc(100% - 60px);
}

:deep(.el-tabs__content) {
  height: calc(100% - 40px);
}

:deep(.el-tab-pane) {
  height: 100%;
}
</style>
