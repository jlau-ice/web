<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'

// 类型定义
interface ValidationRule {
  id: number
  ruleName: string
  fieldName: string
  validationType: 'completeness' | 'uniqueness' | 'format' | 'business'
  ruleConfig: any
  enabled: boolean
  createTime: string
}

interface ValidationResult {
  id: number
  fieldName: string
  validationType: string
  result: 'pass' | 'fail'
  errorCount: number
  totalCount: number
  abnormalMark: string[]
  executeTime: string
  message: string
}

interface QualityReport {
  id: number
  reportName: string
  reportType: 'PDF' | 'Excel'
  generateTime: string
  status: 'generating' | 'completed' | 'failed'
  passRate: number
  totalChecks: number
}

// 状态管理
const loading = ref(false)
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const resultFilter = ref<string>('all')

// 校验规则数据
const validationRules = ref<ValidationRule[]>([
  {
    id: 1,
    ruleName: '用户ID完整性检查',
    fieldName: 'user_id',
    validationType: 'completeness',
    ruleConfig: { allowNull: false, allowEmpty: false },
    enabled: true,
    createTime: '2025-10-20 09:00:00'
  },
  {
    id: 2,
    ruleName: '邮箱唯一性验证',
    fieldName: 'email',
    validationType: 'uniqueness',
    ruleConfig: { scope: 'global' },
    enabled: true,
    createTime: '2025-10-20 09:30:00'
  },
  {
    id: 3,
    ruleName: '手机号格式校验',
    fieldName: 'phone',
    validationType: 'format',
    ruleConfig: { pattern: '^1[3-9]\\d{9}$' },
    enabled: true,
    createTime: '2025-10-20 10:00:00'
  },
  {
    id: 4,
    ruleName: '年龄范围业务规则',
    fieldName: 'age',
    validationType: 'business',
    ruleConfig: { min: 18, max: 65, operator: 'between' },
    enabled: true,
    createTime: '2025-10-20 10:30:00'
  },
  {
    id: 5,
    ruleName: '身份证格式验证',
    fieldName: 'id_card',
    validationType: 'format',
    ruleConfig: { pattern: '^\\d{17}[\\dXx]$' },
    enabled: false,
    createTime: '2025-10-20 11:00:00'
  }
])

// 校验结果数据
const validationResults = ref<ValidationResult[]>([
  {
    id: 1,
    fieldName: 'user_id',
    validationType: '完整性检查',
    result: 'pass',
    errorCount: 0,
    totalCount: 10000,
    abnormalMark: [],
    executeTime: '2025-10-28 08:30:00',
    message: '所有记录均完整'
  },
  {
    id: 2,
    fieldName: 'email',
    validationType: '唯一性验证',
    result: 'fail',
    errorCount: 23,
    totalCount: 10000,
    abnormalMark: ['重复值', '数据异常'],
    executeTime: '2025-10-28 08:31:00',
    message: '发现23条重复邮箱'
  },
  {
    id: 3,
    fieldName: 'phone',
    validationType: '格式校验',
    result: 'fail',
    errorCount: 15,
    totalCount: 10000,
    abnormalMark: ['格式错误'],
    executeTime: '2025-10-28 08:32:00',
    message: '15条记录格式不正确'
  },
  {
    id: 4,
    fieldName: 'age',
    validationType: '业务规则',
    result: 'pass',
    errorCount: 0,
    totalCount: 10000,
    abnormalMark: [],
    executeTime: '2025-10-28 08:33:00',
    message: '所有年龄在合理范围内'
  },
  {
    id: 5,
    fieldName: 'salary',
    validationType: '完整性检查',
    result: 'fail',
    errorCount: 156,
    totalCount: 10000,
    abnormalMark: ['缺失值', '空值'],
    executeTime: '2025-10-28 08:34:00',
    message: '156条记录缺失薪资数据'
  },
  {
    id: 6,
    fieldName: 'create_date',
    validationType: '格式校验',
    result: 'pass',
    errorCount: 0,
    totalCount: 10000,
    abnormalMark: [],
    executeTime: '2025-10-28 08:35:00',
    message: '所有日期格式正确'
  }
])

