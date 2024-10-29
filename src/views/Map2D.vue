<template>
    <div class="map-container">
        <!-- 地图容器 -->
        <div id="map" ref="mapContainer"></div>
        <!-- 信息面板，显示悬停的区域信息 -->
        <InfoPanel v-if="hoveredFeature" :feature="hoveredFeature" :field="currentField" :year="currentYear"
            :scale="currentScale" :style="infoPanelStyle" />
        <!-- 图例，显示当前字段的颜色和最大值 -->
        <Legend :field="currentField" :color="currentColor" :maxValue="maxFieldValue" />
        <!-- 排行榜容器 -->
        <div class="ranking-board-container">
            <RankingBoard :currentData="currentData" :currentScale="currentScale" :currentField="currentField"
                :currentYear="currentYear" />
        </div>
        <!-- 加载指示器，显示加载状态 -->
        <div id="loading-indicator" v-show="loading">
            加载中...
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, onUnmounted } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import InfoPanel from '@/components/InfoPanel.vue';
import Legend from '@/components/Legend.vue';
import { getStyle } from '@/utils/colorConfig';
import simplify from '@turf/simplify';
import centroid from '@turf/centroid';
import RankingBoard from '@/components/RankingBoard.vue';

// 省份标签偏移量
const PROVINCE_LABEL_OFFSETS = {
    '北京市': { lat: 0.5, lng: 0 },
    '河北省': { lat: -0.7, lng: -1.2 },
    '山东省': { lat: 0, lng: -1.5 },
    '江苏省': { lat: 0.5, lng: 0.2 },
    '安徽省': { lat: 0, lng: -0.4 },
    '浙江省': { lat: 0.1, lng: -1.5 },
    '福建省': { lat: 0.5, lng: -1.3 },
    '广东省': { lat: 0.9, lng: -0.5 },
    '江西省': { lat: 0.5, lng: -0.5 },
    '河南省': { lat: 0.5, lng: -0.9 },
    '湖南省': { lat: 0.5, lng: -0.2 },
    '海南省': { lat: 8, lng: -4 },
    '甘肃省': { lat: -1, lng: 1 },
    '山西省': { lat: 0.3, lng: -0.7 },
    '陕西省': { lat: -0.7, lng: -0.5 },
    '青海省': { lat: 1, lng: 0.3 },
    '广西壮族自治区': { lat: 0.2, lng: -1.3 },
    '宁夏回族自治区': { lat: 0.5, lng: -0.5 },
    '湖北省': { lat: 0.7, lng: -0.2 },
    '重庆市': { lat: 0.2, lng: -0.5 },
    '内蒙古自治区': { lat: -2, lng: -4.5 },
    '辽宁省': { lat: 0.8, lng: 0.5 },
};

// 城市标签偏移量
const CITY_LABEL_OFFSETS = {
    '三门峡市': { lat: 0.1, lng: -0.3 },
    '眉山市': { lat: 0.2, lng: 0.2 },
    '上饶市': { lat: -0.3, lng: 0.4 },
    '铜陵市': { lat: 0.1, lng: 0 },
    '鄂州市': { lat: 0.2, lng: 0 },
    '景德镇市': { lat: 0, lng: -0.2 },
    '陵水黎族自治县': { lat: -0.1, lng: 0 },
    '汕尾市': { lat: 0.5, lng: -0.1 },
    '安阳市': { lat: 0.2, lng: 0 },
    '濮阳市': { lat: -0.2, lng: -0.2 },
    '盐城市': { lat: 0.3, lng: 0 },
    '常州市': { lat: 0.1, lng: 0 },
    '无锡市': { lat: 0, lng: 0.1 },
    '甘南藏族自治州': { lat: 0.4, lng: 0 },
};

// 接收父组件传递的属性
const props = defineProps({
    currentField: { type: String, required: true },
    currentYear: { type: String, required: true },
    currentColor: { type: String, required: true },
    fieldInput: { type: Number, required: true },
    currentScale: { type: String, required: true },
});

// 定义事件发射器
const emit = defineEmits(['featureClicked']);

