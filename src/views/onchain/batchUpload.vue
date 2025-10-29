<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { UploadProps, UploadUserFile } from 'element-plus'
import { Upload, Download, View, Delete, Refresh, Setting } from '@element-plus/icons-vue'

// 任务状态枚举
enum TaskStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// 任务接口
interface BatchTask {
  id: string
  taskName: string
  dataCount: number
  status: TaskStatus
  createTime: string
  completeTime: string
  successCount: number
  failedCount: number
  progress: number
  fileType: string
  logs: string[]
}

// 数据字段映射配置
interface FieldMapping {
  sourceField: string
  targetField: string
  required: boolean
  transform?: string
}

// 搜索表单
const searchForm = reactive({
  taskName: '',
  status: '',
  startTime: '',
  endTime: ''
})

// 任务列表
const taskList = ref<BatchTask[]>([
  {
    id: 'TASK001',
    taskName: '用户数据批量上链',
    dataCount: 1500,
    status: TaskStatus.COMPLETED,
    createTime: '2025-10-29 10:00:00',
    completeTime: '2025-10-29 10:15:00',
    successCount: 1485,
    failedCount: 15,
    progress: 100,
    fileType: 'Excel',
    logs: [
      '[10:00:00] 任务创建成功',
      '[10:00:05] 开始数据验证',
      '[10:00:30] 数据验证完成，共1500条',
      '[10:01:00] 开始批量上链',
      '[10:15:00] 上链完成，成功1485条，失败15条'
    ]
  },
  {
    id: 'TASK002',
    taskName: '交易记录上链任务',
    dataCount: 3200,
    status: TaskStatus.PROCESSING,
    createTime: '2025-10-29 11:30:00',
    completeTime: '',
    successCount: 2100,
    failedCount: 5,
    progress: 65,
    fileType: 'JSON',
    logs: [
      '[11:30:00] 任务创建成功',
      '[11:30:10] 开始数据验证',
      '[11:30:45] 数据验证完成',
      '[11:31:00] 开始批量上链...'
    ]
  },
  {
    id: 'TASK003',
    taskName: '产品信息批量上链',
    dataCount: 500,
    status: TaskStatus.PENDING,
    createTime: '2025-10-29 12:00:00',
    completeTime: '',
    successCount: 0,
    failedCount: 0,
    progress: 0,
    fileType: 'CSV',
    logs: [
      '[12:00:00] 任务创建成功',
      '[12:00:05] 等待处理中...'
    ]
  },
  {
    id: 'TASK004',
    taskName: '设备数据上链',
    dataCount: 800,
    status: TaskStatus.FAILED,
    createTime: '2025-10-29 09:00:00',
    completeTime: '2025-10-29 09:10:00',
    successCount: 650,
    failedCount: 150,
    progress: 81,
    fileType: 'JSON',
    logs: [
      '[09:00:00] 任务创建成功',
      '[09:00:10] 开始数据验证',
      '[09:00:30] 数据验证完成',
      '[09:01:00] 开始批量上链',
      '[09:10:00] 上链失败，错误率超过阈值'
    ]
  }
])

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 4
})

// 上传相关
const uploadDialogVisible = ref(false)
const uploadFileList = ref<UploadUserFile[]>([])
const uploadProgress = ref(0)
const isUploading = ref(false)
const uploadTaskName = ref('')

// 数据格式配置
const configDialogVisible = ref(false)
const fieldMappings = ref<FieldMapping[]>([
  { sourceField: 'id', targetField: 'dataId', required: true },
  { sourceField: 'name', targetField: 'dataName', required: true },
  { sourceField: 'value', targetField: 'dataValue', required: false }
])

const batchConfig = reactive({
  batchSize: 100,
  retryCount: 3,
  timeout: 30
})

// 任务详情
const detailDialogVisible = ref(false)
const currentTask = ref<BatchTask | null>(null)

