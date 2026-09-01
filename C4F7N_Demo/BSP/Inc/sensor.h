/*
 * sensor.h - C4F7N 检漏仪传感器驱动 (GC5G1 NDIR, 数字 UART 主动上报)
 *
 * 传感器: GC5G1 全氟异丁腈(C4F7N) 模组, NDIR 红外原理
 * 输出  : 串口 UART (TTL) 主动上报浓度帧
 * 接线  : 传感器 TX → STM32 PC11 (USART4_RX)
 *         传感器 RX ← STM32 PC10 (USART4_TX)
 *         传感器 GND → STM32 GND (共地)
 *         传感器 VCC → 12/24VDC 电源 (独立供电)
 *
 * 通信  : 9600 8N1, 主动上报 (无主询问), 帧格式见 SENSOR_* 宏
 *
 * 注意  : 传感器预热 >=2min; 定期(<=3个月)标定。
 *         帧格式细节以厂家手册为准, 宏可改。
 */
#ifndef SENSOR_H
#define SENSOR_H

#include <stdint.h>

/* ---------- 用户可调参数 (帧格式, 以传感器手册为准) ---------- */
#define SENSOR_FS_PPM        1000.0f /* 满量程浓度 ppm (显示用) */

/* 主动上报帧: 帧头若干字节 + 浓度(小端, 2 字节) + 校验(可选)
 * 以下为占位假设, 待厂家协议确认后调整 */
#define SENSOR_FRM_MAXLEN    16      /* 单帧最大长度 */
#define SENSOR_FRM_HEAD0     0xAA    /* 帧头 0 */
#define SENSOR_FRM_HEAD1     0x55    /* 帧头 1 */
#define SENSOR_PPM_OFFSET    2       /* 浓度数据偏移(帧头后) */
#define SENSOR_PPM_BYTES     2       /* 浓度字节数(小端) */

/* ---------- 接口 (签名保留, 兼容上层) ---------- */
/* UART4 初始化 (9600 8N1) + 开启接收中断; 在 main 里先调用 */
void    sensor_init(void);

/* 读取最近一帧解析出的浓度 (0~1000 ppm) */
float   sensor_read_ppm(void);

/* 读取原始电压: 数字方案无此概念, 保留接口供标定回调兼容返回 0 */
float   sensor_read_voltage(void);

/*
 * 标定接口: 数字直出浓度时由传感器内部校准, MCU 侧系数不参与换算。
 * 保留以便上层调用; 若传感器输出原始值需换算, 可在此扩展。
 */
void    sensor_set_cal(int32_t k, int32_t b);
void    sensor_get_cal(int32_t *k, int32_t *b);

/* 新数据可用标志: 有更新返回 1, 并清除标志 (供上层判别) */
int     sensor_has_new(void);

/* UART4 中断处理入口 (由 stm32f1xx_it.c 的 UART4_IRQHandler 调用) */
void    sensor_uart4_irq_handler(void);

#endif /* SENSOR_H */