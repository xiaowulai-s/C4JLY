# TJC / Nextion .HMI 与 .pa 二进制格式规范

> 来源：对 TJC USART HMI (v1.68.1) 与 Nextion 官方解析库的逆向验证。
> TJC 与 Nextion 同源（XML 描述），Nextion 的 page.js 解析器可直接用于 TJC。

## 1. .HMI 容器格式

```
0x000000  目录区
0x080000  镜像区（崩溃残留，打开时不读）
0x380000  分配表
0x6ffff8  签名区（ver2+ 面板型号）
之后      块区（.pa 页面块 / .zi 字库 / .bmp 图片等资源块）
```

### 目录
- 魔数 `E2 27 93 73`（= manifest content stamp，4 字节 LE）
- 结构：`count(u32) + count × 28B entry`
- entry：`name[16] + off(u32, 24位LE+1保留) + size(u32) + flags(u32)`
- 目录尾部 4 字节校验和算法**未解** → **不可自行写目录**，必须用 hmipack-tjc.exe 打包重建。

### 资源名
- 页面块：`0.pa`、`1.pa` ...
- 字库：`0.zi`、`1.zi` ...（GBK 码表字库）
- 图片：`0.bmp` 等；png 资源另有结构

### 块 stamp
- 每个块（含 manifest 本身）尾部有 4 字节 stamp。
- `stamp = CRC32(message) ^ K(L)`
- CRC32 参数：POLY `0x04C11DB7`，MSB-first 非反射，init 0，无 final XOR。
- message = 块内 offset 4 起每字节扩成 4 字节 BE u32 + **40 个零字节尾部**（按 32 位字哈希）。
- **K 为引擎硬编码常数表，只依赖块长度 L**，非公式。TJC 与 Nextion 的 K 值不同。
- 完整 K 表：`lib/stamp.js` 内嵌（134 个长度，覆盖 51..6199284）。

## 2. .pa 页面块结构

### 头部 56 字节
| 偏移 | 大小 | 含义 |
|---|---|---|
| +0  | 4 | magic（0x00 开头） |
| +4  | 4 | total size（LE） |
| +8  | 4 | hdrSize = 56 |
| +12 | 4 | objCount（对象数，含页面对象） |
| +16 | 4 | ? |
| +20 | 4 | `0x00214F00` |
| +24 | 16 | 页名 char[16]（GBK，不足补 0） |
| +40 | 4 | `0x00024001` |
| +44 | 12 | 保留 |

### 对象表
- 紧随头部：每对象 12 字节 `[offset(u32)][length(u32)][0(u8?)]`
- **offset 相对 +56（头部末尾），不是绝对文件偏移！**
- length = 对象体字节数（不含 12B 表项）

### 对象体编码
对象体 = 一系列记录：
```
记录 = u32 length + body
- length >= 16 : attr（属性）
    body = key[16]（属性名，GBK/ASCII，不足补0）+ value
    value 类型：1/2/4 字节 LE 数字，或字符串（u32 len + bytes）—— 视属性名而定
- length < 16  : mark（标记/脚本行）
    body = text（length 字节）
- length == 0  : 对象结束标记
```

### 属性值类型
- 字符串属性（恒为字符串）：`objname` `txt` `path` `from` `val0` `val1`
- 数字属性：`x` `y` `w` `h` `font` `bco` `pco` `borderc` `borderw` `sta` `pic` `picc` `val` `id` `type` `vscope` `drag` `sendkey` `aph` `movex` `movey` `endx` `endy` `effect` `first` `time` `lockobj` `groupid0` `groupid1` `style` `pic2` `picc2` `bco2` `pco2` `xcen` `ycen` `txt_maxl` `isbr` `spax` `spay` 等
- 数字宽度：1/2/4 字节 LE，由值大小决定（引擎用原始 raw 字节数）

### 事件脚本存储
- 对象内事件槽：`codesdown-N` / `codesup-N` / `codesrel-N` / `codesslide-N` / `codestimer-N`（N = 对象 id）
- **每个脚本行 = 一个独立的短 mark 记录**（length < 16）
- 槽标记之间是脚本行；`codesup-N` 后可跟其他槽
- 事件 id 必须与对象 id 一致（克隆时必须刷新 N）

## 3. 控件类型图鉴

| att 标记 | 控件类 | type 值 | 说明 |
|---|---|---|---|
| att-29 | 页面 | 121 | 每个 .pa 第一个对象 |
| att-28 | 页面(旧) | - | 老式页面 |
| att-43 | 按钮 | 98 / 53 | 大按钮 / 小按钮 |
| att-40 | 文本 / 波形 | 116 / 0 | text / wave |
| att-39 | 数字 / 进度条 / 滑动条 | 54 / 1 / 1 | number / progbar / slider |
| att-37 | 圆盘滑块 | 122 | |
| att-9 | 定时器 | - | tm0 等 |
| att-11 | 变量 | - | temp 等 |
| att-23 | 图片 | - | |

## 4. lib/page.js API

```js
var PAGE = require('./lib/page.js');
var p = PAGE.parse(fs.readFileSync('0.pa'));
p.objs                 // 对象数组（[0] 是页面对象）
PAGE.get(obj, 'objname')   // 读属性
PAGE.set(obj, {x: 100})    // 改属性（patch）
PAGE.build(name, objs, head)  // 构建新 .pa（head 取模板页的 head）
PAGE.marker(obj)           // 对象结束标记
PAGE.HEADER_SIZE           // 56
```

## 5. lib/stamp.js API

```js
var STAMP = require('./lib/stamp.js');
STAMP.calc(buffer)  // 计算块 stamp（含 40 零尾）
```

## 6. 图片资源（png）
- 图片记录结构：PNG 数据 + RGB565 双份 + 旋转信息 + index 公式
- 参考 `lib/png.js` `lib/rgb565.js`
