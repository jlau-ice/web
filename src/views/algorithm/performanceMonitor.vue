<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { ElMessage } from 'element-plus'

// 类型定义
interface PerformanceMetrics {
  accuracy: number // 准确率
  recall: number // 召回率
  f1Score: number // F1分数
  responseTime: number // 响应时间(ms)
  totalRecognitions: number // 识别总量
  successRate: number // 成功率
  anomalyCount: number // 异常数量
  trend: {
    accuracyChange: number
    recallChange: number
    f1Change: number
    responseTimeChange: number
  }
}

interface ModelVersion {
  id: string
  name: string
  version: string
  accuracy: number
  recall: number
  f1Score: number
  responseTime: number
  status: 'excellent' | 'good' | 'normal' | 'poor'
  deployTime: string
}

interface RealtimeMetrics {
  requestCount: number
  successCount: number
  failCount: number
  avgResponseTime: number
  qps: number // 每秒查询率
  cpu: number
  memory: number
  gpu: number
}

interface Alert {
  id: string
  type: 'performance' | 'anomaly' | 'resource'
  level: 'critical' | 'warning' | 'info'
  title: string
  content: string
  time: string
  status: 'pending' | 'processing' | 'resolved'
  suggestion: string
}

interface ConfidenceDistribution {
  range: string
  count: number
  percentage: number
}

// 时间范围选项
const timeRange = ref<'today' | 'week' | 'month'>('today')
const timeRangeOptions = [
  { label: '今日', value: 'today' },
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' }
]

// 数据状态
const loading = ref(false)
const performanceMetrics = ref<PerformanceMetrics>({
  accuracy: 0,
  recall: 0,
  f1Score: 0,
  responseTime: 0,
  totalRecognitions: 0,
  successRate: 0,
  anomalyCount: 0,
  trend: {
    accuracyChange: 0,
    recallChange: 0,
    f1Change: 0,
    responseTimeChange: 0
  }
})

const modelVersions = ref<ModelVersion[]>([])
const realtimeMetrics = ref<RealtimeMetrics>({
  requestCount: 0,
  successCount: 0,
  failCount: 0,
  avgResponseTime: 0,
  qps: 0,
  cpu: 0,
  memory: 0,
  gpu: 0
})

const alerts = ref<Alert[]>([])
const confidenceDistribution = ref<ConfidenceDistribution[]>([])

// 图表实例
let trendChart: echarts.ECharts | null = null
let modelCompareChart: echarts.ECharts | null = null
let realtimeChart: echarts.ECharts | null = null
let resourceChart: echarts.ECharts | null = null
let confidenceChart: echarts.ECharts | null = null

// 定时器
let realtimeTimer: NodeJS.Timeout | null = null

// Mock 数据生成函数
const mockPerformanceMetrics = (): Promise<PerformanceMetrics> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const baseMultiplier = timeRange.value === 'today' ? 1 : timeRange.value === 'week' ? 7 : 30
      resolve({
        accuracy: 94.5 + Math.random() * 3,
        recall: 92.3 + Math.random() * 4,
        f1Score: 93.2 + Math.random() * 3,
        responseTime: 120 + Math.random() * 50,
        totalRecognitions: Math.floor(15000 * baseMultiplier + Math.random() * 5000),
        successRate: 96.8 + Math.random() * 2,
        anomalyCount: Math.floor(Math.random() * 50 * baseMultiplier),
        trend: {
          accuracyChange: (Math.random() - 0.5) * 4,
          recallChange: (Math.random() - 0.5) * 4,
          f1Change: (Math.random() - 0.5) * 4,
          responseTimeChange: (Math.random() - 0.5) * 40
        }
      })
    }, 500)
  })
}

