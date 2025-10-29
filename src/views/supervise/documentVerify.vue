<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { UploadProps, UploadUserFile } from 'element-plus'
import {
  Upload,
  Document,
  Check,
  Close,
  Warning,
  Setting,
  Download,
  View,
  Delete,
  Edit,
  RefreshRight
} from '@element-plus/icons-vue'

// 类型定义
interface DocumentField {
  fieldName: string
  ocrValue: string
  systemValue: string
  isMatched: boolean
  diffLevel: 'none' | 'minor' | 'major'
}

interface DocumentRecord {
  id: string
  documentNo: string
  documentType: string
  uploadTime: string
  verifyTime: string
  verifyResult: 'passed' | 'warning' | 'failed' | 'pending'
  diffCount: number
  operator: string
  status: string
  fields: DocumentField[]
  imageUrl?: string
}

interface VerificationRule {
  id: string
  fieldName: string
  priority: number
  isRequired: boolean
  validationRule: string
  enabled: boolean
}

interface Statistics {
  totalDocuments: number
  passedDocuments: number
  warningDocuments: number
  failedDocuments: number
  accuracy: number
}

// 响应式数据
const loading = ref(false)
const uploadProgress = ref(0)
const isUploading = ref(false)
const fileList = ref<UploadUserFile[]>([])

// 单据记录列表
const documentRecords = ref<DocumentRecord[]>([])
const currentDocument = ref<DocumentRecord | null>(null)

// 筛选条件
const searchForm = reactive({
  documentNo: '',
  verifyResult: '',
  dateRange: [] as string[]
})

// 对话框控制
const detailDialogVisible = ref(false)
const ruleDialogVisible = ref(false)
const exceptionDialogVisible = ref(false)

// 核验规则
const verificationRules = ref<VerificationRule[]>([])
const editingRule = ref<VerificationRule | null>(null)

// 统计数据
const statistics = ref<Statistics>({
  totalDocuments: 0,
  passedDocuments: 0,
  warningDocuments: 0,
  failedDocuments: 0,
  accuracy: 0
})

// OCR识别进度
const ocrProgress = ref(0)
const ocrStatus = ref<'idle' | 'processing' | 'completed' | 'error'>('idle')

// 异常处理
const exceptionForm = reactive({
  documentId: '',
  exceptionType: '',
  description: '',
  handler: '',
  solution: ''
})

// 计算属性
const filteredDocuments = computed(() => {
  let result = documentRecords.value

  if (searchForm.documentNo) {
    result = result.filter(doc =>
      doc.documentNo.toLowerCase().includes(searchForm.documentNo.toLowerCase())
    )
  }

  if (searchForm.verifyResult) {
    result = result.filter(doc => doc.verifyResult === searchForm.verifyResult)
  }

  if (searchForm.dateRange && searchForm.dateRange.length === 2) {
    const [start, end] = searchForm.dateRange
    result = result.filter(doc => {
      const verifyTime = new Date(doc.verifyTime).getTime()
      return verifyTime >= new Date(start).getTime() && verifyTime <= new Date(end).getTime()
    })
  }

  return result
})

const verifyResultOptions = [
  { label: '全部', value: '' },
  { label: '通过', value: 'passed' },
  { label: '警告', value: 'warning' },
  { label: '不通过', value: 'failed' },
  { label: '待处理', value: 'pending' }
]

// 方法
const handleUpload: UploadProps['onChange'] = (file, files) => {
  fileList.value = files
}

const handleRemove: UploadProps['onRemove'] = (file, files) => {
  fileList.value = files
}

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isImage) {
    ElMessage.error('只能上传图片文件！')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('上传文件大小不能超过 10MB！')
    return false
  }
  return true
}

