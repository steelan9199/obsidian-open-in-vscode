# Open in VSCode

[English](#english) | 简体中文

在 Obsidian 里一键用 VSCode 打开当前笔记 —— 可以定位到光标所在行，也可以直接打开整个库。

不依赖任何第三方插件，不联网，只有一个 `main.js`。

## 功能

- 在 VSCode 中打开**当前文件**
- 打开当前文件并**跳转到 Obsidian 光标所在的行和列**
- 用 VSCode 打开**整个库文件夹**
- 文件树右键菜单、编辑器右键菜单、左侧栏图标均可触发
- 自动探测本机 VSCode 安装路径（Windows / macOS / Linux）
- 命令行路径可自定义，填 `cursor` / `trae` / `zed` 就能换成别的编辑器

## 安装

### 方式一：BRAT（推荐，未上架社区市场时）

1. 安装 [BRAT](https://github.com/TfTHacker/obsidian42-brat) 插件并启用
2. BRAT 设置 → Add Beta Plugin → 填 `steelan9199/obsidian-open-in-vscode`
3. 启用 **Open in VSCode**

### 方式二：手动安装

1. 到 Releases 下载 `main.js`、`manifest.json`、`versions.json`
2. 放到 `<你的库>/.obsidian/plugins/open-in-vscode/` 目录下
3. 重启 Obsidian → 设置 → 第三方插件 → 启用 **Open in VSCode**

## 使用

在 设置 → 快捷键 里搜索 `VSCode`，建议给前两条命令绑快捷键（例如 `Ctrl+Shift+E`）。

| 命令 | 说明 |
| --- | --- |
| Open in VSCode: 在 VSCode 中打开当前文件 | 打开当前激活的笔记 |
| Open in VSCode: 在 VSCode 中打开当前文件并跳到光标行 | 带 `-g file:line:col`，直接定位到正在编辑的位置 |
| Open in VSCode: 在 VSCode 中打开整个库文件夹 | 以文件夹方式打开整个库 |

## 配置

设置 → 第三方插件 → Open in VSCode

| 项 | 说明 |
| --- | --- |
| 编辑器命令行路径 | 留空自动探测。常见填法见下表 |
| 复用已打开的窗口 | 默认开，传 `-r`；关掉则每次新开窗口 |
| 附加参数 | 例如 `--new-window`，一般留空 |
| 测试 | 用当前配置打开一个文件，验证路径对不对 |

手动填写示例：

| 系统 | 路径 |
| --- | --- |
| Windows | `C:\Users\<你>\AppData\Local\Programs\Microsoft VS Code\bin\code.cmd` |
| macOS | `/usr/local/bin/code` |
| Linux | `/usr/bin/code` |
| 换成 Cursor | `cursor` |
| 换成 Trae | `trae` |
| 换成 Zed | `zed` |

## 常见问题

**点了没反应？**
VSCode 安装时没把 `code` 加入 PATH。到插件设置里填完整的 `code.cmd` 绝对路径，或用「测试」按钮验证。

**手机上能用吗？**
不能。插件依赖桌面端的 Node 环境启动外部程序，`isDesktopOnly: true`。

**会修改我的笔记内容吗？**
不会。插件只读当前文件路径，然后启动 VSCode，不读写任何笔记内容。

## English

Open the current Obsidian note in VSCode with one command: open the active file, jump to the exact cursor line and column, or open the whole vault as a folder. No third-party dependency, no network, single `main.js`.

Install via BRAT (`steelan9199/obsidian-open-in-vscode`) or by copying `main.js`, `manifest.json` and `versions.json` into `.obsidian/plugins/open-in-vscode/`.

The editor executable is auto-detected on Windows, macOS and Linux. Set it manually to `cursor`, `trae` or `zed` to open notes in another editor instead.

## License

MIT
