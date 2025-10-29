<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 类型定义
interface CalibrationTool {
  id: string
  name: string
  icon: string
  description: string
}

interface Position {
  x: number
  y: number
  z: number
}

interface Rotation {
  x: number
  y: number
  z: number
}

interface ComponentItem {
  id: string
  name: string
  position: Position
  rotation: Rotation
  scale: number
  status: 'calibrated' | 'uncalibrated' | 'error'
}

interface CalibrationHistory {
  id: string
  timestamp: number
  action: string
  component: string
  params: any
}

interface CalibrationTemplate {
  id: string
  name: string
  description: string
  params: any
}

// 校准工具列表
const calibrationTools = ref<CalibrationTool[]>([
  { id: 'coordinate', name: '坐标对齐', icon: 'Grid', description: '按坐标轴对齐组件' },
  { id: 'center', name: '中心对齐', icon: 'Aim', description: '将组件中心对齐' },
  { id: 'surface', name: '表面贴合', icon: 'CopyDocument', description: '贴合到目标表面' },
  { id: 'axis', name: '轴向对齐', icon: 'Connection', description: '沿轴向对齐组件' }
])

// 当前状态
const currentTool = ref<string>('coordinate')
const calibrationPrecision = ref<number>(0.01)
const loading = ref<boolean>(false)

// 组件列表
const components = ref<ComponentItem[]>([
  {
    id: 'comp-1',
    name: '底座组件',
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: 1.0,
    status: 'calibrated'
  },
  {
    id: 'comp-2',
    name: '支撑架',
    position: { x: 10.5, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: 1.0,
    status: 'uncalibrated'
  },
  {
    id: 'comp-3',
    name: '顶盖',
    position: { x: 0, y: 20.3, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: 1.0,
    status: 'error'
  }
])

const selectedComponent = ref<string>('comp-2')

// 当前组件的位置参数
const currentPosition = reactive<Position>({
  x: 10.5,
  y: 0,
  z: 0
})

const currentRotation = reactive<Rotation>({
  x: 0,
  y: 0,
  z: 0
})

const currentScale = ref<number>(1.0)

// 视角列表
const viewAngles = ref([
  { id: 'front', name: '前视图', icon: 'View' },
  { id: 'top', name: '俯视图', icon: 'View' },
  { id: 'side', name: '侧视图', icon: 'View' },
  { id: '3d', name: '透视图', icon: 'View' }
])

const currentView = ref<string>('3d')

// 校准历史
const calibrationHistory = ref<CalibrationHistory[]>([])
const historyIndex = ref<number>(-1)

// 模板列表
const templates = ref<CalibrationTemplate[]>([
  {
    id: 'tpl-1',
    name: '标准居中对齐',
    description: '将组件居中对齐到原点',
    params: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 } }
  }
])

// 精度验证数据
const precisionData = reactive({
  distance: 0,
  angle: 0,
  collision: false,
  gap: 0,
  score: 0
})

// 计算属性
const canUndo = computed(() => historyIndex.value >= 0)
const canRedo = computed(() => historyIndex.value < calibrationHistory.value.length - 1)

const currentToolInfo = computed(() => {
  return calibrationTools.value.find(t => t.id === currentTool.value)
})

const selectedComponentData = computed(() => {
  return components.value.find(c => c.id === selectedComponent.value)
})

const calibrationStatusText = computed(() => {
  const calibrated = components.value.filter(c => c.status === 'calibrated').length
  const total = components.value.length
  return `${calibrated}/${total} 组件已校准`
})

// 方法
const selectTool = (toolId: string) => {
  currentTool.value = toolId
  ElMessage.success(`已切换到${calibrationTools.value.find(t => t.id === toolId)?.name}`)
}

const selectComponent = (componentId: string) => {
  selectedComponent.value = componentId
  const comp = components.value.find(c => c.id === componentId)
  if (comp) {
    currentPosition.x = comp.position.x
    currentPosition.y = comp.position.y
    currentPosition.z = comp.position.z
    currentRotation.x = comp.rotation.x
    currentRotation.y = comp.rotation.y
    currentRotation.z = comp.rotation.z
    currentScale.value = comp.scale
  }
}

