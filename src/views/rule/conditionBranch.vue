<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'

// ========== 类型定义 ==========
interface ConditionBranch {
  id: number
  name: string
  processName: string
  conditionType: 'data' | 'time' | 'role' | 'system'
  targetNode: string
  status: 'enabled' | 'disabled' | 'testing'
  priority: number
  conditions: ConditionGroup
  defaultBranch?: string
  exceptionBranch?: string
  weight: number
  createTime: string
  updateTime: string
}

interface ConditionGroup {
  logic: 'AND' | 'OR'
  conditions: (Condition | ConditionGroup)[]
}

interface Condition {
  field: string
  operator: string
  value: any
  fieldType: string
}

interface TestCase {
  id: number
  name: string
  testData: Record<string, any>
  expectedResult: string
  actualResult?: string
  status?: 'pass' | 'fail'
  createTime: string
}

// ========== 状态管理 ==========
const loading = ref(false)
const branchList = ref<ConditionBranch[]>([])
const currentBranch = ref<ConditionBranch | null>(null)

// 筛选条件
const filterForm = reactive({
  searchText: '',
  conditionType: '',
  status: ''
})

// 对话框控制
const dialogVisible = ref(false)
const dialogTitle = ref('新增条件分支')
const testDialogVisible = ref(false)

// 表单数据
const branchForm = reactive<Partial<ConditionBranch>>({
  name: '',
  processName: '',
  conditionType: 'data',
  targetNode: '',
  status: 'enabled',
  priority: 1,
  weight: 1,
  defaultBranch: '',
  exceptionBranch: '',
  conditions: {
    logic: 'AND',
    conditions: []
  }
})

const formRef = ref<FormInstance>()

// 条件表达式构建器
const currentConditionGroup = ref<ConditionGroup>({
  logic: 'AND',
  conditions: []
})

// 测试数据
const testForm = reactive({
  testData: {} as Record<string, any>,
  result: '',
  matchedPath: [] as string[]
})

const testCases = ref<TestCase[]>([])
const selectedTestCase = ref<TestCase | null>(null)

// ========== Mock 数据 ==========
const mockBranchList: ConditionBranch[] = [
  {
    id: 1,
    name: '金额大于10000的审批流程',
    processName: '采购审批流程',
    conditionType: 'data',
    targetNode: '财务总监审批',
    status: 'enabled',
    priority: 1,
    weight: 10,
    defaultBranch: '普通审批',
    exceptionBranch: '异常处理',
    conditions: {
      logic: 'AND',
      conditions: [
        { field: 'amount', operator: '>', value: 10000, fieldType: 'number' },
        { field: 'department', operator: '==', value: '采购部', fieldType: 'string' }
      ]
    },
    createTime: '2025-10-15 10:30:00',
    updateTime: '2025-10-28 14:20:00'
  },
  {
    id: 2,
    name: '工作日早8点到晚6点',
    processName: '客服工单流程',
    conditionType: 'time',
    targetNode: '在线客服处理',
    status: 'enabled',
    priority: 2,
    weight: 8,
    defaultBranch: '留言处理',
    conditions: {
      logic: 'AND',
      conditions: [
        { field: 'weekday', operator: 'between', value: [1, 5], fieldType: 'number' },
        { field: 'hour', operator: 'between', value: [8, 18], fieldType: 'number' }
      ]
    },
    createTime: '2025-10-10 09:15:00',
    updateTime: '2025-10-25 16:45:00'
  },
  {
    id: 3,
    name: '部门经理或更高级别',
    processName: '请假审批流程',
    conditionType: 'role',
    targetNode: '直接批准',
    status: 'enabled',
    priority: 1,
    weight: 9,
    conditions: {
      logic: 'OR',
      conditions: [
        { field: 'role', operator: '==', value: 'manager', fieldType: 'string' },
        { field: 'role', operator: '==', value: 'director', fieldType: 'string' },
        { field: 'level', operator: '>=', value: 5, fieldType: 'number' }
      ]
    },
    createTime: '2025-10-05 11:20:00',
    updateTime: '2025-10-20 13:30:00'
  },
  {
    id: 4,
    name: '系统负载低于60%',
    processName: '批量任务执行',
    conditionType: 'system',
    targetNode: '立即执行',
    status: 'testing',
    priority: 3,
    weight: 7,
    defaultBranch: '延迟执行',
    conditions: {
      logic: 'AND',
      conditions: [
        { field: 'cpu_usage', operator: '<', value: 60, fieldType: 'number' },
        { field: 'memory_usage', operator: '<', value: 70, fieldType: 'number' }
      ]
    },
    createTime: '2025-10-20 15:00:00',
    updateTime: '2025-10-29 10:00:00'
  },
  {
    id: 5,
    name: '紧急且金额小于5000',
    processName: '费用报销流程',
    conditionType: 'data',
    targetNode: '快速审批通道',
    status: 'disabled',
    priority: 2,
    weight: 6,
    conditions: {
      logic: 'AND',
      conditions: [
        { field: 'urgent', operator: '==', value: true, fieldType: 'boolean' },
        { field: 'amount', operator: '<', value: 5000, fieldType: 'number' }
      ]
    },
    createTime: '2025-09-28 14:30:00',
    updateTime: '2025-10-15 09:20:00'
  }
]

