<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'

// 类型定义
interface MonitorCamera {
  id: string
  name: string
  location: string
  status: 'online' | 'offline'
  videoUrl: string
}

interface SafetyEquipment {
  helmet: boolean
  reflectiveVest: boolean
  safetyShoes: boolean
}

interface PersonDetection {
  id: string
  cameraId: string
  personId: string
  personName: string
  equipment: SafetyEquipment
  confidence: number
  violations: string[]
  position: { x: number; y: number; width: number; height: number }
  timestamp: string
  complianceStatus: 'compliant' | 'minor' | 'severe'
}

interface OperationCheck {
  id: string
  cameraId: string
  operationType: string
  isCompliant: boolean
  score: number
  issues: string[]
  timestamp: string
}

interface ViolationRecord {
  id: string
  time: string
  personName: string
  personId: string
  violationType: string
  location: string
  status: 'pending' | 'processing' | 'completed'
  handler?: string
  result?: string
}

interface DetectionRule {
  helmetRequired: boolean
  reflectiveVestRequired: boolean
  safeShoesRequired: boolean
  operationCheckEnabled: boolean
  confidenceThreshold: number
  alertThreshold: number
}

interface Statistics {
  todayChecks: number
  todayViolations: number
  complianceRate: number
  commonViolation: string
}

// 响应式数据
const loading = ref(false)
const cameras = ref<MonitorCamera[]>([])
const activeCamera = ref<string>('')
const currentDetections = ref<PersonDetection[]>([])
const operationChecks = ref<OperationCheck[]>([])
const violationRecords = ref<ViolationRecord[]>([])
const statistics = ref<Statistics>({
  todayChecks: 0,
  todayViolations: 0,
  complianceRate: 0,
  commonViolation: ''
})

const detectionRule = ref<DetectionRule>({
  helmetRequired: true,
  reflectiveVestRequired: true,
  safeShoesRequired: true,
  operationCheckEnabled: true,
  confidenceThreshold: 85,
  alertThreshold: 75
})

// 查询条件
const queryForm = ref({
  dateRange: [] as string[],
  violationType: ''
})

const violationTypes = [
  { label: '未佩戴安全帽', value: 'no_helmet' },
  { label: '未穿反光服', value: 'no_reflective_vest' },
  { label: '未穿安全鞋', value: 'no_safety_shoes' },
  { label: '违规操作', value: 'violation_operation' },
  { label: '多项违规', value: 'multiple_violations' }
]

let simulationTimer: number | null = null

// Mock 数据生成
const generateMockCameras = (): MonitorCamera[] => {
  return [
    {
      id: 'cam_001',
      name: '1号监控',
      location: 'A区-作业区域',
      status: 'online',
      videoUrl: '/mock/video1.mp4'
    },
    {
      id: 'cam_002',
      name: '2号监控',
      location: 'B区-装卸平台',
      status: 'online',
      videoUrl: '/mock/video2.mp4'
    },
    {
      id: 'cam_003',
      name: '3号监控',
      location: 'C区-仓储区域',
      status: 'online',
      videoUrl: '/mock/video3.mp4'
    },
    {
      id: 'cam_004',
      name: '4号监控',
      location: 'D区-通道区域',
      status: 'offline',
      videoUrl: '/mock/video4.mp4'
    }
  ]
}

const generateMockRecords = (): ViolationRecord[] => {
  const types = ['未佩戴安全帽', '未穿反光服', '未穿安全鞋', '违规操作', '多项违规']
  const statuses: ('pending' | 'processing' | 'completed')[] = ['pending', 'processing', 'completed']
  const locations = ['A区-作业区域', 'B区-装卸平台', 'C区-仓储区域', 'D区-通道区域']
  const persons = [
    { id: 'P001', name: '张三' },
    { id: 'P002', name: '李四' },
    { id: 'P003', name: '王五' },
    { id: 'P004', name: '赵六' },
    { id: 'P005', name: '孙七' }
  ]
  const handlers = ['管理员A', '管理员B', '管理员C']

  return Array.from({ length: 50 }, (_, i) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const person = persons[Math.floor(Math.random() * persons.length)]
    return {
      id: `SR${String(1000 + i).padStart(4, '0')}`,
      time: new Date(Date.now() - Math.random() * 7 * 24 * 3600000).toLocaleString('zh-CN'),
      personName: person.name,
      personId: person.id,
      violationType: types[Math.floor(Math.random() * types.length)],
      location: locations[Math.floor(Math.random() * locations.length)],
      status,
      handler: status !== 'pending' ? handlers[Math.floor(Math.random() * handlers.length)] : undefined,
      result: status === 'completed' ? '已完成安全教育并签署整改承诺书' : undefined
    }
  }).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
}

