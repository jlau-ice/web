<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import {
  Search,
  Delete,
  Download,
  Share,
  Printer,
  Star,
  Camera,
  RefreshRight,
  Document,
  TrendCharts,
  SuccessFilled,
  Clock,
  Warning
} from '@element-plus/icons-vue'

// 类型定义
interface TraceabilityNode {
  id: string
  type: '生产' | '加工' | '仓储' | '运输' | '销售'
  status: 'completed' | 'inProgress' | 'pending'
  timestamp: string
  location: string
  responsible: string
  details: {
    label: string
    value: string
  }[]
  description: string
  expanded?: boolean
}

interface QualityTest {
  name: string
  value: string
  standard: string
  result: 'pass' | 'fail'
  testDate: string
}

interface QueryHistory {
  code: string
  timestamp: string
}

interface TraceabilityData {
  productName: string
  productCode: string
  category: string
  producer: string
  productionDate: string
  nodes: TraceabilityNode[]
  qualityTests: QualityTest[]
  qualityScore: number
  completeness: number
  certificates: string[]
}

// 响应式数据
const traceCode = ref('')
const loading = ref(false)
const hasQueried = ref(false)
const queryHistory = ref<QueryHistory[]>([
  { code: 'TC20250101001', timestamp: '2025-01-15 10:30:00' },
  { code: 'TC20250102005', timestamp: '2025-01-14 15:20:00' },
  { code: 'TC20250103012', timestamp: '2025-01-13 09:15:00' }
])

const traceData = ref<TraceabilityData | null>(null)

// 统计数据
const statistics = reactive({
  totalQueries: 1258,
  todayQueries: 45,
  avgQualityScore: 96.5,
  avgCompleteness: 98.2
})

const querySourceData = ref([
  { source: '微信扫码', count: 520, percentage: 41.3 },
  { source: 'APP查询', count: 380, percentage: 30.2 },
  { source: '网页查询', count: 285, percentage: 22.7 },
  { source: '其他渠道', count: 73, percentage: 5.8 }
])

const queryTimeDistribution = ref([
  { time: '00:00-06:00', count: 45 },
  { time: '06:00-12:00', count: 385 },
  { time: '12:00-18:00', count: 562 },
  { time: '18:00-24:00', count: 266 }
])

// 计算属性
const nodeStatusColor = computed(() => {
  return (status: string) => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'inProgress':
        return 'primary'
      case 'pending':
        return 'info'
      default:
        return 'info'
    }
  }
})

const nodeStatusText = computed(() => {
  return (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成'
      case 'inProgress':
        return '进行中'
      case 'pending':
        return '未开始'
      default:
        return '未知'
    }
  }
})

const qualityScoreType = computed(() => {
  if (!traceData.value) return 'success'
  const score = traceData.value.qualityScore
  if (score >= 90) return 'success'
  if (score >= 70) return 'warning'
  return 'danger'
})

const completenessType = computed(() => {
  if (!traceData.value) return 'success'
  const completeness = traceData.value.completeness
  if (completeness >= 90) return 'success'
  if (completeness >= 70) return 'warning'
  return 'danger'
})

