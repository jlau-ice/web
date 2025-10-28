<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// ========== 类型定义 ==========
interface PermissionPolicy {
  id: string
  name: string
  description: string
  roles: string[]
  targetCategories: string[]
  permissionType: 'readonly' | 'readwrite' | 'admin' | 'none'
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
  effectiveTime?: string
  priority: number
  inheritRule: 'inherit' | 'override'
}

interface CategoryNode {
  id: string
  label: string
  permissionType?: 'readonly' | 'readwrite' | 'admin' | 'none'
  inherited?: boolean
  children?: CategoryNode[]
}

interface PermissionTest {
  userId: string
  userName: string
  categoryId: string
  categoryName: string
  result: 'allowed' | 'denied'
  permissionType?: 'readonly' | 'readwrite' | 'admin' | 'none'
  reason: string
  appliedPolicy?: string
}

interface AuditLog {
  id: string
  action: string
  operator: string
  policyName: string
  timestamp: string
  details: string
  type: 'modify' | 'access' | 'violation'
}

// ========== 状态管理 ==========
const activeTab = ref('policies')
const loading = ref(false)

// 权限策略列表
const policies = ref<PermissionPolicy[]>([])
const searchForm = reactive({
  name: '',
  role: ''
})

// 策略表单
const policyDialogVisible = ref(false)
const policyFormRef = ref<FormInstance>()
const policyForm = reactive({
  id: '',
  name: '',
  description: '',
  roles: [] as string[],
  targetCategories: [] as string[],
  permissionType: 'readonly' as 'readonly' | 'readwrite' | 'admin' | 'none',
  status: 'active' as 'active' | 'inactive',
  effectiveTime: '',
  priority: 0,
  inheritRule: 'inherit' as 'inherit' | 'override'
})

const policyFormRules: FormRules = {
  name: [{ required: true, message: '请输入策略名称', trigger: 'blur' }],
  roles: [{ required: true, message: '请选择适用角色', trigger: 'change' }],
  targetCategories: [{ required: true, message: '请选择目标分类', trigger: 'change' }],
  permissionType: [{ required: true, message: '请选择权限类型', trigger: 'change' }]
}

// 分类树
const categoryTree = ref<CategoryNode[]>([])
const selectedCategories = ref<string[]>([])
const categoryTreeRef = ref()

// 权限测试
const testForm = reactive({
  userId: '',
  categoryId: ''
})
const testResults = ref<PermissionTest[]>([])
const testDialogVisible = ref(false)

// 审计日志
const auditLogs = ref<AuditLog[]>([])
const auditFilters = reactive({
  type: '',
  dateRange: [] as string[]
})

// 特殊权限配置
const specialPermissions = reactive({
  download: true,
  share: false,
  export: true,
  delete: false
})

// 权限冲突规则
const conflictRule = ref('priority')

// 角色选项
const roleOptions = [
  { label: '超级管理员', value: 'super_admin' },
  { label: '数据管理员', value: 'data_admin' },
  { label: '业务分析师', value: 'analyst' },
  { label: '数据查看者', value: 'viewer' },
  { label: '外部用户', value: 'external' }
]

// 用户选项（用于测试）
const userOptions = ref([
  { id: 'u001', name: '张三', role: 'data_admin' },
  { id: 'u002', name: '李四', role: 'analyst' },
  { id: 'u003', name: '王五', role: 'viewer' },
  { id: 'u004', name: '赵六', role: 'external' }
])

// ========== 计算属性 ==========
const filteredPolicies = computed(() => {
  return policies.value.filter(policy => {
    const matchName = !searchForm.name || policy.name.includes(searchForm.name)
    const matchRole = !searchForm.role || policy.roles.includes(searchForm.role)
    return matchName && matchRole
  })
})

const permissionTypeColor = (type: string) => {
  const colors = {
    readonly: 'primary',
    readwrite: 'success',
    admin: 'warning',
    none: 'info'
  }
  return colors[type as keyof typeof colors] || 'info'
}

const permissionTypeText = (type: string) => {
  const texts = {
    readonly: '只读',
    readwrite: '读写',
    admin: '管理',
    none: '无权限'
  }
  return texts[type as keyof typeof texts] || '未知'
}

