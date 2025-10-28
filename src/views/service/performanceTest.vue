<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Timer, Odometer, Warning, User } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

// 类型定义
interface TestScenario {
  name: string
  concurrentUsers: number
  duration: number
  requestRate: number
}

interface TestConfig {
  scenarioType: string
  concurrentUsers: number
  duration: number
  requestRate: number
  apiEndpoint: string
  requestMethod: string
  requestParams: string
  customScenarioName: string
}

interface PerformanceMetrics {
  timestamp: string
  responseTime: number
  throughput: number
  errorRate: number
  concurrentUsers: number
  cpuUsage: number
  memoryUsage: number
}

interface TestResult {
  id: string
  scenarioName: string
  startTime: string
  endTime: string
  duration: number
  totalRequests: number
  successRequests: number
  failedRequests: number
  avgResponseTime: number
  p95ResponseTime: number
  maxResponseTime: number
  minResponseTime: number
  avgThroughput: number
  avgErrorRate: number
  avgCpuUsage: number
  avgMemoryUsage: number
  status: 'success' | 'failed' | 'stopped'
  errors: Array<{ type: string; count: number; message: string }>
}

// 测试状态枚举
type TestStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error'

// 场景模板
const scenarioTemplates: TestScenario[] = [
  { name: '低压力', concurrentUsers: 10, duration: 60, requestRate: 10 },
  { name: '常规压力', concurrentUsers: 50, duration: 300, requestRate: 50 },
  { name: '峰值压力', concurrentUsers: 200, duration: 600, requestRate: 200 },
]

// 测试配置
const testConfig = reactive<TestConfig>({
  scenarioType: 'low',
  concurrentUsers: 10,
  duration: 60,
  requestRate: 10,
  apiEndpoint: '/api/v1/test/endpoint',
  requestMethod: 'GET',
  requestParams: '{}',
  customScenarioName: '',
})

// 测试状态
const testStatus = ref<TestStatus>('idle')
const testProgress = ref(0)
const remainingTime = ref(0)
const currentMetrics = reactive<PerformanceMetrics>({
  timestamp: '',
  responseTime: 0,
  throughput: 0,
  errorRate: 0,
  concurrentUsers: 0,
  cpuUsage: 0,
  memoryUsage: 0,
})

// 实时数据
const metricsHistory = ref<PerformanceMetrics[]>([])
const currentTestResult = ref<TestResult | null>(null)

// 历史记录
const historyRecords = ref<TestResult[]>([])
const historyTableLoading = ref(false)
const historyDateRange = ref<[Date, Date] | null>(null)
const historyStatusFilter = ref('')

// 保存的场景
const savedScenarios = ref<Array<{ name: string; config: TestConfig }>>([])

// ECharts 实例
let responseTimeChart: echarts.ECharts | null = null
let throughputChart: echarts.ECharts | null = null
let resourceChart: echarts.ECharts | null = null

// 定时器
let metricsUpdateTimer: number | null = null
let testProgressTimer: number | null = null

// 计算属性
const testStatusText = computed(() => {
  const statusMap = {
    idle: '未开始',
    running: '进行中',
    paused: '已暂停',
    completed: '已完成',
    error: '错误',
  }
  return statusMap[testStatus.value]
})

const testStatusType = computed(() => {
  const typeMap = {
    idle: 'info',
    running: 'success',
    paused: 'warning',
    completed: 'success',
    error: 'danger',
  }
  return typeMap[testStatus.value]
})

const canStartTest = computed(() => {
  return testStatus.value === 'idle' || testStatus.value === 'completed'
})

const canPauseTest = computed(() => {
  return testStatus.value === 'running'
})

const canResumeTest = computed(() => {
  return testStatus.value === 'paused'
})

const canStopTest = computed(() => {
  return testStatus.value === 'running' || testStatus.value === 'paused'
})

const filteredHistoryRecords = computed(() => {
  let records = [...historyRecords.value]
  
  // 按状态筛选
  if (historyStatusFilter.value) {
    records = records.filter((r) => r.status === historyStatusFilter.value)
  }
  
  // 按时间范围筛选
  if (historyDateRange.value && historyDateRange.value.length === 2) {
    const [start, end] = historyDateRange.value
    records = records.filter((r) => {
      const recordDate = new Date(r.startTime)
      return recordDate >= start && recordDate <= end
    })
  }
  
  return records
})

