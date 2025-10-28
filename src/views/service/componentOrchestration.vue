<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElNotification, ElMessageBox } from 'element-plus'

// ==================== 类型定义 ====================
interface Position {
  x: number
  y: number
}

interface ComponentTemplate {
  id: string
  name: string
  version: string
  icon: string
  category: string
  description: string
  tags: string[]
  status: 'available' | 'maintenance' | 'deprecated'
  isFavorite: boolean
  useCount: number
  config: Record<string, any>
}

interface CanvasComponent {
  id: string
  templateId: string
  name: string
  icon: string
  position: Position
  config: Record<string, any>
  zIndex: number
}

interface Connection {
  id: string
  from: string
  to: string
  fromPort?: string
  toPort?: string
  type: 'curve' | 'line'
}

interface ConfigTemplate {
  id: string
  name: string
  config: Record<string, any>
}

// ==================== 状态管理 ====================
const canvasContainer = ref<HTMLElement>()

// 画布状态
const canvasState = reactive({
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  isDragging: false,
  showGrid: true,
  gridSize: 20,
  snapToGrid: true,
})

// 组件库状态
const componentLibrary = ref<ComponentTemplate[]>([])
const selectedCategory = ref('all')
const searchKeyword = ref('')
const showOnlyFavorites = ref(false)

// 画布组件
const canvasComponents = ref<CanvasComponent[]>([])
const connections = ref<Connection[]>([])
const selectedComponents = ref<Set<string>>(new Set())
const hoveredComponent = ref<string | null>(null)

// 拖拽状态
const dragState = reactive({
  isDragging: false,
  draggedTemplate: null as ComponentTemplate | null,
  draggedComponent: null as CanvasComponent | null,
  startPos: { x: 0, y: 0 },
  currentPos: { x: 0, y: 0 },
  showGuideLines: false,
  guideLines: {
    vertical: [] as number[],
    horizontal: [] as number[],
  },
})

// 连线状态
const connectionState = reactive({
  isConnecting: false,
  fromComponent: null as string | null,
  startPos: { x: 0, y: 0 },
  currentPos: { x: 0, y: 0 },
  connectionType: 'curve' as 'curve' | 'line',
})

// 选中组件属性
const selectedComponent = ref<CanvasComponent | null>(null)
const configTemplates = ref<ConfigTemplate[]>([])

// 历史记录
const history = reactive({
  past: [] as { components: CanvasComponent[]; connections: Connection[] }[],
  future: [] as { components: CanvasComponent[]; connections: Connection[] }[],
  maxHistory: 50,
})

// UI 状态
const uiState = reactive({
  leftPanelWidth: 300,
  rightPanelWidth: 350,
  showComponentLibrary: true,
  showPropertyPanel: true,
  showPreview: false,
  currentTab: 'config',
})

// 草稿自动保存
const draftState = reactive({
  lastSaved: null as Date | null,
  autoSaveInterval: 30000, // 30秒
  isDirty: false,
})

// ==================== Mock 数据 ====================
const componentCategories = [
  { id: 'all', name: '全部组件', icon: 'Grid', count: 0 },
  { id: 'datasource', name: '数据源', icon: 'Coin', count: 0 },
  { id: 'process', name: '数据处理', icon: 'Operation', count: 0 },
  { id: 'transform', name: '数据转换', icon: 'Refresh', count: 0 },
  { id: 'output', name: '数据输出', icon: 'Upload', count: 0 },
  { id: 'analytics', name: '数据分析', icon: 'DataAnalysis', count: 0 },
]

