<template>
  <div class="p-[20px]">
    <el-card>
      <template #header>
        <div class="flex justify-between items-center">
          <span class="text-lg font-semibold">模板发布管理</span>
          <el-button type="primary" @click="handlePublish">
            <el-icon><Promotion /></el-icon>
            发布模板
          </el-button>
        </div>
      </template>

      <!-- 搜索区域 -->
      <div class="mb-4">
        <el-form :inline="true" :model="searchForm" class="demo-form-inline">
          <el-form-item label="模板名称">
            <el-input v-model="searchForm.name" placeholder="请输入模板名称" clearable style="width: 200px" />
          </el-form-item>
          <el-form-item label="发布状态">
            <el-select v-model="searchForm.status" placeholder="请选择" clearable style="width: 200px">
              <el-option label="待审核" value="pending" />
              <el-option label="已发布" value="published" />
              <el-option label="已驳回" value="rejected" />
              <el-option label="已撤回" value="withdrawn" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 表格区域 -->
      <el-table :data="tableData" border stripe style="width: 100%">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="code" label="模板编码" width="150" />
        <el-table-column prop="name" label="模板名称" width="200" />
        <el-table-column prop="version" label="版本号" width="120" align="center">
          <template #default="scope">
            <el-tag type="primary">{{ scope.row.version }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="发布状态" width="120" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 'pending'" type="warning">待审核</el-tag>
            <el-tag v-else-if="scope.row.status === 'published'" type="success">已发布</el-tag>
            <el-tag v-else-if="scope.row.status === 'rejected'" type="danger">已驳回</el-tag>
            <el-tag v-else type="info">已撤回</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="applicant" label="申请人" width="120" />
        <el-table-column prop="applyTime" label="申请时间" width="180" />
        <el-table-column prop="reviewer" label="审核人" width="120" />
        <el-table-column prop="reviewTime" label="审核时间" width="180" />
        <el-table-column prop="reviewComment" label="审核意见" min-width="200" show-overflow-tooltip />
        <el-table-column prop="publishTime" label="发布时间" width="180" />
        <el-table-column label="操作" width="250" fixed="right" align="center">
          <template #default="scope">
            <el-button link type="primary" @click="handleView(scope.row)">查看</el-button>
            <el-button
              v-if="scope.row.status === 'pending'"
              link
              type="success"
              @click="handleApprove(scope.row)"
            >
              审核
            </el-button>
            <el-button
              v-if="scope.row.status === 'published'"
              link
              type="warning"
              @click="handleWithdraw(scope.row)"
            >
              撤回
            </el-button>
            <el-button
              v-if="scope.row.status === 'pending'"
              link
              type="danger"
              @click="handleReject(scope.row)"
            >
              驳回
            </el-button>
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
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 发布对话框 -->
    <el-dialog v-model="publishVisible" title="发布模板" width="600px">
      <el-form :model="publishForm" :rules="publishRules" ref="publishFormRef" label-width="120px">
        <el-form-item label="选择模板" prop="templateId">
          <el-select v-model="publishForm.templateId" placeholder="请选择要发布的模板" style="width: 100%">
            <el-option
              v-for="template in availableTemplates"
              :key="template.id"
              :label="`${template.name} (${template.version})`"
              :value="template.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="发布说明" prop="description">
          <el-input
            v-model="publishForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入发布说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="publishVisible = false">取消</el-button>
        <el-button type="primary" @click="handlePublishSubmit">提交审核</el-button>
      </template>
    </el-dialog>

    <!-- 审核对话框 -->
    <el-dialog v-model="reviewVisible" title="审核模板发布" width="600px">
      <el-form :model="reviewForm" :rules="reviewRules" ref="reviewFormRef" label-width="120px">
        <el-form-item label="审核结果" prop="result">
          <el-radio-group v-model="reviewForm.result">
            <el-radio label="approve">通过</el-radio>
            <el-radio label="reject">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核意见" prop="comment">
          <el-input
            v-model="reviewForm.comment"
            type="textarea"
            :rows="4"
            placeholder="请输入审核意见"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reviewVisible = false">取消</el-button>
        <el-button type="primary" @click="handleReviewSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Promotion } from '@element-plus/icons-vue'

// 搜索表单
const searchForm = reactive({
  name: '',
  status: ''
})

// 表格数据
const tableData = ref([
  {
    id: '1',
    code: 'TPL001',
    name: '客户信息数据元模板',
    version: 'v1.2',
    status: 'published',
    applicant: '张三',
    applyTime: '2024-01-20 10:30:00',
    reviewer: '李四',
    reviewTime: '2024-01-20 14:30:00',
    reviewComment: '审核通过，模板内容完整',
    publishTime: '2024-01-20 15:00:00'
  },
  {
    id: '2',
    code: 'TPL002',
    name: '组织机构编码模板',
    version: 'v2.0',
    status: 'published',
    applicant: '王五',
    applyTime: '2024-01-18 11:45:00',
    reviewer: '赵六',
    reviewTime: '2024-01-18 16:00:00',
    reviewComment: '审核通过',
    publishTime: '2024-01-18 16:30:00'
  },
  {
    id: '3',
    code: 'TPL003',
    name: 'RESTful接口标准模板',
    version: 'v1.1',
    status: 'pending',
    applicant: '孙七',
    applyTime: '2024-01-19 10:20:00',
    reviewer: '',
    reviewTime: '',
    reviewComment: '',
    publishTime: ''
  },
  {
    id: '4',
    code: 'TPL004',
    name: '订单业务模板',
    version: 'v1.5',
    status: 'rejected',
    applicant: '周八',
    applyTime: '2024-01-17 09:15:00',
    reviewer: '吴九',
    reviewTime: '2024-01-17 15:30:00',
    reviewComment: '模板内容不完整，需要补充业务规则说明',
    publishTime: ''
  },
  {
    id: '5',
    code: 'TPL005',
    name: '产品分类编码模板',
    version: 'v1.0',
    status: 'withdrawn',
    applicant: '郑十',
    applyTime: '2024-01-16 14:20:00',
    reviewer: '李四',
    reviewTime: '2024-01-16 16:00:00',
    reviewComment: '已撤回',
    publishTime: '2024-01-16 16:30:00'
  }
])

// 分页
const pagination = reactive({
  page: 1,
  size: 10,
  total: 5
})

// 发布对话框
const publishVisible = ref(false)
const publishFormRef = ref()
const publishForm = reactive({
  templateId: '',
  description: ''
})

const publishRules = {
  templateId: [{ required: true, message: '请选择模板', trigger: 'change' }],
  description: [{ required: true, message: '请输入发布说明', trigger: 'blur' }]
}

// 可发布的模板列表（mock数据）
const availableTemplates = ref([
  { id: '1', name: '客户信息数据元模板', version: 'v1.3' },
  { id: '2', name: '组织机构编码模板', version: 'v2.1' },
  { id: '3', name: '产品分类编码模板', version: 'v1.1' }
])

// 审核对话框
const reviewVisible = ref(false)
const reviewFormRef = ref()
const currentReviewItem = ref<any>(null)
const reviewForm = reactive({
  result: 'approve',
  comment: ''
})

const reviewRules = {
  result: [{ required: true, message: '请选择审核结果', trigger: 'change' }],
  comment: [{ required: true, message: '请输入审核意见', trigger: 'blur' }]
}

// 搜索
const handleSearch = () => {
  ElMessage.success('查询成功')
}

// 重置
const handleReset = () => {
  searchForm.name = ''
  searchForm.status = ''
  handleSearch()
}

// 发布
const handlePublish = () => {
  publishForm.templateId = ''
  publishForm.description = ''
  publishVisible.value = true
}

// 提交发布
const handlePublishSubmit = () => {
  publishFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      const template = availableTemplates.value.find((t) => t.id === publishForm.templateId)
      if (template) {
        const newItem = {
          id: String(Date.now()),
          code: 'TPL' + String(Math.floor(Math.random() * 1000)).padStart(3, '0'),
          name: template.name,
          version: template.version,
          status: 'pending',
          applicant: '当前用户',
          applyTime: new Date().toLocaleString('zh-CN'),
          reviewer: '',
          reviewTime: '',
          reviewComment: '',
          publishTime: ''
        }
        tableData.value.unshift(newItem)
        pagination.total++
        publishVisible.value = false
        ElMessage.success('提交审核成功')
      }
    }
  })
}

