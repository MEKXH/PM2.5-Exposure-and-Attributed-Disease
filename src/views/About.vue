<template>
    <div class="about">
        <p>呼吸正义五战士</p>
    </div>
</template>

<style scoped>
.about {
    color: azure;
    padding-top: 80px;
    animation: slide-up 0.5s ease;
    background-color: #000000;
}

p {
    font-size: 4rem;
    text-align: center;
    line-height: 3;

}

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
</style>