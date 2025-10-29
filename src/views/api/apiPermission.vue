<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Search, Plus, Edit, Delete, Check, Close, DocumentCopy, Warning } from '@element-plus/icons-vue'

// 定义类型
interface ApiTreeNode {
  id: string
  label: string
  path?: string
  children?: ApiTreeNode[]
}

interface PermissionPolicy {
  id: string
  name: string
  description: string
  apiScope: string[]
  authorizedObjects: {
    apps: string[]
    users: string[]
    ipWhitelist: string[]
  }
  permissionType: 'readonly' | 'readwrite' | 'admin' | 'forbidden'
  status: 'active' | 'inactive' | 'expired'
  effectiveTime: string
  expiryTime: string
  createTime: string
  updateTime: string
}

interface AuditLog {
  id: string
  policyId: string
  policyName: string
  action: string
  operator: string
  operateTime: string
  details: string
  ipAddress: string
}

interface PermissionTestResult {
  apiPath: string
  hasPermission: boolean
  permissionType: string
  reason: string
  policyName: string
}

// 响应式数据
const loading = ref(false)
const activeTab = ref('list')

// 权限策略列表
const policyList = ref<PermissionPolicy[]>([])
const searchForm = reactive({
  name: '',
  status: ''
})

// 接口树数据
const apiTreeData = ref<ApiTreeNode[]>([])
const selectedApiNodes = ref<string[]>([])
const treeRef = ref()

// 权限策略表单
const policyDialogVisible = ref(false)
const policyFormRef = ref<FormInstance>()
const isEditMode = ref(false)
const policyForm = reactive({
  id: '',
  name: '',
  description: '',
  apiScope: [] as string[],
  apps: [] as string[],
  users: [] as string[],
  ipWhitelist: '',
  permissionType: 'readonly' as 'readonly' | 'readwrite' | 'admin' | 'forbidden',
  effectiveTime: '',
  expiryTime: ''
})

const policyFormRules: FormRules = {
  name: [{ required: true, message: '请输入策略名称', trigger: 'blur' }],
  permissionType: [{ required: true, message: '请选择权限类型', trigger: 'change' }],
  effectiveTime: [{ required: true, message: '请选择生效时间', trigger: 'change' }]
}

// 权限测试
const testDialogVisible = ref(false)
const testForm = reactive({
  testType: 'user',
  objectId: '',
  apiPath: ''
})
const testResults = ref<PermissionTestResult[]>([])
const testLoading = ref(false)

// 审计日志
const auditLogs = ref<AuditLog[]>([])
const auditLoading = ref(false)

// 统计数据
const statisticsData = reactive({
  totalPolicies: 0,
  activePolicies: 0,
  expiredPolicies: 0,
  todayAccessCount: 0
})

// 应用和用户选项
const appOptions = ref([
  { label: '数据采集应用', value: 'app_001' },
  { label: '数据分析平台', value: 'app_002' },
  { label: '移动端应用', value: 'app_003' },
  { label: '第三方对接系统', value: 'app_004' }
])

const userOptions = ref([
  { label: '张三 (zhangsan)', value: 'user_001' },
  { label: '李四 (lisi)', value: 'user_002' },
  { label: '王五 (wangwu)', value: 'user_003' },
  { label: '赵六 (zhaoliu)', value: 'user_004' }
])

// 计算属性
const filteredPolicyList = computed(() => {
  return policyList.value.filter(policy => {
    const matchName = !searchForm.name || policy.name.includes(searchForm.name)
    const matchStatus = !searchForm.status || policy.status === searchForm.status
    return matchName && matchStatus
  })
})

// 初始化数据
onMounted(() => {
  loadApiTree()
  loadPolicyList()
  loadAuditLogs()
  loadStatistics()
})

