<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Location, Warning, Clock } from '@element-plus/icons-vue'

// 类型定义
interface EnvironmentData {
  temperature: number
  humidity: number
  recordTime: string
}

interface TrackNode {
  id: string
  stage: string
  location: string
  responsible: string
  time: string
  status: 'completed' | 'processing' | 'pending'
  details?: {
    storageCondition?: string
    stockQuantity?: number
    transportMode?: string
    carrier?: string
    distributor?: string
    salesArea?: string
  }
  environment?: EnvironmentData
  coordinates?: {
    lat: number
    lng: number
  }
}

interface Alert {
  id: string
  type: 'temperature' | 'delay' | 'other'
  level: 'warning' | 'danger'
  message: string
  time: string
  status: 'pending' | 'handled'
  handleNote?: string
}

interface CirculationRecord {
  id: string
  batchNo: string
  productName: string
  currentStage: string
  currentLocation: string
  responsible: string
  updateTime: string
  status: 'in-transit' | 'in-storage' | 'abnormal' | 'completed'
  progress: number
  trackNodes: TrackNode[]
  alerts: Alert[]
  estimatedArrival?: string
  transportPath?: string
}

// 查询表单
const queryForm = reactive({
  batchNo: '',
  status: '',
  keyword: ''
})

// 数据状态
const loading = ref(false)
const tableData = ref<CirculationRecord[]>([])
const selectedRecord = ref<CirculationRecord | null>(null)
const showTrackDetail = ref(false)

// 状态选项
const statusOptions = [
  { label: '全部', value: '' },
  { label: '在途', value: 'in-transit' },
  { label: '在库', value: 'in-storage' },
  { label: '异常', value: 'abnormal' },
  { label: '完成', value: 'completed' }
]

// 状态配置
const statusConfig = {
  'in-transit': { label: '在途', type: 'primary' },
  'in-storage': { label: '在库', type: 'success' },
  'abnormal': { label: '异常', type: 'danger' },
  'completed': { label: '完成', type: 'info' }
}

// 节点状态配置
const nodeStatusConfig = {
  'completed': { color: '#67c23a', label: '已完成' },
  'processing': { color: '#409eff', label: '进行中' },
  'pending': { color: '#909399', label: '未开始' }
}

// 预警类型配置
const alertTypeConfig = {
  'temperature': { label: '温度异常', icon: '🌡️' },
  'delay': { label: '时间延误', icon: '⏰' },
  'other': { label: '其他异常', icon: '⚠️' }
}

