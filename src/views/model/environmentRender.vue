<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'

// 类型定义
interface EnvironmentScene {
  id: number
  name: string
  type: 'terrain' | 'vegetation' | 'water' | 'sky' | 'mixed'
  createTime: string
  status: 'enabled' | 'disabled' | 'rendering'
  qualityLevel: 'low' | 'medium' | 'high' | 'ultra'
  frameRate: number
  elementCount: number
}

interface EnvironmentElement {
  id: number
  name: string
  type: 'terrain' | 'vegetation' | 'water' | 'building' | 'prop'
  material: string
  position: { x: number; y: number; z: number }
  scale: { x: number; y: number; z: number }
  visible: boolean
}

interface RenderConfig {
  lighting: {
    sunPosition: { x: number; y: number; z: number }
    intensity: number
    shadowQuality: number
  }
  environment: {
    ambientIntensity: number
    reflectionIntensity: number
    giIntensity: number
  }
  effects: {
    fog: {
      enabled: boolean
      density: number
      color: string
    }
    atmosphere: {
      enabled: boolean
      scattering: number
    }
  }
  quality: 'low' | 'medium' | 'high' | 'ultra'
}

interface SceneTemplate {
  id: number
  name: string
  category: string
  description: string
  previewImage: string
  version: string
  downloads: number
}

interface PerformanceMetrics {
  fps: number
  drawCalls: number
  triangles: number
  memory: number
}

// 响应式数据
const loading = ref(false)
const searchKeyword = ref('')
const selectedType = ref<string>('')
const selectedStatus = ref<string>('')

// 场景列表数据
const sceneList = ref<EnvironmentScene[]>([])
const currentScene = ref<EnvironmentScene | null>(null)

// 环境元素数据
const environmentElements = ref<EnvironmentElement[]>([])
const selectedElements = ref<number[]>([])

// 渲染配置
const renderConfig = reactive<RenderConfig>({
  lighting: {
    sunPosition: { x: 0, y: 50, z: 30 },
    intensity: 80,
    shadowQuality: 75
  },
  environment: {
    ambientIntensity: 40,
    reflectionIntensity: 60,
    giIntensity: 50
  },
  effects: {
    fog: {
      enabled: true,
      density: 30,
      color: '#B0C4DE'
    },
    atmosphere: {
      enabled: true,
      scattering: 45
    }
  },
  quality: 'high'
})

// 性能指标
const performanceMetrics = ref<PerformanceMetrics>({
  fps: 60,
  drawCalls: 0,
  triangles: 0,
  memory: 0
})

// 场景模板
const sceneTemplates = ref<SceneTemplate[]>([])
const selectedTemplate = ref<number | null>(null)

// 对话框控制
const dialogVisible = ref(false)
const elementDialogVisible = ref(false)
const templateDialogVisible = ref(false)

// 表单数据
const sceneForm = reactive({
  name: '',
  type: 'mixed',
  qualityLevel: 'high'
})

const elementForm = reactive({
  name: '',
  type: 'terrain',
  material: 'default',
  position: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  visible: true
})

const formRef = ref<FormInstance>()

// 场景类型选项
const sceneTypes = [
  { label: '地形', value: 'terrain' },
  { label: '植被', value: 'vegetation' },
  { label: '水体', value: 'water' },
  { label: '天空', value: 'sky' },
  { label: '混合', value: 'mixed' }
]

// 状态选项
const statusOptions = [
  { label: '启用', value: 'enabled' },
  { label: '禁用', value: 'disabled' },
  { label: '渲染中', value: 'rendering' }
]

// 质量等级选项
const qualityOptions = [
  { label: '低', value: 'low' },
  { label: '中', value: 'medium' },
  { label: '高', value: 'high' },
  { label: '超高', value: 'ultra' }
]

// 材质选项
const materialOptions = [
  { label: '默认材质', value: 'default' },
  { label: '金属材质', value: 'metal' },
  { label: '玻璃材质', value: 'glass' },
  { label: '木质材质', value: 'wood' },
  { label: '石质材质', value: 'stone' },
  { label: '水面材质', value: 'water' }
]

