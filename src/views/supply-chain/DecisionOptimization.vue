<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'

// 类型定义
interface DecisionSuggestion {
  id: string
  title: string
  priority: 'high' | 'medium' | 'low'
  category: 'inventory' | 'supplier' | 'logistics' | 'cost'
  description: string
  expectedEffect: {
    indicator: string
    current: number
    predicted: number
    improvement: number
  }[]
  riskLevel: 'low' | 'medium' | 'high'
  riskDesc: string
  cost: number
  duration: number // 预计执行周期（天）
  createTime: string
  isFavorite: boolean
}

interface SimulationStrategy {
  id: string
  name: string
  type: 'inventory' | 'supplier' | 'logistics'
  parameters: {
    key: string
    label: string
    current: number
    simulated: number
    unit: string
  }[]
  impact: {
    indicator: string
    baseline: number
    simulated: number
    change: number
    changeRate: number
  }[]
  status: 'pending' | 'simulating' | 'completed'
}

interface OptimizationPlan {
  id: string
  name: string
  category: string
  status: 'pending' | 'executing' | 'completed' | 'evaluated'
  priority: 'high' | 'medium' | 'low'
  createTime: string
  startTime?: string
  endTime?: string
  progress: number
  expectedEffect: string
  actualEffect?: string
  evaluation?: {
    score: number
    effectiveness: number
    sustainability: number
    feedback: string
  }
  executor: string
}

interface DecisionMetric {
  id: string
  name: string
  value: number
  target: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  status: 'normal' | 'warning' | 'danger'
  changeRate: number
}

interface ImprovementTrend {
  indicator: string
  data: {
    date: string
    value: number
    target: number
  }[]
  effectiveness: number
  sustainability: number
  measures: {
    name: string
    startDate: string
    effect: number
  }[]
}

// 响应式数据
const loading = ref(false)
const activeTab = ref('overview')

// 决策建议
const suggestions = ref<DecisionSuggestion[]>([])
const selectedSuggestion = ref<DecisionSuggestion | null>(null)
const suggestionFilter = ref({
  priority: '',
  category: ''
})

// 策略模拟
const currentStrategy = ref<SimulationStrategy | null>(null)
const simulationDialogVisible = ref(false)
const simulationForm = reactive({
  name: '',
  type: 'inventory' as 'inventory' | 'supplier' | 'logistics',
  parameters: [] as { key: string; label: string; value: number; unit: string }[]
})

// 优化方案
const optimizationPlans = ref<OptimizationPlan[]>([])
const planDialogVisible = ref(false)
const planFormRef = ref<FormInstance>()
const planForm = reactive({
  name: '',
  category: '',
  priority: 'medium' as 'high' | 'medium' | 'low',
  expectedEffect: '',
  executor: ''
})

// 评估对话框
const evaluationDialogVisible = ref(false)
const evaluationForm = reactive({
  planId: '',
  score: 80,
  effectiveness: 75,
  sustainability: 70,
  feedback: '',
  actualEffect: ''
})

// 决策看板
const decisionMetrics = ref<DecisionMetric[]>([])

// 持续改进
const improvementTrends = ref<ImprovementTrend[]>([])
const selectedTrendIndicator = ref('')

// 导出报告对话框
const reportDialogVisible = ref(false)
const reportForm = reactive({
  dateRange: [] as string[],
  indicators: [] as string[],
  includeDetails: true
})

// 计算属性
const filteredSuggestions = computed(() => {
  return suggestions.value.filter(item => {
    if (suggestionFilter.value.priority && item.priority !== suggestionFilter.value.priority) {
      return false
    }
    if (suggestionFilter.value.category && item.category !== suggestionFilter.value.category) {
      return false
    }
    return true
  })
})

const favoriteSuggestions = computed(() => {
  return suggestions.value.filter(item => item.isFavorite)
})

const plansByStatus = computed(() => {
  return {
    pending: optimizationPlans.value.filter(p => p.status === 'pending').length,
    executing: optimizationPlans.value.filter(p => p.status === 'executing').length,
    completed: optimizationPlans.value.filter(p => p.status === 'completed').length,
    evaluated: optimizationPlans.value.filter(p => p.status === 'evaluated').length
  }
})

const trendChartData = computed(() => {
  const trend = improvementTrends.value.find(t => t.indicator === selectedTrendIndicator.value)
  if (!trend) return { dates: [], values: [], targets: [] }
  
  return {
    dates: trend.data.map(d => d.date),
    values: trend.data.map(d => d.value),
    targets: trend.data.map(d => d.target)
  }
})

// 方法
const loadDecisionSuggestions = () => {
  loading.value = true
  setTimeout(() => {
    suggestions.value = [
      {
        id: 'SUG001',
        title: '优化库存周转率策略',
        priority: 'high',
        category: 'inventory',
        description: '基于历史销售数据分析，建议调整部分产品的安全库存水平，预计可提升库存周转率15%，降低库存成本约120万元/年。',
        expectedEffect: [
          { indicator: '库存周转率', current: 8.5, predicted: 9.8, improvement: 15.3 },
          { indicator: '库存成本', current: 800, predicted: 680, improvement: 15.0 },
          { indicator: '缺货率', current: 2.3, predicted: 1.8, improvement: 21.7 }
        ],
        riskLevel: 'low',
        riskDesc: '风险较低，建议优先执行。需要注意季节性波动可能带来的短期缺货风险。',
        cost: 35,
        duration: 45,
        createTime: '2024-10-28 09:30:00',
        isFavorite: true
      },
      {
        id: 'SUG002',
        title: '供应商绩效优化方案',
        priority: 'high',
        category: 'supplier',
        description: '通过供应商绩效评估，建议调整核心供应商组合，引入2家备选供应商，预计可降低采购成本8%，提升供应稳定性。',
        expectedEffect: [
          { indicator: '采购成本', current: 5600, predicted: 5152, improvement: 8.0 },
          { indicator: '准时交付率', current: 87.5, predicted: 93.2, improvement: 6.5 },
          { indicator: '质量合格率', current: 96.8, predicted: 98.5, improvement: 1.8 }
        ],
        riskLevel: 'medium',
        riskDesc: '存在供应商切换风险，建议分阶段实施，保持当前供应商作为备份。',
        cost: 68,
        duration: 90,
        createTime: '2024-10-28 10:15:00',
        isFavorite: true
      },
      {
        id: 'SUG003',
        title: '物流路径优化建议',
        priority: 'medium',
        category: 'logistics',
        description: '基于运输数据分析，建议优化配送路径和批次，可降低运输成本12%，缩短平均配送时间15%。',
        expectedEffect: [
          { indicator: '运输成本', current: 450, predicted: 396, improvement: 12.0 },
          { indicator: '配送时效', current: 3.2, predicted: 2.72, improvement: 15.0 },
          { indicator: '运输准时率', current: 89.5, predicted: 94.8, improvement: 5.9 }
        ],
        riskLevel: 'low',
        riskDesc: '风险较低，可立即实施。建议与物流供应商充分沟通。',
        cost: 25,
        duration: 30,
        createTime: '2024-10-27 14:20:00',
        isFavorite: false
      },
      {
        id: 'SUG004',
        title: '成本结构优化方案',
        priority: 'medium',
        category: 'cost',
        description: '通过精细化成本管理，优化采购、仓储、运输等环节的成本结构，预计整体成本可降低6%。',
        expectedEffect: [
          { indicator: '总成本', current: 8500, predicted: 7990, improvement: 6.0 },
          { indicator: '单位成本', current: 85.6, predicted: 80.5, improvement: 6.0 },
          { indicator: '成本效益比', current: 1.15, predicted: 1.22, improvement: 6.1 }
        ],
        riskLevel: 'medium',
        riskDesc: '需要各部门协同配合，实施周期较长，需要高层支持。',
        cost: 45,
        duration: 120,
        createTime: '2024-10-27 11:00:00',
        isFavorite: false
      },
      {
        id: 'SUG005',
        title: '需求预测模型优化',
        priority: 'low',
        category: 'inventory',
        description: '引入机器学习算法优化需求预测模型，提升预测准确率，减少库存积压和缺货情况。',
        expectedEffect: [
          { indicator: '预测准确率', current: 82.5, predicted: 91.2, improvement: 10.5 },
          { indicator: '过剩库存', current: 15.8, predicted: 9.6, improvement: 39.2 },
          { indicator: '缺货率', current: 2.3, predicted: 1.2, improvement: 47.8 }
        ],
        riskLevel: 'medium',
        riskDesc: '需要数据支持和技术投入，见效周期较长。',
        cost: 85,
        duration: 180,
        createTime: '2024-10-26 16:45:00',
        isFavorite: false
      }
    ]
    
    if (filteredSuggestions.value.length > 0) {
      selectedSuggestion.value = filteredSuggestions.value[0]
    }
    
    loading.value = false
  }, 800)
}