// 加载组件库
const loadComponentLibrary = async () => {
  await new Promise(resolve => setTimeout(resolve, 500))

  componentLibrary.value = [
    {
      id: 'mysql_source',
      name: 'MySQL数据源',
      version: '2.1.0',
      icon: 'Coin',
      category: 'datasource',
      description: '连接MySQL数据库读取数据',
      tags: ['数据库', 'MySQL', 'SQL'],
      status: 'available',
      isFavorite: false,
      useCount: 156,
      config: {
        host: '',
        port: 3306,
        database: '',
        username: '',
        password: '',
        query: '',
      },
    },
    {
      id: 'rest_api_source',
      name: 'REST API',
      version: '1.8.2',
      icon: 'Link',
      category: 'datasource',
      description: '通过REST API获取数据',
      tags: ['API', 'HTTP', 'REST'],
      status: 'available',
      isFavorite: true,
      useCount: 289,
      config: {
        url: '',
        method: 'GET',
        headers: {},
        timeout: 30000,
      },
    },
    {
      id: 'csv_source',
      name: 'CSV文件',
      version: '1.5.0',
      icon: 'Document',
      category: 'datasource',
      description: '读取CSV格式文件',
      tags: ['文件', 'CSV'],
      status: 'available',
      isFavorite: false,
      useCount: 98,
      config: {
        filePath: '',
        delimiter: ',',
        encoding: 'utf-8',
        hasHeader: true,
      },
    },
    {
      id: 'kafka_source',
      name: 'Kafka消息队列',
      version: '3.0.1',
      icon: 'Message',
      category: 'datasource',
      description: '从Kafka读取实时数据流',
      tags: ['消息队列', 'Kafka', '流式'],
      status: 'available',
      isFavorite: true,
      useCount: 67,
      config: {
        brokers: '',
        topic: '',
        groupId: '',
        autoCommit: true,
      },
    },
    {
      id: 'filter_processor',
      name: '数据过滤',
      version: '2.3.0',
      icon: 'Filter',
      category: 'process',
      description: '根据条件过滤数据行',
      tags: ['过滤', '条件'],
      status: 'available',
      isFavorite: false,
      useCount: 234,
      config: {
        expression: '',
        filterType: 'include',
      },
    },
    {
      id: 'aggregate_processor',
      name: '数据聚合',
      version: '2.0.5',
      icon: 'DataAnalysis',
      category: 'process',
      description: '对数据进行分组聚合计算',
      tags: ['聚合', '分组', '统计'],
      status: 'available',
      isFavorite: true,
      useCount: 187,
      config: {
        groupBy: [],
        aggregations: [],
      },
    },
    {
      id: 'join_processor',
      name: '数据关联',
      version: '1.9.0',
      icon: 'Connection',
      category: 'process',
      description: '关联多个数据集',
      tags: ['关联', 'JOIN'],
      status: 'available',
      isFavorite: false,
      useCount: 145,
      config: {
        joinType: 'inner',
        leftKey: '',
        rightKey: '',
      },
    },
    {
      id: 'sort_processor',
      name: '数据排序',
      version: '1.6.0',
      icon: 'Sort',
      category: 'process',
      description: '对数据进行排序',
      tags: ['排序'],
      status: 'available',
      isFavorite: false,
      useCount: 78,
      config: {
        sortFields: [],
        order: 'asc',
      },
    },
    {
      id: 'map_transformer',
      name: '字段映射',
      version: '2.2.0',
      icon: 'Sort',
      category: 'transform',
      description: '转换字段名称和结构',
      tags: ['映射', '转换'],
      status: 'available',
      isFavorite: false,
      useCount: 201,
      config: {
        mappings: [],
      },
    },
    {
      id: 'calculate_transformer',
      name: '计算字段',
      version: '1.7.3',
      icon: 'Histogram',
      category: 'transform',
      description: '添加计算字段',
      tags: ['计算', '公式'],
      status: 'available',
      isFavorite: true,
      useCount: 156,
      config: {
        formula: '',
        outputField: '',
      },
    },
    {
      id: 'format_transformer',
      name: '格式转换',
      version: '1.4.0',
      icon: 'Refresh',
      category: 'transform',
      description: '转换数据格式',
      tags: ['格式', '类型转换'],
      status: 'available',
      isFavorite: false,
      useCount: 89,
      config: {
        sourceFormat: 'json',
        targetFormat: 'xml',
      },
    },
    {
      id: 'mysql_output',
      name: 'MySQL输出',
      version: '2.1.0',
      icon: 'Coin',
      category: 'output',
      description: '写入数据到MySQL',
      tags: ['数据库', 'MySQL', '输出'],
      status: 'available',
      isFavorite: false,
      useCount: 134,
      config: {
        host: '',
        port: 3306,
        database: '',
        table: '',
        writeMode: 'insert',
      },
    },
    {
      id: 'api_output',
      name: 'API输出',
      version: '1.5.0',
      icon: 'Position',
      category: 'output',
      description: '发送数据到API接口',
      tags: ['API', 'HTTP'],
      status: 'available',
      isFavorite: true,
      useCount: 167,
      config: {
        url: '',
        method: 'POST',
        headers: {},
      },
    },
    {
      id: 'file_output',
      name: '文件输出',
      version: '1.3.0',
      icon: 'Folder',
      category: 'output',
      description: '导出数据到文件',
      tags: ['文件', '导出'],
      status: 'available',
      isFavorite: false,
      useCount: 92,
      config: {
        filePath: '',
        fileType: 'csv',
        encoding: 'utf-8',
      },
    },
    {
      id: 'chart_analytics',
      name: '图表分析',
      version: '2.0.0',
      icon: 'TrendCharts',
      category: 'analytics',
      description: '生成数据分析图表',
      tags: ['图表', '可视化'],
      status: 'available',
      isFavorite: true,
      useCount: 112,
      config: {
        chartType: 'bar',
        xAxis: '',
        yAxis: '',
      },
    },
    {
      id: 'statistics_analytics',
      name: '统计分析',
      version: '1.8.0',
      icon: 'DataLine',
      category: 'analytics',
      description: '进行统计分析计算',
      tags: ['统计', '分析'],
      status: 'available',
      isFavorite: false,
      useCount: 67,
      config: {
        metrics: [],
        dimensions: [],
      },
    },
    {
      id: 'legacy_processor',
      name: '旧版处理器',
      version: '0.9.0',
      icon: 'Warning',
      category: 'process',
      description: '即将废弃的处理器',
      tags: ['已废弃'],
      status: 'deprecated',
      isFavorite: false,
      useCount: 12,
      config: {},
    },
  ]

  // 更新分类计数
  updateCategoryCounts()
}

// 更新分类计数
const updateCategoryCounts = () => {
  componentCategories.forEach(cat => {
    if (cat.id === 'all') {
      cat.count = componentLibrary.value.length
    } else {
      cat.count = componentLibrary.value.filter(c => c.category === cat.id).length
    }
  })
}

// ==================== 计算属性 ====================
const filteredComponents = computed(() => {
  let filtered = componentLibrary.value

  // 分类过滤
  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(c => c.category === selectedCategory.value)
  }

  // 收藏过滤
  if (showOnlyFavorites.value) {
    filtered = filtered.filter(c => c.isFavorite)
  }

  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(
      c =>
        c.name.toLowerCase().includes(keyword) ||
        c.description.toLowerCase().includes(keyword) ||
        c.tags.some(t => t.toLowerCase().includes(keyword))
    )
  }

  // 按使用次数和收藏状态排序
  return filtered.sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1
    if (!a.isFavorite && b.isFavorite) return 1
    return b.useCount - a.useCount
  })
})

const canUndo = computed(() => history.past.length > 0)
const canRedo = computed(() => history.future.length > 0)

const canvasStyle = computed(() => ({
  transform: `translate(${canvasState.offsetX}px, ${canvasState.offsetY}px) scale(${canvasState.scale})`,
  transformOrigin: '0 0',
}))

// ==================== 核心功能 ====================

// 保存历史记录
const saveHistory = () => {
  history.past.push({
    components: JSON.parse(JSON.stringify(canvasComponents.value)),
    connections: JSON.parse(JSON.stringify(connections.value)),
  })
  history.future = []

  if (history.past.length > history.maxHistory) {
    history.past.shift()
  }

  draftState.isDirty = true
}

// 撤销
const undo = () => {
  if (!canUndo.value) return

  const current = {
    components: JSON.parse(JSON.stringify(canvasComponents.value)),
    connections: JSON.parse(JSON.stringify(connections.value)),
  }
  history.future.push(current)

  const previous = history.past.pop()!
  canvasComponents.value = previous.components
  connections.value = previous.connections
}

// 重做
const redo = () => {
  if (!canRedo.value) return

  const current = {
    components: JSON.parse(JSON.stringify(canvasComponents.value)),
    connections: JSON.parse(JSON.stringify(connections.value)),
  }
  history.past.push(current)

  const next = history.future.pop()!
  canvasComponents.value = next.components
  connections.value = next.connections
}

