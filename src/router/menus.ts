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
        name: '视频实时处理',
        path: '/edge-processing',
        component: () => import('@/views/ai-edge/EdgeProcessing.vue'),
        meta: {
            id: uuid(),
            icon: 'VideoPlay',
        }
    },
    {
        name: '异常情况快速识别',
        path: '/anomaly-detection',
        component: () => import('@/views/ai-edge/AnomalyDetection.vue'),
        meta: {
            id: uuid(),
            icon: 'AlarmClock',
        }
    },
    {
        name: 'AI边缘设备集群',
        path: '/edge-ops',
        component: () => import('@/views/ai-edge/EdgeOps.vue'),
        meta: {
            id: uuid(),
            icon: 'Cpu',
        }
    },
    {
        name: '决策支持与效率',
        path: '/edge-decision',
        component: () => import('@/views/ai-edge/EdgeDecision.vue'),
        meta: {
            id: uuid(),
            icon: 'DataAnalysis',
        }
    }

]