<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// 网络状态类型
type NetworkStatus = 'running' | 'stopped' | 'error' | 'creating'
type ChainType = 'mainchain' | 'sidechain' | 'testchain'
type ConsensusAlgorithm = 'PoW' | 'PoS' | 'DPoS' | 'PBFT' | 'Raft'

// 链网络接口定义
interface ChainNetwork {
  id: string
  name: string
  networkId: string
  chainType: ChainType
  nodeCount: number
  createTime: string
  status: NetworkStatus
  consensusAlgorithm: ConsensusAlgorithm
  blockSize: number
  blockInterval: number
  gasLimit: string
  tps: number
  blockHeight: number
  transactionCount: number
  healthScore: number
  resourceUsage: {
    cpu: number
    memory: number
    disk: number
  }
}

// 网络创建表单
interface NetworkCreateForm {
  // 步骤1：基础信息
  name: string
  chainType: ChainType
  consensusAlgorithm: ConsensusAlgorithm
  // 步骤2：网络参数
  blockSize: number
  blockInterval: number
  gasLimit: string
  maxPeers: number
  // 步骤3：初始化配置
  genesisNodeCount: number
  initialAccounts: string
  initialBalance: string
}

// 网络配置表单
interface NetworkConfigForm {
  accessControl: string
  securityPolicy: string
  resourceQuota: {
    cpu: number
    memory: number
    disk: number
  }
  whitelist: string
  blacklist: string
}

// 响应式数据
const loading = ref(false)
const tableData = ref<ChainNetwork[]>([])
const searchName = ref('')
const searchStatus = ref<NetworkStatus | ''>('')

// 创建向导相关
const createDialogVisible = ref(false)
const currentStep = ref(0)
const createFormRef = ref<FormInstance>()
const createForm = reactive<NetworkCreateForm>({
  name: '',
  chainType: 'mainchain',
  consensusAlgorithm: 'PBFT',
  blockSize: 2,
  blockInterval: 3,
  gasLimit: '8000000',
  maxPeers: 50,
  genesisNodeCount: 4,
  initialAccounts: '5',
  initialBalance: '1000000'
})

// 配置管理相关
const configDialogVisible = ref(false)
const configFormRef = ref<FormInstance>()
const currentNetwork = ref<ChainNetwork | null>(null)
const configForm = reactive<NetworkConfigForm>({
  accessControl: 'private',
  securityPolicy: 'high',
  resourceQuota: {
    cpu: 80,
    memory: 80,
    disk: 80
  },
  whitelist: '',
  blacklist: ''
})

// 详情对话框
const detailDialogVisible = ref(false)
const detailNetwork = ref<ChainNetwork | null>(null)

// 表单验证规则
const createFormRules = reactive<FormRules<NetworkCreateForm>>({
  name: [
    { required: true, message: '请输入网络名称', trigger: 'blur' },
    { min: 3, max: 50, message: '长度在 3 到 50 个字符', trigger: 'blur' }
  ],
  chainType: [
    { required: true, message: '请选择链类型', trigger: 'change' }
  ],
  consensusAlgorithm: [
    { required: true, message: '请选择共识算法', trigger: 'change' }
  ],
  blockSize: [
    { required: true, message: '请输入区块大小', trigger: 'blur' }
  ],
  blockInterval: [
    { required: true, message: '请输入出块间隔', trigger: 'blur' }
  ],
  gasLimit: [
    { required: true, message: '请输入Gas限制', trigger: 'blur' }
  ]
})

