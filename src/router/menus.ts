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

    {
        name: '实时安全监控',
        path: '/real-time-monitor',
        component: () => import('@/views/ai-warehouse/RealTimeMonitor.vue'),
        meta: {
            id: uuid(),
            icon: 'Monitor',
        }
    },
    {
        name: '风险自动化识别',
        path: '/risk-identification',
        component: () => import('@/views/ai-warehouse/RiskIdentification.vue'),
        meta: {
            id: uuid(),
            icon: 'Warning',
        }
    },
    {
        name: '智能事件响应',
        path: '/event-response',
        component: () => import('@/views/ai-warehouse/EventResponse.vue'),
        meta: {
            id: uuid(),
            icon: 'Bell',
        }
    },
    {
        name: '数据分析报告',
        path: '/data-analysis-report',
        component: () => import('@/views/ai-warehouse/DataAnalysisReport.vue'),
        meta: {
            id: uuid(),
            icon: 'DataAnalysis',
        }
    }

]