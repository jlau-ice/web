<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 类型定义
interface SecurityEvent {
  id: string
  title: string
  type: 'fire' | 'intrusion' | 'equipment' | 'violation' | 'cargo'
  level: 'emergency' | 'important' | 'normal' | 'info'
  status: 'pending' | 'responding' | 'handled' | 'closed'
  location: string
  time: string
  description: string
  triggerDevice: string
  responseTime?: string
  handler?: string
  linkedSystems: string[]
}

interface AlertRule {
  id: string
  name: string
  eventType: string
  level: 'emergency' | 'important' | 'normal' | 'info'
  enabled: boolean
  alertMethods: string[]
  notifyUsers: string[]
  escalationTime: number
  autoResponse: boolean
}

interface LinkageRule {
  id: string
  name: string
  eventType: string
  targetSystem: 'fire' | 'access' | 'alarm' | 'lighting' | 'ventilation'
  enabled: boolean
  conditions: string
  actions: string[]
  delaySeconds: number
}

interface ResponseTask {
  id: string
  eventId: string
  title: string
  priority: 'high' | 'medium' | 'low'
  assignedTo: string
  status: 'pending' | 'processing' | 'completed'
  createdAt: string
  completedAt?: string
  steps: ResponseStep[]
}

interface ResponseStep {
  name: string
  status: 'pending' | 'processing' | 'completed'
  description: string
}

interface EmergencyPlan {
  id: string
  name: string
  eventType: string
  level: 'emergency' | 'important' | 'normal'
  description: string
  steps: string[]
  responsiblePerson: string
  contactInfo: string
  updateTime: string
  status: 'active' | 'inactive'
}

// 响应式数据
const loading = ref(true)
const events = ref<SecurityEvent[]>([])
const alertRules = ref<AlertRule[]>([])
const linkageRules = ref<LinkageRule[]>([])
const responseTasks = ref<ResponseTask[]>([])
const emergencyPlans = ref<EmergencyPlan[]>([])
const selectedEvent = ref<SecurityEvent | null>(null)
const activeTab = ref('monitor')
const eventFilter = ref<'all' | 'fire' | 'intrusion' | 'equipment' | 'violation' | 'cargo'>('all')
const levelFilter = ref<'all' | 'emergency' | 'important' | 'normal' | 'info'>('all')
const statusFilter = ref<'all' | 'pending' | 'responding' | 'handled' | 'closed'>('all')
const autoRefresh = ref(true)
const refreshInterval = ref<number | null>(null)

// 事件类型配置
const eventTypeConfig = {
  fire: { label: '火灾报警', color: '#F56C6C', icon: '🔥' },
  intrusion: { label: '入侵检测', color: '#E6A23C', icon: '🚨' },
  equipment: { label: '设备异常', color: '#409EFF', icon: '⚙️' },
  violation: { label: '违规行为', color: '#F0C84C', icon: '⚠️' },
  cargo: { label: '货物异常', color: '#67C23A', icon: '📦' }
}

// 事件级别配置
const levelConfig = {
  emergency: { label: '紧急', color: '#F56C6C', type: 'danger' },
  important: { label: '重要', color: '#E6A23C', type: 'warning' },
  normal: { label: '一般', color: '#F0C84C', type: '' },
  info: { label: '提示', color: '#409EFF', type: 'info' }
}

// 响应状态配置
const statusConfig = {
  pending: { label: '待响应', color: '#F56C6C', type: 'danger' },
  responding: { label: '响应中', color: '#409EFF', type: '' },
  handled: { label: '已处理', color: '#67C23A', type: 'success' },
  closed: { label: '已关闭', color: '#909399', type: 'info' }
}

// 联动系统配置
const linkageSystemConfig = {
  fire: { label: '消防系统', icon: '🚒' },
  access: { label: '门禁系统', icon: '🚪' },
  alarm: { label: '声光报警', icon: '🔔' },
  lighting: { label: '应急照明', icon: '💡' },
  ventilation: { label: '通风系统', icon: '🌬️' }
}

// 计算属性
const filteredEvents = computed(() => {
  return events.value.filter(event => {
    const typeMatch = eventFilter.value === 'all' || event.type === eventFilter.value
    const levelMatch = levelFilter.value === 'all' || event.level === levelFilter.value
    const statusMatch = statusFilter.value === 'all' || event.status === statusFilter.value
    return typeMatch && levelMatch && statusMatch
  }).sort((a, b) => {
    const levelPriority = { emergency: 4, important: 3, normal: 2, info: 1 }
    return levelPriority[b.level] - levelPriority[a.level]
  })
})

const emergencyCount = computed(() => 
  events.value.filter(e => e.level === 'emergency' && e.status === 'pending').length
)

const pendingCount = computed(() => 
  events.value.filter(e => e.status === 'pending').length
)

const respondingCount = computed(() => 
  events.value.filter(e => e.status === 'responding').length
)

const handledRate = computed(() => {
  const total = events.value.length
  const handled = events.value.filter(e => e.status === 'handled' || e.status === 'closed').length
  return total > 0 ? ((handled / total) * 100).toFixed(1) : '0'
})

