<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules
} from 'element-plus'
import {
  CircleCheck,
  Warning,
  CircleClose,
  List,
  Document,
  Edit,
  Delete,
  Plus,
  Download,
  Upload,
  Search,
  Refresh,
  Check,
  Setting,
  Connection,
  Timer,
  Files,
  FolderOpened
} from '@element-plus/icons-vue'

// 规则类型定义
interface RuleType {
  id: string
  name: string
  icon: any
  description: string
  category: string
}

// 验证规则定义
interface ValidationRule {
  id: string
  name: string
  type: string
  required: boolean
  fieldName: string
  params: {
    min?: number
    max?: number
    pattern?: string
    message?: string
    validator?: string
    async?: boolean
    trigger?: string
    dependsOn?: string[]
    priority?: number
  }
  enabled: boolean
  createTime: string
}

// 测试用例定义
interface TestCase {
  id: string
  value: any
  result: 'success' | 'warning' | 'error' | 'pending'
  message: string
  timestamp: string
}

// 规则模板定义
interface RuleTemplate {
  id: string
  name: string
  category: string
  rules: ValidationRule[]
  description: string
  version: string
  createTime: string
}

// 规则类型列表
const ruleTypes = ref<RuleType[]>([
  {
    id: 'required',
    name: '必填验证',
    icon: CircleCheck,
    description: '字段不能为空',
    category: 'basic'
  },
  {
    id: 'length',
    name: '长度限制',
    icon: List,
    description: '限制字符串长度范围',
    category: 'basic'
  },
  {
    id: 'pattern',
    name: '格式验证',
    icon: Document,
    description: '使用正则表达式验证格式',
    category: 'format'
  },
  {
    id: 'range',
    name: '数值范围',
    icon: Setting,
    description: '验证数值在指定范围内',
    category: 'basic'
  },
  {
    id: 'email',
    name: '邮箱验证',
    icon: Document,
    description: '验证邮箱格式',
    category: 'format'
  },
  {
    id: 'phone',
    name: '手机号验证',
    icon: Document,
    description: '验证手机号格式',
    category: 'format'
  },
  {
    id: 'url',
    name: 'URL验证',
    icon: Connection,
    description: '验证URL格式',
    category: 'format'
  },
  {
    id: 'async',
    name: '异步验证',
    icon: Timer,
    description: '远程服务器验证',
    category: 'advanced'
  },
  {
    id: 'custom',
    name: '自定义规则',
    icon: Edit,
    description: '自定义验证逻辑',
    category: 'advanced'
  }
])

// 分类选项
const categories = [
  { label: '全部', value: 'all' },
  { label: '基础验证', value: 'basic' },
  { label: '格式验证', value: 'format' },
  { label: '高级验证', value: 'advanced' }
]

// 触发时机选项
const triggerOptions = [
  { label: '失去焦点时', value: 'blur' },
  { label: '值改变时', value: 'change' },
  { label: '手动触发', value: 'manual' }
]

// 当前选中的分类
const selectedCategory = ref('all')

// 规则列表
const rules = ref<ValidationRule[]>([])

// 规则模板列表
const templates = ref<RuleTemplate[]>([])

// 测试用例列表
const testCases = ref<TestCase[]>([])

// 当前编辑的规则
const currentRule = ref<ValidationRule | null>(null)

// 表单引用
const ruleFormRef = ref<FormInstance>()

// 规则表单数据
const ruleForm = reactive({
  name: '',
  type: '',
  fieldName: '',
  required: false,
  enabled: true,
  min: undefined as number | undefined,
  max: undefined as number | undefined,
  pattern: '',
  message: '',
  validator: '',
  async: false,
  trigger: 'blur',
  dependsOn: [] as string[],
  priority: 1
})

// 表单验证规则
const formRules: FormRules = {
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择规则类型', trigger: 'change' }],
  fieldName: [{ required: true, message: '请输入字段名', trigger: 'blur' }],
  message: [{ required: true, message: '请输入错误提示', trigger: 'blur' }]
}

// 搜索关键词
const searchKeyword = ref('')

// 测试数据
const testValue = ref('')
const testResults = ref<TestCase[]>([])
const isTesting = ref(false)

// 模板搜索关键词
const templateSearchKeyword = ref('')

// 活动面板
const activeTab = ref('config')

// 加载状态
const loading = ref(false)

// 对话框可见性
const dialogVisible = ref(false)
const templateDialogVisible = ref(false)

// 模板表单
const templateForm = reactive({
  name: '',
  category: '',
  description: '',
  version: '1.0.0'
})

// 计算属性：过滤后的规则类型
const filteredRuleTypes = computed(() => {
  if (selectedCategory.value === 'all') {
    return ruleTypes.value
  }
  return ruleTypes.value.filter(type => type.category === selectedCategory.value)
})

