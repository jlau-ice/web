<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'

// 类型定义
interface Template {
  id: string
  name: string
  category: string
  description: string
  features: string[]
  usageCount: number
  status: 'recommended' | 'hot' | 'new' | 'normal'
  thumbnail: string
  apiCount: number
  difficulty: string
  tags: string[]
}

interface ApiInterface {
  id: string
  name: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  description: string
  parameters: { name: string; type: string; required: boolean; description: string }[]
  response: string
}

interface CustomConfig {
  dataFields: { name: string; type: string; required: boolean }[]
  businessFlow: { step: number; name: string; description: string }[]
  permissions: string[]
}

interface DevTask {
  id: string
  name: string
  status: 'pending' | 'inprogress' | 'testing' | 'completed'
  progress: number
  assignee: string
  dueDate: string
}

// 分类列表
const categories = [
  { value: 'all', label: '全部模板', icon: '📚', count: 12 },
  { value: 'agriculture', label: '农产品溯源', icon: '🌾', count: 3 },
  { value: 'finance', label: '供应链金融', icon: '💰', count: 4 },
  { value: 'quality', label: '质量监管', icon: '✅', count: 3 },
  { value: 'logistics', label: '物流跟踪', icon: '🚚', count: 2 }
]

// 选中的分类
const selectedCategory = ref('all')

// 搜索关键词
const searchKeyword = ref('')

// 模板列表
const templates = ref<Template[]>([
  {
    id: '1',
    name: '农产品全链路溯源',
    category: 'agriculture',
    description: '从种植、加工到销售全流程的农产品溯源解决方案',
    features: ['种植环境监测', '生产过程记录', '物流追踪', '消费者查询'],
    usageCount: 1286,
    status: 'hot',
    thumbnail: '🌾',
    apiCount: 15,
    difficulty: '中等',
    tags: ['溯源', '农业', '监管']
  },
  {
    id: '2',
    name: '有机蔬菜认证溯源',
    category: 'agriculture',
    description: '针对有机蔬菜的认证和溯源管理系统',
    features: ['有机认证管理', '种植档案', '检测报告', '溯源码生成'],
    usageCount: 856,
    status: 'recommended',
    thumbnail: '🥬',
    apiCount: 12,
    difficulty: '简单',
    tags: ['有机', '认证', '蔬菜']
  },
  {
    id: '3',
    name: '畜牧产品追溯',
    category: 'agriculture',
    description: '畜牧养殖、屠宰、加工全流程追溯系统',
    features: ['养殖档案', '防疫记录', '屠宰监管', '冷链追踪'],
    usageCount: 634,
    status: 'normal',
    thumbnail: '🐄',
    apiCount: 14,
    difficulty: '中等',
    tags: ['畜牧', '养殖', '追溯']
  },
  {
    id: '4',
    name: '供应链融资平台',
    category: 'finance',
    description: '基于区块链的供应链金融服务平台',
    features: ['应收账款融资', '信用评估', '智能合约', '风险控制'],
    usageCount: 2145,
    status: 'hot',
    thumbnail: '💰',
    apiCount: 20,
    difficulty: '复杂',
    tags: ['金融', '融资', '风控']
  },
  {
    id: '5',
    name: '仓单质押融资',
    category: 'finance',
    description: '大宗商品仓单质押融资管理系统',
    features: ['仓单管理', '质押融资', '价格监控', '风险预警'],
    usageCount: 1523,
    status: 'recommended',
    thumbnail: '📦',
    apiCount: 18,
    difficulty: '中等',
    tags: ['质押', '仓单', '大宗']
  },
  {
    id: '6',
    name: '订单融资系统',
    category: 'finance',
    description: '基于真实订单的融资服务平台',
    features: ['订单验证', '融资申请', '资金管理', '还款监控'],
    usageCount: 1789,
    status: 'new',
    thumbnail: '📋',
    apiCount: 16,
    difficulty: '中等',
    tags: ['订单', '融资', '验证']
  },
  {
    id: '7',
    name: '供应商信用管理',
    category: 'finance',
    description: '供应商信用评估和管理系统',
    features: ['信用评级', '交易记录', '履约监控', '信用报告'],
    usageCount: 1234,
    status: 'normal',
    thumbnail: '⭐',
    apiCount: 13,
    difficulty: '简单',
    tags: ['信用', '供应商', '评估']
  },
  {
    id: '8',
    name: '食品安全监管',
    category: 'quality',
    description: '食品生产和流通全流程安全监管系统',
    features: ['生产监控', '质量检测', '问题追溯', '应急处理'],
    usageCount: 1678,
    status: 'hot',
    thumbnail: '🍽️',
    apiCount: 17,
    difficulty: '中等',
    tags: ['食品', '安全', '监管']
  },
  {
    id: '9',
    name: '药品质量追溯',
    category: 'quality',
    description: '药品生产、流通、使用全流程质量追溯',
    features: ['生产批次管理', '流通监控', '不良反应追踪', '召回管理'],
    usageCount: 1456,
    status: 'recommended',
    thumbnail: '💊',
    apiCount: 19,
    difficulty: '复杂',
    tags: ['药品', '质量', '追溯']
  },
  {
    id: '10',
    name: '产品质量认证',
    category: 'quality',
    description: '产品质量认证和管理平台',
    features: ['认证申请', '检测管理', '证书颁发', '持续监督'],
    usageCount: 987,
    status: 'normal',
    thumbnail: '🏆',
    apiCount: 11,
    difficulty: '简单',
    tags: ['认证', '质量', '检测']
  },
  {
    id: '11',
    name: '冷链物流监控',
    category: 'logistics',
    description: '冷链运输全程温度和位置监控系统',
    features: ['温度监控', '位置追踪', '预警提醒', '数据分析'],
    usageCount: 1834,
    status: 'hot',
    thumbnail: '🚚',
    apiCount: 16,
    difficulty: '中等',
    tags: ['冷链', '物流', '监控']
  },
  {
    id: '12',
    name: '跨境物流追踪',
    category: 'logistics',
    description: '跨境物流全流程追踪和管理系统',
    features: ['多国物流对接', '关税管理', '清关追踪', '时效监控'],
    usageCount: 1245,
    status: 'new',
    thumbnail: '✈️',
    apiCount: 22,
    difficulty: '复杂',
    tags: ['跨境', '物流', '追踪']
  }
])

