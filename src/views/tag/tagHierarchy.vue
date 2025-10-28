<template>
  <div class="tag-hierarchy-container">
    <!-- 顶部操作区 -->
    <el-card class="header-card" shadow="never">
      <div class="header-actions">
        <div class="search-area">
          <el-input
            v-model="searchText"
            placeholder="搜索名称、编码、类型"
            clearable
            style="width: 300px"
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-select
            v-model="filterStatus"
            placeholder="状态筛选"
            clearable
            style="width: 150px; margin-left: 10px"
            @change="handleFilter"
          >
            <el-option label="已启用" :value="1" />
            <el-option label="已停用" :value="0" />
          </el-select>

          <el-select
            v-model="filterType"
            placeholder="类型筛选"
            clearable
            style="width: 150px; margin-left: 10px"
            @change="handleFilter"
          >
            <el-option label="分类" value="category" />
            <el-option label="标签" value="tag" />
          </el-select>
        </div>

        <div class="action-buttons">
          <el-button type="primary" @click="handleAdd(null)">
            <el-icon><Plus /></el-icon>
            新增根节点
          </el-button>
          <el-button @click="handleExpandAll">
            <el-icon><Fold /></el-icon>
            展开全部
          </el-button>
          <el-button @click="handleCollapseAll">
            <el-icon><Expand /></el-icon>
            折叠全部
          </el-button>
          <el-button @click="handleExport">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
          <el-button @click="handleImportClick">
            <el-icon><Upload /></el-icon>
            导入
          </el-button>
          <el-dropdown v-if="selectedNodes.length > 0" style="margin-left: 10px">
            <el-button type="warning">
              批量操作({{ selectedNodes.length }})
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleBatchEnable">批量启用</el-dropdown-item>
                <el-dropdown-item @click="handleBatchDisable">批量停用</el-dropdown-item>
                <el-dropdown-item @click="handleBatchMove">批量移动</el-dropdown-item>
                <el-dropdown-item @click="handleBatchDelete" divided>批量删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </el-card>

    <!-- 主体内容区 -->
    <div class="main-content">
      <!-- 左侧树形视图 -->
      <el-card class="tree-card" shadow="never">
        <template #header>
          <div class="tree-header">
            <span>层级结构</span>
            <el-checkbox v-model="showCheckbox" label="显示复选框" size="small" />
          </div>
        </template>

        <el-tree
          ref="treeRef"
          :data="treeData"
          :props="treeProps"
          :filter-node-method="filterNode"
          :show-checkbox="showCheckbox"
          :expand-on-click-node="false"
          :default-expand-all="false"
          :draggable="true"
          :allow-drop="allowDrop"
          :allow-drag="allowDrag"
          node-key="id"
          highlight-current
          @node-click="handleNodeClick"
          @check="handleNodeCheck"
          @node-drop="handleNodeDrop"
        >
          <template #default="{ node, data }">
            <div class="custom-tree-node">
              <div class="node-label">
                <el-icon v-if="data.type === 'category'" style="color: #409eff">
                  <Folder />
                </el-icon>
                <el-icon v-else style="color: #67c23a">
                  <PriceTag />
                </el-icon>
                <span class="node-name">{{ node.label }}</span>
                <el-tag v-if="data.code" size="small" type="info" style="margin-left: 8px">
                  {{ data.code }}
                </el-tag>
                <el-tag
                  :type="data.status === 1 ? 'success' : 'info'"
                  size="small"
                  style="margin-left: 8px"
                >
                  {{ data.status === 1 ? '启用' : '停用' }}
                </el-tag>
                <span v-if="data.children && data.children.length > 0" class="node-count">
                  ({{ data.children.length }})
                </span>

                <!-- 审批状态 -->
                <el-tag
                  v-if="data.approvalStatus && data.approvalStatus !== 'approved'"
                  :type="getApprovalTagType(data.approvalStatus)"
                  size="small"
                  style="margin-left: 8px"
                >
                  {{ getApprovalStatusText(data.approvalStatus) }}
                </el-tag>
              </div>

              <div class="node-actions" @click.stop>
                <el-button
                  text
                  type="primary"
                  size="small"
                  @click="handleAdd(data)"
                >
                  <el-icon><Plus /></el-icon>
                </el-button>
                <el-button
                  text
                  type="primary"
                  size="small"
                  @click="handleEdit(data)"
                >
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button
                  text
                  type="danger"
                  size="small"
                  @click="handleDelete(data)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
                <el-dropdown trigger="click" @command="(cmd) => handleNodeCommand(cmd, data)">
                  <el-button text type="primary" size="small">
                    <el-icon><More /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="moveUp">上移</el-dropdown-item>
                      <el-dropdown-item command="moveDown">下移</el-dropdown-item>
                      <el-dropdown-item command="copy">复制</el-dropdown-item>
                      <el-dropdown-item command="submitApproval" divided>提交审批</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </template>
        </el-tree>

        <el-empty v-if="!treeData || treeData.length === 0" description="暂无数据" />
      </el-card>

      <!-- 右侧详情与列表 -->
      <div class="detail-area">
        <!-- 节点详情 -->
        <el-card v-if="currentNode" class="detail-card" shadow="never">
          <template #header>
            <div class="detail-header">
              <span>节点详情</span>
              <el-button text type="primary" @click="handleEdit(currentNode)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
            </div>
          </template>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="名称">
              {{ currentNode.name }}
            </el-descriptions-item>
            <el-descriptions-item label="编码">
              {{ currentNode.code || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="类型">
              <el-tag :type="currentNode.type === 'category' ? 'primary' : 'success'">
                {{ currentNode.type === 'category' ? '分类' : '标签' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-switch
                v-model="currentNode.status"
                :active-value="1"
                :inactive-value="0"
                @change="handleStatusChange(currentNode)"
              />
            </el-descriptions-item>
            <el-descriptions-item label="是否叶子节点">
              {{ currentNode.isLeaf ? '是' : '否' }}
            </el-descriptions-item>
            <el-descriptions-item label="排序">
              {{ currentNode.sort || 0 }}
            </el-descriptions-item>
            <el-descriptions-item label="负责人">
              {{ currentNode.owner || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ currentNode.createTime || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="描述" :span="2">
              {{ currentNode.description || '-' }}
            </el-descriptions-item>
          </el-descriptions>

          <el-divider />

          <div class="statistics">
            <el-statistic title="子节点数量" :value="getChildrenCount(currentNode)" />
            <el-statistic title="关联标签数量" :value="currentNode.tagCount || 0" />
            <el-statistic title="使用场景" :value="currentNode.usageCount || 0" />
          </div>
        </el-card>

        <el-empty v-else description="请选择一个节点查看详情" style="margin-top: 100px" />

        <!-- 子节点列表 -->
        <el-card v-if="currentNode" class="children-card" shadow="never" style="margin-top: 16px">
          <template #header>
            <div class="children-header">
              <span>直接子节点 ({{ childrenTableData.length }})</span>
              <el-button text type="primary" @click="handleAdd(currentNode)">
                <el-icon><Plus /></el-icon>
                新增子节点
              </el-button>
            </div>
          </template>

          <el-table
            :data="paginatedChildren"
            border
            stripe
            style="width: 100%"
          >
            <el-table-column prop="name" label="名称" min-width="150" />
            <el-table-column prop="code" label="编码" width="120" />
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag :type="row.type === 'category' ? 'primary' : 'success'" size="small">
                  {{ row.type === 'category' ? '分类' : '标签' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                  {{ row.status === 1 ? '启用' : '停用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="sort" label="排序" width="80" />
            <el-table-column prop="owner" label="负责人" width="120" />
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button text type="primary" size="small" @click="handleEdit(row)">
                  编辑
                </el-button>
                <el-button text type="danger" size="small" @click="handleDelete(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-if="childrenTableData.length > childrenPageSize"
            v-model:current-page="childrenCurrentPage"
            v-model:page-size="childrenPageSize"
            :total="childrenTableData.length"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            style="margin-top: 16px; justify-content: flex-end"
          />
        </el-card>
      </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入名称" />
        </el-form-item>

        <el-form-item label="编码" prop="code">
          <el-input v-model="formData.code" placeholder="请输入编码" />
        </el-form-item>

        <el-form-item label="父级节点" prop="parentId">
          <el-tree-select
            v-model="formData.parentId"
            :data="treeData"
            :props="treeProps"
            :render-after-expand="false"
            check-strictly
            placeholder="请选择父级节点（不选则为根节点）"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="formData.type">
            <el-radio label="category">分类</el-radio>
            <el-radio label="tag">标签</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="排序" prop="sort">
          <el-input-number
            v-model="formData.sort"
            :min="0"
            :max="9999"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="是否叶子节点">
          <el-switch v-model="formData.isLeaf" />
        </el-form-item>

        <el-form-item label="启用状态">
          <el-switch
            v-model="formData.status"
            :active-value="1"
            :inactive-value="0"
          />
        </el-form-item>

        <el-form-item label="负责人" prop="owner">
          <el-input v-model="formData.owner" placeholder="请输入负责人" />
        </el-form-item>

        <el-form-item label="描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="saveLoading"
          @click="handleSave"
        >
          保存
        </el-button>
        <el-button
          v-if="!formData.id"
          type="success"
          :loading="saveLoading"
          @click="handleSaveAndSubmit"
        >
          保存并提交审批
        </el-button>
      </template>
    </el-dialog>

    <!-- 批量移动对话框 -->
    <el-dialog
      v-model="batchMoveVisible"
      title="批量移动"
      width="500px"
    >
      <el-form label-width="100px">
        <el-form-item label="目标父节点">
          <el-tree-select
            v-model="batchMoveTarget"
            :data="treeData"
            :props="treeProps"
            :render-after-expand="false"
            check-strictly
            placeholder="请选择目标父节点"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="batchMoveVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmBatchMove">确定</el-button>
      </template>
    </el-dialog>

    <!-- 导入对话框 -->
    <el-dialog
      v-model="importVisible"
      title="导入层级结构"
      width="600px"
    >
      <el-upload
        ref="uploadRef"
        drag
        :auto-upload="false"
        :limit="1"
        accept=".json,.csv"
        :on-change="handleFileChange"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          拖拽文件到此处或 <em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持 JSON 或 CSV 格式文件
          </div>
        </template>
      </el-upload>

      <el-alert
        v-if="importResult"
        :title="importResult.title"
        :type="importResult.type"
        :description="importResult.description"
        show-icon
        style="margin-top: 16px"
      />

      <template #footer>
        <el-button @click="importVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="importLoading"
          @click="confirmImport"
        >
          确认导入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox, ElLoading, ElNotification } from 'element-plus'
import type { ElTree, FormInstance, FormRules } from 'element-plus'
import type Node from 'element-plus/es/components/tree/src/model/node'

// 图标
import {
  Search,
  Plus,
  Edit,
  Delete,
  Download,
  Upload,
  Fold,
  Expand,
  ArrowDown,
  Folder,
  PriceTag,
  More,
  UploadFilled
} from '@element-plus/icons-vue'

// ==================== 类型定义 ====================
interface TagHierarchyNode {
  id: string
  name: string
  code?: string
  parentId?: string | null
  type: 'category' | 'tag'
  sort?: number
  isLeaf?: boolean
  status: number // 0-停用 1-启用
  owner?: string
  description?: string
  createTime?: string
  updateTime?: string
  children?: TagHierarchyNode[]
  tagCount?: number // 关联标签数量
  usageCount?: number // 使用场景数量
  approvalStatus?: 'draft' | 'pending' | 'approved' | 'rejected' // 审批状态
}

interface ImportResult {
  title: string
  type: 'success' | 'warning' | 'error'
  description: string
}

// ==================== 响应式数据 ====================
const treeRef = ref<InstanceType<typeof ElTree>>()
const formRef = ref<FormInstance>()
const uploadRef = ref()

// 树形数据
const treeData = ref<TagHierarchyNode[]>([])
const treeProps = {
  label: 'name',
  children: 'children'
}

// 搜索和筛选
const searchText = ref('')
const filterStatus = ref<number>()
const filterType = ref<string>()

// 当前选中节点
const currentNode = ref<TagHierarchyNode | null>(null)
const selectedNodes = ref<TagHierarchyNode[]>([])
const showCheckbox = ref(false)

// 对话框
const dialogVisible = ref(false)
const dialogTitle = computed(() => formData.value.id ? '编辑节点' : '新增节点')
const saveLoading = ref(false)

// 表单数据
const formData = ref<Partial<TagHierarchyNode>>({
  name: '',
  code: '',
  parentId: null,
  type: 'category',
  sort: 0,
  isLeaf: false,
  status: 1,
  owner: '',
  description: ''
})

// 表单校验规则
const formRules: FormRules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入编码', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }]
}

// 批量操作
const batchMoveVisible = ref(false)
const batchMoveTarget = ref<string>()

// 导入导出
const importVisible = ref(false)
const importLoading = ref(false)
const importResult = ref<ImportResult | null>(null)
const importFile = ref<File | null>(null)

// 子节点表格分页
const childrenCurrentPage = ref(1)
const childrenPageSize = ref(10)
const childrenTableData = computed(() => {
  if (!currentNode.value || !currentNode.value.children) return []
  return currentNode.value.children
})
const paginatedChildren = computed(() => {
  const start = (childrenCurrentPage.value - 1) * childrenPageSize.value
  const end = start + childrenPageSize.value
  return childrenTableData.value.slice(start, end)
})

// ==================== Mock 数据初始化 ====================
function generateMockData(): TagHierarchyNode[] {
  return [
    {
      id: '1',
      name: '用户标签',
      code: 'USER_TAG',
      type: 'category',
      sort: 1,
      status: 1,
      owner: '张三',
      createTime: '2024-01-01 10:00:00',
      tagCount: 15,
      usageCount: 120,
      approvalStatus: 'approved',
      children: [
        {
          id: '1-1',
          name: '用户属性',
          code: 'USER_ATTR',
          parentId: '1',
          type: 'category',
          sort: 1,
          status: 1,
          owner: '张三',
          createTime: '2024-01-02 10:00:00',
          tagCount: 8,
          usageCount: 50,
          children: [
            {
              id: '1-1-1',
              name: '年龄段',
              code: 'AGE_GROUP',
              parentId: '1-1',
              type: 'tag',
              sort: 1,
              isLeaf: true,
              status: 1,
              owner: '张三',
              description: '用户年龄段分类',
              createTime: '2024-01-03 10:00:00',
              tagCount: 0,
              usageCount: 20
            },
            {
              id: '1-1-2',
              name: '性别',
              code: 'GENDER',
              parentId: '1-1',
              type: 'tag',
              sort: 2,
              isLeaf: true,
              status: 1,
              owner: '张三',
              description: '用户性别',
              createTime: '2024-01-03 11:00:00',
              tagCount: 0,
              usageCount: 30
            }
          ]
        },
        {
          id: '1-2',
          name: '用户行为',
          code: 'USER_BEHAVIOR',
          parentId: '1',
          type: 'category',
          sort: 2,
          status: 1,
          owner: '李四',
          createTime: '2024-01-02 11:00:00',
          tagCount: 7,
          usageCount: 70,
          children: [
            {
              id: '1-2-1',
              name: '活跃度',
              code: 'ACTIVITY',
              parentId: '1-2',
              type: 'tag',
              sort: 1,
              isLeaf: true,
              status: 1,
              owner: '李四',
              description: '用户活跃度等级',
              createTime: '2024-01-03 12:00:00',
              tagCount: 0,
              usageCount: 40
            },
            {
              id: '1-2-2',
              name: '消费能力',
              code: 'CONSUMPTION',
              parentId: '1-2',
              type: 'tag',
              sort: 2,
              isLeaf: true,
              status: 0,
              owner: '李四',
              description: '用户消费能力评估',
              createTime: '2024-01-03 13:00:00',
              tagCount: 0,
              usageCount: 30,
              approvalStatus: 'pending'
            }
          ]
        }
      ]
    },
    {
      id: '2',
      name: '商品标签',
      code: 'PRODUCT_TAG',
      type: 'category',
      sort: 2,
      status: 1,
      owner: '王五',
      createTime: '2024-01-01 11:00:00',
      tagCount: 12,
      usageCount: 90,
      children: [
        {
          id: '2-1',
          name: '商品分类',
          code: 'PRODUCT_CATEGORY',
          parentId: '2',
          type: 'category',
          sort: 1,
          status: 1,
          owner: '王五',
          createTime: '2024-01-02 12:00:00',
          tagCount: 6,
          usageCount: 45,
          children: [
            {
              id: '2-1-1',
              name: '电子产品',
              code: 'ELECTRONICS',
              parentId: '2-1',
              type: 'tag',
              sort: 1,
              isLeaf: true,
              status: 1,
              owner: '王五',
              description: '电子产品分类',
              createTime: '2024-01-03 14:00:00',
              tagCount: 0,
              usageCount: 25
            }
          ]
        },
        {
          id: '2-2',
          name: '价格区间',
          code: 'PRICE_RANGE',
          parentId: '2',
          type: 'category',
          sort: 2,
          status: 1,
          owner: '王五',
          createTime: '2024-01-02 13:00:00',
          tagCount: 6,
          usageCount: 45,
          approvalStatus: 'draft'
        }
      ]
    },
    {
      id: '3',
      name: '营销标签',
      code: 'MARKETING_TAG',
      type: 'category',
      sort: 3,
      status: 0,
      owner: '赵六',
      description: '营销活动相关标签',
      createTime: '2024-01-01 12:00:00',
      tagCount: 5,
      usageCount: 30,
      approvalStatus: 'rejected'
    }
  ]
}

// 初始化数据
treeData.value = generateMockData()

// ==================== 工具函数 ====================
// 生成唯一ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 查找节点
function findNode(
  nodes: TagHierarchyNode[],
  id: string
): TagHierarchyNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findNode(node.children, id)
      if (found) return found
    }
  }
  return null
}

// 删除节点
function removeNode(nodes: TagHierarchyNode[], id: string): boolean {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === id) {
      nodes.splice(i, 1)
      return true
    }
    if (nodes[i].children) {
      if (removeNode(nodes[i].children!, id)) {
        return true
      }
    }
  }
  return false
}

// 获取子节点数量
function getChildrenCount(node: TagHierarchyNode): number {
  if (!node.children) return 0
  let count = node.children.length
  node.children.forEach(child => {
    count += getChildrenCount(child)
  })
  return count
}

// 审批状态文本
function getApprovalStatusText(status?: string): string {
  const map: Record<string, string> = {
    draft: '草稿',
    pending: '待审批',
    approved: '已通过',
    rejected: '已驳回'
  }
  return map[status || ''] || ''
}

// 审批状态标签类型
function getApprovalTagType(status?: string): string {
  const map: Record<string, string> = {
    draft: 'info',
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return map[status || ''] || 'info'
}

// ==================== 搜索与筛选 ====================
function filterNode(value: string, data: TagHierarchyNode) {
  if (!value) return true
  const searchLower = value.toLowerCase()
  return (
    data.name.toLowerCase().includes(searchLower) ||
    data.code?.toLowerCase().includes(searchLower) ||
    data.type.toLowerCase().includes(searchLower)
  )
}

function handleSearch() {
  treeRef.value?.filter(searchText.value)
}

function handleFilter() {
  // 这里可以实现更复杂的筛选逻辑
  ElMessage.info('筛选功能已触发')
}

// ==================== 树形操作 ====================
function handleNodeClick(data: TagHierarchyNode) {
  currentNode.value = data
  childrenCurrentPage.value = 1
}

function handleNodeCheck() {
  selectedNodes.value = treeRef.value?.getCheckedNodes() as TagHierarchyNode[]
}

function handleExpandAll() {
  const nodes = treeRef.value?.store.nodesMap
  if (nodes) {
    Object.values(nodes).forEach((node: any) => {
      node.expanded = true
    })
  }
}

function handleCollapseAll() {
  const nodes = treeRef.value?.store.nodesMap
  if (nodes) {
    Object.values(nodes).forEach((node: any) => {
      node.expanded = false
    })
  }
}

// ==================== CRUD 操作 ====================
function handleAdd(parent: TagHierarchyNode | null) {
  // 权限检查（模拟）
  const hasPermission = true
  if (!hasPermission) {
    ElMessage.warning('您没有新增权限，请联系管理员')
    return
  }

  formData.value = {
    name: '',
    code: '',
    parentId: parent?.id || null,
    type: 'category',
    sort: 0,
    isLeaf: false,
    status: 1,
    owner: '',
    description: ''
  }
  dialogVisible.value = true
}

function handleEdit(node: TagHierarchyNode) {
  // 权限检查（模拟）
  const hasPermission = true
  if (!hasPermission) {
    ElMessage.warning('您没有编辑权限，请联系管理员')
    return
  }

  formData.value = { ...node }
  dialogVisible.value = true
}

async function handleDelete(node: TagHierarchyNode) {
  // 权限检查（模拟）
  const hasPermission = true
  if (!hasPermission) {
    ElMessage.warning('您没有删除权限，请联系管理员')
    return
  }

  // 检查是否有子节点
  const hasChildren = node.children && node.children.length > 0

  let confirmMessage = `确定删除节点 "${node.name}" 吗？`
  if (hasChildren) {
    confirmMessage = `节点 "${node.name}" 包含 ${node.children!.length} 个子节点，删除后子节点也将被删除。确定继续吗？`
  }

  try {
    await ElMessageBox.confirm(confirmMessage, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const loading = ElLoading.service({ text: '删除中...' })

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 删除节点
    removeNode(treeData.value, node.id)

    loading.close()
    ElMessage.success('删除成功')

    // 如果删除的是当前选中节点，清空选择
    if (currentNode.value?.id === node.id) {
      currentNode.value = null
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

async function handleSave() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    // 检查编码重复（模拟）
    const existingNode = findNodeByCode(treeData.value, formData.value.code!)
    if (existingNode && existingNode.id !== formData.value.id) {
      ElMessage.error(`编码 "${formData.value.code}" 已存在，请使用其他编码`)
      return
    }

    // 检查父子循环（模拟）
    if (formData.value.parentId && formData.value.id) {
      if (isDescendant(formData.value.id, formData.value.parentId)) {
        ElMessage.error('不能将节点移动到其子节点下，这会形成循环引用')
        return
      }
    }

    saveLoading.value = true

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (formData.value.id) {
      // 编辑
      updateNodeInTree(treeData.value, formData.value as TagHierarchyNode)
      ElMessage.success('编辑成功')
    } else {
      // 新增
      const newNode: TagHierarchyNode = {
        ...formData.value,
        id: generateId(),
        createTime: new Date().toLocaleString('zh-CN'),
        tagCount: 0,
        usageCount: 0,
        approvalStatus: 'draft'
      } as TagHierarchyNode

      if (newNode.parentId) {
        const parentNode = findNode(treeData.value, newNode.parentId)
        if (parentNode) {
          if (!parentNode.children) {
            parentNode.children = []
          }
          parentNode.children.push(newNode)
        }
      } else {
        treeData.value.push(newNode)
      }

      ElMessage.success('新增成功')
    }

    dialogVisible.value = false
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    saveLoading.value = false
  }
}

async function handleSaveAndSubmit() {
  await handleSave()
  if (!dialogVisible.value) {
    // 保存成功后提交审批
    ElNotification.success({
      title: '审批已提交',
      message: '您的新增请求已提交审批，请等待审批结果'
    })
  }
}

function resetForm() {
  formRef.value?.resetFields()
  formData.value = {
    name: '',
    code: '',
    parentId: null,
    type: 'category',
    sort: 0,
    isLeaf: false,
    status: 1,
    owner: '',
    description: ''
  }
}

// 辅助函数：根据编码查找节点
function findNodeByCode(
  nodes: TagHierarchyNode[],
  code: string
): TagHierarchyNode | null {
  for (const node of nodes) {
    if (node.code === code) return node
    if (node.children) {
      const found = findNodeByCode(node.children, code)
      if (found) return found
    }
  }
  return null
}

// 辅助函数：检查是否是后代节点
function isDescendant(ancestorId: string, nodeId: string): boolean {
  const node = findNode(treeData.value, ancestorId)
  if (!node || !node.children) return false

  for (const child of node.children) {
    if (child.id === nodeId) return true
    if (isDescendant(child.id, nodeId)) return true
  }
  return false
}

// 辅助函数：更新树中的节点
function updateNodeInTree(
  nodes: TagHierarchyNode[],
  updatedNode: TagHierarchyNode
) {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === updatedNode.id) {
      // 保留children
      updatedNode.children = nodes[i].children
      nodes[i] = updatedNode
      return true
    }
    if (nodes[i].children) {
      if (updateNodeInTree(nodes[i].children!, updatedNode)) {
        return true
      }
    }
  }
  return false
}

// 状态切换
async function handleStatusChange(node: TagHierarchyNode) {
  const loading = ElLoading.service({ text: '更新中...' })

  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))

    ElMessage.success(`已${node.status === 1 ? '启用' : '停用'}`)
  } catch (error) {
    // 回滚状态
    node.status = node.status === 1 ? 0 : 1
    ElMessage.error('操作失败')
  } finally {
    loading.close()
  }
}

// ==================== 节点命令操作 ====================
async function handleNodeCommand(command: string, node: TagHierarchyNode) {
  switch (command) {
    case 'moveUp':
      await handleMoveUp(node)
      break
    case 'moveDown':
      await handleMoveDown(node)
      break
    case 'copy':
      handleCopy(node)
      break
    case 'submitApproval':
      await handleSubmitApproval(node)
      break
  }
}

async function handleMoveUp(node: TagHierarchyNode) {
  const loading = ElLoading.service({ text: '移动中...' })

  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))

    // 这里应该实现实际的上移逻辑
    ElMessage.success('上移成功')
  } catch (error) {
    ElMessage.error('上移失败')
  } finally {
    loading.close()
  }
}

