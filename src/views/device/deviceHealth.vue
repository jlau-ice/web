<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import {
  Search,
  Refresh,
  Download,
  Setting,
  TrendCharts,
  Warning,
  CircleCheck,
  Monitor,
  Bell,
  Document
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// 健康等级枚举
enum HealthLevel {
  HEALTHY = 'healthy',
  SUB_HEALTHY = 'sub_healthy',
  WARNING = 'warning',
  DANGER = 'danger'
}

// 指标状态枚举
enum MetricStatus {
  NORMAL = 'normal',
  WARNING = 'warning',
  EXCEEDED = 'exceeded'
}

// 设备健康信息接口
interface DeviceHealth {
  id: string
  deviceName: string
  healthScore: number
  healthLevel: HealthLevel
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  networkStatus: MetricStatus
  temperature: number
  uptime: number // 运行时间（小时）
  lastCheckTime: string
  alerts: Alert[]
}

// 预警信息接口
interface Alert {
  id: string
  deviceId: string
  deviceName: string
  level: 'info' | 'warning' | 'error' | 'critical'
  metric: string
  message: string
  suggestion: string
  time: string
  status: 'pending' | 'processing' | 'resolved'
}

// 健康趋势数据
interface HealthTrend {
  time: string
  score: number
}

// 健康报告
interface HealthReport {
  id: string
  deviceId: string
  deviceName: string
  generateTime: string
  period: string
  avgScore: number
  trend: 'up' | 'down' | 'stable'
  issues: string[]
  suggestions: string[]
}

// 指标阈值配置
interface ThresholdConfig {
  cpuWarning: number
  cpuDanger: number
  memoryWarning: number
  memoryDanger: number
  diskWarning: number
  diskDanger: number
  temperatureWarning: number
  temperatureDanger: number
}

// 搜索筛选条件
const searchForm = reactive({
  keyword: '',
  healthLevel: '',
  timeRange: ''
})

// 分页配置
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 数据状态
const loading = ref(false)
const deviceHealthList = ref<DeviceHealth[]>([])
const healthTrendData = ref<HealthTrend[]>([])
const alertList = ref<Alert[]>([])

// 健康度统计
const healthStatistics = computed(() => {
  const stats = {
    total: deviceHealthList.value.length,
    healthy: 0,
    subHealthy: 0,
    warning: 0,
    danger: 0,
    avgScore: 0
  }

  deviceHealthList.value.forEach(device => {
    switch (device.healthLevel) {
      case HealthLevel.HEALTHY:
        stats.healthy++
        break
      case HealthLevel.SUB_HEALTHY:
        stats.subHealthy++
        break
      case HealthLevel.WARNING:
        stats.warning++
        break
      case HealthLevel.DANGER:
        stats.danger++
        break
    }
  })

  if (stats.total > 0) {
    stats.avgScore = Math.round(
      deviceHealthList.value.reduce((sum, device) => sum + device.healthScore, 0) / stats.total
    )
  }

  return stats
})

// 筛选后的设备列表
const filteredDeviceList = computed(() => {
  let list = deviceHealthList.value

  if (searchForm.keyword) {
    list = list.filter(device =>
      device.deviceName.toLowerCase().includes(searchForm.keyword.toLowerCase())
    )
  }

  if (searchForm.healthLevel) {
    list = list.filter(device => device.healthLevel === searchForm.healthLevel)
  }

  pagination.total = list.length
  const start = (pagination.currentPage - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return list.slice(start, end)
})

// 阈值配置
const thresholdConfig = ref<ThresholdConfig>({
  cpuWarning: 70,
  cpuDanger: 90,
  memoryWarning: 70,
  memoryDanger: 90,
  diskWarning: 80,
  diskDanger: 95,
  temperatureWarning: 60,
  temperatureDanger: 80
})

// 对话框状态
const thresholdDialogVisible = ref(false)
const alertDialogVisible = ref(false)
const reportDialogVisible = ref(false)
const selectedDevice = ref<DeviceHealth | null>(null)

// ECharts 实例
let trendChart: echarts.ECharts | null = null
let indicatorChart: echarts.ECharts | null = null

// 获取健康等级标签类型
const getHealthLevelType = (level: HealthLevel) => {
  const typeMap = {
    [HealthLevel.HEALTHY]: 'success',
    [HealthLevel.SUB_HEALTHY]: 'primary',
    [HealthLevel.WARNING]: 'warning',
    [HealthLevel.DANGER]: 'danger'
  }
  return typeMap[level]
}

// 获取健康等级文本
const getHealthLevelText = (level: HealthLevel) => {
  const textMap = {
    [HealthLevel.HEALTHY]: '健康',
    [HealthLevel.SUB_HEALTHY]: '亚健康',
    [HealthLevel.WARNING]: '警告',
    [HealthLevel.DANGER]: '危险'
  }
  return textMap[level]
}

// 获取健康等级颜色
const getHealthLevelColor = (score: number) => {
  if (score >= 80) return '#67C23A'
  if (score >= 60) return '#409EFF'
  if (score >= 40) return '#E6A23C'
  return '#F56C6C'
}

// 获取指标状态类型
const getMetricStatusType = (status: MetricStatus) => {
  const typeMap = {
    [MetricStatus.NORMAL]: 'success',
    [MetricStatus.WARNING]: 'warning',
    [MetricStatus.EXCEEDED]: 'danger'
  }
  return typeMap[status]
}

// 获取指标状态文本
const getMetricStatusText = (status: MetricStatus) => {
  const textMap = {
    [MetricStatus.NORMAL]: '正常',
    [MetricStatus.WARNING]: '预警',
    [MetricStatus.EXCEEDED]: '超标'
  }
  return textMap[status]
}

// 获取预警级别类型
const getAlertLevelType = (level: string) => {
  const typeMap: Record<string, any> = {
    info: 'info',
    warning: 'warning',
    error: 'danger',
    critical: 'danger'
  }
  return typeMap[level]
}

// 获取预警级别文本
const getAlertLevelText = (level: string) => {
  const textMap: Record<string, string> = {
    info: '信息',
    warning: '警告',
    error: '错误',
    critical: '严重'
  }
  return textMap[level]
}

// 计算健康等级
const calculateHealthLevel = (score: number): HealthLevel => {
  if (score >= 80) return HealthLevel.HEALTHY
  if (score >= 60) return HealthLevel.SUB_HEALTHY
  if (score >= 40) return HealthLevel.WARNING
  return HealthLevel.DANGER
}

// 计算指标状态
const calculateMetricStatus = (value: number, metric: string): MetricStatus => {
  let warningThreshold = 70
  let dangerThreshold = 90

  switch (metric) {
    case 'cpu':
      warningThreshold = thresholdConfig.value.cpuWarning
      dangerThreshold = thresholdConfig.value.cpuDanger
      break
    case 'memory':
      warningThreshold = thresholdConfig.value.memoryWarning
      dangerThreshold = thresholdConfig.value.memoryDanger
      break
    case 'disk':
      warningThreshold = thresholdConfig.value.diskWarning
      dangerThreshold = thresholdConfig.value.diskDanger
      break
  }

  if (value >= dangerThreshold) return MetricStatus.EXCEEDED
  if (value >= warningThreshold) return MetricStatus.WARNING
  return MetricStatus.NORMAL
}

// 模拟获取设备健康数据
const fetchDeviceHealthData = () => {
  loading.value = true

  setTimeout(() => {
    const mockData: DeviceHealth[] = []
    const deviceNames = ['边缘服务器-01', '边缘服务器-02', '边缘服务器-03', '工控机-A1', '工控机-A2', 
                         '网关设备-G1', '网关设备-G2', '智能终端-T1', '智能终端-T2', '智能终端-T3',
                         '数据采集器-D1', '数据采集器-D2', '视频处理器-V1', '视频处理器-V2', '存储节点-S1']

    for (let i = 0; i < 15; i++) {
      const cpuUsage = Math.floor(Math.random() * 100)
      const memoryUsage = Math.floor(Math.random() * 100)
      const diskUsage = Math.floor(Math.random() * 100)
      const temperature = Math.floor(Math.random() * 50 + 30)
      
      // 计算健康评分（综合各项指标）
      const healthScore = Math.round(
        100 - (cpuUsage * 0.3 + memoryUsage * 0.3 + diskUsage * 0.2 + (temperature - 30) * 0.2)
      )

      const device: DeviceHealth = {
        id: `device-${i + 1}`,
        deviceName: deviceNames[i],
        healthScore: Math.max(0, Math.min(100, healthScore)),
        healthLevel: calculateHealthLevel(healthScore),
        cpuUsage,
        memoryUsage,
        diskUsage,
        networkStatus: Math.random() > 0.8 ? MetricStatus.WARNING : MetricStatus.NORMAL,
        temperature,
        uptime: Math.floor(Math.random() * 1000 + 100),
        lastCheckTime: new Date(Date.now() - Math.random() * 3600000).toLocaleString('zh-CN'),
        alerts: []
      }

      mockData.push(device)
    }

    deviceHealthList.value = mockData
    pagination.total = mockData.length
    loading.value = false

    // 生成预警数据
    generateAlerts()
  }, 800)
}

// 生成预警数据
const generateAlerts = () => {
  const alerts: Alert[] = []
  
  deviceHealthList.value.forEach(device => {
    // CPU 预警
    if (device.cpuUsage >= thresholdConfig.value.cpuDanger) {
      alerts.push({
        id: `alert-${device.id}-cpu`,
        deviceId: device.id,
        deviceName: device.deviceName,
        level: 'critical',
        metric: 'CPU',
        message: `CPU使用率过高: ${device.cpuUsage}%`,
        suggestion: '建议检查进程占用情况，优化任务调度或增加计算资源',
        time: device.lastCheckTime,
        status: 'pending'
      })
    } else if (device.cpuUsage >= thresholdConfig.value.cpuWarning) {
      alerts.push({
        id: `alert-${device.id}-cpu`,
        deviceId: device.id,
        deviceName: device.deviceName,
        level: 'warning',
        metric: 'CPU',
        message: `CPU使用率偏高: ${device.cpuUsage}%`,
        suggestion: '建议关注CPU使用趋势，适当调整任务分配',
        time: device.lastCheckTime,
        status: 'pending'
      })
    }

    // 内存预警
    if (device.memoryUsage >= thresholdConfig.value.memoryDanger) {
      alerts.push({
        id: `alert-${device.id}-memory`,
        deviceId: device.id,
        deviceName: device.deviceName,
        level: 'error',
        metric: '内存',
        message: `内存使用率过高: ${device.memoryUsage}%`,
        suggestion: '建议释放内存、关闭不必要的进程或扩展内存容量',
        time: device.lastCheckTime,
        status: 'pending'
      })
    }

    // 磁盘预警
    if (device.diskUsage >= thresholdConfig.value.diskDanger) {
      alerts.push({
        id: `alert-${device.id}-disk`,
        deviceId: device.id,
        deviceName: device.deviceName,
        level: 'error',
        metric: '磁盘',
        message: `磁盘使用率过高: ${device.diskUsage}%`,
        suggestion: '建议清理日志文件、删除临时数据或扩展磁盘空间',
        time: device.lastCheckTime,
        status: 'pending'
      })
    }

    // 温度预警
    if (device.temperature >= thresholdConfig.value.temperatureDanger) {
      alerts.push({
        id: `alert-${device.id}-temp`,
        deviceId: device.id,
        deviceName: device.deviceName,
        level: 'critical',
        metric: '温度',
        message: `设备温度过高: ${device.temperature}°C`,
        suggestion: '建议检查散热系统、清理风扇灰尘或改善环境通风',
        time: device.lastCheckTime,
        status: 'pending'
      })
    }

    // 网络预警
    if (device.networkStatus === MetricStatus.WARNING) {
      alerts.push({
        id: `alert-${device.id}-network`,
        deviceId: device.id,
        deviceName: device.deviceName,
        level: 'warning',
        metric: '网络',
        message: '网络连接不稳定',
        suggestion: '建议检查网络配置、路由器状态或网线连接',
        time: device.lastCheckTime,
        status: 'pending'
      })
    }
  })

  alertList.value = alerts
}

// 模拟获取健康趋势数据
const fetchHealthTrendData = () => {
  const data: HealthTrend[] = []
  const now = Date.now()

  for (let i = 23; i >= 0; i--) {
    const time = new Date(now - i * 3600000)
    const score = Math.floor(Math.random() * 20 + 70) // 70-90 分

    data.push({
      time: `${time.getHours()}:00`,
      score
    })
  }

  healthTrendData.value = data
  initTrendChart()
}

// 初始化趋势图表
const initTrendChart = () => {
  const chartDom = document.getElementById('trendChart')
  if (!chartDom) return

  if (trendChart) {
    trendChart.dispose()
  }

  trendChart = echarts.init(chartDom)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: healthTrendData.value.map(item => item.time)
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value} 分'
      }
    },
    series: [
      {
        name: '健康度评分',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: {
          color: '#409EFF'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ])
        },
        markLine: {
          silent: true,
          lineStyle: {
            color: '#67C23A'
          },
          data: [
            { yAxis: 80, label: { formatter: '健康线' } }
          ]
        },
        data: healthTrendData.value.map(item => item.score)
      }
    ]
  }

  trendChart.setOption(option)
}

