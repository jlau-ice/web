<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'

// 预警级别类型
type AlertLevel = 'urgent' | 'important' | 'normal' | 'info'
type AlertStatus = 'pending' | 'processing' | 'resolved' | 'closed'

interface Alert {
  id: string
  title: string
  type: string
  level: AlertLevel
  status: AlertStatus
  triggerTime: string
  scope: string
  description: string
  handler?: string
}

interface Rule {
  id: string
  name: string
  threshold: string
  enabled: boolean
}

interface Timeline {
  time: string
  action: string
  user: string
}

// 状态数据
const loading = ref(true)
const alerts = ref<Alert[]>([])
const rules = ref<Rule[]>([])
const selectedAlert = ref<Alert | null>(null)
const timeline = ref<Timeline[]>([])
const searchText = ref('')
const levelFilter = ref<AlertLevel | ''>('')

// 统计数据
const stats = computed(() => {
  return {
    total: alerts.value.length,
    urgent: alerts.value.filter(a => a.level === 'urgent').length,
    processing: alerts.value.filter(a => a.status === 'processing').length,
    pending: alerts.value.filter(a => a.status === 'pending').length
  }
})

// 过滤后的预警列表
const filteredAlerts = computed(() => {
  return alerts.value.filter(alert => {
    const matchSearch = !searchText.value || 
      alert.title.includes(searchText.value) || 
      alert.type.includes(searchText.value)
    const matchLevel = !levelFilter.value || alert.level === levelFilter.value
    return matchSearch && matchLevel
  })
})

// 预警级别配置
const levelConfig = {
  urgent: { label: '紧急', color: '#F56C6C' },
  important: { label: '重要', color: '#E6A23C' },
  normal: { label: '一般', color: '#F7BA2A' },
  info: { label: '提示', color: '#409EFF' }
}

// 状态配置
const statusConfig = {
  pending: { label: '待处理', type: 'danger' as const },
  processing: { label: '处理中', type: 'primary' as const },
  resolved: { label: '已解决', type: 'success' as const },
  closed: { label: '已关闭', type: 'info' as const }
}

// Mock 数据加载
const loadData = () => {
  setTimeout(() => {
    // Mock 预警数据
    alerts.value = [
      {
        id: 'A001',
        title: '数据采集任务超时',
        type: '任务超时',
        level: 'urgent',
        status: 'pending',
        triggerTime: '2025-10-30 14:32:15',
        scope: '用户行为分析任务组',
        description: '任务执行时间超过预设阈值30分钟，可能存在数据源连接问题'
      },
      {
        id: 'A002',
        title: 'CPU使用率异常',
        type: '资源异常',
        level: 'important',
        status: 'processing',
        triggerTime: '2025-10-30 14:15:08',
        scope: '计算节点Node-03',
        description: 'CPU使用率持续超过85%达10分钟',
        handler: '张三'
      },
      {
        id: 'A003',
        title: '数据质量检测失败',
        type: '质量异常',
        level: 'normal',
        status: 'resolved',
        triggerTime: '2025-10-30 13:45:22',
        scope: '订单数据表',
        description: '检测到500条记录存在字段缺失',
        handler: '李四'
      },
      {
        id: 'A004',
        title: '存储空间预警',
        type: '资源异常',
        level: 'info',
        status: 'closed',
        triggerTime: '2025-10-30 12:20:30',
        scope: '数据仓库分区03',
        description: '存储使用率达到75%',
        handler: '王五'
      },
      {
        id: 'A005',
        title: '实时流处理延迟',
        type: '性能异常',
        level: 'important',
        status: 'pending',
        triggerTime: '2025-10-30 14:28:45',
        scope: '实时数据流管道',
        description: '数据处理延迟超过5秒'
      }
    ]

    // Mock 规则数据
    rules.value = [
      { id: 'R001', name: '任务执行超时', threshold: '> 30分钟', enabled: true },
      { id: 'R002', name: 'CPU使用率', threshold: '> 85%', enabled: true },
      { id: 'R003', name: '内存使用率', threshold: '> 90%', enabled: true },
      { id: 'R004', name: '数据质量检查', threshold: '错误率 > 5%', enabled: false }
    ]

    loading.value = false
  }, 500)
}