// 选中的模板
const selectedTemplate = ref<Template | null>(null)

// 显示详情对话框
const showDetailDialog = ref(false)

// 显示API对话框
const showApiDialog = ref(false)

// 显示定制对话框
const showCustomDialog = ref(false)

// API接口列表
const apiInterfaces = ref<ApiInterface[]>([])

// 定制配置
const customConfig = reactive<CustomConfig>({
  dataFields: [],
  businessFlow: [],
  permissions: []
})

// 开发任务
const devTasks = ref<DevTask[]>([])

// 显示开发进度对话框
const showProgressDialog = ref(false)

// 当前标签页
const activeTab = ref('overview')

// 过滤后的模板列表
const filteredTemplates = computed(() => {
  let result = templates.value

  // 按分类过滤
  if (selectedCategory.value !== 'all') {
    result = result.filter(t => t.category === selectedCategory.value)
  }

  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(t => 
      t.name.toLowerCase().includes(keyword) ||
      t.description.toLowerCase().includes(keyword) ||
      t.tags.some(tag => tag.toLowerCase().includes(keyword))
    )
  }

  return result
})

// 切换分类
const selectCategory = (category: string) => {
  selectedCategory.value = category
}

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  const map: Record<string, any> = {
    recommended: 'warning',
    hot: 'danger',
    new: 'success',
    normal: 'info'
  }
  return map[status] || 'info'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    recommended: '推荐',
    hot: '热门',
    new: '新品',
    normal: '常规'
  }
  return map[status] || '常规'
}

// 查看模板详情
const viewTemplateDetail = async (template: Template) => {
  selectedTemplate.value = template
  showDetailDialog.value = true
  
  // 模拟加载API接口数据
  await loadApiInterfaces(template.id)
}

