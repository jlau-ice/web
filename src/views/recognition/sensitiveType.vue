<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'

// 参数类型定义
interface Parameter {
  id: string
  name: string
  type: 'number' | 'boolean' | 'enum'
  currentValue: number | boolean | string
  defaultValue: number | boolean | string
  recommendedValue?: number | boolean | string
  min?: number
  max?: number
  step?: number
  options?: string[]
  range?: string
  description: string
  group: 'basic' | 'advanced' | 'experimental'
  modified: boolean
}

interface ParameterGroup {
  id: string
  name: string
  type: 'basic' | 'advanced' | 'experimental'
  count: number
}

interface ConfigTemplate {
  id: string
  name: string
  description: string
  parameters: Record<string, any>
  createTime: string
}

interface TestResult {
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  processingTime: number
}

// 响应式数据
const loading = ref(false)
const activeGroup = ref<string>('all')
const searchText = ref('')
const selectedParam = ref<Parameter | null>(null)
const showAdjustPanel = ref(false)
const showPreviewPanel = ref(false)
const showTestPanel = ref(false)

// 参数列表
const parameters = ref<Parameter[]>([])

// 参数分组
const parameterGroups = ref<ParameterGroup[]>([
  { id: 'all', name: '全部参数', type: 'basic', count: 0 },
  { id: 'basic', name: '基础参数', type: 'basic', count: 0 },
  { id: 'advanced', name: '高级参数', type: 'advanced', count: 0 },
  { id: 'experimental', name: '实验参数', type: 'experimental', count: 0 }
])

// 配置模板
const templates = ref<ConfigTemplate[]>([])
const selectedTemplate = ref<string>('')

// 测试相关
const testImage = ref<string>('')
const testResult = ref<TestResult | null>(null)
const testLoading = ref(false)

// 历史版本
const configHistory = ref<ConfigTemplate[]>([])

// 计算属性：过滤后的参数列表
const filteredParameters = computed(() => {
  let result = parameters.value

  // 按分组过滤
  if (activeGroup.value !== 'all') {
    result = result.filter(p => p.group === activeGroup.value)
  }

  // 按搜索文本过滤
  if (searchText.value) {
    const search = searchText.value.toLowerCase()
    result = result.filter(p =>
      p.name.toLowerCase().includes(search) ||
      p.description.toLowerCase().includes(search)
    )
  }

  return result
})

// 计算属性：参数修改统计
const modifiedCount = computed(() => {
  return parameters.value.filter(p => p.modified).length
})

