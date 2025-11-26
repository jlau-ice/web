<template>
  <div class="p-4 bg-white h-full">
    <div class="mb-4 flex justify-between items-center">
      <h2 class="text-xl font-bold">采集执行引擎</h2>
      <div>
        <el-button @click="handleEngineConfig">
          <el-icon class="mr-1"><Setting /></el-icon>
          引擎配置
        </el-button>
        <el-button type="primary" @click="handleRefresh">
          <el-icon class="mr-1"><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 引擎状态卡片 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="6">
        <el-card class="text-center">
          <div class="text-2xl font-bold" :class="engineStatus === 'RUNNING' ? 'text-green-600' : 'text-red-600'">
            {{ engineStatus === 'RUNNING' ? '运行中' : '已停止' }}
          </div>
          <div class="text-gray-500 mt-2">引擎状态</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="text-center">
          <div class="text-2xl font-bold text-blue-600">{{ engineMetrics.activeTasks }}</div>
          <div class="text-gray-500 mt-2">活跃任务数</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="text-center">
          <div class="text-2xl font-bold text-orange-600">{{ engineMetrics.totalProcessed }}</div>
          <div class="text-gray-500 mt-2">今日处理数据量</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="text-center">
          <div class="text-2xl font-bold text-purple-600">{{ engineMetrics.throughput }}/s</div>
          <div class="text-gray-500 mt-2">处理吞吐量</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 任务执行列表 -->
    <el-card class="mb-4">
      <template #header>
        <div class="flex justify-between items-center">
          <span>当前执行任务</span>
          <el-button link type="primary" @click="handleBatchExecute">批量执行</el-button>
        </div>
      </template>
      <el-table :data="executingTasks" v-loading="loading" stripe>
        <el-table-column type="selection" width="55" />
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="taskName" label="任务名称" min-width="150" />
        <el-table-column prop="dataSource" label="数据源" min-width="120" />
        <el-table-column prop="progress" label="进度" width="150">
          <template #default="{ row }">
            <el-progress :percentage="row.progress" />
          </template>
        </el-table-column>
        <el-table-column prop="dataCount" label="已处理数据" width="120" />
        <el-table-column prop="startTime" label="开始时间" width="180" />
        <el-table-column prop="estimatedTime" label="预计剩余时间" width="120" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleViewDetail(row)">
              <el-icon><View /></el-icon>
              详情
            </el-button>
            <el-button link type="danger" size="small" @click="handleStopTask(row)">
              <el-icon><CircleClose /></el-icon>
              停止
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 任务依赖关系 -->
    <el-card>
      <template #header>
        <div class="flex justify-between items-center">
          <span>任务依赖关系</span>
          <el-button link type="primary" @click="handleManageDependency">管理依赖</el-button>
        </div>
      </template>
      <div class="mb-4">
        <el-input
          v-model="dependencySearch"
          placeholder="搜索任务名称"
          clearable
          style="width: 300px"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      <div class="dependency-graph" style="min-height: 400px; border: 1px solid #e0e0e0; border-radius: 4px; padding: 20px;">
        <!-- 这里可以使用图形库如 D3.js 或 ECharts 来绘制依赖关系图 -->
        <div class="text-center text-gray-400 py-20">
          <el-icon class="text-4xl mb-4"><Share /></el-icon>
          <div>任务依赖关系图</div>
          <div class="text-sm mt-2">点击"管理依赖"按钮配置任务依赖关系</div>
        </div>
      </div>
    </el-card>

    <!-- 引擎配置对话框 -->
    <el-dialog v-model="configDialogVisible" title="引擎配置" width="700px">
      <el-form :model="engineConfig" label-width="150px">
        <el-form-item label="最大并发任务数">
          <el-input-number v-model="engineConfig.maxConcurrentTasks" :min="1" :max="100" />
        </el-form-item>
        <el-form-item label="任务队列大小">
          <el-input-number v-model="engineConfig.queueSize" :min="10" :max="1000" />
        </el-form-item>
        <el-form-item label="默认批次大小">
          <el-input-number v-model="engineConfig.defaultBatchSize" :min="100" :max="100000" />
        </el-form-item>
        <el-form-item label="默认超时时间(秒)">
          <el-input-number v-model="engineConfig.defaultTimeout" :min="60" :max="3600" />
        </el-form-item>
        <el-form-item label="启用断点续传">
          <el-switch v-model="engineConfig.enableResume" />
        </el-form-item>
        <el-form-item label="启用任务依赖">
          <el-switch v-model="engineConfig.enableDependency" />
        </el-form-item>
        <el-form-item label="失败重试次数">
          <el-input-number v-model="engineConfig.retryCount" :min="0" :max="10" />
        </el-form-item>
        <el-form-item label="重试间隔(秒)">
          <el-input-number v-model="engineConfig.retryInterval" :min="1" :max="300" />
        </el-form-item>
        <el-form-item label="监控日志级别">
          <el-select v-model="engineConfig.logLevel">
            <el-option label="DEBUG" value="DEBUG" />
            <el-option label="INFO" value="INFO" />
            <el-option label="WARN" value="WARN" />
            <el-option label="ERROR" value="ERROR" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="configDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveConfig">保存</el-button>
      </template>
    </el-dialog>

    <!-- 任务详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="任务执行详情" width="900px">
      <el-descriptions :column="2" border v-if="currentTask">
        <el-descriptions-item label="任务名称">{{ currentTask.taskName }}</el-descriptions-item>
        <el-descriptions-item label="数据源">{{ currentTask.dataSource }}</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ currentTask.startTime }}</el-descriptions-item>
        <el-descriptions-item label="已执行时长">{{ currentTask.duration }}</el-descriptions-item>
        <el-descriptions-item label="进度">{{ currentTask.progress }}%</el-descriptions-item>
        <el-descriptions-item label="已处理数据">{{ currentTask.dataCount }}</el-descriptions-item>
        <el-descriptions-item label="处理速度">{{ currentTask.speed }}/s</el-descriptions-item>
        <el-descriptions-item label="预计剩余时间">{{ currentTask.estimatedTime }}</el-descriptions-item>
      </el-descriptions>
      <el-divider />
      <div>
        <h4 class="mb-2">实时日志</h4>
        <el-scrollbar height="300px" class="border p-4 bg-gray-50">
          <pre class="text-sm font-mono">{{ taskLog }}</pre>
        </el-scrollbar>
      </div>
    </el-dialog>

    <!-- 依赖管理对话框 -->
    <el-dialog v-model="dependencyDialogVisible" title="任务依赖管理" width="800px">
      <el-form :model="dependencyForm" label-width="120px">
        <el-form-item label="任务">
          <el-select v-model="dependencyForm.taskId" placeholder="请选择任务" filterable>
            <el-option
              v-for="task in allTasks"
              :key="task.id"
              :label="task.name"
              :value="task.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="依赖任务">
          <el-select
            v-model="dependencyForm.dependentTaskIds"
            multiple
            placeholder="请选择依赖的任务"
            filterable
          >
            <el-option
              v-for="task in allTasks"
              :key="task.id"
              :label="task.name"
              :value="task.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="依赖类型">
          <el-radio-group v-model="dependencyForm.dependencyType">
            <el-radio label="STRONG">强依赖（必须全部成功）</el-radio>
            <el-radio label="WEAK">弱依赖（任意一个成功即可）</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dependencyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveDependency">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Refresh,
  Setting,
  View,
  CircleClose,
  Search,
  Share
} from '@element-plus/icons-vue'

