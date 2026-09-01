# TJC USART HMI 脚本规范与陷阱

> 源自官方文档与逆向实验（2026-08-25）。

## 1. 脚本行硬限制：≤15 字节（GBK）

**引擎解析逻辑**：
```c
if (L >= 16) parse_as_attr(); // 16B key + value
else parse_as_mark();         // script line / event marker
```

**后果**：脚本行 ≥16 字节 → 被误解析为 attr（key 截断成畸形字段） → 引擎崩溃 "索引超出数组界限"。

**正确做法**：
- 每行独立，≤15 字节（GBK 编码后）。
- 长语句拆成多行或用中间变量。
- 示例：
  ```tjc
  print"PEAK:RESET"   // 15B，去掉空格
  v.val=v.val-50      // 14B，用短对象名
  if(v.val<100)       // 13B
  v.val=100           // 8B
  endif               // 5B
  ```

## 2. 复合赋值 `+=`/`-=` 不可用

**问题**：`v.val-=50` 在 GUI 引擎触发崩溃（可能仅数字控件 val 属性）。
**解决**：展开为普通赋值 `v.val=v.val-50`，并配合短对象名压到 ≤15B。

**官方支持复合赋值的证据**：`input.txt+=`、`n0.val+=`（见于 prints 样例），但数字控件 `.val` 在 TJC GUI 引擎有 bug。

## 3. txt 属性不允许空字符串

**原因**：空字符串记录长度=0 → 被当 end 标记 → 解析器提前结束。
**解决**：写 1 个空格 `txt=" "`。

## 4. 逻辑语句只能写在事件中

- 不支持串口传输脚本。
- 不支持顶层代码——必须在 `codesdown-N` / `codesrel-N` 等事件槽内。

## 5. 判断语句限制

- **不支持括号优先级**：`if(a.val>b.val && c.val<d.val)` 不可靠。
- **不允许多余空格**：`if(p1_hi_val.val<100)` 可能编译报错（官方文档："等号两边不要有空格"）。
- **不支持复杂表达式**：需中间变量或拆分条件。

## 6. while 循环

- 循环期间设备不响应触摸（阻塞）。
- 避免长时间循环。

## 7. 常用语句

| 语句 | 说明 |
|---|---|
| `page N` | 跳转页面 |
| `print "xxx"` | 串口发送字符串（**可去掉空格**：`print"xxx"`） |
| `obj.attr=val` | 属性赋值 |
| `obj.attr=obj.attr±N` | 算术赋值（展开形式，≤15B） |
| `if(cond)` `endif` | 条件（无 else） |
| `tm0.en=1` | 启动定时器 |

## 8. 调试建议

- **先跑 verify_all_pages.exe**：确认对象结构正确（不验脚本）。
- **逐控件添加**：从最小集开始，逐个加控件定位问题对象。
- **检查脚本行长**：`node -e "var p=require('./lib/page.js').parse(require('fs').readFileSync('0.pa'));p.objs.forEach(o=>o.items.filter(i=>i.kind==='mark'&&i.text.length>=16&&/^codes/.test(i.text)===false).forEach(i=>console.log(i.text.length,i.text)))"`
- **属性冲突**：某些属性组合（如 `radius`、`sta`、`style`）需从模板控件继承，显式设置可能缺字段。

## 9. 示例：按钮事件

```json
{
  "seed": "btn98",
  "objname": "btn_reset",
  "set": { "txt": "重置" },
  "codes": {
    "down": "v.val=0\nprint\"RST:0\""
  }
}
```

## 10. 示例：数字控件加减按钮

```json
{
  "seed": "num",
  "objname": "v",
  "set": { "val": 500 }
},
{
  "seed": "btn98",
  "objname": "bm",
  "set": { "txt": "－" },
  "codes": { "down": "v.val=v.val-50\nif(v.val<0)\nv.val=0\nendif" }
},
{
  "seed": "btn98",
  "objname": "bp",
  "set": { "txt": "＋" },
  "codes": { "down": "v.val=v.val+50\nif(v.val>1000)\nv.val=1000\nendif" }
}
```
