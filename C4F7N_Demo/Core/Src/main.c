/* USER CODE BEGIN Header */
/**
  ******************************************************************************
  * @file           : main.c
*  @brief          : C4F7N 便携式检漏仪 | STM32F103RCT6 + TJC 7寸屏(C4F7N_HMI_v18) 
  ******************************************************************************
  */
/* USER CODE END Header */
/* Includes ------------------------------------------------------------------*/
#include "main.h"
#include "spi.h"
#include "usart.h"
#include "gpio.h"

/* Private includes ----------------------------------------------------------*/
/* USER CODE BEGIN Includes */
#include "adc.h"
#include "spi.h"
#include "tjc_cmd.h"
#include "hmi_callback.h"
#include "hmi_get.h"
#include "c4f7n_hmi_protocol.h"
#include "sensor.h"
#include "battery.h"
#include "w25q16.h"
#include "history.h"
#include "param_store.h"
#include <stdio.h>
/* USER CODE END Includes */

/* Private typedef -----------------------------------------------------------*/
/* USER CODE BEGIN PTD */

/* USER CODE END PTD */

/* Private define ------------------------------------------------------------*/
/* USER CODE BEGIN PD */

/* USER CODE END PD */

/* Private macro -------------------------------------------------------------*/
/* USER CODE BEGIN PM */

/* USER CODE END PM */

/* Private variables ---------------------------------------------------------*/

/* USER CODE BEGIN PV */

/* ---------- 状态 ---------- */
static float g_ppm  = 0.0f;     /* 当前浓度 ppm */
static float g_peak = 0.0f;     /* 峰值 ppm */
static int   g_thr_hi = 500;    /* 高报阈值 ppm */
static int   g_thr_lo = 100;    /* 低报阈值 ppm */
static int   g_alarm  = 0;      /* 0=正常/1=低报/2=高报/3=超量程 */
static char  g_avg_str[16];
static uint8_t g_pump_on = 1;   /* pump: 1=run 0=stop (no GPIO yet) */

/* 掉电保存参数 (标定+阈值) */
param_t g_param;
#define PP  g_param
static int g_thr_pending = 0;   /* 1=改 hi, 2=改 lo(阈值 get 应答后清零) */

uint8_t rx_byte;                /* USART1 接收字节 */
#define GY_PER_PPM 0.458f        /* 1ppm 约 0.458 g/y (单位换算) */

/* USER CODE END PV */

/* Private function prototypes -----------------------------------------------*/
void SystemClock_Config(void);
/* USER CODE BEGIN PFP */
static void app_refresh(void);
static void app_apply_threshold(void);
static void app_apply_unit(void);
static void apply_view(void);
static void refill_curve(void);
static void refill_table(void);

/* USER CODE END PFP */

/* Private user code ---------------------------------------------------------*/
/* USER CODE BEGIN 0 */

/* USER CODE END 0 */

/**
  * @brief  The application entry point.
  * @retval int
  */
int main(void)
{

  /* USER CODE BEGIN 1 */

  /* USER CODE END 1 */

  /* MCU Configuration--------------------------------------------------------*/

  /* Reset of all peripherals, Initializes the Flash interface and the Systick. */
  HAL_Init();

  /* USER CODE BEGIN Init */

  /* USER CODE END Init */

  /* Configure the system clock */
  SystemClock_Config();

  /* USER CODE BEGIN SysInit */

  /* USER CODE END SysInit */

  /* Initialize all configured peripherals */
  MX_GPIO_Init();
  MX_USART1_UART_Init();
  MX_SPI1_Init();
  MX_ADC1_Init();
  /* USER CODE BEGIN 2 */

  /* 传感器 ADC 采集 (PA0 / ADC1_IN0) */
  sensor_init();

  /* 电池分压采样 (PB1 / ADC1_IN9) + 循环采样 */
  battery_init();
  battery_poll();

  /* W25Q16 掉电保存初始化 (SPI1+CS), 保存标定/历史 */
  w25q16_init();
  history_init();
  param_init(&PP);
  g_thr_hi = PP.thr_hi;
  g_thr_lo = PP.thr_lo;
  sensor_set_cal(PP.cal_k, PP.cal_b);   /* 应用标定系数 */

  /* 向屏幕发命令: 每间 1 秒触发 HAL_UART_RxCpltCallback */
  HAL_UART_Receive_IT(&huart1, &rx_byte, 1);

  /* 上电初始化, 同时默认阈值与单位按钮文案 */
  tjc_page(0);
  app_apply_threshold();
  app_apply_unit();

  /* USER CODE END 2 */

  /* Infinite loop */
  /* USER CODE BEGIN WHILE */
  while (1)
  {
    /* USER CODE END WHILE */

    /* USER CODE BEGIN 3 */
    app_refresh();
    HAL_Delay(250);
  }
  /* USER CODE END 3 */
}

