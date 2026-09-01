/*
 * hmi_get.h - `get` 应答帧解析(Screen -> MCU 数值回读)
 */
#ifndef HMI_GET_H
#define HMI_GET_H

#include <stdint.h>

void     hmi_get_reset(void);
int      hmi_get_feed(uint8_t b);      /* 喂字节; 返回>0 表示已解析一帧 */
uint32_t hmi_get_value(void);
uint8_t  hmi_get_is_string(void);

#endif /* HMI_GET_H */