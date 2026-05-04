# SALT 关系倾向测试

纯本地静态网页应用。直接双击 `index.html` 即可运行，不需要后端、构建工具、CDN、在线字体或 API。

## 文件结构

- `index.html`：应用入口。
- `styles.css`：视觉样式与响应式布局。
- `questions.js`：SALT v4 的 36 道主表题和 8 道支持偏好题。
- `app.js`：答题流程、计分、结果展示、答案码、复制、分享、保存结果图。
- `data/result_types.json`：短结果、类型名、REF 角色映射和角色候选。
- `data/result_types.js`：本地 `file://` 运行用 JS 桥接数据。
- `data/result_profiles.json`：长篇结果文案，包括综合画像、Self-SALT、Partner-SALT、关系差值和支持偏好叠加。
- `data/result_profiles.js`：本地 `file://` 运行用 JS 桥接数据。
- `data/support_profiles.json`：支持偏好副表分析，不影响 SALT 类型码。
- `data/support_profiles.js`：本地 `file://` 运行用 JS 桥接数据。
- `data/role_images.json` / `data/role_images.js`：角色名到 `img/` 图片的映射。
- `assets/art_manifest.json` / `assets/art_manifest.js`：美术资源槽位。
- `docs/scoring.md`：Main SALT、Self-SALT、Partner-SALT、T 和答案码说明。
- `docs/question_design.md`：v4 题目配对与反向题设计说明。
- `docs/github_pages.md`：GitHub Pages 发布说明。
- `tools/parse_ref_xlsx.py`：解析 `REF.xlsx` 的工具，不会修改 Excel。
- `outputs/ref_parse_report.md`：REF 解析报告。

## 本地运行

在文件管理器中打开项目根目录，双击 `index.html`。

浏览器会把当前答案暂存在 `localStorage`。页面里的“重新开始”会清空当前测试状态。

## v4 结果层

结果页会显示三层结果：

- 综合 SALT：使用 Self / Other 平均后的 S、A、L，加上 T_score。
- 你怎么依恋：Self-SALT，使用 SelfS / SelfA / SelfL，加上同一个 T 状态。
- 你希望伴侣怎么依恋：Partner-SALT，使用 OtherS / OtherA / OtherL，加上同一个 T 状态。

支持偏好只作为副分析显示，不影响 16 种 SALT 类型。

## 更新题目

编辑 `questions.js`。每题必须保留：

```js
{
  id,
  section,
  axis or support,
  perspective,
  pair,
  direction,
  text
}
```

主表题使用 `direction` 做正向 / 反向计分。支持偏好题使用原始答案计分，不参与主类型判断。

## 更新 REF / 类型映射

不要覆盖 `REF.xlsx`。更新 Excel 后运行：

```powershell
python .\tools\parse_ref_xlsx.py
```

脚本会更新：

- `data/result_types.json`
- `data/result_types.js`
- `outputs/ref_parse_report.md`

v4 支持这些字段：`code`、`title`、`description`、`character_name`、`character_source`、`character_note`、`art_key`、`role_candidates`。

## 更新结果文案

编辑 `data/result_profiles.json`，然后同步更新 `data/result_profiles.js`。核心字段：

- `main_profile`
- `self_attachment`
- `partner_expectation`
- `relationship_gap`
- `support_overlay_hint`
- `share_text`

`result_types.json` 用于短结果和角色映射；`result_profiles.json` 用于长篇分析；`support_profiles.json` 用于支持偏好副分析。

## 添加角色 / 类型插画

角色立绘放入 `img/`，再更新：

- `data/role_images.json`
- `data/role_images.js`

类型插画可写入：

- `assets/art_manifest.json`
- `assets/art_manifest.js`

示例：

```json
{
  "type_illustrations": {
    "S+A+L+T+": "assets/types/S+A+L+T+.png"
  }
}
```

如果指定图片缺失，页面会使用角色图、默认结果图、头像槽位或 CSS 渐变占位，不会中断测试。

## 答案码

结果页会显示答案码，并写入复制文案和保存的结果图。答案码编码 44 个具体选项、完成时间、综合 SALT、Self-SALT、Partner-SALT 和核心分数。

- `SALT1A.`：可用 Web Crypto 时使用 AES-GCM。
- `SALT1X.`：不可用时使用本地可逆混淆和校验和。

`SALT1X` 不是强隐私加密。页面内有“解析答案码”面板，可本地恢复 payload。

## Deploy to GitHub Pages

1. 创建 GitHub 仓库。
2. 推送项目到 `main` 分支。
3. 在仓库 Settings → Pages 中选择 GitHub Actions。
4. workflow 会发布干净的 `_site`。
5. 打开部署后的 HTTPS URL。
6. 可以把链接发到微信。
7. 原生分享在 HTTPS 下效果最好，`file://` 下通常会回退到复制文案。

发布配置见 `docs/github_pages.md` 和 `.github/workflows/pages.yml`。