/**
  * @brief System Clock Configuration
  * @retval None
  */
void SystemClock_Config(void)
{
  RCC_OscInitTypeDef RCC_OscInitStruct = {0};
  RCC_ClkInitTypeDef RCC_ClkInitStruct = {0};

  /** Initializes the RCC Oscillators according to the specified parameters
  * in the RCC_OscInitTypeDef structure.
  */
  RCC_OscInitStruct.OscillatorType = RCC_OSCILLATORTYPE_HSE;
  RCC_OscInitStruct.HSEState = RCC_HSE_ON;
  RCC_OscInitStruct.HSEPredivValue = RCC_HSE_PREDIV_DIV1;
  RCC_OscInitStruct.HSIState = RCC_HSI_ON;
  RCC_OscInitStruct.PLL.PLLState = RCC_PLL_ON;
  RCC_OscInitStruct.PLL.PLLSource = RCC_PLLSOURCE_HSE;
  RCC_OscInitStruct.PLL.PLLMUL = RCC_PLL_MUL9;
  if (HAL_RCC_OscConfig(&RCC_OscInitStruct) != HAL_OK)
  {
    Error_Handler();
  }

  /** Initializes the CPU, AHB and APB buses clocks
  */
  RCC_ClkInitStruct.ClockType = RCC_CLOCKTYPE_HCLK|RCC_CLOCKTYPE_SYSCLK
                              |RCC_CLOCKTYPE_PCLK1|RCC_CLOCKTYPE_PCLK2;
  RCC_ClkInitStruct.SYSCLKSource = RCC_SYSCLKSOURCE_PLLCLK;
  RCC_ClkInitStruct.AHBCLKDivider = RCC_SYSCLK_DIV1;
  RCC_ClkInitStruct.APB1CLKDivider = RCC_HCLK_DIV2;
  RCC_ClkInitStruct.APB2CLKDivider = RCC_HCLK_DIV1;

  if (HAL_RCC_ClockConfig(&RCC_ClkInitStruct, FLASH_LATENCY_2) != HAL_OK)
  {
    Error_Handler();
  }
}

/* USER CODE BEGIN 4 */

/* ---------- 屏幕命令处理 (USART1, 接收解析) ---------- */
void HAL_UART_RxCpltCallback(UART_HandleTypeDef *huart)
{
  if (huart->Instance == USART1) {
    /* 正在等 get 应答数据, 数据喂给等待者 */
    if (hmi_get_feed(rx_byte)) {
      if (!hmi_get_is_string()) {
        if (g_thr_pending == 1) { g_thr_hi = (int)hmi_get_value(); app_apply_threshold(); }
        else if (g_thr_pending == 2) { g_thr_lo = (int)hmi_get_value(); app_apply_threshold(); }
        g_thr_pending = 0;
      }
    } else {
      hmi_on_rx_byte(rx_byte);
    }
    HAL_UART_Receive_IT(&huart1, &rx_byte, 1);
  }
}

