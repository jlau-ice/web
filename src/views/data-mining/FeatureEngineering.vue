<template>
  <div class="page">
    <section class="intro card">
      <div>
        <h1>特征工程</h1>
        <p>
          从原始数据中提取、构造并筛选具备预测能力的特征，结合领域知识与自动化算法提升模型表达力、泛化能力与可解释性。
        </p>
      </div>
      <div class="intro-actions">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增特征</el-button>
        <el-button :icon="Refresh" @click="handleRefresh" :loading="refreshing">刷新</el-button>
        <el-button :icon="Download" @click="handleExport">导出特征</el-button>
      </div>
    </section>

    <section class="card">
      <div class="card-header">
        <h2>特征工作台</h2>
        <div>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索特征"
            clearable
            style="width: 200px; margin-right: 12px"
            :prefix-icon="Search"
          />
          <el-select v-model="filterType" placeholder="类型筛选" clearable style="width: 150px">
            <el-option label="全部" value="" />
            <el-option label="成功" value="success" />
            <el-option label="主要" value="primary" />
            <el-option label="警告" value="warning" />
            <el-option label="信息" value="info" />
            <el-option label="危险" value="danger" />
          </el-select>
        </div>
      </div>
      <div class="feature-tags">
        <el-tag
          v-for="feature in filteredFeatures"
          :key="feature.name"
          :type="feature.type"
          effect="dark"
          class="feature-tag"
          closable
          @close="handleDeleteFeature(feature)"
          @click="handleFeatureClick(feature)"
        >
          {{ feature.name }}
        </el-tag>
      </div>
      <div v-if="filteredFeatures.length === 0" class="empty-state">
        <el-empty description="暂无匹配的特征" />
      </div>
    </section>

    <section class="grid">
      <el-card class="card">
        <template #header>
          <div class="card-header">
            <span>自动构造特征</span>
            <el-button link type="primary" size="small" @click="handleAutoGenerate">生成特征</el-button>
          </div>
        </template>
        <ul class="list">
          <li v-for="item in autoFeatures" :key="item.title" class="list-item">
            <div>
              <strong>{{ item.title }}</strong>
              <span>{{ item.detail }}</span>
            </div>
            <el-button link type="primary" size="small" @click="handleApplyAuto(item)">应用</el-button>
          </li>
        </ul>
      </el-card>
      <el-card class="card">
        <template #header>
          <div class="card-header">
            <span>特征筛选结果</span>
            <el-button link type="primary" size="small" @click="handleRunSelection">执行筛选</el-button>
          </div>
        </template>
        <ul class="list">
          <li v-for="item in selection" :key="item.title" class="list-item">
            <div>
              <strong>{{ item.title }}</strong>
              <span>{{ item.detail }}</span>
            </div>
            <el-button link type="primary" size="small" @click="handleViewSelection(item)">查看</el-button>
          </li>
        </ul>
      </el-card>
    </section>

    <section class="card">
      <div class="card-header">
        <h2>特征测试与验证</h2>
        <el-button type="primary" @click="handleTestFeatures" :loading="testing">批量测试</el-button>
      </div>
      <el-table :data="testResults" border>
        <el-table-column prop="feature" label="特征名称" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === '通过' ? 'success' : row.status === '警告' ? 'warning' : 'danger'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="score" label="评分" width="120">
          <template #default="{ row }">
            <el-progress :percentage="row.score" :stroke-width="14" :text-inside="true" />
          </template>
        </el-table-column>
        <el-table-column prop="message" label="验证信息" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleTestDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <!-- 新增特征对话框 -->
    <el-dialog v-model="dialogVisible" title="新增特征" width="600px">
      <el-form :model="formData" label-width="100px">
        <el-form-item label="特征名称" required>
          <el-input v-model="formData.name" placeholder="请输入特征名称" />
        </el-form-item>
        <el-form-item label="特征类型" required>
          <el-select v-model="formData.type" placeholder="请选择类型">
            <el-option label="成功" value="success" />
            <el-option label="主要" value="primary" />
            <el-option label="警告" value="warning" />
            <el-option label="信息" value="info" />
            <el-option label="危险" value="danger" />
          </el-select>
        </el-form-item>
        <el-form-item label="特征描述">
          <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入特征描述" />
        </el-form-item>
        <el-form-item label="计算公式">
          <el-input v-model="formData.formula" placeholder="例如：近7天销量 / 总销量" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 特征详情对话框 -->
    <el-dialog v-model="detailVisible" title="特征详情" width="500px">
      <div v-if="selectedFeature" class="detail-content">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="特征名称">{{ selectedFeature.name }}</el-descriptions-item>
          <el-descriptions-item label="特征类型">
            <el-tag :type="selectedFeature.type">{{ selectedFeature.type }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedFeature.description" label="描述">
            {{ selectedFeature.description }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Download, Search } from '@element-plus/icons-vue'

const featureStore = ref([
  { name: '近 7 天销量', type: 'success', description: '统计近7天的销售总量' },
  { name: '渠道占比', type: 'primary', description: '各渠道销售占比' },
  { name: '促销力度', type: 'warning', description: '促销活动的影响程度' },
  { name: '原材料交付周期', type: 'info', description: '原材料从下单到交付的时间' },
  { name: '天气指数', type: 'danger', description: '天气对需求的影响指数' },
  { name: '节假日标签', type: 'success', description: '是否为节假日' },
  { name: '库存周转天数', type: 'primary', description: '库存周转所需天数' },
])

const autoFeatures = ref([
  { title: '滑动窗口', detail: '自动构建 7/14/28 天窗口均值与趋势特征，捕捉需求惯性。' },
  { title: '交叉特征', detail: '组合"渠道 × 区域"标签，刻画不同市场的敏感度。' },
  { title: '事件特征', detail: '对促销、天气、节假日打点并生成滞后变量，表征事件影响。' },
])

const selection = ref([
  { title: 'IV 过滤', detail: '剔除信息价值低于 0.02 的冗余特征，保留 64 项。' },
  { title: '相关性削减', detail: '通过皮尔逊与 VIF 降低共线性，确保可解释性。' },
  { title: 'SHAP 解释', detail: '输出 Top 10 影响因子，支持业务验证与调优。' },
])

const searchKeyword = ref('')
const filterType = ref('')
const refreshing = ref(false)
const testing = ref(false)
const dialogVisible = ref(false)
const detailVisible = ref(false)
const selectedFeature = ref<any>(null)

const formData = reactive({
  name: '',
  type: '',
  description: '',
  formula: '',
})

const testResults = ref([
  { feature: '近 7 天销量', status: '通过', score: 95, message: '特征有效性验证通过，相关性高' },
  { feature: '渠道占比', status: '通过', score: 88, message: '特征有效性验证通过' },
  { feature: '促销力度', status: '警告', score: 72, message: '存在一定相关性，建议优化' },
  { feature: '天气指数', status: '通过', score: 65, message: '特征有效性验证通过，但影响较小' },
])

const filteredFeatures = computed(() => {
  let result = featureStore.value
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter((item) => item.name.toLowerCase().includes(keyword))
  }
  if (filterType.value) {
    result = result.filter((item) => item.type === filterType.value)
  }
  return result
})