// 计算属性：过滤后的规则列表
const filteredRules = computed(() => {
  if (!searchKeyword.value) return rules.value
  return rules.value.filter(rule =>
    rule.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
    rule.fieldName.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

// 计算属性：过滤后的模板列表
const filteredTemplates = computed(() => {
  if (!templateSearchKeyword.value) return templates.value
  return templates.value.filter(template =>
    template.name.toLowerCase().includes(templateSearchKeyword.value.toLowerCase()) ||
    template.description.toLowerCase().includes(templateSearchKeyword.value.toLowerCase())
  )
})

// 计算属性：可依赖的规则列表
const dependableRules = computed(() => {
  return rules.value
    .filter(rule => currentRule.value?.id !== rule.id)
    .map(rule => ({
      label: `${rule.name} (${rule.fieldName})`,
      value: rule.id
    }))
})

// 初始化数据
const initData = () => {
  loading.value = true
  
  // 模拟异步加载规则数据
  setTimeout(() => {
    rules.value = [
      {
        id: '1',
        name: '用户名必填',
        type: 'required',
        required: true,
        fieldName: 'username',
        params: {
          message: '用户名不能为空',
          trigger: 'blur',
          priority: 1
        },
        enabled: true,
        createTime: '2025-01-15 10:20:30'
      },
      {
        id: '2',
        name: '用户名长度',
        type: 'length',
        required: false,
        fieldName: 'username',
        params: {
          min: 3,
          max: 20,
          message: '用户名长度必须在3-20个字符之间',
          trigger: 'blur',
          priority: 2,
          dependsOn: ['1']
        },
        enabled: true,
        createTime: '2025-01-15 10:21:30'
      },
      {
        id: '3',
        name: '邮箱格式验证',
        type: 'email',
        required: true,
        fieldName: 'email',
        params: {
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          message: '请输入正确的邮箱格式',
          trigger: 'blur',
          priority: 1
        },
        enabled: true,
        createTime: '2025-01-15 10:22:30'
      },
      {
        id: '4',
        name: '手机号验证',
        type: 'phone',
        required: true,
        fieldName: 'phone',
        params: {
          pattern: '^1[3-9]\\d{9}$',
          message: '请输入正确的手机号',
          trigger: 'blur',
          priority: 1
        },
        enabled: true,
        createTime: '2025-01-15 10:23:30'
      },
      {
        id: '5',
        name: '年龄范围验证',
        type: 'range',
        required: false,
        fieldName: 'age',
        params: {
          min: 18,
          max: 65,
          message: '年龄必须在18-65岁之间',
          trigger: 'change',
          priority: 1
        },
        enabled: true,
        createTime: '2025-01-15 10:24:30'
      },
      {
        id: '6',
        name: '用户名唯一性验证',
        type: 'async',
        required: false,
        fieldName: 'username',
        params: {
          async: true,
          message: '用户名已存在',
          trigger: 'blur',
          priority: 3,
          dependsOn: ['1', '2']
        },
        enabled: false,
        createTime: '2025-01-15 10:25:30'
      }
    ]
    
    // 模拟加载模板数据
    templates.value = [
      {
        id: 't1',
        name: '用户注册验证',
        category: '用户管理',
        description: '包含用户名、邮箱、手机号等常用注册字段的验证规则',
        version: '1.0.0',
        rules: rules.value.slice(0, 4),
        createTime: '2025-01-10 09:00:00'
      },
      {
        id: 't2',
        name: '基础信息验证',
        category: '通用',
        description: '包含姓名、年龄、性别等基础字段的验证规则',
        version: '1.1.0',
        rules: rules.value.slice(4, 5),
        createTime: '2025-01-12 14:30:00'
      },
      {
        id: 't3',
        name: '联系方式验证',
        category: '通用',
        description: '包含手机号、邮箱、地址等联系方式的验证规则',
        version: '1.0.1',
        rules: rules.value.slice(2, 4),
        createTime: '2025-01-14 16:45:00'
      }
    ]
    
    loading.value = false
    ElMessage.success('数据加载成功')
  }, 800)
}

// 选择规则类型
const selectRuleType = (type: RuleType) => {
  ruleForm.type = type.id
  
  // 根据类型预设参数
  switch (type.id) {
    case 'email':
      ruleForm.pattern = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
      ruleForm.message = '请输入正确的邮箱格式'
      break
    case 'phone':
      ruleForm.pattern = '^1[3-9]\\d{9}$'
      ruleForm.message = '请输入正确的手机号'
      break
    case 'url':
      ruleForm.pattern = '^https?:\\/\\/.+'
      ruleForm.message = '请输入正确的URL格式'
      break
    case 'required':
      ruleForm.message = '该字段不能为空'
      break
    case 'length':
      ruleForm.min = 1
      ruleForm.max = 100
      ruleForm.message = '长度不符合要求'
      break
    case 'range':
      ruleForm.min = 0
      ruleForm.max = 100
      ruleForm.message = '数值不在有效范围内'
      break
    case 'async':
      ruleForm.async = true
      ruleForm.message = '验证失败'
      break
  }
}

// 添加规则
const addRule = () => {
  currentRule.value = null
  resetForm()
  dialogVisible.value = true
}

// 编辑规则
const editRule = (rule: ValidationRule) => {
  currentRule.value = rule
  ruleForm.name = rule.name
  ruleForm.type = rule.type
  ruleForm.fieldName = rule.fieldName
  ruleForm.required = rule.required
  ruleForm.enabled = rule.enabled
  ruleForm.min = rule.params.min
  ruleForm.max = rule.params.max
  ruleForm.pattern = rule.params.pattern || ''
  ruleForm.message = rule.params.message || ''
  ruleForm.validator = rule.params.validator || ''
  ruleForm.async = rule.params.async || false
  ruleForm.trigger = rule.params.trigger || 'blur'
  ruleForm.dependsOn = rule.params.dependsOn || []
  ruleForm.priority = rule.params.priority || 1
  dialogVisible.value = true
}

// 保存规则
const saveRule = async () => {
  if (!ruleFormRef.value) return
  
  await ruleFormRef.value.validate((valid) => {
    if (valid) {
      const ruleData: ValidationRule = {
        id: currentRule.value?.id || Date.now().toString(),
        name: ruleForm.name,
        type: ruleForm.type,
        required: ruleForm.required,
        fieldName: ruleForm.fieldName,
        params: {
          min: ruleForm.min,
          max: ruleForm.max,
          pattern: ruleForm.pattern,
          message: ruleForm.message,
          validator: ruleForm.validator,
          async: ruleForm.async,
          trigger: ruleForm.trigger,
          dependsOn: ruleForm.dependsOn,
          priority: ruleForm.priority
        },
        enabled: ruleForm.enabled,
        createTime: currentRule.value?.createTime || new Date().toLocaleString('zh-CN')
      }
      
      if (currentRule.value) {
        // 编辑
        const index = rules.value.findIndex(r => r.id === currentRule.value!.id)
        if (index !== -1) {
          rules.value[index] = ruleData
        }
        ElMessage.success('规则更新成功')
      } else {
        // 新增
        rules.value.unshift(ruleData)
        ElMessage.success('规则添加成功')
      }
      
      dialogVisible.value = false
      resetForm()
    }
  })
}

// 删除规则
const deleteRule = (rule: ValidationRule) => {
  ElMessageBox.confirm('确定要删除此规则吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = rules.value.findIndex(r => r.id === rule.id)
    if (index !== -1) {
      rules.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  }).catch(() => {
    // 取消删除
  })
}

// 切换规则状态
const toggleRule = (rule: ValidationRule) => {
  rule.enabled = !rule.enabled
  ElMessage.success(rule.enabled ? '规则已启用' : '规则已禁用')
}

// 重置表单
const resetForm = () => {
  if (ruleFormRef.value) {
    ruleFormRef.value.resetFields()
  }
  ruleForm.name = ''
  ruleForm.type = ''
  ruleForm.fieldName = ''
  ruleForm.required = false
  ruleForm.enabled = true
  ruleForm.min = undefined
  ruleForm.max = undefined
  ruleForm.pattern = ''
  ruleForm.message = ''
  ruleForm.validator = ''
  ruleForm.async = false
  ruleForm.trigger = 'blur'
  ruleForm.dependsOn = []
  ruleForm.priority = 1
}

// 测试规则
const testRule = () => {
  if (!testValue.value) {
    ElMessage.warning('请输入测试数据')
    return
  }
  
  isTesting.value = true
  testResults.value = []
  
  // 获取启用的规则并按优先级排序
  const enabledRules = rules.value
    .filter(rule => rule.enabled)
    .sort((a, b) => (a.params.priority || 0) - (b.params.priority || 0))
  
  // 模拟异步验证
  setTimeout(() => {
    enabledRules.forEach((rule, index) => {
      setTimeout(() => {
        const result = validateSingleRule(rule, testValue.value)
        testResults.value.push({
          id: Date.now().toString() + index,
          value: testValue.value,
          result: result.valid ? 'success' : 'error',
          message: result.message,
          timestamp: new Date().toLocaleString('zh-CN')
        })
        
        if (index === enabledRules.length - 1) {
          isTesting.value = false
        }
      }, (index + 1) * 300)
    })
  }, 500)
}

// 单个规则验证
const validateSingleRule = (rule: ValidationRule, value: any): { valid: boolean, message: string } => {
  switch (rule.type) {
    case 'required':
      return {
        valid: !!value && value.trim() !== '',
        message: value ? `【${rule.name}】验证通过` : rule.params.message || '字段不能为空'
      }
    case 'length':
      const len = value.length
      const minLen = rule.params.min || 0
      const maxLen = rule.params.max || Infinity
      return {
        valid: len >= minLen && len <= maxLen,
        message: (len >= minLen && len <= maxLen)
          ? `【${rule.name}】验证通过`
          : rule.params.message || `长度应在${minLen}-${maxLen}之间`
      }
    case 'pattern':
    case 'email':
    case 'phone':
    case 'url':
      const pattern = new RegExp(rule.params.pattern || '')
      return {
        valid: pattern.test(value),
        message: pattern.test(value)
          ? `【${rule.name}】验证通过`
          : rule.params.message || '格式不正确'
      }
    case 'range':
      const num = Number(value)
      const min = rule.params.min || 0
      const max = rule.params.max || Infinity
      return {
        valid: !isNaN(num) && num >= min && num <= max,
        message: (!isNaN(num) && num >= min && num <= max)
          ? `【${rule.name}】验证通过`
          : rule.params.message || `数值应在${min}-${max}之间`
      }
    case 'async':
      // 模拟异步验证（50%概率通过）
      const asyncValid = Math.random() > 0.5
      return {
        valid: asyncValid,
        message: asyncValid
          ? `【${rule.name}】异步验证通过`
          : rule.params.message || '异步验证失败'
      }
    default:
      return {
        valid: true,
        message: `【${rule.name}】验证通过`
      }
  }
}

// 批量测试
const batchTest = () => {
  ElMessageBox.prompt('请输入测试用例（每行一个）', '批量测试', {
    confirmButtonText: '开始测试',
    cancelButtonText: '取消',
    inputType: 'textarea'
  }).then(({ value }) => {
    if (!value) {
      ElMessage.warning('请输入测试用例')
      return
    }
    
    const testValues = value.split('\n').filter((v: string) => v.trim())
    isTesting.value = true
    testResults.value = []
    
    testValues.forEach((val: string, idx: number) => {
      setTimeout(() => {
        const enabledRules = rules.value.filter(rule => rule.enabled)
        const allPassed = enabledRules.every(rule => {
          return validateSingleRule(rule, val).valid
        })
        
        testResults.value.push({
          id: Date.now().toString() + idx,
          value: val,
          result: allPassed ? 'success' : 'error',
          message: allPassed ? '所有规则验证通过' : '存在验证失败的规则',
          timestamp: new Date().toLocaleString('zh-CN')
        })
        
        if (idx === testValues.length - 1) {
          isTesting.value = false
        }
      }, (idx + 1) * 500)
    })
  }).catch(() => {
    // 取消
  })
}

// 清空测试结果
const clearTestResults = () => {
  testResults.value = []
  testValue.value = ''
}

// 导出测试结果
const exportTestResults = () => {
  if (testResults.value.length === 0) {
    ElMessage.warning('暂无测试结果')
    return
  }
  
  const data = testResults.value.map(test => ({
    测试值: test.value,
    验证结果: test.result === 'success' ? '通过' : '失败',
    提示信息: test.message,
    测试时间: test.timestamp
  }))
  
  ElMessage.success('测试结果已导出到控制台')
  console.table(data)
}

// 保存为模板
const saveAsTemplate = () => {
  if (rules.value.length === 0) {
    ElMessage.warning('请先配置规则')
    return
  }
  
  templateForm.name = ''
  templateForm.category = ''
  templateForm.description = ''
  templateForm.version = '1.0.0'
  templateDialogVisible.value = true
}

// 确认保存模板
const confirmSaveTemplate = () => {
  if (!templateForm.name) {
    ElMessage.warning('请输入模板名称')
    return
  }
  
  const template: RuleTemplate = {
    id: Date.now().toString(),
    name: templateForm.name,
    category: templateForm.category || '自定义',
    description: templateForm.description,
    version: templateForm.version,
    rules: [...rules.value],
    createTime: new Date().toLocaleString('zh-CN')
  }
  
  templates.value.unshift(template)
  templateDialogVisible.value = false
  ElMessage.success('模板保存成功')
}

// 应用模板
const applyTemplate = (template: RuleTemplate) => {
  ElMessageBox.confirm('应用模板将覆盖当前规则，是否继续？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    rules.value = template.rules.map(rule => ({
      ...rule,
      id: Date.now().toString() + Math.random()
    }))
    ElMessage.success('模板应用成功')
  }).catch(() => {
    // 取消
  })
}

