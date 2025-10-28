<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue'
import { ElMessage, ElLoading, ElNotification } from 'element-plus'
import * as echarts from 'echarts'
import type { ECharts } from 'echarts'

// ==================== 类型定义 ====================
interface TagNode {
  id: string
  name: string
  code: string
  type: string
  dataSource: string
  lastUpdateTime: string
  description: string
  calculationLogic: string
  status: string
  impact: string
}

interface TagLink {
  source: string
  target: string
  type: '计算依赖' | '业务依赖' | '数据依赖'
  strength: '弱' | '中' | '强'
}

interface ConflictReport {
  cycleGroups: string[][]
  duplicateDependencies: string[][]
  isolatedTags: string[]
}

interface PathAnalysisResult {
  path: string[]
  steps: { from: string; to: string; relationship: string }[]
  impactScope: string
}

// ==================== 响应式数据 ====================
const searchKeyword = ref('')
const dependencyLevel = ref<'direct' | 'indirect'>('direct')
const layoutType = ref<'force' | 'hierarchy'>('force')
const selectedTags = ref<string[]>([])
const chartInstance = ref<ECharts | null>(null)
const chartContainer = ref<HTMLDivElement>()
const drawerVisible = ref(false)
const conflictDialogVisible = ref(false)
const pathDialogVisible = ref(false)
const currentTagDetail = ref<TagNode | null>(null)
const conflictReport = ref<ConflictReport | null>(null)
const pathAnalysisResult = ref<PathAnalysisResult | null>(null)
const loading = ref(false)

// Mock 数据
const mockTags = ref<TagNode[]>([
  {
    id: 'tag001',
    name: '用户活跃度',
    code: 'USER_ACTIVITY',
    type: '行为标签',
    dataSource: '用户行为日志表',
    lastUpdateTime: '2025-10-28 10:30:00',
    description: '基于用户最近30天的登录、浏览、互动行为计算用户活跃程度',
    calculationLogic: 'SUM(登录次数*0.3 + 浏览时长*0.4 + 互动次数*0.3)',
    status: '正常',
    impact: '被10个下游标签依赖'
  },
  {
    id: 'tag002',
    name: '购买频次',
    code: 'PURCHASE_FREQ',
    type: '交易标签',
    dataSource: '订单表',
    lastUpdateTime: '2025-10-28 09:15:00',
    description: '统计用户近90天内的购买次数',
    calculationLogic: 'COUNT(订单ID) WHERE 订单时间 >= DATEADD(day, -90, GETDATE())',
    status: '正常',
    impact: '被8个下游标签依赖'
  },
  {
    id: 'tag003',
    name: '客单价',
    code: 'AVG_ORDER_VALUE',
    type: '交易标签',
    dataSource: '订单表',
    lastUpdateTime: '2025-10-28 08:45:00',
    description: '用户平均订单金额',
    calculationLogic: 'AVG(订单金额)',
    status: '正常',
    impact: '被6个下游标签依赖'
  },
  {
    id: 'tag004',
    name: '高价值客户',
    code: 'HIGH_VALUE_CUSTOMER',
    type: '复合标签',
    dataSource: '计算字段',
    lastUpdateTime: '2025-10-28 11:00:00',
    description: '基于购买频次和客单价识别高价值客户',
    calculationLogic: 'IF(购买频次 >= 5 AND 客单价 >= 500, 1, 0)',
    status: '正常',
    impact: '被12个下游标签依赖'
  },
  {
    id: 'tag005',
    name: '流失风险',
    code: 'CHURN_RISK',
    type: '预测标签',
    dataSource: '模型输出表',
    lastUpdateTime: '2025-10-28 10:00:00',
    description: '基于用户活跃度预测流失风险',
    calculationLogic: 'ML_MODEL(用户活跃度, 购买频次)',
    status: '正常',
    impact: '被5个下游标签依赖'
  },
  {
    id: 'tag006',
    name: '营销响应度',
    code: 'MARKETING_RESPONSE',
    type: '行为标签',
    dataSource: '营销活动表',
    lastUpdateTime: '2025-10-27 16:30:00',
    description: '用户对营销活动的响应率',
    calculationLogic: 'COUNT(点击) / COUNT(曝光)',
    status: '正常',
    impact: '被4个下游标签依赖'
  },
  {
    id: 'tag007',
    name: '个性化推荐',
    code: 'PERSONALIZED_REC',
    type: '推荐标签',
    dataSource: '推荐引擎',
    lastUpdateTime: '2025-10-28 11:30:00',
    description: '基于多维标签生成个性化推荐',
    calculationLogic: 'RECOMMEND(用户活跃度, 高价值客户, 营销响应度)',
    status: '正常',
    impact: '最终应用标签'
  },
  {
    id: 'tag008',
    name: '消费能力',
    code: 'SPENDING_POWER',
    type: '财务标签',
    dataSource: '订单表',
    lastUpdateTime: '2025-10-28 09:00:00',
    description: '用户累计消费金额',
    calculationLogic: 'SUM(订单金额)',
    status: '正常',
    impact: '被7个下游标签依赖'
  }
])

