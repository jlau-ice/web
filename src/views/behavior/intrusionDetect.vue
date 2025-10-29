<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// 接口定义
interface Area {
  id: number
  name: string
  status: 'safe' | 'warning' | 'intrusion'
  cameraCount: number
  lastIntrusion?: string
  rules: DetectionRule[]
}

interface DetectionRule {
  id: number
  areaId: number
  sensitivity: number
  responseMode: 'alert' | 'alarm' | 'both'
  whitelist: string[]
  enabled: boolean
}

interface IntrusionRecord {
  id: number
  time: string
  areaName: string
  type: 'personnel' | 'vehicle' | 'equipment'
  confidence: number
  status: 'pending' | 'processing' | 'resolved'
  imageUrl: string
  description: string
}

interface AlertInfo {
  id: number
  areaName: string
  type: 'personnel' | 'vehicle' | 'equipment'
  time: string
  location: string
  level: 'low' | 'medium' | 'high'
}

// 响应式数据
const areas = ref<Area[]>([])
const intrusions = ref<IntrusionRecord[]>([])
const currentAlerts = ref<AlertInfo[]>([])
const selectedArea = ref<Area | null>(null)
const showAreaDialog = ref(false)
const showRuleDialog = ref(false)
const showAlertDialog = ref(false)

// 表单数据
const areaForm = ref({
  name: '',
  cameraCount: 1
})

const ruleForm = ref<DetectionRule>({
  id: 0,
  areaId: 0,
  sensitivity: 50,
  responseMode: 'alert',
  whitelist: [],
  enabled: true
})

// 表单校验规则
const areaRules: FormRules = {
  name: [{ required: true, message: '请输入区域名称', trigger: 'blur' }],
  cameraCount: [{ required: true, message: '请输入监控设备数量', trigger: 'blur' }]
}

const ruleRules: FormRules = {
  sensitivity: [{ required: true, message: '请设置检测敏感度', trigger: 'blur' }],
  responseMode: [{ required: true, message: '请选择响应方式', trigger: 'blur' }]
}

// 表单引用
const areaFormRef = ref<FormInstance>()
const ruleFormRef = ref<FormInstance>()

// 计算属性
const safeAreas = computed(() => areas.value.filter(a => a.status === 'safe'))
const warningAreas = computed(() => areas.value.filter(a => a.status === 'warning'))
const intrusionAreas = computed(() => areas.value.filter(a => a.status === 'intrusion'))

const getStatusColor = (status: string) => {
  switch (status) {
    case 'safe': return '#67C23A'
    case 'warning': return '#E6A23C'
    case 'intrusion': return '#F56C6C'
    default: return '#909399'
  }
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'personnel': return '#F56C6C'
    case 'vehicle': return '#FF6600'
    case 'equipment': return '#409EFF'
    default: return '#909399'
  }
}

const getTypeText = (type: string) => {
  switch (type) {
    case 'personnel': return '人员入侵'
    case 'vehicle': return '车辆入侵'
    case 'equipment': return '设备异常'
    default: return '未知'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'safe': return '安全'
    case 'warning': return '预警'
    case 'intrusion': return '入侵'
    default: return '未知'
  }
}

const getLevelText = (level: string) => {
  switch (level) {
    case 'low': return '低级'
    case 'medium': return '中级'
    case 'high': return '高级'
    default: return '未知'
  }
}

