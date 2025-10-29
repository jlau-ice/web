<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { UploadProps } from 'element-plus'

// 定义人员类型
type PersonType = 'whitelist' | 'blacklist' | 'visitor' | 'employee'

// 定义识别状态
type RecognitionStatus = 'recognizing' | 'success' | 'failed'

// 人员信息接口
interface PersonInfo {
  id: string
  name: string
  type: PersonType
  registerTime: string
  avatar: string
  status: 'active' | 'inactive'
  department?: string
}

// 监控摄像头接口
interface Camera {
  id: string
  name: string
  location: string
  status: 'online' | 'offline'
  detecting: boolean
  detectedFaces: DetectedFace[]
}

// 识别到的人脸接口
interface DetectedFace {
  id: string
  personId: string
  personName: string
  personType: PersonType
  confidence: number
  status: RecognitionStatus
  x: number
  y: number
  width: number
  height: number
  timestamp: Date
}

// 预警信息接口
interface AlertInfo {
  id: string
  personId: string
  personName: string
  personType: PersonType
  cameraId: string
  cameraName: string
  location: string
  time: Date
  handled: boolean
  handler?: string
  feedback?: string
  snapshot: string
}

// 轨迹信息接口
interface TrajectoryInfo {
  id: string
  personId: string
  personName: string
  cameraId: string
  cameraName: string
  location: string
  time: Date
  snapshot: string
}

// 识别配置接口
interface RecognitionConfig {
  sensitivity: number
  accuracy: number
  alertSound: boolean
  alertMessage: boolean
  autoCapture: boolean
  minConfidence: number
}

// 页面状态
const activeTab = ref('monitor')
const cameraLayout = ref<'2x2' | '3x3' | '4x4'>('2x2')
const selectedCamera = ref<string>('')

// 监控摄像头列表
const cameras = ref<Camera[]>([])

// 人脸库数据
const personList = ref<PersonInfo[]>([])
const personTableLoading = ref(false)
const personTypeFilter = ref<PersonType | ''>('')
const personStatusFilter = ref<'active' | 'inactive' | ''>('')

// 预警信息列表
const alertList = ref<AlertInfo[]>([])
const alertListLoading = ref(false)

// 轨迹信息
const trajectoryList = ref<TrajectoryInfo[]>([])
const trajectoryLoading = ref(false)
const trajectoryTimeRange = ref<[Date, Date] | null>(null)
const selectedPersonForTrajectory = ref<string>('')

// 识别配置
const recognitionConfig = ref<RecognitionConfig>({
  sensitivity: 80,
  accuracy: 85,
  alertSound: true,
  alertMessage: true,
  autoCapture: true,
  minConfidence: 70
})

// 对话框状态
const personDialogVisible = ref(false)
const alertDialogVisible = ref(false)
const trajectoryDialogVisible = ref(false)
const configDialogVisible = ref(false)

// 当前编辑的人员信息
const currentPerson = reactive<Partial<PersonInfo>>({})

// 当前查看的预警
const currentAlert = ref<AlertInfo | null>(null)

// 模拟数据定时器
let dataSimulationTimer: number | null = null

// 人员类型标签配置
const personTypeConfig = {
  whitelist: { label: '白名单', color: 'success' },
  blacklist: { label: '黑名单', color: 'danger' },
  visitor: { label: '访客', color: 'primary' },
  employee: { label: '员工', color: 'warning' }
}

// 识别状态配置
const recognitionStatusConfig = {
  recognizing: { label: '识别中', color: 'primary' },
  success: { label: '识别成功', color: 'success' },
  failed: { label: '识别失败', color: 'danger' }
}

