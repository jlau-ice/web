<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'

// 类型定义
interface ContractDeployment {
  id: string
  name: string
  address: string
  network: string
  version: string
  deployTime: string
  status: 'deploying' | 'success' | 'failed' | 'pending'
  gasUsed?: string
  gasPrice?: string
  transactionHash?: string
}

interface DeploymentVersion {
  id: string
  version: string
  deployTime: string
  status: 'current' | 'history' | 'deprecated'
  description: string
  contractAddress: string
}

interface DeployForm {
  contractFile?: string
  templateId?: string
  constructorParams: Record<string, any>
  network: string
  account: string
  gasLimit: string
  gasPrice: string
  owner: string
  upgradePermission: string
  destroyPermission: string
  eventListeners: string[]
  versionNotes: string
}

// 响应式数据
const loading = ref(false)
const searchText = ref('')
const filterNetwork = ref('')
const filterStatus = ref('')

// 合约部署列表
const deploymentList = ref<ContractDeployment[]>([])

// 部署向导相关
const deployDialogVisible = ref(false)
const currentStep = ref(0)
const deployForm = reactive<DeployForm>({
  contractFile: '',
  templateId: '',
  constructorParams: {},
  network: '',
  account: '',
  gasLimit: '3000000',
  gasPrice: '20',
  owner: '',
  upgradePermission: 'owner',
  destroyPermission: 'owner',
  eventListeners: [],
  versionNotes: ''
})
const deployFormRef = ref<FormInstance>()

// 版本管理相关
const versionDialogVisible = ref(false)
const currentContract = ref<ContractDeployment | null>(null)
const versionList = ref<DeploymentVersion[]>([])

// 部署监控相关
const monitorDialogVisible = ref(false)
const deployProgress = ref(0)
const deployStatus = ref<'deploying' | 'success' | 'failed'>('deploying')
const deployLogs = ref<string[]>([])

// 网络选项
const networkOptions = [
  { label: 'Ethereum Mainnet', value: 'ethereum-mainnet' },
  { label: 'Ethereum Goerli', value: 'ethereum-goerli' },
  { label: 'Polygon Mainnet', value: 'polygon-mainnet' },
  { label: 'Polygon Mumbai', value: 'polygon-mumbai' },
  { label: 'BSC Mainnet', value: 'bsc-mainnet' },
  { label: 'BSC Testnet', value: 'bsc-testnet' }
]

// 合约模板选项
const templateOptions = [
  { label: 'ERC20 Token', value: 'erc20' },
  { label: 'ERC721 NFT', value: 'erc721' },
  { label: 'ERC1155 Multi-Token', value: 'erc1155' },
  { label: 'Upgradeable Proxy', value: 'proxy' },
  { label: 'DAO Governance', value: 'dao' }
]

// 权限选项
const permissionOptions = [
  { label: '仅所有者', value: 'owner' },
  { label: '多签钱包', value: 'multisig' },
  { label: '治理投票', value: 'governance' },
  { label: '不可升级', value: 'none' }
]

// 事件监听选项
const eventOptions = [
  'Transfer',
  'Approval',
  'OwnershipTransferred',
  'Paused',
  'Unpaused',
  'Upgraded'
]

// 账户选项
const accountOptions = [
  { label: '主账户 (0x1234...5678)', value: '0x1234567890abcdef1234567890abcdef12345678' },
  { label: '部署账户 (0xabcd...ef01)', value: '0xabcdef0123456789abcdef0123456789abcdef01' },
  { label: '测试账户 (0x9876...4321)', value: '0x9876543210fedcba9876543210fedcba98765432' }
]

// 计算属性：过滤后的合约列表
const filteredDeployments = computed(() => {
  return deploymentList.value.filter(item => {
    const matchSearch = !searchText.value || item.name.toLowerCase().includes(searchText.value.toLowerCase())
    const matchNetwork = !filterNetwork.value || item.network === filterNetwork.value
    const matchStatus = !filterStatus.value || item.status === filterStatus.value
    return matchSearch && matchNetwork && matchStatus
  })
})

// 状态标签类型
const getStatusType = (status: string) => {
  const statusMap: Record<string, any> = {
    deploying: 'primary',
    success: 'success',
    failed: 'danger',
    pending: 'warning'
  }
  return statusMap[status] || 'info'
}

