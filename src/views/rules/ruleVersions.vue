<template>
  <div class="rule-versions-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1>规则版本控制</h1>
      <div class="header-actions">
        <el-button type="primary" @click="refreshVersions">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button @click="exportVersionHistory">
          <el-icon><Download /></el-icon>
          导出历史
        </el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <!-- 左侧版本树形结构 -->
      <el-col :span="6">
        <el-card class="version-tree-card">
          <template #header>
            <div class="card-header">
              <span>版本树</span>
              <el-tag :type="currentVersionStatus.type" size="small">
                {{ currentVersionStatus.text }}
              </el-tag>
            </div>
          </template>

          <el-tree
            :data="versionTree"
            :props="treeProps"
            node-key="id"
            :default-expanded-keys="expandedKeys"
            @node-click="handleTreeNodeClick"
            class="version-tree"
          >
            <template #default="{ node, data }">
              <div class="tree-node">
                <el-tag :type="data.versionType.color" size="small">
                  {{ data.version }}
                </el-tag>
                <span class="tree-node-label">{{ node.label }}</span>
                <el-tag v-if="data.isCurrent" type="warning" size="small">当前</el-tag>
              </div>
            </template>
          </el-tree>
        </el-card>
      </el-col>

      <!-- 中间版本列表 -->
      <el-col :span="12">
        <el-card class="version-list-card">
          <template #header>
            <div class="card-header">
              <span>版本历史</span>
              <div class="filter-actions">
                <el-input
                  v-model="searchText"
                  placeholder="搜索版本描述"
                  prefix-icon="Search"
                  clearable
                  @input="handleSearch"
                  style="width: 200px; margin-right: 10px;"
                />
                <el-select
                  v-model="filterType"
                  placeholder="变更类型"
                  clearable
                  @change="handleFilter"
                  style="width: 120px; margin-right: 10px;"
                >
                  <el-option label="全部" value="" />
                  <el-option label="新增" value="add" />
                  <el-option label="修改" value="modify" />
                  <el-option label="删除" value="delete" />
                  <el-option label="优化" value="optimize" />
                </el-select>
                <el-date-picker
                  v-model="dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  @change="handleFilter"
                  style="width: 240px;"
                />
              </div>
            </div>
          </template>

          <el-table
            :data="filteredVersions"
            v-loading="loading"
            @selection-change="handleSelectionChange"
            row-key="id"
            class="version-table"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="version" label="版本号" width="100" />
            <el-table-column prop="ruleName" label="规则名称" width="150" />
            <el-table-column prop="changeType" label="变更类型" width="100">
              <template #default="{ row }">
                <el-tag :type="getChangeTypeColor(row.changeType)" size="small">
                  {{ getChangeTypeLabel(row.changeType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="author" label="提交人" width="100" />
            <el-table-column prop="commitTime" label="提交时间" width="160" />
            <el-table-column prop="description" label="版本描述" min-width="200" />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="getStatusColor(row.status)" size="small">
                  {{ getStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button-group size="small">
                  <el-button @click="viewVersionDetail(row)">详情</el-button>
                  <el-button @click="compareWithCurrent(row)">对比</el-button>
                  <el-button
                    v-if="row.status !== 'current'"
                    type="warning"
                    @click="rollbackToVersion(row)"
                  >
                    回退
                  </el-button>
                </el-button-group>
              </template>
            </el-table-column>
          </el-table>

          <div class="table-footer">
            <el-button
              :disabled="selectedVersions.length !== 2"
              @click="compareSelectedVersions"
            >
              对比选中版本
            </el-button>
            <el-pagination
              v-model:current-page="pagination.currentPage"
              v-model:page-size="pagination.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="pagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
      </el-col>

      <!-- 右侧版本详情和对比面板 -->
      <el-col :span="6">
        <el-card class="detail-panel-card">
          <template #header>
            <div class="card-header">
              <span>{{ detailPanelTitle }}</span>
              <el-button v-if="showComparison" size="small" @click="closeComparison">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
          </template>

          <!-- 版本详情 -->
          <div v-if="selectedVersion && !showComparison" class="version-detail">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="版本号">
                {{ selectedVersion.version }}
              </el-descriptions-item>
              <el-descriptions-item label="规则名称">
                {{ selectedVersion.ruleName }}
              </el-descriptions-item>
              <el-descriptions-item label="变更类型">
                <el-tag :type="getChangeTypeColor(selectedVersion.changeType)">
                  {{ getChangeTypeLabel(selectedVersion.changeType) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="提交人">
                {{ selectedVersion.author }}
              </el-descriptions-item>
              <el-descriptions-item label="提交时间">
                {{ selectedVersion.commitTime }}
              </el-descriptions-item>
              <el-descriptions-item label="版本描述">
                {{ selectedVersion.description }}
              </el-descriptions-item>
              <el-descriptions-item label="版本标签">
                <div class="version-tags">
                  <el-tag
                    v-for="tag in selectedVersion.tags"
                    :key="tag.id"
                    :color="tag.color"
                    size="small"
                    style="margin-right: 5px; margin-bottom: 5px;"
                  >
                    {{ tag.name }}
                  </el-tag>
                  <el-button size="small" @click="showTagDialog = true">
                    <el-icon><Plus /></el-icon>
                    添加标签
                  </el-button>
                </div>
              </el-descriptions-item>
            </el-descriptions>

            <div class="rule-content" v-if="selectedVersion.ruleContent">
              <h4>规则内容</h4>
              <pre class="rule-content-code">{{ selectedVersion.ruleContent }}</pre>
            </div>
          </div>

          <!-- 版本对比 -->
          <div v-if="showComparison && comparisonResult" class="version-comparison">
            <el-alert
              title="版本对比结果"
              type="info"
              :closable="false"
              style="margin-bottom: 15px;"
            >
              <template #default>
                对比版本 {{ comparisonResult.version1.version }} 与 {{ comparisonResult.version2.version }}
              </template>
            </el-alert>

            <div class="comparison-stats">
              <el-row :gutter="10">
                <el-col :span="8">
                  <el-statistic title="新增条件" :value="comparisonResult.stats.added" />
                </el-col>
                <el-col :span="8">
                  <el-statistic title="修改条件" :value="comparisonResult.stats.modified" />
                </el-col>
                <el-col :span="8">
                  <el-statistic title="删除条件" :value="comparisonResult.stats.deleted" />
                </el-col>
              </el-row>
            </div>

            <div class="comparison-details">
              <h4>详细差异</h4>
              <div class="diff-item" v-for="diff in comparisonResult.differences" :key="diff.id">
                <div class="diff-header">
                  <el-tag :type="getDiffTypeColor(diff.type)" size="small">
                    {{ getDiffTypeLabel(diff.type) }}
                  </el-tag>
                  <span class="diff-field">{{ diff.field }}</span>
                </div>
                <div class="diff-content">
                  <div v-if="diff.oldValue" class="diff-old">
                    <span class="diff-label">旧值：</span>
                    <code>{{ diff.oldValue }}</code>
                  </div>
                  <div v-if="diff.newValue" class="diff-new">
                    <span class="diff-label">新值：</span>
                    <code>{{ diff.newValue }}</code>
                  </div>
                </div>
              </div>
            </div>

            <div class="comparison-actions">
              <el-button @click="exportComparison">导出对比结果</el-button>
            </div>
          </div>
        </el-card>

        <!-- 变更记录分析 -->
        <el-card class="analysis-card" style="margin-top: 20px;">
          <template #header>
            <span>变更记录分析</span>
          </template>

          <div class="analysis-content">
            <div class="analysis-item">
              <h4>变更频率趋势</h4>
              <div class="trend-chart">
                <el-tag size="small">本周变更: {{ analysisStats.weeklyChanges }}</el-tag>
                <el-tag size="small" type="success">本月变更: {{ analysisStats.monthlyChanges }}</el-tag>
                <el-tag size="small" type="warning">总变更次数: {{ analysisStats.totalChanges }}</el-tag>
              </div>
            </div>

            <div class="analysis-item">
              <h4>变更类型分布</h4>
              <div class="type-distribution">
                <div v-for="type in analysisStats.changeTypeDistribution" :key="type.type" class="type-item">
                  <el-tag :type="getChangeTypeColor(type.type)" size="small">
                    {{ getChangeTypeLabel(type.type) }}: {{ type.count }}
                  </el-tag>
                </div>
              </div>
            </div>

            <div class="analysis-item">
              <h4>版本稳定性</h4>
              <el-progress
                :percentage="analysisStats.stability"
                :status="analysisStats.stability > 80 ? 'success' : analysisStats.stability > 60 ? 'warning' : 'exception'"
              />
              <span class="stability-text">{{ getStabilityText(analysisStats.stability) }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 标签管理对话框 -->
    <el-dialog
      v-model="showTagDialog"
      title="版本标签管理"
      width="500px"
    >
      <div class="tag-management">
        <div class="current-tags">
          <h4>当前标签</h4>
          <div class="tag-list">
            <el-tag
              v-for="tag in selectedVersion?.tags || []"
              :key="tag.id"
              :color="tag.color"
              closable
              @close="removeTag(tag)"
              style="margin-right: 5px; margin-bottom: 5px;"
            >
              {{ tag.name }}
            </el-tag>
          </div>
        </div>

        <div class="add-tags">
          <h4>添加标签</h4>
          <el-select
            v-model="selectedTagIds"
            multiple
            placeholder="选择标签"
            style="width: 100%;"
          >
            <el-option
              v-for="tag in availableTags"
              :key="tag.id"
              :label="tag.name"
              :value="tag.id"
            >
              <el-tag :color="tag.color" size="small">{{ tag.name }}</el-tag>
            </el-option>
          </el-select>
        </div>

        <div class="create-tag">
          <h4>创建新标签</h4>
          <el-row :gutter="10">
            <el-col :span="12">
              <el-input v-model="newTag.name" placeholder="标签名称" />
            </el-col>
            <el-col :span="8">
              <el-color-picker v-model="newTag.color" />
            </el-col>
            <el-col :span="4">
              <el-button @click="createTag">创建</el-button>
            </el-col>
          </el-row>
        </div>
      </div>

      <template #footer>
        <el-button @click="showTagDialog = false">取消</el-button>
        <el-button type="primary" @click="saveTags">保存</el-button>
      </template>
    </el-dialog>

    <!-- 版本回退确认对话框 -->
    <el-dialog
      v-model="showRollbackDialog"
      title="版本回退确认"
      width="600px"
    >
      <div class="rollback-confirmation">
        <el-alert
          title="警告"
          type="warning"
          :closable="false"
          style="margin-bottom: 20px;"
        >
          回退操作将影响当前正在使用的规则，请确认是否继续？
        </el-alert>

        <div class="rollback-info">
          <h4>回退信息</h4>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="当前版本">
              {{ currentVersion?.version }}
            </el-descriptions-item>
            <el-descriptions-item label="目标版本">
              {{ rollbackTarget?.version }}
            </el-descriptions-item>
            <el-descriptions-item label="影响范围">
              {{ rollbackImpact.affectedRules }} 个规则
            </el-descriptions-item>
            <el-descriptions-item label="预估风险">
              <el-tag :type="rollbackImpact.riskLevel">
                {{ rollbackImpact.riskText }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="rollback-preview" v-if="rollbackPreview">
          <h4>变更预览</h4>
          <div class="preview-item" v-for="change in rollbackPreview" :key="change.id">
            <el-tag :type="getChangeTypeColor(change.type)" size="small">
              {{ getChangeTypeLabel(change.type) }}
            </el-tag>
            <span>{{ change.description }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="showRollbackDialog = false">取消</el-button>
        <el-button type="warning" @click="confirmRollback">确认回退</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Download, Close, Plus, Search } from '@element-plus/icons-vue'

// 类型定义
interface VersionTag {
  id: string
  name: string
  color: string
  description?: string
}

interface RuleVersion {
  id: string
  version: string
  ruleName: string
  changeType: 'add' | 'modify' | 'delete' | 'optimize'
  author: string
  commitTime: string
  description: string
  status: 'current' | 'history' | 'deprecated'
  tags: VersionTag[]
  ruleContent?: string
  parentId?: string
  children?: RuleVersion[]
}

interface VersionTree {
  id: string
  label: string
  version: string
  versionType: { type: string; color: string }
  isCurrent: boolean
  children?: VersionTree[]
}

interface ComparisonResult {
  version1: RuleVersion
  version2: RuleVersion
  stats: {
    added: number
    modified: number
    deleted: number
  }
  differences: Array<{
    id: string
    field: string
    type: 'added' | 'modified' | 'deleted'
    oldValue?: string
    newValue?: string
  }>
}

interface AnalysisStats {
  weeklyChanges: number
  monthlyChanges: number
  totalChanges: number
  changeTypeDistribution: Array<{
    type: string
    count: number
  }>
  stability: number
}

interface RollbackImpact {
  affectedRules: number
  riskLevel: 'success' | 'warning' | 'danger'
  riskText: string
}

// 响应式数据
const loading = ref(false)
const searchText = ref('')
const filterType = ref('')
const dateRange = ref<[Date, Date] | null>(null)
const selectedVersions = ref<RuleVersion[]>([])
const selectedVersion = ref<RuleVersion | null>(null)
const showComparison = ref(false)
const comparisonResult = ref<ComparisonResult | null>(null)
const showTagDialog = ref(false)
const selectedTagIds = ref<string[]>([])
const newTag = reactive({ name: '', color: '#409EFF' })
const showRollbackDialog = ref(false)
const rollbackTarget = ref<RuleVersion | null>(null)
const rollbackPreview = ref<any[]>([])
const currentVersion = ref<RuleVersion | null>(null)

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// Mock数据
const mockVersions: RuleVersion[] = [
  {
    id: '1',
    version: 'v1.0.0',
    ruleName: '用户行为检测规则',
    changeType: 'add',
    author: '张三',
    commitTime: '2024-01-15 10:30:00',
    description: '初始版本，包含基础的用户行为检测逻辑',
    status: 'history',
    tags: [{ id: 't1', name: '初始版本', color: '#67C23A' }],
    ruleContent: `{
  "conditions": [
    {
      "field": "user_action",
      "operator": "equals",
      "value": "login"
    }
  ],
  "actions": ["log", "alert"]
}`
  },
  {
    id: '2',
    version: 'v1.1.0',
    ruleName: '用户行为检测规则',
    changeType: 'modify',
    author: '李四',
    commitTime: '2024-02-20 14:15:00',
    description: '增加异常登录检测条件，提升安全性',
    status: 'history',
    tags: [{ id: 't2', name: '安全更新', color: '#E6A23C' }],
    ruleContent: `{
  "conditions": [
    {
      "field": "user_action",
      "operator": "equals",
      "value": "login"
    },
    {
      "field": "login_location",
      "operator": "not_in",
      "value": ["allowed_locations"]
    }
  ],
  "actions": ["log", "alert", "block"]
}`
  },
  {
    id: '3',
    version: 'v1.2.0',
    ruleName: '用户行为检测规则',
    changeType: 'optimize',
    author: '王五',
    commitTime: '2024-03-10 09:45:00',
    description: '优化规则性能，减少误报率',
    status: 'current',
    tags: [
      { id: 't3', name: '当前版本', color: '#F56C6C' },
      { id: 't4', name: '性能优化', color: '#909399' }
    ],
    ruleContent: `{
  "conditions": [
    {
      "field": "user_action",
      "operator": "equals",
      "value": "login"
    },
    {
      "field": "login_location",
      "operator": "not_in",
      "value": ["allowed_locations"],
      "weight": 0.8
    },
    {
      "field": "device_fingerprint",
      "operator": "changed",
      "weight": 0.6
    }
  ],
  "actions": ["log", "alert", "block"],
  "threshold": 0.7
}`
  },
  {
    id: '4',
    version: 'v2.0.0',
    ruleName: '数据访问控制规则',
    changeType: 'add',
    author: '赵六',
    commitTime: '2024-03-25 16:20:00',
    description: '新增数据访问权限控制规则',
    status: 'current',
    tags: [{ id: 't5', name: '新功能', color: '#409EFF' }],
    ruleContent: `{
  "conditions": [
    {
      "field": "user_role",
      "operator": "not_in",
      "value": ["admin", "super_admin"]
    },
    {
      "field": "data_sensitivity",
      "operator": "equals",
      "value": "high"
    }
  ],
  "actions": ["deny_access", "log"]
}`
  }
]

const availableTags = ref<VersionTag[]>([
  { id: 't1', name: '初始版本', color: '#67C23A' },
  { id: 't2', name: '安全更新', color: '#E6A23C' },
  { id: 't3', name: '当前版本', color: '#F56C6C' },
  { id: 't4', name: '性能优化', color: '#909399' },
  { id: 't5', name: '新功能', color: '#409EFF' },
  { id: 't6', name: '紧急修复', color: '#F56C6C' },
  { id: 't7', name: '测试版本', color: '#909399' }
])

const versions = ref<RuleVersion[]>([])
const expandedKeys = ref<string[]>(['1', '2'])

// 计算属性
const filteredVersions = computed(() => {
  let filtered = versions.value

  // 搜索过滤
  if (searchText.value) {
    filtered = filtered.filter(v =>
      v.description.toLowerCase().includes(searchText.value.toLowerCase()) ||
      v.ruleName.toLowerCase().includes(searchText.value.toLowerCase())
    )
  }

  // 变更类型过滤
  if (filterType.value) {
    filtered = filtered.filter(v => v.changeType === filterType.value)
  }

  // 日期范围过滤
  if (dateRange.value && dateRange.value.length === 2) {
    const [start, end] = dateRange.value
    filtered = filtered.filter(v => {
      const commitDate = new Date(v.commitTime)
      return commitDate >= start && commitDate <= end
    })
  }

  pagination.total = filtered.length
  const start = (pagination.currentPage - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return filtered.slice(start, end)
})

const versionTree = computed((): VersionTree[] => {
  return versions.value.map(v => ({
    id: v.id,
    label: `${v.version} - ${v.description}`,
    version: v.version,
    versionType: getVersionTypeInfo(v.changeType),
    isCurrent: v.status === 'current',
    children: v.children?.map(child => ({
      id: child.id,
      label: `${child.version} - ${child.description}`,
      version: child.version,
      versionType: getVersionTypeInfo(child.changeType),
      isCurrent: child.status === 'current'
    }))
  }))
})

const currentVersionStatus = computed(() => {
  const current = versions.value.find(v => v.status === 'current')
  return {
    type: current ? 'success' : 'info',
    text: current ? `当前版本: ${current?.version}` : '无当前版本'
  }
})

const detailPanelTitle = computed(() => {
  if (showComparison.value) return '版本对比'
  if (selectedVersion.value) return `版本详情 - ${selectedVersion.value.version}`
  return '版本详情'
})

const rollbackImpact = computed((): RollbackImpact => {
  if (!rollbackTarget.value) {
    return {
      affectedRules: 0,
      riskLevel: 'success',
      riskText: '无风险'
    }
  }

  const targetVersion = rollbackTarget.value
  const affectedRules = Math.floor(Math.random() * 5) + 1

  let riskLevel: 'success' | 'warning' | 'danger' = 'success'
  let riskText = '低风险'

  if (targetVersion.changeType === 'delete') {
    riskLevel = 'danger'
    riskText = '高风险'
  } else if (targetVersion.changeType === 'modify') {
    riskLevel = 'warning'
    riskText = '中等风险'
  }

  return {
    affectedRules,
    riskLevel,
    riskText
  }
})

const analysisStats = computed((): AnalysisStats => {
  const totalChanges = versions.value.length
  const monthlyChanges = versions.value.filter(v => {
    const commitDate = new Date(v.commitTime)
    const now = new Date()
    return commitDate.getMonth() === now.getMonth() &&
           commitDate.getFullYear() === now.getFullYear()
  }).length

  const weeklyChanges = versions.value.filter(v => {
    const commitDate = new Date(v.commitTime)
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return commitDate >= weekAgo
  }).length

  const changeTypeDistribution = [
    { type: 'add', count: versions.value.filter(v => v.changeType === 'add').length },
    { type: 'modify', count: versions.value.filter(v => v.changeType === 'modify').length },
    { type: 'delete', count: versions.value.filter(v => v.changeType === 'delete').length },
    { type: 'optimize', count: versions.value.filter(v => v.changeType === 'optimize').length }
  ]

  const stability = Math.max(20, 100 - (totalChanges * 5))

  return {
    weeklyChanges,
    monthlyChanges,
    totalChanges,
    changeTypeDistribution,
    stability
  }
})

// 工具函数
const getChangeTypeColor = (type: string): string => {
  const colors = {
    add: 'success',
    modify: 'warning',
    delete: 'danger',
    optimize: 'info'
  }
  return colors[type as keyof typeof colors] || 'info'
}

const getChangeTypeLabel = (type: string): string => {
  const labels = {
    add: '新增',
    modify: '修改',
    delete: '删除',
    optimize: '优化'
  }
  return labels[type as keyof typeof labels] || type
}

const getStatusColor = (status: string): string => {
  const colors = {
    current: 'warning',
    history: 'info',
    deprecated: 'danger'
  }
  return colors[status as keyof typeof colors] || 'info'
}

const getStatusLabel = (status: string): string => {
  const labels = {
    current: '当前',
    history: '历史',
    deprecated: '废弃'
  }
  return labels[status as keyof typeof labels] || status
}

const getVersionTypeInfo = (type: string) => {
  const info = {
    add: { type: 'add', color: 'success' },
    modify: { type: 'modify', color: 'warning' },
    delete: { type: 'delete', color: 'danger' },
    optimize: { type: 'optimize', color: 'info' }
  }
  return info[type as keyof typeof info] || { type: 'unknown', color: 'info' }
}

const getDiffTypeColor = (type: string): string => {
  const colors = {
    added: 'success',
    modified: 'warning',
    deleted: 'danger'
  }
  return colors[type as keyof typeof colors] || 'info'
}

const getDiffTypeLabel = (type: string): string => {
  const labels = {
    added: '新增',
    modified: '修改',
    deleted: '删除'
  }
  return labels[type as keyof typeof labels] || type
}

const getStabilityText = (stability: number): string => {
  if (stability >= 80) return '稳定性良好'
  if (stability >= 60) return '稳定性一般'
  return '稳定性较差'
}

// 数据加载
const loadVersions = async () => {
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 800))
    versions.value = [...mockVersions]
    currentVersion.value = versions.value.find(v => v.status === 'current') || null
    ElMessage.success('版本数据加载成功')
  } catch (error) {
    ElMessage.error('加载版本数据失败')
  } finally {
    loading.value = false
  }
}

// 事件处理
const refreshVersions = () => {
  loadVersions()
}

const handleSearch = () => {
  pagination.currentPage = 1
}

const handleFilter = () => {
  pagination.currentPage = 1
}

const handleSelectionChange = (selection: RuleVersion[]) => {
  selectedVersions.value = selection
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.currentPage = 1
}

const handleCurrentChange = (page: number) => {
  pagination.currentPage = page
}

const handleTreeNodeClick = (data: VersionTree) => {
  const version = versions.value.find(v => v.id === data.id)
  if (version) {
    selectedVersion.value = version
    showComparison.value = false
  }
}

const viewVersionDetail = (version: RuleVersion) => {
  selectedVersion.value = version
  showComparison.value = false
}

const compareWithCurrent = async (version: RuleVersion) => {
  if (!currentVersion.value) {
    ElMessage.warning('未找到当前版本')
    return
  }

  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))

    const mockDifferences = [
      {
        id: '1',
        field: 'conditions',
        type: 'added' as const,
        newValue: 'device_fingerprint check'
      },
      {
        id: '2',
        field: 'threshold',
        type: 'modified' as const,
        oldValue: '0.5',
        newValue: '0.7'
      }
    ]

    comparisonResult.value = {
      version1: currentVersion.value,
      version2: version,
      stats: {
        added: 1,
        modified: 1,
        deleted: 0
      },
      differences: mockDifferences
    }

    showComparison.value = true
    ElMessage.success('版本对比完成')
  } catch (error) {
    ElMessage.error('版本对比失败')
  } finally {
    loading.value = false
  }
}

const compareSelectedVersions = async () => {
  if (selectedVersions.value.length !== 2) {
    ElMessage.warning('请选择两个版本进行对比')
    return
  }

  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))

    const [v1, v2] = selectedVersions.value
    const mockDifferences = [
      {
        id: '1',
        field: 'ruleName',
        type: 'modified' as const,
        oldValue: v1.ruleName,
        newValue: v2.ruleName
      },
      {
        id: '2',
        field: 'actions',
        type: 'added' as const,
        newValue: 'new_action'
      }
    ]

    comparisonResult.value = {
      version1: v1,
      version2: v2,
      stats: {
        added: 1,
        modified: 1,
        deleted: 0
      },
      differences: mockDifferences
    }

    showComparison.value = true
    ElMessage.success('版本对比完成')
  } catch (error) {
    ElMessage.error('版本对比失败')
  } finally {
    loading.value = false
  }
}

const closeComparison = () => {
  showComparison.value = false
  comparisonResult.value = null
}

const rollbackToVersion = async (version: RuleVersion) => {
  rollbackTarget.value = version

  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))

    rollbackPreview.value = [
      {
        id: '1',
        type: 'modify',
        description: '规则条件将回退到旧版本'
      },
      {
        id: '2',
        type: 'delete',
        description: '新增的条件将被移除'
      }
    ]

    showRollbackDialog.value = true
  } catch (error) {
    ElMessage.error('获取回退预览失败')
  } finally {
    loading.value = false
  }
}

