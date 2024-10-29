<!-- 3D地图图例组件 -->
<template>
    <div class="legend-3d">
        <div class="gradient-container">
            <!-- 渐变条，颜色根据高度变化 -->
            <div class="gradient-bar" :style="{ background: gradientStyle }"></div>
            <div class="labels">
                <!-- 标签显示不同高度的值 -->
                <div class="label-item" v-for="value in labelValues" :key="value">
                    <span class="value">{{ formatValue(value) }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import * as THREE from 'three';

const props = defineProps<{
    min: number;
    max: number;
    getColorForHeight: (height: number, maxHeight: number) => THREE.Color;
}>();

// 计算标签值，根据最大值和最小值生成标签
const labelValues = computed(() => {
    if (typeof props.max !== 'number' || typeof props.min !== 'number') {
        return [0, 0, 0, 0, 0];
    }
    return [
        props.max,
        props.max * 0.75,
        props.max * 0.5,
        props.max * 0.25,
        props.min
    ];
});

// 计算渐变条的样式，根据高度生成颜色渐变
const gradientStyle = computed(() => {
    if (typeof props.max !== 'number' || typeof props.min !== 'number') {
        return 'linear-gradient(to bottom, #000, #fff)';
    }

    const steps = 20; // 增加渐变步数使过渡更平滑
    const colors = [];

    for (let i = steps; i >= 0; i--) {
        const t = i / steps;
        const height = props.min + (props.max - props.min) * t;
        const color = props.getColorForHeight(height, props.max);
        colors.push(`rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`);
    }

    return `linear-gradient(to bottom, ${colors.join(', ')})`;
});

// 格式化数值显示函数，根据数值大小调整显示格式
const formatValue = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) {
        return '0';
    }

    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
    }
    if (value >= 100) {
        return value.toFixed(0);
    }
    if (value >= 10) {
        return value.toFixed(1);
    }
    return value.toFixed(2);
};
</script>

<!-- 样式 -->
<style scoped>
.legend-3d {
    background: #131416c2;
    border-radius: 8px;
    padding: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(5px);
    transition: all 0.3s ease;
}

.legend-3d:hover {
    background: rgba(19, 20, 22, 0.95);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.gradient-container {
    display: flex;
    align-items: stretch;
    gap: 12px;
}

.gradient-bar {
    width: 24px;
    height: 200px;
    border-radius: 4px;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.labels {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 200px;
    padding: 4px 0;
}

.label-item {
    display: flex;
    align-items: center;
    gap: 4px;
}

.value {
    font-size: 13px;
    color: #ffffff;
    font-family: 'Arial', sans-serif;
    min-width: 45px;
}

/* 添加响应式样式 */
@media (max-width: 768px) {
    .legend-3d {
        padding: 8px;
    }

    .gradient-bar {
        width: 20px;
        height: 160px;
    }

    .labels {
        height: 160px;
    }

    .value {
        font-size: 12px;
        min-width: 40px;
    }
}
</style>