const generateMockStatistics = (): Statistics => {
  const checks = Math.floor(Math.random() * 200 + 100)
  const violations = Math.floor(Math.random() * 30 + 5)
  return {
    todayChecks: checks,
    todayViolations: violations,
    complianceRate: parseFloat(((checks - violations) / checks * 100).toFixed(1)),
    commonViolation: '未佩戴安全帽'
  }
}

// 模拟实时安全检测
const simulateSafetyDetection = () => {
  // 随机生成人员检测
  if (Math.random() > 0.6 && currentDetections.value.length < 4) {
    const persons = ['张三', '李四', '王五', '赵六', '孙七', '周八']
    const personName = persons[Math.floor(Math.random() * persons.length)]
    
    // 随机生成装备佩戴情况
    const helmet = Math.random() > 0.3
    const reflectiveVest = Math.random() > 0.25
    const safetyShoes = Math.random() > 0.2
    
    const violations: string[] = []
    if (!helmet && detectionRule.value.helmetRequired) violations.push('未佩戴安全帽')
    if (!reflectiveVest && detectionRule.value.reflectiveVestRequired) violations.push('未穿反光服')
    if (!safetyShoes && detectionRule.value.safeShoesRequired) violations.push('未穿安全鞋')
    
    let complianceStatus: 'compliant' | 'minor' | 'severe' = 'compliant'
    if (violations.length === 1) complianceStatus = 'minor'
    if (violations.length >= 2) complianceStatus = 'severe'
    
    const detection: PersonDetection = {
      id: `det_${Date.now()}`,
      cameraId: activeCamera.value || cameras.value[0]?.id,
      personId: `P${String(Math.floor(Math.random() * 100)).padStart(3, '0')}`,
      personName,
      equipment: {
        helmet,
        reflectiveVest,
        safetyShoes
      },
      confidence: Math.random() * 0.15 + 0.85, // 85%-100%
      violations,
      position: {
        x: Math.random() * 50 + 10,
        y: Math.random() * 50 + 10,
        width: Math.random() * 10 + 12,
        height: Math.random() * 15 + 18
      },
      timestamp: new Date().toLocaleString('zh-CN'),
      complianceStatus
    }

    currentDetections.value.push(detection)

    // 如果有违规，添加到违规记录
    if (violations.length > 0) {
      const newRecord: ViolationRecord = {
        id: `SR${String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0')}`,
        time: new Date().toLocaleString('zh-CN'),
        personName,
        personId: detection.personId,
        violationType: violations.length > 1 ? '多项违规' : violations[0],
        location: cameras.value.find(c => c.id === detection.cameraId)?.location || '未知位置',
        status: 'pending'
      }
      violationRecords.value.unshift(newRecord)
      statistics.value.todayViolations++
    }

    // 7秒后移除检测标注
    setTimeout(() => {
      currentDetections.value = currentDetections.value.filter(d => d.id !== detection.id)
    }, 7000)
  }

  // 模拟操作规范检查
  if (Math.random() > 0.8 && operationChecks.value.length < 3) {
    const operations = ['搬运作业', '叉车操作', '高空作业', '设备维护', '货物装卸']
    const operationType = operations[Math.floor(Math.random() * operations.length)]
    const score = Math.floor(Math.random() * 40 + 60) // 60-100分
    const isCompliant = score >= 80
    
    const issues: string[] = []
    if (!isCompliant) {
      const possibleIssues = ['操作姿势不规范', '未遵循操作流程', '动作过快存在风险', '未确认安全环境']
      issues.push(possibleIssues[Math.floor(Math.random() * possibleIssues.length)])
    }

    const check: OperationCheck = {
      id: `op_${Date.now()}`,
      cameraId: activeCamera.value || cameras.value[0]?.id,
      operationType,
      isCompliant,
      score,
      issues,
      timestamp: new Date().toLocaleString('zh-CN')
    }

    operationChecks.value.unshift(check)
    
    if (operationChecks.value.length > 5) {
      operationChecks.value = operationChecks.value.slice(0, 5)
    }

    // 5秒后移除
    setTimeout(() => {
      operationChecks.value = operationChecks.value.filter(c => c.id !== check.id)
    }, 5000)
  }
}