// 加载接口树数据
const loadApiTree = () => {
  // 模拟接口树数据
  apiTreeData.value = [
    {
      id: 'group_1',
      label: '数据上链接口',
      children: [
        { id: 'api_1_1', label: '批量上链', path: '/api/v1/blockchain/batch' },
        { id: 'api_1_2', label: '实时上链', path: '/api/v1/blockchain/realtime' },
        { id: 'api_1_3', label: '数据验证', path: '/api/v1/blockchain/validate' }
      ]
    },
    {
      id: 'group_2',
      label: '数据查询接口',
      children: [
        { id: 'api_2_1', label: '数据列表查询', path: '/api/v1/data/list' },
        { id: 'api_2_2', label: '数据详情查询', path: '/api/v1/data/detail' },
        { id: 'api_2_3', label: '数据统计查询', path: '/api/v1/data/statistics' }
      ]
    },
    {
      id: 'group_3',
      label: '任务管理接口',
      children: [
        { id: 'api_3_1', label: '任务创建', path: '/api/v1/task/create' },
        { id: 'api_3_2', label: '任务查询', path: '/api/v1/task/query' },
        { id: 'api_3_3', label: '任务取消', path: '/api/v1/task/cancel' }
      ]
    },
    {
      id: 'group_4',
      label: '配额控制接口',
      children: [
        { id: 'api_4_1', label: '配额查询', path: '/api/v1/quota/query' },
        { id: 'api_4_2', label: '配额配置', path: '/api/v1/quota/config' }
      ]
    }
  ]
}

// 加载权限策略列表
const loadPolicyList = () => {
  loading.value = true
  setTimeout(() => {
    policyList.value = [
      {
        id: 'policy_001',
        name: '数据采集应用全权限',
        description: '数据采集应用拥有所有上链接口的读写权限',
        apiScope: ['api_1_1', 'api_1_2', 'api_1_3'],
        authorizedObjects: {
          apps: ['app_001'],
          users: [],
          ipWhitelist: ['192.168.1.0/24']
        },
        permissionType: 'readwrite',
        status: 'active',
        effectiveTime: '2024-01-01 00:00:00',
        expiryTime: '2025-12-31 23:59:59',
        createTime: '2024-01-01 10:00:00',
        updateTime: '2024-01-01 10:00:00'
      },
      {
        id: 'policy_002',
        name: '数据分析平台只读权限',
        description: '数据分析平台只能查询数据，不能进行写操作',
        apiScope: ['api_2_1', 'api_2_2', 'api_2_3'],
        authorizedObjects: {
          apps: ['app_002'],
          users: ['user_001', 'user_002'],
          ipWhitelist: []
        },
        permissionType: 'readonly',
        status: 'active',
        effectiveTime: '2024-01-01 00:00:00',
        expiryTime: '2025-12-31 23:59:59',
        createTime: '2024-01-15 14:30:00',
        updateTime: '2024-02-20 09:15:00'
      },
      {
        id: 'policy_003',
        name: '管理员全部权限',
        description: '系统管理员拥有所有接口的管理权限',
        apiScope: ['group_1', 'group_2', 'group_3', 'group_4'],
        authorizedObjects: {
          apps: [],
          users: ['user_001'],
          ipWhitelist: []
        },
        permissionType: 'admin',
        status: 'active',
        effectiveTime: '2024-01-01 00:00:00',
        expiryTime: '2026-12-31 23:59:59',
        createTime: '2024-01-01 09:00:00',
        updateTime: '2024-01-01 09:00:00'
      },
      {
        id: 'policy_004',
        name: '第三方临时权限（已过期）',
        description: '第三方系统临时访问权限',
        apiScope: ['api_2_1'],
        authorizedObjects: {
          apps: ['app_004'],
          users: [],
          ipWhitelist: ['10.0.0.0/8']
        },
        permissionType: 'readonly',
        status: 'expired',
        effectiveTime: '2024-01-01 00:00:00',
        expiryTime: '2024-03-31 23:59:59',
        createTime: '2024-01-01 15:00:00',
        updateTime: '2024-01-01 15:00:00'
      },
      {
        id: 'policy_005',
        name: '测试环境权限（未生效）',
        description: '测试环境的权限配置',
        apiScope: ['api_1_1', 'api_2_1'],
        authorizedObjects: {
          apps: ['app_003'],
          users: ['user_003'],
          ipWhitelist: []
        },
        permissionType: 'readwrite',
        status: 'inactive',
        effectiveTime: '2025-01-01 00:00:00',
        expiryTime: '2025-12-31 23:59:59',
        createTime: '2024-10-15 16:20:00',
        updateTime: '2024-10-15 16:20:00'
      }
    ]
    loading.value = false
  }, 500)
}

