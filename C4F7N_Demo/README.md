# C4F7N 主控固件工程（eIDE / MDK-ARM）

> 器件：C4F7N 全氟异丁腈 NDIR 传感模组（GC5G1）
> 主控：STM32F103RCT6（LQFP64，256KB Flash / 48KB RAM），HAL 库
> 屏幕：TJC 7寸 USART HMI 1024×600（`C4F7N_HMI_v18.HMI`）
> 构建：eIDE（`.eide` 位于本仓库根），产物在 `MDK-ARM/build/`

***

## 项目进度（截至 2026-08-28）

**状态：固件全部实现并编译通过（约 19.3KB ROM / 6.2% RAM），处于真机烧录联调门槛前。**

### 本期已完成

| 模块            | 内容                                              | 证据                                   |
| ------------- | ----------------------------------------------- | ------------------------------------ |
| 屏幕通信（阶段1）     | USART1 RX 中断 → 命令码分发；主循环 250ms 刷新浓度/峰值/状态/色条/波形 | `C4F7N_Demo.hex` 构建成功 \[Data-backed] |
| 传感器驱动（阶段2）    | GC5G1 UART4 数字帧解析 + ppm（PC10/PC11, 9600 8N1）    | 编译链接通过 \[Data-backed]                |
| 标定/存储/单位（阶段3） | 零点/量程标定、W25Q16 持久化、恢复出厂、ppm↔g/y 单位切换            | 构建通过 \[Data-backed]                  |
| 电池电量（新增）      | PB1(ADC1\_IN9) 分压采样 → 电量%，节流刷新屏幕                | 构建通过 \[Data-backed]                  |

### 软件架构

```
Core/Src/main.c        主循环 + app_refresh(250ms) + RX 中断回调
BSP/                    板级/设备驱动
  ├─ sensor.c           GC5G1 UART4 数字帧解析 + ppm（PC10/PC11, 9600 8N1）
  ├─ battery.c          PB1(ADC1_IN9) 电池分压采样 → 电量%（R22=100k/R23=24k）
  ├─ w25q16.c           W25Q16 SPI(PA5~PA7) 驱动
  └─ param_store.c      标定+设置非易失存取（CRC）
Middleware/             通信协议（MCU↔屏幕）
  ├─ tjc_cmd.c          MCU→屏 指令发送（Nextion + 0xFF×3 帧尾）
  ├─ hmi_callback.c     屏→MCU 命令码分发 switch（0x01~0x24）
  ├─ hmi_get.c          get 应答帧解析（0x70/0x71）
  └─ c4f7n_hmi_protocol.h  协议头（命令码/对象/指令宏/颜色）单一来源
Drivers/                HAL + CMSIS（STM32CubeMX 生成，勿手改）
```

### 外围接线

| 接口     | 引脚                                     | 说明                                   |
| ------ | -------------------------------------- | ------------------------------------ |
| 屏幕     | USART1 PA9(TX)/PA10(RX) @115200 8N1    | RX 中断                                |
| 传感器    | UART4 PC11(RX)/PC10(TX) @9600 8N1      | GC5G1 数字帧主动上报                        |
| 电池电压   | PB1 (ADC1\_IN9)                        | R22=100k + R23=24k 分压，14.8V/16.8V 电池 |
| W25Q16 | SPI1: SCK=PA5/MISO=PA6/MOSI=PA7/CS=PA4 | 标定+设置存储                              |
| 烧录     | SWD (ST-Link)                          | 见下载烧录指南                              |

### 遗留项

| 项                       | 状态                                                                                   | <br />              |
| ----------------------- | ------------------------------------------------------------------------------------ | :------------------ |
| 历史曲线（`hmi_on_range`）    | **W25Q16 环形历史**（方案A一芯两用）：1s 落盘到扇区1\~511，约2.08MB≈12天覆盖；`hmi_on_range` 抽样回放 wave 并更新统计 | 构建通过 \[Data-backed] |
| CSV 导出（`hmi_on_export`） | 预留导出通道（USART1=屏/UART4=传感器，待接 USB-CDC 或独立串口）                                          | 接口实现                |
| W25Q16                  | **标定+设置**(第0扇区) + **历史环形区**(扇区1\~511)，一芯两用                                           | 构建通过                |
| 真机烧录联调                  | 待硬件（ST-Link + 板子上电 + 屏幕下载 v18 + SD 卡）                                                | <br />              |

### 下一步

1. 真机联调：ST-Link（SWD）烧 `C4F7N_Demo.hex` + 屏幕下载 `C4F7N_HMI_v18.HMI`，双向验证。
2. 历史曲线真机验证：W25Q16 环形存取、范围回放与统计；确定 CSV 导出通道（USB-CDC / 独立串口）。

***

## 构建

`C4F7N_Demo` 仓库根在 VSCode 中打开，eIDE 识别 `.eide/eide.yml` 目标；点「构建」输出 `MDK-ARM/build/C4F7N_Demo/C4F7N_Demo.hex`。

