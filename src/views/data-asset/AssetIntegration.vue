<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'

// 状态类型定义
type AssetStatus = 'archived' | 'processing' | 'pending' | 'error'
type QualityLevel = 'excellent' | 'good' | 'fair' | 'poor'
type DataSourceType = 'database' | 'api' | 'file'

// 接口定义
interface StatCard {
  title: string
  value: string | number
  unit?: string
  icon: string
  color: string
  trend?: string
}

interface DataSource {
  id: string
  name: string
  type: DataSourceType
  status: 'connected' | 'disconnected' | 'connecting'
  lastSync: string
  recordCount: number
}

interface AssetItem {
  id: string
  name: string
  category: string
  status: AssetStatus
  quality: QualityLevel
  dataVolume: string
  source: string
  createTime: string
  archiveTime?: string
  description: string
}

interface TreeNode {
  id: string
  label: string
  count: number
  children?: TreeNode[]
}

interface ArchiveTask {
  id: string
  name: string
  status: 'running' | 'completed' | 'pending' | 'failed'
  progress: number
  startTime: string
}

// 响应式数据
const loading = ref(false)
const activeTab = ref('overview')

// 统计数据
const statCards = ref<StatCard[]>([
  { title: '资产总数', value: 0, unit: '个', icon: '📊', color: '#409EFF', trend: '+12.5%' },
  { title: '数据总量', value: 0, unit: 'GB', icon: '💾', color: '#67C23A', trend: '+8.3%' },
  { title: '归档率', value: 0, unit: '%', icon: '📁', color: '#E6A23C', trend: '+5.2%' },
  { title: '质量评分', value: 0, unit: '分', icon: '⭐', color: '#F56C6C', trend: '+3.1%' }
])

// 资产目录树
const assetTree = ref<TreeNode[]>([])
const defaultProps = {
  children: 'children',
  label: 'label'
}
const selectedCategory = ref('')

// 数据源列表
const dataSources = ref<DataSource[]>([])
const showAddSourceDialog = ref(false)
const newDataSource = reactive({
  name: '',
  type: 'database' as DataSourceType,
  config: ''
})

// 资产列表
const assetList = ref<AssetItem[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchKeyword = ref('')
const selectedAsset = ref<AssetItem | null>(null)

// 归档任务
const archiveTasks = ref<ArchiveTask[]>([])
const showArchiveDialog = ref(false)
const archiveForm = reactive({
  category: '',
  strategy: 'auto',
  storageLevel: 'standard'
})

// 计算属性
const filteredAssets = computed(() => {
  let list = assetList.value
  
  if (selectedCategory.value) {
    list = list.filter(item => item.category === selectedCategory.value)
  }
  
  if (searchKeyword.value) {
    list = list.filter(item => 
      item.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      item.description.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }
  
  return list
})

const paginatedAssets = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredAssets.value.slice(start, end)
})

// 状态配置
const statusConfig = {
  archived: { label: '已归档', color: 'success', icon: '✓' },
  processing: { label: '处理中', color: 'primary', icon: '⟳' },
  pending: { label: '待归档', color: 'warning', icon: '⏳' },
  error: { label: '异常', color: 'danger', icon: '✗' }
}

const qualityConfig = {
  excellent: { label: '优秀', color: 'success', score: '90-100' },
  good: { label: '良好', color: 'primary', score: '75-89' },
  fair: { label: '一般', color: 'warning', score: '60-74' },
  poor: { label: '需改进', color: 'danger', score: '<60' }
}

