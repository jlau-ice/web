<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'

// 类型定义
interface WeatherMode {
  id: number
  name: string
  type: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'foggy'
  icon: string
  color: string
  description: string
  isCustom: boolean
  createTime?: string
}

interface WeatherParams {
  rain: {
    intensity: number
    dropSize: number
    density: number
  }
  snow: {
    thickness: number
    flakeSize: number
    fallSpeed: number
  }
  fog: {
    density: number
    visibility: number
    color: string
  }
  cloud: {
    thickness: number
    speed: number
    coverage: number
  }
}

interface WeatherTimeline {
  id: number
  time: number
  weatherType: string
  intensity: number
  duration: number
}

interface WeatherScene {
  id: number
  name: string
  category: string
  tags: string[]
  config: WeatherParams
  weatherType: string
  rating: number
  createTime: string
}

// 响应式数据
const loading = ref(false)
const activeWeatherMode = ref<WeatherMode | null>(null)
const selectedScene = ref<number | null>(null)

// 天气模式列表
const weatherModes = ref<WeatherMode[]>([
  {
    id: 1,
    name: '晴天',
    type: 'sunny',
    icon: '☀️',
    color: '#FDB813',
    description: '万里无云的晴朗天气',
    isCustom: false
  },
  {
    id: 2,
    name: '多云',
    type: 'cloudy',
    icon: '⛅',
    color: '#95A5A6',
    description: '云层覆盖的阴天',
    isCustom: false
  },
  {
    id: 3,
    name: '雨天',
    type: 'rainy',
    icon: '🌧️',
    color: '#3498DB',
    description: '降雨天气效果',
    isCustom: false
  },
  {
    id: 4,
    name: '雪天',
    type: 'snowy',
    icon: '❄️',
    color: '#ECF0F1',
    description: '降雪天气效果',
    isCustom: false
  },
  {
    id: 5,
    name: '雾天',
    type: 'foggy',
    icon: '🌫️',
    color: '#BDC3C7',
    description: '大雾低能见度天气',
    isCustom: false
  }
])

// 天气参数配置
const weatherParams = reactive<WeatherParams>({
  rain: {
    intensity: 50,
    dropSize: 30,
    density: 60
  },
  snow: {
    thickness: 40,
    flakeSize: 35,
    fallSpeed: 45
  },
  fog: {
    density: 55,
    visibility: 40,
    color: '#D3D3D3'
  },
  cloud: {
    thickness: 50,
    speed: 30,
    coverage: 60
  }
})

// 默认参数配置（用于重置）
const defaultParams: WeatherParams = {
  rain: { intensity: 50, dropSize: 30, density: 60 },
  snow: { thickness: 40, flakeSize: 35, fallSpeed: 45 },
  fog: { density: 55, visibility: 40, color: '#D3D3D3' },
  cloud: { thickness: 50, speed: 30, coverage: 60 }
}

// 时间序列数据
const weatherTimeline = ref<WeatherTimeline[]>([
  { id: 1, time: 0, weatherType: '晴天', intensity: 0, duration: 300 },
  { id: 2, time: 300, weatherType: '多云', intensity: 40, duration: 200 },
  { id: 3, time: 500, weatherType: '雨天', intensity: 70, duration: 400 }
])

// 天气场景列表
const weatherScenes = ref<WeatherScene[]>([])

// 动画控制
const isPlaying = ref(false)
const playProgress = ref(0)
const playSpeed = ref(1)

// 对比模式
const compareMode = ref(false)
const beforeEffect = ref<string>('')
const afterEffect = ref<string>('')

// 对话框控制
const customModeDialog = ref(false)
const sceneDialog = ref(false)
const timelineDialog = ref(false)

// 表单数据
const customModeForm = reactive({
  name: '',
  description: '',
  baseType: 'sunny'
})

const sceneForm = reactive({
  name: '',
  category: '自定义',
  tags: [] as string[]
})

const formRef = ref<FormInstance>()

// 计算属性
const currentWeatherType = computed(() => {
  return activeWeatherMode.value?.type || 'sunny'
})

const weatherTypeColor = computed(() => {
  return activeWeatherMode.value?.color || '#409EFF'
})

const totalDuration = computed(() => {
  return weatherTimeline.value.reduce((sum, item) => sum + item.duration, 0)
})

// 天气类型标签颜色
const getWeatherTypeTag = (type: string) => {
  const typeMap: Record<string, string> = {
    sunny: 'warning',
    cloudy: 'info',
    rainy: 'primary',
    snowy: '',
    foggy: 'info'
  }
  return typeMap[type] || ''
}

