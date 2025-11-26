<template>
  <div class="p-[20px]">
    <div class="mb-4">
      <h2 class="text-2xl font-bold mb-4">数据来源映射</h2>
      <p class="text-gray-600 mb-4">
        数据来源映射模块负责定义指标与底层数据源的对应关系，清晰标识数据来源。
      </p>
    </div>

    <!-- 搜索和操作栏 -->
    <div class="mb-4 flex justify-between items-center">
      <el-input
        v-model="searchText"
        placeholder="请输入指标名称或数据源名称"
        style="width: 300px"
        clearable
        @input="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增映射
      </el-button>
    </div>

    <!-- 表格 -->
    <el-table :data="filteredTableData" border stripe style="width: 100%">
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column prop="indicatorCode" label="指标编码" width="150" />
      <el-table-column prop="indicatorName" label="指标名称" width="200" />
      <el-table-column prop="dataSourceType" label="数据源类型" width="120" />
      <el-table-column prop="dataSourceName" label="数据源名称" width="200" />
      <el-table-column prop="tableName" label="表名" width="150" />
      <el-table-column prop="fieldName" label="字段名" width="150" />
      <el-table-column prop="mappingRule" label="映射规则" min-width="200" show-overflow-tooltip />
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === '启用' ? 'success' : 'info'">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="updateTime" label="更新时间" width="180" />
      <el-table-column label="操作" width="200" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleEdit(row)">
            编辑
          </el-button>
          <el-button type="info" link size="small" @click="handleTest(row)">
            测试连接
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="mt-4 flex justify-end">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="filteredTableData.length"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      @close="handleDialogClose"
    >
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="指标编码" prop="indicatorCode">
          <el-select
            v-model="formData.indicatorCode"
            placeholder="请选择指标"
            filterable
            style="width: 100%"
            @change="handleIndicatorChange"
          >
            <el-option
              v-for="item in indicatorOptions"
              :key="item.code"
              :label="`${item.code} - ${item.name}`"
              :value="item.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="指标名称" prop="indicatorName">
          <el-input v-model="formData.indicatorName" disabled />
        </el-form-item>
        <el-form-item label="数据源类型" prop="dataSourceType">
          <el-select v-model="formData.dataSourceType" placeholder="请选择数据源类型" style="width: 100%">
            <el-option label="MySQL" value="MySQL" />
            <el-option label="PostgreSQL" value="PostgreSQL" />
            <el-option label="Oracle" value="Oracle" />
            <el-option label="MongoDB" value="MongoDB" />
            <el-option label="API接口" value="API接口" />
            <el-option label="文件" value="文件" />
          </el-select>
        </el-form-item>
        <el-form-item label="数据源名称" prop="dataSourceName">
          <el-input v-model="formData.dataSourceName" placeholder="请输入数据源名称" />
        </el-form-item>
        <el-form-item label="表名" prop="tableName">
          <el-input v-model="formData.tableName" placeholder="请输入表名" />
        </el-form-item>
        <el-form-item label="字段名" prop="fieldName">
          <el-input v-model="formData.fieldName" placeholder="请输入字段名" />
        </el-form-item>
        <el-form-item label="映射规则" prop="mappingRule">
          <el-input
            v-model="formData.mappingRule"
            type="textarea"
            :rows="3"
            placeholder="请输入映射规则，例如：WHERE 条件 = 'value'"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio label="启用">启用</el-radio>
            <el-radio label="停用">停用</el-radio>
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
import { Search, Plus } from '@element-plus/icons-vue'

