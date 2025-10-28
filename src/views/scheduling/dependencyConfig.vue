<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// 依赖类型枚举
enum DependencyType {
  SERIAL = 'serial',       // 串行依赖
  PARALLEL = 'parallel',   // 并行依赖
  CONDITIONAL = 'conditional' // 条件依赖
}

// 依赖关系接口
interface Dependency {
  id: string
  taskName: string           // 任务名称
  dependencyType: DependencyType // 依赖类型
  preTasks: string[]         // 前置任务
  status: boolean            // 状态：启用/禁用
  condition?: string         // 条件表达式（条件依赖）
  conditionAction?: string   // 条件满足时的动作
  description?: string       // 描述
  createTime: string
  updateTime: string
}

// 任务节点接口（用于可视化）
interface TaskNode {
  id: string
  name: string
  type: DependencyType
  x: number
  y: number
}

// 搜索表单
const searchForm = reactive({
  taskName: '',
  dependencyType: ''
})

// 依赖关系列表
const dependencyList = ref<Dependency[]>([])
const loading = ref(false)

// 对话框控制
const dialogVisible = ref(false)
const dialogTitle = ref('新增依赖关系')
const dialogMode = ref<'create' | 'edit'>('create')

// 条件设置对话框
const conditionDialogVisible = ref(false)

// 验证对话框
const validationDialogVisible = ref(false)
const validationResult = ref<{
  isValid: boolean
  errors: string[]
  warnings: string[]
}>({
  isValid: true,
  errors: [],
  warnings: []
})

// 表单引用
const formRef = ref<FormInstance>()

// 依赖关系表单
const dependencyForm = reactive<Partial<Dependency>>({
  taskName: '',
  dependencyType: DependencyType.SERIAL,
  preTasks: [],
  status: true,
  condition: '',
  conditionAction: '',
  description: ''
})

// 条件测试表单
const conditionTestForm = reactive({
  condition: '',
  testData: '',
  testResult: ''
})

// 表单验证规则
const formRules: FormRules = {
  taskName: [
    { required: true, message: '请输入任务名称', trigger: 'blur' }
  ],
  dependencyType: [
    { required: true, message: '请选择依赖类型', trigger: 'change' }
  ],
  preTasks: [
    { required: true, message: '请选择前置任务', trigger: 'change' }
  ]
}

// 依赖类型选项
const dependencyTypeOptions = [
  { label: '串行依赖', value: DependencyType.SERIAL, color: '#409EFF' },
  { label: '并行依赖', value: DependencyType.PARALLEL, color: '#67C23A' },
  { label: '条件依赖', value: DependencyType.CONDITIONAL, color: '#E6A23C' }
]

// 所有任务选项（用于选择前置任务）
const allTasks = ref<string[]>([
  '数据采集任务A',
  '数据采集任务B',
  '数据处理任务C',
  '数据清洗任务D',
  '数据分析任务E',
  '数据分发任务F',
  '数据归档任务G',
  '报表生成任务H'
])

// 选中的任务（用于高亮显示）
const selectedTask = ref<string>('')

// 可视化容器引用
const visualizationRef = ref<HTMLDivElement>()
const canvasScale = ref(1)

// 获取依赖类型标签
const getDependencyTypeTag = (type: DependencyType) => {
  const option = dependencyTypeOptions.find(opt => opt.value === type)
  return option || dependencyTypeOptions[0]
}

// 过滤后的列表
const filteredList = computed(() => {
  return dependencyList.value.filter(item => {
    const nameMatch = !searchForm.taskName || 
      item.taskName.toLowerCase().includes(searchForm.taskName.toLowerCase())
    const typeMatch = !searchForm.dependencyType || 
      item.dependencyType === searchForm.dependencyType
    return nameMatch && typeMatch
  })
})

// 计算属性 - 可用的前置任务选项
const availablePreTasks = computed(() => {
  return allTasks.value.filter(task => task !== dependencyForm.taskName)
})