// 地图容器引用
const mapContainer = ref<HTMLElement | null>(null);
// 地图实例
const map = ref<L.Map | null>(null);
// GeoJSON 图层
const geojsonLayer = ref<L.GeoJSON | null>(null);
// 标签图层
const labelLayer = ref<L.LayerGroup | null>(null);
// 悬停的区域信息
const hoveredFeature = ref(null);
// 加载状态
const loading = ref(true);
// 错误信息
const error = ref<string | null>(null);

// 省份数据
const provinceData = ref<GeoJSON.FeatureCollection | null>(null);
// 城市数据
const cityData = ref<GeoJSON.FeatureCollection | null>(null);

// 信息面板样式
const infoPanelStyle = ref({
    position: 'fixed',
    left: '0px',
    top: '0px',
    pointerEvents: 'none',
    zIndex: 1000,
    width: '150px',
});

// 当前数据（根据比例尺选择省份或城市数据）
const currentData = computed(() => {
    return props.currentScale === 'province' ? provinceData.value : cityData.value;
});

// 当前字段的最大值
const maxFieldValue = computed(() => {
    if (!currentData.value) return 0;
    const fieldPrefix = props.currentScale === 'province' ? 'P' : 'C';
    const field = `${fieldPrefix}${props.currentField.slice(1)}`;
    return Math.max(...currentData.value.features.map(feature =>
        feature.properties[`${field}_${props.currentYear}`] || 0
    ));
});

// 加载 GeoJSON 数据
const loadGeoJSON = async (url: string): Promise<GeoJSON.FeatureCollection> => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return simplify(data, { tolerance: 0.007, highQuality: true });
};

// 加载所有数据
const loadAllData = async () => {
    try {
        loading.value = true;
        provinceData.value = await loadGeoJSON('/2Ddata/Province016.geojson');
        cityData.value = await loadGeoJSON('/2Ddata/City017.geojson');
        updateGeoJsonLayer();
    } catch (err) {
        console.error("Failed to load data:", err);
        error.value = err instanceof Error ? err.message : String(err);
    } finally {
        loading.value = false;
    }
};

// 创建标签
const createLabel = (center: L.LatLng, text: string) => {
    return L.divIcon({
        className: 'province-label',
        html: `<div>${text}</div>`,
        iconSize: [0, 0],
        iconAnchor: [10, 0]
    });
};

// 更新标签
const updateLabels = () => {
    if (!map.value || !currentData.value) return;

    if (labelLayer.value) {
        labelLayer.value.clearLayers();
    } else {
        labelLayer.value = L.layerGroup().addTo(map.value);
    }

    const zoom = map.value.getZoom();

    if (props.currentScale === 'province') {
        currentData.value.features.forEach(feature => {
            try {
                const provinceName = feature.properties.Province;
                const center = centroid(feature);
                let coords = center.geometry.coordinates;

                if (PROVINCE_LABEL_OFFSETS[provinceName]) {
                    const offset = PROVINCE_LABEL_OFFSETS[provinceName];
                    coords = [
                        coords[0] + offset.lng,
                        coords[1] + offset.lat
                    ];
                }

                const label = L.marker([coords[1], coords[0]], {
                    icon: createLabel([coords[1], coords[0]], provinceName),
                    interactive: false
                });

                labelLayer.value?.addLayer(label);
            } catch (error) {
                console.error('标注label创建失败:', error);
            }
        });
    } else if (props.currentScale === 'city' && zoom > 6.5) {
        currentData.value.features.forEach(feature => {
            try {
                const cityName = feature.properties.City;
                const center = centroid(feature);
                let coords = center.geometry.coordinates;

                if (CITY_LABEL_OFFSETS[cityName]) {
                    const offset = CITY_LABEL_OFFSETS[cityName];
                    coords = [
                        coords[0] + offset.lng,
                        coords[1] + offset.lat
                    ];
                }

                const label = L.marker([coords[1], coords[0]], {
                    icon: createLabel([coords[1], coords[0]], cityName),
                    interactive: false
                });

                labelLayer.value?.addLayer(label);
            } catch (error) {
                console.error('标注label创建失败:', error);
            }
        });
    }
};

