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
        name: '园区模型展示',
        path: '/park-model',
        children: [
            {
                name: '建筑模型管理',
                path: '/building-model',
                component: () => import('@/views/model/buildingModel.vue'),
                meta: {
                    id: uuid(),
                    icon: 'OfficeBuilding',
                }
            },
            {
                name: '环境场景渲染',
                path: '/environment-render',
                component: () => import('@/views/model/environmentRender.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Picture',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'Box',
        }
    },
    {
        name: '场景效果配置',
        path: '/scene-effect',
        children: [
            {
                name: '天气效果模拟',
                path: '/weather-effect',
                component: () => import('@/views/scene/weatherEffect.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Sunny',
                }
            },
            {
                name: '昼夜模式切换',
                path: '/daynight-switch',
                component: () => import('@/views/scene/daynightSwitch.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Moon',
                }
            },
            {
                name: '特效参数调整',
                path: '/effect-parameters',
                component: () => import('@/views/scene/effectParameters.vue'),
                meta: {
                    id: uuid(),
                    icon: 'SetUp',
                }
            },
        ],
        meta: {
            id: uuid(),
            icon: 'MostlyCloudy',
        }
    },
    {
        name: '标注测量工具',
        path: '/scenet',
        children: [
            {
                name: '天气效果模拟',
                path: '/weather-effect',
                component: () => import('@/views/scene/weatherEffect.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Sunny',
                }
            },

        ],
        meta: {
            id: uuid(),
            icon: 'Money',
        }
    },
    {
        name: '应急预案演练',
        path: '/scen66',
        children: [
            {
                name: '天气效果模拟',
                path: '/weather-effect',
                component: () => import('@/views/scene/weatherEffect.vue'),
                meta: {
                    id: uuid(),
                    icon: 'Sunny',
                }
            },

        ],
        meta: {
            id: uuid(),
            icon: 'Operation',
        }
    }

]