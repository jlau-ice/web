<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'

// ==================== 类型定义 ====================
interface PermissionPolicy {
  id: string
  name: string
  formName: string
  formId: string
  targetRoles: string[]
  fieldCount: number
  status: 'active' | 'inactive' | 'draft'
  createTime: string
  updateTime: string
  priority: number
  inheritFrom?: string
}

interface FieldPermission {
  fieldId: string
  fieldName: string
  permissions: {
    [roleId: string]: PermissionType
  }
}

type PermissionType = 'visible-editable' | 'readonly' | 'hidden' | 'disabled'

interface Role {
  id: string
  name: string
  description: string
}

interface FormField {
  id: string
  name: string
  label: string
  type: string
}

interface ConditionalPermission {
  id: string
  fieldId: string
  roleId: string
  condition: string
  conditionType: 'field-value' | 'user-attribute' | 'environment'
  targetPermission: PermissionType
  expression: string
}

interface PermissionInheritance {
  id: string
  policyId: string
  templateId: string
  templateName: string
  overrideRules: {
    fieldId: string
    roleId: string
    permission: PermissionType
  }[]
}

// ==================== Mock 数据 ====================
const mockRoles: Role[] = [
  { id: 'role1', name: '系统管理员', description: '拥有所有权限' },
  { id: 'role2', name: '部门经理', description: '管理部门数据' },
  { id: 'role3', name: '普通员工', description: '查看和编辑自己的数据' },
  { id: 'role4', name: '财务人员', description: '管理财务相关数据' },
  { id: 'role5', name: '人事专员', description: '管理人事相关数据' }
]

const mockFormFields: FormField[] = [
  { id: 'field1', name: 'employeeName', label: '员工姓名', type: 'text' },
  { id: 'field2', name: 'employeeId', label: '员工编号', type: 'text' },
  { id: 'field3', name: 'department', label: '所属部门', type: 'select' },
  { id: 'field4', name: 'position', label: '职位', type: 'text' },
  { id: 'field5', name: 'salary', label: '薪资', type: 'number' },
  { id: 'field6', name: 'entryDate', label: '入职日期', type: 'date' },
  { id: 'field7', name: 'phoneNumber', label: '联系电话', type: 'text' },
  { id: 'field8', name: 'email', label: '邮箱', type: 'email' },
  { id: 'field9', name: 'idCard', label: '身份证号', type: 'text' },
  { id: 'field10', name: 'bankAccount', label: '银行账号', type: 'text' }
]

const mockPolicies: PermissionPolicy[] = [
  {
    id: 'policy1',
    name: '员工基础信息权限',
    formName: '员工信息表',
    formId: 'form1',
    targetRoles: ['role2', 'role3'],
    fieldCount: 8,
    status: 'active',
    createTime: '2024-01-15 10:30:00',
    updateTime: '2024-03-20 14:20:00',
    priority: 10
  },
  {
    id: 'policy2',
    name: '财务信息权限控制',
    formName: '员工信息表',
    formId: 'form1',
    targetRoles: ['role4'],
    fieldCount: 5,
    status: 'active',
    createTime: '2024-02-01 09:00:00',
    updateTime: '2024-03-18 16:45:00',
    priority: 20,
    inheritFrom: 'template1'
  },
  {
    id: 'policy3',
    name: '敏感信息保护策略',
    formName: '员工信息表',
    formId: 'form1',
    targetRoles: ['role3'],
    fieldCount: 10,
    status: 'active',
    createTime: '2024-02-10 11:20:00',
    updateTime: '2024-03-15 13:30:00',
    priority: 30
  },
  {
    id: 'policy4',
    name: '人事专员权限',
    formName: '员工信息表',
    formId: 'form1',
    targetRoles: ['role5'],
    fieldCount: 9,
    status: 'draft',
    createTime: '2024-03-01 08:15:00',
    updateTime: '2024-03-22 10:00:00',
    priority: 15
  }
]

// ==================== 响应式数据 ====================
const loading = ref(false)
const searchKeyword = ref('')
const statusFilter = ref<string>('')