// 初始化地图
const initializeMap = () => {
    if (map.value || !mapContainer.value) return;
    map.value = L.map(mapContainer.value, {
        center: [38, 99],
        zoom: 4.75,
        minZoom: 3,
        preferCanvas: true,
        zoomControl: false,
        zoomSnap: 0.25,
        maxBounds: L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180)),
    });

    const zoomControl = L.control.zoom({ position: 'bottomright' }).addTo(map.value);
    const zoomContainer = zoomControl.getContainer();
    zoomContainer.style.marginRight = '200px';
    zoomContainer.style.marginBottom = '16px';

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 8,
    }).addTo(map.value);

    map.value.on('zoomend', () => {
        updateLabels();
    });
};

// 更新 GeoJSON 图层
const updateGeoJsonLayer = () => {
    if (!currentData.value || !map.value) return;

    if (geojsonLayer.value) {
        geojsonLayer.value.remove();
    }

    const fieldPrefix = props.currentScale === 'province' ? 'P' : 'C';
    const field = `${fieldPrefix}${props.currentField.slice(1)}`;

    geojsonLayer.value = L.geoJSON(currentData.value, {
        style: (feature) => getStyle(feature, field, props.currentYear, props.fieldInput, props.currentColor, maxFieldValue.value),
        onEachFeature: onEachFeature,
        renderer: L.canvas()
    }).addTo(map.value);

    updateLabels();
};

// 处理每个 GeoJSON 特征
const onEachFeature = (feature: GeoJSON.Feature, layer: L.Layer) => {
    let rafId: number | null = null;

    const updateInfoPanel = (e: L.LeafletMouseEvent) => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
            if (layer instanceof L.Path) {
                layer.setStyle({ weight: 2, color: '#c0ebd7', fillOpacity: 0.7 });
            }
            hoveredFeature.value = feature.properties;

            const x = e.originalEvent.clientX;
            const y = e.originalEvent.clientY;

            infoPanelStyle.value = {
                ...infoPanelStyle.value,
                left: `${x + 15}px`,
                top: `${y + 15}px`,
            };
        });
    };

    const eventHandlers = {
        mousemove: updateInfoPanel,
        mouseout: (e: L.LeafletMouseEvent) => {
            if (rafId) cancelAnimationFrame(rafId);
            if (geojsonLayer.value) {
                geojsonLayer.value.resetStyle(e.target);
            }
            hoveredFeature.value = null;
        },
        click: (e: L.LeafletMouseEvent) => {
            emit('featureClicked', feature.properties);
            if (e.target.getBounds && map.value) {
                map.value.fitBounds(e.target.getBounds());
            }
        },
    };

    layer.on(eventHandlers);
};

// 监听属性变化，更新图层和标签
watch(
    [() => props.currentField, () => props.currentYear, () => props.currentColor, () => props.fieldInput, () => props.currentScale, maxFieldValue],
    () => {
        updateGeoJsonLayer();
        updateLabels();
    }
);

// 组件挂载时初始化地图并加载数据
onMounted(() => {
    initializeMap();
    loadAllData();

    const handleGlobalMouseMove = (e: MouseEvent) => {
        if (hoveredFeature.value) {
            infoPanelStyle.value = {
                ...infoPanelStyle.value,
                left: `${e.clientX + 15}px`,
                top: `${e.clientY + 15}px`,
            };
        }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);

    onUnmounted(() => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        if (map.value) {
            map.value.remove();
        }
    });
});
</script>

<!-- 样式 -->
<style scoped>
.map-container {
    position: relative;
    width: 100%;
    height: 100%;
}

#map {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

#loading-indicator {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;
    background-color: rgba(0, 0, 0, 0.7);
    color: rgb(243, 243, 243);
    padding: 10px 10px;
    border-radius: 5px;
}

:deep(.leaflet-control-attribution) {
    display: none;
}

.ranking-board-container {
    position: absolute;
    top: 290px;
    right: 20px;
    z-index: 1000;
}

:deep(.leaflet-control-zoom) {
    background: black;
}

:deep(.leaflet-control-zoom-in),
:deep(.leaflet-control-zoom-out) {
    color: white;
    background-color: black;
    border-color: #666;
}

:deep(.leaflet-control-zoom-in:hover),
:deep(.leaflet-control-zoom-out:hover) {
    background-color: #101010;
    color: white;
}

:deep(.province-label) {
    background: transparent;
    border: none;
}

:deep(.province-label div) {
    color: #cbcbcb;
    font-size: 12px;
    white-space: nowrap;
    pointer-events: none;
}
</style>