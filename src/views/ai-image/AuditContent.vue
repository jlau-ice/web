<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import type { UploadProps, UploadUserFile } from 'element-plus'
import { Delete, Download, View, Upload as UploadIcon, Setting, DocumentCopy } from '@element-plus/icons-vue'

// 审核状态类型
type AuditStatus = 'pending' | 'processing' | 'passed' | 'rejected'
type RiskLevel = 'high' | 'medium' | 'low' | 'safe'

// 违规类型
interface ViolationType {
  type: string
  confidence: number
  label: string
}

// 图片审核结果
interface ImageAuditResult {
  id: string
  name: string
  url: string
  status: AuditStatus
  riskLevel: RiskLevel
  violations: ViolationType[]
  uploadTime: string
  auditTime?: string
  size: number
}

// 统计数据
interface Statistics {
  totalImages: number
  passedImages: number
  rejectedImages: number
  processingImages: number
  accuracy: number
  falsePositiveRate: number
  avgProcessTime: number
  throughput: number
}

// 审核规则配置
interface AuditRuleConfig {
  pornThreshold: number
  violenceThreshold: number
  adThreshold: number
  brandThreshold: number
  highRiskThreshold: number
  mediumRiskThreshold: number
}

// 上传文件列表
const fileList = ref<UploadUserFile[]>([])

// 审核结果列表
const auditResults = ref<ImageAuditResult[]>([])

// 统计数据
const statistics = reactive<Statistics>({
  totalImages: 0,
  passedImages: 0,
  rejectedImages: 0,
  processingImages: 0,
  accuracy: 98.5,
  falsePositiveRate: 1.2,
  avgProcessTime: 120,
  throughput: 500
})

// 审核规则配置
const ruleConfig = reactive<AuditRuleConfig>({
  pornThreshold: 0.8,
  violenceThreshold: 0.75,
  adThreshold: 0.7,
  brandThreshold: 0.65,
  highRiskThreshold: 0.9,
  mediumRiskThreshold: 0.7
})

// 筛选条件
const filterStatus = ref<AuditStatus | 'all'>('all')
const filterRiskLevel = ref<RiskLevel | 'all'>('all')

// 配置面板显示
const showConfigPanel = ref(false)

// 获取状态标签类型
const getStatusTagType = (status: AuditStatus) => {
  const map = {
    pending: 'info',
    processing: 'primary',
    passed: 'success',
    rejected: 'danger'
  }
  return map[status] as any
}

// 获取状态文本
const getStatusText = (status: AuditStatus) => {
  const map = {
    pending: '待审核',
    processing: '审核中',
    passed: '通过',
    rejected: '拒绝'
  }
  return map[status]
}

// 获取风险等级标签类型
const getRiskTagType = (level: RiskLevel) => {
  const map = {
    high: 'danger',
    medium: 'warning',
    low: 'primary',
    safe: 'success'
  }
  return map[level] as any
}

// 获取风险等级文本
const getRiskText = (level: RiskLevel) => {
  const map = {
    high: '高危',
    medium: '中危',
    low: '低危',
    safe: '正常'
  }
  return map[level]
}

// 获取违规类型文本
const getViolationLabel = (type: string) => {
  const map: Record<string, string> = {
    porn: '涉黄内容',
    violence: '涉暴内容',
    ad: '广告推广',
    brand: '敏感品牌',
    politics: '敏感政治',
    terror: '恐怖主义'
  }
  return map[type] || type
}

// 筛选后的审核结果
const filteredResults = computed(() => {
  return auditResults.value.filter(item => {
    if (filterStatus.value !== 'all' && item.status !== filterStatus.value) {
      return false
    }
    if (filterRiskLevel.value !== 'all' && item.riskLevel !== filterRiskLevel.value) {
      return false
    }
    return true
  })
})

// 处理文件上传
const handleFileChange: UploadProps['onChange'] = (uploadFile, uploadFiles) => {
  fileList.value = uploadFiles
}

// 批量审核
const startBatchAudit = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请先上传图片文件')
    return
  }

  ElMessage.success(`开始审核 ${fileList.value.length} 张图片`)

  for (const file of fileList.value) {
    // 创建审核记录
    const auditItem: ImageAuditResult = {
      id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      url: file.url || URL.createObjectURL(file.raw as Blob),
      status: 'processing',
      riskLevel: 'safe',
      violations: [],
      uploadTime: new Date().toLocaleString(),
      size: file.size || 0
    }

    auditResults.value.unshift(auditItem)
    statistics.totalImages++
    statistics.processingImages++

    // 模拟审核过程
    setTimeout(() => {
      processAudit(auditItem)
    }, Math.random() * 2000 + 500)
  }

  // 清空上传列表
  fileList.value = []
}

