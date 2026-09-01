# C4F7N HMI 程序化生成 · 对象名映射与协议适配表

> 由 `tjc-hmi-toolkit` 程序化生成（gen_hmi2.js + hmipack-tjc.exe）
> 产物：`C4F7N/C4F7N_HMI.HMI`（12.8MB，8 页，其中 0-3 为 C4F7N 页面）
> 验证：`verify_all_pages.exe` → 8/8 页 check=33 OK
> 生成时间：2026-08-26
> 最终编译通过：2026-08-27 v17b

## 1. 为什么对象名要缩短

TJC 引擎的**事件脚本行硬限制 ≤15 字节（GBK）**：`L>=16` 的记录会被引擎误解析为畸形属性 → 崩溃「索引超出数组界限」。
搭建清单原对象名（如 `p0_nav_home.bco=3222` = 20B）写进脚本必然触发崩溃，因此**所有被脚本引用的对象**改短名；纯展示控件也统一短名，MCU 协议一并适配。

## 2. 对象名映射表（短名 = 生成产物内实际名）

### Page 0 主页
| 清单原名 | 短名 | 类型 | 说明 |
|---|---|---|---|
| p0_title | `p0t` | text | 标题 |
| p0_chip_probe | `pc0` | btn | 探头芯片 |
| p0_chip_pump | `pc1` | btn | 泵芯片 |
| p0_chip_bat | `pc2` | btn | 电量芯片 |
| p0_gas | `pg` | text | 气体名 |
| p0_conc | `cc` | num | **浓度大字**（vvs=2） |
| p0_unit | `pu` | text | 单位行 |
| p0_badge_peak | `bp` | btn | 峰值徽章 |
| p0_badge_avg | `ba` | btn | 均值徽章 |
| p0_strip | `ps` | prog | **报警色条**（MCU 改 pco 切色） |
| p0_panel_peak | `pk` | text | 峰值面板（装饰） |
| p0_peaklab | `pl` | text | PEAK 标签 |
| p0_peak | `pv` | num | 峰值（vvs=2） |
| p0_reset | `pr` | btn | 重置峰值（有脚本） |
| p0_panel_st | `pd` | text | 状态面板（装饰） |
| p0_t90 | `p9` | text | T90 状态行 |
| p0_flow | `pf` | text | 流量状态行 |
| p0_temp | `pt` | text | 温度状态行 |
| p0_thr | `pth` | text | 阈值状态行 |
| p0_nav_home | `nh` | btn | 导航·主页（激活） |
| p0_nav_set | `ns` | btn | 导航·设置 |
| p0_nav_curve | `nc` | btn | 导航·历史曲线 |
| p0_nav_about | `na` | btn | 导航·关于 |

### Page 1 设置
| 清单原名 | 短名 | 类型 | 说明 |
|---|---|---|---|
| p1_panel_thr | `p1L` | text | 左面板（装饰） |
| p1_thr_title | `htt` | text | 报警阈值标题 |
| p1_hi_lab / p1_hi_desc | `hl` / `hld` | text | 高报标签/说明 |
| p1_hi_minus | `hm` | btn | 高报 −（有脚本） |
| p1_hi_val | `h` | num | **高报值**（脚本引用） |
| p1_hi_plus | `hp` | btn | 高报 +（有脚本） |
| p1_lo_lab / p1_lo_desc | `lo` / `lod` | text | 低报标签/说明 |
| p1_lo_minus | `lm` | btn | 低报 −（有脚本） |
| p1_lo_val | `l` | num | **低报值**（脚本引用） |
| p1_lo_plus | `lp` | btn | 低报 +（有脚本） |
| p1_unit_lab / p1_unit_desc | `ul` / `uld` | text | 单位标签/说明 |
| p1_unit_btn | `u` | btn | **单位切换**（脚本引用） |
| p1_buz_lab / p1_buz_desc | `bl` / `bld` | text | 蜂鸣器标签/说明 |
| p1_buz_btn | `bb` | btn | **蜂鸣开关**（脚本引用） |
| p1_dim_lab | `dl` | text | 背光标签 |
| p1_dim | `di` | slider | **背光滑块**（minval 10 / maxval 100 / val 70） |
| p1_dim_val | `dv` + `dvp` | text | 亮度数字 + 固定 "%" |
| p1_panel_cal | `p1R` | text | 右面板（装饰） |
| p1_cal_title | `calt` | text | 标定标题 |
| p1_cal0_lab / desc | `czl` / `czd` | text | 零点标定 |
| p1_cal0_btn | `c0` | btn | 零点执行（有脚本） |
| p1_cal1_lab / desc | `csl` / `csd` | text | 量程标定 |
| p1_cal1_btn | `c1` | btn | 量程执行（有脚本） |
| p1_fac_lab / desc | `cfl` / `cfd` | text | 恢复出厂 |
| p1_fac_btn | `cf` | btn | 恢复（有脚本，红 bco=59944） |
| p1_hint | `cht` | text | 标定提示（已缩短文案） |
| p1_nav_* | `nh1 ns1 nc1 na1` | btn | 导航（ns1 激活） |

