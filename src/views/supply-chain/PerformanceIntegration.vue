<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { ElTree } from 'element-plus'

// 类型定义
interface PerformanceIndicator {
  id: string
  name: string
  value: number
  unit: string
  target: number
  trend: 'up' | 'down' | 'stable'
  status: 'normal' | 'warning' | 'danger'
  changeRate: number
}

interface TreeNode {
  id: string
  label: string
  children?: TreeNode[]
  type?: string
  formula?: string
  weight?: number
  dataSource?: string
  status?: 'active' | 'inactive'
}

interface DataStandardRule {
  id: string
  name: string
  sourceSystem: string
  targetFormat: string
  quality: 'excellent' | 'good' | 'fair' | 'poor'
  lastProcessed: string
  recordCount: number
}

interface PerformanceModel {
  id: string
  name: string
  version: string
  indicators: string[]
  status: 'active' | 'testing' | 'archived'
  createTime: string
  accuracy: number
}

interface LineageNode {
  id: string
  name: string
  type: 'source' | 'transform' | 'indicator'
  children?: LineageNode[]
}

// 响应式数据
const loading = ref(false)
const activeTab = ref('overview')
const treeRef = ref<InstanceType<typeof ElTree>>()

// 核心绩效指标
const coreIndicators = ref<PerformanceIndicator[]>([])

// 指标分类树
const indicatorTree = ref<TreeNode[]>([])
const selectedNode = ref<TreeNode | null>(null)

// 数据标准化规则
const standardRules = ref<DataStandardRule[]>([])

// 绩效模型
const performanceModels = ref<PerformanceModel[]>([])
const selectedModel = ref<PerformanceModel | null>(null)

// 数据血缘
const lineageData = ref<LineageNode[]>([])

// 对话框控制
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const indicatorForm = reactive({
  name: '',
  type: '',
  formula: '',
  weight: 50,
  dataSource: '',
  status: 'active' as 'active' | 'inactive'
})

// 模型配置对话框
const modelDialogVisible = ref(false)
const modelForm = reactive({
  name: '',
  version: '',
  indicators: [] as string[],
  status: 'testing' as 'active' | 'testing' | 'archived'
})

// 数据处理监控
const dataProcessStats = reactive({
  totalRecords: 0,
  processedRecords: 0,
  errorRecords: 0,
  processingRate: 0
})

// 计算属性
const processingProgress = computed(() => {
  if (dataProcessStats.totalRecords === 0) return 0
  return Math.round((dataProcessStats.processedRecords / dataProcessStats.totalRecords) * 100)
})

// 获取指标状态类型
const getIndicatorType = (status: string) => {
  const typeMap: Record<string, 'success' | 'warning' | 'danger'> = {
    normal: 'success',
    warning: 'warning',
    danger: 'danger'
  }
  return typeMap[status] || 'info'
}

// 获取数据质量类型
const getQualityType = (quality: string) => {
  const typeMap: Record<string, 'success' | 'primary' | 'warning' | 'danger'> = {
    excellent: 'success',
    good: 'primary',
    fair: 'warning',
    poor: 'danger'
  }
  return typeMap[quality] || 'info'
}

// 获取数据质量文本
const getQualityText = (quality: string) => {
  const textMap: Record<string, string> = {
    excellent: '优质',
    good: '良好',
    fair: '一般',
    poor: '待改善'
  }
  return textMap[quality] || quality
}

// 模拟加载核心指标
const loadCoreIndicators = () => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      coreIndicators.value = [
        {
          id: '1',
          name: '订单交付周期',
          value: 3.2,
          unit: '天',
          target: 3.5,
          trend: 'up',
          status: 'normal',
          changeRate: -8.6
        },
        {
          id: '2',
          name: '库存周转率',
          value: 8.5,
          unit: '次/月',
          target: 8.0,
          trend: 'up',
          status: 'normal',
          changeRate: 6.3
        },
        {
          id: '3',
          name: '客户满意度',
          value: 92,
          unit: '%',
          target: 95,
          trend: 'down',
          status: 'warning',
          changeRate: -2.1
        },
        {
          id: '4',
          name: '准时交付率',
          value: 96.8,
          unit: '%',
          target: 98,
          trend: 'stable',
          status: 'warning',
          changeRate: 0.2
        },
        {
          id: '5',
          name: '供应商合规率',
          value: 88.5,
          unit: '%',
          target: 95,
          trend: 'down',
          status: 'danger',
          changeRate: -5.2
        },
        {
          id: '6',
          name: '成本节约率',
          value: 12.3,
          unit: '%',
          target: 10,
          trend: 'up',
          status: 'normal',
          changeRate: 15.7
        }
      ]
      resolve()
    }, 800)
  })
}

