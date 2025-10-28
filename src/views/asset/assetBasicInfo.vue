<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  Search,
  Refresh,
  Plus,
  Edit,
  Delete,
  Download,
  Upload,
  View,
  Connection,
  Close,
  FullScreen
} from '@element-plus/icons-vue'

// 类型定义
interface Asset {
  id: string
  assetCode: string
  assetName: string
  assetType: string
  department: string
  owner: string
  maintainer: string
  status: 'active' | 'inactive' | 'archived'
  securityLevel: 'public' | 'internal' | 'confidential' | 'secret'
  version: string
  description: string
  businessDomain: string
  businessCategory: string
  businessTags: string[]
  dataType: string
  dataFormat: string
  storageLocation: string
  dataSize: string
  createTime: string
  updateTime: string
  // 技术属性
  technicalProps?: {
    encoding: string
    compression: string
    partitionKey: string
    updateFrequency: string
    dataQuality: string
  }
  // 业务属性
  businessProps?: {
    businessOwner: string
    usagePurpose: string
    dataSource: string
    refreshCycle: string
    valueLevel: string
  }
  // 使用统计
  usageStats?: {
    accessCount: number
    lastAccessTime: string
    topUsers: string[]
    associatedAssets: number
  }
  // 关联信息
  relations?: {
    parentAssets: string[]
    childAssets: string[]
    dependencies: string[]
  }
}

interface ChangeHistory {
  id: string
  assetName: string
  changeType: string
  changeContent: string
  operator: string
  changeTime: string
}

// 响应式数据
const loading = ref(false)
const tableData = ref<Asset[]>([])
const filteredData = computed(() => {
  let data = tableData.value
  
  // 状态筛选
  if (searchForm.status !== 'all') {
    data = data.filter(item => item.status === searchForm.status)
  }
  
  // 搜索
  if (searchForm.keyword) {
    const keyword = searchForm.keyword.toLowerCase()
    data = data.filter(item => 
      item.assetName.toLowerCase().includes(keyword) ||
      item.assetCode.toLowerCase().includes(keyword)
    )
  }
  
  return data
})

// 搜索表单
const searchForm = reactive({
  keyword: '',
  status: 'all' as 'all' | 'active' | 'inactive' | 'archived',
  assetType: ''
})

// 对话框控制
const dialogVisible = ref(false)
const dialogTitle = ref('新增资产')
const isEdit = ref(false)
const formRef = ref<FormInstance>()

// 表单数据
const formData = reactive<Partial<Asset>>({
  assetCode: '',
  assetName: '',
  assetType: '',
  department: '',
  owner: '',
  maintainer: '',
  status: 'active',
  securityLevel: 'internal',
  version: '1.0.0',
  description: '',
  businessDomain: '',
  businessCategory: '',
  businessTags: [],
  dataType: '',
  dataFormat: '',
  storageLocation: '',
  dataSize: '',
  technicalProps: {
    encoding: 'UTF-8',
    compression: 'none',
    partitionKey: '',
    updateFrequency: 'daily',
    dataQuality: 'high'
  },
  businessProps: {
    businessOwner: '',
    usagePurpose: '',
    dataSource: '',
    refreshCycle: 'daily',
    valueLevel: 'high'
  }
})

// 表单验证规则
const formRules: FormRules = {
  assetCode: [
    { required: true, message: '请输入资产编号', trigger: 'blur' },
    { pattern: /^[A-Z0-9_]+$/, message: '资产编号只能包含大写字母、数字和下划线', trigger: 'blur' }
  ],
  assetName: [{ required: true, message: '请输入资产名称', trigger: 'blur' }],
  assetType: [{ required: true, message: '请选择资产类型', trigger: 'change' }],
  department: [{ required: true, message: '请选择所属部门', trigger: 'change' }],
  owner: [{ required: true, message: '请输入负责人', trigger: 'blur' }],
  securityLevel: [{ required: true, message: '请选择安全等级', trigger: 'change' }]
}

// 详情抽屉
const drawerVisible = ref(false)
const drawerFullscreen = ref(false)
const currentAsset = ref<Asset | null>(null)
const activeTab = ref('basic')

// 变更历史
const changeHistoryVisible = ref(false)
const changeHistory = ref<ChangeHistory[]>([])

// 关联关系对话框
const relationDialogVisible = ref(false)

