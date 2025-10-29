<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search, Filter, Download, DocumentCopy, View, Edit, Delete, Star,
  DataBoard, Setting, Monitor, TrendCharts, VideoPlay,
  Picture, Document, Plus, Refresh, ArrowUp, Check, ArrowDown,
  DataAnalysis
} from '@element-plus/icons-vue'

// 类型定义
interface RuleTemplate {
  id: string
  name: string
  scene: 'text' | 'image' | 'video'
  category: string
  description: string
  ruleCount: number
  createTime: string
  updateTime: string
  useCount: number
  status: 'enabled' | 'disabled' | 'recommended'
  accuracy: number
  coverage: number
  isFavorite: boolean
  isPinned: boolean
  tags: string[]
  config: RuleConfig[]
  usageLogs: UsageLog[]
  effectMetrics: EffectMetrics
}

interface RuleConfig {
  id: string
  name: string
  type: string
  params: Record<string, any>
  threshold: number
  enabled: boolean
}

interface UsageLog {
  id: string
  action: string
  user: string
  time: string
  details: string
}

interface EffectMetrics {
  truePositive: number
  falsePositive: number
  falseNegative: number
  trueNegative: number
  avgResponseTime: number
  lastUpdateTime: string
}

// 响应式数据
const loading = ref(false)
const searchKeyword = ref('')
const selectedScene = ref<string>('all')
const selectedStatus = ref<string>('all')
const selectedCategory = ref<string>('all')
const currentTemplate = ref<RuleTemplate | null>(null)
const showDetailDialog = ref(false)
const showDeployDialog = ref(false)
const deployForm = reactive({
  templateId: '',
  params: {} as Record<string, any>,
  cloneName: ''
})

// 分类数据
const categories = ref([
  { id: 'all', name: '全部分类', scene: 'all' },
  { id: 'content-safety', name: '内容安全', scene: 'text' },
  { id: 'spam-detection', name: '垃圾信息检测', scene: 'text' },
  { id: 'image-classification', name: '图像分类', scene: 'image' },
  { id: 'object-detection', name: '物体识别', scene: 'image' },
  { id: 'video-analysis', name: '视频分析', scene: 'video' },
  { id: 'behavior-detection', name: '行为检测', scene: 'video' }
])

// 模拟数据
const templates = ref<RuleTemplate[]>([])

// 计算属性
const filteredTemplates = computed(() => {
  let result = templates.value

  // 场景筛选
  if (selectedScene.value !== 'all') {
    result = result.filter(t => t.scene === selectedScene.value)
  }

  // 状态筛选
  if (selectedStatus.value !== 'all') {
    result = result.filter(t => t.status === selectedStatus.value)
  }

  // 分类筛选
  if (selectedCategory.value !== 'all') {
    result = result.filter(t => t.category === selectedCategory.value)
  }

  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(t =>
      t.name.toLowerCase().includes(keyword) ||
      t.description.toLowerCase().includes(keyword) ||
      t.tags.some(tag => tag.toLowerCase().includes(keyword))
    )
  }

  // 置顶排序
  result.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return 0
  })

  return result
})

const sceneOptions = [
  { label: '全部场景', value: 'all' },
  { label: '文本检测', value: 'text' },
  { label: '图像识别', value: 'image' },
  { label: '视频分析', value: 'video' }
]

const statusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '启用', value: 'enabled' },
  { label: '禁用', value: 'disabled' },
  { label: '推荐', value: 'recommended' }
]

// 获取状态标签样式
const getStatusTag = (status: string) => {
  const statusMap = {
    enabled: { type: 'success', text: '启用' },
    disabled: { type: 'info', text: '禁用' },
    recommended: { type: 'warning', text: '推荐' }
  }
  return statusMap[status as keyof typeof statusMap] || { type: '', text: status }
}

// 获取场景标签样式
const getSceneTag = (scene: string) => {
  const sceneMap = {
    text: { type: 'primary', icon: Document, text: '文本检测' },
    image: { type: 'success', icon: Picture, text: '图像识别' },
    video: { type: 'danger', icon: VideoPlay, text: '视频分析' }
  }
  return sceneMap[scene as keyof typeof sceneMap] || { type: '', icon: Document, text: scene }
}

