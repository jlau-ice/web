<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Download, FullScreen } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { ECharts } from 'echarts'

// 定义节点类型
type NodeType = 'dataSource' | 'table' | 'field' | 'logic' | 'indicator'

// 定义节点接口
interface LineageNode {
  id: string
  name: string
  type: NodeType
  system: string
  updateTime: string
  description: string
  relatedCount?: number
  category: number
}

// 定义连接接口
interface LineageLink {
  source: string
  target: string
}

// 定义详情接口
interface NodeDetail extends LineageNode {
  path?: string
  size?: string
  owner?: string
}

// 状态管理
const searchKeyword = ref('')
const selectedCategory = ref('')
const selectedSystem = ref('')
const loading = ref(false)
const drawerVisible = ref(false)
const selectedNode = ref<NodeDetail | null>(null)

// 图表实例
let chartInstance: ECharts | null = null
const chartRef = ref<HTMLElement>()

// Mock 数据
const categories = ref([
  { name: '数据源', itemStyle: { color: '#5470c6' } },
  { name: '数据表', itemStyle: { color: '#91cc75' } },
  { name: '字段', itemStyle: { color: '#fac858' } },
  { name: '计算逻辑', itemStyle: { color: '#ee6666' } },
  { name: '指标结果', itemStyle: { color: '#73c0de' } }
])

const categoryOptions = [
  { label: '全部分类', value: '' },
  { label: '业务指标', value: 'business' },
  { label: '技术指标', value: 'technical' },
  { label: '财务指标', value: 'financial' }
]

const systemOptions = [
  { label: '全部系统', value: '' },
  { label: '营销系统', value: 'marketing' },
  { label: '财务系统', value: 'finance' },
  { label: '数据中台', value: 'dataCenter' }
]

// Mock 血缘数据
const mockLineageData = ref<{
  nodes: LineageNode[]
  links: LineageLink[]
}>({
  nodes: [],
  links: []
})

