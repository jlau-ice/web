<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

interface LoadStrategy {
  id: string
  name: string
  algorithm: 'roundRobin' | 'weightedRoundRobin' | 'leastConnection' | 'hashBased'
  deviceGroup: string
  status: 'active' | 'inactive'
  lastRunTime: string
  threshold: number
  description?: string
}

interface DeviceLoad {
  deviceId: string
  deviceName: string
  group: string
  cpu: number
  memory: number
  network: number
  connections: number
  status: 'normal' | 'warning' | 'overload'
}

interface AlgorithmConfig {
  roundRobinInterval?: number
  weights?: Record<string, number>
  maxConnections?: number
  hashStrategy?: string
}

interface PerformanceMetrics {
  successRate: number
  efficiency: number
  balanceScore: number
  avgResponseTime: number
}

const loading = ref(false)
const tableData = ref<LoadStrategy[]>([])
const deviceLoadData = ref<DeviceLoad[]>([])
const searchKeyword = ref('')
const filterAlgorithm = ref<string>('')
const filterStatus = ref<'active' | 'inactive' | ''>('')

const algorithmOptions = [
  { value: 'roundRobin', label: '轮询', icon: 'Refresh' },
  { value: 'weightedRoundRobin', label: '加权轮询', icon: 'ScaleToOriginal' },
  { value: 'leastConnection', label: '最少连接', icon: 'Connection' },
  { value: 'hashBased', label: '哈希分配', icon: 'Key' }
]

const deviceGroupOptions = [
  { value: 'group-a', label: '设备组 A' },
  { value: 'group-b', label: '设备组 B' },
  { value: 'group-c', label: '设备组 C' },
  { value: 'group-d', label: '设备组 D' }
]

const dialogVisible = ref(false)
const dialogTitle = ref('新增负载策略')
const formRef = ref<FormInstance>()
const formData = reactive<Partial<LoadStrategy> & { weights?: Record<string, number> }>({
  name: '',
  algorithm: 'roundRobin',
  deviceGroup: '',
  status: 'active',
  threshold: 80,
  description: '',
  weights: {}
})

const formRules: FormRules = {
  name: [{ required: true, message: '请输入策略名称', trigger: 'blur' }],
  algorithm: [{ required: true, message: '请选择均衡算法', trigger: 'change' }],
  deviceGroup: [{ required: true, message: '请选择设备组', trigger: 'change' }],
  threshold: [
    { required: true, message: '请输入负载阈值', trigger: 'blur' },
    { type: 'number', min: 0, max: 100, message: '阈值范围为0-100', trigger: 'blur' }
  ]
}

const algorithmConfigVisible = ref(false)
const algorithmConfig = reactive<AlgorithmConfig>({
  roundRobinInterval: 100,
  weights: {
    'device-1': 30,
    'device-2': 30,
    'device-3': 20,
    'device-4': 20
  },
  maxConnections: 1000,
  hashStrategy: 'consistent'
})

const metricsVisible = ref(false)
const performanceMetrics = ref<PerformanceMetrics>({
  successRate: 98.5,
  efficiency: 92.3,
  balanceScore: 88.7,
  avgResponseTime: 45
})

const overallLoadGauge = ref(65)
const balanceScoreGauge = ref(88)

let loadInterval: any = null

