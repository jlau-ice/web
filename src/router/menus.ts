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
        name: '数据资产整合与归档',
        path: '/asset-integration',
        component: () => import('@/views/data-asset/AssetIntegration.vue'),
        meta: {
            id: uuid(),
            icon: 'Files',
        }
    },
    {
        name: '资产分类与价值评估',
        path: '/asset-evaluation',
        component: () => import('@/views/data-asset/AssetEvaluation.vue'),
        meta: {
            id: uuid(),
            icon: 'Collection',
        }
    },
    {
        name: '区块数据上链与存证',
        path: '/blockchain-record',
        component: () => import('@/views/data-asset/BlockchainRecord.vue'),
        meta: {
            id: uuid(),
            icon: 'Link',
        }
    },
    {
        name: '安全交易与流通保障',
        path: '/secure-transaction',
        component: () => import('@/views/data-asset/SecureTransaction.vue'),
        meta: {
            id: uuid(),
            icon: 'Lock',
        }
    }

]