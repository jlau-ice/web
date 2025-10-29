<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// 限额类型
type QuotaType = 'qps' | 'daily' | 'total'
// 状态类型
type QuotaStatus = 'normal' | 'warning' | 'exceeded'
// 超额处理策略
type OverflowPolicy = 'reject' | 'queue' | 'downgrade'
// 适用对象类型
type TargetType = 'user' | 'app' | 'group'

// 额度策略接口
interface QuotaPolicy {
  id: string
  name: string
  targetType: TargetType
  targetName: string
  apiScope: string
  quotaType: QuotaType
  quotaLimit: number
  currentUsage: number
  period: string
  status: QuotaStatus
  overflowPolicy: OverflowPolicy
  warningThreshold: number
  enabled: boolean
  effectiveDate: string
  expiryDate: string
  createTime: string
  updateTime: string
}

// 额度使用记录
interface UsageRecord {
  time: string
  usage: number
  endpoint: string
  targetName: string
}

// 调整历史记录
interface AdjustmentHistory {
  id: string
  policyName: string
  operator: string
  operationType: string
  beforeValue: number
  afterValue: number
  reason: string
  adjustTime: string
}

// 搜索表单
const searchForm = reactive({
  keyword: '',
  status: '',
  quotaType: ''
})

// 表格数据
const tableData = ref<QuotaPolicy[]>([])
const loading = ref(false)

// 对话框控制
const dialogVisible = ref(false)
const dialogTitle = ref('新增额度策略')
const isEdit = ref(false)

// 额度分配对话框
const allocateDialogVisible = ref(false)
// 使用详情对话框
const detailDialogVisible = ref(false)
// 调整历史对话框
const historyDialogVisible = ref(false)

// 当前选中的策略
const currentPolicy = ref<QuotaPolicy | null>(null)

// 使用记录数据
const usageRecords = ref<UsageRecord[]>([])
// 调整历史数据
const adjustmentHistory = ref<AdjustmentHistory[]>([])

// 表单数据
const formRef = ref<FormInstance>()
const formData = reactive({
  id: '',
  name: '',
  targetType: 'user' as TargetType,
  targetName: '',
  apiScope: '',
  quotaType: 'qps' as QuotaType,
  quotaLimit: 100,
  period: 'second',
  overflowPolicy: 'reject' as OverflowPolicy,
  warningThreshold: 80,
  enabled: true,
  effectiveDate: '',
  expiryDate: ''
})

// 额度分配表单
const allocateFormRef = ref<FormInstance>()
const allocateForm = reactive({
  policyId: '',
  targetType: 'user' as TargetType,
  targetName: '',
  quotaLimit: 100,
  effectiveDate: '',
  expiryDate: '',
  warningThreshold: 80,
  notifyEmail: ''
})

// 表单验证规则
const formRules = reactive<FormRules>({
  name: [{ required: true, message: '请输入策略名称', trigger: 'blur' }],
  targetType: [{ required: true, message: '请选择适用对象类型', trigger: 'change' }],
  targetName: [{ required: true, message: '请输入适用对象名称', trigger: 'blur' }],
  apiScope: [{ required: true, message: '请输入接口范围', trigger: 'blur' }],
  quotaType: [{ required: true, message: '请选择限额类型', trigger: 'change' }],
  quotaLimit: [
    { required: true, message: '请输入限额数值', trigger: 'blur' },
    { type: 'number', min: 1, message: '限额数值必须大于0', trigger: 'blur' }
  ],
  warningThreshold: [
    { required: true, message: '请输入预警阈值', trigger: 'blur' },
    { type: 'number', min: 1, max: 100, message: '预警阈值范围为1-100', trigger: 'blur' }
  ]
})

// 统计数据
const statistics = computed(() => {
  const total = tableData.value.length
  const normal = tableData.value.filter(item => item.status === 'normal').length
  const warning = tableData.value.filter(item => item.status === 'warning').length
  const exceeded = tableData.value.filter(item => item.status === 'exceeded').length
  return { total, normal, warning, exceeded }
})

