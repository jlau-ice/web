<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  TrendCharts,
  Download,
  Refresh,
  ArrowUp,
  ArrowDown,
  Minus,
  Search,
  Document,
  Files,
  Clock,
  DataAnalysis,
} from '@element-plus/icons-vue'

// 注意: 如需使用真实的 ECharts 图表，请先安装依赖:
// npm install echarts
// 然后在这里导入: 
import * as echarts from 'echarts'
// 类型定义
interface StatisticCard {
  title: string
  value: number | string
  unit: string
  trend: 'up' | 'down' | 'flat'
  trendValue: number
  icon: any
  color: string
}

interface SearchKeyword {
  keyword: string
  count: number
  percentage: number
  trend: 'up' | 'down' | 'flat'
}

interface SearchTimeDistribution {
  time: string
  count: number
}

interface AssetTypeAnalysis {
  type: string
  count: number
  percentage: number
  color: string
}

interface NoResultKeyword {
  keyword: string
  count: number
  category: string
  lastSearchTime: string
}

// 时间范围选项
const timeRangeOptions = [
  { label: '今日', value: 'today' },
  { label: '近7天', value: '7days' },
  { label: '近30天', value: '30days' },
]

const selectedTimeRange = ref('7days')
const loading = ref(false)
const autoRefresh = ref(false)
const refreshInterval = ref<number | null>(null)

// 核心指标数据
const statistics = ref<StatisticCard[]>([
  {
    title: '总检索量',
    value: 0,
    unit: '次',
    trend: 'up',
    trendValue: 0,
    icon: Search,
    color: '#409EFF',
  },
  {
    title: '检索成功率',
    value: 0,
    unit: '%',
    trend: 'up',
    trendValue: 0,
    icon: TrendCharts,
    color: '#67C23A',
  },
  {
    title: '热门检索词',
    value: 0,
    unit: '个',
    trend: 'flat',
    trendValue: 0,
    icon: Document,
    color: '#E6A23C',
  },
  {
    title: '无结果检索',
    value: 0,
    unit: '次',
    trend: 'down',
    trendValue: 0,
    icon: Files,
    color: '#F56C6C',
  },
])

// 热门搜索词数据
const hotKeywords = ref<SearchKeyword[]>([])

// 检索时段分布数据
const timeDistribution = ref<SearchTimeDistribution[]>([])

// 检索条件使用频率
const conditionUsage = ref([
  { name: '资产类型筛选', usage: 0, percentage: 0 },
  { name: '目录筛选', usage: 0, percentage: 0 },
  { name: '时间范围筛选', usage: 0, percentage: 0 },
  { name: '标签筛选', usage: 0, percentage: 0 },
  { name: '关键词搜索', usage: 0, percentage: 0 },
])

// 资产类型分析数据
const assetTypeAnalysis = ref<AssetTypeAnalysis[]>([])

// 无结果关键词数据
const noResultKeywords = ref<NoResultKeyword[]>([])

// 检索响应时间分布
const responseTimeData = ref([
  { range: '< 100ms', count: 0, percentage: 0 },
  { range: '100-300ms', count: 0, percentage: 0 },
  { range: '300-500ms', count: 0, percentage: 0 },
  { range: '500-1000ms', count: 0, percentage: 0 },
  { range: '> 1000ms', count: 0, percentage: 0 },
])

// 检索深度分析
const searchDepthData = ref([
  { depth: '仅查看第1页', count: 0, percentage: 0 },
  { depth: '查看2-3页', count: 0, percentage: 0 },
  { depth: '查看4-5页', count: 0, percentage: 0 },
  { depth: '查看6页以上', count: 0, percentage: 0 },
])

// 检索满意度数据
const satisfactionData = ref([
  { level: '非常满意', count: 0, percentage: 0, color: '#67C23A' },
  { level: '满意', count: 0, percentage: 0, color: '#95D475' },
  { level: '一般', count: 0, percentage: 0, color: '#E6A23C' },
  { level: '不满意', count: 0, percentage: 0, color: '#F78989' },
  { level: '非常不满意', count: 0, percentage: 0, color: '#F56C6C' },
])

// 冷门资产数据
const coldAssets = ref([
  {
    id: '',
    name: '',
    type: '',
    catalog: '',
    searchCount: 0,
    lastSearchTime: '',
    suggestion: '',
  },
])

// 分析报告配置
const reportConfig = reactive({
  dimensions: ['检索行为', '检索效果', '资产使用'],
  metrics: ['检索量', '成功率', '响应时间'],
  format: 'pdf',
})

