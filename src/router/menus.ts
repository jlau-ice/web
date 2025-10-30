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
        name: '全流程数据整合',
        path: '/data-integration',
        component: () => import('@/views/data-platform/DataIntegration.vue'),
        meta: {
            id: uuid(),
            icon: 'Connection',
        }
    },
    {
        name: '可视化与低门槛操作',
        path: '/visual-analysis',
        component: () => import('@/views/data-platform/VisualAnalysis.vue'),
        meta: {
            id: uuid(),
            icon: 'DataBoard',
        }
    },
    {
        name: '高性能数据分析与支撑',
        path: '/data-analysis',
        component: () => import('@/views/data-platform/DataAnalysis.vue'),
        meta: {
            id: uuid(),
            icon: 'Cpu',
        }
    },
    {
        name: '智能化决策与管理支持',
        path: '/decision-support',
        component: () => import('@/views/data-platform/DecisionSupport.vue'),
        meta: {
            id: uuid(),
            icon: 'TrendCharts',
        }
    }

]