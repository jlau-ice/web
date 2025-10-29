<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'

// 时间段枚举
enum TimePhase {
  MIDNIGHT = 'midnight',
  DAWN = 'dawn',
  DAY = 'day',
  DUSK = 'dusk',
  NIGHT = 'night'
}

// 预设时间点
const presetTimes = [
  { label: '黎明', value: 6, icon: '🌅' },
  { label: '正午', value: 12, icon: '☀️' },
  { label: '黄昏', value: 18, icon: '🌆' },
  { label: '午夜', value: 0, icon: '🌙' }
]

// 场景预设
interface ScenePreset {
  id: string
  name: string
  time: number
  config: LightConfig
}

// 光照配置接口
interface LightConfig {
  sunIntensity: number
  sunColor: string
  sunAzimuth: number // 方位角
  sunElevation: number // 高度角
  ambientIntensity: number
  skyboxBrightness: number
  moonIntensity: number
  moonColor: string
  starsVisible: boolean
  starsIntensity: number
  artificialLights: boolean
}

// 当前时间（0-24小时）
const currentTime = ref(12)
const isAutoMode = ref(false)
const timeSpeed = ref(1) // 时间流逝速度倍率
const transitionDuration = ref(2000) // 过渡动画时长(ms)
const isTransitioning = ref(false)

// 光照配置
const lightConfig = reactive<LightConfig>({
  sunIntensity: 1.0,
  sunColor: '#FFE4B5',
  sunAzimuth: 0,
  sunElevation: 45,
  ambientIntensity: 0.3,
  skyboxBrightness: 1.0,
  moonIntensity: 0.5,
  moonColor: '#B0C4DE',
  starsVisible: false,
  starsIntensity: 0.8,
  artificialLights: false
})

// 视角选项
const viewAngles = [
  { label: '正视图', value: 'front' },
  { label: '俯视图', value: 'top' },
  { label: '侧视图', value: 'side' },
  { label: '全景图', value: 'panorama' }
]
const currentViewAngle = ref('front')

// 场景预设列表
const scenePresets = ref<ScenePreset[]>([])

// 自动模式定时器
let autoModeTimer: number | null = null

// 计算太阳高度角（基于时间）
const sunElevationAngle = computed(() => {
  const hour = currentTime.value
  // 简化的太阳高度角计算：正午最高(90度)，午夜最低(-90度)
  if (hour >= 6 && hour <= 18) {
    // 白天：6点到18点
    return ((hour - 6) / 6 - 1) * -90 + 90
  } else {
    // 夜晚
    return ((hour >= 18 ? hour - 18 : hour + 6) / 6) * -90
  }
})

// 计算当前时间段
const currentPhase = computed(() => {
  const hour = currentTime.value
  if (hour >= 5 && hour < 7) return TimePhase.DAWN
  if (hour >= 7 && hour < 17) return TimePhase.DAY
  if (hour >= 17 && hour < 19) return TimePhase.DUSK
  if (hour >= 19 || hour < 2) return TimePhase.NIGHT
  return TimePhase.MIDNIGHT
})

// 时间段配置
const phaseConfig = {
  [TimePhase.MIDNIGHT]: {
    color: '#1a1a3e',
    gradient: 'linear-gradient(135deg, #1a1a3e, #2d2d5f)',
    label: '深夜',
    bgColor: '#0f0f2e'
  },
  [TimePhase.DAWN]: {
    color: '#ff6b35',
    gradient: 'linear-gradient(135deg, #ff6b35, #f7931e)',
    label: '黎明',
    bgColor: '#fff3e0'
  },
  [TimePhase.DAY]: {
    color: '#ffd93d',
    gradient: 'linear-gradient(135deg, #ffd93d, #6bcfff)',
    label: '白昼',
    bgColor: '#e3f2fd'
  },
  [TimePhase.DUSK]: {
    color: '#c44569',
    gradient: 'linear-gradient(135deg, #c44569, #f97f51)',
    label: '黄昏',
    bgColor: '#fce4ec'
  },
  [TimePhase.NIGHT]: {
    color: '#2c3e50',
    gradient: 'linear-gradient(135deg, #2c3e50, #34495e)',
    label: '夜晚',
    bgColor: '#263238'
  }
}

