<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Filter,
  Download,
  Star,
  StarFilled,
  RefreshRight,
  Share,
  Plus,
  Delete,
  Edit,
  Setting,
  DataAnalysis,
  Location,
  Calendar,
  Grid,
  ArrowRight,
  Back,
  TrendCharts,
  PieChart,
  DataLine,
  Histogram
} from '@element-plus/icons-vue'

// 查询模式类型
type QueryMode = 'natural' | 'advanced'

// 查询状态类型
type QueryStatus = 'idle' | 'running' | 'completed' | 'timeout' | 'error'

// 图表类型
type ChartType = 'bar' | 'line' | 'pie' | 'table'

// 维度类型
interface Dimension {
  id: string
  name: string
  icon: any
  field: string
  order: number
}

// 查询历史记录
interface QueryHistory {
  id: string
  query: string
  timestamp: Date
  status: QueryStatus
  favorite: boolean
}

// 分析模板
interface AnalysisTemplate {
  id: string
  name: string
  description: string
  dimensions: string[]
  filters: any
  chartType: ChartType
  isPreset: boolean
  createTime: Date
}

// 下钻路径节点
interface DrillDownNode {
  dimension: string
  value: string
  label: string
}

// 分析数据项
interface AnalysisDataItem {
  productLine: string
  region: string
  period: string
  revenue: number
  cost: number
  profit: number
  margin: number
  growth: number
}

// 当前查询模式
const queryMode = ref<QueryMode>('natural')

// 查询输入
const naturalQuery = ref('')
const advancedQuery = reactive({
  productLine: '',
  region: '',
  dateRange: [] as Date[],
  metric: 'revenue'
})

// 查询状态
const queryStatus = ref<QueryStatus>('idle')
const queryProgress = ref(0)

// 维度列表
const dimensions = ref<Dimension[]>([
  { id: 'product', name: '产品线', icon: Grid, field: 'productLine', order: 1 },
  { id: 'region', name: '地理区域', icon: Location, field: 'region', order: 2 },
  { id: 'time', name: '时间周期', icon: Calendar, field: 'period', order: 3 }
])

// 选中的维度
const selectedDimensions = ref<string[]>(['product', 'region'])

// 查询历史
const queryHistoryList = ref<QueryHistory[]>([])

// 分析结果数据
const analysisData = ref<AnalysisDataItem[]>([])

// 当前图表类型
const currentChartType = ref<ChartType>('table')

// 下钻路径
const drillDownPath = ref<DrillDownNode[]>([])

// 分析模板
const analysisTemplates = ref<AnalysisTemplate[]>([])

// 模板对话框
const templateDialogVisible = ref(false)
const templateForm = reactive({
  name: '',
  description: '',
  dimensions: [] as string[],
  chartType: 'table' as ChartType
})

// 右侧面板展开状态
const rightPanelCollapsed = ref(false)

// 查询状态相关计算属性
const queryStatusColor = computed(() => {
  const colorMap = {
    idle: 'info',
    running: 'primary',
    completed: 'success',
    timeout: 'warning',
    error: 'danger'
  }
  return colorMap[queryStatus.value]
})

const queryStatusText = computed(() => {
  const textMap = {
    idle: '等待查询',
    running: '执行中',
    completed: '查询完成',
    timeout: '查询超时',
    error: '查询错误'
  }
  return textMap[queryStatus.value]
})

// 图表类型选项
const chartTypes: Array<{ value: ChartType; label: string; icon: any }> = [
  { value: 'table', label: '数据表格', icon: Grid },
  { value: 'bar', label: '柱状图', icon: Histogram },
  { value: 'line', label: '折线图', icon: DataLine },
  { value: 'pie', label: '饼图', icon: PieChart }
]

