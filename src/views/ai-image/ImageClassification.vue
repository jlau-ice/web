<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import type { UploadProps, UploadUserFile, UploadFile } from 'element-plus'
import { 
  Upload as UploadIcon, 
  Download, 
  Delete, 
  View, 
  Setting,
  Refresh,
  Document,
  Picture,
  Plus,
  Edit,
  Check,
  Close
} from '@element-plus/icons-vue'

// 类型定义
type ProcessStatus = 'pending' | 'processing' | 'completed' | 'failed'
type TagType = 'subject' | 'scene' | 'product' | 'other'

// 识别标签
interface RecognitionTag {
  id: string
  name: string
  type: TagType
  confidence: number
  weight: number
  position?: {
    x: number
    y: number
    width: number
    height: number
  }
}

// 图像处理结果
interface ImageResult {
  id: string
  name: string
  url: string
  status: ProcessStatus
  progress: number
  tags: RecognitionTag[]
  uploadTime: string
  processTime?: string
  size: number
  dimensions?: {
    width: number
    height: number
  }
}

// 标签配置
interface TagConfig {
  id: string
  name: string
  type: TagType
  parentId?: string
  children?: TagConfig[]
  weight: number
  enabled: boolean
  relatedTags?: string[]
}

// 模型配置
interface ModelConfig {
  id: string
  name: string
  version: string
  enabled: boolean
  confidence: number
  threshold: number
  lastUpdated: string
}

// 统计数据
interface Statistics {
  totalImages: number
  processingImages: number
  completedImages: number
  failedImages: number
  avgConfidence: number
  avgProcessTime: number
  totalTags: number
}

// 数据导出配置
interface ExportConfig {
  format: 'json' | 'csv' | 'xml'
  includeImages: boolean
  includeMetadata: boolean
  confidenceFilter: number
}

// 响应式数据
const fileList = ref<UploadUserFile[]>([])
const imageResults = ref<ImageResult[]>([])
const selectedImage = ref<ImageResult | null>(null)
const showImageViewer = ref(false)

// 标签配置
const tagConfigs = ref<TagConfig[]>([])
const showTagDialog = ref(false)
const editingTag = ref<TagConfig | null>(null)
const tagForm = reactive({
  name: '',
  type: 'subject' as TagType,
  parentId: '',
  weight: 1,
  enabled: true
})

// 模型配置
const modelConfigs = ref<ModelConfig[]>([])
const showModelDialog = ref(false)
const editingModel = ref<ModelConfig | null>(null)

// 统计数据
const statistics = reactive<Statistics>({
  totalImages: 0,
  processingImages: 0,
  completedImages: 0,
  failedImages: 0,
  avgConfidence: 0,
  avgProcessTime: 0,
  totalTags: 0
})

// 筛选条件
const filterStatus = ref<ProcessStatus | 'all'>('all')
const filterTagType = ref<TagType | 'all'>('all')
const searchKeyword = ref('')

// 面板显示
const showConfigPanel = ref(true)
const activeConfigTab = ref('tags')

// 导出配置
const exportConfig = reactive<ExportConfig>({
  format: 'json',
  includeImages: false,
  includeMetadata: true,
  confidenceFilter: 0.5
})

// 标签类型配置
const tagTypeConfig = {
  subject: { label: '主体', color: '#409EFF' },
  scene: { label: '场景', color: '#67C23A' },
  product: { label: '商品', color: '#E6A23C' },
  other: { label: '其他', color: '#9370DB' }
}

// 状态配置
const statusConfig = {
  pending: { label: '待处理', color: '#909399' },
  processing: { label: '处理中', color: '#409EFF' },
  completed: { label: '完成', color: '#67C23A' },
  failed: { label: '失败', color: '#F56C6C' }
}

// 计算属性 - 筛选后的图像结果
const filteredImageResults = computed(() => {
  let results = imageResults.value

  if (filterStatus.value !== 'all') {
    results = results.filter(r => r.status === filterStatus.value)
  }

  if (filterTagType.value !== 'all') {
    results = results.filter(r => 
      r.tags.some(tag => tag.type === filterTagType.value)
    )
  }

  if (searchKeyword.value) {
    results = results.filter(r => 
      r.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      r.tags.some(tag => tag.name.toLowerCase().includes(searchKeyword.value.toLowerCase()))
    )
  }

  return results
})

// 计算属性 - 标签树结构
const tagTreeData = computed(() => {
  return buildTagTree(tagConfigs.value)
})

// 构建标签树
const buildTagTree = (tags: TagConfig[]): TagConfig[] => {
  const map = new Map<string, TagConfig>()
  const roots: TagConfig[] = []

  tags.forEach(tag => {
    map.set(tag.id, { ...tag, children: [] })
  })

  tags.forEach(tag => {
    const node = map.get(tag.id)!
    if (tag.parentId && map.has(tag.parentId)) {
      map.get(tag.parentId)!.children!.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
}

// 文件上传前校验
const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isImage) {
    ElMessage.error('只能上传图片文件！')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过 10MB！')
    return false
  }
  return true
}

// 文件上传变化
const handleFileChange: UploadProps['onChange'] = (file, files) => {
  fileList.value = files
}

// 开始批量处理
const startBatchProcess = () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请先上传图片！')
    return
  }

  fileList.value.forEach((file, index) => {
    setTimeout(() => {
      processImage(file)
    }, index * 500)
  })

  ElMessage.success('开始批量处理图片')
}

