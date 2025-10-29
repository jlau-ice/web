<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type {
  EmergencySituation,
  EvacuationPath,
  EvacuationGuide,
  PersonnelStats,
  EmergencyResource
} from '@/types/evacuation'

// 紧急态势数据
const emergencySituation = reactive<EmergencySituation>({
  fireLocations: [
    { id: 1, x: 120, y: 150, severity: 'danger', description: '办公楼3楼火情' },
    { id: 2, x: 300, y: 250, severity: 'warning', description: '仓库区域烟雾' }
  ],
  emergencyExits: [
    { id: 1, x: 50, y: 300, status: 'available', capacity: 100 },
    { id: 2, x: 450, y: 300, status: 'available', capacity: 150 },
    { id: 3, x: 250, y: 50, status: 'blocked', capacity: 80 }
  ],
  shelters: [
    { id: 1, x: 500, y: 150, capacity: 200, current: 45 },
    { id: 2, x: 100, y: 400, capacity: 150, current: 30 }
  ],
  personnelDistribution: [
    { id: 1, x: 180, y: 200, count: 15, status: 'evacuating' },
    { id: 2, x: 350, y: 300, count: 8, status: 'safe' },
    { id: 3, x: 150, y: 350, count: 22, status: 'danger' }
  ],
  affectedAreas: 3,
  totalPersonnel: 156,
  evacuatedPersonnel: 89
})

// 疏散路径规划
const evacuationPaths = ref<EvacuationPath[]>([
  {
    id: 1,
    name: '主疏散路线A',
    path: [[120, 150], [180, 200], [250, 300], [50, 300]],
    length: 125,
    estimatedTime: 8,
    safetyLevel: 'high',
    status: 'active',
    capacity: 80,
    currentLoad: 45
  },
  {
    id: 2,
    name: '备用路线B',
    path: [[120, 150], [200, 180], [350, 250], [450, 300]],
    length: 145,
    estimatedTime: 10,
    safetyLevel: 'medium',
    status: 'standby',
    capacity: 60,
    currentLoad: 12
  }
])

// 疏散指引
const evacuationGuide = reactive<EvacuationGuide>({
  currentGuide: '紧急疏散通知：办公楼3楼发生火情，请全体人员立即从东侧和西侧安全出口有序撤离，前往指定避难场所。保持冷静，不要乘坐电梯。',
  voiceBroadcast: false,
  languages: ['中文', 'English', '日本語'],
  currentLanguage: '中文',
  publishHistory: [
    { id: 1, time: '14:32:15', content: '火情警报，开始疏散', type: 'alert' },
    { id: 2, time: '14:33:20', content: '西侧通道拥堵，请走东侧出口', type: 'update' },
    { id: 3, time: '14:35:10', content: '第一批人员已安全到达避难场所', type: 'success' }
  ]
})

// 人员疏散监控
const personnelStats = reactive<PersonnelStats>({
  totalPersonnel: 156,
  evacuatedCount: 89,
  evacuatingCount: 47,
  trappedCount: 15,
  evacuationRate: 57.1,
  averageEvacuationTime: 7.2,
  channelCongestion: [
    { id: 1, name: '东侧通道', congestion: 0.3, status: 'smooth' },
    { id: 2, name: '西侧通道', congestion: 0.8, status: 'congested' },
    { id: 3, name: '中央通道', congestion: 0.1, status: 'blocked' }
  ]
})

// 应急资源管理
const emergencyResources = ref<EmergencyResource[]>([
  {
    id: 1,
    name: '消防器材组A',
    type: 'equipment',
    location: { x: 100, y: 200 },
    status: 'deployed',
    personnel: 4,
    equipment: ['灭火器', '消防水带', '呼吸器']
  },
  {
    id: 2,
    name: '医疗救护组',
    type: 'medical',
    location: { x: 400, y: 350 },
    status: 'ready',
    personnel: 6,
    equipment: ['急救包', '担架', '氧气瓶']
  },
  {
    id: 3,
    name: '疏散引导组',
    type: 'guide',
    location: { x: 250, y: 250 },
    status: 'active',
    personnel: 8,
    equipment: ['扩音器', '指示牌', '手电筒']
  }
])

// 控制状态
const loading = ref(false)
const selectedPath = ref<EvacuationPath | null>(null)
const mapScale = ref(1)
const mapOffset = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const activePlans = ref(['plans'])

// 安全等级颜色
const safetyColors = {
  safe: '#52c41a',
  warning: '#faad14',
  danger: '#ff4d4f',
  critical: '#cf1322'
}