const mockModelVersions = (): Promise<ModelVersion[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const versions: ModelVersion[] = [
        {
          id: '1',
          name: 'YOLO-V8',
          version: 'v8.2.1',
          accuracy: 95.8,
          recall: 94.2,
          f1Score: 95.0,
          responseTime: 115,
          status: 'excellent',
          deployTime: '2025-10-15 10:30:00'
        },
        {
          id: '2',
          name: 'ResNet-50',
          version: 'v2.1.0',
          accuracy: 93.5,
          recall: 91.8,
          f1Score: 92.6,
          responseTime: 145,
          status: 'good',
          deployTime: '2025-10-10 14:20:00'
        },
        {
          id: '3',
          name: 'MobileNet',
          version: 'v3.0.2',
          accuracy: 89.2,
          recall: 87.5,
          f1Score: 88.3,
          responseTime: 85,
          status: 'normal',
          deployTime: '2025-10-01 09:15:00'
        },
        {
          id: '4',
          name: 'EfficientNet',
          version: 'v1.5.3',
          accuracy: 91.8,
          recall: 90.2,
          f1Score: 91.0,
          responseTime: 125,
          status: 'good',
          deployTime: '2025-09-25 16:45:00'
        }
      ]
      resolve(versions)
    }, 600)
  })
}

const mockRealtimeMetrics = (): RealtimeMetrics => {
  return {
    requestCount: Math.floor(Math.random() * 1000) + 5000,
    successCount: Math.floor(Math.random() * 950) + 4800,
    failCount: Math.floor(Math.random() * 50) + 10,
    avgResponseTime: Math.floor(Math.random() * 50) + 120,
    qps: Math.floor(Math.random() * 100) + 150,
    cpu: Math.floor(Math.random() * 30) + 40,
    memory: Math.floor(Math.random() * 20) + 60,
    gpu: Math.floor(Math.random() * 25) + 55
  }
}

const mockAlerts = (): Promise<Alert[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const alertList: Alert[] = [
        {
          id: '1',
          type: 'performance',
          level: 'warning',
          title: '模型准确率下降',
          content: 'YOLO-V8 模型准确率从 95.8% 下降至 94.2%',
          time: '2025-10-29 10:23:15',
          status: 'pending',
          suggestion: '建议检查最近的数据质量，考虑重新训练模型'
        },
        {
          id: '2',
          type: 'resource',
          level: 'critical',
          title: 'GPU 使用率过高',
          content: 'GPU 使用率持续超过 85%，可能影响系统性能',
          time: '2025-10-29 09:45:32',
          status: 'processing',
          suggestion: '建议增加 GPU 资源或优化模型推理效率'
        },
        {
          id: '3',
          type: 'anomaly',
          level: 'info',
          title: '异常识别数量增加',
          content: '过去1小时内异常识别数量增加了 15%',
          time: '2025-10-29 09:10:08',
          status: 'resolved',
          suggestion: '已自动调整识别阈值，问题已解决'
        },
        {
          id: '4',
          type: 'performance',
          level: 'warning',
          title: '响应时间延长',
          content: '平均响应时间从 120ms 增长至 165ms',
          time: '2025-10-29 08:30:21',
          status: 'pending',
          suggestion: '建议检查网络连接和服务器负载'
        }
      ]
      resolve(alertList)
    }, 700)
  })
}

const mockConfidenceDistribution = (): Promise<ConfidenceDistribution[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { range: '0-20%', count: 125, percentage: 2.5 },
        { range: '20-40%', count: 358, percentage: 7.2 },
        { range: '40-60%', count: 892, percentage: 17.8 },
        { range: '60-80%', count: 1456, percentage: 29.1 },
        { range: '80-100%', count: 2169, percentage: 43.4 }
      ])
    }, 550)
  })
}

// 工具函数
const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    excellent: '#67c23a',
    good: '#409eff',
    normal: '#e6a23c',
    poor: '#f56c6c'
  }
  return colorMap[status] || '#909399'
}

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    excellent: '优秀',
    good: '良好',
    normal: '一般',
    poor: '差'
  }
  return textMap[status] || '未知'
}

