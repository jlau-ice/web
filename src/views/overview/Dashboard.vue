<template>
  <div class="dashboard">
    <section class="hero card">
      <div>
        <h1>供应链预测预览总况</h1>
        <p>
          通过可视化看板汇聚需求预测结果、置信区间与异常波动，帮助快速识别潜在风险与机会，支撑计划、库存与调度决策。
        </p>
      </div>
      <div class="hero-actions">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          @change="handleDateChange"
        />
        <el-button type="primary" :icon="Refresh" @click="handleRefresh" :loading="refreshing">
          刷新数据
        </el-button>
        <el-button :icon="Download" @click="handleExport">导出报告</el-button>
      </div>
      <el-alert type="success" :closable="false" :title="`数据每 15 分钟刷新一次，最后更新：${lastUpdate}`" />
    </section>

    <section class="cards">
      <el-card
        v-for="item in kpiCards"
        :key="item.title"
        class="card kpi-card"
        :class="{ 'kpi-card-clickable': true }"
        @click="handleKpiClick(item)"
      >
        <div class="kpi-title">{{ item.title }}</div>
        <div class="kpi-value">{{ item.value }}</div>
        <div class="kpi-meta">
          <span>{{ item.description }}</span>
          <span :class="item.trend.startsWith('+') ? 'trend-up' : 'trend-down'">{{ item.trend }}</span>
        </div>
        <div class="kpi-hover">点击查看详情</div>
      </el-card>
    </section>

    <section class="grid">
      <el-card class="card">
        <template #header>
          <div class="card-header">
            <span>未来 4 周需求预测</span>
            <el-radio-group v-model="viewMode" size="small">
              <el-radio-button label="table">表格</el-radio-button>
              <el-radio-button label="chart">图表</el-radio-button>
            </el-radio-group>
          </div>
        </template>
        <div v-if="viewMode === 'table'" class="trend-table">
          <div class="trend-row trend-head">
            <span>周次</span>
            <span>预测需求</span>
            <span>置信区间</span>
            <span>异常提示</span>
            <span>操作</span>
          </div>
          <div v-for="item in demandTrend" :key="item.week" class="trend-row">
            <span>{{ item.week }}</span>
            <span>{{ item.forecast }}</span>
            <span>{{ item.confidence }}</span>
            <span :class="item.alert ? 'risk' : 'safe'">{{ item.alert || '正常' }}</span>
            <span>
              <el-button link type="primary" size="small" @click="viewDetail(item)">详情</el-button>
            </span>
          </div>
        </div>
        <div v-else class="chart-container">
          <div class="chart-placeholder">
            <el-icon :size="48"><TrendCharts /></el-icon>
            <p>需求预测趋势图</p>
            <p class="chart-desc">本周: 3,120 → 下周: 3,310 → 第3周: 3,190 → 第4周: 2,940</p>
          </div>
        </div>
      </el-card>

      <el-card class="card">
        <template #header>
          <div class="card-header">
            <span>实时风险洞察</span>
            <el-button link type="primary" size="small" @click="filterRisk = !filterRisk">
              {{ filterRisk ? '显示全部' : '仅显示高风险' }}
            </el-button>
          </div>
        </template>
        <el-timeline>
          <el-timeline-item
            v-for="item in filteredRiskInsights"
            :key="item.time"
            :timestamp="item.time"
            :type="item.type"
          >
            <div class="timeline-title">{{ item.title }}</div>
            <p>{{ item.description }}</p>
            <el-button link type="primary" size="small" @click="handleRiskAction(item)">处理建议</el-button>
          </el-timeline-item>
        </el-timeline>
      </el-card>
    </section>

    <section class="card">
      <div class="card-header">
        <h2>预测建议</h2>
        <el-button-group>
          <el-button :icon="Sort" @click="sortRecommendations">排序</el-button>
          <el-button :icon="Filter" @click="showFilter = !showFilter">筛选</el-button>
        </el-button-group>
      </div>
      <el-collapse-transition>
        <div v-show="showFilter" class="filter-section">
          <el-form inline>
            <el-form-item label="责任团队">
              <el-select v-model="filterOwner" placeholder="全部" clearable>
                <el-option label="全部" value="" />
                <el-option label="供应计划" value="供应计划" />
                <el-option label="销售运营" value="销售运营" />
                <el-option label="采购" value="采购" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="applyFilter">应用</el-button>
              <el-button @click="resetFilter">重置</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-collapse-transition>
      <el-table :data="filteredRecommendations" size="small" @row-click="handleRecommendationClick">
        <el-table-column prop="topic" label="主题" />
        <el-table-column prop="action" label="建议动作" />
        <el-table-column prop="owner" label="责任团队" width="140" />
        <el-table-column prop="deadline" label="建议完成时间" width="140" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click.stop="markComplete(row)">标记完成</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <!-- KPI详情对话框 -->
    <el-dialog v-model="kpiDetailVisible" :title="selectedKpi?.title" width="600px">
      <div class="kpi-detail">
        <div class="detail-item">
          <span class="label">当前值：</span>
          <span class="value">{{ selectedKpi?.value }}</span>
        </div>
        <div class="detail-item">
          <span class="label">趋势：</span>
          <span :class="selectedKpi?.trend.startsWith('+') ? 'trend-up' : 'trend-down'">
            {{ selectedKpi?.trend }}
          </span>
        </div>
        <div class="detail-item">
          <span class="label">说明：</span>
          <span>{{ selectedKpi?.description }}</span>
        </div>
        <el-divider />
        <h4>历史趋势</h4>
        <div class="chart-placeholder">
          <el-icon :size="32"><TrendCharts /></el-icon>
          <p>历史数据趋势图（Mock）</p>
        </div>
      </div>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" title="预测详情" width="500px">
      <div class="detail-content">
        <p><strong>周次：</strong>{{ selectedItem?.week }}</p>
        <p><strong>预测需求：</strong>{{ selectedItem?.forecast }}</p>
        <p><strong>置信区间：</strong>{{ selectedItem?.confidence }}</p>
        <p><strong>状态：</strong>
          <el-tag :type="selectedItem?.alert ? 'warning' : 'success'">
            {{ selectedItem?.alert || '正常' }}
          </el-tag>
        </p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Download, Sort, Filter, TrendCharts } from '@element-plus/icons-vue'