// Mock 数据生成
const generateMockData = (): CirculationRecord[] => {
  return [
    {
      id: '1',
      batchNo: 'AP20250101001',
      productName: '有机苹果',
      currentStage: '运输中',
      currentLocation: '杭州市物流中心',
      responsible: '张三',
      updateTime: '2025-01-15 14:30:00',
      status: 'in-transit',
      progress: 60,
      estimatedArrival: '2025-01-16 10:00:00',
      transportPath: '产地仓库 → 省级物流中心 → 市级配送中心 → 终端门店',
      trackNodes: [
        {
          id: 'n1',
          stage: '生产端',
          location: '山东烟台苹果种植基地',
          responsible: '王农场主',
          time: '2025-01-10 08:00:00',
          status: 'completed',
          details: {
            stockQuantity: 1000
          },
          coordinates: { lat: 37.5, lng: 121.4 }
        },
        {
          id: 'n2',
          stage: '仓储',
          location: '产地仓库A区',
          responsible: '李仓管',
          time: '2025-01-12 10:00:00',
          status: 'completed',
          details: {
            storageCondition: '冷藏 2-5℃',
            stockQuantity: 1000
          },
          environment: {
            temperature: 3.5,
            humidity: 65,
            recordTime: '2025-01-12 10:00:00'
          },
          coordinates: { lat: 37.5, lng: 121.5 }
        },
        {
          id: 'n3',
          stage: '运输',
          location: '杭州市物流中心',
          responsible: '张三',
          time: '2025-01-15 14:30:00',
          status: 'processing',
          details: {
            transportMode: '冷链物流车',
            carrier: '顺丰冷运'
          },
          environment: {
            temperature: 4.2,
            humidity: 62,
            recordTime: '2025-01-15 14:30:00'
          },
          coordinates: { lat: 30.2, lng: 120.2 }
        },
        {
          id: 'n4',
          stage: '分销',
          location: '杭州市配送中心',
          responsible: '待分配',
          time: '',
          status: 'pending',
          details: {
            distributor: '浙江鲜果分销',
            salesArea: '杭州市区'
          },
          coordinates: { lat: 30.3, lng: 120.3 }
        },
        {
          id: 'n5',
          stage: '零售',
          location: '终端门店',
          responsible: '待分配',
          time: '',
          status: 'pending',
          coordinates: { lat: 30.25, lng: 120.15 }
        }
      ],
      alerts: []
    },
    {
      id: '2',
      batchNo: 'TM20250102003',
      productName: '有机西红柿',
      currentStage: '仓储',
      currentLocation: '省级冷库',
      responsible: '赵六',
      updateTime: '2025-01-14 09:15:00',
      status: 'in-storage',
      progress: 40,
      trackNodes: [
        {
          id: 'n1',
          stage: '生产端',
          location: '浙江温室大棚',
          responsible: '刘农户',
          time: '2025-01-08 07:00:00',
          status: 'completed',
          coordinates: { lat: 30.0, lng: 120.0 }
        },
        {
          id: 'n2',
          stage: '仓储',
          location: '省级冷库',
          responsible: '赵六',
          time: '2025-01-10 16:00:00',
          status: 'processing',
          details: {
            storageCondition: '恒温 8-10℃',
            stockQuantity: 800
          },
          environment: {
            temperature: 9.0,
            humidity: 70,
            recordTime: '2025-01-14 09:00:00'
          },
          coordinates: { lat: 30.1, lng: 120.1 }
        },
        {
          id: 'n3',
          stage: '运输',
          location: '待发货',
          responsible: '待分配',
          time: '',
          status: 'pending',
          coordinates: { lat: 30.2, lng: 120.2 }
        }
      ],
      alerts: []
    },
    {
      id: '3',
      batchNo: 'OR20250103005',
      productName: '脐橙',
      currentStage: '运输中',
      currentLocation: '高速路段G60',
      responsible: '孙七',
      updateTime: '2025-01-15 16:45:00',
      status: 'abnormal',
      progress: 50,
      estimatedArrival: '2025-01-16 18:00:00',
      trackNodes: [
        {
          id: 'n1',
          stage: '生产端',
          location: '江西赣州脐橙基地',
          responsible: '陈果农',
          time: '2025-01-11 06:00:00',
          status: 'completed',
          coordinates: { lat: 25.8, lng: 114.9 }
        },
        {
          id: 'n2',
          stage: '仓储',
          location: '产地分拣中心',
          responsible: '周仓管',
          time: '2025-01-13 14:00:00',
          status: 'completed',
          details: {
            storageCondition: '常温通风',
            stockQuantity: 1200
          },
          coordinates: { lat: 25.85, lng: 115.0 }
        },
        {
          id: 'n3',
          stage: '运输',
          location: '高速路段G60',
          responsible: '孙七',
          time: '2025-01-15 08:00:00',
          status: 'processing',
          details: {
            transportMode: '普通货运车',
            carrier: '德邦物流'
          },
          environment: {
            temperature: 18.5,
            humidity: 55,
            recordTime: '2025-01-15 16:45:00'
          },
          coordinates: { lat: 28.5, lng: 118.0 }
        }
      ],
      alerts: [
        {
          id: 'a1',
          type: 'delay',
          level: 'warning',
          message: '运输时间超过预期2小时',
          time: '2025-01-15 16:00:00',
          status: 'pending'
        },
        {
          id: 'a2',
          type: 'temperature',
          level: 'warning',
          message: '车厢温度偏高，建议开启制冷',
          time: '2025-01-15 16:45:00',
          status: 'pending'
        }
      ]
    },
    {
      id: '4',
      batchNo: 'GR20241228010',
      productName: '葡萄',
      currentStage: '已完成',
      currentLocation: '终端超市',
      responsible: '吴八',
      updateTime: '2025-01-10 11:20:00',
      status: 'completed',
      progress: 100,
      trackNodes: [
        {
          id: 'n1',
          stage: '生产端',
          location: '新疆吐鲁番葡萄园',
          responsible: '马果农',
          time: '2024-12-20 09:00:00',
          status: 'completed',
          coordinates: { lat: 42.9, lng: 89.2 }
        },
        {
          id: 'n2',
          stage: '仓储',
          location: '新疆冷链仓库',
          responsible: '郑仓管',
          time: '2024-12-22 15:00:00',
          status: 'completed',
          details: {
            storageCondition: '冷藏 0-2℃',
            stockQuantity: 500
          },
          coordinates: { lat: 43.0, lng: 89.5 }
        },
        {
          id: 'n3',
          stage: '运输',
          location: '上海物流中心',
          responsible: '冯司机',
          time: '2024-12-28 10:00:00',
          status: 'completed',
          details: {
            transportMode: '冷链专车',
            carrier: '京东冷链'
          },
          coordinates: { lat: 31.2, lng: 121.5 }
        },
        {
          id: 'n4',
          stage: '分销',
          location: '上海配送中心',
          responsible: '褚经理',
          time: '2025-01-05 08:30:00',
          status: 'completed',
          details: {
            distributor: '上海农副产品公司',
            salesArea: '浦东新区'
          },
          coordinates: { lat: 31.22, lng: 121.55 }
        },
        {
          id: 'n5',
          stage: '零售',
          location: '家家乐超市',
          responsible: '吴八',
          time: '2025-01-10 11:20:00',
          status: 'completed',
          coordinates: { lat: 31.24, lng: 121.53 }
        }
      ],
      alerts: []
    }
  ]
}

