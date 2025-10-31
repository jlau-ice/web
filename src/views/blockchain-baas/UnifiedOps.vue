<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { TabsPaneContext } from 'element-plus'

// 定义类型
interface NetworkStatus {
  totalNodes: number
  activeNodes: number
  blockHeight: number
  tps: number
  avgBlockTime: number
  pendingTxs: number
}

interface NodeInfo {
  id: string
  name: string
  type: string
  status: 'running' | 'stopped' | 'error' | 'maintenance'
  cpu: number
  memory: number
  disk: number
  network: number
  uptime: string
  location: string
  version: string
}

interface ResourceQuota {
  id: string
  name: string
  cpu: { used: number; total: number }
  memory: { used: number; total: number }
  storage: { used: number; total: number }
  network: { used: number; total: number }
  status: 'sufficient' | 'warning' | 'critical' | 'insufficient'
}

interface Certificate {
  id: string
  name: string
  type: string
  issuer: string
  subject: string
  validFrom: string
  validTo: string
  daysRemaining: number
  status: 'valid' | 'expiring' | 'expired'
  autoRenew: boolean
}

interface CryptoKey {
  id: string
  name: string
  type: string
  algorithm: string
  createdAt: string
  lastRotated: string
  nextRotation: string
  status: 'active' | 'inactive' | 'rotated'
  accessLevel: string
}

interface Alert {
  id: string
  level: 'info' | 'warning' | 'error' | 'critical'
  message: string
  time: string
  source: string
}

// 当前选中的标签页
const activeTab = ref('dashboard')

// 网络状态数据
const networkStatus = ref<NetworkStatus>({
  totalNodes: 0,
  activeNodes: 0,
  blockHeight: 0,
  tps: 0,
  avgBlockTime: 0,
  pendingTxs: 0
})

// 节点列表
const nodeList = ref<NodeInfo[]>([])
const nodeLoading = ref(false)

// 资源配额列表
const resourceList = ref<ResourceQuota[]>([])
const resourceLoading = ref(false)

// 证书列表
const certList = ref<Certificate[]>([])
const certLoading = ref(false)

// 密钥列表
const keyList = ref<CryptoKey[]>([])
const keyLoading = ref(false)

// 告警列表
const alertList = ref<Alert[]>([])

// 节点操作加载状态
const nodeOperating = ref<{ [key: string]: boolean }>({})

// 获取状态标签类型
const getStatusType = (status: string) => {
  const typeMap: { [key: string]: any } = {
    running: 'success',
    stopped: 'info',
    error: 'danger',
    maintenance: 'warning',
    sufficient: 'success',
    warning: 'warning',
    critical: '',
    insufficient: 'danger',
    valid: 'success',
    expiring: 'warning',
    expired: 'danger',
    active: 'success',
    inactive: 'info',
    rotated: 'warning'
  }
  return typeMap[status] || ''
}

// 获取状态文本
const getStatusText = (status: string) => {
  const textMap: { [key: string]: string } = {
    running: '运行中',
    stopped: '已停止',
    error: '异常',
    maintenance: '维护中',
    sufficient: '充足',
    warning: '预警',
    critical: '紧张',
    insufficient: '不足',
    valid: '有效',
    expiring: '即将过期',
    expired: '已过期',
    active: '活跃',
    inactive: '未激活',
    rotated: '已轮换'
  }
  return textMap[status] || status
}

// 获取资源状态颜色
const getResourceColor = (status: string) => {
  const colorMap: { [key: string]: string } = {
    sufficient: '#67c23a',
    warning: '#e6a23c',
    critical: '#f56c6c',
    insufficient: '#f56c6c'
  }
  return colorMap[status] || '#909399'
}

// 计算资源使用百分比
const getResourcePercentage = (used: number, total: number) => {
  return Math.round((used / total) * 100)
}

// 获取资源状态
const getResourceStatus = (percentage: number): ResourceQuota['status'] => {
  if (percentage < 60) return 'sufficient'
  if (percentage < 75) return 'warning'
  if (percentage < 90) return 'critical'
  return 'insufficient'
}

