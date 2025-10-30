<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, View } from '@element-plus/icons-vue'

// 流程节点状态类型
type ProcessStatus = 'running' | 'waiting' | 'error' | 'completed'

// 资源状态类型
type ResourceStatus = 'normal' | 'warning' | 'busy' | 'danger'

// 流程节点接口
interface ProcessNode {
  id: number
  name: string
  status: ProcessStatus
  progress: number
  duration: string
}

// 任务接口
interface Task {
  id: number
  name: string
  status: string
  progress: number
  startTime: string
  eta: string
}

// 资源监控接口
interface ResourceMetric {
  name: string
  usage: number
  status: ResourceStatus
  total: string
  used: string
}

// 关键指标数据
const keyMetrics = ref({
  throughput: 0,
  successRate: 0,
  avgLatency: 0,
  activeTask: 0
})

// 流程节点数据
const processNodes = ref<ProcessNode[]>([])

// 任务列表
const taskList = ref<Task[]>([])

// 资源监控数据
const resourceMetrics = ref<ResourceMetric[]>([])

// 自动刷新定时器
let refreshTimer: number | null = null

// 获取流程状态样式
const getProcessStatusType = (status: ProcessStatus) => {
  const typeMap = {
    running: 'success',
    waiting: 'info',
    error: 'danger',
    completed: 'primary'
  }
  return typeMap[status]
}

// 获取流程状态文本
const getProcessStatusText = (status: ProcessStatus) => {
  const textMap = {
    running: '运行中',
    waiting: '等待',
    error: '异常',
    completed: '完成'
  }
  return textMap[status]
}

// 获取资源状态样式
const getResourceStatusType = (status: ResourceStatus) => {
  const typeMap = {
    normal: 'success',
    warning: 'warning',
    busy: '',
    danger: 'danger'
  }
  return typeMap[status]
}

// Mock 加载关键指标
const loadKeyMetrics = () => {
  setTimeout(() => {
    keyMetrics.value = {
      throughput: Math.floor(Math.random() * 5000) + 10000,
      successRate: Math.floor(Math.random() * 5) + 95,
      avgLatency: Math.floor(Math.random() * 100) + 50,
      activeTask: Math.floor(Math.random() * 20) + 10
    }
  }, 300)
}

// Mock 加载流程节点
const loadProcessNodes = () => {
  setTimeout(() => {
    const statuses: ProcessStatus[] = ['running', 'completed', 'running', 'waiting', 'completed']
    processNodes.value = [
      { id: 1, name: '数据抽取', status: statuses[0], progress: 100, duration: '2.3s' },
      { id: 2, name: '数据清洗', status: statuses[1], progress: 100, duration: '5.1s' },
      { id: 3, name: '数据转换', status: statuses[2], progress: 78, duration: '3.8s' },
      { id: 4, name: '数据加载', status: statuses[3], progress: 0, duration: '-' },
      { id: 5, name: '数据验证', status: statuses[4], progress: 0, duration: '-' }
    ]
  }, 400)
}

// Mock 加载任务列表
const loadTaskList = () => {
  setTimeout(() => {
    taskList.value = [
      { id: 1001, name: '园区设备数据分析', status: '执行中', progress: 85, startTime: '2025-10-30 09:15:23', eta: '2分钟' },
      { id: 1002, name: '能耗统计报表生成', status: '执行中', progress: 62, startTime: '2025-10-30 09:18:45', eta: '5分钟' },
      { id: 1003, name: '异常日志聚合分析', status: '排队中', progress: 0, startTime: '-', eta: '等待中' },
      { id: 1004, name: '实时流量监控', status: '执行中', progress: 95, startTime: '2025-10-30 09:10:12', eta: '1分钟' },
      { id: 1005, name: '数据质量检查', status: '已完成', progress: 100, startTime: '2025-10-30 09:05:30', eta: '-' }
    ]
  }, 500)
}

// Mock 加载资源监控
const loadResourceMetrics = () => {
  setTimeout(() => {
    const statuses: ResourceStatus[] = ['normal', 'warning', 'busy', 'normal']
    resourceMetrics.value = [
      { name: 'CPU使用率', usage: Math.floor(Math.random() * 30) + 40, status: statuses[0], total: '32核', used: '18核' },
      { name: '内存使用率', usage: Math.floor(Math.random() * 20) + 65, status: statuses[1], total: '128GB', used: '89GB' },
      { name: '磁盘使用率', usage: Math.floor(Math.random() * 15) + 75, status: statuses[2], total: '2TB', used: '1.5TB' },
      { name: '网络带宽', usage: Math.floor(Math.random() * 25) + 35, status: statuses[3], total: '10Gbps', used: '4.2Gbps' }
    ]
  }, 600)
}

// 加载所有数据
const loadAllData = () => {
  loadKeyMetrics()
  loadProcessNodes()
  loadTaskList()
  loadResourceMetrics()
}

// 手动刷新
const handleRefresh = () => {
  ElMessage.success('刷新数据成功')
  loadAllData()
}

// 查看节点详情
const viewNodeDetail = (node: ProcessNode) => {
  ElMessage.info(`查看节点：${node.name} - 状态：${getProcessStatusText(node.status)}`)
}

// 启动自动刷新
const startAutoRefresh = () => {
  refreshTimer = window.setInterval(() => {
    loadKeyMetrics()
    loadResourceMetrics()
  }, 5000)
}

