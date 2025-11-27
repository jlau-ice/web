<template>
  <div class="page">
    <section class="intro card">
      <h1>数据源管理</h1>
      <p>
        统一接入内部与外部数据渠道，完成元数据注册、质量预检与链路监控，确保下游建模可用、可靠且可追溯。
      </p>
    </section>

    <section class="filters card">
      <el-form inline :model="filter">
        <el-form-item label="数据域">
          <el-select v-model="filter.domain" placeholder="全部">
            <el-option label="全部" value="" />
            <el-option label="销售" value="sales" />
            <el-option label="供应商" value="supplier" />
            <el-option label="物流" value="logistics" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filter.status" placeholder="全部">
            <el-option label="全部" value="" />
            <el-option label="在线" value="online" />
            <el-option label="巡检中" value="checking" />
            <el-option label="停用" value="off" />
          </el-select>
        </el-form-item>
        <el-form-item label="搜索">
          <el-input v-model="filter.keyword" placeholder="数据源名称 / 负责人" clearable />
        </el-form-item>
      </el-form>
    </section>

    <section class="card">
      <div class="card-header">
        <h2>数据源清单</h2>
        <div>
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增数据源</el-button>
          <el-button :icon="Refresh" @click="handleRefresh" :loading="refreshing">刷新状态</el-button>
          <el-button :icon="Download" @click="handleExport">导出</el-button>
        </div>
      </div>
      <el-table
        :data="filteredSources"
        border
        stripe
        @selection-change="handleSelectionChange"
        @row-click="handleRowClick"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="数据源" min-width="160" />
        <el-table-column prop="type" label="类别" width="120" />
        <el-table-column prop="domain" label="数据域" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ domainMap[row.domain] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="质量评分" width="120">
          <template #default="{ row }">
            <el-progress
              :percentage="row.quality"
              :stroke-width="14"
              :text-inside="true"
              :color="getQualityColor(row.quality)"
            />
          </template>
        </el-table-column>
        <el-table-column label="链路健康度" width="140">
          <template #default="{ row }">
            <el-tag :type="row.health > 90 ? 'success' : row.health > 70 ? 'warning' : 'danger'">
              {{ row.health }}%
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="owner" label="负责人" width="120" />
        <el-table-column prop="statusLabel" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 'online' ? 'success' : row.status === 'checking' ? 'warning' : 'info'">
              {{ row.statusLabel }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="update" label="最近同步" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click.stop="handleEdit(row)">编辑</el-button>
            <el-button link type="primary" size="small" @click.stop="handleDetail(row)">详情</el-button>
            <el-button link type="danger" size="small" @click.stop="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="selectedRows.length > 0" class="batch-actions">
        <span>已选择 {{ selectedRows.length }} 项</span>
        <el-button size="small" @click="handleBatchRefresh">批量刷新</el-button>
        <el-button size="small" type="danger" @click="handleBatchDelete">批量删除</el-button>
      </div>
    </section>

    <section class="grid">
      <el-card class="card">
        <template #header>
          <div class="card-header">
            <span>质量问题趋势</span>
            <el-button link type="primary" size="small" @click="refreshQuality">刷新</el-button>
          </div>
        </template>
        <ul class="list">
          <li v-for="item in qualityIssues" :key="item.title" class="quality-item">
            <div>
              <strong>{{ item.title }}</strong>
              <span>{{ item.detail }}</span>
            </div>
            <el-button link type="primary" size="small" @click="handleQualityAction(item)">处理</el-button>
          </li>
        </ul>
      </el-card>
      <el-card class="card">
        <template #header>
          <div class="card-header">
            <span>链路监控</span>
            <el-switch v-model="autoRefresh" active-text="自动刷新" @change="handleAutoRefresh" />
          </div>
        </template>
        <div v-for="item in pipeline" :key="item.name" class="pipeline">
          <div>
            <div class="pipeline-name">{{ item.name }}</div>
            <div class="pipeline-desc">{{ item.desc }}</div>
          </div>
          <div class="pipeline-actions">
            <el-tag :type="item.status === '正常' ? 'success' : 'danger'">{{ item.status }}</el-tag>
            <el-button link type="primary" size="small" @click="handlePipelineDetail(item)">详情</el-button>
          </div>
        </div>
      </el-card>
    </section>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'add' ? '新增数据源' : '编辑数据源'"
      width="600px"
    >
      <el-form :model="formData" label-width="100px">
        <el-form-item label="数据源名称" required>
          <el-input v-model="formData.name" placeholder="请输入数据源名称" />
        </el-form-item>
        <el-form-item label="数据源类型" required>
          <el-select v-model="formData.type" placeholder="请选择类型">
            <el-option label="MySQL" value="MySQL" />
            <el-option label="Kafka" value="Kafka" />
            <el-option label="API" value="API" />
            <el-option label="Excel" value="Excel" />
            <el-option label="MongoDB" value="MongoDB" />
          </el-select>
        </el-form-item>
        <el-form-item label="数据域" required>
          <el-select v-model="formData.domain" placeholder="请选择数据域">
            <el-option label="销售" value="sales" />
            <el-option label="供应商" value="supplier" />
            <el-option label="物流" value="logistics" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人" required>
          <el-input v-model="formData.owner" placeholder="请输入负责人" />
        </el-form-item>
        <el-form-item label="连接地址">
          <el-input v-model="formData.connection" placeholder="请输入连接地址" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" title="数据源详情" width="700px">
      <div v-if="selectedSource" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="数据源名称">{{ selectedSource.name }}</el-descriptions-item>
          <el-descriptions-item label="数据源类型">{{ selectedSource.type }}</el-descriptions-item>
          <el-descriptions-item label="数据域">{{ domainMap[selectedSource.domain] }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ selectedSource.owner }}</el-descriptions-item>
          <el-descriptions-item label="质量评分">
            <el-progress :percentage="selectedSource.quality" :stroke-width="14" :text-inside="true" />
          </el-descriptions-item>
          <el-descriptions-item label="链路健康度">
            <el-tag
              :type="selectedSource.health > 90 ? 'success' : selectedSource.health > 70 ? 'warning' : 'danger'"
            >
              {{ selectedSource.health }}%
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag
              :type="selectedSource.status === 'online' ? 'success' : selectedSource.status === 'checking' ? 'warning' : 'info'"
            >
              {{ statusMap[selectedSource.status] }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="最近同步">{{ selectedSource.update }}</el-descriptions-item>
        </el-descriptions>
        <el-divider />
        <h4>同步历史</h4>
        <el-timeline>
          <el-timeline-item
            v-for="(item, index) in syncHistory"
            :key="index"
            :timestamp="item.time"
            :type="item.status === 'success' ? 'success' : 'danger'"
          >
            {{ item.message }}
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Download } from '@element-plus/icons-vue'

