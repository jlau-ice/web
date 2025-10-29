<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

// 定义时间范围类型
type TimeRange = 'today' | 'week' | 'month'

// 核心指标数据类型
interface CoreMetrics {
  totalProducts: number
  todayQueries: number
  qualifiedRate: number
  abnormalRate: number
  productsTrend: number
  queriesTrend: number
  qualifiedTrend: number
  abnormalTrend: number
}

// 生产基地数据类型
interface ProductionBase {
  name: string
  output: number
  area: number
  qualifiedRate: number
  cost: number
}

// 流通环节数据类型
interface CirculationData {
  stage: string
  avgTime: number
  distance: number
  cost: number
  turnoverRate: number
  abnormalCount: number
}

// 质量等级数据类型
interface QualityLevel {
  level: string
  count: number
  percentage: number
}

// 检测项目数据类型
interface TestItem {
  name: string
  totalTests: number
  failedTests: number
  failRate: number
}

// 溯源查询地域数据类型
interface QueryRegion {
  province: string
  queryCount: number
  concernIndex: number
}

// 状态管理
const loading = ref(false)
const timeRange = ref<TimeRange>('today')
const dateRange = ref<[Date, Date]>()

// 核心指标数据
const coreMetrics = ref<CoreMetrics>({
  totalProducts: 0,
  todayQueries: 0,
  qualifiedRate: 0,
  abnormalRate: 0,
  productsTrend: 0,
  queriesTrend: 0,
  qualifiedTrend: 0,
  abnormalTrend: 0,
})

// 生产统计数据
const productionData = ref<ProductionBase[]>([])
const varietyData = ref<any[]>([])

// 流通统计数据
const circulationData = ref<CirculationData[]>([])

// 质量统计数据
const qualityLevels = ref<QualityLevel[]>([])
const testItems = ref<TestItem[]>([])

// 溯源效果数据
const queryRegions = ref<QueryRegion[]>([])

// ECharts 实例
let productionChart: echarts.ECharts | null = null
let qualityTrendChart: echarts.ECharts | null = null
let circulationTimeChart: echarts.ECharts | null = null
let qualityPieChart: echarts.ECharts | null = null
let regionMapChart: echarts.ECharts | null = null
let brandRadarChart: echarts.ECharts | null = null

// 获取趋势颜色
const getTrendColor = (trend: number) => {
  if (trend > 0) return 'success'
  if (trend < 0) return 'danger'
  return 'info'
}

// 获取趋势图标
const getTrendIcon = (trend: number) => {
  if (trend > 0) return 'Top'
  if (trend < 0) return 'Bottom'
  return 'Minus'
}

// Mock 核心指标数据
const mockCoreMetrics = (): Promise<CoreMetrics> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const data: CoreMetrics = {
        totalProducts: 15680,
        todayQueries: 3240,
        qualifiedRate: 98.5,
        abnormalRate: 1.2,
        productsTrend: 12.5,
        queriesTrend: 8.3,
        qualifiedTrend: 2.1,
        abnormalTrend: -0.8,
      }
      
      // 根据时间范围调整数据
      if (timeRange.value === 'week') {
        data.todayQueries = 18900
        data.queriesTrend = 15.2
      } else if (timeRange.value === 'month') {
        data.todayQueries = 89600
        data.queriesTrend = 22.8
      }
      
      resolve(data)
    }, 500)
  })
}

// Mock 生产统计数据
const mockProductionData = (): Promise<ProductionBase[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { name: '华北生产基地', output: 3200, area: 580, qualifiedRate: 98.5, cost: 456000 },
        { name: '华东生产基地', output: 4100, area: 720, qualifiedRate: 99.2, cost: 589000 },
        { name: '华南生产基地', output: 2800, area: 480, qualifiedRate: 97.8, cost: 412000 },
        { name: '西南生产基地', output: 3600, area: 650, qualifiedRate: 98.9, cost: 523000 },
        { name: '东北生产基地', output: 2500, area: 420, qualifiedRate: 98.1, cost: 378000 },
      ])
    }, 600)
  })
}

