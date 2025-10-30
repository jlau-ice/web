<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'

// 类型定义
interface AlertRule {
  id: string
  name: string
  indicator: string
  thresholdType: 'fixed' | 'dynamic' | 'trend'
  threshold: number
  level: 'urgent' | 'important' | 'normal' | 'info'
  notifyMethod: string[]
  enabled: boolean
  createTime: string
}

interface ActiveAlert {
  id: string
  ruleName: string
  indicator: string
  level: 'urgent' | 'important' | 'normal' | 'info'
  currentValue: number
  threshold: number
  deviation: number
  status: 'pending' | 'processing' | 'resolved' | 'closed'
  triggerTime: string
  handler?: string
  affectedArea: string[]
}

interface RootCauseAnalysis {
  alertId: string
  problemDesc: string
  relatedData: {
    key: string
    value: string | number
    status: 'normal' | 'abnormal'
  }[]
  impactScope: {
    area: string
    severity: number
    affectedCount: number
  }[]
  tracebackPath: {
    step: number
    node: string
    status: 'normal' | 'abnormal'
    time: string
  }[]
}

interface DisposalRecord {
  id: string
  alertId: string
  handler: string
  startTime: string
  endTime?: string
  status: 'pending' | 'processing' | 'resolved' | 'closed'
  actions: {
    time: string
    action: string
    result: string
  }[]
  feedback?: string
  verification?: boolean
}

interface TrendPrediction {
  indicator: string
  currentValue: number
  predictedValue: number
  trend: 'up' | 'down' | 'stable'
  alertProbability: number
  confidence: number
  accuracy: number
  historicalData: {
    date: string
    value: number
  }[]
  predictions: {
    date: string
    value: number
    upper: number
    lower: number
  }[]
}

// 响应式数据
const loading = ref(false)
const activeTab = ref('monitor')

// 预警规则
const alertRules = ref<AlertRule[]>([])
const ruleDialogVisible = ref(false)
const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive<Partial<AlertRule>>({
  name: '',
  indicator: '',
  thresholdType: 'fixed',
  threshold: 0,
  level: 'normal',
  notifyMethod: [],
  enabled: true
})

// 实时预警
const activeAlerts = ref<ActiveAlert[]>([])
const selectedAlert = ref<ActiveAlert | null>(null)
const searchKeyword = ref('')
const filterLevel = ref<string>('all')

// 根因分析
const rootCauseData = ref<RootCauseAnalysis | null>(null)
const analysisLoading = ref(false)

// 处置跟踪
const disposalRecords = ref<DisposalRecord[]>([])
const disposalDialogVisible = ref(false)
const disposalForm = reactive({
  action: '',
  result: ''
})

// 趋势预测
const trendPredictions = ref<TrendPrediction[]>([])
const selectedPrediction = ref<TrendPrediction | null>(null)

// 统计数据
const alertStats = computed(() => {
  return {
    total: activeAlerts.value.length,
    urgent: activeAlerts.value.filter(a => a.level === 'urgent').length,
    important: activeAlerts.value.filter(a => a.level === 'important').length,
    normal: activeAlerts.value.filter(a => a.level === 'normal').length,
    info: activeAlerts.value.filter(a => a.level === 'info').length,
    pending: activeAlerts.value.filter(a => a.status === 'pending').length,
    processing: activeAlerts.value.filter(a => a.status === 'processing').length,
    resolved: activeAlerts.value.filter(a => a.status === 'resolved').length
  }
})

// 筛选后的预警列表
const filteredAlerts = computed(() => {
  let result = activeAlerts.value

  if (searchKeyword.value) {
    result = result.filter(alert =>
      alert.ruleName.includes(searchKeyword.value) ||
      alert.indicator.includes(searchKeyword.value)
    )
  }

  if (filterLevel.value !== 'all') {
    result = result.filter(alert => alert.level === filterLevel.value)
  }

  return result.sort((a, b) => {
    const levelOrder = { urgent: 0, important: 1, normal: 2, info: 3 }
    return levelOrder[a.level] - levelOrder[b.level]
  })
})

// 预警级别配置
const levelConfig = {
  urgent: { label: '紧急', color: '#F56C6C', type: 'danger' as const },
  important: { label: '重要', color: '#E6A23C', type: 'warning' as const },
  normal: { label: '一般', color: '#E6A23C', type: 'warning' as const },
  info: { label: '提示', color: '#409EFF', type: 'info' as const }
}

// 状态配置
const statusConfig = {
  pending: { label: '待处理', color: '#F56C6C', type: 'danger' as const },
  processing: { label: '处理中', color: '#409EFF', type: 'primary' as const },
  resolved: { label: '已解决', color: '#67C23A', type: 'success' as const },
  closed: { label: '已关闭', color: '#909399', type: 'info' as const }
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    await Promise.all([
      loadAlertRules(),
      loadActiveAlerts(),
      loadTrendPredictions()
    ])
  } finally {
    loading.value = false
  }
}

