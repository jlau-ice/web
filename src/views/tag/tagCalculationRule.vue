<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// ==================== 类型定义 ====================
interface TagCalculationRule {
  id: string
  ruleName: string
  tagName: string
  calculationType: 'SQL' | 'SCRIPT' | 'CONDITION' | 'API'
  dataSource: string
  ruleScript: string
  executionFrequency: string
  outputFields: string
  remark: string
  status: boolean
  updateTime: string
  updateBy: string
  createTime?: string
}

interface SearchForm {
  keyword: string
  calculationType: string
  status: string
  timeRange: [Date, Date] | null
}

interface ExecutionResult {
  status: 'success' | 'failed'
  duration: number
  dataCount: number
  sampleData: any[]
  message: string
}

// ==================== Mock 数据 ====================
const mockTags = [
  { value: '高价值客户', label: '高价值客户' },
  { value: '活跃用户', label: '活跃用户' },
  { value: '沉睡用户', label: '沉睡用户' },
  { value: '新用户', label: '新用户' },
  { value: '流失预警', label: '流失预警' }
]

const mockDataSources = [
  { value: 'mysql_main', label: 'MySQL主库' },
  { value: 'oracle_crm', label: 'Oracle CRM' },
  { value: 'hive_dw', label: 'Hive数仓' },
  { value: 'api_external', label: '外部API' }
]

const mockRules: TagCalculationRule[] = [
  {
    id: '1',
    ruleName: '高价值客户识别规则',
    tagName: '高价值客户',
    calculationType: 'SQL',
    dataSource: 'mysql_main',
    ruleScript: 'SELECT user_id, SUM(amount) as total_amount\nFROM orders\nWHERE create_time >= DATE_SUB(NOW(), INTERVAL 6 MONTH)\nGROUP BY user_id\nHAVING total_amount > 10000',
    executionFrequency: 'daily',
    outputFields: 'user_id, total_amount',
    remark: '识别近6个月消费超过1万元的客户',
    status: true,
    updateTime: '2025-10-27 14:30:00',
    updateBy: '张三',
    createTime: '2025-10-01 10:00:00'
  },
  {
    id: '2',
    ruleName: '活跃用户判定规则',
    tagName: '活跃用户',
    calculationType: 'CONDITION',
    dataSource: 'mysql_main',
    ruleScript: 'login_days >= 15 AND page_views > 50 AND last_login_time <= 7',
    executionFrequency: 'weekly',
    outputFields: 'user_id, login_days, page_views',
    remark: '月登录15天以上且浏览量大于50次',
    status: true,
    updateTime: '2025-10-26 09:15:00',
    updateBy: '李四',
    createTime: '2025-09-15 11:00:00'
  },
  {
    id: '3',
    ruleName: '沉睡用户唤醒规则',
    tagName: '沉睡用户',
    calculationType: 'SQL',
    dataSource: 'hive_dw',
    ruleScript: 'SELECT user_id, DATEDIFF(NOW(), last_login_time) as sleep_days\nFROM user_behavior\nWHERE last_login_time < DATE_SUB(NOW(), INTERVAL 30 DAY)',
    executionFrequency: 'weekly',
    outputFields: 'user_id, sleep_days',
    remark: '超过30天未登录的用户',
    status: false,
    updateTime: '2025-10-25 16:45:00',
    updateBy: '王五',
    createTime: '2025-09-20 14:30:00'
  },
  {
    id: '4',
    ruleName: '新用户识别规则',
    tagName: '新用户',
    calculationType: 'CONDITION',
    dataSource: 'mysql_main',
    ruleScript: 'register_days <= 30 AND order_count == 0',
    executionFrequency: 'daily',
    outputFields: 'user_id, register_time',
    remark: '注册30天内且未下单的新用户',
    status: true,
    updateTime: '2025-10-24 11:20:00',
    updateBy: '赵六',
    createTime: '2025-08-10 09:00:00'
  },
  {
    id: '5',
    ruleName: '流失预警计算',
    tagName: '流失预警',
    calculationType: 'API',
    dataSource: 'api_external',
    ruleScript: 'POST /api/churn/predict\n{\n  "features": ["login_frequency", "purchase_amount", "browse_duration"]\n}',
    executionFrequency: 'manual',
    outputFields: 'user_id, churn_probability',
    remark: '通过外部算法模型预测流失概率',
    status: true,
    updateTime: '2025-10-23 13:10:00',
    updateBy: '孙七',
    createTime: '2025-07-05 15:20:00'
  }
]

