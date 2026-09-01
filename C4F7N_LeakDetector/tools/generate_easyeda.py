#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
C4F7N 检漏仪 - 立创EDA标准版(EasyEDA)原理图 JSON 生成器
输出: C4F7N_MainBoard.json (docType 1)
格式: shape 为 ~/^^/#@$ 分隔字符串数组; 坐标 1 单位 = 0.254mm
"""
import json
import os
import uuid

OUT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JSON_FILE = os.path.join(OUT_DIR, "C4F7N_MainBoard.json")

UID_N = [0]
def gid():
    UID_N[0] += 1
    return "gge%016x" % UID_N[0]

def uuid32():
    return uuid.uuid4().hex

E = 0.254  # mm per EasyEDA unit

def to_e(mm):
    return round(mm / E)

# ============ 符号库定义 (mm 坐标, KiCad 惯例 y 向上) ============
# name -> (pins=[(num,name,ptype,px,py,angle)], body=(x1,y1,x2,y2))
SYMBOLS = {}

def sym(name, pins, body):
    SYMBOLS[name] = (pins, body)

sym("R", [("1","","passive",-3.81,0,0),("2","","passive",3.81,0,180)], (-3.81,-1.27,3.81,1.27))
sym("C", [("1","","passive",-3.81,0,0),("2","","passive",3.81,0,180)], (-3.81,-1.27,3.81,1.27))
sym("C_POL", [("1","+","passive",-3.81,0,0),("2","-","passive",3.81,0,180)], (-3.81,-1.27,3.81,1.27))
sym("L", [("1","","passive",-7.62,0,0),("2","","passive",7.62,0,180)], (-7.62,-1.27,7.62,1.27))
sym("D_SCHOTTKY", [("1","A","passive",-3.81,0,0),("2","K","passive",3.81,0,180)], (-3.81,-1.27,3.81,1.27))
sym("LED", [("1","A","passive",-3.81,0,0),("2","K","passive",3.81,0,180)], (-3.81,-1.27,3.81,1.27))
sym("FUSE", [("1","","passive",-3.81,0,0),("2","","passive",3.81,0,180)], (-3.81,-1.27,3.81,1.27))
sym("CRYSTAL", [("1","X1","passive",-5.08,0,0),("2","X2","passive",5.08,0,180)], (-5.08,-1.27,5.08,1.27))
sym("SWITCH", [("1","","passive",-2.54,0,0),("2","","passive",2.54,0,180)], (-2.54,-1.27,2.54,1.27))
sym("BUZZER", [("1","","passive",-3.81,0,0),("2","","passive",3.81,0,180)], (-3.81,-1.27,3.81,1.27))
sym("BATTERY", [("1","+","power_in",-3.81,0,0),("2","-","power_in",3.81,0,180)], (-3.81,-1.27,3.81,1.27))
sym("CONN2", [("1","","passive",0,-2.54,90),("2","","passive",0,2.54,270)], (-1.27,-3.81,1.27,3.81))
sym("CONN4", [("1","","passive",0,-3.81,90),("2","","passive",0,-1.27,90),("3","","passive",0,1.27,270),("4","","passive",0,3.81,270)], (-1.27,-5.08,1.27,5.08))
sym("Q_NMOS_GDS", [("1","G","input",-3.81,0,0),("2","D","passive",3.81,-1.27,180),("3","S","passive",3.81,1.27,180)], (-3.81,-2.54,3.81,2.54))
sym("Q_NPN_BCE", [("1","B","input",-3.81,1.27,0),("2","C","passive",3.81,-1.27,180),("3","E","passive",3.81,1.27,180)], (-3.81,-2.54,3.81,2.54))
sym("TP4056", [("1","VCC","power_in",-8.89,3.81,0),("2","CE","input",-8.89,1.27,0),("3","PROG","passive",-8.89,-1.27,0),("4","TEMP","input",-8.89,-3.81,0),
               ("5","STDBY","open_collector",8.89,3.81,180),("6","CHRG","open_collector",8.89,1.27,180),("7","BAT","power_out",8.89,-1.27,180),("8","GND","power_in",8.89,-3.81,180)], (-8.89,-5.08,8.89,5.08))
sym("MT3608", [("1","SW","passive",-8.89,2.54,0),("2","GND","power_in",-8.89,0,0),("3","FB","input",-8.89,-2.54,0),
               ("4","EN","input",8.89,2.54,180),("5","VIN","power_in",8.89,0,180),("6","VOUT","power_out",8.89,-2.54,180)], (-8.89,-3.81,8.89,3.81))
sym("AMS1117", [("1","GND","power_in",-7.62,1.27,0),("2","VOUT","power_out",-7.62,-1.27,0),("3","VIN","power_in",7.62,0,180)], (-7.62,-2.54,7.62,2.54))
sym("W25Q16", [("1","/CS","input",-8.89,3.81,0),("2","DO","output",-8.89,1.27,0),("3","/WP","input",-8.89,-1.27,0),("4","GND","power_in",-8.89,-3.81,0),
               ("5","DI","input",8.89,3.81,180),("6","CLK","input",8.89,1.27,180),("7","/HOLD","input",8.89,-1.27,180),("8","VCC","power_in",8.89,-3.81,180)], (-8.89,-5.08,8.89,5.08))
sym("MAX3485", [("1","RO","output",-8.89,3.81,0),("2","/RE","input",-8.89,1.27,0),("3","DE","input",-8.89,-1.27,0),("4","DI","input",-8.89,-3.81,0),
                ("5","GND","power_in",8.89,3.81,180),("6","A","bidirectional",8.89,1.27,180),("7","B","bidirectional",8.89,-1.27,180),("8","VCC","power_in",8.89,-3.81,180)], (-8.89,-5.08,8.89,5.08))
sym("USB_C", [("1","VBUS","power_in",-6.35,3.81,0),("2","D+","bidirectional",-6.35,1.27,0),("3","D-","bidirectional",-6.35,-1.27,0),("4","CC1","passive",-6.35,-3.81,0),
              ("5","GND","power_in",6.35,3.81,180),("6","CC2","passive",6.35,1.27,180),("7","SHIELD","passive",6.35,-1.27,180),("8","NC","no_connect",6.35,-3.81,180)], (-6.35,-5.08,6.35,5.08))

STM_LEFT = [("VDD","power_in"),("VSS","power_in"),("VDDA","power_in"),("VBAT","power_in"),("NRST","input"),
            ("BOOT0","input"),("PA13","bidirectional"),("PA14","bidirectional"),("PB3","bidirectional"),
            ("PB4","bidirectional"),("PB5","bidirectional"),("PB0","bidirectional"),("PB1","bidirectional")]
STM_RIGHT = [("PA0","bidirectional"),("PA1","bidirectional"),("PA2","bidirectional"),("PA3","bidirectional"),
             ("PA4","bidirectional"),("PA5","bidirectional"),("PA6","bidirectional"),("PA7","bidirectional"),
             ("PA9","bidirectional"),("PA10","bidirectional"),("PA11","bidirectional"),("PA12","bidirectional"),
             ("PA15","bidirectional"),("PD0","bidirectional"),("PD1","bidirectional")]
def build_stm_pins():
    pins = []
    y = 10.16
    for (name, pt) in STM_LEFT:
        pins.append((str(len(pins)+1), name, pt, -10.16, y, 0)); y -= 2.54
    y = 10.16
    for (name, pt) in STM_RIGHT:
        pins.append((str(len(pins)+1), name, pt, 10.16, y, 180)); y -= 2.54
    return pins
sym("STM32F103", build_stm_pins(), (-10.16, 12.7, 10.16, -35.56))

# ============ 实例定义 (与 KiCad 生成器一致) ============
I = []
def add(ref, lib, value, fp, x, y, rot, nets):
    I.append((ref, lib, value, fp, x, y, rot, nets))

def cap(ref, val, fp, x, y, n1, n2, pol=False):
    add(ref, "C_POL" if pol else "C", val, fp, x, y, 0, {"1": n1, "2": n2})

# ---- 电源区 ----
add("J1","USB_C","USB-C","USB_C_Receptacle_HRO_TYPE-C-31-M-12", 35, 170, 0,
    {"1":"VBUS","2":"USB_DP","3":"USB_DM","4":"CC1","5":"GND","6":"CC2","7":"GND","8":"NC"})
add("F1","FUSE","500mA","Fuse_0805_2012Metric", 35, 152, 0, {"1":"VBUS","2":"VBUS_F"})
add("U1","TP4056","TP4056","SOP-8_3.9x4.9mm_P1.27mm", 35, 122, 0,
    {"1":"VBUS_F","2":"5V","3":"PROG","4":"TEMP_NC","5":"STDBY_NC","6":"CHRG","7":"BAT","8":"GND"})
add("R1","R","1.2k","R_0603_1608Metric", 62, 106, 0, {"1":"PROG","2":"GND"})
add("D1","LED","LED_RED","LED_0805_2012Metric", 62, 136, 0, {"1":"3V3","2":"CHRG"})
add("BT1","BATTERY","18650x2","Battery_Holder", 82, 170, 0, {"1":"BAT","2":"GND"})
add("U2","MT3608","MT3608","SOT-23-6", 35, 72, 0, {"1":"SW","2":"GND","3":"FB","4":"EN","5":"BAT","6":"VOUT5"})
add("L1","L","10uH","L_0805_2012Metric", 62, 92, 0, {"1":"BAT","2":"SW"})
add("D2","D_SCHOTTKY","SS34","D_SMA", 62, 72, 0, {"1":"SW","2":"VOUT5"})
add("R2","R","100k","R_0603_1608Metric", 62, 58, 0, {"1":"VOUT5","2":"FB"})
add("R3","R","20k","R_0603_1608Metric", 62, 44, 0, {"1":"FB","2":"GND"})
add("R12","R","5.1k","R_0603_1608Metric", 60, 190, 0, {"1":"CC1","2":"GND"})
add("R13","R","5.1k","R_0603_1608Metric", 60, 205, 0, {"1":"CC2","2":"GND"})
add("U3","AMS1117","AMS1117-3.3","SOT-223-3", 35, 28, 0, {"1":"GND","2":"3V3","3":"VOUT5"})
cap("C1","10uF","C_0805_2012Metric", 58, 100, "BAT", "GND")
cap("C2","22uF","C_0805_2012Metric", 58, 60, "VOUT5", "GND")
cap("C3","10uF","C_0805_2012Metric", 58, 40, "VOUT5", "GND")
cap("C4","10uF","C_0805_2012Metric", 58, 18, "3V3", "GND")
cap("C5","100nF","C_0603_1608Metric", 88, 96, "3V3", "GND")
cap("C6","100nF","C_0603_1608Metric", 88, 108, "3V3", "GND")
cap("C7","20pF","C_0603_1608Metric", 175, 78, "OSC_IN", "GND")
cap("C8","20pF","C_0603_1608Metric", 175, 58, "OSC_OUT", "GND")
cap("C9","100nF","C_0603_1608Metric", 88, 60, "3V3", "GND")
cap("C10","100nF","C_0603_1608Metric", 88, 40, "3V3", "GND")
cap("C11","100nF","C_0603_1608Metric", 120, 175, "3V3", "GND")
cap("C12","100nF","C_0603_1608Metric", 120, 160, "3V3", "GND")
cap("C13","100nF","C_0603_1608Metric", 88, 22, "5V", "GND")
cap("C14","100nF","C_0603_1608Metric", 105, 40, "VBAT_SENSE", "GND")

# ---- MCU 区 ----
add("U4","STM32F103","STM32F103C8T6","LQFP-48_7x7mm_P0.5mm", 150, 105, 0, {
    "1":"3V3","2":"GND","3":"3V3","4":"3V3","5":"RST","6":"BOOT0",
    "7":"SWDIO","8":"SWCLK","9":"KEY1","10":"KEY2","11":"KEY3","12":"LED_GREEN","13":"VBAT_SENSE",
    "14":"PUMP_CTRL","15":"BEEP","16":"RS485_TX","17":"RS485_RX","18":"SPI_CS","19":"SPI_SCK",
    "20":"SPI_MISO","21":"SPI_MOSI","22":"LCD_TX","23":"LCD_RX","24":"USB_DM","25":"USB_DP",
    "26":"LED_RED","27":"OSC_IN","28":"OSC_OUT"})
add("Y1","CRYSTAL","8MHz","Crystal_SMD_3215-4Pin", 192, 92, 0, {"1":"OSC_IN","2":"OSC_OUT"})
add("R4","R","1M","R_0603_1608Metric", 192, 112, 0, {"1":"OSC_IN","2":"OSC_OUT"})
add("R5","R","10k","R_0603_1608Metric", 112, 152, 0, {"1":"3V3","2":"RST"})
add("SW1","SWITCH","RESET","SW_Push_6x6mm", 112, 138, 0, {"1":"RST","2":"GND"})
add("R6","R","10k","R_0603_1608Metric", 112, 118, 0, {"1":"BOOT0","2":"GND"})
add("J6","CONN4","SWD","PinHeader_1x04_P2.54mm_Vertical", 192, 58, 0, {"1":"3V3","2":"SWDIO","3":"SWCLK","4":"GND"})
add("R22","R","100k","R_0603_1608Metric", 105, 72, 0, {"1":"BAT","2":"VBAT_SENSE"})
add("R23","R","100k","R_0603_1608Metric", 105, 56, 0, {"1":"VBAT_SENSE","2":"GND"})

# ---- 接口区 ----
add("J2","CONN4","LCD_4.3","PinHeader_1x04_P2.54mm_Vertical", 255, 170, 0, {"1":"5V","2":"GND","3":"LCD_TX","4":"LCD_RX"})
add("U5","MAX3485","MAX3485","SOIC-8_3.9x4.9mm_P1.27mm", 230, 122, 0,
    {"1":"RS485_RX","2":"RS485_DE","3":"RS485_DE","4":"RS485_TX","5":"GND","6":"RS485_A","7":"RS485_B","8":"3V3"})
add("R9","R","120R","R_0603_1608Metric", 262, 122, 0, {"1":"RS485_A","2":"RS485_B"})
add("J3","CONN4","PROBE_GX12","PinHeader_1x04_P2.54mm_Vertical", 255, 92, 0, {"1":"5V","2":"GND","3":"RS485_A","4":"RS485_B"})
add("U6","W25Q16","W25Q16","SOIC-8_3.9x4.9mm_P1.27mm", 230, 38, 0,
    {"1":"SPI_CS","2":"SPI_MISO","3":"3V3","4":"GND","5":"SPI_MOSI","6":"SPI_SCK","7":"3V3","8":"3V3"})

# ---- 驱动/报警 ----
add("Q1","Q_NMOS_GDS","SI2302","SOT-23", 130, 34, 0, {"1":"PUMP_CTRL","2":"PUMP_N","3":"GND"})
add("R15","R","100k","R_0603_1608Metric", 112, 40, 0, {"1":"PUMP_CTRL","2":"GND"})
add("D3","D_SCHOTTKY","1N5819","D_SMA", 150, 24, 0, {"1":"PUMP_N","2":"VOUT5"})
add("J4","CONN2","PUMP","PinHeader_1x02_P2.54mm_Vertical", 172, 34, 0, {"1":"VOUT5","2":"PUMP_N"})
add("Q2","Q_NPN_BCE","MMBT2222","SOT-23", 130, 12, 0, {"1":"BEEP_B","2":"BZ_C","3":"GND"})
add("R16","R","1k","R_0603_1608Metric", 112, 12, 0, {"1":"BEEP","2":"BEEP_B"})
add("BZ1","BUZZER","BUZZER_5V","Buzzer_12x9.5RM7.6", 155, 8, 0, {"1":"3V3","2":"BZ_C"})
add("R17","R","330R","R_0603_1608Metric", 178, 34, 0, {"1":"LED_RED","2":"LED_A"})
add("LED1","LED","LED_RED","LED_0805_2012Metric", 192, 34, 0, {"1":"LED_A","2":"GND"})
add("R18","R","330R","R_0603_1608Metric", 178, 20, 0, {"1":"LED_GREEN","2":"LED_G_A"})
add("LED2","LED","LED_GREEN","LED_0805_2012Metric", 192, 20, 0, {"1":"LED_G_A","2":"GND"})
add("SW2","SWITCH","KEY1","SW_Push_6x6mm", 150, 168, 0, {"1":"KEY1","2":"GND"})
add("SW3","SWITCH","KEY2","SW_Push_6x6mm", 168, 168, 0, {"1":"KEY2","2":"GND"})
add("SW4","SWITCH","KEY3","SW_Push_6x6mm", 186, 168, 0, {"1":"KEY3","2":"GND"})

# ============ 生成 shape ============
# KiCad pin angle -> EasyEDA 引线路径 (h=水平,v=垂直; 从连接点向外)
def pin_path(pang):
    # KiCad angle: 0=外线向左, 180=向右, 90=向上, 270=向下
    if pang == 0:   return "h -10", (-10, 0)
    if pang == 180: return "h 10",  (10, 0)
    if pang == 90:  return "v -10", (0, -10)
    if pang == 270: return "v 10",  (0, 10)
    return "h -10", (-10, 0)

def elec_type(pt):
    return {"input": "1", "output": "2", "bidirectional": "3", "passive": "4"}.get(pt, "0")

def ref_prefix(ref):
    return ref[0] if ref[0].isalpha() else "U"

shape = []
net_labels = 0

for (ref, lib, value, fp, x, y, rot, nets) in I:
    pins, body = SYMBOLS[lib]
    ex, ey = to_e(x), to_e(y)
    cpara = "`" + "`".join(["package", fp, "Contributor", "LCEDA_Lib", "spicePre", ref_prefix(ref), "spiceSymbolName", lib]) + "`"
    lib_head = f"LIB~{ex}~{ey}~{cpara}~~0~{gid()}~{uuid32()}~{uuid32()}~0~~yes~yes"
    children = []
    # Reference (T~P) 与 Value (T~N)
    children.append(f"T~P~{to_e(-12)}~{to_e(7)}~0~#000080~Arial~~~~~comment~{ref}~1~start~{gid()}~0")
    children.append(f"T~N~{to_e(-12)}~{to_e(-7)}~0~#000080~Arial~~~~~comment~{value}~1~start~{gid()}~0")
    # body 矩形 (左上角, 翻转 y)
    bx1, by1, bx2, by2 = body
    rx1, ry1 = to_e(bx1), to_e(-by2)
    rw, rh = to_e(bx2 - bx1), to_e(by2 - by1)
    children.append(f"R~{rx1}~{ry1}~~~{rw}~{rh}~#000000~1~0~none~{gid()}~0~")
    # 引脚
    for idx, (num, pname, ptype, px, py_, pang) in enumerate(pins, start=1):
        epx, epy = to_e(px), to_e(-py_)
        dotX, dotY = ex + epx, ey + epy
        path, dvec = pin_path(pang)
        seg1 = f"P~show~0~{idx}~{dotX}~{dotY}~0~{gid()}~0"
        seg2 = f"{dotX}~{dotY}"
        seg3 = f"M {dotX} {dotY} {path}~#000000"
        seg4 = f"0~0~0~0~2~{pname}~Arial~7pt~#000000"
        seg5 = f"0~0~0~0~2~{num}~Arial~7pt~#000000"
        seg6 = "0~0~0"
        seg7 = "0~"
        children.append("^^".join([seg1, seg2, seg3, seg4, seg5, seg6, seg7]))
        # 外部 wire + netLabel (顶层, 图纸绝对坐标)
        if num in nets:
            ex2, ey2 = dotX + dvec[0], dotY + dvec[1]
            ex3, ey3 = dotX + 2 * dvec[0], dotY + 2 * dvec[1]
            shape.append(f"W~{ex2} {ey2} {ex3} {ey3}~#008800~1~0~none~{gid()}~0")
            shape.append(f"N~{ex3}~{ey3}~0~#0000FF~{nets[num]}~{gid()}~start~{ex3}~{ey3}~Arial~7pt~0")
            net_labels += 1
    shape.append(lib_head + "#@$" + "#@$".join(children))

doc = {
    "docType": "1",
    "editorVersion": "6.5.34",
    "title": "C4F7N_MainBoard",
    "head": {
        "docType": "1",
        "editorVersion": "6.5.34",
        "newgId": True,
        "c_para": {"Prefix Start": "1"}
    },
    "canvas": "CA~1000~1000~#FFFFFF~yes~#CCCCCC~5~1000~1000~line~5~pixel~5~0~0",
    "shape": shape,
    "colors": {}
}

with open(JSON_FILE, "w", encoding="utf-8") as f:
    json.dump(doc, f, ensure_ascii=False, separators=(",", ":"))

print(f"OK: {JSON_FILE}")
print(f"symbols={len(I)} netLabels={net_labels} shapes={len(shape)}")
