<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// 类型定义
interface PermissionPolicy {
  id: string
  name: string
  description: string
  modelIds: string[]
  targetType: 'user' | 'role'
  targetIds: string[]
  permissionType: 'readonly' | 'edit' | 'admin' | 'forbidden'
  permissions: {
    view: boolean
    edit: boolean
    export: boolean
    delete: boolean
    share: boolean
  }
  componentPermissions: ComponentPermission[]
  status: 'active' | 'inactive' | 'expired'
  startTime: string
  endTime: string
  createTime: string
  updateTime: string
  priority: number
  inheritRule: 'inherit' | 'override' | 'merge'
}

interface ComponentPermission {
  componentId: string
  componentName: string
  canView: boolean
  canEdit: boolean
  canDelete: boolean
  resourcePermissions: {
    material: boolean
    texture: boolean
    geometry: boolean
  }
}

interface AuditLog {
  id: string
  operation: string
  operator: string
  policyName: string
  timestamp: string
  detail: string
  type: 'create' | 'update' | 'delete' | 'access' | 'violation'
}

interface TestResult {
  userId: string
  userName: string
  modelId: string
  modelName: string
  permissions: string[]
  conflicts: string[]
  passed: boolean
}

// 响应式数据
const loading = ref(false)
const searchQuery = ref('')
const filterType = ref('')
const filterStatus = ref('')

// 权限策略列表
const policyList = ref<PermissionPolicy[]>([])
const selectedPolicy = ref<PermissionPolicy | null>(null)

// 对话框控制
const dialogVisible = ref(false)
const dialogTitle = ref('新增权限策略')
const formRef = ref<FormInstance>()

// 表单数据
const policyForm = reactive<Partial<PermissionPolicy>>({
  name: '',
  description: '',
  modelIds: [],
  targetType: 'user',
  targetIds: [],
  permissionType: 'readonly',
  permissions: {
    view: true,
    edit: false,
    export: false,
    delete: false,
    share: false
  },
  componentPermissions: [],
  status: 'active',
  startTime: '',
  endTime: '',
  priority: 0,
  inheritRule: 'inherit'
})

// 表单验证规则
const formRules: FormRules = {
  name: [{ required: true, message: '请输入策略名称', trigger: 'blur' }],
  modelIds: [{ required: true, message: '请选择适用模型', trigger: 'change' }],
  targetIds: [{ required: true, message: '请选择目标用户/角色', trigger: 'change' }],
  permissionType: [{ required: true, message: '请选择权限类型', trigger: 'change' }]
}

// Mock 数据
const mockModels = ref([
  { id: 'model-1', name: '建筑主体模型' },
  { id: 'model-2', name: '机械设备模型' },
  { id: 'model-3', name: '室内装饰模型' },
  { id: 'model-4', name: '地形地貌模型' }
])

const mockUsers = ref([
  { id: 'user-1', name: '张三', type: 'user' },
  { id: 'user-2', name: '李四', type: 'user' },
  { id: 'user-3', name: '王五', type: 'user' }
])

const mockRoles = ref([
  { id: 'role-1', name: '管理员', type: 'role' },
  { id: 'role-2', name: '设计师', type: 'role' },
  { id: 'role-3', name: '访客', type: 'role' }
])

const mockComponents = ref([
  { id: 'comp-1', name: '主体结构' },
  { id: 'comp-2', name: '外墙装饰' },
  { id: 'comp-3', name: '内部设施' },
  { id: 'comp-4', name: '地基基础' }
])

// 审计日志
const auditLogs = ref<AuditLog[]>([])

// 测试验证
const testUserId = ref('')
const testModelId = ref('')
const testResult = ref<TestResult | null>(null)
const testLoading = ref(false)

// 细粒度权限配置
const selectedComponents = ref<string[]>([])
const componentPermissionDialogVisible = ref(false)

// 计算属性
const filteredPolicyList = computed(() => {
  return policyList.value.filter(policy => {
    const matchesSearch = !searchQuery.value ||
      policy.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesType = !filterType.value || policy.permissionType === filterType.value
    const matchesStatus = !filterStatus.value || policy.status === filterStatus.value
    return matchesSearch && matchesType && matchesStatus
  })
})

const targetOptions = computed(() => {
  return policyForm.targetType === 'user' ? mockUsers.value : mockRoles.value
})

