<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// 调度类型枚举
enum ScheduleType {
  TIMED = 'timed',
  PERIODIC = 'periodic',
  EVENT = 'event'
}

// 周期单位枚举
enum PeriodUnit {
  MINUTE = 'minute',
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week'
}

// 规则状态枚举
enum RuleStatus {
  ENABLED = 'enabled',
  DISABLED = 'disabled'
}

// 调度规则接口
interface SchedulingRule {
  id: string
  name: string
  scheduleType: ScheduleType
  status: RuleStatus
  lastExecuteTime?: string
  nextExecuteTime?: string
  // 定时调度配置
  timedConfig?: {
    executeTime: string
    executeDate?: string
  }
  // 周期调度配置
  periodicConfig?: {
    interval: number
    unit: PeriodUnit
    startTime?: string
  }
  // 事件触发配置
  eventConfig?: {
    eventType: string
    condition: string
  }
  // 执行参数
  execParams: {
    timeout: number
    retryCount: number
    executeNode: string
    envVars?: Record<string, string>
    runParams?: string
  }
  // 通知配置
  notifyConfig?: {
    enabled: boolean
    recipients: string[]
  }
  createTime: string
  updateTime: string
}

// 搜索表单
const searchForm = reactive({
  name: '',
  scheduleType: ''
})

// 表格数据
const tableData = ref<SchedulingRule[]>([])
const tableLoading = ref(false)
const selectedRows = ref<SchedulingRule[]>([])

// 对话框控制
const dialogVisible = ref(false)
const dialogTitle = ref('新建调度规则')
const dialogMode = ref<'create' | 'edit'>('create')

// 表单引用
const ruleFormRef = ref<FormInstance>()

// 规则表单数据
const ruleForm = reactive<Partial<SchedulingRule>>({
  name: '',
  scheduleType: ScheduleType.TIMED,
  status: RuleStatus.ENABLED,
  timedConfig: {
    executeTime: '',
    executeDate: ''
  },
  periodicConfig: {
    interval: 1,
    unit: PeriodUnit.HOUR,
    startTime: ''
  },
  eventConfig: {
    eventType: '',
    condition: ''
  },
  execParams: {
    timeout: 3600,
    retryCount: 3,
    executeNode: 'default',
    envVars: {},
    runParams: ''
  },
  notifyConfig: {
    enabled: false,
    recipients: []
  }
})

