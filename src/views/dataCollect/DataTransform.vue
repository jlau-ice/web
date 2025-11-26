<template>
  <div class="p-4 bg-white h-full">
    <div class="mb-4 flex justify-between items-center">
      <h2 class="text-xl font-bold">数据清洗转换</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon class="mr-1"><Plus /></el-icon>
        新增转换规则
      </el-button>
    </div>

    <!-- 搜索栏 -->
    <el-card class="mb-4">
      <el-form :inline="true" :model="searchForm" class="demo-form-inline">
        <el-form-item label="规则名称">
          <el-input v-model="searchForm.name" placeholder="请输入规则名称" clearable />
        </el-form-item>
        <el-form-item label="规则类型">
          <el-select v-model="searchForm.type" placeholder="请选择" clearable>
            <el-option label="字段映射" value="MAPPING" />
            <el-option label="格式转换" value="FORMAT" />
            <el-option label="规则校验" value="VALIDATION" />
            <el-option label="数据脱敏" value="MASKING" />
            <el-option label="异常标注" value="ANNOTATION" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable>
            <el-option label="启用" value="ENABLED" />
            <el-option label="禁用" value="DISABLED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 规则列表 -->
    <el-card>
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="name" label="规则名称" min-width="150" />
        <el-table-column prop="type" label="规则类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">{{ getTypeLabel(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="applyTo" label="应用对象" min-width="150" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="'ENABLED'"
              :inactive-value="'DISABLED'"
              @change="handleToggleStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button link type="primary" size="small" @click="handleTest(row)">
              <el-icon><View /></el-icon>
              测试
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

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

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="1000px"
      @close="handleDialogClose"
    >
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本信息" name="basic">
          <el-form
            ref="formRef"
            :model="formData"
            :rules="formRules"
            label-width="120px"
          >
            <el-form-item label="规则名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入规则名称" />
            </el-form-item>
            <el-form-item label="规则类型" prop="type">
              <el-select v-model="formData.type" placeholder="请选择规则类型" @change="handleTypeChange">
                <el-option label="字段映射" value="MAPPING" />
                <el-option label="格式转换" value="FORMAT" />
                <el-option label="规则校验" value="VALIDATION" />
                <el-option label="数据脱敏" value="MASKING" />
                <el-option label="异常标注" value="ANNOTATION" />
              </el-select>
            </el-form-item>
            <el-form-item label="应用对象" prop="applyTo">
              <el-select v-model="formData.applyTo" placeholder="请选择应用对象" filterable allow-create>
                <el-option label="全部任务" value="ALL" />
                <el-option
                  v-for="task in tasks"
                  :key="task.id"
                  :label="task.name"
                  :value="task.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="描述" prop="description">
              <el-input
                v-model="formData.description"
                type="textarea"
                :rows="3"
                placeholder="请输入描述信息"
              />
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="规则配置" name="config">
          <!-- 字段映射配置 -->
          <div v-if="formData.type === 'MAPPING'">
            <el-form :model="formData" label-width="120px">
              <el-form-item label="源字段">
                <el-input v-model="formData.sourceField" placeholder="请输入源字段名" />
              </el-form-item>
              <el-form-item label="目标字段">
                <el-input v-model="formData.targetField" placeholder="请输入目标字段名" />
              </el-form-item>
              <el-form-item label="默认值">
                <el-input v-model="formData.defaultValue" placeholder="字段为空时的默认值（可选）" />
              </el-form-item>
            </el-form>
            <el-divider />
            <div class="mb-4">
              <el-button @click="handleAddMapping">添加映射</el-button>
            </div>
            <el-table :data="formData.mappingRules" border>
              <el-table-column prop="sourceField" label="源字段" />
              <el-table-column prop="targetField" label="目标字段" />
              <el-table-column prop="defaultValue" label="默认值" />
              <el-table-column label="操作" width="100">
                <template #default="{ $index }">
                  <el-button link type="danger" size="small" @click="handleRemoveMapping($index)">
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 格式转换配置 -->
          <div v-if="formData.type === 'FORMAT'">
            <el-form :model="formData" label-width="120px">
              <el-form-item label="字段名">
                <el-input v-model="formData.fieldName" placeholder="请输入字段名" />
              </el-form-item>
              <el-form-item label="源格式">
                <el-select v-model="formData.sourceFormat" placeholder="请选择源格式">
                  <el-option label="字符串" value="STRING" />
                  <el-option label="日期时间" value="DATETIME" />
                  <el-option label="数字" value="NUMBER" />
                  <el-option label="JSON" value="JSON" />
                </el-select>
              </el-form-item>
              <el-form-item label="目标格式">
                <el-select v-model="formData.targetFormat" placeholder="请选择目标格式">
                  <el-option label="字符串" value="STRING" />
                  <el-option label="日期时间" value="DATETIME" />
                  <el-option label="数字" value="NUMBER" />
                  <el-option label="JSON" value="JSON" />
                </el-select>
              </el-form-item>
              <el-form-item label="格式模板">
                <el-input v-model="formData.formatTemplate" placeholder="例如: yyyy-MM-dd HH:mm:ss" />
              </el-form-item>
            </el-form>
          </div>

          <!-- 规则校验配置 -->
          <div v-if="formData.type === 'VALIDATION'">
            <el-form :model="formData" label-width="120px">
              <el-form-item label="字段名">
                <el-input v-model="formData.fieldName" placeholder="请输入字段名" />
              </el-form-item>
              <el-form-item label="校验规则">
                <el-select v-model="formData.validationRule" placeholder="请选择校验规则">
                  <el-option label="非空校验" value="NOT_NULL" />
                  <el-option label="长度校验" value="LENGTH" />
                  <el-option label="范围校验" value="RANGE" />
                  <el-option label="正则表达式" value="REGEX" />
                  <el-option label="自定义脚本" value="CUSTOM" />
                </el-select>
              </el-form-item>
              <el-form-item v-if="formData.validationRule === 'LENGTH'" label="最小长度">
                <el-input-number v-model="formData.minLength" :min="0" />
              </el-form-item>
              <el-form-item v-if="formData.validationRule === 'LENGTH'" label="最大长度">
                <el-input-number v-model="formData.maxLength" :min="0" />
              </el-form-item>
              <el-form-item v-if="formData.validationRule === 'REGEX'" label="正则表达式">
                <el-input v-model="formData.regexPattern" placeholder="请输入正则表达式" />
              </el-form-item>
              <el-form-item v-if="formData.validationRule === 'CUSTOM'" label="校验脚本">
                <el-input
                  v-model="formData.customScript"
                  type="textarea"
                  :rows="5"
                  placeholder="请输入JavaScript校验脚本"
                />
              </el-form-item>
            </el-form>
          </div>

          <!-- 数据脱敏配置 -->
          <div v-if="formData.type === 'MASKING'">
            <el-form :model="formData" label-width="120px">
              <el-form-item label="字段名">
                <el-input v-model="formData.fieldName" placeholder="请输入字段名" />
              </el-form-item>
              <el-form-item label="脱敏类型">
                <el-select v-model="formData.maskingType" placeholder="请选择脱敏类型">
                  <el-option label="手机号脱敏" value="PHONE" />
                  <el-option label="邮箱脱敏" value="EMAIL" />
                  <el-option label="身份证脱敏" value="ID_CARD" />
                  <el-option label="银行卡脱敏" value="BANK_CARD" />
                  <el-option label="姓名脱敏" value="NAME" />
                  <el-option label="自定义脱敏" value="CUSTOM" />
                </el-select>
              </el-form-item>
              <el-form-item v-if="formData.maskingType === 'CUSTOM'" label="脱敏规则">
                <el-input
                  v-model="formData.maskingRule"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入脱敏规则，例如: 保留前3位，后4位，中间用*替代"
                />
              </el-form-item>
            </el-form>
          </div>

          <!-- 异常标注配置 -->
          <div v-if="formData.type === 'ANNOTATION'">
            <el-form :model="formData" label-width="120px">
              <el-form-item label="异常类型">
                <el-select v-model="formData.annotationType" placeholder="请选择异常类型">
                  <el-option label="数据缺失" value="MISSING" />
                  <el-option label="数据格式错误" value="FORMAT_ERROR" />
                  <el-option label="数据范围异常" value="RANGE_ERROR" />
                  <el-option label="数据重复" value="DUPLICATE" />
                  <el-option label="业务规则异常" value="BUSINESS_RULE" />
                </el-select>
              </el-form-item>
              <el-form-item label="标注字段">
                <el-input v-model="formData.annotationField" placeholder="请输入标注字段名" />
              </el-form-item>
              <el-form-item label="标注值">
                <el-input v-model="formData.annotationValue" placeholder="请输入标注值" />
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 测试对话框 -->
    <el-dialog v-model="testDialogVisible" title="规则测试" width="800px">
      <el-form :model="testForm" label-width="120px">
        <el-form-item label="测试数据">
          <el-input
            v-model="testForm.testData"
            type="textarea"
            :rows="5"
            placeholder="请输入JSON格式的测试数据"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleRunTest">执行测试</el-button>
        </el-form-item>
        <el-form-item v-if="testResult" label="测试结果">
          <el-input
            v-model="testResult"
            type="textarea"
            :rows="5"
            readonly
          />
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, View } from '@element-plus/icons-vue'

interface TransformRule {
  id: string
  name: string
  type: string
  description: string
  applyTo: string
  status: string
  createTime: string
  sourceField?: string
  targetField?: string
  defaultValue?: string
  mappingRules?: any[]
  fieldName?: string
  sourceFormat?: string
  targetFormat?: string
  formatTemplate?: string
  validationRule?: string
  minLength?: number
  maxLength?: number
  regexPattern?: string
  customScript?: string
  maskingType?: string
  maskingRule?: string
  annotationType?: string
  annotationField?: string
  annotationValue?: string
}

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const testDialogVisible = ref(false)
const dialogTitle = ref('新增转换规则')
const activeTab = ref('basic')
const formRef = ref()
const tableData = ref<TransformRule[]>([])
const tasks = ref<any[]>([])
const testResult = ref('')

const searchForm = reactive({
  name: '',
  type: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const formData = reactive<Partial<TransformRule>>({
  name: '',
  type: '',
  applyTo: '',
  description: '',
  mappingRules: []
})

const testForm = reactive({
  testData: ''
})

const formRules = {
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择规则类型', trigger: 'change' }],
  applyTo: [{ required: true, message: '请选择应用对象', trigger: 'change' }]
}

// 获取类型标签类型
const getTypeTagType = (type: string) => {
  const typeMap: Record<string, string> = {
    MAPPING: 'primary',
    FORMAT: 'success',
    VALIDATION: 'warning',
    MASKING: 'danger',
    ANNOTATION: 'info'
  }
  return typeMap[type] || 'info'
}

// 获取类型标签文本
const getTypeLabel = (type: string) => {
  const labelMap: Record<string, string> = {
    MAPPING: '字段映射',
    FORMAT: '格式转换',
    VALIDATION: '规则校验',
    MASKING: '数据脱敏',
    ANNOTATION: '异常标注'
  }
  return labelMap[type] || type
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    // TODO: 调用实际API
    await new Promise(resolve => setTimeout(resolve, 500))
    tableData.value = [
      {
        id: '1',
        name: '用户信息字段映射',
        type: 'MAPPING',
        description: '将源系统的用户字段映射到目标系统',
        applyTo: '用户数据采集',
        status: 'ENABLED',
        createTime: '2024-01-15 10:00:00'
      },
      {
        id: '2',
        name: '日期格式转换',
        type: 'FORMAT',
        description: '将日期格式从yyyy/MM/dd转换为yyyy-MM-dd',
        applyTo: '全部任务',
        status: 'ENABLED',
        createTime: '2024-01-16 14:20:00'
      },
      {
        id: '3',
        name: '手机号脱敏',
        type: 'MASKING',
        description: '对手机号进行脱敏处理',
        applyTo: '全部任务',
        status: 'ENABLED',
        createTime: '2024-01-17 09:15:00'
      }
    ]
    pagination.total = tableData.value.length
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 加载任务列表
const loadTasks = async () => {
  // TODO: 调用实际API
  tasks.value = [
    { id: '1', name: '用户数据采集' },
    { id: '2', name: '订单数据采集' }
  ]
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
  searchForm.status = ''
  handleSearch()
}

// 新增
const handleAdd = () => {
  dialogTitle.value = '新增转换规则'
  activeTab.value = 'basic'
  Object.assign(formData, {
    name: '',
    type: '',
    applyTo: '',
    description: '',
    mappingRules: []
  })
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: TransformRule) => {
  dialogTitle.value = '编辑转换规则'
  activeTab.value = 'basic'
  Object.assign(formData, row)
  dialogVisible.value = true
}

// 删除
const handleDelete = async (row: TransformRule) => {
  try {
    await ElMessageBox.confirm(`确定要删除规则"${row.name}"吗？`, '提示', {
      type: 'warning'
    })
    // TODO: 调用删除API
    ElMessage.success('删除成功')
    loadData()
  } catch {
    // 用户取消
  }
}

// 切换状态
const handleToggleStatus = async (row: TransformRule) => {
  // TODO: 调用状态切换API
  ElMessage.success(row.status === 'ENABLED' ? '已启用' : '已禁用')
}

// 类型变更
const handleTypeChange = () => {
  // 根据类型重置配置
  formData.mappingRules = []
  formData.sourceField = ''
  formData.targetField = ''
  formData.defaultValue = ''
  formData.fieldName = ''
}

// 添加映射
const handleAddMapping = () => {
  if (!formData.mappingRules) {
    formData.mappingRules = []
  }
  formData.mappingRules.push({
    sourceField: formData.sourceField || '',
    targetField: formData.targetField || '',
    defaultValue: formData.defaultValue || ''
  })
  formData.sourceField = ''
  formData.targetField = ''
  formData.defaultValue = ''
}

// 删除映射
const handleRemoveMapping = (index: number) => {
  if (formData.mappingRules) {
    formData.mappingRules.splice(index, 1)
  }
}

// 测试
const handleTest = (row: TransformRule) => {
  testForm.testData = ''
  testResult.value = ''
  testDialogVisible.value = true
}

// 执行测试
const handleRunTest = () => {
  // TODO: 调用测试API
  testResult.value = JSON.stringify({ result: '测试通过', transformed: '转换后的数据' }, null, 2)
  ElMessage.success('测试完成')
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitting.value = true
      try {
        // TODO: 调用保存API
        await new Promise(resolve => setTimeout(resolve, 1000))
        ElMessage.success(dialogTitle.value === '新增转换规则' ? '新增成功' : '编辑成功')
        dialogVisible.value = false
        loadData()
      } catch (error) {
        ElMessage.error('操作失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

// 对话框关闭
const handleDialogClose = () => {
  formRef.value?.resetFields()
}

// 分页
const handleSizeChange = () => {
  loadData()
}

const handlePageChange = () => {
  loadData()
}

onMounted(() => {
  loadData()
  loadTasks()
})
</script>

<style scoped lang="scss">
:deep(.el-card__body) {
  padding: 16px;
}
</style>