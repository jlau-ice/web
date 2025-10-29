<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { UploadFile, UploadFiles, UploadProps } from 'element-plus'

// 类型定义
interface DetectionConfig {
  sensitivity: number
  confidenceThreshold: number
  detectViolence: boolean
  detectInappropriate: boolean
  detectDangerous: boolean
  detectSensitive: boolean
}

interface DetectionBox {
  id: string
  type: 'high' | 'medium' | 'low'
  label: string
  confidence: number
  x: number
  y: number
  width: number
  height: number
  description: string
}

interface ImageAnalysis {
  id: string
  name: string
  url: string
  status: 'pending' | 'analyzing' | 'completed' | 'failed'
  progress: number
  detections: DetectionBox[]
  riskScore: number
  analysisTime: string
  fileSize: number
  dimensions: { width: number; height: number }
}

// 响应式数据
const uploadedImages = ref<ImageAnalysis[]>([])
const currentImage = ref<ImageAnalysis | null>(null)
const isAnalyzing = ref(false)
const uploadProgress = ref(0)
const imageScale = ref(1)
const imageRotation = ref(0)
const filterType = ref('all')
const sortBy = ref('time')

// 检测配置
const detectionConfig = reactive<DetectionConfig>({
  sensitivity: 70,
  confidenceThreshold: 60,
  detectViolence: true,
  detectInappropriate: true,
  detectDangerous: true,
  detectSensitive: true,
})

// 统计数据
const statistics = computed(() => {
  const total = uploadedImages.value.length
  const completed = uploadedImages.value.filter(img => img.status === 'completed').length
  const highRisk = uploadedImages.value.filter(img => img.riskScore >= 80).length
  const mediumRisk = uploadedImages.value.filter(img => img.riskScore >= 50 && img.riskScore < 80).length
  const lowRisk = uploadedImages.value.filter(img => img.riskScore < 50).length

  return { total, completed, highRisk, mediumRisk, lowRisk }
})

// 筛选后的图像列表
const filteredImages = computed(() => {
  let filtered = [...uploadedImages.value]

  if (filterType.value !== 'all') {
    filtered = filtered.filter(img => {
      if (filterType.value === 'high') return img.riskScore >= 80
      if (filterType.value === 'medium') return img.riskScore >= 50 && img.riskScore < 80
      if (filterType.value === 'low') return img.riskScore < 50
      return true
    })
  }

  // 排序
  filtered.sort((a, b) => {
    if (sortBy.value === 'time') {
      return new Date(b.analysisTime).getTime() - new Date(a.analysisTime).getTime()
    } else if (sortBy.value === 'risk') {
      return b.riskScore - a.riskScore
    } else if (sortBy.value === 'name') {
      return a.name.localeCompare(b.name)
    }
    return 0
  })

  return filtered
})

// 文件上传前检查
const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  const isImage = validTypes.includes(file.type)
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isImage) {
    ElMessage.error('只能上传 JPG、PNG、GIF、WEBP 格式的图片!')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过 10MB!')
    return false
  }
  return true
}

// 处理文件上传
const handleFileChange: UploadProps['onChange'] = (uploadFile) => {
  if (!uploadFile.raw) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const imageAnalysis: ImageAnalysis = {
      id: Date.now().toString(),
      name: uploadFile.name || '',
      url: e.target?.result as string,
      status: 'pending',
      progress: 0,
      detections: [],
      riskScore: 0,
      analysisTime: new Date().toISOString(),
      fileSize: uploadFile.size || 0,
      dimensions: { width: 0, height: 0 }
    }

    uploadedImages.value.push(imageAnalysis)

    // 获取图片尺寸
    const img = new Image()
    img.onload = () => {
      imageAnalysis.dimensions = { width: img.width, height: img.height }
    }
    img.src = imageAnalysis.url
  }
  reader.readAsDataURL(uploadFile.raw)
}

// 开始分析
const startAnalysis = (image: ImageAnalysis) => {
  currentImage.value = image
  image.status = 'analyzing'
  isAnalyzing.value = true

  // 模拟分析进度
  let progress = 0
  const interval = setInterval(() => {
    progress += Math.random() * 20
    if (progress >= 100) {
      progress = 100
      clearInterval(interval)
      completeAnalysis(image)
    }
    image.progress = Math.min(progress, 100)
  }, 300)
}

