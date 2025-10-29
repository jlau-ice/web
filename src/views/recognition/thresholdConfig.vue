<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'

// 类型定义
interface ThresholdConfig {
  id: string
  sensitiveType: string
  typeName: string
  currentThreshold: number
  accuracy: number
  recall: number
  f1Score: number
  defaultThreshold: number
  recommendedMin: number
  recommendedMax: number
  description: string
  category: string
}

interface ThresholdScheme {
  id: string
  name: string
  description: string
  createTime: string
  isActive: boolean
  configs: Record<string, number>
}

interface PerformanceMetric {
  threshold: number
  accuracy: number
  recall: number
  f1Score: number
}

// 响应式数据
const loading = ref(false)
const tableData = ref<ThresholdConfig[]>([])
const filteredTableData = ref<ThresholdConfig[]>([])
const selectedConfig = ref<ThresholdConfig | null>(null)
const searchKeyword = ref('')
const selectedCategory = ref('')
const schemes = ref<ThresholdScheme[]>([])
const currentScheme = ref<string>('')

// 筛选条件
const filterForm = reactive({
  category: '',
  minAccuracy: 0,
  minRecall: 0,
  minF1: 0
})

// 批量选择
const selectedIds = ref<string[]>([])
const batchThreshold = ref(0.5)

// 效果预览数据
const performanceData = ref<PerformanceMetric[]>([])
const testImageUrl = ref('')
const testResult = ref<any>(null)

// 方案管理对话框
const schemeDialogVisible = ref(false)
const schemeForm = reactive({
  name: '',
  description: ''
})
const schemeFormRef = ref<FormInstance>()

// 导入导出
const importDialogVisible = ref(false)
const exportDialogVisible = ref(false)
const importData = ref('')

// 优化建议
const optimizationSuggestions = ref<any[]>([])

// 模拟数据生成
const mockTableData = (): ThresholdConfig[] => {
  const types = [
    { type: 'violence', name: '暴力', category: '内容安全', desc: '识别暴力、血腥等内容' },
    { type: 'porn', name: '色情', category: '内容安全', desc: '识别色情、低俗内容' },
    { type: 'terror', name: '恐怖', category: '内容安全', desc: '识别恐怖、惊悚内容' },
    { type: 'politics', name: '政治敏感', category: '内容安全', desc: '识别政治敏感内容' },
    { type: 'ads', name: '广告', category: '商业内容', desc: '识别广告、营销内容' },
    { type: 'spam', name: '垃圾信息', category: '商业内容', desc: '识别垃圾、骚扰信息' },
    { type: 'abuse', name: '辱骂', category: '文明用语', desc: '识别辱骂、攻击性言论' },
    { type: 'discrimination', name: '歧视', category: '文明用语', desc: '识别歧视性言论' },
    { type: 'minors', name: '未成年保护', category: '特殊保护', desc: '识别涉及未成年人的敏感内容' },
    { type: 'privacy', name: '隐私泄露', category: '特殊保护', desc: '识别隐私信息泄露' }
  ]

  return types.map((item, index) => ({
    id: `config_${index + 1}`,
    sensitiveType: item.type,
    typeName: item.name,
    currentThreshold: Math.round((0.5 + Math.random() * 0.3) * 100) / 100,
    accuracy: Math.round((0.85 + Math.random() * 0.1) * 100) / 100,
    recall: Math.round((0.80 + Math.random() * 0.15) * 100) / 100,
    f1Score: 0,
    defaultThreshold: 0.6,
    recommendedMin: 0.5,
    recommendedMax: 0.8,
    description: item.desc,
    category: item.category
  })).map(item => ({
    ...item,
    f1Score: Math.round((2 * item.accuracy * item.recall / (item.accuracy + item.recall)) * 100) / 100
  }))
}

