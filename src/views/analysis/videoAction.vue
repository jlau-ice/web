<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage, ElNotification, ElMessageBox } from 'element-plus'
import type { UploadProps } from 'element-plus'

// 类型定义
interface DetectionConfig {
  sensitivity: number
  confidenceThreshold: number
  frameRate: number
  detectViolence: boolean
  detectDangerous: boolean
  detectAbnormal: boolean
  detectInteraction: boolean
  enableRealtime: boolean
  modelType: string
}

interface ActionDetection {
  id: string
  timestamp: number
  type: 'high' | 'medium' | 'low'
  label: string
  confidence: number
  x: number
  y: number
  width: number
  height: number
  description: string
  trajectory?: { x: number; y: number }[]
}

interface VideoAnalysis {
  id: string
  name: string
  url: string
  type: 'upload' | 'camera' | 'stream'
  status: 'pending' | 'analyzing' | 'completed' | 'paused' | 'failed'
  progress: number
  duration: number
  currentTime: number
  detections: ActionDetection[]
  riskScore: number
  analysisTime: string
  fileSize: number
  resolution: { width: number; height: number }
}

interface TimelineEvent {
  time: number
  type: 'high' | 'medium' | 'low'
  label: string
  description: string
}

// 响应式数据
const videoList = ref<VideoAnalysis[]>([])
const currentVideo = ref<VideoAnalysis | null>(null)
const isAnalyzing = ref(false)
const isPlaying = ref(false)
const videoElement = ref<HTMLVideoElement | null>(null)
const canvasElement = ref<HTMLCanvasElement | null>(null)
const cameraStream = ref<MediaStream | null>(null)
const availableCameras = ref<MediaDeviceInfo[]>([])
const selectedCamera = ref<string>('')
const playbackSpeed = ref(1)
const currentFrame = ref(0)
const showConfig = ref(false)
const showTimeline = ref(true)

// 检测配置
const detectionConfig = reactive<DetectionConfig>({
  sensitivity: 75,
  confidenceThreshold: 65,
  frameRate: 30,
  detectViolence: true,
  detectDangerous: true,
  detectAbnormal: true,
  detectInteraction: true,
  enableRealtime: true,
  modelType: 'advanced'
})

// 统计数据
const statistics = computed(() => {
  const total = videoList.value.length
  const completed = videoList.value.filter(v => v.status === 'completed').length
  const totalDetections = currentVideo.value?.detections.length || 0
  
  let highRisk = 0
  let mediumRisk = 0
  let lowRisk = 0

  if (currentVideo.value) {
    highRisk = currentVideo.value.detections.filter(d => d.type === 'high').length
    mediumRisk = currentVideo.value.detections.filter(d => d.type === 'medium').length
    lowRisk = currentVideo.value.detections.filter(d => d.type === 'low').length
  }

  return { total, completed, totalDetections, highRisk, mediumRisk, lowRisk }
})

// 时间轴事件
const timelineEvents = computed((): TimelineEvent[] => {
  if (!currentVideo.value || currentVideo.value.detections.length === 0) {
    return []
  }

  return currentVideo.value.detections.map(detection => ({
    time: detection.timestamp,
    type: detection.type,
    label: detection.label,
    description: detection.description
  }))
})

// 检测结果按时间分组
const detectionsByTime = computed(() => {
  if (!currentVideo.value) return {}

  const grouped: { [key: number]: ActionDetection[] } = {}
  currentVideo.value.detections.forEach(detection => {
    const timeKey = Math.floor(detection.timestamp)
    if (!grouped[timeKey]) {
      grouped[timeKey] = []
    }
    grouped[timeKey].push(detection)
  })

  return grouped
})

// 获取当前时间的检测结果
const currentDetections = computed((): ActionDetection[] => {
  if (!currentVideo.value) return []

  const currentTime = Math.floor(currentVideo.value.currentTime)
  return detectionsByTime.value[currentTime] || []
})

// 初始化摄像头列表
const initCameras = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    availableCameras.value = devices.filter(device => device.kind === 'videoinput')
    if (availableCameras.value.length > 0) {
      selectedCamera.value = availableCameras.value[0].deviceId
    }
  } catch (error) {
    console.error('获取摄像头列表失败:', error)
    ElMessage.error('无法获取摄像头列表')
  }
}