const confirmRollback = async () => {
  if (!rollbackTarget.value) return

  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))

    ElMessage.success(`已成功回退到版本 ${rollbackTarget.value.version}`)
    showRollbackDialog.value = false
    rollbackTarget.value = null
    rollbackPreview.value = []

    await loadVersions()
  } catch (error) {
    ElMessage.error('版本回退失败')
  } finally {
    loading.value = false
  }
}

const removeTag = (tag: VersionTag) => {
  if (selectedVersion.value) {
    selectedVersion.value.tags = selectedVersion.value.tags.filter(t => t.id !== tag.id)
  }
}

const createTag = () => {
  if (!newTag.name.trim()) {
    ElMessage.warning('请输入标签名称')
    return
  }

  const tag: VersionTag = {
    id: `t${Date.now()}`,
    name: newTag.name,
    color: newTag.color
  }

  availableTags.value.push(tag)
  selectedTagIds.value.push(tag.id)

  newTag.name = ''
  newTag.color = '#409EFF'

  ElMessage.success('标签创建成功')
}

const saveTags = () => {
  if (!selectedVersion.value) return

  const newTags = availableTags.value.filter(tag =>
    selectedTagIds.value.includes(tag.id) &&
    !selectedVersion.value!.tags.some(t => t.id === tag.id)
  )

  selectedVersion.value.tags.push(...newTags)

  showTagDialog.value = false
  selectedTagIds.value = []

  ElMessage.success('标签保存成功')
}

