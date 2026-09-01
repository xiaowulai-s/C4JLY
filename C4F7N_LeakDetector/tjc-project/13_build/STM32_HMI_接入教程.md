# STM32F103 ↔ USART HMI 详细接入教程

> 目标：把 C4F7N 检漏仪主控（STM32F103C8T6）与 TJC 7寸屏 C4F7N_HMI_v18.HMI 串起来。
> 前置：已接线（PA9/PA10 @115200）、已用 USART HMI 下载 v18 到屏。
> 配套：`STM32_HMI_接口文档.md`、`c4f7n_hmi_protocol.h`。

---

## 第 1 步：确认屏幕端就绪

1. 用 **USART HMI 软件**打开 `C4F7N_HMI_v18.HMI`，编译并下载到屏（TF卡或串口）。
2. 上电后屏应显示「主页」，无弹窗、无「索引超出数组界限」。
3. 出厂波特率需与固件一致：**115200 8N1**（若不同，在工程属性改，或固件按实际波特率配置）。

---

## 第 2 步：建立串口工程

以 STM32 HAL + 标准外设为例。核心要素：

### 2.1 USART1 初始化（115200 8N1、RX 中断）

```c
// usart1.c
#include "usart1.h"

void MX_USART1_UART_Init(void) {
  huart1.Instance = USART1;
  huart1.Init.BaudRate = 115200;
  huart1.Init.WordLength = UART_WORDLENGTH_8B;
  huart1.Init.StopBits = UART_STOPBITS_1;
  huart1.Init.Parity = UART_PARITY_NONE;
  huart1.Init.Mode = UART_MODE_TX_RX;
  huart1.Init.HwFlowCtl = UART_HWCONTROL_NONE;
  HAL_UART_Init(&huart1);

  // 开接收中断：每收 1 字节进 HAL_UART_RxCpltCallback
  HAL_UART_Receive_IT(&huart1, &rx_byte, 1);
}
```

### 2.2 发送一帧（指令 + 帧尾）

```c
// tjc_cmd.c —— 通用发送封装
#include "tjc_cmd.h"
#include "c4f7n_hmi_protocol.h"

static uint8_t frame[64];

// 发送"指令 + 0xFF 0xFF 0xFF"
static void tjc_send_frame(const char *cmd) {
  uint16_t len = 0;
  while (cmd[len] && len < sizeof(frame) - 3) len++;
  memcpy(frame, cmd, len);
  frame[len++] = 0xFF;
  frame[len++] = 0xFF;
  frame[len++] = 0xFF;
  HAL_UART_Transmit(&huart1, frame, len, 100);
}
```

### 2.3 常用发送宏封装（复刻协议头宏）

```c
// tjc_cmd.h —— 在协议头宏基础上补发送
#include "c4f7n_hmi_protocol.h"

void tjc_set_val(const char *obj, int val) {
  char cmd[32]; HMI_CMD_SET_VAL(obj, val); tjc_send_frame(cmd);
}
void tjc_set_txt(const char *obj, const char *txt) {
  char cmd[48]; HMI_CMD_SET_TXT(obj, txt); tjc_send_frame(cmd);
}
void tjc_set_pco(const char *obj, int color) {
  char cmd[32]; HMI_CMD_SET_PCO(obj, color); tjc_send_frame(cmd);
}
void tjc_page(int n) { char cmd[16]; HMI_CMD_PAGE(n); tjc_send_frame(cmd); }
void tjc_wave_add(int ch, int v) { char cmd[16]; HMI_CMD_WAVE_ADD(ch, v); tjc_send_frame(cmd); }
void tjc_wave_cls(int ch) { char cmd[16]; HMI_CMD_WAVE_CLS(ch); tjc_send_frame(cmd); }
```

---

## 第 3 步：屏幕 → MCU 命令码解析（中断里）

屏幕每按一次交互按钮，只发 1 字节命令码。在 RX 中断回调里分发表：

```c
// main.c —— 接收中断回调
volatile uint8_t rx_byte;

void HAL_UART_RxCpltCallback(UART_HandleTypeDef *huart) {
  if (huart->Instance == USART1) {
    uint8_t b = rx_byte;
    switch (b) {
      case HMI_CMD_PEAK_RESET:  on_cmd_peak_reset();  break;
      case HMI_CMD_THR_HI:      on_cmd_thr_hi();      break; // 见下：get 回读
      case HMI_CMD_THR_LO:      on_cmd_thr_lo();      break;
      case HMI_CMD_UNIT_TOG:    on_cmd_unit_toggle(); break;
      case HMI_CMD_BUZ_TOG:     on_cmd_buz_toggle();  break;
      case HMI_CMD_CAL_ZERO:    on_cmd_cal_zero();    break;
      case HMI_CMD_CAL_SPAN:    on_cmd_cal_span();    break;
      case HMI_CMD_CAL_FAC:     on_cmd_cal_factory(); break;
      case HMI_CMD_RANGE_10M:   on_cmd_range(10);     break;
      case HMI_CMD_RANGE_1H:    on_cmd_range(60);     break;
      case HMI_CMD_RANGE_24H:   on_cmd_range(1440);   break;
      case HMI_CMD_EXPORT:      on_cmd_export();      break;
      default: break; // 忽略与 0xFF 帧尾冲突的字节
    }
    HAL_UART_Receive_IT(&huart1, &rx_byte, 1); // 重新使能接收
  }
}
```