// Mock 数据加载
const loadMockData = () => {
  loading.value = true

  setTimeout(() => {
    // 模拟参数数据
    parameters.value = [
      // 基础参数
      {
        id: '1',
        name: '识别阈值',
        type: 'number',
        currentValue: 0.75,
        defaultValue: 0.75,
        recommendedValue: 0.80,
        min: 0,
        max: 1,
        step: 0.01,
        range: '0.0 - 1.0',
        description: '模型识别的置信度阈值，高于此值才会输出识别结果',
        group: 'basic',
        modified: false
      },
      {
        id: '2',
        name: 'NMS阈值',
        type: 'number',
        currentValue: 0.45,
        defaultValue: 0.45,
        recommendedValue: 0.50,
        min: 0,
        max: 1,
        step: 0.01,
        range: '0.0 - 1.0',
        description: '非极大值抑制阈值，用于去除重叠的检测框',
        group: 'basic',
        modified: false
      },
      {
        id: '3',
        name: '最小检测尺寸',
        type: 'number',
        currentValue: 32,
        defaultValue: 32,
        recommendedValue: 24,
        min: 8,
        max: 128,
        step: 8,
        range: '8 - 128',
        description: '能够检测的目标最小像素尺寸',
        group: 'basic',
        modified: false
      },
      {
        id: '4',
        name: '启用GPU加速',
        type: 'boolean',
        currentValue: true,
        defaultValue: true,
        range: 'true/false',
        description: '是否使用GPU进行模型推理加速',
        group: 'basic',
        modified: false
      },
      // 高级参数
      {
        id: '5',
        name: '图像预处理方式',
        type: 'enum',
        currentValue: 'normalize',
        defaultValue: 'normalize',
        options: ['normalize', 'standardize', 'none'],
        range: 'normalize/standardize/none',
        description: '输入图像的预处理标准化方式',
        group: 'advanced',
        modified: false
      },
      {
        id: '6',
        name: '锚框尺寸比例',
        type: 'number',
        currentValue: 1.5,
        defaultValue: 1.5,
        min: 1.0,
        max: 3.0,
        step: 0.1,
        range: '1.0 - 3.0',
        description: '检测框锚框的宽高比例系数',
        group: 'advanced',
        modified: false
      },
      {
        id: '7',
        name: '特征金字塔层数',
        type: 'number',
        currentValue: 5,
        defaultValue: 5,
        min: 3,
        max: 7,
        step: 1,
        range: '3 - 7',
        description: '特征金字塔网络的层级数量',
        group: 'advanced',
        modified: false
      },
      {
        id: '8',
        name: '启用后处理优化',
        type: 'boolean',
        currentValue: true,
        defaultValue: false,
        range: 'true/false',
        description: '是否启用检测结果的后处理优化',
        group: 'advanced',
        modified: true
      },
      // 实验参数
      {
        id: '9',
        name: '混合精度计算',
        type: 'boolean',
        currentValue: false,
        defaultValue: false,
        range: 'true/false',
        description: '使用FP16混合精度加速推理（实验性功能）',
        group: 'experimental',
        modified: false
      },
      {
        id: '10',
        name: '动态批处理大小',
        type: 'number',
        currentValue: 1,
        defaultValue: 1,
        min: 1,
        max: 16,
        step: 1,
        range: '1 - 16',
        description: '动态调整批处理大小以优化吞吐量',
        group: 'experimental',
        modified: false
      },
      {
        id: '11',
        name: '注意力机制',
        type: 'enum',
        currentValue: 'none',
        defaultValue: 'none',
        options: ['none', 'SE', 'CBAM', 'ECA'],
        range: 'none/SE/CBAM/ECA',
        description: '使用的注意力机制类型（实验性）',
        group: 'experimental',
        modified: false
      },
      {
        id: '12',
        name: '自适应阈值',
        type: 'boolean',
        currentValue: false,
        defaultValue: false,
        range: 'true/false',
        description: '根据场景自动调整识别阈值',
        group: 'experimental',
        modified: false
      }
    ]

    // 更新分组计数
    updateGroupCounts()

    // 模拟配置模板
    templates.value = [
      {
        id: 't1',
        name: '高精度模式',
        description: '适用于准确率要求高的场景',
        parameters: {
          '1': 0.85,
          '2': 0.50,
          '3': 24
        },
        createTime: '2025-01-15 10:30:00'
      },
      {
        id: 't2',
        name: '高速模式',
        description: '适用于实时性要求高的场景',
        parameters: {
          '1': 0.65,
          '2': 0.40,
          '4': true,
          '9': true
        },
        createTime: '2025-01-16 14:20:00'
      },
      {
        id: 't3',
        name: '平衡模式',
        description: '精度和速度的平衡配置',
        parameters: {
          '1': 0.75,
          '2': 0.45,
          '3': 32,
          '8': true
        },
        createTime: '2025-01-17 09:15:00'
      }
    ]

    // 模拟历史版本
    configHistory.value = [
      {
        id: 'h1',
        name: '配置版本 v1.2',
        description: '优化识别阈值和NMS参数',
        parameters: {},
        createTime: '2025-01-20 16:45:00'
      },
      {
        id: 'h2',
        name: '配置版本 v1.1',
        description: '启用后处理优化',
        parameters: {},
        createTime: '2025-01-18 11:30:00'
      }
    ]

    loading.value = false
    ElMessage.success('参数配置加载成功')
  }, 800)
}