// 模拟方案数据
const mockSchemes = (): ThresholdScheme[] => {
  return [
    {
      id: 'scheme_1',
      name: '严格模式',
      description: '适用于高安全要求场景，阈值较低，提高召回率',
      createTime: '2025-10-15 10:30:00',
      isActive: false,
      configs: {}
    },
    {
      id: 'scheme_2',
      name: '平衡模式',
      description: '平衡准确率和召回率，适用于一般场景',
      createTime: '2025-10-20 14:20:00',
      isActive: true,
      configs: {}
    },
    {
      id: 'scheme_3',
      name: '宽松模式',
      description: '阈值较高，减少误报，适用于低敏感场景',
      createTime: '2025-10-25 09:15:00',
      isActive: false,
      configs: {}
    }
  ]
}

// 获取性能等级颜色
const getPerformanceColor = (value: number): string => {
  if (value >= 0.9) return 'success'
  if (value >= 0.8) return 'primary'
  if (value >= 0.7) return 'warning'
  return 'danger'
}

// 获取阈值范围类型
const getThresholdRangeType = (threshold: number, config: ThresholdConfig): string => {
  if (threshold >= config.recommendedMin && threshold <= config.recommendedMax) {
    return 'success'
  }
  if (threshold >= config.recommendedMin - 0.1 && threshold <= config.recommendedMax + 0.1) {
    return 'warning'
  }
  return 'danger'
}

// 计算性能指标
const calculateMetrics = (threshold: number, baseAccuracy: number, baseRecall: number) => {
  // 模拟阈值变化对准确率和召回率的影响
  // 阈值越高，准确率越高，召回率越低
  const accuracy = Math.min(0.99, baseAccuracy + (threshold - 0.6) * 0.15)
  const recall = Math.max(0.6, baseRecall - (threshold - 0.6) * 0.2)
  const f1Score = 2 * accuracy * recall / (accuracy + recall)
  
  return {
    accuracy: Math.round(accuracy * 100) / 100,
    recall: Math.round(recall * 100) / 100,
    f1Score: Math.round(f1Score * 100) / 100
  }
}

// 更新性能预览数据
const updatePerformanceData = (config: ThresholdConfig) => {
  const data: PerformanceMetric[] = []
  for (let i = 0; i <= 100; i += 5) {
    const threshold = i / 100
    const metrics = calculateMetrics(threshold, 0.85, 0.80)
    data.push({
      threshold,
      ...metrics
    })
  }
  performanceData.value = data
}

// 阈值变化处理
const handleThresholdChange = (value: number, config: ThresholdConfig) => {
  const metrics = calculateMetrics(value, 0.85, 0.80)
  config.currentThreshold = value
  config.accuracy = metrics.accuracy
  config.recall = metrics.recall
  config.f1Score = metrics.f1Score
  
  updatePerformanceData(config)
}

// 当前选中配置的阈值变化处理
const handleSelectedConfigThresholdChange = (value: number | null) => {
  if (value !== null && selectedConfig.value) {
    handleThresholdChange(value, selectedConfig.value)
  }
}

// 选择配置
const handleSelectConfig = (config: ThresholdConfig) => {
  selectedConfig.value = config
  updatePerformanceData(config)
}

// 重置阈值
const handleResetThreshold = (config: ThresholdConfig) => {
  ElMessageBox.confirm(
    '确认重置该类型的阈值到默认值吗？',
    '重置确认',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    handleThresholdChange(config.defaultThreshold, config)
    ElMessage.success('阈值已重置')
  }).catch(() => {})
}

// 搜索和筛选
const handleSearch = () => {
  let filtered = tableData.value

  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(item =>
      item.typeName.toLowerCase().includes(keyword) ||
      item.sensitiveType.toLowerCase().includes(keyword) ||
      item.description.toLowerCase().includes(keyword)
    )
  }

  // 分类筛选
  if (filterForm.category) {
    filtered = filtered.filter(item => item.category === filterForm.category)
  }

  // 性能指标筛选
  if (filterForm.minAccuracy > 0) {
    filtered = filtered.filter(item => item.accuracy >= filterForm.minAccuracy / 100)
  }
  if (filterForm.minRecall > 0) {
    filtered = filtered.filter(item => item.recall >= filterForm.minRecall / 100)
  }
  if (filterForm.minF1 > 0) {
    filtered = filtered.filter(item => item.f1Score >= filterForm.minF1 / 100)
  }

  filteredTableData.value = filtered
}

