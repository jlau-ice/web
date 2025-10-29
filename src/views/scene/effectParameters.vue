<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { ElTree, ElSlider, ElInputNumber, ElColorPicker, ElButton, ElCard, ElTag, ElRow, ElCol, ElSwitch, ElProgress, ElInput, ElSelect, ElOption, ElTooltip, ElMessage, ElMessageBox } from 'element-plus'
import { InfoFilled, Refresh, Download, Upload, Setting, View } from '@element-plus/icons-vue'
import type { TreeNodeData } from 'element-plus'

// 特效参数类型定义
interface EffectParameter {
  id: string
  name: string
  type: 'slider' | 'number' | 'color' | 'switch'
  value: any
  min?: number
  max?: number
  step?: number
  unit?: string
  description: string
}

// 特效项目类型定义
interface EffectItem {
  id: string
  name: string
  category: string
  enabled: boolean
  performance: 'low' | 'medium' | 'high'
  quality: 'basic' | 'standard' | 'premium'
  parameters: EffectParameter[]
  status: 'enabled' | 'disabled' | 'high-performance' | 'high-quality'
}

// 预设方案类型定义
interface EffectPreset {
  id: string
  name: string
  description: string
  category: 'realistic' | 'cartoon' | 'cinema' | 'custom'
  tags: string[]
  parameters: Record<string, any>
  thumbnail?: string
}

// 性能监控数据
interface PerformanceData {
  fps: number
  frameTime: number
  gpuUsage: number
  memoryUsage: number
  quality: number
}

// 响应式数据
const loading = ref(false)
const searchKeyword = ref('')
const selectedEffectId = ref('')
const currentPreset = ref('')
const compareMode = ref(false)
const showPerformanceTips = ref(true)

// 特效分类树数据
const effectTreeData = ref([
  {
    id: '1',
    label: '光影特效',
    children: [
      { id: '1-1', label: '全局光照', icon: '🌟' },
      { id: '1-2', label: '阴影效果', icon: '🌑' },
      { id: '1-3', label: '反射折射', icon: '✨' }
    ]
  },
  {
    id: '2',
    label: '后期处理',
    children: [
      { id: '2-1', label: '色彩校正', icon: '🎨' },
      { id: '2-2', label: '景深效果', icon: '📷' },
      { id: '2-3', label: '动态模糊', icon: '💫' }
    ]
  },
  {
    id: '3',
    label: '环境特效',
    children: [
      { id: '3-1', label: '体积光', icon: '☀️' },
      { id: '3-2', label: '粒子系统', icon: '🌟' },
      { id: '3-3', label: '大气散射', icon: '🌫️' }
    ]
  },
  {
    id: '4',
    label: '材质特效',
    children: [
      { id: '4-1', label: 'PBR材质', icon: '💎' },
      { id: '4-2', label: '程序纹理', icon: '🔲' },
      { id: '4-3', label: '动态材质', icon: '🌊' }
    ]
  }
])

