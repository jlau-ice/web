<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Upload, UploadFilled, CircleCheck, Loading, CircleClose } from '@element-plus/icons-vue'
import type { UploadFile, UploadFiles } from 'element-plus'

// 类型定义
interface BuildingModel {
  id: string
  name: string
  type: string
  format: string
  fileSize: string
  createTime: string
  status: 'normal' | 'optimizing' | 'error' | 'pending'
  thumbnail?: string
  description?: string
  version: string
  permissions: string[]
}

interface ModelVersion {
  id: string
  version: string
  createTime: string
  author: string
  description: string
  isCurrent: boolean
}

// 响应式数据
const loading = ref(false)
const searchKeyword = ref('')
const selectedType = ref('')
const selectedStatus = ref('')
const selectedModel = ref<BuildingModel | null>(null)

// 对话框状态
const uploadDialogVisible = ref(false)
const editDialogVisible = ref(false)
const versionDialogVisible = ref(false)
const permissionDialogVisible = ref(false)
const optimizeDialogVisible = ref(false)

// 表单数据
const editForm = reactive({
  name: '',
  description: '',
  type: ''
})

const permissionForm = reactive({
  userIds: [] as string[],
  permissions: [] as string[]
})

const optimizeForm = reactive({
  targetFaces: '',
  targetSize: '',
  quality: 'high',
  compressTextures: true,
  mergeMeshes: true
})

// 模拟数据
const buildingTypes = [
  { label: '办公楼', value: 'office' },
  { label: '住宅楼', value: 'residential' },
  { label: '商业综合体', value: 'commercial' },
  { label: '工业厂房', value: 'industrial' },
  { label: '公共设施', value: 'public' }
]

const statusOptions = [
  { label: '全部', value: '' },
  { label: '正常', value: 'normal' },
  { label: '优化中', value: 'optimizing' },
  { label: '异常', value: 'error' },
  { label: '待处��', value: 'pending' }
]

const mockModels: BuildingModel[] = [
  {
    id: '1',
    name: 'A座办公楼',
    type: 'office',
    format: 'FBX',
    fileSize: '12.5MB',
    createTime: '2024-01-15 10:30:00',
    status: 'normal',
    thumbnail: '/api/placeholder/200/150',
    description: '主要办公楼宇，地上15层地下2层',
    version: 'v1.2.0',
    permissions: ['admin', 'editor']
  },
  {
    id: '2',
    name: 'B1住宅楼',
    type: 'residential',
    format: 'GLTF',
    fileSize: '8.3MB',
    createTime: '2024-01-20 14:22:00',
    status: 'optimizing',
    thumbnail: '/api/placeholder/200/150',
    description: '高层住宅楼，30层，共120户',
    version: 'v2.0.1',
    permissions: ['admin']
  },
  {
    id: '3',
    name: '商业综合体',
    type: 'commercial',
    format: 'OBJ',
    fileSize: '25.7MB',
    createTime: '2024-01-18 09:15:00',
    status: 'error',
    thumbnail: '/api/placeholder/200/150',
    description: '集购物、餐饮、娱乐于一体的综合商业体',
    version: 'v1.0.5',
    permissions: ['admin', 'viewer']
  }
]

const modelList = ref<BuildingModel[]>([])
const versions = ref<ModelVersion[]>([])
const uploadFiles = ref<UploadFiles>([])

// 计算属性
const filteredModels = computed(() => {
  return modelList.value.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
    const matchesType = !selectedType.value || model.type === selectedType.value
    const matchesStatus = !selectedStatus.value || model.status === selectedStatus.value
    return matchesSearch && matchesType && matchesStatus
  })
})

const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    normal: 'success',
    optimizing: 'warning',
    error: 'danger',
    pending: 'info'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    normal: '正常',
    optimizing: '优化中',
    error: '异常',
    pending: '待处理'
  }
  return statusMap[status] || status
}

// 方法
const loadModels = () => {
  loading.value = true
  setTimeout(() => {
    modelList.value = [...mockModels]
    loading.value = false
  }, 1000)
}

const handleSearch = () => {
  // 搜索逻辑已通过计算属性实现
}