/* ---------- 参数同步到屏幕 ---------- */
static void app_apply_threshold(void) {
  tjc_set_val(OBJ_THR_HI_VAL, g_thr_hi);
  tjc_set_val(OBJ_THR_LO_VAL, g_thr_lo);
}

static void app_apply_unit(void) {
    /* 主页 单位+副标题 随单位切换 */
    tjc_set_txt(OBJ_CONC_SUB, PP.unit_mode ? "g/年 年泄漏率" : "ppm 浓度实时值");
  /* 同步单位按钮文案: 开机/切换后刷新按钮标签与单位一致 */
  tjc_set_txt(OBJ_UNIT_BTN, PP.unit_mode ? "g/年" : "ppm");
}

/* User app state (history split view) */
static int      g_page     = 0;   /* current screen page 0..3 */
static int      g_view     = 0;   /* history page view: 0=curve 1=table */
static uint16_t g_tbl_page = 1;   /* history table current page (1=latest) */


/* ---------- app_refresh: page-aware periodic refresh ---------- */
/* status chips: probe/pump/battery dot color by state (ASCII-only, GBK file) */
static void hmi_update_status_chips(void) {
  int probe = sensor_online();
  int pct   = battery_get_pct();
  uint16_t bpic;

  tjc_pic(OBJ_DOT_PROBE, probe ? PIC_DOT_GREEN : PIC_DOT_GRAY);
  tjc_pic(OBJ_DOT_PUMP,  g_pump_on ? PIC_DOT_GREEN : PIC_DOT_GRAY);
  /* probe/pump state in sync on all 4 pages */
  tjc_pic(OBJ_DOT_PROBE_P1, probe ? PIC_DOT_GREEN : PIC_DOT_GRAY);
  tjc_pic(OBJ_DOT_PUMP_P1,  g_pump_on ? PIC_DOT_GREEN : PIC_DOT_GRAY);
  tjc_pic(OBJ_DOT_PROBE_P2, probe ? PIC_DOT_GREEN : PIC_DOT_GRAY);
  tjc_pic(OBJ_DOT_PUMP_P2,  g_pump_on ? PIC_DOT_GREEN : PIC_DOT_GRAY);
  tjc_pic(OBJ_DOT_PROBE_P3, probe ? PIC_DOT_GREEN : PIC_DOT_GRAY);
  tjc_pic(OBJ_DOT_PUMP_P3,  g_pump_on ? PIC_DOT_GREEN : PIC_DOT_GRAY);
  bpic = (pct >= BAT_DOT_WARN_PCT) ? (uint16_t)PIC_DOT_GREEN
       : (pct >= BAT_DOT_LOW_PCT)  ? (uint16_t)PIC_DOT_AMBER
       : (uint16_t)PIC_DOT_RED;
  /* keep battery dot color in sync on all 4 pages */
  tjc_pic(OBJ_DOT_BAT, bpic);
  tjc_pic(OBJ_DOT_BAT_P1, bpic);
  tjc_pic(OBJ_DOT_BAT_P2, bpic);
  tjc_pic(OBJ_DOT_BAT_P3, bpic);
}