// ==================== 响应式数据 ====================
const loading = ref(false)
const tableData = ref<TagCalculationRule[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const selectedRows = ref<TagCalculationRule[]>([])

// 搜索表单
const searchForm = reactive<SearchForm>({
  keyword: '',
  calculationType: '',
  status: '',
  timeRange: null
})

// 弹窗控制
const dialogVisible = ref(false)
const dialogTitle = ref('新建规则')
const formRef = ref<FormInstance>()
const ruleForm = reactive<Partial<TagCalculationRule>>({
  id: '',
  ruleName: '',
  tagName: '',
  calculationType: 'SQL',
  dataSource: '',
  ruleScript: '',
  executionFrequency: 'daily',
  outputFields: '',
  remark: '',
  status: true
})

// 详情抽屉
const drawerVisible = ref(false)
const currentRule = ref<TagCalculationRule | null>(null)

// 测试执行结果
const testDialogVisible = ref(false)
const testResult = ref<ExecutionResult | null>(null)

// 高级筛选
const advancedSearchVisible = ref(false)

// 表单校验规则
const formRules: FormRules = {
  ruleName: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  tagName: [{ required: true, message: '请选择标签名称', trigger: 'change' }],
  calculationType: [{ required: true, message: '请选择计算方式', trigger: 'change' }],
  dataSource: [{ required: true, message: '请选择数据源', trigger: 'change' }],
  ruleScript: [{ required: true, message: '请输入规则脚本', trigger: 'blur' }],
  executionFrequency: [{ required: true, message: '请选择执行频率', trigger: 'change' }]
}

// ==================== 计算属性 ====================
const calculationTypeOptions = [
  { value: 'SQL', label: 'SQL计算' },
  { value: 'SCRIPT', label: '脚本计算' },
  { value: 'CONDITION', label: '条件计算' },
  { value: 'API', label: '外部接口' }
]

const executionFrequencyOptions = [
  { value: 'daily', label: '每日' },
  { value: 'weekly', label: '每周' },
  { value: 'monthly', label: '每月' },
  { value: 'manual', label: '手动' }
]

const statusOptions = [
  { value: '', label: '全部' },
  { value: 'true', label: '启用' },
  { value: 'false', label: '停用' }
]

// 计算方式标签颜色
const getCalculationTypeTag = (type: string) => {
  const map: Record<string, string> = {
    SQL: 'primary',
    SCRIPT: 'success',
    CONDITION: 'warning',
    API: 'danger'
  }
  return map[type] || 'info'
}

// ==================== Mock API 方法 ====================
const mockDelay = (ms: number = 800) => new Promise(resolve => setTimeout(resolve, ms))

// 获取规则列表
const fetchRuleList = async () => {
  loading.value = true
  try {
    await mockDelay()
    
    let filteredData = [...mockRules]
    
    // 搜索过滤
    if (searchForm.keyword) {
      const keyword = searchForm.keyword.toLowerCase()
      filteredData = filteredData.filter(item => 
        item.ruleName.toLowerCase().includes(keyword) || 
        item.tagName.toLowerCase().includes(keyword)
      )
    }
    
    // 计算方式过滤
    if (searchForm.calculationType) {
      filteredData = filteredData.filter(item => item.calculationType === searchForm.calculationType)
    }
    
    // 状态过滤
    if (searchForm.status !== '') {
      const status = searchForm.status === 'true'
      filteredData = filteredData.filter(item => item.status === status)
    }
    
    // 时间范围过滤
    if (searchForm.timeRange && searchForm.timeRange.length === 2) {
      const [start, end] = searchForm.timeRange
      filteredData = filteredData.filter(item => {
        const updateTime = new Date(item.updateTime)
        return updateTime >= start && updateTime <= end
      })
    }
    
    total.value = filteredData.length
    
    // 分页
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    tableData.value = filteredData.slice(start, end)
    
  } catch (error) {
    ElMessage.error('获取规则列表失败')
  } finally {
    loading.value = false
  }
}

// 保存规则（新建/编辑）
const saveRule = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    const loadingInstance = ElLoading.service({ fullscreen: true, text: '保存中...' })
    
    try {
      await mockDelay()
      
      if (ruleForm.id) {
        // 编辑
        const index = mockRules.findIndex(r => r.id === ruleForm.id)
        if (index !== -1) {
          mockRules[index] = {
            ...mockRules[index],
            ...ruleForm as TagCalculationRule,
            updateTime: new Date().toLocaleString('zh-CN', { hour12: false }),
            updateBy: '当前用户'
          }
        }
        ElMessage.success('编辑规则成功')
      } else {
        // 新建
        const newRule: TagCalculationRule = {
          ...ruleForm as TagCalculationRule,
          id: Date.now().toString(),
          updateTime: new Date().toLocaleString('zh-CN', { hour12: false }),
          updateBy: '当前用户',
          createTime: new Date().toLocaleString('zh-CN', { hour12: false })
        }
        mockRules.unshift(newRule)
        ElMessage.success('新建规则成功')
      }
      
      dialogVisible.value = false
      await fetchRuleList()
      
    } catch (error) {
      ElMessage.error('保存规则失败')
    } finally {
      loadingInstance.close()
    }
  })
}

