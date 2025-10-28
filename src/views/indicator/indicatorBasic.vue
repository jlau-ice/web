<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// ============== 类型定义 ==============
interface Category {
  id: number
  label: string
  children?: Category[]
}

interface Indicator {
  id: number
  name: string
  code: string
  categoryId: number
  categoryName: string
  description: string
  unit: string
  type: string
  department: string
  remark: string
  enabled: boolean
  creator: string
  createTime: string
}

interface SearchForm {
  name: string
  code: string
  categoryId: number | null
  enabled: string
}

interface IndicatorForm {
  id?: number
  name: string
  code: string
  categoryId: number | null
  description: string
  unit: string
  type: string
  department: string
  remark: string
  enabled: boolean
}

// ============== Mock 数据 ==============
const mockCategories: Category[] = [
  {
    id: 1,
    label: '业务域A',
    children: [
      { id: 11, label: '模块A1' },
      { id: 12, label: '模块A2' }
    ]
  },
  {
    id: 2,
    label: '业务域B',
    children: [
      { id: 21, label: '模块B1' },
      { id: 22, label: '模块B2' },
      { id: 23, label: '模块B3' }
    ]
  },
  {
    id: 3,
    label: '业务域C',
    children: [
      { id: 31, label: '模块C1' }
    ]
  }
]

const mockIndicators: Indicator[] = [
  {
    id: 1,
    name: '用户活跃度',
    code: 'IND_USER_ACTIVE_001',
    categoryId: 11,
    categoryName: '业务域A / 模块A1',
    description: '统计日活跃用户数占总用户数的比例',
    unit: '%',
    type: '比率指标',
    department: '产品部',
    remark: '用于衡量用户活跃情况',
    enabled: true,
    creator: '张三',
    createTime: '2024-01-15 10:30:00'
  },
  {
    id: 2,
    name: '订单转化率',
    code: 'IND_ORDER_CONV_002',
    categoryId: 12,
    categoryName: '业务域A / 模块A2',
    description: '成功下单用户数 / 访问用户数',
    unit: '%',
    type: '比率指标',
    department: '运营部',
    remark: '核心转化指标',
    enabled: true,
    creator: '李四',
    createTime: '2024-01-16 14:20:00'
  },
  {
    id: 3,
    name: '平均响应时间',
    code: 'IND_AVG_RESP_003',
    categoryId: 21,
    categoryName: '业务域B / 模块B1',
    description: '系统平均响应时间',
    unit: 'ms',
    type: '时间指标',
    department: '技术部',
    remark: '监控系统性能',
    enabled: false,
    creator: '王五',
    createTime: '2024-01-17 09:15:00'
  },
  {
    id: 4,
    name: '客单价',
    code: 'IND_AVG_PRICE_004',
    categoryId: 22,
    categoryName: '业务域B / 模块B2',
    description: '总销售额 / 订单数',
    unit: '元',
    type: '金额指标',
    department: '销售部',
    remark: '反映客户消费能力',
    enabled: true,
    creator: '赵六',
    createTime: '2024-01-18 16:45:00'
  },
  {
    id: 5,
    name: '库存周转率',
    code: 'IND_INV_TURN_005',
    categoryId: 23,
    categoryName: '业务域B / 模块B3',
    description: '销售成本 / 平均库存',
    unit: '次',
    type: '效率指标',
    department: '仓储部',
    remark: '衡量库存管理效率',
    enabled: true,
    creator: '孙七',
    createTime: '2024-01-19 11:00:00'
  }
]

// ============== 响应式数据 ==============
const loading = ref(false)
const tableData = ref<Indicator[]>([])
const categories = ref<Category[]>(mockCategories)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 搜索表单
const searchForm = reactive<SearchForm>({
  name: '',
  code: '',
  categoryId: null,
  enabled: ''
})

// 弹窗控制
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref<FormInstance>()

// 指标表单
const indicatorForm = reactive<IndicatorForm>({
  name: '',
  code: '',
  categoryId: null,
  description: '',
  unit: '',
  type: '',
  department: '',
  remark: '',
  enabled: true
})

// 详情弹窗
const detailVisible = ref(false)
const currentDetail = ref<Indicator | null>(null)

