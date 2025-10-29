<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'

// 定义接口类型
interface RuleType {
  id: string
  name: string
  icon: string
  color: string
  count: number
}

interface RuleCondition {
  id: string
  field: string
  operator: string
  value: string
  logic?: 'AND' | 'OR'
}

interface RuleAction {
  id: string
  type: string
  config: Record<string, any>
}

interface RuleParam {
  id: string
  name: string
  type: string
  required: boolean
  description: string
}

interface RuleLogicNode {
  id: string
  type: 'condition' | 'action' | 'branch' | 'loop'
  label: string
  config: Record<string, any>
  children?: RuleLogicNode[]
}

interface RuleVersion {
  id: string
  version: string
  createTime: string
  creator: string
  description: string
  status: string
}

interface BusinessRule {
  id: string
  name: string
  type: string
  typeLabel: string
  description: string
  processes: string[]
  status: 'enabled' | 'disabled' | 'testing' | 'expired'
  statusLabel: string
  priority: number
  version: string
  createTime: string
  updateTime: string
  creator: string
  conditions: RuleCondition[]
  actions: RuleAction[]
  inputParams: RuleParam[]
  outputParams: RuleParam[]
  logicTree: RuleLogicNode[]
  effectiveTime?: string
  expiryTime?: string
  dependencies: string[]
  referenceCount: number
}

// 状态管理
const loading = ref(false)
const activeCategory = ref('all')
const searchText = ref('')
const filterType = ref('')
const filterStatus = ref('')

// 规则分类
const ruleCategories = ref<RuleType[]>([
  { id: 'all', name: '全部规则', icon: 'List', color: '#409EFF', count: 0 },
  { id: 'approval', name: '审批规则', icon: 'CircleCheck', color: '#E6A23C', count: 0 },
  { id: 'calculation', name: '计算规则', icon: 'Operation', color: '#67C23A', count: 0 },
  { id: 'validation', name: '验证规则', icon: 'Select', color: '#409EFF', count: 0 },
  { id: 'notification', name: '通知规则', icon: 'Bell', color: '#9B59B6', count: 0 }
])

// 规则列表
const ruleList = ref<BusinessRule[]>([])
const currentRule = ref<BusinessRule | null>(null)

// 对话框状态
const ruleDialogVisible = ref(false)
const logicDesignerVisible = ref(false)
const versionDialogVisible = ref(false)
const templateDialogVisible = ref(false)
const importExportDialogVisible = ref(false)

// 表单引用
const ruleFormRef = ref<FormInstance>()

// 规则表单
const ruleForm = reactive({
  name: '',
  type: '',
  description: '',
  version: '1.0.0',
  priority: 1,
  processes: [] as string[],
  effectiveTime: '',
  expiryTime: '',
  inputParams: [] as RuleParam[],
  outputParams: [] as RuleParam[],
  conditions: [] as RuleCondition[],
  actions: [] as RuleAction[]
})

// 表单验证规则
const ruleFormRules = {
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择规则类型', trigger: 'change' }],
  description: [{ required: true, message: '请输入规则描述', trigger: 'blur' }]
}

// 规则类型选项
const ruleTypeOptions = [
  { label: '审批规则', value: 'approval', color: '#E6A23C' },
  { label: '计算规则', value: 'calculation', color: '#67C23A' },
  { label: '验证规则', value: 'validation', color: '#409EFF' },
  { label: '通知规则', value: 'notification', color: '#9B59B6' }
]

// 规则状态选项
const statusOptions = [
  { label: '启用', value: 'enabled', color: 'success' },
  { label: '禁用', value: 'disabled', color: 'info' },
  { label: '测试中', value: 'testing', color: 'primary' },
  { label: '已过期', value: 'expired', color: 'danger' }
]

// 运算符选项
const operatorOptions = [
  { label: '等于', value: 'eq' },
  { label: '不等于', value: 'ne' },
  { label: '大于', value: 'gt' },
  { label: '小于', value: 'lt' },
  { label: '包含', value: 'contains' },
  { label: '不包含', value: 'notContains' }
]

// 参数类型选项
const paramTypeOptions = [
  { label: '字符串', value: 'string' },
  { label: '数字', value: 'number' },
  { label: '布尔', value: 'boolean' },
  { label: '日期', value: 'date' },
  { label: '对象', value: 'object' },
  { label: '数组', value: 'array' }
]

// 规则逻辑树
const logicTree = ref<RuleLogicNode[]>([])

// 版本历史
const versionHistory = ref<RuleVersion[]>([])

// 规则模板
const ruleTemplates = ref([
  {
    id: '1',
    name: '金额审批模板',
    type: 'approval',
    description: '根据金额大小自动设置审批流程',
    useCount: 125
  },
  {
    id: '2',
    name: '折扣计算模板',
    type: 'calculation',
    description: '根据客户等级和订单金额计算折扣',
    useCount: 89
  },
  {
    id: '3',
    name: '表单验证模板',
    type: 'validation',
    description: '常用表单字段验证规则',
    useCount: 156
  },
  {
    id: '4',
    name: '状态变更通知模板',
    type: 'notification',
    description: '流程状态变更时发送通知',
    useCount: 203
  }
])

