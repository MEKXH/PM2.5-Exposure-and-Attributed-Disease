<!-- 首页 -->
<template>
    <div class="home">
        <section class="hero">
            <div class="hero-content">
                <p class="subtitle">{{ heroSubtitle }}</p>
                <h2>{{ heroTitle }}</h2>
                <p class="description">{{ heroDescription }}</p>
                <div class="button-group">
                    <button class="product-btn" @click="navigateTo2D">2D产品</button>
                    <button class="product-btn" @click="navigateTo3D">3D产品</button>
                </div>
            </div>
            <div class="hero-image">
                <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=1352&q=80"
                    alt="Earth" />
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const heroTitle = ref('PM2.5 暴露及造成疾病负担')
const heroSubtitle = ref('PM2.5 Exposure and Attributed Disease')
const heroDescription = ref('本平台提供了PM2.5污染暴露及其造成的疾病负担的多维度数据可视化，用户可以通过交互式图表和地图，了解不同区域人群在PM2.5暴露和相关健康负担方面的差异。')

const navigateTo2D = () => {
    router.push('/data-map-2d')
}

const navigateTo3D = () => {
    router.push('/m3dviewer')
}
</script>

<!-- 样式 -->
<style scoped>
@keyframes slide-up {
    from {
        transform: translateY(20px);
        opacity: 0;
    }

    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.hero {
    flex: 1;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding: 2.5rem;
    background-color: #0D0D0D;
    color: white;
    min-height: calc(100vh - 80px);
}

.hero-content {
    flex: 1;
    max-width: 600px;
    margin-left: 8rem;
    margin-top: 12rem;
}

h2 {
    font-size: clamp(2rem, 5vw, 3rem);
    margin-top: 1rem;
    margin-bottom: 0.5rem;
    font-weight: 600;
    line-height: 1.2;
}

.subtitle {
    font-family: "等线", DengXian, sans-serif;
    font-size: 16pt;
    font-weight: bold;
    margin-top: 10px;
    color: #00E4BC;
    text-align-last: justify;
    width: 100%;
    letter-spacing: 5px;
}

.description {
    font-family: "等线", DengXian, sans-serif;
    font-size: 15pt;
    margin-top: 2rem;
    margin-bottom: 3rem;
    /* margin-right: 1pt; */
    text-justify: auto;
    line-height: 1.5;
}

.button-group {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
}

.product-btn {
    font-family: "等线", DengXian, sans-serif;
    padding: 0.7rem 3rem;
    font-size: 14pt;
    background-color: black;
    border: 2px solid transparent;
    border-color: #00E4BC;
    border-radius: 20px;
    color: rgb(255, 255, 255);
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: bold;
}

.product-btn:hover {
    background-color: #00E4BC;
    transform: translateY(-2px);
    color: rgb(0, 0, 0);
}

.hero-image {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    max-width: 50%;
    margin-right: 5rem;
}

.hero-image img {
    max-width: 100%;
    max-height: 60vh;
    object-fit: cover;
    border-radius: 10px;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    box-shadow: 0 0 20px rgba(0, 140, 255, 0.726);
}

.hero-image:hover img {
    transform: scale(1.02);
}

@media (max-width: 768px) {
    .hero {
        flex-direction: column;
        padding: 2rem 1rem;
    }

    .hero-content,
    .hero-image {
        max-width: 100%;
    }

    .hero-image img {
        max-height: 40vh;
    }

    .button-group {
        flex-direction: column;
    }

    .product-btn {
        width: 100%;
    }
}
</style>