// 获取准确率等级
const getAccuracyLevel = (accuracy: number) => {
  if (accuracy >= 95) return { text: '优秀', color: '#67C23A' }
  if (accuracy >= 85) return { text: '良好', color: '#E6A23C' }
  if (accuracy >= 70) return { text: '一般', color: '#F56C6C' }
  return { text: '较差', color: '#909399' }
}

// 模拟加载数据
const loadTemplates = async () => {
  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 1000))

  templates.value = [
    {
      id: '1',
      name: '敏感内容检测模板',
      scene: 'text',
      category: 'content-safety',
      description: '用于检测文本中的敏感词汇、政治内容、暴力信息等',
      ruleCount: 15,
      createTime: '2024-01-15 10:30:00',
      updateTime: '2024-10-28 15:20:00',
      useCount: 1250,
      status: 'recommended',
      accuracy: 96.5,
      coverage: 89.2,
      isFavorite: true,
      isPinned: true,
      tags: ['敏感词', '内容安全', '文本分析'],
      config: [
        { id: 'r1', name: '敏感词匹配', type: 'keyword', params: { sensitivity: 0.8 }, threshold: 0.7, enabled: true },
        { id: 'r2', name: '语义分析', type: 'semantic', params: { model: 'bert-base' }, threshold: 0.6, enabled: true }
      ],
      usageLogs: [
        { id: 'l1', action: '部署', user: 'admin', time: '2024-10-28 15:20:00', details: '成功部署到生产环境' },
        { id: 'l2', action: '更新', user: 'admin', time: '2024-10-25 10:15:00', details: '更新敏感词库' }
      ],
      effectMetrics: {
        truePositive: 1250,
        falsePositive: 45,
        falseNegative: 23,
        trueNegative: 8560,
        avgResponseTime: 120,
        lastUpdateTime: '2024-10-28 15:20:00'
      }
    },
    {
      id: '2',
      name: '垃圾信息识别模板',
      scene: 'text',
      category: 'spam-detection',
      description: '识别广告、诈骗、恶意链接等垃圾信息',
      ruleCount: 12,
      createTime: '2024-02-20 14:15:00',
      updateTime: '2024-10-27 09:30:00',
      useCount: 890,
      status: 'enabled',
      accuracy: 92.3,
      coverage: 85.7,
      isFavorite: false,
      isPinned: false,
      tags: ['垃圾信息', '反欺诈', '文本分析'],
      config: [
        { id: 'r3', name: '链接检测', type: 'url', params: { checkDomain: true }, threshold: 0.8, enabled: true },
        { id: 'r4', name: '广告词识别', type: 'pattern', params: { patterns: ['免费', '优惠'] }, threshold: 0.9, enabled: true }
      ],
      usageLogs: [],
      effectMetrics: {
        truePositive: 890,
        falsePositive: 67,
        falseNegative: 34,
        trueNegative: 7234,
        avgResponseTime: 95,
        lastUpdateTime: '2024-10-27 09:30:00'
      }
    },
    {
      id: '3',
      name: '图像分类识别模板',
      scene: 'image',
      category: 'image-classification',
      description: '识别图片中的物体、场景、人物等元素',
      ruleCount: 8,
      createTime: '2024-03-10 16:45:00',
      updateTime: '2024-10-26 11:20:00',
      useCount: 567,
      status: 'enabled',
      accuracy: 88.9,
      coverage: 91.3,
      isFavorite: true,
      isPinned: false,
      tags: ['图像识别', '分类', 'AI检测'],
      config: [],
      usageLogs: [],
      effectMetrics: {
        truePositive: 567,
        falsePositive: 89,
        falseNegative: 56,
        trueNegative: 4567,
        avgResponseTime: 230,
        lastUpdateTime: '2024-10-26 11:20:00'
      }
    },
    {
      id: '4',
      name: '视频行为分析模板',
      scene: 'video',
      category: 'behavior-detection',
      description: '分析视频中的人物行为、异常事件等',
      ruleCount: 10,
      createTime: '2024-04-05 13:20:00',
      updateTime: '2024-10-25 16:10:00',
      useCount: 234,
      status: 'disabled',
      accuracy: 78.5,
      coverage: 72.8,
      isFavorite: false,
      isPinned: false,
      tags: ['视频分析', '行为检测', '实时监控'],
      config: [],
      usageLogs: [],
      effectMetrics: {
        truePositive: 234,
        falsePositive: 123,
        falseNegative: 89,
        trueNegative: 2345,
        avgResponseTime: 450,
        lastUpdateTime: '2024-10-25 16:10:00'
      }
    }
  ]

  loading.value = false
}