## 目录结构与 CubeMX / eIDE 协同

工程按「CubeMX 管辖」与「自管模块」分层，兼顾 CubeMX 重生成安全：

```
C4F7N_Demo/
├── Core/            # CubeMX 管辖（main.*、stm32f1xx_it.*、hal_msp、hal_conf）：勿手改，仅可改 USER CODE 段
├── Drivers/         # CubeMX 管辖（HAL + CMSIS）：勿手改
├── BSP/             # 自管模块：设备驱动（Inc/ + Src/）
├── Middleware/      # 自管模块：通信协议（Inc/ + Src/）
├── .ioc / .mxproject # CubeMX 工程，重生成用
└── .eide/eide.yml   # eIDE 工程配置
```

**关键设计**：eIDE 用 `srcDirs`（源文件夹）而非逐文件登记 `Core/Src`、`BSP/Src`、`Middleware/Src`，因此 CubeMX 新增的外设文件会被自动纳入编译，无需手动加文件。

### CubeMX 配置（Project Manager → Code Generator）— 当前已设置

- ✅ **Generate peripheral initialization as a pair of .c/.h files per peripheral**（已启用）

- ✅ **Keep user code when re-generating**：**已勾选**，保护 USER CODE 段自定义代码不被覆盖

- ✅ **Delete previously generated files when not in use**：**已保持【不勾选】**，避免误删 `BSP/`、`Middleware/` 自管模块

> ⚠️ 若日后重开 CubeMX，请确认仍为：Keep user code ✅ / Delete generated files ✗（保持不勾选）。

### CubeMX 重生成后标准流程

1. CubeMX 点 **GENERATE CODE**：仅覆盖 `Core/`、`Drivers/`，不会动 `BSP/`、`Middleware/`
2. 回 VSCode → eIDE 工作区点「重新加载工程」/刷新（让 eIDE 重新扫描 `Core/Src`）
3. 「构建」即可，无需改任何工程配置

> 自管新模块建议一律放 `BSP/`（驱动）或 `Middleware/`（通信），不要塞进 `Core/Src`，以免被 CubeMX 重生成逻辑混淆。

## 约束与注意事项（必读）

### 1. 编码硬约束（GBK）

- **含中文的 C 源文件必须保持 GBK(ANSI 936) 编码**。ARMCC(AC5) 按系统代码页解析源码，中文字面量（如 `"g/年"`）若为 UTF-8 → 编译报 `#53 expected a ":"` / `#8 missing closing quote` 乱码错误。

- 涉及文件：`Core/Src/main.c` 等含中文注释或字符串的源文件。

- 切勿用会输出 UTF-8 的工具（如 Write/Edit）直接改写含中文源文件；如需改动，改完后必须以 UTF-8 读入、GBK 写出强制转回编码。

- PowerShell 处理这些文件时，读与写都必须使用 `[System.Text.Encoding]::GetEncoding(936)`；操作前先确认源文件实际编码，否则会二次毒化中文且**不可逆**（须整文件重建）。

### 2. CubeMX 重新生成后必查（易丢的手动配置）

| 检查项                                                                                        | 若缺失的后果                                               |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| 源文件列表含 `Core/Src` 的 `usart.c / gpio.c / adc.c / spi.c`                                     | 链接报 `L6218E Undefined symbol hspi1/huart1/MX_*_Init` |
| `HAL_ADC_MODULE_ENABLED` 保持启用（已在 `.ioc` 登记 ADC1：`Mcu.IP5=ADC1` + main 已调 `MX_ADC1_Init()`） | 未启用则 `ADC_HandleTypeDef` 未定义，battery.c / main.c 编译失败 |
| CubeMX 重生成后 `main.c` 编码可能被改写为 UTF-8                                                        | 需再次转回 GBK                                            |

### 3. 单位切换文案约定

- `hmi_on_unit_toggle()` 以 `tjc_set_txt(OBJ_UNIT_BTN, PP.unit_mode ? "g/年" : "ppm")` 回写单位按钮文案（屏幕按钮自身不自切文案，仅发 `printh 0x13`）。

- 开机初始化与「恢复出厂」均须调用 `app_apply_unit()` 同步按钮文案，避免按钮显示与实际数值单位不一致。

> 本文档（README.md）本身为 UTF-8 编码，不属于上面 GBK 约束范围。

## 相关文档

- 项目总览：`../C4F7N_LeakDetector/README.md`

- 接口：`../C4F7N_LeakDetector/tjc-project/13_build/STM32_HMI_接口文档.md`

- 接入：`../C4F7N_LeakDetector/tjc-project/13_build/STM32_HMI_接入教程.md`

- 烧录：`../C4F7N_LeakDetector/tjc-project/14_下载烧录指南.md`

> 完整文档索引：**[`../DOCS.md`](../DOCS.md)**

