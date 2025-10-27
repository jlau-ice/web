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
            icon: 'House',
        }
    },
    {
        name: '任务管理',
        path: '/task/manage',
        component: () => import('@/views/task/TaskManage.vue'),
        meta: {
            id: uuid(),
            icon: 'ChatSquare',
        }
    },
    {
        name: '模型配置',
        path: '/model/config',
        component: () => import('@/views/model/ModelConfig.vue'),
        children: [
            {
                name: '任务管理',
                path: '/task/manage',
                component: () => import('@/views/task/TaskManage.vue'),
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