<template>
  <div class="data-analysis-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>高性能数据分析与支撑</h2>
      <p class="subtitle">基于高可用数据湖架构，提供秒级响应的数据查询和复杂计算能力</p>
    </div>

    <!-- 实时数据看板 -->
    <section class="dashboard-section">
      <h3 class="section-title">
        <el-icon><DataAnalysis /></el-icon>
        实时数据看板
      </h3>
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6" v-for="metric in keyMetrics" :key="metric.id">
          <el-card class="metric-card" :class="`metric-${metric.status}`">
            <template #header>
              <div class="card-header">
                <span>{{ metric.title }}</span>
                <el-tag :type="getStatusType(metric.status)" size="small">{{ metric.statusText }}</el-tag>
              </div>
            </template>
            <el-statistic :value="metric.value" :precision="metric.precision || 0">
              <template #suffix>{{ metric.unit }}</template>
            </el-statistic>
            <div class="metric-trend">
              <span :class="metric.trend > 0 ? 'trend-up' : 'trend-down'">
                {{ metric.trend > 0 ? '↑' : '↓' }} {{ Math.abs(metric.trend) }}%
              </span>
              <span class="trend-label">较昨日</span>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </section>

    <!-- 高速查询界面 -->
    <section class="query-section">
      <h3 class="section-title">
        <el-icon><Search /></el-icon>
        高速查询界面
      </h3>
      <el-card>
        <el-tabs v-model="activeQueryTab" @tab-change="handleQueryTabChange">
          <el-tab-pane label="自然语言查询" name="natural">
            <el-input
              v-model="naturalQuery"
              type="textarea"
              :rows="3"
              placeholder="请用自然语言描述您的查询需求，例如：查询本月销售额前十的园区"
              @keyup.ctrl.enter="executeQuery('natural')"
            />
            <div class="query-actions">
              <el-button type="primary" @click="executeQuery('natural')" :loading="queryLoading">
                <el-icon><Search /></el-icon>
                执行查询
              </el-button>
              <el-button @click="clearQuery">清空</el-button>
              <el-button @click="showQueryHistory">查询历史</el-button>
            </div>
          </el-tab-pane>
          <el-tab-pane label="SQL查询" name="sql">
            <el-input
              v-model="sqlQuery"
              type="textarea"
              :rows="5"
              placeholder="请输入SQL查询语句..."
              class="sql-editor"
              @keyup.ctrl.enter="executeQuery('sql')"
            />
            <div class="query-actions">
              <el-button type="primary" @click="executeQuery('sql')" :loading="queryLoading">
                <el-icon><Search /></el-icon>
                执行查询
              </el-button>
              <el-button @click="clearQuery">清空</el-button>
              <el-button @click="formatSql">格式化</el-button>
            </div>
          </el-tab-pane>
        </el-tabs>

        <!-- 查询执行进度 -->
        <div v-if="queryLoading" class="query-progress">
          <el-progress :percentage="queryProgress" :status="queryProgress === 100 ? 'success' : undefined">
            <template #default="{ percentage }">
              <span class="percentage-value">{{ percentage }}%</span>
            </template>
          </el-progress>
          <div class="progress-info">
            <span>预计剩余时间: {{ estimatedTime }}s</span>
            <span>已处理: {{ processedRows }} 行</span>
          </div>
        </div>

        <!-- 查询结果 -->
        <div v-if="queryResult" class="query-result">
          <div class="result-header">
            <el-alert
              :title="`查询完成：共返回 ${queryResult.total} 条记录，耗时 ${queryResult.duration}ms`"
              type="success"
              :closable="false"
            />
            <div class="result-actions">
              <el-button size="small" @click="exportResult('csv')">导出CSV</el-button>
              <el-button size="small" @click="exportResult('excel')">导出Excel</el-button>
              <el-button size="small" @click="visualizeResult">可视化</el-button>
            </div>
          </div>
          <el-table :data="queryResult.data" border stripe max-height="400">
            <el-table-column
              v-for="column in queryResult.columns"
              :key="column.prop"
              :prop="column.prop"
              :label="column.label"
              :width="column.width"
            />
          </el-table>
        </div>

        <!-- 查询历史 -->
        <div v-if="showHistory" class="query-history">
          <h4>查询历史</h4>
          <el-timeline>
            <el-timeline-item
              v-for="history in queryHistoryList"
              :key="history.id"
              :timestamp="history.timestamp"
              :color="getQueryStatusColor(history.status)"
            >
              <div class="history-item">
                <div class="history-query">{{ history.query }}</div>
                <div class="history-meta">
                  <el-tag :type="getQueryTagType(history.status)" size="small">{{ history.status }}</el-tag>
                  <span>耗时: {{ history.duration }}ms</span>
                  <span>返回: {{ history.rows }} 行</span>
                  <el-button text size="small" @click="reuseQuery(history.query)">重用</el-button>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </el-card>
    </section>

    <!-- 复杂分析工作台 -->
    <section class="analysis-section">
      <h3 class="section-title">
        <el-icon><Connection /></el-icon>
        复杂分析工作台
      </h3>
      <el-row :gutter="20">
        <el-col :xs="24" :md="12">
          <el-card header="数据源配置">
            <el-form :model="analysisForm" label-width="100px" size="small">
              <el-form-item label="主数据源">
                <el-select v-model="analysisForm.primarySource" placeholder="请选择">
                  <el-option
                    v-for="source in dataSources"
                    :key="source.id"
                    :label="source.name"
                    :value="source.id"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="关联数据源">
                <el-select
                  v-model="analysisForm.relatedSources"
                  multiple
                  placeholder="请选择"
                  collapse-tags
                  collapse-tags-tooltip
                >
                  <el-option
                    v-for="source in dataSources"
                    :key="source.id"
                    :label="source.name"
                    :value="source.id"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="分析模型">
                <el-select v-model="analysisForm.model" placeholder="请选择">
                  <el-option label="趋势分析" value="trend" />
                  <el-option label="相关性分析" value="correlation" />
                  <el-option label="聚类分析" value="clustering" />
                  <el-option label="预测分析" value="prediction" />
                </el-select>
              </el-form-item>
              <el-form-item label="并行任务">
                <el-switch v-model="analysisForm.parallel" />
                <span class="form-tip">开启后将提升分析速度</span>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="startAnalysis" :loading="analysisLoading">
                  开始分析
                </el-button>
                <el-button @click="resetAnalysis">重置</el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-card header="分析任务进度">
            <div v-if="analysisTasks.length === 0" class="empty-state">
              <p>暂无运行中的分析任务</p>
            </div>
            <div v-else class="analysis-tasks">
              <div v-for="task in analysisTasks" :key="task.id" class="task-item">
                <div class="task-header">
                  <span class="task-name">{{ task.name }}</span>
                  <el-tag :type="getTaskStatusType(task.status)" size="small">
                    {{ task.statusText }}
                  </el-tag>
                </div>
                <el-progress
                  :percentage="task.progress"
                  :status="task.status === 'completed' ? 'success' : undefined"
                />
                <div class="task-meta">
                  <span>已用时: {{ task.elapsed }}s</span>
                  <span>中间结果: {{ task.intermediateResults }} 条</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </section>

    <!-- 性能监控面板 -->
    <section class="performance-section">
      <h3 class="section-title">
        <el-icon><Monitor /></el-icon>
        性能监控面板
      </h3>
      <el-row :gutter="20">
        <el-col :xs="24" :md="8">
          <el-card header="系统资源">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="CPU使用率">
                <el-progress
                  :percentage="performanceMetrics.cpu"
                  :color="getPerformanceColor(performanceMetrics.cpu)"
                />
              </el-descriptions-item>
              <el-descriptions-item label="内存使用率">
                <el-progress
                  :percentage="performanceMetrics.memory"
                  :color="getPerformanceColor(performanceMetrics.memory)"
                />
              </el-descriptions-item>
              <el-descriptions-item label="磁盘IO">
                <el-progress
                  :percentage="performanceMetrics.diskIO"
                  :color="getPerformanceColor(performanceMetrics.diskIO)"
                />
              </el-descriptions-item>
              <el-descriptions-item label="网络带宽">
                <span>{{ performanceMetrics.bandwidth }} Mbps</span>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
        <el-col :xs="24" :md="8">
          <el-card header="查询性能">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="平均响应时间">
                <span :class="getResponseTimeClass(performanceMetrics.avgResponseTime)">
                  {{ performanceMetrics.avgResponseTime }}ms
                </span>
              </el-descriptions-item>
              <el-descriptions-item label="并发查询数">
                <el-tag type="info">{{ performanceMetrics.concurrentQueries }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="查询成功率">
                <span :class="getSuccessRateClass(performanceMetrics.successRate)">
                  {{ performanceMetrics.successRate }}%
                </span>
              </el-descriptions-item>
              <el-descriptions-item label="今日查询总数">
                <span>{{ performanceMetrics.totalQueries }}</span>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
        <el-col :xs="24" :md="8">
          <el-card header="数据湖状态">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="存储容量">
                <span>{{ performanceMetrics.storage.used }}TB / {{ performanceMetrics.storage.total }}TB</span>
              </el-descriptions-item>
              <el-descriptions-item label="数据表数量">
                <span>{{ performanceMetrics.tableCount }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="计算节点">
                <el-tag :type="performanceMetrics.computeNodes.status === 'healthy' ? 'success' : 'danger'">
                  {{ performanceMetrics.computeNodes.active }}/{{ performanceMetrics.computeNodes.total }} 在线
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="系统状态">
                <el-tag :type="getSystemStatusType(performanceMetrics.systemHealth)">
                  {{ getSystemStatusText(performanceMetrics.systemHealth) }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
      </el-row>

      <!-- 性能优化建议 -->
      <el-card header="性能优化建议" class="optimization-card" v-if="optimizationSuggestions.length > 0">
        <el-alert
          v-for="suggestion in optimizationSuggestions"
          :key="suggestion.id"
          :title="suggestion.title"
          :type="suggestion.level"
          :description="suggestion.description"
          show-icon
          :closable="false"
          class="suggestion-item"
        />
      </el-card>
    </section>

    <!-- 分析结果可视化 -->
    <section class="visualization-section" v-if="visualizationData">
      <h3 class="section-title">
        <el-icon><Histogram /></el-icon>
        分析结果可视化
      </h3>
      <el-card>
        <div class="visualization-toolbar">
          <el-radio-group v-model="chartType" size="small">
            <el-radio-button label="bar">柱状图</el-radio-button>
            <el-radio-button label="line">折线图</el-radio-button>
            <el-radio-button label="pie">饼图</el-radio-button>
            <el-radio-button label="scatter">散点图</el-radio-button>
          </el-radio-group>
          <div class="toolbar-actions">
            <el-button size="small" @click="autoRecommendChart">智能推荐</el-button>
            <el-button size="small" @click="generateReport">生成报告</el-button>
            <el-button size="small" @click="exportChart">导出图表</el-button>
          </div>
        </div>
        <div class="chart-container">
          <div ref="chartRef" class="chart" style="width: 100%; height: 400px;"></div>
        </div>
        <div class="chart-summary">
          <el-descriptions title="数据摘要" :column="4" border>
            <el-descriptions-item label="数据点数">{{ visualizationData.dataPoints }}</el-descriptions-item>
            <el-descriptions-item label="最大值">{{ visualizationData.max }}</el-descriptions-item>
            <el-descriptions-item label="最小值">{{ visualizationData.min }}</el-descriptions-item>
            <el-descriptions-item label="平均值">{{ visualizationData.avg }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </el-card>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue';
import {
  DataAnalysis,
  Search,
  Connection,
  Monitor,
  Histogram,
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// ==================== 类型定义 ====================
interface KeyMetric {
  id: string;
  title: string;
  value: number;
  unit: string;
  precision?: number;
  trend: number;
  status: 'excellent' | 'good' | 'normal' | 'warning';
  statusText: string;
}

interface QueryResult {
  total: number;
  duration: number;
  data: any[];
  columns: Array<{ prop: string; label: string; width?: string }>;
}

interface QueryHistory {
  id: string;
  query: string;
  timestamp: string;
  status: '完成' | '超时' | '失败';
  duration: number;
  rows: number;
}

interface AnalysisTask {
  id: string;
  name: string;
  progress: number;
  status: 'running' | 'completed' | 'failed';
  statusText: string;
  elapsed: number;
  intermediateResults: number;
}

interface DataSource {
  id: string;
  name: string;
}

interface PerformanceMetrics {
  cpu: number;
  memory: number;
  diskIO: number;
  bandwidth: number;
  avgResponseTime: number;
  concurrentQueries: number;
  successRate: number;
  totalQueries: number;
  storage: {
    used: number;
    total: number;
  };
  tableCount: number;
  computeNodes: {
    active: number;
    total: number;
    status: 'healthy' | 'unhealthy';
  };
  systemHealth: 'excellent' | 'good' | 'normal' | 'warning';
}

interface OptimizationSuggestion {
  id: string;
  title: string;
  description: string;
  level: 'success' | 'info' | 'warning' | 'error';
}

interface VisualizationData {
  dataPoints: number;
  max: number;
  min: number;
  avg: number;
}

// ==================== 响应式状态 ====================
// 关键指标
const keyMetrics = ref<KeyMetric[]>([
  {
    id: '1',
    title: '今日查询总数',
    value: 12845,
    unit: '次',
    trend: 12.5,
    status: 'excellent',
    statusText: '优秀',
  },
  {
    id: '2',
    title: '平均响应时间',
    value: 285,
    unit: 'ms',
    trend: -8.3,
    status: 'good',
    statusText: '良好',
  },
  {
    id: '3',
    title: '数据处理量',
    value: 2.86,
    unit: 'TB',
    precision: 2,
    trend: 15.7,
    status: 'excellent',
    statusText: '优秀',
  },
  {
    id: '4',
    title: '系统可用率',
    value: 99.98,
    unit: '%',
    precision: 2,
    trend: 0.02,
    status: 'excellent',
    statusText: '优秀',
  },
]);

// 查询相关
const activeQueryTab = ref('natural');
const naturalQuery = ref('');
const sqlQuery = ref('');
const queryLoading = ref(false);
const queryProgress = ref(0);
const estimatedTime = ref(0);
const processedRows = ref(0);
const queryResult = ref<QueryResult | null>(null);
const showHistory = ref(false);
const queryHistoryList = ref<QueryHistory[]>([
  {
    id: '1',
    query: 'SELECT * FROM sales_data WHERE date >= "2024-10-01"',
    timestamp: '2024-10-30 14:23:15',
    status: '完成',
    duration: 268,
    rows: 15420,
  },
  {
    id: '2',
    query: '查询本月各园区能耗数据',
    timestamp: '2024-10-30 13:45:22',
    status: '完成',
    duration: 312,
    rows: 8650,
  },
  {
    id: '3',
    query: 'SELECT * FROM large_table WHERE id > 1000000',
    timestamp: '2024-10-30 12:18:09',
    status: '超时',
    duration: 30000,
    rows: 0,
  },
]);

// 分析相关
const analysisForm = reactive({
  primarySource: '',
  relatedSources: [] as string[],
  model: '',
  parallel: false,
});

const dataSources = ref<DataSource[]>([
  { id: 'ds1', name: '业务数据库' },
  { id: 'ds2', name: '运营数据仓库' },
  { id: 'ds3', name: '物联网数据流' },
  { id: 'ds4', name: '第三方数据源' },
]);

const analysisLoading = ref(false);
const analysisTasks = ref<AnalysisTask[]>([]);

// 性能监控
const performanceMetrics = ref<PerformanceMetrics>({
  cpu: 45,
  memory: 62,
  diskIO: 38,
  bandwidth: 856,
  avgResponseTime: 285,
  concurrentQueries: 23,
  successRate: 99.8,
  totalQueries: 12845,
  storage: {
    used: 286,
    total: 500,
  },
  tableCount: 1245,
  computeNodes: {
    active: 15,
    total: 16,
    status: 'healthy',
  },
  systemHealth: 'excellent',
});

const optimizationSuggestions = ref<OptimizationSuggestion[]>([
  {
    id: '1',
    title: '查询优化建议',
    description: '检测到 3 个慢查询，建议添加索引以提升性能',
    level: 'warning',
  },
  {
    id: '2',
    title: '资源分配优化',
    description: '当前内存使用率较高，建议增加计算节点或优化内存配置',
    level: 'info',
  },
]);

// 可视化
const visualizationData = ref<VisualizationData | null>(null);
const chartType = ref('bar');
const chartRef = ref<HTMLDivElement>();

// ==================== 定时器 ====================
let metricsTimer: number | null = null;
let performanceTimer: number | null = null;

// ==================== 生命周期 ====================
onMounted(() => {
  // 模拟实时数据更新
  startMetricsUpdate();
  startPerformanceUpdate();
});

onUnmounted(() => {
  stopMetricsUpdate();
  stopPerformanceUpdate();
});

// ==================== 方法 ====================
// 启动指标更新
const startMetricsUpdate = () => {
  metricsTimer = window.setInterval(() => {
    keyMetrics.value.forEach((metric) => {
      // 随机波动
      const fluctuation = (Math.random() - 0.5) * 0.02;
      metric.value = Math.round(metric.value * (1 + fluctuation));
      metric.trend = parseFloat((Math.random() * 20 - 10).toFixed(1));
    });
  }, 5000);
};

const stopMetricsUpdate = () => {
  if (metricsTimer) {
    clearInterval(metricsTimer);
    metricsTimer = null;
  }
};

// 启动性能监控更新
const startPerformanceUpdate = () => {
  performanceTimer = window.setInterval(() => {
    performanceMetrics.value.cpu = Math.min(100, Math.max(0, performanceMetrics.value.cpu + (Math.random() - 0.5) * 10));
    performanceMetrics.value.memory = Math.min(100, Math.max(0, performanceMetrics.value.memory + (Math.random() - 0.5) * 8));
    performanceMetrics.value.diskIO = Math.min(100, Math.max(0, performanceMetrics.value.diskIO + (Math.random() - 0.5) * 12));
    performanceMetrics.value.concurrentQueries = Math.max(0, Math.floor(performanceMetrics.value.concurrentQueries + (Math.random() - 0.5) * 5));
  }, 3000);
};

const stopPerformanceUpdate = () => {
  if (performanceTimer) {
    clearInterval(performanceTimer);
    performanceTimer = null;
  }
};

// 获取状态类型
const getStatusType = (status: string): any => {
  const typeMap: Record<string, string> = {
    excellent: 'success',
    good: 'primary',
    normal: 'warning',
    warning: 'danger',
  };
  return typeMap[status] || 'info';
};

// 查询相关方法
const handleQueryTabChange = (tabName: string | number) => {
  console.log('切换到:', tabName);
};

const executeQuery = async (type: 'natural' | 'sql') => {
  const query = type === 'natural' ? naturalQuery.value : sqlQuery.value;
  if (!query.trim()) {
    ElMessage.warning('请输入查询内容');
    return;
  }

  queryLoading.value = true;
  queryProgress.value = 0;
  estimatedTime.value = 5;
  processedRows.value = 0;
  queryResult.value = null;

  // 模拟查询进度
  const progressInterval = setInterval(() => {
    if (queryProgress.value < 90) {
      queryProgress.value += Math.random() * 15;
      estimatedTime.value = Math.max(0, estimatedTime.value - 0.5);
      processedRows.value += Math.floor(Math.random() * 1000);
    }
  }, 500);

  // 模拟查询执行
  setTimeout(() => {
    clearInterval(progressInterval);
    queryProgress.value = 100;
    estimatedTime.value = 0;

    // 生成模拟结果
    const mockData = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `数据项 ${i + 1}`,
      value: Math.floor(Math.random() * 10000),
      status: ['正常', '异常', '待处理'][Math.floor(Math.random() * 3)],
      updateTime: new Date().toLocaleString(),
    }));

    queryResult.value = {
      total: 10,
      duration: Math.floor(Math.random() * 500) + 200,
      data: mockData,
      columns: [
        { prop: 'id', label: 'ID', width: '80' },
        { prop: 'name', label: '名称' },
        { prop: 'value', label: '数值' },
        { prop: 'status', label: '状态' },
        { prop: 'updateTime', label: '更新时间' },
      ],
    };

    queryLoading.value = false;
    ElMessage.success('查询完成');

    // 添加到历史记录
    queryHistoryList.value.unshift({
      id: Date.now().toString(),
      query: query.substring(0, 100),
      timestamp: new Date().toLocaleString(),
      status: '完成',
      duration: queryResult.value.duration,
      rows: queryResult.value.total,
    });
  }, 3000);
};

const clearQuery = () => {
  if (activeQueryTab.value === 'natural') {
    naturalQuery.value = '';
  } else {
    sqlQuery.value = '';
  }
};

const showQueryHistory = () => {
  showHistory.value = !showHistory.value;
};

const formatSql = () => {
  // 简单的SQL格式化
  sqlQuery.value = sqlQuery.value
    .replace(/\s+/g, ' ')
    .replace(/SELECT/gi, '\nSELECT')
    .replace(/FROM/gi, '\nFROM')
    .replace(/WHERE/gi, '\nWHERE')
    .replace(/ORDER BY/gi, '\nORDER BY')
    .trim();
  ElMessage.success('SQL已格式化');
};

const exportResult = (format: string) => {
  ElMessage.success(`正在导出为 ${format.toUpperCase()} 格式...`);
};

const visualizeResult = () => {
  if (queryResult.value) {
    visualizationData.value = {
      dataPoints: queryResult.value.total,
      max: Math.max(...queryResult.value.data.map((d) => d.value)),
      min: Math.min(...queryResult.value.data.map((d) => d.value)),
      avg: Math.floor(
        queryResult.value.data.reduce((sum, d) => sum + d.value, 0) / queryResult.value.total
      ),
    };
    ElMessage.success('数据可视化已生成');
  }
};

const getQueryStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    完成: '#67C23A',
    超时: '#E6A23C',
    失败: '#F56C6C',
  };
  return colorMap[status] || '#909399';
};

