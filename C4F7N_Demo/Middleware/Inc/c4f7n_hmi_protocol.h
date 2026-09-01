/*
 * c4f7n_hmi_protocol.h - C4F7N 检漏仪 屏幕(USART HMI TJC X5) <-> MCU(STM32F103RCT6)
 *
 * 版本: v2 (命令码)  配套屏幕工程: C4F7N_HMI_v18.HMI
 * 串口: USART1 PA9(TX)/PA10(RX) @ 115200 8N1, 无流控
 *
 * --- 屏幕 -> MCU (用户交互, 脉冲单字节) ---
 *   屏幕用 TJC 脚本 `printh NN` 发 1 字节命令码; MCU 收到即触发动作, 无需帧尾。
 *   (背景: TJC 不支持 Nextion 的 print; 脚本行必须 <=15B)
 *
 * --- MCU -> 屏幕 (Nextion 文本指令) ---
 *   obj.attr=value 必须以 0xFF 0xFF 0xFF 结尾; 否则指令挂起。
 */
#ifndef C4F7N_HMI_PROTOCOL_H
#define C4F7N_HMI_PROTOCOL_H

/* =====================================================================
 * 1. 屏幕 -> MCU 命令码 (printh 单字节)
 * ===================================================================== */
typedef enum {
  HMI_CMD_NONE         = 0x00,
  HMI_CMD_PEAK_RESET   = 0x01,   /* 重置峰值        */
  HMI_CMD_THR_HI       = 0x11,   /* 高报阈值变更    */
  HMI_CMD_THR_LO       = 0x12,   /* 低报阈值变更    */
  HMI_CMD_UNIT_TOG     = 0x13,   /* 单位切换        */
  HMI_CMD_BUZ_TOG      = 0x14,   /* 蜂鸣器开关      */
  HMI_CMD_CAL_ZERO     = 0x15,   /* 零点标定        */
  HMI_CMD_CAL_SPAN     = 0x16,   /* 量程标定        */
  HMI_CMD_CAL_FAC      = 0x17,   /* 恢复出厂        */
  HMI_CMD_RANGE_10M    = 0x21,   /* 曲线 10分钟     */
  HMI_CMD_RANGE_1H     = 0x22,   /* 曲线 1小时      */
  HMI_CMD_RANGE_24H    = 0x23,   /* 曲线 24小时     */
  HMI_CMD_EXPORT       = 0x24    /* 导出CSV         */
} hmi_cmd_t;

/* =====================================================================
 * 2. MCU -> 屏幕 对象名 (短名 = 工程内真实对象名)
 * ===================================================================== */
#define OBJ_CONC        "cc"     /* 浓度大字  vvs=2 -> val=42 显示 0.42  */
#define OBJ_PEAK        "pv"     /* 峰值      vvs=2                    */
#define OBJ_BADGE_AVG   "ba"     /* 均值徽章 txt                       */
#define OBJ_STRIP       "ps"     /* 报警色条 pco                       */
#define OBJ_T90         "p9"     /* T90 状态行 txt                     */
#define OBJ_FLOW        "pf"     /* 流量状态行 txt                     */
#define OBJ_TEMP        "pt"     /* 温度状态行 txt                     */
#define OBJ_THR         "pth"    /* 阈值状态行 txt                     */
#define OBJ_THR_HI_VAL  "h"      /* 高报值   vvs=0 整数                */
#define OBJ_THR_LO_VAL  "l"      /* 低报值   vvs=0 整数                */
#define OBJ_UNIT_BTN    "u"      /* 单位按钮 txt                       */
#define OBJ_BUZ_BTN     "bb"     /* 蜂鸣按钮 txt                       */
#define OBJ_CAL0_BTN    "c0"     /* 零点标定按钮 txt 复位="执行"        */
#define OBJ_CAL1_BTN    "c1"     /* 量程标定按钮 txt 复位="执行"        */
#define OBJ_STAT_MAX    "mx"     /* 曲线统计 txt                       */
#define OBJ_STAT_AVG    "av"
#define OBJ_STAT_MIN    "mn"
#define OBJ_STAT_DUR    "du"
#define OBJ_STAT_CNT    "ct"
#define OBJ_PROBE_ST    "pst"    /* 探头状态 txt                       */
#define OBJ_WAVE        "wv"     /* 波形控件 add 0,val                 */
/* 电量显示 (MCU->屏幕 入站更新): 用 tjc_set_bat(pct) / HMI_CMD_SET_BAT 刷新 */
#define OBJ_BAT_CHIP    "pc2"    /* 主页顶栏电量 chip                  */
#define OBJ_BAT_CHIP_P1 "pc2_s1" /* 设置页顶栏电量 chip                */
#define OBJ_BAT_CHIP_P2 "pc2_s2" /* 历史曲线页顶栏电量 chip            */
#define OBJ_BAT_CHIP_P3 "pc2_s3" /* 关于页顶栏电量 chip                */
#define OBJ_BAT_ROW     "bat"    /* 关于页电量行 txt                   */

/* =====================================================================
 * 3. 指令拼装宏 (须自行追加帧尾 0xFF 0xFF 0xFF)
 * ===================================================================== */
#define HMI_CMD_SET_VAL(obj, v)        sprintf(cmd, "%s.val=%d",    (obj), (int)(v))
#define HMI_CMD_SET_TXT(obj, t)        sprintf(cmd, "%s.txt=\"%s\"",(obj), (t))
#define HMI_CMD_SET_PCO(obj, c)        sprintf(cmd, "%s.pco=%d",    (obj), (int)(c))
#define HMI_CMD_SET_BAT(obj, pct)      sprintf(cmd, "%s.txt=\"电量 %d%%\"", (obj), (int)(pct))/* pct:0~100 */
#define HMI_CMD_PAGE(n)                sprintf(cmd, "page %d",      (int)(n))
#define HMI_CMD_WAVE_ADD(ch, v)        sprintf(cmd, "add %d,%d",    (int)(ch), (int)(v))
#define HMI_CMD_WAVE_CLS(ch)           sprintf(cmd, "cls %d",       (int)(ch))
#define HMI_CMD_DIM(v)                 sprintf(cmd, "dim=%d",       (int)(v))
#define HMI_CMD_BEEP()                 sprintf(cmd, "beep 1")
#define HMI_CMD_GET(obj,prop)          sprintf(cmd, "get %s.%s",    (obj), (prop))

/* 颜色 (RGB565 十进制) */
#define C_STRIP_GREEN   9771
#define C_STRIP_ORANGE  62689
#define C_STRIP_RED     59944

#endif /* C4F7N_HMI_PROTOCOL_H */