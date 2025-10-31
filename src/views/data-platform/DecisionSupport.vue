<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'

// 预警级别类型
type AlertLevel = 'success' | 'info' | 'warning' | 'danger'

// 决策建议类型
interface DecisionSuggestion {
  id: number
  title: string
  description: string
  level: AlertLevel
  category: string
  impact: string
  confidence: number
}

// 预测模型类型
interface PredictionModel {
  id: number
  name: string
  type: string
  accuracy: number
  status: string
  lastTrained: string
}

// 风险预警类型
interface RiskAlert {
  id: number
  title: string
  level: AlertLevel
  description: string
  time: string
  status: string
}

// 资源优化建议类型
interface ResourceOptimization {
  id: number
  resource: string
  currentUsage: number
  optimizedUsage: number
  savings: string
  priority: AlertLevel
}

// 决策报告类型
interface DecisionReport {
  id: number
  title: string
  date: string
  status: string
  type: string
}

// 响应式数据
const loading = ref(false)
const activeTab = ref('dashboard')

// 智能决策仪表盘数据
const dashboardStats = ref([
  { title: '决策执行率', value: 87.5, unit: '%', icon: '📊', trend: '+5.2%' },
  { title: '预警响应率', value: 95.3, unit: '%', icon: '⚠️', trend: '+2.1%' },
  { title: '资源优化率', value: 78.6, unit: '%', icon: '📈', trend: '+8.3%' },
  { title: '风险控制率', value: 92.1, unit: '%', icon: '🛡️', trend: '+3.5%' }
])

const decisionSuggestions = ref<DecisionSuggestion[]>([])
const predictionModels = ref<PredictionModel[]>([])
const riskAlerts = ref<RiskAlert[]>([])
const resourceOptimizations = ref<ResourceOptimization[]>([])
const decisionReports = ref<DecisionReport[]>([])

// 预测分析配置
const predictionConfig = ref({
  modelType: 'timeseries',
  dataRange: 30,
  confidence: 0.95
})

// 报告生成配置
const reportConfig = ref({
  template: 'comprehensive',
  format: 'pdf',
  includeSections: ['dashboard', 'prediction', 'resource', 'risk']
})

// 获取决策建议标签类型
const getSuggestionType = (level: AlertLevel): string => {
  const typeMap = {
    success: '推荐执行',
    info: '建议考虑',
    warning: '需要评估',
    danger: '暂不推荐'
  }
  return typeMap[level] || '未知'
}

// 获取风险等级标签
const getRiskLevelText = (level: AlertLevel): string => {
  const levelMap = {
    success: '正常',
    info: '关注',
    warning: '预警',
    danger: '警报'
  }
  return levelMap[level] || '未知'
}

// 加载所有数据
const loadAllData = async () => {
  loading.value = true
  try {
    await Promise.all([
      loadDecisionSuggestions(),
      loadPredictionModels(),
      loadRiskAlerts(),
      loadResourceOptimizations(),
      loadDecisionReports()
    ])
    ElMessage.success('数据加载成功')
  } catch (error) {
    ElMessage.error('数据加载失败')
  } finally {
    loading.value = false
  }
}

// 加载决策建议数据
const loadDecisionSuggestions = () => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      decisionSuggestions.value = [
        {
          id: 1,
          title: '优化园区能源管理系统',
          description: '基于近期用电数据分析，建议在非高峰时段调整空调系统运行策略，预计可节省15%电力成本',
          level: 'success',
          category: '能源优化',
          impact: '预计年节省成本 ¥180,000',
          confidence: 92
        },
        {
          id: 2,
          title: '增加安保人员夜间巡逻频次',
          description: '根据安全事件分析，夜间22:00-02:00时段风险较高，建议增加巡逻频次',
          level: 'info',
          category: '安全管理',
          impact: '风险降低约25%',
          confidence: 85
        },
        {
          id: 3,
          title: '调整车位分配策略',
          description: '停车数据显示A区车位利用率仅60%，而B区达到95%，建议重新规划车位分配',
          level: 'warning',
          category: '资源配置',
          impact: '提升整体利用率至82%',
          confidence: 78
        },
        {
          id: 4,
          title: '暂缓设备采购计划',
          description: '当前设备利用率未达标，建议先优化现有设备使用效率',
          level: 'danger',
          category: '投资决策',
          impact: '避免不必要支出 ¥500,000',
          confidence: 88
        }
      ]
      resolve()
    }, 800)
  })
}

