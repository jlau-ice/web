<template>
  <div class="tag-calculation-rule p-5">
    <div class="mb-4">
      <h2 class="text-2xl font-bold mb-2">标签计算规则</h2>
      <p class="text-gray-600">设定标签的计算逻辑和处理规则，保障标签计算结果的准确性和一致性</p>
    </div>

    <el-card class="mb-4">
      <template #header>
        <div class="flex justify-between items-center">
          <span class="font-semibold">计算规则列表</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增规则
          </el-button>
        </div>
      </template>

      <div class="mb-4">
        <el-input
          v-model="searchText"
          placeholder="搜索标签名称或规则名称"
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
        <el-table-column prop="tagName" label="标签名称" width="180" />
        <el-table-column prop="ruleName" label="规则名称" width="200" />
        <el-table-column prop="ruleType" label="规则类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getRuleTypeColor(row.ruleType)">{{ row.ruleType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="calculationMethod" label="计算方式" width="150" />
        <el-table-column prop="ruleExpression" label="规则表达式" show-overflow-tooltip />
        <el-table-column prop="updateFrequency" label="更新频率" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '启用' ? 'success' : 'info'">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastExecuteTime" label="最后执行时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="success" @click="handleTest(row)">测试</el-button>
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
      width="700px"
      @close="handleDialogClose"
    >
      <el-form :model="formData" label-width="120px">
        <el-form-item label="标签名称" required>
          <el-select v-model="formData.tagName" placeholder="请选择标签" filterable class="w-full">
            <el-option
              v-for="tag in tagOptions"
              :key="tag.value"
              :label="tag.label"
              :value="tag.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="规则名称" required>
          <el-input v-model="formData.ruleName" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="规则类型" required>
          <el-select v-model="formData.ruleType" placeholder="请选择规则类型" class="w-full">
            <el-option label="SQL规则" value="SQL规则" />
            <el-option label="表达式规则" value="表达式规则" />
            <el-option label="脚本规则" value="脚本规则" />
            <el-option label="模型规则" value="模型规则" />
          </el-select>
        </el-form-item>
        <el-form-item label="计算方式" required>
          <el-select v-model="formData.calculationMethod" placeholder="请选择计算方式" class="w-full">
            <el-option label="实时计算" value="实时计算" />
            <el-option label="定时计算" value="定时计算" />
            <el-option label="手动触发" value="手动触发" />
          </el-select>
        </el-form-item>
        <el-form-item label="更新频率">
          <el-select v-model="formData.updateFrequency" placeholder="请选择更新频率" class="w-full">
            <el-option label="每小时" value="每小时" />
            <el-option label="每天" value="每天" />
            <el-option label="每周" value="每周" />
            <el-option label="每月" value="每月" />
          </el-select>
        </el-form-item>
        <el-form-item label="规则表达式" required>
          <el-input
            v-model="formData.ruleExpression"
            type="textarea"
            :rows="6"
            placeholder="请输入规则表达式，如：SELECT COUNT(*) FROM user_behavior WHERE login_time > DATE_SUB(NOW(), INTERVAL 30 DAY)"
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

interface CalculationRule {
  tagName: string
  ruleName: string
  ruleType: string
  calculationMethod: string
  ruleExpression: string
  updateFrequency: string
  status: string
  lastExecuteTime: string
}

// Mock 数据
const mockData: CalculationRule[] = [
  {
    tagName: '用户活跃度',
    ruleName: '活跃度统计规则',
    ruleType: 'SQL规则',
    calculationMethod: '定时计算',
    ruleExpression:
      'SELECT user_id, COUNT(*) as login_count FROM user_behavior WHERE login_time > DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY user_id',
    updateFrequency: '每天',
    status: '启用',
    lastExecuteTime: '2024-01-20 02:00:00',
  },
  {
    tagName: '高价值客户',
    ruleName: '高价值客户判断规则',
    ruleType: '表达式规则',
    calculationMethod: '定时计算',
    ruleExpression: 'total_amount > 100000 AND order_count > 10',
    updateFrequency: '每天',
    status: '启用',
    lastExecuteTime: '2024-01-20 02:00:00',
  },
  {
    tagName: '产品偏好',
    ruleName: '产品偏好预测规则',
    ruleType: '模型规则',
    calculationMethod: '定时计算',
    ruleExpression: 'ML_MODEL.predict(user_features)',
    updateFrequency: '每天',
    status: '启用',
    lastExecuteTime: '2024-01-20 03:00:00',
  },
  {
    tagName: '流失风险',
    ruleName: '流失风险预测规则',
    ruleType: '模型规则',
    calculationMethod: '实时计算',
    ruleExpression: 'RISK_MODEL.predict(user_behavior_features)',
    updateFrequency: '实时',
    status: '启用',
    lastExecuteTime: '2024-01-20 10:30:00',
  },
]

const tableData = ref<CalculationRule[]>(mockData)
const searchText = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const dialogTitle = ref('新增规则')
const formData = ref<CalculationRule>({
  tagName: '',
  ruleName: '',
  ruleType: '',
  calculationMethod: '',
  ruleExpression: '',
  updateFrequency: '',
  status: '启用',
  lastExecuteTime: '',
})

const tagOptions = [
  { label: '用户活跃度', value: '用户活跃度' },
  { label: '高价值客户', value: '高价值客户' },
  { label: '产品偏好', value: '产品偏好' },
  { label: '注册渠道', value: '注册渠道' },
  { label: '流失风险', value: '流失风险' },
]

const filteredTableData = computed(() => {
  if (!searchText.value) {
    return tableData.value
  }
  const keyword = searchText.value.toLowerCase()
  return tableData.value.filter(
    (item) =>
      item.tagName.toLowerCase().includes(keyword) ||
      item.ruleName.toLowerCase().includes(keyword)
  )
})

const getRuleTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    SQL规则: 'success',
    表达式规则: 'warning',
    脚本规则: 'info',
    模型规则: 'danger',
  }
  return colorMap[type] || ''
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleAdd = () => {
  dialogTitle.value = '新增规则'
  formData.value = {
    tagName: '',
    ruleName: '',
    ruleType: '',
    calculationMethod: '',
    ruleExpression: '',
    updateFrequency: '',
    status: '启用',
    lastExecuteTime: '',
  }
  dialogVisible.value = true
}

const handleEdit = (row: CalculationRule) => {
  dialogTitle.value = '编辑规则'
  formData.value = { ...row }
  dialogVisible.value = true
}

const handleTest = (row: CalculationRule) => {
  ElMessageBox.confirm('确定要测试执行该规则吗？', '测试规则', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info',
  })
    .then(() => {
      ElMessage.success('规则测试执行成功，结果已生成')
    })
    .catch(() => {})
}

