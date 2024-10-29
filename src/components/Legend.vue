<!-- 2D 图例组件 -->
<template>
    <div class="legend">
        <h4>{{ fieldTitle }}</h4>
        <div v-for="item in legendItems" :key="item.label" class="legend-item">
            <i :style="{ background: item.color }"></i>
            <span>{{ item.label }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { generateLegendItems } from '@/utils/colorConfig';

const props = defineProps({
    field: { type: String, required: true }
});

// 根据字段设定图例标题
const fieldTitle = computed(() => {
    const titles: Record<string, string> = {
        Ppw: '人口加权 PM2.5',
        Cpw: '人口加权 PM2.5',
        Pgini: 'PM2.5 基尼系数',
        Cgini: 'PM2.5 基尼系数',
        Pdp: '过早死亡人数',
        Cdp: '过早死亡人数',
        Pdrg: '死亡率基尼系数',
        Cdrg: '死亡率基尼系数'
    };
    return titles[props.field] || 'Information';
});

const legendItems = computed(() => {
    return generateLegendItems(props.field);
});
</script>

<style scoped>
.legend {
    position: absolute;
    bottom: 1rem;
    right: 20px;
    width: 130px;
    background: #0f0f10;
    padding: 12px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    z-index: 1000;
}

h4 {
    margin-top: 0;
    margin-bottom: 12px;
    font-size: 14px;
    color: #ffffff;
    font-weight: 500;
}

.legend-item {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
}

.legend-item:last-child {
    margin-bottom: 0;
}

i {
    width: 24px;
    height: 12px;
    margin-right: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    flex-shrink: 0;
}

span {
    font-size: 12px;
    color: #d5d5d5;
    line-height: 1.2;
}
</style>