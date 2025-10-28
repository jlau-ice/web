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
        name: '基本信息管理',
        path: '/basic-info',
        children: [
            {
                name: '资产基本信息',
                path: '/asset-basic-info',
                component: () => import('@/views/asset/assetBasicInfo.vue'),
                meta: {
                    id: uuid(),
                    icon: 'InfoFilled',
                }
            },
            {
                name: '目录结构维护',
                path: '/catalog-structure',
                component: () => import('@/views/asset/catalogStructure.vue'),
                meta: {
                    id: uuid(),
                    icon: 'FolderOpened',
                }
            },
            {
                name: '分类权限控制',
                path: '/category-permission',
                component: () => import('@/views/asset/categoryPermission.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Lock',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Document',
        }
    },
    {
        name: '资产检索服务',
        path: '/asset-search',
        children: [
            {
                name: '资产快速检索',
                path: '/quick-search',
                component: () => import('@/views/search/quickSearch.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Search',
                }
            },
            {
                name: '高级条件查询',
                path: '/advanced-query',
                component: () => import('@/views/search/advancedQuery.vue'),
                meta: {
                    id: uuid(),
                    icon: 'SetUp',
                }
            },
            {
                name: '检索结构分析',
                path: '/search-analysis',
                component: () => import('@/views/search/searchAnalysis.vue'),
                meta: {
                    id: uuid(),
                    icon: 'DataAnalysis',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Search',
        }
    },
    {
        name: '资产字典',
        path: '/a',
        children: [
            {
                name: '资产快速检索',
                path: '/quick-search',
                component: () => import('@/views/search/quickSearch.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Search',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Collection',
        }
    },
    {
        name: '资产统计',
        path: '/b',
        children: [
            {
                name: '资产快速检索',
                path: '/quick-search',
                component: () => import('@/views/search/quickSearch.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Search',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'DataAnalysis',
        }
    }

]