<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'

// 类型定义
interface KeyMetric {
  title: string
  value: number | string
  unit: string
  trend: 'up' | 'down'
  trendValue: string
  icon: string
  color: string
}

interface Insight {
  id: string
  timestamp: string
  type: 'anomaly' | 'trend' | 'correlation'
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  affectedDevices: number
  confidence: number
}

interface Decision {
  id: string
  priority: 'urgent' | 'important' | 'normal' | 'suggest'
  title: string
  description: string
  solutions: Solution[]
  createdAt: string
  status: 'pending' | 'processing' | 'completed'
}

interface Solution {
  name: string
  description: string
  expectedEffect: string
  impact: number
  cost: number
  timeRequired: string
}

interface EfficiencyMetric {
  category: string
  before: number
  after: number
  improvement: number
  status: 'significant' | 'improved' | 'maintained' | 'need_optimize'
}

interface Report {
  id: string
  title: string
  generatedAt: string
  type: string
  status: 'generating' | 'completed'
  size: string
}

// 响应式数据
const loading = ref(true)
const keyMetrics = ref<KeyMetric[]>([])
const insights = ref<Insight[]>([])
const decisions = ref<Decision[]>([])
const efficiencyMetrics = ref<EfficiencyMetric[]>([])
const reports = ref<Report[]>([])
const selectedInsight = ref<Insight | null>(null)
const reportGenerating = ref(false)

// 计算属性
const criticalInsights = computed(() => 
  insights.value.filter(i => i.severity === 'critical')
)

const urgentDecisions = computed(() => 
  decisions.value.filter(d => d.priority === 'urgent' || d.priority === 'important')
)

// 优先级配置
const priorityConfig = {
  urgent: { label: '紧急', color: '#F56C6C', icon: 'el-icon-warning' },
  important: { label: '重要', color: '#E6A23C', icon: 'el-icon-info' },
  normal: { label: '常规', color: '#409EFF', icon: 'el-icon-bell' },
  suggest: { label: '建议', color: '#67C23A', icon: 'el-icon-success' }
}

const statusConfig = {
  significant: { label: '显著提升', color: '#67C23A' },
  improved: { label: '有所改善', color: '#409EFF' },
  maintained: { label: '维持现状', color: '#E6A23C' },
  need_optimize: { label: '待优化', color: '#F56C6C' }
}