// 计算属性：过滤后的规则列表
const filteredRuleList = computed(() => {
  let list = ruleList.value

  // 按分类筛选
  if (activeCategory.value !== 'all') {
    list = list.filter(rule => rule.type === activeCategory.value)
  }

  // 按类型筛选
  if (filterType.value) {
    list = list.filter(rule => rule.type === filterType.value)
  }

  // 按状态筛选
  if (filterStatus.value) {
    list = list.filter(rule => rule.status === filterStatus.value)
  }

  // 按名称搜索
  if (searchText.value) {
    list = list.filter(rule =>
      rule.name.toLowerCase().includes(searchText.value.toLowerCase())
    )
  }

  return list
})

// Mock 数据加载
const loadRuleList = () => {
  loading.value = true
  setTimeout(() => {
    ruleList.value = [
      {
        id: '1',
        name: '请假天数审批规则',
        type: 'approval',
        typeLabel: '审批规则',
        description: '根据请假天数自动分配审批人',
        processes: ['请假流程', '出差流程'],
        status: 'enabled',
        statusLabel: '启用',
        priority: 1,
        version: '2.1.0',
        createTime: '2024-01-15 10:30:00',
        updateTime: '2024-10-20 14:20:00',
        creator: '张三',
        conditions: [
          { id: '1', field: 'days', operator: 'gt', value: '3', logic: 'AND' },
          { id: '2', field: 'type', operator: 'eq', value: '事假' }
        ],
        actions: [
          { id: '1', type: 'setApprover', config: { approver: 'manager' } }
        ],
        inputParams: [
          { id: '1', name: 'days', type: 'number', required: true, description: '请假天数' },
          { id: '2', name: 'type', type: 'string', required: true, description: '请假类型' }
        ],
        outputParams: [
          { id: '1', name: 'approver', type: 'string', required: true, description: '审批人' }
        ],
        logicTree: [],
        effectiveTime: '2024-01-15 00:00:00',
        dependencies: [],
        referenceCount: 25
      },
      {
        id: '2',
        name: '订单折扣计算规则',
        type: 'calculation',
        typeLabel: '计算规则',
        description: '根据订单金额和客户等级计算折扣',
        processes: ['销售订单流程'],
        status: 'enabled',
        statusLabel: '启用',
        priority: 2,
        version: '1.5.0',
        createTime: '2024-02-10 09:15:00',
        updateTime: '2024-10-25 16:45:00',
        creator: '李四',
        conditions: [
          { id: '1', field: 'amount', operator: 'gt', value: '10000', logic: 'AND' },
          { id: '2', field: 'vipLevel', operator: 'eq', value: 'gold' }
        ],
        actions: [
          { id: '1', type: 'calculate', config: { formula: 'amount * 0.85' } }
        ],
        inputParams: [
          { id: '1', name: 'amount', type: 'number', required: true, description: '订单金额' },
          { id: '2', name: 'vipLevel', type: 'string', required: true, description: '客户等级' }
        ],
        outputParams: [
          { id: '1', name: 'finalAmount', type: 'number', required: true, description: '最终金额' },
          { id: '2', name: 'discount', type: 'number', required: true, description: '折扣率' }
        ],
        logicTree: [],
        dependencies: [],
        referenceCount: 48
      },
      {
        id: '3',
        name: '合同金额验证规则',
        type: 'validation',
        typeLabel: '验证规则',
        description: '验证合同金额是否在合理范围内',
        processes: ['合同审批流程'],
        status: 'testing',
        statusLabel: '测试中',
        priority: 1,
        version: '1.0.0',
        createTime: '2024-10-01 11:20:00',
        updateTime: '2024-10-28 10:30:00',
        creator: '王五',
        conditions: [
          { id: '1', field: 'amount', operator: 'gt', value: '0', logic: 'AND' },
          { id: '2', field: 'amount', operator: 'lt', value: '10000000' }
        ],
        actions: [
          { id: '1', type: 'validate', config: { errorMessage: '金额超出范围' } }
        ],
        inputParams: [
          { id: '1', name: 'amount', type: 'number', required: true, description: '合同金额' }
        ],
        outputParams: [
          { id: '1', name: 'valid', type: 'boolean', required: true, description: '验证结果' }
        ],
        logicTree: [],
        effectiveTime: '2024-11-01 00:00:00',
        dependencies: [],
        referenceCount: 12
      },
      {
        id: '4',
        name: '流程超时通知规则',
        type: 'notification',
        typeLabel: '通知规则',
        description: '流程超时时发送通知给相关人员',
        processes: ['所有流程'],
        status: 'enabled',
        statusLabel: '启用',
        priority: 3,
        version: '3.0.0',
        createTime: '2023-12-01 08:00:00',
        updateTime: '2024-10-15 09:30:00',
        creator: '赵六',
        conditions: [
          { id: '1', field: 'duration', operator: 'gt', value: '24', logic: 'AND' },
          { id: '2', field: 'status', operator: 'eq', value: 'pending' }
        ],
        actions: [
          { id: '1', type: 'sendNotification', config: { channels: ['email', 'sms'] } }
        ],
        inputParams: [
          { id: '1', name: 'duration', type: 'number', required: true, description: '持续时长（小时）' },
          { id: '2', name: 'status', type: 'string', required: true, description: '流程状态' }
        ],
        outputParams: [],
        logicTree: [],
        dependencies: [],
        referenceCount: 156
      },
      {
        id: '5',
        name: '历史审批规则（已过期）',
        type: 'approval',
        typeLabel: '审批规则',
        description: '2023年使用的审批规则',
        processes: ['请假流程'],
        status: 'expired',
        statusLabel: '已过期',
        priority: 1,
        version: '1.0.0',
        createTime: '2023-01-01 00:00:00',
        updateTime: '2023-12-31 23:59:59',
        creator: '张三',
        conditions: [],
        actions: [],
        inputParams: [],
        outputParams: [],
        logicTree: [],
        effectiveTime: '2023-01-01 00:00:00',
        expiryTime: '2023-12-31 23:59:59',
        dependencies: [],
        referenceCount: 0
      }
    ]

    // 更新分类计数
    updateCategoryCount()
    loading.value = false
  }, 500)
}