const loadOptimizationPlans = () => {
  loading.value = true
  setTimeout(() => {
    optimizationPlans.value = [
      {
        id: 'PLAN001',
        name: '库存优化方案-Q4',
        category: '库存管理',
        status: 'executing',
        priority: 'high',
        createTime: '2024-10-01 09:00:00',
        startTime: '2024-10-05 09:00:00',
        progress: 65,
        expectedEffect: '库存周转率提升12%，库存成本降低8%',
        executor: '张伟',
      },
      {
        id: 'PLAN002',
        name: '供应商结构调整计划',
        category: '供应商管理',
        status: 'completed',
        priority: 'high',
        createTime: '2024-09-15 10:30:00',
        startTime: '2024-09-20 09:00:00',
        endTime: '2024-10-20 18:00:00',
        progress: 100,
        expectedEffect: '采购成本降低5%，准时交付率提升8%',
        actualEffect: '采购成本降低6.2%，准时交付率提升9.5%',
        executor: '李娜',
        evaluation: {
          score: 92,
          effectiveness: 95,
          sustainability: 88,
          feedback: '方案执行效果超出预期，供应商响应积极，建议继续深化合作。'
        }
      },
      {
        id: 'PLAN003',
        name: '物流配送路径优化',
        category: '物流管理',
        status: 'evaluated',
        priority: 'medium',
        createTime: '2024-09-01 14:00:00',
        startTime: '2024-09-10 09:00:00',
        endTime: '2024-10-10 18:00:00',
        progress: 100,
        expectedEffect: '运输成本降低10%，配送时效提升15%',
        actualEffect: '运输成本降低11.5%，配送时效提升18%',
        executor: '王强',
        evaluation: {
          score: 95,
          effectiveness: 98,
          sustainability: 92,
          feedback: '优化效果显著且持续稳定，已形成标准化流程，建议推广至其他区域。'
        }
      },
      {
        id: 'PLAN004',
        name: '采购成本控制专项',
        category: '成本管理',
        status: 'executing',
        priority: 'medium',
        createTime: '2024-10-10 11:00:00',
        startTime: '2024-10-15 09:00:00',
        progress: 35,
        expectedEffect: '采购成本降低7%，供应商响应速度提升20%',
        executor: '赵敏',
      },
      {
        id: 'PLAN005',
        name: '季节性库存管理优化',
        category: '库存管理',
        status: 'pending',
        priority: 'low',
        createTime: '2024-10-20 15:30:00',
        progress: 0,
        expectedEffect: '季节性库存积压减少30%，资金占用降低25%',
        executor: '陈红',
      }
    ]
    loading.value = false
  }, 600)
}

const loadDecisionMetrics = () => {
  setTimeout(() => {
    decisionMetrics.value = [
      {
        id: 'M001',
        name: '整体成本降低率',
        value: 8.5,
        target: 10.0,
        unit: '%',
        trend: 'up',
        status: 'normal',
        changeRate: 12.5
      },
      {
        id: 'M002',
        name: '库存周转率',
        value: 9.2,
        target: 10.0,
        unit: '次/年',
        trend: 'up',
        status: 'normal',
        changeRate: 8.2
      },
      {
        id: 'M003',
        name: '准时交付率',
        value: 91.5,
        target: 95.0,
        unit: '%',
        trend: 'up',
        status: 'warning',
        changeRate: 4.8
      },
      {
        id: 'M004',
        name: '供应商响应时间',
        value: 2.8,
        target: 2.0,
        unit: '天',
        trend: 'down',
        status: 'warning',
        changeRate: -15.2
      },
      {
        id: 'M005',
        name: '方案执行率',
        value: 88.5,
        target: 90.0,
        unit: '%',
        trend: 'stable',
        status: 'normal',
        changeRate: 2.1
      },
      {
        id: 'M006',
        name: '决策有效性',
        value: 92.0,
        target: 95.0,
        unit: '%',
        trend: 'up',
        status: 'normal',
        changeRate: 6.5
      }
    ]
  }, 400)
}

const loadImprovementTrends = () => {
  setTimeout(() => {
    improvementTrends.value = [
      {
        indicator: '库存周转率',
        data: [
          { date: '2024-05', value: 7.2, target: 8.0 },
          { date: '2024-06', value: 7.8, target: 8.5 },
          { date: '2024-07', value: 8.2, target: 9.0 },
          { date: '2024-08', value: 8.6, target: 9.5 },
          { date: '2024-09', value: 9.0, target: 9.8 },
          { date: '2024-10', value: 9.2, target: 10.0 }
        ],
        effectiveness: 85,
        sustainability: 88,
        measures: [
          { name: '安全库存优化', startDate: '2024-06-01', effect: 12 },
          { name: '需求预测改进', startDate: '2024-07-15', effect: 18 },
          { name: '库存分类管理', startDate: '2024-09-01', effect: 15 }
        ]
      },
      {
        indicator: '采购成本',
        data: [
          { date: '2024-05', value: 5800, target: 5600 },
          { date: '2024-06', value: 5650, target: 5500 },
          { date: '2024-07', value: 5520, target: 5400 },
          { date: '2024-08', value: 5380, target: 5300 },
          { date: '2024-09', value: 5240, target: 5200 },
          { date: '2024-10', value: 5150, target: 5100 }
        ],
        effectiveness: 92,
        sustainability: 85,
        measures: [
          { name: '供应商优化', startDate: '2024-05-15', effect: 8 },
          { name: '批量采购策略', startDate: '2024-07-01', effect: 5 },
          { name: '价格谈判优化', startDate: '2024-08-10', effect: 4 }
        ]
      },
      {
        indicator: '准时交付率',
        data: [
          { date: '2024-05', value: 85.5, target: 88.0 },
          { date: '2024-06', value: 87.2, target: 89.0 },
          { date: '2024-07', value: 88.5, target: 90.0 },
          { date: '2024-08', value: 89.8, target: 92.0 },
          { date: '2024-09', value: 90.5, target: 93.0 },
          { date: '2024-10', value: 91.5, target: 95.0 }
        ],
        effectiveness: 78,
        sustainability: 82,
        measures: [
          { name: '物流路径优化', startDate: '2024-06-20', effect: 10 },
          { name: '供应商协同', startDate: '2024-08-01', effect: 12 },
          { name: '配送管理加强', startDate: '2024-09-15', effect: 8 }
        ]
      }
    ]
    selectedTrendIndicator.value = '库存周转率'
  }, 500)
}

