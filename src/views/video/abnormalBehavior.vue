<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import type { FormInstance } from 'element-plus'

// 定义类型
interface BehaviorRecord {
  id: string
  time: string
  location: string
  type: string
  level: 'high' | 'medium' | 'low'
  status: 'pending' | 'processing' | 'resolved'
  confidence: number
  description: string
  thumbnail?: string
}

interface MonitorCamera {
  id: string
  name: string
  status: 'online' | 'offline'
  stream: string
  abnormalCount: number
}

interface DetectionRule {
  id: string
  name: string
  type: string
  enabled: boolean
  sensitivity: number
  threshold: number
}

interface BehaviorAlert {
  id: string
  time: string
  cameraName: string
  type: string
  level: 'high' | 'medium' | 'low'
  confidence: number
  acknowledged: boolean
}

// 响应式数据
const loading = ref(false)
const videoLayout = ref<'2x2' | '3x3' | '1+5'>('2x2')
const currentTab = ref('monitor')
const selectedCamera = ref<string>('')

// 监控摄像头数据
const cameras = ref<MonitorCamera[]>([])

// 异常行为记录
const behaviorRecords = ref<BehaviorRecord[]>([])

// 实时预警
const realtimeAlerts = ref<BehaviorAlert[]>([])

// 检测规则
const detectionRules = ref<DetectionRule[]>([])

// 统计数据
const statistics = ref({
  totalToday: 0,
  highRisk: 0,
  mediumRisk: 0,
  lowRisk: 0,
  resolvedRate: 0
})

// 筛选条件
const filterForm = ref({
  behaviorType: '',
  timeRange: '',
  level: ''
})

// 行为类型选项
const behaviorTypes = [
  { label: '全部类型', value: '' },
  { label: '打架斗殴', value: 'fight' },
  { label: '聚集拥堵', value: 'crowd' },
  { label: '快速奔跑', value: 'running' },
  { label: '其他异常', value: 'other' }
]

// 时间范围选项
const timeRangeOptions = [
  { label: '全部时间', value: '' },
  { label: '最近1小时', value: '1h' },
  { label: '最近6小时', value: '6h' },
  { label: '今天', value: 'today' },
  { label: '最近7天', value: '7d' }
]

// 危险等级选项
const levelOptions = [
  { label: '全部等级', value: '' },
  { label: '高危', value: 'high' },
  { label: '中危', value: 'medium' },
  { label: '低危', value: 'low' }
]

// 计算筛选后的记录
const filteredRecords = computed(() => {
  let records = [...behaviorRecords.value]

  if (filterForm.value.behaviorType) {
    records = records.filter(r => r.type === filterForm.value.behaviorType)
  }

  if (filterForm.value.level) {
    records = records.filter(r => r.level === filterForm.value.level)
  }

  if (filterForm.value.timeRange) {
    const now = new Date()
    records = records.filter(r => {
      const recordTime = new Date(r.time)
      const diff = now.getTime() - recordTime.getTime()

      switch (filterForm.value.timeRange) {
        case '1h':
          return diff <= 60 * 60 * 1000
        case '6h':
          return diff <= 6 * 60 * 60 * 1000
        case 'today':
          return recordTime.toDateString() === now.toDateString()
        case '7d':
          return diff <= 7 * 24 * 60 * 60 * 1000
        default:
          return true
      }
    })
  }

  return records
})

// 获取行为类型标签样式
const getBehaviorTypeTag = (type: string) => {
  const map: Record<string, { text: string; type: any }> = {
    fight: { text: '打架斗殴', type: 'danger' },
    crowd: { text: '聚集拥堵', type: 'warning' },
    running: { text: '快速奔跑', type: '' },
    other: { text: '其他异常', type: 'info' }
  }
  return map[type] || { text: '未知', type: 'info' }
}

