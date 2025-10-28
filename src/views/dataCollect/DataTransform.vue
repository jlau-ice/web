<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'

// 类型定义
interface FieldMapping {
  id: number
  sourceField: string
  targetField: string
  dataType: string
  required: boolean
  status: 'active' | 'inactive'
}

interface TransformRule {
  id: number
  ruleName: string
  ruleType: 'format' | 'validation' | 'desensitization' | 'exception'
  fieldName: string
  config: any
  enabled: boolean
  createTime: string
}

interface PreviewData {
  original: string
  transformed: string
}

// 状态管理
const loading = ref(false)
const searchKeyword = ref('')

// 字段映射数据
const fieldMappings = ref<FieldMapping[]>([
  { id: 1, sourceField: 'user_name', targetField: 'userName', dataType: '字符串', required: true, status: 'active' },
  { id: 2, sourceField: 'phone_number', targetField: 'phone', dataType: '字符串', required: true, status: 'active' },
  { id: 3, sourceField: 'email_addr', targetField: 'email', dataType: '字符串', required: false, status: 'active' },
  { id: 4, sourceField: 'birth_date', targetField: 'birthday', dataType: '日期', required: false, status: 'active' },
  { id: 5, sourceField: 'salary_amt', targetField: 'salary', dataType: '数值', required: false, status: 'inactive' }
])

// 转换规则数据
const transformRules = ref<TransformRule[]>([
  {
    id: 1,
    ruleName: '日期格式化',
    ruleType: 'format',
    fieldName: 'birthday',
    config: { format: 'YYYY-MM-DD' },
    enabled: true,
    createTime: '2025-10-20 10:30:00'
  },
  {
    id: 2,
    ruleName: '手机号脱敏',
    ruleType: 'desensitization',
    fieldName: 'phone',
    config: { type: 'phone', pattern: '中间四位隐藏' },
    enabled: true,
    createTime: '2025-10-20 11:00:00'
  },
  {
    id: 3,
    ruleName: '邮箱校验',
    ruleType: 'validation',
    fieldName: 'email',
    config: { type: 'email', regex: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$' },
    enabled: true,
    createTime: '2025-10-20 14:20:00'
  },
  {
    id: 4,
    ruleName: '缺失值标注',
    ruleType: 'exception',
    fieldName: 'email',
    config: { type: 'missing', action: 'mark' },
    enabled: false,
    createTime: '2025-10-21 09:15:00'
  },
  {
    id: 5,
    ruleName: '薪资保留两位小数',
    ruleType: 'format',
    fieldName: 'salary',
    config: { decimal: 2 },
    enabled: true,
    createTime: '2025-10-21 15:40:00'
  }
])

// 字段映射对话框
const mappingDialogVisible = ref(false)
const mappingFormRef = ref<FormInstance>()
const mappingForm = reactive({
  id: 0,
  sourceField: '',
  targetField: '',
  dataType: '字符串',
  required: false,
  status: 'active' as 'active' | 'inactive'
})

const mappingFormRules = {
  sourceField: [{ required: true, message: '请输入原始字段名', trigger: 'blur' }],
  targetField: [{ required: true, message: '请输入目标字段名', trigger: 'blur' }],
  dataType: [{ required: true, message: '请选择数据类型', trigger: 'change' }]
}

// 转换规则对话框
const ruleDialogVisible = ref(false)
const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  id: 0,
  ruleName: '',
  ruleType: 'format' as 'format' | 'validation' | 'desensitization' | 'exception',
  fieldName: '',
  config: {},
  enabled: true
})

const ruleFormRules = {
  ruleName: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  ruleType: [{ required: true, message: '请选择规则类型', trigger: 'change' }],
  fieldName: [{ required: true, message: '请输入字段名', trigger: 'blur' }]
}

// 格式转换配置
const formatConfig = reactive({
  dateFormat: 'YYYY-MM-DD',
  decimalPlaces: 2,
  customFormat: ''
})

// 校验规则配置
const validationConfig = reactive({
  validationType: 'email',
  customRegex: '',
  builtInRules: ['email', 'phone', 'idcard', 'url']
})

// 脱敏配置
const desensitizationConfig = reactive({
  enabled: true,
  namePattern: 'first',
  phonePattern: 'middle4',
  emailPattern: 'username'
})

// 异常标注配置
const exceptionConfig = reactive({
  markMissing: true,
  markInvalid: true,
  markOutlier: false
})

