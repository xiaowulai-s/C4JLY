/*
 * battery.h - 电池电压采样 (PB1 / ADC1_IN9) 与电量百分比
 *
 * 电池  : 4S Li-ion, 14.8V 标称 / 16.8V 充满 / 12.0V 空电
 * 分压  : R22=100k(上) + R23=24k(下), 分压比≈0.1935
 *           满电 16.8V -> VBAT_SENSE≈3.25V (不饱和)
 *           空电 12.0V -> VBAT_SENSE≈2.32V
 * 输出  : 电量 0~100% 同步刷新到 TJC 屏幕全部电量显示 (tjc_set_bat)
 */
#ifndef BATTERY_H
#define BATTERY_H

/* ADC 初始化: 配置 ADC1 + PB1/IN9 模拟输入 + 校准; 在 main 里先调用一次 */
void battery_init(void);

/* 周期刷新: 采样电压 -> 计算电量百分比 -> 同步到屏幕; 建议放入主循环周期调用 */
void battery_poll(void);

/* 读取最近一次计算出的电量百分比 (0~100) */
int  battery_get_pct(void);

#endif /* BATTERY_H */