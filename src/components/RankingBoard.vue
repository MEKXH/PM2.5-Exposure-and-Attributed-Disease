<template>
    <!-- 排名组件容器-->
    <div class="ranking-wrapper" :class="{ 'ranking-board-collapsed': isCollapsed }">
        <div class="ranking-board">
            <div class="ranking-content">
                <!-- 标题，显示当前年份、尺度（省级或市级）和字段名称 -->
                <h2 class="title">
                    {{ computedTitle }}
                    <!-- 如果当前字段包含 'PM25'，则显示单位 (μg/m³) -->
                    <span v-if="currentField.includes('PM25')" class="unit">(μg/m³)</span>
                </h2>
                <!-- 排名列表，显示前 10 个排名数据 -->
                <div class="ranking-list">
                    <div v-for="(item, index) in rankedData" :key="item.name" class="ranking-item">
                        <div class="bar" :style="{ width: calculateBarWidth(item.value) }"></div>
                        <!-- 排名项的内容，包括排名、名称和值 -->
                        <div class="content">
                            <span class="rank" :class="{ 'top-three': index < 3 }">{{ index + 1 }}</span>
                            <span class="name">{{ item.name }}</span>
                            <span class="value">{{ formatValue(item.value) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- 折叠按钮，点击切换折叠状态 -->
        <button class="collapse-handle" @click="toggleCollapse">
            <span class="arrow-icon">❯</span>
        </button>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

// 定义组件的 props，包括当前数据、尺度、字段和年份
const props = defineProps({
    currentData: {
        type: Object,
        required: true
    },
    currentScale: {
        type: String,
        required: true
    },
    currentField: {
        type: String,
        required: true
    },
    currentYear: {
        type: String,
        required: true
    }
});

// 折叠状态，默认为 false
const isCollapsed = ref(false);

// 切换折叠状态的函数
const toggleCollapse = () => {
    isCollapsed.value = !isCollapsed.value;
};

// 计算标题，根据当前尺度、字段和年份生成标题
const computedTitle = computed(() => {
    const scaleText = props.currentScale === 'province' ? '省级' : '市级';
    const fieldMap: Record<string, string> = {
        'Ppw': 'PM2.5浓度（μg/m³）',
        'Cpw': 'PM2.5浓度',
        'Pdp': '过早死亡人数',
        'Cdp': '过早死亡人数',
        'Pgini': 'PM2.5 基尼系数',
        'Cgini': 'PM2.5 基尼系数',
        'Pdrg': '死亡率基尼系数',
        'Cdrg': '死亡率基尼系数'
    };

    const fieldText = fieldMap[props.currentField] || props.currentField;
    return `${props.currentYear}年${scaleText}${fieldText}`;
});

// 格式化地理位置名称，去除后缀
const formatLocationName = (name: string) => {
    return name.replace(/(省|市|自治区|维吾尔自治区|壮族自治区|回族自治区|特别行政区|藏族自治州|藏族羌族自治州|自治州)$/g, '');
};

// 计算排名数据，根据当前数据、尺度、字段和年份生成排名数据
const rankedData = computed(() => {
    if (!props.currentData?.features) return [];

    const fieldPrefix = props.currentScale === 'province' ? 'P' : 'C';
    const fullField = `${fieldPrefix}${props.currentField.slice(1)}_${props.currentYear}`;
    const nameField = props.currentScale === 'province' ? 'Province' : 'City';

    return props.currentData.features
        .map(feature => ({
            name: formatLocationName(feature.properties[nameField]),
            value: feature.properties[fullField] || 0
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
});

// 格式化值，如果值大于等于 10000，则转换为万单位
const formatValue = (value: number) => {
    if (value >= 10000) {
        return (value / 10000).toFixed(2) + '万';
    }
    return value.toFixed(3);
};

// 计算背景同级条宽度，根据当前值与最大值的比例计算
const calculateBarWidth = (value: number) => {
    const maxValue = Math.max(...rankedData.value.map(item => item.value));
    return `${(value / maxValue) * 100}%`;
};
</script>

<!-- 样式 -->
<style scoped>
.ranking-wrapper {
    position: relative;
    transition: all 0.3s ease;
}

.ranking-board {
    position: relative;
    display: flex;
    background-color: rgba(30, 30, 30, 0.804);
    border-radius: 10px;
    color: rgb(189, 189, 189);
    font-size: 15px;
    transition: all 0.3s ease;
    overflow: hidden;
}

.ranking-content {
    padding: 12px;
    backdrop-filter: blur(8px);
}

.ranking-board-collapsed {
    transform: translateX(107%);
}

.title {
    color: #ffffff;
    font-size: 15px;
    margin: 0 0 12px 0;
    padding: 0 4px;
    font-weight: bold;
    text-align: center;
}

.unit {
    color: #999;
    font-size: 14px;
    font-weight: normal;
}

.ranking-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.ranking-item {
    position: relative;
    padding: 6px;
    border-radius: 6px;
    background-color: #040404;
    overflow: hidden;
}

.bar {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background-color: rgb(15, 15, 15);
    transition: width 0.8s ease;
    border-radius: 6px;
}

.content {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    font-size: 14px;
}

.rank {
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 20%;
    background-color: #353535;
    margin-right: 10px;
    font-weight: bold;
    color: #ffffff;
}

.rank.top-three {
    background-color: #029f9e;
    color: rgb(255, 255, 255);
}

.name {
    flex: 1;
}

.value {
    font-weight: bold;
    color: #1077bc;
}

.collapse-handle {
    position: absolute;
    left: -30px;
    top: 50%;
    transform: translateY(-50%);
    width: 30px;
    height: 60px;
    background-color: rgba(30, 30, 30, 0.804);
    border: none;
    border-radius: 8px 0 0 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    transition: background-color 0.2s;
}

.collapse-handle:hover {
    background-color: rgba(0, 0, 0, 0.8);
}

.arrow-icon {
    font-size: 20px;
    transition: transform 0.5s;
}

.ranking-board-collapsed .arrow-icon {
    transform: rotate(180deg);
}
</style>