// 查看模板详情
const viewTemplateDetail = (template: RuleTemplate) => {
  currentTemplate.value = template
  showDetailDialog.value = true
}

// 收藏/取消收藏
const toggleFavorite = async (template: RuleTemplate) => {
  template.isFavorite = !template.isFavorite
  ElMessage.success(template.isFavorite ? '已收藏' : '已取消收藏')
}

// 置顶/取消置顶
const togglePin = async (template: RuleTemplate) => {
  template.isPinned = !template.isPinned
  ElMessage.success(template.isPinned ? '已置顶' : '已取消置顶')
}

// 删除模板
const deleteTemplate = async (template: RuleTemplate) => {
  try {
    await ElMessageBox.confirm(`确定要删除模板「${template.name}」吗？`, '确认删除', {
      type: 'warning'
    })

    const index = templates.value.findIndex(t => t.id === template.id)
    if (index > -1) {
      templates.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  } catch {
    // 用户取消删除
  }
}

// 部署模板
const deployTemplate = (template: RuleTemplate) => {
  currentTemplate.value = template
  deployForm.templateId = template.id
  deployForm.params = {}
  deployForm.cloneName = ''
  showDeployDialog.value = true
}

// 确认部署
const confirmDeploy = async () => {
  if (!currentTemplate.value) return

  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 1500))

  // 更新使用次数
  currentTemplate.value.useCount += 1
  currentTemplate.value.updateTime = new Date().toLocaleString()

  // 添加使用日志
  const log: UsageLog = {
    id: `l${Date.now()}`,
    action: deployForm.cloneName ? '克隆部署' : '直接部署',
    user: 'current-user',
    time: new Date().toLocaleString(),
    details: deployForm.cloneName ? `克隆为「${deployForm.cloneName}」并部署` : '直接部署到当前环境'
  }
  currentTemplate.value.usageLogs.unshift(log)

  loading.value = false
  showDeployDialog.value = false
  ElMessage.success('部署成功')
}

// 刷新数据
const refreshData = () => {
  loadTemplates()
}

// 页面加载时获取数据
onMounted(() => {
  loadTemplates()
})
</script>

