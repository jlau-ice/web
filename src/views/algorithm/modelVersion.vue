<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'

// 版本状态类型
interface ModelVersion {
  id: string
  versionNumber: string
  modelName: string
  description: string
  accuracy: number
  recall: number
  f1Score: number
  createTime: string
  status: 'production' | 'testing' | 'history' | 'deprecated'
  modelFile: string
  fileSize: string
  trainingData: string
  parameters: Record<string, any>
  performanceMetrics: {
    accuracy: number
    precision: number
    recall: number
    f1Score: number
    auc: number
  }
  deployEnv?: string[]
  releaseNotes?: string
}

// 版本树节点类型
interface VersionTreeNode {
  id: string
  label: string
  children?: VersionTreeNode[]
}

// 操作日志类型
interface OperationLog {
  id: string
  action: string
  versionFrom: string
  versionTo: string
  operator: string
  time: string
  status: 'success' | 'failed'
}

// 数据状态
const loading = ref(false)
const tableData = ref<ModelVersion[]>([])
const filteredData = ref<ModelVersion[]>([])
const selectedVersions = ref<string[]>([])
const currentVersion = ref<ModelVersion | null>(null)
const compareVersions = ref<ModelVersion[]>([])

// 树形数据
const treeData = ref<VersionTreeNode[]>([])
const selectedModel = ref<string>('')

// 对话框状态
const detailDialogVisible = ref(false)
const compareDialogVisible = ref(false)
const releaseDialogVisible = ref(false)
const switchDialogVisible = ref(false)

// 筛选条件
const filterForm = reactive({
  modelName: '',
  status: '',
  versionNumber: ''
})

// 发布表单
const releaseForm = reactive({
  versionId: '',
  environment: [] as string[],
  scope: '',
  notes: ''
})

// 操作日志
const operationLogs = ref<OperationLog[]>([])

// 状态选项
const statusOptions = [
  { label: '生产版本', value: 'production' },
  { label: '测试版本', value: 'testing' },
  { label: '历史版本', value: 'history' },
  { label: '废弃版本', value: 'deprecated' }
]

// 环境选项
const envOptions = ['开发环境', '测试环境', '预发布环境', '生产环境']

// 状态标签配置
const getStatusTag = (status: string) => {
  const config = {
    production: { type: 'success', text: '生产版本' },
    testing: { type: 'primary', text: '测试版本' },
    history: { type: 'info', text: '历史版本' },
    deprecated: { type: 'danger', text: '废弃版本' }
  }
  return config[status as keyof typeof config] || config.history
}

// Mock 数据生成
const generateMockData = (): ModelVersion[] => {
  const models = ['语音识别模型', '图像识别模型', '文本分类模型', '目标检测模型']
  const versions: ModelVersion[] = []
  
  models.forEach((modelName, modelIndex) => {
    for (let i = 5; i >= 1; i--) {
      const versionNum = `v${modelIndex + 1}.${i}.0`
      const statusList: Array<'production' | 'testing' | 'history' | 'deprecated'> = 
        i === 5 ? ['production'] : i === 4 ? ['testing'] : i === 1 ? ['deprecated'] : ['history']
      
      versions.push({
        id: `${modelIndex + 1}-${i}`,
        versionNumber: versionNum,
        modelName,
        description: `${modelName}的第${i}次迭代版本，优化了算法性能和准确度`,
        accuracy: 85 + Math.random() * 10,
        recall: 80 + Math.random() * 15,
        f1Score: 82 + Math.random() * 12,
        createTime: new Date(2024, 9 - modelIndex, 15 + i).toLocaleString('zh-CN'),
        status: statusList[0],
        modelFile: `${modelName.replace(/模型/g, '')}_${versionNum}.pth`,
        fileSize: `${(50 + Math.random() * 200).toFixed(2)} MB`,
        trainingData: `训练集${1000 + i * 200}条，验证集${200 + i * 50}条`,
        parameters: {
          learningRate: 0.001,
          batchSize: 32,
          epochs: 100 + i * 10,
          optimizer: 'Adam',
          lossFunction: 'CrossEntropy'
        },
        performanceMetrics: {
          accuracy: 85 + Math.random() * 10,
          precision: 83 + Math.random() * 12,
          recall: 80 + Math.random() * 15,
          f1Score: 82 + Math.random() * 12,
          auc: 0.88 + Math.random() * 0.1
        },
        deployEnv: i === 5 ? ['生产环境'] : i === 4 ? ['测试环境'] : [],
        releaseNotes: `版本${versionNum}更新说明：\n1. 优化模型结构\n2. 提升识别准确率\n3. 减少推理时间`
      })
    }
  })
  
  return versions
}