// 选项数据
const assetTypes = ['数据库表', '数据文件', 'API接口', '数据流', '数据仓库', '数据集市']
const departments = ['技术部', '产品部', '运营部', '市场部', '财务部', '人力资源部']
const businessDomains = ['用户域', '订单域', '商品域', '营销域', '财务域', '物流域']
const businessCategories = ['基础数据', '业务数据', '分析数据', '统计数据', '报表数据']
const dataTypes = ['结构化数据', '半结构化数据', '非结构化数据']
const dataFormats = ['CSV', 'JSON', 'XML', 'Parquet', 'ORC', 'Avro', 'Excel']
const securityLevelOptions = [
  { value: 'public', label: '公开', type: 'success' },
  { value: 'internal', label: '内部', type: '' },
  { value: 'confidential', label: '秘密', type: 'warning' },
  { value: 'secret', label: '机密', type: 'danger' }
]

// Mock 数据生成
const generateMockData = (): Asset[] => {
  const data: Asset[] = []
  const names = ['用户基础信息表', '订单交易数据', '商品库存表', '营销活动数据', '财务报表数据', '物流配送信息', '客户行为分析', '销售统计报表']
  const statuses: Array<'active' | 'inactive' | 'archived'> = ['active', 'inactive', 'archived']
  const securityLevels: Array<'public' | 'internal' | 'confidential' | 'secret'> = ['public', 'internal', 'confidential', 'secret']
  
  for (let i = 0; i < 20; i++) {
    const status = statuses[Math.floor(Math.random() * 3)]
    const securityLevel = securityLevels[Math.floor(Math.random() * 4)]
    
    data.push({
      id: `asset_${i + 1}`,
      assetCode: `ASSET_${String(i + 1).padStart(4, '0')}`,
      assetName: names[i % names.length] + (i > 7 ? ` V${Math.floor(i / 8) + 1}` : ''),
      assetType: assetTypes[i % assetTypes.length],
      department: departments[i % departments.length],
      owner: `负责人${i + 1}`,
      maintainer: `维护人${i + 1}`,
      status,
      securityLevel,
      version: `1.${i % 10}.0`,
      description: `这是${names[i % names.length]}的详细描述信息，包含了资产的用途、来源和特点说明。`,
      businessDomain: businessDomains[i % businessDomains.length],
      businessCategory: businessCategories[i % businessCategories.length],
      businessTags: ['标签A', '标签B', '标签C'].slice(0, (i % 3) + 1),
      dataType: dataTypes[i % dataTypes.length],
      dataFormat: dataFormats[i % dataFormats.length],
      storageLocation: `/data/warehouse/layer${(i % 3) + 1}/${names[i % names.length]}`,
      dataSize: `${(Math.random() * 1000).toFixed(2)} GB`,
      createTime: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      updateTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      technicalProps: {
        encoding: 'UTF-8',
        compression: ['none', 'gzip', 'snappy'][i % 3],
        partitionKey: i % 2 === 0 ? 'dt' : 'create_date',
        updateFrequency: ['daily', 'hourly', 'realtime', 'weekly'][i % 4],
        dataQuality: ['high', 'medium', 'low'][i % 3]
      },
      businessProps: {
        businessOwner: `业务负责人${i + 1}`,
        usagePurpose: ['报表分析', '业务决策', '数据挖掘', '实时监控'][i % 4],
        dataSource: ['业务系统', '数据采集', '第三方接口', '人工录入'][i % 4],
        refreshCycle: ['daily', 'hourly', 'realtime', 'weekly'][i % 4],
        valueLevel: ['high', 'medium', 'low'][i % 3]
      },
      usageStats: {
        accessCount: Math.floor(Math.random() * 10000),
        lastAccessTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        topUsers: [`用户${i + 1}`, `用户${i + 2}`, `用户${i + 3}`],
        associatedAssets: Math.floor(Math.random() * 50)
      },
      relations: {
        parentAssets: i > 0 ? [`ASSET_${String(i).padStart(4, '0')}`] : [],
        childAssets: i < 19 ? [`ASSET_${String(i + 2).padStart(4, '0')}`] : [],
        dependencies: [`DEP_${String((i % 5) + 1).padStart(4, '0')}`]
      }
    })
  }
  
  return data
}

