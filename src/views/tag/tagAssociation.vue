<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, computed } from 'vue'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import type { FormInstance, FormRules } from 'element-plus'

// ==================== 类型定义 ====================
interface TagNode {
  id: string
  name: string
  code: string
  category: string
  dataType: string
  description: string
  useCount: number
  updateTime: string
  status: boolean
  symbolSize: number
}

interface TagRelation {
  id: string
  source: string
  target: string
  relationType: 'strong' | 'weak' | 'complement' | 'dependency'
  strength: number
  remark: string
  createTime: string
}

interface SearchForm {
  keyword: string
  category: string
  relationType: string
  status: string
  showLevel: 'direct' | 'all'
}

interface RelationForm {
  id: string
  mainTag: string
  relatedTags: string[]
  relationType: 'strong' | 'weak' | 'complement' | 'dependency'
  remark: string
}

interface AnalysisResult {
  tag1: string
  tag2: string
  relevance: number
  path: string[]
  commonNodes: string[]
  pathLength: number
}

// ==================== Mock 数据 ====================
const mockCategories = [
  { value: '', label: '全部分类' },
  { value: 'user', label: '用户类' },
  { value: 'product', label: '产品类' },
  { value: 'behavior', label: '行为类' },
  { value: 'attribute', label: '属性类' }
]

const mockRelationTypes = [
  { value: '', label: '全部类型' },
  { value: 'strong', label: '强关联', color: '#409EFF' },
  { value: 'weak', label: '弱关联', color: '#E6A23C' },
  { value: 'complement', label: '互补关系', color: '#67C23A' },
  { value: 'dependency', label: '依赖关系', color: '#F56C6C' }
]

// Mock 标签节点数据
const mockNodes: TagNode[] = [
  { id: '1', name: '高价值客户', code: 'TAG_001', category: 'user', dataType: 'boolean', description: '消费金额高且活跃度高的客户', useCount: 1520, updateTime: '2025-10-27', status: true, symbolSize: 60 },
  { id: '2', name: '活跃用户', code: 'TAG_002', category: 'user', dataType: 'boolean', description: '近30天登录超过15次的用户', useCount: 3200, updateTime: '2025-10-26', status: true, symbolSize: 70 },
  { id: '3', name: '新用户', code: 'TAG_003', category: 'user', dataType: 'boolean', description: '注册时间小于30天', useCount: 890, updateTime: '2025-10-25', status: true, symbolSize: 50 },
  { id: '4', name: '电子产品偏好', code: 'TAG_004', category: 'product', dataType: 'boolean', description: '购买电子产品次数大于3', useCount: 2100, updateTime: '2025-10-24', status: true, symbolSize: 55 },
  { id: '5', name: '服装偏好', code: 'TAG_005', category: 'product', dataType: 'boolean', description: '购买服装类商品占比超过50%', useCount: 1800, updateTime: '2025-10-23', status: true, symbolSize: 50 },
  { id: '6', name: '浏览深度高', code: 'TAG_006', category: 'behavior', dataType: 'number', description: '平均浏览页面数大于10', useCount: 2500, updateTime: '2025-10-22', status: true, symbolSize: 58 },
  { id: '7', name: '加购未购', code: 'TAG_007', category: 'behavior', dataType: 'boolean', description: '有加购行为但未支付', useCount: 1200, updateTime: '2025-10-21', status: true, symbolSize: 45 },
  { id: '8', name: '促销敏感', code: 'TAG_008', category: 'attribute', dataType: 'boolean', description: '优惠券使用率高', useCount: 1600, updateTime: '2025-10-20', status: true, symbolSize: 52 },
  { id: '9', name: '会员等级高', code: 'TAG_009', category: 'attribute', dataType: 'string', description: '会员等级为金卡或钻石', useCount: 980, updateTime: '2025-10-19', status: true, symbolSize: 48 },
  { id: '10', name: '夜间活跃', code: 'TAG_010', category: 'behavior', dataType: 'boolean', description: '22:00-02:00活跃度高', useCount: 750, updateTime: '2025-10-18', status: true, symbolSize: 42 }
]