// 计算属性 - 过滤后的任务列表
const filteredTaskList = computed(() => {
  return taskList.value.filter(task => {
    const matchName = !searchForm.taskName || task.taskName.includes(searchForm.taskName)
    const matchStatus = !searchForm.status || task.status === searchForm.status
    return matchName && matchStatus
  })
})

// 状态标签类型
const getStatusType = (status: TaskStatus) => {
  const statusMap = {
    [TaskStatus.PENDING]: 'info',
    [TaskStatus.PROCESSING]: 'primary',
    [TaskStatus.COMPLETED]: 'success',
    [TaskStatus.FAILED]: 'danger'
  }
  return statusMap[status]
}

// 状态文本
const getStatusText = (status: TaskStatus) => {
  const statusMap = {
    [TaskStatus.PENDING]: '待处理',
    [TaskStatus.PROCESSING]: '处理中',
    [TaskStatus.COMPLETED]: '已完成',
    [TaskStatus.FAILED]: '失败'
  }
  return statusMap[status]
}

// 搜索任务
const handleSearch = () => {
  pagination.currentPage = 1
  ElMessage.success('搜索完成')
}

// 重置搜索
const handleReset = () => {
  searchForm.taskName = ''
  searchForm.status = ''
  searchForm.startTime = ''
  searchForm.endTime = ''
  pagination.currentPage = 1
}

// 打开上传对话框
const openUploadDialog = () => {
  uploadDialogVisible.value = true
  uploadFileList.value = []
  uploadProgress.value = 0
  uploadTaskName.value = ''
}

// 文件上传前
const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const isValidType = ['application/json', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(file.type) ||
    file.name.endsWith('.json') || file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
  
  if (!isValidType) {
    ElMessage.error('只支持 JSON、CSV、Excel 格式的文件！')
    return false
  }
  
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过 10MB！')
    return false
  }
  
  return true
}

// 文件改变
const handleFileChange: UploadProps['onChange'] = (file, fileList) => {
  uploadFileList.value = fileList
}

// 移除文件
const handleRemove: UploadProps['onRemove'] = (file, fileList) => {
  uploadFileList.value = fileList
}

// 开始上传
const startUpload = async () => {
  if (uploadFileList.value.length === 0) {
    ElMessage.warning('请先选择文件')
    return
  }
  
  if (!uploadTaskName.value.trim()) {
    ElMessage.warning('请输入任务名称')
    return
  }
  
  isUploading.value = true
  uploadProgress.value = 0
  
  // 模拟上传进度
  const progressInterval = setInterval(() => {
    uploadProgress.value += 10
    if (uploadProgress.value >= 100) {
      clearInterval(progressInterval)
      setTimeout(() => {
        // 创建新任务
        const fileType = uploadFileList.value[0].name.split('.').pop()?.toUpperCase() || 'Unknown'
        const newTask: BatchTask = {
          id: `TASK${String(taskList.value.length + 1).padStart(3, '0')}`,
          taskName: uploadTaskName.value,
          dataCount: Math.floor(Math.random() * 2000) + 500,
          status: TaskStatus.PENDING,
          createTime: new Date().toLocaleString('zh-CN', { hour12: false }),
          completeTime: '',
          successCount: 0,
          failedCount: 0,
          progress: 0,
          fileType,
          logs: [
            `[${new Date().toLocaleTimeString('zh-CN', { hour12: false })}] 任务创建成功`,
            `[${new Date().toLocaleTimeString('zh-CN', { hour12: false })}] 文件上传完成`,
            `[${new Date().toLocaleTimeString('zh-CN', { hour12: false })}] 等待处理中...`
          ]
        }
        
        taskList.value.unshift(newTask)
        pagination.total++
        
        isUploading.value = false
        uploadDialogVisible.value = false
        ElMessage.success('文件上传成功，任务已创建')
        
        // 模拟自动开始处理
        setTimeout(() => {
          const task = taskList.value.find(t => t.id === newTask.id)
          if (task) {
            task.status = TaskStatus.PROCESSING
            task.logs.push(`[${new Date().toLocaleTimeString('zh-CN', { hour12: false })}] 开始处理任务...`)
            simulateTaskProgress(task)
          }
        }, 2000)
      }, 500)
    }
  }, 300)
}

