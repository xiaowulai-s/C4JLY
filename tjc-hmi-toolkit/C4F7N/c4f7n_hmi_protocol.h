/*
 * c4f7n_hmi_protocol.h - C4F7N 检漏仪 屏幕(USART HMI) ↔ MCU(STM32F103) 协议适配
 *
 * 生成: tjc-hmi-toolkit 程序化管线 (2026-08-26)
 * 背景: 事件脚本行硬限制 ≤15B → 对象短名化 + print 关键字缩短。
 *       MCU 固件必须同步本文件的全部映射，否则收不到屏幕上报 / 指令找不到对象。
 * 配套: tjc-hmi-toolkit/C4F7N/C4F7N_HMI_生成映射表.md
 *
 * 串口: USART1 (PA9/PA10) @ 115200, 帧尾 0xFF 0xFF 0xFF
 */

#ifndef C4F7N_HMI_PROTOCOL_H
#define C4F7N_HMI_PROTOCOL_H

/* =====================================================================
 * 1a. 屏幕 → MCU 命令码 (printh 单字节上报, v2)
 *   背景: TJC 不支持 Nextion 的 print; prints 发长关键字超 15B 脚本行上限
 *         (引擎把 L>=16 当 attr → 越界)。改用 TJC 原生 printh 发 1 字节命令码。
 *   HMI 侧脚本:  `printh NN` (9B)  |  MCU 端收 1 字节按下表分发。
 *   命令码 0x01~0x24 均为私有; MCU 需过滤与 0xFF 帧尾冲突的字节。
 * ===================================================================== */
#define HMI_CMD_PEAK_RESET    0x01   /* 重置峰值      (页0 重置峰值)          */
#define HMI_CMD_THR_HI        0x11   /* 高报阈值变更  (设置 高报 +/-, 值用 get 回读) */
#define HMI_CMD_THR_LO        0x12   /* 低报阈值变更  (设置 低报 +/-, 值用 get 回读) */
#define HMI_CMD_UNIT_TOG      0x13   /* 单位切换 ppm↔g/年                      */
#define HMI_CMD_BUZ_TOG       0x14   /* 蜂鸣器开关                             */
#define HMI_CMD_CAL_ZERO      0x15   /* 零点标定                               */
#define HMI_CMD_CAL_SPAN      0x16   /* 量程标定                               */
#define HMI_CMD_CAL_FAC       0x17   /* 恢复出厂                               */
#define HMI_CMD_RANGE_10M     0x21   /* 曲线 10 分钟                           */
#define HMI_CMD_RANGE_1H      0x22   /* 曲线 1 小时                             */
#define HMI_CMD_RANGE_24H     0x23   /* 曲线 24 小时                           */
#define HMI_CMD_EXPORT        0x24   /* 导出 CSV (USB CDC)                     */

/* 阈值/其它数值回读: HMI .val 变化后 MCU 主动发送(带帧尾)读取:
 *   get h.val\xff\xff\xff  高报值 (对应用 h)
 *   get l.val\xff\xff\xff  低报值 (对应用 l)
 * 详见 C4F7N_HMI_命令码协议_v2.md */

/* =====================================================================
 * 2. MCU → 屏幕 对象名映射 (短名 = 产物内真实对象名)
 *    用法: snprintf(cmd, sizeof(cmd), "%s.val=%d", OBJ_CONC, value);
 * ===================================================================== */
#define OBJ_CONC        "cc"     /* 浓度大字  vvs=2 → val=42 显示 0.42  */
#define OBJ_PEAK        "pv"     /* 峰值      vvs=2                    */
#define OBJ_BADGE_AVG   "ba"     /* 均值徽章 txt                      */
#define OBJ_STRIP       "ps"     /* 报警色条 pco=9771绿/62689橙/59944红 */
#define OBJ_T90         "p9"     /* 状态行   txt                      */
#define OBJ_FLOW        "pf"     /* 状态行   txt                      */
#define OBJ_TEMP        "pt"     /* 状态行   txt                      */
#define OBJ_THR         "pth"    /* 状态行   txt                      */
#define OBJ_THR_HI_VAL  "h"      /* 高报值   vvs=0 整数                */
#define OBJ_THR_LO_VAL  "l"      /* 低报值   vvs=0 整数                */
#define OBJ_UNIT_BTN    "u"      /* 单位按钮 txt (ppm/g/年)            */
#define OBJ_BUZ_BTN     "bb"     /* 蜂鸣按钮 txt/bco                  */
/* 电量显示 (MCU→屏 入站更新): 用 HMI_CMD_SET_BAT(obj,pct) 刷新 */
#define OBJ_BAT_CHIP    "pc2"    /* 主页顶栏电量 chip                  */
#define OBJ_BAT_CHIP_P1 "pc2_s1" /* 设置页顶栏电量 chip                */
#define OBJ_BAT_CHIP_P2 "pc2_s2" /* 历史曲线页顶栏电量 chip            */
#define OBJ_BAT_CHIP_P3 "pc2_s3" /* 关于页顶栏电量 chip                */
#define OBJ_BAT_ROW     "bat"    /* 关于页电量行 txt                   */
#define OBJ_CAL0_BTN    "c0"     /* 零点标定按钮 txt 复位="执行"       */
#define OBJ_CAL1_BTN    "c1"     /* 量程标定按钮 txt 复位="执行"       */
#define OBJ_STAT_MAX    "mx"     /* 曲线统计 txt                      */
#define OBJ_STAT_AVG    "av"     /* 曲线统计 txt                      */
#define OBJ_STAT_MIN    "mn"     /* 曲线统计 txt                      */
#define OBJ_STAT_DUR    "du"     /* 曲线统计 txt                      */
#define OBJ_STAT_CNT    "ct"     /* 曲线统计 txt                      */
#define OBJ_PROBE_ST    "pst"    /* 探头状态 txt (断连改红色)          */
#define OBJ_WAVE        "wv"     /* 波形控件 (add 0,val 喂点)          */

/* =====================================================================
 * 3. 常用指令拼装宏 (frame: 指令 + 0xFF 0xFF 0xFF)
 * ===================================================================== */
#define HMI_CMD_SET_VAL(obj, v)        sprintf(cmd, "%s.val=%d",   (obj), (int)(v))
#define HMI_CMD_SET_TXT(obj, t)        sprintf(cmd, "%s.txt=\"%s\"", (obj), (t))
#define HMI_CMD_SET_PCO(obj, c)        sprintf(cmd, "%s.pco=%d",  (obj), (int)(c))
#define HMI_CMD_SET_BAT(obj, pct)      sprintf(cmd, "%s.txt=\"电量 %d%%\"", (obj), (int)(pct))/* 电量 0~100 */
#define HMI_CMD_PAGE(n)                sprintf(cmd, "page %d",    (int)(n))
#define HMI_CMD_WAVE_ADD(ch, v)        sprintf(cmd, "add %d,%d",  (int)(ch), (int)(v)) /* v:0~255 */
#define HMI_CMD_WAVE_CLS(ch)           sprintf(cmd, "cls %d",     (int)(ch))
#define HMI_CMD_DIM(v)                 sprintf(cmd, "dim=%d",     (int)(v))
#define HMI_CMD_BEEP()                 sprintf(cmd, "beep 1")

/* 常用色值 (RGB565 十进制, 见搭建清单 §9) */
#define C_STRIP_GREEN   9771
#define C_STRIP_ORANGE  62689
#define C_STRIP_RED     59944

/* 告警条颜色切换示例: HMI_CMD_SET_PCO(OBJ_STRIP, C_STRIP_RED); */

#endif /* C4F7N_HMI_PROTOCOL_H */
