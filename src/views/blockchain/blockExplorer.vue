<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Search,
  TrendCharts,
  Coin,
  WalletFilled,
  Timer,
  Connection,
  DocumentCopy,
  View,
  Warning,
  SuccessFilled,
  Clock
} from '@element-plus/icons-vue'

// 类型定义
interface ChainOverview {
  blockHeight: number
  totalTransactions: number
  accountCount: number
  networkHashRate: string
  lastBlockTime: string
  avgBlockInterval: string
  currentChain: string
}

interface Block {
  height: number
  hash: string
  size: string
  txCount: number
  timestamp: string
  miner: string
  parentHash: string
  gasUsed: string
  gasLimit: string
  difficulty: string
}

interface Transaction {
  hash: string
  from: string
  to: string
  value: string
  fee: string
  status: 'confirmed' | 'pending' | 'failed'
  confirmations: number
  timestamp: string
  blockHeight: number
  gasPrice: string
  inputData: string
}

interface Account {
  address: string
  balance: string
  txCount: number
  tokens: Array<{ symbol: string; balance: string }>
  contractCode?: string
  isContract: boolean
}

interface SearchHistory {
  type: 'block' | 'transaction' | 'account'
  value: string
  timestamp: string
}

// 响应式数据
const loading = ref(false)
const searchQuery = ref('')
const activeTab = ref('overview')
const selectedChain = ref('Ethereum')

// 链上数据概览
const chainOverview = reactive<ChainOverview>({
  blockHeight: 18500000,
  totalTransactions: 2100000000,
  accountCount: 240000000,
  networkHashRate: '450 TH/s',
  lastBlockTime: '2 秒前',
  avgBlockInterval: '12.5 秒',
  currentChain: 'Ethereum'
})

// 当前展示的数据
const currentBlock = ref<Block | null>(null)
const currentTransaction = ref<Transaction | null>(null)
const currentAccount = ref<Account | null>(null)
const recentBlocks = ref<Block[]>([])
const recentTransactions = ref<Transaction[]>([])
const searchHistory = ref<SearchHistory[]>([])

// 热门搜索
const hotSearches = ref([
  { label: '最新区块', value: '18500000', type: 'block' },
  { label: '大额交易', value: '0x1a2b3c...', type: 'transaction' },
  { label: 'Vitalik地址', value: '0xd8dA6B...', type: 'account' }
])

// 链选项
const chainOptions = ['Ethereum', 'BSC', 'Polygon', 'Arbitrum', 'Optimism']

// 统计图表数据
const chartStats = reactive({
  blockData: [
    { time: '00:00', count: 280 },
    { time: '04:00', count: 265 },
    { time: '08:00', count: 290 },
    { time: '12:00', count: 310 },
    { time: '16:00', count: 295 },
    { time: '20:00', count: 285 }
  ],
  txData: [
    { time: '00:00', count: 1200 },
    { time: '04:00', count: 1100 },
    { time: '08:00', count: 1450 },
    { time: '12:00', count: 1600 },
    { time: '16:00', count: 1380 },
    { time: '20:00', count: 1250 }
  ]
})

// Mock 数据生成
const mockBlock = (height?: number): Block => ({
  height: height || Math.floor(Math.random() * 18500000),
  hash: '0x' + Math.random().toString(16).substring(2, 66),
  size: (Math.random() * 100 + 50).toFixed(2) + ' KB',
  txCount: Math.floor(Math.random() * 200 + 50),
  timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
  miner: '0x' + Math.random().toString(16).substring(2, 42),
  parentHash: '0x' + Math.random().toString(16).substring(2, 66),
  gasUsed: (Math.random() * 10000000 + 5000000).toFixed(0),
  gasLimit: '15000000',
  difficulty: (Math.random() * 5000 + 2000).toFixed(2) + ' TH'
})

