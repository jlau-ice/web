<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import {
  Search,
  DataAnalysis,
  Document,
  QuestionFilled,
  Setting,
  Plus,
  Delete,
  Edit,
  Star,
  StarFilled,
  Histogram,
  PieChart,
  TrendCharts,
  Guide,
  Monitor,
  Download,
  Refresh,
  Help,
  Moon,
  Sunny
} from '@element-plus/icons-vue'

// 当前激活的模块
const activeModule = ref('query')

// 主题模式
const isDarkTheme = ref(false)

// 新手引导
const showGuide = ref(false)
const guideStep = ref(0)

// ========== 1. 可视化数据查询模块 ==========
interface QueryCondition {
  id: string
  field: string
  operator: string
  value: string
}

interface QueryHistory {
  id: string
  name: string
  conditions: QueryCondition[]
  time: string
  favorite: boolean
}

const queryState = reactive({
  naturalLanguageInput: '',
  conditions: [] as QueryCondition[],
  queryResults: [] as any[],
  queryHistory: [] as QueryHistory[],
  loading: false,
  showResults: false
})

// 可用字段列表
const availableFields = [
  { label: '设备编号', value: 'device_id' },
  { label: '设备名称', value: 'device_name' },
  { label: '运行状态', value: 'status' },
  { label: '能耗值', value: 'energy' },
  { label: '温度', value: 'temperature' },
  { label: '时间范围', value: 'time_range' }
]

const operators = [
  { label: '等于', value: '=' },
  { label: '大于', value: '>' },
  { label: '小于', value: '<' },
  { label: '包含', value: 'contains' },
  { label: '不等于', value: '!=' }
]

// 添加查询条件
const addQueryCondition = () => {
  queryState.conditions.push({
    id: Date.now().toString(),
    field: '',
    operator: '=',
    value: ''
  })
}

// 删除查询条件
const removeQueryCondition = (id: string) => {
  const index = queryState.conditions.findIndex(c => c.id === id)
  if (index > -1) {
    queryState.conditions.splice(index, 1)
  }
}

// 执行查询
const executeQuery = async () => {
  if (queryState.conditions.length === 0 && !queryState.naturalLanguageInput) {
    ElMessage.warning('请添加查询条件或输入自然语言查询')
    return
  }

  queryState.loading = true
  queryState.showResults = false

  // 模拟异步查询
  setTimeout(() => {
    // Mock 查询结果
    queryState.queryResults = Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      device_id: `DEV${String(i + 1001).padStart(4, '0')}`,
      device_name: `设备-${i + 1}`,
      status: Math.random() > 0.3 ? '运行中' : '离线',
      energy: (Math.random() * 1000).toFixed(2),
      temperature: (20 + Math.random() * 15).toFixed(1),
      time: new Date().toLocaleString()
    }))

    queryState.loading = false
    queryState.showResults = true

    // 添加到历史记录
    queryState.queryHistory.unshift({
      id: Date.now().toString(),
      name: queryState.naturalLanguageInput || `查询-${new Date().toLocaleTimeString()}`,
      conditions: [...queryState.conditions],
      time: new Date().toLocaleString(),
      favorite: false
    })

    ElMessage.success('查询完成')
  }, 1500)
}

// 自然语言查询
const naturalLanguageQuery = () => {
  if (!queryState.naturalLanguageInput.trim()) {
    ElMessage.warning('请输入查询内容')
    return
  }
  executeQuery()
}

// 收藏查询
const toggleFavorite = (historyId: string) => {
  const history = queryState.queryHistory.find(h => h.id === historyId)
  if (history) {
    history.favorite = !history.favorite
    ElMessage.success(history.favorite ? '已收藏' : '已取消收藏')
  }
}

// 加载历史查询
const loadHistoryQuery = (history: QueryHistory) => {
  queryState.conditions = [...history.conditions]
  queryState.naturalLanguageInput = history.name
  ElMessage.info('已加载历史查询条件')
}

