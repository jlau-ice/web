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
            icon: 'HomeFilled',
        }
    },

    // 你所需要修改的路由
    {
        name: '数据源管理',
        path: '/data-source',
        component: () => import('@/views/dataCollect/DataSource.vue'),
        meta: {
            id: uuid(),
            icon: 'Coin',
        }
    },
    {
        name: '采集任务调度',
        path: '/task-schedule',
        children: [
            {
                name: '采集任务管理',
                path: '/task-manage',
                component: () => import('@/views/dataCollect/TaskManage.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Document',
                }
            },
            {
                name: '调度与监控',
                path: '/monitor',
                component: () => import('@/views/dataCollect/TaskMonitor.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Monitor',
                }
            }
        ],
        meta: {
            id: uuid(),
            icon: 'Clock',
        }
    },
    {
        name: '核心处理引擎',
        path: '/core-engine',
        children: [
            {
                name: '采集执行引擎',
                path: '/execute-engine',
                component: () => import('@/views/dataCollect/ExecuteEngine.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Cpu',
                }
            },
            {
                name: '数据清洗转换',
                path: '/data-transform',
                component: () => import('@/views/dataCollect/DataTransform.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Tools',
                }
            }
        ],
        meta: {
            id: uuid(),
            icon: 'Setting',
        }
    },
    {
        name: '数据质量与汇聚层',
        path: '/data-quality',
        children: [
            {
                name: '数据质量管理',
                path: '/quality-manage',
                component: () => import('@/views/dataCollect/QualityManage.vue'),
                meta: {
                    id: uuid(),
                    icon: 'CircleCheck',
                }
            },
            {
                name: '数据汇聚与输出',
                path: '/data-output',
                component: () => import('@/views/dataCollect/DataOutput.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Share',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Collection',
        }
    }

]