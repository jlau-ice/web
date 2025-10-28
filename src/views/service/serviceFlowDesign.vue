<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import type { FormInstance } from 'element-plus'

// ==================== 类型定义 ====================
interface Position {
  x: number
  y: number
}

interface NodeConfig {
  id: string
  type: string
  label: string
  position: Position
  config: Record<string, any>
  icon: string
  category: string
}

interface Connection {
  id: string
  from: string
  to: string
  fromPort?: string
  toPort?: string
  condition?: string
  type: 'data' | 'control'
}

interface ComponentTemplate {
  id: string
  name: string
  icon: string
  category: string
  description: string
  defaultConfig: Record<string, any>
}

interface TestCase {
  id: string
  name: string
  inputData: Record<string, any>
  expectedOutput: Record<string, any>
}

interface DebugLog {
  timestamp: string
  nodeId: string
  message: string
  data?: any
  level: 'info' | 'warning' | 'error'
}

// ==================== 状态管理 ====================
const canvas = ref<SVGSVGElement>()
const canvasContainer = ref<HTMLElement>()

// 画布状态
const canvasState = reactive({
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  isDragging: false,
  isConnecting: false,
  dragStartPos: { x: 0, y: 0 },
  gridSize: 20,
  showGrid: true,
})

// 节点和连线
const nodes = ref<NodeConfig[]>([])
const connections = ref<Connection[]>([])
const selectedNode = ref<NodeConfig | null>(null)
const selectedConnection = ref<Connection | null>(null)
const hoveredNode = ref<string | null>(null)

// 拖拽状态
const dragState = reactive({
  isDragging: false,
  draggedNode: null as NodeConfig | null,
  draggedTemplate: null as ComponentTemplate | null,
  startPos: { x: 0, y: 0 },
  currentPos: { x: 0, y: 0 },
})

// 连线状态
const connectionState = reactive({
  isConnecting: false,
  fromNode: null as string | null,
  startPos: { x: 0, y: 0 },
  currentPos: { x: 0, y: 0 },
})

// 调试状态
const debugState = reactive({
  isDebugging: false,
  currentNodeId: null as string | null,
  isPaused: false,
  breakpoints: new Set<string>(),
  logs: [] as DebugLog[],
  executionSpeed: 1000, // 毫秒
})

// 测试状态
const testState = reactive({
  testCases: [] as TestCase[],
  currentTestCase: null as TestCase | null,
  testResults: null as any,
  isRunningTest: false,
})

// 历史记录（撤销/重做）
const history = reactive({
  past: [] as { nodes: NodeConfig[]; connections: Connection[] }[],
  future: [] as { nodes: NodeConfig[]; connections: Connection[] }[],
})

// UI 状态
const uiState = reactive({
  leftPanelWidth: 280,
  rightPanelWidth: 320,
  showComponentLibrary: true,
  showPropertyPanel: true,
  showDebugPanel: false,
  showTestPanel: false,
  componentSearch: '',
  selectedCategory: 'all',
})

// ==================== Mock 数据 ====================
const componentCategories = [
  { id: 'all', name: '全部组件', icon: 'Grid' },
  { id: 'input', name: '数据输入', icon: 'Download' },
  { id: 'process', name: '数据处理', icon: 'Operation' },
  { id: 'output', name: '数据输出', icon: 'Upload' },
  { id: 'control', name: '流程控制', icon: 'Guide' },
  { id: 'transform', name: '数据转换', icon: 'Refresh' },
]

const componentTemplates = ref<ComponentTemplate[]>([
  {
    id: 'input_database',
    name: '数据库输入',
    icon: 'Database',
    category: 'input',
    description: '从数据库读取数据',
    defaultConfig: {
      dataSource: '',
      query: '',
      connectionString: '',
      table: '',
    },
  },
  {
    id: 'input_api',
    name: 'API接口',
    icon: 'Link',
    category: 'input',
    description: '通过API获取数据',
    defaultConfig: {
      url: '',
      method: 'GET',
      headers: {},
      params: {},
    },
  },
  {
    id: 'input_file',
    name: '文件输入',
    icon: 'Document',
    category: 'input',
    description: '读取文件数据',
    defaultConfig: {
      filePath: '',
      fileType: 'csv',
      encoding: 'utf-8',
    },
  },
  {
    id: 'process_filter',
    name: '数据过滤',
    icon: 'Filter',
    category: 'process',
    description: '根据条件过滤数据',
    defaultConfig: {
      filterExpression: '',
      conditions: [],
    },
  },
  {
    id: 'process_aggregate',
    name: '数据聚合',
    icon: 'DataAnalysis',
    category: 'process',
    description: '对数据进行聚合计算',
    defaultConfig: {
      groupBy: [],
      aggregations: [],
    },
  },
  {
    id: 'process_join',
    name: '数据关联',
    icon: 'Connection',
    category: 'process',
    description: '关联多个数据源',
    defaultConfig: {
      joinType: 'inner',
      leftKey: '',
      rightKey: '',
    },
  },
  {
    id: 'transform_map',
    name: '字段映射',
    icon: 'Sort',
    category: 'transform',
    description: '转换字段结构',
    defaultConfig: {
      mappings: [],
    },
  },
  {
    id: 'transform_calculate',
    name: '计算字段',
    icon: 'Histogram',
    category: 'transform',
    description: '添加计算字段',
    defaultConfig: {
      formula: '',
      outputField: '',
    },
  },
  {
    id: 'control_condition',
    name: '条件分支',
    icon: 'Share',
    category: 'control',
    description: '根据条件执行不同分支',
    defaultConfig: {
      conditions: [],
    },
  },
  {
    id: 'control_loop',
    name: '循环处理',
    icon: 'RefreshRight',
    category: 'control',
    description: '循环处理数据',
    defaultConfig: {
      loopType: 'forEach',
      condition: '',
    },
  },
  {
    id: 'output_database',
    name: '数据库输出',
    icon: 'Coin',
    category: 'output',
    description: '写入数据到数据库',
    defaultConfig: {
      dataSource: '',
      table: '',
      writeMode: 'insert',
    },
  },
  {
    id: 'output_api',
    name: 'API输出',
    icon: 'Position',
    category: 'output',
    description: '发送数据到API',
    defaultConfig: {
      url: '',
      method: 'POST',
      headers: {},
    },
  },
  {
    id: 'output_file',
    name: '文件输出',
    icon: 'Folder',
    category: 'output',
    description: '导出数据到文件',
    defaultConfig: {
      filePath: '',
      fileType: 'csv',
      encoding: 'utf-8',
    },
  },
])

