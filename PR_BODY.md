## Summary

本 PR 提交 **AI 语音绘图工具** MVP 初版，实现纯语音控制的 Web 绘图应用。

### 本日进展（2026-06-14）

- ✅ 完成项目初始化与深色主题 UI 布局
- ✅ 实现 Canvas 绘图引擎（圆/矩形/三角形/椭圆/直线/多边形/文字）
- ✅ 实现中文语音指令解析器，支持同义词容错与复合指令拆解
- ✅ 集成 Web Speech API 连续语音识别
- ✅ 串联应用主逻辑，禁用鼠标/键盘实现纯语音交互
- ✅ 编写设计文档（计划能力 / 已实现 / 未完成说明）

### Commit 记录

| Commit | 说明 |
|--------|------|
| `chore: 初始化 AI 语音绘图工具仓库` | 项目说明与 .gitignore |
| `feat: 完成绘图工具主界面与深色主题布局` | index.html + styles.css |
| `feat: 实现 Canvas 绘图引擎，支持基础图形与撤销` | drawing-engine.js |
| `feat: 实现中文语音指令解析与复合指令拆解` | command-parser.js |
| `feat: 集成 Web Speech API 连续语音识别` | voice-controller.js |
| `feat: 串联语音、解析与绘图，实现纯语音交互` | app.js |
| `docs: 添加设计文档与本地启动脚本` | DESIGN.md + start.bat |
| `chore: 添加 PR 描述模板与推送脚本` | PR_BODY.md + push-and-pr.bat |

## Test plan

- [ ] 使用 Chrome/Edge 打开 `http://localhost:8080`
- [ ] 允许麦克风权限，说「开始监听」
- [ ] 测试基础指令：「画一个红色的圆」
- [ ] 测试复合指令：「画一个红圆然后画蓝色矩形」
- [ ] 测试控制指令：「撤销」「清空画布」「停止监听」
- [ ] 确认鼠标/键盘无法操作画布

## 未完成项（见 DESIGN.md）

- 图形选中/编辑/删除（需 Scene Graph）
- 自由手绘语音路径
- LLM 语义增强 / 离线识别