// 加载预测模型数据
const loadPredictionModels = () => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      predictionModels.value = [
        {
          id: 1,
          name: '能耗预测模型',
          type: '时序预测',
          accuracy: 94.5,
          status: 'active',
          lastTrained: '2025-10-29 14:30:00'
        },
        {
          id: 2,
          name: '人流量预测模型',
          type: '回归分析',
          accuracy: 89.2,
          status: 'active',
          lastTrained: '2025-10-28 09:15:00'
        },
        {
          id: 3,
          name: '安全风险分类模型',
          type: '分类模型',
          accuracy: 91.8,
          status: 'training',
          lastTrained: '2025-10-27 16:45:00'
        },
        {
          id: 4,
          name: '设备故障预测模型',
          type: '时序预测',
          accuracy: 87.6,
          status: 'active',
          lastTrained: '2025-10-26 11:20:00'
        }
      ]
      resolve()
    }, 600)
  })
}

// 加载风险预警数据
const loadRiskAlerts = () => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      riskAlerts.value = [
        {
          id: 1,
          title: '能耗异常增长',
          level: 'danger',
          description: '本周能耗较上周增长32%，超出正常波动范围',
          time: '2025-10-30 08:30:00',
          status: 'pending'
        },
        {
          id: 2,
          title: '停车位紧张预警',
          level: 'warning',
          description: '预计下午15:00-18:00停车位使用率将达到98%',
          time: '2025-10-30 07:45:00',
          status: 'pending'
        },
        {
          id: 3,
          title: '设备维护提醒',
          level: 'info',
          description: '3号电梯即将达到维护周期，建议安排保养',
          time: '2025-10-29 16:20:00',
          status: 'resolved'
        },
        {
          id: 4,
          title: '园区运行正常',
          level: 'success',
          description: '所有系统运行状态良好',
          time: '2025-10-30 08:00:00',
          status: 'resolved'
        }
      ]
      resolve()
    }, 500)
  })
}

// 加载资源优化建议数据
const loadResourceOptimizations = () => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resourceOptimizations.value = [
        {
          id: 1,
          resource: '照明系统',
          currentUsage: 85,
          optimizedUsage: 68,
          savings: '¥42,000/年',
          priority: 'success'
        },
        {
          id: 2,
          resource: '空调系统',
          currentUsage: 92,
          optimizedUsage: 78,
          savings: '¥86,000/年',
          priority: 'success'
        },
        {
          id: 3,
          resource: '安保人力',
          currentUsage: 75,
          optimizedUsage: 82,
          savings: '效率提升9%',
          priority: 'info'
        },
        {
          id: 4,
          resource: '停车位',
          currentUsage: 68,
          optimizedUsage: 85,
          savings: '¥120,000/年',
          priority: 'warning'
        }
      ]
      resolve()
    }, 700)
  })
}

// 加载决策报告数据
const loadDecisionReports = () => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      decisionReports.value = [
        {
          id: 1,
          title: '2025年10月园区运营分析报告',
          date: '2025-10-30',
          status: '已生成',
          type: '综合分析'
        },
        {
          id: 2,
          title: '能源优化专项决策报告',
          date: '2025-10-28',
          status: '已生成',
          type: '专项分析'
        },
        {
          id: 3,
          title: '安全风险评估报告',
          date: '2025-10-25',
          status: '已生成',
          type: '风险评估'
        },
        {
          id: 4,
          title: '资源配置优化建议报告',
          date: '2025-10-23',
          status: '生成中',
          type: '优化建议'
        }
      ]
      resolve()
    }, 400)
  })
}

