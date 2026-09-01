/* USER CODE BEGIN Header */
/**
  ******************************************************************************
  * @file           : main.c
  * @brief          : C4F7N 便携式检漏仪 | STM32F103RCT6 + TJC 7寸屏(C4F7N_HMI_v18)
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
static float g_ppm  = 0.0f;     /* 当前浓度 ppm    */
static float g_peak = 0.0f;     /* 峰值 ppm        */
static int   g_thr_hi = 500;    /* 高报阈值 ppm    */
static int   g_thr_lo = 100;    /* 低报阈值 ppm    */
static int   g_alarm  = 0;      /* 0正常/1警告/2报警/3超量程 */
static char  g_avg_str[16];

/* 非易失参数 (标定+设置) */
param_t g_param;
#define PP  g_param
static int g_thr_pending = 0;   /* 1=等 hi, 2=等 lo(区分 get 应答归属) */

uint8_t rx_byte;                /* USART1 接收字节 */
#define GY_PER_PPM 0.458f        /* 1ppm ≈ 0.458 g/y (单位换算) */

/* USER CODE END PV */

/* Private function prototypes -----------------------------------------------*/
void SystemClock_Config(void);
/* USER CODE BEGIN PFP */
static void app_refresh(void);
static void app_apply_threshold(void);
static void app_apply_unit(void);

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
  /* USER CODE BEGIN 2 */

  /* 传感器 ADC 初始化 (PA0 / ADC1_IN0) */
  sensor_init();

  /* 电池电压采样初始化 (PB1 / ADC1_IN9) + 首次读取 */
  battery_init();
  battery_poll();

  /* W25Q16 非易失性初始化 (SPI1+CS), 加载标定/设置 */
  w25q16_init();
  param_init(&PP);
  g_thr_hi = PP.thr_hi;
  g_thr_lo = PP.thr_lo;
  sensor_set_cal(PP.cal_k, PP.cal_b);   /* 应用标定系数 */

  /* 打开屏幕串口接收中断: 每收 1 字节进 HAL_UART_RxCpltCallback */
  HAL_UART_Receive_IT(&huart1, &rx_byte, 1);

  /* 上电进入主页, 同步默认阈值与单位按钮文案 */
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

/* ---------- 屏幕串口接收完成回调 (USART1, 单字节) ---------- */
void HAL_UART_RxCpltCallback(UART_HandleTypeDef *huart)
{
  if (huart->Instance == USART1) {
    /* 若是 get 应答或帧尾, 逐字节喂给解析器 */
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

/* ---------- 阈值同步到屏幕 ---------- */
static void app_apply_threshold(void) {
  tjc_set_val(OBJ_THR_HI_VAL, g_thr_hi);
  tjc_set_val(OBJ_THR_LO_VAL, g_thr_lo);
}

static void app_apply_unit(void) {
  /* 同步单位按钮文案: 避免开机/恢复出厂后按钮与数值单位不一致 */
  tjc_set_txt(OBJ_UNIT_BTN, PP.unit_mode ? "g/年" : "ppm");
}

static void app_refresh(void) {
  char buf[32];

  /* 电池电量刷新 (采样 -> 百分比 -> 屏幕) */
  battery_poll();

  /* 从传感器读浓度 (0~1000 ppm) */
  g_ppm = sensor_read_ppm();
  if (g_ppm > g_peak) g_peak = g_ppm;

  /* 报警等级: 0正常/1警告/2报警/3超量程 (按参数阈值) */
  if (g_ppm >= 1000) g_alarm = 3;
  else if (g_ppm >= PP.thr_hi) g_alarm = 2;
  else if (g_ppm >= PP.thr_lo) g_alarm = 1;
  else g_alarm = 0;

  /* 浓度大字 & 峰值 (vvs=2 -> val=42 显示 0.42); 按单位换算 */
  if (PP.unit_mode == 1) {
    tjc_set_val(OBJ_CONC, (int)(g_ppm * GY_PER_PPM * 100.0f));
    tjc_set_val(OBJ_PEAK, (int)(g_peak * GY_PER_PPM * 100.0f));
    snprintf(g_avg_str, sizeof(g_avg_str), "%.2f", g_ppm * GY_PER_PPM);
  } else {
    tjc_set_val(OBJ_CONC, (int)(g_ppm * 100));
    tjc_set_val(OBJ_PEAK, (int)(g_peak * 100));
    snprintf(g_avg_str, sizeof(g_avg_str), "%.2f", g_ppm);
  }
  tjc_set_txt(OBJ_BADGE_AVG, g_avg_str);

  /* 状态行 */
  snprintf(buf, sizeof(buf), "%.1f s", 0.0f);    tjc_set_txt(OBJ_T90, buf);
  snprintf(buf, sizeof(buf), "%.2f",   0.0f);    tjc_set_txt(OBJ_FLOW, buf);
  snprintf(buf, sizeof(buf), "%.1f",   25.0f);   tjc_set_txt(OBJ_TEMP, buf);
  snprintf(buf, sizeof(buf), "%d/%d", g_thr_hi, g_thr_lo); tjc_set_txt(OBJ_THR, buf);

  /* 报警色条: 按等级切色 */
  switch (g_alarm) {
    case 3:
    case 2: tjc_set_pco(OBJ_STRIP, C_STRIP_RED);    break;
    case 1: tjc_set_pco(OBJ_STRIP, C_STRIP_ORANGE); break;
    default: tjc_set_pco(OBJ_STRIP, C_STRIP_GREEN);  break;
  }

  /* 历史曲线数据回灌 (0~255) */
  tjc_wave_add(0, (uint8_t)(g_ppm * 255.0f / 1000.0f));
}

/* ---------- HMI 交互回调 (hmi_callback.c 分发调用) ---------- */
void hmi_on_peak_reset(void) { g_peak = 0.0f; tjc_set_val(OBJ_PEAK, 0); }

void hmi_on_thr_hi(void) { g_thr_pending = 1; tjc_get(OBJ_THR_HI_VAL, "val"); }
void hmi_on_thr_lo(void) { g_thr_pending = 2; tjc_get(OBJ_THR_LO_VAL, "val"); }

void hmi_on_unit_toggle(void) {
  PP.unit_mode = !PP.unit_mode;            /* 0=ppm 1=g/y */
  param_save(&PP);
  /* 屏幕按钮(u)不做自切文案, 仅发 printh 13, 故由 MCU 回写按钮标签 */
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
  param_factory(&PP, 1);            /* 恢复出厂(标定+设置) */
  g_thr_hi = PP.thr_hi; g_thr_lo = PP.thr_lo;
  sensor_set_cal(PP.cal_k, PP.cal_b);
  app_apply_threshold(); app_apply_unit();
}

void hmi_on_range(int minutes) {
  /* 曲线窗口切换: 当前未做波形回灌, 仅清屏 */
  tjc_wave_cls(0);
  (void)minutes;
}

void hmi_on_export(void) {
  /* 导出CSV: 预留, 未实现 */
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