<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Search, Plus, Download, Edit, Delete, View, Calendar, DocumentCopy } from '@element-plus/icons-vue'

// 定义类型
interface MaintenanceRecord {
  id: string
  deviceName: string
  deviceId: string
  type: 'daily' | 'repair' | 'upgrade' | 'inspection'
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  assignee: string
  maintenanceDate: string
  completedDate?: string
  description: string
  partsReplaced?: string[]
  costAmount?: number
  beforeStatus?: string
  afterStatus?: string
  photos?: string[]
  documents?: string[]
}

interface MaintenancePlan {
  id: string
  deviceId: string
  deviceName: string
  type: 'daily' | 'repair' | 'upgrade' | 'inspection'
  cycle: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  nextDate: string
  assignee: string
  enabled: boolean
  description: string
  notifyDays: number
}

// 响应式数据
const loading = ref(false)
const searchForm = reactive({
  keyword: '',
  type: '',
  status: ''
})

const maintenanceRecords = ref<MaintenanceRecord[]>([])
const maintenancePlans = ref<MaintenancePlan[]>([])

// 对话框控制
const recordDialogVisible = ref(false)
const planDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)

// 表单数据
const recordFormRef = ref<FormInstance>()
const planFormRef = ref<FormInstance>()
const recordForm = reactive<Partial<MaintenanceRecord>>({
  deviceName: '',
  deviceId: '',
  type: 'daily',
  status: 'pending',
  assignee: '',
  maintenanceDate: '',
  description: '',
  partsReplaced: [],
  costAmount: 0
})

const planForm = reactive<Partial<MaintenancePlan>>({
  deviceId: '',
  deviceName: '',
  type: 'daily',
  cycle: 'monthly',
  nextDate: '',
  assignee: '',
  enabled: true,
  description: '',
  notifyDays: 3
})

// 详情数据
const currentDetail = ref<MaintenanceRecord | null>(null)

// 表单验证规则
const recordRules: FormRules = {
  deviceName: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择维护类型', trigger: 'change' }],
  assignee: [{ required: true, message: '请输入维护人员', trigger: 'blur' }],
  maintenanceDate: [{ required: true, message: '请选择维护时间', trigger: 'change' }],
  description: [{ required: true, message: '请输入维护内容', trigger: 'blur' }]
}

const planRules: FormRules = {
  deviceName: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择维护类型', trigger: 'change' }],
  cycle: [{ required: true, message: '请选择执行周期', trigger: 'change' }],
  nextDate: [{ required: true, message: '请选择下次维护时间', trigger: 'change' }],
  assignee: [{ required: true, message: '请输入维护人员', trigger: 'blur' }]
}

// 维护类型选项
const maintenanceTypes = [
  { label: '日常保养', value: 'daily', color: 'success' },
  { label: '故障维修', value: 'repair', color: 'warning' },
  { label: '升级更新', value: 'upgrade', color: 'primary' },
  { label: '巡检', value: 'inspection', color: 'info' }
]

// 维护状态选项
const maintenanceStatus = [
  { label: '待执行', value: 'pending', color: 'info' },
  { label: '执行中', value: 'processing', color: 'primary' },
  { label: '已完成', value: 'completed', color: 'success' },
  { label: '已取消', value: 'cancelled', color: 'danger' }
]

// 周期选项
const cycleOptions = [
  { label: '每天', value: 'daily' },
  { label: '每周', value: 'weekly' },
  { label: '每月', value: 'monthly' },
  { label: '每季度', value: 'quarterly' },
  { label: '每年', value: 'yearly' }
]

// 统计数据
const statistics = reactive({
  totalRecords: 0,
  pendingTasks: 0,
  completedToday: 0,
  totalCost: 0,
  overdueCount: 0
})