interface ExecutingTask {
  id: string
  taskName: string
  dataSource: string
  progress: number
  dataCount: number
  startTime: string
  estimatedTime: string
  speed?: number
  duration?: string
}

interface Task {
  id: string
  name: string
}

const loading = ref(false)
const engineStatus = ref('RUNNING')
const configDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const dependencyDialogVisible = ref(false)
const dependencySearch = ref('')
const currentTask = ref<ExecutingTask | null>(null)
const taskLog = ref('')
const refreshTimer = ref<NodeJS.Timeout | null>(null)

const engineMetrics = reactive({
  activeTasks: 0,
  totalProcessed: 0,
  throughput: 0
})

const executingTasks = ref<ExecutingTask[]>([])
const allTasks = ref<Task[]>([])

const engineConfig = reactive({
  maxConcurrentTasks: 10,
  queueSize: 100,
  defaultBatchSize: 1000,
  defaultTimeout: 300,
  enableResume: true,
  enableDependency: true,
  retryCount: 3,
  retryInterval: 60,
  logLevel: 'INFO'
})

const dependencyForm = reactive({
  taskId: '',
  dependentTaskIds: [] as string[],
  dependencyType: 'STRONG'
})

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    // TODO: 调用实际API
    await new Promise(resolve => setTimeout(resolve, 500))
    executingTasks.value = [
      {
        id: '1',
        taskName: '用户数据采集',
        dataSource: '生产MySQL数据库',
        progress: 65,
        dataCount: 125000,
        startTime: '2024-01-20 10:00:00',
        estimatedTime: '8分钟',
        speed: 138,
        duration: '15分钟'
      },
      {
        id: '2',
        taskName: '订单数据采集',
        dataSource: '生产MySQL数据库',
        progress: 30,
        dataCount: 45000,
        startTime: '2024-01-20 10:05:00',
        estimatedTime: '20分钟',
        speed: 50,
        duration: '15分钟'
      }
    ]
    engineMetrics.activeTasks = executingTasks.value.length
    engineMetrics.totalProcessed = 1250000
    engineMetrics.throughput = 188
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 加载所有任务
const loadAllTasks = async () => {
  // TODO: 调用实际API
  allTasks.value = [
    { id: '1', name: '用户数据采集' },
    { id: '2', name: '订单数据采集' },
    { id: '3', name: '日志数据采集' },
    { id: '4', name: '商品数据采集' }
  ]
}

