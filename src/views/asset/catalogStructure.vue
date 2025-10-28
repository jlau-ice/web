<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElTree } from 'element-plus'
import {
  Folder,
  FolderOpened,
  Document,
  Plus,
  Edit,
  Delete,
  CopyDocument,
  Download,
  Upload,
  Check,
  Close,
  Search,
  RefreshRight,
  Setting,
  Document as DocumentIcon
} from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'

// 目录节点接口定义
interface DirectoryNode {
  id: string
  label: string
  code: string
  description?: string
  parentId?: string
  level: number
  assetCount: number
  enabled: boolean
  owner?: string
  team?: string[]
  tags?: string[]
  permissions?: string[]
  children?: DirectoryNode[]
  createTime?: string
  updateTime?: string
}

// 目录模板接口
interface DirectoryTemplate {
  id: string
  name: string
  description: string
  structure: DirectoryNode[]
  createTime: string
}

// 表单数据接口
interface DirectoryForm {
  label: string
  code: string
  description: string
  owner: string
  team: string[]
  tags: string[]
  permissions: string[]
  enabled: boolean
}

// 验证问题接口
interface ValidationIssue {
  type: 'error' | 'warning'
  nodeId: string
  nodeName: string
  message: string
}

// 树组件引用
const treeRef = ref<InstanceType<typeof ElTree>>()
const formRef = ref<FormInstance>()

// 搜索关键字
const searchKeyword = ref('')

// 当前选中的节点
const currentNode = ref<DirectoryNode | null>(null)

// 编辑模式
const isEditMode = ref(false)

// 对话框控制
const dialogVisible = ref(false)
const dialogTitle = ref('')
const dialogMode = ref<'add' | 'edit' | 'addChild'>('add')

// 模板对话框
const templateDialogVisible = ref(false)

// 验证对话框
const validationDialogVisible = ref(false)
const validationIssues = ref<ValidationIssue[]>([])

// 表单数据
const formData = ref<DirectoryForm>({
  label: '',
  code: '',
  description: '',
  owner: '',
  team: [],
  tags: [],
  permissions: [],
  enabled: true
})

// 表单验证规则
const formRules: FormRules<DirectoryForm> = {
  label: [
    { required: true, message: '请输入目录名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入目录编码', trigger: 'blur' },
    { pattern: /^[A-Z0-9_]+$/, message: '编码只能包含大写字母、数字和下划线', trigger: 'blur' }
  ],
  owner: [
    { required: true, message: '请输入目录负责人', trigger: 'blur' }
  ]
}

// Mock 数据：目录树
const treeData = ref<DirectoryNode[]>([
  {
    id: '1',
    label: '数据资产根目录',
    code: 'ROOT',
    description: '数据资产管理根目录',
    level: 1,
    assetCount: 156,
    enabled: true,
    owner: '张三',
    team: ['数据团队', '运营团队'],
    tags: ['核心业务'],
    permissions: ['admin', 'manager'],
    createTime: '2024-01-01',
    updateTime: '2024-10-20',
    children: [
      {
        id: '1-1',
        label: '业务数据',
        code: 'BUSINESS_DATA',
        description: '业务相关数据资产',
        parentId: '1',
        level: 2,
        assetCount: 89,
        enabled: true,
        owner: '李四',
        team: ['业务团队'],
        tags: ['业务', '核心'],
        permissions: ['admin', 'business'],
        createTime: '2024-01-15',
        updateTime: '2024-10-18',
        children: [
          {
            id: '1-1-1',
            label: '用户数据',
            code: 'USER_DATA',
            description: '用户相关数据',
            parentId: '1-1',
            level: 3,
            assetCount: 45,
            enabled: true,
            owner: '王五',
            team: ['用户团队'],
            tags: ['用户', '敏感'],
            permissions: ['admin'],
            createTime: '2024-02-01',
            updateTime: '2024-10-15'
          },
          {
            id: '1-1-2',
            label: '订单数据',
            code: 'ORDER_DATA',
            description: '订单相关数据',
            parentId: '1-1',
            level: 3,
            assetCount: 34,
            enabled: true,
            owner: '赵六',
            team: ['订单团队'],
            tags: ['订单', '交易'],
            permissions: ['admin', 'business'],
            createTime: '2024-02-10',
            updateTime: '2024-10-12'
          },
          {
            id: '1-1-3',
            label: '商品数据',
            code: 'PRODUCT_DATA',
            description: '商品相关数据',
            parentId: '1-1',
            level: 3,
            assetCount: 10,
            enabled: false,
            owner: '孙七',
            team: ['商品团队'],
            tags: ['商品'],
            permissions: ['admin', 'business'],
            createTime: '2024-02-20',
            updateTime: '2024-09-30'
          }
        ]
      },
      {
        id: '1-2',
        label: '技术数据',
        code: 'TECH_DATA',
        description: '技术相关数据资产',
        parentId: '1',
        level: 2,
        assetCount: 47,
        enabled: true,
        owner: '周八',
        team: ['技术团队'],
        tags: ['技术', '系统'],
        permissions: ['admin', 'tech'],
        createTime: '2024-01-20',
        updateTime: '2024-10-10',
        children: [
          {
            id: '1-2-1',
            label: '日志数据',
            code: 'LOG_DATA',
            description: '系统日志数据',
            parentId: '1-2',
            level: 3,
            assetCount: 27,
            enabled: true,
            owner: '吴九',
            team: ['运维团队'],
            tags: ['日志', '监控'],
            permissions: ['admin', 'tech'],
            createTime: '2024-03-01',
            updateTime: '2024-10-08'
          },
          {
            id: '1-2-2',
            label: '性能数据',
            code: 'PERFORMANCE_DATA',
            description: '性能监控数据',
            parentId: '1-2',
            level: 3,
            assetCount: 20,
            enabled: true,
            owner: '郑十',
            team: ['运维团队'],
            tags: ['性能', '监控'],
            permissions: ['admin', 'tech'],
            createTime: '2024-03-10',
            updateTime: '2024-10-05'
          }
        ]
      },
      {
        id: '1-3',
        label: '分析数据',
        code: 'ANALYTICS_DATA',
        description: '数据分析相关资产',
        parentId: '1',
        level: 2,
        assetCount: 20,
        enabled: true,
        owner: '冯十一',
        team: ['分析团队'],
        tags: ['分析', '报表'],
        permissions: ['admin', 'analyst'],
        createTime: '2024-01-25',
        updateTime: '2024-10-01'
      }
    ]
  }
])

