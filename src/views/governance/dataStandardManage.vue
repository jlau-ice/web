<template>
  <div class="p-5">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800 mb-2">数据标准管理</h1>
      <p class="text-gray-600 text-sm">制定、发布并落地执行数据在采集、存储、集成与应用环节的统一标准</p>
    </div>

    <!-- 标准分类选择 -->
    <el-card class="mb-4" shadow="never">
      <el-radio-group v-model="standardCategory" @change="handleCategoryChange">
        <el-radio-button label="collection">采集标准</el-radio-button>
        <el-radio-button label="storage">存储标准</el-radio-button>
        <el-radio-button label="integration">集成标准</el-radio-button>
        <el-radio-button label="application">应用标准</el-radio-button>
      </el-radio-group>
    </el-card>

    <!-- 搜索和筛选区域 -->
    <el-card class="mb-4" shadow="never">
      <el-form :inline="true" :model="searchForm" class="demo-form-inline">
        <el-form-item label="标准名称">
          <el-input v-model="searchForm.name" placeholder="请输入标准名称" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="标准编码">
          <el-input v-model="searchForm.code" placeholder="请输入标准编码" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable style="width: 150px">
            <el-option label="已发布" value="published" />
            <el-option label="草稿" value="draft" />
            <el-option label="已停用" value="disabled" />
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
          新增标准
        </el-button>
        <el-button type="success" @click="handlePublish">
          <el-icon class="mr-1"><Promotion /></el-icon>
          发布标准
        </el-button>
        <el-button type="warning" @click="handleExport">
          <el-icon class="mr-1"><Download /></el-icon>
          导出标准
        </el-button>
        <el-button type="info" @click="handleImport">
          <el-icon class="mr-1"><Upload /></el-icon>
          导入标准
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
        <el-table-column prop="code" label="标准编码" width="150" />
        <el-table-column prop="name" label="标准名称" width="200" />
        <el-table-column prop="category" label="标准分类" width="120">
          <template #default="{ row }">
            <el-tag :type="getCategoryTagType(row.category)">{{ getCategoryLabel(row.category) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="version" label="版本号" width="100" />
        <el-table-column prop="scope" label="适用范围" min-width="150" show-overflow-tooltip />
        <el-table-column prop="publisher" label="发布人" width="120" />
        <el-table-column prop="publishTime" label="发布时间" width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="complianceRate" label="合规率" width="120">
          <template #default="{ row }">
            <el-progress :percentage="row.complianceRate" :color="getComplianceColor(row.complianceRate)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row)">查看</el-button>
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button v-if="row.status === 'draft'" link type="success" size="small" @click="handlePublishOne(row)">发布</el-button>
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
    <el-dialog v-model="detailDialogVisible" title="标准详情" width="900px">
      <el-descriptions :column="2" border v-if="currentRow">
        <el-descriptions-item label="标准编码">{{ currentRow.code }}</el-descriptions-item>
        <el-descriptions-item label="标准名称">{{ currentRow.name }}</el-descriptions-item>
        <el-descriptions-item label="标准分类">
          <el-tag :type="getCategoryTagType(currentRow.category)">{{ getCategoryLabel(currentRow.category) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="版本号">{{ currentRow.version }}</el-descriptions-item>
        <el-descriptions-item label="适用范围" :span="2">{{ currentRow.scope }}</el-descriptions-item>
        <el-descriptions-item label="标准内容" :span="2">
          <div class="whitespace-pre-wrap">{{ currentRow.content }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="发布人">{{ currentRow.publisher }}</el-descriptions-item>
        <el-descriptions-item label="发布时间">{{ currentRow.publishTime }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ currentRow.creator }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentRow.createTime }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusTagType(currentRow.status)">{{ getStatusLabel(currentRow.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="合规率">
          <el-progress :percentage="currentRow.complianceRate" :color="getComplianceColor(currentRow.complianceRate)" />
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentRow.remark || '无' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 编辑/新增对话框 -->
    <el-dialog v-model="editDialogVisible" :title="editMode === 'add' ? '新增标准' : '编辑标准'" width="700px">
      <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="100px">
        <el-form-item label="标准编码" prop="code">
          <el-input v-model="editForm.code" placeholder="请输入标准编码" />
        </el-form-item>
        <el-form-item label="标准名称" prop="name">
          <el-input v-model="editForm.name" placeholder="请输入标准名称" />
        </el-form-item>
        <el-form-item label="标准分类" prop="category">
          <el-select v-model="editForm.category" placeholder="请选择" style="width: 100%">
            <el-option label="采集标准" value="collection" />
            <el-option label="存储标准" value="storage" />
            <el-option label="集成标准" value="integration" />
            <el-option label="应用标准" value="application" />
          </el-select>
        </el-form-item>
        <el-form-item label="版本号" prop="version">
          <el-input v-model="editForm.version" placeholder="请输入版本号，如：v1.0" />
        </el-form-item>
        <el-form-item label="适用范围" prop="scope">
          <el-input v-model="editForm.scope" type="textarea" :rows="2" placeholder="请输入适用范围" />
        </el-form-item>
        <el-form-item label="标准内容" prop="content">
          <el-input v-model="editForm.content" type="textarea" :rows="6" placeholder="请输入标准内容" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="editForm.status">
            <el-radio label="draft">草稿</el-radio>
            <el-radio label="published">已发布</el-radio>
            <el-radio label="disabled">已停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editForm.remark" type="textarea" :rows="3" placeholder="请输入备注" />
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
import { Plus, Upload, Download, Refresh, Promotion } from '@element-plus/icons-vue'

// 标准分类
const standardCategory = ref('collection')

// 搜索表单
const searchForm = reactive({
  name: '',
  code: '',
  status: ''
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
  code: '',
  name: '',
  category: 'collection',
  version: 'v1.0',
  scope: '',
  content: '',
  status: 'draft',
  remark: ''
})

const editRules = {
  code: [{ required: true, message: '请输入标准编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入标准名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择标准分类', trigger: 'change' }],
  version: [{ required: true, message: '请输入版本号', trigger: 'blur' }],
  scope: [{ required: true, message: '请输入适用范围', trigger: 'blur' }],
  content: [{ required: true, message: '请输入标准内容', trigger: 'blur' }]
}

// 获取分类标签类型
const getCategoryTagType = (category: string) => {
  const map: Record<string, string> = {
    collection: 'primary',
    storage: 'success',
    integration: 'warning',
    application: 'info'
  }
  return map[category] || 'info'
}

// 获取分类标签文本
const getCategoryLabel = (category: string) => {
  const map: Record<string, string> = {
    collection: '采集标准',
    storage: '存储标准',
    integration: '集成标准',
    application: '应用标准'
  }
  return map[category] || category
}

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  const map: Record<string, string> = {
    published: 'success',
    draft: 'warning',
    disabled: 'info'
  }
  return map[status] || 'info'
}

// 获取状态标签文本
const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    published: '已发布',
    draft: '草稿',
    disabled: '已停用'
  }
  return map[status] || status
}

// 获取合规率颜色
const getComplianceColor = (rate: number) => {
  if (rate >= 90) return '#67c23a'
  if (rate >= 70) return '#e6a23c'
  return '#f56c6c'
}

// Mock数据生成
const generateMockData = (category: string) => {
  const categories = ['collection', 'storage', 'integration', 'application']
  const statuses = ['published', 'draft', 'disabled']
  const publishers = ['张三', '李四', '王五', '赵六']
  const data: any[] = []

  for (let i = 1; i <= 50; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const publisher = publishers[Math.floor(Math.random() * publishers.length)]
    const cat = categories[Math.floor(Math.random() * categories.length)]
    
    data.push({
      id: i,
      code: `STD${String(i).padStart(6, '0')}`,
      name: `${getCategoryLabel(cat)}_标准${i}`,
      category: cat,
      version: `v${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 10)}`,
      scope: `适用于${['数据采集', '数据存储', '数据集成', '数据应用'][categories.indexOf(cat)]}环节的所有数据`,
      content: `这是${getCategoryLabel(cat)}的标准内容。\n标准规定了数据在${['采集', '存储', '集成', '应用'][categories.indexOf(cat)]}过程中应遵循的格式、规范和要求。\n具体包括：\n1. 数据格式要求\n2. 数据质量要求\n3. 数据安全要求\n4. 数据管理要求`,
      publisher: status === 'published' ? publisher : '-',
      publishTime: status === 'published' ? new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toLocaleString('zh-CN') : '-',
      creator: publisher,
      createTime: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toLocaleString('zh-CN'),
      status: status,
      complianceRate: Math.floor(Math.random() * 40) + 60, // 60-100
      remark: `标准${i}的备注信息`
    })
  }
  return data
}

// 加载数据
const loadData = () => {
  loading.value = true
  setTimeout(() => {
    const allData = generateMockData(standardCategory.value)
    // 模拟搜索过滤
    let filteredData = allData
    if (searchForm.name) {
      filteredData = filteredData.filter(item => item.name.includes(searchForm.name))
    }
    if (searchForm.code) {
      filteredData = filteredData.filter(item => item.code.includes(searchForm.code))
    }
    if (searchForm.status) {
      filteredData = filteredData.filter(item => item.status === searchForm.status)
    }
    // 按分类过滤
    filteredData = filteredData.filter(item => item.category === standardCategory.value)
    
    pagination.total = filteredData.length
    const start = (pagination.page - 1) * pagination.size
    const end = start + pagination.size
    tableData.value = filteredData.slice(start, end)
    loading.value = false
  }, 500)
}

// 分类变化
const handleCategoryChange = () => {
  pagination.page = 1
  loadData()
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadData()
}

// 重置
const handleReset = () => {
  searchForm.name = ''
  searchForm.code = ''
  searchForm.status = ''
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
    code: '',
    name: '',
    category: standardCategory.value,
    version: 'v1.0',
    scope: '',
    content: '',
    status: 'draft',
    remark: ''
  })
  editDialogVisible.value = true
}

// 发布（批量）
const handlePublish = () => {
  ElMessageBox.confirm('确定要发布选中的标准吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('发布成功')
    loadData()
  }).catch(() => {})
}

// 发布（单个）
const handlePublishOne = (row: any) => {
  ElMessageBox.confirm(`确定要发布标准"${row.name}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('发布成功')
    loadData()
  }).catch(() => {})
}

// 导入
const handleImport = () => {
  ElMessage.info('导入标准功能开发中')
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
  ElMessageBox.confirm('确定要删除这条标准吗？', '提示', {
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
