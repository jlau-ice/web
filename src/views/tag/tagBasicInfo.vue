<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// 类型定义
interface Tag {
  id: string
  name: string
  code: string
  category: string
  dataType: string
  description: string
  owner: string
  status: 'active' | 'inactive'
  createTime: string
  updateTime: string
  creator: string
  updater: string
}

interface QueryParams {
  name: string
  code: string
  category: string
  dataType: string
  status: string
  pageNum: number
  pageSize: number
}

// Mock 数据
const mockTags: Tag[] = [
  {
    id: '1',
    name: '用户等级标签',
    code: 'USER_LEVEL',
    category: '用户属性',
    dataType: 'string',
    description: '标识用户的会员等级，包括普通、银牌、金牌、钻石等级别',
    owner: '张三',
    status: 'active',
    createTime: '2024-01-15 10:30:00',
    updateTime: '2024-01-20 15:30:00',
    creator: '张三',
    updater: '李四'
  },
  {
    id: '2',
    name: '用户活跃度',
    code: 'USER_ACTIVITY',
    category: '行为特征',
    dataType: 'number',
    description: '用户最近30天的活跃度评分，范围0-100',
    owner: '李四',
    status: 'active',
    createTime: '2024-01-16 11:20:00',
    updateTime: '2024-01-16 11:20:00',
    creator: '李四',
    updater: '李四'
  },
  {
    id: '3',
    name: '是否实名认证',
    code: 'IS_VERIFIED',
    category: '业务状态',
    dataType: 'boolean',
    description: '标识用户是否完成实名认证',
    owner: '王五',
    status: 'active',
    createTime: '2024-01-17 09:15:00',
    updateTime: '2024-01-17 09:15:00',
    creator: '王五',
    updater: '王五'
  },
  {
    id: '4',
    name: '风险等级',
    code: 'RISK_LEVEL',
    category: '风险标识',
    dataType: 'string',
    description: '用户风险等级评估：低、中、高',
    owner: '赵六',
    status: 'active',
    createTime: '2024-01-18 14:30:00',
    updateTime: '2024-01-18 14:30:00',
    creator: '赵六',
    updater: '赵六'
  },
  {
    id: '5',
    name: '最后登录时间',
    code: 'LAST_LOGIN_TIME',
    category: '行为特征',
    dataType: 'datetime',
    description: '用户最后一次登录系统的时间',
    owner: '张三',
    status: 'inactive',
    createTime: '2024-01-19 16:00:00',
    updateTime: '2024-01-19 16:00:00',
    creator: '张三',
    updater: '张三'
  },
  {
    id: '6',
    name: '消费能力',
    code: 'CONSUMPTION_ABILITY',
    category: '用户属性',
    dataType: 'number',
    description: '用户的消费能力评分，基于历史消费数据计算',
    owner: '李四',
    status: 'active',
    createTime: '2024-01-20 10:00:00',
    updateTime: '2024-01-20 10:00:00',
    creator: '李四',
    updater: '李四'
  },
  {
    id: '7',
    name: '注册渠道',
    code: 'REGISTER_CHANNEL',
    category: '用户属性',
    dataType: 'string',
    description: '用户注册来源渠道，如APP、H5、小程序等',
    owner: '王五',
    status: 'active',
    createTime: '2024-01-21 11:30:00',
    updateTime: '2024-01-21 11:30:00',
    creator: '王五',
    updater: '王五'
  },
  {
    id: '8',
    name: '是否黑名单',
    code: 'IS_BLACKLIST',
    category: '风险标识',
    dataType: 'boolean',
    description: '标识用户是否在黑名单中',
    owner: '赵六',
    status: 'active',
    createTime: '2024-01-22 13:00:00',
    updateTime: '2024-01-22 13:00:00',
    creator: '赵六',
    updater: '赵六'
  }
]

