<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// 类型定义
interface ValidationRule {
  id: string
  name: string
  type: 'format' | 'range' | 'logic' | 'business'
  applicableNodes: string[]
  level: 'warning' | 'error' | 'blocking'
  status: 'active' | 'inactive'
  description: string
  errorMessage: string
  triggerTiming: 'onSubmit' | 'onChange' | 'onBlur'
  condition: string
  expression: string
  parameters: Record<string, any>
  customFunction?: string
  dependencies: string[]
  priority: number
  lastModified: string
}

interface TestResult {
  passed: boolean
  message: string
  details?: string
  timestamp: string
}

interface TestCase {
  id: string
  name: string
  input: Record<string, any>
  expectedResult: boolean
  actualResult?: boolean
  timestamp: string
}

// 数据状态
const loading = ref(false)
const tableData = ref<ValidationRule[]>([])
const selectedRule = ref<ValidationRule | null>(null)
const showConfigDialog = ref(false)
const showTestPanel = ref(true)
const isEdit = ref(false)

// 筛选条件
const filterForm = reactive({
  keyword: '',
  type: '',
  status: ''
})

// 规则表单
const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive<Partial<ValidationRule>>({
  name: '',
  type: 'format',
  applicableNodes: [],
  level: 'error',
  status: 'active',
  description: '',
  errorMessage: '',
  triggerTiming: 'onSubmit',
  condition: '',
  expression: '',
  parameters: {},
  customFunction: '',
  dependencies: [],
  priority: 0
})

// 表单验证规则
const ruleFormRules: FormRules = {
  name: [
    { required: true, message: '请输入规则名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  type: [{ required: true, message: '请选择规则类型', trigger: 'change' }],
  level: [{ required: true, message: '请选择验证级别', trigger: 'change' }],
  errorMessage: [{ required: true, message: '请输入错误提示信息', trigger: 'blur' }],
  expression: [{ required: true, message: '请输入验证表达式', trigger: 'blur' }]
}

// 测试数据
const testInput = ref<Record<string, any>>({})
const testResult = ref<TestResult | null>(null)
const testCases = ref<TestCase[]>([])
const currentTestInput = ref('')

// 规则类型选项
const ruleTypes = [
  { label: '格式验证', value: 'format' },
  { label: '范围验证', value: 'range' },
  { label: '逻辑验证', value: 'logic' },
  { label: '业务规则验证', value: 'business' }
]

// 验证级别选项
const levelOptions = [
  { label: '警告', value: 'warning' },
  { label: '错误', value: 'error' },
  { label: '阻断', value: 'blocking' }
]

// 触发时机选项
const triggerTimingOptions = [
  { label: '提交时', value: 'onSubmit' },
  { label: '值变化时', value: 'onChange' },
  { label: '失焦时', value: 'onBlur' }
]

// 状态选项
const statusOptions = [
  { label: '启用', value: 'active' },
  { label: '禁用', value: 'inactive' }
]

// 可用节点选项
const nodeOptions = [
  { label: '表单提交节点', value: 'formSubmit' },
  { label: '数据校验节点', value: 'dataValidation' },
  { label: '审批节点', value: 'approval' },
  { label: '通知节点', value: 'notification' },
  { label: '计算节点', value: 'calculation' }
]

// 计算属性：筛选后的数据
const filteredTableData = computed(() => {
  return tableData.value.filter(item => {
    const matchKeyword = !filterForm.keyword ||
      item.name.toLowerCase().includes(filterForm.keyword.toLowerCase())
    const matchType = !filterForm.type || item.type === filterForm.type
    const matchStatus = !filterForm.status || item.status === filterForm.status
    return matchKeyword && matchType && matchStatus
  })
})

// 获取验证级别的标签类型
const getLevelTagType = (level: string) => {
  const typeMap: Record<string, any> = {
    warning: 'warning',
    error: 'danger',
    blocking: 'danger'
  }
  return typeMap[level] || 'info'
}

// 获取验证级别的颜色
const getLevelColor = (level: string) => {
  const colorMap: Record<string, string> = {
    warning: '#E6A23C',
    error: '#F56C6C',
    blocking: '#8B0000'
  }
  return colorMap[level] || '#909399'
}

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  return status === 'active' ? 'success' : 'info'
}

// 获取规则类型文本
const getRuleTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    format: '格式验证',
    range: '范围验证',
    logic: '逻辑验证',
    business: '业务规则验证'
  }
  return typeMap[type] || type
}