// 查看预警详情
const viewAlert = (alert: Alert) => {
  selectedAlert.value = alert
  
  // Mock 时间线数据
  timeline.value = [
    {
      time: alert.triggerTime,
      action: '预警触发',
      user: '系统'
    }
  ]
  
  if (alert.status === 'processing' || alert.status === 'resolved' || alert.status === 'closed') {
    timeline.value.push({
      time: '2025-10-30 14:35:20',
      action: '开始处理',
      user: alert.handler || '未分配'
    })
  }
  
  if (alert.status === 'resolved' || alert.status === 'closed') {
    timeline.value.push({
      time: '2025-10-30 14:50:15',
      action: '问题解决',
      user: alert.handler || '未分配'
    })
  }
  
  if (alert.status === 'closed') {
    timeline.value.push({
      time: '2025-10-30 15:00:00',
      action: '预警关闭',
      user: '管理员'
    })
  }
}

// 切换规则状态
const toggleRule = (rule: Rule) => {
  rule.enabled = !rule.enabled
  ElMessage.success(`规则"${rule.name}"已${rule.enabled ? '启用' : '禁用'}`)
}

// 处理预警
const handleAlert = (alert: Alert) => {
  if (alert.status === 'pending') {
    alert.status = 'processing'
    alert.handler = '当前用户'
    ElMessage.success('已开始处理该预警')
    viewAlert(alert)
  } else if (alert.status === 'processing') {
    alert.status = 'resolved'
    ElMessage.success('预警已标记为已解决')
    viewAlert(alert)
  }
}

