<template>
  <div class="data-source-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">数据源管理</span>
          <div class="header-actions">
            <el-button type="primary" @click="handleAdd">新增数据源</el-button>
            <el-button @click="handleBatchImport">批量导入</el-button>
            <el-button @click="handleRefresh">刷新</el-button>
          </div>
        </div>
      </template>

      <div class="filter-section">
        <el-form :inline="true" :model="filterForm">
          <el-form-item label="数据源类型">
            <el-select v-model="filterForm.type" placeholder="请选择类型" clearable style="width: 200px">
              <el-option label="全部" value="" />
              <el-option label="关系型数据库" value="relational" />
              <el-option label="NoSQL" value="nosql" />
              <el-option label="大数据存储" value="bigdata" />
              <el-option label="API" value="api" />
            </el-select>
          </el-form-item>
          <el-form-item label="连接状态">
            <el-select v-model="filterForm.status" placeholder="请选择状态" clearable style="width: 150px">
              <el-option label="全部" value="" />
              <el-option label="成功" value="success" />
              <el-option label="失败" value="failed" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="tableData" border stripe style="width: 100%">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="name" label="名称" min-width="150" />
        <el-table-column prop="type" label="类型" width="150">
          <template #default="{ row }">
            <el-tag :type="getTypeColor(row.type)">{{ getTypeName(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="连接状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : 'danger'">
              {{ row.status === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="host" label="主机地址" min-width="150" />
        <el-table-column prop="port" label="端口" width="80" />
        <el-table-column prop="tableCount" label="数据库表数量" width="120" />
        <el-table-column prop="fieldCount" label="字段数量" width="100" />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="warning" size="small" @click="handleTestConnection(row)">测试连接</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form :model="formData" label-width="100px" ref="formRef">
        <el-form-item label="名称" required>
          <el-input v-model="formData.name" placeholder="请输入数据源名称" />
        </el-form-item>
        <el-form-item label="类型" required>
          <el-select v-model="formData.type" placeholder="请选择类型" style="width: 100%">
            <el-option label="关系型数据库" value="relational" />
            <el-option label="NoSQL" value="nosql" />
            <el-option label="大数据存储" value="bigdata" />
            <el-option label="API" value="api" />
          </el-select>
        </el-form-item>
        <el-form-item label="主机地址" required>
          <el-input v-model="formData.host" placeholder="请输入主机地址" />
        </el-form-item>
        <el-form-item label="端口" required>
          <el-input v-model="formData.port" placeholder="请输入端口号" />
        </el-form-item>
        <el-form-item label="用户名" required>
          <el-input v-model="formData.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" required>
          <el-input
            v-model="formData.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="数据库名称">
          <el-input v-model="formData.database" placeholder="请输入数据库名称" />
        </el-form-item>
        <el-form-item label="描述">
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
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

interface DataSource {
  id: number
  name: string
  type: string
  status: string
  host: string
  port: string
  tableCount: number
  fieldCount: number
  username?: string
  password?: string
  database?: string
  description?: string
}

interface FilterForm {
  type: string
  status: string
}

interface FormData {
  id?: number
  name: string
  type: string
  host: string
  port: string
  username: string
  password: string
  database: string
  description: string
}

// Mock 数据
const mockData = ref<DataSource[]>([
  {
    id: 1,
    name: 'MySQL生产库',
    type: 'relational',
    status: 'success',
    host: '192.168.1.100',
    port: '3306',
    tableCount: 125,
    fieldCount: 856,
    username: 'root',
    database: 'production_db',
    description: '生产环境主数据库'
  },
  {
    id: 2,
    name: 'PostgreSQL数据仓库',
    type: 'relational',
    status: 'success',
    host: '192.168.1.101',
    port: '5432',
    tableCount: 68,
    fieldCount: 542,
    username: 'postgres',
    database: 'warehouse_db',
    description: '数据仓库'
  },
  {
    id: 3,
    name: 'MongoDB文档库',
    type: 'nosql',
    status: 'failed',
    host: '192.168.1.102',
    port: '27017',
    tableCount: 32,
    fieldCount: 0,
    username: 'admin',
    database: 'document_db',
    description: 'MongoDB文档存储'
  },
  {
    id: 4,
    name: 'Redis缓存',
    type: 'nosql',
    status: 'success',
    host: '192.168.1.103',
    port: '6379',
    tableCount: 0,
    fieldCount: 0,
    username: 'default',
    description: 'Redis缓存服务'
  },
  {
    id: 5,
    name: 'Hive大数据仓库',
    type: 'bigdata',
    status: 'success',
    host: '192.168.1.104',
    port: '10000',
    tableCount: 256,
    fieldCount: 1823,
    username: 'hive',
    database: 'default',
    description: 'Hive数据仓库'
  },
  {
    id: 6,
    name: 'Elasticsearch搜索',
    type: 'bigdata',
    status: 'success',
    host: '192.168.1.105',
    port: '9200',
    tableCount: 45,
    fieldCount: 0,
    username: 'elastic',
    description: 'ES搜索引擎'
  },
  {
    id: 7,
    name: 'REST API接口',
    type: 'api',
    status: 'success',
    host: 'api.example.com',
    port: '443',
    tableCount: 0,
    fieldCount: 0,
    username: 'api_user',
    description: '第三方API接口'
  },
  {
    id: 8,
    name: 'Oracle企业库',
    type: 'relational',
    status: 'failed',
    host: '192.168.1.106',
    port: '1521',
    tableCount: 189,
    fieldCount: 1245,
    username: 'system',
    database: 'orcl',
    description: 'Oracle企业数据库'
  }
])

const tableData = ref<DataSource[]>([...mockData.value])

const filterForm = reactive<FilterForm>({
  type: '',
  status: ''
})

const dialogVisible = ref(false)
const dialogTitle = computed(() => formData.id ? '编辑数据源' : '新增数据源')
const formRef = ref()

const formData = reactive<FormData>({
  name: '',
  type: '',
  host: '',
  port: '',
  username: '',
  password: '',
  database: '',
  description: ''
})

// 获取类型名称
const getTypeName = (type: string): string => {
  const typeMap: Record<string, string> = {
    relational: '关系型数据库',
    nosql: 'NoSQL',
    bigdata: '大数据存储',
    api: 'API'
  }
  return typeMap[type] || type
}

// 获取类型颜色
const getTypeColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    relational: 'primary',
    nosql: 'success',
    bigdata: 'warning',
    api: 'info'
  }
  return colorMap[type] || ''
}

// 新增
const handleAdd = () => {
  console.log('点击新增数据源')
  resetForm()
  dialogVisible.value = true
}

// 批量导入
const handleBatchImport = () => {
  console.log('点击批量导入')
  ElMessage.info('批量导入功能')
}

// 刷新
const handleRefresh = () => {
  console.log('点击刷新')
  tableData.value = [...mockData.value]
  ElMessage.success('刷新成功')
}

// 查询
const handleSearch = () => {
  console.log('查询条件:', filterForm)
  let filtered = [...mockData.value]

  if (filterForm.type) {
    filtered = filtered.filter(item => item.type === filterForm.type)
  }

  if (filterForm.status) {
    filtered = filtered.filter(item => item.status === filterForm.status)
  }

  tableData.value = filtered
  ElMessage.success('查询完成')
}

// 重置
const handleReset = () => {
  console.log('重置查询条件')
  filterForm.type = ''
  filterForm.status = ''
  tableData.value = [...mockData.value]
}

// 编辑
const handleEdit = (row: DataSource) => {
  console.log('编辑数据源:', row)
  Object.assign(formData, row)
  dialogVisible.value = true
}

// 删除
const handleDelete = (row: DataSource) => {
  console.log('删除数据源:', row)
  ElMessageBox.confirm('确定要删除该数据源吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = tableData.value.findIndex(item => item.id === row.id)
    if (index > -1) {
      tableData.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  }).catch(() => {
    console.log('取消删除')
  })
}

// 测试连接
const handleTestConnection = (row: DataSource) => {
  console.log('测试连接:', row)
  const success = Math.random() > 0.3
  if (success) {
    ElMessage.success(`${row.name} 连接测试成功`)
    row.status = 'success'
  } else {
    ElMessage.error(`${row.name} 连接测试失败`)
    row.status = 'failed'
  }
}

// 提交表单
const handleSubmit = () => {
  console.log('提交表单:', formData)

  if (!formData.name || !formData.type || !formData.host || !formData.port) {
    ElMessage.warning('请填写必填项')
    return
  }

  if (formData.id) {
    // 编辑
    const index = tableData.value.findIndex(item => item.id === formData.id)
    if (index > -1) {
      tableData.value[index] = {
        ...tableData.value[index],
        ...formData,
        tableCount: tableData.value[index].tableCount,
        fieldCount: tableData.value[index].fieldCount,
        status: tableData.value[index].status
      }
      ElMessage.success('编辑成功')
    }
  } else {
    // 新增
    const newData: DataSource = {
      id: Date.now(),
      name: formData.name,
      type: formData.type,
      status: 'success',
      host: formData.host,
      port: formData.port,
      tableCount: Math.floor(Math.random() * 100),
      fieldCount: Math.floor(Math.random() * 500),
      username: formData.username,
      password: formData.password,
      database: formData.database,
      description: formData.description
    }
    tableData.value.unshift(newData)
    ElMessage.success('新增成功')
  }

  dialogVisible.value = false
}

// 关闭对话框
const handleDialogClose = () => {
  resetForm()
}

// 重置表单
const resetForm = () => {
  formData.id = undefined
  formData.name = ''
  formData.type = ''
  formData.host = ''
  formData.port = ''
  formData.username = ''
  formData.password = ''
  formData.database = ''
  formData.description = ''
}
</script>

<style scoped>
.data-source-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.filter-section {
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.el-table {
  margin-top: 16px;
}
</style>