// 生成树形数据
const generateTreeData = (data: ModelVersion[]): VersionTreeNode[] => {
  const modelMap = new Map<string, ModelVersion[]>()
  
  data.forEach(version => {
    if (!modelMap.has(version.modelName)) {
      modelMap.set(version.modelName, [])
    }
    modelMap.get(version.modelName)!.push(version)
  })
  
  const tree: VersionTreeNode[] = []
  modelMap.forEach((versions, modelName) => {
    tree.push({
      id: modelName,
      label: `${modelName} (${versions.length})`,
      children: versions.map(v => ({
        id: v.id,
        label: `${v.versionNumber} - ${getStatusTag(v.status).text}`
      }))
    })
  })
  
  return tree
}

// 生成操作日志
const generateOperationLogs = (): OperationLog[] => {
  return [
    {
      id: '1',
      action: '版本切换',
      versionFrom: 'v1.4.0',
      versionTo: 'v1.5.0',
      operator: '张三',
      time: new Date().toLocaleString('zh-CN'),
      status: 'success'
    },
    {
      id: '2',
      action: '版本发布',
      versionFrom: '-',
      versionTo: 'v2.4.0',
      operator: '李四',
      time: new Date(Date.now() - 3600000).toLocaleString('zh-CN'),
      status: 'success'
    },
    {
      id: '3',
      action: '版本回滚',
      versionFrom: 'v1.5.0',
      versionTo: 'v1.4.0',
      operator: '王五',
      time: new Date(Date.now() - 7200000).toLocaleString('zh-CN'),
      status: 'failed'
    }
  ]
}

// 加载数据
const loadData = () => {
  loading.value = true
  setTimeout(() => {
    tableData.value = generateMockData()
    filteredData.value = tableData.value
    treeData.value = generateTreeData(tableData.value)
    operationLogs.value = generateOperationLogs()
    loading.value = false
    ElMessage.success('数据加载成功')
  }, 800)
}

// 筛选数据
const handleFilter = () => {
  filteredData.value = tableData.value.filter(item => {
    const matchModel = !filterForm.modelName || item.modelName.includes(filterForm.modelName)
    const matchStatus = !filterForm.status || item.status === filterForm.status
    const matchVersion = !filterForm.versionNumber || item.versionNumber.includes(filterForm.versionNumber)
    return matchModel && matchStatus && matchVersion
  })
}

// 重置筛选
const handleReset = () => {
  filterForm.modelName = ''
  filterForm.status = ''
  filterForm.versionNumber = ''
  filteredData.value = tableData.value
}

// 查看详情
const handleViewDetail = (row: ModelVersion) => {
  currentVersion.value = row
  detailDialogVisible.value = true
}

// 版本切换
const handleSwitch = (row: ModelVersion) => {
  ElMessageBox.confirm(
    `确认要将模型切换到版本 ${row.versionNumber} 吗？`,
    '版本切换确认',
    {
      confirmButtonText: '确认切换',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    loading.value = true
    setTimeout(() => {
      // 更新状态
      tableData.value.forEach(item => {
        if (item.modelName === row.modelName) {
          item.status = item.id === row.id ? 'production' : 'history'
        }
      })
      
      // 添加操作日志
      operationLogs.value.unshift({
        id: Date.now().toString(),
        action: '版本切换',
        versionFrom: tableData.value.find(v => v.modelName === row.modelName && v.status === 'production')?.versionNumber || '-',
        versionTo: row.versionNumber,
        operator: '当前用户',
        time: new Date().toLocaleString('zh-CN'),
        status: 'success'
      })
      
      loading.value = false
      ElMessage.success(`已成功切换到版本 ${row.versionNumber}`)
      handleFilter()
    }, 1000)
  }).catch(() => {
    ElMessage.info('已取消切换')
  })
}

