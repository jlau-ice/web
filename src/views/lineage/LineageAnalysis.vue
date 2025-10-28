<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

// 定义血缘节点接口
interface LineageNode {
  id: string
  name: string
  type: string
  businessDomain: string
  layer: string
  description: string
  fields?: string[]
  updateTime: string
  status: string
  children?: LineageNode[]
}

// 定义血缘关系接口
interface LineageRelation {
  id: number
  sourceName: string
  targetName: string
  relationType: string
  transformRule: string
  updateTime: string
}

// 定义影响分析结果接口
interface ImpactAnalysis {
  node: string
  layer: string
  impactType: string
  affectedNodes: string[]
  riskLevel: string
}

// 搜索表单
const searchForm = reactive({
  keyword: '',
  entityType: '',
  businessDomain: '',
  layer: ''
})

// 当前选中的节点
const selectedNode = ref<LineageNode | null>(null)
const selectedNodePath = ref<string[]>([])

// 影响分析结果
const impactResult = ref<ImpactAnalysis | null>(null)

// 视图模式：tree | table | graph
const viewMode = ref('graph')

// 树形数据
const treeData = ref<LineageNode[]>([])

// 表格数据
const tableData = ref<LineageRelation[]>([])

// ECharts 实例
const chartRef = ref<HTMLDivElement>()
let chartInstance: echarts.ECharts | null = null

// 加载状态
const loading = ref(false)

// 详情弹窗
const detailDialogVisible = ref(false)

// 影响分析弹窗
const impactDialogVisible = ref(false)