// Mock 数据加载
const loadMockData = () => {
  loading.value = true
  
  setTimeout(() => {
    // 关键指标数据
    keyMetrics.value = [
      {
        title: '边缘设备总数',
        value: 156,
        unit: '个',
        trend: 'up',
        trendValue: '+12',
        icon: '📱',
        color: '#409EFF'
      },
      {
        title: '实时异常数',
        value: 8,
        unit: '项',
        trend: 'down',
        trendValue: '-3',
        icon: '⚠️',
        color: '#E6A23C'
      },
      {
        title: '处理成功率',
        value: '98.5',
        unit: '%',
        trend: 'up',
        trendValue: '+2.3%',
        icon: '✅',
        color: '#67C23A'
      },
      {
        title: '平均响应时间',
        value: '1.2',
        unit: 's',
        trend: 'down',
        trendValue: '-0.5s',
        icon: '⚡',
        color: '#67C23A'
      },
      {
        title: '智能决策数',
        value: 342,
        unit: '次',
        trend: 'up',
        trendValue: '+45',
        icon: '🧠',
        color: '#409EFF'
      },
      {
        title: '效率提升',
        value: '156',
        unit: '%',
        trend: 'up',
        trendValue: '+23%',
        icon: '🚀',
        color: '#67C23A'
      }
    ]

    // 实时洞察数据
    insights.value = [
      {
        id: 'INS001',
        timestamp: '2025-10-30 14:35:21',
        type: 'anomaly',
        severity: 'critical',
        title: '生产线3号设备异常振动频率突增',
        description: '检测到振动频率从正常范围50-60Hz突增至85Hz，可能存在机械故障风险，建议立即检查轴承和传动系统。',
        affectedDevices: 3,
        confidence: 95
      },
      {
        id: 'INS002',
        timestamp: '2025-10-30 14:28:15',
        type: 'trend',
        severity: 'warning',
        title: '仓储区温度持续上升趋势',
        description: '过去2小时内，仓储区平均温度从22°C上升至26°C，可能影响产品质量，建议检查空调系统。',
        affectedDevices: 5,
        confidence: 88
      },
      {
        id: 'INS003',
        timestamp: '2025-10-30 14:15:42',
        type: 'correlation',
        severity: 'info',
        title: '能耗与产量关联度异常',
        description: '发现能耗增加15%但产量仅提升3%，能效比显著下降，建议优化生产调度策略。',
        affectedDevices: 8,
        confidence: 82
      },
      {
        id: 'INS004',
        timestamp: '2025-10-30 14:05:33',
        type: 'anomaly',
        severity: 'critical',
        title: '网络延迟峰值异常',
        description: '东区边缘节点网络延迟突增至350ms，是正常值的7倍，可能影响实时控制响应。',
        affectedDevices: 12,
        confidence: 92
      },
      {
        id: 'INS005',
        timestamp: '2025-10-30 13:58:20',
        type: 'trend',
        severity: 'warning',
        title: '质检不良品率上升',
        description: '过去1小时质检不良品率从0.5%上升至1.8%，已超过警戒线，建议检查生产工艺参数。',
        affectedDevices: 2,
        confidence: 90
      }
    ]

    // 决策建议数据
    decisions.value = [
      {
        id: 'DEC001',
        priority: 'urgent',
        title: '3号生产线设备紧急停机检修',
        description: '基于异常振动分析，设备存在机械故障高风险，建议立即停机检修以避免更大损失。',
        solutions: [
          {
            name: '立即停机检修',
            description: '停止生产，安排专业技术人员进行全面检查',
            expectedEffect: '消除故障隐患，避免设备损坏',
            impact: 95,
            cost: 50000,
            timeRequired: '4-6小时'
          },
          {
            name: '降速运行监测',
            description: '降低设备运行速度至60%，持续监测振动数据',
            expectedEffect: '降低风险，维持部分产能',
            impact: 60,
            cost: 10000,
            timeRequired: '24小时'
          },
          {
            name: '计划性停机',
            description: '完成当前批次后安排停机检修',
            expectedEffect: '兼顾生产与维护，风险较高',
            impact: 40,
            cost: 30000,
            timeRequired: '8-12小时'
          }
        ],
        createdAt: '2025-10-30 14:36:00',
        status: 'pending'
      },
      {
        id: 'DEC002',
        priority: 'important',
        title: '优化仓储区空调系统运行',
        description: '温度持续上升可能影响产品质量，建议调整空调系统运行参数或增加制冷设备。',
        solutions: [
          {
            name: '提高空调制冷功率',
            description: '将空调系统制冷功率提升至最大，快速降温',
            expectedEffect: '快速恢复正常温度',
            impact: 85,
            cost: 5000,
            timeRequired: '1-2小时'
          },
          {
            name: '启用备用制冷设备',
            description: '启动移动式制冷设备辅助降温',
            expectedEffect: '增强制冷能力，确保温度稳定',
            impact: 90,
            cost: 8000,
            timeRequired: '30分钟'
          }
        ],
        createdAt: '2025-10-30 14:29:00',
        status: 'processing'
      },
      {
        id: 'DEC003',
        priority: 'normal',
        title: '优化生产调度策略',
        description: '根据能耗与产量关联分析，建议优化生产计划，提高能源利用效率。',
        solutions: [
          {
            name: '调整生产时段',
            description: '将高能耗工序调整至低峰电价时段',
            expectedEffect: '降低能源成本15-20%',
            impact: 75,
            cost: 2000,
            timeRequired: '规划周期3天'
          },
          {
            name: '优化设备负载',
            description: '平衡各设备负载，避免空转和过载',
            expectedEffect: '提高设备利用率，降低能耗',
            impact: 70,
            cost: 3000,
            timeRequired: '持续优化'
          }
        ],
        createdAt: '2025-10-30 14:16:00',
        status: 'pending'
      },
      {
        id: 'DEC004',
        priority: 'suggest',
        title: '建立质检预警阈值优化机制',
        description: '基于历史数据分析，建议建立动态预警阈值，提前发现质量问题。',
        solutions: [
          {
            name: '实施动态阈值算法',
            description: '根据历史数据和生产条件自动调整预警阈值',
            expectedEffect: '提前30%发现质量问题',
            impact: 80,
            cost: 15000,
            timeRequired: '开发周期2周'
          }
        ],
        createdAt: '2025-10-30 13:59:00',
        status: 'completed'
      }
    ]

    // 效率提升评估数据
    efficiencyMetrics.value = [
      {
        category: '异常响应时间',
        before: 45,
        after: 3,
        improvement: 93.3,
        status: 'significant'
      },
      {
        category: '人工干预次数',
        before: 120,
        after: 25,
        improvement: 79.2,
        status: 'significant'
      },
      {
        category: '问题解决率',
        before: 75,
        after: 96,
        improvement: 28.0,
        status: 'improved'
      },
      {
        category: '设备运行时长',
        before: 85,
        after: 95,
        improvement: 11.8,
        status: 'improved'
      },
      {
        category: '能源利用效率',
        before: 70,
        after: 88,
        improvement: 25.7,
        status: 'improved'
      },
      {
        category: '决策准确率',
        before: 82,
        after: 98,
        improvement: 19.5,
        status: 'significant'
      }
    ]

    // 报表数据
    reports.value = [
      {
        id: 'RPT001',
        title: '10月智能决策效果分析报告',
        generatedAt: '2025-10-30 10:00:00',
        type: '月度报告',
        status: 'completed',
        size: '2.3 MB'
      },
      {
        id: 'RPT002',
        title: '边缘智能运营周报',
        generatedAt: '2025-10-28 09:00:00',
        type: '周报',
        status: 'completed',
        size: '1.8 MB'
      },
      {
        id: 'RPT003',
        title: '异常处理效率评估报告',
        generatedAt: '2025-10-25 15:30:00',
        type: '专项报告',
        status: 'completed',
        size: '3.1 MB'
      }
    ]

    loading.value = false
    ElMessage.success('数据加载成功')
  }, 1500)
}