// ========== Mock 数据加载 ==========
const loadMockData = () => {
  loading.value = true
  
  setTimeout(() => {
    // Mock 权限策略数据
    policies.value = [
      {
        id: 'p001',
        name: '财务数据只读策略',
        description: '允许业务分析师只读访问财务分类数据',
        roles: ['analyst'],
        targetCategories: ['cat_finance'],
        permissionType: 'readonly',
        status: 'active',
        createdAt: '2024-01-15 10:30:00',
        updatedAt: '2024-01-20 14:20:00',
        effectiveTime: '2024-01-15',
        priority: 10,
        inheritRule: 'inherit'
      },
      {
        id: 'p002',
        name: '人力资源管理策略',
        description: '允许数据管理员完全管理人力资源数据',
        roles: ['data_admin'],
        targetCategories: ['cat_hr'],
        permissionType: 'admin',
        status: 'active',
        createdAt: '2024-01-10 09:00:00',
        updatedAt: '2024-01-18 16:45:00',
        effectiveTime: '2024-01-10',
        priority: 20,
        inheritRule: 'override'
      },
      {
        id: 'p003',
        name: '销售数据读写策略',
        description: '允许业务分析师读写销售数据',
        roles: ['analyst', 'data_admin'],
        targetCategories: ['cat_sales'],
        permissionType: 'readwrite',
        status: 'active',
        createdAt: '2024-01-12 11:15:00',
        updatedAt: '2024-01-22 10:30:00',
        effectiveTime: '2024-01-12',
        priority: 15,
        inheritRule: 'inherit'
      },
      {
        id: 'p004',
        name: '外部用户限制策略',
        description: '限制外部用户访问敏感数据',
        roles: ['external'],
        targetCategories: ['cat_finance', 'cat_hr'],
        permissionType: 'none',
        status: 'active',
        createdAt: '2024-01-08 08:00:00',
        updatedAt: '2024-01-08 08:00:00',
        effectiveTime: '2024-01-08',
        priority: 30,
        inheritRule: 'override'
      },
      {
        id: 'p005',
        name: '市场数据查看策略',
        description: '允许所有内部员工查看市场数据',
        roles: ['viewer', 'analyst', 'data_admin'],
        targetCategories: ['cat_market'],
        permissionType: 'readonly',
        status: 'inactive',
        createdAt: '2024-01-05 13:20:00',
        updatedAt: '2024-01-25 09:15:00',
        effectiveTime: '2024-01-05',
        priority: 5,
        inheritRule: 'inherit'
      }
    ]

    // Mock 分类树数据
    categoryTree.value = [
      {
        id: 'cat_root',
        label: '全部资产',
        permissionType: 'readonly',
        inherited: false,
        children: [
          {
            id: 'cat_finance',
            label: '财务数据',
            permissionType: 'readonly',
            inherited: true,
            children: [
              { id: 'cat_finance_revenue', label: '营收报表', permissionType: 'readonly', inherited: true },
              { id: 'cat_finance_cost', label: '成本分析', permissionType: 'none', inherited: false },
              { id: 'cat_finance_budget', label: '预算管理', permissionType: 'readwrite', inherited: false }
            ]
          },
          {
            id: 'cat_hr',
            label: '人力资源',
            permissionType: 'admin',
            inherited: false,
            children: [
              { id: 'cat_hr_employee', label: '员工信息', permissionType: 'admin', inherited: true },
              { id: 'cat_hr_salary', label: '薪资数据', permissionType: 'none', inherited: false },
              { id: 'cat_hr_performance', label: '绩效考核', permissionType: 'readwrite', inherited: false }
            ]
          },
          {
            id: 'cat_sales',
            label: '销售数据',
            permissionType: 'readwrite',
            inherited: false,
            children: [
              { id: 'cat_sales_order', label: '订单数据', permissionType: 'readwrite', inherited: true },
              { id: 'cat_sales_customer', label: '客户信息', permissionType: 'readonly', inherited: false }
            ]
          },
          {
            id: 'cat_market',
            label: '市场数据',
            permissionType: 'readonly',
            inherited: false,
            children: [
              { id: 'cat_market_research', label: '市场调研', permissionType: 'readonly', inherited: true },
              { id: 'cat_market_competitor', label: '竞品分析', permissionType: 'readonly', inherited: true }
            ]
          }
        ]
      }
    ]

    // Mock 审计日志数据
    auditLogs.value = [
      {
        id: 'log001',
        action: '创建权限策略',
        operator: '张三',
        policyName: '财务数据只读策略',
        timestamp: '2024-01-28 14:30:25',
        details: '创建了新的权限策略，适用于业务分析师角色',
        type: 'modify'
      },
      {
        id: 'log002',
        action: '访问敏感数据',
        operator: '李四',
        policyName: '人力资源管理策略',
        timestamp: '2024-01-28 13:15:10',
        details: '成功访问人力资源-薪资数据分类',
        type: 'access'
      },
      {
        id: 'log003',
        action: '权限违规尝试',
        operator: '王五',
        policyName: '外部用户限制策略',
        timestamp: '2024-01-28 12:45:33',
        details: '外部用户尝试访问财务数据，已被拒绝',
        type: 'violation'
      },
      {
        id: 'log004',
        action: '修改权限策略',
        operator: '张三',
        policyName: '销售数据读写策略',
        timestamp: '2024-01-28 11:20:15',
        details: '更新了权限优先级从10调整为15',
        type: 'modify'
      },
      {
        id: 'log005',
        action: '禁用权限策略',
        operator: '超级管理员',
        policyName: '市场数据查看策略',
        timestamp: '2024-01-28 10:05:42',
        details: '将策略状态从启用改为禁用',
        type: 'modify'
      },
      {
        id: 'log006',
        action: '批量权限测试',
        operator: '张三',
        policyName: '多个策略',
        timestamp: '2024-01-28 09:30:18',
        details: '执行了5个用户的权限测试验证',
        type: 'access'
      }
    ]

    loading.value = false
    ElMessage.success('数据加载成功')
  }, 800)
}

