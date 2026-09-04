# C4F7N 检漏仪 · 文档导航

> 项目根为 `d:\Demo\C4jly`，含三个主要工作区：
> **`C4F7N_LeakDetector/`**（产品规格/接口/设计）、**`C4F7N_Demo/`**（主控固件工程）、**`tjc-hmi-toolkit/`**（屏幕程序化生成工具链）。

***

## 快速入口（最多 3 步到目标）

| 你想要的             | 打开                                                                               |
| ---------------- | -------------------------------------------------------------------------------- |
| 项目当前进度           | [C4F7N\_LeakDetector/README.md](C4F7N_LeakDetector/README.md)                    |
| 屏幕与 MCU 接口协议     | [STM32\_HMI\_接口文档.md](C4F7N_LeakDetector/tjc-project/13_build/STM32_HMI_接口文档.md) |
| 从零接入教程           | [STM32\_HMI\_接入教程.md](C4F7N_LeakDetector/tjc-project/13_build/STM32_HMI_接入教程.md) |
| 屏幕对象短名映射 / 关键词变更 | [C4F7N\_HMI\_生成映射表.md](tjc-hmi-toolkit/C4F7N/C4F7N_HMI_生成映射表.md)                 |
| 屏幕→MCU 命令码       | [C4F7N\_HMI\_命令码协议\_v2.md](tjc-hmi-toolkit/C4F7N/C4F7N_HMI_命令码协议_v2.md)          |
| 固件如何编译 / 结构      | [C4F7N\_Demo/README.md](C4F7N_Demo/README.md)                                    |
| 屏幕工程下载烧录         | [14\_下载烧录指南.md](C4F7N_LeakDetector/tjc-project/14_下载烧录指南.md)                     |

***

## 0. 硬件连接速查（依据固件代码）

### 屏幕 · TJC USART HMI（USART1）

| STM32 引脚 | 复用         | 屏幕侧     |
| -------- | ---------- | ------- |
| PA9      | USART1\_TX | 屏 RX    |
| PA10     | USART1\_RX | 屏 TX    |
| GND      | —          | GND（共地） |

