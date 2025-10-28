<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Delete,
  Download,
  Star,
  View,
  Clock,
  TrendCharts,
  Folder,
  Document,
  Calendar,
  Filter,
  Close,
} from '@element-plus/icons-vue'

// 类型定义
interface Asset {
  id: string
  name: string
  type: string
  description: string
  catalog: string
  createTime: string
  updateTime: string
  owner: string
  matchScore?: number
  tags: string[]
}

interface SearchFilter {
  assetType: string
  catalog: string
  dateRange: [Date, Date] | null
}

interface SavedSearch {
  id: string
  keyword: string
  filters: SearchFilter
  name: string
  createTime: string
}

// 资产类型配置
const assetTypes = [
  { label: '全部类型', value: '', color: '' },
  { label: '数据表', value: 'table', color: '#409EFF' },
  { label: '数据视图', value: 'view', color: '#67C23A' },
  { label: '数据接口', value: 'api', color: '#E6A23C' },
  { label: '数据文件', value: 'file', color: '#F56C6C' },
  { label: '数据模型', value: 'model', color: '#909399' },
]

// 目录配置
const catalogs = [
  { label: '全部目录', value: '' },
  { label: '财务数据', value: 'finance' },
  { label: '用户数据', value: 'user' },
  { label: '产品数据', value: 'product' },
  { label: '运营数据', value: 'operation' },
  { label: '营销数据', value: 'marketing' },
]

// 搜索模式
const searchMode = ref<'fuzzy' | 'exact'>('fuzzy')
const searchModes = [
  { label: '模糊搜索', value: 'fuzzy' },
  { label: '精确搜索', value: 'exact' },
]

// 搜索相关状态
const searchKeyword = ref('')
const searchLoading = ref(false)
const showSuggestions = ref(false)
const searchHistory = ref<string[]>([])
const hotSearches = ref<string[]>([
  '用户订单数据',
  '财务报表',
  '产品销售统计',
  '用户行为分析',
  '营销活动数据',
])

// 筛选条件
const filters = ref<SearchFilter>({
  assetType: '',
  catalog: '',
  dateRange: null,
})

// 搜索结果
const searchResults = ref<Asset[]>([])
const totalResults = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 收藏的搜索条件
const savedSearches = ref<SavedSearch[]>([])

// 选中的资产（用于批量操作）
const selectedAssets = ref<string[]>([])