// 过滤后的表格数据
const filteredTableData = computed(() => {
  return tableData.value.filter(item => {
    const keywordMatch = !searchForm.keyword || 
      item.name.toLowerCase().includes(searchForm.keyword.toLowerCase()) ||
      item.targetName.toLowerCase().includes(searchForm.keyword.toLowerCase())
    const statusMatch = !searchForm.status || item.status === searchForm.status
    const typeMatch = !searchForm.quotaType || item.quotaType === searchForm.quotaType
    return keywordMatch && statusMatch && typeMatch
  })
})

// 获取状态标签类型
const getStatusType = (status: QuotaStatus) => {
  const map: Record<QuotaStatus, 'success' | 'warning' | 'danger'> = {
    normal: 'success',
    warning: 'warning',
    exceeded: 'danger'
  }
  return map[status]
}

// 获取状态文本
const getStatusText = (status: QuotaStatus) => {
  const map: Record<QuotaStatus, string> = {
    normal: '正常',
    warning: '预警',
    exceeded: '超限'
  }
  return map[status]
}

// 获取限额类型标签类型
const getQuotaTypeTag = (type: QuotaType) => {
  const map: Record<QuotaType, ''| 'success' | 'info' | 'warning' | 'danger'> = {
    qps: '',
    daily: 'success',
    total: 'warning'
  }
  return map[type]
}

// 获取限额类型文本
const getQuotaTypeText = (type: QuotaType) => {
  const map: Record<QuotaType, string> = {
    qps: 'QPS限制',
    daily: '日调用量',
    total: '总调用量'
  }
  return map[type]
}

// 获取适用对象类型文本
const getTargetTypeText = (type: TargetType) => {
  const map: Record<TargetType, string> = {
    user: '用户',
    app: '应用',
    group: '用户组'
  }
  return map[type]
}

// 获取超额策略文本
const getOverflowPolicyText = (policy: OverflowPolicy) => {
  const map: Record<OverflowPolicy, string> = {
    reject: '拒绝',
    queue: '排队',
    downgrade: '降级'
  }
  return map[policy]
}

// 计算使用率
const getUsageRate = (policy: QuotaPolicy) => {
  return Math.min(Math.round((policy.currentUsage / policy.quotaLimit) * 100), 100)
}

// 获取进度条颜色
const getProgressColor = (percentage: number) => {
  if (percentage < 70) return '#67c23a'
  if (percentage < 90) return '#e6a23c'
  return '#f56c6c'
}

