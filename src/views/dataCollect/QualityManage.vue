<template>
  <div class="p-4 bg-white h-full">
    <div class="mb-4 flex justify-between items-center">
      <h2 class="text-xl font-bold">数据质量管理</h2>
      <div>
        <el-button @click="handleQualityReport">
          <el-icon class="mr-1"><Document /></el-icon>
          质量报告
        </el-button>
        <el-button type="primary" @click="handleAdd">
          <el-icon class="mr-1"><Plus /></el-icon>
          新增质量规则
        </el-button>
      </div>
    </div>

    <!-- 质量概览 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="6">
        <el-card class="text-center">
          <div class="text-2xl font-bold text-green-600">{{ qualityMetrics.passRate }}%</div>
          <div class="text-gray-500 mt-2">质量合格率</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="text-center">
          <div class="text-2xl font-bold text-blue-600">{{ qualityMetrics.totalChecked }}</div>
          <div class="text-gray-500 mt-2">检查数据量</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="text-center">
          <div class="text-2xl font-bold text-orange-600">{{ qualityMetrics.anomalyCount }}</div>
          <div class="text-gray-500 mt-2">异常数据量</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="text-center">
          <div class="text-2xl font-bold text-red-600">{{ qualityMetrics.ruleCount }}</div>
          <div class="text-gray-500 mt-2">质量规则数</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索栏 -->
    <el-card class="mb-4">
      <el-form :inline="true" :model="searchForm" class="demo-form-inline">
        <el-form-item label="规则名称">
          <el-input v-model="searchForm.name" placeholder="请输入规则名称" clearable />
        </el-form-item>
        <el-form-item label="规则类型">
          <el-select v-model="searchForm.type" placeholder="请选择" clearable>
            <el-option label="完整性检查" value="COMPLETENESS" />
            <el-option label="唯一性验证" value="UNIQUENESS" />
            <el-option label="格式合规校验" value="FORMAT" />
            <el-option label="业务规则校验" value="BUSINESS" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable>
            <el-option label="启用" value="ENABLED" />
            <el-option label="禁用" value="DISABLED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 规则列表 -->
    <el-card class="mb-4">
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="name" label="规则名称" min-width="150" />
        <el-table-column prop="type" label="规则类型" width="140">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">{{ getTypeLabel(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="applyTo" label="应用对象" min-width="150" />
        <el-table-column prop="checkCount" label="检查次数" width="100" />
        <el-table-column prop="anomalyCount" label="异常次数" width="100">
          <template #default="{ row }">
            <span :class="row.anomalyCount > 0 ? 'text-red-600' : ''">{{ row.anomalyCount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="'ENABLED'"
              :inactive-value="'DISABLED'"
              @change="handleToggleStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleViewAnomaly(row)">
              <el-icon><Warning /></el-icon>
              异常数据
            </el-button>
            <el-button link type="primary" size="small" @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

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

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="900px"
      @close="handleDialogClose"
    >
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本信息" name="basic">
          <el-form
            ref="formRef"
            :model="formData"
            :rules="formRules"
            label-width="120px"
          >
            <el-form-item label="规则名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入规则名称" />
            </el-form-item>
            <el-form-item label="规则类型" prop="type">
              <el-select v-model="formData.type" placeholder="请选择规则类型" @change="handleTypeChange">
                <el-option label="完整性检查" value="COMPLETENESS" />
                <el-option label="唯一性验证" value="UNIQUENESS" />
                <el-option label="格式合规校验" value="FORMAT" />
                <el-option label="业务规则校验" value="BUSINESS" />
              </el-select>
            </el-form-item>
            <el-form-item label="应用对象" prop="applyTo">
              <el-select v-model="formData.applyTo" placeholder="请选择应用对象" filterable allow-create>
                <el-option label="全部任务" value="ALL" />
                <el-option
                  v-for="task in tasks"
                  :key="task.id"
                  :label="task.name"
                  :value="task.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="检查时机">
              <el-checkbox-group v-model="formData.checkTiming">
                <el-checkbox label="BEFORE">采集前</el-checkbox>
                <el-checkbox label="AFTER">采集后</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            <el-form-item label="描述" prop="description">
              <el-input
                v-model="formData.description"
                type="textarea"
                :rows="3"
                placeholder="请输入描述信息"
              />
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="规则配置" name="config">
          <!-- 完整性检查配置 -->
          <div v-if="formData.type === 'COMPLETENESS'">
            <el-form :model="formData" label-width="120px">
              <el-form-item label="检查字段">
                <el-select
                  v-model="formData.checkFields"
                  multiple
                  placeholder="请选择要检查的字段"
                  filterable
                >
                  <el-option label="全部字段" value="ALL" />
                  <el-option
                    v-for="field in fields"
                    :key="field"
                    :label="field"
                    :value="field"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="允许空值比例">
                <el-input-number
                  v-model="formData.allowNullRatio"
                  :min="0"
                  :max="100"
                  :precision="2"
                />
                <span class="ml-2">%</span>
              </el-form-item>
              <el-form-item label="必填字段">
                <el-select
                  v-model="formData.requiredFields"
                  multiple
                  placeholder="请选择必填字段"
                  filterable
                >
                  <el-option
                    v-for="field in fields"
                    :key="field"
                    :label="field"
                    :value="field"
                  />
                </el-select>
              </el-form-item>
            </el-form>
          </div>

          <!-- 唯一性验证配置 -->
          <div v-if="formData.type === 'UNIQUENESS'">
            <el-form :model="formData" label-width="120px">
              <el-form-item label="唯一性字段">
                <el-select
                  v-model="formData.uniqueFields"
                  multiple
                  placeholder="请选择唯一性字段（可多选）"
                  filterable
                >
                  <el-option
                    v-for="field in fields"
                    :key="field"
                    :label="field"
                    :value="field"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="检查范围">
                <el-radio-group v-model="formData.checkScope">
                  <el-radio label="BATCH">当前批次</el-radio>
                  <el-radio label="TABLE">整张表</el-radio>
                  <el-radio label="DATABASE">整个数据库</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-form>
          </div>

          <!-- 格式合规校验配置 -->
          <div v-if="formData.type === 'FORMAT'">
            <el-form :model="formData" label-width="120px">
              <el-form-item label="检查字段">
                <el-input v-model="formData.checkField" placeholder="请输入字段名" />
              </el-form-item>
              <el-form-item label="格式类型">
                <el-select v-model="formData.formatType" placeholder="请选择格式类型">
                  <el-option label="手机号" value="PHONE" />
                  <el-option label="邮箱" value="EMAIL" />
                  <el-option label="身份证" value="ID_CARD" />
                  <el-option label="日期时间" value="DATETIME" />
                  <el-option label="数字" value="NUMBER" />
                  <el-option label="正则表达式" value="REGEX" />
                </el-select>
              </el-form-item>
              <el-form-item v-if="formData.formatType === 'REGEX'" label="正则表达式">
                <el-input v-model="formData.regexPattern" placeholder="请输入正则表达式" />
              </el-form-item>
              <el-form-item v-if="formData.formatType === 'DATETIME'" label="日期格式">
                <el-input v-model="formData.dateFormat" placeholder="例如: yyyy-MM-dd HH:mm:ss" />
              </el-form-item>
            </el-form>
          </div>

          <!-- 业务规则校验配置 -->
          <div v-if="formData.type === 'BUSINESS'">
            <el-form :model="formData" label-width="120px">
              <el-form-item label="规则表达式">
                <el-input
                  v-model="formData.businessRule"
                  type="textarea"
                  :rows="5"
                  placeholder="请输入业务规则表达式，例如: age >= 18 AND age <= 100"
                />
              </el-form-item>
              <el-form-item label="或使用脚本">
                <el-input
                  v-model="formData.customScript"
                  type="textarea"
                  :rows="5"
                  placeholder="请输入JavaScript校验脚本"
                />
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 异常数据对话框 -->
    <el-dialog v-model="anomalyDialogVisible" title="异常数据" width="1200px">
      <div class="mb-4 flex justify-between items-center">
        <div>
          <el-tag>规则: {{ currentRule?.name }}</el-tag>
          <el-tag class="ml-2" type="danger">异常数量: {{ anomalyData.length }}</el-tag>
        </div>
        <div>
          <el-button @click="handleExportAnomaly">导出异常数据</el-button>
          <el-button type="primary" @click="handleMarkResolved">标记为已处理</el-button>
        </div>
      </div>
      <el-table :data="anomalyData" stripe max-height="500">
        <el-table-column type="selection" width="55" />
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="dataId" label="数据ID" width="120" />
        <el-table-column prop="field" label="异常字段" width="150" />
        <el-table-column prop="value" label="异常值" min-width="150" show-overflow-tooltip />
        <el-table-column prop="errorType" label="错误类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getErrorTagType(row.errorType)">{{ row.errorType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="errorMessage" label="错误信息" min-width="200" show-overflow-tooltip />
        <el-table-column prop="checkTime" label="检查时间" width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'RESOLVED' ? 'success' : 'warning'">
              {{ row.status === 'RESOLVED' ? '已处理' : '未处理' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 质量报告对话框 -->
    <el-dialog v-model="reportDialogVisible" title="数据质量报告" width="1000px">
      <el-tabs v-model="reportTab">
        <el-tab-pane label="质量概览" name="overview">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="检查时间">{{ reportData.checkTime }}</el-descriptions-item>
            <el-descriptions-item label="检查数据量">{{ reportData.totalChecked }}</el-descriptions-item>
            <el-descriptions-item label="合格数据量">{{ reportData.passCount }}</el-descriptions-item>
            <el-descriptions-item label="异常数据量">{{ reportData.anomalyCount }}</el-descriptions-item>
            <el-descriptions-item label="质量合格率">{{ reportData.passRate }}%</el-descriptions-item>
            <el-descriptions-item label="检查规则数">{{ reportData.ruleCount }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
        <el-tab-pane label="规则详情" name="rules">
          <el-table :data="reportData.ruleDetails" stripe>
            <el-table-column prop="ruleName" label="规则名称" min-width="150" />
            <el-table-column prop="checkCount" label="检查次数" width="100" />
            <el-table-column prop="anomalyCount" label="异常次数" width="100" />
            <el-table-column prop="passRate" label="合格率" width="100">
              <template #default="{ row }">
                {{ row.passRate }}%
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="异常分析" name="analysis">
          <div class="mb-4">
            <h4 class="mb-2">异常类型分布</h4>
            <el-table :data="reportData.anomalyAnalysis" stripe>
              <el-table-column prop="errorType" label="异常类型" min-width="150" />
              <el-table-column prop="count" label="数量" width="100" />
              <el-table-column prop="ratio" label="占比" width="100">
                <template #default="{ row }">
                  {{ row.ratio }}%
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="handleExportReport">导出报告</el-button>
        <el-button type="primary" @click="reportDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Warning, Document } from '@element-plus/icons-vue'

interface QualityRule {
  id: string
  name: string
  type: string
  description: string
  applyTo: string
  checkCount: number
  anomalyCount: number
  status: string
  checkTiming?: string[]
  checkFields?: string[]
  allowNullRatio?: number
  requiredFields?: string[]
  uniqueFields?: string[]
  checkScope?: string
  checkField?: string
  formatType?: string
  regexPattern?: string
  dateFormat?: string
  businessRule?: string
  customScript?: string
}

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const anomalyDialogVisible = ref(false)
const reportDialogVisible = ref(false)
const dialogTitle = ref('新增质量规则')
const activeTab = ref('basic')
const reportTab = ref('overview')
const formRef = ref()
const tableData = ref<QualityRule[]>([])
const anomalyData = ref<any[]>([])
const tasks = ref<any[]>([])
const fields = ref<string[]>(['id', 'name', 'email', 'phone', 'age', 'createTime'])
const currentRule = ref<QualityRule | null>(null)

const qualityMetrics = reactive({
  passRate: 0,
  totalChecked: 0,
  anomalyCount: 0,
  ruleCount: 0
})

const searchForm = reactive({
  name: '',
  type: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const formData = reactive<Partial<QualityRule>>({
  name: '',
  type: '',
  applyTo: '',
  description: '',
  checkTiming: ['AFTER']
})

const reportData = reactive({
  checkTime: '',
  totalChecked: 0,
  passCount: 0,
  anomalyCount: 0,
  passRate: 0,
  ruleCount: 0,
  ruleDetails: [] as any[],
  anomalyAnalysis: [] as any[]
})

const formRules = {
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择规则类型', trigger: 'change' }],
  applyTo: [{ required: true, message: '请选择应用对象', trigger: 'change' }]
}

// 获取类型标签类型
const getTypeTagType = (type: string) => {
  const typeMap: Record<string, string> = {
    COMPLETENESS: 'primary',
    UNIQUENESS: 'success',
    FORMAT: 'warning',
    BUSINESS: 'danger'
  }
  return typeMap[type] || 'info'
}

// 获取类型标签文本
const getTypeLabel = (type: string) => {
  const labelMap: Record<string, string> = {
    COMPLETENESS: '完整性检查',
    UNIQUENESS: '唯一性验证',
    FORMAT: '格式合规校验',
    BUSINESS: '业务规则校验'
  }
  return labelMap[type] || type
}

// 获取错误类型标签
const getErrorTagType = (errorType: string) => {
  const typeMap: Record<string, string> = {
    MISSING: 'danger',
    FORMAT_ERROR: 'warning',
    DUPLICATE: 'info',
    BUSINESS_RULE: 'danger'
  }
  return typeMap[errorType] || 'info'
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    // TODO: 调用实际API
    await new Promise(resolve => setTimeout(resolve, 500))
    tableData.value = [
      {
        id: '1',
        name: '用户信息完整性检查',
        type: 'COMPLETENESS',
        description: '检查用户信息的完整性',
        applyTo: '用户数据采集',
        checkCount: 1250,
        anomalyCount: 15,
        status: 'ENABLED'
      },
      {
        id: '2',
        name: '手机号格式校验',
        type: 'FORMAT',
        description: '验证手机号格式是否正确',
        applyTo: '全部任务',
        checkCount: 2500,
        anomalyCount: 8,
        status: 'ENABLED'
      },
      {
        id: '3',
        name: '用户ID唯一性验证',
        type: 'UNIQUENESS',
        description: '验证用户ID的唯一性',
        applyTo: '用户数据采集',
        checkCount: 1250,
        anomalyCount: 2,
        status: 'ENABLED'
      }
    ]
    pagination.total = tableData.value.length

    // 更新质量指标
    qualityMetrics.ruleCount = tableData.value.length
    qualityMetrics.totalChecked = tableData.value.reduce((sum, r) => sum + r.checkCount, 0)
    qualityMetrics.anomalyCount = tableData.value.reduce((sum, r) => sum + r.anomalyCount, 0)
    qualityMetrics.passRate = qualityMetrics.totalChecked > 0
      ? Number(((qualityMetrics.totalChecked - qualityMetrics.anomalyCount) / qualityMetrics.totalChecked * 100).toFixed(2))
      : 100
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 加载任务列表
const loadTasks = async () => {
  // TODO: 调用实际API
  tasks.value = [
    { id: '1', name: '用户数据采集' },
    { id: '2', name: '订单数据采集' }
  ]
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadData()
}

// 重置
const handleReset = () => {
  searchForm.name = ''
  searchForm.type = ''
  searchForm.status = ''
  handleSearch()
}

// 新增
const handleAdd = () => {
  dialogTitle.value = '新增质量规则'
  activeTab.value = 'basic'
  Object.assign(formData, {
    name: '',
    type: '',
    applyTo: '',
    description: '',
    checkTiming: ['AFTER']
  })
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: QualityRule) => {
  dialogTitle.value = '编辑质量规则'
  activeTab.value = 'basic'
  Object.assign(formData, row)
  dialogVisible.value = true
}

// 删除
const handleDelete = async (row: QualityRule) => {
  try {
    await ElMessageBox.confirm(`确定要删除规则"${row.name}"吗？`, '提示', {
      type: 'warning'
    })
    // TODO: 调用删除API
    ElMessage.success('删除成功')
    loadData()
  } catch {
    // 用户取消
  }
}

// 切换状态
const handleToggleStatus = async (row: QualityRule) => {
  // TODO: 调用状态切换API
  ElMessage.success(row.status === 'ENABLED' ? '已启用' : '已禁用')
}

// 类型变更
const handleTypeChange = () => {
  // 根据类型重置配置
  formData.checkFields = []
  formData.requiredFields = []
  formData.uniqueFields = []
  formData.checkField = ''
  formData.businessRule = ''
  formData.customScript = ''
}

// 查看异常数据
const handleViewAnomaly = async (row: QualityRule) => {
  currentRule.value = row
  loading.value = true
  try {
    // TODO: 调用获取异常数据API
    await new Promise(resolve => setTimeout(resolve, 500))
    anomalyData.value = [
      {
        id: '1',
        dataId: 'DATA001',
        field: 'phone',
        value: '123456789',
        errorType: 'FORMAT_ERROR',
        errorMessage: '手机号格式不正确',
        checkTime: '2024-01-20 10:30:00',
        status: 'UNRESOLVED'
      },
      {
        id: '2',
        dataId: 'DATA002',
        field: 'email',
        value: '',
        errorType: 'MISSING',
        errorMessage: '邮箱字段为空',
        checkTime: '2024-01-20 10:30:00',
        status: 'UNRESOLVED'
      }
    ]
    anomalyDialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取异常数据失败')
  } finally {
    loading.value = false
  }
}

// 导出异常数据
const handleExportAnomaly = () => {
  ElMessage.success('异常数据导出功能开发中')
}

// 标记为已处理
const handleMarkResolved = () => {
  ElMessage.success('已标记为已处理')
  loadData()
}

// 质量报告
const handleQualityReport = () => {
  // TODO: 加载质量报告数据
  reportData.checkTime = '2024-01-20 10:00:00'
  reportData.totalChecked = 5000
  reportData.passCount = 4975
  reportData.anomalyCount = 25
  reportData.passRate = 99.5
  reportData.ruleCount = 3
  reportData.ruleDetails = [
    { ruleName: '用户信息完整性检查', checkCount: 1250, anomalyCount: 15, passRate: 98.8 },
    { ruleName: '手机号格式校验', checkCount: 2500, anomalyCount: 8, passRate: 99.68 },
    { ruleName: '用户ID唯一性验证', checkCount: 1250, anomalyCount: 2, passRate: 99.84 }
  ]
  reportData.anomalyAnalysis = [
    { errorType: '格式错误', count: 8, ratio: 32 },
    { errorType: '数据缺失', count: 15, ratio: 60 },
    { errorType: '数据重复', count: 2, ratio: 8 }
  ]
  reportDialogVisible.value = true
}

// 导出报告
const handleExportReport = () => {
  ElMessage.success('质量报告导出功能开发中')
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitting.value = true
      try {
        // TODO: 调用保存API
        await new Promise(resolve => setTimeout(resolve, 1000))
        ElMessage.success(dialogTitle.value === '新增质量规则' ? '新增成功' : '编辑成功')
        dialogVisible.value = false
        loadData()
      } catch (error) {
        ElMessage.error('操作失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

// 对话框关闭
const handleDialogClose = () => {
  formRef.value?.resetFields()
}

// 分页
const handleSizeChange = () => {
  loadData()
}

const handlePageChange = () => {
  loadData()
}

onMounted(() => {
  loadData()
  loadTasks()
})
</script>

<style scoped lang="scss">
:deep(.el-card__body) {
  padding: 16px;
}
</style>