const changeView = (viewId: string) => {
  currentView.value = viewId
  ElMessage.info(`切换到${viewAngles.value.find(v => v.id === viewId)?.name}`)
}

const updatePosition = () => {
  const comp = components.value.find(c => c.id === selectedComponent.value)
  if (comp) {
    comp.position = { ...currentPosition }
    comp.rotation = { ...currentRotation }
    comp.scale = currentScale.value

    addHistory('更新位置', selectedComponent.value, {
      position: { ...currentPosition },
      rotation: { ...currentRotation },
      scale: currentScale.value
    })

    validatePrecision()
  }
}

const resetPosition = () => {
  currentPosition.x = 0
  currentPosition.y = 0
  currentPosition.z = 0
  currentRotation.x = 0
  currentRotation.y = 0
  currentRotation.z = 0
  currentScale.value = 1.0
  updatePosition()
  ElMessage.success('参数已重置')
}

const applyCalibration = async () => {
  loading.value = true

  // 模拟异步校准过程
  await new Promise(resolve => setTimeout(resolve, 1500))

  const comp = components.value.find(c => c.id === selectedComponent.value)
  if (comp) {
    // 根据不同的校准工具应用不同的校准逻辑
    switch (currentTool.value) {
      case 'coordinate':
        // 坐标对齐：对齐到最近的整数坐标
        currentPosition.x = Math.round(currentPosition.x)
        currentPosition.y = Math.round(currentPosition.y)
        currentPosition.z = Math.round(currentPosition.z)
        break
      case 'center':
        // 中心对齐：移动到原点
        currentPosition.x = 0
        currentPosition.y = 0
        currentPosition.z = 0
        break
      case 'surface':
        // 表面贴合：Z轴对齐到0
        currentPosition.z = 0
        break
      case 'axis':
        // 轴向对齐：旋转角度归零
        currentRotation.x = 0
        currentRotation.y = 0
        currentRotation.z = 0
        break
    }

    updatePosition()
    comp.status = 'calibrated'

    loading.value = false
    ElMessage.success('校准完成')
    validatePrecision()
  }
}

const batchCalibrate = async () => {
  loading.value = true

  ElMessage.info('开始批量校准...')

  // 模拟批量校准
  await new Promise(resolve => setTimeout(resolve, 2000))

  components.value.forEach(comp => {
    comp.status = 'calibrated'
  })

  loading.value = false
  ElMessage.success(`成功校准 ${components.value.length} 个组件`)
  validatePrecision()
}

const addHistory = (action: string, component: string, params: any) => {
  // 删除当前索引之后的历史记录
  calibrationHistory.value = calibrationHistory.value.slice(0, historyIndex.value + 1)

  const historyItem: CalibrationHistory = {
    id: `history-${Date.now()}`,
    timestamp: Date.now(),
    action,
    component,
    params
  }

  calibrationHistory.value.push(historyItem)
  historyIndex.value = calibrationHistory.value.length - 1

  // 限制历史记录数量
  if (calibrationHistory.value.length > 50) {
    calibrationHistory.value.shift()
    historyIndex.value--
  }
}

const undo = () => {
  if (!canUndo.value) return

  historyIndex.value--
  const historyItem = calibrationHistory.value[historyIndex.value]

  if (historyItem) {
    // 恢复到历史状态
    const comp = components.value.find(c => c.id === historyItem.component)
    if (comp && historyItem.params) {
      if (historyItem.params.position) {
        comp.position = { ...historyItem.params.position }
      }
      if (historyItem.params.rotation) {
        comp.rotation = { ...historyItem.params.rotation }
      }
      if (historyItem.params.scale !== undefined) {
        comp.scale = historyItem.params.scale
      }

      if (selectedComponent.value === historyItem.component) {
        selectComponent(historyItem.component)
      }
    }
  }

  ElMessage.info('已撤销')
}

