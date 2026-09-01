/*
 * w25q16.h - W25Q16 SPI NOR Flash 驱动 (SPI1, CS=PA4)
 *
 *   SPI1: SCK=PA5, MISO=PA6, MOSI=PA7, CS=PA4 (软件片选)
 *   容量: 2MB (16Mbit) / 扇区 4KB / 块 64KB
 *
 * 注意:
 *  - 写入前必须擦除所在扇区 (flash 只能 1->0)。
 *  - 擦除以扇区(4KB)为单位, erase_comma 会全片擦(慢, ~10s)。
 */
#ifndef W25Q16_H
#define W25Q16_H

#include <stdint.h>

/* ---- 容量 ---- */
#define W25Q16_SECTOR_SIZE   4096
#define W25Q16_BLOCK_SIZE    65536
#define W25Q16_PAGE_SIZE     256
#define W25Q16_NUM_SECTORS   512   /* 2MB / 4KB */

/* ---- 常用命令 ---- */
#define W25X_WriteEnable      0x06
#define W25X_WriteDisable     0x04
#define W25X_ReadStatusReg1   0x05
#define W25X_WriteStatusReg   0x01
#define W25X_ReadData         0x03
#define W25X_FastReadData     0x0B
#define W25X_PageProgram      0x02
#define W25X_SectorErase      0x20
#define W25X_BlockErase       0xD8
#define W25X_ChipErase        0xC7
#define W25X_ReadJEDECID      0x9F

/* 初始化: 配置 SPI1 + CS, 校验芯片 ID (可选) */
void    w25q16_init(void);

/* 读取 JEDEC ID (0xEF 0x4015 = W25Q16) */
uint32_t w25q16_read_id(void);

/* 读 len 字节到 buf (addr 任意) */
void    w25q16_read(uint32_t addr, uint8_t *buf, uint32_t len);

/* 擦除一个扇区 (4KB, addr 需 4KB 对齐) */
void    w25q16_erase_sector(uint32_t addr);

/* 页编程 (最多 256B, 页内不可跨页), addr 通常页对齐 */
void    w25q16_page_program(uint32_t addr, const uint8_t *buf, uint32_t len);

/* 写任意长度 (addr 可不对齐, 内部自动换页); 调用前需先擦除目标扇区 */
void    w25q16_write(uint32_t addr, const uint8_t *buf, uint32_t len);

#endif /* W25Q16_H */