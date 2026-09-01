/*
 * hmi_get.c - 解析屏幕 `get` 指令应答帧。
 *
 * TJC `get obj.prop` 回包:
 *   - 值(2或4字节整形): 0x70 <value-LE> 0xFF 0xFF 0xFF
 *   - 字符串:           0x71 <bytes...> 0xFF 0xFF 0xFF
 * 本模块在 RX 字节流里缓冲一帧, 提取数值, 供阈值回读使用。
 */
#include "hmi_get.h"
#include <string.h>

/* 简单状态机: 等待 0x70/0x71 起始符, 收满后解析 */
static uint8_t  g_rx_buf[64];
static uint8_t  g_idx = 0;
static uint8_t  g_expect = 0;   /* 期望剩余数据字节数 0=等待起始符 */
static uint8_t  g_str = 0;

void hmi_get_reset(void) {
  g_idx = 0; g_expect = 0; g_str = 0;
}

/* 返回 >0 表示解析出一帧 */
int hmi_get_feed(uint8_t b) {
  if (g_expect == 0) {
    if (b == 0x70) { g_str = 0; g_expect = 4; g_idx = 0; }      /* 4字节数值 */
    else if (b == 0x71) { g_str = 1; g_expect = 0xFE; g_idx = 0; } /* 字符串, 直到帧尾 */
    return 0;
  }
  if (g_expect == 0xFE) { /* 字符串模式 */
    if (g_idx < sizeof(g_rx_buf)) g_rx_buf[g_idx++] = b;
    /* 遇 3 个 0xFF 视为结束 */
    if (g_idx >= 3 && g_rx_buf[g_idx-1]==0xFF && g_rx_buf[g_idx-2]==0xFF && g_rx_buf[g_idx-3]==0xFF) {
      g_expect = 0;
      return 1; /* 字符串: g_rx_buf[0..g_idx-4] 为内容 */
    }
    return 0;
  }
  /* 数值模式: 收 g_expect 个字节后收帧尾 */
  g_rx_buf[g_idx++] = b;
  g_expect--;
  if (g_expect == 0) { g_expect = 0xFD; return 0; } /* 等帧尾 */
  if (g_expect == 0xFD) { /* 帧尾1 */
    if (b == 0xFF) { g_expect = 0xFC; return 0; }
    hmi_get_reset(); return 0;
  }
  if (g_expect == 0xFC) { /* 帧尾2 */
    if (b == 0xFF) { int r = 1; hmi_get_reset(); return r; }
    hmi_get_reset(); return 0;
  }
  return 0;
}

/* 取最近解析的数值 (4字节小端) */
uint32_t hmi_get_value(void) {
  return (uint32_t)g_rx_buf[0]
       | ((uint32_t)g_rx_buf[1]) << 8
       | ((uint32_t)g_rx_buf[2]) << 16
       | ((uint32_t)g_rx_buf[3]) << 24;
}
uint8_t hmi_get_is_string(void) { return g_str; }

/*
 * 用法(在 hmi_on_rx_byte 之前先喂 get 解析器):
 *   void HAL_UART_RxCpltCallback(...){
 *     if (hmi_get_feed(rx_byte)) {
 *        if (!hmi_get_is_string()) tjc_set_val(OBJ_THR_HI_VAL_APPLIED, hmi_get_value());
 *     } else {
 *        hmi_on_rx_byte(rx_byte);   // get 应答之外的字节才走命令码分发
 *     }
 *   }
 */