// 版本回滚
const handleRollback = (row: ModelVersion) => {
  ElMessageBox.confirm(
    `确认要回滚到版本 ${row.versionNumber} 吗？此操作会将当前生产版本降级。`,
    '版本回滚确认',
    {
      confirmButtonText: '确认回滚',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    loading.value = true
    setTimeout(() => {
      ElMessage.success(`已成功回滚到版本 ${row.versionNumber}`)
      loading.value = false
      handleSwitch(row)
    }, 1000)
  }).catch(() => {
    ElMessage.info('已取消回滚')
  })
}

// 选择对比版本
const handleSelectionChange = (selection: ModelVersion[]) => {
  selectedVersions.value = selection.map(item => item.id)
}

// 开始对比
const handleCompare = () => {
  if (selectedVersions.value.length !== 2) {
    ElMessage.warning('请选择两个版本进行对比')
    return
  }
  
  compareVersions.value = tableData.value.filter(item => 
    selectedVersions.value.includes(item.id)
  )
  compareDialogVisible.value = true
}

// 版本发布
const handleRelease = (row: ModelVersion) => {
  releaseForm.versionId = row.id
  releaseForm.environment = []
  releaseForm.scope = ''
  releaseForm.notes = ''
  releaseDialogVisible.value = true
}

// 提交发布
const submitRelease = () => {
  if (releaseForm.environment.length === 0) {
    ElMessage.warning('请选择发布环境')
    return
  }
  
  loading.value = true
  setTimeout(() => {
    const version = tableData.value.find(v => v.id === releaseForm.versionId)
    if (version) {
      version.status = releaseForm.environment.includes('生产环境') ? 'production' : 'testing'
      version.deployEnv = releaseForm.environment
    }
    
    loading.value = false
    releaseDialogVisible.value = false
    ElMessage.success('版本发布成功')
    handleFilter()
  }, 1000)
}

// 树节点点击
const handleTreeNodeClick = (data: VersionTreeNode) => {
  if (data.children) {
    // 点击模型节点，筛选该模型的所有版本
    filterForm.modelName = data.label.split(' (')[0]
    handleFilter()
  } else {
    // 点击版本节点，查看详情
    const version = tableData.value.find(v => v.id === data.id)
    if (version) {
      handleViewDetail(version)
    }
  }
}

// 下载文档
const handleDownload = (version: ModelVersion) => {
  ElMessage.success(`正在下载 ${version.versionNumber} 版本文档...`)
}

// 计算性能差异
const getMetricDiff = (metric: string) => {
  if (compareVersions.value.length !== 2) return 0
  const metrics1 = compareVersions.value[0].performanceMetrics
  const metrics2 = compareVersions.value[1].performanceMetrics
  const v1 = metrics1[metric as keyof typeof metrics1]
  const v2 = metrics2[metric as keyof typeof metrics2]
  return ((v2 - v1) / v1 * 100).toFixed(2)
}