const mockLinks = ref<TagLink[]>([
  { source: 'tag001', target: 'tag005', type: '计算依赖', strength: '强' },
  { source: 'tag002', target: 'tag004', type: '计算依赖', strength: '强' },
  { source: 'tag003', target: 'tag004', type: '计算依赖', strength: '强' },
  { source: 'tag004', target: 'tag007', type: '业务依赖', strength: '中' },
  { source: 'tag001', target: 'tag007', type: '数据依赖', strength: '中' },
  { source: 'tag005', target: 'tag007', type: '计算依赖', strength: '弱' },
  { source: 'tag006', target: 'tag007', type: '业务依赖', strength: '中' },
  { source: 'tag002', target: 'tag005', type: '计算依赖', strength: '中' },
  { source: 'tag008', target: 'tag004', type: '计算依赖', strength: '强' },
  { source: 'tag008', target: 'tag005', type: '数据依赖', strength: '弱' }
])

// ==================== 计算属性 ====================
const filteredTags = computed(() => {
  if (!searchKeyword.value) return mockTags.value
  const keyword = searchKeyword.value.toLowerCase()
  return mockTags.value.filter(
    (tag) =>
      tag.name.toLowerCase().includes(keyword) ||
      tag.code.toLowerCase().includes(keyword) ||
      tag.type.toLowerCase().includes(keyword)
  )
})

// ==================== 依赖关系图相关 ====================
const getDependencyColor = (type: string) => {
  const colorMap: Record<string, string> = {
    计算依赖: '#5470c6',
    业务依赖: '#91cc75',
    数据依赖: '#fac858'
  }
  return colorMap[type] || '#999'
}

const getDependencyWidth = (strength: string) => {
  const widthMap: Record<string, number> = {
    弱: 1,
    中: 2,
    强: 3
  }
  return widthMap[strength] || 1
}

