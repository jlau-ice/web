<template>
  <div class="p-[20px]">
    <el-card>
      <template #header>
        <div class="flex justify-between items-center">
          <span class="text-lg font-semibold">数据元标准</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增数据元
          </el-button>
        </div>
      </template>

      <!-- 搜索区域 -->
      <div class="mb-4">
        <el-form :inline="true" :model="searchForm" class="demo-form-inline">
          <el-form-item label="数据元名称">
            <el-input v-model="searchForm.name" placeholder="请输入数据元名称" clearable style="width: 200px" />
          </el-form-item>
          <el-form-item label="数据类型">
            <el-select v-model="searchForm.dataType" placeholder="请选择" clearable style="width: 200px">
              <el-option label="字符串" value="string" />
              <el-option label="数字" value="number" />
              <el-option label="日期" value="date" />
              <el-option label="布尔值" value="boolean" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 表格区域 -->
      <el-table :data="tableData" border stripe style="width: 100%">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="identifier" label="数据元标识" width="150" />
        <el-table-column prop="name" label="数据元名称" width="200" />
        <el-table-column prop="dataType" label="数据类型" width="120">
          <template #default="scope">
            <el-tag v-if="scope.row.dataType === 'string'" type="primary">字符串</el-tag>
            <el-tag v-else-if="scope.row.dataType === 'number'" type="success">数字</el-tag>
            <el-tag v-else-if="scope.row.dataType === 'date'" type="warning">日期</el-tag>
            <el-tag v-else-if="scope.row.dataType === 'boolean'" type="info">布尔值</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="format" label="数据格式" width="150" />
        <el-table-column prop="length" label="长度" width="100" align="center" />
        <el-table-column prop="range" label="取值范围" width="200" show-overflow-tooltip />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 'active'" type="success">启用</el-tag>
            <el-tag v-else type="info">禁用</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="scope">
            <el-button link type="primary" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(scope.row)">删除</el-button>
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
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      @close="handleDialogClose"
    >
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="数据元标识" prop="identifier">
          <el-input v-model="formData.identifier" placeholder="请输入数据元标识" />
        </el-form-item>
        <el-form-item label="数据元名称" prop="name">
          <el-input v-model="formData.name" placeholder="例如：客户姓名、产品价格" />
        </el-form-item>
        <el-form-item label="数据类型" prop="dataType">
          <el-select v-model="formData.dataType" placeholder="请选择数据类型" style="width: 100%">
            <el-option label="字符串" value="string" />
            <el-option label="数字" value="number" />
            <el-option label="日期" value="date" />
            <el-option label="布尔值" value="boolean" />
          </el-select>
        </el-form-item>
        <el-form-item label="数据格式" prop="format">
          <el-input v-model="formData.format" placeholder="例如：VARCHAR(50)、DECIMAL(10,2)" />
        </el-form-item>
        <el-form-item label="长度" prop="length">
          <el-input-number v-model="formData.length" :min="1" :max="1000" style="width: 100%" />
        </el-form-item>
        <el-form-item label="取值范围" prop="range">
          <el-input v-model="formData.range" placeholder="例如：0-100、YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入数据元的详细描述信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

// 搜索表单
const searchForm = reactive({
  name: '',
  dataType: ''
})

