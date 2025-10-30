<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// 交易状态类型
type TransactionStatus = 'processing' | 'completed' | 'cancelled' | 'error'

// 安全等级类型
type SecurityLevel = 'high' | 'medium' | 'low'

// 权限配置接口
interface Permission {
  id: string
  participant: string
  role: string
  dataScope: string
  operations: string[]
  status: 'approved' | 'pending' | 'rejected'
  createTime: string
}

// 交易合约接口
interface Contract {
  id: string
  name: string
  template: string
  signStatus: string
  parties: string[]
  createTime: string
  executeStatus: string
}

// 交易监控数据接口
interface Transaction {
  id: string
  name: string
  status: TransactionStatus
  amount: number
  time: string
  parties: string[]
}

// 审计记录接口
interface AuditRecord {
  id: string
  action: string
  dataPath: string
  user: string
  time: string
  result: string
  risk: SecurityLevel
}

// 安全策略接口
interface SecurityPolicy {
  id: string
  name: string
  type: string
  rule: string
  status: boolean
  level: SecurityLevel
}

// 加载状态
const loading = ref(false)

// ==================== 1. 交易权限管理 ====================
const permissionList = ref<Permission[]>([])
const selectedPermissions = ref<string[]>([])

// 权限对话框
const permissionDialogVisible = ref(false)
const permissionForm = reactive({
  participant: '',
  role: '',
  dataScope: '',
  operations: [] as string[]
})