// ========== 2. 智能数据分析模块 ==========
interface AnalysisTemplate {
  id: string
  name: string
  icon: any
  type: string
  description: string
}

const analysisState = reactive({
  selectedTemplate: null as AnalysisTemplate | null,
  analyzing: false,
  analysisResult: null as any,
  showPivotTable: false,
  chartType: 'line'
})

const analysisTemplates: AnalysisTemplate[] = [
  { id: '1', name: '趋势分析', icon: TrendCharts, type: 'trend', description: '分析数据随时间的变化趋势' },
  { id: '2', name: '对比分析', icon: Histogram, type: 'compare', description: '对比不同维度的数据差异' },
  { id: '3', name: '关联分析', icon: PieChart, type: 'correlation', description: '发现数据之间的关联关系' },
  { id: '4', name: '异常检测', icon: DataAnalysis, type: 'anomaly', description: '识别数据中的异常点' }
]

// 执行分析
const executeAnalysis = async (template: AnalysisTemplate) => {
  analysisState.selectedTemplate = template
  analysisState.analyzing = true

  setTimeout(() => {
    // Mock 分析结果
    analysisState.analysisResult = {
      summary: `${template.name}完成，共分析了1500条数据记录`,
      insights: [
        '能耗在工作日明显高于周末，峰值出现在上午10-11点',
        '温度与能耗呈正相关关系，相关系数为0.78',
        '检测到3个异常数据点，建议进一步核查',
        '整体趋势呈上升态势，月度增长率约12%'
      ],
      chartData: generateMockChartData(template.type),
      recommendation: '建议优化能源使用时间分布，重点关注高峰时段'
    }

    analysisState.analyzing = false
    ElNotification({
      title: '分析完成',
      message: `${template.name}已完成，发现4个关键洞察`,
      type: 'success',
      duration: 3000
    })
  }, 2000)
}

// 生成 Mock 图表数据
const generateMockChartData = (type: string) => {
  const labels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  return {
    labels,
    datasets: [
      {
        label: '能耗',
        data: Array.from({ length: 7 }, () => Math.floor(Math.random() * 100) + 50)
      },
      {
        label: '温度',
        data: Array.from({ length: 7 }, () => Math.floor(Math.random() * 30) + 20)
      }
    ]
  }
}

// ========== 3. 报表可视化配置模块 ==========
interface ReportComponent {
  id: string
  type: string
  name: string
  icon: string
}

interface CanvasComponent {
  id: string
  type: string
  name: string
  x: number
  y: number
  width: number
  height: number
  config: any
}

const reportState = reactive({
  canvasComponents: [] as CanvasComponent[],
  selectedComponent: null as CanvasComponent | null,
  isDragging: false,
  showPreview: false
})

const componentLibrary: ReportComponent[] = [
  { id: '1', type: 'chart-line', name: '折线图', icon: '📈' },
  { id: '2', type: 'chart-bar', name: '柱状图', icon: '📊' },
  { id: '3', type: 'chart-pie', name: '饼图', icon: '🥧' },
  { id: '4', type: 'table', name: '数据表格', icon: '📋' },
  { id: '5', type: 'metric', name: '指标卡', icon: '🎯' },
  { id: '6', type: 'text', name: '文本', icon: '📝' }
]

// 添加组件到画布
const addComponentToCanvas = (component: ReportComponent) => {
  const newComponent: CanvasComponent = {
    id: Date.now().toString(),
    type: component.type,
    name: component.name,
    x: Math.random() * 300,
    y: Math.random() * 200,
    width: 300,
    height: 200,
    config: {
      title: component.name,
      data: generateMockChartData('default')
    }
  }

  reportState.canvasComponents.push(newComponent)
  ElMessage.success(`已添加${component.name}`)
}

// 选中组件
const selectComponent = (component: CanvasComponent) => {
  reportState.selectedComponent = component
}

// 删除组件
const deleteComponent = (id: string) => {
  const index = reportState.canvasComponents.findIndex(c => c.id === id)
  if (index > -1) {
    reportState.canvasComponents.splice(index, 1)
    if (reportState.selectedComponent?.id === id) {
      reportState.selectedComponent = null
    }
    ElMessage.success('组件已删除')
  }
}

