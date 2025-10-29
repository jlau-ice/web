<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'

// 参数类型枚举
enum ParameterType {
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  ENUM = 'enum'
}

// 参数组类型枚举
enum ParameterGroup {
  BASIC = 'basic',
  ADVANCED = 'advanced',
  EXPERIMENTAL = 'experimental'
}

// 参数状态枚举
enum ParameterStatus {
  MODIFIED = 'modified',
  DEFAULT = 'default',
  RECOMMENDED = 'recommended'
}

// 参数配置接口
interface ParameterConfig {
  id: string
  name: string
  type: ParameterType
  currentValue: number | boolean | string
  defaultValue: number | boolean | string
  recommendedValue?: number | boolean | string
  min?: number
  max?: number
  step?: number
  options?: string[]
  range?: string
  description: string
  group: ParameterGroup
  status: ParameterStatus
  unit?: string
}

// 参数模板接口
interface ParameterTemplate {
  id: string
  name: string
  description: string
  parameters: Record<string, number | boolean | string>
  createTime: string
}

// 测试结果接口
interface TestResult {
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  processingTime: number
}

// 搜索条件
const searchForm = reactive({
  parameterName: '',
  parameterType: '',
  group: ''
})

// 当前选中的参数组
const activeGroup = ref<ParameterGroup | 'all'>('all')

// 当前编辑的参数
const currentParameter = ref<ParameterConfig | null>(null)

// 参数配置抽屉
const drawerVisible = ref(false)

// 模板对话框
const templateDialogVisible = ref(false)

// 效果预览对话框
const previewDialogVisible = ref(false)

// 验证测试对话框
const testDialogVisible = ref(false)

// 加载状态
const loading = ref(false)
const testLoading = ref(false)

// 参数列表
const parameters = ref<ParameterConfig[]>([])

// 参数模板列表
const templates = ref<ParameterTemplate[]>([])

// 测试结果
const testResult = ref<TestResult | null>(null)

// 原始测试结果（用于对比）
const originalTestResult = ref<TestResult>({
  accuracy: 0.92,
  precision: 0.90,
  recall: 0.88,
  f1Score: 0.89,
  processingTime: 125
})

// 上传的测试图片
const testImageUrl = ref('')

// 识别结果对比
const comparisonResult = reactive({
  before: {
    detectedObjects: 15,
    confidence: 0.85,
    processingTime: 125
  },
  after: {
    detectedObjects: 0,
    confidence: 0,
    processingTime: 0
  }
})

// 参数历史版本
const parameterHistory = ref<Array<{
  id: string
  timestamp: string
  changes: Array<{
    parameter: string
    oldValue: number | boolean | string
    newValue: number | boolean | string
  }>
}>>([])