// 训练预测模型
const trainModel = (model: PredictionModel) => {
  ElMessage.info(`开始训练模型：${model.name}`)
  setTimeout(() => {
    model.status = 'training'
    setTimeout(() => {
      model.status = 'active'
      model.accuracy = Math.min(99, model.accuracy + Math.random() * 3)
      model.lastTrained = new Date().toLocaleString('zh-CN')
      ElMessage.success(`模型 ${model.name} 训练完成，准确率：${model.accuracy.toFixed(1)}%`)
    }, 3000)
  }, 500)
}

// 处理风险预警
const handleRiskAlert = (alert: RiskAlert) => {
  ElMessage.info(`正在处理预警：${alert.title}`)
  setTimeout(() => {
    alert.status = 'resolved'
    ElMessage.success('预警处理完成')
  }, 1000)
}

// 生成决策报告
const generateReport = () => {
  loading.value = true
  ElMessage.info('正在生成决策报告...')
  setTimeout(() => {
    const newReport: DecisionReport = {
      id: decisionReports.value.length + 1,
      title: `智能决策分析报告_${new Date().toLocaleDateString('zh-CN')}`,
      date: new Date().toLocaleDateString('zh-CN'),
      status: '已生成',
      type: reportConfig.value.template === 'comprehensive' ? '综合分析' : '专项分析'
    }
    decisionReports.value.unshift(newReport)
    loading.value = false
    ElMessage.success('报告生成成功')
  }, 2000)
}

// 导出报告
const exportReport = (report: DecisionReport, format: string = 'pdf') => {
  ElMessage.success(`正在导出 ${report.title} 为 ${format.toUpperCase()} 格式`)
}

// 刷新数据
const refreshData = () => {
  loadAllData()
}

// 统计数据
const totalAlerts = computed(() => riskAlerts.value.filter(a => a.status === 'pending').length)
const totalSuggestions = computed(() => decisionSuggestions.value.length)
const activeModels = computed(() => predictionModels.value.filter(m => m.status === 'active').length)

onMounted(() => {
  loadAllData()
})
</script>

