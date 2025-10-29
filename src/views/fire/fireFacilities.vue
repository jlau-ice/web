<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'

// 设备状态类型
type DeviceStatus = 'normal' | 'warning' | 'fault' | 'offline'
// 设备类型
type DeviceType = 'hydrant' | 'extinguisher' | 'smoke' | 'emergency'

// 设备接口
interface Device {
  id: string
  code: string
  type: DeviceType
  typeName: string
  location: string
  area: string
  status: DeviceStatus
  lastCheckTime: string
  pressure?: number
  waterLevel?: number
  validUntil?: string
  position: { x: number; y: number }
}

// 预警信息接口
interface Alert {
  id: string
  deviceCode: string
  deviceType: string
  level: 'high' | 'medium' | 'low'
  message: string
  suggestion: string
  time: string
  handled: boolean
}

// 维护记录接口
interface MaintenanceRecord {
  id: string
  deviceCode: string
  type: 'inspection' | 'repair' | 'replace'
  description: string
  operator: string
  time: string
  result: string
}

// 统计数据
const statistics = reactive({
  total: 0,
  normal: 0,
  warning: 0,
  fault: 0,
  offline: 0
})

// 设备列表
const devices = ref<Device[]>([])
const loading = ref(false)

// 筛选条件
const filters = reactive({
  area: '',
  type: '',
  status: '',
  keyword: ''
})

// 预警列表
const alerts = ref<Alert[]>([])

// 维护记录
const maintenanceRecords = ref<MaintenanceRecord[]>([])

// 选中的设备
const selectedDevice = ref<Device | null>(null)

// 显示详情面板
const showDetailPanel = ref(false)

// 显示维护记录对话框
const showMaintenanceDialog = ref(false)

// 设备类型选项
const deviceTypes = [
  { label: '全部类型', value: '' },
  { label: '消防栓', value: 'hydrant' },
  { label: '灭火器', value: 'extinguisher' },
  { label: '烟感探测器', value: 'smoke' },
  { label: '应急照明', value: 'emergency' }
]

// 区域选项
const areas = [
  { label: '全部区域', value: '' },
  { label: 'A栋1层', value: 'A1' },
  { label: 'A栋2层', value: 'A2' },
  { label: 'B栋1层', value: 'B1' },
  { label: 'B栋2层', value: 'B2' },
  { label: '地下停车场', value: 'P1' }
]

// 状态选项
const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '正常', value: 'normal' },
  { label: '预警', value: 'warning' },
  { label: '故障', value: 'fault' },
  { label: '离线', value: 'offline' }
]

// 获取状态标签类型
const getStatusType = (status: DeviceStatus) => {
  const typeMap = {
    normal: 'success',
    warning: 'warning',
    fault: 'danger',
    offline: 'info'
  }
  return typeMap[status]
}

// 获取状态文本
const getStatusText = (status: DeviceStatus) => {
  const textMap = {
    normal: '正常',
    warning: '预警',
    fault: '故障',
    offline: '离线'
  }
  return textMap[status]
}

// 获取设备类型颜色
const getDeviceTypeColor = (type: DeviceType) => {
  const colorMap = {
    hydrant: '#409eff',
    extinguisher: '#f56c6c',
    smoke: '#e6a23c',
    emergency: '#f7ba2a'
  }
  return colorMap[type]
}

// 获取设备类型图标
const getDeviceTypeIcon = (type: DeviceType) => {
  const iconMap = {
    hydrant: '🚰',
    extinguisher: '🧯',
    smoke: '🔔',
    emergency: '💡'
  }
  return iconMap[type]
}

// 获取预警级别类型
const getAlertLevelType = (level: string) => {
  const typeMap = {
    high: 'danger',
    medium: 'warning',
    low: 'info'
  }
  return typeMap[level as keyof typeof typeMap]
}

// 获取预警级别文本
const getAlertLevelText = (level: string) => {
  const textMap = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return textMap[level as keyof typeof textMap]
}

// 筛选后的设备列表
const filteredDevices = computed(() => {
  return devices.value.filter(device => {
    const areaMatch = !filters.area || device.area === filters.area
    const typeMatch = !filters.type || device.type === filters.type
    const statusMatch = !filters.status || device.status === filters.status
    const keywordMatch = !filters.keyword ||
      device.code.toLowerCase().includes(filters.keyword.toLowerCase()) ||
      device.location.toLowerCase().includes(filters.keyword.toLowerCase())

    return areaMatch && typeMatch && statusMatch && keywordMatch
  })
})