// Mock 数据加载
const loadMockData = () => {
  setTimeout(() => {
    // 加载区域数据
    areas.value = [
      {
        id: 1,
        name: 'A区 - 高价值货物存储区',
        status: 'safe',
        cameraCount: 4,
        rules: []
      },
      {
        id: 2,
        name: 'B区 - 危险品存储区',
        status: 'warning',
        cameraCount: 6,
        lastIntrusion: '2024-01-15 14:23:00',
        rules: []
      },
      {
        id: 3,
        name: 'C区 - 出入口通道',
        status: 'intrusion',
        cameraCount: 2,
        lastIntrusion: '2024-01-15 15:45:00',
        rules: []
      }
    ]

    // 加载入侵记录
    intrusions.value = [
      {
        id: 1,
        time: '2024-01-15 15:45:00',
        areaName: 'C区 - 出入口通道',
        type: 'personnel',
        confidence: 95,
        status: 'pending',
        imageUrl: 'https://img1.baidu.com/it/u=1249615771,1236567569&fm=253&fmt=auto?w=750&h=500',
        description: '检测到未授权人员进入限制区域'
      },
      {
        id: 2,
        time: '2024-01-15 14:23:00',
        areaName: 'B区 - 危险品存储区',
        type: 'vehicle',
        confidence: 87,
        status: 'processing',
        imageUrl: 'https://img2.baidu.com/it/u=1305261361,3259404277&fm=253&fmt=auto&app=138&f=JPEG?w=584&h=346',
        description: '检测到未授权车辆进入危险区域'
      },
      {
        id: 3,
        time: '2024-01-15 13:10:00',
        areaName: 'A区 - 高价值货物存储区',
        type: 'equipment',
        confidence: 78,
        status: 'resolved',
        imageUrl: 'https://img1.baidu.com/it/u=2579308396,3047351456&fm=253&fmt=auto&app=138&f=JPEG?w=600&h=400',
        description: '监控设备异常，已修复'
      }
    ]

    // 加载预警信息
    currentAlerts.value = [
      {
        id: 1,
        areaName: 'C区 - 出入口通道',
        type: 'personnel',
        time: '2024-01-15 15:45:00',
        location: '东门入口',
        level: 'high'
      }
    ]
  }, 500)
}

// 区域管理方法
const handleAddArea = () => {
  areaForm.value = { name: '', cameraCount: 1 }
  showAreaDialog.value = true
}

const handleEditArea = (area: Area) => {
  areaForm.value = { name: area.name, cameraCount: area.cameraCount }
  selectedArea.value = area
  showAreaDialog.value = true
}

const handleDeleteArea = (area: Area) => {
  ElMessageBox.confirm(`确定要删除区域 "${area.name}" 吗？`, '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = areas.value.findIndex(a => a.id === area.id)
    if (index > -1) {
      areas.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  })
}

const saveArea = async () => {
  if (!areaFormRef.value) return

  await areaFormRef.value.validate((valid) => {
    if (valid) {
      if (selectedArea.value) {
        // 编辑
        selectedArea.value.name = areaForm.value.name
        selectedArea.value.cameraCount = areaForm.value.cameraCount
        ElMessage.success('更新成功')
      } else {
        // 新增
        const newArea: Area = {
          id: Date.now(),
          name: areaForm.value.name,
          status: 'safe',
          cameraCount: areaForm.value.cameraCount,
          rules: []
        }
        areas.value.push(newArea)
        ElMessage.success('添加成功')
      }
      showAreaDialog.value = false
    }
  })
}

// 检测规则配置
const handleConfigRule = (area: Area) => {
  selectedArea.value = area
  ruleForm.value = {
    id: Date.now(),
    areaId: area.id,
    sensitivity: 50,
    responseMode: 'alert',
    whitelist: [],
    enabled: true
  }
  showRuleDialog.value = true
}

const saveRule = async () => {
  if (!ruleFormRef.value || !selectedArea.value) return

  await ruleFormRef.value.validate((valid) => {
    if (valid) {
      if (!selectedArea.value!.rules) {
        selectedArea.value!.rules = []
      }

      const existingIndex = selectedArea.value!.rules.findIndex(r => r.areaId === ruleForm.value.areaId)
      if (existingIndex > -1) {
        selectedArea.value!.rules[existingIndex] = { ...ruleForm.value }
      } else {
        selectedArea.value!.rules.push({ ...ruleForm.value })
      }

      ElMessage.success('规则配置成功')
      showRuleDialog.value = false
    }
  })
}

// 入侵记录处理
const handleProcessIntrusion = (record: IntrusionRecord) => {
  record.status = 'processing'
  ElMessage.success('已标记为处理中')
}