// 模拟加载指标树
const loadIndicatorTree = () => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      indicatorTree.value = [
        {
          id: '1',
          label: '交付效率指标',
          children: [
            {
              id: '1-1',
              label: '订单交付周期',
              type: '时间类',
              formula: '(交付日期 - 订单日期) / 订单数',
              weight: 30,
              dataSource: 'ERP系统',
              status: 'active'
            },
            {
              id: '1-2',
              label: '准时交付率',
              type: '百分比',
              formula: '准时交付订单数 / 总订单数 × 100%',
              weight: 25,
              dataSource: 'OMS系统',
              status: 'active'
            },
            {
              id: '1-3',
              label: '订单响应时间',
              type: '时间类',
              formula: '平均响应时间',
              weight: 20,
              dataSource: 'CRM系统',
              status: 'active'
            }
          ]
        },
        {
          id: '2',
          label: '库存管理指标',
          children: [
            {
              id: '2-1',
              label: '库存周转率',
              type: '频率类',
              formula: '销售成本 / 平均库存',
              weight: 35,
              dataSource: 'WMS系统',
              status: 'active'
            },
            {
              id: '2-2',
              label: '库存准确率',
              type: '百分比',
              formula: '账实相符数 / 盘点总数 × 100%',
              weight: 30,
              dataSource: 'WMS系统',
              status: 'active'
            },
            {
              id: '2-3',
              label: '缺货率',
              type: '百分比',
              formula: '缺货SKU数 / 总SKU数 × 100%',
              weight: 25,
              dataSource: 'WMS系统',
              status: 'inactive'
            }
          ]
        },
        {
          id: '3',
          label: '质量管理指标',
          children: [
            {
              id: '3-1',
              label: '客户满意度',
              type: '评分类',
              formula: '满意度调查平均分',
              weight: 40,
              dataSource: 'CRM系统',
              status: 'active'
            },
            {
              id: '3-2',
              label: '产品合格率',
              type: '百分比',
              formula: '合格产品数 / 总产品数 × 100%',
              weight: 35,
              dataSource: 'QMS系统',
              status: 'active'
            },
            {
              id: '3-3',
              label: '退货率',
              type: '百分比',
              formula: '退货数量 / 销售数量 × 100%',
              weight: 25,
              dataSource: 'OMS系统',
              status: 'active'
            }
          ]
        },
        {
          id: '4',
          label: '供应商管理指标',
          children: [
            {
              id: '4-1',
              label: '供应商合规率',
              type: '百分比',
              formula: '合规供应商数 / 总供应商数 × 100%',
              weight: 35,
              dataSource: 'SRM系统',
              status: 'active'
            },
            {
              id: '4-2',
              label: '供应商响应时间',
              type: '时间类',
              formula: '平均响应时长',
              weight: 30,
              dataSource: 'SRM系统',
              status: 'active'
            }
          ]
        },
        {
          id: '5',
          label: '成本控制指标',
          children: [
            {
              id: '5-1',
              label: '成本节约率',
              type: '百分比',
              formula: '(预算成本 - 实际成本) / 预算成本 × 100%',
              weight: 40,
              dataSource: 'FMS系统',
              status: 'active'
            },
            {
              id: '5-2',
              label: '采购成本降低率',
              type: '百分比',
              formula: '成本降低额 / 原成本 × 100%',
              weight: 35,
              dataSource: 'FMS系统',
              status: 'active'
            }
          ]
        }
      ]
      resolve()
    }, 600)
  })
}