static void app_refresh(void) {
  char buf[32];

  /* battery -> screen */
  battery_poll();

  /* read sensor concentration (0~1000 ppm), update peak */
  g_ppm = sensor_read_ppm();
  if (g_ppm > g_peak) g_peak = g_ppm;

  /* alarm level: 0=green 1=low 2=high 3=over */
  if (g_ppm >= 1000) g_alarm = 3;
  else if (g_ppm >= PP.thr_hi) g_alarm = 2;
  else if (g_ppm >= PP.thr_lo) g_alarm = 1;
  else g_alarm = 0;

  /* live waveform feed only in history-curve view (ch=1 matches wv) */
  if (g_page == 2 && g_view == 0) {
    tjc_wave_add(1, (uint8_t)(g_ppm * 255.0f / 1000.0f));
  }

  /* 1s: log ppm to W25Q16 history ring */
  { static uint32_t hist_last = 0;
    uint32_t hn = HAL_GetTick();
    if (hn - hist_last >= HIST_PERIOD_MS) { hist_last = hn; history_log((uint16_t)g_ppm); }
  }

  /* refresh active screen by current page (avoid sending nonexistent objs) */
  if (g_page == 0) {
    /* home page: concentration / peak / badge / status / strip */
    if (PP.unit_mode == 1) {
      tjc_set_val(OBJ_CONC, (int)(g_ppm * GY_PER_PPM * 100.0f));
      tjc_set_val(OBJ_PEAK, (int)(g_peak * GY_PER_PPM * 100.0f));
      snprintf(g_avg_str, sizeof(g_avg_str), "%.2f", g_ppm * GY_PER_PPM);
    } else {
      tjc_set_val(OBJ_CONC, (int)(g_ppm * 100));
      tjc_set_val(OBJ_PEAK, (int)(g_peak * 100));
      snprintf(g_avg_str, sizeof(g_avg_str), "%.2f", g_ppm);
    }
    snprintf(buf, sizeof(buf), "%.1f s", 0.0f);   tjc_set_txt(OBJ_T90, buf);
    snprintf(buf, sizeof(buf), "%.2f",   0.0f);   tjc_set_txt(OBJ_FLOW, buf);
    snprintf(buf, sizeof(buf), "%.1f",   25.0f);  tjc_set_txt(OBJ_TEMP, buf);
    snprintf(buf, sizeof(buf), "%d/%d", g_thr_hi, g_thr_lo); tjc_set_txt(OBJ_THR, buf);
    tjc_set_txt(OBJ_BADGE_AVG, g_avg_str);
    switch (g_alarm) {
      case 3:
      case 2: tjc_set_pco(OBJ_STRIP, C_STRIP_RED);    break;
      case 1: tjc_set_pco(OBJ_STRIP, C_STRIP_ORANGE); break;
      default: tjc_set_pco(OBJ_STRIP, C_STRIP_GREEN);  break;
    }
    hmi_update_status_chips();   /* topbar probe/pump/battery dot */
  } else if (g_page == 2) {
    if (g_view == 0)      refill_curve();
    else                  refill_table();
  }
}

/* ---------- history split-view rendering (usered for page 2) ---------- */
/* hide/show the two view groups before rendering */
static void apply_view(void) {
  static const char *curve_obj[] = {
    OBJ_CT_PL, OBJ_CT_TITLE, OBJ_CT_WAVE, OBJ_CT_LEG, OBJ_CT_ALARM,
    "cys0", "cys1", "cys2", "cys3", "cys4",
    OBJ_CT_PR, "stt", "mxl", "mx", "avl", "av", "mnl", "mn", "dul", "du", "ctl", "ct", "ex"
  };
  static const char *tbl_obj[] = {
    OBJ_TBL_PANEL, OBJ_TBL_HEAD_T, OBJ_TBL_HEAD_P,
    "tt0","tt1","tt2","tt3","tt4","tt5","tt6","tt7","tt8","tt9","tt10","tt11",
    "np0","np1","np2","np3","np4","np5","np6","np7","np8","np9","np10","np11",
    "bup", "bdn", OBJ_TBL_PAGE
  };
  unsigned i;
  int cvis = (g_view == 0) ? 1 : 0;   /* curve group visible when view=0 */
  int tvis = (!cvis);
  for (i = 0; i < sizeof(curve_obj)/sizeof(curve_obj[0]); i++) tjc_vis(curve_obj[i], (uint8_t)cvis);
  for (i = 0; i < sizeof(tbl_obj)/sizeof(tbl_obj[0]);  i++) tjc_vis(tbl_obj[i],   (uint8_t)tvis);
}