// 初始化 mock 数据
const initMockData = () => {
  // 初始化摄像头数据
  cameras.value = [
    { id: 'cam1', name: '摄像头1', location: '主入口', status: 'online', detecting: true, detectedFaces: [] },
    { id: 'cam2', name: '摄像头2', location: '大厅', status: 'online', detecting: true, detectedFaces: [] },
    { id: 'cam3', name: '摄像头3', location: '电梯口', status: 'online', detecting: true, detectedFaces: [] },
    { id: 'cam4', name: '摄像头4', location: '停车场', status: 'online', detecting: true, detectedFaces: [] },
    { id: 'cam5', name: '摄像头5', location: '后门', status: 'online', detecting: false, detectedFaces: [] },
    { id: 'cam6', name: '摄像头6', location: '楼梯口', status: 'offline', detecting: false, detectedFaces: [] }
  ]

  // 初始化人员数据
  personList.value = [
    {
      id: 'p1',
      name: '张三',
      type: 'employee',
      registerTime: '2024-01-15 10:30:00',
      avatar: 'https://i.pravatar.cc/150?img=1',
      status: 'active',
      department: '技术部'
    },
    {
      id: 'p2',
      name: '李四',
      type: 'employee',
      registerTime: '2024-01-16 14:20:00',
      avatar: 'https://i.pravatar.cc/150?img=2',
      status: 'active',
      department: '市场部'
    },
    {
      id: 'p3',
      name: '王五',
      type: 'blacklist',
      registerTime: '2024-02-01 09:00:00',
      avatar: 'https://i.pravatar.cc/150?img=3',
      status: 'active'
    },
    {
      id: 'p4',
      name: '赵六',
      type: 'visitor',
      registerTime: '2024-10-29 08:45:00',
      avatar: 'https://i.pravatar.cc/150?img=4',
      status: 'active'
    },
    {
      id: 'p5',
      name: '钱七',
      type: 'whitelist',
      registerTime: '2024-03-10 11:30:00',
      avatar: 'https://i.pravatar.cc/150?img=5',
      status: 'active'
    }
  ]
}

// 模拟实时人脸检测
const simulateFaceDetection = () => {
  cameras.value.forEach(camera => {
    if (camera.status === 'online' && camera.detecting) {
      // 随机生成检测到的人脸
      if (Math.random() > 0.7) {
        const person = personList.value[Math.floor(Math.random() * personList.value.length)]
        const detectedFace: DetectedFace = {
          id: `face_${Date.now()}_${Math.random()}`,
          personId: person.id,
          personName: person.name,
          personType: person.type,
          confidence: 70 + Math.random() * 30,
          status: 'success',
          x: Math.random() * 60 + 10,
          y: Math.random() * 60 + 10,
          width: Math.random() * 10 + 15,
          height: Math.random() * 10 + 20,
          timestamp: new Date()
        }
        
        camera.detectedFaces = [detectedFace]
        
        // 如果是黑名单人员，生成预警
        if (person.type === 'blacklist') {
          const alert: AlertInfo = {
            id: `alert_${Date.now()}`,
            personId: person.id,
            personName: person.name,
            personType: person.type,
            cameraId: camera.id,
            cameraName: camera.name,
            location: camera.location,
            time: new Date(),
            handled: false,
            snapshot: person.avatar
          }
          alertList.value.unshift(alert)
          
          // 播放预警提示
          if (recognitionConfig.value.alertSound) {
            ElMessage.error(`黑名单预警：${person.name} 在 ${camera.location} 被检测到！`)
          }
        }
        
        // 记录轨迹
        const trajectory: TrajectoryInfo = {
          id: `traj_${Date.now()}`,
          personId: person.id,
          personName: person.name,
          cameraId: camera.id,
          cameraName: camera.name,
          location: camera.location,
          time: new Date(),
          snapshot: person.avatar
        }
        trajectoryList.value.unshift(trajectory)
        
        // 一段时间后清除检测框
        setTimeout(() => {
          camera.detectedFaces = []
        }, 3000)
      }
    }
  })
}

// 加载人脸库数据
const loadPersonList = () => {
  personTableLoading.value = true
  setTimeout(() => {
    personTableLoading.value = false
  }, 500)
}

