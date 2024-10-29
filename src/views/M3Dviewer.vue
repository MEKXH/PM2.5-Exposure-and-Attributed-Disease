<template>
    <div class="m3dviewer">
        <!-- 画布容器 -->
        <div ref="canvasContainer" class="canvas-container"></div>
        <!-- 3D控制面板 -->
        <ControlPanel3D ref="controlPanel" @dataChange="handleDataChange" />
        <!-- 图例容器 -->
        <div class="legend-container">
            <Legend3D :min="0" :max="maxHeight" :getColorForHeight="getColorForHeight" />
        </div>
    </div>
</template>

<script lang="ts" setup>
import {
    onMounted,
    ref,
    onUnmounted,
    shallowRef,
    computed,
} from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Legend3D from '@/components/Legend3D.vue';
import ControlPanel3D from '@/components/ControlPanel3D.vue';

// 画布容器和控制面板的引用
const canvasContainer = shallowRef<HTMLDivElement | null>(null);
const controlPanel = ref<InstanceType<typeof ControlPanel3D> | null>(null);

// Three.js 对象的引用
const threeObjects = shallowRef({
    renderer: null as THREE.WebGLRenderer | null,
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    controls: null as OrbitControls | null,
});

let animationFrameId: number | null = null;
const lodMeshes: THREE.LOD[] = [];

// 根据高度获取颜色
const getColorForHeight = (
    height: number,
    maxHeight: number
): THREE.Color => {
    const t = height / maxHeight;
    const hue = (1 - t) * 205;
    const saturation = 0.7;
    const lightness = 0.45 + t * 0.15;
    return new THREE.Color(
        `hsl(${hue}, ${saturation * 100}%, ${lightness * 100}%)`
    );
};

// 初始化 Three.js 场景
const initThreeScene = () => {
    const { scene, camera, renderer } = threeObjects.value;
    if (!scene || !camera || !renderer || !canvasContainer.value) return;

    // 添加环境光
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));

    // 添加平行光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    // 设置相机初始位置和参数
    camera.position.set(0, 1000, 3000);
    camera.lookAt(0, 0, 0);
    camera.near = 0.1;
    camera.far = 100000;
    camera.updateProjectionMatrix();

    // 设置渲染器大小和像素比
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    canvasContainer.value.appendChild(renderer.domElement);

    // 初始化轨道控制器
    threeObjects.value.controls = new OrbitControls(camera, renderer.domElement);
    const controls = threeObjects.value.controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    controls.minDistance = 100;
    controls.maxDistance = 100000;
    controls.maxPolarAngle = Math.PI / 2;
    controls.update();
};

// 疾病类型最大值配置
const diseaseConfig = {
    dvalue: {
        total: { max: 245, scale: 600 },
        STR: { max: 120, scale: 1200 },
        IHD: { max: 95, scale: 1400 },
        COPD: { max: 55, scale: 800 },
        LNC: { max: 30, scale: 1000 },
        LRI: { max: 12, scale: 600 }
    },
    drate: {
        total: { max: 225, scale: 450 },
        STR: { max: 105, scale: 300 },
        IHD: { max: 70, scale: 400 },
        COPD: { max: 30, scale: 400 },
        LNC: { max: 25, scale: 400 },
        LRI: { max: 12, scale: 300 }
    }
};