// 计算属性
const filteredScenes = computed(() => {
  let result = sceneList.value

  if (searchKeyword.value) {
    result = result.filter((scene) =>
      scene.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }

  if (selectedType.value) {
    result = result.filter((scene) => scene.type === selectedType.value)
  }

  if (selectedStatus.value) {
    result = result.filter((scene) => scene.status === selectedStatus.value)
  }

  return result
})

// 状态标签类型
const getStatusType = (status: string) => {
  const statusMap = {
    enabled: 'success',
    disabled: 'info',
    rendering: 'primary'
  }
  return statusMap[status as keyof typeof statusMap] || 'info'
}

// 质量标签类型
const getQualityType = (quality: string) => {
  const qualityMap = {
    low: 'info',
    medium: 'primary',
    high: 'success',
    ultra: 'warning'
  }
  return qualityMap[quality as keyof typeof qualityMap] || 'info'
}

// 场景类型标签类型
const getSceneTypeTag = (type: string) => {
  const typeMap = {
    terrain: '',
    vegetation: 'success',
    water: 'primary',
    sky: 'info',
    mixed: 'warning'
  }
  return typeMap[type as keyof typeof typeMap] || ''
}

// 方法
const loadSceneList = () => {
  loading.value = true
  setTimeout(() => {
    sceneList.value = [
      {
        id: 1,
        name: '',
        type: 'mixed',
        createTime: '2025-10-20 10:30:00',
        status: 'enabled',
        qualityLevel: 'high',
        frameRate: 60,
        elementCount: 245
      },
      {
        id: 2,
        name: '地形渲染场景',
        type: 'terrain',
        createTime: '2025-10-21 14:20:00',
        status: 'enabled',
        qualityLevel: 'ultra',
        frameRate: 45,
        elementCount: 128
      },
      {
        id: 3,
        name: '植被生态场景',
        type: 'vegetation',
        createTime: '2025-10-22 09:15:00',
        status: 'rendering',
        qualityLevel: 'high',
        frameRate: 55,
        elementCount: 512
      },
      {
        id: 4,
        name: '水体动态场景',
        type: 'water',
        createTime: '2025-10-23 16:45:00',
        status: 'enabled',
        qualityLevel: 'medium',
        frameRate: 60,
        elementCount: 89
      },
      {
        id: 5,
        name: '天空盒场景',
        type: 'sky',
        createTime: '2025-10-24 11:00:00',
        status: 'disabled',
        qualityLevel: 'low',
        frameRate: 0,
        elementCount: 12
      },
      {
        id: 6,
        name: '测试环境场景',
        type: 'mixed',
        createTime: '2025-10-25 13:30:00',
        status: 'disabled',
        qualityLevel: 'medium',
        frameRate: 0,
        elementCount: 67
      }
    ]
    loading.value = false
  }, 800)
}

const loadEnvironmentElements = () => {
  setTimeout(() => {
    environmentElements.value = [
      {
        id: 1,
        name: '主地形',
        type: 'terrain',
        material: 'stone',
        position: { x: 0, y: 0, z: 0 },
        scale: { x: 100, y: 1, z: 100 },
        visible: true
      },
      {
        id: 2,
        name: '树林区域',
        type: 'vegetation',
        material: 'wood',
        position: { x: 20, y: 0, z: 30 },
        scale: { x: 15, y: 8, z: 15 },
        visible: true
      },
      {
        id: 3,
        name: '景观湖',
        type: 'water',
        material: 'water',
        position: { x: -30, y: 0, z: 20 },
        scale: { x: 25, y: 1, z: 20 },
        visible: true
      },
      {
        id: 4,
        name: '办公楼',
        type: 'building',
        material: 'glass',
        position: { x: 0, y: 0, z: -40 },
        scale: { x: 20, y: 30, z: 15 },
        visible: true
      },
      {
        id: 5,
        name: '路灯组',
        type: 'prop',
        material: 'metal',
        position: { x: 10, y: 0, z: 10 },
        scale: { x: 1, y: 5, z: 1 },
        visible: true
      }
    ]
  }, 500)
}

const loadSceneTemplates = () => {
  setTimeout(() => {
    sceneTemplates.value = [
      {
        id: 1,
        name: '现代园区模板',
        category: '工业园区',
        description: '适用于现代化工业园区的标准环境配置',
        previewImage: '',
        version: '1.2.0',
        downloads: 1280
      },
      {
        id: 2,
        name: '自然生态模板',
        category: '生态园区',
        description: '强调植被和水体的生态环境场景',
        previewImage: '',
        version: '1.0.5',
        downloads: 856
      },
      {
        id: 3,
        name: '城市街区模板',
        category: '城市环境',
        description: '城市街区的完整环境渲染方案',
        previewImage: '',
        version: '2.1.0',
        downloads: 2145
      },
      {
        id: 4,
        name: '高科技园区模板',
        category: '科技园区',
        description: '现代化科技园区的高质量渲染模板',
        previewImage: '',
        version: '1.5.2',
        downloads: 1567
      }
    ]
  }, 600)
}

const handleSceneSelect = (scene: EnvironmentScene) => {
  currentScene.value = scene
  ElMessage.success(`已选择场景：${scene.name}`)
  updatePerformanceMetrics()
}

const handleAddScene = () => {
  dialogVisible.value = true
  Object.assign(sceneForm, {
    name: '',
    type: 'mixed',
    qualityLevel: 'high'
  })
}

const handleEditScene = (scene: EnvironmentScene) => {
  dialogVisible.value = true
  Object.assign(sceneForm, {
    name: scene.name,
    type: scene.type,
    qualityLevel: scene.qualityLevel
  })
}

const handleDeleteScene = (scene: EnvironmentScene) => {
  ElMessageBox.confirm(`确定要删除场景"${scene.name}"吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      const index = sceneList.value.findIndex((s) => s.id === scene.id)
      if (index > -1) {
        sceneList.value.splice(index, 1)
        ElMessage.success('删除成功')
      }
    })
    .catch(() => {
      ElMessage.info('已取消删除')
    })
}

const handleToggleStatus = (scene: EnvironmentScene) => {
  if (scene.status === 'enabled') {
    scene.status = 'disabled'
    scene.frameRate = 0
    ElMessage.success('场景已禁用')
  } else if (scene.status === 'disabled') {
    scene.status = 'rendering'
    setTimeout(() => {
      scene.status = 'enabled'
      scene.frameRate = Math.floor(Math.random() * 20) + 45
      ElMessage.success('场景已启用')
    }, 2000)
  }
}

const submitSceneForm = () => {
  if (!sceneForm.name) {
    ElMessage.error('请输入场景名称')
    return
  }

  loading.value = true
  setTimeout(() => {
    const newScene: EnvironmentScene = {
      id: Date.now(),
      name: sceneForm.name,
      type: sceneForm.type as any,
      createTime: new Date().toLocaleString('zh-CN'),
      status: 'enabled',
      qualityLevel: sceneForm.qualityLevel as any,
      frameRate: 60,
      elementCount: 0
    }
    sceneList.value.unshift(newScene)
    dialogVisible.value = false
    loading.value = false
    ElMessage.success('场景创建成功')
  }, 1000)
}

// 环境元素管理
const handleAddElement = () => {
  elementDialogVisible.value = true
  Object.assign(elementForm, {
    name: '',
    type: 'terrain',
    material: 'default',
    position: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    visible: true
  })
}

const handleEditElement = (element: EnvironmentElement) => {
  elementDialogVisible.value = true
  Object.assign(elementForm, element)
}

const handleDeleteElement = (element: EnvironmentElement) => {
  ElMessageBox.confirm(`确定要删除元素"${element.name}"吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      const index = environmentElements.value.findIndex((e) => e.id === element.id)
      if (index > -1) {
        environmentElements.value.splice(index, 1)
        ElMessage.success('删除成功')
      }
    })
    .catch(() => {
      ElMessage.info('已取消删除')
    })
}

