<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// ==================== 类型定义 ====================
interface AccessKey {
  id: string
  name: string
  accessKey: string
  secretKey?: string
  status: 'enabled' | 'disabled' | 'expiring'
  permissions: string[]
  description: string
  validUntil: string
  callLimit: number
  callCount: number
  successRate: number
  createdAt: string
  lastUsedAt: string
  dataPermissions: string[]
}

interface CreateKeyForm {
  name: string
  description: string
  permissions: string[]
  dataPermissions: string[]
  validDays: number
  callLimit: number
}

interface UsageStats {
  date: string
  calls: number
  success: number
  failed: number
}

// ==================== 状态管理 ====================
const loading = ref(false)
const searchKeyword = ref('')
const statusFilter = ref('all')
const tableData = ref<AccessKey[]>([])

// 创建密钥对话框
const createDialogVisible = ref(false)
const createFormRef = ref<FormInstance>()
const createForm = reactive<CreateKeyForm>({
  name: '',
  description: '',
  permissions: [],
  dataPermissions: [],
  validDays: 365,
  callLimit: 10000
})

// 创建成功对话框（显示密钥）
const keyResultDialogVisible = ref(false)
const generatedKey = ref({
  accessKey: '',
  secretKey: ''
})

// 详情对话框
const detailDialogVisible = ref(false)
const currentKey = ref<AccessKey | null>(null)
const usageStats = ref<UsageStats[]>([])

// 编辑权限对话框
const editPermissionDialogVisible = ref(false)
const editPermissionFormRef = ref<FormInstance>()
const editPermissionForm = reactive({
  id: '',
  permissions: [] as string[],
  dataPermissions: [] as string[]
})

// 续期对话框
const renewDialogVisible = ref(false)
const renewForm = reactive({
  id: '',
  days: 365
})

// 权限选项
const permissionOptions = [
  { label: '模型调用', value: 'model:invoke', color: 'primary' },
  { label: '数据查询', value: 'data:query', color: 'success' },
  { label: '数据上传', value: 'data:upload', color: 'warning' },
  { label: '配额管理', value: 'quota:manage', color: 'danger' },
  { label: '日志查看', value: 'log:view', color: 'info' }
]

const dataPermissionOptions = [
  { label: '个人数据', value: 'personal', color: 'primary' },
  { label: '部门数据', value: 'department', color: 'success' },
  { label: '全部数据', value: 'all', color: 'warning' }
]

// 表单验证规则
const createRules: FormRules<CreateKeyForm> = {
  name: [
    { required: true, message: '请输入密钥名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  permissions: [
    { required: true, message: '请至少选择一个接口权限', trigger: 'change' }
  ],
  dataPermissions: [
    { required: true, message: '请至少选择一个数据权限', trigger: 'change' }
  ],
  validDays: [
    { required: true, message: '请输入有效天数', trigger: 'blur' }
  ],
  callLimit: [
    { required: true, message: '请输入调用限额', trigger: 'blur' }
  ]
}

// ==================== 计算属性 ====================
const filteredTableData = computed(() => {
  let data = tableData.value

  // 状态筛选
  if (statusFilter.value !== 'all') {
    data = data.filter(item => item.status === statusFilter.value)
  }

  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    data = data.filter(
      item =>
        item.name.toLowerCase().includes(keyword) ||
        item.accessKey.toLowerCase().includes(keyword)
    )
  }

  return data
})

// 统计数据
const statistics = computed(() => {
  const total = tableData.value.length
  const enabled = tableData.value.filter(item => item.status === 'enabled').length
  const disabled = tableData.value.filter(item => item.status === 'disabled').length
  const expiring = tableData.value.filter(item => item.status === 'expiring').length
  const totalCalls = tableData.value.reduce((sum, item) => sum + item.callCount, 0)

  return { total, enabled, disabled, expiring, totalCalls }
})