// Mock 关联关系数据
const mockRelations: TagRelation[] = [
  { id: 'r1', source: '1', target: '2', relationType: 'strong', strength: 0.9, remark: '高价值客户通常也是活跃用户', createTime: '2025-10-01' },
  { id: 'r2', source: '1', target: '4', relationType: 'strong', strength: 0.8, remark: '高价值客户偏好电子产品', createTime: '2025-10-02' },
  { id: 'r3', source: '1', target: '9', relationType: 'strong', strength: 0.85, remark: '高价值客户多为高等级会员', createTime: '2025-10-03' },
  { id: 'r4', source: '2', target: '6', relationType: 'strong', strength: 0.75, remark: '活跃用户浏览深度通常较高', createTime: '2025-10-04' },
  { id: 'r5', source: '3', target: '7', relationType: 'weak', strength: 0.6, remark: '新用户容易出现加购未购行为', createTime: '2025-10-05' },
  { id: 'r6', source: '4', target: '6', relationType: 'weak', strength: 0.5, remark: '电子产品偏好用户浏览较深', createTime: '2025-10-06' },
  { id: 'r7', source: '5', target: '8', relationType: 'complement', strength: 0.7, remark: '服装偏好用户对促销敏感', createTime: '2025-10-07' },
  { id: 'r8', source: '7', target: '8', relationType: 'complement', strength: 0.65, remark: '加购未购用户可能对价格敏感', createTime: '2025-10-08' },
  { id: 'r9', source: '8', target: '9', relationType: 'dependency', strength: 0.4, remark: '促销敏感用户希望提升会员等级', createTime: '2025-10-09' },
  { id: 'r10', source: '2', target: '10', relationType: 'weak', strength: 0.55, remark: '部分活跃用户在夜间活跃', createTime: '2025-10-10' }
]

// ==================== 响应式数据 ====================
const chartRef = ref<HTMLDivElement>()
let chartInstance: echarts.ECharts | null = null

const loading = ref(false)
const nodes = ref<TagNode[]>([...mockNodes])
const relations = ref<TagRelation[]>([...mockRelations])
const selectedNode = ref<TagNode | null>(null)
const selectedNodes = ref<string[]>([])

// 搜索表单
const searchForm = reactive<SearchForm>({
  keyword: '',
  category: '',
  relationType: '',
  status: '',
  showLevel: 'all'
})

// 详情抽屉
const drawerVisible = ref(false)
const currentTag = ref<TagNode | null>(null)

// 新增关联弹窗
const relationDialogVisible = ref(false)
const relationFormRef = ref<FormInstance>()
const relationForm = reactive<RelationForm>({
  id: '',
  mainTag: '',
  relatedTags: [],
  relationType: 'strong',
  remark: ''
})

// 关联分析弹窗
const analysisDialogVisible = ref(false)
const analysisResult = ref<AnalysisResult | null>(null)

// 图例显示控制
const legendVisible = reactive({
  strong: true,
  weak: true,
  complement: true,
  dependency: true
})

// 表单验证
const relationFormRules: FormRules = {
  mainTag: [{ required: true, message: '请选择主标签', trigger: 'change' }],
  relatedTags: [{ required: true, message: '请至少选择一个关联标签', trigger: 'change' }],
  relationType: [{ required: true, message: '请选择关联类型', trigger: 'change' }]
}

// ==================== 计算属性 ====================
// 获取上游关联标签
const upstreamTags = computed(() => {
  if (!currentTag.value) return []
  return relations.value
    .filter(r => r.target === currentTag.value!.id)
    .map(r => {
      const node = nodes.value.find(n => n.id === r.source)
      return { ...r, tagName: node?.name, tagCode: node?.code }
    })
})

// 获取下游关联标签
const downstreamTags = computed(() => {
  if (!currentTag.value) return []
  return relations.value
    .filter(r => r.source === currentTag.value!.id)
    .map(r => {
      const node = nodes.value.find(n => n.id === r.target)
      return { ...r, tagName: node?.name, tagCode: node?.code }
    })
})

// 可选标签列表（用于新增关联）
const availableTags = computed(() => {
  return nodes.value.filter(n => n.status)
})

