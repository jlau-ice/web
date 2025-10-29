<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// 类型定义
interface ValidationRule {
  id: string
  name: string
  description: string
  dataType: string
  validationType: string
  status: 'enabled' | 'disabled' | 'testing'
  parameters: any
  errorMessage: string
  createTime: string
  passRate: number
  usageCount: number
}

interface TestData {
  id: string
  content: string
  result: 'pass' | 'warning' | 'fail' | 'pending'
  errors: string[]
  timestamp: string
}

interface ValidationTemplate {
  id: string
  name: string
  description: string
  rules: string[]
  isPublic: boolean
  isFavorite: boolean
  createTime: string
}

interface Statistics {
  totalValidations: number
  passRate: number
  failRate: number
  commonErrors: { error: string; count: number }[]
  validationTrend: { date: string; pass: number; fail: number }[]
}

// 状态管理
const loading = ref(false)
const activeTab = ref('rules')
const selectedRule = ref<ValidationRule | null>(null)

// 筛选条件
const filterForm = reactive({
  ruleName: '',
  status: '',
  dataType: ''
})

// 校验规则列表
const rulesList = ref<ValidationRule[]>([])
const filteredRules = computed(() => {
  return rulesList.value.filter(rule => {
    const nameMatch = !filterForm.ruleName || rule.name.includes(filterForm.ruleName)
    const statusMatch = !filterForm.status || rule.status === filterForm.status
    const typeMatch = !filterForm.dataType || rule.dataType === filterForm.dataType
    return nameMatch && statusMatch && typeMatch
  })
})

// 规则编辑对话框
const ruleDialogVisible = ref(false)
const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  id: '',
  name: '',
  description: '',
  dataType: '',
  validationType: '',
  status: 'enabled' as 'enabled' | 'disabled' | 'testing',
  errorMessage: '',
  parameters: {
    minLength: 0,
    maxLength: 0,
    pattern: '',
    minValue: 0,
    maxValue: 0,
    required: true,
    customLogic: ''
  }
})

const ruleFormRules: FormRules = {
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  dataType: [{ required: true, message: '请选择数据类型', trigger: 'change' }],
  validationType: [{ required: true, message: '请选择校验类型', trigger: 'change' }],
  errorMessage: [{ required: true, message: '请输入错误提示', trigger: 'blur' }]
}

// 测试数据
const testInput = ref('')
const testResults = ref<TestData[]>([])
const testLoading = ref(false)

// 文件上传
const uploadFile = ref<File | null>(null)

// 统计数据
const statistics = ref<Statistics>({
  totalValidations: 0,
  passRate: 0,
  failRate: 0,
  commonErrors: [],
  validationTrend: []
})

// 模板管理
const templatesList = ref<ValidationTemplate[]>([])
const templateDialogVisible = ref(false)
const templateForm = reactive({
  id: '',
  name: '',
  description: '',
  rules: [] as string[],
  isPublic: false
})

// Mock 数据生成
const generateMockRules = (): ValidationRule[] => {
  const dataTypes = ['字符串', '数字', '日期', 'JSON', '数组', '布尔值']
  const validationTypes = ['格式校验', '范围校验', '逻辑校验']
  const statuses: Array<'enabled' | 'disabled' | 'testing'> = ['enabled', 'disabled', 'testing']
  
  return Array.from({ length: 15 }, (_, i) => ({
    id: `rule-${i + 1}`,
    name: `校验规则${i + 1}`,
    description: `这是校验规则${i + 1}的描述信息`,
    dataType: dataTypes[i % dataTypes.length],
    validationType: validationTypes[i % validationTypes.length],
    status: statuses[i % statuses.length],
    parameters: {
      minLength: 1,
      maxLength: 100,
      pattern: '^[A-Za-z0-9]+$',
      required: true
    },
    errorMessage: `数据不符合规则${i + 1}的要求`,
    createTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    passRate: Math.floor(Math.random() * 30) + 70,
    usageCount: Math.floor(Math.random() * 1000)
  }))
}

const generateMockTemplates = (): ValidationTemplate[] => {
  return Array.from({ length: 8 }, (_, i) => ({
    id: `template-${i + 1}`,
    name: `校验模板${i + 1}`,
    description: `常用校验模板${i + 1}`,
    rules: [`rule-${i + 1}`, `rule-${i + 2}`],
    isPublic: i % 2 === 0,
    isFavorite: i % 3 === 0,
    createTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }))
}

