<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

// 定义类型
interface Indicator {
  id: string
  name: string
  code: string
  category: string
  description: string
  latestValue: number
  trend: 'up' | 'down' | 'stable'
  unit: string
}

interface IndicatorRelation {
  source: string
  target: string
  impactType: 'positive' | 'negative'
  impactStrength: 'weak' | 'medium' | 'strong'
  description: string
}

interface PathNode {
  id: string
  name: string
}

interface AnalysisPath {
  nodes: PathNode[]
  description: string
}

// 状态管理
const loading = ref(false)
const searchKeyword = ref('')
const showMode = ref<'direct' | 'indirect'>('direct')
const selectedIndicators = ref<string[]>([])
const drawerVisible = ref(false)
const pathDialogVisible = ref(false)
const currentIndicator = ref<Indicator | null>(null)
const analysisPath = ref<AnalysisPath | null>(null)

// 图表相关
const chartContainer = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

// Mock 数据
const mockIndicators: Indicator[] = [
  {
    id: 'IND001',
    name: '营业收入',
    code: 'REVENUE',
    category: '财务指标',
    description: '企业在一定时期内通过销售商品或提供服务所获得的收入总额',
    latestValue: 1250000,
    trend: 'up',
    unit: '万元'
  },
  {
    id: 'IND002',
    name: '销售成本',
    code: 'COST',
    category: '财务指标',
    description: '企业销售商品或提供服务直接相关的成本',
    latestValue: 750000,
    trend: 'up',
    unit: '万元'
  },
  {
    id: 'IND003',
    name: '毛利率',
    code: 'GROSS_MARGIN',
    category: '财务指标',
    description: '毛利与营业收入的百分比，反映产品盈利能力',
    latestValue: 40,
    trend: 'stable',
    unit: '%'
  },
  {
    id: 'IND004',
    name: '客户满意度',
    code: 'CSAT',
    category: '客户指标',
    description: '客户对产品和服务的满意程度评分',
    latestValue: 85,
    trend: 'up',
    unit: '分'
  },
  {
    id: 'IND005',
    name: '产品质量指数',
    code: 'QUALITY',
    category: '运营指标',
    description: '产品质量的综合评价指数',
    latestValue: 92,
    trend: 'up',
    unit: '分'
  },
  {
    id: 'IND006',
    name: '市场占有率',
    code: 'MARKET_SHARE',
    category: '市场指标',
    description: '企业产品在市场中的份额',
    latestValue: 15.5,
    trend: 'up',
    unit: '%'
  },
  {
    id: 'IND007',
    name: '研发投入',
    code: 'RD_INVEST',
    category: '投资指标',
    description: '研发活动的资金投入',
    latestValue: 125000,
    trend: 'up',
    unit: '万元'
  },
  {
    id: 'IND008',
    name: '员工满意度',
    code: 'EMPLOYEE_SAT',
    category: '人力资源指标',
    description: '员工对工作环境和待遇的满意程度',
    latestValue: 78,
    trend: 'stable',
    unit: '分'
  },
  {
    id: 'IND009',
    name: '净利润率',
    code: 'NET_MARGIN',
    category: '财务指标',
    description: '净利润与营业收入的比率',
    latestValue: 12.5,
    trend: 'up',
    unit: '%'
  },
  {
    id: 'IND010',
    name: '客户流失率',
    code: 'CHURN_RATE',
    category: '客户指标',
    description: '一定时期内流失客户占总客户的比例',
    latestValue: 5.2,
    trend: 'down',
    unit: '%'
  }
]