// Mock 数据：目录模板
const templates = ref<DirectoryTemplate[]>([
  {
    id: 'template-1',
    name: '标准业务目录模板',
    description: '适用于标准业务数据分类',
    createTime: '2024-01-01',
    structure: [
      {
        id: 't1-1',
        label: '业务数据',
        code: 'BUSINESS',
        level: 1,
        assetCount: 0,
        enabled: true,
        children: [
          { id: 't1-1-1', label: '用户数据', code: 'USER', level: 2, assetCount: 0, enabled: true },
          { id: 't1-1-2', label: '订单数据', code: 'ORDER', level: 2, assetCount: 0, enabled: true },
          { id: 't1-1-3', label: '商品数据', code: 'PRODUCT', level: 2, assetCount: 0, enabled: true }
        ]
      }
    ]
  },
  {
    id: 'template-2',
    name: '技术数据目录模板',
    description: '适用于技术类数据分类',
    createTime: '2024-01-05',
    structure: [
      {
        id: 't2-1',
        label: '技术数据',
        code: 'TECH',
        level: 1,
        assetCount: 0,
        enabled: true,
        children: [
          { id: 't2-1-1', label: '日志数据', code: 'LOG', level: 2, assetCount: 0, enabled: true },
          { id: 't2-1-2', label: '监控数据', code: 'MONITOR', level: 2, assetCount: 0, enabled: true },
          { id: 't2-1-3', label: '配置数据', code: 'CONFIG', level: 2, assetCount: 0, enabled: true }
        ]
      }
    ]
  },
  {
    id: 'template-3',
    name: '完整数据资产目录模板',
    description: '包含业务、技术、分析的完整目录结构',
    createTime: '2024-01-10',
    structure: [
      {
        id: 't3-1',
        label: '数据资产',
        code: 'ASSET',
        level: 1,
        assetCount: 0,
        enabled: true,
        children: [
          { id: 't3-1-1', label: '业务数据', code: 'BUSINESS', level: 2, assetCount: 0, enabled: true },
          { id: 't3-1-2', label: '技术数据', code: 'TECH', level: 2, assetCount: 0, enabled: true },
          { id: 't3-1-3', label: '分析数据', code: 'ANALYTICS', level: 2, assetCount: 0, enabled: true }
        ]
      }
    ]
  }
])

// 可选的团队列表
const teamOptions = ['数据团队', '业务团队', '技术团队', '运维团队', '分析团队', '用户团队', '订单团队', '商品团队']

// 可选的标签列表
const tagOptions = ['核心业务', '业务', '技术', '系统', '用户', '敏感', '订单', '交易', '商品', '日志', '监控', '性能', '分析', '报表']