// 特效数据
const effects = ref<EffectItem[]>([
  {
    id: '1-1',
    name: '全局光照',
    category: '光影特效',
    enabled: true,
    performance: 'high',
    quality: 'premium',
    status: 'high-quality',
    parameters: [
      {
        id: 'gi-intensity',
        name: '光照强度',
        type: 'slider',
        value: 0.8,
        min: 0,
        max: 2,
        step: 0.1,
        unit: '',
        description: '控制全局光照的整体强度'
      },
      {
        id: 'gi-radius',
        name: '光照半径',
        type: 'slider',
        value: 10,
        min: 1,
        max: 50,
        step: 1,
        unit: 'm',
        description: '设置光照影响的范围'
      },
      {
        id: 'gi-bounces',
        name: '反弹次数',
        type: 'number',
        value: 3,
        min: 1,
        max: 8,
        step: 1,
        unit: '次',
        description: '光线反弹的次数，影响真实感'
      }
    ]
  },
  {
    id: '1-2',
    name: '阴影效果',
    category: '光影特效',
    enabled: true,
    performance: 'medium',
    quality: 'standard',
    status: 'enabled',
    parameters: [
      {
        id: 'shadow-quality',
        name: '阴影质量',
        type: 'slider',
        value: 2,
        min: 0,
        max: 4,
        step: 1,
        unit: '',
        description: '阴影贴图分辨率级别'
      },
      {
        id: 'shadow-distance',
        name: '阴影距离',
        type: 'slider',
        value: 50,
        min: 10,
        max: 200,
        step: 10,
        unit: 'm',
        description: '阴影渲染的最大距离'
      },
      {
        id: 'shadow-softness',
        name: '阴影柔和度',
        type: 'slider',
        value: 0.5,
        min: 0,
        max: 1,
        step: 0.1,
        unit: '',
        description: '阴影边缘的柔和程度'
      }
    ]
  },
  {
    id: '1-3',
    name: '反射折射',
    category: '光影特效',
    enabled: false,
    performance: 'high',
    quality: 'premium',
    status: 'disabled',
    parameters: [
      {
        id: 'reflection-intensity',
        name: '反射强度',
        type: 'slider',
        value: 0.7,
        min: 0,
        max: 1,
        step: 0.1,
        unit: '',
        description: '反射效果的强度'
      },
      {
        id: 'refraction-index',
        name: '折射率',
        type: 'slider',
        value: 1.33,
        min: 1,
        max: 2.5,
        step: 0.01,
        unit: '',
        description: '材质的折射率'
      }
    ]
  },
  {
    id: '2-1',
    name: '色彩校正',
    category: '后期处理',
    enabled: true,
    performance: 'medium',
    quality: 'standard',
    status: 'enabled',
    parameters: [
      {
        id: 'cc-brightness',
        name: '亮度',
        type: 'slider',
        value: 1.0,
        min: 0.5,
        max: 2,
        step: 0.1,
        unit: '',
        description: '调整画面整体亮度'
      },
      {
        id: 'cc-contrast',
        name: '对比度',
        type: 'slider',
        value: 1.0,
        min: 0.5,
        max: 2,
        step: 0.1,
        unit: '',
        description: '调整画面对比度'
      },
      {
        id: 'cc-saturation',
        name: '饱和度',
        type: 'slider',
        value: 1.0,
        min: 0,
        max: 2,
        step: 0.1,
        unit: '',
        description: '调整颜色饱和度'
      },
      {
        id: 'cc-color-temp',
        name: '色温',
        type: 'color',
        value: '#ffffff',
        description: '调整画面色温'
      }
    ]
  },
  {
    id: '2-2',
    name: '景深效果',
    category: '后期处理',
    enabled: false,
    performance: 'medium',
    quality: 'standard',
    status: 'disabled',
    parameters: [
      {
        id: 'dof-focus-distance',
        name: '焦距',
        type: 'slider',
        value: 10,
        min: 1,
        max: 100,
        step: 1,
        unit: 'm',
        description: '对焦点的距离'
      },
      {
        id: 'dof-blur-amount',
        name: '模糊量',
        type: 'slider',
        value: 0.5,
        min: 0,
        max: 1,
        step: 0.1,
        unit: '',
        description: '景深模糊的强度'
      }
    ]
  },
  {
    id: '2-3',
    name: '动态模糊',
    category: '后期处理',
    enabled: false,
    performance: 'high',
    quality: 'premium',
    status: 'disabled',
    parameters: [
      {
        id: 'mb-intensity',
        name: '模糊强度',
        type: 'slider',
        value: 0.5,
        min: 0,
        max: 1,
        step: 0.1,
        unit: '',
        description: '运动模糊的强度'
      },
      {
        id: 'mb-samples',
        name: '采样数',
        type: 'number',
        value: 8,
        min: 4,
        max: 32,
        step: 4,
        unit: '',
        description: '模糊采样的数量，影响质量'
      }
    ]
  },
  {
    id: '3-1',
    name: '体积光',
    category: '环境特效',
    enabled: false,
    performance: 'high',
    quality: 'premium',
    status: 'disabled',
    parameters: [
      {
        id: 'vl-density',
        name: '密度',
        type: 'slider',
        value: 0.5,
        min: 0,
        max: 1,
        step: 0.01,
        unit: '',
        description: '体积光的密度'
      },
      {
        id: 'vl-scattering',
        name: '散射系数',
        type: 'slider',
        value: 0.3,
        min: 0,
        max: 1,
        step: 0.01,
        unit: '',
        description: '光线散射程度'
      },
      {
        id: 'vl-color',
        name: '颜色',
        type: 'color',
        value: '#ffe5b4',
        description: '体积光的颜色'
      }
    ]
  },
  {
    id: '3-2',
    name: '粒子系统',
    category: '环境特效',
    enabled: true,
    performance: 'medium',
    quality: 'standard',
    status: 'high-performance',
    parameters: [
      {
        id: 'particle-count',
        name: '粒子数量',
        type: 'number',
        value: 1000,
        min: 100,
        max: 10000,
        step: 100,
        unit: '',
        description: '粒子的数量'
      },
      {
        id: 'particle-size',
        name: '粒子大小',
        type: 'slider',
        value: 0.5,
        min: 0.1,
        max: 2,
        step: 0.1,
        unit: '',
        description: '粒子的大小'
      }
    ]
  },
  {
    id: '3-3',
    name: '大气散射',
    category: '环境特效',
    enabled: true,
    performance: 'low',
    quality: 'basic',
    status: 'enabled',
    parameters: [
      {
        id: 'atmos-density',
        name: '大气密度',
        type: 'slider',
        value: 0.5,
        min: 0,
        max: 1,
        step: 0.1,
        unit: '',
        description: '大气的密度'
      },
      {
        id: 'atmos-color',
        name: '大气颜色',
        type: 'color',
        value: '#87ceeb',
        description: '大气散射的颜色'
      }
    ]
  },
  {
    id: '4-1',
    name: 'PBR材质',
    category: '材质特效',
    enabled: true,
    performance: 'medium',
    quality: 'standard',
    status: 'enabled',
    parameters: [
      {
        id: 'pbr-metallic',
        name: '金属度',
        type: 'slider',
        value: 0.5,
        min: 0,
        max: 1,
        step: 0.1,
        unit: '',
        description: '材质的金属度'
      },
      {
        id: 'pbr-roughness',
        name: '粗糙度',
        type: 'slider',
        value: 0.5,
        min: 0,
        max: 1,
        step: 0.1,
        unit: '',
        description: '材质的粗糙度'
      }
    ]
  },
  {
    id: '4-2',
    name: '程序纹理',
    category: '材质特效',
    enabled: false,
    performance: 'low',
    quality: 'basic',
    status: 'disabled',
    parameters: [
      {
        id: 'proc-scale',
        name: '纹理缩放',
        type: 'slider',
        value: 1,
        min: 0.1,
        max: 10,
        step: 0.1,
        unit: '',
        description: '程序纹理的缩放比例'
      },
      {
        id: 'proc-complexity',
        name: '复杂度',
        type: 'slider',
        value: 3,
        min: 1,
        max: 10,
        step: 1,
        unit: '',
        description: '纹理生成的复杂度'
      }
    ]
  },
  {
    id: '4-3',
    name: '动态材质',
    category: '材质特效',
    enabled: false,
    performance: 'high',
    quality: 'premium',
    status: 'disabled',
    parameters: [
      {
        id: 'dyn-speed',
        name: '动画速度',
        type: 'slider',
        value: 1,
        min: 0,
        max: 5,
        step: 0.1,
        unit: '',
        description: '材质动画的播放速度'
      },
      {
        id: 'dyn-amplitude',
        name: '变化幅度',
        type: 'slider',
        value: 0.5,
        min: 0,
        max: 1,
        step: 0.1,
        unit: '',
        description: '材质变化的幅度'
      }
    ]
  }
])