const mockRelations: IndicatorRelation[] = [
  { source: 'IND001', target: 'IND003', impactType: 'positive', impactStrength: 'strong', description: '收入增长直接提升毛利率' },
  { source: 'IND002', target: 'IND003', impactType: 'negative', impactStrength: 'strong', description: '成本增加降低毛利率' },
  { source: 'IND003', target: 'IND009', impactType: 'positive', impactStrength: 'strong', description: '毛利率提升带动净利润率' },
  { source: 'IND004', target: 'IND001', impactType: 'positive', impactStrength: 'medium', description: '客户满意度提高促进销售' },
  { source: 'IND005', target: 'IND004', impactType: 'positive', impactStrength: 'strong', description: '产品质量提升客户满意度' },
  { source: 'IND006', target: 'IND001', impactType: 'positive', impactStrength: 'strong', description: '市场份额增加带动收入增长' },
  { source: 'IND007', target: 'IND005', impactType: 'positive', impactStrength: 'medium', description: '研发投入提升产品质量' },
  { source: 'IND008', target: 'IND005', impactType: 'positive', impactStrength: 'weak', description: '员工满意度影响产品质量' },
  { source: 'IND004', target: 'IND006', impactType: 'positive', impactStrength: 'medium', description: '客户满意度提升市场份额' },
  { source: 'IND010', target: 'IND001', impactType: 'negative', impactStrength: 'medium', description: '客户流失减少收入' },
  { source: 'IND005', target: 'IND010', impactType: 'negative', impactStrength: 'weak', description: '质量提升降低流失率' },
  { source: 'IND001', target: 'IND009', impactType: 'positive', impactStrength: 'medium', description: '收入增长促进利润率' }
]

// 获取指标详情（包含上下游）
const getIndicatorDetail = (id: string) => {
  const indicator = mockIndicators.find(i => i.id === id)
  if (!indicator) return null

  const upstream = mockRelations
    .filter(r => r.target === id)
    .map(r => ({
      ...mockIndicators.find(i => i.id === r.source)!,
      relation: r
    }))

  const downstream = mockRelations
    .filter(r => r.source === id)
    .map(r => ({
      ...mockIndicators.find(i => i.id === r.target)!,
      relation: r
    }))

  return {
    indicator,
    upstream,
    downstream
  }
}

// 初始化图表
const initChart = () => {
  if (!chartContainer.value) return

  chartInstance = echarts.init(chartContainer.value)

  const nodes = mockIndicators.map(ind => ({
    id: ind.id,
    name: ind.name,
    category: ind.category,
    value: ind.latestValue,
    symbolSize: 50,
    label: {
      show: true
    },
    itemStyle: {
      borderColor: getTrendColor(ind.trend),
      borderWidth: 3
    }
  }))

  const links = mockRelations.map(rel => ({
    source: rel.source,
    target: rel.target,
    lineStyle: {
      color: rel.impactType === 'positive' ? '#67C23A' : '#F56C6C',
      width: getStrengthWidth(rel.impactStrength),
      type: (rel.impactType === 'positive' ? 'solid' : 'dashed') as 'solid' | 'dashed'
    },
    label: {
      show: false
    }
  }))

  const categories = Array.from(new Set(mockIndicators.map(i => i.category))).map(name => ({ name }))

  const option: EChartsOption = {
    title: {
      text: '指标影响关系网络',
      left: 'center',
      top: 10
    },
    tooltip: {
      formatter: (params: any) => {
        if (params.dataType === 'node') {
          const indicator = mockIndicators.find(i => i.id === params.data.id)
          if (indicator) {
            return `
              <div style="padding: 5px;">
                <strong>${indicator.name}</strong><br/>
                编码: ${indicator.code}<br/>
                分类: ${indicator.category}<br/>
                最新值: ${indicator.latestValue} ${indicator.unit}<br/>
                趋势: ${getTrendText(indicator.trend)}
              </div>
            `
          }
        } else if (params.dataType === 'edge') {
          const relation = mockRelations.find(
            r => r.source === params.data.source && r.target === params.data.target
          )
          if (relation) {
            return `
              <div style="padding: 5px;">
                <strong>影响关系</strong><br/>
                类型: ${relation.impactType === 'positive' ? '正向' : '负向'}<br/>
                强度: ${getStrengthText(relation.impactStrength)}<br/>
                说明: ${relation.description}
              </div>
            `
          }
        }
        return ''
      }
    },
    legend: [
      {
        data: categories.map(c => c.name),
        top: 40,
        left: 'left',
        orient: 'vertical'
      },
      {
        data: [
          { name: '正向影响', icon: 'path://M5,20 L5,80 L95,50 Z', itemStyle: { color: '#67C23A' } },
          { name: '负向影响', icon: 'path://M5,20 L5,80 L95,50 Z', itemStyle: { color: '#F56C6C' } }
        ],
        top: 200,
        left: 'left',
        orient: 'vertical'
      }
    ],
    series: [
      {
        type: 'graph',
        layout: 'force',
        data: nodes,
        links: links,
        categories: categories,
        roam: true,
        label: {
          position: 'bottom',
          fontSize: 12
        },
        force: {
          repulsion: 500,
          edgeLength: 150,
          gravity: 0.1
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: {
            width: 5
          }
        }
      }
    ]
  }

  chartInstance.setOption(option)

  // 点击节点事件
  chartInstance.on('click', (params: any) => {
    if (params.dataType === 'node') {
      handleNodeClick(params.data.id)
    }
  })

  // 响应式
  window.addEventListener('resize', () => {
    chartInstance?.resize()
  })
}

