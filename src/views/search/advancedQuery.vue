<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Plus,
  Delete,
  Download,
  Upload,
  Star,
  StarFilled,
  Refresh,
  DocumentCopy,
  Share,
  EditPen,
  Close,
  FolderOpened,
} from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'

// ==================== 类型定义 ====================

// 字段类型
type FieldType = 'text' | 'number' | 'select' | 'date' | 'datetime' | 'daterange'

// 运算符类型
type OperatorType = 'equals' | 'not_equals' | 'contains' | 'not_contains' | 
                    'starts_with' | 'ends_with' | 'greater_than' | 'less_than' |
                    'greater_equal' | 'less_equal' | 'between' | 'in' | 'not_in' | 'is_null' | 'is_not_null'

// 逻辑关系
type LogicType = 'AND' | 'OR'

// 查询字段配置
interface QueryField {
  key: string
  label: string
  type: FieldType
  options?: Array<{ label: string; value: any }>
  placeholder?: string
}

// 查询条件
interface QueryCondition {
  id: string
  field: string
  operator: OperatorType
  value: any
  value2?: any // 用于 between 等需要两个值的操作
}

// 条件组
interface ConditionGroup {
  id: string
  logic: LogicType
  conditions: QueryCondition[]
}

// 查询方案
interface QueryScheme {
  id: string
  name: string
  description: string
  groups: ConditionGroup[]
  groupLogic: LogicType
  createTime: string
  updateTime: string
  isFavorite: boolean
  isShared: boolean
}

// 查询结果
interface QueryResult {
  id: string
  assetName: string
  assetType: string
  department: string
  owner: string
  createTime: string
  updateTime: string
  status: string
  securityLevel: string
  tags: string[]
}

// ==================== 查询字段配置 ====================

const queryFields: QueryField[] = [
  { key: 'assetName', label: '资产名称', type: 'text', placeholder: '请输入资产名称' },
  { 
    key: 'assetType', 
    label: '资产类型', 
    type: 'select',
    options: [
      { label: '数据表', value: 'table' },
      { label: '数据视图', value: 'view' },
      { label: '数据接口', value: 'api' },
      { label: '数据文件', value: 'file' },
      { label: '数据模型', value: 'model' },
    ]
  },
  { 
    key: 'department', 
    label: '所属部门', 
    type: 'select',
    options: [
      { label: '技术部', value: 'tech' },
      { label: '产品部', value: 'product' },
      { label: '运营部', value: 'operation' },
      { label: '财务部', value: 'finance' },
      { label: '人力资源部', value: 'hr' },
    ]
  },
  { key: 'owner', label: '负责人', type: 'text', placeholder: '请输入负责人' },
  { key: 'createTime', label: '创建时间', type: 'daterange' },
  { key: 'updateTime', label: '更新时间', type: 'daterange' },
  { 
    key: 'status', 
    label: '状态', 
    type: 'select',
    options: [
      { label: '活跃', value: 'active' },
      { label: '停用', value: 'inactive' },
      { label: '归档', value: 'archived' },
    ]
  },
  { 
    key: 'securityLevel', 
    label: '安全等级', 
    type: 'select',
    options: [
      { label: '公开', value: 'public' },
      { label: '内部', value: 'internal' },
      { label: '机密', value: 'confidential' },
      { label: '绝密', value: 'secret' },
    ]
  },
  { key: 'dataSize', label: '数据大小(MB)', type: 'number', placeholder: '请输入数据大小' },
  { key: 'accessCount', label: '访问次数', type: 'number', placeholder: '请输入访问次数' },
]

// 运算符配置（根据字段类型显示不同的运算符）
const operatorsByType: Record<FieldType, Array<{ label: string; value: OperatorType }>> = {
  text: [
    { label: '等于', value: 'equals' },
    { label: '不等于', value: 'not_equals' },
    { label: '包含', value: 'contains' },
    { label: '不包含', value: 'not_contains' },
    { label: '开头是', value: 'starts_with' },
    { label: '结尾是', value: 'ends_with' },
    { label: '为空', value: 'is_null' },
    { label: '不为空', value: 'is_not_null' },
  ],
  number: [
    { label: '等于', value: 'equals' },
    { label: '不等于', value: 'not_equals' },
    { label: '大于', value: 'greater_than' },
    { label: '小于', value: 'less_than' },
    { label: '大于等于', value: 'greater_equal' },
    { label: '小于等于', value: 'less_equal' },
    { label: '在范围内', value: 'between' },
  ],
  select: [
    { label: '等于', value: 'equals' },
    { label: '不等于', value: 'not_equals' },
    { label: '属于', value: 'in' },
    { label: '不属于', value: 'not_in' },
  ],
  date: [
    { label: '等于', value: 'equals' },
    { label: '大于', value: 'greater_than' },
    { label: '小于', value: 'less_than' },
    { label: '在范围内', value: 'between' },
  ],
  datetime: [
    { label: '等于', value: 'equals' },
    { label: '大于', value: 'greater_than' },
    { label: '小于', value: 'less_than' },
    { label: '在范围内', value: 'between' },
  ],
  daterange: [
    { label: '在范围内', value: 'between' },
  ],
}