// 状态文本
const getStatusText = (status: string) => {
  const statusTextMap: Record<string, string> = {
    deploying: '部署中',
    success: '成功',
    failed: '失败',
    pending: '待确认'
  }
  return statusTextMap[status] || status
}

// 版本状态标签类型
const getVersionStatusType = (status: string) => {
  const statusMap: Record<string, any> = {
    current: 'success',
    history: 'info',
    deprecated: 'danger'
  }
  return statusMap[status] || 'info'
}

// 版本状态文本
const getVersionStatusText = (status: string) => {
  const statusTextMap: Record<string, string> = {
    current: '当前版本',
    history: '历史版本',
    deprecated: '废弃版本'
  }
  return statusTextMap[status] || status
}

// Mock 数据加载
const loadDeployments = () => {
  loading.value = true
  setTimeout(() => {
    deploymentList.value = [
      {
        id: '1',
        name: 'MyToken',
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        network: 'ethereum-mainnet',
        version: 'v1.2.0',
        deployTime: '2025-10-28 10:30:00',
        status: 'success',
        gasUsed: '1,234,567',
        gasPrice: '50 Gwei',
        transactionHash: '0xabc123...'
      },
      {
        id: '2',
        name: 'NFTCollection',
        address: '0x1234567890abcdef1234567890abcdef12345678',
        network: 'polygon-mainnet',
        version: 'v2.0.1',
        deployTime: '2025-10-27 15:20:00',
        status: 'success',
        gasUsed: '2,456,789',
        gasPrice: '30 Gwei',
        transactionHash: '0xdef456...'
      },
      {
        id: '3',
        name: 'DAOGovernance',
        address: '0xabcdef0123456789abcdef0123456789abcdef01',
        network: 'ethereum-goerli',
        version: 'v1.0.0',
        deployTime: '2025-10-28 09:15:00',
        status: 'deploying',
        gasUsed: '-',
        gasPrice: '20 Gwei'
      },
      {
        id: '4',
        name: 'MultiSigWallet',
        address: '0x9876543210fedcba9876543210fedcba98765432',
        network: 'bsc-mainnet',
        version: 'v1.1.5',
        deployTime: '2025-10-26 14:00:00',
        status: 'failed',
        gasUsed: '0',
        gasPrice: '5 Gwei'
      },
      {
        id: '5',
        name: 'TokenSwap',
        address: '0x5555666677778888999900001111222233334444',
        network: 'polygon-mumbai',
        version: 'v0.9.0',
        deployTime: '2025-10-28 11:45:00',
        status: 'pending',
        gasUsed: '-',
        gasPrice: '15 Gwei'
      }
    ]
    loading.value = false
  }, 800)
}

// 打开部署向导
const openDeployWizard = () => {
  deployDialogVisible.value = true
  currentStep.value = 0
  resetDeployForm()
}

// 重置部署表单
const resetDeployForm = () => {
  deployForm.contractFile = ''
  deployForm.templateId = ''
  deployForm.constructorParams = {}
  deployForm.network = ''
  deployForm.account = ''
  deployForm.gasLimit = '3000000'
  deployForm.gasPrice = '20'
  deployForm.owner = ''
  deployForm.upgradePermission = 'owner'
  deployForm.destroyPermission = 'owner'
  deployForm.eventListeners = []
  deployForm.versionNotes = ''
}

// 下一步
const nextStep = () => {
  if (currentStep.value < 3) {
    currentStep.value++
  }
}

// 上一步
const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

