<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Plus,
  Edit,
  Delete,
  View,
  CopyDocument,
  Download,
  Upload,
  VideoPlay,
  RefreshLeft
} from '@element-plus/icons-vue'

// 表单组件类型定义
interface FormComponent {
  id: string
  type: string
  label: string
  icon: string
  defaultProps: Record<string, any>
}

// 设计画布中的组件实例
interface ComponentInstance {
  id: string
  type: string
  label: string
  props: Record<string, any>
  style: Record<string, any>
}

// 模板数据类型
interface Template {
  id: number
  name: string
  type: string
  createTime: string
  status: string
  useCount: number
  components: ComponentInstance[]
}

// 表单模板列表数据
const tableData = ref<Template[]>([])
const loading = ref(false)
const searchForm = reactive({
  name: '',
  type: '',
  status: ''
})

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 表单类型选项
const formTypeOptions = [
  { label: '全部', value: '' },
  { label: '基础表单', value: 'basic' },
  { label: '高级表单', value: 'advanced' },
  { label: '动态表单', value: 'dynamic' },
  { label: '分步表单', value: 'step' }
]

// 状态选项
const statusOptions = [
  { label: '全部', value: '' },
  { label: '可用', value: 'active' },
  { label: '测试中', value: 'testing' },
  { label: '禁用', value: 'disabled' }
]

// 可视化设计器相关
const designerVisible = ref(false)
const currentTemplate = ref<Template | null>(null)
const isEditMode = ref(false)

// 左侧组件库
const componentLibrary: FormComponent[] = [
  {
    id: 'input',
    type: 'input',
    label: '单行文本',
    icon: '📝',
    defaultProps: {
      placeholder: '请输入',
      clearable: true,
      disabled: false,
      required: false
    }
  },
  {
    id: 'textarea',
    type: 'textarea',
    label: '多行文本',
    icon: '📄',
    defaultProps: {
      placeholder: '请输入',
      rows: 3,
      maxlength: 500,
      showWordLimit: true,
      required: false
    }
  },
  {
    id: 'number',
    type: 'number',
    label: '数字输入',
    icon: '🔢',
    defaultProps: {
      placeholder: '请输入数字',
      min: 0,
      max: 100,
      step: 1,
      required: false
    }
  },
  {
    id: 'select',
    type: 'select',
    label: '下拉选择',
    icon: '📋',
    defaultProps: {
      placeholder: '请选择',
      clearable: true,
      multiple: false,
      options: [
        { label: '选项1', value: '1' },
        { label: '选项2', value: '2' }
      ],
      required: false
    }
  },
  {
    id: 'radio',
    type: 'radio',
    label: '单选框',
    icon: '🔘',
    defaultProps: {
      options: [
        { label: '选项1', value: '1' },
        { label: '选项2', value: '2' }
      ],
      required: false
    }
  },
  {
    id: 'checkbox',
    type: 'checkbox',
    label: '多选框',
    icon: '☑️',
    defaultProps: {
      options: [
        { label: '选项1', value: '1' },
        { label: '选项2', value: '2' }
      ],
      required: false
    }
  },
  {
    id: 'date',
    type: 'date',
    label: '日期选择',
    icon: '📅',
    defaultProps: {
      placeholder: '请选择日期',
      type: 'date',
      format: 'YYYY-MM-DD',
      required: false
    }
  },
  {
    id: 'time',
    type: 'time',
    label: '时间选择',
    icon: '⏰',
    defaultProps: {
      placeholder: '请选择时间',
      format: 'HH:mm:ss',
      required: false
    }
  },
  {
    id: 'upload',
    type: 'upload',
    label: '文件上传',
    icon: '📎',
    defaultProps: {
      accept: '*',
      multiple: false,
      limit: 5,
      required: false
    }
  },
  {
    id: 'switch',
    type: 'switch',
    label: '开关',
    icon: '🔄',
    defaultProps: {
      activeText: '是',
      inactiveText: '否',
      required: false
    }
  },
  {
    id: 'slider',
    type: 'slider',
    label: '滑块',
    icon: '🎚️',
    defaultProps: {
      min: 0,
      max: 100,
      step: 1,
      showStops: false,
      required: false
    }
  },
  {
    id: 'rate',
    type: 'rate',
    label: '评分',
    icon: '⭐',
    defaultProps: {
      max: 5,
      allowHalf: false,
      required: false
    }
  }
]

