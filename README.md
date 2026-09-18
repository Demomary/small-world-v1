# 《小小世界》V1.0

这是《小小世界》第一阶段的本地开发基线工程：TypeScript + Vite + PixiJS，包含世界状态、角色移动、基础交互、植物成长、动物、知识问答、小游戏、实验、持久化和家长空间原型。

## 先看这里

完整交接说明：

- `DEV_HANDOFF.md`
- `docs/01-设计方案-V1.0.md`
- `docs/02-当前进度与未完成项.md`
- `docs/03-本地开发交接.md`
- `docs/04-架构规范.md`

## Windows 运行

第一次：

1. 解压 ZIP。
2. 双击 **一键安装.bat**。
3. 安装完成后双击 **启动游戏.bat**。

英文脚本也保留：

```text
install.bat
start.bat
build.bat
test.bat
```

## 命令行

```bash
npm install
npm run dev
npm run build
npm test
npm run preview
```

## 当前核心体验

```text
进入家
 ↓
探索
 ↓
拾取种子
 ↓
种下
 ↓
拿水壶
 ↓
浇水
 ↓
植物成长
 ↓
问问题
 ↓
游戏 / 实验
 ↓
去公园 / 森林
 ↓
回来继续观察
```

## 当前版本的性质

这是**可继续本地开发的体验原型**，不是最终产品。前期设计中已经确定的部分架构尚未全部抽象成独立模块，具体差距见：

`docs/02-当前进度与未完成项.md`

## 重要

当前环境无法完成 npm 外部依赖下载，因此这里没有虚报“最终浏览器 build/test 已通过”。在本地执行 `npm install` 后，再运行：

```bash
npm run build
npm test
```