const handleAdd = () => {
  Object.assign(formData, {
    name: '',
    type: '',
    description: '',
    formula: '',
  })
  dialogVisible.value = true
}

const handleDeleteFeature = (feature: any) => {
  ElMessageBox.confirm(`确认删除特征"${feature.name}"？`, '确认删除', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      const index = featureStore.value.findIndex((item) => item.name === feature.name)
      if (index > -1) {
        featureStore.value.splice(index, 1)
        ElMessage.success('删除成功')
      }
    })
    .catch(() => {})
}

const handleFeatureClick = (feature: any) => {
  selectedFeature.value = feature
  detailVisible.value = true
}

const handleRefresh = async () => {
  refreshing.value = true
  await new Promise((resolve) => setTimeout(resolve, 1000))
  refreshing.value = false
  ElMessage.success('已刷新')
}

const handleExport = () => {
  ElMessage.success('特征导出功能（Mock）')
}

const handleAutoGenerate = () => {
  ElMessageBox.confirm('确认执行自动特征生成？这将基于当前数据自动创建新特征。', '确认操作', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
  })
    .then(() => {
      ElMessage.success('特征生成中，预计需要 2-3 分钟...')
    })
    .catch(() => {})
}

const handleApplyAuto = (item: any) => {
  ElMessage.success(`已应用：${item.title}`)
}

const handleRunSelection = () => {
  ElMessageBox.confirm('确认执行特征筛选？这将重新评估所有特征的重要性。', '确认操作', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
  })
    .then(() => {
      ElMessage.success('特征筛选执行中，预计需要 3-5 分钟...')
    })
    .catch(() => {})
}

const handleViewSelection = (item: any) => {
  ElMessage.info(`查看筛选结果：${item.title}`)
}

const handleTestFeatures = async () => {
  testing.value = true
  await new Promise((resolve) => setTimeout(resolve, 2000))
  testing.value = false
  ElMessage.success('特征测试完成')
}

const handleTestDetail = (row: any) => {
  ElMessageBox.alert(
    `特征：${row.feature}\n状态：${row.status}\n评分：${row.score}\n信息：${row.message}`,
    '测试详情',
    {
      confirmButtonText: '确定',
    }
  )
}

const handleSubmit = () => {
  if (!formData.name || !formData.type) {
    ElMessage.warning('请填写必填项')
    return
  }
  featureStore.value.push({
    name: formData.name,
    type: formData.type,
    description: formData.description || '',
  })
  ElMessage.success('新增成功')
  dialogVisible.value = false
}
</script>

<style scoped>
.page {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #f5f7fa;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
}

.intro {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.intro-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
}

.feature-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  min-height: 60px;
}

.feature-tag {
  cursor: pointer;
  transition: transform 0.2s;
}

.feature-tag:hover {
  transform: scale(1.05);
}

.empty-state {
  padding: 40px 0;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px;
  border-radius: 8px;
  transition: background 0.3s;
}

.list-item:hover {
  background: #f5f7fa;
}

.list li {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  color: #606266;
}

.list strong {
  color: #303133;
}

.detail-content {
  padding: 8px 0;
}
</style>