// Mock 数据 - 血缘树结构
const mockLineageTree: LineageNode[] = [
  {
    id: 'source_001',
    name: '农户基础信息表',
    type: '数据表',
    businessDomain: '基础数据',
    layer: '源数据层',
    description: '存储农户的基本信息，包括姓名、联系方式、地址等',
    fields: ['farmer_id', 'farmer_name', 'phone', 'address', 'register_date'],
    updateTime: '2024-03-28 09:00:00',
    status: '正常',
    children: [
      {
        id: 'middle_001',
        name: '农户种植统计表',
        type: '数据表',
        businessDomain: '统计分析',
        layer: '中间层',
        description: '统计每个农户的种植情况汇总',
        fields: ['farmer_id', 'total_area', 'crop_types', 'yield_amount'],
        updateTime: '2024-03-28 10:00:00',
        status: '正常',
        children: [
          {
            id: 'app_001',
            name: '农业生产报表',
            type: '数据应用',
            businessDomain: '报表分析',
            layer: '应用层',
            description: '展示农业生产的综合数据报表',
            fields: ['report_id', 'report_date', 'total_farmers', 'total_production'],
            updateTime: '2024-03-28 11:00:00',
            status: '正常'
          }
        ]
      }
    ]
  },
  {
    id: 'source_002',
    name: '种植记录表',
    type: '数据表',
    businessDomain: '业务数据',
    layer: '源数据层',
    description: '记录每次种植活动的详细信息',
    fields: ['record_id', 'farmer_id', 'crop_name', 'planting_date', 'planting_area'],
    updateTime: '2024-03-28 09:15:00',
    status: '正常',
    children: [
      {
        id: 'middle_001',
        name: '农户种植统计表',
        type: '数据表',
        businessDomain: '统计分析',
        layer: '中间层',
        description: '统计每个农户的种植情况汇总',
        fields: ['farmer_id', 'total_area', 'crop_types', 'yield_amount'],
        updateTime: '2024-03-28 10:00:00',
        status: '正常',
        children: [
          {
            id: 'app_001',
            name: '农业生产报表',
            type: '数据应用',
            businessDomain: '报表分析',
            layer: '应用层',
            description: '展示农业生产的综合数据报表',
            fields: ['report_id', 'report_date', 'total_farmers', 'total_production'],
            updateTime: '2024-03-28 11:00:00',
            status: '正常'
          }
        ]
      },
      {
        id: 'middle_002',
        name: '作物产量分析表',
        type: '数据表',
        businessDomain: '统计分析',
        layer: '中间层',
        description: '按作物类型统计产量信息',
        fields: ['crop_name', 'total_area', 'avg_yield', 'total_yield'],
        updateTime: '2024-03-28 10:30:00',
        status: '正常',
        children: [
          {
            id: 'app_002',
            name: '作物收益分析报告',
            type: '数据应用',
            businessDomain: '决策支持',
            layer: '应用层',
            description: '分析不同作物的收益情况',
            fields: ['crop_name', 'revenue', 'cost', 'profit_rate'],
            updateTime: '2024-03-28 12:00:00',
            status: '正常'
          }
        ]
      }
    ]
  },
  {
    id: 'source_003',
    name: '农产品质量检测表',
    type: '数据表',
    businessDomain: '质量管理',
    layer: '源数据层',
    description: '记录农产品质量检测结果',
    fields: ['test_id', 'product_id', 'test_date', 'test_result', 'quality_grade'],
    updateTime: '2024-03-28 09:30:00',
    status: '正常',
    children: [
      {
        id: 'middle_003',
        name: '质量合格率统计表',
        type: '数据表',
        businessDomain: '质量分析',
        layer: '中间层',
        description: '统计各类农产品的质量合格率',
        fields: ['product_type', 'total_tests', 'pass_count', 'pass_rate'],
        updateTime: '2024-03-28 11:00:00',
        status: '正常',
        children: [
          {
            id: 'app_003',
            name: '质量监控看板',
            type: '数据应用',
            businessDomain: '质量管理',
            layer: '应用层',
            description: '实时监控农产品质量状况',
            fields: ['dashboard_date', 'overall_pass_rate', 'alert_count'],
            updateTime: '2024-03-28 13:00:00',
            status: '正常'
          }
        ]
      }
    ]
  },
  {
    id: 'source_004',
    name: '农资使用记录表',
    type: '数据表',
    businessDomain: '业务数据',
    layer: '源数据层',
    description: '记录化肥、农药等农资的使用情况',
    fields: ['use_id', 'farmer_id', 'material_type', 'quantity', 'use_date'],
    updateTime: '2024-03-28 09:45:00',
    status: '正常',
    children: [
      {
        id: 'middle_004',
        name: '农资消耗汇总表',
        type: '数据表',
        businessDomain: '成本分析',
        layer: '中间层',
        description: '汇总各类农资的消耗情况',
        fields: ['material_type', 'total_quantity', 'total_cost', 'avg_cost'],
        updateTime: '2024-03-28 11:30:00',
        status: '正常',
        children: [
          {
            id: 'app_004',
            name: '成本分析报告',
            type: '数据应用',
            businessDomain: '财务分析',
            layer: '应用层',
            description: '分析农业生产成本构成',
            fields: ['cost_type', 'amount', 'percentage', 'trend'],
            updateTime: '2024-03-28 14:00:00',
            status: '正常'
          }
        ]
      }
    ]
  }
]

