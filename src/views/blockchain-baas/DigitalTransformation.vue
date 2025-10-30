<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'

// 类型定义
interface ChainDataMetrics {
  totalData: number
  chainedData: number
  successRate: number
  processingSpeed: number
  chainedToday: number
  growthRate: number
}

interface BusinessSystem {
  id: string
  name: string
  category: string
  dataCount: number
  chainedCount: number
  status: 'success' | 'processing' | 'pending' | 'failed'
  lastUpdate: string
  successRate: number
}

interface ProcessMapping {
  id: string
  name: string
  description: string
  steps: ProcessStep[]
  standardization: number
  automation: number
  optimization: string
}

interface ProcessStep {
  step: number
  name: string
  description: string
  chainNode: boolean
  status: 'completed' | 'inprogress' | 'pending'
}

interface TrustEvaluation {
  dimension: string
  beforeScore: number
  afterScore: number
  improvement: number
  description: string
}

interface EfficiencyMetrics {
  metric: string
  before: number
  after: number
  improvement: number
  unit: string
  trend: number[]
}

interface TransformationProgress {
  module: string
  maturity: number
  status: 'not_started' | 'in_progress' | 'completed' | 'optimizing'
  score: number
  tasks: {
    total: number
    completed: number
  }
  lastUpdate: string
}

interface TrendData {
  date: string
  value: number
}

// 业务导航菜单
const businessCategories = [
  { id: 'all', name: '全部业务', icon: '📊', count: 15 },
  { id: 'supply', name: '供应链管理', icon: '🔗', count: 5 },
  { id: 'finance', name: '财务管理', icon: '💰', count: 3 },
  { id: 'production', name: '生产管理', icon: '🏭', count: 4 },
  { id: 'quality', name: '质量管理', icon: '✅', count: 3 }
]

const selectedCategory = ref('all')

// 数据上链看板数据
const chainMetrics = ref<ChainDataMetrics>({
  totalData: 0,
  chainedData: 0,
  successRate: 0,
  processingSpeed: 0,
  chainedToday: 0,
  growthRate: 0
})

const businessSystems = ref<BusinessSystem[]>([])
const systemLoading = ref(false)

// 数据上链趋势
const chainTrend = ref<TrendData[]>([])

// 业务流程映射数据
const processMappings = ref<ProcessMapping[]>([])
const processLoading = ref(false)
const selectedProcess = ref<ProcessMapping | null>(null)

// 可信度评估数据
const trustEvaluations = ref<TrustEvaluation[]>([])
const trustLoading = ref(false)

// 效率提升分析数据
const efficiencyMetrics = ref<EfficiencyMetrics[]>([])
const efficiencyLoading = ref(false)

// 转型进度跟踪数据
const transformationProgress = ref<TransformationProgress[]>([])
const progressLoading = ref(false)

// 计算整体转型进度
const overallProgress = computed(() => {
  if (transformationProgress.value.length === 0) return 0
  const total = transformationProgress.value.reduce((sum, item) => sum + item.maturity, 0)
  return Math.round(total / transformationProgress.value.length)
})

// 计算筛选后的业务系统
const filteredSystems = computed(() => {
  if (selectedCategory.value === 'all') {
    return businessSystems.value
  }
  return businessSystems.value.filter(system => system.category === selectedCategory.value)
})

// 获取状态标签类型
const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    success: 'success',
    processing: 'primary',
    pending: 'info',
    failed: 'danger'
  }
  return typeMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    success: '已上链',
    processing: '上链中',
    pending: '待上链',
    failed: '失败'
  }
  return textMap[status] || status
}

// 获取转型状态类型
const getProgressStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    not_started: 'info',
    in_progress: 'primary',
    completed: 'success',
    optimizing: 'warning'
  }
  return typeMap[status] || 'info'
}

// 获取转型状态文本
const getProgressStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    not_started: '未开始',
    in_progress: '进行中',
    completed: '已完成',
    optimizing: '优化中'
  }
  return textMap[status] || status
}

