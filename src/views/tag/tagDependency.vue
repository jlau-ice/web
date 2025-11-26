<template>
  <div class="tag-dependency p-5">
    <div class="mb-4">
      <h2 class="text-2xl font-bold mb-2">标签依赖分析</h2>
      <p class="text-gray-600">分析标签间的计算和业务依赖关系，保障标签体系的稳定运行，了解标签变更可能带来的影响范围</p>
    </div>

    <el-card class="mb-4">
      <template #header>
        <div class="flex justify-between items-center">
          <span class="font-semibold">依赖关系分析</span>
          <div class="flex gap-2">
            <el-button @click="handleAnalyze">
              <el-icon><Refresh /></el-icon>
              重新分析
            </el-button>
            <el-button type="primary" @click="handleViewGraph">
              <el-icon><Share /></el-icon>
              依赖图谱
            </el-button>
          </div>
        </div>
      </template>

      <div class="mb-4 flex gap-4">
        <el-input
          v-model="searchText"
          placeholder="搜索标签名称"
          class="w-80"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="selectedDependencyType" placeholder="依赖类型" clearable class="w-48">
          <el-option label="全部" value="" />
          <el-option label="计算依赖" value="计算依赖" />
          <el-option label="数据依赖" value="数据依赖" />
          <el-option label="业务依赖" value="业务依赖" />
        </el-select>
      </div>

      <el-table :data="filteredTableData" stripe style="width: 100%">
        <el-table-column prop="sourceTag" label="源标签" width="180" />
        <el-table-column prop="targetTag" label="依赖标签" width="180" />
        <el-table-column prop="dependencyType" label="依赖类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getDependencyTypeColor(row.dependencyType)">
              {{ row.dependencyType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dependencyLevel" label="依赖层级" width="120">
          <template #default="{ row }">
            <el-tag :type="getLevelColor(row.dependencyLevel)">
              L{{ row.dependencyLevel }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="impactScope" label="影响范围" width="150">
          <template #default="{ row }">
            <el-tag :type="getImpactColor(row.impactScope)">
              {{ row.impactScope }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="依赖描述" show-overflow-tooltip />
        <el-table-column prop="affectedTags" label="受影响标签数" width="130">
          <template #default="{ row }">
            <el-badge :value="row.affectedTags" class="item" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleViewDetail(row)">查看详情</el-button>
            <el-button link type="warning" @click="handleImpactAnalysis(row)">影响分析</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="mt-4 flex justify-end">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredTableData.length"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </el-card>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-4 gap-4 mb-4">
      <el-card>
        <div class="text-center">
          <div class="text-3xl font-bold text-blue-500 mb-2">{{ statistics.totalDependencies }}</div>
          <div class="text-gray-600">总依赖关系</div>
        </div>
      </el-card>
      <el-card>
        <div class="text-center">
          <div class="text-3xl font-bold text-green-500 mb-2">{{ statistics.circularDependencies }}</div>
          <div class="text-gray-600">循环依赖</div>
        </div>
      </el-card>
      <el-card>
        <div class="text-center">
          <div class="text-3xl font-bold text-orange-500 mb-2">{{ statistics.highRiskTags }}</div>
          <div class="text-gray-600">高风险标签</div>
        </div>
      </el-card>
      <el-card>
        <div class="text-center">
          <div class="text-3xl font-bold text-red-500 mb-2">{{ statistics.maxDepth }}</div>
          <div class="text-gray-600">最大依赖深度</div>
        </div>
      </el-card>
    </div>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="依赖关系详情" width="700px">
      <div v-if="selectedDependency">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="源标签">
            {{ selectedDependency.sourceTag }}
          </el-descriptions-item>
          <el-descriptions-item label="依赖标签">
            {{ selectedDependency.targetTag }}
          </el-descriptions-item>
          <el-descriptions-item label="依赖类型">
            <el-tag :type="getDependencyTypeColor(selectedDependency.dependencyType)">
              {{ selectedDependency.dependencyType }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="依赖层级">
            <el-tag :type="getLevelColor(selectedDependency.dependencyLevel)">
              L{{ selectedDependency.dependencyLevel }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="影响范围" :span="2">
            <el-tag :type="getImpactColor(selectedDependency.impactScope)">
              {{ selectedDependency.impactScope }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="受影响标签数" :span="2">
            <el-badge :value="selectedDependency.affectedTags" class="item" />
          </el-descriptions-item>
          <el-descriptions-item label="依赖描述" :span="2">
            {{ selectedDependency.description }}
          </el-descriptions-item>
          <el-descriptions-item label="受影响标签列表" :span="2">
            <el-tag
              v-for="tag in selectedDependency.affectedTagList"
              :key="tag"
              class="mr-2 mb-2"
            >
              {{ tag }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 影响分析对话框 -->
    <el-dialog v-model="impactDialogVisible" title="影响分析" width="800px">
      <div v-if="selectedDependency">
        <h3 class="mb-4 font-semibold">
          标签 "{{ selectedDependency.sourceTag }}" 变更影响分析
        </h3>
        <el-alert
          :title="`预计影响 ${selectedDependency.affectedTags} 个标签的计算结果`"
          type="warning"
          :closable="false"
          class="mb-4"
        />
        <el-table :data="impactAnalysisData" stripe>
          <el-table-column prop="tagName" label="受影响标签" width="180" />
          <el-table-column prop="impactType" label="影响类型" width="120">
            <template #default="{ row }">
              <el-tag :type="row.impactType === '直接影响' ? 'danger' : 'warning'">
                {{ row.impactType }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="impactLevel" label="影响程度" width="120">
            <template #default="{ row }">
              <el-progress
                :percentage="row.impactLevel"
                :color="getImpactLevelColor(row.impactLevel)"
                :stroke-width="8"
              />
            </template>
          </el-table-column>
          <el-table-column prop="description" label="影响说明" />
        </el-table>
      </div>
    </el-dialog>

    <!-- 依赖图谱对话框 -->
    <el-dialog v-model="graphDialogVisible" title="标签依赖图谱" width="900px">
      <div class="graph-view">
        <p class="text-gray-600 mb-4">
          依赖图谱展示了标签之间的依赖关系，箭头方向表示依赖方向，颜色表示依赖类型
        </p>
        <div
          class="graph-placeholder flex items-center justify-center"
          style="height: 500px; background: #f5f5f5; border-radius: 4px;"
        >
          <div class="text-center">
            <el-icon :size="64" class="text-gray-400 mb-2"><Share /></el-icon>
            <p class="text-gray-500">标签依赖关系图谱</p>
            <p class="text-gray-400 text-sm mt-2">
              （此处可集成图形化展示组件，如 ECharts、D3.js、G6 等）
            </p>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Share } from '@element-plus/icons-vue'

interface TagDependency {
  sourceTag: string
  targetTag: string
  dependencyType: string
  dependencyLevel: number
  impactScope: string
  description: string
  affectedTags: number
  affectedTagList: string[]
}

interface ImpactAnalysis {
  tagName: string
  impactType: string
  impactLevel: number
  description: string
}

// Mock 数据
const mockData: TagDependency[] = [
  {
    sourceTag: '用户活跃度',
    targetTag: '高价值客户',
    dependencyType: '计算依赖',
    dependencyLevel: 1,
    impactScope: '高',
    description: '高价值客户的计算规则中使用了用户活跃度作为输入条件',
    affectedTags: 3,
    affectedTagList: ['高价值客户', '客户生命周期', '客户价值评分'],
  },
  {
    sourceTag: '产品偏好',
    targetTag: '用户活跃度',
    dependencyType: '业务依赖',
    dependencyLevel: 2,
    impactScope: '中',
    description: '产品偏好影响用户活跃度的计算逻辑',
    affectedTags: 2,
    affectedTagList: ['用户活跃度', '用户留存率'],
  },
  {
    sourceTag: '注册渠道',
    targetTag: '用户活跃度',
    dependencyType: '数据依赖',
    dependencyLevel: 1,
    impactScope: '低',
    description: '注册渠道数据是用户活跃度计算的参考因素',
    affectedTags: 1,
    affectedTagList: ['用户活跃度'],
  },
  {
    sourceTag: '流失风险',
    targetTag: '用户活跃度',
    dependencyType: '计算依赖',
    dependencyLevel: 1,
    impactScope: '高',
    description: '流失风险模型依赖用户活跃度数据作为特征输入',
    affectedTags: 2,
    affectedTagList: ['流失风险', '用户预警'],
  },
  {
    sourceTag: '高价值客户',
    targetTag: '流失风险',
    dependencyType: '业务依赖',
    dependencyLevel: 2,
    impactScope: '中',
    description: '高价值客户的流失风险计算需要考虑客户价值因素',
    affectedTags: 1,
    affectedTagList: ['流失风险'],
  },
]

const tableData = ref<TagDependency[]>(mockData)
const searchText = ref('')
const selectedDependencyType = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const detailDialogVisible = ref(false)
const impactDialogVisible = ref(false)
const graphDialogVisible = ref(false)
const selectedDependency = ref<TagDependency | null>(null)
const impactAnalysisData = ref<ImpactAnalysis[]>([])

const statistics = computed(() => {
  const total = tableData.value.length
  const circular = tableData.value.filter((item) => item.dependencyLevel > 3).length
  const highRisk = tableData.value.filter((item) => item.impactScope === '高').length
  const maxDepth = Math.max(...tableData.value.map((item) => item.dependencyLevel), 0)
  return {
    totalDependencies: total,
    circularDependencies: circular,
    highRiskTags: highRisk,
    maxDepth: maxDepth,
  }
})

const filteredTableData = computed(() => {
  let result = tableData.value

  if (searchText.value) {
    const keyword = searchText.value.toLowerCase()
    result = result.filter(
      (item) =>
        item.sourceTag.toLowerCase().includes(keyword) ||
        item.targetTag.toLowerCase().includes(keyword)
    )
  }

  if (selectedDependencyType.value) {
    result = result.filter((item) => item.dependencyType === selectedDependencyType.value)
  }

  return result
})

const getDependencyTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    计算依赖: 'danger',
    数据依赖: 'warning',
    业务依赖: 'info',
  }
  return colorMap[type] || ''
}

const getLevelColor = (level: number) => {
  if (level === 1) return 'success'
  if (level === 2) return 'warning'
  return 'danger'
}

const getImpactColor = (scope: string) => {
  const colorMap: Record<string, string> = {
    高: 'danger',
    中: 'warning',
    低: 'success',
  }
  return colorMap[scope] || ''
}

const getImpactLevelColor = (level: number) => {
  if (level >= 80) return '#f56c6c'
  if (level >= 50) return '#e6a23c'
  return '#67c23a'
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleAnalyze = () => {
  ElMessage.success('依赖关系分析完成')
}

const handleViewGraph = () => {
  graphDialogVisible.value = true
}

const handleViewDetail = (row: TagDependency) => {
  selectedDependency.value = row
  detailDialogVisible.value = true
}

const handleImpactAnalysis = (row: TagDependency) => {
  selectedDependency.value = row
  // Mock 影响分析数据
  impactAnalysisData.value = row.affectedTagList.map((tag, index) => ({
    tagName: tag,
    impactType: index === 0 ? '直接影响' : '间接影响',
    impactLevel: index === 0 ? 90 : 60 - index * 10,
    description: `标签 "${tag}" 的计算结果将受到 "${row.sourceTag}" 变更的影响`,
  }))
  impactDialogVisible.value = true
}
</script>

<style scoped lang="scss">
.tag-dependency {
  min-height: 100vh;
  background-color: #f5f5f5;
}
</style>

