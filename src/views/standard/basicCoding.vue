<template>
  <div class="p-[20px]">
    <el-card>
      <template #header>
        <div class="flex justify-between items-center">
          <span class="text-lg font-semibold">基础编码标准</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增编码
          </el-button>
        </div>
      </template>

      <!-- 搜索区域 -->
      <div class="mb-4">
        <el-form :inline="true" :model="searchForm" class="demo-form-inline">
          <el-form-item label="编码类型">
            <el-select v-model="searchForm.type" placeholder="请选择" clearable style="width: 200px">
              <el-option label="组织机构" value="org" />
              <el-option label="产品分类" value="product" />
              <el-option label="地域信息" value="region" />
            </el-select>
          </el-form-item>
          <el-form-item label="编码名称">
            <el-input v-model="searchForm.name" placeholder="请输入编码名称" clearable style="width: 200px" />
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
        <el-table-column prop="code" label="编码标识" width="150" />
        <el-table-column prop="name" label="编码名称" width="200" />
        <el-table-column prop="type" label="编码类型" width="120">
          <template #default="scope">
            <el-tag v-if="scope.row.type === 'org'" type="primary">组织机构</el-tag>
            <el-tag v-else-if="scope.row.type === 'product'" type="success">产品分类</el-tag>
            <el-tag v-else-if="scope.row.type === 'region'" type="warning">地域信息</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="format" label="编码格式" width="150" />
        <el-table-column prop="length" label="编码长度" width="100" align="center" />
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
      width="600px"
      @close="handleDialogClose"
    >
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="编码标识" prop="code">
          <el-input v-model="formData.code" placeholder="请输入编码标识" />
        </el-form-item>
        <el-form-item label="编码名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入编码名称" />
        </el-form-item>
        <el-form-item label="编码类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择编码类型" style="width: 100%">
            <el-option label="组织机构" value="org" />
            <el-option label="产品分类" value="product" />
            <el-option label="地域信息" value="region" />
          </el-select>
        </el-form-item>
        <el-form-item label="编码格式" prop="format">
          <el-input v-model="formData.format" placeholder="例如：ORG-{数字}" />
        </el-form-item>
        <el-form-item label="编码长度" prop="length">
          <el-input-number v-model="formData.length" :min="1" :max="50" style="width: 100%" />
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
            placeholder="请输入描述信息"
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
  type: '',
  name: ''
})

// 表格数据
const tableData = ref([
  {
    id: '1',
    code: 'ORG001',
    name: '总部机构编码',
    type: 'org',
    format: 'ORG-{数字}',
    length: 10,
    description: '用于标识组织总部机构的唯一编码',
    status: 'active',
    createTime: '2024-01-15 10:30:00'
  },
  {
    id: '2',
    code: 'PROD001',
    name: '电子产品分类编码',
    type: 'product',
    format: 'PROD-{字母}{数字}',
    length: 12,
    description: '用于标识电子产品分类的标准编码',
    status: 'active',
    createTime: '2024-01-16 14:20:00'
  },
  {
    id: '3',
    code: 'REG001',
    name: '省级地域编码',
    type: 'region',
    format: 'REG-{数字}',
    length: 8,
    description: '用于标识省级行政区域的编码规范',
    status: 'active',
    createTime: '2024-01-17 09:15:00'
  },
  {
    id: '4',
    code: 'ORG002',
    name: '分公司机构编码',
    type: 'org',
    format: 'ORG-{数字}-{字母}',
    length: 15,
    description: '用于标识分公司机构的编码标准',
    status: 'active',
    createTime: '2024-01-18 11:45:00'
  },
  {
    id: '5',
    code: 'PROD002',
    name: '工业产品分类编码',
    type: 'product',
    format: 'PROD-IND-{数字}',
    length: 14,
    description: '用于标识工业产品分类的编码规范',
    status: 'inactive',
    createTime: '2024-01-19 16:30:00'
  }
])

// 分页
const pagination = reactive({
  page: 1,
  size: 10,
  total: 5
})

// 对话框
const dialogVisible = ref(false)
const dialogTitle = ref('新增编码')
const formRef = ref()
const formData = reactive({
  id: '',
  code: '',
  name: '',
  type: '',
  format: '',
  length: 10,
  status: 'active',
  description: ''
})

// 表单验证规则
const rules = {
  code: [{ required: true, message: '请输入编码标识', trigger: 'blur' }],
  name: [{ required: true, message: '请输入编码名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择编码类型', trigger: 'change' }],
  format: [{ required: true, message: '请输入编码格式', trigger: 'blur' }],
  length: [{ required: true, message: '请输入编码长度', trigger: 'blur' }]
}

// 搜索
const handleSearch = () => {
  ElMessage.success('查询成功')
  // 这里可以添加实际的搜索逻辑
}

// 重置
const handleReset = () => {
  searchForm.type = ''
  searchForm.name = ''
  handleSearch()
}

// 新增
const handleAdd = () => {
  dialogTitle.value = '新增编码'
  Object.assign(formData, {
    id: '',
    code: '',
    name: '',
    type: '',
    format: '',
    length: 10,
    status: 'active',
    description: ''
  })
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: any) => {
  dialogTitle.value = '编辑编码'
  Object.assign(formData, { ...row })
  dialogVisible.value = true
}

// 删除
const handleDelete = (row: any) => {
  ElMessageBox.confirm('确定要删除该编码标准吗？', '提示', {
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
        // 编辑
        const index = tableData.value.findIndex((item) => item.id === formData.id)
        if (index > -1) {
          tableData.value[index] = { ...formData }
          ElMessage.success('更新成功')
        }
      } else {
        // 新增
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

