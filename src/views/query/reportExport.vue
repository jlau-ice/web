<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  Search,
  Plus,
  Edit,
  Delete,
  Download,
  View,
  Setting,
  Document,
  Connection,
  Picture,
  Refresh,
  Upload
} from '@element-plus/icons-vue'

// 类型定义
interface ReportTemplate {
  id: number
  name: string
  type: string
  createTime: string
  status: 'ready' | 'generating' | 'failed'
  description: string
  format: string[]
  dataSource: string[]
}

interface ReportComponent {
  id: string
  type: 'chart' | 'table' | 'text' | 'image'
  title: string
  config: any
  position: { x: number; y: number }
}

interface DataSourceConfig {
  name: string
  type: string
  filters: any[]
  groupBy: string[]
  updateFrequency: string
}

interface ReportStyleConfig {
  theme: string
  fontSize: number
  layout: string
  watermark: string
  headerFooter: boolean
}

interface ReportForm {
  name: string
  type: string
  description: string
  timeRange: [Date, Date] | null
  dataSource: string[]
  format: string[]
  status: string
}

// 状态管理
const loading = ref(false)
const searchText = ref('')
const filterType = ref('')
const filterStatus = ref('')

// 模板列表
const templateList = ref<ReportTemplate[]>([])
const selectedTemplate = ref<ReportTemplate | null>(null)

// 对话框控制
const dialogVisible = ref(false)
const dialogTitle = ref('新增报表模板')
const designDialogVisible = ref(false)
const dataSourceDialogVisible = ref(false)
const formatDialogVisible = ref(false)
const previewDialogVisible = ref(false)

// 表单数据
const reportFormRef = ref<FormInstance>()
const reportForm = reactive<ReportForm>({
  name: '',
  type: '',
  description: '',
  timeRange: null,
  dataSource: [],
  format: [],
  status: 'ready'
})

// 表单验证规则
const formRules = reactive<FormRules<ReportForm>>({
  name: [{ required: true, message: '请输入报表名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择报表类型', trigger: 'change' }],
  dataSource: [{ required: true, message: '请选择数据源', trigger: 'change' }],
  format: [{ required: true, message: '请选择导出格式', trigger: 'change' }]
})

// 报表组件列表
const reportComponents = ref<ReportComponent[]>([])

// 数据源配置
const dataSourceConfig = reactive<DataSourceConfig>({
  name: '',
  type: '',
  filters: [],
  groupBy: [],
  updateFrequency: 'realtime'
})

// 样式配置
const styleConfig = reactive<ReportStyleConfig>({
  theme: '#409EFF',
  fontSize: 14,
  layout: 'portrait',
  watermark: '',
  headerFooter: true
})

// 生成进度
const generateProgress = ref(0)
const isGenerating = ref(false)

// 选项数据
const reportTypes = [
  { label: '生产统计报表', value: 'production' },
  { label: '流通统计报表', value: 'circulation' },
  { label: '质量检验报表', value: 'quality' },
  { label: '业务分析报表', value: 'business' },
  { label: '综合汇总报表', value: 'summary' }
]

const dataSourceOptions = [
  { label: '生产数据', value: 'production' },
  { label: '流通数据', value: 'circulation' },
  { label: '质量数据', value: 'quality' },
  { label: '库存数据', value: 'inventory' },
  { label: '销售数据', value: 'sales' }
]

const formatOptions = [
  { label: 'PDF', value: 'pdf' },
  { label: 'Excel', value: 'excel' },
  { label: 'Word', value: 'word' },
  { label: '图片', value: 'image' }
]

const componentTypes = [
  { label: '图表', value: 'chart', icon: 'BarChart' },
  { label: '表格', value: 'table', icon: 'Grid' },
  { label: '文本', value: 'text', icon: 'Document' },
  { label: '图片', value: 'image', icon: 'Picture' }
]

const updateFrequencyOptions = [
  { label: '实时', value: 'realtime' },
  { label: '每小时', value: 'hourly' },
  { label: '每天', value: 'daily' },
  { label: '每周', value: 'weekly' }
]

// 计算属性 - 过滤后的模板列表
const filteredTemplates = computed(() => {
  return templateList.value.filter(item => {
    const matchSearch = !searchText.value || 
      item.name.includes(searchText.value) || 
      item.description.includes(searchText.value)
    const matchType = !filterType.value || item.type === filterType.value
    const matchStatus = !filterStatus.value || item.status === filterStatus.value
    return matchSearch && matchType && matchStatus
  })
})