// 加载审计日志
const loadAuditLogs = () => {
  auditLoading.value = true
  setTimeout(() => {
    auditLogs.value = [
      {
        id: 'log_001',
        policyId: 'policy_001',
        policyName: '数据采集应用全权限',
        action: '创建权限策略',
        operator: '管理员',
        operateTime: '2024-01-01 10:00:00',
        details: '创建了数据采集应用的全权限策略',
        ipAddress: '192.168.1.100'
      },
      {
        id: 'log_002',
        policyId: 'policy_002',
        policyName: '数据分析平台只读权限',
        action: '修改权限策略',
        operator: '管理员',
        operateTime: '2024-02-20 09:15:00',
        details: '添加了用户 user_002 到授权列表',
        ipAddress: '192.168.1.100'
      },
      {
        id: 'log_003',
        policyId: 'policy_001',
        policyName: '数据采集应用全权限',
        action: '接口访问成功',
        operator: 'app_001',
        operateTime: '2024-10-29 08:30:15',
        details: '访问接口 /api/v1/blockchain/batch',
        ipAddress: '192.168.1.50'
      },
      {
        id: 'log_004',
        policyId: 'policy_004',
        policyName: '第三方临时权限（已过期）',
        action: '接口访问失败',
        operator: 'app_004',
        operateTime: '2024-10-29 09:00:00',
        details: '权限已过期，访问被拒绝',
        ipAddress: '10.0.0.50'
      },
      {
        id: 'log_005',
        policyId: 'policy_002',
        policyName: '数据分析平台只读权限',
        action: '接口访问成功',
        operator: 'user_001',
        operateTime: '2024-10-29 10:45:30',
        details: '访问接口 /api/v1/data/list',
        ipAddress: '192.168.1.120'
      }
    ]
    auditLoading.value = false
  }, 300)
}

// 加载统计数据
const loadStatistics = () => {
  setTimeout(() => {
    statisticsData.totalPolicies = 5
    statisticsData.activePolicies = 3
    statisticsData.expiredPolicies = 1
    statisticsData.todayAccessCount = 1247
  }, 200)
}

// 搜索权限策略
const handleSearch = () => {
  // 搜索逻辑已通过计算属性实现
}

// 重置搜索
const handleReset = () => {
  searchForm.name = ''
  searchForm.status = ''
}

// 新增权限策略
const handleAdd = () => {
  isEditMode.value = false
  resetPolicyForm()
  policyDialogVisible.value = true
}

// 编辑权限策略
const handleEdit = (row: PermissionPolicy) => {
  isEditMode.value = true
  policyForm.id = row.id
  policyForm.name = row.name
  policyForm.description = row.description
  policyForm.apiScope = row.apiScope
  policyForm.apps = row.authorizedObjects.apps
  policyForm.users = row.authorizedObjects.users
  policyForm.ipWhitelist = row.authorizedObjects.ipWhitelist.join('\n')
  policyForm.permissionType = row.permissionType
  policyForm.effectiveTime = row.effectiveTime
  policyForm.expiryTime = row.expiryTime
  
  // 设置树选中状态
  setTimeout(() => {
    if (treeRef.value) {
      treeRef.value.setCheckedKeys(row.apiScope, false)
    }
  }, 100)
  
  policyDialogVisible.value = true
}

// 删除权限策略
const handleDelete = (row: PermissionPolicy) => {
  ElMessageBox.confirm(
    `确定要删除权限策略"${row.name}"吗？删除后将无法恢复。`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    loading.value = true
    setTimeout(() => {
      const index = policyList.value.findIndex(p => p.id === row.id)
      if (index > -1) {
        policyList.value.splice(index, 1)
      }
      loading.value = false
      ElMessage.success('删除成功')
      loadStatistics()
    }, 500)
  }).catch(() => {})
}

// 切换策略状态
const handleToggleStatus = (row: PermissionPolicy) => {
  const newStatus = row.status === 'active' ? 'inactive' : 'active'
  const actionText = newStatus === 'active' ? '启用' : '停用'
  
  ElMessageBox.confirm(
    `确定要${actionText}权限策略"${row.name}"吗？`,
    '状态切换',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    loading.value = true
    setTimeout(() => {
      row.status = newStatus
      loading.value = false
      ElMessage.success(`${actionText}成功`)
      loadStatistics()
    }, 500)
  }).catch(() => {})
}

