# C4F7N 便携式检漏仪 · TJC 串口屏工程规格书（01_project_spec.md）

> 工程代号：C4F7N_LeakDetector_HMI ｜ 版本：v1.0.0 ｜ 日期：2026-08-24
> 状态：**SOURCE PROJECT（待编译）**——本环境无 USART HMI 官方工具链，`.tft` 需人工编译（见 13_build/README.md）
> 配套：`C4F7N_HMI_视觉稿_1024x600.html`（效果图，仅视觉参考，非工程文件）

---

## 1. 项目概要

面向「C4F7N 便携式检漏仪」（NDIR 双波长红外，量程 0~1000 ppm，显示 0.01 ppm），为淘晶驰 **7寸 1024×600（X5 平台）** 横屏电容触摸屏生成完整 USART HMI 界面工程定义：

- 4 页面：主页（浓度大字+峰值+状态）/ 设置（阈值·单位·蜂鸣·背光·标定）/ 历史曲线（波形+统计+导出）/ 关于
- 118 个控件，工业深色主题，底部导航，顶部状态栏
- 串口 115200 8N1，Nextion 兼容文本指令 + `0xFF 0xFF 0xFF` 帧尾
- 报警 4 级（NORMAL/WARNING/ALARM/OVER_RANGE），色条三色联动 + 蜂鸣

## 2. 设备信息（DEVICE_PROFILE）

| 项 | 值 |
| -- | -- |
| 品牌 / 平台 | 淘晶驰 TJC / **X5** |
| 型号 | X5-070 系列（7.0寸，以实际购买型号为准） |
| 分辨率 / 方向 | **1024 × 600 横屏**（SGprj.hmi 实测 SCREENDSIZE=1024X600） |
| 色深 | RGB565（16bit） |
| Flash | 16MB（典型值，编译时核对） |
| 波特率 | 115200 |
| USART HMI | X5 平台官方最新版上位机 |
| 控件类型（本工程用） | text / number / button / progress / wave / hscroll |

## 3. 页面规划（PAGE_MAP）

```
┌──────────────────────────────────────────────┐
│ Header 顶部状态栏（标题 + 探头/泵/电量 芯片）    y 0~64
├──────────────────────────────────────────────┤
│ Main Content 主内容区（每页功能区）            y 64~526
├──────────────────────────────────────────────┤
│ Navigation 底部导航 4 等分（主页/设置/曲线/关于） y 526~600
└──────────────────────────────────────────────┘
```

| 页面 | 功能 | 入口 | 出口 |
| -- | -- | -- | -- |
| P0 主页 | 浓度大字(vvs=2) + 峰值 + 均值 + 报警色条 + 状态面板 | 开机默认 / 导航 | P1/P2/P3 |
| P1 设置 | 高报/低报阈值步进、单位切换、蜂鸣器、背光、零点/量程标定、恢复出厂 | 导航 | P0/P2/P3 |
| P2 历史曲线 | 波形(10M/1H/24H) + 统计(最大/平均/最小/时长/点数) + 导出CSV | 导航 | P0/P1/P3 |
| P3 关于 | 设备信息 + 传感器/探头状态（纯展示） | 导航 | P0/P1/P2 |

页面跳转：底部导航 4 按钮 rel 事件 `page N` + 当前页 bco=3222 高亮，其余 2212。

## 4. UI 设计规范（Design System）

### 4.1 颜色规范（RGB565 十进制，脚本赋值用）

| 用途 | 色名 | HEX | RGB565 |
| -- | -- | -- | -- |
| 主背景 | PRIMARY_BG | #0B1526 | 2212 |
| 面板 | CARD_BG | #12233C | 4359 |
| 面板亮 | CARD_BG_HI | #16294A | 4425 |
| 分割线 | BORDER | #1E3A5F | 6603 |
| 主文字 | TEXT_PRIMARY | #E2E8F0 | 59230 |
| 副文字 | TEXT_SECONDARY | #7D93AD | 31893 |
| 主题青 | ACCENT | #0891B2 | 3222 |
| 亮青 | ACCENT_BR | #22D3EE | 9885 |
| 成功/正常 | NORMAL | #22C55E | 9771 |
| 警告 | WARNING | #F59E0B | 62689 |
| 报警 | ALARM | #EF4444 | 59944 |
| 深青字 | 徽章深字 | #06121F | 131 |
| 禁用灰 | DISABLED | #3B4F6B | 14957 |

