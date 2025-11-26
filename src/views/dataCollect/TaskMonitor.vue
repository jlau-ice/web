<template>
  <div class="p-4 bg-white h-full">
    <div class="mb-4 flex justify-between items-center">
      <h2 class="text-xl font-bold">调度与监控</h2>
      <div>
        <el-button @click="handleAlertConfig">
          <el-icon class="mr-1"><Bell /></el-icon>
          告警配置
        </el-button>
        <el-button type="primary" @click="handleRefresh">
          <el-icon class="mr-1"><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="6">
        <el-card class="text-center">
          <div class="text-2xl font-bold text-blue-600">{{ statistics.total }}</div>
          <div class="text-gray-500 mt-2">总任务数</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="text-center">
          <div class="text-2xl font-bold text-green-600">{{ statistics.running }}</div>
          <div class="text-gray-500 mt-2">运行中</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="text-center">
          <div class="text-2xl font-bold text-orange-600">{{ statistics.failed }}</div>
          <div class="text-gray-500 mt-2">失败</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="text-center">
          <div class="text-2xl font-bold text-red-600">{{ statistics.alerts }}</div>
          <div class="text-gray-500 mt-2">告警数</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索栏 -->
    <el-card class="mb-4">
      <el-form :inline="true" :model="searchForm" class="demo-form-inline">
        <el-form-item label="任务名称">
          <el-input v-model="searchForm.name" placeholder="请输入任务名称" clearable />
        </el-form-item>
        <el-form-item label="执行状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable>
            <el-option label="运行中" value="RUNNING" />
            <el-option label="成功" value="SUCCESS" />
            <el-option label="失败" value="FAILED" />
            <el-option label="等待中" value="PENDING" />
          </el-select>
        </el-form-item>
        <el-form-item label="执行时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 任务执行列表 -->
    <el-card>
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="taskName" label="任务名称" min-width="150" />
        <el-table-column prop="status" label="执行状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="180" />
        <el-table-column prop="endTime" label="结束时间" width="180" />
        <el-table-column prop="duration" label="执行时长" width="120" />
        <el-table-column prop="progress" label="进度" width="150">
          <template #default="{ row }">
            <el-progress :percentage="row.progress" :status="getProgressStatus(row.status)" />
          </template>
        </el-table-column>
        <el-table-column prop="dataCount" label="处理数据量" width="120" />
        <el-table-column prop="retryCount" label="重试次数" width="100" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleViewLog(row)">
              <el-icon><Document /></el-icon>
              查看日志
            </el-button>
            <el-button
              v-if="row.status === 'RUNNING'"
              link
              type="danger"
              size="small"
              @click="handleStop(row)"
            >
              <el-icon><CircleClose /></el-icon>
              停止
            </el-button>
            <el-button
              v-if="row.status === 'FAILED'"
              link
              type="primary"
              size="small"
              @click="handleRetry(row)"
            >
              <el-icon><Refresh /></el-icon>
              重试
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

    <!-- 日志查看对话框 -->
    <el-dialog v-model="logDialogVisible" title="执行日志" width="1000px">
      <div class="mb-4 flex justify-between items-center">
        <div>
          <el-tag>任务: {{ currentTask?.taskName }}</el-tag>
          <el-tag class="ml-2" :type="getStatusTagType(currentTask?.status)">
            {{ getStatusLabel(currentTask?.status) }}
          </el-tag>
        </div>
        <el-button @click="handleDownloadLog">下载日志</el-button>
      </div>
      <el-scrollbar height="500px" class="border p-4 bg-gray-50">
        <pre class="text-sm font-mono">{{ logContent }}</pre>
      </el-scrollbar>
      <template #footer>
        <el-button @click="logDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleAutoScroll">
          {{ autoScroll ? '停止自动滚动' : '开启自动滚动' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 告警配置对话框 -->
    <el-dialog v-model="alertDialogVisible" title="告警配置" width="800px">
      <el-form :model="alertForm" label-width="150px">
        <el-form-item label="启用告警">
          <el-switch v-model="alertForm.enabled" />
        </el-form-item>
        <el-form-item label="失败告警">
          <el-switch v-model="alertForm.failureAlert" />
        </el-form-item>
        <el-form-item label="超时告警(分钟)">
          <el-input-number v-model="alertForm.timeoutMinutes" :min="1" :max="1440" />
        </el-form-item>
        <el-form-item label="告警渠道">
          <el-checkbox-group v-model="alertForm.channels">
            <el-checkbox label="EMAIL">邮件</el-checkbox>
            <el-checkbox label="DINGTALK">钉钉</el-checkbox>
            <el-checkbox label="WEBHOOK">Webhook</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item v-if="alertForm.channels.includes('EMAIL')" label="邮件接收人">
          <el-input
            v-model="alertForm.emailReceivers"
            placeholder="多个邮箱用逗号分隔"
          />
        </el-form-item>
        <el-form-item v-if="alertForm.channels.includes('DINGTALK')" label="钉钉Webhook">
          <el-input v-model="alertForm.dingtalkWebhook" placeholder="请输入钉钉Webhook地址" />
        </el-form-item>
        <el-form-item v-if="alertForm.channels.includes('WEBHOOK')" label="Webhook地址">
          <el-input v-model="alertForm.webhookUrl" placeholder="请输入Webhook地址" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="alertDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveAlertConfig">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Refresh,
  Bell,
  Document,
  CircleClose
} from '@element-plus/icons-vue'

interface TaskExecution {
  id: string
  taskName: string
  status: string
  startTime: string
  endTime: string
  duration: string
  progress: number
  dataCount: number
  retryCount: number
}

const loading = ref(false)
const logDialogVisible = ref(false)
const alertDialogVisible = ref(false)
const autoScroll = ref(false)
const logContent = ref('')
const currentTask = ref<TaskExecution | null>(null)
const refreshTimer = ref<NodeJS.Timeout | null>(null)

const statistics = reactive({
  total: 0,
  running: 0,
  failed: 0,
  alerts: 0
})

const searchForm = reactive({
  name: '',
  status: '',
  dateRange: null as [string, string] | null
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const tableData = ref<TaskExecution[]>([])

const alertForm = reactive({
  enabled: true,
  failureAlert: true,
  timeoutMinutes: 30,
  channels: ['EMAIL'] as string[],
  emailReceivers: '',
  dingtalkWebhook: '',
  webhookUrl: ''
})

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  const statusMap: Record<string, string> = {
    RUNNING: 'primary',
    SUCCESS: 'success',
    FAILED: 'danger',
    PENDING: 'info'
  }
  return statusMap[status] || 'info'
}

// 获取状态标签文本
const getStatusLabel = (status: string) => {
  const labelMap: Record<string, string> = {
    RUNNING: '运行中',
    SUCCESS: '成功',
    FAILED: '失败',
    PENDING: '等待中'
  }
  return labelMap[status] || status
}

// 获取进度状态
const getProgressStatus = (status: string) => {
  if (status === 'SUCCESS') return 'success'
  if (status === 'FAILED') return 'exception'
  return undefined
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
        taskName: '用户数据采集',
        status: 'RUNNING',
        startTime: '2024-01-20 10:00:00',
        endTime: '-',
        duration: '15分钟',
        progress: 65,
        dataCount: 125000,
        retryCount: 0
      },
      {
        id: '2',
        taskName: '订单数据采集',
        status: 'SUCCESS',
        startTime: '2024-01-20 09:30:00',
        endTime: '2024-01-20 09:45:00',
        duration: '15分钟',
        progress: 100,
        dataCount: 89000,
        retryCount: 0
      },
      {
        id: '3',
        taskName: '日志数据采集',
        status: 'FAILED',
        startTime: '2024-01-20 08:00:00',
        endTime: '2024-01-20 08:05:00',
        duration: '5分钟',
        progress: 30,
        dataCount: 0,
        retryCount: 2
      }
    ]
    pagination.total = tableData.value.length

    // 更新统计
    statistics.total = tableData.value.length
    statistics.running = tableData.value.filter(t => t.status === 'RUNNING').length
    statistics.failed = tableData.value.filter(t => t.status === 'FAILED').length
    statistics.alerts = statistics.failed
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadData()
}

