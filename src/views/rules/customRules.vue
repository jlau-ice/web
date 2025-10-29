<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// 规则类型定义
interface CustomRule {
  id: string
  name: string
  type: 'text' | 'image' | 'video' | 'composite'
  contentType: string
  status: 'enabled' | 'disabled' | 'testing'
  priority: number
  createdAt: string
  updatedAt: string
  conditions: RuleCondition[]
  actions: RuleAction[]
  effectiveTime?: {
    start: string
    end: string
  }
  scope: string[]
  version: number
  conflictResolution?: 'priority' | 'first' | 'all'
  description?: string
  tags?: string[]
}

// 规则条件定义
interface RuleCondition {
  id: string
  type: 'keyword' | 'regex' | 'image_feature' | 'behavior_pattern'
  logic: 'AND' | 'OR' | 'NOT'
  value: string
  threshold?: number
  parameters?: Record<string, any>
}

// 规则动作定义
interface RuleAction {
  id: string
  type: 'block' | 'warn' | 'mark' | 'review'
  priority: number
  message?: string
  notifyUsers?: string[]
}

// 测试用例定义
interface TestCase {
  id: string
  content: string
  expectedResult: boolean
  actualResult?: boolean
  matchDetails?: string[]
  createdAt: string
}

// 版本历史定义
interface VersionHistory {
  id: string
  version: number
  changes: string
  createdBy: string
  createdAt: string
  ruleSnapshot: Partial<CustomRule>
}

// 响应式数据
const loading = ref(false)
const rules = ref<CustomRule[]>([])
const selectedRule = ref<CustomRule | null>(null)
const showRuleDialog = ref(false)
const showTestDialog = ref(false)
const showVersionDialog = ref(false)
const currentTab = ref('basic')

// 筛选条件
const filters = reactive({
  ruleName: '',
  ruleType: '',
  status: ''
})

// 新建/编辑规则表单
const ruleForm = ref<Partial<CustomRule>>({
  name: '',
  type: 'text',
  contentType: '',
  status: 'disabled',
  priority: 5,
  conditions: [],
  actions: [],
  scope: []
})
const ruleFormRef = ref<FormInstance>()

// 表单验证规则
const ruleFormRules: FormRules = {
  name: [
    { required: true, message: '请输入规则名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择规则类型', trigger: 'change' }
  ],
  contentType: [
    { required: true, message: '请输入适用内容', trigger: 'blur' }
  ]
}

// 规则条件构建器
const conditionForm = reactive({
  type: 'keyword' as RuleCondition['type'],
  logic: 'AND' as RuleCondition['logic'],
  value: '',
  threshold: 80
})

// 规则动作配置
const actionForm = reactive({
  type: 'warn' as RuleAction['type'],
  priority: 1,
  message: '',
  notifyUsers: [] as string[]
})

// 测试相关
const testCases = ref<TestCase[]>([])
const testContent = ref('')
const testResult = ref<any>(null)
const isTesting = ref(false)

// 版本历史
const versionHistory = ref<VersionHistory[]>([])

// 计算属性
const filteredRules = computed(() => {
  return rules.value.filter(rule => {
    const matchName = !filters.ruleName || rule.name.toLowerCase().includes(filters.ruleName.toLowerCase())
    const matchType = !filters.ruleType || rule.type === filters.ruleType
    const matchStatus = !filters.status || rule.status === filters.status
    return matchName && matchType && matchStatus
  })
})

const ruleStats = computed(() => {
  return {
    total: rules.value.length,
    enabled: rules.value.filter(r => r.status === 'enabled').length,
    disabled: rules.value.filter(r => r.status === 'disabled').length,
    testing: rules.value.filter(r => r.status === 'testing').length
  }
})

// 方法
const loadRules = () => {
  loading.value = true
  // 模拟异步加载
  setTimeout(() => {
    rules.value = generateMockRules()
    loading.value = false
    ElMessage.success('规则列表加载成功')
  }, 800)
}