// Mock 数据加载
const loadParameters = () => {
  loading.value = true
  setTimeout(() => {
    parameters.value = [
      // 基础参数
      {
        id: '1',
        name: '置信度阈值',
        type: ParameterType.NUMBER,
        currentValue: 0.75,
        defaultValue: 0.5,
        recommendedValue: 0.75,
        min: 0,
        max: 1,
        step: 0.05,
        range: '[0, 1]',
        description: '检测结果的最小置信度，低于此值的结果将被过滤',
        group: ParameterGroup.BASIC,
        status: ParameterStatus.RECOMMENDED,
        unit: ''
      },
      {
        id: '2',
        name: 'IoU阈值',
        type: ParameterType.NUMBER,
        currentValue: 0.5,
        defaultValue: 0.5,
        recommendedValue: 0.45,
        min: 0,
        max: 1,
        step: 0.05,
        range: '[0, 1]',
        description: '非极大值抑制(NMS)的IoU阈值',
        group: ParameterGroup.BASIC,
        status: ParameterStatus.DEFAULT,
        unit: ''
      },
      {
        id: '3',
        name: '最大检测数量',
        type: ParameterType.NUMBER,
        currentValue: 100,
        defaultValue: 100,
        recommendedValue: 150,
        min: 1,
        max: 500,
        step: 10,
        range: '[1, 500]',
        description: '单张图片最多检测的目标数量',
        group: ParameterGroup.BASIC,
        status: ParameterStatus.DEFAULT,
        unit: '个'
      },
      {
        id: '4',
        name: '启用多尺度检测',
        type: ParameterType.BOOLEAN,
        currentValue: true,
        defaultValue: false,
        recommendedValue: true,
        description: '是否启用多尺度目标检测，提高小目标检测能力',
        group: ParameterGroup.BASIC,
        status: ParameterStatus.MODIFIED,
        range: 'true/false'
      },
      // 高级参数
      {
        id: '5',
        name: '输入图像尺寸',
        type: ParameterType.ENUM,
        currentValue: '640',
        defaultValue: '640',
        recommendedValue: '640',
        options: ['320', '416', '512', '640', '768', '896', '1024'],
        range: '320-1024',
        description: '模型输入图像的尺寸，影响检测精度和速度',
        group: ParameterGroup.ADVANCED,
        status: ParameterStatus.DEFAULT,
        unit: 'px'
      },
      {
        id: '6',
        name: '批处理大小',
        type: ParameterType.NUMBER,
        currentValue: 16,
        defaultValue: 8,
        recommendedValue: 16,
        min: 1,
        max: 64,
        step: 1,
        range: '[1, 64]',
        description: '批量处理的图片数量',
        group: ParameterGroup.ADVANCED,
        status: ParameterStatus.MODIFIED,
        unit: '张'
      },
      {
        id: '7',
        name: '特征金字塔层数',
        type: ParameterType.NUMBER,
        currentValue: 5,
        defaultValue: 5,
        recommendedValue: 5,
        min: 3,
        max: 7,
        step: 1,
        range: '[3, 7]',
        description: '特征金字塔网络(FPN)的层数',
        group: ParameterGroup.ADVANCED,
        status: ParameterStatus.DEFAULT,
        unit: '层'
      },
      {
        id: '8',
        name: '锚框生成策略',
        type: ParameterType.ENUM,
        currentValue: 'adaptive',
        defaultValue: 'fixed',
        recommendedValue: 'adaptive',
        options: ['fixed', 'adaptive', 'learned'],
        range: 'fixed/adaptive/learned',
        description: '目标检测锚框的生成策略',
        group: ParameterGroup.ADVANCED,
        status: ParameterStatus.MODIFIED
      },
      {
        id: '9',
        name: '启用特征增强',
        type: ParameterType.BOOLEAN,
        currentValue: false,
        defaultValue: false,
        recommendedValue: true,
        description: '是否启用特征增强模块',
        group: ParameterGroup.ADVANCED,
        status: ParameterStatus.DEFAULT,
        range: 'true/false'
      },
      // 实验参数
      {
        id: '10',
        name: '注意力机制类型',
        type: ParameterType.ENUM,
        currentValue: 'SE',
        defaultValue: 'none',
        recommendedValue: 'CBAM',
        options: ['none', 'SE', 'CBAM', 'ECA'],
        range: 'none/SE/CBAM/ECA',
        description: '特征提取网络使用的注意力机制',
        group: ParameterGroup.EXPERIMENTAL,
        status: ParameterStatus.MODIFIED
      },
      {
        id: '11',
        name: 'Focal Loss gamma',
        type: ParameterType.NUMBER,
        currentValue: 2.0,
        defaultValue: 2.0,
        recommendedValue: 2.0,
        min: 0,
        max: 5,
        step: 0.1,
        range: '[0, 5]',
        description: 'Focal Loss的gamma参数，用于解决类别不平衡',
        group: ParameterGroup.EXPERIMENTAL,
        status: ParameterStatus.DEFAULT,
        unit: ''
      },
      {
        id: '12',
        name: '标签平滑系数',
        type: ParameterType.NUMBER,
        currentValue: 0.1,
        defaultValue: 0,
        recommendedValue: 0.1,
        min: 0,
        max: 0.5,
        step: 0.05,
        range: '[0, 0.5]',
        description: '标签平滑(Label Smoothing)系数',
        group: ParameterGroup.EXPERIMENTAL,
        status: ParameterStatus.MODIFIED,
        unit: ''
      },
      {
        id: '13',
        name: '启用混合精度训练',
        type: ParameterType.BOOLEAN,
        currentValue: true,
        defaultValue: false,
        recommendedValue: true,
        description: '是否使用FP16混合精度训练',
        group: ParameterGroup.EXPERIMENTAL,
        status: ParameterStatus.MODIFIED,
        range: 'true/false'
      },
      {
        id: '14',
        name: '温度系数',
        type: ParameterType.NUMBER,
        currentValue: 1.0,
        defaultValue: 1.0,
        recommendedValue: 1.5,
        min: 0.1,
        max: 5,
        step: 0.1,
        range: '[0.1, 5]',
        description: '知识蒸馏的温度系数',
        group: ParameterGroup.EXPERIMENTAL,
        status: ParameterStatus.DEFAULT,
        unit: ''
      }
    ]
    loading.value = false
  }, 500)
}

// 加载参数模板
const loadTemplates = () => {
  setTimeout(() => {
    templates.value = [
      {
        id: 't1',
        name: '高精度模式',
        description: '优先保证检测精度，适用于离线批处理场景',
        parameters: {
          '1': 0.85,
          '2': 0.45,
          '3': 150,
          '5': '1024',
          '6': 4
        },
        createTime: '2025-10-20 10:30:00'
      },
      {
        id: 't2',
        name: '高速度模式',
        description: '优先保证处理速度，适用于实时检测场景',
        parameters: {
          '1': 0.6,
          '2': 0.5,
          '3': 50,
          '5': '416',
          '6': 32
        },
        createTime: '2025-10-22 14:20:00'
      },
      {
        id: 't3',
        name: '平衡模式',
        description: '平衡精度和速度，适用于大多数场景',
        parameters: {
          '1': 0.75,
          '2': 0.5,
          '3': 100,
          '5': '640',
          '6': 16
        },
        createTime: '2025-10-25 09:15:00'
      }
    ]
  }, 300)
}