// 筛选人员列表
const filteredPersonList = computed(() => {
  return personList.value.filter(person => {
    if (personTypeFilter.value && person.type !== personTypeFilter.value) return false
    if (personStatusFilter.value && person.status !== personStatusFilter.value) return false
    return true
  })
})

// 添加人员
const handleAddPerson = () => {
  Object.assign(currentPerson, {
    id: '',
    name: '',
    type: 'employee',
    status: 'active',
    department: ''
  })
  personDialogVisible.value = true
}

// 编辑人员
const handleEditPerson = (person: PersonInfo) => {
  Object.assign(currentPerson, { ...person })
  personDialogVisible.value = true
}

// 删除人员
const handleDeletePerson = (person: PersonInfo) => {
  ElMessageBox.confirm(`确定删除人员 ${person.name} 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = personList.value.findIndex(p => p.id === person.id)
    if (index > -1) {
      personList.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  }).catch(() => {})
}

// 保存人员信息
const handleSavePerson = () => {
  if (!currentPerson.name) {
    ElMessage.warning('请输入人员姓名')
    return
  }
  
  if (currentPerson.id) {
    // 编辑
    const index = personList.value.findIndex(p => p.id === currentPerson.id)
    if (index > -1) {
      personList.value[index] = { ...currentPerson } as PersonInfo
    }
    ElMessage.success('修改成功')
  } else {
    // 新增
    const newPerson: PersonInfo = {
      ...currentPerson,
      id: `p_${Date.now()}`,
      registerTime: new Date().toLocaleString('zh-CN'),
      avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`
    } as PersonInfo
    personList.value.unshift(newPerson)
    ElMessage.success('添加成功')
  }
  
  personDialogVisible.value = false
}

// 批量导入人员
const handleImport: UploadProps['onChange'] = (uploadFile) => {
  ElMessage.success(`导入文件：${uploadFile.name}，模拟导入成功`)
}

// 批量导出人员
const handleExport = () => {
  ElMessage.success('导出成功，共导出 ' + personList.value.length + ' 条数据')
}

// 处理预警
const handleAlert = (alert: AlertInfo) => {
  currentAlert.value = alert
  alertDialogVisible.value = true
}

// 提交预警处理
const submitAlertHandle = (feedback: string) => {
  if (currentAlert.value) {
    currentAlert.value.handled = true
    currentAlert.value.handler = '当前用户'
    currentAlert.value.feedback = feedback
    ElMessage.success('预警处理完成')
    alertDialogVisible.value = false
  }
}

// 查看人员轨迹
const viewTrajectory = (personId: string) => {
  selectedPersonForTrajectory.value = personId
  trajectoryDialogVisible.value = true
}

// 筛选轨迹数据
const filteredTrajectoryList = computed(() => {
  let list = trajectoryList.value
  
  if (selectedPersonForTrajectory.value) {
    list = list.filter(t => t.personId === selectedPersonForTrajectory.value)
  }
  
  if (trajectoryTimeRange.value) {
    const [start, end] = trajectoryTimeRange.value
    list = list.filter(t => t.time >= start && t.time <= end)
  }
  
  return list
})

// 导出轨迹数据
const exportTrajectory = () => {
  ElMessage.success('导出成功，共导出 ' + filteredTrajectoryList.value.length + ' 条轨迹数据')
}

// 保存识别配置
const saveConfig = () => {
  ElMessage.success('配置保存成功')
  configDialogVisible.value = false
}

// 测试识别效果
const testRecognition = () => {
  ElMessage.info('开始测试识别效果...')
  setTimeout(() => {
    ElMessage.success('识别测试完成，准确率：95.3%')
  }, 2000)
}

// 切换摄像头布局
const changeCameraLayout = (layout: '2x2' | '3x3' | '4x4') => {
  cameraLayout.value = layout
}

// 获取布局网格数
const getLayoutGrid = computed(() => {
  const layoutMap = {
    '2x2': 4,
    '3x3': 9,
    '4x4': 16
  }
  return layoutMap[cameraLayout.value]
})