const getQueryTagType = (status: string): any => {
  const typeMap: Record<string, string> = {
    完成: 'success',
    超时: 'warning',
    失败: 'danger',
  };
  return typeMap[status] || 'info';
};

const reuseQuery = (query: string) => {
  if (activeQueryTab.value === 'natural') {
    naturalQuery.value = query;
  } else {
    sqlQuery.value = query;
  }
  showHistory.value = false;
  ElMessage.success('查询已加载到编辑器');
};

// 分析相关方法
const startAnalysis = async () => {
  if (!analysisForm.primarySource) {
    ElMessage.warning('请选择主数据源');
    return;
  }
  if (!analysisForm.model) {
    ElMessage.warning('请选择分析模型');
    return;
  }

  analysisLoading.value = true;

  // 创建分析任务
  const taskId = Date.now().toString();
  const newTask: AnalysisTask = {
    id: taskId,
    name: `${analysisForm.model}分析任务`,
    progress: 0,
    status: 'running',
    statusText: '执行中',
    elapsed: 0,
    intermediateResults: 0,
  };

  analysisTasks.value.push(newTask);

  // 模拟任务执行
  const taskInterval = setInterval(() => {
    const task = analysisTasks.value.find((t) => t.id === taskId);
    if (task) {
      task.progress = Math.min(100, task.progress + Math.random() * 10);
      task.elapsed += 1;
      task.intermediateResults += Math.floor(Math.random() * 50);

      if (task.progress >= 100) {
        task.status = 'completed';
        task.statusText = '已完成';
        task.progress = 100;
        clearInterval(taskInterval);
        analysisLoading.value = false;
        ElMessage.success('分析任务完成');
      }
    }
  }, 800);
};

