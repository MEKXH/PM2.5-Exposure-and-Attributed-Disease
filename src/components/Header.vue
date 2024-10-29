<!-- 导航栏组件 -->
<template>
  <header class="header">
    <div class="header-left">
      <img :src="logoPath" alt="Logo" class="logo">
      <h1>{{ title }}</h1>
    </div>
    <div class="header-right">
      <nav>
        <div class="nav-item">
          <router-link to="/" class="nav-link" :class="{ 'active': route.path === '/' }">首页</router-link>
          <div class="nav-indicator"></div>
        </div>
        <div class="nav-item">
          <router-link to="/data-map-2d" class="nav-link"
            :class="{ 'active': route.path === '/data-map-2d' }">2D地图</router-link>
          <div class="nav-indicator"></div>
        </div>
        <div class="nav-item">
          <router-link to="/m3dviewer" class="nav-link"
            :class="{ 'active': route.path === '/m3dviewer' }">3D地图</router-link>
          <div class="nav-indicator"></div>
        </div>
        <div class="nav-item">
          <router-link to="/about" class="nav-link" :class="{ 'active': route.path === '/about' }">关于</router-link>
          <div class="nav-indicator"></div>
        </div>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const title = ref('PM 2.5-CHINA')
const logoPath = ref('/logo.png')
const route = useRoute()
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: linear-gradient(to bottom, #7A95AB, #0D0D0D);
  color: black;
  padding: 0.8rem 2rem;
  height: 80px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo {
  height: 70px;
  width: auto;
}

.header-left h1 {
  margin: 0;
  font-size: 2rem;
  color: #ffffff;
}

.header-right {
  padding: 30px;
  /* display: flex; */
  /* align-items: center; */
}

nav {
  display: flex;
  gap: 5rem;
}

.nav-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.nav-indicator {
  position: absolute;
  bottom: -14px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  /* 所有指示器的固定宽度 */
  height: 4px;
  background-color: white;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 2px;
}

.nav-link {
  color: white;
  text-decoration: none;
  font-weight: bold;
  transition: color 0.3s ease;
  font-family: Microsoft YaHei;
  font-size: 1.5rem;
}

.nav-link:hover,
.nav-link.active {
  color: #00E4BC;
}

.nav-link:hover~.nav-indicator,
.nav-link.active~.nav-indicator {
  opacity: 1;
}
</style>