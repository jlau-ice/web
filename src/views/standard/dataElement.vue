<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// 接口定义
interface DataElement {
  id: number
  elementName: string
  identifier: string
  dataType: string
  format: string
  valueRange: string
  category: string
  description: string
  status: 'enabled' | 'disabled'
  enabled: boolean
  createTime: string
  updateTime: string
}

interface SearchForm {
  keyword: string
  category: string
  dataType: string
  status: string
}

// 响应式数据
const loading = ref(false)
const tableData = ref<DataElement[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 搜索表单
const searchForm = reactive<SearchForm>({
  keyword: '',
  category: '',
  dataType: '',
  status: ''
})

// 弹窗相关
const dialogVisible = ref(false)
const dialogTitle = ref('新增数据元')
const formRef = ref<FormInstance>()

// 表单数据
const form = reactive<Partial<DataElement>>({
  id: undefined,
  elementName: '',
  identifier: '',
  dataType: '',
  format: '',
  valueRange: '',
  category: '',
  description: '',
  status: 'enabled',
  enabled: true
})

// 数据元分类选项
const categoryOptions = [
  { label: '基础信息', value: 'basic' },
  { label: '客户信息', value: 'customer' },
  { label: '产品信息', value: 'product' },
  { label: '订单信息', value: 'order' },
  { label: '财务信息', value: 'finance' },
  { label: '人力资源', value: 'hr' },
  { label: '地理位置', value: 'location' },
  { label: '时间日期', value: 'datetime' }
]

// 数据类型选项
const dataTypeOptions = [
  { label: '字符串', value: 'string' },
  { label: '整数', value: 'integer' },
  { label: '小数', value: 'decimal' },
  { label: '日期', value: 'date' },
  { label: '时间', value: 'time' },
  { label: '日期时间', value: 'datetime' },
  { label: '布尔值', value: 'boolean' },
  { label: '枚举', value: 'enum' }
]

// 状态选项
const statusOptions = [
  { label: '启用', value: 'enabled' },
  { label: '停用', value: 'disabled' }
]

// 表单验证规则
const rules = reactive<FormRules>({
  elementName: [
    { required: true, message: '请输入数据元名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  identifier: [
    { required: true, message: '请输入标识符', trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: '以字母开头，只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  dataType: [
    { required: true, message: '请选择数据类型', trigger: 'change' }
  ],
  category: [
    { required: true, message: '请选择所属分类', trigger: 'change' }
  ],
  format: [
    { required: true, message: '请输入数据格式', trigger: 'blur' }
  ]
})

// Mock 数据
const mockData: DataElement[] = [
  {
    id: 1,
    elementName: '客户姓名',
    identifier: 'customer_name',
    dataType: 'string',
    format: 'VARCHAR(100)',
    valueRange: '1-100个字符',
    category: 'customer',
    description: '客户的全名，包括姓氏和名字',
    status: 'enabled',
    enabled: true,
    createTime: '2024-01-15 10:30:00',
    updateTime: '2024-01-15 10:30:00'
  },
  {
    id: 2,
    elementName: '客户手机号',
    identifier: 'customer_phone',
    dataType: 'string',
    format: 'VARCHAR(11)',
    valueRange: '11位数字',
    category: 'customer',
    description: '客户的手机联系电话，用于身份验证和联系',
    status: 'enabled',
    enabled: true,
    createTime: '2024-01-16 14:20:00',
    updateTime: '2024-01-16 14:20:00'
  },
  {
    id: 3,
    elementName: '客户邮箱',
    identifier: 'customer_email',
    dataType: 'string',
    format: 'VARCHAR(200)',
    valueRange: '符合邮箱格式',
    category: 'customer',
    description: '客户的电子邮箱地址',
    status: 'enabled',
    enabled: true,
    createTime: '2024-01-17 09:15:00',
    updateTime: '2024-01-17 09:15:00'
  },
  {
    id: 4,
    elementName: '产品价格',
    identifier: 'product_price',
    dataType: 'decimal',
    format: 'DECIMAL(10,2)',
    valueRange: '0.00-9999999.99',
    category: 'product',
    description: '产品的销售价格，保留两位小数',
    status: 'enabled',
    enabled: true,
    createTime: '2024-01-18 11:45:00',
    updateTime: '2024-01-18 11:45:00'
  },
  {
    id: 5,
    elementName: '产品库存',
    identifier: 'product_stock',
    dataType: 'integer',
    format: 'INT',
    valueRange: '0-999999',
    category: 'product',
    description: '产品的当前库存数量',
    status: 'enabled',
    enabled: true,
    createTime: '2024-01-19 16:30:00',
    updateTime: '2024-01-19 16:30:00'
  },
  {
    id: 6,
    elementName: '订单金额',
    identifier: 'order_amount',
    dataType: 'decimal',
    format: 'DECIMAL(12,2)',
    valueRange: '0.00-99999999.99',
    category: 'order',
    description: '订单的总金额，含税',
    status: 'enabled',
    enabled: true,
    createTime: '2024-01-20 13:20:00',
    updateTime: '2024-01-20 13:20:00'
  },
  {
    id: 7,
    elementName: '订单日期',
    identifier: 'order_date',
    dataType: 'date',
    format: 'DATE',
    valueRange: 'YYYY-MM-DD',
    category: 'order',
    description: '订单的创建日期',
    status: 'enabled',
    enabled: true,
    createTime: '2024-01-21 10:00:00',
    updateTime: '2024-01-21 10:00:00'
  },
  {
    id: 8,
    elementName: '订单状态',
    identifier: 'order_status',
    dataType: 'enum',
    format: 'ENUM',
    valueRange: '待支付/已支付/已发货/已完成/已取消',
    category: 'order',
    description: '订单当前所处的状态',
    status: 'enabled',
    enabled: true,
    createTime: '2024-01-22 15:30:00',
    updateTime: '2024-01-22 15:30:00'
  },
  {
    id: 9,
    elementName: '员工工号',
    identifier: 'employee_id',
    dataType: 'string',
    format: 'VARCHAR(20)',
    valueRange: '6-20位字符',
    category: 'hr',
    description: '员工的唯一工号标识',
    status: 'enabled',
    enabled: true,
    createTime: '2024-01-23 09:20:00',
    updateTime: '2024-01-23 09:20:00'
  },
  {
    id: 10,
    elementName: '入职日期',
    identifier: 'hire_date',
    dataType: 'date',
    format: 'DATE',
    valueRange: 'YYYY-MM-DD',
    category: 'hr',
    description: '员工正式入职的日期',
    status: 'disabled',
    enabled: false,
    createTime: '2024-01-24 14:40:00',
    updateTime: '2024-01-24 14:40:00'
  },
  {
    id: 11,
    elementName: '身份证号',
    identifier: 'id_card_number',
    dataType: 'string',
    format: 'VARCHAR(18)',
    valueRange: '18位字符',
    category: 'basic',
    description: '公民身份证号码',
    status: 'enabled',
    enabled: true,
    createTime: '2024-01-25 11:15:00',
    updateTime: '2024-01-25 11:15:00'
  },
  {
    id: 12,
    elementName: '省份代码',
    identifier: 'province_code',
    dataType: 'string',
    format: 'CHAR(2)',
    valueRange: '2位数字',
    category: 'location',
    description: '省级行政区划代码',
    status: 'enabled',
    enabled: true,
    createTime: '2024-01-26 16:50:00',
    updateTime: '2024-01-26 16:50:00'
  }
]

// 计算属性：过滤后的数据
const filteredData = computed(() => {
  let data = [...mockData]
  
  // 关键字搜索
  if (searchForm.keyword) {
    const keyword = searchForm.keyword.toLowerCase()
    data = data.filter(item => 
      item.elementName.toLowerCase().includes(keyword) ||
      item.identifier.toLowerCase().includes(keyword) ||
      item.description.toLowerCase().includes(keyword) ||
      item.valueRange.toLowerCase().includes(keyword)
    )
  }
  
  // 分类筛选
  if (searchForm.category) {
    data = data.filter(item => item.category === searchForm.category)
  }
  
  // 数据类型筛选
  if (searchForm.dataType) {
    data = data.filter(item => item.dataType === searchForm.dataType)
  }
  
  // 状态筛选
  if (searchForm.status) {
    data = data.filter(item => item.status === searchForm.status)
  }
  
  return data
})

// 获取分类标签
const getCategoryLabel = (value: string) => {
  const option = categoryOptions.find(opt => opt.value === value)
  return option ? option.label : value
}

// 获取数据类型标签
const getDataTypeLabel = (value: string) => {
  const option = dataTypeOptions.find(opt => opt.value === value)
  return option ? option.label : value
}

// 获取数据类型颜色
const getDataTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    string: '',
    integer: 'success',
    decimal: 'warning',
    date: 'danger',
    time: 'danger',
    datetime: 'danger',
    boolean: 'info',
    enum: 'primary'
  }
  return colorMap[type] || ''
}

// 加载表格数据
const loadTableData = () => {
  loading.value = true
  
  // 模拟异步请求
  setTimeout(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    tableData.value = filteredData.value.slice(start, end)
    total.value = filteredData.value.length
    loading.value = false
  }, 300)
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  loadTableData()
}

