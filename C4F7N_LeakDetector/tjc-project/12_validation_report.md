# C4F7N TJC 工程 · 自动验证报告

> 生成时间：2026-08-24 16:32:19 ｜ 设备：X5-070 系列（7.0寸） ｜ 分辨率：1024x600 ｜ 页面：4 ｜ 控件：118

**结果：ERROR 0 ｜ WARN 32 ｜ 自动修复轮次：1**


## 1. 检查清单（§23）

| 检查项 | 结果 |
| -- | -- |
| 设备型号 | X5-070 系列 7.0寸 |
| 分辨率 | 1024x600 |
| 页面数量 | 4 |
| 页面ID唯一 | PASS |
| 控件ID唯一 | PASS |
| 控件名称唯一 | PASS |
| 无越界 | PASS |
| 无意外重叠 | PASS |
| 脚本引用有效 | PASS |
| 页面跳转有效 | PASS |
| 变量绑定完整 | PASS |
| 字符集(非GB2312) | PASS |
| 触摸尺寸建议 | WARN |


## 2. ERROR 明细

- 无 ERROR，几何与引用校验全部通过 ✅

## 3. WARN 明细（不影响编译，需人工判断）

- **[TOUCH_SIZE]** p0_main / p0_reset：触摸目标 140x30 < 建议 80x44
- **[TOUCH_SIZE]** p1_settings / p1_hi_minus：触摸目标 44x44 < 建议 80x44
- **[TOUCH_SIZE]** p1_settings / p1_hi_plus：触摸目标 44x44 < 建议 80x44
- **[TOUCH_SIZE]** p1_settings / p1_lo_minus：触摸目标 44x44 < 建议 80x44
- **[TOUCH_SIZE]** p1_settings / p1_lo_plus：触摸目标 44x44 < 建议 80x44
- **[TOUCH_SIZE]** p1_settings / p1_unit_btn：触摸目标 140x40 < 建议 80x44
- **[TOUCH_SIZE]** p1_settings / p1_buz_btn：触摸目标 140x40 < 建议 80x44
- **[TOUCH_SIZE]** p1_settings / p1_dim：触摸目标 200x30 < 建议 80x44
- **[TOUCH_SIZE]** p2_curve / p2_r10：触摸目标 92x32 < 建议 80x44
- **[TOUCH_SIZE]** p2_curve / p2_r1h：触摸目标 92x32 < 建议 80x44
- **[TOUCH_SIZE]** p2_curve / p2_r24h：触摸目标 92x32 < 建议 80x44
- **[GLYPH_CONFIRM]** p0_main / p0_chip_probe：字符 '●'(U+25CF) 在 GB2312 符号区，建议真机确认
- **[GLYPH_CONFIRM]** p0_main / p0_chip_pump：字符 '●'(U+25CF) 在 GB2312 符号区，建议真机确认
- **[GLYPH_CONFIRM]** p0_main / p0_gas：字符 '·'(U+00B7) 在 GB2312 符号区，建议真机确认
- **[GLYPH_CONFIRM]** p0_main / p0_peaklab：字符 '·'(U+00B7) 在 GB2312 符号区，建议真机确认
- **[GLYPH_CONFIRM]** p0_main / p0_temp：字符 '℃'(U+2103) 在 GB2312 符号区，建议真机确认
- **[GLYPH_CONFIRM]** p1_settings / p1_unit_desc：字符 '·'(U+00B7) 在 GB2312 符号区，建议真机确认
- **[GLYPH_CONFIRM]** p1_settings / p1_chip_probe：字符 '●'(U+25CF) 在 GB2312 符号区，建议真机确认
- **[GLYPH_CONFIRM]** p1_settings / p1_chip_pump：字符 '●'(U+25CF) 在 GB2312 符号区，建议真机确认
- **[GLYPH_CONFIRM]** p2_curve / p2_leg：字符 '—'(U+2014) 在 GB2312 符号区，建议真机确认
- **[GLYPH_CONFIRM]** p2_curve / p2_chip_probe：字符 '●'(U+25CF) 在 GB2312 符号区，建议真机确认
- **[GLYPH_CONFIRM]** p2_curve / p2_chip_pump：字符 '●'(U+25CF) 在 GB2312 符号区，建议真机确认
- **[GLYPH_CONFIRM]** p3_about / p3_lcd：字符 '×'(U+00D7) 在 GB2312 符号区，建议真机确认
- **[GLYPH_CONFIRM]** p3_about / p3_probe_st：字符 '·'(U+00B7) 在 GB2312 符号区，建议真机确认
- **[GLYPH_CONFIRM]** p3_about / p3_probe_sub：字符 '·'(U+00B7) 在 GB2312 符号区，建议真机确认
- **[GLYPH_CONFIRM]** p3_about / p3_probe_sub：字符 '℃'(U+2103) 在 GB2312 符号区，建议真机确认
- **[GLYPH_CONFIRM]** p3_about / p3_t90：字符 '≤'(U+2264) 在 GB2312 符号区，建议真机确认
- **[GLYPH_CONFIRM]** p3_about / p3_bat：字符 '×'(U+00D7) 在 GB2312 符号区，建议真机确认
- **[GLYPH_CONFIRM]** p3_about / p3_bat：字符 '·'(U+00B7) 在 GB2312 符号区，建议真机确认
- **[GLYPH_CONFIRM]** p3_about / p3_note：字符 '·'(U+00B7) 在 GB2312 符号区，建议真机确认
- **[GLYPH_CONFIRM]** p3_about / p3_chip_probe：字符 '●'(U+25CF) 在 GB2312 符号区，建议真机确认
- **[GLYPH_CONFIRM]** p3_about / p3_chip_pump：字符 '●'(U+25CF) 在 GB2312 符号区，建议真机确认

## 4. 设计偏差与自动修复记录

| # | 项 | 原稿 | 本工程 | 原因 |
| -- | -- | -- | -- | -- |
| 1 | p0_reset 文字 | `↺ 重置峰值` | `重置峰值` | ↺(U+21BA) 不在 GB2312，会显示方块 |
| 2 | p1_panel_thr 宽度 | w=480 (24..504) | w=496 (24..520) | 原稿 hi_plus 右缘 520 超出面板，已扩宽 |
| 3 | p1_dim_lab 宽度 | w=200 (48..248) | w=180 (48..228) | 原稿与滑动条 x240 有 8px 重叠 |
| 4 | p1_dim_val | 文本控件+txt拼接 | 数字控件 + 静态 % | 规避 txt 字符串拼接语法风险[X5] |
| 5 | 字库 | 中文 48/64 大字 | 主页大字用 ASCII 数字字库 | 省 Flash，中文大字仅 16/24/32 |

## 5. 字符集审计

- 已去除：`↺`（非 GB2312）
- 需真机确认（GB2312 符号区存在）：`●` `℃` `·` `×` `≤` `—` `…`

## 6. 编译状态

- **Build Status**: `NOT_COMPILED`
- **TFT**: `Not Generated`（本环境未安装 USART HMI 官方工具链，请在官方上位机打开 02_project.json 对应的工程设置后编译，见 13_build/README.md）