// 疏散状态颜色
const statusColors = {
  pending: '#d9d9d9',
  active: '#1890ff',
  completed: '#52c41a',
  blocked: '#ff4d4f'
}

// 计算属性
const evacuationProgress = computed(() => {
  return (personnelStats.evacuatedCount / personnelStats.totalPersonnel) * 100
})

const criticalAreas = computed(() => {
  return emergencySituation.fireLocations.filter(fire => fire.severity === 'danger' || fire.severity === 'critical')
})

// 加载初始化数据
const loadEmergencyData = async () => {
  loading.value = true
  try {
    // 模拟数据加载
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('应急疏散系统初始化完成')
  } catch (error) {
    ElMessage.error('数据加载失败')
  } finally {
    loading.value = false
  }
}

// 发布疏散指引
const publishGuide = async () => {
  try {
    await ElMessageBox.confirm('确认发布疏散指引？', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const newGuide = {
      id: evacuationGuide.publishHistory.length + 1,
      time: new Date().toLocaleTimeString(),
      content: evacuationGuide.currentGuide,
      type: 'alert' as const
    }

    evacuationGuide.publishHistory.unshift(newGuide)
    ElMessage.success('疏散指引已发布')
  } catch {
    // 用户取消
  }
}

// 启用语音播报
const toggleVoiceBroadcast = () => {
  evacuationGuide.voiceBroadcast = !evacuationGuide.voiceBroadcast
  if (evacuationGuide.voiceBroadcast) {
    ElMessage.success('语音播报已开启')
  } else {
    ElMessage.info('语音播报已关闭')
  }
}

// 选择疏散路径
const selectPath = (path: EvacuationPath) => {
  selectedPath.value = path
  path.status = path.status === 'active' ? 'standby' : 'active'
}

// 地图缩放
const zoomIn = () => {
  mapScale.value = Math.min(mapScale.value * 1.2, 3)
}

const zoomOut = () => {
  mapScale.value = Math.max(mapScale.value / 1.2, 0.5)
}

const resetMap = () => {
  mapScale.value = 1
  mapOffset.value = { x: 0, y: 0 }
}

// 地图拖拽
const handleMouseDown = (e: MouseEvent) => {
  isDragging.value = true
  dragStart.value = { x: e.clientX - mapOffset.value.x, y: e.clientY - mapOffset.value.y }
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return
  mapOffset.value = {
    x: e.clientX - dragStart.value.x,
    y: e.clientY - dragStart.value.y
  }
}

const handleMouseUp = () => {
  isDragging.value = false
}

// 组件挂载
onMounted(() => {
  loadEmergencyData()
})
</script>

<template>
  <div class="evacuation-guide-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>应急疏散指引系统</h1>
      <el-alert
        title="系统状态：正常运行"
        type="success"
        :closable="false"
        show-icon
      />
    </div>

    <!-- 主要内容区域 -->
    <el-row :gutter="20" class="main-content">
      <!-- 左侧：态势平面图 -->
      <el-col :span="12">
        <el-card title="紧急态势总览" class="situation-map">
          <template #header>
            <div class="card-header">
              <span>紧急态势总览</span>
              <div class="map-controls">
                <el-button size="small" @click="zoomIn">放大</el-button>
                <el-button size="small" @click="zoomOut">缩小</el-button>
                <el-button size="small" @click="resetMap">重置</el-button>
              </div>
            </div>
          </template>

          <!-- 模拟平面图 -->
          <div
            class="floor-plan"
            @mousedown="handleMouseDown"
            @mousemove="handleMouseMove"
            @mouseup="handleMouseUp"
            @mouseleave="handleMouseUp"
            :style="{ transform: `scale(${mapScale}) translate(${mapOffset.x}px, ${mapOffset.y}px)` }"
          >
            <!-- 火情位置 -->
            <div
              v-for="fire in emergencySituation.fireLocations"
              :key="fire.id"
              class="fire-location"
              :style="{
                left: fire.x + 'px',
                top: fire.y + 'px',
                backgroundColor: safetyColors[fire.severity]
              }"
            >
              <el-tooltip :content="fire.description" placement="top">
                <div class="fire-marker">🔥</div>
              </el-tooltip>
            </div>

            <!-- 安全出口 -->
            <div
              v-for="exit in emergencySituation.emergencyExits"
              :key="exit.id"
              class="emergency-exit"
              :class="{ blocked: exit.status === 'blocked' }"
              :style="{
                left: exit.x + 'px',
                top: exit.y + 'px'
              }"
            >
              <el-tooltip :content="`安全出口 - 容量: ${exit.capacity}人`" placement="top">
                <div class="exit-marker">🚪</div>
              </el-tooltip>
            </div>

            <!-- 避难场所 -->
            <div
              v-for="shelter in emergencySituation.shelters"
              :key="shelter.id"
              class="shelter"
              :style="{
                left: shelter.x + 'px',
                top: shelter.y + 'px'
              }"
            >
              <el-tooltip :content="`避难场所 - ${shelter.current}/${shelter.capacity}人`" placement="top">
                <div class="shelter-marker">🏠</div>
              </el-tooltip>
            </div>

            <!-- 人员分布 -->
            <div
              v-for="personnel in emergencySituation.personnelDistribution"
              :key="personnel.id"
              class="personnel-group"
              :style="{
                left: personnel.x + 'px',
                top: personnel.y + 'px'
              }"
            >
              <el-tooltip :content="`${personnel.count}人 - ${personnel.status}`" placement="top">
                <div class="personnel-marker">{{ personnel.count }}</div>
              </el-tooltip>
            </div>

            <!-- 疏散路径 -->
            <svg class="path-overlay">
              <path
                v-for="path in evacuationPaths"
                :key="path.id"
                :d="`M ${path.path.map(p => p.join(',')).join(' L ')}`"
                :stroke="selectedPath?.id === path.id ? '#1890ff' : '#52c41a'"
                :stroke-width="selectedPath?.id === path.id ? 3 : 2"
                fill="none"
                stroke-dasharray="5,5"
                @click="selectPath(path)"
                class="evacuation-path"
              />
            </svg>
          </div>

          <!-- 图例 -->
          <div class="legend">
            <div class="legend-item">
              <span class="legend-color" style="background: #ff4d4f;"></span>
              <span>危险区域</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background: #52c41a;"></span>
              <span>安全出口</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background: #1890ff;"></span>
              <span>疏散路线</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background: #faad14;"></span>
              <span>避难场所</span>
            </div>
          </div>

          <!-- 统计信息 -->
          <el-row :gutter="16" class="stats-row">
            <el-col :span="8">
              <el-statistic title="受影响区域" :value="emergencySituation.affectedAreas" />
            </el-col>
            <el-col :span="8">
              <el-statistic title="总人数" :value="emergencySituation.totalPersonnel" />
            </el-col>
            <el-col :span="8">
              <el-statistic title="已疏散" :value="emergencySituation.evacuatedPersonnel" />
            </el-col>
          </el-row>
        </el-card>
      </el-col>

      <!-- 右侧：控制面板 -->
      <el-col :span="12">
        <el-row :gutter="20">
          <!-- 智能路径规划 -->
          <el-col :span="24">
            <el-card title="智能路径规划" class="path-planning">
              <el-table :data="evacuationPaths" size="small">
                <el-table-column prop="name" label="路线名称" width="120" />
                <el-table-column prop="length" label="长度(m)" width="80" />
                <el-table-column prop="estimatedTime" label="预计时间(分)" width="100" />
                <el-table-column prop="safetyLevel" label="安全等级" width="100">
                  <template #default="{ row }">
                    <el-tag
                      :type="row.safetyLevel === 'high' ? 'success' : row.safetyLevel === 'medium' ? 'warning' : 'danger'"
                      size="small"
                    >
                      {{ row.safetyLevel === 'high' ? '高' : row.safetyLevel === 'medium' ? '中' : '低' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="80">
                  <template #default="{ row }">
                    <el-tag
                      :type="row.status === 'active' ? 'success' : 'info'"
                      size="small"
                    >
                      {{ row.status === 'active' ? '启用' : '备用' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="100">
                  <template #default="{ row }">
                    <el-button
                      type="primary"
                      size="small"
                      @click="selectPath(row)"
                      :disabled="row.status === 'blocked'"
                    >
                      {{ selectedPath?.id === row.id ? '已选择' : '选择' }}
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>

              <div class="path-actions">
                <el-button type="success" @click="publishGuide">发布疏散指引</el-button>
                <el-button type="warning" @click="toggleVoiceBroadcast">
                  {{ evacuationGuide.voiceBroadcast ? '关闭' : '开启' }}语音播报
                </el-button>
              </div>
            </el-card>
          </el-col>

          <!-- 疏散指引发布 -->
          <el-col :span="24">
            <el-card title="疏散指引发布" class="guide-publish">
              <el-form>
                <el-form-item label="当前指引">
                  <el-input
                    v-model="evacuationGuide.currentGuide"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入疏散指引内容"
                  />
                </el-form-item>
                <el-form-item label="语言选择">
                  <el-select v-model="evacuationGuide.currentLanguage">
                    <el-option
                      v-for="lang in evacuationGuide.languages"
                      :key="lang"
                      :label="lang"
                      :value="lang"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="语音播报">
                  <el-switch v-model="evacuationGuide.voiceBroadcast" />
                </el-form-item>
              </el-form>

              <div class="publish-actions">
                <el-button type="primary" @click="publishGuide">发布指引</el-button>
                <el-button type="success" @click="toggleVoiceBroadcast">
                  {{ evacuationGuide.voiceBroadcast ? '停止' : '开始' }}语音播报
                </el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-col>
    </el-row>

    <!-- 监控统计和资源管理 -->
    <el-row :gutter="20" class="monitoring-section">
      <!-- 人员疏散监控 -->
      <el-col :span="12">
        <el-card title="人员疏散监控" class="personnel-monitoring">
          <!-- 进度统计 -->
          <el-row :gutter="16" class="progress-stats">
            <el-col :span="6">
              <el-statistic title="总人数" :value="personnelStats.totalPersonnel" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="已疏散" :value="personnelStats.evacuatedCount" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="疏散中" :value="personnelStats.evacuatingCount" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="受困" :value="personnelStats.trappedCount" />
            </el-col>
          </el-row>

          <!-- 疏散进度 -->
          <div class="evacuation-progress">
            <h4>疏散进度</h4>
            <el-progress
              :percentage="evacuationProgress"
              :color="evacuationProgress > 80 ? '#52c41a' : evacuationProgress > 50 ? '#faad14' : '#ff4d4f'"
              :stroke-width="20"
            />
            <p>{{ evacuationProgress.toFixed(1) }}% 完成</p>
          </div>

          <!-- 通道拥堵情况 -->
          <div class="channel-congestion">
            <h4>通道拥堵情况</h4>
            <div v-for="channel in personnelStats.channelCongestion" :key="channel.id" class="channel-item">
              <div class="channel-info">
                <span>{{ channel.name }}</span>
                <el-tag
                  :type="channel.status === 'smooth' ? 'success' : channel.status === 'congested' ? 'warning' : 'danger'"
                  size="small"
                >
                  {{ channel.status === 'smooth' ? '畅通' : channel.status === 'congested' ? '拥堵' : '阻塞' }}
                </el-tag>
              </div>
              <el-progress
                :percentage="channel.congestion * 100"
                :color="channel.congestion < 0.3 ? '#52c41a' : channel.congestion < 0.7 ? '#faad14' : '#ff4d4f'"
                :stroke-width="8"
              />
            </div>
          </div>

          <!-- 疏散效率分析 -->
          <el-descriptions title="疏散效率分析" :column="2" size="small">
            <el-descriptions-item label="平均疏散时间">
              {{ personnelStats.averageEvacuationTime }} 分钟
            </el-descriptions-item>
            <el-descriptions-item label="疏散效率">
              <el-tag type="success">良好</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <!-- 应急资源管理 -->
      <el-col :span="12">
        <el-card title="应急资源管理" class="resource-management">
          <el-table :data="emergencyResources" size="small">
            <el-table-column prop="name" label="资源名称" width="120" />
            <el-table-column prop="type" label="类型" width="80">
              <template #default="{ row }">
                <el-tag size="small">
                  {{ row.type === 'equipment' ? '设备' : row.type === 'medical' ? '医疗' : '引导' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="personnel" label="人员数量" width="80" />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag
                  :type="row.status === 'active' ? 'success' : row.status === 'ready' ? 'warning' : 'info'"
                  size="small"
                >
                  {{ row.status === 'active' ? '活跃' : row.status === 'ready' ? '就绪' : '部署中' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="设备" width="150">
              <template #default="{ row }">
                <el-tag v-for="item in row.equipment" :key="item" size="small" class="equipment-tag">
                  {{ item }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>

          <!-- 资源调配操作 -->
          <div class="resource-actions">
            <el-button type="primary" size="small">调配资源</el-button>
            <el-button type="success" size="small">添加资源</el-button>
            <el-button type="warning" size="small">更新状态</el-button>
          </div>

          <!-- 应急预案 -->
          <el-collapse v-model="activePlans" class="emergency-plans">
            <el-collapse-item title="应急预案管理" name="plans">
              <div class="plan-item">
                <h4>火情疏散预案</h4>
                <p>适用于建筑物内火情情况的应急疏散方案</p>
                <el-button type="primary" size="small">启动预案</el-button>
                <el-button type="info" size="small">编辑预案</el-button>
              </div>
              <div class="plan-item">
                <h4>地震应急疏散预案</h4>
                <p>适用于地震灾害的应急疏散方案</p>
                <el-button type="primary" size="small">启动预案</el-button>
                <el-button type="info" size="small">编辑预案</el-button>
              </div>
            </el-collapse-item>
          </el-collapse>
        </el-card>
      </el-col>
    </el-row>

    <!-- 发布历史记录 -->
    <el-card title="发布历史记录" class="publish-history">
      <el-timeline>
        <el-timeline-item
          v-for="record in evacuationGuide.publishHistory"
          :key="record.id"
          :timestamp="record.time"
          :type="record.type === 'alert' ? 'warning' : record.type === 'success' ? 'success' : 'primary'"
        >
          <h4>{{ record.content }}</h4>
          <p>类型: {{ record.type === 'alert' ? '警报' : record.type === 'success' ? '成功' : '更新' }}</p>
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.evacuation-guide-container {
}

.page-header {
  margin-bottom: 20px;

  h1 {
    margin: 0 0 10px 0;
    color: #1890ff;
    font-size: 24px;
    font-weight: bold;
  }
}

.main-content {
  margin-bottom: 20px;
}

.situation-map {
  height: 600px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .map-controls {
    display: flex;
    gap: 8px;
  }
}

.floor-plan {
  position: relative;
  width: 550px;
  height: 450px;
  background: #f9f9f9;
  border: 2px solid #d9d9d9;
  border-radius: 8px;
  margin: 0 auto 20px;
  cursor: move;
  overflow: hidden;
  transition: transform 0.3s ease;

  .fire-location {
    position: absolute;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: pulse 2s infinite;

    .fire-marker {
      font-size: 16px;
    }
  }

  .emergency-exit {
    position: absolute;
    width: 30px;
    height: 30px;
    border-radius: 4px;
    background: #52c41a;
    display: flex;
    align-items: center;
    justify-content: center;

    &.blocked {
      background: #ff4d4f;
    }

    .exit-marker {
      font-size: 16px;
      color: white;
    }
  }

  .shelter {
    position: absolute;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: #faad14;
    display: flex;
    align-items: center;
    justify-content: center;

    .shelter-marker {
      font-size: 16px;
    }
  }

  .personnel-group {
    position: absolute;
    width: 25px;
    height: 25px;
    border-radius: 50%;
    background: #1890ff;
    display: flex;
    align-items: center;
    justify-content: center;

    .personnel-marker {
      font-size: 12px;
      color: white;
      font-weight: bold;
    }
  }

  .path-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;

    .evacuation-path {
      pointer-events: stroke;
      cursor: pointer;

      &:hover {
        stroke-width: 4;
      }
    }
  }
}

.legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;

  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 2px;
    }
  }
}

.stats-row {
  margin-top: 20px;
}

.path-planning {
  margin-bottom: 20px;

  .path-actions {
    margin-top: 15px;
    display: flex;
    gap: 10px;
  }
}

.guide-publish {
  .publish-actions {
    margin-top: 15px;
    display: flex;
    gap: 10px;
  }
}

.monitoring-section {
  margin-bottom: 20px;
}

.personnel-monitoring {
  .progress-stats {
    margin-bottom: 20px;
  }

  .evacuation-progress {
    margin-bottom: 20px;

    h4 {
      margin-bottom: 10px;
      color: #1890ff;
    }

    p {
      margin-top: 10px;
      font-weight: bold;
    }
  }

  .channel-congestion {
    margin-bottom: 20px;

    h4 {
      margin-bottom: 15px;
      color: #1890ff;
    }

    .channel-item {
      margin-bottom: 15px;

      .channel-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
    }
  }
}

.resource-management {
  .resource-actions {
    margin: 15px 0;
    display: flex;
    gap: 10px;
  }

  .equipment-tag {
    margin-right: 5px;
    margin-bottom: 5px;
  }

  .emergency-plans {
    margin-top: 20px;

    .plan-item {
      padding: 15px;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      margin-bottom: 10px;

      h4 {
        margin: 0 0 8px 0;
        color: #1890ff;
      }

      p {
        margin: 0 0 10px 0;
        color: #666;
        font-size: 12px;
      }
    }
  }
}

.publish-history {
  .el-timeline {
    padding-left: 20px;
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

// 响应式布局
@media (max-width: 1200px) {
  .el-col {
    margin-bottom: 20px;
  }
}

@media (max-width: 768px) {
  .evacuation-guide-container {
    padding: 10px;
  }

  .floor-plan {
    width: 100%;
    height: 300px;
  }

  .legend {
    flex-wrap: wrap;
    gap: 10px;
  }
}
</style>