// 切换收藏
const toggleFavorite = (component: ComponentTemplate) => {
  component.isFavorite = !component.isFavorite
  ElMessage.success(component.isFavorite ? '已添加到收藏' : '已取消收藏')
}

// 组件拖拽开始
const onComponentDragStart = (e: DragEvent, template: ComponentTemplate) => {
  if (template.status === 'deprecated') {
    e.preventDefault()
    ElMessage.warning('该组件已废弃，无法使用')
    return
  }

  dragState.draggedTemplate = template
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'copy'
  }
}

// 画布拖放
const onCanvasDrop = (e: DragEvent) => {
  e.preventDefault()

  if (!dragState.draggedTemplate || !canvasContainer.value) return

  const rect = canvasContainer.value.getBoundingClientRect()
  let x = (e.clientX - rect.left - canvasState.offsetX) / canvasState.scale
  let y = (e.clientY - rect.top - canvasState.offsetY) / canvasState.scale

  // 吸附到网格
  if (canvasState.snapToGrid) {
    x = Math.round(x / canvasState.gridSize) * canvasState.gridSize
    y = Math.round(y / canvasState.gridSize) * canvasState.gridSize
  }

  addComponentToCanvas(dragState.draggedTemplate, { x, y })
  dragState.draggedTemplate = null
}

const onCanvasDragOver = (e: DragEvent) => {
  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'copy'
  }
}

// 添加组件到画布
const addComponentToCanvas = (template: ComponentTemplate, position: Position) => {
  const maxZIndex = canvasComponents.value.length > 0
    ? Math.max(...canvasComponents.value.map(c => c.zIndex))
    : 0

  const newComponent: CanvasComponent = {
    id: `component_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    templateId: template.id,
    name: template.name,
    icon: template.icon,
    position: { ...position },
    config: JSON.parse(JSON.stringify(template.config)),
    zIndex: maxZIndex + 1,
  }

  saveHistory()
  canvasComponents.value.push(newComponent)
  selectedComponent.value = newComponent
  selectedComponents.value.clear()
  selectedComponents.value.add(newComponent.id)

  // 增加使用次数
  template.useCount++

  ElMessage.success(`已添加 ${template.name}`)
}

// 画布组件拖拽
const onCanvasComponentMouseDown = (e: MouseEvent, component: CanvasComponent) => {
  if (e.button !== 0) return

  e.stopPropagation()

  // 多选逻辑
  if (e.ctrlKey || e.metaKey) {
    if (selectedComponents.value.has(component.id)) {
      selectedComponents.value.delete(component.id)
    } else {
      selectedComponents.value.add(component.id)
    }
  } else {
    if (!selectedComponents.value.has(component.id)) {
      selectedComponents.value.clear()
      selectedComponents.value.add(component.id)
    }
  }

  selectedComponent.value = component

  dragState.isDragging = true
  dragState.draggedComponent = component
  dragState.startPos = {
    x: e.clientX / canvasState.scale - component.position.x,
    y: e.clientY / canvasState.scale - component.position.y,
  }

  // 计算对齐参考线
  calculateGuideLines(component)
}

// 计算对齐参考线
const calculateGuideLines = (draggedComponent: CanvasComponent) => {
  const verticalLines: number[] = []
  const horizontalLines: number[] = []

  canvasComponents.value.forEach(comp => {
    if (comp.id === draggedComponent.id) return

    // 垂直对齐线
    verticalLines.push(comp.position.x)
    verticalLines.push(comp.position.x + 100) // 假设组件宽度100

    // 水平对齐线
    horizontalLines.push(comp.position.y)
    horizontalLines.push(comp.position.y + 60) // 假设组件高度60
  })

  dragState.guideLines.vertical = Array.from(new Set(verticalLines))
  dragState.guideLines.horizontal = Array.from(new Set(horizontalLines))
}

// 鼠标移动
const onCanvasMouseMove = (e: MouseEvent) => {
  if (dragState.isDragging && dragState.draggedComponent) {
    let newX = e.clientX / canvasState.scale - dragState.startPos.x
    let newY = e.clientY / canvasState.scale - dragState.startPos.y

    // 检查对齐
    const snapThreshold = 5
    dragState.showGuideLines = false

    // 垂直对齐
    for (const lineX of dragState.guideLines.vertical) {
      if (Math.abs(newX - lineX) < snapThreshold) {
        newX = lineX
        dragState.showGuideLines = true
        break
      }
    }

    // 水平对齐
    for (const lineY of dragState.guideLines.horizontal) {
      if (Math.abs(newY - lineY) < snapThreshold) {
        newY = lineY
        dragState.showGuideLines = true
        break
      }
    }

    // 网格吸附
    if (canvasState.snapToGrid) {
      newX = Math.round(newX / canvasState.gridSize) * canvasState.gridSize
      newY = Math.round(newY / canvasState.gridSize) * canvasState.gridSize
    }

    const deltaX = newX - dragState.draggedComponent.position.x
    const deltaY = newY - dragState.draggedComponent.position.y

    // 移动所有选中的组件
    selectedComponents.value.forEach(id => {
      const comp = canvasComponents.value.find(c => c.id === id)
      if (comp) {
        comp.position.x += deltaX
        comp.position.y += deltaY
      }
    })
  }

  if (connectionState.isConnecting && canvasContainer.value) {
    const rect = canvasContainer.value.getBoundingClientRect()
    connectionState.currentPos = {
      x: (e.clientX - rect.left - canvasState.offsetX) / canvasState.scale,
      y: (e.clientY - rect.top - canvasState.offsetY) / canvasState.scale,
    }
  }

  if (canvasState.isDragging) {
    canvasState.offsetX += e.movementX
    canvasState.offsetY += e.movementY
  }
}

// 鼠标释放
const onCanvasMouseUp = () => {
  if (dragState.isDragging && dragState.draggedComponent) {
    saveHistory()
  }

  dragState.isDragging = false
  dragState.draggedComponent = null
  dragState.showGuideLines = false
  canvasState.isDragging = false

  if (connectionState.isConnecting) {
    connectionState.isConnecting = false
    connectionState.fromComponent = null
  }
}

// 开始连线
const startConnection = (component: CanvasComponent) => {
  connectionState.isConnecting = true
  connectionState.fromComponent = component.id
  connectionState.startPos = {
    x: component.position.x + 100,
    y: component.position.y + 30,
  }
  connectionState.currentPos = { ...connectionState.startPos }
}

// 完成连线
const finishConnection = (toComponent: CanvasComponent) => {
  if (!connectionState.fromComponent || connectionState.fromComponent === toComponent.id) {
    return
  }

  // 检查是否已存在连线
  const exists = connections.value.some(
    c => c.from === connectionState.fromComponent && c.to === toComponent.id
  )

  if (exists) {
    ElMessage.warning('该连线已存在')
    return
  }

  saveHistory()
  const newConnection: Connection = {
    id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    from: connectionState.fromComponent!,
    to: toComponent.id,
    type: connectionState.connectionType,
  }

  connections.value.push(newConnection)
  ElMessage.success('连线创建成功')

  connectionState.isConnecting = false
  connectionState.fromComponent = null
}

// 删除组件
const deleteComponent = (componentId: string) => {
  saveHistory()
  canvasComponents.value = canvasComponents.value.filter(c => c.id !== componentId)
  connections.value = connections.value.filter(
    c => c.from !== componentId && c.to !== componentId
  )
  selectedComponents.value.delete(componentId)
  if (selectedComponent.value?.id === componentId) {
    selectedComponent.value = null
  }
}

// 删除选中的组件
const deleteSelectedComponents = () => {
  if (selectedComponents.value.size === 0) return

  saveHistory()
  selectedComponents.value.forEach(id => {
    canvasComponents.value = canvasComponents.value.filter(c => c.id !== id)
    connections.value = connections.value.filter(c => c.from !== id && c.to !== id)
  })

  selectedComponents.value.clear()
  selectedComponent.value = null
  ElMessage.success('已删除选中的组件')
}

// 复制组件
const copyComponent = (component: CanvasComponent) => {
  const newComponent: CanvasComponent = {
    ...JSON.parse(JSON.stringify(component)),
    id: `component_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    position: {
      x: component.position.x + 30,
      y: component.position.y + 30,
    },
  }

  saveHistory()
  canvasComponents.value.push(newComponent)
  ElMessage.success('组件已复制')
}

