<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { UploadProps, UploadUserFile } from 'element-plus'
import {
  Upload,
  Picture,
  Plus,
  Delete,
  Download,
  ZoomIn,
  Refresh,
  Check,
  Close,
  Edit,
  Star,
  Setting
} from '@element-plus/icons-vue'

// 图像状态类型
type ImageStatus = 'pending' | 'processing' | 'completed' | 'failed'
// 质量等级类型
type QualityLevel = 'excellent' | 'good' | 'average' | 'poor'

// 处理工具类型
interface ProcessTool {
  id: string
  name: string
  enabled: boolean
  params: Record<string, any>
}

// 图像项接口
interface ImageItem {
  id: string
  name: string
  url: string
  processedUrl?: string
  status: ImageStatus
  progress: number
  quality?: QualityLevel
  qualityScore?: number
  size: {
    width: number
    height: number
    fileSize: string
  }
  processedSize?: {
    width: number
    height: number
    fileSize: string
  }
  suggestions?: string[]
}

// 处理模板接口
interface ProcessTemplate {
  id: string
  name: string
  category: string
  description: string
  version: string
  tools: ProcessTool[]
  outputSpec: {
    width: number
    height: number
    quality: number
    format: string
  }
}

// 上传的文件列表
const uploadFileList = ref<UploadUserFile[]>([])
const imageList = ref<ImageItem[]>([])
const selectedImage = ref<ImageItem | null>(null)
const previewDialogVisible = ref(false)
const templateDialogVisible = ref(false)
const currentPreviewImage = ref('')
const compareMode = ref(false)

// 处理工具配置
const processTools = reactive<ProcessTool[]>([
  {
    id: 'crop',
    name: '自动裁剪',
    enabled: true,
    params: {
      aspectRatio: '1:1',
      smartDetect: true
    }
  },
  {
    id: 'resize',
    name: '尺寸调整',
    enabled: true,
    params: {
      width: 800,
      height: 800,
      keepAspectRatio: true
    }
  },
  {
    id: 'enhance',
    name: '清晰度增强',
    enabled: true,
    params: {
      level: 3,
      aiModel: 'ESRGAN'
    }
  },
  {
    id: 'background',
    name: '背景处理',
    enabled: false,
    params: {
      mode: 'remove',
      backgroundColor: '#ffffff',
      blur: 0
    }
  },
  {
    id: 'watermark',
    name: '水印管理',
    enabled: false,
    params: {
      text: '',
      position: 'bottom-right',
      opacity: 0.5
    }
  }
])

// 质量优化配置
const qualityConfig = reactive({
  minScore: 80,
  autoOptimize: true,
  outputFormat: 'jpg',
  outputQuality: 90,
  colorSpace: 'sRGB'
})

// 处理模板列表
const templateList = ref<ProcessTemplate[]>([
  {
    id: 'template-1',
    name: '商品主图模板',
    category: '电商标准',
    description: '适用于商品详情页主图，800x800，白底，高清晰度',
    version: 'v1.0',
    tools: [
      {
        id: 'crop',
        name: '自动裁剪',
        enabled: true,
        params: { aspectRatio: '1:1', smartDetect: true }
      },
      {
        id: 'resize',
        name: '尺寸调整',
        enabled: true,
        params: { width: 800, height: 800, keepAspectRatio: true }
      },
      {
        id: 'enhance',
        name: '清晰度增强',
        enabled: true,
        params: { level: 4, aiModel: 'ESRGAN' }
      },
      {
        id: 'background',
        name: '背景处理',
        enabled: true,
        params: { mode: 'replace', backgroundColor: '#ffffff', blur: 0 }
      }
    ],
    outputSpec: {
      width: 800,
      height: 800,
      quality: 95,
      format: 'jpg'
    }
  },
  {
    id: 'template-2',
    name: '商品轮播图模板',
    category: '电商标准',
    description: '适用于商品轮播图，1920x1080，背景虚化',
    version: 'v1.0',
    tools: [
      {
        id: 'resize',
        name: '尺寸调整',
        enabled: true,
        params: { width: 1920, height: 1080, keepAspectRatio: false }
      },
      {
        id: 'enhance',
        name: '清晰度增强',
        enabled: true,
        params: { level: 3, aiModel: 'ESRGAN' }
      },
      {
        id: 'background',
        name: '背景处理',
        enabled: true,
        params: { mode: 'blur', backgroundColor: '#f5f5f5', blur: 20 }
      }
    ],
    outputSpec: {
      width: 1920,
      height: 1080,
      quality: 90,
      format: 'jpg'
    }
  },
  {
    id: 'template-3',
    name: '商品详情图模板',
    category: '电商标准',
    description: '适用于商品详情页内容图，750宽度自适应',
    version: 'v1.0',
    tools: [
      {
        id: 'resize',
        name: '尺寸调整',
        enabled: true,
        params: { width: 750, height: 0, keepAspectRatio: true }
      },
      {
        id: 'enhance',
        name: '清晰度增强',
        enabled: true,
        params: { level: 3, aiModel: 'ESRGAN' }
      },
      {
        id: 'watermark',
        name: '水印管理',
        enabled: true,
        params: { text: '品牌标识', position: 'bottom-right', opacity: 0.3 }
      }
    ],
    outputSpec: {
      width: 750,
      height: 0,
      quality: 85,
      format: 'jpg'
    }
  },
  {
    id: 'template-4',
    name: '社交媒体分享图',
    category: '营销推广',
    description: '适用于社交媒体分享，1200x630，带品牌水印',
    version: 'v1.0',
    tools: [
      {
        id: 'crop',
        name: '自动裁剪',
        enabled: true,
        params: { aspectRatio: '1.91:1', smartDetect: true }
      },
      {
        id: 'resize',
        name: '尺寸调整',
        enabled: true,
        params: { width: 1200, height: 630, keepAspectRatio: false }
      },
      {
        id: 'enhance',
        name: '清晰度增强',
        enabled: true,
        params: { level: 4, aiModel: 'ESRGAN' }
      },
      {
        id: 'watermark',
        name: '水印管理',
        enabled: true,
        params: { text: 'BRAND', position: 'center', opacity: 0.2 }
      }
    ],
    outputSpec: {
      width: 1200,
      height: 630,
      quality: 90,
      format: 'jpg'
    }
  }
])

