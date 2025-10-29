<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Monitor,
  CircleCheck,
  Warning,
  Refresh,
  VideoPlay,
  VideoPause,
  Connection,
  Setting,
  Document,
  TrendCharts,
  DataAnalysis
} from '@element-plus/icons-vue'

// 节点类型定义
interface NodeData {
  id: string
  name: string
  type: '共识节点' | '验证节点' | '观察节点' | '存储节点'
  ip: string
  port: number
  blockHeight: number
  status: '在线' | '离线' | '同步中' | '异常'
  syncStatus: number
  cpu: number
  memory: number
  disk: number
  network: number
  healthScore: number
  version: string
  connections: number
  blockTime: number
  txSpeed: number
  uptime: number
  lastBlockTime: string
}

interface Alert {
  id: string
  nodeId: string
  nodeName: string
  level: '严重' | '警告' | '信息'
  type: string
  message: string
  suggestion: string
  time: string
  handled: boolean
}

interface LogEntry {
  time: string
  level: 'info' | 'warn' | 'error'
  message: string
}

// 筛选条件
const searchText = ref('')
const filterType = ref('')
const filterStatus = ref('')

// 节点列表数据
const nodeList = ref<NodeData[]>([])
const loading = ref(false)

// 选中的节点
const selectedNode = ref<NodeData | null>(null)

// 预警列表
const alertList = ref<Alert[]>([])

// 节点日志
const nodeLogs = ref<LogEntry[]>([])

// 预警规则配置
const alertRuleVisible = ref(false)
const alertRules = reactive({
  cpuThreshold: 80,
  memoryThreshold: 85,
  diskThreshold: 90,
  networkThreshold: 80,
  blockHeightDiff: 100,
  healthScoreThreshold: 60
})

// 定时器
let refreshTimer: number | null = null

// 筛选后的节点列表
const filteredNodeList = computed(() => {
  return nodeList.value.filter(node => {
    const matchSearch = !searchText.value || 
      node.name.toLowerCase().includes(searchText.value.toLowerCase()) ||
      node.ip.includes(searchText.value)
    const matchType = !filterType.value || node.type === filterType.value
    const matchStatus = !filterStatus.value || node.status === filterStatus.value
    return matchSearch && matchType && matchStatus
  })
})

// 节点类型统计
const nodeTypeStats = computed(() => {
  const stats = {
    total: nodeList.value.length,
    online: nodeList.value.filter(n => n.status === '在线').length,
    offline: nodeList.value.filter(n => n.status === '离线').length,
    syncing: nodeList.value.filter(n => n.status === '同步中').length,
    abnormal: nodeList.value.filter(n => n.status === '异常').length
  }
  return stats
})

// 未处理的预警数量
const unhandledAlertCount = computed(() => {
  return alertList.value.filter(a => !a.handled).length
})

// 获取状态标签类型
const getStatusType = (status: string) => {
  const types: Record<string, 'success' | 'danger' | 'primary' | 'warning'> = {
    '在线': 'success',
    '离线': 'danger',
    '同步中': 'primary',
    '异常': 'warning'
  }
  return types[status] || 'info'
}

// 获取健康度类型
const getHealthType = (score: number) => {
  if (score >= 90) return 'success'
  if (score >= 75) return 'primary'
  if (score >= 60) return 'warning'
  return 'danger'
}

// 获取健康度文本
const getHealthText = (score: number) => {
  if (score >= 90) return '优秀'
  if (score >= 75) return '良好'
  if (score >= 60) return '一般'
  return '差'
}

// 获取预警级别类型
const getAlertLevelType = (level: string) => {
  const types: Record<string, 'error' | 'warning' | 'info'> = {
    '严重': 'error',
    '警告': 'warning',
    '信息': 'info'
  }
  return types[level] || 'info'
}

