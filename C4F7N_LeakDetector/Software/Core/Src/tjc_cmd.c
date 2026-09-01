/*
 * tjc_cmd.c - 屏幕指令发送封装
 *
 * 依赖:
 *   - huart1 (USART1) 由 CubeMX 生成, 在此引用 extern
 *   - HAL_UART_Transmit 阻塞发送
 */
#include "tjc_cmd.h"
#include "c4f7n_hmi_protocol.h"
#include "stm32f1xx_hal.h"
#include <string.h>
#include <stdio.h>

extern UART_HandleTypeDef huart1;

/* 发送"指令文本 + 0xFF 0xFF 0xFF" */
void tjc_send_raw(const char *cmd) {
  uint8_t frame[64];
  uint16_t len = 0;
  while (cmd[len] && len < (sizeof(frame) - 3)) len++;
  memcpy(frame, cmd, len);
  frame[len++] = 0xFF;
  frame[len++] = 0xFF;
  frame[len++] = 0xFF;
  HAL_UART_Transmit(&huart1, frame, len, 100);
}

void tjc_set_val(const char *obj, int val) {
  char cmd[32];
  HMI_CMD_SET_VAL(obj, val);
  tjc_send_raw(cmd);
}

void tjc_set_txt(const char *obj, const char *txt) {
  char cmd[64];
  HMI_CMD_SET_TXT(obj, txt);
  tjc_send_raw(cmd);
}

void tjc_set_pco(const char *obj, uint32_t color) {
  char cmd[32];
  HMI_CMD_SET_PCO(obj, color);
  tjc_send_raw(cmd);
}

void tjc_page(uint8_t n) {
  char cmd[16];
  HMI_CMD_PAGE(n);
  tjc_send_raw(cmd);
}

void tjc_wave_add(uint8_t ch, uint8_t v) {
  char cmd[16];
  HMI_CMD_WAVE_ADD(ch, v);
  tjc_send_raw(cmd);
}

void tjc_wave_cls(uint8_t ch) {
  char cmd[16];
  HMI_CMD_WAVE_CLS(ch);
  tjc_send_raw(cmd);
}

void tjc_dim(uint8_t v) {
  char cmd[16];
  HMI_CMD_DIM(v);
  tjc_send_raw(cmd);
}

void tjc_beep(void) {
  char cmd[16];
  HMI_CMD_BEEP();
  tjc_send_raw(cmd);
}

void tjc_get(const char *obj, const char *prop) {
  char cmd[32];
  HMI_CMD_GET(obj, prop);
  tjc_send_raw(cmd);
}