// 过滤后的参数列表
const filteredParameters = computed(() => {
  let result = parameters.value

  // 按参数组过滤
  if (activeGroup.value !== 'all') {
    result = result.filter(p => p.group === activeGroup.value)
  }

  // 按参数名称过滤
  if (searchForm.parameterName) {
    result = result.filter(p =>
      p.name.toLowerCase().includes(searchForm.parameterName.toLowerCase()) ||
      p.description.toLowerCase().includes(searchForm.parameterName.toLowerCase())
    )
  }

  // 按参数类型过滤
  if (searchForm.parameterType) {
    result = result.filter(p => p.type === searchForm.parameterType)
  }

  // 按参数组过滤
  if (searchForm.group) {
    result = result.filter(p => p.group === searchForm.group)
  }

  return result
})

// 统计信息
const statistics = computed(() => {
  const total = parameters.value.length
  const modified = parameters.value.filter(p => p.status === ParameterStatus.MODIFIED).length
  const basic = parameters.value.filter(p => p.group === ParameterGroup.BASIC).length
  const advanced = parameters.value.filter(p => p.group === ParameterGroup.ADVANCED).length
  const experimental = parameters.value.filter(p => p.group === ParameterGroup.EXPERIMENTAL).length

  return { total, modified, basic, advanced, experimental }
})

// 获取参数组标签类型
const getGroupTagType = (group: ParameterGroup) => {
  const map = {
    [ParameterGroup.BASIC]: 'success',
    [ParameterGroup.ADVANCED]: 'primary',
    [ParameterGroup.EXPERIMENTAL]: 'warning'
  }
  return map[group]
}

// 获取参数组文本
const getGroupText = (group: ParameterGroup) => {
  const map = {
    [ParameterGroup.BASIC]: '基础参数',
    [ParameterGroup.ADVANCED]: '高级参数',
    [ParameterGroup.EXPERIMENTAL]: '实验参数'
  }
  return map[group]
}

// 获取状态标签类型
const getStatusTagType = (status: ParameterStatus) => {
  const map = {
    [ParameterStatus.MODIFIED]: 'warning',
    [ParameterStatus.DEFAULT]: 'info',
    [ParameterStatus.RECOMMENDED]: 'success'
  }
  return map[status]
}

// 获取状态文本
const getStatusText = (status: ParameterStatus) => {
  const map = {
    [ParameterStatus.MODIFIED]: '已修改',
    [ParameterStatus.DEFAULT]: '默认值',
    [ParameterStatus.RECOMMENDED]: '推荐值'
  }
  return map[status]
}

// 编辑参数
const editParameter = (parameter: ParameterConfig) => {
  currentParameter.value = JSON.parse(JSON.stringify(parameter))
  drawerVisible.value = true
}

// 保存参数
const saveParameter = () => {
  if (!currentParameter.value) return

  const index = parameters.value.findIndex(p => p.id === currentParameter.value!.id)
  if (index !== -1) {
    const oldValue = parameters.value[index].currentValue
    const newValue = currentParameter.value.currentValue

    // 更新状态
    if (newValue === parameters.value[index].defaultValue) {
      currentParameter.value.status = ParameterStatus.DEFAULT
    } else if (newValue === parameters.value[index].recommendedValue) {
      currentParameter.value.status = ParameterStatus.RECOMMENDED
    } else {
      currentParameter.value.status = ParameterStatus.MODIFIED
    }

    parameters.value[index] = currentParameter.value

    // 记录历史
    parameterHistory.value.unshift({
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString(),
      changes: [{
        parameter: currentParameter.value.name,
        oldValue,
        newValue
      }]
    })

    ElMessage.success('参数保存成功')
    drawerVisible.value = false
  }
}

// 重置参数
const resetParameter = (parameter: ParameterConfig) => {
  ElMessageBox.confirm(
    `确定要将"${parameter.name}"重置为默认值吗？`,
    '确认重置',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const index = parameters.value.findIndex(p => p.id === parameter.id)
    if (index !== -1) {
      parameters.value[index].currentValue = parameters.value[index].defaultValue
      parameters.value[index].status = ParameterStatus.DEFAULT
      ElMessage.success('参数已重置')
    }
  }).catch(() => {})
}

// 应用推荐值
const applyRecommended = (parameter: ParameterConfig) => {
  if (!parameter.recommendedValue) return

  const index = parameters.value.findIndex(p => p.id === parameter.id)
  if (index !== -1) {
    parameters.value[index].currentValue = parameter.recommendedValue
    parameters.value[index].status = ParameterStatus.RECOMMENDED
    ElMessage.success('已应用推荐值')
  }
}

// 批量重置参数组
const resetGroup = (group: ParameterGroup) => {
  ElMessageBox.confirm(
    `确定要将所有${getGroupText(group)}重置为默认值吗？`,
    '确认批量重置',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    parameters.value.forEach(p => {
      if (p.group === group) {
        p.currentValue = p.defaultValue
        p.status = ParameterStatus.DEFAULT
      }
    })
    ElMessage.success('参数组已重置')
  }).catch(() => {})
}

