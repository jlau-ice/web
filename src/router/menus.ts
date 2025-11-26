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
        name: '仪表盘',
        path: '/home',
        component: () => import('@/views/home/Home.vue'),
        meta: {
            id: uuid(),
            icon: 'Odometer',
        }
    },
    {
        name: '系统配置',
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
        name: '任务管理2',
        path: '/home2',
        component: () => import('@/views/task/TaskManage.vue'),
        meta: {
            id: uuid(),
            icon: 'ChatSquare',
        }
    },
    {
        name: '任务管理1',
        path: '/home1',
        component: () => import('@/views/model/ModelManage.vue'),
        meta: {
            id: uuid(),
            icon: 'ChatSquare',
        }
    },
    {
        name: '模型配置',
        path: '/model',
        children: [
            {
                name: '任务管理',
                path: '/config',
                component: () => import('@/views/model/ModelConfig.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Lock',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Refresh',
        }
    },

]