const filteredTableData = computed(() => {
  let data = tableData.value

  if (searchKeyword.value) {
    data = data.filter(item =>
      item.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }

  if (filterAlgorithm.value) {
    data = data.filter(item => item.algorithm === filterAlgorithm.value)
  }

  if (filterStatus.value) {
    data = data.filter(item => item.status === filterStatus.value)
  }

  return data
})

const getAlgorithmLabel = (algorithm: string) => {
  const algo = algorithmOptions.find(a => a.value === algorithm)
  return algo?.label || algorithm
}

const getAlgorithmIcon = (algorithm: string) => {
  const algo = algorithmOptions.find(a => a.value === algorithm)
  return algo?.icon || 'Setting'
}

const getLoadStatusType = (status: string) => {
  const statusMap = {
    normal: 'success',
    warning: 'warning',
    overload: 'danger'
  }
  return statusMap[status as keyof typeof statusMap] || 'info'
}

const getLoadStatusLabel = (status: string) => {
  const statusMap = {
    normal: '正常',
    warning: '预警',
    overload: '过载'
  }
  return statusMap[status as keyof typeof statusMap] || '未知'
}

const getLoadStatusColor = (status: string) => {
  const colorMap = {
    normal: '#67C23A',
    warning: '#E6A23C',
    overload: '#F56C6C'
  }
  return colorMap[status as keyof typeof colorMap] || '#909399'
}

const calculateDeviceStatus = (device: DeviceLoad): 'normal' | 'warning' | 'overload' => {
  const maxLoad = Math.max(device.cpu, device.memory, device.network)
  if (maxLoad >= 90) return 'overload'
  if (maxLoad >= 75) return 'warning'
  return 'normal'
}

const handleAdd = () => {
  dialogTitle.value = '新增负载策略'
  Object.assign(formData, {
    name: '',
    algorithm: 'roundRobin',
    deviceGroup: '',
    status: 'active',
    threshold: 80,
    description: '',
    weights: {}
  })
  dialogVisible.value = true
}

const handleEdit = (row: LoadStrategy) => {
  dialogTitle.value = '编辑负载策略'
  Object.assign(formData, {
    id: row.id,
    name: row.name,
    algorithm: row.algorithm,
    deviceGroup: row.deviceGroup,
    status: row.status,
    threshold: row.threshold,
    description: row.description,
    weights: {}
  })
  dialogVisible.value = true
}

const handleDelete = async (row: LoadStrategy) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除策略"${row.name}"吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    loading.value = true
    setTimeout(() => {
      const index = tableData.value.findIndex(item => item.id === row.id)
      if (index > -1) {
        tableData.value.splice(index, 1)
      }
      loading.value = false
      ElMessage.success('删除成功')
    }, 500)
  } catch {
    // 用户取消
  }
}

const handleToggleStatus = (row: LoadStrategy) => {
  loading.value = true
  setTimeout(() => {
    row.status = row.status === 'active' ? 'inactive' : 'active'
    row.lastRunTime = new Date().toLocaleString('zh-CN')
    loading.value = false
    ElMessage.success(`已${row.status === 'active' ? '启用' : '停用'}策略`)
  }, 300)
}

const submitForm = async () => {
  if (!formRef.value) return

  await formRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      setTimeout(() => {
        if (formData.id) {
          const index = tableData.value.findIndex(item => item.id === formData.id)
          if (index > -1) {
            tableData.value[index] = {
              ...tableData.value[index],
              name: formData.name!,
              algorithm: formData.algorithm!,
              deviceGroup: formData.deviceGroup!,
              status: formData.status!,
              threshold: formData.threshold!,
              description: formData.description,
              lastRunTime: new Date().toLocaleString('zh-CN')
            }
          }
          ElMessage.success('编辑成功')
        } else {
          const newStrategy: LoadStrategy = {
            id: Date.now().toString(),
            name: formData.name!,
            algorithm: formData.algorithm!,
            deviceGroup: formData.deviceGroup!,
            status: formData.status!,
            threshold: formData.threshold!,
            description: formData.description,
            lastRunTime: new Date().toLocaleString('zh-CN')
          }
          tableData.value.unshift(newStrategy)
          ElMessage.success('新增成功')
        }

        loading.value = false
        dialogVisible.value = false
      }, 500)
    }
  })
}

const openAlgorithmConfig = () => {
  algorithmConfigVisible.value = true
}

const saveAlgorithmConfig = () => {
  ElMessage.success('算法参数已保存')
  algorithmConfigVisible.value = false
}

const openMetrics = () => {
  metricsVisible.value = true
}