### Page 2 历史曲线
| 清单原名 | 短名 | 类型 | 说明 |
|---|---|---|---|
| p2_panel_chart | `p2L` | text | 左面板 |
| p2_title | `ctt` | text | 标题 |
| p2_r10 / p2_r1h / p2_r24h | `r0` `r1` `r2` | btn | 范围切换（r0 激活） |
| p2_wave | `wv` | wave | **波形**（pco0=9885 青，ch=1） |
| p2_leg | `leg` | text | 图例 |
| p2_panel_stat | `p2R` | text | 右面板 |
| p2_stat_title | `stt` | text | 数据统计标题 |
| p2_max_lab / p2_max | `mxl` / `mx` | text | 最大值（mx 橙） |
| p2_avg_lab / p2_avg | `avl` / `av` | text | 平均值（av 青） |
| p2_min_lab / p2_min | `mnl` / `mn` | text | 最小值 |
| p2_dur_lab / p2_dur | `dul` / `du` | text | 记录时长 |
| p2_cnt_lab / p2_cnt | `ctl` / `ct` | text | 数据点数 |
| p2_export | `ex` | btn | 导出（有脚本） |
| p2_nav_* | `nh2 ns2 nc2 na2` | btn | 导航（nc2 激活） |

### Page 3 关于
| 清单原名 | 短名 | 类型 | 说明 |
|---|---|---|---|
| p3_panel_info | `p3L` | text | 左面板 |
| p3_info_title | `itt` | text | 设备信息标题 |
| p3_model / sn / fw / mcu / lcd / principle | `mod sn fw mcu lcd pri` | text | 信息行 |
| p3_panel_probe | `p3R` | text | 右面板 |
| p3_probe_title | `ptt` | text | 探头标题 |
| p3_probe_st | `pst` | text | 探头状态（绿，MCU 可改红） |
| p3_probe_sub | `psu` | text | 探头副行 |
| p3_range / res / t90 / bat | `rng res t90 bat` | text | 参数行 |
| p3_note | `note` | text | 说明（已缩短文案） |
| p3_nav_* | `nh3 ns3 nc3 na3` | btn | 导航（na3 激活） |

## 3. 事件脚本：清单 rel → 产物 up

TJC 按钮事件槽为 `codesdown`（按下）/ `codesup`（释放），无 `codesrel`。
**清单中所有 rel 事件已映射为产物 up 事件**，行为一致（释放时触发）。

## 4. MCU 协议适配（⚠️ 必须同步修改固件）

### 4.1 屏幕 → MCU 关键字变更（print 长度限制导致）

