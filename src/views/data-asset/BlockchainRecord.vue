<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { TableColumnCtx } from 'element-plus'

// ==================== 类型定义 ====================
interface DataAsset {
  id: string
  name: string
  type: string
  size: string
  chainStatus: 'pending' | 'chaining' | 'success' | 'failed'
  certStatus?: 'valid' | 'expired' | 'revoked'
  txHash?: string
  blockHeight?: number
  chainTime?: string
  progress?: number
}

interface BlockchainStat {
  label: string
  value: number | string
  prefix?: string
  suffix?: string
  type?: 'success' | 'warning' | 'danger' | 'info'
}

interface SmartContract {
  id: string
  name: string
  version: string
  status: 'active' | 'inactive' | 'upgrading'
  deployTime: string
  callCount: number
}

interface ChainQuery {
  txHash: string
  blockHeight: number
  timestamp: string
  status: string
  gasUsed: string
}

interface AlertRecord {
  id: string
  type: 'error' | 'warning' | 'info'
  message: string
  time: string
}

// ==================== 响应式数据 ====================
const loading = ref(false)
const tableData = ref<DataAsset[]>([])
const selectedAssets = ref<DataAsset[]>([])
const activeTab = ref('chain-manage')

// 搜索和筛选
const searchForm = reactive({
  keyword: '',
  chainStatus: '',
  dateRange: []
})

// 统计数据
const blockchainStats = ref<BlockchainStat[]>([
  { label: '已上链资产', value: 0, suffix: '个', type: 'success' },
  { label: '上链成功率', value: 0, suffix: '%', type: 'info' },
  { label: '当前区块高度', value: 0, suffix: '', type: 'warning' },
  { label: '网络延迟', value: 0, suffix: 'ms', type: 'danger' }
])

// 智能合约列表
const smartContracts = ref<SmartContract[]>([])

// 链上查询结果
const chainQueryResult = ref<ChainQuery | null>(null)
const queryTxHash = ref('')

// 告警记录
const alertRecords = ref<AlertRecord[]>([])

// 存证验证
const verifyDialog = ref(false)
const verifyTxHash = ref('')
const verifyResult = ref<any>(null)

// 证书生成对话框
const certDialog = ref(false)
const certAsset = ref<DataAsset | null>(null)

// ==================== 计算属性 ====================
const filteredTableData = computed(() => {
  let data = tableData.value
  
  if (searchForm.keyword) {
    data = data.filter(item => 
      item.name.toLowerCase().includes(searchForm.keyword.toLowerCase()) ||
      item.txHash?.toLowerCase().includes(searchForm.keyword.toLowerCase())
    )
  }
  
  if (searchForm.chainStatus) {
    data = data.filter(item => item.chainStatus === searchForm.chainStatus)
  }
  
  return data
})

const chainStatusMap = {
  pending: { text: '待上链', type: 'info' },
  chaining: { text: '上链中', type: 'primary' },
  success: { text: '已上链', type: 'success' },
  failed: { text: '失败', type: 'danger' }
}

const certStatusMap = {
  valid: { text: '有效', type: 'success' },
  expired: { text: '过期', type: 'warning' },
  revoked: { text: '作废', type: 'danger' }
}

