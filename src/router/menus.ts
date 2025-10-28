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
        name: '指标标准定义',
        path: '/indicator-standard',
        children: [
            {
                name: '指标基本信息',
                path: '/indicator-basic',
                component: () => import('@/views/indicator/indicatorBasic.vue'),
                meta: {
                    id: uuid(),
                    icon: 'InfoFilled',
                }
            },
            {
                name: '指标逻辑定义',
                path: '/indicator-logic',
                component: () => import('@/views/indicator/indicatorLogic.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Cpu',
                }
            },
            {
                name: '数据来源映射',
                path: '/data-source-mapping',
                component: () => import('@/views/indicator/dataSourceMapping.vue'),
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
        name: '指标关系管理',
        path: '/indicator-relation',
        children: [
            {
                name: '指标血缘分析',
                path: '/indicator-lineage',
                component: () => import('@/views/relation/indicatorLineage.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Share',
                }
            },
            {
                name: '指标影响关系',
                path: '/indicator-impact',
                component: () => import('@/views/relation/indicatorImpact.vue'),
                meta: {
                    id: uuid(),
                    icon: 'TrendCharts',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Connection',
        }
    },
    {
        name: '指标建模设计',
        path: '/b',
        children: [
            {
                name: '指标血缘分析',
                path: '/indicator-lineage',
                component: () => import('@/views/relation/indicatorLineage.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Share',
                }
            },
            {
                name: '指标影响关系',
                path: '/indicator-impact',
                component: () => import('@/views/relation/indicatorImpact.vue'),
                meta: {
                    id: uuid(),
                    icon: 'TrendCharts',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'OfficeBuilding',
        }
    },
    {
        name: '指标加工配置',
        path: '/a',
        children: [
            {
                name: '指标血缘分析',
                path: '/indicator-lineage',
                component: () => import('@/views/relation/indicatorLineage.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Share',
                }
            },
            {
                name: '指标影响关系',
                path: '/indicator-impact',
                component: () => import('@/views/relation/indicatorImpact.vue'),
                meta: {
                    id: uuid(),
                    icon: 'TrendCharts',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Box',
        }
    }
]