// 处理单个图像
const processImage = (file: UploadUserFile) => {
  const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const imageResult: ImageResult = {
    id: imageId,
    name: file.name,
    url: URL.createObjectURL(file.raw!),
    status: 'processing',
    progress: 0,
    tags: [],
    uploadTime: new Date().toLocaleString(),
    size: file.size || 0,
    dimensions: {
      width: 1920,
      height: 1080
    }
  }

  imageResults.value.unshift(imageResult)
  updateStatistics()

  // 模拟处理进度
  const progressInterval = setInterval(() => {
    const result = imageResults.value.find(r => r.id === imageId)
    if (result) {
      result.progress += Math.random() * 20
      if (result.progress >= 100) {
        result.progress = 100
        clearInterval(progressInterval)
        
        // 模拟识别完成
        setTimeout(() => {
          completeImageProcess(imageId)
        }, 500)
      }
    }
  }, 300)
}

// 完成图像处理
const completeImageProcess = (imageId: string) => {
  const result = imageResults.value.find(r => r.id === imageId)
  if (!result) return

  // 随机生成是否成功
  const isSuccess = Math.random() > 0.1

  if (isSuccess) {
    result.status = 'completed'
    result.processTime = new Date().toLocaleString()
    
    // 生成识别标签
    result.tags = generateMockTags()
    
    ElNotification({
      title: '处理完成',
      message: `${result.name} 识别完成，共识别 ${result.tags.length} 个标签`,
      type: 'success',
      duration: 3000
    })
  } else {
    result.status = 'failed'
    ElNotification({
      title: '处理失败',
      message: `${result.name} 处理失败，请重试`,
      type: 'error',
      duration: 3000
    })
  }

  updateStatistics()
}

// 生成模拟标签
const generateMockTags = (): RecognitionTag[] => {
  const mockTags = [
    { name: '人物', type: 'subject' as TagType, confidence: 0.95, weight: 1.0 },
    { name: '室内场景', type: 'scene' as TagType, confidence: 0.88, weight: 0.8 },
    { name: '办公室', type: 'scene' as TagType, confidence: 0.82, weight: 0.7 },
    { name: '笔记本电脑', type: 'product' as TagType, confidence: 0.91, weight: 0.9 },
    { name: '手机', type: 'product' as TagType, confidence: 0.87, weight: 0.85 },
    { name: '桌子', type: 'other' as TagType, confidence: 0.79, weight: 0.6 },
    { name: '椅子', type: 'other' as TagType, confidence: 0.75, weight: 0.5 },
    { name: '商务', type: 'subject' as TagType, confidence: 0.84, weight: 0.75 },
    { name: '现代', type: 'scene' as TagType, confidence: 0.80, weight: 0.7 },
    { name: '科技产品', type: 'product' as TagType, confidence: 0.89, weight: 0.85 }
  ]

  const numTags = Math.floor(Math.random() * 5) + 3
  const selectedTags = mockTags
    .sort(() => Math.random() - 0.5)
    .slice(0, numTags)
    .map((tag, index) => ({
      id: `tag_${Date.now()}_${index}`,
      ...tag,
      position: {
        x: Math.random() * 80,
        y: Math.random() * 80,
        width: Math.random() * 15 + 5,
        height: Math.random() * 15 + 5
      }
    }))

  return selectedTags
}

// 更新统计数据
const updateStatistics = () => {
  statistics.totalImages = imageResults.value.length
  statistics.processingImages = imageResults.value.filter(r => r.status === 'processing').length
  statistics.completedImages = imageResults.value.filter(r => r.status === 'completed').length
  statistics.failedImages = imageResults.value.filter(r => r.status === 'failed').length
  
  const completedResults = imageResults.value.filter(r => r.status === 'completed')
  if (completedResults.length > 0) {
    const totalConfidence = completedResults.reduce((sum, r) => {
      const avgTagConfidence = r.tags.reduce((s, t) => s + t.confidence, 0) / r.tags.length
      return sum + avgTagConfidence
    }, 0)
    statistics.avgConfidence = totalConfidence / completedResults.length
    statistics.totalTags = completedResults.reduce((sum, r) => sum + r.tags.length, 0)
  }
  
  statistics.avgProcessTime = Math.random() * 2 + 1 // 模拟处理时间
}

// 查看图像详情
const viewImageDetail = (image: ImageResult) => {
  selectedImage.value = image
  showImageViewer.value = true
}

// 重新处理
const reprocessImage = (image: ImageResult) => {
  image.status = 'processing'
  image.progress = 0
  image.tags = []
  
  const progressInterval = setInterval(() => {
    image.progress += Math.random() * 20
    if (image.progress >= 100) {
      image.progress = 100
      clearInterval(progressInterval)
      setTimeout(() => {
        completeImageProcess(image.id)
      }, 500)
    }
  }, 300)
  
  updateStatistics()
}

