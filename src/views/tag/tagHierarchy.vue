<template>
  <div class="tag-hierarchy p-5">
    <div class="mb-4">
      <h2 class="text-2xl font-bold mb-2">标签层级关系</h2>
      <p class="text-gray-600">管理标签的分类体系和层级结构，构建清晰的标签组织架构，支持多级分类</p>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <!-- 左侧：树形结构 -->
      <el-card>
        <template #header>
          <div class="flex justify-between items-center">
            <span class="font-semibold">标签分类树</span>
            <div>
              <el-button type="primary" size="small" @click="handleAddCategory">
                <el-icon><Plus /></el-icon>
                新增分类
              </el-button>
              <el-button type="success" size="small" @click="handleAddTag">
                <el-icon><Plus /></el-icon>
                添加标签
              </el-button>
            </div>
          </div>
        </template>

        <el-input
          v-model="treeSearchText"
          placeholder="搜索分类或标签"
          class="mb-4"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-tree
          ref="treeRef"
          :data="treeData"
          :props="treeProps"
          :expand-on-click-node="false"
          :default-expand-all="false"
          node-key="id"
          highlight-current
          @node-click="handleNodeClick"
        >
          <template #default="{ node, data }">
            <div class="flex items-center justify-between w-full">
              <div class="flex items-center">
                <el-icon v-if="data.type === 'category'" class="mr-2 text-blue-500">
                  <Folder />
                </el-icon>
                <el-icon v-else class="mr-2 text-green-500">
                  <Document />
                </el-icon>
                <span>{{ node.label }}</span>
                <el-tag v-if="data.type === 'tag'" size="small" class="ml-2">
                  {{ data.tagCode }}
                </el-tag>
              </div>
              <div class="flex gap-1">
                <el-button
                  link
                  type="primary"
                  size="small"
                  @click.stop="handleEditNode(data)"
                >
                  编辑
                </el-button>
                <el-button
                  link
                  type="danger"
                  size="small"
                  @click.stop="handleDeleteNode(data)"
                >
                  删除
                </el-button>
              </div>
            </div>
          </template>
        </el-tree>
      </el-card>

      <!-- 右侧：详情信息 -->
      <el-card>
        <template #header>
          <span class="font-semibold">分类/标签详情</span>
        </template>

        <div v-if="selectedNode" class="detail-content">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="名称">
              {{ selectedNode.name }}
            </el-descriptions-item>
            <el-descriptions-item label="类型">
              <el-tag :type="selectedNode.type === 'category' ? 'primary' : 'success'">
                {{ selectedNode.type === 'category' ? '分类' : '标签' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item v-if="selectedNode.tagCode" label="标签编码">
              {{ selectedNode.tagCode }}
            </el-descriptions-item>
            <el-descriptions-item label="层级路径">
              {{ getNodePath(selectedNode) }}
            </el-descriptions-item>
            <el-descriptions-item label="描述">
              {{ selectedNode.description || '-' }}
            </el-descriptions-item>
            <el-descriptions-item v-if="selectedNode.type === 'category'" label="子节点数量">
              {{ getChildrenCount(selectedNode) }}
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ selectedNode.createTime || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
        <div v-else class="text-center text-gray-400 py-20">
          <el-icon :size="64" class="mb-2"><InfoFilled /></el-icon>
          <p>请选择左侧树节点查看详情</p>
        </div>
      </el-card>
    </div>

    <!-- 新增/编辑分类对话框 -->
    <el-dialog
      v-model="categoryDialogVisible"
      :title="categoryDialogTitle"
      width="500px"
      @close="handleCategoryDialogClose"
    >
      <el-form :model="categoryFormData" label-width="100px">
        <el-form-item label="分类名称" required>
          <el-input v-model="categoryFormData.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="父分类">
          <el-select
            v-model="categoryFormData.parentId"
            placeholder="请选择父分类（可选）"
            clearable
            filterable
            class="w-full"
          >
            <el-option
              v-for="cat in categoryOptions"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="categoryFormData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入分类描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCategorySubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 添加标签对话框 -->
    <el-dialog
      v-model="tagDialogVisible"
      title="添加标签到分类"
      width="500px"
      @close="handleTagDialogClose"
    >
      <el-form :model="tagFormData" label-width="100px">
        <el-form-item label="选择标签" required>
          <el-select v-model="tagFormData.tagId" placeholder="请选择标签" filterable class="w-full">
            <el-option
              v-for="tag in availableTags"
              :key="tag.value"
              :label="tag.label"
              :value="tag.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="选择分类" required>
          <el-select
            v-model="tagFormData.categoryId"
            placeholder="请选择分类"
            filterable
            class="w-full"
          >
            <el-option
              v-for="cat in categoryOptions"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="tagDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleTagSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Folder, Document, InfoFilled } from '@element-plus/icons-vue'

interface TreeNode {
  id: string
  name: string
  type: 'category' | 'tag'
  tagCode?: string
  description?: string
  parentId?: string
  createTime?: string
  children?: TreeNode[]
}

// Mock 数据 - 树形结构
const mockTreeData: TreeNode[] = [
  {
    id: 'cat1',
    name: '用户行为',
    type: 'category',
    description: '用户行为相关标签',
    createTime: '2024-01-15 10:30:00',
    children: [
      {
        id: 'tag1',
        name: '用户活跃度',
        type: 'tag',
        tagCode: 'TAG001',
        description: '基于用户最近30天的登录频率和操作次数计算',
        parentId: 'cat1',
        createTime: '2024-01-15 10:30:00',
      },
      {
        id: 'tag5',
        name: '流失风险',
        type: 'tag',
        tagCode: 'TAG005',
        description: '预测用户在未来30天内流失的概率',
        parentId: 'cat1',
        createTime: '2024-01-19 16:30:00',
      },
    ],
  },
  {
    id: 'cat2',
    name: '客户价值',
    type: 'category',
    description: '客户价值相关标签',
    createTime: '2024-01-16 14:20:00',
    children: [
      {
        id: 'tag2',
        name: '高价值客户',
        type: 'tag',
        tagCode: 'TAG002',
        description: '近一年消费金额超过10万元的客户',
        parentId: 'cat2',
        createTime: '2024-01-16 14:20:00',
      },
    ],
  },
  {
    id: 'cat3',
    name: '用户画像',
    type: 'category',
    description: '用户画像相关标签',
    createTime: '2024-01-17 09:15:00',
    children: [
      {
        id: 'tag3',
        name: '产品偏好',
        type: 'tag',
        tagCode: 'TAG003',
        description: '基于机器学习模型预测的用户产品偏好',
        parentId: 'cat3',
        createTime: '2024-01-17 09:15:00',
      },
      {
        id: 'cat3-1',
        name: '用户属性',
        type: 'category',
        description: '用户基础属性',
        parentId: 'cat3',
        createTime: '2024-01-18 11:45:00',
        children: [
          {
            id: 'tag4',
            name: '注册渠道',
            type: 'tag',
            tagCode: 'TAG004',
            description: '用户注册时的来源渠道',
            parentId: 'cat3-1',
            createTime: '2024-01-18 11:45:00',
          },
        ],
      },
    ],
  },
]

const treeData = ref<TreeNode[]>(mockTreeData)
const treeRef = ref()
const treeSearchText = ref('')
const selectedNode = ref<TreeNode | null>(null)
const categoryDialogVisible = ref(false)
const tagDialogVisible = ref(false)
const categoryDialogTitle = ref('新增分类')
const categoryFormData = ref({
  name: '',
  parentId: '',
  description: '',
})
const tagFormData = ref({
  tagId: '',
  categoryId: '',
})

const treeProps = {
  children: 'children',
  label: 'name',
}

const availableTags = [
  { label: '用户活跃度 (TAG001)', value: 'tag1' },
  { label: '高价值客户 (TAG002)', value: 'tag2' },
  { label: '产品偏好 (TAG003)', value: 'tag3' },
  { label: '注册渠道 (TAG004)', value: 'tag4' },
  { label: '流失风险 (TAG005)', value: 'tag5' },
]

const categoryOptions = computed(() => {
  const categories: Array<{ id: string; name: string }> = []
  const traverse = (nodes: TreeNode[]) => {
    nodes.forEach((node) => {
      if (node.type === 'category') {
        categories.push({ id: node.id, name: node.name })
        if (node.children) {
          traverse(node.children)
        }
      }
    })
  }
  traverse(treeData.value)
  return categories
})

const handleNodeClick = (data: TreeNode) => {
  selectedNode.value = data
}

const handleAddCategory = () => {
  categoryDialogTitle.value = '新增分类'
  categoryFormData.value = {
    name: '',
    parentId: '',
    description: '',
  }
  categoryDialogVisible.value = true
}

const handleAddTag = () => {
  tagFormData.value = {
    tagId: '',
    categoryId: '',
  }
  tagDialogVisible.value = true
}

const handleEditNode = (data: TreeNode) => {
  if (data.type === 'category') {
    categoryDialogTitle.value = '编辑分类'
    categoryFormData.value = {
      name: data.name,
      parentId: data.parentId || '',
      description: data.description || '',
    }
    categoryDialogVisible.value = true
  } else {
    ElMessage.info('标签信息请在标签基本信息页面编辑')
  }
}

const handleDeleteNode = (data: TreeNode) => {
  ElMessageBox.confirm(
    `确定要删除${data.type === 'category' ? '分类' : '标签'} "${data.name}" 吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(() => {
      const deleteNode = (nodes: TreeNode[], targetId: string): boolean => {
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].id === targetId) {
            nodes.splice(i, 1)
            return true
          }
          if (nodes[i].children && deleteNode(nodes[i].children!, targetId)) {
            return true
          }
        }
        return false
      }
      deleteNode(treeData.value, data.id)
      if (selectedNode.value?.id === data.id) {
        selectedNode.value = null
      }
      ElMessage.success('删除成功')
    })
    .catch(() => {})
}

const handleCategorySubmit = () => {
  if (!categoryFormData.value.name) {
    ElMessage.warning('请输入分类名称')
    return
  }

  const newCategory: TreeNode = {
    id: `cat${Date.now()}`,
    name: categoryFormData.value.name,
    type: 'category',
    description: categoryFormData.value.description,
    parentId: categoryFormData.value.parentId || undefined,
    createTime: new Date().toLocaleString('zh-CN'),
    children: [],
  }

  if (categoryFormData.value.parentId) {
    const addToParent = (nodes: TreeNode[], parentId: string): boolean => {
      for (const node of nodes) {
        if (node.id === parentId && node.type === 'category') {
          if (!node.children) {
            node.children = []
          }
          node.children.push(newCategory)
          return true
        }
        if (node.children && addToParent(node.children, parentId)) {
          return true
        }
      }
      return false
    }
    addToParent(treeData.value, categoryFormData.value.parentId)
  } else {
    treeData.value.push(newCategory)
  }

  ElMessage.success('操作成功')
  categoryDialogVisible.value = false
}

const handleTagSubmit = () => {
  if (!tagFormData.value.tagId || !tagFormData.value.categoryId) {
    ElMessage.warning('请选择标签和分类')
    return
  }

  const tag = availableTags.find((t) => t.value === tagFormData.value.tagId)
  if (!tag) {
    ElMessage.error('标签不存在')
    return
  }

  const newTag: TreeNode = {
    id: tagFormData.value.tagId,
    name: tag.label.split(' (')[0],
    type: 'tag',
    tagCode: tag.label.match(/\(([^)]+)\)/)?.[1] || '',
    parentId: tagFormData.value.categoryId,
    createTime: new Date().toLocaleString('zh-CN'),
  }

  const addToCategory = (nodes: TreeNode[], categoryId: string): boolean => {
    for (const node of nodes) {
      if (node.id === categoryId && node.type === 'category') {
        if (!node.children) {
          node.children = []
        }
        node.children.push(newTag)
        return true
      }
      if (node.children && addToCategory(node.children, categoryId)) {
        return true
      }
    }
    return false
  }

  if (addToCategory(treeData.value, tagFormData.value.categoryId)) {
    ElMessage.success('添加成功')
    tagDialogVisible.value = false
  } else {
    ElMessage.error('添加失败')
  }
}

const handleCategoryDialogClose = () => {
  categoryFormData.value = {
    name: '',
    parentId: '',
    description: '',
  }
}

const handleTagDialogClose = () => {
  tagFormData.value = {
    tagId: '',
    categoryId: '',
  }
}

const getNodePath = (node: TreeNode): string => {
  const path: string[] = []
  const findPath = (nodes: TreeNode[], targetId: string, currentPath: string[]): boolean => {
    for (const n of nodes) {
      const newPath = [...currentPath, n.name]
      if (n.id === targetId) {
        path.push(...newPath)
        return true
      }
      if (n.children && findPath(n.children, targetId, newPath)) {
        return true
      }
    }
    return false
  }
  findPath(treeData.value, node.id, [])
  return path.join(' / ') || node.name
}

const getChildrenCount = (node: TreeNode): number => {
  if (!node.children) return 0
  return node.children.length
}
</script>

<style scoped lang="scss">
.tag-hierarchy {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.detail-content {
  min-height: 400px;
}
</style>