// 获取验证级别文本
const getLevelText = (level: string) => {
  const levelMap: Record<string, string> = {
    warning: '警告',
    error: '错误',
    blocking: '阻断'
  }
  return levelMap[level] || level
}

// Mock 数据加载
const loadMockData = () => {
  loading.value = true
  setTimeout(() => {
    tableData.value = [
      {
        id: '1',
        name: '邮箱格式验证',
        type: 'format',
        applicableNodes: ['formSubmit', 'dataValidation'],
        level: 'error',
        status: 'active',
        description: '验证邮箱格式是否正确',
        errorMessage: '邮箱格式不正确',
        triggerTiming: 'onBlur',
        condition: 'email !== ""',
        expression: '/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/.test(email)',
        parameters: {},
        dependencies: [],
        priority: 1,
        lastModified: '2024-01-15 10:30:00'
      },
      {
        id: '2',
        name: '年龄范围验证',
        type: 'range',
        applicableNodes: ['formSubmit'],
        level: 'warning',
        status: 'active',
        description: '验证年龄是否在合理范围内',
        errorMessage: '年龄必须在18-65岁之间',
        triggerTiming: 'onChange',
        condition: 'age !== null',
        expression: 'age >= 18 && age <= 65',
        parameters: { min: 18, max: 65 },
        dependencies: [],
        priority: 2,
        lastModified: '2024-01-14 15:20:00'
      },
      {
        id: '3',
        name: '金额逻辑验证',
        type: 'logic',
        applicableNodes: ['formSubmit', 'calculation'],
        level: 'blocking',
        status: 'active',
        description: '验证金额不能超过预算',
        errorMessage: '申请金额不能超过预算金额',
        triggerTiming: 'onSubmit',
        condition: 'amount > 0 && budget > 0',
        expression: 'amount <= budget',
        parameters: {},
        dependencies: ['预算验证规则'],
        priority: 3,
        lastModified: '2024-01-13 09:15:00'
      },
      {
        id: '4',
        name: '业务审批权限验证',
        type: 'business',
        applicableNodes: ['approval'],
        level: 'blocking',
        status: 'active',
        description: '验证审批人是否有权限',
        errorMessage: '当前用户无审批权限',
        triggerTiming: 'onSubmit',
        condition: 'approver !== null',
        expression: 'approverRoles.includes("APPROVER") || approverRoles.includes("ADMIN")',
        parameters: { requiredRoles: ['APPROVER', 'ADMIN'] },
        dependencies: [],
        priority: 5,
        lastModified: '2024-01-12 14:45:00'
      },
      {
        id: '5',
        name: '手机号格式验证',
        type: 'format',
        applicableNodes: ['formSubmit', 'dataValidation'],
        level: 'error',
        status: 'inactive',
        description: '验证手机号格式',
        errorMessage: '手机号格式不正确',
        triggerTiming: 'onBlur',
        condition: 'phone !== ""',
        expression: '/^1[3-9]\\d{9}$/.test(phone)',
        parameters: {},
        dependencies: [],
        priority: 1,
        lastModified: '2024-01-11 11:20:00'
      }
    ]

    // Mock 测试用例
    testCases.value = [
      {
        id: '1',
        name: '有效邮箱测试',
        input: { email: 'test@example.com' },
        expectedResult: true,
        actualResult: true,
        timestamp: '2024-01-15 10:35:00'
      },
      {
        id: '2',
        name: '无效邮箱测试',
        input: { email: 'invalid-email' },
        expectedResult: false,
        actualResult: false,
        timestamp: '2024-01-15 10:36:00'
      }
    ]

    loading.value = false
    ElMessage.success('数据加载成功')
  }, 800)
}