// 预览对话框
const previewDialogVisible = ref(false)
const previewData = ref<PreviewData[]>([
  { original: '张三', transformed: '张**' },
  { original: '13800138000', transformed: '138****8000' },
  { original: 'test@example.com', transformed: 't***@example.com' },
  { original: '2000/01/01', transformed: '2000-01-01' },
  { original: '12345.6789', transformed: '12345.68' }
])

// 计算属性 - 筛选后的字段映射
const filteredMappings = computed(() => {
  if (!searchKeyword.value) return fieldMappings.value
  const keyword = searchKeyword.value.toLowerCase()
  return fieldMappings.value.filter(
    item =>
      item.sourceField.toLowerCase().includes(keyword) ||
      item.targetField.toLowerCase().includes(keyword)
  )
})

// 计算属性 - 规则类型统计
const ruleTypeStats = computed(() => {
  const stats = {
    format: 0,
    validation: 0,
    desensitization: 0,
    exception: 0
  }
  transformRules.value.forEach(rule => {
    if (rule.enabled) {
      stats[rule.ruleType]++
    }
  })
  return stats
})

// 字段映射操作
const handleAddMapping = () => {
  Object.assign(mappingForm, {
    id: 0,
    sourceField: '',
    targetField: '',
    dataType: '字符串',
    required: false,
    status: 'active'
  })
  mappingDialogVisible.value = true
}

const handleEditMapping = (row: FieldMapping) => {
  Object.assign(mappingForm, { ...row })
  mappingDialogVisible.value = true
}

const handleDeleteMapping = (row: FieldMapping) => {
  ElMessageBox.confirm('确认删除该字段映射？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    loading.value = true
    setTimeout(() => {
      const index = fieldMappings.value.findIndex(item => item.id === row.id)
      if (index > -1) {
        fieldMappings.value.splice(index, 1)
        ElMessage.success('删除成功')
      }
      loading.value = false
    }, 500)
  }).catch(() => {})
}

const submitMappingForm = async () => {
  if (!mappingFormRef.value) return
  await mappingFormRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      setTimeout(() => {
        if (mappingForm.id === 0) {
          // 新增
          const newMapping = {
            ...mappingForm,
            id: Date.now()
          }
          fieldMappings.value.push(newMapping)
          ElMessage.success('添加成功')
        } else {
          // 编辑
          const index = fieldMappings.value.findIndex(item => item.id === mappingForm.id)
          if (index > -1) {
            fieldMappings.value[index] = { ...mappingForm }
            ElMessage.success('更新成功')
          }
        }
        mappingDialogVisible.value = false
        loading.value = false
      }, 800)
    }
  })
}

// 转换规则操作
const handleAddRule = () => {
  Object.assign(ruleForm, {
    id: 0,
    ruleName: '',
    ruleType: 'format',
    fieldName: '',
    config: {},
    enabled: true
  })
  ruleDialogVisible.value = true
}

const handleEditRule = (row: TransformRule) => {
  Object.assign(ruleForm, { ...row })
  ruleDialogVisible.value = true
}

const handleDeleteRule = (row: TransformRule) => {
  ElMessageBox.confirm('确认删除该规则？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    loading.value = true
    setTimeout(() => {
      const index = transformRules.value.findIndex(item => item.id === row.id)
      if (index > -1) {
        transformRules.value.splice(index, 1)
        ElMessage.success('删除成功')
      }
      loading.value = false
    }, 500)
  }).catch(() => {})
}

const handleToggleRule = (row: TransformRule) => {
  loading.value = true
  setTimeout(() => {
    row.enabled = !row.enabled
    ElMessage.success(row.enabled ? '已启用' : '已停用')
    loading.value = false
  }, 300)
}

const submitRuleForm = async () => {
  if (!ruleFormRef.value) return
  await ruleFormRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      setTimeout(() => {
        if (ruleForm.id === 0) {
          // 新增
          const newRule = {
            ...ruleForm,
            id: Date.now(),
            createTime: new Date().toLocaleString('zh-CN')
          }
          transformRules.value.push(newRule)
          ElMessage.success('规则添加成功')
        } else {
          // 编辑
          const index = transformRules.value.findIndex(item => item.id === ruleForm.id)
          if (index > -1) {
            transformRules.value[index] = {
              ...ruleForm,
              createTime: transformRules.value[index].createTime
            }
            ElMessage.success('规则更新成功')
          }
        }
        ruleDialogVisible.value = false
        loading.value = false
      }, 800)
    }
  })
}

