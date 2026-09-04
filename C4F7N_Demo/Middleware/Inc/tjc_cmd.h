/*
 * tjc_cmd.h - 屏幕指令发送封装 (MCU -> HMI)
 * 用法: 在应用层调用 tjc_set_val / tjc_set_txt / tjc_page ... 即自动追加帧尾并发送。
 */
#ifndef TJC_CMD_H
#define TJC_CMD_H

#include <stdint.h>

void tjc_send_raw(const char *cmd);                 /* 发送"指令文本"并自动加 0xFF 0xFF 0xFF */
void tjc_set_val(const char *obj, int val);
void tjc_set_txt(const char *obj, const char *txt);
void tjc_set_bat(int pct);                          /* 更新全部电量显示 (0~100) */
void tjc_set_pco(const char *obj, uint32_t color);
void tjc_pic(const char *obj, uint16_t picid);      /* 切换控件图片: obj.pic=id */
void tjc_vis(const char *obj, uint8_t vis);             /* 控件可见性 vis obj,0/1 */
void tjc_page(uint8_t n);
void tjc_wave_add(uint8_t ch, uint8_t v);
void tjc_wave_cls(uint8_t ch);
void tjc_dim(uint8_t v);
void tjc_beep(void);
void tjc_get(const char *obj, const char *prop);    /* 主动读回: get obj.prop + 帧尾 */

#endif /* TJC_CMD_H */