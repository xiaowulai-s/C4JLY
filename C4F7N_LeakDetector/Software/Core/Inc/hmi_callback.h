/*
 * hmi_callback.h - 屏幕交互命令码分发回调接口
 * 用户在 tjc_cmd.c 或应用层实现这些弱回调, 放入实际业务逻辑。
 */
#ifndef HMI_CALLBACK_H
#define HMI_CALLBACK_H

#include <stdint.h>

/* 每收到 1 字节命令码调用 (RX 中断上下文) */
void hmi_on_rx_byte(uint8_t b);

/* 各交互动作回调 (用户/应用层实现) */
void hmi_on_peak_reset(void);
void hmi_on_thr_hi(void);
void hmi_on_thr_lo(void);
void hmi_on_unit_toggle(void);
void hmi_on_buz_toggle(void);
void hmi_on_cal_zero(void);
void hmi_on_cal_span(void);
void hmi_on_cal_factory(void);
void hmi_on_range(int minutes);
void hmi_on_export(void);

#endif /* HMI_CALLBACK_H */