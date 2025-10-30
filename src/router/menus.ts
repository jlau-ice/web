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
        name: '全景绩效指标整合',
        path: '/performance-integration',
        component: () => import('@/views/supply-chain/PerformanceIntegration.vue'),
        meta: {
            id: uuid(),
            icon: 'DataLine',
        }
    },
    {
        name: '绩效查询与统计',
        path: '/real-time-query',
        component: () => import('@/views/supply-chain/RealTimeQuery.vue'),
        meta: {
            id: uuid(),
            icon: 'Search',
        }
    },
    {
        name: '预警与问题定位',
        path: '/weakness-alert',
        component: () => import('@/views/supply-chain/WeaknessAlert.vue'),
        meta: {
            id: uuid(),
            icon: 'Warning',
        }
    },
    {
        name: '决策优化',
        path: '/decision-optimization',
        component: () => import('@/views/supply-chain/DecisionOptimization.vue'),
        meta: {
            id: uuid(),
            icon: 'TrendCharts',
        }
    }

]