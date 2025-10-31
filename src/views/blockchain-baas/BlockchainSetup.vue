<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'

// 类型定义
interface NetworkConfig {
  name: string
  version: string
  consensus: string
  description: string
}

interface OrganizationConfig {
  id: string
  name: string
  peerCount: number
  ordererCount: number
}

interface NetworkParams {
  blockSize: number
  blockTimeout: number
  channelName: string
  cpuLimit: number
  memoryLimit: number
  storageLimit: number
}

interface DeploymentStatus {
  node: string
  status: 'pending' | 'running' | 'success' | 'failed'
  progress: number
  message: string
}

interface Template {
  id: string
  name: string
  type: string
  description: string
  organizations: number
  nodes: number
  isShared: boolean
}

interface TestResult {
  name: string
  status: 'success' | 'failed' | 'running'
  duration: number
  message: string
}

// 当前步骤和功能模式
const currentStep = ref(0)
const currentMode = ref<'wizard' | 'topology' | 'deploy' | 'template' | 'test'>('wizard')

// 网络配置数据
const networkConfig = reactive<NetworkConfig>({
  name: '',
  version: 'Fabric 2.4',
  consensus: 'raft',
  description: ''
})

// 组织配置
const organizations = ref<OrganizationConfig[]>([
  { id: '1', name: 'Org1', peerCount: 2, ordererCount: 1 }
])

// 网络参数
const networkParams = reactive<NetworkParams>({
  blockSize: 10,
  blockTimeout: 2,
  channelName: 'mychannel',
  cpuLimit: 2,
  memoryLimit: 4,
  storageLimit: 50
})

// 部署状态
const deploymentStatus = ref<DeploymentStatus[]>([])
const isDeploying = ref(false)
const deploymentLogs = ref<string[]>([])

// 模板列表
const templates = ref<Template[]>([
  {
    id: '1',
    name: '单组织双节点',
    type: 'basic',
    description: '适合开发测试环境的简单配置',
    organizations: 1,
    nodes: 2,
    isShared: true
  },
  {
    id: '2',
    name: '多组织联盟链',
    type: 'consortium',
    description: '适合多方协作的联盟链场景',
    organizations: 3,
    nodes: 9,
    isShared: true
  },
  {
    id: '3',
    name: '高可用生产环境',
    type: 'production',
    description: '高可用配置，适合生产环境',
    organizations: 2,
    nodes: 8,
    isShared: false
  }
])

// 测试结果
const testResults = ref<TestResult[]>([])
const isTesting = ref(false)

// 对话框控制
const showTemplateDialog = ref(false)
const showTopologyDialog = ref(false)

// 共识算法选项
const consensusOptions = [
  { label: 'Raft', value: 'raft' },
  { label: 'Kafka', value: 'kafka' },
  { label: 'Solo', value: 'solo' }
]

// 版本选项
const versionOptions = [
  'Fabric 2.4',
  'Fabric 2.3',
  'Fabric 2.2',
  'Fabric 2.1'
]

// 添加组织
const addOrganization = () => {
  const newId = (organizations.value.length + 1).toString()
  organizations.value.push({
    id: newId,
    name: `Org${newId}`,
    peerCount: 2,
    ordererCount: 0
  })
}

// 删除组织
const removeOrganization = (id: string) => {
  if (organizations.value.length <= 1) {
    ElMessage.warning('至少需要保留一个组织')
    return
  }
  organizations.value = organizations.value.filter(org => org.id !== id)
}

