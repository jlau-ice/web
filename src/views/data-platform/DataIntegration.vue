<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { 
  Search, 
  Plus, 
  Refresh, 
  Delete, 
  Edit, 
  VideoPlay, 
  VideoPause,
  Setting,
  Connection,
  DocumentCopy,
  Warning,
  CircleCheck,
  CircleClose,
  Document,
  DataAnalysis,
  TrendCharts
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// ==================== 类型定义 ====================
interface DataSource {
  id: string
  name: string
  type: string
  status: 'online' | 'offline' | 'warning' | 'error'
  lastSync: string
  dataVolume: string
  frequency: string
  quality: number
}

interface CollectionTask {
  id: string
  sourceName: string
  progress: number
  status: 'running' | 'paused' | 'completed' | 'failed'
  speed: string
  totalRecords: number
  currentRecords: number
}

interface CleansingRule {
  id: string
  name: string
  type: string
  enabled: boolean
  description: string
}

interface LineageNode {
  id: string
  name: string
  type: string
  level: number
}

interface QualityMetric {
  name: string
  score: number
  status: 'excellent' | 'good' | 'fair' | 'poor'
  issues: number
}

// ==================== 响应式数据 ====================
const loading = ref(true)
const activeTab = ref('datasource')
const searchKeyword = ref('')
const selectedType = ref('')
const selectedStatus = ref('')

// 数据源分类
const dataSourceCategories = ref([
  { name: '全部数据源', count: 0, type: 'all' },
  { name: '业务系统', count: 0, type: 'business' },
  { name: '物联网设备', count: 0, type: 'iot' },
  { name: '第三方平台', count: 0, type: 'thirdparty' },
  { name: '文件数据', count: 0, type: 'file' }
])

// 数据源列表
const dataSources = ref<DataSource[]>([])

// 采集任务列表
const collectionTasks = ref<CollectionTask[]>([])

// 清洗规则列表
const cleansingRules = ref<CleansingRule[]>([])

// 血缘节点列表
const lineageNodes = ref<LineageNode[]>([])

// 数据质量指标
const qualityMetrics = ref<QualityMetric[]>([])

// 统计数据
const statistics = reactive({
  totalSources: 0,
  onlineSources: 0,
  todayVolume: '0 GB',
  avgQuality: 0,
  totalRecords: '0',
  collectionSpeed: '0 条/秒'
})

// ==================== 计算属性 ====================
const filteredDataSources = computed(() => {
  let result = dataSources.value

  // 按关键词搜索
  if (searchKeyword.value) {
    result = result.filter(item => 
      item.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }

  // 按类型筛选
  if (selectedType.value) {
    result = result.filter(item => item.type === selectedType.value)
  }

  // 按状态筛选
  if (selectedStatus.value) {
    result = result.filter(item => item.status === selectedStatus.value)
  }

  return result
})

const dataTypes = computed(() => {
  const types = new Set(dataSources.value.map(item => item.type))
  return Array.from(types)
})

// ==================== Mock 数据生成 ====================
const generateMockData = () => {
  // Mock 数据源
  const sourceTypes = ['业务系统', '物联网设备', '第三方平台', '文件数据']
  const statuses: Array<'online' | 'offline' | 'warning' | 'error'> = ['online', 'offline', 'warning', 'error']
  
  dataSources.value = Array.from({ length: 15 }, (_, i) => ({
    id: `ds-${i + 1}`,
    name: `数据源-${['采购管理系统', '仓储WMS系统', '销售ERP系统', '生产MES系统', '温湿度传感器', '能耗监测系统', '物流TMS系统', '财务系统', 'CRM系统', '质检系统', '设备监控平台', '供应链系统', '电商平台', '移动APP', '第三方数据'][i]}`,
    type: sourceTypes[Math.floor(Math.random() * sourceTypes.length)],
    status: i < 10 ? 'online' : statuses[Math.floor(Math.random() * statuses.length)],
    lastSync: new Date(Date.now() - Math.random() * 3600000).toLocaleString('zh-CN'),
    dataVolume: `${(Math.random() * 500 + 50).toFixed(2)} GB`,
    frequency: ['实时', '每5分钟', '每小时', '每天'][Math.floor(Math.random() * 4)],
    quality: Math.floor(Math.random() * 30 + 70)
  }))

  // Mock 采集任务
  collectionTasks.value = Array.from({ length: 6 }, (_, i) => ({
    id: `task-${i + 1}`,
    sourceName: dataSources.value[i].name,
    progress: Math.floor(Math.random() * 100),
    status: (['running', 'paused', 'completed', 'failed'] as const)[Math.floor(Math.random() * 4)],
    speed: `${Math.floor(Math.random() * 5000 + 1000)} 条/秒`,
    totalRecords: Math.floor(Math.random() * 1000000 + 100000),
    currentRecords: Math.floor(Math.random() * 800000)
  }))

  // Mock 清洗规则
  cleansingRules.value = [
    { id: 'rule-1', name: '空值处理规则', type: '数据补全', enabled: true, description: '自动填充或删除空值字段' },
    { id: 'rule-2', name: '数据格式标准化', type: '格式转换', enabled: true, description: '统一日期、金额等字段格式' },
    { id: 'rule-3', name: '重复数据去重', type: '去重规则', enabled: true, description: '基于主键识别并去除重复记录' },
    { id: 'rule-4', name: '异常值检测', type: '质量校验', enabled: false, description: '检测并标记超出正常范围的数据' },
    { id: 'rule-5', name: '数据脱敏规则', type: '安全处理', enabled: true, description: '对敏感信息进行脱敏处理' },
    { id: 'rule-6', name: '字段映射转换', type: '格式转换', enabled: true, description: '将源字段映射到目标数据模型' }
  ]

  // Mock 血缘节点
  lineageNodes.value = [
    { id: 'node-1', name: '采购系统源表', type: 'source', level: 1 },
    { id: 'node-2', name: '数据采集层', type: 'collection', level: 2 },
    { id: 'node-3', name: '数据清洗层', type: 'cleansing', level: 3 },
    { id: 'node-4', name: '数据标准化层', type: 'standardization', level: 4 },
    { id: 'node-5', name: '数据湖存储', type: 'storage', level: 5 },
    { id: 'node-6', name: '业务主题库', type: 'mart', level: 6 }
  ]

  // Mock 质量指标
  qualityMetrics.value = [
    { name: '数据完整性', score: 95, status: 'excellent', issues: 2 },
    { name: '数据准确性', score: 88, status: 'good', issues: 5 },
    { name: '数据一致性', score: 92, status: 'excellent', issues: 3 },
    { name: '数据及时性', score: 78, status: 'fair', issues: 8 },
    { name: '数据唯一性', score: 85, status: 'good', issues: 6 }
  ]

  // 更新统计数据
  statistics.totalSources = dataSources.value.length
  statistics.onlineSources = dataSources.value.filter(item => item.status === 'online').length
  statistics.todayVolume = `${(Math.random() * 100 + 50).toFixed(2)} GB`
  statistics.avgQuality = Math.floor(dataSources.value.reduce((sum, item) => sum + item.quality, 0) / dataSources.value.length)
  statistics.totalRecords = `${(Math.random() * 1000 + 500).toFixed(0)}万`
  statistics.collectionSpeed = `${(Math.random() * 5000 + 3000).toFixed(0)} 条/秒`

  // 更新分类统计
  dataSourceCategories.value[0].count = dataSources.value.length
  dataSourceCategories.value[1].count = dataSources.value.filter(item => item.type === '业务系统').length
  dataSourceCategories.value[2].count = dataSources.value.filter(item => item.type === '物联网设备').length
  dataSourceCategories.value[3].count = dataSources.value.filter(item => item.type === '第三方平台').length
  dataSourceCategories.value[4].count = dataSources.value.filter(item => item.type === '文件数据').length
}

// ==================== 方法 ====================
const getStatusType = (status: string) => {
  const map: Record<string, any> = {
    online: 'success',
    offline: 'info',
    warning: 'warning',
    error: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    online: '在线',
    offline: '离线',
    warning: '警告',
    error: '异常'
  }
  return map[status] || status
}

const getQualityType = (status: string) => {
  const map: Record<string, any> = {
    excellent: 'success',
    good: 'primary',
    fair: 'warning',
    poor: 'danger'
  }
  return map[status] || 'info'
}

const getQualityText = (status: string) => {
  const map: Record<string, string> = {
    excellent: '优秀',
    good: '良好',
    fair: '一般',
    poor: '差'
  }
  return map[status] || status
}

const getTaskStatusType = (status: string) => {
  const map: Record<string, any> = {
    running: 'success',
    paused: 'warning',
    completed: 'primary',
    failed: 'danger'
  }
  return map[status] || 'info'
}

const getTaskStatusText = (status: string) => {
  const map: Record<string, string> = {
    running: '运行中',
    paused: '已暂停',
    completed: '已完成',
    failed: '失败'
  }
  return map[status] || status
}

const handleCategoryClick = (type: string) => {
  selectedType.value = type === 'all' ? '' : type
}

const handleRefresh = () => {
  loading.value = true
  ElMessage.info('正在刷新数据...')
  setTimeout(() => {
    generateMockData()
    loading.value = false
    ElMessage.success('刷新成功')
  }, 1000)
}

const handleAddSource = () => {
  ElMessage.info('打开添加数据源对话框')
}

const handleEditSource = (row: DataSource) => {
  ElMessage.info(`编辑数据源: ${row.name}`)
}

const handleDeleteSource = (row: DataSource) => {
  ElMessageBox.confirm(
    `确认删除数据源"${row.name}"吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    ElMessage.success('删除成功')
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

const handleSyncSource = (row: DataSource) => {
  ElMessage.success(`已启动数据源"${row.name}"的同步任务`)
}

const handleStartTask = (task: CollectionTask) => {
  task.status = 'running'
  ElMessage.success(`已启动采集任务: ${task.sourceName}`)
}

const handlePauseTask = (task: CollectionTask) => {
  task.status = 'paused'
  ElMessage.warning(`已暂停采集任务: ${task.sourceName}`)
}

const handleToggleRule = (rule: CleansingRule) => {
  rule.enabled = !rule.enabled
  ElMessage.success(`规则"${rule.name}"已${rule.enabled ? '启用' : '禁用'}`)
}

const handleTestRule = (rule: CleansingRule) => {
  ElMessage.info(`正在测试规则: ${rule.name}`)
}

const handleConfigRule = (rule: CleansingRule) => {
  ElMessage.info(`配置规则: ${rule.name}`)
}

const handleViewLineage = (source: DataSource) => {
  activeTab.value = 'lineage'
  ElMessage.info(`查看数据源"${source.name}"的血缘关系`)
}

const handleExportQualityReport = () => {
  ElMessage.success('质量报告导出成功')
}

// ==================== 生命周期 ====================
onMounted(() => {
  setTimeout(() => {
    generateMockData()
    loading.value = false
  }, 800)
})
</script>

<template>
  <div class="data-integration-container">
    <!-- 顶部统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon class="stat-icon" color="#409EFF"><Connection /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.totalSources }}</div>
              <div class="stat-label">数据源总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon class="stat-icon" color="#67C23A"><CircleCheck /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.onlineSources }}</div>
              <div class="stat-label">在线数据源</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon class="stat-icon" color="#E6A23C"><Document /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.todayVolume }}</div>
              <div class="stat-label">今日采集量</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon class="stat-icon" color="#F56C6C"><TrendCharts /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.avgQuality }}%</div>
              <div class="stat-label">平均质量分</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon class="stat-icon" color="#909399"><DataAnalysis /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.totalRecords }}</div>
              <div class="stat-label">累计记录数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon class="stat-icon" color="#409EFF"><VideoPlay /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.collectionSpeed }}</div>
              <div class="stat-label">采集速度</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 主内容区 -->
    <el-row :gutter="16" class="main-content">
      <!-- 左侧：数据源分类导航 -->
      <el-col :span="4">
        <el-card shadow="hover" class="category-card">
          <template #header>
            <div class="card-header">
              <span>数据源分类</span>
            </div>
          </template>
          <div class="category-list">
            <div
              v-for="category in dataSourceCategories"
              :key="category.type"
              class="category-item"
              :class="{ active: selectedType === (category.type === 'all' ? '' : category.type) }"
              @click="handleCategoryClick(category.type)"
            >
              <span class="category-name">{{ category.name }}</span>
              <el-tag size="small" class="category-count">{{ category.count }}</el-tag>
            </div>
          </div>
        </el-card>

        <!-- 数据质量分析面板 -->
        <el-card shadow="hover" class="quality-card" style="margin-top: 16px;">
          <template #header>
            <div class="card-header">
              <span>数据质量分析</span>
              <el-button link type="primary" size="small" @click="handleExportQualityReport">
                导出报告
              </el-button>
            </div>
          </template>
          <div class="quality-metrics">
            <div v-for="metric in qualityMetrics" :key="metric.name" class="metric-item">
              <div class="metric-header">
                <span class="metric-name">{{ metric.name }}</span>
                <el-tag :type="getQualityType(metric.status)" size="small">
                  {{ getQualityText(metric.status) }}
                </el-tag>
              </div>
              <el-progress 
                :percentage="metric.score" 
                :color="metric.score >= 90 ? '#67C23A' : metric.score >= 80 ? '#409EFF' : metric.score >= 70 ? '#E6A23C' : '#F56C6C'"
                :stroke-width="8"
              />
              <div class="metric-footer">
                <span class="metric-score">{{ metric.score }}分</span>
                <span class="metric-issues">{{ metric.issues }}个问题</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 中间和右侧：Tab 切换内容 -->
      <el-col :span="20">
        <el-card shadow="hover" class="content-card">
          <el-tabs v-model="activeTab">
            <!-- 数据源管理 -->
            <el-tab-pane label="数据源管理" name="datasource">
              <div class="toolbar">
                <div class="toolbar-left">
                  <el-input
                    v-model="searchKeyword"
                    placeholder="搜索数据源名称"
                    :prefix-icon="Search"
                    clearable
                    style="width: 240px; margin-right: 12px;"
                  />
                  <el-select
                    v-model="selectedType"
                    placeholder="数据类型"
                    clearable
                    style="width: 140px; margin-right: 12px;"
                  >
                    <el-option
                      v-for="type in dataTypes"
                      :key="type"
                      :label="type"
                      :value="type"
                    />
                  </el-select>
                  <el-select
                    v-model="selectedStatus"
                    placeholder="连接状态"
                    clearable
                    style="width: 140px;"
                  >
                    <el-option label="在线" value="online" />
                    <el-option label="离线" value="offline" />
                    <el-option label="警告" value="warning" />
                    <el-option label="异常" value="error" />
                  </el-select>
                </div>
                <div class="toolbar-right">
                  <el-button :icon="Refresh" @click="handleRefresh">刷新</el-button>
                  <el-button type="primary" :icon="Plus" @click="handleAddSource">
                    添加数据源
                  </el-button>
                </div>
              </div>

              <el-table 
                :data="filteredDataSources" 
                v-loading="loading"
                stripe
                style="width: 100%; margin-top: 16px;"
              >
                <el-table-column prop="name" label="数据源名称" min-width="180" />
                <el-table-column prop="type" label="数据类型" width="120" />
                <el-table-column label="连接状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="getStatusType(row.status)" size="small">
                      {{ getStatusText(row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="lastSync" label="最后同步时间" width="160" />
                <el-table-column prop="dataVolume" label="数据量" width="120" />
                <el-table-column prop="frequency" label="采集频率" width="100" />
                <el-table-column label="数据质量" width="120">
                  <template #default="{ row }">
                    <el-progress 
                      :percentage="row.quality" 
                      :color="row.quality >= 90 ? '#67C23A' : row.quality >= 80 ? '#409EFF' : row.quality >= 70 ? '#E6A23C' : '#F56C6C'"
                    />
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="280" fixed="right">
                  <template #default="{ row }">
                    <el-button link type="primary" size="small" @click="handleSyncSource(row)">
                      同步
                    </el-button>
                    <el-button link type="primary" size="small" @click="handleEditSource(row)">
                      编辑
                    </el-button>
                    <el-button link type="primary" size="small" @click="handleViewLineage(row)">
                      血缘分析
                    </el-button>
                    <el-button link type="danger" size="small" @click="handleDeleteSource(row)">
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>

            <!-- 数据采集监控 -->
            <el-tab-pane label="数据采集监控" name="collection">
              <el-alert
                title="实时监控数据采集任务的执行状态和进度"
                type="info"
                :closable="false"
                style="margin-bottom: 16px;"
              />
              
              <el-row :gutter="16">
                <el-col :span="12" v-for="task in collectionTasks" :key="task.id">
                  <el-card shadow="hover" class="task-card">
                    <div class="task-header">
                      <div class="task-title">
                        <el-icon><Document /></el-icon>
                        <span>{{ task.sourceName }}</span>
                      </div>
                      <el-tag :type="getTaskStatusType(task.status)" size="small">
                        {{ getTaskStatusText(task.status) }}
                      </el-tag>
                    </div>
                    
                    <div class="task-progress">
                      <el-progress 
                        :percentage="task.progress" 
                        :status="task.status === 'failed' ? 'exception' : task.status === 'completed' ? 'success' : undefined"
                        :stroke-width="12"
                      />
                    </div>

                    <el-descriptions :column="2" size="small" class="task-info">
                      <el-descriptions-item label="采集速度">{{ task.speed }}</el-descriptions-item>
                      <el-descriptions-item label="当前记录">{{ task.currentRecords.toLocaleString() }}</el-descriptions-item>
                      <el-descriptions-item label="目标记录">{{ task.totalRecords.toLocaleString() }}</el-descriptions-item>
                      <el-descriptions-item label="完成进度">{{ task.progress }}%</el-descriptions-item>
                    </el-descriptions>

                    <div class="task-actions">
                      <el-button 
                        v-if="task.status !== 'running'"
                        size="small" 
                        type="success" 
                        :icon="VideoPlay"
                        @click="handleStartTask(task)"
                      >
                        启动
                      </el-button>
                      <el-button 
                        v-if="task.status === 'running'"
                        size="small" 
                        type="warning" 
                        :icon="VideoPause"
                        @click="handlePauseTask(task)"
                      >
                        暂停
                      </el-button>
                      <el-button size="small" :icon="Setting">配置</el-button>
                      <el-button size="small" :icon="DocumentCopy">日志</el-button>
                    </div>
                  </el-card>
                </el-col>
              </el-row>
            </el-tab-pane>

            <!-- 数据清洗配置 -->
            <el-tab-pane label="数据清洗配置" name="cleansing">
              <el-alert
                title="配置数据清洗规则，确保数据质量和一致性"
                type="info"
                :closable="false"
                style="margin-bottom: 16px;"
              />

              <el-row :gutter="16">
                <el-col :span="12" v-for="rule in cleansingRules" :key="rule.id">
                  <el-card shadow="hover" class="rule-card">
                    <div class="rule-header">
                      <div class="rule-title">
                        <el-switch 
                          v-model="rule.enabled" 
                          @change="handleToggleRule(rule)"
                        />
                        <span class="rule-name">{{ rule.name }}</span>
                      </div>
                      <el-tag type="primary" size="small">{{ rule.type }}</el-tag>
                    </div>
                    
                    <div class="rule-description">
                      {{ rule.description }}
                    </div>

                    <div class="rule-actions">
                      <el-button size="small" :icon="Setting" @click="handleConfigRule(rule)">
                        配置规则
                      </el-button>
                      <el-button size="small" :icon="VideoPlay" @click="handleTestRule(rule)">
                        测试验证
                      </el-button>
                      <el-button size="small" :icon="DocumentCopy">
                        查看日志
                      </el-button>
                    </div>
                  </el-card>
                </el-col>
              </el-row>
            </el-tab-pane>

            <!-- 数据血缘分析 -->
            <el-tab-pane label="数据血缘分析" name="lineage">
              <el-alert
                title="可视化展示数据从源系统到数据湖的完整流转路径"
                type="info"
                :closable="false"
                style="margin-bottom: 16px;"
              />

              <div class="lineage-container">
                <el-steps direction="vertical" :active="lineageNodes.length">
                  <el-step 
                    v-for="node in lineageNodes" 
                    :key="node.id"
                    :title="node.name"
                    :description="`处理层级: Level ${node.level}`"
                  >
                    <template #icon>
                      <el-icon v-if="node.type === 'source'" color="#409EFF"><Connection /></el-icon>
                      <el-icon v-else-if="node.type === 'collection'" color="#67C23A"><Document /></el-icon>
                      <el-icon v-else-if="node.type === 'cleansing'" color="#E6A23C"><Setting /></el-icon>
                      <el-icon v-else-if="node.type === 'standardization'" color="#F56C6C"><DocumentCopy /></el-icon>
                      <el-icon v-else-if="node.type === 'storage'" color="#909399"><DataAnalysis /></el-icon>
                      <el-icon v-else color="#409EFF"><TrendCharts /></el-icon>
                    </template>
                  </el-step>
                </el-steps>

                <el-card shadow="hover" class="lineage-info-card">
                  <template #header>
                    <div class="card-header">
                      <span>血缘详情</span>
                    </div>
                  </template>
                  <el-descriptions :column="1" border>
                    <el-descriptions-item label="数据流程">采购系统 → 数据采集 → 数据清洗 → 标准化 → 数据湖 → 主题库</el-descriptions-item>
                    <el-descriptions-item label="处理层级">6层</el-descriptions-item>
                    <el-descriptions-item label="涉及系统">采购管理系统、数据集成平台、数据湖</el-descriptions-item>
                    <el-descriptions-item label="数据转换">3次（格式标准化、质量校验、主题分类）</el-descriptions-item>
                    <el-descriptions-item label="更新频率">实时</el-descriptions-item>
                  </el-descriptions>
                </el-card>
              </div>
            </el-tab-pane>

            <!-- 数据质量监控 -->
            <el-tab-pane label="数据质量监控" name="quality">
              <el-alert
                title="全面监控数据完整性、准确性和一致性，及时发现并处理质量问题"
                type="info"
                :closable="false"
                style="margin-bottom: 16px;"
              />

              <el-row :gutter="16">
                <el-col :span="8" v-for="metric in qualityMetrics" :key="metric.name">
                  <el-card shadow="hover" class="quality-metric-card">
                    <div class="quality-metric-header">
                      <span class="quality-metric-name">{{ metric.name }}</span>
                      <el-tag :type="getQualityType(metric.status)" size="large">
                        {{ getQualityText(metric.status) }}
                      </el-tag>
                    </div>
                    
                    <div class="quality-score">
                      <span class="score-value">{{ metric.score }}</span>
                      <span class="score-unit">分</span>
                    </div>

                    <el-progress 
                      :percentage="metric.score" 
                      :color="metric.score >= 90 ? '#67C23A' : metric.score >= 80 ? '#409EFF' : metric.score >= 70 ? '#E6A23C' : '#F56C6C'"
                      :stroke-width="12"
                    />

                    <div class="quality-issues">
                      <el-icon v-if="metric.issues > 0" color="#F56C6C"><Warning /></el-icon>
                      <el-icon v-else color="#67C23A"><CircleCheck /></el-icon>
                      <span>{{ metric.issues > 0 ? `发现 ${metric.issues} 个质量问题` : '暂无质量问题' }}</span>
                    </div>

                    <div class="quality-actions">
                      <el-button size="small" type="primary" link>查看详情</el-button>
                      <el-button size="small" type="primary" link>处理问题</el-button>
                    </div>
                  </el-card>
                </el-col>
              </el-row>

              <el-card shadow="hover" style="margin-top: 16px;">
                <template #header>
                  <div class="card-header">
                    <span>质量异常告警</span>
                    <el-button link type="primary" size="small">查看全部</el-button>
                  </div>
                </template>
                <el-timeline>
                  <el-timeline-item timestamp="2025-10-30 14:23:15" placement="top" type="danger">
                    <el-card>
                      <h4>数据准确性异常</h4>
                      <p>检测到采购系统数据源中存在5条异常记录，金额字段超出正常范围</p>
                    </el-card>
                  </el-timeline-item>
                  <el-timeline-item timestamp="2025-10-30 12:45:32" placement="top" type="warning">
                    <el-card>
                      <h4>数据及时性警告</h4>
                      <p>仓储WMS系统数据同步延迟超过30分钟，建议检查网络连接</p>
                    </el-card>
                  </el-timeline-item>
                  <el-timeline-item timestamp="2025-10-30 10:18:47" placement="top" type="success">
                    <el-card>
                      <h4>质量问题已修复</h4>
                      <p>销售ERP系统的重复数据问题已通过去重规则自动处理</p>
                    </el-card>
                  </el-timeline-item>
                </el-timeline>
              </el-card>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.data-integration-container {
  min-height: calc(100vh - 60px);

  .stats-row {
    margin-bottom: 16px;
  }

  .stat-card {
    .stat-content {
      display: flex;
      align-items: center;
      gap: 16px;

      .stat-icon {
        font-size: 40px;
      }

      .stat-info {
        flex: 1;

        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #303133;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 13px;
          color: #909399;
        }
      }
    }
  }

  .main-content {
    .category-card {
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 600;
      }

      .category-list {
        .category-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          margin: -12px -20px 0;
          cursor: pointer;
          transition: all 0.3s;
          border-left: 3px solid transparent;

          &:hover {
            background: #f5f7fa;
          }

          &.active {
            background: #ecf5ff;
            border-left-color: #409eff;

            .category-name {
              color: #409eff;
              font-weight: 600;
            }
          }

          .category-name {
            font-size: 14px;
            color: #606266;
          }

          .category-count {
            margin-left: 8px;
          }
        }
      }
    }

    .quality-card {
      .quality-metrics {
        .metric-item {
          margin-bottom: 20px;

          &:last-child {
            margin-bottom: 0;
          }

          .metric-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;

            .metric-name {
              font-size: 13px;
              color: #606266;
              font-weight: 500;
            }
          }

          .metric-footer {
            display: flex;
            justify-content: space-between;
            margin-top: 6px;
            font-size: 12px;

            .metric-score {
              color: #303133;
              font-weight: 600;
            }

            .metric-issues {
              color: #909399;
            }
          }
        }
      }
    }

    .content-card {
      min-height: 600px;

      .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .toolbar-left {
          display: flex;
          align-items: center;
        }

        .toolbar-right {
          display: flex;
          gap: 8px;
        }
      }

      .task-card {
        margin-bottom: 16px;

        .task-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;

          .task-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
            color: #303133;
          }
        }

        .task-progress {
          margin-bottom: 16px;
        }

        .task-info {
          margin-bottom: 16px;
        }

        .task-actions {
          display: flex;
          gap: 8px;
        }
      }

      .rule-card {
        margin-bottom: 16px;

        .rule-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          .rule-title {
            display: flex;
            align-items: center;
            gap: 12px;

            .rule-name {
              font-weight: 600;
              color: #303133;
            }
          }
        }

        .rule-description {
          color: #606266;
          font-size: 13px;
          line-height: 1.6;
          margin-bottom: 16px;
          padding: 8px 12px;
          background: #f5f7fa;
          border-radius: 4px;
        }

        .rule-actions {
          display: flex;
          gap: 8px;
        }
      }

      .lineage-container {
        display: flex;
        gap: 24px;

        .el-steps {
          flex: 1;
        }

        .lineage-info-card {
          flex: 1;
        }
      }

      .quality-metric-card {
        margin-bottom: 16px;

        .quality-metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;

          .quality-metric-name {
            font-size: 16px;
            font-weight: 600;
            color: #303133;
          }
        }

        .quality-score {
          text-align: center;
          margin-bottom: 16px;

          .score-value {
            font-size: 48px;
            font-weight: bold;
            color: #409eff;
          }

          .score-unit {
            font-size: 16px;
            color: #909399;
            margin-left: 4px;
          }
        }

        .quality-issues {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
          padding: 8px;
          background: #f5f7fa;
          border-radius: 4px;
          font-size: 13px;
          color: #606266;
        }

        .quality-actions {
          display: flex;
          justify-content: space-around;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #ebeef5;
        }
      }
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
  }
}
</style>