#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
C4F7N 检漏仪 - 主机主板 KiCad 原理图生成器
生成 KiCad 8/9 兼容工程: .kicad_pro + 主机主板.kicad_sch
全部符号内嵌 lib_symbols, 网络用同名 label 连接(无需 wire, 打开即连通)
"""
import uuid
import json
import os

OUT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCH_FILE = os.path.join(OUT_DIR, "C4F7N_MainBoard.kicad_sch")
PRO_FILE = os.path.join(OUT_DIR, "C4F7N_LeakDetector.kicad_pro")

def uid():
    return str(uuid.uuid4()).upper()

# ============ 符号库定义 (lib_symbols) ============
# 每个符号: (name, pins=[(num,name,ptype,x,y,angle)], body=(x1,y1,x2,y2))
SYMBOLS = {}

def sym(name, pins, body):
    SYMBOLS[name] = (pins, body)

# --- 无源器件 ---
sym("R", [("1","", "passive", -3.81, 0, 0), ("2","", "passive", 3.81, 0, 180)], (-3.81,-1.27,3.81,1.27))
sym("C", [("1","", "passive", -3.81, 0, 0), ("2","", "passive", 3.81, 0, 180)], (-3.81,-1.27,3.81,1.27))
sym("C_POL", [("1","+", "passive", -3.81, 0, 0), ("2","-", "passive", 3.81, 0, 180)], (-3.81,-1.27,3.81,1.27))
sym("L", [("1","", "passive", -7.62, 0, 0), ("2","", "passive", 7.62, 0, 180)], (-7.62,-1.27,7.62,1.27))
sym("D_SCHOTTKY", [("1","A", "passive", -3.81, 0, 0), ("2","K", "passive", 3.81, 0, 180)], (-3.81,-1.27,3.81,1.27))
sym("LED", [("1","A", "passive", -3.81, 0, 0), ("2","K", "passive", 3.81, 0, 180)], (-3.81,-1.27,3.81,1.27))
sym("FUSE", [("1","", "passive", -3.81, 0, 0), ("2","", "passive", 3.81, 0, 180)], (-3.81,-1.27,3.81,1.27))
sym("CRYSTAL", [("1","X1", "passive", -5.08, 0, 0), ("2","X2", "passive", 5.08, 0, 180)], (-5.08,-1.27,5.08,1.27))
sym("SWITCH", [("1","", "passive", -2.54, 0, 0), ("2","", "passive", 2.54, 0, 180)], (-2.54,-1.27,2.54,1.27))
sym("BUZZER", [("1","", "passive", -3.81, 0, 0), ("2","", "passive", 3.81, 0, 180)], (-3.81,-1.27,3.81,1.27))
sym("BATTERY", [("1","+", "power_in", -3.81, 0, 0), ("2","-", "power_in", 3.81, 0, 180)], (-3.81,-1.27,3.81,1.27))
sym("CONN2", [("1","", "passive", 0, -2.54, 0), ("2","", "passive", 0, 2.54, 0)], (-1.27,-3.81,1.27,3.81))
sym("CONN4", [("1","", "passive", 0, -3.81, 0), ("2","", "passive", 0, -1.27, 0),
              ("3","", "passive", 0, 1.27, 0), ("4","", "passive", 0, 3.81, 0)], (-1.27,-5.08,1.27,5.08))
sym("Q_NMOS_GDS", [("1","G", "input", -3.81, 0, 0), ("2","D", "passive", 3.81, -1.27, 180), ("3","S", "passive", 3.81, 1.27, 180)],
    (-3.81,-2.54,3.81,2.54))
sym("Q_NPN_BCE", [("1","B", "input", -3.81, 1.27, 0), ("2","C", "passive", 3.81, -1.27, 180), ("3","E", "passive", 3.81, 1.27, 180)],
    (-3.81,-2.54,3.81,2.54))

# --- IC ---
sym("TP4056", [("1","VCC","power_in",-8.89,3.81,0), ("2","CE","input",-8.89,1.27,0), ("3","PROG","passive",-8.89,-1.27,0), ("4","TEMP","input",-8.89,-3.81,0),
               ("5","STDBY","open_collector",8.89,3.81,180), ("6","CHRG","open_collector",8.89,1.27,180), ("7","BAT","power_out",8.89,-1.27,180), ("8","GND","power_in",8.89,-3.81,180)],
    (-8.89,-5.08,8.89,5.08))
sym("MT3608", [("1","SW","passive",-8.89,2.54,0), ("2","GND","power_in",-8.89,0,0), ("3","FB","input",-8.89,-2.54,0),
               ("4","EN","input",8.89,2.54,180), ("5","VIN","power_in",8.89,0,180), ("6","VOUT","power_out",8.89,-2.54,180)],
    (-8.89,-3.81,8.89,3.81))
sym("AMS1117", [("1","GND","power_in",-7.62,1.27,0), ("2","VOUT","power_out",-7.62,-1.27,0), ("3","VIN","power_in",7.62,0,180)],
    (-7.62,-2.54,7.62,2.54))
sym("W25Q16", [("1","/CS","input",-8.89,3.81,0), ("2","DO","output",-8.89,1.27,0), ("3","/WP","input",-8.89,-1.27,0), ("4","GND","power_in",-8.89,-3.81,0),
               ("5","DI","input",8.89,3.81,180), ("6","CLK","input",8.89,1.27,180), ("7","/HOLD","input",8.89,-1.27,180), ("8","VCC","power_in",8.89,-3.81,180)],
    (-8.89,-5.08,8.89,5.08))
sym("MAX3485", [("1","RO","output",-8.89,3.81,0), ("2","/RE","input",-8.89,1.27,0), ("3","DE","input",-8.89,-1.27,0), ("4","DI","input",-8.89,-3.81,0),
                ("5","GND","power_in",8.89,3.81,180), ("6","A","bidirectional",8.89,1.27,180), ("7","B","bidirectional",8.89,-1.27,180), ("8","VCC","power_in",8.89,-3.81,180)],
    (-8.89,-5.08,8.89,5.08))
sym("USB_C", [("1","VBUS","power_in",-6.35,3.81,0), ("2","D+","bidirectional",-6.35,1.27,0), ("3","D-","bidirectional",-6.35,-1.27,0), ("4","CC1","passive",-6.35,-3.81,0),
              ("5","GND","power_in",6.35,3.81,180), ("6","CC2","passive",6.35,1.27,180), ("7","SHIELD","passive",6.35,-1.27,180), ("8","NC","no_connect",6.35,-3.81,180)],
    (-6.35,-5.08,6.35,5.08))

# STM32F103C8T6 最小系统符号(仅列出用到的引脚)
STM_PINS_LEFT = [("VDD","power_in"),("VSS","power_in"),("VDDA","power_in"),("VBAT","power_in"),("NRST","input"),
                 ("BOOT0","input"),("PA13","bidirectional"),("PA14","bidirectional"),("PB3","bidirectional"),
                 ("PB4","bidirectional"),("PB5","bidirectional"),("PB0","bidirectional"),("PB1","bidirectional")]
STM_PINS_RIGHT = [("PA0","bidirectional"),("PA1","bidirectional"),("PA2","bidirectional"),("PA3","bidirectional"),
                  ("PA4","bidirectional"),("PA5","bidirectional"),("PA6","bidirectional"),("PA7","bidirectional"),
                  ("PA9","bidirectional"),("PA10","bidirectional"),("PA11","bidirectional"),("PA12","bidirectional"),
                  ("PA15","bidirectional"),("PD0","bidirectional"),("PD1","bidirectional")]
def build_stm_pins():
    pins = []
    y = 10.16
    for (name, pt) in STM_PINS_LEFT:
        pins.append((str(len(pins)+1), name, pt, -10.16, y, 0)); y -= 2.54
    y = 10.16
    for (name, pt) in STM_PINS_RIGHT:
        pins.append((str(len(pins)+1), name, pt, 10.16, y, 180)); y -= 2.54
    return pins
sym("STM32F103", build_stm_pins(), (-10.16, 12.7, 10.16, -35.56))

# ============ 实例定义 ============
# (ref, lib, value, footprint, x, y, rot, {pin_num: net})
C = []  # 电容列表
def cap(ref, val, fp, x, y, n1, n2, pol=False):
    C.append((ref, "C_POL" if pol else "C", val, fp, x, y, 0, {"1": n1, "2": n2}))

I = []  # 实例列表
def add(ref, lib, value, fp, x, y, rot, nets):
    I.append((ref, lib, value, fp, x, y, rot, nets))

# ---- 电源区 ----
add("J1","USB_C","USB-C","Connector_USB:USB_C_Receptacle_HRO_TYPE-C-31-M-12", 35, 170, 0,
    {"1":"VBUS","2":"USB_DP","3":"USB_DM","4":"CC1","5":"GND","6":"CC2","7":"GND","8":"NC"})
add("F1","FUSE","500mA","Fuse:Fuse_0805_2012Metric", 35, 152, 0, {"1":"VBUS","2":"VBUS_F"})
add("U1","TP4056","TP4056","Package_SO:SOP-8_3.9x4.9mm_P1.27mm", 35, 122, 0,
    {"1":"VBUS_F","2":"5V","3":"PROG","4":"TEMP_NC","5":"STDBY_NC","6":"CHRG","7":"BAT","8":"GND"})
add("R1","R","1.2k","Resistor_SMD:R_0603_1608Metric", 62, 106, 0, {"1":"PROG","2":"GND"})
add("D1","LED","LED_RED","LED_SMD:LED_0805_2012Metric", 62, 136, 0, {"1":"3V3","2":"CHRG"})
add("BT1","BATTERY","18650x2","Battery:BatteryHolder_Keystone_2466_2xAA", 82, 170, 0, {"1":"BAT","2":"GND"})
add("U2","MT3608","MT3608","Package_TO_SOT_SMD:SOT-23-6", 35, 72, 0,
    {"1":"SW","2":"GND","3":"FB","4":"EN","5":"BAT","6":"VOUT5"})
add("L1","L","10uH","Inductor_SMD:L_0805_2012Metric", 62, 92, 0, {"1":"BAT","2":"SW"})
add("D2","D_SCHOTTKY","SS34","Diode_SMD:D_SMA", 62, 72, 0, {"1":"SW","2":"VOUT5"})
add("R2","R","100k","Resistor_SMD:R_0603_1608Metric", 62, 58, 0, {"1":"VOUT5","2":"FB"})
add("R3","R","20k","Resistor_SMD:R_0603_1608Metric", 62, 44, 0, {"1":"FB","2":"GND"})
add("R12","R","5.1k","Resistor_SMD:R_0603_1608Metric", 60, 190, 0, {"1":"CC1","2":"GND"})
add("R13","R","5.1k","Resistor_SMD:R_0603_1608Metric", 60, 205, 0, {"1":"CC2","2":"GND"})
add("U3","AMS1117","AMS1117-3.3","Package_TO_SOT_SMD:SOT-223-3_TabPin2", 35, 28, 0, {"1":"GND","2":"3V3","3":"VOUT5"})
cap("C1","10uF","Capacitor_SMD:C_0805_2012Metric", 58, 100, "BAT", "GND")
cap("C2","22uF","Capacitor_SMD:C_0805_2012Metric", 58, 60, "VOUT5", "GND")
cap("C3","10uF","Capacitor_SMD:C_0805_2012Metric", 58, 40, "VOUT5", "GND")
cap("C4","10uF","Capacitor_SMD:C_0805_2012Metric", 58, 18, "3V3", "GND")
cap("C5","100nF","Capacitor_SMD:C_0603_1608Metric", 88, 96, "3V3", "GND")
cap("C6","100nF","Capacitor_SMD:C_0603_1608Metric", 88, 108, "3V3", "GND")
cap("C7","20pF","Capacitor_SMD:C_0603_1608Metric", 175, 78, "OSC_IN", "GND")
cap("C8","20pF","Capacitor_SMD:C_0603_1608Metric", 175, 58, "OSC_OUT", "GND")
cap("C9","100nF","Capacitor_SMD:C_0603_1608Metric", 88, 60, "3V3", "GND")
cap("C10","100nF","Capacitor_SMD:C_0603_1608Metric", 88, 40, "3V3", "GND")
cap("C11","100nF","Capacitor_SMD:C_0603_1608Metric", 120, 175, "3V3", "GND")
cap("C12","100nF","Capacitor_SMD:C_0603_1608Metric", 120, 160, "3V3", "GND")
cap("C13","100nF","Capacitor_SMD:C_0603_1608Metric", 88, 22, "5V", "GND")
cap("C14","100nF","Capacitor_SMD:C_0603_1608Metric", 105, 40, "VBAT_SENSE", "GND")

# ---- MCU 区 ----
add("U4","STM32F103","STM32F103C8T6","Package_QFP:LQFP-48_7x7mm_P0.5mm", 150, 105, 0, {
    "1":"3V3","2":"GND","3":"3V3","4":"3V3","5":"RST","6":"BOOT0",
    "7":"SWDIO","8":"SWCLK","9":"KEY1","10":"KEY2","11":"KEY3","12":"LED_GREEN","13":"VBAT_SENSE",
    "14":"PUMP_CTRL","15":"BEEP","16":"RS485_TX","17":"RS485_RX","18":"SPI_CS","19":"SPI_SCK",
    "20":"SPI_MISO","21":"SPI_MOSI","22":"LCD_TX","23":"LCD_RX","24":"USB_DM","25":"USB_DP",
    "26":"LED_RED","27":"OSC_IN","28":"OSC_OUT"})
add("Y1","CRYSTAL","8MHz","Crystal:Crystal_SMD_3215-4Pin_3.2x1.5mm", 192, 92, 0, {"1":"OSC_IN","2":"OSC_OUT"})
add("R4","R","1M","Resistor_SMD:R_0603_1608Metric", 192, 112, 0, {"1":"OSC_IN","2":"OSC_OUT"})
add("R5","R","10k","Resistor_SMD:R_0603_1608Metric", 112, 152, 0, {"1":"3V3","2":"RST"})
add("SW1","SWITCH","RESET","Button_Switch_SMD:SW_Push_1P1T_NO_6x6mm_H8_5mm", 112, 138, 0, {"1":"RST","2":"GND"})
add("R6","R","10k","Resistor_SMD:R_0603_1608Metric", 112, 118, 0, {"1":"BOOT0","2":"GND"})
add("J6","CONN4","SWD","Connector_PinHeader_2.54mm:PinHeader_1x04_P2.54mm_Vertical", 192, 58, 0,
    {"1":"3V3","2":"SWDIO","3":"SWCLK","4":"GND"})
add("R22","R","100k","Resistor_SMD:R_0603_1608Metric", 105, 72, 0, {"1":"BAT","2":"VBAT_SENSE"})
add("R23","R","100k","Resistor_SMD:R_0603_1608Metric", 105, 56, 0, {"1":"VBAT_SENSE","2":"GND"})

# ---- 接口区 ----
add("J2","CONN4","LCD_4.3","Connector_PinHeader_2.54mm:PinHeader_1x04_P2.54mm_Vertical", 255, 170, 0,
    {"1":"5V","2":"GND","3":"LCD_TX","4":"LCD_RX"})
add("U5","MAX3485","MAX3485","Package_SO:SOIC-8_3.9x4.9mm_P1.27mm", 230, 122, 0,
    {"1":"RS485_RX","2":"RS485_DE","3":"RS485_DE","4":"RS485_TX","5":"GND","6":"RS485_A","7":"RS485_B","8":"3V3"})
add("R9","R","120R","Resistor_SMD:R_0603_1608Metric", 262, 122, 0, {"1":"RS485_A","2":"RS485_B"})
add("J3","CONN4","PROBE_GX12","Connector_PinHeader_2.54mm:PinHeader_1x04_P2.54mm_Vertical", 255, 92, 0,
    {"1":"5V","2":"GND","3":"RS485_A","4":"RS485_B"})
add("U6","W25Q16","W25Q16","Package_SO:SOIC-8_3.9x4.9mm_P1.27mm", 230, 38, 0,
    {"1":"SPI_CS","2":"SPI_MISO","3":"3V3","4":"GND","5":"SPI_MOSI","6":"SPI_SCK","7":"3V3","8":"3V3"})

# ---- 驱动/报警 ----
add("Q1","Q_NMOS_GDS","SI2302","Package_TO_SOT_SMD:SOT-23", 130, 34, 0, {"1":"PUMP_CTRL","2":"PUMP_N","3":"GND"})
add("R15","R","100k","Resistor_SMD:R_0603_1608Metric", 112, 40, 0, {"1":"PUMP_CTRL","2":"GND"})
add("D3","D_SCHOTTKY","1N5819","Diode_SMD:D_SMA", 150, 24, 0, {"1":"PUMP_N","2":"VOUT5"})
add("J4","CONN2","PUMP","Connector_PinHeader_2.54mm:PinHeader_1x02_P2.54mm_Vertical", 172, 34, 0, {"1":"VOUT5","2":"PUMP_N"})
add("Q2","Q_NPN_BCE","MMBT2222","Package_TO_SOT_SMD:SOT-23", 130, 12, 0, {"1":"BEEP_B","2":"BZ_C","3":"GND"})
add("R16","R","1k","Resistor_SMD:R_0603_1608Metric", 112, 12, 0, {"1":"BEEP","2":"BEEP_B"})
add("BZ1","BUZZER","BUZZER_5V","Buzzer_Beeper:Buzzer_12x9.5RM7.6", 155, 8, 0, {"1":"3V3","2":"BZ_C"})
add("R17","R","330R","Resistor_SMD:R_0603_1608Metric", 178, 34, 0, {"1":"LED_RED","2":"LED_A"})
add("LED1","LED","LED_RED","LED_SMD:LED_0805_2012Metric", 192, 34, 0, {"1":"LED_A","2":"GND"})
add("R18","R","330R","Resistor_SMD:R_0603_1608Metric", 178, 20, 0, {"1":"LED_GREEN","2":"LED_G_A"})
add("LED2","LED","LED_GREEN","LED_SMD:LED_0805_2012Metric", 192, 20, 0, {"1":"LED_G_A","2":"GND"})
add("SW2","SWITCH","KEY1","Button_Switch_SMD:SW_Push_1P1T_NO_6x6mm_H8_5mm", 150, 168, 0, {"1":"KEY1","2":"GND"})
add("SW3","SWITCH","KEY2","Button_Switch_SMD:SW_Push_1P1T_NO_6x6mm_H8_5mm", 168, 168, 0, {"1":"KEY2","2":"GND"})
add("SW4","SWITCH","KEY3","Button_Switch_SMD:SW_Push_1P1T_NO_6x6mm_H8_5mm", 186, 168, 0, {"1":"KEY3","2":"GND"})

# ============ 生成 lib_symbols 文本 ============
def gen_lib_symbols():
    parts = []
    for name, (pins, body) in SYMBOLS.items():
        parts.append(f'(symbol "C4F7N:{name}"')
        parts.append('  (pin_names (offset 1.016))')
        parts.append('  (exclude_from_sim no)')
        parts.append('  (in_bom yes)')
        parts.append('  (on_board yes)')
        parts.append('  (property "Reference" "U" (at 0.635 0 0) (effects (font (size 1.27 1.27)) (justify left)))')
        parts.append('  (property "Value" "V" (at 0 0 90) (effects (font (size 1.27 1.27)) (justify left)))')
        parts.append(f'  (symbol "{name}_0_1"')
        parts.append(f'    (rectangle (start {body[0]} {body[1]}) (end {body[2]} {body[3]}) (stroke (width 0.254) (type default)) (fill (type background)))')
        parts.append('  )')
        parts.append(f'  (symbol "{name}_1_1"')
        for (num, pname, ptype, px, py, pang) in pins:
            parts.append(f'    (pin {ptype} line (at {px} {py} {pang}) (length 2.54) (name "{pname}" (effects (font (size 1.27 1.27)))) (number "{num}" (effects (font (size 1.27 1.27)))) (uuid "{uid()}"))')
        parts.append('  )')
        parts.append(')')
    return "\n".join(parts)

# ============ 生成实例文本 ============
def rot_point(px, py, rot):
    if rot == 90:   return (-py, px)
    if rot == 180:  return (-px, -py)
    if rot == 270:  return (py, -px)
    return (px, py)

def fmt(v):
    s = f"{v:.2f}".rstrip('0').rstrip('.')
    return s if s else "0"

def rot_dir(dx, dy, rot):
    if rot == 90:   return (-dy, dx)
    if rot == 180:  return (-dx, -dy)
    if rot == 270:  return (dy, -dx)
    return (dx, dy)

PIN_DIR = {0: (-1, 0), 90: (0, -1), 180: (1, 0), 270: (0, 1)}

def gen_symbols_and_labels():
    symbols = []
    wires = []
    labels = []
    for (ref, lib, value, fp, x, y, rot, nets) in I + C:
        suid = uid()
        body = SYMBOLS[lib][1]
        symbols.append(f'(symbol')
        symbols.append(f'  (lib_id "C4F7N:{lib}")')
        symbols.append(f'  (at {x} {y} {rot})')
        symbols.append('  (unit 1)')
        symbols.append('  (exclude_from_sim no)')
        symbols.append('  (in_bom yes)')
        symbols.append('  (on_board yes)')
        symbols.append('  (dnp no)')
        symbols.append(f'  (uuid "{suid}")')
        symbols.append(f'  (property "Reference" "{ref}" (at {x} {y} 0) (effects (font (size 1.27 1.27))) (uuid "{uid()}"))')
        symbols.append(f'  (property "Value" "{value}" (at {x} {y} 0) (effects (font (size 1.27 1.27))) (uuid "{uid()}"))')
        symbols.append(f'  (property "Footprint" "{fp}" (at {x} {y} 0) (effects (font (size 1.27 1.27)) hide) (uuid "{uid()}"))')
        for (num, pname, ptype, px, py_, pang) in SYMBOLS[lib][0]:
            rxp, ryp = rot_point(px, py_, rot)
            ax, ay = x + rxp, y + ryp
            symbols.append(f'  (pin "{num}" (uuid "{uid()}"))')
            if num in nets:
                pangle = (pang + rot) % 360
                dx, dy = rot_dir(*PIN_DIR.get(pangle, (-1, 0)), rot)
                wx, wy = ax + 2.54 * dx, ay + 2.54 * dy
                wires.append(f'(wire (pts (xy {fmt(ax)} {fmt(ay)}) (xy {fmt(wx)} {fmt(wy)})) (stroke (width 0) (type default)) (uuid "{uid()}"))')
                labels.append(f'(label "{nets[num]}" (at {fmt(wx)} {fmt(wy)} 0) (effects (font (size 1.27 1.27))) (uuid "{uid()}"))')
        symbols.append(')')
    return "\n".join(symbols), "\n".join(wires), "\n".join(labels)

# ============ 组装 .kicad_sch ============
lib_text = gen_lib_symbols()
sym_text, wire_text, lab_text = gen_symbols_and_labels()
title_text = f'(text "C4F7N Portable Leak Detector - Main Board v0.2 (generated, with wires)" (at 141 197 0) (effects (font (size 1.5 1.5))) (uuid "{uid()}"))'
sub_text = f'(text "NET: 同名label自动连接; 打开KiCad后可继续编辑布局" (at 141 189 0) (effects (font (size 1.27 1.27))) (uuid "{uid()}"))'

sch = f"""(kicad_sch
  (version 20231120)
  (generator "eeschema")
  (generator_version "8.0")
  (uuid "{uid()}")
  (paper "A4")
  (lib_symbols
{lib_text}
  )
{sym_text}
{wire_text}
{lab_text}
{title_text}
{sub_text}
)
"""

with open(SCH_FILE, "w", encoding="utf-8") as f:
    f.write(sch)

# ============ 组装 .kicad_pro ============
pro = {
    "board": {"design_settings": {"defaults": {"apply_defaults_to_fp_fields": False,
        "apply_defaults_to_new_footprints": False, "footprints": [], "pad_copper_clearance": 0.25,
        "pad_to_pad_clearance": 0.0, "solder_mask_clearance": 0.0, "solder_mask_min_width": 0.0,
        "track_width": 0.25, "via_size": 0.8, "via_drill": 0.4, "zones_allow_external_fillets": False},
        "diff_pair_dimensions": [], "drc_exclusions": [], "rules": {"max_error": 0.005,
        "min_clearance": 0.0, "min_copper_edge_clearance": 0.25, "min_hole_clearance": 0.25,
        "min_hole_to_hole": 0.25, "min_microvia_diameter": 0.2, "min_microvia_drill": 0.1,
        "min_resolved_spokes": 2, "min_silk_clearance": 0.0, "min_text_height": 0.8,
        "min_text_thickness": 0.08, "min_through_hole_diameter": 0.3, "min_track_width": 0.2,
        "min_via_annular_width": 0.1, "min_via_diameter": 0.5, "solder_mask_to_copper_clearance": 0.0,
        "use_height_for_length_calcs": True, "zones_allowed": True, "zones_min_clearance": 0.5}},
        "layer_presets": [], "viewports": []},
    "boards": [],
    "cvpcb": {"equivalence_files": []},
    "libraries": {"pinned_footprint_libs": [], "pinned_symbol_libs": []},
    "meta": {"filename": "C4F7N_LeakDetector.kicad_pro", "version": 3},
    "net_settings": {"classes": [{"bus_width": 12, "clearance": 0.2, "diff_pair_gap": 0.25,
        "diff_pair_via_gap": 0.25, "diff_pair_width": 0.2, "line_style": 0, "microvia_diameter": 0.3,
        "microvia_drill": 0.1, "name": "Default", "pcb_color": "rgba(0, 0, 0, 0.000)", "solder_mask_clearance": 0.0,
        "solder_mask_min_width": 0.0, "track_width": 0.25, "via_diameter": 0.8, "via_drill": 0.4,
        "wire_width": 6.0}], "meta": {"version": 3}},
    "pcbnew": {"last_paths": {"boards": "", "gencad": "", "netlist": "", "plot": "", "pos": "", "schematic": "", "specctra_dsn": "", "specctra_session": ""}},
    "schematic": {"legacy_lib_dir": "", "legacy_lib_list": [], "meta": {"version": 4},
        "net_format_name": "", "page_layout_descr_file": "", "plot_directory": "",
        "spice_current_sheet_as_root": False, "spice_external_command": "spice \"%I\"",
        "spice_save_all_currents": False, "spice_save_all_voltages": False, "subpart_first_id": 65,
        "subpart_id_separator": 0},
    "sheets": [[str(uuid.uuid4()).upper(), "Root", ""]],
    "text_variables": {}
}
with open(PRO_FILE, "w", encoding="utf-8") as f:
    json.dump(pro, f, indent=2, ensure_ascii=False)

print(f"OK: {SCH_FILE}")
print(f"OK: {PRO_FILE}")
n_sym = len(I) + len(C)
n_lab = sum(1 for (r,lib,v,fp,x,y,rot,nets) in I+C for k in nets)
print(f"symbols={n_sym} labels={n_lab} wires={n_lab}")