const permissionFormRef = ref<FormInstance>()
const permissionRules: FormRules = {
  participant: [{ required: true, message: '请输入参与方名称', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  dataScope: [{ required: true, message: '请输入数据范围', trigger: 'blur' }],
  operations: [{ required: true, message: '请选择操作权限', trigger: 'change' }]
}

const roleOptions = ['数据提供方', '数据需求方', '交易平台', '监管机构', '审计方']
const operationOptions = ['查看', '下载', '编辑', '删除', '共享', '导出']

// 加载权限列表
const loadPermissions = () => {
  loading.value = true
  setTimeout(() => {
    permissionList.value = [
      {
        id: 'P001',
        participant: '金融科技公司A',
        role: '数据需求方',
        dataScope: '客户信用数据',
        operations: ['查看', '下载'],
        status: 'approved',
        createTime: '2025-10-28 10:30:00'
      },
      {
        id: 'P002',
        participant: '数据服务商B',
        role: '数据提供方',
        dataScope: '行业报告数据',
        operations: ['查看', '共享', '导出'],
        status: 'approved',
        createTime: '2025-10-29 14:20:00'
      },
      {
        id: 'P003',
        participant: '研究机构C',
        role: '数据需求方',
        dataScope: '市场分析数据',
        operations: ['查看'],
        status: 'pending',
        createTime: '2025-10-30 09:15:00'
      },
      {
        id: 'P004',
        participant: '监管部门D',
        role: '监管机构',
        dataScope: '全部数据',
        operations: ['查看', '下载', '审计'],
        status: 'approved',
        createTime: '2025-10-27 16:00:00'
      }
    ]
    loading.value = false
  }, 800)
}

// 添加权限
const handleAddPermission = () => {
  permissionForm.participant = ''
  permissionForm.role = ''
  permissionForm.dataScope = ''
  permissionForm.operations = []
  permissionDialogVisible.value = true
}

// 提交权限配置
const submitPermission = async () => {
  if (!permissionFormRef.value) return
  await permissionFormRef.value.validate((valid) => {
    if (valid) {
      const newPermission: Permission = {
        id: `P${String(permissionList.value.length + 1).padStart(3, '0')}`,
        ...permissionForm,
        status: 'pending',
        createTime: new Date().toLocaleString('zh-CN')
      }
      permissionList.value.unshift(newPermission)
      permissionDialogVisible.value = false
      ElMessage.success('权限配置已提交，等待审批')
    }
  })
}

// 审批权限
const handleApprove = (row: Permission, approved: boolean) => {
  row.status = approved ? 'approved' : 'rejected'
  ElMessage.success(`权限${approved ? '已批准' : '已拒绝'}`)
}

// ==================== 2. 交易合约管理 ====================
const contractList = ref<Contract[]>([])
const contractDialogVisible = ref(false)
const contractForm = reactive({
  name: '',
  template: '',
  parties: [] as string[]
})

const templateOptions = [
  '数据授权使用合约',
  '数据买卖合约',
  '数据共享协议',
  '数据托管协议',
  '保密协议'
]

// 加载合约列表
const loadContracts = () => {
  setTimeout(() => {
    contractList.value = [
      {
        id: 'C001',
        name: '客户数据授权协议',
        template: '数据授权使用合约',
        signStatus: '已签署',
        parties: ['金融科技公司A', '数据服务商B'],
        createTime: '2025-10-25 10:00:00',
        executeStatus: '正常履约'
      },
      {
        id: 'C002',
        name: '市场数据采购合约',
        template: '数据买卖合约',
        signStatus: '待签署',
        parties: ['研究机构C', '数据提供商E'],
        createTime: '2025-10-28 15:30:00',
        executeStatus: '待执行'
      },
      {
        id: 'C003',
        name: '行业数据共享协议',
        template: '数据共享协议',
        signStatus: '已签署',
        parties: ['企业F', '企业G', '企业H'],
        createTime: '2025-10-26 09:20:00',
        executeStatus: '正常履约'
      }
    ]
  }, 600)
}

// 创建合约
const handleCreateContract = () => {
  contractForm.name = ''
  contractForm.template = ''
  contractForm.parties = []
  contractDialogVisible.value = true
}

const submitContract = () => {
  if (!contractForm.name || !contractForm.template || contractForm.parties.length === 0) {
    ElMessage.warning('请填写完整的合约信息')
    return
  }
  const newContract: Contract = {
    id: `C${String(contractList.value.length + 1).padStart(3, '0')}`,
    ...contractForm,
    signStatus: '待签署',
    createTime: new Date().toLocaleString('zh-CN'),
    executeStatus: '待执行'
  }
  contractList.value.unshift(newContract)
  contractDialogVisible.value = false
  ElMessage.success('合约创建成功')
}

// ==================== 3. 交易监控看板 ====================
const transactionStats = reactive({
  total: 1248,
  today: 156,
  successRate: 98.5,
  avgAmount: 45600
})

const recentTransactions = ref<Transaction[]>([])

// 加载交易数据
const loadTransactions = () => {
  setTimeout(() => {
    recentTransactions.value = [
      {
        id: 'T001',
        name: '客户信用数据交易',
        status: 'completed',
        amount: 50000,
        time: '2025-10-30 10:30:00',
        parties: ['金融科技公司A', '数据服务商B']
      },
      {
        id: 'T002',
        name: '市场分析数据采购',
        status: 'processing',
        amount: 32000,
        time: '2025-10-30 11:15:00',
        parties: ['研究机构C', '数据提供商E']
      },
      {
        id: 'T003',
        name: '行业报告数据共享',
        status: 'completed',
        amount: 28000,
        time: '2025-10-30 09:45:00',
        parties: ['企业F', '企业G']
      },
      {
        id: 'T004',
        name: '用户行为数据交易',
        status: 'error',
        amount: 0,
        time: '2025-10-30 08:20:00',
        parties: ['互联网公司I', '广告平台J']
      }
    ]
  }, 500)
}

// 交易状态标签类型
const getTransactionStatusType = (status: TransactionStatus) => {
  const map = {
    processing: 'primary',
    completed: 'success',
    cancelled: 'info',
    error: 'danger'
  }
  return map[status]
}

// 交易状态文本
const getTransactionStatusText = (status: TransactionStatus) => {
  const map = {
    processing: '进行中',
    completed: '已完成',
    cancelled: '已取消',
    error: '异常'
  }
  return map[status]
}

// ==================== 4. 流通审计追踪 ====================
const auditRecords = ref<AuditRecord[]>([])

// 加载审计记录
const loadAuditRecords = () => {
  setTimeout(() => {
    auditRecords.value = [
      {
        id: 'A001',
        action: '数据查询',
        dataPath: '金融科技公司A → 数据服务商B → 客户信用数据',
        user: '张三',
        time: '2025-10-30 10:30:15',
        result: '成功',
        risk: 'low'
      },
      {
        id: 'A002',
        action: '数据下载',
        dataPath: '研究机构C → 数据提供商E → 市场分析数据',
        user: '李四',
        time: '2025-10-30 11:20:30',
        result: '成功',
        risk: 'medium'
      },
      {
        id: 'A003',
        action: '数据导出',
        dataPath: '企业F → 企业G → 行业报告数据',
        user: '王五',
        time: '2025-10-30 09:50:45',
        result: '成功',
        risk: 'low'
      },
      {
        id: 'A004',
        action: '异常访问',
        dataPath: '未授权用户 → 敏感数据',
        user: '未知',
        time: '2025-10-30 08:25:10',
        result: '已拦截',
        risk: 'high'
      },
      {
        id: 'A005',
        action: '数据共享',
        dataPath: '数据服务商B → 多方联盟 → 脱敏数据',
        user: '赵六',
        time: '2025-10-30 14:10:00',
        result: '成功',
        risk: 'medium'
      }
    ]
  }, 700)
}

// 风险等级标签类型
const getRiskType = (risk: SecurityLevel) => {
  const map = {
    high: 'danger',
    medium: 'warning',
    low: 'success'
  }
  return map[risk]
}

// 风险等级文本
const getRiskText = (risk: SecurityLevel) => {
  const map = {
    high: '高风险',
    medium: '中风险',
    low: '低风险'
  }
  return map[risk]
}

// ==================== 5. 安全策略配置 ====================
const securityPolicies = ref<SecurityPolicy[]>([])
const policyDialogVisible = ref(false)
const policyForm = reactive({
  name: '',
  type: '',
  rule: '',
  level: 'medium' as SecurityLevel
})

const policyTypeOptions = [
  '数据加密',
  '数据脱敏',
  '访问限制',
  '时效控制',
  '次数限制',
  '密钥管理'
]

// 加载安全策略
const loadSecurityPolicies = () => {
  setTimeout(() => {
    securityPolicies.value = [
      {
        id: 'S001',
        name: 'AES-256加密策略',
        type: '数据加密',
        rule: '所有传输数据使用AES-256加密',
        status: true,
        level: 'high'
      },
      {
        id: 'S002',
        name: '敏感信息脱敏',
        type: '数据脱敏',
        rule: '姓名、身份证号、手机号自动脱敏',
        status: true,
        level: 'high'
      },
      {
        id: 'S003',
        name: '访问时段限制',
        type: '访问限制',
        rule: '仅工作日9:00-18:00可访问',
        status: false,
        level: 'medium'
      },
      {
        id: 'S004',
        name: '数据有效期',
        type: '时效控制',
        rule: '数据授权有效期30天',
        status: true,
        level: 'medium'
      },
      {
        id: 'S005',
        name: '下载次数限制',
        type: '次数限制',
        rule: '每个用户每日最多下载5次',
        status: true,
        level: 'low'
      }
    ]
  }, 600)
}

// 添加安全策略
const handleAddPolicy = () => {
  policyForm.name = ''
  policyForm.type = ''
  policyForm.rule = ''
  policyForm.level = 'medium'
  policyDialogVisible.value = true
}

// 提交安全策略
const submitPolicy = () => {
  if (!policyForm.name || !policyForm.type || !policyForm.rule) {
    ElMessage.warning('请填写完整的策略信息')
    return
  }
  const newPolicy: SecurityPolicy = {
    id: `S${String(securityPolicies.value.length + 1).padStart(3, '0')}`,
    ...policyForm,
    status: true
  }
  securityPolicies.value.unshift(newPolicy)
  policyDialogVisible.value = false
  ElMessage.success('安全策略添加成功')
}

// 切换策略状态
const togglePolicyStatus = (row: SecurityPolicy) => {
  row.status = !row.status
  ElMessage.success(`策略已${row.status ? '启用' : '禁用'}`)
}

// 删除策略
const handleDeletePolicy = (row: SecurityPolicy) => {
  ElMessageBox.confirm('确定要删除此安全策略吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = securityPolicies.value.findIndex(item => item.id === row.id)
    if (index > -1) {
      securityPolicies.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  })
}

// 安全等级颜色
const getSecurityLevelColor = (level: SecurityLevel) => {
  const map = {
    high: '#67C23A',
    medium: '#E6A23C',
    low: '#F56C6C'
  }
  return map[level]
}

// 安全等级文本
const getSecurityLevelText = (level: SecurityLevel) => {
  const map = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return map[level]
}

// ==================== 生命周期 ====================
onMounted(() => {
  loadPermissions()
  loadContracts()
  loadTransactions()
  loadAuditRecords()
  loadSecurityPolicies()
})
</script>

<template>
  <div class="secure-transaction-container">
    <!-- 页面标题 -->
    <el-card class="header-card" shadow="never">
      <div class="page-header">
        <div>
          <h2 class="page-title">安全交易管理</h2>
          <p class="page-subtitle">数据资产交易安全保障与流通监控平台</p>
        </div>
        <el-alert
          title="系统运行正常"
          type="success"
          :closable="false"
          show-icon
        />
      </div>
    </el-card>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧：交易权限管理 + 合约管理 -->
      <div class="left-section">
        <!-- 交易权限管理 -->
        <el-card class="section-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">交易权限管理</span>
              <el-button type="primary" size="small" @click="handleAddPermission">
                添加权限
              </el-button>
            </div>
          </template>

          <el-table
            :data="permissionList"
            v-loading="loading"
            stripe
            style="width: 100%"
            max-height="400"
          >
            <el-table-column prop="participant" label="参与方" width="150" />
            <el-table-column prop="role" label="角色" width="120" />
            <el-table-column prop="dataScope" label="数据范围" width="140" />
            <el-table-column label="操作权限" width="180">
              <template #default="{ row }">
                <el-tag
                  v-for="op in row.operations"
                  :key="op"
                  size="small"
                  style="margin-right: 5px"
                >
                  {{ op }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag
                  :type="
                    row.status === 'approved'
                      ? 'success'
                      : row.status === 'pending'
                      ? 'warning'
                      : 'danger'
                  "
                >
                  {{
                    row.status === 'approved'
                      ? '已批准'
                      : row.status === 'pending'
                      ? '待审批'
                      : '已拒绝'
                  }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="row.status === 'pending'"
                  link
                  type="success"
                  size="small"
                  @click="handleApprove(row, true)"
                >
                  批准
                </el-button>
                <el-button
                  v-if="row.status === 'pending'"
                  link
                  type="danger"
                  size="small"
                  @click="handleApprove(row, false)"
                >
                  拒绝
                </el-button>
                <el-button
                  v-if="row.status !== 'pending'"
                  link
                  type="primary"
                  size="small"
                >
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 交易合约管理 -->
        <el-card class="section-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">交易合约管理</span>
              <el-button type="primary" size="small" @click="handleCreateContract">
                创建合约
              </el-button>
            </div>
          </template>

          <el-table :data="contractList" stripe style="width: 100%">
            <el-table-column prop="name" label="合约名称" width="180" />
            <el-table-column prop="template" label="合约模板" width="150" />
            <el-table-column label="签署方" width="200">
              <template #default="{ row }">
                <div class="parties-list">
                  {{ row.parties.join('、') }}
                </div>
              </template>
            </el-table-column>
            <el-table-column label="签署状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.signStatus === '已签署' ? 'success' : 'warning'">
                  {{ row.signStatus }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="执行状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.executeStatus === '正常履约' ? 'success' : 'info'">
                  {{ row.executeStatus }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default>
                <el-button link type="primary" size="small">查看</el-button>
                <el-button link type="primary" size="small">编辑</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>

      <!-- 中间：交易监控看板 + 流通审计 -->
      <div class="middle-section">
        <!-- 交易监控看板 -->
        <el-card class="section-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">交易监控看板</span>
            </div>
          </template>

          <!-- 统计数据 -->
          <el-row :gutter="16" class="stats-row">
            <el-col :span="6">
              <el-statistic title="累计交易" :value="transactionStats.total" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="今日交易" :value="transactionStats.today">
                <template #suffix>
                  <span style="color: #67C23A">笔</span>
                </template>
              </el-statistic>
            </el-col>
            <el-col :span="6">
              <el-statistic title="成功率" :value="transactionStats.successRate">
                <template #suffix>
                  <span>%</span>
                </template>
              </el-statistic>
            </el-col>
            <el-col :span="6">
              <el-statistic title="平均金额" :value="transactionStats.avgAmount">
                <template #prefix>
                  <span>¥</span>
                </template>
              </el-statistic>
            </el-col>
          </el-row>

          <!-- 最近交易 -->
          <div class="recent-transactions">
            <h4 class="section-subtitle">最近交易</h4>
            <el-table :data="recentTransactions" stripe style="width: 100%">
              <el-table-column prop="name" label="交易名称" width="200" />
              <el-table-column label="交易方" width="250">
                <template #default="{ row }">
                  {{ row.parties.join(' ↔ ') }}
                </template>
              </el-table-column>
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="getTransactionStatusType(row.status)">
                    {{ getTransactionStatusText(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="交易金额" width="120">
                <template #default="{ row }">
                  <span v-if="row.amount > 0">¥{{ row.amount.toLocaleString() }}</span>
                  <span v-else style="color: #909399">-</span>
                </template>
              </el-table-column>
              <el-table-column prop="time" label="时间" width="180" />
            </el-table>
          </div>
        </el-card>

        <!-- 流通审计追踪 -->
        <el-card class="section-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">流通审计追踪</span>
              <el-button type="primary" size="small">导出报告</el-button>
            </div>
          </template>

          <el-timeline>
            <el-timeline-item
              v-for="record in auditRecords"
              :key="record.id"
              :timestamp="record.time"
              placement="top"
              :color="getRiskType(record.risk) === 'danger' ? '#F56C6C' : '#409EFF'"
            >
              <el-card shadow="hover" class="audit-card">
                <div class="audit-header">
                  <div>
                    <strong>{{ record.action }}</strong>
                    <el-tag
                      :type="getRiskType(record.risk)"
                      size="small"
                      style="margin-left: 10px"
                    >
                      {{ getRiskText(record.risk) }}
                    </el-tag>
                  </div>
                  <span class="audit-user">操作人：{{ record.user }}</span>
                </div>
                <div class="audit-path">
                  <el-icon><Connection /></el-icon>
                  <span>{{ record.dataPath }}</span>
                </div>
                <div class="audit-result">
                  结果：
                  <el-tag :type="record.result === '成功' ? 'success' : 'danger'" size="small">
                    {{ record.result }}
                  </el-tag>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </div>

      <!-- 右侧：安全策略配置 -->
      <div class="right-section">
        <el-card class="section-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">安全策略配置</span>
              <el-button type="primary" size="small" @click="handleAddPolicy">
                添加策略
              </el-button>
            </div>
          </template>

          <div class="policy-list">
            <div
              v-for="policy in securityPolicies"
              :key="policy.id"
              class="policy-item"
            >
              <div class="policy-header">
                <div class="policy-info">
                  <div class="policy-name">
                    <strong>{{ policy.name }}</strong>
                    <el-tag size="small" style="margin-left: 8px">{{ policy.type }}</el-tag>
                  </div>
                  <div
                    class="policy-level"
                    :style="{ color: getSecurityLevelColor(policy.level) }"
                  >
                    安全等级：{{ getSecurityLevelText(policy.level) }}
                  </div>
                </div>
                <el-switch
                  v-model="policy.status"
                  @change="togglePolicyStatus(policy)"
                />
              </div>

              <div class="policy-rule">{{ policy.rule }}</div>

              <div class="policy-actions">
                <el-button link type="primary" size="small">编辑</el-button>
                <el-button
                  link
                  type="danger"
                  size="small"
                  @click="handleDeletePolicy(policy)"
                >
                  删除
                </el-button>
              </div>
            </div>
          </div>

          <!-- 安全事件应急响应 -->
          <el-card shadow="never" class="emergency-card">
            <template #header>
              <strong>应急响应状态</strong>
            </template>
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="响应级别">
                <el-tag type="success">正常</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="最近告警">无</el-descriptions-item>
              <el-descriptions-item label="处理中事件">0 个</el-descriptions-item>
              <el-descriptions-item label="响应团队">7/24 在线</el-descriptions-item>
            </el-descriptions>
            <el-button type="danger" size="small" style="width: 100%; margin-top: 12px">
              触发应急预案
            </el-button>
          </el-card>
        </el-card>
      </div>
    </div>

    <!-- 权限配置对话框 -->
    <el-dialog
      v-model="permissionDialogVisible"
      title="添加交易权限"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="permissionFormRef"
        :model="permissionForm"
        :rules="permissionRules"
        label-width="100px"
      >
        <el-form-item label="参与方" prop="participant">
          <el-input v-model="permissionForm.participant" placeholder="请输入参与方名称" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="permissionForm.role" placeholder="请选择角色" style="width: 100%">
            <el-option
              v-for="role in roleOptions"
              :key="role"
              :label="role"
              :value="role"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="数据范围" prop="dataScope">
          <el-input v-model="permissionForm.dataScope" placeholder="请输入数据使用范围" />
        </el-form-item>
        <el-form-item label="操作权限" prop="operations">
          <el-select
            v-model="permissionForm.operations"
            multiple
            placeholder="请选择操作权限"
            style="width: 100%"
          >
            <el-option
              v-for="op in operationOptions"
              :key="op"
              :label="op"
              :value="op"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="permissionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPermission">提交审批</el-button>
      </template>
    </el-dialog>

    <!-- 合约创建对话框 -->
    <el-dialog
      v-model="contractDialogVisible"
      title="创建交易合约"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="contractForm" label-width="100px">
        <el-form-item label="合约名称">
          <el-input v-model="contractForm.name" placeholder="请输入合约名称" />
        </el-form-item>
        <el-form-item label="合约模板">
          <el-select
            v-model="contractForm.template"
            placeholder="请选择合约模板"
            style="width: 100%"
          >
            <el-option
              v-for="template in templateOptions"
              :key="template"
              :label="template"
              :value="template"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="签署方">
          <el-select
            v-model="contractForm.parties"
            multiple
            allow-create
            filterable
            placeholder="请输入或选择签署方"
            style="width: 100%"
          >
            <el-option label="金融科技公司A" value="金融科技公司A" />
            <el-option label="数据服务商B" value="数据服务商B" />
            <el-option label="研究机构C" value="研究机构C" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="contractDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitContract">创建</el-button>
      </template>
    </el-dialog>

    <!-- 安全策略对话框 -->
    <el-dialog
      v-model="policyDialogVisible"
      title="添加安全策略"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="policyForm" label-width="100px">
        <el-form-item label="策略名称">
          <el-input v-model="policyForm.name" placeholder="请输入策略名称" />
        </el-form-item>
        <el-form-item label="策略类型">
          <el-select
            v-model="policyForm.type"
            placeholder="请选择策略类型"
            style="width: 100%"
          >
            <el-option
              v-for="type in policyTypeOptions"
              :key="type"
              :label="type"
              :value="type"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="策略规则">
          <el-input
            v-model="policyForm.rule"
            type="textarea"
            :rows="3"
            placeholder="请输入策略规则描述"
          />
        </el-form-item>
        <el-form-item label="安全等级">
          <el-radio-group v-model="policyForm.level">
            <el-radio label="high">高</el-radio>
            <el-radio label="medium">中</el-radio>
            <el-radio label="low">低</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="policyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPolicy">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.secure-transaction-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;

  .header-card {
    margin-bottom: 20px;

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .page-title {
        margin: 0;
        font-size: 24px;
        color: #303133;
      }

      .page-subtitle {
        margin: 8px 0 0;
        font-size: 14px;
        color: #909399;
      }
    }
  }

  .main-content {
    display: grid;
    grid-template-columns: 1fr 1.2fr 0.8fr;
    gap: 20px;

    .section-card {
      margin-bottom: 20px;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .card-title {
          font-size: 16px;
          font-weight: 600;
          color: #303133;
        }
      }

      .section-subtitle {
        margin: 20px 0 15px;
        font-size: 14px;
        font-weight: 600;
        color: #606266;
      }
    }

    .left-section {
      .parties-list {
        font-size: 13px;
        line-height: 1.5;
      }
    }

    .middle-section {
      .stats-row {
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 1px solid #e4e7ed;
      }

      .recent-transactions {
        margin-top: 20px;
      }

      .audit-card {
        margin-bottom: 10px;

        .audit-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;

          .audit-user {
            font-size: 13px;
            color: #909399;
          }
        }

        .audit-path {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 8px 0;
          padding: 8px;
          background-color: #f5f7fa;
          border-radius: 4px;
          font-size: 13px;
          color: #606266;
        }

        .audit-result {
          margin-top: 8px;
          font-size: 13px;
          color: #909399;
        }
      }
    }

    .right-section {
      .policy-list {
        max-height: 500px;
        overflow-y: auto;

        .policy-item {
          padding: 16px;
          margin-bottom: 12px;
          background-color: #f9fafc;
          border: 1px solid #e4e7ed;
          border-radius: 6px;
          transition: all 0.3s;

          &:hover {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .policy-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;

            .policy-info {
              flex: 1;

              .policy-name {
                display: flex;
                align-items: center;
                margin-bottom: 6px;
                font-size: 14px;
              }

              .policy-level {
                font-size: 12px;
                font-weight: 600;
              }
            }
          }

          .policy-rule {
            margin: 12px 0;
            padding: 10px;
            background-color: white;
            border-left: 3px solid #409eff;
            font-size: 13px;
            line-height: 1.6;
            color: #606266;
          }

          .policy-actions {
            display: flex;
            gap: 10px;
            padding-top: 10px;
            border-top: 1px solid #e4e7ed;
          }
        }
      }

      .emergency-card {
        margin-top: 20px;
        border: 2px solid #f56c6c;
        background: linear-gradient(135deg, #fff5f5 0%, #ffffff 100%);
      }
    }
  }
}

// 滚动条样式
.policy-list::-webkit-scrollbar {
  width: 6px;
}

.policy-list::-webkit-scrollbar-thumb {
  background-color: #dcdfe6;
  border-radius: 3px;

  &:hover {
    background-color: #c0c4cc;
  }
}
</style>