// 更新分类计数
const updateCategoryCount = () => {
  ruleCategories.value[0].count = ruleList.value.length
  ruleCategories.value[1].count = ruleList.value.filter(r => r.type === 'approval').length
  ruleCategories.value[2].count = ruleList.value.filter(r => r.type === 'calculation').length
  ruleCategories.value[3].count = ruleList.value.filter(r => r.type === 'validation').length
  ruleCategories.value[4].count = ruleList.value.filter(r => r.type === 'notification').length
}

// 切换分类
const handleCategoryChange = (categoryId: string) => {
  activeCategory.value = categoryId
}

// 新增规则
const handleAddRule = () => {
  currentRule.value = null
  resetRuleForm()
  ruleDialogVisible.value = true
}

// 编辑规则
const handleEditRule = (rule: BusinessRule) => {
  currentRule.value = rule
  Object.assign(ruleForm, {
    name: rule.name,
    type: rule.type,
    description: rule.description,
    version: rule.version,
    priority: rule.priority,
    processes: [...rule.processes],
    effectiveTime: rule.effectiveTime || '',
    expiryTime: rule.expiryTime || '',
    inputParams: [...rule.inputParams],
    outputParams: [...rule.outputParams],
    conditions: [...rule.conditions],
    actions: [...rule.actions]
  })
  ruleDialogVisible.value = true
}

// 保存规则
const handleSaveRule = async () => {
  if (!ruleFormRef.value) return

  await ruleFormRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      setTimeout(() => {
        if (currentRule.value) {
          // 更新规则
          const index = ruleList.value.findIndex(r => r.id === currentRule.value!.id)
          if (index !== -1) {
            ruleList.value[index] = {
              ...ruleList.value[index],
              ...ruleForm,
              typeLabel: ruleTypeOptions.find(t => t.value === ruleForm.type)?.label || '',
              updateTime: new Date().toLocaleString('zh-CN', { hour12: false })
            }
          }
          ElMessage.success('规则更新成功')
        } else {
          // 新增规则
          const newRule: BusinessRule = {
            id: String(Date.now()),
            ...ruleForm,
            typeLabel: ruleTypeOptions.find(t => t.value === ruleForm.type)?.label || '',
            status: 'testing',
            statusLabel: '测试中',
            createTime: new Date().toLocaleString('zh-CN', { hour12: false }),
            updateTime: new Date().toLocaleString('zh-CN', { hour12: false }),
            creator: '当前用户',
            logicTree: [],
            dependencies: [],
            referenceCount: 0
          }
          ruleList.value.unshift(newRule)
          ElMessage.success('规则创建成功')
        }
        updateCategoryCount()
        ruleDialogVisible.value = false
        loading.value = false
      }, 500)
    }
  })
}

// 删除规则
const handleDeleteRule = (rule: BusinessRule) => {
  if (rule.referenceCount > 0) {
    ElMessage.warning(`该规则被 ${rule.referenceCount} 个流程引用，无法删除`)
    return
  }

  ElMessageBox.confirm('确定要删除此规则吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    loading.value = true
    setTimeout(() => {
      const index = ruleList.value.findIndex(r => r.id === rule.id)
      if (index !== -1) {
        ruleList.value.splice(index, 1)
      }
      updateCategoryCount()
      loading.value = false
      ElMessage.success('删除成功')
    }, 300)
  }).catch(() => {})
}

