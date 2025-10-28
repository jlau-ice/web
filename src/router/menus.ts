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
        name: '标签标准定义',
        path: '/tag-standard',
        children: [
            {
                name: '标签基本信息',
                path: '/tag-basic-info',
                component: () => import('@/views/tag/tagBasicInfo.vue'),
                meta: {
                    id: uuid(),
                    icon: 'InfoFilled',
                }
            },
            {
                name: '标签计算规则',
                path: '/tag-calculation-rule',
                component: () => import('@/views/tag/tagCalculationRule.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Cpu',
                }
            },
            {
                name: '数据来源配置',
                path: '/tag-data-source',
                component: () => import('@/views/tag/tagDataSource.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Link',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'DocumentChecked',
        }
    },
    {
        name: '标签关系管理',
        path: '/tag-relation',
        children: [
            {
                name: '标签关联关系',
                path: '/tag-association',
                component: () => import('@/views/tag/tagAssociation.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Connection',
                }
            },
            {
                name: '标签层级关系',
                path: '/tag-hierarchy',
                component: () => import('@/views/tag/tagHierarchy.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Sort',
                }
            },
            {
                name: '标签依赖分析',
                path: '/tag-dependency',
                component: () => import('@/views/tag/tagDependency.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Position',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Share',
        }
    },
    {
        name: '标签质量控制',
        path: '/a',
        children: [
            {
                name: '标签关联关系',
                path: '/tag-association',
                component: () => import('@/views/tag/tagAssociation.vue'),
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
    },
    {
        name: '标签查询服务',
        path: '/t',
        children: [
            {
                name: '标签关联关系',
                path: '/tag-association',
                component: () => import('@/views/tag/tagAssociation.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Connection',
                }
            },

        ],
        meta: {
            id: uuid(),
            icon: 'Suitcase',
        }
    }

]