// 完成分析
const completeAnalysis = (image: ImageAnalysis) => {
  image.status = 'completed'
  image.analysisTime = new Date().toISOString()

  // 生成模拟检测结果
  const mockDetections = generateMockDetections()
  image.detections = mockDetections
  image.riskScore = calculateRiskScore(mockDetections)

  isAnalyzing.value = false
  ElMessage.success(`${image.name} 分析完成`)
}

// 生成模拟检测结果
const generateMockDetections = (): DetectionBox[] => {
  const detections: DetectionBox[] = []
  const types = ['high', 'medium', 'low'] as const
  const labels = ['暴力行为', '危险动作', '不当场景', '敏感内容', '可疑行为']

  const numDetections = Math.floor(Math.random() * 5) + 1

  for (let i = 0; i < numDetections; i++) {
    const type = types[Math.floor(Math.random() * types.length)]
    detections.push({
      id: `detection-${Date.now()}-${i}`,
      type,
      label: labels[Math.floor(Math.random() * labels.length)],
      confidence: Math.floor(Math.random() * 30) + 70,
      x: Math.floor(Math.random() * 200) + 50,
      y: Math.floor(Math.random() * 150) + 50,
      width: Math.floor(Math.random() * 100) + 80,
      height: Math.floor(Math.random() * 80) + 60,
      description: `检测到${labels[Math.floor(Math.random() * labels.length)]}，置信度${Math.floor(Math.random() * 30) + 70}%`
    })
  }

  return detections
}

// 计算风险评分
const calculateRiskScore = (detections: DetectionBox[]): number => {
  if (detections.length === 0) return 0

  let totalScore = 0
  detections.forEach(detection => {
    const typeWeight = detection.type === 'high' ? 1 : detection.type === 'medium' ? 0.6 : 0.3
    totalScore += detection.confidence * typeWeight
  })

  return Math.min(Math.floor(totalScore / detections.length), 100)
}

// 获取风险等级颜色
const getRiskColor = (score: number) => {
  if (score >= 80) return '#f56565'
  if (score >= 50) return '#ed8936'
  return '#48bb78'
}

// 获取检测框颜色
const getDetectionBoxColor = (type: string) => {
  switch (type) {
    case 'high': return '#f56565'
    case 'medium': return '#ed8936'
    case 'low': return '#48bb78'
    default: return '#718096'
  }
}

// 图像操作
const zoomIn = () => {
  imageScale.value = Math.min(imageScale.value + 0.2, 3)
}

const zoomOut = () => {
  imageScale.value = Math.max(imageScale.value - 0.2, 0.5)
}

const resetZoom = () => {
  imageScale.value = 1
  imageRotation.value = 0
}

const rotateImage = () => {
  imageRotation.value += 90
}