// 初始化指标图表
const initIndicatorChart = (device: DeviceHealth) => {
  const chartDom = document.getElementById('indicatorChart')
  if (!chartDom) return

  if (indicatorChart) {
    indicatorChart.dispose()
  }

  indicatorChart = echarts.init(chartDom)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    radar: {
      indicator: [
        { name: 'CPU使用率', max: 100 },
        { name: '内存使用率', max: 100 },
        { name: '磁盘使用率', max: 100 },
        { name: '温度指数', max: 100 },
        { name: '网络质量', max: 100 }
      ],
      radius: '70%'
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: [
              device.cpuUsage,
              device.memoryUsage,
              device.diskUsage,
              Math.min(100, (device.temperature / 80) * 100),
              device.networkStatus === MetricStatus.NORMAL ? 95 : 60
            ],
            name: '当前指标',
            itemStyle: {
              color: '#409EFF'
            },
            areaStyle: {
              color: 'rgba(64, 158, 255, 0.3)'
            }
          }
        ]
      }
    ]
  }

  indicatorChart.setOption(option)
}

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1
}

// 重置搜索
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.healthLevel = ''
  searchForm.timeRange = ''
  pagination.currentPage = 1
}

// 刷新数据
const handleRefresh = () => {
  fetchDeviceHealthData()
  fetchHealthTrendData()
  ElMessage.success('数据已刷新')
}