// Mock 加载网络状态
const loadNetworkStatus = () => {
  setTimeout(() => {
    networkStatus.value = {
      totalNodes: 12,
      activeNodes: 11,
      blockHeight: 1234567,
      tps: 1250,
      avgBlockTime: 3.2,
      pendingTxs: 45
    }

    // 模拟实时更新
    setInterval(() => {
      networkStatus.value.blockHeight += Math.floor(Math.random() * 3)
      networkStatus.value.tps = 1000 + Math.floor(Math.random() * 500)
      networkStatus.value.pendingTxs = Math.floor(Math.random() * 100)
    }, 5000)
  }, 500)
}

// Mock 加载节点列表
const loadNodeList = () => {
  nodeLoading.value = true
  setTimeout(() => {
    nodeList.value = [
      {
        id: 'node-001',
        name: '共识节点-01',
        type: '共识节点',
        status: 'running',
        cpu: 45,
        memory: 62,
        disk: 38,
        network: 28,
        uptime: '15天 8小时',
        location: '北京机房-A区',
        version: 'v2.1.3'
      },
      {
        id: 'node-002',
        name: '共识节点-02',
        type: '共识节点',
        status: 'running',
        cpu: 52,
        memory: 58,
        disk: 42,
        network: 31,
        uptime: '15天 8小时',
        location: '上海机房-B区',
        version: 'v2.1.3'
      },
      {
        id: 'node-003',
        name: '共识节点-03',
        type: '共识节点',
        status: 'maintenance',
        cpu: 0,
        memory: 0,
        disk: 45,
        network: 0,
        uptime: '0天 0小时',
        location: '深圳机房-C区',
        version: 'v2.1.2'
      },
      {
        id: 'node-004',
        name: '验证节点-01',
        type: '验证节点',
        status: 'running',
        cpu: 38,
        memory: 55,
        disk: 51,
        network: 25,
        uptime: '12天 3小时',
        location: '北京机房-A区',
        version: 'v2.1.3'
      },
      {
        id: 'node-005',
        name: '验证节点-02',
        type: '验证节点',
        status: 'error',
        cpu: 95,
        memory: 88,
        disk: 62,
        network: 85,
        uptime: '2天 15小时',
        location: '广州机房-D区',
        version: 'v2.1.3'
      },
      {
        id: 'node-006',
        name: '存储节点-01',
        type: '存储节点',
        status: 'running',
        cpu: 25,
        memory: 48,
        disk: 78,
        network: 42,
        uptime: '20天 12小时',
        location: '杭州机房-E区',
        version: 'v2.1.3'
      },
      {
        id: 'node-007',
        name: '存储节点-02',
        type: '存储节点',
        status: 'running',
        cpu: 28,
        memory: 52,
        disk: 82,
        network: 38,
        uptime: '18天 6小时',
        location: '成都机房-F区',
        version: 'v2.1.3'
      },
      {
        id: 'node-008',
        name: 'RPC节点-01',
        type: 'RPC节点',
        status: 'running',
        cpu: 68,
        memory: 72,
        disk: 45,
        network: 78,
        uptime: '10天 20小时',
        location: '北京机房-A区',
        version: 'v2.1.3'
      }
    ]
    nodeLoading.value = false
  }, 800)
}

// Mock 加载资源配额
const loadResourceList = () => {
  resourceLoading.value = true
  setTimeout(() => {
    resourceList.value = [
      {
        id: 'res-001',
        name: '生产环境资源池',
        cpu: { used: 180, total: 320 },
        memory: { used: 450, total: 768 },
        storage: { used: 2800, total: 5120 },
        network: { used: 450, total: 1000 },
        status: 'sufficient'
      },
      {
        id: 'res-002',
        name: '测试环境资源池',
        cpu: { used: 45, total: 64 },
        memory: { used: 96, total: 128 },
        storage: { used: 680, total: 1024 },
        network: { used: 120, total: 200 },
        status: 'warning'
      },
      {
        id: 'res-003',
        name: '开发环境资源池',
        cpu: { used: 28, total: 32 },
        memory: { used: 58, total: 64 },
        storage: { used: 380, total: 512 },
        network: { used: 85, total: 100 },
        status: 'critical'
      }
    ]

    // 更新状态
    resourceList.value.forEach(res => {
      const cpuPercent = getResourcePercentage(res.cpu.used, res.cpu.total)
      const memPercent = getResourcePercentage(res.memory.used, res.memory.total)
      const storagePercent = getResourcePercentage(res.storage.used, res.storage.total)
      const maxPercent = Math.max(cpuPercent, memPercent, storagePercent)
      res.status = getResourceStatus(maxPercent)
    })

    resourceLoading.value = false
  }, 800)
}

