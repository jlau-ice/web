<template>
  <div class="component-assembly-container">
    <!-- 顶部工具栏 -->
    <el-card class="toolbar-card" shadow="never">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-button-group>
            <el-button :icon="Back" @click="handleUndo" :disabled="!canUndo">
              撤销
            </el-button>
            <el-button :icon="Right" @click="handleRedo" :disabled="!canRedo">
              重做
            </el-button>
          </el-button-group>
          <el-divider direction="vertical" />
          <el-button-group>
            <el-button :icon="Download" @click="handleSaveTemplate">
              保存模板
            </el-button>
            <el-button :icon="Upload" @click="handleLoadTemplate">
              加载模板
            </el-button>
          </el-button-group>
          <el-divider direction="vertical" />
          <el-button :icon="Delete" type="danger" @click="handleClearCanvas">
            清空画布
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-tag type="info">组件数: {{ assembledComponents.length }}</el-tag>
          <el-tag type="success" style="margin-left: 10px">
            已选中: {{ selectedComponentIds.length }}
          </el-tag>
        </div>
      </div>
    </el-card>

    <!-- 主工作区 -->
    <div class="main-workspace">
      <!-- 左侧：组件库 -->
      <div class="left-panel">
        <el-card class="component-library-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="header-title">组件库</span>
              <el-button
                :icon="Refresh"
                circle
                size="small"
                @click="loadComponentLibrary"
              />
            </div>
          </template>

          <!-- 搜索和筛选 -->
          <div class="search-section">
            <el-input
              v-model="componentSearch"
              placeholder="搜索组件"
              :prefix-icon="Search"
              clearable
              @input="handleComponentSearch"
            />
            <el-select
              v-model="componentTypeFilter"
              placeholder="组件类型"
              clearable
              style="margin-top: 10px; width: 100%"
              @change="handleComponentSearch"
            >
              <el-option label="全部类型" value="" />
              <el-option label="结构件" value="structure" />
              <el-option label="传动件" value="transmission" />
              <el-option label="连接件" value="connector" />
              <el-option label="电子件" value="electronic" />
              <el-option label="装饰件" value="decoration" />
            </el-select>
          </div>

          <!-- 组件树 -->
          <div class="component-tree-section">
            <el-tree
              ref="componentTreeRef"
              :data="filteredComponentTree"
              :props="treeProps"
              node-key="id"
              default-expand-all
              :expand-on-click-node="false"
            >
              <template #default="{ node, data }">
                <div class="tree-node">
                  <span class="node-label">
                    <el-icon v-if="data.type === 'category'">
                      <Folder />
                    </el-icon>
                    <el-icon v-else>
                      <Box />
                    </el-icon>
                    {{ node.label }}
                  </span>
                  <div v-if="data.type === 'component'" class="node-actions">
                    <el-tooltip content="添加到画布">
                      <el-button
                        :icon="Plus"
                        size="small"
                        text
                        @click.stop="handleAddComponent(data)"
                      />
                    </el-tooltip>
                    <el-tooltip :content="data.favorite ? '取消收藏' : '收藏'">
                      <el-button
                        :icon="data.favorite ? StarFilled : Star"
                        size="small"
                        text
                        :type="data.favorite ? 'warning' : ''"
                        @click.stop="handleToggleFavorite(data)"
                      />
                    </el-tooltip>
                  </div>
                </div>
              </template>
            </el-tree>
          </div>

          <!-- 组件预览 -->
          <div v-if="previewComponent" class="component-preview">
            <el-divider>组件预览</el-divider>
            <div class="preview-info">
              <div class="preview-image">
                <el-image
                  :src="previewComponent.thumbnail"
                  fit="contain"
                  style="width: 100%; height: 120px"
                />
              </div>
              <div class="preview-details">
                <h4>{{ previewComponent.name }}</h4>
                <p>类型: {{ previewComponent.typeName }}</p>
                <p>尺寸: {{ previewComponent.size }}</p>
                <el-tag
                  v-for="tag in previewComponent.tags"
                  :key="tag"
                  size="small"
                  style="margin-right: 5px"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 中间：装配画布 -->
      <div class="center-panel">
        <el-card class="canvas-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="header-title">装配工作区</span>
              <div class="canvas-tools">
                <el-button-group>
                  <el-tooltip content="移动工具">
                    <el-button
                      :type="currentTool === 'move' ? 'primary' : ''"
                      size="small"
                      @click="currentTool = 'move'"
                    >
                      <el-icon><Rank /></el-icon>
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="旋转工具">
                    <el-button
                      :type="currentTool === 'rotate' ? 'primary' : ''"
                      size="small"
                      @click="currentTool = 'rotate'"
                    >
                      <el-icon><RefreshRight /></el-icon>
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="缩放工具">
                    <el-button
                      :type="currentTool === 'scale' ? 'primary' : ''"
                      size="small"
                      @click="currentTool = 'scale'"
                    >
                      <el-icon><FullScreen /></el-icon>
                    </el-button>
                  </el-tooltip>
                </el-button-group>
                <el-divider direction="vertical" />
                <el-checkbox v-model="gridSnap" label="网格吸附" />
                <el-checkbox v-model="autoAlign" label="自动对齐" />
              </div>
            </div>
          </template>

          <!-- 装配画布 -->
          <div
            class="assembly-canvas"
            @drop="handleCanvasDrop"
            @dragover.prevent
            @click="handleCanvasClick"
          >
            <!-- 网格背景 -->
            <div class="canvas-grid" :class="{ active: gridSnap }"></div>

            <!-- 已装配的组件 -->
            <div
              v-for="component in assembledComponents"
              :key="component.instanceId"
              class="assembled-component"
              :class="{
                selected: selectedComponentIds.includes(component.instanceId),
                locked: component.locked,
                hidden: component.hidden,
              }"
              :style="getComponentStyle(component)"
              @click.stop="handleSelectComponent(component)"
              @mousedown="handleComponentMouseDown(component, $event)"
            >
              <div class="component-content">
                <el-icon :size="40">
                  <Box />
                </el-icon>
                <div class="component-name">{{ component.name }}</div>
              </div>

              <!-- 组件操作按钮 -->
              <div
                v-if="selectedComponentIds.includes(component.instanceId)"
                class="component-actions"
              >
                <el-tooltip :content="component.locked ? '解锁' : '锁定'">
                  <el-button
                    :icon="component.locked ? Lock : Unlock"
                    size="small"
                    circle
                    @click.stop="handleToggleLock(component)"
                  />
                </el-tooltip>
                <el-tooltip :content="component.hidden ? '显示' : '隐藏'">
                  <el-button
                    :icon="component.hidden ? View : Hide"
                    size="small"
                    circle
                    @click.stop="handleToggleHidden(component)"
                  />
                </el-tooltip>
                <el-tooltip content="删除">
                  <el-button
                    :icon="Delete"
                    size="small"
                    circle
                    type="danger"
                    @click.stop="handleDeleteComponent(component)"
                  />
                </el-tooltip>
              </div>

              <!-- 连接点 -->
              <div
                v-for="point in component.connectionPoints"
                :key="point.id"
                class="connection-point"
                :style="{
                  left: point.x + '%',
                  top: point.y + '%',
                }"
                @click.stop="handleConnectionPointClick(component, point)"
              ></div>
            </div>

            <!-- 连接线 -->
            <svg class="connection-lines" v-if="assembledComponents.length > 0">
              <line
                v-for="connection in connections"
                :key="connection.id"
                :x1="connection.x1"
                :y1="connection.y1"
                :x2="connection.x2"
                :y2="connection.y2"
                stroke="#409EFF"
                stroke-width="2"
                stroke-dasharray="5,5"
              />
            </svg>

            <!-- 空状态 -->
            <el-empty
              v-if="assembledComponents.length === 0"
              description="从左侧拖拽组件到这里开始装配"
              :image-size="200"
            />
          </div>

          <!-- 画布底部信息 -->
          <div class="canvas-footer">
            <el-tag size="small">缩放: {{ canvasZoom }}%</el-tag>
            <el-slider
              v-model="canvasZoom"
              :min="25"
              :max="200"
              :step="25"
              style="width: 150px; margin: 0 10px"
            />
            <el-button-group size="small">
              <el-button @click="handleResetView">重置视图</el-button>
              <el-button @click="handleFitView">适应画布</el-button>
            </el-button-group>
          </div>
        </el-card>

        <!-- 装配关系管理 -->
        <el-card class="relationship-card" shadow="hover" style="margin-top: 10px">
          <template #header>
            <div class="card-header">
              <span class="header-title">装配关系</span>
              <el-button
                :icon="Link"
                size="small"
                type="primary"
                @click="showRelationshipDialog = true"
                :disabled="selectedComponentIds.length < 2"
              >
                建立关系
              </el-button>
            </div>
          </template>

          <el-table :data="relationships" size="small" max-height="150">
            <el-table-column prop="parentName" label="父组件" width="120" />
            <el-table-column prop="childName" label="子组件" width="120" />
            <el-table-column prop="type" label="关系类型" width="100">
              <template #default="{ row }">
                <el-tag size="small" :type="getRelationshipTypeColor(row.type)">
                  {{ row.typeName }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="冲突" width="80">
              <template #default="{ row }">
                <el-tag v-if="row.hasConflict" type="danger" size="small">
                  冲突
                </el-tag>
                <el-tag v-else type="success" size="small">正常</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button
                  :icon="Delete"
                  size="small"
                  type="danger"
                  text
                  @click="handleDeleteRelationship(row)"
                />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>

      <!-- 右侧：属性配置面板 -->
      <div class="right-panel">
        <el-card class="property-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="header-title">属性配置</span>
              <el-button
                v-if="selectedComponent"
                :icon="CopyDocument"
                size="small"
                @click="handleBatchEdit"
              >
                批量编辑
              </el-button>
            </div>
          </template>

          <div v-if="selectedComponent" class="property-panel">
            <!-- 基本信息 -->
            <el-divider content-position="left">基本信息</el-divider>
            <el-form label-position="top" size="small">
              <el-form-item label="组件名称">
                <el-input v-model="selectedComponent.name" />
              </el-form-item>
              <el-form-item label="组件ID">
                <el-input
                  v-model="selectedComponent.instanceId"
                  disabled
                  readonly
                />
              </el-form-item>
            </el-form>

            <!-- 变换属性 -->
            <el-divider content-position="left">变换属性</el-divider>
            <el-form label-position="top" size="small">
              <el-form-item label="位置 X">
                <el-slider
                  v-model="selectedComponent.transform.x"
                  :min="0"
                  :max="800"
                  show-input
                  @change="handleTransformChange"
                />
              </el-form-item>
              <el-form-item label="位置 Y">
                <el-slider
                  v-model="selectedComponent.transform.y"
                  :min="0"
                  :max="600"
                  show-input
                  @change="handleTransformChange"
                />
              </el-form-item>
              <el-form-item label="位置 Z">
                <el-slider
                  v-model="selectedComponent.transform.z"
                  :min="0"
                  :max="500"
                  show-input
                  @change="handleTransformChange"
                />
              </el-form-item>
              <el-form-item label="旋转角度">
                <el-slider
                  v-model="selectedComponent.transform.rotation"
                  :min="0"
                  :max="360"
                  show-input
                  @change="handleTransformChange"
                />
              </el-form-item>
              <el-form-item label="缩放比例">
                <el-slider
                  v-model="selectedComponent.transform.scale"
                  :min="0.1"
                  :max="3"
                  :step="0.1"
                  show-input
                  @change="handleTransformChange"
                />
              </el-form-item>
            </el-form>

            <!-- 材质属性 -->
            <el-divider content-position="left">材质属性</el-divider>
            <el-form label-position="top" size="small">
              <el-form-item label="材质颜色">
                <el-color-picker
                  v-model="selectedComponent.material.color"
                  show-alpha
                  @change="handleMaterialChange"
                />
              </el-form-item>
              <el-form-item label="透明度">
                <el-slider
                  v-model="selectedComponent.material.opacity"
                  :min="0"
                  :max="1"
                  :step="0.1"
                  show-input
                  @change="handleMaterialChange"
                />
              </el-form-item>
              <el-form-item label="金属度">
                <el-slider
                  v-model="selectedComponent.material.metalness"
                  :min="0"
                  :max="1"
                  :step="0.1"
                  show-input
                  @change="handleMaterialChange"
                />
              </el-form-item>
              <el-form-item label="粗糙度">
                <el-slider
                  v-model="selectedComponent.material.roughness"
                  :min="0"
                  :max="1"
                  :step="0.1"
                  show-input
                  @change="handleMaterialChange"
                />
              </el-form-item>
            </el-form>

            <!-- 动画属性 -->
            <el-divider content-position="left">动画属性</el-divider>
            <el-form label-position="top" size="small">
              <el-form-item label="启用动画">
                <el-switch v-model="selectedComponent.animation.enabled" />
              </el-form-item>
              <template v-if="selectedComponent.animation.enabled">
                <el-form-item label="动画类型">
                  <el-select
                    v-model="selectedComponent.animation.type"
                    style="width: 100%"
                  >
                    <el-option label="旋转" value="rotate" />
                    <el-option label="平移" value="translate" />
                    <el-option label="缩放" value="scale" />
                    <el-option label="震动" value="vibrate" />
                  </el-select>
                </el-form-item>
                <el-form-item label="动画速度">
                  <el-slider
                    v-model="selectedComponent.animation.speed"
                    :min="0.1"
                    :max="5"
                    :step="0.1"
                    show-input
                  />
                </el-form-item>
              </template>
            </el-form>

            <!-- 约束设置 -->
            <el-divider content-position="left">约束设置</el-divider>
            <el-form label-position="top" size="small">
              <el-form-item label="锁定位置">
                <el-checkbox-group v-model="selectedComponent.constraints.locked">
                  <el-checkbox label="x">X轴</el-checkbox>
                  <el-checkbox label="y">Y轴</el-checkbox>
                  <el-checkbox label="z">Z轴</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              <el-form-item label="碰撞检测">
                <el-switch v-model="selectedComponent.constraints.collision" />
              </el-form-item>
            </el-form>
          </div>

          <el-empty
            v-else
            description="选择一个组件以查看和编辑属性"
            :image-size="100"
          />
        </el-card>

        <!-- 历史记录 -->
        <el-card class="history-card" shadow="hover" style="margin-top: 10px">
          <template #header>
            <div class="card-header">
              <span class="header-title">操作历史</span>
              <el-button
                :icon="Delete"
                size="small"
                @click="handleClearHistory"
              >
                清空
              </el-button>
            </div>
          </template>

          <el-timeline>
            <el-timeline-item
              v-for="(item, index) in history.slice(-10)"
              :key="index"
              :timestamp="item.timestamp"
              placement="top"
              :type="index === history.length - 1 ? 'primary' : ''"
            >
              {{ item.action }}
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </div>
    </div>

    <!-- 建立关系对话框 -->
    <el-dialog
      v-model="showRelationshipDialog"
      title="建立装配关系"
      width="500px"
    >
      <el-form :model="relationshipForm" label-width="100px">
        <el-form-item label="父组件">
          <el-select
            v-model="relationshipForm.parentId"
            placeholder="选择父组件"
            style="width: 100%"
          >
            <el-option
              v-for="comp in selectedComponents"
              :key="comp.instanceId"
              :label="comp.name"
              :value="comp.instanceId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="子组件">
          <el-select
            v-model="relationshipForm.childId"
            placeholder="选择子组件"
            style="width: 100%"
          >
            <el-option
              v-for="comp in selectedComponents"
              :key="comp.instanceId"
              :label="comp.name"
              :value="comp.instanceId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关系类型">
          <el-select
            v-model="relationshipForm.type"
            placeholder="选择关系类型"
            style="width: 100%"
          >
            <el-option label="固定连接" value="fixed" />
            <el-option label="铰链连接" value="hinge" />
            <el-option label="滑动连接" value="slide" />
            <el-option label="齿轮连接" value="gear" />
          </el-select>
        </el-form-item>
        <el-form-item label="约束力">
          <el-slider v-model="relationshipForm.constraint" :min="0" :max="100" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRelationshipDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreateRelationship">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 加载模板对话框 -->
    <el-dialog
      v-model="showTemplateDialog"
      title="装配模板管理"
      width="800px"
    >
      <el-tabs v-model="templateTab">
        <el-tab-pane label="我的模板" name="my">
          <el-table :data="myTemplates" @row-click="handleSelectTemplate">
            <el-table-column prop="name" label="模板名称" />
            <el-table-column prop="components" label="组件数" width="100" />
            <el-table-column prop="createTime" label="创建时间" width="180" />
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button
                  size="small"
                  type="primary"
                  @click.stop="handleApplyTemplate(row)"
                >
                  应用
                </el-button>
                <el-button
                  size="small"
                  type="danger"
                  @click.stop="handleDeleteTemplate(row)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="共享模板" name="shared">
          <el-table :data="sharedTemplates" @row-click="handleSelectTemplate">
            <el-table-column prop="name" label="模板名称" />
            <el-table-column prop="author" label="作者" width="100" />
            <el-table-column prop="components" label="组件数" width="100" />
            <el-table-column prop="downloads" label="下载量" width="100" />
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button
                  size="small"
                  type="primary"
                  @click.stop="handleApplyTemplate(row)"
                >
                  应用
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <!-- 保存模板对话框 -->
    <el-dialog v-model="showSaveTemplateDialog" title="保存装配模板" width="400px">
      <el-form :model="saveTemplateForm" label-width="80px">
        <el-form-item label="模板名称">
          <el-input v-model="saveTemplateForm.name" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="模板描述">
          <el-input
            v-model="saveTemplateForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入模板描述"
          />
        </el-form-item>
        <el-form-item label="共享">
          <el-switch v-model="saveTemplateForm.shared" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSaveTemplateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmSaveTemplate">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import {
  Search,
  Refresh,
  Plus,
  Star,
  StarFilled,
  Folder,
  Box,
  Back,
  Right,
  Download,
  Upload,
  Delete,
  Rank,
  RefreshRight,
  FullScreen,
  Lock,
  Unlock,
  View,
  Hide,
  Link,
  CopyDocument,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { ElTree } from 'element-plus'

// 类型定义
interface Component {
  id: string
  name: string
  type: string
  typeName: string
  category: string
  thumbnail: string
  size: string
  tags: string[]
  favorite: boolean
  connectionPoints: ConnectionPoint[]
}

interface AssembledComponent extends Component {
  instanceId: string
  transform: {
    x: number
    y: number
    z: number
    rotation: number
    scale: number
  }
  material: {
    color: string
    opacity: number
    metalness: number
    roughness: number
  }
  animation: {
    enabled: boolean
    type: string
    speed: number
  }
  constraints: {
    locked: string[]
    collision: boolean
  }
  locked: boolean
  hidden: boolean
}

interface ConnectionPoint {
  id: string
  x: number
  y: number
  type: string
}

interface Relationship {
  id: string
  parentId: string
  childId: string
  parentName: string
  childName: string
  type: string
  typeName: string
  constraint: number
  hasConflict: boolean
}

interface HistoryItem {
  action: string
  timestamp: string
  state: any
}

interface Template {
  id: string
  name: string
  description: string
  components: number
  author?: string
  downloads?: number
  createTime: string
  data: any
}

// 组件库数据
const componentTreeRef = ref<InstanceType<typeof ElTree>>()
const componentSearch = ref('')
const componentTypeFilter = ref('')
const previewComponent = ref<Component | null>(null)

const componentLibrary = ref<any[]>([])
const treeProps = {
  children: 'children',
  label: 'name',
}

// 装配画布数据
const assembledComponents = ref<AssembledComponent[]>([])
const selectedComponentIds = ref<string[]>([])
const currentTool = ref('move')
const gridSnap = ref(true)
const autoAlign = ref(false)
const canvasZoom = ref(100)

// 装配关系数据
const relationships = ref<Relationship[]>([])
const connections = ref<any[]>([])
const showRelationshipDialog = ref(false)
const relationshipForm = reactive({
  parentId: '',
  childId: '',
  type: 'fixed',
  constraint: 50,
})

// 历史记录
const history = ref<HistoryItem[]>([])
const historyIndex = ref(-1)

// 模板管理
const showTemplateDialog = ref(false)
const showSaveTemplateDialog = ref(false)
const templateTab = ref('my')
const myTemplates = ref<Template[]>([])
const sharedTemplates = ref<Template[]>([])
const saveTemplateForm = reactive({
  name: '',
  description: '',
  shared: false,
})

// 计算属性
const filteredComponentTree = computed(() => {
  if (!componentSearch.value && !componentTypeFilter.value) {
    return componentLibrary.value
  }

  const filterTree = (nodes: any[]): any[] => {
    return nodes
      .map((node) => {
        const newNode = { ...node }
        if (newNode.children) {
          newNode.children = filterTree(newNode.children)
        }

        if (newNode.type === 'component') {
          const matchSearch =
            !componentSearch.value ||
            newNode.name.toLowerCase().includes(componentSearch.value.toLowerCase())
          const matchType =
            !componentTypeFilter.value || newNode.componentType === componentTypeFilter.value
          return matchSearch && matchType ? newNode : null
        }

        return newNode.children && newNode.children.length > 0 ? newNode : null
      })
      .filter((node) => node !== null)
  }

  return filterTree(componentLibrary.value)
})

const selectedComponent = computed(() => {
  if (selectedComponentIds.value.length === 1) {
    return assembledComponents.value.find(
      (c) => c.instanceId === selectedComponentIds.value[0]
    )
  }
  return null
})

const selectedComponents = computed(() => {
  return assembledComponents.value.filter((c) =>
    selectedComponentIds.value.includes(c.instanceId)
  )
})

const canUndo = computed(() => historyIndex.value > 0)
const canRedo = computed(() => historyIndex.value < history.value.length - 1)

// 初始化
onMounted(() => {
  loadComponentLibrary()
  loadTemplates()
  addHistoryItem('初始化装配工作区')
})

// 加载组件库
const loadComponentLibrary = () => {
  setTimeout(() => {
    componentLibrary.value = [
      {
        id: 'cat-structure',
        name: '结构件',
        type: 'category',
        children: [
          {
            id: 'comp-1',
            name: '底座',
            type: 'component',
            componentType: 'structure',
            typeName: '结构件',
            category: '结构件',
            thumbnail: 'https://via.placeholder.com/150',
            size: '100x100x20mm',
            tags: ['基础', '支撑'],
            favorite: false,
            connectionPoints: [
              { id: 'cp1', x: 50, y: 0, type: 'top' },
              { id: 'cp2', x: 50, y: 100, type: 'bottom' },
            ],
          },
          {
            id: 'comp-2',
            name: '支架',
            type: 'component',
            componentType: 'structure',
            typeName: '结构件',
            category: '结构件',
            thumbnail: 'https://via.placeholder.com/150',
            size: '50x50x100mm',
            tags: ['支撑', '固定'],
            favorite: true,
            connectionPoints: [
              { id: 'cp1', x: 50, y: 0, type: 'top' },
              { id: 'cp2', x: 50, y: 100, type: 'bottom' },
            ],
          },
        ],
      },
      {
        id: 'cat-transmission',
        name: '传动件',
        type: 'category',
        children: [
          {
            id: 'comp-3',
            name: '齿轮',
            type: 'component',
            componentType: 'transmission',
            typeName: '传动件',
            category: '传动件',
            thumbnail: 'https://via.placeholder.com/150',
            size: 'Φ50x10mm',
            tags: ['传动', '旋转'],
            favorite: false,
            connectionPoints: [
              { id: 'cp1', x: 50, y: 50, type: 'center' },
            ],
          },
          {
            id: 'comp-4',
            name: '链条',
            type: 'component',
            componentType: 'transmission',
            typeName: '传动件',
            category: '传动件',
            thumbnail: 'https://via.placeholder.com/150',
            size: '500mm长',
            tags: ['传动', '柔性'],
            favorite: false,
            connectionPoints: [
              { id: 'cp1', x: 0, y: 50, type: 'left' },
              { id: 'cp2', x: 100, y: 50, type: 'right' },
            ],
          },
        ],
      },
      {
        id: 'cat-connector',
        name: '连接件',
        type: 'category',
        children: [
          {
            id: 'comp-5',
            name: '螺栓',
            type: 'component',
            componentType: 'connector',
            typeName: '连接件',
            category: '连接件',
            thumbnail: 'https://via.placeholder.com/150',
            size: 'M8x30mm',
            tags: ['紧固', '标准件'],
            favorite: false,
            connectionPoints: [
              { id: 'cp1', x: 50, y: 50, type: 'center' },
            ],
          },
        ],
      },
      {
        id: 'cat-electronic',
        name: '电子件',
        type: 'category',
        children: [
          {
            id: 'comp-6',
            name: '电机',
            type: 'component',
            componentType: 'electronic',
            typeName: '电子件',
            category: '电子件',
            thumbnail: 'https://via.placeholder.com/150',
            size: 'Φ40x60mm',
            tags: ['动力', '控制'],
            favorite: true,
            connectionPoints: [
              { id: 'cp1', x: 50, y: 0, type: 'shaft' },
              { id: 'cp2', x: 0, y: 50, type: 'mount' },
              { id: 'cp3', x: 100, y: 50, type: 'mount' },
            ],
          },
          {
            id: 'comp-7',
            name: '传感器',
            type: 'component',
            componentType: 'electronic',
            typeName: '电子件',
            category: '电子件',
            thumbnail: 'https://via.placeholder.com/150',
            size: '20x20x10mm',
            tags: ['感知', '控制'],
            favorite: false,
            connectionPoints: [
              { id: 'cp1', x: 50, y: 100, type: 'mount' },
            ],
          },
        ],
      },
      {
        id: 'cat-decoration',
        name: '装饰件',
        type: 'category',
        children: [
          {
            id: 'comp-8',
            name: '外壳',
            type: 'component',
            componentType: 'decoration',
            typeName: '装饰件',
            category: '装饰件',
            thumbnail: 'https://via.placeholder.com/150',
            size: '150x100x80mm',
            tags: ['外观', '保护'],
            favorite: false,
            connectionPoints: [],
          },
        ],
      },
    ]
    ElMessage.success('组件库加载完成')
  }, 500)
}

// 组件库操作
const handleComponentSearch = () => {
  // 搜索逻辑已在 computed 中处理
}

const handleToggleFavorite = (component: Component) => {
  component.favorite = !component.favorite
  ElMessage.success(component.favorite ? '已收藏' : '已取消收藏')
}

const handleAddComponent = (component: Component) => {
  const instanceId = `${component.id}_${Date.now()}`
  const newComponent: AssembledComponent = {
    ...component,
    instanceId,
    transform: {
      x: Math.random() * 400 + 200,
      y: Math.random() * 300 + 150,
      z: 0,
      rotation: 0,
      scale: 1,
    },
    material: {
      color: '#409EFF',
      opacity: 1,
      metalness: 0.5,
      roughness: 0.5,
    },
    animation: {
      enabled: false,
      type: 'rotate',
      speed: 1,
    },
    constraints: {
      locked: [],
      collision: true,
    },
    locked: false,
    hidden: false,
  }

  assembledComponents.value.push(newComponent)
  addHistoryItem(`添加组件: ${component.name}`)
  ElMessage.success(`已添加组件: ${component.name}`)
}

// 画布操作
const handleCanvasClick = () => {
  if (selectedComponentIds.value.length > 0) {
    selectedComponentIds.value = []
  }
}

const handleSelectComponent = (component: AssembledComponent) => {
  if (component.locked) {
    ElMessage.warning('该组件已锁定')
    return
  }
  selectedComponentIds.value = [component.instanceId]
}

const handleCanvasDrop = (e: DragEvent) => {
  // 处理拖拽放置
}

const handleComponentMouseDown = (component: AssembledComponent, e: MouseEvent) => {
  if (component.locked || currentTool.value === 'move') {
    // 实现拖拽移动逻辑
  }
}

const handleToggleLock = (component: AssembledComponent) => {
  component.locked = !component.locked
  addHistoryItem(`${component.locked ? '锁定' : '解锁'}组件: ${component.name}`)
  ElMessage.success(component.locked ? '已锁定' : '已解锁')
}

const handleToggleHidden = (component: AssembledComponent) => {
  component.hidden = !component.hidden
  addHistoryItem(`${component.hidden ? '隐藏' : '显示'}组件: ${component.name}`)
  ElMessage.success(component.hidden ? '已隐藏' : '已显示')
}

const handleDeleteComponent = (component: AssembledComponent) => {
  ElMessageBox.confirm(`确定要删除组件 "${component.name}" 吗？`, '确认删除', {
    type: 'warning',
  }).then(() => {
    const index = assembledComponents.value.findIndex(
      (c) => c.instanceId === component.instanceId
    )
    if (index > -1) {
      assembledComponents.value.splice(index, 1)
      selectedComponentIds.value = selectedComponentIds.value.filter(
        (id) => id !== component.instanceId
      )
      addHistoryItem(`删除组件: ${component.name}`)
      ElMessage.success('删除成功')
    }
  })
}

const handleClearCanvas = () => {
  ElMessageBox.confirm('确定要清空画布吗？', '确认清空', {
    type: 'warning',
  }).then(() => {
    assembledComponents.value = []
    selectedComponentIds.value = []
    relationships.value = []
    connections.value = []
    addHistoryItem('清空画布')
    ElMessage.success('画布已清空')
  })
}

const handleResetView = () => {
  canvasZoom.value = 100
  ElMessage.success('视图已重置')
}

const handleFitView = () => {
  ElMessage.info('自动适应画布')
}

// 组件样式计算
const getComponentStyle = (component: AssembledComponent) => {
  return {
    left: `${component.transform.x}px`,
    top: `${component.transform.y}px`,
    transform: `rotate(${component.transform.rotation}deg) scale(${component.transform.scale})`,
    opacity: component.hidden ? 0.3 : component.material.opacity,
    zIndex: component.transform.z,
  }
}

// 属性变更处理
const handleTransformChange = () => {
  if (selectedComponent.value) {
    addHistoryItem(`变换组件: ${selectedComponent.value.name}`)
  }
}

const handleMaterialChange = () => {
  if (selectedComponent.value) {
    addHistoryItem(`修改材质: ${selectedComponent.value.name}`)
  }
}

const handleBatchEdit = () => {
  ElMessage.info('批量编辑功能')
}

// 装配关系管理
const handleConnectionPointClick = (
  component: AssembledComponent,
  point: ConnectionPoint
) => {
  ElMessage.info(`点击连接点: ${point.id}`)
}

const handleCreateRelationship = () => {
  if (!relationshipForm.parentId || !relationshipForm.childId) {
    ElMessage.warning('请选择父组件和子组件')
    return
  }

  if (relationshipForm.parentId === relationshipForm.childId) {
    ElMessage.warning('父组件和子组件不能相同')
    return
  }

  const parent = assembledComponents.value.find(
    (c) => c.instanceId === relationshipForm.parentId
  )
  const child = assembledComponents.value.find(
    (c) => c.instanceId === relationshipForm.childId
  )

  if (!parent || !child) {
    ElMessage.error('组件不存在')
    return
  }

  const typeNames: Record<string, string> = {
    fixed: '固定连接',
    hinge: '铰链连接',
    slide: '滑动连接',
    gear: '齿轮连接',
  }

  const relationship: Relationship = {
    id: `rel_${Date.now()}`,
    parentId: relationshipForm.parentId,
    childId: relationshipForm.childId,
    parentName: parent.name,
    childName: child.name,
    type: relationshipForm.type,
    typeName: typeNames[relationshipForm.type],
    constraint: relationshipForm.constraint,
    hasConflict: Math.random() > 0.7, // 模拟冲突检测
  }

  relationships.value.push(relationship)
  showRelationshipDialog.value = false
  addHistoryItem(`建立关系: ${parent.name} -> ${child.name}`)
  ElMessage.success('装配关系已建立')

  // 重置表单
  relationshipForm.parentId = ''
  relationshipForm.childId = ''
  relationshipForm.type = 'fixed'
  relationshipForm.constraint = 50
}

const handleDeleteRelationship = (relationship: Relationship) => {
  const index = relationships.value.findIndex((r) => r.id === relationship.id)
  if (index > -1) {
    relationships.value.splice(index, 1)
    addHistoryItem(`删除关系: ${relationship.parentName} -> ${relationship.childName}`)
    ElMessage.success('关系已删除')
  }
}

const getRelationshipTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    fixed: 'success',
    hinge: 'primary',
    slide: 'warning',
    gear: 'info',
  }
  return colors[type] || ''
}