const exportVersionHistory = () => {
  ElMessage.info('导出功能开发中...')
}

const exportComparison = () => {
  ElMessage.info('导出对比结果功能开发中...')
}

// 生命周期
onMounted(() => {
  loadVersions()
})
</script>

<style scoped>
.rule-versions-container {
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.page-header h1 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.version-tree-card,
.version-list-card,
.detail-panel-card,
.analysis-card {
  height: fit-content;
}

.version-tree {
  max-height: 400px;
  overflow-y: auto;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.tree-node-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-actions {
  display: flex;
  align-items: center;
}

.version-table {
  margin-bottom: 15px;
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
}

.version-detail {
  max-height: 500px;
  overflow-y: auto;
}

.version-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.rule-content {
  margin-top: 20px;
}

.rule-content h4 {
  margin-bottom: 10px;
  color: #606266;
}

.rule-content-code {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 15px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #495057;
  white-space: pre-wrap;
  word-break: break-all;
}

.version-comparison {
  max-height: 500px;
  overflow-y: auto;
}

.comparison-stats {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
}

.comparison-details h4 {
  margin-bottom: 15px;
  color: #606266;
}

.diff-item {
  margin-bottom: 15px;
  padding: 15px;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  background: white;
}

.diff-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.diff-field {
  font-weight: 500;
  color: #303133;
}

.diff-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.diff-old,
.diff-new {
  display: flex;
  align-items: center;
  gap: 10px;
}

.diff-label {
  font-weight: 500;
  color: #606266;
  min-width: 50px;
}

.diff-old code {
  background: #fef0f0;
  color: #f56c6c;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.diff-new code {
  background: #f0f9ff;
  color: #409eff;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.comparison-actions {
  margin-top: 20px;
  text-align: right;
}

.analysis-content {
  max-height: 400px;
  overflow-y: auto;
}

.analysis-item {
  margin-bottom: 20px;
}

.analysis-item h4 {
  margin-bottom: 10px;
  color: #606266;
  font-size: 14px;
}

.trend-chart {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.type-distribution {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.type-item {
  margin-bottom: 5px;
}

.stability-text {
  margin-left: 10px;
  font-size: 12px;
  color: #909399;
}

.tag-management h4 {
  margin-bottom: 10px;
  color: #606266;
  font-size: 14px;
}

.current-tags,
.add-tags,
.create-tag {
  margin-bottom: 20px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.rollback-confirmation h4 {
  margin-bottom: 15px;
  color: #606266;
}

.rollback-info {
  margin-bottom: 20px;
}

.rollback-preview {
  margin-top: 20px;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .filter-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .filter-actions > * {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .rule-versions-container {
    padding: 10px;
  }

  .page-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .table-footer {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>