<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElNotification, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import {
  Setting,
  Document,
  View,
  Edit,
  Delete,
  Plus,
  Check,
  Close,
  Warning,
  Download,
  Refresh,
  CircleCheck,
  CircleClose,
  Clock,
  DataLine
} from '@element-plus/icons-vue'

// 类型定义
type StrategyStatus = 'active' | 'inactive' | 'testing' | 'disabled'
type AuditStatus = 'passed' | 'rejected' | 'pending' | 'processing'
type ReviewStatus = 'pending' | 'in_progress' | 'completed' | 'rejected'
type ComplianceLevel = 'high' | 'medium' | 'low'
type RiskLevel = 'high' | 'medium' | 'low' | 'safe'

// 审核策略
interface AuditStrategy {
  id: string
  name: string
  status: StrategyStatus
  scene: string
  description: string
  rules: AuditRule[]
  effectiveTime: string
  expiryTime?: string
  region: string
  priority: number
  createdAt: string
  updatedAt: string
  version: string
}

// 审核规则
interface AuditRule {
  id: string
  category: string
  threshold: number
  action: 'pass' | 'reject' | 'review'
  enabled: boolean
  description: string
}

// 实时监控数据
interface MonitorData {
  totalAudits: number
  passedAudits: number
  rejectedAudits: number
  pendingReviews: number
  accuracy: number
  falsePositiveRate: number
  avgResponseTime: number
  qps: number
}

// 复审任务
interface ReviewTask {
  id: string
  contentId: string
  contentType: string
  contentPreview: string
  status: ReviewStatus
  strategyId: string
  strategyName: string
  riskLevel: RiskLevel
  autoResult: 'passed' | 'rejected'
  violations: string[]
  assignee?: string
  reviewNotes?: string
  createdAt: string
  reviewedAt?: string
  priority: number
}

// 合规配置
interface ComplianceConfig {
  id: string
  region: string
  regulations: string[]
  requirements: string[]
  level: ComplianceLevel
  enabled: boolean
  lastAuditDate: string
}

// 策略效果分析
interface StrategyAnalytics {
  strategyId: string
  strategyName: string
  totalProcessed: number
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  avgProcessTime: number
  trend: 'up' | 'down' | 'stable'
}

// 响应式数据
const activeTab = ref('strategy')

// 审核策略列表
const strategies = ref<AuditStrategy[]>([])
const selectedStrategy = ref<AuditStrategy | null>(null)
const showStrategyDialog = ref(false)
const strategyFormRef = ref<FormInstance>()

// 策略表单
const strategyForm = reactive<Partial<AuditStrategy>>({
  name: '',
  scene: '',
  description: '',
  region: 'CN',
  priority: 1,
  effectiveTime: '',
  expiryTime: '',
  rules: []
})

// 实时监控数据
const monitorData = reactive<MonitorData>({
  totalAudits: 0,
  passedAudits: 0,
  rejectedAudits: 0,
  pendingReviews: 0,
  accuracy: 0,
  falsePositiveRate: 0,
  avgResponseTime: 0,
  qps: 0
})

// 实时趋势数据
const trendData = reactive({
  timestamps: [] as string[],
  auditCounts: [] as number[],
  accuracy: [] as number[]
})

// 复审任务列表
const reviewTasks = ref<ReviewTask[]>([])
const selectedTask = ref<ReviewTask | null>(null)
const showReviewDialog = ref(false)
const reviewNotes = ref('')

// 合规配置列表
const complianceConfigs = ref<ComplianceConfig[]>([])
const showComplianceDialog = ref(false)

// 策略效果分析
const strategyAnalytics = ref<StrategyAnalytics[]>([])

// 筛选条件
const strategyFilter = ref<StrategyStatus | 'all'>('all')
const reviewFilter = ref<ReviewStatus | 'all'>('all')
const riskFilter = ref<RiskLevel | 'all'>('all')

// 计算属性 - 筛选后的策略
const filteredStrategies = computed(() => {
  if (strategyFilter.value === 'all') {
    return strategies.value
  }
  return strategies.value.filter(s => s.status === strategyFilter.value)
})

// 计算属性 - 筛选后的复审任务
const filteredReviewTasks = computed(() => {
  let tasks = reviewTasks.value
  if (reviewFilter.value !== 'all') {
    tasks = tasks.filter(t => t.status === reviewFilter.value)
  }
  if (riskFilter.value !== 'all') {
    tasks = tasks.filter(t => t.riskLevel === riskFilter.value)
  }
  return tasks.sort((a, b) => b.priority - a.priority)
})

// 计算属性 - 待复审任务数
const pendingReviewCount = computed(() => {
  return reviewTasks.value.filter(t => t.status === 'pending').length
})

// 计算属性 - 高优先级任务数
const highPriorityCount = computed(() => {
  return reviewTasks.value.filter(t => t.priority >= 3 && t.status === 'pending').length
})

// 获取策略状态标签类型
const getStrategyStatusType = (status: StrategyStatus) => {
  const map = {
    active: 'success',
    inactive: 'info',
    testing: 'primary',
    disabled: 'danger'
  }
  return map[status] as any
}

// 获取策略状态文本
const getStrategyStatusText = (status: StrategyStatus) => {
  const map = {
    active: '生效',
    inactive: '未生效',
    testing: '测试中',
    disabled: '停用'
  }
  return map[status]
}

// 获取审核状态标签类型
const getAuditStatusType = (status: AuditStatus) => {
  const map = {
    passed: 'success',
    rejected: 'danger',
    pending: 'warning',
    processing: 'primary'
  }
  return map[status] as any
}

// 获取审核状态文本
const getAuditStatusText = (status: AuditStatus) => {
  const map = {
    passed: '通过',
    rejected: '拒绝',
    pending: '待复审',
    processing: '处理中'
  }
  return map[status]
}

// 获取复审状态类型
const getReviewStatusType = (status: ReviewStatus) => {
  const map = {
    pending: 'warning',
    in_progress: 'primary',
    completed: 'success',
    rejected: 'danger'
  }
  return map[status] as any
}

// 获取复审状态文本
const getReviewStatusText = (status: ReviewStatus) => {
  const map = {
    pending: '待处理',
    in_progress: '处理中',
    completed: '已完成',
    rejected: '已驳回'
  }
  return map[status]
}

// 获取风险等级类型
const getRiskLevelType = (level: RiskLevel) => {
  const map = {
    high: 'danger',
    medium: 'warning',
    low: 'primary',
    safe: 'success'
  }
  return map[level] as any
}

