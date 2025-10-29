<template>
  <div class="model-import-export-container">
    <!-- 操作区域 -->
    <el-card class="operation-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="header-title">模型导入导出管理</span>
          <div class="header-actions">
            <el-button type="primary" :icon="Upload" @click="handleImport">
              导入模型
            </el-button>
            <el-button
              type="success"
              :icon="Download"
              @click="handleBatchExport"
              :disabled="selectedModels.length === 0"
            >
              批量导出 ({{ selectedModels.length }})
            </el-button>
            <el-button
              type="warning"
              :icon="Refresh"
              @click="handleBatchConvert"
              :disabled="selectedModels.length === 0"
            >
              批量转换
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索和筛选 -->
      <el-row :gutter="16" class="filter-row">
        <el-col :span="8">
          <el-input
            v-model="searchQuery"
            placeholder="搜索模型名称"
            :prefix-icon="Search"
            clearable
            @input="handleSearch"
          />
        </el-col>
        <el-col :span="5">
          <el-select
            v-model="filterFormat"
            placeholder="文件格式"
            clearable
            @change="handleFilter"
          >
            <el-option label="全部格式" value="" />
            <el-option label="FBX" value="fbx" />
            <el-option label="OBJ" value="obj" />
            <el-option label="GLTF" value="gltf" />
            <el-option label="STL" value="stl" />
            <el-option label="3DS" value="3ds" />
          </el-select>
        </el-col>
        <el-col :span="5">
          <el-select
            v-model="filterStatus"
            placeholder="文件状态"
            clearable
            @change="handleFilter"
          >
            <el-option label="全部状态" value="" />
            <el-option label="就绪" value="ready" />
            <el-option label="处理中" value="processing" />
            <el-option label="成功" value="success" />
            <el-option label="失败" value="failed" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-button type="primary" :icon="Search" @click="handleFilter">
            搜索
          </el-button>
          <el-button :icon="RefreshRight" @click="handleReset">重置</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 模型文件列表 -->
    <el-card class="table-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="header-title">模型文件列表</span>
          <span class="total-count">共 {{ filteredModels.length }} 个模型</span>
        </div>
      </template>

      <el-table
        :data="paginatedModels"
        style="width: 100%"
        @selection-change="handleSelectionChange"
        v-loading="loading"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="模型名称">
          <template #default="{ row }">
            <div class="model-name">
              <el-icon class="format-icon" :style="{ color: getFormatColor(row.format) }">
                <Document />
              </el-icon>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="format" label="文件格式">
          <template #default="{ row }">
            <el-tag :type="getFormatTagType(row.format)" size="small">
              {{ row.format.toUpperCase() }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="size" label="文件大小" />
        <el-table-column prop="importTime" label="导入时间" width="180" />
        <el-table-column prop="status" label="状态" >
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="progress" label="进度" width="150">
          <template #default="{ row }">
            <el-progress
              v-if="row.status === 'processing'"
              :percentage="row.progress"
              :color="customColors"
            />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="300">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              :icon="View"
              link
              @click="handlePreview(row)"
            >
              预览
            </el-button>
            <el-button
              type="success"
              size="small"
              :icon="Download"
              link
              @click="handleExport(row)"
            >
              导出
            </el-button>
            <el-button
              type="warning"
              size="small"
              :icon="Refresh"
              link
              @click="handleConvert(row)"
            >
              转换
            </el-button>
            <el-button
              type="danger"
              size="small"
              :icon="Delete"
              link
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredModels.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 操作记录 -->
    <el-card class="history-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="header-title">导入导出记录</span>
          <el-button
            type="primary"
            size="small"
            :icon="Download"
            @click="handleExportHistory"
          >
            导出记录
          </el-button>
        </div>
      </template>

      <el-table :data="operationHistory" style="width: 100%" max-height="300">
        <el-table-column prop="time" label="操作时间" width="180" />
        <el-table-column prop="user" label="操作用户" width="120" />
        <el-table-column prop="type" label="操作类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getOperationType(row.type)" size="small">
              {{ row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="fileName" label="文件名称" width="200" />
        <el-table-column prop="format" label="格式" width="100" />
        <el-table-column prop="size" label="大小" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="备注" show-overflow-tooltip />
      </el-table>
    </el-card>

    <!-- 导入模型对话框 -->
    <el-dialog
      v-model="importDialogVisible"
      title="导入模型"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-alert
        title="支持的格式"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      >
        <template #default>
          支持 FBX、OBJ、GLTF、STL、3DS 等主流三维模型格式，支持批量上传
        </template>
      </el-alert>

      <el-upload
        ref="uploadRef"
        class="upload-demo"
        drag
        :auto-upload="false"
        :on-change="handleFileChange"
        :file-list="uploadFileList"
        accept=".fbx,.obj,.gltf,.glb,.stl,.3ds"
        multiple
      >
        <el-icon class="el-icon--upload">
          <upload-filled />
        </el-icon>
        <div class="el-upload__text">
          拖拽文件到此处或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持单个或批量上传，单个文件不超过 500MB
          </div>
        </template>
      </el-upload>

      <div v-if="uploadFileList.length > 0" class="upload-list">
        <div
          v-for="(file, index) in uploadFileList"
          :key="index"
          class="upload-item"
        >
          <div class="file-info">
            <el-icon><Document /></el-icon>
            <span>{{ file.name }}</span>
            <span class="file-size">{{ formatFileSize(file.size || 0) }}</span>
          </div>
          <el-progress
            v-if="file.status === 'uploading'"
            :percentage="file.progress || 0"
            :color="customColors"
          />
        </div>
      </div>

      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleUpload"
          :loading="uploading"
          :disabled="uploadFileList.length === 0"
        >
          开始上传
        </el-button>
      </template>
    </el-dialog>

    <!-- 格式转换对话框 -->
    <el-dialog
      v-model="convertDialogVisible"
      title="模型格式转换"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="convertForm" label-width="120px">
        <el-form-item label="源模型">
          <el-input v-model="convertForm.sourceName" disabled />
        </el-form-item>
        <el-form-item label="源格式">
          <el-tag>{{ convertForm.sourceFormat.toUpperCase() }}</el-tag>
        </el-form-item>
        <el-form-item label="目标格式">
          <el-select v-model="convertForm.targetFormat" placeholder="请选择目标格式">
            <el-option label="FBX" value="fbx" />
            <el-option label="OBJ" value="obj" />
            <el-option label="GLTF" value="gltf" />
            <el-option label="STL" value="stl" />
            <el-option label="3DS" value="3ds" />
          </el-select>
        </el-form-item>
        <el-form-item label="转换质量">
          <el-slider v-model="convertForm.quality" :min="1" :max="100" show-input />
        </el-form-item>
        <el-form-item label="保留纹理">
          <el-switch v-model="convertForm.keepTexture" />
        </el-form-item>
        <el-form-item label="保留动画">
          <el-switch v-model="convertForm.keepAnimation" />
        </el-form-item>
      </el-form>

      <div v-if="convertProgress > 0" class="convert-progress">
        <el-progress :percentage="convertProgress" :color="customColors" />
        <div class="convert-log">
          <div v-for="(log, index) in convertLogs" :key="index" class="log-item">
            {{ log }}
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="convertDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleStartConvert"
          :loading="converting"
        >
          开始转换
        </el-button>
      </template>
    </el-dialog>

    <!-- 导出模型对话框 -->
    <el-dialog
      v-model="exportDialogVisible"
      title="导出模型"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="exportForm" label-width="120px">
        <el-form-item label="导出模型">
          <el-tag v-if="!isBatchExport">{{ exportForm.modelName }}</el-tag>
          <el-tag v-else>已选择 {{ selectedModels.length }} 个模型</el-tag>
        </el-form-item>
        <el-form-item label="导出格式">
          <el-select v-model="exportForm.format" placeholder="请选择导出格式">
            <el-option label="FBX" value="fbx" />
            <el-option label="OBJ" value="obj" />
            <el-option label="GLTF" value="gltf" />
            <el-option label="STL" value="stl" />
            <el-option label="3DS" value="3ds" />
          </el-select>
        </el-form-item>
        <el-form-item label="导出质量">
          <el-radio-group v-model="exportForm.quality">
            <el-radio label="low">低质量 (文件小)</el-radio>
            <el-radio label="medium">中质量 (平衡)</el-radio>
            <el-radio label="high">高质量 (文件大)</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="压缩选项">
          <el-checkbox v-model="exportForm.compress">启用压缩</el-checkbox>
        </el-form-item>
        <el-form-item label="精度设置">
          <el-slider v-model="exportForm.precision" :min="1" :max="10" show-input />
        </el-form-item>
      </el-form>

      <div v-if="exportProgress > 0" class="export-progress">
        <el-progress :percentage="exportProgress" :color="customColors" />
        <div class="export-status">
          正在导出模型，请稍候...
        </div>
      </div>

      <template #footer>
        <el-button @click="exportDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleStartExport"
          :loading="exporting"
        >
          开始导出
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Upload,
  Download,
  Refresh,
  Search,
  RefreshRight,
  View,
  Delete,
  Document,
  UploadFilled
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { UploadUserFile, UploadFile } from 'element-plus'

// 接口定义
interface ModelFile {
  id: string
  name: string
  format: string
  size: string
  importTime: string
  status: 'ready' | 'processing' | 'success' | 'failed'
  progress: number
}

interface OperationRecord {
  time: string
  user: string
  type: string
  fileName: string
  format: string
  size: string
  status: string
  message: string
}

interface ConvertForm {
  sourceName: string
  sourceFormat: string
  targetFormat: string
  quality: number
  keepTexture: boolean
  keepAnimation: boolean
}

interface ExportForm {
  modelName: string
  format: string
  quality: 'low' | 'medium' | 'high'
  compress: boolean
  precision: number
}

// 响应式数据
const loading = ref(false)
const searchQuery = ref('')
const filterFormat = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const selectedModels = ref<ModelFile[]>([])

// 模型数据
const modelList = ref<ModelFile[]>([])

// 操作记录
const operationHistory = ref<OperationRecord[]>([])

// 对话框控制
const importDialogVisible = ref(false)
const convertDialogVisible = ref(false)
const exportDialogVisible = ref(false)

// 上传相关
const uploadRef = ref()
const uploadFileList = ref<UploadUserFile[]>([])
const uploading = ref(false)

// 转换相关
const convertForm = ref<ConvertForm>({
  sourceName: '',
  sourceFormat: '',
  targetFormat: '',
  quality: 80,
  keepTexture: true,
  keepAnimation: true
})
const converting = ref(false)
const convertProgress = ref(0)
const convertLogs = ref<string[]>([])

// 导出相关
const exportForm = ref<ExportForm>({
  modelName: '',
  format: 'fbx',
  quality: 'medium',
  compress: true,
  precision: 5
})
const exporting = ref(false)
const exportProgress = ref(0)
const isBatchExport = ref(false)

// 进度条颜色
const customColors = [
  { color: '#f56c6c', percentage: 20 },
  { color: '#e6a23c', percentage: 40 },
  { color: '#5cb87a', percentage: 60 },
  { color: '#1989fa', percentage: 80 },
  { color: '#6f7ad3', percentage: 100 }
]

// 计算属性
const filteredModels = computed(() => {
  let result = modelList.value

  // 搜索过滤
  if (searchQuery.value) {
    result = result.filter((model) =>
      model.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  // 格式过滤
  if (filterFormat.value) {
    result = result.filter((model) => model.format === filterFormat.value)
  }

  // 状态过滤
  if (filterStatus.value) {
    result = result.filter((model) => model.status === filterStatus.value)
  }

  return result
})

const paginatedModels = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredModels.value.slice(start, end)
})

// 初始化数据
onMounted(() => {
  loadMockData()
})

// Mock 数据加载
const loadMockData = () => {
  loading.value = true

  setTimeout(() => {
    // 模型列表数据
    modelList.value = [
      {
        id: '1',
        name: 'Building_Model_A',
        format: 'fbx',
        size: '125.6 MB',
        importTime: '2025-10-29 10:30:15',
        status: 'ready',
        progress: 0
      },
      {
        id: '2',
        name: 'Character_Hero',
        format: 'obj',
        size: '89.3 MB',
        importTime: '2025-10-29 09:15:42',
        status: 'success',
        progress: 100
      },
      {
        id: '3',
        name: 'Vehicle_Car_01',
        format: 'gltf',
        size: '56.7 MB',
        importTime: '2025-10-29 08:45:23',
        status: 'processing',
        progress: 65
      },
      {
        id: '4',
        name: 'Furniture_Chair',
        format: 'stl',
        size: '12.4 MB',
        importTime: '2025-10-28 16:20:11',
        status: 'ready',
        progress: 0
      },
      {
        id: '5',
        name: 'Environment_Tree',
        format: '3ds',
        size: '34.8 MB',
        importTime: '2025-10-28 14:55:33',
        status: 'failed',
        progress: 0
      },
      {
        id: '6',
        name: 'Weapon_Sword_Epic',
        format: 'fbx',
        size: '45.2 MB',
        importTime: '2025-10-28 11:30:00',
        status: 'success',
        progress: 100
      },
      {
        id: '7',
        name: 'Building_House_Modern',
        format: 'obj',
        size: '156.9 MB',
        importTime: '2025-10-27 15:45:22',
        status: 'ready',
        progress: 0
      },
      {
        id: '8',
        name: 'Character_NPC_01',
        format: 'gltf',
        size: '78.5 MB',
        importTime: '2025-10-27 13:20:18',
        status: 'success',
        progress: 100
      },
      {
        id: '9',
        name: 'Prop_Box_Wooden',
        format: 'fbx',
        size: '23.1 MB',
        importTime: '2025-10-27 10:10:05',
        status: 'processing',
        progress: 32
      },
      {
        id: '10',
        name: 'Landscape_Terrain_A',
        format: 'obj',
        size: '234.7 MB',
        importTime: '2025-10-26 16:55:40',
        status: 'ready',
        progress: 0
      }
    ]

    // 操作记录数据
    operationHistory.value = [
      {
        time: '2025-10-29 10:30:15',
        user: '张三',
        type: '导入',
        fileName: 'Building_Model_A.fbx',
        format: 'FBX',
        size: '125.6 MB',
        status: 'success',
        message: '导入成功'
      },
      {
        time: '2025-10-29 09:15:42',
        user: '李四',
        type: '导出',
        fileName: 'Character_Hero.obj',
        format: 'OBJ',
        size: '89.3 MB',
        status: 'success',
        message: '导出成功'
      },
      {
        time: '2025-10-29 08:45:23',
        user: '王五',
        type: '转换',
        fileName: 'Vehicle_Car_01.gltf',
        format: 'GLTF',
        size: '56.7 MB',
        status: 'processing',
        message: '正在转换中...'
      },
      {
        time: '2025-10-28 16:20:11',
        user: '赵六',
        type: '导入',
        fileName: 'Furniture_Chair.stl',
        format: 'STL',
        size: '12.4 MB',
        status: 'success',
        message: '导入成功'
      },
      {
        time: '2025-10-28 14:55:33',
        user: '张三',
        type: '转换',
        fileName: 'Environment_Tree.3ds',
        format: '3DS',
        size: '34.8 MB',
        status: 'failed',
        message: '转换失败：格式不支持'
      }
    ]

    loading.value = false
  }, 800)
}

// 事件处理函数
const handleSearch = () => {
  currentPage.value = 1
}

const handleFilter = () => {
  currentPage.value = 1
}

const handleReset = () => {
  searchQuery.value = ''
  filterFormat.value = ''
  filterStatus.value = ''
  currentPage.value = 1
}

const handleSelectionChange = (selection: ModelFile[]) => {
  selectedModels.value = selection
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

// 导入功能
const handleImport = () => {
  importDialogVisible.value = true
  uploadFileList.value = []
}

const handleFileChange = (file: UploadFile, fileList: UploadFile[]) => {
  uploadFileList.value = fileList as UploadUserFile[]
}

const handleUpload = async () => {
  if (uploadFileList.value.length === 0) {
    ElMessage.warning('请选择要上传的文件')
    return
  }

  uploading.value = true

  // 模拟上传过程
  for (const file of uploadFileList.value) {
    file.status = 'uploading'
    
    // 模拟上传进度
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      file.progress = i
    }

    // 添加到模型列表
    const newModel: ModelFile = {
      id: Date.now().toString(),
      name: file.name || '',
      format: file.name?.split('.').pop()?.toLowerCase() || 'unknown',
      size: formatFileSize(file.size || 0),
      importTime: new Date().toLocaleString('zh-CN'),
      status: 'success',
      progress: 100
    }

    modelList.value.unshift(newModel)

    // 添加操作记录
    operationHistory.value.unshift({
      time: new Date().toLocaleString('zh-CN'),
      user: '当前用户',
      type: '导入',
      fileName: file.name || '',
      format: newModel.format.toUpperCase(),
      size: newModel.size,
      status: 'success',
      message: '导入成功'
    })
  }

  uploading.value = false
  importDialogVisible.value = false
  ElMessage.success('模型上传成功！')
  uploadFileList.value = []
}

// 格式转换
const handleConvert = (row: ModelFile) => {
  convertForm.value = {
    sourceName: row.name,
    sourceFormat: row.format,
    targetFormat: '',
    quality: 80,
    keepTexture: true,
    keepAnimation: true
  }
  convertProgress.value = 0
  convertLogs.value = []
  convertDialogVisible.value = true
}

const handleBatchConvert = () => {
  if (selectedModels.value.length === 0) {
    ElMessage.warning('请选择要转换的模型')
    return
  }
  ElMessage.info(`批量转换 ${selectedModels.value.length} 个模型`)
  // 这里可以打开批量转换对话框
}

const handleStartConvert = async () => {
  if (!convertForm.value.targetFormat) {
    ElMessage.warning('请选择目标格式')
    return
  }

  converting.value = true
  convertLogs.value = []

  // 模拟转换过程
  const logs = [
    '开始加载源模型...',
    '解析模型数据...',
    '处理几何体信息...',
    '处理纹理数据...',
    '处理动画数据...',
    '生成目标格式...',
    '优化输出文件...',
    '转换完成！'
  ]

  for (let i = 0; i < logs.length; i++) {
    await new Promise((resolve) => setTimeout(resolve, 500))
    convertLogs.value.push(`[${new Date().toLocaleTimeString()}] ${logs[i]}`)
    convertProgress.value = Math.round(((i + 1) / logs.length) * 100)
  }

  // 添加操作记录
  operationHistory.value.unshift({
    time: new Date().toLocaleString('zh-CN'),
    user: '当前用户',
    type: '转换',
    fileName: convertForm.value.sourceName,
    format: `${convertForm.value.sourceFormat.toUpperCase()} → ${convertForm.value.targetFormat.toUpperCase()}`,
    size: '-',
    status: 'success',
    message: '转换成功'
  })

  converting.value = false
  ElMessage.success('格式转换成功！')
  
  setTimeout(() => {
    convertDialogVisible.value = false
  }, 1000)
}

// 导出功能
const handleExport = (row: ModelFile) => {
  exportForm.value = {
    modelName: row.name,
    format: row.format,
    quality: 'medium',
    compress: true,
    precision: 5
  }
  exportProgress.value = 0
  isBatchExport.value = false
  exportDialogVisible.value = true
}

const handleBatchExport = () => {
  if (selectedModels.value.length === 0) {
    ElMessage.warning('请选择要导出的模型')
    return
  }
  exportForm.value = {
    modelName: `${selectedModels.value.length} 个模型`,
    format: 'fbx',
    quality: 'medium',
    compress: true,
    precision: 5
  }
  exportProgress.value = 0
  isBatchExport.value = true
  exportDialogVisible.value = true
}

const handleStartExport = async () => {
  exporting.value = true

  // 模拟导出进度
  for (let i = 0; i <= 100; i += 5) {
    await new Promise((resolve) => setTimeout(resolve, 100))
    exportProgress.value = i
  }

  // 添加操作记录
  operationHistory.value.unshift({
    time: new Date().toLocaleString('zh-CN'),
    user: '当前用户',
    type: '导出',
    fileName: isBatchExport.value ? `批量导出(${selectedModels.value.length}个)` : exportForm.value.modelName,
    format: exportForm.value.format.toUpperCase(),
    size: '-',
    status: 'success',
    message: '导出成功'
  })

  exporting.value = false
  ElMessage.success('模型导出成功！')
  
  setTimeout(() => {
    exportDialogVisible.value = false
  }, 500)
}

// 其他操作
const handlePreview = (row: ModelFile) => {
  ElMessage.info(`预览模型: ${row.name}`)
}

const handleDelete = async (row: ModelFile) => {
  try {
    await ElMessageBox.confirm(`确定要删除模型 "${row.name}" 吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    modelList.value = modelList.value.filter((item) => item.id !== row.id)
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}

const handleExportHistory = () => {
  ElMessage.success('操作记录导出成功！')
}

// 工具函数
const getFormatColor = (format: string): string => {
  const colors: Record<string, string> = {
    fbx: '#409EFF',
    obj: '#67C23A',
    gltf: '#E6A23C',
    stl: '#F56C6C',
    '3ds': '#909399'
  }
  return colors[format] || '#909399'
}

const getFormatTagType = (format: string): '' | 'success' | 'info' | 'warning' | 'danger' => {
  const types: Record<string, '' | 'success' | 'info' | 'warning' | 'danger'> = {
    fbx: '',
    obj: 'success',
    gltf: 'warning',
    stl: 'danger',
    '3ds': 'info'
  }
  return types[format] || 'info'
}

const getStatusType = (status: string): '' | 'success' | 'info' | 'warning' | 'danger' => {
  const types: Record<string, '' | 'success' | 'info' | 'warning' | 'danger'> = {
    ready: 'success',
    processing: '',
    success: 'success',
    failed: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status: string): string => {
  const texts: Record<string, string> = {
    ready: '就绪',
    processing: '处理中',
    success: '成功',
    failed: '失败'
  }
  return texts[status] || status
}

const getOperationType = (type: string): '' | 'success' | 'info' | 'warning' | 'danger' => {
  const types: Record<string, '' | 'success' | 'info' | 'warning' | 'danger'> = {
    导入: '',
    导出: 'success',
    转换: 'warning'
  }
  return types[type] || 'info'
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<style scoped>
.model-import-export-container {
}

.operation-card,
.table-card,
.history-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.filter-row {
  margin-top: 16px;
}

.total-count {
  font-size: 14px;
  color: #909399;
}

.model-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.format-icon {
  font-size: 18px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.upload-list {
  margin-top: 20px;
  max-height: 300px;
  overflow-y: auto;
}

.upload-item {
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  margin-bottom: 10px;
  background: #f9fafc;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.file-size {
  margin-left: auto;
  color: #909399;
  font-size: 12px;
}

.convert-progress,
.export-progress {
  margin-top: 20px;
  padding: 16px;
  background: #f9fafc;
  border-radius: 4px;
}

.convert-log {
  margin-top: 16px;
  max-height: 200px;
  overflow-y: auto;
  padding: 12px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.log-item {
  padding: 4px 0;
  color: #606266;
}

.export-status {
  margin-top: 12px;
  text-align: center;
  color: #606266;
  font-size: 14px;
}

/* 自定义上传组件样式 */
:deep(.el-upload-dragger) {
  padding: 40px;
}

:deep(.el-icon--upload) {
  font-size: 67px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

:deep(.el-upload__text) {
  color: #606266;
  font-size: 14px;
}

:deep(.el-upload__text em) {
  color: #409eff;
  font-style: normal;
}

/* 表格样式优化 */
:deep(.el-table) {
  font-size: 14px;
}

:deep(.el-table th) {
  background-color: #f5f7fa;
  color: #303133;
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .model-import-export-container {
    padding: 10px;
  }

  .header-actions {
    flex-direction: column;
  }

  .filter-row .el-col {
    margin-bottom: 10px;
  }
}
</style>