// Mock 数据
const mockData = [
  {
    id: '1',
    indicatorCode: 'IND001',
    indicatorName: '营业收入',
    dataSourceType: 'MySQL',
    dataSourceName: '业务数据库',
    tableName: 'sales_order',
    fieldName: 'amount',
    mappingRule: "WHERE status = 'completed'",
    status: '启用',
    updateTime: '2024-01-20 10:30:00',
  },
  {
    id: '2',
    indicatorCode: 'IND002',
    indicatorName: '用户增长率',
    dataSourceType: 'MySQL',
    dataSourceName: '用户数据库',
    tableName: 'user_statistics',
    fieldName: 'user_count',
    mappingRule: "WHERE date >= DATE_SUB(NOW(), INTERVAL 30 DAY)",
    status: '启用',
    updateTime: '2024-01-21 14:20:00',
  },
  {
    id: '3',
    indicatorCode: 'IND003',
    indicatorName: '系统响应时间',
    dataSourceType: 'PostgreSQL',
    dataSourceName: '监控数据库',
    tableName: 'system_logs',
    fieldName: 'response_time',
    mappingRule: "WHERE log_type = 'api'",
    status: '启用',
    updateTime: '2024-01-22 09:15:00',
  },
  {
    id: '4',
    indicatorCode: 'IND005',
    indicatorName: '库存周转率',
    dataSourceType: 'MySQL',
    dataSourceName: '库存数据库',
    tableName: 'inventory',
    fieldName: 'quantity',
    mappingRule: "WHERE warehouse_id IN (1,2,3)",
    status: '启用',
    updateTime: '2024-01-23 16:45:00',
  },
]

const indicatorOptions = [
  { code: 'IND001', name: '营业收入' },
  { code: 'IND002', name: '用户增长率' },
  { code: 'IND003', name: '系统响应时间' },
  { code: 'IND004', name: '客户满意度' },
  { code: 'IND005', name: '库存周转率' },
]

const tableData = ref([...mockData])
const searchText = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const dialogTitle = ref('新增映射')
const formRef = ref()
const formData = ref({
  id: '',
  indicatorCode: '',
  indicatorName: '',
  dataSourceType: '',
  dataSourceName: '',
  tableName: '',
  fieldName: '',
  mappingRule: '',
  status: '启用',
})

const rules = {
  indicatorCode: [{ required: true, message: '请选择指标', trigger: 'change' }],
  dataSourceType: [{ required: true, message: '请选择数据源类型', trigger: 'change' }],
  dataSourceName: [{ required: true, message: '请输入数据源名称', trigger: 'blur' }],
  tableName: [{ required: true, message: '请输入表名', trigger: 'blur' }],
  fieldName: [{ required: true, message: '请输入字段名', trigger: 'blur' }],
}

const filteredTableData = computed(() => {
  if (!searchText.value) {
    return tableData.value
  }
  return tableData.value.filter(
    (item) =>
      item.indicatorName.includes(searchText.value) ||
      item.dataSourceName.includes(searchText.value)
  )
})

const handleSearch = () => {
  currentPage.value = 1
}

const handleIndicatorChange = (code: string) => {
  const indicator = indicatorOptions.find((item) => item.code === code)
  if (indicator) {
    formData.value.indicatorName = indicator.name
  }
}

const handleAdd = () => {
  dialogTitle.value = '新增映射'
  formData.value = {
    id: '',
    indicatorCode: '',
    indicatorName: '',
    dataSourceType: '',
    dataSourceName: '',
    tableName: '',
    fieldName: '',
    mappingRule: '',
    status: '启用',
  }
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  dialogTitle.value = '编辑映射'
  formData.value = { ...row }
  dialogVisible.value = true
}

const handleTest = (row: any) => {
  ElMessageBox.confirm(
    `测试连接数据源：${row.dataSourceName}\n表名：${row.tableName}\n字段名：${row.fieldName}`,
    '测试连接',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
    }
  )
    .then(() => {
      // 模拟测试连接
      setTimeout(() => {
        ElMessage.success('连接测试成功')
      }, 1000)
    })
    .catch(() => {})
}

const handleSubmit = () => {
  formRef.value?.validate((valid: boolean) => {
    if (valid) {
      if (formData.value.id) {
        // 编辑
        const index = tableData.value.findIndex((item) => item.id === formData.value.id)
        if (index > -1) {
          tableData.value[index] = {
            ...formData.value,
            updateTime: new Date().toLocaleString('zh-CN'),
          }
        }
        ElMessage.success('编辑成功')
      } else {
        // 新增
        const newItem = {
          ...formData.value,
          id: String(tableData.value.length + 1),
          updateTime: new Date().toLocaleString('zh-CN'),
        }
        tableData.value.push(newItem)
        ElMessage.success('新增成功')
      }
      dialogVisible.value = false
    }
  })
}

const handleDialogClose = () => {
  formRef.value?.resetFields()
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
}
</script>

<style scoped lang="scss">
</style>

