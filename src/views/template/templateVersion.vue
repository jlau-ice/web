<template>
  <div class="p-[20px]">
    <el-card>
      <template #header>
        <div class="flex justify-between items-center">
          <span class="text-lg font-semibold">模板版本控制</span>
        </div>
      </template>

      <!-- 搜索区域 -->
      <div class="mb-4">
        <el-form :inline="true" :model="searchForm" class="demo-form-inline">
          <el-form-item label="模板名称">
            <el-input v-model="searchForm.templateName" placeholder="请输入模板名称" clearable style="width: 200px" />
          </el-form-item>
          <el-form-item label="版本号">
            <el-input v-model="searchForm.version" placeholder="请输入版本号" clearable style="width: 200px" />
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
        <el-table-column prop="templateCode" label="模板编码" width="150" />
        <el-table-column prop="templateName" label="模板名称" width="200" />
        <el-table-column prop="version" label="版本号" width="120" align="center">
          <template #default="scope">
            <el-tag type="primary">{{ scope.row.version }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="changeType" label="变更类型" width="120">
          <template #default="scope">
            <el-tag v-if="scope.row.changeType === 'major'" type="danger">重大变更</el-tag>
            <el-tag v-else-if="scope.row.changeType === 'minor'" type="warning">次要变更</el-tag>
            <el-tag v-else type="info">补丁更新</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="changeDescription" label="变更说明" min-width="250" show-overflow-tooltip />
        <el-table-column prop="creator" label="创建人" width="120" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 'current'" type="success">当前版本</el-tag>
            <el-tag v-else-if="scope.row.status === 'history'" type="info">历史版本</el-tag>
            <el-tag v-else type="warning">待发布</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right" align="center">
          <template #default="scope">
            <el-button link type="primary" @click="handleView(scope.row)">查看详情</el-button>
            <el-button link type="success" @click="handleCompare(scope.row)">版本对比</el-button>
            <el-button
              v-if="scope.row.status === 'history'"
              link
              type="warning"
              @click="handleRollback(scope.row)"
            >
              回滚
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

    <!-- 版本详情对话框 -->
    <el-dialog v-model="detailVisible" title="版本详情" width="800px">
      <el-descriptions :column="2" border v-if="currentVersion">
        <el-descriptions-item label="模板编码">{{ currentVersion.templateCode }}</el-descriptions-item>
        <el-descriptions-item label="模板名称">{{ currentVersion.templateName }}</el-descriptions-item>
        <el-descriptions-item label="版本号">
          <el-tag type="primary">{{ currentVersion.version }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="变更类型">
          <el-tag v-if="currentVersion.changeType === 'major'" type="danger">重大变更</el-tag>
          <el-tag v-else-if="currentVersion.changeType === 'minor'" type="warning">次要变更</el-tag>
          <el-tag v-else type="info">补丁更新</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建人">{{ currentVersion.creator }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentVersion.createTime }}</el-descriptions-item>
        <el-descriptions-item label="变更说明" :span="2">
          {{ currentVersion.changeDescription }}
        </el-descriptions-item>
        <el-descriptions-item label="版本内容" :span="2">
          <pre class="bg-gray-50 p-4 rounded">{{ currentVersion.content }}</pre>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 搜索表单
const searchForm = reactive({
  templateName: '',
  version: ''
})

// 表格数据
const tableData = ref([
  {
    id: '1',
    templateCode: 'TPL001',
    templateName: '客户信息数据元模板',
    version: 'v1.2',
    changeType: 'minor',
    changeDescription: '新增客户邮箱字段，优化地址字段格式',
    creator: '张三',
    createTime: '2024-01-20 10:30:00',
    status: 'current',
    content: JSON.stringify({ name: '客户信息', fields: ['姓名', '电话', '地址', '邮箱'] }, null, 2)
  },
  {
    id: '2',
    templateCode: 'TPL001',
    templateName: '客户信息数据元模板',
    version: 'v1.1',
    changeType: 'patch',
    changeDescription: '修复电话号码验证规则',
    creator: '李四',
    createTime: '2024-01-15 14:20:00',
    status: 'history',
    content: JSON.stringify({ name: '客户信息', fields: ['姓名', '电话', '地址'] }, null, 2)
  },
  {
    id: '3',
    templateCode: 'TPL001',
    templateName: '客户信息数据元模板',
    version: 'v1.0',
    changeType: 'major',
    changeDescription: '初始版本发布',
    creator: '王五',
    createTime: '2024-01-10 09:15:00',
    status: 'history',
    content: JSON.stringify({ name: '客户信息', fields: ['姓名', '电话'] }, null, 2)
  },
  {
    id: '4',
    templateCode: 'TPL002',
    templateName: '组织机构编码模板',
    version: 'v2.0',
    changeType: 'major',
    changeDescription: '重构编码规则，支持多级组织',
    creator: '赵六',
    createTime: '2024-01-18 11:45:00',
    status: 'current',
    content: JSON.stringify({ name: '组织机构编码', rule: 'ORG-{层级}-{序号}' }, null, 2)
  },
  {
    id: '5',
    templateCode: 'TPL002',
    templateName: '组织机构编码模板',
    version: 'v1.5',
    changeType: 'minor',
    changeDescription: '优化编码生成算法',
    creator: '孙七',
    createTime: '2024-01-12 16:30:00',
    status: 'history',
    content: JSON.stringify({ name: '组织机构编码', rule: 'ORG-{序号}' }, null, 2)
  },
  {
    id: '6',
    templateCode: 'TPL003',
    templateName: 'RESTful接口标准模板',
    version: 'v1.1',
    changeType: 'minor',
    changeDescription: '新增错误码定义',
    creator: '周八',
    createTime: '2024-01-19 10:20:00',
    status: 'pending',
    content: JSON.stringify({ name: 'RESTful接口', method: 'GET', format: 'JSON' }, null, 2)
  }
])

// 分页
const pagination = reactive({
  page: 1,
  size: 10,
  total: 6
})

// 版本详情
const detailVisible = ref(false)
const currentVersion = ref<any>(null)

// 搜索
const handleSearch = () => {
  ElMessage.success('查询成功')
}

// 重置
const handleReset = () => {
  searchForm.templateName = ''
  searchForm.version = ''
  handleSearch()
}

// 查看详情
const handleView = (row: any) => {
  currentVersion.value = row
  detailVisible.value = true
}

// 版本对比
const handleCompare = (row: any) => {
  ElMessage.info(`对比版本：${row.version}`)
  // 这里可以打开版本对比对话框
}

// 回滚
const handleRollback = (row: any) => {
  ElMessageBox.confirm(`确定要回滚到版本 ${row.version} 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      // 更新当前版本状态
      tableData.value.forEach((item) => {
        if (item.templateCode === row.templateCode) {
          if (item.status === 'current') {
            item.status = 'history'
          }
        }
      })
      row.status = 'current'
      ElMessage.success('回滚成功')
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
pre {
  max-height: 300px;
  overflow-y: auto;
}
</style>