// 更新分组计数
const updateGroupCounts = () => {
  parameterGroups.value[0].count = parameters.value.length
  parameterGroups.value[1].count = parameters.value.filter(p => p.group === 'basic').length
  parameterGroups.value[2].count = parameters.value.filter(p => p.group === 'advanced').length
  parameterGroups.value[3].count = parameters.value.filter(p => p.group === 'experimental').length
}

// 获取参数类型标签类型
const getGroupTagType = (group: string) => {
  const typeMap: Record<string, any> = {
    basic: 'success',
    advanced: 'primary',
    experimental: 'warning'
  }
  return typeMap[group] || 'info'
}

// 获取参数状态标签
const getStatusTag = (param: Parameter) => {
  if (param.modified) {
    return { text: '已修改', type: 'warning' }
  }
  if (param.currentValue === param.recommendedValue) {
    return { text: '推荐值', type: 'success' }
  }
  if (param.currentValue === param.defaultValue) {
    return { text: '默认值', type: 'info' }
  }
  return null
}

// 调整参数
const adjustParameter = (param: Parameter) => {
  selectedParam.value = { ...param }
  showAdjustPanel.value = true
}

// 应用参数调整
const applyAdjustment = () => {
  if (selectedParam.value) {
    const index = parameters.value.findIndex(p => p.id === selectedParam.value!.id)
    if (index !== -1) {
      const original = parameters.value[index]
      selectedParam.value.modified = selectedParam.value.currentValue !== original.defaultValue
      parameters.value[index] = { ...selectedParam.value }
      ElMessage.success('参数已更新')
      showAdjustPanel.value = false
    }
  }
}

// 重置参数
const resetParameter = (param: Parameter) => {
  ElMessageBox.confirm(
    `确定要将"${param.name}"重置为默认值吗？`,
    '重置确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    param.currentValue = param.defaultValue
    param.modified = false
    ElMessage.success('参数已重置')
  }).catch(() => {})
}

// 重置所有参数
const resetAllParameters = () => {
  ElMessageBox.confirm(
    '确定要将所有参数重置为默认值吗？',
    '重置确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    parameters.value.forEach(p => {
      p.currentValue = p.defaultValue
      p.modified = false
    })
    ElMessage.success('所有参数已重置')
  }).catch(() => {})
}

// 应用推荐值
const applyRecommended = (param: Parameter) => {
  if (param.recommendedValue !== undefined) {
    param.currentValue = param.recommendedValue
    param.modified = param.recommendedValue !== param.defaultValue
    ElMessage.success('已应用推荐值')
  }
}

// 加载配置模板
const loadTemplate = () => {
  if (!selectedTemplate.value) {
    ElMessage.warning('请选择要加载的模板')
    return
  }

  const template = templates.value.find(t => t.id === selectedTemplate.value)
  if (template) {
    Object.entries(template.parameters).forEach(([id, value]) => {
      const param = parameters.value.find(p => p.id === id)
      if (param) {
        param.currentValue = value
        param.modified = value !== param.defaultValue
      }
    })
    ElMessage.success(`已加载模板：${template.name}`)
  }
}

// 保存为模板
const saveAsTemplate = () => {
  ElMessageBox.prompt('请输入模板名称', '保存配置模板', {
    confirmButtonText: '保存',
    cancelButtonText: '取消',
    inputPattern: /\S+/,
    inputErrorMessage: '模板名称不能为空'
  }).then(({ value }) => {
    const newTemplate: ConfigTemplate = {
      id: `t${templates.value.length + 1}`,
      name: value,
      description: `自定义配置 - ${modifiedCount.value} 个参数已修改`,
      parameters: {},
      createTime: new Date().toLocaleString('zh-CN')
    }

    parameters.value.forEach(p => {
      if (p.modified) {
        newTemplate.parameters[p.id] = p.currentValue
      }
    })

    templates.value.push(newTemplate)
    ElMessage.success('配置模板已保存')
  }).catch(() => {})
}

