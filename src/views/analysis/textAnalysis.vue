<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import type { UploadProps } from 'element-plus'

// 违规类型定义
interface ViolationType {
  id: string
  type: string
  level: 'high' | 'medium' | 'low' | 'normal'
  content: string
  position: { start: number; end: number }
  confidence: number
  reason: string
  suggestion: string
}

// 批量任务定义
interface BatchTask {
  id: string
  fileName: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  violationCount: number
  createdAt: string
}

// 检测配置
interface DetectionConfig {
  sensitivity: number
  enablePolitical: boolean
  enablePornographic: boolean
  enableViolence: boolean
  enableAbuse: boolean
  enableAdvertising: boolean
  modelType: string
}

// 响应式数据
const textContent = ref('')
const selectedViolation = ref<ViolationType | null>(null)
const detectionResult = ref<ViolationType[]>([])
const isDetecting = ref(false)
const showConfig = ref(false)
const showBatchPanel = ref(false)
const batchTasks = ref<BatchTask[]>([])

// 检测配置
const config = ref<DetectionConfig>({
  sensitivity: 70,
  enablePolitical: true,
  enablePornographic: true,
  enableViolence: true,
  enableAbuse: true,
  enableAdvertising: false,
  modelType: 'advanced'
})

// 计算属性
const textStats = computed(() => ({
  length: textContent.value.length,
  words: textContent.value.split(/\s+/).filter(w => w.length > 0).length,
  lines: textContent.value.split('\n').length,
  chinese: (textContent.value.match(/[\u4e00-\u9fa5]/g) || []).length
}))

const violationStats = computed(() => {
  const stats = {
    high: 0,
    medium: 0,
    low: 0,
    normal: 0,
    total: detectionResult.value.length
  }
  detectionResult.value.forEach(v => {
    stats[v.level]++
  })
  return stats
})

const highlightedText = computed(() => {
  if (!textContent.value || detectionResult.value.length === 0) {
    return textContent.value
  }

  // 按位置排序
  const sorted = [...detectionResult.value].sort((a, b) => a.position.start - b.position.start)
  let result = ''
  let lastIndex = 0

  sorted.forEach(violation => {
    // 添加正常文本
    result += escapeHtml(textContent.value.substring(lastIndex, violation.position.start))
    
    // 添加高亮文本
    const colorClass = getLevelColor(violation.level)
    result += `<span class="violation-highlight ${colorClass}" data-id="${violation.id}">${escapeHtml(violation.content)}</span>`
    
    lastIndex = violation.position.end
  })

  // 添加剩余文本
  result += escapeHtml(textContent.value.substring(lastIndex))
  
  return result
})

// 示例文本
const exampleTexts = [
  '这是一段正常的测试文本，用于演示文本分析功能。本系统可以检测文本中的敏感内容，包括政治敏感词、色情内容、暴力信息等。',
  '欢迎使用我们的产品！我们提供最优质的服务，立即购买享受8折优惠！联系电话：123-4567-8890。',
  '今天天气真好，适合出去散步。希望每个人都能保持良好的心态，享受美好的生活。'
]

// 方法
const escapeHtml = (text: string) => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>')
}

const getLevelColor = (level: string) => {
  const colors = {
    high: 'level-high',
    medium: 'level-medium',
    low: 'level-low',
    normal: 'level-normal'
  }
  return colors[level as keyof typeof colors] || 'level-normal'
}

const getLevelText = (level: string) => {
  const texts = {
    high: '高危',
    medium: '中危',
    low: '低危',
    normal: '正常'
  }
  return texts[level as keyof typeof texts] || '未知'
}

const getLevelType = (level: string) => {
  const types = {
    high: 'danger',
    medium: 'warning',
    low: 'info',
    normal: 'success'
  }
  return types[level as keyof typeof types] || 'info'
}