const mockTransaction = (hash?: string): Transaction => {
  const statuses: Array<'confirmed' | 'pending' | 'failed'> = ['confirmed', 'pending', 'failed']
  const status = statuses[Math.floor(Math.random() * 3)]
  return {
    hash: hash || '0x' + Math.random().toString(16).substring(2, 66),
    from: '0x' + Math.random().toString(16).substring(2, 42),
    to: '0x' + Math.random().toString(16).substring(2, 42),
    value: (Math.random() * 10 + 0.1).toFixed(4) + ' ETH',
    fee: (Math.random() * 0.01 + 0.001).toFixed(6) + ' ETH',
    status,
    confirmations: status === 'confirmed' ? Math.floor(Math.random() * 100 + 6) : Math.floor(Math.random() * 6),
    timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    blockHeight: Math.floor(Math.random() * 18500000),
    gasPrice: (Math.random() * 50 + 10).toFixed(2) + ' Gwei',
    inputData: '0x' + Math.random().toString(16).substring(2, 100)
  }
}

const mockAccount = (address?: string): Account => ({
  address: address || '0x' + Math.random().toString(16).substring(2, 42),
  balance: (Math.random() * 1000 + 10).toFixed(4) + ' ETH',
  txCount: Math.floor(Math.random() * 10000 + 100),
  tokens: [
    { symbol: 'USDT', balance: (Math.random() * 50000 + 1000).toFixed(2) },
    { symbol: 'USDC', balance: (Math.random() * 30000 + 500).toFixed(2) },
    { symbol: 'DAI', balance: (Math.random() * 20000 + 200).toFixed(2) }
  ],
  isContract: Math.random() > 0.7,
  contractCode: Math.random() > 0.7 ? '0x608060405234801561001057600080fd5b50...' : undefined
})

// 智能识别搜索类型
const identifySearchType = (query: string): 'block' | 'transaction' | 'account' | 'unknown' => {
  if (/^\d+$/.test(query)) return 'block'
  if (/^0x[a-fA-F0-9]{64}$/.test(query)) return 'transaction'
  if (/^0x[a-fA-F0-9]{40}$/.test(query)) return 'account'
  if (query.startsWith('0x') && query.length > 10) return 'transaction'
  return 'unknown'
}

// 搜索处理
const handleSearch = async () => {
  if (!searchQuery.value.trim()) {
    ElMessage.warning('请输入搜索内容')
    return
  }

  loading.value = true
  const type = identifySearchType(searchQuery.value.trim())

  // 添加到搜索历史
  searchHistory.value.unshift({
    type: type === 'unknown' ? 'block' : type,
    value: searchQuery.value.trim(),
    timestamp: new Date().toLocaleString()
  })
  if (searchHistory.value.length > 10) {
    searchHistory.value = searchHistory.value.slice(0, 10)
  }

  // 模拟异步加载
  await new Promise(resolve => setTimeout(resolve, 800))

  try {
    switch (type) {
      case 'block':
        currentBlock.value = mockBlock(parseInt(searchQuery.value))
        activeTab.value = 'block'
        ElMessage.success('区块信息加载成功')
        break
      case 'transaction':
        currentTransaction.value = mockTransaction(searchQuery.value)
        activeTab.value = 'transaction'
        ElMessage.success('交易信息加载成功')
        break
      case 'account':
        currentAccount.value = mockAccount(searchQuery.value)
        activeTab.value = 'account'
        ElMessage.success('账户信息加载成功')
        break
      default:
        ElMessage.error('无法识别的搜索内容，请输入区块高度、交易哈希或账户地址')
    }
  } catch (error) {
    ElMessage.error('搜索失败，请重试')
  } finally {
    loading.value = false
  }
}

// 快速搜索
const quickSearch = (value: string, type: string) => {
  searchQuery.value = value
  handleSearch()
}

// 切换链
const handleChainChange = async (chain: string) => {
  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 500))
  chainOverview.currentChain = chain
  ElMessage.success(`已切换到 ${chain} 网络`)
  await loadRecentData()
  loading.value = false
}

// 加载最近数据
const loadRecentData = async () => {
  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 600))
  
  recentBlocks.value = Array.from({ length: 10 }, () => mockBlock())
  recentTransactions.value = Array.from({ length: 10 }, () => mockTransaction())
  
  loading.value = false
}

