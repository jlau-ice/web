<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// 类型定义
interface PriorityRule {
  id: number
  name: string
  level: number // 1-低, 2-中, 3-高, 4-紧急
  taskType: string
  status: boolean
  effectiveTime: string
  condition: string
  factors: {
    importance: number
    timeliness: number
    resourceDemand: number
  }
  createTime: string
  updateTime: string
}

interface PriorityFactor {
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

interface PriorityDistribution {
  level: string
  count: number
  percentage: number
}

// 搜索条件
const searchForm = reactive({
  name: '',
  taskType: ''
})

// 规则列表
const ruleList = ref<PriorityRule[]>([])
const loading = ref(false)

// 表单相关
const dialogVisible = ref(false)
const dialogTitle = ref('新增优先级规则')
const formRef = ref<FormInstance>()
const ruleForm = reactive<Partial<PriorityRule>>({
  name: '',
  level: 2,
  taskType: '',
  status: true,
  effectiveTime: '',
  condition: '',
  factors: {
    importance: 33,
    timeliness: 33,
    resourceDemand: 34
  }
})

// 表单验证规则
const formRules: FormRules = {
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  level: [{ required: true, message: '请选择优先级级别', trigger: 'change' }],
  taskType: [{ required: true, message: '请选择任务类型', trigger: 'change' }],
  effectiveTime: [{ required: true, message: '请选择生效时间', trigger: 'change' }]
}

// 任务类型选项
const taskTypeOptions = [
  { label: '数据采集', value: '数据采集' },
  { label: '数据处理', value: '数据处理' },
  { label: '数据分发', value: '数据分发' },
  { label: '数据清洗', value: '数据清洗' },
  { label: '数据分析', value: '数据分析' }
]

// 优先级级别选项
const levelOptions = [
  { label: '低', value: 1, color: '#909399' },
  { label: '中', value: 2, color: '#409EFF' },
  { label: '高', value: 3, color: '#E6A23C' },
  { label: '紧急', value: 4, color: '#F56C6C' }
]

// 因素设置对话框
const factorDialogVisible = ref(false)
const factorForm = reactive<PriorityFactor>({
  importance: 33,
  timeliness: 33,
  resourceDemand: 34
})

// 规则测试对话框
const testDialogVisible = ref(false)
const simulationForm = reactive<TaskSimulation>({
  taskName: '',
  taskType: '',
  importance: 5,
  timeliness: 5,
  resourceDemand: 5
})
const simulationResult = ref<{
  score: number
  level: number
  levelName: string
  color: string
  matchedRule: string
} | null>(null)

// 优先级分布数据
const priorityDistribution = ref<PriorityDistribution[]>([])

// 计算属性 - 权重总和
const totalWeight = computed(() => {
  return ruleForm.factors ?
    ruleForm.factors.importance + ruleForm.factors.timeliness + ruleForm.factors.resourceDemand : 0
})

const factorTotalWeight = computed(() => {
  return factorForm.importance + factorForm.timeliness + factorForm.resourceDemand
})

// 计算优先级分数示例
const exampleScore = computed(() => {
  if (!ruleForm.factors) return 0
  const { importance, timeliness, resourceDemand } = ruleForm.factors
  // 假设示例值都为8（满分10）
  const score = (8 * importance + 8 * timeliness + 8 * resourceDemand) / 100
  return score.toFixed(2)
})

// 获取优先级级别信息
const getLevelInfo = (level: number) => {
  return levelOptions.find(item => item.value === level) || levelOptions[0]
}

// 格式化优先级标签
const getLevelTag = (level: number) => {
  const info = getLevelInfo(level)
  return { text: info.label, color: info.color }
}

// 加载规则列表
const loadRuleList = () => {
  loading.value = true
  setTimeout(() => {
    ruleList.value = [
      {
        id: 1,
        name: '紧急任务优先规则',
        level: 4,
        taskType: '数据采集',
        status: true,
        effectiveTime: '2024-01-01 00:00:00',
        condition: '任务时效性>8且重要性>7',
        factors: { importance: 40, timeliness: 40, resourceDemand: 20 },
        createTime: '2024-01-01 10:00:00',
        updateTime: '2024-01-15 14:30:00'
      },
      {
        id: 2,
        name: '数据处理高优先级',
        level: 3,
        taskType: '数据处理',
        status: true,
        effectiveTime: '2024-01-01 00:00:00',
        condition: '任务重要性>6',
        factors: { importance: 50, timeliness: 30, resourceDemand: 20 },
        createTime: '2024-01-02 09:00:00',
        updateTime: '2024-01-10 16:20:00'
      },
      {
        id: 3,
        name: '数据分发中等优先级',
        level: 2,
        taskType: '数据分发',
        status: true,
        effectiveTime: '2024-01-01 00:00:00',
        condition: '常规任务',
        factors: { importance: 33, timeliness: 33, resourceDemand: 34 },
        createTime: '2024-01-03 11:00:00',
        updateTime: '2024-01-12 09:15:00'
      },
      {
        id: 4,
        name: '数据清洗低优先级',
        level: 1,
        taskType: '数据清洗',
        status: false,
        effectiveTime: '2024-01-01 00:00:00',
        condition: '批量处理任务',
        factors: { importance: 20, timeliness: 30, resourceDemand: 50 },
        createTime: '2024-01-04 13:00:00',
        updateTime: '2024-01-08 10:45:00'
      },
      {
        id: 5,
        name: '实时数据分析规则',
        level: 4,
        taskType: '数据分析',
        status: true,
        effectiveTime: '2024-01-05 00:00:00',
        condition: '实时性要求高',
        factors: { importance: 35, timeliness: 45, resourceDemand: 20 },
        createTime: '2024-01-05 08:00:00',
        updateTime: '2024-01-18 11:30:00'
      }
    ]
    loading.value = false
    updatePriorityDistribution()
  }, 500)
}

// 搜索规则
const handleSearch = () => {
  loadRuleList()
}

// 重置搜索
const handleReset = () => {
  searchForm.name = ''
  searchForm.taskType = ''
  loadRuleList()
}

// 打开新增对话框
const handleAdd = () => {
  dialogTitle.value = '新增优先级规则'
  Object.assign(ruleForm, {
    name: '',
    level: 2,
    taskType: '',
    status: true,
    effectiveTime: '',
    condition: '',
    factors: {
      importance: 33,
      timeliness: 33,
      resourceDemand: 34
    }
  })
  dialogVisible.value = true
}

// 打开编辑对话框
const handleEdit = (row: PriorityRule) => {
  dialogTitle.value = '编辑优先级规则'
  Object.assign(ruleForm, {
    ...row,
    factors: { ...row.factors }
  })
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate((valid) => {
    if (valid) {
      if (totalWeight.value !== 100) {
        ElMessage.warning('权重总和必须等于100%')
        return
      }

      setTimeout(() => {
        ElMessage.success(`${dialogTitle.value}成功`)
        dialogVisible.value = false
        loadRuleList()
      }, 300)
    }
  })
}

// 删除规则
const handleDelete = (row: PriorityRule) => {
  ElMessageBox.confirm(
    `确定要删除规则"${row.name}"吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    setTimeout(() => {
      ElMessage.success('删除成功')
      loadRuleList()
    }, 300)
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 切换规则状态
const handleStatusChange = (row: PriorityRule) => {
  setTimeout(() => {
    ElMessage.success(`规则已${row.status ? '启用' : '禁用'}`)
    loadRuleList()
  }, 300)
}

// 打开因素设置对话框
const handleFactorSetting = () => {
  factorDialogVisible.value = true
}

// 保存因素设置
const handleFactorSubmit = () => {
  if (factorTotalWeight.value !== 100) {
    ElMessage.warning('权重总和必须等于100%')
    return
  }

  setTimeout(() => {
    ElMessage.success('因素设置已保存')
    factorDialogVisible.value = false
  }, 300)
}

// 自动调整权重
const autoAdjustWeight = () => {
  ruleForm.factors = {
    importance: 33,
    timeliness: 33,
    resourceDemand: 34
  }
}

const autoAdjustFactorWeight = () => {
  factorForm.importance = 33
  factorForm.timeliness = 33
  factorForm.resourceDemand = 34
}

// 打开规则测试对话框
const handleTest = () => {
  testDialogVisible.value = true
  simulationResult.value = null
}

// 执行规则测试
const handleSimulation = () => {
  if (!simulationForm.taskName || !simulationForm.taskType) {
    ElMessage.warning('请填写完整的任务信息')
    return
  }

  setTimeout(() => {
    // 计算优先级分数
    const { importance, timeliness, resourceDemand } = simulationForm
    const score = (importance * 0.33 + timeliness * 0.33 + resourceDemand * 0.34) * 10

    // 根据分数确定优先级级别
    let level = 1
    if (score >= 80) level = 4
    else if (score >= 65) level = 3
    else if (score >= 45) level = 2
    else level = 1

    const levelInfo = getLevelInfo(level)

    // 查找匹配的规则
    const matchedRule = ruleList.value.find(
      rule => rule.taskType === simulationForm.taskType && rule.status
    )

    simulationResult.value = {
      score: Number(score.toFixed(2)),
      level,
      levelName: levelInfo.label,
      color: levelInfo.color,
      matchedRule: matchedRule ? matchedRule.name : '无匹配规则'
    }

    ElMessage.success('测试完成')
  }, 500)
}

// 冲突检测
const handleConflictDetection = () => {
  setTimeout(() => {
    const conflicts = ruleList.value.filter((rule, index) => {
      return ruleList.value.some((other, otherIndex) => {
        return index !== otherIndex &&
          rule.taskType === other.taskType &&
          rule.status && other.status &&
          rule.level === other.level
      })
    })

    if (conflicts.length > 0) {
      ElMessage.warning(`检测到 ${conflicts.length} 个潜在冲突规则`)
    } else {
      ElMessage.success('未检测到规则冲突')
    }
  }, 500)
}

// 更新优先级分布
const updatePriorityDistribution = () => {
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }

  // 模拟任务分布
  const mockTaskDistribution = { 1: 15, 2: 35, 3: 28, 4: 12 }

  const total = Object.values(mockTaskDistribution).reduce((sum, count) => sum + count, 0)

  priorityDistribution.value = levelOptions.map(option => {
    const count = mockTaskDistribution[option.value] || 0
    return {
      level: option.label,
      count,
      percentage: Number(((count / total) * 100).toFixed(1))
    }
  })
}

// 页面加载
onMounted(() => {
  loadRuleList()
})
</script>

<template>
    <div class="priority-management">
        <div class="page-header">
            <h2>优先级管理</h2>
            <p>定义和管理任务的执行优先级体系，确保重要任务优先执行</p>
        </div>
    
        <el-row :gutter="20">
            <!-- 左侧：规则列表 -->
            <el-col :span="18">
                <el-card shadow="hover">
                    <template #header>
                        <div class="card-header">
                            <span class="card-title">优先级规则列表</span>
                            <el-button type="primary" @click="handleAdd">新增规则</el-button>
                        </div>
                    </template>
    
                    <!-- 搜索区域 -->
                    <el-form :model="searchForm" inline class="search-form">
                        <el-form-item label="规则名称">
                            <el-input v-model="searchForm.name" placeholder="请输入规则名称" clearable style="width: 200px" />
                        </el-form-item>
                        <el-form-item label="任务类型">
                            <el-select v-model="searchForm.taskType" placeholder="请选择任务类型" clearable style="width: 200px">
                                <el-option v-for="item in taskTypeOptions" :key="item.value" :label="item.label"
                                    :value="item.value" />
                            </el-select>
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" @click="handleSearch">查询</el-button>
                            <el-button @click="handleReset">重置</el-button>
                        </el-form-item>
                    </el-form>
    
                    <!-- 规则表格 -->
                    <el-table :data="ruleList" v-loading="loading" border stripe>
                        <el-table-column prop="name" label="规则名称" />
                        <el-table-column label="优先级级别" align="center">
                            <template #default="{ row }">
                                <el-tag :color="getLevelTag(row.level).color" effect="dark">
                                    {{ getLevelTag(row.level).text }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="taskType" label="适用任务类型" align="center" />
                        <el-table-column label="状态" align="center">
                            <template #default="{ row }">
                                <el-switch v-model="row.status" @change="handleStatusChange(row)" active-text="启用"
                                    inactive-text="禁用" />
                            </template>
                        </el-table-column>
                        <el-table-column prop="condition" label="生效条件"  show-overflow-tooltip />
                        <el-table-column label="操作" align="center" fixed="right">
                            <template #default="{ row }">
                                <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
                                <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                </el-card>
            </el-col>
    
            <!-- 右侧：统计和快捷操作 -->
            <el-col :span="6">
                <!-- 优先级分布统计 -->
                <el-card shadow="hover" class="mb-20">
                    <template #header>
                        <span class="card-title">优先级任务分布</span>
                    </template>
    
                    <div class="distribution-stats">
                        <div v-for="item in priorityDistribution" :key="item.level" class="stat-item">
                            <div class="stat-header">
                                <span class="stat-label">{{ item.level }}</span>
                                <span class="stat-count">{{ item.count }} 个任务</span>
                            </div>
                            <el-progress :percentage="item.percentage"
                                :color="getLevelInfo(levelOptions.findIndex(l => l.label === item.level) + 1).color" />
                        </div>
                    </div>
    
                    <div class="total-stats">
                        <el-statistic title="总任务数"
                            :value="priorityDistribution.reduce((sum, item) => sum + item.count, 0)" />
                    </div>
                </el-card>
    
                <!-- 快捷操作 -->
                <el-card shadow="hover">
                    <template #header>
                        <span class="card-title">快捷操作</span>
                    </template>
    
                    <div class="quick-actions">
                        <el-button type="primary" @click="handleFactorSetting" class="action-btn">
                            <span class="btn-icon">⚙️</span>
                            优先级因素设置
                        </el-button>
                        <el-button type="success" @click="handleTest" class="action-btn">
                            <span class="btn-icon">🧪</span>
                            规则测试与验证
                        </el-button>
                        <el-button type="warning" @click="handleConflictDetection" class="action-btn">
                            <span class="btn-icon">⚠️</span>
                            冲突检测
                        </el-button>
                    </div>
                </el-card>
            </el-col>
        </el-row>
    
        <!-- 新增/编辑对话框 -->
        <el-dialog v-model="dialogVisible" :title="dialogTitle" width="700px" :close-on-click-modal="false">
            <el-form ref="formRef" :model="ruleForm" :rules="formRules" label-width="120px">
                <el-form-item label="规则名称" prop="name">
                    <el-input v-model="ruleForm.name" placeholder="请输入规则名称" />
                </el-form-item>
    
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="优先级级别" prop="level">
                            <el-select v-model="ruleForm.level" placeholder="请选择优先级级别" style="width: 100%">
                                <el-option v-for="item in levelOptions" :key="item.value" :label="item.label"
                                    :value="item.value">
                                    <span :style="{ color: item.color }">{{ item.label }}</span>
                                </el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="任务类型" prop="taskType">
                            <el-select v-model="ruleForm.taskType" placeholder="请选择任务类型" style="width: 100%">
                                <el-option v-for="item in taskTypeOptions" :key="item.value" :label="item.label"
                                    :value="item.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>
    
                <el-form-item label="生效时间" prop="effectiveTime">
                    <el-input v-model="ruleForm.effectiveTime" placeholder="例如：2024-01-01 00:00:00" />
                </el-form-item>
    
                <el-form-item label="生效条件" prop="condition">
                    <el-input v-model="ruleForm.condition" type="textarea" :rows="2" placeholder="例如：任务时效性>8且重要性>7" />
                </el-form-item>
    
                <el-divider content-position="left">优先级计算因素权重</el-divider>
    
                <el-form-item label="任务重要性" v-if="ruleForm.factors">
                    <el-row :gutter="10" style="width: 100%">
                        <el-col :span="18">
                            <el-slider v-model="ruleForm.factors.importance" :max="100"
                                :marks="{ 0: '0%', 50: '50%', 100: '100%' }" />
                        </el-col>
                        <el-col :span="6">
                            <el-input-number v-model="ruleForm.factors.importance" :min="0" :max="100"
                                style="width: 100%" />
                        </el-col>
                    </el-row>
                </el-form-item>
    
                <el-form-item label="任务时效性" v-if="ruleForm.factors">
                    <el-row :gutter="10" style="width: 100%">
                        <el-col :span="18">
                            <el-slider v-model="ruleForm.factors.timeliness" :max="100"
                                :marks="{ 0: '0%', 50: '50%', 100: '100%' }" />
                        </el-col>
                        <el-col :span="6">
                            <el-input-number v-model="ruleForm.factors.timeliness" :min="0" :max="100"
                                style="width: 100%" />
                        </el-col>
                    </el-row>
                </el-form-item>
    
                <el-form-item label="资源需求" v-if="ruleForm.factors">
                    <el-row :gutter="10" style="width: 100%">
                        <el-col :span="18">
                            <el-slider v-model="ruleForm.factors.resourceDemand" :max="100"
                                :marks="{ 0: '0%', 50: '50%', 100: '100%' }" />
                        </el-col>
                        <el-col :span="6">
                            <el-input-number v-model="ruleForm.factors.resourceDemand" :min="0" :max="100"
                                style="width: 100%" />
                        </el-col>
                    </el-row>
                </el-form-item>
    
                <el-form-item label="权重总和">
                    <el-tag :type="totalWeight === 100 ? 'success' : 'danger'">
                        {{ totalWeight }}%
                    </el-tag>
                    <el-button type="text" @click="autoAdjustWeight" style="margin-left: 10px">
                        自动调整为均匀分配
                    </el-button>
                </el-form-item>
    
                <el-alert title="优先级计算示例" :description="`假设各因素值都为8分（满分10分），根据当前权重计算的优先级分数为：${exampleScore} 分`" type="info"
                    :closable="false" />
            </el-form>
    
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleSubmit">确定</el-button>
            </template>
        </el-dialog>
    
        <!-- 因素设置对话框 -->
        <el-dialog v-model="factorDialogVisible" title="优先级因素设置" width="600px" :close-on-click-modal="false">
            <el-form label-width="120px">
                <el-alert title="全局优先级因素权重配置" description="设置全局默认的优先级计算因素权重，将应用于所有新建规则" type="info" :closable="false"
                    class="mb-20" />
    
                <el-form-item label="任务重要性">
                    <el-row :gutter="10" style="width: 100%">
                        <el-col :span="18">
                            <el-slider v-model="factorForm.importance" :max="100"
                                :marks="{ 0: '0%', 50: '50%', 100: '100%' }" />
                        </el-col>
                        <el-col :span="6">
                            <el-input-number v-model="factorForm.importance" :min="0" :max="100" style="width: 100%" />
                        </el-col>
                    </el-row>
                </el-form-item>
    
                <el-form-item label="任务时效性">
                    <el-row :gutter="10" style="width: 100%">
                        <el-col :span="18">
                            <el-slider v-model="factorForm.timeliness" :max="100"
                                :marks="{ 0: '0%', 50: '50%', 100: '100%' }" />
                        </el-col>
                        <el-col :span="6">
                            <el-input-number v-model="factorForm.timeliness" :min="0" :max="100" style="width: 100%" />
                        </el-col>
                    </el-row>
                </el-form-item>
    
                <el-form-item label="资源需求">
                    <el-row :gutter="10" style="width: 100%">
                        <el-col :span="18">
                            <el-slider v-model="factorForm.resourceDemand" :max="100"
                                :marks="{ 0: '0%', 50: '50%', 100: '100%' }" />
                        </el-col>
                        <el-col :span="6">
                            <el-input-number v-model="factorForm.resourceDemand" :min="0" :max="100" style="width: 100%" />
                        </el-col>
                    </el-row>
                </el-form-item>
    
                <el-form-item label="权重总和">
                    <el-tag :type="factorTotalWeight === 100 ? 'success' : 'danger'">
                        {{ factorTotalWeight }}%
                    </el-tag>
                    <el-button type="text" @click="autoAdjustFactorWeight" style="margin-left: 10px">
                        自动调整为均匀分配
                    </el-button>
                </el-form-item>
    
                <el-divider content-position="left">计算公式</el-divider>
    
                <el-alert
                    :title="`优先级分数 = 重要性 × ${factorForm.importance}% + 时效性 × ${factorForm.timeliness}% + 资源需求 × ${factorForm.resourceDemand}%`"
                    type="success" :closable="false" />
            </el-form>
    
            <template #footer>
                <el-button @click="factorDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleFactorSubmit">保存</el-button>
            </template>
        </el-dialog>
    
        <!-- 规则测试对话框 -->
        <el-dialog v-model="testDialogVisible" title="规则测试与验证" width="650px" :close-on-click-modal="false">
            <el-form label-width="120px">
                <el-alert title="模拟任务优先级计算" description="输入任务信息，系统将根据现有规则计算其优先级" type="info" :closable="false"
                    class="mb-20" />
    
                <el-form-item label="任务名称">
                    <el-input v-model="simulationForm.taskName" placeholder="请输入任务名称" />
                </el-form-item>
    
                <el-form-item label="任务类型">
                    <el-select v-model="simulationForm.taskType" placeholder="请选择任务类型" style="width: 100%">
                        <el-option v-for="item in taskTypeOptions" :key="item.value" :label="item.label"
                            :value="item.value" />
                    </el-select>
                </el-form-item>
    
                <el-form-item label="重要性评分">
                    <el-row :gutter="10" style="width: 100%">
                        <el-col :span="18">
                            <el-slider v-model="simulationForm.importance" :max="10"
                                :marks="{ 0: '0', 5: '5', 10: '10' }" />
                        </el-col>
                        <el-col :span="6">
                            <el-input-number v-model="simulationForm.importance" :min="0" :max="10" style="width: 100%" />
                        </el-col>
                    </el-row>
                </el-form-item>
    
                <el-form-item label="时效性评分">
                    <el-row :gutter="10" style="width: 100%">
                        <el-col :span="18">
                            <el-slider v-model="simulationForm.timeliness" :max="10"
                                :marks="{ 0: '0', 5: '5', 10: '10' }" />
                        </el-col>
                        <el-col :span="6">
                            <el-input-number v-model="simulationForm.timeliness" :min="0" :max="10" style="width: 100%" />
                        </el-col>
                    </el-row>
                </el-form-item>
    
                <el-form-item label="资源需求评分">
                    <el-row :gutter="10" style="width: 100%">
                        <el-col :span="18">
                            <el-slider v-model="simulationForm.resourceDemand" :max="10"
                                :marks="{ 0: '0', 5: '5', 10: '10' }" />
                        </el-col>
                        <el-col :span="6">
                            <el-input-number v-model="simulationForm.resourceDemand" :min="0" :max="10"
                                style="width: 100%" />
                        </el-col>
                    </el-row>
                </el-form-item>
    
                <el-form-item>
                    <el-button type="primary" @click="handleSimulation">开始测试</el-button>
                </el-form-item>
    
                <el-divider content-position="left" v-if="simulationResult">测试结果</el-divider>
    
                <div v-if="simulationResult" class="simulation-result">
                    <el-card shadow="never">
                        <el-row :gutter="20">
                            <el-col :span="12">
                                <el-statistic title="优先级分数" :value="simulationResult.score">
                                    <template #suffix>
                                        <span style="font-size: 14px">/ 100</span>
                                    </template>
                                </el-statistic>
                            </el-col>
                            <el-col :span="12">
                                <el-statistic title="优先级级别">
                                    <template #suffix>
                                        <el-tag :color="simulationResult.color" effect="dark" size="large">
                                            {{ simulationResult.levelName }}
                                        </el-tag>
                                    </template>
                                </el-statistic>
                            </el-col>
                        </el-row>
                        <el-divider />
                        <div class="result-info">
                            <p><strong>匹配规则：</strong>{{ simulationResult.matchedRule }}</p>
                            <p class="result-tip">
                                该任务将被分配到 <el-tag :color="simulationResult.color" effect="dark">{{ simulationResult.levelName
                                    }}</el-tag> 优先级队列
                            </p>
                        </div>
                    </el-card>
                </div>
            </el-form>
    
            <template #footer>
                <el-button @click="testDialogVisible = false">关闭</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<style scoped lang="scss">
.priority-management {
    min-height: calc(100vh - 120px);

    .page-header {
        margin-bottom: 20px;

        h2 {
            margin: 0 0 8px 0;
            font-size: 24px;
            font-weight: 600;
            color: #303133;
        }

        p {
            margin: 0;
            font-size: 14px;
            color: #909399;
        }
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

    .search-form {
        margin-bottom: 20px;
    }

    .mb-20 {
        margin-bottom: 20px;
    }

    // 统计样式
    .distribution-stats {
        .stat-item {
            margin-bottom: 20px;

            .stat-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;

                .stat-label {
                    font-weight: 600;
                    font-size: 14px;
                    color: #303133;
                }

                .stat-count {
                    font-size: 13px;
                    color: #606266;
                }
            }
        }
    }

    .total-stats {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #ebeef5;
        text-align: center;
    }

    // 快捷操作
    .quick-actions {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .action-btn {
            width: 100%;
            height: 50px;
            font-size: 15px;
            display: flex;
            align-items: center;
            justify-content: center;

            .btn-icon {
                margin-right: 8px;
                font-size: 18px;
            }
        }
    }

    // 模拟结果
    .simulation-result {
        margin-top: 20px;

        .result-info {
            p {
                margin: 8px 0;
                font-size: 14px;
                color: #606266;

                strong {
                    color: #303133;
                }
            }

            .result-tip {
                padding: 10px;
                background-color: #f4f4f5;
                border-radius: 4px;
                margin-top: 12px;
            }
        }
    }

    :deep(.el-table) {
        font-size: 13px;

        th {
            background-color: #f5f7fa;
            font-weight: 600;
        }
    }

    :deep(.el-card__body) {
        padding: 20px;
    }

    :deep(.el-form-item__label) {
        font-weight: 500;
    }

    :deep(.el-slider) {
        padding: 0 8px;
    }

    :deep(.el-statistic__head) {
        font-size: 13px;
        color: #909399;
        margin-bottom: 8px;
    }

    :deep(.el-statistic__content) {
        font-size: 24px;
        font-weight: 600;
    }
}
</style>