const dateRange = ref<[string, string] | null>(null)
const refreshing = ref(false)
const lastUpdate = ref('09:15:32')
const viewMode = ref<'table' | 'chart'>('table')
const filterRisk = ref(false)
const showFilter = ref(false)
const filterOwner = ref('')
const kpiDetailVisible = ref(false)
const detailVisible = ref(false)
const selectedKpi = ref<any>(null)
const selectedItem = ref<any>(null)

const kpiCards = ref([
  {
    title: '未来 30 天需求预测',
    value: '12,560 单',
    description: '置信度 92%，较上周 +4.8%',
    trend: '+4.8%',
  },
  {
    title: '库存周转天数',
    value: '15.2 天',
    description: '安全区间 12~18 天',
    trend: '-0.6 天',
  },
  {
    title: '供应风险指数',
    value: '0.32',
    description: '低风险，重点监控区域：华东',
    trend: '+0.04',
  },
])

const demandTrend = ref([
  { week: '本周', forecast: '3,120 单', confidence: '± 210', alert: '' },
  { week: '下周', forecast: '3,310 单', confidence: '± 250', alert: '促销叠加，重点监控' },
  { week: '第 3 周', forecast: '3,190 单', confidence: '± 200', alert: '' },
  { week: '第 4 周', forecast: '2,940 单', confidence: '± 230', alert: '发现需求下滑趋势' },
])

const riskInsights = ref([
  {
    time: '09:20',
    title: '原材料交付延迟预警',
    description: '核心供应商 B 交付周期延长 1.5 天，建议提前锁定替代资源。',
    type: 'danger',
  },
  {
    time: '09:05',
    title: '华北仓库存偏低',
    description: '当前库存可支撑 11 天，低于安全线 13 天，需要补货计划。',
    type: 'warning',
  },
  {
    time: '08:40',
    title: '需求激增信号',
    description: '华南渠道出现连续 3 天 15% 的增长，建议同步生产计划。',
    type: 'primary',
  },
])

const recommendations = ref([
  {
    topic: '旺季安全库存策略',
    action: '将核心 SKU 安全库存上调 8%，配合弹性产能方案。',
    owner: '供应计划',
    deadline: '本周五',
    completed: false,
  },
  {
    topic: '异常波动跟踪',
    action: '建立华南需求波动专项追踪，输出每日简报。',
    owner: '销售运营',
    deadline: '持续',
    completed: false,
  },
  {
    topic: '供应风险缓释',
    action: '完成供应商 B 交付链路复盘，制定替代方案。',
    owner: '采购',
    deadline: '下周三',
    completed: false,
  },
])