// 重置筛选
const handleResetFilter = () => {
  searchKeyword.value = ''
  filterForm.category = ''
  filterForm.minAccuracy = 0
  filterForm.minRecall = 0
  filterForm.minF1 = 0
  filteredTableData.value = tableData.value
}

// 批量选择处理
const handleSelectionChange = (selection: ThresholdConfig[]) => {
  selectedIds.value = selection.map(item => item.id)
}

// 批量调整阈值
const handleBatchAdjust = () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要调整的配置项')
    return
  }

  ElMessageBox.confirm(
    `确认将选中的 ${selectedIds.value.length} 个配置的阈值调整为 ${batchThreshold.value} 吗？`,
    '批量调整确认',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    tableData.value.forEach(config => {
      if (selectedIds.value.includes(config.id)) {
        handleThresholdChange(batchThreshold.value, config)
      }
    })
    ElMessage.success('批量调整成功')
  }).catch(() => {})
}

// 保存方案
const handleSaveScheme = async () => {
  if (!schemeFormRef.value) return
  
  await schemeFormRef.value.validate((valid) => {
    if (valid) {
      const configs: Record<string, number> = {}
      tableData.value.forEach(item => {
        configs[item.sensitiveType] = item.currentThreshold
      })

      const newScheme: ThresholdScheme = {
        id: `scheme_${Date.now()}`,
        name: schemeForm.name,
        description: schemeForm.description,
        createTime: new Date().toLocaleString('zh-CN'),
        isActive: false,
        configs
      }

      schemes.value.push(newScheme)
      schemeDialogVisible.value = false
      schemeForm.name = ''
      schemeForm.description = ''
      ElMessage.success('方案保存成功')
    }
  })
}

// 应用方案
const handleApplyScheme = (scheme: ThresholdScheme) => {
  ElMessageBox.confirm(
    `确认应用方案"${scheme.name}"吗？当前配置将被覆盖。`,
    '应用方案',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    tableData.value.forEach(config => {
      const thresholdValue = scheme.configs[config.sensitiveType]
      if (thresholdValue !== undefined) {
        handleThresholdChange(thresholdValue, config)
      }
    })

    schemes.value.forEach(s => {
      s.isActive = s.id === scheme.id
    })
    currentScheme.value = scheme.name

    ElMessage.success(`方案"${scheme.name}"已应用`)
  }).catch(() => {})
}

// 删除方案
const handleDeleteScheme = (scheme: ThresholdScheme) => {
  ElMessageBox.confirm(
    `确认删除方案"${scheme.name}"吗？`,
    '删除确认',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const index = schemes.value.findIndex(s => s.id === scheme.id)
    if (index > -1) {
      schemes.value.splice(index, 1)
      ElMessage.success('方案已删除')
    }
  }).catch(() => {})
}

// 导出配置
const handleExport = () => {
  const configs: Record<string, number> = {}
  tableData.value.forEach(item => {
    configs[item.sensitiveType] = item.currentThreshold
  })

  const exportData = {
    version: '1.0',
    exportTime: new Date().toISOString(),
    configs
  }

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `threshold_config_${Date.now()}.json`
  link.click()
  URL.revokeObjectURL(url)

  ElMessage.success('配置已导出')
}