// 状态标签类型
const getStatusType = (status: string) => {
  const typeMap: Record<string, 'success' | 'warning' | 'danger'> = {
    ready: 'success',
    generating: 'warning',
    failed: 'danger'
  }
  return typeMap[status] || 'info'
}

// 状态文本
const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    ready: '就绪',
    generating: '生成中',
    failed: '失败'
  }
  return textMap[status] || status
}

// Mock 数据加载
const loadTemplates = () => {
  loading.value = true
  setTimeout(() => {
    templateList.value = [
      {
        id: 1,
        name: '月度生产统计报表',
        type: 'production',
        createTime: '2025-10-01 10:00:00',
        status: 'ready',
        description: '统计月度生产数据，包括产量、合格率等指标',
        format: ['pdf', 'excel'],
        dataSource: ['production', 'quality']
      },
      {
        id: 2,
        name: '产品流通追溯报表',
        type: 'circulation',
        createTime: '2025-10-05 14:30:00',
        status: 'ready',
        description: '追踪产品流通全过程，生成完整流通链路报表',
        format: ['pdf', 'word'],
        dataSource: ['circulation']
      },
      {
        id: 3,
        name: '质量检验汇总报表',
        type: 'quality',
        createTime: '2025-10-10 09:15:00',
        status: 'generating',
        description: '汇总质量检验数据，分析质量趋势',
        format: ['excel', 'pdf'],
        dataSource: ['quality', 'production']
      },
      {
        id: 4,
        name: '业务分析综合报表',
        type: 'business',
        createTime: '2025-10-15 16:45:00',
        status: 'ready',
        description: '综合分析业务数据，提供决策支持',
        format: ['pdf', 'excel', 'word'],
        dataSource: ['production', 'circulation', 'quality', 'sales']
      },
      {
        id: 5,
        name: '年度总结报表',
        type: 'summary',
        createTime: '2025-10-20 11:20:00',
        status: 'failed',
        description: '年度数据总结与分析报表',
        format: ['pdf', 'word'],
        dataSource: ['production', 'circulation', 'quality', 'inventory', 'sales']
      }
    ]
    loading.value = false
  }, 500)
}

// 打开新增对话框
const handleAdd = () => {
  dialogTitle.value = '新增报表模板'
  Object.assign(reportForm, {
    name: '',
    type: '',
    description: '',
    timeRange: null,
    dataSource: [],
    format: [],
    status: 'ready'
  })
  dialogVisible.value = true
}

// 打开编辑对话框
const handleEdit = (row: ReportTemplate) => {
  dialogTitle.value = '编辑报表模板'
  selectedTemplate.value = row
  Object.assign(reportForm, {
    name: row.name,
    type: row.type,
    description: row.description,
    timeRange: null,
    dataSource: row.dataSource,
    format: row.format,
    status: row.status
  })
  dialogVisible.value = true
}

// 删除模板
const handleDelete = async (row: ReportTemplate) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除报表模板"${row.name}"吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    loading.value = true
    setTimeout(() => {
      const index = templateList.value.findIndex(item => item.id === row.id)
      if (index > -1) {
        templateList.value.splice(index, 1)
      }
      loading.value = false
      ElMessage.success('删除成功')
    }, 300)
  } catch {
    // 用户取消
  }
}

// 保存模板
const handleSave = async () => {
  if (!reportFormRef.value) return
  
  await reportFormRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      setTimeout(() => {
        if (selectedTemplate.value) {
          // 编辑
          const index = templateList.value.findIndex(item => item.id === selectedTemplate.value!.id)
          if (index > -1) {
            templateList.value[index] = {
              ...templateList.value[index],
              name: reportForm.name,
              type: reportForm.type,
              description: reportForm.description,
              dataSource: reportForm.dataSource,
              format: reportForm.format
            }
          }
          ElMessage.success('更新成功')
        } else {
          // 新增
          const newTemplate: ReportTemplate = {
            id: Date.now(),
            name: reportForm.name,
            type: reportForm.type,
            createTime: new Date().toLocaleString('zh-CN'),
            status: 'ready',
            description: reportForm.description,
            format: reportForm.format,
            dataSource: reportForm.dataSource
          }
          templateList.value.unshift(newTemplate)
          ElMessage.success('创建成功')
        }
        loading.value = false
        dialogVisible.value = false
      }, 500)
    }
  })
}