// 启动摄像头
const startCamera = async () => {
  try {
    if (cameraStream.value) {
      stopCamera()
    }

    const constraints = {
      video: {
        deviceId: selectedCamera.value ? { exact: selectedCamera.value } : undefined,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    }

    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    cameraStream.value = stream

    const video: VideoAnalysis = {
      id: `camera-${Date.now()}`,
      name: '实时摄像头',
      url: '',
      type: 'camera',
      status: 'pending',
      progress: 0,
      duration: 0,
      currentTime: 0,
      detections: [],
      riskScore: 0,
      analysisTime: new Date().toISOString(),
      fileSize: 0,
      resolution: { width: 1280, height: 720 }
    }

    videoList.value.unshift(video)
    currentVideo.value = video

    if (videoElement.value) {
      videoElement.value.srcObject = stream
      await videoElement.value.play()
    }

    ElMessage.success('摄像头启动成功')

    // 自动开始检测
    if (detectionConfig.enableRealtime) {
      startAnalysis(video)
    }
  } catch (error) {
    console.error('启动摄像头失败:', error)
    ElMessage.error('摄像头启动失败，请检查权限设置')
  }
}

// 停止摄像头
const stopCamera = () => {
  if (cameraStream.value) {
    cameraStream.value.getTracks().forEach(track => track.stop())
    cameraStream.value = null
    
    if (videoElement.value) {
      videoElement.value.srcObject = null
    }

    ElMessage.info('摄像头已停止')
  }
}

// 文件上传前检查
const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi']
  const isVideo = validTypes.some(type => file.type.startsWith('video/'))
  const isLt100M = file.size / 1024 / 1024 < 100

  if (!isVideo) {
    ElMessage.error('只能上传视频文件!')
    return false
  }
  if (!isLt100M) {
    ElMessage.error('视频大小不能超过 100MB!')
    return false
  }
  return true
}

// 处理文件上传
const handleFileChange: UploadProps['onChange'] = async (uploadFile) => {
  if (!uploadFile.raw) return

  const url = URL.createObjectURL(uploadFile.raw)
  
  const video: VideoAnalysis = {
    id: `video-${Date.now()}`,
    name: uploadFile.name || '',
    url: url,
    type: 'upload',
    status: 'pending',
    progress: 0,
    duration: 0,
    currentTime: 0,
    detections: [],
    riskScore: 0,
    analysisTime: new Date().toISOString(),
    fileSize: uploadFile.size || 0,
    resolution: { width: 0, height: 0 }
  }

  // 加载视频元数据
  const videoEl = document.createElement('video')
  videoEl.src = url
  videoEl.onloadedmetadata = () => {
    video.duration = videoEl.duration
    video.resolution = {
      width: videoEl.videoWidth,
      height: videoEl.videoHeight
    }
  }

  videoList.value.push(video)
  currentVideo.value = video

  ElMessage.success('视频加载成功')
}

// 选择视频
const selectVideo = (video: VideoAnalysis) => {
  currentVideo.value = video
  isPlaying.value = false

  if (video.type === 'camera') {
    // 摄像头视频
    if (cameraStream.value && videoElement.value) {
      videoElement.value.srcObject = cameraStream.value
    }
  } else if (videoElement.value) {
    // 上传的视频
    videoElement.value.src = video.url
    videoElement.value.currentTime = video.currentTime
  }
}

// 开始分析
const startAnalysis = async (video: VideoAnalysis) => {
  if (video.status === 'analyzing') {
    ElMessage.warning('正在分析中...')
    return
  }

  video.status = 'analyzing'
  video.progress = 0
  video.detections = []
  isAnalyzing.value = true

  ElNotification({
    title: '开始分析',
    message: `正在分析视频 "${video.name}"`,
    type: 'info',
    duration: 2000
  })

  // 模拟分析进度
  const interval = setInterval(() => {
    video.progress += Math.random() * 15
    if (video.progress >= 100) {
      video.progress = 100
      clearInterval(interval)
      completeAnalysis(video)
    }
  }, 500)
}

// 完成分析
const completeAnalysis = (video: VideoAnalysis) => {
  video.status = 'completed'
  video.analysisTime = new Date().toISOString()

  // 生成模拟检测结果
  const mockDetections = generateMockDetections(video.duration || 30)
  video.detections = mockDetections
  video.riskScore = calculateRiskScore(mockDetections)

  isAnalyzing.value = false

  ElNotification({
    title: '分析完成',
    message: `检测到 ${mockDetections.length} 个动作事件，风险评分: ${video.riskScore}`,
    type: video.riskScore >= 80 ? 'error' : video.riskScore >= 50 ? 'warning' : 'success',
    duration: 3000
  })
}