// 处理单个图片审核
const processAudit = (item: ImageAuditResult) => {
  // 模拟识别结果
  const violationTypes = ['porn', 'violence', 'ad', 'brand', 'politics', 'terror']
  const violations: ViolationType[] = []

  // 随机生成违规内容
  const violationCount = Math.random() > 0.7 ? Math.floor(Math.random() * 3) : 0

  for (let i = 0; i < violationCount; i++) {
    const type = violationTypes[Math.floor(Math.random() * violationTypes.length)]
    const confidence = Math.random() * 0.4 + 0.6 // 0.6-1.0

    violations.push({
      type,
      confidence,
      label: getViolationLabel(type)
    })
  }

  // 计算风险等级
  let riskLevel: RiskLevel = 'safe'
  let maxConfidence = 0

  violations.forEach(v => {
    if (v.confidence > maxConfidence) {
      maxConfidence = v.confidence
    }
  })

  if (maxConfidence >= ruleConfig.highRiskThreshold) {
    riskLevel = 'high'
  } else if (maxConfidence >= ruleConfig.mediumRiskThreshold) {
    riskLevel = 'medium'
  } else if (violations.length > 0) {
    riskLevel = 'low'
  }

  // 确定审核状态
  const status: AuditStatus = riskLevel === 'high' || riskLevel === 'medium' ? 'rejected' : 'passed'

  // 更新审核结果
  item.violations = violations
  item.riskLevel = riskLevel
  item.status = status
  item.auditTime = new Date().toLocaleString()

  // 更新统计数据
  statistics.processingImages--
  if (status === 'passed') {
    statistics.passedImages++
  } else {
    statistics.rejectedImages++
  }

  // 更新吞吐量
  statistics.throughput = Math.floor(Math.random() * 100 + 450)

  // 发送通知
  if (status === 'rejected') {
    ElNotification({
      title: '发现违规内容',
      message: `图片 ${item.name} 检测到 ${violations.length} 项违规内容`,
      type: 'warning',
      duration: 3000
    })
  }
}

// 删除审核记录
const deleteAuditItem = (id: string) => {
  const index = auditResults.value.findIndex(item => item.id === id)
  if (index !== -1) {
    const item = auditResults.value[index]
    auditResults.value.splice(index, 1)
    statistics.totalImages--
    if (item.status === 'passed') {
      statistics.passedImages--
    } else if (item.status === 'rejected') {
      statistics.rejectedImages--
    } else if (item.status === 'processing') {
      statistics.processingImages--
    }
  }
}

// 清空所有记录
const clearAllResults = () => {
  auditResults.value = []
  statistics.totalImages = 0
  statistics.passedImages = 0
  statistics.rejectedImages = 0
  statistics.processingImages = 0
  ElMessage.success('已清空所有审核记录')
}