// ==================== 响应式数据 ====================

// 条件组列表
const conditionGroups = ref<ConditionGroup[]>([
  {
    id: generateId(),
    logic: 'AND',
    conditions: [
      {
        id: generateId(),
        field: '',
        operator: 'equals',
        value: '',
      }
    ]
  }
])

// 组间逻辑关系
const groupLogic = ref<LogicType>('AND')

// 查询方案相关
const schemes = ref<QueryScheme[]>([])
const currentScheme = ref<QueryScheme | null>(null)
const showSchemeDialog = ref(false)
const showSaveDialog = ref(false)
const schemeName = ref('')
const schemeDescription = ref('')

// 查询结果相关
const queryResults = ref<QueryResult[]>([])
const queryLoading = ref(false)
const queryExecuted = ref(false)
const queryTime = ref(0)
const totalResults = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 排序
const sortBy = ref('')
const sortOrder = ref<'ascending' | 'descending'>('ascending')

// 右侧面板控制
const showSchemePanel = ref(true)

// ==================== 工具函数 ====================

// 生成唯一ID
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 获取字段配置
function getFieldConfig(fieldKey: string): QueryField | undefined {
  return queryFields.find(f => f.key === fieldKey)
}

// 获取字段类型
function getFieldType(fieldKey: string): FieldType {
  return getFieldConfig(fieldKey)?.type || 'text'
}

// 获取可用运算符
function getOperators(fieldKey: string) {
  const fieldType = getFieldType(fieldKey)
  return operatorsByType[fieldType] || operatorsByType.text
}

// 判断运算符是否需要值输入
function operatorNeedsValue(operator: OperatorType): boolean {
  return !['is_null', 'is_not_null'].includes(operator)
}

// 判断运算符是否需要两个值
function operatorNeedsTwoValues(operator: OperatorType): boolean {
  return operator === 'between'
}

// 判断运算符是否需要多选
function operatorNeedsMultiple(operator: OperatorType): boolean {
  return ['in', 'not_in'].includes(operator)
}

// ==================== 条件操作 ====================

// 添加条件组
function addConditionGroup() {
  conditionGroups.value.push({
    id: generateId(),
    logic: 'AND',
    conditions: [
      {
        id: generateId(),
        field: '',
        operator: 'equals',
        value: '',
      }
    ]
  })
}

// 删除条件组
function removeConditionGroup(groupId: string) {
  if (conditionGroups.value.length === 1) {
    ElMessage.warning('至少保留一个条件组')
    return
  }
  conditionGroups.value = conditionGroups.value.filter(g => g.id !== groupId)
}

// 添加条件
function addCondition(groupId: string) {
  const group = conditionGroups.value.find(g => g.id === groupId)
  if (group) {
    group.conditions.push({
      id: generateId(),
      field: '',
      operator: 'equals',
      value: '',
    })
  }
}

// 删除条件
function removeCondition(groupId: string, conditionId: string) {
  const group = conditionGroups.value.find(g => g.id === groupId)
  if (group) {
    if (group.conditions.length === 1) {
      ElMessage.warning('每个条件组至少保留一个条件')
      return
    }
    group.conditions = group.conditions.filter(c => c.id !== conditionId)
  }
}

// 字段改变时，重置运算符和值
function onFieldChange(condition: QueryCondition) {
  const operators = getOperators(condition.field)
  condition.operator = operators[0]?.value || 'equals'
  condition.value = ''
  condition.value2 = undefined
}

// 运算符改变时，重置值
function onOperatorChange(condition: QueryCondition) {
  condition.value = ''
  condition.value2 = undefined
}

// ==================== 查询执行 ====================