// Mock 数据 - 血缘关系表
const mockLineageRelations: LineageRelation[] = [
  {
    id: 1,
    sourceName: '农户基础信息表',
    targetName: '农户种植统计表',
    relationType: '字段映射',
    transformRule: 'farmer_id = farmer_id',
    updateTime: '2024-03-28 10:00:00'
  },
  {
    id: 2,
    sourceName: '种植记录表',
    targetName: '农户种植统计表',
    relationType: '聚合统计',
    transformRule: 'GROUP BY farmer_id, SUM(planting_area) AS total_area',
    updateTime: '2024-03-28 10:00:00'
  },
  {
    id: 3,
    sourceName: '农户种植统计表',
    targetName: '农业生产报表',
    relationType: '汇总计算',
    transformRule: 'COUNT(DISTINCT farmer_id) AS total_farmers',
    updateTime: '2024-03-28 11:00:00'
  },
  {
    id: 4,
    sourceName: '种植记录表',
    targetName: '作物产量分析表',
    relationType: '分组统计',
    transformRule: 'GROUP BY crop_name, SUM(planting_area) AS total_area',
    updateTime: '2024-03-28 10:30:00'
  },
  {
    id: 5,
    sourceName: '作物产量分析表',
    targetName: '作物收益分析报告',
    relationType: '关联计算',
    transformRule: 'JOIN price_table ON crop_name, CALCULATE revenue',
    updateTime: '2024-03-28 12:00:00'
  },
  {
    id: 6,
    sourceName: '农产品质量检测表',
    targetName: '质量合格率统计表',
    relationType: '聚合统计',
    transformRule: 'GROUP BY product_type, AVG(pass_rate)',
    updateTime: '2024-03-28 11:00:00'
  },
  {
    id: 7,
    sourceName: '质量合格率统计表',
    targetName: '质量监控看板',
    relationType: '实时更新',
    transformRule: 'REAL_TIME SYNC, CALCULATE overall_pass_rate',
    updateTime: '2024-03-28 13:00:00'
  },
  {
    id: 8,
    sourceName: '农资使用记录表',
    targetName: '农资消耗汇总表',
    relationType: '分组汇总',
    transformRule: 'GROUP BY material_type, SUM(quantity) AS total_quantity',
    updateTime: '2024-03-28 11:30:00'
  },
  {
    id: 9,
    sourceName: '农资消耗汇总表',
    targetName: '成本分析报告',
    relationType: '成本计算',
    transformRule: 'JOIN cost_rate_table, CALCULATE total_cost',
    updateTime: '2024-03-28 14:00:00'
  }
]

// 实体类型选项
const entityTypeOptions = [
  { label: '全部', value: '' },
  { label: '数据表', value: '数据表' },
  { label: '数据应用', value: '数据应用' }
]

// 业务域选项
const businessDomainOptions = [
  { label: '全部', value: '' },
  { label: '基础数据', value: '基础数据' },
  { label: '业务数据', value: '业务数据' },
  { label: '统计分析', value: '统计分析' },
  { label: '质量管理', value: '质量管理' },
  { label: '成本分析', value: '成本分析' },
  { label: '报表分析', value: '报表分析' },
  { label: '决策支持', value: '决策支持' },
  { label: '财务分析', value: '财务分析' }
]

// 数据层选项
const layerOptions = [
  { label: '全部', value: '' },
  { label: '源数据层', value: '源数据层' },
  { label: '中间层', value: '中间层' },
  { label: '应用层', value: '应用层' }
]

// 节点类型颜色映射
const nodeTypeColorMap: Record<string, string> = {
  '数据表': 'primary',
  '数据应用': 'success'
}

// 层级颜色映射
const layerColorMap: Record<string, string> = {
  '源数据层': 'info',
  '中间层': 'warning',
  '应用层': 'danger'
}

// 过滤树节点
const filterNode = (value: string, data: LineageNode) => {
  if (!value) return true
  const keyword = value.toLowerCase()
  return data.name.toLowerCase().includes(keyword) ||
    data.description.toLowerCase().includes(keyword) ||
    data.businessDomain.toLowerCase().includes(keyword)
}

// 计算过滤后的树数据
const filteredTreeData = computed(() => {
  let data = JSON.parse(JSON.stringify(mockLineageTree)) as LineageNode[]

  // 递归过滤函数
  const filterNodes = (nodes: LineageNode[]): LineageNode[] => {
    return nodes.filter(node => {
      let match = true

      if (searchForm.entityType && node.type !== searchForm.entityType) {
        match = false
      }

      if (searchForm.businessDomain && node.businessDomain !== searchForm.businessDomain) {
        match = false
      }

      if (searchForm.layer && node.layer !== searchForm.layer) {
        match = false
      }

      if (node.children && node.children.length > 0) {
        node.children = filterNodes(node.children)
        // 如果子节点有匹配的，父节点也显示
        if (node.children.length > 0) {
          match = true
        }
      }

      return match
    })
  }

  return filterNodes(data)
})

