<template>
  <div class="tag-data-source p-5">
    <div class="mb-4">
      <h2 class="text-2xl font-bold mb-2">数据来源配置</h2>
      <p class="text-gray-600">定义标签与底层数据源的对应关系，明确数据来源，为数据质量管理提供支撑</p>
    </div>

    <el-card class="mb-4">
      <template #header>
        <div class="flex justify-between items-center">
          <span class="font-semibold">数据源配置列表</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增配置
          </el-button>
        </div>
      </template>

      <div class="mb-4 flex gap-4">
        <el-input
          v-model="searchText"
          placeholder="搜索标签名称或数据源名称"
          class="w-80"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="selectedSourceType" placeholder="数据源类型" clearable class="w-48">
          <el-option label="全部" value="" />
          <el-option label="数据库" value="数据库" />
          <el-option label="数据仓库" value="数据仓库" />
          <el-option label="API接口" value="API接口" />
          <el-option label="文件系统" value="文件系统" />
        </el-select>
      </div>

      <el-table :data="filteredTableData" stripe style="width: 100%">
        <el-table-column prop="tagName" label="标签名称" width="180" />
        <el-table-column prop="sourceName" label="数据源名称" width="200" />
        <el-table-column prop="sourceType" label="数据源类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getSourceTypeColor(row.sourceType)">{{ row.sourceType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="connectionInfo" label="连接信息" width="200" show-overflow-tooltip />
        <el-table-column prop="tableName" label="表名/接口" width="180" />
        <el-table-column prop="fieldMapping" label="字段映射" show-overflow-tooltip />
        <el-table-column prop="syncFrequency" label="同步频率" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '启用' ? 'success' : 'info'">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastSyncTime" label="最后同步时间" width="180" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="success" @click="handleTest(row)">测试连接</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="mt-4 flex justify-end">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredTableData.length"
          layout="total, sizes, prev, pager, next, jumper"
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
      <el-form :model="formData" label-width="120px">
        <el-form-item label="标签名称" required>
          <el-select v-model="formData.tagName" placeholder="请选择标签" filterable class="w-full">
            <el-option
              v-for="tag in tagOptions"
              :key="tag.value"
              :label="tag.label"
              :value="tag.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="数据源名称" required>
          <el-input v-model="formData.sourceName" placeholder="请输入数据源名称" />
        </el-form-item>
        <el-form-item label="数据源类型" required>
          <el-select v-model="formData.sourceType" placeholder="请选择数据源类型" class="w-full">
            <el-option label="数据库" value="数据库" />
            <el-option label="数据仓库" value="数据仓库" />
            <el-option label="API接口" value="API接口" />
            <el-option label="文件系统" value="文件系统" />
          </el-select>
        </el-form-item>
        <el-form-item label="连接信息" required>
          <el-input
            v-model="formData.connectionInfo"
            placeholder="请输入连接信息，如：jdbc:mysql://localhost:3306/dbname"
          />
        </el-form-item>
        <el-form-item label="表名/接口" required>
          <el-input v-model="formData.tableName" placeholder="请输入表名或接口路径" />
        </el-form-item>
        <el-form-item label="字段映射" required>
          <el-input
            v-model="formData.fieldMapping"
            type="textarea"
            :rows="3"
            placeholder="请输入字段映射关系，如：user_id -> id, login_time -> create_time"
          />
        </el-form-item>
        <el-form-item label="同步频率" required>
          <el-select v-model="formData.syncFrequency" placeholder="请选择同步频率" class="w-full">
            <el-option label="实时" value="实时" />
            <el-option label="每小时" value="每小时" />
            <el-option label="每天" value="每天" />
            <el-option label="每周" value="每周" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" required>
          <el-radio-group v-model="formData.status">
            <el-radio label="启用">启用</el-radio>
            <el-radio label="禁用">禁用</el-radio>
          </el-radio-group>
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
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'

interface DataSource {
  tagName: string
  sourceName: string
  sourceType: string
  connectionInfo: string
  tableName: string
  fieldMapping: string
  syncFrequency: string
  status: string
  lastSyncTime: string
}

// Mock 数据
const mockData: DataSource[] = [
  {
    tagName: '用户活跃度',
    sourceName: '用户行为数据库',
    sourceType: '数据库',
    connectionInfo: 'jdbc:mysql://192.168.1.100:3306/user_behavior',
    tableName: 'user_login_log',
    fieldMapping: 'user_id -> user_id, login_time -> login_time',
    syncFrequency: '每天',
    status: '启用',
    lastSyncTime: '2024-01-20 02:00:00',
  },
  {
    tagName: '高价值客户',
    sourceName: '订单数据仓库',
    sourceType: '数据仓库',
    connectionInfo: 'jdbc:hive://192.168.1.101:10000/warehouse',
    tableName: 'order_summary',
    fieldMapping: 'user_id -> customer_id, amount -> total_amount, count -> order_count',
    syncFrequency: '每天',
    status: '启用',
    lastSyncTime: '2024-01-20 03:00:00',
  },
  {
    tagName: '产品偏好',
    sourceName: '推荐系统API',
    sourceType: 'API接口',
    connectionInfo: 'https://api.example.com/recommend',
    tableName: '/api/v1/user/preference',
    fieldMapping: 'user_id -> userId, features -> input_features',
    syncFrequency: '实时',
    status: '启用',
    lastSyncTime: '2024-01-20 10:30:00',
  },
  {
    tagName: '注册渠道',
    sourceName: '用户注册表',
    sourceType: '数据库',
    connectionInfo: 'jdbc:mysql://192.168.1.100:3306/user_db',
    tableName: 'user_register',
    fieldMapping: 'user_id -> id, channel -> register_channel',
    syncFrequency: '实时',
    status: '启用',
    lastSyncTime: '2024-01-20 10:35:00',
  },
  {
    tagName: '流失风险',
    sourceName: '用户行为分析API',
    sourceType: 'API接口',
    connectionInfo: 'https://api.example.com/analysis',
    tableName: '/api/v1/user/churn',
    fieldMapping: 'user_id -> userId, behavior -> features',
    syncFrequency: '实时',
    status: '启用',
    lastSyncTime: '2024-01-20 10:40:00',
  },
]

const tableData = ref<DataSource[]>(mockData)
const searchText = ref('')
const selectedSourceType = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const dialogTitle = ref('新增配置')
const formData = ref<DataSource>({
  tagName: '',
  sourceName: '',
  sourceType: '',
  connectionInfo: '',
  tableName: '',
  fieldMapping: '',
  syncFrequency: '',
  status: '启用',
  lastSyncTime: '',
})

const tagOptions = [
  { label: '用户活跃度', value: '用户活跃度' },
  { label: '高价值客户', value: '高价值客户' },
  { label: '产品偏好', value: '产品偏好' },
  { label: '注册渠道', value: '注册渠道' },
  { label: '流失风险', value: '流失风险' },
]

const filteredTableData = computed(() => {
  let result = tableData.value

  if (searchText.value) {
    const keyword = searchText.value.toLowerCase()
    result = result.filter(
      (item) =>
        item.tagName.toLowerCase().includes(keyword) ||
        item.sourceName.toLowerCase().includes(keyword)
    )
  }

  if (selectedSourceType.value) {
    result = result.filter((item) => item.sourceType === selectedSourceType.value)
  }

  return result
})

const getSourceTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    数据库: 'success',
    数据仓库: 'warning',
    API接口: 'info',
    文件系统: 'danger',
  }
  return colorMap[type] || ''
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleAdd = () => {
  dialogTitle.value = '新增配置'
  formData.value = {
    tagName: '',
    sourceName: '',
    sourceType: '',
    connectionInfo: '',
    tableName: '',
    fieldMapping: '',
    syncFrequency: '',
    status: '启用',
    lastSyncTime: '',
  }
  dialogVisible.value = true
}

const handleEdit = (row: DataSource) => {
  dialogTitle.value = '编辑配置'
  formData.value = { ...row }
  dialogVisible.value = true
}

const handleTest = (row: DataSource) => {
  ElMessageBox.confirm('确定要测试该数据源连接吗？', '测试连接', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info',
  })
    .then(() => {
      ElMessage.success('数据源连接测试成功')
    })
    .catch(() => {})
}

