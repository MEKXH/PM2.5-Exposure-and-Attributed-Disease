<template>
    <div class="data-map-container">
        <div class="map-container">
            <Map2D :currentField="field" :currentYear="year" :currentColor="color" :currentScale="scale"
                :fieldInput="fieldInput" @featureClicked="handleFeatureClicked" />
        </div>
        <div class="sidebar" :class="{ 'sidebar-collapsed': isCollapsed, 'sidebar-no-chart': !hasVisibleCharts }">
            <Controls :field="field" :year="year" :fieldInput="fieldInput" :scale="scale" :maxFieldValue="maxFieldValue"
                :csvFilePath="'/2Ddata/CN_total.csv'" @update:field="field = $event" @update:year="year = $event"
                @update:color="color = $event" @update:fieldInput="fieldInput = $event" @update:scale="scale = $event"
                @charts-visibility-change="handleChartsVisibilityChange" />
            <button class="collapse-handle" @click="toggleSidebar">
                <span class="arrow-icon">❮</span>
            </button>
        </div>
        <div class="region-chart-container">
            <RegionChart v-if="showChart" :feature="clickedFeature" :field="field" :color="color" :scale="scale"
                @close="showChart = false" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import Map2D from '@/views/Map2D.vue'; // 2D地图组件
import Controls from '@/components/Controls.vue'; // 控制组件
import RegionChart from '@/components/RegionChart.vue'; // 区域图表组件

// 定义响应式变量
const field = ref('Ppw'); // 当前字段
const year = ref('2000'); // 当前年份
const color = ref('hsl(225, 100%, 50%)'); // 当前颜色
const scale = ref('province'); // 当前比例尺
const fieldInput = ref(0); // 字段输入值
const clickedFeature = ref(null); // 点击的区域特征
const showChart = ref(false); // 是否显示图表
const isCollapsed = ref(false); // 侧边栏是否折叠
const hasVisibleCharts = ref(true); // 是否有可见的图表

// 计算最大字段值
const maxFieldValue = computed(() => {
    switch (field.value) {
        case 'Ppw':
        case 'Cpw':
            return 100;
        case 'Pgini':
        case 'Cgini':
            return 0.3;
        case 'Pdp':
        case 'Cdp':
            return 130000;
        case 'Pdrg':
        case 'Cdrg':
            return 0.3;
        default:
            return 100;
    }
});

// 处理区域点击事件
const handleFeatureClicked = (featureProperties: any) => {
    clickedFeature.value = featureProperties;
    showChart.value = true;
};

// 切换侧边栏状态
const toggleSidebar = () => {
    isCollapsed.value = !isCollapsed.value;
};

// 处理图表可见性变化
const handleChartsVisibilityChange = (visible: boolean) => {
    hasVisibleCharts.value = visible;
};
</script>

<style scoped>
/* 数据地图容器样式 */
.data-map-container {
    position: relative;
    width: 100vw;
    height: calc(100vh - 80px);
    overflow: hidden;
    margin-top: 80px;
}

/* 地图容器样式 */
.map-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
}

/* 侧边栏样式 */
.sidebar {
    position: absolute;
    top: 20px;
    left: 10px;
    width: 420px;
    height: auto;
    background-color: rgba(4, 4, 4, 0.905);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    padding: 15px;
    z-index: 2;
    transition: all 0.3s ease;
}

/* 没有图表时的侧边栏样式 */
.sidebar-no-chart {
    height: auto;
}

/* 折叠状态的侧边栏样式 */
.sidebar-collapsed {
    transform: translateX(-100%);
    padding-right: 30px;
}

/* 折叠按钮样式 */
.collapse-handle {
    position: absolute;
    right: -30px;
    top: 35px;
    transform: translateY(-50%);
    width: 30px;
    height: 60px;
    background-color: rgba(4, 4, 4, 0.905);
    border: none;
    border-radius: 0 8px 8px 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    transition: background-color 0.2s;
}

/* 折叠按钮悬停样式 */
.collapse-handle:hover {
    background-color: rgba(34, 34, 34, 0.8);
}

/* 箭头图标样式 */
.arrow-icon {
    font-size: 20px;
    transition: transform 0.5s;
}

/* 折叠状态的箭头图标样式 */
.sidebar-collapsed .arrow-icon {
    transform: rotate(180deg);
}

/* 区域图表容器样式 */
.region-chart-container {
    position: absolute;
    bottom: 1rem;
    left: 1.5rem;
    width: 420px;
}
</style>