onMounted(() => {
  loadAllData()
  startAutoRefresh()
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<template>
  <div class="visual-monitor">
    <!-- 操作栏 -->
    <div class="toolbar">
      <el-button type="primary" :icon="Refresh" @click="handleRefresh">刷新数据</el-button>
      <span class="auto-refresh-tip">自动刷新: 每5秒</span>
    </div>

    <!-- 关键指标概览 -->
    <el-row :gutter="16" class="metrics-row">
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="数据吞吐量" :value="keyMetrics.throughput" suffix="条/秒">
            <template #prefix>
              <span class="statistic-icon">📊</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="处理成功率" :value="keyMetrics.successRate" suffix="%">
            <template #prefix>
              <span class="statistic-icon">✅</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="平均延迟" :value="keyMetrics.avgLatency" suffix="ms">
            <template #prefix>
              <span class="statistic-icon">⚡</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="活跃任务数" :value="keyMetrics.activeTask" suffix="个">
            <template #prefix>
              <span class="statistic-icon">🚀</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- 流程拓扑视图 -->
    <el-card class="process-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">数据处理全流程监控</span>
          <el-tag type="success" effect="dark">实时</el-tag>
        </div>
      </template>
      <div class="process-flow">
        <div
          v-for="(node, index) in processNodes"
          :key="node.id"
          class="process-node-wrapper"
        >
          <div
            class="process-node"
            :class="`status-${node.status}`"
            @click="viewNodeDetail(node)"
          >
            <div class="node-header">
              <span class="node-name">{{ node.name }}</span>
              <el-tag :type="getProcessStatusType(node.status)" size="small">
                {{ getProcessStatusText(node.status) }}
              </el-tag>
            </div>
            <el-progress
              :percentage="node.progress"
              :status="node.status === 'error' ? 'exception' : undefined"
              :stroke-width="8"
            />
            <div class="node-footer">
              <span class="node-duration">耗时: {{ node.duration }}</span>
              <el-button
                :icon="View"
                size="small"
                link
                @click.stop="viewNodeDetail(node)"
              >
                详情
              </el-button>
            </div>
          </div>
          <div v-if="index < processNodes.length - 1" class="process-arrow">→</div>
        </div>
      </div>
    </el-card>

    <!-- 资源运行监控 -->
    <el-row :gutter="16" class="resource-row">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span class="card-title">资源使用情况</span>
          </template>
          <div class="resource-list">
            <div v-for="metric in resourceMetrics" :key="metric.name" class="resource-item">
              <div class="resource-header">
                <span class="resource-name">{{ metric.name }}</span>
                <el-tag :type="getResourceStatusType(metric.status)" size="small">
                  {{ metric.usage }}%
                </el-tag>
              </div>
              <el-progress
                :percentage="metric.usage"
                :color="
                  metric.usage >= 80
                    ? '#F56C6C'
                    : metric.usage >= 60
                    ? '#E6A23C'
                    : '#67C23A'
                "
              />
              <div class="resource-detail">
                <span>已用: {{ metric.used }}</span>
                <span>总量: {{ metric.total }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span class="card-title">任务进度跟踪</span>
          </template>
          <el-table :data="taskList" height="320" style="width: 100%">
            <el-table-column prop="id" label="任务ID" width="80" />
            <el-table-column prop="name" label="任务名称" min-width="150" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag
                  :type="
                    row.status === '执行中'
                      ? 'success'
                      : row.status === '已完成'
                      ? 'primary'
                      : 'info'
                  "
                  size="small"
                >
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="progress" label="进度" width="120">
              <template #default="{ row }">
                <el-progress :percentage="row.progress" :stroke-width="6" />
              </template>
            </el-table-column>
            <el-table-column prop="eta" label="预计完成" width="100" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.visual-monitor {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  .auto-refresh-tip {
    color: #909399;
    font-size: 14px;
  }
}

.metrics-row {
  margin-bottom: 20px;
}

.statistic-icon {
  font-size: 24px;
  margin-right: 8px;
}

.process-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.process-flow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0;
  overflow-x: auto;
}

.process-node-wrapper {
  display: flex;
  align-items: center;
  flex: 1;
}

.process-node {
  flex: 1;
  padding: 16px;
  background: #ffffff;
  border: 2px solid #dcdfe6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 180px;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &.status-running {
    border-color: #67c23a;
    background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
  }

  &.status-completed {
    border-color: #409eff;
    background: linear-gradient(135deg, #ffffff 0%, #ecf5ff 100%);
  }

  &.status-error {
    border-color: #f56c6c;
    background: linear-gradient(135deg, #ffffff 0%, #fef0f0 100%);
  }

  &.status-waiting {
    border-color: #909399;
    background: linear-gradient(135deg, #ffffff 0%, #f4f4f5 100%);
  }
}

.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.node-name {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.node-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.node-duration {
  font-size: 12px;
  color: #909399;
}

.process-arrow {
  font-size: 24px;
  color: #409eff;
  font-weight: bold;
  margin: 0 10px;
  flex-shrink: 0;
}

.resource-row {
  margin-bottom: 20px;
}

.resource-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.resource-item {
  padding: 12px;
  background: #f9fafc;
  border-radius: 6px;
}

.resource-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.resource-name {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.resource-detail {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

:deep(.el-card) {
  border-radius: 8px;
}

:deep(.el-card__header) {
  padding: 16px 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
}

:deep(.el-statistic__head) {
  color: #606266;
  font-size: 14px;
  margin-bottom: 8px;
}

:deep(.el-statistic__content) {
  font-size: 28px;
  font-weight: 600;
}
</style>