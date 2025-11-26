<template>
  <div class="p-[20px]">
    <div class="mb-4">
      <h2 class="text-2xl font-bold mb-4">指标影响关系</h2>
      <p class="text-gray-600 mb-4">
        指标影响关系模块用于分析和呈现指标之间的相互作用，帮助用户把握指标变化可能引发的连锁效应。
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
        分析影响关系
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

    <!-- 影响关系图 -->
    <div v-if="impactData.length > 0" class="mb-4">
      <el-card>
        <template #header>
          <div class="flex justify-between items-center">
            <span class="font-bold">影响关系网络</span>
            <el-button type="primary" size="small" @click="handleExpandAll">
              展开全部
            </el-button>
          </div>
        </template>
        <div class="impact-container">
          <div class="impact-center">
            <div class="center-node">
              <div class="node-icon">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="node-title">{{ selectedIndicatorName }}</div>
            </div>
          </div>
          <div class="impact-relations">
            <div class="relation-group">
              <div class="relation-title">上游指标（影响该指标）</div>
              <div class="relation-nodes">
                <div
                  v-for="(node, index) in impactData.filter((n) => n.type === 'upstream')"
                  :key="index"
                  class="relation-node upstream"
                >
                  <div class="node-icon">
                    <el-icon><ArrowUp /></el-icon>
                  </div>
                  <div class="node-info">
                    <div class="node-name">{{ node.name }}</div>
                    <div class="node-impact">影响度: {{ node.impact }}</div>
                    <div class="node-relation">{{ node.relation }}</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="relation-group">
              <div class="relation-title">下游指标（受该指标影响）</div>
              <div class="relation-nodes">
                <div
                  v-for="(node, index) in impactData.filter((n) => n.type === 'downstream')"
                  :key="index"
                  class="relation-node downstream"
                >
                  <div class="node-icon">
                    <el-icon><ArrowDown /></el-icon>
                  </div>
                  <div class="node-info">
                    <div class="node-name">{{ node.name }}</div>
                    <div class="node-impact">影响度: {{ node.impact }}</div>
                    <div class="node-relation">{{ node.relation }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 影响关系表格 -->
    <el-table :data="filteredTableData" border stripe style="width: 100%">
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column prop="indicatorCode" label="指标编码" width="150" />
      <el-table-column prop="indicatorName" label="指标名称" width="200" />
      <el-table-column prop="relatedIndicatorCode" label="关联指标编码" width="150" />
      <el-table-column prop="relatedIndicatorName" label="关联指标名称" width="200" />
      <el-table-column prop="relationType" label="关系类型" width="120">
        <template #default="{ row }">
          <el-tag :type="row.relationType === '上游' ? 'warning' : 'success'">
            {{ row.relationType }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="impactLevel" label="影响程度" width="120">
        <template #default="{ row }">
          <el-tag
            :type="
              row.impactLevel === '高'
                ? 'danger'
                : row.impactLevel === '中'
                  ? 'warning'
                  : 'info'
            "
          >
            {{ row.impactLevel }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="relationDesc" label="关系描述" min-width="300" show-overflow-tooltip />
      <el-table-column prop="updateTime" label="更新时间" width="180" />
      <el-table-column label="操作" width="150" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleViewImpact(row)">
            查看影响
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
import {
  Search,
  Connection,
  TrendCharts,
  ArrowUp,
  ArrowDown,
} from '@element-plus/icons-vue'

// Mock 数据
const mockData = [
  {
    id: '1',
    indicatorCode: 'IND001',
    indicatorName: '营业收入',
    relatedIndicatorCode: 'IND010',
    relatedIndicatorName: '订单数量',
    relationType: '上游',
    impactLevel: '高',
    relationDesc: '订单数量直接影响营业收入的计算',
    updateTime: '2024-01-20 10:30:00',
  },
  {
    id: '2',
    indicatorCode: 'IND001',
    indicatorName: '营业收入',
    relatedIndicatorCode: 'IND011',
    relatedIndicatorName: '平均订单金额',
    relationType: '上游',
    impactLevel: '高',
    relationDesc: '平均订单金额是营业收入计算的关键因子',
    updateTime: '2024-01-20 10:30:00',
  },
  {
    id: '3',
    indicatorCode: 'IND001',
    indicatorName: '营业收入',
    relatedIndicatorCode: 'IND020',
    relatedIndicatorName: '净利润',
    relationType: '下游',
    impactLevel: '高',
    relationDesc: '营业收入是净利润计算的基础',
    updateTime: '2024-01-20 10:30:00',
  },
  {
    id: '4',
    indicatorCode: 'IND002',
    indicatorName: '用户增长率',
    relatedIndicatorCode: 'IND012',
    relatedIndicatorName: '新增用户数',
    relationType: '上游',
    impactLevel: '中',
    relationDesc: '新增用户数是用户增长率计算的基础数据',
    updateTime: '2024-01-21 14:20:00',
  },
  {
    id: '5',
    indicatorCode: 'IND002',
    indicatorName: '用户增长率',
    relatedIndicatorCode: 'IND013',
    relatedIndicatorName: '活跃用户数',
    relationType: '下游',
    impactLevel: '中',
    relationDesc: '用户增长率影响活跃用户数的预测',
    updateTime: '2024-01-21 14:20:00',
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
const selectedIndicatorName = ref('')
const impactData = ref<any[]>([])

const filteredTableData = computed(() => {
  if (!searchText.value) {
    return tableData.value
  }
  return tableData.value.filter(
    (item) =>
      item.indicatorName.includes(searchText.value) ||
      item.indicatorCode.includes(searchText.value) ||
      item.relatedIndicatorName.includes(searchText.value)
  )
})

const handleSearch = () => {
  currentPage.value = 1
}

const handleIndicatorSelect = (code: string) => {
  if (!code) {
    impactData.value = []
    selectedIndicatorName.value = ''
    return
  }
  // 模拟影响关系数据
  const indicator = indicatorOptions.find((item) => item.code === code)
  if (indicator) {
    selectedIndicatorName.value = indicator.name
    // 根据指标代码生成影响关系
    if (code === 'IND001') {
      impactData.value = [
        {
          type: 'upstream',
          name: '订单数量',
          impact: '高',
          relation: '直接影响',
        },
        {
          type: 'upstream',
          name: '平均订单金额',
          impact: '高',
          relation: '直接影响',
        },
        {
          type: 'downstream',
          name: '净利润',
          impact: '高',
          relation: '基础数据',
        },
        {
          type: 'downstream',
          name: '利润率',
          impact: '中',
          relation: '计算因子',
        },
      ]
    } else if (code === 'IND002') {
      impactData.value = [
        {
          type: 'upstream',
          name: '新增用户数',
          impact: '中',
          relation: '基础数据',
        },
        {
          type: 'downstream',
          name: '活跃用户数',
          impact: '中',
          relation: '预测因子',
        },
      ]
    } else {
      impactData.value = []
    }
  }
}

const handleAnalyze = () => {
  if (!selectedIndicator.value) {
    ElMessage.warning('请先选择要分析的指标')
    return
  }
  handleIndicatorSelect(selectedIndicator.value)
  ElMessage.success('影响关系分析完成')
}

const handleViewImpact = (row: any) => {
  selectedIndicator.value = row.indicatorCode
  handleIndicatorSelect(row.indicatorCode)
  ElMessage.success('已加载影响关系')
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
.impact-container {
  padding: 20px;
}

.impact-center {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
}

.center-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  width: 150px;
  height: 150px;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.center-node .node-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.center-node .node-title {
  font-size: 16px;
  font-weight: bold;
  text-align: center;
}

.impact-relations {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.relation-group {
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}

.relation-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
  color: #303133;
  text-align: center;
  padding-bottom: 10px;
  border-bottom: 2px solid #e4e7ed;
}

.relation-nodes {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.relation-node {
  display: flex;
  align-items: center;
  padding: 12px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  &.upstream {
    border-left: 4px solid #e6a23c;
  }

  &.downstream {
    border-left: 4px solid #67c23a;
  }
}

.relation-node .node-icon {
  font-size: 24px;
  margin-right: 12px;
  color: #409eff;
}

.relation-node .node-info {
  flex: 1;
}

.relation-node .node-name {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 5px;
  color: #303133;
}

.relation-node .node-impact {
  font-size: 13px;
  color: #606266;
  margin-bottom: 3px;
}

.relation-node .node-relation {
  font-size: 12px;
  color: #909399;
}
</style>