// 验证查询条件
function validateConditions(): boolean {
  for (const group of conditionGroups.value) {
    for (const condition of group.conditions) {
      if (!condition.field) {
        ElMessage.warning('请选择查询字段')
        return false
      }
      
      if (operatorNeedsValue(condition.operator)) {
        if (!condition.value && condition.value !== 0) {
          ElMessage.warning('请输入查询值')
          return false
        }
        
        if (operatorNeedsTwoValues(condition.operator)) {
          if (!condition.value2 && condition.value2 !== 0) {
            ElMessage.warning('请输入范围结束值')
            return false
          }
        }
      }
    }
  }
  return true
}

// 执行查询
async function executeQuery() {
  if (!validateConditions()) {
    return
  }

  queryLoading.value = true
  const startTime = Date.now()

  // 模拟异步查询
  setTimeout(() => {
    // 生成模拟数据
    queryResults.value = generateMockResults()
    totalResults.value = queryResults.value.length
    queryTime.value = Date.now() - startTime
    queryExecuted.value = true
    queryLoading.value = false
    currentPage.value = 1

    ElMessage.success(`查询成功，找到 ${totalResults.value} 条结果，耗时 ${queryTime.value}ms`)
  }, 800)
}

// 生成模拟查询结果
function generateMockResults(): QueryResult[] {
  const types = ['table', 'view', 'api', 'file', 'model']
  const departments = ['tech', 'product', 'operation', 'finance', 'hr']
  const owners = ['张三', '李四', '王五', '赵六', '钱七']
  const statuses = ['active', 'inactive', 'archived']
  const levels = ['public', 'internal', 'confidential', 'secret']
  const tags = ['财务', '用户', '产品', '营销', '运营', '分析', '报表']

  const results: QueryResult[] = []
  const count = Math.floor(Math.random() * 30) + 20 // 20-50条结果

  for (let i = 0; i < count; i++) {
    results.push({
      id: generateId(),
      assetName: `资产_${i + 1}_${['用户数据', '订单数据', '财务报表', '产品信息', '营销活动'][Math.floor(Math.random() * 5)]}`,
      assetType: types[Math.floor(Math.random() * types.length)],
      department: departments[Math.floor(Math.random() * departments.length)],
      owner: owners[Math.floor(Math.random() * owners.length)],
      createTime: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      updateTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      securityLevel: levels[Math.floor(Math.random() * levels.length)],
      tags: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, 
        () => tags[Math.floor(Math.random() * tags.length)])
    })
  }

  return results
}

// 重置查询条件
function resetQuery() {
  conditionGroups.value = [
    {
      id: generateId(),
      logic: 'AND',
      conditions: [
        {
          id: generateId(),
          field: '',
          operator: 'equals',
          value: '',
        }
      ]
    }
  ]
  groupLogic.value = 'AND'
  queryResults.value = []
  queryExecuted.value = false
  currentScheme.value = null
}

// ==================== 查询方案管理 ====================

// 保存查询方案
function openSaveDialog() {
  if (!validateConditions()) {
    return
  }
  schemeName.value = ''
  schemeDescription.value = ''
  showSaveDialog.value = true
}

// 确认保存
function confirmSaveScheme() {
  if (!schemeName.value.trim()) {
    ElMessage.warning('请输入方案名称')
    return
  }

  const scheme: QueryScheme = {
    id: generateId(),
    name: schemeName.value,
    description: schemeDescription.value,
    groups: JSON.parse(JSON.stringify(conditionGroups.value)),
    groupLogic: groupLogic.value,
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString(),
    isFavorite: false,
    isShared: false,
  }

  schemes.value.unshift(scheme)
  showSaveDialog.value = false
  ElMessage.success('查询方案保存成功')
}

// 加载查询方案
function loadScheme(scheme: QueryScheme) {
  conditionGroups.value = JSON.parse(JSON.stringify(scheme.groups))
  groupLogic.value = scheme.groupLogic
  currentScheme.value = scheme
  ElMessage.success(`已加载方案：${scheme.name}`)
}

// 删除查询方案
function deleteScheme(schemeId: string) {
  ElMessageBox.confirm('确定要删除此查询方案吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    schemes.value = schemes.value.filter(s => s.id !== schemeId)
    if (currentScheme.value?.id === schemeId) {
      currentScheme.value = null
    }
    ElMessage.success('删除成功')
  }).catch(() => {})
}

// 收藏/取消收藏
function toggleFavorite(scheme: QueryScheme) {
  scheme.isFavorite = !scheme.isFavorite
  ElMessage.success(scheme.isFavorite ? '已收藏' : '已取消收藏')
}