const resetAnalysis = () => {
  analysisForm.primarySource = '';
  analysisForm.relatedSources = [];
  analysisForm.model = '';
  analysisForm.parallel = false;
};

const getTaskStatusType = (status: string): any => {
  const typeMap: Record<string, string> = {
    running: 'primary',
    completed: 'success',
    failed: 'danger',
  };
  return typeMap[status] || 'info';
};

// 性能相关方法
const getPerformanceColor = (value: number): string => {
  if (value < 50) return '#67C23A'; // 绿色 - 优秀
  if (value < 70) return '#409EFF'; // 蓝色 - 良好
  if (value < 85) return '#E6A23C'; // 黄色 - 一般
  return '#F56C6C'; // 红色 - 需优化
};

const getResponseTimeClass = (time: number): string => {
  if (time < 300) return 'text-success';
  if (time < 500) return 'text-primary';
  if (time < 1000) return 'text-warning';
  return 'text-danger';
};

const getSuccessRateClass = (rate: number): string => {
  if (rate >= 99.5) return 'text-success';
  if (rate >= 98) return 'text-primary';
  if (rate >= 95) return 'text-warning';
  return 'text-danger';
};

const getSystemStatusType = (health: string): any => {
  const typeMap: Record<string, string> = {
    excellent: 'success',
    good: 'primary',
    normal: 'warning',
    warning: 'danger',
  };
  return typeMap[health] || 'info';
};