// 当前时间段样式
const currentPhaseStyle = computed(() => phaseConfig[currentPhase.value])

// 格式化时间显示
const formattedTime = computed(() => {
  const hour = Math.floor(currentTime.value)
  const minute = Math.floor((currentTime.value - hour) * 60)
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
})

// 加载场景预设（模拟异步）
const loadScenePresets = () => {
  return new Promise<ScenePreset[]>((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 'preset-1',
          name: '清晨阳光',
          time: 7,
          config: {
            sunIntensity: 0.8,
            sunColor: '#FFE5B4',
            sunAzimuth: 45,
            sunElevation: 30,
            ambientIntensity: 0.4,
            skyboxBrightness: 0.9,
            moonIntensity: 0,
            moonColor: '#B0C4DE',
            starsVisible: false,
            starsIntensity: 0,
            artificialLights: false
          }
        },
        {
          id: 'preset-2',
          name: '正午烈日',
          time: 12,
          config: {
            sunIntensity: 1.2,
            sunColor: '#FFFACD',
            sunAzimuth: 0,
            sunElevation: 90,
            ambientIntensity: 0.5,
            skyboxBrightness: 1.2,
            moonIntensity: 0,
            moonColor: '#B0C4DE',
            starsVisible: false,
            starsIntensity: 0,
            artificialLights: false
          }
        },
        {
          id: 'preset-3',
          name: '浪漫黄昏',
          time: 18,
          config: {
            sunIntensity: 0.6,
            sunColor: '#FF6347',
            sunAzimuth: 270,
            sunElevation: 15,
            ambientIntensity: 0.3,
            skyboxBrightness: 0.7,
            moonIntensity: 0.2,
            moonColor: '#FFB6C1',
            starsVisible: true,
            starsIntensity: 0.3,
            artificialLights: true
          }
        },
        {
          id: 'preset-4',
          name: '星空之夜',
          time: 22,
          config: {
            sunIntensity: 0,
            sunColor: '#000000',
            sunAzimuth: 0,
            sunElevation: -45,
            ambientIntensity: 0.15,
            skyboxBrightness: 0.3,
            moonIntensity: 0.8,
            moonColor: '#F0F8FF',
            starsVisible: true,
            starsIntensity: 1.0,
            artificialLights: true
          }
        }
      ])
    }, 500)
  })
}

// 初始化加载预设
onMounted(async () => {
  scenePresets.value = await loadScenePresets()
  ElMessage.success('昼夜切换系统初始化完成')
  updateLightingBasedOnTime()
})

// 清理定时器
onUnmounted(() => {
  if (autoModeTimer) {
    clearInterval(autoModeTimer)
  }
})

// 时间变化时更新光照
watch(currentTime, () => {
  if (!isTransitioning.value) {
    updateLightingBasedOnTime()
  }
})

