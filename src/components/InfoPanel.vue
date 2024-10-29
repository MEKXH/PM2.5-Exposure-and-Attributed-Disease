<template>
  <!-- 信息面板组件 -->
  <div class="info-panel">
    <h4>{{ infoTitle }}</h4>
    <div v-html="infoContent"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// 定义组件的 props
const props = defineProps({
  feature: Object, // 地图上的特征数据
  field: String,  // 当前选中的字段
  year: String,   // 当前选中的年份
  scale: String   // 当前的缩放级别（省份或城市）
});

// 计算属性：根据字段生成标题
const infoTitle = computed(() => {
  switch (props.field) {
    case 'Ppw':
    case 'Cpw':
      return '人口加权 PM2.5';
    case 'Pgini':
    case 'Cgini':
      return 'PM2.5 基尼系数';
    case 'Pdp':
    case 'Cdp':
      return '过早死亡人数';
    case 'Pdrg':
    case 'Cdrg':
      return '死亡率基尼系数';
    default:
      return 'Information';
  }
});

// 计算属性：根据特征数据生成内容
const infoContent = computed(() => {
  // 如果没有特征数据，提示用户悬停在地图上查看
  if (!props.feature) return 'Please hover over the map to view';

  // 判断当前是省份还是城市
  const isProvince = props.scale === 'province';
  // 获取区域名称
  const regionName = isProvince ? props.feature.Province : props.feature.City || 'Unknown Region';
  // 根据缩放级别确定字段前缀
  const fieldPrefix = isProvince ? 'P' : 'C';
  // 根据前缀和字段生成完整字段名
  const field = `${fieldPrefix}${props.field.slice(1)}`;

  // 初始化内容字符串
  let content = `<b>${isProvince ? '省份' : '城市'}: ${regionName}</b><br>`;

  // 定义起始年份和结束年份
  const startYear = 2000;
  const endYear = field.endsWith('pw') ? 2019 : 2019;

  // 格式化数值，如果值不存在则显示 'N/A'
  const formatValue = (value: number | undefined | null) =>
    value !== undefined && value !== null ? value.toFixed(2) : 'N/A';

  // 获取起始年份的值
  const startValue = props.feature[`${field}_${startYear}`];
  content += `${startYear}年: ${formatValue(startValue)}<br>`;

  // 获取结束年份的值
  const endValue = props.feature[`${field}_${endYear}`];
  content += `${endYear}年: ${formatValue(endValue)}<br>`;

  // 如果当前年份不是起始年份或结束年份，显示当前年份的值
  if (props.year !== startYear.toString() && props.year !== endYear.toString()) {
    const currentValue = props.feature[`${field}_${props.year}`];
    content += `当前 ${props.year}年: ${formatValue(currentValue)}<br>`;
  }

  // 如果起始值和结束值都存在，计算变化量并显示
  if (startValue !== undefined && startValue !== null && endValue !== undefined && endValue !== null) {
    const change = endValue - startValue;
    content += `变化: ${change.toFixed(2)} `;
    content += change > 0 ? '↑' : change < 0 ? '↓' : '';
  }

  return content;
});
</script>

<style scoped>
/* 信息面板的样式 */
.info-panel {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.901);
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  max-width: 200px;
  z-index: 900;
  font-family: Arial, sans-serif;
}

/* 标题样式 */
.info-panel h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 16px;
}

/* 内容样式 */
.info-panel div {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}
</style>