// 新增规则
const handleAdd = () => {
  isEdit.value = false
  resetForm()
  showConfigDialog.value = true
}

// 编辑规则
const handleEdit = (row: ValidationRule) => {
  isEdit.value = true
  Object.assign(ruleForm, row)
  showConfigDialog.value = true
}

// 删除规则
const handleDelete = (row: ValidationRule) => {
  ElMessageBox.confirm('确定要删除该验证规则吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = tableData.value.findIndex(item => item.id === row.id)
    if (index !== -1) {
      tableData.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  }).catch(() => {
    // 取消删除
  })
}

// 查看规则详情
const handleView = (row: ValidationRule) => {
  selectedRule.value = row
  // 加载测试数据
  currentTestInput.value = JSON.stringify(testInput.value, null, 2)
}

// 重置表单
const resetForm = () => {
  Object.assign(ruleForm, {
    name: '',
    type: 'format',
    applicableNodes: [],
    level: 'error',
    status: 'active',
    description: '',
    errorMessage: '',
    triggerTiming: 'onSubmit',
    condition: '',
    expression: '',
    parameters: {},
    customFunction: '',
    dependencies: [],
    priority: 0
  })
  ruleFormRef.value?.clearValidate()
}

// 提交表单
const handleSubmit = async () => {
  if (!ruleFormRef.value) return

  await ruleFormRef.value.validate((valid) => {
    if (valid) {
      if (isEdit.value) {
        // 更新规则
        const index = tableData.value.findIndex(item => item.id === ruleForm.id)
        if (index !== -1) {
          tableData.value[index] = {
            ...ruleForm,
            lastModified: new Date().toLocaleString('zh-CN')
          } as ValidationRule
          ElMessage.success('更新成功')
        }
      } else {
        // 新增规则
        const newRule: ValidationRule = {
          ...ruleForm,
          id: Date.now().toString(),
          lastModified: new Date().toLocaleString('zh-CN')
        } as ValidationRule
        tableData.value.unshift(newRule)
        ElMessage.success('新增成功')
      }
      showConfigDialog.value = false
      resetForm()
    }
  })
}

// 取消表单
const handleCancel = () => {
  showConfigDialog.value = false
  resetForm()
}

// 重置筛选
const handleResetFilter = () => {
  filterForm.keyword = ''
  filterForm.type = ''
  filterForm.status = ''
}

// 执行验证测试
const runValidationTest = () => {
  if (!selectedRule.value) {
    ElMessage.warning('请先选择一个验证规则')
    return
  }

  try {
    // 解析测试输入
    const input = JSON.parse(currentTestInput.value)

    // 模拟验证逻辑
    setTimeout(() => {
      const passed = Math.random() > 0.3 // 随机结果
      testResult.value = {
        passed,
        message: passed ? '验证通过' : selectedRule.value!.errorMessage,
        details: passed ? '数据符合验证规则要求' : '数据不符合验证规则，请检查输入',
        timestamp: new Date().toLocaleString('zh-CN')
      }

      // 添加到测试用例
      const newTestCase: TestCase = {
        id: Date.now().toString(),
        name: `测试 - ${selectedRule.value!.name}`,
        input,
        expectedResult: true,
        actualResult: passed,
        timestamp: new Date().toLocaleString('zh-CN')
      }
      testCases.value.unshift(newTestCase)

      ElMessage({
        message: passed ? '验证通过' : '验证失败',
        type: passed ? 'success' : 'error'
      })
    }, 500)
  } catch (error) {
    ElMessage.error('测试数据格式错误，请输入有效的JSON')
  }
}

// 清空测试结果
const clearTestResult = () => {
  testResult.value = null
  testInput.value = {}
  currentTestInput.value = '{}'
}

// 切换规则状态
const toggleStatus = (row: ValidationRule) => {
  row.status = row.status === 'active' ? 'inactive' : 'active'
  ElMessage.success(`已${row.status === 'active' ? '启用' : '禁用'}规则`)
}