const generateMockStatistics = (): Statistics => {
  const trend = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return {
      date: date.toISOString().split('T')[0],
      pass: Math.floor(Math.random() * 100) + 50,
      fail: Math.floor(Math.random() * 30) + 10
    }
  })

  return {
    totalValidations: 15420,
    passRate: 87.5,
    failRate: 12.5,
    commonErrors: [
      { error: '数据格式不正确', count: 456 },
      { error: '字段缺失', count: 328 },
      { error: '数值超出范围', count: 245 },
      { error: '逻辑校验失败', count: 182 },
      { error: '非法字符', count: 134 }
    ],
    validationTrend: trend
  }
}

// 加载数据
const loadData = async () => {
  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 800))
  rulesList.value = generateMockRules()
  templatesList.value = generateMockTemplates()
  statistics.value = generateMockStatistics()
  loading.value = false
}

// 规则操作
const handleAddRule = () => {
  Object.assign(ruleForm, {
    id: '',
    name: '',
    description: '',
    dataType: '',
    validationType: '',
    status: 'enabled',
    errorMessage: '',
    parameters: {
      minLength: 0,
      maxLength: 0,
      pattern: '',
      minValue: 0,
      maxValue: 0,
      required: true,
      customLogic: ''
    }
  })
  ruleDialogVisible.value = true
}

const handleEditRule = (rule: ValidationRule) => {
  Object.assign(ruleForm, { ...rule })
  ruleDialogVisible.value = true
}

const handleDeleteRule = async (rule: ValidationRule) => {
  try {
    await ElMessageBox.confirm('确定要删除该规则吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await new Promise(resolve => setTimeout(resolve, 500))
    const index = rulesList.value.findIndex(r => r.id === rule.id)
    if (index > -1) {
      rulesList.value.splice(index, 1)
    }
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}

const handleToggleStatus = async (rule: ValidationRule) => {
  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 500))
  rule.status = rule.status === 'enabled' ? 'disabled' : 'enabled'
  loading.value = false
  ElMessage.success(`规则已${rule.status === 'enabled' ? '启用' : '禁用'}`)
}

const saveRule = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  
  await formEl.validate(async (valid) => {
    if (valid) {
      loading.value = true
      await new Promise(resolve => setTimeout(resolve, 800))
      
      if (ruleForm.id) {
        // 编辑
        const index = rulesList.value.findIndex(r => r.id === ruleForm.id)
        if (index > -1) {
          rulesList.value[index] = { 
            ...rulesList.value[index],
            ...ruleForm,
            parameters: { ...ruleForm.parameters }
          }
        }
        ElMessage.success('规则更新成功')
      } else {
        // 新增
        const newRule: ValidationRule = {
          ...ruleForm,
          id: `rule-${Date.now()}`,
          createTime: new Date().toISOString().split('T')[0],
          passRate: 100,
          usageCount: 0,
          parameters: { ...ruleForm.parameters }
        }
        rulesList.value.unshift(newRule)
        ElMessage.success('规则创建成功')
      }
      
      loading.value = false
      ruleDialogVisible.value = false
    }
  })
}

// 测试功能
const handleTestData = async () => {
  if (!testInput.value.trim()) {
    ElMessage.warning('请输入测试数据')
    return
  }

  testLoading.value = true
  await new Promise(resolve => setTimeout(resolve, 1000))

  // 模拟校验逻辑
  const results: ('pass' | 'warning' | 'fail')[] = ['pass', 'warning', 'fail']
  const result = results[Math.floor(Math.random() * results.length)]
  const errors: string[] = []

  if (result === 'fail') {
    errors.push('数据格式不正确', '缺少必填字段')
  } else if (result === 'warning') {
    errors.push('数据格式正确但存在潜在问题')
  }

  testResults.value.unshift({
    id: `test-${Date.now()}`,
    content: testInput.value,
    result,
    errors,
    timestamp: new Date().toLocaleString()
  })

  testLoading.value = false
  ElMessage.success('校验完成')
}

