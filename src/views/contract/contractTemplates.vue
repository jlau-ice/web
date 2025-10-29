<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Star,
  StarFilled,
  Document,
  CopyDocument,
  Download,
  Upload,
  View,
  Setting,
  Check,
  Delete,
  Promotion,
  Edit,
  DataAnalysis
} from '@element-plus/icons-vue'

// 类型定义
interface ContractTemplate {
  id: number
  name: string
  category: string
  description: string
  language: string
  complexity: 'simple' | 'medium' | 'complex'
  code: string
  tags: string[]
  status: 'official' | 'recommended' | 'community'
  usage: number
  rating: number
  version: string
  updateTime: string
  author: string
  isFavorite: boolean
  deployGuide: string
  example: string
  changelog: string[]
}

// 状态管理
const loading = ref(false)
const activeCategory = ref('all')
const searchKeyword = ref('')
const selectedLanguage = ref('all')
const selectedComplexity = ref('all')
const sortBy = ref('usage')
const showDetailDialog = ref(false)
const showUploadDialog = ref(false)
const showFavoriteDialog = ref(false)
const showStatsDialog = ref(false)
const currentTemplate = ref<ContractTemplate | null>(null)
const templates = ref<ContractTemplate[]>([])
const favoriteTemplates = ref<ContractTemplate[]>([])

// 分类数据
const categories = [
  { id: 'all', name: '全部模板', icon: '📚', count: 0 },
  { id: 'traceability', name: '溯源合约', icon: '🔍', count: 0 },
  { id: 'quality', name: '质量检测', icon: '✅', count: 0 },
  { id: 'transaction', name: '交易结算', icon: '💰', count: 0 },
  { id: 'permission', name: '权限管理', icon: '🔐', count: 0 }
]

// 语言选项
const languages = [
  { value: 'all', label: '全部语言' },
  { value: 'Solidity', label: 'Solidity' },
  { value: 'Vyper', label: 'Vyper' },
  { value: 'Rust', label: 'Rust' }
]

// 复杂度选项
const complexities = [
  { value: 'all', label: '全部复杂度' },
  { value: 'simple', label: '简单' },
  { value: 'medium', label: '中等' },
  { value: 'complex', label: '复杂' }
]

// 排序选项
const sortOptions = [
  { value: 'usage', label: '使用热度' },
  { value: 'rating', label: '评分' },
  { value: 'updateTime', label: '更新时间' }
]

// 上传表单
const uploadForm = reactive({
  name: '',
  category: 'traceability',
  description: '',
  language: 'Solidity',
  complexity: 'simple',
  code: '',
  tags: [] as string[]
})