// Mock 数据生成
const generateMockAssets = (keyword: string): Asset[] => {
  const mockData: Asset[] = [
    {
      id: '1',
      name: '用户订单明细表',
      type: 'table',
      description: '记录用户所有订单的详细信息，包括订单编号、用户ID、商品信息、金额等',
      catalog: 'user',
      createTime: '2024-01-15 10:30:00',
      updateTime: '2024-10-20 15:45:00',
      owner: '张三',
      tags: ['订单', '用户', '交易'],
    },
    {
      id: '2',
      name: '财务月度报表视图',
      type: 'view',
      description: '汇总每月财务数据的视图，包含收入、支出、利润等核心财务指标',
      catalog: 'finance',
      createTime: '2024-02-20 09:15:00',
      updateTime: '2024-10-25 11:20:00',
      owner: '李四',
      tags: ['财务', '报表', '月度'],
    },
    {
      id: '3',
      name: '产品销售数据接口',
      type: 'api',
      description: '提供产品销售数据查询的REST API接口，支持按时间、地区、产品类别筛选',
      catalog: 'product',
      createTime: '2024-03-10 14:20:00',
      updateTime: '2024-10-22 16:30:00',
      owner: '王五',
      tags: ['产品', '销售', 'API'],
    },
    {
      id: '4',
      name: '用户行为分析数据',
      type: 'file',
      description: '用户在平台上的行为数据，包括浏览、点击、搜索、购买等行为轨迹',
      catalog: 'user',
      createTime: '2024-04-05 08:45:00',
      updateTime: '2024-10-26 09:50:00',
      owner: '赵六',
      tags: ['用户', '行为', '分析'],
    },
    {
      id: '5',
      name: '营销活动效果模型',
      type: 'model',
      description: '评估营销活动效果的机器学习模型，预测不同营销策略的转化率',
      catalog: 'marketing',
      createTime: '2024-05-12 13:00:00',
      updateTime: '2024-10-27 10:15:00',
      owner: '孙七',
      tags: ['营销', '模型', 'AI'],
    },
    {
      id: '6',
      name: '财务对账数据表',
      type: 'table',
      description: '用于财务对账的数据表，记录每笔交易的对账状态和差异信息',
      catalog: 'finance',
      createTime: '2024-06-18 11:30:00',
      updateTime: '2024-10-23 14:25:00',
      owner: '周八',
      tags: ['财务', '对账', '交易'],
    },
    {
      id: '7',
      name: '运营数据日报',
      type: 'view',
      description: '每日运营关键指标汇总，包括DAU、MAU、留存率、活跃度等',
      catalog: 'operation',
      createTime: '2024-07-22 10:00:00',
      updateTime: '2024-10-28 08:30:00',
      owner: '吴九',
      tags: ['运营', '日报', '指标'],
    },
    {
      id: '8',
      name: '产品库存数据接口',
      type: 'api',
      description: '实时查询产品库存信息的API，支持多仓库、多SKU的库存查询',
      catalog: 'product',
      createTime: '2024-08-15 15:20:00',
      updateTime: '2024-10-24 12:40:00',
      owner: '郑十',
      tags: ['产品', '库存', 'API'],
    },
    {
      id: '9',
      name: '用户画像标签文件',
      type: 'file',
      description: '用户画像标签数据，包含人口统计学特征、兴趣偏好、消费能力等标签',
      catalog: 'user',
      createTime: '2024-09-10 09:30:00',
      updateTime: '2024-10-21 16:00:00',
      owner: '冯十一',
      tags: ['用户', '画像', '标签'],
    },
    {
      id: '10',
      name: '销售预测模型',
      type: 'model',
      description: '基于历史销售数据的时间序列预测模型，预测未来销售趋势',
      catalog: 'product',
      createTime: '2024-10-01 14:15:00',
      updateTime: '2024-10-25 11:30:00',
      owner: '陈十二',
      tags: ['销售', '预测', '模型'],
    },
    {
      id: '11',
      name: '营销渠道转化数据',
      type: 'table',
      description: '各营销渠道的转化漏斗数据，追踪从曝光到转化的全链路',
      catalog: 'marketing',
      createTime: '2024-10-05 10:45:00',
      updateTime: '2024-10-26 15:20:00',
      owner: '楚十三',
      tags: ['营销', '转化', '渠道'],
    },
    {
      id: '12',
      name: '运营活动配置接口',
      type: 'api',
      description: '管理运营活动配置的接口，支持活动的增删改查和状态管理',
      catalog: 'operation',
      createTime: '2024-10-10 13:30:00',
      updateTime: '2024-10-27 09:45:00',
      owner: '卫十四',
      tags: ['运营', '活动', '配置'],
    },
  ]

  // 简单的搜索过滤和评分逻辑
  if (!keyword) {
    return mockData.map((item) => ({
      ...item,
      matchScore: 100,
    }))
  }

  const filtered = mockData.filter((item) => {
    const searchText = keyword.toLowerCase()
    const nameMatch = item.name.toLowerCase().includes(searchText)
    const descMatch = item.description.toLowerCase().includes(searchText)
    const tagMatch = item.tags.some((tag) =>
      tag.toLowerCase().includes(searchText)
    )
    return nameMatch || descMatch || tagMatch
  })

  // 计算匹配度评分
  return filtered.map((item) => {
    const searchText = keyword.toLowerCase()
    let score = 0

    // 名称完全匹配得分最高
    if (item.name.toLowerCase() === searchText) {
      score = 100
    } else if (item.name.toLowerCase().includes(searchText)) {
      score = 80
    } else if (item.description.toLowerCase().includes(searchText)) {
      score = 60
    } else if (
      item.tags.some((tag) => tag.toLowerCase().includes(searchText))
    ) {
      score = 40
    }

    return {
      ...item,
      matchScore: score,
    }
  })
}