// 加载依赖关系列表
const loadDependencyList = () => {
  loading.value = true
  setTimeout(() => {
    dependencyList.value = [
      {
        id: '1',
        taskName: '数据处理任务C',
        dependencyType: DependencyType.SERIAL,
        preTasks: ['数据采集任务A'],
        status: true,
        description: '数据采集完成后进行处理',
        createTime: '2025-10-20 09:00:00',
        updateTime: '2025-10-28 10:00:00'
      },
      {
        id: '2',
        taskName: '数据清洗任务D',
        dependencyType: DependencyType.PARALLEL,
        preTasks: ['数据采集任务A', '数据采集任务B'],
        status: true,
        description: '两个采集任务完成后并行清洗',
        createTime: '2025-10-21 10:00:00',
        updateTime: '2025-10-28 10:00:00'
      },
      {
        id: '3',
        taskName: '数据分析任务E',
        dependencyType: DependencyType.CONDITIONAL,
        preTasks: ['数据处理任务C'],
        status: true,
        condition: 'dataSize > 1000 && quality >= 0.9',
        conditionAction: '启动高级分析流程',
        description: '根据数据质量决定是否执行',
        createTime: '2025-10-22 11:00:00',
        updateTime: '2025-10-28 10:00:00'
      },
      {
        id: '4',
        taskName: '数据分发任务F',
        dependencyType: DependencyType.SERIAL,
        preTasks: ['数据分析任务E'],
        status: true,
        description: '分析完成后分发数据',
        createTime: '2025-10-23 12:00:00',
        updateTime: '2025-10-28 10:00:00'
      },
      {
        id: '5',
        taskName: '报表生成任务H',
        dependencyType: DependencyType.PARALLEL,
        preTasks: ['数据分析任务E', '数据分发任务F'],
        status: false,
        description: '分析和分发完成后生成报表',
        createTime: '2025-10-24 13:00:00',
        updateTime: '2025-10-28 10:00:00'
      }
    ]
    loading.value = false
  }, 500)
}

// 搜索
const handleSearch = () => {
  ElMessage.success('搜索完成')
}

// 重置搜索
const handleReset = () => {
  searchForm.taskName = ''
  searchForm.dependencyType = ''
}

// 新增依赖关系
const handleAdd = () => {
  dialogMode.value = 'create'
  dialogTitle.value = '新增依赖关系'
  resetForm()
  dialogVisible.value = true
}

// 编辑依赖关系
const handleEdit = (row: Dependency) => {
  dialogMode.value = 'edit'
  dialogTitle.value = '编辑依赖关系'
  Object.assign(dependencyForm, {
    ...row,
    preTasks: [...row.preTasks]
  })
  dialogVisible.value = true
}