// 上传测试图片
const handleImageUpload = (file: any) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    testImage.value = e.target?.result as string
    ElMessage.success('图片上传成功')
  }
  reader.readAsDataURL(file.raw)
  return false
}

// 运行测试
const runTest = () => {
  if (!testImage.value) {
    ElMessage.warning('请先上传测试图片')
    return
  }

  testLoading.value = true
  showTestPanel.value = true

  // 模拟测试过程
  setTimeout(() => {
    testResult.value = {
      accuracy: 0.85 + Math.random() * 0.1,
      precision: 0.82 + Math.random() * 0.1,
      recall: 0.80 + Math.random() * 0.1,
      f1Score: 0.83 + Math.random() * 0.1,
      processingTime: 50 + Math.random() * 30
    }
    testLoading.value = false
    ElMessage.success('测试完成')
  }, 2000)
}

// 批量调整参数组
const adjustGroupBatch = (group: string) => {
  ElMessage.info(`批量调整 ${group} 参数组功能开发中...`)
}

// 保存配置历史
const saveToHistory = () => {
  ElMessageBox.prompt('请输入版本描述', '保存配置历史', {
    confirmButtonText: '保存',
    cancelButtonText: '取消'
  }).then(({ value }) => {
    const newHistory: ConfigTemplate = {
      id: `h${configHistory.value.length + 1}`,
      name: `配置版本 v1.${configHistory.value.length + 1}`,
      description: value || '无描述',
      parameters: {},
      createTime: new Date().toLocaleString('zh-CN')
    }

    parameters.value.forEach(p => {
      newHistory.parameters[p.id] = p.currentValue
    })

    configHistory.value.unshift(newHistory)
    ElMessage.success('配置已保存到历史')
  }).catch(() => {})
}

// 生命周期
onMounted(() => {
  loadMockData()
})
</script>