// 保存为模板
const saveAsTemplate = () => {
  ElMessageBox.prompt('请输入模板名称', '保存配置模板', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /.+/,
    inputErrorMessage: '模板名称不能为空'
  }).then(({ value }) => {
    const template: ParameterTemplate = {
      id: `t${Date.now()}`,
      name: value,
      description: '用户自定义模板',
      parameters: {},
      createTime: new Date().toLocaleString()
    }

    parameters.value.forEach(p => {
      template.parameters[p.id] = p.currentValue
    })

    templates.value.push(template)
    ElMessage.success('模板保存成功')
  }).catch(() => {})
}

// 加载模板
const loadTemplate = (template: ParameterTemplate) => {
  ElMessageBox.confirm(
    `确定要加载模板"${template.name}"吗？当前配置将被覆盖。`,
    '确认加载模板',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    Object.entries(template.parameters).forEach(([id, value]) => {
      const parameter = parameters.value.find(p => p.id === id)
      if (parameter) {
        parameter.currentValue = value
        parameter.status = ParameterStatus.MODIFIED
      }
    })
    ElMessage.success('模板加载成功')
    templateDialogVisible.value = false
  }).catch(() => {})
}

// 删除模板
const deleteTemplate = (template: ParameterTemplate) => {
  ElMessageBox.confirm(
    `确定要删除模板"${template.name}"吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const index = templates.value.findIndex(t => t.id === template.id)
    if (index !== -1) {
      templates.value.splice(index, 1)
      ElMessage.success('模板已删除')
    }
  }).catch(() => {})
}

// 上传测试图片
const handleImageUpload = (file: any) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    testImageUrl.value = e.target?.result as string
    // 模拟识别结果更新
    comparisonResult.after = {
      detectedObjects: Math.floor(Math.random() * 10) + 10,
      confidence: 0.75 + Math.random() * 0.2,
      processingTime: Math.floor(Math.random() * 50) + 100
    }
  }
  reader.readAsDataURL(file.raw)
  return false
}

// 运行参数验证测试
const runValidationTest = () => {
  testLoading.value = true
  setTimeout(() => {
    // 模拟测试结果
    testResult.value = {
      accuracy: 0.88 + Math.random() * 0.1,
      precision: 0.86 + Math.random() * 0.1,
      recall: 0.84 + Math.random() * 0.1,
      f1Score: 0.85 + Math.random() * 0.1,
      processingTime: Math.floor(Math.random() * 50) + 100
    }
    testLoading.value = false
    ElMessage.success('验证测试完成')
  }, 2000)
}

// 获取性能评估
const getPerformanceRating = (result: TestResult | null) => {
  if (!result) return { text: '未测试', type: 'info' }
  const score = (result.accuracy + result.precision + result.recall + result.f1Score) / 4
  if (score >= 0.9) return { text: '优秀', type: 'success' }
  if (score >= 0.8) return { text: '良好', type: 'primary' }
  if (score >= 0.7) return { text: '一般', type: 'warning' }
  return { text: '需优化', type: 'danger' }
}

// 获取对比指标
const getComparisonMetrics = computed(() => {
  if (!testResult.value) return []
  return [
    {
      name: '准确率',
      current: (testResult.value.accuracy * 100).toFixed(2),
      original: (originalTestResult.value.accuracy * 100).toFixed(2),
      change: ((testResult.value.accuracy - originalTestResult.value.accuracy) * 100).toFixed(2)
    },
    {
      name: '精确率',
      current: (testResult.value.precision * 100).toFixed(2),
      original: (originalTestResult.value.precision * 100).toFixed(2),
      change: ((testResult.value.precision - originalTestResult.value.precision) * 100).toFixed(2)
    },
    {
      name: '召回率',
      current: (testResult.value.recall * 100).toFixed(2),
      original: (originalTestResult.value.recall * 100).toFixed(2),
      change: ((testResult.value.recall - originalTestResult.value.recall) * 100).toFixed(2)
    },
    {
      name: 'F1分数',
      current: (testResult.value.f1Score * 100).toFixed(2),
      original: (originalTestResult.value.f1Score * 100).toFixed(2),
      change: ((testResult.value.f1Score - originalTestResult.value.f1Score) * 100).toFixed(2)
    },
    {
      name: '处理时间',
      current: testResult.value.processingTime,
      original: originalTestResult.value.processingTime,
      change: testResult.value.processingTime - originalTestResult.value.processingTime
    }
  ]
})

// 重置搜索
const resetSearch = () => {
  searchForm.parameterName = ''
  searchForm.parameterType = ''
  searchForm.group = ''
}

// 初始化
onMounted(() => {
  loadParameters()
  loadTemplates()
})
</script>

<template>
  <div class="parameter-config-container">
    <!-- 顶部统计信息 -->
    <el-row :gutter="16" class="statistics-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon total">
              <i class="el-icon-setting"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.total }}</div>
              <div class="stat-label">总参数数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon modified">
              <i class="el-icon-edit"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.modified }}</div>
              <div class="stat-label">已修改参数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card basic">
          <div class="stat-info">
            <div class="stat-value">{{ statistics.basic }}</div>
            <div class="stat-label">基础参数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card advanced">
          <div class="stat-info">
            <div class="stat-value">{{ statistics.advanced }}</div>
            <div class="stat-label">高级参数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card experimental">
          <div class="stat-info">
            <div class="stat-value">{{ statistics.experimental }}</div>
            <div class="stat-label">实验参数</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 主体内容 -->
    <div class="main-content">
      <!-- 左侧参数分类导航 -->
      <div class="left-sidebar">
        <el-card shadow="never" class="category-card">
          <template #header>
            <div class="card-header">
              <span>参数分组</span>
            </div>
          </template>
          <el-menu
            :default-active="activeGroup"
            class="category-menu"
            @select="(key) => activeGroup = key"
          >
            <el-menu-item index="all">
              <i class="el-icon-menu"></i>
              <span>全部参数</span>
            </el-menu-item>
            <el-menu-item :index="ParameterGroup.BASIC">
              <el-tag type="success" size="small" class="menu-tag">基础</el-tag>
              <span>基础参数</span>
            </el-menu-item>
            <el-menu-item :index="ParameterGroup.ADVANCED">
              <el-tag type="primary" size="small" class="menu-tag">高级</el-tag>
              <span>高级参数</span>
            </el-menu-item>
            <el-menu-item :index="ParameterGroup.EXPERIMENTAL">
              <el-tag type="warning" size="small" class="menu-tag">实验</el-tag>
              <span>实验参数</span>
            </el-menu-item>
          </el-menu>

          <el-divider></el-divider>

          <div class="action-buttons">
            <el-button
              type="success"
              size="small"
              @click="templateDialogVisible = true"
              style="width: 100%; margin-bottom: 8px;"
            >
              <i class="el-icon-document"></i> 配置模板
            </el-button>
            <el-button
              type="primary"
              size="small"
              @click="saveAsTemplate"
              style="width: 100%; margin-bottom: 8px;"
            >
              <i class="el-icon-plus"></i> 保存模板
            </el-button>
            <el-button
              type="info"
              size="small"
              @click="previewDialogVisible = true"
              style="width: 100%; margin-bottom: 8px;"
            >
              <i class="el-icon-view"></i> 效果预览
            </el-button>
            <el-button
              type="warning"
              size="small"
              @click="testDialogVisible = true"
              style="width: 100%;"
            >
              <i class="el-icon-data-analysis"></i> 验证测试
            </el-button>
          </div>
        </el-card>

        <!-- 参数历史 -->
        <el-card shadow="never" class="history-card" style="margin-top: 16px;">
          <template #header>
            <div class="card-header">
              <span>最近修改</span>
            </div>
          </template>
          <div class="history-list">
            <div
              v-for="item in parameterHistory.slice(0, 5)"
              :key="item.id"
              class="history-item"
            >
              <div class="history-time">{{ item.timestamp }}</div>
              <div
                v-for="change in item.changes"
                :key="change.parameter"
                class="history-change"
              >
                <span class="param-name">{{ change.parameter }}</span>
                <span class="change-arrow">→</span>
                <span class="new-value">{{ change.newValue }}</span>
              </div>
            </div>
            <el-empty v-if="parameterHistory.length === 0" description="暂无修改记录"></el-empty>
          </div>
        </el-card>
      </div>

      <!-- 中间参数列表 -->
      <div class="center-content">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>参数配置列表</span>
            </div>
          </template>

          <!-- 搜索表单 -->
          <el-form :model="searchForm" inline class="search-form">
            <el-form-item label="参数名称">
              <el-input
                v-model="searchForm.parameterName"
                placeholder="请输入参数名称或描述"
                clearable
                style="width: 240px;"
              ></el-input>
            </el-form-item>
            <el-form-item label="参数类型">
              <el-select
                v-model="searchForm.parameterType"
                placeholder="请选择参数类型"
                clearable
                style="width: 150px;"
              >
                <el-option label="数值型" :value="ParameterType.NUMBER"></el-option>
                <el-option label="布尔型" :value="ParameterType.BOOLEAN"></el-option>
                <el-option label="枚举型" :value="ParameterType.ENUM"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="参数组">
              <el-select
                v-model="searchForm.group"
                placeholder="请选择参数组"
                clearable
                style="width: 150px;"
              >
                <el-option label="基础参数" :value="ParameterGroup.BASIC"></el-option>
                <el-option label="高级参数" :value="ParameterGroup.ADVANCED"></el-option>
                <el-option label="实验参数" :value="ParameterGroup.EXPERIMENTAL"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadParameters">
                <i class="el-icon-search"></i> 查询
              </el-button>
              <el-button @click="resetSearch">
                <i class="el-icon-refresh"></i> 重置
              </el-button>
            </el-form-item>
          </el-form>

          <!-- 参数表格 -->
          <el-table
            :data="filteredParameters"
            v-loading="loading"
            border
            stripe
            style="width: 100%"
            :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
          >
            <el-table-column prop="name" label="参数名称" width="160" fixed>
              <template #default="{ row }">
                <div class="param-name-cell">
                  <span>{{ row.name }}</span>
                  <el-tag
                    v-if="row.unit"
                    size="small"
                    effect="plain"
                    style="margin-left: 4px;"
                  >
                    {{ row.unit }}
                  </el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="group" label="参数组" width="100">
              <template #default="{ row }">
                <el-tag :type="getGroupTagType(row.group)" size="small">
                  {{ getGroupText(row.group) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="type" label="类型" width="90">
              <template #default="{ row }">
                <span v-if="row.type === ParameterType.NUMBER">数值型</span>
                <span v-else-if="row.type === ParameterType.BOOLEAN">布尔型</span>
                <span v-else>枚举型</span>
              </template>
            </el-table-column>
            <el-table-column prop="currentValue" label="当前值" width="120">
              <template #default="{ row }">
                <el-tag effect="dark" type="success">
                  {{ row.currentValue }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="defaultValue" label="默认值" width="100">
              <template #default="{ row }">
                {{ row.defaultValue }}
              </template>
            </el-table-column>
            <el-table-column prop="range" label="取值范围" width="120"></el-table-column>
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="getStatusTagType(row.status)" size="small">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip></el-table-column>
            <el-table-column label="操作" width="240" fixed="right">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  size="small"
                  link
                  @click="editParameter(row)"
                >
                  <i class="el-icon-edit"></i> 调整
                </el-button>
                <el-button
                  type="warning"
                  size="small"
                  link
                  @click="applyRecommended(row)"
                  :disabled="!row.recommendedValue"
                >
                  <i class="el-icon-thumb"></i> 推荐值
                </el-button>
                <el-button
                  type="info"
                  size="small"
                  link
                  @click="resetParameter(row)"
                  :disabled="row.status === ParameterStatus.DEFAULT"
                >
                  <i class="el-icon-refresh-left"></i> 重置
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>
    </div>

    <!-- 参数调整抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      title="参数调整"
      size="500px"
      :close-on-click-modal="false"
    >
      <div v-if="currentParameter" class="parameter-editor">
        <el-alert
          :title="`正在调整: ${currentParameter.name}`"
          type="info"
          :closable="false"
          style="margin-bottom: 20px;"
        ></el-alert>

        <el-form label-width="100px">
          <el-form-item label="参数名称">
            <el-input :value="currentParameter.name" disabled></el-input>
          </el-form-item>

          <el-form-item label="参数类型">
            <el-tag :type="getGroupTagType(currentParameter.group)">
              {{ getGroupText(currentParameter.group) }}
            </el-tag>
          </el-form-item>

          <el-form-item label="参数描述">
            <el-input
              type="textarea"
              :value="currentParameter.description"
              :rows="3"
              disabled
            ></el-input>
          </el-form-item>

          <el-divider></el-divider>

          <!-- 数值型参数 -->
          <template v-if="currentParameter.type === ParameterType.NUMBER">
            <el-form-item label="当前值">
              <div class="number-input-wrapper">
                <el-slider
                  v-model="currentParameter.currentValue"
                  :min="currentParameter.min"
                  :max="currentParameter.max"
                  :step="currentParameter.step"
                  show-input
                  style="width: 100%;"
                ></el-slider>
              </div>
            </el-form-item>
            <el-form-item label="取值范围">
              <el-tag>{{ currentParameter.range }}</el-tag>
            </el-form-item>
          </template>

          <!-- 布尔型参数 -->
          <template v-if="currentParameter.type === ParameterType.BOOLEAN">
            <el-form-item label="当前值">
              <el-switch
                v-model="currentParameter.currentValue"
                active-text="开启"
                inactive-text="关闭"
              ></el-switch>
            </el-form-item>
          </template>

          <!-- 枚举型参数 -->
          <template v-if="currentParameter.type === ParameterType.ENUM">
            <el-form-item label="当前值">
              <el-select
                v-model="currentParameter.currentValue"
                placeholder="请选择"
                style="width: 100%;"
              >
                <el-option
                  v-for="option in currentParameter.options"
                  :key="option"
                  :label="option"
                  :value="option"
                ></el-option>
              </el-select>
            </el-form-item>
          </template>

          <el-form-item label="默认值">
            <el-tag type="info">{{ currentParameter.defaultValue }}</el-tag>
          </el-form-item>

          <el-form-item label="推荐值" v-if="currentParameter.recommendedValue">
            <el-tag type="success">{{ currentParameter.recommendedValue }}</el-tag>
          </el-form-item>
        </el-form>

        <div class="drawer-footer">
          <el-button @click="drawerVisible = false">取消</el-button>
          <el-button type="primary" @click="saveParameter">
            <i class="el-icon-check"></i> 保存
          </el-button>
        </div>
      </div>
    </el-drawer>

    <!-- 配置模板对话框 -->
    <el-dialog
      v-model="templateDialogVisible"
      title="配置模板"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-table :data="templates" border stripe>
        <el-table-column prop="name" label="模板名称" width="150"></el-table-column>
        <el-table-column prop="description" label="描述" min-width="200"></el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160"></el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="loadTemplate(row)">
              <i class="el-icon-download"></i> 加载
            </el-button>
            <el-button type="danger" size="small" link @click="deleteTemplate(row)">
              <i class="el-icon-delete"></i> 删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="templateDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 效果预览对话框 -->
    <el-dialog
      v-model="previewDialogVisible"
      title="参数效果预览"
      width="900px"
      :close-on-click-modal="false"
    >
      <el-alert
        title="上传测试图片查看参数调整前后的效果对比"
        type="info"
        :closable="false"
        style="margin-bottom: 20px;"
      ></el-alert>

      <el-upload
        class="upload-demo"
        drag
        accept="image/*"
        :auto-upload="false"
        :on-change="handleImageUpload"
        :show-file-list="false"
      >
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">
          将图片拖到此处，或<em>点击上传</em>
        </div>
      </el-upload>

      <div v-if="testImageUrl" class="preview-content">
        <el-row :gutter="20" style="margin-top: 20px;">
          <el-col :span="12">
            <el-card shadow="hover">
              <template #header>
                <span>原始效果</span>
              </template>
              <div class="preview-image">
                <img :src="testImageUrl" alt="test" />
              </div>
              <el-descriptions :column="1" border size="small" style="margin-top: 10px;">
                <el-descriptions-item label="检测目标数">
                  {{ comparisonResult.before.detectedObjects }}
                </el-descriptions-item>
                <el-descriptions-item label="平均置信度">
                  {{ (comparisonResult.before.confidence * 100).toFixed(2) }}%
                </el-descriptions-item>
                <el-descriptions-item label="处理时间">
                  {{ comparisonResult.before.processingTime }}ms
                </el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="hover">
              <template #header>
                <span>调整后效果</span>
              </template>
              <div class="preview-image">
                <img :src="testImageUrl" alt="test" />
              </div>
              <el-descriptions :column="1" border size="small" style="margin-top: 10px;">
                <el-descriptions-item label="检测目标数">
                  {{ comparisonResult.after.detectedObjects }}
                  <el-tag
                    :type="comparisonResult.after.detectedObjects > comparisonResult.before.detectedObjects ? 'success' : 'danger'"
                    size="small"
                    style="margin-left: 8px;"
                  >
                    {{ comparisonResult.after.detectedObjects - comparisonResult.before.detectedObjects > 0 ? '+' : '' }}
                    {{ comparisonResult.after.detectedObjects - comparisonResult.before.detectedObjects }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="平均置信度">
                  {{ (comparisonResult.after.confidence * 100).toFixed(2) }}%
                  <el-tag
                    :type="comparisonResult.after.confidence > comparisonResult.before.confidence ? 'success' : 'danger'"
                    size="small"
                    style="margin-left: 8px;"
                  >
                    {{ ((comparisonResult.after.confidence - comparisonResult.before.confidence) * 100).toFixed(2) }}%
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="处理时间">
                  {{ comparisonResult.after.processingTime }}ms
                  <el-tag
                    :type="comparisonResult.after.processingTime < comparisonResult.before.processingTime ? 'success' : 'danger'"
                    size="small"
                    style="margin-left: 8px;"
                  >
                    {{ comparisonResult.after.processingTime - comparisonResult.before.processingTime > 0 ? '+' : '' }}
                    {{ comparisonResult.after.processingTime - comparisonResult.before.processingTime }}ms
                  </el-tag>
                </el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <template #footer>
        <el-button @click="previewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 验证测试对话框 -->
    <el-dialog
      v-model="testDialogVisible"
      title="参数验证测试"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-alert
        title="运行验证测试以评估当前参数配置的性能表现"
        type="warning"
        :closable="false"
        style="margin-bottom: 20px;"
      ></el-alert>

      <div class="test-actions">
        <el-button
          type="primary"
          :loading="testLoading"
          @click="runValidationTest"
        >
          <i class="el-icon-video-play"></i> 运行测试
        </el-button>
      </div>

      <div v-if="testResult" class="test-results">
        <el-divider content-position="left">性能指标</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-card shadow="hover" class="metric-card">
              <el-statistic title="准确率" :value="(testResult.accuracy * 100).toFixed(2)" suffix="%">
                <template #prefix>
                  <i class="el-icon-success" style="color: #67C23A;"></i>
                </template>
              </el-statistic>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="hover" class="metric-card">
              <el-statistic title="精确率" :value="(testResult.precision * 100).toFixed(2)" suffix="%">
                <template #prefix>
                  <i class="el-icon-aim" style="color: #409EFF;"></i>
                </template>
              </el-statistic>
            </el-card>
          </el-col>
          <el-col :span="12" style="margin-top: 16px;">
            <el-card shadow="hover" class="metric-card">
              <el-statistic title="召回率" :value="(testResult.recall * 100).toFixed(2)" suffix="%">
                <template #prefix>
                  <i class="el-icon-search" style="color: #E6A23C;"></i>
                </template>
              </el-statistic>
            </el-card>
          </el-col>
          <el-col :span="12" style="margin-top: 16px;">
            <el-card shadow="hover" class="metric-card">
              <el-statistic title="F1分数" :value="(testResult.f1Score * 100).toFixed(2)" suffix="%">
                <template #prefix>
                  <i class="el-icon-medal" style="color: #F56C6C;"></i>
                </template>
              </el-statistic>
            </el-card>
          </el-col>
        </el-row>

        <el-divider content-position="left">性能评估</el-divider>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="综合评分">
            <el-tag :type="getPerformanceRating(testResult).type" size="large">
              {{ getPerformanceRating(testResult).text }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="处理时间">
            {{ testResult.processingTime }}ms
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">与默认配置对比</el-divider>

        <el-table :data="getComparisonMetrics" border stripe>
          <el-table-column prop="name" label="指标" width="120"></el-table-column>
          <el-table-column label="当前配置" width="120">
            <template #default="{ row }">
              <span>{{ row.current }}{{ row.name === '处理时间' ? 'ms' : '%' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="默认配置" width="120">
            <template #default="{ row }">
              <span>{{ row.original }}{{ row.name === '处理时间' ? 'ms' : '%' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="变化" width="150">
            <template #default="{ row }">
              <el-tag
                :type="parseFloat(row.change) > 0 ? (row.name === '处理时间' ? 'danger' : 'success') : (row.name === '处理时间' ? 'success' : 'danger')"
                size="small"
              >
                {{ parseFloat(row.change) > 0 ? '+' : '' }}{{ row.change }}{{ row.name === '处理时间' ? 'ms' : '%' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="趋势" width="120">
            <template #default="{ row }">
              <i
                :class="parseFloat(row.change) > 0 ? (row.name === '处理时间' ? 'el-icon-bottom' : 'el-icon-top') : (row.name === '处理时间' ? 'el-icon-top' : 'el-icon-bottom')"
                :style="{
                  color: parseFloat(row.change) > 0 ? (row.name === '处理时间' ? '#F56C6C' : '#67C23A') : (row.name === '处理时间' ? '#67C23A' : '#F56C6C'),
                  fontSize: '20px'
                }"
              ></i>
            </template>
          </el-table-column>
        </el-table>

        <el-alert
          title="优化建议"
          type="success"
          style="margin-top: 20px;"
          :closable="false"
        >
          <template #default>
            <ul style="margin: 0; padding-left: 20px;">
              <li>当前配置在准确率方面表现良好</li>
              <li>建议适当提高置信度阈值以提升精确率</li>
              <li>可以考虑启用特征增强模块以提高召回率</li>
            </ul>
          </template>
        </el-alert>
      </div>

      <template #footer>
        <el-button @click="testDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.parameter-config-container {
}

.statistics-row {
  margin-bottom: 20px;

  .stat-card {
    border-radius: 8px;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-4px);
    }

    &.basic {
      border-left: 4px solid #67C23A;
    }

    &.advanced {
      border-left: 4px solid #409EFF;
    }

    &.experimental {
      border-left: 4px solid #E6A23C;
    }
  }

  .stat-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    color: white;

    &.total {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    &.modified {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }
  }

  .stat-info {
    flex: 1;
  }

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

.main-content {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.left-sidebar {
  width: 240px;
  flex-shrink: 0;

  .category-card,
  .history-card {
    border-radius: 8px;
  }

  .card-header {
    font-weight: 600;
    color: #303133;
  }

  .category-menu {
    border: none;

    .el-menu-item {
      display: flex;
      align-items: center;
      gap: 8px;

      .menu-tag {
        margin-right: 8px;
      }
    }
  }

  .action-buttons {
    margin-top: 16px;
  }

  .history-list {
    max-height: 400px;
    overflow-y: auto;
  }

  .history-item {
    padding: 12px;
    border-bottom: 1px solid #f0f0f0;
    font-size: 12px;

    &:last-child {
      border-bottom: none;
    }

    .history-time {
      color: #909399;
      margin-bottom: 4px;
    }

    .history-change {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 4px;

      .param-name {
        color: #606266;
        font-weight: 500;
      }

      .change-arrow {
        color: #909399;
      }

      .new-value {
        color: #409EFF;
        font-weight: 600;
      }
    }
  }
}

.center-content {
  flex: 1;
  min-width: 0;

  .card-header {
    font-weight: 600;
    color: #303133;
  }

  .search-form {
    margin-bottom: 16px;
  }

  .param-name-cell {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.parameter-editor {
  padding: 0 20px 20px;

  .number-input-wrapper {
    width: 100%;
  }

  .drawer-footer {
    margin-top: 30px;
    text-align: right;
    border-top: 1px solid #f0f0f0;
    padding-top: 20px;
  }
}

.preview-content {
  .preview-image {
    width: 100%;
    height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f7fa;
    border-radius: 4px;
    overflow: hidden;

    img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
  }
}

.test-actions {
  text-align: center;
  margin-bottom: 20px;
}

.test-results {
  margin-top: 20px;

  .metric-card {
    text-align: center;
    border-radius: 8px;

    :deep(.el-statistic__head) {
      font-size: 14px;
      color: #909399;
    }

    :deep(.el-statistic__content) {
      font-size: 32px;
      font-weight: bold;
    }
  }
}

.upload-demo {
  :deep(.el-upload) {
    width: 100%;
  }

  :deep(.el-upload-dragger) {
    width: 100%;
  }
}

// 响应式布局
@media (max-width: 1400px) {
  .main-content {
    flex-direction: column;
  }

  .left-sidebar {
    width: 100%;
  }
}
</style>