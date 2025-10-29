<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Refresh,
  View,
  Warning,
  Clock,
  DataAnalysis,
  TrendCharts,
  Connection,
  VideoPlay
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// 类型定义
interface ContractCall {
  id: string
  txHash: string
  contractAddress: string
  methodName: string
  caller: string
  callTime: string
  status: 'success' | 'failed' | 'executing' | 'pending'
  gasUsed: number
  gasPrice: string
  executionTime: number
  parameters: Record<string, any>
  returnValue: any
  eventLogs: EventLog[]
  errorMessage?: string
  blockNumber: number
}

interface EventLog {
  eventName: string
  parameters: Record<string, any>
  timestamp: string
}

interface CallStatistics {
  totalCalls: number
  successRate: number
  avgResponseTime: number
  avgGasUsed: number
  activeCalls: number
  failedCalls: number
}

interface MethodStats {
  methodName: string
  callCount: number
  avgGasUsed: number
  avgExecutionTime: number
  successRate: number
}

// 响应式数据
const loading = ref(false)
const autoRefresh = ref(true)
const refreshInterval = ref<number | null>(null)
const searchCaller = ref('')
const filterMethod = ref('')
const filterStatus = ref('')
const callRecords = ref<ContractCall[]>([])
const currentPage = ref(1)
const pageSize = ref(10)

// 详情抽屉
const detailDrawerVisible = ref(false)
const currentCall = ref<ContractCall | null>(null)

// 统计数据
const statistics = ref<CallStatistics>({
  totalCalls: 0,
  successRate: 0,
  avgResponseTime: 0,
  avgGasUsed: 0,
  activeCalls: 0,
  failedCalls: 0
})

// 方法统计
const methodStats = ref<MethodStats[]>([])

// 图表相关
const callTrendChart = ref<HTMLElement | null>(null)
const gasUsageChart = ref<HTMLElement | null>(null)
const methodDistributionChart = ref<HTMLElement | null>(null)
const callTrendChartInstance = ref<echarts.ECharts | null>(null)
const gasUsageChartInstance = ref<echarts.ECharts | null>(null)
const methodDistributionChartInstance = ref<echarts.ECharts | null>(null)

// 方法选项（从调用记录中提取）
const methodOptions = computed(() => {
  const methods = new Set(callRecords.value.map(record => record.methodName))
  return Array.from(methods).map(method => ({ label: method, value: method }))
})

// 状态选项
const statusOptions = [
  { label: '成功', value: 'success' },
  { label: '失败', value: 'failed' },
  { label: '执行中', value: 'executing' },
  { label: '待确认', value: 'pending' }
]

// 过滤后的调用记录
const filteredCallRecords = computed(() => {
  return callRecords.value.filter(record => {
    const matchCaller = !searchCaller.value || record.caller.toLowerCase().includes(searchCaller.value.toLowerCase())
    const matchMethod = !filterMethod.value || record.methodName === filterMethod.value
    const matchStatus = !filterStatus.value || record.status === filterStatus.value
    return matchCaller && matchMethod && matchStatus
  })
})

// 分页后的数据
const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredCallRecords.value.slice(start, end)
})

// 状态标签类型
const getStatusType = (status: string) => {
  const typeMap: Record<string, any> = {
    success: 'success',
    failed: 'danger',
    executing: 'primary',
    pending: 'warning'
  }
  return typeMap[status] || 'info'
}

// 状态文本
const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    success: '成功',
    failed: '失败',
    executing: '执行中',
    pending: '待确认'
  }
  return textMap[status] || status
}

// Gas消耗等级
const getGasLevel = (gasUsed: number) => {
  if (gasUsed < 50000) return { text: '低', type: 'success' }
  if (gasUsed < 200000) return { text: '中', type: 'warning' }
  return { text: '高', type: 'danger' }
}

