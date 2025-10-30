<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 类型定义
type ValueLevel = 'high' | 'medium-high' | 'medium' | 'low'
type ModelType = 'comprehensive' | 'quality-first' | 'business-first' | 'custom'

interface TreeNode {
  id: string
  label: string
  count: number
  totalValue: number
  children?: TreeNode[]
}

interface AssetItem {
  id: string
  name: string
  category: string
  valueScore: number
  valueLevel: ValueLevel
  qualityScore: number
  scarcityScore: number
  frequencyScore: number
  businessScore: number
  estimatedPrice: number
  lastEvaluated: string
}

interface EvaluationDimension {
  name: string
  icon: string
  weight: number
  color: string
  score: number
  subItems: {
    label: string
    value: number
  }[]
}

interface EvaluationModel {
  id: string
  name: string
  type: ModelType
  version: string
  description: string
  weights: {
    quality: number
    scarcity: number
    frequency: number
    business: number
  }
  createTime: string
  isActive: boolean
}

// 响应式数据
const loading = ref(false)
const treeLoading = ref(false)

// 资产目录树
const assetTree = ref<TreeNode[]>([])
const defaultProps = {
  children: 'children',
  label: 'label'
}
const selectedCategory = ref('')
const allowDrop = (draggingNode: any, dropNode: any, type: string) => {
  return type !== 'inner'
}
const allowDrag = (draggingNode: any) => {
  return true
}

// 资产列表
const assetList = ref<AssetItem[]>([])
const filteredAssets = computed(() => {
  if (!selectedCategory.value) return assetList.value
  return assetList.value.filter(item => item.category === selectedCategory.value)
})
const currentPage = ref(1)
const pageSize = ref(10)
const paginatedAssets = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredAssets.value.slice(start, end)
})

// 选中的资产
const selectedAsset = ref<AssetItem | null>(null)

// 评估维度
const evaluationDimensions = ref<EvaluationDimension[]>([
  {
    name: '数据质量',
    icon: '💎',
    weight: 30,
    color: '#409EFF',
    score: 0,
    subItems: [
      { label: '完整性', value: 0 },
      { label: '准确性', value: 0 },
      { label: '一致性', value: 0 },
      { label: '时效性', value: 0 }
    ]
  },
  {
    name: '数据稀缺性',
    icon: '🔮',
    weight: 25,
    color: '#67C23A',
    score: 0,
    subItems: [
      { label: '唯一性', value: 0 },
      { label: '替代性', value: 0 },
      { label: '获取难度', value: 0 }
    ]
  },
  {
    name: '应用频率',
    icon: '📈',
    weight: 20,
    color: '#E6A23C',
    score: 0,
    subItems: [
      { label: '调用次数', value: 0 },
      { label: '使用场景', value: 0 },
      { label: '用户数量', value: 0 }
    ]
  },
  {
    name: '业务价值',
    icon: '💰',
    weight: 25,
    color: '#F56C6C',
    score: 0,
    subItems: [
      { label: '收入贡献', value: 0 },
      { label: '成本节约', value: 0 },
      { label: '效率提升', value: 0 }
    ]
  }
])

// 评估模型
const evaluationModels = ref<EvaluationModel[]>([])
const activeModel = ref<EvaluationModel | null>(null)
const showModelDialog = ref(false)
const modelForm = reactive({
  name: '',
  type: 'custom' as ModelType,
  description: '',
  weights: {
    quality: 30,
    scarcity: 25,
    frequency: 20,
    business: 25
  }
})

// 价值统计
const valueStatistics = ref({
  totalAssets: 0,
  totalValue: 0,
  averageScore: 0,
  highValueCount: 0,
  mediumHighCount: 0,
  mediumCount: 0,
  lowValueCount: 0
})

// 价值等级配置
const valueLevelConfig = {
  high: { label: '高价值', color: '#FFD700', minScore: 80 },
  'medium-high': { label: '中高价值', color: '#67C23A', minScore: 60 },
  medium: { label: '中等价值', color: '#409EFF', minScore: 40 },
  low: { label: '低价值', color: '#909399', minScore: 0 }
}

