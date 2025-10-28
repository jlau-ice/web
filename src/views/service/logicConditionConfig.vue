<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElNotification, ElMessageBox } from 'element-plus'

// ==================== 类型定义 ====================
interface ConditionRule {
  id: string
  name: string
  description: string
  enabled: boolean
  conditions: Condition[]
  logicOperator: 'AND' | 'OR'
  priority: number
  createdAt: string
  updatedAt: string
  executionCount: number
  successRate: number
}

interface Condition {
  id: string
  field: string
  operator: string
  value: string | number | boolean
  fieldType: 'string' | 'number' | 'boolean' | 'date'
}

interface DataField {
  name: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'date'
  description: string
}

interface TestData {
  [key: string]: any
}

interface TestResult {
  passed: boolean
  message: string
  details: ConditionTestDetail[]
}

interface ConditionTestDetail {
  conditionId: string
  field: string
  operator: string
  expectedValue: any
  actualValue: any
  passed: boolean
  message: string
}

// ==================== 状态管理 ====================
const loading = ref(false)
const searchKeyword = ref('')
const showOnlyEnabled = ref(false)

// 规则列表
const ruleList = ref<ConditionRule[]>([])
const selectedRule = ref<ConditionRule | null>(null)

// 对话框状态
const dialogVisible = ref(false)
const dialogTitle = ref('新增条件规则')
const isEditing = ref(false)

// 测试对话框状态
const testDialogVisible = ref(false)
const testData = ref<TestData>({})
const testResult = ref<TestResult | null>(null)
const testLoading = ref(false)

// 导入导出对话框
const importDialogVisible = ref(false)
const importJson = ref('')

// 表单数据
const formData = reactive<Partial<ConditionRule>>({
  name: '',
  description: '',
  enabled: true,
  conditions: [],
  logicOperator: 'AND',
  priority: 0,
})

// 可用的数据字段
const availableFields = ref<DataField[]>([])

// 运算符映射
const operatorMap = {
  string: [
    { value: 'equals', label: '等于' },
    { value: 'notEquals', label: '不等于' },
    { value: 'contains', label: '包含' },
    { value: 'notContains', label: '不包含' },
    { value: 'startsWith', label: '以...开头' },
    { value: 'endsWith', label: '以...结尾' },
    { value: 'isEmpty', label: '为空' },
    { value: 'isNotEmpty', label: '不为空' },
  ],
  number: [
    { value: 'equals', label: '等于' },
    { value: 'notEquals', label: '不等于' },
    { value: 'greaterThan', label: '大于' },
    { value: 'greaterThanOrEqual', label: '大于等于' },
    { value: 'lessThan', label: '小于' },
    { value: 'lessThanOrEqual', label: '小于等于' },
    { value: 'between', label: '在范围内' },
  ],
  boolean: [
    { value: 'equals', label: '等于' },
    { value: 'notEquals', label: '不等于' },
  ],
  date: [
    { value: 'equals', label: '等于' },
    { value: 'before', label: '早于' },
    { value: 'after', label: '晚于' },
    { value: 'between', label: '在范围内' },
  ],
}