// 格式化地址
const formatAddress = (address: string) => {
  if (!address || address.length < 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// 格式化时间
const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN')
}

// 生成 Mock 数据
const generateMockData = () => {
  const methods = ['transfer', 'approve', 'mint', 'burn', 'setPrice', 'updateMetadata', 'withdraw', 'deposit']
  const addresses = [
    '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    '0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7',
    '0x1234567890123456789012345678901234567890',
    '0xabcdef0123456789abcdef0123456789abcdef01',
    '0x9876543210987654321098765432109876543210'
  ]
  const statuses: Array<'success' | 'failed' | 'executing' | 'pending'> = ['success', 'success', 'success', 'failed', 'pending']

  const records: ContractCall[] = []
  const now = Date.now()

  for (let i = 0; i < 50; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const method = methods[Math.floor(Math.random() * methods.length)]
    const gasUsed = Math.floor(Math.random() * 300000) + 21000
    
    records.push({
      id: `call-${i + 1}`,
      txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      contractAddress: addresses[Math.floor(Math.random() * addresses.length)],
      methodName: method,
      caller: addresses[Math.floor(Math.random() * addresses.length)],
      callTime: new Date(now - Math.random() * 86400000 * 7).toISOString(),
      status,
      gasUsed,
      gasPrice: (Math.random() * 50 + 10).toFixed(2) + ' Gwei',
      executionTime: Math.floor(Math.random() * 5000) + 100,
      parameters: generateParameters(method),
      returnValue: status === 'success' ? generateReturnValue(method) : null,
      eventLogs: status === 'success' ? generateEventLogs(method) : [],
      errorMessage: status === 'failed' ? generateErrorMessage() : undefined,
      blockNumber: 18000000 + Math.floor(Math.random() * 100000)
    })
  }

  // 按时间倒序排列
  records.sort((a, b) => new Date(b.callTime).getTime() - new Date(a.callTime).getTime())
  
  return records
}

// 生成参数
const generateParameters = (method: string): Record<string, any> => {
  const paramMap: Record<string, any> = {
    transfer: { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', amount: '1000000000000000000' },
    approve: { spender: '0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7', amount: '1000000000000000000' },
    mint: { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', tokenId: '123', amount: '1' },
    burn: { tokenId: '456', amount: '1' },
    setPrice: { price: '1000000000000000000' },
    updateMetadata: { tokenId: '789', uri: 'https://example.com/metadata/789.json' },
    withdraw: { amount: '500000000000000000' },
    deposit: { amount: '2000000000000000000' }
  }
  return paramMap[method] || {}
}

// 生成返回值
const generateReturnValue = (method: string): any => {
  const returnMap: Record<string, any> = {
    transfer: true,
    approve: true,
    mint: { tokenId: '123', success: true },
    burn: { success: true },
    setPrice: { oldPrice: '900000000000000000', newPrice: '1000000000000000000' },
    updateMetadata: { success: true },
    withdraw: { amount: '500000000000000000' },
    deposit: { totalDeposit: '2500000000000000000' }
  }
  return returnMap[method] || { success: true }
}

// 生成事件日志
const generateEventLogs = (method: string): EventLog[] => {
  const now = new Date().toISOString()
  const eventMap: Record<string, EventLog[]> = {
    transfer: [
      { eventName: 'Transfer', parameters: { from: '0x742d...', to: '0x8920...', value: '1000000000000000000' }, timestamp: now }
    ],
    approve: [
      { eventName: 'Approval', parameters: { owner: '0x742d...', spender: '0x8920...', value: '1000000000000000000' }, timestamp: now }
    ],
    mint: [
      { eventName: 'Transfer', parameters: { from: '0x0000...', to: '0x742d...', tokenId: '123' }, timestamp: now },
      { eventName: 'Mint', parameters: { to: '0x742d...', tokenId: '123', amount: '1' }, timestamp: now }
    ],
    burn: [
      { eventName: 'Transfer', parameters: { from: '0x742d...', to: '0x0000...', tokenId: '456' }, timestamp: now },
      { eventName: 'Burn', parameters: { from: '0x742d...', tokenId: '456', amount: '1' }, timestamp: now }
    ]
  }
  return eventMap[method] || [{ eventName: 'Success', parameters: {}, timestamp: now }]
}

// 生成错误信息
const generateErrorMessage = (): string => {
  const errors = [
    'Gas estimation failed',
    'Insufficient balance',
    'Revert: Ownable: caller is not the owner',
    'Revert: ERC20: transfer amount exceeds balance',
    'Revert: ERC721: token already minted',
    'Transaction timeout'
  ]
  return errors[Math.floor(Math.random() * errors.length)]
}

// 计算统计数据
const calculateStatistics = () => {
  const total = callRecords.value.length
  const successful = callRecords.value.filter(r => r.status === 'success').length
  const failed = callRecords.value.filter(r => r.status === 'failed').length
  const active = callRecords.value.filter(r => r.status === 'executing').length
  const avgTime = callRecords.value.reduce((sum, r) => sum + r.executionTime, 0) / total || 0
  const avgGas = callRecords.value.reduce((sum, r) => sum + r.gasUsed, 0) / total || 0

  statistics.value = {
    totalCalls: total,
    successRate: total > 0 ? (successful / total * 100) : 0,
    avgResponseTime: avgTime,
    avgGasUsed: avgGas,
    activeCalls: active,
    failedCalls: failed
  }
}

// 计算方法统计
const calculateMethodStats = () => {
  const methodMap = new Map<string, { calls: ContractCall[], success: number }>()

  callRecords.value.forEach(record => {
    if (!methodMap.has(record.methodName)) {
      methodMap.set(record.methodName, { calls: [], success: 0 })
    }
    const stats = methodMap.get(record.methodName)!
    stats.calls.push(record)
    if (record.status === 'success') {
      stats.success++
    }
  })

  methodStats.value = Array.from(methodMap.entries()).map(([methodName, data]) => {
    const callCount = data.calls.length
    const avgGas = data.calls.reduce((sum, c) => sum + c.gasUsed, 0) / callCount
    const avgTime = data.calls.reduce((sum, c) => sum + c.executionTime, 0) / callCount
    const successRate = (data.success / callCount) * 100

    return {
      methodName,
      callCount,
      avgGasUsed: avgGas,
      avgExecutionTime: avgTime,
      successRate
    }
  }).sort((a, b) => b.callCount - a.callCount)
}

// 初始化调用趋势图表
const initCallTrendChart = () => {
  if (!callTrendChart.value) return

  const chart = echarts.init(callTrendChart.value)
  callTrendChartInstance.value = chart

  // 生成最近24小时的数据
  const hours: string[] = []
  const successData: number[] = []
  const failedData: number[] = []
  const now = new Date()

  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 3600000)
    hours.push(`${hour.getHours()}:00`)
    
    const hourStart = hour.getTime()
    const hourEnd = hourStart + 3600000
    
    const hourCalls = callRecords.value.filter(r => {
      const callTime = new Date(r.callTime).getTime()
      return callTime >= hourStart && callTime < hourEnd
    })
    
    successData.push(hourCalls.filter(r => r.status === 'success').length)
    failedData.push(hourCalls.filter(r => r.status === 'failed').length)
  }

  const option = {
    title: {
      text: '调用趋势',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['成功', '失败'],
      top: 30
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 60,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: hours
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '成功',
        type: 'line',
        smooth: true,
        data: successData,
        itemStyle: { color: '#67C23A' },
        areaStyle: { color: 'rgba(103, 194, 58, 0.2)' }
      },
      {
        name: '失败',
        type: 'line',
        smooth: true,
        data: failedData,
        itemStyle: { color: '#F56C6C' },
        areaStyle: { color: 'rgba(245, 108, 108, 0.2)' }
      }
    ]
  }

  chart.setOption(option)
}

