# Lab System Frontend

基于 React、TypeScript 和 Vite 的实验室管理系统前端。

## 启动

```bash
npm install
cp .env.example .env.local
npm run dev
```

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