// 模拟加载数据标准化规则
const loadStandardRules = () => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      standardRules.value = [
        {
          id: '1',
          name: 'ERP订单数据标准化',
          sourceSystem: 'SAP ERP',
          targetFormat: 'JSON Schema v2.0',
          quality: 'excellent',
          lastProcessed: '2025-10-30 09:30:00',
          recordCount: 15420
        },
        {
          id: '2',
          name: 'WMS库存数据清洗',
          sourceSystem: 'Oracle WMS',
          targetFormat: 'Unified Inventory Model',
          quality: 'good',
          lastProcessed: '2025-10-30 09:25:00',
          recordCount: 8765
        },
        {
          id: '3',
          name: 'CRM客户反馈数据映射',
          sourceSystem: 'Salesforce CRM',
          targetFormat: 'Customer Feedback Schema',
          quality: 'fair',
          lastProcessed: '2025-10-30 09:20:00',
          recordCount: 3214
        },
        {
          id: '4',
          name: 'SRM供应商信息整合',
          sourceSystem: 'Ariba SRM',
          targetFormat: 'Supplier Master Data',
          quality: 'good',
          lastProcessed: '2025-10-30 09:15:00',
          recordCount: 1253
        },
        {
          id: '5',
          name: 'FMS财务数据转换',
          sourceSystem: 'Oracle Financials',
          targetFormat: 'Financial KPI Model',
          quality: 'excellent',
          lastProcessed: '2025-10-30 09:10:00',
          recordCount: 9876
        },
        {
          id: '6',
          name: 'OMS订单履约数据',
          sourceSystem: 'Custom OMS',
          targetFormat: 'Order Fulfillment Schema',
          quality: 'poor',
          lastProcessed: '2025-10-30 09:05:00',
          recordCount: 2145
        }
      ]
      
      // 更新数据处理统计
      dataProcessStats.totalRecords = standardRules.value.reduce((sum, rule) => sum + rule.recordCount, 0)
      dataProcessStats.processedRecords = Math.floor(dataProcessStats.totalRecords * 0.87)
      dataProcessStats.errorRecords = Math.floor(dataProcessStats.totalRecords * 0.03)
      dataProcessStats.processingRate = 87
      
      resolve()
    }, 700)
  })
}

// 模拟加载绩效模型
const loadPerformanceModels = () => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      performanceModels.value = [
        {
          id: '1',
          name: '供应链综合绩效模型',
          version: 'v2.3',
          indicators: ['订单交付周期', '库存周转率', '客户满意度', '准时交付率'],
          status: 'active',
          createTime: '2025-09-15',
          accuracy: 94.5
        },
        {
          id: '2',
          name: '物流效率评估模型',
          version: 'v1.8',
          indicators: ['订单交付周期', '准时交付率', '运输成本率'],
          status: 'active',
          createTime: '2025-08-20',
          accuracy: 91.2
        },
        {
          id: '3',
          name: '供应商绩效模型',
          version: 'v3.0',
          indicators: ['供应商合规率', '供应商响应时间', '产品合格率'],
          status: 'testing',
          createTime: '2025-10-10',
          accuracy: 88.7
        },
        {
          id: '4',
          name: '库存优化模型',
          version: 'v2.1',
          indicators: ['库存周转率', '库存准确率', '缺货率'],
          status: 'archived',
          createTime: '2025-06-30',
          accuracy: 85.3
        }
      ]
      
      selectedModel.value = performanceModels.value[0]
      resolve()
    }, 650)
  })
}