// 方法
const loadPolicyList = () => {
  loading.value = true
  // 模拟异步加载
  setTimeout(() => {
    policyList.value = [
      {
        id: 'policy-1',
        name: '设计师完整权限',
        description: '设计师团队对所有建筑模型拥有完整操作权限',
        modelIds: ['model-1', 'model-2'],
        targetType: 'role',
        targetIds: ['role-2'],
        permissionType: 'admin',
        permissions: {
          view: true,
          edit: true,
          export: true,
          delete: true,
          share: true
        },
        componentPermissions: [
          {
            componentId: 'comp-1',
            componentName: '主体结构',
            canView: true,
            canEdit: true,
            canDelete: true,
            resourcePermissions: {
              material: true,
              texture: true,
              geometry: true
            }
          }
        ],
        status: 'active',
        startTime: '2025-01-01 00:00:00',
        endTime: '2025-12-31 23:59:59',
        createTime: '2025-01-15 10:30:00',
        updateTime: '2025-01-20 14:20:00',
        priority: 10,
        inheritRule: 'override'
      },
      {
        id: 'policy-2',
        name: '访客只读权限',
        description: '访客只能查看模型，不能进行任何编辑操作',
        modelIds: ['model-1', 'model-3'],
        targetType: 'role',
        targetIds: ['role-3'],
        permissionType: 'readonly',
        permissions: {
          view: true,
          edit: false,
          export: false,
          delete: false,
          share: false
        },
        componentPermissions: [
          {
            componentId: 'comp-1',
            componentName: '主体结构',
            canView: true,
            canEdit: false,
            canDelete: false,
            resourcePermissions: {
              material: false,
              texture: false,
              geometry: false
            }
          }
        ],
        status: 'active',
        startTime: '2025-01-01 00:00:00',
        endTime: '2025-12-31 23:59:59',
        createTime: '2025-01-10 09:15:00',
        updateTime: '2025-01-10 09:15:00',
        priority: 5,
        inheritRule: 'inherit'
      },
      {
        id: 'policy-3',
        name: '张三特殊编辑权限',
        description: '张三对特定模型拥有编辑权限',
        modelIds: ['model-2'],
        targetType: 'user',
        targetIds: ['user-1'],
        permissionType: 'edit',
        permissions: {
          view: true,
          edit: true,
          export: true,
          delete: false,
          share: true
        },
        componentPermissions: [],
        status: 'active',
        startTime: '2025-01-15 00:00:00',
        endTime: '2025-06-30 23:59:59',
        createTime: '2025-01-15 16:45:00',
        updateTime: '2025-01-15 16:45:00',
        priority: 8,
        inheritRule: 'merge'
      },
      {
        id: 'policy-4',
        name: '过期的测试策略',
        description: '用于测试的过期策略',
        modelIds: ['model-4'],
        targetType: 'user',
        targetIds: ['user-2'],
        permissionType: 'readonly',
        permissions: {
          view: true,
          edit: false,
          export: false,
          delete: false,
          share: false
        },
        componentPermissions: [],
        status: 'expired',
        startTime: '2024-01-01 00:00:00',
        endTime: '2024-12-31 23:59:59',
        createTime: '2024-01-01 08:00:00',
        updateTime: '2024-01-01 08:00:00',
        priority: 3,
        inheritRule: 'inherit'
      },
      {
        id: 'policy-5',
        name: '未生效的未来策略',
        description: '将在未来生效的权限策略',
        modelIds: ['model-3'],
        targetType: 'role',
        targetIds: ['role-2'],
        permissionType: 'edit',
        permissions: {
          view: true,
          edit: true,
          export: false,
          delete: false,
          share: true
        },
        componentPermissions: [],
        status: 'inactive',
        startTime: '2026-01-01 00:00:00',
        endTime: '2026-12-31 23:59:59',
        createTime: '2025-01-25 11:30:00',
        updateTime: '2025-01-25 11:30:00',
        priority: 6,
        inheritRule: 'override'
      }
    ]
    loading.value = false
  }, 500)
}