/* fill curve waveform + stats from recent history (new->old) */
static void refill_curve(void) {
  hist_rec_t rec;
  uint32_t avail = history_available();
  uint16_t n, i;
  char sbuf[24];
  uint16_t vmax = 0, vmin = 0xFFFF, k = 0;
  uint32_t sum = 0, total = 0;
  float avg = 0.0f;

  avail = history_available();
  total = (avail > 600u) ? 600u : avail;
  tjc_wave_cls(1);
  if (total == 0) { n = 0; }
  else {
    uint32_t step = (total + 599u) / 600u; if (step < 1) step = 1;
    n = 0;
    for (i = 0; i < (uint16_t)total; i += (uint16_t)step) {
      if (!history_read_one(i, &rec)) break;
      if (rec.ppm > vmax) vmax = rec.ppm;
      if (rec.ppm < vmin) vmin = rec.ppm;
      sum += rec.ppm; k++;
      tjc_wave_add(1, (uint8_t)(rec.ppm * 255u / 1000u));
    }
    n = k;
  }
  if (n == 0) { avg = 0; vmin = 0; } else avg = (float)sum / (float)n;
  snprintf(sbuf, sizeof(sbuf), "%u", (unsigned)vmax); tjc_set_txt(OBJ_STAT_MAX, sbuf);
  snprintf(sbuf, sizeof(sbuf), "%.1f", (double)avg);  tjc_set_txt(OBJ_STAT_AVG, sbuf);
  snprintf(sbuf, sizeof(sbuf), "%u", (unsigned)vmin); tjc_set_txt(OBJ_STAT_MIN, sbuf);
  snprintf(sbuf, sizeof(sbuf), "%u", (unsigned)total);tjc_set_txt(OBJ_STAT_DUR, sbuf);
  snprintf(sbuf, sizeof(sbuf), "%u", (unsigned)total);tjc_set_txt(OBJ_STAT_CNT, sbuf);
}

/* fill 12-row history table for current page (row0 = newest) */
static void refill_table(void) {
  hist_rec_t r[HIST_TBL_ROWS];
  uint16_t n, i;
  uint16_t pc, page = g_tbl_page;
  char s[40];

  pc = history_page_count(HIST_TBL_ROWS);
  if (page < 1) page = 1;
  if (page > pc) page = pc;
  g_tbl_page = page;
  n = history_read_page(page, r, HIST_TBL_ROWS);

  for (i = 0; i < HIST_TBL_ROWS; i++) {
    char tObj[8], pObj[8];
    char tbuf[12], vbuf[12];
    if (i < n) {
      unsigned hh = (r[i].ts / 3600u) % 24u, mm = (r[i].ts / 60u) % 60u, ss = r[i].ts % 60u;
      snprintf(tbuf, sizeof(tbuf), "%02u:%02u:%02u", hh, mm, ss);
      if (PP.unit_mode == 1)
        snprintf(vbuf, sizeof(vbuf), "%.1f", (double)r[i].ppm * GY_PER_PPM);
      else
        snprintf(vbuf, sizeof(vbuf), "%u", (unsigned)r[i].ppm);
    } else {
      snprintf(tbuf, sizeof(tbuf), " ");
      snprintf(vbuf, sizeof(vbuf), " ");
    }
    snprintf(tObj, sizeof(tObj), "%s%u", OBJ_TBL_TIME_BASE, i);   /* time centered text  */
    tjc_set_txt(tObj, tbuf);
    snprintf(pObj, sizeof(pObj), "%s%u", OBJ_TBL_PPM_BASE, i);    /* ppm centered text   */
    tjc_set_txt(pObj, vbuf);
  }
      snprintf(s, sizeof(s), "%u/%u", (unsigned)page, (unsigned)pc);
  tjc_set_txt(OBJ_TBL_PAGE, s);
}


void hmi_on_peak_reset(void) { g_peak = 0.0f; tjc_set_val(OBJ_PEAK, 0); }

