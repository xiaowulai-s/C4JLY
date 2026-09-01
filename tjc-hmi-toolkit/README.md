# TJC USART HMI 程序化生成工具包 (tjc-hmi-toolkit)

通过**代码生成**方式创建淘晶驰(TJC)/Nextion USART HMI 串口屏工程（.HMI 文件）。
**不需要 GUI 操作**：写 JSON 配置 → node 生成 .pa 页面块 → 打包进模板容器 → 验证。

> 反向工程成果：.HMI 容器格式、块 stamp 算法、页面块(.pa)对象表结构已完全攻破。
> 本工具包 = 完整可复用的生成管线。

---

## 快速上手（3 步）

```bash
# 1. 安装依赖（node 18+，需要 iconv-lite）
cd tjc-hmi-toolkit
npm init -y && npm install iconv-lite

# 2. 生成页面（写自己的 config.json，参考 example/gen_example.json）
node gen_hmi2.js example/gen_example.json example/build

# 3. 打包进模板工程
tools\hmipack-tjc.exe template\am1_1024x600.HMI example\build example\out_example.HMI
```

产物 `example\out_example.HMI` 可直接用 USART HMI 软件打开。

---

## 目录结构

```
tjc-hmi-toolkit/
├── gen_hmi2.js            # 通用生成器（核心入口）
├── lib/                   # Node 解析库（来自 nextion-hmi-format，TJC 兼容）
│   ├── page.js            #   页面块 .pa 解析/构建（parse/build/set/get/marker）
│   ├── stamp.js           #   块 stamp 计算（CRC32 ^ K 表）
│   ├── container.js       #   容器读写（读资源列表用）
│   ├── png.js / rgb565.js #   图片格式工具
├── seeds/                 # 控件种子（从官方样例提取的 .pa 页面块）
│   ├── tpl_am1_pas/       #   按摩椅模板各页（页面对象 + 控件参考）
│   ├── tpl_s1/  tpl_s3/  tpl_s4/  tpl_s5/   # 数字/波形/滑块/文本等控件来源
│   └── jd_pas/            # 进度条控件来源
├── tools/                 # 打包与验证工具（.NET 自包含，含全部依赖 DLL）
│   ├── hmipack-tjc.exe    #   打包器：模板 + build 目录 → 输出 .HMI
│   ├── check-page.exe     #   单页验证：check_page <file.HMI> <pageName>
│   ├── verify_all_pages.exe  # 全页验证（引擎级，只查对象结构）
│   ├── extract-pas.exe    #   从 .HMI 提取 .pa 页面块：extract_pas <file.HMI> <outDir>
│   └── extract-res.exe    #   提取资源文件
├── template/              # 基础模板工程
│   └── am1_1024x600.HMI   #   按摩椅 UI (X5 1024x600, 8页) —— 推荐基础模板
└── example/               # 示例（配置 + 生成结果）
```

---

## 核心概念

### .HMI 容器
- 私有容器（非 ZIP）。目录条目 = count + 28B/entry(name[16]/off/size/flags)。
- 布局：目录 + 镜像 + 分配表 + 签名 + 块区（.pa 页面块、.zi 字库、图片等）。
- **不要直接改容器**：目录尾部 4 字节校验和算法未解，必须用 hmipack-tjc.exe 打包重建。

### .pa 页面块
- 头部 56 字节：+4 total size、+8 hdrSize=56、+12 objCount、+20 0x00214F00、+24 页名 char[16]（GBK）、+40 0x00024001。
- 对象表：每对象 12 字节 `[offset][length][0]` + 对象体（offset 相对 +56）。
- 对象体：`u32 length + body`。length≥16 = attr（16B 属性名 + 值）；length<16 = mark（事件脚本行 / 事件标记）；length==0 = 对象结束。
- 属性值：1/2/4 字节 LE 数字，或字符串（objname/txt/path/from/val0/val1 恒为字符串，GBK）。
- 属性名明文：font/objname/bco/pic/sta/x/y/w/h/... 可直接读写。

### 控件类型
- att-29 = 页面（type=121）；att-43 = 按钮（type 98 大 / 53 小）；att-40 = 文本/波形（116/0）；
- att-39 = 数字/进度条/滑动条（54/1）；att-37 = 圆盘滑块（122）；att-9 = 定时器；att-11 = 变量；att-23 = 图片。

---

## 生成器用法

```bash
node gen_hmi2.js <config.json> <builddir>
```

### config.json 结构