| 原关键字 | 新关键字 | 原因 |
|---|---|---|
| `PEAK:RESET` | `PEAK:R` | 17B > 15B |
| `UNIT:TOGGLE` | `UNIT:TOG` | 16B > 15B |
| `BUZ:TOGGLE` | `BUZ:TOG` | 17B > 15B |
| `CAL:FACTORY` | `CAL:FAC` | 16B > 15B |
| `RANGE:10M` | `RG:10M` | 16B > 15B |
| `RANGE:1H` | `RG:1H` | — |
| `RANGE:24H` | `RG:24H` | 16B > 15B |
| `THR:HI:` / `THR:LO:` | 不变 | 14B ✓ |
| `CAL:ZERO` / `CAL:SPAN` | 不变 | 15B ✓ |
| `EXPORT` | 不变 | 13B ✓ |

> `THR:HI:` 后接数字由 `print h.val` 单独发出（11B）✓；`THR:LO:` 同理。

### 4.2 MCU → 屏幕 指令对象名变更

| 原指令 | 新指令 |
|---|---|
| `p0_conc.val=42` | `cc.val=42` |
| `p0_peak.val=123` | `pv.val=123` |
| `p0_badge_avg.txt="均值 0.42"` | `ba.txt="均值 0.42"` |
| `p0_t90.txt="4.2 s"` | `p9.txt="4.2 s"` |
| `p0_strip.pco=9771` | `ps.pco=9771` |
| `p1_hi_val.val=500` | `h.val=500` |
| `p1_lo_val.val=100` | `l.val=100` |
| `p1_cal0_btn.txt="执行"` | `c0.txt="执行"` |
| `p1_cal1_btn.txt="执行"` | `c1.txt="执行"` |
| `p3_probe_st.txt="MST-N7M 探头 · 已连接"` | `pst.txt="MST-N7M 探头 · 已连接"` |
| `p2_max.txt="248.5"` 等 | `mx.txt="248.5"` / `av.txt` / `mn.txt` / `du.txt` / `ct.txt` |
| `p1_dim_val` | `dv`（数字）+ `dvp`（固定 "%"） |
| `page N` / `add 0,val` / `cls 0` / `dim=70` / `beep 1` | 不变 |

## 5. 与视觉稿/清单的设计差异（工具链约束）

| # | 差异 | 原因 |
|---|---|---|
| 1 | 无圆角（radius 属性未设置） | 种子控件无 radius 属性，显式创建有崩溃风险（README 踩坑记录） |
| 2 | **全部控件用 16 号（font 0）** | 干净模板 base.HMI 仅含 0.zi(16号) 1 个字库；如需大号字，请在 base.HMI 内再添加 24 号 GB2312 字库（后续可恢复 font 分档） |
| 3 | 浓度大字 16 号 | 视觉降级；加 24 号字库后浓度大字可恢复 24 号 |
| 4 | 装饰面板用文本控件（非按钮） | 文本不响应触摸，天然防误触 |
| 5 | 波形颜色属性为 `pco0`（非 pco） | TJC 波形多通道颜色属性为 pco0~pco3 |
| 6 | 背光百分比拆为数字 + 固定 "%" 两个控件 | 15B 脚本限制无法拼接字符串 |
| 7 | 部分长文案缩短（cht/note 等） | 单行文本控件宽度限制，防止截断 |
| 8 | 页码残留模板 4-7 页（按摩椅） | 模板为 8 页工程；可 GUI 中手动删除，或后续换干净模板 |
| 9 | vvs 属性为新建字段 | **已验证写入成功**（cc/pv.vvs=2，h/l.vvs=0），TJC 官方属性表支持小数位；GUI 打开确认显示 0.42 即达标 |
| 10 | 图片引用全部清零（pic/picc/pic2/picc2/bpic/ppic=65535） | 种子（btn53/prog）自带模板图片引用（0.i/1.i，"Clipboard_Screenshot.png"），引擎加载时越界+持续弹窗；纯色 UI 规避 |
| 11 | 字体索引仅 0/3 | 模板字库 0.zi+3.zi；font=1/2 越界崩溃（"索引超出数组界限"根因，全页面报） |