const redo = () => {
  if (!canRedo.value) return

  historyIndex.value++
  const historyItem = calibrationHistory.value[historyIndex.value]

  if (historyItem) {
    const comp = components.value.find(c => c.id === historyItem.component)
    if (comp && historyItem.params) {
      if (historyItem.params.position) {
        comp.position = { ...historyItem.params.position }
      }
      if (historyItem.params.rotation) {
        comp.rotation = { ...historyItem.params.rotation }
      }
      if (historyItem.params.scale !== undefined) {
        comp.scale = historyItem.params.scale
      }

      if (selectedComponent.value === historyItem.component) {
        selectComponent(historyItem.component)
      }
    }
  }

  ElMessage.info('已重做')
}

const saveTemplate = async () => {
  const { value: name } = await ElMessageBox.prompt('请输入模板名称', '保存校准模板', {
    confirmButtonText: '保存',
    cancelButtonText: '取消',
    inputPattern: /.+/,
    inputErrorMessage: '模板名称不能为空'
  })

  if (name) {
    const template: CalibrationTemplate = {
      id: `tpl-${Date.now()}`,
      name,
      description: `基于${currentToolInfo.value?.name}的校准方案`,
      params: {
        tool: currentTool.value,
        precision: calibrationPrecision.value,
        position: { ...currentPosition },
        rotation: { ...currentRotation },
        scale: currentScale.value
      }
    }

    templates.value.push(template)
    ElMessage.success('模板保存成功')
  }
}

const applyTemplate = (template: CalibrationTemplate) => {
  if (template.params) {
    if (template.params.tool) {
      currentTool.value = template.params.tool
    }
    if (template.params.precision !== undefined) {
      calibrationPrecision.value = template.params.precision
    }
    if (template.params.position) {
      currentPosition.x = template.params.position.x
      currentPosition.y = template.params.position.y
      currentPosition.z = template.params.position.z
    }
    if (template.params.rotation) {
      currentRotation.x = template.params.rotation.x
      currentRotation.y = template.params.rotation.y
      currentRotation.z = template.params.rotation.z
    }
    if (template.params.scale !== undefined) {
      currentScale.value = template.params.scale
    }

    updatePosition()
    ElMessage.success(`已应用模板：${template.name}`)
  }
}