const availableDimensions = [
  { label: '检索行为', value: '检索行为' },
  { label: '检索效果', value: '检索效果' },
  { label: '资产使用', value: '资产使用' },
  { label: '用户行为', value: '用户行为' },
  { label: '时间分布', value: '时间分布' },
]

const availableMetrics = [
  { label: '检索量', value: '检索量' },
  { label: '成功率', value: '成功率' },
  { label: '响应时间', value: '响应时间' },
  { label: '满意度', value: '满意度' },
  { label: '点击率', value: '点击率' },
]

// 图表容器引用
const hotKeywordsChartRef = ref<HTMLElement | null>(null)
const timeDistributionChartRef = ref<HTMLElement | null>(null)
const assetTypeChartRef = ref<HTMLElement | null>(null)
const satisfactionChartRef = ref<HTMLElement | null>(null)

// 图表实例引用
let hotKeywordsChart: echarts.ECharts | null = null
let timeDistributionChart: echarts.ECharts | null = null
let assetTypeChart: echarts.ECharts | null = null
let satisfactionChart: echarts.ECharts | null = null

// Mock 数据生成函数
const generateMockData = () => {
  loading.value = true

  setTimeout(() => {
    // 生成核心指标数据
    const totalSearches = Math.floor(Math.random() * 50000) + 30000
    const successRate = Math.floor(Math.random() * 15) + 85
    const hotKeywordCount = Math.floor(Math.random() * 50) + 100
    const noResultCount = Math.floor(Math.random() * 500) + 200

    statistics.value = [
      {
        title: '总检索量',
        value: totalSearches.toLocaleString(),
        unit: '次',
        trend: 'up',
        trendValue: Math.floor(Math.random() * 20) + 5,
        icon: Search,
        color: '#409EFF',
      },
      {
        title: '检索成功率',
        value: successRate,
        unit: '%',
        trend: 'up',
        trendValue: Math.floor(Math.random() * 5) + 1,
        icon: TrendCharts,
        color: '#67C23A',
      },
      {
        title: '热门检索词',
        value: hotKeywordCount,
        unit: '个',
        trend: 'flat',
        trendValue: 0,
        icon: Document,
        color: '#E6A23C',
      },
      {
        title: '无结果检索',
        value: noResultCount,
        unit: '次',
        trend: 'down',
        trendValue: Math.floor(Math.random() * 10) + 2,
        icon: Files,
        color: '#F56C6C',
      },
    ]

    // 生成热门搜索词数据
    const keywords = [
      '用户订单数据',
      '财务报表',
      '产品销售统计',
      '用户行为分析',
      '营销活动数据',
      '客户信息表',
      '库存管理数据',
      '支付流水记录',
      '商品分类信息',
      '用户画像数据',
    ]

    hotKeywords.value = keywords.map((keyword, index) => {
      const count = Math.floor(Math.random() * 3000) + 500 - index * 200
      return {
        keyword,
        count,
        percentage: parseFloat(((count / totalSearches) * 100).toFixed(2)),
        trend: ['up', 'down', 'flat'][Math.floor(Math.random() * 3)] as
          | 'up'
          | 'down'
          | 'flat',
      }
    })

    // 生成时段分布数据
    const hours = Array.from({ length: 24 }, (_, i) => i)
    timeDistribution.value = hours.map((hour) => ({
      time: `${hour}:00`,
      count: Math.floor(Math.random() * 2000) + 500,
    }))

    // 生成检索条件使用频率
    const totalUsage = Math.floor(Math.random() * 10000) + 5000
    conditionUsage.value = [
      { name: '资产类型筛选', usage: Math.floor(totalUsage * 0.85), percentage: 85 },
      { name: '目录筛选', usage: Math.floor(totalUsage * 0.72), percentage: 72 },
      { name: '时间范围筛选', usage: Math.floor(totalUsage * 0.45), percentage: 45 },
      { name: '标签筛选', usage: Math.floor(totalUsage * 0.38), percentage: 38 },
      { name: '关键词搜索', usage: Math.floor(totalUsage * 0.95), percentage: 95 },
    ]

    // 生成资产类型分析数据
    const assetTypes = [
      { type: '数据表', color: '#409EFF' },
      { type: '数据视图', color: '#67C23A' },
      { type: '数据接口', color: '#E6A23C' },
      { type: '数据文件', color: '#F56C6C' },
      { type: '数据模型', color: '#909399' },
    ]

    const assetTotal = Math.floor(Math.random() * 10000) + 5000
    let remaining = assetTotal

    assetTypeAnalysis.value = assetTypes.map((asset, index) => {
      const isLast = index === assetTypes.length - 1
      const count = isLast
        ? remaining
        : Math.floor(Math.random() * (remaining / (assetTypes.length - index)))
      remaining -= count

      return {
        type: asset.type,
        count,
        percentage: parseFloat(((count / assetTotal) * 100).toFixed(2)),
        color: asset.color,
      }
    })

    // 生成无结果关键词数据
    const noResultKeywordList = [
      '历史订单归档',
      '用户敏感信息',
      '临时测试数据',
      '已删除数据表',
      '未公开接口',
      '废弃数据视图',
      '老版本模型',
      '测试环境数据',
    ]

    noResultKeywords.value = noResultKeywordList.map((keyword) => ({
      keyword,
      count: Math.floor(Math.random() * 50) + 10,
      category: ['数据不存在', '权限不足', '已归档'][Math.floor(Math.random() * 3)],
      lastSearchTime: new Date(
        Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
      ).toLocaleString('zh-CN'),
    }))

    // 生成响应时间分布数据
    const totalResponses = Math.floor(Math.random() * 10000) + 5000
    responseTimeData.value = [
      {
        range: '< 100ms',
        count: Math.floor(totalResponses * 0.65),
        percentage: 65,
      },
      {
        range: '100-300ms',
        count: Math.floor(totalResponses * 0.22),
        percentage: 22,
      },
      {
        range: '300-500ms',
        count: Math.floor(totalResponses * 0.08),
        percentage: 8,
      },
      {
        range: '500-1000ms',
        count: Math.floor(totalResponses * 0.03),
        percentage: 3,
      },
      {
        range: '> 1000ms',
        count: Math.floor(totalResponses * 0.02),
        percentage: 2,
      },
    ]

    // 生成检索深度数据
    const totalDepth = Math.floor(Math.random() * 10000) + 5000
    searchDepthData.value = [
      {
        depth: '仅查看第1页',
        count: Math.floor(totalDepth * 0.6),
        percentage: 60,
      },
      {
        depth: '查看2-3页',
        count: Math.floor(totalDepth * 0.25),
        percentage: 25,
      },
      {
        depth: '查看4-5页',
        count: Math.floor(totalDepth * 0.1),
        percentage: 10,
      },
      {
        depth: '查看6页以上',
        count: Math.floor(totalDepth * 0.05),
        percentage: 5,
      },
    ]

    // 生成满意度数据
    const totalSatisfaction = Math.floor(Math.random() * 5000) + 2000
    satisfactionData.value = [
      {
        level: '非常满意',
        count: Math.floor(totalSatisfaction * 0.35),
        percentage: 35,
        color: '#67C23A',
      },
      {
        level: '满意',
        count: Math.floor(totalSatisfaction * 0.4),
        percentage: 40,
        color: '#95D475',
      },
      {
        level: '一般',
        count: Math.floor(totalSatisfaction * 0.15),
        percentage: 15,
        color: '#E6A23C',
      },
      {
        level: '不满意',
        count: Math.floor(totalSatisfaction * 0.07),
        percentage: 7,
        color: '#F78989',
      },
      {
        level: '非常不满意',
        count: Math.floor(totalSatisfaction * 0.03),
        percentage: 3,
        color: '#F56C6C',
      },
    ]

    // 生成冷门资产数据
    coldAssets.value = [
      {
        id: 'asset001',
        name: '旧版用户统计表',
        type: '数据表',
        catalog: '用户数据',
        searchCount: 2,
        lastSearchTime: '2025-08-15',
        suggestion: '建议归档或更新文档说明',
      },
      {
        id: 'asset002',
        name: '临时营销数据视图',
        type: '数据视图',
        catalog: '营销数据',
        searchCount: 1,
        lastSearchTime: '2025-07-20',
        suggestion: '建议删除或重新分类',
      },
      {
        id: 'asset003',
        name: '测试数据接口',
        type: '数据接口',
        catalog: '测试数据',
        searchCount: 3,
        lastSearchTime: '2025-09-01',
        suggestion: '建议移至测试环境',
      },
      {
        id: 'asset004',
        name: '历史财务数据文件',
        type: '数据文件',
        catalog: '财务数据',
        searchCount: 0,
        lastSearchTime: '-',
        suggestion: '建议归档处理',
      },
    ]

    loading.value = false

    // 初始化图表
    nextTick(() => {
      initCharts()
    })
  }, 1000)
}