// 辅助函数
const getTrendColor = (trend: string) => {
  switch (trend) {
    case 'up': return '#67C23A'
    case 'down': return '#F56C6C'
    default: return '#909399'
  }
}

const getTrendText = (trend: string) => {
  switch (trend) {
    case 'up': return '↑ 上升'
    case 'down': return '↓ 下降'
    default: return '→ 平稳'
  }
}

const getStrengthWidth = (strength: string) => {
  switch (strength) {
    case 'strong': return 4
    case 'medium': return 2.5
    default: return 1.5
  }
}

const getStrengthText = (strength: string) => {
  switch (strength) {
    case 'strong': return '强'
    case 'medium': return '中'
    default: return '弱'
  }
}

// 搜索指标
const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }

  loading.value = true
  setTimeout(() => {
    const found = mockIndicators.find(
      i => i.name.includes(searchKeyword.value) || i.code.includes(searchKeyword.value.toUpperCase())
    )

    if (found) {
      highlightIndicator(found.id)
      ElMessage.success(`找到指标: ${found.name}`)
    } else {
      ElMessage.warning('未找到匹配的指标')
    }
    loading.value = false
  }, 500)
}

// 高亮指标
const highlightIndicator = (id: string) => {
  if (!chartInstance) return

  const option = chartInstance.getOption() as any
  const series = option.series[0]

  // 重置所有节点
  series.data.forEach((node: any) => {
    node.symbolSize = 50
    node.itemStyle = {
      ...node.itemStyle,
      shadowBlur: 0
    }
  })

  // 高亮目标节点
  const targetNode = series.data.find((node: any) => node.id === id)
  if (targetNode) {
    targetNode.symbolSize = 70
    targetNode.itemStyle = {
      ...targetNode.itemStyle,
      shadowBlur: 20,
      shadowColor: '#409EFF'
    }
  }

  // 根据模式高亮相关节点和连线
  const relatedIds = new Set<string>()
  relatedIds.add(id)

  if (showMode.value === 'direct') {
    // 直接影响
    mockRelations.forEach(rel => {
      if (rel.source === id) relatedIds.add(rel.target)
      if (rel.target === id) relatedIds.add(rel.source)
    })
  } else {
    // 间接影响（简化处理，只展示两层）
    const firstLevel = new Set<string>()
    mockRelations.forEach(rel => {
      if (rel.source === id) firstLevel.add(rel.target)
      if (rel.target === id) firstLevel.add(rel.source)
    })
    firstLevel.forEach(fid => relatedIds.add(fid))
    
    firstLevel.forEach(fid => {
      mockRelations.forEach(rel => {
        if (rel.source === fid) relatedIds.add(rel.target)
        if (rel.target === fid) relatedIds.add(rel.source)
      })
    })
  }

  // 高亮相关节点
  series.data.forEach((node: any) => {
    if (relatedIds.has(node.id) && node.id !== id) {
      node.symbolSize = 60
      node.itemStyle = {
        ...node.itemStyle,
        shadowBlur: 10,
        shadowColor: '#E6A23C'
      }
    }
  })

  // 高亮相关连线
  series.links.forEach((link: any) => {
    if (relatedIds.has(link.source) && relatedIds.has(link.target)) {
      link.lineStyle = {
        ...link.lineStyle,
        width: link.lineStyle.width * 1.5,
        opacity: 1
      }
    } else {
      link.lineStyle = {
        ...link.lineStyle,
        opacity: 0.2
      }
    }
  })

  chartInstance.setOption(option)
}