// 方法
const handleWeatherModeSelect = (mode: WeatherMode) => {
  activeWeatherMode.value = mode
  ElMessage.success(`已切换到${mode.name}模式`)
  
  // 根据天气类型调整参数
  adjustParamsByWeatherType(mode.type)
}

const adjustParamsByWeatherType = (type: string) => {
  switch (type) {
    case 'sunny':
      weatherParams.rain.intensity = 0
      weatherParams.snow.thickness = 0
      weatherParams.fog.density = 10
      weatherParams.cloud.coverage = 20
      break
    case 'cloudy':
      weatherParams.rain.intensity = 0
      weatherParams.snow.thickness = 0
      weatherParams.fog.density = 20
      weatherParams.cloud.coverage = 75
      break
    case 'rainy':
      weatherParams.rain.intensity = 70
      weatherParams.cloud.coverage = 85
      weatherParams.fog.density = 30
      break
    case 'snowy':
      weatherParams.snow.thickness = 60
      weatherParams.cloud.coverage = 80
      weatherParams.fog.density = 25
      break
    case 'foggy':
      weatherParams.fog.density = 85
      weatherParams.fog.visibility = 20
      weatherParams.cloud.coverage = 60
      break
  }
}

const handleAddCustomMode = () => {
  customModeDialog.value = true
  Object.assign(customModeForm, {
    name: '',
    description: '',
    baseType: 'sunny'
  })
}

const submitCustomMode = () => {
  if (!customModeForm.name) {
    ElMessage.error('请输入天气模式名称')
    return
  }

  const newMode: WeatherMode = {
    id: Date.now(),
    name: customModeForm.name,
    type: customModeForm.baseType as any,
    icon: '🌈',
    color: '#9B59B6',
    description: customModeForm.description,
    isCustom: true,
    createTime: new Date().toLocaleString('zh-CN')
  }

  weatherModes.value.push(newMode)
  customModeDialog.value = false
  ElMessage.success('自定义天气模式创建成功')
}