// 删除连线
const deleteConnection = (connId: string) => {
  saveHistory()
  connections.value = connections.value.filter(c => c.id !== connId)
}

// 画布缩放
const onCanvasWheel = (e: WheelEvent) => {
  e.preventDefault()
  const delta = e.deltaY > 0 ? 0.9 : 1.1
  const newScale = Math.max(0.3, Math.min(2, canvasState.scale * delta))

  if (canvasContainer.value) {
    const rect = canvasContainer.value.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    canvasState.offsetX = mouseX - (mouseX - canvasState.offsetX) * (newScale / canvasState.scale)
    canvasState.offsetY = mouseY - (mouseY - canvasState.offsetY) * (newScale / canvasState.scale)
  }

  canvasState.scale = newScale
}

// 画布拖拽
const onCanvasMouseDown = (e: MouseEvent) => {
  if (e.button === 1 || (e.button === 0 && e.target === canvasContainer.value)) {
    canvasState.isDragging = true
    selectedComponent.value = null
    selectedComponents.value.clear()
  }
}

// 获取连线路径
const getConnectionPath = (conn: Connection) => {
  const fromComp = canvasComponents.value.find(c => c.id === conn.from)
  const toComp = canvasComponents.value.find(c => c.id === conn.to)

  if (!fromComp || !toComp) return ''

  const x1 = fromComp.position.x + 100
  const y1 = fromComp.position.y + 30
  const x2 = toComp.position.x
  const y2 = toComp.position.y + 30

  if (conn.type === 'curve') {
    const dx = x2 - x1
    const cx1 = x1 + Math.abs(dx) * 0.5
    const cx2 = x2 - Math.abs(dx) * 0.5
    return `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`
  } else {
    return `M ${x1} ${y1} L ${x2} ${y2}`
  }
}

// 一键整理布局
const autoLayout = () => {
  if (canvasComponents.value.length === 0) return

  saveHistory()

  // 简单的网格布局
  const cols = Math.ceil(Math.sqrt(canvasComponents.value.length))
  const spacing = 150

  canvasComponents.value.forEach((comp, index) => {
    const row = Math.floor(index / cols)
    const col = index % cols
    comp.position.x = col * spacing + 50
    comp.position.y = row * 120 + 50
  })

  ElMessage.success('布局已优化')
}

// 验证编排
const validateOrchestration = () => {
  const errors: string[] = []

  if (canvasComponents.value.length === 0) {
    errors.push('画布中没有任何组件')
  }

  // 检查孤立组件
  const connectedComponents = new Set<string>()
  connections.value.forEach(c => {
    connectedComponents.add(c.from)
    connectedComponents.add(c.to)
  })

  const isolatedCount = canvasComponents.value.filter(
    c => !connectedComponents.has(c.id)
  ).length

  if (isolatedCount > 0) {
    errors.push(`存在 ${isolatedCount} 个未连接的组件`)
  }

  // 检查配置完整性
  const incompleteComponents = canvasComponents.value.filter(comp => {
    const template = componentLibrary.value.find(t => t.id === comp.templateId)
    if (!template) return false

    // 检查必填字段
    return Object.keys(template.config).some(key => {
      const value = comp.config[key]
      return value === '' || value === null || value === undefined
    })
  })

  if (incompleteComponents.length > 0) {
    errors.push(`${incompleteComponents.length} 个组件配置不完整`)
  }

  if (errors.length > 0) {
    ElNotification({
      title: '编排验证失败',
      message: errors.join('\n'),
      type: 'warning',
      duration: 5000,
    })
    return false
  } else {
    ElNotification({
      title: '验证成功',
      message: '编排配置正确',
      type: 'success',
    })
    return true
  }
}

// 生成JSON配置
const generateConfig = () => {
  if (!validateOrchestration()) return

  const config = {
    version: '1.0',
    components: canvasComponents.value,
    connections: connections.value,
    metadata: {
      createdAt: new Date().toISOString(),
      componentCount: canvasComponents.value.length,
      connectionCount: connections.value.length,
    },
  }

  console.log('Generated Config:', config)
  ElMessage.success('配置已生成，请查看控制台')
  return config
}