// 节点点击
const handleNodeClick = (id: string) => {
  const detail = getIndicatorDetail(id)
  if (detail) {
    currentIndicator.value = detail.indicator
    drawerVisible.value = true
  }

  // 用于路径分析
  if (selectedIndicators.value.includes(id)) {
    selectedIndicators.value = selectedIndicators.value.filter(i => i !== id)
  } else {
    if (selectedIndicators.value.length >= 2) {
      selectedIndicators.value = [selectedIndicators.value[1], id]
    } else {
      selectedIndicators.value.push(id)
    }
  }

  if (selectedIndicators.value.length === 2) {
    ElMessage.info('已选择两个指标，可进行路径分析')
  }
}

// 路径分析
const analyzePathClick = () => {
  if (selectedIndicators.value.length !== 2) {
    ElMessage.warning('请在图中点击选择两个指标节点')
    return
  }

  loading.value = true
  setTimeout(() => {
    const [start, end] = selectedIndicators.value
    const path = findPath(start, end)
    
    if (path.length > 0) {
      analysisPath.value = {
        nodes: path.map(id => ({
          id,
          name: mockIndicators.find(i => i.id === id)?.name || id
        })),
        description: `从 ${path[0]} 到 ${path[path.length - 1]} 的影响路径共包含 ${path.length} 个指标节点`
      }
      pathDialogVisible.value = true
      highlightPath(path)
    } else {
      ElMessage.warning('未找到影响路径')
    }
    loading.value = false
  }, 800)
}

// 简单路径查找（BFS）
const findPath = (start: string, end: string): string[] => {
  const queue: string[][] = [[start]]
  const visited = new Set<string>()

  while (queue.length > 0) {
    const path = queue.shift()!
    const node = path[path.length - 1]

    if (node === end) return path
    if (visited.has(node)) continue
    visited.add(node)

    const neighbors = mockRelations
      .filter(r => r.source === node)
      .map(r => r.target)

    neighbors.forEach(neighbor => {
      if (!visited.has(neighbor)) {
        queue.push([...path, neighbor])
      }
    })
  }

  return []
}

// 高亮路径
const highlightPath = (path: string[]) => {
  if (!chartInstance) return

  const option = chartInstance.getOption() as any
  const series = option.series[0]

  // 重置
  series.data.forEach((node: any) => {
    node.symbolSize = 50
    node.itemStyle = { ...node.itemStyle, shadowBlur: 0 }
  })

  series.links.forEach((link: any) => {
    link.lineStyle = { ...link.lineStyle, opacity: 0.2, width: getStrengthWidth('weak') }
  })

  // 高亮路径节点
  path.forEach((id, index) => {
    const node = series.data.find((n: any) => n.id === id)
    if (node) {
      node.symbolSize = 70
      node.itemStyle = {
        ...node.itemStyle,
        shadowBlur: 20,
        shadowColor: index === 0 ? '#409EFF' : index === path.length - 1 ? '#F56C6C' : '#E6A23C'
      }
    }
  })

  // 高亮路径连线
  for (let i = 0; i < path.length - 1; i++) {
    const link = series.links.find((l: any) => l.source === path[i] && l.target === path[i + 1])
    if (link) {
      link.lineStyle = {
        ...link.lineStyle,
        opacity: 1,
        width: 5,
        shadowBlur: 10,
        shadowColor: '#409EFF'
      }
    }
  }

  chartInstance.setOption(option)
}

// 重置视图
const resetView = () => {
  searchKeyword.value = ''
  selectedIndicators.value = []
  if (chartInstance) {
    chartInstance.clear()
    initChart()
  }
  ElMessage.success('视图已重置')
}