const handleFileUpload = async (file: File) => {
  testLoading.value = true
  await new Promise(resolve => setTimeout(resolve, 1500))

  // 模拟文件校验
  const batchSize = Math.floor(Math.random() * 5) + 3
  for (let i = 0; i < batchSize; i++) {
    const results: ('pass' | 'warning' | 'fail')[] = ['pass', 'warning', 'fail']
    const result = results[Math.floor(Math.random() * results.length)]
    testResults.value.unshift({
      id: `test-${Date.now()}-${i}`,
      content: `${file.name} - 数据行 ${i + 1}`,
      result,
      errors: result !== 'pass' ? ['发现格式错误'] : [],
      timestamp: new Date().toLocaleString()
    })
  }

  testLoading.value = false
  ElMessage.success(`文件 ${file.name} 校验完成`)
}

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    handleFileUpload(target.files[0])
  }
}

const handleExportReport = () => {
  ElMessage.success('校验报告导出成功')
}

const clearTestResults = () => {
  testResults.value = []
  ElMessage.success('已清空测试结果')
}

// 模板操作
const handleAddTemplate = () => {
  Object.assign(templateForm, {
    id: '',
    name: '',
    description: '',
    rules: [],
    isPublic: false
  })
  templateDialogVisible.value = true
}

const handleApplyTemplate = async (template: ValidationTemplate) => {
  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 500))
  loading.value = false
  ElMessage.success(`已应用模板: ${template.name}`)
}

const handleToggleFavorite = (template: ValidationTemplate) => {
  template.isFavorite = !template.isFavorite
  ElMessage.success(template.isFavorite ? '已添加到收藏' : '已取消收藏')
}

const handleExportTemplate = (template: ValidationTemplate) => {
  ElMessage.success(`模板 ${template.name} 导出成功`)
}

const saveTemplate = async () => {
  if (!templateForm.name) {
    ElMessage.warning('请输入模板名称')
    return
  }

  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 500))

  if (templateForm.id) {
    const index = templatesList.value.findIndex(t => t.id === templateForm.id)
    if (index > -1) {
      templatesList.value[index] = { ...templatesList.value[index], ...templateForm }
    }
  } else {
    const newTemplate: ValidationTemplate = {
      ...templateForm,
      id: `template-${Date.now()}`,
      isFavorite: false,
      createTime: new Date().toISOString().split('T')[0]
    }
    templatesList.value.unshift(newTemplate)
  }

  loading.value = false
  templateDialogVisible.value = false
  ElMessage.success('模板保存成功')
}

// 状态标签
const getStatusType = (status: string) => {
  const map: Record<string, any> = {
    enabled: 'success',
    disabled: 'info',
    testing: 'primary'
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    enabled: '启用',
    disabled: '禁用',
    testing: '测试中'
  }
  return map[status] || status
}

const getResultType = (result: string) => {
  const map: Record<string, any> = {
    pass: 'success',
    warning: 'warning',
    fail: 'danger',
    pending: 'info'
  }
  return map[result] || 'info'
}

const getResultText = (result: string) => {
  const map: Record<string, string> = {
    pass: '通过',
    warning: '警告',
    fail: '失败',
    pending: '待处理'
  }
  return map[result] || result
}

