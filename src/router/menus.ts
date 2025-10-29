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
        name: '视频智能分析',
        path: '/video-analysis',
        children: [
            {
                name: '人脸识别追踪',
                path: '/face-recognition',
                component: () => import('@/views/video/faceRecognition.vue'),
                meta: {
                    id: uuid(),
                    icon: 'User',
                }
            },
            {
                name: '异常行为检测',
                path: '/abnormal-behavior',
                component: () => import('@/views/video/abnormalBehavior.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Warning',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'VideoCamera',
        }
    },
    {
        name: '消防监控预警',
        path: '/fire-monitoring',
        children: [
            {
                name: '火灾隐患识别',
                path: '/fire-hazard',
                component: () => import('@/views/fire/fireHazard.vue'),
                meta: {
                    id: uuid(),
                    icon: 'WarnTriangleFilled',
                }
            },
            {
                name: '消防设施监控',
                path: '/fire-facilities',
                component: () => import('@/views/fire/fireFacilities.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Monitor',
                }
            },
            {
                name: '应急疏散指引',
                path: '/evacuation-guide',
                component: () => import('@/views/fire/evacuationGuide.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Position',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Bell',
        }
    },
    {
        name: '预警规则配置',
        path: '/fing',
        children: [
            {
                name: '应急疏散指引',
                path: '/evacuation-guide',
                component: () => import('@/views/fire/evacuationGuide.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Position',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Grid',
        }
    }
    ,
    {
        name: '应急指挥调度',
        path: '/fire-',
        children: [
            {
                name: '应急疏散指引',
                path: '/evacuation-guide',
                component: () => import('@/views/fire/evacuationGuide.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Position',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Tickets',
        }
    }

]