async function handleMoveDown(node: TagHierarchyNode) {
  const loading = ElLoading.service({ text: '移动中...' })

  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))

    // 这里应该实现实际的下移逻辑
    ElMessage.success('下移成功')
  } catch (error) {
    ElMessage.error('下移失败')
  } finally {
    loading.close()
  }
}

function handleCopy(node: TagHierarchyNode) {
  ElMessage.info(`已复制节点: ${node.name}`)
}

async function handleSubmitApproval(node: TagHierarchyNode) {
  try {
    await ElMessageBox.confirm(
      `确定提交节点 "${node.name}" 的审批申请吗？`,
      '提交审批',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )

    const loading = ElLoading.service({ text: '提交中...' })

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))

    node.approvalStatus = 'pending'

    loading.close()
    ElNotification.success({
      title: '审批已提交',
      message: '您的审批请求已提交，请等待审批结果'
    })
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('提交失败')
    }
  }
}

// ==================== 拖拽操作 ====================
function allowDrop(
  draggingNode: Node,
  dropNode: Node,
  type: 'prev' | 'inner' | 'next'
) {
  // 可以添加更多的拖拽限制逻辑
  return true
}

function allowDrag(draggingNode: Node) {
  // 可以添加拖拽限制逻辑，比如某些节点不允许拖拽
  return true
}