// 生命周期
onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="data-validate-container">
    <el-card class="header-card">
      <div class="page-header">
        <div>
          <h2>数据格式校验</h2>
          <p class="subtitle">对上链数据的格式和内容进行验证，确保数据的规范性和合法性</p>
        </div>
        <div class="header-actions">
          <el-button type="primary" @click="handleAddRule">
            <el-icon><Plus /></el-icon>
            新建规则
          </el-button>
          <el-button @click="handleAddTemplate">
            <el-icon><Document /></el-icon>
            新建模板
          </el-button>
        </div>
      </div>
    </el-card>

    <el-row :gutter="20" class="main-content">
      <!-- 左侧：规则列表 -->
      <el-col :span="10">
        <el-card v-loading="loading">
          <template #header>
            <div class="card-header">
              <span class="card-title">校验规则列表</span>
              <el-tag>{{ filteredRules.length }} 条规则</el-tag>
            </div>
          </template>

          <!-- 筛选器 -->
          <div class="filter-section">
            <el-input
              v-model="filterForm.ruleName"
              placeholder="搜索规则名称"
              clearable
              style="margin-bottom: 12px"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-row :gutter="12">
              <el-col :span="12">
                <el-select v-model="filterForm.status" placeholder="状态" clearable style="width: 100%">
                  <el-option label="启用" value="enabled" />
                  <el-option label="禁用" value="disabled" />
                  <el-option label="测试中" value="testing" />
                </el-select>
              </el-col>
              <el-col :span="12">
                <el-select v-model="filterForm.dataType" placeholder="数据类型" clearable style="width: 100%">
                  <el-option label="字符串" value="字符串" />
                  <el-option label="数字" value="数字" />
                  <el-option label="日期" value="日期" />
                  <el-option label="JSON" value="JSON" />
                  <el-option label="数组" value="数组" />
                  <el-option label="布尔值" value="布尔值" />
                </el-select>
              </el-col>
            </el-row>
          </div>

          <!-- 规则表格 -->
          <el-table
            :data="filteredRules"
            stripe
            highlight-current-row
            @row-click="selectedRule = $event"
            style="margin-top: 16px"
            max-height="600px"
          >
            <el-table-column label="规则名称" prop="name" min-width="120">
              <template #default="{ row }">
                <div class="rule-name">
                  {{ row.name }}
                  <el-tag v-if="row.usageCount > 500" size="small" type="success">常用</el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="数据类型" prop="dataType" width="100" />
            <el-table-column label="校验类型" prop="validationType" width="100" />
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="通过率" width="80">
              <template #default="{ row }">
                <span :style="{ color: row.passRate >= 80 ? '#67c23a' : row.passRate >= 60 ? '#e6a23c' : '#f56c6c' }">
                  {{ row.passRate }}%
                </span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click.stop="handleEditRule(row)">编辑</el-button>
                <el-button link type="primary" size="small" @click.stop="handleToggleStatus(row)">
                  {{ row.status === 'enabled' ? '禁用' : '启用' }}
                </el-button>
                <el-button link type="danger" size="small" @click.stop="handleDeleteRule(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 右侧：功能区域 -->
      <el-col :span="14">
        <el-tabs v-model="activeTab" class="function-tabs">
          <!-- 规则详情 -->
          <el-tab-pane label="规则详情" name="rules">
            <el-card v-if="selectedRule">
              <template #header>
                <div class="card-header">
                  <span class="card-title">{{ selectedRule.name }}</span>
                  <el-tag :type="getStatusType(selectedRule.status)">
                    {{ getStatusText(selectedRule.status) }}
                  </el-tag>
                </div>
              </template>

              <el-descriptions :column="2" border>
                <el-descriptions-item label="规则ID">{{ selectedRule.id }}</el-descriptions-item>
                <el-descriptions-item label="创建时间">{{ selectedRule.createTime }}</el-descriptions-item>
                <el-descriptions-item label="数据类型">{{ selectedRule.dataType }}</el-descriptions-item>
                <el-descriptions-item label="校验类型">{{ selectedRule.validationType }}</el-descriptions-item>
                <el-descriptions-item label="使用次数">{{ selectedRule.usageCount }}</el-descriptions-item>
                <el-descriptions-item label="通过率">
                  <el-progress :percentage="selectedRule.passRate" :color="selectedRule.passRate >= 80 ? '#67c23a' : '#e6a23c'" />
                </el-descriptions-item>
                <el-descriptions-item label="描述" :span="2">{{ selectedRule.description }}</el-descriptions-item>
                <el-descriptions-item label="错误提示" :span="2">
                  <el-alert :title="selectedRule.errorMessage" type="error" :closable="false" />
                </el-descriptions-item>
              </el-descriptions>

              <div class="parameters-section">
                <h4>校验参数</h4>
                <el-descriptions :column="2" border>
                  <el-descriptions-item
                    v-for="(value, key) in selectedRule.parameters"
                    :key="key"
                    :label="key"
                  >
                    {{ value }}
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </el-card>
            <el-empty v-else description="请从左侧列表选择一个规则查看详情" />
          </el-tab-pane>

          <!-- 数据测试 -->
          <el-tab-pane label="数据测试" name="test">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span class="card-title">校验测试</span>
                  <div>
                    <el-button size="small" @click="clearTestResults">清空结果</el-button>
                    <el-button size="small" type="primary" @click="handleExportReport">导出报告</el-button>
                  </div>
                </div>
              </template>

              <div class="test-input-section">
                <el-alert
                  title="提示：输入测试数据或上传文件进行校验"
                  type="info"
                  :closable="false"
                  style="margin-bottom: 16px"
                />

                <el-input
                  v-model="testInput"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入测试数据（支持JSON、文本等格式）"
                  style="margin-bottom: 12px"
                />

                <div class="test-actions">
                  <el-button type="primary" :loading="testLoading" @click="handleTestData">
                    <el-icon><Check /></el-icon>
                    执行校验
                  </el-button>
                  <el-upload
                    :show-file-list="false"
                    :auto-upload="false"
                    :on-change="(file) => handleFileUpload(file.raw)"
                    accept=".txt,.json,.csv"
                  >
                    <el-button>
                      <el-icon><Upload /></el-icon>
                      上传文件测试
                    </el-button>
                  </el-upload>
                </div>
              </div>

              <el-divider />

              <!-- 测试结果 -->
              <div class="test-results">
                <h4>测试结果 ({{ testResults.length }})</h4>
                <div v-if="testResults.length > 0" class="results-list">
                  <div v-for="result in testResults" :key="result.id" class="result-item">
                    <div class="result-header">
                      <el-tag :type="getResultType(result.result)" size="large">
                        {{ getResultText(result.result) }}
                      </el-tag>
                      <span class="result-time">{{ result.timestamp }}</span>
                    </div>
                    <div class="result-content">
                      <strong>测试数据：</strong>
                      <pre>{{ result.content }}</pre>
                    </div>
                    <div v-if="result.errors.length > 0" class="result-errors">
                      <el-alert
                        v-for="(error, idx) in result.errors"
                        :key="idx"
                        :title="error"
                        type="error"
                        :closable="false"
                        style="margin-top: 8px"
                      />
                    </div>
                  </div>
                </div>
                <el-empty v-else description="暂无测试结果" />
              </div>
            </el-card>
          </el-tab-pane>

          <!-- 统计分析 -->
          <el-tab-pane label="统计分析" name="statistics">
            <el-row :gutter="16">
              <el-col :span="8">
                <el-card class="stat-card">
                  <div class="stat-content">
                    <div class="stat-icon" style="background: #ecf5ff; color: #409eff">
                      <el-icon :size="32"><DataAnalysis /></el-icon>
                    </div>
                    <div class="stat-info">
                      <div class="stat-value">{{ statistics.totalValidations.toLocaleString() }}</div>
                      <div class="stat-label">总校验次数</div>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card class="stat-card">
                  <div class="stat-content">
                    <div class="stat-icon" style="background: #f0f9ff; color: #67c23a">
                      <el-icon :size="32"><SuccessFilled /></el-icon>
                    </div>
                    <div class="stat-info">
                      <div class="stat-value">{{ statistics.passRate }}%</div>
                      <div class="stat-label">校验通过率</div>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card class="stat-card">
                  <div class="stat-content">
                    <div class="stat-icon" style="background: #fef0f0; color: #f56c6c">
                      <el-icon :size="32"><CircleClose /></el-icon>
                    </div>
                    <div class="stat-info">
                      <div class="stat-value">{{ statistics.failRate }}%</div>
                      <div class="stat-label">校验失败率</div>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>

            <el-row :gutter="16" style="margin-top: 16px">
              <el-col :span="14">
                <el-card>
                  <template #header>
                    <span class="card-title">校验趋势</span>
                  </template>
                  <div class="chart-container">
                    <div v-for="item in statistics.validationTrend" :key="item.date" class="trend-item">
                      <div class="trend-date">{{ item.date }}</div>
                      <div class="trend-bars">
                        <div class="trend-bar-wrapper">
                          <div class="trend-bar pass" :style="{ width: `${(item.pass / 150) * 100}%` }">
                            {{ item.pass }}
                          </div>
                        </div>
                        <div class="trend-bar-wrapper">
                          <div class="trend-bar fail" :style="{ width: `${(item.fail / 150) * 100}%` }">
                            {{ item.fail }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="10">
                <el-card>
                  <template #header>
                    <span class="card-title">常见错误TOP5</span>
                  </template>
                  <div class="errors-list">
                    <div v-for="(error, index) in statistics.commonErrors" :key="index" class="error-item">
                      <div class="error-rank">{{ index + 1 }}</div>
                      <div class="error-info">
                        <div class="error-name">{{ error.error }}</div>
                        <el-progress :percentage="(error.count / 500) * 100" :show-text="false" />
                      </div>
                      <div class="error-count">{{ error.count }}</div>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </el-tab-pane>

          <!-- 模板管理 -->
          <el-tab-pane label="模板管理" name="templates">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span class="card-title">校验模板库</span>
                  <el-button size="small" type="primary" @click="handleAddTemplate">
                    <el-icon><Plus /></el-icon>
                    新建模板
                  </el-button>
                </div>
              </template>

              <el-row :gutter="16">
                <el-col v-for="template in templatesList" :key="template.id" :span="12">
                  <el-card class="template-card" shadow="hover">
                    <div class="template-header">
                      <h4>{{ template.name }}</h4>
                      <div class="template-badges">
                        <el-tag v-if="template.isPublic" size="small" type="success">公开</el-tag>
                        <el-icon
                          :class="['favorite-icon', { active: template.isFavorite }]"
                          @click="handleToggleFavorite(template)"
                        >
                          <Star />
                        </el-icon>
                      </div>
                    </div>
                    <p class="template-desc">{{ template.description }}</p>
                    <div class="template-meta">
                      <span>{{ template.rules.length }} 条规则</span>
                      <span>{{ template.createTime }}</span>
                    </div>
                    <div class="template-actions">
                      <el-button size="small" type="primary" plain @click="handleApplyTemplate(template)">
                        应用
                      </el-button>
                      <el-button size="small" plain @click="handleExportTemplate(template)">导出</el-button>
                    </div>
                  </el-card>
                </el-col>
              </el-row>
            </el-card>
          </el-tab-pane>
        </el-tabs>
      </el-col>
    </el-row>

    <!-- 规则编辑对话框 -->
    <el-dialog
      v-model="ruleDialogVisible"
      :title="ruleForm.id ? '编辑规则' : '新建规则'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="ruleFormRef" :model="ruleForm" :rules="ruleFormRules" label-width="100px">
        <el-form-item label="规则名称" prop="name">
          <el-input v-model="ruleForm.name" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="数据类型" prop="dataType">
          <el-select v-model="ruleForm.dataType" placeholder="请选择数据类型" style="width: 100%">
            <el-option label="字符串" value="字符串" />
            <el-option label="数字" value="数字" />
            <el-option label="日期" value="日期" />
            <el-option label="JSON" value="JSON" />
            <el-option label="数组" value="数组" />
            <el-option label="布尔值" value="布尔值" />
          </el-select>
        </el-form-item>
        <el-form-item label="校验类型" prop="validationType">
          <el-select v-model="ruleForm.validationType" placeholder="请选择校验类型" style="width: 100%">
            <el-option label="格式校验" value="格式校验" />
            <el-option label="范围校验" value="范围校验" />
            <el-option label="逻辑校验" value="逻辑校验" />
          </el-select>
        </el-form-item>
        <el-form-item label="规则描述">
          <el-input v-model="ruleForm.description" type="textarea" :rows="3" placeholder="请输入规则描述" />
        </el-form-item>
        <el-form-item label="错误提示" prop="errorMessage">
          <el-input v-model="ruleForm.errorMessage" placeholder="请输入错误提示信息" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="ruleForm.status">
            <el-radio label="enabled">启用</el-radio>
            <el-radio label="disabled">禁用</el-radio>
            <el-radio label="testing">测试中</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-divider content-position="left">校验参数配置</el-divider>

        <el-form-item v-if="ruleForm.validationType === '格式校验'" label="正则表达式">
          <el-input v-model="ruleForm.parameters.pattern" placeholder="如：^[A-Za-z0-9]+$" />
        </el-form-item>
        <el-form-item v-if="ruleForm.validationType === '范围校验'" label="最小长度">
          <el-input-number v-model="ruleForm.parameters.minLength" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item v-if="ruleForm.validationType === '范围校验'" label="最大长度">
          <el-input-number v-model="ruleForm.parameters.maxLength" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item v-if="ruleForm.dataType === '数字'" label="最小值">
          <el-input-number v-model="ruleForm.parameters.minValue" style="width: 100%" />
        </el-form-item>
        <el-form-item v-if="ruleForm.dataType === '数字'" label="最大值">
          <el-input-number v-model="ruleForm.parameters.maxValue" style="width: 100%" />
        </el-form-item>
        <el-form-item label="是否必填">
          <el-switch v-model="ruleForm.parameters.required" />
        </el-form-item>
        <el-form-item v-if="ruleForm.validationType === '逻辑校验'" label="自定义逻辑">
          <el-input
            v-model="ruleForm.parameters.customLogic"
            type="textarea"
            :rows="3"
            placeholder="请输入自定义校验逻辑（可选）"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="ruleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="saveRule(ruleFormRef)">保存</el-button>
      </template>
    </el-dialog>

    <!-- 模板编辑对话框 -->
    <el-dialog
      v-model="templateDialogVisible"
      :title="templateForm.id ? '编辑模板' : '新建模板'"
      width="500px"
    >
      <el-form :model="templateForm" label-width="100px">
        <el-form-item label="模板名称">
          <el-input v-model="templateForm.name" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="模板描述">
          <el-input v-model="templateForm.description" type="textarea" :rows="3" placeholder="请输入模板描述" />
        </el-form-item>
        <el-form-item label="选择规则">
          <el-select v-model="templateForm.rules" multiple placeholder="请选择规则" style="width: 100%">
            <el-option
              v-for="rule in rulesList"
              :key="rule.id"
              :label="rule.name"
              :value="rule.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="公开模板">
          <el-switch v-model="templateForm.isPublic" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="templateDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="saveTemplate">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.header-card {
  margin-bottom: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    margin: 0 0 8px 0;
    font-size: 24px;
    color: #303133;
  }

  .subtitle {
    margin: 0;
    color: #909399;
    font-size: 14px;
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }
}

