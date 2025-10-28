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
        name: '标准分类管理',
        path: '/standard-category',
        children: [
            {
                name: '基础编码标准',
                path: '/basic-coding',
                component: () => import('@/views/standard/basicCoding.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Key',
                }
            },
            {
                name: '数据元标准',
                path: '/data-element',
                component: () => import('@/views/standard/dataElement.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Document',
                }
            },
            {
                name: '接口标准',
                path: '/interface-standard',
                component: () => import('@/views/standard/interfaceStandard.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Connection',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'FolderOpened',
        }
    },
    {
        name: '标准模板管理',
        path: '/template-manage',
        children: [
            {
                name: '模板库管理',
                path: '/template-library',
                component: () => import('@/views/template/templateLibrary.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Files',
                }
            },
            {
                name: '模板版本控制',
                path: '/template-version',
                component: () => import('@/views/template/templateVersion.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Histogram',
                }
            },
            {
                name: '模板发布管理',
                path: '/template-publish',
                component: () => import('@/views/template/templatePublish.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Promotion',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Collection',
        }
    },
    {
        name: '标准目录服务',
        path: '/mulu',
        children: [
            {
                name: '模板库管理',
                path: '/template-library',
                component: () => import('@/views/template/templateLibrary.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Folder',
                }
            },
            {
                name: '模板版本控制',
                path: '/template-version',
                component: () => import('@/views/template/templateVersion.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Histogram',
                }
            },
            {
                name: '模板发布管理',
                path: '/template-publish',
                component: () => import('@/views/template/templatePublish.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Promotion',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Folder',
        }
    }

]