// 执行检测
const performDetection = async () => {
  if (!textContent.value.trim()) {
    ElMessage.warning('请输入要检测的文本内容')
    return
  }

  isDetecting.value = true
  detectionResult.value = []
  selectedViolation.value = null

  try {
    // 模拟异步检测
    await new Promise(resolve => setTimeout(resolve, 1500))

    // 生成模拟检测结果
    const mockResults: ViolationType[] = []

    // 检测敏感词
    const sensitiveWords = [
      { word: '敏感词', type: '政治敏感', level: 'high' as const, reason: '涉及政治敏感话题', suggestion: '请删除或替换该内容' },
      { word: '色情', type: '色情内容', level: 'high' as const, reason: '包含色情相关词汇', suggestion: '请删除不良内容' },
      { word: '暴力', type: '暴力信息', level: 'medium' as const, reason: '包含暴力相关描述', suggestion: '请修改相关表述' },
      { word: '优惠', type: '广告营销', level: 'low' as const, reason: '疑似广告推广内容', suggestion: '建议减少营销性质表述' },
      { word: '购买', type: '广告营销', level: 'low' as const, reason: '包含商业推广信息', suggestion: '建议减少商业推广' },
      { word: '电话', type: '个人信息', level: 'medium' as const, reason: '包含联系方式', suggestion: '注意保护个人隐私' }
    ]

    sensitiveWords.forEach((item, index) => {
      const position = textContent.value.toLowerCase().indexOf(item.word.toLowerCase())
      if (position !== -1 && shouldDetectType(item.type)) {
        mockResults.push({
          id: `violation-${Date.now()}-${index}`,
          type: item.type,
          level: item.level,
          content: textContent.value.substring(position, position + item.word.length),
          position: { start: position, end: position + item.word.length },
          confidence: Math.floor(Math.random() * 30 + 70 + config.value.sensitivity / 10),
          reason: item.reason,
          suggestion: item.suggestion
        })
      }
    })

    detectionResult.value = mockResults

    if (mockResults.length === 0) {
      ElNotification({
        title: '检测完成',
        message: '未发现违规内容',
        type: 'success',
        duration: 2000
      })
    } else {
      ElNotification({
        title: '检测完成',
        message: `发现 ${mockResults.length} 处潜在违规内容`,
        type: 'warning',
        duration: 3000
      })
    }
  } catch (error) {
    ElMessage.error('检测失败，请重试')
  } finally {
    isDetecting.value = false
  }
}

// 判断是否检测该类型
const shouldDetectType = (type: string) => {
  const typeMap: { [key: string]: boolean } = {
    '政治敏感': config.value.enablePolitical,
    '色情内容': config.value.enablePornographic,
    '暴力信息': config.value.enableViolence,
    '广告营销': config.value.enableAdvertising
  }
  return typeMap[type] !== false
}

// 清空文本
const clearText = () => {
  textContent.value = ''
  detectionResult.value = []
  selectedViolation.value = null
}

// 加载示例文本
const loadExample = (index: number) => {
  textContent.value = exampleTexts[index]
  ElMessage.success('已加载示例文本')
}

// 文件上传
const handleFileUpload: UploadProps['onChange'] = async (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    textContent.value = e.target?.result as string
    ElMessage.success('文件加载成功')
  }
  reader.onerror = () => {
    ElMessage.error('文件读取失败')
  }
  reader.readAsText(file.raw!)
}

// 点击高亮文本
const handleHighlightClick = (event: Event) => {
  const target = event.target as HTMLElement
  if (target.classList.contains('violation-highlight')) {
    const id = target.getAttribute('data-id')
    const violation = detectionResult.value.find(v => v.id === id)
    if (violation) {
      selectedViolation.value = violation
    }
  }
}