// Mock 数据生成函数
const generateMockData = () => {
  // 生成统计数据
  setTimeout(() => {
    statCards.value[0].value = 1248
    statCards.value[1].value = 3567.8
    statCards.value[2].value = 87.5
    statCards.value[3].value = 86.2
  }, 500)

  // 生成资产目录树
  setTimeout(() => {
    assetTree.value = [
      {
        id: '1',
        label: '农业生产数据',
        count: 456,
        children: [
          { id: '1-1', label: '种植数据', count: 180 },
          { id: '1-2', label: '养殖数据', count: 156 },
          { id: '1-3', label: '农机作业数据', count: 120 }
        ]
      },
      {
        id: '2',
        label: '市场交易数据',
        count: 320,
        children: [
          { id: '2-1', label: '产品销售数据', count: 180 },
          { id: '2-2', label: '价格行情数据', count: 140 }
        ]
      },
      {
        id: '3',
        label: '环境监测数据',
        count: 280,
        children: [
          { id: '3-1', label: '气象数据', count: 120 },
          { id: '3-2', label: '土壤数据', count: 90 },
          { id: '3-3', label: '水质数据', count: 70 }
        ]
      },
      {
        id: '4',
        label: '溯源认证数据',
        count: 192,
        children: [
          { id: '4-1', label: '产品溯源数据', count: 120 },
          { id: '4-2', label: '质量认证数据', count: 72 }
        ]
      }
    ]
  }, 600)

  // 生成数据源列表
  setTimeout(() => {
    dataSources.value = [
      {
        id: 'ds-1',
        name: '园区生产管理系统',
        type: 'database',
        status: 'connected',
        lastSync: '2025-10-30 10:30:00',
        recordCount: 125680
      },
      {
        id: 'ds-2',
        name: '物联网数据采集API',
        type: 'api',
        status: 'connected',
        lastSync: '2025-10-30 10:28:00',
        recordCount: 568920
      },
      {
        id: 'ds-3',
        name: '交易平台数据',
        type: 'database',
        status: 'connected',
        lastSync: '2025-10-30 09:45:00',
        recordCount: 89340
      },
      {
        id: 'ds-4',
        name: '气象数据文件',
        type: 'file',
        status: 'disconnected',
        lastSync: '2025-10-29 18:00:00',
        recordCount: 45120
      }
    ]
  }, 700)

  // 生成资产列表
  setTimeout(() => {
    const categories = ['种植数据', '养殖数据', '农机作业数据', '产品销售数据', '价格行情数据', '气象数据', '土壤数据', '产品溯源数据']
    const statuses: AssetStatus[] = ['archived', 'processing', 'pending', 'error']
    const qualities: QualityLevel[] = ['excellent', 'good', 'fair', 'poor']
    const sources = ['园区生产管理系统', '物联网数据采集API', '交易平台数据', '气象数据文件']
    
    const assets: AssetItem[] = []
    for (let i = 1; i <= 50; i++) {
      assets.push({
        id: `asset-${i}`,
        name: `数据资产_${i}_${categories[Math.floor(Math.random() * categories.length)]}`,
        category: categories[Math.floor(Math.random() * categories.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        quality: qualities[Math.floor(Math.random() * qualities.length)],
        dataVolume: `${(Math.random() * 100).toFixed(2)} GB`,
        source: sources[Math.floor(Math.random() * sources.length)],
        createTime: `2025-10-${String(Math.floor(Math.random() * 30) + 1).padStart(2, '0')} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
        archiveTime: Math.random() > 0.5 ? `2025-10-${String(Math.floor(Math.random() * 30) + 1).padStart(2, '0')} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00` : undefined,
        description: `该数据资产包含园区农业生产过程中产生的关键业务数据，已通过数据质量检验和标准化处理。`
      })
    }
    assetList.value = assets
    total.value = assets.length
  }, 800)

  // 生成归档任务
  setTimeout(() => {
    archiveTasks.value = [
      {
        id: 'task-1',
        name: '种植数据归档任务',
        status: 'running',
        progress: 65,
        startTime: '2025-10-30 09:30:00'
      },
      {
        id: 'task-2',
        name: '气象数据归档任务',
        status: 'completed',
        progress: 100,
        startTime: '2025-10-30 08:00:00'
      },
      {
        id: 'task-3',
        name: '交易数据归档任务',
        status: 'pending',
        progress: 0,
        startTime: '2025-10-30 11:00:00'
      }
    ]
  }, 900)
}

// 方法
const handleNodeClick = (data: TreeNode) => {
  selectedCategory.value = data.label
  currentPage.value = 1
}

const handleViewAsset = (row: AssetItem) => {
  selectedAsset.value = row
}

const handleSyncDataSource = (source: DataSource) => {
  source.status = 'connecting'
  setTimeout(() => {
    source.status = 'connected'
    source.lastSync = new Date().toLocaleString('zh-CN')
    ElMessage.success(`数据源 ${source.name} 同步成功`)
  }, 2000)
}

const handleAddDataSource = () => {
  if (!newDataSource.name) {
    ElMessage.warning('请输入数据源名称')
    return
  }
  
  loading.value = true
  setTimeout(() => {
    dataSources.value.push({
      id: `ds-${Date.now()}`,
      name: newDataSource.name,
      type: newDataSource.type,
      status: 'disconnected',
      lastSync: '-',
      recordCount: 0
    })
    showAddSourceDialog.value = false
    newDataSource.name = ''
    newDataSource.type = 'database'
    newDataSource.config = ''
    loading.value = false
    ElMessage.success('数据源添加成功')
  }, 1000)
}

const handleArchiveAsset = (asset?: AssetItem) => {
  if (asset) {
    archiveForm.category = asset.category
  }
  showArchiveDialog.value = true
}

const handleStartArchive = () => {
  loading.value = true
  setTimeout(() => {
    const newTask: ArchiveTask = {
      id: `task-${Date.now()}`,
      name: `${archiveForm.category}归档任务`,
      status: 'running',
      progress: 0,
      startTime: new Date().toLocaleString('zh-CN')
    }
    archiveTasks.value.unshift(newTask)
    
    // 模拟进度更新
    const interval = setInterval(() => {
      newTask.progress += 10
      if (newTask.progress >= 100) {
        newTask.status = 'completed'
        clearInterval(interval)
      }
    }, 500)
    
    showArchiveDialog.value = false
    loading.value = false
    ElMessage.success('归档任务已启动')
  }, 1000)
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleResetSearch = () => {
  searchKeyword.value = ''
  selectedCategory.value = ''
  currentPage.value = 1
}

const getStatusIcon = (status: AssetStatus) => {
  return statusConfig[status]?.icon || ''
}

const getSourceTypeLabel = (type: DataSourceType) => {
  const labels = {
    database: '数据库',
    api: 'API接口',
    file: '文件'
  }
  return labels[type]
}

// 生命周期
onMounted(() => {
  loading.value = true
  generateMockData()
  setTimeout(() => {
    loading.value = false
  }, 1000)
})
</script>

<template>
  <div class="asset-integration-container" v-loading="loading">
    <!-- 数据资产概览 -->
    <div class="overview-section">
      <el-row :gutter="20">
        <el-col :span="6" v-for="card in statCards" :key="card.title">
          <el-card class="stat-card" :body-style="{ padding: '20px' }">
            <div class="stat-content">
              <div class="stat-icon" :style="{ background: card.color + '20', color: card.color }">
                {{ card.icon }}
              </div>
              <div class="stat-info">
                <div class="stat-title">{{ card.title }}</div>
                <div class="stat-value">
                  <span class="value">{{ card.value }}</span>
                  <span class="unit" v-if="card.unit">{{ card.unit }}</span>
                </div>
                <div class="stat-trend" v-if="card.trend">
                  <span class="trend-label">较上月</span>
                  <span class="trend-value" :class="{ positive: card.trend.startsWith('+') }">
                    {{ card.trend }}
                  </span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 主要功能区 -->
    <div class="main-content">
      <el-row :gutter="20">
        <!-- 左侧：资产目录树 -->
        <el-col :span="5">
          <el-card class="tree-card">
            <template #header>
              <div class="card-header">
                <span class="header-title">📂 资产目录</span>
              </div>
            </template>
            <el-tree
              :data="assetTree"
              :props="defaultProps"
              :default-expand-all="true"
              @node-click="handleNodeClick"
              class="asset-tree"
            >
              <template #default="{ data }">
                <span class="tree-node">
                  <span class="node-label">{{ data.label }}</span>
                  <span class="node-count">{{ data.count }}</span>
                </span>
              </template>
            </el-tree>
          </el-card>
        </el-col>

        <!-- 中间：资产列表和详情 -->
        <el-col :span="12">
          <el-card class="list-card">
            <template #header>
              <div class="card-header">
                <span class="header-title">📋 资产列表</span>
                <div class="search-box">
                  <el-input
                    v-model="searchKeyword"
                    placeholder="搜索资产名称或描述"
                    clearable
                    @clear="handleResetSearch"
                    style="width: 250px; margin-right: 10px"
                  >
                    <template #prefix>
                      <span>🔍</span>
                    </template>
                  </el-input>
                  <el-button type="primary" @click="handleSearch">搜索</el-button>
                  <el-button @click="handleResetSearch">重置</el-button>
                </div>
              </div>
            </template>

            <!-- 资产表格 -->
            <el-table :data="paginatedAssets" style="width: 100%" stripe>
              <el-table-column prop="name" label="资产名称" width="180" show-overflow-tooltip />
              <el-table-column prop="category" label="分类" width="100" />
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="statusConfig[row.status].color" size="small">
                    {{ getStatusIcon(row.status) }} {{ statusConfig[row.status].label }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="质量" width="90">
                <template #default="{ row }">
                  <el-tag :type="qualityConfig[row.quality].color" size="small">
                    {{ qualityConfig[row.quality].label }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="dataVolume" label="数据量" width="100" />
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="handleViewAsset(row)">
                    查看详情
                  </el-button>
                  <el-button 
                    link 
                    type="warning" 
                    size="small" 
                    @click="handleArchiveAsset(row)"
                    v-if="row.status === 'pending'"
                  >
                    归档
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :total="filteredAssets.length"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              style="margin-top: 20px; justify-content: center"
            />
          </el-card>

          <!-- 资产详情 -->
          <el-card class="detail-card" v-if="selectedAsset" style="margin-top: 20px">
            <template #header>
              <div class="card-header">
                <span class="header-title">📄 资产详情</span>
                <el-button text @click="selectedAsset = null">关闭</el-button>
              </div>
            </template>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="资产ID">{{ selectedAsset.id }}</el-descriptions-item>
              <el-descriptions-item label="资产名称">{{ selectedAsset.name }}</el-descriptions-item>
              <el-descriptions-item label="分类">{{ selectedAsset.category }}</el-descriptions-item>
              <el-descriptions-item label="数据源">{{ selectedAsset.source }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="statusConfig[selectedAsset.status].color">
                  {{ statusConfig[selectedAsset.status].label }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="质量等级">
                <el-tag :type="qualityConfig[selectedAsset.quality].color">
                  {{ qualityConfig[selectedAsset.quality].label }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="数据量">{{ selectedAsset.dataVolume }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ selectedAsset.createTime }}</el-descriptions-item>
              <el-descriptions-item label="归档时间" v-if="selectedAsset.archiveTime">
                {{ selectedAsset.archiveTime }}
              </el-descriptions-item>
              <el-descriptions-item label="描述" :span="2">
                {{ selectedAsset.description }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>

        <!-- 右侧：数据接入和归档操作 -->
        <el-col :span="7">
          <!-- 数据源管理 -->
          <el-card class="source-card">
            <template #header>
              <div class="card-header">
                <span class="header-title">🔌 数据源管理</span>
                <el-button type="primary" size="small" @click="showAddSourceDialog = true">
                  添加数据源
                </el-button>
              </div>
            </template>
            <div class="source-list">
              <div v-for="source in dataSources" :key="source.id" class="source-item">
                <div class="source-header">
                  <span class="source-name">{{ source.name }}</span>
                  <el-tag 
                    :type="source.status === 'connected' ? 'success' : source.status === 'connecting' ? 'warning' : 'info'"
                    size="small"
                  >
                    {{ source.status === 'connected' ? '已连接' : source.status === 'connecting' ? '连接中' : '未连接' }}
                  </el-tag>
                </div>
                <div class="source-info">
                  <div class="info-item">
                    <span class="label">类型：</span>
                    <span>{{ getSourceTypeLabel(source.type) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">记录数：</span>
                    <span>{{ source.recordCount.toLocaleString() }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">最后同步：</span>
                    <span>{{ source.lastSync }}</span>
                  </div>
                </div>
                <div class="source-actions">
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click="handleSyncDataSource(source)"
                    :loading="source.status === 'connecting'"
                  >
                    {{ source.status === 'connecting' ? '同步中' : '立即同步' }}
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 归档任务 -->
          <el-card class="archive-card" style="margin-top: 20px">
            <template #header>
              <div class="card-header">
                <span class="header-title">⚙️ 归档任务</span>
                <el-button type="warning" size="small" @click="handleArchiveAsset()">
                  创建归档任务
                </el-button>
              </div>
            </template>
            <div class="task-list">
              <div v-for="task in archiveTasks" :key="task.id" class="task-item">
                <div class="task-header">
                  <span class="task-name">{{ task.name }}</span>
                  <el-tag 
                    :type="task.status === 'completed' ? 'success' : task.status === 'running' ? 'primary' : task.status === 'pending' ? 'info' : 'danger'"
                    size="small"
                  >
                    {{ task.status === 'completed' ? '已完成' : task.status === 'running' ? '运行中' : task.status === 'pending' ? '待执行' : '失败' }}
                  </el-tag>
                </div>
                <div class="task-progress">
                  <el-progress 
                    :percentage="task.progress" 
                    :status="task.status === 'completed' ? 'success' : task.status === 'failed' ? 'exception' : undefined"
                  />
                </div>
                <div class="task-time">
                  <span class="label">开始时间：</span>
                  <span>{{ task.startTime }}</span>
                </div>
              </div>
              <el-empty v-if="archiveTasks.length === 0" description="暂无归档任务" :image-size="80" />
            </div>
          </el-card>

          <!-- 快捷操作 -->
          <el-card class="quick-actions" style="margin-top: 20px">
            <template #header>
              <span class="header-title">⚡ 快捷操作</span>
            </template>
            <div class="action-buttons">
              <el-button type="primary" style="width: 100%; margin-bottom: 10px">
                📊 数据质量报告
              </el-button>
              <el-button type="success" style="width: 100%; margin-bottom: 10px">
                🔄 批量标准化
              </el-button>
              <el-button type="warning" style="width: 100%; margin-bottom: 10px">
                📁 批量归档
              </el-button>
              <el-button type="info" style="width: 100%">
                📤 数据导出
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 添加数据源对话框 -->
    <el-dialog
      v-model="showAddSourceDialog"
      title="添加数据源"
      width="500px"
    >
      <el-form :model="newDataSource" label-width="100px">
        <el-form-item label="数据源名称">
          <el-input v-model="newDataSource.name" placeholder="请输入数据源名称" />
        </el-form-item>
        <el-form-item label="数据源类型">
          <el-select v-model="newDataSource.type" style="width: 100%">
            <el-option label="数据库" value="database" />
            <el-option label="API接口" value="api" />
            <el-option label="文件" value="file" />
          </el-select>
        </el-form-item>
        <el-form-item label="连接配置">
          <el-input
            v-model="newDataSource.config"
            type="textarea"
            :rows="4"
            placeholder="请输入连接配置信息（JSON格式）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddSourceDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddDataSource" :loading="loading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 创建归档任务对话框 -->
    <el-dialog
      v-model="showArchiveDialog"
      title="创建归档任务"
      width="500px"
    >
      <el-form :model="archiveForm" label-width="100px">
        <el-form-item label="数据分类">
          <el-input v-model="archiveForm.category" placeholder="请输入数据分类" />
        </el-form-item>
        <el-form-item label="归档策略">
          <el-select v-model="archiveForm.strategy" style="width: 100%">
            <el-option label="自动归档" value="auto" />
            <el-option label="手动审核" value="manual" />
            <el-option label="定时归档" value="scheduled" />
          </el-select>
        </el-form-item>
        <el-form-item label="存储级别">
          <el-select v-model="archiveForm.storageLevel" style="width: 100%">
            <el-option label="标准存储" value="standard" />
            <el-option label="低频存储" value="infrequent" />
            <el-option label="归档存储" value="archive" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showArchiveDialog = false">取消</el-button>
        <el-button type="primary" @click="handleStartArchive" :loading="loading">
          启动归档
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.asset-integration-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;

  .overview-section {
    margin-bottom: 20px;

    .stat-card {
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .stat-content {
        display: flex;
        align-items: center;

        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          margin-right: 15px;
        }

        .stat-info {
          flex: 1;

          .stat-title {
            font-size: 14px;
            color: #909399;
            margin-bottom: 8px;
          }

          .stat-value {
            display: flex;
            align-items: baseline;
            margin-bottom: 5px;

            .value {
              font-size: 28px;
              font-weight: bold;
              color: #303133;
              margin-right: 5px;
            }

            .unit {
              font-size: 14px;
              color: #909399;
            }
          }

          .stat-trend {
            font-size: 12px;

            .trend-label {
              color: #909399;
              margin-right: 5px;
            }

            .trend-value {
              color: #F56C6C;

              &.positive {
                color: #67C23A;
              }
            }
          }
        }
      }
    }
  }

  .main-content {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-title {
        font-size: 16px;
        font-weight: bold;
        color: #303133;
      }

      .search-box {
        display: flex;
        align-items: center;
      }
    }

    .tree-card {
      height: calc(100vh - 280px);

      .asset-tree {
        .tree-node {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-right: 10px;

          .node-label {
            font-size: 14px;
          }

          .node-count {
            font-size: 12px;
            color: #909399;
            background: #f4f4f5;
            padding: 2px 8px;
            border-radius: 10px;
          }
        }
      }
    }

    .list-card {
      height: auto;
    }

    .detail-card {
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
    }

    .source-card,
    .archive-card {
      .source-list,
      .task-list {
        max-height: 400px;
        overflow-y: auto;
      }

      .source-item,
      .task-item {
        padding: 15px;
        background: #f9fafb;
        border-radius: 8px;
        margin-bottom: 12px;

        &:last-child {
          margin-bottom: 0;
        }

        .source-header,
        .task-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;

          .source-name,
          .task-name {
            font-size: 14px;
            font-weight: 500;
            color: #303133;
          }
        }

        .source-info {
          margin-bottom: 10px;

          .info-item {
            display: flex;
            font-size: 12px;
            color: #606266;
            margin-bottom: 5px;

            .label {
              color: #909399;
              margin-right: 5px;
            }
          }
        }

        .task-progress {
          margin-bottom: 10px;
        }

        .task-time {
          font-size: 12px;
          color: #909399;

          .label {
            margin-right: 5px;
          }
        }

        .source-actions {
          display: flex;
          justify-content: flex-end;
        }
      }
    }

    .quick-actions {
      .action-buttons {
        display: flex;
        flex-direction: column;
      }
    }
  }
}
</style>