// 保存报表
const saveReport = () => {
  ElMessage.success('报表已保存')
}

// 预览报表
const previewReport = () => {
  reportState.showPreview = true
}

// ========== 4. 操作引导系统 ==========
const guideSteps = [
  { title: '欢迎', content: '欢迎使用可视化数据分析平台，让我们开始快速导览' },
  { title: '数据查询', content: '在这里您可以通过拖拽或自然语言进行数据查询' },
  { title: '智能分析', content: '选择分析模板，一键生成专业的数据分析报告' },
  { title: '报表配置', content: '拖拽组件到画布，轻松创建可视化报表' },
  { title: '完成', content: '导览完成！您现在可以开始使用了' }
]

const startGuide = () => {
  showGuide.value = true
  guideStep.value = 0
}

const nextGuideStep = () => {
  if (guideStep.value < guideSteps.length - 1) {
    guideStep.value++
  } else {
    showGuide.value = false
    guideStep.value = 0
  }
}

const skipGuide = () => {
  showGuide.value = false
  guideStep.value = 0
}

// ========== 5. 个性化工作台 ==========
const workspaceState = reactive({
  showSettings: false,
  layout: 'default',
  favoriteFeatures: ['query', 'analysis'] as string[]
})

// 切换主题
const toggleTheme = () => {
  isDarkTheme.value = !isDarkTheme.value
  ElMessage.success(`已切换到${isDarkTheme.value ? '深色' : '浅色'}模式`)
}

// 切换模块
const switchModule = (module: string) => {
  activeModule.value = module
}

// 初始化
onMounted(() => {
  // 模拟加载历史数据
  setTimeout(() => {
    queryState.queryHistory = [
      {
        id: '1',
        name: '查询运行中的设备',
        conditions: [{ id: '1', field: 'status', operator: '=', value: '运行中' }],
        time: '2025-10-30 10:30:00',
        favorite: true
      },
      {
        id: '2',
        name: '查询高能耗设备',
        conditions: [{ id: '2', field: 'energy', operator: '>', value: '500' }],
        time: '2025-10-30 09:15:00',
        favorite: false
      }
    ]
  }, 500)
})
</script>

