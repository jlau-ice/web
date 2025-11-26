<template>
  <div class="p-5">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800 mb-2">质量探查与校验</h1>
      <p class="text-gray-600 text-sm">通过自动化探查、持续监控与规则校验等手段，对数据质量进行动态评估与持续改进</p>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="flex items-center">
            <div class="flex-1">
              <div class="text-gray-500 text-sm mb-1">总数据量</div>
              <div class="text-2xl font-bold text-blue-600">{{ statistics.totalData }}</div>
            </div>
            <el-icon class="text-4xl text-blue-500"><DataBoard /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="flex items-center">
            <div class="flex-1">
              <div class="text-gray-500 text-sm mb-1">质量问题数</div>
              <div class="text-2xl font-bold text-red-600">{{ statistics.qualityIssues }}</div>
            </div>
            <el-icon class="text-4xl text-red-500"><Warning /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="flex items-center">
            <div class="flex-1">
              <div class="text-gray-500 text-sm mb-1">质量得分</div>
              <div class="text-2xl font-bold text-green-600">{{ statistics.qualityScore }}%</div>
            </div>
            <el-icon class="text-4xl text-green-500"><CircleCheck /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="flex items-center">
            <div class="flex-1">
              <div class="text-gray-500 text-sm mb-1">校验规则数</div>
              <div class="text-2xl font-bold text-purple-600">{{ statistics.rulesCount }}</div>
            </div>
            <el-icon class="text-4xl text-purple-500"><Document /></el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 标签页 -->
    <el-tabs v-model="activeTab" class="mb-4">
      <el-tab-pane label="质量探查" name="exploration">
        <!-- 搜索和筛选 -->
        <el-card class="mb-4" shadow="never">
          <el-form :inline="true" :model="searchForm" class="demo-form-inline">
            <el-form-item label="数据源">
              <el-input v-model="searchForm.dataSource" placeholder="请输入数据源" clearable style="width: 200px" />
            </el-form-item>
            <el-form-item label="表名">
              <el-input v-model="searchForm.tableName" placeholder="请输入表名" clearable style="width: 200px" />
            </el-form-item>
            <el-form-item label="质量等级">
              <el-select v-model="searchForm.qualityLevel" placeholder="请选择" clearable style="width: 150px">
                <el-option label="优秀" value="excellent" />
                <el-option label="良好" value="good" />
                <el-option label="一般" value="normal" />
                <el-option label="较差" value="poor" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">查询</el-button>
              <el-button @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 操作栏 -->
        <div class="mb-4 flex justify-between items-center">
          <div>
            <el-button type="primary" @click="handleStartExploration">
              <el-icon class="mr-1"><Search /></el-icon>
              开始探查
            </el-button>
            <el-button type="success" @click="handleExportReport">
              <el-icon class="mr-1"><Download /></el-icon>
              导出报告
            </el-button>
          </div>
          <div>
            <el-button @click="handleRefresh">
              <el-icon class="mr-1"><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>

        <!-- 数据表格 -->
        <el-card shadow="never">
          <el-table :data="explorationData" v-loading="loading" stripe style="width: 100%">
            <el-table-column prop="dataSource" label="数据源" width="180" />
            <el-table-column prop="tableName" label="表名" width="180" />
            <el-table-column prop="totalRows" label="总行数" width="120" />
            <el-table-column prop="nullCount" label="空值数" width="120" />
            <el-table-column prop="duplicateCount" label="重复数" width="120" />
            <el-table-column prop="qualityScore" label="质量得分" width="120">
              <template #default="{ row }">
                <el-progress :percentage="row.qualityScore" :color="getQualityColor(row.qualityScore)" />
              </template>
            </el-table-column>
            <el-table-column prop="qualityLevel" label="质量等级" width="120">
              <template #default="{ row }">
                <el-tag :type="getQualityLevelTagType(row.qualityLevel)">{{ getQualityLevelLabel(row.qualityLevel) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="exploreTime" label="探查时间" width="180" />
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleViewDetail(row)">查看详情</el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="mt-4 flex justify-end">
            <el-pagination
              v-model:current-page="pagination.page"
              v-model:page-size="pagination.size"
              :page-sizes="[10, 20, 50, 100]"
              :total="pagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handlePageChange"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="规则校验" name="validation">
        <!-- 搜索和筛选 -->
        <el-card class="mb-4" shadow="never">
          <el-form :inline="true" :model="ruleSearchForm" class="demo-form-inline">
            <el-form-item label="规则名称">
              <el-input v-model="ruleSearchForm.name" placeholder="请输入规则名称" clearable style="width: 200px" />
            </el-form-item>
            <el-form-item label="规则类型">
              <el-select v-model="ruleSearchForm.type" placeholder="请选择" clearable style="width: 150px">
                <el-option label="完整性" value="completeness" />
                <el-option label="准确性" value="accuracy" />
                <el-option label="一致性" value="consistency" />
                <el-option label="及时性" value="timeliness" />
              </el-select>
            </el-form-item>
            <el-form-item label="执行状态">
              <el-select v-model="ruleSearchForm.status" placeholder="请选择" clearable style="width: 150px">
                <el-option label="启用" value="active" />
                <el-option label="停用" value="inactive" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleRuleSearch">查询</el-button>
              <el-button @click="handleRuleReset">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 操作栏 -->
        <div class="mb-4 flex justify-between items-center">
          <div>
            <el-button type="primary" @click="handleAddRule">
              <el-icon class="mr-1"><Plus /></el-icon>
              新增规则
            </el-button>
            <el-button type="success" @click="handleExecuteRules">
              <el-icon class="mr-1"><VideoPlay /></el-icon>
              执行校验
            </el-button>
          </div>
          <div>
            <el-button @click="handleRefreshRules">
              <el-icon class="mr-1"><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>

        <!-- 规则表格 -->
        <el-card shadow="never">
          <el-table :data="ruleData" v-loading="ruleLoading" stripe style="width: 100%">
            <el-table-column type="selection" width="55" />
            <el-table-column prop="name" label="规则名称" width="200" />
            <el-table-column prop="type" label="规则类型" width="120">
              <template #default="{ row }">
                <el-tag :type="getRuleTypeTagType(row.type)">{{ getRuleTypeLabel(row.type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="规则描述" min-width="200" show-overflow-tooltip />
            <el-table-column prop="target" label="校验对象" width="180" />
            <el-table-column prop="passRate" label="通过率" width="120">
              <template #default="{ row }">
                <el-progress :percentage="row.passRate" :color="getPassRateColor(row.passRate)" />
              </template>
            </el-table-column>
            <el-table-column prop="lastExecuteTime" label="最后执行时间" width="180" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'info'">
                  {{ row.status === 'active' ? '启用' : '停用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleViewRule(row)">查看</el-button>
                <el-button link type="primary" size="small" @click="handleEditRule(row)">编辑</el-button>
                <el-button link type="danger" size="small" @click="handleDeleteRule(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="mt-4 flex justify-end">
            <el-pagination
              v-model:current-page="rulePagination.page"
              v-model:page-size="rulePagination.size"
              :page-sizes="[10, 20, 50, 100]"
              :total="rulePagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleRuleSizeChange"
              @current-change="handleRulePageChange"
            />
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 探查详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="质量探查详情" width="900px">
      <el-descriptions :column="2" border v-if="currentRow">
        <el-descriptions-item label="数据源">{{ currentRow.dataSource }}</el-descriptions-item>
        <el-descriptions-item label="表名">{{ currentRow.tableName }}</el-descriptions-item>
        <el-descriptions-item label="总行数">{{ currentRow.totalRows }}</el-descriptions-item>
        <el-descriptions-item label="空值数">{{ currentRow.nullCount }}</el-descriptions-item>
        <el-descriptions-item label="重复数">{{ currentRow.duplicateCount }}</el-descriptions-item>
        <el-descriptions-item label="异常值数">{{ currentRow.abnormalCount }}</el-descriptions-item>
        <el-descriptions-item label="质量得分">
          <el-progress :percentage="currentRow.qualityScore" :color="getQualityColor(currentRow.qualityScore)" />
        </el-descriptions-item>
        <el-descriptions-item label="质量等级">
          <el-tag :type="getQualityLevelTagType(currentRow.qualityLevel)">{{ getQualityLevelLabel(currentRow.qualityLevel) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="探查时间">{{ currentRow.exploreTime }}</el-descriptions-item>
        <el-descriptions-item label="问题详情" :span="2">
          <el-table :data="currentRow.issues" style="width: 100%">
            <el-table-column prop="field" label="字段名" width="150" />
            <el-table-column prop="issueType" label="问题类型" width="120" />
            <el-table-column prop="count" label="问题数量" width="120" />
            <el-table-column prop="description" label="问题描述" />
          </el-table>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 规则编辑对话框 -->
    <el-dialog v-model="ruleDialogVisible" :title="ruleEditMode === 'add' ? '新增规则' : '编辑规则'" width="700px">
      <el-form :model="ruleForm" :rules="ruleRules" ref="ruleFormRef" label-width="100px">
        <el-form-item label="规则名称" prop="name">
          <el-input v-model="ruleForm.name" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="规则类型" prop="type">
          <el-select v-model="ruleForm.type" placeholder="请选择" style="width: 100%">
            <el-option label="完整性" value="completeness" />
            <el-option label="准确性" value="accuracy" />
            <el-option label="一致性" value="consistency" />
            <el-option label="及时性" value="timeliness" />
          </el-select>
        </el-form-item>
        <el-form-item label="校验对象" prop="target">
          <el-input v-model="ruleForm.target" placeholder="请输入校验对象，如：表名.字段名" />
        </el-form-item>
        <el-form-item label="规则描述" prop="description">
          <el-input v-model="ruleForm.description" type="textarea" :rows="4" placeholder="请输入规则描述" />
        </el-form-item>
        <el-form-item label="规则表达式" prop="expression">
          <el-input v-model="ruleForm.expression" type="textarea" :rows="3" placeholder="请输入规则表达式" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="ruleForm.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ruleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveRule">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload, Download, Refresh, Search, DataBoard, Warning, CircleCheck, Document, VideoPlay } from '@element-plus/icons-vue'

// 统计信息
const statistics = reactive({
  totalData: 1256800,
  qualityIssues: 1256,
  qualityScore: 87,
  rulesCount: 45
})

// 当前标签页
const activeTab = ref('exploration')

// 搜索表单
const searchForm = reactive({
  dataSource: '',
  tableName: '',
  qualityLevel: ''
})

// 规则搜索表单
const ruleSearchForm = reactive({
  name: '',
  type: '',
  status: ''
})

// 分页
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const rulePagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

// 加载状态
const loading = ref(false)
const ruleLoading = ref(false)

// 表格数据
const explorationData = ref<any[]>([])
const ruleData = ref<any[]>([])

// 详情对话框
const detailDialogVisible = ref(false)
const currentRow = ref<any>(null)

// 规则对话框
const ruleDialogVisible = ref(false)
const ruleEditMode = ref<'add' | 'edit'>('add')
const ruleFormRef = ref()
const ruleForm = reactive({
  name: '',
  type: '',
  target: '',
  description: '',
  expression: '',
  status: 'active'
})

const ruleRules = {
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择规则类型', trigger: 'change' }],
  target: [{ required: true, message: '请输入校验对象', trigger: 'blur' }],
  description: [{ required: true, message: '请输入规则描述', trigger: 'blur' }],
  expression: [{ required: true, message: '请输入规则表达式', trigger: 'blur' }]
}

// 获取质量颜色
const getQualityColor = (score: number) => {
  if (score >= 90) return '#67c23a'
  if (score >= 70) return '#e6a23c'
  return '#f56c6c'
}

// 获取质量等级标签类型
const getQualityLevelTagType = (level: string) => {
  const map: Record<string, string> = {
    excellent: 'success',
    good: 'primary',
    normal: 'warning',
    poor: 'danger'
  }
  return map[level] || 'info'
}

// 获取质量等级标签文本
const getQualityLevelLabel = (level: string) => {
  const map: Record<string, string> = {
    excellent: '优秀',
    good: '良好',
    normal: '一般',
    poor: '较差'
  }
  return map[level] || level
}

// 获取规则类型标签类型
const getRuleTypeTagType = (type: string) => {
  const map: Record<string, string> = {
    completeness: 'primary',
    accuracy: 'success',
    consistency: 'warning',
    timeliness: 'info'
  }
  return map[type] || 'info'
}

// 获取规则类型标签文本
const getRuleTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    completeness: '完整性',
    accuracy: '准确性',
    consistency: '一致性',
    timeliness: '及时性'
  }
  return map[type] || type
}

// 获取通过率颜色
const getPassRateColor = (rate: number) => {
  if (rate >= 95) return '#67c23a'
  if (rate >= 80) return '#e6a23c'
  return '#f56c6c'
}

// Mock数据生成 - 探查数据
const generateExplorationData = () => {
  const dataSources = ['MySQL_生产库', 'PostgreSQL_分析库', 'Oracle_业务库', 'MongoDB_日志库']
  const qualityLevels = ['excellent', 'good', 'normal', 'poor']
  const data: any[] = []

  for (let i = 1; i <= 30; i++) {
    const dataSource = dataSources[Math.floor(Math.random() * dataSources.length)]
    const qualityScore = Math.floor(Math.random() * 40) + 60 // 60-100
    let qualityLevel = 'normal'
    if (qualityScore >= 90) qualityLevel = 'excellent'
    else if (qualityScore >= 80) qualityLevel = 'good'
    else if (qualityScore < 70) qualityLevel = 'poor'

    data.push({
      id: i,
      dataSource: dataSource,
      tableName: `table_${i}`,
      totalRows: Math.floor(Math.random() * 1000000) + 10000,
      nullCount: Math.floor(Math.random() * 10000),
      duplicateCount: Math.floor(Math.random() * 5000),
      abnormalCount: Math.floor(Math.random() * 2000),
      qualityScore: qualityScore,
      qualityLevel: qualityLevel,
      exploreTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleString('zh-CN'),
      issues: [
        { field: 'field1', issueType: '空值', count: Math.floor(Math.random() * 100), description: '存在空值问题' },
        { field: 'field2', issueType: '重复', count: Math.floor(Math.random() * 50), description: '存在重复数据' },
        { field: 'field3', issueType: '格式错误', count: Math.floor(Math.random() * 30), description: '数据格式不符合要求' }
      ]
    })
  }
  return data
}

// Mock数据生成 - 规则数据
const generateRuleData = () => {
  const types = ['completeness', 'accuracy', 'consistency', 'timeliness']
  const data: any[] = []

  for (let i = 1; i <= 20; i++) {
    const type = types[Math.floor(Math.random() * types.length)]
    data.push({
      id: i,
      name: `${getRuleTypeLabel(type)}规则_${i}`,
      type: type,
      description: `这是${getRuleTypeLabel(type)}规则${i}的描述信息，用于校验数据的${getRuleTypeLabel(type)}`,
      target: `table_${i}.field_${i}`,
      passRate: Math.floor(Math.random() * 30) + 70, // 70-100
      lastExecuteTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toLocaleString('zh-CN'),
      status: Math.random() > 0.3 ? 'active' : 'inactive',
      expression: `规则表达式${i}`
    })
  }
  return data
}

// 加载探查数据
const loadExplorationData = () => {
  loading.value = true
  setTimeout(() => {
    const allData = generateExplorationData()
    let filteredData = allData
    if (searchForm.dataSource) {
      filteredData = filteredData.filter(item => item.dataSource.includes(searchForm.dataSource))
    }
    if (searchForm.tableName) {
      filteredData = filteredData.filter(item => item.tableName.includes(searchForm.tableName))
    }
    if (searchForm.qualityLevel) {
      filteredData = filteredData.filter(item => item.qualityLevel === searchForm.qualityLevel)
    }
    
    pagination.total = filteredData.length
    const start = (pagination.page - 1) * pagination.size
    const end = start + pagination.size
    explorationData.value = filteredData.slice(start, end)
    loading.value = false
  }, 500)
}

// 加载规则数据
const loadRuleData = () => {
  ruleLoading.value = true
  setTimeout(() => {
    const allData = generateRuleData()
    let filteredData = allData
    if (ruleSearchForm.name) {
      filteredData = filteredData.filter(item => item.name.includes(ruleSearchForm.name))
    }
    if (ruleSearchForm.type) {
      filteredData = filteredData.filter(item => item.type === ruleSearchForm.type)
    }
    if (ruleSearchForm.status) {
      filteredData = filteredData.filter(item => item.status === ruleSearchForm.status)
    }
    
    rulePagination.total = filteredData.length
    const start = (rulePagination.page - 1) * rulePagination.size
    const end = start + rulePagination.size
    ruleData.value = filteredData.slice(start, end)
    ruleLoading.value = false
  }, 500)
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadExplorationData()
}

// 重置
const handleReset = () => {
  searchForm.dataSource = ''
  searchForm.tableName = ''
  searchForm.qualityLevel = ''
  handleSearch()
}

// 规则搜索
const handleRuleSearch = () => {
  rulePagination.page = 1
  loadRuleData()
}

// 规则重置
const handleRuleReset = () => {
  ruleSearchForm.name = ''
  ruleSearchForm.type = ''
  ruleSearchForm.status = ''
  handleRuleSearch()
}

// 刷新
const handleRefresh = () => {
  loadExplorationData()
}

// 刷新规则
const handleRefreshRules = () => {
  loadRuleData()
}

// 开始探查
const handleStartExploration = () => {
  ElMessage.success('开始数据质量探查...')
  setTimeout(() => {
    ElMessage.success('探查完成')
    loadExplorationData()
  }, 2000)
}

// 导出报告
const handleExportReport = () => {
  ElMessage.success('导出报告成功')
}

// 查看详情
const handleViewDetail = (row: any) => {
  currentRow.value = row
  detailDialogVisible.value = true
}

// 新增规则
const handleAddRule = () => {
  ruleEditMode.value = 'add'
  Object.assign(ruleForm, {
    name: '',
    type: '',
    target: '',
    description: '',
    expression: '',
    status: 'active'
  })
  ruleDialogVisible.value = true
}

// 执行校验
const handleExecuteRules = () => {
  ElMessage.success('开始执行规则校验...')
  setTimeout(() => {
    ElMessage.success('校验完成')
    loadRuleData()
  }, 2000)
}

// 查看规则
const handleViewRule = (row: any) => {
  ElMessage.info(`查看规则：${row.name}`)
}

// 编辑规则
const handleEditRule = (row: any) => {
  ruleEditMode.value = 'edit'
  Object.assign(ruleForm, row)
  ruleDialogVisible.value = true
}

// 删除规则
const handleDeleteRule = (row: any) => {
  ElMessageBox.confirm('确定要删除这条规则吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('删除成功')
    loadRuleData()
  }).catch(() => {})
}

// 保存规则
const handleSaveRule = () => {
  ruleFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      ElMessage.success(ruleEditMode.value === 'add' ? '新增成功' : '编辑成功')
      ruleDialogVisible.value = false
      loadRuleData()
    }
  })
}

// 分页变化
const handleSizeChange = () => {
  loadExplorationData()
}

const handlePageChange = () => {
  loadExplorationData()
}

const handleRuleSizeChange = () => {
  loadRuleData()
}

const handleRulePageChange = () => {
  loadRuleData()
}

onMounted(() => {
  loadExplorationData()
  loadRuleData()
})
</script>

<style scoped lang="scss">
</style>
