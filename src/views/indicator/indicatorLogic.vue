<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Search, Refresh, Plus, Edit, Delete, Check, Close } from '@element-plus/icons-vue'

// 类型定义
interface IndicatorLogic {
  id: number
  indicatorName: string
  indicatorCode: string
  calculationScope: string
  formulaExpression: string
  calculationPeriod: string
  dataType: string
  calculationMethod: string
  updateFrequency: string
  status: number
  enabled: boolean
  updateTime: string
}

interface IndicatorOption {
  id: number
  name: string
  code: string
}

interface SearchForm {
  indicatorName: string
  indicatorCode: string
  status: number | null
  dateRange: string[]
}

interface FormulaVariable {
  label: string
  value: string
  type: string
}

// 枚举选项
const calculationMethods = [
  { label: '汇总', value: 'sum' },
  { label: '平均', value: 'avg' },
  { label: '同比', value: 'yoy' },
  { label: '环比', value: 'mom' },
  { label: '最大值', value: 'max' },
  { label: '最小值', value: 'min' },
  { label: '计数', value: 'count' }
]

const dataTypes = [
  { label: '数值', value: 'number' },
  { label: '比例', value: 'ratio' },
  { label: '金额', value: 'amount' },
  { label: '百分比', value: 'percentage' }
]

const updateFrequencies = [
  { label: '日', value: 'daily' },
  { label: '周', value: 'weekly' },
  { label: '月', value: 'monthly' },
  { label: '季度', value: 'quarterly' },
  { label: '年', value: 'yearly' }
]

const statusOptions = [
  { label: '全部', value: null },
  { label: '启用', value: 1 },
  { label: '禁用', value: 0 }
]

// Mock 数据 - 指标选项
const mockIndicatorOptions: IndicatorOption[] = [
  { id: 1, name: '销售额', code: 'SALES_AMOUNT' },
  { id: 2, name: '销售量', code: 'SALES_VOLUME' },
  { id: 3, name: '客单价', code: 'AVG_ORDER_VALUE' },
  { id: 4, name: '转化率', code: 'CONVERSION_RATE' },
  { id: 5, name: '客户数', code: 'CUSTOMER_COUNT' },
  { id: 6, name: '利润率', code: 'PROFIT_MARGIN' },
  { id: 7, name: '库存周转率', code: 'INVENTORY_TURNOVER' },
  { id: 8, name: '复购率', code: 'REPURCHASE_RATE' }
]

// Mock 数据 - 指标逻辑列表
const mockIndicatorLogics: IndicatorLogic[] = [
  {
    id: 1,
    indicatorName: '销售额',
    indicatorCode: 'SALES_AMOUNT',
    calculationScope: '全渠道销售总额',
    formulaExpression: 'SUM(订单金额)',
    calculationPeriod: '日',
    dataType: '金额',
    calculationMethod: 'sum',
    updateFrequency: 'daily',
    status: 1,
    enabled: true,
    updateTime: '2025-01-15 10:30:00'
  },
  {
    id: 2,
    indicatorName: '客单价',
    indicatorCode: 'AVG_ORDER_VALUE',
    calculationScope: '平均每个订单的金额',
    formulaExpression: 'SUM(订单金额) / COUNT(订单数)',
    calculationPeriod: '日',
    dataType: '金额',
    calculationMethod: 'avg',
    updateFrequency: 'daily',
    status: 1,
    enabled: true,
    updateTime: '2025-01-15 09:20:00'
  },
  {
    id: 3,
    indicatorName: '转化率',
    indicatorCode: 'CONVERSION_RATE',
    calculationScope: '访问用户的购买转化率',
    formulaExpression: '(COUNT(购买用户) / COUNT(访问用户)) * 100',
    calculationPeriod: '日',
    dataType: '百分比',
    calculationMethod: 'avg',
    updateFrequency: 'daily',
    status: 1,
    enabled: true,
    updateTime: '2025-01-15 08:45:00'
  },
  {
    id: 4,
    indicatorName: '销售额同比增长率',
    indicatorCode: 'SALES_YOY',
    calculationScope: '销售额同比增长率',
    formulaExpression: '((本期销售额 - 去年同期销售额) / 去年同期销售额) * 100',
    calculationPeriod: '月',
    dataType: '百分比',
    calculationMethod: 'yoy',
    updateFrequency: 'monthly',
    status: 1,
    enabled: true,
    updateTime: '2025-01-14 16:30:00'
  },
  {
    id: 5,
    indicatorName: '利润率',
    indicatorCode: 'PROFIT_MARGIN',
    calculationScope: '销售利润率',
    formulaExpression: '((销售额 - 成本) / 销售额) * 100',
    calculationPeriod: '月',
    dataType: '百分比',
    calculationMethod: 'avg',
    updateFrequency: 'monthly',
    status: 0,
    enabled: false,
    updateTime: '2025-01-13 14:20:00'
  },
  {
    id: 6,
    indicatorName: '复购率',
    indicatorCode: 'REPURCHASE_RATE',
    calculationScope: '客户复购率',
    formulaExpression: '(COUNT(复购客户) / COUNT(总客户)) * 100',
    calculationPeriod: '月',
    dataType: '百分比',
    calculationMethod: 'avg',
    updateFrequency: 'monthly',
    status: 1,
    enabled: true,
    updateTime: '2025-01-12 11:10:00'
  }
]

