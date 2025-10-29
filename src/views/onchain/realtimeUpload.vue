<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// 类型定义
interface UploadForm {
  content: string
  businessType: string
  urgencyLevel: string
  remark: string
}

interface ChainRecord {
  id: string
  content: string
  businessType: string
  urgencyLevel: string
  status: 'processing' | 'success' | 'failed' | 'pending'
  txHash: string
  blockConfirm: number
  createTime: string
  responseTime: number
  remark: string
}

interface PerformanceData {
  avgResponseTime: number
  successRate: number
  concurrentCount: number
  throughput: number
}

interface ChartData {
  time: string
  responseTime: number
  successCount: number
}

// 业务类型选项
const businessTypeOptions = [
  { label: '交易数据', value: 'transaction' },
  { label: '用户认证', value: 'authentication' },
  { label: '资产转移', value: 'asset_transfer' },
  { label: '合约执行', value: 'contract_execution' },
  { label: '数据存证', value: 'data_storage' },
]

// 紧急程度选项
const urgencyOptions = [
  { label: '普通', value: 'normal', type: 'success' },
  { label: '重要', value: 'important', type: 'warning' },
  { label: '紧急', value: 'urgent', type: 'danger' },
]

// 表单数据
const formRef = ref<FormInstance>()
const uploadForm = reactive<UploadForm>({
  content: '',
  businessType: '',
  urgencyLevel: 'normal',
  remark: '',
})

// 表单验证规则
const formRules: FormRules = {
  content: [
    { required: true, message: '请输入数据内容', trigger: 'blur' },
    { min: 10, max: 500, message: '数据内容长度应在 10-500 字符之间', trigger: 'blur' },
  ],
  businessType: [{ required: true, message: '请选择业务类型', trigger: 'change' }],
  urgencyLevel: [{ required: true, message: '请选择紧急程度', trigger: 'change' }],
}

// 上链记录列表
const chainRecords = ref<ChainRecord[]>([])
const filteredRecords = ref<ChainRecord[]>([])

// 搜索和筛选
const searchKeyword = ref('')
const filterBusinessType = ref('')

// 性能指标
const performanceData = reactive<PerformanceData>({
  avgResponseTime: 0,
  successRate: 0,
  concurrentCount: 0,
  throughput: 0,
})

// 图表数据
const chartData = ref<ChartData[]>([])

// 草稿数据
const draftData = ref<UploadForm | null>(null)

// 加载状态
const isSubmitting = ref(false)
const autoRefresh = ref(true)
let refreshTimer: number | null = null

// 生成随机交易哈希
const generateTxHash = () => {
  return '0x' + Math.random().toString(16).substring(2, 66).padEnd(64, '0')
}

// 生成随机ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

// 获取状态标签类型
const getStatusType = (status: string) => {
  const map: Record<string, any> = {
    processing: 'primary',
    success: 'success',
    failed: 'danger',
    pending: 'warning',
  }
  return map[status] || 'info'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    processing: '处理中',
    success: '成功',
    failed: '失败',
    pending: '待确认',
  }
  return map[status] || status
}

// 获取紧急程度标签类型
const getUrgencyType = (level: string) => {
  const map: Record<string, any> = {
    normal: 'success',
    important: 'warning',
    urgent: 'danger',
  }
  return map[level] || 'info'
}

// 获取紧急程度文本
const getUrgencyText = (level: string) => {
  const option = urgencyOptions.find((opt) => opt.value === level)
  return option?.label || level
}

// 获取业务类型文本
const getBusinessTypeText = (type: string) => {
  const option = businessTypeOptions.find((opt) => opt.value === type)
  return option?.label || type
}

// 保存草稿
const saveDraft = () => {
  draftData.value = { ...uploadForm }
  ElMessage.success('草稿已保存')
}

// 加载草稿
const loadDraft = () => {
  if (draftData.value) {
    Object.assign(uploadForm, draftData.value)
    ElMessage.success('草稿已加载')
  } else {
    ElMessage.warning('暂无草稿数据')
  }
}