// 加载预警规则
const loadAlertRules = async () => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      alertRules.value = [
        {
          id: '1',
          name: '订单履约率预警',
          indicator: '订单履约率',
          thresholdType: 'fixed',
          threshold: 95,
          level: 'urgent',
          notifyMethod: ['邮件', '短信', '系统通知'],
          enabled: true,
          createTime: '2025-10-25 10:00:00'
        },
        {
          id: '2',
          name: '库存周转率异常',
          indicator: '库存周转率',
          thresholdType: 'dynamic',
          threshold: 8,
          level: 'important',
          notifyMethod: ['邮件', '系统通知'],
          enabled: true,
          createTime: '2025-10-25 11:00:00'
        },
        {
          id: '3',
          name: '运输准时率下降',
          indicator: '运输准时率',
          thresholdType: 'trend',
          threshold: 90,
          level: 'important',
          notifyMethod: ['系统通知'],
          enabled: true,
          createTime: '2025-10-25 12:00:00'
        },
        {
          id: '4',
          name: '供应商交付及时率',
          indicator: '供应商交付及时率',
          thresholdType: 'fixed',
          threshold: 85,
          level: 'normal',
          notifyMethod: ['邮件'],
          enabled: false,
          createTime: '2025-10-25 13:00:00'
        },
        {
          id: '5',
          name: '成本波动提示',
          indicator: '运输成本波动率',
          thresholdType: 'trend',
          threshold: 15,
          level: 'info',
          notifyMethod: ['系统通知'],
          enabled: true,
          createTime: '2025-10-25 14:00:00'
        }
      ]
      resolve()
    }, 500)
  })
}

// 加载活跃预警
const loadActiveAlerts = async () => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      activeAlerts.value = [
        {
          id: 'A001',
          ruleName: '订单履约率预警',
          indicator: '订单履约率',
          level: 'urgent',
          currentValue: 92.5,
          threshold: 95,
          deviation: -2.5,
          status: 'pending',
          triggerTime: '2025-10-30 09:30:15',
          affectedArea: ['华东区', '华南区', '西南区']
        },
        {
          id: 'A002',
          ruleName: '库存周转率异常',
          indicator: '库存周转率',
          level: 'important',
          currentValue: 6.8,
          threshold: 8,
          deviation: -1.2,
          status: 'processing',
          handler: '张三',
          triggerTime: '2025-10-30 08:15:22',
          affectedArea: ['中心仓库', '区域仓库A']
        },
        {
          id: 'A003',
          ruleName: '运输准时率下降',
          indicator: '运输准时率',
          level: 'important',
          currentValue: 87.2,
          threshold: 90,
          deviation: -2.8,
          status: 'processing',
          handler: '李四',
          triggerTime: '2025-10-30 07:45:10',
          affectedArea: ['物流线路A', '物流线路C']
        },
        {
          id: 'A004',
          ruleName: '供应商交付及时率',
          indicator: '供应商交付及时率',
          level: 'normal',
          currentValue: 82.5,
          threshold: 85,
          deviation: -2.5,
          status: 'resolved',
          handler: '王五',
          triggerTime: '2025-10-29 16:20:35',
          affectedArea: ['供应商A', '供应商C']
        },
        {
          id: 'A005',
          ruleName: '成本波动提示',
          indicator: '运输成本波动率',
          level: 'info',
          currentValue: 16.8,
          threshold: 15,
          deviation: 1.8,
          status: 'resolved',
          handler: '赵六',
          triggerTime: '2025-10-29 14:10:20',
          affectedArea: ['运输部门']
        },
        {
          id: 'A006',
          ruleName: '订单履约率预警',
          indicator: '订单履约率',
          level: 'urgent',
          currentValue: 91.8,
          threshold: 95,
          deviation: -3.2,
          status: 'pending',
          triggerTime: '2025-10-30 10:05:45',
          affectedArea: ['华北区']
        }
      ]
      resolve()
    }, 600)
  })
}

// 加载趋势预测
const loadTrendPredictions = async () => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      const baseDate = new Date('2025-10-23')
      const predictions: TrendPrediction[] = [
        {
          indicator: '订单履约率',
          currentValue: 92.5,
          predictedValue: 91.2,
          trend: 'down',
          alertProbability: 85,
          confidence: 88,
          accuracy: 92.5,
          historicalData: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(baseDate.getTime() + i * 86400000).toISOString().split('T')[0],
            value: 95 - Math.random() * 3
          })),
          predictions: Array.from({ length: 3 }, (_, i) => ({
            date: new Date(baseDate.getTime() + (i + 7) * 86400000).toISOString().split('T')[0],
            value: 92 - i * 0.8,
            upper: 93 - i * 0.8,
            lower: 91 - i * 0.8
          }))
        },
        {
          indicator: '库存周转率',
          currentValue: 6.8,
          predictedValue: 6.2,
          trend: 'down',
          alertProbability: 72,
          confidence: 85,
          accuracy: 89.3,
          historicalData: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(baseDate.getTime() + i * 86400000).toISOString().split('T')[0],
            value: 8 - i * 0.2 - Math.random() * 0.3
          })),
          predictions: Array.from({ length: 3 }, (_, i) => ({
            date: new Date(baseDate.getTime() + (i + 7) * 86400000).toISOString().split('T')[0],
            value: 6.8 - i * 0.3,
            upper: 7.2 - i * 0.3,
            lower: 6.4 - i * 0.3
          }))
        },
        {
          indicator: '运输准时率',
          currentValue: 87.2,
          predictedValue: 89.5,
          trend: 'up',
          alertProbability: 35,
          confidence: 82,
          accuracy: 87.8,
          historicalData: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(baseDate.getTime() + i * 86400000).toISOString().split('T')[0],
            value: 85 + i * 0.3 + Math.random() * 0.5
          })),
          predictions: Array.from({ length: 3 }, (_, i) => ({
            date: new Date(baseDate.getTime() + (i + 7) * 86400000).toISOString().split('T')[0],
            value: 87.2 + i * 0.8,
            upper: 88.5 + i * 0.8,
            lower: 85.9 + i * 0.8
          }))
        }
      ]
      trendPredictions.value = predictions
      resolve()
    }, 700)
  })
}

