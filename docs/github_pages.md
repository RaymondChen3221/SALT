# GitHub Pages 发布说明

本项目是纯静态应用，可以本地双击 `index.html` 运行，也可以部署到 GitHub Pages。

## 发布步骤

1. 创建 GitHub 仓库。
2. 把项目推送到 `main` 分支。
3. 在 GitHub 仓库 Settings → Pages 中选择 GitHub Actions。
4. 推送后 workflow 会生成干净的 `_site` 目录并发布。
5. 打开部署后的 HTTPS 地址。
6. 可以把 HTTPS 链接发到微信。原生分享能力在 HTTPS 下最好，`file://` 下通常只能复制文案。

## 发布范围

workflow 只复制运行时静态文件：

- `index.html`
- `styles.css`
- `app.js`
- `questions.js`
- `data/`
- `assets/`
- `img/`
- `docs/scoring.md`
- `.nojekyll`

不会发布：

- `REF.xlsx`
- `~$REF.xlsx`
- `tools/`
- `outputs/`
- 其他本地工作文件或私有笔记

## 本地运行

本地不需要 GitHub Pages，也不需要构建。直接双击 `index.html` 即可。核心数据通过 `.js` 桥接文件挂到 `window`，不依赖 `fetch()`，所以 `file://` 可以正常运行。
