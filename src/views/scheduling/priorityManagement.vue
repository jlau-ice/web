<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

interface PriorityRule {
  id: string
  name: string
  level: number
  levelName: string
  taskTypes: string[]
  status: 'active' | 'inactive'
  conditions: string
  timeRange?: string
  updateTime: string
}

interface WeightFactor {
  importance: number
  timeliness: number
  resourceDemand: number
}

interface TaskSimulation {
  taskName: string
  taskType: string
  importance: number
  timeliness: number
  resourceDemand: number
}

interface PriorityStats {
  urgent: number
  high: number
  medium: number
  low: number
}

const loading = ref(false)
const tableData = ref<PriorityRule[]>([])
const searchKeyword = ref('')
const filterLevel = ref<number | ''>('')
const filterStatus = ref<'active' | 'inactive' | ''>('')

const priorityLevels = [
  { value: 1, label: '紧急', color: '#F56C6C' },
  { value: 2, label: '高', color: '#E6A23C' },
  { value: 3, label: '中', color: '#409EFF' },
  { value: 4, label: '低', color: '#909399' }
]

const taskTypeOptions = [
  { value: 'compute', label: '计算任务' },
  { value: 'inference', label: '推理任务' },
  { value: 'dataSync', label: '数据同步' },
  { value: 'system', label: '系统任务' }
]

const dialogVisible = ref(false)
const dialogTitle = ref('新增优先级规则')
const formRef = ref<FormInstance>()
const formData = reactive<Partial<PriorityRule>>({
  name: '',
  level: 3,
  taskTypes: [],
  status: 'active',
  conditions: '',
  timeRange: ''
})

const formRules: FormRules = {
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  level: [{ required: true, message: '请选择优先级级别', trigger: 'change' }],
  taskTypes: [{ required: true, message: '请选择适用任务类型', trigger: 'change' }],
  conditions: [{ required: true, message: '请输入生效条件', trigger: 'blur' }]
}

const weightDialogVisible = ref(false)
const weightFactors = reactive<WeightFactor>({
  importance: 40,
  timeliness: 35,
  resourceDemand: 25
})

const simulationDialogVisible = ref(false)
const simulationFormRef = ref<FormInstance>()
const simulationData = reactive<TaskSimulation>({
  taskName: '',
  taskType: 'compute',
  importance: 50,
  timeliness: 50,
  resourceDemand: 50
})
const simulationResult = ref<{ level: number; score: number; levelName: string } | null>(null)

const statsData = ref<PriorityStats>({
  urgent: 0,
  high: 0,
  medium: 0,
  low: 0
})

const filteredTableData = computed(() => {
  let data = tableData.value

  if (searchKeyword.value) {
    data = data.filter(item =>
      item.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }

  if (filterLevel.value !== '') {
    data = data.filter(item => item.level === filterLevel.value)
  }

  if (filterStatus.value) {
    data = data.filter(item => item.status === filterStatus.value)
  }

  return data
})

const getPriorityColor = (level: number) => {
  const priority = priorityLevels.find(p => p.value === level)
  return priority?.color || '#909399'
}

const getPriorityLabel = (level: number) => {
  const priority = priorityLevels.find(p => p.value === level)
  return priority?.label || '未知'
}

const getTaskTypeLabel = (type: string) => {
  const taskType = taskTypeOptions.find(t => t.value === type)
  return taskType?.label || type
}

const handleAdd = () => {
  dialogTitle.value = '新增优先级规则'
  Object.assign(formData, {
    name: '',
    level: 3,
    taskTypes: [],
    status: 'active',
    conditions: '',
    timeRange: ''
  })
  dialogVisible.value = true
}

const handleEdit = (row: PriorityRule) => {
  dialogTitle.value = '编辑优先级规则'
  Object.assign(formData, {
    id: row.id,
    name: row.name,
    level: row.level,
    taskTypes: [...row.taskTypes],
    status: row.status,
    conditions: row.conditions,
    timeRange: row.timeRange
  })
  dialogVisible.value = true
}

const handleDelete = async (row: PriorityRule) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除规则"${row.name}"吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    loading.value = true
    setTimeout(() => {
      const index = tableData.value.findIndex(item => item.id === row.id)
      if (index > -1) {
        tableData.value.splice(index, 1)
      }
      loading.value = false
      ElMessage.success('删除成功')
      updateStats()
    }, 500)
  } catch {
    // 用户取消
  }
}