const startOCRRecognition = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请先上传单据图片！')
    return
  }

  isUploading.value = true
  ocrStatus.value = 'processing'
  ocrProgress.value = 0

  try {
    // 模拟OCR识别过程
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 300))
      ocrProgress.value = i
    }

    // 模拟识别结果
    const mockDocuments: DocumentRecord[] = fileList.value.map((file, index) => {
      const hasWarning = Math.random() > 0.6
      const hasMajorDiff = Math.random() > 0.8

      const fields: DocumentField[] = [
        {
          fieldName: '单据编号',
          ocrValue: `DOC-2025-${String(1000 + index).padStart(4, '0')}`,
          systemValue: `DOC-2025-${String(1000 + index).padStart(4, '0')}`,
          isMatched: true,
          diffLevel: 'none'
        },
        {
          fieldName: '货物名称',
          ocrValue: hasWarning ? '钢材板材' : '钢材',
          systemValue: '钢材',
          isMatched: !hasWarning,
          diffLevel: hasWarning ? 'minor' : 'none'
        },
        {
          fieldName: '数量',
          ocrValue: hasMajorDiff ? '150' : '100',
          systemValue: '100',
          isMatched: !hasMajorDiff,
          diffLevel: hasMajorDiff ? 'major' : 'none'
        },
        {
          fieldName: '日期',
          ocrValue: '2025-10-29',
          systemValue: '2025-10-29',
          isMatched: true,
          diffLevel: 'none'
        },
        {
          fieldName: '供应商',
          ocrValue: '华东钢铁集团',
          systemValue: '华东钢铁集团',
          isMatched: true,
          diffLevel: 'none'
        },
        {
          fieldName: '金额',
          ocrValue: hasMajorDiff ? '¥ 75,000' : '¥ 50,000',
          systemValue: '¥ 50,000',
          isMatched: !hasMajorDiff,
          diffLevel: hasMajorDiff ? 'major' : 'none'
        }
      ]

      const diffCount = fields.filter(f => !f.isMatched).length
      let verifyResult: DocumentRecord['verifyResult'] = 'passed'
      if (hasMajorDiff) verifyResult = 'failed'
      else if (hasWarning) verifyResult = 'warning'

      return {
        id: `doc-${Date.now()}-${index}`,
        documentNo: `DOC-2025-${String(1000 + index).padStart(4, '0')}`,
        documentType: ['入库单', '出库单', '调拨单'][Math.floor(Math.random() * 3)],
        uploadTime: new Date().toISOString(),
        verifyTime: new Date().toISOString(),
        verifyResult,
        diffCount,
        operator: '张三',
        status: diffCount > 0 ? '待复核' : '已完成',
        fields,
        imageUrl: file.url
      }
    })

    documentRecords.value = [...mockDocuments, ...documentRecords.value]
    ocrStatus.value = 'completed'
    updateStatistics()

    ElMessage.success(`成功识别 ${fileList.value.length} 份单据！`)
    fileList.value = []
  } catch (error) {
    ocrStatus.value = 'error'
    ElMessage.error('OCR识别失败，请重试！')
  } finally {
    isUploading.value = false
    setTimeout(() => {
      ocrProgress.value = 0
      ocrStatus.value = 'idle'
    }, 2000)
  }
}

const viewDocumentDetail = (row: DocumentRecord) => {
  currentDocument.value = row
  detailDialogVisible.value = true
}

const handleVerify = (row: DocumentRecord) => {
  ElMessageBox.confirm(
    '确认该单据核验结果吗？',
    '确认操作',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const index = documentRecords.value.findIndex(doc => doc.id === row.id)
    if (index !== -1) {
      documentRecords.value[index].status = '已确认'
      updateStatistics()
      ElMessage.success('操作成功！')
    }
  })
}

const handleRecheck = (row: DocumentRecord) => {
  loading.value = true
  setTimeout(() => {
    ElMessage.success('重新核验完成！')
    loading.value = false
    updateStatistics()
  }, 1500)
}

const handleException = (row: DocumentRecord) => {
  exceptionForm.documentId = row.id
  exceptionForm.exceptionType = ''
  exceptionForm.description = ''
  exceptionForm.handler = ''
  exceptionForm.solution = ''
  exceptionDialogVisible.value = true
}