// 获取危险等级标签样式
const getLevelTag = (level: string) => {
  const map: Record<string, { text: string; type: any }> = {
    high: { text: '高危', type: 'danger' },
    medium: { text: '中危', type: 'warning' },
    low: { text: '低危', type: '' }
  }
  return map[level] || { text: '未知', type: 'info' }
}

// 获取状态标签样式
const getStatusTag = (status: string) => {
  const map: Record<string, { text: string; type: any }> = {
    pending: { text: '待处理', type: 'danger' },
    processing: { text: '处理中', type: 'warning' },
    resolved: { text: '已解决', type: 'success' }
  }
  return map[status] || { text: '未知', type: 'info' }
}

// 获取置信度颜色
const getConfidenceColor = (confidence: number) => {
  if (confidence >= 90) return '#67c23a'
  if (confidence >= 70) return '#e6a23c'
  return '#f56c6c'
}

// 确认预警
const acknowledgeAlert = (alert: BehaviorAlert) => {
  alert.acknowledged = true
  ElMessage.success('预警已确认')

  // 从实时预警列表中移除
  setTimeout(() => {
    const index = realtimeAlerts.value.findIndex(a => a.id === alert.id)
    if (index > -1) {
      realtimeAlerts.value.splice(index, 1)
    }
  }, 1000)
}

// 处理异常
const handleBehavior = (record: BehaviorRecord) => {
  record.status = 'processing'
  ElMessage.success('已开始处理')

  // 模拟处理完成
  setTimeout(() => {
    record.status = 'resolved'
    updateStatistics()
    ElMessage.success('处理完成')
  }, 3000)
}

// 查看详情
const viewDetail = (record: BehaviorRecord) => {
  ElNotification({
    title: '异常行为详情',
    message: `
      <div style="line-height: 1.8;">
        <p><strong>时间：</strong>${record.time}</p>
        <p><strong>位置：</strong>${record.location}</p>
        <p><strong>类型：</strong>${getBehaviorTypeTag(record.type).text}</p>
        <p><strong>等级：</strong>${getLevelTag(record.level).text}</p>
        <p><strong>置信度：</strong>${record.confidence}%</p>
        <p><strong>描述：</strong>${record.description}</p>
      </div>
    `,
    dangerouslyUseHTMLString: true,
    duration: 0
  })
}

// 切换布局
const switchLayout = (layout: '2x2' | '3x3' | '1+5') => {
  videoLayout.value = layout
  ElMessage.success(`已切换至 ${layout} 布局`)
}

// 切换规则状态
const toggleRule = (rule: DetectionRule) => {
  rule.enabled = !rule.enabled
  ElMessage.success(`规则 "${rule.name}" 已${rule.enabled ? '启用' : '禁用'}`)
}

// 更新规则敏感度
const updateRuleSensitivity = (rule: DetectionRule) => {
  console.log(`规则 "${rule.name}" 敏感度更新为: ${rule.sensitivity}`)
}

// 重置筛选
const resetFilter = () => {
  filterForm.value = {
    behaviorType: '',
    timeRange: '',
    level: ''
  }
}

// 更新统计数据
const updateStatistics = () => {
  const records = behaviorRecords.value
  const today = new Date().toDateString()
  const todayRecords = records.filter(r => new Date(r.time).toDateString() === today)

  statistics.value = {
    totalToday: todayRecords.length,
    highRisk: todayRecords.filter(r => r.level === 'high').length,
    mediumRisk: todayRecords.filter(r => r.level === 'medium').length,
    lowRisk: todayRecords.filter(r => r.level === 'low').length,
    resolvedRate: records.length > 0
      ? Math.round((records.filter(r => r.status === 'resolved').length / records.length) * 100)
      : 0
  }
}