// 导出审核报告
const exportReport = () => {
  const report = {
    exportTime: new Date().toLocaleString(),
    statistics: statistics,
    ruleConfig: ruleConfig,
    results: auditResults.value
  }

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `audit-report-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)

  ElMessage.success('审核报告已导出')
}

// 保存规则配置
const saveRuleConfig = () => {
  showConfigPanel.value = false
  ElMessage.success('审核规则配置已保存')
}

// 重置规则配置
const resetRuleConfig = () => {
  ruleConfig.pornThreshold = 0.8
  ruleConfig.violenceThreshold = 0.75
  ruleConfig.adThreshold = 0.7
  ruleConfig.brandThreshold = 0.65
  ruleConfig.highRiskThreshold = 0.9
  ruleConfig.mediumRiskThreshold = 0.7
  ElMessage.info('已重置为默认配置')
}

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// 初始化模拟数据
onMounted(() => {
  // 模拟一些历史审核数据
  setTimeout(() => {
    statistics.accuracy = 98.5
    statistics.falsePositiveRate = 1.2
    statistics.avgProcessTime = 120
    statistics.throughput = 500
  }, 100)
})
</script>

<template>
  <div class="audit-content-page">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <el-row :gutter="16">
        <el-col :span="12">
          <h2 class="page-title">图像内容审核</h2>
        </el-col>
        <el-col :span="12" class="text-right">
          <el-button :icon="Setting" @click="showConfigPanel = true">规则配置</el-button>
          <el-button :icon="DocumentCopy" @click="exportReport" type="primary">导出报告</el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 主要内容区域 -->
    <el-row :gutter="20" class="main-content">
      <!-- 左侧：上传区域 -->
      <el-col :span="6">
        <el-card shadow="hover" class="upload-card">
          <template #header>
            <div class="card-header">
              <span>批量上传图片</span>
            </div>
          </template>

          <el-upload
            v-model:file-list="fileList"
            class="upload-demo"
            drag
            multiple
            :auto-upload="false"
            accept="image/*"
            :on-change="handleFileChange"
          >
            <el-icon class="el-icon--upload">
              <upload-icon />
            </el-icon>
            <div class="el-upload__text">
              拖拽文件到此处或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 jpg/png/gif 格式，单次最多上传 20 张图片
              </div>
            </template>
          </el-upload>

          <div class="upload-actions">
            <el-button type="primary" :disabled="fileList.length === 0" @click="startBatchAudit" style="width: 100%">
              开始审核 ({{ fileList.length }})
            </el-button>
          </div>
        </el-card>

        <!-- 筛选条件 -->
        <el-card shadow="hover" class="filter-card">
          <template #header>
            <div class="card-header">
              <span>筛选条件</span>
            </div>
          </template>

          <div class="filter-section">
            <label>审核状态：</label>
            <el-select v-model="filterStatus" style="width: 100%">
              <el-option label="全部" value="all" />
              <el-option label="待审核" value="pending" />
              <el-option label="审核中" value="processing" />
              <el-option label="通过" value="passed" />
              <el-option label="拒绝" value="rejected" />
            </el-select>
          </div>

          <div class="filter-section">
            <label>风险等级：</label>
            <el-select v-model="filterRiskLevel" style="width: 100%">
              <el-option label="全部" value="all" />
              <el-option label="高危" value="high" />
              <el-option label="中危" value="medium" />
              <el-option label="低危" value="low" />
              <el-option label="正常" value="safe" />
            </el-select>
          </div>

          <el-button @click="clearAllResults" type="danger" plain style="width: 100%; margin-top: 10px">
            清空所有记录
          </el-button>
        </el-card>
      </el-col>

      <!-- 中间：审核结果列表 -->
      <el-col :span="12">
        <el-card shadow="hover" class="result-card">
          <template #header>
            <div class="card-header">
              <span>审核结果 ({{ filteredResults.length }})</span>
            </div>
          </template>

          <div class="result-list">
            <div v-if="filteredResults.length === 0" class="empty-state">
              <el-empty description="暂无审核记录，请上传图片开始审核" />
            </div>

            <div v-else class="result-items">
              <div v-for="item in filteredResults" :key="item.id" class="result-item">
                <div class="item-image">
                  <img :src="item.url" :alt="item.name" />
                  <div v-if="item.status === 'processing'" class="processing-overlay">
                    <el-icon class="is-loading">
                      <i-ep-loading />
                    </el-icon>
                  </div>
                </div>

                <div class="item-content">
                  <div class="item-header">
                    <span class="item-name" :title="item.name">{{ item.name }}</span>
                    <el-button
                      :icon="Delete"
                      size="small"
                      type="danger"
                      text
                      @click="deleteAuditItem(item.id)"
                    />
                  </div>

                  <div class="item-info">
                    <div class="info-row">
                      <span>状态：</span>
                      <el-tag :type="getStatusTagType(item.status)" size="small">
                        {{ getStatusText(item.status) }}
                      </el-tag>
                    </div>

                    <div class="info-row">
                      <span>风险：</span>
                      <el-tag :type="getRiskTagType(item.riskLevel)" size="small">
                        {{ getRiskText(item.riskLevel) }}
                      </el-tag>
                    </div>

                    <div class="info-row">
                      <span>大小：</span>
                      <span>{{ formatFileSize(item.size) }}</span>
                    </div>

                    <div class="info-row">
                      <span>上传：</span>
                      <span class="text-muted">{{ item.uploadTime }}</span>
                    </div>

                    <div v-if="item.auditTime" class="info-row">
                      <span>审核：</span>
                      <span class="text-muted">{{ item.auditTime }}</span>
                    </div>
                  </div>

                  <!-- 违规内容 -->
                  <div v-if="item.violations.length > 0" class="violations">
                    <div class="violations-header">违规内容识别：</div>
                    <div class="violations-list">
                      <div v-for="(violation, index) in item.violations" :key="index" class="violation-item">
                        <el-tag type="danger" size="small">{{ violation.label }}</el-tag>
                        <span class="confidence">置信度: {{ (violation.confidence * 100).toFixed(1) }}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：统计和监控 -->
      <el-col :span="6">
        <!-- 实时统计 -->
        <el-card shadow="hover" class="statistics-card">
          <template #header>
            <div class="card-header">
              <span>实时统计</span>
            </div>
          </template>

          <div class="statistics-grid">
            <el-statistic title="总审核数" :value="statistics.totalImages" />
            <el-statistic title="审核通过" :value="statistics.passedImages">
              <template #suffix>
                <span style="color: #67c23a; font-size: 14px; margin-left: 4px">
                  {{ statistics.totalImages > 0 ? ((statistics.passedImages / statistics.totalImages) * 100).toFixed(1) : 0 }}%
                </span>
              </template>
            </el-statistic>
            <el-statistic title="审核拒绝" :value="statistics.rejectedImages">
              <template #suffix>
                <span style="color: #f56c6c; font-size: 14px; margin-left: 4px">
                  {{ statistics.totalImages > 0 ? ((statistics.rejectedImages / statistics.totalImages) * 100).toFixed(1) : 0 }}%
                </span>
              </template>
            </el-statistic>
            <el-statistic title="处理中" :value="statistics.processingImages">
              <template #suffix>
                <el-icon v-if="statistics.processingImages > 0" class="is-loading" style="margin-left: 4px">
                  <i-ep-loading />
                </el-icon>
              </template>
            </el-statistic>
          </div>
        </el-card>

        <!-- 性能监控 -->
        <el-card shadow="hover" class="monitor-card">
          <template #header>
            <div class="card-header">
              <span>性能监控</span>
            </div>
          </template>

          <el-descriptions :column="1" border>
            <el-descriptions-item label="审核准确率">
              <el-tag type="success">{{ statistics.accuracy }}%</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="误判率">
              <el-tag type="warning">{{ statistics.falsePositiveRate }}%</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="平均处理时间">
              {{ statistics.avgProcessTime }} ms
            </el-descriptions-item>
            <el-descriptions-item label="实时吞吐量">
              <el-tag type="primary">{{ statistics.throughput }} 张/秒</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 系统状态 -->
        <el-card shadow="hover" class="status-card">
          <template #header>
            <div class="card-header">
              <span>系统状态</span>
            </div>
          </template>

          <el-alert title="审核服务运行正常" type="success" :closable="false" show-icon />
          
          <div class="status-info">
            <div class="status-item">
              <span>模型版本：</span>
              <el-tag size="small">v2.3.1</el-tag>
            </div>
            <div class="status-item">
              <span>最后更新：</span>
              <span class="text-muted">2025-10-28</span>
            </div>
            <div class="status-item">
              <span>API 状态：</span>
              <el-tag type="success" size="small">在线</el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 规则配置弹窗 -->
    <el-dialog
      v-model="showConfigPanel"
      title="审核规则配置"
      width="600px"
    >
      <div class="config-section">
        <h4>违规内容识别阈值</h4>
        <div class="config-item">
          <label>涉黄内容阈值：</label>
          <el-slider v-model="ruleConfig.pornThreshold" :min="0" :max="1" :step="0.05" show-input />
        </div>
        <div class="config-item">
          <label>涉暴内容阈值：</label>
          <el-slider v-model="ruleConfig.violenceThreshold" :min="0" :max="1" :step="0.05" show-input />
        </div>
        <div class="config-item">
          <label>广告推广阈值：</label>
          <el-slider v-model="ruleConfig.adThreshold" :min="0" :max="1" :step="0.05" show-input />
        </div>
        <div class="config-item">
          <label>敏感品牌阈值：</label>
          <el-slider v-model="ruleConfig.brandThreshold" :min="0" :max="1" :step="0.05" show-input />
        </div>
      </div>

      <el-divider />

      <div class="config-section">
        <h4>风险等级划分标准</h4>
        <div class="config-item">
          <label>高风险阈值：</label>
          <el-slider v-model="ruleConfig.highRiskThreshold" :min="0" :max="1" :step="0.05" show-input />
        </div>
        <div class="config-item">
          <label>中风险阈值：</label>
          <el-slider v-model="ruleConfig.mediumRiskThreshold" :min="0" :max="1" :step="0.05" show-input />
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="resetRuleConfig">重置</el-button>
          <el-button @click="showConfigPanel = false">取消</el-button>
          <el-button type="primary" @click="saveRuleConfig">保存配置</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.audit-content-page {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 120px);

  .toolbar {
    background: white;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

    .page-title {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: #303133;
    }

    .text-right {
      text-align: right;
    }
  }

  .main-content {
    .el-card {
      margin-bottom: 20px;
      border-radius: 8px;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 600;
        font-size: 16px;
      }
    }

    // 上传卡片
    .upload-card {
      .upload-demo {
        :deep(.el-upload-dragger) {
          padding: 30px;
          border-radius: 8px;
        }

        .el-icon--upload {
          font-size: 48px;
          color: #409eff;
          margin-bottom: 16px;
        }

        .el-upload__text {
          font-size: 14px;
          color: #606266;

          em {
            color: #409eff;
            font-style: normal;
          }
        }

        .el-upload__tip {
          margin-top: 10px;
          font-size: 12px;
          color: #909399;
        }
      }

      .upload-actions {
        margin-top: 20px;
      }
    }

    // 筛选卡片
    .filter-card {
      .filter-section {
        margin-bottom: 16px;

        label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          color: #606266;
          font-weight: 500;
        }
      }
    }

    // 结果卡片
    .result-card {
      height: calc(100vh - 200px);

      :deep(.el-card__body) {
        height: calc(100% - 60px);
        padding: 0;
      }

      .result-list {
        height: 100%;
        overflow-y: auto;
        padding: 16px;

        .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
        }

        .result-items {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .result-item {
          display: flex;
          gap: 16px;
          padding: 16px;
          background: #fafafa;
          border-radius: 8px;
          border: 1px solid #e4e7ed;
          transition: all 0.3s;

          &:hover {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            border-color: #409eff;
          }

          .item-image {
            position: relative;
            width: 120px;
            height: 120px;
            flex-shrink: 0;
            border-radius: 6px;
            overflow: hidden;
            background: white;

            img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }

            .processing-overlay {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: rgba(0, 0, 0, 0.5);
              display: flex;
              align-items: center;
              justify-content: center;

              .el-icon {
                font-size: 32px;
                color: white;
              }
            }
          }

          .item-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 12px;

            .item-header {
              display: flex;
              justify-content: space-between;
              align-items: center;

              .item-name {
                font-weight: 600;
                font-size: 15px;
                color: #303133;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                max-width: 300px;
              }
            }

            .item-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px;
              font-size: 13px;

              .info-row {
                display: flex;
                gap: 8px;
                align-items: center;

                > span:first-child {
                  color: #909399;
                  min-width: 50px;
                }

                .text-muted {
                  color: #909399;
                  font-size: 12px;
                }
              }
            }

            .violations {
              margin-top: 8px;
              padding-top: 12px;
              border-top: 1px solid #e4e7ed;

              .violations-header {
                font-size: 13px;
                color: #606266;
                font-weight: 600;
                margin-bottom: 8px;
              }

              .violations-list {
                display: flex;
                flex-direction: column;
                gap: 6px;

                .violation-item {
                  display: flex;
                  align-items: center;
                  gap: 8px;

                  .confidence {
                    font-size: 12px;
                    color: #909399;
                  }
                }
              }
            }
          }
        }
      }
    }

    // 统计卡片
    .statistics-card {
      .statistics-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;

        :deep(.el-statistic) {
          .el-statistic__head {
            font-size: 13px;
            color: #909399;
            margin-bottom: 8px;
          }

          .el-statistic__content {
            font-size: 24px;
            font-weight: 600;
            color: #303133;
          }
        }
      }
    }

    // 监控卡片
    .monitor-card {
      :deep(.el-descriptions__body) {
        .el-descriptions__label {
          font-size: 13px;
        }

        .el-descriptions__content {
          font-size: 13px;
        }
      }
    }

    // 状态卡片
    .status-card {
      .el-alert {
        margin-bottom: 16px;
      }

      .status-info {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .status-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;

          > span:first-child {
            color: #606266;
            font-weight: 500;
          }

          .text-muted {
            color: #909399;
          }
        }
      }
    }
  }

  // 配置弹窗
  .config-section {
    margin-bottom: 20px;

    h4 {
      margin: 0 0 16px 0;
      font-size: 15px;
      color: #303133;
      font-weight: 600;
    }

    .config-item {
      margin-bottom: 24px;

      label {
        display: block;
        margin-bottom: 12px;
        font-size: 14px;
        color: #606266;
      }
    }
  }
}

// 滚动条样式
:deep(.result-list::-webkit-scrollbar) {
  width: 6px;
}

:deep(.result-list::-webkit-scrollbar-thumb) {
  background-color: #dcdfe6;
  border-radius: 3px;

  &:hover {
    background-color: #c0c4cc;
  }
}
</style>