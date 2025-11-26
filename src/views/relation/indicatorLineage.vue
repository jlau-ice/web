<template>
  <div class="p-[20px]">
    <div class="mb-4">
      <h2 class="text-2xl font-bold mb-4">指标血缘分析</h2>
      <p class="text-gray-600 mb-4">
        指标血缘分析模块负责实现指标数据的全链路追踪，清楚呈现从数据源到最终指标的加工流程。
      </p>
    </div>

    <!-- 搜索和操作栏 -->
    <div class="mb-4 flex justify-between items-center">
      <el-input
        v-model="searchText"
        placeholder="请输入指标名称或编码"
        style="width: 300px"
        clearable
        @input="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button type="primary" @click="handleAnalyze">
        <el-icon><Connection /></el-icon>
        分析血缘关系
      </el-button>
    </div>

    <!-- 指标选择 -->
    <div class="mb-4">
      <el-select
        v-model="selectedIndicator"
        placeholder="请选择要分析的指标"
        filterable
        style="width: 400px"
        @change="handleIndicatorSelect"
      >
        <el-option
          v-for="item in indicatorOptions"
          :key="item.code"
          :label="`${item.code} - ${item.name}`"
          :value="item.code"
        />
      </el-select>
    </div>

    <!-- 血缘关系图 -->
    <div v-if="lineageData.length > 0" class="mb-4">
      <el-card>
        <template #header>
          <div class="flex justify-between items-center">
            <span class="font-bold">血缘关系链路</span>
            <el-button type="primary" size="small" @click="handleExpandAll">
              展开全部
            </el-button>
          </div>
        </template>
        <div class="lineage-container">
          <div
            v-for="(node, index) in lineageData"
            :key="index"
            class="lineage-node"
            :class="node.type"
          >
            <div class="node-content">
              <div class="node-icon">
                <el-icon v-if="node.type === 'source'"><Coin /></el-icon>
                <el-icon v-else-if="node.type === 'process'"><Setting /></el-icon>
                <el-icon v-else><TrendCharts /></el-icon>
              </div>
              <div class="node-info">
                <div class="node-title">{{ node.name }}</div>
                <div class="node-desc">{{ node.description }}</div>
                <div v-if="node.details" class="node-details">
                  <div v-for="(detail, idx) in node.details" :key="idx" class="detail-item">
                    <span class="detail-label">{{ detail.label }}：</span>
                    <span class="detail-value">{{ detail.value }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="index < lineageData.length - 1" class="lineage-arrow">
              <el-icon><ArrowDown /></el-icon>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 血缘关系表格 -->
    <el-table :data="filteredTableData" border stripe style="width: 100%">
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column prop="indicatorCode" label="指标编码" width="150" />
      <el-table-column prop="indicatorName" label="指标名称" width="200" />
      <el-table-column prop="sourceType" label="数据源类型" width="120" />
      <el-table-column prop="sourceName" label="数据源名称" width="200" />
      <el-table-column prop="processSteps" label="加工步骤" min-width="300" show-overflow-tooltip />
      <el-table-column prop="dependencies" label="依赖指标" width="200" show-overflow-tooltip />
      <el-table-column prop="updateTime" label="更新时间" width="180" />
      <el-table-column label="操作" width="150" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleViewLineage(row)">
            查看血缘
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="mt-4 flex justify-end">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="filteredTableData.length"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Connection, Coin, Setting, TrendCharts, ArrowDown } from '@element-plus/icons-vue'

// Mock 数据
const mockData = [
  {
    id: '1',
    indicatorCode: 'IND001',
    indicatorName: '营业收入',
    sourceType: 'MySQL',
    sourceName: '业务数据库',
    processSteps: '数据抽取 -> 数据清洗 -> 数据聚合 -> 指标计算',
    dependencies: 'IND010, IND011',
    updateTime: '2024-01-20 10:30:00',
  },
  {
    id: '2',
    indicatorCode: 'IND002',
    indicatorName: '用户增长率',
    sourceType: 'MySQL',
    sourceName: '用户数据库',
    processSteps: '数据抽取 -> 数据去重 -> 数据统计 -> 增长率计算',
    dependencies: 'IND012',
    updateTime: '2024-01-21 14:20:00',
  },
  {
    id: '3',
    indicatorCode: 'IND003',
    indicatorName: '系统响应时间',
    sourceType: 'PostgreSQL',
    sourceName: '监控数据库',
    processSteps: '日志采集 -> 数据解析 -> 时间计算 -> 平均值统计',
    dependencies: '',
    updateTime: '2024-01-22 09:15:00',
  },
]

