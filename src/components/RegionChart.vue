<template>
    <!-- 图表面板，包含图表容器和关闭按钮 -->
    <div class="chart-panel">
        <div ref="chartRef" class="chart-container"></div>
        <button @click="$emit('close')" class="close-button">×</button>
    </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
    TitleComponent,
    TooltipComponent,
    GridComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// 注册 ECharts 组件和图表
echarts.use([
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LineChart,
    CanvasRenderer
]);

// 定义组件的 props
const props = defineProps({
    feature: Object, // 数据特征对象
    field: String,   // 当前字段名
    color: String,   // 图表颜色
    scale: String    // 数据尺度（province 或 city）
});

// 定义事件发射器
const emit = defineEmits(['close']);

// 图表容器的引用
const chartRef = ref(null);

// 图表实例
let chart = null;

// 字段标签映射
const fieldLabels = {
    'Ppw': '人口加权PM2.5',
    'Pgini': 'PM2.5基尼系数',
    'Pdp': '过早死亡人数',
    'Pdrg': '死亡率基尼系数',
    'Cpw': '人口加权PM2.5',
    'Cgini': 'PM2.5基尼系数',
    'Cdp': '过早死亡人数',
    'Cdrg': '死亡率基尼系数',
};

// 字段特征单位映射
const fieldfeatures = {
    'Ppw': 'μg/m³',
    'Pgini': '',
    'Pdp': '人数',
    'Pdrg': '',
    'Cpw': 'μg/m³',
    'Cgini': '',
    'Cdp': '人数',
    'Cdrg': '',
};

// 计算图表标题
const chartTitle = computed(() => {
    if (!props.feature) return '';
    const regionName = props.scale === 'province' ? props.feature.Province : props.feature.City || props.feature.name;
    return `${regionName} - ${fieldLabels[props.field] || ''}`;
});

// 计算 Y 轴名称
const yAxisName = computed(() => fieldfeatures[props.field] || '');

// 创建图表
const createChart = () => {
    if (!props.feature || !chartRef.value) return;

    // 初始化图表实例
    if (!chart) {
        chart = echarts.init(chartRef.value);
    }

    // 生成年份数组
    const years = Array.from({ length: 20 }, (_, i) => i + 2000);

    // 根据数据尺度选择字段前缀
    const fieldPrefix = props.scale === 'province' ? 'P' : 'C';
    const field = `${fieldPrefix}${props.field.slice(1)}`;

    // 生成数据数组
    const data = years.map(year => props.feature[`${field}_${year}`] || 0);

    // 配置图表选项
    const option = {
        title: {
            text: chartTitle.value,
            left: 'center',
            textStyle: {
                fontSize: 15,
                fontWeight: 'bold',
                color: 'rgba(255, 255, 255, 0.85)'
            }
        },
        tooltip: {
            trigger: 'axis'
        },
        grid: {
            left: '2%',
            right: '1%',
            bottom: '6%',
            top: '16%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: years,
            name: '年份',
            nameLocation: 'middle',
            nameGap: 25,
            nameTextStyle: {
                fontSize: 12,
                fontWeight: 'normal',
                color: 'rgba(255, 255, 255, 0.85)'
            },
            axisLabel: {
                fontSize: 12,
                interval: 1,
                align: 'center',
                color: 'rgba(255, 255, 255, 0.85)'
            },
            axisTick: {
                alignWithLabel: true,
                lineStyle: {
                    color: 'rgba(128, 128, 128, 0.5)'
                }
            },
            axisLine: {
                lineStyle: {
                    color: 'rgba(128, 128, 128, 0.5)'
                }
            },
            splitLine: {
                show: false
            },
            scale: true,
        },
        yAxis: {
            type: 'value',
            name: yAxisName.value,
            nameLocation: 'end',
            nameGap: 20,
            nameRotate: 0,
            nameTextStyle: {
                align: 'left',
                verticalAlign: 'top',
                padding: [0, 0, 10, 0],
                fontSize: 12,
                color: 'rgba(255, 255, 255, 0.85)'
            },
            axisLabel: {
                fontSize: 12,
                color: 'rgba(255, 255, 255, 0.85)'
            },
            axisTick: {
                lineStyle: {
                    color: 'rgba(128, 128, 128, 0.5)'
                }
            },
            axisLine: {
                lineStyle: {
                    color: 'rgba(128, 128, 128, 0.5)'
                }
            },
            splitLine: {
                lineStyle: {
                    color: 'rgba(128, 128, 128, 0.2)'
                }
            },
            scale: true,
            offset: 0
        },
        series: [{
            name: yAxisName.value,
            type: 'line',
            data: data,
            smooth: true,
            lineStyle: {
                color: props.color
            },
            areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                    offset: 0,
                    color: props.color.replace('hsl', 'hsla').replace(')', ', 0.6)')
                }, {
                    offset: 1,
                    color: props.color.replace('hsl', 'hsla').replace(')', ', 0.1)')
                }])
            }
        }],
        animation: true,
        animationDuration: 200,
        animationEasing: 'quadraticOut'
    };

    // 设置图表选项
    chart.setOption(option);
};

// 防抖函数
const debouncedCreateChart = debounce(createChart, 50);

// 监听 props 变化，更新图表
watch(() => props.feature, debouncedCreateChart, { deep: true });
watch([() => props.field, () => props.color, () => props.scale], debouncedCreateChart);

// 组件挂载时初始化图表
onMounted(() => {
    if (props.feature) {
        createChart();
    }
});

// 防抖函数实现
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
</script>

<!-- 样式 -->
<style scoped>
.chart-panel {
    background-color: #131416c2;
    padding: 10px;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(23, 23, 23, 0.1);
    font-family: Arial, sans-serif;
    max-width: 420px;
    z-index: 950;
    position: relative;
}

.chart-container {
    width: 100%;
    height: 270px;
}

.close-button {
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    font-size: 18px;
    color: #ffffff;
    cursor: pointer;
    z-index: 1;
}

.close-button:hover {
    color: #666;
}
</style>