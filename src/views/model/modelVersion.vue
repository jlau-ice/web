<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance } from 'element-plus';

// 类型定义
interface VersionNode {
  id: string;
  label: string;
  branch: string;
  children?: VersionNode[];
}

interface VersionRecord {
  id: string;
  versionNumber: string;
  commitTime: string;
  committer: string;
  description: string;
  fileSize: string;
  status: 'current' | 'history' | 'deprecated';
  branch: string;
  tags: string[];
  changes?: {
    type: 'add' | 'modify' | 'delete';
    item: string;
    detail: string;
  }[];
}

interface VersionTag {
  id: string;
  name: string;
  color: string;
  category: string;
}

interface BranchInfo {
  name: string;
  baseVersion: string;
  headVersion: string;
  commitCount: number;
  status: 'active' | 'merged' | 'archived';
}

interface CompareResult {
  added: Array<{ type: string; name: string; detail: string }>;
  modified: Array<{ type: string; name: string; detail: string }>;
  deleted: Array<{ type: string; name: string; detail: string }>;
  summary: {
    totalChanges: number;
    addedCount: number;
    modifiedCount: number;
    deletedCount: number;
  };
}

// 响应式数据
const loading = ref(false);
const selectedBranch = ref('main');
const searchQuery = ref('');
const dateRange = ref<[string, string]>([]);

// 版本树数据
const versionTreeData = ref<VersionNode[]>([]);
const defaultProps = {
  children: 'children',
  label: 'label'
};

// 版本列表数据
const versionList = ref<VersionRecord[]>([]);
const currentVersion = ref<VersionRecord | null>(null);

// 版本对比相关
const compareDialogVisible = ref(false);
const compareVersion1 = ref('');
const compareVersion2 = ref('');
const compareResult = ref<CompareResult | null>(null);

// 版本回退相关
const rollbackDialogVisible = ref(false);
const rollbackTarget = ref<VersionRecord | null>(null);
const rollbackReason = ref('');

// 版本标签相关
const tagDialogVisible = ref(false);
const selectedVersionForTag = ref<VersionRecord | null>(null);
const availableTags = ref<VersionTag[]>([]);
const selectedTags = ref<string[]>([]);

// 分支管理相关
const branchDialogVisible = ref(false);
const branches = ref<BranchInfo[]>([]);
const newBranchForm = reactive({
  name: '',
  baseVersion: '',
  description: ''
});

// 详情面板
const showDetailPanel = ref(false);
const selectedVersionDetail = ref<VersionRecord | null>(null);

// 筛选后的版本列表
const filteredVersionList = computed(() => {
  let list = versionList.value;

  // 按分支筛选
  if (selectedBranch.value !== 'all') {
    list = list.filter(v => v.branch === selectedBranch.value);
  }

  // 搜索筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    list = list.filter(v =>
      v.versionNumber.toLowerCase().includes(query) ||
      v.description.toLowerCase().includes(query) ||
      v.committer.toLowerCase().includes(query)
    );
  }

  // 日期范围筛选
  if (dateRange.value && dateRange.value.length === 2) {
    const [start, end] = dateRange.value;
    list = list.filter(v => v.commitTime >= start && v.commitTime <= end);
  }

  return list;
});