// 根据时间更新光照配置
const updateLightingBasedOnTime = () => {
  const hour = currentTime.value
  
  // 太阳高度角和方位角
  lightConfig.sunElevation = sunElevationAngle.value
  lightConfig.sunAzimuth = ((hour - 6) / 12) * 180 - 90
  
  // 根据时间段调整光照参数
  if (hour >= 6 && hour < 8) {
    // 黎明
    lightConfig.sunIntensity = 0.4 + (hour - 6) * 0.2
    lightConfig.sunColor = '#FFE5B4'
    lightConfig.ambientIntensity = 0.3
    lightConfig.skyboxBrightness = 0.6 + (hour - 6) * 0.2
    lightConfig.starsVisible = hour < 7
    lightConfig.starsIntensity = Math.max(0, 1 - (hour - 6) * 0.5)
    lightConfig.moonIntensity = Math.max(0, 0.5 - (hour - 6) * 0.25)
  } else if (hour >= 8 && hour < 17) {
    // 白天
    lightConfig.sunIntensity = 1.0
    lightConfig.sunColor = '#FFFACD'
    lightConfig.ambientIntensity = 0.5
    lightConfig.skyboxBrightness = 1.0
    lightConfig.starsVisible = false
    lightConfig.starsIntensity = 0
    lightConfig.moonIntensity = 0
  } else if (hour >= 17 && hour < 19) {
    // 黄昏
    const progress = (hour - 17) / 2
    lightConfig.sunIntensity = 0.8 - progress * 0.6
    lightConfig.sunColor = `hsl(${20 - progress * 20}, 100%, ${65 - progress * 20}%)`
    lightConfig.ambientIntensity = 0.4 - progress * 0.2
    lightConfig.skyboxBrightness = 0.8 - progress * 0.4
    lightConfig.starsVisible = progress > 0.5
    lightConfig.starsIntensity = Math.max(0, progress * 0.8)
    lightConfig.moonIntensity = progress * 0.6
  } else {
    // 夜晚
    lightConfig.sunIntensity = 0
    lightConfig.sunColor = '#000000'
    lightConfig.ambientIntensity = 0.15
    lightConfig.skyboxBrightness = 0.3
    lightConfig.starsVisible = true
    lightConfig.starsIntensity = 0.9
    lightConfig.moonIntensity = 0.7
  }
  
  // 人工光源在夜间自动开启
  lightConfig.artificialLights = hour < 6 || hour >= 18
}

// 切换到预设时间
const switchToPresetTime = (time: number) => {
  isTransitioning.value = true
  const startTime = currentTime.value
  const duration = transitionDuration.value
  const startTimestamp = Date.now()
  
  const animate = () => {
    const elapsed = Date.now() - startTimestamp
    const progress = Math.min(elapsed / duration, 1)
    
    // 使用缓动函数
    const easeProgress = 1 - Math.pow(1 - progress, 3)
    currentTime.value = startTime + (time - startTime) * easeProgress
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      currentTime.value = time
      isTransitioning.value = false
      updateLightingBasedOnTime()
    }
  }
  
  animate()
}

// 切换自动模式
const toggleAutoMode = () => {
  if (isAutoMode.value) {
    // 启动自动模式
    autoModeTimer = window.setInterval(() => {
      currentTime.value += (timeSpeed.value * 0.1) // 每100ms增加
      if (currentTime.value >= 24) {
        currentTime.value = 0
      }
    }, 100)
    ElMessage.info('已启动自动模式')
  } else {
    // 停止自动模式
    if (autoModeTimer) {
      clearInterval(autoModeTimer)
      autoModeTimer = null
    }
    ElMessage.info('已停止自动模式')
  }
}

// 保存当前配置为预设
const saveAsPreset = () => {
  const name = prompt('请输入预设名称：')
  if (name) {
    const newPreset: ScenePreset = {
      id: `preset-${Date.now()}`,
      name,
      time: currentTime.value,
      config: { ...lightConfig }
    }
    scenePresets.value.push(newPreset)
    ElMessage.success(`预设"${name}"保存成功！`)
  }
}

// 应用场景预设
const applyScenePreset = (preset: ScenePreset) => {
  isTransitioning.value = true
  switchToPresetTime(preset.time)
  
  setTimeout(() => {
    Object.assign(lightConfig, preset.config)
    isTransitioning.value = false
    ElMessage.success(`已应用预设：${preset.name}`)
  }, transitionDuration.value)
}

// 重置为默认配置
const resetToDefault = () => {
  currentTime.value = 12
  updateLightingBasedOnTime()
  ElMessage.success('已重置为默认配置')
}
</script>

