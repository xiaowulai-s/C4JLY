# C4F7N 检漏仪 · STM32F103 ↔ USART HMI 接口文档

> 配套固件适配：`tjc-hmi-toolkit/C4F7N/c4f7n_hmi_protocol.h`
> 屏幕工程：`C4F7N_HMI_v18.HMI`（4 页，编译通过）
> 串口：**USART1 PA9(TX)/PA10(RX)，115200 8N1，无流控**

---

## 1. 物理连接

```
STM32F103C8T6              TJC 7寸 1024×600 (X5)
   PA9  (USART1_TX) ──────►  屏 RX
   PA10 (USART1_RX) ◄──────   屏 TX
   GND  ──────────────      GND
```
> 电平 3.3V TTL，直线距离短可直接互连；长线或强干扰需 3.3V TTL 隔离（光耦/MAX3232 视屏幕供电）。

---

## 2. 协议总览

| 方向 | 编码 | 帧尾 | 说明 |
|---|---|---|---|
| **MCU → 屏幕** | Nextion 文本指令 `obj.attr=值` | `0xFF 0xFF 0xFF` | 驱动显示/跳页/喂波形 |
| **屏幕 → MCU** | `printh` 单字节命令码 | 无（脉冲 1 字节） | 用户交互上报 |

关键约束（已实证）：
- **屏幕脚本行必须 ≤15B**（引擎把 `L≥16` 当 attr → 越界弹窗）。故屏幕不主动发长文本，交互只发 1 字节命令码。
- 屏幕不支持 Nextion 的 `print`；用 TJC 原生 `printh`/`prints`/`get` 交互。
- 所有 MCU→屏幕指令必须以 `0xFF 0xFF 0xFF` 结尾，缺失则指令挂起（"上传中"）。

---

## 3. 屏幕 → MCU 命令码表（printh 单字节）

| 命令码 | 宏 | 含义 | 来源交互 |
|---|---|---|---|
| 0x01 | `HMI_CMD_PEAK_RESET` | 重置峰值 | 主页「重置峰值」 |
| 0x11 | `HMI_CMD_THR_HI` | 高报阈值变更 | 设置「高报 +/−」 |
| 0x12 | `HMI_CMD_THR_LO` | 低报阈值变更 | 设置「低报 +/−」 |
| 0x13 | `HMI_CMD_UNIT_TOG` | 单位切换 ppm↔g/年 | 设置「单位」 |
| 0x14 | `HMI_CMD_BUZ_TOG` | 蜂鸣器开关 | 设置「蜂鸣器」 |
| 0x15 | `HMI_CMD_CAL_ZERO` | 零点标定 | 设置「零点标定」 |
| 0x16 | `HMI_CMD_CAL_SPAN` | 量程标定 | 设置「量程标定」 |
| 0x17 | `HMI_CMD_CAL_FAC` | 恢复出厂 | 设置「恢复出厂」 |
| 0x21 | `HMI_CMD_RANGE_10M` | 曲线 10 分钟 | 历史曲线「10分钟」 |
| 0x22 | `HMI_CMD_RANGE_1H` | 曲线 1 小时 | 历史曲线「1小时」 |
| 0x23 | `HMI_CMD_RANGE_24H` | 曲线 24 小时 | 历史曲线「24小时」 |
| 0x24 | `HMI_CMD_EXPORT` | 导出 CSV | 历史曲线「导出」 |

> MCU 收到任一命令码字节即触发相应动作；无需解析帧尾（屏幕只发 1 字节）。命令码 0x01~0x24 为私有，与 Nextion 指令起始符（0x70/0x71 等）不冲突。

---

## 4. MCU → 屏幕 对象映射（短名 = 产物内真实名）

### 4.1 主页（cc/pv 为 vvs 小数显示）
| 宏 | 对象名 | 类型 | 刷新 | 说明 |
|---|---|---|---|---|
| `OBJ_CONC` | `cc` | num | 250ms | 浓度大字，vvs=2 → val=42 显示 0.42 |
| `OBJ_PEAK` | `pv` | num | 250ms | 峰值，vvs=2 |
| `OBJ_BADGE_AVG` | `ba` | text | 1s | 均值徽章 `txt` |
| `OBJ_STRIP` | `ps` | prog | 250ms | 报警色条 `pco` |
| `OBJ_T90` | `p9` | text | 1s | T90 状态行 `txt` |
| `OBJ_FLOW` | `pf` | text | 1s | 流量状态行 `txt` |
| `OBJ_TEMP` | `pt` | text | 1s | 温度状态行 `txt` |
| `OBJ_THR` | `pth` | text | 事件 | 阈值状态行 `txt` |