// 复制规则
const handleCopy = (row: ValidationRule) => {
  const newRule: ValidationRule = {
    ...row,
    id: Date.now().toString(),
    name: `${row.name} - 副本`,
    lastModified: new Date().toLocaleString('zh-CN')
  }
  tableData.value.unshift(newRule)
  ElMessage.success('复制成功')
}

// 检测规则冲突
const checkConflicts = () => {
  ElMessage.info('正在检测规则冲突...')
  setTimeout(() => {
    ElMessageBox.alert('未发现规则冲突', '冲突检测结果', {
      confirmButtonText: '确定',
      type: 'success'
    })
  }, 1000)
}

// 组件挂载
onMounted(() => {
  loadMockData()
})
</script>

<template>
  <div class="rule-validation-container">
    <!-- 左侧：验证规则列表 -->
    <el-card class="left-panel" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">验证规则列表</span>
          <el-button type="primary" size="small" @click="handleAdd">新增规则</el-button>
        </div>
      </template>

      <!-- 筛选区域 -->
      <div class="filter-area">
        <el-row :gutter="16">
          <el-col :span="24">
            <el-input
              v-model="filterForm.keyword"
              placeholder="搜索规则名称"
              clearable
              prefix-icon="Search"
              size="small"
            />
          </el-col>
        </el-row>
        <el-row :gutter="16" style="margin-top: 12px;">
          <el-col :span="12">
            <el-select
              v-model="filterForm.type"
              placeholder="规则类型"
              clearable
              size="small"
              style="width: 100%"
            >
              <el-option
                v-for="item in ruleTypes"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-col>
          <el-col :span="12">
            <el-select
              v-model="filterForm.status"
              placeholder="状态"
              clearable
              size="small"
              style="width: 100%"
            >
              <el-option label="启用" value="active" />
              <el-option label="禁用" value="inactive" />
            </el-select>
          </el-col>
        </el-row>
        <el-row style="margin-top: 12px;">
          <el-col :span="24">
            <el-button size="small" @click="handleResetFilter">重置</el-button>
            <el-button size="small" type="primary" @click="checkConflicts">冲突检测</el-button>
          </el-col>
        </el-row>
      </div>

      <!-- 表格 -->
      <el-table
        :data="filteredTableData"
        v-loading="loading"
        style="width: 100%; margin-top: 16px;"
        height="calc(100vh - 360px)"
        highlight-current-row
        @row-click="handleView"
      >
        <el-table-column prop="name" label="规则名称" min-width="140" show-overflow-tooltip />
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            {{ getRuleTypeText(row.type) }}
          </template>
        </el-table-column>
        <el-table-column label="验证级别" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="getLevelTagType(row.level)"
              :color="getLevelColor(row.level)"
              effect="dark"
              size="small"
            >
              {{ getLevelText(row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click.stop="handleEdit(row)">编辑</el-button>
            <el-button type="success" link size="small" @click.stop="handleCopy(row)">复制</el-button>
            <el-button
              :type="row.status === 'active' ? 'warning' : 'success'"
              link
              size="small"
              @click.stop="toggleStatus(row)"
            >
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
            <el-button type="danger" link size="small" @click.stop="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 中间：规则配置区 -->
    <el-card class="center-panel" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">规则详情</span>
        </div>
      </template>

      <div v-if="selectedRule" class="rule-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="规则名称">{{ selectedRule.name }}</el-descriptions-item>
          <el-descriptions-item label="规则类型">{{ getRuleTypeText(selectedRule.type) }}</el-descriptions-item>
          <el-descriptions-item label="验证级别">
            <el-tag :type="getLevelTagType(selectedRule.level)" size="small">
              {{ getLevelText(selectedRule.level) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTagType(selectedRule.status)" size="small">
              {{ selectedRule.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="触发时机">
            {{ triggerTimingOptions.find(t => t.value === selectedRule.triggerTiming)?.label }}
          </el-descriptions-item>
          <el-descriptions-item label="优先级">{{ selectedRule.priority }}</el-descriptions-item>
          <el-descriptions-item label="适用节点" :span="2">
            <el-tag
              v-for="node in selectedRule.applicableNodes"
              :key="node"
              size="small"
              style="margin-right: 8px;"
            >
              {{ nodeOptions.find(n => n.value === node)?.label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="规则描述" :span="2">
            {{ selectedRule.description }}
          </el-descriptions-item>
          <el-descriptions-item label="错误提示" :span="2">
            <el-alert :title="selectedRule.errorMessage" type="error" :closable="false" />
          </el-descriptions-item>
          <el-descriptions-item label="触发条件" :span="2">
            <code>{{ selectedRule.condition }}</code>
          </el-descriptions-item>
          <el-descriptions-item label="验证表达式" :span="2">
            <code>{{ selectedRule.expression }}</code>
          </el-descriptions-item>
          <el-descriptions-item label="验证参数" :span="2">
            <pre>{{ JSON.stringify(selectedRule.parameters, null, 2) }}</pre>
          </el-descriptions-item>
          <el-descriptions-item label="依赖规则" :span="2">
            <el-tag
              v-for="(dep, index) in selectedRule.dependencies"
              :key="index"
              size="small"
              type="info"
              style="margin-right: 8px;"
            >
              {{ dep }}
            </el-tag>
            <span v-if="selectedRule.dependencies.length === 0" style="color: #909399;">无依赖</span>
          </el-descriptions-item>
          <el-descriptions-item label="最后修改时间" :span="2">
            {{ selectedRule.lastModified }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 自定义验证函数 -->
        <el-collapse v-if="selectedRule.customFunction" style="margin-top: 16px;">
          <el-collapse-item title="自定义验证函数" name="1">
            <pre><code>{{ selectedRule.customFunction }}</code></pre>
          </el-collapse-item>
        </el-collapse>
      </div>

      <el-empty v-else description="请从左侧列表选择一个验证规则" />
    </el-card>

    <!-- 右侧：测试验证面板 -->
    <el-card v-show="showTestPanel" class="right-panel" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">验证测试</span>
        </div>
      </template>

      <div class="test-panel">
        <!-- 测试输入 -->
        <div class="test-input-section">
          <h4>测试数据输入</h4>
          <el-input
            v-model="currentTestInput"
            type="textarea"
            :rows="8"
            placeholder='请输入测试数据（JSON格式）&#10;例如：&#10;{&#10;  "email": "test@example.com",&#10;  "age": 25&#10;}'
          />
          <div class="test-actions">
            <el-button type="primary" size="small" @click="runValidationTest">执行验证</el-button>
            <el-button size="small" @click="clearTestResult">清空结果</el-button>
          </div>
        </div>

        <!-- 测试结果 -->
        <div v-if="testResult" class="test-result-section">
          <h4>验证结果</h4>
          <el-alert
            :title="testResult.message"
            :type="testResult.passed ? 'success' : 'error'"
            :description="testResult.details"
            show-icon
            :closable="false"
          />
          <div class="result-info">
            <p><strong>验证状态：</strong>
              <el-tag :type="testResult.passed ? 'success' : 'danger'" size="small">
                {{ testResult.passed ? '通过' : '未通过' }}
              </el-tag>
            </p>
            <p><strong>测试时间：</strong>{{ testResult.timestamp }}</p>
          </div>
        </div>

        <!-- 测试用例列表 -->
        <div class="test-cases-section">
          <h4>测试用例历史</h4>
          <el-table :data="testCases" max-height="300" size="small">
            <el-table-column prop="name" label="用例名称" show-overflow-tooltip />
            <el-table-column label="结果" width="80" align="center">
              <template #default="{ row }">
                <el-tag
                  :type="row.actualResult ? 'success' : 'danger'"
                  size="small"
                >
                  {{ row.actualResult ? '通过' : '失败' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="timestamp" label="时间" width="140" />
          </el-table>
        </div>
      </div>
    </el-card>

    <!-- 配置对话框 -->
    <el-dialog
      v-model="showConfigDialog"
      :title="isEdit ? '编辑验证规则' : '新增验证规则'"
      width="700px"
      :close-on-click-modal="false"
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

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="规则类型" prop="type">
              <el-select v-model="ruleForm.type" placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="item in ruleTypes"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="验证级别" prop="level">
              <el-select v-model="ruleForm.level" placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="item in levelOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="触发时机" prop="triggerTiming">
              <el-select v-model="ruleForm.triggerTiming" placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="item in triggerTimingOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="ruleForm.status" placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="item in statusOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="适用节点" prop="applicableNodes">
          <el-select
            v-model="ruleForm.applicableNodes"
            multiple
            placeholder="请选择适用节点"
            style="width: 100%"
          >
            <el-option
              v-for="item in nodeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="规则描述" prop="description">
          <el-input
            v-model="ruleForm.description"
            type="textarea"
            :rows="2"
            placeholder="请输入规则描述"
          />
        </el-form-item>

        <el-form-item label="错误提示信息" prop="errorMessage">
          <el-input v-model="ruleForm.errorMessage" placeholder="请输入错误提示信息" />
        </el-form-item>

        <el-form-item label="触发条件" prop="condition">
          <el-input
            v-model="ruleForm.condition"
            placeholder="例如：email !== ''"
          />
        </el-form-item>

        <el-form-item label="验证表达式" prop="expression">
          <el-input
            v-model="ruleForm.expression"
            type="textarea"
            :rows="3"
            placeholder="例如：/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)"
          />
        </el-form-item>

        <el-form-item label="优先级" prop="priority">
          <el-input-number v-model="ruleForm.priority" :min="0" :max="100" />
        </el-form-item>

        <el-form-item label="依赖规则" prop="dependencies">
          <el-select
            v-model="ruleForm.dependencies"
            multiple
            placeholder="请选择依赖的规则"
            style="width: 100%"
          >
            <el-option
              v-for="item in tableData"
              :key="item.id"
              :label="item.name"
              :value="item.name"
              :disabled="item.id === ruleForm.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="自定义函数" prop="customFunction">
          <el-input
            v-model="ruleForm.customFunction"
            type="textarea"
            :rows="4"
            placeholder="可选：输入自定义验证函数代码"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.rule-validation-container {
  display: flex;
  gap: 16px;
  height: calc(100vh - 100px);

  .left-panel {
    flex: 0 0 480px;
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    :deep(.el-card__body) {
      flex: 1;
      overflow: auto;
      display: flex;
      flex-direction: column;
    }
  }

  .center-panel {
    flex: 1;
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    :deep(.el-card__body) {
      flex: 1;
      overflow: auto;
    }
  }

  .right-panel {
    flex: 0 0 380px;
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    :deep(.el-card__body) {
      flex: 1;
      overflow: auto;
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }
  }

  .filter-area {
    padding: 12px;
    background-color: #f9fafc;
    border-radius: 4px;
  }

  .rule-detail {
    code {
      background-color: #f5f7fa;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 12px;
      color: #e6a23c;
    }

    pre {
      background-color: #f5f7fa;
      padding: 12px;
      border-radius: 4px;
      font-size: 12px;
      margin: 0;
      overflow-x: auto;
    }
  }

  .test-panel {
    h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: #303133;
      font-weight: 600;
    }

    .test-input-section {
      margin-bottom: 24px;

      .test-actions {
        margin-top: 12px;
        display: flex;
        gap: 8px;
      }
    }

    .test-result-section {
      margin-bottom: 24px;
      padding: 16px;
      background-color: #f9fafc;
      border-radius: 4px;

      .result-info {
        margin-top: 12px;
        font-size: 13px;

        p {
          margin: 8px 0;
          color: #606266;
        }

        strong {
          color: #303133;
        }
      }
    }

    .test-cases-section {
      h4 {
        margin-bottom: 12px;
      }
    }
  }

  :deep(.el-table) {
    .el-button--small {
      padding: 4px 8px;
    }
  }

  :deep(.el-descriptions) {
    .el-descriptions__label {
      font-weight: 600;
      color: #606266;
    }
  }

  :deep(.el-empty) {
    padding: 60px 0;
  }
}
</style>
