<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, UploadFile, UploadUserFile } from 'element-plus'
import { Delete, Upload, DocumentCopy, View, Download, RefreshRight } from '@element-plus/icons-vue'

// 类型定义
interface FeatureVersion {
  id: string
  versionNumber: string
  featureCount: number
  updateType: 'full' | 'incremental' | 'manual'
  accuracyImprovement: number
  createTime: string
  status: 'updating' | 'success' | 'failed' | 'pending'
  description: string
  newFeatures: number
  deletedFeatures: number
  modifiedFeatures: number
  baseVersion?: string
}

interface FeatureStatistics {
  totalFeatures: number
  newFeatures: number
  deletedFeatures: number
  activeFeatures: number
  categoryCount: number
  averageAccuracy: number
}

interface UpdateTask {
  id: string
  versionNumber: string
  fileName: string
  fileSize: string
  progress: number
  status: 'pending' | 'processing' | 'paused' | 'completed' | 'failed'
  startTime: string
  estimatedTime: string
  errorMessage?: string
}

interface VersionComparison {
  category: string
  version1Count: number
  version2Count: number
  added: number
  deleted: number
  modified: number
  unchanged: number
}

interface PerformanceMetrics {
  accuracy: number
  recall: number
  precision: number
  f1Score: number
  version: string
}

interface EffectReport {
  versionNumber: string
  testSamples: number
  accuracyBefore: number
  accuracyAfter: number
  improvement: number
  testDate: string
  details: {
    category: string
    improvement: number
    samples: number
  }[]
}

// 响应式数据
const loading = ref(false)
const tableData = ref<FeatureVersion[]>([])
const filteredData = ref<FeatureVersion[]>([])
const statistics = ref<FeatureStatistics>({
  totalFeatures: 0,
  newFeatures: 0,
  deletedFeatures: 0,
  activeFeatures: 0,
  categoryCount: 0,
  averageAccuracy: 0
})

// 筛选条件
const filterForm = reactive({
  updateType: '',
  status: '',
  versionNumber: ''
})

// 更新任务
const updateTasks = ref<UpdateTask[]>([])
const uploadDialogVisible = ref(false)
const uploadFileList = ref<UploadUserFile[]>([])
const uploadForm = reactive({
  versionNumber: '',
  updateType: 'incremental' as 'full' | 'incremental' | 'manual',
  baseVersion: '',
  description: ''
})
const uploadFormRef = ref<FormInstance>()

// 版本对比
const compareDialogVisible = ref(false)
const compareForm = reactive({
  version1: '',
  version2: ''
})
const comparisonData = ref<VersionComparison[]>([])
const comparisonLoading = ref(false)

// 效果评估
const evaluationDialogVisible = ref(false)
const selectedVersion = ref<string>('')
const performanceMetrics = ref<PerformanceMetrics[]>([])
const effectReport = ref<EffectReport | null>(null)

// 特征详情
const featureDetailDialogVisible = ref(false)
const currentFeatureVersion = ref<FeatureVersion | null>(null)
const featurePreviewData = ref<any[]>([])

// 更新记录
const updateRecords = ref<any[]>([])
const recordsVisible = ref(true)

// 更新类型选项
const updateTypeOptions = [
  { label: '全量更新', value: 'full' },
  { label: '增量更新', value: 'incremental' },
  { label: '手动更新', value: 'manual' }
]

// 状态选项
const statusOptions = [
  { label: '更新中', value: 'updating' },
  { label: '成功', value: 'success' },
  { label: '失败', value: 'failed' },
  { label: '待更新', value: 'pending' }
]

// 获取更新类型标签
const getUpdateTypeTag = (type: string) => {
  const config = {
    full: { type: 'warning', text: '全量更新' },
    incremental: { type: 'success', text: '增量更新' },
    manual: { type: 'info', text: '手动更新' }
  }
  return config[type as keyof typeof config] || { type: 'info', text: '未知' }
}

// 获取状态标签
const getStatusTag = (status: string) => {
  const config = {
    updating: { type: 'primary', text: '更新中' },
    success: { type: 'success', text: '成功' },
    failed: { type: 'danger', text: '失败' },
    pending: { type: 'info', text: '待更新' }
  }
  return config[status as keyof typeof config] || { type: 'info', text: '未知' }
}

// 获取任务状态标签
const getTaskStatusTag = (status: string) => {
  const config = {
    pending: { type: 'info', text: '待处理' },
    processing: { type: 'primary', text: '处理中' },
    paused: { type: 'warning', text: '已暂停' },
    completed: { type: 'success', text: '已完成' },
    failed: { type: 'danger', text: '失败' }
  }
  return config[status as keyof typeof config] || { type: 'info', text: '未知' }
}