// 预览功能
const handlePreview = () => {
  loading.value = true
  setTimeout(() => {
    // 模拟生成预览数据
    previewData.value = [
      { original: '张三', transformed: desensitizationConfig.enabled ? '张**' : '张三' },
      { original: '13800138000', transformed: desensitizationConfig.enabled ? '138****8000' : '13800138000' },
      { original: 'test@example.com', transformed: desensitizationConfig.enabled ? 't***@example.com' : 'test@example.com' },
      { original: '2000/01/01', transformed: '2000-01-01' },
      { original: '12345.6789', transformed: `12345.${formatConfig.decimalPlaces === 2 ? '68' : '679'}` }
    ]
    previewDialogVisible.value = true
    loading.value = false
    ElMessage.success('预览数据已生成')
  }, 1000)
}

// 保存配置
const handleSaveConfig = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success('配置已保存')
  }, 800)
}

// 获取规则类型标签
const getRuleTypeTag = (type: string) => {
  const typeMap: Record<string, { label: string; type: any }> = {
    format: { label: '格式转换', type: 'primary' },
    validation: { label: '规则校验', type: 'success' },
    desensitization: { label: '脱敏处理', type: 'warning' },
    exception: { label: '异常标注', type: 'danger' }
  }
  return typeMap[type] || { label: type, type: 'info' }
}
</script>