// 分类选项
const categoryOptions = [
  { label: '用户属性', value: '用户属性' },
  { label: '行为特征', value: '行为特征' },
  { label: '业务状态', value: '业务状态' },
  { label: '风险标识', value: '风险标识' }
]

// 数据类型选项
const dataTypeOptions = [
  { label: '字符串', value: 'string' },
  { label: '数值', value: 'number' },
  { label: '布尔', value: 'boolean' },
  { label: '时间', value: 'datetime' }
]

// 状态选项
const statusOptions = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'inactive' }
]

// 响应式数据
const loading = ref(false)
const tableData = ref<Tag[]>([])
const total = ref(0)
const selectedRows = ref<Tag[]>([])

// 查询参数
const queryParams = reactive<QueryParams>({
  name: '',
  code: '',
  category: '',
  dataType: '',
  status: '',
  pageNum: 1,
  pageSize: 10
})

// 高级筛选
const advancedFilterVisible = ref(false)
const advancedFilters = reactive({
  category: '',
  dataType: '',
  status: ''
})

// 新建/编辑对话框
const dialogVisible = ref(false)
const dialogTitle = ref('新建标签')
const formRef = ref<FormInstance>()
const formData = reactive<Partial<Tag>>({
  name: '',
  code: '',
  category: '',
  dataType: 'string',
  description: '',
  owner: '',
  status: 'active'
})

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入标签名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入标签编码', trigger: 'blur' },
    { pattern: /^[A-Z_]+$/, message: '编码只能包含大写字母和下划线', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择标签分类', trigger: 'change' }
  ],
  dataType: [
    { required: true, message: '请选择数据类型', trigger: 'change' }
  ]
}

// 详情 Drawer
const drawerVisible = ref(false)
const currentTag = ref<Tag | null>(null)

// 模拟 API 调用
const mockApi = {
  // 获取标签列表
  getTagList: (params: QueryParams): Promise<{ data: Tag[], total: number }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        let filtered = [...mockTags]

        // 筛选逻辑
        if (params.name) {
          filtered = filtered.filter(tag => tag.name.includes(params.name))
        }
        if (params.code) {
          filtered = filtered.filter(tag => tag.code.includes(params.code))
        }
        if (params.category) {
          filtered = filtered.filter(tag => tag.category === params.category)
        }
        if (params.dataType) {
          filtered = filtered.filter(tag => tag.dataType === params.dataType)
        }
        if (params.status) {
          filtered = filtered.filter(tag => tag.status === params.status)
        }

        // 分页
        const start = (params.pageNum - 1) * params.pageSize
        const end = start + params.pageSize
        const paged = filtered.slice(start, end)

        resolve({ data: paged, total: filtered.length })
      }, 500)
    })
  },

  // 创建标签
  createTag: (data: Partial<Tag>): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newTag: Tag = {
          id: Date.now().toString(),
          name: data.name!,
          code: data.code!,
          category: data.category!,
          dataType: data.dataType!,
          description: data.description || '',
          owner: data.owner || '',
          status: data.status || 'active',
          createTime: new Date().toLocaleString('zh-CN'),
          updateTime: new Date().toLocaleString('zh-CN'),
          creator: '当前用户',
          updater: '当前用户'
        }
        mockTags.unshift(newTag)
        resolve()
      }, 800)
    })
  },

  // 更新标签
  updateTag: (id: string, data: Partial<Tag>): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = mockTags.findIndex(tag => tag.id === id)
        if (index !== -1) {
          mockTags[index] = {
            ...mockTags[index],
            ...data,
            updateTime: new Date().toLocaleString('zh-CN'),
            updater: '当前用户'
          }
        }
        resolve()
      }, 800)
    })
  },

  // 删除标签
  deleteTag: (ids: string[]): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        ids.forEach(id => {
          const index = mockTags.findIndex(tag => tag.id === id)
          if (index !== -1) {
            mockTags.splice(index, 1)
          }
        })
        resolve()
      }, 600)
    })
  },

  // 导出标签
  exportTags: (): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('导出标签列表')
        const csvContent = 'data:text/csv;charset=utf-8,标签名称,标签编码,标签分类,数据类型,负责人,状态\n'
        const link = document.createElement('a')
        link.href = csvContent
        link.download = '标签列表.csv'
        link.click()
        resolve()
      }, 1000)
    })
  },

  // 导入标签
  importTags: (file: File): Promise<{ success: number, failed: number }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: 10, failed: 2 })
      }, 1500)
    })
  }
}