// 导入配置
const handleImport = () => {
  try {
    const data = JSON.parse(importData.value)
    
    if (!data.configs) {
      throw new Error('配置格式错误')
    }

    tableData.value.forEach(config => {
      const thresholdValue = data.configs[config.sensitiveType]
      if (thresholdValue !== undefined) {
        handleThresholdChange(thresholdValue, config)
      }
    })

    importDialogVisible.value = false
    importData.value = ''
    ElMessage.success('配置已导入')
  } catch (error) {
    ElMessage.error('导入失败，请检查数据格式')
  }
}

// 上传测试图片
const handleTestImageUpload = (file: any) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    testImageUrl.value = e.target?.result as string
    
    // 模拟识别结果
    setTimeout(() => {
      testResult.value = {
        detections: tableData.value.slice(0, 3).map(config => ({
          type: config.typeName,
          confidence: Math.round(Math.random() * 100) / 100,
          threshold: config.currentThreshold,
          passed: Math.random() > config.currentThreshold
        }))
      }
      ElMessage.success('识别完成')
    }, 1500)
  }
  reader.readAsDataURL(file.raw)
  return false
}

// 生成优化建议
const generateOptimizationSuggestions = () => {
  optimizationSuggestions.value = [
    {
      type: 'warning',
      title: '召回率偏低',
      content: '色情、暴力类型的召回率低于80%，建议适当降低阈值',
      action: '自动优化',
      configs: ['porn', 'violence']
    },
    {
      type: 'info',
      title: '准确率优秀',
      content: '政治敏感类型准确率达到95%，当前配置良好',
      action: '',
      configs: ['politics']
    },
    {
      type: 'success',
      title: 'F1分数提升',
      content: '相比上周，整体F1分数提升3.2%，优化效果明显',
      action: '',
      configs: []
    }
  ]
}

// 应用自动优化
const handleAutoOptimize = (suggestion: any) => {
  ElMessageBox.confirm(
    '确认应用自动优化建议吗？',
    '自动优化',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    tableData.value.forEach(config => {
      if (suggestion.configs.includes(config.sensitiveType)) {
        // 自动调整阈值
        const optimizedThreshold = config.currentThreshold - 0.05
        handleThresholdChange(Math.max(0.3, optimizedThreshold), config)
      }
    })
    ElMessage.success('自动优化已应用')
  }).catch(() => {})
}

// 保存所有配置
const handleSaveAll = () => {
  loading.value = true
  
  setTimeout(() => {
    loading.value = false
    ElMessage.success('配置保存成功')
  }, 1000)
}

// 获取分类列表
const categories = computed(() => {
  const cats = new Set(tableData.value.map(item => item.category))
  return Array.from(cats)
})

// 初始化
onMounted(() => {
  loading.value = true
  
  setTimeout(() => {
    tableData.value = mockTableData()
    filteredTableData.value = tableData.value
    schemes.value = mockSchemes()
    
    // 设置默认选中第一个配置
    if (tableData.value.length > 0) {
      handleSelectConfig(tableData.value[0])
    }
    
    generateOptimizationSuggestions()
    loading.value = false
  }, 800)
})
</script>

