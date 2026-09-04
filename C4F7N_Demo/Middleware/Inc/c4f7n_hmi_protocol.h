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
  /* 0x21..0x23: 原曲线时段切换已移除, 复用为视图/翻页 */
  HMI_CMD_VIEW_CURVE   = 0x21,   /* 切曲线视图      */
  HMI_CMD_VIEW_DATA    = 0x22,   /* 切数据表视图    */
  HMI_CMD_TBL_NEXT     = 0x23,   /* 表下一页        */
  HMI_CMD_EXPORT       = 0x24,   /* 导出CSV         */
  HMI_CMD_TBL_PREV     = 0x25,   /* 表上一页        */
  /* 页码通知 (导航按钮 printh 4N) */
  HMI_CMD_PAGE0_ENTER  = 0x40,
  HMI_CMD_PAGE1_ENTER  = 0x41,
  HMI_CMD_PAGE2_ENTER  = 0x42,
  HMI_CMD_PAGE3_ENTER  = 0x43
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
#define OBJ_CONC_SUB    "pu"     /* 主页 单位+副标题 txt(ppm 浓度实时值 / g/年 年泄漏率) */
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
/* 历史曲线：数据由 MCU 存 W25Q16 并逐点 add 回放(屏幕 SD 被外壳遮挡、且屏内无自动回填能力, 不用屏侧存储) */
#define OBJ_HIST_RANGE  "rc"     /* 可选: 若需屏幕侧提示"切换范围" */
#define OBJ_EXPORT      "ec"     /* 可选: 若需屏幕侧提示"导出中" */
/* 电量显示 (MCU->屏幕 入站更新): 用 tjc_set_bat(pct) / HMI_CMD_SET_BAT 刷新 */
#define OBJ_BAT_CHIP    "pc2"    /* 主页顶栏电量 chip                  */
#define OBJ_BAT_CHIP_P1 "pc2_s1" /* 设置页顶栏电量 chip                */
#define OBJ_BAT_CHIP_P2 "pc2_s2" /* 历史曲线页顶栏电量 chip            */
#define OBJ_BAT_CHIP_P3 "pc2_s3" /* 关于页顶栏电量 chip                */
#define OBJ_BAT_ROW     "bat"    /* 关于页电量行 txt                   */

/* 主页顶栏状态 chip (胶囊底 + 状态圆点 + 文字标签) */
#define OBJ_PROBE_CHIP      "pc0"  /* 探头 chip 文字标签(动态文案)       */
#define OBJ_PUMP_CHIP       "pc1"  /* 泵   chip 文字标签(动态文案)       */
#define OBJ_DOT_PROBE       "pc0d" /* 主页 探头 chip 圆点 picture        */
#define OBJ_DOT_PUMP        "pc1d" /* 主页 泵   chip 圆点 picture        */
#define OBJ_DOT_PROBE_P1    "pc0d_s1"
#define OBJ_DOT_PUMP_P1     "pc1d_s1"
#define OBJ_DOT_PROBE_P2    "pc0d_s2"
#define OBJ_DOT_PUMP_P2     "pc1d_s2"
#define OBJ_DOT_PROBE_P3    "pc0d_s3"
#define OBJ_DOT_PUMP_P3     "pc1d_s3"
#define OBJ_DOT_BAT         "pc2d" /* 主页 电量 chip 圆点 picture        */
#define OBJ_DOT_BAT_P1      "pc2d_s1" /* 设置页 电量圆点                 */
#define OBJ_DOT_BAT_P2      "pc2d_s2" /* 历史曲线页 电量圆点              */
#define OBJ_DOT_BAT_P3      "pc2d_s3" /* 关于页 电量圆点                  */
/* 状态圆点图片 ID (导入 GUI 后分配) */
#define PIC_DOT_GREEN       5      /* 已连接/运行/高电量                */
#define PIC_DOT_GRAY        4      /* 未连接/停止                       */
#define PIC_DOT_AMBER       3      /* 中电量                            */
#define PIC_DOT_RED         6      /* 低电量                            */
/* 电量圆点变色阈值(%) */
#define BAT_DOT_WARN_PCT    50     /* pct>=此值 绿; >=LOW 橙; 其它红     */
#define BAT_DOT_LOW_PCT     20

/* 历史曲线页 · 分割页 (视图切换 + 数据表) */
#define OBJ_TBL_PANEL   "p2D"    /* 数据表视图面板                     */
#define OBJ_TBL_HEAD_T  "ht"     /* 表头-时间(居中)                     */
#define OBJ_TBL_HEAD_P  "hc"     /* 表头-浓度(居中)                     */
#define OBJ_TBL_TIME_BASE "tt"   /* 表格时间行 tt0..tt11 (居中 text)  */
#define OBJ_TBL_PPM_BASE  "np"   /* 表格浓度行 np0..np11 (居中 text)   */
#define OBJ_TBL_PAGE    "pg"     /* 页指示 第x/y页                     */
#define OBJ_SW_CURVE    "sw0"    /* 曲线视图按钮(状态高亮)              */
#define OBJ_SW_DATA     "sw1"    /* 数据表视图按钮(状态高亮)            */
/* 曲线组常显对象(需 vis 隐藏以切到表格) */
#define OBJ_CT_TITLE    "ctt"    /* 曲线标题                          */
#define OBJ_CT_LEG      "leg"    /* 图例                              */
#define OBJ_CT_ALARM    "alarm"  /* 报警线                            */
#define OBJ_CT_PL       "p2L"    /* 曲线左面板(装饰)                   */
#define OBJ_CT_PR       "p2R"    /* 曲线右面板(装饰)                   */
#define OBJ_CT_WAVE     "wv"     /* 波形                              */

/* =====================================================================
 * 3. 指令拼装宏 (须自行追加帧尾 0xFF 0xFF 0xFF)
 * ===================================================================== */
#define HMI_CMD_SET_VAL(obj, v)        sprintf(cmd, "%s.val=%d",    (obj), (int)(v))
#define HMI_CMD_SET_TXT(obj, t)        sprintf(cmd, "%s.txt=\"%s\"",(obj), (t))
#define HMI_CMD_SET_PCO(obj, c)        sprintf(cmd, "%s.pco=%d",    (obj), (int)(c))
#define HMI_CMD_SET_PIC(obj, id)       sprintf(cmd, "%s.pic=%d",    (obj), (int)(id))
#define HMI_CMD_SET_VIS(obj, v)        sprintf(cmd, "vis %s,%d",    (obj), (int)(v))
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