// 重置
const handleReset = () => {
  searchForm.name = ''
  searchForm.status = ''
  searchForm.dateRange = null
  handleSearch()
}

// 查看日志
const handleViewLog = async (row: TaskExecution) => {
  currentTask.value = row
  loading.value = true
  try {
    // TODO: 调用获取日志API
    await new Promise(resolve => setTimeout(resolve, 500))
    logContent.value = `[2024-01-20 10:00:00] 任务开始执行
[2024-01-20 10:00:05] 连接数据源成功
[2024-01-20 10:00:10] 开始采集数据...
[2024-01-20 10:05:00] 已处理 50000 条数据
[2024-01-20 10:10:00] 已处理 100000 条数据
[2024-01-20 10:15:00] 已处理 125000 条数据
[2024-01-20 10:15:30] 数据采集进行中，当前进度: 65%`
    logDialogVisible.value = true
    if (autoScroll.value) {
      handleAutoScroll()
    }
  } catch (error) {
    ElMessage.error('获取日志失败')
  } finally {
    loading.value = false
  }
}

// 停止任务
const handleStop = async (row: TaskExecution) => {
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

// 重试任务
const handleRetry = async (row: TaskExecution) => {
  try {
    await ElMessageBox.confirm(`确定要重试任务"${row.taskName}"吗？`, '提示', {
      type: 'warning'
    })
    // TODO: 调用重试API
    ElMessage.success('任务已重新执行')
    loadData()
  } catch {
    // 用户取消
  }
}

// 下载日志
const handleDownloadLog = () => {
  // TODO: 实现日志下载
  ElMessage.success('日志下载功能开发中')
}

// 自动滚动
const handleAutoScroll = () => {
  autoScroll.value = !autoScroll.value
  if (autoScroll.value) {
    // TODO: 实现自动滚动逻辑
    ElMessage.info('自动滚动已开启')
  } else {
    ElMessage.info('自动滚动已关闭')
  }
}

// 告警配置
const handleAlertConfig = () => {
  // TODO: 加载告警配置
  alertDialogVisible.value = true
}

// 保存告警配置
const handleSaveAlertConfig = async () => {
  // TODO: 调用保存告警配置API
  ElMessage.success('告警配置已保存')
  alertDialogVisible.value = false
}

// 刷新
const handleRefresh = () => {
  loadData()
}

// 分页
const handleSizeChange = () => {
  loadData()
}

const handlePageChange = () => {
  loadData()
}

// 定时刷新
const startAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
  }
  refreshTimer.value = setInterval(() => {
    if (!logDialogVisible.value && !alertDialogVisible.value) {
      loadData()
    }
  }, 5000) // 每5秒刷新一次
}

onMounted(() => {
  loadData()
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
</style>