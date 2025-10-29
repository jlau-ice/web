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
        name: '三维模型管理',
        path: '/3d-model',
        children: [
            {
                name: '模型导入导出',
                path: '/model-import-export',
                component: () => import('@/views/model/modelImportExport.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Upload',
                }
            },
            {
                name: '模型版本控制',
                path: '/model-version',
                component: () => import('@/views/model/modelVersion.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Histogram',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Box',
        }
    },
    {
        name: '模型组合装配',
        path: '/model-assembly',
        children: [
            {
                name: '组件化装配',
                path: '/component-assembly',
                component: () => import('@/views/assembly/componentAssembly.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Connection',
                }
            },
            {
                name: '空间位置校准',
                path: '/spatial-calibration',
                component: () => import('@/views/assembly/spatialCalibration.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Position',
                }
            },
            {
                name: '模型权限控制',
                path: '/model-permission',
                component: () => import('@/views/assembly/modelPermission.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Lock',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'SetUp',
        }
    },
    {
        name: '物理仿真计算',
        path: '/mod',
        children: [
            {
                name: '组件化装配',
                path: '/component-assembly',
                component: () => import('@/views/assembly/componentAssembly.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Connection',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Iphone',
        }
    },{
        name: '场景渲染管理',
        path: '/dsad',
        children: [
            {
                name: '组件化装配',
                path: '/component-assembly',
                component: () => import('@/views/assembly/componentAssembly.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Connection',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Grid',
        }
    }
]