const handleResolveIntrusion = (record: IntrusionRecord) => {
  ElMessageBox.confirm('确定已解决此入侵事件吗？', '确认解决', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(() => {
    record.status = 'resolved'
    ElMessage.success('已标记为已解决')
  })
}

// 预警处理
const handleViewAlert = (alert: AlertInfo) => {
  showAlertDialog.value = true
}

const handleDismissAlert = (alertId: number) => {
  const index = currentAlerts.value.findIndex(a => a.id === alertId)
  if (index > -1) {
    currentAlerts.value.splice(index, 1)
    ElMessage.success('预警已忽略')
  }
}

// 生命周期
onMounted(() => {
  loadMockData()
})
</script>

<template>
  <div class="intrusion-detect-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>区域入侵检测</h2>
      <p>智能视频分析技术，全天候监控仓储限制区域</p>
    </div>

    <!-- 主要内容区域 -->
    <el-row :gutter="20">
      <!-- 左侧：仓储平面图 -->
      <el-col :span="8">
        <el-card title="监控区域管理" class="area-map-card">
          <template #header>
            <div class="card-header">
              <span>监控区域管理</span>
              <el-button type="primary" size="small" @click="handleAddArea">
                添加区域
              </el-button>
            </div>
          </template>

          <!-- 区域平面图模拟 -->
          <div class="area-map">
            <div class="map-grid">
              <div
                v-for="area in areas"
                :key="area.id"
                class="area-block"
                :class="{ [area.status]: true }"
                @click="selectedArea = area"
              >
                <div class="area-info">
                  <div class="area-name">{{ area.name }}</div>
                  <div class="area-status">
                    <el-tag :color="getStatusColor(area.status)" size="small">
                      {{ getStatusText(area.status) }}
                    </el-tag>
                  </div>
                  <div class="camera-count">
                    摄像头: {{ area.cameraCount }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 区域统计 -->
          <div class="area-stats">
            <div class="stat-item safe">
              <span class="stat-label">安全区域</span>
              <span class="stat-value">{{ safeAreas.length }}</span>
            </div>
            <div class="stat-item warning">
              <span class="stat-label">预警区域</span>
              <span class="stat-value">{{ warningAreas.length }}</span>
            </div>
            <div class="stat-item intrusion">
              <span class="stat-label">入侵区域</span>
              <span class="stat-value">{{ intrusionAreas.length }}</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 中间：实时监控画面 -->
      <el-col :span="8">
        <el-card title="实时监控" class="monitor-card">
          <template #header>
            <div class="card-header">
              <span>实时监控</span>
              <el-tag :type="currentAlerts.length > 0 ? 'danger' : 'success'">
                {{ currentAlerts.length > 0 ? '有入侵' : '正常' }}
              </el-tag>
            </div>
          </template>

          <div class="monitor-content">
            <!-- 模拟监控画面 -->
            <div class="monitor-grid">
              <div
                v-for="area in areas.slice(0, 4)"
                :key="area.id"
                class="monitor-item"
              >
                <div class="monitor-header">
                  <span class="area-title">{{ area.name }}</span>
                  <el-tag
                    :color="getStatusColor(area.status)"
                    size="small"
                    effect="dark"
                  >
                    {{ getStatusText(area.status) }}
                  </el-tag>
                </div>
                <div class="monitor-screen">
                  <img
                    src='https://img1.baidu.com/it/u=1249615771,1236567569&fm=253&fmt=auto?w=750&h=500'
                    :alt="area.name"
                  />
                  <div v-if="area.status === 'intrusion'" class="intrusion-overlay">
                    <div class="intrusion-alert">🚨 入侵检测</div>
                  </div>
                </div>
                <div class="monitor-footer">
                  <span class="last-update">
                    最后更新: {{ new Date().toLocaleTimeString() }}
                  </span>
                  <el-button
                    size="small"
                    @click="handleConfigRule(area)"
                  >
                    配置规则
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：预警信息和配置面板 -->
      <el-col :span="8">
        <!-- 实时预警 -->
        <el-card title="实时预警" class="alert-card">
          <template #header>
            <div class="card-header">
              <span>实时预警</span>
              <el-badge :value="currentAlerts.length" class="alert-badge" />
            </div>
          </template>

          <div class="alert-list">
            <el-empty v-if="currentAlerts.length === 0" description="暂无预警信息" />
            <div
              v-for="alert in currentAlerts"
              :key="alert.id"
              class="alert-item"
              :class="[alert.level]"
            >
              <div class="alert-header">
                <el-tag :color="getTypeColor(alert.type)" size="small">
                  {{ getTypeText(alert.type) }}
                </el-tag>
                <el-tag :type="alert.level === 'high' ? 'danger' : alert.level === 'medium' ? 'warning' : 'info'" size="small">
                  {{ getLevelText(alert.level) }}
                </el-tag>
              </div>
              <div class="alert-content">
                <div class="alert-location">📍 {{ alert.areaName }} - {{ alert.location }}</div>
                <div class="alert-time">⏰ {{ alert.time }}</div>
              </div>
              <div class="alert-actions">
                <el-button size="small" @click="handleViewAlert(alert)">查看</el-button>
                <el-button size="small" type="danger" @click="handleDismissAlert(alert.id)">忽略</el-button>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 快速操作 -->
        <el-card title="快速操作" class="quick-actions-card">
          <div class="quick-actions">
            <el-button type="primary" icon="VideoPlay" @click="loadMockData">
              刷新监控
            </el-button>
            <el-button type="warning" icon="Bell">
              测试报警
            </el-button>
            <el-button type="info" icon="Setting">
              系统设置
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 入侵记录表格 -->
    <el-card title="入侵记录分析" class="records-card">
      <template #header>
        <div class="card-header">
          <span>入侵记录分析</span>
          <div class="header-actions">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              size="small"
            />
            <el-select v-model="selectedAreaFilter" placeholder="选择区域" size="small" clearable>
              <el-option
                v-for="area in areas"
                :key="area.id"
                :label="area.name"
                :value="area.id"
              />
            </el-select>
            <el-button type="primary" size="small" icon="Refresh">刷新</el-button>
          </div>
        </div>
      </template>

      <el-table :data="intrusions" stripe style="width: 100%">
        <el-table-column prop="time" label="入侵时间" width="180" />
        <el-table-column prop="areaName" label="区域位置" width="200" />
        <el-table-column label="入侵类型" width="120">
          <template #default="{ row }">
            <el-tag :color="getTypeColor(row.type)" effect="dark">
              {{ getTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="置信度" width="100">
          <template #default="{ row }">
            <el-progress
              :percentage="row.confidence"
              :color="row.confidence > 80 ? '#67C23A' : row.confidence > 60 ? '#E6A23C' : '#F56C6C'"
              :show-text="false"
              :stroke-width="8"
            />
            <span class="confidence-text">{{ row.confidence }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" />
        <el-table-column label="处理状态" width="120">
          <template #default="{ row }">
            <el-tag
              :type="row.status === 'resolved' ? 'success' : row.status === 'processing' ? 'warning' : 'danger'"
            >
              {{ row.status === 'resolved' ? '已解决' : row.status === 'processing' ? '处理中' : '待处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="handleViewAlert({ id: row.id, areaName: row.areaName, type: row.type, time: row.time, location: '监控区域', level: 'medium' })">
              查看详情
            </el-button>
            <el-button
              v-if="row.status === 'pending'"
              size="small"
              type="warning"
              @click="handleProcessIntrusion(row)"
            >
              开始处理
            </el-button>
            <el-button
              v-if="row.status === 'processing'"
              size="small"
              type="success"
              @click="handleResolveIntrusion(row)"
            >
              标记解决
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑区域对话框 -->
    <el-dialog
      v-model="showAreaDialog"
      :title="selectedArea ? '编辑区域' : '添加区域'"
      width="500px"
    >
      <el-form
        ref="areaFormRef"
        :model="areaForm"
        :rules="areaRules"
        label-width="100px"
      >
        <el-form-item label="区域名称" prop="name">
          <el-input v-model="areaForm.name" placeholder="请输入区域名称" />
        </el-form-item>
        <el-form-item label="监控设备" prop="cameraCount">
          <el-input-number
            v-model="areaForm.cameraCount"
            :min="1"
            :max="20"
            placeholder="监控设备数量"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAreaDialog = false">取消</el-button>
        <el-button type="primary" @click="saveArea">确定</el-button>
      </template>
    </el-dialog>

    <!-- 检测规则配置对话框 -->
    <el-dialog
      v-model="showRuleDialog"
      title="检测规则配置"
      width="600px"
    >
      <el-form
        ref="ruleFormRef"
        :model="ruleForm"
        :rules="ruleRules"
        label-width="120px"
      >
        <el-form-item label="目标区域">
          <el-input :value="selectedArea?.name" disabled />
        </el-form-item>
        <el-form-item label="检测敏感度" prop="sensitivity">
          <el-slider
            v-model="ruleForm.sensitivity"
            :min="0"
            :max="100"
            show-stops
            show-input
          />
          <div class="sensitivity-desc">
            <span v-if="ruleForm.sensitivity < 30">低敏感度 - 减少误报</span>
            <span v-else-if="ruleForm.sensitivity < 70">中敏感度 - 平衡模式</span>
            <span v-else>高敏感度 - 最大检测</span>
          </div>
        </el-form-item>
        <el-form-item label="响应方式" prop="responseMode">
          <el-radio-group v-model="ruleForm.responseMode">
            <el-radio label="alert">仅预警</el-radio>
            <el-radio label="alarm">仅报警</el-radio>
            <el-radio label="both">预警+报警</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="启用规则">
          <el-switch v-model="ruleForm.enabled" />
        </el-form-item>
        <el-form-item label="白名单">
          <el-input
            v-model="ruleForm.whitelist"
            type="textarea"
            :rows="3"
            placeholder="输入授权人员/设备信息，每行一个"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRuleDialog = false">取消</el-button>
        <el-button type="primary" @click="saveRule">保存配置</el-button>
      </template>
    </el-dialog>

    <!-- 预警详情对话框 -->
    <el-dialog
      v-model="showAlertDialog"
      title="入侵预警详情"
      width="800px"
    >
      <div class="alert-detail">
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-image">
              <img src='https://img1.baidu.com/it/u=1249615771,1236567569&fm=253&fmt=auto?w=750&h=500' alt="入侵画面" />
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-info">
              <el-descriptions title="预警信息" :column="1" border>
                <el-descriptions-item label="预警时间">
                  {{ new Date().toLocaleString() }}
                </el-descriptions-item>
                <el-descriptions-item label="预警区域">
                  {{ selectedArea?.name || '未知区域' }}
                </el-descriptions-item>
                <el-descriptions-item label="入侵类型">
                  <el-tag color="#F56C6C">人员入侵</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="风险级别">
                  <el-tag type="danger">高级</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="处置建议">
                  立即派遣安保人员前往现场核实情况
                </el-descriptions-item>
              </el-descriptions>

              <div class="detail-actions">
                <el-button type="danger" icon="Bell">启动声光报警</el-button>
                <el-button type="warning" icon="Phone">联系安保</el-button>
                <el-button type="primary" icon="View">查看录像</el-button>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.intrusion-detect-container {

  .page-header {
    margin-bottom: 20px;

    h2 {
      margin: 0 0 8px 0;
      color: #303133;
      font-size: 24px;
      font-weight: 600;
    }

    p {
      margin: 0;
      color: #606266;
      font-size: 14px;
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  // 左侧区域管理卡片
  .area-map-card {
    height: 600px;

    .area-map {
      height: 350px;
      border: 2px solid #e4e7ed;
      border-radius: 8px;
      padding: 10px;
      background-image: url('https://img0.baidu.com/it/u=3546725929,1490265751&fm=253&fmt=auto&app=138&f=JPEG?w=664&h=374');

      .map-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
        height: 100%;

        .area-block {
          background: rgba(255, 255, 255, 0.9);
          border: 2px solid #e4e7ed;
          border-radius: 8px;
          padding: 15px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }

          &.safe {
            border-color: #67C23A;
            background: rgba(103, 194, 58, 0.1);
          }

          &.warning {
            border-color: #E6A23C;
            background: rgba(230, 162, 60, 0.1);
          }

          &.intrusion {
            border-color: #F56C6C;
            background: rgba(245, 108, 108, 0.1);
            animation: pulse 2s infinite;
          }

          .area-info {
            text-align: center;

            .area-name {
              font-weight: 600;
              margin-bottom: 8px;
              color: #303133;
            }

            .area-status {
              margin-bottom: 5px;
            }

            .camera-count {
              font-size: 12px;
              color: #909399;
            }
          }
        }
      }
    }

    .area-stats {
      display: flex;
      justify-content: space-around;
      margin-top: 20px;

      .stat-item {
        text-align: center;
        padding: 15px;
        border-radius: 8px;
        flex: 1;
        margin: 0 5px;

        .stat-label {
          display: block;
          font-size: 12px;
          margin-bottom: 5px;
        }

        .stat-value {
          display: block;
          font-size: 24px;
          font-weight: bold;
        }

        &.safe {
          background: rgba(103, 194, 58, 0.1);
          color: #67C23A;
        }

        &.warning {
          background: rgba(230, 162, 60, 0.1);
          color: #E6A23C;
        }

        &.intrusion {
          background: rgba(245, 108, 108, 0.1);
          color: #F56C6C;
        }
      }
    }
  }

  // 中间监控卡片
  .monitor-card {
    height: 600px;

    .monitor-content {
      .monitor-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
        height: 500px;

        .monitor-item {
          border: 1px solid #e4e7ed;
          border-radius: 8px;
          overflow: hidden;

          .monitor-header {
            padding: 8px 12px;
            background: #f5f7fa;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #e4e7ed;

            .area-title {
              font-size: 12px;
              font-weight: 600;
              color: #303133;
            }
          }

          .monitor-screen {
            position: relative;
            height: 140px;

            img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }

            .intrusion-overlay {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(245, 108, 108, 0.7);
              display: flex;
              align-items: center;
              justify-content: center;

              .intrusion-alert {
                color: white;
                font-weight: bold;
                font-size: 16px;
                animation: blink 1s infinite;
              }
            }
          }

          .monitor-footer {
            padding: 8px 12px;
            background: #f5f7fa;
            display: flex;
            justify-content: space-between;
            align-items: center;

            .last-update {
              font-size: 10px;
              color: #909399;
            }
          }
        }
      }
    }
  }

  // 右侧预警卡片
  .alert-card {
    height: 300px;
    margin-bottom: 20px;

    .alert-list {
      max-height: 200px;
      overflow-y: auto;

      .alert-item {
        border: 1px solid #e4e7ed;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 10px;

        &.high {
          border-left: 4px solid #F56C6C;
          background: rgba(245, 108, 108, 0.05);
        }

        &.medium {
          border-left: 4px solid #E6A23C;
          background: rgba(230, 162, 60, 0.05);
        }

        &.low {
          border-left: 4px solid #409EFF;
          background: rgba(64, 158, 255, 0.05);
        }

        .alert-header {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }

        .alert-content {
          margin-bottom: 10px;

          .alert-location, .alert-time {
            font-size: 12px;
            color: #606266;
            margin-bottom: 2px;
          }
        }

        .alert-actions {
          display: flex;
          gap: 8px;
        }
      }
    }
  }

  .quick-actions-card {
    .quick-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;

      .el-button {
        justify-content: flex-start;
      }
    }
  }

  // 记录表格卡片
  .records-card {
    margin-top: 20px;

    .header-actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .confidence-text {
      font-size: 12px;
      color: #606266;
      margin-left: 8px;
    }
  }

  // 对话框样式
  .sensitivity-desc {
    margin-top: 5px;
    font-size: 12px;
    color: #909399;
  }

  .alert-detail {
    .detail-image {
      img {
        width: 100%;
        border-radius: 8px;
      }
    }

    .detail-info {
      .detail-actions {
        margin-top: 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;

        .el-button {
          justify-content: flex-start;
        }
      }
    }
  }
}

// 动画效果
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(245, 108, 108, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(245, 108, 108, 0);
  }
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  25%, 75% {
    opacity: 0.5;
  }
}
</style>