// 过滤后的节点和关系
const filteredData = computed(() => {
  let filteredNodes = [...nodes.value]
  let filteredRelations = [...relations.value]

  // 关键字搜索
  if (searchForm.keyword) {
    const keyword = searchForm.keyword.toLowerCase()
    filteredNodes = filteredNodes.filter(n => 
      n.name.toLowerCase().includes(keyword) ||
      n.code.toLowerCase().includes(keyword)
    )
  }

  // 分类过滤
  if (searchForm.category) {
    filteredNodes = filteredNodes.filter(n => n.category === searchForm.category)
  }

  // 状态过滤
  if (searchForm.status !== '') {
    const status = searchForm.status === 'true'
    filteredNodes = filteredNodes.filter(n => n.status === status)
  }

  // 关联类型过滤
  if (searchForm.relationType) {
    filteredRelations = filteredRelations.filter(r => r.relationType === searchForm.relationType)
  }

  // 图例过滤
  filteredRelations = filteredRelations.filter(r => legendVisible[r.relationType])

  // 仅保留有效节点的关系
  const nodeIds = new Set(filteredNodes.map(n => n.id))
  filteredRelations = filteredRelations.filter(r => 
    nodeIds.has(r.source) && nodeIds.has(r.target)
  )

  return { nodes: filteredNodes, relations: filteredRelations }
})

// 获取关联类型配置
const getRelationTypeConfig = (type: string) => {
  return mockRelationTypes.find(t => t.value === type) || mockRelationTypes[1]
}

// 获取分类颜色
const getCategoryColor = (category: string) => {
  const colorMap: Record<string, string> = {
    user: '#5470C6',
    product: '#91CC75',
    behavior: '#FAC858',
    attribute: '#EE6666'
  }
  return colorMap[category] || '#73C0DE'
}

// ==================== Mock API 方法 ====================
const mockDelay = (ms: number = 800) => new Promise(resolve => setTimeout(resolve, ms))

// 初始化图谱
const initChart = async () => {
  if (!chartRef.value) return

  loading.value = true
  await mockDelay(1000)

  try {
    if (!chartInstance) {
      chartInstance = echarts.init(chartRef.value)
    }

    updateChart()
    
    // 绑定点击事件
    chartInstance.off('click')
    chartInstance.on('click', (params: any) => {
      if (params.dataType === 'node') {
        handleNodeClick(params.data.id)
      }
    })

  } catch (error) {
    ElMessage.error('图谱初始化失败')
  } finally {
    loading.value = false
  }
}

// 更新图谱
const updateChart = () => {
  if (!chartInstance) return

  const { nodes: filteredNodes, relations: filteredRelations } = filteredData.value

  // 构建 ECharts 数据
  const chartNodes = filteredNodes.map(node => ({
    id: node.id,
    name: node.name,
    symbolSize: node.symbolSize,
    value: node.useCount,
    category: node.category,
    itemStyle: {
      color: getCategoryColor(node.category)
    },
    label: {
      show: true
    },
    // 额外信息用于 tooltip
    code: node.code,
    dataType: node.dataType,
    updateTime: node.updateTime,
    useCount: node.useCount
  }))

  const chartLinks = filteredRelations.map(relation => ({
    source: relation.source,
    target: relation.target,
    lineStyle: {
      color: getRelationTypeConfig(relation.relationType).color,
      width: relation.strength * 5,
      opacity: 0.6
    },
    label: {
      show: false,
      formatter: getRelationTypeConfig(relation.relationType).label
    },
    relationType: relation.relationType,
    strength: relation.strength,
    remark: relation.remark
  }))

  const categories = [
    { name: 'user', itemStyle: { color: getCategoryColor('user') } },
    { name: 'product', itemStyle: { color: getCategoryColor('product') } },
    { name: 'behavior', itemStyle: { color: getCategoryColor('behavior') } },
    { name: 'attribute', itemStyle: { color: getCategoryColor('attribute') } }
  ]

  const option: EChartsOption = {
    title: {
      text: '标签关联关系图谱',
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
          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 8px;">${params.data.name}</div>
              <div style="font-size: 12px; color: #666;">
                编码: ${params.data.code}<br/>
                分类: ${mockCategories.find(c => c.value === params.data.category)?.label}<br/>
                使用次数: ${params.data.useCount}<br/>
                更新时间: ${params.data.updateTime}
              </div>
            </div>
          `
        } else if (params.dataType === 'edge') {
          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 8px;">
                ${getRelationTypeConfig(params.data.relationType).label}
              </div>
              <div style="font-size: 12px; color: #666;">
                关联强度: ${(params.data.strength * 100).toFixed(0)}%<br/>
                ${params.data.remark ? `说明: ${params.data.remark}` : ''}
              </div>
            </div>
          `
        }
        return ''
      }
    },
    legend: [
      {
        data: categories.map(c => c.name),
        orient: 'vertical',
        left: 10,
        top: 60,
        formatter: (name: string) => {
          return mockCategories.find(c => c.value === name)?.label || name
        }
      }
    ],
    animationDuration: 1500,
    animationEasingUpdate: 'quinticInOut',
    series: [
      {
        type: 'graph',
        layout: 'force',
        data: chartNodes,
        links: chartLinks,
        categories: categories,
        roam: true,
        label: {
          position: 'right',
          formatter: '{b}'
        },
        labelLayout: {
          hideOverlap: true
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: {
            width: 6
          }
        },
        force: {
          repulsion: 300,
          edgeLength: [100, 200],
          gravity: 0.1
        },
        edges: chartLinks
      }
    ]
  }

  chartInstance.setOption(option, true)
}