const handleToggleStatus = (row: PriorityRule) => {
  loading.value = true
  setTimeout(() => {
    row.status = row.status === 'active' ? 'inactive' : 'active'
    row.updateTime = new Date().toLocaleString('zh-CN')
    loading.value = false
    ElMessage.success(`已${row.status === 'active' ? '启用' : '禁用'}规则`)
  }, 300)
}

const submitForm = async () => {
  if (!formRef.value) return

  await formRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      setTimeout(() => {
        const levelName = getPriorityLabel(formData.level!)

        if (formData.id) {
          const index = tableData.value.findIndex(item => item.id === formData.id)
          if (index > -1) {
            tableData.value[index] = {
              ...tableData.value[index],
              name: formData.name!,
              level: formData.level!,
              levelName,
              taskTypes: formData.taskTypes!,
              status: formData.status!,
              conditions: formData.conditions!,
              timeRange: formData.timeRange,
              updateTime: new Date().toLocaleString('zh-CN')
            }
          }
          ElMessage.success('编辑成功')
        } else {
          const newRule: PriorityRule = {
            id: Date.now().toString(),
            name: formData.name!,
            level: formData.level!,
            levelName,
            taskTypes: formData.taskTypes!,
            status: formData.status!,
            conditions: formData.conditions!,
            timeRange: formData.timeRange,
            updateTime: new Date().toLocaleString('zh-CN')
          }
          tableData.value.unshift(newRule)
          ElMessage.success('新增成功')
        }

        loading.value = false
        dialogVisible.value = false
        updateStats()
      }, 500)
    }
  })
}

const openWeightConfig = () => {
  weightDialogVisible.value = true
}

const handleWeightChange = () => {
  const total = weightFactors.importance + weightFactors.timeliness + weightFactors.resourceDemand
  if (total !== 100) {
    const diff = 100 - total
    weightFactors.resourceDemand += diff
  }
}

const saveWeightConfig = () => {
  const total = weightFactors.importance + weightFactors.timeliness + weightFactors.resourceDemand
  if (total !== 100) {
    ElMessage.warning('权重总和必须为100%')
    return
  }

  ElMessage.success('权重配置已保存')
  weightDialogVisible.value = false
}

const openSimulation = () => {
  Object.assign(simulationData, {
    taskName: '',
    taskType: 'compute',
    importance: 50,
    timeliness: 50,
    resourceDemand: 50
  })
  simulationResult.value = null
  simulationDialogVisible.value = true
}

const calculatePriority = () => {
  if (!simulationData.taskName) {
    ElMessage.warning('请输入任务名称')
    return
  }

  const score =
    (simulationData.importance * weightFactors.importance / 100) +
    (simulationData.timeliness * weightFactors.timeliness / 100) +
    (simulationData.resourceDemand * weightFactors.resourceDemand / 100)

  let level = 4
  if (score >= 80) level = 1
  else if (score >= 60) level = 2
  else if (score >= 40) level = 3
  else level = 4

  simulationResult.value = {
    level,
    score: Math.round(score),
    levelName: getPriorityLabel(level)
  }
}

const updateStats = () => {
  const stats: PriorityStats = {
    urgent: 0,
    high: 0,
    medium: 0,
    low: 0
  }

  tableData.value.forEach(rule => {
    if (rule.status === 'active') {
      if (rule.level === 1) stats.urgent++
      else if (rule.level === 2) stats.high++
      else if (rule.level === 3) stats.medium++
      else if (rule.level === 4) stats.low++
    }
  })

  statsData.value = stats
}