// 预警规则操作
const handleAddRule = () => {
  Object.assign(ruleForm, {
    name: '',
    indicator: '',
    thresholdType: 'fixed',
    threshold: 0,
    level: 'normal',
    notifyMethod: [],
    enabled: true
  })
  ruleDialogVisible.value = true
}

const handleEditRule = (rule: AlertRule) => {
  Object.assign(ruleForm, { ...rule })
  ruleDialogVisible.value = true
}

const handleDeleteRule = async (rule: AlertRule) => {
  try {
    await ElMessageBox.confirm(`确定要删除预警规则"${rule.name}"吗？`, '确认删除', {
      type: 'warning'
    })
    alertRules.value = alertRules.value.filter(r => r.id !== rule.id)
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}

const handleToggleRule = (rule: AlertRule) => {
  rule.enabled = !rule.enabled
  ElMessage.success(`已${rule.enabled ? '启用' : '禁用'}规则"${rule.name}"`)
}

const saveRule = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate((valid) => {
    if (valid) {
      if (ruleForm.id) {
        const index = alertRules.value.findIndex(r => r.id === ruleForm.id)
        if (index !== -1) {
          alertRules.value[index] = { ...ruleForm as AlertRule }
        }
        ElMessage.success('修改成功')
      } else {
        const newRule: AlertRule = {
          ...ruleForm as AlertRule,
          id: Date.now().toString(),
          createTime: new Date().toLocaleString('zh-CN')
        }
        alertRules.value.push(newRule)
        ElMessage.success('添加成功')
      }
      ruleDialogVisible.value = false
    }
  })
}

// 预警操作
const handleAlertClick = async (alert: ActiveAlert) => {
  selectedAlert.value = alert
  await loadRootCause(alert.id)
  await loadDisposalRecords(alert.id)
}

const handleStartDisposal = async (alert: ActiveAlert) => {
  try {
    await ElMessageBox.prompt('请输入处理说明', '开始处理预警', {
      inputPlaceholder: '请输入处理说明',
      inputValidator: (value) => !!value || '处理说明不能为空'
    })
    alert.status = 'processing'
    alert.handler = '当前用户'
    ElMessage.success('已开始处理预警')
    
    // 创建处置记录
    const newRecord: DisposalRecord = {
      id: Date.now().toString(),
      alertId: alert.id,
      handler: '当前用户',
      startTime: new Date().toLocaleString('zh-CN'),
      status: 'processing',
      actions: [{
        time: new Date().toLocaleString('zh-CN'),
        action: '开始处理',
        result: '已接手处理此预警'
      }]
    }
    disposalRecords.value.unshift(newRecord)
  } catch {
    // 用户取消
  }
}

const handleResolveAlert = async (alert: ActiveAlert) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入解决方案', '标记为已解决', {
      inputPlaceholder: '请输入解决方案',
      inputValidator: (value) => !!value || '解决方案不能为空'
    })
    alert.status = 'resolved'
    ElMessage.success('预警已标记为已解决')
    
    // 更新处置记录
    const record = disposalRecords.value.find(r => r.alertId === alert.id && r.status === 'processing')
    if (record) {
      record.status = 'resolved'
      record.endTime = new Date().toLocaleString('zh-CN')
      record.actions.push({
        time: new Date().toLocaleString('zh-CN'),
        action: '标记已解决',
        result: value as string
      })
    }
  } catch {
    // 用户取消
  }
}

const handleCloseAlert = async (alert: ActiveAlert) => {
  try {
    await ElMessageBox.confirm('确定要关闭此预警吗？', '确认关闭', {
      type: 'warning'
    })
    alert.status = 'closed'
    ElMessage.success('预警已关闭')
    
    // 更新处置记录
    const record = disposalRecords.value.find(r => r.alertId === alert.id)
    if (record) {
      record.status = 'closed'
      record.endTime = new Date().toLocaleString('zh-CN')
      record.actions.push({
        time: new Date().toLocaleString('zh-CN'),
        action: '关闭预警',
        result: '预警已关闭'
      })
    }
  } catch {
    // 用户取消
  }
}