// 获取风险等级文本
const getRiskLevelText = (level: RiskLevel) => {
  const map = {
    high: '高危',
    medium: '中危',
    low: '低危',
    safe: '安全'
  }
  return map[level]
}

// 获取合规等级类型
const getComplianceLevelType = (level: ComplianceLevel) => {
  const map = {
    high: 'danger',
    medium: 'warning',
    low: 'success'
  }
  return map[level] as any
}

// 新建策略
const createStrategy = () => {
  Object.assign(strategyForm, {
    name: '',
    scene: '',
    description: '',
    region: 'CN',
    priority: 1,
    effectiveTime: '',
    expiryTime: '',
    rules: [
      { id: '1', category: '涉黄内容', threshold: 0.8, action: 'reject', enabled: true, description: '色情、低俗内容识别' },
      { id: '2', category: '涉暴内容', threshold: 0.75, action: 'reject', enabled: true, description: '暴力、血腥内容识别' },
      { id: '3', category: '违禁品', threshold: 0.7, action: 'reject', enabled: true, description: '违禁物品识别' },
      { id: '4', category: '广告推广', threshold: 0.6, action: 'review', enabled: true, description: '广告营销内容' }
    ]
  })
  selectedStrategy.value = null
  showStrategyDialog.value = true
}

// 编辑策略
const editStrategy = (strategy: AuditStrategy) => {
  selectedStrategy.value = strategy
  Object.assign(strategyForm, { ...strategy })
  showStrategyDialog.value = true
}

// 保存策略
const saveStrategy = async () => {
  if (!strategyFormRef.value) return

  await strategyFormRef.value.validate((valid) => {
    if (valid) {
      if (selectedStrategy.value) {
        // 更新现有策略
        const index = strategies.value.findIndex(s => s.id === selectedStrategy.value!.id)
        if (index !== -1) {
          strategies.value[index] = {
            ...strategies.value[index],
            ...strategyForm,
            updatedAt: new Date().toLocaleString(),
            version: `v${parseFloat(strategies.value[index].version.slice(1)) + 0.1}`
          } as AuditStrategy
        }
        ElMessage.success('策略更新成功')
      } else {
        // 创建新策略
        const newStrategy: AuditStrategy = {
          id: `strategy-${Date.now()}`,
          name: strategyForm.name!,
          scene: strategyForm.scene!,
          description: strategyForm.description!,
          region: strategyForm.region!,
          priority: strategyForm.priority!,
          effectiveTime: strategyForm.effectiveTime!,
          expiryTime: strategyForm.expiryTime,
          rules: strategyForm.rules!,
          status: 'inactive',
          createdAt: new Date().toLocaleString(),
          updatedAt: new Date().toLocaleString(),
          version: 'v1.0'
        }
        strategies.value.unshift(newStrategy)
        ElMessage.success('策略创建成功')
      }
      showStrategyDialog.value = false
    }
  })
}

// 删除策略
const deleteStrategy = (strategy: AuditStrategy) => {
  ElMessageBox.confirm(
    `确定要删除策略"${strategy.name}"吗？此操作不可恢复。`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const index = strategies.value.findIndex(s => s.id === strategy.id)
    if (index !== -1) {
      strategies.value.splice(index, 1)
      ElMessage.success('策略已删除')
    }
  }).catch(() => {
    // 取消删除
  })
}

// 切换策略状态
const toggleStrategyStatus = (strategy: AuditStrategy) => {
  const newStatus = strategy.status === 'active' ? 'inactive' : 'active'
  strategy.status = newStatus
  strategy.updatedAt = new Date().toLocaleString()
  ElMessage.success(`策略已${newStatus === 'active' ? '启用' : '停用'}`)
}

// 开始复审任务
const startReview = (task: ReviewTask) => {
  selectedTask.value = task
  reviewNotes.value = task.reviewNotes || ''
  showReviewDialog.value = true
  
  // 更新任务状态为处理中
  task.status = 'in_progress'
}

// 完成复审 - 通过
const approveReview = () => {
  if (!selectedTask.value) return
  
  selectedTask.value.status = 'completed'
  selectedTask.value.reviewNotes = reviewNotes.value
  selectedTask.value.reviewedAt = new Date().toLocaleString()
  
  monitorData.pendingReviews--
  monitorData.passedAudits++
  
  ElNotification({
    title: '复审完成',
    message: `任务 ${selectedTask.value.contentId} 已通过复审`,
    type: 'success'
  })
  
  showReviewDialog.value = false
  selectedTask.value = null
  reviewNotes.value = ''
}

// 完成复审 - 驳回
const rejectReview = () => {
  if (!selectedTask.value) return
  
  if (!reviewNotes.value.trim()) {
    ElMessage.warning('请填写驳回原因')
    return
  }
  
  selectedTask.value.status = 'rejected'
  selectedTask.value.reviewNotes = reviewNotes.value
  selectedTask.value.reviewedAt = new Date().toLocaleString()
  
  monitorData.pendingReviews--
  monitorData.rejectedAudits++
  
  ElNotification({
    title: '复审完成',
    message: `任务 ${selectedTask.value.contentId} 已驳回`,
    type: 'warning'
  })
  
  showReviewDialog.value = false
  selectedTask.value = null
  reviewNotes.value = ''
}

// 导出合规报告
const exportComplianceReport = () => {
  const report = {
    exportTime: new Date().toLocaleString(),
    complianceConfigs: complianceConfigs.value,
    strategies: strategies.value,
    statistics: monitorData
  }
  
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `compliance-report-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success('合规报告已导出')
}

// 导出策略效果分析
const exportAnalytics = () => {
  const report = {
    exportTime: new Date().toLocaleString(),
    analytics: strategyAnalytics.value,
    monitorData: monitorData
  }
  
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `strategy-analytics-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success('分析报告已导出')
}