// Mock 数据生成
const generateMockVersions = (): VersionRecord[] => {
  const versions: VersionRecord[] = [];
  const branches = ['main', 'feature-a', 'feature-b'];
  const statuses: Array<'current' | 'history' | 'deprecated'> = ['current', 'history', 'history', 'history', 'deprecated'];
  const committers = ['张三', '李四', '王五', '赵六'];

  for (let i = 20; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i * 3);

    versions.push({
      id: `v${20 - i + 1}`,
      versionNumber: `v${(20 - i + 1).toString().padStart(2, '0')}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 100)}`,
      commitTime: date.toISOString().split('T')[0] + ' ' + `${Math.floor(Math.random() * 24)}:${Math.floor(Math.random() * 60)}:${Math.floor(Math.random() * 60)}`,
      committer: committers[Math.floor(Math.random() * committers.length)],
      description: i === 0 ? '当前版本：优化模型渲染性能' : `版本更新：${['修复材质贴图问题', '添加新组件支持', '优化模型结构', '更新纹理资源', '性能优化'][Math.floor(Math.random() * 5)]}`,
      fileSize: `${(Math.random() * 50 + 10).toFixed(2)} MB`,
      status: i === 0 ? 'current' : statuses[Math.floor(Math.random() * statuses.length)],
      branch: branches[Math.floor(Math.random() * branches.length)],
      tags: i % 5 === 0 ? ['重要版本'] : i % 3 === 0 ? ['测试版本'] : [],
      changes: [
        { type: 'add', item: '组件', detail: `添加新组件 Component_${i}` },
        { type: 'modify', item: '材质', detail: `修改材质 Material_${i}` },
        { type: 'delete', item: '纹理', detail: `删除冗余纹理 Texture_${i}` }
      ]
    });
  }

  return versions;
};

const generateMockTreeData = (): VersionNode[] => {
  return [
    {
      id: '1',
      label: 'main',
      branch: 'main',
      children: [
        { id: '1-1', label: 'v01.0.0 - v05.0.0', branch: 'main' },
        { id: '1-2', label: 'v06.0.0 - v10.0.0', branch: 'main' },
        { id: '1-3', label: 'v11.0.0 - v15.0.0', branch: 'main' },
        { id: '1-4', label: 'v16.0.0 - v21.0.0 (current)', branch: 'main' }
      ]
    },
    {
      id: '2',
      label: 'feature-a',
      branch: 'feature-a',
      children: [
        { id: '2-1', label: 'v01.0.0 - v05.0.0', branch: 'feature-a' },
        { id: '2-2', label: 'v06.0.0 - v10.0.0', branch: 'feature-a' }
      ]
    },
    {
      id: '3',
      label: 'feature-b',
      branch: 'feature-b',
      children: [
        { id: '3-1', label: 'v01.0.0 - v03.0.0', branch: 'feature-b' }
      ]
    }
  ];
};

const generateMockTags = (): VersionTag[] => {
  return [
    { id: '1', name: '重要版本', color: '#f56c6c', category: '重要性' },
    { id: '2', name: '测试版本', color: '#e6a23c', category: '类型' },
    { id: '3', name: '稳定版本', color: '#67c23a', category: '稳定性' },
    { id: '4', name: '里程碑', color: '#409eff', category: '里程碑' },
    { id: '5', name: '预发布', color: '#909399', category: '发布' }
  ];
};

const generateMockBranches = (): BranchInfo[] => {
  return [
    { name: 'main', baseVersion: 'v00.0.0', headVersion: 'v21.0.0', commitCount: 21, status: 'active' },
    { name: 'feature-a', baseVersion: 'v05.0.0', headVersion: 'v10.0.0', commitCount: 5, status: 'active' },
    { name: 'feature-b', baseVersion: 'v08.0.0', headVersion: 'v11.0.0', commitCount: 3, status: 'merged' }
  ];
};

// 初始化数据
const initData = async () => {
  loading.value = true;

  // 模拟异步加载
  await new Promise(resolve => setTimeout(resolve, 800));

  versionList.value = generateMockVersions();
  versionTreeData.value = generateMockTreeData();
  availableTags.value = generateMockTags();
  branches.value = generateMockBranches();

  // 设置当前版本
  currentVersion.value = versionList.value.find(v => v.status === 'current') || null;

  loading.value = false;
  ElMessage.success('版本数据加载完成');
};

// 版本状态标签类型
const getStatusType = (status: string) => {
  const typeMap: Record<string, any> = {
    current: 'success',
    history: 'info',
    deprecated: 'info'
  };
  return typeMap[status] || 'info';
};

// 变更类型标签
const getChangeType = (type: string) => {
  const typeMap: Record<string, any> = {
    add: 'success',
    modify: 'warning',
    delete: 'danger'
  };
  return typeMap[type] || 'info';
};