// ==================== Mock 数据 ====================
const loadMockData = async () => {
  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 800))

  // 可用字段
  availableFields.value = [
    { name: 'userId', label: '用户ID', type: 'string', description: '用户唯一标识' },
    { name: 'userName', label: '用户名称', type: 'string', description: '用户显示名称' },
    { name: 'userAge', label: '用户年龄', type: 'number', description: '用户年龄（岁）' },
    { name: 'userLevel', label: '用户等级', type: 'number', description: '用户等级（1-10）' },
    { name: 'isVip', label: 'VIP状态', type: 'boolean', description: '是否为VIP用户' },
    { name: 'isActive', label: '激活状态', type: 'boolean', description: '账户是否激活' },
    { name: 'registerDate', label: '注册日期', type: 'date', description: '用户注册时间' },
    { name: 'lastLoginDate', label: '最后登录', type: 'date', description: '最后登录时间' },
    { name: 'orderCount', label: '订单数量', type: 'number', description: '历史订单总数' },
    { name: 'totalAmount', label: '消费金额', type: 'number', description: '总消费金额' },
    { name: 'city', label: '所在城市', type: 'string', description: '用户所在城市' },
    { name: 'membershipType', label: '会员类型', type: 'string', description: '会员类型：普通/黄金/钻石' },
  ]

  // 规则列表
  ruleList.value = [
    {
      id: 'rule_001',
      name: 'VIP用户路由规则',
      description: '将VIP用户路由到高优先级服务队列',
      enabled: true,
      conditions: [
        {
          id: 'cond_001',
          field: 'isVip',
          operator: 'equals',
          value: true,
          fieldType: 'boolean',
        },
        {
          id: 'cond_002',
          field: 'userLevel',
          operator: 'greaterThanOrEqual',
          value: 5,
          fieldType: 'number',
        },
      ],
      logicOperator: 'AND',
      priority: 1,
      createdAt: '2024-01-15 10:30:00',
      updatedAt: '2024-01-20 14:25:00',
      executionCount: 1856,
      successRate: 98.5,
    },
    {
      id: 'rule_002',
      name: '新用户欢迎流程',
      description: '识别新注册用户并触发欢迎流程',
      enabled: true,
      conditions: [
        {
          id: 'cond_003',
          field: 'orderCount',
          operator: 'equals',
          value: 0,
          fieldType: 'number',
        },
      ],
      logicOperator: 'AND',
      priority: 2,
      createdAt: '2024-01-10 09:15:00',
      updatedAt: '2024-01-18 16:45:00',
      executionCount: 3245,
      successRate: 99.2,
    },
    {
      id: 'rule_003',
      name: '高价值客户识别',
      description: '识别高消费或高活跃度客户',
      enabled: true,
      conditions: [
        {
          id: 'cond_004',
          field: 'totalAmount',
          operator: 'greaterThan',
          value: 10000,
          fieldType: 'number',
        },
        {
          id: 'cond_005',
          field: 'orderCount',
          operator: 'greaterThan',
          value: 20,
          fieldType: 'number',
        },
      ],
      logicOperator: 'OR',
      priority: 1,
      createdAt: '2024-01-12 11:20:00',
      updatedAt: '2024-01-22 09:30:00',
      executionCount: 2134,
      successRate: 97.8,
    },
    {
      id: 'rule_004',
      name: '地域分流规则',
      description: '根据用户城市进行地域分流',
      enabled: false,
      conditions: [
        {
          id: 'cond_006',
          field: 'city',
          operator: 'contains',
          value: '北京',
          fieldType: 'string',
        },
        {
          id: 'cond_007',
          field: 'city',
          operator: 'contains',
          value: '上海',
          fieldType: 'string',
        },
      ],
      logicOperator: 'OR',
      priority: 3,
      createdAt: '2024-01-08 15:40:00',
      updatedAt: '2024-01-16 13:15:00',
      executionCount: 1567,
      successRate: 96.3,
    },
    {
      id: 'rule_005',
      name: '异常账户拦截',
      description: '拦截未激活或异常账户',
      enabled: true,
      conditions: [
        {
          id: 'cond_008',
          field: 'isActive',
          operator: 'equals',
          value: false,
          fieldType: 'boolean',
        },
      ],
      logicOperator: 'AND',
      priority: 0,
      createdAt: '2024-01-05 08:00:00',
      updatedAt: '2024-01-25 10:20:00',
      executionCount: 892,
      successRate: 100,
    },
  ]

  loading.value = false
}

// ==================== 计算属性 ====================
const filteredRules = computed(() => {
  let filtered = ruleList.value

  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(
      rule =>
        rule.name.toLowerCase().includes(keyword) ||
        rule.description.toLowerCase().includes(keyword)
    )
  }

  // 启用状态过滤
  if (showOnlyEnabled.value) {
    filtered = filtered.filter(rule => rule.enabled)
  }

  // 按优先级排序
  return filtered.sort((a, b) => a.priority - b.priority)
})

const conditionExpression = computed(() => {
  if (!formData.conditions || formData.conditions.length === 0) {
    return '暂无条件'
  }

  const expressions = formData.conditions.map((cond, index) => {
    const field = availableFields.value.find(f => f.name === cond.field)
    const operator = operatorMap[cond.fieldType]?.find(op => op.value === cond.operator)
    return `(${index + 1}) ${field?.label || cond.field} ${operator?.label || cond.operator} ${cond.value}`
  })

  return expressions.join(` ${formData.logicOperator} `)
})

// ==================== 核心功能 ====================

// 新增规则
const handleAdd = () => {
  isEditing.value = false
  dialogTitle.value = '新增条件规则'
  Object.assign(formData, {
    name: '',
    description: '',
    enabled: true,
    conditions: [],
    logicOperator: 'AND',
    priority: 0,
  })
  dialogVisible.value = true
}

