<template>
  <div class="p-[20px]">
    <div class="mb-4">
      <h2 class="text-2xl font-bold mb-4">指标逻辑定义</h2>
      <p class="text-gray-600 mb-4">
        指标逻辑定义模块用于明确指标的计算规则和业务逻辑，保障指标计算结果的准确性与一致性。
      </p>
    </div>

    <!-- 搜索和操作栏 -->
    <div class="mb-4 flex justify-between items-center">
      <el-input
        v-model="searchText"
        placeholder="请输入指标名称或编码"
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
        新增逻辑定义
      </el-button>
    </div>

    <!-- 表格 -->
    <el-table :data="filteredTableData" border stripe style="width: 100%">
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column prop="indicatorCode" label="指标编码" width="150" />
      <el-table-column prop="indicatorName" label="指标名称" width="200" />
      <el-table-column prop="formula" label="计算公式" min-width="300" show-overflow-tooltip />
      <el-table-column prop="calculationType" label="计算方式" width="120" />
      <el-table-column prop="updateFrequency" label="更新频率" width="120" />
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
          <el-button type="info" link size="small" @click="handlePreview(row)">
            预览
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
      width="800px"
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
        <el-form-item label="计算方式" prop="calculationType">
          <el-select v-model="formData.calculationType" placeholder="请选择计算方式" style="width: 100%">
            <el-option label="求和" value="求和" />
            <el-option label="平均值" value="平均值" />
            <el-option label="最大值" value="最大值" />
            <el-option label="最小值" value="最小值" />
            <el-option label="自定义公式" value="自定义公式" />
          </el-select>
        </el-form-item>
        <el-form-item label="计算公式" prop="formula">
          <el-input
            v-model="formData.formula"
            type="textarea"
            :rows="4"
            placeholder="请输入计算公式，例如：SUM(字段A) + SUM(字段B)"
          />
          <div class="mt-2 text-sm text-gray-500">
            <p>提示：支持使用 SUM、AVG、MAX、MIN 等函数</p>
            <p>示例：SUM(销售额) / COUNT(订单数) * 100</p>
          </div>
        </el-form-item>
        <el-form-item label="更新频率" prop="updateFrequency">
          <el-select v-model="formData.updateFrequency" placeholder="请选择更新频率" style="width: 100%">
            <el-option label="实时" value="实时" />
            <el-option label="每小时" value="每小时" />
            <el-option label="每天" value="每天" />
            <el-option label="每周" value="每周" />
            <el-option label="每月" value="每月" />
          </el-select>
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

    <!-- 预览对话框 -->
    <el-dialog v-model="previewVisible" title="公式预览" width="600px">
      <div class="p-4 bg-gray-50 rounded">
        <div class="mb-2">
          <strong>指标名称：</strong>{{ previewData.indicatorName }}
        </div>
        <div class="mb-2">
          <strong>计算公式：</strong>
          <code class="text-blue-600">{{ previewData.formula }}</code>
        </div>
        <div class="mb-2">
          <strong>计算方式：</strong>{{ previewData.calculationType }}
        </div>
        <div>
          <strong>更新频率：</strong>{{ previewData.updateFrequency }}
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'

// Mock 数据
const mockData = [
  {
    id: '1',
    indicatorCode: 'IND001',
    indicatorName: '营业收入',
    formula: 'SUM(销售金额)',
    calculationType: '求和',
    updateFrequency: '每天',
    status: '启用',
    updateTime: '2024-01-20 10:30:00',
  },
  {
    id: '2',
    indicatorCode: 'IND002',
    indicatorName: '用户增长率',
    formula: '(当前用户数 - 上期用户数) / 上期用户数 * 100',
    calculationType: '自定义公式',
    updateFrequency: '每天',
    status: '启用',
    updateTime: '2024-01-21 14:20:00',
  },
  {
    id: '3',
    indicatorCode: 'IND003',
    indicatorName: '系统响应时间',
    formula: 'AVG(响应时间)',
    calculationType: '平均值',
    updateFrequency: '实时',
    status: '启用',
    updateTime: '2024-01-22 09:15:00',
  },
  {
    id: '4',
    indicatorCode: 'IND005',
    indicatorName: '库存周转率',
    formula: '销售成本 / 平均库存',
    calculationType: '自定义公式',
    updateFrequency: '每周',
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
const previewVisible = ref(false)
const dialogTitle = ref('新增逻辑定义')
const formRef = ref()
const formData = ref({
  id: '',
  indicatorCode: '',
  indicatorName: '',
  formula: '',
  calculationType: '',
  updateFrequency: '',
  status: '启用',
})

const previewData = ref({
  indicatorName: '',
  formula: '',
  calculationType: '',
  updateFrequency: '',
})

const rules = {
  indicatorCode: [{ required: true, message: '请选择指标', trigger: 'change' }],
  calculationType: [{ required: true, message: '请选择计算方式', trigger: 'change' }],
  formula: [{ required: true, message: '请输入计算公式', trigger: 'blur' }],
  updateFrequency: [{ required: true, message: '请选择更新频率', trigger: 'change' }],
}

const filteredTableData = computed(() => {
  if (!searchText.value) {
    return tableData.value
  }
  return tableData.value.filter(
    (item) =>
      item.indicatorName.includes(searchText.value) ||
      item.indicatorCode.includes(searchText.value)
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
  dialogTitle.value = '新增逻辑定义'
  formData.value = {
    id: '',
    indicatorCode: '',
    indicatorName: '',
    formula: '',
    calculationType: '',
    updateFrequency: '',
    status: '启用',
  }
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  dialogTitle.value = '编辑逻辑定义'
  formData.value = { ...row }
  dialogVisible.value = true
}

const handlePreview = (row: any) => {
  previewData.value = {
    indicatorName: row.indicatorName,
    formula: row.formula,
    calculationType: row.calculationType,
    updateFrequency: row.updateFrequency,
  }
  previewVisible.value = true
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
code {
  padding: 2px 6px;
  background-color: #f0f0f0;
  border-radius: 3px;
}
</style>

