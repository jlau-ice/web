<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// 定义校验规则接口
interface QualityRuleItem {
  id: number
  ruleName: string
  ruleCode: string
  checkType: string
  targetField: string
  ruleExpression: string
  status: string
  isEnabled: boolean
  description: string
  createTime: string
  updateTime: string
}

// 定义校验结果接口
interface CheckResultItem {
  id: number
  ruleName: string
  ruleCode: string
  checkType: string
  targetField: string
  checkResult: string
  passCount: number
  failCount: number
  passRate: number
  exceptionMark: string
  executeTime: string
  remark: string
}

// 定义报告接口
interface ReportItem {
  id: number
  reportName: string
  reportType: string
  generateTime: string
  status: string
}

// 定义表单数据接口
interface QualityRuleForm {
  id?: number
  ruleName: string
  ruleCode: string
  checkType: string
  targetField: string
  ruleExpression: string
  status: string
  isEnabled: boolean
  description: string
}

// Tab切换
const activeTab = ref('results')

// 搜索表单
const searchForm = reactive({
  keyword: '',
  checkType: '',
  checkResult: ''
})

// 规则搜索表单
const ruleSearchForm = reactive({
  keyword: '',
  checkType: '',
  status: ''
})

// 分页数据 - 校验结果
const resultPagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 分页数据 - 校验规则
const rulePagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 表格数据
const resultTableData = ref<CheckResultItem[]>([])
const ruleTableData = ref<QualityRuleItem[]>([])
const reportTableData = ref<ReportItem[]>([])
const loading = ref(false)

// 弹窗控制
const ruleDialogVisible = ref(false)
const reportDialogVisible = ref(false)
const dialogTitle = ref('新增校验规则')
const formRef = ref<FormInstance>()

// 表单数据
const formData = reactive<QualityRuleForm>({
  ruleName: '',
  ruleCode: '',
  checkType: '',
  targetField: '',
  ruleExpression: '',
  status: '启用',
  isEnabled: true,
  description: ''
})

// Mock 数据源 - 校验规则
const mockRules: QualityRuleItem[] = [
  {
    id: 1,
    ruleName: '农产品编码完整性检查',
    ruleCode: 'RULE-001',
    checkType: '完整性校验',
    targetField: 'product_code',
    ruleExpression: 'NOT NULL AND LENGTH >= 10',
    status: '启用',
    isEnabled: true,
    description: '检查农产品编码字段是否为空且长度不少于10位',
    createTime: '2024-01-10 09:30:00',
    updateTime: '2024-03-15 14:20:00'
  },
  {
    id: 2,
    ruleName: '种植面积合理性校验',
    ruleCode: 'RULE-002',
    checkType: '业务规则',
    targetField: 'planting_area',
    ruleExpression: 'VALUE > 0 AND VALUE <= 10000',
    status: '启用',
    isEnabled: true,
    description: '种植面积应在0-10000亩范围内',
    createTime: '2024-01-15 10:00:00',
    updateTime: '2024-03-20 11:30:00'
  },
  {
    id: 3,
    ruleName: '手机号格式校验',
    ruleCode: 'RULE-003',
    checkType: '格式校验',
    targetField: 'farmer_phone',
    ruleExpression: 'REGEX: ^1[3-9]\\d{9}$',
    status: '启用',
    isEnabled: true,
    description: '检查农户手机号是否符合11位数字格式',
    createTime: '2024-02-01 15:45:00',
    updateTime: '2024-02-01 15:45:00'
  },
  {
    id: 4,
    ruleName: '农产品唯一标识校验',
    ruleCode: 'RULE-004',
    checkType: '唯一性校验',
    targetField: 'product_unique_id',
    ruleExpression: 'UNIQUE',
    status: '启用',
    isEnabled: true,
    description: '检查农产品唯一标识是否存在重复',
    createTime: '2024-02-10 11:20:00',
    updateTime: '2024-03-10 16:40:00'
  },
  {
    id: 5,
    ruleName: '采收日期逻辑校验',
    ruleCode: 'RULE-005',
    checkType: '业务规则',
    targetField: 'harvest_date',
    ruleExpression: 'harvest_date >= planting_date AND harvest_date <= TODAY',
    status: '启用',
    isEnabled: true,
    description: '采收日期不能早于种植日期，且不能晚于当前日期',
    createTime: '2024-02-15 14:15:00',
    updateTime: '2024-03-12 09:25:00'
  },
  {
    id: 6,
    ruleName: '农药残留量范围检查',
    ruleCode: 'RULE-006',
    checkType: '业务规则',
    targetField: 'pesticide_residue',
    ruleExpression: 'VALUE >= 0 AND VALUE <= 0.5',
    status: '停用',
    isEnabled: false,
    description: '农药残留量应在0-0.5mg/kg范围内',
    createTime: '2024-03-01 10:30:00',
    updateTime: '2024-03-15 17:00:00'
  }
]