// 执行查询
const executeQuery = async () => {
  queryStatus.value = 'running'
  queryProgress.value = 0
  
  // 模拟查询进度
  const progressInterval = setInterval(() => {
    queryProgress.value += 10
    if (queryProgress.value >= 90) {
      clearInterval(progressInterval)
    }
  }, 200)
  
  try {
    // 模拟异步查询
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 生成 Mock 数据
    analysisData.value = generateMockData()
    
    queryProgress.value = 100
    queryStatus.value = 'completed'
    
    // 添加到查询历史
    const historyItem: QueryHistory = {
      id: Date.now().toString(),
      query: queryMode.value === 'natural' ? naturalQuery.value : JSON.stringify(advancedQuery),
      timestamp: new Date(),
      status: 'completed',
      favorite: false
    }
    queryHistoryList.value.unshift(historyItem)
    
    ElMessage.success('查询完成')
  } catch (error) {
    queryStatus.value = 'error'
    ElMessage.error('查询失败')
  } finally {
    clearInterval(progressInterval)
  }
}

// 生成 Mock 数据
const generateMockData = (): AnalysisDataItem[] => {
  const productLines = ['智能手机', '笔记本电脑', '平板电脑', '智能手表', '耳机']
  const regions = ['华东', '华北', '华南', '西南', '东北']
  const periods = ['2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4']
  
  const data: AnalysisDataItem[] = []
  
  // 根据选中的维度生成数据
  const selectedDims = dimensions.value.filter(d => selectedDimensions.value.includes(d.id))
  
  if (drillDownPath.value.length === 0) {
    // 顶层汇总数据
    for (let i = 0; i < 20; i++) {
      const revenue = Math.random() * 10000000 + 5000000
      const cost = revenue * (0.6 + Math.random() * 0.2)
      const profit = revenue - cost
      
      data.push({
        productLine: productLines[i % productLines.length],
        region: regions[Math.floor(i / productLines.length) % regions.length],
        period: periods[i % periods.length],
        revenue: Math.round(revenue),
        cost: Math.round(cost),
        profit: Math.round(profit),
        margin: Math.round((profit / revenue) * 10000) / 100,
        growth: Math.round((Math.random() - 0.3) * 100 * 100) / 100
      })
    }
  } else {
    // 下钻后的明细数据
    for (let i = 0; i < 10; i++) {
      const revenue = Math.random() * 2000000 + 1000000
      const cost = revenue * (0.6 + Math.random() * 0.2)
      const profit = revenue - cost
      
      data.push({
        productLine: drillDownPath.value.find(n => n.dimension === 'product')?.value || productLines[i % productLines.length],
        region: drillDownPath.value.find(n => n.dimension === 'region')?.value || regions[i % regions.length],
        period: periods[i % periods.length],
        revenue: Math.round(revenue),
        cost: Math.round(cost),
        profit: Math.round(profit),
        margin: Math.round((profit / revenue) * 10000) / 100,
        growth: Math.round((Math.random() - 0.3) * 100 * 100) / 100
      })
    }
  }
  
  return data
}

// 快速查询（使用模板）
const quickQuery = (template: AnalysisTemplate) => {
  selectedDimensions.value = template.dimensions
  currentChartType.value = template.chartType
  
  ElMessage.success(`已应用模板：${template.name}`)
  executeQuery()
}

// 保存为模板
const saveAsTemplate = () => {
  templateForm.dimensions = selectedDimensions.value
  templateForm.chartType = currentChartType.value
  templateDialogVisible.value = true
}

// 确认保存模板
const confirmSaveTemplate = () => {
  const newTemplate: AnalysisTemplate = {
    id: Date.now().toString(),
    name: templateForm.name,
    description: templateForm.description,
    dimensions: templateForm.dimensions,
    filters: { ...advancedQuery },
    chartType: templateForm.chartType,
    isPreset: false,
    createTime: new Date()
  }
  
  analysisTemplates.value.push(newTemplate)
  templateDialogVisible.value = false
  
  // 重置表单
  templateForm.name = ''
  templateForm.description = ''
  
  ElMessage.success('模板保存成功')
}