// 删除图像
const deleteImage = (image: ImageResult) => {
  const index = imageResults.value.findIndex(r => r.id === image.id)
  if (index > -1) {
    imageResults.value.splice(index, 1)
    ElMessage.success('删除成功')
    updateStatistics()
  }
}

// 清空所有结果
const clearAllResults = () => {
  imageResults.value = []
  fileList.value = []
  updateStatistics()
  ElMessage.success('已清空所有结果')
}

// 导出结果
const exportResults = () => {
  const completedResults = imageResults.value.filter(r => r.status === 'completed')
  
  if (completedResults.length === 0) {
    ElMessage.warning('没有可导出的结果')
    return
  }

  const exportData = completedResults
    .filter(r => {
      const avgConfidence = r.tags.reduce((sum, t) => sum + t.confidence, 0) / r.tags.length
      return avgConfidence >= exportConfig.confidenceFilter
    })
    .map(r => ({
      id: r.id,
      name: r.name,
      uploadTime: r.uploadTime,
      processTime: r.processTime,
      tags: r.tags.map(t => ({
        name: t.name,
        type: t.type,
        confidence: t.confidence,
        weight: t.weight
      })),
      ...(exportConfig.includeMetadata ? {
        size: r.size,
        dimensions: r.dimensions
      } : {}),
      ...(exportConfig.includeImages ? { url: r.url } : {})
    }))

  let content = ''
  let filename = `classification_results_${Date.now()}`

  if (exportConfig.format === 'json') {
    content = JSON.stringify(exportData, null, 2)
    filename += '.json'
  } else if (exportConfig.format === 'csv') {
    // 简化的CSV导出
    const headers = ['图像名称', '标签', '类型', '置信度', '权重', '上传时间', '处理时间']
    const rows: any[] = []
    exportData.forEach(r => {
      r.tags.forEach(t => {
        rows.push([
          r.name,
          t.name,
          tagTypeConfig[t.type].label,
          t.confidence.toFixed(2),
          t.weight.toFixed(2),
          r.uploadTime,
          r.processTime || '-'
        ])
      })
    })
    content = [headers, ...rows].map(row => row.join(',')).join('\n')
    filename += '.csv'
  } else if (exportConfig.format === 'xml') {
    content = '<?xml version="1.0" encoding="UTF-8"?>\n<results>\n'
    exportData.forEach(r => {
      content += `  <image name="${r.name}">\n`
      r.tags.forEach(t => {
        content += `    <tag name="${t.name}" type="${t.type}" confidence="${t.confidence}" weight="${t.weight}"/>\n`
      })
      content += `  </image>\n`
    })
    content += '</results>'
    filename += '.xml'
  }

  // 下载文件
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)

  ElMessage.success(`成功导出 ${exportData.length} 条结果`)
}

// 添加标签
const addTag = () => {
  editingTag.value = null
  tagForm.name = ''
  tagForm.type = 'subject'
  tagForm.parentId = ''
  tagForm.weight = 1
  tagForm.enabled = true
  showTagDialog.value = true
}

// 编辑标签
const editTag = (tag: TagConfig) => {
  editingTag.value = tag
  tagForm.name = tag.name
  tagForm.type = tag.type
  tagForm.parentId = tag.parentId || ''
  tagForm.weight = tag.weight
  tagForm.enabled = tag.enabled
  showTagDialog.value = true
}

// 保存标签
const saveTag = () => {
  if (!tagForm.name.trim()) {
    ElMessage.warning('请输入标签名称')
    return
  }

  if (editingTag.value) {
    // 编辑现有标签
    const tag = tagConfigs.value.find(t => t.id === editingTag.value!.id)
    if (tag) {
      tag.name = tagForm.name
      tag.type = tagForm.type
      tag.parentId = tagForm.parentId || undefined
      tag.weight = tagForm.weight
      tag.enabled = tagForm.enabled
      ElMessage.success('标签更新成功')
    }
  } else {
    // 添加新标签
    const newTag: TagConfig = {
      id: `tag_config_${Date.now()}`,
      name: tagForm.name,
      type: tagForm.type,
      parentId: tagForm.parentId || undefined,
      weight: tagForm.weight,
      enabled: tagForm.enabled,
      relatedTags: []
    }
    tagConfigs.value.push(newTag)
    ElMessage.success('标签添加成功')
  }

  showTagDialog.value = false
}

// 删除标签配置
const deleteTagConfig = (tag: TagConfig) => {
  const index = tagConfigs.value.findIndex(t => t.id === tag.id)
  if (index > -1) {
    tagConfigs.value.splice(index, 1)
    ElMessage.success('标签删除成功')
  }
}

// 导入标签模板
const importTagTemplate = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e: any) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const tags = JSON.parse(event.target?.result as string)
          tagConfigs.value = tags
          ElMessage.success('标签模板导入成功')
        } catch (error) {
          ElMessage.error('模板格式错误')
        }
      }
      reader.readAsText(file)
    }
  }
  input.click()
}

