# EchoCat Prettier V2.3.4 品牌与更新入口发布报告

## 本版变化

- 使用用户提供的 EchoCat LOGO，并以构建时 Data URL 方式内嵌到客户端包，安装后不依赖本地图片路径。
- 设置页顶部采用三栏布局：左侧产品说明、中间 EchoCat 品牌、右侧更新、GitHub 和关闭操作。
- 小窗口自动收拢按钮文字；极低窗口高度隐藏品牌图，优先保证设置、关闭和保存操作可用。
- 更新检查仅请求 GitHub Releases 公共 API，不附带账号、设置或聊天内容。
- 新增仓库、问题反馈、主页、关键词和 `dsh-plugin` 发现元数据。

## 不变的安全边界

- 不修改 AI 原文、提示词、模型参数、回答顺序或复制内容。
- 不在更新检查中上传本地版本之外的任何数据。
- 不引入付费接口或 API Key。
- 表情包、emoji 与长回复性能保护沿用 V2.3.3 的逻辑。

## 发布验证

- 构建后的客户端应包含内嵌 LOGO，不包含 `F:\` 等本地绝对路径。
- GitHub 按钮应指向 `https://github.com/VDERR/dsh-echocat-prettier`。
- Release 检查应指向 `https://api.github.com/repos/VDERR/dsh-echocat-prettier/releases/latest`。
- GitHub 仓库应添加 `dsh-plugin` topic，便于市场每日扫描器发现。
- DSH 插件市场最终可搜索状态取决于其下一次索引任务或人工审核，发布仓库不能绕过该外部流程。