const submitElementForm = () => {
  if (!elementForm.name) {
    ElMessage.error('请输入元素名称')
    return
  }

  setTimeout(() => {
    const newElement: EnvironmentElement = {
      id: Date.now(),
      name: elementForm.name,
      type: elementForm.type as EnvironmentElement['type'],
      material: elementForm.material,
      position: { ...elementForm.position },
      scale: { ...elementForm.scale },
      visible: elementForm.visible
    }
    environmentElements.value.push(newElement)
    elementDialogVisible.value = false
    ElMessage.success('环境元素添加成功')
  }, 500)
}

const handleToggleElementVisibility = (element: EnvironmentElement) => {
  element.visible = !element.visible
  ElMessage.success(`元素"${element.name}"已${element.visible ? '显示' : '隐藏'}`)
}

// 渲染效果配置
const handleRenderConfigChange = () => {
  ElMessage.success('渲染配置已更新')
  updatePerformanceMetrics()
}

const handleQualityChange = (quality: string) => {
  renderConfig.quality = quality as any
  ElMessage.success(`渲染质量已切换为：${getQualityLabel(quality)}`)
  updatePerformanceMetrics()
}

const getQualityLabel = (quality: string) => {
  const labels = {
    low: '低',
    medium: '中',
    high: '高',
    ultra: '超高'
  }
  return labels[quality as keyof typeof labels] || quality
}

const resetRenderConfig = () => {
  ElMessageBox.confirm('确定要重置所有渲染配置吗？', '重置确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      Object.assign(renderConfig, {
        lighting: {
          sunPosition: { x: 0, y: 50, z: 30 },
          intensity: 80,
          shadowQuality: 75
        },
        environment: {
          ambientIntensity: 40,
          reflectionIntensity: 60,
          giIntensity: 50
        },
        effects: {
          fog: {
            enabled: true,
            density: 30,
            color: '#B0C4DE'
          },
          atmosphere: {
            enabled: true,
            scattering: 45
          }
        },
        quality: 'high'
      })
      ElMessage.success('渲染配置已重置')
      updatePerformanceMetrics()
    })
    .catch(() => {
      ElMessage.info('已取消重置')
    })
}