// 节点点击事件
const handleNodeClick = (nodeId: string) => {
  const node = nodes.value.find(n => n.id === nodeId)
  if (node) {
    currentTag.value = node
    drawerVisible.value = true
  }
}

// 搜索标签
const handleSearch = () => {
  updateChart()
  
  if (searchForm.keyword) {
    ElMessage.success(`已找到 ${filteredData.value.nodes.length} 个相关标签`)
  }
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    keyword: '',
    category: '',
    relationType: '',
    status: '',
    showLevel: 'all'
  })
  updateChart()
}

// 重置视图
const resetView = () => {
  if (chartInstance) {
    chartInstance.dispatchAction({
      type: 'restore'
    })
    ElMessage.success('视图已重置')
  }
}

// 图例切换
const toggleLegend = (type: string) => {
  legendVisible[type as keyof typeof legendVisible] = !legendVisible[type as keyof typeof legendVisible]
  updateChart()
}

// 检查图例是否可见
const isLegendVisible = (type: string) => {
  return legendVisible[type as keyof typeof legendVisible]
}

// ==================== 关系管理 ====================
// 打开新增关联弹窗
const openAddRelationDialog = () => {
  Object.assign(relationForm, {
    id: '',
    mainTag: '',
    relatedTags: [],
    relationType: 'strong',
    remark: ''
  })
  relationDialogVisible.value = true
}

// 保存关联
const saveRelation = async () => {
  if (!relationFormRef.value) return

  await relationFormRef.value.validate(async (valid) => {
    if (!valid) return

    const loadingInstance = ElLoading.service({ text: '保存中...' })

    try {
      await mockDelay()

      // 批量创建关联
      relationForm.relatedTags.forEach(targetId => {
        const newRelation: TagRelation = {
          id: `r${Date.now()}_${Math.random()}`,
          source: relationForm.mainTag,
          target: targetId,
          relationType: relationForm.relationType,
          strength: 0.7,
          remark: relationForm.remark,
          createTime: new Date().toLocaleDateString()
        }
        relations.value.push(newRelation)
      })

      ElMessage.success(`成功创建 ${relationForm.relatedTags.length} 个关联关系`)
      relationDialogVisible.value = false
      updateChart()

    } catch (error) {
      ElMessage.error('保存关联失败')
    } finally {
      loadingInstance.close()
    }
  })
}

// 删除关联
const deleteRelation = async (relationId: string) => {
  await ElMessageBox.confirm('确定要删除该关联关系吗？', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })

  const loadingInstance = ElLoading.service({ text: '删除中...' })

  try {
    await mockDelay(500)
    const index = relations.value.findIndex(r => r.id === relationId)
    if (index !== -1) {
      relations.value.splice(index, 1)
    }
    ElMessage.success('删除成功')
    updateChart()
  } catch (error) {
    ElMessage.error('删除失败')
  } finally {
    loadingInstance.close()
  }
}