// 预设方案数据
const presets = ref<EffectPreset[]>([
  {
    id: 'preset-1',
    name: '写实风格',
    description: '追求真实感的光影和材质效果',
    category: 'realistic',
    tags: ['真实', '高质量', '电影级'],
    parameters: {
      'gi-intensity': 1.2,
      'gi-radius': 15,
      'cc-brightness': 1.0,
      'cc-contrast': 1.1,
      'cc-saturation': 0.9
    }
  },
  {
    id: 'preset-2',
    name: '卡通风格',
    description: '明亮的色彩和简化的光影效果',
    category: 'cartoon',
    tags: ['卡通', '明快', '低消耗'],
    parameters: {
      'gi-intensity': 0.6,
      'gi-radius': 8,
      'cc-brightness': 1.2,
      'cc-contrast': 1.3,
      'cc-saturation': 1.4
    }
  },
  {
    id: 'preset-3',
    name: '电影风格',
    description: '电影级别的色彩和光影处理',
    category: 'cinema',
    tags: ['电影', '艺术', '专业'],
    parameters: {
      'gi-intensity': 0.9,
      'gi-radius': 20,
      'cc-brightness': 0.9,
      'cc-contrast': 1.2,
      'cc-saturation': 0.8
    }
  }
])

// 性能监控数据
const performanceData = reactive<PerformanceData>({
  fps: 60,
  frameTime: 16.7,
  gpuUsage: 65,
  memoryUsage: 2048,
  quality: 85
})