// 场景模板选择
const onScenarioTypeChange = (type: string) => {
  const templateMap: Record<string, TestScenario> = {
    low: scenarioTemplates[0],
    normal: scenarioTemplates[1],
    peak: scenarioTemplates[2],
  }
  
  const template = templateMap[type]
  if (template) {
    testConfig.concurrentUsers = template.concurrentUsers
    testConfig.duration = template.duration
    testConfig.requestRate = template.requestRate
  }
}

// 保存自定义场景
const saveCustomScenario = () => {
  if (!testConfig.customScenarioName) {
    ElMessage.warning('请输入场景名称')
    return
  }
  
  const scenario = {
    name: testConfig.customScenarioName,
    config: { ...testConfig },
  }
  
  savedScenarios.value.push(scenario)
  ElMessage.success(`场景 "${testConfig.customScenarioName}" 已保存`)
  testConfig.customScenarioName = ''
}

// 加载自定义场景
const loadCustomScenario = (scenarioName: string) => {
  const scenario = savedScenarios.value.find((s) => s.name === scenarioName)
  if (scenario) {
    Object.assign(testConfig, scenario.config)
    ElMessage.success(`场景 "${scenarioName}" 已加载`)
  }
}

// 开始测试
const startTest = async () => {
  try {
    // 验证配置
    if (!testConfig.apiEndpoint) {
      ElMessage.warning('请输入 API 端点')
      return
    }
    
    testStatus.value = 'running'
    testProgress.value = 0
    remainingTime.value = testConfig.duration
    metricsHistory.value = []
    
    // 初始化当前测试结果
    currentTestResult.value = {
      id: Date.now().toString(),
      scenarioName: testConfig.customScenarioName || scenarioTemplates.find(t => 
        t.concurrentUsers === testConfig.concurrentUsers
      )?.name || '自定义场景',
      startTime: new Date().toISOString(),
      endTime: '',
      duration: testConfig.duration,
      totalRequests: 0,
      successRequests: 0,
      failedRequests: 0,
      avgResponseTime: 0,
      p95ResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: 0,
      avgThroughput: 0,
      avgErrorRate: 0,
      avgCpuUsage: 0,
      avgMemoryUsage: 0,
      status: 'success',
      errors: [],
    }
    
    ElMessage.success('性能测试已启动')
    
    // 启动定时器
    startMetricsUpdate()
    startProgressTimer()
  } catch (error) {
    testStatus.value = 'error'
    ElMessage.error('启动测试失败')
  }
}

// 暂停测试
const pauseTest = () => {
  testStatus.value = 'paused'
  stopTimers()
  ElMessage.info('测试已暂停')
}

// 恢复测试
const resumeTest = () => {
  testStatus.value = 'running'
  startMetricsUpdate()
  startProgressTimer()
  ElMessage.success('测试已恢复')
}