async function handleNodeDrop(
  draggingNode: Node,
  dropNode: Node,
  dropType: 'before' | 'after' | 'inner',
  ev: DragEvent
) {
  const loading = ElLoading.service({ text: '保存中...' })

  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))

    ElMessage.success('节点移动成功')
  } catch (error) {
    ElMessage.error('节点移动失败')
    // 这里应该回滚树的变化
  } finally {
    loading.close()
  }
}

// ==================== 批量操作 ====================
async function handleBatchEnable() {
  if (selectedNodes.value.length === 0) {
    ElMessage.warning('请先选择节点')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定批量启用选中的 ${selectedNodes.value.length} 个节点吗？`,
      '批量启用',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )

    const loading = ElLoading.service({ text: '批量启用中...' })

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1500))

    selectedNodes.value.forEach(node => {
      node.status = 1
    })

    loading.close()
    ElMessage.success(`已批量启用 ${selectedNodes.value.length} 个节点`)
    treeRef.value?.setCheckedKeys([])
    selectedNodes.value = []
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量启用失败')
    }
  }
}

async function handleBatchDisable() {
  if (selectedNodes.value.length === 0) {
    ElMessage.warning('请先选择节点')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定批量停用选中的 ${selectedNodes.value.length} 个节点吗？`,
      '批量停用',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const loading = ElLoading.service({ text: '批量停用中...' })

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1500))

    selectedNodes.value.forEach(node => {
      node.status = 0
    })

    loading.close()
    ElMessage.success(`已批量停用 ${selectedNodes.value.length} 个节点`)
    treeRef.value?.setCheckedKeys([])
    selectedNodes.value = []
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量停用失败')
    }
  }
}