// 加载数据
const loadData = () => {
  loading.value = true
  setTimeout(() => {
    tableData.value = generateMockData()
    loading.value = false
  }, 500)
}

// 重置搜索
const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.status = 'all'
  searchForm.assetType = ''
}

// 新增资产
const handleAdd = () => {
  dialogTitle.value = '新增资产'
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 编辑资产
const handleEdit = (row: Asset) => {
  dialogTitle.value = '编辑资产'
  isEdit.value = true
  Object.assign(formData, row)
  dialogVisible.value = true
}

// 查看详情
const handleView = (row: Asset) => {
  currentAsset.value = row
  activeTab.value = 'basic'
  drawerVisible.value = true
}

// 删除资产
const handleDelete = (row: Asset) => {
  ElMessageBox.confirm(
    `确定要删除资产"${row.assetName}"吗？删除后将无法恢复。`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const index = tableData.value.findIndex(item => item.id === row.id)
    if (index > -1) {
      tableData.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 状态变更
const handleStatusChange = (row: Asset, newStatus: 'active' | 'inactive' | 'archived') => {
  const statusMap = {
    active: '启用',
    inactive: '停用',
    archived: '归档'
  }
  
  ElMessageBox.confirm(
    `确定要将资产"${row.assetName}"的状态变更为"${statusMap[newStatus]}"吗？`,
    '状态变更确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    row.status = newStatus
    ElMessage.success('状态变更成功')
  })
}

// 查看变更历史
const viewChangeHistory = (row: Asset) => {
  // Mock 变更历史数据
  changeHistory.value = [
    {
      id: '1',
      assetName: row.assetName,
      changeType: '创建',
      changeContent: '创建资产',
      operator: row.owner,
      changeTime: row.createTime
    },
    {
      id: '2',
      assetName: row.assetName,
      changeType: '修改',
      changeContent: '更新资产描述信息',
      operator: row.maintainer,
      changeTime: row.updateTime
    },
    {
      id: '3',
      assetName: row.assetName,
      changeType: '状态变更',
      changeContent: `状态从"停用"变更为"${getStatusLabel(row.status)}"`,
      operator: row.owner,
      changeTime: row.updateTime
    }
  ]
  changeHistoryVisible.value = true
}

// 管理关联关系
const manageRelations = (row: Asset) => {
  currentAsset.value = row
  relationDialogVisible.value = true
}

// 导出数据
const handleExport = () => {
  ElMessage.success('导出功能开发中...')
}

// 导入数据
const handleImport = () => {
  ElMessage.success('导入功能开发中...')
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate((valid) => {
    if (valid) {
      if (isEdit.value) {
        // 编辑
        const index = tableData.value.findIndex(item => item.id === formData.id)
        if (index > -1) {
          Object.assign(tableData.value[index], formData)
          tableData.value[index].updateTime = new Date().toISOString().split('T')[0]
        }
        ElMessage.success('编辑成功')
      } else {
        // 新增
        const newAsset: Asset = {
          ...formData as Asset,
          id: `asset_${Date.now()}`,
          createTime: new Date().toISOString().split('T')[0],
          updateTime: new Date().toISOString().split('T')[0],
          usageStats: {
            accessCount: 0,
            lastAccessTime: '',
            topUsers: [],
            associatedAssets: 0
          },
          relations: {
            parentAssets: [],
            childAssets: [],
            dependencies: []
          }
        }
        tableData.value.unshift(newAsset)
        ElMessage.success('新增成功')
      }
      dialogVisible.value = false
    }
  })
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.assign(formData, {
    assetCode: '',
    assetName: '',
    assetType: '',
    department: '',
    owner: '',
    maintainer: '',
    status: 'active',
    securityLevel: 'internal',
    version: '1.0.0',
    description: '',
    businessDomain: '',
    businessCategory: '',
    businessTags: [],
    dataType: '',
    dataFormat: '',
    storageLocation: '',
    dataSize: '',
    technicalProps: {
      encoding: 'UTF-8',
      compression: 'none',
      partitionKey: '',
      updateFrequency: 'daily',
      dataQuality: 'high'
    },
    businessProps: {
      businessOwner: '',
      usagePurpose: '',
      dataSource: '',
      refreshCycle: 'daily',
      valueLevel: 'high'
    }
  })
}

// 获取状态标签
const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    active: '启用',
    inactive: '停用',
    archived: '归档'
  }
  return map[status] || status
}

// 获取状态类型
const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    active: 'success',
    inactive: 'info',
    archived: ''
  }
  return map[status] || ''
}