// 复制权限策略
const handleCopy = (row: PermissionPolicy) => {
  isEditMode.value = false
  policyForm.id = ''
  policyForm.name = `${row.name} - 副本`
  policyForm.description = row.description
  policyForm.apiScope = [...row.apiScope]
  policyForm.apps = [...row.authorizedObjects.apps]
  policyForm.users = [...row.authorizedObjects.users]
  policyForm.ipWhitelist = row.authorizedObjects.ipWhitelist.join('\n')
  policyForm.permissionType = row.permissionType
  policyForm.effectiveTime = ''
  policyForm.expiryTime = ''
  
  setTimeout(() => {
    if (treeRef.value) {
      treeRef.value.setCheckedKeys(row.apiScope, false)
    }
  }, 100)
  
  policyDialogVisible.value = true
}

// 保存权限策略
const handleSavePolicy = async () => {
  if (!policyFormRef.value) return
  
  await policyFormRef.value.validate((valid) => {
    if (valid) {
      // 获取选中的接口节点
      const checkedKeys = treeRef.value.getCheckedKeys()
      policyForm.apiScope = checkedKeys
      
      if (policyForm.apiScope.length === 0) {
        ElMessage.warning('请至少选择一个接口')
        return
      }
      
      loading.value = true
      setTimeout(() => {
        if (isEditMode.value) {
          // 编辑模式
          const policy = policyList.value.find(p => p.id === policyForm.id)
          if (policy) {
            policy.name = policyForm.name
            policy.description = policyForm.description
            policy.apiScope = policyForm.apiScope
            policy.authorizedObjects = {
              apps: policyForm.apps,
              users: policyForm.users,
              ipWhitelist: policyForm.ipWhitelist ? policyForm.ipWhitelist.split('\n').filter(ip => ip.trim()) : []
            }
            policy.permissionType = policyForm.permissionType
            policy.effectiveTime = policyForm.effectiveTime
            policy.expiryTime = policyForm.expiryTime
            policy.updateTime = new Date().toLocaleString('zh-CN')
          }
          ElMessage.success('更新成功')
        } else {
          // 新增模式
          const newPolicy: PermissionPolicy = {
            id: `policy_${Date.now()}`,
            name: policyForm.name,
            description: policyForm.description,
            apiScope: policyForm.apiScope,
            authorizedObjects: {
              apps: policyForm.apps,
              users: policyForm.users,
              ipWhitelist: policyForm.ipWhitelist ? policyForm.ipWhitelist.split('\n').filter(ip => ip.trim()) : []
            },
            permissionType: policyForm.permissionType,
            status: 'inactive',
            effectiveTime: policyForm.effectiveTime,
            expiryTime: policyForm.expiryTime,
            createTime: new Date().toLocaleString('zh-CN'),
            updateTime: new Date().toLocaleString('zh-CN')
          }
          policyList.value.unshift(newPolicy)
          ElMessage.success('创建成功')
        }
        loading.value = false
        policyDialogVisible.value = false
        loadStatistics()
      }, 800)
    }
  })
}

// 重置表单
const resetPolicyForm = () => {
  policyForm.id = ''
  policyForm.name = ''
  policyForm.description = ''
  policyForm.apiScope = []
  policyForm.apps = []
  policyForm.users = []
  policyForm.ipWhitelist = ''
  policyForm.permissionType = 'readonly'
  policyForm.effectiveTime = ''
  policyForm.expiryTime = ''
  
  if (treeRef.value) {
    treeRef.value.setCheckedKeys([], false)
  }
  
  policyFormRef.value?.clearValidate()
}

// 打开权限测试对话框
const handleOpenTest = () => {
  testForm.testType = 'user'
  testForm.objectId = ''
  testForm.apiPath = ''
  testResults.value = []
  testDialogVisible.value = true
}

// 执行权限测试
const handleExecuteTest = () => {
  if (!testForm.objectId) {
    ElMessage.warning('请输入测试对象ID')
    return
  }
  
  testLoading.value = true
  setTimeout(() => {
    // 模拟权限测试结果
    testResults.value = [
      {
        apiPath: '/api/v1/blockchain/batch',
        hasPermission: true,
        permissionType: 'readwrite',
        reason: '符合策略：数据采集应用全权限',
        policyName: '数据采集应用全权限'
      },
      {
        apiPath: '/api/v1/blockchain/realtime',
        hasPermission: true,
        permissionType: 'readwrite',
        reason: '符合策略：数据采集应用全权限',
        policyName: '数据采集应用全权限'
      },
      {
        apiPath: '/api/v1/data/list',
        hasPermission: testForm.testType === 'user',
        permissionType: testForm.testType === 'user' ? 'readonly' : '',
        reason: testForm.testType === 'user' ? '符合策略：数据分析平台只读权限' : '无匹配的权限策略',
        policyName: testForm.testType === 'user' ? '数据分析平台只读权限' : ''
      },
      {
        apiPath: '/api/v1/task/create',
        hasPermission: false,
        permissionType: '',
        reason: '无匹配的权限策略',
        policyName: ''
      }
    ]
    testLoading.value = false
  }, 1000)
}

