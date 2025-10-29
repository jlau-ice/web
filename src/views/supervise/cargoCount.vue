<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Upload, Camera, Search, Filter, Document,
  Download, Printer, Refresh, Check, Warning,
  CircleCheck, CircleClose, Loading, View, Edit
} from '@element-plus/icons-vue'

// 类型定义
interface CargoTask {
  id: string
  taskNumber: string
  checkType: 'inbound' | 'outbound' | 'inventory'
  cargoType: string
  plannedQuantity: number
  recognizedQuantity: number
  differenceRate: number
  status: 'pending' | 'recognizing' | 'completed' | 'difference'
  createTime: string
  operator: string
  images?: string[]
  boundingBoxes?: BoundingBox[]
}

interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
  confidence: number
  label: string
}

interface CargoCategory {
  id: string
  name: string
  code: string
  templateImage: string
  accuracy: number
  description: string
}

interface ReportData {
  taskId: string
  checkResults: CheckResult[]
  totalAccuracy: number
  efficiency: number
  imageAnalysis: ImageAnalysis[]
}

interface CheckResult {
  cargoType: string
  planned: number
  actual: number
  difference: number
  accuracy: number
}

interface ImageAnalysis {
  imageUrl: string
  detectedCount: number
  confidence: number
  processingTime: number
}

// 响应式数据
const loading = ref(false)
const uploadDialogVisible = ref(false)
const categoryDialogVisible = ref(false)
const reportDialogVisible = ref(false)
const currentTask = ref<CargoTask | null>(null)
import a from  '@/assets/10-12-6k.jpg'
const currentImageUrl = ref(a)
const uploadProgress = ref(0)
const recognitionProgress = ref(0)
const activeTab = ref('tasks')

// 搜索和筛选
const searchQuery = ref('')
const statusFilter = ref('')
const typeFilter = ref('')

// 任务列表
const taskList = ref<CargoTask[]>([])
const categories = ref<CargoCategory[]>([])
const reportData = ref<ReportData | null>(null)

// 统计数据
const statistics = reactive({
  totalTasks: 0,
  completedTasks: 0,
  averageAccuracy: 0,
  todayProcessed: 0
})

// 计算属性
const filteredTasks = computed(() => {
  return taskList.value.filter(task => {
    const matchesSearch = task.taskNumber.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesStatus = !statusFilter.value || task.status === statusFilter.value
    const matchesType = !typeFilter.value || task.checkType === typeFilter.value
    return matchesSearch && matchesStatus && matchesType
  })
})

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '待清点', value: 'pending' },
  { label: '识别中', value: 'recognizing' },
  { label: '已完成', value: 'completed' },
  { label: '有差异', value: 'difference' }
]

const typeOptions = [
  { label: '全部类型', value: '' },
  { label: '入库', value: 'inbound' },
  { label: '出库', value: 'outbound' },
  { label: '库存盘点', value: 'inventory' }
]