<template>
  <div class="visual-analysis-container" :class="{ 'dark-theme': isDarkTheme }">
    <!-- 顶部导航栏 -->
    <div class="header">
      <div class="header-left">
        <el-icon :size="24" color="#409EFF"><Monitor /></el-icon>
        <h2 class="title">可视化数据分析平台</h2>
      </div>
      <div class="header-right">
        <el-tooltip content="操作引导">
          <el-button :icon="Guide" circle @click="startGuide" />
        </el-tooltip>
        <el-tooltip content="帮助文档">
          <el-button :icon="Help" circle />
        </el-tooltip>
        <el-tooltip :content="isDarkTheme ? '浅色模式' : '深色模式'">
          <el-button :icon="isDarkTheme ? Sunny : Moon" circle @click="toggleTheme" />
        </el-tooltip>
        <el-tooltip content="工作台设置">
          <el-button :icon="Setting" circle @click="workspaceState.showSettings = true" />
        </el-tooltip>
      </div>
    </div>

    <!-- 功能模块切换 -->
    <div class="module-tabs">
      <el-button
        :type="activeModule === 'query' ? 'primary' : ''"
        :icon="Search"
        @click="switchModule('query')"
      >
        数据查询
      </el-button>
      <el-button
        :type="activeModule === 'analysis' ? 'primary' : ''"
        :icon="DataAnalysis"
        @click="switchModule('analysis')"
      >
        智能分析
      </el-button>
      <el-button
        :type="activeModule === 'report' ? 'primary' : ''"
        :icon="Document"
        @click="switchModule('report')"
      >
        报表配置
      </el-button>
    </div>

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- ========== 1. 数据查询模块 ========== -->
      <div v-if="activeModule === 'query'" class="query-module">
        <el-row :gutter="20">
          <!-- 左侧：查询条件构建 -->
          <el-col :span="16">
            <el-card shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>可视化查询构建器</span>
                  <el-button type="primary" :icon="Plus" size="small" @click="addQueryCondition">
                    添加条件
                  </el-button>
                </div>
              </template>

              <!-- 自然语言查询 -->
              <el-alert
                title="💡 提示：您可以使用自然语言描述查询需求"
                type="info"
                :closable="false"
                style="margin-bottom: 15px"
              />
              <div class="natural-language-query">
                <el-input
                  v-model="queryState.naturalLanguageInput"
                  placeholder="例如：查询昨天所有运行中且能耗大于500的设备"
                  size="large"
                  clearable
                >
                  <template #append>
                    <el-button :icon="Search" @click="naturalLanguageQuery">查询</el-button>
                  </template>
                </el-input>
              </div>

              <el-divider>或使用拖拽式条件构建</el-divider>

              <!-- 查询条件列表 -->
              <div class="query-conditions">
                <div
                  v-for="condition in queryState.conditions"
                  :key="condition.id"
                  class="condition-item"
                >
                  <el-select v-model="condition.field" placeholder="选择字段" style="width: 30%">
                    <el-option
                      v-for="field in availableFields"
                      :key="field.value"
                      :label="field.label"
                      :value="field.value"
                    />
                  </el-select>
                  <el-select v-model="condition.operator" placeholder="运算符" style="width: 20%">
                    <el-option
                      v-for="op in operators"
                      :key="op.value"
                      :label="op.label"
                      :value="op.value"
                    />
                  </el-select>
                  <el-input
                    v-model="condition.value"
                    placeholder="输入值"
                    style="width: 35%"
                  />
                  <el-button
                    type="danger"
                    :icon="Delete"
                    circle
                    size="small"
                    @click="removeQueryCondition(condition.id)"
                  />
                </div>
              </div>

              <!-- 执行查询按钮 -->
              <div class="query-actions">
                <el-button
                  type="primary"
                  size="large"
                  :loading="queryState.loading"
                  @click="executeQuery"
                >
                  <el-icon><Search /></el-icon>
                  {{ queryState.loading ? '查询中...' : '执行查询' }}
                </el-button>
                <el-button size="large" @click="queryState.conditions = []">
                  <el-icon><Refresh /></el-icon>
                  重置条件
                </el-button>
              </div>

              <!-- 查询结果 -->
              <div v-if="queryState.showResults" class="query-results">
                <el-divider>查询结果 ({{ queryState.queryResults.length }} 条)</el-divider>
                <el-table :data="queryState.queryResults" stripe style="width: 100%">
                  <el-table-column prop="device_id" label="设备编号" width="120" />
                  <el-table-column prop="device_name" label="设备名称" width="120" />
                  <el-table-column prop="status" label="运行状态" width="100">
                    <template #default="{ row }">
                      <el-tag :type="row.status === '运行中' ? 'success' : 'info'">
                        {{ row.status }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="energy" label="能耗值(kW)" width="120" />
                  <el-table-column prop="temperature" label="温度(℃)" width="100" />
                  <el-table-column prop="time" label="时间" />
                </el-table>
                <div style="margin-top: 15px">
                  <el-button :icon="Download" type="success">导出结果</el-button>
                </div>
              </div>
            </el-card>
          </el-col>

          <!-- 右侧：查询历史 -->
          <el-col :span="8">
            <el-card shadow="hover">
              <template #header>
                <span>查询历史与收藏</span>
              </template>
              <div class="query-history">
                <div
                  v-for="history in queryState.queryHistory"
                  :key="history.id"
                  class="history-item"
                  :class="{ favorite: history.favorite }"
                >
                  <div class="history-header">
                    <span class="history-name">{{ history.name }}</span>
                    <el-icon
                      :size="18"
                      style="cursor: pointer"
                      :color="history.favorite ? '#f59e0b' : '#ccc'"
                      @click="toggleFavorite(history.id)"
                    >
                      <StarFilled v-if="history.favorite" />
                      <Star v-else />
                    </el-icon>
                  </div>
                  <div class="history-time">{{ history.time }}</div>
                  <div class="history-conditions">
                    条件数: {{ history.conditions.length }}
                  </div>
                  <el-button
                    size="small"
                    type="primary"
                    text
                    @click="loadHistoryQuery(history)"
                  >
                    加载此查询
                  </el-button>
                </div>
                <el-empty v-if="queryState.queryHistory.length === 0" description="暂无历史记录" />
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- ========== 2. 智能分析模块 ========== -->
      <div v-if="activeModule === 'analysis'" class="analysis-module">
        <el-row :gutter="20">
          <!-- 分析模板 -->
          <el-col :span="24">
            <el-card shadow="hover">
              <template #header>
                <span>选择分析模板</span>
              </template>
              <el-row :gutter="15">
                <el-col
                  v-for="template in analysisTemplates"
                  :key="template.id"
                  :span="6"
                >
                  <div
                    class="analysis-template"
                    :class="{ active: analysisState.selectedTemplate?.id === template.id }"
                    @click="executeAnalysis(template)"
                  >
                    <el-icon :size="40" color="#409EFF">
                      <component :is="template.icon" />
                    </el-icon>
                    <h3>{{ template.name }}</h3>
                    <p>{{ template.description }}</p>
                  </div>
                </el-col>
              </el-row>
            </el-card>
          </el-col>

          <!-- 分析结果 -->
          <el-col v-if="analysisState.analysisResult" :span="24" style="margin-top: 20px">
            <el-card shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>分析结果</span>
                  <el-tag v-if="!analysisState.analyzing" type="success">完成</el-tag>
                  <el-tag v-else type="primary">分析中...</el-tag>
                </div>
              </template>

              <el-alert
                :title="analysisState.analysisResult.summary"
                type="success"
                :closable="false"
                show-icon
                style="margin-bottom: 20px"
              />

              <el-row :gutter="20">
                <!-- 关键洞察 -->
                <el-col :span="12">
                  <h3>📊 关键洞察</h3>
                  <div class="insights-list">
                    <div
                      v-for="(insight, index) in analysisState.analysisResult.insights"
                      :key="index"
                      class="insight-item"
                    >
                      <el-icon color="#67c23a"><Check /></el-icon>
                      {{ insight }}
                    </div>
                  </div>
                  <el-divider />
                  <h3>💡 智能建议</h3>
                  <el-alert
                    :title="analysisState.analysisResult.recommendation"
                    type="warning"
                    :closable="false"
                  />
                </el-col>

                <!-- 可视化图表 -->
                <el-col :span="12">
                  <h3>📈 可视化图表</h3>
                  <div class="chart-preview">
                    <div class="mock-chart">
                      <div
                        v-for="(value, index) in analysisState.analysisResult.chartData.datasets[0].data"
                        :key="index"
                        class="chart-bar"
                        :style="{ height: value + 'px' }"
                      >
                        <span>{{ value }}</span>
                      </div>
                    </div>
                    <div class="chart-labels">
                      <span
                        v-for="label in analysisState.analysisResult.chartData.labels"
                        :key="label"
                      >
                        {{ label }}
                      </span>
                    </div>
                  </div>
                </el-col>
              </el-row>

              <div style="margin-top: 20px">
                <el-button type="primary" :icon="Download">导出分析报告</el-button>
                <el-button :icon="Star">保存为模板</el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- ========== 3. 报表配置模块 ========== -->
      <div v-if="activeModule === 'report'" class="report-module">
        <div class="report-layout">
          <!-- 左侧：组件库 -->
          <div class="component-library">
            <h3>📦 组件库</h3>
            <div class="component-list">
              <div
                v-for="component in componentLibrary"
                :key="component.id"
                class="component-item"
                @click="addComponentToCanvas(component)"
              >
                <span class="component-icon">{{ component.icon }}</span>
                <span class="component-name">{{ component.name }}</span>
              </div>
            </div>
          </div>

          <!-- 中间：设计画布 -->
          <div class="design-canvas">
            <div class="canvas-header">
              <h3>🎨 设计画布</h3>
              <div>
                <el-button size="small" :icon="Refresh">清空</el-button>
                <el-button size="small" type="primary" :icon="Document" @click="saveReport">
                  保存
                </el-button>
                <el-button size="small" type="success" @click="previewReport">预览</el-button>
              </div>
            </div>
            <div class="canvas-area">
              <div
                v-for="component in reportState.canvasComponents"
                :key="component.id"
                class="canvas-component"
                :class="{ selected: reportState.selectedComponent?.id === component.id }"
                :style="{
                  left: component.x + 'px',
                  top: component.y + 'px',
                  width: component.width + 'px',
                  height: component.height + 'px'
                }"
                @click="selectComponent(component)"
              >
                <div class="component-header">
                  <span>{{ component.name }}</span>
                  <el-icon style="cursor: pointer" @click.stop="deleteComponent(component.id)">
                    <Delete />
                  </el-icon>
                </div>
                <div class="component-content">
                  <div v-if="component.type.includes('chart')" class="mock-mini-chart">
                    <div
                      v-for="i in 5"
                      :key="i"
                      class="mini-bar"
                      :style="{ height: Math.random() * 80 + 20 + 'px' }"
                    />
                  </div>
                  <div v-else-if="component.type === 'metric'" class="mock-metric">
                    <div class="metric-value">{{ Math.floor(Math.random() * 1000) }}</div>
                    <div class="metric-label">{{ component.config.title }}</div>
                  </div>
                  <div v-else class="mock-content">
                    {{ component.name }}内容区域
                  </div>
                </div>
              </div>
              <el-empty
                v-if="reportState.canvasComponents.length === 0"
                description="从左侧拖拽组件到此处开始设计"
              />
            </div>
          </div>

          <!-- 右侧：属性配置 -->
          <div class="property-panel">
            <h3>⚙️ 属性配置</h3>
            <div v-if="reportState.selectedComponent" class="property-form">
              <el-form label-width="80px" size="small">
                <el-form-item label="组件名称">
                  <el-input v-model="reportState.selectedComponent.name" />
                </el-form-item>
                <el-form-item label="宽度">
                  <el-input-number
                    v-model="reportState.selectedComponent.width"
                    :min="100"
                    :max="800"
                  />
                </el-form-item>
                <el-form-item label="高度">
                  <el-input-number
                    v-model="reportState.selectedComponent.height"
                    :min="100"
                    :max="600"
                  />
                </el-form-item>
                <el-form-item label="标题">
                  <el-input v-model="reportState.selectedComponent.config.title" />
                </el-form-item>
              </el-form>
            </div>
            <el-empty v-else description="请选择一个组件" />
          </div>
        </div>
      </div>
    </div>

    <!-- 新手引导弹窗 -->
    <el-dialog
      v-model="showGuide"
      title="操作引导"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-steps :active="guideStep" finish-status="success" align-center>
        <el-step
          v-for="(step, index) in guideSteps"
          :key="index"
          :title="step.title"
        />
      </el-steps>
      <div class="guide-content">
        <h3>{{ guideSteps[guideStep].title }}</h3>
        <p>{{ guideSteps[guideStep].content }}</p>
      </div>
      <template #footer>
        <el-button @click="skipGuide">跳过</el-button>
        <el-button type="primary" @click="nextGuideStep">
          {{ guideStep < guideSteps.length - 1 ? '下一步' : '完成' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 工作台设置 -->
    <el-drawer v-model="workspaceState.showSettings" title="工作台设置" size="400px">
      <el-form label-width="100px">
        <el-form-item label="布局方式">
          <el-select v-model="workspaceState.layout">
            <el-option label="默认布局" value="default" />
            <el-option label="紧凑布局" value="compact" />
            <el-option label="宽松布局" value="spacious" />
          </el-select>
        </el-form-item>
        <el-form-item label="主题模式">
          <el-switch
            v-model="isDarkTheme"
            active-text="深色"
            inactive-text="浅色"
          />
        </el-form-item>
        <el-form-item label="快捷功能">
          <el-checkbox-group v-model="workspaceState.favoriteFeatures">
            <el-checkbox label="query">数据查询</el-checkbox>
            <el-checkbox label="analysis">智能分析</el-checkbox>
            <el-checkbox label="report">报表配置</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
    </el-drawer>

    <!-- 报表预览弹窗 -->
    <el-dialog
      v-model="reportState.showPreview"
      title="报表预览"
      width="80%"
      fullscreen
    >
      <div class="report-preview">
        <h2 style="text-align: center; margin-bottom: 20px">我的数据报表</h2>
        <el-row :gutter="20">
          <el-col
            v-for="component in reportState.canvasComponents"
            :key="component.id"
            :span="8"
          >
            <el-card shadow="hover">
              <template #header>{{ component.config.title }}</template>
              <div style="height: 200px; display: flex; align-items: center; justify-content: center">
                {{ component.name }}预览
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.visual-analysis-container {
  transition: all 0.3s;
    background: #fff;
  &.dark-theme {
    background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);

    .header,
    .main-content,
    .module-tabs {
      background: #2d3748;
      color: #e2e8f0;
    }
  }
}

// 顶部导航栏
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 25px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 15px;

    .title {
      margin: 0;
      font-size: 22px;
      font-weight: 600;
      color: #409eff;
    }
  }

  .header-right {
    display: flex;
    gap: 10px;
  }
}