<template>
  <div class="parameter-config-container">
    <!-- 顶部工具栏 -->
    <el-card class="toolbar-card" shadow="never">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-input
            v-model="searchText"
            placeholder="搜索参数名称或描述"
            clearable
            style="width: 300px"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-select
            v-model="selectedTemplate"
            placeholder="选择配置模板"
            clearable
            style="width: 200px; margin-left: 12px"
          >
            <el-option
              v-for="template in templates"
              :key="template.id"
              :label="template.name"
              :value="template.id"
            >
              <div class="template-option">
                <span>{{ template.name }}</span>
                <span class="template-desc">{{ template.description }}</span>
              </div>
            </el-option>
          </el-select>

          <el-button type="primary" @click="loadTemplate" :disabled="!selectedTemplate">
            加载模板
          </el-button>
        </div>

        <div class="toolbar-right">
          <el-alert
            v-if="modifiedCount > 0"
            :title="`${modifiedCount} 个参数已修改`"
            type="warning"
            :closable="false"
            style="margin-right: 12px"
          />

          <el-button @click="saveAsTemplate" :disabled="modifiedCount === 0">
            保存为模板
          </el-button>
          <el-button @click="saveToHistory">
            保存到历史
          </el-button>
          <el-button @click="resetAllParameters" :disabled="modifiedCount === 0">
            全部重置
          </el-button>
          <el-button type="primary" @click="showPreviewPanel = true">
            效果预览
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 左侧：参数分类导航 -->
      <el-card class="nav-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>参数分类</span>
          </div>
        </template>

        <div class="nav-list">
          <div
            v-for="group in parameterGroups"
            :key="group.id"
            :class="['nav-item', { active: activeGroup === group.id }]"
            @click="activeGroup = group.id"
          >
            <div class="nav-item-content">
              <el-tag
                :type="getGroupTagType(group.type)"
                effect="plain"
                size="small"
                round
              >
                {{ group.name }}
              </el-tag>
              <el-badge :value="group.count" class="item-badge" />
            </div>
            <el-button
              v-if="group.id !== 'all'"
              link
              type="primary"
              size="small"
              @click.stop="adjustGroupBatch(group.id)"
            >
              批量调整
            </el-button>
          </div>
        </div>

        <el-divider />

        <!-- 配置历史 -->
        <div class="card-header" style="margin-bottom: 12px">
          <span>配置历史</span>
        </div>
        <div class="history-list">
          <div
            v-for="history in configHistory"
            :key="history.id"
            class="history-item"
          >
            <div class="history-name">{{ history.name }}</div>
            <div class="history-desc">{{ history.description }}</div>
            <div class="history-time">{{ history.createTime }}</div>
          </div>
        </div>
      </el-card>

      <!-- 中间：参数配置列表 -->
      <el-card class="table-card" shadow="never" v-loading="loading">
        <template #header>
          <div class="card-header">
            <span>参数配置列表</span>
            <span class="count-text">共 {{ filteredParameters.length }} 个参数</span>
          </div>
        </template>

        <el-table
          :data="filteredParameters"
          stripe
          style="width: 100%"
          :height="600"
        >
          <el-table-column prop="name" label="参数名称" width="180" fixed>
            <template #default="{ row }">
              <div class="param-name">
                {{ row.name }}
                <el-tag
                  v-if="getStatusTag(row)"
                  :type="getStatusTag(row)!.type"
                  size="small"
                  style="margin-left: 8px"
                >
                  {{ getStatusTag(row)!.text }}
                </el-tag>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="group" label="参数类型" width="120">
            <template #default="{ row }">
              <el-tag :type="getGroupTagType(row.group)" size="small">
                {{ parameterGroups.find(g => g.id === row.group)?.name }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="currentValue" label="当前值" width="120">
            <template #default="{ row }">
              <span :style="{ color: row.modified ? '#E6A23C' : '#606266', fontWeight: row.modified ? 'bold' : 'normal' }">
                {{ typeof row.currentValue === 'boolean' ? (row.currentValue ? '开启' : '关闭') : row.currentValue }}
              </span>
            </template>
          </el-table-column>

          <el-table-column prop="defaultValue" label="默认值" width="120">
            <template #default="{ row }">
              {{ typeof row.defaultValue === 'boolean' ? (row.defaultValue ? '开启' : '关闭') : row.defaultValue }}
            </template>
          </el-table-column>

          <el-table-column prop="range" label="取值范围" width="150" />

          <el-table-column prop="description" label="描述" min-width="250" show-overflow-tooltip />

          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="adjustParameter(row)">
                调整
              </el-button>
              <el-button
                v-if="row.recommendedValue !== undefined"
                link
                type="success"
                size="small"
                @click="applyRecommended(row)"
              >
                应用推荐值
              </el-button>
              <el-button
                link
                type="warning"
                size="small"
                @click="resetParameter(row)"
                :disabled="!row.modified"
              >
                重置
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 右侧：参数调整面板 -->
      <el-drawer
        v-model="showAdjustPanel"
        title="参数调整"
        direction="rtl"
        size="400px"
      >
        <div v-if="selectedParam" class="adjust-panel">
          <el-form label-position="top">
            <el-form-item label="参数名称">
              <el-tag :type="getGroupTagType(selectedParam.group)">
                {{ selectedParam.name }}
              </el-tag>
            </el-form-item>

            <el-form-item label="参数描述">
              <div class="param-description">{{ selectedParam.description }}</div>
            </el-form-item>

            <el-divider />

            <!-- 数值型参数 -->
            <template v-if="selectedParam.type === 'number'">
              <el-form-item label="当前值">
                <el-row :gutter="12">
                  <el-col :span="18">
                    <el-slider
                      v-model="selectedParam.currentValue"
                      :min="selectedParam.min"
                      :max="selectedParam.max"
                      :step="selectedParam.step"
                      show-stops
                    />
                  </el-col>
                  <el-col :span="6">
                    <el-input-number
                      v-model="selectedParam.currentValue"
                      :min="selectedParam.min"
                      :max="selectedParam.max"
                      :step="selectedParam.step"
                      size="small"
                    />
                  </el-col>
                </el-row>
              </el-form-item>
            </template>

            <!-- 布尔型参数 -->
            <template v-if="selectedParam.type === 'boolean'">
              <el-form-item label="开关状态">
                <el-switch
                  v-model="selectedParam.currentValue"
                  active-text="开启"
                  inactive-text="关闭"
                  size="large"
                />
              </el-form-item>
            </template>

            <!-- 枚举型参数 -->
            <template v-if="selectedParam.type === 'enum'">
              <el-form-item label="选择值">
                <el-select v-model="selectedParam.currentValue" style="width: 100%">
                  <el-option
                    v-for="option in selectedParam.options"
                    :key="option"
                    :label="option"
                    :value="option"
                  />
                </el-select>
              </el-form-item>
            </template>

            <el-divider />

            <el-form-item label="参考信息">
              <div class="reference-info">
                <div class="info-item">
                  <span class="label">默认值：</span>
                  <span class="value">{{ selectedParam.defaultValue }}</span>
                </div>
                <div v-if="selectedParam.recommendedValue !== undefined" class="info-item">
                  <span class="label">推荐值：</span>
                  <span class="value recommended">{{ selectedParam.recommendedValue }}</span>
                </div>
                <div class="info-item">
                  <span class="label">取值范围：</span>
                  <span class="value">{{ selectedParam.range }}</span>
                </div>
              </div>
            </el-form-item>
          </el-form>

          <div class="panel-footer">
            <el-button @click="showAdjustPanel = false">取消</el-button>
            <el-button type="primary" @click="applyAdjustment">应用</el-button>
          </div>
        </div>
      </el-drawer>

      <!-- 效果预览面板 -->
      <el-drawer
        v-model="showPreviewPanel"
        title="参数效果预览"
        direction="rtl"
        size="500px"
      >
        <div class="preview-panel">
          <el-alert
            title="上传测试图片以预览参数调整效果"
            type="info"
            :closable="false"
            style="margin-bottom: 20px"
          />

          <el-upload
            class="upload-demo"
            drag
            :auto-upload="false"
            :on-change="handleImageUpload"
            :show-file-list="false"
            accept="image/*"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将图片拖到此处，或<em>点击上传</em>
            </div>
          </el-upload>

          <div v-if="testImage" class="preview-content">
            <el-divider content-position="left">测试图片</el-divider>
            <div class="image-preview">
              <img :src="testImage" alt="测试图片" />
            </div>

            <el-button type="primary" @click="runTest" :loading="testLoading" style="width: 100%; margin-top: 16px">
              运行测试
            </el-button>

            <div v-if="testResult && !testLoading" class="test-results">
              <el-divider content-position="left">测试结果</el-divider>

              <div class="result-metrics">
                <div class="metric-item">
                  <div class="metric-label">准确率</div>
                  <div class="metric-value">{{ (testResult.accuracy * 100).toFixed(2) }}%</div>
                  <el-progress
                    :percentage="testResult.accuracy * 100"
                    :color="testResult.accuracy > 0.9 ? '#67C23A' : '#E6A23C'"
                  />
                </div>

                <div class="metric-item">
                  <div class="metric-label">精确率</div>
                  <div class="metric-value">{{ (testResult.precision * 100).toFixed(2) }}%</div>
                  <el-progress
                    :percentage="testResult.precision * 100"
                    :color="testResult.precision > 0.9 ? '#67C23A' : '#E6A23C'"
                  />
                </div>

                <div class="metric-item">
                  <div class="metric-label">召回率</div>
                  <div class="metric-value">{{ (testResult.recall * 100).toFixed(2) }}%</div>
                  <el-progress
                    :percentage="testResult.recall * 100"
                    :color="testResult.recall > 0.9 ? '#67C23A' : '#E6A23C'"
                  />
                </div>

                <div class="metric-item">
                  <div class="metric-label">F1分数</div>
                  <div class="metric-value">{{ (testResult.f1Score * 100).toFixed(2) }}%</div>
                  <el-progress
                    :percentage="testResult.f1Score * 100"
                    :color="testResult.f1Score > 0.9 ? '#67C23A' : '#E6A23C'"
                  />
                </div>

                <div class="metric-item">
                  <div class="metric-label">处理时间</div>
                  <div class="metric-value">{{ testResult.processingTime.toFixed(2) }} ms</div>
                </div>
              </div>

              <el-alert
                title="优化建议"
                description="当前配置在测试图片上表现良好。建议适当提高识别阈值以减少误检。"
                type="success"
                :closable="false"
                show-icon
                style="margin-top: 16px"
              />
            </div>
          </div>
        </div>
      </el-drawer>
    </div>
  </div>
</template>

<style scoped lang="scss">
.parameter-config-container {
  .toolbar-card {
    margin-bottom: 20px;

    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;

      .toolbar-left,
      .toolbar-right {
        display: flex;
        align-items: center;
        gap: 12px;
      }
    }
  }

  .main-content {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 20px;
    align-items: start;

    .nav-card {
      position: sticky;
      top: 20px;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 600;
      }

      .nav-list {
        .nav-item {
          padding: 12px;
          margin-bottom: 8px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          justify-content: space-between;
          align-items: center;

          &:hover {
            background-color: #f5f7fa;
          }

          &.active {
            background-color: #ecf5ff;
            border-left: 3px solid #409eff;
          }

          .nav-item-content {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .item-badge {
            margin-left: auto;
          }
        }
      }

      .history-list {
        .history-item {
          padding: 10px;
          margin-bottom: 10px;
          background-color: #f5f7fa;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s;

          &:hover {
            background-color: #e9ecef;
          }

          .history-name {
            font-weight: 600;
            color: #303133;
            margin-bottom: 4px;
          }

          .history-desc {
            font-size: 12px;
            color: #909399;
            margin-bottom: 4px;
          }

          .history-time {
            font-size: 11px;
            color: #c0c4cc;
          }
        }
      }
    }

    .table-card {
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 600;

        .count-text {
          font-size: 14px;
          color: #909399;
          font-weight: normal;
        }
      }

      .param-name {
        display: flex;
        align-items: center;
      }
    }
  }
}