// ==================== 模拟数据生成 ====================
const generateMockData = () => {
  const types = ['数据集', '模型文件', '交易记录', 'API接口', '图像资产']
  const names = ['用户行为数据', '销售数据集', 'AI训练模型', '金融交易记录', '商品图片库', '日志数据', '统计报表', '客户信息']
  
  const data: DataAsset[] = []
  for (let i = 1; i <= 15; i++) {
    const status = ['pending', 'chaining', 'success', 'failed'][Math.floor(Math.random() * 4)] as DataAsset['chainStatus']
    const certStatus = status === 'success' ? (['valid', 'expired', 'revoked'][Math.floor(Math.random() * 3)] as DataAsset['certStatus']) : undefined
    
    data.push({
      id: `asset_${i}`,
      name: `${names[Math.floor(Math.random() * names.length)]}_${i}`,
      type: types[Math.floor(Math.random() * types.length)],
      size: `${(Math.random() * 100).toFixed(2)} MB`,
      chainStatus: status,
      certStatus,
      txHash: status !== 'pending' ? `0x${Math.random().toString(16).substr(2, 64)}` : undefined,
      blockHeight: status === 'success' ? Math.floor(Math.random() * 1000000) + 10000000 : undefined,
      chainTime: status === 'success' ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleString() : undefined,
      progress: status === 'chaining' ? Math.floor(Math.random() * 100) : undefined
    })
  }
  return data
}

const generateContractData = (): SmartContract[] => {
  return [
    {
      id: 'contract_1',
      name: '数据交易合约',
      version: 'v2.1.0',
      status: 'active',
      deployTime: '2024-10-15 10:30:00',
      callCount: 1520
    },
    {
      id: 'contract_2',
      name: '存证验证合约',
      version: 'v1.5.2',
      status: 'active',
      deployTime: '2024-09-20 14:20:00',
      callCount: 3450
    },
    {
      id: 'contract_3',
      name: '权限管理合约',
      version: 'v1.0.0',
      status: 'inactive',
      deployTime: '2024-08-10 09:15:00',
      callCount: 890
    }
  ]
}

const generateAlertData = (): AlertRecord[] => {
  const messages = [
    { type: 'error' as const, message: '区块链节点 #3 连接异常' },
    { type: 'warning' as const, message: '存证成功率低于阈值 (92%)' },
    { type: 'info' as const, message: '智能合约已自动升级至 v2.1.0' },
    { type: 'warning' as const, message: '网络延迟较高，当前 450ms' },
    { type: 'error' as const, message: '数据资产上链失败: asset_1234' }
  ]
  
  return messages.map((msg, index) => ({
    id: `alert_${index}`,
    ...msg,
    time: new Date(Date.now() - Math.random() * 3600000).toLocaleString()
  }))
}

// ==================== 方法 ====================
// 加载数据
const loadData = async () => {
  loading.value = true
  setTimeout(() => {
    tableData.value = generateMockData()
    smartContracts.value = generateContractData()
    alertRecords.value = generateAlertData()
    updateStats()
    loading.value = false
    ElMessage.success('数据加载成功')
  }, 800)
}

// 更新统计数据
const updateStats = () => {
  const successCount = tableData.value.filter(item => item.chainStatus === 'success').length
  const totalCount = tableData.value.filter(item => item.chainStatus !== 'pending').length
  const successRate = totalCount > 0 ? ((successCount / totalCount) * 100).toFixed(1) : 0
  
  blockchainStats.value = [
    { label: '已上链资产', value: successCount, suffix: '个', type: 'success' },
    { label: '上链成功率', value: successRate, suffix: '%', type: 'info' },
    { label: '当前区块高度', value: (10234567 + Math.floor(Math.random() * 1000)).toLocaleString(), suffix: '', type: 'warning' },
    { label: '网络延迟', value: Math.floor(Math.random() * 100) + 50, suffix: 'ms', type: 'danger' }
  ]
}

// 表格选择
const handleSelectionChange = (selection: DataAsset[]) => {
  selectedAssets.value = selection
}