// 生成模拟检测结果
const generateMockDetections = (duration: number): ActionDetection[] => {
  const detections: ActionDetection[] = []
  const types: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low']
  const labels = [
    { type: 'high', labels: ['暴力冲突', '持械威胁', '打斗行为', '危险攻击'] },
    { type: 'medium', labels: ['推搡行为', '激烈争吵', '快速追逐', '可疑动作'] },
    { type: 'low', labels: ['异常聚集', '徘徊行为', '快速移动', '遮挡行为'] }
  ]

  const numDetections = Math.floor(Math.random() * 15) + 5

  for (let i = 0; i < numDetections; i++) {
    const type = types[Math.floor(Math.random() * types.length)]
    const typeLabels = labels.find(l => l.type === type)?.labels || []
    const label = typeLabels[Math.floor(Math.random() * typeLabels.length)]
    const timestamp = Math.random() * duration

    // 生成轨迹点
    const trajectory: { x: number; y: number }[] = []
    for (let j = 0; j < 5; j++) {
      trajectory.push({
        x: Math.floor(Math.random() * 400) + 100,
        y: Math.floor(Math.random() * 300) + 100
      })
    }

    detections.push({
      id: `detection-${Date.now()}-${i}`,
      timestamp: timestamp,
      type,
      label,
      confidence: Math.floor(Math.random() * 30) + 70,
      x: Math.floor(Math.random() * 300) + 100,
      y: Math.floor(Math.random() * 200) + 100,
      width: Math.floor(Math.random() * 100) + 80,
      height: Math.floor(Math.random() * 120) + 100,
      description: `在 ${formatTime(timestamp)} 检测到${label}，置信度${Math.floor(Math.random() * 30) + 70}%`,
      trajectory
    })
  }

  // 按时间排序
  return detections.sort((a, b) => a.timestamp - b.timestamp)
}

// 计算风险评分
const calculateRiskScore = (detections: ActionDetection[]): number => {
  if (detections.length === 0) return 0

  let totalScore = 0
  detections.forEach(detection => {
    const typeWeight = detection.type === 'high' ? 1 : detection.type === 'medium' ? 0.6 : 0.3
    totalScore += detection.confidence * typeWeight
  })

  return Math.min(Math.floor(totalScore / detections.length), 100)
}

// 视频播放控制
const togglePlay = () => {
  if (!videoElement.value) return

  if (isPlaying.value) {
    videoElement.value.pause()
  } else {
    videoElement.value.play()
  }
  isPlaying.value = !isPlaying.value
}

const stopVideo = () => {
  if (!videoElement.value) return
  videoElement.value.pause()
  videoElement.value.currentTime = 0
  isPlaying.value = false
  if (currentVideo.value) {
    currentVideo.value.currentTime = 0
  }
}

const seekVideo = (time: number) => {
  if (!videoElement.value || !currentVideo.value) return
  videoElement.value.currentTime = time
  currentVideo.value.currentTime = time
}

const changePlaybackSpeed = (speed: number) => {
  if (!videoElement.value) return
  playbackSpeed.value = speed
  videoElement.value.playbackRate = speed
  ElMessage.success(`播放速度: ${speed}x`)
}

const frameStep = (direction: 'forward' | 'backward') => {
  if (!videoElement.value || !currentVideo.value) return
  
  const frameDuration = 1 / detectionConfig.frameRate
  const newTime = direction === 'forward' 
    ? videoElement.value.currentTime + frameDuration
    : videoElement.value.currentTime - frameDuration

  if (newTime >= 0 && newTime <= currentVideo.value.duration) {
    videoElement.value.currentTime = newTime
    currentVideo.value.currentTime = newTime
  }
}

// 更新视频时间
const updateVideoTime = () => {
  if (videoElement.value && currentVideo.value) {
    currentVideo.value.currentTime = videoElement.value.currentTime
    drawDetectionOverlay()
  }
}

// 绘制检测标注
const drawDetectionOverlay = () => {
  if (!canvasElement.value || !videoElement.value || !currentVideo.value) return

  const canvas = canvasElement.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = videoElement.value.videoWidth || 1280
  canvas.height = videoElement.value.videoHeight || 720

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 绘制当前时间的检测框
  currentDetections.value.forEach(detection => {
    const color = getDetectionColor(detection.type)
    
    // 绘制边界框
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.strokeRect(detection.x, detection.y, detection.width, detection.height)

    // 绘制标签背景
    ctx.fillStyle = color
    ctx.fillRect(detection.x, detection.y - 25, 200, 25)

    // 绘制标签文字
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 14px Arial'
    ctx.fillText(`${detection.label} ${detection.confidence}%`, detection.x + 5, detection.y - 7)

    // 绘制轨迹
    if (detection.trajectory && detection.trajectory.length > 1) {
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(detection.trajectory[0].x, detection.trajectory[0].y)
      detection.trajectory.forEach(point => {
        ctx.lineTo(point.x, point.y)
      })
      ctx.stroke()
      ctx.setLineDash([])
    }
  })
}