// 获取安全等级标签
const getSecurityLevelLabel = (level: string) => {
  const map: Record<string, string> = {
    public: '公开',
    internal: '内部',
    confidential: '秘密',
    secret: '机密'
  }
  return map[level] || level
}

// 获取安全等级类型
const getSecurityLevelType = (level: string) => {
  const map: Record<string, string> = {
    public: 'success',
    internal: '',
    confidential: 'warning',
    secret: 'danger'
  }
  return map[level] || ''
}

// 生命周期
onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="asset-basic-info">
    <!-- 搜索和操作区 -->
    <el-card class="search-card" shadow="never">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入资产名称或编号"
            :prefix-icon="Search"
            clearable
            @clear="loadData"
          />
        </el-col>
        <el-col :span="4">
          <el-select
            v-model="searchForm.status"
            placeholder="资产状态"
            clearable
            style="width: 100%"
          >
            <el-option label="全部" value="all" />
            <el-option label="启用" value="active" />
            <el-option label="停用" value="inactive" />
            <el-option label="归档" value="archived" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select
            v-model="searchForm.assetType"
            placeholder="资产类型"
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="type in assetTypes"
              :key="type"
              :label="type"
              :value="type"
            />
          </el-select>
        </el-col>
        <el-col :span="10" class="text-right">
          <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
          <el-button type="primary" :icon="Search">搜索</el-button>
          <el-button :icon="Download" @click="handleExport">导出</el-button>
          <el-button :icon="Upload" @click="handleImport">导入</el-button>
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增资产</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 资产列表 -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="filteredData"
        stripe
        style="width: 100%"
        @row-click="handleView"
      >
        <el-table-column prop="assetCode" label="资产编号" />
        <el-table-column prop="assetName" label="资产名称" show-overflow-tooltip />
        <el-table-column prop="assetType" label="资产类型"  />
        <el-table-column prop="department" label="所属部门"  />
        <el-table-column prop="owner" label="负责人" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="安全等级" width="100">
          <template #default="{ row }">
            <el-tag :type="getSecurityLevelType(row.securityLevel)" size="small">
              {{ getSecurityLevelLabel(row.securityLevel) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间"  />
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button :icon="View" link type="primary" size="small" @click.stop="handleView(row)">
              详情
            </el-button>
            <el-button :icon="Edit" link type="primary" size="small" @click.stop="handleEdit(row)">
              编辑
            </el-button>
            <el-dropdown @command="(cmd) => handleStatusChange(row, cmd)" trigger="click">
              <el-button link type="primary" size="small" @click.stop>
                状态 <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="active">启用</el-dropdown-item>
                  <el-dropdown-item command="inactive">停用</el-dropdown-item>
                  <el-dropdown-item command="archived">归档</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button :icon="Delete" link type="danger" size="small" @click.stop="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-tabs>
          <el-tab-pane label="基本信息">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="资产编号" prop="assetCode">
                  <el-input v-model="formData.assetCode" placeholder="请输入资产编号" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="资产名称" prop="assetName">
                  <el-input v-model="formData.assetName" placeholder="请输入资产名称" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="资产类型" prop="assetType">
                  <el-select v-model="formData.assetType" placeholder="请选择资产类型" style="width: 100%">
                    <el-option v-for="type in assetTypes" :key="type" :label="type" :value="type" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="版本号" prop="version">
                  <el-input v-model="formData.version" placeholder="请输入版本号" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="所属部门" prop="department">
                  <el-select v-model="formData.department" placeholder="请选择所属部门" style="width: 100%">
                    <el-option v-for="dept in departments" :key="dept" :label="dept" :value="dept" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="负责人" prop="owner">
                  <el-input v-model="formData.owner" placeholder="请输入负责人" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="维护人" prop="maintainer">
                  <el-input v-model="formData.maintainer" placeholder="请输入维护人" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="安全等级" prop="securityLevel">
                  <el-select v-model="formData.securityLevel" placeholder="请选择安全等级" style="width: 100%">
                    <el-option
                      v-for="item in securityLevelOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="状态" prop="status">
                  <el-select v-model="formData.status" placeholder="请选择状态" style="width: 100%">
                    <el-option label="启用" value="active" />
                    <el-option label="停用" value="inactive" />
                    <el-option label="归档" value="archived" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="资产描述" prop="description">
                  <el-input
                    v-model="formData.description"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入资产描述"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-tab-pane>

          <el-tab-pane label="业务属性">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="业务域" prop="businessDomain">
                  <el-select v-model="formData.businessDomain" placeholder="请选择业务域" style="width: 100%">
                    <el-option v-for="domain in businessDomains" :key="domain" :label="domain" :value="domain" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="业务分类" prop="businessCategory">
                  <el-select v-model="formData.businessCategory" placeholder="请选择业务分类" style="width: 100%">
                    <el-option v-for="cat in businessCategories" :key="cat" :label="cat" :value="cat" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="业务负责人">
                  <el-input v-model="formData.businessProps.businessOwner" placeholder="请输入业务负责人" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="使用目的">
                  <el-input v-model="formData.businessProps.usagePurpose" placeholder="请输入使用目的" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="数据来源">
                  <el-input v-model="formData.businessProps.dataSource" placeholder="请输入数据来源" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="刷新周期">
                  <el-select v-model="formData.businessProps.refreshCycle" placeholder="请选择刷新周期" style="width: 100%">
                    <el-option label="实时" value="realtime" />
                    <el-option label="小时" value="hourly" />
                    <el-option label="天" value="daily" />
                    <el-option label="周" value="weekly" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="业务标签" prop="businessTags">
                  <el-select
                    v-model="formData.businessTags"
                    multiple
                    filterable
                    allow-create
                    placeholder="请选择或输入业务标签"
                    style="width: 100%"
                  >
                    <el-option label="标签A" value="标签A" />
                    <el-option label="标签B" value="标签B" />
                    <el-option label="标签C" value="标签C" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-tab-pane>

          <el-tab-pane label="技术属性">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="数据类型" prop="dataType">
                  <el-select v-model="formData.dataType" placeholder="请选择数据类型" style="width: 100%">
                    <el-option v-for="type in dataTypes" :key="type" :label="type" :value="type" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="数据格式" prop="dataFormat">
                  <el-select v-model="formData.dataFormat" placeholder="请选择数据格式" style="width: 100%">
                    <el-option v-for="format in dataFormats" :key="format" :label="format" :value="format" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="存储位置" prop="storageLocation">
                  <el-input v-model="formData.storageLocation" placeholder="请输入存储位置" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="数据量" prop="dataSize">
                  <el-input v-model="formData.dataSize" placeholder="请输入数据量（如：100GB）" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="编码方式">
                  <el-input v-model="formData.technicalProps.encoding" placeholder="请输入编码方式" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="压缩方式">
                  <el-select v-model="formData.technicalProps.compression" placeholder="请选择压缩方式" style="width: 100%">
                    <el-option label="无压缩" value="none" />
                    <el-option label="GZIP" value="gzip" />
                    <el-option label="Snappy" value="snappy" />
                    <el-option label="LZO" value="lzo" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="分区键">
                  <el-input v-model="formData.technicalProps.partitionKey" placeholder="请输入分区键" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="更新频率">
                  <el-select v-model="formData.technicalProps.updateFrequency" placeholder="请选择更新频率" style="width: 100%">
                    <el-option label="实时" value="realtime" />
                    <el-option label="小时" value="hourly" />
                    <el-option label="天" value="daily" />
                    <el-option label="周" value="weekly" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-tab-pane>
        </el-tabs>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      :title="currentAsset?.assetName"
      size="60%"
      :with-header="true"
    >
      <template #header>
        <div class="drawer-header">
          <h3>{{ currentAsset?.assetName }}</h3>
          <div class="drawer-actions">
            <el-button :icon="FullScreen" circle @click="drawerFullscreen = !drawerFullscreen" />
            <el-button :icon="Close" circle @click="drawerVisible = false" />
          </div>
        </div>
      </template>
      
      <div v-if="currentAsset" class="asset-detail">
        <el-tabs v-model="activeTab">
          <!-- 基本信息 -->
          <el-tab-pane label="基本信息" name="basic">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="资产编号">{{ currentAsset.assetCode }}</el-descriptions-item>
              <el-descriptions-item label="资产名称">{{ currentAsset.assetName }}</el-descriptions-item>
              <el-descriptions-item label="资产类型">{{ currentAsset.assetType }}</el-descriptions-item>
              <el-descriptions-item label="版本号">{{ currentAsset.version }}</el-descriptions-item>
              <el-descriptions-item label="所属部门">{{ currentAsset.department }}</el-descriptions-item>
              <el-descriptions-item label="负责人">{{ currentAsset.owner }}</el-descriptions-item>
              <el-descriptions-item label="维护人">{{ currentAsset.maintainer }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="getStatusType(currentAsset.status)">
                  {{ getStatusLabel(currentAsset.status) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="安全等级">
                <el-tag :type="getSecurityLevelType(currentAsset.securityLevel)">
                  {{ getSecurityLevelLabel(currentAsset.securityLevel) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="业务域">{{ currentAsset.businessDomain }}</el-descriptions-item>
              <el-descriptions-item label="业务分类">{{ currentAsset.businessCategory }}</el-descriptions-item>
              <el-descriptions-item label="业务标签">
                <el-tag v-for="tag in currentAsset.businessTags" :key="tag" size="small" style="margin-right: 5px">
                  {{ tag }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ currentAsset.createTime }}</el-descriptions-item>
              <el-descriptions-item label="更新时间">{{ currentAsset.updateTime }}</el-descriptions-item>
              <el-descriptions-item label="资产描述" :span="2">{{ currentAsset.description }}</el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>

          <!-- 技术属性 -->
          <el-tab-pane label="技术属性" name="technical">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="数据类型">{{ currentAsset.dataType }}</el-descriptions-item>
              <el-descriptions-item label="数据格式">{{ currentAsset.dataFormat }}</el-descriptions-item>
              <el-descriptions-item label="存储位置" :span="2">{{ currentAsset.storageLocation }}</el-descriptions-item>
              <el-descriptions-item label="数据量">{{ currentAsset.dataSize }}</el-descriptions-item>
              <el-descriptions-item label="编码方式">{{ currentAsset.technicalProps?.encoding }}</el-descriptions-item>
              <el-descriptions-item label="压缩方式">{{ currentAsset.technicalProps?.compression }}</el-descriptions-item>
              <el-descriptions-item label="分区键">{{ currentAsset.technicalProps?.partitionKey }}</el-descriptions-item>
              <el-descriptions-item label="更新频率">{{ currentAsset.technicalProps?.updateFrequency }}</el-descriptions-item>
              <el-descriptions-item label="数据质量">
                <el-tag :type="currentAsset.technicalProps?.dataQuality === 'high' ? 'success' : 'warning'">
                  {{ currentAsset.technicalProps?.dataQuality }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>

          <!-- 业务属性 -->
          <el-tab-pane label="业务属性" name="business">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="业务负责人">{{ currentAsset.businessProps?.businessOwner }}</el-descriptions-item>
              <el-descriptions-item label="使用目的">{{ currentAsset.businessProps?.usagePurpose }}</el-descriptions-item>
              <el-descriptions-item label="数据来源">{{ currentAsset.businessProps?.dataSource }}</el-descriptions-item>
              <el-descriptions-item label="刷新周期">{{ currentAsset.businessProps?.refreshCycle }}</el-descriptions-item>
              <el-descriptions-item label="价值等级">
                <el-tag :type="currentAsset.businessProps?.valueLevel === 'high' ? 'success' : ''">
                  {{ currentAsset.businessProps?.valueLevel }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>

          <!-- 使用统计 -->
          <el-tab-pane label="使用统计" name="usage">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="访问次数">{{ currentAsset.usageStats?.accessCount }}</el-descriptions-item>
              <el-descriptions-item label="最近访问时间">
                {{ currentAsset.usageStats?.lastAccessTime ? new Date(currentAsset.usageStats.lastAccessTime).toLocaleString() : '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="关联资产数">{{ currentAsset.usageStats?.associatedAssets }}</el-descriptions-item>
              <el-descriptions-item label="Top用户">
                <el-tag v-for="user in currentAsset.usageStats?.topUsers" :key="user" size="small" style="margin-right: 5px">
                  {{ user }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>

            <div class="relation-info" style="margin-top: 20px">
              <h4>关联关系</h4>
              <el-descriptions :column="1" border style="margin-top: 10px">
                <el-descriptions-item label="父资产">
                  <el-tag v-for="asset in currentAsset.relations?.parentAssets" :key="asset" size="small" style="margin-right: 5px">
                    {{ asset }}
                  </el-tag>
                  <span v-if="!currentAsset.relations?.parentAssets?.length">无</span>
                </el-descriptions-item>
                <el-descriptions-item label="子资产">
                  <el-tag v-for="asset in currentAsset.relations?.childAssets" :key="asset" size="small" style="margin-right: 5px">
                    {{ asset }}
                  </el-tag>
                  <span v-if="!currentAsset.relations?.childAssets?.length">无</span>
                </el-descriptions-item>
                <el-descriptions-item label="依赖关系">
                  <el-tag v-for="dep in currentAsset.relations?.dependencies" :key="dep" size="small" type="warning" style="margin-right: 5px">
                    {{ dep }}
                  </el-tag>
                  <span v-if="!currentAsset.relations?.dependencies?.length">无</span>
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </el-tab-pane>
        </el-tabs>

        <div class="detail-actions" style="margin-top: 20px; text-align: right">
          <el-button :icon="Connection" @click="manageRelations(currentAsset)">管理关联</el-button>
          <el-button :icon="Edit" type="primary" @click="handleEdit(currentAsset); drawerVisible = false">编辑</el-button>
          <el-button @click="viewChangeHistory(currentAsset)">变更历史</el-button>
        </div>
      </div>
    </el-drawer>

    <!-- 变更历史对话框 -->
    <el-dialog v-model="changeHistoryVisible" title="变更历史" width="800px">
      <el-table :data="changeHistory" stripe>
        <el-table-column prop="changeTime" label="变更时间" width="160" />
        <el-table-column prop="changeType" label="变更类型" width="100" />
        <el-table-column prop="changeContent" label="变更内容" show-overflow-tooltip />
        <el-table-column prop="operator" label="操作人" width="120" />
      </el-table>
    </el-dialog>

    <!-- 关联关系管理对话框 -->
    <el-dialog v-model="relationDialogVisible" title="管理关联关系" width="700px">
      <el-form v-if="currentAsset" label-width="100px">
        <el-form-item label="父资产">
          <el-select
            v-model="currentAsset.relations.parentAssets"
            multiple
            filterable
            placeholder="请选择父资产"
            style="width: 100%"
          >
            <el-option
              v-for="asset in tableData.filter(a => a.id !== currentAsset?.id)"
              :key="asset.id"
              :label="asset.assetName"
              :value="asset.assetCode"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="子资产">
          <el-select
            v-model="currentAsset.relations.childAssets"
            multiple
            filterable
            placeholder="请选择子资产"
            style="width: 100%"
          >
            <el-option
              v-for="asset in tableData.filter(a => a.id !== currentAsset?.id)"
              :key="asset.id"
              :label="asset.assetName"
              :value="asset.assetCode"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="依赖关系">
          <el-select
            v-model="currentAsset.relations.dependencies"
            multiple
            filterable
            allow-create
            placeholder="请选择或输入依赖资产"
            style="width: 100%"
          >
            <el-option
              v-for="asset in tableData.filter(a => a.id !== currentAsset?.id)"
              :key="asset.id"
              :label="asset.assetName"
              :value="asset.assetCode"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="relationDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="relationDialogVisible = false; ElMessage.success('关联关系更新成功')">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.asset-basic-info {
  min-height: calc(100vh - 60px);

  .search-card {
    margin-bottom: 20px;

    .text-right {
      text-align: right;
    }
  }

  .table-card {
    :deep(.el-table) {
      cursor: pointer;

      .el-table__row {
        transition: all 0.3s;

        &:hover {
          background-color: #f5f7fa;
        }
      }
    }
  }

  .drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-right: 20px;

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .drawer-actions {
      display: flex;
      gap: 10px;
    }
  }

  .asset-detail {
    .relation-info {
      h4 {
        margin: 0 0 10px 0;
        font-size: 16px;
        font-weight: 600;
      }
    }
  }

  :deep(.el-descriptions__label) {
    font-weight: 600;
    background-color: #fafafa;
  }

  :deep(.el-tabs__item) {
    font-size: 14px;
  }
}
</style>