.main-content {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .card-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }
}

.filter-section {
  margin-bottom: 16px;
}

.rule-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.parameters-section {
  margin-top: 24px;

  h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    color: #606266;
  }
}

.function-tabs {
  :deep(.el-tabs__content) {
    padding-top: 16px;
  }
}

.test-input-section {
  margin-bottom: 24px;
}

.test-actions {
  display: flex;
  gap: 12px;
}

.test-results {
  h4 {
    margin: 0 0 16px 0;
    font-size: 14px;
    color: #606266;
  }
}

.results-list {
  max-height: 500px;
  overflow-y: auto;
}

.result-item {
  padding: 16px;
  background: #f9fafb;
  border-radius: 4px;
  margin-bottom: 12px;

  .result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .result-time {
      font-size: 12px;
      color: #909399;
    }
  }

  .result-content {
    margin-bottom: 8px;

    pre {
      margin: 8px 0;
      padding: 8px;
      background: #fff;
      border-radius: 4px;
      font-size: 12px;
      color: #606266;
      overflow-x: auto;
    }
  }
}

.stat-card {
  .stat-content {
    display: flex;
    align-items: center;
    gap: 16px;

    .stat-icon {
      width: 64px;
      height: 64px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-info {
      flex: 1;

      .stat-value {
        font-size: 28px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 14px;
        color: #909399;
      }
    }
  }
}

.chart-container {
  padding: 8px 0;
}

.trend-item {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;

  .trend-date {
    width: 80px;
    font-size: 12px;
    color: #606266;
  }

  .trend-bars {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .trend-bar-wrapper {
    width: 100%;
  }

  .trend-bar {
    height: 24px;
    line-height: 24px;
    padding: 0 8px;
    border-radius: 4px;
    font-size: 12px;
    color: #fff;
    font-weight: 500;
    transition: all 0.3s;

    &.pass {
      background: #67c23a;
    }

    &.fail {
      background: #f56c6c;
    }
  }
}

.errors-list {
  padding: 8px 0;
}

.error-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;

  &:last-child {
    border-bottom: none;
  }

  .error-rank {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #f5f7fa;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    color: #606266;
    font-size: 14px;
  }

  .error-info {
    flex: 1;

    .error-name {
      font-size: 14px;
      color: #303133;
      margin-bottom: 4px;
    }
  }

  .error-count {
    font-size: 18px;
    font-weight: 600;
    color: #f56c6c;
  }
}

.template-card {
  margin-bottom: 16px;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
  }

  .template-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;

    h4 {
      margin: 0;
      font-size: 16px;
      color: #303133;
    }

    .template-badges {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .favorite-icon {
      cursor: pointer;
      font-size: 18px;
      color: #dcdfe6;
      transition: color 0.3s;

      &:hover {
        color: #f7ba2a;
      }

      &.active {
        color: #f7ba2a;
      }
    }
  }

  .template-desc {
    margin: 0 0 12px 0;
    font-size: 14px;
    color: #606266;
    line-height: 1.6;
  }

  .template-meta {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    font-size: 12px;
    color: #909399;
  }

  .template-actions {
    display: flex;
    gap: 8px;
  }
}

:deep(.el-card) {
  border-radius: 8px;
}

:deep(.el-table) {
  font-size: 13px;
}

:deep(.el-dialog) {
  border-radius: 8px;
}
</style>