<template>
  <div class="daynight-switch-container">
    <!-- 左侧：时间控制面板 -->
    <div class="control-panel">
      <el-card shadow="hover">
        <template #header>
          <div class="card-header">
            <span class="title">⏰ 时间控制</span>
          </div>
        </template>
        
        <!-- 当前时间显示 -->
        <div class="time-display" :style="{ background: currentPhaseStyle.gradient }">
          <div class="time-value">{{ formattedTime }}</div>
          <el-tag :color="currentPhaseStyle.color" effect="dark" size="large">
            {{ currentPhaseStyle.label }}
          </el-tag>
        </div>
        
        <!-- 时间滑块 -->
        <div class="time-slider">
          <div class="slider-label">
            <span>时间调节</span>
            <span class="time-marks">0h ━━━ 12h ━━━ 24h</span>
          </div>
          <el-slider
            v-model="currentTime"
            :min="0"
            :max="24"
            :step="0.1"
            :show-tooltip="true"
            :format-tooltip="(val) => `${Math.floor(val)}:${Math.floor((val % 1) * 60).toString().padStart(2, '0')}`"
            :marks="{ 0: '0h', 6: '6h', 12: '12h', 18: '18h', 24: '24h' }"
          />
        </div>
        
        <!-- 太阳高度角显示 -->
        <div class="sun-info">
          <el-row :gutter="12">
            <el-col :span="12">
              <div class="info-item">
                <span class="label">太阳高度角</span>
                <span class="value">{{ sunElevationAngle.toFixed(1) }}°</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="info-item">
                <span class="label">太阳方位角</span>
                <span class="value">{{ lightConfig.sunAzimuth.toFixed(1) }}°</span>
              </div>
            </el-col>
          </el-row>
        </div>
        
        <!-- 预设时间快速切换 -->
        <div class="preset-times">
          <div class="section-title">快速切换</div>
          <el-row :gutter="8">
            <el-col :span="6" v-for="preset in presetTimes" :key="preset.value">
              <el-button
                @click="switchToPresetTime(preset.value)"
                size="large"
                :type="Math.floor(currentTime) === preset.value ? 'primary' : 'default'"
                style="width: 100%"
              >
                <span style="font-size: 18px">{{ preset.icon }}</span>
                <div style="font-size: 12px; margin-top: 4px">{{ preset.label }}</div>
              </el-button>
            </el-col>
          </el-row>
        </div>
        
        <!-- 自动模式控制 -->
        <div class="auto-mode">
          <div class="section-title">自动模式</div>
          <el-row :gutter="12" align="middle">
            <el-col :span="12">
              <div class="mode-switch">
                <span>自动模式</span>
                <el-switch
                  v-model="isAutoMode"
                  @change="toggleAutoMode"
                  size="large"
                  active-text="开"
                  inactive-text="关"
                />
              </div>
            </el-col>
            <el-col :span="12">
              <div class="speed-control">
                <span>速度 ×{{ timeSpeed }}</span>
                <el-slider
                  v-model="timeSpeed"
                  :min="0.5"
                  :max="10"
                  :step="0.5"
                  :disabled="!isAutoMode"
                  style="margin-top: 8px"
                />
              </div>
            </el-col>
          </el-row>
        </div>
        
        <!-- 过渡动画时长 -->
        <div class="transition-control">
          <div class="section-title">过渡时长</div>
          <el-slider
            v-model="transitionDuration"
            :min="500"
            :max="5000"
            :step="100"
            :format-tooltip="(val) => `${(val / 1000).toFixed(1)}s`"
          />
        </div>
      </el-card>
    </div>
    
    <!-- 中间：实时渲染视图 -->
    <div class="preview-area">
      <el-card shadow="hover" class="preview-card">
        <template #header>
          <div class="card-header">
            <span class="title">🎨 实时渲染预览</span>
            <el-select v-model="currentViewAngle" size="default" style="width: 120px">
              <el-option
                v-for="angle in viewAngles"
                :key="angle.value"
                :label="angle.label"
                :value="angle.value"
              />
            </el-select>
          </div>
        </template>
        
        <!-- 渲染视图 -->
        <div class="render-view" :style="{ background: currentPhaseStyle.gradient }">
          <div class="scene-simulation">
            <!-- 天空 -->
            <div class="sky" :style="{ opacity: lightConfig.skyboxBrightness }">
              <!-- 太阳 -->
              <div
                v-if="lightConfig.sunIntensity > 0"
                class="sun"
                :style="{
                  opacity: lightConfig.sunIntensity,
                  backgroundColor: lightConfig.sunColor,
                  transform: `translate(-50%, -50%) rotate(${lightConfig.sunAzimuth}deg) translateY(-${lightConfig.sunElevation}px)`,
                  boxShadow: `0 0 ${60 * lightConfig.sunIntensity}px ${lightConfig.sunColor}`
                }"
              ></div>
              
              <!-- 月亮 -->
              <div
                v-if="lightConfig.moonIntensity > 0"
                class="moon"
                :style="{
                  opacity: lightConfig.moonIntensity,
                  backgroundColor: lightConfig.moonColor,
                  boxShadow: `0 0 ${40 * lightConfig.moonIntensity}px ${lightConfig.moonColor}`
                }"
              ></div>
              
              <!-- 星星 -->
              <div v-if="lightConfig.starsVisible" class="stars">
                <div
                  v-for="i in 50"
                  :key="i"
                  class="star"
                  :style="{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 60}%`,
                    opacity: lightConfig.starsIntensity * Math.random(),
                    animationDelay: `${Math.random() * 3}s`
                  }"
                ></div>
              </div>
            </div>
            
            <!-- 地面场景 -->
            <div class="ground-scene">
              <!-- 建筑物 -->
              <div class="buildings">
                <div
                  v-for="i in 5"
                  :key="i"
                  class="building"
                  :style="{
                    left: `${10 + i * 18}%`,
                    height: `${80 + Math.random() * 80}px`,
                    opacity: 0.6 + lightConfig.ambientIntensity
                  }"
                >
                  <!-- 窗户灯光 -->
                  <div
                    v-if="lightConfig.artificialLights"
                    class="window-lights"
                  >
                    <div
                      v-for="j in 6"
                      :key="j"
                      class="window"
                      :style="{ opacity: Math.random() > 0.3 ? 1 : 0 }"
                    ></div>
                  </div>
                </div>
              </div>
              
              <!-- 路灯 -->
              <div v-if="lightConfig.artificialLights" class="street-lights">
                <div
                  v-for="i in 4"
                  :key="i"
                  class="street-light"
                  :style="{ left: `${15 + i * 25}%` }"
                >
                  <div class="light-glow"></div>
                </div>
              </div>
            </div>
            
            <!-- 效果提示 -->
            <div class="effect-info">
              <el-tag type="info" size="small">{{ currentPhaseStyle.label }}</el-tag>
              <el-tag v-if="isTransitioning" type="warning" size="small">过渡中...</el-tag>
              <el-tag v-if="lightConfig.artificialLights" type="success" size="small">🏮 人工光源</el-tag>
            </div>
          </div>
        </div>
        
        <!-- 光照数据面板 -->
        <div class="lighting-stats">
          <el-row :gutter="12">
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-label">太阳光强</div>
                <el-progress
                  :percentage="lightConfig.sunIntensity * 100"
                  :color="lightConfig.sunColor"
                  :stroke-width="12"
                />
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-label">环境光</div>
                <el-progress
                  :percentage="lightConfig.ambientIntensity * 100"
                  color="#42A5F5"
                  :stroke-width="12"
                />
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-label">月光强度</div>
                <el-progress
                  :percentage="lightConfig.moonIntensity * 100"
                  :color="lightConfig.moonColor"
                  :stroke-width="12"
                />
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-label">天空亮度</div>
                <el-progress
                  :percentage="lightConfig.skyboxBrightness * 100"
                  color="#90CAF9"
                  :stroke-width="12"
                />
              </div>
            </el-col>
          </el-row>
        </div>
      </el-card>
    </div>
    
    <!-- 右侧：光照参数配置 -->
    <div class="config-panel">
      <el-card shadow="hover">
        <template #header>
          <div class="card-header">
            <span class="title">⚙️ 光照配置</span>
          </div>
        </template>
        
        <!-- 太阳光配置 -->
        <div class="config-section">
          <div class="section-title">☀️ 太阳光设置</div>
          <div class="config-item">
            <span>强度</span>
            <el-slider v-model="lightConfig.sunIntensity" :min="0" :max="2" :step="0.1" />
          </div>
          <div class="config-item">
            <span>颜色</span>
            <el-color-picker v-model="lightConfig.sunColor" />
          </div>
          <div class="config-item">
            <span>方位角 ({{ lightConfig.sunAzimuth.toFixed(0) }}°)</span>
            <el-slider v-model="lightConfig.sunAzimuth" :min="-180" :max="180" />
          </div>
          <div class="config-item">
            <span>高度角 ({{ lightConfig.sunElevation.toFixed(0) }}°)</span>
            <el-slider v-model="lightConfig.sunElevation" :min="-90" :max="90" />
          </div>
        </div>
        
        <!-- 环境光配置 -->
        <div class="config-section">
          <div class="section-title">🌍 环境光设置</div>
          <div class="config-item">
            <span>环境光强度</span>
            <el-slider v-model="lightConfig.ambientIntensity" :min="0" :max="1" :step="0.05" />
          </div>
          <div class="config-item">
            <span>天空盒亮度</span>
            <el-slider v-model="lightConfig.skyboxBrightness" :min="0" :max="2" :step="0.1" />
          </div>
        </div>
        
        <!-- 月光和星空 -->
        <div class="config-section">
          <div class="section-title">🌙 月光与星空</div>
          <div class="config-item">
            <span>月光强度</span>
            <el-slider v-model="lightConfig.moonIntensity" :min="0" :max="1" :step="0.1" />
          </div>
          <div class="config-item">
            <span>月光颜色</span>
            <el-color-picker v-model="lightConfig.moonColor" />
          </div>
          <div class="config-item">
            <span>显示星空</span>
            <el-switch v-model="lightConfig.starsVisible" />
          </div>
          <div class="config-item" v-if="lightConfig.starsVisible">
            <span>星空强度</span>
            <el-slider v-model="lightConfig.starsIntensity" :min="0" :max="1" :step="0.1" />
          </div>
        </div>
        
        <!-- 人工光源 -->
        <div class="config-section">
          <div class="section-title">💡 人工光源</div>
          <div class="config-item">
            <span>启用人工光源</span>
            <el-switch v-model="lightConfig.artificialLights" />
          </div>
        </div>
        
        <!-- 场景预设 -->
        <div class="config-section">
          <div class="section-title">📋 场景预设</div>
          <div class="preset-list">
            <el-button
              v-for="preset in scenePresets"
              :key="preset.id"
              @click="applyScenePreset(preset)"
              size="small"
              style="width: 100%; margin-bottom: 8px"
            >
              {{ preset.name }} ({{ preset.time }}:00)
            </el-button>
          </div>
          <el-row :gutter="8" style="margin-top: 12px">
            <el-col :span="12">
              <el-button @click="saveAsPreset" type="primary" size="small" style="width: 100%">
                保存预设
              </el-button>
            </el-col>
            <el-col :span="12">
              <el-button @click="resetToDefault" size="small" style="width: 100%">
                重置默认
              </el-button>
            </el-col>
          </el-row>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped lang="scss">