// 表单验证规则
const ruleFormRules: FormRules = {
  name: [
    { required: true, message: '请输入规则名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  scheduleType: [
    { required: true, message: '请选择调度类型', trigger: 'change' }
  ]
}

// 测试结果对话框
const testDialogVisible = ref(false)
const testResult = ref({
  isValid: true,
  message: '',
  nextExecutions: [] as string[]
})

// 执行日志对话框
const logDialogVisible = ref(false)
const currentRuleId = ref('')

// 调度类型选项
const scheduleTypeOptions = [
  { label: '定时调度', value: ScheduleType.TIMED },
  { label: '周期调度', value: ScheduleType.PERIODIC },
  { label: '事件触发', value: ScheduleType.EVENT }
]

// 周期单位选项
const periodUnitOptions = [
  { label: '分钟', value: PeriodUnit.MINUTE },
  { label: '小时', value: PeriodUnit.HOUR },
  { label: '天', value: PeriodUnit.DAY },
  { label: '周', value: PeriodUnit.WEEK }
]

// 事件类型选项
const eventTypeOptions = [
  { label: '文件上传完成', value: 'file_upload' },
  { label: '数据更新', value: 'data_update' },
  { label: '任务完成', value: 'task_complete' },
  { label: '系统通知', value: 'system_notify' }
]

// 执行节点选项
const executeNodeOptions = [
  { label: '默认节点', value: 'default' },
  { label: '高性能节点', value: 'high-performance' },
  { label: '低延迟节点', value: 'low-latency' },
  { label: '备用节点', value: 'backup' }
]

// 获取调度类型标签
const getScheduleTypeTag = (type: ScheduleType) => {
  const tagMap = {
    [ScheduleType.TIMED]: { type: 'primary', label: '定时' },
    [ScheduleType.PERIODIC]: { type: 'success', label: '周期' },
    [ScheduleType.EVENT]: { type: 'warning', label: '事件触发' }
  }
  return tagMap[type]
}

// 获取状态标签
const getStatusTag = (status: RuleStatus) => {
  return status === RuleStatus.ENABLED 
    ? { type: 'success', label: '已启用' } 
    : { type: 'info', label: '已禁用' }
}

// 过滤后的表格数据
const filteredTableData = computed(() => {
  return tableData.value.filter(item => {
    const nameMatch = !searchForm.name || item.name.toLowerCase().includes(searchForm.name.toLowerCase())
    const typeMatch = !searchForm.scheduleType || item.scheduleType === searchForm.scheduleType
    return nameMatch && typeMatch
  })
})

// Mock 数据加载
const loadMockData = () => {
  tableLoading.value = true
  setTimeout(() => {
    tableData.value = [
      {
        id: '1',
        name: '每日数据备份',
        scheduleType: ScheduleType.TIMED,
        status: RuleStatus.ENABLED,
        lastExecuteTime: '2025-10-28 02:00:00',
        nextExecuteTime: '2025-10-29 02:00:00',
        timedConfig: {
          executeTime: '02:00:00',
          executeDate: ''
        },
        execParams: {
          timeout: 7200,
          retryCount: 3,
          executeNode: 'default',
          runParams: '--backup-type=full'
        },
        notifyConfig: {
          enabled: true,
          recipients: ['admin@example.com']
        },
        createTime: '2025-10-01 10:00:00',
        updateTime: '2025-10-28 10:00:00'
      },
      {
        id: '2',
        name: '每小时日志归档',
        scheduleType: ScheduleType.PERIODIC,
        status: RuleStatus.ENABLED,
        lastExecuteTime: '2025-10-28 14:00:00',
        nextExecuteTime: '2025-10-28 15:00:00',
        periodicConfig: {
          interval: 1,
          unit: PeriodUnit.HOUR,
          startTime: '2025-10-28 00:00:00'
        },
        execParams: {
          timeout: 1800,
          retryCount: 2,
          executeNode: 'high-performance',
          runParams: '--compress=true'
        },
        createTime: '2025-10-15 10:00:00',
        updateTime: '2025-10-28 10:00:00'
      },
      {
        id: '3',
        name: '文件上传后处理',
        scheduleType: ScheduleType.EVENT,
        status: RuleStatus.ENABLED,
        lastExecuteTime: '2025-10-28 13:30:00',
        nextExecuteTime: '-',
        eventConfig: {
          eventType: 'file_upload',
          condition: 'fileType == "csv" && fileSize > 1MB'
        },
        execParams: {
          timeout: 3600,
          retryCount: 3,
          executeNode: 'default',
          runParams: '--validate=true'
        },
        createTime: '2025-10-20 10:00:00',
        updateTime: '2025-10-28 10:00:00'
      },
      {
        id: '4',
        name: '每周数据清理',
        scheduleType: ScheduleType.PERIODIC,
        status: RuleStatus.DISABLED,
        lastExecuteTime: '2025-10-21 03:00:00',
        nextExecuteTime: '-',
        periodicConfig: {
          interval: 1,
          unit: PeriodUnit.WEEK,
          startTime: '2025-10-01 03:00:00'
        },
        execParams: {
          timeout: 10800,
          retryCount: 1,
          executeNode: 'low-latency',
          runParams: '--cleanup-days=30'
        },
        createTime: '2025-10-01 10:00:00',
        updateTime: '2025-10-21 10:00:00'
      }
    ]
    tableLoading.value = false
  }, 500)
}

// 搜索
const handleSearch = () => {
  // 搜索由计算属性自动处理
  ElMessage.success('搜索完成')
}

// 重置搜索
const handleReset = () => {
  searchForm.name = ''
  searchForm.scheduleType = ''
}

// 新建规则
const handleCreate = () => {
  dialogMode.value = 'create'
  dialogTitle.value = '新建调度规则'
  resetForm()
  dialogVisible.value = true
}

// 编辑规则
const handleEdit = (row: SchedulingRule) => {
  dialogMode.value = 'edit'
  dialogTitle.value = '编辑调度规则'
  Object.assign(ruleForm, JSON.parse(JSON.stringify(row)))
  dialogVisible.value = true
}

// 复制规则
const handleCopy = (row: SchedulingRule) => {
  dialogMode.value = 'create'
  dialogTitle.value = '复制调度规则'
  const copiedData = JSON.parse(JSON.stringify(row))
  copiedData.name = `${copiedData.name}_副本`
  delete copiedData.id
  Object.assign(ruleForm, copiedData)
  dialogVisible.value = true
}

// 删除规则
const handleDelete = (row: SchedulingRule) => {
  ElMessageBox.confirm(
    `确定要删除调度规则"${row.name}"吗？删除后将无法恢复。`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    tableLoading.value = true
    setTimeout(() => {
      const index = tableData.value.findIndex(item => item.id === row.id)
      if (index > -1) {
        tableData.value.splice(index, 1)
      }
      tableLoading.value = false
      ElMessage.success('删除成功')
    }, 300)
  }).catch(() => {
    // 取消删除
  })
}

