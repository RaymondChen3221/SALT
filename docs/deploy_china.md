# SALT 中国大陆友好静态部署说明

SALT 是纯静态页面，发布目录只需要上传 `release/salt-static/` 里的运行时文件。不需要后端、数据库、API、CDN 或构建步骤。

## 腾讯云 CloudBase 静态网站托管

1. 登录腾讯云控制台，进入 CloudBase。
2. 创建环境，选择静态网站托管。
3. 进入静态网站托管，点击上传文件。
4. 上传 `release/salt-static/` 目录内的所有内容，而不是上传整个项目根目录。
5. 确认根目录存在 `index.html`。
6. 等待部署完成，打开 CloudBase 提供的默认访问域名。
7. 测试流程：打开页面，完成测试，确认结果页、立绘、保存结果图和答案码都正常。

## 阿里云 OSS 静态网站

1. 登录阿里云控制台，创建 OSS Bucket。
2. Bucket 读写权限建议使用公共读，写入权限保持私有。
3. 上传 `release/salt-static/` 目录内的所有内容到 Bucket 根目录。
4. 进入 Bucket 的基础设置，开启静态页面。
5. 默认首页设置为 `index.html`。
6. 如需错误页，可同样设置为 `index.html`，或留空。
7. 使用 OSS 提供的静态网站 Endpoint 访问。
8. 测试流程：打开页面，完成测试，确认结果页、立绘、保存结果图和答案码都正常。

## ICP 备案提醒

如果只使用 CloudBase 或 OSS 提供的默认域名，通常可以先用于测试访问。

如果绑定中国大陆自定义域名，并且服务实际部署在中国大陆节点，通常需要完成 ICP 备案。备案要求会随服务商、域名主体和部署区域变化，正式上线前请以腾讯云或阿里云控制台的当前提示为准。

## 不要上传的文件

发布时不要上传这些内容：

- `REF.xlsx`
- `~$REF.xlsx`
- `.git/`
- `.github/`
- `tools/`
- `outputs/`
- `docs/`
- `release/` 的父级项目内容
- 私人笔记、原始表格、未整理数据

## 应上传的运行时文件

当前发布包需要包含：

- `index.html`
- `styles.css`
- `app.js`
- `questions.js`
- `data/`
- `assets/`
- `img/`

其中 `img/` 是角色立绘目录，`data/role_images.js` 会直接引用这些图片路径。