const getAlertLevelType = (level: string) => {
  const typeMap: Record<string, any> = {
    critical: 'error',
    warning: 'warning',
    info: 'info'
  }
  return typeMap[level] || 'info'
}

const getAlertStatusTag = (status: string) => {
  const tagMap: Record<string, any> = {
    pending: { type: 'danger', text: '待处理' },
    processing: { type: 'warning', text: '处理中' },
    resolved: { type: 'success', text: '已解决' }
  }
  return tagMap[status] || { type: 'info', text: '未知' }
}

// 初始化趋势图表
const initTrendChart = () => {
  const chartDom = document.getElementById('trendChart')
  if (!chartDom) return

  trendChart = echarts.init(chartDom)

  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`)
  const accuracyData = Array.from({ length: 24 }, () => 92 + Math.random() * 6)
  const recallData = Array.from({ length: 24 }, () => 90 + Math.random() * 6)
  const f1Data = Array.from({ length: 24 }, () => 91 + Math.random() * 6)

  const option: EChartsOption = {
    title: {
      text: '性能指标趋势',
      left: 'center',
      textStyle: { fontSize: 16 }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['准确率', '召回率', 'F1分数'],
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
      type: 'value',
      min: 85,
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [
      {
        name: '准确率',
        type: 'line',
        smooth: true,
        data: accuracyData,
        itemStyle: { color: '#67c23a' }
      },
      {
        name: '召回率',
        type: 'line',
        smooth: true,
        data: recallData,
        itemStyle: { color: '#409eff' }
      },
      {
        name: 'F1分数',
        type: 'line',
        smooth: true,
        data: f1Data,
        itemStyle: { color: '#e6a23c' }
      }
    ]
  }

  trendChart.setOption(option)
}

// 初始化模型对比图表
const initModelCompareChart = () => {
  const chartDom = document.getElementById('modelCompareChart')
  if (!chartDom) return

  modelCompareChart = echarts.init(chartDom)

  const models = modelVersions.value.map(m => m.name)
  const accuracyData = modelVersions.value.map(m => m.accuracy)
  const recallData = modelVersions.value.map(m => m.recall)
  const f1Data = modelVersions.value.map(m => m.f1Score)

  const option: EChartsOption = {
    title: {
      text: '模型性能对比',
      left: 'center',
      textStyle: { fontSize: 16 }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['准确率', '召回率', 'F1分数'],
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
      data: models
    },
    yAxis: {
      type: 'value',
      min: 80,
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [
      {
        name: '准确率',
        type: 'bar',
        data: accuracyData,
        itemStyle: { color: '#67c23a' }
      },
      {
        name: '召回率',
        type: 'bar',
        data: recallData,
        itemStyle: { color: '#409eff' }
      },
      {
        name: 'F1分数',
        type: 'bar',
        data: f1Data,
        itemStyle: { color: '#e6a23c' }
      }
    ]
  }

  modelCompareChart.setOption(option)
}

// 初始化实时监控图表
const initRealtimeChart = () => {
  const chartDom = document.getElementById('realtimeChart')
  if (!chartDom) return

  realtimeChart = echarts.init(chartDom)

  const timePoints = Array.from({ length: 20 }, (_, i) => {
    const now = new Date()
    now.setSeconds(now.getSeconds() - (19 - i) * 3)
    return `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
  })

  const requestData = Array.from({ length: 20 }, () => Math.floor(Math.random() * 50) + 100)
  const qpsData = Array.from({ length: 20 }, () => Math.floor(Math.random() * 50) + 120)

  const option: EChartsOption = {
    title: {
      text: '实时请求监控',
      left: 'center',
      textStyle: { fontSize: 16 }
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['请求数', 'QPS'],
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
      data: timePoints
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '请求数',
        type: 'line',
        smooth: true,
        data: requestData,
        itemStyle: { color: '#409eff' }
      },
      {
        name: 'QPS',
        type: 'line',
        smooth: true,
        data: qpsData,
        itemStyle: { color: '#67c23a' }
      }
    ]
  }

  realtimeChart.setOption(option)
}