const submitException = () => {
  if (!exceptionForm.exceptionType || !exceptionForm.description) {
    ElMessage.warning('请填写完整的异常信息！')
    return
  }

  const index = documentRecords.value.findIndex(doc => doc.id === exceptionForm.documentId)
  if (index !== -1) {
    documentRecords.value[index].status = '异常处理中'
  }

  ElMessage.success('异常提交成功！')
  exceptionDialogVisible.value = false
}

const deleteDocument = (row: DocumentRecord) => {
  ElMessageBox.confirm(
    '确认删除该单据记录吗？',
    '删除确认',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const index = documentRecords.value.findIndex(doc => doc.id === row.id)
    if (index !== -1) {
      documentRecords.value.splice(index, 1)
      updateStatistics()
      ElMessage.success('删除成功！')
    }
  })
}

const resetSearch = () => {
  searchForm.documentNo = ''
  searchForm.verifyResult = ''
  searchForm.dateRange = []
}

const updateStatistics = () => {
  statistics.value.totalDocuments = documentRecords.value.length
  statistics.value.passedDocuments = documentRecords.value.filter(
    doc => doc.verifyResult === 'passed'
  ).length
  statistics.value.warningDocuments = documentRecords.value.filter(
    doc => doc.verifyResult === 'warning'
  ).length
  statistics.value.failedDocuments = documentRecords.value.filter(
    doc => doc.verifyResult === 'failed'
  ).length
  statistics.value.accuracy =
    statistics.value.totalDocuments > 0
      ? Math.round(
          (statistics.value.passedDocuments / statistics.value.totalDocuments) * 100 * 100
        ) / 100
      : 0
}

const openRuleConfig = () => {
  ruleDialogVisible.value = true
}

const addRule = () => {
  editingRule.value = {
    id: `rule-${Date.now()}`,
    fieldName: '',
    priority: 1,
    isRequired: true,
    validationRule: '',
    enabled: true
  }
}

const editRule = (rule: VerificationRule) => {
  editingRule.value = { ...rule }
}

const saveRule = () => {
  if (!editingRule.value) return

  if (!editingRule.value.fieldName || !editingRule.value.validationRule) {
    ElMessage.warning('请填写完整的规则信息！')
    return
  }

  const index = verificationRules.value.findIndex(r => r.id === editingRule.value!.id)
  if (index !== -1) {
    verificationRules.value[index] = { ...editingRule.value }
    ElMessage.success('规则更新成功！')
  } else {
    verificationRules.value.push({ ...editingRule.value })
    ElMessage.success('规则添加成功！')
  }

  editingRule.value = null
}

const deleteRule = (rule: VerificationRule) => {
  ElMessageBox.confirm(
    '确认删除该核验规则吗？',
    '删除确认',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const index = verificationRules.value.findIndex(r => r.id === rule.id)
    if (index !== -1) {
      verificationRules.value.splice(index, 1)
      ElMessage.success('删除成功！')
    }
  })
}

const toggleRuleStatus = (rule: VerificationRule) => {
  rule.enabled = !rule.enabled
  ElMessage.success(`规则已${rule.enabled ? '启用' : '禁用'}！`)
}

const exportData = () => {
  ElMessage.success('导出功能开发中...')
}

const getVerifyResultType = (result: string) => {
  const typeMap: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    passed: 'success',
    warning: 'warning',
    failed: 'danger',
    pending: 'info'
  }
  return typeMap[result] || 'info'
}

const getVerifyResultText = (result: string) => {
  const textMap: Record<string, string> = {
    passed: '通过',
    warning: '警告',
    failed: '不通过',
    pending: '待处理'
  }
  return textMap[result] || result
}

const getDiffLevelType = (level: string) => {
  const typeMap: Record<string, 'success' | 'warning' | 'danger'> = {
    none: 'success',
    minor: 'warning',
    major: 'danger'
  }
  return typeMap[level] || 'info'
}

const getDiffLevelText = (level: string) => {
  const textMap: Record<string, string> = {
    none: '无差异',
    minor: '轻微差异',
    major: '重大差异'
  }
  return textMap[level] || level
}