// 初始化图表
const initCharts = () => {
  initHotKeywordsChart()
  initTimeDistributionChart()
  initAssetTypeChart()
  initSatisfactionChart()
}

// 初始化热门关键词柱状图
const initHotKeywordsChart = () => {
  if (!hotKeywordsChartRef.value) return

  // 如果已存在图表实例，先销毁
  if (hotKeywordsChart) {
    hotKeywordsChart.dispose()
  }

  hotKeywordsChart = echarts.init(hotKeywordsChartRef.value)
  const option = {
    title: {
      text: '热门搜索词 TOP10',
      left: 'center',
      textStyle: {
        fontSize: 14,
        fontWeight: 600,
      },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: (params: any) => {
        const data = params[0]
        return `${data.name}<br/>检索量: ${data.value} 次`
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
      axisLabel: {
        formatter: '{value}',
      },
    },
    yAxis: {
      type: 'category',
      data: hotKeywords.value.map((item) => item.keyword).reverse(),
      axisLabel: {
        interval: 0,
        formatter: (value: string) => {
          return value.length > 8 ? value.substring(0, 8) + '...' : value
        },
      },
    },
    series: [
      {
        name: '检索量',
        type: 'bar',
        data: hotKeywords.value.map((item) => item.count).reverse(),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#409EFF' },
            { offset: 1, color: '#67C23A' },
          ]),
          borderRadius: [0, 4, 4, 0],
        },
        label: {
          show: true,
          position: 'right',
          formatter: '{c}',
        },
      },
    ],
  }
  hotKeywordsChart.setOption(option)
}

