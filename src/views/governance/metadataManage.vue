<template>
  <div class="p-5">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800 mb-2">元数据管理</h1>
      <p class="text-gray-600 text-sm">统一管理与维护系统内所有数据资产的描述信息，构建全面的元数据体系</p>
    </div>

    <!-- 搜索和筛选区域 -->
    <el-card class="mb-4" shadow="never">
      <el-form :inline="true" :model="searchForm" class="demo-form-inline">
        <el-form-item label="数据源名称">
          <el-input v-model="searchForm.name" placeholder="请输入数据源名称" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="数据类型">
          <el-select v-model="searchForm.type" placeholder="请选择" clearable style="width: 150px">
            <el-option label="表" value="table" />
            <el-option label="字段" value="field" />
            <el-option label="视图" value="view" />
            <el-option label="存储过程" value="procedure" />
          </el-select>
        </el-form-item>
        <el-form-item label="数据源类型">
          <el-select v-model="searchForm.sourceType" placeholder="请选择" clearable style="width: 150px">
            <el-option label="MySQL" value="mysql" />
            <el-option label="PostgreSQL" value="postgresql" />
            <el-option label="Oracle" value="oracle" />
            <el-option label="MongoDB" value="mongodb" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作栏 -->
    <div class="mb-4 flex justify-between items-center">
      <div>
        <el-button type="primary" @click="handleAdd">
          <el-icon class="mr-1"><Plus /></el-icon>
          新增元数据
        </el-button>
        <el-button type="success" @click="handleImport">
          <el-icon class="mr-1"><Upload /></el-icon>
          批量导入
        </el-button>
        <el-button type="warning" @click="handleExport">
          <el-icon class="mr-1"><Download /></el-icon>
          导出
        </el-button>
      </div>
      <div>
        <el-button @click="handleRefresh">
          <el-icon class="mr-1"><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 数据表格 -->
    <el-card shadow="never">
      <el-table :data="tableData" v-loading="loading" stripe style="width: 100%">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="数据源名称" width="180" />
        <el-table-column prop="type" label="数据类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">{{ getTypeLabel(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sourceType" label="数据源类型" width="120">
          <template #default="{ row }">
            <el-tag>{{ row.sourceType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="owner" label="负责人" width="120" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column prop="updateTime" label="更新时间" width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row)">查看</el-button>
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
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
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="元数据详情" width="800px">
      <el-descriptions :column="2" border v-if="currentRow">
        <el-descriptions-item label="数据源名称">{{ currentRow.name }}</el-descriptions-item>
        <el-descriptions-item label="数据类型">
          <el-tag :type="getTypeTagType(currentRow.type)">{{ getTypeLabel(currentRow.type) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="数据源类型">{{ currentRow.sourceType }}</el-descriptions-item>
        <el-descriptions-item label="数据源地址">{{ currentRow.sourceUrl }}</el-descriptions-item>
        <el-descriptions-item label="数据库名">{{ currentRow.database }}</el-descriptions-item>
        <el-descriptions-item label="表名/视图名">{{ currentRow.tableName }}</el-descriptions-item>
        <el-descriptions-item label="负责人">{{ currentRow.owner }}</el-descriptions-item>
        <el-descriptions-item label="联系方式">{{ currentRow.contact }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentRow.createTime }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ currentRow.updateTime }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentRow.status === 'active' ? 'success' : 'info'">
            {{ currentRow.status === 'active' ? '启用' : '停用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ currentRow.description }}</el-descriptions-item>
        <el-descriptions-item label="关联关系" :span="2">
          <el-tag v-for="rel in currentRow.relations" :key="rel" class="mr-2">{{ rel }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 编辑/新增对话框 -->
    <el-dialog v-model="editDialogVisible" :title="editMode === 'add' ? '新增元数据' : '编辑元数据'" width="600px">
      <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="100px">
        <el-form-item label="数据源名称" prop="name">
          <el-input v-model="editForm.name" placeholder="请输入数据源名称" />
        </el-form-item>
        <el-form-item label="数据类型" prop="type">
          <el-select v-model="editForm.type" placeholder="请选择" style="width: 100%">
            <el-option label="表" value="table" />
            <el-option label="字段" value="field" />
            <el-option label="视图" value="view" />
            <el-option label="存储过程" value="procedure" />
          </el-select>
        </el-form-item>
        <el-form-item label="数据源类型" prop="sourceType">
          <el-select v-model="editForm.sourceType" placeholder="请选择" style="width: 100%">
            <el-option label="MySQL" value="mysql" />
            <el-option label="PostgreSQL" value="postgresql" />
            <el-option label="Oracle" value="oracle" />
            <el-option label="MongoDB" value="mongodb" />
          </el-select>
        </el-form-item>
        <el-form-item label="数据源地址" prop="sourceUrl">
          <el-input v-model="editForm.sourceUrl" placeholder="请输入数据源地址" />
        </el-form-item>
        <el-form-item label="数据库名" prop="database">
          <el-input v-model="editForm.database" placeholder="请输入数据库名" />
        </el-form-item>
        <el-form-item label="表名/视图名" prop="tableName">
          <el-input v-model="editForm.tableName" placeholder="请输入表名或视图名" />
        </el-form-item>
        <el-form-item label="负责人" prop="owner">
          <el-input v-model="editForm.owner" placeholder="请输入负责人" />
        </el-form-item>
        <el-form-item label="联系方式" prop="contact">
          <el-input v-model="editForm.contact" placeholder="请输入联系方式" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="editForm.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="editForm.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload, Download, Refresh } from '@element-plus/icons-vue'

// 搜索表单
const searchForm = reactive({
  name: '',
  type: '',
  sourceType: ''
})

// 分页
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

// 加载状态
const loading = ref(false)

// 表格数据
const tableData = ref<any[]>([])

// 详情对话框
const detailDialogVisible = ref(false)
const currentRow = ref<any>(null)

// 编辑对话框
const editDialogVisible = ref(false)
const editMode = ref<'add' | 'edit'>('add')
const editFormRef = ref()
const editForm = reactive({
  name: '',
  type: '',
  sourceType: '',
  sourceUrl: '',
  database: '',
  tableName: '',
  owner: '',
  contact: '',
  status: 'active',
  description: ''
})

const editRules = {
  name: [{ required: true, message: '请输入数据源名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择数据类型', trigger: 'change' }],
  sourceType: [{ required: true, message: '请选择数据源类型', trigger: 'change' }]
}

// Mock数据生成
const generateMockData = () => {
  const types = ['table', 'field', 'view', 'procedure']
  const sourceTypes = ['MySQL', 'PostgreSQL', 'Oracle', 'MongoDB']
  const owners = ['张三', '李四', '王五', '赵六', '钱七']
  const data: any[] = []

  for (let i = 1; i <= 50; i++) {
    const type = types[Math.floor(Math.random() * types.length)]
    const sourceType = sourceTypes[Math.floor(Math.random() * sourceTypes.length)]
    const owner = owners[Math.floor(Math.random() * owners.length)]
    
    data.push({
      id: i,
      name: `${sourceType}_数据源_${i}`,
      type: type,
      sourceType: sourceType,
      sourceUrl: `jdbc:${sourceType.toLowerCase()}://192.168.1.${100 + i}:3306`,
      database: `db_${i}`,
      tableName: `table_${i}`,
      description: `这是${sourceType}数据源的描述信息，用于存储${type}类型的数据`,
      owner: owner,
      contact: `138${String(i).padStart(8, '0')}`,
      createTime: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toLocaleString('zh-CN'),
      updateTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleString('zh-CN'),
      status: Math.random() > 0.3 ? 'active' : 'inactive',
      relations: [`关联表_${i}`, `关联视图_${i}`]
    })
  }
  return data
}

// 获取类型标签类型
const getTypeTagType = (type: string) => {
  const map: Record<string, string> = {
    table: 'primary',
    field: 'success',
    view: 'warning',
    procedure: 'info'
  }
  return map[type] || 'info'
}

// 获取类型标签文本
const getTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    table: '表',
    field: '字段',
    view: '视图',
    procedure: '存储过程'
  }
  return map[type] || type
}

// 加载数据
const loadData = () => {
  loading.value = true
  setTimeout(() => {
    const allData = generateMockData()
    // 模拟搜索过滤
    let filteredData = allData
    if (searchForm.name) {
      filteredData = filteredData.filter(item => item.name.includes(searchForm.name))
    }
    if (searchForm.type) {
      filteredData = filteredData.filter(item => item.type === searchForm.type)
    }
    if (searchForm.sourceType) {
      filteredData = filteredData.filter(item => item.sourceType === searchForm.sourceType)
    }
    
    pagination.total = filteredData.length
    const start = (pagination.page - 1) * pagination.size
    const end = start + pagination.size
    tableData.value = filteredData.slice(start, end)
    loading.value = false
  }, 500)
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
  searchForm.sourceType = ''
  handleSearch()
}

// 刷新
const handleRefresh = () => {
  loadData()
}

// 新增
const handleAdd = () => {
  editMode.value = 'add'
  Object.assign(editForm, {
    name: '',
    type: '',
    sourceType: '',
    sourceUrl: '',
    database: '',
    tableName: '',
    owner: '',
    contact: '',
    status: 'active',
    description: ''
  })
  editDialogVisible.value = true
}

// 导入
const handleImport = () => {
  ElMessage.info('批量导入功能开发中')
}

// 导出
const handleExport = () => {
  ElMessage.success('导出成功')
}

// 查看
const handleView = (row: any) => {
  currentRow.value = row
  detailDialogVisible.value = true
}

// 编辑
const handleEdit = (row: any) => {
  editMode.value = 'edit'
  Object.assign(editForm, row)
  editDialogVisible.value = true
}

// 删除
const handleDelete = (row: any) => {
  ElMessageBox.confirm('确定要删除这条元数据吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('删除成功')
    loadData()
  }).catch(() => {})
}

// 保存
const handleSave = () => {
  editFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      ElMessage.success(editMode.value === 'add' ? '新增成功' : '编辑成功')
      editDialogVisible.value = false
      loadData()
    }
  })
}

// 分页变化
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
</style>