// Mock 品种数据
const mockVarietyData = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { variety: '有机蔬菜', area: 1200, output: 5400, avgPrice: 15.8 },
        { variety: '特色水果', area: 980, output: 4200, avgPrice: 28.5 },
        { variety: '优质粮食', area: 850, output: 3800, avgPrice: 6.2 },
        { variety: '生态禽蛋', area: 720, output: 2600, avgPrice: 12.3 },
      ])
    }, 650)
  })
}

// Mock 流通数据
const mockCirculationData = (): Promise<CirculationData[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { stage: '采摘/收获', avgTime: 2.5, distance: 0, cost: 1200, turnoverRate: 95.5, abnormalCount: 3 },
        { stage: '初加工', avgTime: 4.2, distance: 15, cost: 2800, turnoverRate: 88.2, abnormalCount: 5 },
        { stage: '仓储', avgTime: 12.5, distance: 0, cost: 1500, turnoverRate: 72.8, abnormalCount: 8 },
        { stage: '运输', avgTime: 18.3, distance: 320, cost: 5600, turnoverRate: 85.3, abnormalCount: 12 },
        { stage: '批发', avgTime: 8.6, distance: 45, cost: 3200, turnoverRate: 90.1, abnormalCount: 4 },
        { stage: '零售', avgTime: 6.8, distance: 25, cost: 2100, turnoverRate: 93.6, abnormalCount: 2 },
      ])
    }, 700)
  })
}

// Mock 质量等级数据
const mockQualityLevels = (): Promise<QualityLevel[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { level: '优等品', count: 12560, percentage: 80.1 },
        { level: '一等品', count: 2180, percentage: 13.9 },
        { level: '合格品', count: 705, percentage: 4.5 },
        { level: '不合格', count: 235, percentage: 1.5 },
      ])
    }, 650)
  })
}

// Mock 检测项目数据
const mockTestItems = (): Promise<TestItem[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { name: '农药残留检测', totalTests: 15680, failedTests: 98, failRate: 0.62 },
        { name: '重金属检测', totalTests: 15680, failedTests: 45, failRate: 0.29 },
        { name: '微生物检测', totalTests: 15680, failedTests: 125, failRate: 0.80 },
        { name: '添加剂检测', totalTests: 15680, failedTests: 67, failRate: 0.43 },
        { name: '营养成分检测', totalTests: 15680, failedTests: 32, failRate: 0.20 },
      ])
    }, 700)
  })
}

// Mock 查询地域数据
const mockQueryRegions = (): Promise<QueryRegion[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { province: '广东', queryCount: 8560, concernIndex: 92 },
        { province: '浙江', queryCount: 7280, concernIndex: 88 },
        { province: '江苏', queryCount: 6920, concernIndex: 86 },
        { province: '上海', queryCount: 5840, concernIndex: 91 },
        { province: '北京', queryCount: 5360, concernIndex: 89 },
        { province: '山东', queryCount: 4680, concernIndex: 78 },
        { province: '四川', queryCount: 3920, concernIndex: 75 },
        { province: '湖北', queryCount: 3450, concernIndex: 72 },
      ])
    }, 750)
  })
}