// 创建地形网格
const createTerrain = (data: any) => {
    const { scene } = threeObjects.value;
    if (!scene) return;

    // 清理现有网格
    const meshesToRemove = [];
    scene.traverse((child) => {
        if (child instanceof THREE.LOD) {
            child.levels.forEach(level => {
                if (level.object.geometry) {
                    level.object.geometry.dispose();
                }
                if (level.object.material) {
                    level.object.material.dispose();
                }
            });
            meshesToRemove.push(child);
        } else if (child instanceof THREE.Mesh || child instanceof THREE.InstancedMesh) {
            if (child.geometry) {
                child.geometry.dispose();
            }
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => material.dispose());
                } else {
                    child.material.dispose();
                }
            }
            meshesToRemove.push(child);
        }
    });

    // 从场景中移除所有网格
    meshesToRemove.forEach(mesh => {
        scene.remove(mesh);
    });

    // 清空 LOD 数组
    lodMeshes.length = 0;

    const { width, height, data: terrainData } = data;

    const selectedDataType = controlPanel.value?.selectedDataType;
    const selectedDiseaseType = controlPanel.value?.selectedDiseaseType || 'total';
    let maxHeight, scale;

    // 根据数据类型设置最大高度和缩放比例
    switch (selectedDataType) {
        case 'pm25':
            maxHeight = 185;
            scale = 600 / maxHeight;
            break;
        case 'ppp':
            maxHeight = 272000;
            scale = 2000 / maxHeight;
            break;
        case 'dvalue':
            const dvalueConfig = diseaseConfig.dvalue[selectedDiseaseType];
            maxHeight = dvalueConfig.max;
            scale = dvalueConfig.scale / maxHeight;
            break;
        case 'drate':
            const drateConfig = diseaseConfig.drate[selectedDiseaseType];
            maxHeight = drateConfig.max;
            scale = drateConfig.scale / maxHeight;
            break;
        default:
            maxHeight = 185;
            scale = 250 / maxHeight;
    }

    // 为人口数据和死亡人数及其细分项创建完整网格
    if (selectedDataType === 'dvalue' || selectedDataType === 'ppp') {
        const instancedGeometry = new THREE.InstancedBufferGeometry();
        const baseGeometry = new THREE.BoxGeometry(1, 1, 1);

        instancedGeometry.index = baseGeometry.index;
        instancedGeometry.attributes = baseGeometry.attributes;

        const nonZeroCount = terrainData.filter((value: number) => value > 0).length;

        const offsets = new Float32Array(nonZeroCount * 3);
        const scales = new Float32Array(nonZeroCount * 3);
        const colors = new Float32Array(nonZeroCount * 3);

        let instanceIndex = 0;
        for (let x = 0; x < width; x++) {
            for (let z = 0; z < height; z++) {
                const index = x + z * width;
                const value = terrainData[index];

                if (value > 0) {
                    const scaledHeight = value * scale;
                    offsets.set(
                        [x - width / 2, scaledHeight / 2, z - height / 2],
                        instanceIndex * 3
                    );
                    scales.set([1, scaledHeight, 1], instanceIndex * 3);
                    const color = getColorForHeight(value, maxHeight);
                    colors.set([color.r, color.g, color.b], instanceIndex * 3);
                    instanceIndex++;
                }
            }
        }

        instancedGeometry.setAttribute(
            'offset',
            new THREE.InstancedBufferAttribute(offsets, 3)
        );
        instancedGeometry.setAttribute(
            'scale',
            new THREE.InstancedBufferAttribute(scales, 3)
        );
        instancedGeometry.setAttribute(
            'color',
            new THREE.InstancedBufferAttribute(colors, 3)
        );

        const material = new THREE.ShaderMaterial({
            vertexShader: `
                attribute vec3 offset;
                attribute vec3 scale;
                attribute vec3 color;
                varying vec3 vColor;
                varying vec3 vNormal;
                void main() {
                    vColor = color;
                    vec3 pos = position * scale + offset;
                    vNormal = normalMatrix * normal;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying vec3 vNormal;
                void main() {
                    vec3 lightDirection = normalize(vec3(0.5, 0.8, 0.6));
                    float diffuse = max(dot(vNormal, lightDirection), 0.6);
                    vec3 viewDirection = normalize(-vNormal);
                    vec3 reflectDirection = reflect(-lightDirection, vNormal);
                    float specular = pow(max(dot(viewDirection, reflectDirection), 0.0), 32.0);
                    gl_FragColor = vec4(vColor * diffuse + vec3(0.5) * specular, 1.0);
                }
            `,
            side: THREE.DoubleSide,
        });

        const mesh = new THREE.InstancedMesh(
            instancedGeometry,
            material,
            instancedGeometry.attributes.offset.count
        );
        mesh.frustumCulled = false;
        scene.add(mesh);
    } else {
        // 其他数据类型（PM2.5和死亡率）使用 LOD
        const createGeometryForLOD = (detailLevel: number) => {
            const instancedGeometry = new THREE.InstancedBufferGeometry();
            const baseGeometry = new THREE.BoxGeometry(1, 1, 1);

            instancedGeometry.index = baseGeometry.index;
            instancedGeometry.attributes = baseGeometry.attributes;

            const stride = Math.pow(2, detailLevel);
            const nonZeroCount = terrainData.filter((value: number, index: number) =>
                value > 0 && index % stride === 0 && Math.floor(index / width) % stride === 0
            ).length;

            const offsets = new Float32Array(nonZeroCount * 3);
            const scales = new Float32Array(nonZeroCount * 3);
            const colors = new Float32Array(nonZeroCount * 3);

            let instanceIndex = 0;
            for (let x = 0; x < width; x += stride) {
                for (let z = 0; z < height; z += stride) {
                    const index = x + z * width;
                    const value = terrainData[index];

                    if (value > 0) {
                        const scaledHeight = value * scale;
                        offsets.set(
                            [x - width / 2, scaledHeight / 2, z - height / 2],
                            instanceIndex * 3
                        );
                        scales.set([stride, scaledHeight, stride], instanceIndex * 3);
                        const color = getColorForHeight(value, maxHeight);
                        colors.set([color.r, color.g, color.b], instanceIndex * 3);
                        instanceIndex++;
                    }
                }
            }

            instancedGeometry.setAttribute(
                'offset',
                new THREE.InstancedBufferAttribute(offsets, 3)
            );
            instancedGeometry.setAttribute(
                'scale',
                new THREE.InstancedBufferAttribute(scales, 3)
            );
            instancedGeometry.setAttribute(
                'color',
                new THREE.InstancedBufferAttribute(colors, 3)
            );

            return instancedGeometry;
        };

        const material = new THREE.ShaderMaterial({
            vertexShader: `
                attribute vec3 offset;
                attribute vec3 scale;
                attribute vec3 color;
                varying vec3 vColor;
                varying vec3 vNormal;
                void main() {
                    vColor = color;
                    vec3 pos = position * scale + offset;
                    vNormal = normalMatrix * normal;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying vec3 vNormal;
                void main() {
                    vec3 lightDirection = normalize(vec3(0.5, 0.8, 0.6));
                    float diffuse = max(dot(vNormal, lightDirection), 0.6);
                    vec3 viewDirection = normalize(-vNormal);
                    vec3 reflectDirection = reflect(-lightDirection, vNormal);
                    float specular = pow(max(dot(viewDirection, reflectDirection), 0.0), 32.0);
                    gl_FragColor = vec4(vColor * diffuse + vec3(0.5) * specular, 1.0);
                }
            `,
            side: THREE.DoubleSide,
        });

        const lod = new THREE.LOD();
        const lodDistances = [0, 800, 1500, 2500];
        for (let i = 0; i < 4; i++) {
            const geometry = createGeometryForLOD(i);
            const mesh = new THREE.InstancedMesh(
                geometry,
                material,
                geometry.attributes.offset.count
            );
            mesh.frustumCulled = false;
            lod.addLevel(mesh, lodDistances[i]);
        }

        lodMeshes.push(lod);
        scene.add(lod);
    }

    return maxHeight;
};

