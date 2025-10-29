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
        name: '表单设计管理',
        path: '/form',
        children: [
            {
                name: '表单模板设计',
                path: '/form-template',
                component: () => import('@/views/form/formTemplate.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Document',
                }
            },
            {
                name: '字段权限配置',
                path: '/field-permission',
                component: () => import('@/views/form/fieldPermission.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Lock',
                }
            },
            {
                name: '验证规则设置',
                path: '/validat',
                component: () => import('@/views/form/validationRule.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Checked',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Edit',
        }
    },
    {
        name: '规则配置管理',
        path: '/rule-config',
        children: [
            {
                name: '业务规则定义',
                path: '/business-rule',
                component: () => import('@/views/rule/businessRule.vue'),
                meta: {
                    id: uuid(),
                    icon: 'SetUp',
                }
            },
            {
                name: '条件分支配置',
                path: '/condition-branch',
                component: () => import('@/views/rule/conditionBranch.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Connection',
                }
            },
            {
                name: '验证规则',
                path: '/rule-validation',
                component: () => import('@/views/rule/ruleValidation.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Finished',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'DataAnalysis',
        }
    },
    {
        name: '流程设计',
        path: '/lc',
        children: [
            {
                name: '11',
                path: '/busines',
                component: () => import('@/views/rule/businessRule.vue'),
                meta: {
                    id: uuid(),
                    icon: 'SetUp',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Operation',
        }
    }, {
        name: '流程验证',
        path: '/lc2',
        children: [
            {
                name: '231',
                path: '/busi',
                component: () => import('@/views/rule/businessRule.vue'),
                meta: {
                    id: uuid(),
                    icon: 'SetUp',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Menu',
        }
    },

]