// ==================== 计算属性 ====================
const filteredComponents = computed(() => {
  let filtered = componentTemplates.value

  if (uiState.selectedCategory !== 'all') {
    filtered = filtered.filter(c => c.category === uiState.selectedCategory)
  }

  if (uiState.componentSearch) {
    const search = uiState.componentSearch.toLowerCase()
    filtered = filtered.filter(
      c =>
        c.name.toLowerCase().includes(search) ||
        c.description.toLowerCase().includes(search)
    )
  }

  return filtered
})

const canUndo = computed(() => history.past.length > 0)
const canRedo = computed(() => history.future.length > 0)

const canvasStyle = computed(() => ({
  transform: `translate(${canvasState.offsetX}px, ${canvasState.offsetY}px) scale(${canvasState.scale})`,
  transformOrigin: '0 0',
}))

// ==================== 核心功能方法 ====================

// 添加节点到画布
const addNodeToCanvas = (template: ComponentTemplate, position: Position) => {
  const newNode: NodeConfig = {
    id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: template.id,
    label: template.name,
    position: {
      x: Math.round(position.x / canvasState.gridSize) * canvasState.gridSize,
      y: Math.round(position.y / canvasState.gridSize) * canvasState.gridSize,
    },
    config: { ...template.defaultConfig },
    icon: template.icon,
    category: template.category,
  }

  saveHistory()
  nodes.value.push(newNode)
  selectedNode.value = newNode

  ElMessage.success(`已添加 ${template.name}`)
}

// 删除节点
const deleteNode = (nodeId: string) => {
  saveHistory()
  nodes.value = nodes.value.filter(n => n.id !== nodeId)
  connections.value = connections.value.filter(
    c => c.from !== nodeId && c.to !== nodeId
  )
  if (selectedNode.value?.id === nodeId) {
    selectedNode.value = null
  }
}

// 添加连线
const addConnection = (fromId: string, toId: string, type: 'data' | 'control' = 'data') => {
  // 检查是否已存在连线
  const exists = connections.value.some(
    c => c.from === fromId && c.to === toId
  )
  if (exists) {
    ElMessage.warning('该连线已存在')
    return
  }

  // 检查是否会形成循环
  if (wouldCreateCycle(fromId, toId)) {
    ElMessage.warning('不能创建循环连线')
    return
  }

  saveHistory()
  const newConnection: Connection = {
    id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    from: fromId,
    to: toId,
    type,
  }
  connections.value.push(newConnection)
  ElMessage.success('连线创建成功')
}

// 检查是否会形成循环
const wouldCreateCycle = (fromId: string, toId: string): boolean => {
  const visited = new Set<string>()
  const stack = [toId]

  while (stack.length > 0) {
    const current = stack.pop()!
    if (current === fromId) return true
    if (visited.has(current)) continue
    visited.add(current)

    const outgoing = connections.value.filter(c => c.from === current)
    outgoing.forEach(c => stack.push(c.to))
  }

  return false
}

// 删除连线
const deleteConnection = (connId: string) => {
  saveHistory()
  connections.value = connections.value.filter(c => c.id !== connId)
  if (selectedConnection.value?.id === connId) {
    selectedConnection.value = null
  }
}

// 保存历史记录
const saveHistory = () => {
  history.past.push({
    nodes: JSON.parse(JSON.stringify(nodes.value)),
    connections: JSON.parse(JSON.stringify(connections.value)),
  })
  history.future = []
  // 限制历史记录数量
  if (history.past.length > 50) {
    history.past.shift()
  }
}

// 撤销
const undo = () => {
  if (!canUndo.value) return
  const current = {
    nodes: JSON.parse(JSON.stringify(nodes.value)),
    connections: JSON.parse(JSON.stringify(connections.value)),
  }
  history.future.push(current)

  const previous = history.past.pop()!
  nodes.value = previous.nodes
  connections.value = previous.connections
}

// 重做
const redo = () => {
  if (!canRedo.value) return
  const current = {
    nodes: JSON.parse(JSON.stringify(nodes.value)),
    connections: JSON.parse(JSON.stringify(connections.value)),
  }
  history.past.push(current)

  const next = history.future.pop()!
  nodes.value = next.nodes
  connections.value = next.connections
}

// ==================== 画布交互 ====================

// 组件拖拽开始
const onComponentDragStart = (e: DragEvent, template: ComponentTemplate) => {
  dragState.draggedTemplate = template
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'copy'
  }
}

// 画布接收拖放
const onCanvasDrop = (e: DragEvent) => {
  e.preventDefault()
  if (!dragState.draggedTemplate || !canvasContainer.value) return

  const rect = canvasContainer.value.getBoundingClientRect()
  const x = (e.clientX - rect.left - canvasState.offsetX) / canvasState.scale
  const y = (e.clientY - rect.top - canvasState.offsetY) / canvasState.scale

  addNodeToCanvas(dragState.draggedTemplate, { x, y })
  dragState.draggedTemplate = null
}

const onCanvasDragOver = (e: DragEvent) => {
  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'copy'
  }
}

// 节点拖拽
const onNodeMouseDown = (e: MouseEvent, node: NodeConfig) => {
  if (e.button !== 0) return // 只响应左键

  e.stopPropagation()
  selectedNode.value = node

  dragState.isDragging = true
  dragState.draggedNode = node
  dragState.startPos = {
    x: e.clientX / canvasState.scale - node.position.x,
    y: e.clientY / canvasState.scale - node.position.y,
  }
}