// 删除模板
const deleteTemplate = (templateId: string) => {
  ElMessageBox.confirm('确定要删除此模板吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    analysisTemplates.value = analysisTemplates.value.filter(t => t.id !== templateId)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

// 切换收藏
const toggleFavorite = (historyId: string) => {
  const item = queryHistoryList.value.find(h => h.id === historyId)
  if (item) {
    item.favorite = !item.favorite
    ElMessage.success(item.favorite ? '已收藏' : '已取消收藏')
  }
}

// 数据下钻
const drillDown = (row: AnalysisDataItem, dimension: string) => {
  const dimMap: Record<string, { value: string; label: string }> = {
    product: { value: row.productLine, label: `产品线: ${row.productLine}` },
    region: { value: row.region, label: `区域: ${row.region}` },
    time: { value: row.period, label: `周期: ${row.period}` }
  }
  
  if (dimMap[dimension]) {
    drillDownPath.value.push({
      dimension,
      ...dimMap[dimension]
    })
    
    // 重新查询数据
    executeQuery()
    ElMessage.info(`已下钻到 ${dimMap[dimension].label}`)
  }
}

// 返回上一级
const drillUp = () => {
  if (drillDownPath.value.length > 0) {
    const removed = drillDownPath.value.pop()
    executeQuery()
    ElMessage.info(`已返回上一级`)
  }
}

// 清除下钻路径
const clearDrillPath = () => {
  drillDownPath.value = []
  executeQuery()
  ElMessage.info('已返回顶层')
}

// 导出数据
const exportData = () => {
  ElMessage.success('数据导出成功（模拟）')
}

// 分享分析
const shareAnalysis = () => {
  ElMessage.success('分享链接已复制到剪贴板（模拟）')
}

// 维度拖拽相关
const draggedDimension = ref<string | null>(null)

const onDimensionDragStart = (dimensionId: string) => {
  draggedDimension.value = dimensionId
}

const onDimensionDrop = (targetId: string) => {
  if (draggedDimension.value && draggedDimension.value !== targetId) {
    const draggedIndex = dimensions.value.findIndex(d => d.id === draggedDimension.value)
    const targetIndex = dimensions.value.findIndex(d => d.id === targetId)
    
    // 交换顺序
    const temp = dimensions.value[draggedIndex].order
    dimensions.value[draggedIndex].order = dimensions.value[targetIndex].order
    dimensions.value[targetIndex].order = temp
    
    // 重新排序
    dimensions.value.sort((a, b) => a.order - b.order)
  }
  draggedDimension.value = null
}

// 格式化数字
const formatNumber = (value: number) => {
  return value.toLocaleString('zh-CN')
}

// 格式化百分比
const formatPercent = (value: number) => {
  return `${value > 0 ? '+' : ''}${value}%`
}

// 初始化预置模板
const initPresetTemplates = () => {
  analysisTemplates.value = [
    {
      id: 'preset1',
      name: '产品线业绩分析',
      description: '按产品线统计销售业绩和利润情况',
      dimensions: ['product', 'time'],
      filters: {},
      chartType: 'bar',
      isPreset: true,
      createTime: new Date('2024-01-01')
    },
    {
      id: 'preset2',
      name: '区域市场对比',
      description: '对比不同区域的市场表现',
      dimensions: ['region', 'product'],
      filters: {},
      chartType: 'pie',
      isPreset: true,
      createTime: new Date('2024-01-01')
    },
    {
      id: 'preset3',
      name: '季度趋势分析',
      description: '分析各季度业绩变化趋势',
      dimensions: ['time', 'product'],
      filters: {},
      chartType: 'line',
      isPreset: true,
      createTime: new Date('2024-01-01')
    },
    {
      id: 'preset4',
      name: '综合绩效分析',
      description: '全维度综合分析绩效数据',
      dimensions: ['product', 'region', 'time'],
      filters: {},
      chartType: 'table',
      isPreset: true,
      createTime: new Date('2024-01-01')
    }
  ]
}

// 组件挂载时初始化
onMounted(() => {
  initPresetTemplates()
})
</script>

<template>
  <div class="real-time-query-container">
    <!-- 顶部查询区域 -->
    <el-card class="query-section" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">
            <el-icon><Search /></el-icon>
            实时查询与分析
          </span>
          <div class="header-actions">
            <el-tag :type="queryStatusColor" size="large">
              <el-icon style="margin-right: 4px">
                <DataAnalysis v-if="queryStatus === 'running'" class="rotating" />
                <TrendCharts v-else />
              </el-icon>
              {{ queryStatusText }}
            </el-tag>
          </div>
        </div>
      </template>

      <!-- 查询模式切换 -->
      <div class="query-mode-tabs">
        <el-button 
          :type="queryMode === 'natural' ? 'primary' : 'default'"
          @click="queryMode = 'natural'"
        >
          <el-icon><Search /></el-icon>
          自然语言查询
        </el-button>
        <el-button 
          :type="queryMode === 'advanced' ? 'primary' : 'default'"
          @click="queryMode = 'advanced'"
        >
          <el-icon><Filter /></el-icon>
          高级查询
        </el-button>
      </div>

      <!-- 自然语言查询 -->
      <div v-if="queryMode === 'natural'" class="natural-query">
        <el-input
          v-model="naturalQuery"
          placeholder="请输入查询内容，例如：查询最近三个月华东地区智能手机的销售情况"
          size="large"
          clearable
        >
          <template #append>
            <el-button 
              type="primary" 
              :icon="Search"
              :loading="queryStatus === 'running'"
              @click="executeQuery"
            >
              查询
            </el-button>
          </template>
        </el-input>
        <div class="query-hints">
          <span class="hint-label">智能提示：</span>
          <el-tag 
            v-for="hint in ['本月业绩汇总', '华南区产品对比', '季度趋势分析']"
            :key="hint"
            size="small"
            style="margin-right: 8px; cursor: pointer"
            @click="naturalQuery = hint"
          >
            {{ hint }}
          </el-tag>
        </div>
      </div>

      <!-- 高级查询 -->
      <div v-else class="advanced-query">
        <el-row :gutter="16">
          <el-col :span="6">
            <el-select 
              v-model="advancedQuery.productLine" 
              placeholder="选择产品线"
              clearable
              style="width: 100%"
            >
              <el-option label="智能手机" value="智能手机" />
              <el-option label="笔记本电脑" value="笔记本电脑" />
              <el-option label="平板电脑" value="平板电脑" />
              <el-option label="智能手表" value="智能手表" />
              <el-option label="耳机" value="耳机" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-select 
              v-model="advancedQuery.region" 
              placeholder="选择地理区域"
              clearable
              style="width: 100%"
            >
              <el-option label="华东" value="华东" />
              <el-option label="华北" value="华北" />
              <el-option label="华南" value="华南" />
              <el-option label="西南" value="西南" />
              <el-option label="东北" value="东北" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-date-picker
              v-model="advancedQuery.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="width: 100%"
            />
          </el-col>
          <el-col :span="6">
            <el-select 
              v-model="advancedQuery.metric" 
              placeholder="选择指标"
              style="width: 100%"
            >
              <el-option label="营收" value="revenue" />
              <el-option label="成本" value="cost" />
              <el-option label="利润" value="profit" />
              <el-option label="利润率" value="margin" />
            </el-select>
          </el-col>
        </el-row>
        <div class="query-actions">
          <el-button 
            type="primary" 
            :icon="Search"
            :loading="queryStatus === 'running'"
            @click="executeQuery"
          >
            执行查询
          </el-button>
          <el-button :icon="RefreshRight">重置条件</el-button>
          <el-button :icon="Star">保存查询</el-button>
        </div>
      </div>

      <!-- 查询进度 -->
      <el-progress 
        v-if="queryStatus === 'running'" 
        :percentage="queryProgress" 
        :status="queryStatusColor === 'primary' ? undefined : queryStatusColor"
        style="margin-top: 16px"
      />
    </el-card>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧：分析结果展示 -->
      <div class="left-panel">
        <!-- 下钻路径导航 -->
        <el-card v-if="drillDownPath.length > 0" class="drill-path-card" shadow="never">
          <div class="drill-path">
            <el-button size="small" :icon="Back" @click="clearDrillPath">返回顶层</el-button>
            <el-icon style="margin: 0 8px"><ArrowRight /></el-icon>
            <el-breadcrumb separator=">">
              <el-breadcrumb-item 
                v-for="(node, index) in drillDownPath"
                :key="index"
              >
                {{ node.label }}
              </el-breadcrumb-item>
            </el-breadcrumb>
            <el-button 
              v-if="drillDownPath.length > 0"
              size="small" 
              :icon="Back" 
              style="margin-left: auto"
              @click="drillUp"
            >
              返回上一级
            </el-button>
          </div>
        </el-card>

        <!-- 分析结果展示 -->
        <el-card class="result-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="title">
                <el-icon><TrendCharts /></el-icon>
                分析结果
              </span>
              <div class="header-actions">
                <el-button-group>
                  <el-button 
                    v-for="chart in chartTypes"
                    :key="chart.value"
                    :type="currentChartType === chart.value ? 'primary' : 'default'"
                    size="small"
                    @click="currentChartType = chart.value"
                  >
                    <el-icon><component :is="chart.icon" /></el-icon>
                  </el-button>
                </el-button-group>
                <el-button size="small" :icon="Download" @click="exportData">导出</el-button>
                <el-button size="small" :icon="Share" @click="shareAnalysis">分享</el-button>
              </div>
            </div>
          </template>

          <!-- 数据表格视图 -->
          <div v-if="currentChartType === 'table'" class="table-view">
            <el-table 
              :data="analysisData" 
              stripe 
              border
              style="width: 100%"
              :default-sort="{ prop: 'revenue', order: 'descending' }"
            >
              <el-table-column 
                prop="productLine" 
                label="产品线" 
                width="140"
                fixed
              >
                <template #default="{ row }">
                  <el-button 
                    link 
                    type="primary"
                    @click="drillDown(row, 'product')"
                  >
                    {{ row.productLine }}
                  </el-button>
                </template>
              </el-table-column>
              <el-table-column 
                prop="region" 
                label="地理区域" 
                width="120"
              >
                <template #default="{ row }">
                  <el-button 
                    link 
                    type="primary"
                    @click="drillDown(row, 'region')"
                  >
                    {{ row.region }}
                  </el-button>
                </template>
              </el-table-column>
              <el-table-column 
                prop="period" 
                label="时间周期" 
                width="120"
              >
                <template #default="{ row }">
                  <el-button 
                    link 
                    type="primary"
                    @click="drillDown(row, 'time')"
                  >
                    {{ row.period }}
                  </el-button>
                </template>
              </el-table-column>
              <el-table-column 
                prop="revenue" 
                label="营收（元）" 
                width="140"
                sortable
              >
                <template #default="{ row }">
                  <span class="number-value">{{ formatNumber(row.revenue) }}</span>
                </template>
              </el-table-column>
              <el-table-column 
                prop="cost" 
                label="成本（元）" 
                width="140"
                sortable
              >
                <template #default="{ row }">
                  <span class="number-value">{{ formatNumber(row.cost) }}</span>
                </template>
              </el-table-column>
              <el-table-column 
                prop="profit" 
                label="利润（元）" 
                width="140"
                sortable
              >
                <template #default="{ row }">
                  <span 
                    class="number-value"
                    :style="{ color: row.profit > 0 ? '#67C23A' : '#F56C6C' }"
                  >
                    {{ formatNumber(row.profit) }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column 
                prop="margin" 
                label="利润率" 
                width="100"
                sortable
              >
                <template #default="{ row }">
                  <el-tag 
                    :type="row.margin > 30 ? 'success' : row.margin > 20 ? 'warning' : 'danger'"
                    size="small"
                  >
                    {{ row.margin }}%
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column 
                prop="growth" 
                label="增长率" 
                width="100"
                sortable
              >
                <template #default="{ row }">
                  <span 
                    :style="{ 
                      color: row.growth > 0 ? '#67C23A' : '#F56C6C',
                      fontWeight: 'bold'
                    }"
                  >
                    {{ formatPercent(row.growth) }}
                  </span>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 柱状图视图 -->
          <div v-else-if="currentChartType === 'bar'" class="chart-view">
            <div class="chart-placeholder">
              <el-icon :size="80" color="#409EFF"><Histogram /></el-icon>
              <p>柱状图展示区域</p>
              <p class="sub-text">实际项目中可集成 ECharts 或其他图表库</p>
            </div>
          </div>

          <!-- 折线图视图 -->
          <div v-else-if="currentChartType === 'line'" class="chart-view">
            <div class="chart-placeholder">
              <el-icon :size="80" color="#67C23A"><DataLine /></el-icon>
              <p>折线图展示区域</p>
              <p class="sub-text">实际项目中可集成 ECharts 或其他图表库</p>
            </div>
          </div>

          <!-- 饼图视图 -->
          <div v-else-if="currentChartType === 'pie'" class="chart-view">
            <div class="chart-placeholder">
              <el-icon :size="80" color="#E6A23C"><PieChart /></el-icon>
              <p>饼图展示区域</p>
              <p class="sub-text">实际项目中可集成 ECharts 或其他图表库</p>
            </div>
          </div>
        </el-card>

        <!-- 数据统计摘要 -->
        <el-card v-if="analysisData.length > 0" class="summary-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="title">
                <el-icon><DataAnalysis /></el-icon>
                统计摘要
              </span>
            </div>
          </template>
          <el-row :gutter="16">
            <el-col :span="6">
              <div class="summary-item">
                <div class="summary-label">总营收</div>
                <div class="summary-value primary">
                  ¥{{ formatNumber(analysisData.reduce((sum, item) => sum + item.revenue, 0)) }}
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="summary-item">
                <div class="summary-label">总成本</div>
                <div class="summary-value warning">
                  ¥{{ formatNumber(analysisData.reduce((sum, item) => sum + item.cost, 0)) }}
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="summary-item">
                <div class="summary-label">总利润</div>
                <div class="summary-value success">
                  ¥{{ formatNumber(analysisData.reduce((sum, item) => sum + item.profit, 0)) }}
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="summary-item">
                <div class="summary-label">平均利润率</div>
                <div class="summary-value info">
                  {{ (analysisData.reduce((sum, item) => sum + item.margin, 0) / analysisData.length).toFixed(2) }}%
                </div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </div>

      <!-- 右侧：维度选择和分析工具 -->
      <div class="right-panel" :class="{ collapsed: rightPanelCollapsed }">
        <div class="panel-toggle" @click="rightPanelCollapsed = !rightPanelCollapsed">
          <el-icon>
            <ArrowRight v-if="rightPanelCollapsed" />
            <Back v-else />
          </el-icon>
        </div>

        <div v-if="!rightPanelCollapsed" class="panel-content">
          <!-- 维度选择 -->
          <el-card class="dimension-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span class="title">
                  <el-icon><Grid /></el-icon>
                  分析维度
                </span>
              </div>
            </template>
            <div class="dimension-list">
              <div 
                v-for="dim in dimensions"
                :key="dim.id"
                class="dimension-item"
                draggable="true"
                @dragstart="onDimensionDragStart(dim.id)"
                @drop.prevent="onDimensionDrop(dim.id)"
                @dragover.prevent
              >
                <el-checkbox 
                  v-model="selectedDimensions"
                  :value="dim.id"
                  :label="dim.id"
                >
                  <div class="dimension-content">
                    <el-icon class="dimension-icon">
                      <component :is="dim.icon" />
                    </el-icon>
                    <span>{{ dim.name }}</span>
                  </div>
                </el-checkbox>
              </div>
            </div>
            <el-alert 
              type="info" 
              :closable="false"
              style="margin-top: 12px"
            >
              <template #title>
                <span style="font-size: 12px">拖拽维度可调整分析顺序</span>
              </template>
            </el-alert>
          </el-card>

          <!-- 分析模板 -->
          <el-card class="template-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span class="title">
                  <el-icon><Setting /></el-icon>
                  分析模板
                </span>
                <el-button 
                  size="small" 
                  type="primary" 
                  :icon="Plus"
                  @click="saveAsTemplate"
                >
                  保存
                </el-button>
              </div>
            </template>
            <div class="template-list">
              <div 
                v-for="template in analysisTemplates"
                :key="template.id"
                class="template-item"
              >
                <div class="template-info">
                  <div class="template-name">
                    {{ template.name }}
                    <el-tag v-if="template.isPreset" size="small" type="info">预置</el-tag>
                  </div>
                  <div class="template-desc">{{ template.description }}</div>
                </div>
                <div class="template-actions">
                  <el-button 
                    size="small" 
                    type="primary" 
                    link
                    @click="quickQuery(template)"
                  >
                    应用
                  </el-button>
                  <el-button 
                    v-if="!template.isPreset"
                    size="small" 
                    type="danger" 
                    link
                    :icon="Delete"
                    @click="deleteTemplate(template.id)"
                  />
                </div>
              </div>
            </div>
          </el-card>

          <!-- 查询历史 -->
          <el-card class="history-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span class="title">
                  <el-icon><Calendar /></el-icon>
                  查询历史
                </span>
              </div>
            </template>
            <div class="history-list">
              <div 
                v-for="history in queryHistoryList.slice(0, 10)"
                :key="history.id"
                class="history-item"
              >
                <div class="history-info">
                  <div class="history-query">{{ history.query }}</div>
                  <div class="history-time">
                    {{ history.timestamp.toLocaleString('zh-CN') }}
                  </div>
                </div>
                <div class="history-actions">
                  <el-button 
                    size="small" 
                    type="primary" 
                    link
                    :icon="history.favorite ? StarFilled : Star"
                    @click="toggleFavorite(history.id)"
                  />
                </div>
              </div>
              <el-empty 
                v-if="queryHistoryList.length === 0"
                description="暂无查询历史"
                :image-size="60"
              />
            </div>
          </el-card>
        </div>
      </div>
    </div>

    <!-- 保存模板对话框 -->
    <el-dialog
      v-model="templateDialogVisible"
      title="保存为分析模板"
      width="500px"
    >
      <el-form :model="templateForm" label-width="100px">
        <el-form-item label="模板名称" required>
          <el-input v-model="templateForm.name" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="模板描述">
          <el-input 
            v-model="templateForm.description" 
            type="textarea"
            :rows="3"
            placeholder="请输入模板描述"
          />
        </el-form-item>
        <el-form-item label="分析维度">
          <el-tag 
            v-for="dimId in templateForm.dimensions"
            :key="dimId"
            style="margin-right: 8px"
          >
            {{ dimensions.find(d => d.id === dimId)?.name }}
          </el-tag>
        </el-form-item>
        <el-form-item label="图表类型">
          <el-tag>
            {{ chartTypes.find(c => c.value === templateForm.chartType)?.label }}
          </el-tag>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="templateDialogVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          :disabled="!templateForm.name"
          @click="confirmSaveTemplate"
        >
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.real-time-query-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 100px);

  .query-section {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: bold;
        color: #303133;
      }

      .header-actions {
        display: flex;
        gap: 12px;
        align-items: center;
      }
    }

    .query-mode-tabs {
      margin-bottom: 20px;
      display: flex;
      gap: 12px;
    }

    .natural-query {
      .query-hints {
        margin-top: 12px;
        display: flex;
        align-items: center;
        gap: 8px;

        .hint-label {
          color: #909399;
          font-size: 14px;
        }
      }
    }

    .advanced-query {
      .query-actions {
        margin-top: 16px;
        display: flex;
        gap: 12px;
      }
    }
  }

  .main-content {
    display: flex;
    gap: 20px;
    align-items: flex-start;

    .left-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 20px;

      .drill-path-card {
        .drill-path {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      }

      .result-card {
        .table-view {
          :deep(.el-table) {
            .number-value {
              font-family: 'Courier New', monospace;
              font-weight: 500;
            }
          }
        }

        .chart-view {
          min-height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;

          .chart-placeholder {
            text-align: center;
            color: #909399;

            p {
              margin: 16px 0 8px;
              font-size: 16px;
              color: #606266;
            }

            .sub-text {
              font-size: 14px;
              color: #909399;
            }
          }
        }
      }

      .summary-card {
        .summary-item {
          text-align: center;
          padding: 16px;
          background: #f5f7fa;
          border-radius: 8px;

          .summary-label {
            font-size: 14px;
            color: #909399;
            margin-bottom: 8px;
          }

          .summary-value {
            font-size: 24px;
            font-weight: bold;

            &.primary { color: #409EFF; }
            &.success { color: #67C23A; }
            &.warning { color: #E6A23C; }
            &.danger { color: #F56C6C; }
            &.info { color: #909399; }
          }
        }
      }
    }

    .right-panel {
      width: 320px;
      position: relative;
      transition: all 0.3s;

      &.collapsed {
        width: 40px;

        .panel-content {
          display: none;
        }
      }

      .panel-toggle {
        position: absolute;
        left: -12px;
        top: 20px;
        width: 24px;
        height: 48px;
        background: white;
        border: 1px solid #dcdfe6;
        border-radius: 4px 0 0 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 10;

        &:hover {
          background: #f5f7fa;
        }
      }

      .panel-content {
        display: flex;
        flex-direction: column;
        gap: 20px;

        .dimension-card {
          .dimension-list {
            display: flex;
            flex-direction: column;
            gap: 12px;

            .dimension-item {
              padding: 12px;
              background: #f5f7fa;
              border-radius: 8px;
              cursor: move;
              transition: all 0.3s;

              &:hover {
                background: #e8edf3;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              }

              .dimension-content {
                display: flex;
                align-items: center;
                gap: 8px;

                .dimension-icon {
                  font-size: 18px;
                  color: #409EFF;
                }
              }

              :deep(.el-checkbox) {
                width: 100%;

                .el-checkbox__label {
                  width: 100%;
                }
              }
            }
          }
        }

        .template-card {
          .template-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
            max-height: 400px;
            overflow-y: auto;

            .template-item {
              padding: 12px;
              background: #f5f7fa;
              border-radius: 8px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              transition: all 0.3s;

              &:hover {
                background: #e8edf3;
              }

              .template-info {
                flex: 1;

                .template-name {
                  font-size: 14px;
                  font-weight: 500;
                  color: #303133;
                  margin-bottom: 4px;
                  display: flex;
                  align-items: center;
                  gap: 8px;
                }

                .template-desc {
                  font-size: 12px;
                  color: #909399;
                }
              }

              .template-actions {
                display: flex;
                gap: 4px;
              }
            }
          }
        }

        .history-card {
          .history-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
            max-height: 300px;
            overflow-y: auto;

            .history-item {
              padding: 12px;
              background: #f5f7fa;
              border-radius: 8px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              transition: all 0.3s;

              &:hover {
                background: #e8edf3;
              }

              .history-info {
                flex: 1;
                overflow: hidden;

                .history-query {
                  font-size: 13px;
                  color: #303133;
                  margin-bottom: 4px;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                }

                .history-time {
                  font-size: 11px;
                  color: #909399;
                }
              }
            }
          }
        }
      }
    }
  }

  .rotating {
    animation: rotate 1s linear infinite;
  }

  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
}
</style>