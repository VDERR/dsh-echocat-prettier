<p align="center">
  <img src="assets/echocat-logo.png" width="144" alt="EchoCat LOGO">
</p>

<h1 align="center">EchoCat Prettier</h1>

<p align="center">让 DSH 的 AI 回复拥有更清楚的结构、更丰富的视觉层次和更自然的互动感。</p>

<p align="center">
  <a href="https://github.com/VDERR/dsh-echocat-prettier/releases/latest">下载最新版</a> ·
  <a href="https://github.com/VDERR/dsh-echocat-prettier/issues">反馈问题</a> ·
  <a href="LICENSE">MIT License</a>
</p>

## 功能

- 15 套独立视觉风格，每套分别保存主色、辅助色和强调色。
- 9 套排版 DIY：跟随风格、杂志封面、垂直时间轴、左右分屏、阶梯卡片、海报舞台、数据控制台、对话剧本、自由拼贴。
- Unicode emoji、章节导航、免费网络表情包和可选公开图片。
- 表情包按当前回复的明确主题匹配；严肃或疑似隐私内容自动跳过。
- 单条回复可设置 1—4 张表情包、2—8 个 emoji 装饰。
- 长回复自动进入性能保护，暂停持续动画、复杂毛玻璃和跨栏排版，避免闪烁、卡顿或内容裁切。
- 设置页内置 EchoCat 品牌标识、GitHub 仓库入口和版本检查。

## 准确性保护

插件只处理浏览器展示层，不修改 AI 提示词、模型参数、回答文字、节点顺序或复制内容。默认 `guideMarkdown=false`、`autoImages=false`、`naturalEmoji=false`。

网络表情包只发送“表情包＋短主题＋情绪”，不会发送完整回答。当前实现不需要 API Key，也没有接入付费接口；网络失败时保持纯文字回答。

## 安装

从 GitHub 安装当前源码构建：

```bash
dsh plugin --profile web add github:VDERR/dsh-echocat-prettier
```

也可以从 [Releases](https://github.com/VDERR/dsh-echocat-prettier/releases/latest) 下载 ZIP，解压后按 [安装、卸载与验收说明](docs/20260924_GPT安装卸载与验收说明_V2.3.4.md) 操作。安装或升级后需要重启 DSH Desktop。

## 更新

打开左侧边栏的“回复美化”，在设置页右上角点击“检查更新”。插件会读取 GitHub 最新 Release；如果 GitHub API 暂时不可用，按钮会改为打开 Releases 页面。

## 开发与测试

要求 Node.js 22 或更新版本。

```bash
npm ci
npm run check
npm run test:final
npm run test:long
npm run package:final
```

服务端入口为 `lib/index.js`，客户端入口为 `lib/client.js`，DSH/Cordis 清单为 `cordis.patch.yml`。仓库提交构建后的 `lib/`，便于 DSH 从 GitHub 直接安装。

## 兼容性

当前版本：**0.23.4 / V2.3.4**。自动测试和浏览器宿主夹具均已通过；不同 DSH Desktop 版本仍可能因宿主 DOM 或插件 API 变化出现兼容性差异，请在实际环境中验收。

## 第三方与隐私

第三方组件与数据源说明见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。插件没有遥测、账号系统或付费接口，设置仅保存在本机。
