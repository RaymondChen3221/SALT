# 微信小程序 web-view 包壳说明

首版部署不需要小程序。SALT 当前是完整静态网页，优先部署到 CloudBase 静态网站托管即可。小程序 web-view 包壳适合后续需要从微信小程序入口访问、分享或挂载到公众号生态时再做。

## 需要准备

1. 微信小程序 AppID。
2. 已完成部署的 HTTPS 站点，例如 CloudBase 静态网站默认域名或已绑定域名。
3. 一个 CloudBase 环境，用于承载静态网站。
4. 微信公众平台后台配置 web-view 业务域名。

## 业务域名要求

小程序 `web-view` 只能打开已配置的业务域名。

通常需要：

1. 域名使用 HTTPS。
2. 域名完成微信公众平台的业务域名校验。
3. 如果使用中国大陆自定义域名，按云服务商和监管要求完成 ICP 备案。
4. 域名下能放置微信校验文件。

CloudBase 默认域名能否直接作为业务域名，以微信公众平台当时的校验结果为准。若校验受限，建议绑定自己的 HTTPS 域名。

## 基本小程序页面结构

示例目录：

```text
miniprogram/
  app.json
  pages/
    web/
      web.json
      web.wxml
      web.js
```

`app.json`：

```json
{
  "pages": [
    "pages/web/web"
  ],
  "window": {
    "navigationBarTitleText": "SALT 关系倾向测试"
  }
}
```

`pages/web/web.wxml`：

```xml
<web-view src="{{url}}" />
```

`pages/web/web.js`：

```js
Page({
  data: {
    url: "https://你的已部署域名/"
  }
});
```

## 限制

`web-view` 包壳不是把网页代码改成原生小程序。它只是让小程序页面打开 HTTPS 网页，因此：

- 网页仍然需要先部署到可访问的 HTTPS 域名。
- 业务域名必须在微信公众平台配置通过。
- 网页内的下载、复制、分享能力会受到微信 web-view 环境限制。
- 本地 `file://` 不适用于小程序 web-view。
- 如果后续要做原生小程序体验，需要单独重写页面和交互。

## 为什么首版不需要它

当前 SALT 没有后端、没有登录、没有支付，也不依赖微信能力。直接部署 CloudBase 静态网站更快、更稳定，也更容易先验证页面、题库、结果图、答案码和立绘加载。

建议顺序：

1. 先部署 `release/salt-static/` 到 CloudBase 静态网站。
2. 用 HTTPS URL 在手机微信里直接打开测试。
3. 确认功能稳定后，再决定是否做小程序 web-view 包壳。