const initChart = () => {
  if (!chartContainer.value) return

  chartInstance.value = echarts.init(chartContainer.value)

  const nodes = mockTags.value.map((tag) => ({
    id: tag.id,
    name: tag.name,
    value: tag.name,
    symbolSize: 60,
    itemStyle: {
      color: tag.type.includes('复合') ? '#ee6666' : tag.type.includes('预测') ? '#9a60b4' : '#5470c6'
    },
    label: {
      show: true
    },
    tagData: tag
  }))

  const links = mockLinks.value.map((link) => ({
    source: link.source,
    target: link.target,
    lineStyle: {
      color: getDependencyColor(link.type),
      width: getDependencyWidth(link.strength),
      curveness: 0.2
    },
    label: {
      show: false,
      formatter: link.type
    },
    linkData: link
  }))

  const option = {
    title: {
      text: '标签依赖关系网络',
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        if (params.dataType === 'node') {
          const tag = params.data.tagData
          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; font-size: 14px; margin-bottom: 6px;">${tag.name}</div>
              <div>编码: ${tag.code}</div>
              <div>类型: ${tag.type}</div>
              <div>数据源: ${tag.dataSource}</div>
              <div>更新时间: ${tag.lastUpdateTime}</div>
            </div>
          `
        } else if (params.dataType === 'edge') {
          const link = params.data.linkData
          return `
            <div style="padding: 8px;">
              <div>依赖类型: ${link.type}</div>
              <div>依赖强度: ${link.strength}</div>
            </div>
          `
        }
        return ''
      }
    },
    legend: [
      {
        data: ['计算依赖', '业务依赖', '数据依赖'],
        orient: 'vertical',
        left: 10,
        top: 50,
        textStyle: {
          fontSize: 12
        },
        icon: 'rect'
      }
    ],
    series: [
      {
        type: 'graph',
        layout: layoutType.value === 'force' ? 'force' : 'circular',
        data: nodes,
        links: links,
        roam: true,
        draggable: true,
        focusNodeAdjacency: true,
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2
        },
        lineStyle: {
          opacity: 0.8
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: {
            width: 4
          }
        },
        force: {
          repulsion: 200,
          edgeLength: 150,
          gravity: 0.1
        },
        label: {
          show: true,
          position: 'bottom',
          fontSize: 12
        }
      }
    ]
  }

  chartInstance.value.setOption(option)

  // 点击节点事件
  chartInstance.value.on('click', (params: any) => {
    if (params.dataType === 'node') {
      showTagDetail(params.data.tagData)
    }
  })

  // 窗口自适应
  window.addEventListener('resize', () => {
    chartInstance.value?.resize()
  })
}

const refreshChart = async () => {
  loading.value = true
  ElMessage.info('正在刷新依赖关系图...')

  await new Promise((resolve) => setTimeout(resolve, 1000))

  if (chartInstance.value) {
    chartInstance.value.dispose()
  }
  initChart()

  loading.value = false
  ElMessage.success('依赖关系图已刷新')
}

const switchLayout = () => {
  layoutType.value = layoutType.value === 'force' ? 'hierarchy' : 'force'
  refreshChart()
  ElMessage.success(`已切换为${layoutType.value === 'force' ? '力导向' : '层次'}布局`)
}

const resetView = () => {
  chartInstance.value?.dispatchAction({
    type: 'restore'
  })
  ElMessage.success('视图已重置')
}

// ==================== 搜索与定位 ====================
const searchTag = async () => {
  if (!searchKeyword.value) {
    ElMessage.warning('请输入搜索关键词')
    return
  }

  loading.value = true
  await new Promise((resolve) => setTimeout(resolve, 500))

  const results = filteredTags.value
  if (results.length === 0) {
    ElMessage.warning('未找到匹配的标签')
    loading.value = false
    return
  }

  // 高亮第一个匹配的节点
  chartInstance.value?.dispatchAction({
    type: 'highlight',
    dataType: 'node',
    name: results[0].name
  })

  // 定位到节点
  chartInstance.value?.dispatchAction({
    type: 'showTip',
    dataType: 'node',
    name: results[0].name
  })

  loading.value = false
  ElMessage.success(`找到 ${results.length} 个匹配标签，已定位到: ${results[0].name}`)
}

const clearSearch = () => {
  searchKeyword.value = ''
  chartInstance.value?.dispatchAction({
    type: 'downplay'
  })
  ElMessage.success('已清除搜索')
}

// ==================== 依赖路径分析 ====================
const analyzePathDialog = () => {
  if (selectedTags.value.length !== 2) {
    ElMessage.warning('请在图中选择两个标签进行路径分析')
    ElNotification({
      title: '操作提示',
      message: '先搜索并选中两个标签，然后点击路径分析',
      type: 'info',
      duration: 3000
    })
    return
  }
  analyzePath()
}

const analyzePath = async () => {
  loading.value = true
  ElMessage.info('正在分析依赖路径...')

  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Mock 路径分析结果
  pathAnalysisResult.value = {
    path: ['用户活跃度', '流失风险', '个性化推荐'],
    steps: [
      { from: '用户活跃度', to: '流失风险', relationship: '计算依赖（强）' },
      { from: '流失风险', to: '个性化推荐', relationship: '计算依赖（弱）' }
    ],
    impactScope: '该路径涉及3个标签，影响范围包括用户流失预警、精准营销等5个业务场景'
  }

  loading.value = false
  pathDialogVisible.value = true
  ElMessage.success('路径分析完成')
}

// ==================== 冲突与循环检测 ====================
const detectConflict = async () => {
  loading.value = true
  ElMessage.info('正在检测依赖冲突...')

  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Mock 冲突报告
  conflictReport.value = {
    cycleGroups: [
      ['用户活跃度', '流失风险', '营销响应度'],
      ['购买频次', '高价值客户']
    ],
    duplicateDependencies: [
      ['用户活跃度 → 流失风险', '用户活跃度 → 个性化推荐'],
      ['客单价 → 高价值客户', '消费能力 → 高价值客户']
    ],
    isolatedTags: ['独立标签A', '孤立标签B']
  }

  loading.value = false
  conflictDialogVisible.value = true
  ElMessage.success('冲突检测完成')
}

// ==================== 详情面板 ====================
const showTagDetail = (tag: TagNode) => {
  currentTagDetail.value = tag
  drawerVisible.value = true
}

const getUpstreamTags = (tagId: string) => {
  const upstreamIds = mockLinks.value.filter((link) => link.target === tagId).map((link) => link.source)
  return mockTags.value.filter((tag) => upstreamIds.includes(tag.id))
}

const getDownstreamTags = (tagId: string) => {
  const downstreamIds = mockLinks.value.filter((link) => link.source === tagId).map((link) => link.target)
  return mockTags.value.filter((tag) => downstreamIds.includes(tag.id))
}

const jumpToTag = (tagId: string) => {
  const tag = mockTags.value.find((t) => t.id === tagId)
  if (tag) {
    drawerVisible.value = false
    chartInstance.value?.dispatchAction({
      type: 'highlight',
      dataType: 'node',
      name: tag.name
    })
    chartInstance.value?.dispatchAction({
      type: 'showTip',
      dataType: 'node',
      name: tag.name
    })
    ElMessage.success(`已定位到标签: ${tag.name}`)
  }
}

// ==================== 导出与报告 ====================
const exportDependencyGraph = async () => {
  loading.value = true
  ElMessage.info('正在导出依赖图...')

  await new Promise((resolve) => setTimeout(resolve, 1500))

  // 模拟导出
  const url = chartInstance.value?.getDataURL({
    type: 'png',
    pixelRatio: 2,
    backgroundColor: '#fff'
  })

  if (url) {
    const link = document.createElement('a')
    link.href = url
    link.download = `标签依赖关系图_${new Date().getTime()}.png`
    link.click()
  }

  loading.value = false
  ElMessage.success('依赖图已导出')
}

const generateReport = async () => {
  loading.value = true
  ElMessage.info('正在生成分析报告...')

  await new Promise((resolve) => setTimeout(resolve, 2000))

  const report = {
    totalTags: mockTags.value.length,
    totalLinks: mockLinks.value.length,
    mainDependencyChain: '用户活跃度 → 流失风险 → 个性化推荐',
    riskTags: ['流失风险', '营销响应度'],
    isolatedTags: 0,
    conflictCount: 2
  }

  loading.value = false

  ElNotification({
    title: '依赖分析报告',
    dangerouslyUseHTMLString: true,
    message: `
      <div>
        <p>标签总数: <strong>${report.totalTags}</strong></p>
        <p>依赖关系数: <strong>${report.totalLinks}</strong></p>
        <p>主要依赖链路: <strong>${report.mainDependencyChain}</strong></p>
        <p>风险标签: <strong>${report.riskTags.join(', ')}</strong></p>
        <p>孤立标签: <strong>${report.isolatedTags}</strong></p>
        <p>检测到冲突: <strong>${report.conflictCount}</strong></p>
      </div>
    `,
    type: 'success',
    duration: 8000
  })

  ElMessage.success('分析报告已生成')
}

// ==================== 生命周期 ====================
onMounted(async () => {
  loading.value = true
  await new Promise((resolve) => setTimeout(resolve, 1000))
  await nextTick()
  initChart()
  loading.value = false
  ElMessage.success('依赖关系图加载完成')
})
</script>

<template>
  <div class="tag-dependency-container">
    <!-- 顶部操作栏 -->
    <el-card class="operation-bar" shadow="hover">
      <el-row :gutter="16" align="middle">
        <el-col :span="8">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索标签名称、编码或类型"
            clearable
            @keyup.enter="searchTag"
            @clear="clearSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select v-model="dependencyLevel" placeholder="依赖层级">
            <el-option label="直接依赖" value="direct" />
            <el-option label="间接依赖" value="indirect" />
          </el-select>
        </el-col>
        <el-col :span="12">
          <div class="button-group">
            <el-button type="primary" @click="searchTag" :loading="loading">搜索定位</el-button>
            <el-button @click="switchLayout">切换布局</el-button>
            <el-button @click="resetView">重置视图</el-button>
            <el-button @click="refreshChart" :loading="loading">刷新</el-button>
          </div>
        </el-col>
      </el-row>

      <el-divider style="margin: 16px 0" />

      <el-row :gutter="16">
        <el-col :span="24">
          <div class="button-group">
            <el-button type="warning" @click="analyzePathDialog">路径分析</el-button>
            <el-button type="danger" @click="detectConflict" :loading="loading">检测冲突</el-button>
            <el-button type="success" @click="exportDependencyGraph" :loading="loading">导出依赖图</el-button>
            <el-button type="info" @click="generateReport" :loading="loading">生成报告</el-button>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 依赖关系图展示区 -->
    <el-card class="chart-container-card" shadow="hover">
      <div ref="chartContainer" class="chart-container" v-loading="loading"></div>
    </el-card>

    <!-- 标签详情 Drawer -->
    <el-drawer v-model="drawerVisible" title="标签详情" size="500px" direction="rtl">
      <div v-if="currentTagDetail" class="detail-content">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="标签名称">
            <el-tag type="primary" size="large">{{ currentTagDetail.name }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="标签编码">
            <code>{{ currentTagDetail.code }}</code>
          </el-descriptions-item>
          <el-descriptions-item label="标签类型">
            <el-tag>{{ currentTagDetail.type }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="数据源">
            {{ currentTagDetail.dataSource }}
          </el-descriptions-item>
          <el-descriptions-item label="描述">
            {{ currentTagDetail.description }}
          </el-descriptions-item>
          <el-descriptions-item label="计算逻辑">
            <code class="calculation-logic">{{ currentTagDetail.calculationLogic }}</code>
          </el-descriptions-item>
          <el-descriptions-item label="最后更新时间">
            {{ currentTagDetail.lastUpdateTime }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentTagDetail.status === '正常' ? 'success' : 'danger'">
              {{ currentTagDetail.status }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="影响说明">
            {{ currentTagDetail.impact }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">上游依赖标签</el-divider>
        <div class="tag-list">
          <el-tag
            v-for="tag in getUpstreamTags(currentTagDetail.id)"
            :key="tag.id"
            class="tag-item"
            type="info"
            @click="jumpToTag(tag.id)"
            style="cursor: pointer"
          >
            {{ tag.name }}
          </el-tag>
          <el-empty v-if="getUpstreamTags(currentTagDetail.id).length === 0" description="无上游依赖" :image-size="80" />
        </div>

        <el-divider content-position="left">下游依赖标签</el-divider>
        <div class="tag-list">
          <el-tag
            v-for="tag in getDownstreamTags(currentTagDetail.id)"
            :key="tag.id"
            class="tag-item"
            type="success"
            @click="jumpToTag(tag.id)"
            style="cursor: pointer"
          >
            {{ tag.name }}
          </el-tag>
          <el-empty v-if="getDownstreamTags(currentTagDetail.id).length === 0" description="无下游依赖" :image-size="80" />
        </div>
      </div>
    </el-drawer>

    <!-- 冲突检测报告 Dialog -->
    <el-dialog v-model="conflictDialogVisible" title="依赖冲突检测报告" width="700px">
      <div v-if="conflictReport" class="conflict-report">
        <el-alert title="检测到依赖问题" type="warning" :closable="false" style="margin-bottom: 16px">
          <template #default>
            发现 {{ conflictReport.cycleGroups.length }} 个循环依赖组、
            {{ conflictReport.duplicateDependencies.length }} 个重复依赖、
            {{ conflictReport.isolatedTags.length }} 个孤立标签
          </template>
        </el-alert>

        <el-card shadow="never" class="report-section">
          <template #header>
            <span style="font-weight: bold">循环依赖组</span>
          </template>
          <div v-for="(group, index) in conflictReport.cycleGroups" :key="index" class="cycle-group">
            <el-tag type="danger" effect="dark">循环 {{ index + 1 }}</el-tag>
            <span class="cycle-path">{{ group.join(' → ') }} → {{ group[0] }}</span>
          </div>
        </el-card>

        <el-card shadow="never" class="report-section">
          <template #header>
            <span style="font-weight: bold">重复依赖</span>
          </template>
          <div v-for="(deps, index) in conflictReport.duplicateDependencies" :key="index" class="duplicate-deps">
            <el-tag type="warning">重复 {{ index + 1 }}</el-tag>
            <ul>
              <li v-for="(dep, i) in deps" :key="i">{{ dep }}</li>
            </ul>
          </div>
        </el-card>

        <el-card shadow="never" class="report-section">
          <template #header>
            <span style="font-weight: bold">孤立标签</span>
          </template>
          <div class="isolated-tags">
            <el-tag v-for="(tag, index) in conflictReport.isolatedTags" :key="index" type="info" class="tag-item">
              {{ tag }}
            </el-tag>
            <el-empty v-if="conflictReport.isolatedTags.length === 0" description="无孤立标签" :image-size="80" />
          </div>
        </el-card>
      </div>
      <template #footer>
        <el-button @click="conflictDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="exportDependencyGraph">导出报告</el-button>
      </template>
    </el-dialog>

    <!-- 路径分析 Dialog -->
    <el-dialog v-model="pathDialogVisible" title="依赖路径分析" width="600px">
      <div v-if="pathAnalysisResult" class="path-analysis">
        <el-alert title="路径分析完成" type="success" :closable="false" style="margin-bottom: 16px">
          <template #default>
            找到最短依赖路径，共 {{ pathAnalysisResult.path.length }} 个标签节点
          </template>
        </el-alert>

        <el-card shadow="never" class="report-section">
          <template #header>
            <span style="font-weight: bold">依赖路径</span>
          </template>
          <div class="path-display">
            <el-tag
              v-for="(tag, index) in pathAnalysisResult.path"
              :key="index"
              :type="index === 0 ? 'success' : index === pathAnalysisResult.path.length - 1 ? 'danger' : 'info'"
              size="large"
              effect="dark"
            >
              {{ tag }}
            </el-tag>
          </div>
        </el-card>

        <el-card shadow="never" class="report-section">
          <template #header>
            <span style="font-weight: bold">路径步骤</span>
          </template>
          <el-steps direction="vertical" :active="pathAnalysisResult.steps.length">
            <el-step
              v-for="(step, index) in pathAnalysisResult.steps"
              :key="index"
              :title="`${step.from} → ${step.to}`"
              :description="step.relationship"
            />
          </el-steps>
        </el-card>

        <el-card shadow="never" class="report-section">
          <template #header>
            <span style="font-weight: bold">影响范围</span>
          </template>
          <p>{{ pathAnalysisResult.impactScope }}</p>
        </el-card>
      </div>
      <template #footer>
        <el-button @click="pathDialogVisible = false">关闭</el-button>
        <el-button type="primary">保存路径</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.tag-dependency-container {
  height: calc(100vh - 100px);
  overflow-y: auto;
}

.operation-bar {
  margin-bottom: 20px;

  .button-group {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
}

.chart-container-card {
  height: calc(100vh - 300px);
  min-height: 600px;
}

.chart-container {
  width: 100%;
  height: 100%;
  min-height: 550px;
}

.detail-content {
  .calculation-logic {
    display: block;
    background: #f5f7fa;
    padding: 8px;
    border-radius: 4px;
    font-size: 12px;
    word-break: break-all;
  }

  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;

    .tag-item {
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        transform: scale(1.1);
      }
    }
  }
}

.conflict-report,
.path-analysis {
  .report-section {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .cycle-group {
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 12px;

    .cycle-path {
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: #606266;
    }
  }

  .duplicate-deps {
    margin-bottom: 12px;

    ul {
      margin: 8px 0 0 30px;
      padding: 0;

      li {
        list-style-type: disc;
        color: #606266;
        font-size: 13px;
        margin: 4px 0;
      }
    }
  }

  .isolated-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .path-display {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;

    .el-tag {
      position: relative;

      &:not(:last-child)::after {
        content: '→';
        position: absolute;
        right: -10px;
        top: 50%;
        transform: translateY(-50%);
        color: #909399;
        font-size: 16px;
      }
    }
  }
}

code {
  color: #e6a23c;
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

:deep(.el-card__header) {
  padding: 16px;
  background: #fafafa;
}

:deep(.el-descriptions__label) {
  width: 120px;
  font-weight: 500;
}

:deep(.el-drawer__header) {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-divider__text) {
  font-weight: 500;
  color: #303133;
}

:deep(.el-steps) {
  .el-step__title {
    font-size: 14px;
    font-weight: 500;
  }

  .el-step__description {
    font-size: 12px;
    color: #909399;
  }
}

// 响应式布局
@media (max-width: 768px) {
  .operation-bar {
    .el-row {
      .el-col {
        margin-bottom: 12px;
      }
    }

    .button-group {
      justify-content: flex-start;
    }
  }

  .chart-container-card {
    height: 500px;
  }
}

// 加载动画优化
:deep(.el-loading-mask) {
  background-color: rgba(255, 255, 255, 0.9);
}

// 滚动条样式
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 4px;

  &:hover {
    background: #c0c4cc;
  }
}

::-webkit-scrollbar-track {
  background: #f5f7fa;
}
</style>
