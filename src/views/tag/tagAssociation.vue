<template>
  <div class="tag-association p-5">
    <div class="mb-4">
      <h2 class="text-2xl font-bold mb-2">标签关联关系</h2>
      <p class="text-gray-600">揭示和维护标签之间的关联，形成标签网络结构，为标签组合和应用提供支持</p>
    </div>

    <el-card class="mb-4">
      <template #header>
        <div class="flex justify-between items-center">
          <span class="font-semibold">关联关系列表</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增关联
          </el-button>
        </div>
      </template>

      <div class="mb-4 flex gap-4">
        <el-input
          v-model="searchText"
          placeholder="搜索标签名称"
          class="w-80"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="selectedRelationType" placeholder="关联类型" clearable class="w-48">
          <el-option label="全部" value="" />
          <el-option label="相似关联" value="相似关联" />
          <el-option label="互补关联" value="互补关联" />
          <el-option label="依赖关联" value="依赖关联" />
          <el-option label="互斥关联" value="互斥关联" />
        </el-select>
      </div>

      <el-table :data="filteredTableData" stripe style="width: 100%">
        <el-table-column prop="sourceTag" label="源标签" width="180" />
        <el-table-column prop="targetTag" label="目标标签" width="180" />
        <el-table-column prop="relationType" label="关联类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getRelationTypeColor(row.relationType)">{{ row.relationType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="relationStrength" label="关联强度" width="120">
          <template #default="{ row }">
            <el-progress
              :percentage="row.relationStrength"
              :color="getStrengthColor(row.relationStrength)"
              :stroke-width="8"
            />
          </template>
        </el-table-column>
        <el-table-column prop="description" label="关联描述" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="info" @click="handleViewNetwork(row)">查看网络</el-button>
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
      width="600px"
      @close="handleDialogClose"
    >
      <el-form :model="formData" label-width="120px">
        <el-form-item label="源标签" required>
          <el-select v-model="formData.sourceTag" placeholder="请选择源标签" filterable class="w-full">
            <el-option
              v-for="tag in tagOptions"
              :key="tag.value"
              :label="tag.label"
              :value="tag.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="目标标签" required>
          <el-select v-model="formData.targetTag" placeholder="请选择目标标签" filterable class="w-full">
            <el-option
              v-for="tag in tagOptions"
              :key="tag.value"
              :label="tag.label"
              :value="tag.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关联类型" required>
          <el-select v-model="formData.relationType" placeholder="请选择关联类型" class="w-full">
            <el-option label="相似关联" value="相似关联" />
            <el-option label="互补关联" value="互补关联" />
            <el-option label="依赖关联" value="依赖关联" />
            <el-option label="互斥关联" value="互斥关联" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联强度" required>
          <el-slider v-model="formData.relationStrength" :min="0" :max="100" show-input />
        </el-form-item>
        <el-form-item label="关联描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入关联描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 网络视图对话框 -->
    <el-dialog v-model="networkDialogVisible" title="标签关联网络" width="800px">
      <div class="network-view">
        <p class="text-gray-600 mb-4">
          标签关联网络图展示了标签之间的关联关系，节点大小表示关联数量，连线粗细表示关联强度
        </p>
        <div class="network-placeholder flex items-center justify-center" style="height: 400px; background: #f5f5f5; border-radius: 4px;">
          <div class="text-center">
            <el-icon :size="64" class="text-gray-400 mb-2"><Share /></el-icon>
            <p class="text-gray-500">标签关联网络图</p>
            <p class="text-gray-400 text-sm mt-2">（此处可集成图形化展示组件，如 ECharts、D3.js 等）</p>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Share } from '@element-plus/icons-vue'

interface TagAssociation {
  sourceTag: string
  targetTag: string
  relationType: string
  relationStrength: number
  description: string
  createTime: string
}

// Mock 数据
const mockData: TagAssociation[] = [
  {
    sourceTag: '用户活跃度',
    targetTag: '高价值客户',
    relationType: '互补关联',
    relationStrength: 75,
    description: '活跃度高的用户更可能成为高价值客户',
    createTime: '2024-01-15 10:30:00',
  },
  {
    sourceTag: '产品偏好',
    targetTag: '用户活跃度',
    relationType: '相似关联',
    relationStrength: 60,
    description: '产品偏好明确的用户通常活跃度较高',
    createTime: '2024-01-16 14:20:00',
  },
  {
    sourceTag: '流失风险',
    targetTag: '用户活跃度',
    relationType: '互斥关联',
    relationStrength: 85,
    description: '活跃度低的用户流失风险较高',
    createTime: '2024-01-17 09:15:00',
  },
  {
    sourceTag: '高价值客户',
    targetTag: '流失风险',
    relationType: '互斥关联',
    relationStrength: 70,
    description: '高价值客户流失风险相对较低',
    createTime: '2024-01-18 11:45:00',
  },
  {
    sourceTag: '注册渠道',
    targetTag: '用户活跃度',
    relationType: '依赖关联',
    relationStrength: 45,
    description: '不同注册渠道的用户活跃度存在差异',
    createTime: '2024-01-19 16:30:00',
  },
]

const tableData = ref<TagAssociation[]>(mockData)
const searchText = ref('')
const selectedRelationType = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const networkDialogVisible = ref(false)
const dialogTitle = ref('新增关联')
const formData = ref<TagAssociation>({
  sourceTag: '',
  targetTag: '',
  relationType: '',
  relationStrength: 50,
  description: '',
  createTime: '',
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
        item.sourceTag.toLowerCase().includes(keyword) ||
        item.targetTag.toLowerCase().includes(keyword)
    )
  }

  if (selectedRelationType.value) {
    result = result.filter((item) => item.relationType === selectedRelationType.value)
  }

  return result
})

const getRelationTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    相似关联: 'success',
    互补关联: 'warning',
    依赖关联: 'info',
    互斥关联: 'danger',
  }
  return colorMap[type] || ''
}

const getStrengthColor = (strength: number) => {
  if (strength >= 70) return '#67c23a'
  if (strength >= 40) return '#e6a23c'
  return '#909399'
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleAdd = () => {
  dialogTitle.value = '新增关联'
  formData.value = {
    sourceTag: '',
    targetTag: '',
    relationType: '',
    relationStrength: 50,
    description: '',
    createTime: '',
  }
  dialogVisible.value = true
}

const handleEdit = (row: TagAssociation) => {
  dialogTitle.value = '编辑关联'
  formData.value = { ...row }
  dialogVisible.value = true
}

const handleViewNetwork = (row: TagAssociation) => {
  networkDialogVisible.value = true
}

const handleDelete = (row: TagAssociation) => {
  ElMessageBox.confirm(
    `确定要删除标签 "${row.sourceTag}" 与 "${row.targetTag}" 的关联关系吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(() => {
      const index = tableData.value.findIndex(
        (item) =>
          item.sourceTag === row.sourceTag && item.targetTag === row.targetTag
      )
      if (index > -1) {
        tableData.value.splice(index, 1)
        ElMessage.success('删除成功')
      }
    })
    .catch(() => {})
}

const handleSubmit = () => {
  if (
    !formData.value.sourceTag ||
    !formData.value.targetTag ||
    !formData.value.relationType
  ) {
    ElMessage.warning('请填写必填项')
    return
  }

  if (formData.value.sourceTag === formData.value.targetTag) {
    ElMessage.warning('源标签和目标标签不能相同')
    return
  }

  if (dialogTitle.value === '新增关联') {
    formData.value.createTime = new Date().toLocaleString('zh-CN')
    tableData.value.push({ ...formData.value })
    ElMessage.success('新增成功')
  } else {
    const index = tableData.value.findIndex(
      (item) =>
        item.sourceTag === formData.value.sourceTag &&
        item.targetTag === formData.value.targetTag
    )
    if (index > -1) {
      tableData.value[index] = { ...formData.value }
      ElMessage.success('更新成功')
    }
  }
  dialogVisible.value = false
}

const handleDialogClose = () => {
  formData.value = {
    sourceTag: '',
    targetTag: '',
    relationType: '',
    relationStrength: 50,
    description: '',
    createTime: '',
  }
}
</script>

<style scoped lang="scss">
.tag-association {
  min-height: 100vh;
  background-color: #f5f5f5;
}
</style>