// 清除草稿
const clearDraft = () => {
  draftData.value = null
  ElMessage.success('草稿已清除')
}

// 提交上链
const submitUpload = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    isSubmitting.value = true

    // 模拟异步上链操作
    setTimeout(() => {
      const newRecord: ChainRecord = {
        id: generateId(),
        content: uploadForm.content,
        businessType: uploadForm.businessType,
        urgencyLevel: uploadForm.urgencyLevel,
        status: 'processing',
        txHash: generateTxHash(),
        blockConfirm: 0,
        createTime: new Date().toLocaleString(),
        responseTime: Math.floor(Math.random() * 500) + 100,
        remark: uploadForm.remark,
      }

      chainRecords.value.unshift(newRecord)
      updateFilteredRecords()

      ElNotification({
        title: '上链成功',
        message: `交易已提交，哈希: ${newRecord.txHash.substring(0, 10)}...`,
        type: 'success',
      })

      // 模拟状态变化
      simulateStatusChange(newRecord)

      // 重置表单
      formRef.value?.resetFields()
      isSubmitting.value = false

      // 清除草稿
      draftData.value = null
    }, 1000)
  } catch (error) {
    console.error('表单验证失败:', error)
    isSubmitting.value = false
  }
}

// 模拟状态变化
const simulateStatusChange = (record: ChainRecord) => {
  // 2秒后变为待确认
  setTimeout(() => {
    record.status = 'pending'
    record.blockConfirm = 1
  }, 2000)

  // 5秒后根据紧急程度决定成功或失败
  setTimeout(() => {
    const shouldFail = record.urgencyLevel === 'urgent' && Math.random() < 0.3
    if (shouldFail) {
      record.status = 'failed'
      ElNotification({
        title: '上链失败',
        message: `交易 ${record.txHash.substring(0, 10)}... 上链失败，请重试`,
        type: 'error',
      })
    } else {
      record.status = 'success'
      record.blockConfirm = Math.floor(Math.random() * 10) + 6
    }
    updatePerformanceData()
  }, 5000)
}

// 重新上链
const retryUpload = (record: ChainRecord) => {
  record.status = 'processing'
  record.blockConfirm = 0
  record.txHash = generateTxHash()
  record.createTime = new Date().toLocaleString()

  ElMessage.info('正在重新上链...')
  simulateStatusChange(record)
}

// 更新筛选后的记录
const updateFilteredRecords = () => {
  let records = chainRecords.value

  // 按业务类型筛选
  if (filterBusinessType.value) {
    records = records.filter((r) => r.businessType === filterBusinessType.value)
  }

  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    records = records.filter(
      (r) =>
        r.content.toLowerCase().includes(keyword) ||
        r.txHash.toLowerCase().includes(keyword) ||
        r.remark.toLowerCase().includes(keyword)
    )
  }

  filteredRecords.value = records
}

// 搜索记录
const searchRecords = () => {
  updateFilteredRecords()
}

// 筛选记录
const filterRecords = () => {
  updateFilteredRecords()
}

// 更新性能指标
const updatePerformanceData = () => {
  if (chainRecords.value.length === 0) return

  const recentRecords = chainRecords.value.slice(0, 20)
  const successRecords = recentRecords.filter((r) => r.status === 'success')
  const totalResponseTime = recentRecords.reduce((sum, r) => sum + r.responseTime, 0)

  performanceData.avgResponseTime = Math.round(totalResponseTime / recentRecords.length)
  performanceData.successRate = Math.round((successRecords.length / recentRecords.length) * 100)
  performanceData.concurrentCount = chainRecords.value.filter((r) => r.status === 'processing').length
  performanceData.throughput = Math.round(chainRecords.value.length / 10) // 假设10分钟内的吞吐量

  // 更新图表数据
  updateChartData()
}