// 计算综合价值评分
const calculateValueScore = () => {
  if (!selectedAsset.value) return 0
  
  const dimensions = evaluationDimensions.value
  let totalScore = 0
  
  dimensions.forEach(dim => {
    totalScore += (dim.score * dim.weight) / 100
  })
  
  return Math.round(totalScore * 100) / 100
}

// 监听评估维度变化，自动更新评分
watch(evaluationDimensions, () => {
  if (selectedAsset.value) {
    const newScore = calculateValueScore()
    selectedAsset.value.valueScore = newScore
    selectedAsset.value.valueLevel = getValueLevel(newScore)
    selectedAsset.value.estimatedPrice = Math.round(newScore * 10000)
  }
}, { deep: true })

// 获取价值等级
const getValueLevel = (score: number): ValueLevel => {
  if (score >= 80) return 'high'
  if (score >= 60) return 'medium-high'
  if (score >= 40) return 'medium'
  return 'low'
}

// Mock 数据生成
const generateMockData = () => {
  // 生成资产目录树
  setTimeout(() => {
    assetTree.value = [
      {
        id: '1',
        label: '农业生产数据',
        count: 156,
        totalValue: 12560000,
        children: [
          { id: '1-1', label: '种植数据', count: 68, totalValue: 5440000 },
          { id: '1-2', label: '养殖数据', count: 52, totalValue: 4160000 },
          { id: '1-3', label: '农机数据', count: 36, totalValue: 2960000 }
        ]
      },
      {
        id: '2',
        label: '市场交易数据',
        count: 124,
        totalValue: 9920000,
        children: [
          { id: '2-1', label: '销售数据', count: 78, totalValue: 6240000 },
          { id: '2-2', label: '价格数据', count: 46, totalValue: 3680000 }
        ]
      },
      {
        id: '3',
        label: '环境监测数据',
        count: 98,
        totalValue: 7840000,
        children: [
          { id: '3-1', label: '气象数据', count: 42, totalValue: 3360000 },
          { id: '3-2', label: '土壤数据', count: 32, totalValue: 2560000 },
          { id: '3-3', label: '水质数据', count: 24, totalValue: 1920000 }
        ]
      },
      {
        id: '4',
        label: '产品溯源数据',
        count: 86,
        totalValue: 6880000,
        children: [
          { id: '4-1', label: '溯源记录', count: 58, totalValue: 4640000 },
          { id: '4-2', label: '认证数据', count: 28, totalValue: 2240000 }
        ]
      }
    ]
  }, 600)

  // 生成资产列表
  setTimeout(() => {
    const categories = ['种植数据', '养殖数据', '农机数据', '销售数据', '价格数据', '气象数据', '土壤数据', '溯源记录']
    const assets: AssetItem[] = []
    
    for (let i = 1; i <= 40; i++) {
      const qualityScore = 60 + Math.random() * 40
      const scarcityScore = 50 + Math.random() * 50
      const frequencyScore = 40 + Math.random() * 60
      const businessScore = 55 + Math.random() * 45
      const valueScore = (qualityScore * 0.3 + scarcityScore * 0.25 + frequencyScore * 0.2 + businessScore * 0.25)
      
      assets.push({
        id: `asset-${i}`,
        name: `数据资产_${i}_${categories[Math.floor(Math.random() * categories.length)]}`,
        category: categories[Math.floor(Math.random() * categories.length)],
        valueScore: Math.round(valueScore * 100) / 100,
        valueLevel: getValueLevel(valueScore),
        qualityScore: Math.round(qualityScore * 100) / 100,
        scarcityScore: Math.round(scarcityScore * 100) / 100,
        frequencyScore: Math.round(frequencyScore * 100) / 100,
        businessScore: Math.round(businessScore * 100) / 100,
        estimatedPrice: Math.round(valueScore * 10000),
        lastEvaluated: `2025-10-${String(Math.floor(Math.random() * 30) + 1).padStart(2, '0')} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`
      })
    }
    
    assetList.value = assets
    
    // 计算统计数据
    valueStatistics.value = {
      totalAssets: assets.length,
      totalValue: assets.reduce((sum, item) => sum + item.estimatedPrice, 0),
      averageScore: Math.round(assets.reduce((sum, item) => sum + item.valueScore, 0) / assets.length * 100) / 100,
      highValueCount: assets.filter(item => item.valueLevel === 'high').length,
      mediumHighCount: assets.filter(item => item.valueLevel === 'medium-high').length,
      mediumCount: assets.filter(item => item.valueLevel === 'medium').length,
      lowValueCount: assets.filter(item => item.valueLevel === 'low').length
    }
  }, 800)

  // 生成评估模型
  setTimeout(() => {
    evaluationModels.value = [
      {
        id: 'model-1',
        name: '综合评估模型',
        type: 'comprehensive',
        version: 'v1.0',
        description: '均衡考虑各维度权重的综合评估模型',
        weights: { quality: 30, scarcity: 25, frequency: 20, business: 25 },
        createTime: '2025-10-01 10:00:00',
        isActive: true
      },
      {
        id: 'model-2',
        name: '质量优先模型',
        type: 'quality-first',
        version: 'v1.0',
        description: '强调数据质量的评估模型',
        weights: { quality: 50, scarcity: 20, frequency: 15, business: 15 },
        createTime: '2025-10-05 14:30:00',
        isActive: false
      },
      {
        id: 'model-3',
        name: '商业价值优先模型',
        type: 'business-first',
        version: 'v1.0',
        description: '侧重商业价值的评估模型',
        weights: { quality: 20, scarcity: 15, frequency: 20, business: 45 },
        createTime: '2025-10-10 09:15:00',
        isActive: false
      }
    ]
    activeModel.value = evaluationModels.value[0]
  }, 900)
}