// ==================== Mock 数据生成 ====================
const generateMockData = (): AccessKey[] => {
  const data: AccessKey[] = []
  const names = ['生产环境密钥', '测试环境密钥', '开发环境密钥', '移动端密钥', 'Web端密钥', '数据分析密钥', '第三方集成密钥']
  const statuses: Array<'enabled' | 'disabled' | 'expiring'> = ['enabled', 'enabled', 'enabled', 'disabled', 'expiring']

  for (let i = 0; i < 7; i++) {
    const status = statuses[i % statuses.length]
    const createdDate = new Date()
    createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 180))
    
    const validDate = new Date(createdDate)
    validDate.setDate(validDate.getDate() + 365)

    const lastUsedDate = new Date()
    lastUsedDate.setHours(lastUsedDate.getHours() - Math.floor(Math.random() * 48))

    const callCount = Math.floor(Math.random() * 50000)
    const successRate = 95 + Math.random() * 5

    data.push({
      id: `key_${1000 + i}`,
      name: names[i] || `密钥${i + 1}`,
      accessKey: `AK${Math.random().toString(36).substring(2, 15).toUpperCase()}${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
      status: status,
      permissions: permissionOptions.slice(0, Math.floor(Math.random() * 3) + 2).map(p => p.value),
      description: `这是用于${names[i]}的访问密钥，用于API身份认证`,
      validUntil: validDate.toISOString().split('T')[0],
      callLimit: [10000, 50000, 100000][Math.floor(Math.random() * 3)],
      callCount: callCount,
      successRate: Math.round(successRate * 100) / 100,
      createdAt: createdDate.toISOString().split('T')[0],
      lastUsedAt: lastUsedDate.toISOString(),
      dataPermissions: dataPermissionOptions.slice(0, Math.floor(Math.random() * 2) + 1).map(p => p.value)
    })
  }

  return data
}

const generateUsageStats = (): UsageStats[] => {
  const stats: UsageStats[] = []
  for (let i = 29; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const calls = Math.floor(Math.random() * 1000) + 100
    const success = Math.floor(calls * (0.95 + Math.random() * 0.05))
    stats.push({
      date: date.toISOString().split('T')[0],
      calls: calls,
      success: success,
      failed: calls - success
    })
  }
  return stats
}

// ==================== API 方法（Mock） ====================
const fetchAccessKeys = async () => {
  loading.value = true
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      tableData.value = generateMockData()
      loading.value = false
      resolve()
    }, 500)
  })
}

const createAccessKey = async (form: CreateKeyForm) => {
  return new Promise<{ accessKey: string; secretKey: string }>((resolve) => {
    setTimeout(() => {
      const newKey: AccessKey = {
        id: `key_${Date.now()}`,
        name: form.name,
        accessKey: `AK${Math.random().toString(36).substring(2, 15).toUpperCase()}${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
        status: 'enabled',
        permissions: form.permissions,
        description: form.description,
        validUntil: new Date(Date.now() + form.validDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        callLimit: form.callLimit,
        callCount: 0,
        successRate: 100,
        createdAt: new Date().toISOString().split('T')[0],
        lastUsedAt: '-',
        dataPermissions: form.dataPermissions
      }
      
      const secretKey = `SK${Math.random().toString(36).substring(2, 15).toUpperCase()}${Math.random().toString(36).substring(2, 25).toUpperCase()}`
      
      tableData.value.unshift(newKey)
      resolve({ accessKey: newKey.accessKey, secretKey })
    }, 800)
  })
}

// ==================== 事件处理 ====================
const handleCreate = () => {
  createDialogVisible.value = true
  Object.assign(createForm, {
    name: '',
    description: '',
    permissions: [],
    dataPermissions: [],
    validDays: 365,
    callLimit: 10000
  })
}

const submitCreate = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  
  await formEl.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const result = await createAccessKey(createForm)
        generatedKey.value = result
        createDialogVisible.value = false
        keyResultDialogVisible.value = true
        ElMessage.success('密钥创建成功')
      } catch (error) {
        ElMessage.error('密钥创建失败')
      } finally {
        loading.value = false
      }
    }
  })
}