// 查看区块详情
const viewBlockDetail = (height: number) => {
  currentBlock.value = mockBlock(height)
  activeTab.value = 'block'
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 查看交易详情
const viewTransactionDetail = (hash: string) => {
  currentTransaction.value = mockTransaction(hash)
  activeTab.value = 'transaction'
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 查看账户详情
const viewAccountDetail = (address: string) => {
  currentAccount.value = mockAccount(address)
  activeTab.value = 'account'
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 复制到剪贴板
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

// 格式化时间
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN')
}

// 格式化地址（缩短显示）
const formatAddress = (address: string, start = 10, end = 8) => {
  if (address.length <= start + end) return address
  return `${address.substring(0, start)}...${address.substring(address.length - end)}`
}

// 获取交易状态标签类型
const getStatusTagType = (status: string) => {
  switch (status) {
    case 'confirmed': return 'success'
    case 'pending': return 'warning'
    case 'failed': return 'danger'
    default: return 'info'
  }
}

// 获取确认数标签类型
const getConfirmationTagType = (confirmations: number) => {
  if (confirmations >= 6) return 'success'
  if (confirmations > 0) return 'warning'
  return 'info'
}

// 导航到父区块
const navigateToParent = () => {
  if (currentBlock.value) {
    ElMessage.info('正在加载父区块...')
    currentBlock.value = mockBlock(currentBlock.value.height - 1)
  }
}

// 导航到子区块
const navigateToChild = () => {
  if (currentBlock.value && currentBlock.value.height < chainOverview.blockHeight) {
    ElMessage.info('正在加载子区块...')
    currentBlock.value = mockBlock(currentBlock.value.height + 1)
  } else {
    ElMessage.warning('已经是最新区块')
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadRecentData()
})
</script>

<template>
  <div class="block-explorer">
    <!-- 顶部搜索和概览区 -->
    <el-card class="search-card" shadow="hover">
      <div class="search-header">
        <h2>区块链浏览器</h2>
        <el-select v-model="selectedChain" @change="handleChainChange" style="width: 150px">
          <el-option v-for="chain in chainOptions" :key="chain" :label="chain" :value="chain" />
        </el-select>
      </div>

      <!-- 搜索框 -->
      <div class="search-box">
        <el-input
          v-model="searchQuery"
          placeholder="搜索区块高度 / 交易哈希 / 账户地址"
          size="large"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
          <template #append>
            <el-button :icon="Search" @click="handleSearch" :loading="loading">搜索</el-button>
          </template>
        </el-input>
      </div>

      <!-- 热门搜索 -->
      <div class="hot-searches">
        <span class="label">热门：</span>
        <el-tag
          v-for="(item, index) in hotSearches"
          :key="index"
          class="hot-tag"
          @click="quickSearch(item.value, item.type)"
          style="cursor: pointer"
        >
          {{ item.label }}
        </el-tag>
      </div>

      <!-- 链上数据概览 -->
      <el-row :gutter="20" class="overview-stats">
        <el-col :xs="12" :sm="12" :md="6" :lg="6">
          <el-statistic title="当前区块高度" :value="chainOverview.blockHeight">
            <template #prefix>
              <el-icon color="#409EFF"><TrendCharts /></el-icon>
            </template>
          </el-statistic>
        </el-col>
        <el-col :xs="12" :sm="12" :md="6" :lg="6">
          <el-statistic title="总交易数" :value="chainOverview.totalTransactions">
            <template #prefix>
              <el-icon color="#67C23A"><Coin /></el-icon>
            </template>
          </el-statistic>
        </el-col>
        <el-col :xs="12" :sm="12" :md="6" :lg="6">
          <el-statistic title="账户数量" :value="chainOverview.accountCount">
            <template #prefix>
              <el-icon color="#E6A23C"><WalletFilled /></el-icon>
            </template>
          </el-statistic>
        </el-col>
        <el-col :xs="12" :sm="12" :md="6" :lg="6">
          <div class="stat-item">
            <div class="stat-title">
              <el-icon color="#F56C6C"><Connection /></el-icon>
              网络哈希率
            </div>
            <div class="stat-value">{{ chainOverview.networkHashRate }}</div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="overview-info">
        <el-col :span="12">
          <div class="info-item">
            <el-icon><Timer /></el-icon>
            <span>最近出块：{{ chainOverview.lastBlockTime }}</span>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="info-item">
            <el-icon><Clock /></el-icon>
            <span>平均出块间隔：{{ chainOverview.avgBlockInterval }}</span>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 数据详情展示区 -->
    <el-card class="detail-card" shadow="hover" v-loading="loading">
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 概览标签页 -->
        <el-tab-pane label="数据概览" name="overview">
          <el-row :gutter="20">
            <el-col :span="12">
              <h3>最新区块</h3>
              <el-table :data="recentBlocks.slice(0, 5)" stripe style="width: 100%">
                <el-table-column prop="height" label="区块高度" width="120">
                  <template #default="{ row }">
                    <el-link type="primary" @click="viewBlockDetail(row.height)">
                      {{ row.height }}
                    </el-link>
                  </template>
                </el-table-column>
                <el-table-column prop="txCount" label="交易数" width="80" />
                <el-table-column prop="size" label="大小" width="100" />
                <el-table-column label="时间" width="100">
                  <template #default="{ row }">
                    {{ new Date(row.timestamp).toLocaleTimeString() }}
                  </template>
                </el-table-column>
              </el-table>
            </el-col>

            <el-col :span="12">
              <h3>最新交易</h3>
              <el-table :data="recentTransactions.slice(0, 5)" stripe style="width: 100%">
                <el-table-column label="交易哈希" width="150">
                  <template #default="{ row }">
                    <el-link type="primary" @click="viewTransactionDetail(row.hash)">
                      {{ formatAddress(row.hash, 10, 8) }}
                    </el-link>
                  </template>
                </el-table-column>
                <el-table-column prop="value" label="金额" width="120" />
                <el-table-column label="状态" width="80">
                  <template #default="{ row }">
                    <el-tag :type="getStatusTagType(row.status)" size="small">
                      {{ row.status === 'confirmed' ? '确认' : row.status === 'pending' ? '待确认' : '失败' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="时间" width="100">
                  <template #default="{ row }">
                    {{ new Date(row.timestamp).toLocaleTimeString() }}
                  </template>
                </el-table-column>
              </el-table>
            </el-col>
          </el-row>

          <!-- 搜索历史 -->
          <div v-if="searchHistory.length > 0" class="search-history">
            <h3>搜索历史</h3>
            <el-tag
              v-for="(item, index) in searchHistory.slice(0, 5)"
              :key="index"
              class="history-tag"
              closable
              @close="searchHistory.splice(index, 1)"
              @click="quickSearch(item.value, item.type)"
            >
              {{ item.value }} ({{ item.timestamp }})
            </el-tag>
          </div>
        </el-tab-pane>

        <!-- 区块详情标签页 -->
        <el-tab-pane label="区块详情" name="block">
          <div v-if="currentBlock">
            <div class="block-navigation">
              <el-button @click="navigateToParent" :icon="'ArrowLeft'" size="small">
                上一区块
              </el-button>
              <h3>区块 #{{ currentBlock.height }}</h3>
              <el-button @click="navigateToChild" :icon="'ArrowRight'" size="small">
                下一区块
              </el-button>
            </div>

            <el-descriptions :column="2" border>
              <el-descriptions-item label="区块高度">
                {{ currentBlock.height }}
              </el-descriptions-item>
              <el-descriptions-item label="时间戳">
                {{ formatTime(currentBlock.timestamp) }}
              </el-descriptions-item>
              <el-descriptions-item label="区块哈希" :span="2">
                <div class="hash-display">
                  {{ currentBlock.hash }}
                  <el-button
                    :icon="DocumentCopy"
                    size="small"
                    text
                    @click="copyToClipboard(currentBlock.hash)"
                  />
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="父区块哈希" :span="2">
                <div class="hash-display">
                  {{ currentBlock.parentHash }}
                  <el-button
                    :icon="DocumentCopy"
                    size="small"
                    text
                    @click="copyToClipboard(currentBlock.parentHash)"
                  />
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="矿工地址" :span="2">
                <el-link type="primary" @click="viewAccountDetail(currentBlock.miner)">
                  {{ currentBlock.miner }}
                </el-link>
                <el-button
                  :icon="DocumentCopy"
                  size="small"
                  text
                  @click="copyToClipboard(currentBlock.miner)"
                />
              </el-descriptions-item>
              <el-descriptions-item label="区块大小">
                {{ currentBlock.size }}
              </el-descriptions-item>
              <el-descriptions-item label="交易数量">
                {{ currentBlock.txCount }}
              </el-descriptions-item>
              <el-descriptions-item label="Gas 使用">
                {{ currentBlock.gasUsed }}
              </el-descriptions-item>
              <el-descriptions-item label="Gas 上限">
                {{ currentBlock.gasLimit }}
              </el-descriptions-item>
              <el-descriptions-item label="难度" :span="2">
                {{ currentBlock.difficulty }}
              </el-descriptions-item>
            </el-descriptions>

            <div class="block-transactions">
              <h3>区块内交易</h3>
              <el-table :data="recentTransactions.slice(0, currentBlock.txCount > 10 ? 10 : currentBlock.txCount)" stripe>
                <el-table-column label="交易哈希" width="180">
                  <template #default="{ row }">
                    <el-link type="primary" @click="viewTransactionDetail(row.hash)">
                      {{ formatAddress(row.hash, 12, 10) }}
                    </el-link>
                  </template>
                </el-table-column>
                <el-table-column label="发送方" width="150">
                  <template #default="{ row }">
                    <el-link type="primary" @click="viewAccountDetail(row.from)">
                      {{ formatAddress(row.from) }}
                    </el-link>
                  </template>
                </el-table-column>
                <el-table-column label="接收方" width="150">
                  <template #default="{ row }">
                    <el-link type="primary" @click="viewAccountDetail(row.to)">
                      {{ formatAddress(row.to) }}
                    </el-link>
                  </template>
                </el-table-column>
                <el-table-column prop="value" label="金额" width="130" />
                <el-table-column prop="fee" label="手续费" width="130" />
                <el-table-column label="状态">
                  <template #default="{ row }">
                    <el-tag :type="getStatusTagType(row.status)" size="small">
                      {{ row.status === 'confirmed' ? '确认' : row.status === 'pending' ? '待确认' : '失败' }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
          <el-empty v-else description="请搜索区块高度或区块哈希" />
        </el-tab-pane>

        <!-- 交易详情标签页 -->
        <el-tab-pane label="交易详情" name="transaction">
          <div v-if="currentTransaction">
            <el-alert
              :title="`交易状态: ${currentTransaction.status === 'confirmed' ? '已确认' : currentTransaction.status === 'pending' ? '待确认' : '失败'}`"
              :type="getStatusTagType(currentTransaction.status)"
              :icon="currentTransaction.status === 'confirmed' ? SuccessFilled : currentTransaction.status === 'pending' ? Clock : Warning"
              show-icon
              :closable="false"
              style="margin-bottom: 20px"
            />

            <el-descriptions :column="2" border>
              <el-descriptions-item label="交易哈希" :span="2">
                <div class="hash-display">
                  {{ currentTransaction.hash }}
                  <el-button
                    :icon="DocumentCopy"
                    size="small"
                    text
                    @click="copyToClipboard(currentTransaction.hash)"
                  />
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="getStatusTagType(currentTransaction.status)">
                  {{ currentTransaction.status === 'confirmed' ? '已确认' : currentTransaction.status === 'pending' ? '待确认' : '失败' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="确认数">
                <el-tag :type="getConfirmationTagType(currentTransaction.confirmations)">
                  {{ currentTransaction.confirmations }} 确认
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="区块高度">
                <el-link type="primary" @click="viewBlockDetail(currentTransaction.blockHeight)">
                  {{ currentTransaction.blockHeight }}
                </el-link>
              </el-descriptions-item>
              <el-descriptions-item label="时间戳">
                {{ formatTime(currentTransaction.timestamp) }}
              </el-descriptions-item>
              <el-descriptions-item label="发送方" :span="2">
                <el-link type="primary" @click="viewAccountDetail(currentTransaction.from)">
                  {{ currentTransaction.from }}
                </el-link>
                <el-button
                  :icon="DocumentCopy"
                  size="small"
                  text
                  @click="copyToClipboard(currentTransaction.from)"
                />
              </el-descriptions-item>
              <el-descriptions-item label="接收方" :span="2">
                <el-link type="primary" @click="viewAccountDetail(currentTransaction.to)">
                  {{ currentTransaction.to }}
                </el-link>
                <el-button
                  :icon="DocumentCopy"
                  size="small"
                  text
                  @click="copyToClipboard(currentTransaction.to)"
                />
              </el-descriptions-item>
              <el-descriptions-item label="转账金额">
                <span style="color: #67C23A; font-weight: bold;">{{ currentTransaction.value }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="交易手续费">
                {{ currentTransaction.fee }}
              </el-descriptions-item>
              <el-descriptions-item label="Gas 价格" :span="2">
                {{ currentTransaction.gasPrice }}
              </el-descriptions-item>
              <el-descriptions-item label="输入数据" :span="2">
                <div class="input-data">
                  <el-input
                    v-model="currentTransaction.inputData"
                    type="textarea"
                    :rows="3"
                    readonly
                  />
                </div>
              </el-descriptions-item>
            </el-descriptions>
          </div>
          <el-empty v-else description="请搜索交易哈希" />
        </el-tab-pane>

        <!-- 账户详情标签页 -->
        <el-tab-pane label="账户详情" name="account">
          <div v-if="currentAccount">
            <el-alert
              v-if="currentAccount.isContract"
              title="这是一个智能合约地址"
              type="warning"
              :icon="Warning"
              show-icon
              :closable="false"
              style="margin-bottom: 20px"
            />

            <el-descriptions :column="2" border>
              <el-descriptions-item label="账户地址" :span="2">
                <div class="hash-display">
                  {{ currentAccount.address }}
                  <el-button
                    :icon="DocumentCopy"
                    size="small"
                    text
                    @click="copyToClipboard(currentAccount.address)"
                  />
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="账户余额">
                <span style="color: #409EFF; font-weight: bold; font-size: 18px;">
                  {{ currentAccount.balance }}
                </span>
              </el-descriptions-item>
              <el-descriptions-item label="交易数量">
                {{ currentAccount.txCount.toLocaleString() }}
              </el-descriptions-item>
              <el-descriptions-item label="账户类型">
                <el-tag :type="currentAccount.isContract ? 'warning' : 'success'">
                  {{ currentAccount.isContract ? '合约账户' : '外部账户' }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>

            <div class="token-balances">
              <h3>代币持有</h3>
              <el-row :gutter="20">
                <el-col :span="8" v-for="token in currentAccount.tokens" :key="token.symbol">
                  <el-card shadow="hover" class="token-card">
                    <el-statistic :title="token.symbol" :value="token.balance">
                      <template #prefix>
                        <el-icon color="#409EFF"><Coin /></el-icon>
                      </template>
                    </el-statistic>
                  </el-card>
                </el-col>
              </el-row>
            </div>

            <div v-if="currentAccount.isContract && currentAccount.contractCode" class="contract-code">
              <h3>合约代码</h3>
              <el-input
                v-model="currentAccount.contractCode"
                type="textarea"
                :rows="8"
                readonly
                placeholder="合约字节码"
              />
              <el-button :icon="View" type="primary" style="margin-top: 10px">
                查看完整合约代码
              </el-button>
            </div>

            <div class="account-transactions">
              <h3>最近交易</h3>
              <el-table :data="recentTransactions.slice(0, 10)" stripe>
                <el-table-column label="交易哈希" width="180">
                  <template #default="{ row }">
                    <el-link type="primary" @click="viewTransactionDetail(row.hash)">
                      {{ formatAddress(row.hash, 12, 10) }}
                    </el-link>
                  </template>
                </el-table-column>
                <el-table-column label="类型" width="80">
                  <template #default="{ row }">
                    <el-tag :type="row.from === currentAccount.address ? 'danger' : 'success'" size="small">
                      {{ row.from === currentAccount.address ? '发送' : '接收' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="对方地址" width="150">
                  <template #default="{ row }">
                    <el-link type="primary" @click="viewAccountDetail(row.from === currentAccount.address ? row.to : row.from)">
                      {{ formatAddress(row.from === currentAccount.address ? row.to : row.from) }}
                    </el-link>
                  </template>
                </el-table-column>
                <el-table-column prop="value" label="金额" width="130" />
                <el-table-column label="状态" width="90">
                  <template #default="{ row }">
                    <el-tag :type="getStatusTagType(row.status)" size="small">
                      {{ row.status === 'confirmed' ? '确认' : row.status === 'pending' ? '待确认' : '失败' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="时间">
                  <template #default="{ row }">
                    {{ formatTime(row.timestamp) }}
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
          <el-empty v-else description="请搜索账户地址" />
        </el-tab-pane>

        <!-- 统计分析标签页 -->
        <el-tab-pane label="统计分析" name="statistics">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-card shadow="hover">
                <template #header>
                  <div class="card-header">
                    <span>区块生成趋势（24小时）</span>
                  </div>
                </template>
                <div class="chart-placeholder">
                  <el-table :data="chartStats.blockData" stripe style="width: 100%">
                    <el-table-column prop="time" label="时间" width="120" />
                    <el-table-column prop="count" label="区块数量" />
                  </el-table>
                </div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card shadow="hover">
                <template #header>
                  <div class="card-header">
                    <span>交易量趋势（24小时）</span>
                  </div>
                </template>
                <div class="chart-placeholder">
                  <el-table :data="chartStats.txData" stripe style="width: 100%">
                    <el-table-column prop="time" label="时间" width="120" />
                    <el-table-column prop="count" label="交易数量" />
                  </el-table>
                </div>
              </el-card>
            </el-col>
          </el-row>

          <el-row :gutter="20" style="margin-top: 20px">
            <el-col :span="8">
              <el-card shadow="hover">
                <el-statistic title="24小时交易量" value="1,458,932" />
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover">
                <el-statistic title="24小时活跃地址" value="458,123" />
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover">
                <el-statistic title="平均手续费" value="0.0023" suffix="ETH" />
              </el-card>
            </el-col>
          </el-row>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.block-explorer {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 100px);

  .search-card {
    margin-bottom: 20px;

    .search-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      h2 {
        margin: 0;
        color: #303133;
        font-size: 24px;
      }
    }

    .search-box {
      margin-bottom: 15px;
    }

    .hot-searches {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 25px;
      flex-wrap: wrap;

      .label {
        color: #909399;
        font-size: 14px;
      }

      .hot-tag {
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
      }
    }

    .overview-stats {
      margin-top: 25px;
      padding-top: 25px;
      border-top: 1px solid #e4e7ed;

      .stat-item {
        text-align: center;

        .stat-title {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          color: #909399;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #303133;
        }
      }
    }

    .overview-info {
      margin-top: 15px;

      .info-item {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #606266;
        font-size: 14px;
      }
    }
  }

  .detail-card {
    h3 {
      margin: 20px 0 15px 0;
      color: #303133;
      font-size: 18px;
      font-weight: 600;
    }

    .block-navigation {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding: 15px;
      background-color: #f5f7fa;
      border-radius: 4px;

      h3 {
        margin: 0;
      }
    }

    .hash-display {
      display: flex;
      align-items: center;
      gap: 10px;
      word-break: break-all;
    }

    .block-transactions,
    .account-transactions {
      margin-top: 30px;
    }

    .input-data {
      width: 100%;
    }

    .token-balances {
      margin-top: 30px;

      .token-card {
        text-align: center;
      }
    }

    .contract-code {
      margin-top: 30px;
    }

    .search-history {
      margin-top: 30px;

      .history-tag {
        margin-right: 10px;
        margin-bottom: 10px;
        cursor: pointer;

        &:hover {
          opacity: 0.8;
        }
      }
    }

    .chart-placeholder {
      min-height: 300px;
    }

    .card-header {
      font-weight: 600;
      color: #303133;
    }
  }
}

:deep(.el-statistic__head) {
  font-size: 14px;
  color: #909399;
}

:deep(.el-statistic__number) {
  font-size: 24px;
  font-weight: 600;
}

:deep(.el-descriptions__label) {
  font-weight: 600;
}

:deep(.el-table) {
  font-size: 14px;
}
</style>