// 计算属性：过滤后的搜索建议
const searchSuggestions = computed(() => {
  if (!searchKeyword.value) return []
  const keyword = searchKeyword.value.toLowerCase()
  return hotSearches.value
    .filter((item) => item.toLowerCase().includes(keyword))
    .slice(0, 5)
})

// 计算属性：分页后的结果
const paginatedResults = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return searchResults.value.slice(start, end)
})

// 获取资产类型颜色
const getAssetTypeColor = (type: string) => {
  const config = assetTypes.find((t) => t.value === type)
  return config?.color || '#909399'
}

// 获取资产类型标签
const getAssetTypeLabel = (type: string) => {
  const config = assetTypes.find((t) => t.value === type)
  return config?.label || type
}

// 高亮关键词
const highlightKeyword = (text: string, keyword: string) => {
  if (!keyword) return text
  const regex = new RegExp(`(${keyword})`, 'gi')
  return text.replace(regex, '<span class="highlight">$1</span>')
}

// 执行搜索
const performSearch = async () => {
  if (!searchKeyword.value.trim() && !filters.value.assetType && !filters.value.catalog) {
    return
  }

  searchLoading.value = true
  showSuggestions.value = false

  // 保存搜索历史
  if (searchKeyword.value.trim() && !searchHistory.value.includes(searchKeyword.value.trim())) {
    searchHistory.value.unshift(searchKeyword.value.trim())
    if (searchHistory.value.length > 10) {
      searchHistory.value = searchHistory.value.slice(0, 10)
    }
    localStorage.setItem('assetSearchHistory', JSON.stringify(searchHistory.value))
  }

  // 模拟异步请求
  setTimeout(() => {
    let results = generateMockAssets(searchKeyword.value)

    // 应用筛选条件
    if (filters.value.assetType) {
      results = results.filter((item) => item.type === filters.value.assetType)
    }
    if (filters.value.catalog) {
      results = results.filter((item) => item.catalog === filters.value.catalog)
    }
    if (filters.value.dateRange && filters.value.dateRange.length === 2) {
      const [startDate, endDate] = filters.value.dateRange
      results = results.filter((item) => {
        const itemDate = new Date(item.updateTime)
        return itemDate >= startDate && itemDate <= endDate
      })
    }

    // 按匹配度排序
    results.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))

    searchResults.value = results
    totalResults.value = results.length
    currentPage.value = 1
    searchLoading.value = false

    if (results.length === 0) {
      ElMessage.info('未找到匹配的资产')
    }
  }, 800)
}

// 清空搜索
const clearSearch = () => {
  searchKeyword.value = ''
  searchResults.value = []
  totalResults.value = 0
  currentPage.value = 1
  filters.value = {
    assetType: '',
    catalog: '',
    dateRange: null,
  }
}

// 清空搜索历史
const clearHistory = () => {
  ElMessageBox.confirm('确定要清空所有搜索历史吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    searchHistory.value = []
    localStorage.removeItem('assetSearchHistory')
    ElMessage.success('搜索历史已清空')
  })
}

// 使用历史记录搜索
const searchFromHistory = (keyword: string) => {
  searchKeyword.value = keyword
  performSearch()
}

// 使用热门搜索
const searchFromHot = (keyword: string) => {
  searchKeyword.value = keyword
  performSearch()
}

// 查看资产详情
const viewAssetDetail = (asset: Asset) => {
  ElMessageBox.alert(
    `
    <div style="line-height: 1.8">
      <p><strong>资产名称：</strong>${asset.name}</p>
      <p><strong>资产类型：</strong>${getAssetTypeLabel(asset.type)}</p>
      <p><strong>所属目录：</strong>${asset.catalog}</p>
      <p><strong>资产描述：</strong>${asset.description}</p>
      <p><strong>创建时间：</strong>${asset.createTime}</p>
      <p><strong>更新时间：</strong>${asset.updateTime}</p>
      <p><strong>负责人：</strong>${asset.owner}</p>
      <p><strong>标签：</strong>${asset.tags.join(', ')}</p>
      ${asset.matchScore ? `<p><strong>匹配度：</strong>${asset.matchScore}%</p>` : ''}
    </div>
  `,
    '资产详情',
    {
      confirmButtonText: '关闭',
      dangerouslyUseHTMLString: true,
    }
  )
}

