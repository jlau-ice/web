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
        name: '调度策略配置',
        path: '/scheduling-policy',
        children: [
            {
                name: '调度规则设置',
                path: '/scheduling-rules',
                component: () => import('@/views/scheduling/schedulingRules.vue'),
                meta: {
                    id: uuid(),
                    icon: 'SetUp',
                }
            },
            {
                name: '优先级管理',
                path: '/priority-management',
                component: () => import('@/views/scheduling/priorityManagement.vue'),
                meta: {
                    id: uuid(),
                    icon: 'SortUp',
                }
            },
            {
                name: '依赖关系配置',
                path: '/dependency-config',
                component: () => import('@/views/scheduling/dependencyConfig.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Connection',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'DataAnalysis',
        }
    },
    {
        name: '执行任务监控',
        path: '/task-monitoring',
        children: [
            {
                name: '执行状态监控',
                path: '/execution-status',
                component: () => import('@/views/monitoring/executionStatus.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Monitor',
                }
            },
            {
                name: '进度跟踪管理',
                path: '/progress-tracking',
                component: () => import('@/views/monitoring/progressTracking.vue'),
                meta: {
                    id: uuid(),
                    icon: 'DataLine',
                }
            },
            {
                name: '异常任务处理',
                path: '/exception-handling',
                component: () => import('@/views/monitoring/exceptionHandling.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Warning',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Odometer',
        }
    },
    {
        name: '告警处理跟踪',
        path: '/t',
        children: [
            {
                name: '执行状态监控',
                path: '/execution-status',
                component: () => import('@/views/monitoring/executionStatus.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Monitor',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'WarnTriangleFilled',
        }
    },
    {
        name: '告警统计分析',
        path: '/t1',
        children: [
            {
                name: '执行状态监控',
                path: '/execution-status',
                component: () => import('@/views/monitoring/executionStatus.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Monitor',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Monitor',
        }
    }

]