// 导出图片
const exportImage = () => {
  if (!chartInstance) return

  loading.value = true
  setTimeout(() => {
    const url = chartInstance!.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#fff'
    })
    
    const link = document.createElement('a')
    link.download = `indicator-impact-${Date.now()}.png`
    link.href = url
    link.click()
    
    ElMessage.success('图片导出成功')
    loading.value = false
  }, 500)
}

// 生成报告
const generateReport = () => {
  ElMessageBox.confirm(
    '将生成指标影响关系分析报告，包含影响链路与强度统计，是否继续？',
    '生成报告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    loading.value = true
    setTimeout(() => {
      // Mock 报告生成
      const reportContent = {
        title: '指标影响关系分析报告',
        date: new Date().toLocaleString(),
        totalIndicators: mockIndicators.length,
        totalRelations: mockRelations.length,
        positiveImpacts: mockRelations.filter(r => r.impactType === 'positive').length,
        negativeImpacts: mockRelations.filter(r => r.impactType === 'negative').length,
        strongImpacts: mockRelations.filter(r => r.impactStrength === 'strong').length,
        mediumImpacts: mockRelations.filter(r => r.impactStrength === 'medium').length,
        weakImpacts: mockRelations.filter(r => r.impactStrength === 'weak').length
      }

      console.log('生成的报告内容:', reportContent)
      
      ElMessage.success('报告已生成，请查看控制台')
      loading.value = false
    }, 1000)
  }).catch(() => {
    ElMessage.info('已取消')
  })
}

// 切换显示模式
const handleModeChange = () => {
  if (searchKeyword.value) {
    handleSearch()
  }
}

// 查看指标详情
const viewIndicatorDetail = (id: string) => {
  const detail = getIndicatorDetail(id)
  if (detail) {
    currentIndicator.value = detail.indicator
    drawerVisible.value = true
    highlightIndicator(id)
  }
}

// 生命周期
onMounted(() => {
  nextTick(() => {
    initChart()
  })
})
</script>