const selectSuggestion = (suggestion: DecisionSuggestion) => {
  selectedSuggestion.value = suggestion
}

const toggleFavorite = (suggestion: DecisionSuggestion) => {
  suggestion.isFavorite = !suggestion.isFavorite
  ElMessage.success(suggestion.isFavorite ? '已添加到重点关注' : '已取消关注')
}

const openSimulation = (suggestionId?: string) => {
  simulationDialogVisible.value = true
  simulationForm.type = 'inventory'
  simulationForm.name = '策略模拟-' + new Date().getTime()
  
  // 根据类型设置参数
  updateSimulationParameters()
}

const updateSimulationParameters = () => {
  const parameterSets = {
    inventory: [
      { key: 'safetyStock', label: '安全库存水平', value: 1000, unit: '件' },
      { key: 'reorderPoint', label: '再订货点', value: 500, unit: '件' },
      { key: 'orderQuantity', label: '订货批量', value: 2000, unit: '件' },
      { key: 'leadTime', label: '采购提前期', value: 7, unit: '天' }
    ],
    supplier: [
      { key: 'supplierCount', label: '核心供应商数量', value: 8, unit: '家' },
      { key: 'concentrationRatio', label: '集中度比例', value: 60, unit: '%' },
      { key: 'qualityThreshold', label: '质量合格率要求', value: 98, unit: '%' },
      { key: 'responseTime', label: '响应时间要求', value: 24, unit: '小时' }
    ],
    logistics: [
      { key: 'routeCount', label: '配送路线数', value: 12, unit: '条' },
      { key: 'vehicleUtilization', label: '车辆利用率', value: 85, unit: '%' },
      { key: 'batchSize', label: '批次规模', value: 500, unit: '件' },
      { key: 'frequency', label: '配送频次', value: 3, unit: '次/周' }
    ]
  }
  
  simulationForm.parameters = parameterSets[simulationForm.type]
}

const startSimulation = () => {
  loading.value = true
  
  setTimeout(() => {
    const impacts = []
    
    if (simulationForm.type === 'inventory') {
      impacts.push(
        { indicator: '库存周转率', baseline: 8.5, simulated: 9.8, change: 1.3, changeRate: 15.3 },
        { indicator: '库存成本', baseline: 800, simulated: 680, change: -120, changeRate: -15.0 },
        { indicator: '缺货率', baseline: 2.3, simulated: 1.8, change: -0.5, changeRate: -21.7 },
        { indicator: '资金占用', baseline: 2500, simulated: 2150, change: -350, changeRate: -14.0 }
      )
    } else if (simulationForm.type === 'supplier') {
      impacts.push(
        { indicator: '采购成本', baseline: 5600, simulated: 5152, change: -448, changeRate: -8.0 },
        { indicator: '准时交付率', baseline: 87.5, simulated: 93.2, change: 5.7, changeRate: 6.5 },
        { indicator: '质量合格率', baseline: 96.8, simulated: 98.5, change: 1.7, changeRate: 1.8 },
        { indicator: '供应稳定性', baseline: 85.0, simulated: 92.0, change: 7.0, changeRate: 8.2 }
      )
    } else {
      impacts.push(
        { indicator: '运输成本', baseline: 450, simulated: 396, change: -54, changeRate: -12.0 },
        { indicator: '配送时效', baseline: 3.2, simulated: 2.72, change: -0.48, changeRate: -15.0 },
        { indicator: '运输准时率', baseline: 89.5, simulated: 94.8, change: 5.3, changeRate: 5.9 },
        { indicator: '客户满意度', baseline: 88.0, simulated: 93.5, change: 5.5, changeRate: 6.3 }
      )
    }
    
    currentStrategy.value = {
      id: 'SIM' + Date.now(),
      name: simulationForm.name,
      type: simulationForm.type,
      parameters: simulationForm.parameters.map(p => ({
        key: p.key,
        label: p.label,
        current: p.value,
        simulated: p.value * (0.9 + Math.random() * 0.2),
        unit: p.unit
      })),
      impact: impacts,
      status: 'completed'
    }
    
    loading.value = false
    ElMessage.success('策略模拟完成')
  }, 1500)
}

const saveAsTemplate = () => {
  if (!currentStrategy.value) return
  
  ElMessageBox.prompt('请输入模板名称', '保存为模板', {
    confirmButtonText: '保存',
    cancelButtonText: '取消',
    inputPattern: /\S+/,
    inputErrorMessage: '模板名称不能为空'
  }).then(({ value }) => {
    ElMessage.success(`模板"${value}"保存成功`)
  }).catch(() => {})
}

const applyStrategy = () => {
  if (!currentStrategy.value) return
  
  planForm.name = currentStrategy.value.name + '-执行方案'
  planForm.category = currentStrategy.value.type === 'inventory' ? '库存管理' : 
                      currentStrategy.value.type === 'supplier' ? '供应商管理' : '物流管理'
  planForm.priority = 'high'
  planForm.expectedEffect = currentStrategy.value.impact
    .map(i => `${i.indicator}改善${Math.abs(i.changeRate).toFixed(1)}%`)
    .join('，')
  planForm.executor = ''
  
  planDialogVisible.value = true
}

const openPlanDialog = () => {
  planForm.name = ''
  planForm.category = ''
  planForm.priority = 'medium'
  planForm.expectedEffect = ''
  planForm.executor = ''
  planDialogVisible.value = true
}

const savePlan = () => {
  planFormRef.value?.validate((valid) => {
    if (valid) {
      const newPlan: OptimizationPlan = {
        id: 'PLAN' + String(optimizationPlans.value.length + 1).padStart(3, '0'),
        name: planForm.name,
        category: planForm.category,
        status: 'pending',
        priority: planForm.priority,
        createTime: new Date().toLocaleString('zh-CN'),
        progress: 0,
        expectedEffect: planForm.expectedEffect,
        executor: planForm.executor
      }
      
      optimizationPlans.value.unshift(newPlan)
      planDialogVisible.value = false
      ElMessage.success('优化方案创建成功')
    }
  })
}