## 5.5 事件槽号规则（「索引超出数组界限」最终根因，2026-08-27）

模板实例（会自动验证的基准）：
- `1.pa bt4`：`codesdown-6` 后跟 **6 行**、`codesup-3` 后跟 **3 行**
- `3.pa b0`：`codesdown-9` 后跟 **9 行**、`codesup-0` 后跟 **0 行**
- `4.pa b1`：`codesdown-1` 后跟 **1 行**、`codesup-0`

**铁律：事件槽号 N 必须等于该槽后紧跟的脚本行数**（`codesXXX-N` 的 N 是引擎查行为表的索引）。

- 写多行脚本后仍沿用种子槽号（如 `codesup-1`）→ 行数≠N → 引擎越界 `索引超出数组界限`，上电首帧弹出、可关闭。
- 清空脚本后槽号也必须归 0（clearCodes 已把每个清空的槽改为 `codesXXX-0`）。
- 修复已写入 `gen_hmi2.js` 的 `setCodes` / `clearCodes`。

## 5.6 TJC 脚本语言支持度（编译错「变量名称无效/赋值失败」根因）

基准：支架模板 `tpl_am1_pas` 全工程**零 print、零 cls、零 .bco 赋值**——命令集仅 `page/tsw/rest/obj.attr=/if(){}/val/x/y/pic/注释`。

| 写法 | 是否支持 | 说明 |
|---|---|---|
| `print"xx"` | ✗ | 报「变量名称无效:print」 |
| `print 变量` | ✗ | 同左 |
| `cls 0` | ✗ | 报「变量名称无效:cls」 |
| `obj.bco=color` | ✗ | 报「变量名称无效:obj.bco」（设置页/历史页都试过均错） |
| `obj.txt="中文"` | ✓ | txt 赋值可编译（u.txt、c0.txt 通过） |
| `obj.val=N` | ✓ | 模板大量使用 |
| `if(cond)` | ✓ 需 `{...}` | **必须接 `{`/`}`，不支持 `endif`/`else`** |
| `obj.x/y/pic=val` | ✓ | 模板有先例 |

结论：凡需运行时交互，一律用 `.val` 标志位 + `.txt` 文本，**不要用 `.bco` 改色**；无 `print`/`cls`。
r0/r1/r2 时间档、bb 蜂鸣器均改为 `.val=1/0` 标志；di 滑块去掉脚本。

## 5.7 TJC 串口输出与 15B 真相（2026-08-27 实证）

- **`print` 是 Nextion 命令，TJC 不支持** → 编译「变量名称无效:print」。
- TJC 原生串口输出：`prints att,len`（ASCII/变量）、`printh hex`（16进制）。
- **15B 真实来源**：引擎 readObj 把 `L≥16` 记录当 attr 解析 → `prints "长关键字"`(≥16B) 写进脚本后回读错位 → 越界。因此**脚本行必须 ≤15B 强制成立**。
- HMI→MCU 交互因此改用 `printh 单字节命令码`（每行 `printh NN`=9B 安全）。

## 5.8 MCU 固件阶段 1/2/3 交付（2026-08-28）

> 屏幕 v18 + STM32F103RCT6 固件，地址 `C4F7N_Demo/`（eIDE/MDK-ARM 可构建）。