// 删除依赖关系
const handleDelete = (row: Dependency) => {
  ElMessageBox.confirm(
    `确定要删除任务"${row.taskName}"的依赖关系吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    loading.value = true
    setTimeout(() => {
      const index = dependencyList.value.findIndex(item => item.id === row.id)
      if (index > -1) {
        dependencyList.value.splice(index, 1)
      }
      loading.value = false
      ElMessage.success('删除成功')
    }, 300)
  }).catch(() => {
    // 取消删除
  })
}

// 切换状态
const handleStatusChange = (row: Dependency) => {
  setTimeout(() => {
    ElMessage.success(`依赖关系已${row.status ? '启用' : '禁用'}`)
  }, 200)
}

// 重置表单
const resetForm = () => {
  Object.assign(dependencyForm, {
    taskName: '',
    dependencyType: DependencyType.SERIAL,
    preTasks: [],
    status: true,
    condition: '',
    conditionAction: '',
    description: ''
  })
  formRef.value?.clearValidate()
}

// 提交表单
const handleSubmit = () => {
  formRef.value?.validate((valid) => {
    if (!valid) {
      ElMessage.error('请完善依赖关系配置')
      return
    }

    // 条件依赖必须填写条件
    if (dependencyForm.dependencyType === DependencyType.CONDITIONAL && !dependencyForm.condition) {
      ElMessage.warning('条件依赖必须设置触发条件')
      return
    }

    loading.value = true
    setTimeout(() => {
      const now = new Date().toLocaleString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
      }).replace(/\//g, '-')

      if (dialogMode.value === 'create') {
        const newDependency: Dependency = {
          ...dependencyForm as Dependency,
          id: Date.now().toString(),
          createTime: now,
          updateTime: now
        }
        dependencyList.value.unshift(newDependency)
        ElMessage.success('新增成功')
      } else {
        const index = dependencyList.value.findIndex(item => item.id === dependencyForm.id)
        if (index > -1) {
          dependencyList.value[index] = {
            ...dependencyList.value[index],
            ...dependencyForm,
            updateTime: now
          } as Dependency
          ElMessage.success('更新成功')
        }
      }
      loading.value = false
      dialogVisible.value = false
    }, 500)
  })
}

// 选择任务（用于高亮）
const handleSelectTask = (taskName: string) => {
  selectedTask.value = selectedTask.value === taskName ? '' : taskName
}

// 打开条件设置对话框
const handleConditionSetting = (row?: Dependency) => {
  if (row) {
    conditionTestForm.condition = row.condition || ''
  } else if (dependencyForm.dependencyType === DependencyType.CONDITIONAL) {
    conditionTestForm.condition = dependencyForm.condition || ''
  }
  conditionTestForm.testData = '{"dataSize": 1200, "quality": 0.95}'
  conditionTestForm.testResult = ''
  conditionDialogVisible.value = true
}

// 测试条件
const handleTestCondition = () => {
  if (!conditionTestForm.condition) {
    ElMessage.warning('请输入条件表达式')
    return
  }

  if (!conditionTestForm.testData) {
    ElMessage.warning('请输入测试数据')
    return
  }

  setTimeout(() => {
    try {
      // 模拟条件测试
      const testData = JSON.parse(conditionTestForm.testData)
      const condition = conditionTestForm.condition
      
      // 简单的条件评估模拟
      let result = false
      if (condition.includes('dataSize > 1000') && testData.dataSize > 1000) {
        result = true
      }
      if (condition.includes('quality >= 0.9') && testData.quality >= 0.9) {
        result = result || condition.includes('||')
      }

      conditionTestForm.testResult = result ? '条件满足，任务将被执行' : '条件不满足，任务将被跳过'
      ElMessage.success('测试完成')
    } catch (error) {
      ElMessage.error('测试数据格式错误，请使用 JSON 格式')
    }
  }, 300)
}

// 应用条件
const handleApplyCondition = () => {
  if (dependencyForm.dependencyType === DependencyType.CONDITIONAL) {
    dependencyForm.condition = conditionTestForm.condition
  }
  conditionDialogVisible.value = false
  ElMessage.success('条件已应用')
}

// 依赖验证
const handleValidation = () => {
  validationResult.value = {
    isValid: true,
    errors: [],
    warnings: []
  }

  // 检测循环依赖
  const cycles = detectCircularDependency()
  if (cycles.length > 0) {
    validationResult.value.isValid = false
    validationResult.value.errors.push(...cycles)
  }

  // 检测无效依赖（前置任务不存在）
  const invalidDeps = detectInvalidDependency()
  if (invalidDeps.length > 0) {
    validationResult.value.warnings.push(...invalidDeps)
  }

  // 检测孤立任务
  const orphanTasks = detectOrphanTasks()
  if (orphanTasks.length > 0) {
    validationResult.value.warnings.push(...orphanTasks)
  }

  validationDialogVisible.value = true

  if (validationResult.value.isValid && validationResult.value.warnings.length === 0) {
    ElMessage.success('验证通过，未发现问题')
  } else {
    ElMessage.warning('发现一些问题，请查看详情')
  }
}

// 检测循环依赖
const detectCircularDependency = (): string[] => {
  const errors: string[] = []
  const graph = new Map<string, string[]>()

  // 构建依赖图
  dependencyList.value.forEach(dep => {
    if (dep.status) {
      graph.set(dep.taskName, dep.preTasks)
    }
  })

  // DFS 检测环
  const visited = new Set<string>()
  const recStack = new Set<string>()

  const hasCycle = (node: string, path: string[]): boolean => {
    visited.add(node)
    recStack.add(node)
    path.push(node)

    const neighbors = graph.get(node) || []
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor, [...path])) {
          return true
        }
      } else if (recStack.has(neighbor)) {
        const cyclePath = [...path, neighbor].join(' -> ')
        errors.push(`检测到循环依赖: ${cyclePath}`)
        return true
      }
    }

    recStack.delete(node)
    return false
  }

  graph.forEach((_, node) => {
    if (!visited.has(node)) {
      hasCycle(node, [])
    }
  })

  return errors
}

// 检测无效依赖
const detectInvalidDependency = (): string[] => {
  const warnings: string[] = []
  const existingTasks = new Set(dependencyList.value.map(dep => dep.taskName))

  dependencyList.value.forEach(dep => {
    dep.preTasks.forEach(preTask => {
      if (!existingTasks.has(preTask) && !allTasks.value.includes(preTask)) {
        warnings.push(`任务"${dep.taskName}"的前置任务"${preTask}"不存在`)
      }
    })
  })

  return warnings
}

// 检测孤立任务
const detectOrphanTasks = (): string[] => {
  const warnings: string[] = []
  const tasksWithDep = new Set(dependencyList.value.map(dep => dep.taskName))

  allTasks.value.forEach(task => {
    if (!tasksWithDep.has(task)) {
      const isPreTask = dependencyList.value.some(dep => dep.preTasks.includes(task))
      if (!isPreTask) {
        warnings.push(`任务"${task}"没有配置依赖关系`)
      }
    }
  })

  return warnings
}

// 批量验证
const handleBatchValidation = () => {
  handleValidation()
}

// 导出依赖配置
const handleExport = () => {
  const data = JSON.stringify(dependencyList.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dependency_config_${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

// 缩放控制
const handleZoomIn = () => {
  canvasScale.value = Math.min(canvasScale.value + 0.1, 2)
}

const handleZoomOut = () => {
  canvasScale.value = Math.max(canvasScale.value - 0.1, 0.5)
}

const handleResetZoom = () => {
  canvasScale.value = 1
}

// 生成依赖关系图的节点和连线
const generateDependencyGraph = () => {
  // 简单的层级布局算法
  const levels = new Map<string, number>()
  const processed = new Set<string>()

  const calculateLevel = (taskName: string, level = 0): number => {
    if (processed.has(taskName)) {
      return levels.get(taskName) || 0
    }

    const dep = dependencyList.value.find(d => d.taskName === taskName)
    if (!dep || dep.preTasks.length === 0) {
      levels.set(taskName, level)
      processed.add(taskName)
      return level
    }

    let maxPreLevel = -1
    dep.preTasks.forEach(preTask => {
      const preLevel = calculateLevel(preTask, level)
      maxPreLevel = Math.max(maxPreLevel, preLevel)
    })

    const currentLevel = maxPreLevel + 1
    levels.set(taskName, currentLevel)
    processed.add(taskName)
    return currentLevel
  }

  // 计算所有任务的层级
  dependencyList.value.forEach(dep => {
    if (!processed.has(dep.taskName)) {
      calculateLevel(dep.taskName)
    }
  })

  return levels
}

// 页面加载时获取数据
onMounted(() => {
  loadDependencyList()
})
</script>

<template>
  <div class="dependency-config">
    <div class="page-header">
      <h2>依赖关系配置</h2>
      <p>定义任务之间的依赖关系，确保任务按照正确的顺序执行</p>
    </div>

    <el-row :gutter="20">
      <!-- 左侧：依赖关系列表 -->
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">依赖关系列表</span>
              <el-button type="primary" @click="handleAdd">新增依赖</el-button>
            </div>
          </template>

          <!-- 搜索区域 -->
          <el-form :model="searchForm" inline class="search-form">
            <el-form-item label="任务名称">
              <el-input 
                v-model="searchForm.taskName" 
                placeholder="请输入任务名称" 
                clearable 
                style="width: 180px" 
              />
            </el-form-item>
            <el-form-item label="依赖类型">
              <el-select 
                v-model="searchForm.dependencyType" 
                placeholder="请选择依赖类型" 
                clearable 
                style="width: 150px"
              >
                <el-option
                  v-for="item in dependencyTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">查询</el-button>
              <el-button @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>

          <!-- 依赖关系表格 -->
          <el-table 
            :data="filteredList" 
            v-loading="loading" 
            border 
            stripe
            @row-click="handleSelectTask"
            :row-class-name="({ row }) => row.taskName === selectedTask ? 'selected-row' : ''"
          >
            <el-table-column prop="taskName" label="任务名称" min-width="140" />
            <el-table-column label="依赖类型" align="center" width="110">
              <template #default="{ row }">
                <el-tag 
                  :color="getDependencyTypeTag(row.dependencyType).color" 
                  effect="dark"
                  size="small"
                >
                  {{ getDependencyTypeTag(row.dependencyType).label }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="前置任务" min-width="140" show-overflow-tooltip>
              <template #default="{ row }">
                <el-tag 
                  v-for="task in row.preTasks" 
                  :key="task" 
                  size="small" 
                  class="mr-5"
                >
                  {{ task }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" align="center" width="80">
              <template #default="{ row }">
                <el-switch 
                  v-model="row.status" 
                  @change="handleStatusChange(row)"
                  size="small"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="140" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="handleEdit(row)">
                  编辑
                </el-button>
                <el-button 
                  v-if="row.dependencyType === DependencyType.CONDITIONAL"
                  type="warning" 
                  link 
                  size="small" 
                  @click="handleConditionSetting(row)"
                >
                  条件
                </el-button>
                <el-button type="danger" link size="small" @click="handleDelete(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 右侧：依赖关系图和操作区 -->
      <el-col :span="12">
        <!-- 依赖关系图 -->
        <el-card shadow="hover" class="mb-20">
          <template #header>
            <div class="card-header">
              <span class="card-title">依赖关系图</span>
              <div class="zoom-controls">
                <el-button-group size="small">
                  <el-button @click="handleZoomOut">-</el-button>
                  <el-button @click="handleResetZoom">{{ Math.round(canvasScale * 100) }}%</el-button>
                  <el-button @click="handleZoomIn">+</el-button>
                </el-button-group>
              </div>
            </div>
          </template>

          <div class="visualization-container" ref="visualizationRef">
            <div class="graph-canvas" :style="{ transform: `scale(${canvasScale})` }">
              <div v-if="filteredList.length === 0" class="empty-graph">
                <el-empty description="暂无依赖关系数据" />
              </div>
              <div v-else class="dependency-graph">
                <!-- 简化的依赖关系流程图 -->
                <div 
                  v-for="(dep, index) in filteredList.slice(0, 5)" 
                  :key="dep.id" 
                  class="graph-node"
                  :class="{ 
                    'node-selected': dep.taskName === selectedTask,
                    [`node-${dep.dependencyType}`]: true 
                  }"
                  :style="{ top: `${index * 90 + 20}px` }"
                >
                  <div class="node-content">
                    <div class="node-header">
                      <span class="node-name">{{ dep.taskName }}</span>
                      <el-tag 
                        :color="getDependencyTypeTag(dep.dependencyType).color" 
                        effect="dark" 
                        size="small"
                      >
                        {{ getDependencyTypeTag(dep.dependencyType).label }}
                      </el-tag>
                    </div>
                    <div class="node-deps">
                      <div v-for="preTask in dep.preTasks" :key="preTask" class="dep-line">
                        <span class="dep-arrow">↑</span>
                        <span class="dep-task">{{ preTask }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="graph-legend">
            <div class="legend-item">
              <span class="legend-color" style="background-color: #409EFF;"></span>
              <span class="legend-label">串行依赖</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background-color: #67C23A;"></span>
              <span class="legend-label">并行依赖</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background-color: #E6A23C;"></span>
              <span class="legend-label">条件依赖</span>
            </div>
          </div>
        </el-card>

        <!-- 快捷操作 -->
        <el-card shadow="hover">
          <template #header>
            <span class="card-title">依赖验证与操作</span>
          </template>

          <div class="quick-actions">
            <el-button type="success" @click="handleValidation" class="action-btn">
              <span class="btn-icon">✓</span>
              依赖完整性验证
            </el-button>
            <el-button type="warning" @click="handleBatchValidation" class="action-btn">
              <span class="btn-icon">🔍</span>
              循环依赖检测
            </el-button>
            <el-button type="primary" @click="handleExport" class="action-btn">
              <span class="btn-icon">📤</span>
              导出依赖配置
            </el-button>
          </div>

          <el-divider />

          <!-- 统计信息 -->
          <div class="stats-info">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-statistic title="总依赖数" :value="dependencyList.length" />
              </el-col>
              <el-col :span="8">
                <el-statistic 
                  title="已启用" 
                  :value="dependencyList.filter(d => d.status).length" 
                />
              </el-col>
              <el-col :span="8">
                <el-statistic 
                  title="条件依赖" 
                  :value="dependencyList.filter(d => d.dependencyType === DependencyType.CONDITIONAL).length" 
                />
              </el-col>
            </el-row>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 新增/编辑对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogTitle" 
      width="700px" 
      :close-on-click-modal="false"
    >
      <el-form 
        ref="formRef" 
        :model="dependencyForm" 
        :rules="formRules" 
        label-width="120px"
      >
        <el-form-item label="任务名称" prop="taskName">
          <el-select 
            v-model="dependencyForm.taskName" 
            placeholder="请选择任务" 
            style="width: 100%"
            filterable
          >
            <el-option 
              v-for="task in allTasks" 
              :key="task" 
              :label="task" 
              :value="task" 
            />
          </el-select>
        </el-form-item>

        <el-form-item label="依赖类型" prop="dependencyType">
          <el-radio-group v-model="dependencyForm.dependencyType">
            <el-radio 
              v-for="type in dependencyTypeOptions" 
              :key="type.value" 
              :label="type.value"
              border
            >
              <span :style="{ color: type.color }">{{ type.label }}</span>
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="前置任务" prop="preTasks">
          <el-select 
            v-model="dependencyForm.preTasks" 
            multiple 
            placeholder="请选择前置任务" 
            style="width: 100%"
            filterable
          >
            <el-option 
              v-for="task in availablePreTasks" 
              :key="task" 
              :label="task" 
              :value="task" 
            />
          </el-select>
          <div class="form-tip">
            <template v-if="dependencyForm.dependencyType === DependencyType.SERIAL">
              串行依赖：前置任务按顺序依次执行完成后，才执行当前任务
            </template>
            <template v-else-if="dependencyForm.dependencyType === DependencyType.PARALLEL">
              并行依赖：所有前置任务可并行执行，全部完成后执行当前任务
            </template>
            <template v-else-if="dependencyForm.dependencyType === DependencyType.CONDITIONAL">
              条件依赖：前置任务完成后，根据条件判断是否执行当前任务
            </template>
          </div>
        </el-form-item>

        <!-- 条件依赖特有配置 -->
        <template v-if="dependencyForm.dependencyType === DependencyType.CONDITIONAL">
          <el-divider content-position="left">条件配置</el-divider>

          <el-form-item label="触发条件">
            <el-input 
              v-model="dependencyForm.condition" 
              type="textarea" 
              :rows="3" 
              placeholder="例如: dataSize > 1000 && quality >= 0.9"
            />
            <el-button 
              type="text" 
              size="small" 
              @click="handleConditionSetting()"
              style="margin-top: 5px"
            >
              测试条件表达式
            </el-button>
          </el-form-item>

          <el-form-item label="执行动作">
            <el-input 
              v-model="dependencyForm.conditionAction" 
              placeholder="条件满足时的执行动作" 
            />
          </el-form-item>
        </template>

        <el-form-item label="描述">
          <el-input 
            v-model="dependencyForm.description" 
            type="textarea" 
            :rows="2" 
            placeholder="请输入依赖关系描述" 
          />
        </el-form-item>

        <el-form-item label="状态">
          <el-switch 
            v-model="dependencyForm.status" 
            active-text="启用" 
            inactive-text="禁用" 
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 条件测试对话框 -->
    <el-dialog 
      v-model="conditionDialogVisible" 
      title="条件表达式测试" 
      width="650px"
      :close-on-click-modal="false"
    >
      <el-form label-width="120px">
        <el-alert 
          title="条件测试工具" 
          description="输入条件表达式和测试数据，验证条件逻辑是否正确" 
          type="info" 
          :closable="false" 
          class="mb-20" 
        />

        <el-form-item label="条件表达式">
          <el-input 
            v-model="conditionTestForm.condition" 
            type="textarea" 
            :rows="3" 
            placeholder="例如: dataSize > 1000 && quality >= 0.9"
          />
        </el-form-item>

        <el-form-item label="测试数据">
          <el-input 
            v-model="conditionTestForm.testData" 
            type="textarea" 
            :rows="3" 
            placeholder='JSON 格式，例如: {"dataSize": 1200, "quality": 0.95}'
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleTestCondition">执行测试</el-button>
        </el-form-item>

        <el-form-item label="测试结果" v-if="conditionTestForm.testResult">
          <el-alert 
            :title="conditionTestForm.testResult" 
            :type="conditionTestForm.testResult.includes('满足') ? 'success' : 'warning'"
            :closable="false" 
          />
        </el-form-item>

        <el-divider />

        <el-form-item label="常用表达式">
          <div class="expression-examples">
            <el-tag class="example-tag" @click="conditionTestForm.condition = 'dataSize > 1000'">
              数据量大于1000
            </el-tag>
            <el-tag class="example-tag" @click="conditionTestForm.condition = 'quality >= 0.9'">
              质量大于等于0.9
            </el-tag>
            <el-tag class="example-tag" @click="conditionTestForm.condition = 'status == &quot;success&quot;'">
              状态为成功
            </el-tag>
            <el-tag class="example-tag" @click="conditionTestForm.condition = 'errorCount == 0'">
              无错误
            </el-tag>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="conditionDialogVisible = false">取消</el-button>
        <el-button 
          v-if="dependencyForm.dependencyType === DependencyType.CONDITIONAL"
          type="primary" 
          @click="handleApplyCondition"
        >
          应用条件
        </el-button>
      </template>
    </el-dialog>

    <!-- 验证结果对话框 -->
    <el-dialog 
      v-model="validationDialogVisible" 
      title="依赖验证结果" 
      width="700px"
    >
      <div class="validation-result">
        <el-alert 
          :type="validationResult.isValid ? 'success' : 'error'"
          :title="validationResult.isValid ? '验证通过' : '发现错误'"
          :closable="false"
          show-icon
          class="mb-20"
        />

        <!-- 错误列表 -->
        <div v-if="validationResult.errors.length > 0" class="result-section">
          <h4 class="section-title error-title">
            <span class="title-icon">❌</span>
            错误（{{ validationResult.errors.length }}）
          </h4>
          <el-alert 
            v-for="(error, index) in validationResult.errors" 
            :key="`error-${index}`"
            :title="error"
            type="error"
            :closable="false"
            class="mb-10"
          />
        </div>

        <!-- 警告列表 -->
        <div v-if="validationResult.warnings.length > 0" class="result-section">
          <h4 class="section-title warning-title">
            <span class="title-icon">⚠️</span>
            警告（{{ validationResult.warnings.length }}）
          </h4>
          <el-alert 
            v-for="(warning, index) in validationResult.warnings" 
            :key="`warning-${index}`"
            :title="warning"
            type="warning"
            :closable="false"
            class="mb-10"
          />
        </div>

        <!-- 无问题提示 -->
        <div 
          v-if="validationResult.isValid && validationResult.warnings.length === 0" 
          class="result-section"
        >
          <el-result icon="success" title="验证通过" sub-title="依赖关系配置正确，未发现任何问题">
            <template #extra>
              <el-descriptions :column="2" border>
                <el-descriptions-item label="总依赖数">
                  {{ dependencyList.length }}
                </el-descriptions-item>
                <el-descriptions-item label="已启用">
                  {{ dependencyList.filter(d => d.status).length }}
                </el-descriptions-item>
                <el-descriptions-item label="串行依赖">
                  {{ dependencyList.filter(d => d.dependencyType === DependencyType.SERIAL).length }}
                </el-descriptions-item>
                <el-descriptions-item label="并行依赖">
                  {{ dependencyList.filter(d => d.dependencyType === DependencyType.PARALLEL).length }}
                </el-descriptions-item>
                <el-descriptions-item label="条件依赖">
                  {{ dependencyList.filter(d => d.dependencyType === DependencyType.CONDITIONAL).length }}
                </el-descriptions-item>
              </el-descriptions>
            </template>
          </el-result>
        </div>
      </div>

      <template #footer>
        <el-button type="primary" @click="validationDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.dependency-config {
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

  .mb-10 {
    margin-bottom: 10px;
  }

  .mr-5 {
    margin-right: 5px;
  }

  // 可视化容器
  .visualization-container {
    height: 450px;
    overflow: auto;
    background: #f5f7fa;
    border-radius: 4px;
    position: relative;

    .graph-canvas {
      min-height: 100%;
      transform-origin: top left;
      transition: transform 0.3s ease;
      padding: 20px;
    }

    .empty-graph {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
    }

    .dependency-graph {
      position: relative;
      min-height: 450px;

      .graph-node {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        width: 85%;
        background: white;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
        border-left: 4px solid #409EFF;

        &.node-serial {
          border-left-color: #409EFF;
        }

        &.node-parallel {
          border-left-color: #67C23A;
        }

        &.node-conditional {
          border-left-color: #E6A23C;
        }

        &.node-selected {
          box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
          transform: translateX(-50%) scale(1.02);
        }

        &:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .node-content {
          .node-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;

            .node-name {
              font-weight: 600;
              font-size: 14px;
              color: #303133;
            }
          }

          .node-deps {
            .dep-line {
              display: flex;
              align-items: center;
              padding: 4px 0;
              font-size: 13px;
              color: #606266;

              .dep-arrow {
                margin-right: 8px;
                color: #909399;
                font-weight: bold;
              }

              .dep-task {
                flex: 1;
              }
            }
          }
        }
      }
    }
  }

  .zoom-controls {
    .el-button-group {
      .el-button {
        padding: 5px 10px;
      }
    }
  }

  .graph-legend {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #ebeef5;

    .legend-item {
      display: flex;
      align-items: center;
      font-size: 13px;

      .legend-color {
        width: 16px;
        height: 16px;
        border-radius: 3px;
        margin-right: 6px;
      }

      .legend-label {
        color: #606266;
      }
    }
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

  // 统计信息
  .stats-info {
    margin-top: 20px;
  }

  // 表单提示
  .form-tip {
    margin-top: 5px;
    font-size: 12px;
    color: #909399;
    line-height: 1.5;
  }

  // 条件表达式示例
  .expression-examples {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;

    .example-tag {
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }
    }
  }

  // 验证结果
  .validation-result {
    .result-section {
      margin-bottom: 20px;

      .section-title {
        margin: 0 0 15px 0;
        font-size: 16px;
        font-weight: 600;
        display: flex;
        align-items: center;

        .title-icon {
          margin-right: 8px;
        }

        &.error-title {
          color: #f56c6c;
        }

        &.warning-title {
          color: #e6a23c;
        }
      }
    }
  }

  // 表格样式
  :deep(.el-table) {
    font-size: 13px;

    th {
      background-color: #f5f7fa;
      font-weight: 600;
    }

    .selected-row {
      background-color: #ecf5ff !important;
    }
  }

  :deep(.el-card__body) {
    padding: 20px;
  }

  :deep(.el-form-item__label) {
    font-weight: 500;
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