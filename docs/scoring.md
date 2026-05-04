# SALT v4 计分说明

## 答案分值

- 非常不同意：`-2`
- 不同意：`-1`
- 不确定 / 看情况：`0`
- 同意：`+1`
- 非常同意：`+2`

## 题目方向

每道主表题都有 `direction`：

```js
scoredValue = rawAnswer * direction
```

`direction: 1` 是正向题，`direction: -1` 是反向题。T 双向性也使用反向处理后的 `scoredValue`，不使用原始答案。

## Main SALT

主表共 36 题：

- S / Specialness / 特殊性：Self 6 题，Other 6 题
- A / Action / 兑现力：Self 6 题，Other 6 题
- L / Long-range / 长程性：Self 6 题，Other 6 题

```js
SelfS = sum(scored S self items) / 12 * 100
OtherS = sum(scored S other items) / 12 * 100
SelfA = sum(scored A self items) / 12 * 100
OtherA = sum(scored A other items) / 12 * 100
SelfL = sum(scored L self items) / 12 * 100
OtherL = sum(scored L other items) / 12 * 100

S = (SelfS + OtherS) / 2
A = (SelfA + OtherA) / 2
L = (SelfL + OtherL) / 2
```

综合 SALT 使用平均后的 `S / A / L` 与同一个 `T_score`。

## Self-SALT

Self-SALT 表示“你自己在关系里怎么依恋 / 怎么给出关系”。

```js
SelfCode = [
  SelfS >= 0 ? "S+" : "S-",
  SelfA >= 0 ? "A+" : "A-",
  SelfL >= 0 ? "L+" : "L-",
  T_score >= 40 ? "T+" : "T-"
].join("")
```

## Partner-SALT

Partner-SALT 表示“你希望伴侣如何依恋 / 如何对待自己”。

```js
PartnerCode = [
  OtherS >= 0 ? "S+" : "S-",
  OtherA >= 0 ? "A+" : "A-",
  OtherL >= 0 ? "L+" : "L-",
  T_score >= 40 ? "T+" : "T-"
].join("")
```

Partner-SALT 使用 Other 侧分数，但 T 仍然来自 Self/Other 的整体差值。

## T_score 与 T_direction

T 不由独立题目计分，而是从 18 组 Self/Other 配对题的差值推导。每组使用反向处理后的分值：

```js
gap = otherScoredValue - selfScoredValue
```

18 组最大绝对差值总和为 `72`。

```js
T_score = 100 - 200 * (sum(abs(gap)) / 72)
T_direction = sum(gap) / 72 * 100
```

解释：

- `T_score` 接近 `+100`：高度对称
- `T_score` 接近 `0`：可见不对称
- `T_score` 低于 `0`：强烈不对称
- `T_direction > 0`：偏期待对方更多
- `T_direction < 0`：偏自我消音 / 给得更多
- `T_direction` 接近 `0`：相对平衡，或不同维度差异彼此抵消

## Support Preference

支持偏好共 8 题，只用于副分析，不影响 16 种 SALT 主类型。

```js
Practical = sum(practical raw answers) / 4 * 100
Emotional = sum(emotional raw answers) / 4 * 100
Creative = sum(creative raw answers) / 4 * 100
Presence = sum(presence raw answers) / 4 * 100
```

## Answer Code

结果页会显示“答案码”，它编码本次 44 个具体答案、完成时间、综合 SALT、Self-SALT、Partner-SALT 和核心分数。

- `SALT1A.`：浏览器支持 `crypto.subtle` 且处于安全上下文时，使用 AES-GCM 和本地静态 key 加密。
- `SALT1X.`：Web Crypto 不可用时，使用 XOR-stream 加校验和做本地可逆混淆。

`SALT1X` 是混淆，不是强密码学隐私。答案码可以在页面内“解析答案码”面板恢复为本地 payload。
