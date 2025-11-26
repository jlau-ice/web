<template>
  <div class="p-[20px]">
    <div class="mb-4">
      <h2 class="text-2xl font-bold mb-4">指标基本信息</h2>
      <p class="text-gray-600 mb-4">
        指标基本信息模块用于定义和管理指标的核心属性，为指标体系建设提供基础信息支持。
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
        新增指标
      </el-button>
    </div>

    <!-- 表格 -->
    <el-table :data="filteredTableData" border stripe style="width: 100%">
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column prop="code" label="指标编码" width="150" />
      <el-table-column prop="name" label="指标名称" width="200" />
      <el-table-column prop="category" label="指标分类" width="120" />
      <el-table-column prop="unit" label="计量单位" width="100" />
      <el-table-column prop="dataType" label="数据类型" width="100" />
      <el-table-column prop="description" label="指标描述" min-width="200" show-overflow-tooltip />
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === '启用' ? 'success' : 'info'">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="180" />
      <el-table-column label="操作" width="200" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleEdit(row)">
            编辑
          </el-button>
          <el-button type="danger" link size="small" @click="handleDelete(row)">
            删除
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
      width="600px"
      @close="handleDialogClose"
    >
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="指标编码" prop="code">
          <el-input v-model="formData.code" placeholder="请输入指标编码" />
        </el-form-item>
        <el-form-item label="指标名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入指标名称" />
        </el-form-item>
        <el-form-item label="指标分类" prop="category">
          <el-select v-model="formData.category" placeholder="请选择指标分类" style="width: 100%">
            <el-option label="业务指标" value="业务指标" />
            <el-option label="技术指标" value="技术指标" />
            <el-option label="财务指标" value="财务指标" />
            <el-option label="运营指标" value="运营指标" />
          </el-select>
        </el-form-item>
        <el-form-item label="计量单位" prop="unit">
          <el-input v-model="formData.unit" placeholder="请输入计量单位" />
        </el-form-item>
        <el-form-item label="数据类型" prop="dataType">
          <el-select v-model="formData.dataType" placeholder="请选择数据类型" style="width: 100%">
            <el-option label="数值型" value="数值型" />
            <el-option label="百分比" value="百分比" />
            <el-option label="文本型" value="文本型" />
          </el-select>
        </el-form-item>
        <el-form-item label="指标描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入指标描述"
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
    code: 'IND001',
    name: '营业收入',
    category: '财务指标',
    unit: '万元',
    dataType: '数值型',
    description: '企业在一定时期内通过销售商品或提供服务所获得的收入总额',
    status: '启用',
    createTime: '2024-01-15 10:30:00',
  },
  {
    id: '2',
    code: 'IND002',
    name: '用户增长率',
    category: '业务指标',
    unit: '%',
    dataType: '百分比',
    description: '用户数量相对于上一期的增长百分比',
    status: '启用',
    createTime: '2024-01-16 14:20:00',
  },
  {
    id: '3',
    code: 'IND003',
    name: '系统响应时间',
    category: '技术指标',
    unit: 'ms',
    dataType: '数值型',
    description: '系统处理请求的平均响应时间',
    status: '启用',
    createTime: '2024-01-17 09:15:00',
  },
  {
    id: '4',
    code: 'IND004',
    name: '客户满意度',
    category: '运营指标',
    unit: '分',
    dataType: '数值型',
    description: '客户对产品或服务的满意程度评分',
    status: '停用',
    createTime: '2024-01-18 16:45:00',
  },
  {
    id: '5',
    code: 'IND005',
    name: '库存周转率',
    category: '运营指标',
    unit: '次',
    dataType: '数值型',
    description: '库存商品在一定时期内的周转次数',
    status: '启用',
    createTime: '2024-01-19 11:30:00',
  },
]

const tableData = ref([...mockData])
const searchText = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const dialogTitle = ref('新增指标')
const formRef = ref()
const formData = ref({
  id: '',
  code: '',
  name: '',
  category: '',
  unit: '',
  dataType: '',
  description: '',
  status: '启用',
})

const rules = {
  code: [{ required: true, message: '请输入指标编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入指标名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择指标分类', trigger: 'change' }],
  unit: [{ required: true, message: '请输入计量单位', trigger: 'blur' }],
  dataType: [{ required: true, message: '请选择数据类型', trigger: 'change' }],
}

const filteredTableData = computed(() => {
  if (!searchText.value) {
    return tableData.value
  }
  return tableData.value.filter(
    (item) =>
      item.name.includes(searchText.value) || item.code.includes(searchText.value)
  )
})

const handleSearch = () => {
  currentPage.value = 1
}

const handleAdd = () => {
  dialogTitle.value = '新增指标'
  formData.value = {
    id: '',
    code: '',
    name: '',
    category: '',
    unit: '',
    dataType: '',
    description: '',
    status: '启用',
  }
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  dialogTitle.value = '编辑指标'
  formData.value = { ...row }
  dialogVisible.value = true
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm('确定要删除该指标吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      const index = tableData.value.findIndex((item) => item.id === row.id)
      if (index > -1) {
        tableData.value.splice(index, 1)
        ElMessage.success('删除成功')
      }
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
          tableData.value[index] = { ...formData.value }
        }
        ElMessage.success('编辑成功')
      } else {
        // 新增
        const newItem = {
          ...formData.value,
          id: String(tableData.value.length + 1),
          createTime: new Date().toLocaleString('zh-CN'),
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

