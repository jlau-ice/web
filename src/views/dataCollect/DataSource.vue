<template>
  <div class="p-4 bg-white h-full">
    <div class="mb-4 flex justify-between items-center">
      <h2 class="text-xl font-bold">数据源管理</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon class="mr-1"><Plus /></el-icon>
        新增数据源
      </el-button>
    </div>

    <!-- 搜索栏 -->
    <el-card class="mb-4">
      <el-form :inline="true" :model="searchForm" class="demo-form-inline">
        <el-form-item label="数据源名称">
          <el-input v-model="searchForm.name" placeholder="请输入数据源名称" clearable />
        </el-form-item>
        <el-form-item label="数据源类型">
          <el-select v-model="searchForm.type" placeholder="请选择" clearable>
            <el-option label="关系型数据库" value="RDBMS" />
            <el-option label="NoSQL数据库" value="NOSQL" />
            <el-option label="分布式存储" value="DISTRIBUTED" />
            <el-option label="API接口" value="API" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable>
            <el-option label="可用" value="active" />
            <el-option label="不可用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据源列表 -->
    <el-card>
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="name" label="数据源名称" min-width="150" />
        <el-table-column prop="type" label="数据源类型" width="140">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">{{ getTypeLabel(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="connectionInfo" label="连接信息" min-width="200" show-overflow-tooltip />
        <el-table-column prop="tableCount" label="表数量" width="100" />
        <el-table-column prop="dataSize" label="数据规模" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '可用' : '不可用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleTest(row)">
              <el-icon><Connection /></el-icon>
              测试连接
            </el-button>
            <el-button link type="primary" size="small" @click="handleParseMetadata(row)">
              <el-icon><Document /></el-icon>
              解析元数据
            </el-button>
            <el-button link type="primary" size="small" @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

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

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item label="数据源名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入数据源名称" />
        </el-form-item>
        <el-form-item label="数据源类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择数据源类型" @change="handleTypeChange">
            <el-option label="MySQL" value="MYSQL" />
            <el-option label="PostgreSQL" value="POSTGRESQL" />
            <el-option label="Oracle" value="ORACLE" />
            <el-option label="MongoDB" value="MONGODB" />
            <el-option label="Redis" value="REDIS" />
            <el-option label="Hive" value="HIVE" />
            <el-option label="HBase" value="HBASE" />
            <el-option label="Elasticsearch" value="ELASTICSEARCH" />
            <el-option label="API接口" value="API" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="formData.type !== 'API'" label="主机地址" prop="host">
          <el-input v-model="formData.host" placeholder="请输入主机地址" />
        </el-form-item>
        <el-form-item v-if="formData.type !== 'API'" label="端口" prop="port">
          <el-input-number v-model="formData.port" :min="1" :max="65535" />
        </el-form-item>
        <el-form-item v-if="formData.type !== 'API'" label="数据库名" prop="database">
          <el-input v-model="formData.database" placeholder="请输入数据库名" />
        </el-form-item>
        <el-form-item v-if="formData.type !== 'API'" label="用户名" prop="username">
          <el-input v-model="formData.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item v-if="formData.type !== 'API'" label="密码" prop="password">
          <el-input
            v-model="formData.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        <el-form-item v-if="formData.type === 'API'" label="API地址" prop="apiUrl">
          <el-input v-model="formData.apiUrl" placeholder="请输入API地址" />
        </el-form-item>
        <el-form-item v-if="formData.type === 'API'" label="认证方式" prop="authType">
          <el-select v-model="formData.authType" placeholder="请选择认证方式">
            <el-option label="无认证" value="NONE" />
            <el-option label="Token" value="TOKEN" />
            <el-option label="Basic Auth" value="BASIC" />
            <el-option label="OAuth2" value="OAUTH2" />
          </el-select>
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
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 元数据解析对话框 -->
    <el-dialog
      v-model="metadataDialogVisible"
      title="元数据信息"
      width="1000px"
    >
      <el-table :data="metadataData" stripe max-height="500">
        <el-table-column prop="tableName" label="表名" min-width="150" />
        <el-table-column prop="columnName" label="字段名" min-width="120" />
        <el-table-column prop="dataType" label="数据类型" width="120" />
        <el-table-column prop="length" label="长度" width="100" />
        <el-table-column prop="nullable" label="可空" width="80">
          <template #default="{ row }">
            <el-tag :type="row.nullable ? 'info' : 'success'">
              {{ row.nullable ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="comment" label="注释" min-width="150" show-overflow-tooltip />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Connection, Document, Edit, Delete } from '@element-plus/icons-vue'

interface DataSource {
  id: string
  name: string
  type: string
  connectionInfo: string
  tableCount: number
  dataSize: string
  status: string
  createTime: string
  host?: string
  port?: number
  database?: string
  username?: string
  apiUrl?: string
  authType?: string
  description?: string
}

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const metadataDialogVisible = ref(false)
const dialogTitle = ref('新增数据源')
const formRef = ref()
const tableData = ref<DataSource[]>([])
const metadataData = ref<any[]>([])

const searchForm = reactive({
  name: '',
  type: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const formData = reactive<Partial<DataSource>>({
  name: '',
  type: '',
  host: '',
  port: 3306,
  database: '',
  username: '',
  password: '',
  apiUrl: '',
  authType: 'NONE',
  description: ''
})

const formRules = {
  name: [{ required: true, message: '请输入数据源名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择数据源类型', trigger: 'change' }],
  host: [{ required: true, message: '请输入主机地址', trigger: 'blur' }],
  port: [{ required: true, message: '请输入端口', trigger: 'blur' }],
  database: [{ required: true, message: '请输入数据库名', trigger: 'blur' }],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  apiUrl: [{ required: true, message: '请输入API地址', trigger: 'blur' }]
}

// 获取类型标签类型
const getTypeTagType = (type: string) => {
  const typeMap: Record<string, string> = {
    RDBMS: 'primary',
    NOSQL: 'success',
    DISTRIBUTED: 'warning',
    API: 'info'
  }
  return typeMap[type] || 'info'
}

// 获取类型标签文本
const getTypeLabel = (type: string) => {
  const labelMap: Record<string, string> = {
    RDBMS: '关系型数据库',
    NOSQL: 'NoSQL数据库',
    DISTRIBUTED: '分布式存储',
    API: 'API接口'
  }
  return labelMap[type] || type
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    // TODO: 调用实际API
    // 模拟数据
    await new Promise(resolve => setTimeout(resolve, 500))
    tableData.value = [
      {
        id: '1',
        name: '生产MySQL数据库',
        type: 'RDBMS',
        connectionInfo: '192.168.1.100:3306/prod_db',
        tableCount: 45,
        dataSize: '2.5GB',
        status: 'active',
        createTime: '2024-01-15 10:30:00'
      },
      {
        id: '2',
        name: 'MongoDB日志库',
        type: 'NOSQL',
        connectionInfo: '192.168.1.101:27017/logs',
        tableCount: 12,
        dataSize: '8.3GB',
        status: 'active',
        createTime: '2024-01-16 14:20:00'
      },
      {
        id: '3',
        name: '用户服务API',
        type: 'API',
        connectionInfo: 'https://api.example.com/users',
        tableCount: 0,
        dataSize: '-',
        status: 'active',
        createTime: '2024-01-17 09:15:00'
      }
    ]
    pagination.total = tableData.value.length
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
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
  searchForm.type = ''
  searchForm.status = ''
  handleSearch()
}

// 新增
const handleAdd = () => {
  dialogTitle.value = '新增数据源'
  Object.assign(formData, {
    name: '',
    type: '',
    host: '',
    port: 3306,
    database: '',
    username: '',
    password: '',
    apiUrl: '',
    authType: 'NONE',
    description: ''
  })
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: DataSource) => {
  dialogTitle.value = '编辑数据源'
  Object.assign(formData, row)
  dialogVisible.value = true
}

// 删除
const handleDelete = async (row: DataSource) => {
  try {
    await ElMessageBox.confirm(`确定要删除数据源"${row.name}"吗？`, '提示', {
      type: 'warning'
    })
    // TODO: 调用删除API
    ElMessage.success('删除成功')
    loadData()
  } catch {
    // 用户取消
  }
}

// 测试连接
const handleTest = async (row: DataSource) => {
  loading.value = true
  try {
    // TODO: 调用测试连接API
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('连接测试成功')
  } catch (error) {
    ElMessage.error('连接测试失败')
  } finally {
    loading.value = false
  }
}

// 解析元数据
const handleParseMetadata = async (row: DataSource) => {
  loading.value = true
  try {
    // TODO: 调用解析元数据API
    await new Promise(resolve => setTimeout(resolve, 1000))
    // 模拟元数据
    metadataData.value = [
      {
        tableName: 'user_info',
        columnName: 'id',
        dataType: 'BIGINT',
        length: 20,
        nullable: false,
        comment: '用户ID'
      },
      {
        tableName: 'user_info',
        columnName: 'username',
        dataType: 'VARCHAR',
        length: 50,
        nullable: false,
        comment: '用户名'
      },
      {
        tableName: 'user_info',
        columnName: 'email',
        dataType: 'VARCHAR',
        length: 100,
        nullable: true,
        comment: '邮箱'
      }
    ]
    metadataDialogVisible.value = true
    ElMessage.success('元数据解析成功')
  } catch (error) {
    ElMessage.error('元数据解析失败')
  } finally {
    loading.value = false
  }
}

// 类型变更
const handleTypeChange = () => {
  // 根据类型设置默认端口
  const portMap: Record<string, number> = {
    MYSQL: 3306,
    POSTGRESQL: 5432,
    ORACLE: 1521,
    MONGODB: 27017,
    REDIS: 6379,
    HIVE: 10000,
    HBASE: 2181,
    ELASTICSEARCH: 9200
  }
  if (formData.type && portMap[formData.type]) {
    formData.port = portMap[formData.type]
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitting.value = true
      try {
        // TODO: 调用保存API
        await new Promise(resolve => setTimeout(resolve, 1000))
        ElMessage.success(dialogTitle.value === '新增数据源' ? '新增成功' : '编辑成功')
        dialogVisible.value = false
        loadData()
      } catch (error) {
        ElMessage.error('操作失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

// 对话框关闭
const handleDialogClose = () => {
  formRef.value?.resetFields()
}

// 分页
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
:deep(.el-card__body) {
  padding: 16px;
}
</style>