### 4.2 设置
| 宏 | 对象名 | 类型 | 说明 |
|---|---|---|---|
| `OBJ_THR_HI_VAL` | `h` | num | 高报值 vvs=0 整数 |
| `OBJ_THR_LO_VAL` | `l` | num | 低报值 vvs=0 整数 |
| `OBJ_UNIT_BTN` | `u` | btn | 单位按钮 `txt`("ppm"/"g/年") |
| `OBJ_BUZ_BTN` | `bb` | btn | 蜂鸣按钮 `txt` |
| `OBJ_CAL0_BTN` | `c0` | btn | 零点标定按钮 `txt`（复位"执行"） |
| `OBJ_CAL1_BTN` | `c1` | btn | 量程标定按钮 `txt`（复位"执行"） |

### 4.3 历史曲线
| 宏 | 对象名 | 类型 | 说明 |
|---|---|---|---|
| `OBJ_STAT_MAX/AVG/MIN/DUR/CNT` | `mx/av/mn/du/ct` | text | 统计 `txt` |
| `OBJ_WAVE` | `wv` | wave | `add 0,val` 喂点 |

### 4.4 关于
| 宏 | 对象名 | 类型 | 说明 |
|---|---|---|---|
| `OBJ_PROBE_ST` | `pst` | text | 探头状态 `txt`（断连 MCU 改红色） |

---

## 5. 常用指令宏

```c
HMI_CMD_SET_VAL(OBJ_CONC, 42);        // cc.val=42  → 显示 0.42
HMI_CMD_SET_TXT(OBJ_T90, "4.2 s");    // p9.txt="4.2 s"
HMI_CMD_SET_PCO(OBJ_STRIP, C_STRIP_RED); // ps.pco=59944 报警红
HMI_CMD_PAGE(1);                       // page 1  → 设置页
HMI_CMD_WAVE_ADD(0, v);                // add 0,v 喂波形点 (v:0~255)
HMI_CMD_WAVE_CLS(0);                   // cls 0 清波形
HMI_CMD_SET_VAL(OBJ_THR_HI_VAL, 500);  // h.val=500
```

---

## 6. 颜色值（RGB565 十进制）

| 宏 | 值 | 用途 |
|---|---|---|
| `C_STRIP_GREEN` | 9771 | 正常 |
| `C_STRIP_ORANGE` | 62689 | 警告 |
| `C_STRIP_RED` | 59944 | 报警 |

---

## 7. 报警色条联动示例

```c
switch (alarm_level) {
  case LVL_NORMAL:    HMI_CMD_SET_PCO(OBJ_STRIP, C_STRIP_GREEN);  break;
  case LVL_WARNING:   HMI_CMD_SET_PCO(OBJ_STRIP, C_STRIP_ORANGE); break;
  case LVL_ALARM:
  case LVL_OVER_RANGE:HMI_CMD_SET_PCO(OBJ_STRIP, C_STRIP_RED);    break;
}
send_frame();  // 追加 0xFF 0xFF 0xFF 并发送
```

---

## 8. 传感器 + 标定 + 存储接口（阶段 2/3）

### 8.1 传感器（GC5G1 NDIR 数字 UART）
- 器件：GC5G1 全氟异丁腈(C4F7N) NDIR 模组，**串口 UART 输出**
- 接线：传感器 `TX → PC11 (USART4_RX)`、`RX ← PC10 (USART4_TX)`，共地
- 通信：**9600 8N1，主动上报**（无主询问），浓度帧由 UART 解析，**直出 ppm**
- 读数上限：按用户设定截到 1000ppm（忽略器件 3000ppm 全量程标称）
- 帧格式（占位假设，以厂家手册为准，`sensor.h` 宏可改）：`AA 55` 帧头 + 2 字节小端浓度

```c
#include "sensor.h"
sensor_init();            // 上电 USART4 初始化 + 开接收中断
float ppm = sensor_read_ppm();       // 最近一帧浓度 0~1000
if (sensor_has_new()) /* 新帧到来, 刷新 */;
/* 数字直出浓度: k/b 标定系数不参与换算, 由传感器内部校准 */
sensor_set_cal(k, b);    // 保留接口; 本方案仅占位
sensor_get_cal(&k, &b);
```

### 8.2 非易失存储（W25Q16，SPI1）
- 器件：W25Q16（2MB SPI NOR），接线 **SPI1：SCK=PA5, MISO=PA6, MOSI=PA7, CS=PA4**
- 用途：保存标定系数 + 设置项（高/低阈值、蜂鸣器、单位），带 CRC 校验
- 布局：`0x00000` 0 扇区（4KB）单份参数，见 `param_store.h`