const handleDelete = (row: DataSource) => {
  ElMessageBox.confirm(`确定要删除配置 "${row.sourceName}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      const index = tableData.value.findIndex((item) => item.sourceName === row.sourceName)
      if (index > -1) {
        tableData.value.splice(index, 1)
        ElMessage.success('删除成功')
      }
    })
    .catch(() => {})
}

const handleSubmit = () => {
  if (
    !formData.value.tagName ||
    !formData.value.sourceName ||
    !formData.value.sourceType ||
    !formData.value.connectionInfo ||
    !formData.value.tableName
  ) {
    ElMessage.warning('请填写必填项')
    return
  }

  if (dialogTitle.value === '新增配置') {
    formData.value.lastSyncTime = '-'
    tableData.value.push({ ...formData.value })
    ElMessage.success('新增成功')
  } else {
    const index = tableData.value.findIndex((item) => item.sourceName === formData.value.sourceName)
    if (index > -1) {
      tableData.value[index] = { ...formData.value }
      ElMessage.success('更新成功')
    }
  }
  dialogVisible.value = false
}

const handleDialogClose = () => {
  formData.value = {
    tagName: '',
    sourceName: '',
    sourceType: '',
    connectionInfo: '',
    tableName: '',
    fieldMapping: '',
    syncFrequency: '',
    status: '启用',
    lastSyncTime: '',
  }
}
</script>

<style scoped lang="scss">
.tag-data-source {
  min-height: 100vh;
  background-color: #f5f5f5;
}
</style>

