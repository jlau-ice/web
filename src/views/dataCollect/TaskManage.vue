<template>
  <div class="p-4 bg-white h-full">
    <div class="mb-4 flex justify-between items-center">
      <h2 class="text-xl font-bold">采集任务管理</h2>
      <div>
        <el-button @click="handleTemplateManage">
          <el-icon class="mr-1"><DocumentCopy /></el-icon>
          模板管理
        </el-button>
        <el-button type="primary" @click="handleAdd">
          <el-icon class="mr-1"><Plus /></el-icon>
          新增任务
        </el-button>
      </div>
    </div>

    <!-- 搜索栏 -->
    <el-card class="mb-4">
      <el-form :inline="true" :model="searchForm" class="demo-form-inline">
        <el-form-item label="任务名称">
          <el-input v-model="searchForm.name" placeholder="请输入任务名称" clearable />
        </el-form-item>
        <el-form-item label="任务分组">
          <el-select v-model="searchForm.group" placeholder="请选择" clearable>
            <el-option
              v-for="group in taskGroups"
              :key="group"
              :label="group"
              :value="group"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="采集模式">
          <el-select v-model="searchForm.mode" placeholder="请选择" clearable>
            <el-option label="全量" value="FULL" />
            <el-option label="增量" value="INCREMENTAL" />
            <el-option label="实时" value="REALTIME" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable>
            <el-option label="运行中" value="RUNNING" />
            <el-option label="已停止" value="STOPPED" />
            <el-option label="已暂停" value="PAUSED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 任务列表 -->
    <el-card>
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="name" label="任务名称" min-width="150" />
        <el-table-column prop="group" label="任务分组" width="120" />
        <el-table-column prop="dataSource" label="数据源" min-width="150" />
        <el-table-column prop="mode" label="采集模式" width="100">
          <template #default="{ row }">
            <el-tag :type="getModeTagType(row.mode)">{{ getModeLabel(row.mode) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="schedule" label="执行周期" width="150" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastRunTime" label="最后执行时间" width="180" />
        <el-table-column prop="version" label="版本" width="80" />
        <el-table-column label="操作" width="350" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleViewVersion(row)">
              <el-icon><Clock /></el-icon>
              版本历史
            </el-button>
            <el-button
              link
              type="primary"
              size="small"
              @click="handleToggleStatus(row)"
            >
              <el-icon>
                <component :is="row.status === 'RUNNING' ? 'VideoPause' : 'VideoPlay'" />
              </el-icon>
              {{ row.status === 'RUNNING' ? '暂停' : '启动' }}
            </el-button>
            <el-button link type="primary" size="small" @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button link type="primary" size="small" @click="handleCopy(row)">
              <el-icon><CopyDocument /></el-icon>
              复制
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
      width="900px"
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
            <el-form-item label="任务名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入任务名称" />
            </el-form-item>
            <el-form-item label="任务分组" prop="group">
              <el-select v-model="formData.group" placeholder="请选择任务分组" filterable allow-create>
                <el-option
                  v-for="group in taskGroups"
                  :key="group"
                  :label="group"
                  :value="group"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="数据源" prop="dataSourceId">
              <el-select v-model="formData.dataSourceId" placeholder="请选择数据源">
                <el-option
                  v-for="ds in dataSources"
                  :key="ds.id"
                  :label="ds.name"
                  :value="ds.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="采集模式" prop="mode">
              <el-radio-group v-model="formData.mode">
                <el-radio label="FULL">全量</el-radio>
                <el-radio label="INCREMENTAL">增量</el-radio>
                <el-radio label="REALTIME">实时</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="执行周期" prop="schedule">
              <el-select v-model="formData.schedule" placeholder="请选择执行周期">
                <el-option label="立即执行" value="IMMEDIATE" />
                <el-option label="每天" value="DAILY" />
                <el-option label="每周" value="WEEKLY" />
                <el-option label="每月" value="MONTHLY" />
                <el-option label="自定义Cron" value="CUSTOM" />
              </el-select>
            </el-form-item>
            <el-form-item v-if="formData.schedule === 'CUSTOM'" label="Cron表达式" prop="cron">
              <el-input v-model="formData.cron" placeholder="例如: 0 0 2 * * ?" />
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
        <el-tab-pane label="采集配置" name="config">
          <el-form :model="formData" label-width="120px">
            <el-form-item label="源表/集合">
              <el-input v-model="formData.sourceTable" placeholder="请输入源表或集合名称" />
            </el-form-item>
            <el-form-item label="目标表">
              <el-input v-model="formData.targetTable" placeholder="请输入目标表名称" />
            </el-form-item>
            <el-form-item label="增量字段">
              <el-input
                v-model="formData.incrementalField"
                placeholder="请输入增量字段名（增量模式必填）"
              />
            </el-form-item>
            <el-form-item label="采集条件">
              <el-input
                v-model="formData.filterCondition"
                type="textarea"
                :rows="3"
                placeholder="请输入SQL WHERE条件或过滤表达式"
              />
            </el-form-item>
            <el-form-item label="字段映射">
              <el-button @click="handleFieldMapping">配置字段映射</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="高级设置" name="advanced">
          <el-form :model="formData" label-width="120px">
            <el-form-item label="并发数">
              <el-input-number v-model="formData.concurrentNum" :min="1" :max="100" />
            </el-form-item>
            <el-form-item label="批次大小">
              <el-input-number v-model="formData.batchSize" :min="100" :max="100000" />
            </el-form-item>
            <el-form-item label="超时时间(秒)">
              <el-input-number v-model="formData.timeout" :min="60" :max="3600" />
            </el-form-item>
            <el-form-item label="失败重试次数">
              <el-input-number v-model="formData.retryCount" :min="0" :max="10" />
            </el-form-item>
            <el-form-item label="启用断点续传">
              <el-switch v-model="formData.enableResume" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button @click="handleSaveAsTemplate">保存为模板</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 版本历史对话框 -->
    <el-dialog v-model="versionDialogVisible" title="版本历史" width="800px">
      <el-table :data="versionData" stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="version" label="版本号" width="100" />
        <el-table-column prop="changeDesc" label="变更说明" min-width="200" />
        <el-table-column prop="operator" label="操作人" width="120" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleRestoreVersion(row)">
              恢复到此版本
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 模板管理对话框 -->
    <el-dialog v-model="templateDialogVisible" title="任务模板管理" width="800px">
      <div class="mb-4">
        <el-button type="primary" @click="handleAddTemplate">
          <el-icon class="mr-1"><Plus /></el-icon>
          新增模板
        </el-button>
      </div>
      <el-table :data="templateData" stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="name" label="模板名称" min-width="150" />
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleUseTemplate(row)">
              使用
            </el-button>
            <el-button link type="primary" size="small" @click="handleEditTemplate(row)">
              编辑
            </el-button>
            <el-button link type="danger" size="small" @click="handleDeleteTemplate(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  DocumentCopy,
  Edit,
  Delete,
  CopyDocument,
  Clock,
  VideoPlay,
  VideoPause
} from '@element-plus/icons-vue'

interface Task {
  id: string
  name: string
  group: string
  dataSource: string
  mode: string
  schedule: string
  status: string
  lastRunTime: string
  version: string
  dataSourceId?: string
  cron?: string
  description?: string
  sourceTable?: string
  targetTable?: string
  incrementalField?: string
  filterCondition?: string
  concurrentNum?: number
  batchSize?: number
  timeout?: number
  retryCount?: number
  enableResume?: boolean
}

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const versionDialogVisible = ref(false)
const templateDialogVisible = ref(false)
const dialogTitle = ref('新增任务')
const activeTab = ref('basic')
const formRef = ref()
const tableData = ref<Task[]>([])
const versionData = ref<any[]>([])
const templateData = ref<any[]>([])
const dataSources = ref<any[]>([])
const taskGroups = ref(['默认分组', '生产环境', '测试环境', '开发环境'])

const searchForm = reactive({
  name: '',
  group: '',
  mode: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const formData = reactive<Partial<Task>>({
  name: '',
  group: '',
  dataSourceId: '',
  mode: 'FULL',
  schedule: 'DAILY',
  cron: '',
  description: '',
  sourceTable: '',
  targetTable: '',
  incrementalField: '',
  filterCondition: '',
  concurrentNum: 4,
  batchSize: 1000,
  timeout: 300,
  retryCount: 3,
  enableResume: true
})

const formRules = {
  name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  group: [{ required: true, message: '请选择任务分组', trigger: 'change' }],
  dataSourceId: [{ required: true, message: '请选择数据源', trigger: 'change' }],
  mode: [{ required: true, message: '请选择采集模式', trigger: 'change' }],
  schedule: [{ required: true, message: '请选择执行周期', trigger: 'change' }]
}

// 获取模式标签类型
const getModeTagType = (mode: string) => {
  const modeMap: Record<string, string> = {
    FULL: 'primary',
    INCREMENTAL: 'success',
    REALTIME: 'warning'
  }
  return modeMap[mode] || 'info'
}

// 获取模式标签文本
const getModeLabel = (mode: string) => {
  const labelMap: Record<string, string> = {
    FULL: '全量',
    INCREMENTAL: '增量',
    REALTIME: '实时'
  }
  return labelMap[mode] || mode
}

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  const statusMap: Record<string, string> = {
    RUNNING: 'success',
    STOPPED: 'info',
    PAUSED: 'warning'
  }
  return statusMap[status] || 'info'
}

// 获取状态标签文本
const getStatusLabel = (status: string) => {
  const labelMap: Record<string, string> = {
    RUNNING: '运行中',
    STOPPED: '已停止',
    PAUSED: '已暂停'
  }
  return labelMap[status] || status
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
        name: '用户数据采集',
        group: '生产环境',
        dataSource: '生产MySQL数据库',
        mode: 'INCREMENTAL',
        schedule: '每天 02:00',
        status: 'RUNNING',
        lastRunTime: '2024-01-20 02:00:00',
        version: 'v1.2'
      },
      {
        id: '2',
        name: '订单数据采集',
        group: '生产环境',
        dataSource: '生产MySQL数据库',
        mode: 'REALTIME',
        schedule: '实时',
        status: 'RUNNING',
        lastRunTime: '2024-01-20 10:30:00',
        version: 'v2.0'
      }
    ]
    pagination.total = tableData.value.length
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 加载数据源
const loadDataSources = async () => {
  // TODO: 调用实际API
  dataSources.value = [
    { id: '1', name: '生产MySQL数据库' },
    { id: '2', name: 'MongoDB日志库' },
    { id: '3', name: '用户服务API' }
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
  searchForm.group = ''
  searchForm.mode = ''
  searchForm.status = ''
  handleSearch()
}

// 新增
const handleAdd = () => {
  dialogTitle.value = '新增任务'
  activeTab.value = 'basic'
  Object.assign(formData, {
    name: '',
    group: '',
    dataSourceId: '',
    mode: 'FULL',
    schedule: 'DAILY',
    cron: '',
    description: '',
    sourceTable: '',
    targetTable: '',
    incrementalField: '',
    filterCondition: '',
    concurrentNum: 4,
    batchSize: 1000,
    timeout: 300,
    retryCount: 3,
    enableResume: true
  })
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: Task) => {
  dialogTitle.value = '编辑任务'
  activeTab.value = 'basic'
  Object.assign(formData, row)
  dialogVisible.value = true
}

// 删除
const handleDelete = async (row: Task) => {
  try {
    await ElMessageBox.confirm(`确定要删除任务"${row.name}"吗？`, '提示', {
      type: 'warning'
    })
    // TODO: 调用删除API
    ElMessage.success('删除成功')
    loadData()
  } catch {
    // 用户取消
  }
}

// 复制
const handleCopy = (row: Task) => {
  dialogTitle.value = '复制任务'
  activeTab.value = 'basic'
  Object.assign(formData, { ...row, name: `${row.name}_副本` })
  dialogVisible.value = true
}

// 切换状态
const handleToggleStatus = async (row: Task) => {
  // TODO: 调用状态切换API
  ElMessage.success(row.status === 'RUNNING' ? '已暂停' : '已启动')
  loadData()
}

// 查看版本历史
const handleViewVersion = async (row: Task) => {
  // TODO: 调用版本历史API
  versionData.value = [
    {
      version: 'v1.2',
      changeDesc: '优化增量采集逻辑',
      operator: '张三',
      createTime: '2024-01-18 15:30:00'
    },
    {
      version: 'v1.1',
      changeDesc: '修复数据丢失问题',
      operator: '李四',
      createTime: '2024-01-15 10:20:00'
    },
    {
      version: 'v1.0',
      changeDesc: '初始版本',
      operator: '王五',
      createTime: '2024-01-10 09:00:00'
    }
  ]
  versionDialogVisible.value = true
}

// 恢复版本
const handleRestoreVersion = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要恢复到版本"${row.version}"吗？`, '提示', {
      type: 'warning'
    })
    // TODO: 调用恢复版本API
    ElMessage.success('恢复成功')
    versionDialogVisible.value = false
    loadData()
  } catch {
    // 用户取消
  }
}

// 字段映射
const handleFieldMapping = () => {
  ElMessage.info('字段映射配置功能开发中')
}

// 保存为模板
const handleSaveAsTemplate = () => {
  ElMessageBox.prompt('请输入模板名称', '保存为模板', {
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  })
    .then(({ value }) => {
      // TODO: 调用保存模板API
      ElMessage.success('保存成功')
    })
    .catch(() => {})
}

// 模板管理
const handleTemplateManage = () => {
  // TODO: 加载模板数据
  templateData.value = [
    {
      id: '1',
      name: 'MySQL全量采集模板',
      description: '适用于MySQL数据库的全量采集',
      createTime: '2024-01-15 10:00:00'
    }
  ]
  templateDialogVisible.value = true
}

// 使用模板
const handleUseTemplate = (row: any) => {
  // TODO: 加载模板配置
  ElMessage.success('模板已应用')
  templateDialogVisible.value = false
  dialogVisible.value = true
}

// 新增模板
const handleAddTemplate = () => {
  ElMessage.info('新增模板功能开发中')
}

// 编辑模板
const handleEditTemplate = (row: any) => {
  ElMessage.info('编辑模板功能开发中')
}

// 删除模板
const handleDeleteTemplate = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除模板"${row.name}"吗？`, '提示', {
      type: 'warning'
    })
    // TODO: 调用删除模板API
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
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
        ElMessage.success(dialogTitle.value === '新增任务' ? '新增成功' : '编辑成功')
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
  loadDataSources()
})
</script>

<style scoped lang="scss">
:deep(.el-card__body) {
  padding: 16px;
}
</style>