// 初始化生产基地产量对比图
const initProductionChart = () => {
  const chartDom = document.getElementById('productionChart')
  if (!chartDom) return
  
  productionChart = echarts.init(chartDom)
  
  const option: EChartsOption = {
    title: {
      text: '各生产基地产量对比',
      left: 'center',
      top: '0',
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    legend: {
      data: ['产量(吨)', '种植面积(亩)', '合格率(%)'],
      top: 30,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: productionData.value.map(item => item.name),
    },
    yAxis: [
      {
        type: 'value',
        name: '产量/面积',
      },
      {
        type: 'value',
        name: '合格率(%)',
        min: 95,
        max: 100,
      },
    ],
    series: [
      {
        name: '产量(吨)',
        type: 'bar',
        data: productionData.value.map(item => item.output),
        itemStyle: {
          color: '#5470c6',
        },
      },
      {
        name: '种植面积(亩)',
        type: 'bar',
        data: productionData.value.map(item => item.area),
        itemStyle: {
          color: '#91cc75',
        },
      },
      {
        name: '合格率(%)',
        type: 'line',
        yAxisIndex: 1,
        data: productionData.value.map(item => item.qualifiedRate),
        itemStyle: {
          color: '#fac858',
        },
      },
    ],
  }
  
  productionChart.setOption(option)
}

// 初始化质量趋势图
const initQualityTrendChart = () => {
  const chartDom = document.getElementById('qualityTrendChart')
  if (!chartDom) return
  
  qualityTrendChart = echarts.init(chartDom)
  
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月']
  
  const option: EChartsOption = {
    title: {
      text: '生产环节合格率趋势',
      left: 'center',
      top: '0',
    },
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['合格率', '优等品率', '改进目标'],
      top: 30,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: months,
    },
    yAxis: {
      type: 'value',
      min: 90,
      max: 100,
      axisLabel: {
        formatter: '{value}%',
      },
    },
    series: [
      {
        name: '合格率',
        type: 'line',
        data: [96.5, 97.2, 97.8, 98.1, 98.3, 98.5, 98.7, 98.9, 98.6, 98.5],
        smooth: true,
        itemStyle: {
          color: '#5470c6',
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(84, 112, 198, 0.3)' },
            { offset: 1, color: 'rgba(84, 112, 198, 0.1)' },
          ]),
        },
      },
      {
        name: '优等品率',
        type: 'line',
        data: [76.2, 77.5, 78.3, 79.1, 79.8, 80.1, 80.5, 80.8, 80.3, 80.1],
        smooth: true,
        itemStyle: {
          color: '#91cc75',
        },
      },
      {
        name: '改进目标',
        type: 'line',
        data: [99, 99, 99, 99, 99, 99, 99, 99, 99, 99],
        lineStyle: {
          type: 'dashed',
          color: '#fac858',
        },
        itemStyle: {
          color: '#fac858',
        },
      },
    ],
  }
  
  qualityTrendChart.setOption(option)
}

// 初始化流通耗时图
const initCirculationTimeChart = () => {
  const chartDom = document.getElementById('circulationTimeChart')
  if (!chartDom) return
  
  circulationTimeChart = echarts.init(chartDom)
  
  const option: EChartsOption = {
    title: {
      text: '各流通环节平均耗时分析',
      left: 'center',
      top: '0',
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    legend: {
      data: ['平均耗时(小时)', '异常次数'],
      top: 30,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: circulationData.value.map(item => item.stage),
    },
    yAxis: [
      {
        type: 'value',
        name: '耗时(小时)',
      },
      {
        type: 'value',
        name: '异常次数',
      },
    ],
    series: [
      {
        name: '平均耗时(小时)',
        type: 'bar',
        data: circulationData.value.map(item => item.avgTime),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 1, color: '#188df0' },
          ]),
        },
      },
      {
        name: '异常次数',
        type: 'line',
        yAxisIndex: 1,
        data: circulationData.value.map(item => item.abnormalCount),
        itemStyle: {
          color: '#ee6666',
        },
      },
    ],
  }
  
  circulationTimeChart.setOption(option)
}

// 初始化质量等级饼图
const initQualityPieChart = () => {
  const chartDom = document.getElementById('qualityPieChart')
  if (!chartDom) return
  
  qualityPieChart = echarts.init(chartDom)
  
  const option: EChartsOption = {
    title: {
      text: '产品质量等级分布',
      left: 'center',
      top: '0',
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 50,
    },
    series: [
      {
        name: '质量等级',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}: {d}%',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        data: qualityLevels.value.map(item => ({
          value: item.count,
          name: item.level,
        })),
      },
    ],
    color: ['#5470c6', '#91cc75', '#fac858', '#ee6666'],
  }
  
  qualityPieChart.setOption(option)
}