// 质量报告数据
const qualityReports = ref<QualityReport[]>([
  {
    id: 1,
    reportName: '2025年10月数据质量报告',
    reportType: 'PDF',
    generateTime: '2025-10-28 09:00:00',
    status: 'completed',
    passRate: 85.6,
    totalChecks: 6
  },
  {
    id: 2,
    reportName: '数据质量周报_202543周',
    reportType: 'Excel',
    generateTime: '2025-10-27 18:00:00',
    status: 'completed',
    passRate: 82.3,
    totalChecks: 6
  },
  {
    id: 3,
    reportName: '异常数据详细报告',
    reportType: 'PDF',
    generateTime: '2025-10-26 16:30:00',
    status: 'completed',
    passRate: 78.9,
    totalChecks: 6
  }
])

// 规则对话框
const ruleDialogVisible = ref(false)
const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  id: 0,
  ruleName: '',
  fieldName: '',
  validationType: 'completeness' as 'completeness' | 'uniqueness' | 'format' | 'business',
  ruleConfig: {},
  enabled: true
})

const ruleFormRules = {
  ruleName: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  fieldName: [{ required: true, message: '请输入字段名称', trigger: 'blur' }],
  validationType: [{ required: true, message: '请选择校验类型', trigger: 'change' }]
}

// 报告生成对话框
const reportDialogVisible = ref(false)
const reportForm = reactive({
  reportName: '',
  reportType: 'PDF' as 'PDF' | 'Excel',
  includeDetails: true,
  includeCharts: true
})

// 报告详情对话框
const reportDetailVisible = ref(false)
const currentReport = ref<QualityReport | null>(null)

// 统计数据
const qualityStats = computed(() => {
  const total = validationResults.value.length
  const passed = validationResults.value.filter(r => r.result === 'pass').length
  const failed = total - passed
  const totalErrors = validationResults.value.reduce((sum, r) => sum + r.errorCount, 0)
  const totalRecords = validationResults.value.length > 0 ? validationResults.value[0].totalCount : 0
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0'
  
  return { total, passed, failed, totalErrors, totalRecords, passRate }
})

// 计算属性 - 筛选后的校验结果
const filteredResults = computed(() => {
  let results = validationResults.value
  
  // 按结果筛选
  if (resultFilter.value && resultFilter.value !== 'all') {
    results = results.filter(r => r.result === resultFilter.value)
  }
  
  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    results = results.filter(r => 
      r.fieldName.toLowerCase().includes(keyword) ||
      r.validationType.toLowerCase().includes(keyword)
    )
  }
  
  return results
})

// 分页后的数据
const paginatedResults = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredResults.value.slice(start, end)
})

// 校验规则操作
const handleAddRule = () => {
  Object.assign(ruleForm, {
    id: 0,
    ruleName: '',
    fieldName: '',
    validationType: 'completeness',
    ruleConfig: {},
    enabled: true
  })
  ruleDialogVisible.value = true
}

const handleEditRule = (row: ValidationRule) => {
  Object.assign(ruleForm, { ...row })
  ruleDialogVisible.value = true
}

const handleDeleteRule = (row: ValidationRule) => {
  ElMessageBox.confirm('确认删除该校验规则？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    loading.value = true
    setTimeout(() => {
      const index = validationRules.value.findIndex(item => item.id === row.id)
      if (index > -1) {
        validationRules.value.splice(index, 1)
        ElMessage.success('删除成功')
      }
      loading.value = false
    }, 500)
  }).catch(() => {})
}

const handleToggleRule = (row: ValidationRule) => {
  loading.value = true
  setTimeout(() => {
    row.enabled = !row.enabled
    ElMessage.success(row.enabled ? '规则已启用' : '规则已停用')
    loading.value = false
  }, 300)
}