// 方法
const loadTasks = async () => {
  loading.value = true
  try {
    // 模拟异步加载
    await new Promise(resolve => setTimeout(resolve, 800))

    taskList.value = [
      {
        id: '1',
        taskNumber: 'TASK20241029001',
        checkType: 'inbound',
        cargoType: '电子产品',
        plannedQuantity: 100,
        recognizedQuantity: 98,
        differenceRate: 2,
        status: 'difference',
        createTime: '2024-10-29 09:30:00',
        operator: '张三',
        images: ['src/assets/10-12-6k.jpg'],
        boundingBoxes: [
          { x: 50, y: 50, width: 100, height: 80, confidence: 0.95, label: '产品A' },
          { x: 180, y: 120, width: 90, height: 70, confidence: 0.88, label: '产品B' }
        ]
      },
      {
        id: '2',
        taskNumber: 'TASK20241029002',
        checkType: 'outbound',
        cargoType: '日用品',
        plannedQuantity: 50,
        recognizedQuantity: 50,
        differenceRate: 0,
        status: 'completed',
        createTime: '2024-10-29 10:15:00',
        operator: '李四'
      },
      {
        id: '3',
        taskNumber: 'TASK20241029003',
        checkType: 'inventory',
        cargoType: '食品饮料',
        plannedQuantity: 200,
        recognizedQuantity: 0,
        differenceRate: 0,
        status: 'pending',
        createTime: '2024-10-29 11:00:00',
        operator: '王五'
      },
      {
        id: '4',
        taskNumber: 'TASK20241029004',
        checkType: 'inbound',
        cargoType: '服装鞋帽',
        plannedQuantity: 80,
        recognizedQuantity: 0,
        differenceRate: 0,
        status: 'recognizing',
        createTime: '2024-10-29 11:30:00',
        operator: '赵六'
      }
    ]

    updateStatistics()
  } catch (error) {
    ElMessage.error('加载任务列表失败')
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  try {
    await new Promise(resolve => setTimeout(resolve, 500))

    categories.value = [
      {
        id: '1',
        name: '电子产品',
        code: 'ELECTRONICS',
        templateImage: '/api/placeholder/200/200',
        accuracy: 95.5,
        description: '各类电子设备和配件'
      },
      {
        id: '2',
        name: '日用品',
        code: 'DAILY_GOODS',
        templateImage: '/api/placeholder/200/200',
        accuracy: 92.3,
        description: '日常生活用品'
      },
      {
        id: '3',
        name: '食品饮料',
        code: 'FOOD_BEVERAGE',
        templateImage: '/api/placeholder/200/200',
        accuracy: 88.7,
        description: '包装食品和饮料'
      },
      {
        id: '4',
        name: '服装鞋帽',
        code: 'CLOTHING',
        templateImage: '/api/placeholder/200/200',
        accuracy: 90.2,
        description: '各类服装、鞋子和帽子'
      }
    ]
  } catch (error) {
    ElMessage.error('加载货物分类失败')
  }
}

const updateStatistics = () => {
  statistics.totalTasks = taskList.value.length
  statistics.completedTasks = taskList.value.filter(t => t.status === 'completed').length
  statistics.todayProcessed = taskList.value.filter(t => {
    const today = new Date().toDateString()
    const taskDate = new Date(t.createTime).toDateString()
    return today === taskDate
  }).length

  const completedTasks = taskList.value.filter(t => t.recognizedQuantity > 0)
  if (completedTasks.length > 0) {
    const totalAccuracy = completedTasks.reduce((sum, task) => {
      const accuracy = task.plannedQuantity > 0
        ? (1 - Math.abs(task.differenceRate) / 100) * 100
        : 0
      return sum + accuracy
    }, 0)
    statistics.averageAccuracy = Math.round(totalAccuracy / completedTasks.length)
  } else {
    statistics.averageAccuracy = 0
  }
}

const getStatusTag = (status: string) => {
  const statusMap = {
    pending: { type: 'info', text: '待清点' },
    recognizing: { type: 'primary', text: '识别中' },
    completed: { type: 'success', text: '已完成' },
    difference: { type: 'warning', text: '有差异' }
  }
  return statusMap[status as keyof typeof statusMap] || { type: 'info', text: status }
}

const getDifferenceRateTag = (rate: number) => {
  if (rate === 0) return { type: 'success', text: '无差异' }
  if (rate <= 5) return { type: 'warning', text: `${rate}%` }
  return { type: 'danger', text: `${rate}%` }
}

const handleStartRecognition = async (task: CargoTask) => {
  currentTask.value = task
  task.status = 'recognizing'

  try {
    // 模拟识别过程
    recognitionProgress.value = 0
    const interval = setInterval(() => {
      recognitionProgress.value += Math.random() * 20
      if (recognitionProgress.value >= 100) {
        recognitionProgress.value = 100
        clearInterval(interval)

        // 模拟识别结果
        const recognizedCount = Math.floor(task.plannedQuantity * (0.9 + Math.random() * 0.2))
        task.recognizedQuantity = recognizedCount
        task.differenceRate = Math.abs(((task.plannedQuantity - recognizedCount) / task.plannedQuantity) * 100)
        task.status = task.differenceRate > 5 ? 'difference' : 'completed'

        ElMessage.success('识别完成')
        updateStatistics()
      }
    }, 500)
  } catch (error) {
    ElMessage.error('识别失败')
    task.status = 'pending'
  }
}

const handleUploadImage = (task: CargoTask) => {
  currentTask.value = task
  uploadDialogVisible.value = true
}

const handleViewDetails = (task: CargoTask) => {
  currentTask.value = task
  currentImageUrl.value = task.images?.[0] || '/api/placeholder/800/600'

  // 生成模拟报告数据
  reportData.value = {
    taskId: task.id,
    checkResults: [
      {
        cargoType: task.cargoType,
        planned: task.plannedQuantity,
        actual: task.recognizedQuantity,
        difference: task.plannedQuantity - task.recognizedQuantity,
        accuracy: task.plannedQuantity > 0 ? (task.recognizedQuantity / task.plannedQuantity) * 100 : 0
      }
    ],
    totalAccuracy: 100 - task.differenceRate,
    efficiency: 85 + Math.random() * 10,
    imageAnalysis: [
      {
        imageUrl: currentImageUrl.value,
        detectedCount: task.recognizedQuantity,
        confidence: 0.85 + Math.random() * 0.15,
        processingTime: 2.5 + Math.random() * 2
      }
    ]
  }

  reportDialogVisible.value = true
}

const handleManualAdjust = async (task: CargoTask) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入修正后的数量', '手动调整', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: task.recognizedQuantity.toString(),
      inputValidator: (value) => {
        const num = parseInt(value)
        if (isNaN(num) || num < 0) {
          return '请输入有效的数字'
        }
        return true
      }
    })

    const newQuantity = parseInt(value)
    task.recognizedQuantity = newQuantity
    task.differenceRate = Math.abs(((task.plannedQuantity - newQuantity) / task.plannedQuantity) * 100)
    task.status = task.differenceRate > 5 ? 'difference' : 'completed'

    ElMessage.success('数量已修正')
    updateStatistics()
  } catch {
    // 用户取消
  }
}