// 加载数据
const loadData = () => {
  loading.value = true
  setTimeout(() => {
    tableData.value = generateMockData()
    loading.value = false
    ElMessage.success('数据加载成功')
  }, 800)
}

// 筛选后的数据
const filteredData = computed(() => {
  return tableData.value.filter(item => {
    const matchBatchNo = !queryForm.batchNo || item.batchNo.includes(queryForm.batchNo)
    const matchStatus = !queryForm.status || item.status === queryForm.status
    const matchKeyword = !queryForm.keyword || 
      item.productName.includes(queryForm.keyword) ||
      item.currentLocation.includes(queryForm.keyword) ||
      item.responsible.includes(queryForm.keyword)
    
    return matchBatchNo && matchStatus && matchKeyword
  })
})

// 查询
const handleQuery = () => {
  ElMessage.info('查询中...')
}

// 重置
const handleReset = () => {
  queryForm.batchNo = ''
  queryForm.status = ''
  queryForm.keyword = ''
  ElMessage.info('已重置查询条件')
}

// 查看轨迹详情
const viewTrackDetail = (record: CirculationRecord) => {
  selectedRecord.value = record
  showTrackDetail.value = true
}

// 处理预警
const handleAlert = (alert: Alert) => {
  ElMessage.info(`处理预警: ${alert.message}`)
  alert.status = 'handled'
  alert.handleNote = '已人工介入处理'
}

// 刷新轨迹
const refreshTrack = (record: CirculationRecord) => {
  ElMessage.success(`刷新批次 ${record.batchNo} 的轨迹信息`)
  loadData()
}

// 获取节点图标
const getNodeIcon = (stage: string) => {
  const iconMap: Record<string, string> = {
    '生产端': '🌱',
    '仓储': '🏭',
    '运输': '🚚',
    '分销': '📦',
    '零售': '🏪'
  }
  return iconMap[stage] || '📍'
}