// 获取要显示的摄像头列表
const displayCameras = computed(() => {
  return cameras.value.slice(0, getLayoutGrid.value)
})

// 生命周期
onMounted(() => {
  initMockData()
  loadPersonList()
  
  // 启动模拟数据生成
  dataSimulationTimer = window.setInterval(() => {
    simulateFaceDetection()
  }, 5000)
})

onUnmounted(() => {
  if (dataSimulationTimer) {
    clearInterval(dataSimulationTimer)
  }
})
</script>

<template>
  <div class="face-recognition-container">
    <!-- 顶部工具栏 -->
    <el-card class="toolbar-card" shadow="never">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-radio-group v-model="activeTab" size="default">
            <el-radio-button value="monitor">实时监控</el-radio-button>
            <el-radio-button value="person">人脸库管理</el-radio-button>
            <el-radio-button value="alert">黑名单预警</el-radio-button>
            <el-radio-button value="trajectory">轨迹分析</el-radio-button>
          </el-radio-group>
        </div>
        <div class="toolbar-right">
          <el-button type="primary" @click="configDialogVisible = true">
            识别配置
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 实时监控视图 -->
      <div v-show="activeTab === 'monitor'" class="monitor-view">
        <el-row :gutter="20">
          <!-- 左侧：监控画面区 -->
          <el-col :span="16">
            <el-card class="monitor-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <span>实时监控画面</span>
                  <div class="layout-switch">
                    <el-radio-group v-model="cameraLayout" size="small" @change="changeCameraLayout">
                      <el-radio-button value="2x2">2x2</el-radio-button>
                      <el-radio-button value="3x3">3x3</el-radio-button>
                      <el-radio-button value="4x4">4x4</el-radio-button>
                    </el-radio-group>
                  </div>
                </div>
              </template>
              
              <div class="camera-grid" :class="`grid-${cameraLayout}`">
                <div
                  v-for="camera in displayCameras"
                  :key="camera.id"
                  class="camera-item"
                  :class="{ offline: camera.status === 'offline' }"
                >
                  <div class="camera-header">
                    <span class="camera-name">{{ camera.name }}</span>
                    <el-tag :type="camera.status === 'online' ? 'success' : 'danger'" size="small">
                      {{ camera.status === 'online' ? '在线' : '离线' }}
                    </el-tag>
                  </div>
                  
                  <div class="camera-view">
                    <!-- 模拟视频画面 -->
                    <div class="video-placeholder">
                      <i class="el-icon-video-camera"></i>
                      <p>{{ camera.location }}</p>
                    </div>
                    
                    <!-- 人脸识别框 -->
                    <div
                      v-for="face in camera.detectedFaces"
                      :key="face.id"
                      class="face-box"
                      :style="{
                        left: `${face.x}%`,
                        top: `${face.y}%`,
                        width: `${face.width}%`,
                        height: `${face.height}%`
                      }"
                      :class="`face-box-${face.personType}`"
                    >
                      <div class="face-info">
                        <div class="face-name">{{ face.personName }}</div>
                        <div class="face-confidence">{{ face.confidence.toFixed(1) }}%</div>
                        <el-tag
                          :type="personTypeConfig[face.personType].color"
                          size="small"
                          effect="dark"
                        >
                          {{ personTypeConfig[face.personType].label }}
                        </el-tag>
                      </div>
                    </div>
                  </div>
                  
                  <div class="camera-footer">
                    <span class="camera-location">{{ camera.location }}</span>
                    <el-switch
                      v-model="camera.detecting"
                      :disabled="camera.status === 'offline'"
                      active-text="检测"
                      size="small"
                    />
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>

          <!-- 右侧：预警信息列表 -->
          <el-col :span="8">
            <el-card class="alert-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <span>实时预警信息</span>
                  <el-badge :value="alertList.filter(a => !a.handled).length" type="danger" />
                </div>
              </template>
              
              <div class="alert-list">
                <el-empty v-if="alertList.length === 0" description="暂无预警信息" />
                
                <div
                  v-for="alert in alertList.slice(0, 10)"
                  :key="alert.id"
                  class="alert-item"
                  :class="{ handled: alert.handled }"
                  @click="handleAlert(alert)"
                >
                  <div class="alert-header">
                    <el-tag :type="personTypeConfig[alert.personType].color" size="small">
                      {{ personTypeConfig[alert.personType].label }}
                    </el-tag>
                    <span class="alert-time">{{ alert.time.toLocaleTimeString('zh-CN') }}</span>
                  </div>
                  
                  <div class="alert-content">
                    <el-avatar :src="alert.snapshot" :size="50" />
                    <div class="alert-info">
                      <div class="alert-person">{{ alert.personName }}</div>
                      <div class="alert-location">
                        <i class="el-icon-location"></i>
                        {{ alert.location }}
                      </div>
                    </div>
                  </div>
                  
                  <div class="alert-footer">
                    <el-tag v-if="alert.handled" type="success" size="small">已处理</el-tag>
                    <el-tag v-else type="danger" size="small" effect="dark">待处理</el-tag>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 人脸库管理 -->
      <div v-show="activeTab === 'person'" class="person-view">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>人脸库管理</span>
              <div class="header-actions">
                <el-button type="primary" @click="handleAddPerson">添加人员</el-button>
                <el-upload
                  action="#"
                  :show-file-list="false"
                  :on-change="handleImport"
                  accept=".xlsx,.xls"
                  :auto-upload="false"
                >
                  <el-button type="success">批量导入</el-button>
                </el-upload>
                <el-button type="warning" @click="handleExport">批量导出</el-button>
              </div>
            </div>
          </template>

          <!-- 筛选条件 -->
          <div class="filter-bar">
            <el-select v-model="personTypeFilter" placeholder="人员类型" clearable style="width: 150px">
              <el-option label="白名单" value="whitelist" />
              <el-option label="黑名单" value="blacklist" />
              <el-option label="访客" value="visitor" />
              <el-option label="员工" value="employee" />
            </el-select>
            <el-select v-model="personStatusFilter" placeholder="状态" clearable style="width: 120px">
              <el-option label="启用" value="active" />
              <el-option label="禁用" value="inactive" />
            </el-select>
          </div>

          <!-- 人员列表 -->
          <el-table :data="filteredPersonList" :loading="personTableLoading" stripe>
            <el-table-column prop="avatar" label="人脸图片" width="100">
              <template #default="{ row }">
                <el-avatar :src="row.avatar" :size="50" />
              </template>
            </el-table-column>
            <el-table-column prop="name" label="姓名" width="120" />
            <el-table-column prop="type" label="人员类型" width="120">
              <template #default="{ row }">
                <el-tag :type="personTypeConfig[row.type].color">
                  {{ personTypeConfig[row.type].label }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="department" label="部门" width="120" />
            <el-table-column prop="registerTime" label="注册时间" width="180" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'info'">
                  {{ row.status === 'active' ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" link @click="handleEditPerson(row)">
                  编辑
                </el-button>
                <el-button type="success" size="small" link @click="viewTrajectory(row.id)">
                  轨迹
                </el-button>
                <el-button type="danger" size="small" link @click="handleDeletePerson(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>

      <!-- 黑名单预警 -->
      <div v-show="activeTab === 'alert'" class="alert-view">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>黑名单预警记录</span>
              <el-badge :value="alertList.filter(a => !a.handled).length" type="danger" />
            </div>
          </template>

          <el-table :data="alertList" :loading="alertListLoading" stripe>
            <el-table-column prop="snapshot" label="人脸图片" width="100">
              <template #default="{ row }">
                <el-avatar :src="row.snapshot" :size="50" />
              </template>
            </el-table-column>
            <el-table-column prop="personName" label="人员姓名" width="120" />
            <el-table-column prop="personType" label="人员类型" width="120">
              <template #default="{ row }">
                <el-tag :type="personTypeConfig[row.personType].color">
                  {{ personTypeConfig[row.personType].label }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="location" label="预警位置" width="150" />
            <el-table-column prop="cameraName" label="摄像头" width="120" />
            <el-table-column prop="time" label="预警时间" width="180">
              <template #default="{ row }">
                {{ row.time.toLocaleString('zh-CN') }}
              </template>
            </el-table-column>
            <el-table-column prop="handled" label="处理状态" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.handled" type="success">已处理</el-tag>
                <el-tag v-else type="danger">待处理</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="handler" label="处理人" width="100" />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" link @click="handleAlert(row)">
                  {{ row.handled ? '查看' : '处理' }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>

      <!-- 人员轨迹分析 -->
      <div v-show="activeTab === 'trajectory'" class="trajectory-view">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>人员轨迹分析</span>
              <el-button type="primary" @click="exportTrajectory">导出轨迹</el-button>
            </div>
          </template>

          <!-- 筛选条件 -->
          <div class="filter-bar">
            <el-select
              v-model="selectedPersonForTrajectory"
              placeholder="选择人员"
              clearable
              style="width: 200px"
            >
              <el-option
                v-for="person in personList"
                :key="person.id"
                :label="person.name"
                :value="person.id"
              />
            </el-select>
            <el-date-picker
              v-model="trajectoryTimeRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              style="width: 400px"
            />
          </div>

          <!-- 轨迹时间线 -->
          <div class="trajectory-timeline">
            <el-empty v-if="filteredTrajectoryList.length === 0" description="暂无轨迹数据" />
            
            <el-timeline v-else>
              <el-timeline-item
                v-for="trajectory in filteredTrajectoryList"
                :key="trajectory.id"
                :timestamp="trajectory.time.toLocaleString('zh-CN')"
                placement="top"
              >
                <el-card>
                  <div class="trajectory-item">
                    <el-avatar :src="trajectory.snapshot" :size="60" />
                    <div class="trajectory-info">
                      <h4>{{ trajectory.personName }}</h4>
                      <p>
                        <i class="el-icon-video-camera"></i>
                        {{ trajectory.cameraName }}
                      </p>
                      <p>
                        <i class="el-icon-location"></i>
                        {{ trajectory.location }}
                      </p>
                    </div>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 人员信息对话框 -->
    <el-dialog
      v-model="personDialogVisible"
      :title="currentPerson.id ? '编辑人员' : '添加人员'"
      width="500px"
    >
      <el-form :model="currentPerson" label-width="100px">
        <el-form-item label="姓名">
          <el-input v-model="currentPerson.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="人员类型">
          <el-select v-model="currentPerson.type" placeholder="请选择人员类型" style="width: 100%">
            <el-option label="白名单" value="whitelist" />
            <el-option label="黑名单" value="blacklist" />
            <el-option label="访客" value="visitor" />
            <el-option label="员工" value="employee" />
          </el-select>
        </el-form-item>
        <el-form-item label="部门">
          <el-input v-model="currentPerson.department" placeholder="请输入部门" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="currentPerson.status">
            <el-radio value="active">启用</el-radio>
            <el-radio value="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="人脸图片">
          <el-upload
            action="#"
            list-type="picture-card"
            :auto-upload="false"
            :limit="1"
          >
            <i class="el-icon-plus"></i>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="personDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSavePerson">保存</el-button>
      </template>
    </el-dialog>

    <!-- 预警处理对话框 -->
    <el-dialog
      v-model="alertDialogVisible"
      title="预警详情"
      width="600px"
    >
      <div v-if="currentAlert" class="alert-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="人员姓名">
            {{ currentAlert.personName }}
          </el-descriptions-item>
          <el-descriptions-item label="人员类型">
            <el-tag :type="personTypeConfig[currentAlert.personType].color">
              {{ personTypeConfig[currentAlert.personType].label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="预警位置">
            {{ currentAlert.location }}
          </el-descriptions-item>
          <el-descriptions-item label="摄像头">
            {{ currentAlert.cameraName }}
          </el-descriptions-item>
          <el-descriptions-item label="预警时间" :span="2">
            {{ currentAlert.time.toLocaleString('zh-CN') }}
          </el-descriptions-item>
          <el-descriptions-item label="现场画面" :span="2">
            <el-image :src="currentAlert.snapshot" style="width: 200px; height: 200px" fit="cover" />
          </el-descriptions-item>
          <el-descriptions-item v-if="currentAlert.handled" label="处理人">
            {{ currentAlert.handler }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentAlert.handled" label="处理状态">
            <el-tag type="success">已处理</el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentAlert.handled" label="处理反馈" :span="2">
            {{ currentAlert.feedback }}
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="!currentAlert.handled" class="alert-handle-form">
          <el-divider />
          <el-form>
            <el-form-item label="处理反馈">
              <el-input
                v-model="currentAlert.feedback"
                type="textarea"
                :rows="4"
                placeholder="请输入处理反馈"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>
      <template #footer>
        <el-button @click="alertDialogVisible = false">关闭</el-button>
        <el-button
          v-if="currentAlert && !currentAlert.handled"
          type="primary"
          @click="submitAlertHandle(currentAlert.feedback || '')"
        >
          确认处理
        </el-button>
      </template>
    </el-dialog>

    <!-- 识别配置对话框 -->
    <el-dialog
      v-model="configDialogVisible"
      title="识别配置"
      width="600px"
    >
      <el-form :model="recognitionConfig" label-width="120px">
        <el-form-item label="识别敏感度">
          <el-slider v-model="recognitionConfig.sensitivity" :min="0" :max="100" show-input />
          <span class="form-item-tip">敏感度越高，检测速度越快，但可能误报率增加</span>
        </el-form-item>
        <el-form-item label="识别准确度">
          <el-slider v-model="recognitionConfig.accuracy" :min="0" :max="100" show-input />
          <span class="form-item-tip">准确度越高，识别更精准，但处理时间可能增加</span>
        </el-form-item>
        <el-form-item label="最小置信度">
          <el-slider v-model="recognitionConfig.minConfidence" :min="0" :max="100" show-input />
          <span class="form-item-tip">低于此置信度的识别结果将被忽略</span>
        </el-form-item>
        <el-form-item label="声音预警">
          <el-switch v-model="recognitionConfig.alertSound" />
        </el-form-item>
        <el-form-item label="消息推送">
          <el-switch v-model="recognitionConfig.alertMessage" />
        </el-form-item>
        <el-form-item label="自动抓拍">
          <el-switch v-model="recognitionConfig.autoCapture" />
          <span class="form-item-tip">检测到人脸时自动保存抓拍图片</span>
        </el-form-item>
        <el-form-item>
          <el-button type="warning" @click="testRecognition">测试识别效果</el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="configDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveConfig">保存配置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.face-recognition-container {
  min-height: calc(100vh - 120px);

  .toolbar-card {
    margin-bottom: 20px;

    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .toolbar-left {
        flex: 1;
      }

      .toolbar-right {
        display: flex;
        gap: 10px;
      }
    }
  }

  .main-content {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-actions {
        display: flex;
        gap: 10px;
      }

      .layout-switch {
        margin-left: auto;
      }
    }

    .filter-bar {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }
  }

  // 实时监控样式
  .monitor-view {
    .monitor-card {
      margin-bottom: 20px;
    }

    .camera-grid {
      display: grid;
      gap: 10px;

      &.grid-2x2 {
        grid-template-columns: repeat(2, 1fr);
      }

      &.grid-3x3 {
        grid-template-columns: repeat(3, 1fr);
      }

      &.grid-4x4 {
        grid-template-columns: repeat(4, 1fr);
      }

      .camera-item {
        border: 1px solid #dcdfe6;
        border-radius: 4px;
        overflow: hidden;
        background: #fff;

        &.offline {
          opacity: 0.6;
        }

        .camera-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          background: #f5f7fa;
          border-bottom: 1px solid #dcdfe6;

          .camera-name {
            font-weight: bold;
            font-size: 14px;
          }
        }

        .camera-view {
          position: relative;
          width: 100%;
          padding-bottom: 75%; // 4:3 宽高比
          background-image: url('https://img2.baidu.com/it/u=3945764719,3280546007&fm=253&fmt=auto?w=710&h=393');

          .video-placeholder {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: #909399;
            font-size: 48px;

            p {
              margin-top: 10px;
              font-size: 14px;
            }
          }

          .face-box {
            position: absolute;
            border: 3px solid;
            border-radius: 4px;
            box-sizing: border-box;
            transition: all 0.3s ease;

            &.face-box-employee {
              border-color: #f0ad4e;
            }

            &.face-box-whitelist {
              border-color: #67c23a;
            }

            &.face-box-blacklist {
              border-color: #f56c6c;
              animation: blink 1s infinite;
            }

            &.face-box-visitor {
              border-color: #409eff;
            }

            .face-info {
              position: absolute;
              bottom: -60px;
              left: 0;
              background: rgba(0, 0, 0, 0.8);
              color: #fff;
              padding: 5px 10px;
              border-radius: 4px;
              font-size: 12px;
              white-space: nowrap;
              z-index: 10;

              .face-name {
                font-weight: bold;
                margin-bottom: 2px;
              }

              .face-confidence {
                margin-bottom: 5px;
              }
            }
          }

          @keyframes blink {
            0%, 100% {
              border-color: #f56c6c;
            }
            50% {
              border-color: #fff;
            }
          }
        }

        .camera-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          background: #f5f7fa;
          border-top: 1px solid #dcdfe6;

          .camera-location {
            font-size: 12px;
            color: #606266;
          }
        }
      }
    }

    .alert-card {
      height: calc(100vh - 260px);

      .alert-list {
        height: calc(100vh - 340px);
        overflow-y: auto;

        .alert-item {
          padding: 15px;
          margin-bottom: 10px;
          border: 1px solid #dcdfe6;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s ease;

          &:hover {
            background: #f5f7fa;
            border-color: #409eff;
          }

          &.handled {
            opacity: 0.6;
          }

          .alert-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;

            .alert-time {
              font-size: 12px;
              color: #909399;
            }
          }

          .alert-content {
            display: flex;
            gap: 15px;
            margin-bottom: 10px;

            .alert-info {
              flex: 1;

              .alert-person {
                font-weight: bold;
                font-size: 16px;
                margin-bottom: 5px;
              }

              .alert-location {
                font-size: 14px;
                color: #606266;

                i {
                  margin-right: 5px;
                }
              }
            }
          }

          .alert-footer {
            display: flex;
            justify-content: flex-end;
          }
        }
      }
    }
  }

  // 人员管理样式
  .person-view {
    .filter-bar {
      margin-bottom: 20px;
    }
  }

  // 轨迹分析样式
  .trajectory-view {
    .filter-bar {
      margin-bottom: 30px;
    }

    .trajectory-timeline {
      padding: 20px;

      .trajectory-item {
        display: flex;
        gap: 20px;

        .trajectory-info {
          flex: 1;

          h4 {
            margin: 0 0 10px 0;
            font-size: 16px;
          }

          p {
            margin: 5px 0;
            color: #606266;
            font-size: 14px;

            i {
              margin-right: 5px;
            }
          }
        }
      }
    }
  }

  // 对话框样式
  .alert-detail {
    .alert-handle-form {
      margin-top: 20px;
    }
  }

  .form-item-tip {
    display: block;
    margin-top: 5px;
    font-size: 12px;
    color: #909399;
  }
}
</style>