const exportCalibration = () => {
  const data = {
    timestamp: new Date().toISOString(),
    tool: currentTool.value,
    precision: calibrationPrecision.value,
    components: components.value.map(c => ({
      id: c.id,
      name: c.name,
      position: c.position,
      rotation: c.rotation,
      scale: c.scale,
      status: c.status
    })),
    precisionData: { ...precisionData }
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `calibration-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)

  ElMessage.success('校准结果已导出')
}

const validatePrecision = () => {
  // 模拟精度验证
  setTimeout(() => {
    // 计算距离（简化计算）
    const comp = selectedComponentData.value
    if (comp) {
      precisionData.distance = Math.sqrt(
        Math.pow(comp.position.x, 2) +
        Math.pow(comp.position.y, 2) +
        Math.pow(comp.position.z, 2)
      )

      // 计算角度
      precisionData.angle = Math.sqrt(
        Math.pow(comp.rotation.x, 2) +
        Math.pow(comp.rotation.y, 2) +
        Math.pow(comp.rotation.z, 2)
      )

      // 模拟碰撞检测
      precisionData.collision = precisionData.distance < 5 && precisionData.distance > 0

      // 模拟间隙
      precisionData.gap = Math.random() * 2

      // 计算精度评分
      let score = 100
      if (precisionData.distance > 10) score -= 20
      if (precisionData.angle > 15) score -= 20
      if (precisionData.collision) score -= 30
      if (precisionData.gap > 1) score -= 10

      precisionData.score = Math.max(0, score)
    }
  }, 300)
}

const generateReport = () => {
  const reportContent = `
校准报告
生成时间: ${new Date().toLocaleString()}
校准工具: ${currentToolInfo.value?.name}
校准精度: ${calibrationPrecision.value}mm

组件状态:
${components.value.map(c => `  - ${c.name}: ${c.status === 'calibrated' ? '已校准' : c.status === 'error' ? '误差大' : '未校准'}`).join('\n')}

精度数据:
  - 距离偏差: ${precisionData.distance.toFixed(2)}mm
  - 角度偏差: ${precisionData.angle.toFixed(2)}°
  - 碰撞检测: ${precisionData.collision ? '存在碰撞' : '无碰撞'}
  - 间隙: ${precisionData.gap.toFixed(2)}mm
  - 精度评分: ${precisionData.score}分

校准建议:
${precisionData.score < 60 ? '  - 需要重新校准，当前精度不符合要求' : ''}
${precisionData.collision ? '  - 检测到组件碰撞，请调整位置' : ''}
${precisionData.gap > 1 ? '  - 间隙过大，建议优化对齐' : ''}
${precisionData.score >= 90 ? '  - 校准精度优秀' : ''}
  `.trim()

  ElMessageBox.alert(reportContent, '校准报告', {
    confirmButtonText: '确定',
    customClass: 'report-dialog'
  })
}

// 快捷键处理
const handleKeydown = (e: KeyboardEvent) => {
  // Ctrl+Z: 撤销
  if (e.ctrlKey && e.key === 'z') {
    e.preventDefault()
    undo()
  }
  // Ctrl+Y: 重做
  else if (e.ctrlKey && e.key === 'y') {
    e.preventDefault()
    redo()
  }
  // Ctrl+S: 保存模板
  else if (e.ctrlKey && e.key === 's') {
    e.preventDefault()
    saveTemplate()
  }
  // Ctrl+E: 导出
  else if (e.ctrlKey && e.key === 'e') {
    e.preventDefault()
    exportCalibration()
  }
  // 数字键 1-4: 切换工具
  else if (['1', '2', '3', '4'].includes(e.key) && !e.ctrlKey && !e.altKey) {
    const index = parseInt(e.key) - 1
    if (calibrationTools.value[index]) {
      selectTool(calibrationTools.value[index].id)
    }
  }
}

// 生命周期
onMounted(() => {
  // 初始化精度验证
  validatePrecision()

  // 监听快捷键
  window.addEventListener('keydown', handleKeydown)

  // 模拟加载数据
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success('校准模块已就绪')
  }, 1000)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

// 组件状态颜色
const getStatusColor = (status: string) => {
  switch (status) {
    case 'calibrated':
      return 'success'
    case 'error':
      return 'danger'
    default:
      return 'info'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'calibrated':
      return '已校准'
    case 'error':
      return '误差大'
    default:
      return '未校准'
  }
}
</script>

<template>
  <div class="spatial-calibration">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-tag type="primary" size="large">空间位置校准</el-tag>
        <el-tag :type="precisionData.score >= 90 ? 'success' : precisionData.score >= 60 ? 'warning' : 'danger'">
          精度评分: {{ precisionData.score }}分
        </el-tag>
        <el-tag>{{ calibrationStatusText }}</el-tag>
      </div>
      <div class="toolbar-right">
        <el-button :icon="'RefreshLeft'" :disabled="!canUndo" @click="undo" title="撤销 (Ctrl+Z)">撤销</el-button>
        <el-button :icon="'RefreshRight'" :disabled="!canRedo" @click="redo" title="重做 (Ctrl+Y)">重做</el-button>
        <el-button :icon="'Download'" @click="exportCalibration" title="导出 (Ctrl+E)">导出</el-button>
        <el-button type="primary" :icon="'Document'" @click="generateReport">生成报告</el-button>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 左侧：校准工具面板 -->
      <div class="left-panel">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>校准工具</span>
              <el-tag size="small">{{ currentToolInfo?.name }}</el-tag>
            </div>
          </template>

          <div class="tools-list">
            <div
              v-for="(tool, index) in calibrationTools"
              :key="tool.id"
              :class="['tool-item', { active: currentTool === tool.id }]"
              @click="selectTool(tool.id)"
            >
              <div class="tool-icon">
                <el-icon><component :is="tool.icon" /></el-icon>
              </div>
              <div class="tool-info">
                <div class="tool-name">{{ tool.name }} <el-tag size="small" type="info">{{ index + 1 }}</el-tag></div>
                <div class="tool-desc">{{ tool.description }}</div>
              </div>
            </div>
          </div>

          <el-divider />

          <div class="precision-setting">
            <div class="setting-label">校准精度 (mm)</div>
            <el-slider v-model="calibrationPrecision" :min="0.001" :max="1" :step="0.001" :format-tooltip="(val: number) => val.toFixed(3)" />
            <div class="setting-value">{{ calibrationPrecision.toFixed(3) }} mm</div>
          </div>

          <el-divider />

          <div class="action-buttons">
            <el-button type="primary" :loading="loading" @click="applyCalibration" style="width: 100%">
              应用校准
            </el-button>
            <el-button @click="batchCalibrate" :loading="loading" style="width: 100%">
              批量校准
            </el-button>
            <el-button @click="saveTemplate" :icon="'FolderAdd'" style="width: 100%" title="保存模板 (Ctrl+S)">
              保存为模板
            </el-button>
          </div>
        </el-card>

        <!-- 组件列表 -->
        <el-card shadow="hover" style="margin-top: 16px">
          <template #header>
            <span>组件列表</span>
          </template>
          <div class="component-list">
            <div
              v-for="comp in components"
              :key="comp.id"
              :class="['component-item', { active: selectedComponent === comp.id }]"
              @click="selectComponent(comp.id)"
            >
              <div class="component-name">{{ comp.name }}</div>
              <el-tag :type="getStatusColor(comp.status)" size="small">
                {{ getStatusText(comp.status) }}
              </el-tag>
            </div>
          </div>
        </el-card>

        <!-- 校准模板 -->
        <el-card shadow="hover" style="margin-top: 16px">
          <template #header>
            <span>校准模板</span>
          </template>
          <div class="template-list">
            <div
              v-for="template in templates"
              :key="template.id"
              class="template-item"
              @click="applyTemplate(template)"
            >
              <div class="template-name">{{ template.name }}</div>
              <div class="template-desc">{{ template.description }}</div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 中间：三维校准视图 -->
      <div class="center-panel">
        <el-card shadow="hover" style="height: 100%">
          <template #header>
            <div class="card-header">
              <span>三维校准视图</span>
              <div class="view-switcher">
                <el-button
                  v-for="view in viewAngles"
                  :key="view.id"
                  :type="currentView === view.id ? 'primary' : 'default'"
                  size="small"
                  @click="changeView(view.id)"
                >
                  {{ view.name }}
                </el-button>
              </div>
            </div>
          </template>

          <div class="canvas-container" v-loading="loading">
            <!-- 3D视图模拟区域 -->
            <div class="canvas-3d">
              <div class="axis-helper">
                <div class="axis x-axis">X</div>
                <div class="axis y-axis">Y</div>
                <div class="axis z-axis">Z</div>
              </div>

              <div class="grid-helper"></div>

              <!-- 模拟组件显示 -->
              <div
                v-for="comp in components"
                :key="comp.id"
                :class="['mock-component', `status-${comp.status}`, { selected: comp.id === selectedComponent }]"
                :style="{
                  transform: `translate3d(${comp.position.x * 5}px, ${comp.position.y * 5}px, 0)
                             rotateX(${comp.rotation.x}deg)
                             rotateY(${comp.rotation.y}deg)
                             rotateZ(${comp.rotation.z}deg)
                             scale(${comp.scale})`,
                  left: '50%',
                  top: '50%'
                }"
              >
                <div class="component-label">{{ comp.name }}</div>
              </div>

              <!-- 参考线和基准面 -->
              <div class="reference-lines">
                <div class="ref-line horizontal"></div>
                <div class="ref-line vertical"></div>
              </div>
            </div>

            <!-- 视图信息 -->
            <div class="view-info">
              <el-tag>当前视图: {{ viewAngles.find(v => v.id === currentView)?.name }}</el-tag>
              <el-tag type="warning" v-if="precisionData.collision">检测到碰撞</el-tag>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 右侧：参数配置区 -->
      <div class="right-panel">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>位置参数</span>
              <el-button size="small" @click="resetPosition">重置</el-button>
            </div>
          </template>

          <div class="param-config">
            <!-- 位置坐标 -->
            <div class="param-section">
              <div class="section-title">坐标位置</div>

              <div class="param-item">
                <label>X 轴</label>
                <el-input-number
                  v-model="currentPosition.x"
                  :step="0.1"
                  :precision="2"
                  @change="updatePosition"
                  style="width: 100%"
                />
                <el-slider v-model="currentPosition.x" :min="-50" :max="50" :step="0.1" @change="updatePosition" />
              </div>

              <div class="param-item">
                <label>Y 轴</label>
                <el-input-number
                  v-model="currentPosition.y"
                  :step="0.1"
                  :precision="2"
                  @change="updatePosition"
                  style="width: 100%"
                />
                <el-slider v-model="currentPosition.y" :min="-50" :max="50" :step="0.1" @change="updatePosition" />
              </div>

              <div class="param-item">
                <label>Z 轴</label>
                <el-input-number
                  v-model="currentPosition.z"
                  :step="0.1"
                  :precision="2"
                  @change="updatePosition"
                  style="width: 100%"
                />
                <el-slider v-model="currentPosition.z" :min="-50" :max="50" :step="0.1" @change="updatePosition" />
              </div>
            </div>

            <el-divider />

            <!-- 旋转角度 -->
            <div class="param-section">
              <div class="section-title">旋转角度</div>

              <div class="param-item">
                <label>X 轴旋转 (°)</label>
                <el-input-number
                  v-model="currentRotation.x"
                  :step="1"
                  :precision="1"
                  @change="updatePosition"
                  style="width: 100%"
                />
                <el-slider v-model="currentRotation.x" :min="-180" :max="180" @change="updatePosition" />
              </div>

              <div class="param-item">
                <label>Y 轴旋转 (°)</label>
                <el-input-number
                  v-model="currentRotation.y"
                  :step="1"
                  :precision="1"
                  @change="updatePosition"
                  style="width: 100%"
                />
                <el-slider v-model="currentRotation.y" :min="-180" :max="180" @change="updatePosition" />
              </div>

              <div class="param-item">
                <label>Z 轴旋转 (°)</label>
                <el-input-number
                  v-model="currentRotation.z"
                  :step="1"
                  :precision="1"
                  @change="updatePosition"
                  style="width: 100%"
                />
                <el-slider v-model="currentRotation.z" :min="-180" :max="180" @change="updatePosition" />
              </div>
            </div>

            <el-divider />

            <!-- 缩放比例 -->
            <div class="param-section">
              <div class="section-title">缩放比例</div>

              <div class="param-item">
                <label>比例</label>
                <el-input-number
                  v-model="currentScale"
                  :step="0.1"
                  :min="0.1"
                  :max="3"
                  :precision="2"
                  @change="updatePosition"
                  style="width: 100%"
                />
                <el-slider v-model="currentScale" :min="0.1" :max="3" :step="0.1" @change="updatePosition" />
              </div>
            </div>
          </div>
        </el-card>

        <!-- 精度验证 -->
        <el-card shadow="hover" style="margin-top: 16px">
          <template #header>
            <span>精度验证</span>
          </template>

          <div class="precision-validation">
            <el-alert
              :type="precisionData.score >= 90 ? 'success' : precisionData.score >= 60 ? 'warning' : 'error'"
              :closable="false"
              style="margin-bottom: 16px"
            >
              <template #title>
                精度评分: {{ precisionData.score }}分
                <el-progress
                  :percentage="precisionData.score"
                  :status="precisionData.score >= 90 ? 'success' : precisionData.score >= 60 ? 'warning' : 'exception'"
                  style="margin-top: 8px"
                />
              </template>
            </el-alert>

            <div class="validation-item">
              <span class="label">距离偏差:</span>
              <span class="value">{{ precisionData.distance.toFixed(2) }} mm</span>
            </div>

            <div class="validation-item">
              <span class="label">角度偏差:</span>
              <span class="value">{{ precisionData.angle.toFixed(2) }}°</span>
            </div>

            <div class="validation-item">
              <span class="label">碰撞检测:</span>
              <el-tag :type="precisionData.collision ? 'danger' : 'success'" size="small">
                {{ precisionData.collision ? '存在碰撞' : '无碰撞' }}
              </el-tag>
            </div>

            <div class="validation-item">
              <span class="label">间隙分析:</span>
              <span class="value">{{ precisionData.gap.toFixed(2) }} mm</span>
            </div>

            <el-divider />

            <div class="suggestions">
              <div class="section-title">校准建议</div>
              <ul>
                <li v-if="precisionData.score < 60" class="suggestion-error">需要重新校准，当前精度不符合要求</li>
                <li v-if="precisionData.collision" class="suggestion-warning">检测到组件碰撞，请调整位置</li>
                <li v-if="precisionData.gap > 1" class="suggestion-warning">间隙过大，建议优化对齐</li>
                <li v-if="precisionData.score >= 90" class="suggestion-success">校准精度优秀</li>
                <li v-if="precisionData.score >= 60 && precisionData.score < 90" class="suggestion-info">
                  校准精度良好，可进一步优化
                </li>
              </ul>
            </div>
          </div>
        </el-card>

        <!-- 快捷键说明 -->
        <el-card shadow="hover" style="margin-top: 16px">
          <template #header>
            <span>快捷键</span>
          </template>
          <div class="shortcuts">
            <div class="shortcut-item">
              <el-tag size="small">Ctrl+Z</el-tag>
              <span>撤销</span>
            </div>
            <div class="shortcut-item">
              <el-tag size="small">Ctrl+Y</el-tag>
              <span>重做</span>
            </div>
            <div class="shortcut-item">
              <el-tag size="small">Ctrl+S</el-tag>
              <span>保存模板</span>
            </div>
            <div class="shortcut-item">
              <el-tag size="small">Ctrl+E</el-tag>
              <span>导出结果</span>
            </div>
            <div class="shortcut-item">
              <el-tag size="small">1-4</el-tag>
              <span>切换工具</span>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.spatial-calibration {
  height: 100%;
  display: flex;
  flex-direction: column;

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: white;
    border-radius: 8px;
    margin-bottom: 16px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    .toolbar-left,
    .toolbar-right {
      display: flex;
      gap: 12px;
      align-items: center;
    }
  }

  .main-content {
    flex: 1;
    display: flex;
    gap: 16px;
    overflow: hidden;

    .left-panel {
      width: 320px;
      overflow-y: auto;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .tools-list {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .tool-item {
          display: flex;
          align-items: center;
          padding: 12px;
          border: 2px solid #e4e7ed;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;

          &:hover {
            border-color: #409eff;
            background: #ecf5ff;
          }

          &.active {
            border-color: #409eff;
            background: #ecf5ff;
            box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
          }

          .tool-icon {
            font-size: 32px;
            margin-right: 12px;
            color: #409eff;
          }

          .tool-info {
            flex: 1;

            .tool-name {
              font-weight: bold;
              margin-bottom: 4px;
              display: flex;
              align-items: center;
              gap: 8px;
            }

            .tool-desc {
              font-size: 12px;
              color: #909399;
            }
          }
        }
      }

      .precision-setting {
        .setting-label {
          font-weight: bold;
          margin-bottom: 8px;
        }

        .setting-value {
          text-align: center;
          color: #409eff;
          font-weight: bold;
          margin-top: 8px;
        }
      }

      .action-buttons {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .component-list,
      .template-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .component-item,
      .template-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        border: 1px solid #e4e7ed;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          background: #f5f7fa;
          border-color: #409eff;
        }

        &.active {
          background: #ecf5ff;
          border-color: #409eff;
        }

        .component-name,
        .template-name {
          font-weight: bold;
        }

        .template-desc {
          font-size: 12px;
          color: #909399;
          margin-top: 4px;
        }
      }

      .template-item {
        flex-direction: column;
        align-items: flex-start;
      }
    }

    .center-panel {
      flex: 1;
      overflow: hidden;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .view-switcher {
          display: flex;
          gap: 8px;
        }
      }

      .canvas-container {
        height: calc(100vh - 280px);
        position: relative;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 8px;
        overflow: hidden;

        .canvas-3d {
          width: 100%;
          height: 100%;
          position: relative;
          perspective: 1000px;

          .axis-helper {
            position: absolute;
            top: 20px;
            left: 20px;
            z-index: 10;

            .axis {
              font-weight: bold;
              font-size: 14px;
              margin: 4px 0;
              padding: 4px 8px;
              border-radius: 4px;

              &.x-axis {
                color: #f56c6c;
                background: rgba(245, 108, 108, 0.2);
              }

              &.y-axis {
                color: #67c23a;
                background: rgba(103, 194, 58, 0.2);
              }

              &.z-axis {
                color: #409eff;
                background: rgba(64, 158, 255, 0.2);
              }
            }
          }

          .grid-helper {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80%;
            height: 80%;
            background-image:
              repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.1) 0px, rgba(255, 255, 255, 0.1) 1px, transparent 1px, transparent 40px),
              repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.1) 0px, rgba(255, 255, 255, 0.1) 1px, transparent 1px, transparent 40px);
          }

          .mock-component {
            position: absolute;
            width: 80px;
            height: 80px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s;
            transform-style: preserve-3d;

            &.status-calibrated {
              background: rgba(103, 194, 58, 0.8);
              border: 3px solid #67c23a;
            }

            &.status-uncalibrated {
              background: rgba(144, 147, 153, 0.8);
              border: 3px solid #909399;
            }

            &.status-error {
              background: rgba(245, 108, 108, 0.8);
              border: 3px solid #f56c6c;
            }

            &.selected {
              box-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
              transform: scale(1.1);
            }

            .component-label {
              color: white;
              font-weight: bold;
              text-align: center;
              font-size: 12px;
            }
          }

          .reference-lines {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;

            .ref-line {
              position: absolute;
              background: rgba(255, 255, 255, 0.3);

              &.horizontal {
                top: 50%;
                left: 0;
                width: 100%;
                height: 2px;
              }

              &.vertical {
                top: 0;
                left: 50%;
                width: 2px;
                height: 100%;
              }
            }
          }
        }

        .view-info {
          position: absolute;
          bottom: 20px;
          left: 20px;
          display: flex;
          gap: 8px;
        }
      }
    }

    .right-panel {
      width: 360px;
      overflow-y: auto;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .param-config {
        .param-section {
          .section-title {
            font-weight: bold;
            margin-bottom: 16px;
            color: #303133;
          }

          .param-item {
            margin-bottom: 20px;

            label {
              display: block;
              margin-bottom: 8px;
              font-weight: 500;
              color: #606266;
            }

            :deep(.el-slider) {
              margin-top: 12px;
            }
          }
        }
      }

      .precision-validation {
        .validation-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #f0f0f0;

          .label {
            font-weight: 500;
            color: #606266;
          }

          .value {
            font-weight: bold;
            color: #409eff;
          }
        }

        .suggestions {
          .section-title {
            font-weight: bold;
            margin-bottom: 12px;
          }

          ul {
            list-style: none;
            padding: 0;
            margin: 0;

            li {
              padding: 8px 12px;
              margin-bottom: 8px;
              border-radius: 4px;
              font-size: 13px;

              &.suggestion-error {
                background: #fef0f0;
                color: #f56c6c;
                border-left: 3px solid #f56c6c;
              }

              &.suggestion-warning {
                background: #fdf6ec;
                color: #e6a23c;
                border-left: 3px solid #e6a23c;
              }

              &.suggestion-success {
                background: #f0f9ff;
                color: #67c23a;
                border-left: 3px solid #67c23a;
              }

              &.suggestion-info {
                background: #ecf5ff;
                color: #409eff;
                border-left: 3px solid #409eff;
              }
            }
          }
        }
      }

      .shortcuts {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .shortcut-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 0;

          span {
            color: #606266;
          }
        }
      }
    }
  }
}

// 滚动条样式
:deep(.left-panel),
:deep(.right-panel) {
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #dcdfe6;
    border-radius: 3px;

    &:hover {
      background: #c0c4cc;
    }
  }
}
</style>