// Mock 数据生成
const generateMockNodes = (): NodeData[] => {
  const types: Array<'共识节点' | '验证节点' | '观察节点' | '存储节点'> = ['共识节点', '验证节点', '观察节点', '存储节点']
  const statuses: Array<'在线' | '离线' | '同步中' | '异常'> = ['在线', '离线', '同步中', '异常']
  const nodes: NodeData[] = []
  
  for (let i = 1; i <= 15; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const isOnline = status === '在线' || status === '同步中'
    
    nodes.push({
      id: `node-${i}`,
      name: `节点-${i.toString().padStart(2, '0')}`,
      type: types[Math.floor(Math.random() * types.length)],
      ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      port: 8000 + i,
      blockHeight: isOnline ? 1000000 + Math.floor(Math.random() * 1000) : 0,
      status: status,
      syncStatus: status === '同步中' ? Math.floor(Math.random() * 40) + 60 : (isOnline ? 100 : 0),
      cpu: isOnline ? Math.floor(Math.random() * 100) : 0,
      memory: isOnline ? Math.floor(Math.random() * 100) : 0,
      disk: isOnline ? Math.floor(Math.random() * 100) : 0,
      network: isOnline ? Math.floor(Math.random() * 100) : 0,
      healthScore: isOnline ? Math.floor(Math.random() * 40) + 60 : 0,
      version: `v1.${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 10)}`,
      connections: isOnline ? Math.floor(Math.random() * 50) + 10 : 0,
      blockTime: isOnline ? Math.random() * 3 + 1 : 0,
      txSpeed: isOnline ? Math.floor(Math.random() * 5000) + 1000 : 0,
      uptime: isOnline ? Math.floor(Math.random() * 30) + 1 : 0,
      lastBlockTime: new Date(Date.now() - Math.random() * 60000).toLocaleString()
    })
  }
  
  return nodes
}

// 生成预警数据
const generateMockAlerts = (): Alert[] => {
  const alerts: Alert[] = []
  const alertTypes = [
    { type: 'CPU使用率过高', message: 'CPU使用率达到95%', suggestion: '建议检查进程占用，必要时扩容资源' },
    { type: '内存不足', message: '可用内存低于10%', suggestion: '建议清理缓存或增加内存' },
    { type: '磁盘空间不足', message: '磁盘使用率超过90%', suggestion: '建议清理历史数据或扩容磁盘' },
    { type: '区块高度落后', message: '区块高度落后超过100个块', suggestion: '检查网络连接和同步状态' },
    { type: '节点离线', message: '节点连接失败', suggestion: '检查节点服务是否正常运行' }
  ]
  
  nodeList.value.forEach((node, index) => {
    if (node.status === '异常' || node.cpu > 80 || node.memory > 85 || Math.random() > 0.7) {
      const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)]
      const level = node.status === '离线' ? '严重' : (node.status === '异常' || node.cpu > 90 ? '警告' : '信息')
      
      alerts.push({
        id: `alert-${index}`,
        nodeId: node.id,
        nodeName: node.name,
        level: level as '严重' | '警告' | '信息',
        type: alertType.type,
        message: alertType.message,
        suggestion: alertType.suggestion,
        time: new Date(Date.now() - Math.random() * 3600000).toLocaleString(),
        handled: Math.random() > 0.5
      })
    }
  })
  
  return alerts.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
}

// 生成节点日志
const generateNodeLogs = (): LogEntry[] => {
  const logs: LogEntry[] = []
  const messages = [
    { level: 'info', message: '节点启动成功' },
    { level: 'info', message: '开始同步区块数据' },
    { level: 'info', message: '已连接到对等节点' },
    { level: 'warn', message: 'CPU使用率较高，当前85%' },
    { level: 'info', message: '区块验证完成' },
    { level: 'error', message: '交易验证失败' },
    { level: 'info', message: '新区块已生成' },
    { level: 'warn', message: '内存使用率达到80%' }
  ]
  
  for (let i = 0; i < 20; i++) {
    const msg = messages[Math.floor(Math.random() * messages.length)]
    logs.push({
      time: new Date(Date.now() - i * 30000).toLocaleString(),
      level: msg.level as 'info' | 'warn' | 'error',
      message: msg.message
    })
  }
  
  return logs
}

// 加载数据
const loadData = async () => {
  loading.value = true
  
  // 模拟异步加载
  setTimeout(() => {
    nodeList.value = generateMockNodes()
    alertList.value = generateMockAlerts()
    loading.value = false
    
    // 默认选中第一个节点
    if (nodeList.value.length > 0 && !selectedNode.value) {
      handleNodeClick(nodeList.value[0])
    }
  }, 800)
}

// 刷新数据
const refreshData = () => {
  loadData()
  ElMessage.success('数据已刷新')
}