// 初始化地域分布图
const initRegionMapChart = () => {
  const chartDom = document.getElementById('regionMapChart')
  if (!chartDom) return
  
  regionMapChart = echarts.init(chartDom)
  
  const option: EChartsOption = {
    title: {
      text: '溯源查询地域分布',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      name: '查询次数',
    },
    yAxis: {
      type: 'category',
      data: queryRegions.value.map(item => item.province),
    },
    series: [
      {
        name: '查询次数',
        type: 'bar',
        data: queryRegions.value.map(item => item.queryCount),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#3fb1e3' },
            { offset: 1, color: '#6be6c1' },
          ]),
        },
        label: {
          show: true,
          position: 'right',
        },
      },
    ],
  }
  
  regionMapChart.setOption(option)
}

// 初始化品牌影响力雷达图
const initBrandRadarChart = () => {
  const chartDom = document.getElementById('brandRadarChart')
  if (!chartDom) return
  
  brandRadarChart = echarts.init(chartDom)
  
  const option: EChartsOption = {
    title: {
      text: '品牌影响力评估',
      left: 'center',
      top: '0',
    },
    tooltip: {
      trigger: 'item',
    },
    legend: {
      data: ['当前指标', '行业平均'],
      top: 30,
    },
    radar: {
      indicator: [
        { name: '溯源覆盖率', max: 100 },
        { name: '消费者信任度', max: 100 },
        { name: '查询活跃度', max: 100 },
        { name: '品牌认知度', max: 100 },
        { name: '质量满意度', max: 100 },
        { name: '复购意愿', max: 100 },
      ],
    },
    series: [
      {
        name: '品牌影响力',
        type: 'radar',
        data: [
          {
            value: [95, 88, 82, 86, 92, 85],
            name: '当前指标',
            itemStyle: {
              color: '#5470c6',
            },
            areaStyle: {
              color: 'rgba(84, 112, 198, 0.3)',
            },
          },
          {
            value: [75, 72, 68, 70, 78, 71],
            name: '行业平均',
            itemStyle: {
              color: '#91cc75',
            },
            areaStyle: {
              color: 'rgba(145, 204, 117, 0.3)',
            },
          },
        ],
      },
    ],
  }
  
  brandRadarChart.setOption(option)
}

// 初始化所有图表
const initAllCharts = async () => {
  await nextTick()
  initProductionChart()
  initQualityTrendChart()
  initCirculationTimeChart()
  initQualityPieChart()
  initRegionMapChart()
  initBrandRadarChart()
}