// 初始化检索时段分布折线图
const initTimeDistributionChart = () => {
  if (!timeDistributionChartRef.value) return

  // 如果已存在图表实例，先销毁
  if (timeDistributionChart) {
    timeDistributionChart.dispose()
  }

  timeDistributionChart = echarts.init(timeDistributionChartRef.value)
  const option = {
    title: {
      text: '24小时检索量分布',
      left: 'center',
      textStyle: {
        fontSize: 14,
        fontWeight: 600,
      },
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const data = params[0]
        return `${data.name}<br/>检索量: ${data.value} 次`
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: timeDistribution.value.map((item) => item.time),
      boundaryGap: false,
      axisLabel: {
        interval: 2,
      },
    },
    yAxis: {
      type: 'value',
      name: '检索量',
    },
    series: [
      {
        name: '检索量',
        type: 'line',
        data: timeDistribution.value.map((item) => item.count),
        smooth: true,
        itemStyle: {
          color: '#409EFF',
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.5)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.1)' },
          ]),
        },
        lineStyle: {
          width: 2,
        },
        symbol: 'circle',
        symbolSize: 6,
      },
    ],
  }
  timeDistributionChart.setOption(option)
}

// 初始化资产类型饼图
const initAssetTypeChart = () => {
  if (!assetTypeChartRef.value) return

  // 如果已存在图表实例，先销毁
  if (assetTypeChart) {
    assetTypeChart.dispose()
  }

  assetTypeChart = echarts.init(assetTypeChartRef.value)
  const option = {
    title: {
      text: '资产类型检索占比',
      left: 'center',
      textStyle: {
        fontSize: 14,
        fontWeight: 600,
      },
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        return `${params.name}<br/>检索量: ${params.value} 次<br/>占比: ${params.percent}%`
      },
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle',
    },
    series: [
      {
        name: '资产类型',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: true,
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
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
        data: assetTypeAnalysis.value.map((item) => ({
          name: item.type,
          value: item.count,
          itemStyle: {
            color: item.color,
          },
        })),
      },
    ],
  }
  assetTypeChart.setOption(option)
}

// 初始化满意度雷达图
const initSatisfactionChart = () => {
  if (!satisfactionChartRef.value) return

  // 如果已存在图表实例，先销毁
  if (satisfactionChart) {
    satisfactionChart.dispose()
  }

  satisfactionChart = echarts.init(satisfactionChartRef.value)
  const option = {
    title: {
      text: '检索满意度分析',
      left: 'center',
      textStyle: {
        fontSize: 14,
        fontWeight: 600,
      },
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        return `${params.name}<br/>${params.seriesName}: ${params.value} 人`
      },
    },
    radar: {
      indicator: satisfactionData.value.map((item) => ({
        name: item.level,
        max: Math.max(...satisfactionData.value.map((d) => d.count)) * 1.2,
      })),
      radius: '65%',
      splitArea: {
        areaStyle: {
          color: ['rgba(64, 158, 255, 0.1)', 'rgba(103, 194, 58, 0.1)'],
        },
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(0, 0, 0, 0.2)',
        },
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(0, 0, 0, 0.2)',
        },
      },
    },
    series: [
      {
        name: '评价人数',
        type: 'radar',
        data: [
          {
            value: satisfactionData.value.map((item) => item.count),
            name: '满意度分布',
            areaStyle: {
              color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
                { offset: 0, color: 'rgba(64, 158, 255, 0.5)' },
                { offset: 1, color: 'rgba(64, 158, 255, 0.1)' },
              ]),
            },
            lineStyle: {
              color: '#409EFF',
              width: 2,
            },
            itemStyle: {
              color: '#409EFF',
            },
          },
        ],
      },
    ],
  }
  satisfactionChart.setOption(option)
}