// Mock 数据生成
const generateMockTemplates = (): ContractTemplate[] => {
  const mockTemplates: ContractTemplate[] = [
    {
      id: 1,
      name: '农产品溯源基础合约',
      category: 'traceability',
      description: '适用于农产品全链路溯源，记录种植、加工、运输、销售等各环节信息',
      language: 'Solidity',
      complexity: 'simple',
      tags: ['溯源', '农产品', '基础'],
      status: 'official',
      usage: 1285,
      rating: 4.8,
      version: 'v2.1.0',
      updateTime: '2025-10-25',
      author: '官方团队',
      isFavorite: false,
      code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ProductTraceability {
    struct Product {
        uint256 id;
        string name;
        string origin;
        uint256 timestamp;
        address producer;
        string status;
    }
    
    mapping(uint256 => Product) public products;
    mapping(uint256 => string[]) public productHistory;
    
    event ProductRegistered(uint256 indexed productId, string name, address producer);
    event StatusUpdated(uint256 indexed productId, string status);
    
    function registerProduct(uint256 _id, string memory _name, string memory _origin) public {
        products[_id] = Product(_id, _name, _origin, block.timestamp, msg.sender, "registered");
        emit ProductRegistered(_id, _name, msg.sender);
    }
    
    function updateStatus(uint256 _id, string memory _status) public {
        require(products[_id].id != 0, "Product not exists");
        products[_id].status = _status;
        productHistory[_id].push(_status);
        emit StatusUpdated(_id, _status);
    }
    
    function getProduct(uint256 _id) public view returns (Product memory) {
        return products[_id];
    }
}`,
      deployGuide: `### 部署步骤
1. 准备 Hardhat 或 Truffle 开发环境
2. 配置网络参数（测试网或主网）
3. 编译合约：npx hardhat compile
4. 部署合约：npx hardhat run scripts/deploy.js --network <network-name>
5. 验证合约：npx hardhat verify --network <network-name> <contract-address>`,
      example: `const contract = new web3.eth.Contract(ABI, contractAddress);
await contract.methods.registerProduct(1001, "有机苹果", "陕西洛川").send({ from: account });
await contract.methods.updateStatus(1001, "已采摘").send({ from: account });
const product = await contract.methods.getProduct(1001).call();`,
      changelog: ['v2.1.0 - 优化事件日志结构', 'v2.0.0 - 新增批量操作功能', 'v1.5.0 - 支持多语言']
    },
    {
      id: 2,
      name: '质量检测数据记录合约',
      category: 'quality',
      description: '用于记录农产品质量检测数据，包括农药残留、重金属检测等指标',
      language: 'Solidity',
      complexity: 'medium',
      tags: ['质量', '检测', '数据记录'],
      status: 'recommended',
      usage: 956,
      rating: 4.6,
      version: 'v1.8.0',
      updateTime: '2025-10-20',
      author: '质检部门',
      isFavorite: true,
      code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract QualityInspection {
    struct InspectionRecord {
        uint256 productId;
        uint256 timestamp;
        string inspector;
        mapping(string => string) testResults;
        bool passed;
    }
    
    mapping(uint256 => InspectionRecord) public inspections;
    uint256 public inspectionCount;
    
    event InspectionCompleted(uint256 indexed inspectionId, uint256 productId, bool passed);
    
    function recordInspection(
        uint256 _productId,
        string memory _inspector,
        string[] memory _testNames,
        string[] memory _testValues,
        bool _passed
    ) public returns (uint256) {
        inspectionCount++;
        InspectionRecord storage record = inspections[inspectionCount];
        record.productId = _productId;
        record.timestamp = block.timestamp;
        record.inspector = _inspector;
        record.passed = _passed;
        
        for (uint i = 0; i < _testNames.length; i++) {
            record.testResults[_testNames[i]] = _testValues[i];
        }
        
        emit InspectionCompleted(inspectionCount, _productId, _passed);
        return inspectionCount;
    }
}`,
      deployGuide: '参考基础合约部署流程，需要额外配置检测机构权限',
      example: 'await contract.methods.recordInspection(1001, "质检中心", ["农药残留", "重金属"], ["0.01mg/kg", "未检出"], true).send({ from: account });',
      changelog: ['v1.8.0 - 新增批量检测记录', 'v1.7.0 - 优化数据存储结构']
    },
    {
      id: 3,
      name: '智能交易结算合约',
      category: 'transaction',
      description: '基于智能合约的自动化交易结算，支持分期付款、质押担保等功能',
      language: 'Solidity',
      complexity: 'complex',
      tags: ['交易', '结算', '支付'],
      status: 'official',
      usage: 723,
      rating: 4.9,
      version: 'v3.0.1',
      updateTime: '2025-10-28',
      author: '官方团队',
      isFavorite: false,
      code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TradeSettlement {
    enum OrderStatus { Created, Paid, Delivered, Completed, Cancelled }
    
    struct Order {
        uint256 id;
        address buyer;
        address seller;
        uint256 amount;
        OrderStatus status;
        uint256 createTime;
        uint256 completeTime;
    }
    
    mapping(uint256 => Order) public orders;
    uint256 public orderCount;
    
    event OrderCreated(uint256 indexed orderId, address buyer, address seller, uint256 amount);
    event OrderPaid(uint256 indexed orderId);
    event OrderCompleted(uint256 indexed orderId);
    
    function createOrder(address _seller, uint256 _amount) public payable returns (uint256) {
        require(msg.value == _amount, "Payment mismatch");
        orderCount++;
        orders[orderCount] = Order(orderCount, msg.sender, _seller, _amount, OrderStatus.Paid, block.timestamp, 0);
        emit OrderCreated(orderCount, msg.sender, _seller, _amount);
        return orderCount;
    }
    
    function completeOrder(uint256 _orderId) public {
        Order storage order = orders[_orderId];
        require(order.buyer == msg.sender, "Only buyer can complete");
        require(order.status == OrderStatus.Paid, "Invalid status");
        
        order.status = OrderStatus.Completed;
        order.completeTime = block.timestamp;
        payable(order.seller).transfer(order.amount);
        
        emit OrderCompleted(_orderId);
    }
}`,
      deployGuide: '部署前需配置支付代币地址和手续费率',
      example: 'await contract.methods.createOrder(sellerAddress, web3.utils.toWei("1", "ether")).send({ from: buyer, value: web3.utils.toWei("1", "ether") });',
      changelog: ['v3.0.1 - 修复退款漏洞', 'v3.0.0 - 重构订单状态机', 'v2.5.0 - 新增多币种支持']
    },
    {
      id: 4,
      name: '多角色权限管理合约',
      category: 'permission',
      description: '实现基于角色的访问控制（RBAC），支持多层级权限管理',
      language: 'Solidity',
      complexity: 'medium',
      tags: ['权限', 'RBAC', '安全'],
      status: 'official',
      usage: 834,
      rating: 4.7,
      version: 'v2.3.0',
      updateTime: '2025-10-22',
      author: '官方团队',
      isFavorite: true,
      code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RoleBasedAccess {
    mapping(bytes32 => mapping(address => bool)) public roles;
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant VIEWER_ROLE = keccak256("VIEWER_ROLE");
    
    event RoleGranted(bytes32 indexed role, address indexed account);
    event RoleRevoked(bytes32 indexed role, address indexed account);
    
    constructor() {
        roles[ADMIN_ROLE][msg.sender] = true;
    }
    
    modifier onlyRole(bytes32 role) {
        require(roles[role][msg.sender], "Access denied");
        _;
    }
    
    function grantRole(bytes32 role, address account) public onlyRole(ADMIN_ROLE) {
        roles[role][account] = true;
        emit RoleGranted(role, account);
    }
    
    function revokeRole(bytes32 role, address account) public onlyRole(ADMIN_ROLE) {
        roles[role][account] = false;
        emit RoleRevoked(role, account);
    }
    
    function hasRole(bytes32 role, address account) public view returns (bool) {
        return roles[role][account];
    }
}`,
      deployGuide: '部署后需要立即配置管理员地址',
      example: 'await contract.methods.grantRole(OPERATOR_ROLE, operatorAddress).send({ from: admin });',
      changelog: ['v2.3.0 - 新增批量授权功能', 'v2.2.0 - 优化角色检查性能']
    },
    {
      id: 5,
      name: '供应链全流程溯源',
      category: 'traceability',
      description: '覆盖从生产到消费的完整供应链，包含物流追踪、仓储管理等功能',
      language: 'Vyper',
      complexity: 'complex',
      tags: ['供应链', '物流', '全流程'],
      status: 'community',
      usage: 456,
      rating: 4.5,
      version: 'v1.2.0',
      updateTime: '2025-10-15',
      author: '社区开发者',
      isFavorite: false,
      code: `# @version ^0.3.0

struct SupplyNode:
    nodeType: String[50]
    timestamp: uint256
    location: String[100]
    operator: address

productNodes: HashMap[uint256, DynArray[SupplyNode, 100]]

@external
def addNode(productId: uint256, nodeType: String[50], location: String[100]):
    node: SupplyNode = SupplyNode({
        nodeType: nodeType,
        timestamp: block.timestamp,
        location: location,
        operator: msg.sender
    })
    self.productNodes[productId].append(node)`,
      deployGuide: 'Vyper 合约需要使用 Vyper 编译器，部署流程与 Solidity 类似',
      example: 'contract.addNode(1001, "warehouse", "Beijing DC", transact={"from": account})',
      changelog: ['v1.2.0 - 优化存储结构', 'v1.1.0 - 新增节点类型']
    },
    {
      id: 6,
      name: '农残检测标准合约',
      category: 'quality',
      description: '预置常见农产品的农药残留检测标准，自动判断是否合格',
      language: 'Solidity',
      complexity: 'simple',
      tags: ['农残', '标准', '自动判断'],
      status: 'recommended',
      usage: 612,
      rating: 4.4,
      version: 'v1.0.5',
      updateTime: '2025-10-18',
      author: '农业部',
      isFavorite: false,
      code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PesticideStandard {
    mapping(string => uint256) public standards;
    
    constructor() {
        standards["apple"] = 100; // 0.1 mg/kg
        standards["vegetable"] = 50;
    }
    
    function checkCompliance(string memory productType, uint256 value) public view returns (bool) {
        return value <= standards[productType];
    }
}`,
      deployGuide: '部署后可通过管理员更新检测标准',
      example: 'bool passed = await contract.methods.checkCompliance("apple", 80).call();',
      changelog: ['v1.0.5 - 更新最新国标']
    },
    {
      id: 7,
      name: '预付款托管合约',
      category: 'transaction',
      description: '实现买卖双方的预付款托管，确保交易安全',
      language: 'Solidity',
      complexity: 'medium',
      tags: ['托管', '预付款', '安全'],
      status: 'community',
      usage: 389,
      rating: 4.3,
      version: 'v1.5.2',
      updateTime: '2025-10-10',
      author: '金融科技组',
      isFavorite: true,
      code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Escrow {
    mapping(uint256 => uint256) public escrows;
    
    function deposit(uint256 orderId) public payable {
        escrows[orderId] += msg.value;
    }
    
    function release(uint256 orderId, address payable recipient) public {
        uint256 amount = escrows[orderId];
        escrows[orderId] = 0;
        recipient.transfer(amount);
    }
}`,
      deployGuide: '需要配置仲裁者地址',
      example: 'await contract.methods.deposit(1001).send({ from: buyer, value: amount });',
      changelog: ['v1.5.2 - 新增仲裁机制']
    },
    {
      id: 8,
      name: '白名单权限控制',
      category: 'permission',
      description: '基于白名单的简单权限控制，适用于小型应用',
      language: 'Solidity',
      complexity: 'simple',
      tags: ['白名单', '简单', '轻量'],
      status: 'community',
      usage: 567,
      rating: 4.2,
      version: 'v1.0.0',
      updateTime: '2025-10-05',
      author: '个人开发者',
      isFavorite: false,
      code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Whitelist {
    mapping(address => bool) public whitelist;
    address public owner;
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyWhitelisted() {
        require(whitelist[msg.sender], "Not whitelisted");
        _;
    }
    
    function addToWhitelist(address account) public {
        require(msg.sender == owner);
        whitelist[account] = true;
    }
}`,
      deployGuide: '部署即可使用，无需额外配置',
      example: 'await contract.methods.addToWhitelist(userAddress).send({ from: owner });',
      changelog: ['v1.0.0 - 初始版本']
    }
  ]
  
  return mockTemplates
}

// 计算属性：过滤后的模板
const filteredTemplates = computed(() => {
  let result = templates.value

  // 按分类过滤
  if (activeCategory.value !== 'all') {
    result = result.filter(t => t.category === activeCategory.value)
  }

  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(t => 
      t.name.toLowerCase().includes(keyword) ||
      t.description.toLowerCase().includes(keyword) ||
      t.tags.some(tag => tag.toLowerCase().includes(keyword))
    )
  }

  // 按语言过滤
  if (selectedLanguage.value !== 'all') {
    result = result.filter(t => t.language === selectedLanguage.value)
  }

  // 按复杂度过滤
  if (selectedComplexity.value !== 'all') {
    result = result.filter(t => t.complexity === selectedComplexity.value)
  }

  // 排序
  result.sort((a, b) => {
    if (sortBy.value === 'usage') return b.usage - a.usage
    if (sortBy.value === 'rating') return b.rating - a.rating
    if (sortBy.value === 'updateTime') return new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime()
    return 0
  })

  return result
})

// 计算分类统计
const categoriesWithCount = computed(() => {
  return categories.map(cat => ({
    ...cat,
    count: cat.id === 'all' 
      ? templates.value.length 
      : templates.value.filter(t => t.category === cat.id).length
  }))
})

// 收藏的模板
const favoriteTemplatesList = computed(() => {
  return templates.value.filter(t => t.isFavorite)
})

// 方法：加载模板数据
const loadTemplates = async () => {
  loading.value = true
  // 模拟异步加载
  setTimeout(() => {
    templates.value = generateMockTemplates()
    loading.value = false
    ElMessage.success('模板加载成功')
  }, 800)
}

// 方法：查看模板详情
const viewTemplateDetail = (template: ContractTemplate) => {
  currentTemplate.value = template
  showDetailDialog.value = true
}

// 方法：复制代码
const copyCode = (code: string) => {
  navigator.clipboard.writeText(code).then(() => {
    ElMessage.success('代码已复制到剪贴板')
  })
}

// 方法：切换收藏
const toggleFavorite = (template: ContractTemplate) => {
  template.isFavorite = !template.isFavorite
  ElMessage.success(template.isFavorite ? '已添加到收藏' : '已取消收藏')
}

// 方法：评分
const rateTemplate = (template: ContractTemplate, rating: number) => {
  template.rating = rating
  ElMessage.success(`已评分：${rating} 星`)
}

// 方法：快速部署
const quickDeploy = (template: ContractTemplate) => {
  ElMessageBox.confirm(
    `确定要部署合约 "${template.name}" 吗？`,
    '快速部署',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    ElMessage.success('部署任务已提交，请前往部署管理查看进度')
  }).catch(() => {
    // 取消操作
  })
}

// 方法：基于模板创建
const createFromTemplate = (template: ContractTemplate) => {
  ElMessage.info(`正在基于 "${template.name}" 创建新合约...`)
  // 这里可以跳转到合约编辑页面
}

// 方法：上传模板
const uploadTemplate = () => {
  if (!uploadForm.name || !uploadForm.code) {
    ElMessage.warning('请填写模板名称和代码')
    return
  }
  
  ElMessage.success('模板上传成功，审核后将显示在列表中')
  showUploadDialog.value = false
  resetUploadForm()
}

// 方法：重置上传表单
const resetUploadForm = () => {
  uploadForm.name = ''
  uploadForm.category = 'traceability'
  uploadForm.description = ''
  uploadForm.language = 'Solidity'
  uploadForm.complexity = 'simple'
  uploadForm.code = ''
  uploadForm.tags = []
}

// 方法：导出模板
const exportTemplate = (template: ContractTemplate) => {
  const data = JSON.stringify(template, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${template.name}_v${template.version}.json`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('模板导出成功')
}

// 方法：获取复杂度标签类型
const getComplexityType = (complexity: string) => {
  const map: Record<string, string> = {
    simple: 'success',
    medium: 'warning',
    complex: 'danger'
  }
  return map[complexity] || 'info'
}

// 方法：获取状态标签类型
const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    official: 'warning',
    recommended: 'success',
    community: 'primary'
  }
  return map[status] || 'info'
}