// 模拟实时预警
let alertInterval: NodeJS.Timeout | null = null
const startRealtimeMonitoring = () => {
  alertInterval = setInterval(() => {
    // 随机生成预警（30%概率）
    if (Math.random() < 0.3) {
      const types = ['fight', 'crowd', 'running', 'other']
      const levels: ('high' | 'medium' | 'low')[] = ['high', 'medium', 'low']
      const cameraNames = cameras.value.map(c => c.name)

      const newAlert: BehaviorAlert = {
        id: `alert-${Date.now()}-${Math.random()}`,
        time: new Date().toLocaleTimeString('zh-CN'),
        cameraName: cameraNames[Math.floor(Math.random() * cameraNames.length)],
        type: types[Math.floor(Math.random() * types.length)],
        level: levels[Math.floor(Math.random() * levels.length)],
        confidence: Math.floor(Math.random() * 30) + 70,
        acknowledged: false
      }

      realtimeAlerts.value.unshift(newAlert)

      // 发送通知
      const typeTag = getBehaviorTypeTag(newAlert.type)
      const levelTag = getLevelTag(newAlert.level)

      ElNotification({
        title: '⚠️ 异常行为预警',
        message: `检测到 ${typeTag.text}（${levelTag.text}）\n位置：${newAlert.cameraName}\n置信度：${newAlert.confidence}%`,
        type: newAlert.level === 'high' ? 'error' : newAlert.level === 'medium' ? 'warning' : 'info',
        duration: 5000
      })

      // 添加到记录
      const newRecord: BehaviorRecord = {
        id: newAlert.id,
        time: new Date().toLocaleString('zh-CN'),
        location: newAlert.cameraName,
        type: newAlert.type,
        level: newAlert.level,
        status: 'pending',
        confidence: newAlert.confidence,
        description: `系统自动检测到${typeTag.text}行为，请及时处理`
      }

      behaviorRecords.value.unshift(newRecord)

      // 更新摄像头异常计数
      const camera = cameras.value.find(c => c.name === newAlert.cameraName)
      if (camera) {
        camera.abnormalCount++
      }

      updateStatistics()

      // 限制预警列表长度
      if (realtimeAlerts.value.length > 10) {
        realtimeAlerts.value = realtimeAlerts.value.slice(0, 10)
      }
    }
  }, 8000) // 每8秒检查一次
}

const stopRealtimeMonitoring = () => {
  if (alertInterval) {
    clearInterval(alertInterval)
    alertInterval = null
  }
}