const loadAuditLogs = () => {
  setTimeout(() => {
    auditLogs.value = [
      {
        id: 'log-1',
        operation: '创建权限策略',
        operator: '管理员',
        policyName: '设计师完整权限',
        timestamp: '2025-01-15 10:30:00',
        detail: '创建了新的权限策略，授予设计师角色完整操作权限',
        type: 'create'
      },
      {
        id: 'log-2',
        operation: '修改权限策略',
        operator: '管理员',
        policyName: '设计师完整权限',
        timestamp: '2025-01-20 14:20:00',
        detail: '更新了权限范围，新增导出权限',
        type: 'update'
      },
      {
        id: 'log-3',
        operation: '访问模型',
        operator: '张三',
        policyName: '张三特殊编辑权限',
        timestamp: '2025-01-22 09:15:00',
        detail: '成功访问机械设备模型',
        type: 'access'
      },
      {
        id: 'log-4',
        operation: '权限违规',
        operator: '李四',
        policyName: '访客只读权限',
        timestamp: '2025-01-23 16:45:00',
        detail: '尝试编辑模型但权限不足',
        type: 'violation'
      },
      {
        id: 'log-5',
        operation: '删除权限策略',
        operator: '管理员',
        policyName: '临时测试策略',
        timestamp: '2025-01-24 11:20:00',
        detail: '删除了过期的测试策略',
        type: 'delete'
      }
    ]
  }, 300)
}

const handleAdd = () => {
  dialogTitle.value = '新增权限策略'
  Object.assign(policyForm, {
    name: '',
    description: '',
    modelIds: [],
    targetType: 'user',
    targetIds: [],
    permissionType: 'readonly',
    permissions: {
      view: true,
      edit: false,
      export: false,
      delete: false,
      share: false
    },
    componentPermissions: [],
    status: 'active',
    startTime: '',
    endTime: '',
    priority: 0,
    inheritRule: 'inherit'
  })
  dialogVisible.value = true
}

const handleEdit = (row: PermissionPolicy) => {
  dialogTitle.value = '编辑权限策略'
  Object.assign(policyForm, { ...row })
  dialogVisible.value = true
}

