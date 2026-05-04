# CloudBase 部署说明

本文档用于把 `release/salt-static/` 部署到腾讯云 CloudBase 静态网站托管。

## 生产静态目录

生产静态输出目录是：

```text
release/salt-static/
```

部署根目录必须直接包含这些文件和目录：

```text
index.html
app.js
styles.css
questions.js
data/
img/
assets/
```

不要把整个项目根目录上传，也不要上传 `release/` 的父级目录。

## 方式一：CloudBase Console 上传

1. 登录腾讯云 CloudBase 控制台。
2. 进入目标环境。
3. 打开“静态网站托管”。
4. 选择上传文件夹或上传文件。
5. 上传 `release/salt-static/` 目录内的内容。
6. 确认静态网站根目录直接能看到 `index.html`、`app.js`、`styles.css`、`data/`、`img/`、`assets/`。
7. 等待上传完成，打开 CloudBase 分配的默认域名。

如果控制台要求 ZIP 上传，请使用：

```text
release/salt-static.zip
```

这个 ZIP 的 archive root 已经直接包含站点文件，不应该再多一层 `salt-static/`。

## 方式二：tcb CLI 部署

先安装 CloudBase CLI：

```powershell
npm i -g @cloudbase/cli
```

登录：

```powershell
tcb login
```

部署：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/deploy-cloudbase.ps1 <你的环境ID>
```

示例：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/deploy-cloudbase.ps1 my-env-id
```

脚本会从 `release/salt-static/` 目录执行：

```powershell
tcb hosting deploy . -e <环境ID>
```

这样云端静态网站根目录会直接得到站点文件。

## 部署后测试

用 CloudBase 默认域名或已绑定域名测试这些路径：

```text
/
/index.html
/app.js
/styles.css
/questions.js
/data/role_images.js
/data/result_types.js
/assets/art_manifest.js
/img/W.png
```

页面功能测试：

1. 打开首页，确认标题页正常显示。
2. 点击开始测试，确认题目能出现。
3. 完成测试，确认结果页能显示。
4. 确认角色立绘能加载。
5. 确认答案码能生成。
6. 点击保存结果图，确认能导出图片。

浏览器开发者工具 Network 面板应显示这些资源从同一个 CloudBase 域名加载，不应出现外部 CDN、API 或远程字体请求。

## 不要上传

不要上传这些内容：

```text
REF.xlsx
~$REF.xlsx
.git/
.github/
tools/
outputs/
docs/
scripts/
release/ 的父级项目内容
私人笔记或原始数据
```

`data/result_types.json` 和 `data/result_types.js` 是运行时映射文件，可以上传；它们不是原始 `REF.xlsx`。