const generateMockRules = (): CustomRule[] => {
  return [
    {
      id: '1',
      name: '政治敏感词检测',
      type: 'text',
      contentType: '文本内容',
      status: 'enabled',
      priority: 10,
      createdAt: '2025-10-20 10:00:00',
      updatedAt: '2025-10-28 15:30:00',
      conditions: [
        { id: 'c1', type: 'keyword', logic: 'OR', value: '敏感词1,敏感词2', threshold: 90 }
      ],
      actions: [
        { id: 'a1', type: 'block', priority: 1, message: '内容包含政治敏感词，已拦截' }
      ],
      scope: ['评论', '帖子', '私信'],
      version: 3
    },
    {
      id: '2',
      name: '色情图片识别',
      type: 'image',
      contentType: '图片内容',
      status: 'enabled',
      priority: 9,
      createdAt: '2025-10-18 14:20:00',
      updatedAt: '2025-10-27 09:15:00',
      conditions: [
        { id: 'c2', type: 'image_feature', logic: 'AND', value: 'pornography', threshold: 85 }
      ],
      actions: [
        { id: 'a2', type: 'block', priority: 1, message: '图片涉嫌色情内容' },
        { id: 'a3', type: 'review', priority: 2, notifyUsers: ['admin'] }
      ],
      scope: ['头像', '动态图片', '相册'],
      version: 2
    },
    {
      id: '3',
      name: '暴力视频检测',
      type: 'video',
      contentType: '视频内容',
      status: 'testing',
      priority: 8,
      createdAt: '2025-10-25 16:45:00',
      updatedAt: '2025-10-29 11:20:00',
      conditions: [
        { id: 'c3', type: 'behavior_pattern', logic: 'AND', value: 'violence', threshold: 75 }
      ],
      actions: [
        { id: 'a4', type: 'mark', priority: 1, message: '视频包含暴力内容' }
      ],
      scope: ['短视频', '直播'],
      version: 1
    },
    {
      id: '4',
      name: '广告垃圾信息过滤',
      type: 'text',
      contentType: '文本内容',
      status: 'enabled',
      priority: 6,
      createdAt: '2025-10-15 09:30:00',
      updatedAt: '2025-10-26 14:00:00',
      conditions: [
        { id: 'c4', type: 'regex', logic: 'OR', value: '.*广告.*|.*推广.*', threshold: 70 },
        { id: 'c5', type: 'keyword', logic: 'AND', value: '联系方式,微信', threshold: 80 }
      ],
      actions: [
        { id: 'a5', type: 'warn', priority: 1, message: '疑似广告内容' }
      ],
      scope: ['评论', '私信'],
      version: 4
    },
    {
      id: '5',
      name: '复合违规内容检测',
      type: 'composite',
      contentType: '多模态内容',
      status: 'disabled',
      priority: 7,
      createdAt: '2025-10-22 13:15:00',
      updatedAt: '2025-10-28 16:45:00',
      conditions: [
        { id: 'c6', type: 'keyword', logic: 'OR', value: '违规关键词', threshold: 85 },
        { id: 'c7', type: 'image_feature', logic: 'AND', value: 'inappropriate', threshold: 80 }
      ],
      actions: [
        { id: 'a6', type: 'review', priority: 1, notifyUsers: ['moderator'] }
      ],
      scope: ['所有内容'],
      version: 1
    }
  ]
}

const handleAdd = () => {
  ruleForm.value = {
    name: '',
    type: 'text',
    contentType: '',
    status: 'disabled',
    priority: 5,
    conditions: [],
    actions: [],
    scope: []
  }
  showRuleDialog.value = true
  currentTab.value = 'basic'
}

const handleEdit = (rule: CustomRule) => {
  selectedRule.value = rule
  ruleForm.value = { ...rule }
  showRuleDialog.value = true
  currentTab.value = 'basic'
}

