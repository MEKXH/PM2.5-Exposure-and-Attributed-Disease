import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Home from '../views/Home.vue'
import About from '../views/About.vue'
import M2DViewer from '../views/M2DViewer.vue'
import Map2D from '@/views/Map2D.vue'
import M3Dviewer from '@/views/M3Dviewer.vue'

// 定义路由配置
const routes: Array<RouteRecordRaw> = [
    {
        path: '/', // 首页路径
        name: 'Home', // 路由名称
        component: Home // 对应的组件
    },
    {
        path: '/m3dviewer', // 3D地图图路径
        name: 'M3DViewer', // 路由名称
        component: M3Dviewer // 对应的组件
    },
    {
        path: '/data-map-2d', // 2D地图路径
        name: 'DataMap2D', // 路由名称
        component: M2DViewer, // 对应的组件
    },
    {
        path: '/map-container', // 2D地图容器路径
        name: 'MapContainer', // 路由名称
        component: Map2D, // 对应的组件
    },
    {
        path: '/about', // 关于页面路径
        name: 'About', // 路由名称
        component: About // 对应的组件
    }
]

// 创建路由实例
const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
})

export default router