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
    name: '仪表盘',
    path: '/home',
    component: () => import('@/views/home/Home.vue'),
    meta: {
      id: uuid(),
      icon: 'Odometer',
    },
  },
  {
    name: '系统配置',
    path: '/sys',
    children: [
      {
        name: '用户管理',
        path: '/user/manage',
        component: () => import('@/views/user/UserManage.vue'),
        meta: {
          id: uuid(),
          icon: 'UserFilled',
        },
      },
      {
        name: '字段管理',
        path: '/dict',
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

  // 你所需要修改的路由
  {
    name: '数据接入与采集',
    path: '/data-ingestion',
    children: [
      {
        name: '物联网设备管理',
        path: '/iot-device-manage',
        component: () => import('@/views/data/iotDeviceManage.vue'),
        meta: {
          id: uuid(),
          icon: 'Monitor',
        },
      },
      {
        name: '多源数据接口管理',
        path: '/api-manage',
        component: () => import('@/views/data/apiManage.vue'),
        meta: {
          id: uuid(),
          icon: 'Connection',
        },
      },
      {
        name: '手动填报与导入',
        path: '/manual-input',
        component: () => import('@/views/data/manualInput.vue'),
        meta: {
          id: uuid(),
          icon: 'Edit',
        },
      },
      {
        name: '流式数据接入',
        path: '/stream-ingestion',
        component: () => import('@/views/data/streamIngestion.vue'),
        meta: {
          id: uuid(),
          icon: 'DataLine',
        },
      },
    ],
    meta: {
      id: uuid(),
      icon: 'Upload',
    },
  },
  {
    name: '数据治理与质量',
    path: '/data-governance',
    children: [
      {
        name: '元数据管理',
        path: '/metadata-manage',
        component: () => import('@/views/governance/metadataManage.vue'),
        meta: {
          id: uuid(),
          icon: 'Document',
        },
      },
      {
        name: '主数据管理',
        path: '/master-data-manage',
        component: () => import('@/views/governance/masterDataManage.vue'),
        meta: {
          id: uuid(),
          icon: 'Key',
        },
      },
      {
        name: '数据标准管理',
        path: '/data-standard-manage',
        component: () => import('@/views/governance/dataStandardManage.vue'),
        meta: {
          id: uuid(),
          icon: 'DataBoard',
        },
      },
      {
        name: '质量探查与校验',
        path: '/data-quality-check',
        component: () => import('@/views/governance/dataQualityCheck.vue'),
        meta: {
          id: uuid(),
          icon: 'Search',
        },
      },
    ],
    meta: {
      id: uuid(),
      icon: 'Setting',
    },
  },
  {
    name: '血缘分析',
    path: '/lineage-analysis',
    component: () => import('@/views/lineage/LineageAnalysis.vue'),
    meta: {
      id: uuid(),
      icon: 'Share',
    },
  },
  {
    name: '数据资产目录',
    path: '/data-asset',
    children: [
      {
        name: '资产分类与编目',
        path: '/asset-catalog',
        component: () => import('@/views/asset/assetCatalog.vue'),
        meta: {
          id: uuid(),
          icon: 'Collection',
        },
      },
      {
        name: '数据资产检索',
        path: '/asset-search',
        component: () => import('@/views/asset/assetCatalog.vue'),
        meta: {
          id: uuid(),
          icon: 'Search',
        },
      },
      {
        name: '数据资产地图',
        path: '/asset-map',
        component: () => import('@/views/asset/assetCatalog.vue'),
        meta: {
          id: uuid(),
          icon: 'MapLocation',
        },
      },
      {
        name: '数据开放与共享',
        path: '/data-sharing',
        component: () => import('@/views/asset/assetCatalog.vue'),
        meta: {
          id: uuid(),
          icon: 'Promotion',
        },
      },
    ],
    meta: {
      id: uuid(),
      icon: 'FolderOpened',
    },
  },
  {
    name: '模型管理',
    path: '/model-manage',
    children: [
      {
        name: '物理模型库',
        path: '/physical-model',
        component: () => import('@/views/model/physicalModel.vue'),
        meta: {
          id: uuid(),
          icon: 'Box',
        },
      },
    ],
    meta: {
      id: uuid(),
      icon: 'SetUp',
    },
  },
]