// ========== 权限策略操作 ==========
const handleAddPolicy = () => {
  resetPolicyForm()
  policyDialogVisible.value = true
}

const handleEditPolicy = (row: PermissionPolicy) => {
  Object.assign(policyForm, row)
  policyDialogVisible.value = true
}

const handleDeletePolicy = (row: PermissionPolicy) => {
  ElMessageBox.confirm(
    `确定要删除策略"${row.name}"吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const index = policies.value.findIndex(p => p.id === row.id)
    if (index > -1) {
      policies.value.splice(index, 1)
      ElMessage.success('删除成功')
      
      // 添加审计日志
      auditLogs.value.unshift({
        id: `log${Date.now()}`,
        action: '删除权限策略',
        operator: '当前用户',
        policyName: row.name,
        timestamp: new Date().toLocaleString('zh-CN'),
        details: `删除了权限策略"${row.name}"`,
        type: 'modify'
      })
    }
  }).catch(() => {})
}

const handleToggleStatus = (row: PermissionPolicy) => {
  const newStatus = row.status === 'active' ? 'inactive' : 'active'
  const action = newStatus === 'active' ? '启用' : '禁用'
  
  ElMessageBox.confirm(
    `确定要${action}策略"${row.name}"吗？`,
    `${action}确认`,
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    row.status = newStatus
    row.updatedAt = new Date().toLocaleString('zh-CN')
    ElMessage.success(`${action}成功`)
    
    // 添加审计日志
    auditLogs.value.unshift({
      id: `log${Date.now()}`,
      action: `${action}权限策略`,
      operator: '当前用户',
      policyName: row.name,
      timestamp: new Date().toLocaleString('zh-CN'),
      details: `将策略"${row.name}"状态改为${newStatus === 'active' ? '启用' : '禁用'}`,
      type: 'modify'
    })
  }).catch(() => {})
}

const submitPolicyForm = async () => {
  if (!policyFormRef.value) return
  
  await policyFormRef.value.validate((valid) => {
    if (valid) {
      const now = new Date().toLocaleString('zh-CN')
      
      if (policyForm.id) {
        // 编辑
        const index = policies.value.findIndex(p => p.id === policyForm.id)
        if (index > -1) {
          const originalCreatedAt = policies.value[index].createdAt
          policies.value[index] = {
            ...policyForm,
            createdAt: originalCreatedAt,
            updatedAt: now
          }
          ElMessage.success('编辑成功')
        }
      } else {
        // 新增
        policies.value.unshift({
          ...policyForm,
          id: `p${Date.now()}`,
          createdAt: now,
          updatedAt: now
        })
        ElMessage.success('新增成功')
      }
      
      // 添加审计日志
      auditLogs.value.unshift({
        id: `log${Date.now()}`,
        action: policyForm.id ? '修改权限策略' : '创建权限策略',
        operator: '当前用户',
        policyName: policyForm.name,
        timestamp: now,
        details: `${policyForm.id ? '修改' : '创建'}了权限策略"${policyForm.name}"`,
        type: 'modify'
      })
      
      policyDialogVisible.value = false
      resetPolicyForm()
    }
  })
}

const resetPolicyForm = () => {
  policyForm.id = ''
  policyForm.name = ''
  policyForm.description = ''
  policyForm.roles = []
  policyForm.targetCategories = []
  policyForm.permissionType = 'readonly'
  policyForm.status = 'active'
  policyForm.effectiveTime = ''
  policyForm.priority = 0
  policyForm.inheritRule = 'inherit'
  policyFormRef.value?.clearValidate()
}

// ========== 分类权限分配 ==========
const handleNodeClick = (data: CategoryNode) => {
  console.log('选中分类:', data)
}

const handleCheckChange = () => {
  selectedCategories.value = categoryTreeRef.value?.getCheckedKeys() || []
}

const applyPermissionToSelected = (permissionType: 'readonly' | 'readwrite' | 'admin' | 'none') => {
  if (selectedCategories.value.length === 0) {
    ElMessage.warning('请先选择要设置权限的分类')
    return
  }
  
  ElMessageBox.confirm(
    `确定要将选中的${selectedCategories.value.length}个分类设置为"${permissionTypeText(permissionType)}"权限吗？`,
    '权限设置确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 这里简化处理，实际应该递归更新树节点
    ElMessage.success(`已将${selectedCategories.value.length}个分类设置为${permissionTypeText(permissionType)}权限`)
    
    // 添加审计日志
    auditLogs.value.unshift({
      id: `log${Date.now()}`,
      action: '批量设置分类权限',
      operator: '当前用户',
      policyName: '分类权限配置',
      timestamp: new Date().toLocaleString('zh-CN'),
      details: `批量设置了${selectedCategories.value.length}个分类的权限为${permissionTypeText(permissionType)}`,
      type: 'modify'
    })
  }).catch(() => {})
}

// ========== 权限测试 ==========
const handleTestPermission = () => {
  if (!testForm.userId || !testForm.categoryId) {
    ElMessage.warning('请选择用户和分类')
    return
  }
  
  loading.value = true
  
  setTimeout(() => {
    const user = userOptions.value.find(u => u.id === testForm.userId)
    const categoryName = findCategoryName(testForm.categoryId, categoryTree.value)
    
    // 模拟权限测试逻辑
    const result: PermissionTest = {
      userId: testForm.userId,
      userName: user?.name || '未知用户',
      categoryId: testForm.categoryId,
      categoryName: categoryName || '未知分类',
      result: Math.random() > 0.3 ? 'allowed' : 'denied',
      permissionType: ['readonly', 'readwrite', 'admin', 'none'][Math.floor(Math.random() * 4)] as any,
      reason: '',
      appliedPolicy: ''
    }
    
    if (result.result === 'allowed') {
      result.reason = `用户"${user?.name}"通过策略"财务数据只读策略"获得${permissionTypeText(result.permissionType!)}权限`
      result.appliedPolicy = '财务数据只读策略'
    } else {
      result.reason = `用户"${user?.name}"的角色"${user?.role}"不在任何策略的授权范围内`
    }
    
    testResults.value.unshift(result)
    loading.value = false
    ElMessage.success('权限测试完成')
    
    // 添加审计日志
    auditLogs.value.unshift({
      id: `log${Date.now()}`,
      action: '执行权限测试',
      operator: '当前用户',
      policyName: '权限验证',
      timestamp: new Date().toLocaleString('zh-CN'),
      details: `测试用户"${user?.name}"对分类"${categoryName}"的访问权限，结果：${result.result === 'allowed' ? '允许' : '拒绝'}`,
      type: 'access'
    })
  }, 600)
}

const handleBatchTest = () => {
  testDialogVisible.value = true
}

const executeBatchTest = () => {
  loading.value = true
  
  setTimeout(() => {
    // 模拟批量测试
    const batchResults: PermissionTest[] = []
    userOptions.value.forEach(user => {
      const categories = ['cat_finance', 'cat_hr', 'cat_sales']
      categories.forEach(catId => {
        const categoryName = findCategoryName(catId, categoryTree.value)
        batchResults.push({
          userId: user.id,
          userName: user.name,
          categoryId: catId,
          categoryName: categoryName || catId,
          result: Math.random() > 0.4 ? 'allowed' : 'denied',
          permissionType: ['readonly', 'readwrite', 'admin', 'none'][Math.floor(Math.random() * 4)] as any,
          reason: Math.random() > 0.4 ? '权限验证通过' : '无相关策略授权',
          appliedPolicy: Math.random() > 0.4 ? '系统默认策略' : ''
        })
      })
    })
    
    testResults.value = [...batchResults, ...testResults.value]
    loading.value = false
    testDialogVisible.value = false
    ElMessage.success(`批量测试完成，共测试${batchResults.length}条记录`)
    
    // 添加审计日志
    auditLogs.value.unshift({
      id: `log${Date.now()}`,
      action: '批量权限测试',
      operator: '当前用户',
      policyName: '批量验证',
      timestamp: new Date().toLocaleString('zh-CN'),
      details: `执行了批量权限测试，共${batchResults.length}条测试记录`,
      type: 'access'
    })
  }, 1000)
}

const exportTestResults = () => {
  ElMessage.success('测试结果已导出')
}

const clearTestResults = () => {
  testResults.value = []
  ElMessage.success('已清空测试结果')
}

// ========== 工具函数 ==========
const findCategoryName = (id: string, nodes: CategoryNode[]): string | null => {
  for (const node of nodes) {
    if (node.id === id) return node.label
    if (node.children) {
      const found = findCategoryName(id, node.children)
      if (found) return found
    }
  }
  return null
}

const getAuditTypeColor = (type: string) => {
  const colors = {
    modify: 'primary',
    access: 'success',
    violation: 'danger'
  }
  return colors[type as keyof typeof colors] || 'info'
}

const getAuditTypeText = (type: string) => {
  const texts = {
    modify: '策略变更',
    access: '权限访问',
    violation: '违规操作'
  }
  return texts[type as keyof typeof texts] || '未知'
}

// ========== 生命周期 ==========
onMounted(() => {
  loadMockData()
})
</script>

<template>
  <div class="category-permission-container">
    <el-card class="header-card" shadow="never">
      <div class="page-header">
        <div>
          <h2>分类权限控制</h2>
          <p class="description">基于资产分类体系的细粒度权限管理，确保数据安全访问</p>
        </div>
        <el-button type="primary" @click="handleAddPolicy">
          <el-icon><Plus /></el-icon>
          新增权限策略
        </el-button>
      </div>
    </el-card>

    <el-tabs v-model="activeTab" class="main-tabs">
      <!-- 权限策略列表 -->
      <el-tab-pane label="权限策略管理" name="policies">
        <el-card shadow="never">
          <div class="search-bar">
            <el-form :inline="true" :model="searchForm">
              <el-form-item label="策略名称">
                <el-input v-model="searchForm.name" placeholder="请输入策略名称" clearable />
              </el-form-item>
              <el-form-item label="角色类型">
                <el-select v-model="searchForm.role" placeholder="请选择角色" clearable>
                  <el-option
                    v-for="role in roleOptions"
                    :key="role.value"
                    :label="role.label"
                    :value="role.value"
                  />
                </el-select>
              </el-form-item>
            </el-form>
          </div>

          <el-table :data="filteredPolicies" v-loading="loading" stripe>
            <el-table-column prop="name" label="策略名称" min-width="150" />
            <el-table-column label="适用角色" min-width="150">
              <template #default="{ row }">
                <el-tag
                  v-for="role in row.roles"
                  :key="role"
                  size="small"
                  style="margin-right: 4px"
                >
                  {{ roleOptions.find(r => r.value === role)?.label || role }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="目标分类" min-width="120">
              <template #default="{ row }">
                <div>{{ row.targetCategories.length }} 个分类</div>
              </template>
            </el-table-column>
            <el-table-column label="权限类型" width="100">
              <template #default="{ row }">
                <el-tag :type="permissionTypeColor(row.permissionType)">
                  {{ permissionTypeText(row.permissionType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="优先级" prop="priority" width="80" />
            <el-table-column label="继承规则" width="100">
              <template #default="{ row }">
                <el-tag :type="row.inheritRule === 'inherit' ? 'info' : 'warning'" size="small">
                  {{ row.inheritRule === 'inherit' ? '继承' : '覆盖' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'info'">
                  {{ row.status === 'active' ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="更新时间" prop="updatedAt" width="160" />
            <el-table-column label="操作" width="220" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleEditPolicy(row)">
                  编辑
                </el-button>
                <el-button
                  link
                  :type="row.status === 'active' ? 'warning' : 'success'"
                  size="small"
                  @click="handleToggleStatus(row)"
                >
                  {{ row.status === 'active' ? '禁用' : '启用' }}
                </el-button>
                <el-button link type="danger" size="small" @click="handleDeletePolicy(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 分类权限分配 -->
      <el-tab-pane label="分类权限分配" name="assignment">
        <el-row :gutter="16">
          <el-col :span="10">
            <el-card shadow="never">
              <template #header>
                <div class="card-header">
                  <span>分类目录树</span>
                  <el-tag type="info" size="small">已选: {{ selectedCategories.length }}</el-tag>
                </div>
              </template>
              <el-tree
                ref="categoryTreeRef"
                :data="categoryTree"
                show-checkbox
                node-key="id"
                :default-expand-all="true"
                @node-click="handleNodeClick"
                @check-change="handleCheckChange"
              >
                <template #default="{ node, data }">
                  <div class="tree-node">
                    <span class="node-label">{{ node.label }}</span>
                    <div class="node-badges">
                      <el-tag
                        v-if="data.permissionType"
                        :type="permissionTypeColor(data.permissionType)"
                        size="small"
                      >
                        {{ permissionTypeText(data.permissionType) }}
                      </el-tag>
                      <el-tag
                        v-if="data.inherited !== undefined"
                        :type="data.inherited ? 'info' : 'warning'"
                        size="small"
                      >
                        {{ data.inherited ? '继承' : '自定义' }}
                      </el-tag>
                    </div>
                  </div>
                </template>
              </el-tree>
            </el-card>
          </el-col>

          <el-col :span="14">
            <el-card shadow="never">
              <template #header>
                <span>权限设置</span>
              </template>

              <el-alert
                title="权限设置说明"
                type="info"
                :closable="false"
                style="margin-bottom: 16px"
              >
                <p>请在左侧树中选择要设置权限的分类，然后选择权限类型进行批量设置</p>
                <p>继承模式：子分类自动继承父分类权限；覆盖模式：子分类权限独立设置</p>
              </el-alert>

              <div class="permission-actions">
                <h4>批量权限设置</h4>
                <div class="action-buttons">
                  <el-button
                    type="primary"
                    @click="applyPermissionToSelected('readonly')"
                  >
                    <el-icon><View /></el-icon>
                    设为只读
                  </el-button>
                  <el-button
                    type="success"
                    @click="applyPermissionToSelected('readwrite')"
                  >
                    <el-icon><Edit /></el-icon>
                    设为读写
                  </el-button>
                  <el-button
                    type="warning"
                    @click="applyPermissionToSelected('admin')"
                  >
                    <el-icon><Setting /></el-icon>
                    设为管理
                  </el-button>
                  <el-button
                    type="info"
                    @click="applyPermissionToSelected('none')"
                  >
                    <el-icon><Close /></el-icon>
                    设为无权限
                  </el-button>
                </div>
              </div>

              <el-divider />

              <div class="special-permissions">
                <h4>特殊权限配置</h4>
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="下载权限">
                    <el-switch v-model="specialPermissions.download" />
                  </el-descriptions-item>
                  <el-descriptions-item label="分享权限">
                    <el-switch v-model="specialPermissions.share" />
                  </el-descriptions-item>
                  <el-descriptions-item label="导出权限">
                    <el-switch v-model="specialPermissions.export" />
                  </el-descriptions-item>
                  <el-descriptions-item label="删除权限">
                    <el-switch v-model="specialPermissions.delete" />
                  </el-descriptions-item>
                </el-descriptions>
              </div>

              <el-divider />

              <div class="conflict-rules">
                <h4>权限冲突处理规则</h4>
                <el-radio-group v-model="conflictRule">
                  <el-radio label="priority">按优先级（数值大优先）</el-radio>
                  <el-radio label="restrictive">最严格原则（取最小权限）</el-radio>
                  <el-radio label="permissive">最宽松原则（取最大权限）</el-radio>
                </el-radio-group>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- 权限测试验证 -->
      <el-tab-pane label="权限测试验证" name="test">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-card shadow="never">
              <template #header>
                <span>权限测试</span>
              </template>

              <el-form :model="testForm" label-width="80px">
                <el-form-item label="选择用户">
                  <el-select v-model="testForm.userId" placeholder="请选择用户">
                    <el-option
                      v-for="user in userOptions"
                      :key="user.id"
                      :label="`${user.name} (${user.role})`"
                      :value="user.id"
                    />
                  </el-select>
                </el-form-item>

                <el-form-item label="选择分类">
                  <el-tree-select
                    v-model="testForm.categoryId"
                    :data="categoryTree"
                    :render-after-expand="false"
                    placeholder="请选择分类"
                    style="width: 100%"
                  />
                </el-form-item>

                <el-form-item>
                  <el-button type="primary" @click="handleTestPermission" style="width: 100%">
                    <el-icon><Connection /></el-icon>
                    执行测试
                  </el-button>
                </el-form-item>

                <el-form-item>
                  <el-button @click="handleBatchTest" style="width: 100%">
                    <el-icon><Operation /></el-icon>
                    批量测试
                  </el-button>
                </el-form-item>
              </el-form>

              <el-divider />

              <div class="test-stats">
                <h4>测试统计</h4>
                <el-descriptions :column="1" border size="small">
                  <el-descriptions-item label="总测试数">
                    {{ testResults.length }}
                  </el-descriptions-item>
                  <el-descriptions-item label="通过数">
                    <span style="color: #67c23a">
                      {{ testResults.filter(r => r.result === 'allowed').length }}
                    </span>
                  </el-descriptions-item>
                  <el-descriptions-item label="拒绝数">
                    <span style="color: #f56c6c">
                      {{ testResults.filter(r => r.result === 'denied').length }}
                    </span>
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </el-card>
          </el-col>

          <el-col :span="16">
            <el-card shadow="never">
              <template #header>
                <div class="card-header">
                  <span>测试结果</span>
                  <div>
                    <el-button size="small" @click="exportTestResults">
                      <el-icon><Download /></el-icon>
                      导出结果
                    </el-button>
                    <el-button size="small" @click="clearTestResults">
                      <el-icon><Delete /></el-icon>
                      清空记录
                    </el-button>
                  </div>
                </div>
              </template>

              <el-table :data="testResults" v-loading="loading" stripe max-height="600">
                <el-table-column prop="userName" label="用户" width="100" />
                <el-table-column prop="categoryName" label="分类" width="150" />
                <el-table-column label="测试结果" width="100">
                  <template #default="{ row }">
                    <el-tag :type="row.result === 'allowed' ? 'success' : 'danger'">
                      {{ row.result === 'allowed' ? '允许' : '拒绝' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="权限类型" width="100">
                  <template #default="{ row }">
                    <el-tag v-if="row.permissionType" :type="permissionTypeColor(row.permissionType)">
                      {{ permissionTypeText(row.permissionType) }}
                    </el-tag>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
                <el-table-column prop="appliedPolicy" label="应用策略" width="150" />
                <el-table-column prop="reason" label="原因说明" min-width="200" />
              </el-table>

              <el-empty v-if="testResults.length === 0" description="暂无测试结果" />
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- 权限审计日志 -->
      <el-tab-pane label="权限审计日志" name="audit">
        <el-card shadow="never">
          <div class="search-bar">
            <el-form :inline="true" :model="auditFilters">
              <el-form-item label="日志类型">
                <el-select v-model="auditFilters.type" placeholder="请选择类型" clearable>
                  <el-option label="策略变更" value="modify" />
                  <el-option label="权限访问" value="access" />
                  <el-option label="违规操作" value="violation" />
                </el-select>
              </el-form-item>
              <el-form-item label="时间范围">
                <el-date-picker
                  v-model="auditFilters.dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                />
              </el-form-item>
            </el-form>
          </div>

          <el-table :data="auditLogs" stripe>
            <el-table-column label="日志类型" width="120">
              <template #default="{ row }">
                <el-tag :type="getAuditTypeColor(row.type)">
                  {{ getAuditTypeText(row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="action" label="操作动作" width="150" />
            <el-table-column prop="operator" label="操作人" width="120" />
            <el-table-column prop="policyName" label="策略名称" width="150" />
            <el-table-column prop="timestamp" label="时间" width="160" />
            <el-table-column prop="details" label="详细说明" min-width="200" />
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 权限策略编辑对话框 -->
    <el-dialog
      v-model="policyDialogVisible"
      :title="policyForm.id ? '编辑权限策略' : '新增权限策略'"
      width="600px"
      @close="resetPolicyForm"
    >
      <el-form
        ref="policyFormRef"
        :model="policyForm"
        :rules="policyFormRules"
        label-width="100px"
      >
        <el-form-item label="策略名称" prop="name">
          <el-input v-model="policyForm.name" placeholder="请输入策略名称" />
        </el-form-item>

        <el-form-item label="策略描述" prop="description">
          <el-input
            v-model="policyForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入策略描述"
          />
        </el-form-item>

        <el-form-item label="适用角色" prop="roles">
          <el-select
            v-model="policyForm.roles"
            multiple
            placeholder="请选择适用角色"
            style="width: 100%"
          >
            <el-option
              v-for="role in roleOptions"
              :key="role.value"
              :label="role.label"
              :value="role.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="目标分类" prop="targetCategories">
          <el-tree-select
            v-model="policyForm.targetCategories"
            :data="categoryTree"
            multiple
            :render-after-expand="false"
            placeholder="请选择目标分类"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="权限类型" prop="permissionType">
          <el-radio-group v-model="policyForm.permissionType">
            <el-radio label="readonly">只读</el-radio>
            <el-radio label="readwrite">读写</el-radio>
            <el-radio label="admin">管理</el-radio>
            <el-radio label="none">无权限</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="继承规则" prop="inheritRule">
          <el-radio-group v-model="policyForm.inheritRule">
            <el-radio label="inherit">继承父级</el-radio>
            <el-radio label="override">覆盖父级</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="优先级" prop="priority">
          <el-input-number v-model="policyForm.priority" :min="0" :max="100" />
          <span style="margin-left: 8px; color: #999; font-size: 12px">
            数值越大优先级越高
          </span>
        </el-form-item>

        <el-form-item label="生效时间" prop="effectiveTime">
          <el-date-picker
            v-model="policyForm.effectiveTime"
            type="date"
            placeholder="选择生效时间"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="策略状态" prop="status">
          <el-radio-group v-model="policyForm.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="policyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPolicyForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量测试对话框 -->
    <el-dialog v-model="testDialogVisible" title="批量权限测试" width="500px">
      <el-alert
        title="批量测试说明"
        type="info"
        :closable="false"
        style="margin-bottom: 16px"
      >
        将对所有用户和主要分类执行权限测试，测试过程可能需要几秒钟时间
      </el-alert>

      <el-descriptions :column="1" border>
        <el-descriptions-item label="测试用户数">
          {{ userOptions.length }} 个
        </el-descriptions-item>
        <el-descriptions-item label="测试分类数">
          3 个主要分类
        </el-descriptions-item>
        <el-descriptions-item label="预计测试数">
          {{ userOptions.length * 3 }} 条
        </el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <el-button @click="testDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="executeBatchTest" :loading="loading">
          开始测试
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.category-permission-container {
  min-height: calc(100vh - 100px);

  .header-card {
    margin-bottom: 16px;

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h2 {
        margin: 0 0 8px 0;
        font-size: 24px;
        color: #303133;
      }

      .description {
        margin: 0;
        color: #909399;
        font-size: 14px;
      }
    }
  }

  .main-tabs {
    background: white;
    padding: 16px;
    border-radius: 4px;

    .search-bar {
      margin-bottom: 16px;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .tree-node {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-right: 8px;

      .node-label {
        flex: 1;
      }

      .node-badges {
        display: flex;
        gap: 4px;
      }
    }

    .permission-actions,
    .special-permissions,
    .conflict-rules {
      h4 {
        margin: 0 0 12px 0;
        font-size: 16px;
        color: #303133;
      }

      .action-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
    }

    .test-stats {
      h4 {
        margin: 0 0 12px 0;
        font-size: 16px;
        color: #303133;
      }
    }
  }
}

:deep(.el-tree-select) {
  width: 100%;
}

:deep(.el-radio-group) {
  .el-radio {
    margin-right: 16px;
  }
}
</style>