// 组件挂载
onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="model-version-container">
    <!-- 顶部筛选区 -->
    <el-card class="filter-card" shadow="never">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input
            v-model="filterForm.modelName"
            placeholder="搜索模型名称"
            clearable
            @clear="handleFilter"
          />
        </el-col>
        <el-col :span="5">
          <el-input
            v-model="filterForm.versionNumber"
            placeholder="搜索版本号"
            clearable
            @clear="handleFilter"
          />
        </el-col>
        <el-col :span="5">
          <el-select
            v-model="filterForm.status"
            placeholder="选择状态"
            clearable
            style="width: 100%"
            @clear="handleFilter"
          >
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-col>
        <el-col :span="8">
          <el-button type="primary" @click="handleFilter">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button 
            type="success" 
            @click="handleCompare"
            :disabled="selectedVersions.length !== 2"
          >
            版本对比
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 主体内容区 -->
    <div class="main-content">
      <!-- 左侧版本树 -->
      <el-card class="tree-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>模型版本树</span>
          </div>
        </template>
        <el-tree
          :data="treeData"
          :props="{ children: 'children', label: 'label' }"
          default-expand-all
          @node-click="handleTreeNodeClick"
        >
          <template #default="{ node }">
            <span class="custom-tree-node">
              <span>{{ node.label }}</span>
            </span>
          </template>
        </el-tree>
      </el-card>

      <!-- 中间版本列表 -->
      <el-card class="table-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>版本列表</span>
            <el-tag>共 {{ filteredData.length }} 个版本</el-tag>
          </div>
        </template>
        
        <el-table
          :data="filteredData"
          v-loading="loading"
          stripe
          @selection-change="handleSelectionChange"
          style="width: 100%"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="versionNumber" label="版本号" width="120" />
          <el-table-column prop="modelName" label="模型名称" width="140" />
          <el-table-column prop="description" label="版本描述" show-overflow-tooltip />
          <el-table-column prop="accuracy" label="准确率" width="100">
            <template #default="{ row }">
              <el-progress 
                :percentage="row.accuracy" 
                :color="row.accuracy > 90 ? '#67c23a' : '#409eff'"
                :stroke-width="8"
              />
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column prop="status" label="状态" width="110">
            <template #default="{ row }">
              <el-tag :type="getStatusTag(row.status).type">
                {{ getStatusTag(row.status).text }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="280" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="handleViewDetail(row)">
                详情
              </el-button>
              <el-button 
                link 
                type="success" 
                size="small" 
                @click="handleSwitch(row)"
                v-if="row.status !== 'production' && row.status !== 'deprecated'"
              >
                切换
              </el-button>
              <el-button 
                link 
                type="warning" 
                size="small" 
                @click="handleRollback(row)"
                v-if="row.status === 'history'"
              >
                回滚
              </el-button>
              <el-button 
                link 
                type="primary" 
                size="small" 
                @click="handleRelease(row)"
                v-if="row.status === 'testing'"
              >
                发布
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 右侧操作日志 -->
      <el-card class="log-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>操作日志</span>
          </div>
        </template>
        <el-timeline>
          <el-timeline-item
            v-for="log in operationLogs"
            :key="log.id"
            :timestamp="log.time"
            placement="top"
            :color="log.status === 'success' ? '#67c23a' : '#f56c6c'"
          >
            <el-card>
              <h4>{{ log.action }}</h4>
              <p>操作人：{{ log.operator }}</p>
              <p v-if="log.versionFrom !== '-'">从版本：{{ log.versionFrom }}</p>
              <p>到版本：{{ log.versionTo }}</p>
              <el-tag :type="log.status === 'success' ? 'success' : 'danger'" size="small">
                {{ log.status === 'success' ? '成功' : '失败' }}
              </el-tag>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </el-card>
    </div>

    <!-- 版本详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="版本详细信息"
      width="60%"
      destroy-on-close
    >
      <div v-if="currentVersion">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="版本号">
            {{ currentVersion.versionNumber }}
          </el-descriptions-item>
          <el-descriptions-item label="模型名称">
            {{ currentVersion.modelName }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTag(currentVersion.status).type">
              {{ getStatusTag(currentVersion.status).text }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ currentVersion.createTime }}
          </el-descriptions-item>
          <el-descriptions-item label="模型文件">
            {{ currentVersion.modelFile }}
          </el-descriptions-item>
          <el-descriptions-item label="文件大小">
            {{ currentVersion.fileSize }}
          </el-descriptions-item>
          <el-descriptions-item label="训练数据" :span="2">
            {{ currentVersion.trainingData }}
          </el-descriptions-item>
          <el-descriptions-item label="版本描述" :span="2">
            {{ currentVersion.description }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">性能指标</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="metric-item">
              <span class="metric-label">准确率 (Accuracy)</span>
              <el-progress 
                :percentage="currentVersion.performanceMetrics.accuracy" 
                :stroke-width="15"
                :color="'#67c23a'"
              >
                <span class="metric-value">{{ currentVersion.performanceMetrics.accuracy.toFixed(2) }}%</span>
              </el-progress>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="metric-item">
              <span class="metric-label">精确率 (Precision)</span>
              <el-progress 
                :percentage="currentVersion.performanceMetrics.precision" 
                :stroke-width="15"
                :color="'#409eff'"
              >
                <span class="metric-value">{{ currentVersion.performanceMetrics.precision.toFixed(2) }}%</span>
              </el-progress>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="metric-item">
              <span class="metric-label">召回率 (Recall)</span>
              <el-progress 
                :percentage="currentVersion.performanceMetrics.recall" 
                :stroke-width="15"
                :color="'#e6a23c'"
              >
                <span class="metric-value">{{ currentVersion.performanceMetrics.recall.toFixed(2) }}%</span>
              </el-progress>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="metric-item">
              <span class="metric-label">F1分数 (F1-Score)</span>
              <el-progress 
                :percentage="currentVersion.performanceMetrics.f1Score" 
                :stroke-width="15"
                :color="'#f56c6c'"
              >
                <span class="metric-value">{{ currentVersion.performanceMetrics.f1Score.toFixed(2) }}%</span>
              </el-progress>
            </div>
          </el-col>
        </el-row>

        <el-divider content-position="left">参数配置</el-divider>
        <el-descriptions :column="2" border>
          <el-descriptions-item 
            v-for="(value, key) in currentVersion.parameters" 
            :key="key"
            :label="key"
          >
            {{ value }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">版本说明</el-divider>
        <el-alert
          :title="currentVersion.releaseNotes || '暂无版本说明'"
          type="info"
          :closable="false"
          show-icon
          style="white-space: pre-line;"
        />
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button 
          type="primary" 
          @click="currentVersion && handleDownload(currentVersion)"
        >
          下载文档
        </el-button>
      </template>
    </el-dialog>

    <!-- 版本对比对话框 -->
    <el-dialog
      v-model="compareDialogVisible"
      title="版本对比分析"
      width="70%"
      destroy-on-close
    >
      <div v-if="compareVersions.length === 2">
        <el-alert
          title="版本对比"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        >
          <template #default>
            对比版本：
            <el-tag style="margin: 0 10px">{{ compareVersions[0].versionNumber }}</el-tag>
            vs
            <el-tag style="margin: 0 10px">{{ compareVersions[1].versionNumber }}</el-tag>
          </template>
        </el-alert>

        <el-divider content-position="left">基本信息对比</el-divider>
        <el-table :data="[
          { 
            item: '版本号', 
            v1: compareVersions[0].versionNumber, 
            v2: compareVersions[1].versionNumber 
          },
          { 
            item: '模型名称', 
            v1: compareVersions[0].modelName, 
            v2: compareVersions[1].modelName 
          },
          { 
            item: '创建时间', 
            v1: compareVersions[0].createTime, 
            v2: compareVersions[1].createTime 
          },
          { 
            item: '文件大小', 
            v1: compareVersions[0].fileSize, 
            v2: compareVersions[1].fileSize 
          },
          { 
            item: '状态', 
            v1: getStatusTag(compareVersions[0].status).text, 
            v2: getStatusTag(compareVersions[1].status).text 
          }
        ]" border>
          <el-table-column prop="item" label="对比项" width="150" />
          <el-table-column prop="v1" :label="compareVersions[0].versionNumber" />
          <el-table-column prop="v2" :label="compareVersions[1].versionNumber" />
        </el-table>

        <el-divider content-position="left">性能指标对比</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card>
              <template #header>
                <span>{{ compareVersions[0].versionNumber }}</span>
              </template>
              <div class="compare-metrics">
                <div class="metric-row">
                  <span>准确率：</span>
                  <el-progress 
                    :percentage="compareVersions[0].performanceMetrics.accuracy"
                    :stroke-width="10"
                  />
                </div>
                <div class="metric-row">
                  <span>精确率：</span>
                  <el-progress 
                    :percentage="compareVersions[0].performanceMetrics.precision"
                    :stroke-width="10"
                  />
                </div>
                <div class="metric-row">
                  <span>召回率：</span>
                  <el-progress 
                    :percentage="compareVersions[0].performanceMetrics.recall"
                    :stroke-width="10"
                  />
                </div>
                <div class="metric-row">
                  <span>F1分数：</span>
                  <el-progress 
                    :percentage="compareVersions[0].performanceMetrics.f1Score"
                    :stroke-width="10"
                  />
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <template #header>
                <span>{{ compareVersions[1].versionNumber }}</span>
              </template>
              <div class="compare-metrics">
                <div class="metric-row">
                  <span>准确率：</span>
                  <el-progress 
                    :percentage="compareVersions[1].performanceMetrics.accuracy"
                    :stroke-width="10"
                  />
                </div>
                <div class="metric-row">
                  <span>精确率：</span>
                  <el-progress 
                    :percentage="compareVersions[1].performanceMetrics.precision"
                    :stroke-width="10"
                  />
                </div>
                <div class="metric-row">
                  <span>召回率：</span>
                  <el-progress 
                    :percentage="compareVersions[1].performanceMetrics.recall"
                    :stroke-width="10"
                  />
                </div>
                <div class="metric-row">
                  <span>F1分数：</span>
                  <el-progress 
                    :percentage="compareVersions[1].performanceMetrics.f1Score"
                    :stroke-width="10"
                  />
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-divider content-position="left">差异分析</el-divider>
        <el-alert
          title="性能提升分析"
          type="success"
          :closable="false"
          show-icon
        >
          <template #default>
            <div class="diff-analysis">
              <p>准确率变化：<el-tag>{{ getMetricDiff('accuracy') }}%</el-tag></p>
              <p>精确率变化：<el-tag>{{ getMetricDiff('precision') }}%</el-tag></p>
              <p>召回率变化：<el-tag>{{ getMetricDiff('recall') }}%</el-tag></p>
              <p>F1分数变化：<el-tag>{{ getMetricDiff('f1Score') }}%</el-tag></p>
            </div>
          </template>
        </el-alert>
      </div>
      <template #footer>
        <el-button @click="compareDialogVisible = false">关闭</el-button>
        <el-button type="primary">导出对比报告</el-button>
      </template>
    </el-dialog>

    <!-- 版本发布对话框 -->
    <el-dialog
      v-model="releaseDialogVisible"
      title="版本发布管理"
      width="50%"
      destroy-on-close
    >
      <el-form :model="releaseForm" label-width="100px">
        <el-form-item label="发布环境">
          <el-checkbox-group v-model="releaseForm.environment">
            <el-checkbox 
              v-for="env in envOptions" 
              :key="env" 
              :label="env"
            >
              {{ env }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="发布范围">
          <el-input 
            v-model="releaseForm.scope" 
            placeholder="例如：全量发布 / 灰度发布10%"
          />
        </el-form-item>
        <el-form-item label="发布说明">
          <el-input
            v-model="releaseForm.notes"
            type="textarea"
            :rows="4"
            placeholder="请输入发布说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="releaseDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRelease">确认发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.model-version-container {
  min-height: calc(100vh - 100px);

  .filter-card {
    margin-bottom: 20px;
  }

  .main-content {
    display: grid;
    grid-template-columns: 280px 1fr 320px;
    gap: 20px;
    align-items: start;

    .tree-card {
      max-height: calc(100vh - 220px);
      overflow-y: auto;

      .custom-tree-node {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 14px;
        padding-right: 8px;
      }
    }

    .table-card {
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
    }

    .log-card {
      max-height: calc(100vh - 220px);
      overflow-y: auto;

      .el-timeline {
        padding-left: 10px;
      }

      .el-card {
        padding: 10px;

        h4 {
          margin: 0 0 10px 0;
          font-size: 14px;
        }

        p {
          margin: 5px 0;
          font-size: 12px;
          color: #666;
        }
      }
    }
  }

  .metric-item {
    margin-bottom: 20px;

    .metric-label {
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 500;
      color: #606266;
    }

    .metric-value {
      font-weight: bold;
    }
  }

  .compare-metrics {
    .metric-row {
      margin-bottom: 15px;

      span {
        display: inline-block;
        width: 80px;
        font-size: 14px;
      }

      .el-progress {
        display: inline-block;
        width: calc(100% - 90px);
      }
    }
  }

  .diff-analysis {
    p {
      margin: 10px 0;
      font-size: 14px;

      .el-tag {
        margin-left: 10px;
        font-weight: bold;
      }
    }
  }
}

// 响应式布局
@media (max-width: 1400px) {
  .model-version-container .main-content {
    grid-template-columns: 1fr;

    .tree-card,
    .log-card {
      max-height: 400px;
    }
  }
}
</style>