// 加载数据上链看板数据
const loadChainMetrics = () => {
  systemLoading.value = true
  
  setTimeout(() => {
    // 模拟核心指标
    chainMetrics.value = {
      totalData: 1250000,
      chainedData: 1125000,
      successRate: 99.6,
      processingSpeed: 1580,
      chainedToday: 15600,
      growthRate: 12.5
    }

    // 模拟业务系统数据
    businessSystems.value = [
      {
        id: '1',
        name: '供应商管理系统',
        category: 'supply',
        dataCount: 125000,
        chainedCount: 123500,
        status: 'success',
        lastUpdate: '2 分钟前',
        successRate: 98.8
      },
      {
        id: '2',
        name: '采购订单系统',
        category: 'supply',
        dataCount: 98000,
        chainedCount: 96200,
        status: 'processing',
        lastUpdate: '刚刚',
        successRate: 98.2
      },
      {
        id: '3',
        name: '库存管理系统',
        category: 'supply',
        dataCount: 156000,
        chainedCount: 155200,
        status: 'success',
        lastUpdate: '5 分钟前',
        successRate: 99.5
      },
      {
        id: '4',
        name: '财务核算系统',
        category: 'finance',
        dataCount: 89000,
        chainedCount: 88650,
        status: 'success',
        lastUpdate: '3 分钟前',
        successRate: 99.6
      },
      {
        id: '5',
        name: '发票管理系统',
        category: 'finance',
        dataCount: 67000,
        chainedCount: 66500,
        status: 'processing',
        lastUpdate: '1 分钟前',
        successRate: 99.3
      },
      {
        id: '6',
        name: '资金结算系统',
        category: 'finance',
        dataCount: 45000,
        chainedCount: 43200,
        status: 'pending',
        lastUpdate: '10 分钟前',
        successRate: 96.0
      },
      {
        id: '7',
        name: '生产计划系统',
        category: 'production',
        dataCount: 78000,
        chainedCount: 77800,
        status: 'success',
        lastUpdate: '4 分钟前',
        successRate: 99.7
      },
      {
        id: '8',
        name: '设备监控系统',
        category: 'production',
        dataCount: 234000,
        chainedCount: 230000,
        status: 'processing',
        lastUpdate: '刚刚',
        successRate: 98.3
      },
      {
        id: '9',
        name: '工艺管理系统',
        category: 'production',
        dataCount: 56000,
        chainedCount: 55400,
        status: 'success',
        lastUpdate: '6 分钟前',
        successRate: 98.9
      },
      {
        id: '10',
        name: '产量统计系统',
        category: 'production',
        dataCount: 45000,
        chainedCount: 44100,
        status: 'failed',
        lastUpdate: '15 分钟前',
        successRate: 98.0
      },
      {
        id: '11',
        name: '质检管理系统',
        category: 'quality',
        dataCount: 89000,
        chainedCount: 88500,
        status: 'success',
        lastUpdate: '2 分钟前',
        successRate: 99.4
      },
      {
        id: '12',
        name: '不良品追溯系统',
        category: 'quality',
        dataCount: 34000,
        chainedCount: 33800,
        status: 'processing',
        lastUpdate: '刚刚',
        successRate: 99.4
      },
      {
        id: '13',
        name: '标准化管理系统',
        category: 'quality',
        dataCount: 23000,
        chainedCount: 22900,
        status: 'success',
        lastUpdate: '8 分钟前',
        successRate: 99.6
      },
      {
        id: '14',
        name: '物流跟踪系统',
        category: 'supply',
        dataCount: 67000,
        chainedCount: 65800,
        status: 'processing',
        lastUpdate: '1 分钟前',
        successRate: 98.2
      },
      {
        id: '15',
        name: '仓储管理系统',
        category: 'supply',
        dataCount: 76000,
        chainedCount: 75600,
        status: 'success',
        lastUpdate: '7 分钟前',
        successRate: 99.5
      }
    ]

    // 模拟趋势数据
    chainTrend.value = [
      { date: '10-23', value: 12500 },
      { date: '10-24', value: 13200 },
      { date: '10-25', value: 14100 },
      { date: '10-26', value: 13800 },
      { date: '10-27', value: 14500 },
      { date: '10-28', value: 15200 },
      { date: '10-29', value: 14900 },
      { date: '10-30', value: 15600 }
    ]

    systemLoading.value = false
    ElMessage.success('数据上链看板数据加载成功')
  }, 800)
}

