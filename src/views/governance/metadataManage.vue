<script setup lang="ts">
import {ref, reactive, computed, onMounted} from 'vue'
import {ElMessage, ElMessageBox} from 'element-plus'
import type {FormInstance, FormRules} from 'element-plus'

// 定义元数据接口
interface MetadataItem {
  id: number
  tableName: string
  fieldName: string
  fieldType: string
  fieldDescription: string
  businessTag: string[]
  isEnabled: boolean
  createTime: string
}

// 定义表单数据接口
interface MetadataForm {
  id?: number
  tableName: string
  fieldName: string
  fieldType: string
  fieldDescription: string
  businessTag: string[]
  isEnabled: boolean
}

// 搜索表单
const searchForm = reactive({
  keyword: '',
  tableName: '',
  businessTag: '',
  status: ''
})

// 分页数据
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 表格数据
const tableData = ref<MetadataItem[]>([])
const loading = ref(false)

// 弹窗控制
const dialogVisible = ref(false)
const dialogTitle = ref('新增元数据')
const formRef = ref<FormInstance>()

// 表单数据
const formData = reactive<MetadataForm>({
  tableName: '',
  fieldName: '',
  fieldType: '',
  fieldDescription: '',
  businessTag: [],
  isEnabled: true
})

// Mock 数据源
const mockData: MetadataItem[] = [
  {
    id: 1,
    tableName: 'user_info',
    fieldName: 'user_id',
    fieldType: 'bigint',
    fieldDescription: '用户唯一标识',
    businessTag: ['用户中心', '核心字段'],
    isEnabled: true,
    createTime: '2024-01-15 10:30:00'
  },
  {
    id: 2,
    tableName: 'user_info',
    fieldName: 'user_name',
    fieldType: 'varchar(50)',
    fieldDescription: '用户姓名',
    businessTag: ['用户中心', '基础信息'],
    isEnabled: true,
    createTime: '2024-01-15 10:30:00'
  },
  {
    id: 3,
    tableName: 'user_info',
    fieldName: 'email',
    fieldType: 'varchar(100)',
    fieldDescription: '用户邮箱地址',
    businessTag: ['用户中心', '联系方式'],
    isEnabled: true,
    createTime: '2024-01-15 10:30:00'
  },
  {
    id: 4,
    tableName: 'order_info',
    fieldName: 'order_id',
    fieldType: 'bigint',
    fieldDescription: '订单唯一标识',
    businessTag: ['订单中心', '核心字段'],
    isEnabled: true,
    createTime: '2024-02-10 14:20:00'
  },
  {
    id: 5,
    tableName: 'order_info',
    fieldName: 'order_amount',
    fieldType: 'decimal(10,2)',
    fieldDescription: '订单金额',
    businessTag: ['订单中心', '财务相关'],
    isEnabled: true,
    createTime: '2024-02-10 14:20:00'
  },
  {
    id: 6,
    tableName: 'order_info',
    fieldName: 'order_status',
    fieldType: 'tinyint',
    fieldDescription: '订单状态：0待付款 1已付款 2已发货 3已完成',
    businessTag: ['订单中心', '状态字段'],
    isEnabled: true,
    createTime: '2024-02-10 14:20:00'
  },
  {
    id: 7,
    tableName: 'product_info',
    fieldName: 'product_id',
    fieldType: 'bigint',
    fieldDescription: '商品唯一标识',
    businessTag: ['商品中心', '核心字段'],
    isEnabled: true,
    createTime: '2024-03-05 09:15:00'
  },
  {
    id: 8,
    tableName: 'product_info',
    fieldName: 'product_name',
    fieldType: 'varchar(200)',
    fieldDescription: '商品名称',
    businessTag: ['商品中心', '基础信息'],
    isEnabled: true,
    createTime: '2024-03-05 09:15:00'
  },
  {
    id: 9,
    tableName: 'product_info',
    fieldName: 'product_price',
    fieldType: 'decimal(10,2)',
    fieldDescription: '商品价格',
    businessTag: ['商品中心', '财务相关'],
    isEnabled: true,
    createTime: '2024-03-05 09:15:00'
  },
  {
    id: 10,
    tableName: 'product_info',
    fieldName: 'stock_quantity',
    fieldType: 'int',
    fieldDescription: '库存数量',
    businessTag: ['商品中心', '库存管理'],
    isEnabled: true,
    createTime: '2024-03-05 09:15:00'
  },
  {
    id: 11,
    tableName: 'user_info',
    fieldName: 'phone',
    fieldType: 'varchar(20)',
    fieldDescription: '用户手机号',
    businessTag: ['用户中心', '联系方式'],
    isEnabled: false,
    createTime: '2024-03-20 16:45:00'
  },
  {
    id: 12,
    tableName: 'order_info',
    fieldName: 'create_time',
    fieldType: 'datetime',
    fieldDescription: '订单创建时间',
    businessTag: ['订单中心', '时间字段'],
    isEnabled: true,
    createTime: '2024-04-01 11:30:00'
  }
]