<template>
  <div class="rule-templates-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">规则模板管理</h1>
        <p class="page-description">提供预定义的违规检测规则模板，支持快速部署和灵活调整</p>
      </div>
      <div class="header-right">
        <el-button type="primary" :icon="Plus" @click="refreshData">
          新建模板
        </el-button>
        <el-button :icon="Refresh" @click="refreshData" :loading="loading">
          刷新
        </el-button>
      </div>
    </div>

    <div class="page-content">
      <el-row :gutter="20">
        <!-- 左侧分类导航 -->
        <el-col :span="4">
          <el-card class="category-card">
            <template #header>
              <div class="card-header">
                <span>模板分类</span>
                <el-icon><Setting /></el-icon>
              </div>
            </template>

            <div class="category-list">
              <div
                v-for="category in categories"
                :key="category.id"
                :class="['category-item', { active: selectedCategory === category.id }]"
                @click="selectedCategory = category.id"
              >
                <el-icon v-if="category.scene !== 'all'">
                  <component :is="getSceneTag(category.scene).icon" />
                </el-icon>
                <span>{{ category.name }}</span>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 中间模板列表 -->
        <el-col :span="14">
          <el-card class="list-card">
            <!-- 搜索和筛选 -->
            <div class="filter-bar">
              <div class="filter-left">
                <el-input
                  v-model="searchKeyword"
                  placeholder="搜索模板名称、描述或标签"
                  :prefix-icon="Search"
                  clearable
                  style="width: 300px"
                />
                <el-select v-model="selectedScene" placeholder="选择场景" style="width: 150px">
                  <el-option
                    v-for="option in sceneOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
                <el-select v-model="selectedStatus" placeholder="选择状态" style="width: 120px">
                  <el-option
                    v-for="option in statusOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </div>
              <div class="filter-right">
                <el-button :icon="Filter">筛选</el-button>
              </div>
            </div>

            <!-- 模板列表 -->
            <el-table
              v-loading="loading"
              :data="filteredTemplates"
              style="width: 100%"
              row-key="id"
            >
              <el-table-column label="模板名称" min-width="200">
                <template #default="{ row }">
                  <div class="template-name">
                    <div class="name-content">
                      <el-icon v-if="row.isPinned" class="pin-icon" color="#F56C6C">
                        <ArrowUp />
                      </el-icon>
                      <span class="name">{{ row.name }}</span>
                      <el-icon v-if="row.isFavorite" class="favorite-icon" color="#F7BA2A">
                        <Star />
                      </el-icon>
                    </div>
                    <div class="tags">
                      <el-tag
                        v-for="tag in row.tags"
                        :key="tag"
                        size="small"
                        type="info"
                        effect="plain"
                      >
                        {{ tag }}
                      </el-tag>
                    </div>
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="适用场景" width="120">
                <template #default="{ row }">
                  <el-tag :type="getSceneTag(row.scene).type" effect="light">
                    <el-icon class="tag-icon">
                      <component :is="getSceneTag(row.scene).icon" />
                    </el-icon>
                    {{ getSceneTag(row.scene).text }}
                  </el-tag>
                </template>
              </el-table-column>

              <el-table-column label="规则数量" prop="ruleCount" width="100" align="center" />

              <el-table-column label="准确率" width="100" align="center">
                <template #default="{ row }">
                  <div class="accuracy-display">
                    <span :style="{ color: getAccuracyLevel(row.accuracy).color }">
                      {{ row.accuracy }}%
                    </span>
                    <el-progress
                      :percentage="row.accuracy"
                      :stroke-width="4"
                      :show-text="false"
                      :color="getAccuracyLevel(row.accuracy).color"
                    />
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="使用次数" prop="useCount" width="100" align="center" />

              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="getStatusTag(row.status).type" effect="light">
                    {{ getStatusTag(row.status).text }}
                  </el-tag>
                </template>
              </el-table-column>

              <el-table-column label="创建时间" prop="createTime" width="160" />

              <el-table-column label="操作" width="240" fixed="right">
                <template #default="{ row }">
                  <div class="action-buttons">
                    <el-button
                      type="primary"
                      size="small"
                      :icon="View"
                      @click="viewTemplateDetail(row)"
                    >
                      详情
                    </el-button>
                    <el-button
                      type="success"
                      size="small"
                      :icon="Download"
                      @click="deployTemplate(row)"
                    >
                      部署
                    </el-button>
                    <el-dropdown trigger="click">
                      <el-button size="small">
                        更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item @click="toggleFavorite(row)">
                            <el-icon><Star /></el-icon>
                            {{ row.isFavorite ? '取消收藏' : '收藏' }}
                          </el-dropdown-item>
                          <el-dropdown-item @click="togglePin(row)">
                            <el-icon><ArrowUp /></el-icon>
                            {{ row.isPinned ? '取消置顶' : '置顶' }}
                          </el-dropdown-item>
                          <el-dropdown-item @click="deployTemplate(row)">
                            <el-icon><DocumentCopy /></el-icon>
                            克隆
                          </el-dropdown-item>
                          <el-dropdown-item divided @click="deleteTemplate(row)">
                            <el-icon><Delete /></el-icon>
                            删除
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>

        <!-- 右侧统计面板 -->
        <el-col :span="6">
          <el-card class="stats-card">
            <template #header>
              <div class="card-header">
                <span>模板统计</span>
                <el-icon><TrendCharts /></el-icon>
              </div>
            </template>

            <div class="stats-content">
              <div class="stat-item">
                <div class="stat-label">总模板数</div>
                <div class="stat-value">{{ templates.length }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">启用模板</div>
                <div class="stat-value">{{ templates.filter(t => t.status === 'enabled').length }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">推荐模板</div>
                <div class="stat-value">{{ templates.filter(t => t.status === 'recommended').length }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">平均准确率</div>
                <div class="stat-value">
                  {{ (templates.reduce((sum, t) => sum + t.accuracy, 0) / templates.length).toFixed(1) }}%
                </div>
              </div>
            </div>
          </el-card>

          <el-card class="quick-actions-card">
            <template #header>
              <div class="card-header">
                <span>快速操作</span>
                <el-icon><Monitor /></el-icon>
              </div>
            </template>

            <div class="quick-actions">
              <el-button type="primary" plain class="action-btn">
                <el-icon><DataAnalysis /></el-icon>
                效果分析
              </el-button>
              <el-button type="success" plain class="action-btn">
                <el-icon><Setting /></el-icon>
                批量部署
              </el-button>
              <el-button type="warning" plain class="action-btn">
                <el-icon><Download /></el-icon>
                导出模板
              </el-button>
              <el-button type="info" plain class="action-btn">
                <el-icon><Refresh /></el-icon>
                更新模板库
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 模板详情弹窗 -->
    <el-dialog
      v-model="showDetailDialog"
      :title="currentTemplate?.name"
      width="80%"
      destroy-on-close
    >
      <div v-if="currentTemplate" class="template-detail">
        <!-- 基本信息 -->
        <el-descriptions title="基本信息" :column="2" border>
          <el-descriptions-item label="模板ID">{{ currentTemplate.id }}</el-descriptions-item>
          <el-descriptions-item label="适用场景">
            <el-tag :type="getSceneTag(currentTemplate.scene).type">
              {{ getSceneTag(currentTemplate.scene).text }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="分类">{{ currentTemplate.category }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTag(currentTemplate.status).type">
              {{ getStatusTag(currentTemplate.status).text }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="规则数量">{{ currentTemplate.ruleCount }}</el-descriptions-item>
          <el-descriptions-item label="使用次数">{{ currentTemplate.useCount }}</el-descriptions-item>
          <el-descriptions-item label="准确率">
            <span :style="{ color: getAccuracyLevel(currentTemplate.accuracy).color }">
              {{ currentTemplate.accuracy }}%
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="覆盖率">{{ currentTemplate.coverage }}%</el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">{{ currentTemplate.createTime }}</el-descriptions-item>
          <el-descriptions-item label="更新时间" :span="2">{{ currentTemplate.updateTime }}</el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">{{ currentTemplate.description }}</el-descriptions-item>
        </el-descriptions>

        <!-- 标签 -->
        <div class="detail-section">
          <h4>标签</h4>
          <div class="tags-list">
            <el-tag
              v-for="tag in currentTemplate.tags"
              :key="tag"
              class="tag-item"
              type="info"
              effect="plain"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>

        <!-- 规则配置 -->
        <div class="detail-section">
          <h4>规则配置</h4>
          <el-table :data="currentTemplate.config" style="width: 100%">
            <el-table-column label="规则名称" prop="name" />
            <el-table-column label="类型" prop="type" />
            <el-table-column label="阈值" prop="threshold" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
                  {{ row.enabled ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 效果评估 -->
        <div class="detail-section">
          <h4>效果评估</h4>
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="metric-card">
                <div class="metric-title">真正例</div>
                <div class="metric-value">{{ currentTemplate.effectMetrics.truePositive }}</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="metric-card">
                <div class="metric-title">假正例</div>
                <div class="metric-value">{{ currentTemplate.effectMetrics.falsePositive }}</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="metric-card">
                <div class="metric-title">假负例</div>
                <div class="metric-value">{{ currentTemplate.effectMetrics.falseNegative }}</div>
              </div>
            </el-col>
          </el-row>
          <el-row :gutter="20" style="margin-top: 16px">
            <el-col :span="12">
              <div class="metric-card">
                <div class="metric-title">平均响应时间</div>
                <div class="metric-value">{{ currentTemplate.effectMetrics.avgResponseTime }}ms</div>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="metric-card">
                <div class="metric-title">最后更新</div>
                <div class="metric-value">{{ currentTemplate.effectMetrics.lastUpdateTime }}</div>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 使用日志 -->
        <div class="detail-section">
          <h4>使用日志</h4>
          <el-table :data="currentTemplate.usageLogs" style="width: 100%">
            <el-table-column label="操作" prop="action" />
            <el-table-column label="用户" prop="user" />
            <el-table-column label="时间" prop="time" />
            <el-table-column label="详情" prop="details" />
          </el-table>
        </div>
      </div>

      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
        <el-button type="primary" @click="currentTemplate && deployTemplate(currentTemplate)">
          部署模板
        </el-button>
      </template>
    </el-dialog>

    <!-- 部署模板弹窗 -->
    <el-dialog
      v-model="showDeployDialog"
      title="部署模板"
      width="600px"
      destroy-on-close
    >
      <div v-if="currentTemplate" class="deploy-form">
        <el-alert
          title="部署说明"
          :description="`即将部署模板「${currentTemplate.name}」到当前环境。您可以选择直接部署或克隆为新模板后再部署。`"
          type="info"
          show-icon
          :closable="false"
          style="margin-bottom: 20px"
        />

        <el-form label-width="120px">
          <el-form-item label="部署方式">
            <el-radio-group v-model="deployForm.cloneName">
              <el-radio label="">直接部署</el-radio>
              <el-radio label="clone">克隆为新模板</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item v-if="deployForm.cloneName === 'clone'" label="新模板名称">
            <el-input
              v-model="deployForm.cloneName"
              placeholder="请输入新模板名称"
            />
          </el-form-item>

          <el-form-item label="参数调整">
            <div class="params-config">
              <div
                v-for="config in currentTemplate.config"
                :key="config.id"
                class="param-item"
              >
                <div class="param-label">{{ config.name }}</div>
                <el-slider
                  v-model="config.threshold"
                  :min="0"
                  :max="1"
                  :step="0.1"
                  show-input
                  :format-tooltip="(val) => `${(val * 100).toFixed(0)}%`"
                />
              </div>
            </div>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="showDeployDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmDeploy" :loading="loading">
          确认部署
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.rule-templates-container {

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    .header-left {
      .page-title {
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 600;
        color: #303133;
      }

      .page-description {
        margin: 0;
        color: #909399;
        font-size: 14px;
      }
    }

    .header-right {
      display: flex;
      gap: 12px;
    }
  }

  .page-content {
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
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          margin-bottom: 4px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s;

          &:hover {
            background: #f5f7fa;
          }

          &.active {
            background: #409eff;
            color: white;
          }
        }
      }
    }

    .list-card {
      .filter-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding: 16px;
        background: #fafbfc;
        border-radius: 6px;

        .filter-left {
          display: flex;
          gap: 12px;
          align-items: center;
        }
      }

      .template-name {
        .name-content {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;

          .pin-icon {
            font-size: 14px;
          }

          .name {
            font-weight: 500;
            color: #303133;
          }

          .favorite-icon {
            font-size: 14px;
          }
        }

        .tags {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }
      }

      .accuracy-display {
        display: flex;
        flex-direction: column;
        gap: 4px;
        align-items: center;
      }

      .action-buttons {
        display: flex;
        gap: 8px;
      }
    }

    .stats-card {
      margin-bottom: 16px;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 600;
      }

      .stats-content {
        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f0f0f0;

          &:last-child {
            border-bottom: none;
          }

          .stat-label {
            color: #909399;
            font-size: 14px;
          }

          .stat-value {
            font-size: 18px;
            font-weight: 600;
            color: #303133;
          }
        }
      }
    }

    .quick-actions-card {
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 600;
      }

      .quick-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;

        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          height: 40px;
        }
      }
    }
  }

  .template-detail {
    .detail-section {
      margin-top: 24px;

      h4 {
        margin: 0 0 16px 0;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }

      .tags-list {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;

        .tag-item {
          margin: 0;
        }
      }

      .metric-card {
        padding: 16px;
        background: #fafbfc;
        border-radius: 6px;
        text-align: center;

        .metric-title {
          color: #909399;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .metric-value {
          font-size: 20px;
          font-weight: 600;
          color: #303133;
        }
      }
    }
  }

  .deploy-form {
    .params-config {
      .param-item {
        margin-bottom: 16px;

        .param-label {
          margin-bottom: 8px;
          font-weight: 500;
          color: #303133;
        }
      }
    }
  }
}

.tag-icon {
  margin-right: 4px;
}
</style>