// 加载业务流程映射数据
const loadProcessMappings = () => {
  processLoading.value = true
  
  setTimeout(() => {
    processMappings.value = [
      {
        id: '1',
        name: '采购到付款流程',
        description: '从采购申请到供应商付款的完整业务流程',
        standardization: 95,
        automation: 88,
        optimization: '建议优化审批环节，提升自动化程度',
        steps: [
          { step: 1, name: '采购申请', description: '业务部门发起采购需求', chainNode: true, status: 'completed' },
          { step: 2, name: '需求审批', description: '部门主管审批采购需求', chainNode: true, status: 'completed' },
          { step: 3, name: '供应商选择', description: '采购部门选择合格供应商', chainNode: true, status: 'completed' },
          { step: 4, name: '合同签订', description: '签订采购合同', chainNode: true, status: 'completed' },
          { step: 5, name: '订单执行', description: '供应商执行订单', chainNode: true, status: 'inprogress' },
          { step: 6, name: '收货验收', description: '验收入库', chainNode: true, status: 'pending' },
          { step: 7, name: '发票核对', description: '核对发票信息', chainNode: true, status: 'pending' },
          { step: 8, name: '付款结算', description: '完成付款', chainNode: true, status: 'pending' }
        ]
      },
      {
        id: '2',
        name: '订单到收款流程',
        description: '从销售订单到客户收款的完整业务流程',
        standardization: 92,
        automation: 85,
        optimization: '建议加强信用管理，降低收款风险',
        steps: [
          { step: 1, name: '订单接收', description: '接收客户订单', chainNode: true, status: 'completed' },
          { step: 2, name: '订单审核', description: '审核订单信息', chainNode: true, status: 'completed' },
          { step: 3, name: '生产计划', description: '安排生产计划', chainNode: true, status: 'completed' },
          { step: 4, name: '生产执行', description: '执行生产任务', chainNode: true, status: 'completed' },
          { step: 5, name: '质量检验', description: '产品质量检验', chainNode: true, status: 'completed' },
          { step: 6, name: '物流发货', description: '安排物流发货', chainNode: true, status: 'inprogress' },
          { step: 7, name: '客户签收', description: '客户签收确认', chainNode: true, status: 'pending' },
          { step: 8, name: '开具发票', description: '开具销售发票', chainNode: true, status: 'pending' },
          { step: 9, name: '款项催收', description: '催收应收款项', chainNode: true, status: 'pending' },
          { step: 10, name: '收款确认', description: '确认收款到账', chainNode: true, status: 'pending' }
        ]
      },
      {
        id: '3',
        name: '质量管控流程',
        description: '从原料检验到成品出库的质量管控流程',
        standardization: 98,
        automation: 90,
        optimization: '流程已优化，保持现有管控标准',
        steps: [
          { step: 1, name: '来料检验', description: '原材料到货检验', chainNode: true, status: 'completed' },
          { step: 2, name: '入库质检', description: '合格品入库检验', chainNode: true, status: 'completed' },
          { step: 3, name: '首件检验', description: '生产首件检验', chainNode: true, status: 'completed' },
          { step: 4, name: '过程巡检', description: '生产过程巡检', chainNode: true, status: 'completed' },
          { step: 5, name: '成品检验', description: '成品出厂检验', chainNode: true, status: 'completed' },
          { step: 6, name: '出库复检', description: '出库前复检', chainNode: true, status: 'inprogress' },
          { step: 7, name: '不良品处理', description: '不良品隔离处理', chainNode: true, status: 'pending' }
        ]
      },
      {
        id: '4',
        name: '生产制造流程',
        description: '从生产计划到产品完工的制造执行流程',
        standardization: 90,
        automation: 82,
        optimization: '建议引入更多自动化设备，提升生产效率',
        steps: [
          { step: 1, name: '计划下达', description: '生产计划下达', chainNode: true, status: 'completed' },
          { step: 2, name: '物料准备', description: '生产物料准备', chainNode: true, status: 'completed' },
          { step: 3, name: '工艺配置', description: '工艺参数配置', chainNode: true, status: 'completed' },
          { step: 4, name: '生产执行', description: '生产任务执行', chainNode: true, status: 'inprogress' },
          { step: 5, name: '数据采集', description: '生产数据采集', chainNode: true, status: 'inprogress' },
          { step: 6, name: '产量统计', description: '产量数据统计', chainNode: true, status: 'pending' },
          { step: 7, name: '完工入库', description: '成品入库', chainNode: true, status: 'pending' }
        ]
      }
    ]

    selectedProcess.value = processMappings.value[0]
    processLoading.value = false
    ElMessage.success('业务流程映射数据加载成功')
  }, 600)
}

