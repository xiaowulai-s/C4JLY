#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从原理图数据导出连接清单 Markdown (供立创手动重建使用)"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 复用 generate_easyeda.py 的器件数据(不执行其写文件逻辑则需改 import, 这里直接复制数据源)
# 改为: 从 generate_easyeda 模块读取(会连带重新生成 json, 无副作用)
import importlib.util
spec = importlib.util.spec_from_file_location("ge", os.path.join(os.path.dirname(os.path.abspath(__file__)), "generate_easyeda.py"))
ge = importlib.util.module_from_spec(spec)
# 屏蔽写文件副作用
import types
_orig_dump = __import__("json").dump
ge_ok = False
try:
    # 直接执行会写 json 文件, 内容一致, 接受该副作用
    spec.loader.exec_module(ge)
    ge_ok = True
except Exception as e:
    print("load err:", e)

MODULES = {
    "电源-充电(USB/TP4056/电池)": ["J1","F1","U1","R1","D1","BT1","R12","R13"],
    "电源-升压/LDO(MT3608/AMS1117)": ["U2","L1","D2","R2","R3","U3"],
    "电源-滤波电容": ["C1","C2","C3","C4","C5","C6","C9","C10","C13"],
    "MCU-主控(STM32)": ["U4"],
    "MCU-时钟/复位/调试": ["Y1","R4","R5","SW1","R6","J6","C7","C8"],
    "MCU-电池采样": ["R22","R23","C14"],
    "接口-串口屏": ["J2"],
    "接口-RS485/手柄": ["U5","R9","J3"],
    "接口-Flash": ["U6"],
    "驱动-泵": ["Q1","R15","D3","J4"],
    "驱动-蜂鸣器/LED/按键": ["Q2","R16","BZ1","R17","LED1","R18","LED2","SW2","SW3","SW4"],
}

# 器件名 -> 引脚名映射(与 generate_easyeda SYMBOLS 一致)
PINNAMES = {}
for lib, (pins, body) in ge.SYMBOLS.items():
    for (num, name, ptype, px, py, ang) in pins:
        PINNAMES[(lib, num)] = name if name else ""

# 修正点(手动重建时按此接线, 修正原自动生成的两个设计缺陷)
FIXES = [
    ("U1", "2", "CE", "建议接 VBUS_F(USB 输入), 而非 5V。否则电池耗尽时 5V 无法建立 → TP4056 无法充电"),
    ("U2", "4", "EN", "建议接 BAT(电池), 而非 5V。否则升压输出未建立时 EN 为低 → 升压无法自启动"),
]

# 器件引用 -> lib 名
INST = {ref: (lib, value, fp) for (ref, lib, value, fp, x, y, rot, nets) in ge.I}
NETS = {ref: nets for (ref, lib, value, fp, x, y, rot, nets) in ge.I}

lines = []
lines.append("# C₄F₇N 检漏仪 — 手动重建连接清单")
lines.append("")
lines.append("> 用途：在立创 EDA 标准版新工程中按模块重建原理图，此清单为每个器件的引脚接线表。")
lines.append("> 使用：放置元件 → 按本清单用导线连接同名网络（网络标签名一致即连通）。")
lines.append("")

lines.append("## ⚠️ 修正点（重建时按此接线，修正自动生成的两个设计缺陷）")
for ref, num, pname, fix in FIXES:
    lib, _, _ = INST[ref]
    lines.append(f"- **{ref} 引脚{num}({pname})**：{fix}")
lines.append("")

# 按模块
for modname, refs in MODULES.items():
    lines.append(f"## {modname}")
    lines.append("")
    for ref in refs:
        if ref not in INST:
            lines.append(f"（{ref} 不在本模块清单中，已忽略）")
            continue
        lib, value, fp = INST[ref]
        nets = NETS[ref]
        lines.append(f"### {ref} — {value}  [封装: {fp}]")
        lines.append("")
        for num, pname, ptype, px, py, ang in ge.SYMBOLS[lib][0]:
            net = nets.get(num, "—")
            pn = PINNAMES.get((lib, num), "")
            lines.append(f"| 引脚{num} | {pn or '·'} | {net} |")
        lines.append("")
        # 修正标注
        for r2, n2, p2, fix in FIXES:
            if r2 == ref:
                lines.append(f"> 修正：引脚{n2} 按上方修正点接线（{fix}）")
                lines.append("")
lines.append("## 网络汇总（49 个网络）")
lines.append("")
nets_all = sorted(set(n for nets in NETS.values() for n in nets.values() if n != "NC"))
lines.append("`" + " ".join(nets_all) + "`")
lines.append("")

out = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "04_连接清单.md")
with open(out, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))
print("OK:", out)
print("networks:", len(nets_all))