// 导出标签模板
const exportTagTemplate = () => {
  const content = JSON.stringify(tagConfigs.value, null, 2)
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `tag_template_${Date.now()}.json`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('标签模板导出成功')
}

// 配置模型
const configureModel = (model: ModelConfig) => {
  editingModel.value = model
  showModelDialog.value = true
}

// 保存模型配置
const saveModelConfig = () => {
  showModelDialog.value = false
  ElMessage.success('模型配置保存成功')
}

// 测试模型
const testModel = (model: ModelConfig) => {
  ElMessage.info(`正在测试模型 ${model.name}...`)
  
  setTimeout(() => {
    ElNotification({
      title: '模型测试完成',
      message: `模型 ${model.name} 测试通过，准确率: ${(Math.random() * 10 + 90).toFixed(2)}%`,
      type: 'success',
      duration: 3000
    })
  }, 2000)
}

// 初始化模拟数据
const initMockData = () => {
  // 初始化标签配置
  tagConfigs.value = [
    {
      id: 'tag1',
      name: '人物',
      type: 'subject',
      weight: 1.0,
      enabled: true,
      relatedTags: ['tag8']
    },
    {
      id: 'tag2',
      name: '场景',
      type: 'scene',
      weight: 0.9,
      enabled: true,
      relatedTags: []
    },
    {
      id: 'tag3',
      name: '室内',
      type: 'scene',
      parentId: 'tag2',
      weight: 0.8,
      enabled: true,
      relatedTags: []
    },
    {
      id: 'tag4',
      name: '室外',
      type: 'scene',
      parentId: 'tag2',
      weight: 0.8,
      enabled: true,
      relatedTags: []
    },
    {
      id: 'tag5',
      name: '商品',
      type: 'product',
      weight: 0.95,
      enabled: true,
      relatedTags: []
    },
    {
      id: 'tag6',
      name: '电子产品',
      type: 'product',
      parentId: 'tag5',
      weight: 0.9,
      enabled: true,
      relatedTags: []
    },
    {
      id: 'tag7',
      name: '服装',
      type: 'product',
      parentId: 'tag5',
      weight: 0.85,
      enabled: true,
      relatedTags: []
    },
    {
      id: 'tag8',
      name: '商务',
      type: 'subject',
      parentId: 'tag1',
      weight: 0.8,
      enabled: true,
      relatedTags: ['tag1']
    },
    {
      id: 'tag9',
      name: '休闲',
      type: 'subject',
      parentId: 'tag1',
      weight: 0.8,
      enabled: true,
      relatedTags: []
    },
    {
      id: 'tag10',
      name: '背景元素',
      type: 'other',
      weight: 0.6,
      enabled: true,
      relatedTags: []
    }
  ]

  // 初始化模型配置
  modelConfigs.value = [
    {
      id: 'model1',
      name: 'ResNet-50',
      version: 'v2.1.0',
      enabled: true,
      confidence: 0.85,
      threshold: 0.7,
      lastUpdated: '2024-10-25 10:30:00'
    },
    {
      id: 'model2',
      name: 'EfficientNet-B4',
      version: 'v1.8.2',
      enabled: true,
      confidence: 0.88,
      threshold: 0.75,
      lastUpdated: '2024-10-28 14:20:00'
    },
    {
      id: 'model3',
      name: 'Vision Transformer',
      version: 'v3.0.1',
      enabled: false,
      confidence: 0.92,
      threshold: 0.8,
      lastUpdated: '2024-10-20 16:45:00'
    },
    {
      id: 'model4',
      name: 'YOLO-v8',
      version: 'v8.0.3',
      enabled: true,
      confidence: 0.90,
      threshold: 0.78,
      lastUpdated: '2024-10-30 09:15:00'
    }
  ]

  updateStatistics()
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
}

// 格式化百分比tooltip
const formatPercentTooltip = (val: number): string => {
  return `${(val * 100).toFixed(0)}%`
}

// 获取状态标签类型
const getStatusTagType = (status: ProcessStatus) => {
  const map = {
    pending: 'info',
    processing: '',
    completed: 'success',
    failed: 'danger'
  }
  return map[status] as any
}

// 组件挂载时初始化
onMounted(() => {
  initMockData()
})
</script>