const selectedTemplate = ref<ProcessTemplate | null>(null)

// 统计信息
const statistics = computed(() => {
  const total = imageList.value.length
  const completed = imageList.value.filter(img => img.status === 'completed').length
  const processing = imageList.value.filter(img => img.status === 'processing').length
  const failed = imageList.value.filter(img => img.status === 'failed').length
  const excellent = imageList.value.filter(img => img.quality === 'excellent').length

  return {
    total,
    completed,
    processing,
    failed,
    excellent,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
  }
})

// 获取状态标签类型
const getStatusType = (status: ImageStatus) => {
  const map = {
    pending: 'info',
    processing: 'primary',
    completed: 'success',
    failed: 'danger'
  }
  return map[status]
}

// 获取状态文本
const getStatusText = (status: ImageStatus) => {
  const map = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    failed: '失败'
  }
  return map[status]
}

// 获取质量等级标签类型
const getQualityType = (quality: QualityLevel) => {
  const map = {
    excellent: 'warning',
    good: 'success',
    average: '',
    poor: 'danger'
  }
  return map[quality]
}

// 获取质量等级文本
const getQualityText = (quality: QualityLevel) => {
  const map = {
    excellent: '优秀',
    good: '良好',
    average: '一般',
    poor: '需优化'
  }
  return map[quality]
}

// 获取质量评分颜色
const getQualityColor = (score: number) => {
  if (score >= 90) return '#f59e0b'
  if (score >= 75) return '#10b981'
  if (score >= 60) return '#eab308'
  return '#ef4444'
}

// 获取质量等级
const getQualityLevel = (score: number): QualityLevel => {
  if (score >= 90) return 'excellent'
  if (score >= 75) return 'good'
  if (score >= 60) return 'average'
  return 'poor'
}

// 文件上传处理
const handleUploadChange: UploadProps['onChange'] = (uploadFile, uploadFiles) => {
  if (uploadFile.raw) {
    const url = URL.createObjectURL(uploadFile.raw)
    const newImage: ImageItem = {
      id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: uploadFile.name,
      url: url,
      status: 'pending',
      progress: 0,
      size: {
        width: 1024,
        height: 768,
        fileSize: (uploadFile.size! / 1024).toFixed(2) + ' KB'
      }
    }
    imageList.value.push(newImage)
  }
}

// 删除图像
const handleRemoveImage = (imageId: string) => {
  const index = imageList.value.findIndex(img => img.id === imageId)
  if (index > -1) {
    imageList.value.splice(index, 1)
    if (selectedImage.value?.id === imageId) {
      selectedImage.value = null
    }
  }
}

// 选择图像
const handleSelectImage = (image: ImageItem) => {
  selectedImage.value = image
  compareMode.value = false
}

// 预览图像
const handlePreviewImage = (url: string) => {
  currentPreviewImage.value = url
  previewDialogVisible.value = true
}

// 处理单个图像
const processImage = async (image: ImageItem) => {
  image.status = 'processing'
  image.progress = 0

  // 模拟处理进度
  const progressInterval = setInterval(() => {
    if (image.progress < 90) {
      image.progress += Math.random() * 15
      if (image.progress > 90) image.progress = 90
    }
  }, 300)

  // 模拟异步处理
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000))

  clearInterval(progressInterval)
  image.progress = 100

  // 模拟处理结果
  const success = Math.random() > 0.1 // 90% 成功率
  if (success) {
    image.status = 'completed'
    image.processedUrl = image.url // 实际应该是处理后的图片URL
    image.qualityScore = Math.round(60 + Math.random() * 40)
    image.quality = getQualityLevel(image.qualityScore)
    image.processedSize = {
      width: 800,
      height: 800,
      fileSize: (Math.random() * 200 + 100).toFixed(2) + ' KB'
    }
    
    // 生成改善建议
    image.suggestions = []
    if (image.qualityScore < 90) {
      if (Math.random() > 0.5) image.suggestions.push('建议增强清晰度')
      if (Math.random() > 0.5) image.suggestions.push('建议优化色彩饱和度')
      if (Math.random() > 0.5) image.suggestions.push('建议调整亮度对比度')
    }

    ElMessage.success(`${image.name} 处理完成，质量评分：${image.qualityScore}`)
  } else {
    image.status = 'failed'
    ElMessage.error(`${image.name} 处理失败`)
  }
}

