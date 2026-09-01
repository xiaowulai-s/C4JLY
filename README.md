# C4F7N 便携式检漏仪（全氟异丁腈）

> 用于 GIS / 高压断路器 / 环网柜等环保绝缘气体（C4F7N / NOVEC 4710）泄漏检测的便携式检漏仪。
> 主控：STM32F103RCT6　|　传感器：GC5G1 NDIR 全氟异丁腈传感模组　|　屏幕：TJC 7寸 USART HMI 1024×600

***

## 目录架构

```
C4jly/
├── DOCS.md                       # 文档导航（快速入口 / 硬件连接速查）
├── GC5G1(C4F7N)全氟异丁腈传感器V2.2.pdf   # 传感器技术规格
│
├── C4F7N_Demo/                   # ★ 主控固件工程（STM32F103RCT6）
│   ├── Core/                     #   CubeMX 管辖：main.*、外设 init（usart/gpio/adc/spi）
│   ├── Drivers/                  #   HAL + CMSIS（CubeMX 生成，勿手改）
│   ├── BSP/                      #   自管驱动：sensor / battery / w25q16 / param_store
│   ├── Middleware/               #   自管通信：tjc_cmd / hmi_callback / hmi_get / 协议头
│   ├── .eide/                    #   eIDE 工程配置（eide.yml）
│   ├── .ioc / .mxproject         #   CubeMX 工程（重生成用）
│   ├── MDK-ARM/                  #   eIDE 构建 + startup 汇编
│   └── README.md                 #   固件总览 + 进度 + 接线 + 约束注意事项
│
├── C4F7N_LeakDetector/           # 产品规格 / 硬件设计 / 集成文档
│   ├── 01_样件采购清单.md         #   BOM 采购
│   ├── 02_台架验证方案.md         #   台架测试方案
│   ├── 06_设计基线_v1.0.md        #   设计基线
│   ├── 04_连接清单.md / 03_立创元件对照表.md
│   ├── tjc-project/              #   屏幕工程规格 140+ 文档
│   ├── tools/                    #   HMI 搭建清单、布线导出脚本
│   ├── Software/                 #   参考版软件骨架（CubuMX）
│   └── README.md                 #   产品总览
│
├── C4F7N_LeakDetector-output/    # KiCad 输出库（elibz / epro / 日志）
│
├── HMI/                          # 屏幕工程与开发资源
│   ├── *.HMI                     #   屏幕工程（v17b、演示工程等）
│   ├── extracted/ images/        #   已提取资源（.zi / 图片）
│   ├── auto/                     #   屏幕 GUI 自动化脚本 + 调试截图
│   └── XRD_TFT/                  #   触控/变量配置文件
│
└── tjc-hmi-toolkit/              # ★ 屏幕程序化生成工具链（AI 辅助）
    ├── C4F7N/                    #   目标工程：config_c4f7n.json、C4F7N_HMI_v*.HMI
    │                             #   生成映射表 / 命令码协议文档
    ├── gen_hmi2.js / verify_scripts.js / check_*.js   # 核心生成/校验脚本
    ├── seeds/ template/          #   控件模板 / HMI 模板
    ├── lib/ tools/               #   容器/页面/Png 库、hmipack-tjc.exe 等工具
    └── README.md / FORMAT.md / TOOLS.md / SCRIPTS.md / AI_HMI_工作流.md
```

## 各主要工作区说明

| 工作区                   | 定位                                                         |
| --------------------- | ---------------------------------------------------------- |
| `C4F7N_Demo/`         | **主控固件**：STM32 + LCD 通信、传感器采集、电池、存储、标定/设置。eIDE 构建产出 `.hex` |
| `tjc-hmi-toolkit/`    | **屏幕程序化生成**：JSON 配置 → 自动生成/校验 `.HMI` 工程与界面脚本               |
| `C4F7N_LeakDetector/` | **产品与硬件**：规格、BOM、连接、台架方案、设计基线文档                            |
| `HMI/`                | 屏幕工程源文件与 GUI 自动化开发资源                                       |
| `DOCS.md`             | 全项目文档导航与硬件连接速查                                             |

> 详细文档索引、硬件接线速查 → 见 **[`DOCS.md`](./DOCS.md)**