// 确认部署
const confirmDeploy = () => {
  // 开启部署监控
  deployDialogVisible.value = false
  monitorDialogVisible.value = true
  deployProgress.value = 0
  deployStatus.value = 'deploying'
  deployLogs.value = []

  // 模拟部署过程
  const steps = [
    { progress: 10, log: '正在编译合约...' },
    { progress: 25, log: '合约编译完成' },
    { progress: 40, log: '正在连接到网络...' },
    { progress: 55, log: '网络连接成功' },
    { progress: 70, log: '正在广播交易...' },
    { progress: 85, log: '交易已提交，等待确认...' },
    { progress: 100, log: '部署成功！' }
  ]

  let currentStepIndex = 0
  const interval = setInterval(() => {
    if (currentStepIndex < steps.length) {
      const step = steps[currentStepIndex]
      deployProgress.value = step.progress
      deployLogs.value.push(`[${new Date().toLocaleTimeString()}] ${step.log}`)
      currentStepIndex++

      if (currentStepIndex === steps.length) {
        deployStatus.value = 'success'
        clearInterval(interval)
        ElMessage.success('合约部署成功！')
        // 刷新列表
        setTimeout(() => {
          loadDeployments()
        }, 1000)
      }
    }
  }, 800)
}

// 查看版本
const viewVersions = (contract: ContractDeployment) => {
  currentContract.value = contract
  versionDialogVisible.value = true
  
  // Mock 版本数据
  setTimeout(() => {
    versionList.value = [
      {
        id: '1',
        version: contract.version,
        deployTime: contract.deployTime,
        status: 'current',
        description: '当前运行版本，修复了安全漏洞并优化了Gas消耗',
        contractAddress: contract.address
      },
      {
        id: '2',
        version: 'v1.1.0',
        deployTime: '2025-10-20 10:00:00',
        status: 'history',
        description: '增加了新的权限管理功能',
        contractAddress: '0x111222333444555666777888999000aaabbbcccc'
      },
      {
        id: '3',
        version: 'v1.0.0',
        deployTime: '2025-10-15 14:30:00',
        status: 'deprecated',
        description: '初始版本，已废弃',
        contractAddress: '0xaaabbbcccdddeeefff000111222333444555666'
      }
    ]
  }, 500)
}

// 升级合约
const upgradeContract = (version: DeploymentVersion) => {
  ElMessageBox.confirm(
    `确定要升级到版本 ${version.version} 吗？`,
    '确认升级',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.success('合约升级成功！')
    versionDialogVisible.value = false
    loadDeployments()
  }).catch(() => {
    // 取消操作
  })
}

// 回滚版本
const rollbackVersion = (version: DeploymentVersion) => {
  ElMessageBox.confirm(
    `确定要回滚到版本 ${version.version} 吗？此操作需要谨慎处理。`,
    '确认回滚',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error'
    }
  ).then(() => {
    ElMessage.success('版本回滚成功！')
    versionDialogVisible.value = false
    loadDeployments()
  }).catch(() => {
    // 取消操作
  })
}

// 查看详情
const viewDetail = (contract: ContractDeployment) => {
  ElMessageBox.alert(
    `
    <div style="line-height: 1.8;">
      <p><strong>合约名称：</strong>${contract.name}</p>
      <p><strong>合约地址：</strong>${contract.address}</p>
      <p><strong>部署网络：</strong>${contract.network}</p>
      <p><strong>版本号：</strong>${contract.version}</p>
      <p><strong>部署时间：</strong>${contract.deployTime}</p>
      <p><strong>Gas消耗：</strong>${contract.gasUsed || '-'}</p>
      <p><strong>Gas价格：</strong>${contract.gasPrice || '-'}</p>
      <p><strong>交易哈希：</strong>${contract.transactionHash || '-'}</p>
    </div>
    `,
    '合约详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '关闭'
    }
  )
}

// 删除合约
const deleteContract = (contract: ContractDeployment) => {
  ElMessageBox.confirm(
    `确定要删除合约 ${contract.name} 吗？此操作不可恢复。`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error'
    }
  ).then(() => {
    deploymentList.value = deploymentList.value.filter(item => item.id !== contract.id)
    ElMessage.success('删除成功！')
  }).catch(() => {
    // 取消操作
  })
}

// 重置筛选
const resetFilters = () => {
  searchText.value = ''
  filterNetwork.value = ''
  filterStatus.value = ''
}

// 关闭监控弹窗
const closeMonitorDialog = () => {
  monitorDialogVisible.value = false
}

// 组件挂载时加载数据
onMounted(() => {
  loadDeployments()
})
</script>