// 自动刷新数据
const startAutoRefresh = () => {
  refreshTimer = window.setInterval(() => {
    // 更新节点状态
    nodeList.value.forEach(node => {
      if (node.status === '在线' || node.status === '同步中') {
        node.cpu = Math.max(0, Math.min(100, node.cpu + (Math.random() - 0.5) * 10))
        node.memory = Math.max(0, Math.min(100, node.memory + (Math.random() - 0.5) * 10))
        node.network = Math.max(0, Math.min(100, node.network + (Math.random() - 0.5) * 20))
        node.blockHeight += Math.floor(Math.random() * 3)
        node.healthScore = Math.floor((100 - node.cpu * 0.3 - node.memory * 0.3 - node.disk * 0.2 - (100 - node.network) * 0.2))
      }
    })
    
    // 检查是否需要新增预警
    checkAndGenerateAlerts()
  }, 3000)
}

// 检查并生成预警
const checkAndGenerateAlerts = () => {
  nodeList.value.forEach(node => {
    if (node.cpu > alertRules.cpuThreshold && Math.random() > 0.9) {
      const alert: Alert = {
        id: `alert-${Date.now()}-${Math.random()}`,
        nodeId: node.id,
        nodeName: node.name,
        level: '警告',
        type: 'CPU使用率过高',
        message: `CPU使用率达到${node.cpu.toFixed(0)}%`,
        suggestion: '建议检查进程占用，必要时扩容资源',
        time: new Date().toLocaleString(),
        handled: false
      }
      alertList.value.unshift(alert)
    }
  })
}

// 点击节点行
const handleNodeClick = (node: NodeData) => {
  selectedNode.value = node
  nodeLogs.value = generateNodeLogs()
}

// 节点操作
const handleNodeAction = async (action: string, node: NodeData) => {
  try {
    await ElMessageBox.confirm(
      `确定要${action}节点 ${node.name} 吗？`,
      '操作确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    // 模拟操作
    loading.value = true
    setTimeout(() => {
      if (action === '启动' || action === '重启') {
        node.status = '在线'
        node.healthScore = 85
      } else if (action === '停止') {
        node.status = '离线'
        node.healthScore = 0
      }
      loading.value = false
      ElMessage.success(`${action}成功`)
    }, 1000)
  } catch {
    // 用户取消
  }
}

// 处理预警
const handleAlert = (alert: Alert) => {
  alert.handled = true
  ElMessage.success('预警已处理')
}

// 查看预警详情
const viewAlertDetail = (alert: Alert) => {
  ElMessageBox.alert(
    `<div style="line-height: 1.8;">
      <p><strong>节点:</strong> ${alert.nodeName}</p>
      <p><strong>类型:</strong> ${alert.type}</p>
      <p><strong>消息:</strong> ${alert.message}</p>
      <p><strong>建议:</strong> ${alert.suggestion}</p>
      <p><strong>时间:</strong> ${alert.time}</p>
    </div>`,
    '预警详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '关闭'
    }
  )
}

// 保存预警规则
const saveAlertRules = () => {
  ElMessage.success('预警规则已保存')
  alertRuleVisible.value = false
}

// 格式化运行时间
const formatUptime = (days: number) => {
  return `${days}天`
}

// 格式化出块时间
const formatBlockTime = (time: number) => {
  return `${time.toFixed(2)}s`
}

// 格式化交易速度
const formatTxSpeed = (speed: number) => {
  return `${speed} TPS`
}

// 获取同步状态文本
const getSyncStatusText = (status: number) => {
  if (status === 100) return '已同步'
  if (status === 0) return '未同步'
  return `${status}%`
}

// 组件挂载
onMounted(() => {
  loadData()
  startAutoRefresh()
})