// 模拟任务进度
const simulateTaskProgress = (task: BatchTask) => {
  const progressInterval = setInterval(() => {
    if (task.progress < 100) {
      task.progress += Math.floor(Math.random() * 15) + 5
      if (task.progress > 100) task.progress = 100
      
      task.successCount = Math.floor(task.dataCount * task.progress / 100 * 0.95)
      task.failedCount = Math.floor(task.dataCount * task.progress / 100 * 0.05)
      
      if (task.progress >= 100) {
        clearInterval(progressInterval)
        task.status = Math.random() > 0.2 ? TaskStatus.COMPLETED : TaskStatus.FAILED
        task.completeTime = new Date().toLocaleString('zh-CN', { hour12: false })
        task.logs.push(`[${new Date().toLocaleTimeString('zh-CN', { hour12: false })}] 任务${task.status === TaskStatus.COMPLETED ? '完成' : '失败'}`)
      }
    }
  }, 1000)
}

// 查看任务详情
const viewTaskDetail = (task: BatchTask) => {
  currentTask.value = task
  detailDialogVisible.value = true
}

// 重试失败数据
const retryFailedData = (task: BatchTask) => {
  ElMessageBox.confirm(`确定要重试任务 ${task.taskName} 的失败数据吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('开始重试失败数据')
    task.status = TaskStatus.PROCESSING
    task.logs.push(`[${new Date().toLocaleTimeString('zh-CN', { hour12: false })}] 开始重试失败数据...`)
    
    setTimeout(() => {
      const retrySuccess = Math.floor(task.failedCount * 0.8)
      task.successCount += retrySuccess
      task.failedCount -= retrySuccess
      task.progress = Math.floor((task.successCount / task.dataCount) * 100)
      task.status = task.failedCount === 0 ? TaskStatus.COMPLETED : TaskStatus.FAILED
      task.completeTime = new Date().toLocaleString('zh-CN', { hour12: false })
      task.logs.push(`[${new Date().toLocaleTimeString('zh-CN', { hour12: false })}] 重试完成，成功${retrySuccess}条`)
      ElMessage.success('重试完成')
    }, 3000)
  }).catch(() => {})
}

// 导出失败数据
const exportFailedData = (task: BatchTask) => {
  ElMessage.success(`正在导出任务 ${task.taskName} 的失败数据...`)
  setTimeout(() => {
    ElMessage.success('导出完成')
  }, 1500)
}

// 下载上链结果
const downloadResult = (task: BatchTask) => {
  ElMessage.success(`正在下载任务 ${task.taskName} 的上链结果...`)
  setTimeout(() => {
    ElMessage.success('下载完成')
  }, 1500)
}

// 删除任务
const deleteTask = (task: BatchTask) => {
  ElMessageBox.confirm(`确定要删除任务 ${task.taskName} 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = taskList.value.findIndex(t => t.id === task.id)
    if (index > -1) {
      taskList.value.splice(index, 1)
      pagination.total--
      ElMessage.success('删除成功')
    }
  }).catch(() => {})
}

// 打开配置对话框
const openConfigDialog = () => {
  configDialogVisible.value = true
}

// 添加字段映射
const addFieldMapping = () => {
  fieldMappings.value.push({
    sourceField: '',
    targetField: '',
    required: false
  })
}

// 删除字段映射
const removeFieldMapping = (index: number) => {
  fieldMappings.value.splice(index, 1)
}

// 保存配置
const saveConfig = () => {
  ElMessage.success('配置保存成功')
  configDialogVisible.value = false
}

// 下载模板
const downloadTemplate = (type: string) => {
  ElMessage.success(`正在下载 ${type} 模板...`)
  setTimeout(() => {
    ElMessage.success('模板下载完成')
  }, 1000)
}