// ==================== 关联分析 ====================
// 分析两个标签的关联
const analyzeRelation = async () => {
  if (selectedNodes.value.length !== 2) {
    ElMessage.warning('请从主标签和关联标签各选择一个进行分析')
    return
  }

  const loadingInstance = ElLoading.service({ fullscreen: true, text: '分析中...' })

  try {
    await mockDelay(2000)

    const [tag1Id, tag2Id] = selectedNodes.value
    const tag1 = nodes.value.find(n => n.id === tag1Id)
    const tag2 = nodes.value.find(n => n.id === tag2Id)

    if (!tag1 || !tag2) {
      throw new Error('标签不存在')
    }

    // 模拟路径分析
    const mockPath = [tag1.name]
    const commonNodes: string[] = []
    
    // 查找直接关联
    const directRelation = relations.value.find(
      r => (r.source === tag1Id && r.target === tag2Id) ||
           (r.source === tag2Id && r.target === tag1Id)
    )

    if (directRelation) {
      mockPath.push(tag2.name)
    } else {
      // 查找间接路径（简化版）
      const intermediates = relations.value
        .filter(r => r.source === tag1Id)
        .map(r => r.target)
      
      for (const intermediate of intermediates) {
        const hasPath = relations.value.find(r => 
          r.source === intermediate && r.target === tag2Id
        )
        if (hasPath) {
          const intermediateNode = nodes.value.find(n => n.id === intermediate)
          if (intermediateNode) {
            mockPath.push(intermediateNode.name)
            commonNodes.push(intermediateNode.name)
          }
          break
        }
      }
      mockPath.push(tag2.name)
    }

    analysisResult.value = {
      tag1: tag1.name,
      tag2: tag2.name,
      relevance: Math.random() * 0.5 + 0.5, // 0.5-1.0
      path: mockPath,
      commonNodes: commonNodes,
      pathLength: mockPath.length - 1
    }

    analysisDialogVisible.value = true

  } catch (error: any) {
    ElMessage.error(error.message || '分析失败')
  } finally {
    loadingInstance.close()
  }
}

// 选择分析标签
const selectAnalysisTag = (tagId: string, type: 'main' | 'related') => {
  if (type === 'main') {
    selectedNodes.value[0] = tagId
  } else {
    selectedNodes.value[1] = tagId
  }
}

// ==================== 导出功能 ====================
// 导出图谱为图片
const exportChartImage = async () => {
  if (!chartInstance) {
    ElMessage.warning('图谱未加载')
    return
  }

  const loadingInstance = ElLoading.service({ text: '导出中...' })

  try {
    await mockDelay(1000)
    
    const url = chartInstance.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#fff'
    })

    const link = document.createElement('a')
    link.href = url
    link.download = `标签关联图谱_${Date.now()}.png`
    link.click()

    ElMessage.success('图谱已导出为 PNG 文件')
  } catch (error) {
    ElMessage.error('导出失败')
  } finally {
    loadingInstance.close()
  }
}