// 公式构建器 - 可用变量
const formulaVariables: FormulaVariable[] = [
  { label: '订单金额', value: '订单金额', type: 'field' },
  { label: '订单数', value: '订单数', type: 'field' },
  { label: '购买用户', value: '购买用户', type: 'field' },
  { label: '访问用户', value: '访问用户', type: 'field' },
  { label: '本期销售额', value: '本期销售额', type: 'field' },
  { label: '去年同期销售额', value: '去年同期销售额', type: 'field' },
  { label: '销售额', value: '销售额', type: 'field' },
  { label: '成本', value: '成本', type: 'field' },
  { label: '复购客户', value: '复购客户', type: 'field' },
  { label: '总客户', value: '总客户', type: 'field' }
]

// 公式构建器 - 运算符
const formulaOperators = [
  { label: '+', value: '+', type: 'operator' },
  { label: '-', value: '-', type: 'operator' },
  { label: '*', value: '*', type: 'operator' },
  { label: '/', value: '/', type: 'operator' },
  { label: '(', value: '(', type: 'operator' },
  { label: ')', value: ')', type: 'operator' }
]

// 公式构建器 - 函数
const formulaFunctions = [
  { label: 'SUM', value: 'SUM()', type: 'function' },
  { label: 'AVG', value: 'AVG()', type: 'function' },
  { label: 'COUNT', value: 'COUNT()', type: 'function' },
  { label: 'MAX', value: 'MAX()', type: 'function' },
  { label: 'MIN', value: 'MIN()', type: 'function' }
]

// 状态数据
const loading = ref(false)
const tableData = ref<IndicatorLogic[]>([])
const indicatorOptions = ref<IndicatorOption[]>([])

// 搜索表单
const searchForm = reactive<SearchForm>({
  indicatorName: '',
  indicatorCode: '',
  status: null,
  dateRange: []
})

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 对话框
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref<FormInstance>()

// 表单数据
const formData = reactive<Partial<IndicatorLogic>>({
  id: undefined,
  indicatorName: '',
  indicatorCode: '',
  calculationScope: '',
  formulaExpression: '',
  calculationMethod: 'sum',
  dataType: 'number',
  updateFrequency: 'daily',
  enabled: true
})

// 表单验证规则
const formRules: FormRules = {
  indicatorName: [
    { required: true, message: '请选择指标名称', trigger: 'change' }
  ],
  calculationScope: [
    { required: true, message: '请输入计算口径', trigger: 'blur' }
  ],
  formulaExpression: [
    { required: true, message: '请输入公式表达式', trigger: 'blur' }
  ],
  calculationMethod: [
    { required: true, message: '请选择计算方式', trigger: 'change' }
  ],
  dataType: [
    { required: true, message: '请选择数据类型', trigger: 'change' }
  ],
  updateFrequency: [
    { required: true, message: '请选择更新频率', trigger: 'change' }
  ]
}

// 公式构建器对话框
const formulaBuilderVisible = ref(false)
const currentFormula = ref('')
const formulaCursorPos = ref(0)