// 关闭预警
const closeAlert = (alert: Alert) => {
  if (alert.status === 'resolved') {
    alert.status = 'closed'
    ElMessage.success('预警已关闭')
    selectedAlert.value = null
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="anomaly-alert-container">
    <!-- 顶部统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="总预警数" :value="stats.total">
            <template #suffix>条</template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="紧急预警" :value="stats.urgent">
            <template #suffix>条</template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="处理中" :value="stats.processing">
            <template #suffix>条</template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="待处理" :value="stats.pending">
            <template #suffix>条</template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- 主内容区 -->
    <el-row :gutter="16" class="main-content">
      <!-- 左侧：规则管理 -->
      <el-col :span="5">
        <el-card shadow="hover" class="full-height">
          <template #header>
            <div class="card-header">
              <span>检测规则</span>
            </div>
          </template>
          <div v-loading="loading" class="rules-list">
            <div v-for="rule in rules" :key="rule.id" class="rule-item">
              <div class="rule-info">
                <div class="rule-name">{{ rule.name }}</div>
                <div class="rule-threshold">{{ rule.threshold }}</div>
              </div>
              <el-switch 
                v-model="rule.enabled" 
                @change="toggleRule(rule)"
                size="small"
              />
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 中间：预警列表 -->
      <el-col :span="12">
        <el-card shadow="hover" class="full-height">
          <template #header>
            <div class="card-header">
              <span>实时预警看板</span>
            </div>
          </template>
          
          <!-- 筛选栏 -->
          <div class="filter-bar">
            <el-input 
              v-model="searchText" 
              placeholder="搜索预警标题或类型" 
              style="width: 250px"
              clearable
            />
            <el-select 
              v-model="levelFilter" 
              placeholder="筛选级别" 
              style="width: 150px; margin-left: 10px"
              clearable
            >
              <el-option label="紧急" value="urgent" />
              <el-option label="重要" value="important" />
              <el-option label="一般" value="normal" />
              <el-option label="提示" value="info" />
            </el-select>
          </div>

          <!-- 预警表格 -->
          <el-table 
            :data="filteredAlerts" 
            v-loading="loading"
            stripe
            highlight-current-row
            @row-click="viewAlert"
            style="margin-top: 16px"
            max-height="550"
          >
            <el-table-column prop="id" label="编号" width="80" />
            <el-table-column prop="title" label="预警标题" min-width="140" />
            <el-table-column label="级别" width="80">
              <template #default="{ row }">
                <el-tag :color="levelConfig[row.level].color" effect="dark" size="small">
                  {{ levelConfig[row.level].label }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="type" label="类型" width="100" />
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="statusConfig[row.status].type" size="small">
                  {{ statusConfig[row.status].label }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="triggerTime" label="触发时间" width="150" />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button 
                  v-if="row.status === 'pending' || row.status === 'processing'"
                  type="primary" 
                  size="small" 
                  @click.stop="handleAlert(row)"
                  link
                >
                  {{ row.status === 'pending' ? '处理' : '解决' }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 右侧：处置跟踪 -->
      <el-col :span="7">
        <el-card shadow="hover" class="full-height">
          <template #header>
            <div class="card-header">
              <span>处置跟踪</span>
            </div>
          </template>
          
          <div v-if="selectedAlert" class="tracking-content">
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="预警编号">
                {{ selectedAlert.id }}
              </el-descriptions-item>
              <el-descriptions-item label="预警标题">
                {{ selectedAlert.title }}
              </el-descriptions-item>
              <el-descriptions-item label="影响范围">
                {{ selectedAlert.scope }}
              </el-descriptions-item>
              <el-descriptions-item label="描述信息">
                {{ selectedAlert.description }}
              </el-descriptions-item>
              <el-descriptions-item label="处理人">
                {{ selectedAlert.handler || '未分配' }}
              </el-descriptions-item>
            </el-descriptions>

            <div class="timeline-section">
              <h4>处置时间线</h4>
              <el-timeline>
                <el-timeline-item 
                  v-for="(item, index) in timeline" 
                  :key="index"
                  :timestamp="item.time"
                  placement="top"
                >
                  <div class="timeline-item-content">
                    <div>{{ item.action }}</div>
                    <div class="timeline-user">操作人: {{ item.user }}</div>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </div>

            <div class="action-buttons" v-if="selectedAlert.status !== 'closed'">
              <el-button 
                v-if="selectedAlert.status === 'pending'"
                type="primary" 
                @click="handleAlert(selectedAlert)"
                size="small"
              >
                开始处理
              </el-button>
              <el-button 
                v-if="selectedAlert.status === 'processing'"
                type="success" 
                @click="handleAlert(selectedAlert)"
                size="small"
              >
                标记已解决
              </el-button>
              <el-button 
                v-if="selectedAlert.status === 'resolved'"
                type="info" 
                @click="closeAlert(selectedAlert)"
                size="small"
              >
                关闭预警
              </el-button>
            </div>
          </div>
          
          <el-empty 
            v-else 
            description="点击预警记录查看详情" 
            :image-size="120"
          />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.anomaly-alert-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.stats-row {
  margin-bottom: 16px;
}

.main-content {
  .full-height {
    height: 650px;
    
    :deep(.el-card__body) {
      height: calc(100% - 56px);
      overflow-y: auto;
    }
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

// 规则列表样式
.rules-list {
  .rule-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    margin-bottom: 8px;
    background: #f8f9fa;
    border-radius: 4px;
    transition: all 0.3s;

    &:hover {
      background: #e9ecef;
    }

    .rule-info {
      flex: 1;

      .rule-name {
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 4px;
      }

      .rule-threshold {
        font-size: 12px;
        color: #909399;
      }
    }
  }
}

// 筛选栏
.filter-bar {
  display: flex;
  align-items: center;
}

// 跟踪面板
.tracking-content {
  .timeline-section {
    margin-top: 20px;

    h4 {
      margin-bottom: 12px;
      font-size: 14px;
      color: #303133;
    }

    .timeline-item-content {
      .timeline-user {
        font-size: 12px;
        color: #909399;
        margin-top: 4px;
      }
    }
  }

  .action-buttons {
    margin-top: 20px;
    display: flex;
    gap: 8px;
    justify-content: center;
  }
}
</style>