const loadMockData = () => {
  loading.value = true
  setTimeout(() => {
    tableData.value = [
      {
        id: '1',
        name: '关键业务优先',
        level: 1,
        levelName: '紧急',
        taskTypes: ['compute', 'inference'],
        status: 'active',
        conditions: '任务标记为关键业务且资源充足',
        timeRange: '全天',
        updateTime: '2025-10-28 14:30:00'
      },
      {
        id: '2',
        name: '大型推理任务',
        level: 2,
        levelName: '高',
        taskTypes: ['inference'],
        status: 'active',
        conditions: '推理任务且资源需求 > 70%',
        timeRange: '工作时间段',
        updateTime: '2025-10-27 10:15:00'
      },
      {
        id: '3',
        name: '常规计算任务',
        level: 3,
        levelName: '中',
        taskTypes: ['compute'],
        status: 'active',
        conditions: '普通计算任务',
        timeRange: '全天',
        updateTime: '2025-10-26 16:20:00'
      },
      {
        id: '4',
        name: '离线数据同步',
        level: 4,
        levelName: '低',
        taskTypes: ['dataSync'],
        status: 'active',
        conditions: '非紧急数据同步',
        timeRange: '非工作时间段',
        updateTime: '2025-10-25 09:00:00'
      },
      {
        id: '5',
        name: '系统维护任务',
        level: 4,
        levelName: '低',
        taskTypes: ['system'],
        status: 'inactive',
        conditions: '系统例行维护',
        timeRange: '凌晨时段',
        updateTime: '2025-10-24 22:10:00'
      },
      {
        id: '6',
        name: '紧急推理响应',
        level: 1,
        levelName: '紧急',
        taskTypes: ['inference'],
        status: 'active',
        conditions: 'SLA要求 < 1秒响应',
        timeRange: '全天',
        updateTime: '2025-10-28 11:45:00'
      },
      {
        id: '7',
        name: '批量计算任务',
        level: 3,
        levelName: '中',
        taskTypes: ['compute'],
        status: 'active',
        conditions: '批量处理，非实时要求',
        timeRange: '全天',
        updateTime: '2025-10-27 15:30:00'
      },
      {
        id: '8',
        name: '实时数据同步',
        level: 2,
        levelName: '高',
        taskTypes: ['dataSync'],
        status: 'active',
        conditions: '实时同步要求',
        timeRange: '工作时间段',
        updateTime: '2025-10-26 13:20:00'
      }
    ]
    loading.value = false
    updateStats()
  }, 800)
}

onMounted(() => {
  loadMockData()
})
</script>