// 计算版本选项
const versionOptions = computed(() => {
  return tableData.value
    .filter(v => v.status === 'success')
    .map(v => ({
      label: v.versionNumber,
      value: v.id
    }))
})

// 模拟数据生成
const mockTableData = (): FeatureVersion[] => {
  const versions: FeatureVersion[] = []
  const now = Date.now()
  
  for (let i = 0; i < 15; i++) {
    const types: ('full' | 'incremental' | 'manual')[] = ['full', 'incremental', 'manual']
    const statuses: ('updating' | 'success' | 'failed' | 'pending')[] = ['updating', 'success', 'failed', 'pending']
    const updateType = types[Math.floor(Math.random() * types.length)]
    const status = i < 3 ? statuses[Math.floor(Math.random() * statuses.length)] : 'success'
    
    versions.push({
      id: `version_${i + 1}`,
      versionNumber: `v2.${15 - i}.${Math.floor(Math.random() * 10)}`,
      featureCount: 50000 + Math.floor(Math.random() * 30000),
      updateType,
      accuracyImprovement: Math.round((Math.random() * 5 + 0.5) * 10) / 10,
      createTime: new Date(now - i * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + ' ' + 
                  `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
      status,
      description: `${updateType === 'full' ? '全量' : updateType === 'incremental' ? '增量' : '手动'}更新特征库，优化识别模型`,
      newFeatures: Math.floor(Math.random() * 5000),
      deletedFeatures: Math.floor(Math.random() * 1000),
      modifiedFeatures: Math.floor(Math.random() * 3000),
      baseVersion: i > 0 ? `v2.${15 - i + 1}.0` : undefined
    })
  }
  
  return versions
}

// 模拟统计数据
const mockStatistics = (): FeatureStatistics => {
  return {
    totalFeatures: 78543,
    newFeatures: 3245,
    deletedFeatures: 892,
    activeFeatures: 75406,
    categoryCount: 12,
    averageAccuracy: 94.7
  }
}

// 模拟更新记录
const mockUpdateRecords = () => {
  return [
    {
      id: 'record_1',
      version: 'v2.15.3',
      operator: '张三',
      action: '增量更新',
      time: '2025-10-29 10:30:00',
      changes: '+3245 / -892',
      result: 'success'
    },
    {
      id: 'record_2',
      version: 'v2.15.2',
      operator: '李四',
      action: '全量更新',
      time: '2025-10-22 14:20:00',
      changes: '+5678 / -1234',
      result: 'success'
    },
    {
      id: 'record_3',
      version: 'v2.15.1',
      operator: '王五',
      action: '增量更新',
      time: '2025-10-15 09:15:00',
      changes: '+2134 / -456',
      result: 'failed'
    }
  ]
}

// 模拟特征预览数据
const mockFeaturePreview = () => {
  return [
    {
      id: 'feature_1',
      name: 'face_detection_v3',
      category: '人脸识别',
      dimension: 512,
      accuracy: 98.5,
      samples: 15000,
      createTime: '2025-10-20'
    },
    {
      id: 'feature_2',
      name: 'object_recognition_v2',
      category: '物体识别',
      dimension: 256,
      accuracy: 96.2,
      samples: 12000,
      createTime: '2025-10-18'
    },
    {
      id: 'feature_3',
      name: 'scene_classification_v4',
      category: '场景分类',
      dimension: 128,
      accuracy: 94.8,
      samples: 10000,
      createTime: '2025-10-15'
    }
  ]
}

// 模拟对比数据
const mockComparisonData = (): VersionComparison[] => {
  const categories = ['人脸识别', '物体识别', '场景分类', '文字识别', '行为分析', '情感分析']
  
  return categories.map(category => {
    const v1Count = 8000 + Math.floor(Math.random() * 4000)
    const added = Math.floor(Math.random() * 500)
    const deleted = Math.floor(Math.random() * 200)
    const modified = Math.floor(Math.random() * 800)
    const v2Count = v1Count + added - deleted
    const unchanged = v1Count - deleted - modified
    
    return {
      category,
      version1Count: v1Count,
      version2Count: v2Count,
      added,
      deleted,
      modified,
      unchanged
    }
  })
}

// 模拟性能指标
const mockPerformanceMetrics = (versionId: string): PerformanceMetrics[] => {
  const version = tableData.value.find(v => v.id === versionId)
  const versionNumber = version?.versionNumber || 'v2.15.0'
  const baseAccuracy = 90 + Math.random() * 5
  
  return [
    {
      version: versionNumber,
      accuracy: baseAccuracy,
      recall: baseAccuracy - 1 + Math.random() * 2,
      precision: baseAccuracy + Math.random() * 2,
      f1Score: baseAccuracy - 0.5 + Math.random()
    }
  ]
}

// 模拟效果报告
const mockEffectReport = (versionId: string): EffectReport => {
  const version = tableData.value.find(v => v.id === versionId)
  const categories = ['人脸识别', '物体识别', '场景分类', '文字识别', '行为分析', '情感分析']
  
  return {
    versionNumber: version?.versionNumber || 'v2.15.0',
    testSamples: 10000,
    accuracyBefore: 92.3,
    accuracyAfter: 94.7,
    improvement: 2.4,
    testDate: new Date().toISOString().split('T')[0],
    details: categories.map(category => ({
      category,
      improvement: Math.round((Math.random() * 4 + 0.5) * 10) / 10,
      samples: Math.floor(Math.random() * 2000 + 1000)
    }))
  }
}

// 加载数据
const loadData = async () => {
  loading.value = true
  
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    tableData.value = mockTableData()
    filteredData.value = tableData.value
    statistics.value = mockStatistics()
    updateRecords.value = mockUpdateRecords()
    
    ElMessage.success('数据加载成功')
  } catch (error) {
    ElMessage.error('数据加载失败')
  } finally {
    loading.value = false
  }
}

// 筛选数据
const handleFilter = () => {
  filteredData.value = tableData.value.filter(item => {
    let match = true
    
    if (filterForm.versionNumber) {
      match = match && item.versionNumber.toLowerCase().includes(filterForm.versionNumber.toLowerCase())
    }
    
    if (filterForm.updateType) {
      match = match && item.updateType === filterForm.updateType
    }
    
    if (filterForm.status) {
      match = match && item.status === filterForm.status
    }
    
    return match
  })
}

// 重置筛选
const handleReset = () => {
  filterForm.updateType = ''
  filterForm.status = ''
  filterForm.versionNumber = ''
  filteredData.value = tableData.value
}

// 查看详情
const handleViewDetail = (row: FeatureVersion) => {
  currentFeatureVersion.value = row
  featurePreviewData.value = mockFeaturePreview()
  featureDetailDialogVisible.value = true
}

// 打开上传对话框
const handleOpenUpload = () => {
  uploadForm.versionNumber = ''
  uploadForm.updateType = 'incremental'
  uploadForm.baseVersion = ''
  uploadForm.description = ''
  uploadFileList.value = []
  uploadDialogVisible.value = true
}

// 文件上传前验证
const beforeUpload = (file: UploadFile) => {
  const isValidType = file.name?.endsWith('.dat') || file.name?.endsWith('.bin') || file.name?.endsWith('.h5')
  const isLt100M = file.size! / 1024 / 1024 < 100
  
  if (!isValidType) {
    ElMessage.error('只支持 .dat, .bin, .h5 格式的特征文件！')
    return false
  }
  
  if (!isLt100M) {
    ElMessage.error('文件大小不能超过 100MB！')
    return false
  }
  
  return true
}

// 提交更新任务
const handleSubmitUpload = async () => {
  if (!uploadFormRef.value) return
  
  await uploadFormRef.value.validate(async (valid) => {
    if (valid && uploadFileList.value.length > 0) {
      loading.value = true
      
      try {
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // 创建新的更新任务
        const newTask: UpdateTask = {
          id: `task_${Date.now()}`,
          versionNumber: uploadForm.versionNumber,
          fileName: uploadFileList.value[0].name,
          fileSize: `${Math.round(uploadFileList.value[0].size! / 1024 / 1024 * 10) / 10} MB`,
          progress: 0,
          status: 'pending',
          startTime: new Date().toLocaleString(),
          estimatedTime: '预计 5-10 分钟'
        }
        
        updateTasks.value.unshift(newTask)
        
        // 模拟任务进度
        simulateTaskProgress(newTask.id)
        
        ElMessage.success('更新任务已创建')
        uploadDialogVisible.value = false
        
        // 刷新列表
        setTimeout(() => {
          loadData()
        }, 2000)
      } catch (error) {
        ElMessage.error('任务创建失败')
      } finally {
        loading.value = false
      }
    }
  })
}

// 模拟任务进度
const simulateTaskProgress = (taskId: string) => {
  const task = updateTasks.value.find(t => t.id === taskId)
  if (!task) return
  
  task.status = 'processing'
  
  const interval = setInterval(() => {
    if (task.progress >= 100) {
      clearInterval(interval)
      task.status = 'completed'
      return
    }
    
    task.progress += Math.floor(Math.random() * 10) + 5
    if (task.progress > 100) task.progress = 100
  }, 500)
}

// 暂停任务
const handlePauseTask = (task: UpdateTask) => {
  if (task.status === 'processing') {
    task.status = 'paused'
    ElMessage.success('任务已暂停')
  }
}

// 恢复任务
const handleResumeTask = (task: UpdateTask) => {
  if (task.status === 'paused') {
    task.status = 'processing'
    simulateTaskProgress(task.id)
    ElMessage.success('任务已恢复')
  }
}

// 取消任务
const handleCancelTask = (task: UpdateTask) => {
  ElMessageBox.confirm('确认取消该更新任务吗？', '提示', {
    type: 'warning'
  }).then(() => {
    const index = updateTasks.value.findIndex(t => t.id === task.id)
    if (index > -1) {
      updateTasks.value.splice(index, 1)
      ElMessage.success('任务已取消')
    }
  }).catch(() => {})
}

// 版本对比
const handleCompare = () => {
  if (!compareForm.version1 || !compareForm.version2) {
    ElMessage.warning('请选择两个版本进行对比')
    return
  }
  
  if (compareForm.version1 === compareForm.version2) {
    ElMessage.warning('请选择不同的版本进行对比')
    return
  }
  
  comparisonLoading.value = true
  
  setTimeout(() => {
    comparisonData.value = mockComparisonData()
    comparisonLoading.value = false
    ElMessage.success('对比完成')
  }, 1500)
}

// 打开对比对话框
const handleOpenCompare = () => {
  compareForm.version1 = ''
  compareForm.version2 = ''
  comparisonData.value = []
  compareDialogVisible.value = true
}

// 效果评估
const handleEvaluate = (row: FeatureVersion) => {
  selectedVersion.value = row.id
  performanceMetrics.value = mockPerformanceMetrics(row.id)
  effectReport.value = mockEffectReport(row.id)
  evaluationDialogVisible.value = true
}

// 下载版本
const handleDownload = (row: FeatureVersion) => {
  ElMessageBox.confirm(`确认下载版本 ${row.versionNumber} 吗？`, '提示', {
    type: 'info'
  }).then(() => {
    loading.value = true
    setTimeout(() => {
      loading.value = false
      ElMessage.success('版本下载成功')
    }, 1500)
  }).catch(() => {})
}

// 回滚版本
const handleRollback = (row: FeatureVersion) => {
  ElMessageBox.confirm(`确认回滚到版本 ${row.versionNumber} 吗？此操作将影响当前的识别服务。`, '警告', {
    type: 'warning',
    confirmButtonText: '确认回滚',
    cancelButtonText: '取消'
  }).then(() => {
    loading.value = true
    setTimeout(() => {
      loading.value = false
      ElMessage.success('版本回滚成功')
      loadData()
    }, 1500)
  }).catch(() => {})
}

// 删除版本
const handleDelete = (row: FeatureVersion) => {
  ElMessageBox.confirm(`确认删除版本 ${row.versionNumber} 吗？删除后无法恢复。`, '警告', {
    type: 'warning',
    confirmButtonText: '确认删除',
    cancelButtonText: '取消'
  }).then(() => {
    loading.value = true
    setTimeout(() => {
      const index = tableData.value.findIndex(item => item.id === row.id)
      if (index > -1) {
        tableData.value.splice(index, 1)
        handleFilter()
      }
      loading.value = false
      ElMessage.success('版本删除成功')
    }, 1000)
  }).catch(() => {})
}

// 导出对比报告
const handleExportComparison = () => {
  ElMessage.success('对比报告导出成功')
}

// 导出评估报告
const handleExportReport = () => {
  ElMessage.success('评估报告导出成功')
}

// 组件挂载
onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="feature-update-container">
    <!-- 顶部统计卡片 -->
    <el-row :gutter="20" class="statistics-cards">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon total">
              <el-icon :size="32"><DocumentCopy /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">总特征数</div>
              <div class="stat-value">{{ statistics.totalFeatures.toLocaleString() }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon new">
              <el-icon :size="32"><Upload /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">新增特征</div>
              <div class="stat-value">{{ statistics.newFeatures.toLocaleString() }}</div>
              <div class="stat-trend positive">+{{ ((statistics.newFeatures / statistics.totalFeatures) * 100).toFixed(1) }}%</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon delete">
              <el-icon :size="32"><Delete /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">删除特征</div>
              <div class="stat-value">{{ statistics.deletedFeatures.toLocaleString() }}</div>
              <div class="stat-trend negative">-{{ ((statistics.deletedFeatures / statistics.totalFeatures) * 100).toFixed(1) }}%</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon accuracy">
              <el-icon :size="32"><View /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">平均准确率</div>
              <div class="stat-value">{{ statistics.averageAccuracy }}%</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 操作和筛选区域 -->
    <el-card shadow="never" class="filter-card">
      <el-row :gutter="20">
        <el-col :span="16">
          <el-form :inline="true" :model="filterForm">
            <el-form-item label="版本号">
              <el-input 
                v-model="filterForm.versionNumber" 
                placeholder="请输入版本号" 
                clearable 
                style="width: 180px"
              />
            </el-form-item>
            <el-form-item label="更新类型">
              <el-select 
                v-model="filterForm.updateType" 
                placeholder="请选择更新类型" 
                clearable
                style="width: 140px"
              >
                <el-option 
                  v-for="item in updateTypeOptions" 
                  :key="item.value" 
                  :label="item.label" 
                  :value="item.value" 
                />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select 
                v-model="filterForm.status" 
                placeholder="请选择状态" 
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
              <el-button type="primary" @click="handleFilter">查询</el-button>
              <el-button @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>
        </el-col>
        <el-col :span="8" style="text-align: right">
          <el-button type="primary" :icon="Upload" @click="handleOpenUpload">
            增量更新
          </el-button>
          <el-button type="success" :icon="DocumentCopy" @click="handleOpenCompare">
            版本对比
          </el-button>
          <el-button :icon="RefreshRight" @click="loadData">刷新</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 更新任务进度 -->
    <el-card v-if="updateTasks.length > 0" shadow="never" class="tasks-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">更新任务</span>
        </div>
      </template>
      <div v-for="task in updateTasks" :key="task.id" class="task-item">
        <div class="task-info">
          <div class="task-name">
            <strong>{{ task.versionNumber }}</strong>
            <span class="task-file">{{ task.fileName }} ({{ task.fileSize }})</span>
          </div>
          <div class="task-progress-wrapper">
            <el-progress 
              :percentage="task.progress" 
              :status="task.status === 'failed' ? 'exception' : task.status === 'completed' ? 'success' : undefined"
            />
          </div>
          <div class="task-meta">
            <el-tag :type="getTaskStatusTag(task.status).type" size="small">
              {{ getTaskStatusTag(task.status).text }}
            </el-tag>
            <span class="task-time">{{ task.startTime }}</span>
            <span v-if="task.status === 'processing'" class="task-estimate">{{ task.estimatedTime }}</span>
          </div>
        </div>
        <div class="task-actions">
          <el-button 
            v-if="task.status === 'processing'" 
            size="small" 
            @click="handlePauseTask(task)"
          >
            暂停
          </el-button>
          <el-button 
            v-if="task.status === 'paused'" 
            type="primary" 
            size="small" 
            @click="handleResumeTask(task)"
          >
            恢复
          </el-button>
          <el-button 
            v-if="task.status !== 'completed'" 
            type="danger" 
            size="small" 
            @click="handleCancelTask(task)"
          >
            取消
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 版本列表 -->
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">特征库版本列表</span>
          <span class="card-subtitle">共 {{ filteredData.length }} 个版本</span>
        </div>
      </template>
      
      <el-table 
        :data="filteredData" 
        v-loading="loading" 
        stripe
        border
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="versionNumber" label="版本号" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="primary">{{ row.versionNumber }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="featureCount" label="特征数量" width="120" align="center">
          <template #default="{ row }">
            {{ row.featureCount.toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="updateType" label="更新类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getUpdateTypeTag(row.updateType).type">
              {{ getUpdateTypeTag(row.updateType).text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="accuracyImprovement" label="准确率提升" width="120" align="center">
          <template #default="{ row }">
            <span class="improvement-value">+{{ row.accuracyImprovement }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status).type">
              {{ getStatusTag(row.status).text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="280" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="handleViewDetail(row)">
              详情
            </el-button>
            <el-button type="success" size="small" link @click="handleEvaluate(row)">
              评估
            </el-button>
            <el-button type="info" size="small" link @click="handleDownload(row)">
              下载
            </el-button>
            <el-button 
              v-if="row.status === 'success'" 
              type="warning" 
              size="small" 
              link 
              @click="handleRollback(row)"
            >
              回滚
            </el-button>
            <el-button type="danger" size="small" link @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 更新记录 -->
    <el-card v-if="recordsVisible" shadow="never" class="records-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">最近更新记录</span>
        </div>
      </template>
      <el-timeline>
        <el-timeline-item 
          v-for="record in updateRecords" 
          :key="record.id" 
          :timestamp="record.time" 
          placement="top"
          :type="record.result === 'success' ? 'success' : 'danger'"
        >
          <el-card>
            <div class="record-content">
              <div class="record-main">
                <strong>{{ record.version }}</strong> - {{ record.action }}
                <el-tag 
                  :type="record.result === 'success' ? 'success' : 'danger'" 
                  size="small"
                  style="margin-left: 10px"
                >
                  {{ record.result === 'success' ? '成功' : '失败' }}
                </el-tag>
              </div>
              <div class="record-meta">
                操作人: {{ record.operator }} | 变更: {{ record.changes }}
              </div>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <!-- 上传对话框 -->
    <el-dialog 
      v-model="uploadDialogVisible" 
      title="增量更新" 
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form 
        ref="uploadFormRef" 
        :model="uploadForm" 
        label-width="100px"
      >
        <el-form-item 
          label="版本号" 
          prop="versionNumber"
          :rules="[{ required: true, message: '请输入版本号', trigger: 'blur' }]"
        >
          <el-input v-model="uploadForm.versionNumber" placeholder="例如: v2.16.0" />
        </el-form-item>
        <el-form-item label="更新类型" prop="updateType">
          <el-radio-group v-model="uploadForm.updateType">
            <el-radio label="full">全量更新</el-radio>
            <el-radio label="incremental">增量更新</el-radio>
            <el-radio label="manual">手动更新</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item 
          v-if="uploadForm.updateType === 'incremental'" 
          label="基础版本" 
          prop="baseVersion"
        >
          <el-select v-model="uploadForm.baseVersion" placeholder="请选择基础版本" style="width: 100%">
            <el-option 
              v-for="option in versionOptions" 
              :key="option.value" 
              :label="option.label" 
              :value="option.value" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="更新描述" prop="description">
          <el-input 
            v-model="uploadForm.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入更新描述"
          />
        </el-form-item>
        <el-form-item 
          label="特征文件" 
          prop="file"
          :rules="[{ required: true, message: '请上传特征文件', trigger: 'change' }]"
        >
          <el-upload
            v-model:file-list="uploadFileList"
            class="upload-feature"
            drag
            :before-upload="beforeUpload"
            :limit="1"
            :auto-upload="false"
            accept=".dat,.bin,.h5"
          >
            <el-icon class="el-icon--upload"><upload /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 .dat, .bin, .h5 格式，文件大小不超过 100MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitUpload" :loading="loading">
          开始更新
        </el-button>
      </template>
    </el-dialog>

    <!-- 版本对比对话框 -->
    <el-dialog 
      v-model="compareDialogVisible" 
      title="版本对比分析" 
      width="900px"
      :close-on-click-modal="false"
    >
      <el-form :inline="true" :model="compareForm" style="margin-bottom: 20px">
        <el-form-item label="版本1">
          <el-select v-model="compareForm.version1" placeholder="请选择版本" style="width: 200px">
            <el-option 
              v-for="option in versionOptions" 
              :key="option.value" 
              :label="option.label" 
              :value="option.value" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="版本2">
          <el-select v-model="compareForm.version2" placeholder="请选择版本" style="width: 200px">
            <el-option 
              v-for="option in versionOptions" 
              :key="option.value" 
              :label="option.label" 
              :value="option.value" 
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleCompare" :loading="comparisonLoading">
            开始对比
          </el-button>
          <el-button 
            v-if="comparisonData.length > 0" 
            type="success" 
            @click="handleExportComparison"
          >
            导出报告
          </el-button>
        </el-form-item>
      </el-form>

      <el-alert 
        v-if="comparisonData.length > 0" 
        title="对比完成" 
        type="success" 
        :closable="false"
        style="margin-bottom: 20px"
      >
        <template #default>
          检测到 {{ comparisonData.length }} 个特征类别的变化
        </template>
      </el-alert>

      <el-table 
        v-if="comparisonData.length > 0" 
        :data="comparisonData" 
        border 
        stripe
        v-loading="comparisonLoading"
      >
        <el-table-column prop="category" label="特征类别" width="120" align="center" />
        <el-table-column prop="version1Count" label="版本1数量" width="120" align="center">
          <template #default="{ row }">
            {{ row.version1Count.toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="version2Count" label="版本2数量" width="120" align="center">
          <template #default="{ row }">
            {{ row.version2Count.toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="added" label="新增" width="100" align="center">
          <template #default="{ row }">
            <span style="color: #67c23a">+{{ row.added }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="deleted" label="删除" width="100" align="center">
          <template #default="{ row }">
            <span style="color: #f56c6c">-{{ row.deleted }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="modified" label="修改" width="100" align="center">
          <template #default="{ row }">
            <span style="color: #e6a23c">{{ row.modified }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="unchanged" label="未变化" width="100" align="center">
          <template #default="{ row }">
            {{ row.unchanged }}
          </template>
        </el-table-column>
        <el-table-column label="变化率" align="center">
          <template #default="{ row }">
            {{ ((row.added + row.deleted + row.modified) / row.version1Count * 100).toFixed(1) }}%
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 效果评估对话框 -->
    <el-dialog 
      v-model="evaluationDialogVisible" 
      title="更新效果评估" 
      width="800px"
      :close-on-click-modal="false"
    >
      <div v-if="effectReport" class="evaluation-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="版本号">
            <el-tag type="primary">{{ effectReport.versionNumber }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="测试日期">
            {{ effectReport.testDate }}
          </el-descriptions-item>
          <el-descriptions-item label="测试样本数">
            {{ effectReport.testSamples.toLocaleString() }}
          </el-descriptions-item>
          <el-descriptions-item label="准确率提升">
            <span class="improvement-value">+{{ effectReport.improvement }}%</span>
          </el-descriptions-item>
          <el-descriptions-item label="更新前准确率">
            {{ effectReport.accuracyBefore }}%
          </el-descriptions-item>
          <el-descriptions-item label="更新后准确率">
            {{ effectReport.accuracyAfter }}%
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">性能指标</el-divider>
        
        <el-row :gutter="20" style="margin-bottom: 20px">
          <el-col :span="6" v-for="(metric, index) in performanceMetrics" :key="index">
            <el-card shadow="hover" class="metric-card">
              <div class="metric-item">
                <div class="metric-label">准确率</div>
                <div class="metric-value">{{ metric.accuracy.toFixed(2) }}%</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6" v-for="(metric, index) in performanceMetrics" :key="'recall-' + index">
            <el-card shadow="hover" class="metric-card">
              <div class="metric-item">
                <div class="metric-label">召回率</div>
                <div class="metric-value">{{ metric.recall.toFixed(2) }}%</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6" v-for="(metric, index) in performanceMetrics" :key="'precision-' + index">
            <el-card shadow="hover" class="metric-card">
              <div class="metric-item">
                <div class="metric-label">精确率</div>
                <div class="metric-value">{{ metric.precision.toFixed(2) }}%</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6" v-for="(metric, index) in performanceMetrics" :key="'f1-' + index">
            <el-card shadow="hover" class="metric-card">
              <div class="metric-item">
                <div class="metric-label">F1 分数</div>
                <div class="metric-value">{{ metric.f1Score.toFixed(2) }}%</div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-divider content-position="left">分类效果详情</el-divider>
        
        <el-table :data="effectReport.details" border stripe>
          <el-table-column prop="category" label="特征类别" align="center" />
          <el-table-column prop="samples" label="测试样本" align="center">
            <template #default="{ row }">
              {{ row.samples.toLocaleString() }}
            </template>
          </el-table-column>
          <el-table-column prop="improvement" label="准确率提升" align="center">
            <template #default="{ row }">
              <span class="improvement-value">+{{ row.improvement }}%</span>
            </template>
          </el-table-column>
          <el-table-column label="效果评级" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.improvement >= 3" type="success">优秀</el-tag>
              <el-tag v-else-if="row.improvement >= 2" type="primary">良好</el-tag>
              <el-tag v-else-if="row.improvement >= 1" type="warning">一般</el-tag>
              <el-tag v-else type="info">较低</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <el-button @click="evaluationDialogVisible = false">关闭</el-button>
        <el-button type="success" @click="handleExportReport">导出评估报告</el-button>
      </template>
    </el-dialog>

    <!-- 特征详情对话框 -->
    <el-dialog 
      v-model="featureDetailDialogVisible" 
      title="特征库详情" 
      width="900px"
      :close-on-click-modal="false"
    >
      <div v-if="currentFeatureVersion" class="feature-detail">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="版本号">
            <el-tag type="primary">{{ currentFeatureVersion.versionNumber }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="总特征数">
            {{ currentFeatureVersion.featureCount.toLocaleString() }}
          </el-descriptions-item>
          <el-descriptions-item label="更新类型">
            <el-tag :type="getUpdateTypeTag(currentFeatureVersion.updateType).type">
              {{ getUpdateTypeTag(currentFeatureVersion.updateType).text }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="新增特征">
            <span style="color: #67c23a">+{{ currentFeatureVersion.newFeatures }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="删除特征">
            <span style="color: #f56c6c">-{{ currentFeatureVersion.deletedFeatures }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="修改特征">
            <span style="color: #e6a23c">{{ currentFeatureVersion.modifiedFeatures }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">
            {{ currentFeatureVersion.createTime }}
          </el-descriptions-item>
          <el-descriptions-item label="准确率提升">
            <span class="improvement-value">+{{ currentFeatureVersion.accuracyImprovement }}%</span>
          </el-descriptions-item>
          <el-descriptions-item label="描述" :span="3">
            {{ currentFeatureVersion.description }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">特征样本预览</el-divider>
        
        <el-table :data="featurePreviewData" border stripe>
          <el-table-column prop="id" label="特征ID" width="150" align="center" />
          <el-table-column prop="name" label="特征名称" width="200" align="center" />
          <el-table-column prop="category" label="类别" width="120" align="center" />
          <el-table-column prop="dimension" label="维度" width="100" align="center" />
          <el-table-column prop="accuracy" label="准确率" width="100" align="center">
            <template #default="{ row }">
              {{ row.accuracy }}%
            </template>
          </el-table-column>
          <el-table-column prop="samples" label="样本数" align="center">
            <template #default="{ row }">
              {{ row.samples.toLocaleString() }}
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="120" align="center" />
        </el-table>
      </div>
      <template #footer>
        <el-button @click="featureDetailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.feature-update-container {
  // 统计卡片
  .statistics-cards {
    margin-bottom: 20px;

    .stat-card {
      border-radius: 8px;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .stat-content {
        display: flex;
        align-items: center;
        gap: 15px;

        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;

          &.total {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }

          &.new {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          }

          &.delete {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          }

          &.accuracy {
            background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
          }
        }

        .stat-info {
          flex: 1;

          .stat-label {
            font-size: 14px;
            color: #909399;
            margin-bottom: 5px;
          }

          .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #303133;
          }

          .stat-trend {
            font-size: 12px;
            margin-top: 5px;

            &.positive {
              color: #67c23a;
            }

            &.negative {
              color: #f56c6c;
            }
          }
        }
      }
    }
  }

  // 卡片样式
  .filter-card,
  .tasks-card,
  .table-card,
  .records-card {
    margin-bottom: 20px;
    border-radius: 8px;

    :deep(.el-card__header) {
      border-bottom: 1px solid #ebeef5;
      padding: 15px 20px;
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .card-title {
      font-size: 16px;
      font-weight: bold;
      color: #303133;
    }

    .card-subtitle {
      font-size: 14px;
      color: #909399;
    }
  }

  // 任务项
  .task-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 15px;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    margin-bottom: 10px;
    background-color: #fff;

    &:last-child {
      margin-bottom: 0;
    }

    .task-info {
      flex: 1;
      margin-right: 20px;

      .task-name {
        margin-bottom: 10px;

        strong {
          font-size: 15px;
          color: #303133;
        }

        .task-file {
          font-size: 13px;
          color: #909399;
          margin-left: 10px;
        }
      }

      .task-progress-wrapper {
        margin-bottom: 10px;
      }

      .task-meta {
        display: flex;
        align-items: center;
        gap: 15px;
        font-size: 13px;
        color: #606266;

        .task-time,
        .task-estimate {
          color: #909399;
        }
      }
    }

    .task-actions {
      display: flex;
      gap: 10px;
    }
  }

  // 表格样式
  .improvement-value {
    color: #67c23a;
    font-weight: bold;
  }

  // 更新记录
  .record-content {
    .record-main {
      margin-bottom: 8px;
      font-size: 15px;
    }

    .record-meta {
      font-size: 13px;
      color: #909399;
    }
  }

  // 上传区域
  .upload-feature {
    width: 100%;

    :deep(.el-upload) {
      width: 100%;
    }

    :deep(.el-upload-dragger) {
      width: 100%;
    }
  }

  // 评估内容
  .evaluation-content {
    .metric-card {
      text-align: center;

      .metric-item {
        .metric-label {
          font-size: 14px;
          color: #909399;
          margin-bottom: 8px;
        }

        .metric-value {
          font-size: 20px;
          font-weight: bold;
          color: #409eff;
        }
      }
    }
  }

  // 特征详情
  .feature-detail {
    :deep(.el-descriptions__label) {
      width: 120px;
    }
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .feature-update-container {
    .statistics-cards {
      .el-col {
        margin-bottom: 20px;
      }
    }
  }
}
</style>