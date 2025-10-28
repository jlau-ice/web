<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { Search, RefreshRight, Plus, Download, Upload, View, Edit, Delete, Document, Picture, VideoCamera, Lock } from '@element-plus/icons-vue'

// 档案状态枚举
enum ArchiveStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

// 存证状态枚举
enum BlockchainStatus {
  NOT_STORED = 'not_stored',
  STORING = 'storing',
  STORED = 'stored',
  FAILED = 'failed'
}

// 生产档案接口定义
interface ProductionArchive {
  id: string
  batchNumber: string
  productName: string
  productionBase: string
  plantingDate: string
  harvestDate: string
  status: ArchiveStatus
  blockchainStatus: BlockchainStatus
  blockchainHash?: string
  blockchainTimestamp?: string
  version: number
  createdAt: string
  updatedAt: string
}

// 种植记录
interface PlantingRecord {
  id: string
  seedSource: string
  plantingArea: number
  plantingDensity: string
  plantingMethod: string
  plantingDate: string
  expectedHarvestDate: string
  notes: string
}

// 施肥记录
interface FertilizationRecord {
  id: string
  fertilizerType: string
  fertilizerName: string
  amount: number
  unit: string
  date: string
  operator: string
  notes: string
}

// 灌溉记录
interface IrrigationRecord {
  id: string
  date: string
  amount: number
  waterSource: string
  method: string
  operator: string
  notes: string
}

// 病虫害防治记录
interface PestControlRecord {
  id: string
  date: string
  pestType: string
  controlMethod: string
  pesticide?: string
  dosage?: string
  operator: string
  effectiveness: string
  notes: string
}

// 采收记录
interface HarvestRecord {
  id: string
  date: string
  quantity: number
  unit: string
  quality: string
  operator: string
  weatherCondition: string
  notes: string
}

// 档案详情
interface ArchiveDetail {
  archive: ProductionArchive
  planting?: PlantingRecord
  fertilizations: FertilizationRecord[]
  irrigations: IrrigationRecord[]
  pestControls: PestControlRecord[]
  harvests: HarvestRecord[]
  images: string[]
  videos: string[]
}

// 搜索条件
const searchForm = reactive({
  batchNumber: '',
  status: '',
  productName: ''
})

