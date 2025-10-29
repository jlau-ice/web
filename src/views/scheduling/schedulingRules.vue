<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  Search,
  Plus,
  Edit,
  Delete,
  Refresh,
  Setting,
  View,
  Download,
  Upload,
  CircleCheck,
  CircleClose,
  VideoPlay,
  Tools,
  Document,
  Star,
  Share
} from '@element-plus/icons-vue'

// 规则类型枚举
enum RuleType {
  TIME_SCHEDULE = 'time_schedule',
  RESOURCE_SCHEDULE = 'resource_schedule',
  LOAD_SCHEDULE = 'load_schedule',
  EMERGENCY_SCHEDULE = 'emergency_schedule'
}

// 规则状态枚举
enum RuleStatus {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  TESTING = 'testing'
}

// 触发类型枚举
enum TriggerType {
  TIME = 'time',
  EVENT = 'event',
  RESOURCE = 'resource'
}

// 条件关系枚举
enum ConditionRelation {
  AND = 'AND',
  OR = 'OR'
}

// 执行动作类型枚举
enum ActionType {
  TASK_DISPATCH = 'task_dispatch',
  RESOURCE_ADJUST = 'resource_adjust',
  ALERT_NOTIFY = 'alert_notify'
}

// 调度规则接口
interface SchedulingRule {
  id: string
  name: string
  description: string
  type: RuleType
  scenario: string
  status: RuleStatus
  deviceTypes: string[]
  trigger: TriggerConfig
  conditions: ConditionConfig[]
  conditionRelation: ConditionRelation
  actions: ActionConfig[]
  priority: number
  lastModifiedTime: string
  creator: string
  isFavorite: boolean
}

// 触发配置
interface TriggerConfig {
  type: TriggerType
  timeConfig?: {
    cron?: string
    schedule?: string
  }
  eventConfig?: {
    eventType: string
    eventSource: string
  }
  resourceConfig?: {
    resourceType: string
    threshold: number
  }
}

// 条件配置
interface ConditionConfig {
  id: string
  parameter: string
  operator: string
  value: string | number
  description: string
}

// 执行动作配置
interface ActionConfig {
  id: string
  type: ActionType
  config: any
  description: string
}

// 策略模板
interface StrategyTemplate {
  id: string
  name: string
  description: string
  category: string
  icon: string
  config: Partial<SchedulingRule>
  usageCount: number
  isFavorite: boolean
}

// 测试结果
interface TestResult {
  success: boolean
  matchedConditions: number
  totalConditions: number
  executedActions: string[]
  performance: {
    executionTime: number
    resourceUsage: number
  }
  logs: string[]
}

// 搜索筛选条件
const searchForm = reactive({
  keyword: '',
  type: '',
  status: ''
})

// 分页配置
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 规则列表数据
const ruleList = ref<SchedulingRule[]>([])
const loading = ref(false)
const selectedCategory = ref('all')

// 规则配置对话框
const dialogVisible = ref(false)
const dialogTitle = ref('新增调度规则')
const ruleFormRef = ref<FormInstance>()
const activeCollapse = ref('basic')
const ruleForm = reactive<Partial<SchedulingRule>>({
  id: '',
  name: '',
  description: '',
  type: RuleType.TIME_SCHEDULE,
  scenario: '',
  status: RuleStatus.DISABLED,
  deviceTypes: [],
  trigger: {
    type: TriggerType.TIME,
    timeConfig: {
      cron: '',
      schedule: ''
    },
    eventConfig: {
      eventType: '',
      eventSource: ''
    },
    resourceConfig: {
      resourceType: '',
      threshold: 0
    }
  },
  conditions: [],
  conditionRelation: ConditionRelation.AND,
  actions: [],
  priority: 5,
  isFavorite: false
})

