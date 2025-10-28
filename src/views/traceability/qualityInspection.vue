<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, Download, View, Edit, Delete, Document, Printer, Warning, SuccessFilled } from '@element-plus/icons-vue'

// 检测结果枚举
enum TestResult {
  QUALIFIED = 'qualified',
  UNQUALIFIED = 'unqualified',
  PENDING = 'pending',
  TESTING = 'testing'
}

// 检测环节枚举
enum TestStage {
  PLANTING = 'planting',
  HARVEST = 'harvest',
  PROCESSING = 'processing',
  PACKAGING = 'packaging',
  STORAGE = 'storage'
}

// 认证状态枚举
enum CertStatus {
  VALID = 'valid',
  EXPIRING_SOON = 'expiring_soon',
  EXPIRED = 'expired'
}

// 检测记录接口
interface InspectionRecord {
  id: string
  testNo: string
  batchNo: string
  productName: string
  testStage: TestStage
  testProject: string
  testResult: TestResult
  testDate: string
  tester: string
  reviewer?: string
  reviewDate?: string
  updateTime: string
}

// 检测项目
interface TestProject {
  id: string
  name: string
  category: string
  standardRange: string
  testMethod: string
  equipment: string
  required: boolean
}

// 检测指标
interface TestIndicator {
  id: string
  name: string
  value: number
  unit: string
  standardMin: number
  standardMax: number
  qualified: boolean
}

// 检测样品
interface TestSample {
  sampleNo: string
  sampleName: string
  sampleQuantity: string
  samplingDate: string
  samplingLocation: string
  samplingPerson: string
}

// 检测环境
interface TestEnvironment {
  temperature: number
  humidity: number
  pressure: number
  recordTime: string
}

// 不合格处理
interface UnqualifiedHandle {
  handleMethod: string
  handlePerson: string
  handleDate: string
  handleNote: string
  status: string
}

// 认证证书
interface Certificate {
  id: string
  certNo: string
  certName: string
  certType: string
  issueOrg: string
  issueDate: string
  expiryDate: string
  status: CertStatus
  fileUrl?: string
}

// 检测详情
interface InspectionDetail {
  record: InspectionRecord
  sample: TestSample
  environment: TestEnvironment
  indicators: TestIndicator[]
  unqualifiedHandle?: UnqualifiedHandle
  images: string[]
  reportUrl?: string
}

// 查询表单
const queryForm = reactive({
  testNo: '',
  batchNo: '',
  testResult: '',
  testStage: '',
  keyword: ''
})

// 数据状态
const loading = ref(false)
const tableData = ref<InspectionRecord[]>([])
const certificateData = ref<Certificate[]>([])

// 详情弹窗
const detailDialogVisible = ref(false)
const currentDetail = ref<InspectionDetail | null>(null)

// 检测项目管理弹窗
const projectDialogVisible = ref(false)
const testProjects = ref<TestProject[]>([])

// 认证证书管理弹窗
const certDialogVisible = ref(false)

// 检测结果配置
const resultConfig = {
  [TestResult.QUALIFIED]: { label: '合格', type: 'success', color: '#67c23a' },
  [TestResult.UNQUALIFIED]: { label: '不合格', type: 'danger', color: '#f56c6c' },
  [TestResult.PENDING]: { label: '待检测', type: 'info', color: '#909399' },
  [TestResult.TESTING]: { label: '检测中', type: 'primary', color: '#409eff' }
}

// 检测环节配置
const stageConfig = {
  [TestStage.PLANTING]: { label: '种植环节', icon: '🌱' },
  [TestStage.HARVEST]: { label: '采收环节', icon: '🌾' },
  [TestStage.PROCESSING]: { label: '加工环节', icon: '⚙️' },
  [TestStage.PACKAGING]: { label: '包装环节', icon: '📦' },
  [TestStage.STORAGE]: { label: '仓储环节', icon: '🏭' }
}

// 认证状态配置
const certStatusConfig = {
  [CertStatus.VALID]: { label: '有效', type: 'success', color: '#67c23a' },
  [CertStatus.EXPIRING_SOON]: { label: '即将到期', type: 'warning', color: '#e6a23c' },
  [CertStatus.EXPIRED]: { label: '已过期', type: 'danger', color: '#f56c6c' }
}