.template-option {
  display: flex;
  flex-direction: column;

  .template-desc {
    font-size: 12px;
    color: #909399;
    margin-top: 2px;
  }
}

.adjust-panel {
  padding: 0 20px 20px;

  .param-description {
    padding: 12px;
    background-color: #f5f7fa;
    border-radius: 6px;
    color: #606266;
    font-size: 14px;
    line-height: 1.6;
  }

  .reference-info {
    .info-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #ebeef5;

      &:last-child {
        border-bottom: none;
      }

      .label {
        color: #909399;
        font-size: 14px;
      }

      .value {
        color: #303133;
        font-weight: 600;

        &.recommended {
          color: #67c23a;
        }
      }
    }
  }

  .panel-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid #ebeef5;
  }
}

.preview-panel {
  padding: 0 20px 20px;

  .upload-demo {
    margin-bottom: 20px;
  }

  .preview-content {
    .image-preview {
      width: 100%;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #dcdfe6;

      img {
        width: 100%;
        height: auto;
        display: block;
      }
    }

    .test-results {
      margin-top: 20px;

      .result-metrics {
        .metric-item {
          margin-bottom: 20px;

          .metric-label {
            font-size: 14px;
            color: #606266;
            margin-bottom: 4px;
          }

          .metric-value {
            font-size: 20px;
            font-weight: 600;
            color: #303133;
            margin-bottom: 8px;
          }
        }
      }
    }
  }
}
</style>