// 生成执行报告
const generateReport = (task: BatchTask) => {
  ElMessage.success(`正在生成任务 ${task.taskName} 的执行报告...`)
  setTimeout(() => {
    ElMessage.success('报告生成完成')
  }, 1500)
}

// 刷新任务列表
const refreshTaskList = () => {
  ElMessage.success('刷新成功')
}
</script>

<template>
  <div class="batch-upload-container">
    <!-- 顶部操作区 -->
    <el-card class="upload-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">批量数据上链</span>
          <div class="header-actions">
            <el-button type="primary" :icon="Upload" @click="openUploadDialog">
              批量上传
            </el-button>
            <el-button :icon="Setting" @click="openConfigDialog">
              数据配置
            </el-button>
            <el-button :icon="Refresh" @click="refreshTaskList">
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <!-- 说明信息 -->
      <el-alert
        type="info"
        :closable="false"
        show-icon
        class="info-alert"
      >
        <template #title>
          <span>支持 JSON、CSV、Excel 格式文件上传，单个文件最大 10MB。系统将自动进行数据验证和批量上链处理。</span>
        </template>
      </el-alert>

      <!-- 模板下载 -->
      <div class="template-section">
        <span class="template-title">数据模板：</span>
        <el-button link type="primary" @click="downloadTemplate('JSON')">
          <el-icon><Download /></el-icon> JSON 模板
        </el-button>
        <el-button link type="primary" @click="downloadTemplate('CSV')">
          <el-icon><Download /></el-icon> CSV 模板
        </el-button>
        <el-button link type="primary" @click="downloadTemplate('Excel')">
          <el-icon><Download /></el-icon> Excel 模板
        </el-button>
      </div>
    </el-card>

    <!-- 搜索筛选区 -->
    <el-card class="search-card" shadow="hover">
      <el-form :model="searchForm" inline>
        <el-form-item label="任务名称">
          <el-input
            v-model="searchForm.taskName"
            placeholder="请输入任务名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="任务状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 150px"
          >
            <el-option label="待处理" :value="TaskStatus.PENDING" />
            <el-option label="处理中" :value="TaskStatus.PROCESSING" />
            <el-option label="已完成" :value="TaskStatus.COMPLETED" />
            <el-option label="失败" :value="TaskStatus.FAILED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 任务列表 -->
    <el-card class="table-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">任务列表</span>
          <span class="task-count">共 {{ pagination.total }} 个任务</span>
        </div>
      </template>

      <el-table
        :data="filteredTaskList"
        style="width: 100%"
        stripe
        :header-cell-style="{ background: '#f5f7fa' }"
      >
        <el-table-column prop="id" label="任务ID" width="120" />
        <el-table-column prop="taskName" label="任务名称" min-width="180" />
        <el-table-column label="文件类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.fileType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dataCount" label="数据量" width="100" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="进度" width="200">
          <template #default="{ row }">
            <div class="progress-wrapper">
              <el-progress
                :percentage="row.progress"
                :status="row.status === TaskStatus.FAILED ? 'exception' : row.status === TaskStatus.COMPLETED ? 'success' : undefined"
              />
              <span class="progress-text">
                {{ row.successCount }}/{{ row.dataCount }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column prop="completeTime" label="完成时间" width="160">
          <template #default="{ row }">
            {{ row.completeTime || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="View" @click="viewTaskDetail(row)">
              详情
            </el-button>
            <el-button
              link
              type="primary"
              :icon="Download"
              @click="downloadResult(row)"
              :disabled="row.status !== TaskStatus.COMPLETED"
            >
              下载
            </el-button>
            <el-button
              link
              type="warning"
              :icon="Refresh"
              @click="retryFailedData(row)"
              :disabled="row.status !== TaskStatus.FAILED && row.failedCount === 0"
            >
              重试
            </el-button>
            <el-button
              link
              type="danger"
              :icon="Delete"
              @click="deleteTask(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
        />
      </div>
    </el-card>

    <!-- 上传对话框 -->
    <el-dialog
      v-model="uploadDialogVisible"
      title="批量上传数据"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form label-width="100px">
        <el-form-item label="任务名称" required>
          <el-input
            v-model="uploadTaskName"
            placeholder="请输入任务名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="上传文件" required>
          <el-upload
            drag
            multiple
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-remove="handleRemove"
            :before-upload="beforeUpload"
            :file-list="uploadFileList"
            accept=".json,.csv,.xlsx,.xls"
            class="upload-box"
          >
            <el-icon class="el-icon--upload"><Upload /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 JSON、CSV、Excel 格式，单个文件不超过 10MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
        
        <el-form-item v-if="isUploading" label="上传进度">
          <el-progress :percentage="uploadProgress" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="uploadDialogVisible = false" :disabled="isUploading">
          取消
        </el-button>
        <el-button
          type="primary"
          @click="startUpload"
          :loading="isUploading"
          :disabled="uploadFileList.length === 0"
        >
          {{ isUploading ? '上传中...' : '开始上传' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 任务详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="任务详情"
      width="800px"
    >
      <div v-if="currentTask" class="task-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="任务ID">
            {{ currentTask.id }}
          </el-descriptions-item>
          <el-descriptions-item label="任务名称">
            {{ currentTask.taskName }}
          </el-descriptions-item>
          <el-descriptions-item label="文件类型">
            <el-tag size="small">{{ currentTask.fileType }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="任务状态">
            <el-tag :type="getStatusType(currentTask.status)">
              {{ getStatusText(currentTask.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="数据总量">
            {{ currentTask.dataCount }}
          </el-descriptions-item>
          <el-descriptions-item label="成功数量">
            <span style="color: #67c23a">{{ currentTask.successCount }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="失败数量">
            <span style="color: #f56c6c">{{ currentTask.failedCount }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="成功率">
            <span style="color: #67c23a">
              {{ currentTask.dataCount > 0 ? ((currentTask.successCount / currentTask.dataCount) * 100).toFixed(2) : 0 }}%
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ currentTask.createTime }}
          </el-descriptions-item>
          <el-descriptions-item label="完成时间">
            {{ currentTask.completeTime || '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 进度展示 -->
        <div class="detail-section">
          <h4>执行进度</h4>
          <el-progress
            :percentage="currentTask.progress"
            :status="currentTask.status === TaskStatus.FAILED ? 'exception' : currentTask.status === TaskStatus.COMPLETED ? 'success' : undefined"
          />
        </div>

        <!-- 执行日志 -->
        <div class="detail-section">
          <h4>执行日志</h4>
          <div class="log-container">
            <div v-for="(log, index) in currentTask.logs" :key="index" class="log-item">
              {{ log }}
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="detail-actions">
          <el-button
            type="primary"
            :icon="Download"
            @click="downloadResult(currentTask)"
            :disabled="currentTask.status !== TaskStatus.COMPLETED"
          >
            下载结果
          </el-button>
          <el-button
            type="warning"
            @click="exportFailedData(currentTask)"
            :disabled="currentTask.failedCount === 0"
          >
            导出失败数据
          </el-button>
          <el-button
            type="success"
            @click="generateReport(currentTask)"
            :disabled="currentTask.status === TaskStatus.PENDING"
          >
            生成报告
          </el-button>
          <el-button
            type="info"
            :icon="Refresh"
            @click="retryFailedData(currentTask)"
            :disabled="currentTask.status !== TaskStatus.FAILED && currentTask.failedCount === 0"
          >
            重试失败数据
          </el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 数据配置对话框 -->
    <el-dialog
      v-model="configDialogVisible"
      title="数据格式配置"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-tabs>
        <el-tab-pane label="字段映射配置">
          <div class="config-section">
            <div class="config-header">
              <span>配置数据字段映射关系</span>
              <el-button type="primary" size="small" @click="addFieldMapping">
                添加映射
              </el-button>
            </div>
            <el-table :data="fieldMappings" border style="margin-top: 16px">
              <el-table-column label="源字段" width="200">
                <template #default="{ row }">
                  <el-input v-model="row.sourceField" placeholder="源字段名" />
                </template>
              </el-table-column>
              <el-table-column label="目标字段" width="200">
                <template #default="{ row }">
                  <el-input v-model="row.targetField" placeholder="目标字段名" />
                </template>
              </el-table-column>
              <el-table-column label="是否必填" width="100">
                <template #default="{ row }">
                  <el-switch v-model="row.required" />
                </template>
              </el-table-column>
              <el-table-column label="转换规则" width="180">
                <template #default="{ row }">
                  <el-input v-model="row.transform" placeholder="转换函数" />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100">
                <template #default="{ $index }">
                  <el-button
                    link
                    type="danger"
                    @click="removeFieldMapping($index)"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane label="批处理配置">
          <div class="config-section">
            <el-form :model="batchConfig" label-width="120px">
              <el-form-item label="批次大小">
                <el-input-number
                  v-model="batchConfig.batchSize"
                  :min="10"
                  :max="1000"
                  :step="10"
                />
                <span class="form-tip">每批处理的数据条数</span>
              </el-form-item>
              <el-form-item label="重试次数">
                <el-input-number
                  v-model="batchConfig.retryCount"
                  :min="0"
                  :max="10"
                />
                <span class="form-tip">失败后自动重试的次数</span>
              </el-form-item>
              <el-form-item label="超时时间">
                <el-input-number
                  v-model="batchConfig.timeout"
                  :min="10"
                  :max="300"
                />
                <span class="form-tip">单次请求超时时间（秒）</span>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <el-button @click="configDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveConfig">保存配置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.batch-upload-container {
  .upload-card,
  .search-card,
  .table-card {
    margin-bottom: 20px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }

    .task-count {
      font-size: 14px;
      color: #909399;
    }

    .header-actions {
      display: flex;
      gap: 10px;
    }
  }

  .info-alert {
    margin-bottom: 16px;
  }

  .template-section {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 16px;
    background-color: #f9fafc;
    border-radius: 4px;

    .template-title {
      font-size: 14px;
      color: #606266;
      font-weight: 500;
    }
  }

  .progress-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;

    .el-progress {
      flex: 1;
    }

    .progress-text {
      font-size: 12px;
      color: #909399;
      white-space: nowrap;
    }
  }

  .pagination-wrapper {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .upload-box {
    width: 100%;

    :deep(.el-upload-dragger) {
      width: 100%;
    }
  }

  .task-detail {
    .detail-section {
      margin-top: 24px;

      h4 {
        margin-bottom: 12px;
        font-size: 14px;
        font-weight: 600;
        color: #303133;
      }

      .log-container {
        max-height: 300px;
        overflow-y: auto;
        background-color: #f5f7fa;
        padding: 12px;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        font-size: 12px;

        .log-item {
          padding: 4px 0;
          color: #606266;
          line-height: 1.6;

          &:hover {
            background-color: #e4e7ed;
          }
        }
      }
    }

    .detail-actions {
      margin-top: 24px;
      display: flex;
      gap: 12px;
      justify-content: center;
      padding-top: 24px;
      border-top: 1px solid #e4e7ed;
    }
  }

  .config-section {
    padding: 16px 0;

    .config-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      span {
        font-size: 14px;
        color: #606266;
      }
    }

    .form-tip {
      margin-left: 12px;
      font-size: 12px;
      color: #909399;
    }
  }
}

// 响应式设计
@media screen and (max-width: 768px) {
  .batch-upload-container {
    padding: 10px;

    .card-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;

      .header-actions {
        width: 100%;
        flex-wrap: wrap;
      }
    }

    .template-section {
      flex-direction: column;
      align-items: flex-start;
    }

    :deep(.el-table) {
      font-size: 12px;
    }

    .detail-actions {
      flex-wrap: wrap;

      .el-button {
        flex: 1;
        min-width: calc(50% - 6px);
      }
    }
  }
}
</style>