// 停止测试
const stopTest = async () => {
  try {
    await ElMessageBox.confirm('确定要停止当前测试吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    
    testStatus.value = 'completed'
    stopTimers()
    
    // 完成当前测试结果
    if (currentTestResult.value) {
      currentTestResult.value.endTime = new Date().toISOString()
      currentTestResult.value.status = 'stopped'
      calculateTestResult()
      
      // 添加到历史记录
      historyRecords.value.unshift({ ...currentTestResult.value })
    }
    
    ElMessage.success('测试已停止')
  } catch {
    // 用户取消
  }
}

// 启动指标更新定时器
const startMetricsUpdate = () => {
  if (metricsUpdateTimer) return
  
  metricsUpdateTimer = window.setInterval(() => {
    if (testStatus.value === 'running') {
      updateMetrics()
    }
  }, 1000)
}

// 启动进度定时器
const startProgressTimer = () => {
  if (testProgressTimer) return
  
  testProgressTimer = window.setInterval(() => {
    if (testStatus.value === 'running') {
      testProgress.value += (100 / testConfig.duration)
      remainingTime.value = Math.max(0, remainingTime.value - 1)
      
      if (testProgress.value >= 100) {
        completeTest()
      }
    }
  }, 1000)
}

// 停止定时器
const stopTimers = () => {
  if (metricsUpdateTimer) {
    clearInterval(metricsUpdateTimer)
    metricsUpdateTimer = null
  }
  if (testProgressTimer) {
    clearInterval(testProgressTimer)
    testProgressTimer = null
  }
}

// 更新性能指标（模拟数据）
const updateMetrics = () => {
  const now = new Date()
  const metrics: PerformanceMetrics = {
    timestamp: now.toLocaleTimeString(),
    responseTime: Math.random() * 500 + 100, // 100-600ms
    throughput: Math.random() * 100 + 50, // 50-150 req/s
    errorRate: Math.random() * 5, // 0-5%
    concurrentUsers: testConfig.concurrentUsers + Math.floor(Math.random() * 20 - 10),
    cpuUsage: Math.random() * 40 + 30, // 30-70%
    memoryUsage: Math.random() * 30 + 50, // 50-80%
  }
  
  Object.assign(currentMetrics, metrics)
  metricsHistory.value.push(metrics)
  
  // 保持最近100条数据
  if (metricsHistory.value.length > 100) {
    metricsHistory.value.shift()
  }
  
  // 更新图表
  updateCharts()
}

// 完成测试
const completeTest = () => {
  testStatus.value = 'completed'
  testProgress.value = 100
  remainingTime.value = 0
  stopTimers()
  
  if (currentTestResult.value) {
    currentTestResult.value.endTime = new Date().toISOString()
    currentTestResult.value.status = 'success'
    calculateTestResult()
    
    // 添加到历史记录
    historyRecords.value.unshift({ ...currentTestResult.value })
  }
  
  ElMessage.success('性能测试已完成')
}

// 计算测试结果
const calculateTestResult = () => {
  if (!currentTestResult.value || metricsHistory.value.length === 0) return
  
  const metrics = metricsHistory.value
  const totalRequests = testConfig.requestRate * testConfig.duration
  
  // 计算统计指标
  const responseTimes = metrics.map((m) => m.responseTime)
  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
  const sortedResponseTimes = [...responseTimes].sort((a, b) => a - b)
  const p95Index = Math.floor(sortedResponseTimes.length * 0.95)
  
  currentTestResult.value.totalRequests = totalRequests
  currentTestResult.value.successRequests = Math.floor(totalRequests * (1 - metrics[metrics.length - 1].errorRate / 100))
  currentTestResult.value.failedRequests = totalRequests - currentTestResult.value.successRequests
  currentTestResult.value.avgResponseTime = Math.round(avgResponseTime)
  currentTestResult.value.p95ResponseTime = Math.round(sortedResponseTimes[p95Index] || 0)
  currentTestResult.value.maxResponseTime = Math.round(Math.max(...responseTimes))
  currentTestResult.value.minResponseTime = Math.round(Math.min(...responseTimes))
  currentTestResult.value.avgThroughput = Math.round(
    metrics.reduce((a, b) => a + b.throughput, 0) / metrics.length
  )
  currentTestResult.value.avgErrorRate = Number(
    (metrics.reduce((a, b) => a + b.errorRate, 0) / metrics.length).toFixed(2)
  )
  currentTestResult.value.avgCpuUsage = Math.round(
    metrics.reduce((a, b) => a + b.cpuUsage, 0) / metrics.length
  )
  currentTestResult.value.avgMemoryUsage = Math.round(
    metrics.reduce((a, b) => a + b.memoryUsage, 0) / metrics.length
  )
  
  // 生成错误统计
  currentTestResult.value.errors = [
    { type: 'Timeout', count: Math.floor(currentTestResult.value.failedRequests * 0.4), message: '请求超时' },
    { type: 'Connection Error', count: Math.floor(currentTestResult.value.failedRequests * 0.3), message: '连接错误' },
    { type: 'Server Error', count: Math.floor(currentTestResult.value.failedRequests * 0.2), message: '服务器错误' },
    { type: 'Client Error', count: Math.floor(currentTestResult.value.failedRequests * 0.1), message: '客户端错误' },
  ].filter((e) => e.count > 0)
}

// 初始化图表
const initCharts = () => {
  // 响应时间图表
  const responseTimeChartDom = document.getElementById('responseTimeChart')
  if (responseTimeChartDom) {
    responseTimeChart = echarts.init(responseTimeChartDom)
    const option: EChartsOption = {
      title: { text: '响应时间趋势', left: 'center', textStyle: { fontSize: 14 } },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: [], boundaryGap: false },
      yAxis: { type: 'value', name: '响应时间 (ms)' },
      series: [
        {
          name: '响应时间',
          type: 'line',
          data: [],
          smooth: true,
          itemStyle: { color: '#409eff' },
          areaStyle: { opacity: 0.3 },
        },
      ],
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    }
    responseTimeChart.setOption(option)
  }
  
  // 吞吐量图表
  const throughputChartDom = document.getElementById('throughputChart')
  if (throughputChartDom) {
    throughputChart = echarts.init(throughputChartDom)
    const option: EChartsOption = {
      title: { text: '吞吐量趋势', left: 'center', textStyle: { fontSize: 14 } },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: [], boundaryGap: false },
      yAxis: { type: 'value', name: '吞吐量 (req/s)' },
      series: [
        {
          name: '吞吐量',
          type: 'line',
          data: [],
          smooth: true,
          itemStyle: { color: '#67c23a' },
          areaStyle: { opacity: 0.3 },
        },
      ],
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    }
    throughputChart.setOption(option)
  }
  
  // 资源使用图表
  const resourceChartDom = document.getElementById('resourceChart')
  if (resourceChartDom) {
    resourceChart = echarts.init(resourceChartDom)
    const option: EChartsOption = {
      title: { text: '系统资源使用', left: 'center', textStyle: { fontSize: 14 } },
      tooltip: { trigger: 'axis' },
      legend: { data: ['CPU使用率', '内存使用率'], bottom: 0 },
      xAxis: { type: 'category', data: [], boundaryGap: false },
      yAxis: { type: 'value', name: '使用率 (%)', max: 100 },
      series: [
        {
          name: 'CPU使用率',
          type: 'line',
          data: [],
          smooth: true,
          itemStyle: { color: '#e6a23c' },
        },
        {
          name: '内存使用率',
          type: 'line',
          data: [],
          smooth: true,
          itemStyle: { color: '#f56c6c' },
        },
      ],
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    }
    resourceChart.setOption(option)
  }
}