// 初始化资源使用图表
const initResourceChart = () => {
  const chartDom = document.getElementById('resourceChart')
  if (!chartDom) return

  resourceChart = echarts.init(chartDom)

  const option: EChartsOption = {
    title: {
      text: '系统资源使用',
      left: 'center',
      textStyle: { fontSize: 16 }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}%'
    },
    series: [
      {
        type: 'gauge',
        center: ['25%', '60%'],
        radius: '80%',
        detail: {
          formatter: 'CPU\n{value}%',
          fontSize: 14
        },
        data: [{ value: realtimeMetrics.value.cpu, name: 'CPU' }],
        axisLine: {
          lineStyle: {
            color: [
              [0.6, '#67c23a'],
              [0.8, '#e6a23c'],
              [1, '#f56c6c']
            ]
          }
        }
      },
      {
        type: 'gauge',
        center: ['50%', '60%'],
        radius: '80%',
        detail: {
          formatter: '内存\n{value}%',
          fontSize: 14
        },
        data: [{ value: realtimeMetrics.value.memory, name: '内存' }],
        axisLine: {
          lineStyle: {
            color: [
              [0.6, '#67c23a'],
              [0.8, '#e6a23c'],
              [1, '#f56c6c']
            ]
          }
        }
      },
      {
        type: 'gauge',
        center: ['75%', '60%'],
        radius: '80%',
        detail: {
          formatter: 'GPU\n{value}%',
          fontSize: 14
        },
        data: [{ value: realtimeMetrics.value.gpu, name: 'GPU' }],
        axisLine: {
          lineStyle: {
            color: [
              [0.6, '#67c23a'],
              [0.8, '#e6a23c'],
              [1, '#f56c6c']
            ]
          }
        }
      }
    ]
  }

  resourceChart.setOption(option)
}