// 删除模板
const deleteTemplate = (template: RuleTemplate) => {
  ElMessageBox.confirm('确定要删除此模板吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = templates.value.findIndex(t => t.id === template.id)
    if (index !== -1) {
      templates.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  }).catch(() => {
    // 取消
  })
}

// 导出模板
const exportTemplate = (template: RuleTemplate) => {
  const data = JSON.stringify(template, null, 2)
  ElMessage.success('模板已导出到控制台')
  console.log('导出的模板数据：')
  console.log(data)
}

// 导入模板
const importTemplate = () => {
  ElMessageBox.prompt('请粘贴模板JSON数据', '导入模板', {
    confirmButtonText: '导入',
    cancelButtonText: '取消',
    inputType: 'textarea'
  }).then(({ value }) => {
    try {
      const template = JSON.parse(value)
      template.id = Date.now().toString()
      template.createTime = new Date().toLocaleString('zh-CN')
      templates.value.unshift(template)
      ElMessage.success('模板导入成功')
    } catch (error) {
      ElMessage.error('模板数据格式错误')
    }
  }).catch(() => {
    // 取消
  })
}

// 获取规则类型名称
const getRuleTypeName = (typeId: string) => {
  const type = ruleTypes.value.find(t => t.id === typeId)
  return type?.name || typeId
}