// 组件挂载
onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="circulation-track-container">
    <!-- 查询区域 -->
    <el-card class="query-card" shadow="never">
      <el-form :model="queryForm" inline>
        <el-form-item label="产品批次号">
          <el-input
            v-model="queryForm.batchNo"
            placeholder="请输入批次号"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="流通状态">
          <el-select
            v-model="queryForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="queryForm.keyword"
            placeholder="产品名称/地点/责任人"
            clearable
            style="width: 200px"
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

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 左侧：流通记录列表 -->
      <el-card class="list-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span class="title">流通记录列表</span>
            <el-button :icon="Refresh" @click="loadData" circle />
          </div>
        </template>

        <el-table
          :data="filteredData"
          v-loading="loading"
          stripe
          style="width: 100%"
          @row-click="viewTrackDetail"
          highlight-current-row
        >
          <el-table-column prop="batchNo" label="产品批次号" width="150" />
          <el-table-column prop="productName" label="产品名称" width="120" />
          <el-table-column label="当前环节" width="120">
            <template #default="{ row }">
              <el-tag :type="statusConfig[row.status].type" size="small">
                {{ row.currentStage }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="currentLocation" label="当前位置" min-width="150" />
          <el-table-column prop="responsible" label="责任人" width="100" />
          <el-table-column prop="updateTime" label="更新时间" width="160" />
          <el-table-column label="进度" width="120">
            <template #default="{ row }">
              <el-progress
                :percentage="row.progress"
                :color="row.status === 'abnormal' ? '#f56c6c' : '#67c23a'"
              />
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="statusConfig[row.status].type" effect="dark">
                {{ statusConfig[row.status].label }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button
                type="primary"
                link
                :icon="Location"
                @click.stop="viewTrackDetail(row)"
              >
                查看轨迹
              </el-button>
              <el-button
                type="success"
                link
                :icon="Refresh"
                @click.stop="refreshTrack(row)"
              >
                刷新
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 右侧：轨迹详情 -->
      <el-card class="detail-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span class="title">
              {{ selectedRecord ? `轨迹详情 - ${selectedRecord.batchNo}` : '轨迹详情' }}
            </span>
            <el-tag v-if="selectedRecord" :type="statusConfig[selectedRecord.status].type">
              {{ statusConfig[selectedRecord.status].label }}
            </el-tag>
          </div>
        </template>

        <div v-if="!selectedRecord" class="empty-state">
          <el-empty description="请从左侧列表选择记录查看轨迹详情" />
        </div>

        <div v-else class="detail-content">
          <!-- 基本信息 -->
          <div class="info-section">
            <h3>📋 基本信息</h3>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="产品批次号">
                {{ selectedRecord.batchNo }}
              </el-descriptions-item>
              <el-descriptions-item label="产品名称">
                {{ selectedRecord.productName }}
              </el-descriptions-item>
              <el-descriptions-item label="当前环节">
                {{ selectedRecord.currentStage }}
              </el-descriptions-item>
              <el-descriptions-item label="当前位置">
                {{ selectedRecord.currentLocation }}
              </el-descriptions-item>
              <el-descriptions-item label="当前责任人">
                {{ selectedRecord.responsible }}
              </el-descriptions-item>
              <el-descriptions-item label="更新时间">
                {{ selectedRecord.updateTime }}
              </el-descriptions-item>
              <el-descriptions-item label="完成进度">
                <el-progress
                  :percentage="selectedRecord.progress"
                  :color="selectedRecord.status === 'abnormal' ? '#f56c6c' : '#67c23a'"
                />
              </el-descriptions-item>
              <el-descriptions-item label="流通状态">
                <el-tag :type="statusConfig[selectedRecord.status].type" effect="dark">
                  {{ statusConfig[selectedRecord.status].label }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item v-if="selectedRecord.estimatedArrival" label="预计到达">
                <span class="estimated-time">
                  <el-icon><Clock /></el-icon>
                  {{ selectedRecord.estimatedArrival }}
                </span>
              </el-descriptions-item>
              <el-descriptions-item v-if="selectedRecord.transportPath" label="运输路径" :span="2">
                {{ selectedRecord.transportPath }}
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 异常预警 -->
          <div v-if="selectedRecord.alerts.length > 0" class="alert-section">
            <h3>⚠️ 异常预警</h3>
            <el-alert
              v-for="alert in selectedRecord.alerts"
              :key="alert.id"
              :title="`${alertTypeConfig[alert.type].icon} ${alertTypeConfig[alert.type].label}`"
              :type="alert.level === 'danger' ? 'error' : 'warning'"
              :closable="false"
              show-icon
              class="alert-item"
            >
              <template #default>
                <div class="alert-content">
                  <p><strong>预警信息：</strong>{{ alert.message }}</p>
                  <p><strong>发生时间：</strong>{{ alert.time }}</p>
                  <p>
                    <strong>处理状态：</strong>
                    <el-tag :type="alert.status === 'handled' ? 'success' : 'warning'" size="small">
                      {{ alert.status === 'handled' ? '已处理' : '待处理' }}
                    </el-tag>
                  </p>
                  <p v-if="alert.handleNote"><strong>处理说明：</strong>{{ alert.handleNote }}</p>
                  <el-button
                    v-if="alert.status === 'pending'"
                    type="primary"
                    size="small"
                    @click="handleAlert(alert)"
                    style="margin-top: 8px"
                  >
                    标记为已处理
                  </el-button>
                </div>
              </template>
            </el-alert>
          </div>

          <!-- 流通轨迹时间轴 -->
          <div class="timeline-section">
            <h3>🚚 流通轨迹</h3>
            <el-timeline class="track-timeline">
              <el-timeline-item
                v-for="node in selectedRecord.trackNodes"
                :key="node.id"
                :timestamp="node.time || '待更新'"
                :color="nodeStatusConfig[node.status].color"
                placement="top"
                :hollow="node.status === 'pending'"
              >
                <el-card class="timeline-card">
                  <template #header>
                    <div class="timeline-card-header">
                      <span class="stage-icon">{{ getNodeIcon(node.stage) }}</span>
                      <span class="stage-name">{{ node.stage }}</span>
                      <el-tag
                        :color="nodeStatusConfig[node.status].color"
                        size="small"
                        effect="dark"
                      >
                        {{ nodeStatusConfig[node.status].label }}
                      </el-tag>
                    </div>
                  </template>

                  <div class="timeline-card-content">
                    <el-row :gutter="16">
                      <el-col :span="12">
                        <p><strong>📍 地点：</strong>{{ node.location }}</p>
                        <p><strong>👤 责任人：</strong>{{ node.responsible }}</p>
                      </el-col>
                      <el-col :span="12">
                        <p v-if="node.coordinates">
                          <strong>🌐 坐标：</strong>
                          {{ node.coordinates.lat.toFixed(2) }}°N, {{ node.coordinates.lng.toFixed(2) }}°E
                        </p>
                      </el-col>
                    </el-row>

                    <!-- 环节详细信息 -->
                    <div v-if="node.details" class="node-details">
                      <el-divider />
                      <h4>详细信息</h4>
                      <el-descriptions :column="2" size="small" border>
                        <el-descriptions-item
                          v-if="node.details.storageCondition"
                          label="存储条件"
                        >
                          {{ node.details.storageCondition }}
                        </el-descriptions-item>
                        <el-descriptions-item
                          v-if="node.details.stockQuantity"
                          label="库存数量"
                        >
                          {{ node.details.stockQuantity }} kg
                        </el-descriptions-item>
                        <el-descriptions-item
                          v-if="node.details.transportMode"
                          label="运输方式"
                        >
                          {{ node.details.transportMode }}
                        </el-descriptions-item>
                        <el-descriptions-item
                          v-if="node.details.carrier"
                          label="承运商"
                        >
                          {{ node.details.carrier }}
                        </el-descriptions-item>
                        <el-descriptions-item
                          v-if="node.details.distributor"
                          label="分销商"
                        >
                          {{ node.details.distributor }}
                        </el-descriptions-item>
                        <el-descriptions-item
                          v-if="node.details.salesArea"
                          label="销售区域"
                        >
                          {{ node.details.salesArea }}
                        </el-descriptions-item>
                      </el-descriptions>
                    </div>

                    <!-- 环境数据 -->
                    <div v-if="node.environment" class="environment-data">
                      <el-divider />
                      <h4>环境监测数据</h4>
                      <el-row :gutter="16">
                        <el-col :span="8">
                          <div class="env-item">
                            <span class="env-label">🌡️ 温度</span>
                            <span
                              class="env-value"
                              :class="{
                                'env-warning': node.environment.temperature > 10 || node.environment.temperature < 0
                              }"
                            >
                              {{ node.environment.temperature }}°C
                            </span>
                          </div>
                        </el-col>
                        <el-col :span="8">
                          <div class="env-item">
                            <span class="env-label">💧 湿度</span>
                            <span class="env-value">
                              {{ node.environment.humidity }}%
                            </span>
                          </div>
                        </el-col>
                        <el-col :span="8">
                          <div class="env-item">
                            <span class="env-label">⏰ 记录时间</span>
                            <span class="env-value">
                              {{ node.environment.recordTime.split(' ')[1] }}
                            </span>
                          </div>
                        </el-col>
                      </el-row>
                    </div>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </div>

          <!-- 地图展示区 -->
          <div class="map-section">
            <h3>🗺️ 实时位置监控</h3>
            <div class="map-placeholder">
              <el-icon :size="60" color="#909399"><Location /></el-icon>
              <p>地图展示区域</p>
              <p class="map-hint">
                此处可集成高德地图/百度地图等第三方地图服务，展示实时位置和轨迹回放
              </p>
              <div class="map-info">
                <el-tag
                  v-for="(node, index) in selectedRecord.trackNodes.filter(n => n.status !== 'pending')"
                  :key="node.id"
                  :type="node.status === 'processing' ? 'primary' : 'success'"
                  style="margin: 4px"
                >
                  站点{{ index + 1 }}: {{ node.location }}
                  <span v-if="node.coordinates">
                    ({{ node.coordinates.lat.toFixed(2) }}, {{ node.coordinates.lng.toFixed(2) }})
                  </span>
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped lang="scss">
.circulation-track-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 100px);

  .query-card {
    margin-bottom: 20px;

    :deep(.el-card__body) {
      padding: 16px 20px;
    }

    .el-form {
      margin-bottom: 0;
    }
  }

  .main-content {
    display: flex;
    gap: 20px;

    .list-card {
      flex: 1;
      min-width: 0;

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

      :deep(.el-table) {
        .el-table__row {
          cursor: pointer;

          &:hover {
            background-color: #f5f7fa;
          }
        }
      }
    }

    .detail-card {
      flex: 1.2;
      min-width: 0;

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

      .empty-state {
        min-height: 400px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .detail-content {
        h3 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: #303133;
        }

        .info-section {
          margin-bottom: 24px;

          .estimated-time {
            display: flex;
            align-items: center;
            gap: 4px;
            color: #409eff;
          }
        }

        .alert-section {
          margin-bottom: 24px;

          .alert-item {
            margin-bottom: 12px;

            .alert-content {
              p {
                margin: 4px 0;
                font-size: 14px;
              }
            }
          }
        }

        .timeline-section {
          margin-bottom: 24px;

          .track-timeline {
            margin-top: 16px;
            padding-left: 8px;

            .timeline-card {
              margin-bottom: 8px;

              .timeline-card-header {
                display: flex;
                align-items: center;
                gap: 8px;

                .stage-icon {
                  font-size: 20px;
                }

                .stage-name {
                  font-size: 16px;
                  font-weight: 600;
                  flex: 1;
                }
              }

              .timeline-card-content {
                p {
                  margin: 8px 0;
                  font-size: 14px;
                  color: #606266;
                }

                .node-details,
                .environment-data {
                  margin-top: 12px;

                  h4 {
                    margin: 8px 0;
                    font-size: 14px;
                    font-weight: 600;
                    color: #606266;
                  }

                  .env-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 12px;
                    background: #f5f7fa;
                    border-radius: 4px;

                    .env-label {
                      font-size: 14px;
                      color: #909399;
                      margin-bottom: 8px;
                    }

                    .env-value {
                      font-size: 18px;
                      font-weight: 600;
                      color: #303133;

                      &.env-warning {
                        color: #f56c6c;
                      }
                    }
                  }
                }
              }
            }
          }
        }

        .map-section {
          .map-placeholder {
            background: #f5f7fa;
            border: 2px dashed #dcdfe6;
            border-radius: 8px;
            padding: 40px;
            text-align: center;
            min-height: 300px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;

            p {
              margin: 8px 0;
              color: #909399;
              font-size: 14px;

              &.map-hint {
                font-size: 12px;
                color: #c0c4cc;
              }
            }

            .map-info {
              margin-top: 20px;
              max-width: 600px;
            }
          }
        }
      }
    }
  }
}

// 响应式布局
@media (max-width: 1400px) {
  .main-content {
    flex-direction: column !important;

    .list-card,
    .detail-card {
      width: 100% !important;
    }
  }
}
</style>