// 预览资产
const previewAsset = (asset: Asset) => {
  ElMessage.info(`正在预览资产：${asset.name}`)
}

// 批量导出
const exportAssets = () => {
  if (searchResults.value.length === 0) {
    ElMessage.warning('没有可导出的搜索结果')
    return
  }

  ElMessage.success(
    `正在导出 ${searchResults.value.length} 条搜索结果，请稍候...`
  )
  // 这里可以实现实际的导出逻辑
}

// 保存搜索条件
const saveSearchCondition = () => {
  ElMessageBox.prompt('请输入搜索条件名称', '保存搜索条件', {
    confirmButtonText: '保存',
    cancelButtonText: '取消',
    inputPattern: /\S+/,
    inputErrorMessage: '请输入有效的名称',
  }).then(({ value }) => {
    const newSavedSearch: SavedSearch = {
      id: Date.now().toString(),
      keyword: searchKeyword.value,
      filters: { ...filters.value },
      name: value,
      createTime: new Date().toLocaleString(),
    }
    savedSearches.value.unshift(newSavedSearch)
    localStorage.setItem('savedSearches', JSON.stringify(savedSearches.value))
    ElMessage.success('搜索条件已保存')
  })
}

// 使用保存的搜索条件
const useSavedSearch = (saved: SavedSearch) => {
  searchKeyword.value = saved.keyword
  filters.value = { ...saved.filters }
  performSearch()
}

// 删除保存的搜索条件
const deleteSavedSearch = (id: string) => {
  savedSearches.value = savedSearches.value.filter((item) => item.id !== id)
  localStorage.setItem('savedSearches', JSON.stringify(savedSearches.value))
  ElMessage.success('已删除保存的搜索条件')
}

// 监听搜索框变化
watch(searchKeyword, (newVal) => {
  showSuggestions.value = newVal.length > 0
})

// 切换搜索模式
const toggleSearchMode = () => {
  if (searchResults.value.length > 0) {
    performSearch()
  }
}

// 组件挂载时加载历史记录
onMounted(() => {
  const historyStr = localStorage.getItem('assetSearchHistory')
  if (historyStr) {
    try {
      searchHistory.value = JSON.parse(historyStr)
    } catch (e) {
      console.error('Failed to parse search history:', e)
    }
  }

  const savedStr = localStorage.getItem('savedSearches')
  if (savedStr) {
    try {
      savedSearches.value = JSON.parse(savedStr)
    } catch (e) {
      console.error('Failed to parse saved searches:', e)
    }
  }
})
</script>

