<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// 数据接口定义
interface RiskArea {
  zone: string
  level: string
  count: number
  trend: string
}

interface RiskTrend {
  date: string
  low: number
  medium: number
  high: number
  critical: number
}

// 响应式数据
const loading = ref(false)
const dateRange = ref<[Date, Date]>([
  new Date(new Date().setDate(new Date().getDate() - 30)),
  new Date()
])
const selectedZone = ref('all')
const selectedRiskType = ref('all')

// 统计数据
const totalAlerts = ref(0)
const highRiskCount = ref(0)
const improvedRate = ref(0)
const averageResponse = ref(0)

// 区域风险数据
const riskAreas = ref<RiskArea[]>([])

// 风险趋势数据
const riskTrends = ref<RiskTrend[]>([])

// 薄弱环节数据
const weakPoints = ref<any[]>([])

// 选项数据
const zones = [
  { label: '全部区域', value: 'all' },
  { label: 'A区仓储', value: 'A' },
  { label: 'B区仓储', value: 'B' },
  { label: 'C区仓储', value: 'C' },
  { label: 'D区仓储', value: 'D' }
]

const riskTypes = [
  { label: '全部类型', value: 'all' },
  { label: '火灾风险', value: 'fire' },
  { label: '人员安全', value: 'personnel' },
  { label: '设备异常', value: 'equipment' },
  { label: '环境隐患', value: 'environment' }
]

// 获取风险等级颜色
const getRiskColor = (level: string) => {
  const colors: Record<string, string> = {
    '低': '#67C23A',
    '中': '#E6A23C',
    '高': '#F56C6C',
    '极高': '#F56C6C'
  }
  return colors[level] || '#909399'
}

// 获取趋势颜色
const getTrendColor = (trend: string) => {
  const colors: Record<string, string> = {
    '上升': '#F56C6C',
    '下降': '#67C23A',
    '平稳': '#409EFF',
    '波动': '#E6A23C'
  }
  return colors[trend] || '#909399'
}

// 获取趋势图标
const getTrendIcon = (trend: string) => {
  const icons: Record<string, string> = {
    '上升': '↑',
    '下降': '↓',
    '平稳': '→',
    '波动': '~'
  }
  return icons[trend] || '-'
}

// 加载数据
const loadData = async () => {
  loading.value = true
  
  // 模拟异步加载
  await new Promise(resolve => setTimeout(resolve, 800))
  
  // Mock 统计数据
  totalAlerts.value = 1247
  highRiskCount.value = 89
  improvedRate.value = 23.5
  averageResponse.value = 12.3
  
  // Mock 区域风险数据
  riskAreas.value = [
    { zone: 'A区仓储', level: '高', count: 45, trend: '上升' },
    { zone: 'B区仓储', level: '中', count: 23, trend: '下降' },
    { zone: 'C区仓储', level: '低', count: 12, trend: '平稳' },
    { zone: 'D区仓储', level: '极高', count: 67, trend: '波动' },
    { zone: 'E区仓储', level: '中', count: 34, trend: '下降' }
  ]
  
  // Mock 风险趋势数据
  const dates = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    dates.push(date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }))
  }
  
  riskTrends.value = dates.map(date => ({
    date,
    low: Math.floor(Math.random() * 20) + 10,
    medium: Math.floor(Math.random() * 15) + 5,
    high: Math.floor(Math.random() * 10) + 2,
    critical: Math.floor(Math.random() * 5) + 1
  }))
  
  // Mock 薄弱环节数据
  weakPoints.value = [
    {
      issue: '消防设备检查不及时',
      zone: 'D区仓储',
      frequency: 15,
      impact: '高',
      suggestion: '建立定期巡检制度，增加检查频次'
    },
    {
      issue: '人员违规操作',
      zone: 'A区仓储',
      frequency: 12,
      impact: '极高',
      suggestion: '加强安全培训，实施严格考核'
    },
    {
      issue: '环境温湿度异常',
      zone: 'B区仓储',
      frequency: 8,
      impact: '中',
      suggestion: '优化通风系统，增加监测点位'
    },
    {
      issue: '设备老化预警',
      zone: 'C区仓储',
      frequency: 6,
      impact: '高',
      suggestion: '制定设备更换计划，加强维护'
    }
  ]
  
  loading.value = false
}

// 查询数据
const handleQuery = () => {
  loadData()
}