// 批量处理图像
const handleBatchProcess = async () => {
  const pendingImages = imageList.value.filter(img => img.status === 'pending' || img.status === 'failed')
  
  if (pendingImages.length === 0) {
    ElMessage.warning('没有待处理的图像')
    return
  }

  ElMessage.info(`开始批量处理 ${pendingImages.length} 张图片`)

  // 并发处理（限制并发数）
  const concurrency = 3
  for (let i = 0; i < pendingImages.length; i += concurrency) {
    const batch = pendingImages.slice(i, i + concurrency)
    await Promise.all(batch.map(img => processImage(img)))
  }

  ElMessage.success('批量处理完成')
}

// 处理选中图像
const handleProcessSelected = () => {
  if (!selectedImage.value) {
    ElMessage.warning('请先选择要处理的图像')
    return
  }

  if (selectedImage.value.status === 'processing') {
    ElMessage.warning('图像正在处理中')
    return
  }

  processImage(selectedImage.value)
}

// 重新处理
const handleReprocess = (image: ImageItem) => {
  image.status = 'pending'
  image.progress = 0
  image.processedUrl = undefined
  image.qualityScore = undefined
  image.quality = undefined
  image.suggestions = undefined
  processImage(image)
}

// 下载图像
const handleDownload = (image: ImageItem) => {
  if (!image.processedUrl) {
    ElMessage.warning('图像尚未处理完成')
    return
  }

  // 模拟下载
  const link = document.createElement('a')
  link.href = image.processedUrl
  link.download = `processed_${image.name}`
  link.click()
  ElMessage.success('下载成功')
}

// 批量下载
const handleBatchDownload = () => {
  const completedImages = imageList.value.filter(img => img.status === 'completed')
  
  if (completedImages.length === 0) {
    ElMessage.warning('没有已完成的图像可供下载')
    return
  }

  ElMessage.success(`已下载 ${completedImages.length} 张图片`)
}

// 清空列表
const handleClearList = () => {
  ElMessageBox.confirm('确定要清空所有图像吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    imageList.value = []
    selectedImage.value = null
    ElMessage.success('已清空列表')
  }).catch(() => {})
}

// 应用模板
const handleApplyTemplate = (template: ProcessTemplate) => {
  // 应用模板配置到处理工具
  processTools.forEach(tool => {
    const templateTool = template.tools.find(t => t.id === tool.id)
    if (templateTool) {
      tool.enabled = templateTool.enabled
      tool.params = { ...templateTool.params }
    } else {
      tool.enabled = false
    }
  })

  // 应用输出规格
  qualityConfig.outputFormat = template.outputSpec.format
  qualityConfig.outputQuality = template.outputSpec.quality

  selectedTemplate.value = template
  ElMessage.success(`已应用模板：${template.name}`)
}

// 保存为模板
const handleSaveAsTemplate = () => {
  ElMessageBox.prompt('请输入模板名称', '保存模板', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /.+/,
    inputErrorMessage: '模板名称不能为空'
  }).then(({ value }) => {
    const newTemplate: ProcessTemplate = {
      id: `template-${Date.now()}`,
      name: value,
      category: '自定义',
      description: '用户自定义模板',
      version: 'v1.0',
      tools: JSON.parse(JSON.stringify(processTools)),
      outputSpec: {
        width: 800,
        height: 800,
        quality: qualityConfig.outputQuality,
        format: qualityConfig.outputFormat
      }
    }
    templateList.value.push(newTemplate)
    ElMessage.success('模板保存成功')
  }).catch(() => {})
}

// 删除模板
const handleDeleteTemplate = (templateId: string) => {
  ElMessageBox.confirm('确定要删除此模板吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = templateList.value.findIndex(t => t.id === templateId)
    if (index > -1) {
      templateList.value.splice(index, 1)
      if (selectedTemplate.value?.id === templateId) {
        selectedTemplate.value = null
      }
      ElMessage.success('模板已删除')
    }
  }).catch(() => {})
}

// 切换对比模式
const toggleCompareMode = () => {
  if (!selectedImage.value?.processedUrl) {
    ElMessage.warning('请先处理图像后再使用对比功能')
    return
  }
  compareMode.value = !compareMode.value
}
</script>