// Mock 数据加载
const loadMockData = () => {
  loading.value = true

  setTimeout(() => {
    // 模拟事件数据
    events.value = [
      {
        id: 'EVT001',
        title: '1号仓库东侧烟雾报警',
        type: 'fire',
        level: 'emergency',
        status: 'pending',
        location: '1号仓库-东侧区域',
        time: new Date(Date.now() - 2 * 60000).toLocaleString(),
        description: '烟雾传感器检测到异常烟雾浓度，数值超过安全阈值3倍',
        triggerDevice: '烟感-A001',
        linkedSystems: ['消防系统', '声光报警', '通风系统']
      },
      {
        id: 'EVT002',
        title: '货物装卸区域未授权人员入侵',
        type: 'intrusion',
        level: 'important',
        status: 'responding',
        location: '货物装卸区-A区',
        time: new Date(Date.now() - 8 * 60000).toLocaleString(),
        description: 'AI视频监控识别到非授权人员进入限制区域',
        triggerDevice: '摄像头-C015',
        responseTime: new Date(Date.now() - 6 * 60000).toLocaleString(),
        handler: '安保-张三',
        linkedSystems: ['门禁系统', '声光报警']
      },
      {
        id: 'EVT003',
        title: '3号叉车设备温度异常',
        type: 'equipment',
        level: 'important',
        status: 'responding',
        location: '主仓储区-B区',
        time: new Date(Date.now() - 15 * 60000).toLocaleString(),
        description: '叉车发动机温度持续上升，已达到90°C',
        triggerDevice: '叉车-003',
        responseTime: new Date(Date.now() - 12 * 60000).toLocaleString(),
        handler: '设备部-李四',
        linkedSystems: ['设备监控']
      },
      {
        id: 'EVT004',
        title: '员工违规吸烟行为',
        type: 'violation',
        level: 'normal',
        status: 'handled',
        location: '办公楼-二楼走廊',
        time: new Date(Date.now() - 35 * 60000).toLocaleString(),
        description: 'AI识别检测到员工在非吸烟区吸烟',
        triggerDevice: '摄像头-B008',
        responseTime: new Date(Date.now() - 30 * 60000).toLocaleString(),
        handler: '安保-王五',
        linkedSystems: ['声光报警']
      },
      {
        id: 'EVT005',
        title: '货物堆叠高度超标',
        type: 'cargo',
        level: 'normal',
        status: 'handled',
        location: '2号仓库-南区',
        time: new Date(Date.now() - 55 * 60000).toLocaleString(),
        description: '货物堆叠高度超过安全标准线50cm',
        triggerDevice: '高度传感器-H012',
        responseTime: new Date(Date.now() - 45 * 60000).toLocaleString(),
        handler: '仓管-赵六',
        linkedSystems: []
      },
      {
        id: 'EVT006',
        title: '配电柜温度预警',
        type: 'equipment',
        level: 'info',
        status: 'closed',
        location: '配电室-A',
        time: new Date(Date.now() - 125 * 60000).toLocaleString(),
        description: '配电柜内部温度略高，已自动启动散热',
        triggerDevice: '温控-P001',
        responseTime: new Date(Date.now() - 120 * 60000).toLocaleString(),
        handler: '电工-钱七',
        linkedSystems: ['通风系统']
      }
    ]

    // 模拟告警规则
    alertRules.value = [
      {
        id: 'AR001',
        name: '火灾紧急告警规则',
        eventType: '火灾报警',
        level: 'emergency',
        enabled: true,
        alertMethods: ['声光报警', '消息推送', '邮件通知', '电话通知'],
        notifyUsers: ['消防主管', '安全主管', '总经理'],
        escalationTime: 5,
        autoResponse: true
      },
      {
        id: 'AR002',
        name: '入侵检测告警规则',
        eventType: '入侵检测',
        level: 'important',
        enabled: true,
        alertMethods: ['声光报警', '消息推送', '邮件通知'],
        notifyUsers: ['安保主管', '值班经理'],
        escalationTime: 10,
        autoResponse: true
      },
      {
        id: 'AR003',
        name: '设备异常告警规则',
        eventType: '设备异常',
        level: 'important',
        enabled: true,
        alertMethods: ['消息推送', '邮件通知'],
        notifyUsers: ['设备主管', '维修负责人'],
        escalationTime: 15,
        autoResponse: false
      },
      {
        id: 'AR004',
        name: '违规行为告警规则',
        eventType: '违规行为',
        level: 'normal',
        enabled: true,
        alertMethods: ['消息推送'],
        notifyUsers: ['安全员', '值班经理'],
        escalationTime: 30,
        autoResponse: false
      },
      {
        id: 'AR005',
        name: '货物异常告警规则',
        eventType: '货物异常',
        level: 'normal',
        enabled: true,
        alertMethods: ['消息推送'],
        notifyUsers: ['仓管员', '物流主管'],
        escalationTime: 20,
        autoResponse: false
      }
    ]

    // 模拟联动规则
    linkageRules.value = [
      {
        id: 'LR001',
        name: '火灾消防系统联动',
        eventType: '火灾报警',
        targetSystem: 'fire',
        enabled: true,
        conditions: '烟雾浓度 > 阈值 OR 温度 > 60°C',
        actions: ['启动消防喷淋', '开启排烟系统', '切断电源', '疏散广播'],
        delaySeconds: 0
      },
      {
        id: 'LR002',
        name: '火灾门禁应急联动',
        eventType: '火灾报警',
        targetSystem: 'access',
        enabled: true,
        conditions: '火灾等级 = 紧急',
        actions: ['解锁所有安全出口', '开启应急通道', '禁止电梯使用'],
        delaySeconds: 3
      },
      {
        id: 'LR003',
        name: '入侵声光报警联动',
        eventType: '入侵检测',
        targetSystem: 'alarm',
        enabled: true,
        conditions: '非授权人员 AND 限制区域',
        actions: ['触发现场警报', '启动红色闪光灯', '语音警告'],
        delaySeconds: 0
      },
      {
        id: 'LR004',
        name: '入侵门禁联动',
        eventType: '入侵检测',
        targetSystem: 'access',
        enabled: true,
        conditions: '入侵级别 >= 重要',
        actions: ['锁定相关区域', '关闭通道门禁', '启动视频录像'],
        delaySeconds: 5
      },
      {
        id: 'LR005',
        name: '火灾应急照明联动',
        eventType: '火灾报警',
        targetSystem: 'lighting',
        enabled: true,
        conditions: '火灾等级 >= 重要',
        actions: ['开启应急照明', '指示疏散路线', '关闭常规照明'],
        delaySeconds: 2
      },
      {
        id: 'LR006',
        name: '设备异常通风联动',
        eventType: '设备异常',
        targetSystem: 'ventilation',
        enabled: true,
        conditions: '温度 > 80°C OR 烟雾检测',
        actions: ['启动强制通风', '开启排风扇', '调节空调'],
        delaySeconds: 10
      }
    ]

    // 模拟响应任务
    responseTasks.value = [
      {
        id: 'TASK001',
        eventId: 'EVT001',
        title: '处置1号仓库烟雾报警',
        priority: 'high',
        assignedTo: '消防队-张三',
        status: 'pending',
        createdAt: new Date(Date.now() - 2 * 60000).toLocaleString(),
        steps: [
          { name: '确认火源位置', status: 'pending', description: '派遣现场人员确认起火点' },
          { name: '启动灭火设备', status: 'pending', description: '根据火情启动相应灭火设备' },
          { name: '人员疏散', status: 'pending', description: '组织相关区域人员有序疏散' },
          { name: '现场隔离', status: 'pending', description: '隔离火源区域，防止蔓延' },
          { name: '后续检查', status: 'pending', description: '火情控制后进行全面检查' }
        ]
      },
      {
        id: 'TASK002',
        eventId: 'EVT002',
        title: '处置装卸区入侵事件',
        priority: 'high',
        assignedTo: '安保-张三',
        status: 'processing',
        createdAt: new Date(Date.now() - 8 * 60000).toLocaleString(),
        steps: [
          { name: '定位入侵人员', status: 'completed', description: '通过监控确定人员位置' },
          { name: '现场拦截', status: 'processing', description: '安保人员前往现场拦截' },
          { name: '身份核查', status: 'pending', description: '核实人员身份和进入目的' },
          { name: '记录备案', status: 'pending', description: '详细记录事件经过' }
        ]
      },
      {
        id: 'TASK003',
        eventId: 'EVT003',
        title: '处置3号叉车温度异常',
        priority: 'medium',
        assignedTo: '设备部-李四',
        status: 'processing',
        createdAt: new Date(Date.now() - 15 * 60000).toLocaleString(),
        steps: [
          { name: '停止设备运行', status: 'completed', description: '立即停止叉车作业' },
          { name: '检查冷却系统', status: 'processing', description: '检查冷却液和散热器' },
          { name: '故障排除', status: 'pending', description: '找出温度异常原因' },
          { name: '维修处理', status: 'pending', description: '进行必要的维修' }
        ]
      }
    ]

    // 模拟应急预案
    emergencyPlans.value = [
      {
        id: 'PLAN001',
        name: '火灾应急处置预案',
        eventType: '火灾报警',
        level: 'emergency',
        description: '针对各类火灾事故的综合应急处置预案，包括初期火灾扑救、人员疏散、消防联动等完整流程',
        steps: [
          '1. 发现火情立即启动预案，拨打119报警',
          '2. 现场人员使用灭火器进行初期扑救',
          '3. 启动消防喷淋系统和排烟系统',
          '4. 组织人员按疏散路线有序撤离',
          '5. 切断火源区域电源，关闭燃气阀门',
          '6. 消防队到场后配合专业扑救',
          '7. 火情控制后进行现场勘查',
          '8. 统计人员情况和财产损失',
          '9. 事后总结并完善预案'
        ],
        responsiblePerson: '安全主管-张伟',
        contactInfo: '13800138001',
        updateTime: '2025-10-15',
        status: 'active'
      },
      {
        id: 'PLAN002',
        name: '入侵事件应急预案',
        eventType: '入侵检测',
        level: 'important',
        description: '应对非法入侵、盗窃等安全事件的应急处置预案',
        steps: [
          '1. 监控中心确认入侵警报真实性',
          '2. 通知安保人员立即赶往现场',
          '3. 启动声光报警威慑入侵者',
          '4. 锁定相关区域门禁通道',
          '5. 调取监控视频记录证据',
          '6. 安保人员现场拦截盘问',
          '7. 必要时报警请求警方支援',
          '8. 检查是否有财产损失',
          '9. 完成事件报告和记录'
        ],
        responsiblePerson: '安保主管-李强',
        contactInfo: '13900139002',
        updateTime: '2025-10-10',
        status: 'active'
      },
      {
        id: 'PLAN003',
        name: '设备故障应急预案',
        eventType: '设备异常',
        level: 'important',
        description: '关键设备故障的应急处置和备用方案',
        steps: [
          '1. 接到设备异常报警立即响应',
          '2. 停止异常设备运行避免扩大损失',
          '3. 维修人员快速到达现场',
          '4. 进行初步故障诊断',
          '5. 启用备用设备保障生产',
          '6. 制定维修方案并实施',
          '7. 测试设备恢复正常',
          '8. 记录故障原因和处理过程',
          '9. 优化维护计划预防再次发生'
        ],
        responsiblePerson: '设备主管-王军',
        contactInfo: '13700137003',
        updateTime: '2025-10-08',
        status: 'active'
      },
      {
        id: 'PLAN004',
        name: '人员违规处置预案',
        eventType: '违规行为',
        level: 'normal',
        description: '员工违规行为的发现、制止和教育处理流程',
        steps: [
          '1. AI监控或人员发现违规行为',
          '2. 现场语音或人员警告制止',
          '3. 记录违规人员信息和证据',
          '4. 通知相关部门负责人',
          '5. 对当事人进行安全教育',
          '6. 根据制度进行相应处罚',
          '7. 定期通报违规案例',
          '8. 加强重点区域监管'
        ],
        responsiblePerson: '安全员-赵敏',
        contactInfo: '13600136004',
        updateTime: '2025-10-05',
        status: 'active'
      },
      {
        id: 'PLAN005',
        name: '货物异常应急预案',
        eventType: '货物异常',
        level: 'normal',
        description: '货物堆放、倒塌、损坏等异常情况的处置预案',
        steps: [
          '1. 发现货物异常立即报告',
          '2. 划定警戒区域禁止靠近',
          '3. 评估倒塌或损坏风险',
          '4. 组织专业人员进行加固',
          '5. 逐步转移异常货物',
          '6. 检查货物损坏情况',
          '7. 清理现场恢复秩序',
          '8. 统计损失并上报',
          '9. 优化货物堆放规范'
        ],
        responsiblePerson: '仓管主管-孙丽',
        contactInfo: '13500135005',
        updateTime: '2025-10-01',
        status: 'active'
      }
    ]

    selectedEvent.value = events.value[0]
    loading.value = false
    ElMessage.success('事件响应数据加载成功')
  }, 1200)
}