// 重置搜索
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.category = ''
  searchForm.dataType = ''
  searchForm.status = ''
  currentPage.value = 1
  loadTableData()
}

// 分页改变
const handlePageChange = (page: number) => {
  currentPage.value = page
  loadTableData()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadTableData()
}

// 新增
const handleAdd = () => {
  dialogTitle.value = '新增数据元'
  resetForm()
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: DataElement) => {
  dialogTitle.value = '编辑数据元'
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

// 查看详情
const handleView = (row: DataElement) => {
  ElMessageBox.alert(
    `
      <div style="line-height: 2;">
        <p><strong>数据元名称：</strong>${row.elementName}</p>
        <p><strong>标识符：</strong><code style="padding: 2px 6px; background: #f5f7fa; border-radius: 3px;">${row.identifier}</code></p>
        <p><strong>数据类型：</strong>${getDataTypeLabel(row.dataType)}</p>
        <p><strong>数据格式：</strong>${row.format}</p>
        <p><strong>取值范围：</strong>${row.valueRange}</p>
        <p><strong>所属分类：</strong>${getCategoryLabel(row.category)}</p>
        <p><strong>描述信息：</strong>${row.description}</p>
        <p><strong>状态：</strong>${row.status === 'enabled' ? '启用' : '停用'}</p>
        <p><strong>创建时间：</strong>${row.createTime}</p>
        <p><strong>更新时间：</strong>${row.updateTime}</p>
      </div>
    `,
    '数据元详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '关闭'
    }
  )
}

