# Lab System Frontend

基于 React、TypeScript 和 Vite 的实验室管理系统前端。

## 启动

```bash
npm install
cp .env.example .env.local
npm run dev
```

开发服务器会默认将 `/api` 和 `/ws` 代理到后端 Web 服务
`http://localhost:8989`。如果后端运行在其他地址，可通过
`VITE_API_PROXY_TARGET` 覆盖。

## Docker 部署

运行时由 OpenResty 同时提供静态页面，并将 `/api`、`/ws` 反向代理到
宿主机的后端 Web 服务 `8989` 端口。浏览器只访问一个入口，因此 HTTP API、
WebSocket 与前端页面保持同源。

```bash
docker compose up --build -d
```

默认访问地址为 `http://localhost:5678`，可通过 `FRONTEND_PORT` 修改宿主机端口：

```bash
FRONTEND_PORT=80 docker compose up --build -d
```

`Dockerfile` 使用两个阶段：Node.js 构建阶段执行 `npm ci` 和
`npm run build`；最终 OpenResty 镜像只接收 `dist` 产物及运行所需的
OpenResty 配置，不包含源码、Node.js、npm 或构建依赖。

## Jenkins 构建

Jenkins 任务支持通过 **Build with Parameters** 直接选择代码来源：

- `GIT_BRANCH`：需要拉取并构建的远程分支，默认为 `main`。
- `GITHUB_SHA`：可选的精确提交 SHA；填写后优先于 `GIT_BRANCH`。

手动按分支构建不依赖 GitHub Release。仓库中的 Release workflow 只是一个
可选的自动触发入口，发布 Release 时会传入 `GITHUB_SHA` 来构建对应提交。

## 目录约定

```text
src/
├── app/                 # 应用装配：路由、布局、全局 Provider
├── modules/             # 按业务域拆分的功能模块
│   └── <module>/
│       ├── api/         # 模块接口
│       ├── components/  # 模块组件
│       ├── hooks/       # 模块 Hooks
│       ├── pages/       # 路由页面
│       ├── store/       # 模块状态
│       └── types/       # 模块类型
└── shared/              # 跨模块复用的组件、API、工具和样式
```

新业务优先放在独立的 `modules/<业务名>` 下；只有确实跨模块复用的内容才进入 `shared`。
