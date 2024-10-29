<template>
    <!-- 控制面板容器-->
    <div class="control-wrapper" :class="{ 'control-panel-collapsed': isCollapsed }">
        <!-- 控制面板主体 -->
        <div class="control-panel">
            <div class="control-content">
                <!-- 数据类型选择器 -->
                <div class="control-item data-type-selector">
                    <label>数据</label>
                    <div class="type-options">
                        <!-- 数据类型按钮-->
                        <button v-for="type in dataTypes" :key="type.value"
                            :class="['type-option', { active: selectedDataType === type.value }]" :disabled="isLoading"
                            @click="handleDataTypeChange(type.value)">
                            {{ type.label }}
                        </button>
                    </div>
                </div>

                <!-- 疾病类型选择器，仅在 showDiseaseSelector 为 true 时显示 -->
                <div v-if="showDiseaseSelector" class="control-item disease-type-selector">
                    <label>疾病类型</label>
                    <div class="type-options">
                        <!-- 疾病类型按钮 -->
                        <button v-for="type in diseaseTypes" :key="type.value"
                            :class="['type-option', { active: selectedDiseaseType === type.value }]"
                            :disabled="isLoading" @click="handleDiseaseTypeChange(type.value)">
                            {{ type.label }}
                        </button>
                    </div>
                </div>

                <!-- 年份滑块 -->
                <div class="control-item year-slider">
                    <div class="input-row">
                        <label>年份：</label>
                        <span class="year-display">{{ selectedYear }}</span>
                        <div class="slider-container">
                            <!-- 年份滑块，根据 selectedYear 状态动态更新值 -->
                            <input type="range" v-model="selectedYear" :min="2000" :max="2019" step="1"
                                :disabled="isLoading" @change="handleSelectionChange">
                        </div>
                    </div>
                </div>

                <!-- 加载指示器，仅在 isLoading 为 true 时显示 -->
                <div v-if="isLoading" class="loading-indicator">加载中...</div>
            </div>
        </div>
        <!-- 折叠按钮，点击时切换 isCollapsed 状态 -->
        <button class="collapse-handle" @click="toggleCollapse">
            <span class="arrow-icon" :class="{ 'collapsed': isCollapsed }">❮</span>
        </button>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, nextTick, computed } from 'vue';

// 数据类型接口定义
interface DataType {
    label: string;
    value: string;
    filePrefix: string;
    folderName: string;
    resolution: string[]
}

// 疾病类型接口定义
interface DiseaseType {
    label: string;
    value: string;
}

// 数据类型列表
const dataTypes: DataType[] = [
    {
        label: 'PM2.5',
        value: 'pm25',
        filePrefix: 'PM25',
        folderName: 'PM25JSON',
        resolution: ['1km']
    },
    {
        label: '人口',
        value: 'ppp',
        filePrefix: 'Ppp',
        folderName: 'PPPJSON',
        resolution: ['1km']
    },
    {
        label: '死亡人数',
        value: 'dvalue',
        filePrefix: 'Dvalue',
        folderName: 'DvalueJSON',
        resolution: ['1km']
    },
    {
        label: '死亡率',
        value: 'drate',
        filePrefix: 'Drate',
        folderName: 'DrateJSON',
        resolution: ['1km']
    }
];

// 疾病类型列表
const diseaseTypes: DiseaseType[] = [
    { label: '总体', value: 'total' },
    { label: 'COPD', value: 'COPD' },
    { label: 'IHD', value: 'IHD' },
    { label: 'LNC', value: 'LNC' },
    { label: 'LRI', value: 'LRI' },
    { label: 'STR', value: 'STR' },
];

// 当前选中的数据类型
const selectedDataType = ref<string>('pm25');
// 当前选中的疾病类型
const selectedDiseaseType = ref<string>('total');
// 当前选中的年份
const selectedYear = ref<number>(2000);
// 当前选中的分辨率
const selectedResolution = ref<string>('1km');
// 加载状态
const isLoading = ref<boolean>(false);
// 折叠状态
const isCollapsed = ref<boolean>(false);
// 数据缓存
const dataCache = new Map<string, any>();
// 当前缓存键
const currentCacheKey = ref<string>('');

// 计算属性：是否显示疾病类型选择器
const showDiseaseSelector = computed(() => {
    return ['dvalue', 'drate'].includes(selectedDataType.value);
});

// 定义事件发射器
const emit = defineEmits<{
    (e: 'dataChange', data: any): void;
    (e: 'loadingChange', loading: boolean): void;
}>();