// 开始连线
const onNodePortClick = (e: MouseEvent, node: NodeConfig, isOutput: boolean) => {
  e.stopPropagation()

  if (!isOutput) return // 只允许从输出端口开始连线

  connectionState.isConnecting = true
  connectionState.fromNode = node.id

  const rect = canvasContainer.value!.getBoundingClientRect()
  connectionState.startPos = {
    x: node.position.x + 100,
    y: node.position.y + 40,
  }
  connectionState.currentPos = { ...connectionState.startPos }
}

// 完成连线
const onNodePortHover = (node: NodeConfig, isInput: boolean) => {
  if (!connectionState.isConnecting || !isInput) return

  if (connectionState.fromNode && connectionState.fromNode !== node.id) {
    addConnection(connectionState.fromNode, node.id)
    connectionState.isConnecting = false
    connectionState.fromNode = null
  }
}

// 画布鼠标移动
const onCanvasMouseMove = (e: MouseEvent) => {
  if (dragState.isDragging && dragState.draggedNode) {
    const newX = e.clientX / canvasState.scale - dragState.startPos.x
    const newY = e.clientY / canvasState.scale - dragState.startPos.y

    dragState.draggedNode.position.x = Math.round(newX / canvasState.gridSize) * canvasState.gridSize
    dragState.draggedNode.position.y = Math.round(newY / canvasState.gridSize) * canvasState.gridSize
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

// 画布鼠标释放
const onCanvasMouseUp = () => {
  if (dragState.isDragging && dragState.draggedNode) {
    saveHistory()
  }

  dragState.isDragging = false
  dragState.draggedNode = null
  canvasState.isDragging = false

  if (connectionState.isConnecting) {
    connectionState.isConnecting = false
    connectionState.fromNode = null
  }
}

// 画布点击（取消选择）
const onCanvasClick = (e: MouseEvent) => {
  if (e.target === canvasContainer.value || (e.target as HTMLElement).closest('svg')) {
    selectedNode.value = null
    selectedConnection.value = null
  }
}

// 画布缩放
const onCanvasWheel = (e: WheelEvent) => {
  e.preventDefault()
  const delta = e.deltaY > 0 ? 0.9 : 1.1
  const newScale = Math.max(0.1, Math.min(3, canvasState.scale * delta))

  if (canvasContainer.value) {
    const rect = canvasContainer.value.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    canvasState.offsetX = mouseX - (mouseX - canvasState.offsetX) * (newScale / canvasState.scale)
    canvasState.offsetY = mouseY - (mouseY - canvasState.offsetY) * (newScale / canvasState.scale)
  }

  canvasState.scale = newScale
}

// 画布平移（空格+拖拽）
const onCanvasMouseDown = (e: MouseEvent) => {
  if (e.button === 1 || e.spaceKey) { // 中键或空格
    e.preventDefault()
    canvasState.isDragging = true
    canvasState.dragStartPos = { x: e.clientX, y: e.clientY }
  }
}

// ==================== 工具栏操作 ====================

// 保存流程
const saveFlow = async () => {
  const flowData = {
    nodes: nodes.value,
    connections: connections.value,
    version: '1.0',
    updatedAt: new Date().toISOString(),
  }

  // 模拟保存
  await new Promise(resolve => setTimeout(resolve, 500))

  ElNotification({
    title: '保存成功',
    message: '服务流程已保存',
    type: 'success',
  })
}

// 导出流程
const exportFlow = () => {
  const flowData = {
    nodes: nodes.value,
    connections: connections.value,
    metadata: {
      version: '1.0',
      exportedAt: new Date().toISOString(),
    },
  }

  const blob = new Blob([JSON.stringify(flowData, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `flow_${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)

  ElMessage.success('流程已导出')
}

// 导入流程
const importFlow = () => {
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
        nodes.value = data.nodes || []
        connections.value = data.connections || []
        ElMessage.success('流程导入成功')
      } catch (err) {
        ElMessage.error('流程文件格式错误')
      }
    }
    reader.readAsText(file)
  }
  input.click()
}

// 验证流程
const validateFlow = () => {
  const errors: string[] = []

  // 检查是否有节点
  if (nodes.value.length === 0) {
    errors.push('流程中没有任何节点')
  }

  // 检查是否有输入节点
  const hasInput = nodes.value.some(n => n.category === 'input')
  if (!hasInput) {
    errors.push('流程缺少数据输入节点')
  }

  // 检查是否有输出节点
  const hasOutput = nodes.value.some(n => n.category === 'output')
  if (!hasOutput) {
    errors.push('流程缺少数据输出节点')
  }

  // 检查孤立节点
  const connectedNodes = new Set<string>()
  connections.value.forEach(c => {
    connectedNodes.add(c.from)
    connectedNodes.add(c.to)
  })
  const isolatedNodes = nodes.value.filter(n => !connectedNodes.has(n.id))
  if (isolatedNodes.length > 0) {
    errors.push(`存在 ${isolatedNodes.length} 个孤立节点`)
  }

  if (errors.length > 0) {
    ElNotification({
      title: '流程验证失败',
      message: errors.join('\n'),
      type: 'warning',
      duration: 5000,
    })
  } else {
    ElNotification({
      title: '验证成功',
      message: '流程配置正确，可以部署',
      type: 'success',
    })
  }
}

// 部署到测试环境
const deployToTest = async () => {
  validateFlow()

  ElNotification({
    title: '开始部署',
    message: '正在部署到测试环境...',
    type: 'info',
  })

  // 模拟部署
  await new Promise(resolve => setTimeout(resolve, 2000))

  ElNotification({
    title: '部署成功',
    message: '服务已部署到测试环境',
    type: 'success',
  })
}

// 清空画布
const clearCanvas = () => {
  saveHistory()
  nodes.value = []
  connections.value = []
  selectedNode.value = null
  selectedConnection.value = null
  ElMessage.success('画布已清空')
}

// ==================== 调试功能 ====================

// 开始调试
const startDebug = async () => {
  debugState.isDebugging = true
  debugState.isPaused = false
  debugState.logs = []
  debugState.currentNodeId = null

  ElNotification({
    title: '开始调试',
    message: '流程调试已启动',
    type: 'info',
  })

  // 模拟执行流程
  await executeFlow()
}

// 执行流程
const executeFlow = async () => {
  const inputNodes = nodes.value.filter(n => n.category === 'input')

  for (const node of inputNodes) {
    await executeNode(node.id)
  }

  debugState.isDebugging = false
  ElNotification({
    title: '调试完成',
    message: '流程执行完成',
    type: 'success',
  })
}

// 执行单个节点
const executeNode = async (nodeId: string) => {
  const node = nodes.value.find(n => n.id === nodeId)
  if (!node) return

  debugState.currentNodeId = nodeId

  // 检查断点
  if (debugState.breakpoints.has(nodeId)) {
    debugState.isPaused = true
    while (debugState.isPaused && debugState.isDebugging) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  // 记录日志
  const log: DebugLog = {
    timestamp: new Date().toLocaleTimeString(),
    nodeId,
    message: `执行节点: ${node.label}`,
    level: 'info',
    data: { config: node.config },
  }
  debugState.logs.push(log)

  // 模拟执行延迟
  await new Promise(resolve => setTimeout(resolve, debugState.executionSpeed))

  // 执行后续节点
  const nextConnections = connections.value.filter(c => c.from === nodeId)
  for (const conn of nextConnections) {
    if (debugState.isDebugging) {
      await executeNode(conn.to)
    }
  }
}

// 暂停/继续调试
const togglePauseDebug = () => {
  debugState.isPaused = !debugState.isPaused
}

// 停止调试
const stopDebug = () => {
  debugState.isDebugging = false
  debugState.currentNodeId = null
  debugState.isPaused = false
}

// 单步执行
const stepDebug = () => {
  if (debugState.isPaused) {
    debugState.isPaused = false
    setTimeout(() => {
      debugState.isPaused = true
    }, debugState.executionSpeed + 100)
  }
}

// 切换断点
const toggleBreakpoint = (nodeId: string) => {
  if (debugState.breakpoints.has(nodeId)) {
    debugState.breakpoints.delete(nodeId)
  } else {
    debugState.breakpoints.add(nodeId)
  }
}

// ==================== 测试功能 ====================

// 加载测试用例
const loadTestCases = async () => {
  await new Promise(resolve => setTimeout(resolve, 500))

  testState.testCases = [
    {
      id: 'test_1',
      name: '基础数据测试',
      inputData: { userId: 1001, dataType: 'user_profile' },
      expectedOutput: { status: 'success', recordCount: 150 },
    },
    {
      id: 'test_2',
      name: '大数据量测试',
      inputData: { userId: 1002, dataType: 'transaction', limit: 10000 },
      expectedOutput: { status: 'success', recordCount: 10000 },
    },
    {
      id: 'test_3',
      name: '异常情况测试',
      inputData: { userId: -1, dataType: 'invalid' },
      expectedOutput: { status: 'error', errorCode: 'INVALID_INPUT' },
    },
  ]
}

// 运行测试
const runTest = async (testCase: TestCase) => {
  testState.isRunningTest = true
  testState.currentTestCase = testCase

  ElNotification({
    title: '开始测试',
    message: `运行测试用例: ${testCase.name}`,
    type: 'info',
  })

  // 模拟测试执行
  await new Promise(resolve => setTimeout(resolve, 2000))

  testState.testResults = {
    passed: Math.random() > 0.3,
    responseTime: Math.floor(Math.random() * 500) + 100,
    throughput: Math.floor(Math.random() * 1000) + 500,
    errorRate: Math.random() * 0.1,
    output: testCase.expectedOutput,
  }

  testState.isRunningTest = false

  ElNotification({
    title: testState.testResults.passed ? '测试通过' : '测试失败',
    message: `响应时间: ${testState.testResults.responseTime}ms`,
    type: testState.testResults.passed ? 'success' : 'error',
  })
}

// 生成测试数据
const generateTestData = () => {
  ElMessage.success('测试数据已生成')
}

// ==================== 连线路径计算 ====================
const getConnectionPath = (conn: Connection) => {
  const fromNode = nodes.value.find(n => n.id === conn.from)
  const toNode = nodes.value.find(n => n.id === conn.to)

  if (!fromNode || !toNode) return ''

  const x1 = fromNode.position.x + 200 // 节点宽度
  const y1 = fromNode.position.y + 40 // 节点中心
  const x2 = toNode.position.x
  const y2 = toNode.position.y + 40

  const dx = x2 - x1
  const cx1 = x1 + Math.abs(dx) * 0.5
  const cx2 = x2 - Math.abs(dx) * 0.5

  return `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`
}

// ==================== 生命周期 ====================
onMounted(async () => {
  // 加载测试用例
  await loadTestCases()

  // 添加全局鼠标事件监听
  document.addEventListener('mousemove', onCanvasMouseMove)
  document.addEventListener('mouseup', onCanvasMouseUp)

  // 添加示例节点（演示用）
  setTimeout(() => {
    const apiInput = componentTemplates.value.find(t => t.id === 'input_api')
    const filterProcess = componentTemplates.value.find(t => t.id === 'process_filter')
    const dbOutput = componentTemplates.value.find(t => t.id === 'output_database')

    if (apiInput && filterProcess && dbOutput) {
      addNodeToCanvas(apiInput, { x: 100, y: 100 })
      addNodeToCanvas(filterProcess, { x: 400, y: 100 })
      addNodeToCanvas(dbOutput, { x: 700, y: 100 })
    }
  }, 500)
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
        saveFlow()
        break
      case 'Delete':
      case 'Backspace':
        if (selectedNode.value) {
          e.preventDefault()
          deleteNode(selectedNode.value.id)
        }
        break
    }
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="service-flow-design">
    <!-- 顶部工具栏 -->
    <el-header class="toolbar" height="60px">
      <div class="toolbar-left">
        <h2 class="title">
          <el-icon><Grid /></el-icon>
          服务编排设计器
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
          <el-button :icon="'DocumentAdd'" @click="importFlow">导入</el-button>
          <el-button :icon="'Download'" @click="exportFlow">导出</el-button>
          <el-button :icon="'Select'" @click="validateFlow">验证</el-button>
        </el-button-group>

        <el-divider direction="vertical" />

        <el-button type="primary" :icon="'Position'" @click="saveFlow">
          保存流程
        </el-button>
        <el-button type="success" :icon="'Upload'" @click="deployToTest">
          部署到测试环境
        </el-button>
      </div>

      <div class="toolbar-right">
        <el-button :icon="'Delete'" @click="clearCanvas" text>清空</el-button>
      </div>
    </el-header>

    <!-- 主体内容区 -->
    <el-container class="main-container">
      <!-- 左侧组件库 -->
      <el-aside
        v-show="uiState.showComponentLibrary"
        :width="`${uiState.leftPanelWidth}px`"
        class="component-library"
      >
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <template #header>
            <div class="card-header">
              <span>组件库</span>
              <el-button
                :icon="'Close'"
                text
                @click="uiState.showComponentLibrary = false"
              />
            </div>
          </template>

          <!-- 搜索框 -->
          <el-input
            v-model="uiState.componentSearch"
            placeholder="搜索组件..."
            :prefix-icon="'Search'"
            clearable
            style="margin-bottom: 12px"
          />

          <!-- 分类标签 -->
          <div class="category-tabs">
            <el-tag
              v-for="category in componentCategories"
              :key="category.id"
              :type="uiState.selectedCategory === category.id ? 'primary' : 'info'"
              :effect="uiState.selectedCategory === category.id ? 'dark' : 'plain'"
              style="margin: 4px; cursor: pointer"
              @click="uiState.selectedCategory = category.id"
            >
              {{ category.name }}
            </el-tag>
          </div>

          <el-divider />

          <!-- 组件列表 -->
          <div class="component-list">
            <div
              v-for="component in filteredComponents"
              :key="component.id"
              class="component-item"
              draggable="true"
              @dragstart="onComponentDragStart($event, component)"
            >
              <div class="component-icon">
                <el-icon :size="24">
                  <component :is="component.icon" />
                </el-icon>
              </div>
              <div class="component-info">
                <div class="component-name">{{ component.name }}</div>
                <div class="component-desc">{{ component.description }}</div>
              </div>
            </div>

            <el-empty
              v-if="filteredComponents.length === 0"
              description="没有找到组件"
              :image-size="80"
            />
          </div>
        </el-card>
      </el-aside>

      <!-- 中间画布区 -->
      <el-main class="canvas-area">
        <!-- 画布工具栏 -->
        <div class="canvas-toolbar">
          <el-button-group size="small">
            <el-button @click="canvasState.scale = 1">
              {{ Math.round(canvasState.scale * 100) }}%
            </el-button>
            <el-button :icon="'ZoomIn'" @click="canvasState.scale = Math.min(3, canvasState.scale * 1.2)" />
            <el-button :icon="'ZoomOut'" @click="canvasState.scale = Math.max(0.1, canvasState.scale * 0.8)" />
          </el-button-group>

          <el-divider direction="vertical" />

          <el-button-group size="small">
            <el-button
              :type="debugState.isDebugging ? 'danger' : 'success'"
              :icon="debugState.isDebugging ? 'VideoPause' : 'VideoPlay'"
              @click="debugState.isDebugging ? stopDebug() : startDebug()"
            >
              {{ debugState.isDebugging ? '停止调试' : '开始调试' }}
            </el-button>
            <el-button
              v-if="debugState.isDebugging"
              :icon="debugState.isPaused ? 'VideoPlay' : 'VideoPause'"
              @click="togglePauseDebug"
            >
              {{ debugState.isPaused ? '继续' : '暂停' }}
            </el-button>
            <el-button
              v-if="debugState.isDebugging"
              :icon="'DArrowRight'"
              @click="stepDebug"
            >
              单步
            </el-button>
          </el-button-group>

          <el-divider direction="vertical" />

          <el-button
            size="small"
            :type="uiState.showDebugPanel ? 'primary' : ''"
            @click="uiState.showDebugPanel = !uiState.showDebugPanel"
          >
            调试面板
          </el-button>

          <el-button
            size="small"
            :type="uiState.showTestPanel ? 'primary' : ''"
            @click="uiState.showTestPanel = !uiState.showTestPanel"
          >
            测试面板
          </el-button>
        </div>

        <!-- 画布容器 -->
        <div
          ref="canvasContainer"
          class="canvas-container"
          @drop="onCanvasDrop"
          @dragover="onCanvasDragOver"
          @click="onCanvasClick"
          @mousedown="onCanvasMouseDown"
          @wheel="onCanvasWheel"
        >
          <!-- SVG 画布 -->
          <svg
            ref="canvas"
            class="canvas-svg"
            :style="canvasStyle"
          >
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
                  stroke="#e0e0e0"
                  stroke-width="0.5"
                />
              </pattern>
            </defs>
            <rect
              v-if="canvasState.showGrid"
              width="100%"
              height="100%"
              fill="url(#grid)"
            />

            <!-- 连线 -->
            <g class="connections">
              <g
                v-for="conn in connections"
                :key="conn.id"
                class="connection"
                :class="{
                  selected: selectedConnection?.id === conn.id,
                  [conn.type]: true,
                }"
                @click.stop="selectedConnection = conn"
              >
                <path
                  :d="getConnectionPath(conn)"
                  :stroke="conn.type === 'data' ? '#409eff' : '#67c23a'"
                  stroke-width="2"
                  fill="none"
                  class="connection-path"
                />
                <path
                  :d="getConnectionPath(conn)"
                  stroke="transparent"
                  stroke-width="10"
                  fill="none"
                  class="connection-hitbox"
                />
                
                <!-- 删除按钮 -->
                <foreignObject
                  v-if="selectedConnection?.id === conn.id"
                  :x="(nodes.find(n => n.id === conn.from)!.position.x + nodes.find(n => n.id === conn.to)!.position.x) / 2 + 80"
                  :y="(nodes.find(n => n.id === conn.from)!.position.y + nodes.find(n => n.id === conn.to)!.position.y) / 2 + 30"
                  width="60"
                  height="30"
                >
                  <el-button
                    size="small"
                    type="danger"
                    :icon="'Delete'"
                    @click.stop="deleteConnection(conn.id)"
                  >
                    删除
                  </el-button>
                </foreignObject>
              </g>

              <!-- 正在连线的临时线 -->
              <path
                v-if="connectionState.isConnecting"
                :d="`M ${connectionState.startPos.x} ${connectionState.startPos.y} L ${connectionState.currentPos.x} ${connectionState.currentPos.y}`"
                stroke="#909399"
                stroke-width="2"
                stroke-dasharray="5,5"
                fill="none"
              />
            </g>

            <!-- 节点 -->
            <g class="nodes">
              <g
                v-for="node in nodes"
                :key="node.id"
                class="node"
                :class="{
                  selected: selectedNode?.id === node.id,
                  debugging: debugState.currentNodeId === node.id,
                  breakpoint: debugState.breakpoints.has(node.id),
                }"
                :transform="`translate(${node.position.x}, ${node.position.y})`"
                @mousedown.stop="onNodeMouseDown($event, node)"
                @click.stop="selectedNode = node"
                @mouseenter="hoveredNode = node.id"
                @mouseleave="hoveredNode = null"
              >
                <!-- 节点主体 -->
                <rect
                  width="200"
                  height="80"
                  rx="8"
                  :fill="selectedNode?.id === node.id ? '#ecf5ff' : '#ffffff'"
                  :stroke="selectedNode?.id === node.id ? '#409eff' : '#dcdfe6'"
                  stroke-width="2"
                  class="node-rect"
                />

                <!-- 调试高亮 -->
                <rect
                  v-if="debugState.currentNodeId === node.id"
                  width="200"
                  height="80"
                  rx="8"
                  fill="none"
                  stroke="#67c23a"
                  stroke-width="3"
                  class="node-debug-highlight"
                >
                  <animate
                    attributeName="opacity"
                    values="1;0.3;1"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                </rect>

                <!-- 断点标记 -->
                <circle
                  v-if="debugState.breakpoints.has(node.id)"
                  cx="-8"
                  cy="10"
                  r="6"
                  fill="#f56c6c"
                />

                <!-- 节点内容 -->
                <foreignObject x="0" y="0" width="200" height="80">
                  <div class="node-content">
                    <div class="node-header">
                      <el-icon :size="20" style="color: #409eff">
                        <component :is="node.icon" />
                      </el-icon>
                      <span class="node-label">{{ node.label }}</span>
                    </div>
                    <div class="node-type">{{ node.type }}</div>
                  </div>
                </foreignObject>

                <!-- 连接端口 -->
                <circle
                  v-if="node.category !== 'input'"
                  cx="0"
                  cy="40"
                  r="6"
                  fill="#67c23a"
                  class="node-port input-port"
                  @mouseenter="hoveredNode === node.id && onNodePortHover(node, true)"
                />
                <circle
                  v-if="node.category !== 'output'"
                  cx="200"
                  cy="40"
                  r="6"
                  fill="#409eff"
                  class="node-port output-port"
                  @click.stop="onNodePortClick($event, node, true)"
                />

                <!-- 删除按钮 -->
                <foreignObject
                  v-if="selectedNode?.id === node.id"
                  x="160"
                  y="-30"
                  width="30"
                  height="30"
                >
                  <el-button
                    size="small"
                    type="danger"
                    :icon="'Delete'"
                    circle
                    @click.stop="deleteNode(node.id)"
                  />
                </foreignObject>

                <!-- 断点切换按钮 -->
                <foreignObject
                  v-if="hoveredNode === node.id"
                  x="-40"
                  y="25"
                  width="30"
                  height="30"
                >
                  <el-button
                    size="small"
                    :type="debugState.breakpoints.has(node.id) ? 'danger' : 'info'"
                    circle
                    @click.stop="toggleBreakpoint(node.id)"
                  >
                    B
                  </el-button>
                </foreignObject>
              </g>
            </g>
          </svg>

          <!-- 空状态提示 -->
          <div v-if="nodes.length === 0" class="canvas-empty">
            <el-empty description="从左侧拖拽组件到此处开始设计流程">
              <el-icon :size="64" color="#909399">
                <Grid />
              </el-icon>
            </el-empty>
          </div>
        </div>

        <!-- 调试面板 -->
        <el-drawer
          v-model="uiState.showDebugPanel"
          title="调试信息"
          direction="btt"
          size="300px"
        >
          <div class="debug-panel">
            <el-tag v-if="debugState.isDebugging" type="success" effect="dark">
              调试中...
            </el-tag>

            <el-divider />

            <h4>执行日志</h4>
            <div class="debug-logs">
              <div
                v-for="(log, idx) in debugState.logs"
                :key="idx"
                class="debug-log-item"
                :class="log.level"
              >
                <span class="log-time">{{ log.timestamp }}</span>
                <span class="log-message">{{ log.message }}</span>
              </div>
              <el-empty
                v-if="debugState.logs.length === 0"
                description="暂无日志"
                :image-size="60"
              />
            </div>

            <el-divider />

            <div class="debug-controls">
              <el-row :gutter="12">
                <el-col :span="12">
                  <div>执行速度</div>
                  <el-slider
                    v-model="debugState.executionSpeed"
                    :min="100"
                    :max="3000"
                    :step="100"
                  />
                </el-col>
                <el-col :span="12">
                  <div>断点数量: {{ debugState.breakpoints.size }}</div>
                  <el-button
                    size="small"
                    @click="debugState.breakpoints.clear()"
                  >
                    清除所有断点
                  </el-button>
                </el-col>
              </el-row>
            </div>
          </div>
        </el-drawer>

        <!-- 测试面板 -->
        <el-drawer
          v-model="uiState.showTestPanel"
          title="服务测试"
          direction="btt"
          size="400px"
        >
          <div class="test-panel">
            <h4>测试用例</h4>
            <div class="test-cases">
              <el-card
                v-for="testCase in testState.testCases"
                :key="testCase.id"
                shadow="hover"
                style="margin-bottom: 12px"
              >
                <template #header>
                  <div class="card-header">
                    <span>{{ testCase.name }}</span>
                    <el-button
                      size="small"
                      type="primary"
                      :loading="testState.isRunningTest && testState.currentTestCase?.id === testCase.id"
                      @click="runTest(testCase)"
                    >
                      运行
                    </el-button>
                  </div>
                </template>
                <div class="test-case-data">
                  <div><strong>输入:</strong> {{ JSON.stringify(testCase.inputData) }}</div>
                  <div><strong>预期:</strong> {{ JSON.stringify(testCase.expectedOutput) }}</div>
                </div>
              </el-card>
            </div>

            <el-divider />

            <div v-if="testState.testResults">
              <h4>测试结果</h4>
              <el-descriptions :column="2" border>
                <el-descriptions-item label="状态">
                  <el-tag :type="testState.testResults.passed ? 'success' : 'danger'">
                    {{ testState.testResults.passed ? '通过' : '失败' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="响应时间">
                  {{ testState.testResults.responseTime }}ms
                </el-descriptions-item>
                <el-descriptions-item label="吞吐量">
                  {{ testState.testResults.throughput }} req/s
                </el-descriptions-item>
                <el-descriptions-item label="错误率">
                  {{ (testState.testResults.errorRate * 100).toFixed(2) }}%
                </el-descriptions-item>
              </el-descriptions>
            </div>

            <el-divider />

            <el-button type="primary" @click="generateTestData" style="width: 100%">
              生成测试数据
            </el-button>
          </div>
        </el-drawer>
      </el-main>

      <!-- 右侧属性面板 -->
      <el-aside
        v-show="uiState.showPropertyPanel && selectedNode"
        :width="`${uiState.rightPanelWidth}px`"
        class="property-panel"
      >
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>节点属性</span>
              <el-button
                :icon="'Close'"
                text
                @click="selectedNode = null"
              />
            </div>
          </template>

          <div v-if="selectedNode">
            <el-form label-position="top">
              <el-form-item label="节点名称">
                <el-input v-model="selectedNode.label" />
              </el-form-item>

              <el-form-item label="节点类型">
                <el-tag>{{ selectedNode.type }}</el-tag>
              </el-form-item>

              <el-form-item label="节点分类">
                <el-tag type="info">{{ selectedNode.category }}</el-tag>
              </el-form-item>

              <el-divider>配置项</el-divider>

              <!-- 数据库输入配置 -->
              <template v-if="selectedNode.type === 'input_database'">
                <el-form-item label="数据源">
                  <el-select v-model="selectedNode.config.dataSource" placeholder="选择数据源">
                    <el-option label="MySQL - 生产库" value="mysql_prod" />
                    <el-option label="PostgreSQL - 数据仓库" value="pg_warehouse" />
                  </el-select>
                </el-form-item>
                <el-form-item label="数据表">
                  <el-input v-model="selectedNode.config.table" placeholder="输入表名" />
                </el-form-item>
                <el-form-item label="SQL查询">
                  <el-input
                    v-model="selectedNode.config.query"
                    type="textarea"
                    :rows="4"
                    placeholder="SELECT * FROM table"
                  />
                </el-form-item>
              </template>

              <!-- API输入配置 -->
              <template v-if="selectedNode.type === 'input_api'">
                <el-form-item label="API地址">
                  <el-input v-model="selectedNode.config.url" placeholder="https://api.example.com" />
                </el-form-item>
                <el-form-item label="请求方法">
                  <el-select v-model="selectedNode.config.method">
                    <el-option label="GET" value="GET" />
                    <el-option label="POST" value="POST" />
                    <el-option label="PUT" value="PUT" />
                  </el-select>
                </el-form-item>
                <el-form-item label="请求头">
                  <el-input
                    v-model="selectedNode.config.headers"
                    type="textarea"
                    :rows="3"
                    placeholder='{"Content-Type": "application/json"}'
                  />
                </el-form-item>
              </template>

              <!-- 数据过滤配置 -->
              <template v-if="selectedNode.type === 'process_filter'">
                <el-form-item label="过滤条件">
                  <el-input
                    v-model="selectedNode.config.filterExpression"
                    type="textarea"
                    :rows="3"
                    placeholder="age > 18 AND status = 'active'"
                  />
                </el-form-item>
              </template>

              <!-- 数据聚合配置 -->
              <template v-if="selectedNode.type === 'process_aggregate'">
                <el-form-item label="分组字段">
                  <el-input v-model="selectedNode.config.groupBy" placeholder="category, region" />
                </el-form-item>
                <el-form-item label="聚合函数">
                  <el-input
                    v-model="selectedNode.config.aggregations"
                    type="textarea"
                    :rows="3"
                    placeholder="SUM(amount), AVG(price), COUNT(*)"
                  />
                </el-form-item>
              </template>

              <!-- 数据输出配置 -->
              <template v-if="selectedNode.type === 'output_database'">
                <el-form-item label="目标数据源">
                  <el-select v-model="selectedNode.config.dataSource">
                    <el-option label="MySQL - 结果库" value="mysql_result" />
                  </el-select>
                </el-form-item>
                <el-form-item label="目标表">
                  <el-input v-model="selectedNode.config.table" />
                </el-form-item>
                <el-form-item label="写入模式">
                  <el-select v-model="selectedNode.config.writeMode">
                    <el-option label="插入 (INSERT)" value="insert" />
                    <el-option label="更新 (UPDATE)" value="update" />
                    <el-option label="覆盖 (REPLACE)" value="replace" />
                  </el-select>
                </el-form-item>
              </template>

              <el-form-item label="节点位置">
                <el-row :gutter="8">
                  <el-col :span="12">
                    <el-input v-model.number="selectedNode.position.x" disabled>
                      <template #prepend>X:</template>
                    </el-input>
                  </el-col>
                  <el-col :span="12">
                    <el-input v-model.number="selectedNode.position.y" disabled>
                      <template #prepend>Y:</template>
                    </el-input>
                  </el-col>
                </el-row>
              </el-form-item>

              <el-button type="danger" style="width: 100%" @click="deleteNode(selectedNode.id)">
                删除节点
              </el-button>
            </el-form>
          </div>
        </el-card>
      </el-aside>
    </el-container>

    <!-- 底部状态栏 -->
    <el-footer class="status-bar" height="32px">
      <div class="status-left">
        <span>节点数: {{ nodes.length }}</span>
        <el-divider direction="vertical" />
        <span>连线数: {{ connections.length }}</span>
        <el-divider direction="vertical" />
        <span v-if="selectedNode">已选择: {{ selectedNode.label }}</span>
      </div>
      <div class="status-right">
        <span>缩放: {{ Math.round(canvasState.scale * 100) }}%</span>
        <el-divider direction="vertical" />
        <span>网格: {{ canvasState.gridSize }}px</span>
      </div>
    </el-footer>
  </div>
</template>

<style scoped lang="scss">
.service-flow-design {
  display: flex;
  flex-direction: column;
  // 顶部工具栏
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    background: #ffffff;
    border-bottom: 1px solid #e4e7ed;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    .toolbar-left {
      .title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #303133;
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }

    .toolbar-center {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .toolbar-right {
      display: flex;
      gap: 8px;
    }
  }

  // 主容器
  .main-container {
    flex: 1;
    overflow: hidden;
    &::-webkit-scrollbar{
      display: none;
    }
    // 左侧组件库
    .component-library {
      background: #ffffff;
      border-right: 1px solid #e4e7ed;
      overflow-y: auto;
      &::-webkit-scrollbar{
        display: none;
      }
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .category-tabs {
        display: flex;
        flex-wrap: wrap;
      }

      .component-list {
        max-height: calc(100vh - 450px);
        overflow-y: auto;
        &::-webkit-scrollbar{
          display: none;
        }
        .component-item {
          display: flex;
          align-items: center;
          padding: 12px;
          margin-bottom: 8px;
          border: 1px solid #e4e7ed;
          border-radius: 6px;
          cursor: move;
          transition: all 0.3s;

          &:hover {
            border-color: #409eff;
            background: #ecf5ff;
            transform: translateX(4px);
          }

          .component-icon {
            flex-shrink: 0;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f4f4f5;
            border-radius: 6px;
            margin-right: 12px;
            color: #409eff;
          }

          .component-info {
            flex: 1;

            .component-name {
              font-size: 14px;
              font-weight: 500;
              color: #303133;
              margin-bottom: 4px;
            }

            .component-desc {
              font-size: 12px;
              color: #909399;
            }
          }
        }
      }
    }

    // 画布区域
    .canvas-area {
      padding: 0;
      position: relative;
      background: #fafafa;

      .canvas-toolbar {
        position: absolute;
        top: 16px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 100;
        background: #ffffff;
        padding: 8px 16px;
        border-radius: 8px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        gap: 12px;
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

          .node {
            cursor: move;

            &.selected .node-rect {
              filter: drop-shadow(0 0 8px rgba(64, 158, 255, 0.5));
            }

            &.debugging .node-rect {
              stroke: #67c23a;
            }

            .node-content {
              padding: 12px;
              pointer-events: none;

              .node-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;

                .node-label {
                  font-size: 14px;
                  font-weight: 500;
                  color: #303133;
                }
              }

              .node-type {
                font-size: 12px;
                color: #909399;
              }
            }

            .node-port {
              cursor: pointer;
              transition: all 0.3s;

              &:hover {
                r: 8;
              }
            }
          }

          .connection {
            cursor: pointer;

            .connection-path {
              transition: all 0.3s;
            }

            &:hover .connection-path,
            &.selected .connection-path {
              stroke-width: 3;
              filter: drop-shadow(0 0 4px currentColor);
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

    // 右侧属性面板
    .property-panel {
      background: #ffffff;
      border-left: 1px solid #e4e7ed;
      overflow-y: auto;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
    }
  }

  // 底部状态栏
  .status-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    background: #ffffff;
    border-top: 1px solid #e4e7ed;
    font-size: 12px;
    color: #606266;

    .status-left,
    .status-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  // 调试面板
  .debug-panel {
    .debug-logs {
      max-height: 200px;
      overflow-y: auto;
      padding: 8px;
      background: #f5f7fa;
      border-radius: 4px;

      .debug-log-item {
        padding: 6px;
        margin-bottom: 4px;
        background: #ffffff;
        border-left: 3px solid #409eff;
        font-size: 12px;

        &.warning {
          border-left-color: #e6a23c;
        }

        &.error {
          border-left-color: #f56c6c;
        }

        .log-time {
          color: #909399;
          margin-right: 8px;
        }

        .log-message {
          color: #303133;
        }
      }
    }
  }

  // 测试面板
  .test-panel {
    .test-cases {
      max-height: 300px;
      overflow-y: auto;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .test-case-data {
        font-size: 12px;
        color: #606266;

        div {
          margin-bottom: 8px;
          word-break: break-all;
        }
      }
    }
  }
}
</style>