// 更新图表
const updateCharts = () => {
  const timestamps = metricsHistory.value.map((m) => m.timestamp)
  
  // 更新响应时间图表
  if (responseTimeChart) {
    responseTimeChart.setOption({
      xAxis: { data: timestamps },
      series: [{ data: metricsHistory.value.map((m) => m.responseTime.toFixed(2)) }],
    })
  }
  
  // 更新吞吐量图表
  if (throughputChart) {
    throughputChart.setOption({
      xAxis: { data: timestamps },
      series: [{ data: metricsHistory.value.map((m) => m.throughput.toFixed(2)) }],
    })
  }
  
  // 更新资源使用图表
  if (resourceChart) {
    resourceChart.setOption({
      xAxis: { data: timestamps },
      series: [
        { data: metricsHistory.value.map((m) => m.cpuUsage.toFixed(2)) },
        { data: metricsHistory.value.map((m) => m.memoryUsage.toFixed(2)) },
      ],
    })
  }
}

// 加载历史记录
const loadHistoryRecords = () => {
  historyTableLoading.value = true
  
  // 模拟加载历史数据
  setTimeout(() => {
    // 生成 mock 历史数据
    const mockRecords: TestResult[] = []
    for (let i = 0; i < 10; i++) {
      const startTime = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const duration = [60, 300, 600][Math.floor(Math.random() * 3)]
      const totalRequests = duration * 50
      const failedRequests = Math.floor(totalRequests * Math.random() * 0.1)
      
      mockRecords.push({
        id: `test-${Date.now() - i * 1000}`,
        scenarioName: scenarioTemplates[Math.floor(Math.random() * 3)].name,
        startTime: startTime.toISOString(),
        endTime: new Date(startTime.getTime() + duration * 1000).toISOString(),
        duration,
        totalRequests,
        successRequests: totalRequests - failedRequests,
        failedRequests,
        avgResponseTime: Math.floor(Math.random() * 300 + 100),
        p95ResponseTime: Math.floor(Math.random() * 500 + 200),
        maxResponseTime: Math.floor(Math.random() * 800 + 400),
        minResponseTime: Math.floor(Math.random() * 50 + 50),
        avgThroughput: Math.floor(Math.random() * 100 + 50),
        avgErrorRate: Number((Math.random() * 5).toFixed(2)),
        avgCpuUsage: Math.floor(Math.random() * 40 + 30),
        avgMemoryUsage: Math.floor(Math.random() * 30 + 50),
        status: ['success', 'failed', 'stopped'][Math.floor(Math.random() * 3)] as any,
        errors: [],
      })
    }
    
    historyRecords.value = mockRecords
    historyTableLoading.value = false
  }, 500)
}