// 历史记录管理
const addHistoryItem = (action: string) => {
  const item: HistoryItem = {
    action,
    timestamp: new Date().toLocaleTimeString(),
    state: JSON.parse(JSON.stringify(assembledComponents.value)),
  }

  // 如果不在历史末尾，删除当前位置之后的历史
  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1)
  }

  history.value.push(item)
  historyIndex.value = history.value.length - 1
}

const handleUndo = () => {
  if (canUndo.value) {
    historyIndex.value--
    const historyItem = history.value[historyIndex.value]
    assembledComponents.value = JSON.parse(JSON.stringify(historyItem.state))
    ElMessage.success('已撤销')
  }
}

const handleRedo = () => {
  if (canRedo.value) {
    historyIndex.value++
    const historyItem = history.value[historyIndex.value]
    assembledComponents.value = JSON.parse(JSON.stringify(historyItem.state))
    ElMessage.success('已重做')
  }
}

const handleClearHistory = () => {
  history.value = []
  historyIndex.value = -1
  ElMessage.success('历史记录已清空')
}

// 模板管理
const loadTemplates = () => {
  setTimeout(() => {
    myTemplates.value = [
      {
        id: 'tpl1',
        name: '标准机械臂装配',
        description: '6自由度机械臂标准装配',
        components: 12,
        createTime: '2025-10-25 10:30:00',
        data: {},
      },
      {
        id: 'tpl2',
        name: '传送带系统',
        description: '工业传送带装配模板',
        components: 8,
        createTime: '2025-10-26 14:20:00',
        data: {},
      },
    ]

    sharedTemplates.value = [
      {
        id: 'shared1',
        name: '四轴机械手',
        description: '通用四轴机械手装配',
        components: 15,
        author: '张工程师',
        downloads: 128,
        createTime: '2025-10-20 09:00:00',
        data: {},
      },
      {
        id: 'shared2',
        name: '自动分拣系统',
        description: '智能分拣装配方案',
        components: 20,
        author: '李工程师',
        downloads: 95,
        createTime: '2025-10-22 16:45:00',
        data: {},
      },
    ]
  }, 300)
}