### 阈值变更回读（命令码 0x11/0x12 只发码，值在 HMI 里）

HMI 的 `h`/`l` 已自增/自减。MCU 收到码后，用 `get` 指令把当前值读回来：

```c
static void on_cmd_thr_hi(void) {
  // 发送 get h.val + 帧尾，屏会回一帧数据（0x70 起始 + 4B LE + 0xFF0xFF0xFF）
  char cmd[16]; sprintf(cmd, "get %s.val", OBJ_THR_HI_VAL);
  tjc_send_frame(cmd);
  // 在接收里识别 0x70 起始符解析 4 字节小端值 → threshold_hi
}
```

> `get` 回包格式：`0x70 [4-Byte LE 值] 0xFF 0xFF 0xFF`（若能读到浮点则 0x71 前缀，详见 TJC 文档）。MCU 据此把阈值写回自己的标定/阈值变量。

---

## 第 4 步：周期性刷新真实数据到屏幕

在 250ms 定时中断/主循环里：

```c
void app_refresh(void) {
  /* 主页实时 */
  tjc_set_val(OBJ_CONC, (int)(ppm * 100));          // vvs=2 → 显示 0.01 精度
  tjc_set_val(OBJ_PEAK, (int)(peak * 100));
  tjc_set_txt(OBJ_BADGE_AVG, avg_str);

  /* 状态行 */
  tjc_set_txt(OBJ_T90, t90_str);
  tjc_set_txt(OBJ_FLOW, flow_str);
  tjc_set_txt(OBJ_TEMP, temp_str);
  tjc_set_txt(OBJ_THR, thr_str);

  /* 报警色条 */
  tjc_set_pco(OBJ_STRIP, alarm_color(alarm_level));

  /* 历史曲线喂点（可选，按曲线窗口使能） */
  tjc_wave_add(0, (uint8_t)(ppm * 255 / 1000));
}
```

> **注意**：屏幕支持 `add`/`get`/`printh` 等；但**脚本**内不支持 Nextion `print`，MCU 端发给屏幕的 `cls 0` 是指令（合法）。

---

## 第 5 步：阈值 / 单位 / 蜂鸣 / 标定的 MCU 处理

| 命令码 | 建议 MCU 动作 |
|---|---|
| 0x11/0x12 | get 回读 h/l → 更新 threshold_hi/lo → 写回 W25Q16（`param_save`） |
| 0x13 | 切换 `unit_mode`，重算显示值；屏幕端按钮 `u.txt` 已自行在脚本内切换 |
| 0x14 | 翻转 `buzzer_en`；屏幕按钮 `bb.txt` 已自行切 |
| 0x15 | 零点标定：取当前电压 V → 令 b=−k·V/1000 → 写 W25Q16 |
| 0x16 | 量程标定：取当前电压 V → 令 k=(1000−b)·1000/V → 写 W25Q16 |
| 0x17 | 恢复出厂默认参数（`param_factory`） |
| 0x21/0x22/0x23 | 切换曲线窗口，往屏幕重灌相应波形/统计（阶段 3 曲线数据未实现，回调留空） |
| 0x24 | USB CDC 导出 CSV（HMI 侧 `ex.txt="导出中"`，完成后 MCU 复位回"导出"） |

标定/导出完成后，MCU 应刷新屏幕按钮文本复位为默认：

```c
tjc_set_txt(OBJ_CAL0_BTN, "执行");  // 零点标定完成
tjc_set_txt(OBJ_CAL1_BTN, "执行");  // 量程标定完成
tjc_set_txt(OBJ_CAL0_BTN, "执行");  // 或按协议复位
```

### 存储说明（阶段 3 落地产物）
- 标定系数、高/低阈值、蜂鸣器开关、单位模式均存入 **W25Q16**（SPI1: SCK=PA5/MISO=PA6/MOSI=PA7/CS=PA4，见 `w25q16.c` + `param_store.c`）。
- 上电 `param_init()` 加载（CRC 无效则写默认并回写）；修改后 `param_save()` 落盘。

---

## 第 6 步：常见问题排查

| 现象 | 排查 |
|---|---|
| 屏一直"上传中" | MCU→屏幕指令缺 `0xFF 0xFF 0xFF` 帧尾 |
| 屏无显示/乱码 | 波特率不一致；8N1 配错 |
| 屏不响应 MCU 指令 | 对象名不对（用 `STM32_HMI_接口文档.md` §4 短名） |
| 打开屏幕工程弹"索引超出数组界限" | 工程脚本行 ≥16B；用校验工具重生成 |
| 屏幕按交互，MCU 收到但没反应 | 命令码分发表漏项；或没重新使能接收中断 |
| `get` 回读乱 | 检查 0x70/0x71 起始符与 4B LE 取值 |

---

## 第 7 步：交付清单

- [ ] 屏幕 v18 已下载，编译无错、无弹窗
- [ ] USART1 初值 115200 8N1 + RX 中断
- [ ] `tjc_cmd.c/h` 发送封装（指令 + 帧尾）
- [ ] RX 回调命令码分发表（12 个命令码）
- [ ] 周期刷新主页/状态/色条/波形
- [ ] 阈值 get 回读、标定/导出流程
- [ ] 接线、共地、电平确认