<template>
  <div class="task-manage-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">采集任务管理</span>
          <div class="header-actions">
            <el-button type="primary" @click="handleCreate">新建任务</el-button>
            <el-button @click="handleRefresh">刷新</el-button>
          </div>
        </div>
      </template>

      <div class="filter-section">
        <el-form :inline="true" :model="filterForm">
          <el-form-item label="任务名称">
            <el-input v-model="filterForm.name" placeholder="请输入任务名称" clearable style="width: 200px" />
          </el-form-item>
          <el-form-item label="任务类型">
            <el-select v-model="filterForm.type" placeholder="请选择类型" clearable style="width: 150px">
              <el-option label="全部" value="" />
              <el-option label="全量" value="full" />
              <el-option label="增量" value="incremental" />
              <el-option label="实时" value="realtime" />
            </el-select>
          </el-form-item>
          <el-form-item label="任务状态">
            <el-select v-model="filterForm.status" placeholder="请选择状态" clearable style="width: 150px">
              <el-option label="全部" value="" />
              <el-option label="运行中" value="running" />
              <el-option label="已停止" value="stopped" />
              <el-option label="失败" value="failed" />
              <el-option label="就绪" value="ready" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="paginatedData" border stripe style="width: 100%" v-loading="loading">
        <el-table-column type="index" label="序号" width="60" :index="indexMethod" />
        <el-table-column prop="name" label="任务名称" min-width="150" />
        <el-table-column prop="type" label="任务类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeColor(row.type)">{{ getTypeName(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="schedule" label="调度周期" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusColor(row.status)">{{ getStatusName(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dataSource" label="数据源" min-width="120" />
        <el-table-column prop="lastRunTime" label="上次运行时间" width="160" />
        <el-table-column prop="creator" label="创建人" width="100" />
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="info" size="small" @click="handleViewHistory(row)">历史</el-button>
            <el-button type="success" size="small" @click="handleTestConnection(row)">测试</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-section">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredData.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新建/编辑任务弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      @close="handleDialogClose"
    >
      <el-form :model="formData" label-width="120px" ref="formRef">
        <el-form-item label="任务模板">
          <el-select
            v-model="formData.templateId"
            placeholder="请选择任务模板（可选）"
            clearable
            style="width: 100%"
            @change="handleTemplateChange"
          >
            <el-option
              v-for="template in taskTemplates"
              :key="template.id"
              :label="template.name"
              :value="template.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="任务名称" required>
          <el-input v-model="formData.name" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="采集策略" required>
          <el-radio-group v-model="formData.type">
            <el-radio label="full">全量</el-radio>
            <el-radio label="incremental">增量</el-radio>
            <el-radio label="realtime">实时</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="数据源选择" required>
          <el-select v-model="formData.dataSourceId" placeholder="请选择数据源" style="width: 100%">
            <el-option
              v-for="ds in dataSources"
              :key="ds.id"
              :label="ds.name"
              :value="ds.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="采集周期" required>
          <el-select v-model="formData.schedule" placeholder="请选择采集周期" style="width: 100%">
            <el-option label="每小时" value="0 0 * * * ?" />
            <el-option label="每天" value="0 0 0 * * ?" />
            <el-option label="每周" value="0 0 0 ? * MON" />
            <el-option label="每月" value="0 0 0 1 * ?" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item label="Cron表达式" v-if="formData.schedule === 'custom'">
          <el-input v-model="formData.customCron" placeholder="请输入cron表达式，例如：0 0 12 * * ?" />
        </el-form-item>
        <el-form-item label="采集模板">
          <el-select v-model="formData.collectTemplate" placeholder="请选择采集模板" style="width: 100%">
            <el-option label="默认模板" value="default" />
            <el-option label="增量同步模板" value="incremental_sync" />
            <el-option label="全量备份模板" value="full_backup" />
            <el-option label="实时流模板" value="realtime_stream" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注信息">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="warning" @click="handleTest">测试连接</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>

    <!-- 任务历史弹窗 -->
    <el-dialog
      v-model="historyDialogVisible"
      title="任务历史记录"
      width="900px"
    >
      <el-tabs v-model="activeTab">
        <el-tab-pane label="变更历史" name="history">
          <el-table :data="currentTaskHistory" border stripe style="width: 100%">
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="version" label="版本号" width="100" />
            <el-table-column prop="changeTime" label="变更时间" width="160" />
            <el-table-column prop="changeUser" label="变更人" width="100" />
            <el-table-column prop="changeType" label="变更类型" width="100">
              <template #default="{ row }">
                <el-tag :type="row.changeType === 'create' ? 'success' : row.changeType === 'update' ? 'warning' : 'info'">
                  {{ getChangeTypeName(row.changeType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="变更描述" min-width="200" />
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  size="small"
                  @click="handleRollback(row)"
                  :disabled="row.version === 'v1.0'"
                >
                  回滚
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="执行记录" name="execution">
          <el-table :data="currentTaskExecutions" border stripe style="width: 100%">
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="executeTime" label="执行时间" width="160" />
            <el-table-column prop="status" label="执行状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'success' ? 'success' : row.status === 'failed' ? 'danger' : 'warning'">
                  {{ row.status === 'success' ? '成功' : row.status === 'failed' ? '失败' : '运行中' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="duration" label="执行时长" width="100" />
            <el-table-column prop="recordCount" label="采集记录数" width="120" />
            <el-table-column prop="message" label="执行信息" min-width="200" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="historyDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

interface Task {
  id: number
  name: string
  type: string
  schedule: string
  status: string
  dataSource: string
  dataSourceId: number
  lastRunTime: string
  creator: string
  collectTemplate?: string
  remark?: string
  customCron?: string
}

interface FilterForm {
  name: string
  type: string
  status: string
}

interface FormData {
  id?: number
  name: string
  type: string
  dataSourceId: number | null
  schedule: string
  collectTemplate: string
  remark: string
  templateId: number | null
  customCron: string
}

interface TaskHistory {
  version: string
  changeTime: string
  changeUser: string
  changeType: string
  description: string
}

interface TaskExecution {
  executeTime: string
  status: string
  duration: string
  recordCount: number
  message: string
}

interface DataSource {
  id: number
  name: string
}

interface TaskTemplate {
  id: number
  name: string
  type: string
  schedule: string
  collectTemplate: string
  remark: string
}

// Mock 数据源
const dataSources = ref<DataSource[]>([
  { id: 1, name: 'MySQL生产库' },
  { id: 2, name: 'PostgreSQL数据仓库' },
  { id: 3, name: 'MongoDB文档库' },
  { id: 4, name: 'Redis缓存' },
  { id: 5, name: 'Hive大数据仓库' },
  { id: 6, name: 'Elasticsearch搜索' }
])

// Mock 任务模板
const taskTemplates = ref<TaskTemplate[]>([
  {
    id: 1,
    name: '每日全量备份模板',
    type: 'full',
    schedule: '0 0 0 * * ?',
    collectTemplate: 'full_backup',
    remark: '每日凌晨执行全量备份'
  },
  {
    id: 2,
    name: '实时数据流模板',
    type: 'realtime',
    schedule: '0 0 * * * ?',
    collectTemplate: 'realtime_stream',
    remark: '实时采集数据流'
  },
  {
    id: 3,
    name: '增量同步模板',
    type: 'incremental',
    schedule: '0 0 0 ? * MON',
    collectTemplate: 'incremental_sync',
    remark: '每周一执行增量同步'
  }
])

// Mock 任务数据
const mockTasks = ref<Task[]>([
  {
    id: 1,
    name: '用户数据全量采集',
    type: 'full',
    schedule: '0 0 0 * * ?',
    status: 'running',
    dataSource: 'MySQL生产库',
    dataSourceId: 1,
    lastRunTime: '2025-10-28 02:00:00',
    creator: '张三',
    collectTemplate: 'full_backup',
    remark: '每日用户数据全量备份'
  },
  {
    id: 2,
    name: '订单增量同步',
    type: 'incremental',
    schedule: '0 0 * * * ?',
    status: 'ready',
    dataSource: 'PostgreSQL数据仓库',
    dataSourceId: 2,
    lastRunTime: '2025-10-28 10:00:00',
    creator: '李四',
    collectTemplate: 'incremental_sync',
    remark: '每小时增量同步订单数据'
  },
  {
    id: 3,
    name: '日志实时采集',
    type: 'realtime',
    schedule: '0 0 * * * ?',
    status: 'running',
    dataSource: 'Elasticsearch搜索',
    dataSourceId: 6,
    lastRunTime: '2025-10-28 11:00:00',
    creator: '王五',
    collectTemplate: 'realtime_stream',
    remark: '实时采集系统日志'
  },
  {
    id: 4,
    name: '商品数据全量备份',
    type: 'full',
    schedule: '0 0 0 ? * MON',
    status: 'stopped',
    dataSource: 'MongoDB文档库',
    dataSourceId: 3,
    lastRunTime: '2025-10-21 02:00:00',
    creator: '赵六',
    collectTemplate: 'full_backup',
    remark: '每周一全量备份商品数据'
  },
  {
    id: 5,
    name: '会员信息增量采集',
    type: 'incremental',
    schedule: '0 0 0 * * ?',
    status: 'failed',
    dataSource: 'MySQL生产库',
    dataSourceId: 1,
    lastRunTime: '2025-10-28 02:30:00',
    creator: '孙七',
    collectTemplate: 'incremental_sync',
    remark: '每日增量采集会员信息'
  },
  {
    id: 6,
    name: '缓存数据实时监控',
    type: 'realtime',
    schedule: '0 0 * * * ?',
    status: 'running',
    dataSource: 'Redis缓存',
    dataSourceId: 4,
    lastRunTime: '2025-10-28 11:00:00',
    creator: '周八',
    collectTemplate: 'realtime_stream',
    remark: '实时监控缓存数据变化'
  },
  {
    id: 7,
    name: '大数据仓库全量采集',
    type: 'full',
    schedule: '0 0 0 1 * ?',
    status: 'ready',
    dataSource: 'Hive大数据仓库',
    dataSourceId: 5,
    lastRunTime: '2025-10-01 02:00:00',
    creator: '吴九',
    collectTemplate: 'full_backup',
    remark: '每月1号全量采集大数据仓库'
  }
])

const tableData = ref<Task[]>([...mockTasks.value])
const filteredData = ref<Task[]>([...mockTasks.value])
const loading = ref(false)

const filterForm = reactive<FilterForm>({
  name: '',
  type: '',
  status: ''
})

const pagination = reactive({
  currentPage: 1,
  pageSize: 10
})

const dialogVisible = ref(false)
const historyDialogVisible = ref(false)
const dialogTitle = computed(() => formData.id ? '编辑任务' : '新建任务')
const submitting = ref(false)
const formRef = ref()

const formData = reactive<FormData>({
  name: '',
  type: 'full',
  dataSourceId: null,
  schedule: '0 0 0 * * ?',
  collectTemplate: 'default',
  remark: '',
  templateId: null,
  customCron: ''
})

// Mock 任务历史数据
const taskHistoryMap = ref<Record<number, TaskHistory[]>>({
  1: [
    {
      version: 'v1.3',
      changeTime: '2025-10-28 10:00:00',
      changeUser: '张三',
      changeType: 'update',
      description: '修改调度周期为每日执行'
    },
    {
      version: 'v1.2',
      changeTime: '2025-10-25 14:30:00',
      changeUser: '李四',
      changeType: 'update',
      description: '更新数据源配置'
    },
    {
      version: 'v1.1',
      changeTime: '2025-10-20 09:15:00',
      changeUser: '张三',
      changeType: 'update',
      description: '修改备注信息'
    },
    {
      version: 'v1.0',
      changeTime: '2025-10-15 16:00:00',
      changeUser: '张三',
      changeType: 'create',
      description: '创建任务'
    }
  ],
  2: [
    {
      version: 'v1.1',
      changeTime: '2025-10-27 11:20:00',
      changeUser: '李四',
      changeType: 'update',
      description: '调整采集周期为每小时'
    },
    {
      version: 'v1.0',
      changeTime: '2025-10-20 10:00:00',
      changeUser: '李四',
      changeType: 'create',
      description: '创建任务'
    }
  ]
})

// Mock 任务执行记录
const taskExecutionMap = ref<Record<number, TaskExecution[]>>({
  1: [
    {
      executeTime: '2025-10-28 02:00:00',
      status: 'success',
      duration: '5分32秒',
      recordCount: 125680,
      message: '全量采集成功，共采集125680条记录'
    },
    {
      executeTime: '2025-10-27 02:00:00',
      status: 'success',
      duration: '5分28秒',
      recordCount: 124532,
      message: '全量采集成功，共采集124532条记录'
    },
    {
      executeTime: '2025-10-26 02:00:00',
      status: 'failed',
      duration: '1分15秒',
      recordCount: 0,
      message: '连接数据库超时，采集失败'
    }
  ],
  2: [
    {
      executeTime: '2025-10-28 10:00:00',
      status: 'success',
      duration: '2分18秒',
      recordCount: 3560,
      message: '增量采集成功，共采集3560条记录'
    },
    {
      executeTime: '2025-10-28 09:00:00',
      status: 'success',
      duration: '2分05秒',
      recordCount: 3412,
      message: '增量采集成功，共采集3412条记录'
    }
  ]
})

const currentTaskHistory = ref<TaskHistory[]>([])
const currentTaskExecutions = ref<TaskExecution[]>([])
const currentTaskId = ref<number | null>(null)
const activeTab = ref('history')

// 分页数据
const paginatedData = computed(() => {
  const start = (pagination.currentPage - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return filteredData.value.slice(start, end)
})

// 索引计算
const indexMethod = (index: number) => {
  return (pagination.currentPage - 1) * pagination.pageSize + index + 1
}

// 获取类型名称
const getTypeName = (type: string): string => {
  const typeMap: Record<string, string> = {
    full: '全量',
    incremental: '增量',
    realtime: '实时'
  }
  return typeMap[type] || type
}

// 获取类型颜色
const getTypeColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    full: 'primary',
    incremental: 'success',
    realtime: 'warning'
  }
  return colorMap[type] || ''
}

// 获取状态名称
const getStatusName = (status: string): string => {
  const statusMap: Record<string, string> = {
    running: '运行中',
    stopped: '已停止',
    failed: '失败',
    ready: '就绪'
  }
  return statusMap[status] || status
}

// 获取状态颜色
const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    running: 'success',
    stopped: 'info',
    failed: 'danger',
    ready: 'warning'
  }
  return colorMap[status] || ''
}

// 获取变更类型名称
const getChangeTypeName = (type: string): string => {
  const typeMap: Record<string, string> = {
    create: '创建',
    update: '更新',
    delete: '删除'
  }
  return typeMap[type] || type
}

// 新建任务
const handleCreate = () => {
  console.log('点击新建任务')
  resetForm()
  dialogVisible.value = true
}

// 编辑任务
const handleEdit = (row: Task) => {
  console.log('编辑任务:', row)
  Object.assign(formData, {
    id: row.id,
    name: row.name,
    type: row.type,
    dataSourceId: row.dataSourceId,
    schedule: row.schedule,
    collectTemplate: row.collectTemplate || 'default',
    remark: row.remark || '',
    templateId: null,
    customCron: row.customCron || ''
  })
  dialogVisible.value = true
}

// 删除任务
const handleDelete = (row: Task) => {
  console.log('删除任务:', row)
  ElMessageBox.confirm(`确定要删除任务"${row.name}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    loading.value = true
    setTimeout(() => {
      const index = tableData.value.findIndex(item => item.id === row.id)
      if (index > -1) {
        tableData.value.splice(index, 1)
        filteredData.value = [...tableData.value]
        loading.value = false
        ElMessage.success('删除成功')
      }
    }, 500)
  }).catch(() => {
    console.log('取消删除')
  })
}

// 查看任务历史
const handleViewHistory = (row: Task) => {
  console.log('查看任务历史:', row)
  currentTaskId.value = row.id
  currentTaskHistory.value = taskHistoryMap.value[row.id] || []
  currentTaskExecutions.value = taskExecutionMap.value[row.id] || []
  activeTab.value = 'history'
  historyDialogVisible.value = true
}

// 测试连接
const handleTestConnection = (row: Task) => {
  console.log('测试任务连接:', row)
  loading.value = true
  setTimeout(() => {
    loading.value = false
    const success = Math.random() > 0.3
    if (success) {
      ElMessage.success(`任务"${row.name}"测试连接成功`)
    } else {
      ElMessage.error(`任务"${row.name}"测试连接失败`)
    }
  }, 1000)
}

// 刷新
const handleRefresh = () => {
  console.log('点击刷新')
  loading.value = true
  setTimeout(() => {
    tableData.value = [...mockTasks.value]
    filteredData.value = [...mockTasks.value]
    pagination.currentPage = 1
    loading.value = false
    ElMessage.success('刷新成功')
  }, 500)
}

// 查询
const handleSearch = () => {
  console.log('查询条件:', filterForm)
  let filtered = [...tableData.value]

  if (filterForm.name) {
    filtered = filtered.filter(item => item.name.includes(filterForm.name))
  }

  if (filterForm.type) {
    filtered = filtered.filter(item => item.type === filterForm.type)
  }

  if (filterForm.status) {
    filtered = filtered.filter(item => item.status === filterForm.status)
  }

  filteredData.value = filtered
  pagination.currentPage = 1
  ElMessage.success('查询完成')
}

// 重置
const handleReset = () => {
  console.log('重置查询条件')
  filterForm.name = ''
  filterForm.type = ''
  filterForm.status = ''
  filteredData.value = [...tableData.value]
  pagination.currentPage = 1
}

// 分页大小变化
const handleSizeChange = (val: number) => {
  console.log('每页条数变化:', val)
  pagination.pageSize = val
}

// 当前页变化
const handleCurrentChange = (val: number) => {
  console.log('当前页变化:', val)
  pagination.currentPage = val
}

// 模板选择变化
const handleTemplateChange = (templateId: number | null) => {
  if (!templateId) return

  const template = taskTemplates.value.find(t => t.id === templateId)
  if (template) {
    console.log('选择模板:', template)
    formData.type = template.type
    formData.schedule = template.schedule
    formData.collectTemplate = template.collectTemplate
    formData.remark = template.remark
    ElMessage.success('已应用模板配置')
  }
}

// 测试连接
const handleTest = () => {
  console.log('测试连接:', formData)

  if (!formData.dataSourceId) {
    ElMessage.warning('请先选择数据源')
    return
  }

  submitting.value = true
  setTimeout(() => {
    submitting.value = false
    const success = Math.random() > 0.2
    if (success) {
      ElMessage.success('连接测试成功')
    } else {
      ElMessage.error('连接测试失败，请检查数据源配置')
    }
  }, 1500)
}

// 提交表单
const handleSubmit = () => {
  console.log('提交表单:', formData)

  if (!formData.name || !formData.dataSourceId) {
    ElMessage.warning('请填写必填项')
    return
  }

  submitting.value = true
  setTimeout(() => {
    const dataSource = dataSources.value.find(ds => ds.id === formData.dataSourceId)

    if (formData.id) {
      // 编辑
      const index = tableData.value.findIndex(item => item.id === formData.id)
      if (index > -1) {
        tableData.value[index] = {
          ...tableData.value[index],
          name: formData.name,
          type: formData.type,
          dataSourceId: formData.dataSourceId,
          dataSource: dataSource?.name || '',
          schedule: formData.schedule === 'custom' ? formData.customCron : formData.schedule,
          collectTemplate: formData.collectTemplate,
          remark: formData.remark,
          customCron: formData.schedule === 'custom' ? formData.customCron : ''
        }

        // 添加历史记录
        if (!taskHistoryMap.value[formData.id]) {
          taskHistoryMap.value[formData.id] = []
        }
        const historyCount = taskHistoryMap.value[formData.id].length
        taskHistoryMap.value[formData.id].unshift({
          version: `v1.${historyCount}`,
          changeTime: new Date().toLocaleString('zh-CN', { hour12: false }),
          changeUser: '当前用户',
          changeType: 'update',
          description: '更新任务配置'
        })

        ElMessage.success('编辑成功')
      }
    } else {
      // 新增
      const newTask: Task = {
        id: Date.now(),
        name: formData.name,
        type: formData.type,
        dataSourceId: formData.dataSourceId,
        dataSource: dataSource?.name || '',
        schedule: formData.schedule === 'custom' ? formData.customCron : formData.schedule,
        status: 'ready',
        lastRunTime: '-',
        creator: '当前用户',
        collectTemplate: formData.collectTemplate,
        remark: formData.remark,
        customCron: formData.schedule === 'custom' ? formData.customCron : ''
      }
      tableData.value.unshift(newTask)

      // 添加历史记录
      taskHistoryMap.value[newTask.id] = [{
        version: 'v1.0',
        changeTime: new Date().toLocaleString('zh-CN', { hour12: false }),
        changeUser: '当前用户',
        changeType: 'create',
        description: '创建任务'
      }]

      ElMessage.success('新增成功')
    }

    filteredData.value = [...tableData.value]
    submitting.value = false
    dialogVisible.value = false
  }, 1000)
}

// 回滚任务
const handleRollback = (row: TaskHistory) => {
  console.log('回滚到版本:', row)
  ElMessageBox.confirm(`确定要回滚到版本 ${row.version} 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    setTimeout(() => {
      ElMessage.success(`已回滚到版本 ${row.version}`)

      // 添加回滚记录
      if (currentTaskId.value && taskHistoryMap.value[currentTaskId.value]) {
        const historyCount = taskHistoryMap.value[currentTaskId.value].length
        taskHistoryMap.value[currentTaskId.value].unshift({
          version: `v1.${historyCount}`,
          changeTime: new Date().toLocaleString('zh-CN', { hour12: false }),
          changeUser: '当前用户',
          changeType: 'update',
          description: `回滚到版本 ${row.version}`
        })
        currentTaskHistory.value = [...taskHistoryMap.value[currentTaskId.value]]
      }
    }, 500)
  }).catch(() => {
    console.log('取消回滚')
  })
}

// 关闭对话框
const handleDialogClose = () => {
  resetForm()
}

// 重置表单
const resetForm = () => {
  formData.id = undefined
  formData.name = ''
  formData.type = 'full'
  formData.dataSourceId = null
  formData.schedule = '0 0 0 * * ?'
  formData.collectTemplate = 'default'
  formData.remark = ''
  formData.templateId = null
  formData.customCron = ''
}
</script>

<style scoped>
.task-manage-container {
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

.pagination-section {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.el-table {
  margin-top: 16px;
}
</style>