// 生成 Mock 数据
const generateMockData = (indicatorName: string = '用户活跃度') => {
  const nodes: LineageNode[] = [
    {
      id: 'ds_1',
      name: 'MySQL数据库',
      type: 'dataSource',
      system: '数据中台',
      updateTime: '2025-10-28 10:00',
      description: '主数据库，存储用户行为数据',
      relatedCount: 3,
      category: 0
    },
    {
      id: 'ds_2',
      name: 'Redis缓存',
      type: 'dataSource',
      system: '数据中台',
      updateTime: '2025-10-28 10:00',
      description: '缓存层，存储实时用户会话',
      relatedCount: 2,
      category: 0
    },
    {
      id: 'tb_1',
      name: 'user_behavior',
      type: 'table',
      system: '营销系统',
      updateTime: '2025-10-28 09:30',
      description: '用户行为明细表',
      relatedCount: 5,
      category: 1
    },
    {
      id: 'tb_2',
      name: 'user_profile',
      type: 'table',
      system: '营销系统',
      updateTime: '2025-10-28 09:30',
      description: '用户画像表',
      relatedCount: 3,
      category: 1
    },
    {
      id: 'fd_1',
      name: 'user_id',
      type: 'field',
      system: '营销系统',
      updateTime: '2025-10-28 09:00',
      description: '用户唯一标识',
      category: 2
    },
    {
      id: 'fd_2',
      name: 'action_time',
      type: 'field',
      system: '营销系统',
      updateTime: '2025-10-28 09:00',
      description: '行为发生时间',
      category: 2
    },
    {
      id: 'fd_3',
      name: 'action_type',
      type: 'field',
      system: '营销系统',
      updateTime: '2025-10-28 09:00',
      description: '行为类型（点击/浏览/购买）',
      category: 2
    },
    {
      id: 'fd_4',
      name: 'session_id',
      type: 'field',
      system: '营销系统',
      updateTime: '2025-10-28 09:00',
      description: '会话ID',
      category: 2
    },
    {
      id: 'logic_1',
      name: '活跃用户统计',
      type: 'logic',
      system: '数据中台',
      updateTime: '2025-10-28 08:00',
      description: 'COUNT(DISTINCT user_id) WHERE action_time >= CURRENT_DATE - 7',
      category: 3
    },
    {
      id: 'logic_2',
      name: '活跃度计算',
      type: 'logic',
      system: '数据中台',
      updateTime: '2025-10-28 08:00',
      description: '活跃用户数 / 总用户数 * 100',
      category: 3
    },
    {
      id: 'indicator_1',
      name: indicatorName,
      type: 'indicator',
      system: '营销系统',
      updateTime: '2025-10-28 07:00',
      description: '反映用户在平台的活跃程度，7日活跃用户占比',
      relatedCount: 8,
      category: 4
    }
  ]

  const links: LineageLink[] = [
    { source: 'ds_1', target: 'tb_1' },
    { source: 'ds_2', target: 'tb_2' },
    { source: 'tb_1', target: 'fd_1' },
    { source: 'tb_1', target: 'fd_2' },
    { source: 'tb_1', target: 'fd_3' },
    { source: 'tb_2', target: 'fd_4' },
    { source: 'fd_1', target: 'logic_1' },
    { source: 'fd_2', target: 'logic_1' },
    { source: 'fd_3', target: 'logic_1' },
    { source: 'fd_4', target: 'logic_2' },
    { source: 'logic_1', target: 'logic_2' },
    { source: 'logic_2', target: 'indicator_1' }
  ]

  return { nodes, links }
}

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return

  if (chartInstance) {
    chartInstance.dispose()
  }

  chartInstance = echarts.init(chartRef.value)

  const option = {
    title: {
      text: '指标血缘关系图',
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      formatter: (params: any) => {
        if (params.dataType === 'node') {
          const data = params.data as LineageNode
          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 6px;">${data.name}</div>
              <div style="color: #666; font-size: 12px;">
                <div>类型: ${getNodeTypeName(data.type)}</div>
                <div>系统: ${data.system}</div>
                <div>更新: ${data.updateTime}</div>
                ${data.relatedCount ? `<div>关联: ${data.relatedCount}个节点</div>` : ''}
              </div>
            </div>
          `
        }
        return ''
      }
    },
    legend: [
      {
        data: categories.value.map(c => c.name),
        orient: 'vertical',
        left: 'left',
        top: 50
      }
    ],
    series: [
      {
        type: 'graph',
        layout: 'force',
        data: mockLineageData.value.nodes.map(node => ({
          ...node,
          symbolSize: node.type === 'indicator' ? 80 : node.type === 'logic' ? 60 : 50,
          label: {
            show: true,
            fontSize: 12,
            formatter: '{b}'
          }
        })),
        links: mockLineageData.value.links,
        categories: categories.value,
        roam: true,
        label: {
          position: 'inside',
          color: '#fff',
          fontWeight: 'bold'
        },
        force: {
          repulsion: 300,
          edgeLength: [150, 200],
          gravity: 0.1
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: {
            width: 5
          }
        },
        lineStyle: {
          color: 'source',
          curveness: 0.3,
          width: 2
        }
      }
    ]
  }

  chartInstance.setOption(option)

  // 绑定点击事件
  chartInstance.on('click', (params: any) => {
    if (params.dataType === 'node') {
      handleNodeClick(params.data)
    }
  })

  // 自适应
  window.addEventListener('resize', () => {
    chartInstance?.resize()
  })
}

// 获取节点类型名称
const getNodeTypeName = (type: NodeType): string => {
  const map: Record<NodeType, string> = {
    dataSource: '数据源',
    table: '数据表',
    field: '字段',
    logic: '计算逻辑',
    indicator: '指标结果'
  }
  return map[type] || type
}

// 获取节点类型标签样式
const getNodeTypeTag = (type: NodeType): string => {
  const map: Record<NodeType, string> = {
    dataSource: 'primary',
    table: 'success',
    field: 'warning',
    logic: 'danger',
    indicator: 'info'
  }
  return map[type] || ''
}

// 处理节点点击
const handleNodeClick = (node: LineageNode) => {
  selectedNode.value = {
    ...node,
    path: node.type === 'table' ? `db.${node.name}` : undefined,
    size: node.type === 'table' ? '2.3 GB' : undefined,
    owner: '数据管理员'
  }
  drawerVisible.value = true
}

// 搜索指标
const handleSearch = async () => {
  if (!searchKeyword.value.trim()) {
    ElMessage.warning('请输入指标名称或编码')
    return
  }

  loading.value = true

  // 模拟异步加载
  setTimeout(() => {
    mockLineageData.value = generateMockData(searchKeyword.value)
    nextTick(() => {
      initChart()
      loading.value = false
      ElMessage.success('血缘图加载成功')
    })
  }, 800)
}

// 刷新血缘图
const handleRefresh = async () => {
  loading.value = true

  setTimeout(() => {
    mockLineageData.value = generateMockData(searchKeyword.value || '用户活跃度')
    nextTick(() => {
      initChart()
      loading.value = false
      ElMessage.success('血缘图已刷新')
    })
  }, 600)
}

// 重置视图
const handleResetView = () => {
  if (chartInstance) {
    chartInstance.dispatchAction({
      type: 'restore'
    })
    ElMessage.success('视图已重置')
  }
}

// 导出血缘关系
const handleExport = (format: 'json' | 'pdf') => {
  if (format === 'json') {
    const dataStr = JSON.stringify(mockLineageData.value, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `indicator-lineage-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
    ElMessage.success('JSON 导出成功')
  } else if (format === 'pdf') {
    // 模拟 PDF 导出
    setTimeout(() => {
      ElMessage.success('PDF 导出成功（模拟）')
    }, 500)
  }
}

// 筛选变化
watch([selectedCategory, selectedSystem], () => {
  if (mockLineageData.value.nodes.length > 0) {
    // 这里可以实现筛选逻辑
    ElMessage.info('筛选条件已更新')
  }
})

// 组件挂载
onMounted(() => {
  // 初始化默认数据
  mockLineageData.value = generateMockData()
  nextTick(() => {
    initChart()
  })
})
</script>

<template>
  <div class="indicator-lineage-container">
    <!-- 搜索和筛选区域 -->
    <el-card class="search-card" shadow="never">
      <el-row :gutter="16" align="middle">
        <el-col :span="8">
          <el-input
            v-model="searchKeyword"
            placeholder="请输入指标名称或编码"
            :prefix-icon="Search"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-col>
        <el-col :span="4">
          <el-select
            v-model="selectedCategory"
            placeholder="指标分类"
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="item in categoryOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select
            v-model="selectedSystem"
            placeholder="系统来源"
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="item in systemOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-col>
        <el-col :span="8">
          <div class="button-group">
            <el-button type="primary" :icon="Search" @click="handleSearch">
              查询
            </el-button>
            <el-button :icon="Refresh" @click="handleRefresh">
              刷新
            </el-button>
            <el-button :icon="FullScreen" @click="handleResetView">
              重置视图
            </el-button>
            <el-dropdown @command="handleExport">
              <el-button :icon="Download">
                导出
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="json">导出 JSON</el-dropdown-item>
                  <el-dropdown-item command="pdf">导出 PDF（模拟）</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 血缘图展示区域 -->
    <el-card class="chart-card" shadow="never" v-loading="loading">
      <div ref="chartRef" class="chart-container"></div>

      <!-- 操作提示 -->
      <div class="chart-tips">
        <el-tag size="small" type="info">提示：支持拖拽、缩放；点击节点查看详情</el-tag>
      </div>
    </el-card>

    <!-- 节点详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      title="节点详情"
      direction="rtl"
      size="400px"
    >
      <div v-if="selectedNode" class="detail-content">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="节点类型">
            <el-tag :type="getNodeTypeTag(selectedNode.type)">
              {{ getNodeTypeName(selectedNode.type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="节点名称">
            {{ selectedNode.name }}
          </el-descriptions-item>
          <el-descriptions-item label="节点ID">
            <el-text type="info" size="small">{{ selectedNode.id }}</el-text>
          </el-descriptions-item>
          <el-descriptions-item label="所属系统">
            <el-tag type="success" size="small">{{ selectedNode.system }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ selectedNode.updateTime }}
          </el-descriptions-item>
          <el-descriptions-item
            v-if="selectedNode.relatedCount"
            label="关联节点数"
          >
            <el-text type="primary">{{ selectedNode.relatedCount }} 个</el-text>
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedNode.path" label="数据路径">
            {{ selectedNode.path }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedNode.size" label="数据大小">
            {{ selectedNode.size }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedNode.owner" label="负责人">
            {{ selectedNode.owner }}
          </el-descriptions-item>
          <el-descriptions-item label="描述信息">
            <div class="description-text">{{ selectedNode.description }}</div>
          </el-descriptions-item>
        </el-descriptions>

        <el-divider />

        <!-- 相关操作 -->
        <div class="detail-actions">
          <h4>相关操作</h4>
          <el-space direction="vertical" style="width: 100%">
            <el-button type="primary" text>查看数据预览</el-button>
            <el-button type="primary" text>查看变更历史</el-button>
            <el-button type="primary" text>查看依赖关系</el-button>
            <el-button type="primary" text>编辑节点信息</el-button>
          </el-space>
        </div>

        <el-divider />

        <!-- 血缘路径 -->
        <div class="detail-path">
          <h4>完整链路</h4>
          <el-timeline>
            <el-timeline-item
              v-for="(node, index) in ['数据源', '数据表', '字段', '计算逻辑', '指标结果']"
              :key="index"
              :timestamp="node"
            >
              {{ node }}
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
.indicator-lineage-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;

  .search-card {
    flex-shrink: 0;

    .button-group {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
  }

  .chart-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    position: relative;
    min-height: 0;

    :deep(.el-card__body) {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .chart-container {
      flex: 1;
      min-height: 600px;
    }

    .chart-tips {
      position: absolute;
      bottom: 20px;
      right: 20px;
      z-index: 10;
    }
  }

  .detail-content {
    padding: 0 8px;

    .description-text {
      line-height: 1.6;
      color: #606266;
      font-size: 14px;
    }

    .detail-actions,
    .detail-path {
      margin-top: 16px;

      h4 {
        margin: 0 0 12px 0;
        font-size: 14px;
        color: #303133;
      }
    }
  }
}

// 响应式
@media (max-width: 1200px) {
  .indicator-lineage-container {
    .search-card {
      :deep(.el-row) {
        .el-col {
          margin-bottom: 12px;
        }
      }
    }
  }
}
</style>
