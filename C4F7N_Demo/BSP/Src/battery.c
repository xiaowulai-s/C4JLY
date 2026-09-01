/*
 * battery.c - 电池电压采样 (PB1 / ADC1_IN9) 与电量百分比
 */
#include "battery.h"
#include "adc.h"            /* hadc1: 由 CubeMX 生成的 adc.c MX_ADC1_Init 初始化 */
#include "tjc_cmd.h"
#include "stm32f1xx_hal.h"

/* ---------- 电池电压采样参数 ---------- */

#define BAT_REF_V      3.30f             /* STM32 ADC 参考电压 V */
#define BAT_R_TOP_K    100.0f            /* R22 上分压电阻 kΩ */
#define BAT_R_BOT_K    24.0f             /* R23 下分压电阻 kΩ */
#define BAT_DIV_RATIO  (BAT_R_BOT_K / (BAT_R_TOP_K + BAT_R_BOT_K)) /* VBAT_SENSE = 电池 * 分压比 */
#define BAT_EMPTY_V    12.0f             /* 空电 (4S Li-ion, 3.0V/节) */
#define BAT_FULL_V     16.8f             /* 充满 */

static int g_batt_pct = 100;             /* 当前电量 0~100 */
static int g_last_sent = -1;             /* 上次已同步到屏幕的电量; -1=首次强制发送 */

/* ADC 初始化: MX_ADC1_Init 由 CubeMX adc.c 生成(PB1/IN9 + 校准), 此处空保留接口 */
void battery_init(void) {
  /* hadc1 已在 MX_ADC1_Init 初始化 */
}

/* 读一次 ADC -> 还原为电池电压 (V) */
static float battery_read_voltage(void) {
  uint32_t adc;

  HAL_ADC_Start(&hadc1);
  HAL_ADC_PollForConversion(&hadc1, 10);         /* 10ms 超时 */
  adc = HAL_ADC_GetValue(&hadc1);
  HAL_ADC_Stop(&hadc1);

  /* VBAT_SENSE = Vref*adc/4095;  电池 = VBAT_SENSE/分压比 */
  return ((float)adc * BAT_REF_V / 4095.0f) / BAT_DIV_RATIO;
}

int battery_get_pct(void) {
  return g_batt_pct;
}

/* 周期刷新: 采样电压 -> 百分比 -> 同步到屏幕所有电量显示 */
void battery_poll(void) {
  float   v   = battery_read_voltage();
  int     pct = (int)((v - BAT_EMPTY_V) / (BAT_FULL_V - BAT_EMPTY_V) * 100.0f);

  if (pct < 0)   pct = 0;
  if (pct > 100) pct = 100;
  g_batt_pct = pct;

  /* 节流: 电量变化超过 1% (或首次) 才推送屏幕, 减少串口命令 */
  if (g_last_sent < 0 || (pct - g_last_sent >= 1) || (g_last_sent - pct >= 1)) {
    tjc_set_bat(pct);       /* 顶栏chip x4 + 关于页电量行 */
    g_last_sent = pct;
  }
}