// 表格数据
const tableData = ref<ProductionArchive[]>([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 详情抽屉
const drawerVisible = ref(false)
const activeTab = ref('basic')
const currentArchiveDetail = ref<ArchiveDetail | null>(null)

// 档案状态配置
const statusConfig = {
  [ArchiveStatus.DRAFT]: { label: '草稿', type: 'info', color: '#909399' },
  [ArchiveStatus.IN_PROGRESS]: { label: '进行中', type: 'primary', color: '#409EFF' },
  [ArchiveStatus.COMPLETED]: { label: '已完成', type: 'success', color: '#67C23A' },
  [ArchiveStatus.ARCHIVED]: { label: '已归档', type: 'warning', color: '#E6A23C' }
}

// 存证状态配置
const blockchainConfig = {
  [BlockchainStatus.NOT_STORED]: { label: '未存证', type: 'info', color: '#909399' },
  [BlockchainStatus.STORING]: { label: '存证中', type: 'warning', color: '#E6A23C' },
  [BlockchainStatus.STORED]: { label: '已存证', type: 'success', color: '#67C23A' },
  [BlockchainStatus.FAILED]: { label: '存证失败', type: 'danger', color: '#F56C6C' }
}

// Mock 数据生成
const generateMockData = (): ProductionArchive[] => {
  const products = ['有机水稻', '绿色蔬菜', '生态水果', '有机茶叶', '优质小麦']
  const bases = ['东方生态农场', '绿源种植基地', '有机农业示范园', '现代农业园区', '生态种植基地']
  const statuses = [ArchiveStatus.DRAFT, ArchiveStatus.IN_PROGRESS, ArchiveStatus.COMPLETED, ArchiveStatus.ARCHIVED]
  const blockchainStatuses = [BlockchainStatus.NOT_STORED, BlockchainStatus.STORING, BlockchainStatus.STORED, BlockchainStatus.FAILED]

  return Array.from({ length: 50 }, (_, index) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const blockchainStatus = status === ArchiveStatus.COMPLETED || status === ArchiveStatus.ARCHIVED
      ? BlockchainStatus.STORED
      : blockchainStatuses[Math.floor(Math.random() * blockchainStatuses.length)]

    return {
      id: `archive_${index + 1}`,
      batchNumber: `P${new Date().getFullYear()}${String(index + 1).padStart(6, '0')}`,
      productName: products[Math.floor(Math.random() * products.length)],
      productionBase: bases[Math.floor(Math.random() * bases.length)],
      plantingDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
      harvestDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
      status,
      blockchainStatus,
      blockchainHash: blockchainStatus === BlockchainStatus.STORED ? `0x${Math.random().toString(16).substr(2, 64)}` : undefined,
      blockchainTimestamp: blockchainStatus === BlockchainStatus.STORED ? new Date().toISOString() : undefined,
      version: Math.floor(Math.random() * 5) + 1,
      createdAt: new Date(2024, 0, Math.floor(Math.random() * 365)).toISOString(),
      updatedAt: new Date().toISOString()
    }
  })
}

// 获取档案列表
const fetchArchives = async () => {
  loading.value = true
  // 模拟异步请求
  await new Promise(resolve => setTimeout(resolve, 800))
  
  const mockData = generateMockData()
  
  // 根据搜索条件过滤
  let filtered = mockData.filter(item => {
    const matchBatch = !searchForm.batchNumber || item.batchNumber.includes(searchForm.batchNumber)
    const matchStatus = !searchForm.status || item.status === searchForm.status
    const matchProduct = !searchForm.productName || item.productName.includes(searchForm.productName)
    return matchBatch && matchStatus && matchProduct
  })
  
  total.value = filtered.length
  
  // 分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  tableData.value = filtered.slice(start, end)
  
  loading.value = false
}

// 生成档案详情 Mock 数据
const generateArchiveDetail = (archive: ProductionArchive): ArchiveDetail => {
  return {
    archive,
    planting: {
      id: 'planting_1',
      seedSource: '国家认证种子基地',
      plantingArea: 50.5,
      plantingDensity: '30cm × 20cm',
      plantingMethod: '机械化播种',
      plantingDate: archive.plantingDate,
      expectedHarvestDate: archive.harvestDate,
      notes: '采用有机种植方式，严格按照绿色食品标准执行'
    },
    fertilizations: [
      {
        id: 'fert_1',
        fertilizerType: '有机肥',
        fertilizerName: '发酵羊粪',
        amount: 500,
        unit: 'kg',
        date: '2024-03-15',
        operator: '张三',
        notes: '基肥施用'
      },
      {
        id: 'fert_2',
        fertilizerType: '生物肥',
        fertilizerName: '微生物菌肥',
        amount: 200,
        unit: 'kg',
        date: '2024-04-20',
        operator: '李四',
        notes: '追肥施用'
      },
      {
        id: 'fert_3',
        fertilizerType: '有机肥',
        fertilizerName: '豆粕',
        amount: 300,
        unit: 'kg',
        date: '2024-05-10',
        operator: '王五',
        notes: '叶面喷施'
      }
    ],
    irrigations: [
      {
        id: 'irri_1',
        date: '2024-03-20',
        amount: 100,
        waterSource: '地下水',
        method: '滴灌',
        operator: '张三',
        notes: '播种后首次灌溉'
      },
      {
        id: 'irri_2',
        date: '2024-04-15',
        amount: 150,
        waterSource: '地下水',
        method: '滴灌',
        operator: '李四',
        notes: '生长期灌溉'
      },
      {
        id: 'irri_3',
        date: '2024-05-20',
        amount: 120,
        waterSource: '地下水',
        method: '滴灌',
        operator: '王五',
        notes: '开花期灌溉'
      }
    ],
    pestControls: [
      {
        id: 'pest_1',
        date: '2024-04-10',
        pestType: '蚜虫',
        controlMethod: '生物防治',
        pesticide: '苦参碱',
        dosage: '1:1000稀释',
        operator: '张三',
        effectiveness: '良好',
        notes: '使用生物农药，符合有机标准'
      },
      {
        id: 'pest_2',
        date: '2024-05-05',
        pestType: '白粉病',
        controlMethod: '物理防治',
        operator: '李四',
        effectiveness: '一般',
        notes: '采用通风降湿措施'
      }
    ],
    harvests: [
      {
        id: 'harvest_1',
        date: archive.harvestDate,
        quantity: 2500,
        unit: 'kg',
        quality: '优质',
        operator: '张三',
        weatherCondition: '晴天',
        notes: '产品质量优良，符合有机标准'
      }
    ],
    images: [
      'https://via.placeholder.com/400x300?text=种植现场1',
      'https://via.placeholder.com/400x300?text=种植现场2',
      'https://via.placeholder.com/400x300?text=生长情况1',
      'https://via.placeholder.com/400x300?text=采收现场1'
    ],
    videos: [
      'https://www.example.com/video1.mp4',
      'https://www.example.com/video2.mp4'
    ]
  }
}

// 查看详情
const viewDetail = async (row: ProductionArchive) => {
  loading.value = true
  // 模拟异步加载
  await new Promise(resolve => setTimeout(resolve, 500))
  
  currentArchiveDetail.value = generateArchiveDetail(row)
  drawerVisible.value = true
  activeTab.value = 'basic'
  loading.value = false
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchArchives()
}

// 重置搜索
const handleReset = () => {
  searchForm.batchNumber = ''
  searchForm.status = ''
  searchForm.productName = ''
  currentPage.value = 1
  fetchArchives()
}

// 分页变化
const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchArchives()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  fetchArchives()
}