// 方法
const fetchTagList = async () => {
  loading.value = true
  try {
    const res = await mockApi.getTagList(queryParams)
    tableData.value = res.data
    total.value = res.total
  } catch (error) {
    ElMessage.error('获取标签列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryParams.pageNum = 1
  fetchTagList()
}

const handleReset = () => {
  queryParams.name = ''
  queryParams.code = ''
  queryParams.category = ''
  queryParams.dataType = ''
  queryParams.status = ''
  queryParams.pageNum = 1
  fetchTagList()
}

const handleAdvancedFilter = () => {
  advancedFilterVisible.value = true
}

const applyAdvancedFilter = () => {
  queryParams.category = advancedFilters.category
  queryParams.dataType = advancedFilters.dataType
  queryParams.status = advancedFilters.status
  queryParams.pageNum = 1
  advancedFilterVisible.value = false
  fetchTagList()
}

const handleCreate = () => {
  dialogTitle.value = '新建标签'
  dialogVisible.value = true
  Object.assign(formData, {
    id: undefined,
    name: '',
    code: '',
    category: '',
    dataType: 'string',
    description: '',
    owner: '',
    status: 'active'
  })
  formRef.value?.clearValidate()
}

const handleEdit = (row: Tag) => {
  dialogTitle.value = '编辑标签'
  dialogVisible.value = true
  Object.assign(formData, { ...row })
  formRef.value?.clearValidate()
}

const handleSave = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        if (formData.id) {
          await mockApi.updateTag(formData.id, formData)
          ElMessage.success('标签更新成功')
        } else {
          await mockApi.createTag(formData)
          ElMessage.success('标签创建成功')
        }
        dialogVisible.value = false
        fetchTagList()
      } catch (error) {
        ElMessage.error('操作失败')
      } finally {
        loading.value = false
      }
    }
  })
}

const handleDelete = (row: Tag) => {
  ElMessageBox.confirm('确定要删除该标签吗？删除后将无法恢复。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    loading.value = true
    try {
      await mockApi.deleteTag([row.id])
      ElMessage.success('删除成功')
      fetchTagList()
    } catch (error) {
      ElMessage.error('删除失败')
    } finally {
      loading.value = false
    }
  })
}