// 加载API接口
const loadApiInterfaces = async (templateId: string) => {
  // 模拟异步加载
  await sleep(500)
  
  apiInterfaces.value = [
    {
      id: '1',
      name: '创建溯源记录',
      method: 'POST',
      path: '/api/trace/create',
      description: '创建新的产品溯源记录',
      parameters: [
        { name: 'productId', type: 'string', required: true, description: '产品ID' },
        { name: 'productName', type: 'string', required: true, description: '产品名称' },
        { name: 'batchNo', type: 'string', required: true, description: '批次号' },
        { name: 'location', type: 'string', required: false, description: '生产地点' }
      ],
      response: '{ "code": 200, "data": { "traceId": "xxx" } }'
    },
    {
      id: '2',
      name: '查询溯源信息',
      method: 'GET',
      path: '/api/trace/query',
      description: '根据追溯码查询产品溯源信息',
      parameters: [
        { name: 'traceCode', type: 'string', required: true, description: '追溯码' }
      ],
      response: '{ "code": 200, "data": { "product": {...}, "history": [...] } }'
    },
    {
      id: '3',
      name: '更新溯源节点',
      method: 'PUT',
      path: '/api/trace/update',
      description: '更新溯源链上的节点信息',
      parameters: [
        { name: 'traceId', type: 'string', required: true, description: '溯源ID' },
        { name: 'nodeType', type: 'string', required: true, description: '节点类型' },
        { name: 'data', type: 'object', required: true, description: '节点数据' }
      ],
      response: '{ "code": 200, "message": "success" }'
    },
    {
      id: '4',
      name: '生成溯源码',
      method: 'POST',
      path: '/api/trace/generate',
      description: '为产品生成唯一的溯源二维码',
      parameters: [
        { name: 'productId', type: 'string', required: true, description: '产品ID' },
        { name: 'quantity', type: 'number', required: true, description: '数量' }
      ],
      response: '{ "code": 200, "data": { "codes": ["xxx", "yyy"] } }'
    },
    {
      id: '5',
      name: '获取溯源统计',
      method: 'GET',
      path: '/api/trace/statistics',
      description: '获取溯源数据统计信息',
      parameters: [
        { name: 'startDate', type: 'string', required: false, description: '开始日期' },
        { name: 'endDate', type: 'string', required: false, description: '结束日期' }
      ],
      response: '{ "code": 200, "data": { "total": 100, "scanned": 80 } }'
    }
  ]
}

// 开始定制开发
const startCustomize = (template: Template) => {
  selectedTemplate.value = template
  showCustomDialog.value = true
  
  // 初始化定制配置
  customConfig.dataFields = [
    { name: 'productName', type: 'string', required: true },
    { name: 'productCode', type: 'string', required: true },
    { name: 'batchNumber', type: 'string', required: true }
  ]
  
  customConfig.businessFlow = [
    { step: 1, name: '生产记录', description: '记录产品生产信息' },
    { step: 2, name: '质量检测', description: '进行产品质量检测' },
    { step: 3, name: '入库登记', description: '产品入库信息登记' },
    { step: 4, name: '出库配送', description: '产品出库和配送' }
  ]
  
  customConfig.permissions = ['创建', '查询', '更新', '删除']
}

// 保存定制配置
const saveCustomConfig = () => {
  ElMessage.success('定制配置已保存')
  showCustomDialog.value = false
  
  // 自动跳转到开发进度
  setTimeout(() => {
    viewDevProgress()
  }, 500)
}

// 添加数据字段
const addDataField = () => {
  customConfig.dataFields.push({
    name: '',
    type: 'string',
    required: false
  })
}

// 删除数据字段
const removeDataField = (index: number) => {
  customConfig.dataFields.splice(index, 1)
}

// 添加业务流程
const addBusinessFlow = () => {
  customConfig.businessFlow.push({
    step: customConfig.businessFlow.length + 1,
    name: '',
    description: ''
  })
}

// 删除业务流程
const removeBusinessFlow = (index: number) => {
  customConfig.businessFlow.splice(index, 1)
  // 重新排序
  customConfig.businessFlow.forEach((flow, idx) => {
    flow.step = idx + 1
  })
}

// 查看API管理
const viewApiManagement = async (template: Template) => {
  selectedTemplate.value = template
  showApiDialog.value = true
  await loadApiInterfaces(template.id)
}

// 测试API接口
const testApi = (api: ApiInterface) => {
  ElMessage.info(`正在测试接口: ${api.name}`)
  
  setTimeout(() => {
    ElNotification.success({
      title: '接口测试成功',
      message: `${api.name} 响应正常`,
      duration: 3000
    })
  }, 1000)
}