// 未处理的预警
const unhandledAlerts = computed(() => {
  return alerts.value.filter(alert => !alert.handled)
})

// Mock 数据生成
const generateMockData = () => {
  const mockDevices: Device[] = [
    // 消防栓
    { id: '1', code: 'XFS-A1-001', type: 'hydrant', typeName: '消防栓', location: 'A栋1层东侧走廊', area: 'A1', status: 'normal', lastCheckTime: '2025-10-29 10:30', pressure: 0.35, waterLevel: 95, position: { x: 120, y: 80 } },
    { id: '2', code: 'XFS-A1-002', type: 'hydrant', typeName: '消防栓', location: 'A栋1层西侧走廊', area: 'A1', status: 'normal', lastCheckTime: '2025-10-29 10:32', pressure: 0.33, waterLevel: 92, position: { x: 280, y: 80 } },
    { id: '3', code: 'XFS-A2-001', type: 'hydrant', typeName: '消防栓', location: 'A栋2层东侧走廊', area: 'A2', status: 'warning', lastCheckTime: '2025-10-29 10:35', pressure: 0.25, waterLevel: 85, position: { x: 120, y: 180 } },
    { id: '4', code: 'XFS-B1-001', type: 'hydrant', typeName: '消防栓', location: 'B栋1层中央大厅', area: 'B1', status: 'normal', lastCheckTime: '2025-10-29 10:40', pressure: 0.36, waterLevel: 96, position: { x: 450, y: 120 } },

    // 灭火器
    { id: '5', code: 'MHQ-A1-001', type: 'extinguisher', typeName: '灭火器', location: 'A栋1层消防箱', area: 'A1', status: 'normal', lastCheckTime: '2025-10-29 09:15', pressure: 1.2, validUntil: '2026-05-15', position: { x: 150, y: 100 } },
    { id: '6', code: 'MHQ-A1-002', type: 'extinguisher', typeName: '灭火器', location: 'A栋1层楼梯口', area: 'A1', status: 'normal', lastCheckTime: '2025-10-29 09:20', pressure: 1.15, validUntil: '2026-06-20', position: { x: 250, y: 100 } },
    { id: '7', code: 'MHQ-A2-001', type: 'extinguisher', typeName: '灭火器', location: 'A栋2层会议室', area: 'A2', status: 'fault', lastCheckTime: '2025-10-29 09:25', pressure: 0.5, validUntil: '2026-04-10', position: { x: 150, y: 200 } },
    { id: '8', code: 'MHQ-B1-001', type: 'extinguisher', typeName: '灭火器', location: 'B栋1层前台', area: 'B1', status: 'warning', lastCheckTime: '2025-10-29 09:30', pressure: 0.9, validUntil: '2025-12-25', position: { x: 420, y: 100 } },
    { id: '9', code: 'MHQ-P1-001', type: 'extinguisher', typeName: '灭火器', location: '地下停车场入口', area: 'P1', status: 'normal', lastCheckTime: '2025-10-29 09:35', pressure: 1.25, validUntil: '2026-08-30', position: { x: 200, y: 350 } },

    // 烟感探测器
    { id: '10', code: 'YG-A1-001', type: 'smoke', typeName: '烟感探测器', location: 'A栋1层办公区', area: 'A1', status: 'normal', lastCheckTime: '2025-10-29 11:00', position: { x: 180, y: 90 } },
    { id: '11', code: 'YG-A1-002', type: 'smoke', typeName: '烟感探测器', location: 'A栋1层会议室', area: 'A1', status: 'normal', lastCheckTime: '2025-10-29 11:05', position: { x: 220, y: 90 } },
    { id: '12', code: 'YG-A2-001', type: 'smoke', typeName: '烟感探测器', location: 'A栋2层休息区', area: 'A2', status: 'offline', lastCheckTime: '2025-10-28 15:20', position: { x: 180, y: 190 } },
    { id: '13', code: 'YG-B1-001', type: 'smoke', typeName: '烟感探测器', location: 'B栋1层走廊', area: 'B1', status: 'normal', lastCheckTime: '2025-10-29 11:10', position: { x: 480, y: 110 } },
    { id: '14', code: 'YG-P1-001', type: 'smoke', typeName: '烟感探测器', location: '地下停车场A区', area: 'P1', status: 'normal', lastCheckTime: '2025-10-29 11:15', position: { x: 150, y: 330 } },

    // 应急照明
    { id: '15', code: 'YJ-A1-001', type: 'emergency', typeName: '应急照明', location: 'A栋1层安全出口', area: 'A1', status: 'normal', lastCheckTime: '2025-10-29 08:00', position: { x: 100, y: 70 } },
    { id: '16', code: 'YJ-A1-002', type: 'emergency', typeName: '应急照明', location: 'A栋1层疏散通道', area: 'A1', status: 'normal', lastCheckTime: '2025-10-29 08:05', position: { x: 300, y: 70 } },
    { id: '17', code: 'YJ-A2-001', type: 'emergency', typeName: '应急照明', location: 'A栋2层楼梯间', area: 'A2', status: 'warning', lastCheckTime: '2025-10-29 08:10', position: { x: 100, y: 170 } },
    { id: '18', code: 'YJ-B1-001', type: 'emergency', typeName: '应急照明', location: 'B栋1层紧急出口', area: 'B1', status: 'normal', lastCheckTime: '2025-10-29 08:15', position: { x: 500, y: 130 } },
    { id: '19', code: 'YJ-P1-001', type: 'emergency', typeName: '应急照明', location: '地下停车场出口', area: 'P1', status: 'fault', lastCheckTime: '2025-10-29 08:20', position: { x: 250, y: 360 } }
  ]

  const mockAlerts: Alert[] = [
    { id: '1', deviceCode: 'XFS-A2-001', deviceType: '消防栓', level: 'medium', message: '水压低于标准值', suggestion: '检查供水系统，确认是否有泄漏', time: '2025-10-29 10:35', handled: false },
    { id: '2', deviceCode: 'MHQ-A2-001', deviceType: '灭火器', level: 'high', message: '压力严重不足', suggestion: '立即更换或充装，暂时停用该设备', time: '2025-10-29 09:25', handled: false },
    { id: '3', deviceCode: 'MHQ-B1-001', deviceType: '灭火器', level: 'low', message: '即将到期', suggestion: '安排年度检测和维护', time: '2025-10-29 09:30', handled: false },
    { id: '4', deviceCode: 'YG-A2-001', deviceType: '烟感探测器', level: 'high', message: '设备离线超过12小时', suggestion: '检查设备电源和通信连接', time: '2025-10-28 23:20', handled: false },
    { id: '5', deviceCode: 'YJ-A2-001', deviceType: '应急照明', level: 'medium', message: '电池电量不足', suggestion: '更换电池或检查充电系统', time: '2025-10-29 08:10', handled: true },
    { id: '6', deviceCode: 'YJ-P1-001', deviceType: '应急照明', level: 'high', message: '灯具损坏无法点亮', suggestion: '立即更换灯具，确保疏散通道照明', time: '2025-10-29 08:20', handled: false }
  ]

  const mockMaintenance: MaintenanceRecord[] = [
    { id: '1', deviceCode: 'XFS-A1-001', type: 'inspection', description: '例行巡检，设备运行正常', operator: '张伟', time: '2025-10-29 10:30', result: '合格' },
    { id: '2', deviceCode: 'MHQ-A2-001', type: 'repair', description: '压力不足，进行充装', operator: '李明', time: '2025-10-25 14:20', result: '待处理' },
    { id: '3', deviceCode: 'YG-A2-001', type: 'repair', description: '设备离线，更换通信模块', operator: '王强', time: '2025-10-28 16:30', result: '维修中' },
    { id: '4', deviceCode: 'YJ-P1-001', type: 'replace', description: '灯具老化损坏，更换新设备', operator: '赵敏', time: '2025-10-27 09:15', result: '待更换' },
    { id: '5', deviceCode: 'MHQ-A1-001', type: 'inspection', description: '年度检测，压力正常', operator: '张伟', time: '2025-10-20 11:00', result: '合格' }
  ]

  return { mockDevices, mockAlerts, mockMaintenance }
}