// 方法
const handleNodeClick = (data: TreeNode) => {
  selectedCategory.value = data.label
  currentPage.value = 1
}

const handleNodeDrop = () => {
  ElMessage.success('目录结构已更新')
}

const handleSelectAsset = (asset: AssetItem) => {
  selectedAsset.value = asset
  
  // 更新评估维度分数
  evaluationDimensions.value[0].score = asset.qualityScore
  evaluationDimensions.value[1].score = asset.scarcityScore
  evaluationDimensions.value[2].score = asset.frequencyScore
  evaluationDimensions.value[3].score = asset.businessScore
  
  // 生成子项分数（模拟）
  evaluationDimensions.value.forEach(dim => {
    const baseScore = dim.score
    dim.subItems.forEach(item => {
      item.value = Math.round((baseScore + (Math.random() * 20 - 10)) * 100) / 100
    })
  })
}

const handleWeightChange = () => {
  // 确保权重总和为100
  const total = evaluationDimensions.value.reduce((sum, dim) => sum + dim.weight, 0)
  if (Math.abs(total - 100) > 0.01) {
    ElMessage.warning('权重总和必须为100%')
  }
}

const handleApplyModel = (model: EvaluationModel) => {
  activeModel.value = model
  evaluationModels.value.forEach(m => {
    m.isActive = m.id === model.id
  })
  
  // 应用模型权重
  evaluationDimensions.value[0].weight = model.weights.quality
  evaluationDimensions.value[1].weight = model.weights.scarcity
  evaluationDimensions.value[2].weight = model.weights.frequency
  evaluationDimensions.value[3].weight = model.weights.business
  
  ElMessage.success(`已应用评估模型：${model.name}`)
}