// 删除规则
const deleteRule = async (id: string) => {
  await ElMessageBox.confirm('确定要删除该规则吗？此操作不可恢复。', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
  
  const loadingInstance = ElLoading.service({ text: '删除中...' })
  
  try {
    await mockDelay()
    const index = mockRules.findIndex(r => r.id === id)
    if (index !== -1) {
      mockRules.splice(index, 1)
    }
    ElMessage.success('删除成功')
    await fetchRuleList()
  } catch (error) {
    ElMessage.error('删除失败')
  } finally {
    loadingInstance.close()
  }
}

// 批量删除
const batchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请至少选择一条规则')
    return
  }
  
  await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 条规则吗？`, '批量删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
  
  const loadingInstance = ElLoading.service({ text: '删除中...' })
  
  try {
    await mockDelay()
    const ids = selectedRows.value.map(r => r.id)
    ids.forEach(id => {
      const index = mockRules.findIndex(r => r.id === id)
      if (index !== -1) {
        mockRules.splice(index, 1)
      }
    })
    ElMessage.success(`成功删除 ${ids.length} 条规则`)
    selectedRows.value = []
    await fetchRuleList()
  } catch (error) {
    ElMessage.error('批量删除失败')
  } finally {
    loadingInstance.close()
  }
}

// 切换状态
const toggleStatus = async (row: TagCalculationRule) => {
  const loadingInstance = ElLoading.service({ text: '更新中...' })
  
  try {
    await mockDelay(500)
    const index = mockRules.findIndex(r => r.id === row.id)
    if (index !== -1) {
      mockRules[index].status = row.status
      mockRules[index].updateTime = new Date().toLocaleString('zh-CN', { hour12: false })
    }
    ElMessage.success(`已${row.status ? '启用' : '停用'}规则`)
  } catch (error) {
    row.status = !row.status
    ElMessage.error('状态更新失败')
  } finally {
    loadingInstance.close()
  }
}

// 批量启用/停用
const batchToggleStatus = async (status: boolean) => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请至少选择一条规则')
    return
  }
  
  const loadingInstance = ElLoading.service({ text: `${status ? '启用' : '停用'}中...` })
  
  try {
    await mockDelay()
    const ids = selectedRows.value.map(r => r.id)
    ids.forEach(id => {
      const index = mockRules.findIndex(r => r.id === id)
      if (index !== -1) {
        mockRules[index].status = status
        mockRules[index].updateTime = new Date().toLocaleString('zh-CN', { hour12: false })
      }
    })
    ElMessage.success(`成功${status ? '启用' : '停用'} ${ids.length} 条规则`)
    selectedRows.value = []
    await fetchRuleList()
  } catch (error) {
    ElMessage.error(`批量${status ? '启用' : '停用'}失败`)
  } finally {
    loadingInstance.close()
  }
}

// 校验规则
const validateRule = async () => {
  const loadingInstance = ElLoading.service({ text: '校验中...' })
  
  try {
    await mockDelay(1500)
    
    // 模拟校验逻辑
    if (!ruleForm.ruleScript || ruleForm.ruleScript.trim().length < 10) {
      throw new Error('规则脚本内容过短，请检查')
    }
    
    // SQL 语法检查
    if (ruleForm.calculationType === 'SQL') {
      if (!ruleForm.ruleScript.toUpperCase().includes('SELECT')) {
        throw new Error('SQL 语句必须包含 SELECT 关键字')
      }
    }
    
    // 条件计算检查
    if (ruleForm.calculationType === 'CONDITION') {
      if (!ruleForm.ruleScript.includes('>=') && !ruleForm.ruleScript.includes('<=') && 
          !ruleForm.ruleScript.includes('>') && !ruleForm.ruleScript.includes('<') &&
          !ruleForm.ruleScript.includes('==')) {
        throw new Error('条件计算必须包含比较运算符')
      }
    }
    
    ElMessage.success('规则校验通过！')
  } catch (error: any) {
    ElMessage.error(error.message || '规则校验失败')
  } finally {
    loadingInstance.close()
  }
}

// 测试执行
const testExecution = async (rule?: TagCalculationRule) => {
  const targetRule = rule || ruleForm
  
  const loadingInstance = ElLoading.service({ fullscreen: true, text: '执行中...' })
  
  try {
    await mockDelay(2000)
    
    // 模拟执行结果
    const success = Math.random() > 0.2
    
    if (success) {
      testResult.value = {
        status: 'success',
        duration: Math.floor(Math.random() * 3000) + 500,
        dataCount: Math.floor(Math.random() * 10000) + 100,
        sampleData: [
          { user_id: 'U001', value: '15000', score: 95 },
          { user_id: 'U002', value: '12000', score: 88 },
          { user_id: 'U003', value: '18000', score: 92 },
          { user_id: 'U004', value: '11000', score: 85 },
          { user_id: 'U005', value: '20000', score: 98 }
        ],
        message: '执行成功'
      }
    } else {
      testResult.value = {
        status: 'failed',
        duration: Math.floor(Math.random() * 1000) + 200,
        dataCount: 0,
        sampleData: [],
        message: '数据源连接超时，请检查数据源配置'
      }
    }
    
    testDialogVisible.value = true
    
  } catch (error) {
    ElMessage.error('测试执行失败')
  } finally {
    loadingInstance.close()
  }
}

// 导出配置
const exportConfig = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请至少选择一条规则')
    return
  }
  
  const loadingInstance = ElLoading.service({ text: '导出中...' })
  
  try {
    await mockDelay()
    
    const exportData = selectedRows.value.map(row => ({
      ruleName: row.ruleName,
      tagName: row.tagName,
      calculationType: row.calculationType,
      dataSource: row.dataSource,
      ruleScript: row.ruleScript,
      executionFrequency: row.executionFrequency,
      outputFields: row.outputFields,
      remark: row.remark,
      status: row.status
    }))
    
    const jsonStr = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `tag_calculation_rules_${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
    
    ElMessage.success(`成功导出 ${selectedRows.value.length} 条规则配置`)
  } catch (error) {
    ElMessage.error('导出失败')
  } finally {
    loadingInstance.close()
  }
}