const mockTestCases: TestCase[] = [
  {
    id: 1,
    name: '测试用例1：大额采购',
    testData: { amount: 15000, department: '采购部' },
    expectedResult: '财务总监审批',
    createTime: '2025-10-28 10:00:00'
  },
  {
    id: 2,
    name: '测试用例2：小额采购',
    testData: { amount: 5000, department: '采购部' },
    expectedResult: '普通审批',
    createTime: '2025-10-28 11:00:00'
  }
]

// 字段选项
const fieldOptions = [
  { label: '金额 (amount)', value: 'amount', type: 'number' },
  { label: '部门 (department)', value: 'department', type: 'string' },
  { label: '角色 (role)', value: 'role', type: 'string' },
  { label: '级别 (level)', value: 'level', type: 'number' },
  { label: '紧急 (urgent)', value: 'urgent', type: 'boolean' },
  { label: '星期 (weekday)', value: 'weekday', type: 'number' },
  { label: '小时 (hour)', value: 'hour', type: 'number' },
  { label: 'CPU使用率 (cpu_usage)', value: 'cpu_usage', type: 'number' },
  { label: '内存使用率 (memory_usage)', value: 'memory_usage', type: 'number' }
]

const operatorOptions = [
  { label: '等于 (==)', value: '==' },
  { label: '不等于 (!=)', value: '!=' },
  { label: '大于 (>)', value: '>' },
  { label: '大于等于 (>=)', value: '>=' },
  { label: '小于 (<)', value: '<' },
  { label: '小于等于 (<=)', value: '<=' },
  { label: '包含 (contains)', value: 'contains' },
  { label: '不包含 (not contains)', value: 'not_contains' },
  { label: '范围内 (between)', value: 'between' },
  { label: '在列表中 (in)', value: 'in' }
]

// ========== 计算属性 ==========
const filteredBranchList = computed(() => {
  return branchList.value.filter(branch => {
    const matchSearch = !filterForm.searchText || 
      branch.name.toLowerCase().includes(filterForm.searchText.toLowerCase()) ||
      branch.processName.toLowerCase().includes(filterForm.searchText.toLowerCase())
    
    const matchType = !filterForm.conditionType || branch.conditionType === filterForm.conditionType
    const matchStatus = !filterForm.status || branch.status === filterForm.status
    
    return matchSearch && matchType && matchStatus
  })
})

// ========== 方法 ==========
// 加载数据
const loadData = () => {
  loading.value = true
  setTimeout(() => {
    branchList.value = mockBranchList
    testCases.value = mockTestCases
    loading.value = false
  }, 500)
}

// 重置筛选
const resetFilter = () => {
  filterForm.searchText = ''
  filterForm.conditionType = ''
  filterForm.status = ''
}

// 打开新增对话框
const handleAdd = () => {
  dialogTitle.value = '新增条件分支'
  Object.assign(branchForm, {
    name: '',
    processName: '',
    conditionType: 'data',
    targetNode: '',
    status: 'enabled',
    priority: 1,
    weight: 1,
    defaultBranch: '',
    exceptionBranch: '',
    conditions: {
      logic: 'AND',
      conditions: []
    }
  })
  currentConditionGroup.value = branchForm.conditions as ConditionGroup
  dialogVisible.value = true
}