// 引擎配置
const handleEngineConfig = () => {
  // TODO: 加载引擎配置
  configDialogVisible.value = true
}

// 保存配置
const handleSaveConfig = async () => {
  // TODO: 调用保存配置API
  ElMessage.success('引擎配置已保存')
  configDialogVisible.value = false
}

// 查看详情
const handleViewDetail = async (row: ExecutingTask) => {
  currentTask.value = row
  // TODO: 加载任务日志
  taskLog.value = `[2024-01-20 10:00:00] 任务开始执行
[2024-01-20 10:00:05] 连接数据源成功
[2024-01-20 10:00:10] 开始采集数据...
[2024-01-20 10:05:00] 已处理 50000 条数据
[2024-01-20 10:10:00] 已处理 100000 条数据
[2024-01-20 10:15:00] 已处理 125000 条数据
[2024-01-20 10:15:30] 数据采集进行中，当前进度: 65%`
  detailDialogVisible.value = true
}

// 停止任务
const handleStopTask = async (row: ExecutingTask) => {
  try {
    await ElMessageBox.confirm(`确定要停止任务"${row.taskName}"吗？`, '提示', {
      type: 'warning'
    })
    // TODO: 调用停止API
    ElMessage.success('任务已停止')
    loadData()
  } catch {
    // 用户取消
  }
}

// 批量执行
const handleBatchExecute = () => {
  ElMessage.info('批量执行功能开发中')
}

// 管理依赖
const handleManageDependency = () => {
  loadAllTasks()
  dependencyDialogVisible.value = true
}

// 保存依赖
const handleSaveDependency = async () => {
  if (!dependencyForm.taskId) {
    ElMessage.warning('请选择任务')
    return
  }
  // TODO: 调用保存依赖API
  ElMessage.success('依赖关系已保存')
  dependencyDialogVisible.value = false
}

// 刷新
const handleRefresh = () => {
  loadData()
}

// 定时刷新
const startAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
  }
  refreshTimer.value = setInterval(() => {
    if (!configDialogVisible.value && !detailDialogVisible.value && !dependencyDialogVisible.value) {
      loadData()
    }
  }, 3000) // 每3秒刷新一次
}

onMounted(() => {
  loadData()
  loadAllTasks()
  startAutoRefresh()
})

onUnmounted(() => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
  }
})
</script>

<style scoped lang="scss">
:deep(.el-card__body) {
  padding: 16px;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}

.dependency-graph {
  background: #fafafa;
}
</style>