.daynight-switch-container {
  display: flex;
  gap: 16px;
  height: calc(100vh - 120px);
  
  .control-panel,
  .config-panel {
    flex: 0 0 320px;
    overflow-y: auto;
    
    &::-webkit-scrollbar {
      width: 6px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: #cbd5e0;
      border-radius: 3px;
    }
  }
  
  .preview-area {
    flex: 1;
    min-width: 0;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .title {
      font-size: 16px;
      font-weight: 600;
      color: #2d3748;
    }
  }
  
  // 时间显示
  .time-display {
    padding: 24px;
    border-radius: 12px;
    text-align: center;
    margin-bottom: 20px;
    
    .time-value {
      font-size: 48px;
      font-weight: 700;
      color: white;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
      margin-bottom: 12px;
      font-family: 'Arial', monospace;
    }
  }
  
  // 时间滑块
  .time-slider {
    margin-bottom: 24px;
    
    .slider-label {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
      color: #4a5568;
      
      .time-marks {
        font-size: 12px;
        color: #a0aec0;
      }
    }
  }
  
  // 太阳信息
  .sun-info {
    margin-bottom: 24px;
    
    .info-item {
      display: flex;
      flex-direction: column;
      padding: 12px;
      background: #f7fafc;
      border-radius: 8px;
      
      .label {
        font-size: 12px;
        color: #718096;
        margin-bottom: 4px;
      }
      
      .value {
        font-size: 20px;
        font-weight: 600;
        color: #2d3748;
      }
    }
  }
  
  // 章节标题
  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 2px solid #e2e8f0;
  }
  
  // 预设时间
  .preset-times {
    margin-bottom: 24px;
    
    :deep(.el-button) {
      height: auto;
      padding: 12px 8px;
    }
  }
  
  // 自动模式
  .auto-mode {
    margin-bottom: 24px;
    
    .mode-switch,
    .speed-control {
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 13px;
      color: #4a5568;
    }
  }
  
  // 过渡控制
  .transition-control {
    margin-bottom: 16px;
  }
  
  // 预览卡片
  .preview-card {
    height: 100%;
    display: flex;
    flex-direction: column;
    
    :deep(.el-card__body) {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 0;
    }
  }
  
  // 渲染视图
  .render-view {
    flex: 1;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
    min-height: 400px;
  }
  
  // 场景模拟
  .scene-simulation {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
  }
  
  .sky {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 60%;
    transition: opacity 1s ease;
  }
  
  .sun {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    transition: all 2s ease;
  }
  
  .moon {
    position: absolute;
    top: 15%;
    right: 20%;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    transition: all 2s ease;
    
    &::before {
      content: '';
      position: absolute;
      top: 10px;
      right: 10px;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.1);
    }
  }
  
  .stars {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
  
  .star {
    position: absolute;
    width: 2px;
    height: 2px;
    background: white;
    border-radius: 50%;
    animation: twinkle 3s infinite;
  }
  
  @keyframes twinkle {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }
  
  .ground-scene {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40%;
    background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.2));
  }
  
  .buildings {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 100%;
  }
  
  .building {
    position: absolute;
    bottom: 0;
    width: 60px;
    background: linear-gradient(135deg, #34495e, #2c3e50);
    border-radius: 4px 4px 0 0;
    transition: all 1s ease;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }
  
  .window-lights {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    padding: 10px;
  }
  
  .window {
    aspect-ratio: 1;
    background: #ffd93d;
    border-radius: 2px;
    box-shadow: 0 0 10px #ffd93d;
    transition: opacity 0.5s ease;
  }
  
  .street-lights {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
  }
  
  .street-light {
    position: absolute;
    bottom: 0;
    width: 4px;
    height: 40px;
    background: #555;
    
    .light-glow {
      position: absolute;
      top: -10px;
      left: 50%;
      transform: translateX(-50%);
      width: 30px;
      height: 30px;
      background: radial-gradient(circle, #ffd93d, transparent);
      border-radius: 50%;
    }
  }
  
  .effect-info {
    position: absolute;
    top: 16px;
    left: 16px;
    display: flex;
    gap: 8px;
  }
  
  // 光照统计
  .lighting-stats {
    padding: 16px;
    background: white;
    border-top: 1px solid #e2e8f0;
    
    .stat-item {
      .stat-label {
        font-size: 12px;
        color: #718096;
        margin-bottom: 8px;
      }
    }
  }
  
  // 配置区块
  .config-section {
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e2e8f0;
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  .config-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    font-size: 13px;
    color: #4a5568;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    span:first-child {
      flex: 0 0 auto;
      margin-right: 12px;
    }
    
    .el-slider {
      flex: 1;
    }
  }
  
  .preset-list {
    max-height: 200px;
    overflow-y: auto;
    
    &::-webkit-scrollbar {
      width: 4px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: #cbd5e0;
      border-radius: 2px;
    }
  }
}
</style>