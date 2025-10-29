<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  Search,
  Plus,
  Edit,
  Delete,
  Download,
  Upload,
  Refresh,
  View,
  Setting,
  Connection,
  Location,
  CircleCheck,
  CircleClose,
  Warning,
  Tools
} from '@element-plus/icons-vue'

// 设备状态枚举
enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance',
  ERROR = 'error'
}

// 设备类型定义
interface Device {
  id: string
  name: string
  model: string
  location: string
  status: DeviceStatus
  lastReportTime: string
  ip: string
  mac: string
  cpu: string
  memory: string
  storage: string
  gpu: string
  bandwidth: string
  latitude: number
  longitude: number
  deployTime: string
  group: string
  tags: string[]
  relations: string[]
  changeHistory: ChangeHistory[]
}

interface ChangeHistory {
  time: string
  operator: string
  action: string
  detail: string
}

interface DeviceGroup {
  id: string
  name: string
  type: 'region' | 'type' | 'business'
  deviceCount: number
}

// 搜索和筛选条件
const searchForm = reactive({
  keyword: '',
  status: '',
  location: ''
})

// 分页配置
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 设备列表数据
const deviceList = ref<Device[]>([])
const loading = ref(false)

// 详情抽屉
const detailDrawer = ref(false)
const currentDevice = ref<Device | null>(null)
const activeTab = ref('basic')

// 编辑/新增对话框
const dialogVisible = ref(false)
const dialogTitle = ref('新增设备')
const deviceFormRef = ref<FormInstance>()
const deviceForm = reactive<Partial<Device>>({
  id: '',
  name: '',
  model: '',
  location: '',
  status: DeviceStatus.OFFLINE,
  ip: '',
  mac: '',
  cpu: '',
  memory: '',
  storage: '',
  gpu: '',
  bandwidth: '',
  latitude: 0,
  longitude: 0,
  deployTime: '',
  group: '',
  tags: []
})

// 表单验证规则
const deviceFormRules: FormRules = {
  name: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  model: [{ required: true, message: '请输入设备型号', trigger: 'blur' }],
  location: [{ required: true, message: '请输入部署位置', trigger: 'blur' }],
  ip: [
    { required: true, message: '请输入IP地址', trigger: 'blur' },
    {
      pattern: /^(\d{1,3}\.){3}\d{1,3}$/,
      message: 'IP地址格式不正确',
      trigger: 'blur'
    }
  ],
  mac: [{ required: true, message: '请输入MAC地址', trigger: 'blur' }]
}

// 分组管理对话框
const groupDialogVisible = ref(false)
const deviceGroups = ref<DeviceGroup[]>([])
const selectedDevices = ref<string[]>([])
const selectedGroup = ref('')

// 批量操作选中的设备
const multipleSelection = ref<Device[]>([])

// 变更历史对话框
const historyDialogVisible = ref(false)

// 获取状态标签类型
const getStatusType = (status: DeviceStatus) => {
  const statusMap = {
    [DeviceStatus.ONLINE]: 'success',
    [DeviceStatus.OFFLINE]: 'info',
    [DeviceStatus.MAINTENANCE]: 'warning',
    [DeviceStatus.ERROR]: 'danger'
  }
  return statusMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status: DeviceStatus) => {
  const statusMap = {
    [DeviceStatus.ONLINE]: '在线',
    [DeviceStatus.OFFLINE]: '离线',
    [DeviceStatus.MAINTENANCE]: '维护中',
    [DeviceStatus.ERROR]: '异常'
  }
  return statusMap[status] || '未知'
}

// 获取状态图标
const getStatusIcon = (status: DeviceStatus) => {
  const statusMap = {
    [DeviceStatus.ONLINE]: CircleCheck,
    [DeviceStatus.OFFLINE]: CircleClose,
    [DeviceStatus.MAINTENANCE]: Tools,
    [DeviceStatus.ERROR]: Warning
  }
  return statusMap[status] || CircleClose
}