// 可选的权限列表
const permissionOptions = ['admin', 'manager', 'business', 'tech', 'analyst', 'viewer']

// 过滤树节点
const filterNode = (value: string, data: DirectoryNode) => {
  if (!value) return true
  return data.label.toLowerCase().includes(value.toLowerCase()) || 
         data.code.toLowerCase().includes(value.toLowerCase())
}

// 监听搜索关键字变化
const handleSearch = () => {
  treeRef.value?.filter(searchKeyword.value)
}

// 清空搜索
const clearSearch = () => {
  searchKeyword.value = ''
  treeRef.value?.filter('')
}

// 节点图标
const getNodeIcon = (data: DirectoryNode, expanded: boolean) => {
  if (data.children && data.children.length > 0) {
    return expanded ? FolderOpened : Folder
  }
  return Document
}

// 节点点击
const handleNodeClick = (data: DirectoryNode) => {
  currentNode.value = data
  isEditMode.value = false
}

// 添加根节点
const handleAddRoot = () => {
  dialogMode.value = 'add'
  dialogTitle.value = '添加根目录'
  resetForm()
  dialogVisible.value = true
}

// 添加子节点
const handleAddChild = (node: DirectoryNode) => {
  if (!node) {
    ElMessage.warning('请先选择父节点')
    return
  }
  if (node.level >= 5) {
    ElMessage.warning('目录层级不能超过5级')
    return
  }
  dialogMode.value = 'addChild'
  dialogTitle.value = `添加子目录 (父节点: ${node.label})`
  resetForm()
  dialogVisible.value = true
}

// 编辑节点
const handleEdit = (node: DirectoryNode) => {
  if (!node) {
    ElMessage.warning('请先选择要编辑的节点')
    return
  }
  dialogMode.value = 'edit'
  dialogTitle.value = '编辑目录'
  formData.value = {
    label: node.label,
    code: node.code,
    description: node.description || '',
    owner: node.owner || '',
    team: node.team || [],
    tags: node.tags || [],
    permissions: node.permissions || [],
    enabled: node.enabled
  }
  dialogVisible.value = true
}

// 删除节点
const handleDelete = async (node: DirectoryNode) => {
  if (!node) {
    ElMessage.warning('请先选择要删除的节点')
    return
  }

  if (node.children && node.children.length > 0) {
    ElMessage.warning('该节点包含子节点，无法删除')
    return
  }

  if (node.assetCount > 0) {
    ElMessage.warning('该目录下存在资产，无法删除')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除目录"${node.label}"吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 模拟删除操作
    setTimeout(() => {
      deleteNodeById(treeData.value, node.id)
      if (currentNode.value?.id === node.id) {
        currentNode.value = null
      }
      ElMessage.success('删除成功')
    }, 300)
  } catch {
    // 用户取消删除
  }
}

// 递归删除节点
const deleteNodeById = (nodes: DirectoryNode[], id: string): boolean => {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === id) {
      nodes.splice(i, 1)
      return true
    }
    if (nodes[i].children) {
      if (deleteNodeById(nodes[i].children!, id)) {
        return true
      }
    }
  }
  return false
}

