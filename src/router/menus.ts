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
        name: ' 服务项目管理',
        path: '/s',
        children: [
            {
                name: '服务流程设计',
                path: '/service-flow-design',
                component: () => import('@/views/service/serviceFlowDesign.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Grid',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Grid',
        }
    },
    {
        name: '服务编排设计',
        path: '/service-orchestration',
        children: [
            {
                name: '服务流程设计',
                path: '/service-flow-design',
                component: () => import('@/views/service/serviceFlowDesign.vue'),
                meta: {
                    id: uuid(),
                    icon: 'SetUp',
                }
            },
            {
                name: '组件拖拽编排',
                path: '/component-orchestration',
                component: () => import('@/views/service/componentOrchestration.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Rank',
                }
            },
            {
                name: '逻辑条件配置',
                path: '/logic-condition-config',
                component: () => import('@/views/service/logicConditionConfig.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Operation',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'DataLine',
        }
    },
    {
        name: '服务测试调试',
        path: '/service-testing',
        children: [
            {
                name: '测试用例管理',
                path: '/test-case-manage',
                component: () => import('@/views/service/testCaseManage.vue'),
                meta: {
                    id: uuid(),
                    icon: 'DocumentChecked',
                }
            },
            {
                name: '在线调试工具',
                path: '/online-debug-tool',
                component: () => import('@/views/service/onlineDebugTool.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Monitor',
                }
            },
            {
                name: '性能压力测试',
                path: '/performance-test',
                component: () => import('@/views/service/performanceTest.vue'),
                meta: {
                    id: uuid(),
                    icon: 'TrendCharts',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'VideoPlay',
        }
    },
    {
        name: ' 服务版本管理',
        path: '/sb',
        children: [
            {
                name: '服务流程设计',
                path: '/service-flow-design',
                component: () => import('@/views/service/serviceFlowDesign.vue'),
                meta: {
                    id: uuid(),
                    icon: 'SetUp',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Memo',
        }
    },
]