// 表单验证规则
const rules: FormRules = {
  name: [{ required: true, message: '请输入指标名称', trigger: 'blur' }],
  code: [
    { required: true, message: '请输入指标编码', trigger: 'blur' },
    { pattern: /^[A-Z_0-9]+$/, message: '编码只能包含大写字母、数字和下划线', trigger: 'blur' }
  ],
  categoryId: [{ required: true, message: '请选择所属分类', trigger: 'change' }],
  description: [{ required: true, message: '请输入口径描述', trigger: 'blur' }],
  unit: [{ required: true, message: '请输入单位', trigger: 'blur' }],
  type: [{ required: true, message: '请选择指标类型', trigger: 'change' }],
  department: [{ required: true, message: '请输入归属部门', trigger: 'blur' }]
}

// 指标类型选项
const typeOptions = [
  { label: '比率指标', value: '比率指标' },
  { label: '金额指标', value: '金额指标' },
  { label: '数量指标', value: '数量指标' },
  { label: '时间指标', value: '时间指标' },
  { label: '效率指标', value: '效率指标' }
]

// ============== 计算属性 ==============
// 分类映射表（用于快速查找分类路径）
const categoryMap = computed(() => {
  const map = new Map<number, string>()
  categories.value.forEach(parent => {
    map.set(parent.id, parent.label)
    if (parent.children) {
      parent.children.forEach(child => {
        map.set(child.id, `${parent.label} / ${child.label}`)
      })
    }
  })
  return map
})

// 分类树形选项（用于 el-tree-select）
const categoryTreeProps = {
  children: 'children',
  label: 'label',
  value: 'id'
}

// ============== 方法 ==============
// 模拟 API 请求
const mockApiRequest = <T>(data: T, delay = 500): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay)
  })
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    // 模拟过滤和分页
    let filteredData = [...mockIndicators]

    // 搜索过滤
    if (searchForm.name) {
      filteredData = filteredData.filter(item =>
        item.name.toLowerCase().includes(searchForm.name.toLowerCase())
      )
    }
    if (searchForm.code) {
      filteredData = filteredData.filter(item =>
        item.code.toLowerCase().includes(searchForm.code.toLowerCase())
      )
    }
    if (searchForm.categoryId) {
      filteredData = filteredData.filter(item => item.categoryId === searchForm.categoryId)
    }
    if (searchForm.enabled !== '') {
      filteredData = filteredData.filter(item =>
        item.enabled === (searchForm.enabled === 'true')
      )
    }

    total.value = filteredData.length

    // 分页
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    const pagedData = filteredData.slice(start, end)

    await mockApiRequest(pagedData)
    tableData.value = pagedData
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  loadData()
}

// 重置搜索
const handleReset = () => {
  searchForm.name = ''
  searchForm.code = ''
  searchForm.categoryId = null
  searchForm.enabled = ''
  currentPage.value = 1
  loadData()
}

// 分页变化
const handlePageChange = (page: number) => {
  currentPage.value = page
  loadData()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadData()
}

// 打开新增弹窗
const handleAdd = () => {
  dialogTitle.value = '新增指标'
  resetForm()
  dialogVisible.value = true
}

// 打开编辑弹窗
const handleEdit = (row: Indicator) => {
  dialogTitle.value = '编辑指标'
  Object.assign(indicatorForm, {
    id: row.id,
    name: row.name,
    code: row.code,
    categoryId: row.categoryId,
    description: row.description,
    unit: row.unit,
    type: row.type,
    department: row.department,
    remark: row.remark,
    enabled: row.enabled
  })
  dialogVisible.value = true
}

// 查看详情
const handleDetail = (row: Indicator) => {
  currentDetail.value = row
  detailVisible.value = true
}

// 删除
const handleDelete = async (row: Indicator) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除指标"${row.name}"吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    loading.value = true
    await mockApiRequest(true)

    const index = mockIndicators.findIndex(item => item.id === row.id)
    if (index > -1) {
      mockIndicators.splice(index, 1)
    }

    ElMessage.success('删除成功')
    loadData()
  } catch {
    // 用户取消删除
  } finally {
    loading.value = false
  }
}