```c
#include "w25q16.h"
#include "param_store.h"
w25q16_init();            // SPI1+CS 初始化
param_init(&g_param);     // 上电加载（无效则写默认）
param_save(&g_param);     // 修改后落盘（擦扇区+写回）
param_factory(&g_param, 1); // 恢复出厂：默认值+立即写回
```

### 8.3 标定 / 设置 / 单位 / 恢复出厂回调（命令码 → 动作）
| 命令码 | 回调 | 动作 |
|---|---|---|
| 0x15 | `hmi_on_cal_zero` | 零点标定：数字直出时由传感器内部校准，MCU 侧仅触发（k/b 不换算，占位保留） |
| 0x16 | `hmi_on_cal_span` | 量程标定：同上，发送命令/通知传感器校准（按协议扩展） |
| 0x17 | `hmi_on_cal_factory` | 恢复出厂：参数复位默认并写回，刷新阈值/单位 |
| 0x13 | `hmi_on_unit_toggle` | 单位切换 ppm↔g/y（×0.458），存 W25Q16 |
| 0x14 | `hmi_on_buz_toggle` | 蜂鸣器开关翻转，存 W25Q16 |
| 0x11/0x12 | `hmi_on_thr_hi/lo` | `tjc_get(h.val/l.val)` 回读屏幕阈值，hmi_get 解析后写回 W25Q16 |

### 8.4 单位换算（显示）
- 换算率：**1 ppm ≈ 0.458 g/y**
- `unit_mode=0` 显示 ppm；`=1` 显示 g/y（浓度/峰值/均值均换算）
- 报警阈值恒以 ppm 判断（g/y 页面仅显示）

### 8.5 曲线数据（阶段 3 未实现）
- 历史曲线页（10M/1H/24H）波形回灌暂不实现（`hmi_on_range` 留空）；主屏实时波形由 MCU 每 250ms `tjc_wave_add(0, v)` 喂点。

### 8.6 硬件连接总表（依据固件代码）

#### 屏幕（TJC USART HMI，USART1）
| STM32 引脚 | 复用 | 屏幕侧 | 说明 |
|---|---|---|---|
| PA9 | USART1_TX (AF_PP) | 屏 RX | MCU→屏 指令/命令码 |
| PA10 | USART1_RX (输入) | 屏 TX | 屏→MCU 回包/命令码 |
| GND | — | GND | 共地 |
| VCC | — | 12/24V | 屏幕独立供电 |
> 115200 8N1，RX 中断，72MHz 系统时钟。

#### 传感器 GC5G1（NDIR 数字 UART，USART4）
| STM32 引脚 | 配置 | 传感器侧 | 说明 |
|---|---|---|---|
| PC10 | USART4_TX (AF) | 传感器 RX | 预留（主动上报可无 TX） |
| PC11 | USART4_RX (输入) | 传感器 TX | 接收上报帧 |
| GND | — | 传感器 GND | 共地 |
| VCC | — | 12/24V | 传感器独立供电 |
> 9600 8N1，主动上报；UART 解析帧直出 ppm（读数上限 1000）。

#### W25Q16（SPI NOR Flash，SPI1）
| STM32 引脚 | 复用 | W25Q16 侧 | 说明 |
|---|---|---|---|
| PA5 | SPI1_SCK (AF_PP) | CLK | Mode0，9MHz |
| PA6 | SPI1_MISO (AF_PP) | DO/IO1 | 读 |
| PA7 | SPI1_MOSI (AF_PP) | DI/IO0 | 写 |
| PA4 | GPIO 推挽输出 | CS | 软件片选（空闲高） |
| VCC | — | VCC | 3.3V |
| GND | — | GND | 共地 |
> 存标定系数 + 高/低阈值 + 蜂鸣器 + 单位模式（0 扇区，带 CRC）。

#### 烧录调试（SWD）
| STM32 引脚 | 连接器侧 | 说明 |
|---|---|---|
| PA13 (SWDIO) | ST-Link SWDIO | 数据 |
| PA14 (SWCLK) | ST-Link SWCLK | 时钟 |
| GND | GND | 共地 |
| VDD | VDD | 3.3V 检测（可选） |

#### 接线示意
```
TJC 屏 ──RX──▶  PA9 (USART1_TX) / PA10 (USART1_RX) ◀── 屏 TX
GC5G1  ──TX──▶  PC11 (USART4_RX)          RX ◀── PC10 (USART4_TX)
W25Q16 ──────▶  PA5 (SPI1_SCK) / PA6 (MISO) / PA7 (MOSI)   PA4 (CS)
ST-Link ──────▶ PA13 (SWDIO) / PA14 (SWCLK)
```