// 初始化数据
const initData = () => {
  loading.value = true

  setTimeout(() => {
    // 初始化摄像头数据
    cameras.value = [
      { id: 'cam-1', name: '一楼大厅', status: 'online', stream: 'rtsp://camera1', abnormalCount: 3 },
      { id: 'cam-2', name: '二楼走廊', status: 'online', stream: 'rtsp://camera2', abnormalCount: 1 },
      { id: 'cam-3', name: '三楼会议室', status: 'online', stream: 'rtsp://camera3', abnormalCount: 0 },
      { id: 'cam-4', name: '停车场入口', status: 'online', stream: 'rtsp://camera4', abnormalCount: 5 },
      { id: 'cam-5', name: '后门通道', status: 'online', stream: 'rtsp://camera5', abnormalCount: 2 },
      { id: 'cam-6', name: '电梯厅', status: 'online', stream: 'rtsp://camera6', abnormalCount: 1 }
    ]

    // 初始化异常行为记录
    behaviorRecords.value = [
      {
        id: 'record-1',
        time: '2025-10-29 14:30:25',
        location: '一楼大厅',
        type: 'fight',
        level: 'high',
        status: 'resolved',
        confidence: 95,
        description: '检测到两人发生肢体冲突，已及时处理'
      },
      {
        id: 'record-2',
        time: '2025-10-29 13:45:12',
        location: '停车场入口',
        type: 'crowd',
        level: 'medium',
        status: 'resolved',
        confidence: 88,
        description: '检测到人员聚集拥堵，已疏散'
      },
      {
        id: 'record-3',
        time: '2025-10-29 12:20:33',
        location: '二楼走廊',
        type: 'running',
        level: 'low',
        status: 'resolved',
        confidence: 82,
        description: '检测到人员快速奔跑'
      },
      {
        id: 'record-4',
        time: '2025-10-29 11:15:47',
        location: '后门通道',
        type: 'other',
        level: 'low',
        status: 'resolved',
        confidence: 76,
        description: '检测到异常徘徊行为'
      },
      {
        id: 'record-5',
        time: '2025-10-29 10:50:18',
        location: '停车场入口',
        type: 'fight',
        level: 'high',
        status: 'resolved',
        confidence: 92,
        description: '检测到争执冲突，已介入处理'
      }
    ]

    // 初始化检测规则
    detectionRules.value = [
      {
        id: 'rule-1',
        name: '打架斗殴检测',
        type: 'fight',
        enabled: true,
        sensitivity: 85,
        threshold: 80
      },
      {
        id: 'rule-2',
        name: '人群聚集检测',
        type: 'crowd',
        enabled: true,
        sensitivity: 75,
        threshold: 70
      },
      {
        id: 'rule-3',
        name: '快速奔跑检测',
        type: 'running',
        enabled: true,
        sensitivity: 70,
        threshold: 65
      },
      {
        id: 'rule-4',
        name: '异常徘徊检测',
        type: 'loitering',
        enabled: false,
        sensitivity: 60,
        threshold: 55
      },
      {
        id: 'rule-5',
        name: '倒地检测',
        type: 'fall',
        enabled: true,
        sensitivity: 90,
        threshold: 85
      }
    ]

    updateStatistics()
    loading.value = false

    // 启动实时监控
    startRealtimeMonitoring()
  }, 800)
}

// 生命周期
onMounted(() => {
  initData()
})

onUnmounted(() => {
  stopRealtimeMonitoring()
})
</script>