<template>
  <div class="data-transform-container">
    <!-- 页面标题 -->
    <el-card class="header-card" shadow="never">
      <div class="header-content">
        <div class="header-left">
          <h2>数据清洗转换</h2>
          <p class="subtitle">提供字段映射、格式转换、规则校验、异常标注及脱敏处理等功能</p>
        </div>
        <div class="header-right">
          <el-button type="primary" @click="handlePreview" :loading="loading">
            <el-icon><View /></el-icon>
            预览效果
          </el-button>
          <el-button type="success" @click="handleSaveConfig" :loading="loading">
            <el-icon><Check /></el-icon>
            保存配置
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 统计信息 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <div class="stat-icon format">
              <el-icon><Refresh /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ ruleTypeStats.format }}</div>
              <div class="stat-label">格式转换</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <div class="stat-icon validation">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ ruleTypeStats.validation }}</div>
              <div class="stat-label">规则校验</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <div class="stat-icon desensitization">
              <el-icon><Hide /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ ruleTypeStats.desensitization }}</div>
              <div class="stat-label">脱敏处理</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <div class="stat-icon exception">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ ruleTypeStats.exception }}</div>
              <div class="stat-label">异常标注</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 字段映射配置 -->
    <el-card class="section-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><Operation /></el-icon>
            字段映射配置
          </span>
          <div class="card-actions">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索字段名"
              clearable
              style="width: 200px; margin-right: 10px"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" @click="handleAddMapping">
              <el-icon><Plus /></el-icon>
              添加映射
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="filteredMappings"
        :loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="sourceField" label="原始字段" min-width="150" />
        <el-table-column prop="targetField" label="目标字段" min-width="150" />
        <el-table-column prop="dataType" label="数据类型" width="100" />
        <el-table-column label="是否必填" width="100">
          <template #default="{ row }">
            <el-tag :type="row.required ? 'danger' : 'info'" size="small">
              {{ row.required ? '必填' : '选填' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ row.status === 'active' ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEditMapping(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button link type="danger" @click="handleDeleteMapping(row)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 格式转换与规则校验 -->
    <el-row :gutter="16" class="config-row">
      <el-col :span="12">
        <el-card class="section-card" shadow="never">
          <template #header>
            <span class="card-title">
              <el-icon><Setting /></el-icon>
              格式转换配置
            </span>
          </template>
          <el-form label-width="120px">
            <el-form-item label="日期格式">
              <el-select v-model="formatConfig.dateFormat" style="width: 100%">
                <el-option label="YYYY-MM-DD" value="YYYY-MM-DD" />
                <el-option label="YYYY/MM/DD" value="YYYY/MM/DD" />
                <el-option label="DD-MM-YYYY" value="DD-MM-YYYY" />
                <el-option label="MM/DD/YYYY" value="MM/DD/YYYY" />
              </el-select>
            </el-form-item>
            <el-form-item label="小数保留位数">
              <el-input-number
                v-model="formatConfig.decimalPlaces"
                :min="0"
                :max="8"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="自定义格式">
              <el-input
                v-model="formatConfig.customFormat"
                placeholder="输入自定义格式规则"
              />
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="section-card" shadow="never">
          <template #header>
            <span class="card-title">
              <el-icon><CircleCheck /></el-icon>
              规则校验配置
            </span>
          </template>
          <el-form label-width="120px">
            <el-form-item label="校验类型">
              <el-select v-model="validationConfig.validationType" style="width: 100%">
                <el-option
                  v-for="rule in validationConfig.builtInRules"
                  :key="rule"
                  :label="rule"
                  :value="rule"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="自定义正则">
              <el-input
                v-model="validationConfig.customRegex"
                placeholder="输入正则表达式"
              />
            </el-form-item>
            <el-form-item label="示例">
              <div class="validation-examples">
                <el-tag size="small">邮箱: user@example.com</el-tag>
                <el-tag size="small" type="success">手机: 13800138000</el-tag>
                <el-tag size="small" type="warning">身份证: 110101199001011234</el-tag>
              </div>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>

    <!-- 异常标注与脱敏处理 -->
    <el-row :gutter="16" class="config-row">
      <el-col :span="12">
        <el-card class="section-card" shadow="never">
          <template #header>
            <span class="card-title">
              <el-icon><Warning /></el-icon>
              异常标注策略
            </span>
          </template>
          <el-form label-width="120px">
            <el-form-item label="缺失值标注">
              <el-switch v-model="exceptionConfig.markMissing" />
            </el-form-item>
            <el-form-item label="格式异常标注">
              <el-switch v-model="exceptionConfig.markInvalid" />
            </el-form-item>
            <el-form-item label="离群值标注">
              <el-switch v-model="exceptionConfig.markOutlier" />
            </el-form-item>
            <el-form-item label="标注说明">
              <el-alert
                title="异常数据将被自动标记，便于后续处理和审核"
                type="info"
                :closable="false"
                show-icon
              />
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="section-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><Hide /></el-icon>
                脱敏处理配置
              </span>
              <el-switch v-model="desensitizationConfig.enabled" />
            </div>
          </template>
          <el-form label-width="120px">
            <el-form-item label="姓名脱敏">
              <el-select v-model="desensitizationConfig.namePattern" style="width: 100%">
                <el-option label="首字母保留" value="first" />
                <el-option label="姓氏保留" value="surname" />
                <el-option label="全部隐藏" value="all" />
              </el-select>
            </el-form-item>
            <el-form-item label="手机号脱敏">
              <el-select v-model="desensitizationConfig.phonePattern" style="width: 100%">
                <el-option label="中间四位隐藏" value="middle4" />
                <el-option label="后四位隐藏" value="last4" />
                <el-option label="前三后四保留" value="keep34" />
              </el-select>
            </el-form-item>
            <el-form-item label="邮箱脱敏">
              <el-select v-model="desensitizationConfig.emailPattern" style="width: 100%">
                <el-option label="用户名隐藏" value="username" />
                <el-option label="域名隐藏" value="domain" />
                <el-option label="部分隐藏" value="partial" />
              </el-select>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>

    <!-- 规则管理区 -->
    <el-card class="section-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><DocumentCopy /></el-icon>
            规则管理列表
          </span>
          <el-button type="primary" @click="handleAddRule">
            <el-icon><Plus /></el-icon>
            添加规则
          </el-button>
        </div>
      </template>

      <el-table
        :data="transformRules"
        :loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="ruleName" label="规则名称" min-width="150" />
        <el-table-column label="规则类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getRuleTypeTag(row.ruleType).type" size="small">
              {{ getRuleTypeTag(row.ruleType).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="fieldName" label="应用字段" width="120" />
        <el-table-column label="配置信息" min-width="200">
          <template #default="{ row }">
            <span class="config-text">{{ JSON.stringify(row.config) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
              {{ row.enabled ? '已启用' : '已停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleToggleRule(row)">
              <el-icon><Switch /></el-icon>
              {{ row.enabled ? '停用' : '启用' }}
            </el-button>
            <el-button link type="primary" @click="handleEditRule(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button link type="danger" @click="handleDeleteRule(row)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 字段映射对话框 -->
    <el-dialog
      v-model="mappingDialogVisible"
      :title="mappingForm.id ? '编辑字段映射' : '添加字段映射'"
      width="600px"
    >
      <el-form
        ref="mappingFormRef"
        :model="mappingForm"
        :rules="mappingFormRules"
        label-width="100px"
      >
        <el-form-item label="原始字段" prop="sourceField">
          <el-input v-model="mappingForm.sourceField" placeholder="请输入原始字段名" />
        </el-form-item>
        <el-form-item label="目标字段" prop="targetField">
          <el-input v-model="mappingForm.targetField" placeholder="请输入目标字段名" />
        </el-form-item>
        <el-form-item label="数据类型" prop="dataType">
          <el-select v-model="mappingForm.dataType" style="width: 100%">
            <el-option label="字符串" value="字符串" />
            <el-option label="数值" value="数值" />
            <el-option label="日期" value="日期" />
            <el-option label="布尔" value="布尔" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否必填">
          <el-switch v-model="mappingForm.required" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="mappingForm.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="mappingDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitMappingForm" :loading="loading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 转换规则对话框 -->
    <el-dialog
      v-model="ruleDialogVisible"
      :title="ruleForm.id ? '编辑转换规则' : '添加转换规则'"
      width="600px"
    >
      <el-form
        ref="ruleFormRef"
        :model="ruleForm"
        :rules="ruleFormRules"
        label-width="100px"
      >
        <el-form-item label="规则名称" prop="ruleName">
          <el-input v-model="ruleForm.ruleName" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="规则类型" prop="ruleType">
          <el-select v-model="ruleForm.ruleType" style="width: 100%">
            <el-option label="格式转换" value="format" />
            <el-option label="规则校验" value="validation" />
            <el-option label="脱敏处理" value="desensitization" />
            <el-option label="异常标注" value="exception" />
          </el-select>
        </el-form-item>
        <el-form-item label="应用字段" prop="fieldName">
          <el-input v-model="ruleForm.fieldName" placeholder="请输入字段名" />
        </el-form-item>
        <el-form-item label="配置参数">
          <el-input
            v-model="ruleForm.config"
            type="textarea"
            :rows="3"
            placeholder='如: {"format": "YYYY-MM-DD"}'
          />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="ruleForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ruleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRuleForm" :loading="loading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 预览对话框 -->
    <el-dialog
      v-model="previewDialogVisible"
      title="数据转换预览"
      width="800px"
    >
      <el-table :data="previewData" border style="width: 100%">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="original" label="原始数据" min-width="200" />
        <el-table-column label="" width="80" align="center">
          <template #default>
            <el-icon color="#409EFF" size="20"><Right /></el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="transformed" label="转换后数据" min-width="200">
          <template #default="{ row }">
            <span class="transformed-text">{{ row.transformed }}</span>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button type="primary" @click="previewDialogVisible = false">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.data-transform-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;

  .header-card {
    margin-bottom: 20px;
    border-radius: 8px;

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-left {
        h2 {
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 600;
          color: #303133;
        }

        .subtitle {
          margin: 0;
          font-size: 14px;
          color: #909399;
        }
      }

      .header-right {
        display: flex;
        gap: 10px;
      }
    }
  }

  .stats-row {
    margin-bottom: 20px;

    .stat-card {
      border-radius: 8px;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-4px);
      }

      .stat-item {
        display: flex;
        align-items: center;
        gap: 16px;

        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: white;

          &.format {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }

          &.validation {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          }

          &.desensitization {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          }

          &.exception {
            background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
          }
        }

        .stat-info {
          .stat-value {
            font-size: 28px;
            font-weight: 700;
            color: #303133;
            line-height: 1;
            margin-bottom: 8px;
          }

          .stat-label {
            font-size: 14px;
            color: #909399;
          }
        }
      }
    }
  }

  .section-card {
    margin-bottom: 20px;
    border-radius: 8px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .card-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }

      .card-actions {
        display: flex;
        align-items: center;
      }
    }
  }

  .config-row {
    margin-bottom: 20px;
  }

  .validation-examples {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .config-text {
    color: #606266;
    font-size: 12px;
    font-family: 'Courier New', monospace;
  }

  .transformed-text {
    color: #67c23a;
    font-weight: 500;
  }

  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid #ebeef5;
  }

  :deep(.el-card__body) {
    padding: 20px;
  }

  :deep(.el-table) {
    font-size: 14px;
  }

  :deep(.el-button + .el-button) {
    margin-left: 0;
  }

  :deep(.el-form-item) {
    margin-bottom: 20px;
  }

  :deep(.el-alert) {
    padding: 8px 12px;
  }
}
</style>