// 切换规则状态
const handleToggleStatus = (rule: BusinessRule) => {
  loading.value = true
  setTimeout(() => {
    if (rule.status === 'enabled') {
      rule.status = 'disabled'
      rule.statusLabel = '禁用'
      ElMessage.success('规则已禁用')
    } else if (rule.status === 'disabled' || rule.status === 'testing') {
      rule.status = 'enabled'
      rule.statusLabel = '启用'
      ElMessage.success('规则已启用')
    } else {
      ElMessage.warning('已过期的规则无法启用')
    }
    loading.value = false
  }, 300)
}

// 打开逻辑设计器
const handleOpenLogicDesigner = (rule: BusinessRule) => {
  currentRule.value = rule
  logicTree.value = rule.logicTree || []
  logicDesignerVisible.value = true
}

// 保存逻辑设计
const handleSaveLogic = () => {
  if (currentRule.value) {
    currentRule.value.logicTree = [...logicTree.value]
    ElMessage.success('规则逻辑保存成功')
    logicDesignerVisible.value = false
  }
}

// 添加逻辑节点
const handleAddLogicNode = (type: string) => {
  const newNode: RuleLogicNode = {
    id: String(Date.now()),
    type: type as any,
    label: `新${type === 'condition' ? '条件' : type === 'action' ? '动作' : type === 'branch' ? '分支' : '循环'}`,
    config: {},
    children: type === 'branch' || type === 'loop' ? [] : undefined
  }
  logicTree.value.push(newNode)
}

// 删除逻辑节点
const handleDeleteLogicNode = (nodeId: string) => {
  const deleteNode = (nodes: RuleLogicNode[]): boolean => {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].id === nodeId) {
        nodes.splice(i, 1)
        return true
      }
      if (nodes[i].children && deleteNode(nodes[i].children!)) {
        return true
      }
    }
    return false
  }
  deleteNode(logicTree.value)
}

// 查看版本历史
const handleViewVersions = (rule: BusinessRule) => {
  currentRule.value = rule
  loadVersionHistory()
  versionDialogVisible.value = true
}

// 加载版本历史
const loadVersionHistory = () => {
  loading.value = true
  setTimeout(() => {
    versionHistory.value = [
      {
        id: '1',
        version: '2.1.0',
        createTime: '2024-10-20 14:20:00',
        creator: '张三',
        description: '优化审批逻辑，支持更多场景',
        status: 'current'
      },
      {
        id: '2',
        version: '2.0.0',
        createTime: '2024-08-15 10:30:00',
        creator: '张三',
        description: '重构规则引擎，提升性能',
        status: 'published'
      },
      {
        id: '3',
        version: '1.5.0',
        createTime: '2024-06-10 09:15:00',
        creator: '李四',
        description: '修复已知问题',
        status: 'published'
      },
      {
        id: '4',
        version: '1.0.0',
        createTime: '2024-01-15 10:30:00',
        creator: '张三',
        description: '初始版本',
        status: 'archived'
      }
    ]
    loading.value = false
  }, 300)
}

// 版本对比
const handleCompareVersion = (version: RuleVersion) => {
  ElMessage.info(`对比版本 ${version.version} 功能开发中...`)
}

// 版本回滚
const handleRollbackVersion = (version: RuleVersion) => {
  ElMessageBox.confirm(`确定要回滚到版本 ${version.version} 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    loading.value = true
    setTimeout(() => {
      ElMessage.success(`已回滚到版本 ${version.version}`)
      versionDialogVisible.value = false
      loading.value = false
      loadRuleList()
    }, 500)
  }).catch(() => {})
}

// 发布版本
const handlePublishVersion = () => {
  ElMessageBox.prompt('请输入新版本号', '发布新版本', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^\d+\.\d+\.\d+$/,
    inputErrorMessage: '版本号格式不正确'
  }).then(({ value }) => {
    loading.value = true
    setTimeout(() => {
      ElMessage.success(`版本 ${value} 发布成功`)
      versionDialogVisible.value = false
      loading.value = false
      loadVersionHistory()
    }, 500)
  }).catch(() => {})
}

// 打开模板库
const handleOpenTemplates = () => {
  templateDialogVisible.value = true
}

// 应用模板
const handleApplyTemplate = (template: any) => {
  ElMessageBox.confirm(`确定要应用模板"${template.name}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(() => {
    resetRuleForm()
    ruleForm.name = template.name
    ruleForm.type = template.type
    ruleForm.description = template.description
    templateDialogVisible.value = false
    ruleDialogVisible.value = true
    ElMessage.success('模板已应用，请继续完善规则配置')
  }).catch(() => {})
}