// 性能指标更新
const updatePerformanceMetrics = () => {
  const qualityMultiplier = {
    low: 0.5,
    medium: 0.75,
    high: 1.0,
    ultra: 1.3
  }
  const multiplier = qualityMultiplier[renderConfig.quality] || 1

  performanceMetrics.value = {
    fps: Math.floor((60 - (multiplier - 1) * 15)),
    drawCalls: Math.floor(150 * multiplier + Math.random() * 50),
    triangles: Math.floor(500000 * multiplier + Math.random() * 100000),
    memory: Math.floor(512 * multiplier + Math.random() * 128)
  }
}

// 模板管理
const handleApplyTemplate = (template: SceneTemplate) => {
  ElMessageBox.confirm(`确定要应用模板"${template.name}"吗？`, '应用模板', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  })
    .then(() => {
      selectedTemplate.value = template.id
      loading.value = true
      setTimeout(() => {
        loading.value = false
        ElMessage.success(`模板"${template.name}"应用成功`)
      }, 1500)
    })
    .catch(() => {
      ElMessage.info('已取消应用')
    })
}

const handleExportTemplate = () => {
  if (!currentScene.value) {
    ElMessage.warning('请先选择一个场景')
    return
  }

  ElMessage.success('场景模板导出成功')
}

const handleImportTemplate = () => {
  templateDialogVisible.value = true
}

const handleSaveAsTemplate = () => {
  if (!currentScene.value) {
    ElMessage.warning('请先选择一个场景')
    return
  }

  ElMessageBox.prompt('请输入模板名称', '保存为模板', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /.+/,
    inputErrorMessage: '请输入模板名称'
  })
    .then(({ value }) => {
      const newTemplate: SceneTemplate = {
        id: Date.now(),
        name: value,
        category: '自定义',
        description: `基于场景"${currentScene.value?.name}"创建`,
        previewImage: '',
        version: '1.0.0',
        downloads: 0
      }
      sceneTemplates.value.unshift(newTemplate)
      ElMessage.success('模板保存成功')
    })
    .catch(() => {
      ElMessage.info('已取消保存')
    })
}

const handleScreenshot = () => {
  ElMessage.success('场景截图已保存')
}

// 初始化
onMounted(() => {
  loadSceneList()
  loadEnvironmentElements()
  loadSceneTemplates()
  updatePerformanceMetrics()

  // 模拟性能指标更新
  setInterval(() => {
    if (currentScene.value && currentScene.value.status === 'enabled') {
      performanceMetrics.value.fps = Math.floor(Math.random() * 5) + 57
      performanceMetrics.value.drawCalls += Math.floor(Math.random() * 10) - 5
      performanceMetrics.value.memory += Math.floor(Math.random() * 20) - 10
    }
  }, 1000)
})
</script>