// 检测结果选项
const resultOptions = [
  { label: '全部', value: '' },
  { label: '合格', value: TestResult.QUALIFIED },
  { label: '不合格', value: TestResult.UNQUALIFIED },
  { label: '待检测', value: TestResult.PENDING },
  { label: '检测中', value: TestResult.TESTING }
]

// 检测环节选项
const stageOptions = [
  { label: '全部', value: '' },
  { label: '种植环节', value: TestStage.PLANTING },
  { label: '采收环节', value: TestStage.HARVEST },
  { label: '加工环节', value: TestStage.PROCESSING },
  { label: '包装环节', value: TestStage.PACKAGING },
  { label: '仓储环节', value: TestStage.STORAGE }
]

// Mock 数据生成 - 检测记录
const generateMockRecords = (): InspectionRecord[] => {
  const products = ['有机苹果', '绿色蔬菜', '生态水果', '有机茶叶', '优质小麦']
  const testProjects = ['农药残留检测', '重金属检测', '营养成分检测', '微生物检测', '添加剂检测']
  const stages = [TestStage.PLANTING, TestStage.HARVEST, TestStage.PROCESSING, TestStage.PACKAGING, TestStage.STORAGE]
  const results = [TestResult.QUALIFIED, TestResult.QUALIFIED, TestResult.QUALIFIED, TestResult.UNQUALIFIED, TestResult.TESTING, TestResult.PENDING]
  
  return Array.from({ length: 30 }, (_, index) => {
    const testDate = new Date(2025, 0, Math.floor(Math.random() * 28) + 1)
    const result = results[Math.floor(Math.random() * results.length)]
    
    return {
      id: `test_${index + 1}`,
      testNo: `QT${new Date().getFullYear()}${String(index + 1).padStart(6, '0')}`,
      batchNo: `AP${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000)).padStart(6, '0')}`,
      productName: products[Math.floor(Math.random() * products.length)],
      testStage: stages[Math.floor(Math.random() * stages.length)],
      testProject: testProjects[Math.floor(Math.random() * testProjects.length)],
      testResult: result,
      testDate: testDate.toISOString().split('T')[0],
      tester: ['张三', '李四', '王五', '赵六'][Math.floor(Math.random() * 4)],
      reviewer: result === TestResult.QUALIFIED || result === TestResult.UNQUALIFIED ? '审核员A' : undefined,
      reviewDate: result === TestResult.QUALIFIED || result === TestResult.UNQUALIFIED ? testDate.toISOString().split('T')[0] : undefined,
      updateTime: new Date().toISOString()
    }
  })
}

// Mock 数据生成 - 检测项目
const generateMockProjects = (): TestProject[] => {
  return [
    {
      id: 'proj_1',
      name: '农药残留检测',
      category: '安全指标',
      standardRange: '≤0.5mg/kg',
      testMethod: '气相色谱法',
      equipment: 'GC-MS 6890',
      required: true
    },
    {
      id: 'proj_2',
      name: '重金属检测',
      category: '安全指标',
      standardRange: '铅≤0.2mg/kg, 汞≤0.05mg/kg',
      testMethod: '原子吸收光谱法',
      equipment: 'AA-7000',
      required: true
    },
    {
      id: 'proj_3',
      name: '营养成分检测',
      category: '品质指标',
      standardRange: '蛋白质≥8%, 维生素C≥20mg/100g',
      testMethod: '化学分析法',
      equipment: '自动分析仪',
      required: false
    },
    {
      id: 'proj_4',
      name: '微生物检测',
      category: '安全指标',
      standardRange: '菌落总数≤1000cfu/g',
      testMethod: '平板计数法',
      equipment: '生物培养箱',
      required: true
    },
    {
      id: 'proj_5',
      name: '食品添加剂',
      category: '安全指标',
      standardRange: '按GB 2760标准',
      testMethod: '高效液相色谱法',
      equipment: 'HPLC-1260',
      required: true
    }
  ]
}