const handleExportReport = () => {
  ElMessage.success('报告导出成功')
}

const handlePrintReport = () => {
  window.print()
}

const refreshData = () => {
  loadTasks()
}

// 文件上传
const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }

  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过10MB')
    return false
  }

  return true
}

const handleFileUpload = (options: any) => {
  const { file } = options

  // 模拟上传进度
  uploadProgress.value = 0
  const interval = setInterval(() => {
    uploadProgress.value += 20
    if (uploadProgress.value >= 100) {
      uploadProgress.value = 100
      clearInterval(interval)

      // 模拟上传成功
      const reader = new FileReader()
      reader.onload = (e) => {
        currentImageUrl.value = e.target?.result as string
        ElMessage.success('图片上传成功')
      }
      reader.readAsDataURL(file)
    }
  }, 200)
}

// 生命周期
onMounted(() => {
  loadTasks()
  loadCategories()
})
</script>

<template>
  <div class="cargo-count-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>货物清点识别</h2>
        <p>利用图像识别技术，自动识别和统计出入库货物数量</p>
      </div>
      <div class="header-right">
        <el-button :icon="Refresh" @click="refreshData">刷新</el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="statistics-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <el-statistic title="总任务数" :value="statistics.totalTasks">
            <template #suffix>个</template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <el-statistic title="已完成" :value="statistics.completedTasks">
            <template #suffix>个</template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <el-statistic title="平均准确率" :value="statistics.averageAccuracy">
            <template #suffix>%</template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <el-statistic title="今日处理" :value="statistics.todayProcessed">
            <template #suffix>个</template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- 主要内容区域 -->
    <el-card class="main-content">
      <!-- 搜索和筛选栏 -->
      <div class="filter-bar">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-input
              v-model="searchQuery"
              placeholder="搜索任务编号"
              :prefix-icon="Search"
              clearable
            />
          </el-col>
          <el-col :span="5">
            <el-select v-model="statusFilter" placeholder="任务状态" clearable>
              <el-option
                v-for="option in statusOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-col>
          <el-col :span="5">
            <el-select v-model="typeFilter" placeholder="清点类型" clearable>
              <el-option
                v-for="option in typeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-col>
          <el-col :span="8">
            <el-button type="primary" :icon="Upload" @click="uploadDialogVisible = true">
              新建清点任务
            </el-button>
            <el-button :icon="Filter" style="margin-left: 10px">
              高级筛选
            </el-button>
          </el-col>
        </el-row>
      </div>

      <!-- 任务列表表格 -->
      <el-table
        v-loading="loading"
        :data="filteredTasks"
        stripe
        class="task-table"
        empty-text="暂无清点任务"
      >
        <el-table-column prop="taskNumber" label="任务编号"/>
        <el-table-column prop="checkType" label="清点类型" >
          <template #default="{ row }">
            <el-tag size="small">
              {{ row.checkType === 'inbound' ? '入库' : row.checkType === 'outbound' ? '出库' : '库存盘点' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="cargoType" label="货物类型" />
        <el-table-column prop="plannedQuantity" label="计划数量" align="right" />
        <el-table-column prop="recognizedQuantity" label="识别数量"  align="right">
          <template #default="{ row }">
            <span v-if="row.recognizedQuantity > 0">{{ row.recognizedQuantity }}</span>
            <span v-else class="text-placeholder">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="differenceRate" label="差异率"  align="right">
          <template #default="{ row }">
            <el-tag
              v-if="row.recognizedQuantity > 0"
              :type="getDifferenceRateTag(row.differenceRate).type"
              size="small"
            >
              {{ getDifferenceRateTag(row.differenceRate).text }}
            </el-tag>
            <span v-else class="text-placeholder">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status).type" size="small">
              {{ getStatusTag(row.status).text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column prop="operator" label="操作员" width="100" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'pending'"
              type="primary"
              size="small"
              :icon="Camera"
              @click="handleUploadImage(row)"
            >
              开始识别
            </el-button>
            <el-button
              v-if="row.status === 'recognizing'"
              type="info"
              size="small"
              :icon="Loading"
              disabled
            >
              识别中...
            </el-button>
            <el-button
              v-if="row.status === 'completed' || row.status === 'difference'"
              type="success"
              size="small"
              :icon="View"
              @click="handleViewDetails(row)"
            >
              查看详情
            </el-button>
            <el-button
              v-if="row.status === 'difference'"
              type="warning"
              size="small"
              :icon="Edit"
              @click="handleManualAdjust(row)"
            >
              手动调整
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 图片上传对话框 -->
    <el-dialog
      v-model="uploadDialogVisible"
      title="货物图片上传"
      width="800px"
      :close-on-click-modal="false"
    >
      <div class="upload-container">
        <el-upload
          class="upload-area"
          drag
          :auto-upload="false"
          :before-upload="beforeUpload"
          :on-change="handleFileUpload"
          accept="image/*"
          :show-file-list="false"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            将图片拖到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              支持 jpg/png/gif 格式，文件大小不超过 10MB
            </div>
          </template>
        </el-upload>

        <div v-if="currentImageUrl" class="image-preview">
          <h4>图片预览</h4>
          <img :src="currentImageUrl" alt="货物图片" />
        </div>

        <div v-if="uploadProgress > 0 && uploadProgress < 100" class="upload-progress">
          <el-progress :percentage="uploadProgress" />
        </div>

        <div v-if="currentImageUrl" class="action-buttons">
          <el-button type="primary" @click="handleStartRecognition(currentTask!)">
            开始识别
          </el-button>
          <el-button @click="uploadDialogVisible = false">取消</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 识别结果详情对话框 -->
    <el-dialog
      v-model="reportDialogVisible"
      title="清点结果详情"
      width="1000px"
    >
      <div v-if="reportData" class="report-container">
        <!-- 图像识别结果 -->
        <div class="recognition-result">
          <h3>图像识别结果</h3>
          <div class="image-analysis">
            <div class="image-container">
              <img :src="currentImageUrl" alt="识别图片" />
              <!-- 模拟边界框标注 -->
              <div
                v-for="(box, index) in currentTask?.boundingBoxes"
                :key="index"
                class="bounding-box"
                :style="{
                  left: box.x + 'px',
                  top: box.y + 'px',
                  width: box.width + 'px',
                  height: box.height + 'px'
                }"
              >
                <span class="box-label">{{ box.label }} {{ (box.confidence * 100).toFixed(1) }}%</span>
              </div>
            </div>
            <div class="analysis-info">
              <el-descriptions title="识别信息" :column="1" border>
                <el-descriptions-item label="检测数量">
                  {{ reportData.imageAnalysis[0].detectedCount }} 个
                </el-descriptions-item>
                <el-descriptions-item label="平均置信度">
                  {{ (reportData.imageAnalysis[0].confidence * 100).toFixed(1) }}%
                </el-descriptions-item>
                <el-descriptions-item label="处理时间">
                  {{ reportData.imageAnalysis[0].processingTime.toFixed(2) }} 秒
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </div>
        </div>

        <!-- 数量对比分析 -->
        <div class="comparison-analysis">
          <h3>数量对比分析</h3>
          <el-table :data="reportData.checkResults" border>
            <el-table-column prop="cargoType" label="货物类型" />
            <el-table-column prop="planned" label="计划数量" align="right" />
            <el-table-column prop="actual" label="实际数量" align="right" />
            <el-table-column prop="difference" label="差异数量" align="right">
              <template #default="{ row }">
                <span :class="{ 'text-danger': row.difference !== 0 }">
                  {{ row.difference > 0 ? '+' : '' }}{{ row.difference }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="accuracy" label="准确率" align="right">
              <template #default="{ row }">
                <el-tag :type="row.accuracy >= 95 ? 'success' : row.accuracy >= 90 ? 'warning' : 'danger'">
                  {{ row.accuracy.toFixed(1) }}%
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 统计信息 -->
        <div class="statistics-info">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-statistic title="总体准确率" :value="reportData.totalAccuracy" suffix="%" />
            </el-col>
            <el-col :span="8">
              <el-statistic title="识别效率" :value="reportData.efficiency" suffix="%" />
            </el-col>
            <el-col :span="8">
              <el-statistic title="总差异率" :value="currentTask?.differenceRate || 0" suffix="%" />
            </el-col>
          </el-row>
        </div>

        <!-- 操作按钮 -->
        <div class="report-actions">
          <el-button type="primary" :icon="Download" @click="handleExportReport">
            导出报告
          </el-button>
          <el-button type="success" :icon="Printer" @click="handlePrintReport">
            打印报告
          </el-button>
          <el-button @click="reportDialogVisible = false">关闭</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.cargo-count-container {
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  .header-left {
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
}

.statistics-row {
  margin-bottom: 20px;

  .stat-card {
    text-align: center;

    :deep(.el-statistic__head) {
      color: #606266;
      font-size: 14px;
    }

    :deep(.el-statistic__content) {
      font-size: 28px;
      font-weight: 600;
    }
  }
}

.main-content {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filter-bar {
  margin-bottom: 20px;
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
}

.task-table {
  :deep(.el-table__header) {
    background-color: #f8f9fa;
  }

  .text-placeholder {
    color: #c0c4cc;
  }

  .text-danger {
    color: #f56c6c;
    font-weight: 600;
  }
}

.upload-container {
  .upload-area {
    margin-bottom: 20px;

    :deep(.el-upload-dragger) {
      width: 100%;
      height: 200px;
    }
  }

  .image-preview {
    margin: 20px 0;
    text-align: center;

    h4 {
      margin-bottom: 10px;
      color: #303133;
    }

    img {
      max-width: 100%;
      max-height: 300px;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }

  .upload-progress {
    margin: 20px 0;
  }

  .action-buttons {
    text-align: center;
    margin-top: 20px;
  }
}

.report-container {
  .recognition-result,
  .comparison-analysis,
  .statistics-info {
    margin-bottom: 30px;

    h3 {
      margin-bottom: 16px;
      color: #303133;
      font-size: 18px;
      font-weight: 600;
      border-bottom: 2px solid #409eff;
      padding-bottom: 8px;
    }
  }

  .image-analysis {
    display: flex;
    gap: 20px;

    .image-container {
      flex: 1;
      position: relative;

      img {
        width: 100%;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .bounding-box {
        position: absolute;
        border: 2px solid #409eff;
        background-color: rgba(64, 158, 255, 0.1);

        .box-label {
          position: absolute;
          top: -24px;
          left: 0;
          background-color: #409eff;
          color: white;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 12px;
          white-space: nowrap;
        }
      }
    }

    .analysis-info {
      width: 300px;
    }
  }

  .statistics-info {
    padding: 20px;
    background: #f8f9fa;
    border-radius: 6px;
  }

  .report-actions {
    text-align: center;
    padding-top: 20px;
    border-top: 1px solid #e4e7ed;
  }
}

@media (max-width: 768px) {
  .cargo-count-container {
    padding: 10px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .statistics-row {
    .el-col {
      margin-bottom: 10px;
    }
  }

  .filter-bar {
    .el-col {
      margin-bottom: 10px;
    }
  }

  .image-analysis {
    flex-direction: column;

    .analysis-info {
      width: 100%;
    }
  }
}

@media print {
  .page-header,
  .filter-bar,
  .report-actions {
    display: none;
  }

  .cargo-count-container {
    padding: 0;
    background: white;
  }
}
</style>