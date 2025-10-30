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
        name: '实时可视化监控',
        path: '/visual-monitor',
        component: () => import('@/views/data-supervision/VisualMonitor.vue'),
        meta: {
            id: uuid(),
            icon: 'DataLine',
        }
    },
    {
        name: '智能任务调度',
        path: '/task-scheduling',
        component: () => import('@/views/data-supervision/TaskScheduling.vue'),
        meta: {
            id: uuid(),
            icon: 'Timer',
        }
    },
    {
        name: '异常预警',
        path: '/anomaly-alert',
        component: () => import('@/views/data-supervision/AnomalyAlert.vue'),
        meta: {
            id: uuid(),
            icon: 'Warning',
        }
    },
    {
        name: '即时报告与决策',
        path: '/instant-report',
        component: () => import('@/views/data-supervision/InstantReport.vue'),
        meta: {
            id: uuid(),
            icon: 'Document',
        }
    }
]