// 分享方案
function shareScheme(scheme: QueryScheme) {
  scheme.isShared = !scheme.isShared
  ElMessage.success(scheme.isShared ? '已设为共享' : '已取消共享')
}

// 导出方案
function exportScheme(scheme: QueryScheme) {
  const data = JSON.stringify(scheme, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `查询方案_${scheme.name}_${new Date().getTime()}.json`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

// 导入方案
function importScheme() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e: any) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event: any) => {
        try {
          const scheme = JSON.parse(event.target.result)
          scheme.id = generateId() // 生成新ID
          scheme.createTime = new Date().toISOString()
          schemes.value.unshift(scheme)
          ElMessage.success('导入成功')
        } catch (error) {
          ElMessage.error('文件格式错误')
        }
      }
      reader.readAsText(file)
    }
  }
  input.click()
}

// ==================== 结果处理 ====================

// 分页数据
const paginatedResults = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return queryResults.value.slice(start, end)
})

// 排序
function handleSort({ prop, order }: any) {
  if (!prop) {
    queryResults.value = generateMockResults()
    return
  }
  
  sortBy.value = prop
  sortOrder.value = order

  queryResults.value.sort((a: any, b: any) => {
    const aVal = a[prop]
    const bVal = b[prop]
    
    if (order === 'ascending') {
      return aVal > bVal ? 1 : -1
    } else {
      return aVal < bVal ? 1 : -1
    }
  })
}