// 打开设计界面
const handleDesign = (row: ReportTemplate) => {
  selectedTemplate.value = row
  // 初始化一些示例组件
  reportComponents.value = [
    {
      id: '1',
      type: 'chart',
      title: '产量趋势图',
      config: { chartType: 'line' },
      position: { x: 0, y: 0 }
    },
    {
      id: '2',
      type: 'table',
      title: '数据明细表',
      config: { columns: [] },
      position: { x: 0, y: 200 }
    }
  ]
  designDialogVisible.value = true
}

// 添加组件
const addComponent = (type: string) => {
  const newComponent: ReportComponent = {
    id: Date.now().toString(),
    type: type as any,
    title: `新${componentTypes.find(c => c.value === type)?.label}`,
    config: {},
    position: { x: 0, y: 0 }
  }
  reportComponents.value.push(newComponent)
  ElMessage.success('组件已添加')
}

// 删除组件
const removeComponent = (id: string) => {
  const index = reportComponents.value.findIndex(c => c.id === id)
  if (index > -1) {
    reportComponents.value.splice(index, 1)
  }
}

// 配置数据源
const handleConfigDataSource = (row: ReportTemplate) => {
  selectedTemplate.value = row
  Object.assign(dataSourceConfig, {
    name: row.name,
    type: row.dataSource[0] || '',
    filters: [],
    groupBy: [],
    updateFrequency: 'realtime'
  })
  dataSourceDialogVisible.value = true
}

// 保存数据源配置
const saveDataSourceConfig = () => {
  ElMessage.success('数据源配置已保存')
  dataSourceDialogVisible.value = false
}

// 配置格式
const handleConfigFormat = (row: ReportTemplate) => {
  selectedTemplate.value = row
  Object.assign(styleConfig, {
    theme: '#409EFF',
    fontSize: 14,
    layout: 'portrait',
    watermark: '',
    headerFooter: true
  })
  formatDialogVisible.value = true
}

// 保存格式配置
const saveFormatConfig = () => {
  ElMessage.success('格式配置已保存')
  formatDialogVisible.value = false
}

// 预览报表
const handlePreview = (row: ReportTemplate) => {
  selectedTemplate.value = row
  previewDialogVisible.value = true
}

// 生成报表
const handleGenerate = (row: ReportTemplate) => {
  isGenerating.value = true
  generateProgress.value = 0
  
  const timer = setInterval(() => {
    generateProgress.value += 10
    if (generateProgress.value >= 100) {
      clearInterval(timer)
      isGenerating.value = false
      ElMessage.success('报表生成成功')
      
      // 更新状态
      const index = templateList.value.findIndex(item => item.id === row.id)
      if (index > -1) {
        templateList.value[index].status = 'ready'
      }
    }
  }, 300)
}

// 导出报表
const handleExport = (row: ReportTemplate, format: string) => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success(`正在导出为 ${format.toUpperCase()} 格式...`)
  }, 1000)
}

// 批量导出
const handleBatchExport = () => {
  ElMessage.info('批量导出功能开发中...')
}

// 刷新列表
const handleRefresh = () => {
  loadTemplates()
  ElMessage.success('列表已刷新')
}

// 组件挂载时加载数据
onMounted(() => {
  loadTemplates()
})
</script>