<template>
  <div class="image-classification-container">
    <!-- 顶部统计卡片 -->
    <el-row :gutter="16" class="statistics-row">
      <el-col :xs="12" :sm="6" :md="6" :lg="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #409EFF20">
              <el-icon :size="28" color="#409EFF"><Picture /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.totalImages }}</div>
              <div class="stat-label">总图像数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6" :md="6" :lg="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #67C23A20">
              <el-icon :size="28" color="#67C23A"><Check /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.completedImages }}</div>
              <div class="stat-label">已完成</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6" :md="6" :lg="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #E6A23C20">
              <el-icon :size="28" color="#E6A23C"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.totalTags }}</div>
              <div class="stat-label">识别标签</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6" :md="6" :lg="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #9370DB20">
              <el-icon :size="28" color="#9370DB"><Setting /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ (statistics.avgConfidence * 100).toFixed(1) }}%</div>
              <div class="stat-label">平均置信度</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 主体内容区域 -->
    <div class="main-content">
      <!-- 左侧：图像处理区 -->
      <div class="left-panel">
        <el-card class="upload-card">
          <template #header>
            <div class="card-header">
              <span>图像上传处理</span>
            </div>
          </template>
          
          <el-upload
            v-model:file-list="fileList"
            class="upload-area"
            drag
            multiple
            :auto-upload="false"
            :before-upload="beforeUpload"
            :on-change="handleFileChange"
            accept="image/*"
          >
            <el-icon class="upload-icon"><UploadIcon /></el-icon>
            <div class="upload-text">点击或拖拽图片到此处上传</div>
            <div class="upload-tip">支持 JPG、PNG、GIF 等格式，单个文件不超过 10MB</div>
          </el-upload>

          <div class="upload-actions">
            <el-button type="primary" :icon="Refresh" @click="startBatchProcess" :disabled="fileList.length === 0">
              开始批量处理
            </el-button>
            <el-button :icon="Delete" @click="clearAllResults">清空结果</el-button>
          </div>
        </el-card>

        <!-- 导出配置 -->
        <el-card class="export-card">
          <template #header>
            <div class="card-header">
              <span>数据导出配置</span>
            </div>
          </template>

          <el-form label-width="120px" size="small">
            <el-form-item label="导出格式">
              <el-radio-group v-model="exportConfig.format">
                <el-radio label="json">JSON</el-radio>
                <el-radio label="csv">CSV</el-radio>
                <el-radio label="xml">XML</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="包含图片">
              <el-switch v-model="exportConfig.includeImages" />
            </el-form-item>
            <el-form-item label="包含元数据">
              <el-switch v-model="exportConfig.includeMetadata" />
            </el-form-item>
            <el-form-item label="置信度过滤">
              <el-slider v-model="exportConfig.confidenceFilter" :min="0" :max="1" :step="0.05" :format-tooltip="formatPercentTooltip" />
            </el-form-item>
          </el-form>

          <el-button type="success" :icon="Download" @click="exportResults" style="width: 100%">
            导出结果数据
          </el-button>
        </el-card>
      </div>

      <!-- 中间：识别结果展示 -->
      <div class="middle-panel">
        <el-card class="results-card">
          <template #header>
            <div class="card-header">
              <span>识别结果</span>
              <div class="header-actions">
                <el-input
                  v-model="searchKeyword"
                  placeholder="搜索图片或标签"
                  :prefix-icon="'el-icon-search'"
                  size="small"
                  style="width: 200px; margin-right: 10px"
                  clearable
                />
                <el-select v-model="filterStatus" placeholder="状态筛选" size="small" style="width: 120px; margin-right: 10px">
                  <el-option label="全部状态" value="all" />
                  <el-option label="待处理" value="pending" />
                  <el-option label="处理中" value="processing" />
                  <el-option label="完成" value="completed" />
                  <el-option label="失败" value="failed" />
                </el-select>
                <el-select v-model="filterTagType" placeholder="标签类型" size="small" style="width: 120px">
                  <el-option label="全部类型" value="all" />
                  <el-option label="主体" value="subject" />
                  <el-option label="场景" value="scene" />
                  <el-option label="商品" value="product" />
                  <el-option label="其他" value="other" />
                </el-select>
              </div>
            </div>
          </template>

          <div class="results-list">
            <el-empty v-if="filteredImageResults.length === 0" description="暂无处理结果" />
            
            <div v-for="image in filteredImageResults" :key="image.id" class="result-item">
              <div class="result-image" @click="viewImageDetail(image)">
                <img :src="image.url" :alt="image.name" />
                <div v-if="image.status === 'processing'" class="processing-overlay">
                  <el-progress
                    type="circle"
                    :percentage="Math.floor(image.progress)"
                    :width="60"
                  />
                </div>
              </div>
              
              <div class="result-info">
                <div class="result-header">
                  <span class="result-name" :title="image.name">{{ image.name }}</span>
                  <el-tag :type="getStatusTagType(image.status)" size="small">
                    {{ statusConfig[image.status].label }}
                  </el-tag>
                </div>

                <div class="result-meta">
                  <span>{{ formatFileSize(image.size) }}</span>
                  <span v-if="image.dimensions">{{ image.dimensions.width }} × {{ image.dimensions.height }}</span>
                </div>

                <div v-if="image.tags.length > 0" class="result-tags">
                  <el-tag
                    v-for="tag in image.tags.slice(0, 5)"
                    :key="tag.id"
                    :color="tagTypeConfig[tag.type].color"
                    size="small"
                    effect="light"
                    style="margin: 2px"
                  >
                    {{ tag.name }} ({{ (tag.confidence * 100).toFixed(0) }}%)
                  </el-tag>
                  <el-tag v-if="image.tags.length > 5" size="small" type="info">
                    +{{ image.tags.length - 5 }}
                  </el-tag>
                </div>

                <div class="result-actions">
                  <el-button :icon="View" size="small" @click="viewImageDetail(image)">查看</el-button>
                  <el-button v-if="image.status === 'failed'" :icon="Refresh" size="small" @click="reprocessImage(image)">重试</el-button>
                  <el-button :icon="Delete" size="small" type="danger" @click="deleteImage(image)">删除</el-button>
                </div>

                <div class="result-time">
                  <span>上传：{{ image.uploadTime }}</span>
                  <span v-if="image.processTime">处理：{{ image.processTime }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 右侧：标签管理和配置面板 -->
      <div v-show="showConfigPanel" class="right-panel">
        <el-card class="config-card">
          <template #header>
            <div class="card-header">
              <span>配置管理</span>
              <el-button :icon="Close" size="small" text @click="showConfigPanel = false" />
            </div>
          </template>

          <el-tabs v-model="activeConfigTab">
            <!-- 标签体系管理 -->
            <el-tab-pane label="标签体系" name="tags">
              <div class="tab-actions">
                <el-button :icon="Plus" size="small" type="primary" @click="addTag">添加标签</el-button>
                <el-button :icon="UploadIcon" size="small" @click="importTagTemplate">导入模板</el-button>
                <el-button :icon="Download" size="small" @click="exportTagTemplate">导出模板</el-button>
              </div>

              <el-tree
                :data="tagTreeData"
                node-key="id"
                default-expand-all
                class="tag-tree"
              >
                <template #default="{ data }">
                  <div class="tag-tree-node">
                    <span class="tag-node-label">
                      <el-tag :color="tagTypeConfig[data.type].color" size="small" effect="light">
                        {{ data.name }}
                      </el-tag>
                      <span class="tag-weight">(权重: {{ data.weight }})</span>
                    </span>
                    <span class="tag-node-actions">
                      <el-switch v-model="data.enabled" size="small" />
                      <el-button :icon="Edit" size="small" text @click="editTag(data)" />
                      <el-button :icon="Delete" size="small" text type="danger" @click="deleteTagConfig(data)" />
                    </span>
                  </div>
                </template>
              </el-tree>
            </el-tab-pane>

            <!-- 模型配置 -->
            <el-tab-pane label="分类模型" name="models">
              <div class="models-list">
                <div v-for="model in modelConfigs" :key="model.id" class="model-item">
                  <div class="model-header">
                    <div class="model-info">
                      <span class="model-name">{{ model.name }}</span>
                      <el-tag size="small" type="info">{{ model.version }}</el-tag>
                      <el-tag v-if="model.enabled" size="small" type="success">已启用</el-tag>
                      <el-tag v-else size="small" type="info">未启用</el-tag>
                    </div>
                  </div>

                  <el-descriptions :column="1" size="small" border>
                    <el-descriptions-item label="置信度">
                      {{ (model.confidence * 100).toFixed(0) }}%
                    </el-descriptions-item>
                    <el-descriptions-item label="阈值">
                      {{ (model.threshold * 100).toFixed(0) }}%
                    </el-descriptions-item>
                    <el-descriptions-item label="更新时间">
                      {{ model.lastUpdated }}
                    </el-descriptions-item>
                  </el-descriptions>

                  <div class="model-actions">
                    <el-button :icon="Setting" size="small" @click="configureModel(model)">配置</el-button>
                    <el-button :icon="Refresh" size="small" @click="testModel(model)">测试</el-button>
                  </div>
                </div>
              </div>
            </el-tab-pane>

            <!-- 数据质量 -->
            <el-tab-pane label="数据质量" name="quality">
              <el-alert
                title="数据质量检查"
                type="success"
                :closable="false"
                style="margin-bottom: 16px"
              >
                当前数据质量良好，平均置信度为 {{ (statistics.avgConfidence * 100).toFixed(1) }}%
              </el-alert>

              <el-descriptions :column="1" border>
                <el-descriptions-item label="总处理数">
                  {{ statistics.totalImages }}
                </el-descriptions-item>
                <el-descriptions-item label="成功率">
                  {{ statistics.totalImages > 0 ? ((statistics.completedImages / statistics.totalImages) * 100).toFixed(1) : 0 }}%
                </el-descriptions-item>
                <el-descriptions-item label="平均处理时间">
                  {{ statistics.avgProcessTime.toFixed(2) }}秒
                </el-descriptions-item>
                <el-descriptions-item label="标签准确度">
                  {{ (statistics.avgConfidence * 100).toFixed(1) }}%
                </el-descriptions-item>
              </el-descriptions>

              <div style="margin-top: 16px">
                <el-button type="primary" size="small" style="width: 100%">
                  生成质量报告
                </el-button>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </div>
    </div>

    <!-- 图像详情查看器 -->
    <el-dialog
      v-model="showImageViewer"
      :title="selectedImage?.name"
      width="80%"
      :fullscreen="false"
    >
      <div v-if="selectedImage" class="image-viewer">
        <div class="viewer-image">
          <img :src="selectedImage.url" :alt="selectedImage.name" />
          <!-- 可视化标注框（简化版） -->
          <div
            v-for="tag in selectedImage.tags"
            :key="tag.id"
            class="tag-box"
            :style="{
              left: tag.position?.x + '%',
              top: tag.position?.y + '%',
              width: tag.position?.width + '%',
              height: tag.position?.height + '%',
              borderColor: tagTypeConfig[tag.type].color
            }"
          >
            <span class="tag-label" :style="{ backgroundColor: tagTypeConfig[tag.type].color }">
              {{ tag.name }}
            </span>
          </div>
        </div>

        <div class="viewer-info">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="文件名">{{ selectedImage.name }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getStatusTagType(selectedImage.status)">
                {{ statusConfig[selectedImage.status].label }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="尺寸">
              {{ selectedImage.dimensions?.width }} × {{ selectedImage.dimensions?.height }}
            </el-descriptions-item>
            <el-descriptions-item label="大小">
              {{ formatFileSize(selectedImage.size) }}
            </el-descriptions-item>
            <el-descriptions-item label="上传时间">{{ selectedImage.uploadTime }}</el-descriptions-item>
            <el-descriptions-item label="处理时间">{{ selectedImage.processTime || '-' }}</el-descriptions-item>
          </el-descriptions>

          <div class="tags-detail">
            <h4>识别标签详情</h4>
            <el-table :data="selectedImage.tags" style="width: 100%" size="small">
              <el-table-column prop="name" label="标签名称" />
              <el-table-column prop="type" label="类型" width="100">
                <template #default="{ row }">
                  <el-tag :color="tagTypeConfig[row.type].color" size="small" effect="light">
                    {{ tagTypeConfig[row.type].label }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="confidence" label="置信度" width="120">
                <template #default="{ row }">
                  <el-progress
                    :percentage="Math.floor(row.confidence * 100)"
                    :stroke-width="8"
                    :color="row.confidence > 0.8 ? '#67C23A' : row.confidence > 0.6 ? '#E6A23C' : '#F56C6C'"
                  />
                </template>
              </el-table-column>
              <el-table-column prop="weight" label="权重" width="80">
                <template #default="{ row }">
                  {{ row.weight.toFixed(2) }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 标签编辑对话框 -->
    <el-dialog
      v-model="showTagDialog"
      :title="editingTag ? '编辑标签' : '添加标签'"
      width="500px"
    >
      <el-form :model="tagForm" label-width="100px">
        <el-form-item label="标签名称">
          <el-input v-model="tagForm.name" placeholder="请输入标签名称" />
        </el-form-item>
        <el-form-item label="标签类型">
          <el-select v-model="tagForm.type" placeholder="选择标签类型" style="width: 100%">
            <el-option label="主体" value="subject" />
            <el-option label="场景" value="scene" />
            <el-option label="商品" value="product" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="父级标签">
          <el-select v-model="tagForm.parentId" placeholder="选择父级标签（可选）" clearable style="width: 100%">
            <el-option
              v-for="tag in tagConfigs"
              :key="tag.id"
              :label="tag.name"
              :value="tag.id"
              :disabled="editingTag && tag.id === editingTag.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="权重">
          <el-slider v-model="tagForm.weight" :min="0" :max="1" :step="0.1" />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="tagForm.enabled" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showTagDialog = false">取消</el-button>
        <el-button type="primary" @click="saveTag">保存</el-button>
      </template>
    </el-dialog>

    <!-- 模型配置对话框 -->
    <el-dialog
      v-model="showModelDialog"
      title="模型配置"
      width="600px"
    >
      <el-form v-if="editingModel" label-width="120px">
        <el-form-item label="模型名称">
          <el-input v-model="editingModel.name" disabled />
        </el-form-item>
        <el-form-item label="版本">
          <el-input v-model="editingModel.version" disabled />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="editingModel.enabled" />
        </el-form-item>
        <el-form-item label="置信度要求">
          <el-slider
            v-model="editingModel.confidence"
            :min="0"
            :max="1"
            :step="0.05"
            :format-tooltip="formatPercentTooltip"
          />
        </el-form-item>
        <el-form-item label="分类阈值">
          <el-slider
            v-model="editingModel.threshold"
            :min="0"
            :max="1"
            :step="0.05"
            :format-tooltip="formatPercentTooltip"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showModelDialog = false">取消</el-button>
        <el-button type="primary" @click="saveModelConfig">保存配置</el-button>
      </template>
    </el-dialog>

    <!-- 配置面板切换按钮 -->
    <el-button
      v-show="!showConfigPanel"
      class="toggle-config-btn"
      :icon="Setting"
      circle
      type="primary"
      @click="showConfigPanel = true"
    />
  </div>
</template>

<style scoped lang="scss">
.image-classification-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 60px);

  .statistics-row {
    margin-bottom: 20px;

    .stat-card {
      .stat-content {
        display: flex;
        align-items: center;
        gap: 16px;

        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-info {
          flex: 1;

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
      }
    }
  }

  .main-content {
    display: flex;
    gap: 20px;

    .left-panel {
      width: 320px;
      flex-shrink: 0;

      .upload-card {
        margin-bottom: 20px;

        .upload-area {
          margin-bottom: 16px;

          :deep(.el-upload) {
            width: 100%;
          }

          :deep(.el-upload-dragger) {
            width: 100%;
            padding: 20px;
          }

          .upload-icon {
            font-size: 60px;
            color: #409EFF;
            margin-bottom: 16px;
          }

          .upload-text {
            font-size: 16px;
            color: #303133;
            margin-bottom: 8px;
          }

          .upload-tip {
            font-size: 12px;
            color: #909399;
          }
        }

        .upload-actions {
          display: flex;
          gap: 10px;

          .el-button {
            flex: 1;
          }
        }
      }

      .export-card {
        :deep(.el-form-item) {
          margin-bottom: 16px;
        }
      }
    }

    .middle-panel {
      flex: 1;
      min-width: 0;

      .results-card {
        height: calc(100vh - 240px);
        
        :deep(.el-card__body) {
          height: calc(100% - 60px);
          overflow: hidden;
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;

          .header-actions {
            display: flex;
            align-items: center;
          }
        }

        .results-list {
          height: 100%;
          overflow-y: auto;
          padding: 10px;

          .result-item {
            display: flex;
            gap: 16px;
            padding: 16px;
            background: white;
            border-radius: 8px;
            margin-bottom: 16px;
            border: 1px solid #ebeef5;
            transition: all 0.3s;

            &:hover {
              box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
            }

            .result-image {
              width: 160px;
              height: 120px;
              flex-shrink: 0;
              border-radius: 8px;
              overflow: hidden;
              cursor: pointer;
              position: relative;
              background: #f5f7fa;

              img {
                width: 100%;
                height: 100%;
                object-fit: cover;
              }

              .processing-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.6);
                display: flex;
                align-items: center;
                justify-content: center;
              }
            }

            .result-info {
              flex: 1;
              min-width: 0;
              display: flex;
              flex-direction: column;
              gap: 8px;

              .result-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;

                .result-name {
                  flex: 1;
                  font-size: 16px;
                  font-weight: bold;
                  color: #303133;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                }
              }

              .result-meta {
                display: flex;
                gap: 12px;
                font-size: 12px;
                color: #909399;
              }

              .result-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
              }

              .result-actions {
                display: flex;
                gap: 8px;
              }

              .result-time {
                display: flex;
                flex-direction: column;
                gap: 4px;
                font-size: 12px;
                color: #909399;
              }
            }
          }
        }
      }
    }

    .right-panel {
      width: 380px;
      flex-shrink: 0;

      .config-card {
        height: calc(100vh - 240px);

        :deep(.el-card__body) {
          height: calc(100% - 60px);
          overflow: hidden;
        }

        :deep(.el-tabs) {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        :deep(.el-tabs__content) {
          flex: 1;
          overflow-y: auto;
        }

        .tab-actions {
          margin-bottom: 16px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;

          .el-button {
            flex: 1;
          }
        }

        .tag-tree {
          :deep(.el-tree-node__content) {
            height: auto;
            padding: 8px 0;
          }

          .tag-tree-node {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding-right: 8px;

            .tag-node-label {
              display: flex;
              align-items: center;
              gap: 8px;

              .tag-weight {
                font-size: 12px;
                color: #909399;
              }
            }

            .tag-node-actions {
              display: flex;
              align-items: center;
              gap: 8px;
            }
          }
        }

        .models-list {
          .model-item {
            padding: 16px;
            background: #f5f7fa;
            border-radius: 8px;
            margin-bottom: 16px;

            .model-header {
              margin-bottom: 12px;

              .model-info {
                display: flex;
                align-items: center;
                gap: 8px;

                .model-name {
                  font-size: 16px;
                  font-weight: bold;
                  color: #303133;
                }
              }
            }

            :deep(.el-descriptions) {
              margin-bottom: 12px;
            }

            .model-actions {
              display: flex;
              gap: 8px;

              .el-button {
                flex: 1;
              }
            }
          }
        }
      }
    }
  }

  .image-viewer {
    display: flex;
    gap: 20px;
    max-height: 70vh;

    .viewer-image {
      flex: 1;
      position: relative;
      overflow: hidden;
      border-radius: 8px;
      background: #000;

      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      .tag-box {
        position: absolute;
        border: 2px solid;
        border-radius: 4px;
        pointer-events: none;

        .tag-label {
          position: absolute;
          top: -24px;
          left: 0;
          padding: 2px 8px;
          color: white;
          font-size: 12px;
          border-radius: 4px;
          white-space: nowrap;
        }
      }
    }

    .viewer-info {
      width: 400px;
      overflow-y: auto;

      :deep(.el-descriptions) {
        margin-bottom: 20px;
      }

      .tags-detail {
        h4 {
          margin-bottom: 12px;
          color: #303133;
        }
      }
    }
  }

  .toggle-config-btn {
    position: fixed;
    right: 30px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 1000;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: bold;
  }
}
</style>