const startPlan = (plan: OptimizationPlan) => {
  ElMessageBox.confirm('确认开始执行该优化方案吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    plan.status = 'executing'
    plan.startTime = new Date().toLocaleString('zh-CN')
    plan.progress = 10
    ElMessage.success('方案已开始执行')
    
    // 模拟进度更新
    const timer = setInterval(() => {
      if (plan.progress < 100) {
        plan.progress += Math.floor(Math.random() * 10) + 5
        if (plan.progress >= 100) {
          plan.progress = 100
          plan.status = 'completed'
          plan.endTime = new Date().toLocaleString('zh-CN')
          clearInterval(timer)
          ElMessage.success(`方案"${plan.name}"已执行完成`)
        }
      }
    }, 3000)
  }).catch(() => {})
}

const openEvaluation = (plan: OptimizationPlan) => {
  if (plan.status !== 'completed' && plan.status !== 'evaluated') {
    ElMessage.warning('只能对已完成的方案进行评估')
    return
  }
  
  evaluationForm.planId = plan.id
  evaluationForm.score = plan.evaluation?.score || 80
  evaluationForm.effectiveness = plan.evaluation?.effectiveness || 75
  evaluationForm.sustainability = plan.evaluation?.sustainability || 70
  evaluationForm.feedback = plan.evaluation?.feedback || ''
  evaluationForm.actualEffect = plan.actualEffect || ''
  
  evaluationDialogVisible.value = true
}

const saveEvaluation = () => {
  const plan = optimizationPlans.value.find(p => p.id === evaluationForm.planId)
  if (!plan) return
  
  plan.status = 'evaluated'
  plan.actualEffect = evaluationForm.actualEffect
  plan.evaluation = {
    score: evaluationForm.score,
    effectiveness: evaluationForm.effectiveness,
    sustainability: evaluationForm.sustainability,
    feedback: evaluationForm.feedback
  }
  
  evaluationDialogVisible.value = false
  ElMessage.success('评估结果已保存')
}

const deletePlan = (plan: OptimizationPlan) => {
  ElMessageBox.confirm('确认删除该优化方案吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = optimizationPlans.value.findIndex(p => p.id === plan.id)
    if (index > -1) {
      optimizationPlans.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  }).catch(() => {})
}

const openReportDialog = () => {
  reportForm.dateRange = []
  reportForm.indicators = []
  reportForm.includeDetails = true
  reportDialogVisible.value = true
}

const generateReport = () => {
  if (reportForm.dateRange.length === 0) {
    ElMessage.warning('请选择报告时间范围')
    return
  }
  
  loading.value = true
  setTimeout(() => {
    loading.value = false
    reportDialogVisible.value = false
    ElMessage.success('持续改进分析报告生成成功，正在下载...')
  }, 1000)
}

const getPriorityType = (priority: string) => {
  const map: Record<string, any> = {
    high: 'danger',
    medium: 'warning',
    low: 'primary'
  }
  return map[priority] || 'info'
}

const getPriorityLabel = (priority: string) => {
  const map: Record<string, string> = {
    high: '高优先级',
    medium: '中优先级',
    low: '低优先级'
  }
  return map[priority] || priority
}

const getStatusType = (status: string) => {
  const map: Record<string, any> = {
    pending: 'info',
    executing: 'primary',
    completed: 'success',
    evaluated: 'warning'
  }
  return map[status] || 'info'
}

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: '待执行',
    executing: '执行中',
    completed: '已完成',
    evaluated: '已评估'
  }
  return map[status] || status
}

const getCategoryLabel = (category: string) => {
  const map: Record<string, string> = {
    inventory: '库存管理',
    supplier: '供应商管理',
    logistics: '物流管理',
    cost: '成本管理'
  }
  return map[category] || category
}

const getRiskType = (level: string) => {
  const map: Record<string, any> = {
    low: 'success',
    medium: 'warning',
    high: 'danger'
  }
  return map[level] || 'info'
}

const getRiskLabel = (level: string) => {
  const map: Record<string, string> = {
    low: '低风险',
    medium: '中风险',
    high: '高风险'
  }
  return map[level] || level
}

const getMetricStatusType = (status: string) => {
  const map: Record<string, any> = {
    normal: 'success',
    warning: 'warning',
    danger: 'danger'
  }
  return map[status] || 'info'
}

const getTrendIcon = (trend: string) => {
  const map: Record<string, string> = {
    up: 'ArrowUp',
    down: 'ArrowDown',
    stable: 'Minus'
  }
  return map[trend] || 'Minus'
}

// 生命周期
onMounted(() => {
  loadDecisionSuggestions()
  loadOptimizationPlans()
  loadDecisionMetrics()
  loadImprovementTrends()
})
</script>