// 字段类型选项
const fieldTypeOptions = [
  'bigint',
  'int',
  'varchar(50)',
  'varchar(100)',
  'varchar(200)',
  'decimal(10,2)',
  'datetime',
  'timestamp',
  'text',
  'tinyint'
]

// 业务标签选项
const businessTagOptions = [
  '用户中心',
  '订单中心',
  '商品中心',
  '核心字段',
  '基础信息',
  '联系方式',
  '财务相关',
  '状态字段',
  '库存管理',
  '时间字段'
]

// 状态选项
const statusOptions = [
  {label: '全部', value: ''},
  {label: '已启用', value: 'enabled'},
  {label: '已禁用', value: 'disabled'}
]

// 表单验证规则
const rules: FormRules = {
  tableName: [
    {required: true, message: '请输入表名', trigger: 'blur'},
    {pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/, message: '表名只能包含字母、数字和下划线，且不能以数字开头', trigger: 'blur'}
  ],
  fieldName: [
    {required: true, message: '请输入字段名', trigger: 'blur'},
    {pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/, message: '字段名只能包含字母、数字和下划线，且不能以数字开头', trigger: 'blur'}
  ],
  fieldType: [
    {required: true, message: '请选择字段类型', trigger: 'change'}
  ],
  fieldDescription: [
    {required: true, message: '请输入字段描述', trigger: 'blur'}
  ]
}

// 计算过滤后的数据
const filteredData = computed(() => {
  let data = [...mockData]

  // 关键字搜索
  if (searchForm.keyword) {
    const keyword = searchForm.keyword.toLowerCase()
    data = data.filter(item =>
      item.tableName.toLowerCase().includes(keyword) ||
      item.fieldName.toLowerCase().includes(keyword) ||
      item.fieldDescription.toLowerCase().includes(keyword)
    )
  }

  // 表名筛选
  if (searchForm.tableName) {
    data = data.filter(item => item.tableName === searchForm.tableName)
  }

  // 业务标签筛选
  if (searchForm.businessTag) {
    data = data.filter(item => item.businessTag.includes(searchForm.businessTag))
  }

  // 状态筛选
  if (searchForm.status) {
    const isEnabled = searchForm.status === 'enabled'
    data = data.filter(item => item.isEnabled === isEnabled)
  }

  return data
})

// 获取唯一的表名列表
const tableNameList = computed(() => {
  return Array.from(new Set(mockData.map(item => item.tableName)))
})

// 模拟加载数据
const loadData = () => {
  loading.value = true

  setTimeout(() => {
    const start = (pagination.currentPage - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    tableData.value = filteredData.value.slice(start, end)
    pagination.total = filteredData.value.length
    loading.value = false
  }, 300)
}

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1
  loadData()
}

// 重置搜索
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.tableName = ''
  searchForm.businessTag = ''
  searchForm.status = ''
  pagination.currentPage = 1
  loadData()
}

// 页码改变
const handleCurrentChange = (page: number) => {
  pagination.currentPage = page
  loadData()
}

// 每页条数改变
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.currentPage = 1
  loadData()
}

// 打开新增弹窗
const handleAdd = () => {
  dialogTitle.value = '新增元数据'
  resetForm()
  dialogVisible.value = true
}

// 打开编辑弹窗
const handleEdit = (row: MetadataItem) => {
  dialogTitle.value = '编辑元数据'
  Object.assign(formData, {
    id: row.id,
    tableName: row.tableName,
    fieldName: row.fieldName,
    fieldType: row.fieldType,
    fieldDescription: row.fieldDescription,
    businessTag: [...row.businessTag],
    isEnabled: row.isEnabled
  })
  dialogVisible.value = true
}

