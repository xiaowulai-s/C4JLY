/*
 * history.h - 历史浓度环形存储 (W25Q16, 方案A 一芯两用)
 *
 * 扇区布局:
 *   [0x00000] 第0扇区   : 标定+设置 (param_store, 不动)
 *   [0x01000..0x1FF000] 扇区1~511 : 历史环形区 (本模块, 共 HIST_SECTORS 个扇区)
 *
 * 记录格式 (每点 6 字节, 大端):
 *   u32 时间戳(秒) + u16 ppm
 *   扇区4096B = head[4B 代数 seq] + data[4092B] = 682 × 6B
 *
 * 寻址: 单调全局序号 idx, sector=(idx/CAP)%N, off=idx%CAP。
 *       每扇区首点(off==0)先整扇区擦除并写 head=代数, 磨损均衡。
 * 容量: N*CAP*6B ≈ 2.08MB, 1s采样≈4天 覆盖窗口。
 * 时间基准: wall_time_seconds() = 开机起算秒 (无外部RTC电池, 见实现)。
 */
#ifndef HISTORY_H
#define HISTORY_H

#include <stdint.h>

/* ---- 配置 ---- */
#define HIST_PERIOD_MS     1000u   /* 采样落盘周期 ms (~1s) */
#define HIST_SECTOR_START  1u      /* 历史起始扇区 (0=param 预留) */
#define HIST_SECTORS       511u    /* 扇区数 (扇区1~511) */
#define HIST_REC_TS_SZ     4u      /* 时间戳字节数 */
#define HIST_REC_PPM_SZ    2u      /* ppm 字节数 */
#define HIST_REC_SIZE      6u      /* 每点总字节数 */
#define HIST_CAP           682u    /* 每扇区点数 = (4096-4)/6 */
#define HIST_TBL_ROWS      12u     /* 历史数据表每页行数 */
#define HIST_TBL_MAX_TS_CAP 3u     /* 表格缓冲 3 页 */

#define HIST_RING_CAP      ((uint32_t)HIST_SECTORS * HIST_CAP)

/* 单条历史记录 */
typedef struct {
  uint32_t ts;              /* 时间戳(秒) */
  uint16_t ppm;             /* 浓度 */
} hist_rec_t;

/* ---- 接口 ---- */
void    history_init(void);                 /* 上电: 扫描 head 恢复全局游标 g_written */
void    history_log(uint16_t ppm);          /* 周期落盘(内部按 HIST_PERIOD_MS 节流, 记录 ts) */
uint32_t history_available(void);           /* 当前有效点数(≤环形容量) */
int     history_read_one(uint32_t idx, hist_rec_t *r);      /* 从最旧数第 idx 个点; 返回1有效 */
uint16_t history_read_window(uint32_t seconds, hist_rec_t *out, uint16_t max_n); /* 旧→新 */
uint16_t history_read_recent(uint32_t seconds, hist_rec_t *out, uint16_t max_n); /* 新→旧 */
uint16_t history_page_count(uint16_t per);                  /* 总页数 ceil(avail/per) */
uint16_t history_read_page(uint32_t page, hist_rec_t *out, uint16_t per); /* 1=最新页, 行0=最新 */
uint32_t wall_time_seconds(void);                           /* 时间基准(秒) */
void    history_export_window(uint32_t seconds);            /* CSV 导出(预留通道) */

#endif /* HISTORY_H */