const handleDelete = (row: PermissionPolicy) => {
  ElMessageBox.confirm(`确定要删除权限策略"${row.name}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    policyList.value = policyList.value.filter(p => p.id !== row.id)
    ElMessage.success('删除成功')

    // 添加审计日志
    auditLogs.value.unshift({
      id: `log-${Date.now()}`,
      operation: '删除权限策略',
      operator: '当前用户',
      policyName: row.name,
      timestamp: new Date().toLocaleString(),
      detail: `删除了权限策略"${row.name}"`,
      type: 'delete'
    })
  }).catch(() => {})
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      setTimeout(() => {
        if (policyForm.id) {
          // 编辑
          const index = policyList.value.findIndex(p => p.id === policyForm.id)
          if (index !== -1) {
            policyList.value[index] = {
              ...policyList.value[index],
              ...policyForm as PermissionPolicy,
              updateTime: new Date().toLocaleString()
            }
            ElMessage.success('更新成功')

            // 添加审计日志
            auditLogs.value.unshift({
              id: `log-${Date.now()}`,
              operation: '修改权限策略',
              operator: '当前用户',
              policyName: policyForm.name || '',
              timestamp: new Date().toLocaleString(),
              detail: `更新了权限策略"${policyForm.name}"`,
              type: 'update'
            })
          }
        } else {
          // 新增
          const newPolicy: PermissionPolicy = {
            id: `policy-${Date.now()}`,
            ...policyForm as Omit<PermissionPolicy, 'id'>,
            createTime: new Date().toLocaleString(),
            updateTime: new Date().toLocaleString()
          }
          policyList.value.unshift(newPolicy)
          ElMessage.success('创建成功')

          // 添加审计日志
          auditLogs.value.unshift({
            id: `log-${Date.now()}`,
            operation: '创建权限策略',
            operator: '当前用户',
            policyName: policyForm.name || '',
            timestamp: new Date().toLocaleString(),
            detail: `创建了新的权限策略"${policyForm.name}"`,
            type: 'create'
          })
        }

        loading.value = false
        dialogVisible.value = false
      }, 500)
    }
  })
}

const handlePermissionTypeChange = (type: string) => {
  // 根据权限类型预设权限
  switch (type) {
    case 'readonly':
      policyForm.permissions = {
        view: true,
        edit: false,
        export: false,
        delete: false,
        share: false
      }
      break
    case 'edit':
      policyForm.permissions = {
        view: true,
        edit: true,
        export: true,
        delete: false,
        share: true
      }
      break
    case 'admin':
      policyForm.permissions = {
        view: true,
        edit: true,
        export: true,
        delete: true,
        share: true
      }
      break
    case 'forbidden':
      policyForm.permissions = {
        view: false,
        edit: false,
        export: false,
        delete: false,
        share: false
      }
      break
  }
}

const handleConfigComponents = () => {
  componentPermissionDialogVisible.value = true
  selectedComponents.value = policyForm.componentPermissions?.map(c => c.componentId) || []
}

const handleComponentPermissionSubmit = () => {
  policyForm.componentPermissions = selectedComponents.value.map(compId => {
    const existingPerm = policyForm.componentPermissions?.find(c => c.componentId === compId)
    const component = mockComponents.value.find(c => c.id === compId)

    return existingPerm || {
      componentId: compId,
      componentName: component?.name || '',
      canView: true,
      canEdit: false,
      canDelete: false,
      resourcePermissions: {
        material: false,
        texture: false,
        geometry: false
      }
    }
  })
  componentPermissionDialogVisible.value = false
}

const handleTestPermission = () => {
  if (!testUserId.value || !testModelId.value) {
    ElMessage.warning('请选择测试用户和模型')
    return
  }

  testLoading.value = true
  setTimeout(() => {
    const user = mockUsers.value.find(u => u.id === testUserId.value)
    const model = mockModels.value.find(m => m.id === testModelId.value)

    // 模拟权限测试逻辑
    const permissions: string[] = []
    const conflicts: string[] = []
    let passed = true

    // 查找适用的权限策略
    const applicablePolicies = policyList.value.filter(p =>
      p.modelIds.includes(testModelId.value) &&
      p.status === 'active' &&
      (
        (p.targetType === 'user' && p.targetIds.includes(testUserId.value)) ||
        (p.targetType === 'role' && p.targetIds.some(roleId => {
          // 这里简化处理，实际应该检查用户是否属于该角色
          return true
        }))
      )
    )

    if (applicablePolicies.length === 0) {
      permissions.push('无可用权限')
      passed = false
    } else {
      applicablePolicies.forEach(policy => {
        if (policy.permissions.view) permissions.push('查看')
        if (policy.permissions.edit) permissions.push('编辑')
        if (policy.permissions.export) permissions.push('导出')
        if (policy.permissions.delete) permissions.push('删除')
        if (policy.permissions.share) permissions.push('分享')
      })

      // 检测权限冲突
      if (applicablePolicies.length > 1) {
        const hasConflict = applicablePolicies.some((p1, i) =>
          applicablePolicies.some((p2, j) =>
            i !== j && p1.inheritRule === 'override' && p2.inheritRule === 'override'
          )
        )
        if (hasConflict) {
          conflicts.push('检测到多个覆盖规则冲突')
          passed = false
        }
      }
    }

    testResult.value = {
      userId: testUserId.value,
      userName: user?.name || '',
      modelId: testModelId.value,
      modelName: model?.name || '',
      permissions: [...new Set(permissions)],
      conflicts,
      passed
    }

    testLoading.value = false
  }, 800)
}

const handleExportAuditLog = () => {
  ElMessage.success('审计日志导出成功')
}

const handleRowClick = (row: PermissionPolicy) => {
  selectedPolicy.value = row
}

const getPermissionTypeTag = (type: string) => {
  const typeMap: Record<string, { label: string; type: any }> = {
    readonly: { label: '只读', type: 'primary' },
    edit: { label: '编辑', type: 'success' },
    admin: { label: '管理', type: 'warning' },
    forbidden: { label: '禁止', type: 'danger' }
  }
  return typeMap[type] || { label: type, type: 'info' }
}

const getStatusTag = (status: string) => {
  const statusMap: Record<string, { label: string; type: any }> = {
    active: { label: '生效', type: 'success' },
    inactive: { label: '未生效', type: 'info' },
    expired: { label: '过期', type: 'danger' }
  }
  return statusMap[status] || { label: status, type: 'info' }
}

const getAuditLogType = (type: string) => {
  const typeMap: Record<string, string> = {
    create: 'success',
    update: 'primary',
    delete: 'danger',
    access: 'info',
    violation: 'warning'
  }
  return typeMap[type] || 'info'
}

const getModelNames = (modelIds: string[]) => {
  return modelIds.map(id => {
    const model = mockModels.value.find(m => m.id === id)
    return model?.name || id
  }).join(', ')
}

const getTargetNames = (targetType: string, targetIds: string[]) => {
  const options = targetType === 'user' ? mockUsers.value : mockRoles.value
  return targetIds.map(id => {
    const target = options.find(t => t.id === id)
    return target?.name || id
  }).join(', ')
}

// 生命周期
onMounted(() => {
  loadPolicyList()
  loadAuditLogs()
})
</script>

<template>
  <div class="model-permission-container">
    <el-row :gutter="20" class="main-content">
      <!-- 左侧：权限策略列表 -->
      <el-col :span="10">
        <el-card shadow="never" class="list-card">
          <template #header>
            <div class="card-header">
              <span class="title">权限策略列表</span>
              <el-button type="primary" size="small" @click="handleAdd">
                新增策略
              </el-button>
            </div>
          </template>

          <!-- 搜索和筛选 -->
          <div class="filter-section">
            <el-input
              v-model="searchQuery"
              placeholder="搜索策略名称"
              clearable
              class="search-input"
            >
              <template #prefix>
                <el-icon><i class="el-icon-search" /></el-icon>
              </template>
            </el-input>

            <div class="filter-row">
              <el-select
                v-model="filterType"
                placeholder="权限类型"
                clearable
                size="small"
                style="width: 48%"
              >
                <el-option label="只读" value="readonly" />
                <el-option label="编辑" value="edit" />
                <el-option label="管理" value="admin" />
                <el-option label="禁止" value="forbidden" />
              </el-select>

              <el-select
                v-model="filterStatus"
                placeholder="状态"
                clearable
                size="small"
                style="width: 48%"
              >
                <el-option label="生效" value="active" />
                <el-option label="未生效" value="inactive" />
                <el-option label="过期" value="expired" />
              </el-select>
            </div>
          </div>

          <!-- 策略表格 -->
          <el-table
            v-loading="loading"
            :data="filteredPolicyList"
            stripe
            highlight-current-row
            @row-click="handleRowClick"
            style="width: 100%"
            max-height="650"
          >
            <el-table-column prop="name" label="策略名称" width="150" show-overflow-tooltip />
            <el-table-column label="适用模型" width="120" show-overflow-tooltip>
              <template #default="{ row }">
                {{ getModelNames(row.modelIds) }}
              </template>
            </el-table-column>
            <el-table-column label="目标对象" width="100" show-overflow-tooltip>
              <template #default="{ row }">
                {{ getTargetNames(row.targetType, row.targetIds) }}
              </template>
            </el-table-column>
            <el-table-column label="权限类型" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="getPermissionTypeTag(row.permissionType).type" size="small">
                  {{ getPermissionTypeTag(row.permissionType).label }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="getStatusTag(row.status).type" size="small">
                  {{ getStatusTag(row.status).label }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="140" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click.stop="handleEdit(row)">
                  编辑
                </el-button>
                <el-button type="danger" link size="small" @click.stop="handleDelete(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 中间：权限配置矩阵 -->
      <el-col :span="8">
        <el-card shadow="never" class="matrix-card">
          <template #header>
            <div class="card-header">
              <span class="title">权限配置矩阵</span>
            </div>
          </template>

          <div v-if="selectedPolicy" class="permission-matrix">
            <div class="policy-info">
              <h4>{{ selectedPolicy.name }}</h4>
              <p class="description">{{ selectedPolicy.description }}</p>
            </div>

            <el-divider />

            <div class="matrix-section">
              <h5>基础权限</h5>
              <div class="permission-grid">
                <div class="permission-item">
                  <span class="label">查看</span>
                  <el-tag :type="selectedPolicy.permissions.view ? 'success' : 'info'" size="small">
                    {{ selectedPolicy.permissions.view ? '允许' : '禁止' }}
                  </el-tag>
                </div>
                <div class="permission-item">
                  <span class="label">编辑</span>
                  <el-tag :type="selectedPolicy.permissions.edit ? 'success' : 'info'" size="small">
                    {{ selectedPolicy.permissions.edit ? '允许' : '禁止' }}
                  </el-tag>
                </div>
                <div class="permission-item">
                  <span class="label">导出</span>
                  <el-tag :type="selectedPolicy.permissions.export ? 'success' : 'info'" size="small">
                    {{ selectedPolicy.permissions.export ? '允许' : '禁止' }}
                  </el-tag>
                </div>
                <div class="permission-item">
                  <span class="label">删除</span>
                  <el-tag :type="selectedPolicy.permissions.delete ? 'success' : 'info'" size="small">
                    {{ selectedPolicy.permissions.delete ? '允许' : '禁止' }}
                  </el-tag>
                </div>
                <div class="permission-item">
                  <span class="label">分享</span>
                  <el-tag :type="selectedPolicy.permissions.share ? 'success' : 'info'" size="small">
                    {{ selectedPolicy.permissions.share ? '允许' : '禁止' }}
                  </el-tag>
                </div>
              </div>
            </div>

            <el-divider />

            <div class="matrix-section">
              <h5>组件权限 ({{ selectedPolicy.componentPermissions.length }})</h5>
              <div v-if="selectedPolicy.componentPermissions.length > 0" class="component-list">
                <el-card
                  v-for="comp in selectedPolicy.componentPermissions"
                  :key="comp.componentId"
                  shadow="hover"
                  class="component-card"
                >
                  <div class="component-name">{{ comp.componentName }}</div>
                  <div class="component-perms">
                    <el-tag v-if="comp.canView" type="success" size="small">查看</el-tag>
                    <el-tag v-if="comp.canEdit" type="warning" size="small">编辑</el-tag>
                    <el-tag v-if="comp.canDelete" type="danger" size="small">删除</el-tag>
                  </div>
                  <div class="resource-perms">
                    <span v-if="comp.resourcePermissions.material" class="res-tag">材质</span>
                    <span v-if="comp.resourcePermissions.texture" class="res-tag">纹理</span>
                    <span v-if="comp.resourcePermissions.geometry" class="res-tag">几何</span>
                  </div>
                </el-card>
              </div>
              <el-empty v-else description="暂无组件权限配置" :image-size="80" />
            </div>

            <el-divider />

            <div class="matrix-section">
              <h5>策略信息</h5>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">优先级:</span>
                  <span class="value">{{ selectedPolicy.priority }}</span>
                </div>
                <div class="info-item">
                  <span class="label">继承规则:</span>
                  <el-tag size="small">
                    {{ selectedPolicy.inheritRule === 'inherit' ? '继承' :
                       selectedPolicy.inheritRule === 'override' ? '覆盖' : '合并' }}
                  </el-tag>
                </div>
                <div class="info-item">
                  <span class="label">生效时间:</span>
                  <span class="value">{{ selectedPolicy.startTime }}</span>
                </div>
                <div class="info-item">
                  <span class="label">失效时间:</span>
                  <span class="value">{{ selectedPolicy.endTime }}</span>
                </div>
              </div>
            </div>
          </div>
          <el-empty v-else description="请选择一个权限策略查看详情" :image-size="100" />
        </el-card>
      </el-col>

      <!-- 右侧：测试验证和审计日志 -->
      <el-col :span="6">
        <!-- 权限测试 -->
        <el-card shadow="never" class="test-card">
          <template #header>
            <div class="card-header">
              <span class="title">权限测试验证</span>
            </div>
          </template>

          <div class="test-section">
            <el-form label-position="top" size="small">
              <el-form-item label="测试用户">
                <el-select v-model="testUserId" placeholder="请选择" style="width: 100%">
                  <el-option
                    v-for="user in mockUsers"
                    :key="user.id"
                    :label="user.name"
                    :value="user.id"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="测试模型">
                <el-select v-model="testModelId" placeholder="请选择" style="width: 100%">
                  <el-option
                    v-for="model in mockModels"
                    :key="model.id"
                    :label="model.name"
                    :value="model.id"
                  />
                </el-select>
              </el-form-item>

              <el-button
                type="primary"
                :loading="testLoading"
                @click="handleTestPermission"
                style="width: 100%"
              >
                开始测试
              </el-button>
            </el-form>

            <div v-if="testResult" class="test-result">
              <el-alert
                :type="testResult.passed ? 'success' : 'warning'"
                :title="testResult.passed ? '测试通过' : '测试失败'"
                :closable="false"
                style="margin: 15px 0"
              />

              <div class="result-info">
                <div class="result-item">
                  <span class="label">用户:</span>
                  <span class="value">{{ testResult.userName }}</span>
                </div>
                <div class="result-item">
                  <span class="label">模型:</span>
                  <span class="value">{{ testResult.modelName }}</span>
                </div>
                <div class="result-item">
                  <span class="label">权限:</span>
                  <div class="tags">
                    <el-tag
                      v-for="(perm, index) in testResult.permissions"
                      :key="index"
                      size="small"
                      type="success"
                      style="margin: 2px"
                    >
                      {{ perm }}
                    </el-tag>
                  </div>
                </div>
                <div v-if="testResult.conflicts.length > 0" class="result-item">
                  <span class="label">冲突:</span>
                  <div class="conflicts">
                    <el-tag
                      v-for="(conflict, index) in testResult.conflicts"
                      :key="index"
                      size="small"
                      type="danger"
                      style="margin: 2px"
                    >
                      {{ conflict }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 审计日志 -->
        <el-card shadow="never" class="audit-card">
          <template #header>
            <div class="card-header">
              <span class="title">审计日志</span>
              <el-button type="primary" link size="small" @click="handleExportAuditLog">
                导出
              </el-button>
            </div>
          </template>

          <el-timeline class="audit-timeline">
            <el-timeline-item
              v-for="log in auditLogs.slice(0, 8)"
              :key="log.id"
              :timestamp="log.timestamp"
              :type="getAuditLogType(log.type)"
              placement="top"
            >
              <div class="audit-item">
                <div class="audit-header">
                  <span class="operation">{{ log.operation }}</span>
                  <el-tag :type="getAuditLogType(log.type)" size="small">
                    {{ log.type }}
                  </el-tag>
                </div>
                <div class="audit-content">
                  <div class="audit-meta">
                    <span>操作人: {{ log.operator }}</span>
                    <span v-if="log.policyName">策略: {{ log.policyName }}</span>
                  </div>
                  <div class="audit-detail">{{ log.detail }}</div>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      @close="formRef?.resetFields()"
    >
      <el-form
        ref="formRef"
        :model="policyForm"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="策略名称" prop="name">
          <el-input v-model="policyForm.name" placeholder="请输入策略名称" />
        </el-form-item>

        <el-form-item label="策略描述" prop="description">
          <el-input
            v-model="policyForm.description"
            type="textarea"
            :rows="2"
            placeholder="请输入策略描述"
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="适用模型" prop="modelIds">
              <el-select v-model="policyForm.modelIds" multiple placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="model in mockModels"
                  :key="model.id"
                  :label="model.name"
                  :value="model.id"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="目标类型" prop="targetType">
              <el-radio-group v-model="policyForm.targetType">
                <el-radio value="user">用户</el-radio>
                <el-radio value="role">角色</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="目标对象" prop="targetIds">
              <el-select v-model="policyForm.targetIds" multiple placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="target in targetOptions"
                  :key="target.id"
                  :label="target.name"
                  :value="target.id"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="权限类型" prop="permissionType">
              <el-select
                v-model="policyForm.permissionType"
                placeholder="请选择"
                style="width: 100%"
                @change="handlePermissionTypeChange"
              >
                <el-option label="只读" value="readonly" />
                <el-option label="编辑" value="edit" />
                <el-option label="管理" value="admin" />
                <el-option label="禁止" value="forbidden" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="基础权限">
          <el-checkbox-group v-model="policyForm.permissions" style="width: 100%">
            <el-checkbox :model-value="policyForm.permissions?.view" label="view">查看</el-checkbox>
            <el-checkbox :model-value="policyForm.permissions?.edit" label="edit">编辑</el-checkbox>
            <el-checkbox :model-value="policyForm.permissions?.export" label="export">导出</el-checkbox>
            <el-checkbox :model-value="policyForm.permissions?.delete" label="delete">删除</el-checkbox>
            <el-checkbox :model-value="policyForm.permissions?.share" label="share">分享</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="组件权限">
          <el-button type="primary" plain size="small" @click="handleConfigComponents">
            配置组件权限 ({{ policyForm.componentPermissions?.length || 0 }})
          </el-button>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="状态">
              <el-select v-model="policyForm.status" placeholder="请选择" style="width: 100%">
                <el-option label="生效" value="active" />
                <el-option label="未生效" value="inactive" />
                <el-option label="过期" value="expired" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="优先级">
              <el-input-number v-model="policyForm.priority" :min="0" :max="100" style="width: 100%" />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="继承规则">
              <el-select v-model="policyForm.inheritRule" placeholder="请选择" style="width: 100%">
                <el-option label="继承" value="inherit" />
                <el-option label="覆盖" value="override" />
                <el-option label="合并" value="merge" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="生效时间">
              <el-input v-model="policyForm.startTime" placeholder="YYYY-MM-DD HH:mm:ss" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="失效时间">
              <el-input v-model="policyForm.endTime" placeholder="YYYY-MM-DD HH:mm:ss" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 组件权限配置对话框 -->
    <el-dialog
      v-model="componentPermissionDialogVisible"
      title="配置组件权限"
      width="500px"
    >
      <el-checkbox-group v-model="selectedComponents">
        <div v-for="comp in mockComponents" :key="comp.id" style="margin-bottom: 10px">
          <el-checkbox :value="comp.id">{{ comp.name }}</el-checkbox>
        </div>
      </el-checkbox-group>

      <template #footer>
        <el-button @click="componentPermissionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleComponentPermissionSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.model-permission-container {
  min-height: calc(100vh - 40px);

  .main-content {
    margin: 0;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title {
      font-weight: 600;
      font-size: 16px;
      color: #303133;
    }
  }

  // 左侧列表卡片
  .list-card {
    margin-bottom: 20px;

    .filter-section {
      margin-bottom: 15px;

      .search-input {
        margin-bottom: 10px;
      }

      .filter-row {
        display: flex;
        justify-content: space-between;
      }
    }
  }

  // 中间权限矩阵
  .matrix-card {
    margin-bottom: 20px;
    height: 100%;

    .permission-matrix {
      .policy-info {
        h4 {
          margin: 0 0 8px 0;
          color: #303133;
          font-size: 16px;
        }

        .description {
          margin: 0;
          color: #909399;
          font-size: 13px;
          line-height: 1.5;
        }
      }

      .matrix-section {
        margin-bottom: 20px;

        h5 {
          margin: 0 0 12px 0;
          color: #606266;
          font-size: 14px;
          font-weight: 600;
        }

        .permission-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;

          .permission-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background: #f5f7fa;
            border-radius: 4px;

            .label {
              font-size: 13px;
              color: #606266;
            }
          }
        }

        .component-list {
          max-height: 200px;
          overflow-y: auto;

          .component-card {
            margin-bottom: 10px;

            :deep(.el-card__body) {
              padding: 12px;
            }

            .component-name {
              font-weight: 500;
              color: #303133;
              margin-bottom: 8px;
            }

            .component-perms {
              margin-bottom: 6px;

              .el-tag {
                margin-right: 6px;
              }
            }

            .resource-perms {
              .res-tag {
                display: inline-block;
                padding: 2px 8px;
                margin-right: 6px;
                background: #e8f4ff;
                color: #409eff;
                border-radius: 3px;
                font-size: 12px;
              }
            }
          }
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;

          .info-item {
            display: flex;
            align-items: center;
            padding: 6px 0;
            border-bottom: 1px solid #f0f0f0;

            &:last-child {
              border-bottom: none;
            }

            .label {
              font-size: 13px;
              color: #909399;
              margin-right: 8px;
              min-width: 80px;
            }

            .value {
              font-size: 13px;
              color: #303133;
            }
          }
        }
      }
    }
  }

  // 右侧测试和日志
  .test-card {
    margin-bottom: 20px;

    .test-section {
      .test-result {
        margin-top: 15px;

        .result-info {
          .result-item {
            margin-bottom: 12px;

            .label {
              display: inline-block;
              font-size: 13px;
              color: #909399;
              margin-bottom: 6px;
            }

            .value {
              font-size: 13px;
              color: #303133;
            }

            .tags,
            .conflicts {
              margin-top: 6px;
            }
          }
        }
      }
    }
  }

  .audit-card {
    .audit-timeline {
      max-height: 400px;
      overflow-y: auto;
      padding: 10px 0;

      .audit-item {
        .audit-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;

          .operation {
            font-weight: 500;
            color: #303133;
            font-size: 14px;
          }
        }

        .audit-content {
          .audit-meta {
            display: flex;
            gap: 15px;
            margin-bottom: 6px;
            font-size: 12px;
            color: #909399;
          }

          .audit-detail {
            font-size: 13px;
            color: #606266;
            line-height: 1.5;
          }
        }
      }
    }
  }
}
</style>