const indicatorOptions = [
  { code: 'IND001', name: '营业收入' },
  { code: 'IND002', name: '用户增长率' },
  { code: 'IND003', name: '系统响应时间' },
  { code: 'IND004', name: '客户满意度' },
  { code: 'IND005', name: '库存周转率' },
]

const tableData = ref([...mockData])
const searchText = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const selectedIndicator = ref('')
const lineageData = ref<any[]>([])

const filteredTableData = computed(() => {
  if (!searchText.value) {
    return tableData.value
  }
  return tableData.value.filter(
    (item) =>
      item.indicatorName.includes(searchText.value) ||
      item.indicatorCode.includes(searchText.value)
  )
})

const handleSearch = () => {
  currentPage.value = 1
}

const handleIndicatorSelect = (code: string) => {
  if (!code) {
    lineageData.value = []
    return
  }
  // 模拟血缘数据
  const indicator = indicatorOptions.find((item) => item.code === code)
  if (indicator) {
    lineageData.value = [
      {
        type: 'source',
        name: '业务数据库',
        description: 'MySQL数据源',
        details: [
          { label: '数据库', value: 'business_db' },
          { label: '表名', value: 'sales_order' },
          { label: '字段', value: 'amount' },
        ],
      },
      {
        type: 'process',
        name: '数据抽取',
        description: '从数据源抽取原始数据',
        details: [
          { label: '抽取方式', value: '全量抽取' },
          { label: '抽取频率', value: '每天' },
        ],
      },
      {
        type: 'process',
        name: '数据清洗',
        description: '清洗异常数据和重复数据',
        details: [
          { label: '清洗规则', value: '去除NULL值、异常值' },
        ],
      },
      {
        type: 'process',
        name: '数据聚合',
        description: '按业务维度聚合数据',
        details: [
          { label: '聚合维度', value: '日期、产品类别' },
        ],
      },
      {
        type: 'indicator',
        name: indicator.name,
        description: '最终指标',
        details: [
          { label: '指标编码', value: code },
          { label: '计算公式', value: 'SUM(amount)' },
        ],
      },
    ]
  }
}

const handleAnalyze = () => {
  if (!selectedIndicator.value) {
    ElMessage.warning('请先选择要分析的指标')
    return
  }
  handleIndicatorSelect(selectedIndicator.value)
  ElMessage.success('血缘分析完成')
}

const handleViewLineage = (row: any) => {
  selectedIndicator.value = row.indicatorCode
  handleIndicatorSelect(row.indicatorCode)
  ElMessage.success('已加载血缘关系')
}

const handleExpandAll = () => {
  ElMessage.info('展开全部节点')
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
}
</script>

<style scoped lang="scss">
.lineage-container {
  padding: 20px;
}

.lineage-node {
  margin-bottom: 20px;
  position: relative;

  &.source {
    .node-content {
      border-left: 4px solid #409eff;
    }
  }

  &.process {
    .node-content {
      border-left: 4px solid #67c23a;
    }
  }

  &.indicator {
    .node-content {
      border-left: 4px solid #e6a23c;
    }
  }
}

.node-content {
  display: flex;
  align-items: flex-start;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 10px;
}

.node-icon {
  font-size: 24px;
  margin-right: 15px;
  color: #409eff;
}

.node-info {
  flex: 1;
}

.node-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #303133;
}

.node-desc {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.node-details {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #e4e7ed;
}

.detail-item {
  font-size: 13px;
  margin-bottom: 5px;
  color: #909399;
}

.detail-label {
  font-weight: 500;
}

.detail-value {
  color: #606266;
}

.lineage-arrow {
  text-align: center;
  color: #409eff;
  font-size: 20px;
  margin: 10px 0;
}
</style>