<template>
  <div class="threshold-config-container">
    <!-- 头部工具栏 -->
    <el-card class="header-card" shadow="never">
      <div class="header-toolbar">
        <div class="left-tools">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索敏感类型..."
            style="width: 240px"
            clearable
            @change="handleSearch"
          >
            <template #prefix>
              <i class="el-icon-search" />
            </template>
          </el-input>

          <el-select
            v-model="filterForm.category"
            placeholder="选择分类"
            clearable
            style="width: 160px"
            @change="handleSearch"
          >
            <el-option
              v-for="cat in categories"
              :key="cat"
              :label="cat"
              :value="cat"
            />
          </el-select>

          <el-button @click="handleResetFilter">重置筛选</el-button>
        </div>

        <div class="right-tools">
          <el-button type="primary" @click="schemeDialogVisible = true">
            保存为方案
          </el-button>
          <el-button @click="handleExport">导出配置</el-button>
          <el-button @click="importDialogVisible = true">导入配置</el-button>
          <el-button type="success" @click="handleSaveAll" :loading="loading">
            保存所有配置
          </el-button>
        </div>
      </div>

      <!-- 当前方案提示 -->
      <el-alert
        v-if="currentScheme"
        :title="`当前应用方案：${currentScheme}`"
        type="info"
        :closable="false"
        style="margin-top: 12px"
      />
    </el-card>

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 左侧：配置列表 -->
      <div class="left-panel">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span class="title">阈值配置列表</span>
              <span class="count">共 {{ filteredTableData.length }} 项</span>
            </div>
          </template>

          <!-- 批量操作 -->
          <div class="batch-operations" v-if="selectedIds.length > 0">
            <span>已选择 {{ selectedIds.length }} 项</span>
            <el-input-number
              v-model="batchThreshold"
              :min="0"
              :max="1"
              :step="0.05"
              :precision="2"
              size="small"
              style="width: 120px; margin: 0 12px"
            />
            <el-button size="small" type="primary" @click="handleBatchAdjust">
              批量调整
            </el-button>
          </div>

          <el-table
            :data="filteredTableData"
            v-loading="loading"
            stripe
            @selection-change="handleSelectionChange"
            @row-click="handleSelectConfig"
            :row-class-name="({ row }) => row.id === selectedConfig?.id ? 'selected-row' : ''"
            max-height="calc(100vh - 280px)"
          >
            <el-table-column type="selection" width="50" />
            
            <el-table-column prop="typeName" label="敏感类型" width="120">
              <template #default="{ row }">
                <div class="type-cell">
                  <span class="type-name">{{ row.typeName }}</span>
                  <el-tag size="small" effect="plain">{{ row.category }}</el-tag>
                </div>
              </template>
            </el-table-column>

            <el-table-column prop="currentThreshold" label="当前阈值" width="150">
              <template #default="{ row }">
                <el-tag
                  :type="getThresholdRangeType(row.currentThreshold, row)"
                  effect="dark"
                >
                  {{ row.currentThreshold.toFixed(2) }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="性能指标" min-width="300">
              <template #default="{ row }">
                <div class="metrics-cell">
                  <div class="metric-item">
                    <span class="label">准确率:</span>
                    <el-progress
                      :percentage="row.accuracy * 100"
                      :color="getPerformanceColor(row.accuracy)"
                      :stroke-width="8"
                    />
                  </div>
                  <div class="metric-item">
                    <span class="label">召回率:</span>
                    <el-progress
                      :percentage="row.recall * 100"
                      :color="getPerformanceColor(row.recall)"
                      :stroke-width="8"
                    />
                  </div>
                  <div class="metric-item">
                    <span class="label">F1分数:</span>
                    <el-progress
                      :percentage="row.f1Score * 100"
                      :color="getPerformanceColor(row.f1Score)"
                      :stroke-width="8"
                    />
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button
                  link
                  type="primary"
                  size="small"
                  @click.stop="handleSelectConfig(row)"
                >
                  调节
                </el-button>
                <el-button
                  link
                  type="warning"
                  size="small"
                  @click.stop="handleResetThreshold(row)"
                >
                  重置
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>

      <!-- 中间：阈值调节面板 -->
      <div class="center-panel">
        <el-card shadow="never" v-if="selectedConfig">
          <template #header>
            <div class="card-header">
              <span class="title">{{ selectedConfig.typeName }} - 阈值调节</span>
            </div>
          </template>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="敏感类型">
              {{ selectedConfig.typeName }}
            </el-descriptions-item>
            <el-descriptions-item label="分类">
              <el-tag>{{ selectedConfig.category }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="描述" :span="2">
              {{ selectedConfig.description }}
            </el-descriptions-item>
          </el-descriptions>

          <div class="threshold-adjuster">
            <div class="adjuster-header">
              <span class="label">当前阈值</span>
              <el-input-number
                v-model="selectedConfig.currentThreshold"
                :min="0"
                :max="1"
                :step="0.01"
                :precision="2"
                @change="handleSelectedConfigThresholdChange"
              />
            </div>

            <div class="slider-container">
              <el-slider
                v-model="selectedConfig.currentThreshold"
                :min="0"
                :max="1"
                :step="0.01"
                :marks="{
                  [selectedConfig.recommendedMin]: '推荐最小值',
                  [selectedConfig.recommendedMax]: '推荐最大值',
                  [selectedConfig.defaultThreshold]: '默认值'
                }"
                @change="handleSelectedConfigThresholdChange"
              />
            </div>

            <div class="range-indicator">
              <div class="range-item danger">
                <span class="dot"></span>
                <span>不推荐范围</span>
              </div>
              <div class="range-item warning">
                <span class="dot"></span>
                <span>可接受范围</span>
              </div>
              <div class="range-item success">
                <span class="dot"></span>
                <span>推荐范围</span>
              </div>
            </div>
          </div>

          <!-- 实时指标 -->
          <div class="realtime-metrics">
            <el-row :gutter="16">
              <el-col :span="8">
                <el-card shadow="hover" class="metric-card">
                  <div class="metric-content">
                    <div class="metric-icon accuracy">
                      <i class="el-icon-check" />
                    </div>
                    <div class="metric-info">
                      <div class="metric-label">准确率</div>
                      <div class="metric-value">{{ (selectedConfig.accuracy * 100).toFixed(1) }}%</div>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card shadow="hover" class="metric-card">
                  <div class="metric-content">
                    <div class="metric-icon recall">
                      <i class="el-icon-refresh" />
                    </div>
                    <div class="metric-info">
                      <div class="metric-label">召回率</div>
                      <div class="metric-value">{{ (selectedConfig.recall * 100).toFixed(1) }}%</div>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card shadow="hover" class="metric-card">
                  <div class="metric-content">
                    <div class="metric-icon f1">
                      <i class="el-icon-trophy" />
                    </div>
                    <div class="metric-info">
                      <div class="metric-label">F1分数</div>
                      <div class="metric-value">{{ (selectedConfig.f1Score * 100).toFixed(1) }}%</div>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>

          <!-- 性能曲线 -->
          <div class="performance-chart">
            <div class="chart-header">性能曲线预览</div>
            <div class="chart-placeholder">
              <el-table :data="performanceData.filter((_, i) => i % 4 === 0)" size="small" max-height="200">
                <el-table-column prop="threshold" label="阈值" width="80">
                  <template #default="{ row }">
                    {{ row.threshold.toFixed(2) }}
                  </template>
                </el-table-column>
                <el-table-column prop="accuracy" label="准确率" width="90">
                  <template #default="{ row }">
                    {{ (row.accuracy * 100).toFixed(1) }}%
                  </template>
                </el-table-column>
                <el-table-column prop="recall" label="召回率" width="90">
                  <template #default="{ row }">
                    {{ (row.recall * 100).toFixed(1) }}%
                  </template>
                </el-table-column>
                <el-table-column prop="f1Score" label="F1分数" width="90">
                  <template #default="{ row }">
                    {{ (row.f1Score * 100).toFixed(1) }}%
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" v-else class="empty-card">
          <el-empty description="请从左侧列表选择一个配置项进行调节" />
        </el-card>
      </div>

      <!-- 右侧：效果预览和优化建议 -->
      <div class="right-panel">
        <!-- 方案管理 -->
        <el-card shadow="never" class="schemes-card">
          <template #header>
            <div class="card-header">
              <span class="title">阈值方案</span>
            </div>
          </template>

          <div class="schemes-list">
            <div
              v-for="scheme in schemes"
              :key="scheme.id"
              class="scheme-item"
              :class="{ active: scheme.isActive }"
            >
              <div class="scheme-info">
                <div class="scheme-name">
                  {{ scheme.name }}
                  <el-tag v-if="scheme.isActive" type="success" size="small">当前</el-tag>
                </div>
                <div class="scheme-desc">{{ scheme.description }}</div>
                <div class="scheme-time">{{ scheme.createTime }}</div>
              </div>
              <div class="scheme-actions">
                <el-button
                  size="small"
                  type="primary"
                  link
                  @click="handleApplyScheme(scheme)"
                >
                  应用
                </el-button>
                <el-button
                  size="small"
                  type="danger"
                  link
                  @click="handleDeleteScheme(scheme)"
                >
                  删除
                </el-button>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 优化建议 -->
        <el-card shadow="never" class="suggestions-card">
          <template #header>
            <div class="card-header">
              <span class="title">优化建议</span>
            </div>
          </template>

          <div class="suggestions-list">
            <el-alert
              v-for="(suggestion, index) in optimizationSuggestions"
              :key="index"
              :title="suggestion.title"
              :type="suggestion.type"
              :closable="false"
              class="suggestion-item"
            >
              <template #default>
                <div class="suggestion-content">
                  <p>{{ suggestion.content }}</p>
                  <el-button
                    v-if="suggestion.action"
                    size="small"
                    type="primary"
                    @click="handleAutoOptimize(suggestion)"
                  >
                    {{ suggestion.action }}
                  </el-button>
                </div>
              </template>
            </el-alert>
          </div>
        </el-card>

        <!-- 测试验证 -->
        <el-card shadow="never" class="test-card">
          <template #header>
            <div class="card-header">
              <span class="title">效果测试</span>
            </div>
          </template>

          <el-upload
            class="test-upload"
            drag
            :auto-upload="false"
            :on-change="handleTestImageUpload"
            accept="image/*"
          >
            <div class="upload-content">
              <i class="el-icon-upload" style="font-size: 48px; color: #409eff" />
              <div class="upload-text">点击或拖拽图片进行测试</div>
            </div>
          </el-upload>

          <div v-if="testImageUrl" class="test-result">
            <img :src="testImageUrl" class="test-image" />
            <div v-if="testResult" class="result-list">
              <div
                v-for="(detection, index) in testResult.detections"
                :key="index"
                class="result-item"
              >
                <span class="result-type">{{ detection.type }}</span>
                <span class="result-confidence">{{ (detection.confidence * 100).toFixed(1) }}%</span>
                <el-tag
                  :type="detection.passed ? 'success' : 'danger'"
                  size="small"
                >
                  {{ detection.passed ? '通过' : '拦截' }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 保存方案对话框 -->
    <el-dialog
      v-model="schemeDialogVisible"
      title="保存阈值方案"
      width="500px"
    >
      <el-form
        ref="schemeFormRef"
        :model="schemeForm"
        label-width="80px"
      >
        <el-form-item
          label="方案名称"
          prop="name"
          :rules="[{ required: true, message: '请输入方案名称' }]"
        >
          <el-input v-model="schemeForm.name" placeholder="请输入方案名称" />
        </el-form-item>
        <el-form-item label="方案描述" prop="description">
          <el-input
            v-model="schemeForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入方案描述"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="schemeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveScheme">保存</el-button>
      </template>
    </el-dialog>

    <!-- 导入配置对话框 -->
    <el-dialog
      v-model="importDialogVisible"
      title="导入配置"
      width="600px"
    >
      <el-input
        v-model="importData"
        type="textarea"
        :rows="12"
        placeholder="请粘贴配置 JSON 数据..."
      />

      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleImport">导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.threshold-config-container {

  .header-card {
    margin-bottom: 20px;

    .header-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;

      .left-tools,
      .right-tools {
        display: flex;
        gap: 12px;
        align-items: center;
      }
    }
  }

  .main-content {
    display: grid;
    grid-template-columns: 1fr 1.2fr 0.8fr;
    gap: 20px;
    align-items: start;

    .left-panel,
    .center-panel,
    .right-panel {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title {
      font-weight: 600;
      font-size: 16px;
    }

    .count {
      color: #909399;
      font-size: 14px;
    }
  }

  .batch-operations {
    display: flex;
    align-items: center;
    padding: 12px;
    background: #f0f9ff;
    border-radius: 4px;
    margin-bottom: 12px;
    border: 1px solid #b3e0ff;
  }

  .type-cell {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .type-name {
      font-weight: 500;
    }
  }

  .metrics-cell {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .metric-item {
      display: flex;
      align-items: center;
      gap: 8px;

      .label {
        min-width: 60px;
        font-size: 12px;
        color: #606266;
      }

      .el-progress {
        flex: 1;
      }
    }
  }

  .threshold-adjuster {
    margin-top: 20px;

    .adjuster-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      .label {
        font-weight: 500;
        font-size: 14px;
      }
    }

    .slider-container {
      padding: 20px 0;
    }

    .range-indicator {
      display: flex;
      gap: 24px;
      justify-content: center;
      margin-top: 20px;

      .range-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;

        .dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        &.success .dot {
          background: #67c23a;
        }

        &.warning .dot {
          background: #e6a23c;
        }

        &.danger .dot {
          background: #f56c6c;
        }
      }
    }
  }

  .realtime-metrics {
    margin-top: 24px;

    .metric-card {
      border-radius: 8px;

      .metric-content {
        display: flex;
        align-items: center;
        gap: 16px;

        .metric-icon {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: white;

          &.accuracy {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }

          &.recall {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          }

          &.f1 {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          }
        }

        .metric-info {
          flex: 1;

          .metric-label {
            font-size: 12px;
            color: #909399;
            margin-bottom: 4px;
          }

          .metric-value {
            font-size: 24px;
            font-weight: 600;
            color: #303133;
          }
        }
      }
    }
  }

  .performance-chart {
    margin-top: 24px;

    .chart-header {
      font-weight: 500;
      margin-bottom: 12px;
    }

    .chart-placeholder {
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      overflow: hidden;
    }
  }

  .empty-card {
    height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .schemes-card {
    .schemes-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 300px;
      overflow-y: auto;

      .scheme-item {
        padding: 12px;
        border: 1px solid #dcdfe6;
        border-radius: 4px;
        transition: all 0.3s;

        &:hover {
          border-color: #409eff;
          box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
        }

        &.active {
          border-color: #67c23a;
          background: #f0f9ff;
        }

        .scheme-info {
          .scheme-name {
            font-weight: 500;
            margin-bottom: 4px;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .scheme-desc {
            font-size: 12px;
            color: #606266;
            margin-bottom: 4px;
          }

          .scheme-time {
            font-size: 11px;
            color: #909399;
          }
        }

        .scheme-actions {
          margin-top: 8px;
          display: flex;
          gap: 8px;
        }
      }
    }
  }

  .suggestions-card {
    .suggestions-list {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .suggestion-item {
        .suggestion-content {
          p {
            margin: 0 0 8px 0;
            font-size: 13px;
          }
        }
      }
    }
  }

  .test-card {
    .test-upload {
      margin-bottom: 16px;

      .upload-content {
        padding: 20px;
        text-align: center;

        .upload-text {
          margin-top: 8px;
          color: #606266;
          font-size: 14px;
        }
      }
    }

    .test-result {
      .test-image {
        width: 100%;
        max-height: 200px;
        object-fit: contain;
        border-radius: 4px;
        margin-bottom: 12px;
      }

      .result-list {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .result-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #f5f7fa;
          border-radius: 4px;

          .result-type {
            font-weight: 500;
            font-size: 13px;
          }

          .result-confidence {
            color: #606266;
            font-size: 12px;
          }
        }
      }
    }
  }

  :deep(.el-table) {
    .selected-row {
      background-color: #ecf5ff !important;
    }
  }
}
</style>