// 模块切换
.module-tabs {
  display: flex;
  gap: 15px;
  padding: 15px 25px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

// 主内容区
.main-content {
  padding: 25px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  min-height: calc(100vh - 200px);
}

// 卡片头部
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

// ========== 数据查询样式 ==========
.query-module {
  .natural-language-query {
    margin-bottom: 20px;
  }

  .query-conditions {
    margin: 20px 0;

    .condition-item {
      display: flex;
      gap: 10px;
      align-items: center;
      margin-bottom: 15px;
      padding: 15px;
      background: #f5f7fa;
      border-radius: 8px;
      transition: all 0.3s;

      &:hover {
        background: #e8f4ff;
        transform: translateX(5px);
      }
    }
  }

  .query-actions {
    margin-top: 25px;
    display: flex;
    gap: 15px;
    justify-content: center;
  }

  .query-results {
    margin-top: 20px;
  }

  .query-history {
    .history-item {
      padding: 15px;
      margin-bottom: 12px;
      background: #f5f7fa;
      border-radius: 8px;
      border-left: 4px solid #409eff;
      transition: all 0.3s;
      cursor: pointer;

      &:hover {
        background: #e8f4ff;
        transform: translateX(5px);
      }

      &.favorite {
        background: #fef3e8;
        border-left-color: #f59e0b;
      }

      .history-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        .history-name {
          font-weight: 600;
          color: #303133;
        }
      }

      .history-time {
        font-size: 12px;
        color: #909399;
        margin-bottom: 5px;
      }

      .history-conditions {
        font-size: 13px;
        color: #606266;
        margin-bottom: 10px;
      }
    }
  }
}

