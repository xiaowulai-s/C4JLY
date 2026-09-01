/*
 * main.c - C4F7N 检漏仪主控 | STM32F103RCT6 + TJC 7寸屏(C4F7N_HMI_v18)
 *
 * 依赖 CubeMX 生成: MX_GPIO / MX_USART1_UART (115200 8N1) / 时钟。
 * 本文件提供业务骨架, 传感器读数/标定/串口接收集成处留 TODO。
 */
#include "main.h"
#include "tjc_cmd.h"
#include "hmi_callback.h"
#include "c4f7n_hmi_protocol.h"

UART_HandleTypeDef huart1;
volatile uint8_t rx_byte;

/* ---------- 全局状态(示意) ---------- */
static float  g_ppm = 0.0f;      /* 当前浓度 ppm */
static float  g_peak = 0.0f;     /* 峰值 ppm     */
static int    g_thr_hi = 500;    /* 高报 ppm     */
static int    g_thr_lo = 100;    /* 低报 ppm     */
static int    g_alarm = 0;       /* 0正常/1警告/2报警/3超量程 */
static int    g_curve_min = 10;
static char   g_avg_str[16];

/* ---------------- 对象与 HAL 初始化(CubeMX 同名) ---------------- */
void MX_GPIO_Init(void);        /* CubeMX 生成 */
void MX_USART1_UART_Init(void); /* CubeMX 生成 */

static void SystemClock_Config(void); /* CubeMX 生成 */

/* ---------------- 传感器/逻辑接口(用户实现) ---------------- */
float sensor_read_ppm(void);             /* TODO: 从探头读浓度 */
int   alarm_level_from_ppm(float ppm);   /* TODO: 映射等级     */

/* ---------------- 屏幕命令码分发回调(用户业务) ---------------- */
void hmi_on_peak_reset(void)  { g_peak = 0; tjc_set_val(OBJ_PEAK, 0); }
void hmi_on_thr_hi(void)      { tjc_get(OBJ_THR_HI_VAL, "val"); } /* 见 get 回包解析 */
void hmi_on_thr_lo(void)      { tjc_get(OBJ_THR_LO_VAL, "val"); }
void hmi_on_unit_toggle(void) { /* TODO: 切换 unit_mode, 重算显示值 */ }
void hmi_on_buz_toggle(void)  { /* TODO: 翻转 buzzer_en */ }
void hmi_on_cal_zero(void)    { /* TODO: 进入零点标定 */ }
void hmi_on_cal_span(void)    { /* TODO: 进入量程标定 */ }
void hmi_on_cal_factory(void) { /* TODO: 恢复出厂并刷新屏 */ }
void hmi_on_range(int min)    { g_curve_min = min; tjc_wave_cls(0); /* TODO: 重灌波形 */ }
void hmi_on_export(void)      { /* TODO: USB CDC 导出 CSV; 完成后复位 ex.txt */ }

/* ---------------- 周期刷新 ---------------- */
static void app_refresh(void) {
  g_ppm = sensor_read_ppm();
  if (g_ppm > g_peak) g_peak = g_ppm;
  g_alarm = alarm_level_from_ppm(g_ppm);

  tjc_set_val(OBJ_CONC, (int)(g_ppm * 100));            /* vvs=2 */
  tjc_set_val(OBJ_PEAK, (int)(g_peak * 100));
  tjc_set_txt(OBJ_BADGE_AVG, g_avg_str);

  /* 状态行: 用 snprintf 组串再 tjc_set_txt */
  char buf[32];
  snprintf(buf, sizeof(buf), "%.1f s", 0.0f); tjc_set_txt(OBJ_T90, buf);
  snprintf(buf, sizeof(buf), "%.2f", 0.0f); tjc_set_txt(OBJ_FLOW, buf);
  snprintf(buf, sizeof(buf), "%.1f", 25.0f); tjc_set_txt(OBJ_TEMP, buf);
  snprintf(buf, sizeof(buf), "%d/%d", g_thr_hi, g_thr_lo); tjc_set_txt(OBJ_THR, buf);

  /* 报警色条 */
  switch (g_alarm) {
    case 1: tjc_set_pco(OBJ_STRIP, C_STRIP_ORANGE); break;
    case 2:
    case 3: tjc_set_pco(OBJ_STRIP, C_STRIP_RED);    break;
    default:tjc_set_pco(OBJ_STRIP, C_STRIP_GREEN);  break;
  }

  /* 历史波形喂点 */
  tjc_wave_add(0, (uint8_t)(g_ppm * 255.0f / 1000.0f));
}

int main(void) {
  HAL_Init();
  SystemClock_Config();
  MX_GPIO_Init();
  MX_USART1_UART_Init();

  /* 打开接收中断 */
  HAL_UART_Receive_IT(&huart1, &rx_byte, 1);

  tjc_page(0);                             /* 进入主页 */
  tjc_set_val(OBJ_THR_HI_VAL, g_thr_hi);   /* 同步阈值 */
  tjc_set_val(OBJ_THR_LO_VAL, g_thr_lo);

  while (1) {
    app_refresh();
    HAL_Delay(250);
  }
}

/* ---------------- RX 中断回调 ---------------- */
void HAL_UART_RxCpltCallback(UART_HandleTypeDef *huart) {
  if (huart->Instance == USART1) {
    hmi_on_rx_byte(rx_byte);               /* 屏幕命令码分发 */
    HAL_UART_Receive_IT(&huart1, &rx_byte, 1);
  }
}

/* ---------- 用户需实现 ---------- */
int  alarm_level_from_ppm(float ppm) {
  if (ppm >= 1000) return 3;
  if (ppm >= 500)  return 2;
  if (ppm >= 100)  return 1;
  return 0;
}

/* SystemClock_Config / MX_GPIO_Init / MX_USART1_UART_Init 由 CubeMX 生成 */
void SystemClock_Config(void) {}
void MX_GPIO_Init(void) {}
void MX_USART1_UART_Init(void) { /* CubeMX 生成; 本文件不重复 */ }