// 查看洞察详情
const viewInsightDetail = (insight: Insight) => {
  selectedInsight.value = insight
  ElMessage.info(`查看洞察详情: ${insight.title}`)
}

// 执行决策
const executeDecision = (decision: Decision, solution: Solution) => {
  ElMessage.success(`开始执行决策: ${decision.title} - 方案: ${solution.name}`)
  decision.status = 'processing'
}

// 生成报表
const generateReport = () => {
  reportGenerating.value = true
  ElMessage.info('正在生成智能决策报告...')
  
  setTimeout(() => {
    const newReport: Report = {
      id: `RPT${String(reports.value.length + 1).padStart(3, '0')}`,
      title: `智能决策日报-${new Date().toLocaleDateString()}`,
      generatedAt: new Date().toLocaleString(),
      type: '日报',
      status: 'completed',
      size: '1.5 MB'
    }
    reports.value.unshift(newReport)
    reportGenerating.value = false
    ElMessage.success('报表生成成功')
  }, 3000)
}

// 导出报表
const exportReport = (report: Report) => {
  ElMessage.success(`导出报表: ${report.title}`)
}

// 获取严重程度标签类型
const getSeverityType = (severity: string) => {
  const map: Record<string, any> = {
    critical: 'danger',
    warning: 'warning',
    info: 'info'
  }
  return map[severity] || 'info'
}

// 获取优先级标签类型
const getPriorityType = (priority: string) => {
  const map: Record<string, any> = {
    urgent: 'danger',
    important: 'warning',
    normal: '',
    suggest: 'success'
  }
  return map[priority] || ''
}

// 生命周期
onMounted(() => {
  loadMockData()
})
</script>