// Mock 数据生成
const generateMockData = (code: string): TraceabilityData => {
  return {
    productName: '有机富硒大米',
    productCode: code,
    category: '粮食作物',
    producer: '绿野农业科技有限公司',
    productionDate: '2024-10-15',
    nodes: [
      {
        id: '1',
        type: '生产',
        status: 'completed',
        timestamp: '2024-10-15 08:30:00',
        location: '黑龙江省五常市绿野种植基地A区',
        responsible: '张明（高级农艺师）',
        description: '采用有机种植方式，使用天然肥料，全程人工除草',
        expanded: false,
        details: [
          { label: '种植面积', value: '500亩' },
          { label: '种植品种', value: '五常稻花香2号' },
          { label: '土壤类型', value: '黑土地' },
          { label: '灌溉方式', value: '山泉水灌溉' },
          { label: '施肥记录', value: '有机肥3次，每次200kg/亩' },
          { label: '病虫害防治', value: '生物防治，使用赤眼蜂' }
        ]
      },
      {
        id: '2',
        type: '加工',
        status: 'completed',
        timestamp: '2024-11-20 14:20:00',
        location: '五常市现代化粮食加工中心',
        responsible: '李娟（加工主管）',
        description: '现代化加工流水线，全程无尘作业，保留胚芽营养',
        expanded: false,
        details: [
          { label: '收割方式', value: '机械收割' },
          { label: '干燥方式', value: '低温烘干' },
          { label: '加工工艺', value: '一次脱壳' },
          { label: '抛光次数', value: '2次轻抛' },
          { label: '色选标准', value: '99.5%精选率' },
          { label: '包装规格', value: '5kg/袋，真空包装' }
        ]
      },
      {
        id: '3',
        type: '仓储',
        status: 'completed',
        timestamp: '2024-11-22 09:00:00',
        location: '五常市恒温恒湿仓储中心3号库',
        responsible: '王强（仓储经理）',
        description: '恒温恒湿储存，智能监控温湿度，确保品质',
        expanded: false,
        details: [
          { label: '仓库类型', value: '恒温恒湿库' },
          { label: '存储温度', value: '15-18℃' },
          { label: '存储湿度', value: '60-65%RH' },
          { label: '入库日期', value: '2024-11-22' },
          { label: '库位编号', value: '3-A-015' },
          { label: '库存数量', value: '50吨' }
        ]
      },
      {
        id: '4',
        type: '运输',
        status: 'completed',
        timestamp: '2024-12-05 06:00:00',
        location: '冷链物流车 黑A·88888',
        responsible: '赵刚（物流司机）',
        description: '全程冷链运输，GPS实时定位，确保运输安全',
        expanded: false,
        details: [
          { label: '运输方式', value: '冷链物流' },
          { label: '车辆类型', value: '冷藏车' },
          { label: '车牌号', value: '黑A·88888' },
          { label: '运输温度', value: '10-15℃' },
          { label: '发车时间', value: '2024-12-05 06:00' },
          { label: '预计到达', value: '2024-12-07 18:00' }
        ]
      },
      {
        id: '5',
        type: '销售',
        status: 'completed',
        timestamp: '2024-12-10 10:30:00',
        location: '北京市朝阳区绿色有机食品超市',
        responsible: '陈敏（销售经理）',
        description: '正规渠道销售，提供完整溯源信息和质检报告',
        expanded: false,
        details: [
          { label: '销售渠道', value: '直营门店' },
          { label: '门店名称', value: '绿色有机食品超市' },
          { label: '上架日期', value: '2024-12-10' },
          { label: '销售价格', value: '58元/5kg' },
          { label: '保质期', value: '12个月' },
          { label: '销售状态', value: '在售' }
        ]
      }
    ],
    qualityTests: [
      {
        name: '重金属检测（铅）',
        value: '0.08 mg/kg',
        standard: '≤0.2 mg/kg',
        result: 'pass',
        testDate: '2024-11-18'
      },
      {
        name: '重金属检测（镉）',
        value: '0.05 mg/kg',
        standard: '≤0.2 mg/kg',
        result: 'pass',
        testDate: '2024-11-18'
      },
      {
        name: '农药残留',
        value: '未检出',
        standard: '符合GB 2763标准',
        result: 'pass',
        testDate: '2024-11-18'
      },
      {
        name: '硒含量',
        value: '0.15 mg/kg',
        standard: '≥0.07 mg/kg',
        result: 'pass',
        testDate: '2024-11-18'
      },
      {
        name: '黄曲霉毒素B1',
        value: '未检出',
        standard: '≤5.0 μg/kg',
        result: 'pass',
        testDate: '2024-11-18'
      },
      {
        name: '水分含量',
        value: '13.5%',
        standard: '≤14.5%',
        result: 'pass',
        testDate: '2024-11-18'
      }
    ],
    qualityScore: 98.5,
    completeness: 100,
    certificates: [
      '有机产品认证证书',
      '绿色食品认证',
      '富硒产品认证',
      'ISO9001质量管理体系认证'
    ]
  }
}