// 加载数据
const loadData = () => {
  loading.value = true
  setTimeout(() => {
    cameras.value = generateMockCameras()
    activeCamera.value = cameras.value[0]?.id
    violationRecords.value = generateMockRecords()
    statistics.value = generateMockStatistics()
    loading.value = false
  }, 800)
}

// 切换摄像头
const switchCamera = (cameraId: string) => {
  activeCamera.value = cameraId
  currentDetections.value = []
  operationChecks.value = []
  ElMessage.success('已切换监控画面')
}

// 处理违规记录
const handleRecord = (record: ViolationRecord) => {
  record.status = 'processing'
  ElMessage.success('记录已标记为处理中')
  
  setTimeout(() => {
    record.status = 'completed'
    record.handler = '当前管理员'
    record.result = '已完成安全教育并签署整改承诺书'
    ElMessage.success('记录处理完成')
  }, 2000)
}

// 查看详情
const viewDetail = (record: ViolationRecord) => {
  ElMessage.info(`查看违规详情：${record.id}`)
}

// 查询记录
const queryRecords = () => {
  loading.value = true
  setTimeout(() => {
    violationRecords.value = generateMockRecords()
    loading.value = false
    ElMessage.success('查询完成')
  }, 500)
}

// 重置查询
const resetQuery = () => {
  queryForm.value = {
    dateRange: [],
    violationType: ''
  }
  queryRecords()
}

// 导出记录
const exportRecords = () => {
  ElMessage.success('导出功能开发中...')
}

// 保存规则配置
const saveRule = () => {
  ElMessage.success('检测规则已保存')
}

// 测试检测规则
const testRule = () => {
  ElMessage.info('正在测试检测规则...')
  setTimeout(() => {
    ElMessage.success('检测规则测试通过，识别准确率：95.6%')
  }, 1500)
}

// 优化模型
const optimizeModel = () => {
  ElMessage.info('正在优化检测模型...')
  setTimeout(() => {
    ElMessage.success('模型优化完成，识别速度提升 15%')
  }, 2000)
}

// 获取合规状态颜色
const getComplianceColor = (status: string) => {
  const colors = {
    compliant: '#67c23a',
    minor: '#e6a23c',
    severe: '#f56c6c'
  }
  return colors[status as keyof typeof colors] || '#909399'
}

// 获取合规状态标签
const getComplianceLabel = (status: string) => {
  const labels = {
    compliant: '合规',
    minor: '轻微违规',
    severe: '严重违规'
  }
  return labels[status as keyof typeof labels] || '未知'
}

// 获取违规类型颜色
const getViolationTypeColor = (type: string) => {
  if (type.includes('安全帽')) return 'danger'
  if (type.includes('反光服')) return 'warning'
  if (type.includes('违规操作')) return ''
  return 'info'
}

// 获取状态类型
const getStatusType = (status: string) => {
  const types = {
    pending: 'danger',
    processing: 'primary',
    completed: 'success'
  }
  return types[status as keyof typeof types] || 'info'
}

// 获取状态标签
const getStatusLabel = (status: string) => {
  const labels = {
    pending: '待处理',
    processing: '处理中',
    completed: '已处理'
  }
  return labels[status as keyof typeof labels] || '未知'
}