// 树节点点击
const handleTreeNodeClick = (data: VersionNode) => {
  selectedBranch.value = data.branch;
};

// 查看版本详情
const viewVersionDetail = (version: VersionRecord) => {
  selectedVersionDetail.value = version;
  showDetailPanel.value = true;
};

// 版本对比
const openCompareDialog = () => {
  if (versionList.value.length < 2) {
    ElMessage.warning('至少需要两个版本才能进行对比');
    return;
  }
  compareDialogVisible.value = true;
  compareVersion1.value = '';
  compareVersion2.value = '';
  compareResult.value = null;
};

const executeCompare = async () => {
  if (!compareVersion1.value || !compareVersion2.value) {
    ElMessage.warning('请选择两个版本进行对比');
    return;
  }

  if (compareVersion1.value === compareVersion2.value) {
    ElMessage.warning('请选择不同的版本进行对比');
    return;
  }

  loading.value = true;

  // 模拟异步对比
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 生成对比结果
  compareResult.value = {
    added: [
      { type: '组件', name: 'Component_New_1', detail: '新增高精度渲染组件' },
      { type: '材质', name: 'Material_PBR_Advanced', detail: '添加PBR高级材质' },
      { type: '纹理', name: 'Texture_4K_HDR', detail: '新增4K HDR纹理' }
    ],
    modified: [
      { type: '组件', name: 'Component_Main', detail: '优化主组件性能' },
      { type: '材质', name: 'Material_Base', detail: '调整基础材质参数' },
      { type: '配置', name: 'RenderConfig', detail: '更新渲染配置' }
    ],
    deleted: [
      { type: '纹理', name: 'Texture_Old_LowRes', detail: '删除低分辨率纹理' },
      { type: '组件', name: 'Component_Deprecated', detail: '移除废弃组件' }
    ],
    summary: {
      totalChanges: 8,
      addedCount: 3,
      modifiedCount: 3,
      deletedCount: 2
    }
  };

  loading.value = false;
  ElMessage.success('版本对比完成');
};

// 版本回退
const openRollbackDialog = (version: VersionRecord) => {
  if (version.status === 'current') {
    ElMessage.warning('当前版本无法回退');
    return;
  }

  rollbackTarget.value = version;
  rollbackReason.value = '';
  rollbackDialogVisible.value = true;
};

const executeRollback = async () => {
  if (!rollbackReason.value.trim()) {
    ElMessage.warning('请输入回退原因');
    return;
  }

  await ElMessageBox.confirm(
    `确定要回退到版本 ${rollbackTarget.value?.versionNumber} 吗？此操作将创建一个新的版本节点。`,
    '确认回退',
    {
      confirmButtonText: '确认回退',
      cancelButtonText: '取消',
      type: 'warning'
    }
  );

  loading.value = true;

  // 模拟异步回退
  await new Promise(resolve => setTimeout(resolve, 1500));

  // 更新版本状态
  if (currentVersion.value) {
    currentVersion.value.status = 'history';
  }

  // 创建新版本（回退操作）
  const newVersion: VersionRecord = {
    ...rollbackTarget.value!,
    id: `v${versionList.value.length + 1}`,
    versionNumber: `v${(versionList.value.length + 1).toString().padStart(2, '0')}.0.0`,
    commitTime: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0],
    description: `回退至 ${rollbackTarget.value?.versionNumber}：${rollbackReason.value}`,
    status: 'current'
  };

  versionList.value.unshift(newVersion);
  currentVersion.value = newVersion;

  loading.value = false;
  rollbackDialogVisible.value = false;
  ElMessage.success('版本回退成功');
};

// 标签管理
const openTagDialog = (version: VersionRecord) => {
  selectedVersionForTag.value = version;
  selectedTags.value = [...version.tags];
  tagDialogVisible.value = true;
};

const saveVersionTags = async () => {
  loading.value = true;

  // 模拟异步保存
  await new Promise(resolve => setTimeout(resolve, 500));

  if (selectedVersionForTag.value) {
    selectedVersionForTag.value.tags = [...selectedTags.value];
  }

  loading.value = false;
  tagDialogVisible.value = false;
  ElMessage.success('标签保存成功');
};