function handleBatchMove() {
  if (selectedNodes.value.length === 0) {
    ElMessage.warning('请先选择节点')
    return
  }

  batchMoveTarget.value = undefined
  batchMoveVisible.value = true
}

async function confirmBatchMove() {
  if (!batchMoveTarget.value) {
    ElMessage.warning('请选择目标父节点')
    return
  }

  const loading = ElLoading.service({ text: '批量移动中...' })

  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1500))

    ElMessage.success(`已批量移动 ${selectedNodes.value.length} 个节点`)
    batchMoveVisible.value = false
    treeRef.value?.setCheckedKeys([])
    selectedNodes.value = []
  } catch (error) {
    ElMessage.error('批量移动失败')
  } finally {
    loading.close()
  }
}

async function handleBatchDelete() {
  if (selectedNodes.value.length === 0) {
    ElMessage.warning('请先选择节点')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定批量删除选中的 ${selectedNodes.value.length} 个节点吗？此操作不可恢复！`,
      '批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'error'
      }
    )

    const loading = ElLoading.service({ text: '批量删除中...' })

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1500))

    selectedNodes.value.forEach(node => {
      removeNode(treeData.value, node.id)
    })

    loading.close()
    ElMessage.success(`已批量删除 ${selectedNodes.value.length} 个节点`)
    treeRef.value?.setCheckedKeys([])
    selectedNodes.value = []

    if (currentNode.value && selectedNodes.value.find(n => n.id === currentNode.value!.id)) {
      currentNode.value = null
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败')
    }
  }
}

// ==================== 导入导出 ====================
function handleExport() {
  const loading = ElLoading.service({ text: '导出中...' })

  try {
    // 模拟导出
    const data = JSON.stringify(treeData.value, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tag-hierarchy-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)

    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  } finally {
    loading.close()
  }
}

function handleImportClick() {
  importResult.value = null
  importFile.value = null
  importVisible.value = true
}

function handleFileChange(file: any) {
  importFile.value = file.raw
  importResult.value = null
}

async function confirmImport() {
  if (!importFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }

  importLoading.value = true

  try {
    // 模拟文件读取和校验
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 模拟校验结果
    const isValid = Math.random() > 0.3

    if (isValid) {
      importResult.value = {
        title: '导入成功',
        type: 'success',
        description: '成功导入 15 个节点，跳过 2 个重复节点'
      }

      // 模拟导入数据（这里不实际修改树数据）
      setTimeout(() => {
        ElMessage.success('导入完成')
        importVisible.value = false
      }, 1500)
    } else {
      importResult.value = {
        title: '导入失败',
        type: 'error',
        description: '文件格式错误或存在 5 个冲突节点，请修正后重新导入'
      }
    }
  } catch (error) {
    importResult.value = {
      title: '导入异常',
      type: 'error',
      description: '导入过程中发生异常，请稍后重试'
    }
  } finally {
    importLoading.value = false
  }
}

// ==================== 监听 ====================
watch(showCheckbox, (val) => {
  if (!val) {
    selectedNodes.value = []
    treeRef.value?.setCheckedKeys([])
  }
})
</script>

<style scoped lang="scss">
.tag-hierarchy-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  .header-card {
    margin-bottom: 16px;

    :deep(.el-card__body) {
      padding: 16px;
    }

    .header-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;

      .search-area {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
      }

      .action-buttons {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
      }
    }
  }

  .main-content {
    flex: 1;
    display: flex;
    gap: 16px;
    overflow: hidden;

    .tree-card {
      width: 28%;
      display: flex;
      flex-direction: column;

      .tree-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      :deep(.el-card__body) {
        flex: 1;
        overflow: auto;
        padding: 16px;
      }

      .custom-tree-node {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-right: 8px;

        .node-label {
          display: flex;
          align-items: center;
          gap: 6px;
          flex: 1;
          overflow: hidden;

          .node-name {
            font-weight: 500;
          }

          .node-count {
            color: #909399;
            font-size: 12px;
          }
        }

        .node-actions {
          display: none;
          align-items: center;
          gap: 4px;
        }

        &:hover .node-actions {
          display: flex;
        }
      }
    }

    .detail-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: auto;

      .detail-card {
        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .statistics {
          display: flex;
          justify-content: space-around;
          margin-top: 16px;
        }
      }

      .children-card {
        .children-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
      }
    }
  }
}

:deep(.el-tree-node__content) {
  height: 36px;
}

:deep(.el-upload-dragger) {
  padding: 40px;
}
</style>