// 组件卸载
onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<template>
  <div class="node-monitor-container">
    <!-- 顶部统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stats-card">
          <el-statistic title="节点总数" :value="nodeTypeStats.total">
            <template #prefix>
              <el-icon color="#409EFF"><Monitor /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stats-card">
          <el-statistic title="在线节点" :value="nodeTypeStats.online">
            <template #prefix>
              <el-icon color="#67C23A"><CircleCheck /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stats-card">
          <el-statistic title="离线节点" :value="nodeTypeStats.offline">
            <template #prefix>
              <el-icon color="#F56C6C"><Warning /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stats-card">
          <el-statistic title="未处理预警" :value="unhandledAlertCount">
            <template #prefix>
              <el-icon color="#E6A23C"><Warning /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- 主要内容区域 -->
    <el-row :gutter="16" class="main-content">
      <!-- 左侧：节点列表 -->
      <el-col :span="14">
        <el-card shadow="never" class="list-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">节点列表</span>
              <el-button
                type="primary"
                :icon="Refresh"
                @click="refreshData"
                :loading="loading"
              >
                刷新
              </el-button>
            </div>
          </template>

          <!-- 筛选条件 -->
          <div class="filter-bar">
            <el-input
              v-model="searchText"
              placeholder="搜索节点名称或IP"
              clearable
              style="width: 240px; margin-right: 12px;"
            />
            <el-select
              v-model="filterType"
              placeholder="节点类型"
              clearable
              style="width: 150px; margin-right: 12px;"
            >
              <el-option label="共识节点" value="共识节点" />
              <el-option label="验证节点" value="验证节点" />
              <el-option label="观察节点" value="观察节点" />
              <el-option label="存储节点" value="存储节点" />
            </el-select>
            <el-select
              v-model="filterStatus"
              placeholder="节点状态"
              clearable
              style="width: 130px;"
            >
              <el-option label="在线" value="在线" />
              <el-option label="离线" value="离线" />
              <el-option label="同步中" value="同步中" />
              <el-option label="异常" value="异常" />
            </el-select>
          </div>

          <!-- 节点表格 -->
          <el-table
            :data="filteredNodeList"
            v-loading="loading"
            stripe
            highlight-current-row
            @row-click="handleNodeClick"
            style="width: 100%; margin-top: 16px;"
            :row-class-name="({row}) => row.id === selectedNode?.id ? 'selected-row' : ''"
          >
            <el-table-column prop="name" label="节点名称" width="120" />
            <el-table-column prop="type" label="节点类型" width="100" />
            <el-table-column label="IP地址" width="140">
              <template #default="{ row }">
                {{ row.ip }}:{{ row.port }}
              </template>
            </el-table-column>
            <el-table-column prop="blockHeight" label="区块高度" width="100">
              <template #default="{ row }">
                {{ row.blockHeight.toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="同步状态" width="120">
              <template #default="{ row }">
                <el-progress
                  :percentage="row.syncStatus"
                  :status="row.syncStatus === 100 ? 'success' : undefined"
                  :stroke-width="8"
                />
              </template>
            </el-table-column>
            <el-table-column label="健康度" width="100">
              <template #default="{ row }">
                <el-tag :type="getHealthType(row.healthScore)" size="small">
                  {{ row.healthScore }} - {{ getHealthText(row.healthScore) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="row.status === '离线'"
                  type="success"
                  size="small"
                  :icon="VideoPlay"
                  @click.stop="handleNodeAction('启动', row)"
                >
                  启动
                </el-button>
                <el-button
                  v-else
                  type="warning"
                  size="small"
                  :icon="VideoPause"
                  @click.stop="handleNodeAction('停止', row)"
                >
                  停止
                </el-button>
                <el-button
                  type="primary"
                  size="small"
                  :icon="Refresh"
                  @click.stop="handleNodeAction('重启', row)"
                >
                  重启
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 右侧：节点详情和监控 -->
      <el-col :span="10">
        <el-card shadow="never" class="detail-card" v-if="selectedNode">
          <template #header>
            <div class="card-header">
              <span class="card-title">节点详情 - {{ selectedNode.name }}</span>
              <el-tag :type="getStatusType(selectedNode.status)" size="small">
                {{ selectedNode.status }}
              </el-tag>
            </div>
          </template>

          <!-- 基本信息 -->
          <div class="detail-section">
            <h4 class="section-title">
              <el-icon><DataAnalysis /></el-icon>
              基本信息
            </h4>
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="节点ID">{{ selectedNode.id }}</el-descriptions-item>
              <el-descriptions-item label="节点类型">{{ selectedNode.type }}</el-descriptions-item>
              <el-descriptions-item label="IP地址">{{ selectedNode.ip }}:{{ selectedNode.port }}</el-descriptions-item>
              <el-descriptions-item label="版本">{{ selectedNode.version }}</el-descriptions-item>
              <el-descriptions-item label="连接数">{{ selectedNode.connections }}</el-descriptions-item>
              <el-descriptions-item label="运行时间">{{ formatUptime(selectedNode.uptime) }}</el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 性能指标 -->
          <div class="detail-section">
            <h4 class="section-title">
              <el-icon><TrendCharts /></el-icon>
              性能指标
            </h4>
            <el-row :gutter="12">
              <el-col :span="12">
                <div class="metric-item">
                  <span class="metric-label">出块时间</span>
                  <span class="metric-value">{{ formatBlockTime(selectedNode.blockTime) }}</span>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="metric-item">
                  <span class="metric-label">交易速度</span>
                  <span class="metric-value">{{ formatTxSpeed(selectedNode.txSpeed) }}</span>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="metric-item">
                  <span class="metric-label">最后出块</span>
                  <span class="metric-value small">{{ selectedNode.lastBlockTime }}</span>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="metric-item">
                  <span class="metric-label">健康评分</span>
                  <el-tag :type="getHealthType(selectedNode.healthScore)" size="small">
                    {{ selectedNode.healthScore }}
                  </el-tag>
                </div>
              </el-col>
            </el-row>
          </div>

          <!-- 资源使用率 -->
          <div class="detail-section">
            <h4 class="section-title">
              <el-icon><Monitor /></el-icon>
              资源使用率
            </h4>
            <div class="resource-item">
              <div class="resource-header">
                <span>CPU</span>
                <span>{{ selectedNode.cpu.toFixed(1) }}%</span>
              </div>
              <el-progress
                :percentage="selectedNode.cpu"
                :color="selectedNode.cpu > 80 ? '#F56C6C' : '#409EFF'"
                :stroke-width="12"
              />
            </div>
            <div class="resource-item">
              <div class="resource-header">
                <span>内存</span>
                <span>{{ selectedNode.memory.toFixed(1) }}%</span>
              </div>
              <el-progress
                :percentage="selectedNode.memory"
                :color="selectedNode.memory > 85 ? '#F56C6C' : '#67C23A'"
                :stroke-width="12"
              />
            </div>
            <div class="resource-item">
              <div class="resource-header">
                <span>磁盘</span>
                <span>{{ selectedNode.disk.toFixed(1) }}%</span>
              </div>
              <el-progress
                :percentage="selectedNode.disk"
                :color="selectedNode.disk > 90 ? '#F56C6C' : '#E6A23C'"
                :stroke-width="12"
              />
            </div>
            <div class="resource-item">
              <div class="resource-header">
                <span>网络</span>
                <span>{{ selectedNode.network.toFixed(1) }}%</span>
              </div>
              <el-progress
                :percentage="selectedNode.network"
                :color="selectedNode.network > 80 ? '#F56C6C' : '#409EFF'"
                :stroke-width="12"
              />
            </div>
          </div>

          <!-- 节点日志 -->
          <div class="detail-section">
            <h4 class="section-title">
              <el-icon><Document /></el-icon>
              节点日志
            </h4>
            <div class="log-container">
              <div
                v-for="(log, index) in nodeLogs.slice(0, 10)"
                :key="index"
                class="log-item"
                :class="`log-${log.level}`"
              >
                <span class="log-time">{{ log.time }}</span>
                <span class="log-level">{{ log.level.toUpperCase() }}</span>
                <span class="log-message">{{ log.message }}</span>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 异常预警 -->
        <el-card shadow="never" class="alert-card" style="margin-top: 16px;">
          <template #header>
            <div class="card-header">
              <span class="card-title">异常预警</span>
              <el-button
                type="primary"
                :icon="Setting"
                size="small"
                @click="alertRuleVisible = true"
              >
                预警规则
              </el-button>
            </div>
          </template>

          <el-timeline>
            <el-timeline-item
              v-for="alert in alertList.slice(0, 8)"
              :key="alert.id"
              :timestamp="alert.time"
              placement="top"
              :type="getAlertLevelType(alert.level)"
            >
              <el-card shadow="hover" class="alert-item-card">
                <div class="alert-item-header">
                  <el-tag :type="getAlertLevelType(alert.level)" size="small">
                    {{ alert.level }}
                  </el-tag>
                  <span class="alert-node-name">{{ alert.nodeName }}</span>
                  <el-tag v-if="alert.handled" type="info" size="small">已处理</el-tag>
                </div>
                <div class="alert-item-content">
                  <p><strong>{{ alert.type }}</strong></p>
                  <p class="alert-message">{{ alert.message }}</p>
                </div>
                <div class="alert-item-actions">
                  <el-button
                    type="primary"
                    size="small"
                    text
                    @click="viewAlertDetail(alert)"
                  >
                    查看详情
                  </el-button>
                  <el-button
                    v-if="!alert.handled"
                    type="success"
                    size="small"
                    text
                    @click="handleAlert(alert)"
                  >
                    标记已处理
                  </el-button>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>

    <!-- 预警规则配置对话框 -->
    <el-dialog
      v-model="alertRuleVisible"
      title="预警规则配置"
      width="500px"
    >
      <el-form :model="alertRules" label-width="150px">
        <el-form-item label="CPU阈值 (%)">
          <el-input-number
            v-model="alertRules.cpuThreshold"
            :min="0"
            :max="100"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="内存阈值 (%)">
          <el-input-number
            v-model="alertRules.memoryThreshold"
            :min="0"
            :max="100"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="磁盘阈值 (%)">
          <el-input-number
            v-model="alertRules.diskThreshold"
            :min="0"
            :max="100"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="网络阈值 (%)">
          <el-input-number
            v-model="alertRules.networkThreshold"
            :min="0"
            :max="100"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="区块高度差">
          <el-input-number
            v-model="alertRules.blockHeightDiff"
            :min="0"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="健康评分阈值">
          <el-input-number
            v-model="alertRules.healthScoreThreshold"
            :min="0"
            :max="100"
            style="width: 100%;"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="alertRuleVisible = false">取消</el-button>
        <el-button type="primary" @click="saveAlertRules">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.node-monitor-container {
  min-height: calc(100vh - 120px);
}

.stats-row {
  margin-bottom: 20px;
}

.stats-card {
  :deep(.el-card__body) {
    padding: 20px;
  }
}

.main-content {
  .list-card,
  .detail-card,
  .alert-card {
    height: auto;
    
    :deep(.el-card__header) {
      padding: 16px 20px;
      background-color: #fafafa;
      border-bottom: 1px solid #e8e8e8;
    }
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

.filter-bar {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.detail-section {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 16px 0;
    padding-bottom: 8px;
    border-bottom: 2px solid #e8e8e8;

    .el-icon {
      color: #409EFF;
    }
  }
}

.metric-item {
  display: flex;
  flex-direction: column;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 12px;

  .metric-label {
    font-size: 12px;
    color: #909399;
    margin-bottom: 8px;
  }

  .metric-value {
    font-size: 18px;
    font-weight: 600;
    color: #303133;

    &.small {
      font-size: 12px;
      font-weight: normal;
    }
  }
}

.resource-item {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }

  .resource-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 13px;
    color: #606266;
  }
}

.log-container {
  max-height: 300px;
  overflow-y: auto;
  background-color: #1e1e1e;
  border-radius: 4px;
  padding: 12px;

  .log-item {
    display: flex;
    gap: 12px;
    padding: 6px 0;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 12px;
    line-height: 1.5;
    border-bottom: 1px solid #2d2d2d;

    &:last-child {
      border-bottom: none;
    }

    .log-time {
      color: #858585;
      white-space: nowrap;
    }

    .log-level {
      font-weight: 600;
      min-width: 50px;
    }

    .log-message {
      flex: 1;
      color: #d4d4d4;
    }

    &.log-info .log-level {
      color: #4fc3f7;
    }

    &.log-warn .log-level {
      color: #ffa726;
    }

    &.log-error .log-level {
      color: #ef5350;
    }
  }
}

.alert-item-card {
  margin-top: 8px;

  .alert-item-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;

    .alert-node-name {
      font-weight: 600;
      color: #303133;
      flex: 1;
    }
  }

  .alert-item-content {
    margin-bottom: 12px;

    p {
      margin: 0 0 8px 0;
      line-height: 1.6;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .alert-message {
      font-size: 13px;
      color: #606266;
    }
  }

  .alert-item-actions {
    display: flex;
    gap: 12px;
    padding-top: 12px;
    border-top: 1px solid #e8e8e8;
  }
}

:deep(.el-table) {
  .selected-row {
    background-color: #ecf5ff !important;
  }

  .el-table__row {
    cursor: pointer;
  }
}

:deep(.el-timeline) {
  padding-left: 0;

  .el-timeline-item__timestamp {
    font-size: 12px;
  }
}

// 滚动条样式
.log-container::-webkit-scrollbar {
  width: 8px;
}

.log-container::-webkit-scrollbar-track {
  background: #2d2d2d;
  border-radius: 4px;
}

.log-container::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 4px;

  &:hover {
    background: #666;
  }
}
</style>