type Source = {
  name: string
  type: string
  domain: string
  quality: number
  health: number
  owner: string
  status: 'online' | 'checking' | 'off'
  update: string
}

const sources = ref<Source[]>([
  {
    name: '销售订单主数据',
    type: 'MySQL',
    domain: 'sales',
    quality: 95,
    health: 97,
    owner: '李文博',
    status: 'online',
    update: '09:10:22',
  },
  {
    name: '供应商交付日志',
    type: 'Kafka',
    domain: 'supplier',
    quality: 88,
    health: 76,
    owner: '王悦',
    status: 'checking',
    update: '08:58:03',
  },
  {
    name: '物流节点状态',
    type: 'API',
    domain: 'logistics',
    quality: 90,
    health: 68,
    owner: '何楠',
    status: 'online',
    update: '09:05:11',
  },
  {
    name: '市场活动预算',
    type: 'Excel',
    domain: 'sales',
    quality: 72,
    health: 60,
    owner: '赵若冰',
    status: 'off',
    update: '昨日 21:11:40',
  },
])

const filter = reactive({
  domain: '',
  status: '',
  keyword: '',
})

const statusMap: Record<Source['status'], string> = {
  online: '在线',
  checking: '巡检中',
  off: '停用',
}

const domainMap: Record<string, string> = {
  sales: '销售',
  supplier: '供应商',
  logistics: '物流',
}

const filteredSources = computed(() => {
  return sources.value
    .filter((item) => (filter.domain ? item.domain === filter.domain : true))
    .filter((item) => (filter.status ? item.status === filter.status : true))
    .filter((item) => {
      const keyword = filter.keyword.trim()
      return keyword ? item.name.includes(keyword) || item.owner.includes(keyword) : true
    })
    .map((item) => ({
      ...item,
      statusLabel: statusMap[item.status],
    }))
})

const qualityIssues = ref([
  { title: '缺失值占比', detail: '供应商交付日志近 24 小时缺失率 4.2%，触发黄色告警。' },
  { title: '延迟同步', detail: '市场活动预算延迟 6 小时，建议改为定时采集。' },
  { title: '字段变更提醒', detail: '销售订单主数据新增"渠道等级"字段，确保下游同步。' },
])

const pipeline = ref([
  { name: '主链路：ERP → 数据中台', desc: '保障生产排程与MRP同步', status: '正常' },
  { name: '实时链路：IoT 设备 → Kafka', desc: '采集产线节拍与异常信号', status: '正常' },
  { name: '增量链路：CRM → 模型特征库', desc: '洞察大客户需求波动', status: '异常' },
])

const refreshing = ref(false)
const autoRefresh = ref(false)
const dialogVisible = ref(false)
const detailVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const selectedRows = ref<Source[]>([])
const selectedSource = ref<Source | null>(null)

const formData = reactive({
  name: '',
  type: '',
  domain: '',
  owner: '',
  connection: '',
  description: '',
})

