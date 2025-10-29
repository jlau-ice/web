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
        name: 'API服务管理',
        path: '/api-service',
        children: [
            {
                name: '接口权限管理',
                path: '/api-permission',
                component: () => import('@/views/api/apiPermission.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Lock',
                }
            },
            {
                name: '访问密钥管理',
                path: '/access-key',
                component: () => import('@/views/api/accessKey.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Key',
                }
            },
            {
                name: '调用额度控制',
                path: '/quota-control',
                component: () => import('@/views/api/quotaControl.vue'),
                meta: {
                    id: uuid(),
                    icon: 'SetUp',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Management',
        }
    },
    {
        name: '数据上链服务',
        path: '/data-onchain',
        children: [
            {
                name: '批量上链接口',
                path: '/batch-upload',
                component: () => import('@/views/onchain/batchUpload.vue'),
                meta: {
                    id: uuid(),
                    icon: 'UploadFilled',
                }
            },
            {
                name: '实时上链接口',
                path: '/realtime-upload',
                component: () => import('@/views/onchain/realtimeUpload.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Refresh',
                }
            },
            {
                name: '数据格式校验',
                path: '/data-validate',
                component: () => import('@/views/onchain/dataValidate.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Checked',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Promotion',
        }
    },
    {
        name: '查询验证服务',
        path: '/da',
        children: [
            {
                name: '批量上链接口',
                path: '/batch-upload',
                component: () => import('@/views/onchain/batchUpload.vue'),
                meta: {
                    id: uuid(),
                    icon: 'UploadFilled',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'ZoomIn',
        }
    },
    {
        name: '服务监控分析',
        path: '/a',
        children: [
            {
                name: '批量上链接口',
                path: '/batch-upload',
                component: () => import('@/views/onchain/batchUpload.vue'),
                meta: {
                    id: uuid(),
                    icon: 'UploadFilled',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Operation',
        }
    }

]