// 复制节点
const handleCopy = async (node: DirectoryNode) => {
  if (!node) {
    ElMessage.warning('请先选择要复制的节点')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要复制目录"${node.label}"吗？`,
      '复制确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )

    // 模拟复制操作
    setTimeout(() => {
      const copiedNode: DirectoryNode = {
        ...node,
        id: `${node.id}-copy-${Date.now()}`,
        label: `${node.label} (副本)`,
        code: `${node.code}_COPY`,
        assetCount: 0,
        children: undefined // 复制时不包含子节点
      }

      // 添加到父节点下
      if (node.parentId) {
        addNodeToParent(treeData.value, node.parentId, copiedNode)
      } else {
        treeData.value.push(copiedNode)
      }

      ElMessage.success('复制成功')
    }, 300)
  } catch {
    // 用户取消
  }
}

// 添加节点到父节点
const addNodeToParent = (nodes: DirectoryNode[], parentId: string, newNode: DirectoryNode): boolean => {
  for (const node of nodes) {
    if (node.id === parentId) {
      if (!node.children) {
        node.children = []
      }
      node.children.push(newNode)
      return true
    }
    if (node.children) {
      if (addNodeToParent(node.children, parentId, newNode)) {
        return true
      }
    }
  }
  return false
}

// 切换节点状态
const handleToggleStatus = (node: DirectoryNode) => {
  if (!node) {
    ElMessage.warning('请先选择节点')
    return
  }

  // 模拟更新操作
  setTimeout(() => {
    node.enabled = !node.enabled
    ElMessage.success(`已${node.enabled ? '启用' : '停用'}目录"${node.label}"`)
  }, 200)
}

// 节点拖拽开始
const handleDragStart = (node: any, ev: DragEvent) => {
  console.log('drag start', node)
}

// 节点拖拽进入
const handleDragEnter = (draggingNode: any, dropNode: any, ev: DragEvent) => {
  console.log('drag enter', draggingNode, dropNode)
}

// 节点拖拽离开
const handleDragLeave = (draggingNode: any, dropNode: any, ev: DragEvent) => {
  console.log('drag leave', draggingNode, dropNode)
}

// 节点拖拽结束
const handleDragEnd = (draggingNode: any, dropNode: any, dropType: string, ev: DragEvent) => {
  console.log('drag end', draggingNode, dropNode, dropType)
  if (dropType !== 'none') {
    ElMessage.success('目录结构已更新')
  }
}

// 节点是否可拖拽
const allowDrag = (draggingNode: any) => {
  // 根节点不允许拖拽
  return draggingNode.data.level > 1
}

// 节点是否可放置
const allowDrop = (draggingNode: any, dropNode: any, type: string) => {
  // 不允许拖拽到根节点之前或之后
  if (dropNode.data.level === 1 && type !== 'inner') {
    return false
  }
  // 限制最大层级
  if (type === 'inner') {
    return dropNode.data.level < 5
  }
  return true
}

// 重置表单
const resetForm = () => {
  formData.value = {
    label: '',
    code: '',
    description: '',
    owner: '',
    team: [],
    tags: [],
    permissions: [],
    enabled: true
  }
  formRef.value?.clearValidate()
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate((valid) => {
    if (valid) {
      // 检查编码唯一性
      if (dialogMode.value !== 'edit') {
        const codeExists = checkCodeExists(treeData.value, formData.value.code)
        if (codeExists) {
          ElMessage.error('目录编码已存在，请使用其他编码')
          return
        }
      }

      // 模拟提交操作
      setTimeout(() => {
        if (dialogMode.value === 'add') {
          // 添加根节点
          const newNode: DirectoryNode = {
            id: `node-${Date.now()}`,
            label: formData.value.label,
            code: formData.value.code,
            description: formData.value.description,
            level: 1,
            assetCount: 0,
            enabled: formData.value.enabled,
            owner: formData.value.owner,
            team: formData.value.team,
            tags: formData.value.tags,
            permissions: formData.value.permissions,
            createTime: new Date().toISOString().split('T')[0],
            updateTime: new Date().toISOString().split('T')[0]
          }
          treeData.value.push(newNode)
          ElMessage.success('添加成功')
        } else if (dialogMode.value === 'addChild' && currentNode.value) {
          // 添加子节点
          const newNode: DirectoryNode = {
            id: `${currentNode.value.id}-${Date.now()}`,
            label: formData.value.label,
            code: formData.value.code,
            description: formData.value.description,
            parentId: currentNode.value.id,
            level: currentNode.value.level + 1,
            assetCount: 0,
            enabled: formData.value.enabled,
            owner: formData.value.owner,
            team: formData.value.team,
            tags: formData.value.tags,
            permissions: formData.value.permissions,
            createTime: new Date().toISOString().split('T')[0],
            updateTime: new Date().toISOString().split('T')[0]
          }
          if (!currentNode.value.children) {
            currentNode.value.children = []
          }
          currentNode.value.children.push(newNode)
          ElMessage.success('添加成功')
        } else if (dialogMode.value === 'edit' && currentNode.value) {
          // 编辑节点
          currentNode.value.label = formData.value.label
          currentNode.value.code = formData.value.code
          currentNode.value.description = formData.value.description
          currentNode.value.owner = formData.value.owner
          currentNode.value.team = formData.value.team
          currentNode.value.tags = formData.value.tags
          currentNode.value.permissions = formData.value.permissions
          currentNode.value.enabled = formData.value.enabled
          currentNode.value.updateTime = new Date().toISOString().split('T')[0]
          ElMessage.success('更新成功')
        }

        dialogVisible.value = false
      }, 300)
    }
  })
}

// 检查编码是否已存在
const checkCodeExists = (nodes: DirectoryNode[], code: string): boolean => {
  for (const node of nodes) {
    if (node.code === code) {
      return true
    }
    if (node.children && checkCodeExists(node.children, code)) {
      return true
    }
  }
  return false
}

// 展开所有节点
const expandAll = () => {
  const allKeys = getAllNodeKeys(treeData.value)
  allKeys.forEach(key => {
    treeRef.value?.store.nodesMap[key]?.expand()
  })
  ElMessage.success('已展开所有节点')
}

// 折叠所有节点
const collapseAll = () => {
  const allKeys = getAllNodeKeys(treeData.value)
  allKeys.forEach(key => {
    treeRef.value?.store.nodesMap[key]?.collapse()
  })
  ElMessage.success('已折叠所有节点')
}

// 获取所有节点的 key
const getAllNodeKeys = (nodes: DirectoryNode[]): string[] => {
  let keys: string[] = []
  for (const node of nodes) {
    keys.push(node.id)
    if (node.children) {
      keys = keys.concat(getAllNodeKeys(node.children))
    }
  }
  return keys
}

// 刷新目录树
const refreshTree = () => {
  ElMessage.info('正在刷新目录树...')
  setTimeout(() => {
    ElMessage.success('刷新成功')
  }, 500)
}

// 显示模板对话框
const showTemplateDialog = () => {
  templateDialogVisible.value = true
}

// 应用模板
const applyTemplate = (template: DirectoryTemplate) => {
  ElMessageBox.confirm(
    `确定要应用模板"${template.name}"吗？这将在当前目录树中添加模板结构。`,
    '应用模板',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    // 模拟应用模板
    setTimeout(() => {
      // 这里简单演示：将模板结构添加到根节点
      const copiedStructure = JSON.parse(JSON.stringify(template.structure))
      treeData.value.push(...copiedStructure)
      ElMessage.success('模板应用成功')
      templateDialogVisible.value = false
    }, 300)
  }).catch(() => {
    // 用户取消
  })
}

// 导出目录结构
const exportStructure = () => {
  ElMessage.info('正在导出目录结构...')
  setTimeout(() => {
    const dataStr = JSON.stringify(treeData.value, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `directory-structure-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  }, 500)
}