<template>
  <div class="decision-optimization-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>决策优化</h2>
      <p class="subtitle">基于绩效分析的科学决策支持与持续改进</p>
    </div>

    <!-- 标签页 -->
    <el-tabs v-model="activeTab" class="main-tabs">
      <!-- 概览看板 -->
      <el-tab-pane label="决策概览" name="overview">
        <div class="overview-layout">
          <!-- 关键决策指标 -->
          <div class="metrics-section">
            <h3 class="section-title">关键决策指标</h3>
            <el-row :gutter="16">
              <el-col :span="8" v-for="metric in decisionMetrics" :key="metric.id">
                <el-card shadow="hover" class="metric-card">
                  <div class="metric-content">
                    <div class="metric-header">
                      <span class="metric-name">{{ metric.name }}</span>
                      <el-tag :type="getMetricStatusType(metric.status)" size="small">
                        {{ metric.status === 'normal' ? '正常' : metric.status === 'warning' ? '预警' : '异常' }}
                      </el-tag>
                    </div>
                    <div class="metric-value">
                      <el-statistic :value="metric.value" :precision="1" :suffix="metric.unit" />
                      <div class="metric-trend">
                        <el-icon :class="['trend-icon', `trend-${metric.trend}`]">
                          <component :is="getTrendIcon(metric.trend)" />
                        </el-icon>
                        <span :class="['change-rate', metric.changeRate > 0 ? 'positive' : 'negative']">
                          {{ metric.changeRate > 0 ? '+' : '' }}{{ metric.changeRate.toFixed(1) }}%
                        </span>
                      </div>
                    </div>
                    <div class="metric-target">
                      目标: {{ metric.target }}{{ metric.unit }}
                    </div>
                    <el-progress
                      :percentage="Math.min((metric.value / metric.target) * 100, 100)"
                      :status="metric.status === 'normal' ? 'success' : metric.status === 'warning' ? 'warning' : 'exception'"
                      :show-text="false"
                    />
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>

          <!-- 方案执行统计 -->
          <div class="stats-section">
            <el-row :gutter="16">
              <el-col :span="6">
                <el-card shadow="hover">
                  <el-statistic title="待执行方案" :value="plansByStatus.pending">
                    <template #suffix>个</template>
                  </el-statistic>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover">
                  <el-statistic title="执行中方案" :value="plansByStatus.executing">
                    <template #suffix>个</template>
                  </el-statistic>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover">
                  <el-statistic title="已完成方案" :value="plansByStatus.completed">
                    <template #suffix>个</template>
                  </el-statistic>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover">
                  <el-statistic title="已评估方案" :value="plansByStatus.evaluated">
                    <template #suffix>个</template>
                  </el-statistic>
                </el-card>
              </el-col>
            </el-row>
          </div>

          <!-- 重点关注建议 -->
          <div class="favorite-section">
            <h3 class="section-title">
              <el-icon><StarFilled /></el-icon>
              重点关注建议
            </h3>
            <el-row :gutter="16">
              <el-col :span="12" v-for="suggestion in favoriteSuggestions" :key="suggestion.id">
                <el-card shadow="hover" class="favorite-card">
                  <div class="favorite-header">
                    <div class="favorite-title">
                      <el-tag :type="getPriorityType(suggestion.priority)" size="small">
                        {{ getPriorityLabel(suggestion.priority) }}
                      </el-tag>
                      <span class="title-text">{{ suggestion.title }}</span>
                    </div>
                    <el-tag size="small">{{ getCategoryLabel(suggestion.category) }}</el-tag>
                  </div>
                  <p class="favorite-desc">{{ suggestion.description }}</p>
                  <div class="favorite-stats">
                    <div class="stat-item">
                      <span class="label">预期成本:</span>
                      <span class="value">{{ suggestion.cost }}万元</span>
                    </div>
                    <div class="stat-item">
                      <span class="label">执行周期:</span>
                      <span class="value">{{ suggestion.duration }}天</span>
                    </div>
                    <div class="stat-item">
                      <span class="label">风险评级:</span>
                      <el-tag :type="getRiskType(suggestion.riskLevel)" size="small">
                        {{ getRiskLabel(suggestion.riskLevel) }}
                      </el-tag>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
            <el-empty v-if="favoriteSuggestions.length === 0" description="暂无重点关注的建议" />
          </div>
        </div>
      </el-tab-pane>

      <!-- 决策建议 -->
      <el-tab-pane label="决策建议" name="suggestions">
        <div class="suggestions-layout">
          <!-- 左侧：建议列表 -->
          <div class="suggestions-left">
            <el-card shadow="never" class="filter-card">
              <div class="filter-header">
                <h3>决策建议列表</h3>
                <el-button type="primary" size="small" @click="loadDecisionSuggestions">
                  <el-icon><Refresh /></el-icon>
                  刷新
                </el-button>
              </div>
              <div class="filter-controls">
                <el-select v-model="suggestionFilter.priority" placeholder="优先级" clearable size="small">
                  <el-option label="高优先级" value="high" />
                  <el-option label="中优先级" value="medium" />
                  <el-option label="低优先级" value="low" />
                </el-select>
                <el-select v-model="suggestionFilter.category" placeholder="类别" clearable size="small">
                  <el-option label="库存管理" value="inventory" />
                  <el-option label="供应商管理" value="supplier" />
                  <el-option label="物流管理" value="logistics" />
                  <el-option label="成本管理" value="cost" />
                </el-select>
              </div>
            </el-card>

            <div class="suggestion-list" v-loading="loading">
              <div
                v-for="suggestion in filteredSuggestions"
                :key="suggestion.id"
                :class="['suggestion-item', { active: selectedSuggestion?.id === suggestion.id }]"
                @click="selectSuggestion(suggestion)"
              >
                <div class="suggestion-item-header">
                  <div class="title-row">
                    <el-tag :type="getPriorityType(suggestion.priority)" size="small">
                      {{ getPriorityLabel(suggestion.priority) }}
                    </el-tag>
                    <span class="title">{{ suggestion.title }}</span>
                    <el-icon
                      :class="['favorite-icon', { active: suggestion.isFavorite }]"
                      @click.stop="toggleFavorite(suggestion)"
                    >
                      <StarFilled v-if="suggestion.isFavorite" />
                      <Star v-else />
                    </el-icon>
                  </div>
                  <el-tag size="small" type="info">{{ getCategoryLabel(suggestion.category) }}</el-tag>
                </div>
                <p class="suggestion-desc">{{ suggestion.description }}</p>
                <div class="suggestion-meta">
                  <span>成本: {{ suggestion.cost }}万</span>
                  <span>周期: {{ suggestion.duration }}天</span>
                  <el-tag :type="getRiskType(suggestion.riskLevel)" size="small">
                    {{ getRiskLabel(suggestion.riskLevel) }}
                  </el-tag>
                </div>
              </div>
              <el-empty v-if="filteredSuggestions.length === 0" description="暂无建议数据" />
            </div>
          </div>

          <!-- 右侧：建议详情 -->
          <div class="suggestions-right">
            <el-card v-if="selectedSuggestion" shadow="never" class="detail-card">
              <template #header>
                <div class="detail-header">
                  <div>
                    <h3>{{ selectedSuggestion.title }}</h3>
                    <div class="detail-tags">
                      <el-tag :type="getPriorityType(selectedSuggestion.priority)">
                        {{ getPriorityLabel(selectedSuggestion.priority) }}
                      </el-tag>
                      <el-tag type="info">{{ getCategoryLabel(selectedSuggestion.category) }}</el-tag>
                      <el-tag :type="getRiskType(selectedSuggestion.riskLevel)">
                        {{ getRiskLabel(selectedSuggestion.riskLevel) }}
                      </el-tag>
                    </div>
                  </div>
                  <div class="action-buttons">
                    <el-button type="primary" @click="openSimulation(selectedSuggestion.id)">
                      <el-icon><DataAnalysis /></el-icon>
                      策略模拟
                    </el-button>
                    <el-button @click="toggleFavorite(selectedSuggestion)">
                      <el-icon><StarFilled v-if="selectedSuggestion.isFavorite" /><Star v-else /></el-icon>
                      {{ selectedSuggestion.isFavorite ? '取消关注' : '重点关注' }}
                    </el-button>
                  </div>
                </div>
              </template>

              <div class="detail-content">
                <div class="detail-section">
                  <h4>建议描述</h4>
                  <p>{{ selectedSuggestion.description }}</p>
                </div>

                <div class="detail-section">
                  <h4>预期效果</h4>
                  <el-table :data="selectedSuggestion.expectedEffect" border>
                    <el-table-column prop="indicator" label="指标" width="150" />
                    <el-table-column prop="current" label="当前值" width="120" />
                    <el-table-column prop="predicted" label="预测值" width="120" />
                    <el-table-column label="改善幅度" width="150">
                      <template #default="{ row }">
                        <span :class="['improvement-value', row.improvement > 0 ? 'positive' : 'negative']">
                          {{ row.improvement > 0 ? '+' : '' }}{{ row.improvement.toFixed(1) }}%
                        </span>
                      </template>
                    </el-table-column>
                    <el-table-column label="效果预览">
                      <template #default="{ row }">
                        <el-progress
                          :percentage="row.improvement"
                          :status="row.improvement > 10 ? 'success' : 'warning'"
                        />
                      </template>
                    </el-table-column>
                  </el-table>
                </div>

                <div class="detail-section">
                  <h4>风险评估</h4>
                  <el-alert
                    :type="getRiskType(selectedSuggestion.riskLevel)"
                    :title="getRiskLabel(selectedSuggestion.riskLevel)"
                    :description="selectedSuggestion.riskDesc"
                    show-icon
                    :closable="false"
                  />
                </div>

                <div class="detail-section">
                  <h4>实施概要</h4>
                  <el-descriptions :column="2" border>
                    <el-descriptions-item label="预计成本">
                      {{ selectedSuggestion.cost }}万元
                    </el-descriptions-item>
                    <el-descriptions-item label="执行周期">
                      {{ selectedSuggestion.duration }}天
                    </el-descriptions-item>
                    <el-descriptions-item label="生成时间" :span="2">
                      {{ selectedSuggestion.createTime }}
                    </el-descriptions-item>
                  </el-descriptions>
                </div>
              </div>
            </el-card>
            <el-empty v-else description="请选择一个建议查看详情" />
          </div>
        </div>
      </el-tab-pane>

      <!-- 策略模拟 -->
      <el-tab-pane label="策略模拟" name="simulation">
        <div class="simulation-container">
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <h3>策略模拟推演</h3>
                <el-button type="primary" @click="openSimulation()">
                  <el-icon><Plus /></el-icon>
                  新建模拟
                </el-button>
              </div>
            </template>

            <div v-if="currentStrategy" class="simulation-result">
              <div class="strategy-info">
                <h4>{{ currentStrategy.name }}</h4>
                <el-tag>{{ getCategoryLabel(currentStrategy.type) }}</el-tag>
              </div>

              <el-row :gutter="20">
                <!-- 左侧：参数设置 -->
                <el-col :span="12">
                  <div class="parameter-section">
                    <h4>策略参数</h4>
                    <el-table :data="currentStrategy.parameters" border>
                      <el-table-column prop="label" label="参数名称" width="150" />
                      <el-table-column label="当前值" width="120">
                        <template #default="{ row }">
                          {{ row.current.toFixed(0) }}{{ row.unit }}
                        </template>
                      </el-table-column>
                      <el-table-column label="模拟值" width="120">
                        <template #default="{ row }">
                          <span class="simulated-value">
                            {{ row.simulated.toFixed(0) }}{{ row.unit }}
                          </span>
                        </template>
                      </el-table-column>
                      <el-table-column label="变化">
                        <template #default="{ row }">
                          <span :class="['change-value', row.simulated > row.current ? 'up' : 'down']">
                            {{ ((row.simulated - row.current) / row.current * 100).toFixed(1) }}%
                          </span>
                        </template>
                      </el-table-column>
                    </el-table>
                  </div>
                </el-col>

                <!-- 右侧：影响分析 -->
                <el-col :span="12">
                  <div class="impact-section">
                    <h4>绩效影响分析</h4>
                    <el-table :data="currentStrategy.impact" border>
                      <el-table-column prop="indicator" label="影响指标" width="120" />
                      <el-table-column label="基准值" width="100">
                        <template #default="{ row }">
                          {{ row.baseline.toFixed(1) }}
                        </template>
                      </el-table-column>
                      <el-table-column label="模拟值" width="100">
                        <template #default="{ row }">
                          {{ row.simulated.toFixed(1) }}
                        </template>
                      </el-table-column>
                      <el-table-column label="改善幅度">
                        <template #default="{ row }">
                          <div class="impact-change">
                            <span :class="['value', row.changeRate > 0 ? 'positive' : 'negative']">
                              {{ row.changeRate > 0 ? '+' : '' }}{{ row.changeRate.toFixed(1) }}%
                            </span>
                            <el-progress
                              :percentage="Math.abs(row.changeRate)"
                              :status="Math.abs(row.changeRate) > 10 ? 'success' : 'warning'"
                              :show-text="false"
                            />
                          </div>
                        </template>
                      </el-table-column>
                    </el-table>
                  </div>
                </el-col>
              </el-row>

              <div class="simulation-actions">
                <el-button type="primary" @click="applyStrategy">
                  <el-icon><Check /></el-icon>
                  应用策略
                </el-button>
                <el-button @click="saveAsTemplate">
                  <el-icon><DocumentCopy /></el-icon>
                  保存为模板
                </el-button>
                <el-button @click="currentStrategy = null">
                  <el-icon><Close /></el-icon>
                  清除结果
                </el-button>
              </div>
            </div>

            <el-empty v-else description="点击「新建模拟」开始策略推演" />
          </el-card>
        </div>
      </el-tab-pane>

      <!-- 方案管理 -->
      <el-tab-pane label="方案管理" name="plans">
        <div class="plans-container">
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <h3>优化方案管理</h3>
                <el-button type="primary" @click="openPlanDialog">
                  <el-icon><Plus /></el-icon>
                  创建方案
                </el-button>
              </div>
            </template>

            <el-table :data="optimizationPlans" border v-loading="loading">
              <el-table-column prop="id" label="方案ID" width="100" />
              <el-table-column prop="name" label="方案名称" width="180" />
              <el-table-column prop="category" label="类别" width="120">
                <template #default="{ row }">
                  <el-tag size="small">{{ row.category }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="priority" label="优先级" width="100">
                <template #default="{ row }">
                  <el-tag :type="getPriorityType(row.priority)" size="small">
                    {{ getPriorityLabel(row.priority) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="getStatusType(row.status)" size="small">
                    {{ getStatusLabel(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="执行进度" width="150">
                <template #default="{ row }">
                  <el-progress
                    :percentage="row.progress"
                    :status="row.progress === 100 ? 'success' : undefined"
                  />
                </template>
              </el-table-column>
              <el-table-column prop="executor" label="执行人" width="100" />
              <el-table-column prop="expectedEffect" label="预期效果" min-width="200" show-overflow-tooltip />
              <el-table-column label="评估得分" width="100">
                <template #default="{ row }">
                  <span v-if="row.evaluation">{{ row.evaluation.score }}分</span>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="200" fixed="right">
                <template #default="{ row }">
                  <el-button
                    v-if="row.status === 'pending'"
                    type="primary"
                    size="small"
                    @click="startPlan(row)"
                  >
                    开始执行
                  </el-button>
                  <el-button
                    v-if="row.status === 'completed' || row.status === 'evaluated'"
                    type="success"
                    size="small"
                    @click="openEvaluation(row)"
                  >
                    {{ row.status === 'evaluated' ? '查看评估' : '评估' }}
                  </el-button>
                  <el-button
                    type="danger"
                    size="small"
                    @click="deletePlan(row)"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- 持续改进 -->
      <el-tab-pane label="持续改进" name="improvement">
        <div class="improvement-container">
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <h3>持续改进跟踪</h3>
                <el-button type="primary" @click="openReportDialog">
                  <el-icon><Document /></el-icon>
                  生成报告
                </el-button>
              </div>
            </template>

            <div class="improvement-content">
              <!-- 指标选择 -->
              <div class="indicator-selector">
                <el-radio-group v-model="selectedTrendIndicator" size="large">
                  <el-radio-button
                    v-for="trend in improvementTrends"
                    :key="trend.indicator"
                    :label="trend.indicator"
                  />
                </el-radio-group>
              </div>

              <!-- 趋势图表 -->
              <div class="trend-chart" v-if="selectedTrendIndicator">
                <h4>{{ selectedTrendIndicator }}改进趋势</h4>
                <div class="chart-placeholder">
                  <el-table
                    :data="improvementTrends.find(t => t.indicator === selectedTrendIndicator)?.data"
                    border
                  >
                    <el-table-column prop="date" label="时间" width="120" />
                    <el-table-column prop="value" label="实际值" width="120">
                      <template #default="{ row }">
                        {{ row.value.toFixed(1) }}
                      </template>
                    </el-table-column>
                    <el-table-column prop="target" label="目标值" width="120">
                      <template #default="{ row }">
                        {{ row.target.toFixed(1) }}
                      </template>
                    </el-table-column>
                    <el-table-column label="达成率">
                      <template #default="{ row }">
                        <el-progress
                          :percentage="Math.min((row.value / row.target) * 100, 100)"
                          :status="row.value >= row.target ? 'success' : 'warning'"
                        />
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </div>

              <!-- 改进措施 -->
              <div class="measures-section" v-if="selectedTrendIndicator">
                <h4>改进措施及效果</h4>
                <el-timeline>
                  <el-timeline-item
                    v-for="(measure, index) in improvementTrends.find(t => t.indicator === selectedTrendIndicator)?.measures"
                    :key="index"
                    :timestamp="measure.startDate"
                    placement="top"
                  >
                    <el-card>
                      <div class="measure-item">
                        <h5>{{ measure.name }}</h5>
                        <div class="measure-effect">
                          <span>效果提升:</span>
                          <el-tag type="success">{{ measure.effect }}%</el-tag>
                        </div>
                      </div>
                    </el-card>
                  </el-timeline-item>
                </el-timeline>
              </div>

              <!-- 效果评估 -->
              <div class="effectiveness-section" v-if="selectedTrendIndicator">
                <h4>改进效果评估</h4>
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-card>
                      <el-statistic
                        title="有效性评分"
                        :value="improvementTrends.find(t => t.indicator === selectedTrendIndicator)?.effectiveness"
                        suffix="分"
                      >
                        <template #suffix>
                          <span>/100分</span>
                        </template>
                      </el-statistic>
                      <el-progress
                        :percentage="improvementTrends.find(t => t.indicator === selectedTrendIndicator)?.effectiveness || 0"
                        :status="(improvementTrends.find(t => t.indicator === selectedTrendIndicator)?.effectiveness || 0) > 80 ? 'success' : 'warning'"
                      />
                    </el-card>
                  </el-col>
                  <el-col :span="12">
                    <el-card>
                      <el-statistic
                        title="持续性评分"
                        :value="improvementTrends.find(t => t.indicator === selectedTrendIndicator)?.sustainability"
                        suffix="分"
                      >
                        <template #suffix>
                          <span>/100分</span>
                        </template>
                      </el-statistic>
                      <el-progress
                        :percentage="improvementTrends.find(t => t.indicator === selectedTrendIndicator)?.sustainability || 0"
                        :status="(improvementTrends.find(t => t.indicator === selectedTrendIndicator)?.sustainability || 0) > 80 ? 'success' : 'warning'"
                      />
                    </el-card>
                  </el-col>
                </el-row>
              </div>
            </div>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 策略模拟对话框 -->
    <el-dialog
      v-model="simulationDialogVisible"
      title="策略模拟推演"
      width="800px"
      @close="simulationForm.parameters = []"
    >
      <el-form :model="simulationForm" label-width="120px">
        <el-form-item label="模拟名称">
          <el-input v-model="simulationForm.name" placeholder="请输入模拟名称" />
        </el-form-item>
        <el-form-item label="策略类型">
          <el-radio-group v-model="simulationForm.type" @change="updateSimulationParameters">
            <el-radio-button label="inventory">库存策略</el-radio-button>
            <el-radio-button label="supplier">供应商策略</el-radio-button>
            <el-radio-button label="logistics">物流策略</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="参数调整">
          <div class="parameter-inputs">
            <div v-for="param in simulationForm.parameters" :key="param.key" class="param-item">
              <span class="param-label">{{ param.label }}:</span>
              <el-input-number
                v-model="param.value"
                :min="0"
                :step="param.unit === '%' ? 1 : 10"
                size="small"
              />
              <span class="param-unit">{{ param.unit }}</span>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="simulationDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="startSimulation(); simulationDialogVisible = false" :loading="loading">
          <el-icon><DataAnalysis /></el-icon>
          开始模拟
        </el-button>
      </template>
    </el-dialog>

    <!-- 创建方案对话框 -->
    <el-dialog v-model="planDialogVisible" title="创建优化方案" width="600px">
      <el-form :model="planForm" ref="planFormRef" label-width="100px">
        <el-form-item label="方案名称" prop="name" :rules="[{ required: true, message: '请输入方案名称' }]">
          <el-input v-model="planForm.name" placeholder="请输入方案名称" />
        </el-form-item>
        <el-form-item label="方案类别" prop="category" :rules="[{ required: true, message: '请选择方案类别' }]">
          <el-select v-model="planForm.category" placeholder="请选择">
            <el-option label="库存管理" value="库存管理" />
            <el-option label="供应商管理" value="供应商管理" />
            <el-option label="物流管理" value="物流管理" />
            <el-option label="成本管理" value="成本管理" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-radio-group v-model="planForm.priority">
            <el-radio label="high">高优先级</el-radio>
            <el-radio label="medium">中优先级</el-radio>
            <el-radio label="low">低优先级</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="预期效果" prop="expectedEffect" :rules="[{ required: true, message: '请输入预期效果' }]">
          <el-input
            v-model="planForm.expectedEffect"
            type="textarea"
            :rows="3"
            placeholder="请描述预期效果"
          />
        </el-form-item>
        <el-form-item label="执行人" prop="executor" :rules="[{ required: true, message: '请输入执行人' }]">
          <el-input v-model="planForm.executor" placeholder="请输入执行人" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="planDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePlan">保存</el-button>
      </template>
    </el-dialog>

    <!-- 评估对话框 -->
    <el-dialog v-model="evaluationDialogVisible" title="方案效果评估" width="700px">
      <el-form :model="evaluationForm" label-width="120px">
        <el-form-item label="实际效果">
          <el-input
            v-model="evaluationForm.actualEffect"
            type="textarea"
            :rows="3"
            placeholder="请描述实际达成效果"
          />
        </el-form-item>
        <el-form-item label="综合得分">
          <el-slider v-model="evaluationForm.score" :min="0" :max="100" show-input />
        </el-form-item>
        <el-form-item label="有效性评分">
          <el-slider v-model="evaluationForm.effectiveness" :min="0" :max="100" show-input />
        </el-form-item>
        <el-form-item label="持续性评分">
          <el-slider v-model="evaluationForm.sustainability" :min="0" :max="100" show-input />
        </el-form-item>
        <el-form-item label="评估反馈">
          <el-input
            v-model="evaluationForm.feedback"
            type="textarea"
            :rows="4"
            placeholder="请输入详细的评估反馈"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="evaluationDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEvaluation">保存评估</el-button>
      </template>
    </el-dialog>

    <!-- 生成报告对话框 -->
    <el-dialog v-model="reportDialogVisible" title="生成持续改进分析报告" width="600px">
      <el-form :model="reportForm" label-width="120px">
        <el-form-item label="报告时间范围">
          <el-date-picker
            v-model="reportForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="包含指标">
          <el-checkbox-group v-model="reportForm.indicators">
            <el-checkbox
              v-for="trend in improvementTrends"
              :key="trend.indicator"
              :label="trend.indicator"
            />
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="报告详情">
          <el-checkbox v-model="reportForm.includeDetails">包含详细数据和图表</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reportDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="generateReport" :loading="loading">
          <el-icon><Download /></el-icon>
          生成并下载
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.decision-optimization-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 100px);

  .page-header {
    margin-bottom: 20px;

    h2 {
      font-size: 24px;
      font-weight: 600;
      color: #303133;
      margin: 0 0 8px 0;
    }

    .subtitle {
      color: #909399;
      font-size: 14px;
      margin: 0;
    }
  }

  .main-tabs {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  }

  // 概览看板
  .overview-layout {
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .metrics-section {
      margin-bottom: 24px;

      .metric-card {
        height: 100%;
        transition: all 0.3s;

        &:hover {
          transform: translateY(-2px);
        }

        .metric-content {
          .metric-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;

            .metric-name {
              font-size: 14px;
              color: #606266;
            }
          }

          .metric-value {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;

            .metric-trend {
              display: flex;
              align-items: center;
              gap: 4px;

              .trend-icon {
                font-size: 16px;

                &.trend-up {
                  color: #67c23a;
                }

                &.trend-down {
                  color: #f56c6c;
                }

                &.trend-stable {
                  color: #909399;
                }
              }

              .change-rate {
                font-size: 14px;
                font-weight: 600;

                &.positive {
                  color: #67c23a;
                }

                &.negative {
                  color: #f56c6c;
                }
              }
            }
          }

          .metric-target {
            font-size: 12px;
            color: #909399;
            margin-bottom: 8px;
          }
        }
      }
    }

    .stats-section {
      margin-bottom: 24px;
    }

    .favorite-section {
      .favorite-card {
        margin-bottom: 16px;

        .favorite-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          .favorite-title {
            display: flex;
            align-items: center;
            gap: 8px;

            .title-text {
              font-size: 15px;
              font-weight: 600;
              color: #303133;
            }
          }
        }

        .favorite-desc {
          font-size: 14px;
          color: #606266;
          line-height: 1.6;
          margin-bottom: 12px;
        }

        .favorite-stats {
          display: flex;
          gap: 24px;

          .stat-item {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 13px;

            .label {
              color: #909399;
            }

            .value {
              color: #303133;
              font-weight: 600;
            }
          }
        }
      }
    }
  }

  // 决策建议布局
  .suggestions-layout {
    display: grid;
    grid-template-columns: 400px 1fr;
    gap: 20px;
    height: calc(100vh - 280px);

    .suggestions-left {
      display: flex;
      flex-direction: column;
      gap: 16px;

      .filter-card {
        .filter-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;

          h3 {
            font-size: 16px;
            margin: 0;
          }
        }

        .filter-controls {
          display: flex;
          gap: 12px;

          .el-select {
            flex: 1;
          }
        }
      }

      .suggestion-list {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;

        .suggestion-item {
          background: white;
          border: 1px solid #dcdfe6;
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.3s;

          &:hover {
            border-color: #409eff;
            box-shadow: 0 2px 12px rgba(64, 158, 255, 0.1);
          }

          &.active {
            border-color: #409eff;
            background: #ecf5ff;
          }

          .suggestion-item-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;

            .title-row {
              display: flex;
              align-items: center;
              gap: 8px;
              flex: 1;

              .title {
                font-size: 14px;
                font-weight: 600;
                color: #303133;
                flex: 1;
              }

              .favorite-icon {
                font-size: 18px;
                color: #c0c4cc;
                cursor: pointer;
                transition: all 0.3s;

                &:hover {
                  color: #f56c6c;
                  transform: scale(1.2);
                }

                &.active {
                  color: #f56c6c;
                }
              }
            }
          }

          .suggestion-desc {
            font-size: 13px;
            color: #606266;
            line-height: 1.6;
            margin-bottom: 12px;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            line-clamp: 2;
            -webkit-box-orient: vertical;
          }

          .suggestion-meta {
            display: flex;
            align-items: center;
            gap: 16px;
            font-size: 12px;
            color: #909399;
          }
        }
      }
    }

    .suggestions-right {
      overflow-y: auto;

      .detail-card {
        height: 100%;

        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;

          h3 {
            font-size: 18px;
            margin: 0 0 12px 0;
          }

          .detail-tags {
            display: flex;
            gap: 8px;
            margin-bottom: 12px;
          }

          .action-buttons {
            display: flex;
            gap: 8px;
          }
        }

        .detail-content {
          .detail-section {
            margin-bottom: 24px;

            h4 {
              font-size: 15px;
              font-weight: 600;
              color: #303133;
              margin: 0 0 12px 0;
            }

            p {
              font-size: 14px;
              color: #606266;
              line-height: 1.8;
            }

            .improvement-value {
              font-weight: 600;

              &.positive {
                color: #67c23a;
              }

              &.negative {
                color: #f56c6c;
              }
            }
          }
        }
      }
    }
  }

  // 策略模拟
  .simulation-container {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h3 {
        font-size: 16px;
        margin: 0;
      }
    }

    .simulation-result {
      .strategy-info {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 24px;

        h4 {
          font-size: 16px;
          margin: 0;
        }
      }

      .parameter-section,
      .impact-section {
        h4 {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .simulated-value {
          color: #409eff;
          font-weight: 600;
        }

        .change-value {
          font-weight: 600;

          &.up {
            color: #67c23a;
          }

          &.down {
            color: #f56c6c;
          }
        }

        .impact-change {
          .value {
            font-weight: 600;
            margin-bottom: 4px;

            &.positive {
              color: #67c23a;
            }

            &.negative {
              color: #f56c6c;
            }
          }
        }
      }

      .simulation-actions {
        margin-top: 24px;
        display: flex;
        justify-content: center;
        gap: 12px;
      }
    }
  }

  // 方案管理
  .plans-container {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h3 {
        font-size: 16px;
        margin: 0;
      }
    }
  }

  // 持续改进
  .improvement-container {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h3 {
        font-size: 16px;
        margin: 0;
      }
    }

    .improvement-content {
      .indicator-selector {
        margin-bottom: 24px;
      }

      .trend-chart {
        margin-bottom: 24px;

        h4 {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .chart-placeholder {
          min-height: 300px;
        }
      }

      .measures-section {
        margin-bottom: 24px;

        h4 {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .measure-item {
          h5 {
            font-size: 14px;
            margin: 0 0 8px 0;
          }

          .measure-effect {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            color: #606266;
          }
        }
      }

      .effectiveness-section {
        h4 {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 16px;
        }
      }
    }
  }

  // 对话框样式
  .parameter-inputs {
    width: 100%;

    .param-item {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;

      .param-label {
        width: 150px;
        font-size: 14px;
        color: #606266;
      }

      .el-input-number {
        flex: 1;
      }

      .param-unit {
        font-size: 14px;
        color: #909399;
      }
    }
  }
}
</style>