void hmi_on_thr_hi(void) { g_thr_pending = 1; tjc_get(OBJ_THR_HI_VAL, "val"); }
void hmi_on_thr_lo(void) { g_thr_pending = 2; tjc_get(OBJ_THR_LO_VAL, "val"); }

void hmi_on_unit_toggle(void) {
  PP.unit_mode = !PP.unit_mode;            /* 0=ppm 1=g/y */
    app_apply_unit();  /* 切单位: MCU 为准回推单位 UI(按钮+首页副标题) */
param_save(&PP);
  /* 屏幕按钮(u)切换单位, 发 printh 13, MCU 回写按钮标签 */
  tjc_set_txt(OBJ_UNIT_BTN, PP.unit_mode ? "g/年" : "ppm");
}

void hmi_on_buz_toggle(void) { PP.buzzer_en = !PP.buzzer_en; param_save(&PP); }

void hmi_on_cal_zero(void) {
  float v = sensor_read_voltage();
  int32_t k, b; sensor_get_cal(&k, &b);
  PP.cal_k = k;
  PP.cal_b = (int32_t)(-((float)k * 0.001f * v));  /* 使 0V 对应 0ppm */
  PP.cal_valid = 1;
  param_save(&PP);
  sensor_set_cal(PP.cal_k, PP.cal_b);
}

void hmi_on_cal_span(void) {
  float v = sensor_read_voltage();
  if (v < 0.0001f) return;
  PP.cal_k = (int32_t)((SENSOR_FS_PPM - PP.cal_b) / (double)v * 1000.0);
  PP.cal_valid = 1;
  param_save(&PP);
  sensor_set_cal(PP.cal_k, PP.cal_b);
}

void hmi_on_cal_factory(void) {
  param_factory(&PP, 1);            /* 恢复出厂设置(标定+参数) */
  g_thr_hi = PP.thr_hi; g_thr_lo = PP.thr_lo;
  sensor_set_cal(PP.cal_k, PP.cal_b);
  app_apply_threshold(); app_apply_unit();
}



/* view switch / table paging / page enter callbacks (cmd dispatcher) */
void hmi_on_view(int v) {
  g_view = (v != 0) ? 1 : 0;
  g_tbl_page = 1;
  apply_view();
  if (g_view) refill_table(); else refill_curve();
}

void hmi_on_tbl_page(int delta) {
  uint16_t pc = history_page_count(HIST_TBL_ROWS);
  int np = (int)g_tbl_page + delta;
  if (np < 1) np = 1;
  if ((uint16_t)np > pc) np = (int)pc;
  g_tbl_page = (uint16_t)np;
  refill_table();
}

void hmi_on_page_enter(int p) {
  g_page = p;
  app_apply_unit();  /* 进页面以 MCU 为准回推单位 UI(按钮+首页副标题), 避免被屏幕重进重置 */
  if (p == 2) {
    g_view = 0;             /* default curve view on entering history page */
    g_tbl_page = 1;
    apply_view();
    refill_curve();
  }
}

void hmi_on_export(void) {
  /* CSV export via reserved MCU channel (no SD); placeholder */
  history_export_window(3600u);
}

/* USER CODE END 4 */

/**
  * @brief  This function is executed in case of error occurrence.
  * @retval None
  */
void Error_Handler(void)
{
  /* USER CODE BEGIN Error_Handler_Debug */
  __disable_irq();
  while (1) { }
  /* USER CODE END Error_Handler_Debug */
}
#ifdef USE_FULL_ASSERT
/**
  * @brief  Reports the name of the source file and the source line number
  *         where the assert_param error has occurred.
  * @param  file: pointer to the source file name
  * @param  line: assert_param error line source number
  * @retval None
  */
void assert_failed(uint8_t *file, uint32_t line)
{
  /* USER CODE BEGIN 6 */
  (void)file; (void)line;
  /* USER CODE END 6 */
}
#endif /* USE_FULL_ASSERT */