// 查看设备详情
const handleViewDetail = (device: DeviceHealth) => {
  selectedDevice.value = device
  setTimeout(() => {
    initIndicatorChart(device)
  }, 100)
}

// 配置阈值
const handleConfigThreshold = () => {
  thresholdDialogVisible.value = true
}

// 保存阈值配置
const handleSaveThreshold = () => {
  ElMessage.success('阈值配置已保存')
  thresholdDialogVisible.value = false
  // 重新计算预警
  generateAlerts()
}

// 查看预警
const handleViewAlerts = () => {
  alertDialogVisible.value = true
}

// 处理预警
const handleProcessAlert = (alert: Alert) => {
  ElMessageBox.prompt('请输入处理说明', '处理预警', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /\S+/,
    inputErrorMessage: '处理说明不能为空'
  }).then(({ value }) => {
    alert.status = 'resolved'
    ElMessage.success('预警已处理')
  })
}

// 生成健康报告
const handleGenerateReport = () => {
  reportDialogVisible.value = true
}

// 导出报告
const handleExportReport = () => {
  ElMessage.success('健康报告导出成功')
}

// 下载报告
const handleDownloadReport = (format: string) => {
  ElMessage.success(`正在导出 ${format.toUpperCase()} 格式报告...`)
  setTimeout(() => {
    ElMessage.success('报告下载成功')
  }, 1500)
}