<template>
  <div class="abnormal-behavior-container">
    <!-- 顶部工具栏 -->
    <el-card class="toolbar-card" shadow="never">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-tag type="success" size="large">
            <i class="el-icon-video-camera"></i>
            实时监控中
          </el-tag>
          <span class="camera-count">{{ cameras.length }} 路摄像头在线</span>
        </div>
        <div class="toolbar-right">
          <el-button-group>
            <el-button
              :type="videoLayout === '2x2' ? 'primary' : ''"
              @click="switchLayout('2x2')"
            >
              2x2
            </el-button>
            <el-button
              :type="videoLayout === '3x3' ? 'primary' : ''"
              @click="switchLayout('3x3')"
            >
              3x3
            </el-button>
            <el-button
              :type="videoLayout === '1+5' ? 'primary' : ''"
              @click="switchLayout('1+5')"
            >
              1+5
            </el-button>
          </el-button-group>
        </div>
      </div>
    </el-card>

    <!-- 主要内容区域 -->
    <el-row :gutter="16" class="main-content">
      <!-- 左侧：监控画面 -->
      <el-col :span="12">
        <el-card class="monitor-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span><i class="el-icon-monitor"></i> 实时监控画面</span>
              <el-tag :type="videoLayout === '2x2' ? 'primary' : 'info'" size="small">
                {{ videoLayout }} 布局
              </el-tag>
            </div>
          </template>

          <div :class="['video-grid', `layout-${videoLayout}`]">
            <div
              v-for="camera in cameras.slice(0, videoLayout === '2x2' ? 4 : videoLayout === '3x3' ? 9 : 6)"
              :key="camera.id"
              class="video-item"
              :class="{ 'main-video': videoLayout === '1+5' && camera.id === cameras[0].id }"
            >
              <div class="video-placeholder">
                <i class="el-icon-video-camera"></i>
                <div class="camera-info">
                  <p class="camera-name">{{ camera.name }}</p>
                  <el-tag
                    :type="camera.status === 'online' ? 'success' : 'danger'"
                    size="small"
                  >
                    {{ camera.status === 'online' ? '在线' : '离线' }}
                  </el-tag>
                </div>

                <!-- 异常标注示例 -->
                <div
                  v-if="camera.abnormalCount > 0"
                  class="abnormal-overlay"
                >
                  <div class="detection-box">
                    <span class="detection-label">异常行为检测</span>
                  </div>
                </div>

                <!-- 异常计数 -->
                <div v-if="camera.abnormalCount > 0" class="abnormal-badge">
                  <el-badge :value="camera.abnormalCount" type="danger">
                    <i class="el-icon-warning"></i>
                  </el-badge>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 行为记录表格 -->
        <el-card class="records-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span><i class="el-icon-document"></i> 异常行为记录</span>
              <el-button type="primary" size="small" @click="resetFilter">
                重置筛选
              </el-button>
            </div>
          </template>

          <!-- 筛选条件 -->
          <div class="filter-bar">
            <el-select
              v-model="filterForm.behaviorType"
              placeholder="行为类型"
              clearable
              style="width: 150px"
            >
              <el-option
                v-for="item in behaviorTypes"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>

            <el-select
              v-model="filterForm.timeRange"
              placeholder="时间范围"
              clearable
              style="width: 150px"
            >
              <el-option
                v-for="item in timeRangeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>

            <el-select
              v-model="filterForm.level"
              placeholder="危险等级"
              clearable
              style="width: 150px"
            >
              <el-option
                v-for="item in levelOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>

          <!-- 记录表格 -->
          <el-table
            :data="filteredRecords"
            stripe
            style="width: 100%"
            max-height="500"
          >
            <el-table-column prop="time" label="发生时间" width="160" />
            <el-table-column prop="location" label="监控位置" width="120" />
            <el-table-column label="行为类型" width="120">
              <template #default="{ row }">
                <el-tag :type="getBehaviorTypeTag(row.type).type">
                  {{ getBehaviorTypeTag(row.type).text }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="危险等级" width="100">
              <template #default="{ row }">
                <el-tag :type="getLevelTag(row.level).type">
                  {{ getLevelTag(row.level).text }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="置信度" width="140">
              <template #default="{ row }">
                <el-progress
                  :percentage="row.confidence"
                  :color="getConfidenceColor(row.confidence)"
                  :stroke-width="8"
                />
              </template>
            </el-table-column>
            <el-table-column label="处理状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusTag(row.status).type" size="small">
                  {{ getStatusTag(row.status).text }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  size="small"
                  link
                  @click="viewDetail(row)"
                >
                  查看
                </el-button>
                <el-button
                  v-if="row.status === 'pending'"
                  type="warning"
                  size="small"
                  link
                  @click="handleBehavior(row)"
                >
                  处理
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 右侧：预警信息和配置 -->
      <el-col :span="12">
        <!-- 统计面板 -->
        <el-card class="statistics-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span><i class="el-icon-data-analysis"></i> 今日统计</span>
            </div>
          </template>

          <el-row :gutter="16">
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-value">{{ statistics.totalToday }}</div>
                <div class="stat-label">总计</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item high-risk">
                <div class="stat-value">{{ statistics.highRisk }}</div>
                <div class="stat-label">高危</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item medium-risk">
                <div class="stat-value">{{ statistics.mediumRisk }}</div>
                <div class="stat-label">中危</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item low-risk">
                <div class="stat-value">{{ statistics.lowRisk }}</div>
                <div class="stat-label">低危</div>
              </div>
            </el-col>
          </el-row>

          <el-descriptions :column="2" border style="margin-top: 16px">
            <el-descriptions-item label="处理完成率">
              <el-progress
                :percentage="statistics.resolvedRate"
                :color="statistics.resolvedRate >= 80 ? '#67c23a' : '#e6a23c'"
              />
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 实时预警 -->
        <el-card class="alerts-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span><i class="el-icon-bell"></i> 实时预警</span>
              <el-badge :value="realtimeAlerts.filter(a => !a.acknowledged).length" type="danger">
                <el-button size="small">未确认</el-button>
              </el-badge>
            </div>
          </template>

          <div class="alerts-list">
            <el-alert
              v-for="alert in realtimeAlerts.slice(0, 5)"
              :key="alert.id"
              :type="alert.level === 'high' ? 'error' : alert.level === 'medium' ? 'warning' : 'info'"
              :closable="false"
              class="alert-item"
              :class="{ acknowledged: alert.acknowledged }"
            >
              <template #title>
                <div class="alert-header">
                  <span class="alert-time">{{ alert.time }}</span>
                  <el-tag
                    :type="getBehaviorTypeTag(alert.type).type"
                    size="small"
                  >
                    {{ getBehaviorTypeTag(alert.type).text }}
                  </el-tag>
                </div>
              </template>
              <div class="alert-content">
                <p><strong>位置：</strong>{{ alert.cameraName }}</p>
                <p><strong>等级：</strong>
                  <el-tag :type="getLevelTag(alert.level).type" size="small">
                    {{ getLevelTag(alert.level).text }}
                  </el-tag>
                </p>
                <p><strong>置信度：</strong>{{ alert.confidence }}%</p>
                <el-button
                  v-if="!alert.acknowledged"
                  type="primary"
                  size="small"
                  style="margin-top: 8px"
                  @click="acknowledgeAlert(alert)"
                >
                  确认预警
                </el-button>
                <el-tag v-else type="success" size="small" style="margin-top: 8px">
                  已确认
                </el-tag>
              </div>
            </el-alert>

            <div v-if="realtimeAlerts.length === 0" class="empty-alerts">
              <i class="el-icon-success"></i>
              <p>暂无预警信息</p>
            </div>
          </div>
        </el-card>

        <!-- 检测规则配置 -->
        <el-card class="rules-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span><i class="el-icon-setting"></i> 检测规则配置</span>
            </div>
          </template>

          <div class="rules-list">
            <div
              v-for="rule in detectionRules"
              :key="rule.id"
              class="rule-item"
            >
              <div class="rule-header">
                <div class="rule-info">
                  <span class="rule-name">{{ rule.name }}</span>
                  <el-tag
                    :type="getBehaviorTypeTag(rule.type).type"
                    size="small"
                  >
                    {{ getBehaviorTypeTag(rule.type).text }}
                  </el-tag>
                </div>
                <el-switch
                  v-model="rule.enabled"
                  @change="toggleRule(rule)"
                />
              </div>

              <div v-if="rule.enabled" class="rule-config">
                <div class="config-item">
                  <span class="config-label">敏感度：</span>
                  <el-slider
                    v-model="rule.sensitivity"
                    :min="0"
                    :max="100"
                    :show-tooltip="true"
                    @change="updateRuleSensitivity(rule)"
                    style="flex: 1; margin: 0 12px"
                  />
                  <span class="config-value">{{ rule.sensitivity }}%</span>
                </div>

                <div class="config-item">
                  <span class="config-label">阈值：</span>
                  <el-slider
                    v-model="rule.threshold"
                    :min="0"
                    :max="100"
                    :show-tooltip="true"
                    style="flex: 1; margin: 0 12px"
                  />
                  <span class="config-value">{{ rule.threshold }}%</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.abnormal-behavior-container {
}

.toolbar-card {
  margin-bottom: 16px;

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 16px;

      .camera-count {
        color: #606266;
        font-size: 14px;
      }
    }
  }
}

.main-content {
  .el-card {
    margin-bottom: 16px;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;

  i {
    margin-right: 8px;
  }
}

// 监控画面样式
.monitor-card {
  .video-grid {
    display: grid;
    gap: 12px;

    &.layout-2x2 {
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(2, 1fr);
    }

    &.layout-3x3 {
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(3, 1fr);
    }

    &.layout-1\+5 {
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(2, 1fr);

      .main-video {
        grid-column: span 2;
        grid-row: span 2;
      }
    }

    .video-item {
      position: relative;
      aspect-ratio: 16/9;
      border-radius: 8px;
      overflow: hidden;

      .video-placeholder {
        width: 100%;
        height: 100%;
        background-image: url('https://img2.baidu.com/it/u=1350434216,2080123126&fm=253&fmt=auto&app=138&f=JPEG?w=708&h=500');
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        position: relative;

        > i {
          font-size: 48px;
          opacity: 0.3;
          margin-bottom: 16px;
        }

        .camera-info {
          text-align: center;

          .camera-name {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 8px;
          }
        }

        .abnormal-overlay {
          position: absolute;
          top: 20%;
          left: 30%;
          width: 40%;
          height: 35%;
          border: 2px solid #f56c6c;
          border-radius: 4px;
          background: rgba(245, 108, 108, 0.1);
          animation: pulse 2s infinite;

          .detection-box {
            position: absolute;
            top: -24px;
            left: 0;

            .detection-label {
              background: #f56c6c;
              color: white;
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 12px;
              white-space: nowrap;
            }
          }
        }

        .abnormal-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          font-size: 24px;
        }
      }
    }
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

// 记录表格样式
.records-card {
  .filter-bar {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }
}

// 统计面板样式
.statistics-card {
  .stat-item {
    text-align: center;
    padding: 16px;
    background: #f5f7fa;
    border-radius: 8px;

    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #409eff;
      margin-bottom: 8px;
    }

    .stat-label {
      font-size: 14px;
      color: #909399;
    }

    &.high-risk .stat-value {
      color: #f56c6c;
    }

    &.medium-risk .stat-value {
      color: #e6a23c;
    }

    &.low-risk .stat-value {
      color: #e6a23c;
    }
  }
}

// 实时预警样式
.alerts-card {
  .alerts-list {
    max-height: 400px;
    overflow-y: auto;

    .alert-item {
      margin-bottom: 12px;

      &.acknowledged {
        opacity: 0.6;
      }

      .alert-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        .alert-time {
          font-weight: 600;
        }
      }

      .alert-content {
        p {
          margin: 4px 0;
          font-size: 14px;
        }
      }
    }

    .empty-alerts {
      text-align: center;
      padding: 48px 0;
      color: #909399;

      i {
        font-size: 64px;
        color: #67c23a;
        margin-bottom: 16px;
      }

      p {
        font-size: 16px;
      }
    }
  }
}

// 规则配置样式
.rules-card {
  .rules-list {
    .rule-item {
      padding: 16px;
      background: #f5f7fa;
      border-radius: 8px;
      margin-bottom: 12px;

      .rule-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        .rule-info {
          display: flex;
          align-items: center;
          gap: 12px;

          .rule-name {
            font-weight: 600;
            font-size: 15px;
          }
        }
      }

      .rule-config {
        padding-top: 12px;
        border-top: 1px solid #e4e7ed;

        .config-item {
          display: flex;
          align-items: center;
          margin-bottom: 12px;

          &:last-child {
            margin-bottom: 0;
          }

          .config-label {
            width: 70px;
            font-size: 14px;
            color: #606266;
          }

          .config-value {
            width: 50px;
            text-align: right;
            font-weight: 600;
            color: #409eff;
          }
        }
      }
    }
  }
}

// 滚动条样式
:deep(.alerts-list::-webkit-scrollbar) {
  width: 6px;
}

:deep(.alerts-list::-webkit-scrollbar-thumb) {
  background: #dcdfe6;
  border-radius: 3px;
}

:deep(.alerts-list::-webkit-scrollbar-thumb:hover) {
  background: #c0c4cc;
}
</style>