// 初始化Gas使用图表
const initGasUsageChart = () => {
  if (!gasUsageChart.value) return

  const chart = echarts.init(gasUsageChart.value)
  gasUsageChartInstance.value = chart

  const gasRanges = [
    { name: '< 50k', min: 0, max: 50000 },
    { name: '50k-100k', min: 50000, max: 100000 },
    { name: '100k-200k', min: 100000, max: 200000 },
    { name: '200k-300k', min: 200000, max: 300000 },
    { name: '> 300k', min: 300000, max: Infinity }
  ]

  const data = gasRanges.map(range => {
    return callRecords.value.filter(r => r.gasUsed >= range.min && r.gasUsed < range.max).length
  })

  const option = {
    title: {
      text: 'Gas 消耗分布',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 60,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: gasRanges.map(r => r.name)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '调用次数',
        type: 'bar',
        data: data,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#409EFF' },
            { offset: 1, color: '#67C23A' }
          ])
        }
      }
    ]
  }

  chart.setOption(option)
}

// 初始化方法分布图表
const initMethodDistributionChart = () => {
  if (!methodDistributionChart.value) return

  const chart = echarts.init(methodDistributionChart.value)
  methodDistributionChartInstance.value = chart

  const data = methodStats.value.slice(0, 8).map(stat => ({
    name: stat.methodName,
    value: stat.callCount
  }))

  const option = {
    title: {
      text: '方法调用分布',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: { fontSize: 12 }
    },
    series: [
      {
        name: '调用次数',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: data
      }
    ]
  }

  chart.setOption(option)
}

