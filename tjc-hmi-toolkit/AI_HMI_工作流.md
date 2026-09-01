# AI 辅助 HMI 设计 · 工作流手册

> 面向对象的端到端流程：**产品意图 → 结构化规格 → 程序化生成 → 引擎验证 → GUI 验证 → 烧录**
> 从 C4F7N 检漏仪 4 页 HMI 的实际攻坚中提炼（2026-08，v17b 编译通过）。

---

## 0. 总览（一句话）

用两套工具协同：在 `C4F7N_LeakDetector/tjc-project/` 做**规格设计**（JSON），用 `tjc-hmi-toolkit/` 做**程序化生成**（JSON → .pa → 打进模板容器 → 验证）。**全程无需在 USART HMI 里手工拖控件**，仅用 GUI 做最终验证。

```
┌──────────┐  ┌──────────────┐  ┌────────────────┐  ┌──────────────┐  ┌──────────┐
│  产品意图  │→│ 结构化规格 JSON │→│ 程序化生成 .pa   │→│ 打包+引擎验证   │→│ GUI/真机  │
│(视觉稿/需求)│  │ tjc-project   │  │ gen_hmi2.js    │  │ hmipack/verify│  │  验证     │
└──────────┘  └──────────────┘  └────────────────┘  └──────────────┘  └──────────┘
```

---

## 1. 阶段 A：规格设计（tjc-project）

在 `C4F7N_LeakDetector/tjc-project/` 用一系列 JSON/MD 描述设计：

| 文件 | 内容 |
|---|---|
| `01_project_spec.md` | 产品规格（功能、页面、交互需求） |
| `02_project.json` | 工程元数据（分辨率、模板、字库） |
| `03_device.json` | 目标屏硬件（分辨率 1024×600、类型） |
| `04_page_map.json` | 页索引与导航图 |
| `05_component_map.json` | 每页控件清单（对象名/类型/坐标/样式） |
| `06_variables.json` | 全局变量表 |
| `07_serial_protocol.json` | MCU↔屏 串口协议 |
| `08_alarm_config.json` | 报警阈值配置 |
| `09_pages/*.json` | 逐页控件明细 |
| `11_scripts/*.hmi` | 页面脚本草案（TJC 语法） |
| `12_validation_report.md` | 验证报告模板 |

**AI 在此阶段产出**：读视觉稿/需求 → 生成上述规格 JSON。

---

## 2. 阶段 B：程序化生成（tjc-hmi-toolkit）

### 2.1 生成 config
把规格 JSON 综合成 `gen_hmi2.js` 的 config（`seeds` + `pages[].widgets`）。参考 `example/gen_example.json` 与 `C4F7N/config_c4f7n.json`。

### 2.2 三大步骤
```bash
cd tjc-hmi-toolkit
# 1) 生成页面块
node gen_hmi2.js your_cfg.json your_build

# 2) 打包进模板
tools\hmipack-tjc.exe template\am1_1024x600.HMI your_build out.HMI

# 3) 引擎级验证（结构，不验脚本）
tools\verify_all_pages.exe out.HMI     # 每页 check=33 即 OK
```

---

## 3. 阶段 C：验证闭环（最重要）

`verify_all_pages.exe` **只查对象结构，不验脚本/槽号/跨页引用**。必须叠加以下检查：

| 校验 | 命令 / 方式 | 兜住的坑 |
|---|---|---|
| 对象结构 | `verify_all_pages.exe` | 各页 check=33 |
| 脚本行 ≤15B | `gen_hmi2.js` 已自动 + eslint 式扫描 | ≥16B → 引擎当 attr 解析 → 「索引超出数组界限」 |
| 事件槽号=行数 | `fix_slotcounts.js` / 扫描 | 槽号 N 必须等于槽后脚本行数 |
| txt_maxl | `check_txtmaxl.js` | 文本 GBK 字节 ≤ txt_maxl |
| 脚本关键字 | 无 print/cls/bco 赋值 | 编译「变量名称无效」 |
| **真机/GUI 验证** | USART HMI 打开 + 编译 | 唯一能抓编译错/弹窗 |

---

## 4. TJC 脚本语言支持度（务必遵守）

| 写法 | 支持？ | 备注 |
|---|---|---|
| `page N` | ✅ | 页面跳转 |
| `obj.val=N` | ✅ | 标志位/数字（模板大量用） |
| `obj.txt="..."` | ✅ | 文本赋值（GBK） |
| `obj.x/y/pic=N` | ✅ | 位置/图片 |
| `if(cond)` | ✅ | **必须接 `{ }`；无 `endif`、无 `else`** |
| `print"..."` | ❌ | 编译「变量名称无效:print」 |
| `print 变量` | ❌ | 同上 |
| `cls 0` | ❌ | 编译「变量名称无效:cls」 |
| `obj.bco=色` | ❌ | 编译「变量名称无效:obj.bco」 |
| `obj.val-=N` 复合赋值 | ❌ | 需展开 `v.val=v.val-N` |
| `else` / `endif` | ❌ | 用独立 `if(cond){ }` 块替代 |

---

## 5. 硬约束速查（踩坑汇总）

| 约束 | 说明 |
|---|---|
| 脚本行 ≤15B（GBK 字节） | ≥16 被当作畸形 attr → 崩溃 |
| 事件槽号 N = 槽后脚本行数 | 不符 → 「索引超出数组界限」上电弹窗 |
| 清空脚本槽号归 0 | clearCodes 已处理 |
| 只能 `val/txt/x/y/pic` 赋值 | 不能 `bco/print/cls` |
| txt 非空 | 空串写 `" "` |
| 对象 id 唯一且连续 0..n-1 | 重复/过大 → 页面拒渲 |
| 中文 GBK 编码 | gen_hmi2.js 已自动处理 |
| 导航按钮用 btn53 | 兼容性 |
| slider 不带事件脚本 | 预防崩溃 |
| 打包前杀 USART HMI 进程 | 模板/输出文件被锁 |
| 验证用副本 | 软件打开会写回缓存 |

---

## 6. 复用一个新工程的检查清单

- [ ] 选对分辨率模板（或换用干净 base.HMI）
- [ ] 配置 seeds（每个控件类型字母对应种子文件）
- [ ] 所有脚本行逐行 ≤15B
- [ ] 无 print/cls/bco 赋值
- [ ] if 用 `{ }`、无 else/endif
- [ ] 生成后扫描槽号=行数
- [ ] verify_all_pages 全 33 OK
- [ ] GUI 打开编译通过、无弹窗
- [ ] 真机各页往返 + 交互测试

---

## 7. 参考命令

```bash
cd tjc-hmi-toolkit
node gen_hmi2.js C4F7N/config_c4f7n.json C4F7N/v17build
tools\hmipack-tjc.exe C4F7N\base.HMI C4F7N\v17build C4F7N\C4F7N_HMI_v17b.HMI
tools\verify_all_pages.exe C4F7N\C4F7N_HMI_v17b.HMI
node _scan_slots.js   # 槽号=行数校验
```

> 详细格式规范见 `C4F7N/C4F7N_HMI_生成映射表.md`（§5.5 槽号规则、§5.6 脚本语言支持度）、`README.md`、`SCRIPTS.md`、`FORMAT.md`。