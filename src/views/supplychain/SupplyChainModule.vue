<template>
  <div class="supply-chain-module">
    <el-page-header
      content="供应链计划模型数据挖掘分析系统"
      :title="activeModule?.title"
      class="module-header"
    />

    <el-alert
      v-if="activeModule"
      :title="activeModule.description"
      type="info"
      show-icon
      class="module-description"
    />

    <el-row :gutter="16" class="section">
      <el-col :span="6" v-for="metric in overviewMetrics" :key="metric.label">
        <el-card shadow="hover" class="metric-card">
          <el-statistic :title="metric.label" :value="metric.value">
            <template #suffix>
              <el-tag :type="metric.trend > 0 ? 'success' : 'danger'" size="small">
                {{ metric.trend > 0 ? '+' : '' }}{{ metric.trend }}%
              </el-tag>
            </template>
          </el-statistic>
          <div class="stat-desc">{{ metric.description }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="section">
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>执行全景</span>
              <el-tag :type="statusTag.type">{{ statusTag.label }}</el-tag>
            </div>
          </template>

          <el-skeleton v-if="loading" rows="5" animated />
          <template v-else>
            <el-timeline>
              <el-timeline-item
                v-for="phase in activeModule?.timeline"
                :key="phase.phase"
                :timestamp="phase.timestamp"
                :type="phase.type"
              >
                <div class="timeline-item">
                  <strong>{{ phase.phase }}</strong>
                  <p>{{ phase.detail }}</p>
                </div>
              </el-timeline-item>
            </el-timeline>
          </template>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>资源画像</span>
              <el-tag size="small" type="info">实时</el-tag>
            </div>
          </template>

          <el-skeleton v-if="loading" rows="5" animated />
          <el-table
            v-else
            :data="activeModule?.resourceUsage || []"
            border
            size="small"
          >
            <el-table-column prop="name" label="资源" width="140" />
            <el-table-column prop="load" label="当前负载">
              <template #default="{ row }">
                <el-progress
                  :percentage="row.load"
                  :status="row.load > 85 ? 'exception' : row.load > 65 ? 'warning' : 'success'"
                />
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="statusColorMap[row.status]">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="section">
      <el-col :span="8" v-for="insight in activeModule?.insights || []" :key="insight.title">
        <el-card shadow="hover" class="insight-card">
          <template #header>
            <div class="card-header">
              <span>{{ insight.title }}</span>
              <el-tag :type="insight.level">{{ insight.label }}</el-tag>
            </div>
          </template>
          <p class="insight-desc">{{ insight.description }}</p>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="section" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>优化建议与告警</span>
        </div>
      </template>

      <el-skeleton v-if="loading" rows="4" animated />
      <el-row v-else :gutter="12">
        <el-col :span="12" v-for="advice in activeModule?.advices || []" :key="advice.title">
          <el-alert
            :title="advice.title"
            :type="advice.type"
            :description="advice.detail"
            show-icon
            class="advice-alert"
          >
            <template #title>
              <div class="advice-title">
                <span>{{ advice.title }}</span>
                <el-tag :type="priorityColorMap[advice.priority]" effect="dark" size="small">
                  {{ advice.priority }}优先
                </el-tag>
              </div>
            </template>
          </el-alert>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

type StatusLevel = '健康' | '良好' | '关注' | '异常'
type AdvicePriority = '高' | '中' | '低'

interface TimelinePhase {
  phase: string
  detail: string
  timestamp: string
  type: 'primary' | 'success' | 'warning' | 'danger'
}

interface ResourceUsage {
  name: string
  load: number
  status: StatusLevel
}

interface Insight {
  title: string
  label: string
  level: 'success' | 'warning' | 'danger'
  description: string
}

interface Advice {
  title: string
  detail: string
  type: 'success' | 'info' | 'warning' | 'error'
  priority: AdvicePriority
}

interface ModuleConfig {
  key: ModuleKey
  title: string
  description: string
  health: StatusLevel
  timeline: TimelinePhase[]
  resourceUsage: ResourceUsage[]
  insights: Insight[]
  advices: Advice[]
}

type ModuleKey =
  | 'taskOrchestration'
  | 'dataSources'
  | 'dataQuality'
  | 'multiForecast'
  | 'factorAnalysis'

const route = useRoute()
const loading = ref(true)
const activeModule = ref<ModuleConfig>()

const statusColorMap: Record<StatusLevel, 'success' | 'info' | 'warning' | 'danger'> = {
  健康: 'success',
  良好: 'info',
  关注: 'warning',
  异常: 'danger',
}

const priorityColorMap: Record<AdvicePriority, 'danger' | 'warning' | 'info'> = {
  高: 'danger',
  中: 'warning',
  低: 'info',
}

const moduleDictionary: Record<ModuleKey, ModuleConfig> = {
  taskOrchestration: {
    key: 'taskOrchestration',
    title: '模型配置与任务管理',
    description:
      '集中配置、调度及监控分析任务，确保供应链洞察按计划稳定输出，任务支持依赖与资源动态调度。',
    health: '良好',
    timeline: [
      { phase: '依赖编排', detail: '7 条任务依赖校验通过', timestamp: '08:30', type: 'primary' },
      { phase: '资源分配', detail: 'GPU/内存动态调度完成', timestamp: '08:45', type: 'success' },
      { phase: '任务执行', detail: '15 个任务并行运行中', timestamp: '09:10', type: 'warning' },
      { phase: '成效复盘', detail: '自动产出执行复盘报告', timestamp: '10:00', type: 'success' },
    ],
    resourceUsage: [
      { name: '计算池', load: 78, status: '良好' },
      { name: '存储池', load: 64, status: '健康' },
      { name: '调度队列', load: 88, status: '关注' },
    ],
    insights: [
      {
        title: '任务 SLA',
        label: '达成率 96%',
        level: 'success',
        description: '关键模型任务 SLA 连续三天保持在 95% 以上，调度策略表现稳定。',
      },
      {
        title: '资源峰值预警',
        label: '峰值 92%',
        level: 'warning',
        description: '预测今晚 22:00 计算负载将达到峰值，建议提前调度离线任务。',
      },
      {
        title: '链路透明度',
        label: '可视化',
        level: 'success',
        description: '任务链路全程可视化，异常节点可在 2 分钟内定位并回溯。',
      },
    ],
    advices: [
      {
        title: '优化调度优先级',
        detail: '将需求预测链路优先级提升至 P1，保障 6:00 报告输出时效。',
        type: 'warning',
        priority: '高',
      },
      {
        title: '扩展离线资源池',
        detail: '夜间离线批任务排队时间较长，建议临时扩容 20% 的计算资源。',
        type: 'info',
        priority: '中',
      },
    ],
  },
  dataSources: {
    key: 'dataSources',
    title: '数据源管理',
    description:
      '统一接入 ERP/CRM/WMS 等数据源，完成格式映射、质量校验与链路监控，保证数据一致可用。',
    health: '健康',
    timeline: [
      { phase: '源接入', detail: '已接入 36 套业务系统', timestamp: '07:40', type: 'primary' },
      { phase: '格式映射', detail: '新版映射模板发布', timestamp: '08:05', type: 'success' },
      { phase: '链路监测', detail: '实时监测 12 条链路', timestamp: '09:00', type: 'success' },
      { phase: '质量校验', detail: '1 条库存数据待复核', timestamp: '10:20', type: 'warning' },
    ],
    resourceUsage: [
      { name: '数据接入网关', load: 55, status: '健康' },
      { name: '清洗集群', load: 68, status: '良好' },
      { name: '链路监控', load: 43, status: '健康' },
    ],
    insights: [
      {
        title: '源系统稳定性',
        label: '健康',
        level: 'success',
        description: '所有源系统 24 小时内无超 5 分钟中断，链路可用性 99.97%。',
      },
      {
        title: '数据新鲜度',
        label: '16min',
        level: 'success',
        description: 'WMS 数据平均延迟 16 分钟，满足库存优化模型的实时性要求。',
      },
      {
        title: '异常分布',
        label: '关注',
        level: 'warning',
        description: '库存维度重复记录主要集中在区域仓，需联动仓储系统排查。',
      },
    ],
    advices: [
      {
        title: '新增 API 限流策略',
        detail: '部分 ERP API 峰值期响应波动，建议配置渐进式限流策略。',
        type: 'warning',
        priority: '中',
      },
      {
        title: '强化外部源校验',
        detail: '天气指数来源新增字段需同步校验规则，避免下游解析错误。',
        type: 'info',
        priority: '低',
      },
    ],
  },
  dataQuality: {
    key: 'dataQuality',
    title: '数据质量监控',
    description:
      '依托规则引擎与算法监测数据异常、缺失与不一致问题，确保供应链分析与决策准确可靠。',
    health: '关注',
    timeline: [
      { phase: '指标巡检', detail: '103 项规则已巡检', timestamp: '06:30', type: 'primary' },
      { phase: '异常捕获', detail: '发现 8 条库存异常', timestamp: '07:10', type: 'danger' },
      { phase: '自动修复', detail: '完成 5 条缺失补全', timestamp: '07:40', type: 'warning' },
      { phase: '告警下发', detail: '推送 2 份专项报告', timestamp: '08:20', type: 'success' },
    ],
    resourceUsage: [
      { name: '规则引擎', load: 72, status: '良好' },
      { name: '异常回放', load: 91, status: '关注' },
      { name: '告警通道', load: 60, status: '良好' },
    ],
    insights: [
      {
        title: '异常复现率',
        label: '73%',
        level: 'warning',
        description: '库存异常在 3 个仓库可复现，需定位系统同步链路。',
      },
      {
        title: '缺失补全效果',
        label: '良好',
        level: 'success',
        description: '智能填补策略令缺失字段可用性提升 18%。',
      },
      {
        title: '实时告警响应',
        label: '2.6 min',
        level: 'success',
        description: '从异常捕获到告警确认平均耗时 2.6 分钟。',
      },
    ],
    advices: [
      {
        title: '加固库存链路',
        detail: '建议对区域仓库存同步链路追加双活校验，降低异常复现率。',
        type: 'error',
        priority: '高',
      },
      {
        title: '扩充监控维度',
        detail: '引入供应商交付指标，覆盖更上游的质量监控。',
        type: 'info',
        priority: '中',
      },
    ],
  },
  multiForecast: {
    key: 'multiForecast',
    title: '多维预测',
    description:
      '融合内外部信号，采用机器学习模型输出多维需求预测，为供应链提供前瞻洞察。',
    health: '良好',
    timeline: [
      { phase: '数据融合', detail: '完成 18 维特征对齐', timestamp: '05:30', type: 'primary' },
      { phase: '模型训练', detail: 'XGBoost/Informer 并行训练', timestamp: '06:10', type: 'success' },
      { phase: '误差评估', detail: 'MAPE 控制在 6.4%', timestamp: '06:45', type: 'success' },
      { phase: '预测发布', detail: '向 5 套系统推送预测', timestamp: '07:10', type: 'warning' },
    ],
    resourceUsage: [
      { name: '特征计算', load: 69, status: '良好' },
      { name: '训练集群', load: 82, status: '关注' },
      { name: '推理服务', load: 57, status: '健康' },
    ],
    insights: [
      {
        title: '预测精度',
        label: '↑ 2.3%',
        level: 'success',
        description: '与上周相比，全品类预测精度提升 2.3%。',
      },
      {
        title: '外部因素影响',
        label: '温度波动',
        level: 'warning',
        description: '北区温度骤降对保暖品类带来 12% 需求增量，需提前补货。',
      },
      {
        title: '模型健康度',
        label: '稳定',
        level: 'success',
        description: '核心模型权重分布稳定，无过拟合迹象。',
      },
    ],
    advices: [
      {
        title: '引入促销先验',
        detail: '双十二促销日历已更新，建议纳入模型特征以提升节奏预测。',
        type: 'info',
        priority: '中',
      },
      {
        title: '训练窗口扩展',
        detail: '新增 3 个月外部指数后，可进一步提升新品类预测精度。',
        type: 'success',
        priority: '低',
      },
    ],
  },
  factorAnalysis: {
    key: 'factorAnalysis',
    title: '影响因素分析',
    description:
      '量化内部外部因素对需求与库存的影响，解释业务变化驱动，帮助管理者识别核心杠杆。',
    health: '良好',
    timeline: [
      { phase: '指标筛选', detail: '锁定 12 个关键因子', timestamp: '04:50', type: 'primary' },
      { phase: '弹性建模', detail: '完成贝叶斯因子推断', timestamp: '05:20', type: 'success' },
      { phase: '结果解释', detail: '生成业务因果图谱', timestamp: '05:55', type: 'success' },
      { phase: '洞察下发', detail: '推送 3 条经营洞察', timestamp: '06:30', type: 'warning' },
    ],
    resourceUsage: [
      { name: '特征库', load: 58, status: '健康' },
      { name: '因果引擎', load: 74, status: '良好' },
      { name: '可视化服务', load: 46, status: '健康' },
    ],
    insights: [
      {
        title: '需求驱动因子',
        label: '营销贡献 34%',
        level: 'success',
        description: '营销活动对需求增量贡献 34%，为最大杠杆。',
      },
      {
        title: '库存压力源',
        label: '安全库存策略',
        level: 'warning',
        description: '安全库存策略偏保守，导致重要品类库存周转偏慢。',
      },
      {
        title: '供应弹性',
        label: '↑ 8%',
        level: 'success',
        description: '供应端柔性产能增量 8%，足以覆盖预测需求波动。',
      },
    ],
    advices: [
      {
        title: '调整库存策略',
        detail: '建议对慢周转品类降低安全库存系数 0.15，释放现金流。',
        type: 'warning',
        priority: '高',
      },
      {
        title: '联动营销策略',
        detail: '协同营销团队验证“天气+节奏”联合策略，放大需求杠杆。',
        type: 'success',
        priority: '中',
      },
    ],
  },
}

const overviewMetrics = ref([
  { label: '全局任务数', value: 48, trend: 6.2, description: '自动化任务总量' },
  { label: '模型健康度', value: '97%', trend: 2.1, description: '核心模型稳定性' },
  { label: '告警关闭率', value: '92%', trend: 4.8, description: '近 24h 告警闭环' },
  { label: '平均延迟', value: '11min', trend: -1.4, description: '链路端到端延迟' },
])

const statusTag = computed(() => {
  const health = activeModule.value?.health ?? '良好'
  return {
    label: health,
    type: statusColorMap[health],
  }
})

const moduleKey = computed(() => route.meta?.moduleKey as ModuleKey | undefined)

const fetchModuleData = () => {
  if (!moduleKey.value) return
  loading.value = true
  setTimeout(() => {
    activeModule.value = moduleDictionary[moduleKey.value]
    loading.value = false
  }, 600)
}

watch(moduleKey, () => {
  fetchModuleData()
})

onMounted(() => {
  fetchModuleData()
})
</script>

<style scoped>
.supply-chain-module {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: #f5f7fa;
  min-height: 100%;
}

.module-header {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
}

.module-description {
  margin-bottom: 8px;
}

.section {
  margin-top: 8px;
}

.metric-card {
  min-height: 120px;
}

.stat-desc {
  margin-top: 12px;
  color: #909399;
  font-size: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timeline-item p {
  margin: 4px 0 0;
  color: #606266;
}

.insight-card {
  min-height: 200px;
}

.insight-desc {
  margin-top: 12px;
  color: #606266;
  line-height: 1.6;
}

.advice-alert {
  margin-bottom: 12px;
}

.advice-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
</style>