// 将树形数据转换为 ECharts 图数据
const convertToGraphData = (nodes: LineageNode[]) => {
  const graphNodes: any[] = []
  const graphLinks: any[] = []
  const nodeIdSet = new Set<string>() // 用于去重

  const traverse = (nodeList: LineageNode[], parentId?: string) => {
    nodeList.forEach(node => {
      // 只在节点不存在时添加
      if (!nodeIdSet.has(node.id)) {
        nodeIdSet.add(node.id)
        graphNodes.push({
          id: node.id,
          name: node.name,
          category: node.layer === '源数据层' ? 0 : node.layer === '中间层' ? 1 : 2,
          symbolSize: 60,
          itemStyle: {
            color: node.layer === '源数据层' ? '#409EFF' :
              node.layer === '中间层' ? '#E6A23C' : '#67C23A'
          },
          label: {
            show: true,
            fontSize: 12
          },
          value: node
        })
      }

      // 添加连接线（即使节点已存在，连接线也要添加）
      if (parentId) {
        // 避免重复的连接线
        const linkKey = `${parentId}-${node.id}`
        const existingLink = graphLinks.find(link => 
          `${link.source}-${link.target}` === linkKey
        )
        if (!existingLink) {
          graphLinks.push({
            source: parentId,
            target: node.id,
            lineStyle: {
              curveness: 0.2
            }
          })
        }
      }

      // 递归处理子节点
      if (node.children && node.children.length > 0) {
        traverse(node.children, node.id)
      }
    })
  }

  traverse(nodes)

  return { nodes: graphNodes, links: graphLinks }
}

// 初始化 ECharts
const initChart = () => {
  if (!chartRef.value) {
    console.warn('chartRef is not ready')
    return
  }

  if (chartInstance) {
    chartInstance.dispose()
  }

  chartInstance = echarts.init(chartRef.value)

  const { nodes, links } = convertToGraphData(treeData.value)

  console.log('Graph data:', { nodes, links }) // 调试日志

  if (nodes.length === 0) {
    console.warn('No nodes to display')
    return
  }

  const option: EChartsOption = {
    title: {
      text: '数据血缘关系图',
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 16,
        fontWeight: 600
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        if (params.dataType === 'node') {
          const node = params.data.value
          return `
            <div style="padding: 8px;">
              <strong>${node.name}</strong><br/>
              类型: ${node.type}<br/>
              数据层: ${node.layer}<br/>
              业务域: ${node.businessDomain}
            </div>
          `
        }
        return ''
      }
    },
    legend: [{
      data: ['源数据层', '中间层', '应用层'],
      orient: 'vertical',
      right: 10,
      top: 50
    }],
    series: [{
      type: 'graph',
      layout: 'force',
      data: nodes,
      links: links,
      categories: [
        { name: '源数据层' },
        { name: '中间层' },
        { name: '应用层' }
      ],
      roam: true,
      draggable: true,
      focusNodeAdjacency: true,
      label: {
        show: true,
        position: 'bottom',
        fontSize: 11,
        formatter: '{b}'
      },
      lineStyle: {
        color: 'source',
        curveness: 0.3,
        width: 2
      },
      emphasis: {
        focus: 'adjacency',
        lineStyle: {
          width: 4
        },
        label: {
          fontSize: 13,
          fontWeight: 'bold'
        }
      },
      force: {
        repulsion: 300,
        gravity: 0.1,
        edgeLength: [100, 200],
        layoutAnimation: true
      }
    }]
  }

  chartInstance.setOption(option)
  console.log('Chart initialized successfully')

  // 监听点击事件
  chartInstance.on('click', (params: any) => {
    if (params.dataType === 'node') {
      handleNodeClick(params.data.value)
    }
  })
}

// 加载数据
const loadData = () => {
  loading.value = true

  setTimeout(() => {
    treeData.value = filteredTreeData.value
    tableData.value = mockLineageRelations
    loading.value = false

    // 初始化图表 - 确保 loading 状态解除后再初始化
    nextTick(() => {
      setTimeout(() => {
        initChart()
      }, 100)
    })
  }, 500)
}