// 加载表格数据
const loadTableData = () => {
  loading.value = true
  setTimeout(() => {
    tableData.value = [
      {
        id: '1',
        name: 'VIP用户QPS限制',
        targetType: 'user',
        targetName: 'VIP用户组',
        apiScope: '/api/v1/*',
        quotaType: 'qps',
        quotaLimit: 1000,
        currentUsage: 650,
        period: 'second',
        status: 'normal',
        overflowPolicy: 'queue',
        warningThreshold: 80,
        enabled: true,
        effectiveDate: '2025-01-01',
        expiryDate: '2025-12-31',
        createTime: '2025-01-01 10:00:00',
        updateTime: '2025-10-20 15:30:00'
      },
      {
        id: '2',
        name: '普通用户日限额',
        targetType: 'user',
        targetName: '普通用户组',
        apiScope: '/api/v1/query',
        quotaType: 'daily',
        quotaLimit: 10000,
        currentUsage: 8900,
        period: 'day',
        status: 'warning',
        overflowPolicy: 'reject',
        warningThreshold: 85,
        enabled: true,
        effectiveDate: '2025-01-01',
        expiryDate: '2025-12-31',
        createTime: '2025-01-01 10:00:00',
        updateTime: '2025-10-25 09:15:00'
      },
      {
        id: '3',
        name: '测试应用总量限制',
        targetType: 'app',
        targetName: 'TestApp_001',
        apiScope: '/api/v1/test/*',
        quotaType: 'total',
        quotaLimit: 100000,
        currentUsage: 102500,
        period: 'month',
        status: 'exceeded',
        overflowPolicy: 'reject',
        warningThreshold: 90,
        enabled: true,
        effectiveDate: '2025-10-01',
        expiryDate: '2025-10-31',
        createTime: '2025-10-01 08:00:00',
        updateTime: '2025-10-29 11:45:00'
      },
      {
        id: '4',
        name: '企业版QPS限制',
        targetType: 'app',
        targetName: 'EnterpriseApp',
        apiScope: '/api/v1/*',
        quotaType: 'qps',
        quotaLimit: 5000,
        currentUsage: 2300,
        period: 'second',
        status: 'normal',
        overflowPolicy: 'downgrade',
        warningThreshold: 80,
        enabled: true,
        effectiveDate: '2025-01-01',
        expiryDate: '2026-01-01',
        createTime: '2025-01-01 10:00:00',
        updateTime: '2025-10-28 14:20:00'
      },
      {
        id: '5',
        name: '免费用户日限额',
        targetType: 'user',
        targetName: '免费用户组',
        apiScope: '/api/v1/basic/*',
        quotaType: 'daily',
        quotaLimit: 1000,
        currentUsage: 950,
        period: 'day',
        status: 'warning',
        overflowPolicy: 'reject',
        warningThreshold: 80,
        enabled: true,
        effectiveDate: '2025-01-01',
        expiryDate: '2025-12-31',
        createTime: '2025-01-01 10:00:00',
        updateTime: '2025-10-29 10:30:00'
      },
      {
        id: '6',
        name: '数据分析API总量',
        targetType: 'group',
        targetName: '数据分析组',
        apiScope: '/api/v1/analytics/*',
        quotaType: 'total',
        quotaLimit: 500000,
        currentUsage: 125000,
        period: 'month',
        status: 'normal',
        overflowPolicy: 'queue',
        warningThreshold: 85,
        enabled: true,
        effectiveDate: '2025-10-01',
        expiryDate: '2025-11-01',
        createTime: '2025-10-01 09:00:00',
        updateTime: '2025-10-27 16:40:00'
      }
    ]
    loading.value = false
  }, 500)
}

// 搜索
const handleSearch = () => {
  loadTableData()
}

// 重置搜索
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.quotaType = ''
  loadTableData()
}

// 打开新增对话框
const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增额度策略'
  resetForm()
  dialogVisible.value = true
}

// 打开编辑对话框
const handleEdit = (row: QuotaPolicy) => {
  isEdit.value = true
  dialogTitle.value = '编辑额度策略'
  Object.assign(formData, {
    id: row.id,
    name: row.name,
    targetType: row.targetType,
    targetName: row.targetName,
    apiScope: row.apiScope,
    quotaType: row.quotaType,
    quotaLimit: row.quotaLimit,
    period: row.period,
    overflowPolicy: row.overflowPolicy,
    warningThreshold: row.warningThreshold,
    enabled: row.enabled,
    effectiveDate: row.effectiveDate,
    expiryDate: row.expiryDate
  })
  dialogVisible.value = true
}