// 参数历史记录
const parameterHistory = ref<Array<{
  timestamp: number
  effectId: string
  parameterId: string
  oldValue: any
  newValue: any
}>>([])

// 计算属性
const filteredEffects = computed(() => {
  if (!searchKeyword.value) return effects.value
  return effects.value.filter(effect =>
    effect.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

const selectedEffect = computed(() => {
  return effects.value.find(effect => effect.id === selectedEffectId.value)
})

const performanceLevel = computed(() => {
  if (performanceData.fps >= 50) return { level: 'excellent', color: '#67C23A', text: '优秀' }
  if (performanceData.fps >= 30) return { level: 'good', color: '#E6A23C', text: '良好' }
  return { level: 'poor', color: '#F56C6C', text: '较差' }
})

const enabledEffectsCount = computed(() => {
  return effects.value.filter(e => e.enabled).length
})

const totalEffectsCount = computed(() => {
  return effects.value.length
})

// 性能监控定时器
let performanceTimer: number | null = null

// 生命周期
onMounted(() => {
  loadEffects()
  startPerformanceMonitoring()
  // 默认选中第一个特效
  if (effects.value.length > 0) {
    selectedEffectId.value = effects.value[0].id
  }
})

onBeforeUnmount(() => {
  if (performanceTimer) {
    clearInterval(performanceTimer)
  }
})

// 方法
const loadEffects = async () => {
  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 1000))
  loading.value = false
}

const startPerformanceMonitoring = () => {
  performanceTimer = window.setInterval(() => {
    // 模拟性能数据变化，受启用特效数量影响
    const effectLoad = enabledEffectsCount.value * 5
    const baseFps = 60 - effectLoad + Math.floor(Math.random() * 10)
    performanceData.fps = Math.max(30, Math.min(60, baseFps))
    performanceData.frameTime = parseFloat((1000 / performanceData.fps).toFixed(1))
    performanceData.gpuUsage = Math.min(95, 40 + effectLoad + Math.floor(Math.random() * 15))
    performanceData.memoryUsage = Math.floor(1500 + effectLoad * 50 + Math.random() * 512)
    performanceData.quality = Math.floor((performanceData.fps / 60) * 100)
  }, 2000)
}

const handleNodeClick = (data: TreeNodeData) => {
  if (data.id && data.id.includes('-')) {
    selectedEffectId.value = data.id
  }
}

const toggleEffect = (effectId: string) => {
  const effect = effects.value.find(e => e.id === effectId)
  if (effect) {
    effect.enabled = !effect.enabled
    effect.status = effect.enabled ? 'enabled' : 'disabled'
  }
}

const updateParameter = (effectId: string, parameterId: string, newValue: any) => {
  const effect = effects.value.find(e => e.id === effectId)
  if (effect) {
    const parameter = effect.parameters.find(p => p.id === parameterId)
    if (parameter) {
      const oldValue = parameter.value
      parameter.value = newValue

      // 记录历史
      parameterHistory.value.unshift({
        timestamp: Date.now(),
        effectId,
        parameterId,
        oldValue,
        newValue
      })

      // 限制历史记录数量
      if (parameterHistory.value.length > 50) {
        parameterHistory.value = parameterHistory.value.slice(0, 50)
      }
    }
  }
}

const resetParameters = (effectId: string) => {
  const effect = effects.value.find(e => e.id === effectId)
  if (effect) {
    effect.parameters.forEach(param => {
      // 重置为默认值
      switch (param.type) {
        case 'slider':
          param.value = param.min || 0
          break
        case 'number':
          param.value = param.min || 1
          break
        case 'color':
          param.value = '#ffffff'
          break
        case 'switch':
          param.value = false
          break
      }
    })
    ElMessage.success('参数已重置')
  }
}

const applyPreset = (preset: EffectPreset) => {
  currentPreset.value = preset.id

  // 应用预设参数
  Object.entries(preset.parameters).forEach(([paramId, value]) => {
    const effect = effects.value.find(e =>
      e.parameters.some(p => p.id === paramId)
    )
    if (effect) {
      updateParameter(effect.id, paramId, value)
    }
  })

  ElMessage.success(`已应用预设方案：${preset.name}`)
}

const saveCustomPreset = async () => {
  try {
    const { value: presetName } = await ElMessageBox.prompt('请输入预设方案名称', '保存自定义预设', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /^.+$/,
      inputErrorMessage: '预设名称不能为空'
    })

    const customPreset: EffectPreset = {
      id: `custom-${Date.now()}`,
      name: presetName,
      description: '用户自定义预设方案',
      category: 'custom',
      tags: ['自定义'],
      parameters: {}
    }

    // 收集当前参数
    effects.value.forEach(effect => {
      effect.parameters.forEach(param => {
        customPreset.parameters[param.id] = param.value
      })
    })

    presets.value.push(customPreset)
    ElMessage.success('预设方案保存成功')
  } catch {
    // 用户取消
  }
}