// 打开编辑对话框
const handleEdit = (row: ConditionBranch) => {
  dialogTitle.value = '编辑条件分支'
  Object.assign(branchForm, JSON.parse(JSON.stringify(row)))
  currentConditionGroup.value = branchForm.conditions as ConditionGroup
  dialogVisible.value = true
}

// 删除
const handleDelete = (row: ConditionBranch) => {
  ElMessageBox.confirm('确定要删除该条件分支吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = branchList.value.findIndex(item => item.id === row.id)
    if (index > -1) {
      branchList.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  }).catch(() => {})
}

// 保存
const handleSave = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      setTimeout(() => {
        if (branchForm.id) {
          // 编辑
          const index = branchList.value.findIndex(item => item.id === branchForm.id)
          if (index > -1) {
            branchList.value[index] = {
              ...branchList.value[index],
              ...branchForm as ConditionBranch,
              updateTime: new Date().toLocaleString('zh-CN')
            }
          }
          ElMessage.success('更新成功')
        } else {
          // 新增
          const newBranch: ConditionBranch = {
            ...(branchForm as ConditionBranch),
            id: Date.now(),
            createTime: new Date().toLocaleString('zh-CN'),
            updateTime: new Date().toLocaleString('zh-CN')
          }
          branchList.value.unshift(newBranch)
          ElMessage.success('创建成功')
        }
        loading.value = false
        dialogVisible.value = false
      }, 300)
    }
  })
}

// 添加条件
const addCondition = () => {
  currentConditionGroup.value.conditions.push({
    field: '',
    operator: '==',
    value: '',
    fieldType: 'string'
  })
}

// 添加条件组
const addConditionGroup = () => {
  currentConditionGroup.value.conditions.push({
    logic: 'AND',
    conditions: []
  })
}

// 删除条件
const removeCondition = (index: number) => {
  currentConditionGroup.value.conditions.splice(index, 1)
}

// 判断是否为条件组
const isConditionGroup = (item: Condition | ConditionGroup): item is ConditionGroup => {
  return 'logic' in item && 'conditions' in item
}

// 打开测试对话框
const handleTest = (row: ConditionBranch) => {
  currentBranch.value = row
  testForm.testData = {}
  testForm.result = ''
  testForm.matchedPath = []
  testDialogVisible.value = true
}

// 执行测试
const runTest = () => {
  if (!currentBranch.value) return
  
  loading.value = true
  setTimeout(() => {
    // 简单的测试逻辑模拟
    const result = evaluateConditions(currentBranch.value!.conditions, testForm.testData)
    testForm.result = result ? `匹配成功 → ${currentBranch.value!.targetNode}` : '不匹配 → 默认分支'
    testForm.matchedPath = result ? [currentBranch.value!.name, currentBranch.value!.targetNode] : ['默认分支']
    
    loading.value = false
    ElMessage.success('测试完成')
  }, 500)
}

// 评估条件（简化版）
const evaluateConditions = (group: ConditionGroup, data: Record<string, any>): boolean => {
  const results = group.conditions.map(cond => {
    if (isConditionGroup(cond)) {
      return evaluateConditions(cond, data)
    } else {
      const fieldValue = data[cond.field]
      const condValue = cond.value
      
      switch (cond.operator) {
        case '==': return fieldValue == condValue
        case '!=': return fieldValue != condValue
        case '>': return fieldValue > condValue
        case '>=': return fieldValue >= condValue
        case '<': return fieldValue < condValue
        case '<=': return fieldValue <= condValue
        case 'contains': return String(fieldValue).includes(condValue)
        case 'between': return fieldValue >= condValue[0] && fieldValue <= condValue[1]
        default: return false
      }
    }
  })
  
  return group.logic === 'AND' ? results.every(r => r) : results.some(r => r)
}

// 加载测试用例
const loadTestCase = (testCase: TestCase) => {
  selectedTestCase.value = testCase
  testForm.testData = { ...testCase.testData }
}