// 计算属性 - 过滤后的记录
const filteredRecords = computed(() => {
  return maintenanceRecords.value.filter(record => {
    const matchKeyword = !searchForm.keyword ||
      record.deviceName.includes(searchForm.keyword) ||
      record.assignee.includes(searchForm.keyword)
    const matchType = !searchForm.type || record.type === searchForm.type
    const matchStatus = !searchForm.status || record.status === searchForm.status
    return matchKeyword && matchType && matchStatus
  })
})

// 计算属性 - 逾期的计划
const overduePlans = computed(() => {
  const today = new Date()
  return maintenancePlans.value.filter(plan => {
    return plan.enabled && new Date(plan.nextDate) < today
  })
})

// 获取类型标签
const getTypeLabel = (type: string) => {
  return maintenanceTypes.find(t => t.value === type)?.label || type
}

// 获取类型颜色
const getTypeColor = (type: string) => {
  return maintenanceTypes.find(t => t.value === type)?.color || 'default'
}

// 获取状态标签
const getStatusLabel = (status: string) => {
  return maintenanceStatus.find(s => s.value === status)?.label || status
}

// 获取状态颜色
const getStatusColor = (status: string) => {
  return maintenanceStatus.find(s => s.value === status)?.color || 'default'
}

// 获取周期标签
const getCycleLabel = (cycle: string) => {
  return cycleOptions.find(c => c.value === cycle)?.label || cycle
}

// 加载维护记录
const loadMaintenanceRecords = async () => {
  loading.value = true

  // 模拟异步加载
  await new Promise(resolve => setTimeout(resolve, 800))

  // Mock 数据
  maintenanceRecords.value = [
    {
      id: 'MR001',
      deviceName: '注塑机A01',
      deviceId: 'DEV001',
      type: 'daily',
      status: 'completed',
      assignee: '张三',
      maintenanceDate: '2025-10-25 09:00',
      completedDate: '2025-10-25 10:30',
      description: '日常润滑保养，检查液压系统，清理设备表面',
      partsReplaced: ['液压油滤芯', '润滑脂'],
      costAmount: 350,
      beforeStatus: '良好',
      afterStatus: '优秀',
      photos: ['photo1.jpg', 'photo2.jpg']
    },
    {
      id: 'MR002',
      deviceName: '冲压机B02',
      deviceId: 'DEV002',
      type: 'repair',
      status: 'completed',
      assignee: '李四',
      maintenanceDate: '2025-10-26 14:00',
      completedDate: '2025-10-26 17:30',
      description: '紧急维修：电机异响，更换轴承',
      partsReplaced: ['电机轴承', '密封圈', '冷却液'],
      costAmount: 1850,
      beforeStatus: '故障',
      afterStatus: '良好'
    },
    {
      id: 'MR003',
      deviceName: '数控车床C03',
      deviceId: 'DEV003',
      type: 'processing',
      status: 'processing',
      assignee: '王五',
      maintenanceDate: '2025-10-29 08:00',
      description: '定期检查和校准，刀具更换'
    },
    {
      id: 'MR004',
      deviceName: '焊接机器人D04',
      deviceId: 'DEV004',
      type: 'upgrade',
      status: 'pending',
      assignee: '赵六',
      maintenanceDate: '2025-10-30 10:00',
      description: '系统软件升级，添加新功能模块',
      costAmount: 5000
    },
    {
      id: 'MR005',
      deviceName: '包装流水线E05',
      deviceId: 'DEV005',
      type: 'inspection',
      status: 'completed',
      assignee: '张三',
      maintenanceDate: '2025-10-28 15:00',
      completedDate: '2025-10-28 16:00',
      description: '每周巡检：检查传送带、传感器、气动系统',
      beforeStatus: '良好',
      afterStatus: '良好'
    },
    {
      id: 'MR006',
      deviceName: '激光切割机F06',
      deviceId: 'DEV006',
      type: 'repair',
      status: 'cancelled',
      assignee: '李四',
      maintenanceDate: '2025-10-24 10:00',
      description: '计划维修取消：设备已自行恢复正常'
    }
  ]

  // 更新统计数据
  updateStatistics()

  loading.value = false
}