> 115200 8N1，RX 中断，72MHz。
>
> **屏幕固件版本**：当前 `tjc-hmi-toolkit/C4F7N/C4F7N_HMI_v67.HMI`（导出 `C4F7N_HMI_v67.tft`）。
>
> **5V 供电启动约束（v67 修复）**：TJC 屏满亮度（`dim=100`）+ 插 SD 卡时，5V 启动电流过大 → 电压跌落欠压无法启动。v67 已将开机背光降为 `dim=10`（改于 `Program.s`）以降低启动电流。后续使用请注意：**≤5V 供电下避免“满亮度 + SD 卡”同时作负载**；进入系统后台式可再调高亮度。详见 [14_下载烧录指南.md](C4F7N_LeakDetector/tjc-project/14_下载烧录指南.md#供电与烧录)。

### 传感器 · GC5G1 NDIR（USART4 数字 UART）

| STM32 引脚 | 配置              | 传感器侧    |
| -------- | --------------- | ------- |
| PC10     | USART4\_TX (AF) | 传感器 RX  |
| PC11     | USART4\_RX (输入) | 传感器 TX  |
| GND      | —               | GND（共地） |

> 9600 8N1，主动上报；浓度帧由 UART 解析，直出 ppm（读数上限 1000）。

### 存储 · W25Q16（SPI1）

| STM32 引脚 | 复用         | W25Q16 侧 |
| -------- | ---------- | -------- |
| PA5      | SPI1\_SCK  | CLK      |
| PA6      | SPI1\_MISO | DO/IO1   |
| PA7      | SPI1\_MOSI | DI/IO0   |
| PA4      | GPIO 推挽    | CS（软件片选） |

> Mode0，9MHz；W25Q16 = 512 扇区 × 4KB（2MB）。
> **扇区规划（方案 A，一芯两用）**：第 0 扇区 `0x00000` 存标定+设置（param\_store，低频整扇区擦写）；扇区 `0x01000..0x1FF000`（1\~511）预留历史数据 ≈ 2.08MB（2 字节/点 → 1s 采样≈12 天 / 60s≈2 年，环形磨损均衡）。详见 `C4F7N_Demo/BSP/Inc/param_store.h`。

### 烧录 · SWD

| STM32 引脚 | 连接器侧    |
| -------- | ------- |
| PA13     | SWDIO   |
| PA14     | SWCLK   |
| GND      | GND（共地） |

> 详细含说明/供电：见 [STM32\_HMI\_接口文档.md §8.6](C4F7N_LeakDetector/tjc-project/13_build/STM32_HMI_接口文档.md)、[C4F7N\_Demo/README.md](C4F7N_Demo/README.md)。

***

## 0.5 数据流与协议速查（MCU ↔ 外围）

| 链路              | 方向 | 接口                      | 协议 / 参数                              | 频率                |
| --------------- | -- | ----------------------- | ------------------------------------ | ----------------- |
| 传感器 GC5G1 → MCU | 采集 | UART4 (PC10/11)         | 9600 8N1 · 帧 `AA 55 + PPM(小端)`       | 主动上报 · 0\~1000ppm |
| 电池 → MCU        | 采集 | ADC1 · IN9 (PB1)        | 12MHz · R22=100k/R23=24k · Vref 3.3V | 250ms             |
| MCU → 屏幕 TJC    | 下发 | USART1 (PA9/10)         | 115200 8N1 · `obj.attr=val` · 0xFF×3 | 250ms 刷新          |
| 屏 → MCU         | 上报 | USART1                  | `printh` 单字节命令码（0x01/11~~17/21~~24）  | 按钮触发              |
| MCU → W25Q16    | 存储 | SPI1 (PA5\~PA7, CS=PA4) | Mode0 · 9MHz · 0x03读/0x02写/0x20擦     | 参数低频 · 历史 1s      |
| 历史回放            | 读回 | W25Q16 → MCU → 屏幕曲线     | 切范围 `add` 逐点回灌                       | 10m/1h/24h        |

- **屏 → MCU 命令码 / MCU → 屏 下发对象明细**：见 `tjc-hmi-toolkit/C4F7N/C4F7N_HMI_命令码协议_v2.md`

- **屏幕对象映射（按页 + MCU 会话对象）**：见 `tjc-hmi-toolkit/C4F7N/C4F7N_HMI_生成映射表.md`

- **唯一事实源**：`C4F7N_Demo/Middleware/Inc/c4f7n_hmi_protocol.h`

## 1. 产品规格与硬件设计（`C4F7N_LeakDetector/`）

| 文档                                                                      | 用途         |
| ----------------------------------------------------------------------- | ---------- |
| [2026-08-28\_工作日志.md](C4F7N_LeakDetector/2026-08-28_工作日志.md)            | 当日工作日志     |
| [01\_样件采购清单.md](C4F7N_LeakDetector/01_样件采购清单.md)                        | 样件 BOM 采购  |
| [02\_台架验证方案.md](C4F7N_LeakDetector/02_台架验证方案.md)                        | 台架测试验证方案   |
| [03\_立创元件对照表.md](C4F7N_LeakDetector/03_立创元件对照表.md)                      | 立创商城元件对照   |
| [04\_连接清单.md](C4F7N_LeakDetector/04_连接清单.md)                            | 硬件连接清单     |
| [05\_手动重建指引.md](C4F7N_LeakDetector/05_手动重建指引.md)                        | 手动重建工程     |
| [06\_设计基线\_v1.0.md](C4F7N_LeakDetector/06_设计基线_v1.0.md)                 | 设计基线 v1.0  |
| [08\_数据导出方案.md](C4F7N_LeakDetector/08_数据导出方案.md)                        | 数据导出设计     |
| [tools/C4F7N\_HMI\_搭建清单.md](C4F7N_LeakDetector/tools/C4F7N_HMI_搭建清单.md) | HMI 页面搭建清单 |

## 2. 屏幕工程规格（`C4F7N_LeakDetector/tjc-project/`）

| 文档                                                                                         | 用途                        |
| ------------------------------------------------------------------------------------------ | ------------------------- |
| [01\_project\_spec.md](C4F7N_LeakDetector/tjc-project/01_project_spec.md)                  | 产品/系统规格                   |
| [12\_validation\_report.md](C4F7N_LeakDetector/tjc-project/12_validation_report.md)        | 验证报告                      |
| [14\_下载烧录指南.md](C4F7N_LeakDetector/tjc-project/14_下载烧录指南.md)                               | 屏幕下载烧录                    |
| [13\_build/README.md](C4F7N_LeakDetector/tjc-project/13_build/README.md)                   | 构建目录说明                    |
| [13\_build/STM32\_HMI\_接口文档.md](C4F7N_LeakDetector/tjc-project/13_build/STM32_HMI_接口文档.md) | 接口协议文档                    |
| [13\_build/STM32\_HMI\_接入教程.md](C4F7N_LeakDetector/tjc-project/13_build/STM32_HMI_接入教程.md) | 接入教程                      |
| [10\_assets/](C4F7N_LeakDetector/tjc-project/10_assets/)                                   | 素材（背景/字体/图标/按钮，各含 README） |

## 3. 主控固件工程（`C4F7N_Demo/`）

| 文档                                                          | 用途                                                           |
| ----------------------------------------------------------- | ------------------------------------------------------------ |
| [README.md](C4F7N_Demo/README.md)                           | 固件工程总览 + 进度 + 接线 + **约束与注意事项**（GBK 编码 / CubeMX 重生成必查 / 单位文案） |
| [Software/README.md](C4F7N_LeakDetector/Software/README.md) | 参考版 CubuMX 软件骨架                                              |

## 4. 屏幕程序化生成工具链（`tjc-hmi-toolkit/`）

| 文档                                                                            | 用途              |
| ----------------------------------------------------------------------------- | --------------- |
| [README.md](tjc-hmi-toolkit/README.md)                                        | 工具链总览           |
| [AI\_HMI\_工作流.md](tjc-hmi-toolkit/AI_HMI_工作流.md)                              | AI 辅助生成 HMI 工作流 |
| [FORMAT.md](tjc-hmi-toolkit/FORMAT.md)                                        | 文件格式说明          |
| [TOOLS.md](tjc-hmi-toolkit/TOOLS.md)                                          | 工具列表            |
| [SCRIPTS.md](tjc-hmi-toolkit/SCRIPTS.md)                                      | 脚本说明            |
| [C4F7N/C4F7N\_HMI\_生成映射表.md](tjc-hmi-toolkit/C4F7N/C4F7N_HMI_生成映射表.md)        | 对象短名映射 + 修复记录   |
| [C4F7N/C4F7N\_HMI\_命令码协议\_v2.md](tjc-hmi-toolkit/C4F7N/C4F7N_HMI_命令码协议_v2.md) | 命令码协议           |
| [C4F7N/C4F7N\_HMI\_视觉稿对比\_屏幕工程.md](tjc-hmi-toolkit/C4F7N/C4F7N_HMI_视觉稿对比_屏幕工程.md) | 视觉稿 vs 屏幕工程差异清单 |

***

## 导航建议

- **想看进度** → [项目 README](C4F7N_LeakDetector/README.md)

- **要改接口/协议** → [接口文档](C4F7N_LeakDetector/tjc-project/13_build/STM32_HMI_接口文档.md) + [命令码协议](tjc-hmi-toolkit/C4F7N/C4F7N_HMI_命令码协议_v2.md)

- **要改屏幕界面** → [生成映射表](tjc-hmi-toolkit/C4F7N/C4F7N_HMI_生成映射表.md) + [搭建清单](C4F7N_LeakDetector/tools/C4F7N_HMI_搭建清单.md)

- **要改固件** → [C4F7N\_Demo/README.md](C4F7N_Demo/README.md) + [接入教程](C4F7N_LeakDetector/tjc-project/13_build/STM32_HMI_接入教程.md)