// 加载可信度评估数据
const loadTrustEvaluations = () => {
  trustLoading.value = true
  
  setTimeout(() => {
    trustEvaluations.value = [
      {
        dimension: '数据完整性',
        beforeScore: 72,
        afterScore: 96,
        improvement: 24,
        description: '数据上链后，完整性和不可篡改性显著提升'
      },
      {
        dimension: '流程透明度',
        beforeScore: 65,
        afterScore: 92,
        improvement: 27,
        description: '业务流程全程可追溯，透明度大幅提升'
      },
      {
        dimension: '审计可追溯性',
        beforeScore: 68,
        afterScore: 98,
        improvement: 30,
        description: '所有操作留痕，审计追溯能力显著增强'
      },
      {
        dimension: '数据一致性',
        beforeScore: 75,
        afterScore: 95,
        improvement: 20,
        description: '多系统数据一致性得到保障'
      },
      {
        dimension: '合规性',
        beforeScore: 70,
        afterScore: 94,
        improvement: 24,
        description: '符合监管要求，合规性显著提升'
      },
      {
        dimension: '信任度',
        beforeScore: 63,
        afterScore: 90,
        improvement: 27,
        description: '合作伙伴和客户信任度明显提升'
      }
    ]

    trustLoading.value = false
    ElMessage.success('可信度评估数据加载成功')
  }, 500)
}

// 加载效率提升分析数据
const loadEfficiencyMetrics = () => {
  efficiencyLoading.value = true
  
  setTimeout(() => {
    efficiencyMetrics.value = [
      {
        metric: '订单处理时间',
        before: 48,
        after: 12,
        improvement: 75,
        unit: '小时',
        trend: [48, 42, 35, 28, 22, 18, 15, 12]
      },
      {
        metric: '数据录入时间',
        before: 120,
        after: 15,
        improvement: 87.5,
        unit: '分钟/单',
        trend: [120, 95, 75, 58, 42, 30, 22, 15]
      },
      {
        metric: '审批流转时间',
        before: 72,
        after: 24,
        improvement: 66.7,
        unit: '小时',
        trend: [72, 65, 58, 48, 38, 32, 28, 24]
      },
      {
        metric: '数据查询响应',
        before: 300,
        after: 50,
        improvement: 83.3,
        unit: '秒',
        trend: [300, 250, 200, 150, 110, 80, 65, 50]
      },
      {
        metric: '错误率',
        before: 8.5,
        after: 0.8,
        improvement: 90.6,
        unit: '%',
        trend: [8.5, 7.2, 5.8, 4.2, 3.0, 1.8, 1.2, 0.8]
      },
      {
        metric: '人力成本',
        before: 100,
        after: 35,
        improvement: 65,
        unit: '万元/月',
        trend: [100, 88, 75, 62, 52, 45, 40, 35]
      },
      {
        metric: '流程自动化率',
        before: 25,
        after: 85,
        improvement: 240,
        unit: '%',
        trend: [25, 35, 45, 55, 65, 72, 78, 85]
      }
    ]

    efficiencyLoading.value = false
    ElMessage.success('效率提升分析数据加载成功')
  }, 700)
}

// 加载转型进度跟踪数据
const loadTransformationProgress = () => {
  progressLoading.value = true
  
  setTimeout(() => {
    transformationProgress.value = [
      {
        module: '供应链数字化',
        maturity: 92,
        status: 'optimizing',
        score: 92,
        tasks: { total: 15, completed: 14 },
        lastUpdate: '2024-10-30'
      },
      {
        module: '财务数字化',
        maturity: 88,
        status: 'completed',
        score: 88,
        tasks: { total: 12, completed: 12 },
        lastUpdate: '2024-10-29'
      },
      {
        module: '生产数字化',
        maturity: 85,
        status: 'in_progress',
        score: 85,
        tasks: { total: 18, completed: 15 },
        lastUpdate: '2024-10-30'
      },
      {
        module: '质量数字化',
        maturity: 95,
        status: 'optimizing',
        score: 95,
        tasks: { total: 10, completed: 10 },
        lastUpdate: '2024-10-30'
      },
      {
        module: '物流数字化',
        maturity: 78,
        status: 'in_progress',
        score: 78,
        tasks: { total: 14, completed: 11 },
        lastUpdate: '2024-10-28'
      },
      {
        module: '销售数字化',
        maturity: 82,
        status: 'in_progress',
        score: 82,
        tasks: { total: 16, completed: 13 },
        lastUpdate: '2024-10-29'
      },
      {
        module: '人力资源数字化',
        maturity: 65,
        status: 'in_progress',
        score: 65,
        tasks: { total: 12, completed: 8 },
        lastUpdate: '2024-10-27'
      },
      {
        module: '客户服务数字化',
        maturity: 70,
        status: 'in_progress',
        score: 70,
        tasks: { total: 10, completed: 7 },
        lastUpdate: '2024-10-28'
      }
    ]

    progressLoading.value = false
    ElMessage.success('转型进度跟踪数据加载成功')
  }, 600)
}

