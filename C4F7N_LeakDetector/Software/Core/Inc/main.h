/*
 * main.h - 全局头(示意); CubeMX 通常生成包含 HAL。用户按实际工程引入。
 */
#ifndef MAIN_H
#define MAIN_H

#ifdef __cplusplus
extern "C" {
#endif

#include "stm32f1xx_hal.h"

extern UART_HandleTypeDef huart1;
extern volatile uint8_t rx_byte;

#ifdef __cplusplus
}
#endif

#endif /* MAIN_H */