// Mock 数据生成 - 认证证书
const generateMockCertificates = (): Certificate[] => {
  const certTypes = ['有机产品认证', '绿色食品认证', 'ISO22000认证', 'HACCP认证', 'GAP认证']
  const orgs = ['中国质量认证中心', '中绿华夏有机食品认证中心', '方圆标志认证集团', '华测检测认证集团', 'SGS通标标准技术服务']
  
  return Array.from({ length: 8 }, (_, index) => {
    const issueDate = new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
    const expiryDate = new Date(issueDate.getFullYear() + 3, issueDate.getMonth(), issueDate.getDate())
    const today = new Date()
    const daysToExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    let status: CertStatus
    if (daysToExpiry < 0) {
      status = CertStatus.EXPIRED
    } else if (daysToExpiry < 90) {
      status = CertStatus.EXPIRING_SOON
    } else {
      status = CertStatus.VALID
    }
    
    return {
      id: `cert_${index + 1}`,
      certNo: `CERT${new Date().getFullYear()}${String(index + 1).padStart(6, '0')}`,
      certName: certTypes[Math.floor(Math.random() * certTypes.length)],
      certType: ['产品认证', '体系认证', '管理体系认证'][Math.floor(Math.random() * 3)],
      issueOrg: orgs[Math.floor(Math.random() * orgs.length)],
      issueDate: issueDate.toISOString().split('T')[0],
      expiryDate: expiryDate.toISOString().split('T')[0],
      status,
      fileUrl: 'https://example.com/certificate.pdf'
    }
  })
}

// 生成检测详情
const generateInspectionDetail = (record: InspectionRecord): InspectionDetail => {
  const indicators: TestIndicator[] = []
  
  // 根据检测项目生成指标
  if (record.testProject === '农药残留检测') {
    indicators.push(
      { id: 'ind_1', name: '有机磷类', value: 0.15, unit: 'mg/kg', standardMin: 0, standardMax: 0.5, qualified: true },
      { id: 'ind_2', name: '拟除虫菊酯类', value: 0.08, unit: 'mg/kg', standardMin: 0, standardMax: 0.2, qualified: true },
      { id: 'ind_3', name: '氨基甲酸酯类', value: 0.03, unit: 'mg/kg', standardMin: 0, standardMax: 0.1, qualified: true }
    )
  } else if (record.testProject === '重金属检测') {
    const isQualified = record.testResult === TestResult.QUALIFIED
    indicators.push(
      { id: 'ind_1', name: '铅(Pb)', value: isQualified ? 0.12 : 0.25, unit: 'mg/kg', standardMin: 0, standardMax: 0.2, qualified: isQualified },
      { id: 'ind_2', name: '汞(Hg)', value: 0.02, unit: 'mg/kg', standardMin: 0, standardMax: 0.05, qualified: true },
      { id: 'ind_3', name: '镉(Cd)', value: 0.05, unit: 'mg/kg', standardMin: 0, standardMax: 0.1, qualified: true },
      { id: 'ind_4', name: '砷(As)', value: 0.08, unit: 'mg/kg', standardMin: 0, standardMax: 0.5, qualified: true }
    )
  } else if (record.testProject === '营养成分检测') {
    indicators.push(
      { id: 'ind_1', name: '蛋白质', value: 12.5, unit: '%', standardMin: 8, standardMax: 100, qualified: true },
      { id: 'ind_2', name: '维生素C', value: 35.6, unit: 'mg/100g', standardMin: 20, standardMax: 100, qualified: true },
      { id: 'ind_3', name: '膳食纤维', value: 8.2, unit: '%', standardMin: 5, standardMax: 100, qualified: true }
    )
  } else if (record.testProject === '微生物检测') {
    indicators.push(
      { id: 'ind_1', name: '菌落总数', value: 650, unit: 'cfu/g', standardMin: 0, standardMax: 1000, qualified: true },
      { id: 'ind_2', name: '大肠菌群', value: 15, unit: 'MPN/100g', standardMin: 0, standardMax: 30, qualified: true },
      { id: 'ind_3', name: '霉菌', value: 45, unit: 'cfu/g', standardMin: 0, standardMax: 50, qualified: true }
    )
  } else {
    indicators.push(
      { id: 'ind_1', name: '检测指标1', value: 0.85, unit: 'mg/kg', standardMin: 0, standardMax: 1.0, qualified: true },
      { id: 'ind_2', name: '检测指标2', value: 1.25, unit: 'mg/kg', standardMin: 0, standardMax: 2.0, qualified: true }
    )
  }
  
  let unqualifiedHandle: UnqualifiedHandle | undefined
  if (record.testResult === TestResult.UNQUALIFIED) {
    unqualifiedHandle = {
      handleMethod: '产品召回并销毁',
      handlePerson: '质量经理',
      handleDate: record.testDate,
      handleNote: '该批次产品重金属超标，已按规定进行封存和销毁处理，同时追溯原因并整改',
      status: '已处理'
    }
  }
  
  return {
    record,
    sample: {
      sampleNo: `SP${record.testNo.substring(2)}`,
      sampleName: record.productName,
      sampleQuantity: '500g',
      samplingDate: record.testDate,
      samplingLocation: '生产基地A区',
      samplingPerson: '采样员A'
    },
    environment: {
      temperature: 22.5 + Math.random() * 2,
      humidity: 45 + Math.random() * 10,
      pressure: 101.3 + Math.random() * 0.5,
      recordTime: `${record.testDate} 09:30:00`
    },
    indicators,
    unqualifiedHandle,
    images: [
      'https://via.placeholder.com/400x300?text=样品图1',
      'https://via.placeholder.com/400x300?text=检测过程1',
      'https://via.placeholder.com/400x300?text=检测结果1'
    ],
    reportUrl: 'https://example.com/report.pdf'
  }
}

