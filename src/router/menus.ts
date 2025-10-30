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
        name: '数据服务化统一发布',
        path: '/service-publish',
        component: () => import('@/views/data-service/ServicePublish.vue'),
        meta: {
            id: uuid(),
            icon: 'Promotion',
        }
    },
    {
        name: '多元化服务形式支持',
        path: '/service-forms',
        component: () => import('@/views/data-service/ServiceForms.vue'),
        meta: {
            id: uuid(),
            icon: 'SetUp',
        }
    },
    {
        name: '服务目录与权限管理',
        path: '/service-catalog',
        component: () => import('@/views/data-service/ServiceCatalog.vue'),
        meta: {
            id: uuid(),
            icon: 'FolderOpened',
        }
    },
    {
        name: '数据复用与性能监测',
        path: '/service-monitor',
        component: () => import('@/views/data-service/ServiceMonitor.vue'),
        meta: {
            id: uuid(),
            icon: 'Platform',
        }
    }
]