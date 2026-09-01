# 工具明细 (tools/)

全部为 .NET 自包含单文件（含依赖 DLL 同目录），仅 Windows x86。

| 工具 | 用法 | 说明 |
|---|---|---|
| `hmipack-tjc.exe` | `hmipack-tjc <template.HMI> <resource-dir> <output.HMI>` | 打包器。把 resource-dir 内的 .pa 等按同名替换进模板容器，输出新 .HMI。输出末尾 "RESULT: opens, N resources" 即打包成功 |
| `check-page.exe` | `check_page <file.HMI> <pageName>` | 引擎级单页验证（HmiSafeCheckPageFile）。返回 33=OK。注意 pageName 需精确匹配（中文页名命令行传参有编码问题，推荐用 verify_all_pages） |
| `verify_all_pages.exe` | `verify_all_pages <file.HMI>` | 引擎级全页验证，输出每页 check=33 OK / bad 计数。**最常用的验证入口** |
| `extract-pas.exe` | `extract_pas <file.HMI> <outDir>` | 从 .HMI 提取全部 .pa 页面块到目录（用于逆向/参考） |
| `extract-res.exe` | `extract_res <file.HMI> <outDir>` | 提取资源文件（图片/字库等） |
| `dump-main.exe` / `dump-main-c.exe` | `dump_main <file.HMI>` | dump manifest 目录条目（资源名/偏移/大小） |

## 依赖说明

- 工具依赖同目录的 DLL：`achmiface.dll`（引擎核心 API）、`hmitype.dll`（类型初始化）、`achmi.bin`（初始化数据）、`Tcode.dll`、`hmiapp_old.dll`、`hmioldapp.dll` 等。
- **不要单独移动 exe**——整目录一起拷贝。
- DevComponents.DotNetBar2.dll 等为软件 UI 库，打包工具链用不到但保留无妨。

## 引擎级验证 vs GUI 验证

| 层级 | 工具 | 检查范围 | 局限 |
|---|---|---|---|
| verify_all_pages | 引擎 API | 页面对象结构、stamp、容器完整性 | **不验证脚本记录格式**（≥16B 行不会报错） |
| check-page | 引擎 API | 单页可加载性 | 同上 |
| USART HMI GUI | 软件 | 完整加载 + 渲染 | 唯一能发现脚本行超长/复合赋值崩溃的验证；打开时软件会把缓存写回 .HMI（用副本验证） |

**经验**：GUI 打开报 "索引超出了数组界限" = 脚本行 ≥16B 或 txt 空字符串或复合赋值 → 按 SCRIPTS.md 排查。