// Mock 数据生成
const generateMockData = (): ChainNetwork[] => {
  const networks: ChainNetwork[] = [
    {
      id: '1',
      name: '主链网络-生产环境',
      networkId: 'mainnet-001',
      chainType: 'mainchain',
      nodeCount: 12,
      createTime: '2024-01-15 10:30:00',
      status: 'running',
      consensusAlgorithm: 'PBFT',
      blockSize: 2,
      blockInterval: 3,
      gasLimit: '8000000',
      tps: 1250,
      blockHeight: 1523456,
      transactionCount: 8564231,
      healthScore: 98,
      resourceUsage: {
        cpu: 65,
        memory: 72,
        disk: 58
      }
    },
    {
      id: '2',
      name: '侧链网络-DeFi专用',
      networkId: 'sidechain-defi-001',
      chainType: 'sidechain',
      nodeCount: 8,
      createTime: '2024-02-20 14:20:00',
      status: 'running',
      consensusAlgorithm: 'DPoS',
      blockSize: 1,
      blockInterval: 1,
      gasLimit: '5000000',
      tps: 2800,
      blockHeight: 856234,
      transactionCount: 3241567,
      healthScore: 95,
      resourceUsage: {
        cpu: 78,
        memory: 68,
        disk: 45
      }
    },
    {
      id: '3',
      name: '测试链网络-开发环境',
      networkId: 'testnet-dev-001',
      chainType: 'testchain',
      nodeCount: 4,
      createTime: '2024-03-10 09:15:00',
      status: 'stopped',
      consensusAlgorithm: 'PoW',
      blockSize: 1,
      blockInterval: 10,
      gasLimit: '3000000',
      tps: 0,
      blockHeight: 125678,
      transactionCount: 456789,
      healthScore: 0,
      resourceUsage: {
        cpu: 0,
        memory: 0,
        disk: 35
      }
    },
    {
      id: '4',
      name: '侧链网络-NFT市场',
      networkId: 'sidechain-nft-001',
      chainType: 'sidechain',
      nodeCount: 6,
      createTime: '2024-04-05 16:45:00',
      status: 'error',
      consensusAlgorithm: 'PoS',
      blockSize: 2,
      blockInterval: 5,
      gasLimit: '6000000',
      tps: 450,
      blockHeight: 523456,
      transactionCount: 1245678,
      healthScore: 62,
      resourceUsage: {
        cpu: 45,
        memory: 88,
        disk: 67
      }
    },
    {
      id: '5',
      name: '主链网络-预发布环境',
      networkId: 'mainnet-staging-001',
      chainType: 'mainchain',
      nodeCount: 3,
      createTime: '2024-10-28 11:00:00',
      status: 'creating',
      consensusAlgorithm: 'PBFT',
      blockSize: 2,
      blockInterval: 3,
      gasLimit: '8000000',
      tps: 0,
      blockHeight: 0,
      transactionCount: 0,
      healthScore: 0,
      resourceUsage: {
        cpu: 25,
        memory: 30,
        disk: 15
      }
    }
  ]
  return networks
}

// 筛选后的表格数据
const filteredTableData = computed(() => {
  return tableData.value.filter(item => {
    const matchName = !searchName.value || item.name.includes(searchName.value)
    const matchStatus = !searchStatus.value || item.status === searchStatus.value
    return matchName && matchStatus
  })
})

// 获取状态标签类型
const getStatusType = (status: NetworkStatus) => {
  const typeMap = {
    running: 'success',
    stopped: 'danger',
    error: 'warning',
    creating: 'primary'
  }
  return typeMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status: NetworkStatus) => {
  const textMap = {
    running: '运行中',
    stopped: '已停止',
    error: '异常',
    creating: '创建中'
  }
  return textMap[status] || '未知'
}

// 获取链类型标签类型
const getChainTypeTag = (type: ChainType) => {
  const typeMap = {
    mainchain: 'warning',
    sidechain: 'primary',
    testchain: 'info'
  }
  return typeMap[type] || 'info'
}

// 获取链类型文本
const getChainTypeText = (type: ChainType) => {
  const textMap = {
    mainchain: '主链',
    sidechain: '侧链',
    testchain: '测试链'
  }
  return textMap[type] || '未知'
}

// 获取健康度状态
const getHealthScoreStatus = (score: number) => {
  if (score >= 90) return 'success'
  if (score >= 70) return 'warning'
  return 'exception'
}

// 加载数据
const loadData = () => {
  loading.value = true
  // 模拟异步加载
  setTimeout(() => {
    tableData.value = generateMockData()
    loading.value = false
    ElMessage.success('数据加载成功')
  }, 800)
}