// 导出结果
const exportResults = () => {
  if (detectionResult.value.length === 0) {
    ElMessage.warning('暂无检测结果可导出')
    return
  }

  const report = {
    textLength: textStats.value.length,
    detectionTime: new Date().toLocaleString(),
    config: config.value,
    violations: detectionResult.value,
    summary: violationStats.value
  }

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `检测报告_${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)

  ElMessage.success('报告导出成功')
}

// 批量添加任务
const addBatchTask = () => {
  const task: BatchTask = {
    id: `task-${Date.now()}`,
    fileName: `文本文件_${batchTasks.value.length + 1}.txt`,
    status: 'pending',
    progress: 0,
    violationCount: 0,
    createdAt: new Date().toLocaleString()
  }
  batchTasks.value.push(task)
  
  // 模拟处理
  setTimeout(() => processBatchTask(task.id), 1000)
}

// 处理批量任务
const processBatchTask = async (taskId: string) => {
  const task = batchTasks.value.find(t => t.id === taskId)
  if (!task) return

  task.status = 'processing'

  // 模拟进度
  for (let i = 0; i <= 100; i += 10) {
    await new Promise(resolve => setTimeout(resolve, 300))
    task.progress = i
  }

  task.status = 'completed'
  task.violationCount = Math.floor(Math.random() * 10)
  
  ElNotification({
    title: '任务完成',
    message: `${task.fileName} 检测完成`,
    type: 'success'
  })
}

// 监听文本变化（可选：实时检测）
watch(textContent, () => {
  // 如果需要实时检测，可以添加防抖逻辑
  // 这里暂时不启用，避免频繁触发
})
</script>

<template>
  <div class="text-analysis-container">
    <!-- 页面标题 -->
    <el-card class="header-card" shadow="never">
      <div class="page-header">
        <div>
          <h2>文本内容分析</h2>
          <p class="page-description">基于自然语言处理技术，对文本内容进行深度解析和违规检测</p>
        </div>
        <div class="header-actions">
          <el-button @click="showConfig = !showConfig" :type="showConfig ? 'primary' : 'default'">
            <el-icon><Setting /></el-icon>
            检测配置
          </el-button>
          <el-button @click="showBatchPanel = !showBatchPanel" :type="showBatchPanel ? 'primary' : 'default'">
            <el-icon><FolderOpened /></el-icon>
            批量处理
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 主要内容区 -->
    <el-row :gutter="20" class="main-content">
      <!-- 左侧：文本输入和配置 -->
      <el-col :span="12">
        <!-- 文本输入区 -->
        <el-card shadow="hover" class="input-card">
          <template #header>
            <div class="card-header">
              <span>文本输入</span>
              <div class="header-actions">
                <el-upload
                  :show-file-list="false"
                  :on-change="handleFileUpload"
                  :auto-upload="false"
                  accept=".txt"
                >
                  <el-button size="small" plain>
                    <el-icon><UploadFilled /></el-icon>
                    上传文件
                  </el-button>
                </el-upload>
                <el-button size="small" plain @click="clearText">
                  <el-icon><Delete /></el-icon>
                  清空
                </el-button>
              </div>
            </div>
          </template>

          <el-input
            v-model="textContent"
            type="textarea"
            :rows="12"
            placeholder="请输入要检测的文本内容，支持中英文混合..."
            class="text-input"
          />

          <!-- 文本统计 -->
          <div class="text-stats">
            <el-tag size="small">字符数: {{ textStats.length }}</el-tag>
            <el-tag size="small" type="success">词数: {{ textStats.words }}</el-tag>
            <el-tag size="small" type="warning">行数: {{ textStats.lines }}</el-tag>
            <el-tag size="small" type="info">中文: {{ textStats.chinese }}</el-tag>
          </div>

          <!-- 示例文本 -->
          <div class="example-section">
            <span class="example-label">快速示例：</span>
            <el-button
              v-for="(text, index) in exampleTexts"
              :key="index"
              size="small"
              text
              @click="loadExample(index)"
            >
              示例{{ index + 1 }}
            </el-button>
          </div>

          <!-- 检测按钮 -->
          <el-button
            type="primary"
            size="large"
            :loading="isDetecting"
            @click="performDetection"
            class="detect-button"
            block
          >
            <el-icon v-if="!isDetecting"><Search /></el-icon>
            {{ isDetecting ? '检测中...' : '开始检测' }}
          </el-button>
        </el-card>

        <!-- 检测配置 -->
        <el-card v-if="showConfig" shadow="hover" class="config-card">
          <template #header>
            <span>检测配置</span>
          </template>

          <div class="config-content">
            <div class="config-item">
              <label>检测敏感度</label>
              <el-slider v-model="config.sensitivity" :min="0" :max="100" show-input />
            </div>

            <div class="config-item">
              <label>检测范围</label>
              <div class="checkbox-group">
                <el-checkbox v-model="config.enablePolitical">政治敏感</el-checkbox>
                <el-checkbox v-model="config.enablePornographic">色情内容</el-checkbox>
                <el-checkbox v-model="config.enableViolence">暴力信息</el-checkbox>
                <el-checkbox v-model="config.enableAbuse">辱骂内容</el-checkbox>
                <el-checkbox v-model="config.enableAdvertising">广告营销</el-checkbox>
              </div>
            </div>

            <div class="config-item">
              <label>检测模型</label>
              <el-radio-group v-model="config.modelType">
                <el-radio label="basic">基础模型</el-radio>
                <el-radio label="advanced">高级模型</el-radio>
                <el-radio label="custom">自定义模型</el-radio>
              </el-radio-group>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：检测结果展示 -->
      <el-col :span="12">
        <!-- 统计概览 -->
        <el-card shadow="hover" class="stats-card">
          <template #header>
            <div class="card-header">
              <span>检测结果概览</span>
              <el-button v-if="detectionResult.length > 0" size="small" @click="exportResults">
                <el-icon><Download /></el-icon>
                导出报告
              </el-button>
            </div>
          </template>

          <el-row :gutter="12">
            <el-col :span="6">
              <div class="stat-item stat-total">
                <div class="stat-value">{{ violationStats.total }}</div>
                <div class="stat-label">总计</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item stat-high">
                <div class="stat-value">{{ violationStats.high }}</div>
                <div class="stat-label">高危</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item stat-medium">
                <div class="stat-value">{{ violationStats.medium }}</div>
                <div class="stat-label">中危</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item stat-low">
                <div class="stat-value">{{ violationStats.low }}</div>
                <div class="stat-label">低危</div>
              </div>
            </el-col>
          </el-row>
        </el-card>

        <!-- 高亮显示区 -->
        <el-card shadow="hover" class="highlight-card">
          <template #header>
            <span>文本高亮显示</span>
          </template>

          <div
            v-if="textContent"
            class="highlight-content"
            v-html="highlightedText"
            @click="handleHighlightClick"
          ></div>
          <el-empty v-else description="暂无文本内容" :image-size="100" />
        </el-card>

        <!-- 违规详情 -->
        <el-card v-if="selectedViolation" shadow="hover" class="detail-card">
          <template #header>
            <div class="card-header">
              <span>违规详情</span>
              <el-button size="small" text @click="selectedViolation = null">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
          </template>

          <el-descriptions :column="1" border>
            <el-descriptions-item label="违规内容">
              <el-tag :type="getLevelType(selectedViolation.level)" size="large">
                {{ selectedViolation.content }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="违规类型">
              {{ selectedViolation.type }}
            </el-descriptions-item>
            <el-descriptions-item label="危险级别">
              <el-tag :type="getLevelType(selectedViolation.level)">
                {{ getLevelText(selectedViolation.level) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="置信度">
              <el-progress
                :percentage="selectedViolation.confidence"
                :color="selectedViolation.confidence > 80 ? '#f56c6c' : '#e6a23c'"
              />
            </el-descriptions-item>
            <el-descriptions-item label="位置信息">
              第 {{ selectedViolation.position.start }} - {{ selectedViolation.position.end }} 字符
            </el-descriptions-item>
            <el-descriptions-item label="违规原因">
              {{ selectedViolation.reason }}
            </el-descriptions-item>
            <el-descriptions-item label="整改建议">
              <el-alert :title="selectedViolation.suggestion" type="warning" :closable="false" />
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 违规列表 -->
        <el-card v-if="detectionResult.length > 0" shadow="hover" class="list-card">
          <template #header>
            <span>违规列表 ({{ detectionResult.length }})</span>
          </template>

          <div class="violation-list">
            <div
              v-for="item in detectionResult"
              :key="item.id"
              class="violation-item"
              :class="{ active: selectedViolation?.id === item.id }"
              @click="selectedViolation = item"
            >
              <div class="violation-header">
                <el-tag :type="getLevelType(item.level)" size="small">
                  {{ getLevelText(item.level) }}
                </el-tag>
                <span class="violation-type">{{ item.type }}</span>
                <span class="violation-confidence">{{ item.confidence }}%</span>
              </div>
              <div class="violation-content">{{ item.content }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 批量处理面板 -->
    <el-card v-if="showBatchPanel" shadow="hover" class="batch-card">
      <template #header>
        <div class="card-header">
          <span>批量处理任务</span>
          <el-button size="small" type="primary" @click="addBatchTask">
            <el-icon><Plus /></el-icon>
            添加任务
          </el-button>
        </div>
      </template>

      <el-table :data="batchTasks" style="width: 100%">
        <el-table-column prop="fileName" label="文件名" width="200" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'pending'" type="info">等待中</el-tag>
            <el-tag v-else-if="row.status === 'processing'" type="warning">处理中</el-tag>
            <el-tag v-else-if="row.status === 'completed'" type="success">已完成</el-tag>
            <el-tag v-else type="danger">失败</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="进度" width="200">
          <template #default="{ row }">
            <el-progress :percentage="row.progress" :status="row.status === 'completed' ? 'success' : undefined" />
          </template>
        </el-table-column>
        <el-table-column prop="violationCount" label="违规数量" width="100" />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" text v-if="row.status === 'completed'">查看详情</el-button>
            <el-button size="small" text type="primary" v-if="row.status === 'completed'">导出</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="batchTasks.length === 0" description="暂无批量任务" :image-size="120" />
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.text-analysis-container {

  .header-card {
    margin-bottom: 20px;
    border-radius: 8px;

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h2 {
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 600;
        color: #303133;
      }

      .page-description {
        margin: 0;
        color: #909399;
        font-size: 14px;
      }

      .header-actions {
        display: flex;
        gap: 12px;
      }
    }
  }

  .main-content {
    margin-bottom: 20px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;

    .header-actions {
      display: flex;
      gap: 8px;
    }
  }

  // 输入卡片
  .input-card {
    margin-bottom: 20px;
    border-radius: 8px;

    .text-input {
      margin-bottom: 16px;

      :deep(textarea) {
        font-size: 14px;
        line-height: 1.6;
      }
    }

    .text-stats {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
      padding: 12px;
      background: #f5f7fa;
      border-radius: 6px;
    }

    .example-section {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      padding: 8px 0;

      .example-label {
        color: #606266;
        font-size: 14px;
      }
    }

    .detect-button {
      height: 48px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 6px;
    }
  }

  // 配置卡片
  .config-card {
    border-radius: 8px;

    .config-content {
      .config-item {
        margin-bottom: 24px;

        &:last-child {
          margin-bottom: 0;
        }

        label {
          display: block;
          margin-bottom: 12px;
          color: #606266;
          font-weight: 600;
          font-size: 14px;
        }

        .checkbox-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
      }
    }
  }

  // 统计卡片
  .stats-card {
    margin-bottom: 20px;
    border-radius: 8px;

    .stat-item {
      padding: 20px;
      text-align: center;
      border-radius: 8px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;

      .stat-value {
        font-size: 32px;
        font-weight: bold;
        margin-bottom: 8px;
      }

      .stat-label {
        font-size: 14px;
        opacity: 0.9;
      }

      &.stat-total {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      &.stat-high {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      }

      &.stat-medium {
        background: linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%);
      }

      &.stat-low {
        background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
      }
    }
  }

  // 高亮卡片
  .highlight-card {
    margin-bottom: 20px;
    border-radius: 8px;

    .highlight-content {
      padding: 16px;
      background: #fafafa;
      border-radius: 6px;
      min-height: 200px;
      max-height: 400px;
      overflow-y: auto;
      line-height: 1.8;
      font-size: 14px;
      white-space: pre-wrap;
      word-break: break-word;

      :deep(.violation-highlight) {
        padding: 2px 4px;
        border-radius: 3px;
        cursor: pointer;
        transition: all 0.3s;
        font-weight: 600;

        &:hover {
          transform: scale(1.05);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        &.level-high {
          background: #fef0f0;
          color: #f56c6c;
          border-bottom: 2px solid #f56c6c;
        }

        &.level-medium {
          background: #fdf6ec;
          color: #e6a23c;
          border-bottom: 2px solid #e6a23c;
        }

        &.level-low {
          background: #fef9e6;
          color: #f1c40f;
          border-bottom: 2px solid #f1c40f;
        }

        &.level-normal {
          background: #f0f9ff;
          color: #409eff;
          border-bottom: 2px solid #409eff;
        }
      }
    }
  }

  // 详情卡片
  .detail-card {
    margin-bottom: 20px;
    border-radius: 8px;
    border: 2px solid #409eff;
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
  }

  // 列表卡片
  .list-card {
    border-radius: 8px;

    .violation-list {
      max-height: 400px;
      overflow-y: auto;

      .violation-item {
        padding: 12px;
        margin-bottom: 8px;
        background: #f5f7fa;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s;
        border: 2px solid transparent;

        &:hover {
          background: #ecf5ff;
          transform: translateX(4px);
        }

        &.active {
          background: #ecf5ff;
          border-color: #409eff;
        }

        .violation-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;

          .violation-type {
            flex: 1;
            font-weight: 600;
            color: #303133;
          }

          .violation-confidence {
            color: #909399;
            font-size: 12px;
          }
        }

        .violation-content {
          color: #606266;
          font-size: 13px;
          padding: 8px;
          background: white;
          border-radius: 4px;
        }
      }
    }
  }

  // 批量处理卡片
  .batch-card {
    border-radius: 8px;
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .main-content {
    :deep(.el-col) {
      width: 100%;
      max-width: 100%;
    }
  }
}
</style>