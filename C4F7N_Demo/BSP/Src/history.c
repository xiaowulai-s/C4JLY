/*
 * history.c - 历史浓度环形存储 (W25Q16, 方案A 一芯两用)
 *
 * 记录格式: 每点 6B 大端 [ts u32 秒][ppm u16]。扇区 head u32 存代数 seq,
 *   用于跨重启恢复游标 + 环形覆盖(磨损均衡)。空点判据: ts 4 字节全 0xFF。
 *
 * 时间基准: 无外部 RTC 电池, wall_time_seconds() = HAL_GetTick()/1000 (开机秒数)。
 *   满足表格"时:分:秒"显示; 跨重启从 0 起算(精简决策, 不影响功能)。
 */
#include "history.h"
#include "w25q16.h"
#include "stm32f1xx_hal.h"

#define SECTOR_ADDR(i) ((uint32_t)(HIST_SECTOR_START + (i)) * (uint32_t)W25Q16_SECTOR_SIZE)
#define REC_ADDR(off)  ((uint32_t)(4u + (off) * HIST_REC_SIZE))
#define HEAD_ADDR      0u
#define SEQ_EMPTY      0xFFFFFFFFu
#define TS_EMPTY_MASK  0xFFFFFFFFu   /* 空点 = 时间戳全 FF */

static uint32_t g_written;   /* 已落盘点数(单调全局序号) */
static uint32_t g_last_ms;   /* 节流 */

static void rec_decode(const uint8_t *b, hist_rec_t *r) {
  r->ts  = ((uint32_t)b[0] << 24) | ((uint32_t)b[1] << 16) | ((uint32_t)b[2] << 8) | b[3];
  r->ppm = ((uint16_t)b[4] << 8) | b[5];
}
static void rec_encode(const hist_rec_t *r, uint8_t *b) {
  b[0] = (uint8_t)(r->ts >> 24); b[1] = (uint8_t)(r->ts >> 16);
  b[2] = (uint8_t)(r->ts >> 8);  b[3] = (uint8_t)r->ts;
  b[4] = (uint8_t)(r->ppm >> 8); b[5] = (uint8_t)r->ppm;
}
static int rec_is_empty(const uint8_t *b) {   /* ts 全 FF = 空点 */
  return b[0] == 0xFF && b[1] == 0xFF && b[2] == 0xFF && b[3] == 0xFF;
}

void history_init(void)
{
  uint32_t i, sz = 0, maxhead = 0;
  uint8_t  b[6];
  int      found = 0;

  for (i = 0; i < HIST_SECTORS; i++) {
    w25q16_read(SECTOR_ADDR((uint16_t)i), b, 4);
    uint32_t h = ((uint32_t)b[0] << 24) | ((uint32_t)b[1] << 16) | ((uint32_t)b[2] << 8) | b[3];
    if (h != SEQ_EMPTY && h > maxhead) { maxhead = h; found = 1; }
  }
  if (!found) { g_written = 0; }
  else {
    uint32_t ps = (maxhead % HIST_SECTORS);            /* 物理扇区 = 代数 mod N */
    for (sz = 0; sz < HIST_CAP; sz++) {               /* 扫描已写点数(找第一个空点) */
      w25q16_read(SECTOR_ADDR((uint16_t)ps) + REC_ADDR(sz), b, HIST_REC_SIZE);
      if (rec_is_empty(b)) break;
    }
    g_written = maxhead * HIST_CAP + sz;
  }
  g_last_ms = HAL_GetTick();
}

void history_log(uint16_t ppm)
{
  uint32_t now = HAL_GetTick();
  uint32_t idx, sector, off;
  uint8_t  b[HIST_REC_SIZE];
  hist_rec_t rec;

  if (g_written > 0 && (now - g_last_ms) < HIST_PERIOD_MS) return;   /* 节流 */
  g_last_ms = now;

  idx    = g_written;
  sector = (idx / HIST_CAP) % HIST_SECTORS;
  off    = idx % HIST_CAP;

  if (off == 0) {                                    /* 新扇区首点: 整扇区擦除 + 写 head 代数 */
    uint32_t seq = idx / HIST_CAP;
    uint8_t  hb[4] = { (uint8_t)(seq>>24), (uint8_t)(seq>>16), (uint8_t)(seq>>8), (uint8_t)seq };
    w25q16_erase_sector(SECTOR_ADDR(sector));
    w25q16_write(SECTOR_ADDR(sector) + HEAD_ADDR, hb, 4);
  }
  rec.ts  = wall_time_seconds();
  rec.ppm = ppm;
  rec_encode(&rec, b);
  w25q16_write(SECTOR_ADDR(sector) + REC_ADDR(off), b, HIST_REC_SIZE);
  g_written++;
}