// 加载数据
const loadData = () => {
  loading.value = true
  setTimeout(() => {
    tableData.value = generateMockRecords()
    loading.value = false
    ElMessage.success('数据加载成功')
  }, 800)
}

// 加载检测项目
const loadTestProjects = () => {
  testProjects.value = generateMockProjects()
}

// 加载认证证书
const loadCertificates = () => {
  certificateData.value = generateMockCertificates()
}

// 筛选后的数据
const filteredData = computed(() => {
  return tableData.value.filter(item => {
    const matchTestNo = !queryForm.testNo || item.testNo.includes(queryForm.testNo)
    const matchBatchNo = !queryForm.batchNo || item.batchNo.includes(queryForm.batchNo)
    const matchResult = !queryForm.testResult || item.testResult === queryForm.testResult
    const matchStage = !queryForm.testStage || item.testStage === queryForm.testStage
    const matchKeyword = !queryForm.keyword || 
      item.productName.includes(queryForm.keyword) ||
      item.testProject.includes(queryForm.keyword) ||
      item.tester.includes(queryForm.keyword)
    
    return matchTestNo && matchBatchNo && matchResult && matchStage && matchKeyword
  })
})

// 统计数据
const statistics = computed(() => {
  const total = filteredData.value.length
  const qualified = filteredData.value.filter(item => item.testResult === TestResult.QUALIFIED).length
  const unqualified = filteredData.value.filter(item => item.testResult === TestResult.UNQUALIFIED).length
  const pending = filteredData.value.filter(item => item.testResult === TestResult.PENDING).length
  const testing = filteredData.value.filter(item => item.testResult === TestResult.TESTING).length
  const qualifiedRate = total > 0 ? ((qualified / total) * 100).toFixed(2) : '0.00'
  
  return {
    total,
    qualified,
    unqualified,
    pending,
    testing,
    qualifiedRate
  }
})

// 查询
const handleQuery = () => {
  ElMessage.info('查询中...')
}

// 重置
const handleReset = () => {
  queryForm.testNo = ''
  queryForm.batchNo = ''
  queryForm.testResult = ''
  queryForm.testStage = ''
  queryForm.keyword = ''
  ElMessage.info('已重置查询条件')
}

// 查看详情
const viewDetail = (record: InspectionRecord) => {
  loading.value = true
  setTimeout(() => {
    currentDetail.value = generateInspectionDetail(record)
    detailDialogVisible.value = true
    loading.value = false
  }, 500)
}

// 新增检测记录
const handleAdd = () => {
  ElMessage.info('新增检测记录功能')
}

// 编辑检测记录
const handleEdit = (record: InspectionRecord) => {
  ElMessage.info(`编辑检测记录: ${record.testNo}`)
}

// 删除检测记录
const handleDelete = async (record: InspectionRecord) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除检测记录 ${record.testNo} 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    loading.value = true
    await new Promise(resolve => setTimeout(resolve, 500))
    ElMessage.success('删除成功')
    loadData()
  } catch {
    // 用户取消
  }
}

