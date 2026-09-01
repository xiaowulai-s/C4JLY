/*
 * sensor.c - C4F7N 检漏仪传感器驱动 (GC5G1 NDIR, 数字 UART 主动上报)
 *
 * 检测流程:
 *   1) 配置 PC11(RX)/PC10(TX) 为 USART4 复用, 9600 8N1
 *   2) 开启接收中断, 逐字节缓冲, 按帧头识别并解析浓度
 *   3) sensor_read_ppm() 返回最近一帧浓度
 *
 * 依赖: STM32 HAL, 已配置好系统时钟(72MHz)。
 * 帧格式为占位假设(AA 55 + 2字节小端 ppm), 以厂家手册为准, 改 SENSOR_* 宏即可。
 */
#include "sensor.h"
#include "stm32f1xx_hal.h"

static UART_HandleTypeDef huart4;

/* 接收缓冲 + 状态 */
static uint8_t  frm[SENSOR_FRM_MAXLEN];
static uint8_t  fidx = 0;
static uint8_t  synced = 0;    /* 已看到帧头0 */
static float    g_ppm_now = 0.0f;
static volatile uint8_t g_new = 0;

/* 标定接口: 数字直出浓度时不参与换算, 仅占位保留 */
static int32_t s_cal_k = 625;
static int32_t s_cal_b = -250;
void sensor_set_cal(int32_t k, int32_t b) { s_cal_k = k; s_cal_b = b; }
void sensor_get_cal(int32_t *k, int32_t *b) { if(k)*k=s_cal_k; if(b)*b=s_cal_b; }

/* 解析缓冲内一帧浓度 (小端 + 字节数, 偏移宏) */
static void parse_frame(void)
{
  if (fidx < SENSOR_PPM_OFFSET + SENSOR_PPM_BYTES) return;
  uint16_t v = 0;
  int i;
  for (i = 0; i < SENSOR_PPM_BYTES; i++)
    v |= (uint16_t)frm[SENSOR_PPM_OFFSET + i] << (8 * i);
  g_ppm_now = (v > 1000) ? 1000.0f : (float)v;   /* 截到满量程 */
  g_new = 1;
}

void sensor_init(void)
{
  GPIO_InitTypeDef gpio = {0};

  __HAL_RCC_UART4_CLK_ENABLE();
  __HAL_RCC_GPIOA_CLK_ENABLE();
  __HAL_RCC_GPIOC_CLK_ENABLE();

  /* PC11 = USART4_RX (输入浮动), PC10 = USART4_TX (AF 推挽) */
  gpio.Pin   = GPIO_PIN_10;
  gpio.Mode  = GPIO_MODE_AF_PP;
  gpio.Speed = GPIO_SPEED_FREQ_HIGH;
  HAL_GPIO_Init(GPIOC, &gpio);

  gpio.Pin   = GPIO_PIN_11;
  gpio.Mode  = GPIO_MODE_INPUT;
  gpio.Pull  = GPIO_NOPULL;
  HAL_GPIO_Init(GPIOC, &gpio);

  huart4.Instance = UART4;
  huart4.Init.BaudRate = 9600;
  huart4.Init.WordLength = UART_WORDLENGTH_8B;
  huart4.Init.StopBits = UART_STOPBITS_1;
  huart4.Init.Parity = UART_PARITY_NONE;
  huart4.Init.Mode = UART_MODE_TX_RX;
  huart4.Init.HwFlowCtl = UART_HWCONTROL_NONE;
  huart4.Init.OverSampling = UART_OVERSAMPLING_16;
  HAL_UART_Init(&huart4);

  /* 直接使能 RXNE 中断 (不依赖 HAL_UART_Receive_IT, 避免与回调冲突) */
  __HAL_UART_ENABLE_IT(&huart4, UART_IT_RXNE);

  /* 使能 UART4 接收中断 + NVIC */
  HAL_NVIC_SetPriority(UART4_IRQn, 1, 0);
  HAL_NVIC_EnableIRQ(UART4_IRQn);
}

float sensor_read_ppm(void) { return g_ppm_now; }
float sensor_read_voltage(void) { return 0.0f; }   /* 数字方案无电压 */
int   sensor_has_new(void) { uint8_t n; __disable_irq(); n = g_new; g_new = 0; __enable_irq(); return n; }

/* 逐字节喂入, 帧解析状态机 (HEAD0 HEAD1 [数据...]) */
static void feed_byte(uint8_t b)
{
  if (!synced) {
    if (b == SENSOR_FRM_HEAD0) { synced = 1; fidx = 0; frm[fidx++] = b; }
    return;
  }
  /* 已同步: 期望 HEAD1 */
  if (fidx == 1) {
    if (b == SENSOR_FRM_HEAD1) { frm[fidx++] = b; return; }
    synced = 0;              /* 头不匹配, 重新同步 */
    if (b == SENSOR_FRM_HEAD0) { synced = 1; fidx = 0; frm[fidx++] = b; }
    return;
  }
  /* HEAD1 之后: 数据 */
  if (fidx < SENSOR_FRM_MAXLEN) frm[fidx++] = b;
  if (fidx == SENSOR_PPM_OFFSET + SENSOR_PPM_BYTES) {
    parse_frame();           /* 取到浓度即解析(校验后如需可延长) */
    synced = 0; fidx = 0;
  }
}

/* UART4 中断处理 (it.c 的 UART4_IRQHandler 调用; 寄存器级读取, 不依赖 HAL 回调) */
void sensor_uart4_irq_handler(void)
{
  if (__HAL_UART_GET_FLAG(&huart4, UART_FLAG_RXNE)) {
    feed_byte((uint8_t)(huart4.Instance->DR & 0xFF));
  }
  /* 读 DR 已清 RXNE; RXNE 中断保持使能, 无需手动重挂 */
}