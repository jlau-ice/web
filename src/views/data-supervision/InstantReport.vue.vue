<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'

// 系统状态类型
type SystemStatus = 'healthy' | 'good' | 'warning' | 'error'

// 关键指标数据
const keyMetrics = ref({
  cpuUsage: 0,
  memoryUsage: 0,
  taskCompletion: 0,
  systemScore: 0,
  status: 'healthy' as SystemStatus
})

// 瓶颈分析数据
const bottlenecks = ref([
  { id: 1, name: 'CPU 资源紧张', severity: 'high', impact: '85%', suggestion: '建议增加2核CPU或优化算法' },
  { id: 2, name: '内存占用偏高', severity: 'medium', impact: '60%', suggestion: '建议释放缓存或增加4GB内存' },
  { id: 3, name: '磁盘I/O延迟', severity: 'low', impact: '30%', suggestion: '建议使用SSD或优化读写策略' }
])

// 优化建议数据
const optimizations = ref([
  { id: 1, title: '扩展CPU资源', priority: 'high', effect: '性能提升30%', cost: '中等' },
  { id: 2, title: '优化内存分配', priority: 'medium', effect: '内存利用率提升20%', cost: '低' },
  { id: 3, title: '调整任务调度策略', priority: 'medium', effect: '任务完成率提升15%', cost: '低' },
  { id: 4, title: '启用智能缓存', priority: 'low', effect: '响应速度提升10%', cost: '低' }
])

// 报告类型
const reportType = ref('daily')
const reportLoading = ref(false)

// 自动刷新定时器
let refreshTimer: number | null = null

// 获取系统状态颜色
const getStatusColor = (status: SystemStatus) => {
  const colors = {
    healthy: '#67C23A',
    good: '#409EFF', 
    warning: '#E6A23C',
    error: '#F56C6C'
  }
  return colors[status]
}

// 获取系统状态文本
const getStatusText = (status: SystemStatus) => {
  const texts = {
    healthy: '健康',
    good: '良好',
    warning: '关注',
    error: '异常'
  }
  return texts[status]
}

// 获取优先级类型
const getPriorityType = (priority: string) => {
  const types: Record<string, any> = {
    high: 'danger',
    medium: 'warning',
    low: 'info'
  }
  return types[priority]
}

// 获取优先级文本
const getPriorityText = (priority: string) => {
  const texts: Record<string, string> = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return texts[priority]
}

// 获取严重程度类型
const getSeverityType = (severity: string) => {
  const types: Record<string, any> = {
    high: 'danger',
    medium: 'warning',
    low: 'info'
  }
  return types[severity]
}

// 模拟加载系统数据
const loadSystemData = () => {
  setTimeout(() => {
    const cpu = Math.floor(Math.random() * 30) + 50
    const memory = Math.floor(Math.random() * 25) + 60
    const task = Math.floor(Math.random() * 15) + 80
    
    keyMetrics.value = {
      cpuUsage: cpu,
      memoryUsage: memory,
      taskCompletion: task,
      systemScore: Math.floor((100 - cpu * 0.3 - memory * 0.3 + task * 0.4)),
      status: cpu > 80 || memory > 85 ? 'error' : 
              cpu > 70 || memory > 75 ? 'warning' : 
              cpu > 60 || memory > 65 ? 'good' : 'healthy'
    }
  }, 300)
}

// 刷新数据
const handleRefresh = () => {
  ElMessage.success('数据已刷新')
  loadSystemData()
}

// 生成报告
const generateReport = () => {
  reportLoading.value = true
  setTimeout(() => {
    reportLoading.value = false
    ElMessage.success(`${reportType.value === 'daily' ? '日报' : '周报'}生成成功！`)
  }, 1500)
}

// 应用优化建议
const applyOptimization = (item: any) => {
  ElMessage.success(`已应用优化方案：${item.title}`)
}

// 启动自动刷新
const startAutoRefresh = () => {
  refreshTimer = window.setInterval(() => {
    loadSystemData()
  }, 10000) // 每10秒刷新一次
}

// 停止自动刷新
const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

