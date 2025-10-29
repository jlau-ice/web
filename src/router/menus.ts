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
        name: '多模态分析',
        path: '/multimodal-analysis',
        children: [
            {
                name: '文本内容分析',
                path: '/text-analysis',
                component: () => import('@/views/analysis/textAnalysis.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Document',
                }
            },
            {
                name: '图像行为识别',
                path: '/image-behavior',
                component: () => import('@/views/analysis/imageBehavior.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Picture',
                }
            },
            {
                name: '视频动作检测',
                path: '/video-action',
                component: () => import('@/views/analysis/videoAction.vue'),
                meta: {
                    id: uuid(),
                    icon: 'VideoPlay',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'DataAnalysis',
        }
    },
    {
        name: '违规规则库',
        path: '/violation-rules',
        children: [
            {
                name: '规则模板管理',
                path: '/rule-templates',
                component: () => import('@/views/rules/ruleTemplates.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Files',
                }
            },
            {
                name: '自定义规则配置',
                path: '/custom-rules',
                component: () => import('@/views/rules/customRules.vue'),
                meta: {
                    id: uuid(),
                    icon: 'SetUp',
                }
            },
            {
                name: '规则版本控制',
                path: '/rule-versions',
                component: () => import('@/views/rules/ruleVersions.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Histogram',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Collection',
        }
    },
    {
        name: '样本库维护',
        path: '/vi1',
        children: [
            {
                name: '规则模板管14理',
                path: '/rule-temtes',
                component: () => import('@/views/rules/ruleTemplates.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Files',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Grid',
        }
    },
    {
        name: '特征工程管理',
        path: '/vi',
        children: [
            {
                name: '规则模理',
                path: '/rule-templa',
                component: () => import('@/views/rules/ruleTemplates.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Files',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'PriceTag',
        }
    }

]