<template>
  <div class="decision-analysis-container">
    <!-- 顶部操作栏 -->
    <div class="header-actions">
      <div class="page-title">
        <span class="icon">🧠</span>
        <span>智能化决策与管理支持</span>
      </div>
      <div class="actions">
        <el-button type="primary" @click="refreshData" :loading="loading">
          刷新数据
        </el-button>
        <el-button type="success" @click="generateReport">
          生成报告
        </el-button>
      </div>
    </div>

    <!-- 主要内容区 -->
    <el-row :gutter="20" v-loading="loading">
      <!-- 左侧导航菜单 -->
      <el-col :span="4">
        <el-card class="nav-menu-card">
          <template #header>
            <div class="card-header">
              <span>功能导航</span>
            </div>
          </template>
          <div class="nav-menu">
            <div 
              class="nav-item" 
              :class="{ active: activeTab === 'dashboard' }"
              @click="activeTab = 'dashboard'"
            >
              <span class="nav-icon">📊</span>
              <span>决策仪表盘</span>
            </div>
            <div 
              class="nav-item" 
              :class="{ active: activeTab === 'prediction' }"
              @click="activeTab = 'prediction'"
            >
              <span class="nav-icon">🔮</span>
              <span>预测分析</span>
            </div>
            <div 
              class="nav-item" 
              :class="{ active: activeTab === 'resource' }"
              @click="activeTab = 'resource'"
            >
              <span class="nav-icon">📈</span>
              <span>资源优化</span>
            </div>
            <div 
              class="nav-item" 
              :class="{ active: activeTab === 'risk' }"
              @click="activeTab = 'risk'"
            >
              <span class="nav-icon">⚠️</span>
              <span>风险预警</span>
              <el-badge :value="totalAlerts" class="badge" v-if="totalAlerts > 0" />
            </div>
            <div 
              class="nav-item" 
              :class="{ active: activeTab === 'report' }"
              @click="activeTab = 'report'"
            >
              <span class="nav-icon">📄</span>
              <span>决策报告</span>
            </div>
          </div>
        </el-card>

        <!-- 快速统计 -->
        <el-card class="quick-stats-card" style="margin-top: 20px;">
          <template #header>
            <div class="card-header">
              <span>快速统计</span>
            </div>
          </template>
          <div class="quick-stats">
            <div class="stat-item">
              <div class="stat-label">待处理预警</div>
              <div class="stat-value danger">{{ totalAlerts }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">决策建议</div>
              <div class="stat-value success">{{ totalSuggestions }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">活跃模型</div>
              <div class="stat-value info">{{ activeModels }}</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 中间核心数据区 -->
      <el-col :span="14">
        <!-- 智能决策仪表盘 -->
        <div v-show="activeTab === 'dashboard'">
          <el-card class="dashboard-stats-card">
            <template #header>
              <div class="card-header">
                <span>关键决策指标</span>
              </div>
            </template>
            <el-row :gutter="20">
              <el-col :span="6" v-for="stat in dashboardStats" :key="stat.title">
                <div class="stat-card">
                  <div class="stat-icon">{{ stat.icon }}</div>
                  <el-statistic :value="stat.value" :precision="1">
                    <template #title>
                      <div class="stat-title">{{ stat.title }}</div>
                    </template>
                    <template #suffix>{{ stat.unit }}</template>
                  </el-statistic>
                  <div class="stat-trend success">{{ stat.trend }}</div>
                </div>
              </el-col>
            </el-row>
          </el-card>

          <el-card class="suggestions-card" style="margin-top: 20px;">
            <template #header>
              <div class="card-header">
                <span>智能决策建议</span>
                <el-tag size="small">{{ decisionSuggestions.length }} 条建议</el-tag>
              </div>
            </template>
            <div class="suggestions-list">
              <div 
                class="suggestion-item" 
                v-for="suggestion in decisionSuggestions" 
                :key="suggestion.id"
              >
                <div class="suggestion-header">
                  <div class="suggestion-title">
                    <el-tag :type="suggestion.level" size="small">
                      {{ getSuggestionType(suggestion.level) }}
                    </el-tag>
                    <span>{{ suggestion.title }}</span>
                  </div>
                  <el-tag type="info" size="small">{{ suggestion.category }}</el-tag>
                </div>
                <div class="suggestion-content">
                  <p>{{ suggestion.description }}</p>
                  <div class="suggestion-meta">
                    <span class="impact">预期影响：{{ suggestion.impact }}</span>
                    <span class="confidence">
                      置信度：
                      <el-progress 
                        :percentage="suggestion.confidence" 
                        :color="suggestion.confidence > 85 ? '#67C23A' : '#E6A23C'"
                        :show-text="true"
                        style="width: 120px; display: inline-block;"
                      />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 预测分析模型 -->
        <div v-show="activeTab === 'prediction'">
          <el-card class="prediction-config-card">
            <template #header>
              <div class="card-header">
                <span>预测分析配置</span>
              </div>
            </template>
            <el-form label-width="120px">
              <el-row :gutter="20">
                <el-col :span="8">
                  <el-form-item label="模型类型">
                    <el-select v-model="predictionConfig.modelType" placeholder="请选择">
                      <el-option label="时序预测" value="timeseries" />
                      <el-option label="回归分析" value="regression" />
                      <el-option label="分类模型" value="classification" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="数据范围">
                    <el-select v-model="predictionConfig.dataRange" placeholder="请选择">
                      <el-option label="最近7天" :value="7" />
                      <el-option label="最近30天" :value="30" />
                      <el-option label="最近90天" :value="90" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="置信度">
                    <el-select v-model="predictionConfig.confidence" placeholder="请选择">
                      <el-option label="90%" :value="0.90" />
                      <el-option label="95%" :value="0.95" />
                      <el-option label="99%" :value="0.99" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </el-card>

          <el-card class="models-card" style="margin-top: 20px;">
            <template #header>
              <div class="card-header">
                <span>预测模型管理</span>
              </div>
            </template>
            <el-table :data="predictionModels" style="width: 100%">
              <el-table-column prop="name" label="模型名称" width="200" />
              <el-table-column prop="type" label="模型类型" width="120" />
              <el-table-column prop="accuracy" label="准确率" width="120">
                <template #default="{ row }">
                  <el-progress 
                    :percentage="row.accuracy" 
                    :color="row.accuracy > 90 ? '#67C23A' : '#E6A23C'"
                  />
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag 
                    :type="row.status === 'active' ? 'success' : 'warning'" 
                    size="small"
                  >
                    {{ row.status === 'active' ? '运行中' : '训练中' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="lastTrained" label="最后训练时间" width="180" />
              <el-table-column label="操作" width="150">
                <template #default="{ row }">
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click="trainModel(row)"
                    :disabled="row.status === 'training'"
                  >
                    {{ row.status === 'training' ? '训练中...' : '重新训练' }}
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>

        <!-- 资源优化建议 -->
        <div v-show="activeTab === 'resource'">
          <el-card class="resource-card">
            <template #header>
              <div class="card-header">
                <span>资源优化建议</span>
                <el-tag type="warning" size="small">基于AI分析</el-tag>
              </div>
            </template>
            <el-table :data="resourceOptimizations" style="width: 100%">
              <el-table-column prop="resource" label="资源名称" width="150" />
              <el-table-column label="当前利用率" width="200">
                <template #default="{ row }">
                  <el-progress 
                    :percentage="row.currentUsage" 
                    :color="row.currentUsage > 85 ? '#F56C6C' : '#409EFF'"
                  />
                </template>
              </el-table-column>
              <el-table-column label="优化后利用率" width="200">
                <template #default="{ row }">
                  <el-progress 
                    :percentage="row.optimizedUsage" 
                    color="#67C23A"
                  />
                </template>
              </el-table-column>
              <el-table-column prop="savings" label="预期收益" width="150" />
              <el-table-column label="优先级" width="120">
                <template #default="{ row }">
                  <el-tag :type="row.priority" size="small">
                    {{ row.priority === 'success' ? '高' : row.priority === 'info' ? '中' : '低' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120">
                <template #default="{ row }">
                  <el-button type="primary" size="small">
                    查看详情
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>

          <el-card style="margin-top: 20px;">
            <template #header>
              <div class="card-header">
                <span>成本效益分析</span>
              </div>
            </template>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="当前年运营成本">¥2,450,000</el-descriptions-item>
              <el-descriptions-item label="优化后年运营成本">¥2,102,000</el-descriptions-item>
              <el-descriptions-item label="预期年节省">¥348,000</el-descriptions-item>
              <el-descriptions-item label="投资回报率">14.2%</el-descriptions-item>
              <el-descriptions-item label="优化实施周期">3-6个月</el-descriptions-item>
              <el-descriptions-item label="风险等级">
                <el-tag type="success" size="small">低风险</el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </div>

        <!-- 风险预警管理 -->
        <div v-show="activeTab === 'risk'">
          <el-card class="risk-card">
            <template #header>
              <div class="card-header">
                <span>风险预警列表</span>
                <el-tag type="danger" size="small" v-if="totalAlerts > 0">
                  {{ totalAlerts }} 个待处理
                </el-tag>
              </div>
            </template>
            <el-timeline>
              <el-timeline-item
                v-for="alert in riskAlerts"
                :key="alert.id"
                :timestamp="alert.time"
                :type="alert.level"
                :hollow="alert.status === 'resolved'"
              >
                <el-card>
                  <div class="alert-item">
                    <div class="alert-header">
                      <div class="alert-title">
                        <el-tag :type="alert.level" size="small">
                          {{ getRiskLevelText(alert.level) }}
                        </el-tag>
                        <span>{{ alert.title }}</span>
                      </div>
                      <el-tag 
                        :type="alert.status === 'pending' ? 'warning' : 'info'" 
                        size="small"
                      >
                        {{ alert.status === 'pending' ? '待处理' : '已处理' }}
                      </el-tag>
                    </div>
                    <div class="alert-content">
                      <p>{{ alert.description }}</p>
                    </div>
                    <div class="alert-actions" v-if="alert.status === 'pending'">
                      <el-button 
                        type="primary" 
                        size="small" 
                        @click="handleRiskAlert(alert)"
                      >
                        立即处理
                      </el-button>
                      <el-button size="small">查看详情</el-button>
                    </div>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </el-card>
        </div>

        <!-- 决策报告生成 -->
        <div v-show="activeTab === 'report'">
          <el-card class="report-config-card">
            <template #header>
              <div class="card-header">
                <span>报告生成配置</span>
              </div>
            </template>
            <el-form label-width="120px">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="报告模板">
                    <el-select v-model="reportConfig.template" placeholder="请选择">
                      <el-option label="综合分析报告" value="comprehensive" />
                      <el-option label="专项分析报告" value="special" />
                      <el-option label="风险评估报告" value="risk" />
                      <el-option label="优化建议报告" value="optimization" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="导出格式">
                    <el-select v-model="reportConfig.format" placeholder="请选择">
                      <el-option label="PDF" value="pdf" />
                      <el-option label="Word" value="docx" />
                      <el-option label="Excel" value="xlsx" />
                      <el-option label="HTML" value="html" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </el-card>

          <el-card class="reports-card" style="margin-top: 20px;">
            <template #header>
              <div class="card-header">
                <span>历史决策报告</span>
              </div>
            </template>
            <el-table :data="decisionReports" style="width: 100%">
              <el-table-column prop="title" label="报告名称" width="350" />
              <el-table-column prop="date" label="生成日期" width="150" />
              <el-table-column prop="type" label="报告类型" width="150" />
              <el-table-column prop="status" label="状态" width="120">
                <template #default="{ row }">
                  <el-tag 
                    :type="row.status === '已生成' ? 'success' : 'warning'" 
                    size="small"
                  >
                    {{ row.status }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="180">
                <template #default="{ row }">
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click="exportReport(row, 'pdf')"
                    :disabled="row.status !== '已生成'"
                  >
                    下载
                  </el-button>
                  <el-button size="small" :disabled="row.status !== '已生成'">
                    预览
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </el-col>

      <!-- 右侧预警和建议面板 -->
      <el-col :span="6">
        <el-card class="alert-panel-card">
          <template #header>
            <div class="card-header">
              <span>实时预警</span>
              <el-badge :value="totalAlerts" class="badge" v-if="totalAlerts > 0" />
            </div>
          </template>
          <div class="alert-panel">
            <el-alert
              v-for="alert in riskAlerts.filter(a => a.status === 'pending')"
              :key="alert.id"
              :title="alert.title"
              :type="alert.level"
              :description="alert.description"
              :closable="false"
              style="margin-bottom: 10px;"
            />
            <el-empty 
              v-if="totalAlerts === 0" 
              description="暂无预警信息" 
              :image-size="80"
            />
          </div>
        </el-card>

        <el-card class="recommendation-panel-card" style="margin-top: 20px;">
          <template #header>
            <div class="card-header">
              <span>优先建议</span>
            </div>
          </template>
          <div class="recommendation-panel">
            <div 
              class="recommendation-item"
              v-for="suggestion in decisionSuggestions.slice(0, 3)"
              :key="suggestion.id"
            >
              <div class="recommendation-header">
                <el-tag :type="suggestion.level" size="small">
                  {{ getSuggestionType(suggestion.level) }}
                </el-tag>
              </div>
              <div class="recommendation-title">{{ suggestion.title }}</div>
              <div class="recommendation-confidence">
                置信度：{{ suggestion.confidence }}%
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="model-status-card" style="margin-top: 20px;">
          <template #header>
            <div class="card-header">
              <span>模型状态</span>
            </div>
          </template>
          <div class="model-status">
            <div 
              class="model-item"
              v-for="model in predictionModels.slice(0, 4)"
              :key="model.id"
            >
              <div class="model-name">{{ model.name }}</div>
              <div class="model-info">
                <el-tag 
                  :type="model.status === 'active' ? 'success' : 'warning'" 
                  size="small"
                >
                  {{ model.status === 'active' ? '运行中' : '训练中' }}
                </el-tag>
                <span class="model-accuracy">{{ model.accuracy.toFixed(1) }}%</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.decision-analysis-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 60px);

  .header-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

    .page-title {
      font-size: 24px;
      font-weight: bold;
      color: #303133;
      display: flex;
      align-items: center;
      gap: 10px;

      .icon {
        font-size: 28px;
      }
    }

    .actions {
      display: flex;
      gap: 10px;
    }
  }

  .nav-menu-card {
    .nav-menu {
      .nav-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px;
        margin-bottom: 8px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s;
        position: relative;

        .nav-icon {
          font-size: 18px;
        }

        &:hover {
          background: #f0f2f5;
        }

        &.active {
          background: #409EFF;
          color: white;
        }

        .badge {
          position: absolute;
          right: 10px;
        }
      }
    }
  }

  .quick-stats-card {
    .quick-stats {
      .stat-item {
        margin-bottom: 15px;

        .stat-label {
          font-size: 12px;
          color: #909399;
          margin-bottom: 5px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: bold;

          &.danger {
            color: #F56C6C;
          }

          &.success {
            color: #67C23A;
          }

          &.info {
            color: #409EFF;
          }
        }
      }
    }
  }

  .dashboard-stats-card {
    .stat-card {
      text-align: center;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      color: white;

      .stat-icon {
        font-size: 32px;
        margin-bottom: 10px;
      }

      .stat-title {
        color: rgba(255, 255, 255, 0.9);
        font-size: 14px;
      }

      .stat-trend {
        margin-top: 10px;
        font-size: 14px;
        font-weight: bold;

        &.success {
          color: #a7f3d0;
        }
      }

      :deep(.el-statistic__content) {
        color: white;
        font-size: 28px;
      }
    }
  }

  .suggestions-card {
    .suggestions-list {
      .suggestion-item {
        padding: 16px;
        background: #f9fafb;
        border-radius: 8px;
        margin-bottom: 12px;
        border-left: 4px solid #409EFF;

        .suggestion-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          .suggestion-title {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: bold;
            font-size: 15px;
          }
        }

        .suggestion-content {
          p {
            color: #606266;
            line-height: 1.6;
            margin-bottom: 12px;
          }

          .suggestion-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 13px;
            color: #909399;

            .impact {
              font-weight: 500;
            }

            .confidence {
              display: flex;
              align-items: center;
              gap: 10px;
            }
          }
        }
      }
    }
  }

  .alert-panel-card {
    .alert-panel {
      max-height: 400px;
      overflow-y: auto;
    }
  }

  .recommendation-panel-card {
    .recommendation-panel {
      .recommendation-item {
        padding: 12px;
        background: #f9fafb;
        border-radius: 6px;
        margin-bottom: 10px;

        .recommendation-header {
          margin-bottom: 8px;
        }

        .recommendation-title {
          font-weight: 500;
          margin-bottom: 6px;
          font-size: 14px;
        }

        .recommendation-confidence {
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }

  .model-status-card {
    .model-status {
      .model-item {
        padding: 10px;
        background: #f9fafb;
        border-radius: 6px;
        margin-bottom: 8px;

        .model-name {
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 6px;
        }

        .model-info {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .model-accuracy {
            font-size: 12px;
            color: #67C23A;
            font-weight: bold;
          }
        }
      }
    }
  }

  .alert-item {
    .alert-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;

      .alert-title {
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: bold;
      }
    }

    .alert-content {
      p {
        color: #606266;
        line-height: 1.6;
        margin-bottom: 10px;
      }
    }

    .alert-actions {
      display: flex;
      gap: 10px;
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
  }

  :deep(.el-statistic__content) {
    font-size: 24px;
  }

  :deep(.el-progress__text) {
    font-size: 12px !important;
  }
}
</style>