// 编辑规则
const handleEdit = (rule: ConditionRule) => {
  isEditing.value = true
  dialogTitle.value = '编辑条件规则'
  selectedRule.value = rule
  Object.assign(formData, {
    ...rule,
    conditions: JSON.parse(JSON.stringify(rule.conditions)),
  })
  dialogVisible.value = true
}

// 删除规则
const handleDelete = async (rule: ConditionRule) => {
  try {
    await ElMessageBox.confirm(`确定要删除规则 "${rule.name}" 吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await new Promise(resolve => setTimeout(resolve, 300))
    ruleList.value = ruleList.value.filter(r => r.id !== rule.id)
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}

// 切换启用状态
const handleToggleEnabled = async (rule: ConditionRule) => {
  await new Promise(resolve => setTimeout(resolve, 300))
  rule.enabled = !rule.enabled
  ElMessage.success(rule.enabled ? '已启用' : '已禁用')
}

// 保存规则
const handleSave = async () => {
  if (!formData.name) {
    ElMessage.warning('请输入规则名称')
    return
  }

  if (!formData.conditions || formData.conditions.length === 0) {
    ElMessage.warning('请至少添加一个条件')
    return
  }

  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 500))

  if (isEditing.value && selectedRule.value) {
    // 更新
    Object.assign(selectedRule.value, {
      ...formData,
      updatedAt: new Date().toLocaleString('zh-CN'),
    })
    ElMessage.success('更新成功')
  } else {
    // 新增
    const newRule: ConditionRule = {
      id: `rule_${Date.now()}`,
      name: formData.name!,
      description: formData.description || '',
      enabled: formData.enabled!,
      conditions: JSON.parse(JSON.stringify(formData.conditions)),
      logicOperator: formData.logicOperator!,
      priority: formData.priority || 0,
      createdAt: new Date().toLocaleString('zh-CN'),
      updatedAt: new Date().toLocaleString('zh-CN'),
      executionCount: 0,
      successRate: 0,
    }
    ruleList.value.push(newRule)
    ElMessage.success('新增成功')
  }

  loading.value = false
  dialogVisible.value = false
}

// 复制规则
const handleCopy = (rule: ConditionRule) => {
  const newRule: ConditionRule = {
    ...JSON.parse(JSON.stringify(rule)),
    id: `rule_${Date.now()}`,
    name: `${rule.name} (副本)`,
    createdAt: new Date().toLocaleString('zh-CN'),
    updatedAt: new Date().toLocaleString('zh-CN'),
    executionCount: 0,
    successRate: 0,
  }
  ruleList.value.push(newRule)
  ElMessage.success('复制成功')
}

// 添加条件
const addCondition = () => {
  if (!formData.conditions) {
    formData.conditions = []
  }

  const newCondition: Condition = {
    id: `cond_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    field: availableFields.value[0]?.name || '',
    operator: 'equals',
    value: '',
    fieldType: availableFields.value[0]?.type || 'string',
  }

  formData.conditions.push(newCondition)
}

// 删除条件
const removeCondition = (index: number) => {
  formData.conditions?.splice(index, 1)
}

// 字段变化时更新字段类型和运算符
const onFieldChange = (condition: Condition) => {
  const field = availableFields.value.find(f => f.name === condition.field)
  if (field) {
    condition.fieldType = field.type
    condition.operator = operatorMap[field.type]?.[0]?.value || 'equals'
    condition.value = field.type === 'boolean' ? false : ''
  }
}

// 获取字段的运算符列表
const getOperators = (fieldType: string) => {
  return operatorMap[fieldType as keyof typeof operatorMap] || []
}

// 打开测试对话框
const openTestDialog = (rule: ConditionRule) => {
  selectedRule.value = rule
  testDialogVisible.value = true
  testResult.value = null

  // 初始化测试数据
  testData.value = {}
  rule.conditions.forEach(cond => {
    const field = availableFields.value.find(f => f.name === cond.field)
    if (field) {
      if (field.type === 'boolean') {
        testData.value[cond.field] = false
      } else if (field.type === 'number') {
        testData.value[cond.field] = 0
      } else {
        testData.value[cond.field] = ''
      }
    }
  })
}

// 执行测试
const executeTest = async () => {
  if (!selectedRule.value) return

  testLoading.value = true
  await new Promise(resolve => setTimeout(resolve, 800))

  const details: ConditionTestDetail[] = []
  let overallPassed = true

  // 逐个测试条件
  for (const condition of selectedRule.value.conditions) {
    const actualValue = testData.value[condition.field]
    let passed = false
    let message = ''

    // 执行条件判断
    switch (condition.operator) {
      case 'equals':
        passed = actualValue == condition.value
        message = passed ? '值相等' : `期望 ${condition.value}，实际 ${actualValue}`
        break
      case 'notEquals':
        passed = actualValue != condition.value
        message = passed ? '值不相等' : `不应等于 ${condition.value}`
        break
      case 'greaterThan':
        passed = Number(actualValue) > Number(condition.value)
        message = passed ? `${actualValue} > ${condition.value}` : `${actualValue} 不大于 ${condition.value}`
        break
      case 'greaterThanOrEqual':
        passed = Number(actualValue) >= Number(condition.value)
        message = passed ? `${actualValue} >= ${condition.value}` : `${actualValue} 小于 ${condition.value}`
        break
      case 'lessThan':
        passed = Number(actualValue) < Number(condition.value)
        message = passed ? `${actualValue} < ${condition.value}` : `${actualValue} 不小于 ${condition.value}`
        break
      case 'lessThanOrEqual':
        passed = Number(actualValue) <= Number(condition.value)
        message = passed ? `${actualValue} <= ${condition.value}` : `${actualValue} 大于 ${condition.value}`
        break
      case 'contains':
        passed = String(actualValue).includes(String(condition.value))
        message = passed ? '包含目标字符串' : `不包含 "${condition.value}"`
        break
      case 'notContains':
        passed = !String(actualValue).includes(String(condition.value))
        message = passed ? '不包含目标字符串' : `包含了不应存在的 "${condition.value}"`
        break
      case 'startsWith':
        passed = String(actualValue).startsWith(String(condition.value))
        message = passed ? '以目标字符串开头' : `不以 "${condition.value}" 开头`
        break
      case 'endsWith':
        passed = String(actualValue).endsWith(String(condition.value))
        message = passed ? '以目标字符串结尾' : `不以 "${condition.value}" 结尾`
        break
      case 'isEmpty':
        passed = !actualValue || actualValue === ''
        message = passed ? '值为空' : '值不为空'
        break
      case 'isNotEmpty':
        passed = !!actualValue && actualValue !== ''
        message = passed ? '值不为空' : '值为空'
        break
      default:
        passed = false
        message = '未知运算符'
    }

    const field = availableFields.value.find(f => f.name === condition.field)
    details.push({
      conditionId: condition.id,
      field: field?.label || condition.field,
      operator: getOperators(condition.fieldType).find(op => op.value === condition.operator)?.label || condition.operator,
      expectedValue: condition.value,
      actualValue,
      passed,
      message,
    })

    // 根据逻辑运算符更新总体结果
    if (selectedRule.value.logicOperator === 'AND') {
      overallPassed = overallPassed && passed
    } else {
      overallPassed = overallPassed || passed
    }
  }

  // 如果是OR运算符，需要重新计算
  if (selectedRule.value.logicOperator === 'OR') {
    overallPassed = details.some(d => d.passed)
  }

  testResult.value = {
    passed: overallPassed,
    message: overallPassed
      ? '✅ 测试通过！所有条件均满足规则要求'
      : '❌ 测试失败！条件不满足规则要求',
    details,
  }

  testLoading.value = false

  ElNotification({
    title: overallPassed ? '测试通过' : '测试失败',
    message: testResult.value.message,
    type: overallPassed ? 'success' : 'error',
  })
}

// 导出配置
const exportConfig = () => {
  const config = {
    version: '1.0',
    exportTime: new Date().toISOString(),
    rules: ruleList.value,
  }

  const blob = new Blob([JSON.stringify(config, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `logic_rules_${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)

  ElMessage.success('导出成功')
}

// 打开导入对话框
const openImportDialog = () => {
  importJson.value = ''
  importDialogVisible.value = true
}

// 导入配置
const importConfig = () => {
  try {
    const data = JSON.parse(importJson.value)
    if (!data.rules || !Array.isArray(data.rules)) {
      throw new Error('无效的配置格式')
    }

    ruleList.value = data.rules
    importDialogVisible.value = false
    ElMessage.success(`成功导入 ${data.rules.length} 条规则`)
  } catch (err: any) {
    ElMessage.error('导入失败：' + err.message)
  }
}

// 从文件导入
const importFromFile = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e: any) => {
    const file = e.target?.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (!data.rules || !Array.isArray(data.rules)) {
          throw new Error('无效的配置格式')
        }
        ruleList.value = data.rules
        ElMessage.success(`成功导入 ${data.rules.length} 条规则`)
      } catch (err: any) {
        ElMessage.error('导入失败：' + err.message)
      }
    }
    reader.readAsText(file)
  }
  input.click()
}

// 清空所有规则
const clearAllRules = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有规则吗？此操作不可恢复！',
      '危险操作',
      {
        confirmButtonText: '确定清空',
        cancelButtonText: '取消',
        type: 'error',
      }
    )

    ruleList.value = []
    ElMessage.success('已清空所有规则')
  } catch {
    // 用户取消
  }
}

// ==================== 生命周期 ====================
onMounted(async () => {
  await loadMockData()
})
</script>

<template>
    <div class="logic-condition-config" v-loading="loading">
        <!-- 顶部工具栏 -->
        <el-card shadow="never" class="toolbar-card">
            <div class="toolbar">
                <div class="toolbar-left">
                    <h2 class="title">
                        <el-icon>
                            <Operation />
                        </el-icon>
                        逻辑条件配置
                    </h2>
                    <span class="subtitle">定义服务执行过程中的分支逻辑和条件判断规则</span>
                </div>
                <div class="toolbar-right">
                    <el-button type="primary" :icon="'Plus'" @click="handleAdd">
                        新增规则
                    </el-button>
                    <el-button :icon="'Upload'" @click="importFromFile">导入配置</el-button>
                    <el-button :icon="'Download'" @click="exportConfig">导出配置</el-button>
                </div>
            </div>
        </el-card>
    
        <!-- 主体内容 -->
        <div class="main-content">
            <!-- 规则列表区域 -->
            <el-card shadow="never" class="rules-card">
                <template #header>
                    <div class="card-header">
                        <div class="header-left">
                            <el-icon>
                                <List />
                            </el-icon>
                            <span>条件规则列表</span>
                            <el-tag type="info" size="small" round>{{ filteredRules.length }} 条</el-tag>
                        </div>
                        <div class="header-right">
                            <el-input v-model="searchKeyword" placeholder="搜索规则名称或描述..." :prefix-icon="'Search'" clearable
                                style="width: 260px; margin-right: 12px" />
                            <el-checkbox v-model="showOnlyEnabled" label="只显示启用的" border />
                        </div>
                    </div>
                </template>
    
                <el-table :data="filteredRules" stripe border style="width: 100%"
                    :header-cell-style="{ background: '#f5f7fa', color: '#606266' }">
                    <el-table-column type="index" label="序号" width="60" align="center" />
    
                    <el-table-column prop="name" label="规则名称" >
                        <template #default="{ row }">
                            <div class="rule-name">
                                <el-tag :type="row.enabled ? 'success' : 'info'" size="small" effect="dark"
                                    style="margin-right: 8px">
                                    {{ row.enabled ? '启用' : '禁用' }}
                                </el-tag>
                                <strong>{{ row.name }}</strong>
                            </div>
                        </template>
                    </el-table-column>
    
                    <el-table-column prop="description" label="规则描述"  show-overflow-tooltip />
    
                    <el-table-column label="条件数量"  align="center">
                        <template #default="{ row }">
                            <el-tag type="primary" size="small">
                                {{ row.conditions.length }} 个
                            </el-tag>
                        </template>
                    </el-table-column>
    
                    <el-table-column label="逻辑关系"  align="center">
                        <template #default="{ row }">
                            <el-tag :type="row.logicOperator === 'AND' ? 'warning' : 'success'" effect="plain">
                                {{ row.logicOperator }}
                            </el-tag>
                        </template>
                    </el-table-column>
    
                    <el-table-column prop="priority" label="优先级"  align="center" sortable>
                        <template #default="{ row }">
                            <el-tag :type="row.priority === 0 ? 'danger' : row.priority === 1 ? 'warning' : 'info'">
                                {{ row.priority }}
                            </el-tag>
                        </template>
                    </el-table-column>
    
                    <el-table-column label="执行统计" align="center">
                        <template #default="{ row }">
                            <div class="stats">
                                <div class="stat-item">
                                    <el-icon>
                                        <TrendCharts />
                                    </el-icon>
                                    <span>{{ row.executionCount }} 次</span>
                                </div>
                                <div class="stat-item">
                                    <el-icon>
                                        <CircleCheck />
                                    </el-icon>
                                    <span>{{ row.successRate }}%</span>
                                </div>
                            </div>
                        </template>
                    </el-table-column>
    
                    <el-table-column prop="updatedAt" label="更新时间" align="center" />
    
                    <el-table-column label="操作" width="450" fixed="right" align="center">
                        <template #default="{ row }">
                            <el-button size="small" :type="row.enabled ? 'warning' : 'success'"
                                :icon="row.enabled ? 'VideoPause' : 'VideoPlay'" @click="handleToggleEnabled(row)">
                                {{ row.enabled ? '禁用' : '启用' }}
                            </el-button>
                            <el-button size="small" type="primary" :icon="'Monitor'" @click="openTestDialog(row)">
                                测试
                            </el-button>
                            <el-button size="small" :icon="'Edit'" @click="handleEdit(row)">
                                编辑
                            </el-button>
                            <el-button size="small" :icon="'CopyDocument'" @click="handleCopy(row)">
                                复制
                            </el-button>
                            <el-button size="small" type="danger" :icon="'Delete'" @click="handleDelete(row)">
                                删除
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
    
                <el-empty v-if="filteredRules.length === 0" description="暂无规则数据" :image-size="120" />
            </el-card>
        </div>
    
        <!-- 新增/编辑对话框 -->
        <el-dialog v-model="dialogVisible" :title="dialogTitle" width="900px" :close-on-click-modal="false"
            destroy-on-close>
            <el-form :model="formData" label-width="120px" label-position="right">
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="规则名称" required>
                            <el-input v-model="formData.name" placeholder="请输入规则名称" maxlength="50" show-word-limit />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="优先级">
                            <el-input-number v-model="formData.priority" :min="0" :max="10" style="width: 100%" />
                            <div class="form-tip">数值越小优先级越高</div>
                        </el-form-item>
                    </el-col>
                </el-row>
    
                <el-form-item label="规则描述">
                    <el-input v-model="formData.description" type="textarea" :rows="2" placeholder="请输入规则描述" maxlength="200"
                        show-word-limit />
                </el-form-item>
    
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="启用状态">
                            <el-switch v-model="formData.enabled" active-text="启用" inactive-text="禁用" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="逻辑关系">
                            <el-radio-group v-model="formData.logicOperator">
                                <el-radio-button label="AND">与 (AND)</el-radio-button>
                                <el-radio-button label="OR">或 (OR)</el-radio-button>
                            </el-radio-group>
                            <div class="form-tip">
                                {{ formData.logicOperator === 'AND' ? '所有条件都满足' : '任一条件满足即可' }}
                            </div>
                        </el-form-item>
                    </el-col>
                </el-row>
    
                <el-divider content-position="left">
                    <el-icon>
                        <Filter />
                    </el-icon>
                    条件配置
                </el-divider>
    
                <!-- 条件列表 -->
                <div class="conditions-builder">
                    <div v-for="(condition, index) in formData.conditions" :key="condition.id" class="condition-item">
                        <div class="condition-index">
                            <el-tag type="primary" effect="dark" round>{{ index + 1 }}</el-tag>
                        </div>
    
                        <div class="condition-form">
                            <el-row :gutter="12">
                                <el-col :span="7">
                                    <el-select v-model="condition.field" placeholder="选择字段"
                                        @change="onFieldChange(condition)" style="width: 100%">
                                        <el-option v-for="field in availableFields" :key="field.name" :label="field.label"
                                            :value="field.name">
                                            <div class="field-option">
                                                <span>{{ field.label }}</span>
                                                <el-tag size="small" type="info">{{ field.type }}</el-tag>
                                            </div>
                                        </el-option>
                                    </el-select>
                                </el-col>
    
                                <el-col :span="6">
                                    <el-select v-model="condition.operator" placeholder="选择运算符" style="width: 100%">
                                        <el-option v-for="op in getOperators(condition.fieldType)" :key="op.value"
                                            :label="op.label" :value="op.value" />
                                    </el-select>
                                </el-col>
    
                                <el-col :span="9">
                                    <!-- 字符串输入 -->
                                    <el-input v-if="condition.fieldType === 'string'" v-model="condition.value"
                                        placeholder="输入比较值" />
                                    <!-- 数字输入 -->
                                    <el-input-number v-else-if="condition.fieldType === 'number'" v-model="condition.value"
                                        placeholder="输入数值" style="width: 100%" />
                                    <!-- 布尔选择 -->
                                    <el-select v-else-if="condition.fieldType === 'boolean'" v-model="condition.value"
                                        style="width: 100%">
                                        <el-option label="是 (true)" :value="true" />
                                        <el-option label="否 (false)" :value="false" />
                                    </el-select>
                                    <!-- 日期选择 -->
                                    <el-date-picker v-else-if="condition.fieldType === 'date'" v-model="condition.value"
                                        type="date" placeholder="选择日期" style="width: 100%" />
                                </el-col>
    
                                <el-col :span="2">
                                    <el-button type="danger" :icon="'Delete'" circle @click="removeCondition(index)" />
                                </el-col>
                            </el-row>
                        </div>
    
                        <!-- 逻辑运算符连接符 -->
                        <div v-if="index < (formData.conditions?.length || 0) - 1" class="condition-connector">
                            <el-tag :type="formData.logicOperator === 'AND' ? 'warning' : 'success'" effect="dark">
                                {{ formData.logicOperator }}
                            </el-tag>
                        </div>
                    </div>
    
                    <el-button type="primary" :icon="'Plus'" @click="addCondition" style="width: 100%; margin-top: 12px"
                        plain dashed>
                        添加条件
                    </el-button>
                </div>
    
                <el-divider content-position="left">
                    <el-icon>
                        <View />
                    </el-icon>
                    条件表达式预览
                </el-divider>
    
                <el-alert :title="conditionExpression" type="info" :closable="false" show-icon>
                    <template #default>
                        <div class="expression-preview">
                            {{ conditionExpression }}
                        </div>
                    </template>
                </el-alert>
            </el-form>
    
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleSave" :loading="loading">
                    保存规则
                </el-button>
            </template>
        </el-dialog>
    
        <!-- 条件测试对话框 -->
        <el-dialog v-model="testDialogVisible" title="条件测试" width="800px" :close-on-click-modal="false" destroy-on-close>
            <div v-if="selectedRule">
                <el-alert :title="`测试规则: ${selectedRule.name}`" type="info" :closable="false" show-icon
                    style="margin-bottom: 20px">
                    <template #default>
                        <div>{{ selectedRule.description }}</div>
                        <div style="margin-top: 8px">
                            <el-tag type="primary" size="small">
                                {{ selectedRule.conditions.length }} 个条件
                            </el-tag>
                            <el-tag :type="selectedRule.logicOperator === 'AND' ? 'warning' : 'success'" size="small"
                                style="margin-left: 8px">
                                {{ selectedRule.logicOperator }} 关系
                            </el-tag>
                        </div>
                    </template>
                </el-alert>
    
                <el-divider content-position="left">
                    <el-icon>
                        <EditPen />
                    </el-icon>
                    测试数据输入
                </el-divider>
    
                <el-form label-width="120px" label-position="right">
                    <el-form-item v-for="condition in selectedRule.conditions" :key="condition.id"
                        :label="availableFields.find(f => f.name === condition.field)?.label || condition.field">
                        <!-- 字符串输入 -->
                        <el-input v-if="condition.fieldType === 'string'" v-model="testData[condition.field]"
                            placeholder="输入测试值" />
                        <!-- 数字输入 -->
                        <el-input-number v-else-if="condition.fieldType === 'number'" v-model="testData[condition.field]"
                            style="width: 100%" />
                        <!-- 布尔选择 -->
                        <el-switch v-else-if="condition.fieldType === 'boolean'" v-model="testData[condition.field]"
                            active-text="是" inactive-text="否" />
                        <!-- 日期选择 -->
                        <el-date-picker v-else-if="condition.fieldType === 'date'" v-model="testData[condition.field]"
                            type="date" placeholder="选择日期" style="width: 100%" />
                    </el-form-item>
                </el-form>
    
                <el-divider content-position="left">
                    <el-icon>
                        <DataAnalysis />
                    </el-icon>
                    测试结果
                </el-divider>
    
                <div v-if="testResult" class="test-result">
                    <el-alert :title="testResult.message" :type="testResult.passed ? 'success' : 'error'" :closable="false"
                        show-icon style="margin-bottom: 16px" />
    
                    <el-table :data="testResult.details" border stripe>
                        <el-table-column type="index" label="序号" width="60" align="center" />
                        <el-table-column prop="field" label="字段" width="120" />
                        <el-table-column prop="operator" label="运算符" width="120" align="center" />
                        <el-table-column prop="expectedValue" label="期望值" width="120" align="center">
                            <template #default="{ row }">
                                <el-tag size="small">{{ row.expectedValue }}</el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="actualValue" label="实际值" width="120" align="center">
                            <template #default="{ row }">
                                <el-tag size="small" type="info">{{ row.actualValue }}</el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="passed" label="结果" width="80" align="center">
                            <template #default="{ row }">
                                <el-tag :type="row.passed ? 'success' : 'danger'" effect="dark">
                                    {{ row.passed ? '通过' : '失败' }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="message" label="详细信息" min-width="180" show-overflow-tooltip />
                    </el-table>
                </div>
    
                <el-empty v-else description="点击下方按钮开始测试" :image-size="100" />
            </div>
    
            <template #footer>
                <el-button @click="testDialogVisible = false">关闭</el-button>
                <el-button type="primary" :icon="'VideoPlay'" @click="executeTest" :loading="testLoading">
                    执行测试
                </el-button>
            </template>
        </el-dialog>
    </div>
</template>

<style scoped lang="scss">
.logic-condition-config {

    // 工具栏卡片
    .toolbar-card {
        margin-bottom: 20px;
        border-radius: 12px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

        .toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;

            .toolbar-left {
                .title {
                    margin: 0 0 6px 0;
                    font-size: 22px;
                    font-weight: 700;
                    color: #409eff;
                    display: flex;
                    align-items: center;
                    gap: 10px;

                    .el-icon {
                        color: #409eff;
                        font-size: 24px;
                    }
                }

                .subtitle {
                    font-size: 13px;
                    color: #909399;
                }
            }

            .toolbar-right {
                display: flex;
                gap: 12px;
            }
        }
    }

    // 主体内容
    .main-content {
        .rules-card {
            border-radius: 12px;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

            .card-header {
                display: flex;
                justify-content: space-between;
                align-items: center;

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-weight: 600;
                    font-size: 16px;
                }

                .header-right {
                    display: flex;
                    align-items: center;
                }
            }

            .rule-name {
                display: flex;
                align-items: center;
            }

            .stats {
                display: flex;
                flex-direction: column;
                gap: 4px;

                .stat-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                    color: #606266;

                    .el-icon {
                        color: #409eff;
                    }
                }
            }
        }
    }

    // 条件构建器
    .conditions-builder {
        background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
        padding: 20px;
        border-radius: 12px;
        border: 2px dashed #e4e7ed;
        min-height: 200px;

        .condition-item {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 16px;
            padding: 16px;
            background: #ffffff;
            border-radius: 10px;
            border: 1px solid #e4e7ed;
            transition: all 0.3s;
            position: relative;

            &:hover {
                box-shadow: 0 4px 16px rgba(64, 158, 255, 0.15);
                border-color: #409eff;
            }

            .condition-index {
                position: absolute;
                top: -12px;
                left: 16px;
                z-index: 1;
            }

            .condition-form {
                margin-top: 8px;
            }

            .condition-connector {
                display: flex;
                justify-content: center;
                align-items: center;
                margin: 8px 0;
            }
        }

        .field-option {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
        }
    }

    // 表达式预览
    .expression-preview {
        font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
        font-size: 14px;
        line-height: 1.8;
        padding: 12px;
        background: #f5f7fa;
        border-radius: 6px;
        margin-top: 8px;
        color: #303133;
        word-break: break-word;
    }

    // 表单提示
    .form-tip {
        font-size: 12px;
        color: #909399;
        margin-top: 4px;
    }

    // 测试结果
    .test-result {
        .el-alert {
            font-size: 15px;
            font-weight: 600;
        }
    }
}

// 全局样式调整
:deep(.el-table) {
    font-size: 14px;

    .el-table__header th {
        font-weight: 600;
    }
}

:deep(.el-dialog) {
    border-radius: 12px;
    overflow: hidden;

    .el-dialog__header {
        background: #409eff;
        color: #ffffff;
        padding: 20px;
        margin-right: 0;

        .el-dialog__title {
            color: #ffffff;
            font-size: 18px;
            font-weight: 700;
        }

        .el-dialog__headerbtn .el-dialog__close {
            color: #ffffff;
        }
    }

    .el-dialog__body {
        padding: 24px;
    }
}

// 使用默认的主按钮样式
</style>
