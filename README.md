# 使用说明（本存储库代码中不包含数据）

## 1. 项目概述

本PM2.5 暴露及造成疾病负担数据可视化平台使用web前端技术构建，技术栈：
Vue3、TypeScript、VueRouter、Leaflet.js、Three.js、Echarts、Turrf.js。

## 2. 环境准备

- **Node.js**：v20.11.1或更高版本。
- **npm** ：项目依赖管理工具。

## 3. 安装依赖

在项目根目录下运行以下命令来安装项目依赖：

```bash
npm install
```

## 4. 启动开发服务器

安装完依赖后，通过以下命令启动开发服务器：

```bash
npm run dev
```

启动后，访问终端输出的地址，默认： `http://localhost:5173`，即可在浏览器中使用本平台（本存储库代码中不包含数据）。

## 5. 项目结构

```
PM2.5 Exposure and Attributed Disease/
├── node_modules/       # 项目依赖包
├── public/             # 资源文件夹
├── src/                # 源代码文件夹
│   ├── assets/         # 全局样式文件等
│   ├── components/     # 组件
│   ├── views/     # 页面组件
│   ├── router/     # 路由
│   ├── utils/     # 2D页面地图颜色配置
│   ├── App.vue         # 主应用组件
│   ├── main.ts         # 入口文件
├── index.html          # 入口 HTML 文件
├── package.json        # 项目配置及依赖文件
├── vite.config.js      # Vite 配置文件
└── README.md           # 项目说明文档
```

## 6. 常见问题

- **依赖安装失败**：请确保网络连接正常，或者尝试使用国内的 npm 镜像源。