// 中间设计画布中的组件
const canvasComponents = ref<ComponentInstance[]>([])

// 右侧选中的组件
const selectedComponent = ref<ComponentInstance | null>(null)

// 模板表单
const templateForm = reactive({
  name: '',
  type: '',
  description: ''
})

// 初始化表格数据
const initTableData = () => {
  loading.value = true
  setTimeout(() => {
    const mockData: Template[] = [
      {
        id: 1,
        name: '用户注册表单',
        type: 'basic',
        createTime: '2024-01-15 10:30:00',
        status: 'active',
        useCount: 156,
        components: []
      },
      {
        id: 2,
        name: '客户信息采集表',
        type: 'advanced',
        createTime: '2024-01-18 14:20:00',
        status: 'active',
        useCount: 89,
        components: []
      },
      {
        id: 3,
        name: '订单提交表单',
        type: 'dynamic',
        createTime: '2024-02-05 09:15:00',
        status: 'testing',
        useCount: 45,
        components: []
      },
      {
        id: 4,
        name: '员工入职表单',
        type: 'step',
        createTime: '2024-02-10 16:45:00',
        status: 'active',
        useCount: 234,
        components: []
      },
      {
        id: 5,
        name: '问卷调查表单',
        type: 'basic',
        createTime: '2024-02-15 11:20:00',
        status: 'disabled',
        useCount: 12,
        components: []
      },
      {
        id: 6,
        name: '反馈意见表单',
        type: 'basic',
        createTime: '2024-02-20 13:50:00',
        status: 'active',
        useCount: 67,
        components: []
      },
      {
        id: 7,
        name: '产品配置表单',
        type: 'advanced',
        createTime: '2024-02-22 10:10:00',
        status: 'testing',
        useCount: 28,
        components: []
      },
      {
        id: 8,
        name: '合同审批表单',
        type: 'step',
        createTime: '2024-02-25 15:30:00',
        status: 'active',
        useCount: 143,
        components: []
      }
    ]
    
    // 筛选数据
    let filteredData = mockData
    if (searchForm.name) {
      filteredData = filteredData.filter(item => 
        item.name.toLowerCase().includes(searchForm.name.toLowerCase())
      )
    }
    if (searchForm.type) {
      filteredData = filteredData.filter(item => item.type === searchForm.type)
    }
    if (searchForm.status) {
      filteredData = filteredData.filter(item => item.status === searchForm.status)
    }
    
    total.value = filteredData.length
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    tableData.value = filteredData.slice(start, end)
    loading.value = false
  }, 500)
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  initTableData()
}

// 重置
const handleReset = () => {
  searchForm.name = ''
  searchForm.type = ''
  searchForm.status = ''
  currentPage.value = 1
  initTableData()
}

// 获取状态标签类型
const getStatusType = (status: string) => {
  const typeMap: Record<string, any> = {
    active: 'success',
    testing: 'primary',
    disabled: 'info'
  }
  return typeMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    active: '可用',
    testing: '测试中',
    disabled: '禁用'
  }
  return textMap[status] || status
}

// 获取表单类型文本
const getFormTypeText = (type: string) => {
  const textMap: Record<string, string> = {
    basic: '基础表单',
    advanced: '高级表单',
    dynamic: '动态表单',
    step: '分步表单'
  }
  return textMap[type] || type
}