// 切换状态
const handleStatusToggle = (row: SchedulingRule) => {
  const newStatus = row.status === RuleStatus.ENABLED ? RuleStatus.DISABLED : RuleStatus.ENABLED
  tableLoading.value = true
  setTimeout(() => {
    row.status = newStatus
    if (newStatus === RuleStatus.DISABLED) {
      row.nextExecuteTime = '-'
    } else {
      // 重新计算下次执行时间
      row.nextExecuteTime = calculateNextExecuteTime(row)
    }
    tableLoading.value = false
    ElMessage.success(`已${newStatus === RuleStatus.ENABLED ? '启用' : '禁用'}规则`)
  }, 300)
}

// 批量启用
const handleBatchEnable = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要启用的规则')
    return
  }
  tableLoading.value = true
  setTimeout(() => {
    selectedRows.value.forEach(row => {
      row.status = RuleStatus.ENABLED
      row.nextExecuteTime = calculateNextExecuteTime(row)
    })
    tableLoading.value = false
    ElMessage.success(`已启用 ${selectedRows.value.length} 条规则`)
    selectedRows.value = []
  }, 300)
}

// 批量禁用
const handleBatchDisable = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要禁用的规则')
    return
  }
  tableLoading.value = true
  setTimeout(() => {
    selectedRows.value.forEach(row => {
      row.status = RuleStatus.DISABLED
      row.nextExecuteTime = '-'
    })
    tableLoading.value = false
    ElMessage.success(`已禁用 ${selectedRows.value.length} 条规则`)
    selectedRows.value = []
  }, 300)
}

// 表格选择变化
const handleSelectionChange = (rows: SchedulingRule[]) => {
  selectedRows.value = rows
}

// 查看执行日志
const handleViewLog = (row: SchedulingRule) => {
  currentRuleId.value = row.id
  logDialogVisible.value = true
}

// 测试规则
const handleTestRule = () => {
  // 验证表单
  ruleFormRef.value?.validate((valid) => {
    if (!valid) {
      ElMessage.error('请完善规则配置')
      return
    }

    // 模拟测试
    setTimeout(() => {
      testResult.value = {
        isValid: true,
        message: '规则配置验证通过',
        nextExecutions: generateNextExecutions(ruleForm)
      }
      testDialogVisible.value = true
    }, 500)
  })
}