// 搜索
const handleSearch = () => {
  loadData()
  ElMessage.success('查询完成')
}

// 重置
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.entityType = ''
  searchForm.businessDomain = ''
  searchForm.layer = ''
  selectedNode.value = null
  impactResult.value = null
  loadData()
}

// 树节点点击
const handleNodeClick = (data: LineageNode) => {
  selectedNode.value = data

  // 计算节点路径
  const findPath = (nodes: LineageNode[], target: string, path: string[] = []): string[] | null => {
    for (const node of nodes) {
      const newPath = [...path, node.name]
      if (node.id === target) {
        return newPath
      }
      if (node.children) {
        const result = findPath(node.children, target, newPath)
        if (result) return result
      }
    }
    return null
  }

  const path = findPath(mockLineageTree, data.id)
  selectedNodePath.value = path || []

  ElMessage.info(`已选中：${data.name}`)
}

// 查看详情
const handleViewDetail = (node?: LineageNode) => {
  if (node) {
    selectedNode.value = node
  }
  if (!selectedNode.value) {
    ElMessage.warning('请先选择一个节点')
    return
  }
  detailDialogVisible.value = true
}

// 影响分析
const handleImpactAnalysis = (node?: LineageNode) => {
  if (node) {
    selectedNode.value = node
  }
  if (!selectedNode.value) {
    ElMessage.warning('请先选择一个节点')
    return
  }

  loading.value = true

  setTimeout(() => {
    // 收集所有下游节点
    const collectDownstream = (node: LineageNode): string[] => {
      let downstream: string[] = []
      if (node.children) {
        for (const child of node.children) {
          downstream.push(child.name)
          downstream = downstream.concat(collectDownstream(child))
        }
      }
      return downstream
    }

    const affectedNodes = collectDownstream(selectedNode.value!)
    const riskLevel = affectedNodes.length > 5 ? '高' : affectedNodes.length > 2 ? '中' : '低'

    impactResult.value = {
      node: selectedNode.value!.name,
      layer: selectedNode.value!.layer,
      impactType: '数据变更影响',
      affectedNodes: affectedNodes,
      riskLevel: riskLevel
    }

    loading.value = false
    impactDialogVisible.value = true
    ElMessage.success('影响分析完成')
  }, 800)
}

// 重置图表视图
const resetChart = () => {
  if (chartInstance) {
    initChart()
    ElMessage.success('图表已重置')
  }
}

// 切换布局
const switchLayout = (layout: string) => {
  if (!chartInstance) return

  const option = chartInstance.getOption()
  if (option.series && option.series[0]) {
    ; (option.series[0] as any).layout = layout
    chartInstance.setOption(option)
    ElMessage.success(`已切换为${layout === 'force' ? '力导向' : '环形'}布局`)
  }
}

// 窗口大小变化时重新渲染图表
const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

// 初始化
onMounted(() => {
  // 确保 DOM 完全渲染后再初始化图表
  nextTick(() => {
    loadData()
  })

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
})