// 保存测试用例
const saveTestCase = () => {
  const newCase: TestCase = {
    id: Date.now(),
    name: `测试用例${testCases.value.length + 1}`,
    testData: { ...testForm.testData },
    expectedResult: testForm.result,
    createTime: new Date().toLocaleString('zh-CN')
  }
  testCases.value.push(newCase)
  ElMessage.success('测试用例已保存')
}

// 切换状态
const toggleStatus = (row: ConditionBranch) => {
  row.status = row.status === 'enabled' ? 'disabled' : 'enabled'
  ElMessage.success(`已${row.status === 'enabled' ? '启用' : '禁用'}`)
}

// 获取状态标签类型
const getStatusType = (status: string) => {
  const typeMap: Record<string, any> = {
    enabled: 'success',
    disabled: 'info',
    testing: 'primary'
  }
  return typeMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    enabled: '启用',
    disabled: '禁用',
    testing: '测试中'
  }
  return textMap[status] || status
}

// 获取条件类型标签类型
const getConditionTypeTag = (type: string) => {
  const typeMap: Record<string, any> = {
    data: 'primary',
    time: 'success',
    role: 'warning',
    system: ''
  }
  return typeMap[type] || 'info'
}

// 获取条件类型文本
const getConditionTypeText = (type: string) => {
  const textMap: Record<string, string> = {
    data: '数据条件',
    time: '时间条件',
    role: '角色条件',
    system: '系统条件'
  }
  return textMap[type] || type
}

// 字段改变时更新字段类型
const onFieldChange = (condition: Condition) => {
  const field = fieldOptions.find(f => f.value === condition.field)
  if (field) {
    condition.fieldType = field.type
    condition.value = field.type === 'boolean' ? false : field.type === 'number' ? 0 : ''
  }
}

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入分支名称', trigger: 'blur' }],
  processName: [{ required: true, message: '请输入所属流程', trigger: 'blur' }],
  conditionType: [{ required: true, message: '请选择条件类型', trigger: 'change' }],
  targetNode: [{ required: true, message: '请输入目标节点', trigger: 'blur' }]
}