// 表单验证规则
const ruleFormRules: FormRules = {
  name: [
    { required: true, message: '请输入规则名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  type: [{ required: true, message: '请选择规则类型', trigger: 'change' }],
  scenario: [{ required: true, message: '请输入适用场景', trigger: 'blur' }],
  deviceTypes: [
    { required: true, message: '请选择适用设备类型', trigger: 'change' }
  ]
}

// 条件配置对话框
const conditionDialogVisible = ref(false)
const currentCondition = reactive<ConditionConfig>({
  id: '',
  parameter: '',
  operator: '',
  value: '',
  description: ''
})

// 动作配置对话框
const actionDialogVisible = ref(false)
const currentAction = reactive<ActionConfig>({
  id: '',
  type: ActionType.TASK_DISPATCH,
  config: {},
  description: ''
})

// 模板管理对话框
const templateDialogVisible = ref(false)
const templateList = ref<StrategyTemplate[]>([])
const selectedTemplate = ref<StrategyTemplate | null>(null)

// 规则测试抽屉
const testDrawerVisible = ref(false)
const testForm = reactive({
  deviceId: '',
  simulateData: {}
})
const testResult = ref<TestResult | null>(null)
const testLoading = ref(false)

// 规则分类
const ruleCategories = [
  { label: '全部规则', value: 'all', count: 0 },
  { label: '时间调度', value: RuleType.TIME_SCHEDULE, count: 0, color: '#E6A23C' },
  { label: '资源调度', value: RuleType.RESOURCE_SCHEDULE, count: 0, color: '#67C23A' },
  { label: '负载调度', value: RuleType.LOAD_SCHEDULE, count: 0, color: '#409EFF' },
  { label: '应急调度', value: RuleType.EMERGENCY_SCHEDULE, count: 0, color: '#F56C6C' }
]

// 计算分类统计
const categoryStats = computed(() => {
  const stats = ruleCategories.map(cat => ({ ...cat, count: 0 }))
  stats[0].count = ruleList.value.length // 全部
  
  ruleList.value.forEach(rule => {
    const index = stats.findIndex(s => s.value === rule.type)
    if (index > 0) stats[index].count++
  })
  
  return stats
})

// 过滤后的规则列表
const filteredRuleList = computed(() => {
  let list = ruleList.value

  // 按分类筛选
  if (selectedCategory.value !== 'all') {
    list = list.filter(rule => rule.type === selectedCategory.value)
  }

  // 按类型筛选
  if (searchForm.type) {
    list = list.filter(rule => rule.type === searchForm.type)
  }

  // 按状态筛选
  if (searchForm.status) {
    list = list.filter(rule => rule.status === searchForm.status)
  }

  // 关键词搜索
  if (searchForm.keyword) {
    const keyword = searchForm.keyword.toLowerCase()
    list = list.filter(
      rule =>
        rule.name.toLowerCase().includes(keyword) ||
        rule.scenario.toLowerCase().includes(keyword)
    )
  }

  pagination.total = list.length
  const start = (pagination.currentPage - 1) * pagination.pageSize
  return list.slice(start, start + pagination.pageSize)
})

// 获取规则类型标签类型
const getRuleTypeTag = (type: RuleType) => {
  const typeMap = {
    [RuleType.TIME_SCHEDULE]: { type: 'warning', label: '时间调度' },
    [RuleType.RESOURCE_SCHEDULE]: { type: 'success', label: '资源调度' },
    [RuleType.LOAD_SCHEDULE]: { type: 'primary', label: '负载调度' },
    [RuleType.EMERGENCY_SCHEDULE]: { type: 'danger', label: '应急调度' }
  }
  return typeMap[type] || { type: 'info', label: '未知' }
}

// 获取状态标签类型
const getStatusTag = (status: RuleStatus) => {
  const statusMap = {
    [RuleStatus.ENABLED]: { type: 'success', label: '已启用' },
    [RuleStatus.DISABLED]: { type: 'info', label: '已禁用' },
    [RuleStatus.TESTING]: { type: 'primary', label: '测试中' }
  }
  return statusMap[status] || { type: 'info', label: '未知' }
}

// 加载规则列表
const loadRuleList = () => {
  loading.value = true
  setTimeout(() => {
    ruleList.value = generateMockRules()
    pagination.total = ruleList.value.length
    loading.value = false
  }, 500)
}

// 生成模拟数据
const generateMockRules = (): SchedulingRule[] => {
  const types = Object.values(RuleType)
  const statuses = Object.values(RuleStatus)
  const scenarios = [
    '高峰期负载均衡',
    '夜间维护调度',
    '紧急故障转移',
    '资源优化配置',
    '任务优先级调整',
    '设备健康检查',
    '性能监控告警',
    '自动扩缩容'
  ]

  return Array.from({ length: 25 }, (_, i) => ({
    id: `rule_${i + 1}`,
    name: `${scenarios[i % scenarios.length]}_${i + 1}`,
    description: `这是第 ${i + 1} 条调度规则的详细描述`,
    type: types[i % types.length],
    scenario: scenarios[i % scenarios.length],
    status: statuses[i % statuses.length],
    deviceTypes: ['边缘设备', '云服务器'].slice(0, Math.floor(Math.random() * 2) + 1),
    trigger: {
      type: TriggerType.TIME,
      timeConfig: {
        cron: '0 0 * * *',
        schedule: '每天凌晨执行'
      }
    },
    conditions: [
      {
        id: `cond_${i}_1`,
        parameter: 'cpu_usage',
        operator: '>',
        value: 80,
        description: 'CPU使用率大于80%'
      },
      {
        id: `cond_${i}_2`,
        parameter: 'memory_usage',
        operator: '>',
        value: 70,
        description: '内存使用率大于70%'
      }
    ],
    conditionRelation: i % 2 === 0 ? ConditionRelation.AND : ConditionRelation.OR,
    actions: [
      {
        id: `action_${i}_1`,
        type: ActionType.TASK_DISPATCH,
        config: { target: 'backup_server' },
        description: '分发任务到备用服务器'
      }
    ],
    priority: Math.floor(Math.random() * 10) + 1,
    lastModifiedTime: new Date(
      Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
    ).toLocaleString('zh-CN'),
    creator: ['张三', '李四', '王五'][i % 3],
    isFavorite: i % 5 === 0
  }))
}

// 生成模拟模板数据
const generateMockTemplates = (): StrategyTemplate[] => {
  return [
    {
      id: 'tpl_1',
      name: '高峰期负载均衡',
      description: '在业务高峰期自动调整资源分配，确保系统稳定运行',
      category: '负载调度',
      icon: 'TrendCharts',
      config: {
        type: RuleType.LOAD_SCHEDULE,
        trigger: { type: TriggerType.RESOURCE }
      },
      usageCount: 156,
      isFavorite: true
    },
    {
      id: 'tpl_2',
      name: '夜间维护窗口',
      description: '在夜间低峰期执行系统维护和更新任务',
      category: '时间调度',
      icon: 'Clock',
      config: {
        type: RuleType.TIME_SCHEDULE,
        trigger: { type: TriggerType.TIME }
      },
      usageCount: 89,
      isFavorite: false
    },
    {
      id: 'tpl_3',
      name: '紧急故障转移',
      description: '检测到设备故障时自动转移任务到健康节点',
      category: '应急调度',
      icon: 'Warning',
      config: {
        type: RuleType.EMERGENCY_SCHEDULE,
        trigger: { type: TriggerType.EVENT }
      },
      usageCount: 234,
      isFavorite: true
    },
    {
      id: 'tpl_4',
      name: '资源弹性伸缩',
      description: '根据资源使用情况自动调整计算资源',
      category: '资源调度',
      icon: 'Setting',
      config: {
        type: RuleType.RESOURCE_SCHEDULE,
        trigger: { type: TriggerType.RESOURCE }
      },
      usageCount: 178,
      isFavorite: false
    },
    {
      id: 'tpl_5',
      name: '智能任务调度',
      description: '基于任务优先级和设备状态的智能调度策略',
      category: '负载调度',
      icon: 'Connection',
      config: {
        type: RuleType.LOAD_SCHEDULE,
        trigger: { type: TriggerType.EVENT }
      },
      usageCount: 145,
      isFavorite: false
    },
    {
      id: 'tpl_6',
      name: '设备健康巡检',
      description: '定期检查设备健康状态并预警',
      category: '时间调度',
      icon: 'Monitor',
      config: {
        type: RuleType.TIME_SCHEDULE,
        trigger: { type: TriggerType.TIME }
      },
      usageCount: 98,
      isFavorite: true
    }
  ]
}

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1
  loadRuleList()
}

// 重置搜索
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.type = ''
  searchForm.status = ''
  pagination.currentPage = 1
  loadRuleList()
}

