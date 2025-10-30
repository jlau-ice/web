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
        name: '区块链网络快速搭建',
        path: '/blockchain-setup',
        component: () => import('@/views/blockchain-baas/BlockchainSetup.vue'),
        meta: {
            id: uuid(),
            icon: 'Connection',
        }
    },
    {
        name: '应用模板与业务开发',
        path: '/app-templates',
        component: () => import('@/views/blockchain-baas/AppTemplates.vue'),
        meta: {
            id: uuid(),
            icon: 'MagicStick',
        }
    },
    {
        name: '统一运维与资源管理',
        path: '/unified-ops',
        component: () => import('@/views/blockchain-baas/UnifiedOps.vue'),
        meta: {
            id: uuid(),
            icon: 'Monitor',
        }
    },
    {
        name: '数字转型与效率赋能',
        path: '/digital-transformation',
        component: () => import('@/views/blockchain-baas/DigitalTransformation.vue'),
        meta: {
            id: uuid(),
            icon: 'TrendCharts',
        }
    }
]