// 分支管理
const openBranchDialog = () => {
  branchDialogVisible.value = true;
  newBranchForm.name = '';
  newBranchForm.baseVersion = '';
  newBranchForm.description = '';
};

const createBranch = async () => {
  if (!newBranchForm.name || !newBranchForm.baseVersion) {
    ElMessage.warning('请填写分支名称和基础版本');
    return;
  }

  loading.value = true;

  // 模拟异步创建
  await new Promise(resolve => setTimeout(resolve, 800));

  branches.value.push({
    name: newBranchForm.name,
    baseVersion: newBranchForm.baseVersion,
    headVersion: newBranchForm.baseVersion,
    commitCount: 0,
    status: 'active'
  });

  // 更新树形数据
  versionTreeData.value.push({
    id: `${versionTreeData.value.length + 1}`,
    label: newBranchForm.name,
    branch: newBranchForm.name,
    children: []
  });

  loading.value = false;
  branchDialogVisible.value = false;
  ElMessage.success('分支创建成功');
};

const mergeBranch = async (branch: BranchInfo) => {
  await ElMessageBox.confirm(
    `确定要合并分支 ${branch.name} 到 main 吗？`,
    '确认合并',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  );

  loading.value = true;
  await new Promise(resolve => setTimeout(resolve, 1000));

  branch.status = 'merged';
  loading.value = false;
  ElMessage.success('分支合并成功');
};

const getBranchStatusType = (status: string) => {
  const typeMap: Record<string, any> = {
    active: 'success',
    merged: 'info',
    archived: 'info'
  };
  return typeMap[status] || 'info';
};

// 生命周期
onMounted(() => {
  initData();
});
</script>