const refreshLoadData = () => {
  deviceLoadData.value = deviceLoadData.value.map(device => ({
    ...device,
    cpu: Math.max(0, Math.min(100, device.cpu + (Math.random() - 0.5) * 10)),
    memory: Math.max(0, Math.min(100, device.memory + (Math.random() - 0.5) * 8)),
    network: Math.max(0, Math.min(100, device.network + (Math.random() - 0.5) * 12)),
    connections: Math.max(0, device.connections + Math.floor((Math.random() - 0.5) * 50)),
    status: calculateDeviceStatus(device)
  }))

  overallLoadGauge.value = Math.round(
    deviceLoadData.value.reduce((sum, device) =>
      sum + (device.cpu + device.memory + device.network) / 3, 0
    ) / deviceLoadData.value.length
  )

  const statusCounts = deviceLoadData.value.reduce((acc, device) => {
    acc[device.status] = (acc[device.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  balanceScoreGauge.value = Math.round(
    ((statusCounts.normal || 0) / deviceLoadData.value.length) * 100
  )
}

const loadMockData = () => {
  loading.value = true
  setTimeout(() => {
    tableData.value = [
      {
        id: '1',
        name: '计算任务负载均衡',
        algorithm: 'weightedRoundRobin',
        deviceGroup: 'group-a',
        status: 'active',
        threshold: 80,
        description: '针对计算密集型任务的加权轮询策略',
        lastRunTime: '2025-10-29 10:30:00'
      },
      {
        id: '2',
        name: '推理任务负载均衡',
        algorithm: 'leastConnection',
        deviceGroup: 'group-b',
        status: 'active',
        threshold: 75,
        description: '基于最少连接的推理任务分配',
        lastRunTime: '2025-10-29 10:28:00'
      },
      {
        id: '3',
        name: '数据同步负载均衡',
        algorithm: 'roundRobin',
        deviceGroup: 'group-c',
        status: 'active',
        threshold: 85,
        description: '数据同步任务的轮询分配策略',
        lastRunTime: '2025-10-29 10:25:00'
      },
      {
        id: '4',
        name: '哈希分配策略',
        algorithm: 'hashBased',
        deviceGroup: 'group-d',
        status: 'inactive',
        threshold: 70,
        description: '基于一致性哈希的任务分配',
        lastRunTime: '2025-10-28 18:15:00'
      },
      {
        id: '5',
        name: '高优先级任务均衡',
        algorithm: 'weightedRoundRobin',
        deviceGroup: 'group-a',
        status: 'active',
        threshold: 90,
        description: '高优先级任务的专用负载均衡',
        lastRunTime: '2025-10-29 10:20:00'
      }
    ]

    deviceLoadData.value = [
      {
        deviceId: 'device-1',
        deviceName: '边缘设备 01',
        group: 'group-a',
        cpu: 65,
        memory: 72,
        network: 58,
        connections: 245,
        status: 'normal'
      },
      {
        deviceId: 'device-2',
        deviceName: '边缘设备 02',
        group: 'group-a',
        cpu: 78,
        memory: 82,
        network: 70,
        connections: 312,
        status: 'warning'
      },
      {
        deviceId: 'device-3',
        deviceName: '边缘设备 03',
        group: 'group-b',
        cpu: 55,
        memory: 60,
        network: 48,
        connections: 189,
        status: 'normal'
      },
      {
        deviceId: 'device-4',
        deviceName: '边缘设备 04',
        group: 'group-b',
        cpu: 92,
        memory: 88,
        network: 95,
        connections: 456,
        status: 'overload'
      },
      {
        deviceId: 'device-5',
        deviceName: '边缘设备 05',
        group: 'group-c',
        cpu: 45,
        memory: 52,
        network: 40,
        connections: 123,
        status: 'normal'
      },
      {
        deviceId: 'device-6',
        deviceName: '边缘设备 06',
        group: 'group-c',
        cpu: 68,
        memory: 75,
        network: 65,
        connections: 278,
        status: 'normal'
      }
    ]

    loading.value = false

    loadInterval = setInterval(refreshLoadData, 3000)
  }, 800)
}

onMounted(() => {
  loadMockData()
})

onUnmounted(() => {
  if (loadInterval) {
    clearInterval(loadInterval)
  }
})
</script>

<template>
  <div class="load-balancing">
    <el-card class="header-card">
      <div class="header-section">
        <div class="title-section">
          <h2>负载均衡策略</h2>
          <p class="subtitle">管理边缘设备间的负载分配，优化整体资源利用率</p>
        </div>
        <div class="action-buttons">
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增策略
          </el-button>
          <el-button @click="openAlgorithmConfig">
            <el-icon><Setting /></el-icon>
            算法参数
          </el-button>
          <el-button @click="openMetrics">
            <el-icon><DataAnalysis /></el-icon>
            效果评估
          </el-button>
        </div>
      </div>
    </el-card>

    <el-row :gutter="20" class="gauge-row">
      <el-col :span="12">
        <el-card class="gauge-card">
          <template #header>
            <div class="card-header">
              <span>整体负载情况</span>
              <el-tag :type="overallLoadGauge >= 80 ? 'danger' : overallLoadGauge >= 60 ? 'warning' : 'success'">
                {{ overallLoadGauge >= 80 ? '过载' : overallLoadGauge >= 60 ? '预警' : '正常' }}
              </el-tag>
            </div>
          </template>
          <div class="gauge-content">
            <el-progress
              type="dashboard"
              :percentage="overallLoadGauge"
              :color="overallLoadGauge >= 80 ? '#F56C6C' : overallLoadGauge >= 60 ? '#E6A23C' : '#67C23A'"
              :width="200"
            >
              <template #default="{ percentage }">
                <span class="percentage-value">{{ percentage }}%</span>
                <span class="percentage-label">平均负载</span>
              </template>
            </el-progress>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="gauge-card">
          <template #header>
            <div class="card-header">
              <span>负载均衡度</span>
              <el-tag :type="balanceScoreGauge >= 80 ? 'success' : balanceScoreGauge >= 60 ? 'warning' : 'danger'">
                {{ balanceScoreGauge >= 80 ? '优秀' : balanceScoreGauge >= 60 ? '良好' : '需优化' }}
              </el-tag>
            </div>
          </template>
          <div class="gauge-content">
            <el-progress
              type="dashboard"
              :percentage="balanceScoreGauge"
              :color="balanceScoreGauge >= 80 ? '#67C23A' : balanceScoreGauge >= 60 ? '#E6A23C' : '#F56C6C'"
              :width="200"
            >
              <template #default="{ percentage }">
                <span class="percentage-value">{{ percentage }}%</span>
                <span class="percentage-label">均衡得分</span>
              </template>
            </el-progress>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="content-row">
      <el-col :span="14">
        <el-card class="table-card">
          <template #header>
            <div class="card-header">
              <span>负载策略列表</span>
            </div>
          </template>

          <div class="filter-section">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索策略名称"
              clearable
              style="width: 240px"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>

            <el-select
              v-model="filterAlgorithm"
              placeholder="均衡算法"
              clearable
              style="width: 150px"
            >
              <el-option
                v-for="algo in algorithmOptions"
                :key="algo.value"
                :label="algo.label"
                :value="algo.value"
              />
            </el-select>

            <el-select
              v-model="filterStatus"
              placeholder="状态"
              clearable
              style="width: 120px"
            >
              <el-option label="运行中" value="active" />
              <el-option label="已停用" value="inactive" />
            </el-select>
          </div>

          <el-table
            :data="filteredTableData"
            v-loading="loading"
            style="width: 100%"
            stripe
          >
            <el-table-column prop="name" label="策略名称" min-width="150" show-overflow-tooltip />

            <el-table-column label="均衡算法" width="140" align="center">
              <template #default="{ row }">
                <el-tag type="primary">
                  <el-icon style="margin-right: 4px">
                    <component :is="getAlgorithmIcon(row.algorithm)" />
                  </el-icon>
                  {{ getAlgorithmLabel(row.algorithm) }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="设备组" width="120" align="center">
              <template #default="{ row }">
                <el-tag type="info">
                  {{ deviceGroupOptions.find(g => g.value === row.deviceGroup)?.label }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column prop="threshold" label="负载阈值" width="100" align="center">
              <template #default="{ row }">
                {{ row.threshold }}%
              </template>
            </el-table-column>

            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'info'">
                  {{ row.status === 'active' ? '运行中' : '已停用' }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column prop="lastRunTime" label="最后运行时间" width="160" />

            <el-table-column label="操作" width="200" align="center" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleEdit(row)">
                  编辑
                </el-button>
                <el-button
                  link
                  :type="row.status === 'active' ? 'warning' : 'success'"
                  size="small"
                  @click="handleToggleStatus(row)"
                >
                  {{ row.status === 'active' ? '停用' : '启用' }}
                </el-button>
                <el-button link type="danger" size="small" @click="handleDelete(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="10">
        <el-card class="monitor-card">
          <template #header>
            <div class="card-header">
              <span>设备负载监控</span>
              <el-tag type="info" size="small">实时更新</el-tag>
            </div>
          </template>

          <div class="device-list">
            <div
              v-for="device in deviceLoadData"
              :key="device.deviceId"
              class="device-item"
              :class="device.status"
            >
              <div class="device-header">
                <div class="device-info">
                  <span class="device-name">{{ device.deviceName }}</span>
                  <el-tag
                    :type="getLoadStatusType(device.status)"
                    size="small"
                  >
                    {{ getLoadStatusLabel(device.status) }}
                  </el-tag>
                </div>
                <span class="device-group">{{ device.group }}</span>
              </div>

              <div class="device-metrics">
                <div class="metric-item">
                  <div class="metric-header">
                    <span class="metric-label">CPU</span>
                    <span class="metric-value">{{ device.cpu.toFixed(1) }}%</span>
                  </div>
                  <el-progress
                    :percentage="device.cpu"
                    :color="device.cpu >= 90 ? '#F56C6C' : device.cpu >= 75 ? '#E6A23C' : '#67C23A'"
                    :show-text="false"
                  />
                </div>

                <div class="metric-item">
                  <div class="metric-header">
                    <span class="metric-label">内存</span>
                    <span class="metric-value">{{ device.memory.toFixed(1) }}%</span>
                  </div>
                  <el-progress
                    :percentage="device.memory"
                    :color="device.memory >= 90 ? '#F56C6C' : device.memory >= 75 ? '#E6A23C' : '#67C23A'"
                    :show-text="false"
                  />
                </div>

                <div class="metric-item">
                  <div class="metric-header">
                    <span class="metric-label">网络</span>
                    <span class="metric-value">{{ device.network.toFixed(1) }}%</span>
                  </div>
                  <el-progress
                    :percentage="device.network"
                    :color="device.network >= 90 ? '#F56C6C' : device.network >= 75 ? '#E6A23C' : '#67C23A'"
                    :show-text="false"
                  />
                </div>

                <div class="metric-item">
                  <div class="metric-header">
                    <span class="metric-label">连接数</span>
                    <span class="metric-value">{{ device.connections }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item label="策略名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入策略名称" />
        </el-form-item>

        <el-form-item label="均衡算法" prop="algorithm">
          <el-select v-model="formData.algorithm" placeholder="请选择均衡算法" style="width: 100%">
            <el-option
              v-for="algo in algorithmOptions"
              :key="algo.value"
              :label="algo.label"
              :value="algo.value"
            >
              <el-icon style="margin-right: 8px">
                <component :is="algo.icon" />
              </el-icon>
              <span>{{ algo.label }}</span>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="设备组" prop="deviceGroup">
          <el-select v-model="formData.deviceGroup" placeholder="请选择设备组" style="width: 100%">
            <el-option
              v-for="group in deviceGroupOptions"
              :key="group.value"
              :label="group.label"
              :value="group.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="负载阈值" prop="threshold">
          <el-slider
            v-model="formData.threshold"
            :min="0"
            :max="100"
            :step="5"
            show-input
            :marks="{ 0: '0%', 50: '50%', 100: '100%' }"
          />
        </el-form-item>

        <el-form-item label="策略描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入策略描述"
          />
        </el-form-item>

        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio value="active">启用</el-radio>
            <el-radio value="inactive">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="loading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="algorithmConfigVisible"
      title="算法参数配置"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-tabs>
        <el-tab-pane label="轮询算法">
          <el-form label-width="140px">
            <el-form-item label="轮询间隔时间">
              <el-input-number
                v-model="algorithmConfig.roundRobinInterval"
                :min="10"
                :max="1000"
                :step="10"
              />
              <span style="margin-left: 10px; color: #909399">毫秒</span>
            </el-form-item>
            <el-alert
              title="说明"
              type="info"
              description="轮询间隔时间决定了任务分配的频率，较小的值可以实现更快速的负载分配"
              :closable="false"
            />
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="加权轮询">
          <el-form label-width="140px">
            <el-form-item
              v-for="(weight, deviceId) in algorithmConfig.weights"
              :key="deviceId"
              :label="deviceId"
            >
              <el-slider
                v-model="algorithmConfig.weights![deviceId]"
                :min="0"
                :max="100"
                show-input
              />
            </el-form-item>
            <el-alert
              title="说明"
              type="info"
              description="权重越高的设备将获得更多的任务分配，所有权重总和应为100"
              :closable="false"
            />
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="最少连接">
          <el-form label-width="140px">
            <el-form-item label="最大连接数限制">
              <el-input-number
                v-model="algorithmConfig.maxConnections"
                :min="100"
                :max="10000"
                :step="100"
              />
            </el-form-item>
            <el-alert
              title="说明"
              type="info"
              description="当设备连接数达到此限制时，将不再向该设备分配新任务"
              :closable="false"
            />
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="哈希分配">
          <el-form label-width="140px">
            <el-form-item label="哈希策略">
              <el-radio-group v-model="algorithmConfig.hashStrategy">
                <el-radio value="consistent">一致性哈希</el-radio>
                <el-radio value="simple">简单哈希</el-radio>
                <el-radio value="weighted">加权哈希</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-alert
              title="说明"
              type="info"
              description="一致性哈希可以在设备变化时最小化任务重新分配，适合有状态的任务"
              :closable="false"
            />
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <el-button @click="algorithmConfigVisible = false">取消</el-button>
        <el-button type="primary" @click="saveAlgorithmConfig">
          保存配置
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="metricsVisible"
      title="策略效果评估"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-row :gutter="20" class="metrics-row">
        <el-col :span="6">
          <el-card class="metric-card success">
            <el-statistic :value="performanceMetrics.successRate" :precision="1" suffix="%" title="任务成功率">
              <template #prefix>
                <el-icon><CircleCheck /></el-icon>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="metric-card primary">
            <el-statistic :value="performanceMetrics.efficiency" :precision="1" suffix="%" title="执行效率">
              <template #prefix>
                <el-icon><Timer /></el-icon>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="metric-card warning">
            <el-statistic :value="performanceMetrics.balanceScore" :precision="1" suffix="%" title="均衡度得分">
              <template #prefix>
                <el-icon><ScaleToOriginal /></el-icon>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="metric-card info">
            <el-statistic :value="performanceMetrics.avgResponseTime" suffix="ms" title="平均响应时间">
              <template #prefix>
                <el-icon><Stopwatch /></el-icon>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
      </el-row>

      <el-divider />

      <div class="analysis-section">
        <h3>负载分析报告</h3>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="设备总数">
            {{ deviceLoadData.length }}
          </el-descriptions-item>
          <el-descriptions-item label="正常设备">
            <el-tag type="success">
              {{ deviceLoadData.filter(d => d.status === 'normal').length }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="预警设备">
            <el-tag type="warning">
              {{ deviceLoadData.filter(d => d.status === 'warning').length }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="过载设备">
            <el-tag type="danger">
              {{ deviceLoadData.filter(d => d.status === 'overload').length }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="活跃策略数">
            {{ tableData.filter(s => s.status === 'active').length }}
          </el-descriptions-item>
          <el-descriptions-item label="总连接数">
            {{ deviceLoadData.reduce((sum, d) => sum + d.connections, 0) }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="optimization-suggestions">
          <h4>优化建议</h4>
          <ul>
            <li v-if="deviceLoadData.some(d => d.status === 'overload')">
              <el-icon color="#F56C6C"><Warning /></el-icon>
              检测到过载设备，建议调整负载策略或增加设备资源
            </li>
            <li v-if="performanceMetrics.balanceScore < 80">
              <el-icon color="#E6A23C"><Warning /></el-icon>
              负载均衡度较低，建议优化权重配置或更换均衡算法
            </li>
            <li v-if="performanceMetrics.avgResponseTime > 50">
              <el-icon color="#E6A23C"><InfoFilled /></el-icon>
              平均响应时间偏高，建议检查网络延迟或优化任务分配策略
            </li>
            <li v-if="performanceMetrics.successRate > 95 && performanceMetrics.balanceScore > 85">
              <el-icon color="#67C23A"><CircleCheck /></el-icon>
              当前负载均衡策略运行良好，系统整体性能优秀
            </li>
          </ul>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.load-balancing {
  .header-card {
    margin-bottom: 20px;

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .title-section {
        h2 {
          margin: 0 0 10px 0;
          font-size: 24px;
          font-weight: 600;
        }

        .subtitle {
          margin: 0;
          color: #909399;
          font-size: 14px;
        }
      }

      .action-buttons {
        display: flex;
        gap: 10px;
      }
    }
  }

  .gauge-row {
    margin-bottom: 20px;

    .gauge-card {
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .gauge-content {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;

        .percentage-value {
          display: block;
          font-size: 32px;
          font-weight: 600;
          line-height: 1;
        }

        .percentage-label {
          display: block;
          font-size: 14px;
          color: #909399;
          margin-top: 8px;
        }
      }
    }
  }

  .content-row {
    .table-card {
      .card-header {
        font-weight: 600;
      }

      .filter-section {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
      }
    }

    .monitor-card {
      height: 100%;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .device-list {
        max-height: 600px;
        overflow-y: auto;

        .device-item {
          padding: 15px;
          margin-bottom: 15px;
          border-radius: 8px;
          border: 2px solid #e4e7ed;
          transition: all 0.3s;

          &.normal {
            border-color: #67C23A;
            background-color: #f0f9ff;
          }

          &.warning {
            border-color: #E6A23C;
            background-color: #fdf6ec;
          }

          &.overload {
            border-color: #F56C6C;
            background-color: #fef0f0;
          }

          &:hover {
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
          }

          .device-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;

            .device-info {
              display: flex;
              align-items: center;
              gap: 10px;

              .device-name {
                font-weight: 600;
                font-size: 15px;
              }
            }

            .device-group {
              font-size: 12px;
              color: #909399;
            }
          }

          .device-metrics {
            .metric-item {
              margin-bottom: 10px;

              &:last-child {
                margin-bottom: 0;
              }

              .metric-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 5px;

                .metric-label {
                  font-size: 13px;
                  color: #606266;
                }

                .metric-value {
                  font-size: 13px;
                  font-weight: 600;
                  color: #409EFF;
                }
              }
            }
          }
        }
      }
    }
  }

  .metrics-row {
    margin-bottom: 20px;

    .metric-card {
      border-radius: 8px;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      &.success {
        border-left: 4px solid #67C23A;
      }

      &.primary {
        border-left: 4px solid #409EFF;
      }

      &.warning {
        border-left: 4px solid #E6A23C;
      }

      &.info {
        border-left: 4px solid #909399;
      }

      :deep(.el-statistic) {
        .el-statistic__head {
          color: #606266;
          font-size: 14px;
        }

        .el-statistic__content {
          font-size: 28px;
          font-weight: 600;
        }
      }
    }
  }

  .analysis-section {
    h3 {
      margin: 0 0 15px 0;
      font-size: 18px;
    }

    .optimization-suggestions {
      margin-top: 20px;
      padding: 15px;
      background-color: #f5f7fa;
      border-radius: 4px;

      h4 {
        margin: 0 0 10px 0;
        font-size: 16px;
      }

      ul {
        margin: 0;
        padding-left: 0;
        list-style: none;

        li {
          margin: 10px 0;
          font-size: 14px;
          color: #606266;
          display: flex;
          align-items: center;
          gap: 8px;
        }
      }
    }
  }
}
</style>
