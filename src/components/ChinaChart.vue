<template>
    <!-- 图表容器，使用 ref 绑定到 chartRef -->
    <div ref="chartRef" class="chart-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
    TitleComponent,
    TooltipComponent,
    GridComponent,
    DatasetComponent,
    TransformComponent,
    LegendComponent
} from 'echarts/components';
import { LabelLayout, UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';

// 注册 ECharts 组件和图表
echarts.use([
    TitleComponent,
    TooltipComponent,
    GridComponent,
    DatasetComponent,
    TransformComponent,
    LineChart,
    LabelLayout,
    UniversalTransition,
    CanvasRenderer,
    LegendComponent
]);

// 定义组件的 props
const props = defineProps({
    csvFilePath: {
        type: String,
        required: true
    },
    chartType: {
        type: Number,
        required: true,
        validator: (value: number) => [1, 2, 3, 4].includes(value)
    },
    chartTitle: {
        type: String,
        required: true
    },
    scale: {
        type: String,
        required: true,
        validator: (value: string) => ['province', 'city'].includes(value)
    }
});

// 定义 ref 用于绑定图表容器
const chartRef = ref<HTMLElement | null>(null);
let chart: echarts.ECharts | null = null;

// 根据 chartType 计算图表配置
const chartOptions = computed(() => [
    {
        title: 'μg/m³',
        series: [{ field: 'Tpw', name: 'PM2.5浓度' }],
        colors: ['#4ECDC4'],
        format: (value: number) => value.toFixed(0)
    },
    {
        title: '',
        series: props.scale === 'province'
            ? [
                { field: 'Tgini', name: '总体' },
                { field: 'Tgini_wi', name: '省内贡献' },
                { field: 'Tgini_be', name: '省间贡献差异' }
            ]
            : [
                { field: 'Tgini', name: '总体' },
                { field: 'Tgini_cbe', name: '城市间贡献差异' }
            ],
        colors: ['#44cef6', '#FF6B6B', '#FFA500'],
        format: (value: number) => value.toFixed(3),
        axisLabelFormatter: (value: number) => value.toFixed(2)
    },
    {
        title: '千人',
        series: [{ field: 'Tdp', name: '人数' }],
        colors: ['#FF6B6B'],
        format: (value: number) => (value / 1000).toFixed(0),
        axisLabelFormatter: (value: number) => (value / 1000).toFixed(0)
    },
    {
        title: '',
        series: [{ field: 'Tdrg', name: '基尼系数' }],
        colors: ['#ff4e20'],
        format: (value: number) => value.toFixed(3),
        axisLabelFormatter: (value: number) => value.toFixed(3)
    }
]);

// 定义数据项接口
interface DataItem {
    year: number;
    [key: string]: number;
}

// 解析 CSV 文本为数据对象
const parseCSV = (csvText: string): DataItem[] => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(header => header.trim());
    return lines.slice(1).map(line => {
        const values = line.split(',');
        return headers.reduce<DataItem>((obj, header, index) => {
            obj[header] = header === 'year' ? parseInt(values[index]) : parseFloat(values[index]);
            return obj;
        }, {} as DataItem);
    });
};

// 加载 CSV 数据并创建图表
const loadCSVData = async () => {
    try {
        const response = await fetch(props.csvFilePath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        const parsedData = parseCSV(csvText);
        createChart(parsedData);
    } catch (error) {
        console.error('Error loading CSV file:', error);
    }
};

// 创建图表
const createChart = (data: DataItem[]) => {
    if (!chartRef.value) return;

    // 如果已有图表实例，先销毁
    if (chart) {
        chart.dispose();
    }

    // 初始化图表
    chart = echarts.init(chartRef.value);

    // 获取当前图表配置
    const chartConfig = chartOptions.value[props.chartType - 1];
    const years = data.map(item => item.year);

    // 创建图表系列
    const createSeries = (seriesInfo: { field: string, name: string }, color: string) => ({
        name: seriesInfo.name,
        type: 'line',
        data: data.map(item => item[seriesInfo.field]),
        itemStyle: { color },
        lineStyle: { width: 3 },
        symbol: 'circle',
        symbolSize: 8
    });

    const series = chartConfig.series.map((seriesInfo, index) =>
        createSeries(seriesInfo, chartConfig.colors[index]));

    // 配置图表选项
    const option: echarts.EChartsOption = {
        title: {
            text: props.chartTitle,
            left: 'center',
            top: 1,
            textStyle: {
                fontSize: 15,
                fontWeight: 'bold',
                color: 'rgba(255, 255, 255, 0.85)'
            }
        },
        tooltip: {
            trigger: 'axis',
            formatter: (params: any) => {
                return `${params[0].axisValue}年<br>` + params.map((param: any) => {
                    const value = param.value;
                    return `${param.seriesName}：${chartConfig.format(value)} ${chartConfig.title}`;
                }).join('<br>');
            }
        },
        legend: props.chartType === 2 ? {
            data: series.map(s => s.name),
            bottom: 0,
            textStyle: {
                color: 'rgba(255, 255, 255, 0.85)'
            }
        } : undefined,
        grid: {
            left: '1%',
            right: '7%',
            bottom: props.chartType === 2 ? '10%' : '3%',
            top: '14%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: years,
            name: '年份',
            nameLocation: 'end',
            nameGap: 5,
            nameTextStyle: {
                color: 'rgba(255, 255, 255, 0.85)'
            },
            axisLabel: {
                interval: 1,
                rotate: 0,
                fontSize: 12,
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
                show: false  // 移除 x 轴的竖向网格线
            }
        },
        yAxis: {
            type: 'value',
            name: chartConfig.title,
            nameLocation: 'end',
            nameGap: 15,
            nameRotate: 0,
            nameTextStyle: {
                align: 'left',
                verticalAlign: 'top',
                padding: [0, 0, 10, 0],
                fontSize: 12,
                color: 'rgba(255, 255, 255, 0.85)'
            },
            axisLabel: {
                formatter: chartConfig.axisLabelFormatter || chartConfig.format,
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
                show: true,
                lineStyle: {
                    color: 'rgba(128, 128, 128, 0.2)'
                }
            },
            scale: true
        },
        series
    };

    // 设置图表选项
    chart.setOption(option);
};

// 处理窗口大小变化
const handleResize = () => {
    chart?.resize();
};

// 组件挂载时加载数据并监听窗口大小变化
onMounted(() => {
    loadCSVData();
    window.addEventListener('resize', handleResize);
});

// 组件卸载时移除监听器并销毁图表实例
onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    chart?.dispose();
});

// 监听 props 变化，重新加载数据
watch([() => props.chartType, () => props.chartTitle, () => props.scale], loadCSVData);
</script>

<style scoped>
.chart-container {
    width: 100%;
    max-width: 400px;
    height: 300px;
    background-color: #131416c2;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 10px;
}
</style>