const filteredRiskInsights = computed(() => {
  if (!filterRisk.value) return riskInsights.value
  return riskInsights.value.filter((item) => item.type === 'danger' || item.type === 'warning')
})

const filteredRecommendations = computed(() => {
  let result = recommendations.value.filter((item) => !item.completed)
  if (filterOwner.value) {
    result = result.filter((item) => item.owner === filterOwner.value)
  }
  return result
})

const handleDateChange = () => {
  ElMessage.info(`已选择时间范围：${dateRange.value?.[0]} 至 ${dateRange.value?.[1]}`)
}

const handleRefresh = async () => {
  refreshing.value = true
  await new Promise((resolve) => setTimeout(resolve, 1500))
  const now = new Date()
  lastUpdate.value = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
  refreshing.value = false
  ElMessage.success('数据已刷新')
}

const handleExport = () => {
  ElMessage.success('报告导出功能（Mock）')
}

const handleKpiClick = (item: any) => {
  selectedKpi.value = item
  kpiDetailVisible.value = true
}

const viewDetail = (item: any) => {
  selectedItem.value = item
  detailVisible.value = true
}

const handleRiskAction = (item: any) => {
  ElMessageBox.confirm(item.description, item.title, {
    confirmButtonText: '已处理',
    cancelButtonText: '稍后处理',
  })
    .then(() => {
      ElMessage.success('已标记为已处理')
    })
    .catch(() => {})
}

const sortRecommendations = () => {
  recommendations.value.sort((a, b) => a.deadline.localeCompare(b.deadline))
  ElMessage.info('已按截止时间排序')
}

const applyFilter = () => {
  ElMessage.success('筛选已应用')
}

const resetFilter = () => {
  filterOwner.value = ''
  ElMessage.info('筛选已重置')
}

const handleRecommendationClick = (row: any) => {
  ElMessage.info(`查看建议详情：${row.topic}`)
}

const markComplete = (row: any) => {
  ElMessageBox.confirm(`确认标记"${row.topic}"为已完成？`, '确认操作', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
  })
    .then(() => {
      row.completed = true
      ElMessage.success('已标记为完成')
    })
    .catch(() => {})
}
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  background: #f5f7fa;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
}

.hero {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hero h1 {
  margin: 0 0 10px;
  font-size: 22px;
}

.hero-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.kpi-card {
  position: relative;
  transition: all 0.3s;
}

.kpi-card-clickable {
  cursor: pointer;
}

.kpi-card-clickable:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.kpi-hover {
  position: absolute;
  bottom: 10px;
  right: 10px;
  font-size: 12px;
  color: #409eff;
  opacity: 0;
  transition: opacity 0.3s;
}

.kpi-card-clickable:hover .kpi-hover {
  opacity: 1;
}

.kpi-title {
  font-size: 14px;
  color: #606266;
}

.kpi-value {
  font-size: 28px;
  font-weight: 600;
  margin: 12px 0;
}

.kpi-meta {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #909399;
}

.trend-up {
  color: #67c23a;
}

.trend-down {
  color: #f56c6c;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
}

.trend-table {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.trend-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
  font-size: 14px;
  align-items: center;
}

.trend-head {
  font-weight: 600;
  color: #606266;
}

.trend-row:last-child {
  border-bottom: none;
}

.risk {
  color: #e6a23c;
}

.safe {
  color: #67c23a;
}

.timeline-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.chart-container {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  text-align: center;
  color: #909399;
  padding: 40px;
}

.chart-desc {
  font-size: 12px;
  margin-top: 8px;
}

.filter-section {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 16px;
}

.kpi-detail {
  padding: 8px 0;
}

.detail-item {
  display: flex;
  margin-bottom: 16px;
  font-size: 14px;
}

.detail-item .label {
  font-weight: 600;
  width: 100px;
  color: #606266;
}

.detail-item .value {
  color: #303133;
}

.detail-content p {
  margin: 12px 0;
  font-size: 14px;
}

@media (max-width: 720px) {
  .dashboard {
    padding: 12px;
  }
}
</style>