// 销毁所有图表实例
const disposeCharts = () => {
  if (hotKeywordsChart) {
    hotKeywordsChart.dispose()
    hotKeywordsChart = null
  }
  if (timeDistributionChart) {
    timeDistributionChart.dispose()
    timeDistributionChart = null
  }
  if (assetTypeChart) {
    assetTypeChart.dispose()
    assetTypeChart = null
  }
  if (satisfactionChart) {
    satisfactionChart.dispose()
    satisfactionChart = null
  }
}

// 窗口大小变化时调整图表大小
const handleResize = () => {
  hotKeywordsChart?.resize()
  timeDistributionChart?.resize()
  assetTypeChart?.resize()
  satisfactionChart?.resize()
}

// 刷新数据
const refreshData = () => {
  ElMessage.success('正在刷新数据...')
  generateMockData()
}

// 导出报告
const exportReport = () => {
  ElMessage.success(`正在导出${reportConfig.format.toUpperCase()}格式的分析报告...`)

  setTimeout(() => {
    ElMessage.success('报告导出成功！')
  }, 2000)
}

// 切换自动刷新
const toggleAutoRefresh = () => {
  if (autoRefresh.value) {
    refreshInterval.value = window.setInterval(() => {
      generateMockData()
    }, 60000) // 每分钟刷新一次
    ElMessage.success('已开启自动刷新，每分钟更新一次数据')
  } else {
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value)
      refreshInterval.value = null
    }
    ElMessage.info('已关闭自动刷新')
  }
}

// 获取趋势图标
const getTrendIcon = (trend: 'up' | 'down' | 'flat') => {
  switch (trend) {
    case 'up':
      return ArrowUp
    case 'down':
      return ArrowDown
    default:
      return Minus
  }
}

// 获取趋势颜色
const getTrendColor = (trend: 'up' | 'down' | 'flat') => {
  switch (trend) {
    case 'up':
      return '#67C23A'
    case 'down':
      return '#F56C6C'
    default:
      return '#409EFF'
  }
}

// 监听时间范围变化
watch(selectedTimeRange, () => {
  generateMockData()
})

// 监听自动刷新开关
watch(autoRefresh, () => {
  toggleAutoRefresh()
})

// 组件挂载时加载数据
onMounted(() => {
  generateMockData()
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
})