// 删除图像
const deleteImage = async (image: ImageAnalysis) => {
  try {
    await ElMessageBox.confirm('确定要删除这张图片吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    const index = uploadedImages.value.findIndex(img => img.id === image.id)
    if (index > -1) {
      uploadedImages.value.splice(index, 1)
      if (currentImage.value?.id === image.id) {
        currentImage.value = null
      }
      ElMessage.success('删除成功')
    }
  } catch {
    // 用户取消删除
  }
}

// 导出报告
const exportReport = (image: ImageAnalysis) => {
  const report = {
    imageInfo: {
      name: image.name,
      size: image.fileSize,
      dimensions: image.dimensions,
      analysisTime: image.analysisTime
    },
    riskScore: image.riskScore,
    detections: image.detections,
    statistics: statistics.value
  }

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${image.name}_analysis_report.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  ElMessage.success('报告导出成功')
}

// 批量分析
const batchAnalyze = () => {
  const pendingImages = uploadedImages.value.filter(img => img.status === 'pending')
  if (pendingImages.length === 0) {
    ElMessage.warning('没有待分析的图片')
    return
  }

  pendingImages.forEach((image, index) => {
    setTimeout(() => {
      startAnalysis(image)
    }, index * 1000)
  })
}

// 生命周期
onMounted(() => {
  // 初始化时可以添加一些示例数据
})
</script>

<template>
  <div class="image-behavior-analysis">
    <el-card class="page-header" shadow="never">
      <template #header>
        <div class="header-content">
          <div class="title">
            <h2>图像行为识别</h2>
            <p>基于计算机视觉技术的智能图像内容分析系统</p>
          </div>
          <div class="statistics">
            <el-row :gutter="20">
              <el-col :span="6">
                <el-statistic title="总检测数" :value="statistics.total" />
              </el-col>
              <el-col :span="6">
                <el-statistic title="已完成" :value="statistics.completed" />
              </el-col>
              <el-col :span="6">
                <el-statistic title="高危风险" :value="statistics.highRisk" value-style="#f56565" />
              </el-col>
              <el-col :span="6">
                <el-statistic title="中危风险" :value="statistics.mediumRisk" value-style="#ed8936" />
              </el-col>
            </el-row>
          </div>
        </div>
      </template>
    </el-card>

    <el-row :gutter="20" class="main-content">
      <!-- 左侧：上传和配置区域 -->
      <el-col :span="8">
        <el-card title="图像上传" shadow="hover" class="upload-card">
          <el-upload
            class="upload-area"
            drag
            multiple
            :auto-upload="false"
            :show-file-list="false"
            :before-upload="beforeUpload"
            :on-change="handleFileChange"
            accept="image/jpeg,image/png,image/gif,image/webp"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将图片拖拽到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 JPG/PNG/GIF/WEBP 格式，单个文件不超过 10MB
              </div>
            </template>
          </el-upload>

          <div class="upload-actions" v-if="uploadedImages.length > 0">
            <el-button type="primary" @click="batchAnalyze" :loading="isAnalyzing">
              批量分析
            </el-button>
            <el-button @click="uploadedImages = []">清空列表</el-button>
          </div>
        </el-card>

        <el-card title="检测配置" shadow="hover" class="config-card">
          <el-form label-position="top">
            <el-form-item label="检测敏感度">
              <el-slider
                v-model="detectionConfig.sensitivity"
                :min="30"
                :max="100"
                :step="5"
                show-input
              />
            </el-form-item>

            <el-form-item label="置信度阈值">
              <el-slider
                v-model="detectionConfig.confidenceThreshold"
                :min="20"
                :max="95"
                :step="5"
                show-input
              />
            </el-form-item>

            <el-form-item label="检测类型">
              <el-space direction="vertical" style="width: 100%">
                <el-switch
                  v-model="detectionConfig.detectViolence"
                  active-text="暴力行为"
                  inactive-text="关闭"
                />
                <el-switch
                  v-model="detectionConfig.detectInappropriate"
                  active-text="不当场景"
                  inactive-text="关闭"
                />
                <el-switch
                  v-model="detectionConfig.detectDangerous"
                  active-text="危险动作"
                  inactive-text="关闭"
                />
                <el-switch
                  v-model="detectionConfig.detectSensitive"
                  active-text="敏感内容"
                  inactive-text="关闭"
                />
              </el-space>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 右侧：图像列表和结果展示 -->
      <el-col :span="16">
        <el-card shadow="hover" class="image-list-card">
          <template #header>
            <div class="card-header">
              <span>图像列表</span>
              <div class="filter-controls">
                <el-select v-model="filterType" style="width: 120px; margin-right: 10px">
                  <el-option label="全部" value="all" />
                  <el-option label="高危" value="high" />
                  <el-option label="中危" value="medium" />
                  <el-option label="低危" value="low" />
                </el-select>
                <el-select v-model="sortBy" style="width: 120px">
                  <el-option label="按时间" value="time" />
                  <el-option label="按风险" value="risk" />
                  <el-option label="按名称" value="name" />
                </el-select>
              </div>
            </div>
          </template>

          <div class="image-grid" v-if="filteredImages.length > 0">
            <div
              v-for="image in filteredImages"
              :key="image.id"
              class="image-item"
              :class="{ active: currentImage?.id === image.id }"
              @click="currentImage = image"
            >
              <div class="image-preview">
                <img :src="image.url" :alt="image.name" />
                <div class="image-overlay">
                  <el-progress
                    v-if="image.status === 'analyzing'"
                    :percentage="image.progress"
                    :width="60"
                    type="circle"
                  />
                  <el-tag
                    v-else
                    :type="image.riskScore >= 80 ? 'danger' : image.riskScore >= 50 ? 'warning' : 'success'"
                    size="small"
                  >
                    {{ image.riskScore }}分
                  </el-tag>
                </div>
              </div>

              <div class="image-info">
                <div class="image-name" :title="image.name">{{ image.name }}</div>
                <div class="image-meta">
                  <span>{{ (image.fileSize / 1024).toFixed(1) }}KB</span>
                  <span>{{ image.dimensions.width }}×{{ image.dimensions.height }}</span>
                </div>
                <div class="image-actions">
                  <el-button
                    v-if="image.status === 'pending'"
                    type="primary"
                    size="small"
                    @click.stop="startAnalysis(image)"
                    :loading="isAnalyzing"
                  >
                    分析
                  </el-button>
                  <el-button
                    v-if="image.status === 'completed'"
                    type="success"
                    size="small"
                    @click.stop="exportReport(image)"
                  >
                    报告
                  </el-button>
                  <el-button
                    type="danger"
                    size="small"
                    @click.stop="deleteImage(image)"
                  >
                    删除
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <el-empty v-else description="暂无图片数据" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 图像分析详情弹窗 -->
    <el-dialog
      v-model="currentImage"
      title="图像分析详情"
      width="90%"
      destroy-on-close
    >
      <div class="analysis-detail" v-if="currentImage">
        <el-row :gutter="20">
          <el-col :span="16">
            <div class="image-viewer">
              <div class="image-controls">
                <el-button-group>
                  <el-button @click="zoomIn"><el-icon><ZoomIn /></el-icon></el-button>
                  <el-button @click="zoomOut"><el-icon><ZoomOut /></el-icon></el-button>
                  <el-button @click="resetZoom"><el-icon><Refresh /></el-icon></el-button>
                  <el-button @click="rotateImage"><el-icon><RefreshRight /></el-icon></el-button>
                </el-button-group>
                <span class="scale-info">{{ (imageScale * 100).toFixed(0) }}%</span>
              </div>

              <div class="image-container" :style="{ transform: `scale(${imageScale}) rotate(${imageRotation}deg)` }">
                <img :src="currentImage.url" :alt="currentImage.name" />
                <svg
                  class="detection-overlay"
                  :viewBox="`0 0 ${currentImage.dimensions.width} ${currentImage.dimensions.height}`"
                  v-if="currentImage.status === 'completed' && currentImage.detections.length > 0"
                >
                  <rect
                    v-for="detection in currentImage.detections"
                    :key="detection.id"
                    :x="detection.x"
                    :y="detection.y"
                    :width="detection.width"
                    :height="detection.height"
                    :stroke="getDetectionBoxColor(detection.type)"
                    stroke-width="2"
                    fill="none"
                    class="detection-box"
                  />
                  <text
                    v-for="detection in currentImage.detections"
                    :key="`text-${detection.id}`"
                    :x="detection.x"
                    :y="detection.y - 5"
                    :fill="getDetectionBoxColor(detection.type)"
                    font-size="12"
                    font-weight="bold"
                  >
                    {{ detection.label }} ({{ detection.confidence }}%)
                  </text>
                </svg>
              </div>
            </div>
          </el-col>

          <el-col :span="8">
            <div class="analysis-info">
              <el-descriptions title="图像信息" :column="1" border>
                <el-descriptions-item label="文件名">{{ currentImage.name }}</el-descriptions-item>
                <el-descriptions-item label="文件大小">{{ (currentImage.fileSize / 1024).toFixed(1) }}KB</el-descriptions-item>
                <el-descriptions-item label="图像尺寸">{{ currentImage.dimensions.width }}×{{ currentImage.dimensions.height }}</el-descriptions-item>
                <el-descriptions-item label="分析时间">{{ new Date(currentImage.analysisTime).toLocaleString() }}</el-descriptions-item>
                <el-descriptions-item label="风险评分">
                  <el-tag
                    :type="currentImage.riskScore >= 80 ? 'danger' : currentImage.riskScore >= 50 ? 'warning' : 'success'"
                    :color="getRiskColor(currentImage.riskScore)"
                  >
                    {{ currentImage.riskScore }}分
                  </el-tag>
                </el-descriptions-item>
              </el-descriptions>

              <div class="detection-results" v-if="currentImage.detections.length > 0">
                <h4>检测结果</h4>
                <div class="detection-list">
                  <div
                    v-for="detection in currentImage.detections"
                    :key="detection.id"
                    class="detection-item"
                  >
                    <div class="detection-header">
                      <el-tag
                        :type="detection.type === 'high' ? 'danger' : detection.type === 'medium' ? 'warning' : 'success'"
                        size="small"
                      >
                        {{ detection.label }}
                      </el-tag>
                      <span class="confidence">置信度: {{ detection.confidence }}%</span>
                    </div>
                    <p class="detection-description">{{ detection.description }}</p>
                  </div>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">

.page-header {
  margin-bottom: 20px;

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title {
      h2 {
        margin: 0 0 8px 0;
        color: #2c3e50;
        font-size: 24px;
        font-weight: 600;
      }

      p {
        margin: 0;
        color: #7f8c8d;
        font-size: 14px;
      }
    }

    .statistics {
      min-width: 400px;
    }
  }
}