<template>
  <div class="asset-quick-search">
    <!-- 搜索区域 -->
    <div class="search-section">
      <el-card shadow="never" class="search-card">
        <div class="search-header">
          <h2 class="search-title">
            <el-icon><Search /></el-icon>
            资产快速检索
          </h2>
          <div class="search-mode">
            <el-radio-group v-model="searchMode" size="small" @change="toggleSearchMode">
              <el-radio-button
                v-for="mode in searchModes"
                :key="mode.value"
                :label="mode.value"
              >
                {{ mode.label }}
              </el-radio-button>
            </el-radio-group>
          </div>
        </div>

        <!-- 主搜索框 -->
        <div class="search-input-wrapper">
          <el-input
            v-model="searchKeyword"
            placeholder="请输入资产名称、描述或标签关键词..."
            size="large"
            class="search-input"
            clearable
            @keyup.enter="performSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
            <template #append>
              <el-button type="primary" :loading="searchLoading" @click="performSearch">
                搜索
              </el-button>
            </template>
          </el-input>

          <!-- 搜索建议 -->
          <div v-if="showSuggestions && searchSuggestions.length > 0" class="suggestions-dropdown">
            <div
              v-for="suggestion in searchSuggestions"
              :key="suggestion"
              class="suggestion-item"
              @click="searchFromHot(suggestion)"
            >
              <el-icon><Search /></el-icon>
              <span v-html="highlightKeyword(suggestion, searchKeyword)"></span>
            </div>
          </div>
        </div>

        <!-- 搜索历史和热门搜索 -->
        <div class="search-hints">
          <!-- 搜索历史 -->
          <div v-if="searchHistory.length > 0" class="hint-section">
            <div class="hint-header">
              <span class="hint-title">
                <el-icon><Clock /></el-icon>
                搜索历史
              </span>
              <el-button
                link
                type="danger"
                size="small"
                @click="clearHistory"
              >
                <el-icon><Delete /></el-icon>
                清空
              </el-button>
            </div>
            <div class="hint-tags">
              <el-tag
                v-for="(item, index) in searchHistory.slice(0, 8)"
                :key="index"
                class="hint-tag"
                @click="searchFromHistory(item)"
              >
                {{ item }}
              </el-tag>
            </div>
          </div>

          <!-- 热门搜索 -->
          <div class="hint-section">
            <div class="hint-header">
              <span class="hint-title">
                <el-icon><TrendCharts /></el-icon>
                热门搜索
              </span>
            </div>
            <div class="hint-tags">
              <el-tag
                v-for="(item, index) in hotSearches"
                :key="index"
                type="danger"
                effect="plain"
                class="hint-tag"
                @click="searchFromHot(item)"
              >
                {{ item }}
              </el-tag>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 筛选条件 -->
      <el-card shadow="never" class="filter-card">
        <div class="filter-header">
          <span class="filter-title">
            <el-icon><Filter /></el-icon>
            筛选条件
          </span>
          <div class="filter-actions">
            <el-button
              v-if="searchResults.length > 0"
              link
              type="primary"
              size="small"
              @click="saveSearchCondition"
            >
              <el-icon><Star /></el-icon>
              保存搜索条件
            </el-button>
            <el-button link type="info" size="small" @click="clearSearch">
              <el-icon><Close /></el-icon>
              重置
            </el-button>
          </div>
        </div>
        <el-row :gutter="16" class="filter-row">
          <el-col :span="8">
            <div class="filter-item">
              <label>资产类型：</label>
              <el-select
                v-model="filters.assetType"
                placeholder="请选择资产类型"
                clearable
                @change="performSearch"
              >
                <el-option
                  v-for="type in assetTypes"
                  :key="type.value"
                  :label="type.label"
                  :value="type.value"
                />
              </el-select>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="filter-item">
              <label>所属目录：</label>
              <el-select
                v-model="filters.catalog"
                placeholder="请选择所属目录"
                clearable
                @change="performSearch"
              >
                <el-option
                  v-for="catalog in catalogs"
                  :key="catalog.value"
                  :label="catalog.label"
                  :value="catalog.value"
                />
              </el-select>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="filter-item">
              <label>更新时间：</label>
              <el-date-picker
                v-model="filters.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                @change="performSearch"
              />
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 收藏的搜索条件 -->
      <el-card v-if="savedSearches.length > 0" shadow="never" class="saved-search-card">
        <div class="saved-search-header">
          <span class="saved-search-title">
            <el-icon><Star /></el-icon>
            收藏的搜索
          </span>
        </div>
        <div class="saved-search-list">
          <el-tag
            v-for="saved in savedSearches"
            :key="saved.id"
            class="saved-search-tag"
            closable
            @close="deleteSavedSearch(saved.id)"
            @click="useSavedSearch(saved)"
          >
            {{ saved.name }}
          </el-tag>
        </div>
      </el-card>
    </div>

    <!-- 搜索结果区域 -->
    <div v-if="searchResults.length > 0 || searchLoading" class="results-section">
      <!-- 结果统计和操作 -->
      <div class="results-header">
        <div class="results-stats">
          <span class="results-count">
            找到 <strong>{{ totalResults }}</strong> 条相关资产
          </span>
          <el-tag v-if="searchMode === 'exact'" type="info" size="small">精确搜索</el-tag>
          <el-tag v-else type="success" size="small">模糊搜索</el-tag>
        </div>
        <div class="results-actions">
          <el-button
            type="primary"
            size="small"
            :icon="Download"
            @click="exportAssets"
          >
            批量导出
          </el-button>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="searchLoading" class="loading-wrapper">
        <el-card
          v-for="i in 3"
          :key="i"
          shadow="hover"
          class="result-card skeleton"
        >
          <div class="skeleton-content">
            <div class="skeleton-line skeleton-title"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line"></div>
          </div>
        </el-card>
      </div>

      <!-- 搜索结果列表 -->
      <div v-else class="results-list">
        <el-card
          v-for="asset in paginatedResults"
          :key="asset.id"
          shadow="hover"
          class="result-card"
        >
          <div class="result-header">
            <div class="result-title-wrapper">
              <el-tag
                :color="getAssetTypeColor(asset.type)"
                class="type-tag"
                effect="dark"
              >
                {{ getAssetTypeLabel(asset.type) }}
              </el-tag>
              <h3
                class="result-title"
                v-html="highlightKeyword(asset.name, searchKeyword)"
              ></h3>
              <el-tooltip
                v-if="asset.matchScore"
                :content="`匹配度：${asset.matchScore}%`"
                placement="top"
              >
                <el-tag type="warning" size="small" class="match-score">
                  {{ asset.matchScore }}%
                </el-tag>
              </el-tooltip>
            </div>
            <div class="result-actions">
              <el-tooltip content="预览" placement="top">
                <el-button
                  link
                  type="primary"
                  :icon="View"
                  @click="previewAsset(asset)"
                />
              </el-tooltip>
              <el-tooltip content="查看详情" placement="top">
                <el-button
                  link
                  type="info"
                  :icon="Document"
                  @click="viewAssetDetail(asset)"
                />
              </el-tooltip>
            </div>
          </div>

          <div class="result-body">
            <p
              class="result-description"
              v-html="highlightKeyword(asset.description, searchKeyword)"
            ></p>
            <div class="result-meta">
              <div class="meta-item">
                <el-icon><Folder /></el-icon>
                <span>{{ asset.catalog }}</span>
              </div>
              <div class="meta-item">
                <el-icon><Calendar /></el-icon>
                <span>更新于 {{ asset.updateTime }}</span>
              </div>
              <div class="meta-item">
                <span>负责人：{{ asset.owner }}</span>
              </div>
            </div>
            <div class="result-tags">
              <el-tag
                v-for="tag in asset.tags"
                :key="tag"
                size="small"
                effect="plain"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 分页 -->
      <div v-if="!searchLoading && totalResults > pageSize" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="totalResults"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </div>

    <!-- 空状态 -->
    <div
      v-else-if="!searchLoading && searchResults.length === 0 && (searchKeyword || filters.assetType || filters.catalog)"
      class="empty-wrapper"
    >
      <el-empty description="未找到匹配的资产，请尝试其他搜索条件">
        <el-button type="primary" @click="clearSearch">重新搜索</el-button>
      </el-empty>
    </div>

    <!-- 初始状态 -->
    <div
      v-else-if="!searchLoading"
      class="initial-state"
    >
      <el-empty description="请输入关键词开始搜索资产">
        <template #image>
          <el-icon :size="100" color="#909399">
            <Search />
          </el-icon>
        </template>
      </el-empty>
    </div>
  </div>
