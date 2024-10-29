<template>
    <!-- 控制面板容器 -->
    <div class="control-panel">
        <!-- 控制面板内容 -->
        <div class="control-content">
            <!-- 数据类型选择器 -->
            <div class="control-item data-type-selector">
                <label>数据</label>
                <div class="type-options">
                    <!-- 数据类型按钮，点击后选择对应的数据类型 -->
                    <button v-for="type in dataTypes" :key="type.value" @click="selectType(type.value)"
                        :class="['type-option', { active: field === type.value }]">
                        {{ type.label }}
                    </button>
                </div>
            </div>
            <!-- 尺度选择器 -->
            <div class="control-item scale-selector">
                <label>尺度</label>
                <div class="type-options">
                    <!-- 尺度选项按钮，点击后选择对应的尺度 -->
                    <button v-for="scaleOption in scaleOptions" :key="scaleOption.value"
                        @click="selectScale(scaleOption.value)"
                        :class="['type-option', { active: scale === scaleOption.value }]">
                        {{ scaleOption.label }}
                    </button>
                </div>
            </div>
            <!-- 年份滑块 -->
            <div class="control-item year-slider">
                <div class="input-row">
                    <label for="year-slider">年份：</label>
                    <span class="year-display">{{ year }}</span>
                    <div class="slider-container">
                        <!-- 年份滑块，拖动滑块选择年份 -->
                        <input id="year-slider" type="range" :value="year" @input="onYearChange" min="2000" max="2019"
                            step="1">
                    </div>
                </div>
            </div>
            <!-- 字段输入控制 -->
            <div class="control-item field-input-control">
                <div class="input-row">
                    <label for="field-input">显示过滤:</label>
                    <!-- 字段输入框，输入数值进行过滤 -->
                    <input id="field-input" type="number" :value="fieldInput" @input="onFieldInputChange"
                        :min="minFieldValue" :max="effectiveMaxFieldValue" :step="fieldStep">
                    <div class="slider-container">
                        <!-- 字段滑块，拖动滑块进行过滤 -->
                        <input type="range" :value="fieldInput" @input="onFieldInputChange" :min="minFieldValue"
                            :max="effectiveMaxFieldValue" :step="fieldStep">
                    </div>
                </div>
            </div>
            <!-- 全国统计图显示控制 -->
            <div class="control-item chart-tc">
                <label>统计图显示：</label>
                <div class="chart-toggle-container">
                    <!-- 统计图切换按钮，点击切换显示/隐藏 -->
                    <label v-for="chart in relevantCharts" :key="chart.id" class="chart-toggle">
                        <input type="checkbox" :checked="chart.visible" @change="toggleChart(chart.id)" />
                        <span class="toggle-label">{{ chart.title }}</span>
                    </label>
                </div>
            </div>
        </div>
    </div>

    <!-- 统计图grid，显示当前可见的相关统计图 -->
    <div v-if="visibleRelevantCharts.length > 0" class="chart-grid">
        <div v-for="chart in visibleRelevantCharts" :key="chart.id" class="chart-container">
            <ChinaChart :csvFilePath="csvFilePath" :chartType="chart.id" :chartTitle="chart.title" :scale="scale" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import ChinaChart from './ChinaChart.vue';

// 定义组件的 props
const props = defineProps({
    field: { type: String, required: true }, // 当前选中的数据字段
    year: { type: String, required: true }, // 当前选中的年份
    fieldInput: { type: Number, default: 0 }, // 当前的字段输入值
    scale: { type: String, required: true }, // 当前选中的尺度
    maxFieldValue: { type: Number, default: 100 }, // 字段输入的最大值
    csvFilePath: { type: String, required: true } // CSV 文件路径
});

// 定义组件的 emits
const emit = defineEmits(['update:field', 'update:year', 'update:fieldInput', 'update:scale', 'update']);

// 数据类型选项
const dataTypes = [
    { value: 'Ppw', label: '人口加权 PM2.5' },
    { value: 'Pgini', label: 'PM2.5基尼系数' },
    { value: 'Pdp', label: '过早死亡人数' },
    { value: 'Pdrg', label: '死亡率基尼系数' },
];

// 尺度选项
const scaleOptions = [
    { value: 'province', label: '省级' },
    { value: 'city', label: '市级' },
];

// 统计图选项
const charts = ref([
    { id: 1, title: '全国人口加权PM2.5', visible: true, dataType: 'Ppw' },
    { id: 2, title: '全国PM2.5基尼系数', visible: true, dataType: 'Pgini' },
    { id: 3, title: '全国过早死亡人数', visible: true, dataType: 'Pdp' },
    { id: 4, title: '全国死亡率基尼系数', visible: true, dataType: 'Pdrg' },
]);