// 删除
const handleDelete = (row: DataElement) => {
  ElMessageBox.confirm(
    `确定要删除数据元"${row.elementName}"吗？此操作不可恢复。`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    loading.value = true
    // 模拟删除操作
    setTimeout(() => {
      const index = mockData.findIndex(item => item.id === row.id)
      if (index > -1) {
        mockData.splice(index, 1)
      }
      loading.value = false
      ElMessage.success('删除成功')
      loadTableData()
    }, 500)
  }).catch(() => {
    // 取消删除
  })
}

// 切换状态
const handleStatusChange = (row: DataElement) => {
  loading.value = true
  // 模拟状态切换
  setTimeout(() => {
    const item = mockData.find(item => item.id === row.id)
    if (item) {
      item.enabled = row.enabled
      item.status = row.enabled ? 'enabled' : 'disabled'
      item.updateTime = new Date().toLocaleString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false 
      }).replace(/\//g, '-')
    }
    loading.value = false
    ElMessage.success(`已${row.enabled ? '启用' : '停用'}`)
    loadTableData()
  }, 300)
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      
      // 模拟保存操作
      setTimeout(() => {
        const currentTime = new Date().toLocaleString('zh-CN', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false 
        }).replace(/\//g, '-')
        
        if (form.id) {
          // 编辑
          const index = mockData.findIndex(item => item.id === form.id)
          if (index > -1) {
            mockData[index] = {
              ...mockData[index],
              ...form,
              updateTime: currentTime
            } as DataElement
          }
          ElMessage.success('编辑成功')
        } else {
          // 新增
          const newItem: DataElement = {
            id: Math.max(...mockData.map(item => item.id)) + 1,
            elementName: form.elementName!,
            identifier: form.identifier!,
            dataType: form.dataType!,
            format: form.format!,
            valueRange: form.valueRange!,
            category: form.category!,
            description: form.description!,
            status: form.enabled ? 'enabled' : 'disabled',
            enabled: form.enabled!,
            createTime: currentTime,
            updateTime: currentTime
          }
          mockData.unshift(newItem)
          ElMessage.success('新增成功')
        }
        
        loading.value = false
        dialogVisible.value = false
        loadTableData()
      }, 500)
    }
  })
}

// 取消
const handleCancel = () => {
  dialogVisible.value = false
  resetForm()
}

// 重置表单
const resetForm = () => {
  form.id = undefined
  form.elementName = ''
  form.identifier = ''
  form.dataType = ''
  form.format = ''
  form.valueRange = ''
  form.category = ''
  form.description = ''
  form.status = 'enabled'
  form.enabled = true
  
  formRef.value?.clearValidate()
}

// 生命周期
onMounted(() => {
  loadTableData()
})
</script>