// 导入目录结构
const importStructure = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e: any) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event: any) => {
        try {
          const importedData = JSON.parse(event.target.result)
          ElMessageBox.confirm(
            '导入将覆盖当前目录结构，是否继续？',
            '导入确认',
            {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              type: 'warning'
            }
          ).then(() => {
            treeData.value = importedData
            ElMessage.success('导入成功')
          }).catch(() => {
            // 用户取消
          })
        } catch (error) {
          ElMessage.error('文件格式错误，导入失败')
        }
      }
      reader.readAsText(file)
    }
  }
  input.click()
}

// 验证目录结构
const validateStructure = () => {
  ElMessage.info('正在验证目录结构...')
  
  setTimeout(() => {
    const issues: ValidationIssue[] = []

    // 验证逻辑
    const validate = (nodes: DirectoryNode[], level: number = 1) => {
      for (const node of nodes) {
        // 检查层级深度
        if (level > 5) {
          issues.push({
            type: 'error',
            nodeId: node.id,
            nodeName: node.label,
            message: `目录层级超过限制（当前层级：${level}，最大允许：5）`
          })
        }

        // 检查编码规范
        if (!/^[A-Z0-9_]+$/.test(node.code)) {
          issues.push({
            type: 'error',
            nodeId: node.id,
            nodeName: node.label,
            message: '目录编码不符合规范（只能包含大写字母、数字和下划线）'
          })
        }

        // 检查是否有负责人
        if (!node.owner) {
          issues.push({
            type: 'warning',
            nodeId: node.id,
            nodeName: node.label,
            message: '未设置目录负责人'
          })
        }

        // 检查停用的目录
        if (!node.enabled) {
          issues.push({
            type: 'warning',
            nodeId: node.id,
            nodeName: node.label,
            message: '目录处于停用状态'
          })
        }

        // 递归检查子节点
        if (node.children) {
          validate(node.children, level + 1)
        }
      }
    }

    validate(treeData.value)

    // 检查编码唯一性
    const codes = new Map<string, string[]>()
    const collectCodes = (nodes: DirectoryNode[]) => {
      for (const node of nodes) {
        if (!codes.has(node.code)) {
          codes.set(node.code, [])
        }
        codes.get(node.code)!.push(node.label)
        if (node.children) {
          collectCodes(node.children)
        }
      }
    }
    collectCodes(treeData.value)

    codes.forEach((names, code) => {
      if (names.length > 1) {
        issues.push({
          type: 'error',
          nodeId: '',
          nodeName: names.join(', '),
          message: `编码"${code}"存在重复，涉及节点：${names.join(', ')}`
        })
      }
    })

    validationIssues.value = issues
    validationDialogVisible.value = true

    if (issues.length === 0) {
      ElMessage.success('目录结构验证通过，未发现问题')
    } else {
      const errorCount = issues.filter(i => i.type === 'error').length
      const warningCount = issues.filter(i => i.type === 'warning').length
      ElMessage.warning(`发现 ${errorCount} 个错误，${warningCount} 个警告`)
    }
  }, 800)
}