// 删除策略
const handleDelete = (row: QuotaPolicy) => {
  ElMessageBox.confirm('确认删除该额度策略吗？删除后将无法恢复。', '删除确认', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    setTimeout(() => {
      const index = tableData.value.findIndex(item => item.id === row.id)
      if (index > -1) {
        tableData.value.splice(index, 1)
      }
      ElMessage.success('删除成功')
    }, 300)
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 启用/禁用策略
const handleToggleStatus = (row: QuotaPolicy) => {
  const action = row.enabled ? '禁用' : '启用'
  ElMessageBox.confirm(`确认${action}该额度策略吗？`, `${action}确认`, {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    setTimeout(() => {
      row.enabled = !row.enabled
      ElMessage.success(`${action}成功`)
    }, 300)
  })
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate((valid) => {
    if (valid) {
      setTimeout(() => {
        if (isEdit.value) {
          const index = tableData.value.findIndex(item => item.id === formData.id)
          if (index > -1) {
            Object.assign(tableData.value[index], {
              ...formData,
              currentUsage: tableData.value[index].currentUsage,
              status: tableData.value[index].status,
              updateTime: new Date().toLocaleString('zh-CN')
            })
          }
          ElMessage.success('编辑成功')
        } else {
          const newPolicy: QuotaPolicy = {
            id: Date.now().toString(),
            ...formData,
            currentUsage: 0,
            status: 'normal',
            createTime: new Date().toLocaleString('zh-CN'),
            updateTime: new Date().toLocaleString('zh-CN')
          }
          tableData.value.unshift(newPolicy)
          ElMessage.success('新增成功')
        }
        dialogVisible.value = false
      }, 300)
    }
  })
}

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    id: '',
    name: '',
    targetType: 'user',
    targetName: '',
    apiScope: '',
    quotaType: 'qps',
    quotaLimit: 100,
    period: 'second',
    overflowPolicy: 'reject',
    warningThreshold: 80,
    enabled: true,
    effectiveDate: '',
    expiryDate: ''
  })
  formRef.value?.clearValidate()
}

// 打开额度分配对话框
const handleAllocate = (row: QuotaPolicy) => {
  currentPolicy.value = row
  allocateForm.policyId = row.id
  allocateForm.targetType = row.targetType
  allocateForm.quotaLimit = row.quotaLimit
  allocateForm.warningThreshold = row.warningThreshold
  allocateDialogVisible.value = true
}

// 提交额度分配
const handleAllocateSubmit = async () => {
  if (!allocateFormRef.value) return
  await allocateFormRef.value.validate((valid) => {
    if (valid) {
      setTimeout(() => {
        ElMessage.success('额度分配成功')
        allocateDialogVisible.value = false
        // 重置表单
        allocateForm.targetName = ''
        allocateForm.quotaLimit = 100
        allocateForm.effectiveDate = ''
        allocateForm.expiryDate = ''
        allocateForm.notifyEmail = ''
      }, 300)
    }
  })
}

// 查看使用详情
const handleViewDetail = (row: QuotaPolicy) => {
  currentPolicy.value = row
  // 模拟加载使用记录数据
  setTimeout(() => {
    usageRecords.value = [
      {
        time: '2025-10-29 10:00:00',
        usage: 850,
        endpoint: '/api/v1/query',
        targetName: row.targetName
      },
      {
        time: '2025-10-29 09:00:00',
        usage: 920,
        endpoint: '/api/v1/query',
        targetName: row.targetName
      },
      {
        time: '2025-10-29 08:00:00',
        usage: 780,
        endpoint: '/api/v1/query',
        targetName: row.targetName
      },
      {
        time: '2025-10-29 07:00:00',
        usage: 650,
        endpoint: '/api/v1/query',
        targetName: row.targetName
      },
      {
        time: '2025-10-29 06:00:00',
        usage: 420,
        endpoint: '/api/v1/query',
        targetName: row.targetName
      }
    ]
    detailDialogVisible.value = true
  }, 200)
}

