import type {RouteRecordRaw} from 'vue-router'

const uuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0,
            v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

export const menus: Array<RouteRecordRaw> = [
    {
        name: '首页',
        path: '/home',
        component: () => import('@/views/home/Home.vue'),
        meta: {
            id: uuid(),
            icon: 'HomeFilled',
        }
    },
    {
        name: '系统管理',
        path: '/sys',
        children: [
            {
                name: '用户管理',
                path: '/user/manage',
                component: () => import('@/views/user/UserManage.vue'),
                meta: {
                    id: uuid(),
                    icon: 'UserFilled',
                }
            },
            {
                name: '字段管理',
                path: '/dict',
                component: () => import('@/views/user/DictManage.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Lock',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Setting',
        }
    },

    // 你所需要修改的路由
    {
        name: '模型配置',
        path: '/supply-chain/model',
        children: [
            {
                name: '任务管理',
                path: '/supply-chain/model/tasks',
                component: () => import('@/views/supplychain/SupplyChainModule.vue'),
                meta: {
                    id: uuid(),
                    icon: 'List',
                    moduleKey: 'taskOrchestration',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Collection',
        }
    },
    {
        name: '数据中枢',
        path: '/supply-chain/data',
        children: [
            {
                name: '数据源管理',
                path: '/supply-chain/data/sources',
                component: () => import('@/views/supplychain/SupplyChainModule.vue'),
                meta: {
                    id: uuid(),
                    icon: 'DataAnalysis',
                    moduleKey: 'dataSources',
                }
            },
            {
                name: '数据质量监控',
                path: '/supply-chain/data/quality',
                component: () => import('@/views/supplychain/SupplyChainModule.vue'),
                meta: {
                    id: uuid(),
                    icon: 'WarningFilled',
                    moduleKey: 'dataQuality',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Histogram',
        }
    },
    {
        name: '需求感知',
        path: '/supply-chain/demand',
        children: [
            {
                name: '多维预测',
                path: '/supply-chain/demand/forecast',
                component: () => import('@/views/supplychain/SupplyChainModule.vue'),
                meta: {
                    id: uuid(),
                    icon: 'TrendCharts',
                    moduleKey: 'multiForecast',
                }
            },
            {
                name: '影响因素分析',
                path: '/supply-chain/demand/factors',
                component: () => import('@/views/supplychain/SupplyChainModule.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Guide',
                    moduleKey: 'factorAnalysis',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Compass',
        }
    },

]