const handleSaveTemplate = () => {
  if (assembledComponents.value.length === 0) {
    ElMessage.warning('画布为空，无法保存模板')
    return
  }
  showSaveTemplateDialog.value = true
}

const handleConfirmSaveTemplate = () => {
  if (!saveTemplateForm.name) {
    ElMessage.warning('请输入模板名称')
    return
  }

  const template: Template = {
    id: `tpl_${Date.now()}`,
    name: saveTemplateForm.name,
    description: saveTemplateForm.description,
    components: assembledComponents.value.length,
    createTime: new Date().toLocaleString(),
    data: {
      components: assembledComponents.value,
      relationships: relationships.value,
    },
  }

  if (saveTemplateForm.shared) {
    sharedTemplates.value.push(template)
  } else {
    myTemplates.value.push(template)
  }

  showSaveTemplateDialog.value = false
  ElMessage.success('模板保存成功')

  // 重置表单
  saveTemplateForm.name = ''
  saveTemplateForm.description = ''
  saveTemplateForm.shared = false
}

const handleLoadTemplate = () => {
  showTemplateDialog.value = true
}

const handleSelectTemplate = (template: Template) => {
  // 预览模板
}

const handleApplyTemplate = (template: Template) => {
  ElMessageBox.confirm('应用模板将清空当前画布，是否继续？', '确认应用', {
    type: 'warning',
  }).then(() => {
    if (template.data) {
      assembledComponents.value = JSON.parse(
        JSON.stringify(template.data.components || [])
      )
      relationships.value = JSON.parse(
        JSON.stringify(template.data.relationships || [])
      )
      selectedComponentIds.value = []
      addHistoryItem(`应用模板: ${template.name}`)
      ElMessage.success('模板应用成功')
      showTemplateDialog.value = false
    }
  })
}