// 加载数据
const loadData = () => {
  loading.value = true

  setTimeout(() => {
    const { mockDevices, mockAlerts, mockMaintenance } = generateMockData()
    devices.value = mockDevices
    alerts.value = mockAlerts
    maintenanceRecords.value = mockMaintenance

    // 更新统计数据
    statistics.total = mockDevices.length
    statistics.normal = mockDevices.filter(d => d.status === 'normal').length
    statistics.warning = mockDevices.filter(d => d.status === 'warning').length
    statistics.fault = mockDevices.filter(d => d.status === 'fault').length
    statistics.offline = mockDevices.filter(d => d.status === 'offline').length

    loading.value = false
    ElMessage.success('数据加载成功')
  }, 800)
}

// 查看设备详情
const viewDetail = (device: Device) => {
  selectedDevice.value = device
  showDetailPanel.value = true
}

// 处理预警
const handleAlert = (alert: Alert) => {
  alert.handled = true
  ElMessage.success('预警已标记为处理')
}

// 查看维护记录
const viewMaintenance = (device: Device) => {
  selectedDevice.value = device
  showMaintenanceDialog.value = true
}

// 重置筛选
const resetFilters = () => {
  filters.area = ''
  filters.type = ''
  filters.status = ''
  filters.keyword = ''
}