// 加载所有数据
const loadAllData = async () => {
  loading.value = true
  
  try {
    const [
      metrics,
      production,
      variety,
      circulation,
      quality,
      tests,
      regions,
    ] = await Promise.all([
      mockCoreMetrics(),
      mockProductionData(),
      mockVarietyData(),
      mockCirculationData(),
      mockQualityLevels(),
      mockTestItems(),
      mockQueryRegions(),
    ])
    
    coreMetrics.value = metrics
    productionData.value = production
    varietyData.value = variety as any[]
    circulationData.value = circulation
    qualityLevels.value = quality
    testItems.value = tests
    queryRegions.value = regions
    
    await initAllCharts()
    
    ElMessage.success('数据加载成功')
  } catch (error) {
    ElMessage.error('数据加载失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 切换时间范围
const handleTimeRangeChange = (range: TimeRange) => {
  timeRange.value = range
  loadAllData()
}

// 日期范围变化
const handleDateRangeChange = () => {
  if (dateRange.value && dateRange.value.length === 2) {
    loadAllData()
  }
}

// 导出报告
const handleExport = () => {
  ElMessage.success('报告导出功能开发中...')
}

// 窗口大小改变时重绘图表
const handleResize = () => {
  productionChart?.resize()
  qualityTrendChart?.resize()
  circulationTimeChart?.resize()
  qualityPieChart?.resize()
  regionMapChart?.resize()
  brandRadarChart?.resize()
}

// 组件挂载
onMounted(() => {
  loadAllData()
  window.addEventListener('resize', handleResize)
})

// 组件卸载
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  productionChart?.dispose()
  qualityTrendChart?.dispose()
  circulationTimeChart?.dispose()
  qualityPieChart?.dispose()
  regionMapChart?.dispose()
  brandRadarChart?.dispose()
})
</script>

<template>
  <div v-loading="loading" class="business-statistics">
    <!-- 顶部筛选区 -->
    <el-card class="filter-card" shadow="never">
      <div class="filter-container">
        <div class="time-range-selector">
          <el-button
            :type="timeRange === 'today' ? 'primary' : ''"
            @click="handleTimeRangeChange('today')"
          >
            今日
          </el-button>
          <el-button
            :type="timeRange === 'week' ? 'primary' : ''"
            @click="handleTimeRangeChange('week')"
          >
            本周
          </el-button>
          <el-button
            :type="timeRange === 'month' ? 'primary' : ''"
            @click="handleTimeRangeChange('month')"
          >
            本月
          </el-button>
        </div>
        
        <div class="date-picker-container">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="handleDateRangeChange"
          />
        </div>
        
        <div class="actions">
          <el-button type="primary" @click="loadAllData">刷新数据</el-button>
          <el-button @click="handleExport">导出报告</el-button>
        </div>
      </div>
    </el-card>

    <!-- 核心指标概览 -->
    <div class="metrics-overview">
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12" :md="6">
          <el-card shadow="hover" class="metric-card">
            <el-statistic
              title="溯源产品总数"
              :value="coreMetrics.totalProducts"
              :precision="0"
            >
              <template #suffix>
                <span class="unit">个</span>
              </template>
            </el-statistic>
            <div class="trend-info">
              <el-icon :color="getTrendColor(coreMetrics.productsTrend) === 'success' ? '#67c23a' : getTrendColor(coreMetrics.productsTrend) === 'danger' ? '#f56c6c' : '#909399'">
                <component :is="getTrendIcon(coreMetrics.productsTrend)" />
              </el-icon>
              <span :class="['trend-value', getTrendColor(coreMetrics.productsTrend)]">
                {{ Math.abs(coreMetrics.productsTrend) }}%
              </span>
              <span class="trend-label">环比</span>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :md="6">
          <el-card shadow="hover" class="metric-card">
            <el-statistic
              title="查询次数"
              :value="coreMetrics.todayQueries"
              :precision="0"
            >
              <template #suffix>
                <span class="unit">次</span>
              </template>
            </el-statistic>
            <div class="trend-info">
              <el-icon :color="getTrendColor(coreMetrics.queriesTrend) === 'success' ? '#67c23a' : getTrendColor(coreMetrics.queriesTrend) === 'danger' ? '#f56c6c' : '#909399'">
                <component :is="getTrendIcon(coreMetrics.queriesTrend)" />
              </el-icon>
              <span :class="['trend-value', getTrendColor(coreMetrics.queriesTrend)]">
                {{ Math.abs(coreMetrics.queriesTrend) }}%
              </span>
              <span class="trend-label">环比</span>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :md="6">
          <el-card shadow="hover" class="metric-card">
            <el-statistic
              title="产品合格率"
              :value="coreMetrics.qualifiedRate"
              :precision="1"
            >
              <template #suffix>
                <span class="unit">%</span>
              </template>
            </el-statistic>
            <div class="trend-info">
              <el-icon :color="getTrendColor(coreMetrics.qualifiedTrend) === 'success' ? '#67c23a' : getTrendColor(coreMetrics.qualifiedTrend) === 'danger' ? '#f56c6c' : '#909399'">
                <component :is="getTrendIcon(coreMetrics.qualifiedTrend)" />
              </el-icon>
              <span :class="['trend-value', getTrendColor(coreMetrics.qualifiedTrend)]">
                {{ Math.abs(coreMetrics.qualifiedTrend) }}%
              </span>
              <span class="trend-label">环比</span>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :md="6">
          <el-card shadow="hover" class="metric-card">
            <el-statistic
              title="流通异常率"
              :value="coreMetrics.abnormalRate"
              :precision="1"
            >
              <template #suffix>
                <span class="unit">%</span>
              </template>
            </el-statistic>
            <div class="trend-info">
              <el-icon :color="getTrendColor(-coreMetrics.abnormalTrend) === 'success' ? '#67c23a' : getTrendColor(-coreMetrics.abnormalTrend) === 'danger' ? '#f56c6c' : '#909399'">
                <component :is="getTrendIcon(-coreMetrics.abnormalTrend)" />
              </el-icon>
              <span :class="['trend-value', getTrendColor(-coreMetrics.abnormalTrend)]">
                {{ Math.abs(coreMetrics.abnormalTrend) }}%
              </span>
              <span class="trend-label">环比</span>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 生产环节统计 -->
    <el-row :gutter="16" class="chart-row">
      <el-col :xs="24" :lg="12">
        <el-card shadow="never">
          <div id="productionChart" class="chart-container"></div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :lg="12">
        <el-card shadow="never">
          <div id="qualityTrendChart" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 生产成本效益表格 -->
    <el-row :gutter="16" class="chart-row">
      <el-col :span="24">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>生产成本与效益分析</span>
            </div>
          </template>
          <el-table :data="productionData" stripe>
            <el-table-column prop="name" label="生产基地" min-width="150" />
            <el-table-column prop="area" label="种植面积(亩)" min-width="120" align="center">
              <template #default="{ row }">
                <el-tag type="info">{{ row.area }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="output" label="产量(吨)" min-width="100" align="center">
              <template #default="{ row }">
                <el-tag type="success">{{ row.output }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="cost" label="生产成本(元)" min-width="120" align="center">
              <template #default="{ row }">
                <span class="cost-value">¥{{ row.cost.toLocaleString() }}</span>
              </template>
            </el-table-column>
            <el-table-column label="单位成本(元/吨)" min-width="120" align="center">
              <template #default="{ row }">
                <span class="unit-cost">¥{{ (row.cost / row.output).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="qualifiedRate" label="合格率" min-width="120" align="center">
              <template #default="{ row }">
                <el-progress
                  :percentage="row.qualifiedRate"
                  :color="row.qualifiedRate >= 98 ? '#67c23a' : row.qualifiedRate >= 95 ? '#e6a23c' : '#f56c6c'"
                />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 流通环节统计 -->
    <el-row :gutter="16" class="chart-row">
      <el-col :xs="24" :lg="16">
        <el-card shadow="never">
          <div id="circulationTimeChart" class="chart-container"></div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :lg="8">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>流通环节周转率</span>
            </div>
          </template>
          <div class="turnover-list">
            <div
              v-for="item in circulationData"
              :key="item.stage"
              class="turnover-item"
            >
              <div class="turnover-label">{{ item.stage }}</div>
              <div class="turnover-value">
                <el-progress
                  :percentage="item.turnoverRate"
                  :color="item.turnoverRate >= 90 ? '#67c23a' : item.turnoverRate >= 80 ? '#e6a23c' : '#f56c6c'"
                >
                  <template #default="{ percentage }">
                    <span class="percentage-text">{{ percentage }}%</span>
                  </template>
                </el-progress>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 质量分析统计 -->
    <el-row :gutter="16" class="chart-row">
      <el-col :xs="24" :lg="10">
        <el-card shadow="never">
          <div id="qualityPieChart" class="chart-container"></div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :lg="14">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>检测项目不合格率统计</span>
            </div>
          </template>
          <el-table :data="testItems" stripe>
            <el-table-column prop="name" label="检测项目" min-width="150" />
            <el-table-column prop="totalTests" label="检测总数" min-width="100" align="center" />
            <el-table-column prop="failedTests" label="不合格数" min-width="100" align="center">
              <template #default="{ row }">
                <el-tag type="danger" v-if="row.failedTests > 0">{{ row.failedTests }}</el-tag>
                <el-tag type="success" v-else>0</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="failRate" label="不合格率" min-width="150" align="center">
              <template #default="{ row }">
                <el-progress
                  :percentage="row.failRate"
                  :color="row.failRate <= 0.3 ? '#67c23a' : row.failRate <= 0.6 ? '#e6a23c' : '#f56c6c'"
                  :format="() => `${row.failRate}%`"
                />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 溯源效果分析 -->
    <el-row :gutter="16" class="chart-row">
      <el-col :xs="24" :lg="12">
        <el-card shadow="never">
          <div id="regionMapChart" class="chart-container"></div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :lg="12">
        <el-card shadow="never">
          <div id="brandRadarChart" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 消费者关注度指标 -->
    <el-row :gutter="16" class="chart-row">
      <el-col :span="24">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>消费者关注度指标</span>
            </div>
          </template>
          <el-table :data="queryRegions" stripe>
            <el-table-column type="index" label="排名" width="80" align="center" />
            <el-table-column prop="province" label="省份/地区" min-width="120" />
            <el-table-column prop="queryCount" label="查询次数" min-width="120" align="center" sortable>
              <template #default="{ row }">
                <el-tag type="primary">{{ row.queryCount.toLocaleString() }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="concernIndex" label="关注度指数" min-width="200" align="center" sortable>
              <template #default="{ row }">
                <el-progress
                  :percentage="row.concernIndex"
                  :color="row.concernIndex >= 85 ? '#67c23a' : row.concernIndex >= 70 ? '#e6a23c' : '#f56c6c'"
                />
              </template>
            </el-table-column>
            <el-table-column label="市场活跃度" min-width="120" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.concernIndex >= 85" type="success">高</el-tag>
                <el-tag v-else-if="row.concernIndex >= 70" type="warning">中</el-tag>
                <el-tag v-else type="info">低</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.business-statistics {
}

.filter-card {
  margin-bottom: 20px;
  
  .filter-container {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
    
    .time-range-selector {
      display: flex;
      gap: 8px;
    }
    
    .date-picker-container {
      flex: 1;
      min-width: 300px;
    }
    
    .actions {
      display: flex;
      gap: 8px;
    }
  }
}

.metrics-overview {
  margin-bottom: 20px;
  
  .metric-card {
    margin-bottom: 16px;
    transition: all 0.3s;
    
    &:hover {
      transform: translateY(-4px);
    }
    
    .unit {
      font-size: 14px;
      color: #909399;
      margin-left: 4px;
    }
    
    .trend-info {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 12px;
      font-size: 14px;
      
      .trend-value {
        font-weight: 600;
        
        &.success {
          color: #67c23a;
        }
        
        &.danger {
          color: #f56c6c;
        }
        
        &.info {
          color: #909399;
        }
      }
      
      .trend-label {
        color: #909399;
      }
    }
  }
}

.chart-row {
  margin-bottom: 20px;
}

.chart-container {
  width: 100%;
  height: 400px;
}

.card-header {
  font-weight: 600;
  font-size: 16px;
}

.cost-value {
  color: #e6a23c;
  font-weight: 600;
}

.unit-cost {
  color: #409eff;
  font-weight: 600;
}

.turnover-list {
  padding: 10px 0;
  
  .turnover-item {
    margin-bottom: 20px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .turnover-label {
      margin-bottom: 8px;
      font-size: 14px;
      color: #606266;
    }
    
    .turnover-value {
      .percentage-text {
        font-size: 12px;
        font-weight: 600;
      }
    }
  }
}

// 响应式适配
@media (max-width: 768px) {
  .business-statistics {
    padding: 10px;
  }
  
  .filter-container {
    .date-picker-container {
      width: 100%;
    }
    
    .actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
  
  .chart-container {
    height: 300px;
  }
}
</style>