// 复制API文档
const copyApiDoc = (api: ApiInterface) => {
  const doc = `
接口名称: ${api.name}
请求方法: ${api.method}
请求路径: ${api.path}
接口描述: ${api.description}

请求参数:
${api.parameters.map(p => `  - ${p.name} (${p.type}) ${p.required ? '[必填]' : '[可选]'}: ${p.description}`).join('\n')}

响应示例:
${api.response}
  `.trim()
  
  navigator.clipboard.writeText(doc).then(() => {
    ElMessage.success('API文档已复制到剪贴板')
  })
}

// 查看开发进度
const viewDevProgress = () => {
  showProgressDialog.value = true
  loadDevTasks()
}

// 加载开发任务
const loadDevTasks = async () => {
  await sleep(500)
  
  devTasks.value = [
    {
      id: '1',
      name: '数据库设计',
      status: 'completed',
      progress: 100,
      assignee: '张三',
      dueDate: '2024-01-15'
    },
    {
      id: '2',
      name: 'API接口开发',
      status: 'inprogress',
      progress: 65,
      assignee: '李四',
      dueDate: '2024-01-20'
    },
    {
      id: '3',
      name: '前端页面开发',
      status: 'inprogress',
      progress: 45,
      assignee: '王五',
      dueDate: '2024-01-22'
    },
    {
      id: '4',
      name: '功能测试',
      status: 'testing',
      progress: 30,
      assignee: '赵六',
      dueDate: '2024-01-25'
    },
    {
      id: '5',
      name: '性能优化',
      status: 'pending',
      progress: 0,
      assignee: '未分配',
      dueDate: '2024-01-28'
    },
    {
      id: '6',
      name: '上线部署',
      status: 'pending',
      progress: 0,
      assignee: '未分配',
      dueDate: '2024-01-30'
    }
  ]
}

// 获取任务状态标签类型
const getTaskStatusType = (status: string) => {
  const map: Record<string, any> = {
    pending: 'info',
    inprogress: 'primary',
    testing: 'warning',
    completed: 'success'
  }
  return map[status] || 'info'
}

// 获取任务状态文本
const getTaskStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '未开始',
    inprogress: '进行中',
    testing: '测试中',
    completed: '已完成'
  }
  return map[status] || '未知'
}

// 更新任务状态
const updateTaskStatus = (task: DevTask, newStatus: string) => {
  task.status = newStatus as any
  ElMessage.success('任务状态已更新')
}

// 使用模板
const useTemplate = (template: Template) => {
  ElNotification.success({
    title: '开始使用模板',
    message: `正在基于"${template.name}"创建新应用...`,
    duration: 3000
  })
  
  setTimeout(() => {
    startCustomize(template)
  }, 1000)
}

// 睡眠函数
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// 获取HTTP方法标签类型
const getMethodTagType = (method: string) => {
  const map: Record<string, any> = {
    GET: 'success',
    POST: 'primary',
    PUT: 'warning',
    DELETE: 'danger'
  }
  return map[method] || 'info'
}

// 计算开发总进度
const totalProgress = computed(() => {
  if (devTasks.value.length === 0) return 0
  const total = devTasks.value.reduce((sum, task) => sum + task.progress, 0)
  return Math.round(total / devTasks.value.length)
})
</script>