// 加载维护计划
const loadMaintenancePlans = async () => {
  await new Promise(resolve => setTimeout(resolve, 500))

  maintenancePlans.value = [
    {
      id: 'MP001',
      deviceId: 'DEV001',
      deviceName: '注塑机A01',
      type: 'daily',
      cycle: 'weekly',
      nextDate: '2025-11-01',
      assignee: '张三',
      enabled: true,
      description: '每周一次的日常保养和润滑',
      notifyDays: 1
    },
    {
      id: 'MP002',
      deviceId: 'DEV003',
      deviceName: '数控车床C03',
      type: 'inspection',
      cycle: 'monthly',
      nextDate: '2025-11-05',
      assignee: '王五',
      enabled: true,
      description: '月度精度校准和检查',
      notifyDays: 3
    },
    {
      id: 'MP003',
      deviceId: 'DEV005',
      deviceName: '包装流水线E05',
      type: 'inspection',
      cycle: 'weekly',
      nextDate: '2025-10-28',
      assignee: '张三',
      enabled: true,
      description: '每周巡检',
      notifyDays: 1
    },
    {
      id: 'MP004',
      deviceId: 'DEV002',
      deviceName: '冲压机B02',
      type: 'daily',
      cycle: 'quarterly',
      nextDate: '2025-12-15',
      assignee: '李四',
      enabled: false,
      description: '季度大保养',
      notifyDays: 7
    }
  ]
}

// 更新统计数据
const updateStatistics = () => {
  statistics.totalRecords = maintenanceRecords.value.length
  statistics.pendingTasks = maintenanceRecords.value.filter(r => r.status === 'pending').length

  const today = new Date().toISOString().split('T')[0]
  statistics.completedToday = maintenanceRecords.value.filter(r =>
    r.status === 'completed' && r.completedDate?.startsWith(today)
  ).length

  statistics.totalCost = maintenanceRecords.value.reduce((sum, r) => sum + (r.costAmount || 0), 0)
  statistics.overdueCount = overduePlans.value.length
}

// 搜索
const handleSearch = () => {
  // 过滤已通过计算属性实现
}

// 重置搜索
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.type = ''
  searchForm.status = ''
}

// 新增维护记录
const handleAddRecord = () => {
  dialogTitle.value = '新增维护记录'
  isEdit.value = false
  resetRecordForm()
  recordDialogVisible.value = true
}

// 编辑维护记录
const handleEditRecord = (row: MaintenanceRecord) => {
  dialogTitle.value = '编辑维护记录'
  isEdit.value = true
  Object.assign(recordForm, row)
  recordDialogVisible.value = true
}

// 删除维护记录
const handleDeleteRecord = async (row: MaintenanceRecord) => {
  try {
    await ElMessageBox.confirm('确认删除该维护记录吗？', '提示', {
      type: 'warning'
    })

    // 模拟删除
    await new Promise(resolve => setTimeout(resolve, 300))

    const index = maintenanceRecords.value.findIndex(r => r.id === row.id)
    if (index > -1) {
      maintenanceRecords.value.splice(index, 1)
      updateStatistics()
      ElMessage.success('删除成功')
    }
  } catch {
    // 取消删除
  }
}

// 查看详情
const handleViewDetail = (row: MaintenanceRecord) => {
  currentDetail.value = row
  detailDialogVisible.value = true
}

// 提交维护记录
const submitRecordForm = async () => {
  if (!recordFormRef.value) return

  await recordFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true

      // 模拟保存
      await new Promise(resolve => setTimeout(resolve, 500))

      if (isEdit.value) {
        // 更新
        const index = maintenanceRecords.value.findIndex(r => r.id === recordForm.id)
        if (index > -1) {
          maintenanceRecords.value[index] = { ...recordForm as MaintenanceRecord }
        }
        ElMessage.success('更新成功')
      } else {
        // 新增
        const newRecord: MaintenanceRecord = {
          ...recordForm as MaintenanceRecord,
          id: 'MR' + String(Date.now()).slice(-6)
        }
        maintenanceRecords.value.unshift(newRecord)
        ElMessage.success('新增成功')
      }

      updateStatistics()
      recordDialogVisible.value = false
      loading.value = false
    }
  })
}