const handleUpload = () => {
  uploadDialogVisible.value = true
}

const handleEdit = (model: BuildingModel) => {
  selectedModel.value = model
  editForm.name = model.name
  editForm.description = model.description || ''
  editForm.type = model.type
  editDialogVisible.value = true
}

const handleSaveEdit = () => {
  if (!selectedModel.value) return

  const index = modelList.value.findIndex(m => m.id === selectedModel.value!.id)
  if (index !== -1) {
    modelList.value[index] = {
      ...modelList.value[index],
      name: editForm.name,
      description: editForm.description,
      type: editForm.type
    }
  }

  ElMessage.success('模型信息更新成功')
  editDialogVisible.value = false
}

const handleDelete = async (model: BuildingModel) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除模型"${model.name}"吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const index = modelList.value.findIndex(m => m.id === model.id)
    if (index !== -1) {
      modelList.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  } catch {
    // 用户取消删除
  }
}

const handleVersion = (model: BuildingModel) => {
  selectedModel.value = model
  // 模拟版本数据
  versions.value = [
    {
      id: '1',
      version: 'v1.2.0',
      createTime: '2024-01-15 10:30:00',
      author: '张三',
      description: '优化模型面数，提升渲染性能',
      isCurrent: true
    },
    {
      id: '2',
      version: 'v1.1.0',
      createTime: '2024-01-10 15:20:00',
      author: '李四',
      description: '修复材质问题，添加贴图',
      isCurrent: false
    },
    {
      id: '3',
      version: 'v1.0.0',
      createTime: '2024-01-05 09:00:00',
      author: '王五',
      description: '第一版，基础建模完成',
      isCurrent: false
    }
  ]
  versionDialogVisible.value = true
}

const handleRollback = (version: ModelVersion) => {
  ElMessageBox.confirm(
    `确定要回滚到版本 ${version.version} 吗？`,
    '确认回滚',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.success(`已回滚到版本 ${version.version}`)
    versionDialogVisible.value = false
    loadModels()
  }).catch(() => {
    // 用户取消
  })
}

const handleCompareVersions = () => {
  ElMessage.info('版本对比功能开发中...')
}

const handleOptimize = (model: BuildingModel) => {
  selectedModel.value = model
  optimizeForm.targetFaces = ''
  optimizeForm.targetSize = ''
  optimizeForm.quality = 'high'
  optimizeForm.compressTextures = true
  optimizeForm.mergeMeshes = true
  optimizeDialogVisible.value = true
}

const handleStartOptimization = () => {
  if (!selectedModel.value) return

  ElMessage.success('模型优化任务已开始')

  // 更新模型状态为优化中
  const index = modelList.value.findIndex(m => m.id === selectedModel.value!.id)
  if (index !== -1) {
    modelList.value[index].status = 'optimizing'
  }

  optimizeDialogVisible.value = false

  // 模拟优化完成
  setTimeout(() => {
    const updatedIndex = modelList.value.findIndex(m => m.id === selectedModel.value!.id)
    if (updatedIndex !== -1) {
      modelList.value[updatedIndex].status = 'normal'
      modelList.value[updatedIndex].version = 'v1.3.0'
      ElMessage.success('模型优化完成')
    }
  }, 3000)
}

const handlePermission = (model: BuildingModel) => {
  selectedModel.value = model
  permissionForm.userIds = []
  permissionForm.permissions = [...model.permissions]
  permissionDialogVisible.value = true
}

const handleSavePermission = () => {
  if (!selectedModel.value) return

  const index = modelList.value.findIndex(m => m.id === selectedModel.value!.id)
  if (index !== -1) {
    modelList.value[index].permissions = [...permissionForm.permissions]
  }

  ElMessage.success('权限设置成功')
  permissionDialogVisible.value = false
}

const handleFileUpload = (file: UploadFile) => {
  const allowedFormats = ['fbx', 'obj', 'gltf', '3ds']
  const fileExtension = file.name?.split('.').pop()?.toLowerCase()

  if (!fileExtension || !allowedFormats.includes(fileExtension)) {
    ElMessage.error(`不支持的文件格式，支持的格式：${allowedFormats.join(', ')}`)
    return false
  }

  if (file.size && file.size > 100 * 1024 * 1024) { // 100MB
    ElMessage.error('文件大小不能超过100MB')
    return false
  }

  return true
}

