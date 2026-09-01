# C4F7N 检漏仪 · 文档导航

> 项目根为 `d:\Demo\C4jly`，含三个主要工作区：
> **`C4F7N_LeakDetector/`**（产品规格/接口/设计）、**`C4F7N_Demo/`**（主控固件工程）、**`tjc-hmi-toolkit/`**（屏幕程序化生成工具链）。

---

## 快速入口（最多 3 步到目标）

| 你想要的 | 打开 |
|---|---|
| 项目当前进度 | [C4F7N_LeakDetector/README.md](C4F7N_LeakDetector/README.md) |
| 屏幕与 MCU 接口协议 | [STM32_HMI_接口文档.md](C4F7N_LeakDetector/tjc-project/13_build/STM32_HMI_接口文档.md) |
| 从零接入教程 | [STM32_HMI_接入教程.md](C4F7N_LeakDetector/tjc-project/13_build/STM32_HMI_接入教程.md) |
| 屏幕对象短名映射 / 关键词变更 | [C4F7N_HMI_生成映射表.md](tjc-hmi-toolkit/C4F7N/C4F7N_HMI_生成映射表.md) |
| 屏幕→MCU 命令码 | [C4F7N_HMI_命令码协议_v2.md](tjc-hmi-toolkit/C4F7N/C4F7N_HMI_命令码协议_v2.md) |
| 固件如何编译 / 结构 | [C4F7N_Demo/README.md](C4F7N_Demo/README.md) |
| 屏幕工程下载烧录 | [14_下载烧录指南.md](C4F7N_LeakDetector/tjc-project/14_下载烧录指南.md) |

---

## 0. 硬件连接速查（依据固件代码）

### 屏幕 · TJC USART HMI（USART1）
| STM32 引脚 | 复用 | 屏幕侧 |
|---|---|---|
| PA9 | USART1_TX | 屏 RX |
| PA10 | USART1_RX | 屏 TX |
| GND | — | GND（共地） |
> 115200 8N1，RX 中断，72MHz。

### 传感器 · GC5G1 NDIR（USART4 数字 UART）
| STM32 引脚 | 配置 | 传感器侧 |
|---|---|---|
| PC10 | USART4_TX (AF) | 传感器 RX |
| PC11 | USART4_RX (输入) | 传感器 TX |
| GND | — | GND（共地） |
> 9600 8N1，主动上报；浓度帧由 UART 解析，直出 ppm（读数上限 1000）。

### 存储 · W25Q16（SPI1）
| STM32 引脚 | 复用 | W25Q16 侧 |
|---|---|---|
| PA5 | SPI1_SCK | CLK |
| PA6 | SPI1_MISO | DO/IO1 |
| PA7 | SPI1_MOSI | DI/IO0 |
| PA4 | GPIO 推挽 | CS（软件片选） |
> Mode0，9MHz；存标定+设置（0 扇区）。

### 烧录 · SWD
| STM32 引脚 | 连接器侧 |
|---|---|
| PA13 | SWDIO |
| PA14 | SWCLK |
| GND | GND（共地） |

> 详细含说明/供电：见 [STM32_HMI_接口文档.md §8.6](C4F7N_LeakDetector/tjc-project/13_build/STM32_HMI_接口文档.md)、[C4F7N_Demo/README.md](C4F7N_Demo/README.md)。

---

## 1. 产品规格与硬件设计（`C4F7N_LeakDetector/`）

| 文档 | 用途 |
|---|---|
| [2026-08-28_工作日志.md](C4F7N_LeakDetector/2026-08-28_工作日志.md) | 当日工作日志 |
| [01_样件采购清单.md](C4F7N_LeakDetector/01_样件采购清单.md) | 样件 BOM 采购 |
| [02_台架验证方案.md](C4F7N_LeakDetector/02_台架验证方案.md) | 台架测试验证方案 |
| [03_立创元件对照表.md](C4F7N_LeakDetector/03_立创元件对照表.md) | 立创商城元件对照 |
| [04_连接清单.md](C4F7N_LeakDetector/04_连接清单.md) | 硬件连接清单 |
| [05_手动重建指引.md](C4F7N_LeakDetector/05_手动重建指引.md) | 手动重建工程 |
| [06_设计基线_v1.0.md](C4F7N_LeakDetector/06_设计基线_v1.0.md) | 设计基线 v1.0 |
| [08_数据导出方案.md](C4F7N_LeakDetector/08_数据导出方案.md) | 数据导出设计 |
| [tools/C4F7N_HMI_搭建清单.md](C4F7N_LeakDetector/tools/C4F7N_HMI_搭建清单.md) | HMI 页面搭建清单 |