// 模拟加载数据血缘
const loadLineageData = () => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      lineageData.value = [
        {
          id: 'source-1',
          name: 'SAP ERP',
          type: 'source',
          children: [
            {
              id: 'transform-1',
              name: '数据清洗',
              type: 'transform',
              children: [
                {
                  id: 'transform-2',
                  name: '格式标准化',
                  type: 'transform',
                  children: [
                    {
                      id: 'indicator-1',
                      name: '订单交付周期',
                      type: 'indicator'
                    },
                    {
                      id: 'indicator-2',
                      name: '准时交付率',
                      type: 'indicator'
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 'source-2',
          name: 'Oracle WMS',
          type: 'source',
          children: [
            {
              id: 'transform-3',
              name: '库存数据聚合',
              type: 'transform',
              children: [
                {
                  id: 'indicator-3',
                  name: '库存周转率',
                  type: 'indicator'
                },
                {
                  id: 'indicator-4',
                  name: '库存准确率',
                  type: 'indicator'
                }
              ]
            }
          ]
        },
        {
          id: 'source-3',
          name: 'Salesforce CRM',
          type: 'source',
          children: [
            {
              id: 'transform-4',
              name: '客户数据整合',
              type: 'transform',
              children: [
                {
                  id: 'transform-5',
                  name: '满意度计算',
                  type: 'transform',
                  children: [
                    {
                      id: 'indicator-5',
                      name: '客户满意度',
                      type: 'indicator'
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
      resolve()
    }, 750)
  })
}

// 树节点点击
const handleNodeClick = (data: TreeNode) => {
  selectedNode.value = data
}

// 刷新数据
const refreshData = async () => {
  loading.value = true
  try {
    await loadCoreIndicators()
    ElMessage.success('数据已刷新')
  } finally {
    loading.value = false
  }
}

// 打开新增/编辑对话框
const openIndicatorDialog = (type: 'add' | 'edit', node?: TreeNode) => {
  dialogType.value = type
  if (type === 'edit' && node) {
    Object.assign(indicatorForm, {
      name: node.label,
      type: node.type || '',
      formula: node.formula || '',
      weight: node.weight || 50,
      dataSource: node.dataSource || '',
      status: node.status || 'active'
    })
  } else {
    Object.assign(indicatorForm, {
      name: '',
      type: '',
      formula: '',
      weight: 50,
      dataSource: '',
      status: 'active'
    })
  }
  dialogVisible.value = true
}

// 保存指标
const saveIndicator = () => {
  if (!indicatorForm.name) {
    ElMessage.warning('请输入指标名称')
    return
  }
  
  dialogVisible.value = false
  ElMessage.success(dialogType.value === 'add' ? '指标添加成功' : '指标更新成功')
  
  // 重新加载树数据
  loadIndicatorTree()
}

// 停用指标
const deactivateIndicator = (node: TreeNode) => {
  ElMessageBox.confirm('确定要停用该指标吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('指标已停用')
    loadIndicatorTree()
  }).catch(() => {})
}

// 打开模型配置对话框
const openModelDialog = (model?: PerformanceModel) => {
  if (model) {
    Object.assign(modelForm, {
      name: model.name,
      version: model.version,
      indicators: model.indicators,
      status: model.status
    })
  } else {
    Object.assign(modelForm, {
      name: '',
      version: '',
      indicators: [],
      status: 'testing'
    })
  }
  modelDialogVisible.value = true
}

// 保存模型
const saveModel = () => {
  if (!modelForm.name) {
    ElMessage.warning('请输入模型名称')
    return
  }
  
  modelDialogVisible.value = false
  ElMessage.success('模型保存成功')
  loadPerformanceModels()
}

// 测试模型
const testModel = (model: PerformanceModel) => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success(`模型 ${model.name} 测试通过，准确率: ${model.accuracy}%`)
  }, 1500)
}

// 激活模型
const activateModel = (model: PerformanceModel) => {
  ElMessageBox.confirm(`确定要激活模型 ${model.name} 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(() => {
    ElMessage.success('模型已激活')
    loadPerformanceModels()
  }).catch(() => {})
}

// 重新处理数据
const reprocessData = (rule: DataStandardRule) => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success(`${rule.name} 重新处理完成`)
    loadStandardRules()
  }, 2000)
}

// 查看数据质量详情
const viewQualityDetail = (rule: DataStandardRule) => {
  // 映射质量类型到 MessageBox 接受的类型
  const qualityTypeMap: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    excellent: 'success',
    good: 'info',
    fair: 'warning',
    poor: 'error'
  }
  
  ElMessageBox.alert(
    `数据源: ${rule.sourceSystem}\n目标格式: ${rule.targetFormat}\n处理记录数: ${rule.recordCount}\n数据质量: ${getQualityText(rule.quality)}\n最后处理时间: ${rule.lastProcessed}`,
    '数据质量详情',
    {
      confirmButtonText: '确定',
      type: qualityTypeMap[rule.quality] || 'info'
    }
  )
}

// 页面加载
onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      loadCoreIndicators(),
      loadIndicatorTree(),
      loadStandardRules(),
      loadPerformanceModels(),
      loadLineageData()
    ])
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="performance-integration" v-loading="loading">
    <!-- 页面标题 -->
    <el-card class="header-card" shadow="never">
      <div class="header-content">
        <div>
          <h2 class="page-title">绩效整合</h2>
          <p class="page-desc">集中整合和标准化分散的绩效指标，构建统一的绩效数据模型</p>
        </div>
        <el-button type="primary" @click="refreshData" :icon="'Refresh'">
          刷新数据
        </el-button>
      </div>
    </el-card>

    <!-- 标签页 -->
    <el-card class="content-card" shadow="never">
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 绩效指标总览 -->
        <el-tab-pane label="绩效指标总览" name="overview">
          <div class="overview-section">
            <el-row :gutter="20">
              <el-col 
                :xs="24" 
                :sm="12" 
                :lg="8" 
                v-for="indicator in coreIndicators" 
                :key="indicator.id"
              >
                <el-card class="indicator-card" shadow="hover">
                  <div class="indicator-header">
                    <span class="indicator-name">{{ indicator.name }}</span>
                    <el-tag 
                      :type="getIndicatorType(indicator.status)" 
                      size="small"
                    >
                      {{ indicator.status === 'normal' ? '正常' : indicator.status === 'warning' ? '预警' : '异常' }}
                    </el-tag>
                  </div>
                  
                  <div class="indicator-value">
                    <el-statistic 
                      :value="indicator.value" 
                      :precision="indicator.unit === '%' ? 1 : 1"
                    >
                      <template #suffix>
                        <span class="unit">{{ indicator.unit }}</span>
                      </template>
                    </el-statistic>
                  </div>
                  
                  <div class="indicator-detail">
                    <div class="target">
                      <span class="label">目标值:</span>
                      <span class="value">{{ indicator.target }}{{ indicator.unit }}</span>
                    </div>
                    <div class="change">
                      <span class="label">变化率:</span>
                      <span 
                        :class="['value', indicator.changeRate > 0 ? 'positive' : 'negative']"
                      >
                        {{ indicator.changeRate > 0 ? '+' : '' }}{{ indicator.changeRate }}%
                      </span>
                    </div>
                  </div>
                  
                  <el-progress 
                    :percentage="Math.round((indicator.value / indicator.target) * 100)"
                    :status="indicator.status === 'normal' ? 'success' : indicator.status === 'warning' ? 'warning' : 'exception'"
                    :stroke-width="8"
                  />
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

        <!-- 指标分类管理 -->
        <el-tab-pane label="指标分类管理" name="management">
          <div class="management-section">
            <el-row :gutter="20">
              <!-- 左侧：指标树 -->
              <el-col :xs="24" :md="8">
                <el-card shadow="never" class="tree-card">
                  <template #header>
                    <div class="card-header">
                      <span>指标分类体系</span>
                      <el-button 
                        type="primary" 
                        size="small" 
                        @click="openIndicatorDialog('add')"
                      >
                        新增指标
                      </el-button>
                    </div>
                  </template>
                  <el-tree
                    ref="treeRef"
                    :data="indicatorTree"
                    :props="{ label: 'label', children: 'children' }"
                    node-key="id"
                    default-expand-all
                    highlight-current
                    @node-click="handleNodeClick"
                  >
                    <template #default="{ node, data }">
                      <span class="tree-node">
                        <span>{{ node.label }}</span>
                        <el-tag 
                          v-if="data.status === 'inactive'" 
                          type="info" 
                          size="small"
                        >
                          已停用
                        </el-tag>
                      </span>
                    </template>
                  </el-tree>
                </el-card>
              </el-col>

              <!-- 右侧：指标详情 -->
              <el-col :xs="24" :md="16">
                <el-card shadow="never" v-if="selectedNode">
                  <template #header>
                    <div class="card-header">
                      <span>指标详情</span>
                      <div>
                        <el-button 
                          size="small" 
                          @click="openIndicatorDialog('edit', selectedNode)"
                        >
                          编辑
                        </el-button>
                        <el-button 
                          size="small" 
                          type="warning" 
                          @click="deactivateIndicator(selectedNode)"
                          v-if="selectedNode.status !== 'inactive'"
                        >
                          停用
                        </el-button>
                      </div>
                    </div>
                  </template>
                  
                  <el-descriptions :column="2" border>
                    <el-descriptions-item label="指标名称">
                      {{ selectedNode.label }}
                    </el-descriptions-item>
                    <el-descriptions-item label="指标类型">
                      {{ selectedNode.type || '-' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="权重系数">
                      <el-progress 
                        :percentage="selectedNode.weight || 0" 
                        :stroke-width="12"
                        :format="(percentage) => `${percentage}%`"
                      />
                    </el-descriptions-item>
                    <el-descriptions-item label="数据来源">
                      <el-tag type="primary">{{ selectedNode.dataSource || '-' }}</el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="计算公式" :span="2">
                      <code class="formula">{{ selectedNode.formula || '-' }}</code>
                    </el-descriptions-item>
                    <el-descriptions-item label="状态" :span="2">
                      <el-tag :type="selectedNode.status === 'active' ? 'success' : 'info'">
                        {{ selectedNode.status === 'active' ? '启用中' : '已停用' }}
                      </el-tag>
                    </el-descriptions-item>
                  </el-descriptions>
                </el-card>
                
                <el-empty 
                  v-else 
                  description="请选择左侧指标查看详情"
                  :image-size="150"
                />
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

        <!-- 数据标准化处理 -->
        <el-tab-pane label="数据标准化处理" name="standardization">
          <div class="standardization-section">
            <!-- 数据处理监控 -->
            <el-card shadow="never" class="monitor-card">
              <template #header>
                <span>数据处理监控</span>
              </template>
              
              <el-row :gutter="20">
                <el-col :span="6">
                  <el-statistic title="总记录数" :value="dataProcessStats.totalRecords" />
                </el-col>
                <el-col :span="6">
                  <el-statistic title="已处理" :value="dataProcessStats.processedRecords">
                    <template #suffix>
                      <span style="color: #67c23a">条</span>
                    </template>
                  </el-statistic>
                </el-col>
                <el-col :span="6">
                  <el-statistic title="处理失败" :value="dataProcessStats.errorRecords">
                    <template #suffix>
                      <span style="color: #f56c6c">条</span>
                    </template>
                  </el-statistic>
                </el-col>
                <el-col :span="6">
                  <div class="progress-stat">
                    <div class="stat-title">处理进度</div>
                    <el-progress 
                      type="dashboard" 
                      :percentage="processingProgress"
                      :width="100"
                    >
                      <template #default="{ percentage }">
                        <span class="percentage-value">{{ percentage }}%</span>
                      </template>
                    </el-progress>
                  </div>
                </el-col>
              </el-row>
            </el-card>

            <!-- 标准化规则列表 -->
            <el-card shadow="never" style="margin-top: 20px">
              <template #header>
                <div class="card-header">
                  <span>数据标准化规则</span>
                  <el-button type="primary" size="small">
                    新增规则
                  </el-button>
                </div>
              </template>
              
              <el-table :data="standardRules" stripe>
                <el-table-column prop="name" label="规则名称" min-width="180" />
                <el-table-column prop="sourceSystem" label="源系统" width="150" />
                <el-table-column prop="targetFormat" label="目标格式" width="200" />
                <el-table-column label="数据质量" width="120">
                  <template #default="{ row }">
                    <el-tag :type="getQualityType(row.quality)">
                      {{ getQualityText(row.quality) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="recordCount" label="记录数" width="120">
                  <template #default="{ row }">
                    {{ row.recordCount.toLocaleString() }}
                  </template>
                </el-table-column>
                <el-table-column prop="lastProcessed" label="最后处理时间" width="180" />
                <el-table-column label="操作" width="200" fixed="right">
                  <template #default="{ row }">
                    <el-button 
                      size="small" 
                      type="primary" 
                      link
                      @click="viewQualityDetail(row)"
                    >
                      详情
                    </el-button>
                    <el-button 
                      size="small" 
                      type="warning" 
                      link
                      @click="reprocessData(row)"
                    >
                      重新处理
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </div>
        </el-tab-pane>

        <!-- 绩效模型配置 -->
        <el-tab-pane label="绩效模型配置" name="model">
          <div class="model-section">
            <el-alert
              title="模型配置说明"
              type="info"
              description="通过配置统一的绩效评估模型，可以标准化各环节的绩效评估方式，提高评估的准确性和可比性。"
              :closable="false"
              style="margin-bottom: 20px"
            />
            
            <el-card shadow="never">
              <template #header>
                <div class="card-header">
                  <span>绩效模型列表</span>
                  <el-button 
                    type="primary" 
                    size="small"
                    @click="openModelDialog()"
                  >
                    新建模型
                  </el-button>
                </div>
              </template>
              
              <el-row :gutter="20">
                <el-col 
                  :xs="24" 
                  :sm="12" 
                  :lg="12"
                  v-for="model in performanceModels" 
                  :key="model.id"
                >
                  <el-card class="model-card" shadow="hover">
                    <div class="model-header">
                      <div>
                        <h3 class="model-name">{{ model.name }}</h3>
                        <span class="model-version">{{ model.version }}</span>
                      </div>
                      <el-tag 
                        :type="model.status === 'active' ? 'success' : model.status === 'testing' ? 'warning' : 'info'"
                      >
                        {{ model.status === 'active' ? '运行中' : model.status === 'testing' ? '测试中' : '已归档' }}
                      </el-tag>
                    </div>
                    
                    <div class="model-info">
                      <div class="info-item">
                        <span class="label">创建时间:</span>
                        <span class="value">{{ model.createTime }}</span>
                      </div>
                      <div class="info-item">
                        <span class="label">准确率:</span>
                        <el-progress 
                          :percentage="model.accuracy" 
                          :stroke-width="8"
                          :format="(percentage) => `${percentage}%`"
                        />
                      </div>
                    </div>
                    
                    <div class="model-indicators">
                      <div class="label">关联指标:</div>
                      <div class="tags">
                        <el-tag 
                          v-for="(indicator, index) in model.indicators" 
                          :key="index"
                          size="small"
                          style="margin: 4px"
                        >
                          {{ indicator }}
                        </el-tag>
                      </div>
                    </div>
                    
                    <div class="model-actions">
                      <el-button size="small" @click="openModelDialog(model)">
                        编辑
                      </el-button>
                      <el-button 
                        size="small" 
                        type="primary"
                        @click="testModel(model)"
                      >
                        测试
                      </el-button>
                      <el-button 
                        v-if="model.status === 'testing'"
                        size="small" 
                        type="success"
                        @click="activateModel(model)"
                      >
                        激活
                      </el-button>
                    </div>
                  </el-card>
                </el-col>
              </el-row>
            </el-card>
          </div>
        </el-tab-pane>

        <!-- 数据血缘追踪 -->
        <el-tab-pane label="数据血缘追踪" name="lineage">
          <div class="lineage-section">
            <el-alert
              title="数据血缘追踪"
              type="info"
              description="可视化展示指标数据的完整血缘关系，追踪数据从源头到指标的计算路径。"
              :closable="false"
              style="margin-bottom: 20px"
            />
            
            <el-card shadow="never">
              <template #header>
                <span>数据血缘关系图</span>
              </template>
              
              <el-tree
                :data="lineageData"
                :props="{ label: 'name', children: 'children' }"
                default-expand-all
                class="lineage-tree"
              >
                <template #default="{ node, data }">
                  <span class="lineage-node">
                    <el-tag 
                      :type="data.type === 'source' ? 'primary' : data.type === 'transform' ? 'warning' : 'success'"
                      size="small"
                    >
                      {{ data.type === 'source' ? '数据源' : data.type === 'transform' ? '转换' : '指标' }}
                    </el-tag>
                    <span class="node-name">{{ node.label }}</span>
                  </span>
                </template>
              </el-tree>
            </el-card>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 指标编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增指标' : '编辑指标'"
      width="600px"
    >
      <el-form :model="indicatorForm" label-width="100px">
        <el-form-item label="指标名称">
          <el-input v-model="indicatorForm.name" placeholder="请输入指标名称" />
        </el-form-item>
        <el-form-item label="指标类型">
          <el-select v-model="indicatorForm.type" placeholder="请选择指标类型" style="width: 100%">
            <el-option label="时间类" value="时间类" />
            <el-option label="百分比" value="百分比" />
            <el-option label="频率类" value="频率类" />
            <el-option label="评分类" value="评分类" />
          </el-select>
        </el-form-item>
        <el-form-item label="计算公式">
          <el-input 
            v-model="indicatorForm.formula" 
            type="textarea" 
            :rows="3"
            placeholder="请输入计算公式"
          />
        </el-form-item>
        <el-form-item label="权重系数">
          <el-slider v-model="indicatorForm.weight" :min="0" :max="100" show-input />
        </el-form-item>
        <el-form-item label="数据来源">
          <el-select v-model="indicatorForm.dataSource" placeholder="请选择数据来源" style="width: 100%">
            <el-option label="ERP系统" value="ERP系统" />
            <el-option label="WMS系统" value="WMS系统" />
            <el-option label="OMS系统" value="OMS系统" />
            <el-option label="CRM系统" value="CRM系统" />
            <el-option label="SRM系统" value="SRM系统" />
            <el-option label="FMS系统" value="FMS系统" />
            <el-option label="QMS系统" value="QMS系统" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="indicatorForm.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveIndicator">保存</el-button>
      </template>
    </el-dialog>

    <!-- 模型配置对话框 -->
    <el-dialog
      v-model="modelDialogVisible"
      title="模型配置"
      width="600px"
    >
      <el-form :model="modelForm" label-width="100px">
        <el-form-item label="模型名称">
          <el-input v-model="modelForm.name" placeholder="请输入模型名称" />
        </el-form-item>
        <el-form-item label="版本号">
          <el-input v-model="modelForm.version" placeholder="例如: v1.0" />
        </el-form-item>
        <el-form-item label="关联指标">
          <el-select 
            v-model="modelForm.indicators" 
            multiple 
            placeholder="请选择关联指标"
            style="width: 100%"
          >
            <el-option label="订单交付周期" value="订单交付周期" />
            <el-option label="库存周转率" value="库存周转率" />
            <el-option label="客户满意度" value="客户满意度" />
            <el-option label="准时交付率" value="准时交付率" />
            <el-option label="供应商合规率" value="供应商合规率" />
            <el-option label="成本节约率" value="成本节约率" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="modelForm.status">
            <el-radio label="testing">测试中</el-radio>
            <el-radio label="active">运行中</el-radio>
            <el-radio label="archived">已归档</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="modelDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveModel">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.performance-integration {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 100px);

  .header-card {
    margin-bottom: 20px;
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .page-title {
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 600;
        color: #303133;
      }
      
      .page-desc {
        margin: 0;
        color: #909399;
        font-size: 14px;
      }
    }
  }

  .content-card {
    :deep(.el-card__body) {
      padding: 0;
    }
    
    :deep(.el-tabs--border-card) {
      border: none;
      box-shadow: none;
    }
    
    :deep(.el-tabs__content) {
      padding: 20px;
    }
  }

  // 绩效指标总览
  .overview-section {
    .indicator-card {
      margin-bottom: 20px;
      transition: all 0.3s;
      
      &:hover {
        transform: translateY(-4px);
      }
      
      .indicator-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        
        .indicator-name {
          font-size: 16px;
          font-weight: 500;
          color: #303133;
        }
      }
      
      .indicator-value {
        margin-bottom: 16px;
        
        :deep(.el-statistic) {
          .el-statistic__content {
            font-size: 32px;
            font-weight: 600;
            
            .unit {
              font-size: 16px;
              margin-left: 4px;
            }
          }
        }
      }
      
      .indicator-detail {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;
        font-size: 14px;
        
        .label {
          color: #909399;
          margin-right: 8px;
        }
        
        .value {
          font-weight: 500;
          
          &.positive {
            color: #67c23a;
          }
          
          &.negative {
            color: #f56c6c;
          }
        }
      }
    }
  }

  // 指标分类管理
  .management-section {
    .tree-card {
      height: 600px;
      overflow-y: auto;
      
      .tree-node {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
      }
    }
    
    .formula {
      display: block;
      padding: 8px;
      background-color: #f5f7fa;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: #606266;
    }
  }

  // 数据标准化处理
  .standardization-section {
    .monitor-card {
      margin-bottom: 20px;
      
      .progress-stat {
        text-align: center;
        
        .stat-title {
          font-size: 14px;
          color: #909399;
          margin-bottom: 12px;
        }
        
        .percentage-value {
          font-size: 20px;
          font-weight: 600;
        }
      }
    }
  }

  // 绩效模型配置
  .model-section {
    .model-card {
      margin-bottom: 20px;
      transition: all 0.3s;
      
      &:hover {
        transform: translateY(-2px);
      }
      
      .model-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;
        
        .model-name {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
          color: #303133;
        }
        
        .model-version {
          color: #909399;
          font-size: 14px;
        }
      }
      
      .model-info {
        margin-bottom: 16px;
        
        .info-item {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
          font-size: 14px;
          
          .label {
            color: #909399;
            margin-right: 8px;
            min-width: 80px;
          }
          
          .value {
            flex: 1;
          }
          
          .el-progress {
            flex: 1;
          }
        }
      }
      
      .model-indicators {
        margin-bottom: 16px;
        
        .label {
          font-size: 14px;
          color: #909399;
          margin-bottom: 8px;
        }
        
        .tags {
          display: flex;
          flex-wrap: wrap;
        }
      }
      
      .model-actions {
        display: flex;
        gap: 8px;
        padding-top: 12px;
        border-top: 1px solid #ebeef5;
      }
    }
  }

  // 数据血缘追踪
  .lineage-section {
    .lineage-tree {
      :deep(.el-tree-node__content) {
        height: 40px;
        padding: 8px 0;
      }
      
      .lineage-node {
        display: flex;
        align-items: center;
        gap: 12px;
        
        .node-name {
          font-size: 14px;
          color: #303133;
        }
      }
    }
  }

  // 通用样式
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  // 响应式
  @media (max-width: 768px) {
    padding: 10px;
    
    .header-content {
      flex-direction: column;
      align-items: flex-start !important;
      gap: 12px;
    }
    
    .page-title {
      font-size: 20px !important;
    }
  }
}
</style>