// 加载根因分析
const loadRootCause = async (alertId: string) => {
  analysisLoading.value = true
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      rootCauseData.value = {
        alertId,
        problemDesc: '订单履约率低于预期，主要受华东区和华南区影响，分析发现是由于仓储配送效率下降和运输延误导致。',
        relatedData: [
          { key: '华东区订单量', value: '1,245', status: 'normal' },
          { key: '华东区履约率', value: '89.5%', status: 'abnormal' },
          { key: '华南区订单量', value: '982', status: 'normal' },
          { key: '华南区履约率', value: '90.2%', status: 'abnormal' },
          { key: '仓库处理时效', value: '延迟2.5小时', status: 'abnormal' },
          { key: '运输准时率', value: '85.3%', status: 'abnormal' }
        ],
        impactScope: [
          { area: '华东区', severity: 85, affectedCount: 112 },
          { area: '华南区', severity: 78, affectedCount: 89 },
          { area: '西南区', severity: 45, affectedCount: 34 }
        ],
        tracebackPath: [
          { step: 1, node: '订单接收', status: 'normal', time: '2025-10-29 09:00' },
          { step: 2, node: '订单分配', status: 'normal', time: '2025-10-29 09:15' },
          { step: 3, node: '仓库拣货', status: 'abnormal', time: '2025-10-29 11:30 (延迟)' },
          { step: 4, node: '包装出库', status: 'abnormal', time: '2025-10-29 14:00 (延迟)' },
          { step: 5, node: '运输配送', status: 'abnormal', time: '2025-10-29 次日 (延迟)' }
        ]
      }
      analysisLoading.value = false
      resolve()
    }, 800)
  })
}

// 加载处置记录
const loadDisposalRecords = async (alertId: string) => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      disposalRecords.value = [
        {
          id: '1',
          alertId,
          handler: '张三',
          startTime: '2025-10-30 09:35:00',
          endTime: '2025-10-30 11:20:00',
          status: 'resolved',
          actions: [
            {
              time: '2025-10-30 09:35:00',
              action: '开始处理',
              result: '已接手处理此预警'
            },
            {
              time: '2025-10-30 10:00:00',
              action: '协调仓库',
              result: '联系仓库主管，安排加急处理积压订单'
            },
            {
              time: '2025-10-30 10:30:00',
              action: '优化配送',
              result: '调整运输线路，增加配送车辆'
            },
            {
              time: '2025-10-30 11:20:00',
              action: '标记已解决',
              result: '通过优化流程和增加资源，履约率已恢复到94.8%'
            }
          ],
          feedback: '处理及时，效果明显',
          verification: true
        }
      ]
      resolve()
    }, 500)
  })
}

// 查看趋势预测详情
const handleViewPrediction = (prediction: TrendPrediction) => {
  selectedPrediction.value = prediction
  activeTab.value = 'prediction'
}

// 导出报告
const handleExportReport = () => {
  ElMessage.success('正在生成报告，请稍候...')
  setTimeout(() => {
    ElMessage.success('报告已生成并开始下载')
  }, 1500)
}

// 表单验证规则
const ruleFormRules = {
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  indicator: [{ required: true, message: '请选择指标', trigger: 'change' }],
  threshold: [{ required: true, message: '请输入阈值', trigger: 'blur' }]
}