// 初始化置信度分布图表
const initConfidenceChart = () => {
  const chartDom = document.getElementById('confidenceChart')
  if (!chartDom) return

  confidenceChart = echarts.init(chartDom)

  const option: EChartsOption = {
    title: {
      text: '置信度分布',
      left: 'center',
      textStyle: { fontSize: 16 }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 40
    },
    series: [
      {
        type: 'pie',
        radius: '60%',
        center: ['60%', '50%'],
        data: confidenceDistribution.value.map(item => ({
          name: item.range,
          value: item.count
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          formatter: '{b}\n{d}%'
        }
      }
    ]
  }

  confidenceChart.setOption(option)
}

// 更新实时数据
const updateRealtimeData = () => {
  realtimeMetrics.value = mockRealtimeMetrics()

  // 更新资源图表
  if (resourceChart) {
    resourceChart.setOption({
      series: [
        { data: [{ value: realtimeMetrics.value.cpu }] },
        { data: [{ value: realtimeMetrics.value.memory }] },
        { data: [{ value: realtimeMetrics.value.gpu }] }
      ]
    })
  }

  // 更新实时监控图表（模拟新数据点）
  if (realtimeChart) {
    const option = realtimeChart.getOption() as any
    const now = new Date()
    const newTime = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`

    option.xAxis[0].data.shift()
    option.xAxis[0].data.push(newTime)

    option.series[0].data.shift()
    option.series[0].data.push(Math.floor(Math.random() * 50) + 100)

    option.series[1].data.shift()
    option.series[1].data.push(Math.floor(Math.random() * 50) + 120)

    realtimeChart.setOption(option)
  }
}

// 加载所有数据
const loadData = async () => {
  loading.value = true
  try {
    const [metrics, versions, alertList, confidence] = await Promise.all([
      mockPerformanceMetrics(),
      mockModelVersions(),
      mockAlerts(),
      mockConfidenceDistribution()
    ])

    performanceMetrics.value = metrics
    modelVersions.value = versions
    alerts.value = alertList
    confidenceDistribution.value = confidence

    // 初始化实时数据
    realtimeMetrics.value = mockRealtimeMetrics()

    // 等待 DOM 更新后初始化图表
    setTimeout(() => {
      initTrendChart()
      initModelCompareChart()
      initRealtimeChart()
      initResourceChart()
      initConfidenceChart()
    }, 100)
  } catch (error) {
    ElMessage.error('数据加载失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 时间范围变化
const handleTimeRangeChange = () => {
  loadData()
}

// 处理告警
const handleAlert = (alert: Alert) => {
  ElMessage.success(`开始处理告警: ${alert.title}`)
  alert.status = 'processing'
}

// 生命周期
onMounted(() => {
  loadData()

  // 启动实时数据更新
  realtimeTimer = setInterval(updateRealtimeData, 3000)

  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    trendChart?.resize()
    modelCompareChart?.resize()
    realtimeChart?.resize()
    resourceChart?.resize()
    confidenceChart?.resize()
  })
})

onUnmounted(() => {
  // 清理定时器
  if (realtimeTimer) {
    clearInterval(realtimeTimer)
  }

  // 销毁图表实例
  trendChart?.dispose()
  modelCompareChart?.dispose()
  realtimeChart?.dispose()
  resourceChart?.dispose()
  confidenceChart?.dispose()
})
</script>

<template>
  <div class="performance-monitor" v-loading="loading">
    <!-- 顶部时间筛选 -->
    <el-card class="header-card" shadow="never">
      <div class="header-content">
        <h2>模型性能监控</h2>
        <el-radio-group v-model="timeRange" @change="handleTimeRangeChange">
          <el-radio-button
            v-for="option in timeRangeOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </el-radio-button>
        </el-radio-group>
      </div>
    </el-card>

    <!-- 性能概览仪表盘 -->
    <el-row :gutter="16" class="metrics-row">
      <el-col :xs="12" :sm="12" :md="6" :lg="6">
        <el-card shadow="hover">
          <el-statistic title="准确率" :value="performanceMetrics.accuracy" :precision="2" suffix="%">
            <template #prefix>
              <span class="trend-icon" :class="performanceMetrics.trend.accuracyChange >= 0 ? 'positive' : 'negative'">
                {{ performanceMetrics.trend.accuracyChange >= 0 ? '↑' : '↓' }}
              </span>
            </template>
          </el-statistic>
          <div class="metric-trend">
            环比 {{ performanceMetrics.trend.accuracyChange.toFixed(2) }}%
          </div>
        </el-card>
      </el-col>

      <el-col :xs="12" :sm="12" :md="6" :lg="6">
        <el-card shadow="hover">
          <el-statistic title="召回率" :value="performanceMetrics.recall" :precision="2" suffix="%">
            <template #prefix>
              <span class="trend-icon" :class="performanceMetrics.trend.recallChange >= 0 ? 'positive' : 'negative'">
                {{ performanceMetrics.trend.recallChange >= 0 ? '↑' : '↓' }}
              </span>
            </template>
          </el-statistic>
          <div class="metric-trend">
            环比 {{ performanceMetrics.trend.recallChange.toFixed(2) }}%
          </div>
        </el-card>
      </el-col>

      <el-col :xs="12" :sm="12" :md="6" :lg="6">
        <el-card shadow="hover">
          <el-statistic title="F1 分数" :value="performanceMetrics.f1Score" :precision="2" suffix="%">
            <template #prefix>
              <span class="trend-icon" :class="performanceMetrics.trend.f1Change >= 0 ? 'positive' : 'negative'">
                {{ performanceMetrics.trend.f1Change >= 0 ? '↑' : '↓' }}
              </span>
            </template>
          </el-statistic>
          <div class="metric-trend">
            环比 {{ performanceMetrics.trend.f1Change.toFixed(2) }}%
          </div>
        </el-card>
      </el-col>

      <el-col :xs="12" :sm="12" :md="6" :lg="6">
        <el-card shadow="hover">
          <el-statistic title="响应时间" :value="performanceMetrics.responseTime" :precision="0" suffix="ms">
            <template #prefix>
              <span class="trend-icon" :class="performanceMetrics.trend.responseTimeChange <= 0 ? 'positive' : 'negative'">
                {{ performanceMetrics.trend.responseTimeChange <= 0 ? '↓' : '↑' }}
              </span>
            </template>
          </el-statistic>
          <div class="metric-trend">
            环比 {{ Math.abs(performanceMetrics.trend.responseTimeChange).toFixed(0) }}ms
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="metrics-row">
      <el-col :xs="12" :sm="8" :md="8" :lg="8">
        <el-card shadow="hover">
          <el-statistic title="识别总量" :value="performanceMetrics.totalRecognitions" />
        </el-card>
      </el-col>

      <el-col :xs="12" :sm="8" :md="8" :lg="8">
        <el-card shadow="hover">
          <el-statistic title="成功率" :value="performanceMetrics.successRate" :precision="2" suffix="%" />
        </el-card>
      </el-col>

      <el-col :xs="12" :sm="8" :md="8" :lg="8">
        <el-card shadow="hover">
          <el-statistic title="异常数量" :value="performanceMetrics.anomalyCount">
            <template #suffix>
              <el-tag v-if="performanceMetrics.anomalyCount > 100" type="danger" size="small">高</el-tag>
              <el-tag v-else-if="performanceMetrics.anomalyCount > 50" type="warning" size="small">中</el-tag>
              <el-tag v-else type="success" size="small">低</el-tag>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- 性能趋势图表 -->
    <el-card class="chart-card" shadow="never">
      <div id="trendChart" style="width: 100%; height: 350px;"></div>
    </el-card>

    <!-- 模型性能对比 -->
    <el-row :gutter="16">
      <el-col :xs="24" :sm="24" :md="14" :lg="14">
        <el-card class="chart-card" shadow="never">
          <div id="modelCompareChart" style="width: 100%; height: 350px;"></div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="10" :lg="10">
        <el-card class="table-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>模型版本排名</span>
            </div>
          </template>
          <el-table :data="modelVersions" style="width: 100%" max-height="350">
            <el-table-column prop="name" label="模型名称" width="120" />
            <el-table-column prop="version" label="版本" width="90" />
            <el-table-column prop="f1Score" label="F1分数" width="90">
              <template #default="{ row }">
                {{ row.f1Score.toFixed(1) }}%
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 'excellent' ? 'success' : row.status === 'good' ? '' : row.status === 'normal' ? 'warning' : 'danger'" size="small">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 实时监控面板 -->
    <el-row :gutter="16">
      <el-col :xs="24" :sm="24" :md="14" :lg="14">
        <el-card class="chart-card" shadow="never">
          <div id="realtimeChart" style="width: 100%; height: 350px;"></div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="10" :lg="10">
        <el-card class="chart-card" shadow="never">
          <div id="resourceChart" style="width: 100%; height: 350px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 实时指标卡片 -->
    <el-row :gutter="16" class="metrics-row">
      <el-col :xs="12" :sm="6" :md="6" :lg="6">
        <el-card shadow="hover" class="realtime-card">
          <div class="realtime-metric">
            <div class="metric-label">请求总数</div>
            <div class="metric-value">{{ realtimeMetrics.requestCount.toLocaleString() }}</div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="12" :sm="6" :md="6" :lg="6">
        <el-card shadow="hover" class="realtime-card">
          <div class="realtime-metric">
            <div class="metric-label">成功数</div>
            <div class="metric-value success">{{ realtimeMetrics.successCount.toLocaleString() }}</div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="12" :sm="6" :md="6" :lg="6">
        <el-card shadow="hover" class="realtime-card">
          <div class="realtime-metric">
            <div class="metric-label">失败数</div>
            <div class="metric-value danger">{{ realtimeMetrics.failCount }}</div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="12" :sm="6" :md="6" :lg="6">
        <el-card shadow="hover" class="realtime-card">
          <div class="realtime-metric">
            <div class="metric-label">QPS</div>
            <div class="metric-value">{{ realtimeMetrics.qps }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 性能指标分析 -->
    <el-row :gutter="16">
      <el-col :xs="24" :sm="24" :md="12" :lg="12">
        <el-card class="chart-card" shadow="never">
          <div id="confidenceChart" style="width: 100%; height: 350px;"></div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="12" :lg="12">
        <el-card class="table-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>置信度分布详情</span>
            </div>
          </template>
          <el-table :data="confidenceDistribution" style="width: 100%" max-height="350">
            <el-table-column prop="range" label="置信度范围" />
            <el-table-column prop="count" label="数量">
              <template #default="{ row }">
                {{ row.count.toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="percentage" label="占比">
              <template #default="{ row }">
                <el-progress :percentage="row.percentage" :stroke-width="10" />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 异常告警管理 -->
    <el-card class="alert-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>异常告警</span>
          <el-tag type="danger" size="small">{{ alerts.filter(a => a.status === 'pending').length }} 待处理</el-tag>
        </div>
      </template>

      <el-timeline>
        <el-timeline-item
          v-for="alert in alerts"
          :key="alert.id"
          :timestamp="alert.time"
          :type="getAlertLevelType(alert.level)"
        >
          <el-card>
            <div class="alert-item">
              <div class="alert-header">
                <div class="alert-title">
                  <el-tag :type="getAlertLevelType(alert.level)" size="small">
                    {{ alert.level === 'critical' ? '严重' : alert.level === 'warning' ? '警告' : '提示' }}
                  </el-tag>
                  <span class="title-text">{{ alert.title }}</span>
                </div>
                <el-tag :type="getAlertStatusTag(alert.status).type" size="small">
                  {{ getAlertStatusTag(alert.status).text }}
                </el-tag>
              </div>
              <div class="alert-content">{{ alert.content }}</div>
              <el-alert
                :title="`处置建议: ${alert.suggestion}`"
                type="info"
                :closable="false"
                style="margin-top: 10px;"
              />
              <div class="alert-actions" v-if="alert.status === 'pending'">
                <el-button type="primary" size="small" @click="handleAlert(alert)">
                  立即处理
                </el-button>
              </div>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.performance-monitor {
  .header-card {
    margin-bottom: 20px;

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
      }
    }
  }

  .metrics-row {
    margin-bottom: 20px;
  }

  .trend-icon {
    font-size: 16px;
    font-weight: bold;
    margin-right: 4px;

    &.positive {
      color: #67c23a;
    }

    &.negative {
      color: #f56c6c;
    }
  }

  .metric-trend {
    margin-top: 8px;
    font-size: 12px;
    color: #909399;
  }

  .chart-card {
    margin-bottom: 20px;
  }

  .table-card {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
    }
  }

  .realtime-card {
    .realtime-metric {
      text-align: center;

      .metric-label {
        font-size: 14px;
        color: #909399;
        margin-bottom: 10px;
      }

      .metric-value {
        font-size: 24px;
        font-weight: bold;
        color: #303133;

        &.success {
          color: #67c23a;
        }

        &.danger {
          color: #f56c6c;
        }
      }
    }
  }

  .alert-card {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
    }

    .alert-item {
      .alert-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;

        .alert-title {
          display: flex;
          align-items: center;
          gap: 10px;

          .title-text {
            font-weight: 600;
            font-size: 16px;
          }
        }
      }

      .alert-content {
        color: #606266;
        margin-bottom: 10px;
        line-height: 1.6;
      }

      .alert-actions {
        margin-top: 15px;
        text-align: right;
      }
    }
  }
}

// 响应式调整
@media screen and (max-width: 768px) {
  .performance-monitor {
    padding: 10px;

    .header-card .header-content {
      flex-direction: column;
      gap: 15px;
      align-items: flex-start;

      h2 {
        font-size: 18px;
      }
    }
  }
}
</style>