// 组件卸载时清理
onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
    <div class="lineage-analysis-container">
        <!-- 页面标题 -->
        <el-card class="header-card" shadow="never">
            <div class="page-header">
                <div class="header-content">
                    <h2 class="page-title">数据血缘分析</h2>
                    <p class="page-description">可视化展示数据从源头到最终消费端的完整流转路径，支持溯源和影响分析</p>
                </div>
            </div>
        </el-card>
    
        <!-- 搜索筛选区域 -->
        <el-card class="search-card" shadow="never">
            <el-form :model="searchForm" label-width="80px">
                <el-row :gutter="20">
                    <el-col :span="5">
                        <el-form-item label="关键字">
                            <el-input v-model="searchForm.keyword" placeholder="表名/字段名" clearable
                                @keyup.enter="handleSearch" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="5">
                        <el-form-item label="实体类型">
                            <el-select v-model="searchForm.entityType" placeholder="请选择类型" clearable style="width: 100%">
                                <el-option v-for="type in entityTypeOptions" :key="type.value" :label="type.label"
                                    :value="type.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="5">
                        <el-form-item label="业务域">
                            <el-select v-model="searchForm.businessDomain" placeholder="请选择业务域" clearable
                                style="width: 100%">
                                <el-option v-for="domain in businessDomainOptions" :key="domain.value" :label="domain.label"
                                    :value="domain.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="5">
                        <el-form-item label="数据层">
                            <el-select v-model="searchForm.layer" placeholder="请选择数据层" clearable style="width: 100%">
                                <el-option v-for="layer in layerOptions" :key="layer.value" :label="layer.label"
                                    :value="layer.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="4" class="search-actions">
                        <el-button type="primary" @click="handleSearch">
                            <el-icon class="btn-icon">
                                <Search />
                            </el-icon>
                            查询血缘
                        </el-button>
                        <el-button @click="handleReset">
                            <el-icon class="btn-icon">
                                <Refresh />
                            </el-icon>
                            重置
                        </el-button>
                    </el-col>
                </el-row>
            </el-form>
        </el-card>
    
        <!-- 主内容区域 -->
        <el-row :gutter="20">
            <!-- 左侧：血缘关系图 -->
            <el-col :span="16">
                <el-card class="chart-card" shadow="never">
                    <template #header>
                        <div class="card-header">
                            <span class="card-title">数据血缘关系图（ECharts）</span>
                            <div class="card-actions">
                                <el-button size="small" @click="switchLayout('force')">
                                    <el-icon>
                                        <Connection />
                                    </el-icon>
                                    力导向
                                </el-button>
                                <el-button size="small" @click="switchLayout('circular')">
                                    <el-icon>
                                        <PieChart />
                                    </el-icon>
                                    环形布局
                                </el-button>
                                <el-button size="small" @click="resetChart">
                                    <el-icon>
                                        <RefreshRight />
                                    </el-icon>
                                    重置视图
                                </el-button>
                            </div>
                        </div>
                    </template>
    
                    <div v-loading="loading" class="chart-container">
                        <div ref="chartRef" class="echarts-graph" style="width: 100%; height: 600px;"></div>
                    </div>
    
                    <div class="chart-tips">
                        <el-alert type="info" :closable="false" show-icon>
                            <template #default>
                                <div style="font-size: 12px;">
                                    <strong>操作提示：</strong>
                                    点击节点查看详情 | 拖拽节点调整位置 | 滚轮缩放 | 拖拽空白区域平移
                                </div>
                            </template>
                        </el-alert>
                    </div>
                </el-card>
            </el-col>
    
            <!-- 右侧：选中节点信息 -->
            <el-col :span="8">
                <el-card class="info-card" shadow="never">
                    <template #header>
                        <span class="card-title">节点信息</span>
                    </template>
    
                    <div v-if="selectedNode" class="node-detail">
                        <div class="detail-item">
                            <label>节点名称：</label>
                            <span>{{ selectedNode.name }}</span>
                        </div>
                        <div class="detail-item">
                            <label>节点类型：</label>
                            <el-tag :type="nodeTypeColorMap[selectedNode.type]" size="small">
                                {{ selectedNode.type }}
                            </el-tag>
                        </div>
                        <div class="detail-item">
                            <label>数据层：</label>
                            <el-tag :type="layerColorMap[selectedNode.layer]" size="small">
                                {{ selectedNode.layer }}
                            </el-tag>
                        </div>
                        <div class="detail-item">
                            <label>业务域：</label>
                            <span>{{ selectedNode.businessDomain }}</span>
                        </div>
                        <div class="detail-item">
                            <label>描述：</label>
                            <span class="description">{{ selectedNode.description }}</span>
                        </div>
                        <div class="detail-item" v-if="selectedNode.fields">
                            <label>字段列表：</label>
                            <div class="field-list">
                                <el-tag v-for="field in selectedNode.fields" :key="field" size="small" style="margin: 2px">
                                    {{ field }}
                                </el-tag>
                            </div>
                        </div>
                        <div class="detail-item">
                            <label>更新时间：</label>
                            <span>{{ selectedNode.updateTime }}</span>
                        </div>
                        <div class="detail-item">
                            <label>血缘路径：</label>
                            <div class="lineage-path">
                                <template v-for="(item, index) in selectedNodePath" :key="index">
                                    <el-tag size="small" style="margin: 2px">
                                        {{ item }}
                                    </el-tag>
                                    <el-icon v-if="index < selectedNodePath.length - 1" style="margin: 0 5px">
                                        <ArrowRight />
                                    </el-icon>
                                </template>
                            </div>
                        </div>
    
                        <div class="action-buttons">
                            <el-button type="primary" size="small" @click="handleViewDetail()">
                                查看完整详情
                            </el-button>
                            <el-button type="warning" size="small" @click="handleImpactAnalysis()">
                                影响分析
                            </el-button>
                        </div>
                    </div>
    
                    <el-empty v-else description="请在左侧选择一个节点" :image-size="100" />
                </el-card>
    
                <!-- 血缘关系表 -->
                <el-card class="relation-card" shadow="never" style="margin-top: 20px">
                    <template #header>
                        <span class="card-title">血缘关系明细</span>
                    </template>
    
                    <el-table :data="tableData" stripe size="small" max-height="300">
                        <el-table-column prop="sourceName" label="源表" width="120" show-overflow-tooltip />
                        <el-table-column prop="targetName" label="目标表" width="120" show-overflow-tooltip />
                        <el-table-column prop="relationType" label="关系类型" width="100" />
                    </el-table>
                </el-card>
            </el-col>
        </el-row>
    
        <!-- 详情弹窗 -->
        <el-dialog v-model="detailDialogVisible" title="节点详细信息" width="600px">
            <div v-if="selectedNode" class="detail-dialog-content">
                <el-descriptions :column="2" border>
                    <el-descriptions-item label="节点名称" :span="2">
                        {{ selectedNode.name }}
                    </el-descriptions-item>
                    <el-descriptions-item label="节点ID">
                        {{ selectedNode.id }}
                    </el-descriptions-item>
                    <el-descriptions-item label="节点类型">
                        <el-tag :type="nodeTypeColorMap[selectedNode.type]" size="small">
                            {{ selectedNode.type }}
                        </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="数据层">
                        <el-tag :type="layerColorMap[selectedNode.layer]" size="small">
                            {{ selectedNode.layer }}
                        </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="业务域">
                        {{ selectedNode.businessDomain }}
                    </el-descriptions-item>
                    <el-descriptions-item label="状态">
                        <el-tag type="success" size="small">{{ selectedNode.status }}</el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="更新时间">
                        {{ selectedNode.updateTime }}
                    </el-descriptions-item>
                    <el-descriptions-item label="描述" :span="2">
                        {{ selectedNode.description }}
                    </el-descriptions-item>
                    <el-descriptions-item label="字段信息" :span="2" v-if="selectedNode.fields">
                        <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                            <el-tag v-for="field in selectedNode.fields" :key="field" size="small">
                                {{ field }}
                            </el-tag>
                        </div>
                    </el-descriptions-item>
                </el-descriptions>
            </div>
        </el-dialog>
    
        <!-- 影响分析弹窗 -->
        <el-dialog v-model="impactDialogVisible" title="影响分析结果" width="650px">
            <div v-if="impactResult" class="impact-dialog-content">
                <el-alert :title="`分析节点：${impactResult.node}`"
                    :type="impactResult.riskLevel === '高' ? 'error' : impactResult.riskLevel === '中' ? 'warning' : 'success'"
                    :closable="false" style="margin-bottom: 20px">
                    <template #default>
                        <div style="margin-top: 10px;">
                            <p><strong>数据层：</strong>{{ impactResult.layer }}</p>
                            <p><strong>影响类型：</strong>{{ impactResult.impactType }}</p>
                            <p><strong>风险等级：</strong>
                                <el-tag
                                    :type="impactResult.riskLevel === '高' ? 'danger' : impactResult.riskLevel === '中' ? 'warning' : 'success'">
                                    {{ impactResult.riskLevel }}
                                </el-tag>
                            </p>
                        </div>
                    </template>
                </el-alert>
    
                <el-card shadow="never">
                    <template #header>
                        <span>受影响的下游节点（共 {{ impactResult.affectedNodes.length }} 个）</span>
                    </template>
                    <div v-if="impactResult.affectedNodes.length > 0">
                        <el-tag v-for="(node, index) in impactResult.affectedNodes" :key="index" type="warning"
                            style="margin: 5px">
                            {{ node }}
                        </el-tag>
                    </div>
                    <el-empty v-else description="无下游节点" :image-size="80" />
                </el-card>
    
                <el-card shadow="never" style="margin-top: 15px">
                    <template #header>
                        <span>建议措施</span>
                    </template>
                    <ul class="suggestions">
                        <li v-if="impactResult.riskLevel === '高'">
                            <el-icon color="#F56C6C">
                                <Warning />
                            </el-icon>
                            高风险：该节点变更会影响多个下游应用，建议在变更前做好充分测试
                        </li>
                        <li v-if="impactResult.riskLevel === '中'">
                            <el-icon color="#E6A23C">
                                <Warning />
                            </el-icon>
                            中等风险：注意与下游应用团队沟通，确保变更不影响业务
                        </li>
                        <li v-if="impactResult.riskLevel === '低'">
                            <el-icon color="#67C23A">
                                <CircleCheck />
                            </el-icon>
                            低风险：影响范围较小，但仍需通知相关团队
                        </li>
                        <li>建议在测试环境中先进行验证</li>
                        <li>记录变更历史，便于问题追溯</li>
                    </ul>
                </el-card>
            </div>
        </el-dialog>
    </div>