// 查看调整历史
const handleViewHistory = (row: QuotaPolicy) => {
  currentPolicy.value = row
  // 模拟加载调整历史数据
  setTimeout(() => {
    adjustmentHistory.value = [
      {
        id: '1',
        policyName: row.name,
        operator: '管理员',
        operationType: '临时提额',
        beforeValue: row.quotaLimit * 0.8,
        afterValue: row.quotaLimit,
        reason: '应对业务高峰期',
        adjustTime: '2025-10-25 14:30:00'
      },
      {
        id: '2',
        policyName: row.name,
        operator: '系统管理员',
        operationType: '调整阈值',
        beforeValue: 70,
        afterValue: row.warningThreshold,
        reason: '优化预警策略',
        adjustTime: '2025-10-20 10:15:00'
      },
      {
        id: '3',
        policyName: row.name,
        operator: '运维人员',
        operationType: '初始配置',
        beforeValue: 0,
        afterValue: row.quotaLimit * 0.5,
        reason: '首次创建',
        adjustTime: '2025-10-01 09:00:00'
      }
    ]
    historyDialogVisible.value = true
  }, 200)
}

// 临时调整
const handleTempAdjust = (row: QuotaPolicy) => {
  ElMessageBox.prompt('请输入临时调整后的额度值', '临时调整额度', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    inputPattern: /^\d+$/,
    inputErrorMessage: '请输入有效的数字',
    inputValue: row.quotaLimit.toString()
  }).then(({ value }) => {
    setTimeout(() => {
      const newLimit = parseInt(value)
      row.quotaLimit = newLimit
      row.updateTime = new Date().toLocaleString('zh-CN')
      // 重新计算状态
      const usageRate = (row.currentUsage / row.quotaLimit) * 100
      if (usageRate >= 100) {
        row.status = 'exceeded'
      } else if (usageRate >= row.warningThreshold) {
        row.status = 'warning'
      } else {
        row.status = 'normal'
      }
      ElMessage.success('额度调整成功')
    }, 300)
  }).catch(() => {
    ElMessage.info('已取消调整')
  })
}

// 复制策略
const handleCopy = (row: QuotaPolicy) => {
  const newPolicy: QuotaPolicy = {
    ...row,
    id: Date.now().toString(),
    name: `${row.name}_副本`,
    currentUsage: 0,
    status: 'normal',
    createTime: new Date().toLocaleString('zh-CN'),
    updateTime: new Date().toLocaleString('zh-CN')
  }
  tableData.value.unshift(newPolicy)
  ElMessage.success('策略复制成功')
}

// 导出数据
const handleExport = () => {
  ElMessage.success('数据导出成功')
}

// 批量导入
const handleImport = () => {
  ElMessage.info('批量导入功能待实现')
}

// 组件挂载
onMounted(() => {
  loadTableData()
})
</script>