// 查看
const handleView = (row: any) => {
  ElMessage.info(`查看模板：${row.name}`)
}

// 审核
const handleApprove = (row: any) => {
  currentReviewItem.value = row
  reviewForm.result = 'approve'
  reviewForm.comment = ''
  reviewVisible.value = true
}

// 提交审核
const handleReviewSubmit = () => {
  reviewFormRef.value?.validate((valid: boolean) => {
    if (valid && currentReviewItem.value) {
      const item = tableData.value.find((t) => t.id === currentReviewItem.value.id)
      if (item) {
        if (reviewForm.result === 'approve') {
          item.status = 'published'
          item.publishTime = new Date().toLocaleString('zh-CN')
          ElMessage.success('审核通过，模板已发布')
        } else {
          item.status = 'rejected'
          ElMessage.success('已驳回')
        }
        item.reviewer = '当前审核人'
        item.reviewTime = new Date().toLocaleString('zh-CN')
        item.reviewComment = reviewForm.comment
        reviewVisible.value = false
      }
    }
  })
}

// 驳回
const handleReject = (row: any) => {
  currentReviewItem.value = row
  reviewForm.result = 'reject'
  reviewForm.comment = ''
  reviewVisible.value = true
}

// 撤回
const handleWithdraw = (row: any) => {
  ElMessageBox.confirm('确定要撤回该模板吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      row.status = 'withdrawn'
      ElMessage.success('撤回成功')
    })
    .catch(() => {})
}

// 分页
const handleSizeChange = (val: number) => {
  pagination.size = val
  pagination.page = 1
}

const handleCurrentChange = (val: number) => {
  pagination.page = val
}

onMounted(() => {
  // 初始化数据
})
</script>

<style scoped lang="scss">
</style>