// 导入配置
const importConfig = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  
  if (!file) return
  
  const loadingInstance = ElLoading.service({ text: '导入中...' })
  
  try {
    const text = await file.text()
    const importData = JSON.parse(text)
    
    await mockDelay()
    
    if (!Array.isArray(importData)) {
      throw new Error('导入文件格式错误，应为数组格式')
    }
    
    let successCount = 0
    importData.forEach((item: any) => {
      const newRule: TagCalculationRule = {
        id: Date.now().toString() + Math.random(),
        ruleName: item.ruleName + '_导入',
        tagName: item.tagName,
        calculationType: item.calculationType,
        dataSource: item.dataSource,
        ruleScript: item.ruleScript,
        executionFrequency: item.executionFrequency,
        outputFields: item.outputFields,
        remark: item.remark || '',
        status: item.status !== undefined ? item.status : true,
        updateTime: new Date().toLocaleString('zh-CN', { hour12: false }),
        updateBy: '当前用户',
        createTime: new Date().toLocaleString('zh-CN', { hour12: false })
      }
      mockRules.unshift(newRule)
      successCount++
    })
    
    ElMessage.success(`成功导入 ${successCount} 条规则配置`)
    await fetchRuleList()
    
  } catch (error: any) {
    ElMessage.error(error.message || '导入失败，请检查文件格式')
  } finally {
    loadingInstance.close()
    input.value = ''
  }
}