<template>
  <div class="model-version-container" v-loading="loading">
    <!-- 顶部工具栏 -->
    <el-card class="toolbar-card" shadow="never">
      <el-row :gutter="16" align="middle">
        <el-col :span="8">
          <el-input
            v-model="searchQuery"
            placeholder="搜索版本号、描述或提交人"
            clearable
            prefix-icon="Search"
          />
        </el-col>
        <el-col :span="6">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 100%"
          />
        </el-col>
        <el-col :span="10" style="text-align: right">
          <el-button type="primary" @click="openCompareDialog">
            版本对比
          </el-button>
          <el-button type="success" @click="openBranchDialog">
            分支管理
          </el-button>
          <el-button @click="initData">
            刷新数据
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 主内容区域 -->
    <div class="content-area">
      <!-- 左侧：版本树 -->
      <el-card class="tree-panel" shadow="never">
        <template #header>
          <div class="card-header">
            <span class="title">版本分支树</span>
          </div>
        </template>
        <el-tree
          :data="versionTreeData"
          :props="defaultProps"
          node-key="id"
          default-expand-all
          highlight-current
          @node-click="handleTreeNodeClick"
        >
          <template #default="{ node, data }">
            <span class="tree-node">
              <el-icon v-if="!data.children"><Document /></el-icon>
              <el-icon v-else><Folder /></el-icon>
              <span style="margin-left: 8px">{{ node.label }}</span>
            </span>
          </template>
        </el-tree>
      </el-card>

      <!-- 中间：版本列表 -->
      <el-card class="table-panel" shadow="never">
        <template #header>
          <div class="card-header">
            <span class="title">版本历史列表</span>
            <el-tag>当前分支: {{ selectedBranch }}</el-tag>
          </div>
        </template>

        <el-table
          :data="filteredVersionList"
          stripe
          height="calc(100vh - 280px)"
          style="width: 100%"
        >
          <el-table-column prop="versionNumber" label="版本号" width="140" fixed>
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" size="small">
                {{ row.versionNumber }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="commitTime" label="提交时间" width="180" />

          <el-table-column prop="committer" label="提交人" width="100" />

          <el-table-column prop="description" label="版本描述" min-width="200" show-overflow-tooltip />

          <el-table-column prop="fileSize" label="文件大小" width="120" />

          <el-table-column prop="branch" label="分支" width="120">
            <template #default="{ row }">
              <el-tag size="small">{{ row.branch }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column label="标签" width="150">
            <template #default="{ row }">
              <el-tag
                v-for="tag in row.tags"
                :key="tag"
                size="small"
                style="margin-right: 4px"
              >
                {{ tag }}
              </el-tag>
              <el-button
                type="primary"
                size="small"
                link
                @click="openTagDialog(row)"
              >
                管理
              </el-button>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="240" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" link @click="viewVersionDetail(row)">
                详情
              </el-button>
              <el-button
                type="warning"
                size="small"
                link
                :disabled="row.status === 'current'"
                @click="openRollbackDialog(row)"
              >
                回退
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 右侧：详情面板 -->
      <transition name="slide-fade">
        <el-card v-if="showDetailPanel && selectedVersionDetail" class="detail-panel" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="title">版本详情</span>
              <el-button size="small" text @click="showDetailPanel = false">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
          </template>

          <el-descriptions :column="1" border>
            <el-descriptions-item label="版本号">
              <el-tag :type="getStatusType(selectedVersionDetail.status)">
                {{ selectedVersionDetail.versionNumber }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getStatusType(selectedVersionDetail.status)">
                {{ selectedVersionDetail.status === 'current' ? '当前版本' :
                   selectedVersionDetail.status === 'history' ? '历史版本' : '废弃版本' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="提交时间">
              {{ selectedVersionDetail.commitTime }}
            </el-descriptions-item>
            <el-descriptions-item label="提交人">
              {{ selectedVersionDetail.committer }}
            </el-descriptions-item>
            <el-descriptions-item label="分支">
              {{ selectedVersionDetail.branch }}
            </el-descriptions-item>
            <el-descriptions-item label="文件大小">
              {{ selectedVersionDetail.fileSize }}
            </el-descriptions-item>
            <el-descriptions-item label="描述">
              {{ selectedVersionDetail.description }}
            </el-descriptions-item>
            <el-descriptions-item label="标签">
              <el-tag
                v-for="tag in selectedVersionDetail.tags"
                :key="tag"
                size="small"
                style="margin-right: 4px"
              >
                {{ tag }}
              </el-tag>
              <span v-if="selectedVersionDetail.tags.length === 0">无</span>
            </el-descriptions-item>
          </el-descriptions>

          <el-divider>变更记录</el-divider>

          <el-timeline>
            <el-timeline-item
              v-for="(change, index) in selectedVersionDetail.changes"
              :key="index"
              :type="getChangeType(change.type)"
              :icon="change.type === 'add' ? 'Plus' : change.type === 'modify' ? 'Edit' : 'Delete'"
            >
              <div class="change-item">
                <el-tag :type="getChangeType(change.type)" size="small">
                  {{ change.type === 'add' ? '新增' : change.type === 'modify' ? '修改' : '删除' }}
                </el-tag>
                <span class="change-type">{{ change.item }}</span>
                <p class="change-detail">{{ change.detail }}</p>
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </transition>
    </div>

    <!-- 版本对比对话框 -->
    <el-dialog
      v-model="compareDialogVisible"
      title="版本对比"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-alert
        title="请选择两个版本进行对比"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      />

      <el-row :gutter="20">
        <el-col :span="12">
          <el-select
            v-model="compareVersion1"
            placeholder="选择版本 1"
            style="width: 100%"
          >
            <el-option
              v-for="version in versionList"
              :key="version.id"
              :label="version.versionNumber"
              :value="version.id"
            />
          </el-select>
        </el-col>
        <el-col :span="12">
          <el-select
            v-model="compareVersion2"
            placeholder="选择版本 2"
            style="width: 100%"
          >
            <el-option
              v-for="version in versionList"
              :key="version.id"
              :label="version.versionNumber"
              :value="version.id"
            />
          </el-select>
        </el-col>
      </el-row>

      <el-button
        type="primary"
        style="width: 100%; margin-top: 20px"
        @click="executeCompare"
      >
        开始对比
      </el-button>

      <div v-if="compareResult" class="compare-result">
        <el-divider>对比结果</el-divider>

        <el-row :gutter="20" style="margin-bottom: 20px">
          <el-col :span="6">
            <el-statistic title="总变更" :value="compareResult.summary.totalChanges" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="新增" :value="compareResult.summary.addedCount">
              <template #suffix>
                <el-icon style="color: #67c23a"><CirclePlus /></el-icon>
              </template>
            </el-statistic>
          </el-col>
          <el-col :span="6">
            <el-statistic title="修改" :value="compareResult.summary.modifiedCount">
              <template #suffix>
                <el-icon style="color: #e6a23c"><Edit /></el-icon>
              </template>
            </el-statistic>
          </el-col>
          <el-col :span="6">
            <el-statistic title="删除" :value="compareResult.summary.deletedCount">
              <template #suffix>
                <el-icon style="color: #f56c6c"><Delete /></el-icon>
              </template>
            </el-statistic>
          </el-col>
        </el-row>

        <el-tabs>
          <el-tab-pane label="新增项" :badge="compareResult.added.length.toString()">
            <div v-for="(item, index) in compareResult.added" :key="index" class="compare-item">
              <el-tag type="success" size="small">{{ item.type }}</el-tag>
              <span class="item-name">{{ item.name }}</span>
              <p class="item-detail">{{ item.detail }}</p>
            </div>
          </el-tab-pane>

          <el-tab-pane label="修改项" :badge="compareResult.modified.length.toString()">
            <div v-for="(item, index) in compareResult.modified" :key="index" class="compare-item">
              <el-tag type="warning" size="small">{{ item.type }}</el-tag>
              <span class="item-name">{{ item.name }}</span>
              <p class="item-detail">{{ item.detail }}</p>
            </div>
          </el-tab-pane>

          <el-tab-pane label="删除项" :badge="compareResult.deleted.length.toString()">
            <div v-for="(item, index) in compareResult.deleted" :key="index" class="compare-item">
              <el-tag type="danger" size="small">{{ item.type }}</el-tag>
              <span class="item-name">{{ item.name }}</span>
              <p class="item-detail">{{ item.detail }}</p>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <template #footer>
        <el-button @click="compareDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 版本回退对话框 -->
    <el-dialog
      v-model="rollbackDialogVisible"
      title="版本回退"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-alert
        title="版本回退将创建一个新的版本节点，不会删除历史记录"
        type="warning"
        :closable="false"
        style="margin-bottom: 20px"
      />

      <el-descriptions :column="1" border v-if="rollbackTarget">
        <el-descriptions-item label="目标版本">
          {{ rollbackTarget.versionNumber }}
        </el-descriptions-item>
        <el-descriptions-item label="提交时间">
          {{ rollbackTarget.commitTime }}
        </el-descriptions-item>
        <el-descriptions-item label="提交人">
          {{ rollbackTarget.committer }}
        </el-descriptions-item>
        <el-descriptions-item label="描述">
          {{ rollbackTarget.description }}
        </el-descriptions-item>
      </el-descriptions>

      <el-divider />

      <el-form label-width="100px">
        <el-form-item label="回退原因" required>
          <el-input
            v-model="rollbackReason"
            type="textarea"
            :rows="4"
            placeholder="请输入回退原因"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="rollbackDialogVisible = false">取消</el-button>
        <el-button type="warning" @click="executeRollback">确认回退</el-button>
      </template>
    </el-dialog>

    <!-- 标签管理对话框 -->
    <el-dialog
      v-model="tagDialogVisible"
      title="版本标签管理"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-alert
        title="为版本添加标签以便快速识别和筛选"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      />

      <div v-if="selectedVersionForTag" style="margin-bottom: 20px">
        <strong>版本：</strong>
        <el-tag>{{ selectedVersionForTag.versionNumber }}</el-tag>
      </div>

      <el-form label-width="80px">
        <el-form-item label="选择标签">
          <el-checkbox-group v-model="selectedTags">
            <el-checkbox
              v-for="tag in availableTags"
              :key="tag.id"
              :label="tag.name"
              border
            >
              <el-tag :color="tag.color" style="margin-right: 8px">
                {{ tag.name }}
              </el-tag>
              <span style="color: #909399; font-size: 12px">{{ tag.category }}</span>
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="tagDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveVersionTags">保存</el-button>
      </template>
    </el-dialog>

    <!-- 分支管理对话框 -->
    <el-dialog
      v-model="branchDialogVisible"
      title="分支管理"
      width="900px"
      :close-on-click-modal="false"
    >
      <el-row :gutter="20">
        <el-col :span="14">
          <h4>现有分支</h4>
          <el-table :data="branches" style="width: 100%; margin-bottom: 20px">
            <el-table-column prop="name" label="分支名称" width="120" />
            <el-table-column prop="baseVersion" label="基础版本" width="110" />
            <el-table-column prop="headVersion" label="HEAD版本" width="110" />
            <el-table-column prop="commitCount" label="提交数" width="80" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getBranchStatusType(row.status)" size="small">
                  {{ row.status === 'active' ? '活跃' :
                     row.status === 'merged' ? '已合并' : '已归档' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button
                  v-if="row.status === 'active' && row.name !== 'main'"
                  type="primary"
                  size="small"
                  link
                  @click="mergeBranch(row)"
                >
                  合并
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-col>

        <el-col :span="10">
          <h4>创建新分支</h4>
          <el-form :model="newBranchForm" label-width="80px">
            <el-form-item label="分支名称" required>
              <el-input v-model="newBranchForm.name" placeholder="feature-xxx" />
            </el-form-item>
            <el-form-item label="基础版本" required>
              <el-select
                v-model="newBranchForm.baseVersion"
                placeholder="选择基础版本"
                style="width: 100%"
              >
                <el-option
                  v-for="version in versionList"
                  :key="version.id"
                  :label="version.versionNumber"
                  :value="version.versionNumber"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="描述">
              <el-input
                v-model="newBranchForm.description"
                type="textarea"
                :rows="3"
                placeholder="分支用途描述"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="createBranch">
                创建分支
              </el-button>
            </el-form-item>
          </el-form>
        </el-col>
      </el-row>

      <template #footer>
        <el-button @click="branchDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.model-version-container {

  .toolbar-card {
    margin-bottom: 16px;
  }

  .content-area {
    display: flex;
    gap: 16px;
    height: calc(100vh - 200px);

    .tree-panel {
      width: 280px;
      flex-shrink: 0;
      overflow-y: auto;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .title {
          font-weight: 600;
          font-size: 16px;
        }
      }

      .tree-node {
        display: flex;
        align-items: center;
        font-size: 14px;
      }
    }

    .table-panel {
      flex: 1;
      overflow: hidden;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .title {
          font-weight: 600;
          font-size: 16px;
        }
      }
    }

    .detail-panel {
      width: 380px;
      flex-shrink: 0;
      overflow-y: auto;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .title {
          font-weight: 600;
          font-size: 16px;
        }
      }

      .change-item {
        .change-type {
          margin-left: 8px;
          font-weight: 600;
        }

        .change-detail {
          margin: 8px 0 0 0;
          color: #606266;
          font-size: 13px;
        }
      }
    }
  }
}

// 过渡动画
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(20px);
  opacity: 0;
}

// 对比结果样式
.compare-result {
  margin-top: 20px;

  .compare-item {
    padding: 12px;
    margin-bottom: 8px;
    background: #f5f7fa;
    border-radius: 4px;

    .item-name {
      margin-left: 8px;
      font-weight: 600;
    }

    .item-detail {
      margin: 8px 0 0 0;
      color: #606266;
      font-size: 13px;
    }
  }
}

// 响应式调整
@media (max-width: 1400px) {
  .content-area {
    .detail-panel {
      width: 320px;
    }
  }
}
</style>