const handleDeleteMode = (mode: WeatherMode) => {
  if (!mode.isCustom) {
    ElMessage.warning('预设天气模式不能删除')
    return
  }

  ElMessageBox.confirm(`确定要删除天气模式"${mode.name}"吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      const index = weatherModes.value.findIndex((m) => m.id === mode.id)
      if (index > -1) {
        weatherModes.value.splice(index, 1)
        ElMessage.success('删除成功')
      }
    })
    .catch(() => {
      ElMessage.info('已取消删除')
    })
}

const handleParamChange = () => {
  ElMessage.success('天气参数已更新')
}

const resetParams = () => {
  ElMessageBox.confirm('确定要重置所有天气参数吗？', '重置确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      Object.assign(weatherParams, JSON.parse(JSON.stringify(defaultParams)))
      ElMessage.success('参数已重置')
    })
    .catch(() => {
      ElMessage.info('已取消重置')
    })
}

// 时间序列控制
const handlePlayAnimation = () => {
  if (isPlaying.value) {
    isPlaying.value = false
    ElMessage.info('动画已暂停')
  } else {
    isPlaying.value = true
    ElMessage.success('动画播放中')
    playAnimation()
  }
}

const playAnimation = () => {
  if (!isPlaying.value) return

  const interval = setInterval(() => {
    if (!isPlaying.value) {
      clearInterval(interval)
      return
    }

    playProgress.value += playSpeed.value
    if (playProgress.value >= 100) {
      playProgress.value = 0
      isPlaying.value = false
      clearInterval(interval)
      ElMessage.success('动画播放完成')
    }
  }, 100)
}

const handleStopAnimation = () => {
  isPlaying.value = false
  playProgress.value = 0
  ElMessage.info('动画已停止')
}

const handleAddTimelineNode = () => {
  const newNode: WeatherTimeline = {
    id: Date.now(),
    time: totalDuration.value,
    weatherType: '晴天',
    intensity: 50,
    duration: 300
  }
  weatherTimeline.value.push(newNode)
  ElMessage.success('时间节点添加成功')
}

const handleDeleteTimelineNode = (node: WeatherTimeline) => {
  const index = weatherTimeline.value.findIndex((n) => n.id === node.id)
  if (index > -1) {
    weatherTimeline.value.splice(index, 1)
    ElMessage.success('时间节点删除成功')
  }
}

// 场景管理
const loadWeatherScenes = () => {
  loading.value = true
  setTimeout(() => {
    weatherScenes.value = [
      {
        id: 1,
        name: '夏日暴雨场景',
        category: '极端天气',
        tags: ['暴雨', '雷电', '强对流'],
        config: JSON.parse(JSON.stringify(weatherParams)),
        weatherType: 'rainy',
        rating: 4.8,
        createTime: '2025-10-20 10:30:00'
      },
      {
        id: 2,
        name: '冬季暴雪场景',
        category: '季节天气',
        tags: ['大雪', '寒冷', '积雪'],
        config: JSON.parse(JSON.stringify(weatherParams)),
        weatherType: 'snowy',
        rating: 4.6,
        createTime: '2025-10-21 14:20:00'
      },
      {
        id: 3,
        name: '清晨浓雾场景',
        category: '特殊效果',
        tags: ['浓雾', '低能见度', '神秘'],
        config: JSON.parse(JSON.stringify(weatherParams)),
        weatherType: 'foggy',
        rating: 4.5,
        createTime: '2025-10-22 09:15:00'
      },
      {
        id: 4,
        name: '春日微雨场景',
        category: '季节天气',
        tags: ['小雨', '清新', '细腻'],
        config: JSON.parse(JSON.stringify(weatherParams)),
        weatherType: 'rainy',
        rating: 4.7,
        createTime: '2025-10-23 11:00:00'
      },
      {
        id: 5,
        name: '秋高气爽场景',
        category: '季节天气',
        tags: ['晴朗', '舒适', '蓝天'],
        config: JSON.parse(JSON.stringify(weatherParams)),
        weatherType: 'sunny',
        rating: 4.9,
        createTime: '2025-10-24 16:45:00'
      },
      {
        id: 6,
        name: '阴云密布场景',
        category: '常规天气',
        tags: ['多云', '阴沉', '压抑'],
        config: JSON.parse(JSON.stringify(weatherParams)),
        weatherType: 'cloudy',
        rating: 4.3,
        createTime: '2025-10-25 13:30:00'
      }
    ]
    loading.value = false
  }, 800)
}

const handleApplyScene = (scene: WeatherScene) => {
  selectedScene.value = scene.id
  Object.assign(weatherParams, scene.config)
  
  const mode = weatherModes.value.find((m) => m.type === scene.weatherType)
  if (mode) {
    activeWeatherMode.value = mode
  }
  
  ElMessage.success(`已应用场景：${scene.name}`)
}

const handleSaveScene = () => {
  if (!activeWeatherMode.value) {
    ElMessage.warning('请先选择天气模式')
    return
  }

  sceneDialog.value = true
  Object.assign(sceneForm, {
    name: '',
    category: '自定义',
    tags: []
  })
}

const submitSceneForm = () => {
  if (!sceneForm.name) {
    ElMessage.error('请输入场景名称')
    return
  }

  const newScene: WeatherScene = {
    id: Date.now(),
    name: sceneForm.name,
    category: sceneForm.category,
    tags: sceneForm.tags,
    config: JSON.parse(JSON.stringify(weatherParams)),
    weatherType: activeWeatherMode.value?.type || 'sunny',
    rating: 0,
    createTime: new Date().toLocaleString('zh-CN')
  }

  weatherScenes.value.unshift(newScene)
  sceneDialog.value = false
  ElMessage.success('场景保存成功')
}

const handleDeleteScene = (scene: WeatherScene) => {
  ElMessageBox.confirm(`确定要删除场景"${scene.name}"吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      const index = weatherScenes.value.findIndex((s) => s.id === scene.id)
      if (index > -1) {
        weatherScenes.value.splice(index, 1)
        ElMessage.success('删除成功')
      }
    })
    .catch(() => {
      ElMessage.info('已取消删除')
    })
}

const handleExportScene = (scene: WeatherScene) => {
  ElMessage.success(`场景"${scene.name}"导出成功`)
}

const handleImportScene = () => {
  ElMessage.info('请选择要导入的场景文件')
}

const toggleCompareMode = () => {
  compareMode.value = !compareMode.value
  if (compareMode.value) {
    beforeEffect.value = '原始效果'
    afterEffect.value = '当前效果'
    ElMessage.success('已开启效果对比模式')
  } else {
    ElMessage.info('已关闭效果对比模式')
  }
}

const handleScreenshot = () => {
  ElMessage.success('场景截图已保存')
}

// 场景分类筛选
const sceneCategories = computed(() => {
  const categories = new Set(weatherScenes.value.map((s) => s.category))
  return Array.from(categories)
})

const selectedCategory = ref<string>('')

const filteredScenes = computed(() => {
  if (!selectedCategory.value) {
    return weatherScenes.value
  }
  return weatherScenes.value.filter((s) => s.category === selectedCategory.value)
})

// 初始化
onMounted(() => {
  // 默认选择晴天模式
  activeWeatherMode.value = weatherModes.value[0]
  adjustParamsByWeatherType('sunny')
  
  // 加载场景数据
  loadWeatherScenes()
})
</script>

