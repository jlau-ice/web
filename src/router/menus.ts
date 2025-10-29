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
        name: '算法模型管理',
        path: '/algorithm-model',
        children: [
            {
                name: '模型版本管理',
                path: '/model-version',
                component: () => import('@/views/algorithm/modelVersion.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Histogram',
                }
            },
            {
                name: '模型性能监控',
                path: '/performance-monitor',
                component: () => import('@/views/algorithm/performanceMonitor.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Monitor',
                }
            },
            {
                name: '算法参数配置',
                path: '/parameter-config',
                component: () => import('@/views/algorithm/parameterConfig.vue'),
                meta: {
                    id: uuid(),
                    icon: 'SetUp',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Cpu',
        }
    },
    {
        name: '识别能力配置',
        path: '/recognition-config',
        children: [
            {
                name: '敏感类型管理',
                path: '/sensitive-type',
                component: () => import('@/views/recognition/sensitiveType.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Warning',
                }
            },
            {
                name: '识别阈值设置',
                path: '/threshold-config',
                component: () => import('@/views/recognition/thresholdConfig.vue'),
                meta: {
                    id: uuid(),
                    icon: 'ScaleToOriginal',
                }
            },
            {
                name: '特征库更新',
                path: '/feature-update',
                component: () => import('@/views/recognition/featureUpdate.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Refresh',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'DataAnalysis',
        }
    },
    {
        name: '版权内容检测',
        path: '/recog',
        children: [
            {
                name: '敏感类型管理',
                path: '/sensitive-type',
                component: () => import('@/views/recognition/sensitiveType.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Warning',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Tickets',
        }
    },{
        name: '违规内容识别',
        path: '/recog1',
        children: [
            {
                name: '敏感类型管理',
                path: '/sensitive-type',
                component: () => import('@/views/recognition/sensitiveType.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Warning',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Picture',
        }
    },

]