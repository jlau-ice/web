<template>
  <div class="execute-engine-container">
    <!-- 引擎统计区域 -->
    <div class="monitor-section">
      <el-row :gutter="16">
        <el-col :span="6" v-for="stat in statistics" :key="stat.key">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-item">
              <div class="stat-icon" :class="stat.key">
                <el-icon :size="24">
                  <component :is="stat.icon" />
                </el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stat.value }}</div>
                <div class="stat-label">{{ stat.label }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 执行控制台 -->
    <el-row :gutter="20">
      <el-col :span="18">
        <el-card shadow="never" class="main-card">
          <template #header>
            <div class="card-header">
              <span class="title">执行控制台</span>
              <div class="header-actions">
                <el-button type="primary" @click="handleCreateTask">新建执行任务</el-button>
                <el-button @click="handleRefresh">刷新</el-button>
              </div>
            </div>
          </template>

          <div class="filter-section">
            <el-form :inline="true" :model="filterForm">
              <el-form-item label="任务名称">
                <el-input
                  v-model="filterForm.name"
                  placeholder="请输入任务名称"
                  clearable
                  style="width: 200px"
                />
              </el-form-item>
              <el-form-item label="执行状态">
                <el-select
                  v-model="filterForm.status"
                  placeholder="请选择状态"
                  clearable
                  style="width: 150px"
                >
                  <el-option label="全部" value="" />
                  <el-option label="待执行" value="pending" />
                  <el-option label="运行中" value="running" />
                  <el-option label="暂停" value="paused" />
                  <el-option label="成功" value="success" />
                  <el-option label="失败" value="failed" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleSearch">查询</el-button>
                <el-button @click="handleReset">重置</el-button>
              </el-form-item>
            </el-form>
          </div>

          <el-table
            :data="paginatedData"
            border
            stripe
            style="width: 100%"
            v-loading="loading"
          >
            <el-table-column type="index" label="序号" width="60" :index="indexMethod" />
            <el-table-column prop="name" label="任务名称" min-width="140" />
            <el-table-column prop="type" label="任务类型" width="100">
              <template #default="{ row }">
                <el-tag :type="getTypeColor(row.type)" size="small">{{ getTypeName(row.type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="dependencies" label="依赖任务" width="130">
              <template #default="{ row }">
                <span v-if="row.dependencies.length === 0" style="color: #909399;">无</span>
                <el-tag v-else size="small" type="info">{{ row.dependencies.length }} 个</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="executeMode" label="执行模式" width="100">
              <template #default="{ row }">
                <el-tag :type="row.executeMode === 'parallel' ? 'warning' : 'info'" size="small">
                  {{ row.executeMode === 'parallel' ? '并行' : '顺序' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="getStatusColor(row.status)" size="small">{{ getStatusName(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="进度" width="150">
              <template #default="{ row }">
                <el-progress
                  :percentage="row.progress"
                  :status="getProgressStatus(row.status)"
                  :stroke-width="8"
                />
              </template>
            </el-table-column>
            <el-table-column prop="executeNode" label="执行节点" width="110" />
            <el-table-column prop="startTime" label="开始时间" width="150" />
            <el-table-column label="操作" width="240" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="row.status === 'pending'"
                  type="primary"
                  size="small"
                  @click="handleStart(row)"
                >
                  启动
                </el-button>
                <el-button
                  v-if="row.status === 'running'"
                  type="warning"
                  size="small"
                  @click="handlePause(row)"
                >
                  暂停
                </el-button>
                <el-button
                  v-if="row.status === 'paused'"
                  type="success"
                  size="small"
                  @click="handleResume(row)"
                >
                  恢复
                </el-button>
                <el-button
                  v-if="row.status === 'failed'"
                  type="danger"
                  size="small"
                  @click="handleRetry(row)"
                >
                  重试
                </el-button>
                <el-button
                  type="primary"
                  size="small"
                  @click="handleViewTopology(row)"
                  link
                >
                  查看拓扑
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-section">
            <el-pagination
              v-model:current-page="pagination.currentPage"
              v-model:page-size="pagination.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="filteredData.length"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
      </el-col>

      <!-- 执行日志面板 -->
      <el-col :span="6">
        <el-card shadow="never" class="log-panel">
          <template #header>
            <div class="card-header">
              <span class="title">执行日志</span>
              <el-button size="small" @click="handleClearLogs">清空</el-button>
            </div>
          </template>
          <div class="engine-log-container" ref="logContainerRef">
            <div
              v-for="(log, index) in engineLogs"
              :key="index"
              class="engine-log-item"
              :class="log.type"
            >
              <div class="log-time">{{ log.time }}</div>
              <div class="log-content">{{ log.message }}</div>
            </div>
            <div v-if="engineLogs.length === 0" class="empty-logs">暂无日志</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 新建执行任务弹窗 -->
    <el-dialog
      v-model="createDialogVisible"
      title="新建执行任务"
      width="700px"
    >
      <el-form :model="createForm" label-width="120px">
        <el-form-item label="选择任务">
          <el-select
            v-model="createForm.taskIds"
            placeholder="请选择待执行的任务"
            multiple
            collapse-tags
            style="width: 100%"
          >
            <el-option
              v-for="task in availableTasks"
              :key="task.id"
              :label="task.name"
              :value="task.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="执行模式">
          <el-radio-group v-model="createForm.executeMode">
            <el-radio label="sequential">顺序执行</el-radio>
            <el-radio label="parallel">并行执行</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="并发数">
          <el-input-number
            v-model="createForm.concurrency"
            :min="1"
            :max="10"
            :disabled="createForm.executeMode === 'sequential'"
            style="width: 200px"
          />
          <span class="form-tip">（并行执行时生效）</span>
        </el-form-item>
        <el-form-item label="启用断点续传">
          <el-switch v-model="createForm.enableResume" />
          <span class="form-tip">（失败后可从断点恢复）</span>
        </el-form-item>
        <el-form-item label="重试次数">
          <el-input-number
            v-model="createForm.retryCount"
            :min="0"
            :max="5"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="重试间隔">
          <el-input-number
            v-model="createForm.retryInterval"
            :min="10"
            :max="300"
            style="width: 200px"
          />
          <span class="form-tip">（秒）</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmCreate" :loading="executing">
          启动执行
        </el-button>
      </template>
    </el-dialog>

    <!-- 依赖拓扑查看弹窗 -->
    <el-dialog
      v-model="topologyDialogVisible"
      title="任务依赖拓扑"
      width="800px"
    >
      <div v-if="currentTask">
        <el-alert
          title="拓扑说明"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        >
          <template #default>
            展示任务的依赖关系和执行流程，点击节点可手动触发单任务重试
          </template>
        </el-alert>
        <el-tree
          :data="topologyData"
          :props="{ label: 'name', children: 'children' }"
          node-key="id"
          default-expand-all
          :expand-on-click-node="false"
        >
          <template #default="{ node, data }">
            <span class="topology-node">
              <span class="node-name">{{ node.label }}</span>
              <el-tag
                :type="getStatusColor(data.status)"
                size="small"
                style="margin-left: 10px"
              >
                {{ getStatusName(data.status) }}
              </el-tag>
              <el-button
                v-if="data.status === 'failed'"
                type="danger"
                size="small"
                link
                @click.stop="handleRetryNode(data)"
                style="margin-left: 10px"
              >
                重试
              </el-button>
            </span>
          </template>
        </el-tree>
      </div>
      <template #footer>
        <el-button @click="topologyDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

interface Task {
  id: number
  name: string
  type: string
  dependencies: DependencyNode[]
  executeMode: string
  status: string
  progress: number
  executeNode: string
  startTime: string
  endTime?: string
  concurrency?: number
  enableResume?: boolean
  retryCount?: number
  retryInterval?: number
}

interface DependencyNode {
  id: string
  name: string
  status: string
  children?: DependencyNode[]
}

interface FilterForm {
  name: string
  status: string
}

interface CreateForm {
  taskIds: number[]
  executeMode: string
  concurrency: number
  enableResume: boolean
  retryCount: number
  retryInterval: number
}

interface EngineLog {
  time: string
  type: string
  message: string
}

interface Statistic {
  key: string
  label: string
  value: number
  color: string
  icon: string
}

interface AvailableTask {
  id: number
  name: string
  type: string
}

// Mock 可用任务列表
const availableTasks = ref<AvailableTask[]>([
  { id: 1001, name: '用户数据全量采集', type: 'full' },
  { id: 1002, name: '订单增量同步', type: 'incremental' },
  { id: 1003, name: '日志实时采集', type: 'realtime' },
  { id: 1004, name: '商品数据全量备份', type: 'full' },
  { id: 1005, name: '会员信息增量采集', type: 'incremental' },
  { id: 1006, name: '缓存数据实时监控', type: 'realtime' }
])

// Mock 执行任务数据
const mockTasks = ref<Task[]>([
  {
    id: 1,
    name: '用户数据全量采集',
    type: 'full',
    dependencies: [
      {
        id: 'dep-1-1',
        name: '数据源连接检查',
        status: 'success',
        children: []
      },
      {
        id: 'dep-1-2',
        name: '数据提取',
        status: 'running',
        children: [
          { id: 'dep-1-2-1', name: '表结构分析', status: 'success' },
          { id: 'dep-1-2-2', name: '数据读取', status: 'running' }
        ]
      },
      {
        id: 'dep-1-3',
        name: '数据转换',
        status: 'pending',
        children: []
      },
      {
        id: 'dep-1-4',
        name: '数据加载',
        status: 'pending',
        children: []
      }
    ],
    executeMode: 'sequential',
    status: 'running',
    progress: 45,
    executeNode: 'Node-01',
    startTime: '2025-10-28 10:00:00',
    concurrency: 1,
    enableResume: true,
    retryCount: 3,
    retryInterval: 60
  },
  {
    id: 2,
    name: '订单增量同步',
    type: 'incremental',
    dependencies: [
      {
        id: 'dep-2-1',
        name: '增量检查',
        status: 'success',
        children: []
      },
      {
        id: 'dep-2-2',
        name: '数据提取',
        status: 'success',
        children: []
      },
      {
        id: 'dep-2-3',
        name: '数据加载',
        status: 'success',
        children: []
      }
    ],
    executeMode: 'sequential',
    status: 'success',
    progress: 100,
    executeNode: 'Node-02',
    startTime: '2025-10-28 09:00:00',
    endTime: '2025-10-28 09:15:32',
    concurrency: 1,
    enableResume: true,
    retryCount: 3,
    retryInterval: 60
  },
  {
    id: 3,
    name: '日志实时采集',
    type: 'realtime',
    dependencies: [],
    executeMode: 'parallel',
    status: 'running',
    progress: 68,
    executeNode: 'Node-03',
    startTime: '2025-10-28 08:00:00',
    concurrency: 5,
    enableResume: false,
    retryCount: 0,
    retryInterval: 30
  },
  {
    id: 4,
    name: '商品数据全量备份',
    type: 'full',
    dependencies: [
      {
        id: 'dep-4-1',
        name: '数据源连接',
        status: 'success',
        children: []
      },
      {
        id: 'dep-4-2',
        name: '数据备份',
        status: 'paused',
        children: []
      }
    ],
    executeMode: 'sequential',
    status: 'paused',
    progress: 30,
    executeNode: 'Node-01',
    startTime: '2025-10-28 07:00:00',
    concurrency: 1,
    enableResume: true,
    retryCount: 3,
    retryInterval: 60
  },
  {
    id: 5,
    name: '会员信息增量采集',
    type: 'incremental',
    dependencies: [
      {
        id: 'dep-5-1',
        name: '数据源连接',
        status: 'failed',
        children: []
      },
      {
        id: 'dep-5-2',
        name: '数据提取',
        status: 'pending',
        children: []
      }
    ],
    executeMode: 'sequential',
    status: 'failed',
    progress: 25,
    executeNode: 'Node-02',
    startTime: '2025-10-28 06:00:00',
    endTime: '2025-10-28 06:12:18',
    concurrency: 1,
    enableResume: true,
    retryCount: 3,
    retryInterval: 60
  },
  {
    id: 6,
    name: '多数据源并行采集',
    type: 'full',
    dependencies: [
      {
        id: 'dep-6-1',
        name: 'MySQL采集',
        status: 'pending',
        children: []
      },
      {
        id: 'dep-6-2',
        name: 'PostgreSQL采集',
        status: 'pending',
        children: []
      },
      {
        id: 'dep-6-3',
        name: 'MongoDB采集',
        status: 'pending',
        children: []
      }
    ],
    executeMode: 'parallel',
    status: 'pending',
    progress: 0,
    executeNode: 'Node-03',
    startTime: '-',
    concurrency: 3,
    enableResume: true,
    retryCount: 2,
    retryInterval: 30
  }
])

const tableData = ref<Task[]>([...mockTasks.value])
const filteredData = ref<Task[]>([...mockTasks.value])
const loading = ref(false)
const currentTask = ref<Task | null>(null)
const logContainerRef = ref<HTMLElement | null>(null)

// 引擎日志
const engineLogs = ref<EngineLog[]>([
  { time: '10:30:15', type: 'info', message: '引擎初始化完成' },
  { time: '10:30:20', type: 'info', message: '任务调度器启动成功' },
  { time: '10:30:25', type: 'success', message: '已加载 6 个执行任务' }
])

const filterForm = reactive<FilterForm>({
  name: '',
  status: ''
})

const pagination = reactive({
  currentPage: 1,
  pageSize: 10
})

const createDialogVisible = ref(false)
const topologyDialogVisible = ref(false)
const executing = ref(false)

const createForm = reactive<CreateForm>({
  taskIds: [],
  executeMode: 'sequential',
  concurrency: 3,
  enableResume: true,
  retryCount: 3,
  retryInterval: 60
})

// 自动刷新定时器
let refreshTimer: number | null = null
let taskIdCounter = 7

// 拓扑数据
const topologyData = computed(() => {
  if (!currentTask.value) return []
  return currentTask.value.dependencies.length > 0
    ? [
        {
          id: `root-${currentTask.value.id}`,
          name: currentTask.value.name,
          status: currentTask.value.status,
          children: currentTask.value.dependencies
        }
      ]
    : []
})

// 统计数据
const statistics = computed<Statistic[]>(() => {
  const total = tableData.value.length
  const pending = tableData.value.filter(t => t.status === 'pending').length
  const running = tableData.value.filter(t => t.status === 'running').length
  const success = tableData.value.filter(t => t.status === 'success').length
  const failed = tableData.value.filter(t => t.status === 'failed').length

  return [
    { key: 'total', label: '总任务数', value: total, color: '#409EFF', icon: 'Folder' },
    { key: 'running', label: '运行中', value: running, color: '#67C23A', icon: 'Loading' },
    { key: 'success', label: '成功', value: success, color: '#67C23A', icon: 'CircleCheck' },
    { key: 'failed', label: '失败', value: failed, color: '#F56C6C', icon: 'CircleClose' }
  ]
})

// 分页数据
const paginatedData = computed(() => {
  const start = (pagination.currentPage - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return filteredData.value.slice(start, end)
})

// 索引计算
const indexMethod = (index: number) => {
  return (pagination.currentPage - 1) * pagination.pageSize + index + 1
}

// 获取类型名称
const getTypeName = (type: string): string => {
  const typeMap: Record<string, string> = {
    full: '全量',
    incremental: '增量',
    realtime: '实时'
  }
  return typeMap[type] || type
}

// 获取类型颜色
const getTypeColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    full: 'primary',
    incremental: 'success',
    realtime: 'warning'
  }
  return colorMap[type] || ''
}

// 获取状态名称
const getStatusName = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: '待执行',
    running: '运行中',
    paused: '暂停',
    success: '成功',
    failed: '失败'
  }
  return statusMap[status] || status
}

// 获取状态颜色
const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    pending: 'info',
    running: 'success',
    paused: 'warning',
    success: 'success',
    failed: 'danger'
  }
  return colorMap[status] || ''
}

// 获取进度状态
const getProgressStatus = (status: string): 'success' | 'exception' | 'warning' | undefined => {
  if (status === 'success') return 'success'
  if (status === 'failed') return 'exception'
  if (status === 'paused') return 'warning'
  return undefined
}

// 添加引擎日志
const addEngineLog = (type: string, message: string) => {
  const now = new Date()
  const time = now.toLocaleTimeString('zh-CN', { hour12: false })
  engineLogs.value.unshift({ time, type, message })

  // 限制日志数量
  if (engineLogs.value.length > 100) {
    engineLogs.value = engineLogs.value.slice(0, 100)
  }

  // 自动滚动到顶部
  nextTick(() => {
    if (logContainerRef.value) {
      logContainerRef.value.scrollTop = 0
    }
  })
}

// 新建执行任务
const handleCreateTask = () => {
  createForm.taskIds = []
  createForm.executeMode = 'sequential'
  createForm.concurrency = 3
  createForm.enableResume = true
  createForm.retryCount = 3
  createForm.retryInterval = 60
  createDialogVisible.value = true
}

// 确认创建任务
const handleConfirmCreate = () => {
  if (createForm.taskIds.length === 0) {
    ElMessage.warning('请至少选择一个任务')
    return
  }

  executing.value = true

  setTimeout(() => {
    createForm.taskIds.forEach((taskId, index) => {
      const availableTask = availableTasks.value.find(t => t.id === taskId)
      if (!availableTask) return

      const newTask: Task = {
        id: taskIdCounter++,
        name: availableTask.name,
        type: availableTask.type,
        dependencies: [],
        executeMode: createForm.executeMode,
        status: 'pending',
        progress: 0,
        executeNode: `Node-0${(taskIdCounter % 3) + 1}`,
        startTime: '-',
        concurrency: createForm.concurrency,
        enableResume: createForm.enableResume,
        retryCount: createForm.retryCount,
        retryInterval: createForm.retryInterval
      }

      tableData.value.push(newTask)
      filteredData.value = [...tableData.value]

      // 模拟自动启动
      setTimeout(() => {
        handleStart(newTask)
      }, index * (createForm.executeMode === 'sequential' ? 1000 : 0))
    })

    addEngineLog('success', `已创建 ${createForm.taskIds.length} 个执行任务`)
    executing.value = false
    createDialogVisible.value = false
    ElMessage.success('执行任务创建成功')
  }, 500)
}

// 启动任务
const handleStart = (row: Task) => {
  row.status = 'running'
  row.progress = 0
  row.startTime = new Date().toLocaleString('zh-CN', { hour12: false })

  addEngineLog('info', `任务【${row.name}】开始执行，执行模式：${row.executeMode === 'parallel' ? '并行' : '顺序'}`)

  // 模拟进度更新
  const progressInterval = setInterval(() => {
    if (row.progress < 100 && row.status === 'running') {
      // 并行模式进度更快
      const increment = row.executeMode === 'parallel'
        ? Math.floor(Math.random() * 8) + 5
        : Math.floor(Math.random() * 5) + 3

      row.progress = Math.min(row.progress + increment, 100)

      if (row.progress >= 100) {
        row.progress = 100
        const isSuccess = Math.random() > 0.2
        row.status = isSuccess ? 'success' : 'failed'
        row.endTime = new Date().toLocaleString('zh-CN', { hour12: false })
        clearInterval(progressInterval)

        if (isSuccess) {
          addEngineLog('success', `任务【${row.name}】执行成功`)
        } else {
          addEngineLog('error', `任务【${row.name}】执行失败${row.enableResume ? '，支持断点续传' : ''}`)
        }
      }
    } else if (row.status !== 'running') {
      clearInterval(progressInterval)
    }
  }, 1500)
}

// 暂停任务
const handlePause = (row: Task) => {
  ElMessageBox.confirm(`确定要暂停任务"${row.name}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    row.status = 'paused'
    addEngineLog('warning', `任务【${row.name}】已暂停`)
    ElMessage.success('任务已暂停')
  }).catch(() => {
    console.log('取消暂停')
  })
}

// 恢复任务
const handleResume = (row: Task) => {
  row.status = 'running'

  if (row.enableResume) {
    addEngineLog('info', `任务【${row.name}】从断点恢复执行，当前进度 ${row.progress}%`)
  } else {
    addEngineLog('info', `任务【${row.name}】继续执行`)
  }

  ElMessage.success(row.enableResume ? '任务已从断点恢复' : '任务已恢复')

  // 模拟进度更新
  const progressInterval = setInterval(() => {
    if (row.progress < 100 && row.status === 'running') {
      const increment = row.executeMode === 'parallel'
        ? Math.floor(Math.random() * 8) + 5
        : Math.floor(Math.random() * 5) + 3

      row.progress = Math.min(row.progress + increment, 100)

      if (row.progress >= 100) {
        row.progress = 100
        row.status = 'success'
        row.endTime = new Date().toLocaleString('zh-CN', { hour12: false })
        clearInterval(progressInterval)
        addEngineLog('success', `任务【${row.name}】执行成功`)
      }
    } else if (row.status !== 'running') {
      clearInterval(progressInterval)
    }
  }, 1500)
}

// 查看拓扑
const handleViewTopology = (row: Task) => {
  currentTask.value = row
  topologyDialogVisible.value = true

  if (row.dependencies.length === 0) {
    addEngineLog('info', `查看任务【${row.name}】拓扑：无依赖任务`)
  } else {
    addEngineLog('info', `查看任务【${row.name}】拓扑：${row.dependencies.length} 个依赖节点`)
  }
}

// 重试节点
const handleRetryNode = (node: DependencyNode) => {
  ElMessageBox.confirm(`确定要重试节点"${node.name}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    node.status = 'running'
    addEngineLog('info', `手动触发节点【${node.name}】重试`)
    ElMessage.success('节点重试已启动')

    setTimeout(() => {
      const isSuccess = Math.random() > 0.3
      node.status = isSuccess ? 'success' : 'failed'

      if (isSuccess) {
        addEngineLog('success', `节点【${node.name}】重试成功`)
      } else {
        addEngineLog('error', `节点【${node.name}】重试失败`)
      }
    }, 3000)
  }).catch(() => {
    console.log('取消重试')
  })
}

// 重试任务
const handleRetry = (row: Task) => {
  ElMessageBox.confirm(`确定要重试任务"${row.name}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const currentRetry = row.retryCount || 0

    if (row.enableResume) {
      // 断点续传：从当前进度继续
      addEngineLog('warning', `任务【${row.name}】开始重试（第 ${currentRetry + 1} 次），从进度 ${row.progress}% 继续`)
    } else {
      // 不支持断点续传：从头开始
      row.progress = 0
      addEngineLog('warning', `任务【${row.name}】开始重试（第 ${currentRetry + 1} 次），从头开始`)
    }

    row.status = 'running'
    row.startTime = new Date().toLocaleString('zh-CN', { hour12: false })
    row.endTime = undefined

    ElMessage.success('任务已开始重试')

    // 模拟执行
    const progressInterval = setInterval(() => {
      if (row.progress < 100 && row.status === 'running') {
        const increment = Math.floor(Math.random() * 10) + 5
        row.progress = Math.min(row.progress + increment, 100)

        if (row.progress >= 100) {
          row.progress = 100
          row.status = Math.random() > 0.5 ? 'success' : 'failed'
          row.endTime = new Date().toLocaleString('zh-CN', { hour12: false })
          clearInterval(progressInterval)

          if (row.status === 'success') {
            addEngineLog('success', `任务【${row.name}】重试成功`)
            ElMessage.success('任务重试成功')
          } else {
            addEngineLog('error', `任务【${row.name}】重试失败`)
            ElMessage.error('任务重试失败')
          }
        }
      } else {
        clearInterval(progressInterval)
      }
    }, 1000)
  }).catch(() => {
    console.log('取消重试')
  })
}

// 清空日志
const handleClearLogs = () => {
  engineLogs.value = []
  addEngineLog('info', '日志已清空')
}

// 刷新
const handleRefresh = () => {
  loading.value = true
  addEngineLog('info', '手动刷新任务列表')
  setTimeout(() => {
    loading.value = false
    ElMessage.success('刷新成功')
  }, 500)
}

// 查询
const handleSearch = () => {
  let filtered = [...tableData.value]

  if (filterForm.name) {
    filtered = filtered.filter(item => item.name.includes(filterForm.name))
  }

  if (filterForm.status) {
    filtered = filtered.filter(item => item.status === filterForm.status)
  }

  filteredData.value = filtered
  pagination.currentPage = 1
  addEngineLog('info', `查询完成，共找到 ${filtered.length} 个任务`)
}

// 重置
const handleReset = () => {
  filterForm.name = ''
  filterForm.status = ''
  filteredData.value = [...tableData.value]
  pagination.currentPage = 1
}

// 分页大小变化
const handleSizeChange = (val: number) => {
  pagination.pageSize = val
}

// 当前页变化
const handleCurrentChange = (val: number) => {
  pagination.currentPage = val
}

// 自动刷新任务状态
const startAutoRefresh = () => {
  refreshTimer = window.setInterval(() => {
    // 模拟状态更新（仅针对运行中的任务）
    tableData.value.forEach(task => {
      if (task.status === 'running' && task.progress < 100) {
        const oldProgress = task.progress
        const increment = task.executeMode === 'parallel'
          ? Math.floor(Math.random() * 3) + 2
          : Math.floor(Math.random() * 2) + 1

        task.progress = Math.min(task.progress + increment, 100)

        if (task.progress >= 100) {
          task.progress = 100
          const isSuccess = Math.random() > 0.15
          task.status = isSuccess ? 'success' : 'failed'
          task.endTime = new Date().toLocaleString('zh-CN', { hour12: false })

          if (isSuccess) {
            addEngineLog('success', `任务【${task.name}】执行成功`)
          } else {
            addEngineLog('error', `任务【${task.name}】执行失败${task.enableResume ? '，支持断点续传' : ''}`)
          }
        }
      }
    })

    // 同步到过滤数据
    if (filterForm.name === '' && filterForm.status === '') {
      filteredData.value = [...tableData.value]
    }
  }, 3000)
}

// 停止自动刷新
const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// 组件挂载
onMounted(() => {
  startAutoRefresh()
  addEngineLog('info', '执行引擎已启动，自动刷新已开启')
})

// 组件卸载
onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.execute-engine-container {
  padding: 20px;
  background-color: #f5f7fa;
}

.monitor-section {
  margin-bottom: 20px;
}

.stat-card {
  cursor: pointer;
  transition: all 0.3s;
  border-radius: 8px;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  flex-shrink: 0;
}

.stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.running {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.success {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.stat-icon.failed {
  background: linear-gradient(135deg, #ee0979 0%, #ff6a00 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.main-card {
  border-radius: 8px;
}

.log-panel {
  border-radius: 8px;
  height: calc(100vh - 240px);
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.filter-section {
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.pagination-section {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.form-tip {
  margin-left: 10px;
  font-size: 12px;
  color: #909399;
}

.engine-log-container {
  flex: 1;
  overflow-y: auto;
  background-color: #1e1e1e;
  padding: 12px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  max-height: calc(100vh - 320px);
}

.engine-log-item {
  margin-bottom: 8px;
  padding: 4px 8px;
  border-radius: 3px;
  transition: background-color 0.2s;
}

.engine-log-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.log-time {
  display: inline-block;
  color: #858585;
  margin-right: 10px;
  font-size: 11px;
}

.log-content {
  display: inline;
  color: #d4d4d4;
}

.engine-log-item.info .log-content {
  color: #4fc3f7;
}

.engine-log-item.success .log-content {
  color: #67c23a;
}

.engine-log-item.warning .log-content {
  color: #ffb74d;
}

.engine-log-item.error .log-content {
  color: #e57373;
}

.empty-logs {
  text-align: center;
  color: #909399;
  padding: 40px 0;
  font-size: 14px;
}

.topology-node {
  display: flex;
  align-items: center;
  flex: 1;
  padding: 4px 0;
}

.node-name {
  font-size: 14px;
  color: #303133;
}

:deep(.el-progress__text) {
  font-size: 12px !important;
}
</style>