// 批量上链
const batchChainData = async () => {
  if (selectedAssets.value.length === 0) {
    ElMessage.warning('请先选择要上链的数据资产')
    return
  }
  
  const pendingAssets = selectedAssets.value.filter(item => item.chainStatus === 'pending')
  if (pendingAssets.length === 0) {
    ElMessage.warning('所选资产中没有待上链的数据')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定将 ${pendingAssets.length} 个数据资产上链吗？`,
      '批量上链确认',
      { type: 'warning' }
    )
    
    ElMessage.info('开始上链操作...')
    
    // 模拟上链过程
    pendingAssets.forEach((asset, index) => {
      setTimeout(() => {
        asset.chainStatus = 'chaining'
        asset.progress = 0
        
        // 模拟进度更新
        const progressInterval = setInterval(() => {
          if (asset.progress! < 100) {
            asset.progress! += Math.floor(Math.random() * 15) + 5
            if (asset.progress! > 100) asset.progress = 100
          } else {
            clearInterval(progressInterval)
            // 模拟成功或失败
            const success = Math.random() > 0.15
            asset.chainStatus = success ? 'success' : 'failed'
            asset.txHash = `0x${Math.random().toString(16).substr(2, 64)}`
            if (success) {
              asset.blockHeight = Math.floor(Math.random() * 1000000) + 10000000
              asset.chainTime = new Date().toLocaleString()
              asset.certStatus = 'valid'
            }
            updateStats()
            ElMessage.success(`${asset.name} 上链成功`)
          }
        }, 300)
      }, index * 500)
    })
    
  } catch {
    // 用户取消
  }
}

// 单个上链
const chainSingleData = async (row: DataAsset) => {
  if (row.chainStatus !== 'pending') {
    ElMessage.warning('该资产已经上链或正在上链中')
    return
  }
  
  row.chainStatus = 'chaining'
  row.progress = 0
  
  const progressInterval = setInterval(() => {
    if (row.progress! < 100) {
      row.progress! += Math.floor(Math.random() * 15) + 5
      if (row.progress! > 100) row.progress = 100
    } else {
      clearInterval(progressInterval)
      const success = Math.random() > 0.1
      row.chainStatus = success ? 'success' : 'failed'
      row.txHash = `0x${Math.random().toString(16).substr(2, 64)}`
      if (success) {
        row.blockHeight = Math.floor(Math.random() * 1000000) + 10000000
        row.chainTime = new Date().toLocaleString()
        row.certStatus = 'valid'
        ElMessage.success(`${row.name} 上链成功`)
      } else {
        ElMessage.error(`${row.name} 上链失败`)
      }
      updateStats()
    }
  }, 300)
}

// 查看详情
const viewDetail = (row: DataAsset) => {
  ElMessageBox.alert(
    `<div style="line-height: 1.8;">
      <p><strong>资产名称：</strong>${row.name}</p>
      <p><strong>资产类型：</strong>${row.type}</p>
      <p><strong>资产大小：</strong>${row.size}</p>
      <p><strong>上链状态：</strong>${chainStatusMap[row.chainStatus].text}</p>
      ${row.txHash ? `<p><strong>交易哈希：</strong><span style="font-size: 12px;">${row.txHash}</span></p>` : ''}
      ${row.blockHeight ? `<p><strong>区块高度：</strong>${row.blockHeight}</p>` : ''}
      ${row.chainTime ? `<p><strong>上链时间：</strong>${row.chainTime}</p>` : ''}
      ${row.certStatus ? `<p><strong>存证状态：</strong>${certStatusMap[row.certStatus].text}</p>` : ''}
    </div>`,
    '资产详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '关闭'
    }
  )
}

// 生成证书
const generateCertificate = (row: DataAsset) => {
  if (row.chainStatus !== 'success') {
    ElMessage.warning('只有已上链的资产才能生成证书')
    return
  }
  certAsset.value = row
  certDialog.value = true
}

// 下载证书
const downloadCertificate = () => {
  ElMessage.info('正在生成证书...')
  setTimeout(() => {
    ElMessage.success('证书下载成功')
    certDialog.value = false
  }, 1500)
}

// 验证存证
const openVerifyDialog = (row?: DataAsset) => {
  verifyDialog.value = true
  verifyTxHash.value = row?.txHash || ''
  verifyResult.value = null
}

const verifyCertificate = () => {
  if (!verifyTxHash.value) {
    ElMessage.warning('请输入交易哈希')
    return
  }
  
  ElMessage.info('正在验证存证信息...')
  setTimeout(() => {
    const valid = Math.random() > 0.2
    verifyResult.value = {
      valid,
      txHash: verifyTxHash.value,
      blockHeight: Math.floor(Math.random() * 1000000) + 10000000,
      timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleString(),
      dataHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      message: valid ? '存证信息验证通过' : '存证信息验证失败，未找到对应记录'
    }
  }, 1200)
}

// 查询链上数据
const queryChainData = () => {
  if (!queryTxHash.value) {
    ElMessage.warning('请输入交易哈希')
    return
  }
  
  ElMessage.info('正在查询链上数据...')
  setTimeout(() => {
    chainQueryResult.value = {
      txHash: queryTxHash.value,
      blockHeight: Math.floor(Math.random() * 1000000) + 10000000,
      timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toLocaleString(),
      status: 'Success',
      gasUsed: `${(Math.random() * 0.01).toFixed(6)} ETH`
    }
    ElMessage.success('查询成功')
  }, 1000)
}

// 部署合约
const deployContract = () => {
  ElMessageBox.prompt('请输入新合约名称', '部署智能合约', {
    confirmButtonText: '部署',
    cancelButtonText: '取消',
    inputPattern: /.+/,
    inputErrorMessage: '合约名称不能为空'
  }).then(({ value }) => {
    ElMessage.info('正在部署合约...')
    setTimeout(() => {
      smartContracts.value.unshift({
        id: `contract_${Date.now()}`,
        name: value,
        version: 'v1.0.0',
        status: 'active',
        deployTime: new Date().toLocaleString(),
        callCount: 0
      })
      ElMessage.success('合约部署成功')
    }, 2000)
  }).catch(() => {})
}

// 搜索重置
const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.chainStatus = ''
  searchForm.dateRange = []
}

// ==================== 生命周期 ====================
onMounted(() => {
  loadData()
  
  // 模拟实时更新统计数据
  setInterval(() => {
    updateStats()
  }, 10000)
})
</script>

<template>
  <div class="blockchain-record-container">
    <!-- 顶部统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6" v-for="stat in blockchainStats" :key="stat.label">
        <el-card shadow="hover" class="stat-card">
          <el-statistic :title="stat.label" :value="stat.value" :suffix="stat.suffix">
            <template #prefix>
              <el-icon :class="`stat-icon stat-${stat.type}`">
                <component :is="stat.type === 'success' ? 'Check' : stat.type === 'warning' ? 'Warning' : stat.type === 'danger' ? 'Clock' : 'DataLine'" />
              </el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- 主内容区 -->
    <el-row :gutter="20" class="main-content">
      <!-- 左侧操作区 -->
      <el-col :span="5">
        <el-card shadow="hover" class="left-panel">
          <template #header>
            <div class="card-header">
              <span>快速操作</span>
            </div>
          </template>
          
          <div class="operation-buttons">
            <el-button type="primary" :icon="'Upload'" @click="batchChainData" :disabled="selectedAssets.length === 0" style="width: 100%">
              批量上链 ({{ selectedAssets.length }})
            </el-button>
            <el-button type="success" :icon="'Document'" @click="openVerifyDialog()" style="width: 100%; margin-top: 12px">
              验证存证
            </el-button>
            <el-button type="warning" :icon="'Refresh'" @click="loadData" style="width: 100%; margin-top: 12px">
              刷新数据
            </el-button>
          </div>

          <el-divider />

          <div class="quick-filter">
            <h4>快速筛选</h4>
            <el-radio-group v-model="searchForm.chainStatus" @change="() => {}" style="display: flex; flex-direction: column; gap: 8px;">
              <el-radio label="">全部状态</el-radio>
              <el-radio label="pending">待上链</el-radio>
              <el-radio label="chaining">上链中</el-radio>
              <el-radio label="success">已上链</el-radio>
              <el-radio label="failed">失败</el-radio>
            </el-radio-group>
          </div>

          <el-divider />

          <div class="contract-quick-info">
            <h4>智能合约</h4>
            <div v-for="contract in smartContracts.slice(0, 3)" :key="contract.id" class="contract-item">
              <div class="contract-name">{{ contract.name }}</div>
              <div class="contract-version">{{ contract.version }}</div>
              <el-tag :type="contract.status === 'active' ? 'success' : 'info'" size="small">
                {{ contract.status === 'active' ? '运行中' : '未激活' }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 中间数据列表区 -->
      <el-col :span="13">
        <el-card shadow="hover" class="table-panel">
          <template #header>
            <div class="card-header">
              <span>数据资产上链记录</span>
              <div class="header-actions">
                <el-input
                  v-model="searchForm.keyword"
                  placeholder="搜索资产名称或交易哈希"
                  :prefix-icon="'Search'"
                  clearable
                  style="width: 300px; margin-right: 10px"
                />
                <el-button :icon="'RefreshRight'" @click="resetSearch">重置</el-button>
              </div>
            </div>
          </template>

          <el-table
            :data="filteredTableData"
            v-loading="loading"
            @selection-change="handleSelectionChange"
            height="650"
            stripe
          >
            <el-table-column type="selection" width="50" />
            <el-table-column prop="name" label="资产名称" min-width="150" />
            <el-table-column prop="type" label="资产类型" width="120" />
            <el-table-column prop="size" label="大小" width="100" />
            <el-table-column label="上链状态" width="140">
              <template #default="{ row }">
                <el-tag :type="chainStatusMap[row.chainStatus].type">
                  {{ chainStatusMap[row.chainStatus].text }}
                </el-tag>
                <el-progress
                  v-if="row.chainStatus === 'chaining'"
                  :percentage="row.progress"
                  :stroke-width="6"
                  :show-text="false"
                  style="margin-top: 5px"
                />
              </template>
            </el-table-column>
            <el-table-column label="存证状态" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.certStatus" :type="certStatusMap[row.certStatus].type" size="small">
                  {{ certStatusMap[row.certStatus].text }}
                </el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="blockHeight" label="区块高度" width="110">
              <template #default="{ row }">
                {{ row.blockHeight?.toLocaleString() || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="260" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="row.chainStatus === 'pending'"
                  type="primary"
                  size="small"
                  @click="chainSingleData(row)"
                  link
                >
                  上链
                </el-button>
                <el-button type="info" size="small" @click="viewDetail(row)" link>
                  详情
                </el-button>
                <el-button
                  v-if="row.chainStatus === 'success'"
                  type="success"
                  size="small"
                  @click="generateCertificate(row)"
                  link
                >
                  证书
                </el-button>
                <el-button
                  v-if="row.txHash"
                  type="warning"
                  size="small"
                  @click="openVerifyDialog(row)"
                  link
                >
                  验证
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 右侧监控区 -->
      <el-col :span="6">
        <!-- 区块链查询 -->
        <el-card shadow="hover" class="right-panel" style="margin-bottom: 20px">
          <template #header>
            <div class="card-header">
              <span>链上数据查询</span>
            </div>
          </template>
          
          <el-input
            v-model="queryTxHash"
            placeholder="输入交易哈希"
            style="margin-bottom: 12px"
          >
            <template #append>
              <el-button :icon="'Search'" @click="queryChainData" />
            </template>
          </el-input>

          <div v-if="chainQueryResult" class="query-result">
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="交易哈希">
                <span class="hash-text">{{ chainQueryResult.txHash.substring(0, 20) }}...</span>
              </el-descriptions-item>
              <el-descriptions-item label="区块高度">
                {{ chainQueryResult.blockHeight.toLocaleString() }}
              </el-descriptions-item>
              <el-descriptions-item label="时间戳">
                {{ chainQueryResult.timestamp }}
              </el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag type="success" size="small">{{ chainQueryResult.status }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="Gas消耗">
                {{ chainQueryResult.gasUsed }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
          <el-empty v-else description="暂无查询结果" :image-size="80" />
        </el-card>

        <!-- 告警监控 -->
        <el-card shadow="hover" class="right-panel">
          <template #header>
            <div class="card-header">
              <span>监控告警</span>
              <el-badge :value="alertRecords.length" :max="99" />
            </div>
          </template>

          <el-timeline>
            <el-timeline-item
              v-for="alert in alertRecords.slice(0, 5)"
              :key="alert.id"
              :timestamp="alert.time"
              :type="alert.type"
              placement="top"
            >
              <el-alert
                :type="alert.type"
                :title="alert.message"
                :closable="false"
                show-icon
              />
            </el-timeline-item>
          </el-timeline>

          <el-button text type="primary" style="width: 100%; margin-top: 10px">
            查看全部告警 →
          </el-button>
        </el-card>

        <!-- 合约管理 -->
        <el-card shadow="hover" class="right-panel" style="margin-top: 20px">
          <template #header>
            <div class="card-header">
              <span>智能合约管理</span>
              <el-button type="primary" size="small" @click="deployContract">
                部署
              </el-button>
            </div>
          </template>

          <div class="contract-list">
            <div v-for="contract in smartContracts" :key="contract.id" class="contract-card">
              <div class="contract-header-info">
                <span class="contract-name-text">{{ contract.name }}</span>
                <el-tag :type="contract.status === 'active' ? 'success' : 'info'" size="small">
                  {{ contract.status === 'active' ? '运行中' : '未激活' }}
                </el-tag>
              </div>
              <div class="contract-meta">
                <span>版本: {{ contract.version }}</span>
                <span>调用: {{ contract.callCount }}</span>
              </div>
              <div class="contract-time">部署时间: {{ contract.deployTime }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 证书生成对话框 -->
    <el-dialog v-model="certDialog" title="存证证书" width="600px">
      <div v-if="certAsset" class="certificate-content">
        <div class="cert-title">区块链数据存证证书</div>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="资产名称">{{ certAsset.name }}</el-descriptions-item>
          <el-descriptions-item label="资产类型">{{ certAsset.type }}</el-descriptions-item>
          <el-descriptions-item label="交易哈希">
            <span class="hash-text">{{ certAsset.txHash }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="区块高度">{{ certAsset.blockHeight?.toLocaleString() }}</el-descriptions-item>
          <el-descriptions-item label="上链时间">{{ certAsset.chainTime }}</el-descriptions-item>
          <el-descriptions-item label="存证状态">
            <el-tag v-if="certAsset.certStatus" :type="certStatusMap[certAsset.certStatus].type">
              {{ certStatusMap[certAsset.certStatus].text }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
        <div class="cert-footer">
          本证书由区块链系统自动生成，具有法律效力
        </div>
      </div>
      <template #footer>
        <el-button @click="certDialog = false">取消</el-button>
        <el-button type="primary" @click="downloadCertificate">下载证书</el-button>
      </template>
    </el-dialog>

    <!-- 存证验证对话框 -->
    <el-dialog v-model="verifyDialog" title="存证验证" width="600px">
      <el-input
        v-model="verifyTxHash"
        placeholder="请输入交易哈希进行验证"
        style="margin-bottom: 20px"
      >
        <template #append>
          <el-button :icon="'Check'" @click="verifyCertificate">验证</el-button>
        </template>
      </el-input>

      <div v-if="verifyResult" class="verify-result">
        <el-result
          :icon="verifyResult.valid ? 'success' : 'error'"
          :title="verifyResult.message"
          :sub-title="verifyResult.valid ? '该存证信息真实有效' : '请检查交易哈希是否正确'"
        >
          <template #extra>
            <el-descriptions v-if="verifyResult.valid" :column="1" border>
              <el-descriptions-item label="交易哈希">
                <span class="hash-text">{{ verifyResult.txHash.substring(0, 30) }}...</span>
              </el-descriptions-item>
              <el-descriptions-item label="区块高度">
                {{ verifyResult.blockHeight.toLocaleString() }}
              </el-descriptions-item>
              <el-descriptions-item label="时间戳">
                {{ verifyResult.timestamp }}
              </el-descriptions-item>
              <el-descriptions-item label="数据哈希">
                <span class="hash-text">{{ verifyResult.dataHash.substring(0, 30) }}...</span>
              </el-descriptions-item>
            </el-descriptions>
          </template>
        </el-result>
      </div>

      <template #footer>
        <el-button @click="verifyDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.blockchain-record-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;

  .stats-row {
    margin-bottom: 20px;

    .stat-card {
      transition: all 0.3s;
      
      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      }

      :deep(.el-statistic__head) {
        font-size: 14px;
        color: #606266;
        margin-bottom: 8px;
      }

      :deep(.el-statistic__content) {
        font-size: 28px;
        font-weight: bold;
      }

      .stat-icon {
        font-size: 20px;
        margin-right: 8px;

        &.stat-success {
          color: #67c23a;
        }

        &.stat-warning {
          color: #e6a23c;
        }

        &.stat-danger {
          color: #f56c6c;
        }

        &.stat-info {
          color: #409eff;
        }
      }
    }
  }

  .main-content {
    .left-panel,
    .table-panel,
    .right-panel {
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: bold;

        .header-actions {
          display: flex;
          align-items: center;
        }
      }
    }

    .left-panel {
      .operation-buttons {
        margin-bottom: 10px;
      }

      .quick-filter {
        h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: #606266;
        }
      }

      .contract-quick-info {
        h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: #606266;
        }

        .contract-item {
          padding: 10px;
          background: #f5f7fa;
          border-radius: 4px;
          margin-bottom: 8px;

          .contract-name {
            font-weight: bold;
            margin-bottom: 4px;
            font-size: 13px;
          }

          .contract-version {
            font-size: 12px;
            color: #909399;
            margin-bottom: 6px;
          }
        }
      }
    }

    .right-panel {
      .query-result {
        margin-top: 10px;
      }

      .hash-text {
        font-family: 'Courier New', monospace;
        font-size: 12px;
        color: #409eff;
        word-break: break-all;
      }

      .contract-list {
        .contract-card {
          padding: 12px;
          background: #f5f7fa;
          border-radius: 6px;
          margin-bottom: 12px;
          transition: all 0.3s;

          &:hover {
            background: #e8f4ff;
            transform: translateX(5px);
          }

          .contract-header-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;

            .contract-name-text {
              font-weight: bold;
              font-size: 14px;
            }
          }

          .contract-meta {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #606266;
            margin-bottom: 6px;
          }

          .contract-time {
            font-size: 11px;
            color: #909399;
          }
        }
      }
    }
  }

  // 证书样式
  .certificate-content {
    .cert-title {
      text-align: center;
      font-size: 24px;
      font-weight: bold;
      color: #303133;
      margin-bottom: 20px;
      padding: 20px 0;
      border-bottom: 2px solid #409eff;
    }

    .hash-text {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: #409eff;
      word-break: break-all;
    }

    .cert-footer {
      margin-top: 30px;
      text-align: center;
      font-size: 12px;
      color: #909399;
      padding: 15px 0;
      border-top: 1px dashed #dcdfe6;
    }
  }

  // 验证结果样式
  .verify-result {
    margin-top: 10px;

    .hash-text {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: #409eff;
      word-break: break-all;
    }
  }
}

// 响应式设计
@media (max-width: 1400px) {
  .blockchain-record-container {
    .main-content {
      :deep(.el-col) {
        margin-bottom: 20px;
      }
    }
  }
}
</style>