const getSystemStatusText = (health: string): string => {
  const textMap: Record<string, string> = {
    excellent: '优秀',
    good: '良好',
    normal: '一般',
    warning: '需优化',
  };
  return textMap[health] || '未知';
};

// 可视化相关方法
const autoRecommendChart = () => {
  const charts = ['bar', 'line', 'pie', 'scatter'];
  const recommended = charts[Math.floor(Math.random() * charts.length)];
  chartType.value = recommended;
  ElMessage.success(`推荐使用${getChartName(recommended)}`);
};

const getChartName = (type: string): string => {
  const nameMap: Record<string, string> = {
    bar: '柱状图',
    line: '折线图',
    pie: '饼图',
    scatter: '散点图',
  };
  return nameMap[type] || type;
};

const generateReport = () => {
  ElMessage.success('正在生成分析报告...');
  setTimeout(() => {
    ElMessage.success('报告生成完成');
  }, 2000);
};

const exportChart = () => {
  ElMessage.success('图表已导出');
};
</script>

<style scoped lang="scss">
.data-analysis-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;

  h2 {
    font-size: 28px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 8px 0;
  }

  .subtitle {
    font-size: 14px;
    color: #909399;
    margin: 0;
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

section {
  margin-bottom: 24px;
}

// ==================== 实时数据看板 ====================
.metric-card {
  transition: all 0.3s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .metric-trend {
    margin-top: 12px;
    font-size: 14px;

    .trend-up {
      color: #67c23a;
      font-weight: 600;
    }

    .trend-down {
      color: #f56c6c;
      font-weight: 600;
    }

    .trend-label {
      margin-left: 8px;
      color: #909399;
    }
  }
}

// ==================== 查询界面 ====================
.query-section {
  .sql-editor {
    font-family: 'Consolas', 'Monaco', monospace;
  }

  .query-actions {
    margin-top: 16px;
    display: flex;
    gap: 12px;
  }

  .query-progress {
    margin-top: 24px;
    padding: 16px;
    background: #f5f7fa;
    border-radius: 4px;

    .progress-info {
      margin-top: 12px;
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      color: #606266;
    }
  }

  .query-result {
    margin-top: 24px;

    .result-header {
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;

      .result-actions {
        display: flex;
        gap: 8px;
      }
    }
  }

  .query-history {
    margin-top: 24px;
    padding: 16px;
    background: #f5f7fa;
    border-radius: 4px;

    h4 {
      margin: 0 0 16px 0;
      font-size: 16px;
      color: #303133;
    }

    .history-item {
      .history-query {
        font-size: 14px;
        color: #303133;
        margin-bottom: 8px;
        font-family: 'Consolas', 'Monaco', monospace;
      }

      .history-meta {
        display: flex;
        gap: 16px;
        align-items: center;
        font-size: 12px;
        color: #909399;
      }
    }
  }
}

// ==================== 分析工作台 ====================
.analysis-section {
  .form-tip {
    margin-left: 8px;
    font-size: 12px;
    color: #909399;
  }

  .empty-state {
    text-align: center;
    padding: 40px;
    color: #909399;
  }

  .analysis-tasks {
    .task-item {
      padding: 12px;
      background: #f5f7fa;
      border-radius: 4px;
      margin-bottom: 12px;

      &:last-child {
        margin-bottom: 0;
      }

      .task-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        .task-name {
          font-size: 14px;
          font-weight: 500;
          color: #303133;
        }
      }

      .task-meta {
        margin-top: 8px;
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #909399;
      }
    }
  }
}

// ==================== 性能监控 ====================
.performance-section {
  .optimization-card {
    margin-top: 20px;

    .suggestion-item {
      margin-bottom: 12px;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  .text-success {
    color: #67c23a;
    font-weight: 600;
  }

  .text-primary {
    color: #409eff;
    font-weight: 600;
  }

  .text-warning {
    color: #e6a23c;
    font-weight: 600;
  }

  .text-danger {
    color: #f56c6c;
    font-weight: 600;
  }
}

// ==================== 可视化 ====================
.visualization-section {
  .visualization-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 12px;

    .toolbar-actions {
      display: flex;
      gap: 8px;
    }
  }

  .chart-container {
    margin-bottom: 24px;

    .chart {
      background: #f5f7fa;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #909399;
      font-size: 14px;

      &::before {
        content: '📊 图表展示区域';
      }
    }
  }

  .chart-summary {
    margin-top: 20px;
  }
}

// ==================== 响应式 ====================
@media (max-width: 768px) {
  .data-analysis-container {
    padding: 12px;
  }

  .page-header h2 {
    font-size: 22px;
  }

  .section-title {
    font-size: 16px;
  }
}
</style>