// 导出配置
const exportConfig = () => {
  const config = generateConfig()
  if (!config) return

  const blob = new Blob([JSON.stringify(config, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `orchestration_${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)

  ElMessage.success('配置已导出')
}

// 导入配置
const importConfig = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e: any) => {
    const file = e.target?.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        saveHistory()
        canvasComponents.value = data.components || []
        connections.value = data.connections || []
        ElMessage.success('配置导入成功')
      } catch (err) {
        ElMessage.error('配置文件格式错误')
      }
    }
    reader.readAsText(file)
  }
  input.click()
}

// 保存编排
const saveOrchestration = async () => {
  await new Promise(resolve => setTimeout(resolve, 500))

  draftState.lastSaved = new Date()
  draftState.isDirty = false

  ElNotification({
    title: '保存成功',
    message: '编排方案已保存',
    type: 'success',
  })
}

// 自动保存草稿
const autoSaveDraft = () => {
  if (draftState.isDirty) {
    draftState.lastSaved = new Date()
    draftState.isDirty = false
    console.log('Auto-saved draft at', draftState.lastSaved)
  }
}

// 清空画布
const clearCanvas = async () => {
  try {
    await ElMessageBox.confirm('确定要清空画布吗？此操作不可恢复。', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    saveHistory()
    canvasComponents.value = []
    connections.value = []
    selectedComponent.value = null
    selectedComponents.value.clear()

    ElMessage.success('画布已清空')
  } catch {
    // 用户取消
  }
}

// ==================== 生命周期 ====================
onMounted(async () => {
  await loadComponentLibrary()

  // 添加全局事件监听
  document.addEventListener('mousemove', onCanvasMouseMove)
  document.addEventListener('mouseup', onCanvasMouseUp)

  // 启动自动保存
  setInterval(autoSaveDraft, draftState.autoSaveInterval)

  // 添加示例组件（演示用）
  setTimeout(() => {
    const restApi = componentLibrary.value.find(t => t.id === 'rest_api_source')
    const filter = componentLibrary.value.find(t => t.id === 'filter_processor')
    const output = componentLibrary.value.find(t => t.id === 'api_output')

    if (restApi) addComponentToCanvas(restApi, { x: 80, y: 100 })
    if (filter) addComponentToCanvas(filter, { x: 300, y: 100 })
    if (output) addComponentToCanvas(output, { x: 520, y: 100 })
  }, 800)
})

// 键盘快捷键
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key) {
      case 'z':
        e.preventDefault()
        undo()
        break
      case 'y':
        e.preventDefault()
        redo()
        break
      case 's':
        e.preventDefault()
        saveOrchestration()
        break
      case 'a':
        e.preventDefault()
        selectedComponents.value = new Set(canvasComponents.value.map(c => c.id))
        break
    }
  } else if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault()
    deleteSelectedComponents()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="component-orchestration">
    <!-- 顶部工具栏 -->
    <el-header class="toolbar" height="60px">
      <div class="toolbar-left">
        <h2 class="title">
          <el-icon><Grid /></el-icon>
          组件编排设计器
        </h2>
      </div>

      <div class="toolbar-center">
        <el-button-group>
          <el-button :icon="'Back'" @click="undo" :disabled="!canUndo" title="撤销 (Ctrl+Z)">
            撤销
          </el-button>
          <el-button :icon="'Right'" @click="redo" :disabled="!canRedo" title="重做 (Ctrl+Y)">
            重做
          </el-button>
        </el-button-group>

        <el-divider direction="vertical" />

        <el-button-group>
          <el-button :icon="'DocumentAdd'" @click="importConfig">导入</el-button>
          <el-button :icon="'Download'" @click="exportConfig">导出</el-button>
          <el-button :icon="'Select'" @click="validateOrchestration">验证</el-button>
          <el-button :icon="'Connection'" @click="autoLayout">整理布局</el-button>
        </el-button-group>

        <el-divider direction="vertical" />

        <el-button type="primary" :icon="'Document'" @click="generateConfig">
          生成配置
        </el-button>
        <el-button type="success" :icon="'Check'" @click="saveOrchestration">
          保存编排
        </el-button>
      </div>

      <div class="toolbar-right">
        <el-tag v-if="draftState.lastSaved" size="small" type="info">
          已保存: {{ draftState.lastSaved.toLocaleTimeString() }}
        </el-tag>
        <el-button :icon="'Delete'" @click="clearCanvas" text type="danger">清空</el-button>
      </div>
    </el-header>

    <!-- 主体内容 -->
    <el-container class="main-container">
      <!-- 左侧组件库 -->
      <el-aside
        v-show="uiState.showComponentLibrary"
        :width="`${uiState.leftPanelWidth}px`"
        class="component-library"
      >
        <el-card shadow="never" :body-style="{ padding: '16px', height: '100%' }">
          <template #header>
            <div class="card-header">
              <span>组件库</span>
              <el-button :icon="'Close'" text @click="uiState.showComponentLibrary = false" />
            </div>
          </template>

          <!-- 搜索和过滤 -->
          <div class="library-filters">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索组件..."
              :prefix-icon="'Search'"
              clearable
              style="margin-bottom: 12px"
            />

            <div class="filter-options">
              <el-checkbox v-model="showOnlyFavorites" label="只看收藏" />
            </div>
          </div>

          <el-divider />

          <!-- 分类标签 -->
          <div class="category-list">
            <div
              v-for="category in componentCategories"
              :key="category.id"
              class="category-item"
              :class="{ active: selectedCategory === category.id }"
              @click="selectedCategory = category.id"
            >
              <el-icon><component :is="category.icon" /></el-icon>
              <span>{{ category.name }}</span>
              <el-tag size="small" round>{{ category.count }}</el-tag>
            </div>
          </div>

          <el-divider />

          <!-- 组件列表 -->
          <div class="component-list">
            <div
              v-for="component in filteredComponents"
              :key="component.id"
              class="component-card"
              :class="{ deprecated: component.status === 'deprecated' }"
              draggable="true"
              @dragstart="onComponentDragStart($event, component)"
            >
              <div class="component-header">
                <el-icon :size="24" class="component-icon">
                  <component :is="component.icon" />
                </el-icon>
                <el-button
                  :icon="component.isFavorite ? 'StarFilled' : 'Star'"
                  :type="component.isFavorite ? 'warning' : ''"
                  text
                  circle
                  size="small"
                  @click.stop="toggleFavorite(component)"
                />
              </div>

              <div class="component-info">
                <div class="component-name">{{ component.name }}</div>
                <div class="component-version">v{{ component.version }}</div>
                <div class="component-desc">{{ component.description }}</div>

                <div class="component-tags">
                  <el-tag
                    v-for="tag in component.tags.slice(0, 2)"
                    :key="tag"
                    size="small"
                    effect="plain"
                  >
                    {{ tag }}
                  </el-tag>
                </div>

                <div class="component-footer">
                  <el-tag
                    v-if="component.status === 'maintenance'"
                    size="small"
                    type="warning"
                  >
                    维护中
                  </el-tag>
                  <el-tag
                    v-if="component.status === 'deprecated'"
                    size="small"
                    type="danger"
                  >
                    已废弃
                  </el-tag>
                  <span class="use-count">
                    <el-icon><User /></el-icon>
                    {{ component.useCount }}
                  </span>
                </div>
              </div>
            </div>

            <el-empty
              v-if="filteredComponents.length === 0"
              description="没有找到组件"
              :image-size="100"
            />
          </div>
        </el-card>
      </el-aside>

      <!-- 中央画布 -->
      <el-main class="canvas-area">
        <!-- 画布工具栏 -->
        <div class="canvas-toolbar">
          <el-button-group size="small">
            <el-button @click="canvasState.scale = 1">
              {{ Math.round(canvasState.scale * 100) }}%
            </el-button>
            <el-button
              :icon="'ZoomIn'"
              @click="canvasState.scale = Math.min(2, canvasState.scale * 1.2)"
            />
            <el-button
              :icon="'ZoomOut'"
              @click="canvasState.scale = Math.max(0.3, canvasState.scale * 0.8)"
            />
          </el-button-group>

          <el-divider direction="vertical" />

          <el-checkbox v-model="canvasState.showGrid" label="显示网格" />
          <el-checkbox v-model="canvasState.snapToGrid" label="网格吸附" />

          <el-divider direction="vertical" />

          <span>连线类型:</span>
          <el-radio-group v-model="connectionState.connectionType" size="small">
            <el-radio-button label="curve">曲线</el-radio-button>
            <el-radio-button label="line">直线</el-radio-button>
          </el-radio-group>
        </div>

        <!-- 画布容器 -->
        <div
          ref="canvasContainer"
          class="canvas-container"
          @drop="onCanvasDrop"
          @dragover="onCanvasDragOver"
          @mousedown="onCanvasMouseDown"
          @wheel="onCanvasWheel"
        >
          <!-- SVG 画布 -->
          <svg class="canvas-svg" :style="canvasStyle">
            <!-- 网格背景 -->
            <defs v-if="canvasState.showGrid">
              <pattern
                id="grid"
                :width="canvasState.gridSize"
                :height="canvasState.gridSize"
                patternUnits="userSpaceOnUse"
              >
                <path
                  :d="`M ${canvasState.gridSize} 0 L 0 0 0 ${canvasState.gridSize}`"
                  fill="none"
                  stroke="#e5e7eb"
                  stroke-width="0.5"
                />
              </pattern>
            </defs>
            <rect
              v-if="canvasState.showGrid"
              width="10000"
              height="10000"
              fill="url(#grid)"
            />

            <!-- 对齐参考线 -->
            <g v-if="dragState.showGuideLines">
              <line
                v-for="(lineX, idx) in dragState.guideLines.vertical"
                :key="`v-${idx}`"
                :x1="lineX"
                y1="0"
                :x2="lineX"
                y2="10000"
                stroke="#f59e0b"
                stroke-width="1"
                stroke-dasharray="5,5"
              />
              <line
                v-for="(lineY, idx) in dragState.guideLines.horizontal"
                :key="`h-${idx}`"
                x1="0"
                :y1="lineY"
                x2="10000"
                :y2="lineY"
                stroke="#f59e0b"
                stroke-width="1"
                stroke-dasharray="5,5"
              />
            </g>

            <!-- 连线 -->
            <g class="connections">
              <g v-for="conn in connections" :key="conn.id" class="connection">
                <path
                  :d="getConnectionPath(conn)"
                  stroke="#60a5fa"
                  stroke-width="2"
                  fill="none"
                  class="connection-path"
                />
                <!-- 箭头 -->
                <path
                  d="M -5 -3 L 0 0 L -5 3"
                  fill="none"
                  stroke="#60a5fa"
                  stroke-width="2"
                  :transform="`translate(${canvasComponents.find(c => c.id === conn.to)?.position.x},${canvasComponents.find(c => c.id === conn.to)?.position.y + 30})`"
                />

                <!-- 删除按钮 -->
                <foreignObject
                  v-if="canvasComponents.find(c => c.id === conn.from) && canvasComponents.find(c => c.id === conn.to)"
                  :x="(canvasComponents.find(c => c.id === conn.from).position.x + canvasComponents.find(c => c.id === conn.to).position.x) / 2 + 30"
                  :y="(canvasComponents.find(c => c.id === conn.from).position.y + canvasComponents.find(c => c.id === conn.to).position.y) / 2 + 15"
                  width="50"
                  height="30"
                >
                  <el-button
                    size="small"
                    type="danger"
                    :icon="'Delete'"
                    circle
                    @click.stop="deleteConnection(conn.id)"
                  />
                </foreignObject>
              </g>

              <!-- 正在连线 -->
              <path
                v-if="connectionState.isConnecting"
                :d="`M ${connectionState.startPos.x} ${connectionState.startPos.y} L ${connectionState.currentPos.x} ${connectionState.currentPos.y}`"
                stroke="#9ca3af"
                stroke-width="2"
                stroke-dasharray="5,5"
                fill="none"
              />
            </g>

            <!-- 组件 -->
            <g class="components">
              <g
                v-for="component in canvasComponents"
                :key="component.id"
                class="canvas-component"
                :class="{ selected: selectedComponents.has(component.id) }"
                :transform="`translate(${component.position.x}, ${component.position.y})`"
                :style="{ zIndex: component.zIndex }"
                @mousedown.stop="onCanvasComponentMouseDown($event, component)"
                @mouseenter="hoveredComponent = component.id"
                @mouseleave="hoveredComponent = null"
              >
                <!-- 组件主体 -->
                <rect
                  width="100"
                  height="60"
                  rx="6"
                  :fill="selectedComponents.has(component.id) ? '#dbeafe' : '#ffffff'"
                  :stroke="selectedComponents.has(component.id) ? '#3b82f6' : '#d1d5db'"
                  stroke-width="2"
                  class="component-rect"
                />

                <!-- 组件内容 -->
                <foreignObject x="0" y="0" width="100" height="60">
                  <div class="canvas-component-content">
                    <el-icon :size="24" color="#3b82f6">
                      <component :is="component.icon" />
                    </el-icon>
                    <div class="component-label">{{ component.name }}</div>
                  </div>
                </foreignObject>

                <!-- 连接点 -->
                <circle
                  cx="0"
                  cy="30"
                  r="5"
                  fill="#10b981"
                  class="connection-port input-port"
                  @click.stop="connectionState.isConnecting && finishConnection(component)"
                />
                <circle
                  cx="100"
                  cy="30"
                  r="5"
                  fill="#3b82f6"
                  class="connection-port output-port"
                  @click.stop="startConnection(component)"
                />

                <!-- 操作按钮 -->
                <foreignObject
                  v-if="hoveredComponent === component.id"
                  x="70"
                  y="-35"
                  width="80"
                  height="30"
                >
                  <div class="component-actions">
                    <el-button
                      size="small"
                      :icon="'CopyDocument'"
                      circle
                      @click.stop="copyComponent(component)"
                    />
                    <el-button
                      size="small"
                      type="danger"
                      :icon="'Delete'"
                      circle
                      @click.stop="deleteComponent(component.id)"
                    />
                  </div>
                </foreignObject>
              </g>
            </g>
          </svg>

          <!-- 空状态 -->
          <div v-if="canvasComponents.length === 0" class="canvas-empty">
            <el-empty description="从左侧拖拽组件到此处开始编排">
              <el-icon :size="64" color="#9ca3af">
                <Grid />
              </el-icon>
            </el-empty>
          </div>
        </div>
      </el-main>

      <!-- 右侧属性面板 -->
      <el-aside
        v-show="uiState.showPropertyPanel && selectedComponent"
        :width="`${uiState.rightPanelWidth}px`"
        class="property-panel"
      >
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>属性配置</span>
              <el-button :icon="'Close'" text @click="selectedComponent = null" />
            </div>
          </template>

          <div v-if="selectedComponent">
            <el-tabs v-model="uiState.currentTab">
              <el-tab-pane label="配置" name="config">
                <el-form label-position="top">
                  <el-form-item label="组件名称">
                    <el-input v-model="selectedComponent.name" />
                  </el-form-item>

                  <el-form-item label="组件ID">
                    <el-input v-model="selectedComponent.id" disabled />
                  </el-form-item>

                  <el-divider>组件配置</el-divider>

                  <!-- 动态配置表单 -->
                  <template v-for="(value, key) in selectedComponent.config" :key="key">
                    <el-form-item :label="String(key)">
                      <el-input
                        v-if="typeof value === 'string'"
                        v-model="selectedComponent.config[key]"
                        :placeholder="`请输入${key}`"
                      />
                      <el-input-number
                        v-else-if="typeof value === 'number'"
                        v-model="selectedComponent.config[key]"
                        style="width: 100%"
                      />
                      <el-switch
                        v-else-if="typeof value === 'boolean'"
                        v-model="selectedComponent.config[key]"
                      />
                    </el-form-item>
                  </template>
                </el-form>
              </el-tab-pane>

              <el-tab-pane label="位置" name="position">
                <el-form label-position="top">
                  <el-form-item label="X坐标">
                    <el-input-number
                      v-model="selectedComponent.position.x"
                      :step="canvasState.gridSize"
                      style="width: 100%"
                    />
                  </el-form-item>
                  <el-form-item label="Y坐标">
                    <el-input-number
                      v-model="selectedComponent.position.y"
                      :step="canvasState.gridSize"
                      style="width: 100%"
                    />
                  </el-form-item>
                  <el-form-item label="层级">
                    <el-input-number
                      v-model="selectedComponent.zIndex"
                      :min="1"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-form>
              </el-tab-pane>
            </el-tabs>

            <el-divider />

            <el-button
              type="danger"
              style="width: 100%"
              @click="deleteComponent(selectedComponent.id)"
            >
              删除组件
            </el-button>
          </div>
        </el-card>
      </el-aside>
    </el-container>

    <!-- 底部状态栏 -->
    <el-footer class="status-bar" height="36px">
      <div class="status-left">
        <div class="status-item">
          <el-icon><Grid /></el-icon>
          <span>组件: <strong>{{ canvasComponents.length }}</strong></span>
        </div>
        <el-divider direction="vertical" />
        <div class="status-item">
          <el-icon><Connection /></el-icon>
          <span>连线: <strong>{{ connections.length }}</strong></span>
        </div>
        <el-divider direction="vertical" />
        <div class="status-item">
          <el-icon><Select /></el-icon>
          <span>已选择: <strong>{{ selectedComponents.size }}</strong> 个</span>
        </div>
        <el-divider direction="vertical" />
        <div class="status-item" v-if="draftState.isDirty">
          <el-icon color="#f59e0b"><Warning /></el-icon>
          <span style="color: #f59e0b">未保存</span>
        </div>
      </div>
      <div class="status-right">
        <div class="status-item">
          <el-icon><ZoomIn /></el-icon>
          <span>{{ Math.round(canvasState.scale * 100) }}%</span>
        </div>
        <el-divider direction="vertical" />
        <div class="status-item">
          <el-icon><Grid /></el-icon>
          <span>{{ canvasState.gridSize }}px</span>
        </div>
        <el-divider direction="vertical" />
        <div class="status-item">
          <el-icon color="#10b981"><CircleCheck /></el-icon>
          <span style="color: #10b981">就绪</span>
        </div>
      </div>
    </el-footer>
  </div>
</template>

<style scoped lang="scss">
.component-orchestration {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f9fafb;

  // 工具栏
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    background: linear-gradient(to right, #ffffff, #f8fafc);
    border-bottom: 2px solid #e5e7eb;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    position: relative;

    &::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
      opacity: 0.3;
    }

    .toolbar-left .title {
      margin: 0;
      font-size: 19px;
      font-weight: 700;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      display: flex;
      align-items: center;
      gap: 10px;

      .el-icon {
        background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-size: 22px;
      }
    }

    .toolbar-center {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }

  // 主容器
  .main-container {
    flex: 1;
    overflow: hidden;

    // 组件库
    .component-library {
      background: #ffffff;
      border-right: 1px solid #e5e7eb;
      overflow: hidden;
      display: flex;
      flex-direction: column;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 600;
      }

      .library-filters {
        .filter-options {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }
      }

      .category-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin: 4px 0;

        .category-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;

          &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 3px;
            background: linear-gradient(180deg, #3b82f6, #8b5cf6);
            opacity: 0;
            transition: opacity 0.3s;
          }

          &:hover {
            background: linear-gradient(90deg, #f3f4f6, #fafafa);
            transform: translateX(4px);

            &::before {
              opacity: 0.5;
            }
          }

          &.active {
            background: linear-gradient(90deg, #dbeafe, #e0e7ff);
            color: #2563eb;
            font-weight: 600;
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);

            &::before {
              opacity: 1;
            }

            .el-icon {
              color: #3b82f6;
            }
          }

          .el-icon {
            font-size: 18px;
            transition: color 0.3s;
          }

          span {
            flex: 1;
            font-size: 14px;
          }

          .el-tag {
            background: rgba(59, 130, 246, 0.1);
            border: none;
            color: #3b82f6;
            font-weight: 600;
          }
        }
      }

      .component-list {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 4px;

        .component-card {
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 14px;
          cursor: move;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
          position: relative;
          overflow: hidden;

          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
            opacity: 0;
            transition: opacity 0.3s;
          }

          &:hover {
            border-color: #3b82f6;
            box-shadow: 0 8px 20px rgba(59, 130, 246, 0.2);
            transform: translateY(-4px) scale(1.02);

            &::before {
              opacity: 1;
            }
          }

          &.deprecated {
            opacity: 0.5;
            cursor: not-allowed;
            background: #f3f4f6;

            &:hover {
              transform: none;
              box-shadow: none;
            }
          }

          .component-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10px;

            .component-icon {
              color: #3b82f6;
              padding: 8px;
              background: linear-gradient(135deg, #dbeafe, #e0e7ff);
              border-radius: 8px;
              transition: all 0.3s;
            }

            &:hover .component-icon {
              transform: rotate(5deg) scale(1.1);
              box-shadow: 0 4px 8px rgba(59, 130, 246, 0.2);
            }
          }

          .component-info {
            .component-name {
              font-size: 14px;
              font-weight: 700;
              color: #111827;
              margin-bottom: 4px;
              letter-spacing: 0.2px;
            }

            .component-version {
              font-size: 11px;
              color: #8b5cf6;
              background: #f3e8ff;
              padding: 2px 8px;
              border-radius: 10px;
              display: inline-block;
              margin-bottom: 8px;
              font-weight: 600;
            }

            .component-desc {
              font-size: 12px;
              color: #6b7280;
              line-height: 1.6;
              margin-bottom: 10px;
            }

            .component-tags {
              display: flex;
              flex-wrap: wrap;
              gap: 6px;
              margin-bottom: 10px;

              .el-tag {
                background: linear-gradient(135deg, #f0f9ff, #faf5ff);
                border: 1px solid #e0e7ff;
                color: #6366f1;
                font-weight: 500;
              }
            }

            .component-footer {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding-top: 8px;
              border-top: 1px solid #f3f4f6;

              .use-count {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 12px;
                color: #9ca3af;
                font-weight: 500;

                .el-icon {
                  color: #3b82f6;
                }
              }
            }
          }
        }
      }
    }

    // 画布区域
    .canvas-area {
      padding: 0;
      position: relative;
      background: linear-gradient(135deg, #f0f9ff 0%, #faf5ff 50%, #fef3f2 100%);
      background-attachment: fixed;

      .canvas-toolbar {
        position: absolute;
        top: 16px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 100;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        padding: 10px 20px;
        border-radius: 12px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05);
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 14px;
        border: 1px solid rgba(255, 255, 255, 0.8);
        animation: slideIn 0.3s ease-out;
      }

      .canvas-container {
        width: 100%;
        height: 100%;
        position: relative;
        overflow: hidden;
        cursor: grab;

        &:active {
          cursor: grabbing;
        }

        .canvas-svg {
          width: 100%;
          height: 100%;
          user-select: none;

          .canvas-component {
            cursor: move;
            transition: all 0.2s;

            &.selected .component-rect {
              filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.5)) drop-shadow(0 0 20px rgba(59, 130, 246, 0.3));
              animation: pulse 2s ease-in-out infinite;
            }

            &:hover .component-rect {
              filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15));
            }

            .canvas-component-content {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100%;
              padding: 8px;
              pointer-events: none;

              .component-label {
                font-size: 11px;
                font-weight: 600;
                color: #374151;
                text-align: center;
                margin-top: 4px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                max-width: 90px;
                letter-spacing: 0.3px;
              }
            }

            .connection-port {
              cursor: pointer;
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));

              &:hover {
                transform: scale(1.5);
                filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.3));
              }

              &.input-port:hover {
                fill: #059669;
              }

              &.output-port:hover {
                fill: #2563eb;
              }
            }

            .component-actions {
              display: flex;
              gap: 6px;
              animation: fadeIn 0.2s ease-out;
            }
          }

          .connection {
            .connection-path {
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              stroke-dasharray: 0;
              animation: fadeIn 0.3s ease-out;

              &:hover {
                stroke-width: 3;
                stroke: #2563eb;
                filter: drop-shadow(0 0 4px rgba(37, 99, 235, 0.5));
                stroke-dasharray: 5;
                animation: dash 20s linear infinite;
              }
            }
          }

          @keyframes dash {
            to {
              stroke-dashoffset: 1000;
            }
          }
        }

        .canvas-empty {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          pointer-events: none;
        }
      }
    }

    // 属性面板
    .property-panel {
      background: #ffffff;
      border-left: 1px solid #e5e7eb;
      overflow-y: auto;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
    }
  }

  // 底部状态栏增强
  .status-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    background: linear-gradient(to right, #ffffff, #f9fafb);
    border-top: 1px solid #e5e7eb;
    font-size: 13px;
    color: #6b7280;
    box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.05);

    .status-left,
    .status-right {
      display: flex;
      align-items: center;
      gap: 12px;

      .status-item {
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s;

        &:hover {
          color: #3b82f6;
        }

        strong {
          color: #111827;
          font-weight: 600;
        }
      }
    }
  }
}

// 全局动画
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>