// 获取数据路径
const getDataPath = (dataType: string, year: number, resolution: string, diseaseType?: string): string => {
    // 处理死亡率和死亡人数的特殊路径
    if (dataType === 'drate' && diseaseType && diseaseType !== 'total') {
        return `/3Ddata/DratePILL_JSON/${year}/${diseaseType}.json`;
    }
    if (dataType === 'dvalue' && diseaseType && diseaseType !== 'total') {
        return `/3Ddata/DvaluePILL_JSON/${year}/${diseaseType}.json`;
    }

    // 默认路径处理
    const dataTypeConfig = dataTypes.find(type => type.value === dataType);
    if (!dataTypeConfig) {
        throw new Error(`Invalid data type: ${dataType}`);
    }

    const fileName = `${dataTypeConfig.filePrefix}_${year}_${resolution}.json`;
    return `/3Ddata/${dataTypeConfig.folderName}/${fileName}`;
};

// 清除之前的缓存
const clearPreviousCache = (newCacheKey: string) => {
    if (currentCacheKey.value && currentCacheKey.value !== newCacheKey) {
        dataCache.delete(currentCacheKey.value);
    }
    currentCacheKey.value = newCacheKey;
};

// 加载数据
const loadData = async (dataType: string, year: number, resolution: string, diseaseType?: string) => {
    const cacheKey = `${dataType}_${year}_${resolution}_${diseaseType || 'total'}`;

    try {
        isLoading.value = true;
        emit('loadingChange', true);

        clearPreviousCache(cacheKey);

        if (dataCache.has(cacheKey)) {
            return dataCache.get(cacheKey);
        }

        const path = getDataPath(dataType, year, resolution, diseaseType);
        const response = await fetch(path);

        if (!response.ok) {
            throw new Error(`Failed to load data: ${response.statusText}`);
        }

        const data = await response.json();
        dataCache.set(cacheKey, data);

        return data;
    } catch (error) {
        console.error('Error loading data:', error);
        throw error;
    } finally {
        isLoading.value = false;
        emit('loadingChange', false);
    }
};

// 处理数据类型变化
const handleDataTypeChange = (dataType: string) => {
    selectedDataType.value = dataType;
    if (!showDiseaseSelector.value) {
        selectedDiseaseType.value = 'total';
    }
    handleSelectionChange();
};

// 处理疾病类型变化
const handleDiseaseTypeChange = (diseaseType: string) => {
    selectedDiseaseType.value = diseaseType;
    handleSelectionChange();
};

// 处理选择变化
const handleSelectionChange = async () => {
    try {
        const data = await loadData(
            selectedDataType.value,
            selectedYear.value,
            selectedResolution.value,
            selectedDiseaseType.value
        );
        emit('dataChange', data);
    } catch (error) {
        console.error('Failed to load data:', error);
    }
};

// 切换折叠状态
const toggleCollapse = () => {
    isCollapsed.value = !isCollapsed.value;
};

// 组件挂载时加载初始数据
onMounted(async () => {
    await nextTick();
    await handleSelectionChange();
});

// 暴露组件的属性和方法
defineExpose({
    selectedDataType,
    selectedYear,
    selectedResolution,
    selectedDiseaseType,
    isLoading
});
</script>

<!-- 样式 -->
<style scoped>
.control-wrapper {
    position: absolute;
    top: 120px;
    left: 20px;
    z-index: 1000;
    transition: all 0.3s ease;
}

.control-panel {
    display: flex;
    background-color: #131416c2;
    border-radius: 8px 0 8px 8px;
    width: 400px;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;
}

.control-panel-collapsed {
    transform: translateX(-105%);
}

.collapse-handle {
    position: absolute;
    right: -30px;
    top: 0;
    width: 30px;
    height: 60px;
    background-color: #131416c2;
    border: none;
    border-radius: 0 8px 8px 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    transition: background-color 0.2s;
}

.collapse-handle:hover {
    background-color: rgba(75, 75, 75, 0.8);
}

.arrow-icon {
    font-size: 20px;
    transition: transform 0.5s;
}

.arrow-icon.collapsed {
    transform: rotate(180deg);
}

.control-content {
    flex-grow: 1;
    padding: 20px 45px;
}

.control-item {
    margin-bottom: 20px;
}

label {
    color: #ffffff;
    font-weight: 500;
    font-size: 14px;
    display: block;
    margin-bottom: 8px;
}

input[type="range"] {
    height: 18px;
    border-radius: 8px;
    appearance: none;
    background-color: #07000f;
    border: 2px solid #ffffff;
    margin-top: 5px;
    width: 100%;
}

input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    background-color: #1b58ff;
    border-radius: 50%;
    cursor: pointer;
}

input[type="range"]:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.input-row {
    display: flex;
    align-items: center;
    gap: 10px;
}

.input-row label {
    white-space: nowrap;
    min-width: 70px;
    margin-bottom: 0;
}

.year-display {
    color: #ffffff;
    width: 70px;
    text-align: center;
}

.slider-container {
    flex-grow: 1;
    min-width: 100px;
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
    transition: all 0.3s ease;
}

.type-option.active {
    background-color: #1b58ff;
    border-color: #1b58ff;
    color: #ffffffe2;
}

.type-option:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.loading-indicator {
    color: #ffffff;
    font-size: 14px;
    text-align: center;
    padding: 8px;
}
</style>