// 新增档案
const handleAdd = () => {
  ElMessage.info('新增档案功能')
}

// 编辑档案
const handleEdit = (row: ProductionArchive) => {
  ElMessage.info(`编辑档案: ${row.batchNumber}`)
}

// 删除档案
const handleDelete = async (row: ProductionArchive) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除档案 ${row.batchNumber} 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 模拟删除
    await new Promise(resolve => setTimeout(resolve, 500))
    ElMessage.success('删除成功')
    fetchArchives()
  } catch {
    // 用户取消
  }
}

// 区块链存证
const handleBlockchainStore = async (row: ProductionArchive) => {
  if (row.blockchainStatus === BlockchainStatus.STORED) {
    ElMessage.warning('该档案已完成存证')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      '确定要将该档案数据提交到区块链进行存证吗？',
      '区块链存证',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    // 模拟存证
    loading.value = true
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    ElMessage.success('存证成功！交易已上链')
    loading.value = false
    fetchArchives()
  } catch {
    // 用户取消
    loading.value = false
  }
}

// 验证存证
const handleVerifyBlockchain = (row: ProductionArchive) => {
  if (row.blockchainStatus !== BlockchainStatus.STORED) {
    ElMessage.warning('该档案尚未存证')
    return
  }
  
  ElMessageBox.alert(
    `
    <div style="line-height: 2;">
      <p><strong>存证状态：</strong>已存证</p>
      <p><strong>区块链哈希：</strong>${row.blockchainHash}</p>
      <p><strong>存证时间：</strong>${row.blockchainTimestamp}</p>
      <p><strong>验证结果：</strong><span style="color: #67C23A;">✓ 数据完整，未被篡改</span></p>
    </div>
    `,
    '存证验证结果',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '确定'
    }
  )
}

// 下载存证证书
const handleDownloadCertificate = async (row: ProductionArchive) => {
  if (row.blockchainStatus !== BlockchainStatus.STORED) {
    ElMessage.warning('该档案尚未存证，无法下载证书')
    return
  }
  
  ElMessage.success('存证证书生成中...')
  await new Promise(resolve => setTimeout(resolve, 1000))
  ElMessage.success('存证证书下载成功')
}

// 导出档案
const handleExport = () => {
  ElMessage.success('档案导出成功')
}

// 导入档案
const handleImport = () => {
  ElMessage.info('档案导入功能')
}