// 导出报告
const exportReport = () => {
  ElMessage.info('正在生成报告...')
  setTimeout(() => {
    ElMessage.success('报告导出成功')
  }, 1000)
}

// 获取设备维护记录
const getDeviceMaintenance = computed(() => {
  if (!selectedDevice.value) return []
  return maintenanceRecords.value.filter(
    record => record.deviceCode === selectedDevice.value?.code
  )
})

// 页面加载时获取数据
onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="fire-facilities-container">
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="statistics-row">
      <el-col :span="6">
        <el-card class="stat-card total">
          <div class="stat-content">
            <div class="stat-icon">📊</div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.total }}</div>
              <div class="stat-label">设备总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card normal">
          <div class="stat-content">
            <div class="stat-icon">✅</div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.normal }}</div>
              <div class="stat-label">正常运行</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card warning">
          <div class="stat-content">
            <div class="stat-icon">⚠️</div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.warning }}</div>
              <div class="stat-label">预警设备</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card fault">
          <div class="stat-content">
            <div class="stat-icon">❌</div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.fault + statistics.offline }}</div>
              <div class="stat-label">故障/离线</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 主体内容 -->
    <el-row :gutter="16" class="main-content">
      <!-- 左侧：设施分布平面图 -->
      <el-col :span="10">
        <el-card class="floor-plan-card">
          <template #header>
            <div class="card-header">
              <span>设施分布平面图</span>
              <el-button type="primary" size="small" @click="loadData">刷新</el-button>
            </div>
          </template>
          <div class="floor-plan">
            <div class="plan-container">
              <!-- A栋 -->
              <div class="building" style="left: 20px; top: 20px; width: 300px; height: 200px;">
                <div class="building-label">A栋</div>
                <div class="floor" style="top: 0; height: 100px; border-bottom: 2px dashed #ddd;">
                  <span class="floor-label">2层</span>
                </div>
                <div class="floor" style="bottom: 0; height: 100px;">
                  <span class="floor-label">1层</span>
                </div>
              </div>

              <!-- B栋 -->
              <div class="building" style="right: 20px; top: 50px; width: 180px; height: 150px;">
                <div class="building-label">B栋</div>
                <div class="floor" style="top: 0; height: 150px;">
                  <span class="floor-label">1层</span>
                </div>
              </div>

              <!-- 地下停车场 -->
              <div class="building parking" style="left: 80px; bottom: 20px; width: 250px; height: 80px;">
                <div class="building-label">地下停车场</div>
              </div>

              <!-- 设备点位 -->
              <div
                v-for="device in devices"
                :key="device.id"
                class="device-point"
                :class="device.status"
                :style="{
                  left: device.position.x + 'px',
                  top: device.position.y + 'px',
                  backgroundColor: getDeviceTypeColor(device.type)
                }"
                :title="`${device.code} - ${getStatusText(device.status)}`"
                @click="viewDetail(device)"
              >
                <span class="device-icon">{{ getDeviceTypeIcon(device.type) }}</span>
              </div>
            </div>

            <!-- 图例 -->
            <div class="legend">
              <div class="legend-title">设备类型</div>
              <div class="legend-items">
                <div class="legend-item">
                  <span class="legend-dot" style="background: #409eff;">🚰</span>
                  <span>消防栓</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot" style="background: #f56c6c;">🧯</span>
                  <span>灭火器</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot" style="background: #e6a23c;">🔔</span>
                  <span>烟感</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot" style="background: #f7ba2a;">💡</span>
                  <span>应急照明</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 中间：设备列表 -->
      <el-col :span="9">
        <el-card class="device-list-card">
          <template #header>
            <div class="card-header">
              <span>设备监控列表</span>
            </div>
          </template>

          <!-- 筛选区域 -->
          <div class="filter-section">
            <el-row :gutter="10">
              <el-col :span="12">
                <el-select v-model="filters.area" placeholder="选择区域" size="small" style="width: 100%">
                  <el-option
                    v-for="area in areas"
                    :key="area.value"
                    :label="area.label"
                    :value="area.value"
                  />
                </el-select>
              </el-col>
              <el-col :span="12">
                <el-select v-model="filters.type" placeholder="设备类型" size="small" style="width: 100%">
                  <el-option
                    v-for="type in deviceTypes"
                    :key="type.value"
                    :label="type.label"
                    :value="type.value"
                  />
                </el-select>
              </el-col>
            </el-row>
            <el-row :gutter="10" style="margin-top: 10px;">
              <el-col :span="12">
                <el-select v-model="filters.status" placeholder="设备状态" size="small" style="width: 100%">
                  <el-option
                    v-for="status in statusOptions"
                    :key="status.value"
                    :label="status.label"
                    :value="status.value"
                  />
                </el-select>
              </el-col>
              <el-col :span="12">
                <el-input
                  v-model="filters.keyword"
                  placeholder="搜索设备编号"
                  size="small"
                  clearable
                />
              </el-col>
            </el-row>
            <el-row style="margin-top: 10px;">
              <el-button size="small" @click="resetFilters">重置</el-button>
              <el-button type="primary" size="small" @click="exportReport">导出报告</el-button>
            </el-row>
          </div>

          <!-- 设备表格 -->
          <el-table
            :data="filteredDevices"
            style="width: 100%; margin-top: 15px;"
            height="550"
            v-loading="loading"
          >
            <el-table-column prop="code" label="设备编号" width="130" />
            <el-table-column prop="typeName" label="类型" width="100">
              <template #default="{ row }">
                <el-tag :color="getDeviceTypeColor(row.type)" size="small" style="color: white;">
                  {{ getDeviceTypeIcon(row.type) }} {{ row.typeName }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="location" label="位置" width="150" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="140" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="viewDetail(row)">详情</el-button>
                <el-button link type="primary" size="small" @click="viewMaintenance(row)">维护</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 右侧：详情和预警面板 -->
      <el-col :span="5">
        <!-- 设备详情 -->
        <el-card class="detail-card" v-if="showDetailPanel && selectedDevice">
          <template #header>
            <div class="card-header">
              <span>设备详情</span>
              <el-button text size="small" @click="showDetailPanel = false">关闭</el-button>
            </div>
          </template>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="设备编号">{{ selectedDevice.code }}</el-descriptions-item>
            <el-descriptions-item label="设备类型">{{ selectedDevice.typeName }}</el-descriptions-item>
            <el-descriptions-item label="安装位置">{{ selectedDevice.location }}</el-descriptions-item>
            <el-descriptions-item label="所属区域">{{ selectedDevice.area }}</el-descriptions-item>
            <el-descriptions-item label="当前状态">
              <el-tag :type="getStatusType(selectedDevice.status)" size="small">
                {{ getStatusText(selectedDevice.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="最后检测">{{ selectedDevice.lastCheckTime }}</el-descriptions-item>
            <el-descriptions-item label="水压" v-if="selectedDevice.type === 'hydrant'">
              {{ selectedDevice.pressure }} MPa
              <el-progress
                :percentage="(selectedDevice.pressure! / 0.4) * 100"
                :color="selectedDevice.pressure! > 0.3 ? '#67c23a' : '#e6a23c'"
                :show-text="false"
                style="margin-top: 5px;"
              />
            </el-descriptions-item>
            <el-descriptions-item label="水位" v-if="selectedDevice.type === 'hydrant'">
              {{ selectedDevice.waterLevel }}%
              <el-progress
                :percentage="selectedDevice.waterLevel!"
                :color="selectedDevice.waterLevel! > 90 ? '#67c23a' : '#e6a23c'"
                :show-text="false"
                style="margin-top: 5px;"
              />
            </el-descriptions-item>
            <el-descriptions-item label="压力" v-if="selectedDevice.type === 'extinguisher'">
              {{ selectedDevice.pressure }} MPa
              <el-progress
                :percentage="(selectedDevice.pressure! / 1.5) * 100"
                :color="selectedDevice.pressure! > 1.0 ? '#67c23a' : '#f56c6c'"
                :show-text="false"
                style="margin-top: 5px;"
              />
            </el-descriptions-item>
            <el-descriptions-item label="有效期" v-if="selectedDevice.type === 'extinguisher'">
              {{ selectedDevice.validUntil }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 异常预警 -->
        <el-card class="alert-card" :style="{ marginTop: showDetailPanel ? '16px' : '0' }">
          <template #header>
            <div class="card-header">
              <span>异常预警 ({{ unhandledAlerts.length }})</span>
            </div>
          </template>
          <div class="alert-list">
            <el-alert
              v-for="alert in alerts.slice(0, 5)"
              :key="alert.id"
              :title="`${alert.deviceCode} - ${alert.message}`"
              :type="getAlertLevelType(alert.level)"
              :description="alert.suggestion"
              :closable="false"
              style="margin-bottom: 10px;"
            >
              <template #default>
                <div class="alert-content">
                  <div class="alert-info">
                    <div class="alert-header">
                      <el-tag :type="getAlertLevelType(alert.level)" size="small">
                        {{ getAlertLevelText(alert.level) }}级
                      </el-tag>
                      <span class="alert-device">{{ alert.deviceCode }}</span>
                    </div>
                    <div class="alert-message">{{ alert.message }}</div>
                    <div class="alert-suggestion">建议: {{ alert.suggestion }}</div>
                    <div class="alert-footer">
                      <span class="alert-time">{{ alert.time }}</span>
                      <el-button
                        v-if="!alert.handled"
                        link
                        type="primary"
                        size="small"
                        @click="handleAlert(alert)"
                      >
                        标记处理
                      </el-button>
                      <el-tag v-else type="success" size="small">已处理</el-tag>
                    </div>
                  </div>
                </div>
              </template>
            </el-alert>
            <div v-if="alerts.length === 0" class="empty-alert">
              暂无预警信息
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 维护记录对话框 -->
    <el-dialog
      v-model="showMaintenanceDialog"
      title="维护记录"
      width="800px"
    >
      <div v-if="selectedDevice">
        <div class="maintenance-header">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="设备编号">{{ selectedDevice.code }}</el-descriptions-item>
            <el-descriptions-item label="设备类型">{{ selectedDevice.typeName }}</el-descriptions-item>
            <el-descriptions-item label="安装位置" :span="2">{{ selectedDevice.location }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <el-divider />

        <el-timeline>
          <el-timeline-item
            v-for="record in getDeviceMaintenance"
            :key="record.id"
            :timestamp="record.time"
            placement="top"
          >
            <el-card>
              <div class="maintenance-record">
                <div class="record-header">
                  <el-tag v-if="record.type === 'inspection'" type="info" size="small">巡检</el-tag>
                  <el-tag v-else-if="record.type === 'repair'" type="warning" size="small">维修</el-tag>
                  <el-tag v-else type="danger" size="small">更换</el-tag>
                  <span class="record-operator">操作人: {{ record.operator }}</span>
                </div>
                <div class="record-description">{{ record.description }}</div>
                <div class="record-result">
                  处理结果:
                  <el-tag
                    :type="record.result === '合格' ? 'success' : 'warning'"
                    size="small"
                  >
                    {{ record.result }}
                  </el-tag>
                </div>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>

        <div v-if="getDeviceMaintenance.length === 0" class="empty-maintenance">
          暂无维护记录
        </div>
      </div>

      <template #footer>
        <el-button @click="showMaintenanceDialog = false">关闭</el-button>
        <el-button type="primary">添加记录</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.fire-facilities-container {

  // 统计卡片
  .statistics-row {
    margin-bottom: 16px;
  }

  .stat-card {
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .stat-content {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .stat-icon {
      font-size: 36px;
    }

    .stat-info {
      flex: 1;
    }

    .stat-value {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .stat-label {
      font-size: 14px;
      color: #909399;
    }

    &.total {
      .stat-value {
        color: #409eff;
      }
    }

    &.normal {
      .stat-value {
        color: #67c23a;
      }
    }

    &.warning {
      .stat-value {
        color: #e6a23c;
      }
    }

    &.fault {
      .stat-value {
        color: #f56c6c;
      }
    }
  }

  // 卡片头部
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
  }

  // 平面图
  .floor-plan {
    position: relative;
    height: 600px;

    .plan-container {
      position: relative;
      width: 100%;
      height: 520px;
      background: #f0f2f5;
      border: 2px solid #d9d9d9;
      border-radius: 8px;
      overflow: hidden;
    }

    .building {
      position: absolute;
      background: white;
      border: 2px solid #1890ff;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

      &.parking {
        background: #e8f4ff;
        border-color: #69b1ff;
      }
    }

    .building-label {
      position: absolute;
      top: 5px;
      left: 10px;
      font-weight: bold;
      color: #1890ff;
      font-size: 14px;
    }

    .floor {
      position: absolute;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .floor-label {
      color: #999;
      font-size: 12px;
    }

    .device-point {
      position: absolute;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s;
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      font-size: 12px;
      transform: translate(-50%, -50%);

      &:hover {
        transform: translate(-50%, -50%) scale(1.3);
        z-index: 10;
      }

      &.warning {
        animation: pulse-warning 2s infinite;
      }

      &.fault {
        animation: pulse-fault 1s infinite;
      }

      &.offline {
        opacity: 0.5;
      }
    }

    .legend {
      margin-top: 15px;
      padding: 10px;
      background: white;
      border-radius: 4px;
      border: 1px solid #e8e8e8;

      .legend-title {
        font-weight: bold;
        margin-bottom: 8px;
        font-size: 13px;
      }

      .legend-items {
        display: flex;
        gap: 15px;
        flex-wrap: wrap;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 12px;

        .legend-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: white;
        }
      }
    }
  }

  // 筛选区域
  .filter-section {
    padding: 15px;
    background: #f5f7fa;
    border-radius: 4px;
  }

  // 设备列表卡片
  .device-list-card {
    height: 780px;

    :deep(.el-card__body) {
      padding: 15px;
    }
  }

  // 详情卡片
  .detail-card {
    margin-bottom: 16px;

    :deep(.el-descriptions__label) {
      width: 80px;
    }
  }

  // 预警卡片
  .alert-card {
    .alert-list {
      max-height: 520px;
      overflow-y: auto;
    }

    .alert-content {
      padding: 8px 0;
    }

    .alert-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .alert-device {
      font-weight: bold;
      font-size: 13px;
    }

    .alert-message {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 6px;
    }

    .alert-suggestion {
      font-size: 12px;
      color: #666;
      margin-bottom: 8px;
      line-height: 1.5;
    }

    .alert-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #f0f0f0;
    }

    .alert-time {
      font-size: 11px;
      color: #999;
    }

    .empty-alert {
      text-align: center;
      padding: 40px 0;
      color: #999;
    }
  }

  // 维护记录
  .maintenance-header {
    margin-bottom: 15px;
  }

  .maintenance-record {
    .record-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }

    .record-operator {
      font-size: 13px;
      color: #666;
    }

    .record-description {
      margin-bottom: 10px;
      line-height: 1.5;
    }

    .record-result {
      font-size: 13px;
      color: #666;
    }
  }

  .empty-maintenance {
    text-align: center;
    padding: 40px 0;
    color: #999;
  }

  // 动画
  @keyframes pulse-warning {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(230, 162, 60, 0.7);
    }
    50% {
      box-shadow: 0 0 0 8px rgba(230, 162, 60, 0);
    }
  }

  @keyframes pulse-fault {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.7);
    }
    50% {
      box-shadow: 0 0 0 10px rgba(245, 108, 108, 0);
    }
  }
}
</style>