</template>

<style scoped lang="scss">
.asset-quick-search {
  min-height: calc(100vh - 120px);
}

// 搜索区域
.search-section {
  margin-bottom: 20px;
}

.search-card {
  margin-bottom: 16px;
  border-radius: 8px;

  :deep(.el-card__body) {
    padding: 24px;
  }
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.search-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-mode {
  :deep(.el-radio-button__inner) {
    padding: 8px 16px;
  }
}

.search-input-wrapper {
  position: relative;
  margin-bottom: 24px;
}

.search-input {
  :deep(.el-input__wrapper) {
    padding: 12px 16px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    border-radius: 24px;
  }

  :deep(.el-input__inner) {
    font-size: 16px;
  }

  :deep(.el-input-group__append) {
    background: transparent;
    border: none;
    box-shadow: none;
    padding: 0 8px 0 0;

    .el-button {
      border-radius: 20px;
      padding: 10px 24px;
    }
  }
}

.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-top: 8px;
  z-index: 100;
  max-height: 300px;
  overflow-y: auto;
}

.suggestion-item {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: background 0.3s;

  &:hover {
    background: #f5f7fa;
  }

  :deep(.highlight) {
    color: #409eff;
    font-weight: 600;
  }
}

.search-hints {
  display: flex;
  gap: 24px;
}