- **阶段 1 · 主循环 + 屏幕通信**：USART1 RX 中断逐字节 → `hmi_on_rx_byte` 命令码分发；主循环 `app_refresh()` 每 250ms 刷新浓度/峰值/状态/色条/波形。RC 实测 0 写回参数。
- **阶段 2 · 传感器驱动**：GC5G1 NDIR 模拟量接 **PA0(ADC1_IN0)**；`ppm=(k/1000)·V+b`，默认 k=625/b=-250（0.4~2V↔0~1000ppm）。`sensor.c/h`，8 次采样均值。
- **阶段 3 · 标定/存储/单位**：
  - **W25Q16 驱动**（`w25q16.c/h`，SPI1: SCK=PA5/MISO=PA6/MOSI=PA7/CS=PA4）：读/写/擦扇区/页编程，Mode0，APB2/8=9MHz。
  - **参数持久化**（`param_store.c/h`）：标定系数+高/低阈值+蜂鸣器+单位模式存 0 扇区，带 CRC，上电 `param_init` 加载（无效写默认）。
  - **回调实现**：零点标定（b=−k·V/1000）、量程标定（k=(1000−b)·1000/V）、恢复出厂、单位切换（1ppm≈0.458g/y）、蜂鸣开关、阈值 get 回读后写回。
  - **曲线数据未实现**：`hmi_on_range` 留空；主屏实时波形 MCU 250ms `tjc_wave_add` 喂点。
- **构建产物**：`C4F7N_Demo.hex`（19.3KB/256KB ROM，2KB/32KB RAM）。

## 6. 复用命令

```bash
cd tjc-hmi-toolkit
node gen_hmi2.js C4F7N/config_c4f7n.json C4F7N/build          # 重新生成 .pa
./tools/hmipack-tjc.exe C4F7N/base.HMI C4F7N/build C4F7N/C4F7N_HMI_v5.HMI
./tools/verify_all_pages.exe C4F7N/C4F7N_HMI_v5.HMI           # 验证 → 4/4 OK
node C4F7N/verify_scripts.js                                  # 脚本级深度验证 → ERRORS: 0
```

> ⚠️ 模板必须是**软件原生保存的干净工程**（如 base.HMI）：无大背景图、含 main.HMI manifest、含所需字库。
> am1_1024x600.HMI 自带 1024×600 PNG-only 大背景图（0-4.i），hmipack 打包后引擎逐资源验证报"索引超出数组界限"——**不要再用作模板**。

## 7. 验证记录（2026-08-26）

| 检查项 | 结果 |
|---|---|
| `verify_all_pages.exe`（引擎级结构） | 8/8 页 check=33 OK |
| `verify_scripts.js`（脚本级） | **ERRORS: 0**：全部脚本行 ≤15B（最长恰 15B）、无复合赋值、txt 非空、objname 全局唯一 ≤16B、id 连续 |
| 页名 GBK 解码 | 主页/设置/历史曲线/关于 ✓ |
| vvs 属性写入 | cc/pv.vvs=2、h/l.vvs=0 ✓（修复 gen_hmi2.js bug 后） |
| 残留页 4-7 | 模板按摩椅页（b0a/b1a/b2a/b3a），对象名/页名与 C4F7N 无冲突，可 GUI 删除 |
| 脚本中文 | 页内 GBK 字节正确（g/年、开/关、执行中、导出中 均 15B 内） |

### 修复记录：gen_hmi2.js 属性丢失 bug
- **现象**：num 控件显式设置的 `vvs`/`txt` 未写入产物。
- **根因**：`setAttr` 把新属性插到 `end` 标记前，而事件槽标记（codesup-N）位于 end 之前——`clearCodes()` 将槽标记与 end 之间的内容当脚本行全部丢弃。
- **修复**：① 新增 `insertAttr()`，新属性插入到对象类型标记（att-NN）之后、首个事件槽之前；② `clearCodes()` 槽内保留 attr 类型记录。
- **影响**：仅影响含显式新属性的生成；example 产物不受影响。重新生成后 0.pa 增大 42B（vvs 等属性到位），全部验证通过。