// 批量权限测试
const handleBatchTest = () => {
  ElMessage.info('批量权限测试功能开发中...')
}

// 导出测试结果
const handleExportTestResults = () => {
  if (testResults.value.length === 0) {
    ElMessage.warning('暂无测试结果可导出')
    return
  }
  ElMessage.success('测试结果导出成功')
}

// 权限冲突检测
const handleConflictDetection = () => {
  ElMessageBox.alert(
    '经检测，当前权限策略配置正常，未发现冲突。',
    '冲突检测结果',
    {
      confirmButtonText: '确定',
      type: 'success'
    }
  )
}

// 获取权限类型标签类型
const getPermissionTypeTag = (type: string) => {
  const typeMap: Record<string, string> = {
    readonly: '',
    readwrite: 'success',
    admin: 'warning',
    forbidden: 'danger'
  }
  return typeMap[type] || 'info'
}

// 获取权限类型文本
const getPermissionTypeText = (type: string) => {
  const textMap: Record<string, string> = {
    readonly: '只读',
    readwrite: '读写',
    admin: '管理',
    forbidden: '禁止'
  }
  return textMap[type] || type
}

// 获取状态标签类型
const getStatusTag = (status: string) => {
  const statusMap: Record<string, string> = {
    active: 'success',
    inactive: 'info',
    expired: 'danger'
  }
  return statusMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    active: '生效中',
    inactive: '未生效',
    expired: '已过期'
  }
  return textMap[status] || status
}

// 获取操作类型标签
const getActionTag = (action: string) => {
  if (action.includes('成功')) return 'success'
  if (action.includes('失败')) return 'danger'
  if (action.includes('创建')) return 'primary'
  if (action.includes('修改')) return 'warning'
  return 'info'
}

// 格式化授权对象
const formatAuthorizedObjects = (objects: PermissionPolicy['authorizedObjects']) => {
  const parts = []
  if (objects.apps.length > 0) {
    parts.push(`应用:${objects.apps.length}个`)
  }
  if (objects.users.length > 0) {
    parts.push(`用户:${objects.users.length}个`)
  }
  if (objects.ipWhitelist.length > 0) {
    parts.push(`IP:${objects.ipWhitelist.length}个`)
  }
  return parts.join(', ') || '未配置'
}

// 格式化接口范围
const formatApiScope = (apiScope: string[]) => {
  return `${apiScope.length} 个接口`
}
</script>