const syncHistory = ref([
  { time: '09:10:22', status: 'success', message: '同步成功，共处理 12,345 条记录' },
  { time: '08:58:03', status: 'success', message: '同步成功，共处理 8,901 条记录' },
  { time: '08:45:12', status: 'danger', message: '同步失败：连接超时，已重试' },
])

const getQualityColor = (quality: number) => {
  if (quality >= 90) return '#67c23a'
  if (quality >= 70) return '#e6a23c'
  return '#f56c6c'
}

const handleAdd = () => {
  dialogMode.value = 'add'
  Object.assign(formData, {
    name: '',
    type: '',
    domain: '',
    owner: '',
    connection: '',
    description: '',
  })
  dialogVisible.value = true
}

const handleEdit = (row: Source) => {
  dialogMode.value = 'edit'
  Object.assign(formData, {
    name: row.name,
    type: row.type,
    domain: row.domain,
    owner: row.owner,
    connection: '',
    description: '',
  })
  selectedSource.value = row
  dialogVisible.value = true
}

const handleDelete = (row: Source) => {
  ElMessageBox.confirm(`确认删除数据源"${row.name}"？`, '确认删除', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      const index = sources.value.findIndex((item) => item.name === row.name)
      if (index > -1) {
        sources.value.splice(index, 1)
        ElMessage.success('删除成功')
      }
    })
    .catch(() => {})
}

const handleDetail = (row: Source) => {
  selectedSource.value = row
  detailVisible.value = true
}

const handleRowClick = (row: Source) => {
  handleDetail(row)
}

const handleSelectionChange = (selection: Source[]) => {
  selectedRows.value = selection
}

const handleBatchRefresh = () => {
  ElMessage.success(`已刷新 ${selectedRows.value.length} 个数据源状态`)
}

const handleBatchDelete = () => {
  ElMessageBox.confirm(`确认删除选中的 ${selectedRows.value.length} 个数据源？`, '批量删除', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      selectedRows.value.forEach((row) => {
        const index = sources.value.findIndex((item) => item.name === row.name)
        if (index > -1) {
          sources.value.splice(index, 1)
        }
      })
      selectedRows.value = []
      ElMessage.success('批量删除成功')
    })
    .catch(() => {})
}

const handleRefresh = async () => {
  refreshing.value = true
  await new Promise((resolve) => setTimeout(resolve, 1500))
  refreshing.value = false
  ElMessage.success('状态已刷新')
}

const handleExport = () => {
  ElMessage.success('导出功能（Mock）')
}

const handleSubmit = () => {
  if (!formData.name || !formData.type || !formData.domain || !formData.owner) {
    ElMessage.warning('请填写必填项')
    return
  }
  if (dialogMode.value === 'add') {
    sources.value.push({
      name: formData.name,
      type: formData.type,
      domain: formData.domain,
      quality: 85,
      health: 90,
      owner: formData.owner,
      status: 'online',
      update: new Date().toLocaleTimeString(),
    })
    ElMessage.success('新增成功')
  } else {
    if (selectedSource.value) {
      Object.assign(selectedSource.value, {
        name: formData.name,
        type: formData.type,
        domain: formData.domain,
        owner: formData.owner,
      })
      ElMessage.success('编辑成功')
    }
  }
  dialogVisible.value = false
}

const refreshQuality = () => {
  ElMessage.info('质量问题数据已刷新')
}

const handleQualityAction = (item: any) => {
  ElMessageBox.confirm(item.detail, item.title, {
    confirmButtonText: '已处理',
    cancelButtonText: '稍后处理',
  })
    .then(() => {
      const index = qualityIssues.value.findIndex((i) => i.title === item.title)
      if (index > -1) {
        qualityIssues.value.splice(index, 1)
        ElMessage.success('已标记为已处理')
      }
    })
    .catch(() => {})
}

const handleAutoRefresh = (val: boolean) => {
  if (val) {
    ElMessage.success('已开启自动刷新')
  } else {
    ElMessage.info('已关闭自动刷新')
  }
}

const handlePipelineDetail = (item: any) => {
  ElMessageBox.alert(`链路名称：${item.name}\n描述：${item.desc}\n状态：${item.status}`, '链路详情', {
    confirmButtonText: '确定',
  })
}
</script>

<style scoped>
.page {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #f5f7fa;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
}

.filters {
  display: flex;
  flex-wrap: wrap;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quality-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
}

.quality-item:last-child {
  border-bottom: none;
}

.list li {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  color: #606266;
}

.list strong {
  color: #303133;
}

.pipeline {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
}

.pipeline:last-child {
  border-bottom: none;
}

.pipeline-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pipeline-name {
  font-weight: 600;
}

.pipeline-desc {
  font-size: 13px;
  color: #909399;
}

.detail-content {
  padding: 8px 0;
}
</style>