// 重置维护记录表单
const resetRecordForm = () => {
  recordForm.id = undefined
  recordForm.deviceName = ''
  recordForm.deviceId = ''
  recordForm.type = 'daily'
  recordForm.status = 'pending'
  recordForm.assignee = ''
  recordForm.maintenanceDate = ''
  recordForm.description = ''
  recordForm.partsReplaced = []
  recordForm.costAmount = 0
  recordFormRef.value?.resetFields()
}

// 新增维护计划
const handleAddPlan = () => {
  dialogTitle.value = '新增维护计划'
  isEdit.value = false
  resetPlanForm()
  planDialogVisible.value = true
}

// 编辑维护计划
const handleEditPlan = (row: MaintenancePlan) => {
  dialogTitle.value = '编辑维护计划'
  isEdit.value = true
  Object.assign(planForm, row)
  planDialogVisible.value = true
}

// 删除维护计划
const handleDeletePlan = async (row: MaintenancePlan) => {
  try {
    await ElMessageBox.confirm('确认删除该维护计划吗？', '提示', {
      type: 'warning'
    })

    await new Promise(resolve => setTimeout(resolve, 300))

    const index = maintenancePlans.value.findIndex(p => p.id === row.id)
    if (index > -1) {
      maintenancePlans.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  } catch {
    // 取消删除
  }
}

// 切换计划状态
const handleTogglePlan = async (row: MaintenancePlan) => {
  await new Promise(resolve => setTimeout(resolve, 200))
  row.enabled = !row.enabled
  ElMessage.success(row.enabled ? '计划已启用' : '计划已禁用')
}

// 提交维护计划
const submitPlanForm = async () => {
  if (!planFormRef.value) return

  await planFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true

      await new Promise(resolve => setTimeout(resolve, 500))

      if (isEdit.value) {
        const index = maintenancePlans.value.findIndex(p => p.id === planForm.id)
        if (index > -1) {
          maintenancePlans.value[index] = { ...planForm as MaintenancePlan }
        }
        ElMessage.success('更新成功')
      } else {
        const newPlan: MaintenancePlan = {
          ...planForm as MaintenancePlan,
          id: 'MP' + String(Date.now()).slice(-6)
        }
        maintenancePlans.value.unshift(newPlan)
        ElMessage.success('新增成功')
      }

      planDialogVisible.value = false
      loading.value = false
    }
  })
}

// 重置维护计划表单
const resetPlanForm = () => {
  planForm.id = undefined
  planForm.deviceId = ''
  planForm.deviceName = ''
  planForm.type = 'daily'
  planForm.cycle = 'monthly'
  planForm.nextDate = ''
  planForm.assignee = ''
  planForm.enabled = true
  planForm.description = ''
  planForm.notifyDays = 3
  planFormRef.value?.resetFields()
}

// 导出报告
const handleExport = () => {
  ElMessage.info('正在生成维护报告...')
  setTimeout(() => {
    ElMessage.success('报告导出成功')
  }, 1000)
}

// 初始化
onMounted(() => {
  loadMaintenanceRecords()
  loadMaintenancePlans()
})
</script>