// 获取检测框颜色
const getDetectionColor = (type: string): string => {
  switch (type) {
    case 'high': return '#f56c6c'
    case 'medium': return '#e6a23c'
    case 'low': return '#67c23a'
    default: return '#909399'
  }
}

// 获取风险等级文本
const getRiskLevelText = (score: number): string => {
  if (score >= 80) return '高危'
  if (score >= 50) return '中危'
  return '低危'
}

// 获取风险等级类型
const getRiskLevelType = (score: number): 'danger' | 'warning' | 'success' => {
  if (score >= 80) return 'danger'
  if (score >= 50) return 'warning'
  return 'success'
}

// 格式化时间
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

// 删除视频
const deleteVideo = async (video: VideoAnalysis) => {
  try {
    await ElMessageBox.confirm('确定要删除这个视频吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const index = videoList.value.findIndex(v => v.id === video.id)
    if (index > -1) {
      videoList.value.splice(index, 1)
      
      if (currentVideo.value?.id === video.id) {
        currentVideo.value = null
        stopVideo()
      }

      // 释放URL
      if (video.url && video.type === 'upload') {
        URL.revokeObjectURL(video.url)
      }

      ElMessage.success('删除成功')
    }
  } catch {
    // 用户取消
  }
}

// 导出报告
const exportReport = () => {
  if (!currentVideo.value) {
    ElMessage.warning('请先选择要导出的视频')
    return
  }

  const report = {
    videoInfo: {
      name: currentVideo.value.name,
      duration: currentVideo.value.duration,
      resolution: currentVideo.value.resolution,
      fileSize: currentVideo.value.fileSize,
      analysisTime: currentVideo.value.analysisTime
    },
    riskScore: currentVideo.value.riskScore,
    detections: currentVideo.value.detections,
    statistics: statistics.value,
    config: detectionConfig
  }

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${currentVideo.value.name}_analysis_report.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  ElMessage.success('报告导出成功')
}

// 跳转到时间点
const jumpToTime = (time: number) => {
  seekVideo(time)
  if (!isPlaying.value) {
    drawDetectionOverlay()
  }
}

// 生命周期
onMounted(() => {
  initCameras()

  // 监听视频时间更新
  if (videoElement.value) {
    videoElement.value.addEventListener('timeupdate', updateVideoTime)
  }
})

onBeforeUnmount(() => {
  // 停止摄像头
  stopCamera()

  // 释放视频资源
  videoList.value.forEach(video => {
    if (video.url && video.type === 'upload') {
      URL.revokeObjectURL(video.url)
    }
  })

  // 移除事件监听
  if (videoElement.value) {
    videoElement.value.removeEventListener('timeupdate', updateVideoTime)
  }
})
</script>

<template>
  <div class="video-action-detection">
    <!-- 页面标题 -->
    <el-card class="header-card" shadow="never">
      <div class="page-header">
        <div>
          <h2>视频动作检测</h2>
          <p class="page-description">实时视频流分析，检测违规动作和行为模式，识别复杂场景下的违规行为</p>
        </div>
        <div class="header-stats">
          <el-row :gutter="16">
            <el-col :span="6">
              <el-statistic title="视频总数" :value="statistics.total" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="检测总数" :value="statistics.totalDetections" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="高危动作" :value="statistics.highRisk">
                <template #suffix>
                  <span style="color: #f56c6c">次</span>
                </template>
              </el-statistic>
            </el-col>
            <el-col :span="6">
              <el-statistic title="可疑动作" :value="statistics.mediumRisk">
                <template #suffix>
                  <span style="color: #e6a23c">次</span>
                </template>
              </el-statistic>
            </el-col>
          </el-row>
        </div>
      </div>
    </el-card>

    <!-- 主要内容区 -->
    <el-row :gutter="20" class="main-content">
      <!-- 左侧：视频输入和配置 -->
      <el-col :span="6">
        <!-- 视频输入 -->
        <el-card shadow="hover" class="input-card">
          <template #header>
            <span>视频输入</span>
          </template>

          <!-- 文件上传 -->
          <div class="upload-section">
            <el-upload
              class="upload-area"
              drag
              :auto-upload="false"
              :show-file-list="false"
              :before-upload="beforeUpload"
              :on-change="handleFileChange"
              accept="video/*"
            >
              <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
              <div class="el-upload__text">
                拖拽视频到此处，或<em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  支持 MP4/WebM/OGG 格式，不超过 100MB
                </div>
              </template>
            </el-upload>
          </div>

          <!-- 摄像头选择 -->
          <div class="camera-section">
            <el-divider>或使用摄像头</el-divider>
            <el-select
              v-model="selectedCamera"
              placeholder="选择摄像头设备"
              style="width: 100%; margin-bottom: 12px"
            >
              <el-option
                v-for="camera in availableCameras"
                :key="camera.deviceId"
                :label="camera.label || `摄像头 ${camera.deviceId.substring(0, 8)}`"
                :value="camera.deviceId"
              />
            </el-select>
            <el-button
              type="primary"
              :icon="cameraStream ? 'VideoPause' : 'VideoPlay'"
              @click="cameraStream ? stopCamera() : startCamera()"
              style="width: 100%"
            >
              {{ cameraStream ? '停止摄像头' : '启动摄像头' }}
            </el-button>
          </div>
        </el-card>

        <!-- 检测配置 -->
        <el-card shadow="hover" class="config-card">
          <template #header>
            <div class="card-header">
              <span>检测配置</span>
              <el-button size="small" text @click="showConfig = !showConfig">
                {{ showConfig ? '收起' : '展开' }}
              </el-button>
            </div>
          </template>

          <el-collapse-transition>
            <div v-show="showConfig" class="config-content">
              <div class="config-item">
                <label>检测敏感度</label>
                <el-slider v-model="detectionConfig.sensitivity" :min="0" :max="100" show-input />
              </div>

              <div class="config-item">
                <label>置信度阈值</label>
                <el-slider v-model="detectionConfig.confidenceThreshold" :min="0" :max="100" show-input />
              </div>

              <div class="config-item">
                <label>检测帧率</label>
                <el-slider v-model="detectionConfig.frameRate" :min="1" :max="60" show-input />
              </div>

              <div class="config-item">
                <label>检测类型</label>
                <div class="checkbox-group">
                  <el-switch v-model="detectionConfig.detectViolence" active-text="暴力行为" />
                  <el-switch v-model="detectionConfig.detectDangerous" active-text="危险动作" />
                  <el-switch v-model="detectionConfig.detectAbnormal" active-text="异常行为" />
                  <el-switch v-model="detectionConfig.detectInteraction" active-text="多人交互" />
                  <el-switch v-model="detectionConfig.enableRealtime" active-text="实时检测" />
                </div>
              </div>

              <div class="config-item">
                <label>检测模型</label>
                <el-radio-group v-model="detectionConfig.modelType" size="small">
                  <el-radio-button label="basic">基础</el-radio-button>
                  <el-radio-button label="advanced">高级</el-radio-button>
                  <el-radio-button label="custom">自定义</el-radio-button>
                </el-radio-group>
              </div>
            </div>
          </el-collapse-transition>
        </el-card>

        <!-- 历史记录 -->
        <el-card shadow="hover" class="history-card">
          <template #header>
            <span>检测历史</span>
          </template>

          <div class="video-list">
            <div
              v-for="video in videoList"
              :key="video.id"
              class="video-item"
              :class="{ active: currentVideo?.id === video.id }"
              @click="selectVideo(video)"
            >
              <div class="video-item-header">
                <el-icon v-if="video.type === 'camera'"><VideoCamera /></el-icon>
                <el-icon v-else><VideoPlay /></el-icon>
                <span class="video-name">{{ video.name }}</span>
              </div>
              <div class="video-item-info">
                <el-tag v-if="video.status === 'analyzing'" type="warning" size="small">
                  分析中 {{ video.progress.toFixed(0) }}%
                </el-tag>
                <el-tag v-else-if="video.status === 'completed'" type="success" size="small">
                  已完成
                </el-tag>
                <el-tag v-else type="info" size="small">待分析</el-tag>
                
                <el-button
                  v-if="video.status === 'pending'"
                  size="small"
                  type="primary"
                  text
                  @click.stop="startAnalysis(video)"
                >
                  开始
                </el-button>
                <el-button
                  size="small"
                  type="danger"
                  text
                  @click.stop="deleteVideo(video)"
                >
                  删除
                </el-button>
              </div>
            </div>
          </div>

          <el-empty v-if="videoList.length === 0" description="暂无视频" :image-size="80" />
        </el-card>
      </el-col>

      <!-- 中间：视频播放和检测展示 -->
      <el-col :span="12">
        <el-card shadow="hover" class="video-card">
          <template #header>
            <div class="card-header">
              <span>视频播放</span>
              <div v-if="currentVideo" class="video-info-badge">
                <el-tag :type="getRiskLevelType(currentVideo.riskScore)">
                  风险评分: {{ currentVideo.riskScore }}
                </el-tag>
                <el-tag v-if="currentVideo.status === 'analyzing'" type="warning">
                  分析中 {{ currentVideo.progress.toFixed(0) }}%
                </el-tag>
              </div>
            </div>
          </template>

          <div class="video-container">
            <div class="video-wrapper">
              <video
                ref="videoElement"
                class="video-player"
                @click="togglePlay"
              ></video>
              <canvas ref="canvasElement" class="detection-overlay"></canvas>

              <!-- 当前检测信息叠加层 -->
              <div v-if="currentDetections.length > 0" class="detection-info-overlay">
                <div
                  v-for="detection in currentDetections"
                  :key="detection.id"
                  class="detection-badge"
                  :style="{
                    left: detection.x + 'px',
                    top: (detection.y + detection.height + 5) + 'px'
                  }"
                >
                  <el-tag :type="detection.type === 'high' ? 'danger' : detection.type === 'medium' ? 'warning' : 'success'" size="small">
                    {{ detection.label }}
                  </el-tag>
                </div>
              </div>
            </div>

            <el-empty v-if="!currentVideo" description="请上传视频或启动摄像头" :image-size="120" />

            <!-- 视频控制栏 -->
            <div v-if="currentVideo" class="video-controls">
              <!-- 进度条 -->
              <el-slider
                v-model="currentVideo.currentTime"
                :max="currentVideo.duration"
                :show-tooltip="true"
                :format-tooltip="formatTime"
                @input="seekVideo"
                class="progress-slider"
              />

              <!-- 控制按钮 -->
              <div class="control-buttons">
                <div class="left-controls">
                  <el-button-group>
                    <el-button :icon="isPlaying ? 'VideoPause' : 'VideoPlay'" @click="togglePlay" />
                    <el-button icon="RefreshLeft" @click="stopVideo" />
                  </el-button-group>

                  <span class="time-display">
                    {{ formatTime(currentVideo.currentTime) }} / {{ formatTime(currentVideo.duration) }}
                  </span>
                </div>

                <div class="center-controls">
                  <el-button-group>
                    <el-button size="small" @click="frameStep('backward')">
                      <el-icon><Back /></el-icon>
                      逐帧后退
                    </el-button>
                    <el-button size="small" @click="frameStep('forward')">
                      逐帧前进
                      <el-icon><Right /></el-icon>
                    </el-button>
                  </el-button-group>
                </div>

                <div class="right-controls">
                  <el-dropdown @command="changePlaybackSpeed">
                    <el-button>
                      {{ playbackSpeed }}x
                      <el-icon><ArrowDown /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item :command="0.25">0.25x</el-dropdown-item>
                        <el-dropdown-item :command="0.5">0.5x</el-dropdown-item>
                        <el-dropdown-item :command="1">1x</el-dropdown-item>
                        <el-dropdown-item :command="1.5">1.5x</el-dropdown-item>
                        <el-dropdown-item :command="2">2x</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 时间轴 -->
        <el-card v-if="currentVideo && currentVideo.status === 'completed'" shadow="hover" class="timeline-card">
          <template #header>
            <div class="card-header">
              <span>检测时间轴</span>
              <el-button size="small" text @click="showTimeline = !showTimeline">
                {{ showTimeline ? '收起' : '展开' }}
              </el-button>
            </div>
          </template>

          <el-collapse-transition>
            <div v-show="showTimeline" class="timeline-content">
              <el-timeline v-if="timelineEvents.length > 0">
                <el-timeline-item
                  v-for="(event, index) in timelineEvents"
                  :key="index"
                  :timestamp="formatTime(event.time)"
                  placement="top"
                  :type="event.type === 'high' ? 'danger' : event.type === 'medium' ? 'warning' : 'success'"
                >
                  <el-card shadow="hover" class="timeline-event" @click="jumpToTime(event.time)">
                    <div class="event-header">
                      <el-tag :type="event.type === 'high' ? 'danger' : event.type === 'medium' ? 'warning' : 'success'" size="small">
                        {{ event.label }}
                      </el-tag>
                      <el-button size="small" text type="primary">
                        跳转
                        <el-icon><VideoPlay /></el-icon>
                      </el-button>
                    </div>
                    <p class="event-description">{{ event.description }}</p>
                  </el-card>
                </el-timeline-item>
              </el-timeline>
              <el-empty v-else description="暂无检测事件" :image-size="80" />
            </div>
          </el-collapse-transition>
        </el-card>
      </el-col>

      <!-- 右侧：检测结果和分析 -->
      <el-col :span="6">
        <!-- 实时统计 -->
        <el-card shadow="hover" class="stats-card">
          <template #header>
            <span>检测统计</span>
          </template>

          <div class="stat-items">
            <div class="stat-item stat-high">
              <div class="stat-icon">
                <el-icon><Warning /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ statistics.highRisk }}</div>
                <div class="stat-label">高危动作</div>
              </div>
            </div>

            <div class="stat-item stat-medium">
              <div class="stat-icon">
                <el-icon><WarningFilled /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ statistics.mediumRisk }}</div>
                <div class="stat-label">可疑动作</div>
              </div>
            </div>

            <div class="stat-item stat-low">
              <div class="stat-icon">
                <el-icon><InfoFilled /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ statistics.lowRisk }}</div>
                <div class="stat-label">异常动作</div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 检测结果列表 -->
        <el-card shadow="hover" class="detection-list-card">
          <template #header>
            <div class="card-header">
              <span>检测结果</span>
              <el-button v-if="currentVideo?.detections.length" size="small" @click="exportReport">
                <el-icon><Download /></el-icon>
                导出
              </el-button>
            </div>
          </template>

          <div v-if="currentVideo && currentVideo.detections.length > 0" class="detection-list">
            <div
              v-for="detection in currentVideo.detections"
              :key="detection.id"
              class="detection-item"
              :class="`detection-${detection.type}`"
              @click="jumpToTime(detection.timestamp)"
            >
              <div class="detection-header">
                <el-tag
                  :type="detection.type === 'high' ? 'danger' : detection.type === 'medium' ? 'warning' : 'success'"
                  size="small"
                >
                  {{ detection.label }}
                </el-tag>
                <span class="detection-time">{{ formatTime(detection.timestamp) }}</span>
              </div>
              <div class="detection-body">
                <div class="detection-confidence">
                  <span>置信度</span>
                  <el-progress
                    :percentage="detection.confidence"
                    :color="getDetectionColor(detection.type)"
                    :show-text="false"
                  />
                  <span>{{ detection.confidence }}%</span>
                </div>
                <p class="detection-description">{{ detection.description }}</p>
              </div>
            </div>
          </div>

          <el-empty v-else description="暂无检测结果" :image-size="100" />
        </el-card>

        <!-- 视频信息 -->
        <el-card v-if="currentVideo" shadow="hover" class="info-card">
          <template #header>
            <span>视频信息</span>
          </template>

          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item label="文件名">{{ currentVideo.name }}</el-descriptions-item>
            <el-descriptions-item label="类型">
              <el-tag v-if="currentVideo.type === 'camera'" type="success">实时摄像头</el-tag>
              <el-tag v-else type="info">上传视频</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="时长">{{ formatTime(currentVideo.duration) }}</el-descriptions-item>
            <el-descriptions-item label="分辨率">
              {{ currentVideo.resolution.width }}×{{ currentVideo.resolution.height }}
            </el-descriptions-item>
            <el-descriptions-item label="文件大小">
              {{ formatFileSize(currentVideo.fileSize) }}
            </el-descriptions-item>
            <el-descriptions-item label="分析时间">
              {{ new Date(currentVideo.analysisTime).toLocaleString() }}
            </el-descriptions-item>
            <el-descriptions-item label="检测数量">
              {{ currentVideo.detections.length }} 个
            </el-descriptions-item>
            <el-descriptions-item label="风险评分">
              <el-tag :type="getRiskLevelType(currentVideo.riskScore)" effect="dark">
                {{ currentVideo.riskScore }} / {{ getRiskLevelText(currentVideo.riskScore) }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.video-action-detection {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;

  .header-card {
    margin-bottom: 20px;
    border-radius: 8px;

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;

      h2 {
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 600;
        color: #303133;
      }

      .page-description {
        margin: 0;
        color: #909399;
        font-size: 14px;
      }

      .header-stats {
        flex: 1;
        max-width: 600px;
      }
    }
  }

  .main-content {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
    }
  }

  // 左侧卡片样式
  .input-card,
  .config-card,
  .history-card {
    margin-bottom: 20px;
    border-radius: 8px;
  }

  .upload-section {
    margin-bottom: 20px;

    .upload-area {
      :deep(.el-upload-dragger) {
        padding: 20px;
      }
    }
  }

  .camera-section {
    margin-top: 20px;
  }

  .config-content {
    .config-item {
      margin-bottom: 20px;

      &:last-child {
        margin-bottom: 0;
      }

      label {
        display: block;
        margin-bottom: 8px;
        color: #606266;
        font-weight: 600;
        font-size: 14px;
      }

      .checkbox-group {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
    }
  }

  .video-list {
    max-height: 400px;
    overflow-y: auto;

    .video-item {
      padding: 12px;
      margin-bottom: 8px;
      background: #f5f7fa;
      border-radius: 6px;
      border: 2px solid transparent;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        background: #ecf5ff;
        border-color: #409eff;
      }

      &.active {
        background: #ecf5ff;
        border-color: #409eff;
      }

      .video-item-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;

        .video-name {
          flex: 1;
          font-weight: 600;
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }

      .video-item-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }
    }
  }

  // 中间视频播放器样式
  .video-card,
  .timeline-card {
    margin-bottom: 20px;
    border-radius: 8px;
  }

  .video-info-badge {
    display: flex;
    gap: 8px;
  }

  .video-container {
    .video-wrapper {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      background: #000;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 16px;

      .video-player {
        width: 100%;
        height: 100%;
        object-fit: contain;
        cursor: pointer;
      }

      .detection-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }

      .detection-info-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;

        .detection-badge {
          position: absolute;
          transform: translateX(-50%);
          animation: pulse 2s infinite;
        }
      }
    }

    .video-controls {
      .progress-slider {
        margin-bottom: 16px;
      }

      .control-buttons {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;

        .left-controls,
        .center-controls,
        .right-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .time-display {
          font-size: 14px;
          color: #606266;
          white-space: nowrap;
        }
      }
    }
  }

  .timeline-content {
    max-height: 400px;
    overflow-y: auto;

    .timeline-event {
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
        transform: translateX(4px);
      }

      .event-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .event-description {
        margin: 0;
        font-size: 13px;
        color: #606266;
      }
    }
  }

  // 右侧卡片样式
  .stats-card,
  .detection-list-card,
  .info-card {
    margin-bottom: 20px;
    border-radius: 8px;
  }

  .stat-items {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .stat-item {
      display: flex;
      align-items: center;
      padding: 16px;
      border-radius: 8px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;

      .stat-icon {
        font-size: 32px;
        margin-right: 12px;
        opacity: 0.9;
      }

      .stat-content {
        flex: 1;

        .stat-value {
          font-size: 28px;
          font-weight: bold;
          line-height: 1;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 13px;
          opacity: 0.9;
        }
      }

      &.stat-high {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      }

      &.stat-medium {
        background: linear-gradient(135deg, #fad0c4 0%, #ff9a9e 100%);
      }

      &.stat-low {
        background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
      }
    }
  }

  .detection-list {
    max-height: 500px;
    overflow-y: auto;

    .detection-item {
      padding: 12px;
      margin-bottom: 8px;
      border-radius: 6px;
      border-left: 4px solid;
      background: #f5f7fa;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        background: #ecf5ff;
        transform: translateX(4px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      &.detection-high {
        border-left-color: #f56c6c;
      }

      &.detection-medium {
        border-left-color: #e6a23c;
      }

      &.detection-low {
        border-left-color: #67c23a;
      }

      .detection-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        .detection-time {
          font-size: 12px;
          color: #909399;
          font-weight: 600;
        }
      }

      .detection-body {
        .detection-confidence {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;

          span {
            font-size: 12px;
            color: #606266;
            white-space: nowrap;
          }

          .el-progress {
            flex: 1;
          }
        }

        .detection-description {
          margin: 0;
          font-size: 13px;
          color: #606266;
          line-height: 1.5;
        }
      }
    }
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

// 响应式设计
@media (max-width: 1400px) {
  .video-action-detection {
    .main-content {
      :deep(.el-col) {
        &:first-child {
          flex: 0 0 25%;
          max-width: 25%;
        }
        &:nth-child(2) {
          flex: 0 0 50%;
          max-width: 50%;
        }
        &:last-child {
          flex: 0 0 25%;
          max-width: 25%;
        }
      }
    }
  }
}

@media (max-width: 992px) {
  .video-action-detection {
    .main-content {
      :deep(.el-col) {
        width: 100%;
        max-width: 100%;
      }
    }
  }
}
</style>