// 重置筛选
const handleReset = () => {
  dateRange.value = [
    new Date(new Date().setDate(new Date().getDate() - 30)),
    new Date()
  ]
  selectedZone.value = 'all'
  selectedRiskType.value = 'all'
  loadData()
}

// 生成报告
const generateReport = () => {
  ElMessage.success('报告生成成功！')
}

// 导出数据
const exportData = () => {
  ElMessage.success('数据导出成功！')
}

// 初始化
onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="data-analysis-report">
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-cards">
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="总告警数" :value="totalAlerts">
            <template #suffix>
              <span style="font-size: 14px; color: #909399;">次</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="高风险事件" :value="highRiskCount">
            <template #suffix>
              <span style="font-size: 14px; color: #f56c6c;">次</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="改善率" :value="improvedRate" :precision="1">
            <template #suffix>
              <span style="font-size: 14px; color: #67c23a;">%</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="平均响应时间" :value="averageResponse" :precision="1">
            <template #suffix>
              <span style="font-size: 14px; color: #409eff;">分钟</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- 主内容区 -->
    <el-row :gutter="16" class="main-content">
      <!-- 左侧筛选区 -->
      <el-col :span="5">
        <el-card shadow="hover" header="分析维度">
          <div class="filter-section">
            <div class="filter-item">
              <label>时间范围</label>
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                size="default"
                style="width: 100%"
              />
            </div>
            
            <div class="filter-item">
              <label>选择区域</label>
              <el-select v-model="selectedZone" placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="zone in zones"
                  :key="zone.value"
                  :label="zone.label"
                  :value="zone.value"
                />
              </el-select>
            </div>
            
            <div class="filter-item">
              <label>风险类型</label>
              <el-select v-model="selectedRiskType" placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="type in riskTypes"
                  :key="type.value"
                  :label="type.label"
                  :value="type.value"
                />
              </el-select>
            </div>
            
            <div class="filter-actions">
              <el-button type="primary" @click="handleQuery" :loading="loading" style="width: 100%">
                查询分析
              </el-button>
              <el-button @click="handleReset" style="width: 100%; margin-top: 8px; margin-left: 0">
                重置
              </el-button>
            </div>
          </div>
        </el-card>

        <!-- 快速操作 -->
        <el-card shadow="hover" header="快速操作" style="margin-top: 16px">
          <el-button type="success" @click="generateReport" style="width: 100%">
            生成报告
          </el-button>
          <el-button type="warning" @click="exportData" style="width: 100%; margin-top: 8px; margin-left: 0">
            导出数据
          </el-button>
        </el-card>
      </el-col>

      <!-- 中间图表区 -->
      <el-col :span="10">
        <!-- 区域风险热力 -->
        <el-card shadow="hover" header="区域风险分布" v-loading="loading">
          <div class="heat-map">
            <div
              v-for="area in riskAreas"
              :key="area.zone"
              class="heat-item"
              :style="{ borderLeftColor: getRiskColor(area.level) }"
            >
              <div class="heat-header">
                <span class="zone-name">{{ area.zone }}</span>
                <el-tag :type="area.level === '极高' || area.level === '高' ? 'danger' : area.level === '中' ? 'warning' : 'success'" size="small">
                  {{ area.level }}风险
                </el-tag>
              </div>
              <div class="heat-content">
                <div class="count">
                  <span class="label">告警次数：</span>
                  <span class="value">{{ area.count }}</span>
                </div>
                <div class="trend">
                  <span class="label">趋势：</span>
                  <span class="value" :style="{ color: getTrendColor(area.trend) }">
                    {{ getTrendIcon(area.trend) }} {{ area.trend }}
                  </span>
                </div>
              </div>
              <el-progress
                :percentage="(area.count / totalAlerts) * 100"
                :color="getRiskColor(area.level)"
                :show-text="false"
              />
            </div>
          </div>
        </el-card>

        <!-- 风险趋势 -->
        <el-card shadow="hover" header="风险趋势分析" style="margin-top: 16px" v-loading="loading">
          <div class="trend-chart">
            <div class="chart-legend">
              <span class="legend-item"><i style="background: #67C23A"></i>低风险</span>
              <span class="legend-item"><i style="background: #E6A23C"></i>中风险</span>
              <span class="legend-item"><i style="background: #F56C6C"></i>高风险</span>
              <span class="legend-item"><i style="background: #F56C6C"></i>极高风险</span>
            </div>
            <div class="trend-bars">
              <div v-for="trend in riskTrends" :key="trend.date" class="trend-bar-item">
                <div class="bar-container">
                  <div class="bar-stack">
                    <div class="bar low" :style="{ height: trend.low * 3 + 'px' }" :title="`低风险: ${trend.low}`"></div>
                    <div class="bar medium" :style="{ height: trend.medium * 3 + 'px' }" :title="`中风险: ${trend.medium}`"></div>
                    <div class="bar high" :style="{ height: trend.high * 3 + 'px' }" :title="`高风险: ${trend.high}`"></div>
                    <div class="bar critical" :style="{ height: trend.critical * 3 + 'px' }" :title="`极高风险: ${trend.critical}`"></div>
                  </div>
                </div>
                <div class="bar-label">{{ trend.date }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧详细数据 -->
      <el-col :span="9">
        <!-- 薄弱环节识别 -->
        <el-card shadow="hover" header="薄弱环节识别" v-loading="loading">
          <el-table :data="weakPoints" style="width: 100%" size="small" max-height="300">
            <el-table-column prop="issue" label="问题" width="140" show-overflow-tooltip />
            <el-table-column prop="zone" label="区域" width="80" />
            <el-table-column prop="frequency" label="频次" width="60" align="center" />
            <el-table-column prop="impact" label="影响" width="60" align="center">
              <template #default="{ row }">
                <el-tag :type="row.impact === '极高' || row.impact === '高' ? 'danger' : 'warning'" size="small">
                  {{ row.impact }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 改善建议 -->
        <el-card shadow="hover" header="改善建议" style="margin-top: 16px" v-loading="loading">
          <div class="suggestions">
            <el-alert
              v-for="(point, index) in weakPoints"
              :key="index"
              :title="point.issue"
              :description="point.suggestion"
              :type="point.impact === '极高' || point.impact === '高' ? 'error' : 'warning'"
              show-icon
              :closable="false"
              style="margin-bottom: 12px"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.data-analysis-report {
  padding: 16px;
  background: #f5f7fa;
  min-height: calc(100vh - 120px);

  .stats-cards {
    margin-bottom: 16px;
  }

  .main-content {
    .filter-section {
      .filter-item {
        margin-bottom: 20px;

        label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          color: #606266;
          font-weight: 500;
        }
      }

      .filter-actions {
        margin-top: 24px;
      }
    }

    // 热力图样式
    .heat-map {
      .heat-item {
        border-left: 4px solid;
        padding: 12px;
        margin-bottom: 12px;
        background: #f9fafc;
        border-radius: 4px;
        transition: all 0.3s;

        &:hover {
          background: #f0f2f5;
          transform: translateX(4px);
        }

        .heat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;

          .zone-name {
            font-weight: 600;
            color: #303133;
          }
        }

        .heat-content {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;

          .label {
            color: #909399;
          }

          .value {
            font-weight: 600;
            color: #303133;
          }
        }
      }
    }

    // 趋势图样式
    .trend-chart {
      .chart-legend {
        display: flex;
        justify-content: center;
        gap: 20px;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 1px solid #ebeef5;

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #606266;

          i {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 2px;
          }
        }
      }

      .trend-bars {
        display: flex;
        justify-content: space-around;
        align-items: flex-end;
        height: 180px;
        padding: 0 10px;

        .trend-bar-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;

          .bar-container {
            flex: 1;
            display: flex;
            align-items: flex-end;
            width: 100%;
            padding: 0 8px;

            .bar-stack {
              width: 100%;
              display: flex;
              flex-direction: column-reverse;
              align-items: center;
              gap: 2px;

              .bar {
                width: 100%;
                border-radius: 2px;
                transition: all 0.3s;
                cursor: pointer;

                &:hover {
                  opacity: 0.8;
                }

                &.low {
                  background: #67C23A;
                }

                &.medium {
                  background: #E6A23C;
                }

                &.high {
                  background: #F56C6C;
                }

                &.critical {
                  background: #F56C6C;
                }
              }
            }
          }

          .bar-label {
            font-size: 12px;
            color: #909399;
            white-space: nowrap;
          }
        }
      }
    }

    // 建议列表样式
    .suggestions {
      max-height: 400px;
      overflow-y: auto;

      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-thumb {
        background: #dcdfe6;
        border-radius: 3px;
      }
    }
  }
}
</style>