<template>
  <div class="contract-deploy-container">
    <!-- 头部操作区 -->
    <el-card class="header-card" shadow="never">
      <div class="header-content">
        <div class="title-section">
          <h2 class="page-title">合约部署管理</h2>
          <p class="page-desc">智能合约的部署和版本管理，提供一站式的合约部署服务</p>
        </div>
        <el-button type="primary" size="large" @click="openDeployWizard">
          <el-icon><Plus /></el-icon>
          部署新合约
        </el-button>
      </div>
    </el-card>

    <!-- 筛选区 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" class="filter-form">
        <el-form-item label="合约名称">
          <el-input
            v-model="searchText"
            placeholder="搜索合约名称"
            clearable
            style="width: 200px"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="部署网络">
          <el-select
            v-model="filterNetwork"
            placeholder="全部网络"
            clearable
            style="width: 200px"
          >
            <el-option
              v-for="network in networkOptions"
              :key="network.value"
              :label="network.label"
              :value="network.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="部署状态">
          <el-select
            v-model="filterStatus"
            placeholder="全部状态"
            clearable
            style="width: 150px"
          >
            <el-option label="部署中" value="deploying" />
            <el-option label="成功" value="success" />
            <el-option label="失败" value="failed" />
            <el-option label="待确认" value="pending" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 合约列表 -->
    <el-card class="table-card" shadow="never">
      <el-table
        :data="filteredDeployments"
        v-loading="loading"
        style="width: 100%"
        stripe
      >
        <el-table-column prop="name" label="合约名称" width="150" />
        <el-table-column prop="address" label="合约地址" width="200">
          <template #default="{ row }">
            <el-tooltip :content="row.address" placement="top">
              <span class="address-text">{{ row.address.slice(0, 10) }}...{{ row.address.slice(-8) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="network" label="部署网络" width="180">
          <template #default="{ row }">
            <el-tag size="small">
              {{ networkOptions.find(n => n.value === row.network)?.label || row.network }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="version" label="版本号" width="120" />
        <el-table-column prop="deployTime" label="部署时间" width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="280">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="viewDetail(row)">
              详情
            </el-button>
            <el-button link type="primary" size="small" @click="viewVersions(row)">
              版本管理
            </el-button>
            <el-button
              link
              type="danger"
              size="small"
              @click="deleteContract(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 部署向导弹窗 -->
    <el-dialog
      v-model="deployDialogVisible"
      title="合约部署向导"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-steps :active="currentStep" finish-status="success" align-center class="deploy-steps">
        <el-step title="选择合约" description="选择文件或模板" />
        <el-step title="配置参数" description="设置构造函数参数" />
        <el-step title="选择网络" description="选择目标网络和账户" />
        <el-step title="确认部署" description="检查信息并部署" />
      </el-steps>

      <div class="step-content">
        <!-- 第一步：选择合约 -->
        <div v-if="currentStep === 0" class="step-panel">
          <el-form :model="deployForm" label-width="120px">
            <el-form-item label="选择方式">
              <el-radio-group v-model="deployForm.contractFile">
                <el-radio label="upload">上传合约文件</el-radio>
                <el-radio label="template">从模板库选择</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item v-if="deployForm.contractFile === 'upload'" label="合约文件">
              <el-upload
                class="upload-demo"
                drag
                action="#"
                :auto-upload="false"
              >
                <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                <div class="el-upload__text">
                  拖拽文件到此处或 <em>点击上传</em>
                </div>
                <template #tip>
                  <div class="el-upload__tip">
                    支持 .sol 文件，单个文件不超过 10MB
                  </div>
                </template>
              </el-upload>
            </el-form-item>
            <el-form-item v-if="deployForm.contractFile === 'template'" label="选择模板">
              <el-select v-model="deployForm.templateId" placeholder="请选择合约模板" style="width: 100%">
                <el-option
                  v-for="template in templateOptions"
                  :key="template.value"
                  :label="template.label"
                  :value="template.value"
                />
              </el-select>
            </el-form-item>
          </el-form>
        </div>

        <!-- 第二步：配置参数 -->
        <div v-if="currentStep === 1" class="step-panel">
          <el-form :model="deployForm" label-width="150px">
            <el-alert
              title="根据合约构造函数配置初始化参数"
              type="info"
              :closable="false"
              style="margin-bottom: 20px"
            />
            <el-form-item label="代币名称">
              <el-input v-model="deployForm.constructorParams.name" placeholder="例如：MyToken" />
            </el-form-item>
            <el-form-item label="代币符号">
              <el-input v-model="deployForm.constructorParams.symbol" placeholder="例如：MTK" />
            </el-form-item>
            <el-form-item label="初始供应量">
              <el-input v-model="deployForm.constructorParams.initialSupply" placeholder="例如：1000000" />
            </el-form-item>
            <el-form-item label="小数位数">
              <el-input v-model="deployForm.constructorParams.decimals" placeholder="例如：18" />
            </el-form-item>
          </el-form>
        </div>

        <!-- 第三步：选择网络 -->
        <div v-if="currentStep === 2" class="step-panel">
          <el-form :model="deployForm" label-width="150px">
            <el-form-item label="目标网络" required>
              <el-select v-model="deployForm.network" placeholder="请选择目标网络" style="width: 100%">
                <el-option
                  v-for="network in networkOptions"
                  :key="network.value"
                  :label="network.label"
                  :value="network.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="部署账户" required>
              <el-select v-model="deployForm.account" placeholder="请选择部署账户" style="width: 100%">
                <el-option
                  v-for="account in accountOptions"
                  :key="account.value"
                  :label="account.label"
                  :value="account.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="Gas 限制">
              <el-input v-model="deployForm.gasLimit" placeholder="例如：3000000" />
            </el-form-item>
            <el-form-item label="Gas 价格 (Gwei)">
              <el-input v-model="deployForm.gasPrice" placeholder="例如：20" />
            </el-form-item>
            <el-form-item label="合约所有者">
              <el-input v-model="deployForm.owner" placeholder="默认为部署账户" />
            </el-form-item>
            <el-form-item label="升级权限">
              <el-select v-model="deployForm.upgradePermission" placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="permission in permissionOptions"
                  :key="permission.value"
                  :label="permission.label"
                  :value="permission.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="销毁权限">
              <el-select v-model="deployForm.destroyPermission" placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="permission in permissionOptions"
                  :key="permission.value"
                  :label="permission.label"
                  :value="permission.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="事件监听">
              <el-select
                v-model="deployForm.eventListeners"
                multiple
                placeholder="请选择要监听的事件"
                style="width: 100%"
              >
                <el-option
                  v-for="event in eventOptions"
                  :key="event"
                  :label="event"
                  :value="event"
                />
              </el-select>
            </el-form-item>
          </el-form>
        </div>

        <!-- 第四步：确认部署 -->
        <div v-if="currentStep === 3" class="step-panel">
          <el-alert
            title="请仔细检查部署信息，确认无误后点击【开始部署】"
            type="warning"
            :closable="false"
            style="margin-bottom: 20px"
          />
          <el-descriptions :column="2" border>
            <el-descriptions-item label="合约类型">
              {{ templateOptions.find(t => t.value === deployForm.templateId)?.label || '自定义合约' }}
            </el-descriptions-item>
            <el-descriptions-item label="目标网络">
              {{ networkOptions.find(n => n.value === deployForm.network)?.label || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="部署账户">
              {{ deployForm.account ? deployForm.account.slice(0, 10) + '...' + deployForm.account.slice(-8) : '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="Gas限制">
              {{ deployForm.gasLimit }}
            </el-descriptions-item>
            <el-descriptions-item label="Gas价格">
              {{ deployForm.gasPrice }} Gwei
            </el-descriptions-item>
            <el-descriptions-item label="升级权限">
              {{ permissionOptions.find(p => p.value === deployForm.upgradePermission)?.label || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="销毁权限">
              {{ permissionOptions.find(p => p.value === deployForm.destroyPermission)?.label || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="事件监听">
              {{ deployForm.eventListeners.join(', ') || '无' }}
            </el-descriptions-item>
          </el-descriptions>
          <el-form :model="deployForm" label-width="120px" style="margin-top: 20px">
            <el-form-item label="版本说明">
              <el-input
                v-model="deployForm.versionNotes"
                type="textarea"
                :rows="3"
                placeholder="请输入本次部署的版本说明..."
              />
            </el-form-item>
          </el-form>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="deployDialogVisible = false">取消</el-button>
          <el-button v-if="currentStep > 0" @click="prevStep">上一步</el-button>
          <el-button v-if="currentStep < 3" type="primary" @click="nextStep">下一步</el-button>
          <el-button v-if="currentStep === 3" type="primary" @click="confirmDeploy">开始部署</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 版本管理弹窗 -->
    <el-dialog
      v-model="versionDialogVisible"
      :title="`${currentContract?.name} - 版本管理`"
      width="900px"
    >
      <el-table :data="versionList" style="width: 100%">
        <el-table-column prop="version" label="版本号" width="120" />
        <el-table-column prop="contractAddress" label="合约地址" width="200">
          <template #default="{ row }">
            <el-tooltip :content="row.contractAddress" placement="top">
              <span class="address-text">{{ row.contractAddress.slice(0, 10) }}...{{ row.contractAddress.slice(-8) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="deployTime" label="部署时间" width="180" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getVersionStatusType(row.status)">
              {{ getVersionStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="版本说明" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status !== 'current'"
              link
              type="primary"
              size="small"
              @click="upgradeContract(row)"
            >
              升级到此版本
            </el-button>
            <el-button
              v-if="row.status === 'history'"
              link
              type="warning"
              size="small"
              @click="rollbackVersion(row)"
            >
              回滚
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 部署监控弹窗 -->
    <el-dialog
      v-model="monitorDialogVisible"
      title="部署监控"
      width="700px"
      :close-on-click-modal="false"
      :show-close="deployStatus !== 'deploying'"
    >
      <div class="monitor-content">
        <el-alert
          v-if="deployStatus === 'deploying'"
          title="合约正在部署中，请勿关闭此窗口..."
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        />
        <el-alert
          v-if="deployStatus === 'success'"
          title="合约部署成功！"
          type="success"
          :closable="false"
          style="margin-bottom: 20px"
        />
        <el-alert
          v-if="deployStatus === 'failed'"
          title="合约部署失败，请检查配置后重试"
          type="error"
          :closable="false"
          style="margin-bottom: 20px"
        />

        <div class="progress-section">
          <el-progress
            :percentage="deployProgress"
            :status="deployStatus === 'success' ? 'success' : deployStatus === 'failed' ? 'exception' : undefined"
            :stroke-width="20"
          />
        </div>

        <div class="log-section">
          <h4 class="log-title">部署日志</h4>
          <div class="log-container">
            <div v-for="(log, index) in deployLogs" :key="index" class="log-item">
              {{ log }}
            </div>
            <div v-if="deployLogs.length === 0" class="log-empty">
              暂无日志信息
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button
          v-if="deployStatus !== 'deploying'"
          type="primary"
          @click="closeMonitorDialog"
        >
          关闭
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.contract-deploy-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;

  .header-card {
    margin-bottom: 20px;

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .title-section {
        .page-title {
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 600;
          color: #303133;
        }

        .page-desc {
          margin: 0;
          font-size: 14px;
          color: #909399;
        }
      }
    }
  }

  .filter-card {
    margin-bottom: 20px;

    .filter-form {
      margin-bottom: 0;
    }
  }

  .table-card {
    .address-text {
      font-family: monospace;
      font-size: 13px;
      color: #606266;
      cursor: pointer;

      &:hover {
        color: #409eff;
      }
    }
  }

  .deploy-steps {
    margin: 30px 0;
  }

  .step-content {
    min-height: 400px;
    padding: 20px 0;

    .step-panel {
      animation: fadeIn 0.3s;
    }
  }

  .monitor-content {
    .progress-section {
      margin: 30px 0;
    }

    .log-section {
      margin-top: 30px;

      .log-title {
        margin: 0 0 15px 0;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }

      .log-container {
        background-color: #f5f7fa;
        border: 1px solid #dcdfe6;
        border-radius: 4px;
        padding: 15px;
        max-height: 300px;
        overflow-y: auto;
        font-family: monospace;
        font-size: 13px;

        .log-item {
          line-height: 1.8;
          color: #606266;
          margin-bottom: 5px;

          &:last-child {
            margin-bottom: 0;
          }
        }

        .log-empty {
          text-align: center;
          color: #909399;
          padding: 20px;
        }
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>