// Mock 数据源 - 校验结果
const mockResults: CheckResultItem[] = [
  {
    id: 1,
    ruleName: '农产品编码完整性检查',
    ruleCode: 'RULE-001',
    checkType: '完整性校验',
    targetField: 'product_code',
    checkResult: '通过',
    passCount: 9856,
    failCount: 144,
    passRate: 98.56,
    exceptionMark: '正常',
    executeTime: '2024-03-28 09:00:00',
    remark: '少量数据编码格式不完整'
  },
  {
    id: 2,
    ruleName: '种植面积合理性校验',
    ruleCode: 'RULE-002',
    checkType: '业务规则',
    targetField: 'planting_area',
    checkResult: '通过',
    passCount: 5420,
    failCount: 8,
    passRate: 99.85,
    exceptionMark: '正常',
    executeTime: '2024-03-28 09:05:00',
    remark: '极少数异常值'
  },
  {
    id: 3,
    ruleName: '手机号格式校验',
    ruleCode: 'RULE-003',
    checkType: '格式校验',
    targetField: 'farmer_phone',
    checkResult: '失败',
    passCount: 3256,
    failCount: 456,
    passRate: 87.71,
    exceptionMark: '异常',
    executeTime: '2024-03-28 09:10:00',
    remark: '存在较多固定电话和格式错误'
  },
  {
    id: 4,
    ruleName: '农产品唯一标识校验',
    ruleCode: 'RULE-004',
    checkType: '唯一性校验',
    targetField: 'product_unique_id',
    checkResult: '失败',
    passCount: 8920,
    failCount: 1080,
    passRate: 89.20,
    exceptionMark: '警告',
    executeTime: '2024-03-28 09:15:00',
    remark: '发现重复标识，需要人工介入处理'
  },
  {
    id: 5,
    ruleName: '采收日期逻辑校验',
    ruleCode: 'RULE-005',
    checkType: '业务规则',
    targetField: 'harvest_date',
    checkResult: '通过',
    passCount: 6543,
    failCount: 12,
    passRate: 99.82,
    exceptionMark: '正常',
    executeTime: '2024-03-28 09:20:00',
    remark: '日期逻辑正常'
  },
  {
    id: 6,
    ruleName: '农产品编码完整性检查',
    ruleCode: 'RULE-001',
    checkType: '完整性校验',
    targetField: 'product_code',
    checkResult: '通过',
    passCount: 9867,
    failCount: 133,
    passRate: 98.67,
    exceptionMark: '正常',
    executeTime: '2024-03-27 09:00:00',
    remark: '数据质量稳定'
  },
  {
    id: 7,
    ruleName: '手机号格式校验',
    ruleCode: 'RULE-003',
    checkType: '格式校验',
    targetField: 'farmer_phone',
    checkResult: '失败',
    passCount: 3198,
    failCount: 514,
    passRate: 86.15,
    exceptionMark: '异常',
    executeTime: '2024-03-27 09:10:00',
    remark: '格式问题持续存在'
  },
  {
    id: 8,
    ruleName: '种植面积合理性校验',
    ruleCode: 'RULE-002',
    checkType: '业务规则',
    targetField: 'planting_area',
    checkResult: '通过',
    passCount: 5415,
    failCount: 13,
    passRate: 99.76,
    exceptionMark: '正常',
    executeTime: '2024-03-27 09:05:00',
    remark: '数据合理'
  }
]