// 选择业务流程
const selectProcess = (process: ProcessMapping) => {
  selectedProcess.value = process
}

// 生成转型报告
const generateReport = () => {
  ElNotification({
    title: '报告生成中',
    message: '正在生成数字化转型进度报告，请稍候...',
    type: 'info',
    duration: 2000
  })
  
  setTimeout(() => {
    ElNotification({
      title: '报告生成成功',
      message: '数字化转型进度报告已生成，可在报告中心查看',
      type: 'success',
      duration: 3000
    })
  }, 2000)
}

// 重试失败的上链任务
const retryFailedChain = (system: BusinessSystem) => {
  ElMessage.info(`正在重试 ${system.name} 的数据上链...`)
  
  setTimeout(() => {
    system.status = 'processing'
    ElMessage.success('重试成功，数据正在上链中')
  }, 1000)
}

// 查看详情
const viewDetails = (id: string, type: string) => {
  ElMessage.info(`查看${type}详情: ${id}`)
}

// 初始化加载所有数据
onMounted(() => {
  loadChainMetrics()
  loadProcessMappings()
  loadTrustEvaluations()
  loadEfficiencyMetrics()
  loadTransformationProgress()
})
</script>

<template>
  <div class="digital-transformation-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">🚀 数字化转型</h2>
        <p class="page-description">
          通过核心业务数据快速上链，提升数据透明度和可信度，促进业务流程标准化和自动化，助力企业实现数字化转型
        </p>
      </div>
      <el-button type="primary" @click="generateReport">生成转型报告</el-button>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧：业务导航菜单 -->
      <div class="left-panel">
        <el-card class="business-nav-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">业务分类</span>
            </div>
          </template>
          
          <div class="business-categories">
            <div
              v-for="category in businessCategories"
              :key="category.id"
              :class="['category-item', { active: selectedCategory === category.id }]"
              @click="selectedCategory = category.id"
            >
              <span class="category-icon">{{ category.icon }}</span>
              <div class="category-info">
                <span class="category-name">{{ category.name }}</span>
                <span class="category-count">{{ category.count }} 个系统</span>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 整体转型进度 -->
        <el-card class="overall-progress-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">整体转型进度</span>
            </div>
          </template>
          
          <div class="overall-progress">
            <el-progress
              type="circle"
              :percentage="overallProgress"
              :width="140"
              :stroke-width="12"
              :color="[
                { color: '#6366f1', percentage: 40 },
                { color: '#3b82f6', percentage: 70 },
                { color: '#10b981', percentage: 100 }
              ]"
            >
              <template #default="{ percentage }">
                <span class="progress-text">{{ percentage }}%</span>
                <span class="progress-label">数字化成熟度</span>
              </template>
            </el-progress>
            
            <div class="progress-stats">
              <div class="stat-item">
                <span class="stat-label">已完成模块</span>
                <span class="stat-value">2 个</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">进行中模块</span>
                <span class="stat-value">5 个</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">优化中模块</span>
                <span class="stat-value">2 个</span>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 中间：数据上链看板 -->
      <div class="center-panel">
        <!-- 核心指标 -->
        <el-row :gutter="16" class="metrics-row">
          <el-col :span="8">
            <el-card class="metric-card">
              <el-statistic title="数据上链总量" :value="chainMetrics.totalData">
                <template #suffix>
                  <span class="metric-unit">条</span>
                </template>
              </el-statistic>
              <div class="metric-footer">
                <el-tag type="success" size="small">
                  今日新增: {{ chainMetrics.chainedToday.toLocaleString() }}
                </el-tag>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card class="metric-card">
              <el-statistic title="上链成功率" :value="chainMetrics.successRate" :precision="1">
                <template #suffix>
                  <span class="metric-unit">%</span>
                </template>
              </el-statistic>
              <div class="metric-footer">
                <el-tag type="primary" size="small">
                  已上链: {{ chainMetrics.chainedData.toLocaleString() }} 条
                </el-tag>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card class="metric-card">
              <el-statistic title="处理速度" :value="chainMetrics.processingSpeed">
                <template #suffix>
                  <span class="metric-unit">条/分钟</span>
                </template>
              </el-statistic>
              <div class="metric-footer">
                <el-tag type="warning" size="small">
                  增长率: +{{ chainMetrics.growthRate }}%
                </el-tag>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- 业务系统上链情况 -->
        <el-card class="systems-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">业务系统上链情况</span>
              <span class="card-subtitle">{{ filteredSystems.length }} 个系统</span>
            </div>
          </template>
          
          <el-table
            :data="filteredSystems"
            v-loading="systemLoading"
            stripe
            style="width: 100%"
            max-height="400"
          >
            <el-table-column prop="name" label="系统名称" min-width="150" />
            <el-table-column label="上链进度" width="200">
              <template #default="{ row }">
                <div class="progress-cell">
                  <el-progress
                    :percentage="Math.round((row.chainedCount / row.dataCount) * 100)"
                    :status="row.status === 'success' ? 'success' : undefined"
                  />
                  <span class="progress-text">
                    {{ row.chainedCount.toLocaleString() }} / {{ row.dataCount.toLocaleString() }}
                  </span>
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
            <el-table-column prop="successRate" label="成功率" width="100">
              <template #default="{ row }">
                <span :class="{ 'high-success': row.successRate >= 99 }">
                  {{ row.successRate }}%
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="lastUpdate" label="更新时间" width="120" />
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button
                  link
                  type="primary"
                  size="small"
                  @click="viewDetails(row.id, '系统')"
                >
                  查看详情
                </el-button>
                <el-button
                  v-if="row.status === 'failed'"
                  link
                  type="warning"
                  size="small"
                  @click="retryFailedChain(row)"
                >
                  重试
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 业务流程映射 -->
        <el-card class="process-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">业务流程映射</span>
              <el-select
                v-model="selectedProcess"
                placeholder="选择业务流程"
                style="width: 300px"
                @change="selectProcess"
              >
                <el-option
                  v-for="process in processMappings"
                  :key="process.id"
                  :label="process.name"
                  :value="process"
                />
              </el-select>
            </div>
          </template>
          
          <div v-if="selectedProcess" class="process-content">
            <div class="process-info">
              <p class="process-description">{{ selectedProcess.description }}</p>
              <div class="process-metrics">
                <div class="process-metric-item">
                  <span class="metric-label">流程标准化</span>
                  <el-progress :percentage="selectedProcess.standardization" :stroke-width="10" />
                </div>
                <div class="process-metric-item">
                  <span class="metric-label">自动化程度</span>
                  <el-progress :percentage="selectedProcess.automation" :stroke-width="10" />
                </div>
              </div>
              <el-alert
                v-if="selectedProcess.optimization"
                :title="selectedProcess.optimization"
                type="info"
                :closable="false"
                show-icon
              />
            </div>
            
            <el-timeline class="process-timeline">
              <el-timeline-item
                v-for="step in selectedProcess.steps"
                :key="step.step"
                :timestamp="`步骤 ${step.step}`"
                :type="step.status === 'completed' ? 'success' : step.status === 'inprogress' ? 'primary' : 'info'"
                :hollow="step.status === 'pending'"
              >
                <div class="timeline-content">
                  <div class="timeline-header">
                    <strong>{{ step.name }}</strong>
                    <el-tag v-if="step.chainNode" type="success" size="small">
                      已配置上链
                    </el-tag>
                  </div>
                  <p class="timeline-description">{{ step.description }}</p>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-card>
      </div>

      <!-- 右侧：转型效果分析面板 -->
      <div class="right-panel">
        <!-- 可信度评估 -->
        <el-card class="trust-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">可信度评估</span>
            </div>
          </template>
          
          <div v-loading="trustLoading" class="trust-content">
            <div
              v-for="evaluation in trustEvaluations"
              :key="evaluation.dimension"
              class="trust-item"
            >
              <div class="trust-header">
                <span class="dimension-name">{{ evaluation.dimension }}</span>
                <el-tag type="success" size="small">
                  提升 {{ evaluation.improvement }}%
                </el-tag>
              </div>
              <div class="trust-scores">
                <div class="score-item">
                  <span class="score-label">上链前</span>
                  <el-progress
                    :percentage="evaluation.beforeScore"
                    :stroke-width="8"
                    color="#94a3b8"
                    :show-text="false"
                  />
                  <span class="score-value">{{ evaluation.beforeScore }}</span>
                </div>
                <div class="score-item">
                  <span class="score-label">上链后</span>
                  <el-progress
                    :percentage="evaluation.afterScore"
                    :stroke-width="8"
                    color="#10b981"
                    :show-text="false"
                  />
                  <span class="score-value">{{ evaluation.afterScore }}</span>
                </div>
              </div>
              <p class="trust-description">{{ evaluation.description }}</p>
            </div>
          </div>
        </el-card>

        <!-- 效率提升分析 -->
        <el-card class="efficiency-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">效率提升分析</span>
            </div>
          </template>
          
          <div v-loading="efficiencyLoading" class="efficiency-content">
            <div
              v-for="metric in efficiencyMetrics"
              :key="metric.metric"
              class="efficiency-item"
            >
              <div class="efficiency-header">
                <span class="metric-name">{{ metric.metric }}</span>
                <el-tag
                  :type="metric.improvement >= 80 ? 'success' : metric.improvement >= 50 ? 'warning' : 'info'"
                  size="small"
                >
                  {{ metric.improvement >= 0 ? '↑' : '↓' }} {{ Math.abs(metric.improvement) }}%
                </el-tag>
              </div>
              <div class="efficiency-comparison">
                <div class="comparison-item before">
                  <span class="comparison-label">转型前</span>
                  <span class="comparison-value">{{ metric.before }} {{ metric.unit }}</span>
                </div>
                <div class="comparison-arrow">→</div>
                <div class="comparison-item after">
                  <span class="comparison-label">转型后</span>
                  <span class="comparison-value">{{ metric.after }} {{ metric.unit }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 转型进度跟踪 -->
        <el-card class="progress-tracking-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">转型进度跟踪</span>
            </div>
          </template>
          
          <div v-loading="progressLoading" class="tracking-content">
            <div
              v-for="progress in transformationProgress"
              :key="progress.module"
              class="tracking-item"
            >
              <div class="tracking-header">
                <span class="module-name">{{ progress.module }}</span>
                <el-tag :type="getProgressStatusType(progress.status)" size="small">
                  {{ getProgressStatusText(progress.status) }}
                </el-tag>
              </div>
              <div class="tracking-progress">
                <el-progress
                  :percentage="progress.maturity"
                  :color="
                    progress.maturity >= 90
                      ? '#10b981'
                      : progress.maturity >= 70
                      ? '#3b82f6'
                      : '#f59e0b'
                  "
                />
              </div>
              <div class="tracking-details">
                <span class="detail-item">
                  成熟度评分: <strong>{{ progress.score }}</strong>
                </span>
                <span class="detail-item">
                  任务进度: <strong>{{ progress.tasks.completed }}/{{ progress.tasks.total }}</strong>
                </span>
              </div>
              <div class="tracking-footer">
                <span class="update-time">更新于 {{ progress.lastUpdate }}</span>
                <el-button link type="primary" size="small" @click="viewDetails(progress.module, '模块')">
                  查看详情
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.digital-transformation-container {
  padding: 20px;
background: #FFF;
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    color: white;

    .header-content {
      flex: 1;

      .page-title {
        font-size: 28px;
        font-weight: bold;
        margin: 0 0 8px 0;
      }

      .page-description {
        font-size: 14px;
        opacity: 0.9;
        margin: 0;
        line-height: 1.6;
      }
    }
  }

  .main-content {
    display: flex;
    gap: 20px;

    .left-panel {
      width: 280px;
      display: flex;
      flex-direction: column;
      gap: 20px;

      .business-nav-card {
        .business-categories {
          display: flex;
          flex-direction: column;
          gap: 8px;

          .category-item {
            display: flex;
            align-items: center;
            padding: 12px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            background-color: #f8fafc;

            &:hover {
              background-color: #e0e7ff;
              transform: translateX(4px);
            }

            &.active {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;

              .category-count {
                color: rgba(255, 255, 255, 0.9);
              }
            }

            .category-icon {
              font-size: 24px;
              margin-right: 12px;
            }

            .category-info {
              display: flex;
              flex-direction: column;
              flex: 1;

              .category-name {
                font-size: 14px;
                font-weight: 500;
                margin-bottom: 4px;
              }

              .category-count {
                font-size: 12px;
                color: #64748b;
              }
            }
          }
        }
      }

      .overall-progress-card {
        .overall-progress {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;

          .progress-text {
            display: block;
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
          }

          .progress-label {
            display: block;
            font-size: 12px;
            color: #64748b;
            margin-top: 4px;
          }

          .progress-stats {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 12px;

            .stat-item {
              display: flex;
              justify-content: space-between;
              padding: 8px 12px;
              background-color: #f8fafc;
              border-radius: 6px;

              .stat-label {
                font-size: 13px;
                color: #64748b;
              }

              .stat-value {
                font-size: 13px;
                font-weight: 600;
                color: #1e293b;
              }
            }
          }
        }
      }
    }

    .center-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 20px;

      .metrics-row {
        margin: 0;

        .metric-card {
          text-align: center;

          .metric-unit {
            font-size: 14px;
            color: #64748b;
            margin-left: 4px;
          }

          .metric-footer {
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid #e2e8f0;
          }
        }
      }

      .systems-card,
      .process-card {
        .progress-cell {
          display: flex;
          flex-direction: column;
          gap: 4px;

          .progress-text {
            font-size: 12px;
            color: #64748b;
          }
        }

        .high-success {
          color: #10b981;
          font-weight: 600;
        }
      }

      .process-card {
        .process-content {
          .process-info {
            margin-bottom: 24px;

            .process-description {
              font-size: 14px;
              color: #64748b;
              margin-bottom: 16px;
            }

            .process-metrics {
              display: flex;
              gap: 24px;
              margin-bottom: 16px;

              .process-metric-item {
                flex: 1;

                .metric-label {
                  display: block;
                  font-size: 13px;
                  color: #64748b;
                  margin-bottom: 8px;
                }
              }
            }
          }

          .process-timeline {
            padding: 20px 0;

            .timeline-content {
              .timeline-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;

                strong {
                  font-size: 14px;
                  color: #1e293b;
                }
              }

              .timeline-description {
                font-size: 13px;
                color: #64748b;
                margin: 0;
              }
            }
          }
        }
      }
    }

    .right-panel {
      width: 380px;
      display: flex;
      flex-direction: column;
      gap: 20px;

      .trust-card,
      .efficiency-card,
      .progress-tracking-card {
        .trust-content,
        .efficiency-content,
        .tracking-content {
          max-height: 600px;
          overflow-y: auto;

          &::-webkit-scrollbar {
            width: 6px;
          }

          &::-webkit-scrollbar-thumb {
            background-color: #cbd5e1;
            border-radius: 3px;
          }
        }
      }

      .trust-card {
        .trust-item {
          padding: 16px 0;
          border-bottom: 1px solid #e2e8f0;

          &:last-child {
            border-bottom: none;
          }

          .trust-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;

            .dimension-name {
              font-size: 14px;
              font-weight: 600;
              color: #1e293b;
            }
          }

          .trust-scores {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 12px;

            .score-item {
              display: flex;
              align-items: center;
              gap: 8px;

              .score-label {
                width: 50px;
                font-size: 12px;
                color: #64748b;
              }

              .score-value {
                width: 30px;
                text-align: right;
                font-size: 13px;
                font-weight: 600;
                color: #1e293b;
              }
            }
          }

          .trust-description {
            font-size: 12px;
            color: #64748b;
            margin: 0;
            line-height: 1.5;
          }
        }
      }

      .efficiency-card {
        .efficiency-item {
          padding: 16px 0;
          border-bottom: 1px solid #e2e8f0;

          &:last-child {
            border-bottom: none;
          }

          .efficiency-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;

            .metric-name {
              font-size: 14px;
              font-weight: 600;
              color: #1e293b;
            }
          }

          .efficiency-comparison {
            display: flex;
            align-items: center;
            gap: 12px;

            .comparison-item {
              flex: 1;
              padding: 12px;
              border-radius: 6px;
              text-align: center;

              &.before {
                background-color: #fef2f2;

                .comparison-value {
                  color: #ef4444;
                }
              }

              &.after {
                background-color: #f0fdf4;

                .comparison-value {
                  color: #10b981;
                }
              }

              .comparison-label {
                display: block;
                font-size: 12px;
                color: #64748b;
                margin-bottom: 4px;
              }

              .comparison-value {
                display: block;
                font-size: 14px;
                font-weight: 600;
              }
            }

            .comparison-arrow {
              font-size: 18px;
              color: #94a3b8;
              font-weight: bold;
            }
          }
        }
      }

      .progress-tracking-card {
        .tracking-item {
          padding: 16px 0;
          border-bottom: 1px solid #e2e8f0;

          &:last-child {
            border-bottom: none;
          }

          .tracking-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;

            .module-name {
              font-size: 14px;
              font-weight: 600;
              color: #1e293b;
            }
          }

          .tracking-progress {
            margin-bottom: 12px;
          }

          .tracking-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;

            .detail-item {
              font-size: 12px;
              color: #64748b;

              strong {
                color: #1e293b;
              }
            }
          }

          .tracking-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;

            .update-time {
              font-size: 12px;
              color: #94a3b8;
            }
          }
        }
      }
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
    }

    .card-subtitle {
      font-size: 13px;
      color: #64748b;
    }
  }
}

</style>