const handleStatusChange = async (row: AccessKey) => {
  const newStatus = row.status === 'enabled' ? 'disabled' : 'enabled'
  const action = newStatus === 'enabled' ? '启用' : '禁用'
  
  try {
    await ElMessageBox.confirm(`确定要${action}密钥 "${row.name}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    loading.value = true
    setTimeout(() => {
      row.status = newStatus
      loading.value = false
      ElMessage.success(`${action}成功`)
    }, 500)
  } catch {
    // 用户取消
  }
}

const handleViewDetail = async (row: AccessKey) => {
  currentKey.value = row
  loading.value = true
  detailDialogVisible.value = true
  
  setTimeout(() => {
    usageStats.value = generateUsageStats()
    loading.value = false
  }, 500)
}

const handleEditPermission = (row: AccessKey) => {
  editPermissionForm.id = row.id
  editPermissionForm.permissions = [...row.permissions]
  editPermissionForm.dataPermissions = [...row.dataPermissions]
  editPermissionDialogVisible.value = true
}

const submitEditPermission = async () => {
  loading.value = true
  setTimeout(() => {
    const key = tableData.value.find(k => k.id === editPermissionForm.id)
    if (key) {
      key.permissions = [...editPermissionForm.permissions]
      key.dataPermissions = [...editPermissionForm.dataPermissions]
    }
    editPermissionDialogVisible.value = false
    loading.value = false
    ElMessage.success('权限修改成功')
  }, 500)
}

const handleRenew = (row: AccessKey) => {
  renewForm.id = row.id
  renewForm.days = 365
  renewDialogVisible.value = true
}

const submitRenew = async () => {
  loading.value = true
  setTimeout(() => {
    const key = tableData.value.find(k => k.id === renewForm.id)
    if (key) {
      const newDate = new Date()
      newDate.setDate(newDate.getDate() + renewForm.days)
      key.validUntil = newDate.toISOString().split('T')[0]
      key.status = 'enabled'
    }
    renewDialogVisible.value = false
    loading.value = false
    ElMessage.success('续期成功')
  }, 500)
}

const handleRegenerate = async (row: AccessKey) => {
  try {
    await ElMessageBox.confirm(
      '重新生成将更新Secret Key，旧的Secret Key将立即失效，确定继续吗？',
      '重新生成密钥',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    loading.value = true
    setTimeout(() => {
      const newSecretKey = `SK${Math.random().toString(36).substring(2, 15).toUpperCase()}${Math.random().toString(36).substring(2, 25).toUpperCase()}`
      generatedKey.value = {
        accessKey: row.accessKey,
        secretKey: newSecretKey
      }
      keyResultDialogVisible.value = true
      loading.value = false
      ElMessage.success('密钥重新生成成功')
    }, 500)
  } catch {
    // 用户取消
  }
}

const handleExport = (row: AccessKey) => {
  const data = {
    name: row.name,
    accessKey: row.accessKey,
    permissions: row.permissions,
    dataPermissions: row.dataPermissions,
    validUntil: row.validUntil,
    callLimit: row.callLimit,
    createdAt: row.createdAt
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${row.name}_${row.accessKey}.json`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

const handleDelete = async (row: AccessKey) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除密钥 "${row.name}" 吗？删除后将无法恢复。`,
      '删除密钥',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
    
    loading.value = true
    setTimeout(() => {
      const index = tableData.value.findIndex(k => k.id === row.id)
      if (index > -1) {
        tableData.value.splice(index, 1)
      }
      loading.value = false
      ElMessage.success('删除成功')
    }, 500)
  } catch {
    // 用户取消
  }
}

const copyToClipboard = (text: string, label: string) => {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success(`${label}已复制到剪贴板`)
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

const getStatusType = (status: string) => {
  const map: Record<string, 'success' | 'danger' | 'warning'> = {
    enabled: 'success',
    disabled: 'danger',
    expiring: 'warning'
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    enabled: '启用',
    disabled: '禁用',
    expiring: '即将过期'
  }
  return map[status] || status
}

const getPermissionColor = (permission: string) => {
  const found = permissionOptions.find(p => p.value === permission)
  return found?.color || 'info'
}

const getPermissionLabel = (permission: string) => {
  const found = permissionOptions.find(p => p.value === permission)
  return found?.label || permission
}

const getDataPermissionColor = (permission: string) => {
  const found = dataPermissionOptions.find(p => p.value === permission)
  return found?.color || 'info'
}

const getDataPermissionLabel = (permission: string) => {
  const found = dataPermissionOptions.find(p => p.value === permission)
  return found?.label || permission
}

const formatDateTime = (dateStr: string) => {
  if (dateStr === '-') return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

// ==================== 生命周期 ====================
onMounted(() => {
  fetchAccessKeys()
})
</script>

<template>
  <div class="access-key-container">
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="statistics-row">
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="总密钥数" :value="statistics.total">
            <template #suffix>
              <span style="font-size: 14px">个</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="启用中" :value="statistics.enabled">
            <template #suffix>
              <span style="font-size: 14px; color: #67c23a">个</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="即将过期" :value="statistics.expiring">
            <template #suffix>
              <span style="font-size: 14px; color: #e6a23c">个</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="总调用次数" :value="statistics.totalCalls">
            <template #suffix>
              <span style="font-size: 14px">次</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索和操作区 -->
    <el-card class="search-card">
      <el-row :gutter="16" align="middle">
        <el-col :span="6">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索密钥名称或Access Key"
            clearable
            prefix-icon="Search"
          />
        </el-col>
        <el-col :span="6">
          <el-select v-model="statusFilter" placeholder="状态筛选" style="width: 100%">
            <el-option label="全部状态" value="all" />
            <el-option label="启用" value="enabled" />
            <el-option label="禁用" value="disabled" />
            <el-option label="即将过期" value="expiring" />
          </el-select>
        </el-col>
        <el-col :span="12" style="text-align: right">
          <el-button type="primary" @click="handleCreate" icon="Plus">
            创建密钥
          </el-button>
          <el-button @click="fetchAccessKeys" icon="Refresh">刷新</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 密钥列表 -->
    <el-card class="table-card">
      <el-table
        :data="filteredTableData"
        v-loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="name" label="密钥名称" width="150" />
        <el-table-column prop="accessKey" label="Access Key" width="220">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; gap: 8px">
              <code style="font-size: 12px">{{ row.accessKey }}</code>
              <el-button
                link
                type="primary"
                size="small"
                @click="copyToClipboard(row.accessKey, 'Access Key')"
                icon="CopyDocument"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="接口权限" width="260">
          <template #default="{ row }">
            <el-tag
              v-for="perm in row.permissions"
              :key="perm"
              :type="getPermissionColor(perm)"
              size="small"
              style="margin-right: 4px; margin-bottom: 4px"
            >
              {{ getPermissionLabel(perm) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="数据权限" width="180">
          <template #default="{ row }">
            <el-tag
              v-for="perm in row.dataPermissions"
              :key="perm"
              :type="getDataPermissionColor(perm)"
              size="small"
              style="margin-right: 4px"
            >
              {{ getDataPermissionLabel(perm) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="使用情况" width="180">
          <template #default="{ row }">
            <div style="font-size: 12px">
              <div>调用: {{ row.callCount.toLocaleString() }} / {{ row.callLimit.toLocaleString() }}</div>
              <div>成功率: {{ row.successRate }}%</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="validUntil" label="有效期至" width="110" />
        <el-table-column prop="createdAt" label="创建时间" width="110" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              size="small"
              @click="handleViewDetail(row)"
            >
              详情
            </el-button>
            <el-button
              link
              :type="row.status === 'enabled' ? 'warning' : 'success'"
              size="small"
              @click="handleStatusChange(row)"
            >
              {{ row.status === 'enabled' ? '禁用' : '启用' }}
            </el-button>
            <el-button
              link
              type="primary"
              size="small"
              @click="handleEditPermission(row)"
            >
              权限
            </el-button>
            <el-dropdown trigger="click">
              <el-button link type="primary" size="small">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleRenew(row)">
                    <el-icon><Clock /></el-icon>续期
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleRegenerate(row)">
                    <el-icon><RefreshRight /></el-icon>重新生成
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleExport(row)">
                    <el-icon><Download /></el-icon>导出
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="handleDelete(row)">
                    <el-icon><Delete /></el-icon>
                    <span style="color: #f56c6c">删除</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建密钥对话框 -->
    <el-dialog
      v-model="createDialogVisible"
      title="创建访问密钥"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="100px"
      >
        <el-form-item label="密钥名称" prop="name">
          <el-input
            v-model="createForm.name"
            placeholder="请输入密钥名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="描述信息" prop="description">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入密钥用途描述"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="接口权限" prop="permissions">
          <el-checkbox-group v-model="createForm.permissions">
            <el-checkbox
              v-for="option in permissionOptions"
              :key="option.value"
              :label="option.value"
            >
              {{ option.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="数据权限" prop="dataPermissions">
          <el-radio-group v-model="createForm.dataPermissions">
            <el-radio
              v-for="option in dataPermissionOptions"
              :key="option.value"
              :label="[option.value]"
            >
              {{ option.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="有效期" prop="validDays">
          <el-input-number
            v-model="createForm.validDays"
            :min="1"
            :max="3650"
            style="width: 100%"
          />
          <span style="margin-left: 8px; color: #909399">天</span>
        </el-form-item>
        <el-form-item label="调用限额" prop="callLimit">
          <el-input-number
            v-model="createForm.callLimit"
            :min="1"
            :max="1000000"
            :step="1000"
            style="width: 100%"
          />
          <span style="margin-left: 8px; color: #909399">次/天</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="submitCreate(createFormRef)"
          :loading="loading"
        >
          创建
        </el-button>
      </template>
    </el-dialog>

    <!-- 密钥生成结果对话框 -->
    <el-dialog
      v-model="keyResultDialogVisible"
      title="密钥生成成功"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-alert
        title="请妥善保管您的密钥信息"
        type="warning"
        description="Secret Key仅显示一次，请立即复制保存，关闭后将无法再次查看"
        :closable="false"
        style="margin-bottom: 20px"
      />
      
      <el-form label-width="100px">
        <el-form-item label="Access Key">
          <div style="display: flex; gap: 8px; width: 100%">
            <el-input :value="generatedKey.accessKey" readonly />
            <el-button
              @click="copyToClipboard(generatedKey.accessKey, 'Access Key')"
              icon="CopyDocument"
            >
              复制
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="Secret Key">
          <div style="display: flex; gap: 8px; width: 100%">
            <el-input :value="generatedKey.secretKey" readonly type="textarea" :rows="2" />
            <el-button
              @click="copyToClipboard(generatedKey.secretKey, 'Secret Key')"
              icon="CopyDocument"
            >
              复制
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button type="primary" @click="keyResultDialogVisible = false">
          我已保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 密钥详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="密钥详情"
      width="800px"
    >
      <div v-if="currentKey">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="密钥名称">
            {{ currentKey.name }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentKey.status)">
              {{ getStatusText(currentKey.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Access Key" :span="2">
            <code>{{ currentKey.accessKey }}</code>
          </el-descriptions-item>
          <el-descriptions-item label="描述信息" :span="2">
            {{ currentKey.description }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ currentKey.createdAt }}
          </el-descriptions-item>
          <el-descriptions-item label="有效期至">
            {{ currentKey.validUntil }}
          </el-descriptions-item>
          <el-descriptions-item label="最后使用">
            {{ formatDateTime(currentKey.lastUsedAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="调用次数">
            {{ currentKey.callCount.toLocaleString() }} / {{ currentKey.callLimit.toLocaleString() }}
          </el-descriptions-item>
          <el-descriptions-item label="成功率">
            {{ currentKey.successRate }}%
          </el-descriptions-item>
          <el-descriptions-item label="接口权限" :span="2">
            <el-tag
              v-for="perm in currentKey.permissions"
              :key="perm"
              :type="getPermissionColor(perm)"
              style="margin-right: 8px"
            >
              {{ getPermissionLabel(perm) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="数据权限" :span="2">
            <el-tag
              v-for="perm in currentKey.dataPermissions"
              :key="perm"
              :type="getDataPermissionColor(perm)"
              style="margin-right: 8px"
            >
              {{ getDataPermissionLabel(perm) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <el-divider>近30天使用趋势</el-divider>
        
        <el-table :data="usageStats.slice(-10)" size="small" style="margin-top: 16px">
          <el-table-column prop="date" label="日期" width="120" />
          <el-table-column prop="calls" label="总调用" width="100" />
          <el-table-column prop="success" label="成功" width="100" />
          <el-table-column prop="failed" label="失败" width="100" />
          <el-table-column label="成功率" width="100">
            <template #default="{ row }">
              {{ ((row.success / row.calls) * 100).toFixed(2) }}%
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <!-- 编辑权限对话框 -->
    <el-dialog
      v-model="editPermissionDialogVisible"
      title="编辑权限"
      width="500px"
    >
      <el-form label-width="100px">
        <el-form-item label="接口权限">
          <el-checkbox-group v-model="editPermissionForm.permissions">
            <el-checkbox
              v-for="option in permissionOptions"
              :key="option.value"
              :label="option.value"
            >
              {{ option.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="数据权限">
          <el-radio-group v-model="editPermissionForm.dataPermissions">
            <el-radio
              v-for="option in dataPermissionOptions"
              :key="option.value"
              :label="[option.value]"
            >
              {{ option.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editPermissionDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="submitEditPermission"
          :loading="loading"
        >
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 续期对话框 -->
    <el-dialog
      v-model="renewDialogVisible"
      title="密钥续期"
      width="400px"
    >
      <el-form label-width="100px">
        <el-form-item label="续期天数">
          <el-input-number
            v-model="renewForm.days"
            :min="1"
            :max="3650"
            style="width: 100%"
          />
          <span style="margin-left: 8px; color: #909399">天</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="renewDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="submitRenew"
          :loading="loading"
        >
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.access-key-container {
  .statistics-row {
    margin-bottom: 20px;
  }
  
  .search-card {
    margin-bottom: 20px;
  }
  
  .table-card {
    :deep(.el-table) {
      font-size: 13px;
      
      code {
        background-color: #f5f7fa;
        padding: 2px 6px;
        border-radius: 3px;
        color: #606266;
      }
    }
  }
  
  :deep(.el-descriptions__label) {
    font-weight: 600;
  }
  
  :deep(.el-statistic__head) {
    font-size: 14px;
    color: #909399;
  }
  
  :deep(.el-statistic__number) {
    font-size: 24px;
    font-weight: 600;
  }
}
</style>