</template>

<style scoped lang="scss">
.lineage-analysis-container {
    min-height: calc(100vh - 60px);

    .header-card {
        margin-bottom: 20px;

        .page-header {
            .header-content {
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
    }

    .search-card {
        margin-bottom: 20px;

        :deep(.el-card__body) {
            padding: 20px 20px 0 20px;
        }

        .search-actions {
            text-align: right;
            margin-bottom: 20px;

            .el-button {
                margin-left: 10px;
            }
        }
    }

    .chart-card {
        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;

            .card-title {
                font-size: 16px;
                font-weight: 600;
                color: #303133;
            }

            .card-actions {
                .el-button {
                    margin-left: 10px;
                }
            }
        }

        .chart-container {
            min-height: 600px;
            position: relative;

            .echarts-graph {
                width: 100%;
                height: 600px;
            }
        }

        .chart-tips {
            margin-top: 15px;
        }
    }

    .info-card {
        .node-detail {
            .detail-item {
                margin-bottom: 15px;

                label {
                    font-weight: 600;
                    color: #606266;
                    display: block;
                    margin-bottom: 5px;
                }

                .description {
                    color: #606266;
                    line-height: 1.6;
                }

                .field-list,
                .lineage-path {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 5px;
                }
            }

            .action-buttons {
                margin-top: 20px;
                display: flex;
                gap: 10px;

                .el-button {
                    flex: 1;
                }
            }
        }
    }

    .relation-card {
        .card-title {
            font-size: 16px;
            font-weight: 600;
            color: #303133;
        }
    }

    .btn-icon {
        margin-right: 4px;
    }

    .detail-dialog-content {
        :deep(.el-descriptions__label) {
            font-weight: 600;
        }
    }

    .impact-dialog-content {
        .suggestions {
            list-style: none;
            padding: 0;
            margin: 0;

            li {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 0;
                color: #606266;
                line-height: 1.6;

                .el-icon {
                    font-size: 16px;
                }
            }
        }
    }
}
</style>