// 初始化数据
const initData = () => {
  loading.value = true

  // 模拟加载核验规则
  setTimeout(() => {
    verificationRules.value = [
      {
        id: 'rule-1',
        fieldName: '单据编号',
        priority: 1,
        isRequired: true,
        validationRule: '必须以DOC开头，包含年份和序号',
        enabled: true
      },
      {
        id: 'rule-2',
        fieldName: '货物名称',
        priority: 2,
        isRequired: true,
        validationRule: '必须与系统库存名称完全匹配',
        enabled: true
      },
      {
        id: 'rule-3',
        fieldName: '数量',
        priority: 1,
        isRequired: true,
        validationRule: '必须为正整数，与系统数量一致',
        enabled: true
      },
      {
        id: 'rule-4',
        fieldName: '金额',
        priority: 1,
        isRequired: true,
        validationRule: '金额格式正确，误差不超过1%',
        enabled: true
      },
      {
        id: 'rule-5',
        fieldName: '日期',
        priority: 2,
        isRequired: true,
        validationRule: '日期格式为YYYY-MM-DD',
        enabled: true
      }
    ]

    // 模拟加载历史记录
    const mockHistoryRecords: DocumentRecord[] = [
      {
        id: 'doc-history-1',
        documentNo: 'DOC-2025-0998',
        documentType: '入库单',
        uploadTime: '2025-10-28 14:30:00',
        verifyTime: '2025-10-28 14:31:25',
        verifyResult: 'passed',
        diffCount: 0,
        operator: '李四',
        status: '已完成',
        fields: [
          {
            fieldName: '单据编号',
            ocrValue: 'DOC-2025-0998',
            systemValue: 'DOC-2025-0998',
            isMatched: true,
            diffLevel: 'none'
          },
          {
            fieldName: '货物名称',
            ocrValue: '水泥',
            systemValue: '水泥',
            isMatched: true,
            diffLevel: 'none'
          },
          {
            fieldName: '数量',
            ocrValue: '200',
            systemValue: '200',
            isMatched: true,
            diffLevel: 'none'
          }
        ]
      },
      {
        id: 'doc-history-2',
        documentNo: 'DOC-2025-0997',
        documentType: '出库单',
        uploadTime: '2025-10-28 10:15:00',
        verifyTime: '2025-10-28 10:16:30',
        verifyResult: 'warning',
        diffCount: 1,
        operator: '王五',
        status: '已复核',
        fields: [
          {
            fieldName: '单据编号',
            ocrValue: 'DOC-2025-0997',
            systemValue: 'DOC-2025-0997',
            isMatched: true,
            diffLevel: 'none'
          },
          {
            fieldName: '货物名称',
            ocrValue: '钢筋混凝土',
            systemValue: '钢筋',
            isMatched: false,
            diffLevel: 'minor'
          },
          {
            fieldName: '数量',
            ocrValue: '80',
            systemValue: '80',
            isMatched: true,
            diffLevel: 'none'
          }
        ]
      },
      {
        id: 'doc-history-3',
        documentNo: 'DOC-2025-0996',
        documentType: '调拨单',
        uploadTime: '2025-10-27 16:20:00',
        verifyTime: '2025-10-27 16:22:10',
        verifyResult: 'failed',
        diffCount: 2,
        operator: '张三',
        status: '异常处理中',
        fields: [
          {
            fieldName: '单据编号',
            ocrValue: 'DOC-2025-0996',
            systemValue: 'DOC-2025-0996',
            isMatched: true,
            diffLevel: 'none'
          },
          {
            fieldName: '货物名称',
            ocrValue: '建材',
            systemValue: '建材',
            isMatched: true,
            diffLevel: 'none'
          },
          {
            fieldName: '数量',
            ocrValue: '300',
            systemValue: '150',
            isMatched: false,
            diffLevel: 'major'
          },
          {
            fieldName: '金额',
            ocrValue: '¥ 90,000',
            systemValue: '¥ 45,000',
            isMatched: false,
            diffLevel: 'major'
          }
        ]
      }
    ]

    documentRecords.value = mockHistoryRecords
    updateStatistics()
    loading.value = false
  }, 1000)
}

onMounted(() => {
  initData()
})
</script>