### 4.2 字体规范

| 字号 | 用途 | 字库 |
| -- | -- | -- |
| 16 | 状态芯片/说明/状态行/正文 | GB2312 全字库 |
| 24 | 标题/按钮/统计值 | GB2312 全字库 |
| 32 | 峰值/阈值数字 | GB2312 全字库 |
| 48 | 主页浓度大数字 | **ASCII 数字字库**（省 Flash） |

### 4.3 尺寸与间距规范

- 布局分区：Header y0~64 ｜ Content y64~526 ｜ Nav y526~600
- 内容区左右面板：y84 起、h424、radius 18
- 圆角：面板 18 / 徽章 16 / 芯片 14 / 小按钮 10~12
- 状态芯片：h28、间距 12px（x688/806/914）
- 触摸目标：导航 256×52；标定按钮 110×44；阈值步进 44×44（偏小，见 WARN）
- 报警色条：p0_strip 440×8，MCU 按等级改 pco

### 4.4 状态规范

| 状态 | 颜色 | 表现 |
| -- | -- | -- |
| 探头已连接/断开 | 绿 9771 / 红 59944 | 芯片文字 + 颜色 |
| 泵运行/停止 | 绿 9771 / 灰 14957 | 芯片文字 + 颜色 |
| 电量 | 橙 62689 | 芯片文字 |
| 报警等级 | 绿/橙/红 | p0_strip.pco 三色 |
| 导航高亮 | 主题青 3222 | 当前页按钮 |

## 5. 变量设计（VARIABLE_TABLE 摘要，详见 06_variables.json）

| 变量 | 类型 | 单位 | 范围 | 默认 | 刷新 | 方向 |
| -- | -- | -- | -- | -- | -- | -- |
| c4f7n_ppm | float | ppm | 0~1000 | 0 | 250ms | MCU→HMI |
| peak_ppm | float | ppm | 0~1000 | 0 | 250ms | MCU→HMI |
| avg_ppm | float | ppm | 0~1000 | 0 | 1s | MCU→HMI |
| temp_probe | float | ℃ | -20~60 | 25 | 1s | MCU→HMI |
| flow_rate | float | L/min | 0~1.5 | 0 | 1s | MCU→HMI |
| battery_pct | int | % | 0~100 | 100 | 5s | MCU→HMI |
| threshold_hi | int | ppm | 100~1000 | 500 | 事件 | 双向 |
| threshold_lo | int | ppm | 10~1000 | 100 | 事件 | 双向 |
| unit_mode | enum | ppm/g·yr | - | ppm | 事件 | 双向 |
| buzzer_en | bool | - | - | 开 | 事件 | 双向 |
| pump_status | bool | - | - | 运行 | 1s | MCU→HMI |
| probe_status | bool | - | - | 已连接 | 1s | MCU→HMI |
| alarm_status | enum | - | 4 级 | NORMAL | 250ms | MCU→HMI |
| curve_range | enum | - | 10M/1H/24H | 10M | 事件 | HMI→MCU |
| dim_level | int | % | 10~100 | 70 | 事件 | HMI 本地 |

## 6. 串口协议（详见 07_serial_protocol.json）

- **MCU→HMI**：`obj.attr=value` / `page N` / `add 0,n` / `cls 0` / `dim=n` / `beep n`，以 `0xFF 0xFF 0xFF` 结尾
- **HMI→MCU**：`print` 关键字（PEAK:RESET / THR:HI:n / THR:LO:n / UNIT:TOGGLE / BUZ:TOGGLE / CAL:ZERO|SPAN|FACTORY / RANGE:10M|1H|24H / EXPORT），无帧尾，MCU 按关键字匹配
- 校验和：无（用户协议未定义，沿用）

## 7. 报警逻辑（详见 08_alarm_config.json）

| 等级 | 范围 | 色条 pco | 蜂鸣 |
| -- | -- | -- | -- |
| NORMAL | 0~<100 | 9771 绿 | 无 |
| WARNING | 100~<500 | 62689 橙 | 慢速间歇 |
| ALARM | 500~<1000 | 59944 红 | 快速间歇 |
| OVER_RANGE | ≥1000 | 59944 红 | 连续长鸣 |

