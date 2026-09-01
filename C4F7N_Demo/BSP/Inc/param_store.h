/*
 * param_store.h - 标定参数与设置项的非易失存取 (W25Q16)
 *
 * 布局: 使用第0扇区(addr 0x00000, 4KB)存一份参数 + 校验魔术字。
 * 修改即整扇区擦除重写 (低功耗/低频场景足够)。
 */
#ifndef PARAM_STORE_H
#define PARAM_STORE_H

#include <stdint.h>

/* ---- 参数结构 (保存到 W25Q16) ---- */
#define PARAM_MAGIC           0xC4F74A55u  /* 有效标志 */
#define PARAM_VERSION         1u

typedef struct {
  uint32_t magic;          /* 有效性校验 */
  uint32_t version;

  /* 标定系数: ppm = k * V + b  (k 为 1/1000 定点, b 为 1ppm) */
  int32_t  cal_k;          /* 斜率   (V->ppm), 单位 0.001   */
  int32_t  cal_b;          /* 截距   (ppm),   单位 1        */

  /* 设置 */
  uint16_t thr_hi;         /* 高报阈值 ppm */
  uint16_t thr_lo;         /* 低报阈值 ppm */
  uint8_t  buzzer_en;      /* 蜂鸣器开关 1=开 */
  uint8_t  unit_mode;      /* 0=ppm 1=g/y */
  uint8_t  cal_valid;      /* 是否做过标定 */
  uint8_t  _rsv;

  uint32_t crc;            /* 数据区 CRC (可选扩展) */
} param_t;

#define PARAM_FLASH_ADDR    0x000000u   /* W25Q16 0 扇区 */

/* 初始化: 读取 flash, 若无效则填默认值并写回 */
void    param_load_defaults(param_t *p);
void    param_init(param_t *p);            /* 上电调用, 内部 load 或默认 */
void    param_save(const param_t *p);      /* 擦扇区+写回 */

/* 便捷: 写出默认参数(恢复出厂) */
void    param_factory(param_t *p, int save_now);

#endif /* PARAM_STORE_H */