// Mock 加载证书列表
const loadCertList = () => {
  certLoading.value = true
  setTimeout(() => {
    certList.value = [
      {
        id: 'cert-001',
        name: '根证书',
        type: 'CA证书',
        issuer: 'Blockchain Root CA',
        subject: 'CN=Blockchain Root CA',
        validFrom: '2024-01-01',
        validTo: '2034-01-01',
        daysRemaining: 3320,
        status: 'valid',
        autoRenew: true
      },
      {
        id: 'cert-002',
        name: '共识节点-01证书',
        type: 'TLS证书',
        issuer: 'Blockchain Root CA',
        subject: 'CN=consensus-node-01',
        validFrom: '2024-01-01',
        validTo: '2025-12-31',
        daysRemaining: 428,
        status: 'valid',
        autoRenew: true
      },
      {
        id: 'cert-003',
        name: '共识节点-02证书',
        type: 'TLS证书',
        issuer: 'Blockchain Root CA',
        subject: 'CN=consensus-node-02',
        validFrom: '2024-03-15',
        validTo: '2025-03-15',
        daysRemaining: 135,
        status: 'valid',
        autoRenew: true
      },
      {
        id: 'cert-004',
        name: 'RPC网关证书',
        type: 'SSL证书',
        issuer: 'Blockchain Root CA',
        subject: 'CN=rpc.blockchain.local',
        validFrom: '2024-10-01',
        validTo: '2025-01-15',
        daysRemaining: 28,
        status: 'expiring',
        autoRenew: false
      },
      {
        id: 'cert-005',
        name: '旧版API证书',
        type: 'SSL证书',
        issuer: 'Blockchain Root CA',
        subject: 'CN=api-v1.blockchain.local',
        validFrom: '2023-06-01',
        validTo: '2024-10-01',
        daysRemaining: -29,
        status: 'expired',
        autoRenew: false
      }
    ]
    certLoading.value = false
  }, 800)
}

// Mock 加载密钥列表
const loadKeyList = () => {
  keyLoading.value = true
  setTimeout(() => {
    keyList.value = [
      {
        id: 'key-001',
        name: '主密钥',
        type: '对称密钥',
        algorithm: 'AES-256-GCM',
        createdAt: '2024-01-01',
        lastRotated: '2024-10-01',
        nextRotation: '2025-01-01',
        status: 'active',
        accessLevel: '最高权限'
      },
      {
        id: 'key-002',
        name: '数据加密密钥',
        type: '对称密钥',
        algorithm: 'AES-256-CBC',
        createdAt: '2024-01-15',
        lastRotated: '2024-07-15',
        nextRotation: '2025-01-15',
        status: 'active',
        accessLevel: '高级权限'
      },
      {
        id: 'key-003',
        name: '节点通信密钥对',
        type: '非对称密钥',
        algorithm: 'RSA-4096',
        createdAt: '2024-02-01',
        lastRotated: '2024-08-01',
        nextRotation: '2025-02-01',
        status: 'active',
        accessLevel: '中级权限'
      },
      {
        id: 'key-004',
        name: '签名密钥',
        type: '非对称密钥',
        algorithm: 'ECDSA-P256',
        createdAt: '2024-03-01',
        lastRotated: '2024-09-01',
        nextRotation: '2025-03-01',
        status: 'active',
        accessLevel: '高级权限'
      },
      {
        id: 'key-005',
        name: '旧版加密密钥',
        type: '对称密钥',
        algorithm: 'AES-128-CBC',
        createdAt: '2023-01-01',
        lastRotated: '2024-05-01',
        nextRotation: '2024-11-01',
        status: 'rotated',
        accessLevel: '中级权限'
      }
    ]
    keyLoading.value = false
  }, 800)
}