```json
{
  "template": "template\\am1_1024x600.HMI",
  "pageSeed": "seeds/tpl_am1_pas/0.pa",
  "seeds": {
    "btn98": { "file": "seeds/tpl_s3/0.pa", "objname": "b0" },
    "btn53": { "file": "seeds/tpl_am1_pas/0.pa", "objname": "bt1" },
    "text":  { "file": "seeds/tpl_s5/0.pa", "objname": "t0" },
    "num":   { "file": "seeds/tpl_s1/0.pa", "objname": "n0" },
    "wave":  { "file": "seeds/tpl_s3/0.pa", "objname": "s0" },
    "slider":{ "file": "seeds/tpl_s4/0.pa", "objname": "h0" },
    "prog":  { "file": "seeds/jd_pas/0.pa", "objname": "j0" },
    "var":   { "file": "seeds/tpl_s5/0.pa", "objname": "temp" }
  },
  "pages": [
    {
      "file": "0.pa",
      "name": "主页",
      "pageObj": { "x": 0, "y": 0, "w": 1024, "h": 600, "bco": 2212 },
      "widgets": [
        {
          "seed": "btn98",
          "objname": "p0_nav_home",
          "id": 1,
          "set": { "x": 0, "y": 534, "w": 256, "h": 52, "font": 1, "txt": "主页", "bco": 3222, "pco": 59230 },
          "codes": { "rel": "page 0" }
        }
      ]
    }
  ]
}
```

### 事件脚本（codes）
- 事件名：`down`（按下 codesdown）、`rel`（松开 codesrel）、`slide`（滑动 codesslide）、`timer`（定时 codestimer）。
- **每行一个独立记录，单行长度必须 ≤15 字节（GBK）**。超过会被引擎解析为畸形 attr 导致崩溃（"索引超出数组界限"）。
- **复合赋值 `+=`/`-=` 在 GUI 引擎不可靠**：`v.val-=50` 崩溃，必须写 `v.val=v.val-50`（配合短对象名压到 ≤15B）。
- **txt 属性不允许空字符串**（len=0 记录被当 end 标记 → 崩溃）。空文本写 1 个空格 `" "`。

### 颜色
- RGB565 小端：`bco/pco/borderc` 等。例：主背景深色 `2212`（0x08A4 = RGB(8,42,66)），文字白 `59230`。
- 常用：黑 `0`、白 `65535`、红 `63488`、绿 `2016`、蓝 `31`。

---

## 验证与调试

```bash
# 引擎级验证（只查对象结构；不查脚本行格式！）
tools\verify_all_pages.exe out.HMI        # 每页输出 check=33 即 OK

# 单页验证（HmiSafeCheckPageFile；0=REJECTED，33=OK）
tools\check-page.exe out.HMI 主页

# 提取 .pa 检查生成结果
tools\extract-pas.exe out.HMI outdir
node -e "var P=require('./lib/page.js');var p=P.parse(require('fs').readFileSync('outdir/0.pa'));console.log(p.objs.map(o=>P.get(o,'objname')))"
```

---

## 硬约束速查（踩坑汇总）

| 约束 | 说明 |
|---|---|
| 脚本行 ≤15B | 引擎 readObj 硬逻辑 L>=16 当 attr 解析 → 崩溃 |
| 无 `+=`/`-=` | GUI 引擎不支持数字控件复合赋值，必须展开 |
| txt 非空 | 空字符串 len=0 = end 标记 → 崩溃，写 `" "` |
| 对象 id 唯一 | 重复 id → 整页拒渲回欢迎页 |
| id 必须 ≤ 对象数-1 | id 不连续且过大 → 数组越界（make_subset 后必须重排 id） |
| 页名/文本 GBK | 中文必须 GBK 编码（gen_hmi2.js 已自动处理） |
| 打包前杀软件 | USART HMI 进程占用模板锁，先 Stop-Process |
| 软件会写回缓存 | 打开工程时软件把内部缓存写回 .HMI，验证用副本 |

---

## 已知问题 / 限制

- **打包产物可能偶发打不开**：hmipack 产物有 ~3.7MB garbage（无效模板残留引用），不同输入组合结果不稳定。遇到打不开：**重新生成 → 重新打包**，或换新输出文件名。
- **字库注入**：字库文件必须同时写入 main.HMI manifest（仅加进容器不够）——此路尚未完全打通，当前依赖模板自带字库（font 0/1/2 = 16/24/40 号等）。
- **48/64 大字**：模板字库未覆盖，需官方字库工具补齐。
- 模板 am1 为 X5 1024x600；其他分辨率模板在 `D:\下载\tjcwiki_resource_collection\资料下载\UI样例工程\` 有 90+ 个官方样例可换用。

---

## 环境要求
- Node.js 18+（建议 22）
- Windows（打包/验证工具为 .NET 自包含，仅 Windows）
- USART HMI 软件（v1.68.x）用于最终 GUI 验证

---

## 文档导航

> 完整文档索引：**[`../DOCS.md`](../DOCS.md)**（C4F7N 项目根导航）。  
> 本目录专项：`AI_HMI_工作流.md`（AI 辅助生流）、`FORMAT.md`（格式）、`TOOLS.md`、`SCRIPTS.md`。