// Mock 数据源 - 报告列表
const mockReports: ReportItem[] = [
  {
    id: 1,
    reportName: '2024年3月数据质量月度报告',
    reportType: 'PDF',
    generateTime: '2024-03-28 10:30:00',
    status: '已生成'
  },
  {
    id: 2,
    reportName: '农产品数据质量分析报告',
    reportType: 'Excel',
    generateTime: '2024-03-25 15:20:00',
    status: '已生成'
  },
  {
    id: 3,
    reportName: '2024年第一季度质量报告',
    reportType: 'PDF',
    generateTime: '2024-03-20 09:00:00',
    status: '已生成'
  }
]

// 校验类型选项
const checkTypeOptions = [
  { label: '完整性校验', value: '完整性校验' },
  { label: '唯一性校验', value: '唯一性校验' },
  { label: '格式校验', value: '格式校验' },
  { label: '业务规则', value: '业务规则' },
  { label: '一致性校验', value: '一致性校验' }
]

// 校验结果选项
const checkResultOptions = [
  { label: '全部', value: '' },
  { label: '通过', value: '通过' },
  { label: '失败', value: '失败' }
]

// 状态选项
const statusOptions = [
  { label: '全部', value: '' },
  { label: '启用', value: '启用' },
  { label: '停用', value: '停用' }
]

// 结果颜色映射
const resultColorMap: Record<string, string> = {
  '通过': 'success',
  '失败': 'danger'
}

// 异常标记颜色映射
const exceptionColorMap: Record<string, string> = {
  '正常': 'success',
  '警告': 'warning',
  '异常': 'danger'
}

