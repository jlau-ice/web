<template>
  <div class="p-[20px]">
    <el-card>
      <template #header>
        <div class="flex justify-between items-center">
          <span class="text-lg font-semibold">接口标准</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增接口标准
          </el-button>
        </div>
      </template>

      <!-- 搜索区域 -->
      <div class="mb-4">
        <el-form :inline="true" :model="searchForm" class="demo-form-inline">
          <el-form-item label="接口名称">
            <el-input v-model="searchForm.name" placeholder="请输入接口名称" clearable style="width: 200px" />
          </el-form-item>
          <el-form-item label="协议类型">
            <el-select v-model="searchForm.protocol" placeholder="请选择" clearable style="width: 200px">
              <el-option label="RESTful" value="rest" />
              <el-option label="SOAP" value="soap" />
              <el-option label="WebSocket" value="websocket" />
              <el-option label="GraphQL" value="graphql" />
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
        <el-table-column prop="code" label="接口编码" width="150" />
        <el-table-column prop="name" label="接口名称" width="200" />
        <el-table-column prop="protocol" label="协议类型" width="120">
          <template #default="scope">
            <el-tag v-if="scope.row.protocol === 'rest'" type="primary">RESTful</el-tag>
            <el-tag v-else-if="scope.row.protocol === 'soap'" type="success">SOAP</el-tag>
            <el-tag v-else-if="scope.row.protocol === 'websocket'" type="warning">WebSocket</el-tag>
            <el-tag v-else-if="scope.row.protocol === 'graphql'" type="info">GraphQL</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="method" label="请求方法" width="100" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.method === 'GET'" type="success">GET</el-tag>
            <el-tag v-else-if="scope.row.method === 'POST'" type="primary">POST</el-tag>
            <el-tag v-else-if="scope.row.method === 'PUT'" type="warning">PUT</el-tag>
            <el-tag v-else-if="scope.row.method === 'DELETE'" type="danger">DELETE</el-tag>
            <el-tag v-else>{{ scope.row.method }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="url" label="接口地址" min-width="250" show-overflow-tooltip />
        <el-table-column prop="dataFormat" label="数据格式" width="120">
          <template #default="scope">
            <el-tag size="small">{{ scope.row.dataFormat }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="version" label="版本" width="100" align="center" />
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
        <el-form-item label="接口编码" prop="code">
          <el-input v-model="formData.code" placeholder="请输入接口编码" />
        </el-form-item>
        <el-form-item label="接口名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入接口名称" />
        </el-form-item>
        <el-form-item label="协议类型" prop="protocol">
          <el-select v-model="formData.protocol" placeholder="请选择协议类型" style="width: 100%">
            <el-option label="RESTful" value="rest" />
            <el-option label="SOAP" value="soap" />
            <el-option label="WebSocket" value="websocket" />
            <el-option label="GraphQL" value="graphql" />
          </el-select>
        </el-form-item>
        <el-form-item label="请求方法" prop="method">
          <el-select v-model="formData.method" placeholder="请选择请求方法" style="width: 100%">
            <el-option label="GET" value="GET" />
            <el-option label="POST" value="POST" />
            <el-option label="PUT" value="PUT" />
            <el-option label="DELETE" value="DELETE" />
            <el-option label="PATCH" value="PATCH" />
          </el-select>
        </el-form-item>
        <el-form-item label="接口地址" prop="url">
          <el-input v-model="formData.url" placeholder="例如：/api/v1/users" />
        </el-form-item>
        <el-form-item label="数据格式" prop="dataFormat">
          <el-select v-model="formData.dataFormat" placeholder="请选择数据格式" style="width: 100%">
            <el-option label="JSON" value="JSON" />
            <el-option label="XML" value="XML" />
            <el-option label="Form-Data" value="Form-Data" />
          </el-select>
        </el-form-item>
        <el-form-item label="版本" prop="version">
          <el-input v-model="formData.version" placeholder="例如：v1.0" />
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
            placeholder="请输入接口标准的详细描述信息"
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
  protocol: ''
})

// 表格数据
const tableData = ref([
  {
    id: '1',
    code: 'API001',
    name: '用户信息查询接口',
    protocol: 'rest',
    method: 'GET',
    url: '/api/v1/users/{userId}',
    dataFormat: 'JSON',
    version: 'v1.0',
    description: '用于查询用户基本信息的RESTful接口',
    status: 'active',
    createTime: '2024-01-15 10:30:00'
  },
  {
    id: '2',
    code: 'API002',
    name: '产品数据同步接口',
    protocol: 'rest',
    method: 'POST',
    url: '/api/v1/products/sync',
    dataFormat: 'JSON',
    version: 'v1.0',
    description: '用于同步产品数据的接口标准',
    status: 'active',
    createTime: '2024-01-16 14:20:00'
  },
  {
    id: '3',
    code: 'API003',
    name: '订单状态更新接口',
    protocol: 'rest',
    method: 'PUT',
    url: '/api/v1/orders/{orderId}/status',
    dataFormat: 'JSON',
    version: 'v1.0',
    description: '用于更新订单状态的接口标准',
    status: 'active',
    createTime: '2024-01-17 09:15:00'
  },
  {
    id: '4',
    code: 'API004',
    name: '数据交换WebSocket接口',
    protocol: 'websocket',
    method: 'WS',
    url: '/ws/v1/data-exchange',
    dataFormat: 'JSON',
    version: 'v1.0',
    description: '用于实时数据交换的WebSocket接口',
    status: 'active',
    createTime: '2024-01-18 11:45:00'
  },
  {
    id: '5',
    code: 'API005',
    name: '企业服务SOAP接口',
    protocol: 'soap',
    method: 'POST',
    url: '/soap/v1/enterprise',
    dataFormat: 'XML',
    version: 'v1.0',
    description: '用于企业服务调用的SOAP接口标准',
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
const dialogTitle = ref('新增接口标准')
const formRef = ref()
const formData = reactive({
  id: '',
  code: '',
  name: '',
  protocol: '',
  method: 'GET',
  url: '',
  dataFormat: 'JSON',
  version: 'v1.0',
  status: 'active',
  description: ''
})

// 表单验证规则
const rules = {
  code: [{ required: true, message: '请输入接口编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入接口名称', trigger: 'blur' }],
  protocol: [{ required: true, message: '请选择协议类型', trigger: 'change' }],
  method: [{ required: true, message: '请选择请求方法', trigger: 'change' }],
  url: [{ required: true, message: '请输入接口地址', trigger: 'blur' }],
  dataFormat: [{ required: true, message: '请选择数据格式', trigger: 'change' }]
}

// 搜索
const handleSearch = () => {
  ElMessage.success('查询成功')
}

// 重置
const handleReset = () => {
  searchForm.name = ''
  searchForm.protocol = ''
  handleSearch()
}

// 新增
const handleAdd = () => {
  dialogTitle.value = '新增接口标准'
  Object.assign(formData, {
    id: '',
    code: '',
    name: '',
    protocol: '',
    method: 'GET',
    url: '',
    dataFormat: 'JSON',
    version: 'v1.0',
    status: 'active',
    description: ''
  })
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: any) => {
  dialogTitle.value = '编辑接口标准'
  Object.assign(formData, { ...row })
  dialogVisible.value = true
}

// 删除
const handleDelete = (row: any) => {
  ElMessageBox.confirm('确定要删除该接口标准吗？', '提示', {
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