// 分页变化
const handlePageChange = (page: number) => {
  pagination.currentPage = page
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.currentPage = 1
}

// 组件挂载
onMounted(() => {
  fetchDeviceHealthData()
  fetchHealthTrendData()

  // 自动刷新（每30秒）
  const refreshInterval = setInterval(() => {
    if (!loading.value) {
      fetchDeviceHealthData()
      fetchHealthTrendData()
    }
  }, 30000)

  // 清理定时器
  onUnmounted(() => {
    clearInterval(refreshInterval)
    if (trendChart) {
      trendChart.dispose()
    }
    if (indicatorChart) {
      indicatorChart.dispose()
    }
  })
})
</script>

<template>
  <div class="device-health-container">
    <!-- 健康度概览 -->
    <div class="health-overview">
      <el-row :gutter="20">
        <!-- 整体健康评分 -->
        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <el-card class="gauge-card">
            <div class="gauge-wrapper">
              <el-progress
                type="dashboard"
                :percentage="healthStatistics.avgScore"
                :color="getHealthLevelColor(healthStatistics.avgScore)"
                :width="180"
              >
                <template #default="{ percentage }">
                  <div class="gauge-content">
                    <div class="score">{{ percentage }}</div>
                    <div class="label">整体健康度</div>
                  </div>
                </template>
              </el-progress>
            </div>
          </el-card>
        </el-col>

        <!-- 健康等级统计 -->
        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <el-card class="stat-card healthy">
            <el-statistic title="健康设备" :value="healthStatistics.healthy">
              <template #prefix>
                <el-icon :size="20" color="#67C23A"><CircleCheck /></el-icon>
              </template>
            </el-statistic>
            <div class="stat-footer">评分 ≥ 80</div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <el-card class="stat-card sub-healthy">
            <el-statistic title="亚健康设备" :value="healthStatistics.subHealthy">
              <template #prefix>
                <el-icon :size="20" color="#409EFF"><Monitor /></el-icon>
              </template>
            </el-statistic>
            <div class="stat-footer">60 ≤ 评分 < 80</div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <el-card class="stat-card warning">
            <el-statistic title="警告设备" :value="healthStatistics.warning">
              <template #prefix>
                <el-icon :size="20" color="#E6A23C"><Warning /></el-icon>
              </template>
            </el-statistic>
            <div class="stat-footer">40 ≤ 评分 < 60</div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <el-card class="stat-card danger">
            <el-statistic title="危险设备" :value="healthStatistics.danger">
              <template #prefix>
                <el-icon :size="20" color="#F56C6C"><Bell /></el-icon>
              </template>
            </el-statistic>
            <div class="stat-footer">评分 < 40</div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <el-card class="stat-card alerts">
            <el-statistic title="待处理预警" :value="alertList.filter(a => a.status === 'pending').length">
              <template #prefix>
                <el-icon :size="20" color="#F56C6C"><Bell /></el-icon>
              </template>
            </el-statistic>
            <div class="stat-footer">
              <el-link type="primary" @click="handleViewAlerts">查看详情</el-link>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <el-card class="stat-card total">
            <el-statistic title="设备总数" :value="healthStatistics.total">
              <template #prefix>
                <el-icon :size="20"><Monitor /></el-icon>
              </template>
            </el-statistic>
            <div class="stat-footer">在线监控中</div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 健康度趋势图 -->
      <el-card class="trend-card" style="margin-top: 20px">
        <template #header>
          <div class="card-header">
            <span class="title">
              <el-icon><TrendCharts /></el-icon>
              健康度趋势（24小时）
            </span>
            <div class="actions">
              <el-button :icon="Refresh" size="small" @click="fetchHealthTrendData">刷新</el-button>
            </div>
          </div>
        </template>
        <div id="trendChart" style="width: 100%; height: 300px"></div>
      </el-card>
    </div>

    <!-- 设备健康列表 -->
    <el-card class="table-card" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span class="title">
            <el-icon><Monitor /></el-icon>
            设备健康状态详情
          </span>
          <div class="actions">
            <el-button :icon="Setting" size="small" @click="handleConfigThreshold">阈值配置</el-button>
            <el-button :icon="Document" size="small" type="primary" @click="handleGenerateReport">生成报告</el-button>
            <el-button :icon="Refresh" size="small" @click="handleRefresh">刷新</el-button>
          </div>
        </div>
      </template>

      <!-- 搜索筛选 -->
      <div class="search-form">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="设备名称">
            <el-input
              v-model="searchForm.keyword"
              placeholder="请输入设备名称"
              clearable
              :prefix-icon="Search"
              style="width: 200px"
            />
          </el-form-item>
          <el-form-item label="健康等级">
            <el-select v-model="searchForm.healthLevel" placeholder="请选择" clearable style="width: 150px">
              <el-option label="健康" :value="HealthLevel.HEALTHY" />
              <el-option label="亚健康" :value="HealthLevel.SUB_HEALTHY" />
              <el-option label="警告" :value="HealthLevel.WARNING" />
              <el-option label="危险" :value="HealthLevel.DANGER" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
            <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 设备列表表格 -->
      <el-table
        :data="filteredDeviceList"
        v-loading="loading"
        stripe
        style="width: 100%"
        :default-sort="{ prop: 'healthScore', order: 'descending' }"
      >
        <el-table-column prop="deviceName" label="设备名称" width="160" fixed />
        <el-table-column prop="healthScore" label="健康评分" width="120" sortable>
          <template #default="{ row }">
            <div class="health-score">
              <el-progress
                :percentage="row.healthScore"
                :color="getHealthLevelColor(row.healthScore)"
                :stroke-width="8"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="healthLevel" label="健康等级" width="100">
          <template #default="{ row }">
            <el-tag :type="getHealthLevelType(row.healthLevel)" size="small">
              {{ getHealthLevelText(row.healthLevel) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="cpuUsage" label="CPU使用率" width="120" sortable>
          <template #default="{ row }">
            <span :style="{ color: calculateMetricStatus(row.cpuUsage, 'cpu') === MetricStatus.EXCEEDED ? '#F56C6C' : calculateMetricStatus(row.cpuUsage, 'cpu') === MetricStatus.WARNING ? '#E6A23C' : '#67C23A' }">
              {{ row.cpuUsage }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="memoryUsage" label="内存使用率" width="120" sortable>
          <template #default="{ row }">
            <span :style="{ color: calculateMetricStatus(row.memoryUsage, 'memory') === MetricStatus.EXCEEDED ? '#F56C6C' : calculateMetricStatus(row.memoryUsage, 'memory') === MetricStatus.WARNING ? '#E6A23C' : '#67C23A' }">
              {{ row.memoryUsage }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="diskUsage" label="磁盘使用率" width="120" sortable>
          <template #default="{ row }">
            <span :style="{ color: calculateMetricStatus(row.diskUsage, 'disk') === MetricStatus.EXCEEDED ? '#F56C6C' : calculateMetricStatus(row.diskUsage, 'disk') === MetricStatus.WARNING ? '#E6A23C' : '#67C23A' }">
              {{ row.diskUsage }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="networkStatus" label="网络状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getMetricStatusType(row.networkStatus)" size="small">
              {{ getMetricStatusText(row.networkStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="temperature" label="温度" width="100" sortable>
          <template #default="{ row }">
            <span :style="{ color: row.temperature >= thresholdConfig.temperatureDanger ? '#F56C6C' : row.temperature >= thresholdConfig.temperatureWarning ? '#E6A23C' : '#67C23A' }">
              {{ row.temperature }}°C
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="uptime" label="运行时间" width="120">
          <template #default="{ row }">
            {{ Math.floor(row.uptime / 24) }}天{{ row.uptime % 24 }}小时
          </template>
        </el-table-column>
        <el-table-column prop="lastCheckTime" label="最后检测时间" width="180" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleViewDetail(row)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <!-- 设备详情抽屉 -->
    <el-drawer
      v-model="selectedDevice"
      title="设备健康详情"
      size="60%"
      destroy-on-close
    >
      <template v-if="selectedDevice">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="设备名称">{{ selectedDevice.deviceName }}</el-descriptions-item>
          <el-descriptions-item label="设备ID">{{ selectedDevice.id }}</el-descriptions-item>
          <el-descriptions-item label="健康评分">
            <el-tag :type="getHealthLevelType(selectedDevice.healthLevel)" size="large">
              {{ selectedDevice.healthScore }} 分
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="健康等级">
            <el-tag :type="getHealthLevelType(selectedDevice.healthLevel)">
              {{ getHealthLevelText(selectedDevice.healthLevel) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="运行时间">
            {{ Math.floor(selectedDevice.uptime / 24) }}天{{ selectedDevice.uptime % 24 }}小时
          </el-descriptions-item>
          <el-descriptions-item label="最后检测">{{ selectedDevice.lastCheckTime }}</el-descriptions-item>
        </el-descriptions>

        <el-divider>性能指标监控</el-divider>

        <div id="indicatorChart" style="width: 100%; height: 400px; margin: 20px 0"></div>

        <el-row :gutter="20" style="margin-top: 20px">
          <el-col :span="12">
            <el-card>
              <template #header>CPU使用率</template>
              <el-progress
                :percentage="selectedDevice.cpuUsage"
                :color="getHealthLevelColor(100 - selectedDevice.cpuUsage)"
                :stroke-width="20"
              />
              <div style="margin-top: 10px; color: #909399; font-size: 12px">
                状态: 
                <el-tag :type="getMetricStatusType(calculateMetricStatus(selectedDevice.cpuUsage, 'cpu'))" size="small">
                  {{ getMetricStatusText(calculateMetricStatus(selectedDevice.cpuUsage, 'cpu')) }}
                </el-tag>
              </div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <template #header>内存使用率</template>
              <el-progress
                :percentage="selectedDevice.memoryUsage"
                :color="getHealthLevelColor(100 - selectedDevice.memoryUsage)"
                :stroke-width="20"
              />
              <div style="margin-top: 10px; color: #909399; font-size: 12px">
                状态: 
                <el-tag :type="getMetricStatusType(calculateMetricStatus(selectedDevice.memoryUsage, 'memory'))" size="small">
                  {{ getMetricStatusText(calculateMetricStatus(selectedDevice.memoryUsage, 'memory')) }}
                </el-tag>
              </div>
            </el-card>
          </el-col>
          <el-col :span="12" style="margin-top: 20px">
            <el-card>
              <template #header>磁盘使用率</template>
              <el-progress
                :percentage="selectedDevice.diskUsage"
                :color="getHealthLevelColor(100 - selectedDevice.diskUsage)"
                :stroke-width="20"
              />
              <div style="margin-top: 10px; color: #909399; font-size: 12px">
                状态: 
                <el-tag :type="getMetricStatusType(calculateMetricStatus(selectedDevice.diskUsage, 'disk'))" size="small">
                  {{ getMetricStatusText(calculateMetricStatus(selectedDevice.diskUsage, 'disk')) }}
                </el-tag>
              </div>
            </el-card>
          </el-col>
          <el-col :span="12" style="margin-top: 20px">
            <el-card>
              <template #header>设备温度</template>
              <el-progress
                :percentage="Math.min(100, (selectedDevice.temperature / 80) * 100)"
                :color="selectedDevice.temperature >= thresholdConfig.temperatureDanger ? '#F56C6C' : selectedDevice.temperature >= thresholdConfig.temperatureWarning ? '#E6A23C' : '#67C23A'"
                :stroke-width="20"
              >
                <template #default>{{ selectedDevice.temperature }}°C</template>
              </el-progress>
              <div style="margin-top: 10px; color: #909399; font-size: 12px">
                状态: 
                <el-tag 
                  :type="selectedDevice.temperature >= thresholdConfig.temperatureDanger ? 'danger' : selectedDevice.temperature >= thresholdConfig.temperatureWarning ? 'warning' : 'success'" 
                  size="small"
                >
                  {{ selectedDevice.temperature >= thresholdConfig.temperatureDanger ? '过热' : selectedDevice.temperature >= thresholdConfig.temperatureWarning ? '偏高' : '正常' }}
                </el-tag>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-divider>相关预警</el-divider>

        <el-timeline v-if="alertList.filter(a => a.deviceId === selectedDevice.id).length > 0">
          <el-timeline-item
            v-for="alert in alertList.filter(a => a.deviceId === selectedDevice.id)"
            :key="alert.id"
            :timestamp="alert.time"
            :type="getAlertLevelType(alert.level)"
          >
            <el-card>
              <div class="alert-item">
                <div class="alert-header">
                  <el-tag :type="getAlertLevelType(alert.level)" size="small">
                    {{ getAlertLevelText(alert.level) }}
                  </el-tag>
                  <span class="metric">{{ alert.metric }}</span>
                </div>
                <div class="alert-message">{{ alert.message }}</div>
                <div class="alert-suggestion">
                  <el-icon><Warning /></el-icon>
                  {{ alert.suggestion }}
                </div>
                <div class="alert-actions" v-if="alert.status === 'pending'">
                  <el-button type="primary" size="small" @click="handleProcessAlert(alert)">
                    标记已处理
                  </el-button>
                </div>
                <div v-else>
                  <el-tag type="info" size="small">已处理</el-tag>
                </div>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="暂无预警信息" />
      </template>
    </el-drawer>

    <!-- 阈值配置对话框 -->
    <el-dialog
      v-model="thresholdDialogVisible"
      title="指标阈值配置"
      width="500px"
    >
      <el-form :model="thresholdConfig" label-width="120px">
        <el-divider content-position="left">CPU 阈值</el-divider>
        <el-form-item label="预警阈值">
          <el-input-number v-model="thresholdConfig.cpuWarning" :min="0" :max="100" />
          <span style="margin-left: 10px; color: #909399">%</span>
        </el-form-item>
        <el-form-item label="危险阈值">
          <el-input-number v-model="thresholdConfig.cpuDanger" :min="0" :max="100" />
          <span style="margin-left: 10px; color: #909399">%</span>
        </el-form-item>

        <el-divider content-position="left">内存阈值</el-divider>
        <el-form-item label="预警阈值">
          <el-input-number v-model="thresholdConfig.memoryWarning" :min="0" :max="100" />
          <span style="margin-left: 10px; color: #909399">%</span>
        </el-form-item>
        <el-form-item label="危险阈值">
          <el-input-number v-model="thresholdConfig.memoryDanger" :min="0" :max="100" />
          <span style="margin-left: 10px; color: #909399">%</span>
        </el-form-item>

        <el-divider content-position="left">磁盘阈值</el-divider>
        <el-form-item label="预警阈值">
          <el-input-number v-model="thresholdConfig.diskWarning" :min="0" :max="100" />
          <span style="margin-left: 10px; color: #909399">%</span>
        </el-form-item>
        <el-form-item label="危险阈值">
          <el-input-number v-model="thresholdConfig.diskDanger" :min="0" :max="100" />
          <span style="margin-left: 10px; color: #909399">%</span>
        </el-form-item>

        <el-divider content-position="left">温度阈值</el-divider>
        <el-form-item label="预警阈值">
          <el-input-number v-model="thresholdConfig.temperatureWarning" :min="0" :max="150" />
          <span style="margin-left: 10px; color: #909399">°C</span>
        </el-form-item>
        <el-form-item label="危险阈值">
          <el-input-number v-model="thresholdConfig.temperatureDanger" :min="0" :max="150" />
          <span style="margin-left: 10px; color: #909399">°C</span>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="thresholdDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveThreshold">保存配置</el-button>
      </template>
    </el-dialog>

    <!-- 预警列表对话框 -->
    <el-dialog
      v-model="alertDialogVisible"
      title="设备健康预警"
      width="80%"
      destroy-on-close
    >
      <el-table :data="alertList" stripe max-height="500">
        <el-table-column prop="deviceName" label="设备名称" width="150" />
        <el-table-column prop="level" label="预警级别" width="100">
          <template #default="{ row }">
            <el-tag :type="getAlertLevelType(row.level)" size="small">
              {{ getAlertLevelText(row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="metric" label="指标" width="100" />
        <el-table-column prop="message" label="预警信息" min-width="200" />
        <el-table-column prop="suggestion" label="处理建议" min-width="250" />
        <el-table-column prop="time" label="时间" width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'pending'" type="warning" size="small">待处理</el-tag>
            <el-tag v-else-if="row.status === 'processing'" type="primary" size="small">处理中</el-tag>
            <el-tag v-else type="success" size="small">已处理</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'pending'"
              link
              type="primary"
              size="small"
              @click="handleProcessAlert(row)"
            >
              处理
            </el-button>
            <span v-else style="color: #909399">-</span>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 健康报告对话框 -->
    <el-dialog
      v-model="reportDialogVisible"
      title="设备健康报告"
      width="70%"
      destroy-on-close
    >
      <el-card class="report-card">
        <template #header>
          <div class="report-header">
            <h3>设备健康度分析报告</h3>
            <div class="report-meta">
              <span>生成时间：{{ new Date().toLocaleString('zh-CN') }}</span>
              <span>报告周期：最近24小时</span>
            </div>
          </div>
        </template>

        <el-descriptions title="总体概况" :column="3" border>
          <el-descriptions-item label="设备总数">{{ healthStatistics.total }}</el-descriptions-item>
          <el-descriptions-item label="平均健康度">{{ healthStatistics.avgScore }} 分</el-descriptions-item>
          <el-descriptions-item label="健康率">
            {{ healthStatistics.total > 0 ? Math.round((healthStatistics.healthy / healthStatistics.total) * 100) : 0 }}%
          </el-descriptions-item>
          <el-descriptions-item label="健康设备">{{ healthStatistics.healthy }}</el-descriptions-item>
          <el-descriptions-item label="亚健康设备">{{ healthStatistics.subHealthy }}</el-descriptions-item>
          <el-descriptions-item label="警告设备">{{ healthStatistics.warning }}</el-descriptions-item>
          <el-descriptions-item label="危险设备">{{ healthStatistics.danger }}</el-descriptions-item>
          <el-descriptions-item label="待处理预警">
            {{ alertList.filter(a => a.status === 'pending').length }}
          </el-descriptions-item>
          <el-descriptions-item label="趋势分析">
            <el-tag type="success">整体稳定</el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">主要问题</el-divider>
        <el-alert
          v-if="healthStatistics.danger > 0"
          type="error"
          :title="`检测到 ${healthStatistics.danger} 台设备处于危险状态，需要立即处理`"
          :closable="false"
          show-icon
        />
        <el-alert
          v-if="healthStatistics.warning > 0"
          type="warning"
          :title="`检测到 ${healthStatistics.warning} 台设备处于警告状态，建议尽快排查`"
          :closable="false"
          show-icon
          style="margin-top: 10px"
        />
        <el-alert
          v-if="alertList.filter(a => a.level === 'critical').length > 0"
          type="error"
          :title="`发现 ${alertList.filter(a => a.level === 'critical').length} 个严重预警，请立即关注`"
          :closable="false"
          show-icon
          style="margin-top: 10px"
        />

        <el-divider content-position="left">改进建议</el-divider>
        <ul class="suggestions">
          <li v-if="healthStatistics.danger > 0">
            对危险状态设备进行紧急维护，优先检查CPU、内存和温度等关键指标
          </li>
          <li v-if="healthStatistics.warning > 0">
            对警告状态设备制定改进计划，定期监控其健康度变化趋势
          </li>
          <li v-if="alertList.filter(a => a.metric === '温度').length > 0">
            加强设备散热管理，检查机房环境温度和通风情况
          </li>
          <li v-if="alertList.filter(a => a.metric === '磁盘').length > 0">
            及时清理磁盘空间，建立日志归档和清理机制
          </li>
          <li>建议定期（每周）生成健康报告，建立设备健康档案</li>
          <li>优化资源调度策略，均衡设备负载分配</li>
          <li>建立设备健康预警响应机制，提高故障处理效率</li>
        </ul>
      </el-card>

      <template #footer>
        <el-button @click="reportDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleDownloadReport('pdf')">
          <el-icon><Download /></el-icon>
          导出PDF
        </el-button>
        <el-button type="success" @click="handleDownloadReport('excel')">
          <el-icon><Download /></el-icon>
          导出Excel
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.device-health-container {
  min-height: calc(100vh - 100px);

  .health-overview {
    .gauge-card {
      height: 100%;
      
      .gauge-wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px 0;

        .gauge-content {
          text-align: center;

          .score {
            font-size: 36px;
            font-weight: bold;
            color: #303133;
          }

          .label {
            font-size: 14px;
            color: #909399;
            margin-top: 8px;
          }
        }
      }
    }

    .stat-card {
      height: 100%;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .stat-footer {
        margin-top: 12px;
        font-size: 12px;
        color: #909399;
      }

      &.healthy {
        border-left: 4px solid #67C23A;
      }

      &.sub-healthy {
        border-left: 4px solid #409EFF;
      }

      &.warning {
        border-left: 4px solid #E6A23C;
      }

      &.danger {
        border-left: 4px solid #F56C6C;
      }

      &.alerts {
        border-left: 4px solid #F56C6C;
      }

      &.total {
        border-left: 4px solid #909399;
      }
    }
  }

  .trend-card,
  .table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .title {
        font-size: 16px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .actions {
        display: flex;
        gap: 8px;
      }
    }
  }

  .search-form {
    margin-bottom: 20px;
  }

  .health-score {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .pagination-wrapper {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .alert-item {
    .alert-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;

      .metric {
        font-weight: 500;
        color: #303133;
      }
    }

    .alert-message {
      font-size: 14px;
      color: #606266;
      margin-bottom: 8px;
    }

    .alert-suggestion {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      font-size: 13px;
      color: #909399;
      background-color: #f5f7fa;
      padding: 8px;
      border-radius: 4px;
      margin-bottom: 10px;

      .el-icon {
        margin-top: 2px;
        color: #E6A23C;
      }
    }

    .alert-actions {
      display: flex;
      justify-content: flex-end;
    }
  }

  .report-card {
    .report-header {
      h3 {
        margin: 0 0 10px 0;
        font-size: 20px;
        color: #303133;
      }

      .report-meta {
        display: flex;
        gap: 20px;
        font-size: 13px;
        color: #909399;
      }
    }

    .suggestions {
      padding-left: 20px;
      line-height: 1.8;
      color: #606266;

      li {
        margin-bottom: 8px;
      }
    }
  }
}

// 响应式布局
@media (max-width: 768px) {
  .device-health-container {
    padding: 10px;

    .health-overview {
      .el-col {
        margin-bottom: 10px;
      }
    }

    .search-form {
      .el-form-item {
        width: 100%;
        margin-right: 0;
      }
    }
  }
}
</style>