const submitRuleForm = async () => {
  if (!ruleFormRef.value) return
  await ruleFormRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      setTimeout(() => {
        if (ruleForm.id === 0) {
          const newRule = {
            ...ruleForm,
            id: Date.now(),
            createTime: new Date().toLocaleString('zh-CN')
          }
          validationRules.value.push(newRule)
          ElMessage.success('规则添加成功')
        } else {
          const index = validationRules.value.findIndex(item => item.id === ruleForm.id)
          if (index > -1) {
            validationRules.value[index] = {
              ...ruleForm,
              createTime: validationRules.value[index].createTime
            }
            ElMessage.success('规则更新成功')
          }
        }
        ruleDialogVisible.value = false
        loading.value = false
      }, 800)
    }
  })
}

// 执行校验
const handleExecuteValidation = (row: ValidationResult) => {
  loading.value = true
  ElMessage.info('开始执行校验...')
  setTimeout(() => {
    row.executeTime = new Date().toLocaleString('zh-CN')
    row.result = Math.random() > 0.5 ? 'pass' : 'fail'
    row.errorCount = row.result === 'pass' ? 0 : Math.floor(Math.random() * 100)
    ElMessage.success('校验执行完成')
    loading.value = false
  }, 2000)
}

// 查看详情
const handleViewDetail = (row: ValidationResult) => {
  ElMessageBox.alert(
    `字段名称: ${row.fieldName}\n` +
    `校验类型: ${row.validationType}\n` +
    `校验结果: ${row.result === 'pass' ? '通过' : '失败'}\n` +
    `错误数量: ${row.errorCount}\n` +
    `总记录数: ${row.totalCount}\n` +
    `异常标记: ${row.abnormalMark.join(', ') || '无'}\n` +
    `执行时间: ${row.executeTime}\n` +
    `详细信息: ${row.message}`,
    '校验详情',
    {
      confirmButtonText: '确定',
      type: 'info'
    }
  )
}

// 批量执行校验
const handleBatchValidation = () => {
  loading.value = true
  ElMessage.info('开始批量校验...')
  setTimeout(() => {
    validationResults.value.forEach(item => {
      item.executeTime = new Date().toLocaleString('zh-CN')
      item.result = Math.random() > 0.3 ? 'pass' : 'fail'
      item.errorCount = item.result === 'pass' ? 0 : Math.floor(Math.random() * 100)
    })
    ElMessage.success('批量校验完成')
    loading.value = false
  }, 3000)
}

// 报告生成
const handleGenerateReport = () => {
  Object.assign(reportForm, {
    reportName: `数据质量报告_${new Date().toLocaleDateString('zh-CN')}`,
    reportType: 'PDF',
    includeDetails: true,
    includeCharts: true
  })
  reportDialogVisible.value = true
}

const submitReportForm = () => {
  loading.value = true
  ElMessage.info('开始生成报告...')
  setTimeout(() => {
    const newReport: QualityReport = {
      id: Date.now(),
      reportName: reportForm.reportName,
      reportType: reportForm.reportType,
      generateTime: new Date().toLocaleString('zh-CN'),
      status: 'completed',
      passRate: parseFloat(qualityStats.value.passRate),
      totalChecks: validationResults.value.length
    }
    qualityReports.value.unshift(newReport)
    reportDialogVisible.value = false
    loading.value = false
    ElMessage.success('报告生成成功')
  }, 2000)
}

// 查看报告
const handleViewReport = (row: QualityReport) => {
  currentReport.value = row
  reportDetailVisible.value = true
}

// 下载报告
const handleDownloadReport = (row: QualityReport) => {
  loading.value = true
  ElMessage.info('开始下载报告...')
  setTimeout(() => {
    ElMessage.success(`报告 ${row.reportName}.${row.reportType.toLowerCase()} 下载成功`)
    loading.value = false
  }, 1500)
}