<template>
  <div class="document-verify-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>单据核对验证</h2>
      <p class="page-description">通过OCR识别技术和图像比对算法，自动核验出入库单据的准确性和真实性</p>
    </div>

    <!-- 主要内容区域 -->
    <el-row :gutter="20" class="main-content">
      <!-- 左侧：单据上传识别区 -->
      <el-col :span="8">
        <el-card class="upload-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><Upload /></el-icon>
              <span>单据上传识别</span>
            </div>
          </template>

          <div class="upload-section">
            <el-upload
              v-model:file-list="fileList"
              class="upload-area"
              drag
              multiple
              accept="image/*"
              :auto-upload="false"
              :on-change="handleUpload"
              :on-remove="handleRemove"
              :before-upload="beforeUpload"
            >
              <el-icon class="el-icon--upload"><Upload /></el-icon>
              <div class="el-upload__text">
                拖拽文件到此处或 <em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  支持 jpg/png 格式，单个文件不超过 10MB，支持批量上传
                </div>
              </template>
            </el-upload>

            <el-button
              type="primary"
              :loading="isUploading"
              :disabled="fileList.length === 0"
              class="start-btn"
              @click="startOCRRecognition"
            >
              <el-icon><Document /></el-icon>
              开始识别
            </el-button>

            <!-- OCR识别进度 -->
            <div v-if="isUploading || ocrStatus === 'completed'" class="ocr-progress">
              <div class="progress-header">
                <span>OCR识别进度</span>
                <el-tag
                  :type="ocrStatus === 'completed' ? 'success' : 'primary'"
                  size="small"
                >
                  {{ ocrStatus === 'completed' ? '已完成' : '识别中...' }}
                </el-tag>
              </div>
              <el-progress
                :percentage="ocrProgress"
                :status="ocrStatus === 'completed' ? 'success' : undefined"
                :stroke-width="10"
              />
            </div>
          </div>
        </el-card>

        <!-- 统计信息卡片 -->
        <el-card class="statistics-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><Document /></el-icon>
              <span>验证统计</span>
            </div>
          </template>

          <div class="statistics-content">
            <div class="stat-item">
              <div class="stat-label">总单据数</div>
              <div class="stat-value primary">{{ statistics.totalDocuments }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">通过</div>
              <div class="stat-value success">{{ statistics.passedDocuments }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">警告</div>
              <div class="stat-value warning">{{ statistics.warningDocuments }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">不通过</div>
              <div class="stat-value danger">{{ statistics.failedDocuments }}</div>
            </div>
            <div class="stat-item full-width">
              <div class="stat-label">准确率</div>
              <div class="stat-value-large">{{ statistics.accuracy }}%</div>
              <el-progress
                :percentage="statistics.accuracy"
                :stroke-width="8"
                :show-text="false"
              />
            </div>
          </div>
        </el-card>

        <!-- 快捷操作 -->
        <el-card class="action-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><Setting /></el-icon>
              <span>快捷操作</span>
            </div>
          </template>

          <div class="action-buttons">
            <el-button type="primary" plain @click="openRuleConfig">
              <el-icon><Setting /></el-icon>
              核验规则配置
            </el-button>
            <el-button type="success" plain @click="exportData">
              <el-icon><Download /></el-icon>
              导出验证报告
            </el-button>
          </div>
        </el-card>
      </el-col>

      <!-- 中间和右侧：验证结果展示 -->
      <el-col :span="16">
        <el-card class="result-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <div>
                <el-icon><Document /></el-icon>
                <span>单据验证记录</span>
              </div>
            </div>
          </template>

          <!-- 搜索筛选区 -->
          <div class="search-section">
            <el-form :model="searchForm" inline>
              <el-form-item label="单据编号">
                <el-input
                  v-model="searchForm.documentNo"
                  placeholder="请输入单据编号"
                  clearable
                  style="width: 200px"
                />
              </el-form-item>
              <el-form-item label="验证结果">
                <el-select
                  v-model="searchForm.verifyResult"
                  placeholder="请选择验证结果"
                  clearable
                  style="width: 150px"
                >
                  <el-option
                    v-for="item in verifyResultOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="验证时间">
                <el-date-picker
                  v-model="searchForm.dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  style="width: 240px"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="updateStatistics">搜索</el-button>
                <el-button @click="resetSearch">重置</el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 数据表格 -->
          <el-table
            v-loading="loading"
            :data="filteredDocuments"
            stripe
            border
            style="width: 100%"
            class="result-table"
          >
            <el-table-column prop="documentNo" label="单据编号" width="150" fixed />
            <el-table-column prop="documentType" label="单据类型" width="100" />
            <el-table-column prop="verifyTime" label="验证时间" width="160">
              <template #default="{ row }">
                {{ new Date(row.verifyTime).toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column label="验证结果" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getVerifyResultType(row.verifyResult)">
                  {{ getVerifyResultText(row.verifyResult) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="差异数量" width="100" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.diffCount > 0" type="danger" effect="plain">
                  {{ row.diffCount }}
                </el-tag>
                <el-tag v-else type="success" effect="plain">0</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="operator" label="操作人员" width="100" />
            <el-table-column label="状态" width="120" align="center">
              <template #default="{ row }">
                <el-tag
                  :type="
                    row.status === '已完成' ? 'success' :
                    row.status === '待复核' ? 'warning' :
                    row.status === '异常处理中' ? 'danger' : 'info'
                  "
                  effect="plain"
                >
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="260" fixed="right">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  size="small"
                  link
                  :icon="View"
                  @click="viewDocumentDetail(row)"
                >
                  查看详情
                </el-button>
                <el-button
                  v-if="row.diffCount > 0"
                  type="success"
                  size="small"
                  link
                  :icon="Check"
                  @click="handleVerify(row)"
                >
                  确认
                </el-button>
                <el-button
                  type="warning"
                  size="small"
                  link
                  :icon="RefreshRight"
                  @click="handleRecheck(row)"
                >
                  重验
                </el-button>
                <el-button
                  v-if="row.verifyResult === 'failed'"
                  type="danger"
                  size="small"
                  link
                  :icon="Warning"
                  @click="handleException(row)"
                >
                  异常
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  link
                  :icon="Delete"
                  @click="deleteDocument(row)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 单据详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="单据核验详情"
      width="800px"
      :close-on-click-modal="false"
    >
      <div v-if="currentDocument" class="detail-content">
        <!-- 基本信息 -->
        <el-descriptions title="基本信息" :column="2" border>
          <el-descriptions-item label="单据编号">
            {{ currentDocument.documentNo }}
          </el-descriptions-item>
          <el-descriptions-item label="单据类型">
            {{ currentDocument.documentType }}
          </el-descriptions-item>
          <el-descriptions-item label="上传时间">
            {{ new Date(currentDocument.uploadTime).toLocaleString() }}
          </el-descriptions-item>
          <el-descriptions-item label="验证时间">
            {{ new Date(currentDocument.verifyTime).toLocaleString() }}
          </el-descriptions-item>
          <el-descriptions-item label="验证结果">
            <el-tag :type="getVerifyResultType(currentDocument.verifyResult)">
              {{ getVerifyResultText(currentDocument.verifyResult) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="差异数量">
            <el-tag
              :type="currentDocument.diffCount > 0 ? 'danger' : 'success'"
              effect="plain"
            >
              {{ currentDocument.diffCount }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="操作人员">
            {{ currentDocument.operator }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag
              :type="
                currentDocument.status === '已完成' ? 'success' :
                currentDocument.status === '待复核' ? 'warning' : 'danger'
              "
              effect="plain"
            >
              {{ currentDocument.status }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 字段对比详情 -->
        <div class="field-comparison">
          <h4>字段核验对比</h4>
          <el-alert
            v-if="currentDocument.diffCount > 0"
            type="warning"
            :closable="false"
            show-icon
          >
            <template #title>
              检测到 <strong>{{ currentDocument.diffCount }}</strong> 个字段存在差异，请仔细核对
            </template>
          </el-alert>
          <el-alert
            v-else
            type="success"
            :closable="false"
            show-icon
            title="所有字段验证通过，单据信息完全一致"
          />

          <el-table :data="currentDocument.fields" border style="margin-top: 15px">
            <el-table-column prop="fieldName" label="字段名称" width="120" />
            <el-table-column prop="ocrValue" label="OCR识别值" width="180">
              <template #default="{ row }">
                <span :class="{ 'diff-value': !row.isMatched }">
                  {{ row.ocrValue }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="systemValue" label="系统值" width="180">
              <template #default="{ row }">
                <span :class="{ 'diff-value': !row.isMatched }">
                  {{ row.systemValue }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="是否匹配" width="100" align="center">
              <template #default="{ row }">
                <el-icon v-if="row.isMatched" color="green" :size="20">
                  <Check />
                </el-icon>
                <el-icon v-else color="red" :size="20">
                  <Close />
                </el-icon>
              </template>
            </el-table-column>
            <el-table-column label="差异级别" width="120" align="center">
              <template #default="{ row }">
                <el-tag :type="getDiffLevelType(row.diffLevel)" effect="plain">
                  {{ getDiffLevelText(row.diffLevel) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button
          v-if="currentDocument && currentDocument.diffCount > 0"
          type="primary"
          @click="handleVerify(currentDocument)"
        >
          确认核验结果
        </el-button>
      </template>
    </el-dialog>

    <!-- 核验规则配置对话框 -->
    <el-dialog
      v-model="ruleDialogVisible"
      title="核验规则配置"
      width="900px"
      :close-on-click-modal="false"
    >
      <div class="rule-config-content">
        <div class="rule-actions">
          <el-button type="primary" :icon="Setting" @click="addRule">
            添加规则
          </el-button>
        </div>

        <el-table :data="verificationRules" border style="margin-top: 15px">
          <el-table-column prop="fieldName" label="字段名称" width="120" />
          <el-table-column label="优先级" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.priority === 1 ? 'danger' : 'warning'">
                P{{ row.priority }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="是否必填" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.isRequired ? 'danger' : 'info'" effect="plain">
                {{ row.isRequired ? '必填' : '可选' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="validationRule" label="验证规则" min-width="250" />
          <el-table-column label="状态" width="80" align="center">
            <template #default="{ row }">
              <el-switch
                v-model="row.enabled"
                @change="toggleRuleStatus(row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="center">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                link
                :icon="Edit"
                @click="editRule(row)"
              >
                编辑
              </el-button>
              <el-button
                type="danger"
                size="small"
                link
                :icon="Delete"
                @click="deleteRule(row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 编辑规则表单 -->
        <el-dialog
          v-model="editingRule"
          :title="editingRule?.fieldName ? '编辑规则' : '添加规则'"
          width="600px"
          append-to-body
        >
          <el-form v-if="editingRule" label-width="100px">
            <el-form-item label="字段名称">
              <el-input v-model="editingRule.fieldName" placeholder="请输入字段名称" />
            </el-form-item>
            <el-form-item label="优先级">
              <el-radio-group v-model="editingRule.priority">
                <el-radio :value="1">P1 (高)</el-radio>
                <el-radio :value="2">P2 (中)</el-radio>
                <el-radio :value="3">P3 (低)</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="是否必填">
              <el-switch v-model="editingRule.isRequired" />
            </el-form-item>
            <el-form-item label="验证规则">
              <el-input
                v-model="editingRule.validationRule"
                type="textarea"
                :rows="3"
                placeholder="请输入验证规则描述"
              />
            </el-form-item>
            <el-form-item label="启用状态">
              <el-switch v-model="editingRule.enabled" />
            </el-form-item>
          </el-form>

          <template #footer>
            <el-button @click="editingRule = null">取消</el-button>
            <el-button type="primary" @click="saveRule">保存</el-button>
          </template>
        </el-dialog>
      </div>

      <template #footer>
        <el-button @click="ruleDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 异常处理对话框 -->
    <el-dialog
      v-model="exceptionDialogVisible"
      title="异常处理"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="exceptionForm" label-width="100px">
        <el-form-item label="异常类型">
          <el-select
            v-model="exceptionForm.exceptionType"
            placeholder="请选择异常类型"
            style="width: 100%"
          >
            <el-option label="数据不一致" value="data_mismatch" />
            <el-option label="单据缺失" value="document_missing" />
            <el-option label="信息模糊" value="info_blur" />
            <el-option label="格式错误" value="format_error" />
            <el-option label="其他异常" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="异常描述">
          <el-input
            v-model="exceptionForm.description"
            type="textarea"
            :rows="4"
            placeholder="请详细描述异常情况"
          />
        </el-form-item>
        <el-form-item label="处理人">
          <el-input v-model="exceptionForm.handler" placeholder="请输入处理人姓名" />
        </el-form-item>
        <el-form-item label="处理方案">
          <el-input
            v-model="exceptionForm.solution"
            type="textarea"
            :rows="3"
            placeholder="请输入处理方案"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="exceptionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitException">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.document-verify-container {

  .page-header {
    margin-bottom: 20px;
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

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
  }

  .main-content {
    .el-card {
      margin-bottom: 20px;
      border-radius: 8px;

      :deep(.el-card__header) {
        padding: 16px 20px;
        background-color: #fafafa;
      }
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      font-size: 16px;

      .el-icon {
        font-size: 18px;
        color: #409eff;
      }
    }
  }

  // 上传卡片
  .upload-card {
    .upload-section {
      .upload-area {
        margin-bottom: 20px;

        :deep(.el-upload-dragger) {
          padding: 40px 20px;
        }

        .el-icon--upload {
          font-size: 67px;
          color: #409eff;
          margin-bottom: 16px;
        }

        .el-upload__text {
          font-size: 14px;
          color: #606266;

          em {
            color: #409eff;
            font-style: normal;
          }
        }

        .el-upload__tip {
          margin-top: 10px;
          font-size: 12px;
          color: #909399;
        }
      }

      .start-btn {
        width: 100%;
        height: 40px;
        font-size: 16px;
      }

      .ocr-progress {
        margin-top: 20px;
        padding: 15px;
        background-color: #f5f7fa;
        border-radius: 6px;

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          font-weight: 500;
        }
      }
    }
  }

  // 统计卡片
  .statistics-card {
    .statistics-content {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;

      .stat-item {
        text-align: center;
        padding: 15px;
        background-color: #f5f7fa;
        border-radius: 6px;
        transition: all 0.3s;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        &.full-width {
          grid-column: 1 / -1;
        }

        .stat-label {
          font-size: 14px;
          color: #909399;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 600;

          &.primary {
            color: #409eff;
          }
          &.success {
            color: #67c23a;
          }
          &.warning {
            color: #e6a23c;
          }
          &.danger {
            color: #f56c6c;
          }
        }

        .stat-value-large {
          font-size: 32px;
          font-weight: 700;
          color: #409eff;
          margin-bottom: 10px;
        }
      }
    }
  }

  // 操作卡片
  .action-card {
    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .el-button {
        width: 100%;
        height: 40px;
        font-size: 14px;
      }
    }
  }

  // 结果卡片
  .result-card {
    .search-section {
      margin-bottom: 20px;
      padding: 15px;
      background-color: #f5f7fa;
      border-radius: 6px;

      .el-form {
        margin-bottom: 0;
      }
    }

    .result-table {
      :deep(.el-table__header) {
        th {
          background-color: #fafafa;
          color: #303133;
          font-weight: 600;
        }
      }
    }
  }

  // 详情对话框
  .detail-content {
    .field-comparison {
      margin-top: 25px;

      h4 {
        margin: 0 0 15px 0;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }

      .el-alert {
        margin-bottom: 15px;
      }

      .diff-value {
        color: #f56c6c;
        font-weight: 600;
        background-color: #fef0f0;
        padding: 2px 6px;
        border-radius: 3px;
      }
    }
  }

  // 规则配置
  .rule-config-content {
    .rule-actions {
      display: flex;
      justify-content: flex-start;
      margin-bottom: 15px;
    }
  }
}
</style>