// 表单验证规则
const rules: FormRules = {
  ruleName: [
    { required: true, message: '请输入规则名称', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  ruleCode: [
    { required: true, message: '请输入规则编码', trigger: 'blur' },
    { 
      pattern: /^RULE-\d{3}$/, 
      message: '格式：RULE-编号（如：RULE-001）', 
      trigger: 'blur' 
    },
    {
      validator: (rule, value, callback) => {
        const exists = mockRules.some(item => 
          item.ruleCode === value && item.id !== formData.id
        )
        if (exists) {
          callback(new Error('该规则编码已存在'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  checkType: [
    { required: true, message: '请选择校验类型', trigger: 'change' }
  ],
  targetField: [
    { required: true, message: '请输入目标字段', trigger: 'blur' }
  ],
  ruleExpression: [
    { required: true, message: '请输入规则表达式', trigger: 'blur' }
  ]
}

// 计算过滤后的校验结果数据
const filteredResults = computed(() => {
  let data = [...mockResults]

  if (searchForm.keyword) {
    const keyword = searchForm.keyword.toLowerCase()
    data = data.filter(item => 
      item.ruleName.toLowerCase().includes(keyword) ||
      item.ruleCode.toLowerCase().includes(keyword) ||
      item.targetField.toLowerCase().includes(keyword)
    )
  }

  if (searchForm.checkType) {
    data = data.filter(item => item.checkType === searchForm.checkType)
  }

  if (searchForm.checkResult) {
    data = data.filter(item => item.checkResult === searchForm.checkResult)
  }

  return data
})

// 计算过滤后的规则数据
const filteredRules = computed(() => {
  let data = [...mockRules]

  if (ruleSearchForm.keyword) {
    const keyword = ruleSearchForm.keyword.toLowerCase()
    data = data.filter(item => 
      item.ruleName.toLowerCase().includes(keyword) ||
      item.ruleCode.toLowerCase().includes(keyword) ||
      item.targetField.toLowerCase().includes(keyword)
    )
  }

  if (ruleSearchForm.checkType) {
    data = data.filter(item => item.checkType === ruleSearchForm.checkType)
  }

  if (ruleSearchForm.status) {
    data = data.filter(item => item.status === ruleSearchForm.status)
  }

  return data
})

// 加载校验结果数据
const loadResultData = () => {
  loading.value = true
  
  setTimeout(() => {
    const start = (resultPagination.currentPage - 1) * resultPagination.pageSize
    const end = start + resultPagination.pageSize
    resultTableData.value = filteredResults.value.slice(start, end)
    resultPagination.total = filteredResults.value.length
    loading.value = false
  }, 300)
}

// 加载规则数据
const loadRuleData = () => {
  loading.value = true
  
  setTimeout(() => {
    const start = (rulePagination.currentPage - 1) * rulePagination.pageSize
    const end = start + rulePagination.pageSize
    ruleTableData.value = filteredRules.value.slice(start, end)
    rulePagination.total = filteredRules.value.length
    loading.value = false
  }, 300)
}

// 加载报告数据
const loadReportData = () => {
  reportTableData.value = mockReports
}

// 搜索
const handleSearch = () => {
  resultPagination.currentPage = 1
  loadResultData()
}

// 重置搜索
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.checkType = ''
  searchForm.checkResult = ''
  resultPagination.currentPage = 1
  loadResultData()
}

// 规则搜索
const handleRuleSearch = () => {
  rulePagination.currentPage = 1
  loadRuleData()
}

// 规则重置
const handleRuleReset = () => {
  ruleSearchForm.keyword = ''
  ruleSearchForm.checkType = ''
  ruleSearchForm.status = ''
  rulePagination.currentPage = 1
  loadRuleData()
}

// 页码改变 - 结果
const handleResultCurrentChange = (page: number) => {
  resultPagination.currentPage = page
  loadResultData()
}

const handleResultSizeChange = (size: number) => {
  resultPagination.pageSize = size
  resultPagination.currentPage = 1
  loadResultData()
}

// 页码改变 - 规则
const handleRuleCurrentChange = (page: number) => {
  rulePagination.currentPage = page
  loadRuleData()
}

const handleRuleSizeChange = (size: number) => {
  rulePagination.pageSize = size
  rulePagination.currentPage = 1
  loadRuleData()
}

// 查看详情
const handleViewResult = (row: CheckResultItem) => {
  ElMessageBox.alert(
    `
    <div style="line-height: 2;">
      <p><strong>规则名称：</strong>${row.ruleName}</p>
      <p><strong>规则编码：</strong>${row.ruleCode}</p>
      <p><strong>校验类型：</strong>${row.checkType}</p>
      <p><strong>目标字段：</strong>${row.targetField}</p>
      <p><strong>校验结果：</strong><span style="color: ${row.checkResult === '通过' ? '#67C23A' : '#F56C6C'}">${row.checkResult}</span></p>
      <p><strong>通过数量：</strong>${row.passCount}</p>
      <p><strong>失败数量：</strong>${row.failCount}</p>
      <p><strong>通过率：</strong>${row.passRate}%</p>
      <p><strong>异常标记：</strong><span style="color: ${row.exceptionMark === '正常' ? '#67C23A' : row.exceptionMark === '警告' ? '#E6A23C' : '#F56C6C'}">${row.exceptionMark}</span></p>
      <p><strong>执行时间：</strong>${row.executeTime}</p>
      <p><strong>备注：</strong>${row.remark}</p>
    </div>
    `,
    '校验结果详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '关闭',
      customClass: 'detail-message-box'
    }
  )
}

// 执行校验
const handleExecuteCheck = (row: QualityRuleItem) => {
  ElMessageBox.confirm(
    `确定要执行规则 "${row.ruleName}" 的校验吗？`,
    '执行确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    loading.value = true
    setTimeout(() => {
      // 模拟生成新的校验结果
      const newResult: CheckResultItem = {
        id: mockResults.length + 1,
        ruleName: row.ruleName,
        ruleCode: row.ruleCode,
        checkType: row.checkType,
        targetField: row.targetField,
        checkResult: Math.random() > 0.3 ? '通过' : '失败',
        passCount: Math.floor(Math.random() * 10000),
        failCount: Math.floor(Math.random() * 500),
        passRate: 0,
        exceptionMark: '正常',
        executeTime: new Date().toLocaleString('zh-CN', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).replace(/\//g, '-'),
        remark: '手动执行校验'
      }
      newResult.passRate = parseFloat((newResult.passCount / (newResult.passCount + newResult.failCount) * 100).toFixed(2))
      newResult.exceptionMark = newResult.passRate >= 95 ? '正常' : newResult.passRate >= 85 ? '警告' : '异常'
      
      mockResults.unshift(newResult)
      loading.value = false
      ElMessage.success('校验执行成功')
      activeTab.value = 'results'
      loadResultData()
    }, 1500)
  }).catch(() => {
    ElMessage.info('已取消执行')
  })
}

// 新增规则
const handleAddRule = () => {
  dialogTitle.value = '新增校验规则'
  resetForm()
  ruleDialogVisible.value = true
}

// 编辑规则
const handleEditRule = (row: QualityRuleItem) => {
  dialogTitle.value = '编辑校验规则'
  Object.assign(formData, {
    id: row.id,
    ruleName: row.ruleName,
    ruleCode: row.ruleCode,
    checkType: row.checkType,
    targetField: row.targetField,
    ruleExpression: row.ruleExpression,
    status: row.status,
    isEnabled: row.isEnabled,
    description: row.description
  })
  ruleDialogVisible.value = true
}

// 删除规则
const handleDeleteRule = (row: QualityRuleItem) => {
  ElMessageBox.confirm(
    `确定要删除规则 "${row.ruleName}" 吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    setTimeout(() => {
      const index = mockRules.findIndex(item => item.id === row.id)
      if (index > -1) {
        mockRules.splice(index, 1)
      }
      ElMessage.success('删除成功')
      loadRuleData()
    }, 300)
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      
      setTimeout(() => {
        const currentTime = new Date().toLocaleString('zh-CN', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).replace(/\//g, '-')

        if (formData.id) {
          const index = mockRules.findIndex(item => item.id === formData.id)
          if (index > -1) {
            mockRules[index] = {
              ...mockRules[index],
              ruleName: formData.ruleName,
              ruleCode: formData.ruleCode,
              checkType: formData.checkType,
              targetField: formData.targetField,
              ruleExpression: formData.ruleExpression,
              status: formData.status,
              isEnabled: formData.isEnabled,
              description: formData.description,
              updateTime: currentTime
            }
          }
          ElMessage.success('编辑成功')
        } else {
          const newItem: QualityRuleItem = {
            id: Math.max(...mockRules.map(item => item.id)) + 1,
            ruleName: formData.ruleName,
            ruleCode: formData.ruleCode,
            checkType: formData.checkType,
            targetField: formData.targetField,
            ruleExpression: formData.ruleExpression,
            status: formData.status,
            isEnabled: formData.isEnabled,
            description: formData.description,
            createTime: currentTime,
            updateTime: currentTime
          }
          mockRules.unshift(newItem)
          ElMessage.success('新增成功')
        }
        
        loading.value = false
        ruleDialogVisible.value = false
        loadRuleData()
      }, 500)
    }
  })
}

// 重置表单
const resetForm = () => {
  formData.id = undefined
  formData.ruleName = ''
  formData.ruleCode = ''
  formData.checkType = ''
  formData.targetField = ''
  formData.ruleExpression = ''
  formData.status = '启用'
  formData.isEnabled = true
  formData.description = ''
  formRef.value?.clearValidate()
}

// 关闭弹窗
const handleClose = () => {
  ruleDialogVisible.value = false
  resetForm()
}

// 生成报告
const handleGenerateReport = (type: string) => {
  loading.value = true
  setTimeout(() => {
    const reportName = `数据质量${type === 'PDF' ? '综合' : '明细'}报告_${new Date().getTime()}`
    const newReport: ReportItem = {
      id: mockReports.length + 1,
      reportName,
      reportType: type,
      generateTime: new Date().toLocaleString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/\//g, '-'),
      status: '已生成'
    }
    mockReports.unshift(newReport)
    loading.value = false
    ElMessage.success(`${type}报告生成成功`)
    loadReportData()
  }, 2000)
}

// 下载报告
const handleDownloadReport = (row: ReportItem) => {
  ElMessage.success(`开始下载：${row.reportName}.${row.reportType.toLowerCase()}`)
}

// 查看报告
const handleViewReport = (row: ReportItem) => {
  ElMessage.info(`正在打开报告：${row.reportName}`)
}

// Tab切换
const handleTabChange = (name: string) => {
  if (name === 'results') {
    loadResultData()
  } else if (name === 'rules') {
    loadRuleData()
  } else if (name === 'reports') {
    loadReportData()
  }
}

// 生成规则编码
const generateRuleCode = () => {
  const maxNum = mockRules.reduce((max, item) => {
    const match = item.ruleCode.match(/\d+$/)
    if (match) {
      const num = parseInt(match[0])
      return num > max ? num : max
    }
    return max
  }, 0)

  const newNum = String(maxNum + 1).padStart(3, '0')
  formData.ruleCode = `RULE-${newNum}`
  ElMessage.success('规则编码已生成')
}

// 初始化
onMounted(() => {
  loadResultData()
})
</script>

<template>
  <div class="data-quality-check-container">
    <!-- 页面标题 -->
    <el-card class="header-card" shadow="never">
      <div class="page-header">
        <div class="header-content">
          <h2 class="page-title">数据质量探查与校验</h2>
          <p class="page-description">持续评估和改进数据质量，主动发现数据问题，建立数据信任</p>
        </div>
      </div>
    </el-card>

    <!-- Tab切换 -->
    <el-card class="content-card" shadow="never">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- 校验结果 -->
        <el-tab-pane label="校验结果" name="results">
          <!-- 搜索筛选 -->
          <el-form :model="searchForm" label-width="80px" class="search-form">
            <el-row :gutter="20">
              <el-col :span="5">
                <el-form-item label="关键字">
                  <el-input
                    v-model="searchForm.keyword"
                    placeholder="规则名称/编码/字段"
                    clearable
                    @keyup.enter="handleSearch"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="5">
                <el-form-item label="校验类型">
                  <el-select
                    v-model="searchForm.checkType"
                    placeholder="请选择类型"
                    clearable
                    style="width: 100%"
                  >
                    <el-option
                      v-for="type in checkTypeOptions"
                      :key="type.value"
                      :label="type.label"
                      :value="type.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="5">
                <el-form-item label="校验结果">
                  <el-select
                    v-model="searchForm.checkResult"
                    placeholder="请选择结果"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="result in checkResultOptions"
                      :key="result.value"
                      :label="result.label"
                      :value="result.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="4" class="search-actions">
                <el-button type="primary" @click="handleSearch">
                  <el-icon class="btn-icon"><Search /></el-icon>
                  搜索
                </el-button>
                <el-button @click="handleReset">
                  <el-icon class="btn-icon"><Refresh /></el-icon>
                  重置
                </el-button>
              </el-col>
            </el-row>

          </el-form>

          <!-- 表格 -->
          <el-table
            :data="resultTableData"
            :loading="loading"
            stripe
            border
            style="width: 100%; margin-top: 20px"
          >
            <el-table-column type="index" label="序号" width="60" align="center" />
            <el-table-column prop="ruleName" label="规则名称" width="180" show-overflow-tooltip />
            <el-table-column prop="ruleCode" label="规则编码" width="110" />
            <el-table-column prop="checkType" label="校验类型" width="110" align="center">
              <template #default="{ row }">
                <el-tag size="small" type="primary">{{ row.checkType }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="targetField" label="目标字段" width="140" show-overflow-tooltip />
            <el-table-column label="校验结果" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="resultColorMap[row.checkResult]" size="small">
                  {{ row.checkResult }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="通过率" width="100" align="center">
              <template #default="{ row }">
                <span :style="{ color: row.passRate >= 95 ? '#67C23A' : row.passRate >= 85 ? '#E6A23C' : '#F56C6C' }">
                  {{ row.passRate }}%
                </span>
              </template>
            </el-table-column>
            <el-table-column label="异常标记" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="exceptionColorMap[row.exceptionMark]" size="small">
                  {{ row.exceptionMark }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="executeTime" label="执行时间" width="170" show-overflow-tooltip />
            <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
            <el-table-column label="操作" width="100" align="center" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleViewResult(row)">
                  查看详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="resultPagination.currentPage"
              v-model:page-size="resultPagination.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="resultPagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleResultSizeChange"
              @current-change="handleResultCurrentChange"
            />
          </div>
        </el-tab-pane>

        <!-- 校验规则 -->
        <el-tab-pane label="校验规则" name="rules">
          <!-- 搜索筛选 -->
          <el-form :model="ruleSearchForm" label-width="80px" class="search-form">
            <el-row :gutter="20">
              <el-col :span="5">
                <el-form-item label="关键字">
                  <el-input
                    v-model="ruleSearchForm.keyword"
                    placeholder="规则名称/编码/字段"
                    clearable
                    @keyup.enter="handleRuleSearch"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="5">
                <el-form-item label="校验类型">
                  <el-select
                    v-model="ruleSearchForm.checkType"
                    placeholder="请选择类型"
                    clearable
                    style="width: 100%"
                  >
                    <el-option
                      v-for="type in checkTypeOptions"
                      :key="type.value"
                      :label="type.label"
                      :value="type.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="5">
                <el-form-item label="状态">
                  <el-select
                    v-model="ruleSearchForm.status"
                    placeholder="请选择状态"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="status in statusOptions"
                      :key="status.value"
                      :label="status.label"
                      :value="status.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="5" class="search-actions">
                <el-button type="primary" @click="handleRuleSearch">
                  <el-icon class="btn-icon"><Search /></el-icon>
                  搜索
                </el-button>
                <el-button @click="handleRuleReset">
                  <el-icon class="btn-icon"><Refresh /></el-icon>
                  重置
                </el-button>
                <el-button type="success" @click="handleAddRule" style="margin-left: 10px">
                  <el-icon class="btn-icon"><Plus /></el-icon>
                  新增规则
                </el-button>
              </el-col>
            </el-row>
          </el-form>

          <!-- 表格 -->
          <el-table
            :data="ruleTableData"
            :loading="loading"
            stripe
            border
            style="width: 100%; margin-top: 20px"
          >
            <el-table-column type="index" label="序号" width="60" align="center" />
            <el-table-column prop="ruleName" label="规则名称" width="180" show-overflow-tooltip />
            <el-table-column prop="ruleCode" label="规则编码" width="110" />
            <el-table-column prop="checkType" label="校验类型" width="110" align="center">
              <template #default="{ row }">
                <el-tag size="small" type="primary">{{ row.checkType }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="targetField" label="目标字段" width="140" show-overflow-tooltip />
            <el-table-column prop="ruleExpression" label="规则表达式" min-width="200" show-overflow-tooltip />
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === '启用' ? 'success' : 'info'" size="small">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="updateTime" label="更新时间" width="170" show-overflow-tooltip />
            <el-table-column label="操作" width="220" align="center" fixed="right">
              <template #default="{ row }">
                <el-button link type="success" size="small" @click="handleExecuteCheck(row)">
                  执行
                </el-button>
                <el-button link type="primary" size="small" @click="handleEditRule(row)">
                  编辑
                </el-button>
                <el-button link type="danger" size="small" @click="handleDeleteRule(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="rulePagination.currentPage"
              v-model:page-size="rulePagination.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="rulePagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleRuleSizeChange"
              @current-change="handleRuleCurrentChange"
            />
          </div>
        </el-tab-pane>

        <!-- 质量报告 -->
        <el-tab-pane label="质量报告" name="reports">
          <div class="report-actions">
            <el-button type="primary" :loading="loading" @click="handleGenerateReport('PDF')">
              <el-icon class="btn-icon"><Document /></el-icon>
              生成PDF报告
            </el-button>
            <el-button type="success" :loading="loading" @click="handleGenerateReport('Excel')">
              <el-icon class="btn-icon"><Tickets /></el-icon>
              生成Excel报告
            </el-button>
          </div>

          <!-- 报告列表 -->
          <el-table
            :data="reportTableData"
            stripe
            border
            style="width: 100%; margin-top: 20px"
          >
            <el-table-column type="index" label="序号" width="80" align="center" />
            <el-table-column prop="reportName" label="报告名称" min-width="300" show-overflow-tooltip />
            <el-table-column label="报告类型" width="120" align="center">
              <template #default="{ row }">
                <el-tag :type="row.reportType === 'PDF' ? 'danger' : 'success'" size="small">
                  {{ row.reportType }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="generateTime" label="生成时间" width="180" />
            <el-table-column label="状态" width="120" align="center">
              <template #default="{ row }">
                <el-tag type="success" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" align="center" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleViewReport(row)">
                  查看
                </el-button>
                <el-button link type="success" size="small" @click="handleDownloadReport(row)">
                  下载
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 新增/编辑规则弹窗 -->
    <el-dialog
      v-model="ruleDialogVisible"
      :title="dialogTitle"
      width="650px"
      :close-on-click-modal="false"
      @close="handleClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="规则名称" prop="ruleName">
              <el-input
                v-model="formData.ruleName"
                placeholder="请输入规则名称"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="校验类型" prop="checkType">
              <el-select
                v-model="formData.checkType"
                placeholder="请选择类型"
                style="width: 100%"
              >
                <el-option
                  v-for="type in checkTypeOptions"
                  :key="type.value"
                  :label="type.label"
                  :value="type.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="规则编码" prop="ruleCode">
          <el-input
            v-model="formData.ruleCode"
            placeholder="格式：RULE-001"
            clearable
          >
            <template #append>
              <el-button @click="generateRuleCode">
                <el-icon><MagicStick /></el-icon>
                自动生成
              </el-button>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="目标字段" prop="targetField">
          <el-input
            v-model="formData.targetField"
            placeholder="请输入目标字段名称"
            clearable
          />
        </el-form-item>

        <el-form-item label="规则表达式" prop="ruleExpression">
          <el-input
            v-model="formData.ruleExpression"
            type="textarea"
            :rows="3"
            placeholder="如：NOT NULL AND LENGTH >= 10"
            clearable
          />
        </el-form-item>

        <el-form-item label="规则描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="2"
            placeholder="请输入规则描述"
            clearable
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select
                v-model="formData.status"
                style="width: 100%"
              >
                <el-option label="启用" value="启用" />
                <el-option label="停用" value="停用" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否启用">
              <el-switch v-model="formData.isEnabled" />
              <span style="margin-left: 10px; color: #909399; font-size: 12px">
                {{ formData.isEnabled ? '已启用' : '已禁用' }}
              </span>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleClose">取消</el-button>
          <el-button type="primary" :loading="loading" @click="handleSubmit">
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.data-quality-check-container {
  min-height: calc(100vh - 60px);

  .header-card {
    margin-bottom: 20px;

    .page-header {
      .header-content {
        .page-title {
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 600;
          color: #303133;
        }

        .page-description {
          margin: 0;
          font-size: 14px;
          color: #909399;
        }
      }
    }
  }

  .content-card {
    .search-form {
      padding: 20px 20px 0 20px;
      background-color: #f9fafc;
      border-radius: 4px;
      margin-bottom: 20px;

      .search-actions {
        text-align: right;
        margin-bottom: 20px;

        .el-button {
          margin-left: 10px;
        }
      }
    }

    .report-actions {
      padding: 20px;
      text-align: center;
      background-color: #f9fafc;
      border-radius: 4px;
      margin-bottom: 20px;

      .el-button {
        margin: 0 10px;
      }
    }

    .pagination-container {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
    }
  }

  .btn-icon {
    margin-right: 4px;
  }

  :deep(.el-table) {
    .el-table__header {
      th {
        background-color: #f5f7fa;
        color: #606266;
        font-weight: 600;
      }
    }
  }

  :deep(.el-form-item) {
    margin-bottom: 18px;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  :deep(.el-tabs__header) {
    margin-bottom: 20px;
  }

  :deep(.el-tabs__item) {
    font-size: 15px;
    font-weight: 500;
  }
}

// 详情弹窗样式
:deep(.detail-message-box) {
  width: 550px;
  max-width: 90%;
  
  .el-message-box__message {
    p {
      margin: 8px 0;
      
      strong {
        color: #606266;
        display: inline-block;
        min-width: 90px;
      }
    }
  }
}
</style>