// 查看详情
const viewDetail = (record: ContractCall) => {
  currentCall.value = record
  detailDrawerVisible.value = true
}

// 重试调用
const retryCall = async (record: ContractCall) => {
  try {
    await ElMessageBox.confirm(
      `确定要重试调用 ${record.methodName} 方法吗？`,
      '重试确认',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    loading.value = true
    
    // 模拟重试
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 更新记录状态
    record.status = 'success'
    record.errorMessage = undefined
    record.returnValue = generateReturnValue(record.methodName)
    record.eventLogs = generateEventLogs(record.methodName)
    
    ElMessage.success('重试成功')
    calculateStatistics()
    updateCharts()
  } catch {
    // 用户取消
  } finally {
    loading.value = false
  }
}

// 刷新数据
const refreshData = async () => {
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 模拟添加新的调用记录
    const newRecords = generateMockData().slice(0, 3)
    callRecords.value.unshift(...newRecords)
    
    // 保持记录数量在合理范围
    if (callRecords.value.length > 100) {
      callRecords.value = callRecords.value.slice(0, 100)
    }
    
    calculateStatistics()
    calculateMethodStats()
    updateCharts()
    
    ElMessage.success('刷新成功')
  } catch (error) {
    ElMessage.error('刷新失败')
  } finally {
    loading.value = false
  }
}

// 更新图表
const updateCharts = () => {
  initCallTrendChart()
  initGasUsageChart()
  initMethodDistributionChart()
}

// 自动刷新
const startAutoRefresh = () => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
  refreshInterval.value = window.setInterval(() => {
    if (autoRefresh.value) {
      refreshData()
    }
  }, 30000) // 30秒刷新一次
}

// 停止自动刷新
const stopAutoRefresh = () => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
}

// 重置筛选
const resetFilters = () => {
  searchCaller.value = ''
  filterMethod.value = ''
  filterStatus.value = ''
  currentPage.value = 1
}

// 导出数据
const exportData = () => {
  ElMessage.success('导出功能开发中...')
}

// 页面大小改变
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
}

// 页码改变
const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