// 打开创建向导
const openCreateDialog = () => {
  createDialogVisible.value = true
  currentStep.value = 0
  resetCreateForm()
}

// 重置创建表单
const resetCreateForm = () => {
  createFormRef.value?.resetFields()
  Object.assign(createForm, {
    name: '',
    chainType: 'mainchain',
    consensusAlgorithm: 'PBFT',
    blockSize: 2,
    blockInterval: 3,
    gasLimit: '8000000',
    maxPeers: 50,
    genesisNodeCount: 4,
    initialAccounts: '5',
    initialBalance: '1000000'
  })
}

// 下一步
const nextStep = async () => {
  if (currentStep.value === 0) {
    // 验证第一步
    const valid = await createFormRef.value?.validate().catch(() => false)
    if (!valid) return
  }
  if (currentStep.value < 2) {
    currentStep.value++
  }
}

// 上一步
const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

// 提交创建
const submitCreate = async () => {
  const valid = await createFormRef.value?.validate().catch(() => false)
  if (!valid) {
    ElMessage.warning('请完善表单信息')
    return
  }

  loading.value = true
  // 模拟创建网络
  setTimeout(() => {
    const newNetwork: ChainNetwork = {
      id: Date.now().toString(),
      name: createForm.name,
      networkId: `network-${Date.now()}`,
      chainType: createForm.chainType,
      nodeCount: createForm.genesisNodeCount,
      createTime: new Date().toLocaleString('zh-CN'),
      status: 'creating',
      consensusAlgorithm: createForm.consensusAlgorithm,
      blockSize: createForm.blockSize,
      blockInterval: createForm.blockInterval,
      gasLimit: createForm.gasLimit,
      tps: 0,
      blockHeight: 0,
      transactionCount: 0,
      healthScore: 0,
      resourceUsage: {
        cpu: 10,
        memory: 15,
        disk: 5
      }
    }
    tableData.value.unshift(newNetwork)
    loading.value = false
    createDialogVisible.value = false
    ElMessage.success('网络创建成功，正在初始化...')
    
    // 模拟网络初始化完成
    setTimeout(() => {
      newNetwork.status = 'running'
      newNetwork.healthScore = 95
      ElMessage.success(`网络 "${newNetwork.name}" 已成功启动`)
    }, 3000)
  }, 1500)
}

// 查看详情
const viewDetail = (row: ChainNetwork) => {
  detailNetwork.value = row
  detailDialogVisible.value = true
}

// 打开配置管理
const openConfigDialog = (row: ChainNetwork) => {
  currentNetwork.value = row
  configDialogVisible.value = true
  // 模拟加载配置
  setTimeout(() => {
    configForm.accessControl = 'private'
    configForm.securityPolicy = 'high'
    configForm.resourceQuota = { ...row.resourceUsage }
  }, 300)
}

// 保存配置
const saveConfig = async () => {
  const valid = await configFormRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  setTimeout(() => {
    loading.value = false
    configDialogVisible.value = false
    ElMessage.success('配置保存成功')
  }, 800)
}

// 启动网络
const startNetwork = (row: ChainNetwork) => {
  ElMessageBox.confirm(
    `确定要启动网络 "${row.name}" 吗？`,
    '启动确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    loading.value = true
    setTimeout(() => {
      row.status = 'running'
      row.healthScore = 95
      loading.value = false
      ElMessage.success('网络启动成功')
    }, 1500)
  }).catch(() => {})
}

// 停止网络
const stopNetwork = (row: ChainNetwork) => {
  ElMessageBox.confirm(
    `确定要停止网络 "${row.name}" 吗？这将中断所有正在进行的交易。`,
    '停止确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    loading.value = true
    setTimeout(() => {
      row.status = 'stopped'
      row.tps = 0
      row.healthScore = 0
      row.resourceUsage = { cpu: 0, memory: 0, disk: row.resourceUsage.disk }
      loading.value = false
      ElMessage.success('网络已停止')
    }, 1000)
  }).catch(() => {})
}