<template>
  <div class="weather-effect-page">
    <el-row :gutter="16" class="page-container">
      <!-- 左侧：天气模式选择 -->
      <el-col :span="5">
        <el-card class="weather-mode-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">天气模式</span>
              <el-button type="primary" size="small" @click="handleAddCustomMode">
                自定义
              </el-button>
            </div>
          </template>

          <div class="weather-modes-list">
            <div
              v-for="mode in weatherModes"
              :key="mode.id"
              class="weather-mode-item"
              :class="{ active: activeWeatherMode?.id === mode.id }"
              @click="handleWeatherModeSelect(mode)"
            >
              <div class="mode-icon" :style="{ backgroundColor: mode.color }">
                <span class="icon-text">{{ mode.icon }}</span>
              </div>
              <div class="mode-info">
                <div class="mode-name">{{ mode.name }}</div>
                <div class="mode-desc">{{ mode.description }}</div>
                <el-tag v-if="mode.isCustom" type="success" size="small" class="custom-tag">
                  自定义
                </el-tag>
              </div>
              <div v-if="mode.isCustom" class="mode-actions">
                <el-button
                  type="danger"
                  size="small"
                  link
                  @click.stop="handleDeleteMode(mode)"
                >
                  删除
                </el-button>
              </div>
            </div>
          </div>

          <div class="current-mode-info">
            <div class="info-label">当前生效模式</div>
            <div class="info-value">
              <el-tag :type="getWeatherTypeTag(currentWeatherType)" effect="dark" size="large">
                {{ activeWeatherMode?.name || '未选择' }}
              </el-tag>
            </div>
          </div>
        </el-card>

        <!-- 时间序列控制 -->
        <el-card class="timeline-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">时间序列</span>
              <el-button type="primary" size="small" @click="handleAddTimelineNode">
                添加节点
              </el-button>
            </div>
          </template>

          <div class="timeline-controls">
            <div class="control-buttons">
              <el-button
                :type="isPlaying ? 'warning' : 'primary'"
                size="small"
                @click="handlePlayAnimation"
              >
                {{ isPlaying ? '暂停' : '播放' }}
              </el-button>
              <el-button size="small" @click="handleStopAnimation"> 停止 </el-button>
            </div>

            <div class="progress-section">
              <div class="progress-label">播放进度</div>
              <el-progress :percentage="playProgress" :stroke-width="8" />
            </div>

            <div class="speed-control">
              <span class="control-label">播放速度</span>
              <el-slider v-model="playSpeed" :min="0.5" :max="2" :step="0.5" :marks="{ 0.5: '0.5x', 1: '1x', 1.5: '1.5x', 2: '2x' }" />
            </div>
          </div>

          <el-timeline class="weather-timeline">
            <el-timeline-item
              v-for="node in weatherTimeline"
              :key="node.id"
              :timestamp="`${node.time}s`"
              placement="top"
            >
              <div class="timeline-node">
                <div class="node-info">
                  <div class="node-weather">{{ node.weatherType }}</div>
                  <div class="node-details">
                    强度: {{ node.intensity }}% | 时长: {{ node.duration }}s
                  </div>
                </div>
                <el-button
                  type="danger"
                  size="small"
                  link
                  @click="handleDeleteTimelineNode(node)"
                >
                  删除
                </el-button>
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>

      <!-- 中间：实时效果预览 -->
      <el-col :span="13">
        <el-card class="preview-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">实时效果预览</span>
              <div class="preview-actions">
                <el-button size="small" @click="toggleCompareMode">
                  {{ compareMode ? '关闭对比' : '效果对比' }}
                </el-button>
                <el-button type="primary" size="small" @click="handleScreenshot">
                  截图
                </el-button>
              </div>
            </div>
          </template>

          <!-- 预览区域 -->
          <div v-if="!compareMode" class="preview-container">
            <div class="render-view"  >
              <div class="weather-overlay">
                <div v-if="currentWeatherType === 'rainy'" class="rain-effect">
                  <div class="rain-drops"></div>
                </div>
                <div v-if="currentWeatherType === 'snowy'" class="snow-effect">
                  <div class="snowflakes">❄️</div>
                </div>
                <div
                  v-if="currentWeatherType === 'foggy'"
                  class="fog-effect"
                  :style="{ opacity: weatherParams.fog.density / 100 }"
                ></div>
              </div>

              <!-- 效果信息叠加层 -->
              <div class="effect-info-overlay">
                <div class="effect-item">
                  <span class="effect-label">天气类型:</span>
                  <span class="effect-value">{{ activeWeatherMode?.name }}</span>
                </div>
                <div class="effect-item">
                  <span class="effect-label">能见度:</span>
                  <span class="effect-value">{{ weatherParams.fog.visibility }}%</span>
                </div>
                <div class="effect-item">
                  <span class="effect-label">云层覆盖:</span>
                  <span class="effect-value">{{ weatherParams.cloud.coverage }}%</span>
                </div>
              </div>
            </div>

            <!-- 视角控制 -->
            <div class="view-controls">
              <el-button-group>
                <el-button size="small">正视图</el-button>
                <el-button size="small">鸟瞰图</el-button>
                <el-button size="small">侧视图</el-button>
                <el-button size="small" type="primary">自由视角</el-button>
              </el-button-group>
            </div>
          </div>

          <!-- 对比模式 -->
          <div v-else class="compare-container">
            <el-row :gutter="16">
              <el-col :span="12">
                <div class="compare-view">
                  <div class="compare-label">变化前</div>
                  <div class="compare-render" :style="{ background: 'linear-gradient(to bottom, #87CEEB, #E0F6FF)' }">
                    <div class="compare-placeholder">原始场景效果</div>
                  </div>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="compare-view">
                  <div class="compare-label">变化后</div>
                  <div class="compare-render" :style="{ background: getPreviewBackground() }">
                    <div class="compare-placeholder">当前天气效果</div>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>

          <!-- 影响程度指标 -->
          <div class="impact-metrics">
            <el-row :gutter="16">
              <el-col :span="6">
                <div class="metric-card">
                  <div class="metric-label">光照影响</div>
                  <el-progress
                    type="circle"
                    :percentage="getImpactPercentage('light')"
                    :width="80"
                  />
                </div>
              </el-col>
              <el-col :span="6">
                <div class="metric-card">
                  <div class="metric-label">能见度影响</div>
                  <el-progress
                    type="circle"
                    :percentage="weatherParams.fog.visibility"
                    :width="80"
                    color="#67c23a"
                  />
                </div>
              </el-col>
              <el-col :span="6">
                <div class="metric-card">
                  <div class="metric-label">气氛影响</div>
                  <el-progress
                    type="circle"
                    :percentage="getImpactPercentage('atmosphere')"
                    :width="80"
                    color="#e6a23c"
                  />
                </div>
              </el-col>
              <el-col :span="6">
                <div class="metric-card">
                  <div class="metric-label">整体效果</div>
                  <el-progress
                    type="circle"
                    :percentage="getImpactPercentage('overall')"
                    :width="80"
                    color="#9b59b6"
                  />
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>

        <!-- 场景管理 -->
        <el-card class="scenes-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">天气场景库</span>
              <div class="scene-actions">
                <el-select
                  v-model="selectedCategory"
                  placeholder="场景分类"
                  clearable
                  size="small"
                  style="width: 120px; margin-right: 8px"
                >
                  <el-option
                    v-for="category in sceneCategories"
                    :key="category"
                    :label="category"
                    :value="category"
                  />
                </el-select>
                <el-button type="primary" size="small" @click="handleSaveScene">
                  保存场景
                </el-button>
                <el-button size="small" @click="handleImportScene"> 导入 </el-button>
              </div>
            </div>
          </template>

          <div v-loading="loading" class="scenes-list">
            <el-row :gutter="12">
              <el-col v-for="scene in filteredScenes" :key="scene.id" :span="8">
                <div
                  class="scene-card"
                  :class="{ active: selectedScene === scene.id }"
                  @click="handleApplyScene(scene)"
                >
                  <div class="scene-preview">
                    <div class="scene-type-icon" :style="{ color: getWeatherColor(scene.weatherType) }">
                      {{ getWeatherIcon(scene.weatherType) }}
                    </div>
                  </div>
                  <div class="scene-info">
                    <div class="scene-name">{{ scene.name }}</div>
                    <div class="scene-category">{{ scene.category }}</div>
                    <div class="scene-tags">
                      <el-tag
                        v-for="tag in scene.tags"
                        :key="tag"
                        size="small"
                        class="scene-tag"
                      >
                        {{ tag }}
                      </el-tag>
                    </div>
                    <div class="scene-footer">
                      <el-rate v-model="scene.rating" disabled show-score size="small" />
                      <div class="scene-actions-mini">
                        <el-button
                          type="primary"
                          size="small"
                          link
                          @click.stop="handleExportScene(scene)"
                        >
                          导出
                        </el-button>
                        <el-button
                          type="danger"
                          size="small"
                          link
                          @click.stop="handleDeleteScene(scene)"
                        >
                          删除
                        </el-button>
                      </div>
                    </div>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：参数调整面板 -->
      <el-col :span="6">
        <el-card class="params-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">天气参数</span>
              <el-button size="small" @click="resetParams"> 重置 </el-button>
            </div>
          </template>

          <div class="params-section">
            <!-- 降雨参数 -->
            <div class="param-group">
              <div class="param-label">
                <el-icon><Cloudy /></el-icon>
                <span>降雨效果</span>
              </div>

              <div class="param-item">
                <span class="item-label">降雨强度</span>
                <el-slider
                  v-model="weatherParams.rain.intensity"
                  :min="0"
                  :max="100"
                  show-input
                  @change="handleParamChange"
                />
              </div>

              <div class="param-item">
                <span class="item-label">雨滴大小</span>
                <el-slider
                  v-model="weatherParams.rain.dropSize"
                  :min="0"
                  :max="100"
                  show-input
                  @change="handleParamChange"
                />
              </div>

              <div class="param-item">
                <span class="item-label">雨滴密度</span>
                <el-slider
                  v-model="weatherParams.rain.density"
                  :min="0"
                  :max="100"
                  show-input
                  @change="handleParamChange"
                />
              </div>
            </div>

            <!-- 降雪参数 -->
            <div class="param-group">
              <div class="param-label">
                <el-icon><Van /></el-icon>
                <span>降雪效果</span>
              </div>

              <div class="param-item">
                <span class="item-label">降雪厚度</span>
                <el-slider
                  v-model="weatherParams.snow.thickness"
                  :min="0"
                  :max="100"
                  show-input
                  @change="handleParamChange"
                />
              </div>

              <div class="param-item">
                <span class="item-label">雪花大小</span>
                <el-slider
                  v-model="weatherParams.snow.flakeSize"
                  :min="0"
                  :max="100"
                  show-input
                  @change="handleParamChange"
                />
              </div>

              <div class="param-item">
                <span class="item-label">飘落速度</span>
                <el-slider
                  v-model="weatherParams.snow.fallSpeed"
                  :min="0"
                  :max="100"
                  show-input
                  @change="handleParamChange"
                />
              </div>
            </div>

            <!-- 雾效参数 -->
            <div class="param-group">
              <div class="param-label">
                <el-icon><Sunny /></el-icon>
                <span>雾效设置</span>
              </div>

              <div class="param-item">
                <span class="item-label">雾浓度</span>
                <el-slider
                  v-model="weatherParams.fog.density"
                  :min="0"
                  :max="100"
                  show-input
                  @change="handleParamChange"
                />
              </div>

              <div class="param-item">
                <span class="item-label">能见度</span>
                <el-slider
                  v-model="weatherParams.fog.visibility"
                  :min="0"
                  :max="100"
                  show-input
                  @change="handleParamChange"
                />
              </div>

              <div class="param-item">
                <span class="item-label">雾颜色</span>
                <el-color-picker
                  v-model="weatherParams.fog.color"
                  show-alpha
                  @change="handleParamChange"
                />
              </div>
            </div>

            <!-- 云层参数 -->
            <div class="param-group">
              <div class="param-label">
                <el-icon><Partly-Cloudy /></el-icon>
                <span>云层设置</span>
              </div>

              <div class="param-item">
                <span class="item-label">云层厚度</span>
                <el-slider
                  v-model="weatherParams.cloud.thickness"
                  :min="0"
                  :max="100"
                  show-input
                  @change="handleParamChange"
                />
              </div>

              <div class="param-item">
                <span class="item-label">移动速度</span>
                <el-slider
                  v-model="weatherParams.cloud.speed"
                  :min="0"
                  :max="100"
                  show-input
                  @change="handleParamChange"
                />
              </div>

              <div class="param-item">
                <span class="item-label">覆盖范围</span>
                <el-slider
                  v-model="weatherParams.cloud.coverage"
                  :min="0"
                  :max="100"
                  show-input
                  @change="handleParamChange"
                />
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 自定义天气模式对话框 -->
    <el-dialog
      v-model="customModeDialog"
      title="创建自定义天气模式"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="customModeForm" label-width="100px">
        <el-form-item label="模式名称" required>
          <el-input v-model="customModeForm.name" placeholder="请输入天气模式名称" />
        </el-form-item>
        <el-form-item label="模式描述">
          <el-input
            v-model="customModeForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述信息"
          />
        </el-form-item>
        <el-form-item label="基础类型" required>
          <el-select v-model="customModeForm.baseType" placeholder="选择基础天气类型" class="full-width">
            <el-option label="晴天" value="sunny" />
            <el-option label="多云" value="cloudy" />
            <el-option label="雨天" value="rainy" />
            <el-option label="雪天" value="snowy" />
            <el-option label="雾天" value="foggy" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="customModeDialog = false">取消</el-button>
        <el-button type="primary" @click="submitCustomMode"> 确定 </el-button>
      </template>
    </el-dialog>

    <!-- 保存场景对话框 -->
    <el-dialog
      v-model="sceneDialog"
      title="保存天气场景"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="sceneForm" label-width="100px">
        <el-form-item label="场景名称" required>
          <el-input v-model="sceneForm.name" placeholder="请输入场景名称" />
        </el-form-item>
        <el-form-item label="场景分类" required>
          <el-input v-model="sceneForm.category" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="场景标签">
          <el-select
            v-model="sceneForm.tags"
            multiple
            filterable
            allow-create
            placeholder="请选择或输入标签"
            class="full-width"
          >
            <el-option label="极端天气" value="极端天气" />
            <el-option label="季节天气" value="季节天气" />
            <el-option label="特殊效果" value="特殊效果" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="sceneDialog = false">取消</el-button>
        <el-button type="primary" @click="submitSceneForm"> 保存 </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.weather-effect-page {
  min-height: 100vh;
  background: #f5f7fa;

  .page-container {
    height: 100%;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }
  }

  // 左侧天气模式
  .weather-mode-card {
    margin-bottom: 16px;
    height: calc(55vh - 28px);

    .weather-modes-list {
      max-height: calc(100% - 100px);
      overflow-y: auto;
      margin-bottom: 16px;

      .weather-mode-item {
        display: flex;
        align-items: center;
        padding: 12px;
        margin-bottom: 10px;
        background: #f5f7fa;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s;
        position: relative;

        &:hover {
          background: #e8f4ff;
          transform: translateX(4px);
        }

        &.active {
          background: #e8f4ff;
          border-left: 4px solid #409eff;
          box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
        }

        .mode-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

          .icon-text {
            font-size: 24px;
          }
        }

        .mode-info {
          flex: 1;

          .mode-name {
            font-size: 15px;
            font-weight: 600;
            color: #303133;
            margin-bottom: 4px;
          }

          .mode-desc {
            font-size: 12px;
            color: #909399;
            margin-bottom: 4px;
          }

          .custom-tag {
            margin-top: 4px;
          }
        }

        .mode-actions {
          position: absolute;
          top: 8px;
          right: 8px;
        }
      }
    }

    .current-mode-info {
      padding: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      color: white;

      .info-label {
        font-size: 12px;
        margin-bottom: 8px;
        opacity: 0.9;
      }

      .info-value {
        text-align: center;
      }
    }
  }

  .timeline-card {
    height: calc(45vh - 28px);

    .timeline-controls {
      margin-bottom: 16px;

      .control-buttons {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
      }

      .progress-section {
        margin-bottom: 16px;

        .progress-label {
          font-size: 13px;
          color: #606266;
          margin-bottom: 8px;
        }
      }

      .speed-control {
        .control-label {
          font-size: 13px;
          color: #606266;
          display: block;
          margin-bottom: 8px;
        }
      }
    }

    .weather-timeline {
      max-height: calc(100% - 200px);
      overflow-y: auto;
      padding-top: 10px;

      .timeline-node {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: #f5f7fa;
        border-radius: 6px;

        .node-info {
          flex: 1;

          .node-weather {
            font-size: 14px;
            font-weight: 600;
            color: #303133;
            margin-bottom: 4px;
          }

          .node-details {
            font-size: 12px;
            color: #909399;
          }
        }
      }
    }
  }

  // 中间预览区
  .preview-card {
    margin-bottom: 16px;
    height: calc(55vh - 28px);

    .preview-actions {
      display: flex;
      gap: 8px;
    }

    .preview-container {
      .render-view {
        height: 320px;
        border-radius: 8px;
        position: relative;
        overflow: hidden;
        transition: all 0.5s;
        background-image: url('https://img2.baidu.com/it/u=2833006786,1929985351&fm=253&fmt=auto&app=120&f=JPEG?w=889&h=500');
        .weather-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;

          .rain-effect,
          .snow-effect {
            width: 100%;
            height: 100%;
            font-size: 20px;
            opacity: 0.6;
          }

          .fog-effect {
            width: 100%;
            height: 100%;
            background: linear-gradient(to bottom, rgba(211, 211, 211, 0.3), rgba(211, 211, 211, 0.8));
          }
        }

        .effect-info-overlay {
          position: absolute;
          top: 16px;
          left: 16px;
          background: rgba(0, 0, 0, 0.7);
          padding: 12px;
          border-radius: 6px;
          color: #fff;
          font-size: 13px;

          .effect-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
            min-width: 180px;

            &:last-child {
              margin-bottom: 0;
            }

            .effect-label {
              color: #a0cfff;
            }

            .effect-value {
              font-weight: 600;
              color: #ffd666;
            }
          }
        }
      }

      .view-controls {
        margin-top: 12px;
        text-align: center;
      }
    }

    .compare-container {
      .compare-view {
        .compare-label {
          text-align: center;
          font-size: 14px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 8px;
        }

        .compare-render {
          height: 250px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 16px;
          font-weight: 500;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
      }
    }

    .impact-metrics {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #ebeef5;

      .metric-card {
        text-align: center;

        .metric-label {
          font-size: 13px;
          color: #606266;
          margin-bottom: 12px;
          display: block;
        }
      }
    }
  }

  .scenes-card {
    height: calc(45vh - 28px);

    .scene-actions {
      display: flex;
      align-items: center;
    }

    .scenes-list {
      max-height: calc(100% - 20px);
      overflow-y: auto;

      .scene-card {
        padding: 12px;
        background: #f5f7fa;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s;
        margin-bottom: 12px;

        &:hover {
          background: #e8f4ff;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        &.active {
          background: #e8f4ff;
          border: 2px solid #409eff;
        }

        .scene-preview {
          height: 80px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 10px;

          .scene-type-icon {
            font-size: 40px;
          }
        }

        .scene-info {
          .scene-name {
            font-size: 14px;
            font-weight: 600;
            color: #303133;
            margin-bottom: 4px;
          }

          .scene-category {
            font-size: 12px;
            color: #909399;
            margin-bottom: 6px;
          }

          .scene-tags {
            margin-bottom: 8px;

            .scene-tag {
              margin-right: 4px;
              margin-bottom: 4px;
            }
          }

          .scene-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;

            .scene-actions-mini {
              display: flex;
              gap: 4px;
            }
          }
        }
      }
    }
  }

  // 右侧参数面板
  .params-card {
    height: calc(100vh - 60px);
    overflow-y: auto;

    .params-section {
      .param-group {
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid #ebeef5;

        &:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }

        .param-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 16px;
        }

        .param-item {
          margin-bottom: 16px;

          &:last-child {
            margin-bottom: 0;
          }

          .item-label {
            display: block;
            font-size: 13px;
            color: #606266;
            margin-bottom: 8px;
          }
        }
      }
    }
  }

  .full-width {
    width: 100%;
  }

  // 滚动条样式
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb {
    background: #c0c4cc;
    border-radius: 3px;

    &:hover {
      background: #909399;
    }
  }
}
</style>