<template>
  <div class="report-export-container">
    <!-- 顶部操作栏 -->
    <el-card class="header-card" shadow="never">
      <div class="header-content">
        <div class="left-actions">
          <el-button type="primary" :icon="Plus" @click="handleAdd">
            新增模板
          </el-button>
          <el-button :icon="Download" @click="handleBatchExport">
            批量导出
          </el-button>
          <el-button :icon="Refresh" @click="handleRefresh">
            刷新
          </el-button>
        </div>
        <div class="right-filters">
          <el-select
            v-model="filterType"
            placeholder="报表类型"
            clearable
            style="width: 150px; margin-right: 10px"
          >
            <el-option
              v-for="item in reportTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-select
            v-model="filterStatus"
            placeholder="状态"
            clearable
            style="width: 120px; margin-right: 10px"
          >
            <el-option label="就绪" value="ready" />
            <el-option label="生成中" value="generating" />
            <el-option label="失败" value="failed" />
          </el-select>
          <el-input
            v-model="searchText"
            placeholder="搜索模板名称或描述"
            :prefix-icon="Search"
            style="width: 250px"
            clearable
          />
        </div>
      </div>
    </el-card>

    <!-- 主体内容 -->
    <el-card class="main-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="filteredTemplates"
        style="width: 100%"
        stripe
        border
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        
        <el-table-column prop="name" label="模板名称" min-width="200">
          <template #default="{ row }">
            <div class="template-name">
              <el-icon style="margin-right: 5px"><Document /></el-icon>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="type" label="报表类型" width="150" align="center">
          <template #default="{ row }">
            <el-tag type="info">
              {{ reportTypes.find(t => t.value === row.type)?.label }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        
        <el-table-column prop="dataSource" label="数据源" width="180">
          <template #default="{ row }">
            <el-tag
              v-for="source in row.dataSource.slice(0, 2)"
              :key="source"
              size="small"
              style="margin-right: 5px"
            >
              {{ dataSourceOptions.find(d => d.value === source)?.label }}
            </el-tag>
            <el-tag v-if="row.dataSource.length > 2" size="small">
              +{{ row.dataSource.length - 2 }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="format" label="导出格式" width="150">
          <template #default="{ row }">
            <el-tag
              v-for="fmt in row.format"
              :key="fmt"
              size="small"
              type="success"
              style="margin-right: 3px"
            >
              {{ fmt.toUpperCase() }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="createTime" label="创建时间" width="160" align="center" />
        
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="400" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              :icon="Setting"
              @click="handleDesign(row)"
              link
            >
              设计
            </el-button>
            <el-button
              type="success"
              size="small"
              :icon="Connection"
              @click="handleConfigDataSource(row)"
              link
            >
              数据源
            </el-button>
            <el-button
              type="warning"
              size="small"
              :icon="Picture"
              @click="handleConfigFormat(row)"
              link
            >
              格式
            </el-button>
            <el-button
              type="info"
              size="small"
              :icon="View"
              @click="handlePreview(row)"
              link
            >
              预览
            </el-button>
            <el-button
              size="small"
              :icon="Edit"
              @click="handleEdit(row)"
              link
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              size="small"
              :icon="Delete"
              @click="handleDelete(row)"
              link
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑模板对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="reportFormRef"
        :model="reportForm"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="reportForm.name" placeholder="请输入模板名称" />
        </el-form-item>
        
        <el-form-item label="报表类型" prop="type">
          <el-select v-model="reportForm.type" placeholder="请选择报表类型" style="width: 100%">
            <el-option
              v-for="item in reportTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="模板描述" prop="description">
          <el-input
            v-model="reportForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入模板描述"
          />
        </el-form-item>
        
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="reportForm.timeRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="数据源" prop="dataSource">
          <el-select
            v-model="reportForm.dataSource"
            multiple
            placeholder="请选择数据源"
            style="width: 100%"
          >
            <el-option
              v-for="item in dataSourceOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="导出格式" prop="format">
          <el-checkbox-group v-model="reportForm.format">
            <el-checkbox
              v-for="item in formatOptions"
              :key="item.value"
              :label="item.value"
            >
              {{ item.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSave">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 报表设计对话框 -->
    <el-dialog
      v-model="designDialogVisible"
      title="报表设计器"
      width="90%"
      top="5vh"
      :close-on-click-modal="false"
    >
      <div class="design-container">
        <!-- 左侧组件库 -->
        <div class="component-library">
          <div class="library-title">组件库</div>
          <div class="component-list">
            <div
              v-for="comp in componentTypes"
              :key="comp.value"
              class="component-item"
              @click="addComponent(comp.value)"
            >
              <el-icon><component :is="comp.icon" /></el-icon>
              <span>{{ comp.label }}</span>
            </div>
          </div>
        </div>
        
        <!-- 中间设计区 -->
        <div class="design-canvas">
          <div class="canvas-title">设计区域</div>
          <div class="canvas-content">
            <div
              v-for="comp in reportComponents"
              :key="comp.id"
              class="canvas-component"
            >
              <div class="component-header">
                <span>{{ comp.title }}</span>
                <el-button
                  type="danger"
                  size="small"
                  :icon="Delete"
                  circle
                  @click="removeComponent(comp.id)"
                />
              </div>
              <div class="component-body">
                <el-tag>{{ comp.type }}</el-tag>
              </div>
            </div>
            <el-empty v-if="reportComponents.length === 0" description="拖拽左侧组件到此处开始设计" />
          </div>
        </div>
        
        <!-- 右侧属性配置 -->
        <div class="property-panel">
          <div class="panel-title">属性配置</div>
          <div class="panel-content">
            <el-form label-width="80px" size="small">
              <el-form-item label="报表标题">
                <el-input placeholder="请输入标题" />
              </el-form-item>
              <el-form-item label="统计指标">
                <el-select placeholder="选择指标" style="width: 100%">
                  <el-option label="产量" value="output" />
                  <el-option label="合格率" value="quality" />
                  <el-option label="效率" value="efficiency" />
                </el-select>
              </el-form-item>
              <el-form-item label="数据维度">
                <el-select placeholder="选择维度" style="width: 100%">
                  <el-option label="按日期" value="date" />
                  <el-option label="按产品" value="product" />
                  <el-option label="按区域" value="region" />
                </el-select>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="designDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="designDialogVisible = false">
          保存设计
        </el-button>
      </template>
    </el-dialog>

    <!-- 数据源配置对话框 -->
    <el-dialog
      v-model="dataSourceDialogVisible"
      title="数据源配置"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form :model="dataSourceConfig" label-width="120px">
        <el-form-item label="数据源名称">
          <el-input v-model="dataSourceConfig.name" disabled />
        </el-form-item>
        
        <el-form-item label="数据类型">
          <el-select v-model="dataSourceConfig.type" placeholder="选择数据类型" style="width: 100%">
            <el-option
              v-for="item in dataSourceOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="筛选条件">
          <el-input placeholder="配置数据筛选规则" />
        </el-form-item>
        
        <el-form-item label="分组规则">
          <el-select multiple placeholder="选择分组字段" style="width: 100%">
            <el-option label="日期" value="date" />
            <el-option label="产品类型" value="productType" />
            <el-option label="生产线" value="productionLine" />
            <el-option label="区域" value="region" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="更新频率">
          <el-radio-group v-model="dataSourceConfig.updateFrequency">
            <el-radio
              v-for="item in updateFrequencyOptions"
              :key="item.value"
              :label="item.value"
            >
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="缓存策略">
          <el-switch active-text="启用缓存" inactive-text="禁用缓存" />
        </el-form-item>
        
        <el-form-item label="数据关联">
          <el-button :icon="Connection" size="small">配置多数据源关联</el-button>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dataSourceDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveDataSourceConfig">
          保存配置
        </el-button>
      </template>
    </el-dialog>

    <!-- 格式设置对话框 -->
    <el-dialog
      v-model="formatDialogVisible"
      title="报表格式设置"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form :model="styleConfig" label-width="120px">
        <el-form-item label="主题颜色">
          <el-color-picker v-model="styleConfig.theme" />
        </el-form-item>
        
        <el-form-item label="字体大小">
          <el-slider v-model="styleConfig.fontSize" :min="10" :max="24" show-input />
        </el-form-item>
        
        <el-form-item label="页面布局">
          <el-radio-group v-model="styleConfig.layout">
            <el-radio label="portrait">纵向</el-radio>
            <el-radio label="landscape">横向</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="页面大小">
          <el-select placeholder="选择页面大小" style="width: 200px">
            <el-option label="A4" value="a4" />
            <el-option label="A3" value="a3" />
            <el-option label="Letter" value="letter" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="水印">
          <el-input v-model="styleConfig.watermark" placeholder="输入水印文字" />
        </el-form-item>
        
        <el-form-item label="页眉页脚">
          <el-switch v-model="styleConfig.headerFooter" />
        </el-form-item>
        
        <el-form-item label="打印参数">
          <el-button :icon="Setting" size="small">高级设置</el-button>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="formatDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveFormatConfig">
          保存配置
        </el-button>
      </template>
    </el-dialog>

    <!-- 预览对话框 -->
    <el-dialog
      v-model="previewDialogVisible"
      title="报表预览"
      width="80%"
      top="5vh"
    >
      <div class="preview-container">
        <div class="preview-toolbar">
          <el-button
            v-for="fmt in formatOptions"
            :key="fmt.value"
            :icon="Download"
            size="small"
            @click="selectedTemplate && handleExport(selectedTemplate, fmt.value)"
          >
            导出为 {{ fmt.label }}
          </el-button>
          <el-button
            type="primary"
            :icon="Refresh"
            size="small"
            :loading="isGenerating"
            @click="selectedTemplate && handleGenerate(selectedTemplate)"
          >
            重新生成
          </el-button>
        </div>
        
        <el-progress
          v-if="isGenerating"
          :percentage="generateProgress"
          :stroke-width="20"
          striped
          striped-flow
        />
        
        <div class="preview-content">
          <div class="preview-page">
            <h2>{{ selectedTemplate?.name }}</h2>
            <p class="preview-desc">{{ selectedTemplate?.description }}</p>
            
            <el-row :gutter="20" style="margin-top: 30px">
              <el-col :span="12">
                <el-card shadow="hover">
                  <template #header>
                    <span>统计图表示例</span>
                  </template>
                  <div style="height: 200px; display: flex; align-items: center; justify-content: center">
                    <el-icon :size="60" color="#409EFF"><Picture /></el-icon>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="12">
                <el-card shadow="hover">
                  <template #header>
                    <span>数据表格示例</span>
                  </template>
                  <div style="height: 200px; display: flex; align-items: center; justify-content: center">
                    <el-icon :size="60" color="#67C23A"><Document /></el-icon>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.report-export-container {

  .header-card {
    margin-bottom: 20px;

    :deep(.el-card__body) {
      padding: 15px 20px;
    }
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .left-actions {
      display: flex;
      gap: 10px;
    }

    .right-filters {
      display: flex;
      align-items: center;
    }
  }

  .main-card {
    :deep(.el-card__body) {
      padding: 20px;
    }
  }

  .template-name {
    display: flex;
    align-items: center;
    font-weight: 500;
  }

  // 设计器样式
  .design-container {
    display: flex;
    height: 600px;
    gap: 15px;

    .component-library {
      width: 200px;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      overflow: hidden;

      .library-title {
        padding: 12px;
        background: #f5f7fa;
        font-weight: 600;
        border-bottom: 1px solid #dcdfe6;
      }

      .component-list {
        padding: 10px;

        .component-item {
          display: flex;
          align-items: center;
          padding: 10px;
          margin-bottom: 8px;
          background: #fff;
          border: 1px solid #dcdfe6;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s;

          &:hover {
            background: #ecf5ff;
            border-color: #409eff;
            transform: translateY(-2px);
          }

          .el-icon {
            margin-right: 8px;
            font-size: 18px;
          }
        }
      }
    }

    .design-canvas {
      flex: 1;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      overflow: hidden;
      display: flex;
      flex-direction: column;

      .canvas-title {
        padding: 12px;
        background: #f5f7fa;
        font-weight: 600;
        border-bottom: 1px solid #dcdfe6;
      }

      .canvas-content {
        flex: 1;
        padding: 15px;
        background: #fafafa;
        overflow-y: auto;

        .canvas-component {
          margin-bottom: 15px;
          border: 2px dashed #dcdfe6;
          border-radius: 4px;
          background: #fff;
          transition: all 0.3s;

          &:hover {
            border-color: #409eff;
            box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
          }

          .component-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 15px;
            background: #f5f7fa;
            border-bottom: 1px solid #dcdfe6;
            font-weight: 500;
          }

          .component-body {
            padding: 30px;
            text-align: center;
          }
        }
      }
    }

    .property-panel {
      width: 250px;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      overflow: hidden;

      .panel-title {
        padding: 12px;
        background: #f5f7fa;
        font-weight: 600;
        border-bottom: 1px solid #dcdfe6;
      }

      .panel-content {
        padding: 15px;
        max-height: 550px;
        overflow-y: auto;
      }
    }
  }

  // 预览样式
  .preview-container {
    .preview-toolbar {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid #dcdfe6;
    }

    .preview-content {
      .preview-page {
        padding: 30px;
        background: #fff;
        min-height: 500px;

        h2 {
          margin: 0 0 10px 0;
          color: #303133;
          font-size: 24px;
        }

        .preview-desc {
          margin: 0 0 20px 0;
          color: #606266;
          font-size: 14px;
        }
      }
    }
  }
}

// 响应式设计
@media screen and (max-width: 1200px) {
  .design-container {
    .component-library,
    .property-panel {
      width: 180px;
    }
  }
}

@media screen and (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 15px;

    .left-actions,
    .right-filters {
      width: 100%;
      flex-wrap: wrap;
    }
  }

  .design-container {
    flex-direction: column;
    height: auto;

    .component-library,
    .property-panel {
      width: 100%;
    }

    .design-canvas {
      min-height: 400px;
    }
  }
}

// 打印样式
@media print {
  .preview-toolbar {
    display: none !important;
  }

  .preview-content {
    .preview-page {
      padding: 0;
    }
  }
}
</style>