// ==================== 操作方法 ====================
// 打开新建弹窗
const openCreateDialog = () => {
  dialogTitle.value = '新建规则'
  Object.assign(ruleForm, {
    id: '',
    ruleName: '',
    tagName: '',
    calculationType: 'SQL',
    dataSource: '',
    ruleScript: '',
    executionFrequency: 'daily',
    outputFields: '',
    remark: '',
    status: true
  })
  dialogVisible.value = true
}

// 打开编辑弹窗
const openEditDialog = (row: TagCalculationRule) => {
  dialogTitle.value = '编辑规则'
  Object.assign(ruleForm, { ...row })
  dialogVisible.value = true
}

// 查看详情
const viewDetail = (row: TagCalculationRule) => {
  currentRule.value = row
  drawerVisible.value = true
}

// 从详情编辑
const editFromDetail = () => {
  if (currentRule.value) {
    drawerVisible.value = false
    openEditDialog(currentRule.value)
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchRuleList()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    keyword: '',
    calculationType: '',
    status: '',
    timeRange: null
  })
  currentPage.value = 1
  fetchRuleList()
}

// 分页
const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchRuleList()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  fetchRuleList()
}

// 表格选择
const handleSelectionChange = (rows: TagCalculationRule[]) => {
  selectedRows.value = rows
}

// 获取计算方式示例
const getScriptExample = (type: string) => {
  const examples: Record<string, string> = {
    SQL: 'SELECT user_id, COUNT(*) as count\nFROM user_actions\nWHERE action_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)\nGROUP BY user_id\nHAVING count >= 10',
    SCRIPT: 'function calculate(data) {\n  return data.filter(item => {\n    return item.score >= 80 && item.days >= 30;\n  });\n}',
    CONDITION: 'age >= 18 AND total_amount > 5000 AND login_days >= 10',
    API: 'POST /api/v1/tag/calculate\n{\n  "userId": "${user_id}",\n  "params": {\n    "days": 30\n  }\n}'
  }
  return examples[type] || ''
}

// 使用示例
const useExample = () => {
  if (ruleForm.calculationType) {
    ruleForm.ruleScript = getScriptExample(ruleForm.calculationType)
  }
}

// ==================== 生命周期 ====================
onMounted(() => {
  fetchRuleList()
})
</script>