// ========== 智能分析样式 ==========
.analysis-module {
  .analysis-template {
    padding: 25px;
    text-align: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s;
    color: white;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
    }

    &.active {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      transform: scale(1.05);
    }

    h3 {
      margin: 15px 0 10px;
      font-size: 18px;
    }

    p {
      font-size: 13px;
      opacity: 0.9;
      margin: 0;
    }
  }

  .insights-list {
    .insight-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px;
      margin-bottom: 10px;
      background: #f0f9ff;
      border-radius: 8px;
      border-left: 3px solid #67c23a;
    }
  }

  .chart-preview {
    .mock-chart {
      display: flex;
      align-items: flex-end;
      gap: 15px;
      height: 200px;
      padding: 20px;
      background: #f5f7fa;
      border-radius: 8px;

      .chart-bar {
        flex: 1;
        background: linear-gradient(180deg, #409eff 0%, #79bbff 100%);
        border-radius: 4px 4px 0 0;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding-top: 5px;
        color: white;
        font-size: 12px;
        font-weight: bold;
        transition: all 0.3s;

        &:hover {
          background: linear-gradient(180deg, #67c23a 0%, #95d475 100%);
          transform: scaleY(1.05);
        }
      }
    }

    .chart-labels {
      display: flex;
      justify-content: space-around;
      margin-top: 10px;
      font-size: 12px;
      color: #909399;
    }
  }
}

// ========== 报表配置样式 ==========
.report-module {
  .report-layout {
    display: flex;
    gap: 20px;
    height: calc(100vh - 280px);

    .component-library {
      width: 200px;
      background: #f5f7fa;
      border-radius: 8px;
      padding: 15px;
      overflow-y: auto;

      h3 {
        margin-top: 0;
        color: #303133;
      }

      .component-list {
        .component-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          margin-bottom: 10px;
          background: white;
          border-radius: 8px;
          cursor: move;
          transition: all 0.3s;
          border: 2px solid transparent;

          &:hover {
            border-color: #409eff;
            transform: translateX(5px);
            box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
          }

          .component-icon {
            font-size: 24px;
          }

          .component-name {
            font-size: 14px;
            font-weight: 500;
          }
        }
      }
    }

    .design-canvas {
      flex: 1;
      background: #fafafa;
      border-radius: 8px;
      padding: 15px;
      overflow: auto;

      .canvas-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;

        h3 {
          margin: 0;
        }
      }

      .canvas-area {
        position: relative;
        min-height: 500px;
        background: white;
        border: 2px dashed #dcdfe6;
        border-radius: 8px;
        padding: 20px;

        .canvas-component {
          position: absolute;
          background: white;
          border: 2px solid #e4e7ed;
          border-radius: 8px;
          overflow: hidden;
          cursor: move;
          transition: all 0.3s;

          &:hover,
          &.selected {
            border-color: #409eff;
            box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
          }

          .component-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 15px;
            background: #f5f7fa;
            border-bottom: 1px solid #e4e7ed;
            font-weight: 600;
            font-size: 14px;
          }

          .component-content {
            padding: 15px;
            height: calc(100% - 45px);

            .mock-mini-chart {
              display: flex;
              align-items: flex-end;
              gap: 10px;
              height: 100%;

              .mini-bar {
                flex: 1;
                background: linear-gradient(180deg, #409eff 0%, #79bbff 100%);
                border-radius: 4px 4px 0 0;
              }
            }

            .mock-metric {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100%;

              .metric-value {
                font-size: 48px;
                font-weight: bold;
                color: #409eff;
                margin-bottom: 10px;
              }

              .metric-label {
                font-size: 16px;
                color: #909399;
              }
            }

            .mock-content {
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100%;
              color: #909399;
            }
          }
        }
      }
    }

    .property-panel {
      width: 280px;
      background: #f5f7fa;
      border-radius: 8px;
      padding: 15px;
      overflow-y: auto;

      h3 {
        margin-top: 0;
        color: #303133;
      }

      .property-form {
        background: white;
        padding: 15px;
        border-radius: 8px;
      }
    }
  }
}

// 引导内容
.guide-content {
  padding: 30px 20px;
  text-align: center;

  h3 {
    color: #409eff;
    font-size: 22px;
    margin-bottom: 15px;
  }

  p {
    font-size: 16px;
    color: #606266;
    line-height: 1.6;
  }
}

// 报表预览
.report-preview {
  padding: 20px;
}

// 响应式
@media (max-width: 1200px) {
  .report-layout {
    .component-library {
      width: 150px;
    }

    .property-panel {
      width: 220px;
    }
  }
}
</style>