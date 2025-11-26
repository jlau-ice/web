<template>
  <div class="p-[20px]">
    <el-card>
      <template #header>
        <div class="flex justify-between items-center">
          <span class="text-lg font-semibold">模板库管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增模板
          </el-button>
        </div>
      </template>

      <!-- 搜索区域 -->
      <div class="mb-4">
        <el-form :inline="true" :model="searchForm" class="demo-form-inline">
          <el-form-item label="模板名称">
            <el-input v-model="searchForm.name" placeholder="请输入模板名称" clearable style="width: 200px" />
          </el-form-item>
          <el-form-item label="模板类型">
            <el-select v-model="searchForm.type" placeholder="请选择" clearable style="width: 200px">
              <el-option label="数据元模板" value="dataElement" />
              <el-option label="编码规则模板" value="coding" />
              <el-option label="接口模板" value="interface" />
              <el-option label="业务模板" value="business" />
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
        <el-table-column prop="code" label="模板编码" width="150" />
        <el-table-column prop="name" label="模板名称" width="200" />
        <el-table-column prop="type" label="模板类型" width="150">
          <template #default="scope">
            <el-tag v-if="scope.row.type === 'dataElement'" type="primary">数据元模板</el-tag>
            <el-tag v-else-if="scope.row.type === 'coding'" type="success">编码规则模板</el-tag>
            <el-tag v-else-if="scope.row.type === 'interface'" type="warning">接口模板</el-tag>
            <el-tag v-else-if="scope.row.type === 'business'" type="info">业务模板</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="应用场景" width="150" />
        <el-table-column prop="version" label="当前版本" width="120" align="center" />
        <el-table-column prop="usageCount" label="使用次数" width="120" align="center" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 'published'" type="success">已发布</el-tag>
            <el-tag v-else-if="scope.row.status === 'draft'" type="warning">草稿</el-tag>
            <el-tag v-else type="info">已归档</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="250" fixed="right" align="center">
          <template #default="scope">
            <el-button link type="primary" @click="handleView(scope.row)">查看</el-button>
            <el-button link type="primary" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button link type="success" @click="handleCopy(scope.row)">复制</el-button>
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
        <el-form-item label="模板编码" prop="code">
          <el-input v-model="formData.code" placeholder="请输入模板编码" />
        </el-form-item>
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="模板类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择模板类型" style="width: 100%">
            <el-option label="数据元模板" value="dataElement" />
            <el-option label="编码规则模板" value="coding" />
            <el-option label="接口模板" value="interface" />
            <el-option label="业务模板" value="business" />
          </el-select>
        </el-form-item>
        <el-form-item label="应用场景" prop="category">
          <el-input v-model="formData.category" placeholder="请输入应用场景" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio label="draft">草稿</el-radio>
            <el-radio label="published">已发布</el-radio>
            <el-radio label="archived">已归档</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="模板内容" prop="content">
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="6"
            placeholder="请输入模板内容（JSON格式）"
          />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入模板描述信息"
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
  type: ''
})

// 表格数据
const tableData = ref([
  {
    id: '1',
    code: 'TPL001',
    name: '客户信息数据元模板',
    type: 'dataElement',
    category: '客户管理',
    version: 'v1.2',
    usageCount: 156,
    description: '包含客户姓名、电话、地址等标准数据元的模板',
    status: 'published',
    createTime: '2024-01-15 10:30:00'
  },
  {
    id: '2',
    code: 'TPL002',
    name: '组织机构编码模板',
    type: 'coding',
    category: '组织管理',
    version: 'v2.0',
    usageCount: 89,
    description: '用于生成组织机构标准编码的模板',
    status: 'published',
    createTime: '2024-01-16 14:20:00'
  },
  {
    id: '3',
    code: 'TPL003',
    name: 'RESTful接口标准模板',
    type: 'interface',
    category: '系统集成',
    version: 'v1.0',
    usageCount: 234,
    description: '标准RESTful接口定义模板，包含请求响应格式',
    status: 'published',
    createTime: '2024-01-17 09:15:00'
  },
  {
    id: '4',
    code: 'TPL004',
    name: '订单业务模板',
    type: 'business',
    category: '订单管理',
    version: 'v1.5',
    usageCount: 67,
    description: '订单业务处理的标准模板',
    status: 'published',
    createTime: '2024-01-18 11:45:00'
  },
  {
    id: '5',
    code: 'TPL005',
    name: '产品分类编码模板',
    type: 'coding',
    category: '产品管理',
    version: 'v1.0',
    usageCount: 0,
    description: '产品分类编码规则模板',
    status: 'draft',
    createTime: '2024-01-19 16:30:00'
  },
  {
    id: '6',
    code: 'TPL006',
    name: '用户数据元模板',
    type: 'dataElement',
    category: '用户管理',
    version: 'v1.0',
    usageCount: 45,
    description: '用户相关数据元标准模板',
    status: 'archived',
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
const dialogTitle = ref('新增模板')
const formRef = ref()
const formData = reactive({
  id: '',
  code: '',
  name: '',
  type: '',
  category: '',
  version: 'v1.0',
  status: 'draft',
  content: '',
  description: ''
})

// 表单验证规则
const rules = {
  code: [{ required: true, message: '请输入模板编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择模板类型', trigger: 'change' }],
  category: [{ required: true, message: '请输入应用场景', trigger: 'blur' }]
}

// 搜索
const handleSearch = () => {
  ElMessage.success('查询成功')
}

// 重置
const handleReset = () => {
  searchForm.name = ''
  searchForm.type = ''
  handleSearch()
}

// 新增
const handleAdd = () => {
  dialogTitle.value = '新增模板'
  Object.assign(formData, {
    id: '',
    code: '',
    name: '',
    type: '',
    category: '',
    version: 'v1.0',
    status: 'draft',
    content: '',
    description: ''
  })
  dialogVisible.value = true
}

// 查看
const handleView = (row: any) => {
  ElMessage.info(`查看模板：${row.name}`)
  // 这里可以打开查看对话框
}

// 编辑
const handleEdit = (row: any) => {
  dialogTitle.value = '编辑模板'
  Object.assign(formData, { ...row })
  dialogVisible.value = true
}

// 复制
const handleCopy = (row: any) => {
  dialogTitle.value = '复制模板'
  Object.assign(formData, {
    ...row,
    id: '',
    code: row.code + '_COPY',
    name: row.name + '_副本',
    version: 'v1.0',
    status: 'draft'
  })
  dialogVisible.value = true
}

// 删除
const handleDelete = (row: any) => {
  ElMessageBox.confirm('确定要删除该模板吗？', '提示', {
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
          usageCount: 0,
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