// 导出结果
function exportResults() {
  if (!queryResults.value.length) {
    ElMessage.warning('没有可导出的数据')
    return
  }

  // 转换为CSV格式
  const headers = ['资产名称', '资产类型', '所属部门', '负责人', '创建时间', '更新时间', '状态', '安全等级']
  const rows = queryResults.value.map(r => [
    r.assetName,
    r.assetType,
    r.department,
    r.owner,
    r.createTime,
    r.updateTime,
    r.status,
    r.securityLevel,
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `查询结果_${new Date().getTime()}.csv`
  a.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success('导出成功')
}

// 保存结果快照
function saveSnapshot() {
  if (!queryResults.value.length) {
    ElMessage.warning('没有可保存的结果')
    return
  }

  const snapshot = {
    conditions: conditionGroups.value,
    groupLogic: groupLogic.value,
    results: queryResults.value,
    timestamp: new Date().toISOString(),
    count: totalResults.value,
    queryTime: queryTime.value,
  }

  const data = JSON.stringify(snapshot, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `查询快照_${new Date().getTime()}.json`
  a.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success('快照保存成功')
}

// ==================== 辅助方法 ====================

// 获取类型标签样式
function getTypeTagType(type: string): string {
  const types: Record<string, string> = {
    table: 'primary',
    view: 'success',
    api: 'warning',
    file: 'danger',
    model: 'info',
  }
  return types[type] || 'info'
}

// 获取状态标签样式
function getStatusTagType(status: string): string {
  const types: Record<string, string> = {
    active: 'success',
    inactive: 'warning',
    archived: 'info',
  }
  return types[status] || 'info'
}

// 获取安全等级标签样式
function getLevelTagType(level: string): string {
  const types: Record<string, string> = {
    public: 'success',
    internal: 'primary',
    confidential: 'warning',
    secret: 'danger',
  }
  return types[level] || 'info'
}

// 格式化字段名
function formatFieldLabel(key: string): string {
  return getFieldConfig(key)?.label || key
}

// 格式化值
function formatValue(field: string, value: any): string {
  const config = getFieldConfig(field)
  if (config?.type === 'select') {
    const option = config.options?.find(o => o.value === value)
    return option?.label || value
  }
  return value
}

// ==================== 生命周期 ====================

onMounted(() => {
  // 加载模拟的历史方案
  schemes.value = [
    {
      id: generateId(),
      name: '活跃资产查询',
      description: '查询所有活跃状态的资产',
      groups: [
        {
          id: generateId(),
          logic: 'AND',
          conditions: [
            {
              id: generateId(),
              field: 'status',
              operator: 'equals',
              value: 'active',
            }
          ]
        }
      ],
      groupLogic: 'AND',
      createTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updateTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      isFavorite: true,
      isShared: false,
    },
    {
      id: generateId(),
      name: '技术部数据表',
      description: '查询技术部的所有数据表',
      groups: [
        {
          id: generateId(),
          logic: 'AND',
          conditions: [
            {
              id: generateId(),
              field: 'assetType',
              operator: 'equals',
              value: 'table',
            },
            {
              id: generateId(),
              field: 'department',
              operator: 'equals',
              value: 'tech',
            }
          ]
        }
      ],
      groupLogic: 'AND',
      createTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updateTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      isFavorite: false,
      isShared: true,
    },
    {
      id: generateId(),
      name: '近期更新资产',
      description: '查询最近30天更新的资产',
      groups: [
        {
          id: generateId(),
          logic: 'AND',
          conditions: [
            {
              id: generateId(),
              field: 'updateTime',
              operator: 'greater_than',
              value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            }
          ]
        }
      ],
      groupLogic: 'AND',
      createTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updateTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      isFavorite: true,
      isShared: false,
    },
  ]
})
</script>

<template>
  <div class="advanced-query-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h2 class="page-title">高级条件查询</h2>
        <el-tag type="info" size="large">
          专业查询工具
        </el-tag>
      </div>
      <div class="toolbar-right">
        <el-button 
          :icon="showSchemePanel ? Close : FolderOpened" 
          @click="showSchemePanel = !showSchemePanel"
        >
          {{ showSchemePanel ? '隐藏方案面板' : '显示方案面板' }}
        </el-button>
        <el-button :icon="Upload" @click="importScheme">导入方案</el-button>
        <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
      </div>
    </div>

    <div class="content-wrapper">
      <!-- 左侧：查询条件构建区 -->
      <div class="query-builder">
        <!-- 条件组 -->
        <div class="condition-groups">
          <div
            v-for="(group, groupIndex) in conditionGroups"
            :key="group.id"
            class="condition-group"
          >
            <!-- 组头部 -->
            <div class="group-header">
              <div class="group-header-left">
                <span class="group-label">条件组 {{ groupIndex + 1 }}</span>
                <el-select
                  v-model="group.logic"
                  size="small"
                  style="width: 100px"
                  :class="group.logic === 'AND' ? 'logic-and' : 'logic-or'"
                >
                  <el-option label="AND (且)" value="AND" />
                  <el-option label="OR (或)" value="OR" />
                </el-select>
                <span class="group-hint">组内逻辑</span>
              </div>
              <div class="group-header-right">
                <el-button
                  type="primary"
                  size="small"
                  :icon="Plus"
                  @click="addCondition(group.id)"
                >
                  添加条件
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  :icon="Delete"
                  @click="removeConditionGroup(group.id)"
                  :disabled="conditionGroups.length === 1"
                >
                  删除组
                </el-button>
              </div>
            </div>

            <!-- 条件列表 -->
            <div class="conditions-list">
              <div
                v-for="(condition, condIndex) in group.conditions"
                :key="condition.id"
                class="condition-item"
              >
                <div class="condition-row">
                  <!-- 字段选择 -->
                  <div class="condition-field">
                    <label>字段</label>
                    <el-select
                      v-model="condition.field"
                      placeholder="选择字段"
                      @change="onFieldChange(condition)"
                      filterable
                    >
                      <el-option
                        v-for="field in queryFields"
                        :key="field.key"
                        :label="field.label"
                        :value="field.key"
                      />
                    </el-select>
                  </div>

                  <!-- 运算符选择 -->
                  <div class="condition-operator">
                    <label>运算符</label>
                    <el-select
                      v-model="condition.operator"
                      placeholder="选择运算符"
                      @change="onOperatorChange(condition)"
                    >
                      <el-option
                        v-for="op in getOperators(condition.field)"
                        :key="op.value"
                        :label="op.label"
                        :value="op.value"
                      />
                    </el-select>
                  </div>

                  <!-- 值输入 -->
                  <div class="condition-value" v-if="operatorNeedsValue(condition.operator)">
                    <label>值</label>
                    
                    <!-- 文本输入 -->
                    <el-input
                      v-if="getFieldType(condition.field) === 'text'"
                      v-model="condition.value"
                      :placeholder="getFieldConfig(condition.field)?.placeholder || '请输入'"
                    />

                    <!-- 数字输入 -->
                    <el-input-number
                      v-else-if="getFieldType(condition.field) === 'number'"
                      v-model="condition.value"
                      :placeholder="getFieldConfig(condition.field)?.placeholder || '请输入'"
                      style="width: 100%"
                    />

                    <!-- 下拉选择 -->
                    <el-select
                      v-else-if="getFieldType(condition.field) === 'select'"
                      v-model="condition.value"
                      :placeholder="getFieldConfig(condition.field)?.placeholder || '请选择'"
                      :multiple="operatorNeedsMultiple(condition.operator)"
                      filterable
                    >
                      <el-option
                        v-for="option in getFieldConfig(condition.field)?.options || []"
                        :key="option.value"
                        :label="option.label"
                        :value="option.value"
                      />
                    </el-select>

                    <!-- 日期选择 -->
                    <el-date-picker
                      v-else-if="getFieldType(condition.field) === 'date'"
                      v-model="condition.value"
                      type="date"
                      placeholder="选择日期"
                      style="width: 100%"
                    />

                    <!-- 日期时间选择 -->
                    <el-date-picker
                      v-else-if="getFieldType(condition.field) === 'datetime'"
                      v-model="condition.value"
                      type="datetime"
                      placeholder="选择日期时间"
                      style="width: 100%"
                    />

                    <!-- 日期范围选择 -->
                    <el-date-picker
                      v-else-if="getFieldType(condition.field) === 'daterange'"
                      v-model="condition.value"
                      type="daterange"
                      range-separator="至"
                      start-placeholder="开始日期"
                      end-placeholder="结束日期"
                      style="width: 100%"
                    />
                  </div>

                  <!-- 范围第二个值 -->
                  <div 
                    class="condition-value-2" 
                    v-if="operatorNeedsTwoValues(condition.operator) && getFieldType(condition.field) !== 'daterange'"
                  >
                    <label>至</label>
                    <el-input-number
                      v-if="getFieldType(condition.field) === 'number'"
                      v-model="condition.value2"
                      placeholder="结束值"
                      style="width: 100%"
                    />
                    <el-input
                      v-else
                      v-model="condition.value2"
                      placeholder="结束值"
                    />
                  </div>

                  <!-- 删除按钮 -->
                  <el-button
                    type="danger"
                    :icon="Delete"
                    circle
                    size="small"
                    @click="removeCondition(group.id, condition.id)"
                    :disabled="group.conditions.length === 1"
                    class="delete-btn"
                  />
                </div>

                <!-- 条件间的逻辑关系标识 -->
                <div
                  v-if="condIndex < group.conditions.length - 1"
                  class="logic-indicator"
                  :class="group.logic === 'AND' ? 'logic-and' : 'logic-or'"
                >
                  {{ group.logic }}
                </div>
              </div>
            </div>
          </div>

          <!-- 组间逻辑关系 -->
          <div v-if="conditionGroups.length > 1" class="group-logic-divider">
            <el-divider>
              <el-select
                v-model="groupLogic"
                size="small"
                style="width: 120px"
                :class="groupLogic === 'AND' ? 'logic-and' : 'logic-or'"
              >
                <el-option label="AND (且)" value="AND" />
                <el-option label="OR (或)" value="OR" />
              </el-select>
              <span class="group-logic-hint">组间逻辑</span>
            </el-divider>
          </div>
        </div>

        <!-- 添加条件组按钮 -->
        <div class="add-group-btn">
          <el-button type="primary" :icon="Plus" @click="addConditionGroup" plain>
            添加条件组
          </el-button>
        </div>

        <!-- 查询操作按钮 -->
        <div class="query-actions">
          <el-button
            type="primary"
            size="large"
            :icon="Search"
            @click="executeQuery"
            :loading="queryLoading"
          >
            执行查询
          </el-button>
          <el-button
            type="success"
            size="large"
            :icon="Star"
            @click="openSaveDialog"
          >
            保存为方案
          </el-button>
          <el-button
            size="large"
            :icon="Refresh"
            @click="resetQuery"
          >
            重置条件
          </el-button>
        </div>

        <!-- 查询结果区域 -->
        <div v-if="queryExecuted" class="results-section">
          <div class="results-header">
            <div class="results-info">
              <h3>查询结果</h3>
              <el-tag type="success" size="large">
                共 {{ totalResults }} 条结果
              </el-tag>
              <el-tag type="info" size="large">
                耗时 {{ queryTime }}ms
              </el-tag>
            </div>
            <div class="results-actions">
              <el-button :icon="Download" @click="exportResults">
                导出结果
              </el-button>
              <el-button :icon="DocumentCopy" @click="saveSnapshot">
                保存快照
              </el-button>
            </div>
          </div>

          <!-- 结果表格 -->
          <el-table
            :data="paginatedResults"
            border
            stripe
            @sort-change="handleSort"
            style="width: 100%"
            max-height="500"
          >
            <el-table-column prop="assetName" label="资产名称" sortable min-width="200" />
            <el-table-column prop="assetType" label="资产类型" sortable width="120">
              <template #default="{ row }">
                <el-tag :type="getTypeTagType(row.assetType)" size="small">
                  {{ formatValue('assetType', row.assetType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="department" label="所属部门" sortable width="120">
              <template #default="{ row }">
                {{ formatValue('department', row.department) }}
              </template>
            </el-table-column>
            <el-table-column prop="owner" label="负责人" sortable width="100" />
            <el-table-column prop="createTime" label="创建时间" sortable width="120" />
            <el-table-column prop="updateTime" label="更新时间" sortable width="120" />
            <el-table-column prop="status" label="状态" sortable width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusTagType(row.status)" size="small">
                  {{ formatValue('status', row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="securityLevel" label="安全等级" sortable width="100">
              <template #default="{ row }">
                <el-tag :type="getLevelTagType(row.securityLevel)" size="small">
                  {{ formatValue('securityLevel', row.securityLevel) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="标签" width="150">
              <template #default="{ row }">
                <el-tag
                  v-for="tag in row.tags"
                  :key="tag"
                  size="small"
                  style="margin-right: 4px"
                >
                  {{ tag }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="totalResults"
              layout="total, sizes, prev, pager, next, jumper"
              background
            />
          </div>
        </div>
      </div>

      <!-- 右侧：查询方案管理面板 -->
      <div v-if="showSchemePanel" class="scheme-panel">
        <el-card shadow="never">
          <template #header>
            <div class="panel-header">
              <span class="panel-title">查询方案</span>
              <el-button type="primary" size="small" :icon="Upload" @click="importScheme">
                导入
              </el-button>
            </div>
          </template>

          <!-- 当前方案 -->
          <div v-if="currentScheme" class="current-scheme">
            <el-alert
              :title="`当前方案: ${currentScheme.name}`"
              type="success"
              :closable="false"
              show-icon
            />
          </div>

          <!-- 方案列表 -->
          <div class="scheme-list">
            <div
              v-for="scheme in schemes"
              :key="scheme.id"
              class="scheme-item"
              :class="{ active: currentScheme?.id === scheme.id }"
            >
              <div class="scheme-info" @click="loadScheme(scheme)">
                <div class="scheme-name">
                  <el-icon v-if="scheme.isFavorite" color="#f59e0b">
                    <StarFilled />
                  </el-icon>
                  {{ scheme.name }}
                  <el-tag v-if="scheme.isShared" type="success" size="small">共享</el-tag>
                </div>
                <div class="scheme-description">{{ scheme.description }}</div>
                <div class="scheme-meta">
                  <span>创建: {{ new Date(scheme.createTime).toLocaleDateString() }}</span>
                </div>
              </div>
              <div class="scheme-actions">
                <el-button
                  size="small"
                  :icon="scheme.isFavorite ? StarFilled : Star"
                  circle
                  @click.stop="toggleFavorite(scheme)"
                  :type="scheme.isFavorite ? 'warning' : 'default'"
                />
                <el-button
                  size="small"
                  :icon="Share"
                  circle
                  @click.stop="shareScheme(scheme)"
                  :type="scheme.isShared ? 'success' : 'default'"
                />
                <el-button
                  size="small"
                  :icon="Download"
                  circle
                  @click.stop="exportScheme(scheme)"
                />
                <el-button
                  size="small"
                  :icon="Delete"
                  circle
                  type="danger"
                  @click.stop="deleteScheme(scheme.id)"
                />
              </div>
            </div>

            <el-empty v-if="schemes.length === 0" description="暂无查询方案" />
          </div>
        </el-card>
      </div>
    </div>

    <!-- 保存方案对话框 -->
    <el-dialog
      v-model="showSaveDialog"
      title="保存查询方案"
      width="500px"
    >
      <el-form label-width="80px">
        <el-form-item label="方案名称" required>
          <el-input
            v-model="schemeName"
            placeholder="请输入方案名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="方案描述">
          <el-input
            v-model="schemeDescription"
            type="textarea"
            :rows="3"
            placeholder="请输入方案描述"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSaveDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmSaveScheme">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.advanced-query-container {
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 15px 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 15px;

      .page-title {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: #303133;
      }
    }

    .toolbar-right {
      display: flex;
      gap: 10px;
    }
  }

  .content-wrapper {
    display: flex;
    gap: 20px;
    align-items: flex-start;

    .query-builder {
      flex: 1;
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);

      .condition-groups {
        .condition-group {
          margin-bottom: 20px;
          border: 2px solid #e4e7ed;
          border-radius: 8px;
          padding: 15px;
          background: #fafafa;

          .group-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;

            .group-header-left {
              display: flex;
              align-items: center;
              gap: 10px;

              .group-label {
                font-weight: 600;
                color: #303133;
              }

              .group-hint {
                font-size: 12px;
                color: #909399;
              }
            }

            .group-header-right {
              display: flex;
              gap: 10px;
            }
          }

          .conditions-list {
            .condition-item {
              margin-bottom: 12px;

              &:last-child {
                margin-bottom: 0;
              }

              .condition-row {
                display: flex;
                align-items: flex-end;
                gap: 10px;
                padding: 15px;
                background: white;
                border-radius: 6px;
                border: 1px solid #e4e7ed;

                > div {
                  flex: 1;

                  label {
                    display: block;
                    margin-bottom: 5px;
                    font-size: 12px;
                    color: #606266;
                    font-weight: 500;
                  }
                }

                .condition-field {
                  flex: 1.2;
                }

                .condition-operator {
                  flex: 1;
                }

                .condition-value {
                  flex: 1.5;
                }

                .condition-value-2 {
                  flex: 1;
                }

                .delete-btn {
                  flex: 0 0 auto;
                  margin-bottom: 0;
                }
              }

              .logic-indicator {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 30px;
                font-weight: 600;
                font-size: 13px;
                margin: 5px 0;

                &.logic-and {
                  color: #409eff;
                }

                &.logic-or {
                  color: #67c23a;
                }
              }
            }
          }
        }

        .group-logic-divider {
          margin: 20px 0;

          :deep(.el-divider__text) {
            background: #f5f7fa;
            padding: 0 15px;
          }

          .group-logic-hint {
            margin-left: 10px;
            font-size: 12px;
            color: #909399;
          }
        }
      }

      .add-group-btn {
        text-align: center;
        margin: 20px 0;
      }

      .query-actions {
        display: flex;
        justify-content: center;
        gap: 15px;
        padding: 20px 0;
        border-top: 1px solid #e4e7ed;
        margin-top: 20px;
      }

      .results-section {
        margin-top: 30px;
        padding-top: 30px;
        border-top: 2px solid #e4e7ed;

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;

          .results-info {
            display: flex;
            align-items: center;
            gap: 15px;

            h3 {
              margin: 0;
              font-size: 18px;
              font-weight: 600;
            }
          }

          .results-actions {
            display: flex;
            gap: 10px;
          }
        }

        .pagination {
          margin-top: 20px;
          display: flex;
          justify-content: center;
        }
      }
    }

    .scheme-panel {
      width: 350px;
      flex-shrink: 0;

      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .panel-title {
          font-weight: 600;
          font-size: 16px;
        }
      }

      .current-scheme {
        margin-bottom: 15px;
      }

      .scheme-list {
        max-height: calc(100vh - 300px);
        overflow-y: auto;

        .scheme-item {
          padding: 12px;
          margin-bottom: 10px;
          border: 1px solid #e4e7ed;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s;

          &:hover {
            border-color: #409eff;
            box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
          }

          &.active {
            background: #ecf5ff;
            border-color: #409eff;
          }

          .scheme-info {
            margin-bottom: 10px;

            .scheme-name {
              display: flex;
              align-items: center;
              gap: 5px;
              font-weight: 600;
              color: #303133;
              margin-bottom: 5px;
              font-size: 14px;
            }

            .scheme-description {
              font-size: 12px;
              color: #606266;
              margin-bottom: 5px;
              line-height: 1.5;
            }

            .scheme-meta {
              font-size: 11px;
              color: #909399;
            }
          }

          .scheme-actions {
            display: flex;
            gap: 5px;
            padding-top: 10px;
            border-top: 1px solid #e4e7ed;
          }
        }
      }
    }
  }
}

// 逻辑选择器样式
:deep(.logic-and) {
  .el-input__wrapper {
    background-color: #ecf5ff;
    border-color: #409eff;
  }
  .el-input__inner {
    color: #409eff;
    font-weight: 600;
  }
}

:deep(.logic-or) {
  .el-input__wrapper {
    background-color: #f0f9ff;
    border-color: #67c23a;
  }
  .el-input__inner {
    color: #67c23a;
    font-weight: 600;
  }
}

// 滚动条样式
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;

  &:hover {
    background: #c0c4cc;
  }
}

::-webkit-scrollbar-track {
  background: #f5f7fa;
}
</style>