// 打开设计器（新建）
const handleCreate = () => {
  isEditMode.value = false
  currentTemplate.value = null
  templateForm.name = ''
  templateForm.type = 'basic'
  templateForm.description = ''
  canvasComponents.value = []
  selectedComponent.value = null
  designerVisible.value = true
}

// 打开设计器（编辑）
const handleEdit = (row: Template) => {
  isEditMode.value = true
  currentTemplate.value = row
  templateForm.name = row.name
  templateForm.type = row.type
  templateForm.description = ''
  canvasComponents.value = [...row.components]
  selectedComponent.value = null
  designerVisible.value = true
}

// 预览模板
const handleView = (row: Template) => {
  ElMessage.info(`预览模板：${row.name}`)
}

// 复制模板
const handleCopy = (row: Template) => {
  ElMessageBox.confirm('确认要复制该模板吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(() => {
    ElMessage.success('复制成功')
    initTableData()
  }).catch(() => {})
}

// 删除模板
const handleDelete = (row: Template) => {
  ElMessageBox.confirm('确认要删除该模板吗？此操作不可恢复！', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('删除成功')
    initTableData()
  }).catch(() => {})
}

// 导出模板
const handleExport = (row: Template) => {
  ElMessage.success(`导出模板：${row.name}`)
}

// 导入模板
const handleImport = () => {
  ElMessage.info('导入模板功能')
}

// 拖拽开始
const handleDragStart = (event: DragEvent, component: FormComponent) => {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData('component', JSON.stringify(component))
  }
}

// 拖拽到画布
const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    const componentData = JSON.parse(event.dataTransfer.getData('component'))
    const newComponent: ComponentInstance = {
      id: `${componentData.type}_${Date.now()}`,
      type: componentData.type,
      label: componentData.label,
      props: { ...componentData.defaultProps },
      style: {
        width: '100%',
        marginBottom: '20px'
      }
    }
    canvasComponents.value.push(newComponent)
    ElMessage.success('添加组件成功')
  }
}

// 允许拖放
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
}

// 选中组件
const selectComponent = (component: ComponentInstance) => {
  selectedComponent.value = component
}

// 删除画布中的组件
const removeComponent = (component: ComponentInstance) => {
  const index = canvasComponents.value.findIndex(c => c.id === component.id)
  if (index > -1) {
    canvasComponents.value.splice(index, 1)
    if (selectedComponent.value?.id === component.id) {
      selectedComponent.value = null
    }
    ElMessage.success('删除组件成功')
  }
}

// 组件上移
const moveComponentUp = (component: ComponentInstance) => {
  const index = canvasComponents.value.findIndex(c => c.id === component.id)
  if (index > 0) {
    const temp = canvasComponents.value[index]
    canvasComponents.value[index] = canvasComponents.value[index - 1]
    canvasComponents.value[index - 1] = temp
  }
}

// 组件下移
const moveComponentDown = (component: ComponentInstance) => {
  const index = canvasComponents.value.findIndex(c => c.id === component.id)
  if (index < canvasComponents.value.length - 1) {
    const temp = canvasComponents.value[index]
    canvasComponents.value[index] = canvasComponents.value[index + 1]
    canvasComponents.value[index + 1] = temp
  }
}

// 保存模板
const handleSaveTemplate = () => {
  if (!templateForm.name) {
    ElMessage.warning('请输入模板名称')
    return
  }
  if (!templateForm.type) {
    ElMessage.warning('请选择表单类型')
    return
  }
  if (canvasComponents.value.length === 0) {
    ElMessage.warning('请至少添加一个表单组件')
    return
  }
  
  // 模拟保存
  setTimeout(() => {
    ElMessage.success(isEditMode.value ? '保存成功' : '创建成功')
    designerVisible.value = false
    initTableData()
  }, 500)
}

// 清空画布
const handleClearCanvas = () => {
  ElMessageBox.confirm('确认要清空画布吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    canvasComponents.value = []
    selectedComponent.value = null
    ElMessage.success('清空成功')
  }).catch(() => {})
}