<template>
  <div class="maintenance-container">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="statistics-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ statistics.totalRecords }}</div>
            <div class="stat-label">维护记录总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-value" style="color: #409eff">{{ statistics.pendingTasks }}</div>
            <div class="stat-label">待执行任务</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-value" style="color: #67c23a">{{ statistics.completedToday }}</div>
            <div class="stat-label">今日完成</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-value" style="color: #e6a23c">{{ statistics.overdueCount }}</div>
            <div class="stat-label">逾期任务</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 主要内容区域 -->
    <el-row :gutter="20" class="main-content">
      <!-- 左侧：维护计划列表 -->
      <el-col :span="8">
        <el-card shadow="never" class="plan-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><Calendar /></el-icon> 维护计划</span>
              <el-button type="primary" :icon="Plus" size="small" @click="handleAddPlan">新增计划</el-button>
            </div>
          </template>

          <div class="plan-list">
            <div v-for="plan in maintenancePlans" :key="plan.id" class="plan-item">
              <div class="plan-header">
                <div>
                  <el-tag :type="getTypeColor(plan.type)" size="small">{{ getTypeLabel(plan.type) }}</el-tag>
                  <span class="plan-device-name">{{ plan.deviceName }}</span>
                </div>
                <el-switch v-model="plan.enabled" size="small" @change="handleTogglePlan(plan)" />
              </div>
              <div class="plan-content">
                <div class="plan-info">
                  <span class="label">周期：</span>
                  <span>{{ getCycleLabel(plan.cycle) }}</span>
                </div>
                <div class="plan-info">
                  <span class="label">下次维护：</span>
                  <span :class="{ 'overdue': new Date(plan.nextDate) < new Date() }">{{ plan.nextDate }}</span>
                </div>
                <div class="plan-info">
                  <span class="label">负责人：</span>
                  <span>{{ plan.assignee }}</span>
                </div>
              </div>
              <div class="plan-actions">
                <el-button type="primary" link :icon="Edit" size="small" @click="handleEditPlan(plan)">编辑</el-button>
                <el-button type="danger" link :icon="Delete" size="small" @click="handleDeletePlan(plan)">删除</el-button>
              </div>
            </div>

            <el-empty v-if="maintenancePlans.length === 0" description="暂无维护计划" :image-size="100" />
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：维护记录 -->
      <el-col :span="16">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span><el-icon><DocumentCopy /></el-icon> 维护记录</span>
            </div>
          </template>

          <!-- 搜索栏 -->
          <div class="search-bar">
            <el-form :inline="true" :model="searchForm">
              <el-form-item>
                <el-input
                  v-model="searchForm.keyword"
                  placeholder="搜索设备名称或维护人员"
                  :prefix-icon="Search"
                  clearable
                  style="width: 240px"
                />
              </el-form-item>
              <el-form-item>
                <el-select v-model="searchForm.type" placeholder="维护类型" clearable style="width: 140px">
                  <el-option
                    v-for="type in maintenanceTypes"
                    :key="type.value"
                    :label="type.label"
                    :value="type.value"
                  />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-select v-model="searchForm.status" placeholder="维护状态" clearable style="width: 140px">
                  <el-option
                    v-for="status in maintenanceStatus"
                    :key="status.value"
                    :label="status.label"
                    :value="status.value"
                  />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
                <el-button @click="handleReset">重置</el-button>
              </el-form-item>
            </el-form>

            <div class="action-buttons">
              <el-button type="primary" :icon="Plus" @click="handleAddRecord">新增记录</el-button>
              <el-button :icon="Download" @click="handleExport">导出报告</el-button>
            </div>
          </div>

          <!-- 维护记录表格 -->
          <el-table :data="filteredRecords" v-loading="loading" stripe>
            <el-table-column prop="id" label="记录ID" width="100" />
            <el-table-column prop="deviceName" label="设备名称" width="140" />
            <el-table-column prop="type" label="维护类型" width="110">
              <template #default="{ row }">
                <el-tag :type="getTypeColor(row.type)" size="small">{{ getTypeLabel(row.type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="assignee" label="维护人员" width="100" />
            <el-table-column prop="maintenanceDate" label="维护时间" width="160" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusColor(row.status)" size="small">{{ getStatusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="costAmount" label="费用" width="100">
              <template #default="{ row }">
                <span v-if="row.costAmount">¥{{ row.costAmount }}</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link :icon="View" size="small" @click="handleViewDetail(row)">详情</el-button>
                <el-button type="primary" link :icon="Edit" size="small" @click="handleEditRecord(row)">编辑</el-button>
                <el-button type="danger" link :icon="Delete" size="small" @click="handleDeleteRecord(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 新增/编辑维护记录对话框 -->
    <el-dialog
      v-model="recordDialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="recordFormRef" :model="recordForm" :rules="recordRules" label-width="100px">
        <el-form-item label="设备名称" prop="deviceName">
          <el-input v-model="recordForm.deviceName" placeholder="请输入设备名称" />
        </el-form-item>
        <el-form-item label="维护类型" prop="type">
          <el-select v-model="recordForm.type" placeholder="请选择维护类型" style="width: 100%">
            <el-option
              v-for="type in maintenanceTypes"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="维护状态" prop="status">
          <el-select v-model="recordForm.status" placeholder="请选择维护状态" style="width: 100%">
            <el-option
              v-for="status in maintenanceStatus"
              :key="status.value"
              :label="status.label"
              :value="status.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="维护人员" prop="assignee">
          <el-input v-model="recordForm.assignee" placeholder="请输入维护人员" />
        </el-form-item>
        <el-form-item label="维护时间" prop="maintenanceDate">
          <el-date-picker
            v-model="recordForm.maintenanceDate"
            type="datetime"
            placeholder="选择维护时间"
            style="width: 100%"
            value-format="YYYY-MM-DD HH:mm"
          />
        </el-form-item>
        <el-form-item label="维护费用">
          <el-input-number v-model="recordForm.costAmount" :min="0" :precision="2" :step="100" style="width: 100%" />
        </el-form-item>
        <el-form-item label="维护内容" prop="description">
          <el-input
            v-model="recordForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入维护内容描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="recordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRecordForm" :loading="loading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 新增/编辑维护计划对话框 -->
    <el-dialog
      v-model="planDialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="planFormRef" :model="planForm" :rules="planRules" label-width="120px">
        <el-form-item label="设备名称" prop="deviceName">
          <el-input v-model="planForm.deviceName" placeholder="请输入设备名称" />
        </el-form-item>
        <el-form-item label="维护类型" prop="type">
          <el-select v-model="planForm.type" placeholder="请选择维护类型" style="width: 100%">
            <el-option
              v-for="type in maintenanceTypes"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="执行周期" prop="cycle">
          <el-select v-model="planForm.cycle" placeholder="请选择执行周期" style="width: 100%">
            <el-option
              v-for="cycle in cycleOptions"
              :key="cycle.value"
              :label="cycle.label"
              :value="cycle.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="下次维护时间" prop="nextDate">
          <el-date-picker
            v-model="planForm.nextDate"
            type="date"
            placeholder="选择下次维护时间"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="维护人员" prop="assignee">
          <el-input v-model="planForm.assignee" placeholder="请输入维护人员" />
        </el-form-item>
        <el-form-item label="提前通知天数">
          <el-input-number v-model="planForm.notifyDays" :min="0" :max="30" style="width: 100%" />
        </el-form-item>
        <el-form-item label="计划状态">
          <el-switch v-model="planForm.enabled" active-text="启用" inactive-text="禁用" />
        </el-form-item>
        <el-form-item label="计划说明">
          <el-input
            v-model="planForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入计划说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="planDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPlanForm" :loading="loading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 维护记录详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="维护记录详情"
      width="700px"
    >
      <div v-if="currentDetail" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="记录ID">{{ currentDetail.id }}</el-descriptions-item>
          <el-descriptions-item label="设备名称">{{ currentDetail.deviceName }}</el-descriptions-item>
          <el-descriptions-item label="维护类型">
            <el-tag :type="getTypeColor(currentDetail.type)">{{ getTypeLabel(currentDetail.type) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="维护状态">
            <el-tag :type="getStatusColor(currentDetail.status)">{{ getStatusLabel(currentDetail.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="维护人员">{{ currentDetail.assignee }}</el-descriptions-item>
          <el-descriptions-item label="维护时间">{{ currentDetail.maintenanceDate }}</el-descriptions-item>
          <el-descriptions-item label="完成时间">
            {{ currentDetail.completedDate || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="维护费用">
            <span v-if="currentDetail.costAmount" style="color: #e6a23c; font-weight: bold">
              ¥{{ currentDetail.costAmount }}
            </span>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="维护前状态">{{ currentDetail.beforeStatus || '-' }}</el-descriptions-item>
          <el-descriptions-item label="维护后状态">{{ currentDetail.afterStatus || '-' }}</el-descriptions-item>
          <el-descriptions-item label="维护内容" :span="2">
            {{ currentDetail.description }}
          </el-descriptions-item>
          <el-descriptions-item label="更换部件" :span="2">
            <el-tag
              v-for="(part, index) in currentDetail.partsReplaced"
              :key="index"
              size="small"
              style="margin-right: 8px"
            >
              {{ part }}
            </el-tag>
            <span v-if="!currentDetail.partsReplaced || currentDetail.partsReplaced.length === 0">-</span>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 时间线展示 -->
        <div v-if="currentDetail.status === 'completed'" class="timeline-section">
          <h4>维护流程</h4>
          <el-timeline>
            <el-timeline-item timestamp="创建记录" placement="top">
              维护任务已创建并分配给 {{ currentDetail.assignee }}
            </el-timeline-item>
            <el-timeline-item timestamp="开始维护" placement="top" color="primary">
              {{ currentDetail.maintenanceDate }} 开始执行维护任务
            </el-timeline-item>
            <el-timeline-item
              v-if="currentDetail.completedDate"
              timestamp="维护完成"
              placement="top"
              type="success"
              color="success"
            >
              {{ currentDetail.completedDate }} 维护任务完成
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.maintenance-container {
  .statistics-row {
    margin-bottom: 20px;

    .stat-card {
      cursor: pointer;
      transition: transform 0.2s;

      &:hover {
        transform: translateY(-2px);
      }

      .stat-content {
        text-align: center;

        .stat-value {
          font-size: 32px;
          font-weight: bold;
          color: #303133;
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 14px;
          color: #909399;
        }
      }
    }
  }

  .main-content {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 500;

      span {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }

    .plan-card {
      height: calc(100vh - 280px);

      .plan-list {
        max-height: calc(100vh - 360px);
        overflow-y: auto;

        .plan-item {
          padding: 16px;
          margin-bottom: 12px;
          background: #f5f7fa;
          border-radius: 8px;
          transition: all 0.3s;

          &:hover {
            background: #e8edf3;
            transform: translateX(4px);
          }

          .plan-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;

            .plan-device-name {
              margin-left: 8px;
              font-weight: 500;
              color: #303133;
            }
          }

          .plan-content {
            margin-bottom: 12px;

            .plan-info {
              display: flex;
              align-items: center;
              margin-bottom: 6px;
              font-size: 13px;
              color: #606266;

              .label {
                color: #909399;
                margin-right: 4px;
              }

              .overdue {
                color: #f56c6c;
                font-weight: 500;
              }
            }
          }

          .plan-actions {
            display: flex;
            gap: 12px;
            padding-top: 8px;
            border-top: 1px solid #dcdfe6;
          }
        }
      }
    }

    .search-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;

      .action-buttons {
        display: flex;
        gap: 10px;
      }
    }
  }

  .detail-content {
    .timeline-section {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #ebeef5;

      h4 {
        margin-bottom: 16px;
        color: #303133;
      }
    }
  }
}

// 滚动条样式
:deep(.plan-list::-webkit-scrollbar) {
  width: 6px;
}

:deep(.plan-list::-webkit-scrollbar-track) {
  background: #f1f1f1;
  border-radius: 3px;
}

:deep(.plan-list::-webkit-scrollbar-thumb) {
  background: #c1c1c1;
  border-radius: 3px;

  &:hover {
    background: #a8a8a8;
  }
}
</style>