// 更新图表数据
const updateChartData = () => {
  const now = new Date()
  const timeStr = `${now.getHours()}:${now.getMinutes()}`

  const lastData = chartData.value[chartData.value.length - 1]
  if (lastData && lastData.time === timeStr) {
    lastData.responseTime = performanceData.avgResponseTime
    lastData.successCount = chainRecords.value.filter((r) => r.status === 'success').length
  } else {
    chartData.value.push({
      time: timeStr,
      responseTime: performanceData.avgResponseTime,
      successCount: chainRecords.value.filter((r) => r.status === 'success').length,
    })

    // 只保留最近10条数据
    if (chartData.value.length > 10) {
      chartData.value.shift()
    }
  }
}

// 自动刷新
const startAutoRefresh = () => {
  if (refreshTimer) return

  refreshTimer = setInterval(() => {
    if (autoRefresh.value) {
      updatePerformanceData()
    }
  }, 3000)
}

// 停止自动刷新
const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// 切换自动刷新
const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value
  if (autoRefresh.value) {
    ElMessage.success('已开启自动刷新')
    startAutoRefresh()
  } else {
    ElMessage.info('已关闭自动刷新')
    stopAutoRefresh()
  }
}

// 生成模拟数据
const generateMockData = () => {
  const mockRecords: ChainRecord[] = []
  const statuses: Array<'processing' | 'success' | 'failed' | 'pending'> = [
    'success',
    'success',
    'success',
    'failed',
    'pending',
  ]

  for (let i = 0; i < 5; i++) {
    mockRecords.push({
      id: generateId(),
      content: `模拟数据内容 ${i + 1}：这是一条测试上链数据记录`,
      businessType: businessTypeOptions[Math.floor(Math.random() * businessTypeOptions.length)].value,
      urgencyLevel: urgencyOptions[Math.floor(Math.random() * urgencyOptions.length)].value,
      status: statuses[i],
      txHash: generateTxHash(),
      blockConfirm: statuses[i] === 'success' ? Math.floor(Math.random() * 10) + 6 : 0,
      createTime: new Date(Date.now() - i * 300000).toLocaleString(),
      responseTime: Math.floor(Math.random() * 500) + 100,
      remark: `备注信息 ${i + 1}`,
    })
  }

  chainRecords.value = mockRecords
  updateFilteredRecords()
  updatePerformanceData()
}

// 时间轴图标
const getTimelineIcon = (status: string) => {
  const map: Record<string, string> = {
    processing: 'Loading',
    success: 'CircleCheck',
    failed: 'CircleClose',
    pending: 'Clock',
  }
  return map[status] || 'More'
}

// 计算属性：统计数据
const statistics = computed(() => {
  return {
    total: chainRecords.value.length,
    processing: chainRecords.value.filter((r) => r.status === 'processing').length,
    success: chainRecords.value.filter((r) => r.status === 'success').length,
    failed: chainRecords.value.filter((r) => r.status === 'failed').length,
    pending: chainRecords.value.filter((r) => r.status === 'pending').length,
  }
})