// 获取规则类型图标
const getRuleTypeIcon = (typeId: string) => {
  const type = ruleTypes.value.find(t => t.id === typeId)
  return type?.icon || Document
}

// 获取结果状态类型
const getResultType = (result: string) => {
  const types: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    success: 'success',
    warning: 'warning',
    error: 'danger',
    pending: 'info'
  }
  return types[result] || 'info'
}

// 获取结果图标
const getResultIcon = (result: string) => {
  const icons: Record<string, any> = {
    success: CircleCheck,
    warning: Warning,
    error: CircleClose,
    pending: Timer
  }
  return icons[result] || Timer
}

// 刷新数据
const refresh = () => {
  initData()
}

// 组件挂载时初始化
initData()
</script>

<template>
  <div class="validation-rule-container">
    <!-- 头部工具栏 -->
    <div class="header-toolbar">
      <div class="left-section">
        <h2>验证规则设置</h2>
        <el-tag type="info" size="large">共 {{ rules.length }} 条规则</el-tag>
      </div>
      <div class="right-section">
        <el-button :icon="Plus" type="primary" @click="addRule">
          新增规则
        </el-button>
        <el-button :icon="Files" @click="saveAsTemplate">
          保存为模板
        </el-button>
        <el-button :icon="Upload" @click="importTemplate">
          导入模板
        </el-button>
        <el-button :icon="Refresh" @click="refresh">
          刷新
        </el-button>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 左侧：规则类型选择 -->
      <div class="left-panel">
        <el-card shadow="hover" class="type-card">
          <template #header>
            <div class="card-header">
              <el-icon><FolderOpened /></el-icon>
              <span>规则类型</span>
            </div>
          </template>
          
          <div class="category-filter">
            <el-radio-group v-model="selectedCategory" size="small">
              <el-radio-button
                v-for="cat in categories"
                :key="cat.value"
                :label="cat.value"
              >
                {{ cat.label }}
              </el-radio-button>
            </el-radio-group>
          </div>

          <div class="rule-types">
            <div
              v-for="type in filteredRuleTypes"
              :key="type.id"
              class="rule-type-item"
              :class="{ active: ruleForm.type === type.id }"
              @click="selectRuleType(type)"
            >
              <el-icon class="type-icon"><component :is="type.icon" /></el-icon>
              <div class="type-info">
                <div class="type-name">{{ type.name }}</div>
                <div class="type-desc">{{ type.description }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 中间：规则列表和配置 -->
      <div class="center-panel">
        <el-card shadow="hover" class="rule-list-card">
          <template #header>
            <div class="card-header">
              <el-icon><List /></el-icon>
              <span>规则列表</span>
              <el-input
                v-model="searchKeyword"
                placeholder="搜索规则名称或字段名"
                :prefix-icon="Search"
                clearable
                class="search-input"
              />
            </div>
          </template>

          <el-table
            :data="filteredRules"
            stripe
            v-loading="loading"
            style="width: 100%"
            max-height="500"
          >
            <el-table-column prop="name" label="规则名称" min-width="150">
              <template #default="{ row }">
                <div class="rule-name-cell">
                  <el-icon class="rule-icon">
                    <component :is="getRuleTypeIcon(row.type)" />
                  </el-icon>
                  <span>{{ row.name }}</span>
                  <el-tag
                    v-if="row.required"
                    type="danger"
                    size="small"
                    style="margin-left: 8px"
                  >
                    必填
                  </el-tag>
                </div>
              </template>
            </el-table-column>
            
            <el-table-column prop="type" label="规则类型" width="120">
              <template #default="{ row }">
                <el-tag size="small">{{ getRuleTypeName(row.type) }}</el-tag>
              </template>
            </el-table-column>
            
            <el-table-column prop="fieldName" label="字段名" width="120" />
            
            <el-table-column prop="params.message" label="错误提示" min-width="180" show-overflow-tooltip />
            
            <el-table-column prop="params.priority" label="优先级" width="80" align="center" />
            
            <el-table-column prop="enabled" label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-switch
                  v-model="row.enabled"
                  @change="toggleRule(row)"
                />
              </template>
            </el-table-column>
            
            <el-table-column label="操作" width="150" align="center" fixed="right">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  size="small"
                  :icon="Edit"
                  link
                  @click="editRule(row)"
                >
                  编辑
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  :icon="Delete"
                  link
                  @click="deleteRule(row)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>

      <!-- 右侧：测试区域和模板管理 -->
      <div class="right-panel">
        <el-tabs v-model="activeTab">
          <!-- 规则测试 -->
          <el-tab-pane label="规则测试" name="test">
            <el-card shadow="hover" class="test-card">
              <div class="test-section">
                <div class="test-input-group">
                  <el-input
                    v-model="testValue"
                    placeholder="输入测试数据"
                    clearable
                  >
                    <template #append>
                      <el-button
                        :icon="Check"
                        @click="testRule"
                        :loading="isTesting"
                        type="primary"
                      >
                        单个测试
                      </el-button>
                    </template>
                  </el-input>
                </div>

                <div class="test-actions">
                  <el-button
                    :icon="Files"
                    @click="batchTest"
                    :disabled="isTesting"
                  >
                    批量测试
                  </el-button>
                  <el-button
                    :icon="Download"
                    @click="exportTestResults"
                    :disabled="testResults.length === 0"
                  >
                    导出结果
                  </el-button>
                  <el-button
                    :icon="Delete"
                    @click="clearTestResults"
                    :disabled="testResults.length === 0"
                  >
                    清空
                  </el-button>
                </div>

                <div class="test-results">
                  <div class="results-header">
                    <span>测试结果</span>
                    <el-tag v-if="testResults.length > 0" type="info">
                      {{ testResults.length }} 条记录
                    </el-tag>
                  </div>

                  <div v-if="testResults.length === 0" class="empty-results">
                    <el-empty description="暂无测试结果" :image-size="80" />
                  </div>

                  <div v-else class="result-list">
                    <div
                      v-for="result in testResults"
                      :key="result.id"
                      class="result-item"
                      :class="result.result"
                    >
                      <div class="result-icon">
                        <el-icon :size="20">
                          <component :is="getResultIcon(result.result)" />
                        </el-icon>
                      </div>
                      <div class="result-content">
                        <div class="result-value">
                          测试值: <strong>{{ result.value }}</strong>
                        </div>
                        <div class="result-message">{{ result.message }}</div>
                        <div class="result-time">{{ result.timestamp }}</div>
                      </div>
                      <el-tag :type="getResultType(result.result)" size="small">
                        {{ result.result === 'success' ? '通过' : '失败' }}
                      </el-tag>
                    </div>
                  </div>
                </div>
              </div>
            </el-card>
          </el-tab-pane>

          <!-- 模板管理 -->
          <el-tab-pane label="模板管理" name="template">
            <el-card shadow="hover" class="template-card">
              <div class="template-section">
                <el-input
                  v-model="templateSearchKeyword"
                  placeholder="搜索模板"
                  :prefix-icon="Search"
                  clearable
                  style="margin-bottom: 16px"
                />

                <div v-if="filteredTemplates.length === 0" class="empty-templates">
                  <el-empty description="暂无模板" :image-size="80" />
                </div>

                <div v-else class="template-list">
                  <div
                    v-for="template in filteredTemplates"
                    :key="template.id"
                    class="template-item"
                  >
                    <div class="template-header">
                      <div class="template-title">
                        <el-icon><Files /></el-icon>
                        <span>{{ template.name }}</span>
                      </div>
                      <el-tag type="info" size="small">v{{ template.version }}</el-tag>
                    </div>
                    <div class="template-category">
                      <el-tag size="small">{{ template.category }}</el-tag>
                      <span class="template-rules-count">
                        {{ template.rules.length }} 条规则
                      </span>
                    </div>
                    <div class="template-desc">{{ template.description }}</div>
                    <div class="template-actions">
                      <el-button
                        type="primary"
                        size="small"
                        :icon="Check"
                        @click="applyTemplate(template)"
                      >
                        应用
                      </el-button>
                      <el-button
                        size="small"
                        :icon="Download"
                        @click="exportTemplate(template)"
                      >
                        导出
                      </el-button>
                      <el-button
                        type="danger"
                        size="small"
                        :icon="Delete"
                        @click="deleteTemplate(template)"
                      >
                        删除
                      </el-button>
                    </div>
                    <div class="template-time">创建时间: {{ template.createTime }}</div>
                  </div>
                </div>
              </div>
            </el-card>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <!-- 规则编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="currentRule ? '编辑规则' : '新增规则'"
      width="600px"
      @closed="resetForm"
    >
      <el-form
        ref="ruleFormRef"
        :model="ruleForm"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="规则名称" prop="name">
          <el-input v-model="ruleForm.name" placeholder="请输入规则名称" />
        </el-form-item>

        <el-form-item label="规则类型" prop="type">
          <el-select
            v-model="ruleForm.type"
            placeholder="请选择规则类型"
            style="width: 100%"
          >
            <el-option
              v-for="type in ruleTypes"
              :key="type.id"
              :label="type.name"
              :value="type.id"
            >
              <div class="select-option">
                <el-icon><component :is="type.icon" /></el-icon>
                <span>{{ type.name }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="字段名" prop="fieldName">
          <el-input v-model="ruleForm.fieldName" placeholder="请输入字段名，如: username" />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="必填项">
              <el-switch v-model="ruleForm.required" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="启用状态">
              <el-switch v-model="ruleForm.enabled" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item
          v-if="['length', 'range'].includes(ruleForm.type)"
          label="最小值"
        >
          <el-input-number
            v-model="ruleForm.min"
            :min="0"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item
          v-if="['length', 'range'].includes(ruleForm.type)"
          label="最大值"
        >
          <el-input-number
            v-model="ruleForm.max"
            :min="0"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item
          v-if="['pattern', 'email', 'phone', 'url'].includes(ruleForm.type)"
          label="正则表达式"
        >
          <el-input
            v-model="ruleForm.pattern"
            type="textarea"
            :rows="2"
            placeholder="请输入正则表达式"
          />
        </el-form-item>

        <el-form-item label="错误提示" prop="message">
          <el-input
            v-model="ruleForm.message"
            type="textarea"
            :rows="2"
            placeholder="请输入验证失败时的错误提示"
          />
        </el-form-item>

        <el-form-item
          v-if="ruleForm.type === 'custom'"
          label="自定义验证"
        >
          <el-input
            v-model="ruleForm.validator"
            type="textarea"
            :rows="3"
            placeholder="请输入自定义验证函数代码"
          />
        </el-form-item>

        <el-form-item label="触发时机">
          <el-select
            v-model="ruleForm.trigger"
            placeholder="请选择触发时机"
            style="width: 100%"
          >
            <el-option
              v-for="option in triggerOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="依赖规则">
          <el-select
            v-model="ruleForm.dependsOn"
            multiple
            placeholder="选择此规则依赖的其他规则"
            style="width: 100%"
          >
            <el-option
              v-for="rule in dependableRules"
              :key="rule.value"
              :label="rule.label"
              :value="rule.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="优先级">
          <el-input-number
            v-model="ruleForm.priority"
            :min="1"
            :max="10"
            style="width: 100%"
          />
          <div class="form-item-tip">数字越小优先级越高</div>
        </el-form-item>

        <el-form-item v-if="ruleForm.type === 'async'" label="异步验证">
          <el-switch v-model="ruleForm.async" />
          <div class="form-item-tip">开启后将进行远程服务器验证</div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRule">保存</el-button>
      </template>
    </el-dialog>

    <!-- 模板保存对话框 -->
    <el-dialog
      v-model="templateDialogVisible"
      title="保存为模板"
      width="500px"
    >
      <el-form :model="templateForm" label-width="100px">
        <el-form-item label="模板名称" required>
          <el-input
            v-model="templateForm.name"
            placeholder="请输入模板名称"
          />
        </el-form-item>

        <el-form-item label="模板分类">
          <el-input
            v-model="templateForm.category"
            placeholder="请输入模板分类"
          />
        </el-form-item>

        <el-form-item label="模板描述">
          <el-input
            v-model="templateForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入模板描述"
          />
        </el-form-item>

        <el-form-item label="版本号">
          <el-input
            v-model="templateForm.version"
            placeholder="如: 1.0.0"
          />
        </el-form-item>

        <el-alert
          title="提示"
          type="info"
          :closable="false"
          style="margin-top: 10px"
        >
          将保存当前所有规则（共 {{ rules.length }} 条）到模板
        </el-alert>
      </el-form>

      <template #footer>
        <el-button @click="templateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSaveTemplate">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.validation-rule-container {
  .header-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 16px 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

    .left-section {
      display: flex;
      align-items: center;
      gap: 16px;

      h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: #303133;
      }
    }

    .right-section {
      display: flex;
      gap: 12px;
    }
  }

  .main-content {
    display: grid;
    grid-template-columns: 280px 1fr 400px;
    gap: 20px;
    height: calc(100vh - 160px);

    .left-panel {
      .type-card {
        height: 100%;
        overflow: hidden;
        display: flex;
        flex-direction: column;

        :deep(.el-card__body) {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          font-size: 16px;
        }

        .category-filter {
          margin-bottom: 16px;

          .el-radio-group {
            display: flex;
            flex-direction: column;
            gap: 8px;

            .el-radio-button {
              :deep(.el-radio-button__inner) {
                width: 100%;
                text-align: left;
                border-radius: 6px;
                border: 1px solid #dcdfe6;
                box-shadow: none;
              }
            }
          }
        }

        .rule-types {
          display: flex;
          flex-direction: column;
          gap: 8px;

          .rule-type-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            border-radius: 8px;
            border: 1px solid #e4e7ed;
            background: white;
            cursor: pointer;
            transition: all 0.3s;

            &:hover {
              border-color: #409eff;
              background: #ecf5ff;
              transform: translateX(4px);
            }

            &.active {
              border-color: #409eff;
              background: #ecf5ff;
              box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
            }

            .type-icon {
              font-size: 24px;
              color: #409eff;
            }

            .type-info {
              flex: 1;

              .type-name {
                font-size: 14px;
                font-weight: 500;
                color: #303133;
                margin-bottom: 4px;
              }

              .type-desc {
                font-size: 12px;
                color: #909399;
              }
            }
          }
        }
      }
    }

    .center-panel {
      .rule-list-card {
        height: 100%;

        .card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 600;
          font-size: 16px;

          .search-input {
            margin-left: auto;
            width: 300px;
          }
        }

        .rule-name-cell {
          display: flex;
          align-items: center;
          gap: 8px;

          .rule-icon {
            font-size: 18px;
            color: #409eff;
          }
        }
      }
    }

    .right-panel {
      .test-card,
      .template-card {
        height: calc(100vh - 260px);
        overflow-y: auto;
      }

      .test-section {
        .test-input-group {
          margin-bottom: 16px;
        }

        .test-actions {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
        }

        .test-results {
          .results-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid #ebeef5;
            font-weight: 600;
            color: #303133;
          }

          .empty-results {
            padding: 40px 0;
          }

          .result-list {
            display: flex;
            flex-direction: column;
            gap: 12px;

            .result-item {
              display: flex;
              align-items: flex-start;
              gap: 12px;
              padding: 16px;
              border-radius: 8px;
              border: 1px solid #e4e7ed;
              background: white;
              transition: all 0.3s;

              &:hover {
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              }

              &.success {
                border-color: #67c23a;
                background: #f0f9ff;

                .result-icon {
                  color: #67c23a;
                }
              }

              &.error {
                border-color: #f56c6c;
                background: #fef0f0;

                .result-icon {
                  color: #f56c6c;
                }
              }

              .result-icon {
                flex-shrink: 0;
                margin-top: 2px;
              }

              .result-content {
                flex: 1;
                min-width: 0;

                .result-value {
                  font-size: 14px;
                  color: #303133;
                  margin-bottom: 8px;

                  strong {
                    color: #409eff;
                  }
                }

                .result-message {
                  font-size: 13px;
                  color: #606266;
                  margin-bottom: 8px;
                  word-break: break-all;
                }

                .result-time {
                  font-size: 12px;
                  color: #909399;
                }
              }
            }
          }
        }
      }

      .template-section {
        .empty-templates {
          padding: 40px 0;
        }

        .template-list {
          display: flex;
          flex-direction: column;
          gap: 16px;

          .template-item {
            padding: 16px;
            border-radius: 8px;
            border: 1px solid #e4e7ed;
            background: white;
            transition: all 0.3s;

            &:hover {
              box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
              border-color: #409eff;
            }

            .template-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 12px;

              .template-title {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 16px;
                font-weight: 600;
                color: #303133;

                .el-icon {
                  color: #409eff;
                  font-size: 20px;
                }
              }
            }

            .template-category {
              display: flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 12px;

              .template-rules-count {
                font-size: 12px;
                color: #909399;
              }
            }

            .template-desc {
              font-size: 13px;
              color: #606266;
              line-height: 1.6;
              margin-bottom: 16px;
            }

            .template-actions {
              display: flex;
              gap: 8px;
              margin-bottom: 12px;
              padding-top: 12px;
              border-top: 1px solid #ebeef5;
            }

            .template-time {
              font-size: 12px;
              color: #909399;
            }
          }
        }
      }
    }
  }

  .select-option {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .form-item-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }
}

// 响应式设计
@media (max-width: 1600px) {
  .validation-rule-container .main-content {
    grid-template-columns: 250px 1fr 350px;
  }
}

@media (max-width: 1200px) {
  .validation-rule-container .main-content {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    height: auto;

    .left-panel,
    .right-panel {
      .type-card,
      .test-card,
      .template-card {
        height: auto;
        max-height: 500px;
      }
    }
  }
}
</style>