<template>
  <div class="app-templates">
    <el-row :gutter="20">
      <!-- 左侧分类导航 -->
      <el-col :span="4">
        <el-card class="category-card">
          <template #header>
            <span class="category-title">模板分类</span>
          </template>
          <div class="category-list">
            <div
              v-for="category in categories"
              :key="category.value"
              class="category-item"
              :class="{ active: selectedCategory === category.value }"
              @click="selectCategory(category.value)"
            >
              <span class="category-icon">{{ category.icon }}</span>
              <div class="category-info">
                <div class="category-name">{{ category.label }}</div>
                <div class="category-count">{{ category.count }} 个模板</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 中间模板展示区 -->
      <el-col :span="14">
        <!-- 搜索栏 -->
        <div class="search-bar">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索模板名称、标签或描述..."
            clearable
            size="large"
          >
            <template #prefix>
              <span>🔍</span>
            </template>
          </el-input>
        </div>

        <!-- 模板列表 -->
        <div class="template-list">
          <el-row :gutter="20">
            <el-col
              v-for="template in filteredTemplates"
              :key="template.id"
              :span="12"
            >
              <el-card class="template-card" shadow="hover">
                <div class="template-header">
                  <div class="template-icon">{{ template.thumbnail }}</div>
                  <el-tag
                    :type="getStatusTagType(template.status)"
                    size="small"
                  >
                    {{ getStatusText(template.status) }}
                  </el-tag>
                </div>
                <h3 class="template-name">{{ template.name }}</h3>
                <p class="template-description">{{ template.description }}</p>
                
                <div class="template-tags">
                  <el-tag
                    v-for="tag in template.tags"
                    :key="tag"
                    size="small"
                    type="info"
                    effect="plain"
                  >
                    {{ tag }}
                  </el-tag>
                </div>

                <div class="template-meta">
                  <span>📊 使用 {{ template.usageCount }} 次</span>
                  <span>🔌 {{ template.apiCount }} 个API</span>
                  <span>📈 {{ template.difficulty }}</span>
                </div>

                <div class="template-actions">
                  <el-button type="primary" size="small" @click="useTemplate(template)">
                    立即使用
                  </el-button>
                  <el-button size="small" @click="viewTemplateDetail(template)">
                    查看详情
                  </el-button>
                  <el-button size="small" @click="viewApiManagement(template)">
                    API管理
                  </el-button>
                </div>
              </el-card>
            </el-col>
          </el-row>

          <el-empty
            v-if="filteredTemplates.length === 0"
            description="没有找到匹配的模板"
          />
        </div>
      </el-col>

      <!-- 右侧定制开发面板 -->
      <el-col :span="6">
        <el-card class="quick-panel">
          <template #header>
            <span>快速操作</span>
          </template>
          
          <div class="quick-actions">
            <el-button type="primary" style="width: 100%" @click="viewDevProgress">
              📊 查看开发进度
            </el-button>
            <el-button style="width: 100%">
              📝 我的定制项目
            </el-button>
            <el-button style="width: 100%">
              📚 开发文档
            </el-button>
            <el-button style="width: 100%">
              💬 技术支持
            </el-button>
          </div>

          <el-divider />

          <div class="statistics">
            <h4>平台统计</h4>
            <el-descriptions :column="1" size="small">
              <el-descriptions-item label="模板总数">
                {{ templates.length }}
              </el-descriptions-item>
              <el-descriptions-item label="总使用次数">
                {{ templates.reduce((sum, t) => sum + t.usageCount, 0) }}
              </el-descriptions-item>
              <el-descriptions-item label="API接口数">
                {{ templates.reduce((sum, t) => sum + t.apiCount, 0) }}
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <el-divider />

          <div class="hot-templates">
            <h4>🔥 热门模板</h4>
            <div
              v-for="template in templates.filter(t => t.status === 'hot').slice(0, 3)"
              :key="template.id"
              class="hot-item"
              @click="viewTemplateDetail(template)"
            >
              <span class="hot-icon">{{ template.thumbnail }}</span>
              <span class="hot-name">{{ template.name }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 模板详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      :title="selectedTemplate?.name"
      width="900px"
      top="5vh"
    >
      <el-tabs v-model="activeTab">
        <!-- 概览 -->
        <el-tab-pane label="概览" name="overview">
          <div class="detail-overview">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="模板分类">
                {{ categories.find(c => c.value === selectedTemplate?.category)?.label }}
              </el-descriptions-item>
              <el-descriptions-item label="难度等级">
                {{ selectedTemplate?.difficulty }}
              </el-descriptions-item>
              <el-descriptions-item label="使用次数">
                {{ selectedTemplate?.usageCount }}
              </el-descriptions-item>
              <el-descriptions-item label="API数量">
                {{ selectedTemplate?.apiCount }}
              </el-descriptions-item>
              <el-descriptions-item label="模板标签" :span="2">
                <el-tag
                  v-for="tag in selectedTemplate?.tags"
                  :key="tag"
                  size="small"
                  style="margin-right: 5px"
                >
                  {{ tag }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>

            <h4 style="margin-top: 20px">功能特点</h4>
            <ul class="features-list">
              <li v-for="feature in selectedTemplate?.features" :key="feature">
                ✅ {{ feature }}
              </li>
            </ul>

            <el-alert
              title="技术要求"
              type="info"
              :closable="false"
              style="margin-top: 20px"
            >
              <ul>
                <li>区块链平台: Hyperledger Fabric 2.4+</li>
                <li>开发语言: Node.js / Go / Java</li>
                <li>数据库: MongoDB / PostgreSQL</li>
                <li>前端框架: Vue 3 / React</li>
              </ul>
            </el-alert>
          </div>
        </el-tab-pane>

        <!-- 接口文档 -->
        <el-tab-pane label="接口文档" name="api">
          <div class="api-list">
            <el-collapse>
              <el-collapse-item
                v-for="api in apiInterfaces"
                :key="api.id"
                :name="api.id"
              >
                <template #title>
                  <div class="api-title">
                    <el-tag :type="getMethodTagType(api.method)" size="small">
                      {{ api.method }}
                    </el-tag>
                    <span class="api-name">{{ api.name }}</span>
                  </div>
                </template>
                <div class="api-detail">
                  <p><strong>路径:</strong> {{ api.path }}</p>
                  <p><strong>描述:</strong> {{ api.description }}</p>
                  
                  <h5>请求参数:</h5>
                  <el-table :data="api.parameters" size="small" border>
                    <el-table-column prop="name" label="参数名" width="120" />
                    <el-table-column prop="type" label="类型" width="100" />
                    <el-table-column prop="required" label="必填" width="80">
                      <template #default="{ row }">
                        <el-tag :type="row.required ? 'danger' : 'info'" size="small">
                          {{ row.required ? '是' : '否' }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="description" label="说明" />
                  </el-table>

                  <h5 style="margin-top: 15px">响应示例:</h5>
                  <pre class="response-example">{{ api.response }}</pre>

                  <div style="margin-top: 15px">
                    <el-button type="primary" size="small" @click="testApi(api)">
                      测试接口
                    </el-button>
                    <el-button size="small" @click="copyApiDoc(api)">
                      复制文档
                    </el-button>
                  </div>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
        </el-tab-pane>

        <!-- 在线演示 -->
        <el-tab-pane label="在线演示" name="demo">
          <div class="demo-section">
            <el-alert
              title="演示环境"
              type="success"
              :closable="false"
              style="margin-bottom: 20px"
            >
              这是一个完整的在线演示环境，您可以体验模板的所有功能
            </el-alert>

            <div class="demo-preview">
              <div class="demo-placeholder">
                <div class="demo-icon">🎬</div>
                <h3>在线演示界面</h3>
                <p>点击下方按钮启动演示环境</p>
                <el-button type="primary" size="large">
                  启动演示
                </el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
        <el-button 
          v-if="selectedTemplate"
          type="primary" 
          @click="useTemplate(selectedTemplate)"
        >
          使用此模板
        </el-button>
      </template>
    </el-dialog>

    <!-- API管理对话框 -->
    <el-dialog
      v-model="showApiDialog"
      title="API接口管理"
      width="1000px"
    >
      <el-table :data="apiInterfaces" border>
        <el-table-column prop="name" label="接口名称" width="180" />
        <el-table-column prop="method" label="方法" width="80">
          <template #default="{ row }">
            <el-tag :type="getMethodTagType(row.method)" size="small">
              {{ row.method }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路径" width="200" />
        <el-table-column prop="description" label="描述" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="testApi(row)">
              测试
            </el-button>
            <el-button size="small" @click="copyApiDoc(row)">
              文档
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 定制开发对话框 -->
    <el-dialog
      v-model="showCustomDialog"
      title="快速定制开发"
      width="1000px"
      top="5vh"
    >
      <el-alert
        title="配置向导"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      >
        根据您的业务需求，配置数据字段和业务流程
      </el-alert>

      <el-tabs>
        <!-- 数据字段配置 -->
        <el-tab-pane label="数据字段配置">
          <div class="config-section">
            <el-button type="primary" size="small" @click="addDataField" style="margin-bottom: 15px">
              添加字段
            </el-button>
            
            <el-table :data="customConfig.dataFields" border>
              <el-table-column label="字段名称" width="200">
                <template #default="{ row }">
                  <el-input v-model="row.name" placeholder="请输入字段名" size="small" />
                </template>
              </el-table-column>
              <el-table-column label="字段类型" width="150">
                <template #default="{ row }">
                  <el-select v-model="row.type" size="small">
                    <el-option label="字符串" value="string" />
                    <el-option label="数字" value="number" />
                    <el-option label="日期" value="date" />
                    <el-option label="布尔" value="boolean" />
                    <el-option label="对象" value="object" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="是否必填" width="120">
                <template #default="{ row }">
                  <el-switch v-model="row.required" />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100">
                <template #default="{ $index }">
                  <el-button
                    type="danger"
                    size="small"
                    text
                    @click="removeDataField($index)"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <!-- 业务流程配置 -->
        <el-tab-pane label="业务流程配置">
          <div class="config-section">
            <el-button type="primary" size="small" @click="addBusinessFlow" style="margin-bottom: 15px">
              添加流程
            </el-button>
            
            <el-steps direction="vertical" :active="customConfig.businessFlow.length">
              <el-step
                v-for="(flow, index) in customConfig.businessFlow"
                :key="index"
              >
                <template #title>
                  <el-input
                    v-model="flow.name"
                    placeholder="流程名称"
                    size="small"
                    style="width: 200px"
                  />
                </template>
                <template #description>
                  <div class="flow-config">
                    <el-input
                      v-model="flow.description"
                      placeholder="流程描述"
                      size="small"
                      style="width: 300px; margin-right: 10px"
                    />
                    <el-button
                      type="danger"
                      size="small"
                      text
                      @click="removeBusinessFlow(index)"
                    >
                      删除
                    </el-button>
                  </div>
                </template>
              </el-step>
            </el-steps>
          </div>
        </el-tab-pane>

        <!-- 权限配置 -->
        <el-tab-pane label="权限配置">
          <div class="config-section">
            <el-checkbox-group v-model="customConfig.permissions">
              <el-checkbox label="创建">创建权限</el-checkbox>
              <el-checkbox label="查询">查询权限</el-checkbox>
              <el-checkbox label="更新">更新权限</el-checkbox>
              <el-checkbox label="删除">删除权限</el-checkbox>
              <el-checkbox label="导出">导出权限</el-checkbox>
              <el-checkbox label="审核">审核权限</el-checkbox>
              <el-checkbox label="统计">统计权限</el-checkbox>
            </el-checkbox-group>
          </div>
        </el-tab-pane>

        <!-- 预览效果 -->
        <el-tab-pane label="预览效果">
          <div class="preview-section">
            <el-alert
              title="配置预览"
              type="success"
              :closable="false"
              style="margin-bottom: 20px"
            >
              以下是您的定制配置预览
            </el-alert>

            <h4>数据字段 ({{ customConfig.dataFields.length }}个)</h4>
            <ul>
              <li v-for="field in customConfig.dataFields" :key="field.name">
                {{ field.name }} ({{ field.type }}) {{ field.required ? '[必填]' : '[可选]' }}
              </li>
            </ul>

            <h4 style="margin-top: 20px">业务流程 ({{ customConfig.businessFlow.length }}步)</h4>
            <ul>
              <li v-for="flow in customConfig.businessFlow" :key="flow.step">
                步骤{{ flow.step }}: {{ flow.name }} - {{ flow.description }}
              </li>
            </ul>

            <h4 style="margin-top: 20px">权限配置</h4>
            <div>
              <el-tag
                v-for="perm in customConfig.permissions"
                :key="perm"
                style="margin-right: 5px"
              >
                {{ perm }}
              </el-tag>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <el-button @click="showCustomDialog = false">取消</el-button>
        <el-button type="primary" @click="saveCustomConfig">
          保存并开始开发
        </el-button>
      </template>
    </el-dialog>

    <!-- 开发进度对话框 -->
    <el-dialog
      v-model="showProgressDialog"
      title="开发进度跟踪"
      width="1000px"
    >
      <el-alert
        :title="`总体进度: ${totalProgress}%`"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      >
        <el-progress :percentage="totalProgress" />
      </el-alert>

      <el-table :data="devTasks" border>
        <el-table-column prop="name" label="任务名称" width="200" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getTaskStatusType(row.status)">
              {{ getTaskStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="progress" label="进度" width="200">
          <template #default="{ row }">
            <el-progress
              :percentage="row.progress"
              :status="row.status === 'completed' ? 'success' : undefined"
            />
          </template>
        </el-table-column>
        <el-table-column prop="assignee" label="负责人" width="120" />
        <el-table-column prop="dueDate" label="截止日期" width="120" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-dropdown @command="(cmd) => updateTaskStatus(row, cmd)">
              <el-button size="small">
                更新状态
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="pending">未开始</el-dropdown-item>
                  <el-dropdown-item command="inprogress">进行中</el-dropdown-item>
                  <el-dropdown-item command="testing">测试中</el-dropdown-item>
                  <el-dropdown-item command="completed">已完成</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 30px">
        <h4>时间线</h4>
        <el-timeline>
          <el-timeline-item
            v-for="task in devTasks.filter(t => t.status !== 'pending')"
            :key="task.id"
            :timestamp="task.dueDate"
            :type="getTaskStatusType(task.status)"
          >
            <p>{{ task.name }}</p>
            <p style="font-size: 12px; color: #909399">
              负责人: {{ task.assignee }} | 进度: {{ task.progress }}%
            </p>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.app-templates {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 120px);

  // 分类导航
  .category-card {
    position: sticky;
    top: 20px;

    .category-title {
      font-weight: bold;
      color: #303133;
    }

    .category-list {
      .category-item {
        display: flex;
        align-items: center;
        padding: 12px;
        margin-bottom: 8px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          background: #f0f9ff;
        }

        &.active {
          background: #409eff;
          color: white;

          .category-count {
            color: rgba(255, 255, 255, 0.8);
          }
        }

        .category-icon {
          font-size: 24px;
          margin-right: 12px;
        }

        .category-info {
          flex: 1;

          .category-name {
            font-weight: 500;
            margin-bottom: 4px;
          }

          .category-count {
            font-size: 12px;
            color: #909399;
          }
        }
      }
    }
  }

  // 搜索栏
  .search-bar {
    margin-bottom: 20px;
  }

  // 模板列表
  .template-list {
    .template-card {
      margin-bottom: 20px;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-5px);
      }

      .template-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;

        .template-icon {
          font-size: 48px;
        }
      }

      .template-name {
        margin: 0 0 10px 0;
        font-size: 18px;
        color: #303133;
        font-weight: bold;
      }

      .template-description {
        color: #606266;
        font-size: 14px;
        line-height: 1.6;
        margin-bottom: 15px;
        min-height: 42px;
      }

      .template-tags {
        margin-bottom: 15px;
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
      }

      .template-meta {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #909399;
        margin-bottom: 15px;
        padding: 10px 0;
        border-top: 1px solid #ebeef5;
        border-bottom: 1px solid #ebeef5;
      }

      .template-actions {
        display: flex;
        gap: 8px;
      }
    }
  }

  // 快速操作面板
  .quick-panel {
    position: sticky;
    top: 20px;

    .quick-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .statistics {
      h4 {
        margin: 0 0 15px 0;
        color: #303133;
      }
    }

    .hot-templates {
      h4 {
        margin: 0 0 15px 0;
        color: #303133;
      }

      .hot-item {
        display: flex;
        align-items: center;
        padding: 8px;
        margin-bottom: 8px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          background: #f0f9ff;
        }

        .hot-icon {
          font-size: 20px;
          margin-right: 10px;
        }

        .hot-name {
          font-size: 14px;
          color: #606266;
        }
      }
    }
  }

  // 详情对话框
  .detail-overview {
    .features-list {
      list-style: none;
      padding: 0;

      li {
        padding: 8px 0;
        color: #606266;
      }
    }
  }

  .api-list {
    .api-title {
      display: flex;
      align-items: center;
      gap: 10px;

      .api-name {
        font-weight: 500;
      }
    }

    .api-detail {
      padding: 15px;

      h5 {
        margin: 15px 0 10px 0;
        color: #303133;
      }

      .response-example {
        background: #f5f7fa;
        padding: 10px;
        border-radius: 4px;
        font-size: 12px;
        overflow-x: auto;
      }
    }
  }

  .demo-section {
    .demo-preview {
      height: 400px;
      background: #f5f7fa;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;

      .demo-placeholder {
        text-align: center;

        .demo-icon {
          font-size: 80px;
          margin-bottom: 20px;
        }

        h3 {
          margin: 0 0 10px 0;
          color: #303133;
        }

        p {
          color: #909399;
          margin-bottom: 20px;
        }
      }
    }
  }

  // 定制配置
  .config-section {
    padding: 20px 0;

    .flow-config {
      display: flex;
      align-items: center;
      margin-top: 10px;
    }
  }

  .preview-section {
    h4 {
      margin: 20px 0 10px 0;
      color: #303133;
    }

    ul {
      list-style: none;
      padding: 0;

      li {
        padding: 5px 0;
        color: #606266;
      }
    }
  }
}
</style>