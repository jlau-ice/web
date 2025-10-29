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
    // 你所需要修改的路由
    {
        name: '异常行为检测',
        path: '/abnormal-behavior',
        children: [
            {
                name: '违规操作识别',
                path: '/violation-ops',
                component: () => import('@/views/behavior/violationOps.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Warning',
                }
            },
            {
                name: '区域入侵检测',
                path: '/intrusion-detect',
                component: () => import('@/views/behavior/intrusionDetect.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Position',
                }
            },
            {
                name: '安全规范检测',
                path: '/safety-check',
                component: () => import('@/views/behavior/safetyCheck.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Check',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Monitor',
        }
    },
    {
        name: '出入库监管',
        path: '/in-out-supervise',
        children: [
            {
                name: '货物清点识别',
                path: '/cargo-count',
                component: () => import('@/views/supervise/cargoCount.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Box',
                }
            },
            {
                name: '单据核对验证',
                path: '/document-verify',
                component: () => import('@/views/supervise/documentVerify.vue'),
                meta: {
                    id: uuid(),
                    icon: 'DocumentChecked',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Files',
        }
    },
    {
        name: '权限日志管理',
        path: '/in',
        children: [
            {
                name: '单据核对验证',
                path: '/document-verify',
                component: () => import('@/views/supervise/documentVerify.vue'),
                meta: {
                    id: uuid(),
                    icon: 'DocumentChecked',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'TakeawayBox',
        }
    },
    {
        name: '紧急事件处理',
        path: '/ian',
        children: [
            {
                name: '货物清点识别',
                path: '/cargo-count',
                component: () => import('@/views/supervise/cargoCount.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Box',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'BellFilled',
        }
    },


]