<template>
  <div class="edge-decision" v-loading="loading">
    <!-- 顶部：关键指标概览 -->
    <div class="metrics-overview">
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12" :md="8" :lg="4" v-for="metric in keyMetrics" :key="metric.title">
          <el-card class="metric-card" shadow="hover">
            <div class="metric-icon">{{ metric.icon }}</div>
            <div class="metric-content">
              <div class="metric-title">{{ metric.title }}</div>
              <div class="metric-value">
                <span class="value">{{ metric.value }}</span>
                <span class="unit">{{ metric.unit }}</span>
              </div>
              <div class="metric-trend" :class="metric.trend">
                <span class="trend-icon">{{ metric.trend === 'up' ? '↑' : '↓' }}</span>
                <span class="trend-value">{{ metric.trendValue }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 中部：实时洞察分析 -->
    <div class="insights-section">
      <el-card shadow="never">
        <template #header>
          <div class="card-header">
            <span class="title">🔍 实时洞察分析</span>
            <div class="header-stats">
              <el-tag type="danger" size="small">紧急 {{ criticalInsights.length }}</el-tag>
              <el-tag type="warning" size="small" style="margin-left: 8px">
                总计 {{ insights.length }}
              </el-tag>
            </div>
          </div>
        </template>
        
        <el-table :data="insights" stripe>
          <el-table-column prop="timestamp" label="时间" width="160" />
          <el-table-column prop="severity" label="级别" width="100">
            <template #default="{ row }">
              <el-tag :type="getSeverityType(row.severity)" size="small">
                {{ row.severity === 'critical' ? '紧急' : row.severity === 'warning' ? '警告' : '信息' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag size="small" effect="plain">
                {{ row.type === 'anomaly' ? '异常' : row.type === 'trend' ? '趋势' : '关联' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="洞察标题" min-width="200" />
          <el-table-column prop="affectedDevices" label="影响设备" width="100" align="center">
            <template #default="{ row }">
              <span style="color: #409EFF; font-weight: bold;">{{ row.affectedDevices }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="confidence" label="置信度" width="120" align="center">
            <template #default="{ row }">
              <el-progress 
                :percentage="row.confidence" 
                :color="row.confidence >= 90 ? '#67C23A' : row.confidence >= 80 ? '#409EFF' : '#E6A23C'"
                :stroke-width="8"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center">
            <template #default="{ row }">
              <el-button type="primary" size="small" link @click="viewInsightDetail(row)">
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 底部：决策建议和效率评估 -->
    <el-row :gutter="16" class="bottom-section">
      <!-- 左侧：决策建议生成 -->
      <el-col :xs="24" :lg="14">
        <el-card shadow="never" class="decisions-card">
          <template #header>
            <div class="card-header">
              <span class="title">💡 智能决策建议</span>
              <div class="header-stats">
                <el-tag type="danger" size="small">待处理 {{ urgentDecisions.length }}</el-tag>
              </div>
            </div>
          </template>

          <div class="decisions-list">
            <el-card 
              v-for="decision in decisions" 
              :key="decision.id" 
              class="decision-item"
              shadow="hover"
            >
              <div class="decision-header">
                <div class="decision-title-row">
                  <el-tag :type="getPriorityType(decision.priority)" size="small">
                    {{ priorityConfig[decision.priority].label }}
                  </el-tag>
                  <span class="decision-title">{{ decision.title }}</span>
                </div>
                <el-tag 
                  :type="decision.status === 'completed' ? 'success' : decision.status === 'processing' ? 'warning' : 'info'"
                  size="small"
                >
                  {{ decision.status === 'completed' ? '已完成' : decision.status === 'processing' ? '处理中' : '待处理' }}
                </el-tag>
              </div>
              
              <div class="decision-description">
                {{ decision.description }}
              </div>
              
              <div class="decision-time">
                <span style="color: #909399; font-size: 12px;">生成时间: {{ decision.createdAt }}</span>
              </div>

              <el-divider style="margin: 12px 0;" />

              <div class="solutions-list">
                <div class="solutions-title">应对方案（{{ decision.solutions.length }}套）：</div>
                <div 
                  v-for="(solution, index) in decision.solutions" 
                  :key="index"
                  class="solution-item"
                >
                  <div class="solution-header">
                    <span class="solution-name">方案{{ index + 1 }}: {{ solution.name }}</span>
                    <el-button 
                      type="primary" 
                      size="small" 
                      :disabled="decision.status !== 'pending'"
                      @click="executeDecision(decision, solution)"
                    >
                      执行此方案
                    </el-button>
                  </div>
                  <div class="solution-description">{{ solution.description }}</div>
                  <div class="solution-metrics">
                    <div class="solution-metric">
                      <span class="label">预期效果：</span>
                      <span>{{ solution.expectedEffect }}</span>
                    </div>
                    <div class="solution-metric">
                      <span class="label">影响度：</span>
                      <el-progress 
                        :percentage="solution.impact" 
                        :stroke-width="6"
                        :show-text="true"
                        style="width: 120px;"
                      />
                    </div>
                    <div class="solution-metric">
                      <span class="label">成本：</span>
                      <span style="color: #E6A23C; font-weight: bold;">¥{{ solution.cost.toLocaleString() }}</span>
                    </div>
                    <div class="solution-metric">
                      <span class="label">所需时间：</span>
                      <span>{{ solution.timeRequired }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </el-card>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：效率提升评估 + 报表生成 -->
      <el-col :xs="24" :lg="10">
        <!-- 效率提升评估 -->
        <el-card shadow="never" class="efficiency-card">
          <template #header>
            <div class="card-header">
              <span class="title">📊 效率提升评估</span>
            </div>
          </template>

          <div class="efficiency-list">
            <div 
              v-for="metric in efficiencyMetrics" 
              :key="metric.category"
              class="efficiency-item"
            >
              <div class="efficiency-header">
                <span class="efficiency-category">{{ metric.category }}</span>
                <el-tag 
                  :color="statusConfig[metric.status].color"
                  size="small"
                  effect="dark"
                >
                  {{ statusConfig[metric.status].label }}
                </el-tag>
              </div>
              <div class="efficiency-comparison">
                <div class="comparison-item">
                  <span class="label">改造前：</span>
                  <span class="value">{{ metric.before }}{{ metric.category.includes('率') || metric.category.includes('效率') ? '%' : '次/分钟' }}</span>
                </div>
                <div class="comparison-arrow">→</div>
                <div class="comparison-item">
                  <span class="label">改造后：</span>
                  <span class="value highlight">{{ metric.after }}{{ metric.category.includes('率') || metric.category.includes('效率') ? '%' : '次/分钟' }}</span>
                </div>
              </div>
              <div class="efficiency-improvement">
                <el-progress 
                  :percentage="metric.improvement" 
                  :color="statusConfig[metric.status].color"
                  :stroke-width="10"
                >
                  <span style="font-size: 12px; font-weight: bold;">+{{ metric.improvement.toFixed(1) }}%</span>
                </el-progress>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 报表自动生成 -->
        <el-card shadow="never" class="reports-card" style="margin-top: 16px;">
          <template #header>
            <div class="card-header">
              <span class="title">📄 智能报表管理</span>
              <el-button 
                type="primary" 
                size="small" 
                :loading="reportGenerating"
                @click="generateReport"
              >
                {{ reportGenerating ? '生成中...' : '生成新报表' }}
              </el-button>
            </div>
          </template>

          <div class="reports-list">
            <el-timeline>
              <el-timeline-item 
                v-for="report in reports" 
                :key="report.id"
                :timestamp="report.generatedAt"
                placement="top"
              >
                <el-card shadow="hover" class="report-item">
                  <div class="report-header">
                    <div class="report-info">
                      <div class="report-title">{{ report.title }}</div>
                      <div class="report-meta">
                        <el-tag size="small" type="info">{{ report.type }}</el-tag>
                        <span class="report-size">{{ report.size }}</span>
                      </div>
                    </div>
                    <el-button 
                      type="success" 
                      size="small" 
                      @click="exportReport(report)"
                      :disabled="report.status !== 'completed'"
                    >
                      {{ report.status === 'completed' ? '导出' : '生成中...' }}
                    </el-button>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 总结提示 -->
    <el-alert
      title="💡 智能化效益总结"
      type="success"
      :closable="false"
      style="margin-top: 16px;"
    >
      <template #default>
        <div style="line-height: 1.8;">
          通过边缘智能决策系统，管理者可实时掌握业务运营状态，基于数据驱动做出精准决策。
          系统已累计生成 <strong style="color: #67C23A;">{{ decisions.length }}</strong> 条决策建议，
          识别 <strong style="color: #E6A23C;">{{ insights.length }}</strong> 项业务洞察，
          整体运营效率提升 <strong style="color: #409EFF;">156%</strong>，
          显著推动智能化监控体系的高效落地。
        </div>
      </template>
    </el-alert>
  </div>
</template>

<style scoped lang="scss">
.edge-decision {
  padding: 20px;
  background: #f0f2f5;
  min-height: calc(100vh - 120px);

  .metrics-overview {
    margin-bottom: 20px;

    .metric-card {
      height: 140px;
      border-radius: 8px;
      transition: all 0.3s;
      cursor: pointer;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
      }

      :deep(.el-card__body) {
        padding: 16px;
        display: flex;
        align-items: center;
        height: 100%;
      }

      .metric-icon {
        font-size: 48px;
        margin-right: 16px;
      }

      .metric-content {
        flex: 1;

        .metric-title {
          font-size: 13px;
          color: #909399;
          margin-bottom: 8px;
        }

        .metric-value {
          margin-bottom: 8px;

          .value {
            font-size: 28px;
            font-weight: bold;
            color: #303133;
          }

          .unit {
            font-size: 14px;
            color: #909399;
            margin-left: 4px;
          }
        }

        .metric-trend {
          font-size: 13px;
          font-weight: 500;

          &.up {
            color: #67C23A;
          }

          &.down {
            color: #F56C6C;
          }

          .trend-icon {
            margin-right: 4px;
          }
        }
      }
    }
  }

  .insights-section {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .title {
        font-size: 16px;
        font-weight: bold;
        color: #303133;
      }
    }
  }

  .bottom-section {
    .decisions-card,
    .efficiency-card,
    .reports-card {
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .title {
          font-size: 16px;
          font-weight: bold;
          color: #303133;
        }
      }
    }

    .decisions-list {
      .decision-item {
        margin-bottom: 16px;
        border-left: 4px solid #409EFF;

        &:last-child {
          margin-bottom: 0;
        }

        .decision-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          .decision-title-row {
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1;

            .decision-title {
              font-size: 15px;
              font-weight: bold;
              color: #303133;
            }
          }
        }

        .decision-description {
          color: #606266;
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 8px;
        }

        .decision-time {
          margin-bottom: 8px;
        }

        .solutions-list {
          .solutions-title {
            font-weight: bold;
            color: #606266;
            margin-bottom: 12px;
            font-size: 14px;
          }

          .solution-item {
            background: #f5f7fa;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 12px;

            &:last-child {
              margin-bottom: 0;
            }

            .solution-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 8px;

              .solution-name {
                font-weight: 600;
                color: #303133;
                font-size: 14px;
              }
            }

            .solution-description {
              color: #606266;
              font-size: 13px;
              margin-bottom: 12px;
              line-height: 1.5;
            }

            .solution-metrics {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 8px;
              font-size: 13px;

              .solution-metric {
                display: flex;
                align-items: center;
                gap: 8px;

                .label {
                  color: #909399;
                  white-space: nowrap;
                }
              }
            }
          }
        }
      }
    }

    .efficiency-list {
      .efficiency-item {
        padding: 16px;
        background: #f5f7fa;
        border-radius: 8px;
        margin-bottom: 12px;

        &:last-child {
          margin-bottom: 0;
        }

        .efficiency-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          .efficiency-category {
            font-weight: bold;
            color: #303133;
            font-size: 14px;
          }
        }

        .efficiency-comparison {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 13px;

          .comparison-item {
            .label {
              color: #909399;
            }

            .value {
              color: #606266;
              font-weight: 600;
              margin-left: 4px;

              &.highlight {
                color: #67C23A;
              }
            }
          }

          .comparison-arrow {
            color: #409EFF;
            font-weight: bold;
            font-size: 16px;
          }
        }

        .efficiency-improvement {
          margin-top: 8px;
        }
      }
    }

    .reports-list {
      max-height: 400px;
      overflow-y: auto;

      .report-item {
        .report-header {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .report-info {
            flex: 1;

            .report-title {
              font-weight: bold;
              color: #303133;
              margin-bottom: 8px;
              font-size: 14px;
            }

            .report-meta {
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 12px;

              .report-size {
                color: #909399;
              }
            }
          }
        }
      }
    }
  }
}

// 响应式优化
@media (max-width: 768px) {
  .edge-decision {
    padding: 12px;

    .metric-card {
      margin-bottom: 12px;
    }

    .bottom-section {
      .el-col {
        margin-bottom: 16px;
      }
    }
  }
}
</style>