// 计算属性 - 过滤后的数据
const filteredData = computed(() => {
  let data = [...mockIndicatorLogics]

  // 按指标名称筛选
  if (searchForm.indicatorName) {
    data = data.filter(item =>
      item.indicatorName.includes(searchForm.indicatorName)
    )
  }

  // 按指标编码筛选
  if (searchForm.indicatorCode) {
    data = data.filter(item =>
      item.indicatorCode.includes(searchForm.indicatorCode)
    )
  }

  // 按状态筛选
  if (searchForm.status !== null) {
    data = data.filter(item => item.status === searchForm.status)
  }

  // 按日期范围筛选
  if (searchForm.dateRange && searchForm.dateRange.length === 2) {
    const [startDate, endDate] = searchForm.dateRange
    data = data.filter(item => {
      const updateTime = new Date(item.updateTime).getTime()
      return updateTime >= new Date(startDate).getTime() &&
             updateTime <= new Date(endDate).getTime()
    })
  }

  return data
})

// 计算属性 - 分页后的数据
const paginatedData = computed(() => {
  const start = (pagination.currentPage - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return filteredData.value.slice(start, end)
})

// 方法 - 加载列表数据
const loadData = () => {
  loading.value = true

  // 模拟异步加载
  setTimeout(() => {
    tableData.value = paginatedData.value
    pagination.total = filteredData.value.length
    indicatorOptions.value = mockIndicatorOptions
    loading.value = false
  }, 300)
}

// 方法 - 搜索
const handleSearch = () => {
  pagination.currentPage = 1
  loadData()
}

// 方法 - 重置搜索
const handleReset = () => {
  searchForm.indicatorName = ''
  searchForm.indicatorCode = ''
  searchForm.status = null
  searchForm.dateRange = []
  handleSearch()
}

// 方法 - 分页改变
const handlePageChange = (page: number) => {
  pagination.currentPage = page
  loadData()
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.currentPage = 1
  loadData()
}

// 方法 - 新增
const handleAdd = () => {
  dialogTitle.value = '新增指标逻辑'
  Object.assign(formData, {
    id: undefined,
    indicatorName: '',
    indicatorCode: '',
    calculationScope: '',
    formulaExpression: '',
    calculationMethod: 'sum',
    dataType: 'number',
    updateFrequency: 'daily',
    enabled: true
  })
  dialogVisible.value = true
}

// 方法 - 编辑
const handleEdit = (row: IndicatorLogic) => {
  dialogTitle.value = '编辑指标逻辑'
  Object.assign(formData, {
    id: row.id,
    indicatorName: row.indicatorName,
    indicatorCode: row.indicatorCode,
    calculationScope: row.calculationScope,
    formulaExpression: row.formulaExpression,
    calculationMethod: row.calculationMethod,
    dataType: row.dataType,
    updateFrequency: row.updateFrequency,
    enabled: row.enabled
  })
  dialogVisible.value = true
}

// 方法 - 删除
const handleDelete = (row: IndicatorLogic) => {
  ElMessageBox.confirm(
    `确定要删除指标逻辑"${row.indicatorName}"吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 模拟删除操作
    setTimeout(() => {
      const index = mockIndicatorLogics.findIndex(item => item.id === row.id)
      if (index > -1) {
        mockIndicatorLogics.splice(index, 1)
      }
      ElMessage.success('删除成功')
      loadData()
    }, 300)
  }).catch(() => {
    // 取消删除
  })
}

// 方法 - 切换状态
const handleStatusChange = (row: IndicatorLogic) => {
  const statusText = row.enabled ? '启用' : '禁用'

  // 模拟状态切换
  setTimeout(() => {
    row.status = row.enabled ? 1 : 0
    ElMessage.success(`已${statusText}`)
    loadData()
  }, 300)
}

// 方法 - 指标名称改变
const handleIndicatorChange = (name: string) => {
  const indicator = indicatorOptions.value.find(item => item.name === name)
  if (indicator) {
    formData.indicatorCode = indicator.code
  }
}

// 方法 - 打开公式构建器
const openFormulaBuilder = () => {
  currentFormula.value = formData.formulaExpression || ''
  formulaBuilderVisible.value = true
}

// 方法 - 插入公式元素
const insertFormulaElement = (value: string) => {
  const textarea = document.querySelector('.formula-input') as HTMLTextAreaElement
  if (textarea) {
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = currentFormula.value

    currentFormula.value = text.substring(0, start) + value + text.substring(end)

    // 设置光标位置
    setTimeout(() => {
      const newPos = start + value.length
      textarea.setSelectionRange(newPos, newPos)
      textarea.focus()
    }, 0)
  } else {
    currentFormula.value += value
  }
}

// 方法 - 确认公式
const confirmFormula = () => {
  formData.formulaExpression = currentFormula.value
  formulaBuilderVisible.value = false
  ElMessage.success('公式已更新')
}

// 方法 - 保存表单
const handleSubmit = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      loading.value = true

      // 模拟保存操作
      setTimeout(() => {
        if (formData.id) {
          // 编辑
          const index = mockIndicatorLogics.findIndex(item => item.id === formData.id)
          if (index > -1) {
            Object.assign(mockIndicatorLogics[index], {
              ...formData,
              status: formData.enabled ? 1 : 0,
              updateTime: new Date().toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              }).replace(/\//g, '-')
            })
          }
          ElMessage.success('编辑成功')
        } else {
          // 新增
          const newId = Math.max(...mockIndicatorLogics.map(item => item.id)) + 1
          const calculationPeriod = updateFrequencies.find(
            item => item.value === formData.updateFrequency
          )?.label || '日'
          const dataTypeLabel = dataTypes.find(
            item => item.value === formData.dataType
          )?.label || '数值'

          mockIndicatorLogics.unshift({
            id: newId,
            indicatorName: formData.indicatorName!,
            indicatorCode: formData.indicatorCode!,
            calculationScope: formData.calculationScope!,
            formulaExpression: formData.formulaExpression!,
            calculationPeriod,
            dataType: dataTypeLabel,
            calculationMethod: formData.calculationMethod!,
            updateFrequency: formData.updateFrequency!,
            status: formData.enabled ? 1 : 0,
            enabled: formData.enabled!,
            updateTime: new Date().toLocaleString('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            }).replace(/\//g, '-')
          })
          ElMessage.success('新增成功')
        }

        loading.value = false
        dialogVisible.value = false
        loadData()
      }, 500)
    }
  })
}

// 方法 - 关闭对话框
const handleDialogClose = () => {
  formRef.value?.resetFields()
  dialogVisible.value = false
}

// 生命周期
onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="indicator-logic-container">
    <!-- 搜索区域 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline>
        <el-form-item label="指标名称">
          <el-input
            v-model="searchForm.indicatorName"
            placeholder="请输入指标名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item label="指标编码">
          <el-input
            v-model="searchForm.indicatorCode"
            placeholder="请输入指标编码"
            clearable
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="更新时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 260px"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">
            搜索
          </el-button>
          <el-button :icon="Refresh" @click="handleReset">
            重置
          </el-button>
          <el-button type="success" :icon="Plus" @click="handleAdd">
            新增
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格区域 -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />

        <el-table-column prop="indicatorName" label="指标名称" min-width="120" />

        <el-table-column prop="indicatorCode" label="指标编码" min-width="140" />

        <el-table-column prop="calculationScope" label="计算口径" min-width="150" show-overflow-tooltip />

        <el-table-column prop="formulaExpression" label="公式表达式" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag type="info" effect="plain">{{ row.formulaExpression }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="calculationPeriod" label="计算周期" width="100" align="center" />

        <el-table-column prop="dataType" label="数据类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.dataType === '金额'" type="success">{{ row.dataType }}</el-tag>
            <el-tag v-else-if="row.dataType === '百分比'" type="warning">{{ row.dataType }}</el-tag>
            <el-tag v-else type="info">{{ row.dataType }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.enabled"
              :active-icon="Check"
              :inactive-icon="Close"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>

        <el-table-column prop="updateTime" label="最后更新时间" width="160" align="center" />

        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              :icon="Edit"
              size="small"
              link
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              :icon="Delete"
              size="small"
              link
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      :close-on-click-modal="false"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="指标名称" prop="indicatorName">
              <el-select
                v-model="formData.indicatorName"
                placeholder="请选择指标名称"
                style="width: 100%"
                @change="handleIndicatorChange"
              >
                <el-option
                  v-for="item in indicatorOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.name"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="指标编码">
              <el-input
                v-model="formData.indicatorCode"
                placeholder="自动生成"
                disabled
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="计算口径" prop="calculationScope">
          <el-input
            v-model="formData.calculationScope"
            placeholder="请输入计算口径描述"
            type="textarea"
            :rows="2"
          />
        </el-form-item>

        <el-form-item label="计算公式" prop="formulaExpression">
          <el-input
            v-model="formData.formulaExpression"
            placeholder="请输入计算公式或点击右侧按钮打开公式构建器"
            type="textarea"
            :rows="3"
          >
            <template #append>
              <el-button @click="openFormulaBuilder">公式构建器</el-button>
            </template>
          </el-input>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="计算方式" prop="calculationMethod">
              <el-select
                v-model="formData.calculationMethod"
                placeholder="请选择计算方式"
                style="width: 100%"
              >
                <el-option
                  v-for="item in calculationMethods"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="数据类型" prop="dataType">
              <el-select
                v-model="formData.dataType"
                placeholder="请选择数据类型"
                style="width: 100%"
              >
                <el-option
                  v-for="item in dataTypes"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="更新频率" prop="updateFrequency">
              <el-select
                v-model="formData.updateFrequency"
                placeholder="请选择更新频率"
                style="width: 100%"
              >
                <el-option
                  v-for="item in updateFrequencies"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="是否启用">
              <el-switch
                v-model="formData.enabled"
                :active-icon="Check"
                :inactive-icon="Close"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="handleDialogClose">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 公式构建器对话框 -->
    <el-dialog
      v-model="formulaBuilderVisible"
      title="公式构建器"
      width="900px"
      :close-on-click-modal="false"
    >
      <div class="formula-builder">
        <el-row :gutter="20">
          <!-- 左侧 - 元素选择区 -->
          <el-col :span="10">
            <el-card shadow="never" class="builder-panel">
              <template #header>
                <div class="panel-header">可用元素</div>
              </template>

              <div class="element-section">
                <div class="section-title">字段变量</div>
                <div class="element-buttons">
                  <el-button
                    v-for="item in formulaVariables"
                    :key="item.value"
                    size="small"
                    @click="insertFormulaElement(item.value)"
                  >
                    {{ item.label }}
                  </el-button>
                </div>
              </div>

              <el-divider />

              <div class="element-section">
                <div class="section-title">运算符</div>
                <div class="element-buttons">
                  <el-button
                    v-for="item in formulaOperators"
                    :key="item.value"
                    size="small"
                    type="info"
                    @click="insertFormulaElement(item.value)"
                  >
                    {{ item.label }}
                  </el-button>
                </div>
              </div>

              <el-divider />

              <div class="element-section">
                <div class="section-title">聚合函数</div>
                <div class="element-buttons">
                  <el-button
                    v-for="item in formulaFunctions"
                    :key="item.value"
                    size="small"
                    type="success"
                    @click="insertFormulaElement(item.value)"
                  >
                    {{ item.label }}
                  </el-button>
                </div>
              </div>
            </el-card>
          </el-col>

          <!-- 右侧 - 公式编辑区 -->
          <el-col :span="14">
            <el-card shadow="never" class="builder-panel">
              <template #header>
                <div class="panel-header">公式编辑</div>
              </template>

              <el-input
                v-model="currentFormula"
                type="textarea"
                :rows="12"
                placeholder="点击左侧元素构建公式，或直接输入..."
                class="formula-input"
              />

              <div class="formula-tips">
                <el-alert
                  title="提示"
                  type="info"
                  :closable="false"
                  show-icon
                >
                  <template #default>
                    <div>示例公式：</div>
                    <div>1. 汇总：SUM(订单金额)</div>
                    <div>2. 平均：SUM(订单金额) / COUNT(订单数)</div>
                    <div>3. 同比：((本期销售额 - 去年同期销售额) / 去年同期销售额) * 100</div>
                  </template>
                </el-alert>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <template #footer>
        <el-button @click="formulaBuilderVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmFormula">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.indicator-logic-container {
  .search-card {
    margin-bottom: 20px;
  }

  .table-card {
    .pagination-container {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
    }
  }

  // 公式构建器样式
  .formula-builder {
    .builder-panel {
      height: 500px;
      overflow-y: auto;

      .panel-header {
        font-weight: bold;
        font-size: 16px;
      }

      .element-section {
        margin-bottom: 16px;

        .section-title {
          font-size: 14px;
          font-weight: 500;
          color: #606266;
          margin-bottom: 12px;
        }

        .element-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;

          .el-button {
            margin: 0;
          }
        }
      }

      .formula-input {
        :deep(textarea) {
          font-family: 'Courier New', monospace;
          font-size: 14px;
        }
      }

      .formula-tips {
        margin-top: 16px;

        .el-alert {
          :deep(.el-alert__content) {
            line-height: 1.8;
          }
        }
      }
    }
  }
}
</style>
