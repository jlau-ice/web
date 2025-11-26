<template>
  <div class="p-5">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800 mb-2">血缘分析</h1>
      <p class="text-gray-600 text-sm">以可视化方式呈现数据从源头到消费端的全链路流转与依赖关系</p>
    </div>

    <!-- 搜索和筛选区域 -->
    <el-card class="mb-4" shadow="never">
      <el-form :inline="true" :model="searchForm" class="demo-form-inline">
        <el-form-item label="数据源">
          <el-input v-model="searchForm.dataSource" placeholder="请输入数据源" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="表名">
          <el-input v-model="searchForm.tableName" placeholder="请输入表名" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="字段名">
          <el-input v-model="searchForm.fieldName" placeholder="请输入字段名" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon class="mr-1"><Search /></el-icon>
            查询血缘
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作栏 -->
    <div class="mb-4 flex justify-between items-center">
      <div>
        <el-button type="primary" @click="handleExpandAll">
          <el-icon class="mr-1"><Plus /></el-icon>
          展开全部
        </el-button>
        <el-button @click="handleCollapseAll">
          <el-icon class="mr-1"><Minus /></el-icon>
          收起全部
        </el-button>
        <el-button type="success" @click="handleExport">
          <el-icon class="mr-1"><Download /></el-icon>
          导出血缘图
        </el-button>
      </div>
      <div>
        <el-button-group>
          <el-button @click="handleZoomIn">
            <el-icon><ZoomIn /></el-icon>
          </el-button>
          <el-button @click="handleZoomOut">
            <el-icon><ZoomOut /></el-icon>
          </el-button>
          <el-button @click="handleResetZoom">
            <el-icon><FullScreen /></el-icon>
          </el-button>
        </el-button-group>
        <el-button class="ml-2" @click="handleRefresh">
          <el-icon class="mr-1"><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 血缘关系可视化 -->
    <el-card shadow="never" class="mb-4">
      <div class="lineage-container" ref="lineageContainerRef">
        <div class="lineage-canvas" :style="{ transform: `scale(${zoomLevel})` }">
          <!-- 上游数据源 -->
          <div class="lineage-section upstream">
            <div class="section-title">上游数据源</div>
            <div class="nodes-container">
              <div
                v-for="node in upstreamNodes"
                :key="node.id"
                class="lineage-node source"
                :class="{ active: selectedNode?.id === node.id }"
                @click="handleNodeClick(node)"
              >
                <div class="node-icon">
                  <el-icon><Coin /></el-icon>
                </div>
                <div class="node-label">{{ node.name }}</div>
                <div class="node-info">{{ node.type }}</div>
              </div>
            </div>
          </div>

          <!-- 连接线 -->
          <svg class="lineage-lines" v-if="upstreamNodes.length > 0 && downstreamNodes.length > 0">
            <line
              v-for="(line, index) in connectionLines"
              :key="index"
              :x1="line.x1"
              :y1="line.y1"
              :x2="line.x2"
              :y2="line.y2"
              stroke="#409EFF"
              stroke-width="2"
              marker-end="url(#arrowhead)"
            />
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="#409EFF" />
              </marker>
            </defs>
          </svg>

          <!-- 当前节点 -->
          <div class="lineage-section current">
            <div class="section-title">当前节点</div>
            <div class="nodes-container">
              <div
                v-for="node in currentNodes"
                :key="node.id"
                class="lineage-node current"
                :class="{ active: selectedNode?.id === node.id }"
                @click="handleNodeClick(node)"
              >
                <div class="node-icon">
                  <el-icon><Document /></el-icon>
                </div>
                <div class="node-label">{{ node.name }}</div>
                <div class="node-info">{{ node.type }}</div>
              </div>
            </div>
          </div>

          <!-- 连接线 -->
          <svg class="lineage-lines" v-if="currentNodes.length > 0 && downstreamNodes.length > 0">
            <line
              v-for="(line, index) in downstreamLines"
              :key="index"
              :x1="line.x1"
              :y1="line.y1"
              :x2="line.x2"
              :y2="line.y2"
              stroke="#67C23A"
              stroke-width="2"
              marker-end="url(#arrowhead-down)"
            />
            <defs>
              <marker id="arrowhead-down" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="#67C23A" />
              </marker>
            </defs>
          </svg>

          <!-- 下游消费端 -->
          <div class="lineage-section downstream">
            <div class="section-title">下游消费端</div>
            <div class="nodes-container">
              <div
                v-for="node in downstreamNodes"
                :key="node.id"
                class="lineage-node target"
                :class="{ active: selectedNode?.id === node.id }"
                @click="handleNodeClick(node)"
              >
                <div class="node-icon">
                  <el-icon><DataAnalysis /></el-icon>
                </div>
                <div class="node-label">{{ node.name }}</div>
                <div class="node-info">{{ node.type }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 节点详情和影响分析 -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <div class="flex justify-between items-center">
              <span>节点详情</span>
              <el-button link type="primary" size="small" @click="handleViewFullDetail">查看完整详情</el-button>
            </div>
          </template>
          <el-descriptions :column="1" border v-if="selectedNode">
            <el-descriptions-item label="节点名称">{{ selectedNode.name }}</el-descriptions-item>
            <el-descriptions-item label="节点类型">{{ selectedNode.type }}</el-descriptions-item>
            <el-descriptions-item label="数据源">{{ selectedNode.dataSource }}</el-descriptions-item>
            <el-descriptions-item label="表名">{{ selectedNode.tableName }}</el-descriptions-item>
            <el-descriptions-item label="字段数">{{ selectedNode.fieldCount }}</el-descriptions-item>
            <el-descriptions-item label="数据量">{{ selectedNode.dataVolume }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ selectedNode.updateTime }}</el-descriptions-item>
            <el-descriptions-item label="描述">{{ selectedNode.description || '无' }}</el-descriptions-item>
          </el-descriptions>
          <el-empty v-else description="请选择一个节点查看详情" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <span>影响范围分析</span>
          </template>
          <div v-if="selectedNode">
            <div class="mb-4">
              <div class="text-sm text-gray-600 mb-2">上游依赖：{{ upstreamNodes.length }} 个</div>
              <el-tag v-for="node in upstreamNodes.slice(0, 5)" :key="node.id" class="mr-2 mb-2">
                {{ node.name }}
              </el-tag>
              <el-tag v-if="upstreamNodes.length > 5" type="info">+{{ upstreamNodes.length - 5 }}</el-tag>
            </div>
            <div class="mb-4">
              <div class="text-sm text-gray-600 mb-2">下游影响：{{ downstreamNodes.length }} 个</div>
              <el-tag v-for="node in downstreamNodes.slice(0, 5)" :key="node.id" type="success" class="mr-2 mb-2">
                {{ node.name }}
              </el-tag>
              <el-tag v-if="downstreamNodes.length > 5" type="info">+{{ downstreamNodes.length - 5 }}</el-tag>
            </div>
            <div>
              <el-button type="primary" size="small" @click="handleAnalyzeImpact">分析影响范围</el-button>
              <el-button type="success" size="small" @click="handleTraceSource">溯源追踪</el-button>
            </div>
          </div>
          <el-empty v-else description="请选择一个节点查看影响范围" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 完整详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="节点完整详情" width="800px" v-if="selectedNode">
      <el-tabs>
        <el-tab-pane label="基本信息">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="节点名称">{{ selectedNode.name }}</el-descriptions-item>
            <el-descriptions-item label="节点类型">{{ selectedNode.type }}</el-descriptions-item>
            <el-descriptions-item label="数据源">{{ selectedNode.dataSource }}</el-descriptions-item>
            <el-descriptions-item label="表名">{{ selectedNode.tableName }}</el-descriptions-item>
            <el-descriptions-item label="字段数">{{ selectedNode.fieldCount }}</el-descriptions-item>
            <el-descriptions-item label="数据量">{{ selectedNode.dataVolume }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ selectedNode.createTime }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ selectedNode.updateTime }}</el-descriptions-item>
            <el-descriptions-item label="描述" :span="2">{{ selectedNode.description || '无' }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
        <el-tab-pane label="字段信息">
          <el-table :data="selectedNode.fields" style="width: 100%">
            <el-table-column prop="name" label="字段名" width="150" />
            <el-table-column prop="type" label="数据类型" width="120" />
            <el-table-column prop="nullable" label="可空" width="80">
              <template #default="{ row }">
                <el-tag :type="row.nullable ? 'warning' : 'success'">
                  {{ row.nullable ? '是' : '否' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="血缘关系">
          <div class="mb-4">
            <h4 class="mb-2">上游依赖</h4>
            <el-table :data="upstreamNodes" style="width: 100%">
              <el-table-column prop="name" label="节点名称" />
              <el-table-column prop="type" label="类型" />
              <el-table-column prop="dataSource" label="数据源" />
            </el-table>
          </div>
          <div>
            <h4 class="mb-2">下游影响</h4>
            <el-table :data="downstreamNodes" style="width: 100%">
              <el-table-column prop="name" label="节点名称" />
              <el-table-column prop="type" label="类型" />
              <el-table-column prop="dataSource" label="数据源" />
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Plus, Minus, Download, Refresh, ZoomIn, ZoomOut, FullScreen, Coin, Document, DataAnalysis } from '@element-plus/icons-vue'

// 搜索表单
const searchForm = reactive({
  dataSource: '',
  tableName: '',
  fieldName: ''
})

// 缩放级别
const zoomLevel = ref(1)

// 血缘容器引用
const lineageContainerRef = ref<HTMLElement>()

// 选中的节点
const selectedNode = ref<any>(null)

// 详情对话框
const detailDialogVisible = ref(false)

// 上游节点
const upstreamNodes = ref<any[]>([])
// 当前节点
const currentNodes = ref<any[]>([])
// 下游节点
const downstreamNodes = ref<any[]>([])

// 连接线
const connectionLines = computed(() => {
  const lines: any[] = []
  if (upstreamNodes.value.length > 0 && currentNodes.value.length > 0) {
    // 简单的连接线计算（实际应该根据节点位置计算）
    for (let i = 0; i < Math.min(upstreamNodes.value.length, 3); i++) {
      lines.push({
        x1: 300 + (i * 50),
        y1: 150,
        x2: 600 + (i * 50),
        y2: 150
      })
    }
  }
  return lines
})

const downstreamLines = computed(() => {
  const lines: any[] = []
  if (currentNodes.value.length > 0 && downstreamNodes.value.length > 0) {
    for (let i = 0; i < Math.min(downstreamNodes.value.length, 3); i++) {
      lines.push({
        x1: 600 + (i * 50),
        y1: 150,
        x2: 900 + (i * 50),
        y2: 150
      })
    }
  }
  return lines
})

// Mock数据生成
const generateMockLineageData = () => {
  // 上游节点
  const upstream: any[] = []
  for (let i = 1; i <= 5; i++) {
    upstream.push({
      id: `upstream_${i}`,
      name: `数据源_${i}`,
      type: ['MySQL', 'PostgreSQL', 'Oracle', 'API', '文件'][Math.floor(Math.random() * 5)],
      dataSource: `source_${i}`,
      tableName: `table_${i}`,
      fieldCount: Math.floor(Math.random() * 20) + 10,
      dataVolume: `${(Math.random() * 1000).toFixed(2)}GB`,
      createTime: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toLocaleString('zh-CN'),
      updateTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleString('zh-CN'),
      description: `上游数据源${i}的描述信息`,
      fields: Array.from({ length: 5 }, (_, j) => ({
        name: `field_${j}`,
        type: ['VARCHAR', 'INT', 'DECIMAL', 'DATE', 'TIMESTAMP'][Math.floor(Math.random() * 5)],
        nullable: Math.random() > 0.5,
        description: `字段${j}的描述`
      }))
    })
  }

  // 当前节点
  const current: any[] = [{
    id: 'current_1',
    name: searchForm.tableName || '当前数据表',
    type: '数据表',
    dataSource: searchForm.dataSource || '当前数据源',
    tableName: searchForm.tableName || 'table_current',
    fieldCount: 25,
    dataVolume: '500GB',
    createTime: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toLocaleString('zh-CN'),
    updateTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleString('zh-CN'),
    description: '当前节点的描述信息',
    fields: Array.from({ length: 10 }, (_, j) => ({
      name: `field_${j}`,
      type: ['VARCHAR', 'INT', 'DECIMAL', 'DATE'][Math.floor(Math.random() * 4)],
      nullable: Math.random() > 0.5,
      description: `字段${j}的描述`
    }))
  }]

  // 下游节点
  const downstream: any[] = []
  for (let i = 1; i <= 6; i++) {
    downstream.push({
      id: `downstream_${i}`,
      name: `消费端_${i}`,
      type: ['报表', '分析', 'API', '数据仓库', '数据集市'][Math.floor(Math.random() * 5)],
      dataSource: `target_${i}`,
      tableName: `target_table_${i}`,
      fieldCount: Math.floor(Math.random() * 30) + 15,
      dataVolume: `${(Math.random() * 2000).toFixed(2)}GB`,
      createTime: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toLocaleString('zh-CN'),
      updateTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleString('zh-CN'),
      description: `下游消费端${i}的描述信息`,
      fields: Array.from({ length: 8 }, (_, j) => ({
        name: `field_${j}`,
        type: ['VARCHAR', 'INT', 'DECIMAL'][Math.floor(Math.random() * 3)],
        nullable: Math.random() > 0.5,
        description: `字段${j}的描述`
      }))
    })
  }

  return { upstream, current, downstream }
}

// 加载数据
const loadData = () => {
  const { upstream, current, downstream } = generateMockLineageData()
  upstreamNodes.value = upstream
  currentNodes.value = current
  downstreamNodes.value = downstream
  if (current.length > 0) {
    selectedNode.value = current[0]
  }
}

// 搜索
const handleSearch = () => {
  loadData()
  ElMessage.success('查询成功')
}

// 重置
const handleReset = () => {
  searchForm.dataSource = ''
  searchForm.tableName = ''
  searchForm.fieldName = ''
  loadData()
}

// 刷新
const handleRefresh = () => {
  loadData()
}

// 展开全部
const handleExpandAll = () => {
  ElMessage.info('展开全部节点')
}

// 收起全部
const handleCollapseAll = () => {
  ElMessage.info('收起全部节点')
}

// 导出
const handleExport = () => {
  ElMessage.success('导出成功')
}

// 放大
const handleZoomIn = () => {
  zoomLevel.value = Math.min(zoomLevel.value + 0.1, 2)
}

// 缩小
const handleZoomOut = () => {
  zoomLevel.value = Math.max(zoomLevel.value - 0.1, 0.5)
}

// 重置缩放
const handleResetZoom = () => {
  zoomLevel.value = 1
}

// 节点点击
const handleNodeClick = (node: any) => {
  selectedNode.value = node
}

// 查看完整详情
const handleViewFullDetail = () => {
  if (selectedNode.value) {
    detailDialogVisible.value = true
  } else {
    ElMessage.warning('请先选择一个节点')
  }
}

// 分析影响范围
const handleAnalyzeImpact = () => {
  ElMessage.success('开始分析影响范围...')
  setTimeout(() => {
    ElMessage.success(`分析完成：影响 ${downstreamNodes.value.length} 个下游节点`)
  }, 1000)
}

// 溯源追踪
const handleTraceSource = () => {
  ElMessage.success('开始溯源追踪...')
  setTimeout(() => {
    ElMessage.success(`追踪完成：依赖 ${upstreamNodes.value.length} 个上游节点`)
  }, 1000)
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.lineage-container {
  width: 100%;
  height: 500px;
  overflow: auto;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: #f5f7fa;
  position: relative;
}

.lineage-canvas {
  min-width: 1200px;
  min-height: 400px;
  padding: 40px;
  transform-origin: top left;
}

.lineage-section {
  display: inline-block;
  vertical-align: top;
  margin: 0 20px;
  min-width: 250px;

  &.upstream {
    .lineage-node {
      border-color: #409EFF;
    }
  }

  &.current {
    .lineage-node {
      border-color: #E6A23C;
    }
  }

  &.downstream {
    .lineage-node {
      border-color: #67C23A;
    }
  }
}

.section-title {
  font-weight: bold;
  font-size: 14px;
  color: #606266;
  margin-bottom: 15px;
  text-align: center;
}

.nodes-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.lineage-node {
  background: #fff;
  border: 2px solid #dcdfe6;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 200px;
  text-align: center;

  &:hover {
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  &.active {
    border-color: #409EFF;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  }

  .node-icon {
    font-size: 32px;
    color: #409EFF;
    margin-bottom: 10px;
  }

  .node-label {
    font-weight: bold;
    font-size: 14px;
    color: #303133;
    margin-bottom: 5px;
  }

  .node-info {
    font-size: 12px;
    color: #909399;
  }
}

.lineage-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}
</style>