uint32_t history_available(void)
{
  return (g_written > HIST_RING_CAP) ? HIST_RING_CAP : g_written;
}

int history_read_one(uint32_t idx, hist_rec_t *r)
{
  uint32_t avail = history_available();
  uint32_t gi, sector, off;
  uint8_t  b[HIST_REC_SIZE];

  if (idx >= avail) return 0;
  gi     = g_written - avail + idx;          /* 从最旧数第 idx 个的全局序号 */
  sector = (gi / HIST_CAP) % HIST_SECTORS;
  off    = gi % HIST_CAP;
  w25q16_read(SECTOR_ADDR(sector) + REC_ADDR(off), b, HIST_REC_SIZE);
  if (rec_is_empty(b)) { r->ts = 0; r->ppm = 0; return 0; }
  rec_decode(b, r);
  return 1;
}

/* 旧→新, 取最近 seconds 窗口(第0个=窗口内最旧) */
uint16_t history_read_window(uint32_t seconds, hist_rec_t *out, uint16_t max_n)
{
  uint32_t n = (seconds >= HIST_PERIOD_MS) ? (seconds / HIST_PERIOD_MS) : 1u;
  uint32_t avail = history_available();
  uint16_t cnt = 0;

  if (n > max_n) n = max_n;
  if (n > avail) n = avail;
  if (n == 0) return 0;
  { uint32_t start = avail - n;   /* 取最近 n 个, 最旧那格 */
    for (; cnt < (uint16_t)n; cnt++) { if (!history_read_one(start + cnt, &out[cnt])) break; }
  }
  return cnt;
}

/* 新→旧, 取最近 seconds 窗口(第0个=最新) */
uint16_t history_read_recent(uint32_t seconds, hist_rec_t *out, uint16_t max_n)
{
  uint32_t n = (seconds >= HIST_PERIOD_MS) ? (seconds / HIST_PERIOD_MS) : 1u;
  uint32_t avail = history_available();
  uint16_t cnt = 0;

  if (n > max_n) n = max_n;
  if (n > avail) n = avail;
  if (n == 0) return 0;
  { uint32_t i;
    for (i = 0; i < n; i++) {       /* idx 越大越新 */
      if (!history_read_one(n - 1 - i, &out[cnt])) break;
      cnt++;
    }
  }
  return cnt;
}

uint16_t history_page_count(uint16_t per)
{
  uint32_t avail = history_available();
  if (avail == 0) return 1;
  return (uint16_t)((avail + per - 1u) / per);
}

/* 第 page 页(1=最新), 行0=最新记录; 返回本页有效行数 */
uint16_t history_read_page(uint32_t page, hist_rec_t *out, uint16_t per)
{
  uint32_t avail = history_available();
  uint16_t pc, row;
  uint16_t cnt = 0;

  if (avail == 0) return 0;
  pc = history_page_count(per);
  if (page < 1) page = 1;
  if (page > pc) page = pc;

  for (row = 0; row < per; row++) {
    /* 最新在 avail-1; 页1行0=最新; 页 page 行 row = avail - ((page-1)*per + row) - 1 */
    uint32_t offset_from_latest = (page - 1u) * per + row;
    if (offset_from_latest >= avail) break;
    uint32_t idx = avail - 1u - offset_from_latest;   /* 全局序号以最旧为0 */
    if (!history_read_one(idx, &out[cnt])) break;
    cnt++;
  }
  return cnt;
}

uint32_t wall_time_seconds(void)
{
  return HAL_GetTick() / 1000u;
}

/* 预留 CSV 导出; 无空闲导出通道(USART1=屏, UART4=传感器), 当前不实际发送 */
#define HIST_EXPORT_PUT(c) ((void)(c))

void history_export_window(uint32_t seconds)
{
  hist_rec_t r;
  uint32_t n = (seconds >= HIST_PERIOD_MS) ? (seconds / HIST_PERIOD_MS) : 1u;
  uint32_t avail = history_available();
  uint32_t i;

  if (n > avail) n = avail;
  for (i = 0; i < n; i++) {
    if (!history_read_one(i, &r)) break;
    /* TODO: 经预留导出通道输出 CSV, 如 "ts,ppm" */
    HIST_EXPORT_PUT((char)(r.ts >> 24));
    HIST_EXPORT_PUT((char)(r.ts));
    HIST_EXPORT_PUT((char)(r.ppm >> 8));
    HIST_EXPORT_PUT((char)(r.ppm & 0xFF));
  }
}