<template>
  <div class="image-processing-container">
    <!-- 顶部统计栏 -->
    <el-card class="statistics-card" shadow="never">
      <div class="statistics-content">
        <div class="stat-item">
          <div class="stat-label">总图片数</div>
          <div class="stat-value">{{ statistics.total }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">已完成</div>
          <div class="stat-value text-success">{{ statistics.completed }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">处理中</div>
          <div class="stat-value text-primary">{{ statistics.processing }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">失败</div>
          <div class="stat-value text-danger">{{ statistics.failed }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">优秀率</div>
          <div class="stat-value text-warning">
            {{ statistics.total > 0 ? Math.round((statistics.excellent / statistics.total) * 100) : 0 }}%
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-label">完成率</div>
          <div class="stat-value">{{ statistics.completionRate }}%</div>
        </div>
      </div>
    </el-card>

    <!-- 主体内容区 -->
    <div class="main-content">
      <!-- 左侧：图像上传和列表区 -->
      <el-card class="left-panel" shadow="hover">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon><Upload /></el-icon>
              图像上传与管理
            </span>
            <div class="card-actions">
              <el-button type="primary" size="small" @click="handleBatchProcess">
                批量处理
              </el-button>
              <el-button type="success" size="small" @click="handleBatchDownload">
                批量下载
              </el-button>
              <el-button type="danger" size="small" @click="handleClearList">
                清空列表
              </el-button>
            </div>
          </div>
        </template>

        <!-- 上传区域 -->
        <div class="upload-area">
          <el-upload
            v-model:file-list="uploadFileList"
            drag
            multiple
            accept="image/*"
            :auto-upload="false"
            :on-change="handleUploadChange"
            :show-file-list="false"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              拖拽图片到此处或 <em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 jpg/png/gif/webp 格式，单文件不超过 10MB
              </div>
            </template>
          </el-upload>
        </div>

        <!-- 图像列表 -->
        <div class="image-list">
          <div class="list-header">
            <span>图像列表 ({{ imageList.length }})</span>
          </div>
          <div class="list-content">
            <el-scrollbar height="500px">
              <div
                v-for="image in imageList"
                :key="image.id"
                class="image-item"
                :class="{ active: selectedImage?.id === image.id }"
                @click="handleSelectImage(image)"
              >
                <div class="image-preview">
                  <img :src="image.url" :alt="image.name" />
                  <div class="image-overlay">
                    <el-button
                      type="primary"
                      :icon="ZoomIn"
                      circle
                      size="small"
                      @click.stop="handlePreviewImage(image.url)"
                    />
                  </div>
                </div>
                <div class="image-info">
                  <div class="image-name" :title="image.name">{{ image.name }}</div>
                  <div class="image-meta">
                    <span>{{ image.size.width }}x{{ image.size.height }}</span>
                    <span>{{ image.size.fileSize }}</span>
                  </div>
                  <div class="image-status">
                    <el-tag :type="getStatusType(image.status)" size="small">
                      {{ getStatusText(image.status) }}
                    </el-tag>
                    <el-tag
                      v-if="image.quality"
                      :type="getQualityType(image.quality)"
                      size="small"
                      effect="dark"
                    >
                      {{ getQualityText(image.quality) }} {{ image.qualityScore }}
                    </el-tag>
                  </div>
                  <el-progress
                    v-if="image.status === 'processing'"
                    :percentage="Math.round(image.progress)"
                    :stroke-width="6"
                    :show-text="false"
                  />
                </div>
                <div class="image-actions">
                  <el-button
                    v-if="image.status === 'completed'"
                    type="success"
                    :icon="Download"
                    circle
                    size="small"
                    @click.stop="handleDownload(image)"
                  />
                  <el-button
                    v-if="image.status === 'failed' || image.status === 'completed'"
                    type="warning"
                    :icon="Refresh"
                    circle
                    size="small"
                    @click.stop="handleReprocess(image)"
                  />
                  <el-button
                    type="danger"
                    :icon="Delete"
                    circle
                    size="small"
                    @click.stop="handleRemoveImage(image.id)"
                  />
                </div>
              </div>
              <el-empty v-if="imageList.length === 0" description="暂无图像" />
            </el-scrollbar>
          </div>
        </div>
      </el-card>

      <!-- 中间：预览区 -->
      <el-card class="center-panel" shadow="hover">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon><Picture /></el-icon>
              效果预览
            </span>
            <div class="card-actions">
              <el-button
                v-if="selectedImage?.processedUrl"
                :type="compareMode ? 'primary' : 'default'"
                size="small"
                @click="toggleCompareMode"
              >
                {{ compareMode ? '退出对比' : '对比模式' }}
              </el-button>
              <el-button
                type="primary"
                size="small"
                :disabled="!selectedImage || selectedImage.status === 'processing'"
                @click="handleProcessSelected"
              >
                处理此图像
              </el-button>
            </div>
          </div>
        </template>

        <div v-if="selectedImage" class="preview-content">
          <!-- 单图模式 -->
          <div v-if="!compareMode" class="single-preview">
            <div class="preview-image-wrapper">
              <img
                :src="selectedImage.processedUrl || selectedImage.url"
                :alt="selectedImage.name"
                class="preview-image"
              />
              <div class="preview-label">
                {{ selectedImage.processedUrl ? '处理后' : '原图' }}
              </div>
            </div>

            <!-- 质量评分卡片 -->
            <div v-if="selectedImage.qualityScore" class="quality-card">
              <div class="quality-score">
                <el-progress
                  type="circle"
                  :percentage="selectedImage.qualityScore"
                  :width="120"
                  :color="getQualityColor(selectedImage.qualityScore)"
                >
                  <template #default>
                    <div class="score-content">
                      <div class="score-value">{{ selectedImage.qualityScore }}</div>
                      <div class="score-label">质量评分</div>
                    </div>
                  </template>
                </el-progress>
              </div>
              <div class="quality-details">
                <div class="detail-item">
                  <span class="detail-label">质量等级：</span>
                  <el-tag :type="getQualityType(selectedImage.quality!)" effect="dark">
                    {{ getQualityText(selectedImage.quality!) }}
                  </el-tag>
                </div>
                <div class="detail-item">
                  <span class="detail-label">原始尺寸：</span>
                  <span>{{ selectedImage.size.width }}x{{ selectedImage.size.height }}</span>
                </div>
                <div v-if="selectedImage.processedSize" class="detail-item">
                  <span class="detail-label">处理后尺寸：</span>
                  <span>{{ selectedImage.processedSize.width }}x{{ selectedImage.processedSize.height }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">文件大小：</span>
                  <span>{{ selectedImage.size.fileSize }}</span>
                  <span v-if="selectedImage.processedSize"> → {{ selectedImage.processedSize.fileSize }}</span>
                </div>
              </div>

              <!-- 改善建议 -->
              <div v-if="selectedImage.suggestions && selectedImage.suggestions.length > 0" class="suggestions">
                <div class="suggestions-title">
                  <el-icon><Star /></el-icon>
                  改善建议
                </div>
                <el-alert
                  v-for="(suggestion, index) in selectedImage.suggestions"
                  :key="index"
                  :title="suggestion"
                  type="info"
                  :closable="false"
                />
              </div>
            </div>
          </div>

          <!-- 对比模式 -->
          <div v-else class="compare-preview">
            <div class="compare-item">
              <div class="preview-image-wrapper">
                <img :src="selectedImage.url" :alt="selectedImage.name" class="preview-image" />
                <div class="preview-label">原图</div>
              </div>
              <div class="compare-info">
                <div>尺寸: {{ selectedImage.size.width }}x{{ selectedImage.size.height }}</div>
                <div>大小: {{ selectedImage.size.fileSize }}</div>
              </div>
            </div>
            <div class="compare-divider">
              <el-icon><Right /></el-icon>
            </div>
            <div class="compare-item">
              <div class="preview-image-wrapper">
                <img
                  :src="selectedImage.processedUrl"
                  :alt="selectedImage.name"
                  class="preview-image"
                />
                <div class="preview-label success">处理后</div>
              </div>
              <div class="compare-info">
                <div v-if="selectedImage.processedSize">
                  尺寸: {{ selectedImage.processedSize.width }}x{{ selectedImage.processedSize.height }}
                </div>
                <div v-if="selectedImage.processedSize">
                  大小: {{ selectedImage.processedSize.fileSize }}
                </div>
                <div v-if="selectedImage.qualityScore">
                  <el-tag :type="getQualityType(selectedImage.quality!)" effect="dark">
                    评分: {{ selectedImage.qualityScore }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </div>

        <el-empty v-else description="请选择要预览的图像" />
      </el-card>

      <!-- 右侧：工具配置面板 -->
      <el-card class="right-panel" shadow="hover">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon><Setting /></el-icon>
              处理配置
            </span>
            <el-button type="primary" size="small" @click="templateDialogVisible = true">
              模板管理
            </el-button>
          </div>
        </template>

        <el-scrollbar height="calc(100vh - 280px)">
          <div class="config-panel">
            <!-- 当前模板 -->
            <div v-if="selectedTemplate" class="current-template">
              <el-alert
                :title="`当前模板: ${selectedTemplate.name}`"
                type="success"
                :closable="false"
              >
                <template #default>
                  <div>{{ selectedTemplate.description }}</div>
                  <div class="template-meta">
                    <el-tag size="small">{{ selectedTemplate.category }}</el-tag>
                    <el-tag size="small" type="info">{{ selectedTemplate.version }}</el-tag>
                  </div>
                </template>
              </el-alert>
            </div>

            <!-- 处理工具配置 -->
            <div class="config-section">
              <div class="section-title">智能加工工具</div>
              <el-space direction="vertical" :size="15" style="width: 100%">
                <!-- 自动裁剪 -->
                <el-card
                  shadow="never"
                  :class="{ 'tool-card': true, 'tool-disabled': !processTools[0].enabled }"
                >
                  <template #header>
                    <div class="tool-header">
                      <el-switch v-model="processTools[0].enabled" />
                      <span class="tool-name">{{ processTools[0].name }}</span>
                    </div>
                  </template>
                  <div v-if="processTools[0].enabled" class="tool-params">
                    <div class="param-item">
                      <span class="param-label">裁剪比例:</span>
                      <el-select v-model="processTools[0].params.aspectRatio" size="small">
                        <el-option label="1:1 (正方形)" value="1:1" />
                        <el-option label="4:3 (标准)" value="4:3" />
                        <el-option label="16:9 (宽屏)" value="16:9" />
                        <el-option label="3:4 (竖屏)" value="3:4" />
                      </el-select>
                    </div>
                    <div class="param-item">
                      <el-checkbox v-model="processTools[0].params.smartDetect">
                        智能主体识别
                      </el-checkbox>
                    </div>
                  </div>
                </el-card>

                <!-- 尺寸调整 -->
                <el-card
                  shadow="never"
                  :class="{ 'tool-card': true, 'tool-disabled': !processTools[1].enabled }"
                >
                  <template #header>
                    <div class="tool-header">
                      <el-switch v-model="processTools[1].enabled" />
                      <span class="tool-name">{{ processTools[1].name }}</span>
                    </div>
                  </template>
                  <div v-if="processTools[1].enabled" class="tool-params">
                    <div class="param-item">
                      <span class="param-label">宽度:</span>
                      <el-input-number
                        v-model="processTools[1].params.width"
                        :min="100"
                        :max="4096"
                        :step="10"
                        size="small"
                      />
                    </div>
                    <div class="param-item">
                      <span class="param-label">高度:</span>
                      <el-input-number
                        v-model="processTools[1].params.height"
                        :min="100"
                        :max="4096"
                        :step="10"
                        size="small"
                      />
                    </div>
                    <div class="param-item">
                      <el-checkbox v-model="processTools[1].params.keepAspectRatio">
                        保持宽高比
                      </el-checkbox>
                    </div>
                  </div>
                </el-card>

                <!-- 清晰度增强 -->
                <el-card
                  shadow="never"
                  :class="{ 'tool-card': true, 'tool-disabled': !processTools[2].enabled }"
                >
                  <template #header>
                    <div class="tool-header">
                      <el-switch v-model="processTools[2].enabled" />
                      <span class="tool-name">{{ processTools[2].name }}</span>
                    </div>
                  </template>
                  <div v-if="processTools[2].enabled" class="tool-params">
                    <div class="param-item">
                      <span class="param-label">增强等级: {{ processTools[2].params.level }}</span>
                    </div>
                    <el-slider
                      v-model="processTools[2].params.level"
                      :min="1"
                      :max="5"
                      :marks="{ 1: '低', 3: '中', 5: '高' }"
                    />
                    <div class="param-item">
                      <span class="param-label">AI模型:</span>
                      <el-select v-model="processTools[2].params.aiModel" size="small">
                        <el-option label="ESRGAN (推荐)" value="ESRGAN" />
                        <el-option label="Real-ESRGAN" value="Real-ESRGAN" />
                        <el-option label="SRCNN" value="SRCNN" />
                      </el-select>
                    </div>
                  </div>
                </el-card>

                <!-- 背景处理 -->
                <el-card
                  shadow="never"
                  :class="{ 'tool-card': true, 'tool-disabled': !processTools[3].enabled }"
                >
                  <template #header>
                    <div class="tool-header">
                      <el-switch v-model="processTools[3].enabled" />
                      <span class="tool-name">{{ processTools[3].name }}</span>
                    </div>
                  </template>
                  <div v-if="processTools[3].enabled" class="tool-params">
                    <div class="param-item">
                      <span class="param-label">处理模式:</span>
                      <el-select v-model="processTools[3].params.mode" size="small">
                        <el-option label="移除背景" value="remove" />
                        <el-option label="替换背景" value="replace" />
                        <el-option label="背景虚化" value="blur" />
                      </el-select>
                    </div>
                    <div
                      v-if="processTools[3].params.mode === 'replace'"
                      class="param-item"
                    >
                      <span class="param-label">背景颜色:</span>
                      <el-color-picker v-model="processTools[3].params.backgroundColor" size="small" />
                    </div>
                    <div v-if="processTools[3].params.mode === 'blur'" class="param-item">
                      <span class="param-label">虚化程度: {{ processTools[3].params.blur }}</span>
                      <el-slider v-model="processTools[3].params.blur" :min="0" :max="50" />
                    </div>
                  </div>
                </el-card>

                <!-- 水印管理 -->
                <el-card
                  shadow="never"
                  :class="{ 'tool-card': true, 'tool-disabled': !processTools[4].enabled }"
                >
                  <template #header>
                    <div class="tool-header">
                      <el-switch v-model="processTools[4].enabled" />
                      <span class="tool-name">{{ processTools[4].name }}</span>
                    </div>
                  </template>
                  <div v-if="processTools[4].enabled" class="tool-params">
                    <div class="param-item">
                      <span class="param-label">水印文字:</span>
                      <el-input
                        v-model="processTools[4].params.text"
                        placeholder="请输入水印文字"
                        size="small"
                      />
                    </div>
                    <div class="param-item">
                      <span class="param-label">位置:</span>
                      <el-select v-model="processTools[4].params.position" size="small">
                        <el-option label="左上" value="top-left" />
                        <el-option label="右上" value="top-right" />
                        <el-option label="居中" value="center" />
                        <el-option label="左下" value="bottom-left" />
                        <el-option label="右下" value="bottom-right" />
                      </el-select>
                    </div>
                    <div class="param-item">
                      <span class="param-label">透明度: {{ (processTools[4].params.opacity * 100).toFixed(0) }}%</span>
                      <el-slider
                        v-model="processTools[4].params.opacity"
                        :min="0"
                        :max="1"
                        :step="0.1"
                      />
                    </div>
                  </div>
                </el-card>
              </el-space>
            </div>

            <!-- 质量优化配置 -->
            <div class="config-section">
              <div class="section-title">质量优化</div>
              <el-card shadow="never" class="quality-config-card">
                <div class="param-item">
                  <span class="param-label">最低质量分数:</span>
                  <el-input-number
                    v-model="qualityConfig.minScore"
                    :min="0"
                    :max="100"
                    size="small"
                  />
                </div>
                <div class="param-item">
                  <el-checkbox v-model="qualityConfig.autoOptimize">
                    自动优化低质量图片
                  </el-checkbox>
                </div>
                <div class="param-item">
                  <span class="param-label">输出格式:</span>
                  <el-select v-model="qualityConfig.outputFormat" size="small">
                    <el-option label="JPEG" value="jpg" />
                    <el-option label="PNG" value="png" />
                    <el-option label="WebP" value="webp" />
                  </el-select>
                </div>
                <div class="param-item">
                  <span class="param-label">输出质量: {{ qualityConfig.outputQuality }}%</span>
                  <el-slider
                    v-model="qualityConfig.outputQuality"
                    :min="50"
                    :max="100"
                    :marks="{ 50: '50', 75: '75', 90: '90', 100: '100' }"
                  />
                </div>
                <div class="param-item">
                  <span class="param-label">色彩空间:</span>
                  <el-select v-model="qualityConfig.colorSpace" size="small">
                    <el-option label="sRGB" value="sRGB" />
                    <el-option label="Adobe RGB" value="AdobeRGB" />
                    <el-option label="Display P3" value="DisplayP3" />
                  </el-select>
                </div>
              </el-card>
            </div>

            <!-- 操作按钮 -->
            <div class="config-section">
              <el-space direction="vertical" :size="10" style="width: 100%">
                <el-button type="primary" style="width: 100%" @click="handleSaveAsTemplate">
                  <el-icon><Edit /></el-icon>
                  保存为模板
                </el-button>
                <el-button style="width: 100%" @click="selectedTemplate = null">
                  <el-icon><Refresh /></el-icon>
                  重置配置
                </el-button>
              </el-space>
            </div>
          </div>
        </el-scrollbar>
      </el-card>
    </div>

    <!-- 图片预览对话框 -->
    <el-dialog v-model="previewDialogVisible" title="图片预览" width="80%">
      <div class="preview-dialog-content">
        <img :src="currentPreviewImage" alt="预览" style="max-width: 100%; max-height: 70vh" />
      </div>
    </el-dialog>

    <!-- 模板管理对话框 -->
    <el-dialog v-model="templateDialogVisible" title="处理模板管理" width="1000px">
      <div class="template-dialog-content">
        <el-row :gutter="20">
          <el-col
            v-for="template in templateList"
            :key="template.id"
            :span="12"
          >
            <el-card
              shadow="hover"
              class="template-card"
              :class="{ 'template-selected': selectedTemplate?.id === template.id }"
            >
              <template #header>
                <div class="template-card-header">
                  <div>
                    <div class="template-name">{{ template.name }}</div>
                    <div class="template-category">
                      <el-tag size="small">{{ template.category }}</el-tag>
                      <el-tag size="small" type="info">{{ template.version }}</el-tag>
                    </div>
                  </div>
                  <div class="template-actions">
                    <el-button
                      type="primary"
                      size="small"
                      @click="handleApplyTemplate(template)"
                    >
                      应用
                    </el-button>
                    <el-button
                      v-if="template.category === '自定义'"
                      type="danger"
                      size="small"
                      :icon="Delete"
                      @click="handleDeleteTemplate(template.id)"
                    />
                  </div>
                </div>
              </template>
              <div class="template-description">{{ template.description }}</div>
              <div class="template-specs">
                <div class="spec-item">
                  <span class="spec-label">输出尺寸:</span>
                  <span>{{ template.outputSpec.width }}x{{ template.outputSpec.height || '自适应' }}</span>
                </div>
                <div class="spec-item">
                  <span class="spec-label">输出质量:</span>
                  <span>{{ template.outputSpec.quality }}%</span>
                </div>
                <div class="spec-item">
                  <span class="spec-label">输出格式:</span>
                  <span>{{ template.outputSpec.format.toUpperCase() }}</span>
                </div>
              </div>
              <div class="template-tools">
                <span class="tools-label">启用工具:</span>
                <el-tag
                  v-for="tool in template.tools.filter(t => t.enabled)"
                  :key="tool.id"
                  size="small"
                  type="success"
                  effect="plain"
                >
                  {{ tool.name }}
                </el-tag>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.image-processing-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.statistics-card {
  margin-bottom: 20px;

  .statistics-content {
    display: flex;
    justify-content: space-around;
    align-items: center;

    .stat-item {
      text-align: center;

      .stat-label {
        font-size: 14px;
        color: #909399;
        margin-bottom: 8px;
      }

      .stat-value {
        font-size: 28px;
        font-weight: bold;
        color: #303133;

        &.text-success {
          color: #67c23a;
        }

        &.text-primary {
          color: #409eff;
        }

        &.text-danger {
          color: #f56c6c;
        }

        &.text-warning {
          color: #e6a23c;
        }
      }
    }
  }
}

.main-content {
  display: grid;
  grid-template-columns: 380px 1fr 420px;
  gap: 20px;
  align-items: start;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .card-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: bold;
  }

  .card-actions {
    display: flex;
    gap: 8px;
  }
}

/* 左侧面板 */
.left-panel {
  height: calc(100vh - 200px);
  display: flex;
  flex-direction: column;

  .upload-area {
    margin-bottom: 20px;

    :deep(.el-upload-dragger) {
      padding: 30px;
    }
  }

  .image-list {
    flex: 1;
    display: flex;
    flex-direction: column;

    .list-header {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #ebeef5;
    }

    .list-content {
      flex: 1;
    }

    .image-item {
      display: flex;
      gap: 12px;
      padding: 12px;
      margin-bottom: 12px;
      background-color: #fff;
      border: 2px solid transparent;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        border-color: #409eff;
        box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
      }

      &.active {
        border-color: #409eff;
        background-color: #ecf5ff;
      }

      .image-preview {
        position: relative;
        width: 80px;
        height: 80px;
        flex-shrink: 0;
        border-radius: 4px;
        overflow: hidden;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s;
        }

        &:hover .image-overlay {
          opacity: 1;
        }
      }

      .image-info {
        flex: 1;
        min-width: 0;

        .image-name {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 6px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .image-meta {
          font-size: 12px;
          color: #909399;
          margin-bottom: 6px;
          display: flex;
          gap: 8px;
        }

        .image-status {
          display: flex;
          gap: 6px;
          margin-bottom: 6px;
        }
      }

      .image-actions {
        display: flex;
        flex-direction: column;
        gap: 6px;
        justify-content: center;
      }
    }
  }
}

/* 中间面板 */
.center-panel {
  height: calc(100vh - 200px);

  .preview-content {
    height: calc(100vh - 280px);
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .single-preview {
    display: flex;
    flex-direction: column;
    gap: 20px;
    height: 100%;

    .preview-image-wrapper {
      position: relative;
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f5f7fa;
      border-radius: 8px;
      overflow: hidden;

      .preview-image {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }

      .preview-label {
        position: absolute;
        top: 12px;
        right: 12px;
        padding: 6px 12px;
        background-color: rgba(0, 0, 0, 0.7);
        color: #fff;
        border-radius: 4px;
        font-size: 12px;
      }
    }

    .quality-card {
      display: flex;
      gap: 20px;
      padding: 20px;
      background-color: #f5f7fa;
      border-radius: 8px;

      .quality-score {
        flex-shrink: 0;

        .score-content {
          text-align: center;

          .score-value {
            font-size: 32px;
            font-weight: bold;
          }

          .score-label {
            font-size: 12px;
            color: #909399;
            margin-top: 4px;
          }
        }
      }

      .quality-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 10px;

        .detail-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;

          .detail-label {
            color: #909399;
          }
        }
      }

      .suggestions {
        flex: 1;

        .suggestions-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 10px;
        }

        .el-alert {
          margin-bottom: 8px;
        }
      }
    }
  }

  .compare-preview {
    display: flex;
    align-items: center;
    gap: 20px;
    height: 100%;

    .compare-item {
      flex: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 12px;

      .preview-image-wrapper {
        position: relative;
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #f5f7fa;
        border-radius: 8px;
        overflow: hidden;

        .preview-image {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .preview-label {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 6px 12px;
          background-color: rgba(0, 0, 0, 0.7);
          color: #fff;
          border-radius: 4px;
          font-size: 12px;

          &.success {
            background-color: rgba(103, 194, 58, 0.9);
          }
        }
      }

      .compare-info {
        padding: 12px;
        background-color: #f5f7fa;
        border-radius: 8px;
        font-size: 14px;

        > div {
          margin-bottom: 6px;

          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }

    .compare-divider {
      font-size: 32px;
      color: #409eff;
    }
  }
}

/* 右侧面板 */
.right-panel {
  height: calc(100vh - 200px);

  .config-panel {
    .current-template {
      margin-bottom: 20px;

      .template-meta {
        display: flex;
        gap: 8px;
        margin-top: 8px;
      }
    }

    .config-section {
      margin-bottom: 24px;

      .section-title {
        font-size: 15px;
        font-weight: bold;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 2px solid #409eff;
      }

      .tool-card {
        border: 1px solid #ebeef5;

        &.tool-disabled {
          opacity: 0.6;
          background-color: #fafafa;
        }

        .tool-header {
          display: flex;
          align-items: center;
          gap: 12px;

          .tool-name {
            font-size: 14px;
            font-weight: 500;
          }
        }

        .tool-params {
          .param-item {
            margin-bottom: 12px;

            &:last-child {
              margin-bottom: 0;
            }

            .param-label {
              display: inline-block;
              font-size: 13px;
              color: #606266;
              margin-bottom: 6px;
            }

            .el-select,
            .el-input-number {
              width: 100%;
            }
          }
        }
      }

      .quality-config-card {
        border: 1px solid #ebeef5;

        .param-item {
          margin-bottom: 16px;

          &:last-child {
            margin-bottom: 0;
          }

          .param-label {
            display: block;
            font-size: 13px;
            color: #606266;
            margin-bottom: 8px;
          }

          .el-select,
          .el-input-number {
            width: 100%;
          }
        }
      }
    }
  }
}

/* 模板对话框 */
.template-dialog-content {
  max-height: 600px;
  overflow-y: auto;

  .template-card {
    margin-bottom: 16px;
    border: 2px solid transparent;
    transition: all 0.3s;

    &:hover {
      border-color: #409eff;
    }

    &.template-selected {
      border-color: #67c23a;
      background-color: #f0f9ff;
    }

    .template-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;

      .template-name {
        font-size: 15px;
        font-weight: bold;
        margin-bottom: 6px;
      }

      .template-category {
        display: flex;
        gap: 6px;
      }

      .template-actions {
        display: flex;
        gap: 6px;
      }
    }

    .template-description {
      font-size: 13px;
      color: #606266;
      margin-bottom: 12px;
      line-height: 1.6;
    }

    .template-specs {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 12px;
      padding: 10px;
      background-color: #f5f7fa;
      border-radius: 4px;

      .spec-item {
        font-size: 13px;
        display: flex;
        gap: 8px;

        .spec-label {
          color: #909399;
          min-width: 70px;
        }
      }
    }

    .template-tools {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;

      .tools-label {
        font-size: 13px;
        color: #909399;
      }
    }
  }
}

.preview-dialog-content {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>