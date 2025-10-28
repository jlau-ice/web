<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// 接口定义
interface CodeStandard {
  id: number
  ruleName: string
  ruleCode: string
  entityType: string
  codeExample: string
  codeLength: number
  codeFormat: string
  description: string
  status: 'enabled' | 'disabled'
  enabled: boolean
  createTime: string
  updateTime: string
}

interface SearchForm {
  keyword: string
  entityType: string
  status: string
}

// 响应式数据
const loading = ref(false)
const tableData = ref<CodeStandard[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 搜索表单
const searchForm = reactive<SearchForm>({
  keyword: '',
  entityType: '',
  status: ''
})

// 弹窗相关
const dialogVisible = ref(false)
const dialogTitle = ref('新增编码规则')
const formRef = ref<FormInstance>()

// 表单数据
const form = reactive<Partial<CodeStandard>>({
  id: undefined,
  ruleName: '',
  ruleCode: '',
  entityType: '',
  codeExample: '',
  codeLength: 10,
  codeFormat: '',
  description: '',
  status: 'enabled',
  enabled: true
})

// 业务实体类型选项
const entityTypeOptions = [
  { label: '组织机构', value: 'organization' },
  { label: '产品分类', value: 'product' },
  { label: '地域信息', value: 'region' },
  { label: '人员信息', value: 'personnel' },
  { label: '资产管理', value: 'asset' },
  { label: '供应商', value: 'supplier' },
  { label: '客户信息', value: 'customer' },
  { label: '项目管理', value: 'project' }
]

// 状态选项
const statusOptions = [
  { label: '启用', value: 'enabled' },
  { label: '停用', value: 'disabled' }
]

// 表单验证规则
const rules = reactive<FormRules>({
  ruleName: [
    { required: true, message: '请输入规则名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  ruleCode: [
    { required: true, message: '请输入规则编码', trigger: 'blur' },
    { pattern: /^[A-Z0-9_]+$/, message: '只能包含大写字母、数字和下划线', trigger: 'blur' }
  ],
  entityType: [
    { required: true, message: '请选择适用业务实体', trigger: 'change' }
  ],
  codeLength: [
    { required: true, message: '请输入编码长度', trigger: 'blur' },
    { type: 'number', min: 1, max: 50, message: '长度范围 1-50', trigger: 'blur' }
  ],
  codeFormat: [
    { required: true, message: '请输入编码格式', trigger: 'blur' }
  ]
})

// Mock 数据
const mockData: CodeStandard[] = [
  {
    id: 1,
    ruleName: '组织机构编码规则',
    ruleCode: 'ORG_CODE_RULE',
    entityType: 'organization',
    codeExample: 'ORG2024001',
    codeLength: 10,
    codeFormat: 'ORG+YYYY+NNN',
    description: '用于标识组织机构的唯一编码，包含前缀ORG、年份和流水号',
    status: 'enabled',
    enabled: true,
    createTime: '2024-01-15 10:30:00',
    updateTime: '2024-01-15 10:30:00'
  },
  {
    id: 2,
    ruleName: '产品分类编码规则',
    ruleCode: 'PROD_CAT_RULE',
    entityType: 'product',
    codeExample: 'PC-01-001-0001',
    codeLength: 15,
    codeFormat: 'PC-LL-MMM-NNNN',
    description: '产品分类层级编码，支持4级分类结构',
    status: 'enabled',
    enabled: true,
    createTime: '2024-01-16 14:20:00',
    updateTime: '2024-01-16 14:20:00'
  },
  {
    id: 3,
    ruleName: '地域信息编码规则',
    ruleCode: 'REGION_CODE_RULE',
    entityType: 'region',
    codeExample: '110000',
    codeLength: 6,
    codeFormat: 'PPCCDD',
    description: '行政区划编码，省2位+市2位+区2位',
    status: 'enabled',
    enabled: true,
    createTime: '2024-01-17 09:15:00',
    updateTime: '2024-01-17 09:15:00'
  },
  {
    id: 4,
    ruleName: '人员工号编码规则',
    ruleCode: 'EMP_NO_RULE',
    entityType: 'personnel',
    codeExample: 'EMP202400123',
    codeLength: 12,
    codeFormat: 'EMP+YYYY+NNNNN',
    description: '员工工号编码规则，包含前缀、入职年份和流水号',
    status: 'enabled',
    enabled: true,
    createTime: '2024-01-18 11:45:00',
    updateTime: '2024-01-18 11:45:00'
  },
  {
    id: 5,
    ruleName: '固定资产编码规则',
    ruleCode: 'ASSET_CODE_RULE',
    entityType: 'asset',
    codeExample: 'FA-IT-2024-0001',
    codeLength: 16,
    codeFormat: 'FA-CC-YYYY-NNNN',
    description: '固定资产编码，包含资产类别、年份和序号',
    status: 'disabled',
    enabled: false,
    createTime: '2024-01-19 16:30:00',
    updateTime: '2024-01-19 16:30:00'
  },
  {
    id: 6,
    ruleName: '供应商编码规则',
    ruleCode: 'SUPPLIER_CODE_RULE',
    entityType: 'supplier',
    codeExample: 'SUP-CN-00123',
    codeLength: 12,
    codeFormat: 'SUP-CC-NNNNN',
    description: '供应商统一编码，包含国家代码和流水号',
    status: 'enabled',
    enabled: true,
    createTime: '2024-01-20 13:20:00',
    updateTime: '2024-01-20 13:20:00'
  },
  {
    id: 7,
    ruleName: '客户编码规则',
    ruleCode: 'CUSTOMER_CODE_RULE',
    entityType: 'customer',
    codeExample: 'CUS202400789',
    codeLength: 12,
    codeFormat: 'CUS+YYYY+NNNNN',
    description: '客户统一编码规则',
    status: 'enabled',
    enabled: true,
    createTime: '2024-01-21 10:00:00',
    updateTime: '2024-01-21 10:00:00'
  },
  {
    id: 8,
    ruleName: '项目编码规则',
    ruleCode: 'PROJECT_CODE_RULE',
    entityType: 'project',
    codeExample: 'PRJ-2024-IT-001',
    codeLength: 15,
    codeFormat: 'PRJ-YYYY-DD-NNN',
    description: '项目编码规则，包含年份、部门和序号',
    status: 'enabled',
    enabled: true,
    createTime: '2024-01-22 15:30:00',
    updateTime: '2024-01-22 15:30:00'
  }
]

// 计算属性：过滤后的数据
const filteredData = computed(() => {
  let data = [...mockData]
  
  // 关键字搜索
  if (searchForm.keyword) {
    const keyword = searchForm.keyword.toLowerCase()
    data = data.filter(item => 
      item.ruleName.toLowerCase().includes(keyword) ||
      item.ruleCode.toLowerCase().includes(keyword) ||
      item.codeExample.toLowerCase().includes(keyword) ||
      item.description.toLowerCase().includes(keyword)
    )
  }
  
  // 业务实体筛选
  if (searchForm.entityType) {
    data = data.filter(item => item.entityType === searchForm.entityType)
  }
  
  // 状态筛选
  if (searchForm.status) {
    data = data.filter(item => item.status === searchForm.status)
  }
  
  return data
})

// 获取实体类型标签
const getEntityTypeLabel = (value: string) => {
  const option = entityTypeOptions.find(opt => opt.value === value)
  return option ? option.label : value
}

// 获取状态标签类型
const getStatusType = (status: string) => {
  return status === 'enabled' ? 'success' : 'info'
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
  searchForm.entityType = ''
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
  dialogTitle.value = '新增编码规则'
  resetForm()
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: CodeStandard) => {
  dialogTitle.value = '编辑编码规则'
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

// 查看详情
const handleView = (row: CodeStandard) => {
  ElMessageBox.alert(
    `
      <div style="line-height: 2;">
        <p><strong>规则名称：</strong>${row.ruleName}</p>
        <p><strong>规则编码：</strong>${row.ruleCode}</p>
        <p><strong>适用实体：</strong>${getEntityTypeLabel(row.entityType)}</p>
        <p><strong>编码长度：</strong>${row.codeLength}</p>
        <p><strong>编码格式：</strong>${row.codeFormat}</p>
        <p><strong>编码示例：</strong>${row.codeExample}</p>
        <p><strong>规则描述：</strong>${row.description}</p>
        <p><strong>状态：</strong>${row.status === 'enabled' ? '启用' : '停用'}</p>
        <p><strong>创建时间：</strong>${row.createTime}</p>
        <p><strong>更新时间：</strong>${row.updateTime}</p>
      </div>
    `,
    '编码规则详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '关闭'
    }
  )
}

// 删除
const handleDelete = (row: CodeStandard) => {
  ElMessageBox.confirm(
    `确定要删除编码规则"${row.ruleName}"吗？此操作不可恢复。`,
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
const handleStatusChange = (row: CodeStandard) => {
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
            } as CodeStandard
          }
          ElMessage.success('编辑成功')
        } else {
          // 新增
          const newItem: CodeStandard = {
            id: Math.max(...mockData.map(item => item.id)) + 1,
            ruleName: form.ruleName!,
            ruleCode: form.ruleCode!,
            entityType: form.entityType!,
            codeExample: form.codeExample!,
            codeLength: form.codeLength!,
            codeFormat: form.codeFormat!,
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
  form.ruleName = ''
  form.ruleCode = ''
  form.entityType = ''
  form.codeExample = ''
  form.codeLength = 10
  form.codeFormat = ''
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
  <div class="basic-coding-container">
    <!-- 页面标题 -->
    <el-card class="header-card" shadow="never">
      <div class="page-header">
        <div>
          <h2 class="page-title">基础编码标准管理</h2>
          <p class="page-description">
            定义和管理组织中各类基础业务实体的统一编码规则，确保核心要素在全系统内具有唯一、规范且可识别的数字身份
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
            placeholder="请输入规则名称、编码或示例"
            clearable
            style="width: 240px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        
        <el-form-item label="业务实体">
          <el-select
            v-model="searchForm.entityType"
            placeholder="请选择业务实体"
            clearable
            style="width: 180px"
          >
            <el-option
              v-for="item in entityTypeOptions"
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
          <span class="card-title">编码规则列表</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增规则
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
        
        <el-table-column prop="ruleName" label="规则名称" min-width="150" show-overflow-tooltip />
        
        <el-table-column prop="ruleCode" label="规则编码" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.ruleCode }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="entityType" label="适用业务实体" width="130" align="center">
          <template #default="{ row }">
            <el-tag type="primary" size="small">{{ getEntityTypeLabel(row.entityType) }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="codeFormat" label="编码格式" min-width="130" show-overflow-tooltip />
        
        <el-table-column prop="codeExample" label="编码示例" min-width="130" show-overflow-tooltip>
          <template #default="{ row }">
            <code class="code-example">{{ row.codeExample }}</code>
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
      width="600px"
      :close-on-click-modal="false"
      @close="handleCancel"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="110px"
      >
        <el-form-item label="规则名称" prop="ruleName">
          <el-input
            v-model="form.ruleName"
            placeholder="请输入规则名称"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="规则编码" prop="ruleCode">
          <el-input
            v-model="form.ruleCode"
            placeholder="请输入规则编码（大写字母、数字、下划线）"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="适用业务实体" prop="entityType">
          <el-select
            v-model="form.entityType"
            placeholder="请选择适用业务实体"
            style="width: 100%"
          >
            <el-option
              v-for="item in entityTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="编码长度" prop="codeLength">
          <el-input-number
            v-model="form.codeLength"
            :min="1"
            :max="50"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="编码格式" prop="codeFormat">
          <el-input
            v-model="form.codeFormat"
            placeholder="如：PRE+YYYY+NNNN"
            clearable
          />
          <div class="form-tip">
            格式说明：PRE=前缀，YYYY=年份，MM=月份，DD=日期，N=数字流水号
          </div>
        </el-form-item>
        
        <el-form-item label="编码示例" prop="codeExample">
          <el-input
            v-model="form.codeExample"
            placeholder="请输入编码示例"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="规则描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入规则描述"
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
.basic-coding-container {
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

    .code-example {
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

  .form-tip {
    margin-top: 4px;
    font-size: 12px;
    color: #909399;
    line-height: 1.5;
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