// 初始化
const init = async () => {
  loading.value = true
  try {
    // 模拟加载数据
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    callRecords.value = generateMockData()
    calculateStatistics()
    calculateMethodStats()
    
    // 等待DOM更新后初始化图表
    setTimeout(() => {
      initCallTrendChart()
      initGasUsageChart()
      initMethodDistributionChart()
    }, 100)
    
    startAutoRefresh()
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 监听窗口大小变化
const handleResize = () => {
  callTrendChartInstance.value?.resize()
  gasUsageChartInstance.value?.resize()
  methodDistributionChartInstance.value?.resize()
}

// 生命周期
onMounted(() => {
  init()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  stopAutoRefresh()
  window.removeEventListener('resize', handleResize)
  callTrendChartInstance.value?.dispose()
  gasUsageChartInstance.value?.dispose()
  methodDistributionChartInstance.value?.dispose()
})
</script>

<template>
  <div class="contract-monitor-container">
    <!-- 统计卡片区域 -->
    <el-row :gutter="16" class="statistics-row">
      <el-col :xs="24" :sm="12" :md="8" :lg="4">
        <el-card shadow="hover" class="stat-card">
          <el-statistic title="总调用次数" :value="statistics.totalCalls">
            <template #prefix>
              <el-icon style="vertical-align: middle; color: #409eff">
                <Connection />
              </el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="8" :lg="4">
        <el-card shadow="hover" class="stat-card">
          <el-statistic title="成功率" :value="statistics.successRate" :precision="2" suffix="%">
            <template #prefix>
              <el-icon style="vertical-align: middle; color: #67c23a">
                <TrendCharts />
              </el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="8" :lg="4">
        <el-card shadow="hover" class="stat-card">
          <el-statistic title="平均响应时间" :value="statistics.avgResponseTime" :precision="0" suffix="ms">
            <template #prefix>
              <el-icon style="vertical-align: middle; color: #e6a23c">
                <Clock />
              </el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="8" :lg="4">
        <el-card shadow="hover" class="stat-card">
          <el-statistic title="平均 Gas" :value="statistics.avgGasUsed" :precision="0">
            <template #prefix>
              <el-icon style="vertical-align: middle; color: #909399">
                <DataAnalysis />
              </el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="8" :lg="4">
        <el-card shadow="hover" class="stat-card">
          <el-statistic title="活跃调用" :value="statistics.activeCalls">
            <template #prefix>
              <el-icon style="vertical-align: middle; color: #409eff">
                <VideoPlay />
              </el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="8" :lg="4">
        <el-card shadow="hover" class="stat-card">
          <el-statistic title="失败调用" :value="statistics.failedCalls">
            <template #prefix>
              <el-icon style="vertical-align: middle; color: #f56c6c">
                <Warning />
              </el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="16" class="charts-row">
      <el-col :xs="24" :sm="24" :md="12" :lg="8">
        <el-card shadow="hover">
          <div ref="callTrendChart" style="width: 100%; height: 300px"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="24" :md="12" :lg="8">
        <el-card shadow="hover">
          <div ref="gasUsageChart" style="width: 100%; height: 300px"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="24" :md="24" :lg="8">
        <el-card shadow="hover">
          <div ref="methodDistributionChart" style="width: 100%; height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 筛选和操作区域 -->
    <el-card shadow="hover" class="filter-card">
      <el-row :gutter="16" align="middle">
        <el-col :xs="24" :sm="12" :md="6" :lg="4">
          <el-input
            v-model="searchCaller"
            placeholder="搜索调用方地址"
            clearable
            :prefix-icon="Search"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="4">
          <el-select v-model="filterMethod" placeholder="选择调用方法" clearable style="width: 100%">
            <el-option
              v-for="option in methodOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="4">
          <el-select v-model="filterStatus" placeholder="选择状态" clearable style="width: 100%">
            <el-option
              v-for="option in statusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="4">
          <el-checkbox v-model="autoRefresh" label="自动刷新" />
        </el-col>
        <el-col :xs="24" :sm="24" :md="24" :lg="8" class="button-group">
          <el-button type="primary" :icon="Refresh" @click="refreshData" :loading="loading">
            刷新
          </el-button>
          <el-button @click="resetFilters">重置筛选</el-button>
          <el-button @click="exportData">导出数据</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 调用记录列表 -->
    <el-card shadow="hover" class="table-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">调用记录列表</span>
          <span class="record-count">共 {{ filteredCallRecords.length }} 条记录</span>
        </div>
      </template>

      <el-table
        :data="paginatedRecords"
        v-loading="loading"
        stripe
        border
        style="width: 100%"
        :default-sort="{ prop: 'callTime', order: 'descending' }"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        
        <el-table-column prop="txHash" label="交易哈希" width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link type="primary" :underline="false">{{ formatAddress(row.txHash) }}</el-link>
          </template>
        </el-table-column>

        <el-table-column prop="contractAddress" label="合约地址" width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link type="primary" :underline="false">{{ formatAddress(row.contractAddress) }}</el-link>
          </template>
        </el-table-column>

        <el-table-column prop="methodName" label="调用方法" width="140" align="center">
          <template #default="{ row }">
            <el-tag>{{ row.methodName }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="caller" label="调用方" width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ formatAddress(row.caller) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="callTime" label="调用时间" width="180" sortable>
          <template #default="{ row }">
            {{ formatTime(row.callTime) }}
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="gasUsed" label="Gas 消耗" width="140" align="center" sortable>
          <template #default="{ row }">
            <el-tag :type="getGasLevel(row.gasUsed).type" size="small">
              {{ row.gasUsed.toLocaleString() }}
            </el-tag>
            <div style="font-size: 12px; color: #909399; margin-top: 4px">
              {{ getGasLevel(row.gasUsed).text }}
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="executionTime" label="执行时间" width="120" align="center" sortable>
          <template #default="{ row }">
            {{ row.executionTime }} ms
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="View" @click="viewDetail(row)">
              详情
            </el-button>
            <el-button
              v-if="row.status === 'failed'"
              link
              type="warning"
              :icon="Refresh"
              @click="retryCall(row)"
            >
              重试
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredCallRecords.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 方法统计表格 -->
    <el-card shadow="hover" class="stats-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">方法性能统计</span>
        </div>
      </template>

      <el-table :data="methodStats" stripe border>
        <el-table-column prop="methodName" label="方法名称" width="150" align="center">
          <template #default="{ row }">
            <el-tag type="info">{{ row.methodName }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="callCount" label="调用次数" width="120" align="center" sortable>
          <template #default="{ row }">
            <strong>{{ row.callCount }}</strong>
          </template>
        </el-table-column>

        <el-table-column prop="avgGasUsed" label="平均 Gas" width="150" align="center" sortable>
          <template #default="{ row }">
            {{ row.avgGasUsed.toFixed(0) }}
          </template>
        </el-table-column>

        <el-table-column prop="avgExecutionTime" label="平均执行时间" width="150" align="center" sortable>
          <template #default="{ row }">
            {{ row.avgExecutionTime.toFixed(0) }} ms
          </template>
        </el-table-column>

        <el-table-column prop="successRate" label="成功率" width="200" align="center" sortable>
          <template #default="{ row }">
            <el-progress
              :percentage="row.successRate"
              :color="row.successRate >= 90 ? '#67C23A' : row.successRate >= 70 ? '#E6A23C' : '#F56C6C'"
            />
          </template>
        </el-table-column>

        <el-table-column label="状态评估" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.successRate >= 95" type="success">优秀</el-tag>
            <el-tag v-else-if="row.successRate >= 85" type="primary">良好</el-tag>
            <el-tag v-else-if="row.successRate >= 70" type="warning">一般</el-tag>
            <el-tag v-else type="danger">需优化</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 详情抽屉 -->
    <el-drawer
      v-model="detailDrawerVisible"
      title="调用详情"
      direction="rtl"
      size="50%"
      :destroy-on-close="true"
    >
      <div v-if="currentCall" class="detail-content">
        <!-- 基本信息 -->
        <el-card shadow="never" class="detail-section">
          <template #header>
            <span class="section-title">基本信息</span>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="交易哈希">
              <el-link type="primary" :underline="false">{{ currentCall.txHash }}</el-link>
            </el-descriptions-item>
            <el-descriptions-item label="区块高度">
              {{ currentCall.blockNumber }}
            </el-descriptions-item>
            <el-descriptions-item label="合约地址">
              <el-link type="primary" :underline="false">{{ currentCall.contractAddress }}</el-link>
            </el-descriptions-item>
            <el-descriptions-item label="调用方法">
              <el-tag>{{ currentCall.methodName }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="调用方">
              {{ currentCall.caller }}
            </el-descriptions-item>
            <el-descriptions-item label="调用时间">
              {{ formatTime(currentCall.callTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getStatusType(currentCall.status)">
                {{ getStatusText(currentCall.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="执行时间">
              {{ currentCall.executionTime }} ms
            </el-descriptions-item>
            <el-descriptions-item label="Gas 消耗">
              <el-tag :type="getGasLevel(currentCall.gasUsed).type">
                {{ currentCall.gasUsed.toLocaleString() }} ({{ getGasLevel(currentCall.gasUsed).text }})
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="Gas 价格">
              {{ currentCall.gasPrice }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 调用参数 -->
        <el-card shadow="never" class="detail-section">
          <template #header>
            <span class="section-title">调用参数</span>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item
              v-for="(value, key) in currentCall.parameters"
              :key="key"
              :label="key"
            >
              <code>{{ value }}</code>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 返回值 -->
        <el-card shadow="never" class="detail-section" v-if="currentCall.returnValue">
          <template #header>
            <span class="section-title">返回值</span>
          </template>
          <pre class="code-block">{{ JSON.stringify(currentCall.returnValue, null, 2) }}</pre>
        </el-card>

        <!-- 错误信息 -->
        <el-card shadow="never" class="detail-section" v-if="currentCall.errorMessage">
          <template #header>
            <span class="section-title">错误信息</span>
          </template>
          <el-alert :title="currentCall.errorMessage" type="error" :closable="false" show-icon />
        </el-card>

        <!-- 事件日志 -->
        <el-card shadow="never" class="detail-section" v-if="currentCall.eventLogs.length > 0">
          <template #header>
            <span class="section-title">事件日志</span>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(log, index) in currentCall.eventLogs"
              :key="index"
              :timestamp="formatTime(log.timestamp)"
              placement="top"
            >
              <el-card>
                <h4>{{ log.eventName }}</h4>
                <el-descriptions :column="1" size="small">
                  <el-descriptions-item
                    v-for="(value, key) in log.parameters"
                    :key="key"
                    :label="key"
                  >
                    {{ value }}
                  </el-descriptions-item>
                </el-descriptions>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-card>

        <!-- 调用链路追踪 -->
        <el-card shadow="never" class="detail-section">
          <template #header>
            <span class="section-title">调用链路追踪</span>
          </template>
          <el-timeline>
            <el-timeline-item timestamp="交易提交" placement="top">
              <el-tag type="info">交易已提交到内存池</el-tag>
            </el-timeline-item>
            <el-timeline-item timestamp="交易确认" placement="top">
              <el-tag type="primary">交易已被矿工打包</el-tag>
            </el-timeline-item>
            <el-timeline-item timestamp="合约执行" placement="top">
              <el-tag type="primary">智能合约开始执行</el-tag>
            </el-timeline-item>
            <el-timeline-item timestamp="执行完成" placement="top">
              <el-tag :type="currentCall.status === 'success' ? 'success' : 'danger'">
                {{ currentCall.status === 'success' ? '执行成功' : '执行失败' }}
              </el-tag>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
.contract-monitor-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);

  .statistics-row {
    margin-bottom: 20px;
  }

  .stat-card {
    margin-bottom: 16px;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-4px);
    }

    :deep(.el-card__body) {
      padding: 20px;
    }

    :deep(.el-statistic__head) {
      font-size: 14px;
      color: #909399;
      margin-bottom: 8px;
    }

    :deep(.el-statistic__content) {
      font-size: 24px;
      font-weight: bold;
    }
  }

  .charts-row {
    margin-bottom: 20px;

    .el-col {
      margin-bottom: 16px;
    }
  }

  .filter-card {
    margin-bottom: 20px;

    :deep(.el-card__body) {
      padding: 20px;
    }

    .el-col {
      margin-bottom: 10px;
    }

    .button-group {
      display: flex;
      justify-content: flex-start;
      gap: 10px;

      @media (min-width: 1200px) {
        justify-content: flex-end;
      }
    }
  }

  .table-card {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .card-title {
        font-size: 16px;
        font-weight: bold;
        color: #303133;
      }

      .record-count {
        font-size: 14px;
        color: #909399;
      }
    }

    .pagination-container {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }

  .stats-card {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .card-title {
        font-size: 16px;
        font-weight: bold;
        color: #303133;
      }
    }
  }

  .detail-content {
    .detail-section {
      margin-bottom: 20px;

      &:last-child {
        margin-bottom: 0;
      }

      .section-title {
        font-size: 16px;
        font-weight: bold;
        color: #303133;
      }

      .code-block {
        background-color: #f5f7fa;
        border: 1px solid #dcdfe6;
        border-radius: 4px;
        padding: 15px;
        font-family: 'Courier New', monospace;
        font-size: 14px;
        line-height: 1.6;
        overflow-x: auto;
        white-space: pre-wrap;
        word-wrap: break-word;
      }

      code {
        background-color: #f5f7fa;
        padding: 2px 6px;
        border-radius: 3px;
        font-family: 'Courier New', monospace;
        font-size: 13px;
        color: #e6a23c;
      }

      :deep(.el-timeline-item__timestamp) {
        font-size: 13px;
        color: #909399;
      }

      h4 {
        margin: 0 0 10px 0;
        font-size: 15px;
        color: #303133;
      }
    }
  }
}

// 响应式布局
@media (max-width: 768px) {
  .contract-monitor-container {
    padding: 10px;

    .el-drawer {
      width: 90% !important;
    }
  }
}
</style>