const handleBatchDelete = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请至少选择一条记录')
    return
  }

  ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 条标签吗？删除后将无法恢复。`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    loading.value = true
    try {
      const ids = selectedRows.value.map(row => row.id)
      await mockApi.deleteTag(ids)
      ElMessage.success('批量删除成功')
      fetchTagList()
    } catch (error) {
      ElMessage.error('批量删除失败')
    } finally {
      loading.value = false
    }
  })
}

const handleBatchStatus = async (status: 'active' | 'inactive') => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请至少选择一条记录')
    return
  }

  loading.value = true
  try {
    for (const row of selectedRows.value) {
      await mockApi.updateTag(row.id, { status })
    }
    ElMessage.success(`批量${status === 'active' ? '启用' : '停用'}成功`)
    fetchTagList()
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    loading.value = false
  }
}

const handleStatusChange = async (row: Tag) => {
  loading.value = true
  try {
    await mockApi.updateTag(row.id, { status: row.status })
    ElMessage.success('状态更新成功')
  } catch (error) {
    ElMessage.error('状态更新失败')
    row.status = row.status === 'active' ? 'inactive' : 'active'
  } finally {
    loading.value = false
  }
}

const handleView = (row: Tag) => {
  currentTag.value = { ...row }
  drawerVisible.value = true
}

const handlePageChange = (page: number) => {
  queryParams.pageNum = page
  fetchTagList()
}

const handleSizeChange = (size: number) => {
  queryParams.pageSize = size
  queryParams.pageNum = 1
  fetchTagList()
}

const handleSelectionChange = (rows: Tag[]) => {
  selectedRows.value = rows
}

const handleExport = async () => {
  loading.value = true
  try {
    await mockApi.exportTags()
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  } finally {
    loading.value = false
  }
}

const handleImport = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.csv,.xlsx'
  input.onchange = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      loading.value = true
      try {
        const result = await mockApi.importTags(file)
        ElMessage.success(`导入完成：成功 ${result.success} 条，失败 ${result.failed} 条`)
        fetchTagList()
      } catch (error) {
        ElMessage.error('导入失败')
      } finally {
        loading.value = false
      }
    }
  }
  input.click()
}

const generateCode = () => {
  if (formData.name && !formData.id) {
    const code = formData.name
      .toUpperCase()
      .replace(/[\u4e00-\u9fa5]/g, (char) => {
        // 简单的中文首字母提取（这里用拼音库会更好）
        const pinyinMap: Record<string, string> = {
          '用': 'Y', '户': 'H', '等': 'D', '级': 'J', '标': 'B', '签': 'Q',
          '活': 'H', '跃': 'Y', '度': 'D', '是': 'S', '否': 'F', '实': 'S',
          '名': 'M', '认': 'R', '证': 'Z', '风': 'F', '险': 'X'
        }
        return pinyinMap[char] || 'X'
      })
      .replace(/[^A-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
    formData.code = code
  }
}

// 生命周期
onMounted(() => {
  fetchTagList()
})
</script>

<template>
  <div class="tag-basic-info">
    <!-- 搜索栏 -->
    <el-card class="search-card" shadow="never">
      <el-form :inline="true">
        <el-form-item label="标签名称">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入标签名称"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="标签编码">
          <el-input
            v-model="queryParams.code"
            placeholder="请输入标签编码"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button @click="handleAdvancedFilter">高级筛选</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作栏 -->
    <el-card class="action-card" shadow="never">
      <div class="action-bar">
        <div class="left">
          <el-button type="primary" @click="handleCreate">新建标签</el-button>
          <el-button @click="handleBatchStatus('active')">批量启用</el-button>
          <el-button @click="handleBatchStatus('inactive')">批量停用</el-button>
          <el-button type="danger" @click="handleBatchDelete">批量删除</el-button>
        </div>
        <div class="right">
          <el-button @click="handleExport">导出</el-button>
          <el-button @click="handleImport">导入</el-button>
        </div>
      </div>
    </el-card>

    <!-- 表格 -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" fixed="left" />
        <el-table-column prop="name" label="标签名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="code" label="标签编码" min-width="150" show-overflow-tooltip />
        <el-table-column prop="category" label="标签分类" width="120" />
        <el-table-column prop="dataType" label="数据类型" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.dataType === 'string'" type="primary" size="small">字符串</el-tag>
            <el-tag v-else-if="row.dataType === 'number'" type="success" size="small">数值</el-tag>
            <el-tag v-else-if="row.dataType === 'boolean'" type="warning" size="small">布尔</el-tag>
            <el-tag v-else-if="row.dataType === 'datetime'" type="info" size="small">时间</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="owner" label="负责人" width="100" />
        <el-table-column prop="creator" label="创建人" width="100" />
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              active-value="active"
              inactive-value="inactive"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 新建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="标签名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="请输入标签名称"
            @blur="generateCode"
          />
        </el-form-item>
        <el-form-item label="标签编码" prop="code">
          <el-input v-model="formData.code" placeholder="请输入标签编码（大写字母和下划线）" />
        </el-form-item>
        <el-form-item label="标签分类" prop="category">
          <el-select v-model="formData.category" placeholder="请选择标签分类" style="width: 100%">
            <el-option
              v-for="item in categoryOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="数据类型" prop="dataType">
          <el-select v-model="formData.dataType" placeholder="请选择数据类型" style="width: 100%">
            <el-option
              v-for="item in dataTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="业务描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="4"
            placeholder="请输入业务描述"
          />
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="formData.owner" placeholder="请输入负责人" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio value="active">启用</el-radio>
            <el-radio value="inactive">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSave">确定</el-button>
      </template>
    </el-dialog>

    <!-- 高级筛选对话框 -->
    <el-dialog
      v-model="advancedFilterVisible"
      title="高级筛选"
      width="500px"
    >
      <el-form label-width="100px">
        <el-form-item label="标签分类">
          <el-select v-model="advancedFilters.category" placeholder="请选择标签分类" clearable style="width: 100%">
            <el-option
              v-for="item in categoryOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="数据类型">
          <el-select v-model="advancedFilters.dataType" placeholder="请选择数据类型" clearable style="width: 100%">
            <el-option
              v-for="item in dataTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="advancedFilters.status" placeholder="请选择状态" clearable style="width: 100%">
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="advancedFilterVisible = false">取消</el-button>
        <el-button type="primary" @click="applyAdvancedFilter">确定</el-button>
      </template>
    </el-dialog>

    <!-- 详情 Drawer -->
    <el-drawer
      v-model="drawerVisible"
      title="标签详情"
      size="50%"
    >
      <div v-if="currentTag" class="tag-detail">
        <el-descriptions title="基础信息" :column="2" border>
          <el-descriptions-item label="标签名称">{{ currentTag.name }}</el-descriptions-item>
          <el-descriptions-item label="标签编码">{{ currentTag.code }}</el-descriptions-item>
          <el-descriptions-item label="标签分类">{{ currentTag.category }}</el-descriptions-item>
          <el-descriptions-item label="数据类型">
            <el-tag v-if="currentTag.dataType === 'string'" type="primary" size="small">字符串</el-tag>
            <el-tag v-else-if="currentTag.dataType === 'number'" type="success" size="small">数值</el-tag>
            <el-tag v-else-if="currentTag.dataType === 'boolean'" type="warning" size="small">布尔</el-tag>
            <el-tag v-else-if="currentTag.dataType === 'datetime'" type="info" size="small">时间</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="负责人">{{ currentTag.owner }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag v-if="currentTag.status === 'active'" type="success" size="small">启用</el-tag>
            <el-tag v-else type="info" size="small">停用</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="业务描述" :span="2">
            {{ currentTag.description || '暂无描述' }}
          </el-descriptions-item>
        </el-descriptions>

        <el-descriptions title="创建信息" :column="2" border style="margin-top: 20px;">
          <el-descriptions-item label="创建人">{{ currentTag.creator }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentTag.createTime }}</el-descriptions-item>
          <el-descriptions-item label="更新人">{{ currentTag.updater }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ currentTag.updateTime }}</el-descriptions-item>
        </el-descriptions>

        <el-card title="应用场景" style="margin-top: 20px;" shadow="never">
          <template #header>
            <span>应用场景</span>
          </template>
          <el-tag style="margin-right: 8px; margin-bottom: 8px;">用户画像</el-tag>
          <el-tag style="margin-right: 8px; margin-bottom: 8px;">精准营销</el-tag>
          <el-tag style="margin-right: 8px; margin-bottom: 8px;">风险控制</el-tag>
        </el-card>

        <div class="drawer-actions">
          <el-button type="primary" @click="handleEdit(currentTag)">编辑</el-button>
          <el-button @click="drawerVisible = false">关闭</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
.tag-basic-info {
  .search-card,
  .action-card,
  .table-card {
    margin-bottom: 16px;
  }

  .action-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .left,
    .right {
      display: flex;
      gap: 8px;
    }
  }

  .pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }

  .tag-detail {
    .drawer-actions {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
  }
}
</style>