.hint-section {
  flex: 1;
}

.hint-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.hint-title {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 4px;
}

.hint-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hint-tag {
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
}

// 筛选卡片
.filter-card {
  border-radius: 8px;
  margin-bottom: 16px;

  :deep(.el-card__body) {
    padding: 20px 24px;
  }
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.filter-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-actions {
  display: flex;
  gap: 8px;
}

.filter-row {
  margin: 0;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;

  label {
    font-size: 14px;
    color: #606266;
    white-space: nowrap;
  }

  .el-select,
  .el-date-picker {
    flex: 1;
  }
}

// 收藏的搜索
.saved-search-card {
  border-radius: 8px;

  :deep(.el-card__body) {
    padding: 16px 24px;
  }
}

.saved-search-header {
  margin-bottom: 12px;
}

.saved-search-title {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 4px;
}

.saved-search-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.saved-search-tag {
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
}

// 搜索结果区域
.results-section {
  background: transparent;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 16px 20px;
  background: white;
  border-radius: 8px;
}

.results-stats {
  display: flex;
  align-items: center;
  gap: 12px;
}

.results-count {
  font-size: 16px;
  color: #606266;

  strong {
    color: #409eff;
    font-size: 20px;
  }
}

.results-actions {
  display: flex;
  gap: 8px;
}

// 加载骨架屏
.loading-wrapper {
  .result-card.skeleton {
    margin-bottom: 16px;
    animation: pulse 1.5s infinite;
  }
}

.skeleton-content {
  .skeleton-line {
    height: 16px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4px;
    margin-bottom: 12px;

    &.skeleton-title {
      height: 24px;
      width: 60%;
    }

    &:last-child {
      margin-bottom: 0;
      width: 80%;
    }
  }
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

// 结果列表
.results-list {
  .result-card {
    margin-bottom: 16px;
    border-radius: 8px;
    transition: all 0.3s;
    border-left: 4px solid transparent;

    &:hover {
      border-left-color: #409eff;
      transform: translateX(4px);
    }

    :deep(.el-card__body) {
      padding: 20px;
    }
  }
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.result-title-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.type-tag {
  border: none;
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 12px;
}

.result-title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #303133;
  flex: 1;

  :deep(.highlight) {
    color: #409eff;
    background: #ecf5ff;
    padding: 2px 4px;
    border-radius: 2px;
  }
}

.match-score {
  font-weight: 600;
}

.result-actions {
  display: flex;
  gap: 4px;
}

.result-body {
  .result-description {
    font-size: 14px;
    color: #606266;
    line-height: 1.6;
    margin: 0 0 12px 0;

    :deep(.highlight) {
      color: #409eff;
      background: #ecf5ff;
      padding: 2px 4px;
      border-radius: 2px;
    }
  }

  .result-meta {
    display: flex;
    gap: 24px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: #909399;

    .el-icon {
      font-size: 14px;
    }
  }

  .result-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}

// 分页
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
  padding: 20px;
  background: white;
  border-radius: 8px;
}

// 空状态
.empty-wrapper {
  background: white;
  border-radius: 8px;
  padding: 60px 20px;
  text-align: center;
}

.initial-state {
  background: white;
  border-radius: 8px;
  padding: 80px 20px;
  text-align: center;
}

// 响应式设计
@media (max-width: 768px) {
  .search-hints {
    flex-direction: column;
    gap: 16px;
  }

  .filter-row {
    .el-col {
      margin-bottom: 12px;
    }
  }

  .results-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .result-header {
    flex-direction: column;
    gap: 12px;
  }

  .result-title-wrapper {
    flex-wrap: wrap;
  }

  .result-meta {
    flex-direction: column;
    gap: 8px;
  }
}
</style>