// 选择事件
const selectEvent = (event: SecurityEvent) => {
  selectedEvent.value = event
}

// 响应事件
const respondToEvent = (event: SecurityEvent) => {
  if (event.status === 'pending') {
    event.status = 'responding'
    event.responseTime = new Date().toLocaleString()
    event.handler = '当前用户'
    ElMessage.success(`开始响应事件: ${event.title}`)
  }
}

// 处理事件
const handleEvent = async (event: SecurityEvent) => {
  try {
    await ElMessageBox.confirm(
      '确认已完成事件处理？处理后事件将标记为已处理状态。',
      '确认处理',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'success'
      }
    )
    event.status = 'handled'
    ElMessage.success('事件已标记为已处理')
  } catch {
    // 用户取消
  }
}

// 关闭事件
const closeEvent = async (event: SecurityEvent) => {
  try {
    await ElMessageBox.confirm(
      '确认关闭此事件？关闭后事件将进入归档状态。',
      '确认关闭',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    event.status = 'closed'
    ElMessage.success('事件已关闭')
  } catch {
    // 用户取消
  }
}

// 切换告警规则
const toggleAlertRule = (rule: AlertRule) => {
  ElMessage.success(`告警规则"${rule.name}"已${rule.enabled ? '启用' : '禁用'}`)
}

// 编辑告警规则
const editAlertRule = (rule: AlertRule) => {
  ElMessage.info(`编辑告警规则: ${rule.name}`)
}

// 测试告警
const testAlert = (rule: AlertRule) => {
  ElMessage.info(`正在测试告警规则: ${rule.name}...`)
  setTimeout(() => {
    ElMessage.success('告警测试成功，已发送测试通知')
  }, 1500)
}

// 切换联动规则
const toggleLinkageRule = (rule: LinkageRule) => {
  ElMessage.success(`联动规则"${rule.name}"已${rule.enabled ? '启用' : '禁用'}`)
}

// 测试联动
const testLinkage = (rule: LinkageRule) => {
  ElMessage.info(`正在测试联动规则: ${rule.name}...`)
  setTimeout(() => {
    ElMessage.success('联动测试成功，系统响应正常')
  }, 2000)
}

// 更新任务步骤
const updateTaskStep = (task: ResponseTask, step: ResponseStep) => {
  if (step.status === 'pending') {
    step.status = 'processing'
    ElMessage.info(`开始执行: ${step.name}`)
  } else if (step.status === 'processing') {
    step.status = 'completed'
    ElMessage.success(`完成: ${step.name}`)
    
    // 检查是否所有步骤都完成
    const allCompleted = task.steps.every(s => s.status === 'completed')
    if (allCompleted) {
      task.status = 'completed'
      task.completedAt = new Date().toLocaleString()
      ElMessage.success('任务已全部完成')
    }
  }
}

// 启动应急预案
const activatePlan = async (plan: EmergencyPlan) => {
  try {
    await ElMessageBox.confirm(
      `确认启动应急预案"${plan.name}"？启动后将按预案流程执行应急响应。`,
      '启动应急预案',
      {
        confirmButtonText: '立即启动',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    ElMessage.success(`应急预案"${plan.name}"已启动`)
  } catch {
    // 用户取消
  }
}

// 预案演练
const conductDrill = (plan: EmergencyPlan) => {
  ElMessage.info(`开始预案演练: ${plan.name}`)
}

// 导出预案
const exportPlan = (plan: EmergencyPlan) => {
  ElMessage.success(`导出预案: ${plan.name}`)
}

// 刷新数据
const refreshData = () => {
  loadMockData()
}

// 自动刷新
const startAutoRefresh = () => {
  if (refreshInterval.value) return
  refreshInterval.value = window.setInterval(() => {
    // 模拟实时数据更新
    const now = new Date()
    events.value.forEach(event => {
      if (event.status === 'pending' || event.status === 'responding') {
        // 模拟事件时间更新
      }
    })
  }, 10000) // 每10秒刷新一次
}

const stopAutoRefresh = () => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
}

// 生命周期
onMounted(() => {
  loadMockData()
  if (autoRefresh.value) {
    startAutoRefresh()
  }
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<template>
  <div class="event-response-container" v-loading="loading">
    <!-- 顶部统计面板 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card emergency">
          <el-statistic :value="emergencyCount" title="紧急事件">
            <template #prefix>
              <span class="stat-icon">🚨</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <el-statistic :value="pendingCount" title="待响应">
            <template #prefix>
              <span class="stat-icon" style="color: #F56C6C;">⏳</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <el-statistic :value="respondingCount" title="响应中">
            <template #prefix>
              <span class="stat-icon" style="color: #409EFF;">⚡</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <el-statistic :value="handledRate" title="处理率">
            <template #suffix>%</template>
            <template #prefix>
              <span class="stat-icon" style="color: #67C23A;">✅</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- 主要内容区域 -->
    <el-row :gutter="16" class="main-content">
      <!-- 左侧：实时事件监控 -->
      <el-col :xs="24" :md="8">
        <el-card shadow="never" class="monitor-card">
          <template #header>
            <div class="card-header">
              <span class="title">📊 实时事件监控</span>
              <el-button type="primary" size="small" @click="refreshData">刷新</el-button>
            </div>
          </template>

          <!-- 筛选器 -->
          <div class="filters">
            <el-select v-model="eventFilter" placeholder="事件类型" size="small" style="width: 90px;">
              <el-option label="全部" value="all" />
              <el-option v-for="(config, key) in eventTypeConfig" :key="key" :label="config.label" :value="key" />
            </el-select>
            <el-select v-model="levelFilter" placeholder="级别" size="small" style="width: 80px; margin-left: 8px;">
              <el-option label="全部" value="all" />
              <el-option label="紧急" value="emergency" />
              <el-option label="重要" value="important" />
              <el-option label="一般" value="normal" />
              <el-option label="提示" value="info" />
            </el-select>
            <el-select v-model="statusFilter" placeholder="状态" size="small" style="width: 90px; margin-left: 8px;">
              <el-option label="全部" value="all" />
              <el-option label="待响应" value="pending" />
              <el-option label="响应中" value="responding" />
              <el-option label="已处理" value="handled" />
              <el-option label="已关闭" value="closed" />
            </el-select>
          </div>

          <!-- 事件列表 -->
          <div class="event-list">
            <el-scrollbar height="680px">
              <div
                v-for="event in filteredEvents"
                :key="event.id"
                class="event-item"
                :class="[
                  `level-${event.level}`,
                  { active: selectedEvent?.id === event.id }
                ]"
                @click="selectEvent(event)"
              >
                <div class="event-header">
                  <div class="event-title-row">
                    <span class="event-icon">{{ eventTypeConfig[event.type].icon }}</span>
                    <span class="event-title">{{ event.title }}</span>
                  </div>
                  <el-tag 
                    :type="levelConfig[event.level].type" 
                    size="small"
                    effect="dark"
                  >
                    {{ levelConfig[event.level].label }}
                  </el-tag>
                </div>
                
                <div class="event-info">
                  <div class="info-row">
                    <span class="label">位置：</span>
                    <span class="value">{{ event.location }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">时间：</span>
                    <span class="value">{{ event.time }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">触发设备：</span>
                    <span class="value">{{ event.triggerDevice }}</span>
                  </div>
                </div>

                <div class="event-status">
                  <el-tag :type="statusConfig[event.status].type" size="small">
                    {{ statusConfig[event.status].label }}
                  </el-tag>
                  <div class="event-actions" v-if="event.status === 'pending' || event.status === 'responding'">
                    <el-button 
                      v-if="event.status === 'pending'"
                      type="primary" 
                      size="small" 
                      @click.stop="respondToEvent(event)"
                    >
                      立即响应
                    </el-button>
                    <el-button 
                      v-if="event.status === 'responding'"
                      type="success" 
                      size="small" 
                      @click.stop="handleEvent(event)"
                    >
                      标记处理
                    </el-button>
                  </div>
                </div>
              </div>
              <el-empty v-if="filteredEvents.length === 0" description="暂无事件" />
            </el-scrollbar>
          </div>
        </el-card>
      </el-col>

      <!-- 中间：响应操作面板 -->
      <el-col :xs="24" :md="10">
        <el-card shadow="never" class="response-card">
          <template #header>
            <div class="card-header">
              <span class="title">⚡ 事件响应处理</span>
            </div>
          </template>

          <el-tabs v-model="activeTab" class="response-tabs">
            <!-- 事件详情 -->
            <el-tab-pane label="事件详情" name="detail">
              <div v-if="selectedEvent" class="event-detail">
                <el-descriptions :column="1" border>
                  <el-descriptions-item label="事件ID">{{ selectedEvent.id }}</el-descriptions-item>
                  <el-descriptions-item label="事件标题">{{ selectedEvent.title }}</el-descriptions-item>
                  <el-descriptions-item label="事件类型">
                    <el-tag size="small">{{ eventTypeConfig[selectedEvent.type].label }}</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="紧急级别">
                    <el-tag :type="levelConfig[selectedEvent.level].type" size="small">
                      {{ levelConfig[selectedEvent.level].label }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="当前状态">
                    <el-tag :type="statusConfig[selectedEvent.status].type" size="small">
                      {{ statusConfig[selectedEvent.status].label }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="发生位置">{{ selectedEvent.location }}</el-descriptions-item>
                  <el-descriptions-item label="发生时间">{{ selectedEvent.time }}</el-descriptions-item>
                  <el-descriptions-item label="触发设备">{{ selectedEvent.triggerDevice }}</el-descriptions-item>
                  <el-descriptions-item label="响应时间" v-if="selectedEvent.responseTime">
                    {{ selectedEvent.responseTime }}
                  </el-descriptions-item>
                  <el-descriptions-item label="处理人员" v-if="selectedEvent.handler">
                    {{ selectedEvent.handler }}
                  </el-descriptions-item>
                  <el-descriptions-item label="事件描述">
                    {{ selectedEvent.description }}
                  </el-descriptions-item>
                  <el-descriptions-item label="联动系统">
                    <el-tag 
                      v-for="system in selectedEvent.linkedSystems" 
                      :key="system"
                      size="small"
                      style="margin-right: 4px;"
                    >
                      {{ system }}
                    </el-tag>
                    <span v-if="selectedEvent.linkedSystems.length === 0" style="color: #909399;">无</span>
                  </el-descriptions-item>
                </el-descriptions>

                <div class="detail-actions">
                  <el-button 
                    v-if="selectedEvent.status === 'pending'"
                    type="primary" 
                    style="width: 100%;"
                    @click="respondToEvent(selectedEvent)"
                  >
                    开始响应
                  </el-button>
                  <el-button 
                    v-if="selectedEvent.status === 'responding'"
                    type="success" 
                    style="width: 100%;"
                    @click="handleEvent(selectedEvent)"
                  >
                    标记为已处理
                  </el-button>
                  <el-button 
                    v-if="selectedEvent.status === 'handled'"
                    type="info" 
                    style="width: 100%;"
                    @click="closeEvent(selectedEvent)"
                  >
                    关闭事件
                  </el-button>
                </div>
              </div>
              <el-empty v-else description="请选择一个事件" />
            </el-tab-pane>

            <!-- 响应任务 -->
            <el-tab-pane label="响应任务" name="tasks">
              <el-scrollbar height="620px">
                <div class="tasks-list">
                  <el-card 
                    v-for="task in responseTasks" 
                    :key="task.id"
                    class="task-item"
                    shadow="hover"
                  >
                    <div class="task-header">
                      <div class="task-title-row">
                        <el-tag 
                          :type="task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : ''"
                          size="small"
                        >
                          {{ task.priority === 'high' ? '高优先级' : task.priority === 'medium' ? '中优先级' : '低优先级' }}
                        </el-tag>
                        <span class="task-title">{{ task.title }}</span>
                      </div>
                      <el-tag 
                        :type="task.status === 'completed' ? 'success' : task.status === 'processing' ? 'warning' : 'info'"
                        size="small"
                      >
                        {{ task.status === 'completed' ? '已完成' : task.status === 'processing' ? '进行中' : '待处理' }}
                      </el-tag>
                    </div>

                    <div class="task-info">
                      <div class="info-item">
                        <span class="label">分配给：</span>
                        <span>{{ task.assignedTo }}</span>
                      </div>
                      <div class="info-item">
                        <span class="label">创建时间：</span>
                        <span>{{ task.createdAt }}</span>
                      </div>
                      <div class="info-item" v-if="task.completedAt">
                        <span class="label">完成时间：</span>
                        <span>{{ task.completedAt }}</span>
                      </div>
                    </div>

                    <el-divider style="margin: 12px 0;" />

                    <div class="task-steps">
                      <div class="steps-title">处理步骤：</div>
                      <el-timeline>
                        <el-timeline-item
                          v-for="(step, index) in task.steps"
                          :key="index"
                          :color="step.status === 'completed' ? '#67C23A' : step.status === 'processing' ? '#409EFF' : '#909399'"
                        >
                          <div class="step-item">
                            <div class="step-header">
                              <span class="step-name">{{ step.name }}</span>
                              <el-tag 
                                :type="step.status === 'completed' ? 'success' : step.status === 'processing' ? '' : 'info'"
                                size="small"
                              >
                                {{ step.status === 'completed' ? '已完成' : step.status === 'processing' ? '进行中' : '待处理' }}
                              </el-tag>
                            </div>
                            <div class="step-description">{{ step.description }}</div>
                            <el-button 
                              v-if="step.status !== 'completed'"
                              type="primary" 
                              size="small" 
                              @click="updateTaskStep(task, step)"
                              style="margin-top: 8px;"
                            >
                              {{ step.status === 'pending' ? '开始执行' : '标记完成' }}
                            </el-button>
                          </div>
                        </el-timeline-item>
                      </el-timeline>
                    </div>
                  </el-card>
                </div>
              </el-scrollbar>
            </el-tab-pane>

            <!-- 应急预案 -->
            <el-tab-pane label="应急预案" name="plans">
              <el-scrollbar height="620px">
                <div class="plans-list">
                  <el-card 
                    v-for="plan in emergencyPlans" 
                    :key="plan.id"
                    class="plan-item"
                    shadow="hover"
                  >
                    <div class="plan-header">
                      <div class="plan-title-row">
                        <span class="plan-name">{{ plan.name }}</span>
                        <el-tag 
                          :type="plan.level === 'emergency' ? 'danger' : plan.level === 'important' ? 'warning' : ''"
                          size="small"
                        >
                          {{ levelConfig[plan.level].label }}
                        </el-tag>
                      </div>
                      <el-tag 
                        :type="plan.status === 'active' ? 'success' : 'info'"
                        size="small"
                      >
                        {{ plan.status === 'active' ? '启用中' : '已停用' }}
                      </el-tag>
                    </div>

                    <div class="plan-info">
                      <div class="info-item">
                        <span class="label">适用类型：</span>
                        <span>{{ plan.eventType }}</span>
                      </div>
                      <div class="info-item">
                        <span class="label">负责人：</span>
                        <span>{{ plan.responsiblePerson }}</span>
                      </div>
                      <div class="info-item">
                        <span class="label">联系方式：</span>
                        <span>{{ plan.contactInfo }}</span>
                      </div>
                      <div class="info-item">
                        <span class="label">更新时间：</span>
                        <span>{{ plan.updateTime }}</span>
                      </div>
                    </div>

                    <div class="plan-description">
                      {{ plan.description }}
                    </div>

                    <el-divider style="margin: 12px 0;" />

                    <div class="plan-steps">
                      <div class="steps-title">处置流程：</div>
                      <div class="step-list">
                        <div v-for="(step, index) in plan.steps" :key="index" class="step-text">
                          {{ step }}
                        </div>
                      </div>
                    </div>

                    <div class="plan-actions">
                      <el-button 
                        type="danger" 
                        size="small"
                        @click="activatePlan(plan)"
                      >
                        启动预案
                      </el-button>
                      <el-button 
                        type="warning" 
                        size="small"
                        @click="conductDrill(plan)"
                      >
                        预案演练
                      </el-button>
                      <el-button 
                        type="info" 
                        size="small"
                        @click="exportPlan(plan)"
                      >
                        导出预案
                      </el-button>
                    </div>
                  </el-card>
                </div>
              </el-scrollbar>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>

      <!-- 右侧：系统联动配置 -->
      <el-col :xs="24" :md="6">
        <!-- 告警配置 -->
        <el-card shadow="never" class="config-card">
          <template #header>
            <div class="card-header">
              <span class="title">🔔 智能告警配置</span>
            </div>
          </template>

          <el-scrollbar height="320px">
            <div class="config-list">
              <div v-for="rule in alertRules" :key="rule.id" class="config-item">
                <div class="config-header">
                  <span class="config-name">{{ rule.name }}</span>
                  <el-switch 
                    v-model="rule.enabled" 
                    size="small"
                    @change="toggleAlertRule(rule)"
                  />
                </div>
                
                <div class="config-info" v-if="rule.enabled">
                  <div class="info-item">
                    <span class="label">事件类型：</span>
                    <span>{{ rule.eventType }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">告警级别：</span>
                    <el-tag :type="levelConfig[rule.level].type" size="small">
                      {{ levelConfig[rule.level].label }}
                    </el-tag>
                  </div>
                  <div class="info-item">
                    <span class="label">告警方式：</span>
                    <div class="methods">
                      <el-tag 
                        v-for="method in rule.alertMethods" 
                        :key="method"
                        size="small"
                        style="margin: 2px;"
                      >
                        {{ method }}
                      </el-tag>
                    </div>
                  </div>
                  <div class="info-item">
                    <span class="label">升级时间：</span>
                    <span>{{ rule.escalationTime }}分钟</span>
                  </div>
                  <div class="info-item">
                    <span class="label">自动响应：</span>
                    <el-tag :type="rule.autoResponse ? 'success' : 'info'" size="small">
                      {{ rule.autoResponse ? '是' : '否' }}
                    </el-tag>
                  </div>
                  
                  <div class="config-actions">
                    <el-button type="primary" size="small" @click="editAlertRule(rule)">
                      编辑
                    </el-button>
                    <el-button type="success" size="small" @click="testAlert(rule)">
                      测试
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </el-scrollbar>
        </el-card>

        <!-- 联动配置 -->
        <el-card shadow="never" class="linkage-card" style="margin-top: 16px;">
          <template #header>
            <div class="card-header">
              <span class="title">🔗 系统联动配置</span>
            </div>
          </template>

          <el-scrollbar height="340px">
            <div class="linkage-list">
              <div v-for="rule in linkageRules" :key="rule.id" class="linkage-item">
                <div class="linkage-header">
                  <div class="linkage-title-row">
                    <span class="linkage-icon">{{ linkageSystemConfig[rule.targetSystem].icon }}</span>
                    <span class="linkage-name">{{ rule.name }}</span>
                  </div>
                  <el-switch 
                    v-model="rule.enabled" 
                    size="small"
                    @change="toggleLinkageRule(rule)"
                  />
                </div>

                <div class="linkage-info" v-if="rule.enabled">
                  <div class="info-item">
                    <span class="label">目标系统：</span>
                    <el-tag size="small">{{ linkageSystemConfig[rule.targetSystem].label }}</el-tag>
                  </div>
                  <div class="info-item">
                    <span class="label">触发条件：</span>
                    <span class="condition">{{ rule.conditions }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">执行动作：</span>
                    <div class="actions-list">
                      <div v-for="action in rule.actions" :key="action" class="action-tag">
                        • {{ action }}
                      </div>
                    </div>
                  </div>
                  <div class="info-item">
                    <span class="label">延迟时间：</span>
                    <span>{{ rule.delaySeconds }}秒</span>
                  </div>

                  <el-button 
                    type="primary" 
                    size="small" 
                    style="width: 100%; margin-top: 8px;"
                    @click="testLinkage(rule)"
                  >
                    测试联动
                  </el-button>
                </div>
              </div>
            </div>
          </el-scrollbar>
        </el-card>
      </el-col>
    </el-row>

    <!-- 底部提示 -->
    <el-alert
      title="🛡️ 智能事件响应系统"
      type="success"
      :closable="false"
      style="margin-top: 16px;"
    >
      <template #default>
        <div style="line-height: 1.8;">
          系统实现7×24小时智能监控，当前共监测 <strong style="color: #409EFF;">{{ events.length }}</strong> 个事件，
          其中紧急事件 <strong style="color: #F56C6C;">{{ emergencyCount }}</strong> 个，
          已配置 <strong style="color: #67C23A;">{{ alertRules.length }}</strong> 条告警规则和 
          <strong style="color: #67C23A;">{{ linkageRules.length }}</strong> 条联动规则，
          平均响应时间 <strong style="color: #409EFF;">&lt; 30秒</strong>，
          事件处理率达到 <strong style="color: #67C23A;">{{ handledRate }}%</strong>，
          有效替代传统人工值守，大幅降低安全风险。
        </div>
      </template>
    </el-alert>
  </div>
</template>

<style scoped lang="scss">
.event-response-container {
  padding: 20px;
  background: #f0f2f5;
  min-height: calc(100vh - 120px);

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

      &.emergency {
        border-left: 4px solid #F56C6C;
      }
    }
  }

  .main-content {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;

      .title {
        font-size: 16px;
        color: #303133;
      }
    }
  }

  // 左侧事件监控
  .monitor-card {
    height: 840px;
    overflow: hidden;

    .filters {
      margin-bottom: 16px;
      display: flex;
      align-items: center;
    }

    .event-list {
      .event-item {
        border: 1px solid #dcdfe6;
        border-left: 4px solid;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 12px;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        }

        &.active {
          background: #ecf5ff;
          border-color: #409EFF;
        }

        &.level-emergency {
          border-left-color: #F56C6C;
          background: #fef0f0;
        }

        &.level-important {
          border-left-color: #E6A23C;
          background: #fdf6ec;
        }

        &.level-normal {
          border-left-color: #F0C84C;
          background: #fdfae8;
        }

        &.level-info {
          border-left-color: #409EFF;
          background: #ecf5ff;
        }

        .event-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          .event-title-row {
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1;

            .event-icon {
              font-size: 20px;
            }

            .event-title {
              font-weight: 600;
              color: #303133;
              font-size: 14px;
            }
          }
        }

        .event-info {
          margin-bottom: 12px;

          .info-row {
            margin: 4px 0;
            font-size: 13px;
            display: flex;

            .label {
              color: #909399;
              min-width: 70px;
            }

            .value {
              color: #606266;
              flex: 1;
            }
          }
        }

        .event-status {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .event-actions {
            display: flex;
            gap: 8px;
          }
        }
      }
    }
  }

  // 中间响应面板
  .response-card {
    height: 840px;
    overflow: hidden;

    .response-tabs {
      height: calc(100% - 10px);

      :deep(.el-tabs__content) {
        height: calc(100% - 55px);
        overflow: auto;
      }

      .event-detail {
        .detail-actions {
          margin-top: 16px;
        }
      }

      .tasks-list,
      .plans-list {
        .task-item,
        .plan-item {
          margin-bottom: 16px;
          border-left: 4px solid #409EFF;

          &:last-child {
            margin-bottom: 0;
          }

          .task-header,
          .plan-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;

            .task-title-row,
            .plan-title-row {
              display: flex;
              align-items: center;
              gap: 8px;
              flex: 1;

              .task-title,
              .plan-name {
                font-weight: 600;
                color: #303133;
                font-size: 14px;
              }
            }
          }

          .task-info,
          .plan-info {
            margin-bottom: 12px;

            .info-item {
              margin: 6px 0;
              font-size: 13px;
              display: flex;

              .label {
                color: #909399;
                min-width: 80px;
              }
            }
          }

          .plan-description {
            color: #606266;
            font-size: 13px;
            line-height: 1.6;
            margin-bottom: 12px;
          }

          .task-steps,
          .plan-steps {
            .steps-title {
              font-weight: 600;
              color: #606266;
              margin-bottom: 12px;
              font-size: 14px;
            }

            .step-item {
              .step-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 6px;

                .step-name {
                  font-weight: 600;
                  color: #303133;
                  font-size: 13px;
                }
              }

              .step-description {
                color: #606266;
                font-size: 12px;
                margin-bottom: 4px;
              }
            }

            .step-list {
              .step-text {
                padding: 8px;
                background: #f5f7fa;
                border-radius: 4px;
                margin-bottom: 8px;
                font-size: 13px;
                color: #606266;
                line-height: 1.6;

                &:last-child {
                  margin-bottom: 0;
                }
              }
            }
          }

          .plan-actions {
            display: flex;
            gap: 8px;
            margin-top: 12px;
          }
        }
      }
    }
  }

  // 右侧配置面板
  .config-card,
  .linkage-card {
    .config-list,
    .linkage-list {
      .config-item,
      .linkage-item {
        border: 1px solid #dcdfe6;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 12px;

        &:last-child {
          margin-bottom: 0;
        }

        .config-header,
        .linkage-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          .config-name {
            font-weight: 600;
            color: #303133;
            font-size: 14px;
          }

          .linkage-title-row {
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1;

            .linkage-icon {
              font-size: 20px;
            }

            .linkage-name {
              font-weight: 600;
              color: #303133;
              font-size: 14px;
            }
          }
        }

        .config-info,
        .linkage-info {
          padding: 8px;
          background: #f5f7fa;
          border-radius: 4px;

          .info-item {
            margin: 8px 0;
            font-size: 13px;

            .label {
              color: #909399;
              display: block;
              margin-bottom: 4px;
            }

            .methods,
            .actions-list {
              margin-top: 4px;
            }

            .condition {
              color: #606266;
              font-style: italic;
            }

            .action-tag {
              color: #606266;
              margin: 2px 0;
            }
          }

          .config-actions {
            margin-top: 12px;
            display: flex;
            gap: 8px;
          }
        }
      }
    }
  }
}

// 响应式优化
@media (max-width: 768px) {
  .event-response-container {
    padding: 12px;

    .main-content {
      .el-col {
        margin-bottom: 16px;
      }
    }
  }
}
</style>