解除条件：浓度回落至 < 低报阈值 100ppm。历史记录由 MCU 端 W25Q16 完成，HMI 不设报警记录页（按用户 4 页方案）。

## 8. 资源清单（详见 10_assets/）

| 资源 | 说明 | 状态 |
| -- | -- | -- |
| 背景 | 纯色 2212，无图片 | ✅ 无需生成 |
| 图标 | 文字+色块实现 | 可选优化项 |
| 按钮 | 控件直绘 | ✅ 无需生成 |
| 字体 | GB2312 16/24/32 + ASCII 数字 48 | USART HMI 内置生成 .zi |

## 9. 工程目录（tjc-project/）

```
tjc-project/
├── 01_project_spec.md           本文件
├── 02_project.json              工程总览
├── 03_device.json               设备档案
├── 04_page_map.json             页面拓扑
├── 05_component_map.json        组件总索引（118 控件，由校验器派生）
├── 06_variables.json            变量表
├── 07_serial_protocol.json      串口协议
├── 08_alarm_config.json         报警配置
├── 09_pages/                    p0~p3 四页组件定义（坐标/层级/事件）
├── 10_assets/                   资源说明（background/icon/button/font）
├── 11_scripts/                  global + p0~p3 事件脚本片段
├── 12_validation_report.md      自动验证报告
├── 13_build/                    编译输出目录（当前仅 README + 校验摘要）
├── C4F7N_HMI_视觉稿_1024x600.html  交互效果图（非工程文件）
└── tools/tjc_validator.py       可重复运行的工程校验器
```

## 10. 生成文件（§22 对照）

| 输出 | 文件 | 状态 |
| -- | -- | -- |
| 01_project_spec.md | ✅ | 本文件 |
| 02_project.json | ✅ | 已生成 |
| 03_device.json | ✅ | 已生成 |
| 04_page_map.json | ✅ | 已生成 |
| 05_component_map.json | ✅ | 已生成（校验器派生） |
| 06_variables.json | ✅ | 已生成 |
| 07_serial_protocol.json | ✅ | 已生成 |
| 08_alarm_config.json | ✅ | 已生成 |
| 09_pages/ | ✅ | 4 页 JSON |
| 10_assets/ | ✅ | 4 份 README |
| 11_scripts/ | ✅ | 5 个脚本片段 |
| 12_validation_report.md | ✅ | 校验器生成 |
| 13_build/ | ✅ | README + 校验摘要 |
| xxx.tft | ❌ | **NOT_COMPILED**（无官方工具链） |

## 11. 验证结果（详见 12_validation_report.md）

- **ERROR = 0**，**WARN = 32**（11 触摸尺寸建议 + 21 字符真机确认，均不影响编译）
- 自动修复 1 轮（误报过滤）；几何/ID/引用/变量/跳转全部 PASS
- 设计偏差 5 处已记录（↺ 去除、左面板扩宽、dim_lab 收窄、背光值控件化、数字字库）

## 12. 编译状态

```
Build Status: NOT_COMPILED
TFT: Not Generated（本环境未安装 USART HMI 官方工具链）
```

编译步骤见 `13_build/README.md`：新建 X5 工程 → 1024×600 → 按 09_pages/11_scripts 搭建 → 编译生成 .tft → TF 卡/串口烧录。

## 13. 需要人工确认的问题

| # | 问题 | 影响 |
| -- | -- | -- |
| 1 | X5-070 具体型号（Flash 容量） | 决定字库档位与资源余量 |
| 2 | `print` 变量输出是否被固件支持 | 阈值上报方式（双方案已备） |
| 3 | `radius` 圆角在 X5 是否渲染 | 仅视觉，不影响功能 |
| 4 | `●`/`℃`/`×`/`≤` 等符号真机显示 | 若为方块，改用全角或图片 |
| 5 | 阈值步进 44×44 按钮是否偏小 | 可统一放大至 48×48 |
| 6 | 报警弹窗页是否需要（当前无） | 如需新增 page4 二次确认页 |

---

*C4F7N Portable Leak Detector · TJC Project Spec v1.0.0 · 1024×600 · 2026-08-24*