// 生成下几次执行时间
const generateNextExecutions = (rule: Partial<SchedulingRule>): string[] => {
  const executions: string[] = []
  const now = new Date()

  if (rule.scheduleType === ScheduleType.TIMED) {
    // 定时调度
    for (let i = 0; i < 5; i++) {
      const next = new Date(now)
      next.setDate(next.getDate() + i)
      if (rule.timedConfig?.executeTime) {
        const [hours, minutes] = rule.timedConfig.executeTime.split(':')
        next.setHours(parseInt(hours), parseInt(minutes), 0)
      }
      executions.push(formatDateTime(next))
    }
  } else if (rule.scheduleType === ScheduleType.PERIODIC) {
    // 周期调度
    const interval = rule.periodicConfig?.interval || 1
    const unit = rule.periodicConfig?.unit || PeriodUnit.HOUR
    
    for (let i = 1; i <= 5; i++) {
      const next = new Date(now)
      switch (unit) {
        case PeriodUnit.MINUTE:
          next.setMinutes(next.getMinutes() + interval * i)
          break
        case PeriodUnit.HOUR:
          next.setHours(next.getHours() + interval * i)
          break
        case PeriodUnit.DAY:
          next.setDate(next.getDate() + interval * i)
          break
        case PeriodUnit.WEEK:
          next.setDate(next.getDate() + interval * i * 7)
          break
      }
      executions.push(formatDateTime(next))
    }
  } else if (rule.scheduleType === ScheduleType.EVENT) {
    executions.push('事件触发型规则，无固定执行时间')
  }

  return executions
}

// 计算下次执行时间
const calculateNextExecuteTime = (rule: SchedulingRule): string => {
  if (rule.scheduleType === ScheduleType.EVENT) {
    return '-'
  }

  const executions = generateNextExecutions(rule)
  return executions[0] || '-'
}

// 格式化日期时间
const formatDateTime = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 重置表单
const resetForm = () => {
  Object.assign(ruleForm, {
    name: '',
    scheduleType: ScheduleType.TIMED,
    status: RuleStatus.ENABLED,
    timedConfig: {
      executeTime: '',
      executeDate: ''
    },
    periodicConfig: {
      interval: 1,
      unit: PeriodUnit.HOUR,
      startTime: ''
    },
    eventConfig: {
      eventType: '',
      condition: ''
    },
    execParams: {
      timeout: 3600,
      retryCount: 3,
      executeNode: 'default',
      envVars: {},
      runParams: ''
    },
    notifyConfig: {
      enabled: false,
      recipients: []
    }
  })
  ruleFormRef.value?.clearValidate()
}

// 保存规则
const handleSave = () => {
  ruleFormRef.value?.validate((valid) => {
    if (!valid) {
      ElMessage.error('请完善规则配置')
      return
    }

    tableLoading.value = true
    setTimeout(() => {
      if (dialogMode.value === 'create') {
        const newRule: SchedulingRule = {
          ...ruleForm as SchedulingRule,
          id: Date.now().toString(),
          createTime: formatDateTime(new Date()),
          updateTime: formatDateTime(new Date()),
          nextExecuteTime: calculateNextExecuteTime(ruleForm as SchedulingRule)
        }
        tableData.value.unshift(newRule)
        ElMessage.success('创建成功')
      } else {
        const index = tableData.value.findIndex(item => item.id === ruleForm.id)
        if (index > -1) {
          tableData.value[index] = {
            ...tableData.value[index],
            ...ruleForm,
            updateTime: formatDateTime(new Date()),
            nextExecuteTime: calculateNextExecuteTime(ruleForm as SchedulingRule)
          } as SchedulingRule
          ElMessage.success('更新成功')
        }
      }
      tableLoading.value = false
      dialogVisible.value = false
    }, 500)
  })
}

