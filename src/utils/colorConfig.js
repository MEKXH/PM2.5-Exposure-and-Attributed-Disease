export const FIELD_LIMITS = {
    Ppw: 105,
    Cpw: 130,
    Pgini: 0.25,
    Cdrg: 0.25,
    Pdrg: 0.25,
    Cgini: 0.25,
    Pdp: 140000,
    Cdp: 35000
};

// 不同字段对应的颜色方案
const COLOR_SCHEMES = {
    Ppw: ['#5d7cbd', '#3760ac', '#2252a3', '#0e328a', '#192648'],
    Cpw: ['#5d7cbd', '#3760ac', '#2252a3', '#0e328a', '#192648'],
    Pgini: ['#71a4b9', '#5093af', '#3084a7', '#1d566e', '#0f2d39'],
    Cgini: ['#71a4b9', '#5093af', '#3084a7', '#1d566e', '#0f2d39'],
    Pdp: ['#df6e72', '#d94749', '#d42323', '#891c22', '#480b0d'],
    Cdp: ['#df6e72', '#d94749', '#d42323', '#891c22', '#480b0d'],
    Pdrg: ['#532813', '#9b4b24', '#e28b4b', '#ef8836', '#eea064'],
    Cdrg: ['#532813', '#9b4b24', '#e28b4b', '#ef8836', '#eea064']
};

// 定义特殊字段的分级边界
const CUSTOM_BREAKPOINTS = {
    Ppw: [0, 40, 50, 60, 70, 105],
    Cpw: [0, 40, 50, 60, 70, 105]
};

// 获取字段的分级边界值
const getFieldBreakpoints = (field) => {
    // 特殊字段使用自定义分级
    if (CUSTOM_BREAKPOINTS[field]) {
        return CUSTOM_BREAKPOINTS[field];
    }

    // 其他字段保持原均分逻辑
    const maxValue = FIELD_LIMITS[field];
    const breakpoints = [];
    for (let i = 0; i <= 5; i++) {
        breakpoints.push((maxValue * i) / 5);
    }
    return breakpoints;
};

// 根据值获取对应的等级
const getLevel = (value, breakpoints) => {
    if (value === undefined || value === null) return -1;
    for (let i = 0; i < breakpoints.length - 1; i++) {
        if (value >= breakpoints[i] && value < breakpoints[i + 1]) {
            return i;
        }
    }
    // 如果值等于最大边界值，返回最后一个等级
    if (value === breakpoints[breakpoints.length - 1]) {
        return breakpoints.length - 2;
    }
    return breakpoints.length - 2;
};

// 根据值和字段获取对应的颜色
export const getColor = (value, field) => {
    if (value === undefined || value === null) {
        return 'transparent';
    }

    if (value > FIELD_LIMITS[field]) {
        return '#ff0000'; // 超出最大值显示红色（异常情况，不会出现）
    }

    const breakpoints = getFieldBreakpoints(field);
    const level = getLevel(value, breakpoints);

    return level === -1 ? 'transparent' : COLOR_SCHEMES[field][level];
};

// 根据特征、字段、年份和输入值获取样式
export const getStyle = (feature, field, year, fieldInput) => {
    if (!feature?.properties) {
        return { fillColor: 'transparent', weight: 0, fillOpacity: 0 };
    }

    const fieldValue = feature.properties[`${field}_${year}`];

    return fieldValue >= fieldInput
        ? {
            fillColor: getColor(fieldValue, field),
            weight: 0.5,
            color: 'lightgrey',
            fillOpacity: 1
        }
        : { fillColor: 'transparent', weight: 0, fillOpacity: 0 };
};

// 生成图例项
export const generateLegendItems = (field) => {
    const breakpoints = getFieldBreakpoints(field);
    const items = [];

    // 添加5个等级的图例项
    for (let i = 0; i < 5; i++) {
        const startValue = breakpoints[i];
        const endValue = breakpoints[i + 1];

        let label;
        if (['Pgini', 'Pdrg', 'Cgini', 'Cdrg'].includes(field)) {
            label = `${startValue.toFixed(2)} - ${endValue.toFixed(2)}`;
        } else {
            label = `${Math.round(startValue)} - ${Math.round(endValue)}`;
        }

        items.push({
            color: COLOR_SCHEMES[field][i],
            label: label
        });
    }

    return items;
};