// 初始化
onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="weakness-alert-container">
    <!-- 顶部统计 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="4">
        <el-card shadow="hover">
          <el-statistic title="活跃预警" :value="alertStats.total">
            <template #suffix>
              <span class="stat-unit">个</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-urgent">
          <el-statistic title="紧急预警" :value="alertStats.urgent">
            <template #suffix>
              <span class="stat-unit">个</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-important">
          <el-statistic title="重要预警" :value="alertStats.important">
            <template #suffix>
              <span class="stat-unit">个</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-pending">
          <el-statistic title="待处理" :value="alertStats.pending">
            <template #suffix>
              <span class="stat-unit">个</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-processing">
          <el-statistic title="处理中" :value="alertStats.processing">
            <template #suffix>
              <span class="stat-unit">个</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-resolved">
          <el-statistic title="已解决" :value="alertStats.resolved">
            <template #suffix>
              <span class="stat-unit">个</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 左侧：预警规则管理 -->
      <div class="left-panel">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">预警规则配置</span>
              <el-button type="primary" size="small" @click="handleAddRule">
                新增规则
              </el-button>
            </div>
          </template>

          <div v-loading="loading" class="rule-list">
            <div
              v-for="rule in alertRules"
              :key="rule.id"
              class="rule-item"
              :class="{ disabled: !rule.enabled }"
            >
              <div class="rule-header">
                <el-tag :type="levelConfig[rule.level].type" size="small">
                  {{ levelConfig[rule.level].label }}
                </el-tag>
                <el-switch
                  v-model="rule.enabled"
                  size="small"
                  @change="handleToggleRule(rule)"
                />
              </div>
              <div class="rule-name">{{ rule.name }}</div>
              <div class="rule-info">
                <div class="rule-detail">
                  <span class="label">指标：</span>
                  <span class="value">{{ rule.indicator }}</span>
                </div>
                <div class="rule-detail">
                  <span class="label">阈值类型：</span>
                  <span class="value">
                    {{ rule.thresholdType === 'fixed' ? '固定阈值' : rule.thresholdType === 'dynamic' ? '动态阈值' : '趋势阈值' }}
                  </span>
                </div>
                <div class="rule-detail">
                  <span class="label">阈值：</span>
                  <span class="value highlight">{{ rule.threshold }}{{ rule.thresholdType === 'trend' ? '%' : '' }}</span>
                </div>
                <div class="rule-detail">
                  <span class="label">通知方式：</span>
                  <span class="value">{{ rule.notifyMethod.join('、') }}</span>
                </div>
              </div>
              <div class="rule-actions">
                <el-button text type="primary" size="small" @click="handleEditRule(rule)">
                  编辑
                </el-button>
                <el-button text type="danger" size="small" @click="handleDeleteRule(rule)">
                  删除
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 中间：实时预警监控 -->
      <div class="center-panel">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">实时预警监控</span>
              <div class="header-actions">
                <el-input
                  v-model="searchKeyword"
                  placeholder="搜索预警"
                  size="small"
                  style="width: 200px; margin-right: 10px"
                  clearable
                />
                <el-select
                  v-model="filterLevel"
                  placeholder="预警级别"
                  size="small"
                  style="width: 120px; margin-right: 10px"
                >
                  <el-option label="全部" value="all" />
                  <el-option label="紧急" value="urgent" />
                  <el-option label="重要" value="important" />
                  <el-option label="一般" value="normal" />
                  <el-option label="提示" value="info" />
                </el-select>
                <el-button type="primary" size="small" @click="handleExportReport">
                  导出报告
                </el-button>
              </div>
            </div>
          </template>

          <div v-loading="loading" class="alert-list">
            <el-alert
              v-if="filteredAlerts.length === 0"
              title="暂无活跃预警"
              type="info"
              :closable="false"
              center
            />
            <div
              v-for="alert in filteredAlerts"
              :key="alert.id"
              class="alert-item"
              :class="[`level-${alert.level}`, { active: selectedAlert?.id === alert.id }]"
              @click="handleAlertClick(alert)"
            >
              <div class="alert-header">
                <div class="alert-title">
                  <el-tag :type="levelConfig[alert.level].type" size="small">
                    {{ levelConfig[alert.level].label }}
                  </el-tag>
                  <span class="alert-name">{{ alert.ruleName }}</span>
                </div>
                <el-tag :type="statusConfig[alert.status].type" size="small">
                  {{ statusConfig[alert.status].label }}
                </el-tag>
              </div>
              
              <div class="alert-content">
                <div class="alert-metric">
                  <div class="metric-item">
                    <span class="metric-label">指标：</span>
                    <span class="metric-value">{{ alert.indicator }}</span>
                  </div>
                  <div class="metric-item">
                    <span class="metric-label">当前值：</span>
                    <span class="metric-value danger">{{ alert.currentValue }}%</span>
                  </div>
                  <div class="metric-item">
                    <span class="metric-label">阈值：</span>
                    <span class="metric-value">{{ alert.threshold }}%</span>
                  </div>
                  <div class="metric-item">
                    <span class="metric-label">偏差：</span>
                    <span class="metric-value" :class="alert.deviation < 0 ? 'danger' : 'success'">
                      {{ alert.deviation > 0 ? '+' : '' }}{{ alert.deviation }}%
                    </span>
                  </div>
                </div>
                
                <div class="alert-info">
                  <div class="info-item">
                    <span class="label">触发时间：</span>
                    <span class="value">{{ alert.triggerTime }}</span>
                  </div>
                  <div v-if="alert.handler" class="info-item">
                    <span class="label">处理人：</span>
                    <span class="value">{{ alert.handler }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">影响范围：</span>
                    <el-tag
                      v-for="area in alert.affectedArea"
                      :key="area"
                      size="small"
                      style="margin-right: 5px"
                    >
                      {{ area }}
                    </el-tag>
                  </div>
                </div>
              </div>

              <div class="alert-actions">
                <el-button
                  v-if="alert.status === 'pending'"
                  type="primary"
                  size="small"
                  @click.stop="handleStartDisposal(alert)"
                >
                  开始处理
                </el-button>
                <el-button
                  v-if="alert.status === 'processing'"
                  type="success"
                  size="small"
                  @click.stop="handleResolveAlert(alert)"
                >
                  标记已解决
                </el-button>
                <el-button
                  v-if="alert.status === 'resolved'"
                  type="info"
                  size="small"
                  @click.stop="handleCloseAlert(alert)"
                >
                  关闭预警
                </el-button>
                <el-button
                  text
                  type="primary"
                  size="small"
                  @click.stop="handleAlertClick(alert)"
                >
                  查看详情
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 右侧：问题定位分析面板 -->
      <div class="right-panel">
        <el-tabs v-model="activeTab">
          <!-- 根因分析 -->
          <el-tab-pane label="根因分析" name="monitor">
            <el-card v-if="!selectedAlert" shadow="never" class="empty-state">
              <el-empty description="请从左侧选择一个预警查看详情" />
            </el-card>

            <div v-else v-loading="analysisLoading" class="analysis-panel">
              <!-- 问题描述 -->
              <el-card shadow="never" class="analysis-section">
                <template #header>
                  <span class="section-title">问题描述</span>
                </template>
                <el-alert
                  :title="`预警ID: ${selectedAlert.id}`"
                  :description="rootCauseData?.problemDesc"
                  type="warning"
                  :closable="false"
                />
              </el-card>

              <!-- 关联数据 -->
              <el-card shadow="never" class="analysis-section">
                <template #header>
                  <span class="section-title">关联数据</span>
                </template>
                <el-descriptions :column="2" border>
                  <el-descriptions-item
                    v-for="item in rootCauseData?.relatedData"
                    :key="item.key"
                    :label="item.key"
                  >
                    <span :class="{ 'text-danger': item.status === 'abnormal' }">
                      {{ item.value }}
                    </span>
                    <el-tag
                      v-if="item.status === 'abnormal'"
                      type="danger"
                      size="small"
                      style="margin-left: 8px"
                    >
                      异常
                    </el-tag>
                  </el-descriptions-item>
                </el-descriptions>
              </el-card>

              <!-- 影响范围 -->
              <el-card shadow="never" class="analysis-section">
                <template #header>
                  <span class="section-title">影响范围</span>
                </template>
                <div class="impact-list">
                  <div
                    v-for="item in rootCauseData?.impactScope"
                    :key="item.area"
                    class="impact-item"
                  >
                    <div class="impact-header">
                      <span class="impact-area">{{ item.area }}</span>
                      <span class="impact-count">影响订单: {{ item.affectedCount }}</span>
                    </div>
                    <el-progress
                      :percentage="item.severity"
                      :color="item.severity > 80 ? '#F56C6C' : item.severity > 60 ? '#E6A23C' : '#409EFF'"
                      :stroke-width="12"
                    />
                  </div>
                </div>
              </el-card>

              <!-- 追溯路径 -->
              <el-card shadow="never" class="analysis-section">
                <template #header>
                  <span class="section-title">问题追溯路径</span>
                </template>
                <el-timeline>
                  <el-timeline-item
                    v-for="node in rootCauseData?.tracebackPath"
                    :key="node.step"
                    :timestamp="node.time"
                    :type="node.status === 'abnormal' ? 'danger' : 'success'"
                    placement="top"
                  >
                    <el-card>
                      <div class="timeline-content">
                        <span class="timeline-title">{{ node.node }}</span>
                        <el-tag
                          :type="node.status === 'abnormal' ? 'danger' : 'success'"
                          size="small"
                        >
                          {{ node.status === 'abnormal' ? '异常' : '正常' }}
                        </el-tag>
                      </div>
                    </el-card>
                  </el-timeline-item>
                </el-timeline>
              </el-card>
            </div>
          </el-tab-pane>

          <!-- 处置跟踪 -->
          <el-tab-pane label="处置跟踪" name="disposal">
            <div v-if="!selectedAlert" class="empty-state">
              <el-empty description="请从左侧选择一个预警查看处置记录" />
            </div>

            <div v-else class="disposal-panel">
              <el-card
                v-for="record in disposalRecords"
                :key="record.id"
                shadow="never"
                class="disposal-record"
              >
                <template #header>
                  <div class="record-header">
                    <div>
                      <span class="record-title">处置记录 #{{ record.id }}</span>
                      <el-tag :type="statusConfig[record.status].type" size="small" style="margin-left: 10px">
                        {{ statusConfig[record.status].label }}
                      </el-tag>
                    </div>
                    <span class="record-handler">处理人: {{ record.handler }}</span>
                  </div>
                </template>

                <el-descriptions :column="2" border>
                  <el-descriptions-item label="开始时间">{{ record.startTime }}</el-descriptions-item>
                  <el-descriptions-item label="结束时间">
                    {{ record.endTime || '进行中' }}
                  </el-descriptions-item>
                </el-descriptions>

                <div class="action-timeline">
                  <h4>处置过程</h4>
                  <el-timeline>
                    <el-timeline-item
                      v-for="(action, idx) in record.actions"
                      :key="idx"
                      :timestamp="action.time"
                      placement="top"
                    >
                      <el-card>
                        <h4>{{ action.action }}</h4>
                        <p>{{ action.result }}</p>
                      </el-card>
                    </el-timeline-item>
                  </el-timeline>
                </div>

                <div v-if="record.feedback" class="feedback-section">
                  <h4>处置反馈</h4>
                  <el-alert :title="record.feedback" type="success" :closable="false" />
                  <div v-if="record.verification" class="verification">
                    <el-tag type="success">已验证</el-tag>
                  </div>
                </div>
              </el-card>

              <el-empty v-if="disposalRecords.length === 0" description="暂无处置记录" />
            </div>
          </el-tab-pane>

          <!-- 趋势预测 -->
          <el-tab-pane label="趋势预测" name="prediction">
            <div class="prediction-panel">
              <el-row :gutter="16">
                <el-col
                  v-for="prediction in trendPredictions"
                  :key="prediction.indicator"
                  :span="24"
                >
                  <el-card shadow="never" class="prediction-card">
                    <template #header>
                      <div class="prediction-header">
                        <span class="prediction-title">{{ prediction.indicator }}</span>
                        <el-tag
                          :type="prediction.trend === 'down' ? 'danger' : prediction.trend === 'up' ? 'success' : 'info'"
                        >
                          {{ prediction.trend === 'down' ? '下降趋势' : prediction.trend === 'up' ? '上升趋势' : '稳定' }}
                        </el-tag>
                      </div>
                    </template>

                    <el-row :gutter="16" class="prediction-stats">
                      <el-col :span="6">
                        <el-statistic title="当前值" :value="prediction.currentValue" :precision="1">
                          <template #suffix>%</template>
                        </el-statistic>
                      </el-col>
                      <el-col :span="6">
                        <el-statistic title="预测值" :value="prediction.predictedValue" :precision="1">
                          <template #suffix>%</template>
                        </el-statistic>
                      </el-col>
                      <el-col :span="6">
                        <el-statistic title="预警概率" :value="prediction.alertProbability" :precision="0">
                          <template #suffix>%</template>
                        </el-statistic>
                      </el-col>
                      <el-col :span="6">
                        <el-statistic title="预测置信度" :value="prediction.confidence" :precision="0">
                          <template #suffix>%</template>
                        </el-statistic>
                      </el-col>
                    </el-row>

                    <div class="prediction-progress">
                      <div class="progress-label">
                        <span>预警风险等级</span>
                        <span>{{ prediction.alertProbability }}%</span>
                      </div>
                      <el-progress
                        :percentage="prediction.alertProbability"
                        :color="prediction.alertProbability > 70 ? '#F56C6C' : prediction.alertProbability > 40 ? '#E6A23C' : '#67C23A'"
                        :stroke-width="16"
                      />
                    </div>

                    <div class="prediction-accuracy">
                      <span class="accuracy-label">模型准确率：</span>
                      <el-tag type="success">{{ prediction.accuracy }}%</el-tag>
                    </div>
                  </el-card>
                </el-col>
              </el-row>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <!-- 规则配置对话框 -->
    <el-dialog
      v-model="ruleDialogVisible"
      :title="ruleForm.id ? '编辑预警规则' : '新增预警规则'"
      width="600px"
    >
      <el-form
        ref="ruleFormRef"
        :model="ruleForm"
        :rules="ruleFormRules"
        label-width="120px"
      >
        <el-form-item label="规则名称" prop="name">
          <el-input v-model="ruleForm.name" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="监控指标" prop="indicator">
          <el-select v-model="ruleForm.indicator" placeholder="请选择指标" style="width: 100%">
            <el-option label="订单履约率" value="订单履约率" />
            <el-option label="库存周转率" value="库存周转率" />
            <el-option label="运输准时率" value="运输准时率" />
            <el-option label="供应商交付及时率" value="供应商交付及时率" />
            <el-option label="运输成本波动率" value="运输成本波动率" />
          </el-select>
        </el-form-item>
        <el-form-item label="阈值类型">
          <el-radio-group v-model="ruleForm.thresholdType">
            <el-radio value="fixed">固定阈值</el-radio>
            <el-radio value="dynamic">动态阈值</el-radio>
            <el-radio value="trend">趋势阈值</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="阈值" prop="threshold">
          <el-input-number
            v-model="ruleForm.threshold"
            :min="0"
            :max="100"
            :step="1"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="预警级别">
          <el-radio-group v-model="ruleForm.level">
            <el-radio value="urgent">紧急</el-radio>
            <el-radio value="important">重要</el-radio>
            <el-radio value="normal">一般</el-radio>
            <el-radio value="info">提示</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="通知方式">
          <el-checkbox-group v-model="ruleForm.notifyMethod">
            <el-checkbox value="邮件">邮件</el-checkbox>
            <el-checkbox value="短信">短信</el-checkbox>
            <el-checkbox value="系统通知">系统通知</el-checkbox>
            <el-checkbox value="企业微信">企业微信</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="ruleForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ruleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRule(ruleFormRef)">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.weakness-alert-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);

  .stats-row {
    margin-bottom: 20px;

    .el-card {
      transition: all 0.3s;

      &:hover {
        transform: translateY(-2px);
      }

      &.stat-urgent {
        :deep(.el-statistic__head) {
          color: #f56c6c;
        }
        :deep(.el-statistic__content) {
          color: #f56c6c;
        }
      }

      &.stat-important {
        :deep(.el-statistic__head) {
          color: #e6a23c;
        }
        :deep(.el-statistic__content) {
          color: #e6a23c;
        }
      }

      &.stat-pending {
        :deep(.el-statistic__head) {
          color: #f56c6c;
        }
        :deep(.el-statistic__content) {
          color: #f56c6c;
        }
      }

      &.stat-processing {
        :deep(.el-statistic__head) {
          color: #409eff;
        }
        :deep(.el-statistic__content) {
          color: #409eff;
        }
      }

      &.stat-resolved {
        :deep(.el-statistic__head) {
          color: #67c23a;
        }
        :deep(.el-statistic__content) {
          color: #67c23a;
        }
      }

      .stat-unit {
        font-size: 14px;
        margin-left: 4px;
      }
    }
  }

  .main-content {
    display: flex;
    gap: 20px;
    height: calc(100vh - 200px);

    .left-panel {
      flex: 0 0 320px;
      overflow-y: auto;

      .rule-list {
        max-height: calc(100vh - 280px);
        overflow-y: auto;

        .rule-item {
          padding: 15px;
          border: 1px solid #e4e7ed;
          border-radius: 4px;
          margin-bottom: 10px;
          background-color: #fff;
          transition: all 0.3s;

          &:hover {
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
          }

          &.disabled {
            opacity: 0.6;
            background-color: #f5f7fa;
          }

          .rule-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
          }

          .rule-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #303133;
          }

          .rule-info {
            font-size: 13px;
            color: #606266;

            .rule-detail {
              margin-bottom: 5px;

              .label {
                color: #909399;
              }

              .value {
                color: #303133;

                &.highlight {
                  color: #409eff;
                  font-weight: bold;
                }
              }
            }
          }

          .rule-actions {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #e4e7ed;
            display: flex;
            gap: 10px;
          }
        }
      }
    }

    .center-panel {
      flex: 1;
      overflow-y: auto;

      .alert-list {
        max-height: calc(100vh - 320px);
        overflow-y: auto;

        .alert-item {
          padding: 16px;
          border: 2px solid transparent;
          border-radius: 8px;
          margin-bottom: 12px;
          background-color: #fff;
          cursor: pointer;
          transition: all 0.3s;

          &:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }

          &.active {
            border-color: #409eff;
            box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
          }

          &.level-urgent {
            border-left: 4px solid #f56c6c;
          }

          &.level-important {
            border-left: 4px solid #e6a23c;
          }

          &.level-normal {
            border-left: 4px solid #e6a23c;
          }

          &.level-info {
            border-left: 4px solid #409eff;
          }

          .alert-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;

            .alert-title {
              display: flex;
              align-items: center;
              gap: 10px;

              .alert-name {
                font-size: 16px;
                font-weight: bold;
                color: #303133;
              }
            }
          }

          .alert-content {
            .alert-metric {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 12px;
              margin-bottom: 12px;
              padding: 12px;
              background-color: #f5f7fa;
              border-radius: 4px;

              .metric-item {
                text-align: center;

                .metric-label {
                  display: block;
                  font-size: 12px;
                  color: #909399;
                  margin-bottom: 4px;
                }

                .metric-value {
                  display: block;
                  font-size: 18px;
                  font-weight: bold;
                  color: #303133;

                  &.danger {
                    color: #f56c6c;
                  }

                  &.success {
                    color: #67c23a;
                  }
                }
              }
            }

            .alert-info {
              font-size: 13px;

              .info-item {
                margin-bottom: 8px;

                .label {
                  color: #909399;
                  margin-right: 8px;
                }

                .value {
                  color: #303133;
                }
              }
            }
          }

          .alert-actions {
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid #e4e7ed;
            display: flex;
            gap: 10px;
          }
        }
      }
    }

    .right-panel {
      flex: 0 0 420px;
      overflow-y: auto;

      .empty-state {
        height: 300px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .analysis-panel {
        max-height: calc(100vh - 320px);
        overflow-y: auto;

        .analysis-section {
          margin-bottom: 16px;

          .section-title {
            font-weight: bold;
            color: #303133;
          }

          .text-danger {
            color: #f56c6c;
            font-weight: bold;
          }

          .impact-list {
            .impact-item {
              margin-bottom: 16px;

              .impact-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;

                .impact-area {
                  font-weight: bold;
                  color: #303133;
                }

                .impact-count {
                  font-size: 13px;
                  color: #606266;
                }
              }
            }
          }

          .timeline-content {
            display: flex;
            justify-content: space-between;
            align-items: center;

            .timeline-title {
              font-weight: bold;
            }
          }
        }
      }

      .disposal-panel {
        max-height: calc(100vh - 320px);
        overflow-y: auto;

        .disposal-record {
          margin-bottom: 16px;

          .record-header {
            display: flex;
            justify-content: space-between;
            align-items: center;

            .record-title {
              font-weight: bold;
              color: #303133;
            }

            .record-handler {
              font-size: 13px;
              color: #606266;
            }
          }

          .action-timeline {
            margin-top: 16px;

            h4 {
              margin-bottom: 12px;
              color: #303133;
            }
          }

          .feedback-section {
            margin-top: 16px;

            h4 {
              margin-bottom: 12px;
              color: #303133;
            }

            .verification {
              margin-top: 8px;
            }
          }
        }
      }

      .prediction-panel {
        max-height: calc(100vh - 320px);
        overflow-y: auto;

        .prediction-card {
          margin-bottom: 16px;

          .prediction-header {
            display: flex;
            justify-content: space-between;
            align-items: center;

            .prediction-title {
              font-weight: bold;
              color: #303133;
            }
          }

          .prediction-stats {
            margin-bottom: 20px;
          }

          .prediction-progress {
            margin: 20px 0;

            .progress-label {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              font-size: 14px;
              color: #606266;
            }
          }

          .prediction-accuracy {
            display: flex;
            align-items: center;
            gap: 8px;

            .accuracy-label {
              font-size: 14px;
              color: #606266;
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
      font-weight: bold;
      color: #303133;
    }

    .header-actions {
      display: flex;
      align-items: center;
    }
  }
}
</style>