// 状态切换
const handleStatusChange = async (row: Indicator) => {
  loading.value = true
  try {
    await mockApiRequest(true)

    const item = mockIndicators.find(item => item.id === row.id)
    if (item) {
      item.enabled = row.enabled
    }

    ElMessage.success(`已${row.enabled ? '启用' : '停用'}指标`)
    loadData()
  } catch {
    row.enabled = !row.enabled
    ElMessage.error('操作失败')
  } finally {
    loading.value = false
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      await mockApiRequest(true)

      if (indicatorForm.id) {
        // 编辑
        const index = mockIndicators.findIndex(item => item.id === indicatorForm.id)
        if (index > -1) {
          const categoryName = categoryMap.value.get(indicatorForm.categoryId!) || ''
          Object.assign(mockIndicators[index], {
            ...indicatorForm,
            categoryName
          })
        }
        ElMessage.success('编辑成功')
      } else {
        // 新增
        const newId = Math.max(...mockIndicators.map(item => item.id)) + 1
        const categoryName = categoryMap.value.get(indicatorForm.categoryId!) || ''
        mockIndicators.push({
          id: newId,
          ...indicatorForm,
          categoryName,
          creator: '当前用户',
          createTime: new Date().toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          }).replace(/\//g, '-')
        } as Indicator)
        ElMessage.success('新增成功')
      }

      dialogVisible.value = false
      loadData()
    } finally {
      loading.value = false
    }
  })
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.assign(indicatorForm, {
    id: undefined,
    name: '',
    code: '',
    categoryId: null,
    description: '',
    unit: '',
    type: '',
    department: '',
    remark: '',
    enabled: true
  })
}

// 关闭弹窗
const handleDialogClose = () => {
  resetForm()
}

// ============== 生命周期 ==============
onMounted(() => {
  loadData()
})
</script>

