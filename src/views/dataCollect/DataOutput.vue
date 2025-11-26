<template>
  <div class="p-4 bg-white h-full">
    <div class="mb-4 flex justify-between items-center">
      <h2 class="text-xl font-bold">数据汇聚与输出</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon class="mr-1"><Plus /></el-icon>
        新增输出配置
      </el-button>
    </div>

    <!-- 输出统计 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="6">
        <el-card class="text-center">
          <div class="text-2xl font-bold text-blue-600">{{ outputMetrics.totalOutput }}</div>
          <div class="text-gray-500 mt-2">今日输出数据量</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="text-center">
          <div class="text-2xl font-bold text-green-600">{{ outputMetrics.successCount }}</div>
          <div class="text-gray-500 mt-2">成功输出次数</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="text-center">
          <div class="text-2xl font-bold text-orange-600">{{ outputMetrics.failedCount }}</div>
          <div class="text-gray-500 mt-2">失败输出次数</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="text-center">
          <div class="text-2xl font-bold text-purple-600">{{ outputMetrics.targetCount }}</div>
          <div class="text-gray-500 mt-2">输出目标数</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索栏 -->
    <el-card class="mb-4">
      <el-form :inline="true" :model="searchForm" class="demo-form-inline">
        <el-form-item label="配置名称">
          <el-input v-model="searchForm.name" placeholder="请输入配置名称" clearable />
        </el-form-item>
        <el-form-item label="目标类型">
          <el-select v-model="searchForm.targetType" placeholder="请选择" clearable>
            <el-option label="Hive" value="HIVE" />
            <el-option label="MySQL" value="MYSQL" />
            <el-option label="Elasticsearch" value="ELASTICSEARCH" />
            <el-option label="HBase" value="HBASE" />
            <el-option label="Kafka" value="KAFKA" />
            <el-option label="数据湖" value="DATA_LAKE" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable>
            <el-option label="启用" value="ENABLED" />
            <el-option label="禁用" value="DISABLED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 输出配置列表 -->
    <el-card class="mb-4">
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="name" label="配置名称" min-width="150" />
        <el-table-column prop="targetType" label="目标类型" width="140">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.targetType)">{{ getTypeLabel(row.targetType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="targetInfo" label="目标信息" min-width="200" show-overflow-tooltip />
        <el-table-column prop="sourceTask" label="来源任务" min-width="150" />
        <el-table-column prop="outputFormat" label="输出格式" width="120" />
        <el-table-column prop="lastOutputTime" label="最后输出时间" width="180" />
        <el-table-column prop="outputCount" label="输出次数" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="'ENABLED'"
              :inactive-value="'DISABLED'"
              @change="handleToggleStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleViewMonitor(row)">
              <el-icon><Monitor /></el-icon>
              监控
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
      width="1000px"
      @close="handleDialogClose"
    >
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本信息" name="basic">
          <el-form
            ref="formRef"
            :model="formData"
            :rules="formRules"
            label-width="120px"
          >
            <el-form-item label="配置名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入配置名称" />
            </el-form-item>
            <el-form-item label="来源任务" prop="sourceTaskId">
              <el-select v-model="formData.sourceTaskId" placeholder="请选择来源任务">
                <el-option
                  v-for="task in tasks"
                  :key="task.id"
                  :label="task.name"
                  :value="task.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="目标类型" prop="targetType">
              <el-select v-model="formData.targetType" placeholder="请选择目标类型" @change="handleTypeChange">
                <el-option label="Hive" value="HIVE" />
                <el-option label="MySQL" value="MYSQL" />
                <el-option label="Elasticsearch" value="ELASTICSEARCH" />
                <el-option label="HBase" value="HBASE" />
                <el-option label="Kafka" value="KAFKA" />
                <el-option label="数据湖" value="DATA_LAKE" />
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
        </el-tab-pane>
        <el-tab-pane label="目标配置" name="target">
          <!-- Hive配置 -->
          <div v-if="formData.targetType === 'HIVE'">
            <el-form :model="formData" label-width="120px">
              <el-form-item label="Hive地址">
                <el-input v-model="formData.hiveUrl" placeholder="例如: jdbc:hive2://localhost:10000" />
              </el-form-item>
              <el-form-item label="数据库名">
                <el-input v-model="formData.database" placeholder="请输入数据库名" />
              </el-form-item>
              <el-form-item label="表名">
                <el-input v-model="formData.tableName" placeholder="请输入表名" />
              </el-form-item>
              <el-form-item label="存储格式">
                <el-select v-model="formData.storageFormat">
                  <el-option label="Parquet" value="PARQUET" />
                  <el-option label="ORC" value="ORC" />
                  <el-option label="TextFile" value="TEXTFILE" />
                </el-select>
              </el-form-item>
            </el-form>
          </div>

          <!-- MySQL配置 -->
          <div v-if="formData.targetType === 'MYSQL'">
            <el-form :model="formData" label-width="120px">
              <el-form-item label="主机地址">
                <el-input v-model="formData.host" placeholder="请输入主机地址" />
              </el-form-item>
              <el-form-item label="端口">
                <el-input-number v-model="formData.port" :min="1" :max="65535" />
              </el-form-item>
              <el-form-item label="数据库名">
                <el-input v-model="formData.database" placeholder="请输入数据库名" />
              </el-form-item>
              <el-form-item label="表名">
                <el-input v-model="formData.tableName" placeholder="请输入表名" />
              </el-form-item>
              <el-form-item label="用户名">
                <el-input v-model="formData.username" placeholder="请输入用户名" />
              </el-form-item>
              <el-form-item label="密码">
                <el-input v-model="formData.password" type="password" show-password placeholder="请输入密码" />
              </el-form-item>
            </el-form>
          </div>

          <!-- Elasticsearch配置 -->
          <div v-if="formData.targetType === 'ELASTICSEARCH'">
            <el-form :model="formData" label-width="120px">
              <el-form-item label="ES地址">
                <el-input v-model="formData.esUrl" placeholder="例如: http://localhost:9200" />
              </el-form-item>
              <el-form-item label="索引名">
                <el-input v-model="formData.indexName" placeholder="请输入索引名" />
              </el-form-item>
              <el-form-item label="类型名">
                <el-input v-model="formData.typeName" placeholder="请输入类型名（可选）" />
              </el-form-item>
            </el-form>
          </div>

          <!-- 数据湖配置 -->
          <div v-if="formData.targetType === 'DATA_LAKE'">
            <el-form :model="formData" label-width="120px">
              <el-form-item label="存储路径">
                <el-input v-model="formData.storagePath" placeholder="例如: s3://bucket/path 或 hdfs://path" />
              </el-form-item>
              <el-form-item label="存储格式">
                <el-select v-model="formData.storageFormat">
                  <el-option label="Parquet" value="PARQUET" />
                  <el-option label="ORC" value="ORC" />
                  <el-option label="JSON" value="JSON" />
                  <el-option label="CSV" value="CSV" />
                </el-select>
              </el-form-item>
              <el-form-item label="分区策略">
                <el-select v-model="formData.partitionStrategy">
                  <el-option label="按日期" value="DATE" />
                  <el-option label="按小时" value="HOUR" />
                  <el-option label="自定义" value="CUSTOM" />
                </el-select>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
        <el-tab-pane label="输出策略" name="strategy">
          <el-form :model="formData" label-width="120px">
            <el-form-item label="输出模式">
              <el-radio-group v-model="formData.outputMode">
                <el-radio label="APPEND">追加模式</el-radio>
                <el-radio label="OVERWRITE">覆盖模式</el-radio>
                <el-radio label="UPSERT">更新插入</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="批次大小">
              <el-input-number v-model="formData.batchSize" :min="100" :max="100000" />
            </el-form-item>
            <el-form-item label="输出频率">
              <el-select v-model="formData.outputFrequency">
                <el-option label="实时" value="REALTIME" />
                <el-option label="每小时" value="HOURLY" />
                <el-option label="每天" value="DAILY" />
                <el-option label="自定义" value="CUSTOM" />
              </el-select>
            </el-form-item>
            <el-form-item label="失败重试次数">
              <el-input-number v-model="formData.retryCount" :min="0" :max="10" />
            </el-form-item>
            <el-form-item label="启用数据校验">
              <el-switch v-model="formData.enableValidation" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 输出监控对话框 -->
    <el-dialog v-model="monitorDialogVisible" title="输出监控" width="1000px">
      <div class="mb-4">
        <el-tag>配置: {{ currentConfig?.name }}</el-tag>
        <el-tag class="ml-2" :type="currentConfig?.status === 'ENABLED' ? 'success' : 'info'">
          {{ currentConfig?.status === 'ENABLED' ? '启用' : '禁用' }}
        </el-tag>
      </div>
      <el-table :data="monitorData" stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="outputTime" label="输出时间" width="180" />
        <el-table-column prop="dataCount" label="数据量" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'SUCCESS' ? 'success' : 'danger'">
              {{ row.status === 'SUCCESS' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="耗时" width="100" />
        <el-table-column prop="errorMessage" label="错误信息" min-width="200" show-overflow-tooltip />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Monitor } from '@element-plus/icons-vue'

interface OutputConfig {
  id: string
  name: string
  targetType: string
  targetInfo: string
  sourceTask: string
  outputFormat: string
  lastOutputTime: string
  outputCount: number
  status: string
  sourceTaskId?: string
  description?: string
  hiveUrl?: string
  database?: string
  tableName?: string
  storageFormat?: string
  host?: string
  port?: number
  username?: string
  password?: string
  esUrl?: string
  indexName?: string
  typeName?: string
  storagePath?: string
  partitionStrategy?: string
  outputMode?: string
  batchSize?: number
  outputFrequency?: string
  retryCount?: number
  enableValidation?: boolean
}

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const monitorDialogVisible = ref(false)
const dialogTitle = ref('新增输出配置')
const activeTab = ref('basic')
const formRef = ref()
const tableData = ref<OutputConfig[]>([])
const monitorData = ref<any[]>([])
const tasks = ref<any[]>([])
const currentConfig = ref<OutputConfig | null>(null)

const outputMetrics = reactive({
  totalOutput: 0,
  successCount: 0,
  failedCount: 0,
  targetCount: 0
})

const searchForm = reactive({
  name: '',
  targetType: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const formData = reactive<Partial<OutputConfig>>({
  name: '',
  sourceTaskId: '',
  targetType: '',
  description: '',
  outputMode: 'APPEND',
  batchSize: 1000,
  outputFrequency: 'REALTIME',
  retryCount: 3,
  enableValidation: true
})

const formRules = {
  name: [{ required: true, message: '请输入配置名称', trigger: 'blur' }],
  sourceTaskId: [{ required: true, message: '请选择来源任务', trigger: 'change' }],
  targetType: [{ required: true, message: '请选择目标类型', trigger: 'change' }]
}

// 获取类型标签类型
const getTypeTagType = (type: string) => {
  const typeMap: Record<string, string> = {
    HIVE: 'primary',
    MYSQL: 'success',
    ELASTICSEARCH: 'warning',
    HBASE: 'info',
    KAFKA: 'danger',
    DATA_LAKE: 'info'
  }
  return typeMap[type] || 'info'
}

// 获取类型标签文本
const getTypeLabel = (type: string) => {
  return type
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    // TODO: 调用实际API
    await new Promise(resolve => setTimeout(resolve, 500))
    tableData.value = [
      {
        id: '1',
        name: '用户数据输出到Hive',
        targetType: 'HIVE',
        targetInfo: 'hive://localhost:10000/user_db.user_info',
        sourceTask: '用户数据采集',
        outputFormat: 'Parquet',
        lastOutputTime: '2024-01-20 10:30:00',
        outputCount: 125,
        status: 'ENABLED'
      },
      {
        id: '2',
        name: '订单数据输出到MySQL',
        targetType: 'MYSQL',
        targetInfo: 'mysql://192.168.1.100:3306/order_db.orders',
        sourceTask: '订单数据采集',
        outputFormat: 'Table',
        lastOutputTime: '2024-01-20 10:25:00',
        outputCount: 89,
        status: 'ENABLED'
      },
      {
        id: '3',
        name: '日志数据输出到ES',
        targetType: 'ELASTICSEARCH',
        targetInfo: 'http://localhost:9200/logs',
        sourceTask: '日志数据采集',
        outputFormat: 'JSON',
        lastOutputTime: '2024-01-20 10:20:00',
        outputCount: 256,
        status: 'ENABLED'
      }
    ]
    pagination.total = tableData.value.length

    // 更新统计
    outputMetrics.targetCount = tableData.value.length
    outputMetrics.totalOutput = 1250000
    outputMetrics.successCount = 450
    outputMetrics.failedCount = 12
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 加载任务列表
const loadTasks = async () => {
  // TODO: 调用实际API
  tasks.value = [
    { id: '1', name: '用户数据采集' },
    { id: '2', name: '订单数据采集' },
    { id: '3', name: '日志数据采集' }
  ]
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadData()
}

// 重置
const handleReset = () => {
  searchForm.name = ''
  searchForm.targetType = ''
  searchForm.status = ''
  handleSearch()
}

// 新增
const handleAdd = () => {
  dialogTitle.value = '新增输出配置'
  activeTab.value = 'basic'
  Object.assign(formData, {
    name: '',
    sourceTaskId: '',
    targetType: '',
    description: '',
    outputMode: 'APPEND',
    batchSize: 1000,
    outputFrequency: 'REALTIME',
    retryCount: 3,
    enableValidation: true
  })
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: OutputConfig) => {
  dialogTitle.value = '编辑输出配置'
  activeTab.value = 'basic'
  Object.assign(formData, row)
  dialogVisible.value = true
}

// 删除
const handleDelete = async (row: OutputConfig) => {
  try {
    await ElMessageBox.confirm(`确定要删除配置"${row.name}"吗？`, '提示', {
      type: 'warning'
    })
    // TODO: 调用删除API
    ElMessage.success('删除成功')
    loadData()
  } catch {
    // 用户取消
  }
}

// 切换状态
const handleToggleStatus = async (row: OutputConfig) => {
  // TODO: 调用状态切换API
  ElMessage.success(row.status === 'ENABLED' ? '已启用' : '已禁用')
}

// 类型变更
const handleTypeChange = () => {
  // 根据类型重置配置
  formData.hiveUrl = ''
  formData.host = ''
  formData.port = 3306
  formData.database = ''
  formData.tableName = ''
  formData.username = ''
  formData.password = ''
  formData.esUrl = ''
  formData.indexName = ''
  formData.typeName = ''
  formData.storagePath = ''
  formData.storageFormat = 'PARQUET'
  formData.partitionStrategy = 'DATE'
}

// 查看监控
const handleViewMonitor = async (row: OutputConfig) => {
  currentConfig.value = row
  loading.value = true
  try {
    // TODO: 调用获取监控数据API
    await new Promise(resolve => setTimeout(resolve, 500))
    monitorData.value = [
      {
        id: '1',
        outputTime: '2024-01-20 10:30:00',
        dataCount: 12500,
        status: 'SUCCESS',
        duration: '15秒',
        errorMessage: '-'
      },
      {
        id: '2',
        outputTime: '2024-01-20 10:25:00',
        dataCount: 12000,
        status: 'SUCCESS',
        duration: '14秒',
        errorMessage: '-'
      },
      {
        id: '3',
        outputTime: '2024-01-20 10:20:00',
        dataCount: 0,
        status: 'FAILED',
        duration: '5秒',
        errorMessage: '连接超时'
      }
    ]
    monitorDialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取监控数据失败')
  } finally {
    loading.value = false
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
        ElMessage.success(dialogTitle.value === '新增输出配置' ? '新增成功' : '编辑成功')
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
  loadTasks()
})
</script>

<style scoped lang="scss">
:deep(.el-card__body) {
  padding: 16px;
}
</style>