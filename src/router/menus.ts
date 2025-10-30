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

    {
        name: '自动化内容审核',
        path: '/content-audit',
        component: () => import('@/views/ai-image/AuditContent.vue'),
        meta: {
            id: uuid(),
            icon: 'Check',
        }
    },
    {
        name: '图像识别与分类',
        path: '/image-classification',
        component: () => import('@/views/ai-image/ImageClassification.vue'),
        meta: {
            id: uuid(),
            icon: 'PriceTag',
        }
    },
    {
        name: '图像质量优化',
        path: '/image-processing',
        component: () => import('@/views/ai-image/ImageProcessing.vue'),
        meta: {
            id: uuid(),
            icon: 'MagicStick',
        }
    },
    {
        name: '审核策略与反馈',
        path: '/audit-strategy',
        component: () => import('@/views/ai-image/AuditStrategy.vue'),
        meta: {
            id: uuid(),
            icon: 'SetUp',
        }
    }

]