// Mock 加载告警列表
const loadAlertList = () => {
  setTimeout(() => {
    alertList.value = [
      {
        id: 'alert-001',
        level: 'critical',
        message: '验证节点-02 CPU使用率超过90%，请立即检查',
        time: '2分钟前',
        source: 'node-005'
      },
      {
        id: 'alert-002',
        level: 'warning',
        message: 'RPC网关证书将在28天后过期，建议尽快续期',
        time: '15分钟前',
        source: 'cert-004'
      },
      {
        id: 'alert-003',
        level: 'error',
        message: '开发环境资源池网络带宽使用率达到85%',
        time: '1小时前',
        source: 'res-003'
      },
      {
        id: 'alert-004',
        level: 'info',
        message: '共识节点-03 进入维护模式',
        time: '2小时前',
        source: 'node-003'
      }
    ]
  }, 500)
}

// 节点操作
const handleNodeOperation = async (node: NodeInfo, operation: 'start' | 'stop' | 'restart') => {
  const operationText = {
    start: '启动',
    stop: '停止',
    restart: '重启'
  }

  try {
    await ElMessageBox.confirm(
      `确认要${operationText[operation]}节点 "${node.name}" 吗?`,
      '操作确认',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    nodeOperating.value[node.id] = true

    // 模拟操作
    setTimeout(() => {
      if (operation === 'start') {
        node.status = 'running'
      } else if (operation === 'stop') {
        node.status = 'stopped'
        node.cpu = 0
        node.memory = 0
        node.network = 0
      } else if (operation === 'restart') {
        node.status = 'running'
      }

      nodeOperating.value[node.id] = false
      ElMessage.success(`${operationText[operation]}操作成功`)
    }, 2000)
  } catch {
    // 用户取消操作
  }
}

// 查看节点日志
const viewNodeLogs = (node: NodeInfo) => {
  ElMessage.info(`查看节点 ${node.name} 的日志`)
  // 实际应该打开日志查看对话框
}

// 配置资源配额
const configureResource = (resource: ResourceQuota) => {
  ElMessage.info(`配置资源池: ${resource.name}`)
  // 实际应该打开资源配置对话框
}

// 扩容资源
const expandResource = (resource: ResourceQuota) => {
  ElMessage.info(`扩容资源池: ${resource.name}`)
  // 实际应该打开资源扩容对话框
}

// 更新证书
const renewCertificate = (cert: Certificate) => {
  ElMessage.success(`正在更新证书: ${cert.name}`)
  // 模拟更新
  setTimeout(() => {
    cert.status = 'valid'
    cert.daysRemaining = 365
    cert.validTo = '2026-10-30'
    ElMessage.success('证书更新成功')
  }, 2000)
}

// 吊销证书
const revokeCertificate = async (cert: Certificate) => {
  try {
    await ElMessageBox.confirm(
      `确认要吊销证书 "${cert.name}" 吗? 此操作不可撤销!`,
      '吊销确认',
      {
        confirmButtonText: '确认吊销',
        cancelButtonText: '取消',
        type: 'error'
      }
    )

    ElMessage.success(`证书 ${cert.name} 已吊销`)
  } catch {
    // 用户取消
  }
}

// 轮换密钥
const rotateKey = async (key: CryptoKey) => {
  try {
    await ElMessageBox.confirm(
      `确认要轮换密钥 "${key.name}" 吗?`,
      '轮换确认',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    ElMessage.success(`正在轮换密钥: ${key.name}`)
    setTimeout(() => {
      key.lastRotated = new Date().toISOString().split('T')[0]
      const nextYear = new Date()
      nextYear.setFullYear(nextYear.getFullYear() + 1)
      key.nextRotation = nextYear.toISOString().split('T')[0]
      ElMessage.success('密钥轮换成功')
    }, 2000)
  } catch {
    // 用户取消
  }
}

// 备份密钥
const backupKey = (key: CryptoKey) => {
  ElMessage.success(`正在备份密钥: ${key.name}`)
  setTimeout(() => {
    ElMessage.success('密钥备份成功')
  }, 1500)
}

// 查看密钥审计日志
const viewKeyAuditLog = (key: CryptoKey) => {
  ElMessage.info(`查看密钥 ${key.name} 的审计日志`)
}

// 标签页切换
const handleTabChange = (tab: TabsPaneContext) => {
  activeTab.value = tab.paneName as string
}

// 刷新当前标签页数据
const refreshCurrentTab = () => {
  switch (activeTab.value) {
    case 'dashboard':
      loadNetworkStatus()
      loadAlertList()
      break
    case 'nodes':
      loadNodeList()
      break
    case 'resources':
      loadResourceList()
      break
    case 'certificates':
      loadCertList()
      break
    case 'keys':
      loadKeyList()
      break
  }
  ElMessage.success('刷新成功')
}

// 组件挂载时加载数据
onMounted(() => {
  loadNetworkStatus()
  loadNodeList()
  loadResourceList()
  loadCertList()
  loadKeyList()
  loadAlertList()
})
</script>

<template>
  <div class="unified-ops-container">
    <!-- 顶部概览指标 -->
    <div class="overview-section">
      <el-row :gutter="20">
        <el-col :span="4">
          <el-card shadow="hover" class="metric-card">
            <el-statistic title="节点总数" :value="networkStatus.totalNodes">
              <template #suffix>个</template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card shadow="hover" class="metric-card success">
            <el-statistic title="活跃节点" :value="networkStatus.activeNodes">
              <template #suffix>个</template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card shadow="hover" class="metric-card">
            <el-statistic title="区块高度" :value="networkStatus.blockHeight" />
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card shadow="hover" class="metric-card primary">
            <el-statistic title="交易吞吐量" :value="networkStatus.tps">
              <template #suffix>TPS</template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card shadow="hover" class="metric-card">
            <el-statistic title="平均出块时间" :value="networkStatus.avgBlockTime" :precision="1">
              <template #suffix>秒</template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card shadow="hover" class="metric-card warning">
            <el-statistic title="待处理交易" :value="networkStatus.pendingTxs">
              <template #suffix>笔</template>
            </el-statistic>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 主内容区域 -->
    <el-card class="main-content" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">统一运维管理平台</span>
          <el-button type="primary" @click="refreshCurrentTab">
            刷新数据
          </el-button>
        </div>
      </template>

      <el-tabs v-model="activeTab" type="border-card" @tab-change="handleTabChange">
        <!-- 监控看板 -->
        <el-tab-pane label="监控看板" name="dashboard">
          <div class="dashboard-content">
            <!-- 网络健康状态 -->
            <el-row :gutter="20" class="dashboard-row">
              <el-col :span="16">
                <el-card shadow="hover" class="dashboard-card">
                  <template #header>
                    <div class="card-title">
                      <i class="el-icon-monitor"></i>
                      网络健康状态
                    </div>
                  </template>
                  <el-descriptions :column="3" border>
                    <el-descriptions-item label="网络状态">
                      <el-tag type="success">正常运行</el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="共识状态">
                      <el-tag type="success">已达成共识</el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="同步状态">
                      <el-tag type="success">已同步</el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="当前区块高度">
                      {{ networkStatus.blockHeight }}
                    </el-descriptions-item>
                    <el-descriptions-item label="平均出块时间">
                      {{ networkStatus.avgBlockTime }} 秒
                    </el-descriptions-item>
                    <el-descriptions-item label="网络延迟">
                      12 ms
                    </el-descriptions-item>
                    <el-descriptions-item label="活跃节点">
                      {{ networkStatus.activeNodes }} / {{ networkStatus.totalNodes }}
                    </el-descriptions-item>
                    <el-descriptions-item label="交易吞吐量">
                      {{ networkStatus.tps }} TPS
                    </el-descriptions-item>
                    <el-descriptions-item label="待处理交易">
                      {{ networkStatus.pendingTxs }} 笔
                    </el-descriptions-item>
                  </el-descriptions>
                </el-card>
              </el-col>

              <el-col :span="8">
                <el-card shadow="hover" class="dashboard-card">
                  <template #header>
                    <div class="card-title">
                      <i class="el-icon-warning"></i>
                      实时告警
                    </div>
                  </template>
                  <el-timeline>
                    <el-timeline-item
                      v-for="alert in alertList"
                      :key="alert.id"
                      :timestamp="alert.time"
                      :type="alert.level === 'critical' ? 'danger' : alert.level === 'error' ? 'danger' : alert.level === 'warning' ? 'warning' : 'primary'"
                    >
                      <div class="alert-item">
                        <el-tag 
                          :type="alert.level === 'critical' || alert.level === 'error' ? 'danger' : alert.level === 'warning' ? 'warning' : 'info'" 
                          size="small"
                        >
                          {{ alert.level === 'critical' ? '严重' : alert.level === 'error' ? '错误' : alert.level === 'warning' ? '警告' : '信息' }}
                        </el-tag>
                        <span class="alert-message">{{ alert.message }}</span>
                      </div>
                    </el-timeline-item>
                  </el-timeline>
                </el-card>
              </el-col>
            </el-row>

            <!-- 节点状态概览 -->
            <el-row :gutter="20" class="dashboard-row">
              <el-col :span="24">
                <el-card shadow="hover" class="dashboard-card">
                  <template #header>
                    <div class="card-title">
                      <i class="el-icon-cpu"></i>
                      节点状态概览
                    </div>
                  </template>
                  <el-row :gutter="20">
                    <el-col :span="6" v-for="node in nodeList.slice(0, 4)" :key="node.id">
                      <div class="node-overview-item">
                        <div class="node-header">
                          <span class="node-name">{{ node.name }}</span>
                          <el-tag :type="getStatusType(node.status)" size="small">
                            {{ getStatusText(node.status) }}
                          </el-tag>
                        </div>
                        <div class="node-metrics">
                          <div class="metric-item">
                            <span class="metric-label">CPU</span>
                            <el-progress :percentage="node.cpu" :status="node.cpu > 80 ? 'exception' : undefined" />
                          </div>
                          <div class="metric-item">
                            <span class="metric-label">内存</span>
                            <el-progress :percentage="node.memory" :status="node.memory > 80 ? 'exception' : undefined" />
                          </div>
                          <div class="metric-item">
                            <span class="metric-label">磁盘</span>
                            <el-progress :percentage="node.disk" :status="node.disk > 80 ? 'exception' : undefined" />
                          </div>
                        </div>
                      </div>
                    </el-col>
                  </el-row>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

        <!-- 节点运维 -->
        <el-tab-pane label="节点运维" name="nodes">
          <el-table :data="nodeList" v-loading="nodeLoading" border stripe>
            <el-table-column prop="name" label="节点名称" width="150" />
            <el-table-column prop="type" label="节点类型" width="120" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="CPU使用率" width="150">
              <template #default="{ row }">
                <el-progress :percentage="row.cpu" :status="row.cpu > 80 ? 'exception' : undefined" />
              </template>
            </el-table-column>
            <el-table-column label="内存使用率" width="150">
              <template #default="{ row }">
                <el-progress :percentage="row.memory" :status="row.memory > 80 ? 'exception' : undefined" />
              </template>
            </el-table-column>
            <el-table-column label="磁盘使用率" width="150">
              <template #default="{ row }">
                <el-progress :percentage="row.disk" :status="row.disk > 80 ? 'exception' : undefined" />
              </template>
            </el-table-column>
            <el-table-column prop="uptime" label="运行时长" width="130" />
            <el-table-column prop="location" label="部署位置" width="140" />
            <el-table-column prop="version" label="版本" width="100" />
            <el-table-column label="操作" width="280" fixed="right">
              <template #default="{ row }">
                <el-button 
                  v-if="row.status === 'stopped' || row.status === 'maintenance'" 
                  type="success" 
                  size="small"
                  :loading="nodeOperating[row.id]"
                  @click="handleNodeOperation(row, 'start')"
                >
                  启动
                </el-button>
                <el-button 
                  v-if="row.status === 'running' || row.status === 'error'" 
                  type="danger" 
                  size="small"
                  :loading="nodeOperating[row.id]"
                  @click="handleNodeOperation(row, 'stop')"
                >
                  停止
                </el-button>
                <el-button 
                  v-if="row.status === 'running' || row.status === 'error'" 
                  type="warning" 
                  size="small"
                  :loading="nodeOperating[row.id]"
                  @click="handleNodeOperation(row, 'restart')"
                >
                  重启
                </el-button>
                <el-button type="primary" size="small" @click="viewNodeLogs(row)">
                  日志
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 资源配额 -->
        <el-tab-pane label="资源配额" name="resources">
          <el-row :gutter="20">
            <el-col :span="24" v-for="resource in resourceList" :key="resource.id">
              <el-card shadow="hover" class="resource-card">
                <template #header>
                  <div class="resource-header">
                    <div class="resource-info">
                      <span class="resource-name">{{ resource.name }}</span>
                      <el-tag :type="getStatusType(resource.status)">
                        {{ getStatusText(resource.status) }}
                      </el-tag>
                    </div>
                    <div class="resource-actions">
                      <el-button type="primary" size="small" @click="configureResource(resource)">
                        配置
                      </el-button>
                      <el-button type="success" size="small" @click="expandResource(resource)">
                        扩容
                      </el-button>
                    </div>
                  </div>
                </template>

                <el-row :gutter="20">
                  <el-col :span="6">
                    <div class="resource-item">
                      <div class="resource-label">CPU (核心)</div>
                      <div class="resource-value">
                        {{ resource.cpu.used }} / {{ resource.cpu.total }}
                      </div>
                      <el-progress 
                        :percentage="getResourcePercentage(resource.cpu.used, resource.cpu.total)"
                        :color="getResourceColor(getResourceStatus(getResourcePercentage(resource.cpu.used, resource.cpu.total)))"
                      />
                    </div>
                  </el-col>
                  <el-col :span="6">
                    <div class="resource-item">
                      <div class="resource-label">内存 (GB)</div>
                      <div class="resource-value">
                        {{ resource.memory.used }} / {{ resource.memory.total }}
                      </div>
                      <el-progress 
                        :percentage="getResourcePercentage(resource.memory.used, resource.memory.total)"
                        :color="getResourceColor(getResourceStatus(getResourcePercentage(resource.memory.used, resource.memory.total)))"
                      />
                    </div>
                  </el-col>
                  <el-col :span="6">
                    <div class="resource-item">
                      <div class="resource-label">存储 (GB)</div>
                      <div class="resource-value">
                        {{ resource.storage.used }} / {{ resource.storage.total }}
                      </div>
                      <el-progress 
                        :percentage="getResourcePercentage(resource.storage.used, resource.storage.total)"
                        :color="getResourceColor(getResourceStatus(getResourcePercentage(resource.storage.used, resource.storage.total)))"
                      />
                    </div>
                  </el-col>
                  <el-col :span="6">
                    <div class="resource-item">
                      <div class="resource-label">网络带宽 (Mbps)</div>
                      <div class="resource-value">
                        {{ resource.network.used }} / {{ resource.network.total }}
                      </div>
                      <el-progress 
                        :percentage="getResourcePercentage(resource.network.used, resource.network.total)"
                        :color="getResourceColor(getResourceStatus(getResourcePercentage(resource.network.used, resource.network.total)))"
                      />
                    </div>
                  </el-col>
                </el-row>
              </el-card>
            </el-col>
          </el-row>
        </el-tab-pane>

        <!-- 证书管理 -->
        <el-tab-pane label="证书管理" name="certificates">
          <el-table :data="certList" v-loading="certLoading" border stripe>
            <el-table-column prop="name" label="证书名称" width="180" />
            <el-table-column prop="type" label="证书类型" width="120" />
            <el-table-column prop="subject" label="主题" min-width="200" />
            <el-table-column prop="issuer" label="颁发者" width="180" />
            <el-table-column prop="validFrom" label="生效日期" width="120" />
            <el-table-column prop="validTo" label="过期日期" width="120" />
            <el-table-column label="剩余天数" width="100">
              <template #default="{ row }">
                <span :class="{ 'text-danger': row.daysRemaining < 30, 'text-warning': row.daysRemaining < 90 }">
                  {{ row.daysRemaining > 0 ? `${row.daysRemaining} 天` : '已过期' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="自动续期" width="100">
              <template #default="{ row }">
                <el-tag :type="row.autoRenew ? 'success' : 'info'" size="small">
                  {{ row.autoRenew ? '已开启' : '未开启' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="renewCertificate(row)">
                  更新
                </el-button>
                <el-button type="danger" size="small" @click="revokeCertificate(row)">
                  吊销
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 密钥管理 -->
        <el-tab-pane label="密钥管理" name="keys">
          <el-table :data="keyList" v-loading="keyLoading" border stripe>
            <el-table-column prop="name" label="密钥名称" width="180" />
            <el-table-column prop="type" label="密钥类型" width="120" />
            <el-table-column prop="algorithm" label="加密算法" width="150" />
            <el-table-column prop="createdAt" label="创建时间" width="120" />
            <el-table-column prop="lastRotated" label="上次轮换" width="120" />
            <el-table-column prop="nextRotation" label="下次轮换" width="120" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="accessLevel" label="访问级别" width="120" />
            <el-table-column label="操作" width="280" fixed="right">
              <template #default="{ row }">
                <el-button type="warning" size="small" @click="rotateKey(row)">
                  轮换
                </el-button>
                <el-button type="primary" size="small" @click="backupKey(row)">
                  备份
                </el-button>
                <el-button type="info" size="small" @click="viewKeyAuditLog(row)">
                  审计日志
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.unified-ops-container {
  padding: 20px;
  background: #f0f2f5;
  min-height: 100vh;

  .overview-section {
    margin-bottom: 20px;

    .metric-card {
      text-align: center;
      transition: all 0.3s;
      border-radius: 8px;

      &:hover {
        transform: translateY(-4px);
      }

      &.success {
        background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
        color: white;

        :deep(.el-statistic__head) {
          color: rgba(255, 255, 255, 0.9);
        }

        :deep(.el-statistic__content) {
          color: white;
        }
      }

      &.primary {
        background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
        color: white;

        :deep(.el-statistic__head) {
          color: rgba(255, 255, 255, 0.9);
        }

        :deep(.el-statistic__content) {
          color: white;
        }
      }

      &.warning {
        background: linear-gradient(135deg, #e6a23c 0%, #f0b560 100%);
        color: white;

        :deep(.el-statistic__head) {
          color: rgba(255, 255, 255, 0.9);
        }

        :deep(.el-statistic__content) {
          color: white;
        }
      }
    }
  }

  .main-content {
    border-radius: 8px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .title {
        font-size: 18px;
        font-weight: bold;
        color: #303133;
      }
    }
  }

  .dashboard-content {
    .dashboard-row {
      margin-bottom: 20px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .dashboard-card {
      height: 100%;

      .card-title {
        font-weight: bold;
        font-size: 16px;

        i {
          margin-right: 8px;
          color: #409eff;
        }
      }
    }

    .alert-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;

      .alert-message {
        flex: 1;
        line-height: 1.5;
        font-size: 14px;
      }
    }

    .node-overview-item {
      padding: 16px;
      border: 1px solid #ebeef5;
      border-radius: 8px;
      background: #fff;

      .node-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        .node-name {
          font-weight: bold;
          font-size: 14px;
        }
      }

      .node-metrics {
        .metric-item {
          margin-bottom: 12px;

          &:last-child {
            margin-bottom: 0;
          }

          .metric-label {
            display: block;
            font-size: 12px;
            color: #909399;
            margin-bottom: 4px;
          }
        }
      }
    }
  }

  .resource-card {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }

    .resource-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .resource-info {
        display: flex;
        align-items: center;
        gap: 12px;

        .resource-name {
          font-size: 16px;
          font-weight: bold;
        }
      }
    }

    .resource-item {
      .resource-label {
        font-size: 14px;
        color: #606266;
        margin-bottom: 8px;
      }

      .resource-value {
        font-size: 18px;
        font-weight: bold;
        color: #303133;
        margin-bottom: 12px;
      }
    }
  }

  .text-danger {
    color: #f56c6c;
    font-weight: bold;
  }

  .text-warning {
    color: #e6a23c;
  }

  :deep(.el-tabs--border-card) {
    box-shadow: none;
    border: 1px solid #dcdfe6;
  }

  :deep(.el-tabs__header) {
    background: #fafafa;
  }

  :deep(.el-table) {
    font-size: 14px;

    .el-button + .el-button {
      margin-left: 8px;
    }
  }

  :deep(.el-progress) {
    .el-progress__text {
      font-size: 12px;
    }
  }

  :deep(.el-timeline) {
    padding-left: 10px;

    .el-timeline-item__timestamp {
      color: #909399;
      font-size: 12px;
    }
  }

  :deep(.el-descriptions) {
    .el-descriptions__label {
      font-weight: bold;
    }
  }
}
</style>