// 计算统计信息
const statistics = computed(() => {
  let totalNodes = 0
  let enabledNodes = 0
  let disabledNodes = 0
  let totalAssets = 0
  let maxLevel = 0

  const collect = (nodes: DirectoryNode[]) => {
    for (const node of nodes) {
      totalNodes++
      if (node.enabled) {
        enabledNodes++
      } else {
        disabledNodes++
      }
      totalAssets += node.assetCount
      if (node.level > maxLevel) {
        maxLevel = node.level
      }
      if (node.children) {
        collect(node.children)
      }
    }
  }

  collect(treeData.value)

  return {
    totalNodes,
    enabledNodes,
    disabledNodes,
    totalAssets,
    maxLevel
  }
})

onMounted(() => {
  ElMessage.success('目录结构维护页面加载完成')
})
</script>

<template>
  <div class="catalog-structure-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAddRoot">
          添加根目录
        </el-button>
        <el-button :icon="RefreshRight" @click="refreshTree">
          刷新
        </el-button>
        <el-button :icon="Upload" @click="importStructure">
          导入
        </el-button>
        <el-button :icon="Download" @click="exportStructure">
          导出
        </el-button>
        <el-button :icon="Setting" @click="showTemplateDialog">
          模板管理
        </el-button>
        <el-button @click="validateStructure">
          结构验证
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-button link @click="expandAll">展开全部</el-button>
        <el-button link @click="collapseAll">折叠全部</el-button>
      </div>
    </div>

    <!-- 统计信息卡片 -->
    <el-card class="statistics-card" shadow="never">
      <div class="statistics">
        <div class="stat-item">
          <span class="stat-label">目录总数</span>
          <span class="stat-value">{{ statistics.totalNodes }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">启用目录</span>
          <span class="stat-value success">{{ statistics.enabledNodes }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">停用目录</span>
          <span class="stat-value danger">{{ statistics.disabledNodes }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">资产总数</span>
          <span class="stat-value primary">{{ statistics.totalAssets }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">最大层级</span>
          <span class="stat-value">{{ statistics.maxLevel }}</span>
        </div>
      </div>
    </el-card>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 左侧：目录树面板 -->
      <el-card class="tree-panel" shadow="never">
        <template #header>
          <div class="card-header">
            <span>目录结构树</span>
            <el-input
              v-model="searchKeyword"
              placeholder="搜索目录名称或编码"
              :prefix-icon="Search"
              clearable
              @input="handleSearch"
              @clear="clearSearch"
              style="width: 250px"
            />
          </div>
        </template>

        <el-tree
          ref="treeRef"
          :data="treeData"
          node-key="id"
          :props="{ label: 'label', children: 'children' }"
          :filter-node-method="filterNode"
          :expand-on-click-node="false"
          :default-expand-all="false"
          draggable
          :allow-drag="allowDrag"
          :allow-drop="allowDrop"
          @node-click="handleNodeClick"
          @node-drag-start="handleDragStart"
          @node-drag-enter="handleDragEnter"
          @node-drag-leave="handleDragLeave"
          @node-drag-end="handleDragEnd"
          highlight-current
        >
          <template #default="{ node, data }">
            <div class="custom-tree-node">
              <div class="node-content">
                <el-icon class="node-icon" :color="data.enabled ? '#409EFF' : '#909399'">
                  <component :is="getNodeIcon(data, node.expanded)" />
                </el-icon>
                <span class="node-label" :class="{ disabled: !data.enabled }">
                  {{ data.label }}
                </span>
                <el-tag v-if="!data.enabled" size="small" type="info" class="node-tag">
                  停用
                </el-tag>
                <el-tag size="small" class="node-tag">
                  {{ data.assetCount }} 个资产
                </el-tag>
              </div>
              <div class="node-actions" @click.stop>
                <el-tooltip content="添加子目录" placement="top">
                  <el-button
                    link
                    :icon="Plus"
                    size="small"
                    @click="handleAddChild(data)"
                  />
                </el-tooltip>
                <el-tooltip content="编辑" placement="top">
                  <el-button
                    link
                    :icon="Edit"
                    size="small"
                    @click="handleEdit(data)"
                  />
                </el-tooltip>
                <el-tooltip content="复制" placement="top">
                  <el-button
                    link
                    :icon="CopyDocument"
                    size="small"
                    @click="handleCopy(data)"
                  />
                </el-tooltip>
                <el-popconfirm
                  title="确定删除此目录吗？"
                  @confirm="handleDelete(data)"
                >
                  <template #reference>
                    <el-tooltip content="删除" placement="top">
                      <el-button
                        link
                        :icon="Delete"
                        size="small"
                        type="danger"
                      />
                    </el-tooltip>
                  </template>
                </el-popconfirm>
              </div>
            </div>
          </template>
        </el-tree>
      </el-card>

      <!-- 右侧：目录属性编辑区 -->
      <el-card class="detail-panel" shadow="never">
        <template #header>
          <div class="card-header">
            <span>目录详情</span>
            <div v-if="currentNode">
              <el-button
                v-if="!isEditMode"
                size="small"
                type="primary"
                :icon="Edit"
                @click="isEditMode = true"
              >
                编辑
              </el-button>
              <div v-else>
                <el-button size="small" @click="isEditMode = false">
                  取消
                </el-button>
                <el-button
                  size="small"
                  type="primary"
                  @click="handleEdit(currentNode)"
                >
                  保存
                </el-button>
              </div>
            </div>
          </div>
        </template>

        <div v-if="!currentNode" class="empty-state">
          <el-empty description="请选择一个目录节点查看详情" />
        </div>

        <div v-else class="detail-content">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="目录名称">
              {{ currentNode.label }}
            </el-descriptions-item>
            <el-descriptions-item label="目录编码">
              <el-tag>{{ currentNode.code }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="目录层级">
              第 {{ currentNode.level }} 级
            </el-descriptions-item>
            <el-descriptions-item label="资产数量">
              <el-tag type="primary">{{ currentNode.assetCount }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="currentNode.enabled ? 'success' : 'info'">
                {{ currentNode.enabled ? '启用' : '停用' }}
              </el-tag>
              <el-button
                link
                size="small"
                @click="handleToggleStatus(currentNode)"
                style="margin-left: 10px"
              >
                {{ currentNode.enabled ? '停用' : '启用' }}
              </el-button>
            </el-descriptions-item>
            <el-descriptions-item label="负责人">
              {{ currentNode.owner || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="维护团队" :span="2">
              <el-tag
                v-for="team in currentNode.team"
                :key="team"
                size="small"
                style="margin-right: 5px"
              >
                {{ team }}
              </el-tag>
              <span v-if="!currentNode.team || currentNode.team.length === 0">-</span>
            </el-descriptions-item>
            <el-descriptions-item label="业务标签" :span="2">
              <el-tag
                v-for="tag in currentNode.tags"
                :key="tag"
                size="small"
                type="success"
                style="margin-right: 5px"
              >
                {{ tag }}
              </el-tag>
              <span v-if="!currentNode.tags || currentNode.tags.length === 0">-</span>
            </el-descriptions-item>
            <el-descriptions-item label="权限配置" :span="2">
              <el-tag
                v-for="perm in currentNode.permissions"
                :key="perm"
                size="small"
                type="warning"
                style="margin-right: 5px"
              >
                {{ perm }}
              </el-tag>
              <span v-if="!currentNode.permissions || currentNode.permissions.length === 0">-</span>
            </el-descriptions-item>
            <el-descriptions-item label="描述" :span="2">
              {{ currentNode.description || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ currentNode.createTime || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="更新时间">
              {{ currentNode.updateTime || '-' }}
            </el-descriptions-item>
          </el-descriptions>

          <!-- 操作按钮 -->
          <div class="detail-actions">
            <el-button type="primary" :icon="Plus" @click="handleAddChild(currentNode)">
              添加子目录
            </el-button>
            <el-button :icon="Edit" @click="handleEdit(currentNode)">
              编辑目录
            </el-button>
            <el-button :icon="CopyDocument" @click="handleCopy(currentNode)">
              复制目录
            </el-button>
            <el-button
              type="danger"
              :icon="Delete"
              @click="handleDelete(currentNode)"
            >
              删除目录
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="目录名称" prop="label">
          <el-input v-model="formData.label" placeholder="请输入目录名称" />
        </el-form-item>
        <el-form-item label="目录编码" prop="code">
          <el-input
            v-model="formData.code"
            placeholder="请输入目录编码（大写字母、数字、下划线）"
          />
        </el-form-item>
        <el-form-item label="目录描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入目录描述"
          />
        </el-form-item>
        <el-form-item label="负责人" prop="owner">
          <el-input v-model="formData.owner" placeholder="请输入负责人姓名" />
        </el-form-item>
        <el-form-item label="维护团队">
          <el-select
            v-model="formData.team"
            multiple
            placeholder="请选择维护团队"
            style="width: 100%"
          >
            <el-option
              v-for="team in teamOptions"
              :key="team"
              :label="team"
              :value="team"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="业务标签">
          <el-select
            v-model="formData.tags"
            multiple
            placeholder="请选择业务标签"
            style="width: 100%"
          >
            <el-option
              v-for="tag in tagOptions"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="权限配置">
          <el-select
            v-model="formData.permissions"
            multiple
            placeholder="请选择权限"
            style="width: 100%"
          >
            <el-option
              v-for="perm in permissionOptions"
              :key="perm"
              :label="perm"
              :value="perm"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="formData.enabled"
            active-text="启用"
            inactive-text="停用"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 模板管理对话框 -->
    <el-dialog
      v-model="templateDialogVisible"
      title="目录模板管理"
      width="800px"
    >
      <div class="template-list">
        <el-row :gutter="20">
          <el-col
            v-for="template in templates"
            :key="template.id"
            :span="24"
            style="margin-bottom: 15px"
          >
            <el-card shadow="hover" class="template-card">
              <div class="template-header">
                <div>
                  <h4>{{ template.name }}</h4>
                  <p class="template-desc">{{ template.description }}</p>
                  <p class="template-time">创建时间：{{ template.createTime }}</p>
                </div>
                <el-button type="primary" size="small" @click="applyTemplate(template)">
                  应用模板
                </el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
      <template #footer>
        <el-button @click="templateDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 验证结果对话框 -->
    <el-dialog
      v-model="validationDialogVisible"
      title="目录结构验证结果"
      width="700px"
    >
      <div v-if="validationIssues.length === 0" class="validation-success">
        <el-result icon="success" title="验证通过" sub-title="目录结构符合规范，未发现问题" />
      </div>
      <div v-else>
        <el-alert
          :title="`发现 ${validationIssues.filter(i => i.type === 'error').length} 个错误，${validationIssues.filter(i => i.type === 'warning').length} 个警告`"
          type="warning"
          :closable="false"
          style="margin-bottom: 15px"
        />
        <el-table :data="validationIssues" border style="width: 100%">
          <el-table-column label="类型" width="80">
            <template #default="{ row }">
              <el-tag :type="row.type === 'error' ? 'danger' : 'warning'" size="small">
                {{ row.type === 'error' ? '错误' : '警告' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="nodeName" label="节点名称" width="150" />
          <el-table-column prop="message" label="问题描述" />
        </el-table>
      </div>
      <template #footer>
        <el-button type="primary" @click="validationDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.catalog-structure-container {
  min-height: calc(100vh - 120px);

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 15px 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

    .toolbar-left {
      display: flex;
      gap: 10px;
    }

    .toolbar-right {
      display: flex;
      gap: 5px;
    }
  }

  .statistics-card {
    margin-bottom: 20px;

    .statistics {
      display: flex;
      justify-content: space-around;
      align-items: center;

      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;

        .stat-label {
          font-size: 14px;
          color: #909399;
        }

        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #303133;

          &.success {
            color: #67c23a;
          }

          &.danger {
            color: #f56c6c;
          }

          &.primary {
            color: #409eff;
          }
        }
      }
    }
  }

  .main-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;

    .tree-panel,
    .detail-panel {
      height: calc(100vh - 350px);
      min-height: 500px;

      :deep(.el-card__body) {
        height: calc(100% - 60px);
        overflow-y: auto;
      }
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 500;
    }

    .custom-tree-node {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      padding-right: 10px;

      .node-content {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;

        .node-icon {
          font-size: 16px;
        }

        .node-label {
          font-size: 14px;

          &.disabled {
            color: #909399;
            text-decoration: line-through;
          }
        }

        .node-tag {
          margin-left: 5px;
        }
      }

      .node-actions {
        display: none;
        gap: 2px;
      }

      &:hover .node-actions {
        display: flex;
      }
    }

    .empty-state {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
    }

    .detail-content {
      .detail-actions {
        margin-top: 20px;
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
    }
  }

  .template-list {
    .template-card {
      .template-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        h4 {
          margin: 0 0 8px 0;
          font-size: 16px;
          color: #303133;
        }

        .template-desc {
          margin: 0 0 5px 0;
          font-size: 14px;
          color: #606266;
        }

        .template-time {
          margin: 0;
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }

  .validation-success {
    padding: 20px;
  }
}

:deep(.el-tree-node__content) {
  height: 40px;
  padding: 5px 0;
}

:deep(.el-tree-node__content:hover) {
  background-color: #f5f7fa;
}
</style>