const handleCreateModel = () => {
  if (!modelForm.name) {
    ElMessage.warning('请输入模型名称')
    return
  }
  
  const total = modelForm.weights.quality + modelForm.weights.scarcity + 
                modelForm.weights.frequency + modelForm.weights.business
  
  if (Math.abs(total - 100) > 0.01) {
    ElMessage.warning('权重总和必须为100%')
    return
  }
  
  loading.value = true
  setTimeout(() => {
    const newModel: EvaluationModel = {
      id: `model-${Date.now()}`,
      name: modelForm.name,
      type: modelForm.type,
      version: 'v1.0',
      description: modelForm.description,
      weights: { ...modelForm.weights },
      createTime: new Date().toLocaleString('zh-CN'),
      isActive: false
    }
    
    evaluationModels.value.push(newModel)
    showModelDialog.value = false
    loading.value = false
    
    // 重置表单
    modelForm.name = ''
    modelForm.type = 'custom'
    modelForm.description = ''
    modelForm.weights = { quality: 30, scarcity: 25, frequency: 20, business: 25 }
    
    ElMessage.success('评估模型创建成功')
  }, 1000)
}

const handleExportTree = () => {
  ElMessage.success('目录结构已导出')
}

const handleImportTree = () => {
  ElMessage.info('请选择要导入的目录文件')
}

const handleReEvaluate = () => {
  if (!selectedAsset.value) {
    ElMessage.warning('请先选择要评估的资产')
    return
  }
  
  loading.value = true
  setTimeout(() => {
    selectedAsset.value!.valueScore = calculateValueScore()
    selectedAsset.value!.lastEvaluated = new Date().toLocaleString('zh-CN')
    loading.value = false
    ElMessage.success('资产重新评估完成')
  }, 1500)
}

const handleExportReport = () => {
  ElMessage.success('价值评估报告已生成')
}

const formatCurrency = (value: number) => {
  return `¥${(value / 10000).toFixed(2)}万`
}

const getValueLevelColor = (level: ValueLevel) => {
  return valueLevelConfig[level].color
}

