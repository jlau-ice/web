<template>
  <div class="p-5">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800 mb-2">主数据管理</h1>
      <p class="text-gray-600 text-sm">对核心业务实体（客户、产品、供应商、组织等）进行统一、准确且一致的全生命周期管理</p>
    </div>

    <!-- 实体类型选择 -->
    <el-card class="mb-4" shadow="never">
      <el-radio-group v-model="entityType" @change="handleEntityTypeChange">
        <el-radio-button label="customer">客户</el-radio-button>
        <el-radio-button label="product">产品</el-radio-button>
        <el-radio-button label="supplier">供应商</el-radio-button>
        <el-radio-button label="organization">组织</el-radio-button>
        <el-radio-button label="employee">员工</el-radio-button>
      </el-radio-group>
    </el-card>

    <!-- 搜索和筛选区域 -->
    <el-card class="mb-4" shadow="never">
      <el-form :inline="true" :model="searchForm" class="demo-form-inline">
        <el-form-item :label="getSearchLabel('name')">
          <el-input v-model="searchForm.name" :placeholder="`请输入${getEntityLabel()}名称`" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item :label="getSearchLabel('code')">
          <el-input v-model="searchForm.code" placeholder="请输入编码" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable style="width: 150px">
            <el-option label="启用" value="active" />
            <el-option label="停用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作栏 -->
    <div class="mb-4 flex justify-between items-center">
      <div>
        <el-button type="primary" @click="handleAdd">
          <el-icon class="mr-1"><Plus /></el-icon>
          新增{{ getEntityLabel() }}
        </el-button>
        <el-button type="success" @click="handleImport">
          <el-icon class="mr-1"><Upload /></el-icon>
          批量导入
        </el-button>
        <el-button type="warning" @click="handleExport">
          <el-icon class="mr-1"><Download /></el-icon>
          导出
        </el-button>
        <el-button type="info" @click="handleSync">
          <el-icon class="mr-1"><Refresh /></el-icon>
          数据同步
        </el-button>
      </div>
      <div>
        <el-button @click="handleRefresh">
          <el-icon class="mr-1"><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 数据表格 -->
    <el-card shadow="never">
      <el-table :data="tableData" v-loading="loading" stripe style="width: 100%">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="code" label="编码" width="150" />
        <el-table-column prop="name" :label="`${getEntityLabel()}名称`" width="200" />
        <el-table-column v-if="entityType === 'customer'" prop="contact" label="联系人" width="120" />
        <el-table-column v-if="entityType === 'customer'" prop="phone" label="联系电话" width="150" />
        <el-table-column v-if="entityType === 'product'" prop="category" label="产品类别" width="150" />
        <el-table-column v-if="entityType === 'product'" prop="price" label="价格" width="120">
          <template #default="{ row }">
            ¥{{ row.price }}
          </template>
        </el-table-column>
        <el-table-column v-if="entityType === 'supplier'" prop="contact" label="联系人" width="120" />
        <el-table-column v-if="entityType === 'supplier'" prop="address" label="地址" min-width="200" show-overflow-tooltip />
        <el-table-column v-if="entityType === 'organization'" prop="parentName" label="上级组织" width="150" />
        <el-table-column v-if="entityType === 'organization'" prop="level" label="组织层级" width="120" />
        <el-table-column v-if="entityType === 'employee'" prop="department" label="部门" width="150" />
        <el-table-column v-if="entityType === 'employee'" prop="position" label="职位" width="120" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column prop="updateTime" label="更新时间" width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row)">查看</el-button>
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="mt-4 flex justify-end">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailDialogVisible" :title="`${getEntityLabel()}详情`" width="800px">
      <el-descriptions :column="2" border v-if="currentRow">
        <el-descriptions-item label="编码">{{ currentRow.code }}</el-descriptions-item>
        <el-descriptions-item :label="`${getEntityLabel()}名称`">{{ currentRow.name }}</el-descriptions-item>
        <template v-if="entityType === 'customer'">
          <el-descriptions-item label="联系人">{{ currentRow.contact }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ currentRow.phone }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ currentRow.email }}</el-descriptions-item>
          <el-descriptions-item label="地址">{{ currentRow.address }}</el-descriptions-item>
        </template>
        <template v-if="entityType === 'product'">
          <el-descriptions-item label="产品类别">{{ currentRow.category }}</el-descriptions-item>
          <el-descriptions-item label="价格">¥{{ currentRow.price }}</el-descriptions-item>
          <el-descriptions-item label="规格">{{ currentRow.spec }}</el-descriptions-item>
          <el-descriptions-item label="单位">{{ currentRow.unit }}</el-descriptions-item>
        </template>
        <template v-if="entityType === 'supplier'">
          <el-descriptions-item label="联系人">{{ currentRow.contact }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ currentRow.phone }}</el-descriptions-item>
          <el-descriptions-item label="地址">{{ currentRow.address }}</el-descriptions-item>
          <el-descriptions-item label="供应类别">{{ currentRow.supplyCategory }}</el-descriptions-item>
        </template>
        <template v-if="entityType === 'organization'">
          <el-descriptions-item label="上级组织">{{ currentRow.parentName || '无' }}</el-descriptions-item>
          <el-descriptions-item label="组织层级">{{ currentRow.level }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ currentRow.manager }}</el-descriptions-item>
          <el-descriptions-item label="组织类型">{{ currentRow.orgType }}</el-descriptions-item>
        </template>
        <template v-if="entityType === 'employee'">
          <el-descriptions-item label="工号">{{ currentRow.employeeNo }}</el-descriptions-item>
          <el-descriptions-item label="部门">{{ currentRow.department }}</el-descriptions-item>
          <el-descriptions-item label="职位">{{ currentRow.position }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ currentRow.phone }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ currentRow.email }}</el-descriptions-item>
        </template>
        <el-descriptions-item label="创建时间">{{ currentRow.createTime }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ currentRow.updateTime }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentRow.status === 'active' ? 'success' : 'info'">
            {{ currentRow.status === 'active' ? '启用' : '停用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentRow.remark || '无' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 编辑/新增对话框 -->
    <el-dialog v-model="editDialogVisible" :title="editMode === 'add' ? `新增${getEntityLabel()}` : `编辑${getEntityLabel()}`" width="600px">
      <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="100px">
        <el-form-item label="编码" prop="code">
          <el-input v-model="editForm.code" :placeholder="`请输入${getEntityLabel()}编码`" />
        </el-form-item>
        <el-form-item :label="`${getEntityLabel()}名称`" prop="name">
          <el-input v-model="editForm.name" :placeholder="`请输入${getEntityLabel()}名称`" />
        </el-form-item>
        <template v-if="entityType === 'customer'">
          <el-form-item label="联系人" prop="contact">
            <el-input v-model="editForm.contact" placeholder="请输入联系人" />
          </el-form-item>
          <el-form-item label="联系电话" prop="phone">
            <el-input v-model="editForm.phone" placeholder="请输入联系电话" />
          </el-form-item>
          <el-form-item label="邮箱">
            <el-input v-model="editForm.email" placeholder="请输入邮箱" />
          </el-form-item>
          <el-form-item label="地址">
            <el-input v-model="editForm.address" placeholder="请输入地址" />
          </el-form-item>
        </template>
        <template v-if="entityType === 'product'">
          <el-form-item label="产品类别" prop="category">
            <el-input v-model="editForm.category" placeholder="请输入产品类别" />
          </el-form-item>
          <el-form-item label="价格" prop="price">
            <el-input-number v-model="editForm.price" :min="0" :precision="2" style="width: 100%" />
          </el-form-item>
          <el-form-item label="规格">
            <el-input v-model="editForm.spec" placeholder="请输入规格" />
          </el-form-item>
          <el-form-item label="单位">
            <el-input v-model="editForm.unit" placeholder="请输入单位" />
          </el-form-item>
        </template>
        <template v-if="entityType === 'supplier'">
          <el-form-item label="联系人" prop="contact">
            <el-input v-model="editForm.contact" placeholder="请输入联系人" />
          </el-form-item>
          <el-form-item label="联系电话" prop="phone">
            <el-input v-model="editForm.phone" placeholder="请输入联系电话" />
          </el-form-item>
          <el-form-item label="地址">
            <el-input v-model="editForm.address" placeholder="请输入地址" />
          </el-form-item>
          <el-form-item label="供应类别">
            <el-input v-model="editForm.supplyCategory" placeholder="请输入供应类别" />
          </el-form-item>
        </template>
        <template v-if="entityType === 'organization'">
          <el-form-item label="上级组织">
            <el-select v-model="editForm.parentId" placeholder="请选择上级组织" clearable style="width: 100%">
              <el-option v-for="org in organizationList" :key="org.id" :label="org.name" :value="org.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="组织层级">
            <el-input-number v-model="editForm.level" :min="1" style="width: 100%" />
          </el-form-item>
          <el-form-item label="负责人">
            <el-input v-model="editForm.manager" placeholder="请输入负责人" />
          </el-form-item>
          <el-form-item label="组织类型">
            <el-input v-model="editForm.orgType" placeholder="请输入组织类型" />
          </el-form-item>
        </template>
        <template v-if="entityType === 'employee'">
          <el-form-item label="工号" prop="employeeNo">
            <el-input v-model="editForm.employeeNo" placeholder="请输入工号" />
          </el-form-item>
          <el-form-item label="部门" prop="department">
            <el-input v-model="editForm.department" placeholder="请输入部门" />
          </el-form-item>
          <el-form-item label="职位" prop="position">
            <el-input v-model="editForm.position" placeholder="请输入职位" />
          </el-form-item>
          <el-form-item label="联系电话">
            <el-input v-model="editForm.phone" placeholder="请输入联系电话" />
          </el-form-item>
          <el-form-item label="邮箱">
            <el-input v-model="editForm.email" placeholder="请输入邮箱" />
          </el-form-item>
        </template>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="editForm.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editForm.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload, Download, Refresh } from '@element-plus/icons-vue'

// 实体类型
const entityType = ref('customer')

// 搜索表单
const searchForm = reactive({
  name: '',
  code: '',
  status: ''
})

// 分页
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

// 加载状态
const loading = ref(false)

// 表格数据
const tableData = ref<any[]>([])

// 组织列表（用于组织类型的上级组织选择）
const organizationList = ref<any[]>([])

// 详情对话框
const detailDialogVisible = ref(false)
const currentRow = ref<any>(null)

// 编辑对话框
const editDialogVisible = ref(false)
const editMode = ref<'add' | 'edit'>('add')
const editFormRef = ref()
const editForm = reactive<any>({
  code: '',
  name: '',
  status: 'active',
  remark: ''
})

const editRules = {
  code: [{ required: true, message: '请输入编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }]
}

// 获取实体标签
const getEntityLabel = () => {
  const map: Record<string, string> = {
    customer: '客户',
    product: '产品',
    supplier: '供应商',
    organization: '组织',
    employee: '员工'
  }
  return map[entityType.value] || ''
}

// 获取搜索标签
const getSearchLabel = (field: string) => {
  if (field === 'name') {
    return `${getEntityLabel()}名称`
  }
  return '编码'
}

// Mock数据生成
const generateMockData = (type: string) => {
  const data: any[] = []
  const prefixes: Record<string, string> = {
    customer: 'CUST',
    product: 'PROD',
    supplier: 'SUPP',
    organization: 'ORG',
    employee: 'EMP'
  }
  const prefix = prefixes[type] || 'DATA'

  for (let i = 1; i <= 50; i++) {
    const baseData: any = {
      id: i,
      code: `${prefix}${String(i).padStart(6, '0')}`,
      name: `${getEntityLabel()}_${i}`,
      createTime: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toLocaleString('zh-CN'),
      updateTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleString('zh-CN'),
      status: Math.random() > 0.3 ? 'active' : 'inactive',
      remark: `这是${getEntityLabel()}${i}的备注信息`
    }

    if (type === 'customer') {
      baseData.contact = `联系人${i}`
      baseData.phone = `138${String(i).padStart(8, '0')}`
      baseData.email = `customer${i}@example.com`
      baseData.address = `地址${i}`
    } else if (type === 'product') {
      baseData.category = ['电子产品', '食品', '服装', '日用品'][Math.floor(Math.random() * 4)]
      baseData.price = (Math.random() * 10000).toFixed(2)
      baseData.spec = `规格${i}`
      baseData.unit = ['件', '箱', '包', '个'][Math.floor(Math.random() * 4)]
    } else if (type === 'supplier') {
      baseData.contact = `联系人${i}`
      baseData.phone = `139${String(i).padStart(8, '0')}`
      baseData.address = `供应商地址${i}`
      baseData.supplyCategory = ['原材料', '设备', '服务'][Math.floor(Math.random() * 3)]
    } else if (type === 'organization') {
      baseData.parentName = i > 1 ? `组织_${Math.floor(i / 2)}` : null
      baseData.parentId = i > 1 ? Math.floor(i / 2) : null
      baseData.level = Math.floor(Math.random() * 5) + 1
      baseData.manager = `负责人${i}`
      baseData.orgType = ['公司', '部门', '小组'][Math.floor(Math.random() * 3)]
    } else if (type === 'employee') {
      baseData.employeeNo = `EMP${String(i).padStart(6, '0')}`
      baseData.department = ['技术部', '销售部', '财务部', '人事部'][Math.floor(Math.random() * 4)]
      baseData.position = ['经理', '主管', '专员', '助理'][Math.floor(Math.random() * 4)]
      baseData.phone = `137${String(i).padStart(8, '0')}`
      baseData.email = `employee${i}@example.com`
    }

    data.push(baseData)
  }
  return data
}

// 加载数据
const loadData = () => {
  loading.value = true
  setTimeout(() => {
    const allData = generateMockData(entityType.value)
    // 模拟搜索过滤
    let filteredData = allData
    if (searchForm.name) {
      filteredData = filteredData.filter(item => item.name.includes(searchForm.name))
    }
    if (searchForm.code) {
      filteredData = filteredData.filter(item => item.code.includes(searchForm.code))
    }
    if (searchForm.status) {
      filteredData = filteredData.filter(item => item.status === searchForm.status)
    }
    
    pagination.total = filteredData.length
    const start = (pagination.page - 1) * pagination.size
    const end = start + pagination.size
    tableData.value = filteredData.slice(start, end)
    loading.value = false
  }, 500)
}

// 实体类型变化
const handleEntityTypeChange = () => {
  pagination.page = 1
  loadData()
  // 如果是组织类型，加载组织列表
  if (entityType.value === 'organization') {
    organizationList.value = generateMockData('organization').slice(0, 20).map(item => ({
      id: item.id,
      name: item.name
    }))
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadData()
}

// 重置
const handleReset = () => {
  searchForm.name = ''
  searchForm.code = ''
  searchForm.status = ''
  handleSearch()
}

// 刷新
const handleRefresh = () => {
  loadData()
}

// 新增
const handleAdd = () => {
  editMode.value = 'add'
  const baseForm: any = {
    code: '',
    name: '',
    status: 'active',
    remark: ''
  }
  // 根据实体类型添加特定字段
  if (entityType.value === 'customer') {
    baseForm.contact = ''
    baseForm.phone = ''
    baseForm.email = ''
    baseForm.address = ''
  } else if (entityType.value === 'product') {
    baseForm.category = ''
    baseForm.price = 0
    baseForm.spec = ''
    baseForm.unit = ''
  } else if (entityType.value === 'supplier') {
    baseForm.contact = ''
    baseForm.phone = ''
    baseForm.address = ''
    baseForm.supplyCategory = ''
  } else if (entityType.value === 'organization') {
    baseForm.parentId = null
    baseForm.level = 1
    baseForm.manager = ''
    baseForm.orgType = ''
  } else if (entityType.value === 'employee') {
    baseForm.employeeNo = ''
    baseForm.department = ''
    baseForm.position = ''
    baseForm.phone = ''
    baseForm.email = ''
  }
  Object.assign(editForm, baseForm)
  editDialogVisible.value = true
}

// 导入
const handleImport = () => {
  ElMessage.info('批量导入功能开发中')
}

// 导出
const handleExport = () => {
  ElMessage.success('导出成功')
}

// 同步
const handleSync = () => {
  ElMessage.success('数据同步成功')
  loadData()
}

// 查看
const handleView = (row: any) => {
  currentRow.value = row
  detailDialogVisible.value = true
}

// 编辑
const handleEdit = (row: any) => {
  editMode.value = 'edit'
  Object.assign(editForm, row)
  editDialogVisible.value = true
}

// 删除
const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确定要删除这条${getEntityLabel()}数据吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('删除成功')
    loadData()
  }).catch(() => {})
}

// 保存
const handleSave = () => {
  editFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      ElMessage.success(editMode.value === 'add' ? '新增成功' : '编辑成功')
      editDialogVisible.value = false
      loadData()
    }
  })
}

// 分页变化
const handleSizeChange = () => {
  loadData()
}

const handlePageChange = () => {
  loadData()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
</style>