<template>
  <div class="indicator-impact-container">
    <!-- 工具栏 -->
    <el-card class="toolbar-card" shadow="never">
      <el-row :gutter="16" align="middle">
        <el-col :span="8">
          <el-input
            v-model="searchKeyword"
            placeholder="输入指标名称或编码搜索"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
            <template #append>
              <el-button :loading="loading" @click="handleSearch">搜索</el-button>
            </template>
          </el-input>
        </el-col>
        
        <el-col :span="6">
          <el-radio-group v-model="showMode" @change="handleModeChange">
            <el-radio-button label="direct">直接影响</el-radio-button>
            <el-radio-button label="indirect">间接影响</el-radio-button>
          </el-radio-group>
        </el-col>

        <el-col :span="10" style="text-align: right;">
          <el-button @click="analyzePathClick" :loading="loading">
            <el-icon><Connection /></el-icon>
            路径分析
            <el-tag v-if="selectedIndicators.length > 0" size="small" type="info" style="margin-left: 8px;">
              已选 {{ selectedIndicators.length }}
            </el-tag>
          </el-button>
          <el-button @click="resetView">
            <el-icon><Refresh /></el-icon>
            重置视图
          </el-button>
          <el-button @click="exportImage" :loading="loading">
            <el-icon><Download /></el-icon>
            导出图片
          </el-button>
          <el-button type="primary" @click="generateReport" :loading="loading">
            <el-icon><Document /></el-icon>
            生成报告
          </el-button>
        </el-col>
      </el-row>

      <el-row style="margin-top: 12px;">
        <el-col :span="24">
          <div class="legend-info">
            <span class="legend-item">
              <span class="legend-dot positive"></span>
              正向影响
            </span>
            <span class="legend-item">
              <span class="legend-dot negative"></span>
              负向影响
            </span>
            <span class="legend-item">
              <span class="legend-line strong"></span>
              强影响
            </span>
            <span class="legend-item">
              <span class="legend-line medium"></span>
              中影响
            </span>
            <span class="legend-item">
              <span class="legend-line weak"></span>
              弱影响
            </span>
            <el-divider direction="vertical" />
            <span class="legend-item">
              <span class="legend-dot trend-up"></span>
              趋势上升
            </span>
            <span class="legend-item">
              <span class="legend-dot trend-down"></span>
              趋势下降
            </span>
            <span class="legend-item">
              <span class="legend-dot trend-stable"></span>
              趋势平稳
            </span>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 图表容器 -->
    <el-card class="chart-card" shadow="never">
      <div ref="chartContainer" class="chart-container"></div>
    </el-card>

    <!-- 详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      title="指标详情"
      direction="rtl"
      size="500px"
    >
      <div v-if="currentIndicator" class="indicator-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="指标名称">
            {{ currentIndicator.name }}
          </el-descriptions-item>
          <el-descriptions-item label="指标编码">
            <el-tag>{{ currentIndicator.code }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="指标分类">
            <el-tag type="success">{{ currentIndicator.category }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="最新数据">
            <span class="value-text">
              {{ currentIndicator.latestValue }} {{ currentIndicator.unit }}
            </span>
            <el-tag
              :type="currentIndicator.trend === 'up' ? 'success' : currentIndicator.trend === 'down' ? 'danger' : 'info'"
              size="small"
              style="margin-left: 8px;"
            >
              {{ getTrendText(currentIndicator.trend) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="指标描述">
            {{ currentIndicator.description }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">上游指标（影响来源）</el-divider>
        <div v-if="getIndicatorDetail(currentIndicator.id)?.upstream.length" class="related-indicators">
          <div
            v-for="item in getIndicatorDetail(currentIndicator.id)?.upstream"
            :key="item.id"
            class="related-item"
          >
            <div class="related-header">
              <span class="related-name" @click="viewIndicatorDetail(item.id)">
                {{ item.name }}
              </span>
              <el-tag
                :type="item.relation.impactType === 'positive' ? 'success' : 'danger'"
                size="small"
              >
                {{ item.relation.impactType === 'positive' ? '正向' : '负向' }}
              </el-tag>
              <el-tag size="small" style="margin-left: 4px;">
                {{ getStrengthText(item.relation.impactStrength) }}
              </el-tag>
            </div>
            <div class="related-desc">{{ item.relation.description }}</div>
          </div>
        </div>
        <el-empty v-else description="无上游指标" :image-size="60" />

        <el-divider content-position="left">下游指标（影响对象）</el-divider>
        <div v-if="getIndicatorDetail(currentIndicator.id)?.downstream.length" class="related-indicators">
          <div
            v-for="item in getIndicatorDetail(currentIndicator.id)?.downstream"
            :key="item.id"
            class="related-item"
          >
            <div class="related-header">
              <span class="related-name" @click="viewIndicatorDetail(item.id)">
                {{ item.name }}
              </span>
              <el-tag
                :type="item.relation.impactType === 'positive' ? 'success' : 'danger'"
                size="small"
              >
                {{ item.relation.impactType === 'positive' ? '正向' : '负向' }}
              </el-tag>
              <el-tag size="small" style="margin-left: 4px;">
                {{ getStrengthText(item.relation.impactStrength) }}
              </el-tag>
            </div>
            <div class="related-desc">{{ item.relation.description }}</div>
          </div>
        </div>
        <el-empty v-else description="无下游指标" :image-size="60" />
      </div>
    </el-drawer>

    <!-- 路径分析对话框 -->
    <el-dialog
      v-model="pathDialogVisible"
      title="影响路径分析"
      width="600px"
    >
      <div v-if="analysisPath" class="path-analysis">
        <el-alert
          :title="analysisPath.description"
          type="info"
          :closable="false"
          style="margin-bottom: 20px;"
        />
        
        <div class="path-flow">
          <div
            v-for="(node, index) in analysisPath.nodes"
            :key="node.id"
            class="path-node-wrapper"
          >
            <div
              class="path-node"
              :class="{
                'path-start': index === 0,
                'path-end': index === analysisPath.nodes.length - 1
              }"
            >
              <div class="node-index">{{ index + 1 }}</div>
              <div class="node-content">
                <div class="node-name">{{ node.name }}</div>
                <div class="node-id">{{ node.id }}</div>
              </div>
            </div>
            <div v-if="index < analysisPath.nodes.length - 1" class="path-arrow">
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
        </div>

        <el-divider />

        <div class="path-summary">
          <h4>路径说明</h4>
          <p>该路径展示了从起始指标到目标指标的影响传导链路，每个节点代表一个关键指标，箭头表示影响方向。</p>
          <ul>
            <li>路径长度: {{ analysisPath.nodes.length }} 个节点</li>
            <li>影响层级: {{ analysisPath.nodes.length - 1 }} 层传导</li>
            <li>建议: 优化路径中的关键节点可以提升整体影响效果</li>
          </ul>
        </div>
      </div>

      <template #footer>
        <el-button @click="pathDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="pathDialogVisible = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.indicator-impact-container {
  padding: 20px;
  height: calc(100vh - 140px);
  display: flex;
  flex-direction: column;
  gap: 16px;

  .toolbar-card {
    flex-shrink: 0;

    .legend-info {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      font-size: 13px;
      color: #606266;

      .legend-item {
        display: flex;
        align-items: center;
        gap: 6px;

        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid;

          &.positive {
            border-color: #67C23A;
            background-color: rgba(103, 194, 58, 0.1);
          }

          &.negative {
            border-color: #F56C6C;
            background-color: rgba(245, 108, 108, 0.1);
          }

          &.trend-up {
            border-color: #67C23A;
          }

          &.trend-down {
            border-color: #F56C6C;
          }

          &.trend-stable {
            border-color: #909399;
          }
        }

        .legend-line {
          width: 30px;
          height: 0;
          border-top-style: solid;

          &.strong {
            border-top-width: 4px;
            border-top-color: #409EFF;
          }

          &.medium {
            border-top-width: 2.5px;
            border-top-color: #409EFF;
          }

          &.weak {
            border-top-width: 1.5px;
            border-top-color: #409EFF;
          }
        }
      }
    }
  }

  .chart-card {
    flex: 1;
    overflow: hidden;

    :deep(.el-card__body) {
      height: 100%;
      padding: 0;
    }

    .chart-container {
      width: 100%;
      height: 100%;
      min-height: 600px;
    }
  }

  .indicator-detail {
    .value-text {
      font-size: 16px;
      font-weight: bold;
      color: #409EFF;
    }

    .related-indicators {
      .related-item {
        padding: 12px;
        margin-bottom: 12px;
        background-color: #f5f7fa;
        border-radius: 4px;
        border-left: 3px solid #409EFF;

        .related-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;

          .related-name {
            font-weight: bold;
            color: #409EFF;
            cursor: pointer;
            flex: 1;

            &:hover {
              text-decoration: underline;
            }
          }
        }

        .related-desc {
          font-size: 13px;
          color: #606266;
          line-height: 1.6;
        }
      }
    }
  }

  .path-analysis {
    .path-flow {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .path-node-wrapper {
        display: flex;
        align-items: center;
        gap: 12px;

        .path-node {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 8px;
          color: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

          &.path-start {
            background: linear-gradient(135deg, #409EFF 0%, #2d7dda 100%);
          }

          &.path-end {
            background: linear-gradient(135deg, #F56C6C 0%, #e84545 100%);
          }

          .node-index {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            font-weight: bold;
            font-size: 16px;
          }

          .node-content {
            flex: 1;

            .node-name {
              font-size: 15px;
              font-weight: bold;
              margin-bottom: 4px;
            }

            .node-id {
              font-size: 12px;
              opacity: 0.9;
            }
          }
        }

        .path-arrow {
          font-size: 24px;
          color: #909399;
          transform: translateX(-6px);
        }
      }
    }

    .path-summary {
      h4 {
        margin-bottom: 12px;
        color: #303133;
      }

      p {
        line-height: 1.8;
        color: #606266;
        margin-bottom: 12px;
      }

      ul {
        list-style: none;
        padding: 0;

        li {
          padding: 6px 0;
          color: #606266;
          position: relative;
          padding-left: 20px;

          &::before {
            content: '•';
            position: absolute;
            left: 0;
            color: #409EFF;
            font-weight: bold;
          }
        }
      }
    }
  }
}
</style>