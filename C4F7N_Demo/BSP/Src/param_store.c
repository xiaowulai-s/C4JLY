/*
 * param_store.c - 标定参数与设置项的非易失存取 (W25Q16)
 */
#include "param_store.h"
#include "w25q16.h"
#include <string.h>

/* 默认参数: 线性换算 (0.4~2.0V -> 0~1000ppm) => k=625(V->ppm), b=0 */
/* ppm = (V-0.4)/1.6*1000 = 625*V - 250 ; 由 sensor.h 参数推得 */
#define DEFAULT_CAL_K   625
#define DEFAULT_CAL_B   (-250)

static void dump_defaults(param_t *p);

/* 简单 CRC (XOR, 非强校验; 满足参数校验即可) */
static uint32_t calc_crc(const param_t *p) {
  const uint8_t *b = (const uint8_t*)p;
  uint32_t c = 0, i;
  /* crc 字段在末尾, 排除它 */
  uint32_t len = sizeof(param_t) - sizeof(uint32_t);
  for (i = 0; i < len; i++) { c ^= b[i]; c = (c << 1) | (c >> 31); }
  return c;
}

static void dump_defaults(param_t *p)
{
  memset(p, 0, sizeof(*p));
  p->magic    = PARAM_MAGIC;
  p->version  = PARAM_VERSION;
  p->cal_k    = DEFAULT_CAL_K;
  p->cal_b    = DEFAULT_CAL_B;
  p->thr_hi   = 500;
  p->thr_lo   = 100;
  p->buzzer_en = 1;
  p->unit_mode = 0;
  p->cal_valid = 0;
  p->crc      = calc_crc(p);
}

void param_load_defaults(param_t *p) { dump_defaults(p); }

void param_init(param_t *p)
{
  w25q16_read(PARAM_FLASH_ADDR, (uint8_t*)p, sizeof(*p));
  if (p->magic != PARAM_MAGIC || p->version != PARAM_VERSION ||
      p->crc != calc_crc(p)) {
    /* 无效 -> 默认并写回 */
    dump_defaults(p);
    w25q16_erase_sector(PARAM_FLASH_ADDR);
    w25q16_write(PARAM_FLASH_ADDR, (const uint8_t*)p, sizeof(*p));
  }
}

void param_save(const param_t *p)
{
  param_t tmp = *p;
  tmp.crc = calc_crc(&tmp);
  w25q16_erase_sector(PARAM_FLASH_ADDR);
  w25q16_write(PARAM_FLASH_ADDR, (const uint8_t*)&tmp, sizeof(tmp));
}

void param_factory(param_t *p, int save_now)
{
  dump_defaults(p);
  if (save_now) param_save(p);
}