### 修复记录：GUI 打开报「索引超出了数组界限」+ 持续弹窗
- **现象**：v2 打开报错+弹窗「@image#1:Clipboard_Screenshot.png」；v3 清图后**每个界面仍报**。
- **根因（最终确认）**：模板 am1 字库只有 `0.zi`(16号)+`3.zi`(24号)，**没有 1.zi/2.zi**；config 中 font=1/2（42 个控件）引用不存在字库 → 引擎资源数组越界。README 所述 "font 0/1/2=16/24/40" 与该模板不符。
- **修复**：`fix_font.js` 将 font 1/2 → 3；`fix_pic.js` 将全部图片引用清零（消除连带弹窗）。产物 v4：font∈{0,3}、图片全 65535、8/8 check=33、脚本级 ERRORS:0。
- **教训**：模板资源（字库/图片）必须实际 dump 验证，不可信任文档/README 描述。

### 修复记录：导航脚本跨页引用 → GUI 打开「索引超出数组界限」逐页弹窗【v8】
- **现象**：v5/v6/v7（对象结构 + 脚本长度 + 资源清单全部静态通过）在 USART HMI GUI 打开仍持续弹窗「索引超出数组界限」，弹窗标题为各页面名，每个页面都弹。
- **根因**：16 个底部导航按钮脚本用**裸对象名**引用**跨页对象**来点亮目标页高亮（如 page0 的 `ns` 写 `page 1\nns1.bco=3222`，但 `ns1` 属于 page1，page0 作用域不存在）。GUI 加载某页时解析该页控件脚本，遇到引用当前页不存在的裸对象名 → 数组越界 → 逐页弹窗。工具链验证（verify_all_pages / verify_scripts）不检查跨页对象解析，故全通过。
- **修复**：所有导航按钮的 `up` 脚本**只保留 `page N` 切页**（去掉 `Xxx.bco=3222` 高亮行），消除全部跨页裸对象引用（`cross-page refs: 0`）。高亮改由后续在目标页加载时处理（或用本页对象，避免跨页）。
- **验证**：`verify_all_pages` 4/4 check=33 OK；`verify_scripts` ERRORS:0；**USART HMI GUI 实测正常打开、4 页全部渲染，无任何弹窗**。
- **教训**：GUI 是唯一能测出「脚本跨页裸对象引用」的验证层；此类问题静态检查无法发现。

### 修复记录（v12 · 最终根因）：事件槽 id 被改写 → 「索引超出数组界限」持续弹窗
- **现象**：单控件逐个验证——text/btn53/num(无vvs)/prog/wave/slider 单独都能开；**任何带事件脚本(codes)的按钮**（btn53/btn98）在 GUI 打开都弹「索引超出数组界限」。
- **根因**：gen_hmi2 的 `clearCodes()`/`setCodes()` 把事件槽 id **改写成了对象 id**（如 `codesdown-1`/`codesup-1`）。而 TJC 引擎按**官方固定槽位** `codesdown-0`/`codesup-1` 索引事件表；改写成对象 id 后引擎查不到 → 数组越界弹窗。官方 am1 所有带脚本按钮事件槽恒为 `codesdown-0`/`codesup-1`（与对象 id 无关）。
- **修复**：gen_hmi2 `clearCodes`/`setCodes` **保留种子原事件槽 id**，不再改写为对象 id。产物事件槽回正为 `codesdown-0`/`codesup-1`。
- **附加**：同时移除 4 个数字控件的 `vvs`（单独测出 vvs 也触发越界）；objname 不再 pad。
- **验证**：`_n3`(btn53+有codes) 修复前弹窗、修复后不弹（GUI 实测）；完整 v12 `verify_all_pages` 4/4=33、`verify_scripts` ERRORS:0。

## 8. MCU 侧联调

固件侧直接使用 `C4F7N/c4f7n_hmi_protocol.h`：
- §1 关键字宏：替换 MCU 解析分支（`strstr` 匹配，注意 `THR:HI:`/`THR:LO:` 后接数字单独一帧）
- §2 对象名宏：替换所有 MCU→屏幕 指令拼装
- §3 指令宏：`HMI_CMD_SET_VAL(OBJ_CONC, 42)` 等
- 示例：告警条切红 → `HMI_CMD_SET_PCO(OBJ_STRIP, C_STRIP_RED);`