<template>
    <div class="indicator-basic-container">
        <!-- 搜索区域 -->
        <el-card class="search-card" shadow="never">
            <el-form :model="searchForm" inline>
                <el-form-item label="指标名称">
                    <el-input v-model="searchForm.name" placeholder="请输入指标名称" clearable style="width: 200px"
                        @keyup.enter="handleSearch" />
                </el-form-item>
                <el-form-item label="指标编码">
                    <el-input v-model="searchForm.code" placeholder="请输入指标编码" clearable style="width: 200px"
                        @keyup.enter="handleSearch" />
                </el-form-item>
                <el-form-item label="所属分类">
                    <el-tree-select v-model="searchForm.categoryId" :data="categories" :props="categoryTreeProps"
                        placeholder="请选择分类" clearable style="width: 200px" />
                </el-form-item>
                <el-form-item label="状态">
                    <el-select v-model="searchForm.enabled" placeholder="请选择状态" clearable style="width: 120px">
                        <el-option label="启用" value="true" />
                        <el-option label="停用" value="false" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleSearch">
                        <el-icon>
                            <Search />
                        </el-icon>
                        搜索
                    </el-button>
                    <el-button @click="handleReset">
                        <el-icon>
                            <Refresh />
                        </el-icon>
                        重置
                    </el-button>
                </el-form-item>
            </el-form>
        </el-card>
    
        <!-- 表格区域 -->
        <el-card class="table-card" shadow="never">
            <template #header>
                <div class="card-header">
                    <span class="card-title">指标列表</span>
                    <el-button type="primary" @click="handleAdd">
                        <el-icon>
                            <Plus />
                        </el-icon>
                        新增指标
                    </el-button>
                </div>
            </template>
    
            <el-table v-loading="loading" :data="tableData" border stripe style="width: 100%">
                <el-table-column type="index" label="序号" width="60" align="center" />
                <el-table-column prop="name" label="指标名称" min-width="150" show-overflow-tooltip />
                <el-table-column prop="code" label="指标编码" min-width="180" show-overflow-tooltip />
                <el-table-column prop="categoryName" label="所属分类" min-width="150" show-overflow-tooltip />
                <el-table-column prop="description" label="口径描述" min-width="200" show-overflow-tooltip />
                <el-table-column prop="unit" label="单位" width="80" align="center" />
                <el-table-column prop="type" label="类型" width="100" align="center">
                    <template #default="{ row }">
                        <el-tag>{{ row.type }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="creator" label="创建人" width="100" align="center" />
                <el-table-column prop="createTime" label="创建时间" width="160" align="center" />
                <el-table-column prop="enabled" label="状态" width="80" align="center">
                    <template #default="{ row }">
                        <el-switch v-model="row.enabled" :disabled="loading" @change="handleStatusChange(row)" />
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="200" align="center" fixed="right">
                    <template #default="{ row }">
                        <el-button type="primary" link @click="handleDetail(row)">
                            查看
                        </el-button>
                        <el-button type="primary" link @click="handleEdit(row)">
                            编辑
                        </el-button>
                        <el-button type="danger" link @click="handleDelete(row)">
                            删除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
    
            <!-- 分页 -->
            <div class="pagination-container">
                <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
                    :page-sizes="[10, 20, 50, 100]" :total="total" layout="total, sizes, prev, pager, next, jumper"
                    @current-change="handlePageChange" @size-change="handleSizeChange" />
            </div>
        </el-card>
    
        <!-- 新增/编辑弹窗 -->
        <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" :close-on-click-modal="false"
            @close="handleDialogClose">
            <el-form ref="formRef" :model="indicatorForm" :rules="rules" label-width="100px">
                <el-form-item label="指标名称" prop="name">
                    <el-input v-model="indicatorForm.name" placeholder="请输入指标名称" />
                </el-form-item>
                <el-form-item label="指标编码" prop="code">
                    <el-input v-model="indicatorForm.code" placeholder="如：IND_USER_ACTIVE_001" />
                </el-form-item>
                <el-form-item label="所属分类" prop="categoryId">
                    <el-tree-select v-model="indicatorForm.categoryId" :data="categories" :props="categoryTreeProps"
                        placeholder="请选择分类" style="width: 100%" />
                </el-form-item>
                <el-form-item label="口径描述" prop="description">
                    <el-input v-model="indicatorForm.description" type="textarea" :rows="3" placeholder="请输入指标口径描述" />
                </el-form-item>
                <el-form-item label="单位" prop="unit">
                    <el-input v-model="indicatorForm.unit" placeholder="如：%、元、次等" />
                </el-form-item>
                <el-form-item label="指标类型" prop="type">
                    <el-select v-model="indicatorForm.type" placeholder="请选择指标类型" style="width: 100%">
                        <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item label="归属部门" prop="department">
                    <el-input v-model="indicatorForm.department" placeholder="请输入归属部门" />
                </el-form-item>
                <el-form-item label="说明" prop="remark">
                    <el-input v-model="indicatorForm.remark" type="textarea" :rows="2" placeholder="请输入补充说明" />
                </el-form-item>
                <el-form-item label="是否启用" prop="enabled">
                    <el-switch v-model="indicatorForm.enabled" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" :loading="loading" @click="handleSubmit">
                    确定
                </el-button>
            </template>
        </el-dialog>
    
        <!-- 详情弹窗 -->
        <el-dialog v-model="detailVisible" title="指标详情" width="600px">
            <div v-if="currentDetail" class="detail-container">
                <el-descriptions :column="2" border>
                    <el-descriptions-item label="指标名称">
                        {{ currentDetail.name }}
                    </el-descriptions-item>
                    <el-descriptions-item label="指标编码">
                        {{ currentDetail.code }}
                    </el-descriptions-item>
                    <el-descriptions-item label="所属分类" :span="2">
                        {{ currentDetail.categoryName }}
                    </el-descriptions-item>
                    <el-descriptions-item label="单位">
                        {{ currentDetail.unit }}
                    </el-descriptions-item>
                    <el-descriptions-item label="指标类型">
                        <el-tag>{{ currentDetail.type }}</el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="归属部门">
                        {{ currentDetail.department }}
                    </el-descriptions-item>
                    <el-descriptions-item label="状态">
                        <el-tag :type="currentDetail.enabled ? 'success' : 'info'">
                            {{ currentDetail.enabled ? '启用' : '停用' }}
                        </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="创建人">
                        {{ currentDetail.creator }}
                    </el-descriptions-item>
                    <el-descriptions-item label="创建时间">
                        {{ currentDetail.createTime }}
                    </el-descriptions-item>
                    <el-descriptions-item label="口径描述" :span="2">
                        {{ currentDetail.description }}
                    </el-descriptions-item>
                    <el-descriptions-item label="说明" :span="2">
                        {{ currentDetail.remark || '-' }}
                    </el-descriptions-item>
                </el-descriptions>
            </div>
            <template #footer>
                <el-button @click="detailVisible = false">关闭</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<style scoped lang="scss">
.indicator-basic-container {
    .search-card {
        margin-bottom: 16px;

        :deep(.el-card__body) {
            padding-bottom: 2px;
        }
    }

    .table-card {
        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;

            .card-title {
                font-size: 16px;
                font-weight: 600;
            }
        }

        .pagination-container {
            margin-top: 16px;
            display: flex;
            justify-content: flex-end;
        }
    }

    .detail-container {
        :deep(.el-descriptions__label) {
            width: 120px;
            font-weight: 500;
        }
    }
}
</style>