// 重启网络
const restartNetwork = (row: ChainNetwork) => {
  ElMessageBox.confirm(
    `确定要重启网络 "${row.name}" 吗？`,
    '重启确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    loading.value = true
    row.status = 'stopped'
    setTimeout(() => {
      row.status = 'running'
      row.healthScore = 98
      loading.value = false
      ElMessage.success('网络重启成功')
    }, 2000)
  }).catch(() => {})
}

// 备份配置
const backupConfig = (row: ChainNetwork) => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success(`网络 "${row.name}" 配置备份成功`)
  }, 1000)
}

// 删除网络
const deleteNetwork = (row: ChainNetwork) => {
  ElMessageBox.confirm(
    `确定要删除网络 "${row.name}" 吗？此操作不可恢复！`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error'
    }
  ).then(() => {
    loading.value = true
    setTimeout(() => {
      const index = tableData.value.findIndex(item => item.id === row.id)
      if (index > -1) {
        tableData.value.splice(index, 1)
      }
      loading.value = false
      ElMessage.success('网络删除成功')
    }, 1000)
  }).catch(() => {})
}

// 重置搜索
const resetSearch = () => {
  searchName.value = ''
  searchStatus.value = ''
}

// 组件挂载时加载数据
onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="chain-network-container">
    <!-- 页面标题 -->
    <el-card class="header-card" shadow="never">
      <div class="page-header">
        <div>
          <h2 class="page-title">链网络管理</h2>
          <p class="page-description">区块链网络的创建、配置和维护</p>
        </div>
        <el-button type="primary" size="large" @click="openCreateDialog">
          <el-icon><Plus /></el-icon>
          创建新网络
        </el-button>
      </div>
    </el-card>

    <!-- 搜索和筛选 -->
    <el-card class="search-card" shadow="never">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input
            v-model="searchName"
            placeholder="请输入网络名称"
            clearable
            prefix-icon="Search"
          />
        </el-col>
        <el-col :span="6">
          <el-select
            v-model="searchStatus"
            placeholder="选择状态"
            clearable
            style="width: 100%"
          >
            <el-option label="运行中" value="running" />
            <el-option label="已停止" value="stopped" />
            <el-option label="异常" value="error" />
            <el-option label="创建中" value="creating" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="primary" @click="loadData">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 网络列表 -->
    <el-card class="table-card" shadow="never">
      <el-table
        :data="filteredTableData"
        v-loading="loading"
        stripe
        style="width: 100%"
        :default-sort="{ prop: 'createTime', order: 'descending' }"
      >
        <el-table-column prop="name" label="网络名称" min-width="200">
          <template #default="{ row }">
            <div class="network-name">
              <el-icon class="network-icon"><Connection /></el-icon>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="networkId" label="网络ID" min-width="150" />
        <el-table-column prop="chainType" label="链类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getChainTypeTag(row.chainType)" size="small">
              {{ getChainTypeText(row.chainType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="consensusAlgorithm" label="共识算法" width="100" />
        <el-table-column prop="nodeCount" label="节点数量" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.nodeCount }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="tps" label="TPS" width="100" align="center">
          <template #default="{ row }">
            <span :class="{ 'tps-high': row.tps > 2000 }">{{ row.tps }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="healthScore" label="健康度" width="120">
          <template #default="{ row }">
            <el-progress
              :percentage="row.healthScore"
              :status="getHealthScoreStatus(row.healthScore)"
              :stroke-width="8"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" sortable />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              size="small"
              @click="viewDetail(row)"
            >
              详情
            </el-button>
            <el-button
              link
              type="primary"
              size="small"
              @click="openConfigDialog(row)"
            >
              配置
            </el-button>
            <el-dropdown trigger="click" style="margin-left: 8px">
              <el-button link type="primary" size="small">
                更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-if="row.status !== 'running'"
                    @click="startNetwork(row)"
                  >
                    <el-icon><VideoPlay /></el-icon>启动
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="row.status === 'running'"
                    @click="stopNetwork(row)"
                  >
                    <el-icon><VideoPause /></el-icon>停止
                  </el-dropdown-item>
                  <el-dropdown-item @click="restartNetwork(row)">
                    <el-icon><RefreshRight /></el-icon>重启
                  </el-dropdown-item>
                  <el-dropdown-item @click="backupConfig(row)">
                    <el-icon><Download /></el-icon>备份
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="deleteNetwork(row)">
                    <el-icon><Delete /></el-icon>删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建网络向导对话框 -->
    <el-dialog
      v-model="createDialogVisible"
      title="创建网络向导"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-steps :active="currentStep" align-center finish-status="success">
        <el-step title="基础信息" />
        <el-step title="网络参数" />
        <el-step title="初始化配置" />
      </el-steps>

      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createFormRules"
        label-width="120px"
        style="margin-top: 30px"
      >
        <!-- 步骤1：基础信息 -->
        <div v-show="currentStep === 0">
          <el-form-item label="网络名称" prop="name">
            <el-input
              v-model="createForm.name"
              placeholder="请输入网络名称"
              clearable
            />
          </el-form-item>
          <el-form-item label="链类型" prop="chainType">
            <el-select
              v-model="createForm.chainType"
              placeholder="请选择链类型"
              style="width: 100%"
            >
              <el-option label="主链" value="mainchain" />
              <el-option label="侧链" value="sidechain" />
              <el-option label="测试链" value="testchain" />
            </el-select>
          </el-form-item>
          <el-form-item label="共识算法" prop="consensusAlgorithm">
            <el-select
              v-model="createForm.consensusAlgorithm"
              placeholder="请选择共识算法"
              style="width: 100%"
            >
              <el-option label="PoW (工作量证明)" value="PoW" />
              <el-option label="PoS (权益证明)" value="PoS" />
              <el-option label="DPoS (委托权益证明)" value="DPoS" />
              <el-option label="PBFT (实用拜占庭容错)" value="PBFT" />
              <el-option label="Raft (分布式一致性)" value="Raft" />
            </el-select>
          </el-form-item>
        </div>

        <!-- 步骤2：网络参数 -->
        <div v-show="currentStep === 1">
          <el-form-item label="区块大小" prop="blockSize">
            <el-input-number
              v-model="createForm.blockSize"
              :min="1"
              :max="10"
              placeholder="请输入区块大小"
              style="width: 100%"
            />
            <span class="form-tip">单位：MB</span>
          </el-form-item>
          <el-form-item label="出块间隔" prop="blockInterval">
            <el-input-number
              v-model="createForm.blockInterval"
              :min="1"
              :max="60"
              placeholder="请输入出块间隔"
              style="width: 100%"
            />
            <span class="form-tip">单位：秒</span>
          </el-form-item>
          <el-form-item label="Gas限制" prop="gasLimit">
            <el-input
              v-model="createForm.gasLimit"
              placeholder="请输入Gas限制"
              clearable
            />
          </el-form-item>
          <el-form-item label="最大节点数">
            <el-input-number
              v-model="createForm.maxPeers"
              :min="10"
              :max="200"
              style="width: 100%"
            />
          </el-form-item>
        </div>

        <!-- 步骤3：初始化配置 -->
        <div v-show="currentStep === 2">
          <el-alert
            title="初始化配置将在网络创建后立即生效"
            type="info"
            :closable="false"
            style="margin-bottom: 20px"
          />
          <el-form-item label="创世节点数">
            <el-input-number
              v-model="createForm.genesisNodeCount"
              :min="1"
              :max="20"
              style="width: 100%"
            />
            <span class="form-tip">初始启动的节点数量</span>
          </el-form-item>
          <el-form-item label="初始账户数">
            <el-input
              v-model="createForm.initialAccounts"
              placeholder="请输入初始账户数"
            />
            <span class="form-tip">自动创建的初始账户数量</span>
          </el-form-item>
          <el-form-item label="初始余额">
            <el-input
              v-model="createForm.initialBalance"
              placeholder="请输入初始余额"
            />
            <span class="form-tip">每个初始账户的余额（单位：Token）</span>
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="createDialogVisible = false">取消</el-button>
          <el-button v-if="currentStep > 0" @click="prevStep">上一步</el-button>
          <el-button v-if="currentStep < 2" type="primary" @click="nextStep">
            下一步
          </el-button>
          <el-button
            v-if="currentStep === 2"
            type="primary"
            :loading="loading"
            @click="submitCreate"
          >
            创建网络
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 网络详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="网络详情"
      width="900px"
    >
      <div v-if="detailNetwork" class="detail-container">
        <el-row :gutter="20">
          <!-- 基础信息 -->
          <el-col :span="12">
            <el-card shadow="never" class="detail-card">
              <template #header>
                <span class="card-title">基础信息</span>
              </template>
              <div class="info-item">
                <span class="label">网络名称：</span>
                <span class="value">{{ detailNetwork.name }}</span>
              </div>
              <div class="info-item">
                <span class="label">网络ID：</span>
                <span class="value">{{ detailNetwork.networkId }}</span>
              </div>
              <div class="info-item">
                <span class="label">链类型：</span>
                <el-tag :type="getChainTypeTag(detailNetwork.chainType)" size="small">
                  {{ getChainTypeText(detailNetwork.chainType) }}
                </el-tag>
              </div>
              <div class="info-item">
                <span class="label">共识算法：</span>
                <span class="value">{{ detailNetwork.consensusAlgorithm }}</span>
              </div>
              <div class="info-item">
                <span class="label">创建时间：</span>
                <span class="value">{{ detailNetwork.createTime }}</span>
              </div>
              <div class="info-item">
                <span class="label">运行状态：</span>
                <el-tag :type="getStatusType(detailNetwork.status)" size="small">
                  {{ getStatusText(detailNetwork.status) }}
                </el-tag>
              </div>
            </el-card>
          </el-col>

          <!-- 网络参数 -->
          <el-col :span="12">
            <el-card shadow="never" class="detail-card">
              <template #header>
                <span class="card-title">网络参数</span>
              </template>
              <div class="info-item">
                <span class="label">区块大小：</span>
                <span class="value">{{ detailNetwork.blockSize }} MB</span>
              </div>
              <div class="info-item">
                <span class="label">出块间隔：</span>
                <span class="value">{{ detailNetwork.blockInterval }} 秒</span>
              </div>
              <div class="info-item">
                <span class="label">Gas限制：</span>
                <span class="value">{{ detailNetwork.gasLimit }}</span>
              </div>
              <div class="info-item">
                <span class="label">节点数量：</span>
                <span class="value">{{ detailNetwork.nodeCount }} 个</span>
              </div>
              <div class="info-item">
                <span class="label">健康度评分：</span>
                <el-progress
                  :percentage="detailNetwork.healthScore"
                  :status="getHealthScoreStatus(detailNetwork.healthScore)"
                />
              </div>
            </el-card>
          </el-col>

          <!-- 性能指标 -->
          <el-col :span="12">
            <el-card shadow="never" class="detail-card">
              <template #header>
                <span class="card-title">性能指标</span>
              </template>
              <div class="info-item">
                <span class="label">当前TPS：</span>
                <span class="value highlight">{{ detailNetwork.tps }}</span>
              </div>
              <div class="info-item">
                <span class="label">区块高度：</span>
                <span class="value">{{ detailNetwork.blockHeight.toLocaleString() }}</span>
              </div>
              <div class="info-item">
                <span class="label">交易总数：</span>
                <span class="value">{{ detailNetwork.transactionCount.toLocaleString() }}</span>
              </div>
            </el-card>
          </el-col>

          <!-- 资源使用 -->
          <el-col :span="12">
            <el-card shadow="never" class="detail-card">
              <template #header>
                <span class="card-title">资源使用</span>
              </template>
              <div class="resource-item">
                <div class="resource-label">CPU使用率</div>
                <el-progress
                  :percentage="detailNetwork.resourceUsage.cpu"
                  :color="detailNetwork.resourceUsage.cpu > 80 ? '#f56c6c' : '#67c23a'"
                />
              </div>
              <div class="resource-item">
                <div class="resource-label">内存使用率</div>
                <el-progress
                  :percentage="detailNetwork.resourceUsage.memory"
                  :color="detailNetwork.resourceUsage.memory > 80 ? '#f56c6c' : '#67c23a'"
                />
              </div>
              <div class="resource-item">
                <div class="resource-label">磁盘使用率</div>
                <el-progress
                  :percentage="detailNetwork.resourceUsage.disk"
                  :color="detailNetwork.resourceUsage.disk > 80 ? '#f56c6c' : '#67c23a'"
                />
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-dialog>

    <!-- 配置管理对话框 -->
    <el-dialog
      v-model="configDialogVisible"
      title="网络配置管理"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="configFormRef"
        :model="configForm"
        label-width="120px"
      >
        <el-form-item label="访问控制">
          <el-select
            v-model="configForm.accessControl"
            placeholder="请选择访问控制策略"
            style="width: 100%"
          >
            <el-option label="公开访问" value="public" />
            <el-option label="私有访问" value="private" />
            <el-option label="许可访问" value="permissioned" />
          </el-select>
        </el-form-item>
        <el-form-item label="安全策略">
          <el-select
            v-model="configForm.securityPolicy"
            placeholder="请选择安全策略"
            style="width: 100%"
          >
            <el-option label="低" value="low" />
            <el-option label="中" value="medium" />
            <el-option label="高" value="high" />
          </el-select>
        </el-form-item>
        <el-form-item label="CPU配额">
          <el-slider v-model="configForm.resourceQuota.cpu" :max="100" />
          <span class="slider-value">{{ configForm.resourceQuota.cpu }}%</span>
        </el-form-item>
        <el-form-item label="内存配额">
          <el-slider v-model="configForm.resourceQuota.memory" :max="100" />
          <span class="slider-value">{{ configForm.resourceQuota.memory }}%</span>
        </el-form-item>
        <el-form-item label="磁盘配额">
          <el-slider v-model="configForm.resourceQuota.disk" :max="100" />
          <span class="slider-value">{{ configForm.resourceQuota.disk }}%</span>
        </el-form-item>
        <el-form-item label="白名单">
          <el-input
            v-model="configForm.whitelist"
            type="textarea"
            :rows="3"
            placeholder="请输入白名单地址，每行一个"
          />
        </el-form-item>
        <el-form-item label="黑名单">
          <el-input
            v-model="configForm.blacklist"
            type="textarea"
            :rows="3"
            placeholder="请输入黑名单地址，每行一个"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="configDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="saveConfig">
          保存配置
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.chain-network-container {
  padding: 20px;

  .header-card {
    margin-bottom: 20px;

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .page-title {
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
  }

  .search-card {
    margin-bottom: 20px;
  }

  .table-card {
    .network-name {
      display: flex;
      align-items: center;
      gap: 8px;

      .network-icon {
        color: #409eff;
        font-size: 18px;
      }
    }

    .tps-high {
      color: #67c23a;
      font-weight: 600;
    }
  }

  .detail-container {
    .detail-card {
      margin-bottom: 20px;
      height: 100%;

      .card-title {
        font-weight: 600;
        color: #303133;
      }

      .info-item {
        display: flex;
        align-items: center;
        margin-bottom: 16px;

        .label {
          color: #909399;
          min-width: 100px;
        }

        .value {
          color: #303133;
          font-weight: 500;

          &.highlight {
            color: #409eff;
            font-size: 18px;
            font-weight: 600;
          }
        }
      }

      .resource-item {
        margin-bottom: 20px;

        .resource-label {
          margin-bottom: 8px;
          color: #606266;
          font-size: 14px;
        }
      }
    }
  }

  .form-tip {
    margin-left: 10px;
    color: #909399;
    font-size: 12px;
  }

  .slider-value {
    margin-left: 12px;
    color: #409eff;
    font-weight: 600;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
}

// Element Plus 图标占位符样式（需要安装 @element-plus/icons-vue）
:deep(.el-icon) {
  vertical-align: middle;
}
</style>
