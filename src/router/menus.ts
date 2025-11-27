import type { RouteRecordRaw } from 'vue-router'

const uuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export const menus: Array<RouteRecordRaw> = [
  {
    name: '首页',
    path: '/home',
    component: () => import('@/views/home/Home.vue'),
    meta: {
      id: uuid(),
      icon: 'HomeFilled',
    },
  },
  {
    name: '系统管理',
    path: '/sys',
    children: [
      {
        name: '用户管理',
        path: '/sys/user/manage',
        component: () => import('@/views/user/UserManage.vue'),
        meta: {
          id: uuid(),
          icon: 'UserFilled',
        },
      },
      {
        name: '字段管理',
        path: '/sys/dict',
        component: () => import('@/views/user/DictManage.vue'),
        meta: {
          id: uuid(),
          icon: 'Lock',
        },
      },
    ],
    meta: {
      id: uuid(),
      icon: 'Setting',
    },
  },

  // 供应链预测模型数据挖掘分析系统 - 路由配置
  {
    name: '预览总况',
    path: '/overview',
    component: () => import('@/views/overview/Dashboard.vue'),
    meta: {
      id: uuid(),
      icon: 'Monitor',
    },
  },
  {
    name: '数据挖掘中心',
    path: '/supply-chain/data-mining',
    meta: {
      id: uuid(),
      icon: 'Search',
    },
    children: [
      {
        name: '数据源管理',
        path: '/supply-chain/data-mining/data-source',
        component: () => import('@/views/data-mining/DataSource.vue'),
        meta: {
          id: uuid(),
          icon: 'Connection',
        },
      },
      {
        name: '模式识别分析',
        path: '/supply-chain/data-mining/pattern-recognition',
        component: () => import('@/views/data-mining/PatternRecognition.vue'),
        meta: {
          id: uuid(),
          icon: 'TrendCharts',
        },
      },
      {
        name: '特征工程',
        path: '/supply-chain/data-mining/feature-engineering',
        component: () => import('@/views/data-mining/FeatureEngineering.vue'),
        meta: {
          id: uuid(),
          icon: 'Camera',
        },
      },
    ],
  },
  {
    name: '预测模型',
    path: '/supply-chain/prediction-models',
    meta: {
      id: uuid(),
      icon: 'Cpu',
    },
    children: [
      {
        name: '需求预测',
        path: '/supply-chain/prediction-models/demand-forecast',
        component: () => import('@/views/models/DemandForecast.vue'),
        meta: {
          id: uuid(),
          icon: 'DataLine',
        },
      },
      {
        name: '库存预测',
        path: '/supply-chain/prediction-models/inventory-forecast',
        component: () => import('@/views/models/InventoryForecast.vue'),
        meta: {
          id: uuid(),
          icon: 'Box',
        },
      },
      {
        name: '供应风险预测',
        path: '/supply-chain/prediction-models/risk-forecast',
        component: () => import('@/views/models/RiskForecast.vue'),
        meta: {
          id: uuid(),
          icon: 'Warning',
        },
      },
    ],
  },
  {
    name: '分析报告',
    path: '/supply-chain/analysis-reports',
    meta: {
      id: uuid(),
      icon: 'Document',
    },
    children: [
      {
        name: '预测报告',
        path: '/supply-chain/analysis-reports/forecast-report',
        component: () => import('@/views/reports/ForecastReport.vue'),
        meta: {
          id: uuid(),
          icon: 'DataBoard',
        },
      },
      {
        name: '洞察分析',
        path: '/supply-chain/analysis-reports/insight-analysis',
        component: () => import('@/views/reports/InsightAnalysis.vue'),
        meta: {
          id: uuid(),
          icon: 'Lightning',
        },
      },
    ],
  },
]
