# STM32F103RCT6 主控软件工程 · C4F7N 检漏仪

> 与 TJC 7寸屏 C4F7N_HMI_v18.HMI 配套。
> MCU：STM32F103RCT6（LQFP64，256KB Flash/48KB RAM），HAL 库，STM32CubeMX 工程。
> 串口：USART1 PA9(TX)/PA10(RX) @ 115200 8N1，RX 中断。
> 时钟：HSE 8MHz → PLL×9 = 72MHz。

## 目录结构

```
Software/
├── README.md                       本文件
├── C4F7N_LeakDetector.ioc          ★ STM32CubeMX 工程配置（未生成代码时用）
├── c4f7n_hmi_protocol.h            协议头（命令码/对象/指令/颜色）单一来源
├── Core/
│   ├── Inc/
│   │   ├── main.h                  HAL 全局（CubeMX 生成后可能合并）
│   │   ├── tjc_cmd.h               屏幕发送接口
│   │   ├── hmi_callback.h          命令码回调接口
│   │   └── hmi_get.h               get 回读解析接口
│   └── Src/
│       ├── main.c                  主循环 + 周期刷新 + RX 中断接驳
│       ├── tjc_cmd.c               发送封装（指令+帧尾 0xFF 0xFF 0xFF）
│       ├── hmi_callback.c          命令码分发 switch（12 码）
│       └── hmi_get.c               get 应答帧解析（0x70 数值）
└── Drivers/                        （CubeMX 生成 HAL 驱动）
```

---

## 方式 A：从 .ioc 生成（推荐）

1. **安装** STM32CubeMX + STM32Cube FW_F1 固件包 + Keil MDK-ARM（或 STM32CubeIDE）。
2. **打开** `C4F7N_LeakDetector.ioc`（双击或在 CubeMX 里 File→Open）。
   - 已配置：F103C8T6、USART1(PA9/PA10 @115200 8N1)、RX 中断、72MHz 时钟。
3. 右上角 **Generate Code**（Target：MDK-ARM 或 STM32CubeIDE）。
   - 生成 HAL 驱动到 `Drivers/`、主函数与初始化到 `Core/`。
4. CubeMX 生成的 `Core/Src/main.c` 会与**本仓库手写版**重名。采用策略：
   - 用**本仓库**的 `Core/Src/*.c`、`Core/Inc/*.h` 覆盖生成文件；
   - 仅保留 CubeMX 生成的 `usart.c`、`gpio.c`、`stm32f1xx_it.c`（含有 `MX_USART1_UART_Init` / `HAL_UART_RxCpltCallback` 所需外设初始化）。
5. 把 `c4f7n_hmi_protocol.h` 加入工程 include 路径。
6. 编译下载。

> 若 .ioc 打开报版本不兼容：在 CubeMX 里 File→Open 选择并允许升级即可；或按方式 B 手配。

---

## 方式 B：CubeMX 手动配置（无 .ioc）

1. New Project → 选 **STM32F103RCT6**。
2. **System Core > RCC**：HSE = Crystal/Ceramic Resonator。
3. **Clock**：HSE 8MHz，PLL Source = HSE，×9 → SYSCLK 72MHz，APB1 = /2。
4. **Connectivity > USART1**：Mode = Asynchronous，BaudRate 115200，8N1。
5. **NVIC Settings**：勾选 **USART1 global interrupt**。
6. 引脚自动占 PA9(TX)/PA10(RX)。Project Manager 设置工程名 `C4F7N_LeakDetector`、Toolchain = 你的 IDE。
7. **Generate Code** → 复刻份本仓库 `Core/Src` 业务文件 + 协议头。

---

## 接入业务文件（无论 A/B）

在 CubeMX 生成工程后：
```bash
# 把本仓库业务源拷入工程
cp Software/Core/Inc/*.h  <proj>/Core/Inc/
cp Software/Core/Src/*.c  <proj>/Core/Src/
cp Software/c4f7n_hmi_protocol.h  <proj>/Core/Inc/
```
> 若文件名冲突（尤其 main.c），以本仓库版本为主，并把 CubeMX 的 `MX_*_Init` 声明保留（已 `extern` 引用）。

---

## 主流程（已实现）

```c
main() {
  MX_GPIO_Init();          // CubeMX
  MX_USART1_UART_Init();   // CubeMX, 115200 8N1
  HAL_UART_Receive_IT(&huart1, &rx_byte, 1);  // 开接收
  tjc_page(0);
  while(1) app_refresh();  // 250ms: 刷浓度/峰值/状态/色条/波形
}
// RX 中断 → hmi_on_rx_byte() → 命令码分发 → 用户回调
```

---

## 待实现（业务 TODO）

| 文件/函数 | 内容 |
|---|---|
| `sensor_read_ppm()` | 从传感器探针读当前浓度 |
| `alarm_level_from_ppm()` | 浓度→0/1/2/3 报警等级 |
| `hmi_on_cal_zero/span/factory()` | 标定与出厂流程（写 EEPROM） |
| `hmi_on_export()` | USB CDC 导出 CSV |
| `hmi_on_range(min)` | 切换曲线窗口并回灌波形 |
| 阈值 `get` 应答→`g_thr_hi/lo` | 见 `hmi_get.c` 状态机 |

---

## 排障

| 现象 | 处理 |
|---|---|
| CubeMX 打不开 .ioc | 升级 CubeMX / 固件包；或方式 B |
| 屏"上传中" | MCU→屏指令缺 `0xFF 0xFF 0xFF` |
| 屏无响应 | 对象名用协议头短名；波特率一致 |
| 屏幕交互无动作 | 命令码分发表/接收中断未重使能 |

*配套：`tjc-project/13_build/STM32_HMI_接口文档.md`、`STM32_HMI_接入教程.md`。*

> 完整文档索引：**[`../../DOCS.md`](../../DOCS.md)**（项目根导航）