const handleDelete = (row: CalculationRule) => {
  ElMessageBox.confirm(`确定要删除规则 "${row.ruleName}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      const index = tableData.value.findIndex((item) => item.ruleName === row.ruleName)
      if (index > -1) {
        tableData.value.splice(index, 1)
        ElMessage.success('删除成功')
      }
    })
    .catch(() => {})
}

const handleSubmit = () => {
  if (
    !formData.value.tagName ||
    !formData.value.ruleName ||
    !formData.value.ruleType ||
    !formData.value.ruleExpression
  ) {
    ElMessage.warning('请填写必填项')
    return
  }

  if (dialogTitle.value === '新增规则') {
    formData.value.lastExecuteTime = '-'
    tableData.value.push({ ...formData.value })
    ElMessage.success('新增成功')
  } else {
    const index = tableData.value.findIndex((item) => item.ruleName === formData.value.ruleName)
    if (index > -1) {
      tableData.value[index] = { ...formData.value }
      ElMessage.success('更新成功')
    }
  }
  dialogVisible.value = false
}

const handleDialogClose = () => {
  formData.value = {
    tagName: '',
    ruleName: '',
    ruleType: '',
    calculationMethod: '',
    ruleExpression: '',
    updateFrequency: '',
    status: '启用',
    lastExecuteTime: '',
  }
}
</script>

<style scoped lang="scss">
.tag-calculation-rule {
  min-height: 100vh;
  background-color: #f5f5f5;
}
</style>