const getValueLevelLabel = (level: ValueLevel) => {
  return valueLevelConfig[level].label
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
  <div class="asset-evaluation-container" v-loading="loading">
    <!-- 价值统计概览 -->
    <div class="statistics-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <el-statistic title="资产总数" :value="valueStatistics.totalAssets">
              <template #suffix>个</template>
              <template #prefix>
                <span class="stat-icon">📊</span>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <el-statistic title="总估值" :value="valueStatistics.totalValue / 10000" :precision="2">
              <template #suffix>万元</template>
              <template #prefix>
                <span class="stat-icon">💰</span>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <el-statistic title="平均价值分" :value="valueStatistics.averageScore" :precision="2">
              <template #suffix>分</template>
              <template #prefix>
                <span class="stat-icon">⭐</span>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card value-distribution">
            <div class="distribution-title">价值分布</div>
            <div class="distribution-items">
              <div class="dist-item" style="color: #FFD700">
                <span class="label">高价值</span>
                <span class="value">{{ valueStatistics.highValueCount }}</span>
              </div>
              <div class="dist-item" style="color: #67C23A">
                <span class="label">中高</span>
                <span class="value">{{ valueStatistics.mediumHighCount }}</span>
              </div>
              <div class="dist-item" style="color: #409EFF">
                <span class="label">中等</span>
                <span class="value">{{ valueStatistics.mediumCount }}</span>
              </div>
              <div class="dist-item" style="color: #909399">
                <span class="label">低价值</span>
                <span class="value">{{ valueStatistics.lowValueCount }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <el-row :gutter="20">
        <!-- 左侧：资产目录树 -->
        <el-col :span="5">
          <el-card class="tree-card">
            <template #header>
              <div class="card-header">
                <span class="header-title">📁 资产目录</span>
                <div class="header-actions">
                  <el-button link size="small" @click="handleImportTree">导入</el-button>
                  <el-button link size="small" @click="handleExportTree">导出</el-button>
                </div>
              </div>
            </template>
            <el-tree
              :data="assetTree"
              :props="defaultProps"
              :default-expand-all="true"
              :draggable="true"
              :allow-drop="allowDrop"
              :allow-drag="allowDrag"
              @node-click="handleNodeClick"
              @node-drop="handleNodeDrop"
              class="asset-tree"
              v-loading="treeLoading"
            >
              <template #default="{ data }">
                <div class="tree-node">
                  <div class="node-info">
                    <span class="node-label">{{ data.label }}</span>
                    <span class="node-count">{{ data.count }}</span>
                  </div>
                  <div class="node-value">{{ formatCurrency(data.totalValue) }}</div>
                </div>
              </template>
            </el-tree>
          </el-card>

          <!-- 评估模型 -->
          <el-card class="model-card" style="margin-top: 20px">
            <template #header>
              <div class="card-header">
                <span class="header-title">🎯 评估模型</span>
                <el-button type="primary" size="small" @click="showModelDialog = true">
                  新建模型
                </el-button>
              </div>
            </template>
            <div class="model-list">
              <div 
                v-for="model in evaluationModels" 
                :key="model.id" 
                class="model-item"
                :class="{ active: model.isActive }"
              >
                <div class="model-header">
                  <span class="model-name">{{ model.name }}</span>
                  <el-tag size="small" :type="model.isActive ? 'success' : 'info'">
                    {{ model.version }}
                  </el-tag>
                </div>
                <div class="model-desc">{{ model.description }}</div>
                <div class="model-actions">
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click="handleApplyModel(model)"
                    :disabled="model.isActive"
                  >
                    {{ model.isActive ? '使用中' : '应用' }}
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 中间：资产列表和评估详情 -->
        <el-col :span="12">
          <el-card class="list-card">
            <template #header>
              <div class="card-header">
                <span class="header-title">📋 资产列表</span>
                <span class="category-info" v-if="selectedCategory">
                  当前分类：<el-tag size="small">{{ selectedCategory }}</el-tag>
                </span>
              </div>
            </template>
            
            <el-table :data="paginatedAssets" style="width: 100%" stripe @row-click="handleSelectAsset">
              <el-table-column prop="name" label="资产名称" width="200" show-overflow-tooltip />
              <el-table-column prop="category" label="分类" width="100" />
              <el-table-column label="价值评分" width="120">
                <template #default="{ row }">
                  <div class="score-cell">
                    <span class="score-value" :style="{ color: getValueLevelColor(row.valueLevel) }">
                      {{ row.valueScore }}
                    </span>
                    <el-progress 
                      :percentage="row.valueScore" 
                      :show-text="false"
                      :stroke-width="4"
                      :color="getValueLevelColor(row.valueLevel)"
                    />
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="价值等级" width="120">
                <template #default="{ row }">
                  <el-tag :style="{ background: getValueLevelColor(row.valueLevel), border: 'none', color: '#fff' }">
                    {{ getValueLevelLabel(row.valueLevel) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="估值" width="120">
                <template #default="{ row }">
                  <span class="price-value">{{ formatCurrency(row.estimatedPrice) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="lastEvaluated" label="最后评估" width="150" show-overflow-tooltip />
            </el-table>

            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :total="filteredAssets.length"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next"
              style="margin-top: 20px; justify-content: center"
            />
          </el-card>

          <!-- 评估详情 -->
          <el-card class="detail-card" v-if="selectedAsset" style="margin-top: 20px">
            <template #header>
              <div class="card-header">
                <span class="header-title">📊 评估详情</span>
                <div class="header-actions">
                  <el-button type="primary" size="small" @click="handleReEvaluate">
                    重新评估
                  </el-button>
                  <el-button size="small" @click="selectedAsset = null">关闭</el-button>
                </div>
              </div>
            </template>

            <div class="evaluation-summary">
              <div class="summary-left">
                <div class="asset-name">{{ selectedAsset.name }}</div>
                <div class="asset-meta">
                  <span>分类：{{ selectedAsset.category }}</span>
                  <span style="margin-left: 20px">评估时间：{{ selectedAsset.lastEvaluated }}</span>
                </div>
              </div>
              <div class="summary-right">
                <div class="total-score">
                  <div class="score-label">综合评分</div>
                  <div class="score-value" :style="{ color: getValueLevelColor(selectedAsset.valueLevel) }">
                    {{ selectedAsset.valueScore }}
                  </div>
                </div>
                <div class="estimated-price">
                  <div class="price-label">估算价值</div>
                  <div class="price-value">{{ formatCurrency(selectedAsset.estimatedPrice) }}</div>
                </div>
              </div>
            </div>

            <el-divider />

            <!-- 多维度评估 -->
            <div class="dimensions-evaluation">
              <div 
                v-for="(dimension, index) in evaluationDimensions" 
                :key="index"
                class="dimension-item"
              >
                <div class="dimension-header">
                  <div class="dimension-title">
                    <span class="dimension-icon">{{ dimension.icon }}</span>
                    <span class="dimension-name">{{ dimension.name }}</span>
                    <span class="dimension-score" :style="{ color: dimension.color }">
                      {{ dimension.score }}分
                    </span>
                  </div>
                  <div class="dimension-weight">
                    权重：{{ dimension.weight }}%
                  </div>
                </div>
                <el-progress 
                  :percentage="dimension.score" 
                  :color="dimension.color"
                  :stroke-width="12"
                />
                <div class="dimension-subitems">
                  <div v-for="subItem in dimension.subItems" :key="subItem.label" class="subitem">
                    <span class="subitem-label">{{ subItem.label }}</span>
                    <span class="subitem-value">{{ subItem.value }}分</span>
                    <el-progress 
                      :percentage="subItem.value" 
                      :show-text="false"
                      :stroke-width="4"
                      :color="dimension.color"
                    />
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧：价值分析面板 -->
        <el-col :span="7">
          <!-- 权重配置 -->
          <el-card class="weight-card">
            <template #header>
              <div class="card-header">
                <span class="header-title">⚖️ 权重配置</span>
                <el-button size="small" @click="handleWeightChange">应用</el-button>
              </div>
            </template>
            <div class="weight-config">
              <div v-for="(dimension, index) in evaluationDimensions" :key="index" class="weight-item">
                <div class="weight-header">
                  <span class="weight-label">
                    {{ dimension.icon }} {{ dimension.name }}
                  </span>
                  <span class="weight-value">{{ dimension.weight }}%</span>
                </div>
                <el-slider 
                  v-model="dimension.weight" 
                  :max="100"
                  :show-tooltip="false"
                  :marks="{ 0: '0', 25: '25', 50: '50', 75: '75', 100: '100' }"
                />
              </div>
              <div class="weight-total">
                <span>权重总和：</span>
                <span 
                  :class="{ 
                    'total-valid': Math.abs(evaluationDimensions.reduce((sum, d) => sum + d.weight, 0) - 100) < 0.01,
                    'total-invalid': Math.abs(evaluationDimensions.reduce((sum, d) => sum + d.weight, 0) - 100) >= 0.01
                  }"
                >
                  {{ evaluationDimensions.reduce((sum, d) => sum + d.weight, 0) }}%
                </span>
              </div>
            </div>
          </el-card>

          <!-- 价值分布 -->
          <el-card class="distribution-card" style="margin-top: 20px">
            <template #header>
              <span class="header-title">📈 价值分布</span>
            </template>
            <div class="value-chart">
              <div class="chart-item" v-for="(level, key) in valueLevelConfig" :key="key">
                <div class="chart-label">
                  <span :style="{ color: level.color }">●</span>
                  <span>{{ level.label }}</span>
                </div>
                <div class="chart-bar">
                  <div 
                    class="bar-fill"
                    :style="{ 
                      width: (valueStatistics[key + 'Count'] / valueStatistics.totalAssets * 100) + '%',
                      background: level.color
                    }"
                  ></div>
                </div>
                <div class="chart-value">
                  {{ valueStatistics[key + 'Count'] }} ({{ Math.round(valueStatistics[key + 'Count'] / valueStatistics.totalAssets * 100) }}%)
                </div>
              </div>
            </div>
          </el-card>

          <!-- 快捷操作 -->
          <el-card class="actions-card" style="margin-top: 20px">
            <template #header>
              <span class="header-title">⚡ 快捷操作</span>
            </template>
            <div class="quick-actions">
              <el-button type="primary" style="width: 100%; margin-bottom: 10px">
                📊 批量评估
              </el-button>
              <el-button type="success" style="width: 100%; margin-bottom: 10px" @click="handleExportReport">
                📄 导出报告
              </el-button>
              <el-button type="warning" style="width: 100%; margin-bottom: 10px">
                🔄 同步更新
              </el-button>
              <el-button type="info" style="width: 100%">
                📈 价值趋势
              </el-button>
            </div>
          </el-card>

          <!-- 评估说明 -->
          <el-card class="info-card" style="margin-top: 20px">
            <template #header>
              <span class="header-title">ℹ️ 评估说明</span>
            </template>
            <el-descriptions :column="1" size="small" border>
              <el-descriptions-item label="数据质量">
                评估数据的完整性、准确性、一致性和时效性
              </el-descriptions-item>
              <el-descriptions-item label="数据稀缺性">
                评估数据的唯一性、替代性和获取难度
              </el-descriptions-item>
              <el-descriptions-item label="应用频率">
                统计数据的调用次数、使用场景和用户数量
              </el-descriptions-item>
              <el-descriptions-item label="业务价值">
                评估数据对收入贡献、成本节约和效率提升的影响
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 创建评估模型对话框 -->
    <el-dialog
      v-model="showModelDialog"
      title="创建评估模型"
      width="600px"
    >
      <el-form :model="modelForm" label-width="100px">
        <el-form-item label="模型名称">
          <el-input v-model="modelForm.name" placeholder="请输入模型名称" />
        </el-form-item>
        <el-form-item label="模型类型">
          <el-select v-model="modelForm.type" style="width: 100%">
            <el-option label="自定义模型" value="custom" />
            <el-option label="综合评估" value="comprehensive" />
            <el-option label="质量优先" value="quality-first" />
            <el-option label="商业优先" value="business-first" />
          </el-select>
        </el-form-item>
        <el-form-item label="模型描述">
          <el-input
            v-model="modelForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入模型描述"
          />
        </el-form-item>
        <el-divider content-position="left">权重配置</el-divider>
        <el-form-item label="数据质量">
          <el-slider v-model="modelForm.weights.quality" :max="100" show-input />
        </el-form-item>
        <el-form-item label="数据稀缺性">
          <el-slider v-model="modelForm.weights.scarcity" :max="100" show-input />
        </el-form-item>
        <el-form-item label="应用频率">
          <el-slider v-model="modelForm.weights.frequency" :max="100" show-input />
        </el-form-item>
        <el-form-item label="业务价值">
          <el-slider v-model="modelForm.weights.business" :max="100" show-input />
        </el-form-item>
        <el-form-item label="权重总和">
          <el-tag 
            :type="Math.abs(modelForm.weights.quality + modelForm.weights.scarcity + modelForm.weights.frequency + modelForm.weights.business - 100) < 0.01 ? 'success' : 'danger'"
          >
            {{ modelForm.weights.quality + modelForm.weights.scarcity + modelForm.weights.frequency + modelForm.weights.business }}%
          </el-tag>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showModelDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreateModel" :loading="loading">
          创建
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.asset-evaluation-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;

  .statistics-section {
    margin-bottom: 20px;

    .stat-card {
      text-align: center;

      .stat-icon {
        font-size: 24px;
        margin-right: 8px;
      }

      &.value-distribution {
        .distribution-title {
          font-size: 14px;
          color: #909399;
          margin-bottom: 15px;
        }

        .distribution-items {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;

          .dist-item {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            font-weight: 500;

            .label {
              opacity: 0.8;
            }

            .value {
              font-size: 18px;
              font-weight: bold;
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

      .header-actions {
        display: flex;
        gap: 5px;
      }

      .category-info {
        font-size: 14px;
        color: #606266;
      }
    }

    .tree-card {
      height: calc(50vh - 100px);

      .asset-tree {
        .tree-node {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-right: 10px;

          .node-info {
            display: flex;
            align-items: center;
            gap: 8px;

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

          .node-value {
            font-size: 12px;
            color: #67C23A;
            font-weight: 500;
          }
        }
      }
    }

    .model-card {
      height: calc(50vh - 140px);

      .model-list {
        max-height: calc(50vh - 200px);
        overflow-y: auto;

        .model-item {
          padding: 12px;
          background: #f9fafb;
          border-radius: 8px;
          margin-bottom: 10px;
          border: 2px solid transparent;
          transition: all 0.3s;

          &.active {
            border-color: #409EFF;
            background: #ecf5ff;
          }

          &:hover {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .model-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;

            .model-name {
              font-size: 14px;
              font-weight: 500;
              color: #303133;
            }
          }

          .model-desc {
            font-size: 12px;
            color: #909399;
            margin-bottom: 10px;
            line-height: 1.5;
          }

          .model-actions {
            display: flex;
            justify-content: flex-end;
          }
        }
      }
    }

    .list-card {
      .score-cell {
        .score-value {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 5px;
          display: block;
        }
      }

      .price-value {
        color: #67C23A;
        font-weight: 500;
      }
    }

    .detail-card {
      .evaluation-summary {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 0;

        .summary-left {
          .asset-name {
            font-size: 18px;
            font-weight: bold;
            color: #303133;
            margin-bottom: 8px;
          }

          .asset-meta {
            font-size: 13px;
            color: #909399;
          }
        }

        .summary-right {
          display: flex;
          gap: 30px;

          .total-score,
          .estimated-price {
            text-align: center;

            .score-label,
            .price-label {
              font-size: 12px;
              color: #909399;
              margin-bottom: 5px;
            }

            .score-value {
              font-size: 32px;
              font-weight: bold;
            }

            .price-value {
              font-size: 24px;
              font-weight: bold;
              color: #67C23A;
            }
          }
        }
      }

      .dimensions-evaluation {
        .dimension-item {
          margin-bottom: 25px;

          &:last-child {
            margin-bottom: 0;
          }

          .dimension-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;

            .dimension-title {
              display: flex;
              align-items: center;
              gap: 8px;

              .dimension-icon {
                font-size: 18px;
              }

              .dimension-name {
                font-size: 15px;
                font-weight: 500;
                color: #303133;
              }

              .dimension-score {
                font-size: 16px;
                font-weight: bold;
              }
            }

            .dimension-weight {
              font-size: 12px;
              color: #909399;
            }
          }

          .dimension-subitems {
            margin-top: 15px;
            padding-left: 26px;

            .subitem {
              display: grid;
              grid-template-columns: 80px 50px 1fr;
              align-items: center;
              gap: 10px;
              margin-bottom: 8px;

              .subitem-label {
                font-size: 13px;
                color: #606266;
              }

              .subitem-value {
                font-size: 12px;
                color: #909399;
                text-align: right;
              }
            }
          }
        }
      }
    }

    .weight-card {
      .weight-config {
        .weight-item {
          margin-bottom: 20px;

          .weight-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;

            .weight-label {
              font-size: 14px;
              color: #303133;
            }

            .weight-value {
              font-size: 14px;
              font-weight: bold;
              color: #409EFF;
            }
          }
        }

        .weight-total {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #EBEEF5;
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          font-weight: 500;

          .total-valid {
            color: #67C23A;
          }

          .total-invalid {
            color: #F56C6C;
          }
        }
      }
    }

    .distribution-card {
      .value-chart {
        .chart-item {
          display: grid;
          grid-template-columns: 100px 1fr 80px;
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;

          .chart-label {
            font-size: 13px;
            color: #606266;

            span:first-child {
              margin-right: 5px;
              font-size: 16px;
            }
          }

          .chart-bar {
            height: 20px;
            background: #f5f7fa;
            border-radius: 10px;
            overflow: hidden;

            .bar-fill {
              height: 100%;
              border-radius: 10px;
              transition: width 0.3s;
            }
          }

          .chart-value {
            font-size: 13px;
            color: #606266;
            text-align: right;
          }
        }
      }
    }

    .actions-card {
      .quick-actions {
        display: flex;
        flex-direction: column;
      }
    }

    .info-card {
      :deep(.el-descriptions__label) {
        font-weight: 500;
      }

      :deep(.el-descriptions__content) {
        font-size: 12px;
        line-height: 1.6;
      }
    }
  }
}
</style>