const handleDelete = async (rule: CustomRule) => {
  try {
    await ElMessageBox.confirm(`确定要删除规则"${rule.name}"吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 模拟删除
    setTimeout(() => {
      rules.value = rules.value.filter(r => r.id !== rule.id)
      ElMessage.success('删除成功')
    }, 300)
  } catch {
    // 用户取消
  }
}

const handleStatusChange = (rule: CustomRule) => {
  const statusText = rule.status === 'enabled' ? '启用' : rule.status === 'disabled' ? '禁用' : '测试'
  ElNotification({
    title: '状态变更',
    message: `规则"${rule.name}"已${statusText}`,
    type: 'success',
    duration: 2000
  })
}

const handleCopy = (rule: CustomRule) => {
  const newRule: CustomRule = {
    ...rule,
    id: generateId(),
    name: `${rule.name}_副本`,
    status: 'disabled',
    createdAt: new Date().toLocaleString('zh-CN'),
    updatedAt: new Date().toLocaleString('zh-CN'),
    version: 1
  }
  rules.value.unshift(newRule)
  ElMessage.success('规则已复制')
}

const saveRule = async () => {
  if (!ruleFormRef.value) return
  
  await ruleFormRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      setTimeout(() => {
        if (selectedRule.value) {
          // 更新现有规则
          const index = rules.value.findIndex(r => r.id === selectedRule.value!.id)
          if (index !== -1) {
            rules.value[index] = {
              ...rules.value[index],
              ...ruleForm.value,
              updatedAt: new Date().toLocaleString('zh-CN'),
              version: rules.value[index].version + 1
            } as CustomRule
          }
          ElMessage.success('规则更新成功')
        } else {
          // 新建规则
          const newRule: CustomRule = {
            id: generateId(),
            ...ruleForm.value,
            createdAt: new Date().toLocaleString('zh-CN'),
            updatedAt: new Date().toLocaleString('zh-CN'),
            version: 1
          } as CustomRule
          rules.value.unshift(newRule)
          ElMessage.success('规则创建成功')
        }
        loading.value = false
        showRuleDialog.value = false
        selectedRule.value = null
      }, 500)
    }
  })
}

// 条件构建器方法
const addCondition = () => {
  if (!conditionForm.value.trim()) {
    ElMessage.warning('请输入条件值')
    return
  }
  
  const newCondition: RuleCondition = {
    id: generateId(),
    type: conditionForm.type,
    logic: conditionForm.logic,
    value: conditionForm.value,
    threshold: conditionForm.threshold
  }
  
  if (!ruleForm.value.conditions) {
    ruleForm.value.conditions = []
  }
  
  ruleForm.value.conditions.push(newCondition)
  
  // 重置表单
  conditionForm.value = ''
  conditionForm.threshold = 80
  
  ElMessage.success('条件已添加')
}

const removeCondition = (id: string) => {
  if (ruleForm.value.conditions) {
    ruleForm.value.conditions = ruleForm.value.conditions.filter(c => c.id !== id)
  }
}

const addAction = () => {
  const newAction: RuleAction = {
    id: generateId(),
    type: actionForm.type,
    priority: actionForm.priority,
    message: actionForm.message,
    notifyUsers: [...actionForm.notifyUsers]
  }
  
  if (!ruleForm.value.actions) {
    ruleForm.value.actions = []
  }
  
  ruleForm.value.actions.push(newAction)
  
  // 重置表单
  actionForm.message = ''
  actionForm.notifyUsers = []
  
  ElMessage.success('动作已添加')
}

const removeAction = (id: string) => {
  if (ruleForm.value.actions) {
    ruleForm.value.actions = ruleForm.value.actions.filter(a => a.id !== id)
  }
}

// 测试相关方法
const handleTest = (rule: CustomRule) => {
  selectedRule.value = rule
  showTestDialog.value = true
  loadTestCases(rule.id)
}

const loadTestCases = (ruleId: string) => {
  // 模拟加载测试用例
  setTimeout(() => {
    testCases.value = [
      {
        id: '1',
        content: '这是一个测试内容，包含敏感词',
        expectedResult: true,
        actualResult: true,
        matchDetails: ['敏感词'],
        createdAt: '2025-10-28 10:00:00'
      },
      {
        id: '2',
        content: '这是正常内容',
        expectedResult: false,
        actualResult: false,
        createdAt: '2025-10-28 10:05:00'
      }
    ]
  }, 300)
}

const runTest = () => {
  if (!testContent.value.trim()) {
    ElMessage.warning('请输入测试内容')
    return
  }
  
  isTesting.value = true
  
  setTimeout(() => {
    // 模拟规则测试
    const matched = Math.random() > 0.5
    
    testResult.value = {
      matched,
      confidence: Math.floor(Math.random() * 30) + 70,
      matchedConditions: matched ? ['条件1', '条件2'] : [],
      triggeredActions: matched ? ['拦截', '发送通知'] : [],
      executionTime: Math.floor(Math.random() * 50) + 10
    }
    
    // 添加到测试用例
    testCases.value.unshift({
      id: generateId(),
      content: testContent.value,
      expectedResult: matched,
      actualResult: matched,
      matchDetails: testResult.value.matchedConditions,
      createdAt: new Date().toLocaleString('zh-CN')
    })
    
    isTesting.value = false
    ElMessage.success('测试完成')
  }, 1000)
}

const clearTestResult = () => {
  testContent.value = ''
  testResult.value = null
}

// 版本管理方法
const handleVersion = (rule: CustomRule) => {
  selectedRule.value = rule
  showVersionDialog.value = true
  loadVersionHistory(rule.id)
}

const loadVersionHistory = (ruleId: string) => {
  // 模拟加载版本历史
  setTimeout(() => {
    versionHistory.value = [
      {
        id: '1',
        version: 3,
        changes: '更新了触发阈值和动作优先级',
        createdBy: '管理员',
        createdAt: '2025-10-28 15:30:00',
        ruleSnapshot: {}
      },
      {
        id: '2',
        version: 2,
        changes: '添加了新的检测条件',
        createdBy: '管理员',
        createdAt: '2025-10-25 10:20:00',
        ruleSnapshot: {}
      },
      {
        id: '3',
        version: 1,
        changes: '创建规则',
        createdBy: '管理员',
        createdAt: '2025-10-20 10:00:00',
        ruleSnapshot: {}
      }
    ]
  }, 300)
}

const rollbackVersion = async (version: VersionHistory) => {
  try {
    await ElMessageBox.confirm(`确定要回滚到版本 ${version.version} 吗？`, '版本回滚', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    setTimeout(() => {
      ElMessage.success(`已回滚到版本 ${version.version}`)
      showVersionDialog.value = false
      loadRules()
    }, 500)
  } catch {
    // 用户取消
  }
}

const compareVersions = (v1: number, v2: number) => {
  ElNotification({
    title: '版本对比',
    message: `正在对比版本 ${v1} 和版本 ${v2}`,
    type: 'info',
    duration: 3000
  })
}

// 工具方法
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

const getRuleTypeTag = (type: CustomRule['type']) => {
  const tags = {
    text: { label: '文本', color: '#409EFF' },
    image: { label: '图像', color: '#67C23A' },
    video: { label: '视频', color: '#E6A23C' },
    composite: { label: '复合', color: '#9C27B0' }
  }
  return tags[type]
}

const getStatusTag = (status: CustomRule['status']) => {
  const tags = {
    enabled: { label: '启用', color: 'success' },
    disabled: { label: '禁用', color: 'info' },
    testing: { label: '测试中', color: 'warning' }
  }
  return tags[status]
}

const getConditionTypeLabel = (type: RuleCondition['type']) => {
  const labels = {
    keyword: '关键词',
    regex: '正则表达式',
    image_feature: '图像特征',
    behavior_pattern: '行为模式'
  }
  return labels[type]
}

const getActionTypeLabel = (type: RuleAction['type']) => {
  const labels = {
    block: '拦截',
    warn: '警告',
    mark: '标记',
    review: '审核'
  }
  return labels[type]
}

// 初始化
loadRules()
</script>

<template>
  <div class="custom-rules-container">
    <!-- 顶部统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ ruleStats.total }}</div>
            <div class="stat-label">总规则数</div>
          </div>
          <el-icon class="stat-icon" color="#409EFF"><Document /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-value success">{{ ruleStats.enabled }}</div>
            <div class="stat-label">启用中</div>
          </div>
          <el-icon class="stat-icon" color="#67C23A"><CircleCheck /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-value warning">{{ ruleStats.testing }}</div>
            <div class="stat-label">测试中</div>
          </div>
          <el-icon class="stat-icon" color="#E6A23C"><Warning /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-value info">{{ ruleStats.disabled }}</div>
            <div class="stat-label">已禁用</div>
          </div>
          <el-icon class="stat-icon" color="#909399"><Remove /></el-icon>
        </el-card>
      </el-col>
    </el-row>

    <!-- 主要内容区 -->
    <el-card class="main-card">
      <!-- 搜索和筛选栏 -->
      <div class="filter-bar">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-input
              v-model="filters.ruleName"
              placeholder="搜索规则名称"
              clearable
              prefix-icon="Search"
            />
          </el-col>
          <el-col :span="5">
            <el-select v-model="filters.ruleType" placeholder="规则类型" clearable>
              <el-option label="文本规则" value="text" />
              <el-option label="图像规则" value="image" />
              <el-option label="视频规则" value="video" />
              <el-option label="复合规则" value="composite" />
            </el-select>
          </el-col>
          <el-col :span="5">
            <el-select v-model="filters.status" placeholder="规则状态" clearable>
              <el-option label="启用" value="enabled" />
              <el-option label="禁用" value="disabled" />
              <el-option label="测试中" value="testing" />
            </el-select>
          </el-col>
          <el-col :span="8" style="text-align: right">
            <el-button type="primary" @click="handleAdd" icon="Plus">
              新建规则
            </el-button>
            <el-button @click="loadRules" icon="Refresh">刷新</el-button>
          </el-col>
        </el-row>
      </div>

      <!-- 规则列表表格 -->
      <el-table
        :data="filteredRules"
        v-loading="loading"
        stripe
        style="width: 100%"
        :header-cell-style="{ background: '#f5f7fa' }"
      >
        <el-table-column prop="name" label="规则名称" min-width="180">
          <template #default="{ row }">
            <el-link type="primary" @click="handleEdit(row)">
              {{ row.name }}
            </el-link>
          </template>
        </el-table-column>
        
        <el-table-column prop="type" label="规则类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag
              :color="getRuleTypeTag(row.type).color"
              style="color: white; border: none"
            >
              {{ getRuleTypeTag(row.type).label }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="contentType" label="适用内容" width="120" />
        
        <el-table-column prop="priority" label="优先级" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.priority >= 8 ? 'danger' : row.priority >= 5 ? 'warning' : 'info'">
              {{ row.priority }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status).color">
              {{ getStatusTag(row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="version" label="版本" width="80" align="center">
          <template #default="{ row }">
            <el-link type="primary" @click="handleVersion(row)">
              v{{ row.version }}
            </el-link>
          </template>
        </el-table-column>
        
        <el-table-column prop="createdAt" label="创建时间" width="160" />
        
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button link type="success" size="small" @click="handleTest(row)">
              测试
            </el-button>
            <el-button link type="warning" size="small" @click="handleCopy(row)">
              复制
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新建/编辑规则对话框 -->
    <el-dialog
      v-model="showRuleDialog"
      :title="selectedRule ? '编辑规则' : '新建规则'"
      width="80%"
      :close-on-click-modal="false"
    >
      <el-tabs v-model="currentTab" type="border-card">
        <!-- 基本信息 -->
        <el-tab-pane label="基本信息" name="basic">
          <el-form
            ref="ruleFormRef"
            :model="ruleForm"
            :rules="ruleFormRules"
            label-width="120px"
          >
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="规则名称" prop="name">
                  <el-input v-model="ruleForm.name" placeholder="请输入规则名称" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="规则类型" prop="type">
                  <el-select v-model="ruleForm.type" placeholder="请选择规则类型">
                    <el-option label="文本规则" value="text" />
                    <el-option label="图像规则" value="image" />
                    <el-option label="视频规则" value="video" />
                    <el-option label="复合规则" value="composite" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="适用内容" prop="contentType">
                  <el-input v-model="ruleForm.contentType" placeholder="如：评论、帖子等" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="规则状态" prop="status">
                  <el-select v-model="ruleForm.status" placeholder="请选择状态">
                    <el-option label="启用" value="enabled" />
                    <el-option label="禁用" value="disabled" />
                    <el-option label="测试中" value="testing" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="优先级">
                  <el-slider v-model="ruleForm.priority" :min="1" :max="10" show-stops />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="生效范围">
                  <el-select
                    v-model="ruleForm.scope"
                    multiple
                    placeholder="请选择生效范围"
                    style="width: 100%"
                  >
                    <el-option label="评论" value="评论" />
                    <el-option label="帖子" value="帖子" />
                    <el-option label="私信" value="私信" />
                    <el-option label="动态" value="动态" />
                    <el-option label="直播" value="直播" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 规则条件 -->
        <el-tab-pane label="规则条件" name="conditions">
          <el-alert
            title="提示：规则条件之间的逻辑关系将按照添加顺序执行"
            type="info"
            :closable="false"
            style="margin-bottom: 20px"
          />
          
          <el-card shadow="never" style="margin-bottom: 20px">
            <template #header>
              <span>添加新条件</span>
            </template>
            <el-form :inline="true">
              <el-form-item label="条件类型">
                <el-select v-model="conditionForm.type" placeholder="选择类型">
                  <el-option label="关键词" value="keyword" />
                  <el-option label="正则表达式" value="regex" />
                  <el-option label="图像特征" value="image_feature" />
                  <el-option label="行为模式" value="behavior_pattern" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="逻辑关系">
                <el-select v-model="conditionForm.logic">
                  <el-option label="AND (与)" value="AND" />
                  <el-option label="OR (或)" value="OR" />
                  <el-option label="NOT (非)" value="NOT" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="条件值">
                <el-input
                  v-model="conditionForm.value"
                  placeholder="输入条件值"
                  style="width: 200px"
                />
              </el-form-item>
              
              <el-form-item label="阈值">
                <el-input-number
                  v-model="conditionForm.threshold"
                  :min="0"
                  :max="100"
                  style="width: 120px"
                />
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="addCondition" icon="Plus">
                  添加条件
                </el-button>
              </el-form-item>
            </el-form>
          </el-card>

          <!-- 条件列表 -->
          <el-card shadow="never">
            <template #header>
              <span>已配置条件（{{ ruleForm.conditions?.length || 0 }}）</span>
            </template>
            <div v-if="!ruleForm.conditions || ruleForm.conditions.length === 0" class="empty-state">
              <el-empty description="暂无条件，请添加" />
            </div>
            <div v-else class="conditions-list">
              <el-tag
                v-for="(condition, index) in ruleForm.conditions"
                :key="condition.id"
                size="large"
                closable
                @close="removeCondition(condition.id)"
                style="margin-right: 10px; margin-bottom: 10px"
              >
                <span v-if="index > 0" style="margin-right: 5px; font-weight: bold">
                  {{ condition.logic }}
                </span>
                {{ getConditionTypeLabel(condition.type) }}: {{ condition.value }}
                <span v-if="condition.threshold" style="margin-left: 5px">
                  ({{ condition.threshold }}%)
                </span>
              </el-tag>
            </div>
          </el-card>
        </el-tab-pane>

        <!-- 执行动作 -->
        <el-tab-pane label="执行动作" name="actions">
          <el-alert
            title="提示：当规则条件满足时，将按优先级顺序执行以下动作"
            type="info"
            :closable="false"
            style="margin-bottom: 20px"
          />
          
          <el-card shadow="never" style="margin-bottom: 20px">
            <template #header>
              <span>添加新动作</span>
            </template>
            <el-form label-width="100px">
              <el-form-item label="动作类型">
                <el-select v-model="actionForm.type" placeholder="选择动作类型">
                  <el-option label="拦截" value="block" />
                  <el-option label="警告" value="warn" />
                  <el-option label="标记" value="mark" />
                  <el-option label="审核" value="review" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="优先级">
                <el-input-number v-model="actionForm.priority" :min="1" :max="10" />
              </el-form-item>
              
              <el-form-item label="提示消息">
                <el-input
                  v-model="actionForm.message"
                  type="textarea"
                  :rows="2"
                  placeholder="输入提示消息"
                />
              </el-form-item>
              
              <el-form-item label="通知用户" v-if="actionForm.type === 'review'">
                <el-select
                  v-model="actionForm.notifyUsers"
                  multiple
                  placeholder="选择通知用户"
                  style="width: 100%"
                >
                  <el-option label="管理员" value="admin" />
                  <el-option label="审核员" value="moderator" />
                  <el-option label="超级管理员" value="superadmin" />
                </el-select>
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="addAction" icon="Plus">
                  添加动作
                </el-button>
              </el-form-item>
            </el-form>
          </el-card>

          <!-- 动作列表 -->
          <el-card shadow="never">
            <template #header>
              <span>已配置动作（{{ ruleForm.actions?.length || 0 }}）</span>
            </template>
            <div v-if="!ruleForm.actions || ruleForm.actions.length === 0" class="empty-state">
              <el-empty description="暂无动作，请添加" />
            </div>
            <el-collapse v-else>
              <el-collapse-item
                v-for="action in ruleForm.actions"
                :key="action.id"
                :name="action.id"
              >
                <template #title>
                  <el-tag :type="action.type === 'block' ? 'danger' : action.type === 'warn' ? 'warning' : 'info'">
                    {{ getActionTypeLabel(action.type) }}
                  </el-tag>
                  <span style="margin-left: 10px">优先级: {{ action.priority }}</span>
                  <el-button
                    link
                    type="danger"
                    size="small"
                    style="margin-left: auto"
                    @click.stop="removeAction(action.id)"
                    icon="Delete"
                  >
                    删除
                  </el-button>
                </template>
                <div>
                  <p v-if="action.message"><strong>提示消息：</strong>{{ action.message }}</p>
                  <p v-if="action.notifyUsers && action.notifyUsers.length > 0">
                    <strong>通知用户：</strong>{{ action.notifyUsers.join(', ') }}
                  </p>
                </div>
              </el-collapse-item>
            </el-collapse>
          </el-card>
        </el-tab-pane>

        <!-- 高级设置 -->
        <el-tab-pane label="高级设置" name="advanced">
          <el-form label-width="120px">
            <el-form-item label="生效时间">
              <el-date-picker
                v-model="ruleForm.effectiveTime"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                style="width: 100%"
              />
            </el-form-item>
            
            <el-form-item label="冲突解决策略">
              <el-radio-group v-model="ruleForm.conflictResolution">
                <el-radio value="priority">按优先级</el-radio>
                <el-radio value="first">首次匹配</el-radio>
                <el-radio value="all">全部执行</el-radio>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item label="规则描述">
              <el-input
                v-model="ruleForm.description"
                type="textarea"
                :rows="4"
                placeholder="输入规则的详细描述"
              />
            </el-form-item>
            
            <el-form-item label="标签">
              <el-select
                v-model="ruleForm.tags"
                multiple
                filterable
                allow-create
                placeholder="输入或选择标签"
                style="width: 100%"
              >
                <el-option label="敏感内容" value="敏感内容" />
                <el-option label="垃圾信息" value="垃圾信息" />
                <el-option label="广告营销" value="广告营销" />
                <el-option label="高风险" value="高风险" />
              </el-select>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <el-button @click="showRuleDialog = false">取消</el-button>
        <el-button type="primary" @click="saveRule" :loading="loading">
          保存规则
        </el-button>
      </template>
    </el-dialog>

    <!-- 规则测试对话框 -->
    <el-dialog
      v-model="showTestDialog"
      title="规则测试验证"
      width="70%"
      :close-on-click-modal="false"
    >
      <el-row :gutter="20">
        <!-- 左侧：测试输入 -->
        <el-col :span="12">
          <el-card shadow="never">
            <template #header>
              <span>测试内容</span>
            </template>
            <el-input
              v-model="testContent"
              type="textarea"
              :rows="10"
              placeholder="输入要测试的内容..."
            />
            <div style="margin-top: 15px">
              <el-button
                type="primary"
                @click="runTest"
                :loading="isTesting"
                icon="VideoPlay"
                style="width: 100%"
              >
                运行测试
              </el-button>
            </div>
          </el-card>

          <!-- 测试结果 -->
          <el-card shadow="never" style="margin-top: 20px" v-if="testResult">
            <template #header>
              <span>测试结果</span>
              <el-button
                link
                type="primary"
                size="small"
                style="float: right"
                @click="clearTestResult"
              >
                清除
              </el-button>
            </template>
            <el-result
              :icon="testResult.matched ? 'warning' : 'success'"
              :title="testResult.matched ? '规则命中' : '规则未命中'"
            >
              <template #sub-title>
                <div class="test-result-details">
                  <p><strong>置信度：</strong>{{ testResult.confidence }}%</p>
                  <p v-if="testResult.matchedConditions.length > 0">
                    <strong>匹配条件：</strong>
                    {{ testResult.matchedConditions.join(', ') }}
                  </p>
                  <p v-if="testResult.triggeredActions.length > 0">
                    <strong>触发动作：</strong>
                    {{ testResult.triggeredActions.join(', ') }}
                  </p>
                  <p><strong>执行时间：</strong>{{ testResult.executionTime }}ms</p>
                </div>
              </template>
            </el-result>
          </el-card>
        </el-col>

        <!-- 右侧：测试历史 -->
        <el-col :span="12">
          <el-card shadow="never">
            <template #header>
              <span>测试用例历史</span>
            </template>
            <el-timeline>
              <el-timeline-item
                v-for="testCase in testCases"
                :key="testCase.id"
                :timestamp="testCase.createdAt"
                placement="top"
              >
                <el-card>
                  <p>{{ testCase.content }}</p>
                  <div style="margin-top: 10px">
                    <el-tag
                      :type="testCase.actualResult ? 'warning' : 'success'"
                      size="small"
                    >
                      {{ testCase.actualResult ? '命中' : '未命中' }}
                    </el-tag>
                    <span
                      v-if="testCase.matchDetails && testCase.matchDetails.length > 0"
                      style="margin-left: 10px; font-size: 12px; color: #909399"
                    >
                      匹配: {{ testCase.matchDetails.join(', ') }}
                    </span>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </el-card>
        </el-col>
      </el-row>
    </el-dialog>

    <!-- 版本历史对话框 -->
    <el-dialog
      v-model="showVersionDialog"
      title="规则版本历史"
      width="60%"
      :close-on-click-modal="false"
    >
      <el-timeline>
        <el-timeline-item
          v-for="version in versionHistory"
          :key="version.id"
          :timestamp="version.createdAt"
          placement="top"
        >
          <el-card>
            <div class="version-header">
              <el-tag type="primary">版本 {{ version.version }}</el-tag>
              <span style="margin-left: 10px; color: #909399">
                by {{ version.createdBy }}
              </span>
              <div style="float: right">
                <el-button
                  link
                  type="primary"
                  size="small"
                  @click="compareVersions(version.version, version.version - 1)"
                  v-if="version.version > 1"
                >
                  对比
                </el-button>
                <el-button
                  link
                  type="warning"
                  size="small"
                  @click="rollbackVersion(version)"
                  v-if="version.version < versionHistory[0].version"
                >
                  回滚
                </el-button>
              </div>
            </div>
            <p style="margin-top: 10px">{{ version.changes }}</p>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.custom-rules-container {
  min-height: calc(100vh - 120px);
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  position: relative;
  overflow: hidden;
  
  .stat-content {
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #303133;
      line-height: 1;
      
      &.success {
        color: #67C23A;
      }
      
      &.warning {
        color: #E6A23C;
      }
      
      &.info {
        color: #909399;
      }
    }
    
    .stat-label {
      font-size: 14px;
      color: #909399;
      margin-top: 8px;
    }
  }
  
  .stat-icon {
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 48px;
    opacity: 0.3;
  }
}

.main-card {
  .filter-bar {
    margin-bottom: 20px;
  }
}

.empty-state {
  padding: 40px 0;
  text-align: center;
}

.conditions-list {
  min-height: 100px;
}

.test-result-details {
  text-align: left;
  
  p {
    margin: 8px 0;
    color: #606266;
  }
}

.version-header {
  display: flex;
  align-items: center;
}

:deep(.el-card__body) {
  position: relative;
}

:deep(.el-table) {
  font-size: 14px;
}

:deep(.el-dialog__body) {
  padding: 20px;
}

:deep(.el-tabs--border-card) {
  box-shadow: none;
  border: 1px solid #dcdfe6;
}

:deep(.el-timeline-item__timestamp) {
  color: #909399;
  font-size: 13px;
}
</style>