// 查看详情
const handleView = (row: MetadataItem) => {
  ElMessageBox.alert(
    `
    <div style="line-height: 1.8;">
      <p><strong>表名：</strong>${row.tableName}</p>
      <p><strong>字段名：</strong>${row.fieldName}</p>
      <p><strong>字段类型：</strong>${row.fieldType}</p>
      <p><strong>字段描述：</strong>${row.fieldDescription}</p>
      <p><strong>业务标签：</strong>${row.businessTag.join(', ')}</p>
      <p><strong>启用状态：</strong>${row.isEnabled ? '已启用' : '已禁用'}</p>
      <p><strong>创建时间：</strong>${row.createTime}</p>
    </div>
    `,
    '元数据详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '关闭'
    }
  )
}

// 删除
const handleDelete = (row: MetadataItem) => {
  ElMessageBox.confirm(
    `确定要删除 "${row.tableName}.${row.fieldName}" 吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 模拟删除操作
    setTimeout(() => {
      const index = mockData.findIndex(item => item.id === row.id)
      if (index > -1) {
        mockData.splice(index, 1)
      }
      ElMessage.success('删除成功')
      loadData()
    }, 300)
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate((valid) => {
    if (valid) {
      loading.value = true

      // 模拟提交操作
      setTimeout(() => {
        if (formData.id) {
          // 编辑
          const index = mockData.findIndex(item => item.id === formData.id)
          if (index > -1) {
            mockData[index] = {
              ...mockData[index],
              tableName: formData.tableName,
              fieldName: formData.fieldName,
              fieldType: formData.fieldType,
              fieldDescription: formData.fieldDescription,
              businessTag: [...formData.businessTag],
              isEnabled: formData.isEnabled
            }
          }
          ElMessage.success('编辑成功')
        } else {
          // 新增
          const newItem: MetadataItem = {
            id: Math.max(...mockData.map(item => item.id)) + 1,
            tableName: formData.tableName,
            fieldName: formData.fieldName,
            fieldType: formData.fieldType,
            fieldDescription: formData.fieldDescription,
            businessTag: [...formData.businessTag],
            isEnabled: formData.isEnabled,
            createTime: new Date().toLocaleString('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            }).replace(/\//g, '-')
          }
          mockData.unshift(newItem)
          ElMessage.success('新增成功')
        }

        loading.value = false
        dialogVisible.value = false
        loadData()
      }, 500)
    }
  })
}

// 重置表单
const resetForm = () => {
  formData.id = undefined
  formData.tableName = ''
  formData.fieldName = ''
  formData.fieldType = ''
  formData.fieldDescription = ''
  formData.businessTag = []
  formData.isEnabled = true
  formRef.value?.clearValidate()
}

// 关闭弹窗
const handleClose = () => {
  dialogVisible.value = false
  resetForm()
}

// 初始化加载数据
onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="metadata-manage-container">
    <!-- 页面标题 -->
    <el-card class="header-card" shadow="never">
      <div class="page-header">
        <div class="header-content">
          <h2 class="page-title">元数据管理</h2>
          <p class="page-description">统一管理系统中所有数据资产及字段的描述信息</p>
        </div>
      </div>
    </el-card>

    <!-- 搜索筛选区域 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" label-width="80px">
        <el-row :gutter="20">
          <el-col :span="5">
            <el-form-item label="关键字">
              <el-input
                v-model="searchForm.keyword"
                placeholder="表名/字段名/描述"
                clearable
                @keyup.enter="handleSearch"
              />
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="表名">
              <el-select
                v-model="searchForm.tableName"
                placeholder="请选择表名"
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="table in tableNameList"
                  :key="table"
                  :label="table"
                  :value="table"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="业务标签">
              <el-select
                v-model="searchForm.businessTag"
                placeholder="请选择业务标签"
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="tag in businessTagOptions"
                  :key="tag"
                  :label="tag"
                  :value="tag"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="状态">
              <el-select
                v-model="searchForm.status"
                placeholder="请选择状态"
                style="width: 100%"
              >
                <el-option
                  v-for="status in statusOptions"
                  :key="status.value"
                  :label="status.label"
                  :value="status.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="3" class="search-actions">
            <el-button type="primary" @click="handleSearch">
              <el-icon class="btn-icon">
                <Search/>
              </el-icon>
              搜索
            </el-button>
            <el-button @click="handleReset">
              <el-icon class="btn-icon">
                <Refresh/>
              </el-icon>
              重置
            </el-button>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 操作按钮区域 -->
    <el-card class="toolbar-card" shadow="never">
      <div class="toolbar">
        <el-button type="primary" @click="handleAdd">
          <el-icon class="btn-icon">
            <Plus/>
          </el-icon>
          新增元数据
        </el-button>
        <div class="toolbar-info">
          共 <span class="info-number">{{ pagination.total }}</span> 条数据
        </div>
      </div>
    </el-card>

    <!-- 数据表格区域 -->
    <el-card class="table-card" shadow="never">
      <el-table
        :data="tableData"
        :loading="loading"
        stripe
        border
        style="width: 100%"
        height="calc(100vh - 520px)"
      >
        <el-table-column type="index" label="序号" width="60" align="center"/>
        <el-table-column prop="tableName" label="表名" width="150" show-overflow-tooltip/>
        <el-table-column prop="fieldName" label="字段名" width="150" show-overflow-tooltip/>
        <el-table-column prop="fieldType" label="字段类型" width="130" show-overflow-tooltip/>
        <el-table-column prop="fieldDescription" label="字段描述" min-width="200" show-overflow-tooltip/>
        <el-table-column label="业务标签" width="220">
          <template #default="{ row }">
            <el-tag
              v-for="tag in row.businessTag"
              :key="tag"
              size="small"
              style="margin-right: 5px"
              type="primary"
            >
              {{ tag }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isEnabled ? 'success' : 'info'" size="small">
              {{ row.isEnabled ? '已启用' : '已禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" show-overflow-tooltip/>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row)">
              查看
            </el-button>
            <el-button link type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">
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
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
      @close="handleClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="表名" prop="tableName">
          <el-input
            v-model="formData.tableName"
            placeholder="请输入表名（如：user_info）"
            clearable
          />
        </el-form-item>
        <el-form-item label="字段名" prop="fieldName">
          <el-input
            v-model="formData.fieldName"
            placeholder="请输入字段名（如：user_id）"
            clearable
          />
        </el-form-item>
        <el-form-item label="字段类型" prop="fieldType">
          <el-select
            v-model="formData.fieldType"
            placeholder="请选择字段类型"
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="type in fieldTypeOptions"
              :key="type"
              :label="type"
              :value="type"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="字段描述" prop="fieldDescription">
          <el-input
            v-model="formData.fieldDescription"
            type="textarea"
            :rows="3"
            placeholder="请输入字段描述"
            clearable
          />
        </el-form-item>
        <el-form-item label="业务标签">
          <el-select
            v-model="formData.businessTag"
            multiple
            placeholder="请选择业务标签"
            style="width: 100%"
          >
            <el-option
              v-for="tag in businessTagOptions"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="formData.isEnabled"/>
          <span style="margin-left: 10px; color: #909399; font-size: 12px">
            {{ formData.isEnabled ? '已启用' : '已禁用' }}
          </span>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleClose">取消</el-button>
          <el-button type="primary" :loading="loading" @click="handleSubmit">
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.metadata-manage-container {
  min-height: calc(100vh - 60px);
  .header-card {
    margin-bottom: 20px;

    .page-header {
      .header-content {
        .page-title {
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 600;
          color: #303133;
        }

        .page-description {
          margin: 0;
          font-size: 14px;
          color: #909399;
        }
      }
    }
  }

  .search-card {
    margin-bottom: 20px;

    :deep(.el-card__body) {
      padding: 20px 20px 0 20px;
    }

    .search-actions {
      text-align: right;
      margin-bottom: 20px;

      .el-button {
        margin-left: 10px;
      }
    }
  }

  .toolbar-card {
    margin-bottom: 20px;

    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .toolbar-info {
        font-size: 14px;
        color: #606266;

        .info-number {
          color: #409eff;
          font-weight: 600;
          margin: 0 2px;
        }
      }
    }
  }

  .table-card {
    .pagination-container {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
    }
  }

  .btn-icon {
    margin-right: 4px;
  }

  :deep(.el-table) {
    .el-table__header {
      th {
        background-color: #f5f7fa;
        color: #606266;
        font-weight: 600;
      }
    }
  }

  :deep(.el-form-item) {
    margin-bottom: 18px;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
}
</style>