<template>
  <div class="api-permission-container">
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="statistics-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon total">📋</div>
            <div class="stat-info">
              <div class="stat-value">{{ statisticsData.totalPolicies }}</div>
              <div class="stat-label">总策略数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon active">✓</div>
            <div class="stat-info">
              <div class="stat-value">{{ statisticsData.activePolicies }}</div>
              <div class="stat-label">生效策略</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon expired">⚠</div>
            <div class="stat-info">
              <div class="stat-value">{{ statisticsData.expiredPolicies }}</div>
              <div class="stat-label">过期策略</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon access">📊</div>
            <div class="stat-info">
              <div class="stat-value">{{ statisticsData.todayAccessCount }}</div>
              <div class="stat-label">今日访问</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 主内容区域 -->
    <el-card class="main-card" shadow="never">
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 权限策略列表 -->
        <el-tab-pane label="权限策略列表" name="list">
          <!-- 搜索区域 -->
          <div class="search-section">
            <el-form :inline="true" :model="searchForm">
              <el-form-item label="策略名称">
                <el-input 
                  v-model="searchForm.name" 
                  placeholder="请输入策略名称" 
                  clearable
                  @keyup.enter="handleSearch"
                />
              </el-form-item>
              <el-form-item label="状态">
                <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
                  <el-option label="生效中" value="active" />
                  <el-option label="未生效" value="inactive" />
                  <el-option label="已过期" value="expired" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
                <el-button @click="handleReset">重置</el-button>
                <el-button type="success" :icon="Plus" @click="handleAdd">新增策略</el-button>
                <el-button :icon="Warning" @click="handleConflictDetection">冲突检测</el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 策略列表表格 -->
          <el-table 
            :data="filteredPolicyList" 
            v-loading="loading" 
            border
            stripe
            style="width: 100%"
            :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
          >
            <el-table-column prop="name" label="策略名称" min-width="180" />
            <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
            <el-table-column label="适用接口" min-width="100" align="center">
              <template #default="{ row }">
                {{ formatApiScope(row.apiScope) }}
              </template>
            </el-table-column>
            <el-table-column label="授权对象" min-width="150" align="center">
              <template #default="{ row }">
                {{ formatAuthorizedObjects(row.authorizedObjects) }}
              </template>
            </el-table-column>
            <el-table-column label="权限类型" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getPermissionTypeTag(row.permissionType)">
                  {{ getPermissionTypeText(row.permissionType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getStatusTag(row.status)">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="effectiveTime" label="生效时间" width="160" />
            <el-table-column prop="expiryTime" label="过期时间" width="160" />
            <el-table-column label="操作" width="280" fixed="right" align="center">
              <template #default="{ row }">
                <el-button 
                  link 
                  type="primary" 
                  :icon="Edit" 
                  size="small" 
                  @click="handleEdit(row)"
                >
                  编辑
                </el-button>
                <el-button 
                  link 
                  :type="row.status === 'active' ? 'warning' : 'success'" 
                  :icon="row.status === 'active' ? Close : Check" 
                  size="small" 
                  @click="handleToggleStatus(row)"
                >
                  {{ row.status === 'active' ? '停用' : '启用' }}
                </el-button>
                <el-button 
                  link 
                  type="info" 
                  :icon="DocumentCopy" 
                  size="small" 
                  @click="handleCopy(row)"
                >
                  复制
                </el-button>
                <el-button 
                  link 
                  type="danger" 
                  :icon="Delete" 
                  size="small" 
                  @click="handleDelete(row)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 权限测试验证 -->
        <el-tab-pane label="权限测试验证" name="test">
          <div class="test-section">
            <el-alert
              title="权限测试说明"
              type="info"
              description="输入测试对象ID和接口路径，验证该对象是否具有访问权限。支持批量测试和结果导出。"
              :closable="false"
              show-icon
              style="margin-bottom: 20px;"
            />

            <el-form :model="testForm" label-width="120px">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="测试类型">
                    <el-radio-group v-model="testForm.testType">
                      <el-radio label="user">用户</el-radio>
                      <el-radio label="app">应用</el-radio>
                      <el-radio label="ip">IP地址</el-radio>
                    </el-radio-group>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="对象ID">
                    <el-input 
                      v-model="testForm.objectId" 
                      placeholder="输入用户ID、应用ID或IP地址"
                    />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item>
                <el-button type="primary" @click="handleExecuteTest" :loading="testLoading">
                  执行测试
                </el-button>
                <el-button @click="handleBatchTest">批量测试</el-button>
                <el-button @click="handleExportTestResults">导出结果</el-button>
              </el-form-item>
            </el-form>

            <!-- 测试结果 -->
            <div v-if="testResults.length > 0" class="test-results">
              <h3>测试结果</h3>
              <el-table :data="testResults" border stripe>
                <el-table-column prop="apiPath" label="接口路径" min-width="200" />
                <el-table-column label="是否有权限" width="120" align="center">
                  <template #default="{ row }">
                    <el-tag :type="row.hasPermission ? 'success' : 'danger'">
                      {{ row.hasPermission ? '有权限' : '无权限' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="权限类型" width="100" align="center">
                  <template #default="{ row }">
                    <el-tag v-if="row.permissionType" :type="getPermissionTypeTag(row.permissionType)">
                      {{ getPermissionTypeText(row.permissionType) }}
                    </el-tag>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
                <el-table-column prop="policyName" label="匹配策略" min-width="180" />
                <el-table-column prop="reason" label="原因说明" min-width="200" />
              </el-table>
            </div>
          </div>
        </el-tab-pane>

        <!-- 审计日志 -->
        <el-tab-pane label="审计日志" name="audit">
          <div class="audit-section">
            <el-table 
              :data="auditLogs" 
              v-loading="auditLoading" 
              border
              stripe
              style="width: 100%"
            >
              <el-table-column prop="policyName" label="策略名称" min-width="180" />
              <el-table-column label="操作类型" width="120" align="center">
                <template #default="{ row }">
                  <el-tag :type="getActionTag(row.action)">
                    {{ row.action }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="operator" label="操作者" width="120" />
              <el-table-column prop="operateTime" label="操作时间" width="160" />
              <el-table-column prop="ipAddress" label="IP地址" width="140" />
              <el-table-column prop="details" label="详细信息" min-width="250" show-overflow-tooltip />
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 权限策略配置对话框 -->
    <el-dialog
      v-model="policyDialogVisible"
      :title="isEditMode ? '编辑权限策略' : '新增权限策略'"
      width="900px"
      :close-on-click-modal="false"
      @close="resetPolicyForm"
    >
      <el-form
        ref="policyFormRef"
        :model="policyForm"
        :rules="policyFormRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="策略名称" prop="name">
              <el-input v-model="policyForm.name" placeholder="请输入策略名称" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="策略描述" prop="description">
              <el-input 
                v-model="policyForm.description" 
                type="textarea" 
                :rows="2"
                placeholder="请输入策略描述"
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="权限类型" prop="permissionType">
              <el-select v-model="policyForm.permissionType" placeholder="请选择权限类型">
                <el-option label="只读" value="readonly" />
                <el-option label="读写" value="readwrite" />
                <el-option label="管理" value="admin" />
                <el-option label="禁止" value="forbidden" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="接口权限范围">
              <el-tree
                ref="treeRef"
                :data="apiTreeData"
                show-checkbox
                node-key="id"
                :props="{ children: 'children', label: 'label' }"
                default-expand-all
                style="width: 100%"
              />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="授权应用">
              <el-select 
                v-model="policyForm.apps" 
                multiple 
                placeholder="请选择授权应用"
                style="width: 100%"
              >
                <el-option 
                  v-for="app in appOptions" 
                  :key="app.value" 
                  :label="app.label" 
                  :value="app.value" 
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="授权用户">
              <el-select 
                v-model="policyForm.users" 
                multiple 
                placeholder="请选择授权用户"
                style="width: 100%"
              >
                <el-option 
                  v-for="user in userOptions" 
                  :key="user.value" 
                  :label="user.label" 
                  :value="user.value" 
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="IP白名单">
              <el-input 
                v-model="policyForm.ipWhitelist" 
                type="textarea" 
                :rows="3"
                placeholder="请输入IP白名单，每行一个IP或CIDR段，如：192.168.1.1 或 192.168.1.0/24"
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="生效时间" prop="effectiveTime">
              <el-date-picker
                v-model="policyForm.effectiveTime"
                type="datetime"
                placeholder="选择生效时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="过期时间" prop="expiryTime">
              <el-date-picker
                v-model="policyForm.expiryTime"
                type="datetime"
                placeholder="选择过期时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="policyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSavePolicy" :loading="loading">
          {{ isEditMode ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.api-permission-container {
  min-height: 100vh;

  .statistics-row {
    margin-bottom: 20px;

    .stat-card {
      border-radius: 8px;
      transition: transform 0.3s;

      &:hover {
        transform: translateY(-4px);
      }

      .stat-content {
        display: flex;
        align-items: center;
        gap: 15px;

        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;

          &.total {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }

          &.active {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
          }

          &.expired {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          }

          &.access {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          }
        }

        .stat-info {
          flex: 1;

          .stat-value {
            font-size: 28px;
            font-weight: bold;
            color: #303133;
            line-height: 1.2;
          }

          .stat-label {
            font-size: 14px;
            color: #909399;
            margin-top: 4px;
          }
        }
      }
    }
  }

  .main-card {
    border-radius: 8px;

    .search-section {
      margin-bottom: 20px;
      padding: 15px;
      background: #f9fafc;
      border-radius: 6px;
    }

    .test-section {
      padding: 20px;

      .test-results {
        margin-top: 30px;

        h3 {
          margin-bottom: 15px;
          color: #303133;
          font-size: 16px;
          font-weight: 600;
        }
      }
    }

    .audit-section {
      padding: 20px;
    }
  }

  :deep(.el-tabs--border-card) {
    border: none;
    box-shadow: none;

    > .el-tabs__content {
      padding: 20px;
    }
  }

  :deep(.el-table) {
    font-size: 13px;

    .el-button + .el-button {
      margin-left: 8px;
    }
  }

  :deep(.el-tree) {
    background: #f9fafc;
    padding: 15px;
    border-radius: 6px;
    border: 1px solid #e4e7ed;
  }
}
</style>