const exportPreset = (preset: EffectPreset) => {
  const dataStr = JSON.stringify(preset, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${preset.name}.json`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('预设方案已导出')
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'enabled': return '#67C23A'
    case 'disabled': return '#909399'
    case 'high-performance': return '#409EFF'
    case 'high-quality': return '#E6A23C'
    default: return '#909399'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'enabled': return '已启用'
    case 'disabled': return '已禁用'
    case 'high-performance': return '高性能'
    case 'high-quality': return '高画质'
    default: return '未知'
  }
}

const getEffectStatus = (effectId: string) => {
  const effect = effects.value.find(e => e.id === effectId)
  return effect ? effect.status : 'disabled'
}

const batchEnableEffects = (category: string, enable: boolean) => {
  effects.value.forEach(effect => {
    if (effect.category === category) {
      effect.enabled = enable
      effect.status = enable ? 'enabled' : 'disabled'
    }
  })
  ElMessage.success(`已${enable ? '启用' : '禁用'}所有${category}`)
}

const resetAllParameters = () => {
  ElMessageBox.confirm('确定要重置所有特效参数吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    effects.value.forEach(effect => {
      resetParameters(effect.id)
    })
    ElMessage.success('所有参数已重置')
  }).catch(() => {
    // 用户取消
  })
}

const importPreset = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e: any) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event: any) => {
        try {
          const preset: EffectPreset = JSON.parse(event.target.result)
          presets.value.push(preset)
          ElMessage.success('预设方案导入成功')
        } catch (error) {
          ElMessage.error('预设方案格式错误')
        }
      }
      reader.readAsText(file)
    }
  }
  input.click()
}

const undoParameter = () => {
  if (parameterHistory.value.length > 0) {
    const last = parameterHistory.value[0]
    const effect = effects.value.find(e => e.id === last.effectId)
    if (effect) {
      const parameter = effect.parameters.find(p => p.id === last.parameterId)
      if (parameter) {
        parameter.value = last.oldValue
        parameterHistory.value.shift()
        ElMessage.success('已撤销上一步操作')
      }
    }
  } else {
    ElMessage.info('没有可撤销的操作')
  }
}
</script>

<template>
  <div class="effect-parameters">
    <!-- 顶部工具栏 -->
    <el-card class="toolbar-card">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-tag type="success" size="large">
            已启用: {{ enabledEffectsCount }} / {{ totalEffectsCount }}
          </el-tag>
          <el-tag :color="performanceLevel.color" effect="dark" size="large">
            性能: {{ performanceLevel.text }} ({{ performanceData.fps }} FPS)
          </el-tag>
        </div>
        <div class="toolbar-right">
          <el-tooltip content="撤销上一步">
            <el-button size="small" @click="undoParameter" :icon="Refresh">
              撤销
            </el-button>
          </el-tooltip>
          <el-tooltip content="重置所有参数">
            <el-button size="small" @click="resetAllParameters" :icon="Refresh">
              全部重置
            </el-button>
          </el-tooltip>
          <el-tooltip content="导入预设">
            <el-button size="small" @click="importPreset" :icon="Upload">
              导入预设
            </el-button>
          </el-tooltip>
        </div>
      </div>
    </el-card>

    <el-row :gutter="20" class="main-content">
      <!-- 左侧：特效分类树 -->
      <el-col :span="6">
        <el-card class="effect-tree-card">
          <template #header>
            <div class="card-header">
              <span>特效分类</span>
              <el-input
                v-model="searchKeyword"
                placeholder="搜索特效..."
                size="small"
                clearable
              />
            </div>
          </template>

          <el-tree
            :data="effectTreeData"
            :props="{ children: 'children', label: 'label' }"
            node-key="id"
            @node-click="handleNodeClick"
            class="effect-tree"
            default-expand-all
            :highlight-current="true"
          >
            <template #default="{ node, data }">
              <div class="tree-node">
                <span v-if="data.icon" class="node-icon">{{ data.icon }}</span>
                <span class="node-label">{{ node.label }}</span>
                <el-tag
                  v-if="data.id && data.id.includes('-')"
                  :type="data.id === selectedEffectId ? 'success' : 'info'"
                  :color="data.id === selectedEffectId ? undefined : getStatusColor(getEffectStatus(data.id))"
                  size="small"
                  effect="dark"
                >
                  {{ getStatusText(getEffectStatus(data.id)) }}
                </el-tag>
              </div>
            </template>
          </el-tree>

          <!-- 快捷操作 -->
          <div class="tree-actions">
            <el-divider />
            <div class="action-buttons">
              <el-button size="small" text @click="batchEnableEffects('光影特效', true)">
                启用所有光影
              </el-button>
              <el-button size="small" text @click="batchEnableEffects('后期处理', true)">
                启用所有后期
              </el-button>
              <el-button size="small" text type="danger" @click="effects.forEach(e => { e.enabled = false; e.status = 'disabled' })">
                禁用所有特效
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 中间：实时渲染视图 -->
      <el-col :span="12">
        <el-card class="preview-card">
          <template #header>
            <div class="card-header">
              <span>实时预览</span>
              <div class="preview-controls">
                <el-switch
                  v-model="compareMode"
                  active-text="对比模式"
                  size="small"
                />
                <el-button size="small" @click="resetParameters(selectedEffectId)" v-if="selectedEffectId" :icon="Refresh">
                  重置当前
                </el-button>
              </div>
            </div>
          </template>

          <div class="preview-container">
            <div class="preview-viewport">
              <div class="render-preview" :class="{ 'compare-mode': compareMode }">
                <div class="preview-content">
                  <div class="scene-placeholder">
                    <div class="placeholder-icon">🎬</div>
                    <p class="placeholder-title">实时渲染预览区域</p>
                    <p class="placeholder-text" v-if="selectedEffect">
                      {{ compareMode ? '对比模式：左侧原始效果 | 右侧调整效果' : `正在预览：${selectedEffect.name}` }}
                    </p>
                    <p class="placeholder-text" v-else>
                      请从左侧选择一个特效查看预览
                    </p>
                    <div class="preview-stats" v-if="selectedEffect">
                      <el-tag size="small" class="stat-tag">
                        分类：{{ selectedEffect.category }}
                      </el-tag>
                      <el-tag size="small" :type="selectedEffect.enabled ? 'success' : 'info'" class="stat-tag">
                        {{ selectedEffect.enabled ? '已启用' : '已禁用' }}
                      </el-tag>
                      <el-tag size="small" class="stat-tag">
                        性能消耗：{{ selectedEffect.performance === 'high' ? '高' : selectedEffect.performance === 'medium' ? '中' : '低' }}
                      </el-tag>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 性能监控 -->
              <div class="performance-monitor">
                <div class="monitor-header">
                  <span>性能监控</span>
                  <el-tag :color="performanceLevel.color" effect="dark" size="small">
                    {{ performanceLevel.text }}
                  </el-tag>
                </div>
                <div class="monitor-stats">
                  <div class="stat-item">
                    <span class="stat-label">FPS</span>
                    <span class="stat-value">{{ performanceData.fps }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">帧时间</span>
                    <span class="stat-value">{{ performanceData.frameTime }}ms</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">GPU</span>
                    <el-progress
                      :percentage="performanceData.gpuUsage"
                      :stroke-width="6"
                      :show-text="false"
                      class="stat-progress"
                    />
                    <span class="stat-value">{{ performanceData.gpuUsage }}%</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">内存</span>
                    <span class="stat-value">{{ (performanceData.memoryUsage / 1024).toFixed(1) }}GB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：参数调节面板 -->
      <el-col :span="6">
        <el-card class="parameter-card">
          <template #header>
            <div class="card-header">
              <span>参数调节</span>
              <el-tag v-if="selectedEffect" :color="getStatusColor(selectedEffect.status)">
                {{ selectedEffect.name }}
              </el-tag>
            </div>
          </template>

          <div v-if="selectedEffect" class="parameter-panel">
            <div class="effect-info">
              <h4>{{ selectedEffect.name }}</h4>
              <p>{{ selectedEffect.category }}</p>
              <div class="effect-controls">
                <el-switch
                  v-model="selectedEffect.enabled"
                  @change="toggleEffect(selectedEffect.id)"
                  active-text="启用"
                  inactive-text="禁用"
                />
              </div>
            </div>

            <div class="parameters-list">
              <div
                v-for="param in selectedEffect.parameters"
                :key="param.id"
                class="parameter-item"
              >
                <div class="parameter-header">
                  <span class="parameter-name">{{ param.name }}</span>
                  <el-tooltip :content="param.description" placement="top">
                    <el-icon class="info-icon"><InfoFilled /></el-icon>
                  </el-tooltip>
                </div>

                <div class="parameter-control">
                  <!-- 滑块控制 -->
                  <div v-if="param.type === 'slider'" class="slider-control">
                    <el-slider
                      :model-value="param.value"
                      @update:model-value="updateParameter(selectedEffect.id, param.id, $event)"
                      :min="param.min"
                      :max="param.max"
                      :step="param.step"
                      :show-tooltip="false"
                    />
                    <div class="slider-value">
                      <el-input-number
                        :model-value="param.value"
                        @update:model-value="updateParameter(selectedEffect.id, param.id, $event)"
                        :min="param.min"
                        :max="param.max"
                        :step="param.step"
                        size="small"
                        controls-position="right"
                      />
                      <span v-if="param.unit" class="unit">{{ param.unit }}</span>
                    </div>
                  </div>

                  <!-- 数值输入 -->
                  <div v-else-if="param.type === 'number'" class="number-control">
                    <el-input-number
                      :model-value="param.value"
                      @update:model-value="updateParameter(selectedEffect.id, param.id, $event)"
                      :min="param.min"
                      :max="param.max"
                      :step="param.step"
                      size="small"
                      controls-position="right"
                    />
                    <span v-if="param.unit" class="unit">{{ param.unit }}</span>
                  </div>

                  <!-- 颜色选择 -->
                  <div v-else-if="param.type === 'color'" class="color-control">
                    <el-color-picker
                      :model-value="param.value"
                      @update:model-value="updateParameter(selectedEffect.id, param.id, $event)"
                      show-alpha
                    />
                  </div>

                  <!-- 开关控制 -->
                  <div v-else-if="param.type === 'switch'" class="switch-control">
                    <el-switch
                      :model-value="param.value"
                      @update:model-value="updateParameter(selectedEffect.id, param.id, $event)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="no-selection">
            <p>请从左侧选择一个特效进行参数调节</p>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 预设方案管理 -->
    <el-row class="preset-section">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>预设方案</span>
              <el-button size="small" type="primary" @click="saveCustomPreset">
                保存当前为预设
              </el-button>
            </div>
          </template>

          <div class="preset-grid">
            <div
              v-for="preset in presets"
              :key="preset.id"
              class="preset-item"
              :class="{ active: currentPreset === preset.id }"
              @click="applyPreset(preset)"
            >
              <div class="preset-header">
                <h4>{{ preset.name }}</h4>
                <el-tag size="small" :type="preset.category === 'custom' ? 'success' : 'info'">
                  {{ preset.category === 'realistic' ? '写实' :
                     preset.category === 'cartoon' ? '卡通' :
                     preset.category === 'cinema' ? '电影' : '自定义' }}
                </el-tag>
              </div>
              <p class="preset-description">{{ preset.description }}</p>
              <div class="preset-tags">
                <el-tag
                  v-for="tag in preset.tags"
                  :key="tag"
                  size="small"
                  effect="plain"
                >
                  {{ tag }}
                </el-tag>
              </div>
              <div class="preset-actions">
                <el-button size="small" text @click.stop="applyPreset(preset)">
                  应用
                </el-button>
                <el-button size="small" text @click.stop="exportPreset(preset)">
                  导出
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.effect-parameters {

  // 顶部工具栏
  .toolbar-card {
    margin-bottom: 20px;

    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .toolbar-left {
        display: flex;
        gap: 12px;
        align-items: center;
      }

      .toolbar-right {
        display: flex;
        gap: 8px;
        align-items: center;
      }
    }
  }

  .main-content {
    margin-bottom: 20px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .preview-controls {
      display: flex;
      gap: 10px;
      align-items: center;
    }
  }

  // 左侧特效树
  .effect-tree-card {
    height: calc(100vh - 240px);

    .effect-tree {
      max-height: calc(100% - 140px);
      overflow-y: auto;

      .tree-node {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;

        .node-icon {
          font-size: 16px;
        }

        .node-label {
          flex: 1;
        }
      }
    }

    .tree-actions {
      margin-top: 12px;

      .action-buttons {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
    }
  }

  // 中间预览区域
  .preview-card {
    height: calc(100vh - 240px);

    .preview-container {
      height: 100%;
      display: flex;
      flex-direction: column;

      .preview-viewport {
        flex: 1;
        position: relative;
        background: #f5f5f5;
        border-radius: 8px;
        overflow: hidden;

        .render-preview {
          height: 60%;
          background: linear-gradient(45deg, #e0e0e0 25%, transparent 25%),
                      linear-gradient(-45deg, #e0e0e0 25%, transparent 25%),
                      linear-gradient(45deg, transparent 75%, #e0e0e0 75%),
                      linear-gradient(-45deg, transparent 75%, #e0e0e0 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: all 0.3s ease;

          &.compare-mode {
            background: linear-gradient(90deg, #e8f4f8 50%, #f8e8f4 50%);
          }

          .preview-content {
            text-align: center;
            color: #666;

            .scene-placeholder {
              .placeholder-icon {
                font-size: 64px;
                margin-bottom: 16px;
                animation: pulse 2s ease-in-out infinite;
              }

              .placeholder-title {
                font-size: 18px;
                font-weight: 500;
                margin-bottom: 8px;
                color: #333;
              }

              .placeholder-text {
                font-size: 14px;
                color: #666;
                margin-top: 8px;
              }

              .preview-stats {
                display: flex;
                gap: 8px;
                justify-content: center;
                margin-top: 16px;
                flex-wrap: wrap;

                .stat-tag {
                  font-size: 12px;
                }
              }
            }
          }
        }

        // 性能监控
        .performance-monitor {
          height: 40%;
          background: #fff;
          border-top: 1px solid #e0e0e0;
          padding: 16px;

          .monitor-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            font-weight: 500;
          }

          .monitor-stats {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;

            .stat-item {
              display: flex;
              align-items: center;
              gap: 8px;

              .stat-label {
                font-size: 12px;
                color: #666;
                min-width: 40px;
              }

              .stat-value {
                font-size: 14px;
                font-weight: 500;
                color: #333;
                min-width: 40px;
                text-align: right;
              }

              .stat-progress {
                flex: 1;
                max-width: 60px;
              }
            }
          }
        }
      }
    }
  }

  // 右侧参数面板
  .parameter-card {
    height: calc(100vh - 240px);
    overflow-y: auto;

    .parameter-panel {
      .effect-info {
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 1px solid #e0e0e0;

        h4 {
          margin: 0 0 8px 0;
          color: #333;
        }

        p {
          margin: 0 0 12px 0;
          font-size: 12px;
          color: #666;
        }
      }

      .parameters-list {
        .parameter-item {
          margin-bottom: 20px;

          .parameter-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;

            .parameter-name {
              font-size: 14px;
              font-weight: 500;
              color: #333;
            }

            .info-icon {
              font-size: 14px;
              color: #999;
              cursor: help;
            }
          }

          .parameter-control {
            .slider-control {
              .slider-value {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 8px;

                .unit {
                  font-size: 12px;
                  color: #666;
                }
              }
            }

            .number-control {
              display: flex;
              align-items: center;
              gap: 8px;

              .unit {
                font-size: 12px;
                color: #666;
              }
            }

            .color-control {
              display: flex;
              align-items: center;
            }

            .switch-control {
              display: flex;
              align-items: center;
            }
          }
        }
      }
    }

    .no-selection {
      text-align: center;
      color: #999;
      padding: 40px 20px;
    }
  }

  // 预设方案区域
  .preset-section {
    margin-top: 20px;

    .preset-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;

      .preset-item {
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 16px;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          border-color: #409EFF;
          box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
        }

        &.active {
          border-color: #409EFF;
          background: rgba(64, 158, 255, 0.05);
        }

        .preset-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;

          h4 {
            margin: 0;
            color: #333;
          }
        }

        .preset-description {
          margin: 0 0 12px 0;
          font-size: 12px;
          color: #666;
          line-height: 1.4;
        }

        .preset-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-bottom: 12px;
        }

        .preset-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }
      }
    }
  }

  // 动画
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.05);
      opacity: 0.8;
    }
  }
}
</style>