// 组件库分类
const componentCategories = computed(() => [
  {
    name: '基础组件',
    components: componentLibrary.filter(c => 
      ['input', 'textarea', 'number'].includes(c.type)
    )
  },
  {
    name: '选择组件',
    components: componentLibrary.filter(c => 
      ['select', 'radio', 'checkbox'].includes(c.type)
    )
  },
  {
    name: '日期时间',
    components: componentLibrary.filter(c => 
      ['date', 'time'].includes(c.type)
    )
  },
  {
    name: '其他组件',
    components: componentLibrary.filter(c => 
      ['upload', 'switch', 'slider', 'rate'].includes(c.type)
    )
  }
])

// 初始化
initTableData()
</script>

<template>
  <div class="form-template-page">
    <!-- 搜索栏 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline>
        <el-form-item label="模板名称">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入模板名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="表单类型">
          <el-select
            v-model="searchForm.type"
            placeholder="请选择"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="item in formTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择"
            clearable
            style="width: 120px"
          >
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">
            搜索
          </el-button>
          <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作栏 -->
    <el-card class="action-card" shadow="never">
      <el-button type="primary" :icon="Plus" @click="handleCreate">
        新建模板
      </el-button>
      <el-button :icon="Upload" @click="handleImport">导入模板</el-button>
    </el-card>

    <!-- 表格 -->
    <el-card class="table-card" shadow="never">
      <el-table :data="tableData" :loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="name" label="模板名称" min-width="180" />
        <el-table-column prop="type" label="表单类型" width="120" align="center">
          <template #default="{ row }">
            {{ getFormTypeText(row.type) }}
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
        <el-table-column prop="useCount" label="使用次数" width="100" align="center" />
        <el-table-column label="操作" width="280" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              :icon="Edit"
              size="small"
              link
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              type="success"
              :icon="View"
              size="small"
              link
              @click="handleView(row)"
            >
              预览
            </el-button>
            <el-button
              type="info"
              :icon="CopyDocument"
              size="small"
              link
              @click="handleCopy(row)"
            >
              复制
            </el-button>
            <el-button
              type="warning"
              :icon="Download"
              size="small"
              link
              @click="handleExport(row)"
            >
              导出
            </el-button>
            <el-button
              type="danger"
              :icon="Delete"
              size="small"
              link
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="initTableData"
          @current-change="initTableData"
        />
      </div>
    </el-card>

    <!-- 可视化设计器对话框 -->
    <el-dialog
      v-model="designerVisible"
      :title="isEditMode ? '编辑表单模板' : '新建表单模板'"
      width="95%"
      top="3vh"
      :close-on-click-modal="false"
      class="designer-dialog"
    >
      <!-- 模板基本信息 -->
      <el-form :model="templateForm" inline class="template-info-form">
        <el-form-item label="模板名称" required>
          <el-input
            v-model="templateForm.name"
            placeholder="请输入模板名称"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="表单类型" required>
          <el-select v-model="templateForm.type" style="width: 150px">
            <el-option label="基础表单" value="basic" />
            <el-option label="高级表单" value="advanced" />
            <el-option label="动态表单" value="dynamic" />
            <el-option label="分步表单" value="step" />
          </el-select>
        </el-form-item>
        <el-form-item label="模板描述">
          <el-input
            v-model="templateForm.description"
            placeholder="请输入模板描述"
            style="width: 300px"
          />
        </el-form-item>
      </el-form>

      <el-divider />

      <!-- 三栏布局：组件库、设计画布、属性配置 -->
      <div class="designer-container">
        <!-- 左侧：组件库 -->
        <div class="component-library">
          <div class="library-title">
            <span>组件库</span>
          </div>
          <div class="library-content">
            <div
              v-for="category in componentCategories"
              :key="category.name"
              class="component-category"
            >
              <div class="category-title">{{ category.name }}</div>
              <div class="category-components">
                <div
                  v-for="component in category.components"
                  :key="component.id"
                  class="component-item"
                  draggable="true"
                  @dragstart="handleDragStart($event, component)"
                >
                  <span class="component-icon">{{ component.icon }}</span>
                  <span class="component-label">{{ component.label }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 中间：设计画布 -->
        <div class="design-canvas">
          <div class="canvas-toolbar">
            <span class="canvas-title">设计画布</span>
            <el-button size="small" @click="handleClearCanvas">清空画布</el-button>
          </div>
          <div
            class="canvas-content"
            @drop="handleDrop"
            @dragover="handleDragOver"
          >
            <div v-if="canvasComponents.length === 0" class="canvas-empty">
              <p>从左侧拖拽组件到此处开始设计表单</p>
            </div>
            <div
              v-for="component in canvasComponents"
              :key="component.id"
              class="canvas-component"
              :class="{ active: selectedComponent?.id === component.id }"
              @click="selectComponent(component)"
            >
              <div class="component-content">
                <el-form-item :label="component.label" :required="component.props.required">
                  <!-- 渲染不同类型的组件 -->
                  <el-input
                    v-if="component.type === 'input'"
                    :placeholder="component.props.placeholder"
                    :clearable="component.props.clearable"
                    :disabled="component.props.disabled"
                  />
                  <el-input
                    v-else-if="component.type === 'textarea'"
                    type="textarea"
                    :placeholder="component.props.placeholder"
                    :rows="component.props.rows"
                    :maxlength="component.props.maxlength"
                    :show-word-limit="component.props.showWordLimit"
                  />
                  <el-input-number
                    v-else-if="component.type === 'number'"
                    :placeholder="component.props.placeholder"
                    :min="component.props.min"
                    :max="component.props.max"
                    :step="component.props.step"
                  />
                  <el-select
                    v-else-if="component.type === 'select'"
                    :placeholder="component.props.placeholder"
                    :clearable="component.props.clearable"
                    :multiple="component.props.multiple"
                  >
                    <el-option
                      v-for="option in component.props.options"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </el-select>
                  <el-radio-group v-else-if="component.type === 'radio'">
                    <el-radio
                      v-for="option in component.props.options"
                      :key="option.value"
                      :label="option.value"
                    >
                      {{ option.label }}
                    </el-radio>
                  </el-radio-group>
                  <el-checkbox-group v-else-if="component.type === 'checkbox'">
                    <el-checkbox
                      v-for="option in component.props.options"
                      :key="option.value"
                      :label="option.value"
                    >
                      {{ option.label }}
                    </el-checkbox>
                  </el-checkbox-group>
                  <el-date-picker
                    v-else-if="component.type === 'date'"
                    :placeholder="component.props.placeholder"
                    :type="component.props.type"
                    :format="component.props.format"
                  />
                  <el-time-picker
                    v-else-if="component.type === 'time'"
                    :placeholder="component.props.placeholder"
                    :format="component.props.format"
                  />
                  <el-upload
                    v-else-if="component.type === 'upload'"
                    :accept="component.props.accept"
                    :multiple="component.props.multiple"
                    :limit="component.props.limit"
                  >
                    <el-button type="primary" size="small">选择文件</el-button>
                  </el-upload>
                  <el-switch
                    v-else-if="component.type === 'switch'"
                    :active-text="component.props.activeText"
                    :inactive-text="component.props.inactiveText"
                  />
                  <el-slider
                    v-else-if="component.type === 'slider'"
                    :min="component.props.min"
                    :max="component.props.max"
                    :step="component.props.step"
                    :show-stops="component.props.showStops"
                  />
                  <el-rate
                    v-else-if="component.type === 'rate'"
                    :max="component.props.max"
                    :allow-half="component.props.allowHalf"
                  />
                </el-form-item>
              </div>
              <div class="component-actions">
                <el-button
                  type="primary"
                  size="small"
                  circle
                  title="上移"
                  @click.stop="moveComponentUp(component)"
                >
                  ↑
                </el-button>
                <el-button
                  type="primary"
                  size="small"
                  circle
                  title="下移"
                  @click.stop="moveComponentDown(component)"
                >
                  ↓
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  circle
                  title="删除"
                  @click.stop="removeComponent(component)"
                >
                  ✕
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：属性配置 -->
        <div class="property-panel">
          <div class="panel-title">
            <span>属性配置</span>
          </div>
          <div class="panel-content">
            <div v-if="!selectedComponent" class="panel-empty">
              <p>请选择一个组件进行配置</p>
            </div>
            <div v-else class="property-form">
              <el-form label-width="80px" label-position="top">
                <el-form-item label="字段标签">
                  <el-input v-model="selectedComponent.label" />
                </el-form-item>
                
                <el-divider />
                
                <!-- 通用属性 -->
                <div class="property-section">
                  <div class="section-title">基础属性</div>
                  
                  <el-form-item label="必填项">
                    <el-switch v-model="selectedComponent.props.required" />
                  </el-form-item>
                  
                  <el-form-item
                    v-if="['input', 'textarea', 'select', 'date', 'time'].includes(selectedComponent.type)"
                    label="占位符"
                  >
                    <el-input v-model="selectedComponent.props.placeholder" />
                  </el-form-item>
                  
                  <el-form-item v-if="selectedComponent.type === 'input'" label="可清空">
                    <el-switch v-model="selectedComponent.props.clearable" />
                  </el-form-item>
                  
                  <el-form-item v-if="selectedComponent.type === 'input'" label="禁用">
                    <el-switch v-model="selectedComponent.props.disabled" />
                  </el-form-item>
                  
                  <el-form-item v-if="selectedComponent.type === 'textarea'" label="行数">
                    <el-input-number v-model="selectedComponent.props.rows" :min="2" :max="10" />
                  </el-form-item>
                  
                  <el-form-item v-if="selectedComponent.type === 'number'" label="最小值">
                    <el-input-number v-model="selectedComponent.props.min" />
                  </el-form-item>
                  
                  <el-form-item v-if="selectedComponent.type === 'number'" label="最大值">
                    <el-input-number v-model="selectedComponent.props.max" />
                  </el-form-item>
                  
                  <el-form-item v-if="selectedComponent.type === 'number'" label="步长">
                    <el-input-number v-model="selectedComponent.props.step" :min="1" />
                  </el-form-item>
                  
                  <el-form-item v-if="selectedComponent.type === 'select'" label="多选">
                    <el-switch v-model="selectedComponent.props.multiple" />
                  </el-form-item>
                  
                  <el-form-item v-if="selectedComponent.type === 'rate'" label="最大值">
                    <el-input-number v-model="selectedComponent.props.max" :min="1" :max="10" />
                  </el-form-item>
                  
                  <el-form-item v-if="selectedComponent.type === 'rate'" label="允许半选">
                    <el-switch v-model="selectedComponent.props.allowHalf" />
                  </el-form-item>
                </div>
                
                <el-divider />
                
                <!-- 样式属性 -->
                <div class="property-section">
                  <div class="section-title">样式属性</div>
                  
                  <el-form-item label="宽度">
                    <el-input v-model="selectedComponent.style.width" placeholder="如: 100%, 200px" />
                  </el-form-item>
                  
                  <el-form-item label="下边距">
                    <el-input v-model="selectedComponent.style.marginBottom" placeholder="如: 20px" />
                  </el-form-item>
                </div>
              </el-form>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="designerVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveTemplate">保存模板</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.form-template-page {
  .search-card,
  .action-card,
  .table-card {
    margin-bottom: 20px;
  }

  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}

// 设计器对话框样式
.designer-dialog {
  .template-info-form {
    padding: 10px 0;
  }

  .designer-container {
    display: flex;
    height: 65vh;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    overflow: hidden;

    // 左侧组件库
    .component-library {
      width: 240px;
      border-right: 1px solid #e4e7ed;
      display: flex;
      flex-direction: column;
      background-color: #fafafa;

      .library-title {
        padding: 15px;
        font-weight: 600;
        font-size: 14px;
        border-bottom: 1px solid #e4e7ed;
        background-color: #fff;
      }

      .library-content {
        flex: 1;
        overflow-y: auto;
        padding: 10px;

        .component-category {
          margin-bottom: 15px;

          .category-title {
            font-size: 12px;
            color: #909399;
            margin-bottom: 8px;
            padding: 0 5px;
          }

          .category-components {
            display: flex;
            flex-direction: column;
            gap: 8px;

            .component-item {
              display: flex;
              align-items: center;
              padding: 10px 12px;
              background-color: #fff;
              border: 1px solid #e4e7ed;
              border-radius: 4px;
              cursor: move;
              transition: all 0.3s;

              &:hover {
                border-color: #409eff;
                box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
                transform: translateY(-2px);
              }

              .component-icon {
                font-size: 18px;
                margin-right: 8px;
              }

              .component-label {
                font-size: 13px;
                color: #606266;
              }
            }
          }
        }
      }
    }

    // 中间设计画布
    .design-canvas {
      flex: 1;
      display: flex;
      flex-direction: column;
      background-color: #fff;

      .canvas-toolbar {
        padding: 15px;
        border-bottom: 1px solid #e4e7ed;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: #fafafa;

        .canvas-title {
          font-weight: 600;
          font-size: 14px;
        }
      }

      .canvas-content {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        background-image: 
          linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 0),
          linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 0);
        background-size: 20px 20px;

        .canvas-empty {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #909399;
          font-size: 14px;
        }

        .canvas-component {
          position: relative;
          padding: 15px;
          margin-bottom: 15px;
          background-color: #fff;
          border: 2px solid transparent;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s;

          &:hover {
            border-color: #409eff;
            box-shadow: 0 2px 12px rgba(64, 158, 255, 0.15);

            .component-actions {
              opacity: 1;
            }
          }

          &.active {
            border-color: #409eff;
            box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.1);
          }

          .component-content {
            pointer-events: none;

            :deep(.el-form-item) {
              margin-bottom: 0;
            }
          }

          .component-actions {
            position: absolute;
            top: 5px;
            right: 5px;
            display: flex;
            gap: 5px;
            opacity: 0;
            transition: opacity 0.3s;

            .el-button {
              width: 28px;
              height: 28px;
              padding: 0;
              font-size: 14px;
            }
          }
        }
      }
    }

    // 右侧属性配置
    .property-panel {
      width: 280px;
      border-left: 1px solid #e4e7ed;
      display: flex;
      flex-direction: column;
      background-color: #fafafa;

      .panel-title {
        padding: 15px;
        font-weight: 600;
        font-size: 14px;
        border-bottom: 1px solid #e4e7ed;
        background-color: #fff;
      }

      .panel-content {
        flex: 1;
        overflow-y: auto;
        padding: 15px;

        .panel-empty {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #909399;
          font-size: 14px;
          text-align: center;
        }

        .property-form {
          .property-section {
            .section-title {
              font-size: 13px;
              font-weight: 600;
              color: #606266;
              margin-bottom: 15px;
            }

            :deep(.el-form-item) {
              margin-bottom: 18px;

              .el-form-item__label {
                padding: 0;
                line-height: 1.5;
                font-size: 12px;
                color: #606266;
                margin-bottom: 8px;
              }
            }
          }
        }
      }
    }
  }
}

// 滚动条样式
:deep(.el-dialog__body) {
  padding: 20px;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-thumb {
  background-color: #dcdfe6;
  border-radius: 4px;

  &:hover {
    background-color: #c0c4cc;
  }
}

::-webkit-scrollbar-track {
  background-color: #f5f7fa;
}
</style>