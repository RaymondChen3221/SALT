# REF.xlsx parse report

- Generated: 2026-05-03T22:57:01
- Source: `C:\Users\mengc\Documents\Claude\Projects\SALT\REF.xlsx`
- SHA256: `378c742c376c095882188e5afe7131d4ed6487be57e7d2c6d5193fe44a4f23dd`
- Parser: `stdlib-xlsx`
- Parsed SALT rows: 18
- Missing codes filled from defaults: 0

## Parser notes

- openpyxl is unavailable; used the standard-library XLSX reader.

## Sheets inspected

- `Sheet1`: 22 non-empty rows; header row 2
  - Headers: `SALT`, `类型名`, `类型描述`, `角色候选/你可修改`, `她可能喜欢的原因`, `你觉得准吗`, `备注`
  - Columns used: code=`SALT`, title=`类型名`, description=`类型描述`, roles=`角色候选/你可修改`, why=`她可能喜欢的原因`, accuracy=`你觉得准吗`, notes=`备注`

## Parsed type rows

- `S+A+L+T+` 誓约同行型 from `Sheet1` row 3; roles: 龚常胜 / 牧濑红莉栖
- `S+A+L+T-` 宿命执念型 from `Sheet1` row 4; roles: 三角初华
- `S+A+L-T+` 热烈护主型 from `Sheet1` row 5; roles: 千早爱音
- `S+A+L-T-` 占有冲锋型 from `Sheet1` row 6; roles: W
- `S+A-L+T+` 沉默守候型 from `Sheet1` row 7; roles: 高松灯
- `S+A-L+T-` 破碎宿命型 from `Sheet1` row 8; roles: 若叶睦 /幽灵鲨
- `S+A-L-T+` 别扭撒娇型 from `Sheet1` row 9; roles: 杏山和纱 / 印飞星
- `S+A-L-T-` 逃跑猫猫型 from `Sheet1` row 10; roles: 要乐奈
- `S-A+L+T+` 稳定同行型 from `Sheet1` row 11; roles: 德克萨斯
- `S-A+L+T-` 孤独执行者型 from `Sheet1` row 12; roles: 凯尔希
- `S-A+L-T+` 轻松搭子型 from `Sheet1` row 13; roles: 能天使
- `S-A+L-T-` 随缘行动型 from `Sheet1` row 14; roles: 安和昴
- `S-A-L+T+` 旧人同路型 from `Sheet1` row 15; roles: 椎名真由理
- `S-A-L+T-` 远方投射型 from `Sheet1` row 16; roles: 河原木桃香
- `S-A-L-T+` 舒服同好型 from `Sheet1` row 17; roles: 古关忧/平泽唯
- `S-A-L-T-` 断线自由型 from `Sheet1` row 18; roles: 徐敏敏
- `S+A-L+T-` S+A-L+T- from `Sheet1` row 21; roles: 若叶睦 / 丰川祥子 / 三角初华部分面向
- `S+A-L-T-` S+A-L-T- from `Sheet1` row 22; roles: 要乐奈 / 星野懒散面

## Ambiguity review

- The workbook may contain prose rows before the table; only the row with a `SALT` header was used as the main header.
- The app uses `SALT` as the key, `类型名` as title, `类型描述` as description, and `角色候选/你可修改` as role candidates.
- Other parsed columns are preserved in `raw`, `why`, `accuracy`, and `notes` fields in `data/result_types.json`.
- Duplicate SALT rows after the canonical table are preserved in `duplicate_rows`; the first mapping-table row is used by the app.
- All 16 SALT codes were parsed from REF.xlsx.