// 组件卸载时清理资源
onBeforeUnmount(() => {
  // 清除定时器
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
  // 销毁图表实例
  disposeCharts()
  // 移除事件监听
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="search-analysis-container">
    <!-- 页面标题和操作栏 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">
          <el-icon><DataAnalysis /></el-icon>
          检索结构分析
        </h2>
        <p class="page-description">
          分析资产检索行为和使用情况，为资产优化提供数据支持
        </p>
      </div>
      <div class="header-actions">
        <el-radio-group v-model="selectedTimeRange" size="default">
          <el-radio-button
            v-for="option in timeRangeOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </el-radio-button>
        </el-radio-group>
        <el-button :icon="Refresh" @click="refreshData" :loading="loading">
          刷新
        </el-button>
        <el-switch
          v-model="autoRefresh"
          active-text="自动刷新"
          inactive-text=""
        />
      </div>
    </div>

    <!-- 核心指标卡片 -->
    <el-row :gutter="20" class="statistics-row" v-loading="loading">
      <el-col
        :xs="24"
        :sm="12"
        :md="6"
        v-for="(stat, index) in statistics"
        :key="index"
      >
        <el-card class="statistic-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" :style="{ backgroundColor: stat.color }">
              <el-icon :size="28">
                <component :is="stat.icon" />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">{{ stat.title }}</div>
              <div class="stat-value">
                {{ stat.value }}
                <span class="stat-unit">{{ stat.unit }}</span>
              </div>
              <div class="stat-trend" :style="{ color: getTrendColor(stat.trend) }">
                <el-icon :size="14">
                  <component :is="getTrendIcon(stat.trend)" />
                </el-icon>
                <span v-if="stat.trendValue !== 0">
                  {{ stat.trend === 'down' ? '-' : '+' }}{{ stat.trendValue }}%
                </span>
                <span v-else>持平</span>
                <span class="trend-label">较上期</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 检索行为分析 -->
    <el-row :gutter="20" class="analysis-row">
      <!-- 热门搜索词 TOP10 -->
      <el-col :xs="24" :md="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">热门搜索词 TOP10</span>
              <el-tag type="info" size="small">检索行为</el-tag>
            </div>
          </template>
          <div class="chart-container" ref="hotKeywordsChartRef"></div>
          <div class="hot-keywords-list" style="margin-top: 20px">
            <div
              v-for="(item, index) in hotKeywords"
              :key="index"
              class="keyword-item"
            >
              <div class="keyword-rank" :class="`rank-${index + 1}`">
                {{ index + 1 }}
              </div>
              <div class="keyword-info">
                <div class="keyword-text">{{ item.keyword }}</div>
                <div class="keyword-stats">
                  <span class="keyword-count">{{ item.count }}次</span>
                  <el-tag
                    :type="
                      item.trend === 'up'
                        ? 'success'
                        : item.trend === 'down'
                          ? 'danger'
                          : 'info'
                    "
                    size="small"
                  >
                    {{
                      item.trend === 'up'
                        ? '上升'
                        : item.trend === 'down'
                          ? '下降'
                          : '平稳'
                    }}
                  </el-tag>
                </div>
              </div>
              <el-progress
                :percentage="item.percentage"
                :color="
                  index < 3 ? '#409EFF' : index < 6 ? '#67C23A' : '#E6A23C'
                "
                :show-text="false"
              />
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 检索时段分布 -->
      <el-col :xs="24" :md="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">检索时段分布</span>
              <el-tag type="info" size="small">检索行为</el-tag>
            </div>
          </template>
          <div class="chart-container" ref="timeDistributionChartRef"></div>
          <div class="time-distribution-summary" style="margin-top: 20px">
            <el-alert
              title="高峰时段：9:00-11:00 和 14:00-16:00"
              type="info"
              :closable="false"
              show-icon
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 检索条件使用频率 -->
    <el-row :gutter="20" class="analysis-row">
      <el-col :span="24">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">检索条件使用频率分布</span>
              <el-tag type="info" size="small">检索行为</el-tag>
            </div>
          </template>
          <el-row :gutter="20">
            <el-col
              :xs="24"
              :sm="12"
              :md="8"
              :lg="4"
              v-for="(item, index) in conditionUsage"
              :key="index"
              class="condition-col"
            >
              <div class="condition-item">
                <div class="condition-name">{{ item.name }}</div>
                <el-progress
                  type="circle"
                  :percentage="item.percentage"
                  :width="100"
                  :color="
                    item.percentage >= 80
                      ? '#67C23A'
                      : item.percentage >= 50
                        ? '#409EFF'
                        : '#E6A23C'
                  "
                />
                <div class="condition-usage">使用 {{ item.usage }} 次</div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <!-- 检索效果分析 -->
    <el-row :gutter="20" class="analysis-row">
      <!-- 检索深度分析 -->
      <el-col :xs="24" :md="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">用户检索深度分析</span>
              <el-tag type="success" size="small">检索效果</el-tag>
            </div>
          </template>
          <el-table :data="searchDepthData" stripe style="width: 100%">
            <el-table-column prop="depth" label="检索深度" min-width="150" />
            <el-table-column prop="count" label="用户数" min-width="100">
              <template #default="{ row }">
                <el-tag>{{ row.count }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="percentage" label="占比" min-width="150">
              <template #default="{ row }">
                <el-progress
                  :percentage="row.percentage"
                  :color="
                    row.percentage >= 50
                      ? '#67C23A'
                      : row.percentage >= 20
                        ? '#409EFF'
                        : '#E6A23C'
                  "
                />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 检索响应时间分布 -->
      <el-col :xs="24" :md="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">检索响应时间分布</span>
              <el-tag type="success" size="small">检索效果</el-tag>
            </div>
          </template>
          <el-table :data="responseTimeData" stripe style="width: 100%">
            <el-table-column prop="range" label="响应时间" min-width="120" />
            <el-table-column prop="count" label="请求数" min-width="100">
              <template #default="{ row }">
                <el-tag>{{ row.count }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="percentage" label="占比" min-width="150">
              <template #default="{ row }">
                <el-progress
                  :percentage="row.percentage"
                  :color="
                    row.range === '< 100ms'
                      ? '#67C23A'
                      : row.range === '100-300ms'
                        ? '#409EFF'
                        : '#E6A23C'
                  "
                />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 无结果检索关键词 -->
    <el-row :gutter="20" class="analysis-row">
      <el-col :span="24">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">无结果检索关键词分析</span>
              <el-tag type="success" size="small">检索效果</el-tag>
            </div>
          </template>
          <el-table :data="noResultKeywords" stripe style="width: 100%">
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="keyword" label="关键词" min-width="180" />
            <el-table-column prop="count" label="搜索次数" min-width="100">
              <template #default="{ row }">
                <el-tag type="danger">{{ row.count }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="category" label="分类" min-width="120">
              <template #default="{ row }">
                <el-tag
                  :type="
                    row.category === '数据不存在'
                      ? 'info'
                      : row.category === '权限不足'
                        ? 'warning'
                        : 'success'
                  "
                >
                  {{ row.category }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              prop="lastSearchTime"
              label="最后搜索时间"
              min-width="180"
            />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 资产使用分析 -->
    <el-row :gutter="20" class="analysis-row">
      <!-- 资产类型检索占比 -->
      <el-col :xs="24" :md="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">各类资产检索占比</span>
              <el-tag type="warning" size="small">资产使用</el-tag>
            </div>
          </template>
          <div class="chart-container" ref="assetTypeChartRef"></div>
          <div class="asset-type-legend" style="margin-top: 20px">
            <div
              v-for="item in assetTypeAnalysis"
              :key="item.type"
              class="legend-item"
            >
              <span class="legend-dot" :style="{ backgroundColor: item.color }" />
              <span class="legend-text">{{ item.type }}</span>
              <span class="legend-value">{{ item.percentage }}%</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 检索满意度评估 -->
      <el-col :xs="24" :md="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">检索满意度评估</span>
              <el-tag type="success" size="small">检索效果</el-tag>
            </div>
          </template>
          <div class="chart-container" ref="satisfactionChartRef"></div>
          <div class="satisfaction-container" style="margin-top: 20px">
            <div
              v-for="item in satisfactionData"
              :key="item.level"
              class="satisfaction-item"
            >
              <div class="satisfaction-label">{{ item.level }}</div>
              <div class="satisfaction-bar-container">
                <div
                  class="satisfaction-bar"
                  :style="{
                    width: item.percentage + '%',
                    backgroundColor: item.color,
                  }"
                >
                  <span class="satisfaction-percentage">{{ item.percentage }}%</span>
                </div>
              </div>
              <div class="satisfaction-count">{{ item.count }}人</div>
            </div>
          </div>
          <div class="satisfaction-summary">
            <el-alert
              :title="`整体满意度：${satisfactionData[0].percentage + satisfactionData[1].percentage}%`"
              type="success"
              :closable="false"
              show-icon
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 冷门资产识别 -->
    <el-row :gutter="20" class="analysis-row">
      <el-col :span="24">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">冷门资产识别与优化建议</span>
              <el-tag type="warning" size="small">资产使用</el-tag>
            </div>
          </template>
          <el-table :data="coldAssets" stripe style="width: 100%">
            <el-table-column prop="id" label="资产ID" width="100" />
            <el-table-column prop="name" label="资产名称" min-width="180" />
            <el-table-column prop="type" label="资产类型" width="100">
              <template #default="{ row }">
                <el-tag type="info">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="catalog" label="所属目录" width="120" />
            <el-table-column prop="searchCount" label="检索次数" width="100">
              <template #default="{ row }">
                <el-tag type="warning">{{ row.searchCount }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column
              prop="lastSearchTime"
              label="最后检索时间"
              width="150"
            />
            <el-table-column prop="suggestion" label="优化建议" min-width="200">
              <template #default="{ row }">
                <el-text type="primary">{{ row.suggestion }}</el-text>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 分析报告配置 -->
    <el-row :gutter="20" class="analysis-row">
      <el-col :span="24">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">生成分析报告</span>
              <el-tag type="primary" size="small">报告功能</el-tag>
            </div>
          </template>
          <el-form :model="reportConfig" label-width="120px">
            <el-row :gutter="20">
              <el-col :xs="24" :md="12">
                <el-form-item label="分析维度">
                  <el-select
                    v-model="reportConfig.dimensions"
                    multiple
                    placeholder="请选择分析维度"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="item in availableDimensions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="分析指标">
                  <el-select
                    v-model="reportConfig.metrics"
                    multiple
                    placeholder="请选择分析指标"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="item in availableMetrics"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :xs="24" :md="12">
                <el-form-item label="导出格式">
                  <el-radio-group v-model="reportConfig.format">
                    <el-radio value="pdf">PDF</el-radio>
                    <el-radio value="excel">Excel</el-radio>
                    <el-radio value="word">Word</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="操作">
                  <el-button type="primary" :icon="Download" @click="exportReport">
                    导出报告
                  </el-button>
                  <el-button :icon="Clock">
                    定时报告
                  </el-button>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.search-analysis-container {
  min-height: calc(100vh - 120px);
}

// 页面标题
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  .header-left {
    .page-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 24px;
      font-weight: 600;
      color: #303133;
      margin: 0 0 8px 0;
    }

    .page-description {
      margin: 0;
      color: #909399;
      font-size: 14px;
    }
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

// 统计卡片
.statistics-row {
  margin-bottom: 20px;
}

.statistic-card {
  height: 100%;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  :deep(.el-card__body) {
    padding: 20px;
  }

  .stat-content {
    display: flex;
    align-items: center;
    gap: 16px;

    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;
    }

    .stat-info {
      flex: 1;
      min-width: 0;

      .stat-title {
        font-size: 14px;
        color: #909399;
        margin-bottom: 8px;
      }

      .stat-value {
        font-size: 28px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 6px;

        .stat-unit {
          font-size: 14px;
          font-weight: 400;
          margin-left: 4px;
        }
      }

      .stat-trend {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;

        .trend-label {
          margin-left: 4px;
          color: #909399;
        }
      }
    }
  }
}

// 分析区域
.analysis-row {
  margin-bottom: 20px;
}

.chart-card {
  height: 100%;

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
}

// 热门关键词列表
.hot-keywords-list {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .keyword-item {
    display: flex;
    align-items: center;
    gap: 12px;

    .keyword-rank {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
      background-color: #f5f7fa;
      color: #606266;
      flex-shrink: 0;

      &.rank-1,
      &.rank-2,
      &.rank-3 {
        background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
        color: #fff;
      }
    }

    .keyword-info {
      flex: 1;
      min-width: 0;

      .keyword-text {
        font-size: 14px;
        color: #303133;
        margin-bottom: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .keyword-stats {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;

        .keyword-count {
          color: #909399;
        }
      }
    }

    :deep(.el-progress) {
      flex: 1;
      max-width: 200px;
    }
  }
}

// 图表容器
.chart-container {
  width: 100%;
  height: 350px;
  min-height: 300px;
}

// 检索条件使用频率
.condition-col {
  margin-bottom: 20px;
}

.condition-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background-color: #fafafa;
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    background-color: #f0f2f5;
    transform: translateY(-2px);
  }

  .condition-name {
    font-size: 14px;
    color: #606266;
    margin-bottom: 16px;
    text-align: center;
  }

  .condition-usage {
    margin-top: 12px;
    font-size: 12px;
    color: #909399;
  }
}

// 资产类型图例
.asset-type-legend {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;

  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background-color: #fafafa;
    border-radius: 6px;

    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .legend-text {
      flex: 1;
      font-size: 14px;
      color: #606266;
    }

    .legend-value {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
    }
  }
}

// 满意度评估
.satisfaction-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;

  .satisfaction-item {
    display: flex;
    align-items: center;
    gap: 12px;

    .satisfaction-label {
      width: 100px;
      font-size: 14px;
      color: #606266;
      flex-shrink: 0;
    }

    .satisfaction-bar-container {
      flex: 1;
      height: 32px;
      background-color: #f5f7fa;
      border-radius: 6px;
      overflow: hidden;
      position: relative;

      .satisfaction-bar {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        padding-right: 12px;
        transition: width 0.6s ease;

        .satisfaction-percentage {
          color: white;
          font-size: 13px;
          font-weight: 600;
        }
      }
    }

    .satisfaction-count {
      width: 70px;
      text-align: right;
      font-size: 14px;
      color: #909399;
      flex-shrink: 0;
    }
  }
}

.satisfaction-summary {
  margin-top: 16px;
}

// 响应式设计
@media (max-width: 768px) {
  .search-analysis-container {
    padding: 12px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;

    .header-actions {
      width: 100%;
      flex-wrap: wrap;

      :deep(.el-radio-group) {
        width: 100%;
      }
    }
  }

  .stat-content {
    .stat-icon {
      width: 48px !important;
      height: 48px !important;

      .el-icon {
        font-size: 20px !important;
      }
    }

    .stat-info {
      .stat-value {
        font-size: 22px !important;
      }
    }
  }

  .chart-container {
    height: 250px !important;
  }
}
</style>