// 更改档案状态
const handleStatusChange = async (row: ProductionArchive, newStatus: ArchiveStatus) => {
  try {
    await ElMessageBox.confirm(
      `确定要将档案状态改为"${statusConfig[newStatus].label}"吗？`,
      '状态变更',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    // 模拟状态变更
    await new Promise(resolve => setTimeout(resolve, 500))
    ElMessage.success('状态变更成功')
    fetchArchives()
  } catch {
    // 用户取消
  }
}

// 组件挂载时加载数据
onMounted(() => {
  fetchArchives()
})
</script>

<template>
  <div class="production-archive-container">
    <!-- 搜索筛选区 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline>
        <el-form-item label="产品批次号">
          <el-input
            v-model="searchForm.batchNumber"
            placeholder="请输入批次号"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input
            v-model="searchForm.productName"
            placeholder="请输入产品名称"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="档案状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="(config, key) in statusConfig"
              :key="key"
              :label="config.label"
              :value="key"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">
            搜索
          </el-button>
          <el-button :icon="RefreshRight" @click="handleReset">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作按钮区 -->
    <el-card class="toolbar-card" shadow="never">
      <el-row :gutter="10">
        <el-col :span="24">
          <el-button type="primary" :icon="Plus" @click="handleAdd">
            新增档案
          </el-button>
          <el-button :icon="Download" @click="handleExport">
            导出档案
          </el-button>
          <el-button :icon="Upload" @click="handleImport">
            导入档案
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 档案列表 -->
    <el-card class="table-card" shadow="never">
      <el-table
        :data="tableData"
        :loading="loading"
        stripe
        border
        style="width: 100%"
        height="calc(100vh - 400px)"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="batchNumber" label="产品批次号" width="160" align="center" />
        <el-table-column prop="productName" label="产品名称" width="120" align="center" />
        <el-table-column prop="productionBase" label="生产基地" width="160" align="center" />
        <el-table-column prop="plantingDate" label="种植时间" width="120" align="center" />
        <el-table-column prop="harvestDate" label="采收时间" width="120" align="center" />
        <el-table-column label="档案状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusConfig[row.status].type" size="small">
              {{ statusConfig[row.status].label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="存证状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="blockchainConfig[row.blockchainStatus].type" size="small">
              <el-icon style="vertical-align: middle; margin-right: 4px">
                <Lock />
              </el-icon>
              {{ blockchainConfig[row.blockchainStatus].label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="版本" width="80" align="center">
          <template #default="{ row }">
            v{{ row.version }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="380" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link :icon="View" @click="viewDetail(row)">
              查看详情
            </el-button>
            <el-button type="primary" link :icon="Edit" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button
              type="success"
              link
              :icon="Lock"
              @click="handleBlockchainStore(row)"
              :disabled="row.blockchainStatus === 'stored'"
            >
              存证
            </el-button>
            <el-button
              type="info"
              link
              :icon="Document"
              @click="handleVerifyBlockchain(row)"
            >
              验证
            </el-button>
            <el-button type="danger" link :icon="Delete" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      title="生产档案详情"
      size="60%"
      :close-on-click-modal="false"
    >
      <div v-if="currentArchiveDetail" class="drawer-content">
        <!-- 档案基本信息卡片 -->
        <el-card class="info-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">{{ currentArchiveDetail.archive.productName }}</span>
              <div>
                <el-tag :type="statusConfig[currentArchiveDetail.archive.status].type">
                  {{ statusConfig[currentArchiveDetail.archive.status].label }}
                </el-tag>
                <el-tag
                  :type="blockchainConfig[currentArchiveDetail.archive.blockchainStatus].type"
                  style="margin-left: 10px"
                >
                  <el-icon style="vertical-align: middle; margin-right: 4px">
                    <Lock />
                  </el-icon>
                  {{ blockchainConfig[currentArchiveDetail.archive.blockchainStatus].label }}
                </el-tag>
              </div>
            </div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="产品批次号">
              {{ currentArchiveDetail.archive.batchNumber }}
            </el-descriptions-item>
            <el-descriptions-item label="生产基地">
              {{ currentArchiveDetail.archive.productionBase }}
            </el-descriptions-item>
            <el-descriptions-item label="种植时间">
              {{ currentArchiveDetail.archive.plantingDate }}
            </el-descriptions-item>
            <el-descriptions-item label="采收时间">
              {{ currentArchiveDetail.archive.harvestDate }}
            </el-descriptions-item>
            <el-descriptions-item label="档案版本">
              v{{ currentArchiveDetail.archive.version }}
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ new Date(currentArchiveDetail.archive.createdAt).toLocaleString() }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 详细信息标签页 -->
        <el-card class="detail-card" shadow="never">
          <el-tabs v-model="activeTab">
            <!-- 基础信息 -->
            <el-tab-pane label="基础信息" name="basic">
              <div v-if="currentArchiveDetail.planting" class="tab-content">
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="种子来源">
                    {{ currentArchiveDetail.planting.seedSource }}
                  </el-descriptions-item>
                  <el-descriptions-item label="种植面积">
                    {{ currentArchiveDetail.planting.plantingArea }} 亩
                  </el-descriptions-item>
                  <el-descriptions-item label="种植密度">
                    {{ currentArchiveDetail.planting.plantingDensity }}
                  </el-descriptions-item>
                  <el-descriptions-item label="种植方法">
                    {{ currentArchiveDetail.planting.plantingMethod }}
                  </el-descriptions-item>
                  <el-descriptions-item label="种植日期">
                    {{ currentArchiveDetail.planting.plantingDate }}
                  </el-descriptions-item>
                  <el-descriptions-item label="预计采收日期">
                    {{ currentArchiveDetail.planting.expectedHarvestDate }}
                  </el-descriptions-item>
                  <el-descriptions-item label="备注" :span="2">
                    {{ currentArchiveDetail.planting.notes }}
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </el-tab-pane>

            <!-- 种植记录 -->
            <el-tab-pane label="施肥记录" name="fertilization">
              <div class="tab-content">
                <el-timeline>
                  <el-timeline-item
                    v-for="item in currentArchiveDetail.fertilizations"
                    :key="item.id"
                    :timestamp="item.date"
                    placement="top"
                  >
                    <el-card>
                      <h4>{{ item.fertilizerName }}</h4>
                      <p><strong>肥料类型：</strong>{{ item.fertilizerType }}</p>
                      <p><strong>施肥量：</strong>{{ item.amount }} {{ item.unit }}</p>
                      <p><strong>操作人员：</strong>{{ item.operator }}</p>
                      <p><strong>备注：</strong>{{ item.notes }}</p>
                    </el-card>
                  </el-timeline-item>
                </el-timeline>
              </div>
            </el-tab-pane>

            <!-- 灌溉记录 -->
            <el-tab-pane label="灌溉记录" name="irrigation">
              <div class="tab-content">
                <el-table :data="currentArchiveDetail.irrigations" border stripe>
                  <el-table-column prop="date" label="灌溉日期" width="120" align="center" />
                  <el-table-column label="灌溉量" align="center">
                    <template #default="{ row }">
                      {{ row.amount }} m³
                    </template>
                  </el-table-column>
                  <el-table-column prop="waterSource" label="水源" align="center" />
                  <el-table-column prop="method" label="灌溉方式" align="center" />
                  <el-table-column prop="operator" label="操作人员" align="center" />
                  <el-table-column prop="notes" label="备注" />
                </el-table>
              </div>
            </el-tab-pane>

            <!-- 病虫害防治 -->
            <el-tab-pane label="病虫害防治" name="pestControl">
              <div class="tab-content">
                <el-table :data="currentArchiveDetail.pestControls" border stripe>
                  <el-table-column prop="date" label="防治日期" width="120" align="center" />
                  <el-table-column prop="pestType" label="病虫害类型" align="center" />
                  <el-table-column prop="controlMethod" label="防治方法" align="center" />
                  <el-table-column prop="pesticide" label="农药名称" align="center" />
                  <el-table-column prop="dosage" label="用药量" align="center" />
                  <el-table-column prop="operator" label="操作人员" align="center" />
                  <el-table-column label="效果" align="center">
                    <template #default="{ row }">
                      <el-tag :type="row.effectiveness === '良好' ? 'success' : 'warning'" size="small">
                        {{ row.effectiveness }}
                      </el-tag>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-tab-pane>

            <!-- 采收记录 -->
            <el-tab-pane label="采收记录" name="harvest">
              <div class="tab-content">
                <el-table :data="currentArchiveDetail.harvests" border stripe>
                  <el-table-column prop="date" label="采收日期" width="120" align="center" />
                  <el-table-column label="采收量" align="center">
                    <template #default="{ row }">
                      {{ row.quantity }} {{ row.unit }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="quality" label="产品质量" align="center">
                    <template #default="{ row }">
                      <el-tag type="success" size="small">{{ row.quality }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="operator" label="操作人员" align="center" />
                  <el-table-column prop="weatherCondition" label="天气状况" align="center" />
                  <el-table-column prop="notes" label="备注" />
                </el-table>
              </div>
            </el-tab-pane>

            <!-- 图片资料 -->
            <el-tab-pane label="图片资料" name="images">
              <div class="tab-content">
                <div class="image-gallery">
                  <el-image
                    v-for="(url, index) in currentArchiveDetail.images"
                    :key="index"
                    :src="url"
                    :preview-src-list="currentArchiveDetail.images"
                    :initial-index="index"
                    fit="cover"
                    class="gallery-image"
                  >
                    <template #error>
                      <div class="image-slot">
                        <el-icon><Picture /></el-icon>
                      </div>
                    </template>
                  </el-image>
                </div>
              </div>
            </el-tab-pane>

            <!-- 视频资料 -->
            <el-tab-pane label="视频资料" name="videos">
              <div class="tab-content">
                <div class="video-list">
                  <el-card
                    v-for="(url, index) in currentArchiveDetail.videos"
                    :key="index"
                    class="video-card"
                    shadow="hover"
                  >
                    <div class="video-placeholder">
                      <el-icon :size="60"><VideoCamera /></el-icon>
                      <p>{{ url }}</p>
                      <el-button type="primary" size="small">播放视频</el-button>
                    </div>
                  </el-card>
                </div>
              </div>
            </el-tab-pane>

            <!-- 区块链存证 -->
            <el-tab-pane label="区块链存证" name="blockchain">
              <div class="tab-content">
                <el-result
                  v-if="currentArchiveDetail.archive.blockchainStatus === 'stored'"
                  icon="success"
                  title="数据已成功存证"
                  sub-title="该档案的关键数据已写入区块链，保证数据不可篡改"
                >
                  <template #extra>
                    <el-descriptions :column="1" border>
                      <el-descriptions-item label="存证状态">
                        <el-tag type="success">已存证</el-tag>
                      </el-descriptions-item>
                      <el-descriptions-item label="区块链哈希">
                        <el-text type="primary" truncated style="max-width: 400px">
                          {{ currentArchiveDetail.archive.blockchainHash }}
                        </el-text>
                      </el-descriptions-item>
                      <el-descriptions-item label="存证时间">
                        {{ currentArchiveDetail.archive.blockchainTimestamp ? new Date(currentArchiveDetail.archive.blockchainTimestamp).toLocaleString() : '-' }}
                      </el-descriptions-item>
                      <el-descriptions-item label="数据完整性">
                        <el-tag type="success">✓ 验证通过</el-tag>
                      </el-descriptions-item>
                    </el-descriptions>
                    <div style="margin-top: 20px">
                      <el-button
                        type="primary"
                        @click="handleDownloadCertificate(currentArchiveDetail.archive)"
                      >
                        下载存证证书
                      </el-button>
                      <el-button @click="handleVerifyBlockchain(currentArchiveDetail.archive)">
                        验证存证信息
                      </el-button>
                    </div>
                  </template>
                </el-result>
                <el-result
                  v-else-if="currentArchiveDetail.archive.blockchainStatus === 'storing'"
                  icon="warning"
                  title="存证进行中"
                  sub-title="数据正在提交到区块链网络，请稍候..."
                />
                <el-result
                  v-else-if="currentArchiveDetail.archive.blockchainStatus === 'failed'"
                  icon="error"
                  title="存证失败"
                  sub-title="区块链存证过程中出现错误，请重试"
                >
                  <template #extra>
                    <el-button
                      type="primary"
                      @click="handleBlockchainStore(currentArchiveDetail.archive)"
                    >
                      重新存证
                    </el-button>
                  </template>
                </el-result>
                <el-result
                  v-else
                  icon="info"
                  title="尚未存证"
                  sub-title="该档案数据尚未提交到区块链进行存证"
                >
                  <template #extra>
                    <el-button
                      type="primary"
                      @click="handleBlockchainStore(currentArchiveDetail.archive)"
                    >
                      立即存证
                    </el-button>
                  </template>
                </el-result>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>

        <!-- 操作按钮 -->
        <div class="drawer-footer">
          <el-button @click="drawerVisible = false">关闭</el-button>
          <el-button type="primary" @click="handleEdit(currentArchiveDetail.archive)">
            编辑档案
          </el-button>
          <el-dropdown split-button type="success">
            状态变更
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="(config, key) in statusConfig"
                  :key="key"
                  @click="() => handleStatusChange(currentArchiveDetail.archive, key)"
                  :disabled="currentArchiveDetail.archive.status === key"
                >
                  {{ config.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
.production-archive-container {

  .search-card,
  .toolbar-card,
  .table-card {
    margin-bottom: 20px;
  }

  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .drawer-content {
    padding: 0 20px 20px;

    .info-card {
      margin-bottom: 20px;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .card-title {
          font-size: 18px;
          font-weight: bold;
        }
      }
    }

    .detail-card {
      .tab-content {
        padding: 20px;
        min-height: 300px;
      }

      .image-gallery {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
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

          .image-slot {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;
            background-color: #f5f7fa;
            color: #909399;
            font-size: 30px;
          }
        }
      }

      .video-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 16px;

        .video-card {
          .video-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            color: #909399;

            p {
              margin: 16px 0;
              font-size: 14px;
              word-break: break-all;
            }
          }
        }
      }
    }

    .drawer-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 20px;
      border-top: 1px solid #ebeef5;
      position: sticky;
      bottom: 0;
      background-color: #fff;
      z-index: 10;
    }
  }
}

// 响应式布局
@media (max-width: 768px) {
  .production-archive-container {
    padding: 10px;
  }
}
</style>