<template>
  <div class="data-element-container">
    <!-- 页面标题 -->
    <el-card class="header-card" shadow="never">
      <div class="page-header">
        <div>
          <h2 class="page-title">数据元标准管理</h2>
          <p class="page-description">
            对组织中最基础的数据单元进行标准化定义，统一数据名称、标识、类型、格式和值域，消除理解歧义，实现数据的准确交换
          </p>
        </div>
      </div>
    </el-card>

    <!-- 搜索筛选区 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键字">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入数据元名称或标识符"
            clearable
            style="width: 240px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        
        <el-form-item label="所属分类">
          <el-select
            v-model="searchForm.category"
            placeholder="请选择分类"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="item in categoryOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="数据类型">
          <el-select
            v-model="searchForm.dataType"
            placeholder="请选择类型"
            clearable
            style="width: 130px"
          >
            <el-option
              v-for="item in dataTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格区 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">数据元列表</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增数据元
          </el-button>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        border
        style="width: 100%"
        :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        
        <el-table-column prop="elementName" label="数据元名称" min-width="130" show-overflow-tooltip />
        
        <el-table-column prop="identifier" label="标识符" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <code class="identifier-code">{{ row.identifier }}</code>
          </template>
        </el-table-column>
        
        <el-table-column prop="dataType" label="数据类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getDataTypeColor(row.dataType)" size="small">
              {{ getDataTypeLabel(row.dataType) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="format" label="格式" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <code class="format-code">{{ row.format }}</code>
          </template>
        </el-table-column>
        
        <el-table-column prop="valueRange" label="取值范围" min-width="150" show-overflow-tooltip />
        
        <el-table-column prop="category" label="所属分类" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="primary" size="small">{{ getCategoryLabel(row.category) }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.enabled"
              :loading="loading"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        
        <el-table-column prop="createTime" label="创建时间" width="160" show-overflow-tooltip />
        
        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              size="small"
              @click="handleView(row)"
            >
              <el-icon><View /></el-icon>
              详情
            </el-button>
            <el-button
              type="primary"
              link
              size="small"
              @click="handleEdit(row)"
            >
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button
              type="danger"
              link
              size="small"
              @click="handleDelete(row)"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="650px"
      :close-on-click-modal="false"
      @close="handleCancel"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="数据元名称" prop="elementName">
              <el-input
                v-model="form.elementName"
                placeholder="如：客户姓名"
                clearable
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="标识符" prop="identifier">
              <el-input
                v-model="form.identifier"
                placeholder="如：customer_name"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="数据类型" prop="dataType">
              <el-select
                v-model="form.dataType"
                placeholder="请选择数据类型"
                style="width: 100%"
              >
                <el-option
                  v-for="item in dataTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="所属分类" prop="category">
              <el-select
                v-model="form.category"
                placeholder="请选择所属分类"
                style="width: 100%"
              >
                <el-option
                  v-for="item in categoryOptions"
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
            <el-form-item label="数据格式" prop="format">
              <el-input
                v-model="form.format"
                placeholder="如：VARCHAR(100)"
                clearable
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="取值范围" prop="valueRange">
              <el-input
                v-model="form.valueRange"
                placeholder="如：1-100个字符"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="描述信息" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入数据元的详细描述"
          />
        </el-form-item>
        
        <el-form-item label="是否启用">
          <el-switch v-model="form.enabled" />
          <span style="margin-left: 10px; color: #909399; font-size: 13px">
            {{ form.enabled ? '启用' : '停用' }}
          </span>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" :loading="loading" @click="handleSubmit">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.data-element-container {
  min-height: calc(100vh - 120px);

  .header-card {
    margin-bottom: 16px;
    
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .page-title {
        margin: 0 0 8px 0;
        font-size: 20px;
        font-weight: 600;
        color: #303133;
      }

      .page-description {
        margin: 0;
        font-size: 14px;
        color: #606266;
        line-height: 1.6;
      }
    }
  }

  .search-card {
    margin-bottom: 16px;

    :deep(.el-form) {
      margin-bottom: 0;
    }

    :deep(.el-form-item) {
      margin-bottom: 0;
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
        color: #303133;
      }
    }

    .identifier-code,
    .format-code {
      padding: 2px 8px;
      background-color: #f5f7fa;
      border: 1px solid #e4e7ed;
      border-radius: 3px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 13px;
      color: #409eff;
    }

    .pagination-container {
      margin-top: 16px;
      display: flex;
      justify-content: flex-end;
    }
  }

  :deep(.el-card__body) {
    padding: 20px;
  }

  :deep(.el-table) {
    font-size: 14px;

    .el-button + .el-button {
      margin-left: 0;
    }
  }

  :deep(.el-dialog__body) {
    padding: 20px;
  }
}
</style>