// 方法：获取状态文本
const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    official: '官方',
    recommended: '推荐',
    community: '社区'
  }
  return map[status] || status
}

// 方法：获取复杂度文本
const getComplexityText = (complexity: string) => {
  const map: Record<string, string> = {
    simple: '简单',
    medium: '中等',
    complex: '复杂'
  }
  return map[complexity] || complexity
}

// 生命周期
onMounted(() => {
  loadTemplates()
})
</script>

<template>
  <div class="contract-templates-container">
    <!-- 顶部操作栏 -->
    <div class="top-toolbar">
      <div class="toolbar-left">
        <h2 class="page-title">
          <el-icon><Document /></el-icon>
          合约模板库
        </h2>
        <p class="page-subtitle">丰富的智能合约模板，快速部署农产品溯源应用</p>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" :icon="Upload" @click="showUploadDialog = true">
          上传模板
        </el-button>
        <el-button :icon="StarFilled" @click="showFavoriteDialog = true">
          我的收藏 ({{ favoriteTemplatesList.length }})
        </el-button>
        <el-button :icon="DataAnalysis" @click="showStatsDialog = true">
          使用统计
        </el-button>
      </div>
    </div>

    <!-- 主体内容 -->
    <div class="main-content">
      <!-- 左侧分类导航 -->
      <div class="category-sidebar">
        <div class="sidebar-header">
          <el-icon><Setting /></el-icon>
          <span>模板分类</span>
        </div>
        <div class="category-list">
          <div
            v-for="cat in categoriesWithCount"
            :key="cat.id"
            class="category-item"
            :class="{ active: activeCategory === cat.id }"
            @click="activeCategory = cat.id"
          >
            <div class="category-icon">{{ cat.icon }}</div>
            <div class="category-info">
              <div class="category-name">{{ cat.name }}</div>
              <div class="category-count">{{ cat.count }} 个模板</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 中间模板卡片区 -->
      <div class="template-main">
        <div class="search-bar">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索模板名称或关键词..."
            :prefix-icon="Search"
            size="large"
            clearable
          />
        </div>

        <div v-loading="loading" class="template-grid">
          <el-card
            v-for="template in filteredTemplates"
            :key="template.id"
            class="template-card"
            shadow="hover"
            @click="viewTemplateDetail(template)"
          >
            <template #header>
              <div class="card-header">
                <div class="template-title">
                  <span class="title-text">{{ template.name }}</span>
                  <el-icon
                    class="favorite-icon"
                    :class="{ favorited: template.isFavorite }"
                    @click.stop="toggleFavorite(template)"
                  >
                    <component :is="template.isFavorite ? StarFilled : Star" />
                  </el-icon>
                </div>
                <div class="template-tags">
                  <el-tag :type="getStatusType(template.status)" size="small">
                    {{ getStatusText(template.status) }}
                  </el-tag>
                  <el-tag :type="getComplexityType(template.complexity)" size="small">
                    {{ getComplexityText(template.complexity) }}
                  </el-tag>
                </div>
              </div>
            </template>

            <div class="card-body">
              <p class="template-description">{{ template.description }}</p>
              
              <div class="template-meta">
                <div class="meta-item">
                  <span class="meta-label">语言:</span>
                  <el-tag size="small" type="info">{{ template.language }}</el-tag>
                </div>
                <div class="meta-item">
                  <span class="meta-label">版本:</span>
                  <span class="meta-value">{{ template.version }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">作者:</span>
                  <span class="meta-value">{{ template.author }}</span>
                </div>
              </div>

              <div class="template-stats">
                <div class="stat-item">
                  <el-icon><View /></el-icon>
                  <span>{{ template.usage }}</span>
                </div>
                <div class="stat-item">
                  <el-rate
                    v-model="template.rating"
                    disabled
                    show-score
                    text-color="#ff9900"
                    score-template="{value}"
                  />
                </div>
              </div>

              <div class="template-tags-list">
                <el-tag
                  v-for="tag in template.tags"
                  :key="tag"
                  size="small"
                  effect="plain"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </div>

            <template #footer>
              <div class="card-footer">
                <el-button size="small" :icon="CopyDocument" @click.stop="copyCode(template.code)">
                  复制代码
                </el-button>
                <el-button size="small" type="primary" :icon="Promotion" @click.stop="quickDeploy(template)">
                  快速部署
                </el-button>
                <el-button size="small" :icon="Edit" @click.stop="createFromTemplate(template)">
                  创建合约
                </el-button>
              </div>
            </template>
          </el-card>

          <!-- 空状态 -->
          <div v-if="!loading && filteredTemplates.length === 0" class="empty-state">
            <el-empty description="暂无符合条件的模板">
              <el-button type="primary" @click="searchKeyword = ''; selectedLanguage = 'all'; selectedComplexity = 'all'">
                重置筛选
              </el-button>
            </el-empty>
          </div>
        </div>
      </div>

      <!-- 右侧筛选面板 -->
      <div class="filter-sidebar">
        <el-card class="filter-card" shadow="never">
          <template #header>
            <div class="filter-header">
              <el-icon><Setting /></el-icon>
              <span>筛选与排序</span>
            </div>
          </template>

          <div class="filter-section">
            <div class="filter-label">合约语言</div>
            <el-select v-model="selectedLanguage" placeholder="选择语言" style="width: 100%">
              <el-option
                v-for="lang in languages"
                :key="lang.value"
                :label="lang.label"
                :value="lang.value"
              />
            </el-select>
          </div>

          <div class="filter-section">
            <div class="filter-label">复杂度</div>
            <el-select v-model="selectedComplexity" placeholder="选择复杂度" style="width: 100%">
              <el-option
                v-for="comp in complexities"
                :key="comp.value"
                :label="comp.label"
                :value="comp.value"
              />
            </el-select>
          </div>

          <div class="filter-section">
            <div class="filter-label">排序方式</div>
            <el-select v-model="sortBy" placeholder="选择排序" style="width: 100%">
              <el-option
                v-for="sort in sortOptions"
                :key="sort.value"
                :label="sort.label"
                :value="sort.value"
              />
            </el-select>
          </div>

          <div class="filter-section">
            <el-button
              style="width: 100%"
              @click="selectedLanguage = 'all'; selectedComplexity = 'all'; sortBy = 'usage'"
            >
              重置筛选
            </el-button>
          </div>
        </el-card>

        <!-- 统计信息卡片 -->
        <el-card class="stats-card" shadow="never">
          <template #header>
            <div class="filter-header">
              <el-icon><DataAnalysis /></el-icon>
              <span>统计概览</span>
            </div>
          </template>
          <div class="stats-content">
            <div class="stat-box">
              <div class="stat-number">{{ templates.length }}</div>
              <div class="stat-text">模板总数</div>
            </div>
            <div class="stat-box">
              <div class="stat-number">{{ favoriteTemplatesList.length }}</div>
              <div class="stat-text">我的收藏</div>
            </div>
            <div class="stat-box">
              <div class="stat-number">{{ filteredTemplates.length }}</div>
              <div class="stat-text">筛选结果</div>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 模板详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      :title="currentTemplate?.name"
      width="80%"
      top="5vh"
    >
      <div v-if="currentTemplate" class="detail-content">
        <el-tabs type="border-card">
          <el-tab-pane label="基本信息">
            <div class="detail-section">
              <div class="detail-row">
                <span class="detail-label">模板名称：</span>
                <span>{{ currentTemplate.name }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">分类：</span>
                <el-tag>{{ categories.find(c => c.id === currentTemplate.category)?.name }}</el-tag>
              </div>
              <div class="detail-row">
                <span class="detail-label">描述：</span>
                <span>{{ currentTemplate.description }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">语言：</span>
                <el-tag type="info">{{ currentTemplate.language }}</el-tag>
              </div>
              <div class="detail-row">
                <span class="detail-label">复杂度：</span>
                <el-tag :type="getComplexityType(currentTemplate.complexity)">
                  {{ getComplexityText(currentTemplate.complexity) }}
                </el-tag>
              </div>
              <div class="detail-row">
                <span class="detail-label">状态：</span>
                <el-tag :type="getStatusType(currentTemplate.status)">
                  {{ getStatusText(currentTemplate.status) }}
                </el-tag>
              </div>
              <div class="detail-row">
                <span class="detail-label">版本：</span>
                <span>{{ currentTemplate.version }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">作者：</span>
                <span>{{ currentTemplate.author }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">更新时间：</span>
                <span>{{ currentTemplate.updateTime }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">使用次数：</span>
                <span>{{ currentTemplate.usage }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">评分：</span>
                <el-rate
                  v-model="currentTemplate.rating"
                  @change="rateTemplate(currentTemplate, $event)"
                />
              </div>
              <div class="detail-row">
                <span class="detail-label">标签：</span>
                <el-tag
                  v-for="tag in currentTemplate.tags"
                  :key="tag"
                  style="margin-right: 8px"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="合约代码">
            <div class="code-section">
              <div class="code-header">
                <span>{{ currentTemplate.language }} 代码</span>
                <el-button size="small" :icon="CopyDocument" @click="copyCode(currentTemplate.code)">
                  复制代码
                </el-button>
              </div>
              <pre class="code-block"><code>{{ currentTemplate.code }}</code></pre>
            </div>
          </el-tab-pane>

          <el-tab-pane label="部署指南">
            <div class="guide-section">
              <pre class="guide-content">{{ currentTemplate.deployGuide }}</pre>
            </div>
          </el-tab-pane>

          <el-tab-pane label="使用示例">
            <div class="example-section">
              <pre class="example-code"><code>{{ currentTemplate.example }}</code></pre>
            </div>
          </el-tab-pane>

          <el-tab-pane label="更新日志">
            <div class="changelog-section">
              <el-timeline>
                <el-timeline-item
                  v-for="(log, index) in currentTemplate.changelog"
                  :key="index"
                  :timestamp="log"
                >
                  {{ log }}
                </el-timeline-item>
              </el-timeline>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
        <el-button v-if="currentTemplate" :icon="Download" @click="exportTemplate(currentTemplate)">导出模板</el-button>
        <el-button v-if="currentTemplate" type="primary" :icon="Promotion" @click="quickDeploy(currentTemplate)">
          快速部署
        </el-button>
      </template>
    </el-dialog>

    <!-- 上传模板对话框 -->
    <el-dialog v-model="showUploadDialog" title="上传自定义模板" width="60%">
      <el-form :model="uploadForm" label-width="100px">
        <el-form-item label="模板名称">
          <el-input v-model="uploadForm.name" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="uploadForm.category" style="width: 100%">
            <el-option label="溯源合约" value="traceability" />
            <el-option label="质量检测" value="quality" />
            <el-option label="交易结算" value="transaction" />
            <el-option label="权限管理" value="permission" />
          </el-select>
        </el-form-item>
        <el-form-item label="合约语言">
          <el-select v-model="uploadForm.language" style="width: 100%">
            <el-option label="Solidity" value="Solidity" />
            <el-option label="Vyper" value="Vyper" />
            <el-option label="Rust" value="Rust" />
          </el-select>
        </el-form-item>
        <el-form-item label="复杂度">
          <el-select v-model="uploadForm.complexity" style="width: 100%">
            <el-option label="简单" value="simple" />
            <el-option label="中等" value="medium" />
            <el-option label="复杂" value="complex" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="uploadForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入模板描述"
          />
        </el-form-item>
        <el-form-item label="合约代码">
          <el-input
            v-model="uploadForm.code"
            type="textarea"
            :rows="10"
            placeholder="请粘贴合约代码"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button type="primary" @click="uploadTemplate">提交审核</el-button>
      </template>
    </el-dialog>

    <!-- 我的收藏对话框 -->
    <el-dialog v-model="showFavoriteDialog" title="我的收藏" width="70%">
      <div class="favorite-list">
        <el-card
          v-for="template in favoriteTemplatesList"
          :key="template.id"
          class="favorite-item"
          shadow="hover"
        >
          <div class="favorite-header">
            <span class="favorite-name">{{ template.name }}</span>
            <el-button
              size="small"
              type="danger"
              :icon="Delete"
              @click="toggleFavorite(template)"
            >
              取消收藏
            </el-button>
          </div>
          <p class="favorite-desc">{{ template.description }}</p>
          <div class="favorite-footer">
            <el-button size="small" @click="viewTemplateDetail(template)">查看详情</el-button>
            <el-button size="small" type="primary" @click="quickDeploy(template)">
              快速部署
            </el-button>
          </div>
        </el-card>
        <el-empty v-if="favoriteTemplatesList.length === 0" description="暂无收藏的模板" />
      </div>
    </el-dialog>

    <!-- 使用统计对话框 -->
    <el-dialog v-model="showStatsDialog" title="使用统计" width="60%">
      <div class="stats-detail">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-card shadow="never">
              <div class="stats-box">
                <div class="stats-number">{{ templates.length }}</div>
                <div class="stats-label">模板总数</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="never">
              <div class="stats-box">
                <div class="stats-number">{{ favoriteTemplatesList.length }}</div>
                <div class="stats-label">收藏数量</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="never">
              <div class="stats-box">
                <div class="stats-number">
                  {{ Math.round(templates.reduce((sum, t) => sum + t.usage, 0) / templates.length) }}
                </div>
                <div class="stats-label">平均使用</div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-card style="margin-top: 20px" shadow="never">
          <template #header>
            热门模板 TOP 5
          </template>
          <div class="top-templates">
            <div
              v-for="(template, index) in templates.slice().sort((a, b) => b.usage - a.usage).slice(0, 5)"
              :key="template.id"
              class="top-item"
            >
              <div class="top-rank">{{ index + 1 }}</div>
              <div class="top-info">
                <div class="top-name">{{ template.name }}</div>
                <div class="top-meta">
                  使用次数: {{ template.usage }} | 评分: {{ template.rating }}
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.contract-templates-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 100px);

  .top-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    .toolbar-left {
      .page-title {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 24px;
        font-weight: 600;
        color: #303133;
        margin: 0;
      }

      .page-subtitle {
        margin: 8px 0 0 34px;
        color: #909399;
        font-size: 14px;
      }
    }

    .toolbar-right {
      display: flex;
      gap: 12px;
    }
  }

  .main-content {
    display: grid;
    grid-template-columns: 250px 1fr 280px;
    gap: 20px;
    align-items: start;

    .category-sidebar {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      position: sticky;
      top: 20px;

      .sidebar-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 2px solid #e4e7ed;
      }

      .category-list {
        .category-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          margin-bottom: 8px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s;

          &:hover {
            background: #f5f7fa;
          }

          &.active {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;

            .category-count {
              color: rgba(255, 255, 255, 0.9);
            }
          }

          .category-icon {
            font-size: 24px;
          }

          .category-info {
            flex: 1;

            .category-name {
              font-size: 14px;
              font-weight: 500;
              margin-bottom: 4px;
            }

            .category-count {
              font-size: 12px;
              color: #909399;
            }
          }
        }
      }
    }

    .template-main {
      .search-bar {
        margin-bottom: 20px;
      }

      .template-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 20px;

        .template-card {
          cursor: pointer;
          transition: all 0.3s;
          border-radius: 8px;

          &:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
          }

          .card-header {
            .template-title {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 12px;

              .title-text {
                font-size: 16px;
                font-weight: 600;
                color: #303133;
              }

              .favorite-icon {
                font-size: 20px;
                cursor: pointer;
                color: #c0c4cc;
                transition: all 0.3s;

                &:hover {
                  color: #ffd700;
                  transform: scale(1.2);
                }

                &.favorited {
                  color: #ffd700;
                }
              }
            }

            .template-tags {
              display: flex;
              gap: 8px;
            }
          }

          .card-body {
            .template-description {
              font-size: 14px;
              color: #606266;
              line-height: 1.6;
              margin-bottom: 16px;
              min-height: 48px;
            }

            .template-meta {
              display: flex;
              flex-direction: column;
              gap: 8px;
              margin-bottom: 12px;
              padding: 12px;
              background: #f5f7fa;
              border-radius: 6px;

              .meta-item {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 13px;

                .meta-label {
                  color: #909399;
                  min-width: 50px;
                }

                .meta-value {
                  color: #606266;
                }
              }
            }

            .template-stats {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 12px;

              .stat-item {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 14px;
                color: #606266;
              }
            }

            .template-tags-list {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
            }
          }

          .card-footer {
            display: flex;
            gap: 8px;
            justify-content: space-between;
          }
        }

        .empty-state {
          grid-column: 1 / -1;
          padding: 60px 20px;
        }
      }
    }

    .filter-sidebar {
      position: sticky;
      top: 20px;

      .filter-card,
      .stats-card {
        margin-bottom: 20px;

        .filter-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }

        .filter-section {
          margin-bottom: 20px;

          &:last-child {
            margin-bottom: 0;
          }

          .filter-label {
            font-size: 14px;
            font-weight: 500;
            color: #606266;
            margin-bottom: 8px;
          }
        }

        .stats-content {
          display: flex;
          flex-direction: column;
          gap: 16px;

          .stat-box {
            text-align: center;
            padding: 16px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 8px;
            color: white;

            .stat-number {
              font-size: 28px;
              font-weight: 700;
              margin-bottom: 8px;
            }

            .stat-text {
              font-size: 14px;
              opacity: 0.9;
            }
          }
        }
      }
    }
  }

  .detail-content {
    .detail-section {
      .detail-row {
        display: flex;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #ebeef5;

        .detail-label {
          min-width: 120px;
          font-weight: 500;
          color: #606266;
        }
      }
    }

    .code-section {
      .code-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid #ebeef5;
      }

      .code-block {
        background: #282c34;
        color: #abb2bf;
        padding: 20px;
        border-radius: 6px;
        overflow-x: auto;
        font-family: 'Courier New', monospace;
        font-size: 13px;
        line-height: 1.6;
        max-height: 500px;
      }
    }

    .guide-section,
    .example-section {
      .guide-content,
      .example-code {
        background: #f5f7fa;
        padding: 20px;
        border-radius: 6px;
        font-family: 'Courier New', monospace;
        font-size: 14px;
        line-height: 1.8;
        white-space: pre-wrap;
      }
    }

    .changelog-section {
      padding: 20px;
    }
  }

  .favorite-list {
    max-height: 500px;
    overflow-y: auto;

    .favorite-item {
      margin-bottom: 16px;

      .favorite-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        .favorite-name {
          font-size: 16px;
          font-weight: 600;
          color: #303133;
        }
      }

      .favorite-desc {
        color: #606266;
        font-size: 14px;
        margin-bottom: 12px;
      }

      .favorite-footer {
        display: flex;
        gap: 12px;
      }
    }
  }

  .stats-detail {
    .stats-box {
      text-align: center;
      padding: 20px;

      .stats-number {
        font-size: 36px;
        font-weight: 700;
        color: #409eff;
        margin-bottom: 8px;
      }

      .stats-label {
        font-size: 14px;
        color: #909399;
      }
    }

    .top-templates {
      .top-item {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 12px;
        margin-bottom: 12px;
        background: #f5f7fa;
        border-radius: 6px;

        .top-rank {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 50%;
          font-weight: 700;
        }

        .top-info {
          flex: 1;

          .top-name {
            font-size: 14px;
            font-weight: 600;
            color: #303133;
            margin-bottom: 4px;
          }

          .top-meta {
            font-size: 12px;
            color: #909399;
          }
        }
      }
    }
  }
}
</style>