<template>
  <div class="quota-control-container">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="statistics-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon total">
              <el-icon :size="32"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.total }}</div>
              <div class="stat-label">总策略数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon normal">
              <el-icon :size="32"><SuccessFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.normal }}</div>
              <div class="stat-label">正常运行</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon warning">
              <el-icon :size="32"><WarningFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.warning }}</div>
              <div class="stat-label">额度预警</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon exceeded">
              <el-icon :size="32"><CircleCloseFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.exceeded }}</div>
              <div class="stat-label">额度超限</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索和操作区域 -->
    <el-card shadow="never" class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="策略名称/适用对象"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 150px">
            <el-option label="正常" value="normal" />
            <el-option label="预警" value="warning" />
            <el-option label="超限" value="exceeded" />
          </el-select>
        </el-form-item>
        <el-form-item label="限额类型">
          <el-select v-model="searchForm.quotaType" placeholder="请选择类型" clearable style="width: 150px">
            <el-option label="QPS限制" value="qps" />
            <el-option label="日调用量" value="daily" />
            <el-option label="总调用量" value="total" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            <span>搜索</span>
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            <span>重置</span>
          </el-button>
        </el-form-item>
      </el-form>
      <div class="action-buttons">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          <span>新增策略</span>
        </el-button>
        <el-button type="success" @click="handleImport">
          <el-icon><Upload /></el-icon>
          <span>批量导入</span>
        </el-button>
        <el-button type="warning" @click="handleExport">
          <el-icon><Download /></el-icon>
          <span>导出数据</span>
        </el-button>
      </div>
    </el-card>

    <!-- 额度策略列表 -->
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">额度策略列表</span>
          <span class="card-subtitle">共 {{ filteredTableData.length }} 条策略</span>
        </div>
      </template>
      <el-table
        :data="filteredTableData"
        v-loading="loading"
        border
        stripe
        style="width: 100%"
        :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
      >
        <el-table-column prop="name" label="策略名称" min-width="150" fixed="left" />
        <el-table-column label="适用对象" min-width="140">
          <template #default="{ row }">
            <div>
              <el-tag size="small" type="info">{{ getTargetTypeText(row.targetType) }}</el-tag>
              <div style="margin-top: 4px; font-size: 12px; color: #606266;">{{ row.targetName }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="apiScope" label="接口范围" min-width="140" show-overflow-tooltip />
        <el-table-column label="限额类型" min-width="120">
          <template #default="{ row }">
            <el-tag :type="getQuotaTypeTag(row.quotaType)" size="small">
              {{ getQuotaTypeText(row.quotaType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="限额配置" min-width="140">
          <template #default="{ row }">
            <div style="font-size: 13px;">
              <div><strong>{{ row.quotaLimit.toLocaleString() }}</strong> / {{ row.period }}</div>
              <div style="color: #909399; font-size: 12px; margin-top: 2px;">
                预警: {{ row.warningThreshold }}%
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="当前使用量" min-width="200">
          <template #default="{ row }">
            <div>
              <div style="display: flex; align-items: center; margin-bottom: 4px;">
                <span style="font-size: 13px; margin-right: 8px;">
                  {{ row.currentUsage.toLocaleString() }} / {{ row.quotaLimit.toLocaleString() }}
                </span>
                <span style="font-size: 12px; color: #909399;">
                  ({{ getUsageRate(row) }}%)
                </span>
              </div>
              <el-progress
                :percentage="getUsageRate(row)"
                :color="getProgressColor(getUsageRate(row))"
                :show-text="false"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="超额策略" min-width="100">
          <template #default="{ row }">
            {{ getOverflowPolicyText(row.overflowPolicy) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="100">
          <template #default="{ row }">
            <div>
              <el-tag :type="getStatusType(row.status)" size="small">
                {{ getStatusText(row.status) }}
              </el-tag>
              <div style="margin-top: 4px;">
                <el-tag v-if="row.enabled" type="success" size="small">启用</el-tag>
                <el-tag v-else type="info" size="small">禁用</el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" min-width="160" prop="updateTime" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleViewDetail(row)">
              <el-icon><View /></el-icon> 详情
            </el-button>
            <el-button link type="primary" size="small" @click="handleEdit(row)">
              <el-icon><Edit /></el-icon> 编辑
            </el-button>
            <el-button link type="success" size="small" @click="handleAllocate(row)">
              <el-icon><Share /></el-icon> 分配
            </el-button>
            <el-dropdown trigger="click" style="margin-left: 8px;">
              <el-button link type="primary" size="small">
                更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleTempAdjust(row)">
                    <el-icon><EditPen /></el-icon> 临时调整
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleViewHistory(row)">
                    <el-icon><Clock /></el-icon> 调整历史
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleCopy(row)">
                    <el-icon><CopyDocument /></el-icon> 复制策略
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleToggleStatus(row)">
                    <el-icon><Switch /></el-icon> {{ row.enabled ? '禁用' : '启用' }}
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="handleDelete(row)">
                    <el-icon><Delete /></el-icon> 删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑策略对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="策略名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入策略名称" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="适用对象" prop="targetType">
              <el-select v-model="formData.targetType" placeholder="请选择" style="width: 100%">
                <el-option label="用户" value="user" />
                <el-option label="应用" value="app" />
                <el-option label="用户组" value="group" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="对象名称" prop="targetName">
              <el-input v-model="formData.targetName" placeholder="请输入对象名称" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="接口范围" prop="apiScope">
              <el-input v-model="formData.apiScope" placeholder="例如：/api/v1/* 或 /api/v1/query" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="限额类型" prop="quotaType">
              <el-select v-model="formData.quotaType" placeholder="请选择" style="width: 100%">
                <el-option label="QPS限制" value="qps" />
                <el-option label="日调用量" value="daily" />
                <el-option label="总调用量" value="total" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="统计周期" prop="period">
              <el-select v-model="formData.period" placeholder="请选择" style="width: 100%">
                <el-option label="秒" value="second" />
                <el-option label="分钟" value="minute" />
                <el-option label="小时" value="hour" />
                <el-option label="天" value="day" />
                <el-option label="月" value="month" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="限额数值" prop="quotaLimit">
              <el-input-number
                v-model="formData.quotaLimit"
                :min="1"
                :max="999999999"
                style="width: 100%"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预警阈值(%)" prop="warningThreshold">
              <el-input-number
                v-model="formData.warningThreshold"
                :min="1"
                :max="100"
                style="width: 100%"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="超额策略" prop="overflowPolicy">
              <el-select v-model="formData.overflowPolicy" placeholder="请选择" style="width: 100%">
                <el-option label="拒绝" value="reject" />
                <el-option label="排队" value="queue" />
                <el-option label="降级" value="downgrade" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="启用状态" prop="enabled">
              <el-switch v-model="formData.enabled" active-text="启用" inactive-text="禁用" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生效日期" prop="effectiveDate">
              <el-date-picker
                v-model="formData.effectiveDate"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="过期日期" prop="expiryDate">
              <el-date-picker
                v-model="formData.expiryDate"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 额度分配对话框 -->
    <el-dialog
      v-model="allocateDialogVisible"
      title="额度分配"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-alert
        title="提示"
        type="info"
        :closable="false"
        style="margin-bottom: 20px;"
      >
        为特定用户或应用分配独立的调用额度，分配后将独立计算和统计。
      </el-alert>
      <el-form
        ref="allocateFormRef"
        :model="allocateForm"
        label-width="120px"
      >
        <el-form-item label="分配对象" prop="targetType">
          <el-select v-model="allocateForm.targetType" placeholder="请选择" style="width: 100%">
            <el-option label="用户" value="user" />
            <el-option label="应用" value="app" />
            <el-option label="用户组" value="group" />
          </el-select>
        </el-form-item>
        <el-form-item label="对象名称" prop="targetName" required>
          <el-input v-model="allocateForm.targetName" placeholder="请输入对象名称或ID" clearable />
        </el-form-item>
        <el-form-item label="分配额度" prop="quotaLimit" required>
          <el-input-number
            v-model="allocateForm.quotaLimit"
            :min="1"
            :max="999999999"
            style="width: 100%"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item label="预警阈值(%)" prop="warningThreshold">
          <el-input-number
            v-model="allocateForm.warningThreshold"
            :min="1"
            :max="100"
            style="width: 100%"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item label="生效日期" prop="effectiveDate">
          <el-date-picker
            v-model="allocateForm.effectiveDate"
            type="date"
            placeholder="选择日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="过期日期" prop="expiryDate">
          <el-date-picker
            v-model="allocateForm.expiryDate"
            type="date"
            placeholder="选择日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="通知邮箱" prop="notifyEmail">
          <el-input v-model="allocateForm.notifyEmail" placeholder="超额时发送通知" clearable />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="allocateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAllocateSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 使用详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="额度使用详情"
      width="800px"
    >
      <div v-if="currentPolicy">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="策略名称">{{ currentPolicy.name }}</el-descriptions-item>
          <el-descriptions-item label="适用对象">{{ currentPolicy.targetName }}</el-descriptions-item>
          <el-descriptions-item label="限额类型">
            <el-tag :type="getQuotaTypeTag(currentPolicy.quotaType)" size="small">
              {{ getQuotaTypeText(currentPolicy.quotaType) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="getStatusType(currentPolicy.status)" size="small">
              {{ getStatusText(currentPolicy.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="限额配置">
            {{ currentPolicy.quotaLimit.toLocaleString() }} / {{ currentPolicy.period }}
          </el-descriptions-item>
          <el-descriptions-item label="当前使用">
            {{ currentPolicy.currentUsage.toLocaleString() }} ({{ getUsageRate(currentPolicy) }}%)
          </el-descriptions-item>
        </el-descriptions>

        <div style="margin: 20px 0;">
          <h4 style="margin-bottom: 10px;">使用率</h4>
          <el-progress
            :percentage="getUsageRate(currentPolicy)"
            :color="getProgressColor(getUsageRate(currentPolicy))"
            :stroke-width="20"
          />
        </div>

        <el-alert
          v-if="currentPolicy.status === 'warning'"
          title="预警提示"
          type="warning"
          :closable="false"
          style="margin-bottom: 20px;"
        >
          当前额度使用已超过预警阈值 {{ currentPolicy.warningThreshold }}%，请注意控制调用频率。
        </el-alert>

        <el-alert
          v-if="currentPolicy.status === 'exceeded'"
          title="超限警告"
          type="error"
          :closable="false"
          style="margin-bottom: 20px;"
        >
          当前额度已超限！根据超额策略 "{{ getOverflowPolicyText(currentPolicy.overflowPolicy) }}"，后续请求将被处理。
        </el-alert>

        <h4 style="margin: 20px 0 10px;">近期使用记录</h4>
        <el-table :data="usageRecords" border stripe max-height="300">
          <el-table-column prop="time" label="时间" width="180" />
          <el-table-column prop="usage" label="使用量" width="120">
            <template #default="{ row }">
              {{ row.usage.toLocaleString() }}
            </template>
          </el-table-column>
          <el-table-column prop="endpoint" label="接口路径" />
          <el-table-column prop="targetName" label="调用对象" width="150" />
        </el-table>
      </div>
      <template #footer>
        <el-button type="primary" @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 调整历史对话框 -->
    <el-dialog
      v-model="historyDialogVisible"
      title="额度调整历史"
      width="900px"
    >
      <el-table :data="adjustmentHistory" border stripe max-height="400">
        <el-table-column prop="adjustTime" label="调整时间" width="160" />
        <el-table-column prop="operator" label="操作人" width="120" />
        <el-table-column prop="operationType" label="操作类型" width="120">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.operationType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="调整前" width="120">
          <template #default="{ row }">
            {{ row.beforeValue.toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column label="调整后" width="120">
          <template #default="{ row }">
            {{ row.afterValue.toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="调整原因" min-width="200" show-overflow-tooltip />
      </el-table>
      <template #footer>
        <el-button type="primary" @click="historyDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.quota-control-container {
  .statistics-row {
    margin-bottom: 20px;

    .stat-card {
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-5px);
      }

      .stat-content {
        display: flex;
        align-items: center;
        gap: 16px;

        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;

          &.total {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }

          &.normal {
            background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
          }

          &.warning {
            background: linear-gradient(135deg, #ffa751 0%, #ffe259 100%);
          }

          &.exceeded {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          }
        }

        .stat-info {
          flex: 1;

          .stat-value {
            font-size: 28px;
            font-weight: bold;
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

  .search-card {
    margin-bottom: 20px;

    .search-form {
      margin-bottom: 0;
    }

    .action-buttons {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #ebeef5;
    }
  }

  .table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .card-title {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }

      .card-subtitle {
        font-size: 14px;
        color: #909399;
      }
    }
  }
}

:deep(.el-progress__text) {
  font-size: 12px !important;
}

:deep(.el-table) {
  font-size: 13px;
}

:deep(.el-table .cell) {
  padding: 8px 0;
}

:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>