// Mock 数据生成
const generateMockDevices = (): Device[] => {
  const locations = ['北京机房A', '上海机房B', '深圳机房C', '广州机房D', '杭州机房E']
  const models = ['EdgeBox-X1', 'EdgeBox-X2', 'EdgeBox-Pro', 'EdgeBox-Ultra']
  const statuses = [
    DeviceStatus.ONLINE,
    DeviceStatus.OFFLINE,
    DeviceStatus.MAINTENANCE,
    DeviceStatus.ERROR
  ]
  const groups = ['华东区', '华南区', '华北区', '西南区']
  const tags = [
    ['高性能', 'GPU'],
    ['标准型', 'CPU'],
    ['经济型'],
    ['企业级', 'AI'],
    ['边缘计算']
  ]

  return Array.from({ length: 50 }, (_, i) => ({
    id: `EDGE-${String(i + 1).padStart(5, '0')}`,
    name: `边缘设备-${i + 1}`,
    model: models[Math.floor(Math.random() * models.length)],
    location: locations[Math.floor(Math.random() * locations.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    lastReportTime: new Date(Date.now() - Math.random() * 86400000).toLocaleString('zh-CN'),
    ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    mac: `00:1A:2B:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}`.toUpperCase(),
    cpu: `Intel Xeon ${4 + Math.floor(Math.random() * 8)}核`,
    memory: `${16 * (1 + Math.floor(Math.random() * 4))}GB`,
    storage: `${256 * (1 + Math.floor(Math.random() * 4))}GB SSD`,
    gpu: Math.random() > 0.5 ? `NVIDIA Tesla T4` : '无',
    bandwidth: `${100 * (1 + Math.floor(Math.random() * 10))}Mbps`,
    latitude: 39.9 + Math.random() * 10,
    longitude: 116.4 + Math.random() * 10,
    deployTime: new Date(Date.now() - Math.random() * 365 * 86400000).toLocaleDateString('zh-CN'),
    group: groups[Math.floor(Math.random() * groups.length)],
    tags: tags[Math.floor(Math.random() * tags.length)],
    relations: Array.from(
      { length: Math.floor(Math.random() * 3) },
      (_, j) => `EDGE-${String(Math.floor(Math.random() * 50) + 1).padStart(5, '0')}`
    ),
    changeHistory: [
      {
        time: new Date(Date.now() - 86400000).toLocaleString('zh-CN'),
        operator: '管理员',
        action: '修改配置',
        detail: '更新网络配置'
      },
      {
        time: new Date(Date.now() - 7 * 86400000).toLocaleString('zh-CN'),
        operator: '系统',
        action: '状态变更',
        detail: '设备上线'
      }
    ]
  }))
}

// Mock 分组数据
const generateMockGroups = (): DeviceGroup[] => {
  return [
    { id: '1', name: '华东区', type: 'region', deviceCount: 15 },
    { id: '2', name: '华南区', type: 'region', deviceCount: 12 },
    { id: '3', name: '华北区', type: 'region', deviceCount: 10 },
    { id: '4', name: '西南区', type: 'region', deviceCount: 8 },
    { id: '5', name: 'AI业务组', type: 'business', deviceCount: 20 },
    { id: '6', name: '视频分析组', type: 'business', deviceCount: 18 }
  ]
}

// 计算过滤后的设备列表
const filteredDevices = computed(() => {
  let result = deviceList.value

  if (searchForm.keyword) {
    const keyword = searchForm.keyword.toLowerCase()
    result = result.filter(
      (device) =>
        device.id.toLowerCase().includes(keyword) ||
        device.name.toLowerCase().includes(keyword)
    )
  }

  if (searchForm.status) {
    result = result.filter((device) => device.status === searchForm.status)
  }

  if (searchForm.location) {
    result = result.filter((device) => device.location === searchForm.location)
  }

  return result
})

// 分页后的数据
const pagedDevices = computed(() => {
  const start = (pagination.currentPage - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  pagination.total = filteredDevices.value.length
  return filteredDevices.value.slice(start, end)
})

// 获取所有位置选项（用于筛选）
const locationOptions = computed(() => {
  return Array.from(new Set(deviceList.value.map((device) => device.location)))
})

// 加载设备列表
const loadDevices = async () => {
  loading.value = true
  // 模拟异步加载
  await new Promise((resolve) => setTimeout(resolve, 500))
  deviceList.value = generateMockDevices()
  deviceGroups.value = generateMockGroups()
  loading.value = false
}

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1
}

// 重置搜索
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.location = ''
  pagination.currentPage = 1
}

// 查看设备详情
const handleViewDetail = (row: Device) => {
  currentDevice.value = { ...row }
  activeTab.value = 'basic'
  detailDrawer.value = true
}

// 新增设备
const handleAdd = () => {
  dialogTitle.value = '新增设备'
  Object.assign(deviceForm, {
    id: '',
    name: '',
    model: '',
    location: '',
    status: DeviceStatus.OFFLINE,
    ip: '',
    mac: '',
    cpu: '',
    memory: '',
    storage: '',
    gpu: '',
    bandwidth: '',
    latitude: 0,
    longitude: 0,
    deployTime: '',
    group: '',
    tags: []
  })
  dialogVisible.value = true
}

// 编辑设备
const handleEdit = (row: Device) => {
  dialogTitle.value = '编辑设备'
  Object.assign(deviceForm, { ...row })
  dialogVisible.value = true
}

// 删除设备
const handleDelete = async (row: Device) => {
  try {
    await ElMessageBox.confirm(`确定要删除设备 "${row.name}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    // 模拟删除
    await new Promise((resolve) => setTimeout(resolve, 300))
    const index = deviceList.value.findIndex((d) => d.id === row.id)
    if (index > -1) {
      deviceList.value.splice(index, 1)
    }
    ElMessage.success('删除成功')
  } catch {
    // 取消删除
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (multipleSelection.value.length === 0) {
    ElMessage.warning('请先选择要删除的设备')
    return
  }

  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${multipleSelection.value.length} 个设备吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    // 模拟批量删除
    await new Promise((resolve) => setTimeout(resolve, 500))
    const ids = multipleSelection.value.map((d) => d.id)
    deviceList.value = deviceList.value.filter((d) => !ids.includes(d.id))
    multipleSelection.value = []
    ElMessage.success('批量删除成功')
  } catch {
    // 取消删除
  }
}

// 保存设备信息
const handleSave = async () => {
  if (!deviceFormRef.value) return

  await deviceFormRef.value.validate(async (valid) => {
    if (!valid) return

    // 模拟保存
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (dialogTitle.value === '新增设备') {
      const newDevice: Device = {
        ...(deviceForm as Device),
        id: `EDGE-${String(deviceList.value.length + 1).padStart(5, '0')}`,
        lastReportTime: new Date().toLocaleString('zh-CN'),
        relations: [],
        changeHistory: [
          {
            time: new Date().toLocaleString('zh-CN'),
            operator: '管理员',
            action: '创建设备',
            detail: '新增设备档案'
          }
        ]
      }
      deviceList.value.unshift(newDevice)
      ElMessage.success('新增成功')
    } else {
      const index = deviceList.value.findIndex((d) => d.id === deviceForm.id)
      if (index > -1) {
        deviceList.value[index] = { ...deviceList.value[index], ...(deviceForm as Device) }
        deviceList.value[index].changeHistory.unshift({
          time: new Date().toLocaleString('zh-CN'),
          operator: '管理员',
          action: '修改信息',
          detail: '更新设备档案'
        })
      }
      ElMessage.success('修改成功')
    }

    dialogVisible.value = false
  })
}

// 导出设备
const handleExport = async () => {
  ElMessage.info('正在导出设备数据...')
  await new Promise((resolve) => setTimeout(resolve, 1000))
  ElMessage.success('导出成功')
}

// 导入设备
const handleImport = () => {
  ElMessage.info('批量导入功能')
}

// 批量分组
const handleBatchGroup = () => {
  if (multipleSelection.value.length === 0) {
    ElMessage.warning('请先选择要分组的设备')
    return
  }
  selectedDevices.value = multipleSelection.value.map((d) => d.id)
  selectedGroup.value = ''
  groupDialogVisible.value = true
}

// 确认分组
const handleConfirmGroup = async () => {
  if (!selectedGroup.value) {
    ElMessage.warning('请选择分组')
    return
  }

  await new Promise((resolve) => setTimeout(resolve, 500))
  const groupName = deviceGroups.value.find((g) => g.id === selectedGroup.value)?.name || ''

  selectedDevices.value.forEach((deviceId) => {
    const device = deviceList.value.find((d) => d.id === deviceId)
    if (device) {
      device.group = groupName
    }
  })

  ElMessage.success('分组成功')
  groupDialogVisible.value = false
  multipleSelection.value = []
}

// 查看变更历史
const handleViewHistory = (row: Device) => {
  currentDevice.value = { ...row }
  historyDialogVisible.value = true
}

// 表格选择改变
const handleSelectionChange = (val: Device[]) => {
  multipleSelection.value = val
}

// 刷新
const handleRefresh = () => {
  loadDevices()
}

// 页面加载时获取数据
onMounted(() => {
  loadDevices()
})
</script>

<template>
  <div class="device-archive-container">
    <!-- 搜索和操作区 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="设备ID或名称"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 150px"
          >
            <el-option label="在线" :value="DeviceStatus.ONLINE" />
            <el-option label="离线" :value="DeviceStatus.OFFLINE" />
            <el-option label="维护中" :value="DeviceStatus.MAINTENANCE" />
            <el-option label="异常" :value="DeviceStatus.ERROR" />
          </el-select>
        </el-form-item>
        <el-form-item label="部署位置">
          <el-select
            v-model="searchForm.location"
            placeholder="请选择位置"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="location in locationOptions"
              :key="location"
              :label="location"
              :value="location"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="operation-buttons">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增设备</el-button>
        <el-button :icon="Download" @click="handleExport">导出</el-button>
        <el-button :icon="Upload" @click="handleImport">批量导入</el-button>
        <el-button
          type="danger"
          :icon="Delete"
          :disabled="multipleSelection.length === 0"
          @click="handleBatchDelete"
        >
          批量删除
        </el-button>
        <el-button
          type="success"
          :icon="Setting"
          :disabled="multipleSelection.length === 0"
          @click="handleBatchGroup"
        >
          批量分组
        </el-button>
        <el-button :icon="Refresh" @click="handleRefresh">刷新</el-button>
      </div>
    </el-card>

    <!-- 设备列表 -->
    <el-card class="table-card" shadow="never">
      <el-table
        :data="pagedDevices"
        v-loading="loading"
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
        @row-click="handleViewDetail"
        class="device-table"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="设备ID" fixed />
        <el-table-column prop="name" label="设备名称" />
        <el-table-column prop="model" label="设备型号" />
        <el-table-column prop="location" label="部署位置" />
        <el-table-column label="在线状态" >
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" :icon="getStatusIcon(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastReportTime" label="最后上报时间" width="180" />
        <el-table-column prop="group" label="所属分组" width="120" />
        <el-table-column label="标签" width="180">
          <template #default="{ row }">
            <el-tag
              v-for="tag in row.tags"
              :key="tag"
              size="small"
              style="margin-right: 5px"
            >
              {{ tag }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              :icon="View"
              @click.stop="handleViewDetail(row)"
            >
              详情
            </el-button>
            <el-button
              type="primary"
              link
              :icon="Edit"
              @click.stop="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              link
              :icon="Delete"
              @click.stop="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </el-card>

    <!-- 设备详情抽屉 -->
    <el-drawer
      v-model="detailDrawer"
      title="设备详情"
      size="60%"
      destroy-on-close
    >
      <div v-if="currentDevice" class="device-detail">
        <el-tabs v-model="activeTab" type="border-card">
          <!-- 基础信息 -->
          <el-tab-pane label="基础信息" name="basic">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="设备ID">
                {{ currentDevice.id }}
              </el-descriptions-item>
              <el-descriptions-item label="设备名称">
                {{ currentDevice.name }}
              </el-descriptions-item>
              <el-descriptions-item label="设备型号">
                {{ currentDevice.model }}
              </el-descriptions-item>
              <el-descriptions-item label="在线状态">
                <el-tag :type="getStatusType(currentDevice.status)">
                  {{ getStatusText(currentDevice.status) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="所属分组">
                {{ currentDevice.group }}
              </el-descriptions-item>
              <el-descriptions-item label="设备标签">
                <el-tag
                  v-for="tag in currentDevice.tags"
                  :key="tag"
                  size="small"
                  style="margin-right: 5px"
                >
                  {{ tag }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="最后上报时间" :span="2">
                {{ currentDevice.lastReportTime }}
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>

          <!-- 硬件配置 -->
          <el-tab-pane label="硬件配置" name="hardware">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="CPU">
                {{ currentDevice.cpu }}
              </el-descriptions-item>
              <el-descriptions-item label="内存">
                {{ currentDevice.memory }}
              </el-descriptions-item>
              <el-descriptions-item label="存储">
                {{ currentDevice.storage }}
              </el-descriptions-item>
              <el-descriptions-item label="GPU">
                {{ currentDevice.gpu }}
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>

          <!-- 网络配置 -->
          <el-tab-pane label="网络配置" name="network">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="IP地址">
                {{ currentDevice.ip }}
              </el-descriptions-item>
              <el-descriptions-item label="MAC地址">
                {{ currentDevice.mac }}
              </el-descriptions-item>
              <el-descriptions-item label="网络带宽">
                {{ currentDevice.bandwidth }}
              </el-descriptions-item>
              <el-descriptions-item label="连接状态">
                <el-tag :type="currentDevice.status === DeviceStatus.ONLINE ? 'success' : 'danger'">
                  {{ currentDevice.status === DeviceStatus.ONLINE ? '已连接' : '未连接' }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>

          <!-- 部署信息 -->
          <el-tab-pane label="部署信息" name="deploy">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="部署位置">
                {{ currentDevice.location }}
              </el-descriptions-item>
              <el-descriptions-item label="部署时间">
                {{ currentDevice.deployTime }}
              </el-descriptions-item>
              <el-descriptions-item label="纬度">
                {{ currentDevice.latitude.toFixed(6) }}
              </el-descriptions-item>
              <el-descriptions-item label="经度">
                {{ currentDevice.longitude.toFixed(6) }}
              </el-descriptions-item>
              <el-descriptions-item label="关联设备" :span="2">
                <el-tag
                  v-for="rel in currentDevice.relations"
                  :key="rel"
                  size="small"
                  style="margin-right: 5px"
                >
                  {{ rel }}
                </el-tag>
                <span v-if="currentDevice.relations.length === 0" class="text-gray-400">无</span>
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>

          <!-- 变更历史 -->
          <el-tab-pane label="变更历史" name="history">
            <el-timeline>
              <el-timeline-item
                v-for="(item, index) in currentDevice.changeHistory"
                :key="index"
                :timestamp="item.time"
                placement="top"
              >
                <el-card>
                  <h4>{{ item.action }}</h4>
                  <p>操作人: {{ item.operator }}</p>
                  <p>详情: {{ item.detail }}</p>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-drawer>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      destroy-on-close
    >
      <el-form
        ref="deviceFormRef"
        :model="deviceForm"
        :rules="deviceFormRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备名称" prop="name">
              <el-input v-model="deviceForm.name" placeholder="请输入设备名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备型号" prop="model">
              <el-input v-model="deviceForm.model" placeholder="请输入设备型号" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="部署位置" prop="location">
              <el-input v-model="deviceForm.location" placeholder="请输入部署位置" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备状态" prop="status">
              <el-select v-model="deviceForm.status" placeholder="请选择状态" style="width: 100%">
                <el-option label="在线" :value="DeviceStatus.ONLINE" />
                <el-option label="离线" :value="DeviceStatus.OFFLINE" />
                <el-option label="维护中" :value="DeviceStatus.MAINTENANCE" />
                <el-option label="异常" :value="DeviceStatus.ERROR" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="IP地址" prop="ip">
              <el-input v-model="deviceForm.ip" placeholder="请输入IP地址" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="MAC地址" prop="mac">
              <el-input v-model="deviceForm.mac" placeholder="请输入MAC地址" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="CPU">
              <el-input v-model="deviceForm.cpu" placeholder="如: Intel Xeon 8核" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="内存">
              <el-input v-model="deviceForm.memory" placeholder="如: 32GB" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="存储">
              <el-input v-model="deviceForm.storage" placeholder="如: 512GB SSD" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="GPU">
              <el-input v-model="deviceForm.gpu" placeholder="如: NVIDIA Tesla T4" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="网络带宽">
              <el-input v-model="deviceForm.bandwidth" placeholder="如: 1000Mbps" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属分组">
              <el-select v-model="deviceForm.group" placeholder="请选择分组" style="width: 100%">
                <el-option
                  v-for="group in deviceGroups"
                  :key="group.id"
                  :label="group.name"
                  :value="group.name"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="纬度">
              <el-input-number
                v-model="deviceForm.latitude"
                :precision="6"
                :step="0.000001"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="经度">
              <el-input-number
                v-model="deviceForm.longitude"
                :precision="6"
                :step="0.000001"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量分组对话框 -->
    <el-dialog
      v-model="groupDialogVisible"
      title="批量分组"
      width="500px"
      destroy-on-close
    >
      <div class="group-dialog-content">
        <p class="mb-4">已选择 {{ selectedDevices.length }} 个设备</p>
        <el-form label-width="100px">
          <el-form-item label="选择分组">
            <el-select v-model="selectedGroup" placeholder="请选择分组" style="width: 100%">
              <el-option
                v-for="group in deviceGroups"
                :key="group.id"
                :label="`${group.name} (${group.deviceCount}台)`"
                :value="group.id"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="groupDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmGroup">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.device-archive-container {
s
  .search-card {
    margin-bottom: 20px;

    .operation-buttons {
      margin-top: 16px;
      display: flex;
      gap: 10px;
    }
  }

  .table-card {
    .device-table {
      cursor: pointer;

      :deep(.el-table__row) {
        &:hover {
          background-color: #f5f7fa;
        }
      }
    }

    .pagination-container {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }

  .device-detail {
    .el-tabs {
      :deep(.el-descriptions__label) {
        font-weight: 600;
      }

      :deep(.el-timeline) {
        padding-left: 20px;
      }
    }
  }

  .group-dialog-content {
    padding: 20px 0;

    .mb-4 {
      margin-bottom: 16px;
      font-size: 14px;
      color: #606266;
    }
  }
}
</style>