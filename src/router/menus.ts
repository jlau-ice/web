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
        name: '设备信息管理',
        path: '/device-info',
        children: [
            {
                name: '设备档案管理',
                path: '/device-archive',
                component: () => import('@/views/device/deviceArchive.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Files',
                }
            },
            {
                name: '设备健康度状况',
                path: '/device-health',
                component: () => import('@/views/device/deviceHealth.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Monitor',
                }
            },
            {
                name: '设备维护记录',
                path: '/device-maintenance',
                component: () => import('@/views/device/deviceMaintenance.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Setting',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Cpu',
        }
    },
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
                    icon: 'Operation',
                }
            },
            {
                name: '优先级管理',
                path: '/priority-management',
                component: () => import('@/views/scheduling/priorityManagement.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Sort',
                }
            },
            {
                name: '负载均衡策略',
                path: '/load-balancing',
                component: () => import('@/views/scheduling/loadBalancing.vue'),
                meta: {
                    id: uuid(),
                    icon: 'ScaleToOriginal',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'DataAnalysis',
        }
    },
    {
        name: '告警管理',
        path: '/g',
        children: [
            {
                name: '调度规则设置',
                path: '/scheduling-rules',
                component: () => import('@/views/scheduling/schedulingRules.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Operation',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'WarningFilled',
        }
    },
    {
        name: '任务分发管理',
        path: '/f',
        children: [
            {
                name: '调度规则设置',
                path: '/scheduling-rules',
                component: () => import('@/views/scheduling/schedulingRules.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Operation',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'MessageBox',
        }
    }

]