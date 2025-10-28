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
        name: '溯源业务管理',
        path: '/traceability-business',
        children: [
            {
                name: '生产档案管理',
                path: '/production-archive',
                component: () => import('@/views/traceability/productionArchive.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Files',
                }
            },
            {
                name: '流通轨迹跟踪',
                path: '/circulation-track',
                component: () => import('@/views/traceability/circulationTrack.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Position',
                }
            },
            {
                name: '质量检测记录',
                path: '/quality-inspection',
                component: () => import('@/views/traceability/qualityInspection.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Finished',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'DataBoard',
        }
    },
    {
        name: '查询统计服务',
        path: '/query-statistics',
        children: [
            {
                name: '溯源查询分析',
                path: '/traceability-query',
                component: () => import('@/views/query/traceabilityQuery.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Search',
                }
            },
            {
                name: '业务数据统计',
                path: '/business-statistics',
                component: () => import('@/views/query/businessStatistics.vue'),
                meta: {
                    id: uuid(),
                    icon: 'DataAnalysis',
                }
            },
            {
                name: '报表生成导出',
                path: '/report-export',
                component: () => import('@/views/query/reportExport.vue'),
                meta: {
                    id: uuid(),
                    icon: 'DocumentCopy',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'TrendCharts',
        }
    },
    {
        name: '企业信息管理',
        path: '/qu',
        children: [
            {
                name: '报表生成导出',
                path: '/report-export',
                component: () => import('@/views/query/reportExport.vue'),
                meta: {
                    id: uuid(),
                    icon: 'DocumentCopy',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'OfficeBuilding',
        }
    }

]