// ========== 生命周期 ==========
onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="condition-branch-container">
    <!-- 筛选栏 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="搜索">
          <el-input
            v-model="filterForm.searchText"
            placeholder="分支名称/流程名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="条件类型">
          <el-select v-model="filterForm.conditionType" placeholder="全部" clearable style="width: 150px">
            <el-option label="数据条件" value="data" />
            <el-option label="时间条件" value="time" />
            <el-option label="角色条件" value="role" />
            <el-option label="系统条件" value="system" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="启用" value="enabled" />
            <el-option label="禁用" value="disabled" />
            <el-option label="测试中" value="testing" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
          <el-button type="success" @click="handleAdd">新增分支</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 条件分支列表 -->
    <el-card class="table-card" shadow="never">
      <el-table :data="filteredBranchList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="name" label="分支名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="processName" label="所属流程" width="150" show-overflow-tooltip />
        <el-table-column label="条件类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getConditionTypeTag(row.conditionType)">
              {{ getConditionTypeText(row.conditionType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="targetNode" label="目标节点" width="150" show-overflow-tooltip />
        <el-table-column label="优先级" width="80" align="center">
          <template #default="{ row }">
            <el-tag type="warning" size="small">P{{ row.priority }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="权重" width="80" align="center">
          <template #default="{ row }">
            <span>{{ row.weight }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" width="160" />
        <el-table-column label="操作" width="280" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="success" size="small" link @click="handleTest(row)">测试</el-button>
            <el-button
              :type="row.status === 'enabled' ? 'warning' : 'success'"
              size="small"
              link
              @click="toggleStatus(row)"
            >
              {{ row.status === 'enabled' ? '禁用' : '启用' }}
            </el-button>
            <el-button type="danger" size="small" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="900px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="branchForm"
        :rules="rules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="分支名称" prop="name">
              <el-input v-model="branchForm.name" placeholder="请输入分支名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属流程" prop="processName">
              <el-input v-model="branchForm.processName" placeholder="请输入所属流程" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="条件类型" prop="conditionType">
              <el-select v-model="branchForm.conditionType" placeholder="请选择条件类型" style="width: 100%">
                <el-option label="数据条件" value="data" />
                <el-option label="时间条件" value="time" />
                <el-option label="角色条件" value="role" />
                <el-option label="系统条件" value="system" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="目标节点" prop="targetNode">
              <el-input v-model="branchForm.targetNode" placeholder="请输入目标节点" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="优先级">
              <el-input-number v-model="branchForm.priority" :min="1" :max="10" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="权重">
              <el-input-number v-model="branchForm.weight" :min="1" :max="100" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="状态">
              <el-select v-model="branchForm.status" placeholder="请选择状态" style="width: 100%">
                <el-option label="启用" value="enabled" />
                <el-option label="禁用" value="disabled" />
                <el-option label="测试中" value="testing" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="默认分支">
              <el-input v-model="branchForm.defaultBranch" placeholder="条件不满足时的默认分支" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="异常分支">
              <el-input v-model="branchForm.exceptionBranch" placeholder="异常情况处理分支" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 条件表达式配置 -->
        <el-form-item label="条件表达式">
          <el-card class="condition-builder" shadow="never">
            <div class="condition-header">
              <span class="condition-logic">
                逻辑关系：
                <el-radio-group v-model="currentConditionGroup.logic" size="small">
                  <el-radio-button label="AND">与(AND)</el-radio-button>
                  <el-radio-button label="OR">或(OR)</el-radio-button>
                </el-radio-group>
              </span>
              <div>
                <el-button type="primary" size="small" @click="addCondition">添加条件</el-button>
                <el-button type="success" size="small" @click="addConditionGroup">添加条件组</el-button>
              </div>
            </div>

            <div class="conditions-list">
              <div
                v-for="(condition, index) in currentConditionGroup.conditions"
                :key="index"
                class="condition-item"
              >
                <!-- 单个条件 -->
                <div v-if="!isConditionGroup(condition)" class="simple-condition">
                  <el-select
                    v-model="condition.field"
                    placeholder="选择字段"
                    @change="onFieldChange(condition)"
                    style="width: 180px"
                  >
                    <el-option
                      v-for="field in fieldOptions"
                      :key="field.value"
                      :label="field.label"
                      :value="field.value"
                    />
                  </el-select>
                  
                  <el-select v-model="condition.operator" placeholder="运算符" style="width: 150px">
                    <el-option
                      v-for="op in operatorOptions"
                      :key="op.value"
                      :label="op.label"
                      :value="op.value"
                    />
                  </el-select>
                  
                  <el-input
                    v-if="condition.fieldType === 'string'"
                    v-model="condition.value"
                    placeholder="条件值"
                    style="width: 180px"
                  />
                  <el-input-number
                    v-else-if="condition.fieldType === 'number'"
                    v-model="condition.value"
                    placeholder="条件值"
                    style="width: 180px"
                  />
                  <el-switch
                    v-else-if="condition.fieldType === 'boolean'"
                    v-model="condition.value"
                  />
                  
                  <el-button
                    type="danger"
                    size="small"
                    circle
                    @click="removeCondition(index)"
                  >
                    ×
                  </el-button>
                </div>

                <!-- 条件组 -->
                <div v-else class="condition-group">
                  <el-tag type="warning" size="small">条件组 ({{ condition.logic }})</el-tag>
                  <el-button type="danger" size="small" @click="removeCondition(index)">删除组</el-button>
                </div>
              </div>

              <el-empty
                v-if="currentConditionGroup.conditions.length === 0"
                description="暂无条件，请添加"
                :image-size="80"
              />
            </div>
          </el-card>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="loading">保存</el-button>
      </template>
    </el-dialog>

    <!-- 测试对话框 -->
    <el-dialog
      v-model="testDialogVisible"
      title="条件测试验证"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-row :gutter="20">
        <!-- 左侧：测试数据输入 -->
        <el-col :span="14">
          <el-card shadow="never" class="test-input-card">
            <template #header>
              <span>测试数据输入</span>
            </template>
            
            <el-form label-width="120px">
              <el-form-item
                v-for="field in fieldOptions.slice(0, 6)"
                :key="field.value"
                :label="field.label"
              >
                <el-input
                  v-if="field.type === 'string'"
                  v-model="testForm.testData[field.value]"
                  :placeholder="`输入${field.label}`"
                />
                <el-input-number
                  v-else-if="field.type === 'number'"
                  v-model="testForm.testData[field.value]"
                  :placeholder="`输入${field.label}`"
                  style="width: 100%"
                />
                <el-switch
                  v-else-if="field.type === 'boolean'"
                  v-model="testForm.testData[field.value]"
                />
              </el-form-item>
            </el-form>

            <div class="test-actions">
              <el-button type="primary" @click="runTest" :loading="loading">执行测试</el-button>
              <el-button @click="saveTestCase">保存测试用例</el-button>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧：测试结果 -->
        <el-col :span="10">
          <el-card shadow="never" class="test-result-card">
            <template #header>
              <span>测试结果</span>
            </template>
            
            <div class="test-result">
              <div v-if="testForm.result" class="result-info">
                <el-alert
                  :title="testForm.result"
                  :type="testForm.result.includes('匹配成功') ? 'success' : 'warning'"
                  :closable="false"
                  show-icon
                />
                
                <div class="matched-path" v-if="testForm.matchedPath.length > 0">
                  <h4>执行路径：</h4>
                  <el-steps direction="vertical" :active="testForm.matchedPath.length">
                    <el-step
                      v-for="(path, index) in testForm.matchedPath"
                      :key="index"
                      :title="path"
                    />
                  </el-steps>
                </div>
              </div>
              <el-empty v-else description="执行测试查看结果" :image-size="100" />
            </div>
          </el-card>

          <!-- 测试用例列表 -->
          <el-card shadow="never" class="test-cases-card" style="margin-top: 10px">
            <template #header>
              <span>测试用例</span>
            </template>
            
            <div class="test-cases-list">
              <div
                v-for="testCase in testCases"
                :key="testCase.id"
                class="test-case-item"
                @click="loadTestCase(testCase)"
              >
                <div class="test-case-name">{{ testCase.name }}</div>
                <el-tag size="small">{{ testCase.expectedResult }}</el-tag>
              </div>
              <el-empty
                v-if="testCases.length === 0"
                description="暂无测试用例"
                :image-size="60"
              />
            </div>
          </el-card>
        </el-col>
      </el-row>

      <template #footer>
        <el-button @click="testDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.condition-branch-container {
  min-height: calc(100vh - 120px);

  .filter-card {
    margin-bottom: 20px;
  }

  .table-card {
    margin-bottom: 20px;
  }

  // 条件构建器样式
  .condition-builder {
    width: 100%;
    background: #f9f9f9;

    .condition-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 15px;
      border-bottom: 1px solid #e8e8e8;

      .condition-logic {
        font-weight: 500;
      }
    }

    .conditions-list {
      min-height: 100px;
      max-height: 400px;
      overflow-y: auto;

      .condition-item {
        margin-bottom: 12px;
        padding: 12px;
        background: white;
        border-radius: 4px;
        border: 1px solid #e8e8e8;

        .simple-condition {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .condition-group {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
      }
    }
  }

  // 测试相关样式
  .test-input-card {
    .test-actions {
      margin-top: 20px;
      text-align: center;
    }
  }

  .test-result-card {
    .test-result {
      min-height: 200px;

      .result-info {
        .matched-path {
          margin-top: 20px;

          h4 {
            margin-bottom: 10px;
            font-size: 14px;
            color: #606266;
          }
        }
      }
    }
  }

  .test-cases-card {
    .test-cases-list {
      max-height: 200px;
      overflow-y: auto;

      .test-case-item {
        padding: 10px;
        margin-bottom: 8px;
        background: #f5f7fa;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: all 0.3s;

        &:hover {
          background: #e8f4ff;
          transform: translateX(4px);
        }

        .test-case-name {
          font-size: 13px;
          color: #606266;
        }
      }
    }
  }
}

// 响应式调整
@media (max-width: 1200px) {
  .condition-branch-container {
    .condition-builder {
      .simple-condition {
        flex-direction: column;
        align-items: flex-start !important;

        .el-select,
        .el-input,
        .el-input-number {
          width: 100% !important;
        }
      }
    }
  }
}
</style>