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
// 你所需要修改的路由
    {
        name: '区块链管理',
        path: '/blockchain-manage',
        children: [
            {
                name: '链网络管理',
                path: '/chain-network',
                component: () => import('@/views/blockchain/chainNetwork.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Connection',
                }
            },
            {
                name: '节点状态监控',
                path: '/node-monitor',
                component: () => import('@/views/blockchain/nodeMonitor.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Monitor',
                }
            },
            {
                name: '区块浏览器',
                path: '/block-explorer',
                component: () => import('@/views/blockchain/blockExplorer.vue'),
                meta: {
                    id: uuid(),
                    icon: 'View',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Cpu',
        }
    },
    {
        name: '智能合约服务',
        path: '/smart-contract',
        children: [
            {
                name: '合约模板库',
                path: '/contract-templates',
                component: () => import('@/views/contract/contractTemplates.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Collection',
                }
            },
            {
                name: '合约部署管理',
                path: '/contract-deploy',
                component: () => import('@/views/contract/contractDeploy.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Upload',
                }
            },
            {
                name: '合约调用监控',
                path: '/contract-monitor',
                component: () => import('@/views/contract/contractMonitor.vue'),
                meta: {
                    id: uuid(),
                    icon: 'DataLine',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Document',
        }
    },

]