<template>
  <div class="tag-calculation-rule-container">
    <!-- 顶部搜索操作区 -->
    <div class="search-section">
      <el-card shadow="never">
        <div class="search-form">
          <div class="search-row">
            <el-input
              v-model="searchForm.keyword"
              placeholder="搜索规则名称或标签名称"
              clearable
              style="width: 300px; margin-right: 12px"
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            
            <el-select
              v-model="searchForm.calculationType"
              placeholder="计算方式"
              clearable
              style="width: 150px; margin-right: 12px"
            >
              <el-option
                v-for="item in calculationTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            
            <el-select
              v-model="searchForm.status"
              placeholder="状态"
              clearable
              style="width: 120px; margin-right: 12px"
            >
              <el-option
                v-for="item in statusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            
            <el-date-picker
              v-model="searchForm.timeRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="width: 260px; margin-right: 12px"
            />
            
            <el-button type="primary" @click="handleSearch">
              <el-icon><Search /></el-icon>
              查询
            </el-button>
            <el-button @click="handleReset">
              <el-icon><RefreshLeft /></el-icon>
              重置
            </el-button>
          </div>
          
          <div class="action-row">
            <div class="left-actions">
              <el-button type="primary" @click="openCreateDialog">
                <el-icon><Plus /></el-icon>
                新建规则
              </el-button>
              <el-button @click="batchToggleStatus(true)" :disabled="selectedRows.length === 0">
                <el-icon><CircleCheck /></el-icon>
                批量启用
              </el-button>
              <el-button @click="batchToggleStatus(false)" :disabled="selectedRows.length === 0">
                <el-icon><CircleClose /></el-icon>
                批量停用
              </el-button>
              <el-button type="danger" @click="batchDelete" :disabled="selectedRows.length === 0">
                <el-icon><Delete /></el-icon>
                批量删除
              </el-button>
            </div>
            
            <div class="right-actions">
              <el-button @click="exportConfig" :disabled="selectedRows.length === 0">
                <el-icon><Download /></el-icon>
                导出配置
              </el-button>
              <el-upload
                action="#"
                accept=".json"
                :show-file-list="false"
                :before-upload="() => false"
                :on-change="importConfig"
                style="display: inline-block; margin-left: 8px"
              >
                <el-button>
                  <el-icon><Upload /></el-icon>
                  导入配置
                </el-button>
              </el-upload>
              <el-button @click="fetchRuleList" style="margin-left: 8px">
                <el-icon><Refresh /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 规则表格区 -->
    <div class="table-section">
      <el-card shadow="never">
        <el-table
          v-loading="loading"
          :data="tableData"
          border
          stripe
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column type="index" label="序号" width="60" align="center" />
          
          <el-table-column prop="ruleName" label="规则名称" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">
              <el-link type="primary" @click="viewDetail(row)">{{ row.ruleName }}</el-link>
            </template>
          </el-table-column>
          
          <el-table-column prop="tagName" label="标签名称" width="140" align="center">
            <template #default="{ row }">
              <el-tag>{{ row.tagName }}</el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="calculationType" label="计算方式" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="getCalculationTypeTag(row.calculationType)">
                {{ calculationTypeOptions.find(o => o.value === row.calculationType)?.label }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="dataSource" label="数据源" width="140" show-overflow-tooltip />
          
          <el-table-column prop="executionFrequency" label="执行频率" width="100" align="center">
            <template #default="{ row }">
              {{ executionFrequencyOptions.find(o => o.value === row.executionFrequency)?.label }}
            </template>
          </el-table-column>
          
          <el-table-column prop="updateTime" label="更新时间" width="160" align="center" />
          
          <el-table-column prop="updateBy" label="更新人" width="100" align="center" />
          
          <el-table-column prop="status" label="状态" width="80" align="center">
            <template #default="{ row }">
              <el-switch
                v-model="row.status"
                @change="toggleStatus(row)"
              />
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="240" align="center" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="viewDetail(row)">
                <el-icon><View /></el-icon>
                查看
              </el-button>
              <el-button link type="primary" size="small" @click="openEditDialog(row)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button link type="success" size="small" @click="testExecution(row)">
                <el-icon><VideoPlay /></el-icon>
                测试
              </el-button>
              <el-button link type="danger" size="small" @click="deleteRule(row.id)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 底部分页区 -->
        <div class="pagination-section">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 新建/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="ruleForm"
        :rules="formRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="规则名称" prop="ruleName">
              <el-input v-model="ruleForm.ruleName" placeholder="请输入规则名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="标签名称" prop="tagName">
              <el-select v-model="ruleForm.tagName" placeholder="请选择标签" style="width: 100%">
                <el-option
                  v-for="item in mockTags"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="计算方式" prop="calculationType">
              <el-select v-model="ruleForm.calculationType" placeholder="请选择计算方式" style="width: 100%">
                <el-option
                  v-for="item in calculationTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="数据源" prop="dataSource">
              <el-select v-model="ruleForm.dataSource" placeholder="请选择数据源" style="width: 100%">
                <el-option
                  v-for="item in mockDataSources"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="规则脚本" prop="ruleScript">
          <div style="width: 100%">
            <div style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center">
              <span style="font-size: 12px; color: #909399">
                <el-icon><InfoFilled /></el-icon>
                请根据计算方式填写相应的规则脚本
              </span>
              <el-button link type="primary" size="small" @click="useExample">
                <el-icon><MagicStick /></el-icon>
                使用示例
              </el-button>
            </div>
            <el-input
              v-model="ruleForm.ruleScript"
              type="textarea"
              :rows="8"
              placeholder="请输入规则脚本"
              style="font-family: 'Consolas', 'Monaco', monospace"
            />
          </div>
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="执行频率" prop="executionFrequency">
              <el-select v-model="ruleForm.executionFrequency" placeholder="请选择执行频率" style="width: 100%">
                <el-option
                  v-for="item in executionFrequencyOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="输出字段" prop="outputFields">
              <el-input v-model="ruleForm.outputFields" placeholder="如: user_id, score" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="备注说明">
          <el-input
            v-model="ruleForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注说明"
          />
        </el-form-item>
        
        <el-form-item label="状态">
          <el-switch v-model="ruleForm.status" active-text="启用" inactive-text="停用" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="warning" @click="validateRule">
          <el-icon><CircleCheck /></el-icon>
          校验规则
        </el-button>
        <el-button type="success" @click="testExecution()">
          <el-icon><VideoPlay /></el-icon>
          测试执行
        </el-button>
        <el-button type="primary" @click="saveRule">
          <el-icon><Check /></el-icon>
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 规则详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      title="规则详情"
      size="600px"
      destroy-on-close
    >
      <div v-if="currentRule" class="rule-detail">
        <el-descriptions title="基本信息" :column="2" border>
          <el-descriptions-item label="规则ID">{{ currentRule.id }}</el-descriptions-item>
          <el-descriptions-item label="规则名称">{{ currentRule.ruleName }}</el-descriptions-item>
          <el-descriptions-item label="标签名称">
            <el-tag>{{ currentRule.tagName }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="计算方式">
            <el-tag :type="getCalculationTypeTag(currentRule.calculationType)">
              {{ calculationTypeOptions.find(o => o.value === currentRule.calculationType)?.label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="数据源">{{ currentRule.dataSource }}</el-descriptions-item>
          <el-descriptions-item label="执行频率">
            {{ executionFrequencyOptions.find(o => o.value === currentRule.executionFrequency)?.label }}
          </el-descriptions-item>
          <el-descriptions-item label="输出字段" :span="2">{{ currentRule.outputFields }}</el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">{{ currentRule.createTime }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ currentRule.updateTime }}</el-descriptions-item>
          <el-descriptions-item label="更新人">{{ currentRule.updateBy }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentRule.status ? 'success' : 'info'">
              {{ currentRule.status ? '启用' : '停用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="备注说明" :span="2">
            {{ currentRule.remark || '无' }}
          </el-descriptions-item>
        </el-descriptions>
        
        <el-divider />
        
        <div class="detail-section">
          <h4>计算逻辑</h4>
          <el-input
            :model-value="currentRule.ruleScript"
            type="textarea"
            :rows="10"
            readonly
            style="font-family: 'Consolas', 'Monaco', monospace; background-color: #f5f7fa"
          />
        </div>
        
        <el-divider />
        
        <div class="detail-section">
          <h4>最近执行记录</h4>
          <el-table :data="[
            { time: '2025-10-28 08:00:00', status: '成功', count: 1523, duration: '2.3s' },
            { time: '2025-10-27 08:00:00', status: '成功', count: 1489, duration: '2.1s' },
            { time: '2025-10-26 08:00:00', status: '失败', count: 0, duration: '0.5s' }
          ]" border size="small">
            <el-table-column prop="time" label="执行时间" width="160" />
            <el-table-column prop="status" label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === '成功' ? 'success' : 'danger'" size="small">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="数据量" width="100" align="center" />
            <el-table-column prop="duration" label="耗时" align="center" />
          </el-table>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="drawerVisible = false">关闭</el-button>
        <el-button v-if="currentRule" type="success" @click="testExecution(currentRule)">
          <el-icon><VideoPlay /></el-icon>
          测试执行
        </el-button>
        <el-button type="primary" @click="editFromDetail">
          <el-icon><Edit /></el-icon>
          编辑规则
        </el-button>
      </template>
    </el-drawer>

    <!-- 测试执行结果弹窗 -->
    <el-dialog
      v-model="testDialogVisible"
      title="测试执行结果"
      width="700px"
      destroy-on-close
    >
      <div v-if="testResult" class="test-result">
        <el-result
          :icon="testResult.status === 'success' ? 'success' : 'error'"
          :title="testResult.status === 'success' ? '执行成功' : '执行失败'"
          :sub-title="testResult.message"
        >
          <template #extra>
            <el-descriptions :column="3" border>
              <el-descriptions-item label="执行状态">
                <el-tag :type="testResult.status === 'success' ? 'success' : 'danger'">
                  {{ testResult.status === 'success' ? '成功' : '失败' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="执行耗时">{{ testResult.duration }}ms</el-descriptions-item>
              <el-descriptions-item label="数据量">{{ testResult.dataCount }} 条</el-descriptions-item>
            </el-descriptions>
          </template>
        </el-result>
        
        <div v-if="testResult.status === 'success' && testResult.sampleData.length > 0" class="sample-data">
          <el-divider content-position="left">样例数据（前5条）</el-divider>
          <el-table :data="testResult.sampleData" border size="small">
            <el-table-column
              v-for="(value, key) in testResult.sampleData[0]"
              :key="key"
              :prop="key"
              :label="key"
            />
          </el-table>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="testDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.tag-calculation-rule-container {
  min-height: 100vh;

  .search-section {
    margin-bottom: 16px;

    .search-form {
      .search-row {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        margin-bottom: 12px;
      }

      .action-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;

        .left-actions, .right-actions {
          display: flex;
          align-items: center;
        }
      }
    }
  }

  .table-section {
    .pagination-section {
      margin-top: 16px;
      display: flex;
      justify-content: flex-end;
    }
  }

  .rule-detail {
    .detail-section {
      margin: 16px 0;

      h4 {
        margin-bottom: 12px;
        color: #303133;
        font-weight: 500;
      }
    }
  }

  .test-result {
    .sample-data {
      margin-top: 20px;
    }
  }
}

:deep(.el-card) {
  border-radius: 8px;
}

:deep(.el-table) {
  .el-button + .el-button {
    margin-left: 0;
  }
}

:deep(.el-descriptions__label) {
  font-weight: 500;
}
</style>