// 新增规则
const handleAdd = () => {
  dialogTitle.value = '新增调度规则'
  Object.assign(ruleForm, {
    id: '',
    name: '',
    description: '',
    type: RuleType.TIME_SCHEDULE,
    scenario: '',
    status: RuleStatus.DISABLED,
    deviceTypes: [],
    trigger: {
      type: TriggerType.TIME,
      timeConfig: {
        cron: '',
        schedule: ''
      },
      eventConfig: {
        eventType: '',
        eventSource: ''
      },
      resourceConfig: {
        resourceType: '',
        threshold: 0
      }
    },
    conditions: [],
    conditionRelation: ConditionRelation.AND,
    actions: [],
    priority: 5,
    isFavorite: false
  })
  dialogVisible.value = true
}

// 编辑规则
const handleEdit = (row: SchedulingRule) => {
  dialogTitle.value = '编辑调度规则'
  Object.assign(ruleForm, JSON.parse(JSON.stringify(row)))
  dialogVisible.value = true
}

// 删除规则
const handleDelete = (row: SchedulingRule) => {
  ElMessageBox.confirm(`确定要删除规则"${row.name}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      setTimeout(() => {
        const index = ruleList.value.findIndex(r => r.id === row.id)
        if (index > -1) {
          ruleList.value.splice(index, 1)
        }
        ElMessage.success('删除成功')
      }, 300)
    })
    .catch(() => {})
}

// 切换状态
const handleStatusChange = (row: SchedulingRule) => {
  const statusText = getStatusTag(row.status).label
  ElMessage.success(`规则状态已更新为：${statusText}`)
}

// 切换收藏
const handleToggleFavorite = (row: SchedulingRule) => {
  row.isFavorite = !row.isFavorite
  ElMessage.success(row.isFavorite ? '已添加到收藏' : '已取消收藏')
}

// 提交规则表单
const handleSubmit = () => {
  ruleFormRef.value?.validate((valid) => {
    if (valid) {
      setTimeout(() => {
        if (ruleForm.id) {
          // 更新
          const index = ruleList.value.findIndex(r => r.id === ruleForm.id)
          if (index > -1) {
            Object.assign(ruleList.value[index], {
              ...ruleForm,
              lastModifiedTime: new Date().toLocaleString('zh-CN')
            })
          }
          ElMessage.success('规则更新成功')
        } else {
          // 新增
          ruleList.value.unshift({
            ...ruleForm,
            id: `rule_${Date.now()}`,
            lastModifiedTime: new Date().toLocaleString('zh-CN'),
            creator: '当前用户'
          } as SchedulingRule)
          ElMessage.success('规则创建成功')
        }
        dialogVisible.value = false
      }, 300)
    }
  })
}

// 添加条件
const handleAddCondition = () => {
  Object.assign(currentCondition, {
    id: `cond_${Date.now()}`,
    parameter: '',
    operator: '',
    value: '',
    description: ''
  })
  conditionDialogVisible.value = true
}

// 编辑条件
const handleEditCondition = (condition: ConditionConfig) => {
  Object.assign(currentCondition, JSON.parse(JSON.stringify(condition)))
  conditionDialogVisible.value = true
}

// 删除条件
const handleDeleteCondition = (condition: ConditionConfig) => {
  const index = ruleForm.conditions!.findIndex(c => c.id === condition.id)
  if (index > -1) {
    ruleForm.conditions!.splice(index, 1)
    ElMessage.success('条件已删除')
  }
}

// 保存条件
const handleSaveCondition = () => {
  if (!currentCondition.parameter || !currentCondition.operator) {
    ElMessage.warning('请完善条件配置')
    return
  }

  const existingIndex = ruleForm.conditions!.findIndex(
    c => c.id === currentCondition.id
  )
  if (existingIndex > -1) {
    // 更新
    Object.assign(ruleForm.conditions![existingIndex], currentCondition)
  } else {
    // 新增
    ruleForm.conditions!.push({ ...currentCondition })
  }
  conditionDialogVisible.value = false
  ElMessage.success('条件保存成功')
}

// 添加动作
const handleAddAction = () => {
  Object.assign(currentAction, {
    id: `action_${Date.now()}`,
    type: ActionType.TASK_DISPATCH,
    config: {},
    description: ''
  })
  actionDialogVisible.value = true
}

// 编辑动作
const handleEditAction = (action: ActionConfig) => {
  Object.assign(currentAction, JSON.parse(JSON.stringify(action)))
  actionDialogVisible.value = true
}

// 删除动作
const handleDeleteAction = (action: ActionConfig) => {
  const index = ruleForm.actions!.findIndex(a => a.id === action.id)
  if (index > -1) {
    ruleForm.actions!.splice(index, 1)
    ElMessage.success('动作已删除')
  }
}

// 保存动作
const handleSaveAction = () => {
  if (!currentAction.type || !currentAction.description) {
    ElMessage.warning('请完善动作配置')
    return
  }

  const existingIndex = ruleForm.actions!.findIndex(
    a => a.id === currentAction.id
  )
  if (existingIndex > -1) {
    // 更新
    Object.assign(ruleForm.actions![existingIndex], currentAction)
  } else {
    // 新增
    ruleForm.actions!.push({ ...currentAction })
  }
  actionDialogVisible.value = false
  ElMessage.success('动作保存成功')
}

// 打开模板管理
const handleOpenTemplates = () => {
  templateList.value = generateMockTemplates()
  templateDialogVisible.value = true
}

// 应用模板
const handleApplyTemplate = (template: StrategyTemplate) => {
  Object.assign(ruleForm, {
    ...ruleForm,
    ...template.config,
    name: template.name,
    description: template.description
  })
  templateDialogVisible.value = false
  dialogVisible.value = true
  ElMessage.success('模板已应用，请继续完善配置')
}

// 导出模板
const handleExportTemplate = (template: StrategyTemplate) => {
  ElMessage.success(`模板 "${template.name}" 导出成功`)
}

// 导入模板
const handleImportTemplate = () => {
  ElMessage.info('请选择模板文件进行导入')
}

// 打开测试抽屉
const handleTest = (row?: SchedulingRule) => {
  if (row) {
    Object.assign(ruleForm, JSON.parse(JSON.stringify(row)))
  }
  testResult.value = null
  testDrawerVisible.value = true
}

// 执行测试
const handleRunTest = () => {
  testLoading.value = true
  setTimeout(() => {
    const success = Math.random() > 0.3
    testResult.value = {
      success,
      matchedConditions: success ? ruleForm.conditions!.length : Math.floor(Math.random() * ruleForm.conditions!.length),
      totalConditions: ruleForm.conditions!.length,
      executedActions: success
        ? ruleForm.actions!.map(a => a.description)
        : [],
      performance: {
        executionTime: Math.floor(Math.random() * 500) + 100,
        resourceUsage: Math.floor(Math.random() * 30) + 10
      },
      logs: [
        `[${new Date().toLocaleTimeString()}] 开始执行规则测试`,
        `[${new Date().toLocaleTimeString()}] 检查触发条件...`,
        `[${new Date().toLocaleTimeString()}] 评估业务规则...`,
        success
          ? `[${new Date().toLocaleTimeString()}] ✓ 规则验证通过`
          : `[${new Date().toLocaleTimeString()}] ✗ 规则验证失败`,
        `[${new Date().toLocaleTimeString()}] 测试完成`
      ]
    }
    testLoading.value = false
  }, 1500)
}

// 导出规则
const handleExport = () => {
  ElMessage.success('规则配置导出成功')
}

// 导入规则
const handleImport = () => {
  ElMessage.info('请选择规则配置文件进行导入')
}

// 分页变化
const handlePageChange = (page: number) => {
  pagination.currentPage = page
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.currentPage = 1
}

// 组件挂载
onMounted(() => {
  loadRuleList()
})
</script>

<template>
  <div class="scheduling-rules-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-title">
        <h2>调度规则设置</h2>
        <p>定义和管理任务调度的业务规则和策略，支持灵活的规则配置</p>
      </div>
      <div class="header-actions">
        <el-button :icon="Upload" @click="handleImport">导入规则</el-button>
        <el-button :icon="Download" @click="handleExport">导出规则</el-button>
        <el-button :icon="Document" @click="handleOpenTemplates">策略模板</el-button>
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增规则</el-button>
      </div>
    </div>

    <!-- 主体布局 -->
    <div class="main-content">
      <!-- 左侧分类导航 -->
      <div class="sidebar">
        <el-card shadow="never" class="category-card">
          <template #header>
            <div class="card-header">
              <span>规则分类</span>
              <el-button text :icon="Refresh" @click="loadRuleList" />
            </div>
          </template>
          <div class="category-list">
            <div
              v-for="category in categoryStats"
              :key="category.value"
              class="category-item"
              :class="{ active: selectedCategory === category.value }"
              @click="selectedCategory = category.value"
            >
              <div class="category-info">
                <span
                  v-if="category.color"
                  class="category-dot"
                  :style="{ backgroundColor: category.color }"
                />
                <span class="category-label">{{ category.label }}</span>
              </div>
              <el-badge :value="category.count" :max="99" />
            </div>
          </div>
        </el-card>

        <!-- 快速操作 -->
        <el-card shadow="never" class="quick-actions">
          <template #header>
            <span>快速操作</span>
          </template>
          <el-space direction="vertical" :size="8" style="width: 100%">
            <el-button text :icon="Star">我的收藏</el-button>
            <el-button text :icon="VideoPlay">测试运行</el-button>
            <el-button text :icon="Setting">批量管理</el-button>
            <el-button text :icon="Share">分享配置</el-button>
          </el-space>
        </el-card>
      </div>

      <!-- 右侧内容区 -->
      <div class="content-area">
        <!-- 搜索筛选栏 -->
        <el-card shadow="never" class="search-card">
          <el-form :model="searchForm" :inline="true">
            <el-form-item label="关键词">
              <el-input
                v-model="searchForm.keyword"
                placeholder="搜索规则名称或场景"
                clearable
                :prefix-icon="Search"
                style="width: 220px"
                @keyup.enter="handleSearch"
              />
            </el-form-item>
            <el-form-item label="规则类型">
              <el-select
                v-model="searchForm.type"
                placeholder="请选择"
                clearable
                style="width: 150px"
              >
                <el-option label="时间调度" :value="RuleType.TIME_SCHEDULE" />
                <el-option label="资源调度" :value="RuleType.RESOURCE_SCHEDULE" />
                <el-option label="负载调度" :value="RuleType.LOAD_SCHEDULE" />
                <el-option label="应急调度" :value="RuleType.EMERGENCY_SCHEDULE" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select
                v-model="searchForm.status"
                placeholder="请选择"
                clearable
                style="width: 120px"
              >
                <el-option label="已启用" :value="RuleStatus.ENABLED" />
                <el-option label="已禁用" :value="RuleStatus.DISABLED" />
                <el-option label="测试中" :value="RuleStatus.TESTING" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleSearch">
                搜索
              </el-button>
              <el-button :icon="Refresh" @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 规则列表 -->
        <el-card shadow="never" class="table-card">
          <el-table
            :data="filteredRuleList"
            v-loading="loading"
            style="width: 100%"
            stripe
          >
            <el-table-column prop="name" label="规则名称" min-width="180">
              <template #default="{ row }">
                <div class="rule-name">
                  <el-icon v-if="row.isFavorite" color="#F59E0B" style="margin-right: 4px">
                    <Star />
                  </el-icon>
                  <span>{{ row.name }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="type" label="规则类型" width="120">
              <template #default="{ row }">
                <el-tag :type="getRuleTypeTag(row.type).type">
                  {{ getRuleTypeTag(row.type).label }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              prop="scenario"
              label="适用场景"
              min-width="140"
              show-overflow-tooltip
            />
            <el-table-column prop="deviceTypes" label="设备类型" width="140">
              <template #default="{ row }">
                <el-tag
                  v-for="(type, index) in row.deviceTypes"
                  :key="index"
                  size="small"
                  style="margin-right: 4px"
                >
                  {{ type }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="priority" label="优先级" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.priority > 7 ? 'danger' : row.priority > 4 ? 'warning' : 'info'" size="small">
                  {{ row.priority }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusTag(row.status).type">
                  {{ getStatusTag(row.status).label }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              prop="lastModifiedTime"
              label="最后修改时间"
              width="160"
              show-overflow-tooltip
            />
            <el-table-column label="操作" width="280" fixed="right">
              <template #default="{ row }">
                <el-button
                  text
                  type="primary"
                  :icon="View"
                  @click="handleEdit(row)"
                >
                  查看
                </el-button>
                <el-button
                  text
                  type="primary"
                  :icon="Edit"
                  @click="handleEdit(row)"
                >
                  编辑
                </el-button>
                <el-button
                  text
                  type="success"
                  :icon="VideoPlay"
                  @click="handleTest(row)"
                >
                  测试
                </el-button>
                <el-button
                  text
                  type="danger"
                  :icon="Delete"
                  @click="handleDelete(row)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="pagination.currentPage"
              v-model:page-size="pagination.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="pagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @current-change="handlePageChange"
              @size-change="handleSizeChange"
            />
          </div>
        </el-card>
      </div>
    </div>

    <!-- 规则配置对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="900px"
      draggable
      destroy-on-close
    >
      <el-form
        ref="ruleFormRef"
        :model="ruleForm"
        :rules="ruleFormRules"
        label-width="120px"
      >
        <el-collapse v-model="activeCollapse" accordion>
          <!-- 基本信息 -->
          <el-collapse-item title="基本信息" name="basic">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="规则名称" prop="name">
                  <el-input v-model="ruleForm.name" placeholder="请输入规则名称" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="规则类型" prop="type">
                  <el-select v-model="ruleForm.type" placeholder="请选择" style="width: 100%">
                    <el-option label="时间调度" :value="RuleType.TIME_SCHEDULE" />
                    <el-option label="资源调度" :value="RuleType.RESOURCE_SCHEDULE" />
                    <el-option label="负载调度" :value="RuleType.LOAD_SCHEDULE" />
                    <el-option label="应急调度" :value="RuleType.EMERGENCY_SCHEDULE" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="适用场景" prop="scenario">
                  <el-input v-model="ruleForm.scenario" placeholder="请输入适用场景" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="优先级" prop="priority">
                  <el-slider v-model="ruleForm.priority" :min="1" :max="10" show-stops />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="设备类型" prop="deviceTypes">
                  <el-select
                    v-model="ruleForm.deviceTypes"
                    placeholder="请选择"
                    multiple
                    style="width: 100%"
                  >
                    <el-option label="边缘设备" value="边缘设备" />
                    <el-option label="云服务器" value="云服务器" />
                    <el-option label="边缘网关" value="边缘网关" />
                    <el-option label="物联网设备" value="物联网设备" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="规则状态" prop="status">
                  <el-radio-group v-model="ruleForm.status">
                    <el-radio :label="RuleStatus.ENABLED">启用</el-radio>
                    <el-radio :label="RuleStatus.DISABLED">禁用</el-radio>
                    <el-radio :label="RuleStatus.TESTING">测试</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="规则描述">
              <el-input
                v-model="ruleForm.description"
                type="textarea"
                :rows="3"
                placeholder="请输入规则描述"
              />
            </el-form-item>
          </el-collapse-item>

          <!-- 触发条件 -->
          <el-collapse-item title="触发条件" name="trigger">
            <el-form-item label="触发类型">
              <el-radio-group v-model="ruleForm.trigger.type">
                <el-radio :label="TriggerType.TIME">时间触发</el-radio>
                <el-radio :label="TriggerType.EVENT">事件触发</el-radio>
                <el-radio :label="TriggerType.RESOURCE">资源触发</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item
              v-if="ruleForm.trigger && ruleForm.trigger.type === TriggerType.TIME"
              label="时间配置"
            >
              <el-input
                v-model="ruleForm.trigger.timeConfig.schedule"
                placeholder="例如：每天凌晨2点执行"
              />
            </el-form-item>

            <el-form-item
              v-if="ruleForm.trigger && ruleForm.trigger.type === TriggerType.EVENT"
              label="事件类型"
            >
              <el-select
                v-model="ruleForm.trigger.eventConfig.eventType"
                placeholder="请选择事件类型"
                style="width: 100%"
              >
                <el-option label="设备上线" value="device_online" />
                <el-option label="设备离线" value="device_offline" />
                <el-option label="任务完成" value="task_complete" />
                <el-option label="资源告警" value="resource_alert" />
              </el-select>
            </el-form-item>

            <el-form-item
              v-if="ruleForm.trigger && ruleForm.trigger.type === TriggerType.RESOURCE"
              label="资源类型"
            >
              <el-select
                v-model="ruleForm.trigger.resourceConfig.resourceType"
                placeholder="请选择资源类型"
                style="width: 100%"
              >
                <el-option label="CPU使用率" value="cpu" />
                <el-option label="内存使用率" value="memory" />
                <el-option label="磁盘使用率" value="disk" />
                <el-option label="网络带宽" value="network" />
              </el-select>
            </el-form-item>
          </el-collapse-item>

          <!-- 条件设置 -->
          <el-collapse-item title="条件设置" name="conditions">
            <div class="condition-header">
              <el-form-item label="条件关系">
                <el-radio-group v-model="ruleForm.conditionRelation">
                  <el-radio :label="ConditionRelation.AND">满足所有条件(AND)</el-radio>
                  <el-radio :label="ConditionRelation.OR">满足任一条件(OR)</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-button type="primary" size="small" :icon="Plus" @click="handleAddCondition">
                添加条件
              </el-button>
            </div>

            <el-table :data="ruleForm.conditions" border style="margin-top: 10px">
              <el-table-column prop="parameter" label="参数" width="150" />
              <el-table-column prop="operator" label="操作符" width="100" />
              <el-table-column prop="value" label="值" width="120" />
              <el-table-column prop="description" label="描述" min-width="180" />
              <el-table-column label="操作" width="150">
                <template #default="{ row }">
                  <el-button text type="primary" :icon="Edit" @click="handleEditCondition(row)">
                    编辑
                  </el-button>
                  <el-button text type="danger" :icon="Delete" @click="handleDeleteCondition(row)">
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="!ruleForm.conditions || ruleForm.conditions.length === 0" description="暂无条件，请添加" />
          </el-collapse-item>

          <!-- 执行动作 -->
          <el-collapse-item title="执行动作" name="actions">
            <div class="action-header">
              <el-button type="primary" size="small" :icon="Plus" @click="handleAddAction">
                添加动作
              </el-button>
            </div>

            <el-table :data="ruleForm.actions" border style="margin-top: 10px">
              <el-table-column prop="type" label="动作类型" width="150">
                <template #default="{ row }">
                  <el-tag v-if="row.type === ActionType.TASK_DISPATCH" type="primary">任务分发</el-tag>
                  <el-tag v-else-if="row.type === ActionType.RESOURCE_ADJUST" type="warning">资源调整</el-tag>
                  <el-tag v-else-if="row.type === ActionType.ALERT_NOTIFY" type="danger">告警通知</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="description" label="描述" min-width="250" />
              <el-table-column label="操作" width="150">
                <template #default="{ row }">
                  <el-button text type="primary" :icon="Edit" @click="handleEditAction(row)">
                    编辑
                  </el-button>
                  <el-button text type="danger" :icon="Delete" @click="handleDeleteAction(row)">
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="!ruleForm.actions || ruleForm.actions.length === 0" description="暂无动作，请添加" />
          </el-collapse-item>
        </el-collapse>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 条件配置对话框 -->
    <el-dialog
      v-model="conditionDialogVisible"
      title="配置条件"
      width="600px"
      draggable
    >
      <el-form label-width="100px">
        <el-form-item label="参数名称">
          <el-select v-model="currentCondition.parameter" placeholder="请选择" style="width: 100%">
            <el-option label="CPU使用率" value="cpu_usage" />
            <el-option label="内存使用率" value="memory_usage" />
            <el-option label="磁盘使用率" value="disk_usage" />
            <el-option label="网络延迟" value="network_latency" />
            <el-option label="任务队列长度" value="task_queue_length" />
            <el-option label="设备温度" value="temperature" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作符">
          <el-select v-model="currentCondition.operator" placeholder="请选择" style="width: 100%">
            <el-option label="大于 >" value=">" />
            <el-option label="大于等于 >=" value=">=" />
            <el-option label="等于 ==" value="==" />
            <el-option label="小于等于 <=" value="<=" />
            <el-option label="小于 <" value="<" />
            <el-option label="不等于 !=" value="!=" />
          </el-select>
        </el-form-item>
        <el-form-item label="阈值">
          <el-input-number v-model="currentCondition.value" :min="0" :max="100" style="width: 100%" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="currentCondition.description" placeholder="请输入条件描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="conditionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveCondition">确定</el-button>
      </template>
    </el-dialog>

    <!-- 动作配置对话框 -->
    <el-dialog
      v-model="actionDialogVisible"
      title="配置动作"
      width="600px"
      draggable
    >
      <el-form label-width="100px">
        <el-form-item label="动作类型">
          <el-select v-model="currentAction.type" placeholder="请选择" style="width: 100%">
            <el-option label="任务分发" :value="ActionType.TASK_DISPATCH" />
            <el-option label="资源调整" :value="ActionType.RESOURCE_ADJUST" />
            <el-option label="告警通知" :value="ActionType.ALERT_NOTIFY" />
          </el-select>
        </el-form-item>

        <el-form-item v-if="currentAction.type === ActionType.TASK_DISPATCH" label="分发目标">
          <el-input v-model="currentAction.config.target" placeholder="例如：backup_server" />
        </el-form-item>

        <el-form-item v-if="currentAction.type === ActionType.RESOURCE_ADJUST" label="调整策略">
          <el-select v-model="currentAction.config.strategy" placeholder="请选择" style="width: 100%">
            <el-option label="自动扩容" value="scale_up" />
            <el-option label="自动缩容" value="scale_down" />
            <el-option label="资源迁移" value="migrate" />
          </el-select>
        </el-form-item>

        <el-form-item v-if="currentAction.type === ActionType.ALERT_NOTIFY" label="通知方式">
          <el-checkbox-group v-model="currentAction.config.methods">
            <el-checkbox label="email">邮件</el-checkbox>
            <el-checkbox label="sms">短信</el-checkbox>
            <el-checkbox label="webhook">Webhook</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="动作描述">
          <el-input v-model="currentAction.description" placeholder="请输入动作描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="actionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveAction">确定</el-button>
      </template>
    </el-dialog>

    <!-- 策略模板对话框 -->
    <el-dialog
      v-model="templateDialogVisible"
      title="策略模板库"
      width="1000px"
      draggable
    >
      <div class="template-actions">
        <el-button :icon="Upload" @click="handleImportTemplate">导入模板</el-button>
        <el-input
          placeholder="搜索模板"
          :prefix-icon="Search"
          style="width: 300px"
        />
      </div>

      <el-row :gutter="20" class="template-grid">
        <el-col
          v-for="template in templateList"
          :key="template.id"
          :span="8"
        >
          <el-card shadow="hover" class="template-card">
            <div class="template-header">
              <div class="template-title">
                <el-icon v-if="template.isFavorite" color="#F59E0B">
                  <Star />
                </el-icon>
                <span>{{ template.name }}</span>
              </div>
              <el-tag size="small">{{ template.category }}</el-tag>
            </div>
            <p class="template-desc">{{ template.description }}</p>
            <div class="template-stats">
              <span class="usage-count">使用次数: {{ template.usageCount }}</span>
            </div>
            <div class="template-actions-btn">
              <el-button type="primary" size="small" @click="handleApplyTemplate(template)">
                应用模板
              </el-button>
              <el-button size="small" :icon="Download" @click="handleExportTemplate(template)">
                导出
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-dialog>

    <!-- 规则测试抽屉 -->
    <el-drawer
      v-model="testDrawerVisible"
      title="规则测试与验证"
      size="600px"
      destroy-on-close
    >
      <div class="test-container">
        <el-alert
          title="测试说明"
          type="info"
          description="在模拟环境中测试规则逻辑，验证触发条件和执行动作的正确性"
          :closable="false"
          style="margin-bottom: 20px"
        />

        <el-card shadow="never" class="test-config">
          <template #header>
            <span>测试配置</span>
          </template>
          <el-form label-width="100px">
            <el-form-item label="测试设备">
              <el-select v-model="testForm.deviceId" placeholder="选择测试设备" style="width: 100%">
                <el-option label="边缘设备-001" value="device_001" />
                <el-option label="边缘设备-002" value="device_002" />
                <el-option label="云服务器-001" value="server_001" />
              </el-select>
            </el-form-item>
            <el-form-item label="规则名称">
              <el-input :value="ruleForm.name" disabled />
            </el-form-item>
            <el-form-item label="规则类型">
              <el-tag v-if="ruleForm.type" :type="getRuleTypeTag(ruleForm.type).type">
                {{ getRuleTypeTag(ruleForm.type).label }}
              </el-tag>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" class="test-summary" style="margin-top: 20px">
          <template #header>
            <span>规则摘要</span>
          </template>
          <div class="summary-item">
            <span class="label">触发条件:</span>
            <span class="value">{{ ruleForm.trigger?.type === TriggerType.TIME ? '时间触发' : ruleForm.trigger?.type === TriggerType.EVENT ? '事件触发' : '资源触发' }}</span>
          </div>
          <div class="summary-item">
            <span class="label">条件数量:</span>
            <span class="value">{{ ruleForm.conditions?.length || 0 }} 个</span>
          </div>
          <div class="summary-item">
            <span class="label">动作数量:</span>
            <span class="value">{{ ruleForm.actions?.length || 0 }} 个</span>
          </div>
          <div class="summary-item">
            <span class="label">条件关系:</span>
            <span class="value">{{ ruleForm.conditionRelation === ConditionRelation.AND ? '满足所有(AND)' : '满足任一(OR)' }}</span>
          </div>
        </el-card>

        <div class="test-actions" style="margin-top: 20px">
          <el-button
            type="primary"
            :loading="testLoading"
            :icon="VideoPlay"
            @click="handleRunTest"
            style="width: 100%"
          >
            {{ testLoading ? '测试中...' : '开始测试' }}
          </el-button>
        </div>

        <!-- 测试结果 -->
        <el-card v-if="testResult" shadow="never" class="test-result" style="margin-top: 20px">
          <template #header>
            <div class="result-header">
              <span>测试结果</span>
              <el-tag :type="testResult.success ? 'success' : 'danger'">
                {{ testResult.success ? '✓ 验证通过' : '✗ 验证失败' }}
              </el-tag>
            </div>
          </template>

          <div class="result-stats">
            <div class="stat-item">
              <div class="stat-label">条件匹配</div>
              <div class="stat-value">
                {{ testResult.matchedConditions }} / {{ testResult.totalConditions }}
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-label">执行时间</div>
              <div class="stat-value">{{ testResult.performance.executionTime }}ms</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">资源占用</div>
              <div class="stat-value">{{ testResult.performance.resourceUsage }}%</div>
            </div>
          </div>

          <el-divider />

          <div v-if="testResult.executedActions.length > 0" class="executed-actions">
            <h4>执行的动作:</h4>
            <ul>
              <li v-for="(action, index) in testResult.executedActions" :key="index">
                {{ action }}
              </li>
            </ul>
          </div>

          <el-divider />

          <div class="test-logs">
            <h4>执行日志:</h4>
            <div class="log-container">
              <div v-for="(log, index) in testResult.logs" :key="index" class="log-item">
                {{ log }}
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
.scheduling-rules-container {

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);

    .header-title {
      h2 {
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 600;
        color: #303133;
      }

      p {
        margin: 0;
        font-size: 14px;
        color: #909399;
      }
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }
  }

  .main-content {
    display: flex;
    gap: 20px;

    .sidebar {
      width: 260px;
      flex-shrink: 0;

      .category-card {
        margin-bottom: 20px;

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 600;
        }

        .category-list {
          .category-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            margin-bottom: 8px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.3s;

            &:hover {
              background-color: #f5f7fa;
            }

            &.active {
              background-color: #ecf5ff;
              color: #409eff;
            }

            .category-info {
              display: flex;
              align-items: center;
              gap: 8px;

              .category-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
              }

              .category-label {
                font-size: 14px;
              }
            }
          }
        }
      }

      .quick-actions {
        :deep(.el-button) {
          width: 100%;
          justify-content: flex-start;
        }
      }
    }

    .content-area {
      flex: 1;
      min-width: 0;

      .search-card {
        margin-bottom: 20px;
      }

      .table-card {
        .rule-name {
          display: flex;
          align-items: center;
        }

        .pagination-container {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
        }
      }
    }
  }

  .condition-header,
  .action-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .template-actions {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .template-grid {
    margin-top: 20px;

    .template-card {
      margin-bottom: 20px;
      height: 240px;
      display: flex;
      flex-direction: column;

      .template-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        .template-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
          font-size: 16px;
        }
      }

      .template-desc {
        flex: 1;
        font-size: 14px;
        color: #606266;
        line-height: 1.6;
        margin-bottom: 12px;
      }

      .template-stats {
        font-size: 12px;
        color: #909399;
        margin-bottom: 12px;
      }

      .template-actions-btn {
        display: flex;
        gap: 8px;
      }
    }
  }

  .test-container {
    .test-config,
    .test-summary,
    .test-result {
      .summary-item {
        display: flex;
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;

        .label {
          width: 100px;
          color: #909399;
        }

        .value {
          flex: 1;
          color: #303133;
          font-weight: 500;
        }
      }
    }

    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .result-stats {
      display: flex;
      justify-content: space-around;
      margin: 20px 0;

      .stat-item {
        text-align: center;

        .stat-label {
          font-size: 12px;
          color: #909399;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: #409eff;
        }
      }
    }

    .executed-actions {
      h4 {
        margin: 0 0 12px 0;
        font-size: 14px;
        color: #303133;
      }

      ul {
        margin: 0;
        padding-left: 20px;

        li {
          padding: 4px 0;
          color: #606266;
        }
      }
    }

    .test-logs {
      h4 {
        margin: 0 0 12px 0;
        font-size: 14px;
        color: #303133;
      }

      .log-container {
        background-color: #f5f7fa;
        border-radius: 4px;
        padding: 12px;
        max-height: 200px;
        overflow-y: auto;

        .log-item {
          padding: 4px 0;
          font-size: 12px;
          font-family: 'Courier New', monospace;
          color: #606266;
        }
      }
    }
  }

  :deep(.el-collapse-item__header) {
    font-weight: 600;
    font-size: 15px;
  }
}
</style>