onMounted(() => {
  loadSystemData()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<template>
  <div class="instant-report">
    <!-- 顶部标题栏 -->
    <div class="header-section">
      <h2>决策支持仪表盘</h2>
      <el-button type="primary" @click="handleRefresh" icon="Refresh">刷新数据</el-button>
    </div>

    <!-- 关键指标概览 -->
    <el-row :gutter="20" class="metrics-section">
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="CPU 使用率" :value="keyMetrics.cpuUsage" suffix="%">
            <template #prefix>
              <el-icon color="#409EFF"><Monitor /></el-icon>
            </template>
          </el-statistic>
          <el-progress :percentage="keyMetrics.cpuUsage" :color="keyMetrics.cpuUsage > 80 ? '#F56C6C' : '#409EFF'" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="内存使用率" :value="keyMetrics.memoryUsage" suffix="%">
            <template #prefix>
              <el-icon color="#67C23A"><Cpu /></el-icon>
            </template>
          </el-statistic>
          <el-progress :percentage="keyMetrics.memoryUsage" :color="keyMetrics.memoryUsage > 85 ? '#F56C6C' : '#67C23A'" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="任务完成率" :value="keyMetrics.taskCompletion" suffix="%">
            <template #prefix>
              <el-icon color="#E6A23C"><Finished /></el-icon>
            </template>
          </el-statistic>
          <el-progress :percentage="keyMetrics.taskCompletion" :color="keyMetrics.taskCompletion > 90 ? '#67C23A' : '#E6A23C'" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="status-card">
          <div class="system-status">
            <div class="status-badge" :style="{ backgroundColor: getStatusColor(keyMetrics.status) }"></div>
            <div class="status-info">
              <div class="status-label">系统状态</div>
              <div class="status-text">{{ getStatusText(keyMetrics.status) }}</div>
            </div>
          </div>
          <el-statistic title="综合评分" :value="keyMetrics.systemScore" class="score-metric">
            <template #suffix>
              <span style="font-size: 16px;">/ 100</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- 中间分析区 -->
    <el-row :gutter="20" class="analysis-section">
      <!-- 瓶颈分析 -->
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>瓶颈分析视图</span>
              <el-tag type="warning" size="small">{{ bottlenecks.length }} 个瓶颈</el-tag>
            </div>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="item in bottlenecks"
              :key="item.id"
              :type="getSeverityType(item.severity)"
              :hollow="true"
            >
              <div class="bottleneck-item">
                <div class="bottleneck-header">
                  <strong>{{ item.name }}</strong>
                  <el-tag :type="getSeverityType(item.severity)" size="small">
                    影响 {{ item.impact }}
                  </el-tag>
                </div>
                <div class="bottleneck-suggestion">
                  <el-icon><Lamp /></el-icon>
                  {{ item.suggestion }}
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>

      <!-- 资源优化建议 -->
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>资源优化建议</span>
              <el-tag type="success" size="small">{{ optimizations.length }} 条建议</el-tag>
            </div>
          </template>
          <div class="optimization-list">
            <div
              v-for="item in optimizations"
              :key="item.id"
              class="optimization-item"
            >
              <div class="optimization-header">
                <div class="optimization-title">
                  <el-tag :type="getPriorityType(item.priority)" size="small">
                    {{ getPriorityText(item.priority) }}
                  </el-tag>
                  <span>{{ item.title }}</span>
                </div>
                <el-button size="small" type="primary" link @click="applyOptimization(item)">
                  应用
                </el-button>
              </div>
              <el-descriptions :column="2" size="small" class="optimization-desc">
                <el-descriptions-item label="预期效果">{{ item.effect }}</el-descriptions-item>
                <el-descriptions-item label="实施成本">{{ item.cost }}</el-descriptions-item>
              </el-descriptions>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 底部报告生成区 -->
    <el-row :gutter="20" class="report-section">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>即时报告生成</span>
            </div>
          </template>
          <div class="report-generator">
            <el-alert
              title="智能报告"
              type="info"
              description="系统将根据当前运行数据自动生成标准化报告，包含关键指标、瓶颈分析及优化建议。"
              :closable="false"
              show-icon
            />
            <div class="report-controls">
              <el-radio-group v-model="reportType">
                <el-radio label="daily">日报</el-radio>
                <el-radio label="weekly">周报</el-radio>
              </el-radio-group>
              <div class="report-buttons">
                <el-button type="primary" @click="generateReport" :loading="reportLoading">
                  生成报告
                </el-button>
                <el-button icon="Download">导出报告</el-button>
                <el-button icon="Share">分享报告</el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.instant-report {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;

  .header-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 {
      margin: 0;
      color: #303133;
      font-size: 24px;
    }
  }

  .metrics-section {
    margin-bottom: 20px;

    .el-card {
      border-radius: 8px;

      :deep(.el-statistic) {
        margin-bottom: 10px;

        .el-statistic__head {
          font-size: 14px;
          color: #909399;
        }

        .el-statistic__content {
          font-size: 28px;
          font-weight: bold;
        }
      }
    }

    .status-card {
      .system-status {
        display: flex;
        align-items: center;
        margin-bottom: 16px;

        .status-badge {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-right: 12px;
          animation: pulse 2s infinite;
        }

        .status-info {
          .status-label {
            font-size: 14px;
            color: #909399;
            margin-bottom: 4px;
          }

          .status-text {
            font-size: 20px;
            font-weight: bold;
            color: #303133;
          }
        }
      }

      .score-metric {
        :deep(.el-statistic__content) {
          font-size: 32px;
          color: #409EFF;
        }
      }
    }
  }

  .analysis-section {
    margin-bottom: 20px;

    .el-card {
      border-radius: 8px;
      height: 100%;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: bold;
      }
    }

    .bottleneck-item {
      .bottleneck-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .bottleneck-suggestion {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #606266;
        font-size: 14px;
        padding: 8px;
        background: #f5f7fa;
        border-radius: 4px;
      }
    }

    .optimization-list {
      .optimization-item {
        padding: 12px;
        margin-bottom: 12px;
        background: #f5f7fa;
        border-radius: 6px;
        transition: all 0.3s;

        &:hover {
          background: #e8edf3;
          transform: translateX(4px);
        }

        &:last-child {
          margin-bottom: 0;
        }

        .optimization-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;

          .optimization-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 500;
          }
        }

        .optimization-desc {
          :deep(.el-descriptions__label) {
            width: 80px;
          }
        }
      }
    }
  }

  .report-section {
    .el-card {
      border-radius: 8px;

      .card-header {
        font-weight: bold;
      }
    }

    .report-generator {
      .el-alert {
        margin-bottom: 20px;
      }

      .report-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .report-buttons {
          display: flex;
          gap: 10px;
        }
      }
    }
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>