// 查询溯源信息
const handleQuery = async () => {
  if (!traceCode.value.trim()) {
    ElMessage.warning('请输入溯源码')
    return
  }

  loading.value = true
  hasQueried.value = false

  // 模拟异步查询
  setTimeout(() => {
    // 添加到查询历史
    const existingIndex = queryHistory.value.findIndex(
      (item) => item.code === traceCode.value
    )
    if (existingIndex === -1) {
      queryHistory.value.unshift({
        code: traceCode.value,
        timestamp: new Date().toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).replace(/\//g, '-')
      })
      // 限制历史记录数量
      if (queryHistory.value.length > 10) {
        queryHistory.value.pop()
      }
    }

    // 生成模拟数据
    traceData.value = generateMockData(traceCode.value)
    
    // 更新统计数据
    statistics.todayQueries++
    statistics.totalQueries++

    loading.value = false
    hasQueried.value = true

    ElNotification({
      title: '查询成功',
      message: '已成功获取溯源信息',
      type: 'success',
      duration: 2000
    })
  }, 1500)
}

// 扫码功能（模拟）
const handleScan = () => {
  ElMessage.info('正在启动扫码功能...')
  setTimeout(() => {
    traceCode.value = 'TC' + new Date().getFullYear() + 
      String(new Date().getMonth() + 1).padStart(2, '0') + 
      String(new Date().getDate()).padStart(2, '0') + 
      String(Math.floor(Math.random() * 1000)).padStart(3, '0')
    ElMessage.success('扫码成功')
    handleQuery()
  }, 1000)
}

// 清空查询
const handleClear = () => {
  traceCode.value = ''
  traceData.value = null
  hasQueried.value = false
}

// 清空历史
const handleClearHistory = () => {
  queryHistory.value = []
  ElMessage.success('已清空查询历史')
}

// 选择历史记录
const selectHistory = (code: string) => {
  traceCode.value = code
  handleQuery()
}

// 切换详情展开
const toggleNodeDetails = (node: TraceabilityNode) => {
  node.expanded = !node.expanded
}

// 下载质检报告
const downloadReport = () => {
  ElMessage.success('质检报告下载中...')
  // 实际项目中这里应该调用下载API
}

// 查看证书
const viewCertificate = (cert: string) => {
  ElMessage.info(`正在查看：${cert}`)
  // 实际项目中这里应该打开证书预览
}

// 生成溯源报告
const generateReport = () => {
  if (!traceData.value) {
    ElMessage.warning('请先查询溯源信息')
    return
  }
  ElMessage.success('溯源报告生成中...')
  // 实际项目中这里应该调用报告生成API
}

// 打印报告
const printReport = () => {
  if (!traceData.value) {
    ElMessage.warning('请先查询溯源信息')
    return
  }
  window.print()
}

// 分享
const shareResult = () => {
  if (!traceData.value) {
    ElMessage.warning('请先查询溯源信息')
    return
  }
  ElMessage.success('分享链接已复制到剪贴板')
  // 实际项目中这里应该生成分享链接
}

// 收藏
const addToFavorites = () => {
  if (!traceData.value) {
    ElMessage.warning('请先查询溯源信息')
    return
  }
  ElMessage.success('已添加到收藏')
  // 实际项目中这里应该调用收藏API
}

// 导出数据
const exportData = () => {
  if (!traceData.value) {
    ElMessage.warning('请先查询溯源信息')
    return
  }
  ElMessage.success('数据导出中...')
  // 实际项目中这里应该调用导出API
}
</script>