// 下一步
const nextStep = () => {
  if (currentStep.value === 0 && !networkConfig.name) {
    ElMessage.warning('请填写网络名称')
    return
  }
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

// 开始部署
const startDeployment = async () => {
  isDeploying.value = true
  deploymentStatus.value = []
  deploymentLogs.value = []
  
  // 初始化部署状态
  organizations.value.forEach(org => {
    for (let i = 0; i < org.peerCount; i++) {
      deploymentStatus.value.push({
        node: `${org.name}-peer${i}`,
        status: 'pending',
        progress: 0,
        message: '等待部署...'
      })
    }
    if (org.ordererCount > 0) {
      for (let i = 0; i < org.ordererCount; i++) {
        deploymentStatus.value.push({
          node: `${org.name}-orderer${i}`,
          status: 'pending',
          progress: 0,
          message: '等待部署...'
        })
      }
    }
  })
  
  // 模拟部署过程
  for (let i = 0; i < deploymentStatus.value.length; i++) {
    const node = deploymentStatus.value[i]
    node.status = 'running'
    node.message = '正在部署...'
    
    // 添加日志
    addLog(`[INFO] 开始部署节点 ${node.node}`)
    
    // 模拟进度更新
    for (let progress = 0; progress <= 100; progress += 20) {
      await sleep(300)
      node.progress = progress
      if (progress === 40) {
        addLog(`[INFO] ${node.node} 镜像拉取完成`)
      } else if (progress === 60) {
        addLog(`[INFO] ${node.node} 容器启动中`)
      } else if (progress === 80) {
        addLog(`[INFO] ${node.node} 配置文件生成完成`)
      }
    }
    
    // 随机成功或失败（90%成功率）
    const isSuccess = Math.random() > 0.1
    node.status = isSuccess ? 'success' : 'failed'
    node.message = isSuccess ? '部署成功' : '部署失败：连接超时'
    addLog(isSuccess 
      ? `[SUCCESS] ${node.node} 部署成功` 
      : `[ERROR] ${node.node} 部署失败：连接超时`
    )
    
    await sleep(200)
  }
  
  isDeploying.value = false
  
  // 检查是否全部成功
  const allSuccess = deploymentStatus.value.every(s => s.status === 'success')
  if (allSuccess) {
    ElNotification.success({
      title: '部署完成',
      message: '区块链网络已成功部署！',
      duration: 3000
    })
  } else {
    ElNotification.warning({
      title: '部署完成',
      message: '部分节点部署失败，请检查日志',
      duration: 3000
    })
  }
}

// 添加日志
const addLog = (message: string) => {
  const timestamp = new Date().toLocaleTimeString()
  deploymentLogs.value.push(`[${timestamp}] ${message}`)
}

// 睡眠函数
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// 应用模板
const applyTemplate = (template: Template) => {
  if (template.id === '1') {
    networkConfig.name = '开发测试网络'
    networkConfig.consensus = 'solo'
    organizations.value = [
      { id: '1', name: 'Org1', peerCount: 2, ordererCount: 1 }
    ]
  } else if (template.id === '2') {
    networkConfig.name = '联盟链网络'
    networkConfig.consensus = 'raft'
    organizations.value = [
      { id: '1', name: 'Org1', peerCount: 3, ordererCount: 1 },
      { id: '2', name: 'Org2', peerCount: 3, ordererCount: 1 },
      { id: '3', name: 'Org3', peerCount: 3, ordererCount: 1 }
    ]
  } else if (template.id === '3') {
    networkConfig.name = '生产环境网络'
    networkConfig.consensus = 'raft'
    organizations.value = [
      { id: '1', name: 'Org1', peerCount: 4, ordererCount: 2 },
      { id: '2', name: 'Org2', peerCount: 4, ordererCount: 1 }
    ]
  }
  
  showTemplateDialog.value = false
  ElMessage.success('模板应用成功')
}

// 开始测试
const startTest = async () => {
  isTesting.value = true
  testResults.value = []
  
  const tests = [
    { name: '节点连通性测试', duration: 0 },
    { name: '排序服务测试', duration: 0 },
    { name: '通道创建测试', duration: 0 },
    { name: '链码部署测试', duration: 0 },
    { name: '交易提交测试', duration: 0 },
    { name: '查询功能测试', duration: 0 },
    { name: '性能压力测试', duration: 0 }
  ]
  
  for (const test of tests) {
    testResults.value.push({
      name: test.name,
      status: 'running',
      duration: 0,
      message: '测试中...'
    })
    
    const startTime = Date.now()
    await sleep(1000 + Math.random() * 2000)
    const duration = Date.now() - startTime
    
    const isSuccess = Math.random() > 0.15
    const result = testResults.value.find(r => r.name === test.name)
    if (result) {
      result.status = isSuccess ? 'success' : 'failed'
      result.duration = duration
      result.message = isSuccess ? '测试通过' : '测试失败'
    }
  }
  
  isTesting.value = false
  
  const passedCount = testResults.value.filter(r => r.status === 'success').length
  ElNotification.info({
    title: '测试完成',
    message: `共 ${testResults.value.length} 项测试，通过 ${passedCount} 项`,
    duration: 3000
  })
}

// 导出配置
const exportConfig = () => {
  const config = {
    network: networkConfig,
    organizations: organizations.value,
    params: networkParams
  }
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${networkConfig.name || 'network'}-config.json`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('配置已导出')
}

// 切换模式
const switchMode = (mode: typeof currentMode.value) => {
  currentMode.value = mode
  if (mode === 'wizard') {
    currentStep.value = 0
  }
}

// 计算总节点数
const totalNodes = computed(() => {
  return organizations.value.reduce((sum, org) => {
    return sum + org.peerCount + org.ordererCount
  }, 0)
})

// 步骤标题
const steps = [
  { title: '基础信息', description: '配置网络基础信息' },
  { title: '组织结构', description: '设置组织和节点' },
  { title: '网络参数', description: '配置资源和参数' },
  { title: '确认部署', description: '确认并开始部署' }
]
</script>

<template>
  <div class="blockchain-setup">
    <!-- 顶部功能切换 -->
    <div class="mode-tabs">
      <el-button 
        :type="currentMode === 'wizard' ? 'primary' : ''" 
        @click="switchMode('wizard')"
      >
        网络配置向导
      </el-button>
      <el-button 
        :type="currentMode === 'topology' ? 'primary' : ''" 
        @click="switchMode('topology')"
      >
        拓扑设计
      </el-button>
      <el-button 
        :type="currentMode === 'deploy' ? 'primary' : ''" 
        @click="switchMode('deploy')"
      >
        部署监控
      </el-button>
      <el-button 
        :type="currentMode === 'template' ? 'primary' : ''" 
        @click="switchMode('template')"
      >
        模板管理
      </el-button>
      <el-button 
        :type="currentMode === 'test' ? 'primary' : ''" 
        @click="switchMode('test')"
      >
        环境测试
      </el-button>
    </div>

    <!-- 网络配置向导 -->
    <div v-if="currentMode === 'wizard'" class="wizard-container">
      <el-row :gutter="20">
        <el-col :span="16">
          <!-- 步骤指示器 -->
          <el-card class="steps-card">
            <el-steps :active="currentStep" align-center>
              <el-step 
                v-for="(step, index) in steps" 
                :key="index"
                :title="step.title" 
                :description="step.description"
              />
            </el-steps>
          </el-card>

          <!-- 步骤内容 -->
          <el-card class="step-content">
            <!-- 第一步：基础信息 -->
            <div v-if="currentStep === 0">
              <h3>网络基础信息</h3>
              <el-form :model="networkConfig" label-width="120px">
                <el-form-item label="网络名称" required>
                  <el-input v-model="networkConfig.name" placeholder="请输入网络名称" />
                </el-form-item>
                <el-form-item label="Fabric版本">
                  <el-select v-model="networkConfig.version" style="width: 100%">
                    <el-option 
                      v-for="version in versionOptions" 
                      :key="version"
                      :label="version" 
                      :value="version"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="共识算法">
                  <el-select v-model="networkConfig.consensus" style="width: 100%">
                    <el-option 
                      v-for="opt in consensusOptions" 
                      :key="opt.value"
                      :label="opt.label" 
                      :value="opt.value"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="网络描述">
                  <el-input 
                    v-model="networkConfig.description" 
                    type="textarea" 
                    :rows="3"
                    placeholder="请输入网络描述"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="showTemplateDialog = true">
                    从模板加载
                  </el-button>
                  <el-button @click="exportConfig">导出配置</el-button>
                </el-form-item>
              </el-form>
            </div>

            <!-- 第二步：组织结构 -->
            <div v-if="currentStep === 1">
              <h3>组织和节点配置</h3>
              <div class="org-list">
                <el-card 
                  v-for="org in organizations" 
                  :key="org.id" 
                  class="org-card"
                  shadow="hover"
                >
                  <template #header>
                    <div class="org-header">
                      <span>{{ org.name }}</span>
                      <el-button 
                        type="danger" 
                        size="small" 
                        text
                        @click="removeOrganization(org.id)"
                      >
                        删除
                      </el-button>
                    </div>
                  </template>
                  <el-form label-width="120px">
                    <el-form-item label="组织名称">
                      <el-input v-model="org.name" />
                    </el-form-item>
                    <el-form-item label="Peer节点数">
                      <el-input-number 
                        v-model="org.peerCount" 
                        :min="1" 
                        :max="10"
                      />
                    </el-form-item>
                    <el-form-item label="Orderer节点数">
                      <el-input-number 
                        v-model="org.ordererCount" 
                        :min="0" 
                        :max="5"
                      />
                    </el-form-item>
                  </el-form>
                </el-card>
              </div>
              <el-button type="primary" @click="addOrganization" style="width: 100%">
                添加组织
              </el-button>
            </div>

            <!-- 第三步：网络参数 -->
            <div v-if="currentStep === 2">
              <h3>网络参数配置</h3>
              <el-form :model="networkParams" label-width="140px">
                <el-divider content-position="left">区块链参数</el-divider>
                <el-form-item label="区块大小(MB)">
                  <el-input-number 
                    v-model="networkParams.blockSize" 
                    :min="1" 
                    :max="100"
                  />
                </el-form-item>
                <el-form-item label="区块超时(秒)">
                  <el-input-number 
                    v-model="networkParams.blockTimeout" 
                    :min="1" 
                    :max="60"
                  />
                </el-form-item>
                <el-form-item label="通道名称">
                  <el-input v-model="networkParams.channelName" />
                </el-form-item>
                
                <el-divider content-position="left">资源配额</el-divider>
                <el-form-item label="CPU限制(核)">
                  <el-slider 
                    v-model="networkParams.cpuLimit" 
                    :min="1" 
                    :max="16" 
                    show-stops
                  />
                  <span class="param-value">{{ networkParams.cpuLimit }} 核</span>
                </el-form-item>
                <el-form-item label="内存限制(GB)">
                  <el-slider 
                    v-model="networkParams.memoryLimit" 
                    :min="1" 
                    :max="32" 
                    show-stops
                  />
                  <span class="param-value">{{ networkParams.memoryLimit }} GB</span>
                </el-form-item>
                <el-form-item label="存储限制(GB)">
                  <el-slider 
                    v-model="networkParams.storageLimit" 
                    :min="10" 
                    :max="500" 
                    :step="10"
                  />
                  <span class="param-value">{{ networkParams.storageLimit }} GB</span>
                </el-form-item>
              </el-form>
            </div>

            <!-- 第四步：确认部署 -->
            <div v-if="currentStep === 3">
              <h3>确认配置信息</h3>
              <el-descriptions :column="2" border>
                <el-descriptions-item label="网络名称">
                  {{ networkConfig.name }}
                </el-descriptions-item>
                <el-descriptions-item label="Fabric版本">
                  {{ networkConfig.version }}
                </el-descriptions-item>
                <el-descriptions-item label="共识算法">
                  <el-tag>{{ networkConfig.consensus.toUpperCase() }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="通道名称">
                  {{ networkParams.channelName }}
                </el-descriptions-item>
                <el-descriptions-item label="组织数量">
                  {{ organizations.length }}
                </el-descriptions-item>
                <el-descriptions-item label="节点总数">
                  {{ totalNodes }}
                </el-descriptions-item>
                <el-descriptions-item label="CPU配额">
                  {{ networkParams.cpuLimit }} 核
                </el-descriptions-item>
                <el-descriptions-item label="内存配额">
                  {{ networkParams.memoryLimit }} GB
                </el-descriptions-item>
              </el-descriptions>

              <el-alert 
                title="准备就绪" 
                type="success" 
                :closable="false"
                style="margin-top: 20px"
              >
                配置信息已确认，点击"开始部署"按钮启动区块链网络部署流程
              </el-alert>

              <div style="margin-top: 20px; text-align: center">
                <el-button 
                  type="primary" 
                  size="large"
                  :loading="isDeploying"
                  @click="startDeployment"
                >
                  {{ isDeploying ? '部署中...' : '开始部署' }}
                </el-button>
              </div>
            </div>
          </el-card>

          <!-- 步骤控制按钮 -->
          <div class="step-controls">
            <el-button 
              v-if="currentStep > 0" 
              @click="prevStep"
            >
              上一步
            </el-button>
            <el-button 
              v-if="currentStep < 3" 
              type="primary" 
              @click="nextStep"
            >
              下一步
            </el-button>
          </div>
        </el-col>

        <!-- 右侧拓扑预览 -->
        <el-col :span="8">
          <el-card class="topology-preview">
            <template #header>
              <span>网络拓扑预览</span>
            </template>
            <div class="topology-container">
              <div class="topology-summary">
                <el-statistic title="组织数量" :value="organizations.length" />
                <el-statistic title="节点总数" :value="totalNodes" />
              </div>
              <div class="topology-visual">
                <div 
                  v-for="org in organizations" 
                  :key="org.id" 
                  class="org-node"
                >
                  <div class="org-name">{{ org.name }}</div>
                  <div class="node-list">
                    <div 
                      v-for="i in org.peerCount" 
                      :key="`peer-${i}`"
                      class="node-item peer"
                    >
                      Peer{{ i - 1 }}
                    </div>
                    <div 
                      v-for="i in org.ordererCount" 
                      :key="`orderer-${i}`"
                      class="node-item orderer"
                    >
                      Orderer{{ i - 1 }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 拓扑设计模式 -->
    <div v-if="currentMode === 'topology'" class="topology-mode">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>可视化拓扑设计</span>
            <div>
              <el-button size="small">导入拓扑</el-button>
              <el-button size="small" type="primary">导出拓扑</el-button>
            </div>
          </div>
        </template>
        <el-alert 
          title="拖拽操作提示" 
          type="info" 
          :closable="false"
          style="margin-bottom: 20px"
        >
          从左侧工具栏拖拽组件到画布中，双击节点可编辑属性
        </el-alert>
        <div class="topology-designer">
          <div class="toolbar">
            <div class="tool-item">
              <div class="icon org-icon">🏢</div>
              <div>组织</div>
            </div>
            <div class="tool-item">
              <div class="icon peer-icon">📦</div>
              <div>Peer</div>
            </div>
            <div class="tool-item">
              <div class="icon orderer-icon">⚙️</div>
              <div>Orderer</div>
            </div>
            <div class="tool-item">
              <div class="icon channel-icon">🔗</div>
              <div>Channel</div>
            </div>
          </div>
          <div class="canvas">
            <div class="canvas-grid">
              <div 
                v-for="org in organizations" 
                :key="org.id"
                class="canvas-org"
                :style="{ left: (parseInt(org.id) - 1) * 300 + 50 + 'px' }"
              >
                <div class="canvas-org-header">{{ org.name }}</div>
                <div class="canvas-nodes">
                  <div 
                    v-for="i in org.peerCount" 
                    :key="`p${i}`"
                    class="canvas-node peer"
                  >
                    <div class="node-icon">📦</div>
                    <div class="node-label">Peer{{ i - 1 }}</div>
                  </div>
                  <div 
                    v-for="i in org.ordererCount" 
                    :key="`o${i}`"
                    class="canvas-node orderer"
                  >
                    <div class="node-icon">⚙️</div>
                    <div class="node-label">Orderer{{ i - 1 }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 部署监控模式 -->
    <div v-if="currentMode === 'deploy'" class="deploy-mode">
      <el-row :gutter="20">
        <el-col :span="16">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>部署进度监控</span>
                <el-button 
                  type="primary" 
                  size="small"
                  :loading="isDeploying"
                  @click="startDeployment"
                >
                  {{ isDeploying ? '部署中' : '开始部署' }}
                </el-button>
              </div>
            </template>
            <div v-if="deploymentStatus.length === 0" class="empty-state">
              <el-empty description="暂无部署任务，点击开始部署按钮启动部署流程" />
            </div>
            <div v-else class="deployment-list">
              <div 
                v-for="item in deploymentStatus" 
                :key="item.node"
                class="deployment-item"
              >
                <div class="item-header">
                  <span class="node-name">{{ item.node }}</span>
                  <el-tag 
                    :type="
                      item.status === 'success' ? 'success' :
                      item.status === 'failed' ? 'danger' :
                      item.status === 'running' ? 'primary' : 'info'
                    "
                    size="small"
                  >
                    {{ 
                      item.status === 'success' ? '成功' :
                      item.status === 'failed' ? '失败' :
                      item.status === 'running' ? '进行中' : '等待中'
                    }}
                  </el-tag>
                </div>
                <el-progress 
                  :percentage="item.progress"
                  :status="
                    item.status === 'success' ? 'success' :
                    item.status === 'failed' ? 'exception' : undefined
                  "
                />
                <div class="item-message">{{ item.message }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card>
            <template #header>
              <span>部署日志</span>
            </template>
            <div class="log-container">
              <div 
                v-for="(log, index) in deploymentLogs" 
                :key="index"
                class="log-line"
                :class="{
                  'log-error': log.includes('ERROR'),
                  'log-success': log.includes('SUCCESS')
                }"
              >
                {{ log }}
              </div>
              <div v-if="deploymentLogs.length === 0" class="log-empty">
                暂无日志信息
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 模板管理模式 -->
    <div v-if="currentMode === 'template'" class="template-mode">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>网络模板库</span>
            <el-button type="primary" size="small">创建模板</el-button>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col 
            v-for="template in templates" 
            :key="template.id"
            :span="8"
          >
            <el-card class="template-card" shadow="hover">
              <div class="template-header">
                <h3>{{ template.name }}</h3>
                <el-tag 
                  :type="template.isShared ? 'success' : 'warning'"
                  size="small"
                >
                  {{ template.isShared ? '共享' : '私有' }}
                </el-tag>
              </div>
              <p class="template-description">{{ template.description }}</p>
              <el-descriptions :column="1" size="small" border>
                <el-descriptions-item label="类型">
                  {{ template.type }}
                </el-descriptions-item>
                <el-descriptions-item label="组织数">
                  {{ template.organizations }}
                </el-descriptions-item>
                <el-descriptions-item label="节点数">
                  {{ template.nodes }}
                </el-descriptions-item>
              </el-descriptions>
              <div class="template-actions">
                <el-button type="primary" size="small" @click="applyTemplate(template)">
                  应用模板
                </el-button>
                <el-button size="small">编辑</el-button>
                <el-button size="small" type="danger" text>删除</el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 环境测试模式 -->
    <div v-if="currentMode === 'test'" class="test-mode">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>环境验证测试</span>
            <div>
              <el-button 
                type="primary" 
                size="small"
                :loading="isTesting"
                @click="startTest"
              >
                {{ isTesting ? '测试中' : '开始测试' }}
              </el-button>
              <el-button size="small">导出报告</el-button>
            </div>
          </div>
        </template>
        
        <el-alert 
          v-if="testResults.length > 0"
          :title="`测试进度: ${testResults.filter(r => r.status !== 'running').length} / ${testResults.length}`"
          :type="isTesting ? 'info' : 'success'"
          :closable="false"
          style="margin-bottom: 20px"
        />

        <div v-if="testResults.length === 0" class="empty-state">
          <el-empty description="暂无测试结果，点击开始测试按钮进行环境验证" />
        </div>

        <div v-else class="test-results">
          <el-card 
            v-for="result in testResults" 
            :key="result.name"
            class="test-item"
            shadow="hover"
          >
            <div class="test-header">
              <span class="test-name">{{ result.name }}</span>
              <el-tag 
                :type="
                  result.status === 'success' ? 'success' :
                  result.status === 'failed' ? 'danger' : 'info'
                "
              >
                {{ 
                  result.status === 'success' ? '通过' :
                  result.status === 'failed' ? '失败' : '测试中'
                }}
              </el-tag>
            </div>
            <div class="test-info">
              <span>耗时: {{ result.duration }}ms</span>
              <span class="test-message">{{ result.message }}</span>
            </div>
            <el-progress 
              v-if="result.status === 'running'"
              :percentage="50"
              :indeterminate="true"
            />
          </el-card>
        </div>
      </el-card>
    </div>

    <!-- 模板选择对话框 -->
    <el-dialog 
      v-model="showTemplateDialog" 
      title="选择网络模板" 
      width="800px"
    >
      <el-row :gutter="20">
        <el-col 
          v-for="template in templates" 
          :key="template.id"
          :span="12"
        >
          <el-card 
            class="template-select-card" 
            shadow="hover"
            @click="applyTemplate(template)"
          >
            <h4>{{ template.name }}</h4>
            <p>{{ template.description }}</p>
            <div class="template-meta">
              <span>组织: {{ template.organizations }}</span>
              <span>节点: {{ template.nodes }}</span>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.blockchain-setup {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 120px);

  .mode-tabs {
    margin-bottom: 20px;
    padding: 15px;
    background: white;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .wizard-container {
    .steps-card {
      margin-bottom: 20px;
    }

    .step-content {
      min-height: 400px;
      margin-bottom: 20px;

      h3 {
        margin-bottom: 20px;
        color: #303133;
        font-size: 18px;
      }

      .org-list {
        margin-bottom: 20px;

        .org-card {
          margin-bottom: 15px;

          .org-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
        }
      }

      .param-value {
        margin-left: 10px;
        color: #409eff;
        font-weight: bold;
      }
    }

    .step-controls {
      text-align: center;
      padding: 20px;
    }

    .topology-preview {
      position: sticky;
      top: 20px;

      .topology-summary {
        display: flex;
        justify-content: space-around;
        margin-bottom: 30px;
      }

      .topology-visual {
        .org-node {
          background: #f0f9ff;
          border: 2px solid #409eff;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 15px;

          .org-name {
            font-weight: bold;
            color: #409eff;
            margin-bottom: 10px;
            text-align: center;
          }

          .node-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;

            .node-item {
              padding: 5px 10px;
              border-radius: 4px;
              font-size: 12px;
              color: white;

              &.peer {
                background: #67c23a;
              }

              &.orderer {
                background: #e6a23c;
              }
            }
          }
        }
      }
    }
  }

  .topology-mode {
    .topology-designer {
      display: flex;
      height: 600px;

      .toolbar {
        width: 100px;
        border-right: 1px solid #dcdfe6;
        padding: 10px;

        .tool-item {
          text-align: center;
          padding: 10px;
          margin-bottom: 10px;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.3s;

          &:hover {
            background: #f0f9ff;
          }

          .icon {
            font-size: 32px;
            margin-bottom: 5px;
          }

          div:last-child {
            font-size: 12px;
            color: #606266;
          }
        }
      }

      .canvas {
        flex: 1;
        background: 
          linear-gradient(90deg, #f5f5f5 1px, transparent 1px),
          linear-gradient(#f5f5f5 1px, transparent 1px);
        background-size: 20px 20px;
        position: relative;
        overflow: auto;

        .canvas-grid {
          min-height: 100%;
          position: relative;
        }

        .canvas-org {
          position: absolute;
          top: 50px;
          background: white;
          border: 2px solid #409eff;
          border-radius: 8px;
          padding: 15px;
          min-width: 200px;

          .canvas-org-header {
            font-weight: bold;
            color: #409eff;
            margin-bottom: 15px;
            text-align: center;
            font-size: 16px;
          }

          .canvas-nodes {
            display: flex;
            flex-direction: column;
            gap: 10px;

            .canvas-node {
              display: flex;
              align-items: center;
              gap: 10px;
              padding: 10px;
              border-radius: 6px;
              cursor: move;

              &.peer {
                background: #f0f9ff;
                border: 1px solid #67c23a;
              }

              &.orderer {
                background: #fef0e6;
                border: 1px solid #e6a23c;
              }

              .node-icon {
                font-size: 24px;
              }

              .node-label {
                font-size: 14px;
                font-weight: 500;
              }
            }
          }
        }
      }
    }
  }

  .deploy-mode {
    .deployment-list {
      .deployment-item {
        padding: 15px;
        border-bottom: 1px solid #ebeef5;

        &:last-child {
          border-bottom: none;
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;

          .node-name {
            font-weight: bold;
            color: #303133;
          }
        }

        .item-message {
          margin-top: 5px;
          font-size: 12px;
          color: #909399;
        }
      }
    }

    .log-container {
      max-height: 500px;
      overflow-y: auto;
      background: #1e1e1e;
      padding: 15px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 12px;

      .log-line {
        color: #d4d4d4;
        margin-bottom: 5px;
        line-height: 1.5;

        &.log-error {
          color: #f56c6c;
        }

        &.log-success {
          color: #67c23a;
        }
      }

      .log-empty {
        color: #909399;
        text-align: center;
        padding: 20px;
      }
    }
  }

  .template-mode {
    .template-card {
      margin-bottom: 20px;

      .template-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;

        h3 {
          margin: 0;
          font-size: 16px;
          color: #303133;
        }
      }

      .template-description {
        color: #606266;
        font-size: 14px;
        margin-bottom: 15px;
        line-height: 1.6;
      }

      .template-actions {
        margin-top: 15px;
        display: flex;
        gap: 10px;
      }
    }
  }

  .test-mode {
    .test-results {
      .test-item {
        margin-bottom: 15px;

        .test-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;

          .test-name {
            font-weight: bold;
            color: #303133;
          }
        }

        .test-info {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #909399;
          margin-bottom: 10px;

          .test-message {
            color: #606266;
          }
        }
      }
    }
  }

  .empty-state {
    padding: 60px 20px;
    text-align: center;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .template-select-card {
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-5px);
      border-color: #409eff;
    }

    h4 {
      margin: 0 0 10px 0;
      color: #303133;
    }

    p {
      color: #606266;
      font-size: 13px;
      margin-bottom: 15px;
      line-height: 1.5;
    }

    .template-meta {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #909399;
    }
  }
}
</style>