const handleDeleteTemplate = (template: Template) => {
  ElMessageBox.confirm(`确定要删除模板 "${template.name}" 吗？`, '确认删除', {
    type: 'warning',
  }).then(() => {
    const index = myTemplates.value.findIndex((t) => t.id === template.id)
    if (index > -1) {
      myTemplates.value.splice(index, 1)
      ElMessage.success('模板已删除')
    }
  })
}
</script>

<style scoped lang="scss">
.component-assembly-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  .toolbar-card {
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .toolbar-left {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .toolbar-right {
        display: flex;
        gap: 10px;
      }
    }
  }

  .main-workspace {
    flex: 1;
    display: grid;
    grid-template-columns: 280px 1fr 320px;
    gap: 10px;
    overflow: hidden;

    .left-panel,
    .center-panel,
    .right-panel {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    // 左侧面板
    .left-panel {
      .component-library-card {
        height: 100%;
        display: flex;
        flex-direction: column;

        :deep(.el-card__body) {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .search-section {
          margin-bottom: 15px;
        }

        .component-tree-section {
          flex: 1;
          overflow-y: auto;
          margin-bottom: 15px;

          .tree-node {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-right: 10px;

            .node-label {
              display: flex;
              align-items: center;
              gap: 8px;
            }

            .node-actions {
              display: flex;
              gap: 5px;
              opacity: 0;
              transition: opacity 0.3s;
            }

            &:hover .node-actions {
              opacity: 1;
            }
          }
        }

        .component-preview {
          .preview-info {
            .preview-image {
              margin-bottom: 10px;
              border-radius: 8px;
              overflow: hidden;
              border: 1px solid #dcdfe6;
            }

            .preview-details {
              h4 {
                margin: 0 0 10px 0;
                color: #303133;
              }

              p {
                margin: 5px 0;
                color: #606266;
                font-size: 14px;
              }
            }
          }
        }
      }
    }

    // 中间面板
    .center-panel {
      .canvas-card {
        flex: 1;
        display: flex;
        flex-direction: column;

        :deep(.el-card__body) {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 0;
        }

        .canvas-tools {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .assembly-canvas {
          position: relative;
          flex: 1;
          background: #ffffff;
          border: 2px dashed #dcdfe6;
          border-radius: 8px;
          margin: 15px;
          overflow: hidden;

          .canvas-grid {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: linear-gradient(#e5e7eb 1px, transparent 1px),
              linear-gradient(90deg, #e5e7eb 1px, transparent 1px);
            background-size: 20px 20px;
            opacity: 0;
            transition: opacity 0.3s;

            &.active {
              opacity: 1;
            }
          }

          .assembled-component {
            position: absolute;
            width: 100px;
            height: 100px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 8px;
            cursor: move;
            transition: all 0.3s;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

            &.selected {
              border: 3px solid #409eff;
              box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.2);
            }

            &.locked {
              border: 3px solid #f56c6c;
              cursor: not-allowed;
            }

            &.hidden {
              opacity: 0.3;
            }

            .component-content {
              color: white;
              text-align: center;

              .component-name {
                margin-top: 5px;
                font-size: 12px;
                font-weight: bold;
              }
            }

            .component-actions {
              position: absolute;
              top: -40px;
              left: 50%;
              transform: translateX(-50%);
              display: flex;
              gap: 5px;
              background: white;
              padding: 5px;
              border-radius: 20px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            }

            .connection-point {
              position: absolute;
              width: 10px;
              height: 10px;
              background: #67c23a;
              border: 2px solid white;
              border-radius: 50%;
              cursor: pointer;
              transform: translate(-50%, -50%);
              transition: all 0.3s;

              &:hover {
                width: 14px;
                height: 14px;
                background: #f56c6c;
              }
            }
          }

          .connection-lines {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
          }
        }

        .canvas-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
          border-top: 1px solid #ebeef5;
          gap: 15px;
        }
      }

      .relationship-card {
        :deep(.el-card__body) {
          padding: 15px;
        }
      }
    }

    // 右侧面板
    .right-panel {
      .property-card,
      .history-card {
        :deep(.el-card__body) {
          padding: 15px;
          overflow-y: auto;
        }
      }

      .property-card {
        flex: 1;

        .property-panel {
          .el-divider {
            margin: 20px 0 15px 0;
          }
        }
      }

      .history-card {
        max-height: 300px;
      }
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-title {
      font-weight: bold;
      font-size: 16px;
      color: #303133;
    }
  }
}

// 响应式设计
@media (max-width: 1600px) {
  .component-assembly-container .main-workspace {
    grid-template-columns: 260px 1fr 300px;
  }
}

@media (max-width: 1400px) {
  .component-assembly-container .main-workspace {
    grid-template-columns: 240px 1fr 280px;
  }
}
</style>