<template>
  <div class="traceability-query-container">
    <!-- 查询区域 -->
    <el-card class="query-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="header-title">
            <el-icon><Search /></el-icon>
            溯源查询
          </span>
        </div>
      </template>

      <div class="query-content">
        <el-row :gutter="20">
          <el-col :span="16">
            <div class="input-area">
              <el-input
                v-model="traceCode"
                size="large"
                placeholder="请输入溯源码或使用扫码枪扫描"
                clearable
                @keyup.enter="handleQuery"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <div class="button-group">
                <el-button
                  type="primary"
                  size="large"
                  :loading="loading"
                  @click="handleQuery"
                >
                  <el-icon><Search /></el-icon>
                  查询
                </el-button>
                <el-button
                  size="large"
                  @click="handleScan"
                >
                  <el-icon><Camera /></el-icon>
                  扫码
                </el-button>
                <el-button
                  size="large"
                  @click="handleClear"
                >
                  <el-icon><RefreshRight /></el-icon>
                  清空
                </el-button>
              </div>
            </div>
          </el-col>

          <el-col :span="8">
            <div class="history-area">
              <div class="history-header">
                <span>查询历史</span>
                <el-button
                  link
                  type="danger"
                  size="small"
                  @click="handleClearHistory"
                >
                  <el-icon><Delete /></el-icon>
                  清空
                </el-button>
              </div>
              <div class="history-list">
                <div
                  v-for="item in queryHistory"
                  :key="item.code"
                  class="history-item"
                  @click="selectHistory(item.code)"
                >
                  <span class="code">{{ item.code }}</span>
                  <span class="time">{{ item.timestamp }}</span>
                </div>
                <el-empty
                  v-if="queryHistory.length === 0"
                  description="暂无查询历史"
                  :image-size="60"
                />
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-card shadow="hover">
        <div class="loading-content">
          <el-icon class="loading-icon is-loading">
            <RefreshRight />
          </el-icon>
          <p>正在查询溯源信息，请稍候...</p>
        </div>
      </el-card>
    </div>

    <!-- 查询结果 -->
    <div v-else-if="hasQueried && traceData" class="result-container">
      <el-row :gutter="20">
        <!-- 左侧：溯源信息展示 -->
        <el-col :span="16">
          <!-- 产品基本信息 -->
          <el-card class="product-info-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="header-title">
                  <el-icon><Document /></el-icon>
                  产品信息
                </span>
                <div class="header-actions">
                  <el-button
                    size="small"
                    @click="generateReport"
                  >
                    <el-icon><Document /></el-icon>
                    生成报告
                  </el-button>
                  <el-button
                    size="small"
                    @click="printReport"
                  >
                    <el-icon><Printer /></el-icon>
                    打印
                  </el-button>
                  <el-button
                    size="small"
                    @click="shareResult"
                  >
                    <el-icon><Share /></el-icon>
                    分享
                  </el-button>
                  <el-button
                    size="small"
                    @click="addToFavorites"
                  >
                    <el-icon><Star /></el-icon>
                    收藏
                  </el-button>
                  <el-button
                    size="small"
                    @click="exportData"
                  >
                    <el-icon><Download /></el-icon>
                    导出
                  </el-button>
                </div>
              </div>
            </template>

            <el-descriptions :column="2" border>
              <el-descriptions-item label="产品名称">
                {{ traceData.productName }}
              </el-descriptions-item>
              <el-descriptions-item label="溯源码">
                <el-tag type="primary">{{ traceData.productCode }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="产品类别">
                {{ traceData.category }}
              </el-descriptions-item>
              <el-descriptions-item label="生产企业">
                {{ traceData.producer }}
              </el-descriptions-item>
              <el-descriptions-item label="生产日期">
                {{ traceData.productionDate }}
              </el-descriptions-item>
              <el-descriptions-item label="质量评分">
                <el-tag :type="qualityScoreType">
                  {{ traceData.qualityScore }} 分
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>

          <!-- 溯源时间轴 -->
          <el-card class="timeline-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="header-title">
                  <el-icon><Clock /></el-icon>
                  溯源时间轴
                </span>
                <el-tag :type="completenessType">
                  完整度：{{ traceData.completeness }}%
                </el-tag>
              </div>
            </template>

            <el-timeline>
              <el-timeline-item
                v-for="node in traceData.nodes"
                :key="node.id"
                :timestamp="node.timestamp"
                placement="top"
                :type="nodeStatusColor(node.status)"
                :hollow="node.status === 'pending'"
              >
                <el-card class="timeline-node-card">
                  <div class="node-header" @click="toggleNodeDetails(node)">
                    <div class="node-title">
                      <el-tag
                        :type="nodeStatusColor(node.status)"
                        size="large"
                        effect="dark"
                      >
                        {{ node.type }}
                      </el-tag>
                      <span class="node-status">
                        {{ nodeStatusText(node.status) }}
                      </span>
                    </div>
                    <el-icon class="expand-icon" :class="{ expanded: node.expanded }">
                      <el-icon-arrow-down />
                    </el-icon>
                  </div>

                  <div class="node-basic-info">
                    <p>
                      <el-icon><el-icon-location /></el-icon>
                      <strong>地点：</strong>{{ node.location }}
                    </p>
                    <p>
                      <el-icon><el-icon-user /></el-icon>
                      <strong>责任人：</strong>{{ node.responsible }}
                    </p>
                    <p class="node-description">{{ node.description }}</p>
                  </div>

                  <transition name="el-fade-in">
                    <div v-if="node.expanded" class="node-details">
                      <el-divider />
                      <el-descriptions :column="2" size="small" border>
                        <el-descriptions-item
                          v-for="detail in node.details"
                          :key="detail.label"
                          :label="detail.label"
                        >
                          {{ detail.value }}
                        </el-descriptions-item>
                      </el-descriptions>
                    </div>
                  </transition>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </el-card>

          <!-- 质量检测信息 -->
          <el-card class="quality-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="header-title">
                  <el-icon><SuccessFilled /></el-icon>
                  质量检测信息
                </span>
                <el-button
                  size="small"
                  type="primary"
                  @click="downloadReport"
                >
                  <el-icon><Download /></el-icon>
                  下载报告
                </el-button>
              </div>
            </template>

            <el-alert
              title="所有检测项目均已通过"
              type="success"
              :closable="false"
              show-icon
              class="quality-alert"
            />

            <div class="quality-tests">
              <el-row :gutter="16">
                <el-col
                  v-for="test in traceData.qualityTests"
                  :key="test.name"
                  :span="12"
                >
                  <div class="test-item">
                    <div class="test-header">
                      <span class="test-name">{{ test.name }}</span>
                      <el-tag
                        :type="test.result === 'pass' ? 'success' : 'danger'"
                        size="small"
                      >
                        {{ test.result === 'pass' ? '合格' : '不合格' }}
                      </el-tag>
                    </div>
                    <div class="test-content">
                      <p>检测值：<strong>{{ test.value }}</strong></p>
                      <p>标准值：{{ test.standard }}</p>
                      <p class="test-date">检测日期：{{ test.testDate }}</p>
                    </div>
                  </div>
                </el-col>
              </el-row>
            </div>

            <el-divider />

            <div class="certificates">
              <h4>质量认证证书</h4>
              <div class="certificate-list">
                <el-tag
                  v-for="cert in traceData.certificates"
                  :key="cert"
                  type="success"
                  effect="plain"
                  class="certificate-tag"
                  @click="viewCertificate(cert)"
                >
                  {{ cert }}
                </el-tag>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧：统计分析面板 -->
        <el-col :span="8">
          <!-- 查询统计 -->
          <el-card class="statistics-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="header-title">
                  <el-icon><TrendCharts /></el-icon>
                  查询统计
                </span>
              </div>
            </template>

            <el-row :gutter="16">
              <el-col :span="12">
                <el-statistic
                  title="总查询次数"
                  :value="statistics.totalQueries"
                >
                  <template #suffix>次</template>
                </el-statistic>
              </el-col>
              <el-col :span="12">
                <el-statistic
                  title="今日查询"
                  :value="statistics.todayQueries"
                  value-style="color: #409eff"
                >
                  <template #suffix>次</template>
                </el-statistic>
              </el-col>
            </el-row>

            <el-divider />

            <el-row :gutter="16">
              <el-col :span="12">
                <el-statistic
                  title="平均质量评分"
                  :value="statistics.avgQualityScore"
                  :precision="1"
                >
                  <template #suffix>分</template>
                </el-statistic>
              </el-col>
              <el-col :span="12">
                <el-statistic
                  title="平均完整度"
                  :value="statistics.avgCompleteness"
                  :precision="1"
                >
                  <template #suffix>%</template>
                </el-statistic>
              </el-col>
            </el-row>
          </el-card>

          <!-- 质量评分 -->
          <el-card class="score-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="header-title">质量评分</span>
              </div>
            </template>

            <div class="score-content">
              <el-progress
                type="dashboard"
                :percentage="traceData.qualityScore"
                :color="[
                  { color: '#f56c6c', percentage: 60 },
                  { color: '#e6a23c', percentage: 80 },
                  { color: '#67c23a', percentage: 100 }
                ]"
              >
                <template #default="{ percentage }">
                  <span class="percentage-value">{{ percentage }}</span>
                  <span class="percentage-label">分</span>
                </template>
              </el-progress>
              <p class="score-description">
                该产品质量评分为 {{ traceData.qualityScore }} 分，
                {{ traceData.qualityScore >= 90 ? '质量优秀' : '质量良好' }}
              </p>
            </div>
          </el-card>

          <!-- 溯源完整度 -->
          <el-card class="completeness-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="header-title">溯源完整度</span>
              </div>
            </template>

            <div class="completeness-content">
              <el-progress
                type="dashboard"
                :percentage="traceData.completeness"
                :color="[
                  { color: '#f56c6c', percentage: 60 },
                  { color: '#e6a23c', percentage: 80 },
                  { color: '#67c23a', percentage: 100 }
                ]"
              >
                <template #default="{ percentage }">
                  <span class="percentage-value">{{ percentage }}</span>
                  <span class="percentage-label">%</span>
                </template>
              </el-progress>
              <p class="score-description">
                溯源信息完整度 {{ traceData.completeness }}%，
                包含生产、加工、仓储、运输、销售全流程信息
              </p>
            </div>
          </el-card>

          <!-- 查询来源分布 -->
          <el-card class="source-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="header-title">查询来源分布</span>
              </div>
            </template>

            <div class="source-list">
              <div
                v-for="item in querySourceData"
                :key="item.source"
                class="source-item"
              >
                <div class="source-info">
                  <span class="source-name">{{ item.source }}</span>
                  <span class="source-count">{{ item.count }}次</span>
                </div>
                <el-progress
                  :percentage="item.percentage"
                  :stroke-width="8"
                  :show-text="false"
                />
                <span class="source-percentage">{{ item.percentage }}%</span>
              </div>
            </div>
          </el-card>

          <!-- 查询时间分布 -->
          <el-card class="time-distribution-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="header-title">查询时间分布</span>
              </div>
            </template>

            <div class="time-distribution-list">
              <div
                v-for="item in queryTimeDistribution"
                :key="item.time"
                class="time-item"
              >
                <span class="time-label">{{ item.time }}</span>
                <div class="time-bar">
                  <div
                    class="time-bar-fill"
                    :style="{ width: (item.count / 600 * 100) + '%' }"
                  />
                </div>
                <span class="time-count">{{ item.count }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 空状态 -->
    <div v-else-if="hasQueried && !traceData" class="empty-container">
      <el-card shadow="hover">
        <el-empty description="未查询到溯源信息，请检查溯源码是否正确" />
      </el-card>
    </div>

    <!-- 初始状态提示 -->
    <div v-else class="initial-state">
      <el-card shadow="hover">
        <el-alert
          title="欢迎使用农产品溯源查询系统"
          type="info"
          :closable="false"
          show-icon
        >
          <template #default>
            <p>请在上方输入溯源码或使用扫码功能，即可查询产品的全生命周期信息</p>
            <ul>
              <li>支持查看产品从生产到销售的完整流程</li>
              <li>查看详细的质量检测报告和认证证书</li>
              <li>了解产品溯源统计分析数据</li>
              <li>支持生成报告、打印、分享和导出功能</li>
            </ul>
          </template>
        </el-alert>
      </el-card>
    </div>
  </div>
</template>

<style scoped lang="scss">
.traceability-query-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 120px);

  .query-card {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }

      .header-actions {
        display: flex;
        gap: 8px;
      }
    }

    .query-content {
      .input-area {
        .button-group {
          margin-top: 16px;
          display: flex;
          gap: 12px;
        }
      }

      .history-area {
        border-left: 2px solid #e4e7ed;
        padding-left: 20px;
        height: 100%;

        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          font-weight: 600;
          color: #303133;
        }

        .history-list {
          max-height: 200px;
          overflow-y: auto;

          .history-item {
            padding: 8px 12px;
            margin-bottom: 8px;
            background: #f5f7fa;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            flex-direction: column;
            gap: 4px;

            &:hover {
              background: #e4e7ed;
              transform: translateX(4px);
            }

            .code {
              font-size: 14px;
              font-weight: 500;
              color: #409eff;
            }

            .time {
              font-size: 12px;
              color: #909399;
            }
          }
        }
      }
    }
  }

  .loading-container {
    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;

      .loading-icon {
        font-size: 48px;
        color: #409eff;
        margin-bottom: 20px;
      }

      p {
        font-size: 16px;
        color: #606266;
      }
    }
  }

  .result-container {
    .product-info-card {
      margin-bottom: 20px;
    }

    .timeline-card {
      margin-bottom: 20px;

      .timeline-node-card {
        cursor: pointer;

        .node-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          .node-title {
            display: flex;
            align-items: center;
            gap: 12px;

            .node-status {
              font-weight: 500;
              color: #606266;
            }
          }

          .expand-icon {
            transition: transform 0.3s;

            &.expanded {
              transform: rotate(180deg);
            }
          }
        }

        .node-basic-info {
          p {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 8px 0;
            color: #606266;

            strong {
              color: #303133;
            }
          }

          .node-description {
            margin-top: 12px;
            padding: 12px;
            background: #f5f7fa;
            border-radius: 4px;
            color: #606266;
            line-height: 1.6;
          }
        }

        .node-details {
          margin-top: 12px;
        }
      }
    }

    .quality-card {
      margin-bottom: 20px;

      .quality-alert {
        margin-bottom: 20px;
      }

      .quality-tests {
        .test-item {
          padding: 16px;
          background: #f5f7fa;
          border-radius: 8px;
          margin-bottom: 16px;
          transition: all 0.3s;

          &:hover {
            background: #e4e7ed;
            transform: translateY(-2px);
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
          }

          .test-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;

            .test-name {
              font-weight: 600;
              color: #303133;
            }
          }

          .test-content {
            p {
              margin: 6px 0;
              color: #606266;
              font-size: 14px;

              strong {
                color: #409eff;
                font-size: 16px;
              }
            }

            .test-date {
              font-size: 12px;
              color: #909399;
              margin-top: 8px;
            }
          }
        }
      }

      .certificates {
        h4 {
          margin: 0 0 16px 0;
          color: #303133;
          font-size: 16px;
        }

        .certificate-list {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;

          .certificate-tag {
            cursor: pointer;
            padding: 8px 16px;
            font-size: 14px;

            &:hover {
              transform: translateY(-2px);
              box-shadow: 0 2px 8px rgba(103, 194, 58, 0.3);
            }
          }
        }
      }
    }

    .statistics-card,
    .score-card,
    .completeness-card,
    .source-card,
    .time-distribution-card {
      margin-bottom: 20px;
    }

    .score-content,
    .completeness-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px 0;

      :deep(.el-progress) {
        margin-bottom: 20px;
      }

      .percentage-value {
        display: block;
        font-size: 28px;
        font-weight: 600;
        color: #303133;
      }

      .percentage-label {
        font-size: 14px;
        color: #909399;
      }

      .score-description {
        text-align: center;
        color: #606266;
        line-height: 1.6;
        margin: 0;
      }
    }

    .source-list {
      .source-item {
        margin-bottom: 20px;

        .source-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;

          .source-name {
            font-weight: 500;
            color: #303133;
          }

          .source-count {
            color: #606266;
            font-size: 14px;
          }
        }

        .source-percentage {
          display: block;
          text-align: right;
          margin-top: 4px;
          color: #409eff;
          font-size: 12px;
        }
      }
    }

    .time-distribution-list {
      .time-item {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;

        .time-label {
          width: 100px;
          font-size: 13px;
          color: #606266;
        }

        .time-bar {
          flex: 1;
          height: 20px;
          background: #e4e7ed;
          border-radius: 10px;
          overflow: hidden;

          .time-bar-fill {
            height: 100%;
            background: linear-gradient(90deg, #409eff, #67c23a);
            transition: width 0.3s;
          }
        }

        .time-count {
          width: 50px;
          text-align: right;
          font-weight: 600;
          color: #303133;
        }
      }
    }
  }

  .empty-container,
  .initial-state {
    margin-top: 20px;

    :deep(.el-card__body) {
      padding: 40px 20px;
    }

    ul {
      margin-top: 12px;
      padding-left: 20px;

      li {
        margin: 8px 0;
        color: #606266;
        line-height: 1.6;
      }
    }
  }
}

// 打印样式
@media print {
  .traceability-query-container {
    .query-card,
    .statistics-card,
    .score-card,
    .completeness-card,
    .source-card,
    .time-distribution-card {
      box-shadow: none !important;
      border: 1px solid #e4e7ed;
    }

    .header-actions,
    .button-group {
      display: none !important;
    }
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .traceability-query-container {
    :deep(.el-col-16) {
      width: 100%;
    }

    :deep(.el-col-8) {
      width: 100%;
      margin-top: 20px;
    }
  }
}
</style>