// 策略列表
const policyList = ref<PermissionPolicy[]>([])
const selectedPolicy = ref<PermissionPolicy | null>(null)

// 权限矩阵数据
const permissionMatrix = ref<FieldPermission[]>([])
const roles = ref<Role[]>([])
const formFields = ref<FormField[]>([])

// 对话框控制
const policyDialogVisible = ref(false)
const conditionalDialogVisible = ref(false)
const inheritanceDialogVisible = ref(false)

// 表单数据
const policyFormRef = ref<FormInstance>()
const policyForm = reactive({
  id: '',
  name: '',
  formId: '',
  formName: '',
  targetRoles: [] as string[],
  status: 'draft' as 'active' | 'inactive' | 'draft',
  priority: 10
})

const conditionalForm = reactive({
  fieldId: '',
  roleId: '',
  conditionType: 'field-value' as 'field-value' | 'user-attribute' | 'environment',
  expression: '',
  targetPermission: 'readonly' as PermissionType
})

const inheritanceForm = reactive({
  templateId: '',
  templateName: '',
  overrideRules: [] as any[]
})

// 权限冲突检测
const conflictList = ref<any[]>([])

// ==================== 计算属性 ====================
const filteredPolicies = computed(() => {
  let result = policyList.value

  // 关键词搜索
  if (searchKeyword.value) {
    result = result.filter(p =>
      p.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      p.formName.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }

  // 状态筛选
  if (statusFilter.value) {
    result = result.filter(p => p.status === statusFilter.value)
  }

  return result
})

const selectedRoles = computed(() => {
  if (!selectedPolicy.value) return roles.value
  return roles.value.filter(r => selectedPolicy.value!.targetRoles.includes(r.id))
})

// ==================== 权限配置映射 ====================
const permissionConfig = {
  'visible-editable': { label: '可见可编辑', color: '#67c23a', icon: '✓' },
  'readonly': { label: '只读', color: '#409eff', icon: '👁' },
  'hidden': { label: '隐藏', color: '#909399', icon: '✗' },
  'disabled': { label: '禁用', color: '#f56c6c', icon: '⊘' }
}

// ==================== 方法 ====================

// 加载数据
const loadData = async () => {
  loading.value = true

  // 模拟异步加载
  await new Promise(resolve => setTimeout(resolve, 800))

  policyList.value = [...mockPolicies]
  roles.value = [...mockRoles]
  formFields.value = [...mockFormFields]

  // 默认选中第一个策略
  if (policyList.value.length > 0) {
    selectPolicy(policyList.value[0])
  }

  loading.value = false
}

// 选择策略
const selectPolicy = (policy: PermissionPolicy) => {
  selectedPolicy.value = policy
  loadPermissionMatrix(policy)
  checkConflicts()
}

// 加载权限矩阵
const loadPermissionMatrix = async (policy: PermissionPolicy) => {
  loading.value = true

  await new Promise(resolve => setTimeout(resolve, 300))

  // 生成权限矩阵 Mock 数据
  permissionMatrix.value = formFields.value.map(field => {
    const permissions: any = {}

    policy.targetRoles.forEach(roleId => {
      // 根据策略生成不同的权限
      if (policy.name.includes('敏感信息')) {
        // 敏感信息策略
        if (field.name === 'salary' || field.name === 'idCard' || field.name === 'bankAccount') {
          permissions[roleId] = roleId === 'role1' ? 'visible-editable' : 'hidden'
        } else {
          permissions[roleId] = 'readonly'
        }
      } else if (policy.name.includes('财务')) {
        // 财务策略
        if (field.name === 'salary' || field.name === 'bankAccount') {
          permissions[roleId] = 'visible-editable'
        } else {
          permissions[roleId] = 'readonly'
        }
      } else {
        // 默认策略
        const rand = Math.random()
        if (rand > 0.7) permissions[roleId] = 'visible-editable'
        else if (rand > 0.4) permissions[roleId] = 'readonly'
        else if (rand > 0.2) permissions[roleId] = 'hidden'
        else permissions[roleId] = 'disabled'
      }
    })

    return {
      fieldId: field.id,
      fieldName: field.label,
      permissions
    }
  })

  loading.value = false
}

// 获取权限状态的样式
const getPermissionStyle = (permission: PermissionType) => {
  const config = permissionConfig[permission]
  return {
    backgroundColor: config.color,
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    display: 'inline-block',
    minWidth: '80px',
    textAlign: 'center'
  }
}

// 切换权限
const togglePermission = (fieldId: string, roleId: string) => {
  const field = permissionMatrix.value.find(f => f.fieldId === fieldId)
  if (!field) return

  const currentPermission = field.permissions[roleId]
  const permissionTypes: PermissionType[] = ['visible-editable', 'readonly', 'hidden', 'disabled']
  const currentIndex = permissionTypes.indexOf(currentPermission)
  const nextIndex = (currentIndex + 1) % permissionTypes.length

  field.permissions[roleId] = permissionTypes[nextIndex]

  // 重新检测冲突
  checkConflicts()
}

// 批量设置权限
const batchSetPermission = (permission: PermissionType) => {
  ElMessageBox.confirm(
    `确定要将所有字段的权限批量设置为"${permissionConfig[permission].label}"吗？`,
    '批量设置',
    { type: 'warning' }
  ).then(() => {
    permissionMatrix.value.forEach(field => {
      selectedRoles.value.forEach(role => {
        field.permissions[role.id] = permission
      })
    })
    ElMessage.success('批量设置成功')
    checkConflicts()
  }).catch(() => {})
}

// 权限冲突检测
const checkConflicts = () => {
  conflictList.value = []

  // 检测逻辑：如果某个重要字段（如薪资）被设置为可见，但关联字段（如银行账号）被隐藏
  const salaryField = permissionMatrix.value.find(f => f.fieldId === 'field5')
  const bankField = permissionMatrix.value.find(f => f.fieldId === 'field10')

  if (salaryField && bankField) {
    Object.keys(salaryField.permissions).forEach(roleId => {
      if (salaryField.permissions[roleId] === 'visible-editable' &&
          bankField.permissions[roleId] === 'hidden') {
        conflictList.value.push({
          type: 'warning',
          message: `角色 ${roles.value.find(r => r.id === roleId)?.name} 可以编辑薪资，但无法查看银行账号，可能导致数据不一致`,
          suggestion: '建议将银行账号设置为只读或可见'
        })
      }
    })
  }

  // 检测优先级冲突
  const samePolicies = policyList.value.filter(p =>
    p.formId === selectedPolicy.value?.formId &&
    p.id !== selectedPolicy.value?.id &&
    p.status === 'active'
  )

  samePolicies.forEach(policy => {
    if (policy.priority === selectedPolicy.value?.priority) {
      conflictList.value.push({
        type: 'error',
        message: `策略 "${policy.name}" 与当前策略优先级相同(${policy.priority})，可能导致权限冲突`,
        suggestion: '建议调整优先级顺序'
      })
    }
  })
}

// 新增策略
const handleAddPolicy = () => {
  Object.assign(policyForm, {
    id: '',
    name: '',
    formId: 'form1',
    formName: '员工信息表',
    targetRoles: [],
    status: 'draft',
    priority: 10
  })
  policyDialogVisible.value = true
}

// 编辑策略
const handleEditPolicy = (policy: PermissionPolicy) => {
  Object.assign(policyForm, { ...policy })
  policyDialogVisible.value = true
}

// 保存策略
const savePolicy = async () => {
  if (!policyFormRef.value) return

  await policyFormRef.value.validate((valid) => {
    if (valid) {
      loading.value = true

      setTimeout(() => {
        if (policyForm.id) {
          // 编辑
          const index = policyList.value.findIndex(p => p.id === policyForm.id)
          if (index !== -1) {
            policyList.value[index] = {
              ...policyList.value[index],
              ...policyForm,
              fieldCount: formFields.value.length,
              updateTime: new Date().toLocaleString('zh-CN')
            }
          }
          ElMessage.success('策略更新成功')
        } else {
          // 新增
          const newPolicy: PermissionPolicy = {
            id: `policy${Date.now()}`,
            ...policyForm,
            fieldCount: formFields.value.length,
            createTime: new Date().toLocaleString('zh-CN'),
            updateTime: new Date().toLocaleString('zh-CN')
          }
          policyList.value.unshift(newPolicy)
          ElMessage.success('策略创建成功')
        }

        loading.value = false
        policyDialogVisible.value = false
      }, 500)
    }
  })
}

// 删除策略
const handleDeletePolicy = (policy: PermissionPolicy) => {
  ElMessageBox.confirm(`确定要删除策略"${policy.name}"吗？`, '删除确认', {
    type: 'warning'
  }).then(() => {
    const index = policyList.value.findIndex(p => p.id === policy.id)
    if (index !== -1) {
      policyList.value.splice(index, 1)
      ElMessage.success('删除成功')

      if (selectedPolicy.value?.id === policy.id) {
        selectedPolicy.value = policyList.value.length > 0 ? policyList.value[0] : null
        if (selectedPolicy.value) {
          loadPermissionMatrix(selectedPolicy.value)
        }
      }
    }
  }).catch(() => {})
}

// 切换策略状态
const togglePolicyStatus = (policy: PermissionPolicy) => {
  const newStatus = policy.status === 'active' ? 'inactive' : 'active'

  ElMessageBox.confirm(
    `确定要${newStatus === 'active' ? '启用' : '禁用'}策略"${policy.name}"吗？`,
    '状态切换',
    { type: 'warning' }
  ).then(() => {
    policy.status = newStatus
    ElMessage.success(`策略已${newStatus === 'active' ? '启用' : '禁用'}`)
  }).catch(() => {})
}

// 打开条件权限对话框
const openConditionalDialog = () => {
  Object.assign(conditionalForm, {
    fieldId: '',
    roleId: '',
    conditionType: 'field-value',
    expression: '',
    targetPermission: 'readonly'
  })
  conditionalDialogVisible.value = true
}

// 保存条件权限
const saveConditionalPermission = () => {
  if (!conditionalForm.fieldId || !conditionalForm.roleId || !conditionalForm.expression) {
    ElMessage.warning('请填写完整的条件权限信息')
    return
  }

  ElMessage.success('条件权限设置成功')
  conditionalDialogVisible.value = false
}

// 测试条件权限
const testConditionalPermission = () => {
  const testData = {
    fieldValue: '示例值',
    userAttribute: '部门经理',
    environment: '工作日'
  }

  ElMessageBox.alert(
    `
    <div>
      <p><strong>测试数据：</strong></p>
      <p>字段值: ${testData.fieldValue}</p>
      <p>用户属性: ${testData.userAttribute}</p>
      <p>环境变量: ${testData.environment}</p>
      <br/>
      <p><strong>条件表达式：</strong>${conditionalForm.expression}</p>
      <p><strong>测试结果：</strong><span style="color: #67c23a">✓ 条件匹配成功</span></p>
      <p><strong>目标权限：</strong>${permissionConfig[conditionalForm.targetPermission].label}</p>
    </div>
    `,
    '条件测试结果',
    {
      dangerouslyUseHTMLString: true
    }
  )
}

// 打开权限继承对话框
const openInheritanceDialog = () => {
  inheritanceDialogVisible.value = true
}

// 保存权限继承
const saveInheritance = () => {
  ElMessage.success('权限继承配置已保存')
  inheritanceDialogVisible.value = false
}

// 导出权限配置
const exportPermissionConfig = () => {
  const data = {
    policy: selectedPolicy.value,
    matrix: permissionMatrix.value,
    roles: selectedRoles.value
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `permission_config_${selectedPolicy.value?.name}_${Date.now()}.json`
  link.click()
  URL.revokeObjectURL(url)

  ElMessage.success('权限配置已导出')
}

// ==================== 生命周期 ====================
onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="field-permission-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>字段权限配置</h2>
      <p class="subtitle">管理表单字段的访问权限和控制规则，确保不同角色的数据安全性</p>
    </div>

    <div class="content-wrapper">
      <!-- 左侧：策略列表 -->
      <div class="left-panel">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="title">权限策略列表</span>
              <el-button type="primary" size="small" @click="handleAddPolicy">
                新增策略
              </el-button>
            </div>
          </template>

          <!-- 搜索和筛选 -->
          <div class="filter-section">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索策略名称或表单"
              clearable
              style="margin-bottom: 12px"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>

            <el-select
              v-model="statusFilter"
              placeholder="筛选状态"
              clearable
              style="width: 100%"
            >
              <el-option label="启用" value="active" />
              <el-option label="禁用" value="inactive" />
              <el-option label="草稿" value="draft" />
            </el-select>
          </div>

          <!-- 策略列表 -->
          <div class="policy-list" v-loading="loading">
            <div
              v-for="policy in filteredPolicies"
              :key="policy.id"
              class="policy-item"
              :class="{ active: selectedPolicy?.id === policy.id }"
              @click="selectPolicy(policy)"
            >
              <div class="policy-header">
                <span class="policy-name">{{ policy.name }}</span>
                <el-tag
                  :type="policy.status === 'active' ? 'success' : policy.status === 'inactive' ? 'danger' : 'info'"
                  size="small"
                >
                  {{ policy.status === 'active' ? '启用' : policy.status === 'inactive' ? '禁用' : '草稿' }}
                </el-tag>
              </div>

              <div class="policy-info">
                <div class="info-item">
                  <span class="label">表单：</span>
                  <span class="value">{{ policy.formName }}</span>
                </div>
                <div class="info-item">
                  <span class="label">角色：</span>
                  <span class="value">{{ policy.targetRoles.length }}个</span>
                </div>
                <div class="info-item">
                  <span class="label">字段：</span>
                  <span class="value">{{ policy.fieldCount }}个</span>
                </div>
                <div class="info-item">
                  <span class="label">优先级：</span>
                  <span class="value">{{ policy.priority }}</span>
                </div>
              </div>

              <div class="policy-actions">
                <el-button
                  type="primary"
                  text
                  size="small"
                  @click.stop="handleEditPolicy(policy)"
                >
                  编辑
                </el-button>
                <el-button
                  :type="policy.status === 'active' ? 'warning' : 'success'"
                  text
                  size="small"
                  @click.stop="togglePolicyStatus(policy)"
                >
                  {{ policy.status === 'active' ? '禁用' : '启用' }}
                </el-button>
                <el-button
                  type="danger"
                  text
                  size="small"
                  @click.stop="handleDeletePolicy(policy)"
                >
                  删除
                </el-button>
              </div>

              <div v-if="policy.inheritFrom" class="inherit-badge">
                <el-tag type="warning" size="small">继承自模板</el-tag>
              </div>
            </div>

            <el-empty
              v-if="filteredPolicies.length === 0"
              description="暂无策略数据"
              :image-size="100"
            />
          </div>
        </el-card>
      </div>

      <!-- 右侧：权限矩阵 -->
      <div class="right-panel">
        <el-card shadow="hover" v-if="selectedPolicy">
          <template #header>
            <div class="card-header">
              <div>
                <span class="title">权限矩阵 - {{ selectedPolicy.name }}</span>
                <el-tag type="info" size="small" style="margin-left: 12px">
                  点击单元格切换权限
                </el-tag>
              </div>
              <div class="header-actions">
                <el-button size="small" @click="openConditionalDialog">
                  条件权限
                </el-button>
                <el-button size="small" @click="openInheritanceDialog">
                  权限继承
                </el-button>
                <el-button size="small" @click="exportPermissionConfig">
                  导出配置
                </el-button>
              </div>
            </div>
          </template>

          <!-- 批量操作 -->
          <div class="batch-actions">
            <span class="label">批量设置：</span>
            <el-button
              size="small"
              @click="batchSetPermission('visible-editable')"
              :style="{ backgroundColor: '#67c23a', color: '#fff', borderColor: '#67c23a' }"
            >
              可见可编辑
            </el-button>
            <el-button
              size="small"
              @click="batchSetPermission('readonly')"
              :style="{ backgroundColor: '#409eff', color: '#fff', borderColor: '#409eff' }"
            >
              只读
            </el-button>
            <el-button
              size="small"
              @click="batchSetPermission('hidden')"
              :style="{ backgroundColor: '#909399', color: '#fff', borderColor: '#909399' }"
            >
              隐藏
            </el-button>
            <el-button
              size="small"
              @click="batchSetPermission('disabled')"
              :style="{ backgroundColor: '#f56c6c', color: '#fff', borderColor: '#f56c6c' }"
            >
              禁用
            </el-button>
          </div>

          <!-- 权限冲突提示 -->
          <div v-if="conflictList.length > 0" class="conflict-section">
            <el-alert
              v-for="(conflict, index) in conflictList"
              :key="index"
              :type="conflict.type"
              :closable="false"
              style="margin-bottom: 8px"
            >
              <template #title>
                <div class="conflict-content">
                  <div>
                    <strong>权限冲突：</strong>{{ conflict.message }}
                  </div>
                  <div class="conflict-suggestion">
                    <strong>建议：</strong>{{ conflict.suggestion }}
                  </div>
                </div>
              </template>
            </el-alert>
          </div>

          <!-- 权限矩阵表格 -->
          <div class="permission-matrix" v-loading="loading">
            <el-table
              :data="permissionMatrix"
              border
              stripe
              style="width: 100%"
              max-height="600"
            >
              <el-table-column prop="fieldName" label="字段名称" width="150" fixed />

              <el-table-column
                v-for="role in selectedRoles"
                :key="role.id"
                :label="role.name"
                align="center"
                min-width="120"
              >
                <template #default="{ row }">
                  <div
                    class="permission-cell"
                    :style="getPermissionStyle(row.permissions[role.id])"
                    @click="togglePermission(row.fieldId, role.id)"
                  >
                    <span class="permission-icon">
                      {{ permissionConfig[row.permissions[role.id]].icon }}
                    </span>
                    <span class="permission-label">
                      {{ permissionConfig[row.permissions[role.id]].label }}
                    </span>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 权限说明 -->
          <div class="permission-legend">
            <span class="legend-title">权限说明：</span>
            <div class="legend-items">
              <div
                v-for="(config, key) in permissionConfig"
                :key="key"
                class="legend-item"
              >
                <span
                  class="legend-color"
                  :style="{ backgroundColor: config.color }"
                />
                <span>{{ config.icon }} {{ config.label }}</span>
              </div>
            </div>
          </div>
        </el-card>

        <el-empty
          v-else
          description="请先选择一个权限策略"
          :image-size="150"
          style="padding: 80px 0"
        />
      </div>
    </div>

    <!-- 策略编辑对话框 -->
    <el-dialog
      v-model="policyDialogVisible"
      :title="policyForm.id ? '编辑权限策略' : '新增权限策略'"
      width="600px"
    >
      <el-form
        ref="policyFormRef"
        :model="policyForm"
        label-width="100px"
        :rules="{
          name: [{ required: true, message: '请输入策略名称', trigger: 'blur' }],
          formId: [{ required: true, message: '请选择表单', trigger: 'change' }],
          targetRoles: [{ required: true, message: '请选择目标角色', trigger: 'change' }]
        }"
      >
        <el-form-item label="策略名称" prop="name">
          <el-input v-model="policyForm.name" placeholder="请输入策略名称" />
        </el-form-item>

        <el-form-item label="适用表单" prop="formId">
          <el-select v-model="policyForm.formId" placeholder="请选择表单" style="width: 100%">
            <el-option label="员工信息表" value="form1" />
            <el-option label="项目管理表" value="form2" />
            <el-option label="财务报表" value="form3" />
          </el-select>
        </el-form-item>

        <el-form-item label="目标角色" prop="targetRoles">
          <el-select
            v-model="policyForm.targetRoles"
            multiple
            placeholder="请选择目标角色"
            style="width: 100%"
          >
            <el-option
              v-for="role in roles"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="优先级">
          <el-input-number
            v-model="policyForm.priority"
            :min="1"
            :max="100"
            style="width: 100%"
          />
          <div class="form-tip">数字越大优先级越高，范围：1-100</div>
        </el-form-item>

        <el-form-item label="状态">
          <el-radio-group v-model="policyForm.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">禁用</el-radio>
            <el-radio label="draft">草稿</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="policyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePolicy">保存</el-button>
      </template>
    </el-dialog>

    <!-- 条件权限对话框 -->
    <el-dialog
      v-model="conditionalDialogVisible"
      title="条件权限设置"
      width="650px"
    >
      <el-alert
        title="条件权限说明"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      >
        <p>通过设置条件表达式，可以实现基于业务数据的动态权限控制。</p>
        <p>例如：当订单金额大于10000时，财务主管才能查看该字段。</p>
      </el-alert>

      <el-form :model="conditionalForm" label-width="100px">
        <el-form-item label="目标字段">
          <el-select
            v-model="conditionalForm.fieldId"
            placeholder="请选择字段"
            style="width: 100%"
          >
            <el-option
              v-for="field in formFields"
              :key="field.id"
              :label="field.label"
              :value="field.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="目标角色">
          <el-select
            v-model="conditionalForm.roleId"
            placeholder="请选择角色"
            style="width: 100%"
          >
            <el-option
              v-for="role in roles"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="条件类型">
          <el-radio-group v-model="conditionalForm.conditionType">
            <el-radio label="field-value">字段值</el-radio>
            <el-radio label="user-attribute">用户属性</el-radio>
            <el-radio label="environment">环境变量</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="条件表达式">
          <el-input
            v-model="conditionalForm.expression"
            type="textarea"
            :rows="3"
            placeholder="例如：salary > 10000 || department == '财务部'"
          />
          <div class="form-tip">
            支持运算符：>, <, >=, <=, ==, !=, &&, ||
          </div>
        </el-form-item>

        <el-form-item label="目标权限">
          <el-select
            v-model="conditionalForm.targetPermission"
            placeholder="请选择目标权限"
            style="width: 100%"
          >
            <el-option
              v-for="(config, key) in permissionConfig"
              :key="key"
              :label="config.label"
              :value="key"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button @click="testConditionalPermission">
            测试条件
          </el-button>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="conditionalDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveConditionalPermission">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 权限继承对话框 -->
    <el-dialog
      v-model="inheritanceDialogVisible"
      title="权限继承管理"
      width="800px"
    >
      <el-alert
        title="权限继承说明"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      >
        <p>可以从权限模板继承基础权限配置，然后根据实际需求进行覆盖调整。</p>
        <p>子策略的权限配置优先级高于模板权限。</p>
      </el-alert>

      <el-form :model="inheritanceForm" label-width="120px">
        <el-form-item label="继承模板">
          <el-select
            v-model="inheritanceForm.templateId"
            placeholder="请选择权限模板"
            style="width: 100%"
          >
            <el-option label="基础员工权限模板" value="template1" />
            <el-option label="管理层权限模板" value="template2" />
            <el-option label="财务部门权限模板" value="template3" />
          </el-select>
        </el-form-item>

        <el-form-item label="继承关系">
          <div class="inheritance-tree">
            <el-tree
              :data="[
                {
                  label: '基础员工权限模板',
                  children: [
                    { label: '当前策略：' + (selectedPolicy?.name || '') },
                    { label: '继承字段：10个' },
                    { label: '覆盖规则：3个' }
                  ]
                }
              ]"
              :props="{ label: 'label', children: 'children' }"
              default-expand-all
            />
          </div>
        </el-form-item>

        <el-form-item label="覆盖规则">
          <el-tag
            v-for="i in 3"
            :key="i"
            type="warning"
            style="margin-right: 8px; margin-bottom: 8px"
          >
            字段{{ i }}：从只读覆盖为可编辑
          </el-tag>
        </el-form-item>

        <el-form-item label="优先级设置">
          <el-alert type="warning" :closable="false">
            <p>当前策略优先级：{{ selectedPolicy?.priority }}</p>
            <p>模板优先级：10</p>
            <p>冲突时以当前策略为准</p>
          </el-alert>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="inheritanceDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveInheritance">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.field-permission-container {
  min-height: calc(100vh - 40px);

  .page-header {
    margin-bottom: 20px;

    h2 {
      margin: 0 0 8px 0;
      font-size: 24px;
      color: #303133;
    }

    .subtitle {
      margin: 0;
      font-size: 14px;
      color: #909399;
    }
  }

  .content-wrapper {
    display: flex;
    gap: 20px;
    height: calc(100vh - 150px);

    .left-panel {
      width: 380px;
      flex-shrink: 0;

      .el-card {
        height: 100%;
        display: flex;
        flex-direction: column;

        :deep(.el-card__body) {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .title {
          font-size: 16px;
          font-weight: 600;
          color: #303133;
        }
      }

      .filter-section {
        margin-bottom: 16px;
      }

      .policy-list {
        flex: 1;
        overflow-y: auto;

        .policy-item {
          padding: 16px;
          margin-bottom: 12px;
          background-color: #fff;
          border: 2px solid #e4e7ed;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;

          &:hover {
            border-color: #409eff;
            box-shadow: 0 2px 12px rgba(64, 158, 255, 0.15);
          }

          &.active {
            border-color: #409eff;
            background-color: #ecf5ff;
          }

          .policy-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;

            .policy-name {
              font-size: 15px;
              font-weight: 600;
              color: #303133;
            }
          }

          .policy-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-bottom: 12px;

            .info-item {
              font-size: 13px;

              .label {
                color: #909399;
              }

              .value {
                color: #606266;
                font-weight: 500;
              }
            }
          }

          .policy-actions {
            display: flex;
            gap: 8px;
            padding-top: 12px;
            border-top: 1px solid #ebeef5;
          }

          .inherit-badge {
            position: absolute;
            top: 12px;
            right: 12px;
          }
        }
      }
    }

    .right-panel {
      flex: 1;
      overflow: hidden;

      .el-card {
        height: 100%;
        display: flex;
        flex-direction: column;

        :deep(.el-card__body) {
          flex: 1;
          overflow-y: auto;
        }
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;

        .title {
          font-size: 16px;
          font-weight: 600;
          color: #303133;
        }

        .header-actions {
          display: flex;
          gap: 8px;
        }
      }

      .batch-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        padding: 12px;
        background-color: #f5f7fa;
        border-radius: 6px;

        .label {
          font-size: 14px;
          font-weight: 500;
          color: #606266;
        }
      }

      .conflict-section {
        margin-bottom: 16px;

        .conflict-content {
          font-size: 13px;

          .conflict-suggestion {
            margin-top: 6px;
            color: #e6a23c;
          }
        }
      }

      .permission-matrix {
        margin-bottom: 16px;

        .permission-cell {
          user-select: none;
          transition: all 0.2s;

          &:hover {
            opacity: 0.85;
            transform: scale(1.05);
          }

          .permission-icon {
            margin-right: 4px;
          }

          .permission-label {
            font-size: 12px;
          }
        }
      }

      .permission-legend {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background-color: #f5f7fa;
        border-radius: 6px;

        .legend-title {
          font-size: 14px;
          font-weight: 500;
          color: #606266;
        }

        .legend-items {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;

          .legend-item {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            color: #606266;

            .legend-color {
              width: 12px;
              height: 12px;
              border-radius: 2px;
            }
          }
        }
      }
    }
  }

  .form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }

  .inheritance-tree {
    padding: 12px;
    background-color: #f5f7fa;
    border-radius: 6px;
  }
}

// 滚动条样式
:deep(.policy-list)::-webkit-scrollbar,
:deep(.el-card__body)::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

:deep(.policy-list)::-webkit-scrollbar-thumb,
:deep(.el-card__body)::-webkit-scrollbar-thumb {
  background-color: #dcdfe6;
  border-radius: 3px;

  &:hover {
    background-color: #c0c4cc;
  }
}

:deep(.policy-list)::-webkit-scrollbar-track,
:deep(.el-card__body)::-webkit-scrollbar-track {
  background-color: #f5f7fa;
}
</style>