// 生命周期
onMounted(() => {
  loadData()
  // 启动模拟检测
  simulationTimer = window.setInterval(() => {
    simulateSafetyDetection()
  }, 3000)
})

onUnmounted(() => {
  if (simulationTimer) {
    clearInterval(simulationTimer)
  }
})
</script>

<template>
  <div class="safety-check-container">
    <!-- 顶部统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-label">今日检测人次</div>
            <div class="stat-value">{{ statistics.todayChecks }}</div>
            <div class="stat-sub">次</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-label">检测到违规</div>
            <div class="stat-value" style="color: #f56c6c">{{ statistics.todayViolations }}</div>
            <div class="stat-sub">次</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-label">合规率</div>
            <div class="stat-value" :style="{ color: statistics.complianceRate >= 95 ? '#67c23a' : '#e6a23c' }">
              {{ statistics.complianceRate }}%
            </div>
            <div class="stat-sub">今日</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-label">常见违规</div>
            <div class="stat-value" style="font-size: 18px">{{ statistics.commonViolation }}</div>
            <div class="stat-sub">高频项</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 主要内容区域 -->
    <el-row :gutter="16" class="main-content">
      <!-- 左侧：监控画面区 -->
      <el-col :span="10">
        <el-card shadow="hover" class="monitor-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">实时监控画面</span>
              <el-tag type="success" size="small">
                <span class="status-dot"></span>
                智能识别中
              </el-tag>
            </div>
          </template>

          <!-- 摄像头切换 -->
          <div class="camera-tabs">
            <el-button
              v-for="camera in cameras"
              :key="camera.id"
              :type="activeCamera === camera.id ? 'primary' : 'default'"
              size="small"
              @click="switchCamera(camera.id)"
              :disabled="camera.status === 'offline'"
            >
              {{ camera.name }}
              <el-tag
                :type="camera.status === 'online' ? 'success' : 'danger'"
                size="small"
                style="margin-left: 8px"
              >
                {{ camera.status === 'online' ? '在线' : '离线' }}
              </el-tag>
            </el-button>
          </div>

          <!-- 视频监控画面 -->
          <div class="video-container">
            <div class="video-placeholder">
              <div class="video-info">
                <div class="location-info">
                  <i class="el-icon-location"></i>
                  {{ cameras.find(c => c.id === activeCamera)?.location }}
                </div>
                <div class="time-info">
                  {{ new Date().toLocaleString('zh-CN') }}
                </div>
              </div>
              <!-- 模拟视频画面 -->
              <div class="video-scene"></div>
              <!-- 人员安全装备检测标注 -->
              <div
                v-for="detection in currentDetections.filter(d => d.cameraId === activeCamera)"
                :key="detection.id"
                class="detection-box"
                :style="{
                  left: detection.position.x + '%',
                  top: detection.position.y + '%',
                  width: detection.position.width + '%',
                  height: detection.position.height + '%',
                  borderColor: getComplianceColor(detection.complianceStatus)
                }"
              >
                <div class="detection-label" :style="{ backgroundColor: getComplianceColor(detection.complianceStatus) }">
                  {{ detection.personName }} - {{ getComplianceLabel(detection.complianceStatus) }}
                </div>
                <div class="equipment-status">
                  <span :class="{ 'equipment-ok': detection.equipment.helmet, 'equipment-ng': !detection.equipment.helmet }">
                    帽
                  </span>
                  <span :class="{ 'equipment-ok': detection.equipment.reflectiveVest, 'equipment-ng': !detection.equipment.reflectiveVest }">
                    服
                  </span>
                  <span :class="{ 'equipment-ok': detection.equipment.safetyShoes, 'equipment-ng': !detection.equipment.safetyShoes }">
                    鞋
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 实时违规提示 -->
          <div v-if="currentDetections.filter(d => d.violations.length > 0).length > 0" class="violation-alerts">
            <el-alert
              v-for="detection in currentDetections.filter(d => d.violations.length > 0)"
              :key="detection.id"
              :type="detection.complianceStatus === 'severe' ? 'error' : 'warning'"
              :title="`${detection.personName}（${detection.personId}）存在安全隐患`"
              :description="`违规项：${detection.violations.join('、')} | 置信度：${(detection.confidence * 100).toFixed(1)}%`"
              show-icon
              style="margin-top: 10px"
            />
          </div>
        </el-card>
      </el-col>

      <!-- 中间：实时检测结果 -->
      <el-col :span="8">
        <el-card shadow="hover" class="detection-result-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">实时检测结果</span>
              <el-tag type="info" size="small">{{ currentDetections.length }} 人在岗</el-tag>
            </div>
          </template>

          <!-- 装备检测列表 -->
          <div class="detection-list">
            <div class="detection-section">
              <div class="section-title">安全装备检测</div>
              <div
                v-for="detection in currentDetections"
                :key="detection.id"
                class="detection-item"
                :class="{ 'has-violation': detection.violations.length > 0 }"
              >
                <div class="detection-item-header">
                  <div class="person-info">
                    <div class="person-name">{{ detection.personName }}</div>
                    <div class="person-id">{{ detection.personId }}</div>
                  </div>
                  <el-tag
                    :type="detection.complianceStatus === 'compliant' ? 'success' : detection.complianceStatus === 'minor' ? 'warning' : 'danger'"
                    size="small"
                  >
                    {{ getComplianceLabel(detection.complianceStatus) }}
                  </el-tag>
                </div>
                <div class="equipment-checks">
                  <div class="equipment-check-item">
                    <i :class="detection.equipment.helmet ? 'el-icon-success' : 'el-icon-error'" 
                       :style="{ color: detection.equipment.helmet ? '#67c23a' : '#f56c6c' }"></i>
                    <span>安全帽</span>
                  </div>
                  <div class="equipment-check-item">
                    <i :class="detection.equipment.reflectiveVest ? 'el-icon-success' : 'el-icon-error'"
                       :style="{ color: detection.equipment.reflectiveVest ? '#67c23a' : '#f56c6c' }"></i>
                    <span>反光服</span>
                  </div>
                  <div class="equipment-check-item">
                    <i :class="detection.equipment.safetyShoes ? 'el-icon-success' : 'el-icon-error'"
                       :style="{ color: detection.equipment.safetyShoes ? '#67c23a' : '#f56c6c' }"></i>
                    <span>安全鞋</span>
                  </div>
                </div>
                <div class="detection-confidence">
                  置信度：{{ (detection.confidence * 100).toFixed(1) }}%
                </div>
              </div>
              <div v-if="currentDetections.length === 0" class="no-data">
                暂无检测数据
              </div>
            </div>

            <!-- 操作规范检查 -->
            <div class="detection-section" style="margin-top: 20px">
              <div class="section-title">操作规范评分</div>
              <div
                v-for="check in operationChecks"
                :key="check.id"
                class="operation-check-item"
              >
                <div class="operation-header">
                  <span class="operation-type">{{ check.operationType }}</span>
                  <el-tag :type="check.isCompliant ? 'success' : 'warning'" size="small">
                    {{ check.isCompliant ? '规范' : '待改进' }}
                  </el-tag>
                </div>
                <el-progress
                  :percentage="check.score"
                  :color="check.score >= 80 ? '#67c23a' : '#e6a23c'"
                  :stroke-width="12"
                />
                <div v-if="check.issues.length > 0" class="operation-issues">
                  问题：{{ check.issues.join('、') }}
                </div>
              </div>
              <div v-if="operationChecks.length === 0" class="no-data">
                暂无操作检测
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：配置和统计面板 -->
      <el-col :span="6">
        <el-card shadow="hover" class="config-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">检测规则配置</span>
              <el-button type="primary" size="small" @click="saveRule">保存</el-button>
            </div>
          </template>

          <div class="config-content">
            <div class="config-item">
              <div class="config-label">安全装备要求</div>
              <div class="config-switches">
                <div class="switch-item">
                  <el-switch v-model="detectionRule.helmetRequired" size="small" />
                  <span>安全帽</span>
                </div>
                <div class="switch-item">
                  <el-switch v-model="detectionRule.reflectiveVestRequired" size="small" />
                  <span>反光服</span>
                </div>
                <div class="switch-item">
                  <el-switch v-model="detectionRule.safeShoesRequired" size="small" />
                  <span>安全鞋</span>
                </div>
              </div>
            </div>

            <div class="config-item">
              <div class="config-label">操作规范检查</div>
              <el-switch v-model="detectionRule.operationCheckEnabled" />
            </div>

            <div class="config-item">
              <div class="config-label">识别置信度阈值</div>
              <el-slider v-model="detectionRule.confidenceThreshold" :min="50" :max="100" show-input />
            </div>

            <div class="config-item">
              <div class="config-label">预警阈值</div>
              <el-slider v-model="detectionRule.alertThreshold" :min="50" :max="100" show-input />
            </div>

            <div class="config-actions">
              <el-button type="info" size="small" style="width: 100%; margin-bottom: 8px" @click="testRule">
                测试规则
              </el-button>
              <el-button type="warning" size="small" style="width: 100%" @click="optimizeModel">
                优化模型
              </el-button>
            </div>
          </div>
        </el-card>

        <!-- 今日统计 -->
        <el-card shadow="hover" class="stats-detail-card" style="margin-top: 16px">
          <template #header>
            <span class="card-title">今日统计分析</span>
          </template>
          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item label="总检测人次">
              <el-tag type="info">{{ statistics.todayChecks }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="违规人次">
              <el-tag type="danger">{{ statistics.todayViolations }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="合规率">
              <el-tag :type="statistics.complianceRate >= 95 ? 'success' : 'warning'">
                {{ statistics.complianceRate }}%
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="常见违规">
              <el-tag type="warning">{{ statistics.commonViolation }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <!-- 违规记录管理 -->
    <el-card shadow="hover" class="record-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">安全违规记录</span>
          <el-button type="primary" size="small" @click="exportRecords">
            导出记录
          </el-button>
        </div>
      </template>

      <!-- 查询表单 -->
      <el-form :model="queryForm" inline class="query-form">
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="queryForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            size="default"
          />
        </el-form-item>
        <el-form-item label="违规类型">
          <el-select v-model="queryForm.violationType" placeholder="请选择" clearable size="default">
            <el-option
              v-for="type in violationTypes"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="queryRecords">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 记录表格 -->
      <el-table :data="violationRecords" v-loading="loading" stripe border style="width: 100%">
        <el-table-column prop="id" label="记录编号" width="120" />
        <el-table-column prop="time" label="违规时间" width="180" />
        <el-table-column prop="personName" label="违规人员" width="100" />
        <el-table-column prop="personId" label="工号" width="100" />
        <el-table-column prop="violationType" label="违规类型" width="140">
          <template #default="{ row }">
            <el-tag :type="getViolationTypeColor(row.violationType)">{{ row.violationType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="违规位置" width="150" />
        <el-table-column prop="status" label="处理状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="handler" label="处理人" width="120" />
        <el-table-column prop="result" label="处理结果" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewDetail(row)">
              详情
            </el-button>
            <el-button
              v-if="row.status === 'pending'"
              type="success"
              size="small"
              @click="handleRecord(row)"
            >
              处理
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.safety-check-container {

  .stats-row {
    margin-bottom: 16px;
  }

  .stat-card {
    .stat-content {
      text-align: center;
      
      .stat-label {
        font-size: 14px;
        color: #909399;
        margin-bottom: 8px;
      }
      
      .stat-value {
        font-size: 32px;
        font-weight: bold;
        color: #409eff;
        margin-bottom: 4px;
      }
      
      .stat-sub {
        font-size: 12px;
        color: #c0c4cc;
      }
    }
  }

  .main-content {
    margin-bottom: 16px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .card-title {
      font-size: 16px;
      font-weight: bold;
      color: #303133;
    }
  }

  .status-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #67c23a;
    margin-right: 4px;
    animation: blink 1.5s infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  .monitor-card {
    
    .camera-tabs {
      margin-bottom: 16px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    
    .video-container {
      .video-placeholder {
        position: relative;
        width: 100%;
        height: 450px;
        background-image: url('https://img0.baidu.com/it/u=737798848,977458325&fm=253&fmt=auto&app=138&f=JPEG?w=333&h=500');
        border-radius: 8px;
        overflow: hidden;
        
        .video-info {
          position: absolute;
          top: 12px;
          left: 12px;
          right: 12px;
          display: flex;
          justify-content: space-between;
          z-index: 10;
          
          .location-info,
          .time-info {
            background: rgba(0, 0, 0, 0.6);
            padding: 6px 12px;
            border-radius: 4px;
            color: #fff;
            font-size: 12px;
          }
        }
        

        .detection-box {
          position: absolute;
          border: 3px solid;
          border-radius: 6px;
          animation: pulse 1.2s infinite;
          z-index: 5;
          
          .detection-label {
            position: absolute;
            top: -28px;
            left: 0;
            padding: 4px 10px;
            color: #fff;
            font-size: 12px;
            border-radius: 4px;
            white-space: nowrap;
            font-weight: 500;
          }

          .equipment-status {
            position: absolute;
            bottom: -24px;
            left: 0;
            display: flex;
            gap: 4px;

            span {
              display: inline-block;
              width: 20px;
              height: 20px;
              line-height: 20px;
              text-align: center;
              font-size: 11px;
              font-weight: bold;
              border-radius: 3px;
              color: #fff;

              &.equipment-ok {
                background-color: #67c23a;
              }

              &.equipment-ng {
                background-color: #f56c6c;
              }
            }
          }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.02); }
        }
      }
    }
    
    .violation-alerts {
      margin-top: 16px;
    }
  }

  .detection-result-card {
    
    .detection-list {
      max-height: 620px;
      overflow-y: auto;

      .detection-section {
        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e4e7ed;
        }

        .detection-item {
          padding: 12px;
          margin-bottom: 12px;
          border: 1px solid #e4e7ed;
          border-radius: 8px;
          background: #fff;
          transition: all 0.3s;

          &:hover {
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
          }

          &.has-violation {
            border-color: #f56c6c;
            background: #fef0f0;
          }

          .detection-item-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;

            .person-info {
              .person-name {
                font-size: 15px;
                font-weight: 600;
                color: #303133;
              }

              .person-id {
                font-size: 12px;
                color: #909399;
                margin-top: 2px;
              }
            }
          }

          .equipment-checks {
            display: flex;
            gap: 16px;
            margin-bottom: 8px;

            .equipment-check-item {
              display: flex;
              align-items: center;
              gap: 4px;
              font-size: 13px;
              color: #606266;

              i {
                font-size: 16px;
              }
            }
          }

          .detection-confidence {
            font-size: 12px;
            color: #909399;
          }
        }

        .operation-check-item {
          padding: 12px;
          margin-bottom: 12px;
          border: 1px solid #e4e7ed;
          border-radius: 8px;
          background: #fff;

          .operation-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;

            .operation-type {
              font-size: 14px;
              font-weight: 600;
              color: #303133;
            }
          }

          .operation-issues {
            margin-top: 8px;
            font-size: 12px;
            color: #e6a23c;
          }
        }

        .no-data {
          text-align: center;
          padding: 20px;
          color: #909399;
          font-size: 14px;
        }
      }
    }
  }

  .config-card {
    .config-content {
      .config-item {
        margin-bottom: 24px;
        
        .config-label {
          font-size: 14px;
          color: #606266;
          margin-bottom: 12px;
          font-weight: 500;
        }

        .config-switches {
          .switch-item {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;

            span {
              font-size: 14px;
              color: #606266;
            }
          }
        }
      }

      .config-actions {
        margin-top: 24px;
      }
    }
  }

  .stats-detail-card {
    .card-title {
      font-size: 14px;
      font-weight: 500;
      color: #606266;
    }
  }

  .record-card {
    .query-form {
      margin-bottom: 16px;
    }
  }
}
</style>