<template>
  <div class="environment-render-page">
    <el-row :gutter="16" class="page-container">
      <!-- 左侧：场景列表和元素管理 -->
      <el-col :span="6">
        <el-card class="scene-list-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">场景管理</span>
              <el-button type="primary" size="small" @click="handleAddScene">
                新建场景
              </el-button>
            </div>
          </template>

          <!-- 筛选和搜索 -->
          <div class="filter-section">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索场景名称"
              clearable
              size="small"
              class="search-input"
            />
            <el-select
              v-model="selectedType"
              placeholder="场景类型"
              clearable
              size="small"
              class="filter-select"
            >
              <el-option
                v-for="type in sceneTypes"
                :key="type.value"
                :label="type.label"
                :value="type.value"
              />
            </el-select>
            <el-select
              v-model="selectedStatus"
              placeholder="场景状态"
              clearable
              size="small"
              class="filter-select"
            >
              <el-option
                v-for="status in statusOptions"
                :key="status.value"
                :label="status.label"
                :value="status.value"
              />
            </el-select>
          </div>

          <!-- 场景列表 -->
          <div v-loading="loading" class="scene-list">
            <div
              v-for="scene in filteredScenes"
              :key="scene.id"
              class="scene-item"
              :class="{ active: currentScene?.id === scene.id }"
              @click="handleSceneSelect(scene)"
            >
              <div class="scene-info">
                <div class="scene-name">{{ scene.name }}</div>
                <div class="scene-meta">
                  <el-tag :type="getSceneTypeTag(scene.type)" size="small">
                    {{ sceneTypes.find((t) => t.value === scene.type)?.label }}
                  </el-tag>
                  <el-tag :type="getStatusType(scene.status)" size="small">
                    {{ statusOptions.find((s) => s.value === scene.status)?.label }}
                  </el-tag>
                </div>
                <div class="scene-stats">
                  <span>{{ scene.frameRate }} FPS</span>
                  <span>{{ scene.elementCount }} 元素</span>
                </div>
              </div>
              <div class="scene-actions">
                <el-button
                  type="primary"
                  size="small"
                  link
                  @click.stop="handleToggleStatus(scene)"
                >
                  {{ scene.status === 'enabled' ? '禁用' : '启用' }}
                </el-button>
                <el-button type="primary" size="small" link @click.stop="handleEditScene(scene)">
                  编辑
                </el-button>
                <el-button type="danger" size="small" link @click.stop="handleDeleteScene(scene)">
                  删除
                </el-button>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 环境元素管理 -->
        <el-card class="elements-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">环境元素</span>
              <el-button type="primary" size="small" @click="handleAddElement">
                添加元素
              </el-button>
            </div>
          </template>

          <div class="elements-list">
            <div v-for="element in environmentElements" :key="element.id" class="element-item">
              <div class="element-info">
                <el-icon :size="18">
                  <component :is="element.visible ? 'View' : 'Hide'" />
                </el-icon>
                <div class="element-details">
                  <div class="element-name">{{ element.name }}</div>
                  <div class="element-type">{{ element.type }} - {{ element.material }}</div>
                </div>
              </div>
              <div class="element-actions">
                <el-button
                  type="primary"
                  size="small"
                  link
                  @click="handleToggleElementVisibility(element)"
                >
                  {{ element.visible ? '隐藏' : '显示' }}
                </el-button>
                <el-button type="primary" size="small" link @click="handleEditElement(element)">
                  编辑
                </el-button>
                <el-button type="danger" size="small" link @click="handleDeleteElement(element)">
                  删除
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 中间：实时渲染视图 -->
      <el-col :span="12">
        <el-card class="preview-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">场景预览</span>
              <div class="preview-actions">
                <el-button type="primary" size="small" @click="handleScreenshot">
                  截图
                </el-button>
                <el-tag :type="getQualityType(renderConfig.quality)">
                  {{ getQualityLabel(renderConfig.quality) }}
                </el-tag>
              </div>
            </div>
          </template>

          <!-- 3D 渲染区域 -->
          <div class="preview-container">
            <div class="render-view">
              <div class="placeholder-scene">


              </div>

              <!-- 性能指标叠加层 -->
              <div class="performance-overlay">
                <div class="metric-item">
                  <span class="metric-label">FPS:</span>
                  <span class="metric-value" :class="{ good: performanceMetrics.fps >= 55 }">
                    {{ performanceMetrics.fps }}
                  </span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">Draw Calls:</span>
                  <span class="metric-value">{{ performanceMetrics.drawCalls }}</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">Triangles:</span>
                  <span class="metric-value">{{ performanceMetrics.triangles.toLocaleString() }}</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">Memory:</span>
                  <span class="metric-value">{{ performanceMetrics.memory }} MB</span>
                </div>
              </div>
            </div>

            <!-- 视角控制 -->
            <div class="view-controls">
              <el-button-group>
                <el-button size="small">正视图</el-button>
                <el-button size="small">侧视图</el-button>
                <el-button size="small">俯视图</el-button>
                <el-button size="small" type="primary">自由视角</el-button>
              </el-button-group>
            </div>
          </div>

          <!-- 性能指标详情 -->
          <div class="performance-details">
            <el-row :gutter="16">
              <el-col :span="6">
                <div class="stat-card">
                  <div class="stat-label">帧率</div>
                  <div class="stat-value">{{ performanceMetrics.fps }} FPS</div>
                  <el-progress
                    :percentage="(performanceMetrics.fps / 60) * 100"
                    :show-text="false"
                    :stroke-width="6"
                  />
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-card">
                  <div class="stat-label">渲染调用</div>
                  <div class="stat-value">{{ performanceMetrics.drawCalls }}</div>
                  <el-progress
                    :percentage="Math.min((performanceMetrics.drawCalls / 300) * 100, 100)"
                    :show-text="false"
                    :stroke-width="6"
                    color="#409eff"
                  />
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-card">
                  <div class="stat-label">三角面数</div>
                  <div class="stat-value">{{ (performanceMetrics.triangles / 1000).toFixed(0) }}K</div>
                  <el-progress
                    :percentage="Math.min((performanceMetrics.triangles / 1000000) * 100, 100)"
                    :show-text="false"
                    :stroke-width="6"
                    color="#67c23a"
                  />
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-card">
                  <div class="stat-label">内存占用</div>
                  <div class="stat-value">{{ performanceMetrics.memory }} MB</div>
                  <el-progress
                    :percentage="Math.min((performanceMetrics.memory / 1024) * 100, 100)"
                    :show-text="false"
                    :stroke-width="6"
                    color="#e6a23c"
                  />
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>

        <!-- 场景模板库 -->
        <el-card class="templates-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">场景模板库</span>
              <div>
                <el-button type="primary" size="small" @click="handleSaveAsTemplate">
                  保存为模板
                </el-button>
                <el-button size="small" @click="handleImportTemplate"> 导入模板 </el-button>
                <el-button size="small" @click="handleExportTemplate"> 导出模板 </el-button>
              </div>
            </div>
          </template>

          <el-row :gutter="12">
            <el-col v-for="template in sceneTemplates" :key="template.id" :span="6">
              <div
                class="template-card"
                :class="{ active: selectedTemplate === template.id }"
                @click="handleApplyTemplate(template)"
              >
                <div class="template-preview">
                  <el-icon :size="40">
                    <Picture />
                  </el-icon>
                </div>
                <div class="template-info">
                  <div class="template-name">{{ template.name }}</div>
                  <div class="template-category">{{ template.category }}</div>
                  <div class="template-meta">
                    <span>v{{ template.version }}</span>
                    <span>{{ template.downloads }} 次使用</span>
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>

      <!-- 右侧：渲染效果配置 -->
      <el-col :span="6">
        <el-card class="config-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">渲染配置</span>
              <el-button size="small" @click="resetRenderConfig"> 重置 </el-button>
            </div>
          </template>

          <div class="config-section">
            <!-- 渲染质量 -->
            <div class="config-group">
              <div class="config-label">渲染质量</div>
              <el-select
                v-model="renderConfig.quality"
                size="small"
                class="full-width"
                @change="handleQualityChange"
              >
                <el-option
                  v-for="option in qualityOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </div>

            <!-- 光照设置 -->
            <div class="config-group">
              <div class="config-label">光照设置</div>

              <div class="config-item">
                <span class="item-label">太阳位置 X</span>
                <el-slider
                  v-model="renderConfig.lighting.sunPosition.x"
                  :min="-100"
                  :max="100"
                  :show-tooltip="true"
                  @change="handleRenderConfigChange"
                />
              </div>

              <div class="config-item">
                <span class="item-label">太阳位置 Y</span>
                <el-slider
                  v-model="renderConfig.lighting.sunPosition.y"
                  :min="0"
                  :max="100"
                  :show-tooltip="true"
                  @change="handleRenderConfigChange"
                />
              </div>

              <div class="config-item">
                <span class="item-label">太阳位置 Z</span>
                <el-slider
                  v-model="renderConfig.lighting.sunPosition.z"
                  :min="-100"
                  :max="100"
                  :show-tooltip="true"
                  @change="handleRenderConfigChange"
                />
              </div>

              <div class="config-item">
                <span class="item-label">光照强度</span>
                <el-slider
                  v-model="renderConfig.lighting.intensity"
                  :min="0"
                  :max="100"
                  :show-tooltip="true"
                  @change="handleRenderConfigChange"
                />
              </div>

              <div class="config-item">
                <span class="item-label">阴影质量</span>
                <el-slider
                  v-model="renderConfig.lighting.shadowQuality"
                  :min="0"
                  :max="100"
                  :show-tooltip="true"
                  @change="handleRenderConfigChange"
                />
              </div>
            </div>

            <!-- 环境设置 -->
            <div class="config-group">
              <div class="config-label">环境设置</div>

              <div class="config-item">
                <span class="item-label">环境光强度</span>
                <el-slider
                  v-model="renderConfig.environment.ambientIntensity"
                  :min="0"
                  :max="100"
                  :show-tooltip="true"
                  @change="handleRenderConfigChange"
                />
              </div>

              <div class="config-item">
                <span class="item-label">反射强度</span>
                <el-slider
                  v-model="renderConfig.environment.reflectionIntensity"
                  :min="0"
                  :max="100"
                  :show-tooltip="true"
                  @change="handleRenderConfigChange"
                />
              </div>

              <div class="config-item">
                <span class="item-label">全局光照</span>
                <el-slider
                  v-model="renderConfig.environment.giIntensity"
                  :min="0"
                  :max="100"
                  :show-tooltip="true"
                  @change="handleRenderConfigChange"
                />
              </div>
            </div>

            <!-- 环境效果 -->
            <div class="config-group">
              <div class="config-label">环境效果</div>

              <div class="config-item">
                <span class="item-label">雾效启用</span>
                <el-switch
                  v-model="renderConfig.effects.fog.enabled"
                  @change="handleRenderConfigChange"
                />
              </div>

              <div v-if="renderConfig.effects.fog.enabled" class="config-item">
                <span class="item-label">雾效浓度</span>
                <el-slider
                  v-model="renderConfig.effects.fog.density"
                  :min="0"
                  :max="100"
                  :show-tooltip="true"
                  @change="handleRenderConfigChange"
                />
              </div>

              <div v-if="renderConfig.effects.fog.enabled" class="config-item">
                <span class="item-label">雾效颜色</span>
                <el-color-picker
                  v-model="renderConfig.effects.fog.color"
                  @change="handleRenderConfigChange"
                />
              </div>

              <div class="config-item">
                <span class="item-label">大气散射</span>
                <el-switch
                  v-model="renderConfig.effects.atmosphere.enabled"
                  @change="handleRenderConfigChange"
                />
              </div>

              <div v-if="renderConfig.effects.atmosphere.enabled" class="config-item">
                <span class="item-label">散射强度</span>
                <el-slider
                  v-model="renderConfig.effects.atmosphere.scattering"
                  :min="0"
                  :max="100"
                  :show-tooltip="true"
                  @change="handleRenderConfigChange"
                />
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 新建/编辑场景对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="场景配置"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="sceneForm" label-width="100px">
        <el-form-item label="场景名称" required>
          <el-input v-model="sceneForm.name" placeholder="请输入场景名称" />
        </el-form-item>
        <el-form-item label="场景类型" required>
          <el-select v-model="sceneForm.type" placeholder="请选择场景类型" class="full-width">
            <el-option
              v-for="type in sceneTypes"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="质量等级" required>
          <el-select
            v-model="sceneForm.qualityLevel"
            placeholder="请选择质量等级"
            class="full-width"
          >
            <el-option
              v-for="option in qualityOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="submitSceneForm"> 确定 </el-button>
      </template>
    </el-dialog>

    <!-- 环境元素对话框 -->
    <el-dialog
      v-model="elementDialogVisible"
      title="环境元素配置"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="elementForm" label-width="100px">
        <el-form-item label="元素名称" required>
          <el-input v-model="elementForm.name" placeholder="请输入元素名称" />
        </el-form-item>
        <el-form-item label="元素类型" required>
          <el-select v-model="elementForm.type" placeholder="请选择元素类型" class="full-width">
            <el-option label="地形" value="terrain" />
            <el-option label="植被" value="vegetation" />
            <el-option label="水体" value="water" />
            <el-option label="建筑" value="building" />
            <el-option label="道具" value="prop" />
          </el-select>
        </el-form-item>
        <el-form-item label="材质" required>
          <el-select v-model="elementForm.material" placeholder="请选择材质" class="full-width">
            <el-option
              v-for="material in materialOptions"
              :key="material.value"
              :label="material.label"
              :value="material.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="位置">
          <el-row :gutter="8">
            <el-col :span="8">
              <el-input-number
                v-model="elementForm.position.x"
                :controls="false"
                placeholder="X"
                class="full-width"
              />
            </el-col>
            <el-col :span="8">
              <el-input-number
                v-model="elementForm.position.y"
                :controls="false"
                placeholder="Y"
                class="full-width"
              />
            </el-col>
            <el-col :span="8">
              <el-input-number
                v-model="elementForm.position.z"
                :controls="false"
                placeholder="Z"
                class="full-width"
              />
            </el-col>
          </el-row>
        </el-form-item>
        <el-form-item label="缩放">
          <el-row :gutter="8">
            <el-col :span="8">
              <el-input-number
                v-model="elementForm.scale.x"
                :min="0.1"
                :step="0.1"
                :controls="false"
                placeholder="X"
                class="full-width"
              />
            </el-col>
            <el-col :span="8">
              <el-input-number
                v-model="elementForm.scale.y"
                :min="0.1"
                :step="0.1"
                :controls="false"
                placeholder="Y"
                class="full-width"
              />
            </el-col>
            <el-col :span="8">
              <el-input-number
                v-model="elementForm.scale.z"
                :min="0.1"
                :step="0.1"
                :controls="false"
                placeholder="Z"
                class="full-width"
              />
            </el-col>
          </el-row>
        </el-form-item>
        <el-form-item label="可见性">
          <el-switch v-model="elementForm.visible" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="elementDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitElementForm"> 确定 </el-button>
      </template>
    </el-dialog>

    <!-- 导入模板对话框 -->
    <el-dialog v-model="templateDialogVisible" title="导入场景模板" width="400px">
      <el-upload drag action="#" :auto-upload="false">
        <el-icon :size="80">
          <UploadFilled />
        </el-icon>
        <div class="el-upload__text">将模板文件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">支持 .json 格式的场景模板文件</div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="templateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="templateDialogVisible = false"> 导入 </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.environment-render-page {
  min-height: 100vh;

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

  // 左侧场景列表
  .scene-list-card {
    margin-bottom: 16px;
    height: calc(50vh - 28px);

    .filter-section {
      margin-bottom: 12px;

      .search-input,
      .filter-select {
        width: 100%;
        margin-bottom: 8px;
      }
    }

    .scene-list {
      height: calc(100% - 120px);
      overflow-y: auto;

      .scene-item {
        padding: 12px;
        margin-bottom: 8px;
        background: #f5f7fa;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          background: #e8f4ff;
          transform: translateX(4px);
        }

        &.active {
          background: #e8f4ff;
          border-left: 3px solid #409eff;
        }

        .scene-info {
          .scene-name {
            font-size: 14px;
            font-weight: 500;
            color: #303133;
            margin-bottom: 8px;
          }

          .scene-meta {
            margin-bottom: 8px;

            .el-tag {
              margin-right: 8px;
            }
          }

          .scene-stats {
            font-size: 12px;
            color: #909399;

            span {
              margin-right: 12px;
            }
          }
        }

        .scene-actions {
          margin-top: 8px;
          display: flex;
          gap: 8px;
        }
      }
    }
  }

  // 环境元素卡片
  .elements-card {
    height: calc(50vh - 28px);

    .elements-list {
      height: calc(100% - 20px);
      overflow-y: auto;

      .element-item {
        padding: 10px;
        margin-bottom: 8px;
        background: #f5f7fa;
        border-radius: 6px;
        transition: all 0.3s;

        &:hover {
          background: #e8f4ff;
        }

        .element-info {
          display: flex;
          align-items: center;
          margin-bottom: 8px;

          .element-details {
            margin-left: 10px;
            flex: 1;

            .element-name {
              font-size: 13px;
              font-weight: 500;
              color: #303133;
            }

            .element-type {
              font-size: 12px;
              color: #909399;
              margin-top: 2px;
            }
          }
        }

        .element-actions {
          display: flex;
          gap: 8px;
        }
      }
    }
  }

  // 中间预览区
  .preview-card {
    margin-bottom: 16px;
    height: calc(65vh - 28px);

    .preview-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .preview-container {
      position: relative;

      .render-view {
        height: 400px;
        background-image: url("https://img0.baidu.com/it/u=1916092642,1659291087&fm=253&fmt=auto&app=120&f=JPEG?w=1071&h=500");
        border-radius: 8px;
        position: relative;
        overflow: hidden;

        .placeholder-scene {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #fff;

          .placeholder-text {
            margin-top: 20px;
            font-size: 18px;
            font-weight: 500;
          }
        }

        .performance-overlay {
          position: absolute;
          top: 16px;
          right: 16px;
          background: rgba(0, 0, 0, 0.7);
          padding: 12px;
          border-radius: 6px;
          color: #fff;
          font-size: 12px;
          font-family: 'Courier New', monospace;

          .metric-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
            min-width: 180px;

            &:last-child {
              margin-bottom: 0;
            }

            .metric-label {
              color: #a0cfff;
            }

            .metric-value {
              font-weight: 600;
              color: #ffd666;

              &.good {
                color: #95de64;
              }
            }
          }
        }
      }

      .view-controls {
        margin-top: 12px;
        text-align: center;
      }
    }

    .performance-details {
      margin-top: 16px;

      .stat-card {
        padding: 12px;
        background: #f5f7fa;
        border-radius: 6px;
        text-align: center;

        .stat-label {
          font-size: 12px;
          color: #909399;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 18px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 8px;
        }
      }
    }
  }

  // 模板卡片
  .templates-card {
    height: calc(35vh - 28px);

    .el-row {
      height: calc(100% - 20px);
      overflow-y: auto;
    }

    .template-card {
      padding: 12px;
      background: #f5f7fa;
      border-radius: 6px;
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

      .template-preview {
        height: 80px;
        background: #fff;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 10px;
      }

      .template-info {
        .template-name {
          font-size: 13px;
          font-weight: 500;
          color: #303133;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .template-category {
          font-size: 12px;
          color: #909399;
          margin-bottom: 6px;
        }

        .template-meta {
          font-size: 11px;
          color: #c0c4cc;
          display: flex;
          justify-content: space-between;
        }
      }
    }
  }

  // 右侧配置面板
  .config-card {
    height: calc(100vh - 60px);
    overflow-y: auto;

    .config-section {
      .config-group {
        margin-bottom: 24px;

        &:last-child {
          margin-bottom: 0;
        }

        .config-label {
          font-size: 14px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid #ebeef5;
        }

        .config-item {
          margin-bottom: 16px;

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