<script lang="ts">
// 辅助方法
export default {
  methods: {
    getPreviewBackground() {
      const type = this.currentWeatherType
      const backgrounds: Record<string, string> = {
        sunny: 'linear-gradient(to bottom, #87CEEB 0%, #E0F6FF 100%)',
        cloudy: 'linear-gradient(to bottom, #95A5A6 0%, #BDC3C7 100%)',
        rainy: 'linear-gradient(to bottom, #34495E 0%, #2C3E50 100%)',
        snowy: 'linear-gradient(to bottom, #E8E8E8 0%, #FFFFFF 100%)',
        foggy: 'linear-gradient(to bottom, #95A5A6 0%, #D3D3D3 100%)'
      }
      return backgrounds[type] || backgrounds.sunny
    },
    getImpactPercentage(type: string) {
      const weatherType = this.currentWeatherType
      const impacts: Record<string, Record<string, number>> = {
        sunny: { light: 90, atmosphere: 80, overall: 85 },
        cloudy: { light: 50, atmosphere: 60, overall: 55 },
        rainy: { light: 30, atmosphere: 70, overall: 50 },
        snowy: { light: 40, atmosphere: 75, overall: 58 },
        foggy: { light: 20, atmosphere: 90, overall: 55 }
      }
      return impacts[weatherType]?.[type] || 50
    },
    getWeatherIcon(type: string) {
      const icons: Record<string, string> = {
        sunny: '☀️',
        cloudy: '⛅',
        rainy: '🌧️',
        snowy: '❄️',
        foggy: '🌫️'
      }
      return icons[type] || '🌈'
    },
    getWeatherColor(type: string) {
      const colors: Record<string, string> = {
        sunny: '#FDB813',
        cloudy: '#95A5A6',
        rainy: '#3498DB',
        snowy: '#ECF0F1',
        foggy: '#BDC3C7'
      }
      return colors[type] || '#409EFF'
    }
  }
}
</script>