// 生成关联分析报告
const exportAnalysisReport = async () => {
  const loadingInstance = ElLoading.service({ text: '生成报告中...' })

  try {
    await mockDelay(1500)

    const report = {
      reportTitle: '标签关联关系分析报告',
      generateTime: new Date().toLocaleString(),
      statistics: {
        totalTags: nodes.value.length,
        totalRelations: relations.value.length,
        avgRelations: (relations.value.length / nodes.value.length).toFixed(2),
        strongRelations: relations.value.filter(r => r.relationType === 'strong').length,
        weakRelations: relations.value.filter(r => r.relationType === 'weak').length
      },
      topTags: nodes.value
        .sort((a, b) => b.useCount - a.useCount)
        .slice(0, 5)
        .map(t => ({ name: t.name, useCount: t.useCount }))
    }

    const jsonStr = JSON.stringify(report, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `标签关联分析报告_${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)

    ElMessage.success('报告已生成并下载')
  } catch (error) {
    ElMessage.error('生成报告失败')
  } finally {
    loadingInstance.close()
  }
}

// 跳转到标签
const navigateToTag = (tagId: string) => {
  drawerVisible.value = false
  
  nextTick(() => {
    if (chartInstance) {
      // 高亮节点
      chartInstance.dispatchAction({
        type: 'highlight',
        seriesIndex: 0,
        dataIndex: nodes.value.findIndex(n => n.id === tagId)
      })
      
      // 显示详情
      setTimeout(() => {
        handleNodeClick(tagId)
      }, 300)
    }
  })
}

// ==================== 生命周期 ====================
onMounted(() => {
  initChart()
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    chartInstance?.resize()
  })
})
</script>

<template>
  <div class="tag-association-container">
    <!-- 顶部操作区 -->
    <div class="control-section">
      <el-card shadow="never">
        <div class="control-content">
          <!-- 搜索筛选 -->
          <div class="search-row">
            <el-input
              v-model="searchForm.keyword"
              placeholder="搜索标签名称或编码"
              clearable
              style="width: 280px; margin-right: 12px"
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>

            <el-select
              v-model="searchForm.category"
              placeholder="标签分类"
              clearable
              style="width: 140px; margin-right: 12px"
            >
              <el-option
                v-for="item in mockCategories"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>

            <el-select
              v-model="searchForm.relationType"
              placeholder="关联类型"
              clearable
              style="width: 140px; margin-right: 12px"
            >
              <el-option
                v-for="item in mockRelationTypes"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>

            <el-radio-group v-model="searchForm.showLevel" style="margin-right: 12px">
              <el-radio-button label="direct">直接关联</el-radio-button>
              <el-radio-button label="all">全部层级</el-radio-button>
            </el-radio-group>

            <el-button type="primary" @click="handleSearch">
              <el-icon><Search /></el-icon>
              查询
            </el-button>
            <el-button @click="handleReset">
              <el-icon><RefreshLeft /></el-icon>
              重置
            </el-button>
          </div>

          <!-- 操作按钮 -->
          <div class="action-row">
            <div class="left-actions">
              <el-button type="primary" @click="openAddRelationDialog">
                <el-icon><Plus /></el-icon>
                新增关联
              </el-button>
              <el-button @click="resetView">
                <el-icon><Refresh /></el-icon>
                重置视图
              </el-button>
              <el-button @click="analyzeRelation">
                <el-icon><DataAnalysis /></el-icon>
                关联分析
              </el-button>
            </div>

            <div class="right-actions">
              <el-button @click="exportChartImage">
                <el-icon><Picture /></el-icon>
                导出图谱
              </el-button>
              <el-button @click="exportAnalysisReport">
                <el-icon><Document /></el-icon>
                分析报告
              </el-button>
            </div>
          </div>

          <!-- 图例控制 -->
          <div class="legend-row">
            <span style="margin-right: 16px; font-size: 14px; color: #606266;">关联类型：</span>
            <el-check-tag
              v-for="type in mockRelationTypes.filter(t => t.value)"
              :key="type.value"
              :checked="isLegendVisible(type.value)"
              @click="toggleLegend(type.value)"
              style="margin-right: 8px"
            >
              <span :style="{ color: type.color }">● </span>{{ type.label }}
            </el-check-tag>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 图谱展示区 -->
    <div class="chart-section">
      <el-card shadow="never" :body-style="{ padding: '0' }">
        <div
          ref="chartRef"
          v-loading="loading"
          class="chart-container"
          element-loading-text="加载图谱中..."
        ></div>
      </el-card>
    </div>

    <!-- 统计信息卡片 -->
    <div class="statistics-section">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-label">标签总数</div>
              <div class="stat-value">{{ nodes.length }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-label">关联关系</div>
              <div class="stat-value">{{ relations.length }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-label">平均关联度</div>
              <div class="stat-value">{{ (relations.length / nodes.length).toFixed(1) }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-label">强关联数</div>
              <div class="stat-value">{{ relations.filter(r => r.relationType === 'strong').length }}</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 标签详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      :title="`标签详情 - ${currentTag?.name}`"
      size="500px"
      destroy-on-close
    >
      <div v-if="currentTag" class="tag-detail">
        <el-descriptions title="基本信息" :column="1" border>
          <el-descriptions-item label="标签名称">{{ currentTag.name }}</el-descriptions-item>
          <el-descriptions-item label="标签编码">{{ currentTag.code }}</el-descriptions-item>
          <el-descriptions-item label="标签分类">
            <el-tag :color="getCategoryColor(currentTag.category)">
              {{ mockCategories.find(c => c.value === currentTag.category)?.label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="数据类型">{{ currentTag.dataType }}</el-descriptions-item>
          <el-descriptions-item label="使用频次">{{ currentTag.useCount }} 次</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ currentTag.updateTime }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentTag.status ? 'success' : 'info'">
              {{ currentTag.status ? '启用' : '停用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="业务描述">{{ currentTag.description }}</el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">上游关联标签 ({{ upstreamTags.length }})</el-divider>
        <div class="relation-list">
          <div v-if="upstreamTags.length === 0" class="empty-text">暂无上游关联</div>
          <div v-for="item in upstreamTags" :key="item.id" class="relation-item">
            <div class="relation-info">
              <el-link type="primary" @click="navigateToTag(item.source)">
                {{ item.tagName }}
              </el-link>
              <el-tag :color="getRelationTypeConfig(item.relationType).color" size="small" style="margin-left: 8px">
                {{ getRelationTypeConfig(item.relationType).label }}
              </el-tag>
            </div>
            <div class="relation-meta">
              <span style="color: #909399; font-size: 12px;">
                强度: {{ (item.strength * 100).toFixed(0) }}%
              </span>
              <el-button link type="danger" size="small" @click="deleteRelation(item.id)">
                删除
              </el-button>
            </div>
          </div>
        </div>

        <el-divider content-position="left">下游关联标签 ({{ downstreamTags.length }})</el-divider>
        <div class="relation-list">
          <div v-if="downstreamTags.length === 0" class="empty-text">暂无下游关联</div>
          <div v-for="item in downstreamTags" :key="item.id" class="relation-item">
            <div class="relation-info">
              <el-link type="primary" @click="navigateToTag(item.target)">
                {{ item.tagName }}
              </el-link>
              <el-tag :color="getRelationTypeConfig(item.relationType).color" size="small" style="margin-left: 8px">
                {{ getRelationTypeConfig(item.relationType).label }}
              </el-tag>
            </div>
            <div class="relation-meta">
              <span style="color: #909399; font-size: 12px;">
                强度: {{ (item.strength * 100).toFixed(0) }}%
              </span>
              <el-button link type="danger" size="small" @click="deleteRelation(item.id)">
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- 新增关联弹窗 -->
    <el-dialog
      v-model="relationDialogVisible"
      title="新增关联关系"
      width="600px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form
        ref="relationFormRef"
        :model="relationForm"
        :rules="relationFormRules"
        label-width="100px"
      >
        <el-form-item label="主标签" prop="mainTag">
          <el-select
            v-model="relationForm.mainTag"
            placeholder="请选择主标签"
            filterable
            style="width: 100%"
            @change="selectAnalysisTag(relationForm.mainTag, 'main')"
          >
            <el-option
              v-for="tag in availableTags"
              :key="tag.id"
              :label="`${tag.name} (${tag.code})`"
              :value="tag.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="关联标签" prop="relatedTags">
          <el-select
            v-model="relationForm.relatedTags"
            placeholder="请选择关联标签（可多选）"
            multiple
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="tag in availableTags.filter(t => t.id !== relationForm.mainTag)"
              :key="tag.id"
              :label="`${tag.name} (${tag.code})`"
              :value="tag.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="关联类型" prop="relationType">
          <el-radio-group v-model="relationForm.relationType">
            <el-radio
              v-for="type in mockRelationTypes.filter(t => t.value)"
              :key="type.value"
              :label="type.value"
            >
              <span :style="{ color: type.color }">{{ type.label }}</span>
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="备注说明">
          <el-input
            v-model="relationForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注说明"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="relationDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRelation">
          <el-icon><Check /></el-icon>
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 关联分析结果弹窗 -->
    <el-dialog
      v-model="analysisDialogVisible"
      title="关联分析结果"
      width="700px"
      destroy-on-close
    >
      <div v-if="analysisResult" class="analysis-result">
        <el-result
          icon="success"
          title="分析完成"
          :sub-title="`${analysisResult.tag1} 与 ${analysisResult.tag2} 的关联分析`"
        >
          <template #extra>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="相关度评分">
                <el-progress
                  :percentage="analysisResult.relevance * 100"
                  :color="analysisResult.relevance > 0.7 ? '#67C23A' : '#E6A23C'"
                />
              </el-descriptions-item>
              <el-descriptions-item label="路径长度">
                {{ analysisResult.pathLength }} 步
              </el-descriptions-item>
              <el-descriptions-item label="关联路径" :span="2">
                <el-tag
                  v-for="(node, index) in analysisResult.path"
                  :key="index"
                  style="margin-right: 8px"
                  type="success"
                >
                  {{ node }}
                </el-tag>
                <span v-if="index < analysisResult.path.length - 1" style="margin: 0 4px;">→</span>
              </el-descriptions-item>
              <el-descriptions-item label="共同节点" :span="2">
                <el-tag
                  v-if="analysisResult.commonNodes.length === 0"
                  type="info"
                >
                  无
                </el-tag>
                <el-tag
                  v-for="node in analysisResult.commonNodes"
                  :key="node"
                  style="margin-right: 8px"
                  type="warning"
                >
                  {{ node }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </template>
        </el-result>

        <el-divider />

        <div class="analysis-summary">
          <h4>分析摘要</h4>
          <p style="color: #606266; line-height: 1.8;">
            根据标签关联网络分析，<strong>{{ analysisResult.tag1 }}</strong> 与 
            <strong>{{ analysisResult.tag2 }}</strong> 之间存在
            {{ analysisResult.pathLength === 1 ? '直接' : '间接' }}关联关系。
            关联路径长度为 {{ analysisResult.pathLength }} 步，
            综合相关度评分为 <strong>{{ (analysisResult.relevance * 100).toFixed(1) }}%</strong>。
            {{ analysisResult.relevance > 0.7 ? '两个标签具有较强的业务关联性，建议组合使用。' : '两个标签关联性一般，可根据具体业务场景选择是否组合。' }}
          </p>
        </div>
      </div>

      <template #footer>
        <el-button @click="analysisDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.tag-association-container {

  .control-section {
    margin-bottom: 16px;

    .control-content {
      .search-row {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        margin-bottom: 16px;
      }

      .action-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        .left-actions,
        .right-actions {
          display: flex;
          gap: 8px;
        }
      }

      .legend-row {
        display: flex;
        align-items: center;
        padding-top: 12px;
        border-top: 1px solid #e4e7ed;
      }
    }
  }

  .chart-section {
    margin-bottom: 16px;

    .chart-container {
      width: 100%;
      height: 600px;
    }
  }

  .statistics-section {
    .stat-card {
      text-align: center;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-4px);
      }

      .stat-content {
        .stat-label {
          font-size: 14px;
          color: #909399;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: bold;
          color: #409eff;
        }
      }
    }
  }

  .tag-detail {
    .relation-list {
      .empty-text {
        text-align: center;
        color: #909399;
        padding: 20px 0;
      }

      .relation-item {
        padding: 12px;
        margin-bottom: 8px;
        background-color: #f5f7fa;
        border-radius: 4px;
        display: flex;
        justify-content: space-between;
        align-items: center;

        .relation-info {
          display: flex;
          align-items: center;
        }

        .relation-meta {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        &:hover {
          background-color: #ecf5ff;
        }
      }
    }
  }

  .analysis-result {
    .analysis-summary {
      h4 {
        margin-bottom: 12px;
        color: #303133;
      }

      p {
        margin: 0;
      }
    }
  }
}

:deep(.el-card) {
  border-radius: 8px;
}

:deep(.el-check-tag) {
  cursor: pointer;
}

:deep(.el-descriptions__label) {
  font-weight: 500;
}
</style>