const handleUploadSuccess = () => {
  ElMessage.success('模型上传成功')
  uploadDialogVisible.value = false
  uploadFiles.value = []
  loadModels()
}

// 生命周期
onMounted(() => {
  loadModels()
})
</script>

<template>
  <div class="building-model-container">
    <!-- 统计信息卡片 -->
    <el-row :gutter="20" class="stats-cards">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon normal">
              <el-icon size="24"><Building /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ modelList.length }}</div>
              <div class="stat-label">总模型数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon success">
              <el-icon size="24"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">
                {{ modelList.filter(m => m.status === 'normal').length }}
              </div>
              <div class="stat-label">正常模型</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon warning">
              <el-icon size="24"><Loading /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">
                {{ modelList.filter(m => m.status === 'optimizing').length }}
              </div>
              <div class="stat-label">优化中</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon danger">
              <el-icon size="24"><CircleClose /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">
                {{ modelList.filter(m => m.status === 'error').length }}
              </div>
              <div class="stat-label">异常模型</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 头部操作栏 -->
    <div class="header-actions">
      <el-row :gutter="16" class="search-row">
        <el-col :span="6">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索建筑名称"
            :prefix-icon="Search"
            @input="handleSearch"
            clearable
          />
        </el-col>
        <el-col :span="4">
          <el-select v-model="selectedType" placeholder="建筑类型" clearable>
            <el-option
              v-for="type in buildingTypes"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="selectedStatus" placeholder="状态" clearable>
            <el-option
              v-for="status in statusOptions"
              :key="status.value"
              :label="status.label"
              :value="status.value"
            />
          </el-select>
        </el-col>
        <el-col :span="10" class="text-right">
          <el-button type="primary" @click="handleUpload">
            <el-icon><Upload /></el-icon>
            上传模型
          </el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 模型列表 -->
    <el-card class="model-list-card">
      <el-table
        v-loading="loading"
        :data="filteredModels"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="name" label="建筑名称" >
          <template #default="{ row }">
            <div class="model-name-cell">
              <div class="model-info">
                <div class="name">{{ row.name }}</div>
                <div class="description">{{ row.description }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="type" label="建筑类型" >
          <template #default="{ row }">
            <el-tag size="small">
              {{ buildingTypes.find(t => t.value === row.type)?.label || row.type }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="format" label="模型格式"/>

        <el-table-column prop="fileSize" label="文件大小" />

        <el-table-column prop="createTime" label="创建时间" />

        <el-table-column prop="status" label="状态" >
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="version" label="版本" width="100" />

        <el-table-column label="操作" width="350" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button
              size="small"
              type="warning"
              @click="handleOptimize(row)"
              :disabled="row.status === 'optimizing'"
            >
              {{ row.status === 'optimizing' ? '优化中' : '优化' }}
            </el-button>
            <el-button size="small" @click="handleVersion(row)">版本</el-button>
            <el-button size="small" @click="handlePermission(row)">权限</el-button>
            <el-button
              size="small"
              type="danger"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 上传对话框 -->
    <el-dialog
      v-model="uploadDialogVisible"
      title="上传建筑模型"
      width="600px"
    >
      <el-upload
        v-model:file-list="uploadFiles"
        class="upload-demo"
        drag
        :auto-upload="false"
        :before-upload="handleFileUpload"
        :on-success="handleUploadSuccess"
        action="/api/upload"
        multiple
        accept=".fbx,.obj,.gltf,.3ds"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持格式：FBX、OBJ、GLTF、3DS，文件大小不超过100MB
          </div>
        </template>
      </el-upload>

      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleUploadSuccess"
          :disabled="uploadFiles.length === 0"
        >
          开始上传
        </el-button>
      </template>
    </el-dialog>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑模型信息"
      width="500px"
    >
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="建筑名称">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item label="建筑类型">
          <el-select v-model="editForm.type" style="width: 100%">
            <el-option
              v-for="type in buildingTypes"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入模型描述"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 版本管理对话框 -->
    <el-dialog
      v-model="versionDialogVisible"
      title="版本管理"
      width="800px"
    >
      <el-table :data="versions" style="width: 100%">
        <el-table-column prop="version" label="版本号" width="120" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column prop="author" label="作者" width="120" />
        <el-table-column prop="description" label="描述" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button
              size="small"
              :disabled="row.isCurrent"
              type="primary"
              @click="handleRollback(row)"
            >
              {{ row.isCurrent ? '当前版本' : '回滚' }}
            </el-button>
            <el-button size="small" @click="handleCompareVersions">对比</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 模型优化对话框 -->
    <el-dialog
      v-model="optimizeDialogVisible"
      title="模型优化设置"
      width="600px"
    >
      <el-form :model="optimizeForm" label-width="120px">
        <el-form-item label="目标面数">
          <el-input
            v-model="optimizeForm.targetFaces"
            placeholder="留空则自动计算最优面数"
          />
        </el-form-item>
        <el-form-item label="目标文件大小">
          <el-input
            v-model="optimizeForm.targetSize"
            placeholder="例如：10MB，留空则自动压缩"
          />
        </el-form-item>
        <el-form-item label="优化质量">
          <el-radio-group v-model="optimizeForm.quality">
            <el-radio label="high">高质量</el-radio>
            <el-radio label="medium">平衡质量</el-radio>
            <el-radio label="low">高压缩</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="优化选项">
          <el-checkbox v-model="optimizeForm.compressTextures">
            压缩贴图纹理
          </el-checkbox>
          <el-checkbox v-model="optimizeForm.mergeMeshes">
            合并网格对象
          </el-checkbox>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="optimizeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleStartOptimization">
          开始优化
        </el-button>
      </template>
    </el-dialog>

    <!-- 权限管理对话框 -->
    <el-dialog
      v-model="permissionDialogVisible"
      title="权限管理"
      width="500px"
    >
      <el-form :model="permissionForm" label-width="100px">
        <el-form-item label="用户权限">
          <el-checkbox-group v-model="permissionForm.permissions">
            <el-checkbox label="admin">管理员</el-checkbox>
            <el-checkbox label="editor">编辑者</el-checkbox>
            <el-checkbox label="viewer">查看者</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="permissionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSavePermission">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.building-model-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;

  .stats-cards {
    margin-bottom: 20px;

    .stat-card {
      border: none;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.12);
      }

      :deep(.el-card__body) {
        padding: 20px;
      }

      .stat-content {
        display: flex;
        align-items: center;
        gap: 16px;

        .stat-icon {
          width: 50px;
          height: 50px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;

          &.normal {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }

          &.success {
            background: linear-gradient(135deg, #13ce66 0%, #0fa560 100%);
          }

          &.warning {
            background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
          }

          &.danger {
            background: linear-gradient(135deg, #ff4757 0%, #c44569 100%);
          }
        }

        .stat-info {
          .stat-number {
            font-size: 28px;
            font-weight: 600;
            color: #303133;
            line-height: 1;
            margin-bottom: 4px;
          }

          .stat-label {
            font-size: 14px;
            color: #909399;
          }
        }
      }
    }
  }

  .header-actions {
    margin-bottom: 20px;

    .search-row {
      align-items: center;
    }

    .text-right {
      text-align: right;
    }
  }

  .model-list-card {
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  }

  .model-name-cell {
    display: flex;
    align-items: center;
    gap: 12px;

    .model-thumbnail {
      width: 60px;
      height: 45px;
      object-fit: cover;
      border-radius: 4px;
      border: 1px solid #e4e7ed;
    }

    .model-info {
      .name {
        font-weight: 500;
        color: #303133;
        margin-bottom: 4px;
      }

      .description {
        font-size: 12px;
        color: #909399;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 200px;
      }
    }
  }
}

.upload-demo {
  .el-upload-dragger {
    width: 100%;
  }
}

.el-upload__tip {
  margin-top: 10px;
  color: #909399;
  font-size: 12px;
}
</style>