.main-content {
  .upload-card {
    margin-bottom: 20px;
  }

  .upload-area {
    width: 100%;
    margin-bottom: 20px;
  }

  .upload-actions {
    display: flex;
    gap: 10px;
    justify-content: center;
  }

  .config-card {
    .el-form-item {
      margin-bottom: 20px;
    }
  }
}

.image-list-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .filter-controls {
      display: flex;
      gap: 10px;
    }
  }

  .image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 20px;
    max-height: 600px;
    overflow-y: auto;
    padding: 10px 0;
  }

  .image-item {
    border: 2px solid #e4e7ed;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      border-color: #409eff;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    &.active {
      border-color: #409eff;
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
    }

    .image-preview {
      position: relative;
      height: 150px;
      overflow: hidden;
      background: #f5f7fa;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .image-overlay {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }
    }

    .image-info {
      padding: 12px;
      background: white;

      .image-name {
        font-weight: 500;
        margin-bottom: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .image-meta {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #909399;
        margin-bottom: 8px;
      }

      .image-actions {
        display: flex;
        gap: 4px;
      }
    }
  }
}

.analysis-detail {
  .image-viewer {
    text-align: center;

    .image-controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 10px;
      margin-bottom: 20px;

      .scale-info {
        font-size: 14px;
        color: #666;
        min-width: 50px;
      }
    }

    .image-container {
      position: relative;
      display: inline-block;
      transition: transform 0.3s ease;

      img {
        max-width: 100%;
        height: auto;
        display: block;
        border-radius: 8px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
      }

      .detection-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;

        .detection-box {
          stroke-dasharray: 5, 5;
          animation: dash 20s linear infinite;
        }
      }
    }
  }

  .analysis-info {
    .detection-results {
      margin-top: 20px;

      h4 {
        margin-bottom: 12px;
        color: #2c3e50;
      }

      .detection-list {
        max-height: 300px;
        overflow-y: auto;

        .detection-item {
          border: 1px solid #e4e7ed;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 8px;
          background: #fafafa;

          .detection-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;

            .confidence {
              font-size: 12px;
              color: #666;
            }
          }

          .detection-description {
            margin: 0;
            font-size: 13px;
            color: #666;
            line-height: 1.4;
          }
        }
      }
    }
  }
}

@keyframes dash {
  to {
    stroke-dashoffset: -100;
  }
}

// Element Plus 图标组件别名
:deep(.el-icon--upload) {
  font-size: 67px;
  color: #c0c4cc;
  margin: 40px 0 16px;
  line-height: 50px;
}
</style>