## 2. 屏幕工程规格（`C4F7N_LeakDetector/tjc-project/`）

| 文档 | 用途 |
|---|---|
| [01_project_spec.md](C4F7N_LeakDetector/tjc-project/01_project_spec.md) | 产品/系统规格 |
| [12_validation_report.md](C4F7N_LeakDetector/tjc-project/12_validation_report.md) | 验证报告 |
| [14_下载烧录指南.md](C4F7N_LeakDetector/tjc-project/14_下载烧录指南.md) | 屏幕下载烧录 |
| [13_build/README.md](C4F7N_LeakDetector/tjc-project/13_build/README.md) | 构建目录说明 |
| [13_build/STM32_HMI_接口文档.md](C4F7N_LeakDetector/tjc-project/13_build/STM32_HMI_接口文档.md) | 接口协议文档 |
| [13_build/STM32_HMI_接入教程.md](C4F7N_LeakDetector/tjc-project/13_build/STM32_HMI_接入教程.md) | 接入教程 |
| [10_assets/](C4F7N_LeakDetector/tjc-project/10_assets/) | 素材（背景/字体/图标/按钮，各含 README） |

## 3. 主控固件工程（`C4F7N_Demo/`）

| 文档 | 用途 |
|---|---|
| [README.md](C4F7N_Demo/README.md) | 固件工程总览 + 进度 + 接线 + **约束与注意事项**（GBK 编码 / CubeMX 重生成必查 / 单位文案） |
| [Software/README.md](C4F7N_LeakDetector/Software/README.md) | 参考版 CubuMX 软件骨架 |

## 4. 屏幕程序化生成工具链（`tjc-hmi-toolkit/`）

| 文档 | 用途 |
|---|---|
| [README.md](tjc-hmi-toolkit/README.md) | 工具链总览 |
| [AI_HMI_工作流.md](tjc-hmi-toolkit/AI_HMI_工作流.md) | AI 辅助生成 HMI 工作流 |
| [FORMAT.md](tjc-hmi-toolkit/FORMAT.md) | 文件格式说明 |
| [TOOLS.md](tjc-hmi-toolkit/TOOLS.md) | 工具列表 |
| [SCRIPTS.md](tjc-hmi-toolkit/SCRIPTS.md) | 脚本说明 |
| [C4F7N/C4F7N_HMI_生成映射表.md](tjc-hmi-toolkit/C4F7N/C4F7N_HMI_生成映射表.md) | 对象短名映射 + 修复记录 |
| [C4F7N/C4F7N_HMI_命令码协议_v2.md](tjc-hmi-toolkit/C4F7N/C4F7N_HMI_命令码协议_v2.md) | 命令码协议 |

---

## 导航建议

- **想看进度** → [项目 README](C4F7N_LeakDetector/README.md)
- **要改接口/协议** → [接口文档](C4F7N_LeakDetector/tjc-project/13_build/STM32_HMI_接口文档.md) + [命令码协议](tjc-hmi-toolkit/C4F7N/C4F7N_HMI_命令码协议_v2.md)
- **要改屏幕界面** → [生成映射表](tjc-hmi-toolkit/C4F7N/C4F7N_HMI_生成映射表.md) + [搭建清单](C4F7N_LeakDetector/tools/C4F7N_HMI_搭建清单.md)
- **要改固件** → [C4F7N_Demo/README.md](C4F7N_Demo/README.md) + [接入教程](C4F7N_LeakDetector/tjc-project/13_build/STM32_HMI_接入教程.md)