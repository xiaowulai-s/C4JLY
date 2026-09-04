/*
 * hmi_callback.c - 屏幕 -> MCU 数据接收与命令码分发
 *
 * 屏幕交互在按钮 up 事件用 `printh NN` 发 1 字节命令码。MCU 在
 * HAL_UART_RxCpltCallback 里逐字节解析: 命中命令码表即回调对应处理函数。
 *
 * 说明:
 * - 屏幕仅发 1 字节命令码(无帧尾), 因此逐字节转发给分发器即可。
 * - 阈值(0x11/0x12)只发码, 值在屏内 h/l; 会话收到后应 tjc_get 回读 h.val/l.val。
 */
#include "hmi_callback.h"
#include "c4f7n_hmi_protocol.h"

/* 每收一字节进来一次 */
void hmi_on_rx_byte(uint8_t b) {
  switch (b) {
    case HMI_CMD_PEAK_RESET:   hmi_on_peak_reset();   break;
    case HMI_CMD_THR_HI:       hmi_on_thr_hi();       break;
    case HMI_CMD_THR_LO:       hmi_on_thr_lo();       break;
    case HMI_CMD_UNIT_TOG:     hmi_on_unit_toggle();  break;
    case HMI_CMD_BUZ_TOG:      hmi_on_buz_toggle();   break;
    case HMI_CMD_CAL_ZERO:     hmi_on_cal_zero();     break;
    case HMI_CMD_CAL_SPAN:     hmi_on_cal_span();     break;
    case HMI_CMD_CAL_FAC:      hmi_on_cal_factory();  break;
    case HMI_CMD_VIEW_CURVE:    hmi_on_view(0);      break;
    case HMI_CMD_VIEW_DATA:     hmi_on_view(1);      break;
    case HMI_CMD_TBL_NEXT:      hmi_on_tbl_page(1);  break;
    case HMI_CMD_TBL_PREV:      hmi_on_tbl_page(-1); break;
    case HMI_CMD_EXPORT:        hmi_on_export();     break;
    case HMI_CMD_PAGE0_ENTER:
    case HMI_CMD_PAGE1_ENTER:
    case HMI_CMD_PAGE2_ENTER:
    case HMI_CMD_PAGE3_ENTER:
      hmi_on_page_enter((int)b - (int)HMI_CMD_PAGE0_ENTER); break;
    default:                   /* 忽略与 0xFF 帧尾冲突等无关字节 */ break;
  }
}