// 表格数据
const tableData = ref([
  {
    id: '1',
    identifier: 'DE001',
    name: '客户姓名',
    dataType: 'string',
    format: 'VARCHAR(50)',
    length: 50,
    range: '中文字符，2-20个字符',
    description: '用于标识客户姓名的标准数据元，支持中文、英文和数字',
    status: 'active',
    createTime: '2024-01-15 10:30:00'
  },
  {
    id: '2',
    identifier: 'DE002',
    name: '产品价格',
    dataType: 'number',
    format: 'DECIMAL(10,2)',
    length: 10,
    range: '0.00-99999999.99',
    description: '用于标识产品价格的标准数据元，精确到小数点后两位',
    status: 'active',
    createTime: '2024-01-16 14:20:00'
  },
  {
    id: '3',
    identifier: 'DE003',
    name: '订单日期',
    dataType: 'date',
    format: 'DATE',
    length: 10,
    range: 'YYYY-MM-DD',
    description: '用于标识订单日期的标准数据元，格式为年-月-日',
    status: 'active',
    createTime: '2024-01-17 09:15:00'
  },
  {
    id: '4',
    identifier: 'DE004',
    name: '是否启用',
    dataType: 'boolean',
    format: 'BOOLEAN',
    length: 1,
    range: 'true/false',
    description: '用于标识是否启用的布尔值数据元',
    status: 'active',
    createTime: '2024-01-18 11:45:00'
  },
  {
    id: '5',
    identifier: 'DE005',
    name: '客户电话',
    dataType: 'string',
    format: 'VARCHAR(20)',
    length: 20,
    range: '11位手机号或固定电话',
    description: '用于标识客户联系电话的标准数据元',
    status: 'active',
    createTime: '2024-01-19 16:30:00'
  },
  {
    id: '6',
    identifier: 'DE006',
    name: '产品库存',
    dataType: 'number',
    format: 'INTEGER',
    length: 10,
    range: '0-2147483647',
    description: '用于标识产品库存数量的标准数据元',
    status: 'inactive',
    createTime: '2024-01-20 10:20:00'
  }
])

// 分页
const pagination = reactive({
  page: 1,
  size: 10,
  total: 6
})

// 对话框
const dialogVisible = ref(false)
const dialogTitle = ref('新增数据元')
const formRef = ref()
const formData = reactive({
  id: '',
  identifier: '',
  name: '',
  dataType: '',
  format: '',
  length: 50,
  range: '',
  status: 'active',
  description: ''
})

// 表单验证规则
const rules = {
  identifier: [{ required: true, message: '请输入数据元标识', trigger: 'blur' }],
  name: [{ required: true, message: '请输入数据元名称', trigger: 'blur' }],
  dataType: [{ required: true, message: '请选择数据类型', trigger: 'change' }],
  format: [{ required: true, message: '请输入数据格式', trigger: 'blur' }],
  length: [{ required: true, message: '请输入长度', trigger: 'blur' }]
}

// 搜索
const handleSearch = () => {
  ElMessage.success('查询成功')
}

// 重置
const handleReset = () => {
  searchForm.name = ''
  searchForm.dataType = ''
  handleSearch()
}

// 新增
const handleAdd = () => {
  dialogTitle.value = '新增数据元'
  Object.assign(formData, {
    id: '',
    identifier: '',
    name: '',
    dataType: '',
    format: '',
    length: 50,
    range: '',
    status: 'active',
    description: ''
  })
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: any) => {
  dialogTitle.value = '编辑数据元'
  Object.assign(formData, { ...row })
  dialogVisible.value = true
}

// 删除
const handleDelete = (row: any) => {
  ElMessageBox.confirm('确定要删除该数据元标准吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      const index = tableData.value.findIndex((item) => item.id === row.id)
      if (index > -1) {
        tableData.value.splice(index, 1)
        pagination.total--
        ElMessage.success('删除成功')
      }
    })
    .catch(() => {})
}

// 提交
const handleSubmit = () => {
  formRef.value?.validate((valid: boolean) => {
    if (valid) {
      if (formData.id) {
        const index = tableData.value.findIndex((item) => item.id === formData.id)
        if (index > -1) {
          tableData.value[index] = { ...formData }
          ElMessage.success('更新成功')
        }
      } else {
        const newItem = {
          ...formData,
          id: String(Date.now()),
          createTime: new Date().toLocaleString('zh-CN')
        }
        tableData.value.push(newItem)
        pagination.total++
        ElMessage.success('新增成功')
      }
      dialogVisible.value = false
    }
  })
}

// 对话框关闭
const handleDialogClose = () => {
  formRef.value?.resetFields()
}

// 分页
const handleSizeChange = (val: number) => {
  pagination.size = val
  pagination.page = 1
}

const handleCurrentChange = (val: number) => {
  pagination.page = val
}

onMounted(() => {
  // 初始化数据
})
</script>

<style scoped lang="scss">
</style>

