<template>
  <div class="page">
    <section class="intro card">
      <div>
        <h1>模式识别分析</h1>
        <p>
          利用机器学习与信号处理识别周期性、趋势性与异常模式，为智能预警、根因分析和策略优化提供依据，实现从描述现象到洞察规律的升级。
        </p>
      </div>
      <div class="intro-actions">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
        />
        <el-select v-model="patternType" placeholder="模式类型" clearable style="width: 150px">
          <el-option label="全部" value="" />
          <el-option label="周期" value="周期" />
          <el-option label="趋势" value="趋势" />
          <el-option label="模式" value="模式" />
        </el-select>
        <el-button type="primary" :icon="Refresh" @click="handleRefresh" :loading="refreshing">
          刷新分析
        </el-button>
        <el-button :icon="Download" @click="handleExport">导出报告</el-button>
      </div>
    </section>

    <section class="grid">
      <el-card class="card">
        <template #header>
          <div class="card-header">
            <span>周期 & 趋势识别</span>
            <el-button link type="primary" size="small" @click="viewChart = !viewChart">
              {{ viewChart ? '列表视图' : '图表视图' }}
            </el-button>
          </div>
        </template>
        <div v-if="!viewChart" class="cycle-list">
          <div
            v-for="item in filteredCycles"
            :key="item.name"
            class="cycle-item"
            @click="handleCycleClick(item)"
          >
            <div>
              <div class="title">{{ item.name }}</div>
              <p>{{ item.desc }}</p>
            </div>
            <div class="cycle-actions">
              <el-tag :type="item.type">{{ item.typeLabel }}</el-tag>
              <el-button link type="primary" size="small" @click.stop="handleCycleDetail(item)">
                详情
              </el-button>
            </div>
          </div>
        </div>
        <div v-else class="chart-container">
          <div class="chart-placeholder">
            <el-icon :size="48"><TrendCharts /></el-icon>
            <p>周期趋势识别图表</p>
            <p class="chart-desc">展示周期性、趋势性和模式识别结果</p>
          </div>
        </div>
      </el-card>

      <el-card class="card">
        <template #header>
          <div class="card-header">
            <span>异常波动时间线</span>
            <el-select v-model="anomalyLevel" placeholder="风险等级" clearable size="small" style="width: 120px">
              <el-option label="全部" value="" />
              <el-option label="高风险" value="danger" />
              <el-option label="中风险" value="warning" />
              <el-option label="低风险" value="success" />
            </el-select>
          </div>
        </template>
        <el-timeline>
          <el-timeline-item
            v-for="item in filteredAnomalies"
            :key="item.time"
            :type="item.level"
            :timestamp="item.time"
          >
            <div class="timeline-title">{{ item.title }}</div>
            <p>{{ item.detail }}</p>
            <div class="timeline-actions">
              <el-button link type="primary" size="small" @click="handleAnomalyAction(item)">处理建议</el-button>
              <el-button link type="info" size="small" @click="handleAnomalyDetail(item)">详情分析</el-button>
            </div>
          </el-timeline-item>
        </el-timeline>
      </el-card>
    </section>

    <section class="card">
      <div class="card-header">
        <h2>特征贡献分析</h2>
        <div>
          <el-input
            v-model="featureSearch"
            placeholder="搜索特征"
            clearable
            style="width: 200px; margin-right: 12px"
            :prefix-icon="Search"
          />
          <el-button :icon="Sort" @click="sortFeatures">排序</el-button>
        </div>
      </div>
      <el-table :data="filteredFeatures" size="small" @row-click="handleFeatureClick">
        <el-table-column prop="feature" label="特征" />
        <el-table-column label="贡献度" width="200">
          <template #default="{ row }">
            <el-progress
              :percentage="row.weight"
              :text-inside="true"
              :stroke-width="18"
              :color="getWeightColor(row.weight)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="insight" label="洞察说明" min-width="300" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click.stop="handleFeatureDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" :title="detailTitle" width="600px">
      <div class="detail-content">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="名称">{{ detailData?.name || detailData?.title || detailData?.feature }}</el-descriptions-item>
          <el-descriptions-item label="类型">
            <el-tag :type="detailData?.type || 'info'">{{ detailData?.typeLabel || '特征' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="描述">{{ detailData?.desc || detailData?.detail || detailData?.insight }}</el-descriptions-item>
          <el-descriptions-item v-if="detailData?.weight" label="贡献度">
            <el-progress :percentage="detailData.weight" :text-inside="true" :stroke-width="18" />
          </el-descriptions-item>
        </el-descriptions>
        <el-divider />
        <h4>分析建议</h4>
        <p class="suggestion-text">
          {{ getSuggestion(detailData) }}
        </p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Download, Sort, Search, TrendCharts } from '@element-plus/icons-vue'

const dateRange = ref<[string, string] | null>(null)
const patternType = ref('')
const anomalyLevel = ref('')
const featureSearch = ref('')
const refreshing = ref(false)
const viewChart = ref(false)
const detailVisible = ref(false)
const detailTitle = ref('')
const detailData = ref<any>(null)

const cycles = ref([
  {
    name: '周度需求波动',
    desc: '周一至周三需求相对平稳，周四起受渠道促销影响上升 18%。',
    type: 'success',
    typeLabel: '周期',
  },
  {
    name: '季节性增长',
    desc: '春季旺销，同比增幅 22%，建议提前规划产能和物流资源。',
    type: 'primary',
    typeLabel: '趋势',
  },
  {
    name: '价格敏感段',
    desc: '当折扣超过 12% 时，订单量出现指数级增长，需关注利润率。',
    type: 'warning',
    typeLabel: '模式',
  },
])

const anomalies = ref([
  {
    time: '09:30',
    title: '华南渠道异常增长',
    detail: '连续 3 天环比 +15%，定位为促销活动叠加天气因素。',
    level: 'success',
  },
  {
    time: '08:50',
    title: '供应商 B 交付抖动',
    detail: '关键零件交付提前 5%，影响库存节奏，需校准补货策略。',
    level: 'warning',
  },
  {
    time: '昨日 17:10',
    title: '产线节拍异常',
    detail: '产能利用率跌至 72%，检测到设备短时停机，已恢复。',
    level: 'danger',
  },
])

const featureContribution = ref([
  { feature: '节假日标签', weight: 78, insight: '节假日带来需求额外 25% 的弹性空间。' },
  { feature: '价格折扣率', weight: 63, insight: '折扣超过 10% 时成交提升最明显。' },
  { feature: '供应商准时率', weight: 55, insight: '准时率 < 85% 时库存波动显著放大。' },
  { feature: '天气指数', weight: 32, insight: '极端天气导致需求与交付双向波动。' },
])

const filteredCycles = computed(() => {
  if (!patternType.value) return cycles.value
  return cycles.value.filter((item) => item.typeLabel === patternType.value)
})

const filteredAnomalies = computed(() => {
  if (!anomalyLevel.value) return anomalies.value
  return anomalies.value.filter((item) => item.level === anomalyLevel.value)
})

const filteredFeatures = computed(() => {
  let result = featureContribution.value
  if (featureSearch.value) {
    const keyword = featureSearch.value.toLowerCase()
    result = result.filter((item) => item.feature.toLowerCase().includes(keyword) || item.insight.toLowerCase().includes(keyword))
  }
  return result
})

const getWeightColor = (weight: number) => {
  if (weight >= 70) return '#67c23a'
  if (weight >= 50) return '#e6a23c'
  return '#909399'
}

const handleRefresh = async () => {
  refreshing.value = true
  await new Promise((resolve) => setTimeout(resolve, 1500))
  refreshing.value = false
  ElMessage.success('分析已刷新')
}

const handleExport = () => {
  ElMessage.success('报告导出功能（Mock）')
}

const handleCycleClick = (item: any) => {
  handleCycleDetail(item)
}

const handleCycleDetail = (item: any) => {
  detailTitle.value = '模式识别详情'
  detailData.value = item
  detailVisible.value = true
}

const handleAnomalyAction = (item: any) => {
  ElMessageBox.confirm(item.detail, item.title, {
    confirmButtonText: '已处理',
    cancelButtonText: '稍后处理',
  })
    .then(() => {
      ElMessage.success('已标记为已处理')
    })
    .catch(() => {})
}

const handleAnomalyDetail = (item: any) => {
  detailTitle.value = '异常分析详情'
  detailData.value = item
  detailVisible.value = true
}

const sortFeatures = () => {
  featureContribution.value.sort((a, b) => b.weight - a.weight)
  ElMessage.info('已按贡献度降序排序')
}

const handleFeatureClick = (row: any) => {
  handleFeatureDetail(row)
}

const handleFeatureDetail = (row: any) => {
  detailTitle.value = '特征贡献详情'
  detailData.value = row
  detailVisible.value = true
}

const getSuggestion = (data: any) => {
  if (!data) return ''
  if (data.typeLabel === '周期') {
    return '建议根据周期性规律提前调整库存和产能，优化资源配置。'
  }
  if (data.typeLabel === '趋势') {
    return '建议持续监控趋势变化，及时调整策略以应对市场变化。'
  }
  if (data.typeLabel === '模式') {
    return '建议深入分析模式形成原因，制定针对性优化方案。'
  }
  if (data.weight) {
    return `该特征贡献度为 ${data.weight}%，建议重点关注并持续优化相关策略。`
  }
  return '建议持续监控和分析，及时调整策略。'
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

.intro {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.intro-actions {
  display: flex;
  gap: 12px;
  align-items: center;
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

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.cycle-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cycle-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s;
}

.cycle-item:hover {
  background: #f5f7fa;
}

.cycle-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cycle-item .title {
  font-weight: 600;
  margin-bottom: 6px;
}

.timeline-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.timeline-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
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

.detail-content {
  padding: 8px 0;
}

.suggestion-text {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  color: #606266;
  line-height: 1.6;
}
</style>

