<template>
  <div class="tag-basic-info p-5">
    <div class="mb-4">
      <h2 class="text-2xl font-bold mb-2">标签基本信息</h2>
      <p class="text-gray-600">确立标签的基础属性及管理内容，为构建完整的标签体系提供信息保障</p>
    </div>

    <el-card class="mb-4">
      <template #header>
        <div class="flex justify-between items-center">
          <span class="font-semibold">标签列表</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增标签
          </el-button>
        </div>
      </template>

      <div class="mb-4">
        <el-input
          v-model="searchText"
          placeholder="搜索标签名称、编码或描述"
          class="w-80"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <el-table :data="filteredTableData" stripe style="width: 100%">
        <el-table-column prop="tagCode" label="标签编码" width="150" />
        <el-table-column prop="tagName" label="标签名称" width="180" />
        <el-table-column prop="tagType" label="标签类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTagTypeColor(row.tagType)">{{ row.tagType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="businessCategory" label="业务分类" width="150" />
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '启用' ? 'success' : 'info'">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
            <el-button link type="info" @click="handleView(row)">详情</el-button>
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
      width="600px"
      @close="handleDialogClose"
    >
      <el-form :model="formData" label-width="120px">
        <el-form-item label="标签编码" required>
          <el-input v-model="formData.tagCode" placeholder="请输入标签编码" />
        </el-form-item>
        <el-form-item label="标签名称" required>
          <el-input v-model="formData.tagName" placeholder="请输入标签名称" />
        </el-form-item>
        <el-form-item label="标签类型" required>
          <el-select v-model="formData.tagType" placeholder="请选择标签类型" class="w-full">
            <el-option label="基础标签" value="基础标签" />
            <el-option label="统计标签" value="统计标签" />
            <el-option label="规则标签" value="规则标签" />
            <el-option label="模型标签" value="模型标签" />
          </el-select>
        </el-form-item>
        <el-form-item label="业务分类" required>
          <el-input v-model="formData.businessCategory" placeholder="请输入业务分类" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入标签描述"
          />
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

interface TagBasicInfo {
  tagCode: string
  tagName: string
  tagType: string
  businessCategory: string
  description: string
  status: string
  createTime: string
}

// Mock 数据
const mockData: TagBasicInfo[] = [
  {
    tagCode: 'TAG001',
    tagName: '用户活跃度',
    tagType: '统计标签',
    businessCategory: '用户行为',
    description: '基于用户最近30天的登录频率和操作次数计算',
    status: '启用',
    createTime: '2024-01-15 10:30:00',
  },
  {
    tagCode: 'TAG002',
    tagName: '高价值客户',
    tagType: '规则标签',
    businessCategory: '客户价值',
    description: '近一年消费金额超过10万元的客户',
    status: '启用',
    createTime: '2024-01-16 14:20:00',
  },
  {
    tagCode: 'TAG003',
    tagName: '产品偏好',
    tagType: '模型标签',
    businessCategory: '用户画像',
    description: '基于机器学习模型预测的用户产品偏好',
    status: '启用',
    createTime: '2024-01-17 09:15:00',
  },
  {
    tagCode: 'TAG004',
    tagName: '注册渠道',
    tagType: '基础标签',
    businessCategory: '用户属性',
    description: '用户注册时的来源渠道',
    status: '启用',
    createTime: '2024-01-18 11:45:00',
  },
  {
    tagCode: 'TAG005',
    tagName: '流失风险',
    tagType: '模型标签',
    businessCategory: '用户行为',
    description: '预测用户在未来30天内流失的概率',
    status: '禁用',
    createTime: '2024-01-19 16:30:00',
  },
]

const tableData = ref<TagBasicInfo[]>(mockData)
const searchText = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const dialogTitle = ref('新增标签')
const formData = ref<TagBasicInfo>({
  tagCode: '',
  tagName: '',
  tagType: '',
  businessCategory: '',
  description: '',
  status: '启用',
  createTime: '',
})

const filteredTableData = computed(() => {
  if (!searchText.value) {
    return tableData.value
  }
  const keyword = searchText.value.toLowerCase()
  return tableData.value.filter(
    (item) =>
      item.tagCode.toLowerCase().includes(keyword) ||
      item.tagName.toLowerCase().includes(keyword) ||
      item.description.toLowerCase().includes(keyword)
  )
})

const getTagTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    基础标签: '',
    统计标签: 'success',
    规则标签: 'warning',
    模型标签: 'danger',
  }
  return colorMap[type] || ''
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleAdd = () => {
  dialogTitle.value = '新增标签'
  formData.value = {
    tagCode: '',
    tagName: '',
    tagType: '',
    businessCategory: '',
    description: '',
    status: '启用',
    createTime: '',
  }
  dialogVisible.value = true
}

const handleEdit = (row: TagBasicInfo) => {
  dialogTitle.value = '编辑标签'
  formData.value = { ...row }
  dialogVisible.value = true
}

const handleDelete = (row: TagBasicInfo) => {
  ElMessageBox.confirm(`确定要删除标签 "${row.tagName}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      const index = tableData.value.findIndex((item) => item.tagCode === row.tagCode)
      if (index > -1) {
        tableData.value.splice(index, 1)
        ElMessage.success('删除成功')
      }
    })
    .catch(() => {})
}

const handleView = (row: TagBasicInfo) => {
  ElMessageBox.alert(
    `
    <div style="text-align: left;">
      <p><strong>标签编码：</strong>${row.tagCode}</p>
      <p><strong>标签名称：</strong>${row.tagName}</p>
      <p><strong>标签类型：</strong>${row.tagType}</p>
      <p><strong>业务分类：</strong>${row.businessCategory}</p>
      <p><strong>描述：</strong>${row.description}</p>
      <p><strong>状态：</strong>${row.status}</p>
      <p><strong>创建时间：</strong>${row.createTime}</p>
    </div>
    `,
    '标签详情',
    {
      dangerouslyUseHTMLString: true,
    }
  )
}

const handleSubmit = () => {
  if (!formData.value.tagCode || !formData.value.tagName || !formData.value.tagType) {
    ElMessage.warning('请填写必填项')
    return
  }

  if (dialogTitle.value === '新增标签') {
    formData.value.createTime = new Date().toLocaleString('zh-CN')
    tableData.value.push({ ...formData.value })
    ElMessage.success('新增成功')
  } else {
    const index = tableData.value.findIndex((item) => item.tagCode === formData.value.tagCode)
    if (index > -1) {
      tableData.value[index] = { ...formData.value }
      ElMessage.success('更新成功')
    }
  }
  dialogVisible.value = false
}

const handleDialogClose = () => {
  formData.value = {
    tagCode: '',
    tagName: '',
    tagType: '',
    businessCategory: '',
    description: '',
    status: '启用',
    createTime: '',
  }
}
</script>

<style scoped lang="scss">
.tag-basic-info {
  min-height: 100vh;
  background-color: #f5f5f5;
}
</style>