// 导出规则
const handleExport = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要导出的规则')
    return
  }
  
  const data = JSON.stringify(selectedRows.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `scheduling_rules_${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

// 导入规则
const handleImport = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const rules = JSON.parse(event.target?.result as string)
        if (Array.isArray(rules)) {
          tableLoading.value = true
          setTimeout(() => {
            rules.forEach(rule => {
              rule.id = Date.now().toString() + Math.random()
              rule.createTime = formatDateTime(new Date())
              rule.updateTime = formatDateTime(new Date())
              tableData.value.unshift(rule)
            })
            tableLoading.value = false
            ElMessage.success(`成功导入 ${rules.length} 条规则`)
          }, 300)
        }
      } catch (error) {
        ElMessage.error('导入失败：文件格式错误')
      }
    }
    reader.readAsText(file)
  }
  input.click()
}

// 组件挂载时加载数据
onMounted(() => {
  loadMockData()
})
</script>

<template>
  <div class="scheduling-rules-container">
    <!-- 搜索区域 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline>
        <el-form-item label="规则名称">
          <el-input 
            v-model="searchForm.name" 
            placeholder="请输入规则名称" 
            clearable 
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="调度类型">
          <el-select 
            v-model="searchForm.scheduleType" 
            placeholder="请选择调度类型" 
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="item in scheduleTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作按钮区域 -->
    <el-card class="toolbar-card" shadow="never">
      <el-row :gutter="10">
        <el-col :span="24">
          <el-button type="primary" @click="handleCreate">新建规则</el-button>
          <el-button @click="handleBatchEnable">批量启用</el-button>
          <el-button @click="handleBatchDisable">批量禁用</el-button>
          <el-button @click="handleImport">导入规则</el-button>
          <el-button @click="handleExport">导出规则</el-button>
          <span class="selected-info">
            已选择 <span class="selected-count">{{ selectedRows.length }}</span> 条
          </span>
        </el-col>
      </el-row>
    </el-card>

    <!-- 规则列表 -->
    <el-card class="table-card" shadow="never">
      <el-table
        :data="filteredTableData"
        :loading="tableLoading"
        @selection-change="handleSelectionChange"
        stripe
        border
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="name" label="规则名称" min-width="180" />
        <el-table-column prop="scheduleType" label="调度类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getScheduleTypeTag(row.scheduleType).type">
              {{ getScheduleTypeTag(row.scheduleType).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="RuleStatus.ENABLED"
              :inactive-value="RuleStatus.DISABLED"
              @change="handleStatusToggle(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="lastExecuteTime" label="最近执行时间" width="180" align="center">
          <template #default="{ row }">
            {{ row.lastExecuteTime || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="nextExecuteTime" label="下次执行时间" width="180" align="center">
          <template #default="{ row }">
            {{ row.nextExecuteTime || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="primary" link size="small" @click="handleCopy(row)">
              复制
            </el-button>
            <el-button type="primary" link size="small" @click="handleViewLog(row)">
              日志
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 规则配置对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="ruleFormRef"
        :model="ruleForm"
        :rules="ruleFormRules"
        label-width="120px"
      >
        <el-divider content-position="left">基本信息</el-divider>
        
        <el-form-item label="规则名称" prop="name">
          <el-input v-model="ruleForm.name" placeholder="请输入规则名称" />
        </el-form-item>

        <el-form-item label="调度类型" prop="scheduleType">
          <el-select v-model="ruleForm.scheduleType" placeholder="请选择调度类型" style="width: 100%">
            <el-option
              v-for="item in scheduleTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="规则状态" prop="status">
          <el-switch
            v-model="ruleForm.status"
            :active-value="RuleStatus.ENABLED"
            :inactive-value="RuleStatus.DISABLED"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>

        <el-divider content-position="left">调度配置</el-divider>

        <!-- 定时调度配置 -->
        <template v-if="ruleForm.scheduleType === ScheduleType.TIMED">
          <el-form-item label="执行日期">
            <el-date-picker
              v-model="ruleForm.timedConfig.executeDate"
              type="date"
              placeholder="留空表示每天执行"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="执行时间">
            <el-time-picker
              v-model="ruleForm.timedConfig.executeTime"
              placeholder="请选择执行时间"
              format="HH:mm:ss"
              style="width: 100%"
            />
          </el-form-item>
        </template>

        <!-- 周期调度配置 -->
        <template v-if="ruleForm.scheduleType === ScheduleType.PERIODIC">
          <el-form-item label="执行间隔">
            <el-row :gutter="10">
              <el-col :span="12">
                <el-input-number
                  v-model="ruleForm.periodicConfig.interval"
                  :min="1"
                  :max="999"
                  style="width: 100%"
                />
              </el-col>
              <el-col :span="12">
                <el-select v-model="ruleForm.periodicConfig.unit" style="width: 100%">
                  <el-option
                    v-for="item in periodUnitOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-col>
            </el-row>
          </el-form-item>
          <el-form-item label="开始时间">
            <el-date-picker
              v-model="ruleForm.periodicConfig.startTime"
              type="datetime"
              placeholder="请选择开始时间"
              style="width: 100%"
            />
          </el-form-item>
        </template>

        <!-- 事件触发配置 -->
        <template v-if="ruleForm.scheduleType === ScheduleType.EVENT">
          <el-form-item label="事件类型">
            <el-select v-model="ruleForm.eventConfig.eventType" placeholder="请选择事件类型" style="width: 100%">
              <el-option
                v-for="item in eventTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="触发条件">
            <el-input
              v-model="ruleForm.eventConfig.condition"
              type="textarea"
              :rows="3"
              placeholder="例如：fileType == 'csv' && fileSize > 1MB"
            />
          </el-form-item>
        </template>

        <el-divider content-position="left">执行参数</el-divider>

        <el-form-item label="超时时间">
          <el-input-number
            v-model="ruleForm.execParams.timeout"
            :min="60"
            :max="86400"
            :step="60"
            style="width: 100%"
          />
          <span class="form-tip">单位：秒</span>
        </el-form-item>

        <el-form-item label="重试次数">
          <el-input-number
            v-model="ruleForm.execParams.retryCount"
            :min="0"
            :max="10"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="执行节点">
          <el-select v-model="ruleForm.execParams.executeNode" placeholder="请选择执行节点" style="width: 100%">
            <el-option
              v-for="item in executeNodeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="运行参数">
          <el-input
            v-model="ruleForm.execParams.runParams"
            type="textarea"
            :rows="2"
            placeholder="请输入运行参数"
          />
        </el-form-item>

        <el-divider content-position="left">通知配置</el-divider>

        <el-form-item label="启用通知">
          <el-switch v-model="ruleForm.notifyConfig.enabled" />
        </el-form-item>

        <el-form-item v-if="ruleForm.notifyConfig.enabled" label="通知接收人">
          <el-input
            v-model="ruleForm.notifyConfig.recipients"
            placeholder="多个邮箱用逗号分隔"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="warning" @click="handleTestRule">测试规则</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 测试结果对话框 -->
    <el-dialog
      v-model="testDialogVisible"
      title="规则测试结果"
      width="600px"
    >
      <div class="test-result">
        <el-alert
          :type="testResult.isValid ? 'success' : 'error'"
          :title="testResult.message"
          :closable="false"
          show-icon
        />
        
        <div v-if="testResult.isValid && testResult.nextExecutions.length > 0" class="next-executions">
          <h4>预计执行时间：</h4>
          <el-timeline>
            <el-timeline-item
              v-for="(time, index) in testResult.nextExecutions"
              :key="index"
              :timestamp="time"
              placement="top"
            >
              第 {{ index + 1 }} 次执行
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>

      <template #footer>
        <el-button type="primary" @click="testDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 执行日志对话框 -->
    <el-dialog
      v-model="logDialogVisible"
      title="执行日志"
      width="900px"
    >
      <el-table
        :data="[
          { id: 1, executeTime: '2025-10-28 14:00:00', status: 'success', duration: '12s', message: '执行成功' },
          { id: 2, executeTime: '2025-10-28 13:00:00', status: 'success', duration: '10s', message: '执行成功' },
          { id: 3, executeTime: '2025-10-28 12:00:00', status: 'failed', duration: '5s', message: '连接超时' },
          { id: 4, executeTime: '2025-10-28 11:00:00', status: 'success', duration: '11s', message: '执行成功' }
        ]"
        stripe
        border
      >
        <el-table-column prop="executeTime" label="执行时间" width="180" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : 'danger'">
              {{ row.status === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="耗时" width="100" align="center" />
        <el-table-column prop="message" label="消息" />
      </el-table>

      <template #footer>
        <el-button type="primary" @click="logDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.scheduling-rules-container {
  .search-card,
  .toolbar-card,
  .table-card {
    margin-bottom: 20px;
  }

  .selected-info {
    margin-left: 20px;
    font-size: 14px;
    color: #606266;

    .selected-count {
      color: #409eff;
      font-weight: bold;
      margin: 0 2px;
    }
  }

  .form-tip {
    margin-left: 10px;
    font-size: 12px;
    color: #909399;
  }

  .test-result {
    .el-alert {
      margin-bottom: 20px;
    }

    .next-executions {
      margin-top: 20px;

      h4 {
        margin-bottom: 15px;
        font-size: 14px;
        color: #303133;
      }
    }
  }
}
</style>