// 计算当前选中的数据类型相关的统计图
const relevantCharts = computed(() => charts.value.filter(chart => chart.dataType === props.field));

// 计算当前可见的相关统计图
const visibleRelevantCharts = computed(() => relevantCharts.value.filter(chart => chart.visible));

// 判断当前选中的数据类型是否为基尼系数
const isGiniCoefficient = computed(() => ['Pgini', 'Pdrg'].includes(props.field));

// 计算字段输入的最大值
const effectiveMaxFieldValue = computed(() => isGiniCoefficient.value ? 0.2 : props.maxFieldValue);

// 字段输入的最小值
const minFieldValue = computed(() => 0);

// 计算字段输入的步长
const fieldStep = computed(() => {
    if (isGiniCoefficient.value) return 0.01;
    return props.field === 'Ppw' ? 0.1 : 1000;
});

// 选择数据类型
const selectType = (type: string) => {
    emit('update:field', type);
    emit('update:fieldInput', 0);
    emit('update');
};

// 年份变化处理
const onYearChange = (event: Event) => {
    const newYear = Number((event.target as HTMLInputElement).value);
    emit('update:year', newYear);
    emit('update');
};

// 字段输入变化处理
const onFieldInputChange = (event: Event) => {
    const newValue = Number((event.target as HTMLInputElement).value);
    const clampedValue = Math.max(newValue, minFieldValue.value);
    const finalValue = Math.min(clampedValue, effectiveMaxFieldValue.value);
    emit('update:fieldInput', finalValue);
    emit('update');
};

// 选择尺度
const selectScale = (newScale: string) => {
    emit('update:scale', newScale);
    emit('update');
};

// 切换统计图显示状态
const toggleChart = (id: number) => {
    const chart = charts.value.find(c => c.id === id);
    if (chart) chart.visible = !chart.visible;
};

// 监听数据类型变化
watch(() => props.field, (newField) => {
    emit('update:fieldInput', 0);
    if (isGiniCoefficient.value && props.fieldInput > 0.2) {
        emit('update:fieldInput', 0.2);
    } else if (!isGiniCoefficient.value && props.fieldInput > props.maxFieldValue) {
        emit('update:fieldInput', props.maxFieldValue);
    }
    charts.value.forEach(chart => {
        chart.visible = chart.dataType === newField;
    });
});
</script>

<!-- 样式 -->
<style scoped>
.control-panel {
    display: flex;
    background-color: #131416c2;
    border-radius: 8px;
    height: 305px;
    width: 420px;
    overflow: hidden;
}

.control-content {
    flex-grow: 1;
    padding: 10px 56px;
}

.control-item {
    margin-bottom: 10px;
}

label {
    color: #ffffff;
    font-weight: 500;
    font-size: 14px;
}

input[type="number"],
input[type="range"] {
    border: 2px solid #ffffff;
    border-radius: 4px;
    font-size: 14px;
}

input[type="range"] {
    height: 18px;
    border-radius: 8px;
    appearance: none;
    background-color: #07000f;
    margin-top: 4px;
}

input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    background-color: #1b58ff;
    border-radius: 50%;
    cursor: pointer;
}

input[type="number"] {
    background-color: #000000;
    color: #ffffff;
    border-radius: 8px;
    width: 70px;
}

span {
    color: #ffffff;
}

.input-row {
    display: flex;
    align-items: center;
    gap: 10px;
}

.input-row label {
    white-space: nowrap;
    min-width: 70px;
}

.year-display {
    width: 70px;
    text-align: center;
}

.slider-container {
    flex-grow: 1;
    min-width: 100px;
}

.chart-tc {
    display: flex;
    flex-direction: row;
    align-items: center;
}

.chart-toggle-container {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
}

.chart-toggle {
    display: flex;
    align-items: center;
    min-width: 150px;
}

.chart-toggle input[type="checkbox"] {
    margin-right: 8px;
    cursor: pointer;
    appearance: none;
    width: 16px;
    height: 16px;
    border: 1px solid #1b58ff;
    border-radius: 4px;
    background-color: #fff;
}

.chart-toggle input[type="checkbox"]:checked {
    background-color: #1b58ff;
    border-color: #1b58ff;
}

.chart-toggle input[type="checkbox"]:checked::after {
    content: '✔';
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    color: white;
    font-size: 12px;
}

.type-options {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.type-option {
    padding: 6px 12px;
    width: 150px;
    background-color: #000000;
    border: 1px solid #ffffffe2;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    color: #ffffff;
}

.type-option.active {
    background-color: #1b58ff;
    border-color: #1b58ff;
    color: #ffffffe2;
}

.chart-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
    margin-top: 15px;
}
</style>