// 刷新监控数据
const refreshMonitorData = () => {
  // 模拟数据刷新
  monitorData.qps = Math.floor(Math.random() * 200 + 300)
  monitorData.avgResponseTime = Math.floor(Math.random() * 50 + 80)
  
  // 更新趋势数据
  const now = new Date()
  const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`
  trendData.timestamps.push(timeStr)
  trendData.auditCounts.push(Math.floor(Math.random() * 100 + 200))
  trendData.accuracy.push(monitorData.accuracy)
  
  // 保持最近20个数据点
  if (trendData.timestamps.length > 20) {
    trendData.timestamps.shift()
    trendData.auditCounts.shift()
    trendData.accuracy.shift()
  }
  
  ElMessage.success('数据已刷新')
}

// 初始化 Mock 数据
const initMockData = () => {
  // 初始化审核策略
  strategies.value = [
    {
      id: 'strategy-1',
      name: '社交媒体通用审核策略',
      status: 'active',
      scene: '社交媒体',
      description: '适用于用户生成内容的通用审核策略，包含涉黄、涉暴、广告等多维度检测',
      rules: [
        { id: '1', category: '涉黄内容', threshold: 0.8, action: 'reject', enabled: true, description: '色情、低俗内容识别' },
        { id: '2', category: '涉暴内容', threshold: 0.75, action: 'reject', enabled: true, description: '暴力、血腥内容识别' },
        { id: '3', category: '违禁品', threshold: 0.7, action: 'reject', enabled: true, description: '违禁物品识别' },
        { id: '4', category: '广告推广', threshold: 0.6, action: 'review', enabled: true, description: '广告营销内容' }
      ],
      effectiveTime: '2025-01-01 00:00:00',
      region: 'CN',
      priority: 5,
      createdAt: '2025-01-15 10:30:00',
      updatedAt: '2025-10-20 14:20:00',
      version: 'v2.3'
    },
    {
      id: 'strategy-2',
      name: '电商平台商品审核策略',
      status: 'active',
      scene: '电商平台',
      description: '针对电商平台商品图片和描述的专项审核策略',
      rules: [
        { id: '1', category: '假冒伪劣', threshold: 0.85, action: 'reject', enabled: true, description: '假冒品牌识别' },
        { id: '2', category: '虚假宣传', threshold: 0.7, action: 'review', enabled: true, description: '虚假广告检测' },
        { id: '3', category: '违禁商品', threshold: 0.9, action: 'reject', enabled: true, description: '违禁物品销售' }
      ],
      effectiveTime: '2025-02-01 00:00:00',
      region: 'CN',
      priority: 4,
      createdAt: '2025-02-01 09:00:00',
      updatedAt: '2025-10-15 11:00:00',
      version: 'v1.5'
    },
    {
      id: 'strategy-3',
      name: '未成年人保护专项策略',
      status: 'testing',
      scene: '青少年模式',
      description: '专门针对未成年人保护的严格审核策略',
      rules: [
        { id: '1', category: '不适宜内容', threshold: 0.6, action: 'reject', enabled: true, description: '不适合未成年人的内容' },
        { id: '2', category: '诱导消费', threshold: 0.7, action: 'reject', enabled: true, description: '诱导未成年人消费' }
      ],
      effectiveTime: '2025-11-01 00:00:00',
      region: 'CN',
      priority: 5,
      createdAt: '2025-10-25 15:00:00',
      updatedAt: '2025-10-28 16:30:00',
      version: 'v1.0'
    },
    {
      id: 'strategy-4',
      name: '海外市场合规策略',
      status: 'inactive',
      scene: '国际化',
      description: '符合国际市场法律法规的审核策略',
      rules: [
        { id: '1', category: '版权侵权', threshold: 0.8, action: 'reject', enabled: true, description: 'DMCA版权保护' },
        { id: '2', category: '隐私泄露', threshold: 0.75, action: 'reject', enabled: true, description: 'GDPR隐私保护' }
      ],
      effectiveTime: '2025-12-01 00:00:00',
      region: 'US',
      priority: 3,
      createdAt: '2025-10-20 10:00:00',
      updatedAt: '2025-10-28 09:00:00',
      version: 'v0.9'
    }
  ]
  
  // 初始化监控数据
  Object.assign(monitorData, {
    totalAudits: 15847,
    passedAudits: 14523,
    rejectedAudits: 1089,
    pendingReviews: 235,
    accuracy: 97.8,
    falsePositiveRate: 1.5,
    avgResponseTime: 125,
    qps: 450
  })
  
  // 初始化复审任务
  reviewTasks.value = [
    {
      id: 'task-1',
      contentId: 'IMG-20251030-001',
      contentType: '图片',
      contentPreview: '用户上传的商品图片',
      status: 'pending',
      strategyId: 'strategy-1',
      strategyName: '社交媒体通用审核策略',
      riskLevel: 'medium',
      autoResult: 'rejected',
      violations: ['广告推广'],
      priority: 3,
      createdAt: '2025-10-30 14:25:30'
    },
    {
      id: 'task-2',
      contentId: 'TXT-20251030-002',
      contentType: '文本',
      contentPreview: '商品描述文案...',
      status: 'pending',
      strategyId: 'strategy-2',
      strategyName: '电商平台商品审核策略',
      riskLevel: 'high',
      autoResult: 'rejected',
      violations: ['虚假宣传', '夸大功效'],
      priority: 5,
      createdAt: '2025-10-30 14:18:15'
    },
    {
      id: 'task-3',
      contentId: 'IMG-20251030-003',
      contentType: '图片',
      contentPreview: '用户头像照片',
      status: 'in_progress',
      strategyId: 'strategy-1',
      strategyName: '社交媒体通用审核策略',
      riskLevel: 'low',
      autoResult: 'rejected',
      violations: ['低俗内容'],
      assignee: '审核员A',
      priority: 2,
      createdAt: '2025-10-30 14:10:20'
    },
    {
      id: 'task-4',
      contentId: 'VIDEO-20251030-004',
      contentType: '视频',
      contentPreview: '短视频内容',
      status: 'completed',
      strategyId: 'strategy-3',
      strategyName: '未成年人保护专项策略',
      riskLevel: 'medium',
      autoResult: 'rejected',
      violations: ['不适宜内容'],
      assignee: '审核员B',
      reviewNotes: '经复审，该内容确实不适合未成年人观看，维持原判。',
      priority: 4,
      createdAt: '2025-10-30 13:45:10',
      reviewedAt: '2025-10-30 14:05:30'
    },
    {
      id: 'task-5',
      contentId: 'IMG-20251030-005',
      contentType: '图片',
      contentPreview: '产品宣传海报',
      status: 'rejected',
      strategyId: 'strategy-2',
      strategyName: '电商平台商品审核策略',
      riskLevel: 'low',
      autoResult: 'rejected',
      violations: ['轻微广告'],
      assignee: '审核员C',
      reviewNotes: '误判，该内容为正常商品展示，予以通过。',
      priority: 1,
      createdAt: '2025-10-30 13:30:00',
      reviewedAt: '2025-10-30 13:50:15'
    }
  ]
  
  // 初始化合规配置
  complianceConfigs.value = [
    {
      id: 'compliance-1',
      region: '中国大陆',
      regulations: ['网络安全法', '未成年人保护法', '个人信息保护法'],
      requirements: [
        '严格审核涉政、涉黄、涉暴内容',
        '保护未成年人信息安全',
        '确保用户隐私数据合规处理'
      ],
      level: 'high',
      enabled: true,
      lastAuditDate: '2025-10-15'
    },
    {
      id: 'compliance-2',
      region: '欧盟地区',
      regulations: ['GDPR', 'DSA (Digital Services Act)'],
      requirements: [
        '用户数据处理需获得明确同意',
        '提供数据删除和可携带权',
        '违法内容需快速响应删除'
      ],
      level: 'high',
      enabled: true,
      lastAuditDate: '2025-10-10'
    },
    {
      id: 'compliance-3',
      region: '美国',
      regulations: ['COPPA', 'DMCA', 'CDA Section 230'],
      requirements: [
        '儿童在线隐私保护',
        '版权侵权快速处理机制',
        '内容审核免责保护'
      ],
      level: 'medium',
      enabled: true,
      lastAuditDate: '2025-10-20'
    }
  ]
  
  // 初始化策略效果分析
  strategyAnalytics.value = [
    {
      strategyId: 'strategy-1',
      strategyName: '社交媒体通用审核策略',
      totalProcessed: 8523,
      accuracy: 98.2,
      precision: 96.8,
      recall: 97.5,
      f1Score: 97.1,
      avgProcessTime: 115,
      trend: 'up'
    },
    {
      strategyId: 'strategy-2',
      strategyName: '电商平台商品审核策略',
      totalProcessed: 5641,
      accuracy: 97.5,
      precision: 95.3,
      recall: 96.8,
      f1Score: 96.0,
      avgProcessTime: 135,
      trend: 'stable'
    },
    {
      strategyId: 'strategy-3',
      strategyName: '未成年人保护专项策略',
      totalProcessed: 1683,
      accuracy: 96.8,
      precision: 94.5,
      recall: 95.2,
      f1Score: 94.8,
      avgProcessTime: 142,
      trend: 'up'
    },
    {
      strategyId: 'strategy-4',
      strategyName: '海外市场合规策略',
      totalProcessed: 0,
      accuracy: 0,
      precision: 0,
      recall: 0,
      f1Score: 0,
      avgProcessTime: 0,
      trend: 'stable'
    }
  ]
  
  // 初始化趋势数据
  const now = new Date()
  for (let i = 19; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60000)
    const timeStr = `${time.getHours()}:${String(time.getMinutes()).padStart(2, '0')}`
    trendData.timestamps.push(timeStr)
    trendData.auditCounts.push(Math.floor(Math.random() * 100 + 200))
    trendData.accuracy.push(97 + Math.random() * 2)
  }
}

// 定时刷新监控数据
let refreshTimer: number | null = null

onMounted(() => {
  // 初始化数据
  setTimeout(() => {
    initMockData()
    ElMessage.success('数据加载完成')
  }, 500)
  
  // 定时刷新监控数据（每30秒）
  refreshTimer = window.setInterval(() => {
    refreshMonitorData()
  }, 30000)
})

// 清理定时器
import { onUnmounted } from 'vue'
onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<template>
  <div class="audit-strategy-page">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <el-row :gutter="16">
        <el-col :span="12">
          <h2 class="page-title">审核策略管理</h2>
          <p class="page-subtitle">灵活配置审核策略，实时监控审核效果，高效管理人工复审流程</p>
        </el-col>
        <el-col :span="12" class="text-right">
          <el-button :icon="Refresh" @click="refreshMonitorData">刷新数据</el-button>
          <el-button :icon="Download" @click="exportComplianceReport">导出合规报告</el-button>
          <el-button :icon="Plus" type="primary" @click="createStrategy">新建策略</el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 主要内容区域 -->
    <el-row :gutter="20" class="main-content">
      <!-- 左侧：策略配置区 -->
      <el-col :span="8">
        <!-- 策略列表 -->
        <el-card shadow="hover" class="strategy-card">
          <template #header>
            <div class="card-header">
              <span>审核策略配置</span>
              <el-select v-model="strategyFilter" size="small" style="width: 120px">
                <el-option label="全部状态" value="all" />
                <el-option label="生效" value="active" />
                <el-option label="未生效" value="inactive" />
                <el-option label="测试中" value="testing" />
                <el-option label="停用" value="disabled" />
              </el-select>
            </div>
          </template>

          <div class="strategy-list">
            <el-empty v-if="filteredStrategies.length === 0" description="暂无策略配置" />
            
            <div v-else class="strategy-items">
              <div 
                v-for="strategy in filteredStrategies" 
                :key="strategy.id" 
                class="strategy-item"
                :class="{ active: strategy.status === 'active' }"
              >
                <div class="strategy-header">
                  <div class="strategy-title">
                    <span class="name">{{ strategy.name }}</span>
                    <el-tag :type="getStrategyStatusType(strategy.status)" size="small">
                      {{ getStrategyStatusText(strategy.status) }}
                    </el-tag>
                  </div>
                  <div class="strategy-actions">
                    <el-button :icon="Edit" size="small" text @click="editStrategy(strategy)" />
                    <el-button :icon="Delete" size="small" text type="danger" @click="deleteStrategy(strategy)" />
                  </div>
                </div>

                <div class="strategy-info">
                  <div class="info-item">
                    <span class="label">业务场景：</span>
                    <span class="value">{{ strategy.scene }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">适用地区：</span>
                    <span class="value">{{ strategy.region }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">优先级：</span>
                    <el-rate v-model="strategy.priority" disabled show-score size="small" />
                  </div>
                  <div class="info-item">
                    <span class="label">版本：</span>
                    <el-tag size="small" type="info">{{ strategy.version }}</el-tag>
                  </div>
                </div>

                <div class="strategy-description">
                  {{ strategy.description }}
                </div>

                <div class="strategy-rules">
                  <div class="rules-header">审核规则 ({{ strategy.rules.filter(r => r.enabled).length }}/{{ strategy.rules.length }})</div>
                  <div class="rules-list">
                    <el-tag 
                      v-for="rule in strategy.rules.filter(r => r.enabled)" 
                      :key="rule.id" 
                      size="small"
                      class="rule-tag"
                    >
                      {{ rule.category }}
                    </el-tag>
                  </div>
                </div>

                <div class="strategy-footer">
                  <el-button 
                    size="small" 
                    :type="strategy.status === 'active' ? 'warning' : 'success'"
                    plain
                    @click="toggleStrategyStatus(strategy)"
                  >
                    {{ strategy.status === 'active' ? '停用' : '启用' }}
                  </el-button>
                  <span class="update-time">更新于 {{ strategy.updatedAt }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 合规性管理 -->
        <el-card shadow="hover" class="compliance-card">
          <template #header>
            <div class="card-header">
              <span>合规性管理</span>
              <el-button :icon="Download" size="small" @click="exportComplianceReport">导出</el-button>
            </div>
          </template>

          <div class="compliance-list">
            <div v-for="config in complianceConfigs" :key="config.id" class="compliance-item">
              <div class="compliance-header">
                <span class="region">{{ config.region }}</span>
                <el-tag :type="getComplianceLevelType(config.level)" size="small">
                  {{ config.level === 'high' ? '高合规要求' : config.level === 'medium' ? '中等要求' : '低要求' }}
                </el-tag>
              </div>
              
              <div class="compliance-regulations">
                <div class="label">适用法规：</div>
                <div class="regulations">
                  <el-tag 
                    v-for="(reg, idx) in config.regulations" 
                    :key="idx" 
                    size="small" 
                    type="info"
                  >
                    {{ reg }}
                  </el-tag>
                </div>
              </div>

              <div class="compliance-footer">
                <span class="audit-date">最后审计：{{ config.lastAuditDate }}</span>
                <el-switch v-model="config.enabled" size="small" />
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 中间：实时监控看板 -->
      <el-col :span="8">
        <!-- 实时统计 -->
        <el-card shadow="hover" class="monitor-card">
          <template #header>
            <div class="card-header">
              <span>实时审核监控</span>
              <el-tag type="success" size="small">
                <el-icon class="is-loading"><Refresh /></el-icon>
                实时
              </el-tag>
            </div>
          </template>

          <div class="statistics-grid">
            <div class="stat-item">
              <div class="stat-value">{{ monitorData.totalAudits.toLocaleString() }}</div>
              <div class="stat-label">总审核数</div>
            </div>
            <div class="stat-item success">
              <div class="stat-value">{{ monitorData.passedAudits.toLocaleString() }}</div>
              <div class="stat-label">通过</div>
              <div class="stat-percent">
                {{ ((monitorData.passedAudits / monitorData.totalAudits) * 100).toFixed(1) }}%
              </div>
            </div>
            <div class="stat-item danger">
              <div class="stat-value">{{ monitorData.rejectedAudits.toLocaleString() }}</div>
              <div class="stat-label">拒绝</div>
              <div class="stat-percent">
                {{ ((monitorData.rejectedAudits / monitorData.totalAudits) * 100).toFixed(1) }}%
              </div>
            </div>
            <div class="stat-item warning">
              <div class="stat-value">{{ monitorData.pendingReviews.toLocaleString() }}</div>
              <div class="stat-label">待复审</div>
              <div class="stat-percent">
                {{ ((monitorData.pendingReviews / monitorData.totalAudits) * 100).toFixed(1) }}%
              </div>
            </div>
          </div>
        </el-card>

        <!-- 性能指标 -->
        <el-card shadow="hover" class="performance-card">
          <template #header>
            <div class="card-header">
              <span>性能指标</span>
            </div>
          </template>

          <div class="performance-metrics">
            <div class="metric-item">
              <div class="metric-header">
                <span class="metric-label">审核准确率</span>
                <span class="metric-value success">{{ monitorData.accuracy }}%</span>
              </div>
              <el-progress 
                :percentage="monitorData.accuracy" 
                :color="monitorData.accuracy >= 95 ? '#67c23a' : '#e6a23c'"
                :show-text="false"
              />
            </div>

            <div class="metric-item">
              <div class="metric-header">
                <span class="metric-label">误判率</span>
                <span class="metric-value warning">{{ monitorData.falsePositiveRate }}%</span>
              </div>
              <el-progress 
                :percentage="monitorData.falsePositiveRate" 
                color="#f56c6c"
                :show-text="false"
              />
            </div>

            <el-divider />

            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="平均响应时间">
                <el-tag type="primary" size="small">{{ monitorData.avgResponseTime }} ms</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="实时 QPS">
                <el-tag type="success" size="small">{{ monitorData.qps }} 次/秒</el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-card>

        <!-- 异常预警 -->
        <el-card shadow="hover" class="alert-card">
          <template #header>
            <div class="card-header">
              <span>异常预警</span>
            </div>
          </template>

          <div class="alerts">
            <el-alert
              v-if="monitorData.falsePositiveRate > 2"
              title="误判率偏高"
              type="warning"
              :closable="false"
              show-icon
            >
              <template #default>
                当前误判率为 {{ monitorData.falsePositiveRate }}%，建议优化策略阈值配置
              </template>
            </el-alert>

            <el-alert
              v-if="pendingReviewCount > 200"
              title="待复审任务积压"
              type="error"
              :closable="false"
              show-icon
            >
              <template #default>
                当前有 {{ pendingReviewCount }} 个待复审任务，其中 {{ highPriorityCount }} 个高优先级任务
              </template>
            </el-alert>

            <el-alert
              v-if="monitorData.accuracy >= 97 && monitorData.falsePositiveRate <= 2 && pendingReviewCount <= 200"
              title="系统运行正常"
              type="success"
              :closable="false"
              show-icon
            >
              <template #default>
                所有指标均在正常范围内，审核系统运行稳定
              </template>
            </el-alert>
          </div>
        </el-card>

        <!-- 策略效果分析 -->
        <el-card shadow="hover" class="analytics-card">
          <template #header>
            <div class="card-header">
              <span>策略效果分析</span>
              <el-button :icon="Download" size="small" @click="exportAnalytics">导出</el-button>
            </div>
          </template>

          <div class="analytics-list">
            <div v-for="item in strategyAnalytics.filter(a => a.totalProcessed > 0)" :key="item.strategyId" class="analytics-item">
              <div class="analytics-header">
                <span class="strategy-name">{{ item.strategyName }}</span>
                <el-icon v-if="item.trend === 'up'" color="#67c23a"><i-ep-top /></el-icon>
                <el-icon v-else-if="item.trend === 'down'" color="#f56c6c"><i-ep-bottom /></el-icon>
                <el-icon v-else color="#909399"><i-ep-minus /></el-icon>
              </div>

              <el-descriptions :column="2" size="small" border>
                <el-descriptions-item label="处理量">{{ item.totalProcessed.toLocaleString() }}</el-descriptions-item>
                <el-descriptions-item label="准确率">
                  <el-tag :type="item.accuracy >= 97 ? 'success' : 'warning'" size="small">
                    {{ item.accuracy }}%
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="精确率">{{ item.precision }}%</el-descriptions-item>
                <el-descriptions-item label="召回率">{{ item.recall }}%</el-descriptions-item>
                <el-descriptions-item label="F1分数">{{ item.f1Score }}%</el-descriptions-item>
                <el-descriptions-item label="处理时间">{{ item.avgProcessTime }} ms</el-descriptions-item>
              </el-descriptions>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：人工复审工作区 -->
      <el-col :span="8">
        <!-- 复审任务队列 -->
        <el-card shadow="hover" class="review-card">
          <template #header>
            <div class="card-header">
              <span>人工复审工作台</span>
              <el-badge :value="pendingReviewCount" :max="99" type="danger">
                <el-button :icon="View" size="small">待处理</el-button>
              </el-badge>
            </div>
          </template>

          <div class="review-filters">
            <el-select v-model="reviewFilter" size="small" placeholder="复审状态">
              <el-option label="全部状态" value="all" />
              <el-option label="待处理" value="pending" />
              <el-option label="处理中" value="in_progress" />
              <el-option label="已完成" value="completed" />
              <el-option label="已驳回" value="rejected" />
            </el-select>

            <el-select v-model="riskFilter" size="small" placeholder="风险等级">
              <el-option label="全部等级" value="all" />
              <el-option label="高危" value="high" />
              <el-option label="中危" value="medium" />
              <el-option label="低危" value="low" />
              <el-option label="安全" value="safe" />
            </el-select>
          </div>

          <div class="review-list">
            <el-empty v-if="filteredReviewTasks.length === 0" description="暂无复审任务" />
            
            <div v-else class="review-items">
              <div 
                v-for="task in filteredReviewTasks" 
                :key="task.id" 
                class="review-item"
                :class="{ 'high-priority': task.priority >= 4 }"
              >
                <div class="review-header">
                  <div class="content-id">
                    <el-tag :type="getRiskLevelType(task.riskLevel)" size="small">
                      {{ getRiskLevelText(task.riskLevel) }}
                    </el-tag>
                    <span class="id">{{ task.contentId }}</span>
                  </div>
                  <el-tag :type="getReviewStatusType(task.status)" size="small">
                    {{ getReviewStatusText(task.status) }}
                  </el-tag>
                </div>

                <div class="review-info">
                  <div class="info-row">
                    <span class="label">内容类型：</span>
                    <span class="value">{{ task.contentType }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">使用策略：</span>
                    <span class="value">{{ task.strategyName }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">自动结果：</span>
                    <el-tag :type="task.autoResult === 'passed' ? 'success' : 'danger'" size="small">
                      {{ task.autoResult === 'passed' ? '通过' : '拒绝' }}
                    </el-tag>
                  </div>
                  <div class="info-row">
                    <span class="label">违规项：</span>
                    <div class="violations-tags">
                      <el-tag 
                        v-for="(violation, idx) in task.violations" 
                        :key="idx" 
                        type="danger" 
                        size="small"
                      >
                        {{ violation }}
                      </el-tag>
                    </div>
                  </div>
                  <div v-if="task.assignee" class="info-row">
                    <span class="label">审核员：</span>
                    <span class="value">{{ task.assignee }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">优先级：</span>
                    <el-rate v-model="task.priority" disabled size="small" />
                  </div>
                </div>

                <div class="review-content">
                  <div class="content-preview">{{ task.contentPreview }}</div>
                </div>

                <div v-if="task.reviewNotes" class="review-notes">
                  <div class="notes-label">复审意见：</div>
                  <div class="notes-content">{{ task.reviewNotes }}</div>
                </div>

                <div class="review-footer">
                  <span class="create-time">{{ task.createdAt }}</span>
                  <el-button 
                    v-if="task.status === 'pending'" 
                    :icon="View" 
                    size="small" 
                    type="primary"
                    @click="startReview(task)"
                  >
                    开始复审
                  </el-button>
                  <span v-else-if="task.reviewedAt" class="review-time">
                    复审于 {{ task.reviewedAt }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 复审质量统计 -->
        <el-card shadow="hover" class="quality-card">
          <template #header>
            <div class="card-header">
              <span>复审质量评估</span>
            </div>
          </template>

          <div class="quality-stats">
            <el-timeline>
              <el-timeline-item timestamp="今日" placement="top">
                <div class="timeline-content">
                  <p>完成复审任务：<strong>28</strong> 个</p>
                  <p>平均处理时长：<strong>3.5</strong> 分钟</p>
                  <p>复审准确率：<strong>99.2%</strong></p>
                </div>
              </el-timeline-item>
              <el-timeline-item timestamp="本周" placement="top">
                <div class="timeline-content">
                  <p>完成复审任务：<strong>156</strong> 个</p>
                  <p>策略优化建议：<strong>5</strong> 条</p>
                  <p>误判纠正率：<strong>12.8%</strong></p>
                </div>
              </el-timeline-item>
              <el-timeline-item timestamp="本月" placement="top">
                <div class="timeline-content">
                  <p>完成复审任务：<strong>682</strong> 个</p>
                  <p>累计优化策略：<strong>15</strong> 次</p>
                  <p>整体准确率提升：<strong>+2.3%</strong></p>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 策略配置弹窗 -->
    <el-dialog
      v-model="showStrategyDialog"
      :title="selectedStrategy ? '编辑策略' : '新建策略'"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="strategyFormRef"
        :model="strategyForm"
        label-width="120px"
      >
        <el-form-item label="策略名称" prop="name" required>
          <el-input v-model="strategyForm.name" placeholder="请输入策略名称" />
        </el-form-item>

        <el-form-item label="业务场景" prop="scene" required>
          <el-select v-model="strategyForm.scene" placeholder="请选择业务场景" style="width: 100%">
            <el-option label="社交媒体" value="社交媒体" />
            <el-option label="电商平台" value="电商平台" />
            <el-option label="视频直播" value="视频直播" />
            <el-option label="青少年模式" value="青少年模式" />
            <el-option label="国际化" value="国际化" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>

        <el-form-item label="适用地区" prop="region" required>
          <el-select v-model="strategyForm.region" placeholder="请选择适用地区" style="width: 100%">
            <el-option label="中国大陆" value="CN" />
            <el-option label="美国" value="US" />
            <el-option label="欧盟" value="EU" />
            <el-option label="全球" value="GLOBAL" />
          </el-select>
        </el-form-item>

        <el-form-item label="优先级" prop="priority">
          <el-rate v-model="strategyForm.priority" show-score />
        </el-form-item>

        <el-form-item label="生效时间" prop="effectiveTime" required>
          <el-date-picker
            v-model="strategyForm.effectiveTime"
            type="datetime"
            placeholder="选择生效时间"
            style="width: 100%"
            format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>

        <el-form-item label="失效时间" prop="expiryTime">
          <el-date-picker
            v-model="strategyForm.expiryTime"
            type="datetime"
            placeholder="选择失效时间（可选）"
            style="width: 100%"
            format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>

        <el-form-item label="策略描述" prop="description">
          <el-input
            v-model="strategyForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入策略描述"
          />
        </el-form-item>

        <el-divider content-position="left">审核规则配置</el-divider>

        <div v-if="strategyForm.rules && strategyForm.rules.length > 0" class="rules-config">
          <div v-for="rule in strategyForm.rules" :key="rule.id" class="rule-config-item">
            <el-form-item :label="rule.category">
              <el-row :gutter="10">
                <el-col :span="10">
                  <el-slider
                    v-model="rule.threshold"
                    :min="0"
                    :max="1"
                    :step="0.05"
                    show-input
                  />
                </el-col>
                <el-col :span="8">
                  <el-select v-model="rule.action" size="small">
                    <el-option label="通过" value="pass" />
                    <el-option label="拒绝" value="reject" />
                    <el-option label="人工复审" value="review" />
                  </el-select>
                </el-col>
                <el-col :span="6">
                  <el-switch v-model="rule.enabled" active-text="启用" inactive-text="禁用" />
                </el-col>
              </el-row>
            </el-form-item>
          </div>
        </div>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showStrategyDialog = false">取消</el-button>
          <el-button type="primary" @click="saveStrategy">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 复审弹窗 -->
    <el-dialog
      v-model="showReviewDialog"
      title="人工复审"
      width="600px"
      :close-on-click-modal="false"
    >
      <div v-if="selectedTask" class="review-dialog-content">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="内容ID">{{ selectedTask.contentId }}</el-descriptions-item>
          <el-descriptions-item label="内容类型">{{ selectedTask.contentType }}</el-descriptions-item>
          <el-descriptions-item label="风险等级">
            <el-tag :type="getRiskLevelType(selectedTask.riskLevel)" size="small">
              {{ getRiskLevelText(selectedTask.riskLevel) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="自动审核结果">
            <el-tag :type="selectedTask.autoResult === 'passed' ? 'success' : 'danger'" size="small">
              {{ selectedTask.autoResult === 'passed' ? '通过' : '拒绝' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="违规项">
            <div class="violations-tags">
              <el-tag 
                v-for="(violation, idx) in selectedTask.violations" 
                :key="idx" 
                type="danger" 
                size="small"
              >
                {{ violation }}
              </el-tag>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="使用策略">{{ selectedTask.strategyName }}</el-descriptions-item>
        </el-descriptions>

        <el-divider />

        <div class="content-preview-section">
          <h4>内容预览</h4>
          <div class="preview-box">{{ selectedTask.contentPreview }}</div>
        </div>

        <el-form label-width="100px" style="margin-top: 20px">
          <el-form-item label="复审意见" required>
            <el-input
              v-model="reviewNotes"
              type="textarea"
              :rows="4"
              placeholder="请填写复审意见和处理结果说明"
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showReviewDialog = false">取消</el-button>
          <el-button type="danger" @click="rejectReview" :icon="Close">驳回</el-button>
          <el-button type="success" @click="approveReview" :icon="Check">通过</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.audit-strategy-page {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 120px);

  .toolbar {
    background: white;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

    .page-title {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 600;
      color: #303133;
    }

    .page-subtitle {
      margin: 0;
      font-size: 14px;
      color: #909399;
    }

    .text-right {
      text-align: right;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      height: 100%;
    }
  }

  .main-content {
    .el-card {
      margin-bottom: 20px;
      border-radius: 8px;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 600;
        font-size: 16px;
      }
    }

    // 策略卡片
    .strategy-card {
      :deep(.el-card__body) {
        max-height: calc(100vh - 400px);
        overflow-y: auto;
        padding: 16px;
      }

      .strategy-list {
        .strategy-items {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .strategy-item {
          padding: 16px;
          background: #fafafa;
          border-radius: 8px;
          border: 2px solid #e4e7ed;
          transition: all 0.3s;

          &.active {
            border-color: #67c23a;
            background: #f0f9ff;
          }

          &:hover {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .strategy-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;

            .strategy-title {
              flex: 1;
              display: flex;
              align-items: center;
              gap: 8px;

              .name {
                font-weight: 600;
                font-size: 15px;
                color: #303133;
              }
            }

            .strategy-actions {
              display: flex;
              gap: 4px;
            }
          }

          .strategy-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-bottom: 12px;
            font-size: 13px;

            .info-item {
              display: flex;
              align-items: center;
              gap: 4px;

              .label {
                color: #909399;
              }

              .value {
                color: #606266;
                font-weight: 500;
              }
            }
          }

          .strategy-description {
            font-size: 13px;
            color: #606266;
            line-height: 1.6;
            margin-bottom: 12px;
            padding: 8px;
            background: white;
            border-radius: 4px;
          }

          .strategy-rules {
            margin-bottom: 12px;

            .rules-header {
              font-size: 13px;
              color: #606266;
              font-weight: 600;
              margin-bottom: 8px;
            }

            .rules-list {
              display: flex;
              flex-wrap: wrap;
              gap: 6px;

              .rule-tag {
                font-size: 12px;
              }
            }
          }

          .strategy-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 12px;
            border-top: 1px solid #e4e7ed;

            .update-time {
              font-size: 12px;
              color: #909399;
            }
          }
        }
      }
    }

    // 合规卡片
    .compliance-card {
      .compliance-list {
        display: flex;
        flex-direction: column;
        gap: 16px;

        .compliance-item {
          padding: 12px;
          background: #fafafa;
          border-radius: 6px;
          border: 1px solid #e4e7ed;

          .compliance-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;

            .region {
              font-weight: 600;
              font-size: 14px;
              color: #303133;
            }
          }

          .compliance-regulations {
            margin-bottom: 12px;

            .label {
              font-size: 12px;
              color: #909399;
              margin-bottom: 6px;
            }

            .regulations {
              display: flex;
              flex-wrap: wrap;
              gap: 6px;
            }
          }

          .compliance-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 8px;
            border-top: 1px solid #e4e7ed;

            .audit-date {
              font-size: 12px;
              color: #909399;
            }
          }
        }
      }
    }

    // 监控卡片
    .monitor-card {
      .statistics-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;

        .stat-item {
          text-align: center;
          padding: 16px;
          background: #f5f7fa;
          border-radius: 8px;

          &.success {
            background: #f0f9ff;
            border: 1px solid #b3e5fc;
          }

          &.danger {
            background: #fff5f5;
            border: 1px solid #ffcdd2;
          }

          &.warning {
            background: #fffbf0;
            border: 1px solid #ffe4b5;
          }

          .stat-value {
            font-size: 28px;
            font-weight: 700;
            color: #303133;
            margin-bottom: 8px;
          }

          .stat-label {
            font-size: 13px;
            color: #909399;
            margin-bottom: 4px;
          }

          .stat-percent {
            font-size: 12px;
            color: #606266;
            font-weight: 600;
          }
        }
      }
    }

    // 性能卡片
    .performance-card {
      .performance-metrics {
        .metric-item {
          margin-bottom: 20px;

          .metric-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;

            .metric-label {
              font-size: 14px;
              color: #606266;
              font-weight: 500;
            }

            .metric-value {
              font-size: 16px;
              font-weight: 600;

              &.success {
                color: #67c23a;
              }

              &.warning {
                color: #e6a23c;
              }
            }
          }
        }
      }
    }

    // 预警卡片
    .alert-card {
      .alerts {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .el-alert {
          :deep(.el-alert__title) {
            font-size: 14px;
            font-weight: 600;
          }

          :deep(.el-alert__description) {
            font-size: 13px;
            margin-top: 4px;
          }
        }
      }
    }

    // 分析卡片
    .analytics-card {
      :deep(.el-card__body) {
        max-height: 500px;
        overflow-y: auto;
      }

      .analytics-list {
        display: flex;
        flex-direction: column;
        gap: 16px;

        .analytics-item {
          padding: 12px;
          background: #fafafa;
          border-radius: 6px;
          border: 1px solid #e4e7ed;

          .analytics-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;

            .strategy-name {
              font-weight: 600;
              font-size: 14px;
              color: #303133;
            }
          }

          :deep(.el-descriptions) {
            .el-descriptions__label {
              font-size: 12px;
            }

            .el-descriptions__content {
              font-size: 12px;
            }
          }
        }
      }
    }

    // 复审卡片
    .review-card {
      :deep(.el-card__body) {
        padding: 16px;
      }

      .review-filters {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;

        .el-select {
          flex: 1;
        }
      }

      .review-list {
        max-height: calc(100vh - 450px);
        overflow-y: auto;

        .review-items {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .review-item {
          padding: 12px;
          background: #fafafa;
          border-radius: 6px;
          border: 1px solid #e4e7ed;
          transition: all 0.3s;

          &.high-priority {
            border-color: #f56c6c;
            border-width: 2px;
            background: #fff5f5;
          }

          &:hover {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .review-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;

            .content-id {
              display: flex;
              align-items: center;
              gap: 8px;

              .id {
                font-weight: 600;
                font-size: 13px;
                color: #303133;
              }
            }
          }

          .review-info {
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin-bottom: 12px;
            font-size: 12px;

            .info-row {
              display: flex;
              align-items: center;
              gap: 6px;

              .label {
                color: #909399;
                min-width: 70px;
              }

              .value {
                color: #606266;
                font-weight: 500;
              }

              .violations-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
              }
            }
          }

          .review-content {
            margin-bottom: 12px;

            .content-preview {
              padding: 8px;
              background: white;
              border-radius: 4px;
              font-size: 12px;
              color: #606266;
              line-height: 1.5;
            }
          }

          .review-notes {
            margin-bottom: 12px;
            padding: 8px;
            background: #f0f9ff;
            border-radius: 4px;
            border-left: 3px solid #409eff;

            .notes-label {
              font-size: 12px;
              color: #909399;
              font-weight: 600;
              margin-bottom: 4px;
            }

            .notes-content {
              font-size: 12px;
              color: #606266;
              line-height: 1.5;
            }
          }

          .review-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 8px;
            border-top: 1px solid #e4e7ed;

            .create-time,
            .review-time {
              font-size: 11px;
              color: #909399;
            }
          }
        }
      }
    }

    // 质量卡片
    .quality-card {
      .quality-stats {
        :deep(.el-timeline) {
          padding-left: 0;

          .el-timeline-item__timestamp {
            font-weight: 600;
            color: #606266;
          }
        }

        .timeline-content {
          p {
            margin: 4px 0;
            font-size: 13px;
            color: #606266;

            strong {
              color: #303133;
              font-weight: 600;
            }
          }
        }
      }
    }
  }

  // 弹窗样式
  .rules-config {
    .rule-config-item {
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e4e7ed;

      &:last-child {
        border-bottom: none;
      }
    }
  }

  .review-dialog-content {
    .violations-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .content-preview-section {
      h4 {
        margin: 16px 0 8px;
        font-size: 14px;
        color: #303133;
        font-weight: 600;
      }

      .preview-box {
        padding: 12px;
        background: #f5f7fa;
        border-radius: 4px;
        font-size: 13px;
        color: #606266;
        line-height: 1.6;
        min-height: 80px;
      }
    }
  }
}

// 滚动条样式
:deep(.strategy-list::-webkit-scrollbar),
:deep(.review-list::-webkit-scrollbar),
:deep(.analytics-list::-webkit-scrollbar) {
  width: 6px;
}

:deep(.strategy-list::-webkit-scrollbar-thumb),
:deep(.review-list::-webkit-scrollbar-thumb),
:deep(.analytics-list::-webkit-scrollbar-thumb) {
  background-color: #dcdfe6;
  border-radius: 3px;

  &:hover {
    background-color: #c0c4cc;
  }
}
</style>