// 生命周期
onMounted(() => {
  generateMockData()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<template>
  <div class="realtime-upload-container">
    <!-- 顶部统计卡片 -->
    <el-row :gutter="20" class="statistics-row">
      <el-col :span="4">
        <el-card class="statistics-card">
          <el-statistic title="总计" :value="statistics.total" />
        </el-card>
      </el-col>
      <el-col :span="5">
        <el-card class="statistics-card">
          <el-statistic title="处理中" :value="statistics.processing">
            <template #suffix>
              <el-icon color="#409EFF"><Loading /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="5">
        <el-card class="statistics-card">
          <el-statistic title="成功" :value="statistics.success">
            <template #suffix>
              <el-icon color="#67C23A"><CircleCheck /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="5">
        <el-card class="statistics-card">
          <el-statistic title="失败" :value="statistics.failed">
            <template #suffix>
              <el-icon color="#F56C6C"><CircleClose /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="5">
        <el-card class="statistics-card">
          <el-statistic title="待确认" :value="statistics.pending">
            <template #suffix>
              <el-icon color="#E6A23C"><Clock /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- 主内容区 -->
    <el-row :gutter="20" class="main-content">
      <!-- 左侧：上链操作表单 -->
      <el-col :span="10">
        <el-card class="form-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">实时上链操作</span>
              <div>
                <el-button type="primary" text @click="loadDraft" :disabled="!draftData">
                  加载草稿
                </el-button>
                <el-button type="danger" text @click="clearDraft" :disabled="!draftData">
                  清除草稿
                </el-button>
              </div>
            </div>
          </template>

          <el-form
            ref="formRef"
            :model="uploadForm"
            :rules="formRules"
            label-width="100px"
            label-position="top"
          >
            <el-form-item label="数据内容" prop="content">
              <el-input
                v-model="uploadForm.content"
                type="textarea"
                :rows="4"
                placeholder="请输入需要上链的数据内容（10-500字符）"
                show-word-limit
                maxlength="500"
              />
            </el-form-item>

            <el-form-item label="业务类型" prop="businessType">
              <el-select v-model="uploadForm.businessType" placeholder="请选择业务类型" style="width: 100%">
                <el-option
                  v-for="item in businessTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="紧急程度" prop="urgencyLevel">
              <el-select v-model="uploadForm.urgencyLevel" placeholder="请选择紧急程度" style="width: 100%">
                <el-option
                  v-for="item in urgencyOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                >
                  <el-tag :type="item.type" size="small">{{ item.label }}</el-tag>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="备注信息" prop="remark">
              <el-input
                v-model="uploadForm.remark"
                type="textarea"
                :rows="2"
                placeholder="请输入备注信息（可选）"
                maxlength="200"
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="submitUpload" :loading="isSubmitting" style="width: 48%">
                提交上链
              </el-button>
              <el-button @click="saveDraft" style="width: 48%; margin-left: 4%">保存草稿</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 性能指标监控 -->
        <el-card class="performance-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">性能指标监控</span>
              <el-button type="primary" text @click="toggleAutoRefresh">
                {{ autoRefresh ? '关闭' : '开启' }}自动刷新
              </el-button>
            </div>
          </template>

          <el-row :gutter="20">
            <el-col :span="12">
              <div class="performance-item">
                <div class="performance-label">平均响应时间</div>
                <div class="performance-value">{{ performanceData.avgResponseTime }} ms</div>
                <el-progress
                  :percentage="Math.min(100, (performanceData.avgResponseTime / 1000) * 100)"
                  :color="performanceData.avgResponseTime < 300 ? '#67C23A' : '#E6A23C'"
                  :show-text="false"
                />
              </div>
            </el-col>
            <el-col :span="12">
              <div class="performance-item">
                <div class="performance-label">上链成功率</div>
                <div class="performance-value">{{ performanceData.successRate }}%</div>
                <el-progress
                  :percentage="performanceData.successRate"
                  :color="performanceData.successRate > 90 ? '#67C23A' : '#F56C6C'"
                  :show-text="false"
                />
              </div>
            </el-col>
          </el-row>

          <el-row :gutter="20" style="margin-top: 20px">
            <el-col :span="12">
              <div class="performance-item">
                <div class="performance-label">并发上链数量</div>
                <div class="performance-value">{{ performanceData.concurrentCount }}</div>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="performance-item">
                <div class="performance-label">吞吐量</div>
                <div class="performance-value">{{ performanceData.throughput }} 笔/10分钟</div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>

      <!-- 右侧：实时数据展示 -->
      <el-col :span="14">
        <el-card class="records-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">实时上链记录</span>
              <div class="filter-controls">
                <el-select
                  v-model="filterBusinessType"
                  placeholder="业务类型"
                  clearable
                  @change="filterRecords"
                  style="width: 150px; margin-right: 10px"
                >
                  <el-option
                    v-for="item in businessTypeOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
                <el-input
                  v-model="searchKeyword"
                  placeholder="搜索内容/哈希/备注"
                  style="width: 200px"
                  clearable
                  @input="searchRecords"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
              </div>
            </div>
          </template>

          <div class="records-content">
            <el-alert
              v-if="filteredRecords.length === 0"
              title="暂无上链记录"
              type="info"
              :closable="false"
              center
            />

            <el-timeline v-else>
              <el-timeline-item
                v-for="record in filteredRecords"
                :key="record.id"
                :timestamp="record.createTime"
                placement="top"
                :type="getStatusType(record.status)"
                :icon="getTimelineIcon(record.status)"
              >
                <el-card class="record-item-card">
                  <div class="record-header">
                    <div class="record-tags">
                      <el-tag :type="getStatusType(record.status)" size="small">
                        {{ getStatusText(record.status) }}
                      </el-tag>
                      <el-tag :type="getUrgencyType(record.urgencyLevel)" size="small">
                        {{ getUrgencyText(record.urgencyLevel) }}
                      </el-tag>
                      <el-tag type="info" size="small">
                        {{ getBusinessTypeText(record.businessType) }}
                      </el-tag>
                    </div>
                    <el-button
                      v-if="record.status === 'failed'"
                      type="danger"
                      size="small"
                      text
                      @click="retryUpload(record)"
                    >
                      重新上链
                    </el-button>
                  </div>

                  <div class="record-content">
                    <div class="record-field">
                      <span class="field-label">数据内容：</span>
                      <span class="field-value">{{ record.content }}</span>
                    </div>
                    <div class="record-field">
                      <span class="field-label">交易哈希：</span>
                      <span class="field-value hash-value" :title="record.txHash">
                        {{ record.txHash.substring(0, 20) }}...{{ record.txHash.substring(record.txHash.length - 10) }}
                      </span>
                    </div>
                    <div class="record-field">
                      <span class="field-label">区块确认数：</span>
                      <span class="field-value">
                        {{ record.blockConfirm }}
                        <el-tag v-if="record.blockConfirm >= 6" type="success" size="small" style="margin-left: 5px">
                          已确认
                        </el-tag>
                      </span>
                    </div>
                    <div class="record-field">
                      <span class="field-label">响应时间：</span>
                      <span class="field-value">{{ record.responseTime }} ms</span>
                    </div>
                    <div v-if="record.remark" class="record-field">
                      <span class="field-label">备注：</span>
                      <span class="field-value">{{ record.remark }}</span>
                    </div>
                  </div>

                  <!-- 失败提示 -->
                  <el-alert
                    v-if="record.status === 'failed'"
                    title="上链失败"
                    type="error"
                    :closable="false"
                    style="margin-top: 10px"
                  >
                    <template #default>
                      <span>网络拥堵或节点异常，请重新提交上链请求</span>
                    </template>
                  </el-alert>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.realtime-upload-container {
  .statistics-row {
    margin-bottom: 20px;

    .statistics-card {
      text-align: center;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
    }
  }

  .main-content {
    .form-card {
      margin-bottom: 20px;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .card-title {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }

      .filter-controls {
        display: flex;
        align-items: center;
      }
    }

    .performance-card {
      .performance-item {
        .performance-label {
          font-size: 14px;
          color: #909399;
          margin-bottom: 8px;
        }

        .performance-value {
          font-size: 24px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 10px;
        }
      }
    }

    .records-card {
      height: calc(100vh - 200px);

      .records-content {
        max-height: calc(100vh - 300px);
        overflow-y: auto;

        &::-webkit-scrollbar {
          width: 6px;
        }

        &::-webkit-scrollbar-thumb {
          background-color: #dcdfe6;
          border-radius: 3px;

          &:hover {
            background-color: #c0c4cc;
          }
        }

        .record-item-card {
          margin-bottom: 10px;

          .record-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;

            .record-tags {
              display: flex;
              gap: 8px;
            }
          }

          .record-content {
            .record-field {
              margin-bottom: 8px;
              font-size: 14px;
              line-height: 1.6;

              .field-label {
                color: #909399;
                font-weight: 500;
              }

              .field-value {
                color: #303133;

                &.hash-value {
                  font-family: 'Courier New', monospace;
                  font-size: 12px;
                  color: #409eff;
                }
              }
            }
          }
        }
      }
    }
  }
}
</style>