// 计算最大高度
const maxHeight = computed(() => {
    const selectedDataType = controlPanel.value?.selectedDataType;
    const selectedDiseaseType = controlPanel.value?.selectedDiseaseType || 'total';

    switch (selectedDataType) {
        case 'pm25':
            return 185;
        case 'ppp':
            return 272000;
        case 'dvalue':
            return diseaseConfig.dvalue[selectedDiseaseType].max;
        case 'drate':
            return diseaseConfig.drate[selectedDiseaseType].max;
        default:
            return 185;
    }
});

// 处理数据变化
const handleDataChange = (newData: any) => {
    createTerrain(newData);
};

// 动画循环
const animate = (currentTime: number) => {
    animationFrameId = requestAnimationFrame(animate);

    const { controls, renderer, scene, camera } = threeObjects.value;
    if (controls) controls.update();
    if (renderer && scene && camera) {
        // 更新LOD
        lodMeshes.forEach(lod => {
            if (lod && lod.update) {
                lod.update(camera);
            }
        });

        renderer.render(scene, camera);
    }
};

// 处理窗口大小变化
const handleResize = () => {
    const { renderer, camera } = threeObjects.value;
    if (!renderer || !camera) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
};

// 组件挂载时初始化
onMounted(() => {
    if (!canvasContainer.value) return;

    threeObjects.value = {
        scene: new THREE.Scene(),
        camera: new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            100000
        ),
        renderer: new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance'
        }),
        controls: null,
    };

    initThreeScene();
    window.addEventListener('resize', handleResize);
    animate(0);
});

// 组件卸载时清理资源
onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
    }
    const { renderer, controls } = threeObjects.value;
    if (renderer && renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    if (controls) {
        controls.dispose();
    }
});
</script>

<!-- 样式 -->
<style scoped>
.m3dviewer {
    position: relative;
    width: 100vw;
    height: 100vh;
}

.canvas-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

.legend-container {
    position: absolute;
    bottom: 20px;
    left: 20px;
    z-index: 1000;
    width: 100px;
}
</style>