<template>
  <div class="priority-management">
    <el-card class="header-card">
      <div class="header-section">
        <div class="title-section">
          <h2>优先级管理</h2>
          <p class="subtitle">定义和管理任务执行的优先级体系，确保关键任务得到优先处理</p>
        </div>
        <div class="action-buttons">
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增规则
          </el-button>
          <el-button @click="openWeightConfig">
            <el-icon><Setting /></el-icon>
            权重配置
          </el-button>
          <el-button @click="openSimulation">
            <el-icon><DataAnalysis /></el-icon>
            优先级测试
          </el-button>
        </div>
      </div>
    </el-card>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card urgent">
          <el-statistic :value="statsData.urgent" title="紧急优先级">
            <template #prefix>
              <el-icon><Warning /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card high">
          <el-statistic :value="statsData.high" title="高优先级">
            <template #prefix>
              <el-icon><TopRight /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card medium">
          <el-statistic :value="statsData.medium" title="中优先级">
            <template #prefix>
              <el-icon><Minus /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card low">
          <el-statistic :value="statsData.low" title="低优先级">
            <template #prefix>
              <el-icon><Bottom /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="table-card">
      <div class="filter-section">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索规则名称"
          clearable
          style="width: 240px"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select
          v-model="filterLevel"
          placeholder="优先级级别"
          clearable
          style="width: 150px"
        >
          <el-option
            v-for="level in priorityLevels"
            :key="level.value"
            :label="level.label"
            :value="level.value"
          />
        </el-select>

        <el-select
          v-model="filterStatus"
          placeholder="状态"
          clearable
          style="width: 120px"
        >
          <el-option label="启用" value="active" />
          <el-option label="禁用" value="inactive" />
        </el-select>
      </div>

      <el-table
        :data="filteredTableData"
        v-loading="loading"
        style="width: 100%"
        stripe
        border
      >
        <el-table-column prop="name" label="规则名称" min-width="150" />

        <el-table-column label="优先级级别" width="120" align="center">
          <template #default="{ row }">
            <el-tag :color="getPriorityColor(row.level)" effect="dark">
              {{ row.levelName }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="适用任务类型" min-width="180">
          <template #default="{ row }">
            <el-tag
              v-for="type in row.taskTypes"
              :key="type"
              type="info"
              size="small"
              style="margin-right: 5px"
            >
              {{ getTaskTypeLabel(type) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="conditions" label="生效条件" min-width="200" show-overflow-tooltip />

        <el-table-column prop="timeRange" label="时间范围" width="120" />

        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="updateTime" label="最后更新时间" width="160" />

        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button
              link
              :type="row.status === 'active' ? 'warning' : 'success'"
              size="small"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item label="规则名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入规则名称" />
        </el-form-item>

        <el-form-item label="优先级级别" prop="level">
          <el-select v-model="formData.level" placeholder="请选择优先级级别">
            <el-option
              v-for="level in priorityLevels"
              :key="level.value"
              :label="level.label"
              :value="level.value"
            >
              <span :style="{ color: level.color }">{{ level.label }}</span>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="适用任务类型" prop="taskTypes">
          <el-select
            v-model="formData.taskTypes"
            multiple
            placeholder="请选择适用任务类型"
            style="width: 100%"
          >
            <el-option
              v-for="type in taskTypeOptions"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="生效条件" prop="conditions">
          <el-input
            v-model="formData.conditions"
            type="textarea"
            :rows="3"
            placeholder="请输入生效条件，例如：任务标记为关键业务且资源充足"
          />
        </el-form-item>

        <el-form-item label="时间范围">
          <el-input
            v-model="formData.timeRange"
            placeholder="例如：全天、工作时间段、非工作时间段"
          />
        </el-form-item>

        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio value="active">启用</el-radio>
            <el-radio value="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="loading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="weightDialogVisible"
      title="优先级权重配置"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="weight-config">
        <el-alert
          title="提示"
          type="info"
          description="优先级计算公式：优先级得分 = 重要性 × 重要性权重 + 时效性 × 时效性权重 + 资源需求 × 资源需求权重"
          :closable="false"
          style="margin-bottom: 20px"
        />

        <el-form label-width="120px">
          <el-form-item label="重要性权重">
            <el-row :gutter="20">
              <el-col :span="18">
                <el-slider
                  v-model="weightFactors.importance"
                  :min="0"
                  :max="100"
                  :step="5"
                  show-input
                  @change="handleWeightChange"
                />
              </el-col>
              <el-col :span="6">
                <span class="weight-percentage">{{ weightFactors.importance }}%</span>
              </el-col>
            </el-row>
          </el-form-item>

          <el-form-item label="时效性权重">
            <el-row :gutter="20">
              <el-col :span="18">
                <el-slider
                  v-model="weightFactors.timeliness"
                  :min="0"
                  :max="100"
                  :step="5"
                  show-input
                  @change="handleWeightChange"
                />
              </el-col>
              <el-col :span="6">
                <span class="weight-percentage">{{ weightFactors.timeliness }}%</span>
              </el-col>
            </el-row>
          </el-form-item>

          <el-form-item label="资源需求权重">
            <el-row :gutter="20">
              <el-col :span="18">
                <el-slider
                  v-model="weightFactors.resourceDemand"
                  :min="0"
                  :max="100"
                  :step="5"
                  show-input
                  @change="handleWeightChange"
                />
              </el-col>
              <el-col :span="6">
                <span class="weight-percentage">{{ weightFactors.resourceDemand }}%</span>
              </el-col>
            </el-row>
          </el-form-item>

          <el-divider />

          <el-form-item label="权重总和">
            <el-progress
              :percentage="weightFactors.importance + weightFactors.timeliness + weightFactors.resourceDemand"
              :color="weightFactors.importance + weightFactors.timeliness + weightFactors.resourceDemand === 100 ? '#67C23A' : '#E6A23C'"
            />
          </el-form-item>
        </el-form>

        <div class="weight-example">
          <h4>计算示例</h4>
          <p>假设某任务的参数为：重要性=80，时效性=60，资源需求=40</p>
          <p class="calculation">
            优先级得分 = 80 × {{ weightFactors.importance }}% + 60 × {{ weightFactors.timeliness }}% + 40 × {{ weightFactors.resourceDemand }}%
            = {{ Math.round(80 * weightFactors.importance / 100 + 60 * weightFactors.timeliness / 100 + 40 * weightFactors.resourceDemand / 100) }}
          </p>
        </div>
      </div>

      <template #footer>
        <el-button @click="weightDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveWeightConfig">
          保存配置
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="simulationDialogVisible"
      title="优先级模拟测试"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-row :gutter="20">
        <el-col :span="14">
          <el-form
            ref="simulationFormRef"
            :model="simulationData"
            label-width="100px"
          >
            <el-form-item label="任务名称">
              <el-input v-model="simulationData.taskName" placeholder="请输入任务名称" />
            </el-form-item>

            <el-form-item label="任务类型">
              <el-select v-model="simulationData.taskType" style="width: 100%">
                <el-option
                  v-for="type in taskTypeOptions"
                  :key="type.value"
                  :label="type.label"
                  :value="type.value"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="重要性">
              <el-slider v-model="simulationData.importance" :min="0" :max="100" show-input />
            </el-form-item>

            <el-form-item label="时效性">
              <el-slider v-model="simulationData.timeliness" :min="0" :max="100" show-input />
            </el-form-item>

            <el-form-item label="资源需求">
              <el-slider v-model="simulationData.resourceDemand" :min="0" :max="100" show-input />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="calculatePriority">
                计算优先级
              </el-button>
            </el-form-item>
          </el-form>
        </el-col>

        <el-col :span="10">
          <div class="simulation-result">
            <h4>计算结果</h4>
            <div v-if="simulationResult" class="result-content">
              <div class="result-item">
                <span class="label">优先级得分：</span>
                <span class="value">{{ simulationResult.score }}</span>
              </div>
              <div class="result-item">
                <span class="label">优先级级别：</span>
                <el-tag
                  :color="getPriorityColor(simulationResult.level)"
                  effect="dark"
                  size="large"
                >
                  {{ simulationResult.levelName }}
                </el-tag>
              </div>

              <el-divider />

              <div class="calculation-detail">
                <h5>计算详情</h5>
                <p>重要性贡献：{{ simulationData.importance }} × {{ weightFactors.importance }}% = {{ Math.round(simulationData.importance * weightFactors.importance / 100) }}</p>
                <p>时效性贡献：{{ simulationData.timeliness }} × {{ weightFactors.timeliness }}% = {{ Math.round(simulationData.timeliness * weightFactors.timeliness / 100) }}</p>
                <p>资源需求贡献：{{ simulationData.resourceDemand }} × {{ weightFactors.resourceDemand }}% = {{ Math.round(simulationData.resourceDemand * weightFactors.resourceDemand / 100) }}</p>
              </div>

              <el-divider />

              <div class="priority-suggestions">
                <h5>优化建议</h5>
                <ul>
                  <li v-if="simulationResult.level === 1">
                    <el-icon color="#67C23A"><CircleCheck /></el-icon>
                    任务优先级已达到最高级别
                  </li>
                  <li v-else-if="simulationResult.score >= 70">
                    <el-icon color="#E6A23C"><Warning /></el-icon>
                    任务优先级较高，建议优先调度
                  </li>
                  <li v-else-if="simulationResult.score >= 40">
                    <el-icon color="#409EFF"><InfoFilled /></el-icon>
                    任务优先级中等，可按正常流程调度
                  </li>
                  <li v-else>
                    <el-icon color="#909399"><Warning /></el-icon>
                    任务优先级较低，可在空闲时段执行
                  </li>
                </ul>
              </div>
            </div>
            <el-empty v-else description="请输入任务信息并计算" :image-size="100" />
          </div>
        </el-col>
      </el-row>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.priority-management {
  .header-card {
    margin-bottom: 20px;

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .title-section {
        h2 {
          margin: 0 0 10px 0;
          font-size: 24px;
          font-weight: 600;
        }

        .subtitle {
          margin: 0;
          color: #909399;
          font-size: 14px;
        }
      }

      .action-buttons {
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
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      &.urgent {
        border-left: 4px solid #F56C6C;
      }

      &.high {
        border-left: 4px solid #E6A23C;
      }

      &.medium {
        border-left: 4px solid #409EFF;
      }

      &.low {
        border-left: 4px solid #909399;
      }

      :deep(.el-statistic) {
        .el-statistic__head {
          color: #606266;
          font-size: 14px;
        }

        .el-statistic__content {
          font-size: 28px;
          font-weight: 600;
        }
      }
    }
  }

  .table-card {
    .filter-section {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }
  }

  .weight-config {
    .weight-percentage {
      font-size: 18px;
      font-weight: 600;
      color: #409EFF;
    }

    .weight-example {
      margin-top: 20px;
      padding: 15px;
      background-color: #f5f7fa;
      border-radius: 4px;

      h4 {
        margin: 0 0 10px 0;
        font-size: 16px;
      }

      p {
        margin: 5px 0;
        font-size: 14px;
        color: #606266;

        &.calculation {
          font-weight: 600;
          color: #409EFF;
          margin-top: 10px;
        }
      }
    }
  }

  .simulation-result {
    padding: 20px;
    background-color: #f5f7fa;
    border-radius: 8px;
    height: 100%;

    h4 {
      margin: 0 0 20px 0;
      font-size: 16px;
      text-align: center;
    }

    .result-content {
      .result-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;

        .label {
          font-size: 14px;
          color: #606266;
        }

        .value {
          font-size: 24px;
          font-weight: 600;
          color: #409EFF;
        }
      }

      .calculation-detail {
        h5 {
          margin: 0 0 10px 0;
          font-size: 14px;
        }

        p {
          margin: 5px 0;
          font-size: 13px;
          color: #606266;
        }
      }

      .priority-suggestions {
        h5 {
          margin: 0 0 10px 0;
          font-size: 14px;
        }

        ul {
          margin: 0;
          padding-left: 20px;

          li {
            margin: 8px 0;
            font-size: 13px;
            color: #606266;
            display: flex;
            align-items: center;
            gap: 5px;
          }
        }
      }
    }
  }
}
</style>