// 复核确认
const handleReview = async (record: InspectionRecord) => {
  if (record.reviewer) {
    ElMessage.warning('该记录已完成复核')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要复核检测记录 ${record.testNo} 吗？`,
      '复核确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    loading.value = true
    await new Promise(resolve => setTimeout(resolve, 800))
    record.reviewer = '审核员A'
    record.reviewDate = new Date().toISOString().split('T')[0]
    ElMessage.success('复核完成')
    loading.value = false
  } catch {
    loading.value = false
  }
}

// 打印报告
const handlePrint = () => {
  if (!currentDetail.value) return
  ElMessage.success('正在生成打印文件...')
  setTimeout(() => {
    ElMessage.success('检测报告已发送到打印机')
  }, 1000)
}

// 下载报告
const handleDownload = () => {
  if (!currentDetail.value) return
  ElMessage.success('检测报告下载中...')
  setTimeout(() => {
    ElMessage.success('检测报告下载成功')
  }, 1000)
}

// 管理检测项目
const handleManageProjects = () => {
  loadTestProjects()
  projectDialogVisible.value = true
}

// 管理认证证书
const handleManageCertificates = () => {
  loadCertificates()
  certDialogVisible.value = true
}

// 新增检测项目
const handleAddProject = () => {
  ElMessage.info('新增检测项目功能')
}

// 编辑检测项目
const handleEditProject = (project: TestProject) => {
  ElMessage.info(`编辑检测项目: ${project.name}`)
}

// 删除检测项目
const handleDeleteProject = async (project: TestProject) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除检测项目 ${project.name} 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    ElMessage.success('删除成功')
    loadTestProjects()
  } catch {
    // 用户取消
  }
}

// 上传证书
const handleUploadCert = () => {
  ElMessage.info('上传证书功能')
}

// 验证证书
const handleVerifyCert = (cert: Certificate) => {
  ElMessageBox.alert(
    `
    <div style="line-height: 2;">
      <p><strong>证书编号：</strong>${cert.certNo}</p>
      <p><strong>证书名称：</strong>${cert.certName}</p>
      <p><strong>发证机构：</strong>${cert.issueOrg}</p>
      <p><strong>有效期至：</strong>${cert.expiryDate}</p>
      <p><strong>验证结果：</strong><span style="color: #67C23A;">✓ 证书有效</span></p>
    </div>
    `,
    '证书验证结果',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '确定'
    }
  )
}

// 下载证书
const handleDownloadCert = (cert: Certificate) => {
  ElMessage.success(`正在下载证书: ${cert.certName}`)
}

// 删除证书
const handleDeleteCert = async (cert: Certificate) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除证书 ${cert.certName} 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    ElMessage.success('删除成功')
    loadCertificates()
  } catch {
    // 用户取消
  }
}

// 导出数据
const handleExport = () => {
  ElMessage.success('检测记录导出成功')
}

// 组件挂载
onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="quality-inspection-container">
    <!-- 统计卡片 -->
    <div class="statistics-cards">
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon total">📊</div>
          <div class="stat-info">
            <div class="stat-value">{{ statistics.total }}</div>
            <div class="stat-label">总检测数</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon qualified">✅</div>
          <div class="stat-info">
            <div class="stat-value">{{ statistics.qualified }}</div>
            <div class="stat-label">合格数</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon unqualified">❌</div>
          <div class="stat-info">
            <div class="stat-value">{{ statistics.unqualified }}</div>
            <div class="stat-label">不合格数</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon rate">📈</div>
          <div class="stat-info">
            <div class="stat-value">{{ statistics.qualifiedRate }}%</div>
            <div class="stat-label">合格率</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 查询区域 -->
    <el-card class="query-card" shadow="never">
      <el-form :model="queryForm" inline>
        <el-form-item label="检测编号">
          <el-input
            v-model="queryForm.testNo"
            placeholder="请输入检测编号"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="产品批次">
          <el-input
            v-model="queryForm.batchNo"
            placeholder="请输入产品批次"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="检测结果">
          <el-select
            v-model="queryForm.testResult"
            placeholder="请选择结果"
            clearable
            style="width: 130px"
          >
            <el-option
              v-for="item in resultOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="检测环节">
          <el-select
            v-model="queryForm.testStage"
            placeholder="请选择环节"
            clearable
            style="width: 130px"
          >
            <el-option
              v-for="item in stageOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="queryForm.keyword"
            placeholder="产品名称/检测项目"
            clearable
            style="width: 180px"
            :prefix-icon="Search"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleQuery">
            查询
          </el-button>
          <el-button :icon="Refresh" @click="handleReset">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作按钮 -->
    <el-card class="toolbar-card" shadow="never">
      <el-row :gutter="10">
        <el-col :span="24">
          <el-button type="primary" :icon="Plus" @click="handleAdd">
            新增检测
          </el-button>
          <el-button type="success" :icon="Document" @click="handleManageProjects">
            检测项目管理
          </el-button>
          <el-button type="warning" :icon="SuccessFilled" @click="handleManageCertificates">
            认证证书管理
          </el-button>
          <el-button :icon="Download" @click="handleExport">
            导出数据
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 检测记录列表 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">质量检测记录</span>
          <el-button :icon="Refresh" @click="loadData" circle />
        </div>
      </template>

      <el-table
        :data="filteredData"
        v-loading="loading"
        stripe
        style="width: 100%"
        highlight-current-row
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="testNo" label="检测编号" width="160" align="center" />
        <el-table-column prop="batchNo" label="产品批次" width="150" align="center" />
        <el-table-column prop="productName" label="产品名称" width="120" align="center" />
        <el-table-column label="检测环节" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="info" size="small">
              {{ stageConfig[row.testStage].icon }} {{ stageConfig[row.testStage].label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="testProject" label="检测项目" width="140" align="center" />
        <el-table-column label="检测结果" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="resultConfig[row.testResult].type" effect="dark">
              {{ resultConfig[row.testResult].label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="testDate" label="检测时间" width="120" align="center" />
        <el-table-column prop="tester" label="检测人员" width="100" align="center" />
        <el-table-column label="复核状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.reviewer" type="success" size="small">已复核</el-tag>
            <el-tag v-else type="warning" size="small">待复核</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              :icon="View"
              @click="viewDetail(row)"
            >
              查看详情
            </el-button>
            <el-button
              type="success"
              link
              :icon="SuccessFilled"
              @click="handleReview(row)"
              :disabled="!!row.reviewer"
            >
              复核
            </el-button>
            <el-button
              type="warning"
              link
              :icon="Edit"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              link
              :icon="Delete"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 检测详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="检测报告详情"
      width="900px"
      :close-on-click-modal="false"
    >
      <div v-if="currentDetail" class="detail-content">
        <!-- 基本信息 -->
        <el-card class="detail-section" shadow="never">
          <template #header>
            <div class="section-header">
              <span>📋 基本信息</span>
              <el-tag :type="resultConfig[currentDetail.record.testResult].type" effect="dark">
                {{ resultConfig[currentDetail.record.testResult].label }}
              </el-tag>
            </div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="检测编号">
              {{ currentDetail.record.testNo }}
            </el-descriptions-item>
            <el-descriptions-item label="产品批次">
              {{ currentDetail.record.batchNo }}
            </el-descriptions-item>
            <el-descriptions-item label="产品名称">
              {{ currentDetail.record.productName }}
            </el-descriptions-item>
            <el-descriptions-item label="检测环节">
              {{ stageConfig[currentDetail.record.testStage].icon }} 
              {{ stageConfig[currentDetail.record.testStage].label }}
            </el-descriptions-item>
            <el-descriptions-item label="检测项目">
              {{ currentDetail.record.testProject }}
            </el-descriptions-item>
            <el-descriptions-item label="检测时间">
              {{ currentDetail.record.testDate }}
            </el-descriptions-item>
            <el-descriptions-item label="检测人员">
              {{ currentDetail.record.tester }}
            </el-descriptions-item>
            <el-descriptions-item label="复核人员">
              {{ currentDetail.record.reviewer || '待复核' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 样品信息 -->
        <el-card class="detail-section" shadow="never">
          <template #header>
            <span>🧪 样品信息</span>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="样品编号">
              {{ currentDetail.sample.sampleNo }}
            </el-descriptions-item>
            <el-descriptions-item label="样品名称">
              {{ currentDetail.sample.sampleName }}
            </el-descriptions-item>
            <el-descriptions-item label="样品数量">
              {{ currentDetail.sample.sampleQuantity }}
            </el-descriptions-item>
            <el-descriptions-item label="采样日期">
              {{ currentDetail.sample.samplingDate }}
            </el-descriptions-item>
            <el-descriptions-item label="采样地点">
              {{ currentDetail.sample.samplingLocation }}
            </el-descriptions-item>
            <el-descriptions-item label="采样人员">
              {{ currentDetail.sample.samplingPerson }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 环境数据 -->
        <el-card class="detail-section" shadow="never">
          <template #header>
            <span>🌡️ 检测环境数据</span>
          </template>
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="env-item">
                <div class="env-label">温度</div>
                <div class="env-value">{{ currentDetail.environment.temperature.toFixed(1) }}°C</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="env-item">
                <div class="env-label">湿度</div>
                <div class="env-value">{{ currentDetail.environment.humidity.toFixed(1) }}%</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="env-item">
                <div class="env-label">气压</div>
                <div class="env-value">{{ currentDetail.environment.pressure.toFixed(1) }} kPa</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="env-item">
                <div class="env-label">记录时间</div>
                <div class="env-value small">{{ currentDetail.environment.recordTime.split(' ')[1] }}</div>
              </div>
            </el-col>
          </el-row>
        </el-card>

        <!-- 检测指标 -->
        <el-card class="detail-section" shadow="never">
          <template #header>
            <span>📊 检测指标与结果</span>
          </template>
          <el-table :data="currentDetail.indicators" border stripe>
            <el-table-column prop="name" label="检测指标" align="center" />
            <el-table-column label="检测值" align="center">
              <template #default="{ row }">
                <span :class="{ 'value-error': !row.qualified }">
                  {{ row.value }} {{ row.unit }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="标准范围" align="center">
              <template #default="{ row }">
                {{ row.standardMin }} - {{ row.standardMax }} {{ row.unit }}
              </template>
            </el-table-column>
            <el-table-column label="判定结果" align="center" width="100">
              <template #default="{ row }">
                <el-tag :type="row.qualified ? 'success' : 'danger'" size="small">
                  {{ row.qualified ? '合格' : '不合格' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="达标率" align="center" width="120">
              <template #default="{ row }">
                <el-progress
                  :percentage="Math.min(100, (row.value / row.standardMax) * 100)"
                  :color="row.qualified ? '#67c23a' : '#f56c6c'"
                  :format="() => row.qualified ? '✓' : '✗'"
                />
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 不合格处理 -->
        <el-card v-if="currentDetail.unqualifiedHandle" class="detail-section" shadow="never">
          <template #header>
            <span>⚠️ 不合格产品处理记录</span>
          </template>
          <el-alert
            type="error"
            :closable="false"
            show-icon
          >
            <template #title>
              <strong>检测不合格，已按规定进行处理</strong>
            </template>
          </el-alert>
          <el-descriptions :column="2" border style="margin-top: 16px">
            <el-descriptions-item label="处理方式">
              {{ currentDetail.unqualifiedHandle.handleMethod }}
            </el-descriptions-item>
            <el-descriptions-item label="处理人员">
              {{ currentDetail.unqualifiedHandle.handlePerson }}
            </el-descriptions-item>
            <el-descriptions-item label="处理日期">
              {{ currentDetail.unqualifiedHandle.handleDate }}
            </el-descriptions-item>
            <el-descriptions-item label="处理状态">
              <el-tag type="success">{{ currentDetail.unqualifiedHandle.status }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="处理说明" :span="2">
              {{ currentDetail.unqualifiedHandle.handleNote }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 图片资料 -->
        <el-card class="detail-section" shadow="never">
          <template #header>
            <span>📷 检测图片资料</span>
          </template>
          <div class="image-gallery">
            <el-image
              v-for="(url, index) in currentDetail.images"
              :key="index"
              :src="url"
              :preview-src-list="currentDetail.images"
              :initial-index="index"
              fit="cover"
              class="gallery-image"
            />
          </div>
        </el-card>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
          <el-button type="primary" :icon="Printer" @click="handlePrint">
            打印报告
          </el-button>
          <el-button type="success" :icon="Download" @click="handleDownload">
            下载报告
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 检测项目管理弹窗 -->
    <el-dialog
      v-model="projectDialogVisible"
      title="检测项目管理"
      width="1000px"
      :close-on-click-modal="false"
    >
      <div class="project-content">
        <div style="margin-bottom: 16px">
          <el-button type="primary" :icon="Plus" @click="handleAddProject">
            新增检测项目
          </el-button>
        </div>
        <el-table :data="testProjects" border stripe>
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="name" label="项目名称" width="150" align="center" />
          <el-table-column prop="category" label="项目类别" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.category === '安全指标' ? 'danger' : 'primary'" size="small">
                {{ row.category }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="standardRange" label="标准范围" min-width="180" />
          <el-table-column prop="testMethod" label="检测方法" width="140" align="center" />
          <el-table-column prop="equipment" label="检测仪器" width="120" align="center" />
          <el-table-column label="是否必检" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.required ? 'danger' : 'info'" size="small">
                {{ row.required ? '必检' : '选检' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="center" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link :icon="Edit" @click="handleEditProject(row)">
                编辑
              </el-button>
              <el-button type="danger" link :icon="Delete" @click="handleDeleteProject(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <template #footer>
        <el-button @click="projectDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 认证证书管理弹窗 -->
    <el-dialog
      v-model="certDialogVisible"
      title="认证证书管理"
      width="1200px"
      :close-on-click-modal="false"
    >
      <div class="cert-content">
        <div style="margin-bottom: 16px">
          <el-button type="primary" :icon="Plus" @click="handleUploadCert">
            上传证书
          </el-button>
          <el-alert
            type="warning"
            :closable="false"
            show-icon
            style="margin-top: 12px"
          >
            <template #title>
              即将到期证书提醒：共有 {{ certificateData.filter(c => c.status === 'expiring_soon').length }} 个证书将在90天内到期，请及时续期
            </template>
          </el-alert>
        </div>
        <el-table :data="certificateData" border stripe>
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="certNo" label="证书编号" width="160" align="center" />
          <el-table-column prop="certName" label="证书名称" width="160" align="center" />
          <el-table-column prop="certType" label="证书类型" width="120" align="center">
            <template #default="{ row }">
              <el-tag type="primary" size="small">{{ row.certType }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="issueOrg" label="发证机构" min-width="180" />
          <el-table-column prop="issueDate" label="发证日期" width="120" align="center" />
          <el-table-column prop="expiryDate" label="有效期至" width="120" align="center">
            <template #default="{ row }">
              <span :class="{ 'expired-date': row.status === 'expired', 'expiring-date': row.status === 'expiring_soon' }">
                {{ row.expiryDate }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="证书状态" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="certStatusConfig[row.status].type" effect="dark">
                {{ certStatusConfig[row.status].label }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="240" align="center" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link :icon="View" @click="handleVerifyCert(row)">
                验证
              </el-button>
              <el-button type="success" link :icon="Download" @click="handleDownloadCert(row)">
                下载
              </el-button>
              <el-button type="danger" link :icon="Delete" @click="handleDeleteCert(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <template #footer>
        <el-button @click="certDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.quality-inspection-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 100px);

  // 统计卡片
  .statistics-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
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
          font-size: 32px;

          &.total {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }

          &.qualified {
            background: linear-gradient(135deg, #67c23a 0%, #5daf34 100%);
          }

          &.unqualified {
            background: linear-gradient(135deg, #f56c6c 0%, #e85d5d 100%);
          }

          &.rate {
            background: linear-gradient(135deg, #409eff 0%, #3a8ee6 100%);
          }
        }

        .stat-info {
          flex: 1;

          .stat-value {
            font-size: 28px;
            font-weight: 600;
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

  // 查询卡片
  .query-card {
    margin-bottom: 20px;

    :deep(.el-card__body) {
      padding: 16px 20px;
    }

    .el-form {
      margin-bottom: 0;
    }
  }

  // 工具栏卡片
  .toolbar-card {
    margin-bottom: 20px;

    :deep(.el-card__body) {
      padding: 16px 20px;
    }
  }

  // 表格卡片
  .table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .title {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }
    }
  }

  // 详情内容
  .detail-content {
    .detail-section {
      margin-bottom: 20px;

      &:last-child {
        margin-bottom: 0;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 600;
      }

      // 环境数据项
      .env-item {
        text-align: center;
        padding: 16px;
        background: #f5f7fa;
        border-radius: 8px;

        .env-label {
          font-size: 14px;
          color: #909399;
          margin-bottom: 8px;
        }

        .env-value {
          font-size: 24px;
          font-weight: 600;
          color: #303133;

          &.small {
            font-size: 16px;
          }
        }
      }

      // 不合格值高亮
      .value-error {
        color: #f56c6c;
        font-weight: 600;
      }

      // 图片画廊
      .image-gallery {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;

        .gallery-image {
          width: 100%;
          height: 200px;
          border-radius: 8px;
          cursor: pointer;
          transition: transform 0.3s;

          &:hover {
            transform: scale(1.05);
          }
        }
      }
    }
  }

  // 对话框底部
  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  // 检测项目内容
  .project-content {
    min-height: 400px;
  }
}
</style>