// 导出规则
const handleExportRule = (rule: BusinessRule) => {
  const data = JSON.stringify(rule, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${rule.name}_${rule.version}.json`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('规则导出成功')
}

// 导入规则
const handleImportRule = () => {
  importExportDialogVisible.value = true
}

// 批量操作
const handleBatchOperation = (operation: string) => {
  ElMessage.info(`批量${operation}功能开发中...`)
}

// 复制规则
const handleCopyRule = (rule: BusinessRule) => {
  const newRule: BusinessRule = {
    ...rule,
    id: String(Date.now()),
    name: `${rule.name}（副本）`,
    status: 'testing',
    statusLabel: '测试中',
    createTime: new Date().toLocaleString('zh-CN', { hour12: false }),
    updateTime: new Date().toLocaleString('zh-CN', { hour12: false }),
    referenceCount: 0
  }
  ruleList.value.unshift(newRule)
  updateCategoryCount()
  ElMessage.success('规则复制成功')
}

// 测试规则
const handleTestRule = (rule: BusinessRule) => {
  ElMessage.info('规则测试功能开发中...')
}

// 添加条件
const handleAddCondition = () => {
  ruleForm.conditions.push({
    id: String(Date.now()),
    field: '',
    operator: 'eq',
    value: '',
    logic: 'AND'
  })
}

// 删除条件
const handleDeleteCondition = (index: number) => {
  ruleForm.conditions.splice(index, 1)
}

// 添加动作
const handleAddAction = () => {
  ruleForm.actions.push({
    id: String(Date.now()),
    type: '',
    config: {}
  })
}

// 删除动作
const handleDeleteAction = (index: number) => {
  ruleForm.actions.splice(index, 1)
}

// 添加输入参数
const handleAddInputParam = () => {
  ruleForm.inputParams.push({
    id: String(Date.now()),
    name: '',
    type: 'string',
    required: true,
    description: ''
  })
}

// 删除输入参数
const handleDeleteInputParam = (index: number) => {
  ruleForm.inputParams.splice(index, 1)
}

// 添加输出参数
const handleAddOutputParam = () => {
  ruleForm.outputParams.push({
    id: String(Date.now()),
    name: '',
    type: 'string',
    required: true,
    description: ''
  })
}

// 删除输出参数
const handleDeleteOutputParam = (index: number) => {
  ruleForm.outputParams.splice(index, 1)
}

// 重置表单
const resetRuleForm = () => {
  Object.assign(ruleForm, {
    name: '',
    type: '',
    description: '',
    version: '1.0.0',
    priority: 1,
    processes: [],
    effectiveTime: '',
    expiryTime: '',
    inputParams: [],
    outputParams: [],
    conditions: [],
    actions: []
  })
  ruleFormRef.value?.resetFields()
}

// 获取状态标签类型
const getStatusType = (status: string) => {
  const statusMap: Record<string, any> = {
    enabled: 'success',
    disabled: 'info',
    testing: 'primary',
    expired: 'danger'
  }
  return statusMap[status] || 'info'
}

// 获取类型颜色
const getTypeColor = (type: string) => {
  const option = ruleTypeOptions.find(t => t.value === type)
  return option?.color || '#909399'
}

// 组件挂载
onMounted(() => {
  loadRuleList()
})
</script>

<template>
  <div class="business-rule-container">
    <!-- 左侧分类导航 -->
    <div class="rule-category-sidebar">
      <el-card shadow="never" :body-style="{ padding: '12px' }">
        <template #header>
          <div class="card-header">
            <span>规则分类</span>
          </div>
        </template>
        <div class="category-list">
          <div
            v-for="category in ruleCategories"
            :key="category.id"
            class="category-item"
            :class="{ active: activeCategory === category.id }"
            @click="handleCategoryChange(category.id)"
          >
            <el-icon :color="category.color" :size="18">
              <component :is="category.icon" />
            </el-icon>
            <span class="category-name">{{ category.name }}</span>
            <el-tag size="small" round>{{ category.count }}</el-tag>
          </div>
        </div>

        <el-divider />

        <div class="quick-actions">
          <el-button type="primary" :icon="'Plus'" @click="handleAddRule" style="width: 100%">
            新建规则
          </el-button>
          <el-button :icon="'FolderOpened'" @click="handleOpenTemplates" style="width: 100%; margin-top: 10px">
            模板库
          </el-button>
          <el-button :icon="'Upload'" @click="handleImportRule" style="width: 100%; margin-top: 10px">
            导入规则
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- 中间规则列表 -->
    <div class="rule-list-main">
      <el-card shadow="never" :body-style="{ padding: '20px' }">
        <!-- 搜索和筛选 -->
        <div class="filter-bar">
          <el-input
            v-model="searchText"
            placeholder="搜索规则名称"
            :prefix-icon="'Search'"
            clearable
            style="width: 300px"
          />
          <el-select
            v-model="filterType"
            placeholder="规则类型"
            clearable
            style="width: 150px; margin-left: 10px"
          >
            <el-option
              v-for="option in ruleTypeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          <el-select
            v-model="filterStatus"
            placeholder="规则状态"
            clearable
            style="width: 150px; margin-left: 10px"
          >
            <el-option
              v-for="option in statusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          <div style="flex: 1"></div>
          <el-button-group>
            <el-button :icon="'Download'" @click="handleBatchOperation('导出')">批量导出</el-button>
            <el-button :icon="'Delete'" @click="handleBatchOperation('删除')">批量删除</el-button>
          </el-button-group>
        </div>

        <!-- 规则列表表格 -->
        <el-table
          :data="filteredRuleList"
          v-loading="loading"
          stripe
          style="width: 100%; margin-top: 20px"
        >
          <el-table-column prop="name" label="规则名称" min-width="200">
            <template #default="{ row }">
              <div style="display: flex; align-items: center">
                <el-tag
                  :color="getTypeColor(row.type)"
                  size="small"
                  effect="dark"
                  style="margin-right: 8px"
                >
                  {{ row.typeLabel }}
                </el-tag>
                <span style="font-weight: 500">{{ row.name }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />

          <el-table-column prop="processes" label="适用流程" width="180">
            <template #default="{ row }">
              <el-tag
                v-for="(process, index) in row.processes.slice(0, 2)"
                :key="index"
                size="small"
                style="margin-right: 5px"
              >
                {{ process }}
              </el-tag>
              <el-tag v-if="row.processes.length > 2" size="small">
                +{{ row.processes.length - 2 }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="priority" label="优先级" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.priority === 1 ? 'danger' : row.priority === 2 ? 'warning' : ''">
                P{{ row.priority }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="version" label="版本" width="100" align="center" />

          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">{{ row.statusLabel }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="referenceCount" label="引用次数" width="100" align="center">
            <template #default="{ row }">
              <el-link type="primary" :underline="false">{{ row.referenceCount }}</el-link>
            </template>
          </el-table-column>

          <el-table-column prop="updateTime" label="最后修改时间" width="160" />

          <el-table-column label="操作" width="300" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="handleEditRule(row)">
                编辑
              </el-button>
              <el-button link type="primary" size="small" @click="handleOpenLogicDesigner(row)">
                逻辑设计
              </el-button>
              <el-button link type="primary" size="small" @click="handleViewVersions(row)">
                版本
              </el-button>
              <el-button link type="primary" size="small" @click="handleTestRule(row)">
                测试
              </el-button>
              <el-dropdown @command="(cmd) => {
                if (cmd === 'toggle') handleToggleStatus(row)
                else if (cmd === 'copy') handleCopyRule(row)
                else if (cmd === 'export') handleExportRule(row)
                else if (cmd === 'delete') handleDeleteRule(row)
              }">
                <el-button link type="primary" size="small">
                  更多<el-icon><arrow-down /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="toggle">
                      {{ row.status === 'enabled' ? '禁用' : '启用' }}
                    </el-dropdown-item>
                    <el-dropdown-item command="copy">复制</el-dropdown-item>
                    <el-dropdown-item command="export">导出</el-dropdown-item>
                    <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 规则配置对话框 -->
    <el-dialog
      v-model="ruleDialogVisible"
      :title="currentRule ? '编辑规则' : '新建规则'"
      width="900px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="ruleFormRef"
        :model="ruleForm"
        :rules="ruleFormRules"
        label-width="100px"
      >
        <el-tabs>
          <el-tab-pane label="基本信息">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="规则名称" prop="name">
                  <el-input v-model="ruleForm.name" placeholder="请输入规则名称" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="规则类型" prop="type">
                  <el-select v-model="ruleForm.type" placeholder="请选择规则类型" style="width: 100%">
                    <el-option
                      v-for="option in ruleTypeOptions"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="版本号">
                  <el-input v-model="ruleForm.version" placeholder="1.0.0" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="优先级">
                  <el-input-number v-model="ruleForm.priority" :min="1" :max="10" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="规则描述" prop="description">
              <el-input
                v-model="ruleForm.description"
                type="textarea"
                :rows="3"
                placeholder="请输入规则描述"
              />
            </el-form-item>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="生效时间">
                  <el-date-picker
                    v-model="ruleForm.effectiveTime"
                    type="datetime"
                    placeholder="选择生效时间"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="失效时间">
                  <el-date-picker
                    v-model="ruleForm.expiryTime"
                    type="datetime"
                    placeholder="选择失效时间"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-tab-pane>

          <el-tab-pane label="触发条件">
            <div style="margin-bottom: 10px">
              <el-button size="small" type="primary" @click="handleAddCondition">添加条件</el-button>
            </div>
            <div v-for="(condition, index) in ruleForm.conditions" :key="condition.id" class="condition-item">
              <el-row :gutter="10">
                <el-col :span="6">
                  <el-input v-model="condition.field" placeholder="字段名" />
                </el-col>
                <el-col :span="5">
                  <el-select v-model="condition.operator" placeholder="运算符">
                    <el-option
                      v-for="op in operatorOptions"
                      :key="op.value"
                      :label="op.label"
                      :value="op.value"
                    />
                  </el-select>
                </el-col>
                <el-col :span="6">
                  <el-input v-model="condition.value" placeholder="值" />
                </el-col>
                <el-col :span="4">
                  <el-select v-model="condition.logic" placeholder="逻辑" v-if="index < ruleForm.conditions.length - 1">
                    <el-option label="并且" value="AND" />
                    <el-option label="或者" value="OR" />
                  </el-select>
                </el-col>
                <el-col :span="3">
                  <el-button type="danger" :icon="'Delete'" @click="handleDeleteCondition(index)" />
                </el-col>
              </el-row>
            </div>
            <el-empty v-if="ruleForm.conditions.length === 0" description="暂无条件" />
          </el-tab-pane>

          <el-tab-pane label="输入参数">
            <div style="margin-bottom: 10px">
              <el-button size="small" type="primary" @click="handleAddInputParam">添加参数</el-button>
            </div>
            <div v-for="(param, index) in ruleForm.inputParams" :key="param.id" class="param-item">
              <el-row :gutter="10">
                <el-col :span="6">
                  <el-input v-model="param.name" placeholder="参数名" />
                </el-col>
                <el-col :span="5">
                  <el-select v-model="param.type" placeholder="类型">
                    <el-option
                      v-for="type in paramTypeOptions"
                      :key="type.value"
                      :label="type.label"
                      :value="type.value"
                    />
                  </el-select>
                </el-col>
                <el-col :span="8">
                  <el-input v-model="param.description" placeholder="描述" />
                </el-col>
                <el-col :span="3">
                  <el-checkbox v-model="param.required">必填</el-checkbox>
                </el-col>
                <el-col :span="2">
                  <el-button type="danger" :icon="'Delete'" @click="handleDeleteInputParam(index)" />
                </el-col>
              </el-row>
            </div>
            <el-empty v-if="ruleForm.inputParams.length === 0" description="暂无输入参数" />
          </el-tab-pane>

          <el-tab-pane label="输出参数">
            <div style="margin-bottom: 10px">
              <el-button size="small" type="primary" @click="handleAddOutputParam">添加参数</el-button>
            </div>
            <div v-for="(param, index) in ruleForm.outputParams" :key="param.id" class="param-item">
              <el-row :gutter="10">
                <el-col :span="6">
                  <el-input v-model="param.name" placeholder="参数名" />
                </el-col>
                <el-col :span="5">
                  <el-select v-model="param.type" placeholder="类型">
                    <el-option
                      v-for="type in paramTypeOptions"
                      :key="type.value"
                      :label="type.label"
                      :value="type.value"
                    />
                  </el-select>
                </el-col>
                <el-col :span="8">
                  <el-input v-model="param.description" placeholder="描述" />
                </el-col>
                <el-col :span="3">
                  <el-checkbox v-model="param.required">必填</el-checkbox>
                </el-col>
                <el-col :span="2">
                  <el-button type="danger" :icon="'Delete'" @click="handleDeleteOutputParam(index)" />
                </el-col>
              </el-row>
            </div>
            <el-empty v-if="ruleForm.outputParams.length === 0" description="暂无输出参数" />
          </el-tab-pane>
        </el-tabs>
      </el-form>

      <template #footer>
        <el-button @click="ruleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveRule" :loading="loading">保存</el-button>
      </template>
    </el-dialog>

    <!-- 规则逻辑设计器对话框 -->
    <el-dialog
      v-model="logicDesignerVisible"
      title="规则逻辑设计器"
      width="1000px"
      :close-on-click-modal="false"
    >
      <div class="logic-designer">
        <div class="designer-toolbar">
          <el-button-group>
            <el-button size="small" @click="handleAddLogicNode('condition')">添加条件</el-button>
            <el-button size="small" @click="handleAddLogicNode('action')">添加动作</el-button>
            <el-button size="small" @click="handleAddLogicNode('branch')">添加分支</el-button>
            <el-button size="small" @click="handleAddLogicNode('loop')">添加循环</el-button>
          </el-button-group>
        </div>

        <div class="logic-tree">
          <div v-for="node in logicTree" :key="node.id" class="logic-node">
            <el-card shadow="hover" :body-style="{ padding: '15px' }">
              <div class="node-header">
                <el-tag :type="node.type === 'condition' ? 'warning' : node.type === 'action' ? 'success' : 'info'">
                  {{ node.type === 'condition' ? '条件' : node.type === 'action' ? '动作' : node.type === 'branch' ? '分支' : '循环' }}
                </el-tag>
                <span style="margin-left: 10px; font-weight: 500">{{ node.label }}</span>
                <el-button
                  link
                  type="danger"
                  :icon="'Delete'"
                  size="small"
                  style="margin-left: auto"
                  @click="handleDeleteLogicNode(node.id)"
                />
              </div>
              <div class="node-config" style="margin-top: 10px">
                <el-input
                  v-model="node.label"
                  placeholder="节点名称"
                  size="small"
                />
              </div>
            </el-card>
          </div>
          <el-empty v-if="logicTree.length === 0" description="暂无逻辑节点，请添加" />
        </div>
      </div>

      <template #footer>
        <el-button @click="logicDesignerVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveLogic">保存逻辑</el-button>
      </template>
    </el-dialog>

    <!-- 版本管理对话框 -->
    <el-dialog
      v-model="versionDialogVisible"
      title="版本历史"
      width="800px"
    >
      <div style="margin-bottom: 15px">
        <el-button type="primary" size="small" @click="handlePublishVersion">发布新版本</el-button>
      </div>

      <el-timeline>
        <el-timeline-item
          v-for="version in versionHistory"
          :key="version.id"
          :timestamp="version.createTime"
          placement="top"
        >
          <el-card shadow="hover">
            <div style="display: flex; align-items: center; justify-content: space-between">
              <div>
                <el-tag v-if="version.status === 'current'" type="success">当前版本</el-tag>
                <el-tag v-else-if="version.status === 'published'" type="info">已发布</el-tag>
                <el-tag v-else type="warning">已归档</el-tag>
                <span style="margin-left: 10px; font-size: 16px; font-weight: 500">
                  版本 {{ version.version }}
                </span>
                <span style="margin-left: 10px; color: #909399">by {{ version.creator }}</span>
              </div>
              <div>
                <el-button
                  link
                  type="primary"
                  size="small"
                  @click="handleCompareVersion(version)"
                  v-if="version.status !== 'current'"
                >
                  对比
                </el-button>
                <el-button
                  link
                  type="warning"
                  size="small"
                  @click="handleRollbackVersion(version)"
                  v-if="version.status !== 'current'"
                >
                  回滚
                </el-button>
              </div>
            </div>
            <div style="margin-top: 10px; color: #606266">{{ version.description }}</div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-dialog>

    <!-- 模板库对话框 -->
    <el-dialog
      v-model="templateDialogVisible"
      title="规则模板库"
      width="800px"
    >
      <el-row :gutter="20">
        <el-col :span="12" v-for="template in ruleTemplates" :key="template.id">
          <el-card shadow="hover" style="margin-bottom: 15px">
            <div style="display: flex; align-items: center; justify-content: space-between">
              <div style="flex: 1">
                <div style="display: flex; align-items: center">
                  <el-tag
                    :color="getTypeColor(template.type)"
                    size="small"
                    effect="dark"
                    style="margin-right: 8px"
                  >
                    {{ ruleTypeOptions.find(t => t.value === template.type)?.label }}
                  </el-tag>
                  <span style="font-weight: 500">{{ template.name }}</span>
                </div>
                <div style="margin-top: 8px; color: #909399; font-size: 13px">
                  {{ template.description }}
                </div>
                <div style="margin-top: 8px; color: #409EFF; font-size: 12px">
                  已使用 {{ template.useCount }} 次
                </div>
              </div>
              <el-button type="primary" size="small" @click="handleApplyTemplate(template)">
                应用
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-dialog>

    <!-- 导入导出对话框 -->
    <el-dialog
      v-model="importExportDialogVisible"
      title="导入规则"
      width="600px"
    >
      <el-upload
        class="upload-demo"
        drag
        action="#"
        accept=".json"
        :auto-upload="false"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将 JSON 文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            只能上传 JSON 格式的规则文件
          </div>
        </template>
      </el-upload>

      <template #footer>
        <el-button @click="importExportDialogVisible = false">取消</el-button>
        <el-button type="primary">确定导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.business-rule-container {
  display: flex;
  height: 100%;

  .rule-category-sidebar {
    width: 240px;
    flex-shrink: 0;

    .card-header {
      font-weight: 600;
      font-size: 14px;
    }

    .category-list {
      .category-item {
        display: flex;
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

        .category-name {
          flex: 1;
          margin-left: 10px;
          font-size: 14px;
        }

        .el-tag {
          margin-left: auto;
        }
      }
    }

    .quick-actions {
      margin-top: 15px;
    }
  }

  .rule-list-main {
    flex: 1;
    overflow: auto;

    .filter-bar {
      display: flex;
      align-items: center;
      gap: 10px;
    }
  }

  .condition-item,
  .param-item {
    margin-bottom: 10px;
    padding: 10px;
    background-color: #f5f7fa;
    border-radius: 4px;
  }

  .logic-designer {
    .designer-toolbar {
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid #ebeef5;
    }

    .logic-tree {
      min-height: 300px;
      max-height: 500px;
      overflow-y: auto;

      .logic-node {
        margin-bottom: 15px;

        .node-header {
          display: flex;
          align-items: center;
        }
      }
    }
  }
}

:deep(.el-card__header) {
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-table) {
  font-size: 13px;
}

:deep(.el-dialog__body) {
  max-height: 600px;
  overflow-y: auto;
}
</style>