// 获取校验类型标签
const getValidationTypeTag = (type: string) => {
  const typeMap: Record<string, { label: string; type: any }> = {
    completeness: { label: '完整性', type: 'primary' },
    uniqueness: { label: '唯一性', type: 'success' },
    format: { label: '格式校验', type: 'warning' },
    business: { label: '业务规则', type: 'danger' }
  }
  return typeMap[type] || { label: type, type: 'info' }
}
</script>

<template>
  <div class="quality-manage-container">
    <!-- 页面标题 -->
    <el-card class="header-card" shadow="never">
      <div class="header-content">
        <div class="header-left">
          <h2>数据质量管理</h2>
          <p class="subtitle">全面的数据校验功能，确保数据的准确性和完整性</p>
        </div>
        <div class="header-right">
          <el-button type="primary" @click="handleBatchValidation" :loading="loading">
            <el-icon><VideoPlay /></el-icon>
            批量校验
          </el-button>
          <el-button type="success" @click="handleGenerateReport" :loading="loading">
            <el-icon><Document /></el-icon>
            生成报告
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <div class="stat-icon total">
              <el-icon><DataAnalysis /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ qualityStats.total }}</div>
              <div class="stat-label">总校验项</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <div class="stat-icon passed">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ qualityStats.passed }}</div>
              <div class="stat-label">通过项</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <div class="stat-icon failed">
              <el-icon><CircleClose /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ qualityStats.failed }}</div>
              <div class="stat-label">失败项</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <div class="stat-icon rate">
              <el-icon><Medal /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ qualityStats.passRate }}%</div>
              <div class="stat-label">通过率</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 校验规则配置 -->
    <el-card class="section-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><Setting /></el-icon>
            校验规则配置
          </span>
          <el-button type="primary" @click="handleAddRule">
            <el-icon><Plus /></el-icon>
            新增规则
          </el-button>
        </div>
      </template>

      <el-table :data="validationRules" :loading="loading" stripe style="width: 100%">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="ruleName" label="规则名称" min-width="180" />
        <el-table-column prop="fieldName" label="字段名称" width="150" />
        <el-table-column label="校验类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getValidationTypeTag(row.validationType).type" size="small">
              {{ getValidationTypeTag(row.validationType).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="规则配置" min-width="200">
          <template #default="{ row }">
            <span class="config-text">{{ JSON.stringify(row.ruleConfig) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
              {{ row.enabled ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleToggleRule(row)">
              <el-icon><Switch /></el-icon>
              {{ row.enabled ? '停用' : '启用' }}
            </el-button>
            <el-button link type="primary" @click="handleEditRule(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button link type="danger" @click="handleDeleteRule(row)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 数据质量监控列表 -->
    <el-card class="section-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><Monitor /></el-icon>
            数据质量监控
          </span>
          <div class="card-actions">
            <el-select v-model="resultFilter" placeholder="筛选结果" style="width: 120px; margin-right: 10px">
              <el-option label="全部" value="all" />
              <el-option label="通过" value="pass" />
              <el-option label="失败" value="fail" />
            </el-select>
            <el-input
              v-model="searchKeyword"
              placeholder="搜索字段名"
              clearable
              style="width: 200px"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
        </div>
      </template>

      <el-table :data="paginatedResults" :loading="loading" stripe style="width: 100%">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="fieldName" label="字段名称" width="150" />
        <el-table-column prop="validationType" label="校验类型" width="120" />
        <el-table-column label="校验结果" width="100">
          <template #default="{ row }">
            <el-tag :type="row.result === 'pass' ? 'success' : 'danger'" size="small">
              {{ row.result === 'pass' ? '通过' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="错误率" width="120">
          <template #default="{ row }">
            <span :class="row.errorCount > 0 ? 'error-rate' : 'success-rate'">
              {{ row.totalCount > 0 ? ((row.errorCount / row.totalCount) * 100).toFixed(2) : 0 }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column label="异常标记" min-width="200">
          <template #default="{ row }">
            <el-tag
              v-for="(mark, index) in row.abnormalMark"
              :key="index"
              type="warning"
              size="small"
              style="margin-right: 5px"
            >
              {{ mark }}
            </el-tag>
            <span v-if="row.abnormalMark.length === 0" class="no-mark">无异常</span>
          </template>
        </el-table-column>
        <el-table-column prop="executeTime" label="执行时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleExecuteValidation(row)">
              <el-icon><Refresh /></el-icon>
              重新校验
            </el-button>
            <el-button link type="primary" @click="handleViewDetail(row)">
              <el-icon><View /></el-icon>
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[5, 10, 20, 50]"
          :total="filteredResults.length"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </el-card>

    <!-- 质量报告列表 -->
    <el-card class="section-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><Files /></el-icon>
            质量报告列表
          </span>
        </div>
      </template>

      <el-table :data="qualityReports" :loading="loading" stripe style="width: 100%">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="reportName" label="报告名称" min-width="200" />
        <el-table-column label="报告类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.reportType === 'PDF' ? 'danger' : 'success'" size="small">
              {{ row.reportType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="通过率" width="120">
          <template #default="{ row }">
            <div class="pass-rate-cell">
              <el-progress
                :percentage="row.passRate"
                :color="row.passRate >= 80 ? '#67c23a' : row.passRate >= 60 ? '#e6a23c' : '#f56c6c'"
                :stroke-width="8"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="totalChecks" label="校验项数" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="row.status === 'completed' ? 'success' : row.status === 'generating' ? 'warning' : 'danger'"
              size="small"
            >
              {{ row.status === 'completed' ? '已完成' : row.status === 'generating' ? '生成中' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="generateTime" label="生成时间" width="160" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleViewReport(row)">
              <el-icon><View /></el-icon>
              查看
            </el-button>
            <el-button
              link
              type="success"
              @click="handleDownloadReport(row)"
              :disabled="row.status !== 'completed'"
            >
              <el-icon><Download /></el-icon>
              下载
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 规则配置对话框 -->
    <el-dialog
      v-model="ruleDialogVisible"
      :title="ruleForm.id ? '编辑校验规则' : '新增校验规则'"
      width="600px"
    >
      <el-form
        ref="ruleFormRef"
        :model="ruleForm"
        :rules="ruleFormRules"
        label-width="100px"
      >
        <el-form-item label="规则名称" prop="ruleName">
          <el-input v-model="ruleForm.ruleName" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="字段名称" prop="fieldName">
          <el-input v-model="ruleForm.fieldName" placeholder="请输入字段名称" />
        </el-form-item>
        <el-form-item label="校验类型" prop="validationType">
          <el-select v-model="ruleForm.validationType" style="width: 100%">
            <el-option label="完整性检查" value="completeness" />
            <el-option label="唯一性验证" value="uniqueness" />
            <el-option label="格式校验" value="format" />
            <el-option label="业务规则" value="business" />
          </el-select>
        </el-form-item>
        <el-form-item label="规则配置">
          <el-input
            v-model="ruleForm.ruleConfig"
            type="textarea"
            :rows="3"
            placeholder='如: {"allowNull": false, "pattern": "^\\d+$"}'
          />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="ruleForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ruleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRuleForm" :loading="loading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 报告生成对话框 -->
    <el-dialog v-model="reportDialogVisible" title="生成数据质量报告" width="500px">
      <el-form :model="reportForm" label-width="100px">
        <el-form-item label="报告名称">
          <el-input v-model="reportForm.reportName" placeholder="请输入报告名称" />
        </el-form-item>
        <el-form-item label="报告类型">
          <el-radio-group v-model="reportForm.reportType">
            <el-radio label="PDF">PDF</el-radio>
            <el-radio label="Excel">Excel</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="包含详情">
          <el-switch v-model="reportForm.includeDetails" />
        </el-form-item>
        <el-form-item label="包含图表">
          <el-switch v-model="reportForm.includeCharts" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reportDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReportForm" :loading="loading">
          生成
        </el-button>
      </template>
    </el-dialog>

    <!-- 报告详情对话框 -->
    <el-dialog v-model="reportDetailVisible" title="报告详情" width="700px">
      <div v-if="currentReport" class="report-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="报告名称">
            {{ currentReport.reportName }}
          </el-descriptions-item>
          <el-descriptions-item label="报告类型">
            <el-tag :type="currentReport.reportType === 'PDF' ? 'danger' : 'success'" size="small">
              {{ currentReport.reportType }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="生成时间">
            {{ currentReport.generateTime }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag
              :type="currentReport.status === 'completed' ? 'success' : 'warning'"
              size="small"
            >
              {{ currentReport.status === 'completed' ? '已完成' : '生成中' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="通过率">
            <span :style="{ color: currentReport.passRate >= 80 ? '#67c23a' : '#f56c6c', fontWeight: 'bold' }">
              {{ currentReport.passRate }}%
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="校验项数">
            {{ currentReport.totalChecks }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="report-summary">
          <h4>质量概况</h4>
          <el-row :gutter="16">
            <el-col :span="8">
              <div class="summary-item">
                <div class="summary-label">总记录数</div>
                <div class="summary-value">{{ qualityStats.totalRecords }}</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="summary-item">
                <div class="summary-label">异常记录</div>
                <div class="summary-value error">{{ qualityStats.totalErrors }}</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="summary-item">
                <div class="summary-label">健康记录</div>
                <div class="summary-value success">
                  {{ qualityStats.totalRecords - qualityStats.totalErrors }}
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="reportDetailVisible = false">
          关闭
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.quality-manage-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;

  .header-card {
    margin-bottom: 20px;
    border-radius: 8px;

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-left {
        h2 {
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 600;
          color: #303133;
        }

        .subtitle {
          margin: 0;
          font-size: 14px;
          color: #909399;
        }
      }

      .header-right {
        display: flex;
        gap: 10px;
      }
    }
  }

  .stats-row {
    margin-bottom: 20px;

    .stat-card {
      border-radius: 8px;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-4px);
      }

      .stat-item {
        display: flex;
        align-items: center;
        gap: 16px;

        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: white;

          &.total {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }

          &.passed {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
          }

          &.failed {
            background: linear-gradient(135deg, #ee0979 0%, #ff6a00 100%);
          }

          &.rate {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          }
        }

        .stat-info {
          .stat-value {
            font-size: 28px;
            font-weight: 700;
            color: #303133;
            line-height: 1;
            margin-bottom: 8px;
          }

          .stat-label {
            font-size: 14px;
            color: #909399;
          }
        }
      }
    }
  }

  .section-card {
    margin-bottom: 20px;
    border-radius: 8px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .card-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }

      .card-actions {
        display: flex;
        align-items: center;
      }
    }
  }

  .config-text {
    color: #606266;
    font-size: 12px;
    font-family: 'Courier New', monospace;
  }

  .error-rate {
    color: #f56c6c;
    font-weight: 500;
  }

  .success-rate {
    color: #67c23a;
    font-weight: 500;
  }

  .no-mark {
    color: #909399;
    font-size: 12px;
  }

  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .pass-rate-cell {
    padding: 0 10px;
  }

  .report-detail {
    .report-summary {
      margin-top: 20px;
      padding: 20px;
      background: #f5f7fa;
      border-radius: 8px;

      h4 {
        margin: 0 0 16px 0;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }

      .summary-item {
        text-align: center;
        padding: 16px;
        background: white;
        border-radius: 8px;

        .summary-label {
          font-size: 14px;
          color: #909399;
          margin-bottom: 8px;
        }

        .summary-value {
          font-size: 24px;
          font-weight: 700;
          color: #303133;

          &.error {
            color: #f56c6c;
          }

          &.success {
            color: #67c23a;
          }
        }
      }
    }
  }

  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid #ebeef5;
  }

  :deep(.el-card__body) {
    padding: 20px;
  }

  :deep(.el-table) {
    font-size: 14px;
  }

  :deep(.el-button + .el-button) {
    margin-left: 0;
  }

  :deep(.el-descriptions) {
    margin-top: 10px;
  }
}
</style>