// 查看测试报告
const viewTestReport = (record: TestResult) => {
  ElMessageBox.alert(
    `
    <div style="line-height: 1.8;">
      <p><strong>测试场景：</strong>${record.scenarioName}</p>
      <p><strong>开始时间：</strong>${new Date(record.startTime).toLocaleString()}</p>
      <p><strong>结束时间：</strong>${new Date(record.endTime).toLocaleString()}</p>
      <p><strong>持续时间：</strong>${record.duration}秒</p>
      <p><strong>总请求数：</strong>${record.totalRequests}</p>
      <p><strong>成功请求：</strong>${record.successRequests}</p>
      <p><strong>失败请求：</strong>${record.failedRequests}</p>
      <p><strong>平均响应时间：</strong>${record.avgResponseTime}ms</p>
      <p><strong>P95响应时间：</strong>${record.p95ResponseTime}ms</p>
      <p><strong>平均吞吐量：</strong>${record.avgThroughput} req/s</p>
      <p><strong>平均错误率：</strong>${record.avgErrorRate}%</p>
    </div>
    `,
    '测试报告详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '确定',
    }
  )
}

// 导出测试结果
const exportTestResult = (record: TestResult) => {
  const data = JSON.stringify(record, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `test-report-${record.id}.json`
  a.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success('测试结果已导出')
}

// 对比测试结果
const compareTestResults = () => {
  ElMessage.info('对比功能开发中...')
}

// 格式化持续时间
const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}分${secs}秒`
}

// 格式化时间
const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  const typeMap: Record<string, any> = {
    success: 'success',
    failed: 'danger',
    stopped: 'info',
  }
  return typeMap[status] || 'info'
}

// 组件挂载
onMounted(() => {
  // 延迟初始化图表，确保 DOM 已渲染
  setTimeout(() => {
    initCharts()
  }, 100)
  
  // 加载历史记录
  loadHistoryRecords()
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
})

// 组件卸载
onUnmounted(() => {
  stopTimers()
  
  // 销毁图表实例
  responseTimeChart?.dispose()
  throughputChart?.dispose()
  resourceChart?.dispose()
  
  window.removeEventListener('resize', handleResize)
})

// 处理窗口大小变化
const handleResize = () => {
  responseTimeChart?.resize()
  throughputChart?.resize()
  resourceChart?.resize()
}
</script>

<template>
  <div class="performance-test-container">
    <!-- 页面标题 -->
    <el-card class="header-card" shadow="never">
      <div class="page-header">
        <div>
          <h2 class="page-title">性能压力测试</h2>
          <p class="page-description">
            评估服务在高并发场景下的性能表现，通过模拟多种压力场景全面测试服务性能
          </p>
        </div>
        <el-tag :type="testStatusType" size="large">
          {{ testStatusText }}
        </el-tag>
      </div>
    </el-card>

    <!-- 测试配置区 -->
    <el-card class="config-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">测试场景配置</span>
        </div>
      </template>

      <el-form :model="testConfig" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="场景模板">
              <el-select
                v-model="testConfig.scenarioType"
                placeholder="请选择场景模板"
                @change="onScenarioTypeChange"
                :disabled="testStatus === 'running'"
                style="width: 100%"
              >
                <el-option label="低压力" value="low" />
                <el-option label="常规压力" value="normal" />
                <el-option label="峰值压力" value="peak" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="并发用户数">
              <el-input-number
                v-model="testConfig.concurrentUsers"
                :min="1"
                :max="1000"
                :disabled="testStatus === 'running'"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="持续时间(秒)">
              <el-input-number
                v-model="testConfig.duration"
                :min="10"
                :max="3600"
                :disabled="testStatus === 'running'"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="请求频率(/秒)">
              <el-input-number
                v-model="testConfig.requestRate"
                :min="1"
                :max="1000"
                :disabled="testStatus === 'running'"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="API端点">
              <el-input
                v-model="testConfig.apiEndpoint"
                placeholder="请输入API端点"
                :disabled="testStatus === 'running'"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="请求方法">
              <el-select
                v-model="testConfig.requestMethod"
                :disabled="testStatus === 'running'"
                style="width: 100%"
              >
                <el-option label="GET" value="GET" />
                <el-option label="POST" value="POST" />
                <el-option label="PUT" value="PUT" />
                <el-option label="DELETE" value="DELETE" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="请求参数">
              <el-input
                v-model="testConfig.requestParams"
                type="textarea"
                :rows="3"
                placeholder="请输入JSON格式的请求参数"
                :disabled="testStatus === 'running'"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="16">
            <el-form-item label="场景名称">
              <el-input
                v-model="testConfig.customScenarioName"
                placeholder="输入名称以保存自定义场景"
                :disabled="testStatus === 'running'"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label=" ">
              <el-button
                type="primary"
                plain
                @click="saveCustomScenario"
                :disabled="testStatus === 'running'"
              >
                保存场景
              </el-button>
              <el-button
                v-if="savedScenarios.length > 0"
                type="success"
                plain
                :disabled="testStatus === 'running'"
              >
                加载场景
              </el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 测试控制区 -->
    <el-card class="control-card" shadow="never">
      <div class="test-control">
        <div class="control-buttons">
          <el-button
            type="primary"
            size="large"
            :disabled="!canStartTest"
            @click="startTest"
          >
            开始测试
          </el-button>
          <el-button
            type="warning"
            size="large"
            :disabled="!canPauseTest"
            @click="pauseTest"
          >
            暂停测试
          </el-button>
          <el-button
            type="success"
            size="large"
            :disabled="!canResumeTest"
            @click="resumeTest"
          >
            继续测试
          </el-button>
          <el-button
            type="danger"
            size="large"
            :disabled="!canStopTest"
            @click="stopTest"
          >
            停止测试
          </el-button>
        </div>

        <div v-if="testStatus !== 'idle'" class="progress-info">
          <div class="progress-stats">
            <el-statistic title="测试进度" :value="testProgress.toFixed(1)" suffix="%" />
            <el-statistic title="剩余时间" :value="remainingTime" suffix="秒" />
          </div>
          <el-progress
            :percentage="Math.min(100, testProgress)"
            :status="testStatus === 'completed' ? 'success' : undefined"
            :color="testStatus === 'paused' ? '#e6a23c' : '#409eff'"
          />
        </div>
      </div>
    </el-card>

    <!-- 实时性能指标 -->
    <el-card v-if="testStatus !== 'idle'" class="metrics-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">实时性能指标</span>
        </div>
      </template>

      <el-row :gutter="20" class="metrics-summary">
        <el-col :span="6">
          <el-statistic
            title="响应时间"
            :value="currentMetrics.responseTime.toFixed(2)"
            suffix="ms"
          >
            <template #prefix>
              <el-icon color="#409eff">
                <Timer />
              </el-icon>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic
            title="吞吐量"
            :value="currentMetrics.throughput.toFixed(2)"
            suffix="req/s"
          >
            <template #prefix>
              <el-icon color="#67c23a">
                <Odometer />
              </el-icon>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic
            title="错误率"
            :value="currentMetrics.errorRate.toFixed(2)"
            suffix="%"
          >
            <template #prefix>
              <el-icon color="#f56c6c">
                <Warning />
              </el-icon>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic
            title="并发用户"
            :value="currentMetrics.concurrentUsers"
            suffix="人"
          >
            <template #prefix>
              <el-icon color="#e6a23c">
                <User />
              </el-icon>
            </template>
          </el-statistic>
        </el-col>
      </el-row>

      <el-divider />

      <!-- 图表区域 -->
      <el-row :gutter="20" class="charts-row">
        <el-col :span="12">
          <div id="responseTimeChart" class="chart-container"></div>
        </el-col>
        <el-col :span="12">
          <div id="throughputChart" class="chart-container"></div>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="charts-row">
        <el-col :span="24">
          <div id="resourceChart" class="chart-container"></div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 测试结果分析 -->
    <el-card
      v-if="currentTestResult && testStatus === 'completed'"
      class="result-card"
      shadow="never"
    >
      <template #header>
        <div class="card-header">
          <span class="card-title">测试结果分析</span>
        </div>
      </template>

      <el-alert
        :title="`测试场景: ${currentTestResult.scenarioName}`"
        type="success"
        :closable="false"
        style="margin-bottom: 20px"
      >
        <template #default>
          <div style="margin-top: 10px">
            开始时间: {{ formatTime(currentTestResult.startTime) }} | 
            结束时间: {{ formatTime(currentTestResult.endTime) }} | 
            持续时间: {{ formatDuration(currentTestResult.duration) }}
          </div>
        </template>
      </el-alert>

      <el-row :gutter="20" class="result-summary">
        <el-col :span="6">
          <el-statistic title="总请求数" :value="currentTestResult.totalRequests" />
        </el-col>
        <el-col :span="6">
          <el-statistic
            title="成功请求"
            :value="currentTestResult.successRequests"
            value-style="color: #67c23a"
          />
        </el-col>
        <el-col :span="6">
          <el-statistic
            title="失败请求"
            :value="currentTestResult.failedRequests"
            value-style="color: #f56c6c"
          />
        </el-col>
        <el-col :span="6">
          <el-statistic
            title="成功率"
            :value="((currentTestResult.successRequests / currentTestResult.totalRequests) * 100).toFixed(2)"
            suffix="%"
            value-style="color: #409eff"
          />
        </el-col>
      </el-row>

      <el-divider />

      <el-row :gutter="20" class="result-details">
        <el-col :span="8">
          <el-card shadow="never" class="detail-card">
            <h4>响应时间统计</h4>
            <div class="detail-item">
              <span>平均响应时间:</span>
              <strong>{{ currentTestResult.avgResponseTime }} ms</strong>
            </div>
            <div class="detail-item">
              <span>P95响应时间:</span>
              <strong>{{ currentTestResult.p95ResponseTime }} ms</strong>
            </div>
            <div class="detail-item">
              <span>最大响应时间:</span>
              <strong>{{ currentTestResult.maxResponseTime }} ms</strong>
            </div>
            <div class="detail-item">
              <span>最小响应时间:</span>
              <strong>{{ currentTestResult.minResponseTime }} ms</strong>
            </div>
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card shadow="never" class="detail-card">
            <h4>性能指标</h4>
            <div class="detail-item">
              <span>平均吞吐量:</span>
              <strong>{{ currentTestResult.avgThroughput }} req/s</strong>
            </div>
            <div class="detail-item">
              <span>平均错误率:</span>
              <strong>{{ currentTestResult.avgErrorRate }} %</strong>
            </div>
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card shadow="never" class="detail-card">
            <h4>系统资源</h4>
            <div class="detail-item">
              <span>平均CPU使用率:</span>
              <strong>{{ currentTestResult.avgCpuUsage }} %</strong>
            </div>
            <div class="detail-item">
              <span>平均内存使用率:</span>
              <strong>{{ currentTestResult.avgMemoryUsage }} %</strong>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-divider v-if="currentTestResult.errors.length > 0" />

      <div v-if="currentTestResult.errors.length > 0" class="error-analysis">
        <h4>错误类型统计</h4>
        <el-table :data="currentTestResult.errors" style="width: 100%">
          <el-table-column prop="type" label="错误类型" width="200" />
          <el-table-column prop="count" label="错误次数" width="150" />
          <el-table-column prop="message" label="错误描述" />
        </el-table>
      </div>
    </el-card>

    <!-- 历史测试记录 -->
    <el-card class="history-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">历史测试记录</span>
          <div class="header-actions">
            <el-button type="primary" size="small" @click="compareTestResults">
              对比测试
            </el-button>
          </div>
        </div>
      </template>

      <!-- 筛选条件 -->
      <div class="filter-bar">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-date-picker
              v-model="historyDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="width: 100%"
            />
          </el-col>
          <el-col :span="8">
            <el-select
              v-model="historyStatusFilter"
              placeholder="筛选测试状态"
              clearable
              style="width: 100%"
            >
              <el-option label="成功" value="success" />
              <el-option label="失败" value="failed" />
              <el-option label="已停止" value="stopped" />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-button type="primary" @click="loadHistoryRecords" style="width: 100%">
              刷新
            </el-button>
          </el-col>
        </el-row>
      </div>

      <!-- 历史记录表格 -->
      <el-table
        :data="filteredHistoryRecords"
        :loading="historyTableLoading"
        style="width: 100%; margin-top: 20px"
        stripe
      >
        <el-table-column prop="scenarioName" label="场景名称" width="150" />
        <el-table-column label="开始时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column label="持续时间" width="120">
          <template #default="{ row }">
            {{ formatDuration(row.duration) }}
          </template>
        </el-table-column>
        <el-table-column prop="totalRequests" label="总请求数" width="120" />
        <el-table-column prop="avgResponseTime" label="平均响应时间" width="140">
          <template #default="{ row }">
            {{ row.avgResponseTime }} ms
          </template>
        </el-table-column>
        <el-table-column prop="avgThroughput" label="平均吞吐量" width="130">
          <template #default="{ row }">
            {{ row.avgThroughput }} req/s
          </template>
        </el-table-column>
        <el-table-column prop="avgErrorRate" label="错误率" width="100">
          <template #default="{ row }">
            {{ row.avgErrorRate }} %
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ row.status === 'success' ? '成功' : row.status === 'failed' ? '失败' : '已停止' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewTestReport(row)">
              查看报告
            </el-button>
            <el-button type="success" link size="small" @click="exportTestResult(row)">
              导出
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.performance-test-container {

  .header-card {
    margin-bottom: 20px;

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .page-title {
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 600;
        color: #303133;
      }

      .page-description {
        margin: 0;
        font-size: 14px;
        color: #909399;
      }
    }
  }

  .config-card,
  .control-card,
  .metrics-card,
  .result-card,
  .history-card {
    margin-bottom: 20px;
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

    .header-actions {
      display: flex;
      gap: 10px;
    }
  }

  .test-control {
    .control-buttons {
      display: flex;
      gap: 15px;
      justify-content: center;
      margin-bottom: 30px;
    }

    .progress-info {
      .progress-stats {
        display: flex;
        justify-content: space-around;
        margin-bottom: 20px;
      }
    }
  }

  .metrics-summary {
    margin-bottom: 20px;

    :deep(.el-statistic__head) {
      font-size: 14px;
      color: #909399;
      margin-bottom: 8px;
    }

    :deep(.el-statistic__content) {
      font-size: 24px;
      font-weight: 600;
    }
  }

  .charts-row {
    margin-bottom: 20px;

    .chart-container {
      width: 100%;
      height: 300px;
    }
  }

  .result-summary {
    margin-bottom: 20px;
  }

  .result-details {
    .detail-card {
      background-color: #f9fafc;
      border: 1px solid #ebeef5;

      h4 {
        margin: 0 0 15px 0;
        font-size: 14px;
        font-weight: 600;
        color: #303133;
      }

      .detail-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #ebeef5;

        &:last-child {
          border-bottom: none;
        }

        span {
          font-size: 14px;
          color: #606266;
        }

        strong {
          font-size: 16px;
          color: #409eff;
        }
      }
    }
  }

  .error-analysis {
    h4 {
      margin: 0 0 15px 0;
      font-size: 14px;
      font-weight: 600;
      color: #303133;
    }
  }

  .filter-bar {
    margin-bottom: 20px;
  }
}
</style>