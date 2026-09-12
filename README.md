# Open in VSCode

[English](#english) | [简体中文](#简体中文)

Open the current Obsidian note in VS Code with one command: open the active file, jump to the exact cursor line and column, or open the whole vault as a folder.

## Features

- Open the **current file** in VS Code
- Open the current file and **jump to the line and column** where your Obsidian cursor is
- Open the **entire vault folder** in VS Code
- Available from the command palette, the file explorer context menu, the editor context menu and a ribbon icon
- Detects the editor automatically on Windows, macOS and Linux
- The editor executable can be overridden, so `cursor`, `trae`, `zed` and `windsurf` work too

## Installation

### From the community plugin browser

Search for **Open in VSCode** in Settings → Community plugins → Browse.

### With BRAT

1. Install and enable [BRAT](https://github.com/TfTHacker/obsidian42-brat)
2. In the BRAT settings choose **Add Beta Plugin** and enter `steelan9199/obsidian-open-in-vscode`
3. Enable **Open in VSCode** in Settings → Community plugins

### Manually

Download `main.js` and `manifest.json` from the [latest release](https://github.com/steelan9199/obsidian-open-in-vscode/releases/latest), put them in `<your vault>/.obsidian/plugins/open-in-vscode/`, then restart Obsidian and enable the plugin.

## Usage

Assign hotkeys in Settings → Hotkeys by searching for `VSCode`. Binding the first two to something like `Ctrl+Shift+E` is recommended.

| Command | Description |
| --- | --- |
| Open in VSCode: Open the current file | Opens the active note |
| Open in VSCode: Open the current file at the cursor position | Passes `-g file:line:col` so VS Code lands on the exact position |
| Open in VSCode: Open the vault folder | Opens the whole vault as a folder |

## Settings

Settings → Community plugins → Open in VSCode

| Setting | Description |
| --- | --- |
| Editor executable | Leave empty to auto-detect. See the table below for common values |
| Reuse the existing window | Enabled by default, passes `-r`. Disable it to always open a new window |
| Extra arguments | For example `--new-window`. Usually left empty |
| Test | Opens the active file with the current settings to verify the path |

Common executable values:

| Target | Path |
| --- | --- |
| Windows | `C:\Users\<you>\AppData\Local\Programs\Microsoft VS Code\bin\code.cmd` |
| macOS | `/usr/local/bin/code` |
| Linux | `/usr/bin/code` |
| Cursor | `cursor` |
| Trae | `trae` |
| Zed | `zed` |

If `code` is not on your `PATH`, set the full absolute path to `code.cmd` and use the **Test** button to verify it.

## Permissions

The community directory review flags two things about this plugin. Both are inherent to what it does, and neither is used for anything beyond launching an editor:

- **Shell execution via `child_process`** — the plugin starts the editor process. There is no other way to open an external application from Obsidian.
- **Filesystem access via `fs`/`path`** — used once, at load time, to check whether an editor executable exists at the expected location. It never reads or writes note content.

The plugin makes **no network requests** and stores nothing outside your vault. You can read every line of what it does in [`src/main.ts`](src/main.ts).

## Development

```bash
git clone https://github.com/steelan9199/obsidian-open-in-vscode.git
cd obsidian-open-in-vscode
npm install
npm run dev      # watch mode, rebuilds main.js on save
npm run build    # typecheck + production build
```

To test against a vault, symlink or copy the repository into `<your vault>/.obsidian/plugins/open-in-vscode/`. `main.js` is a build artifact and is not committed.

Releases are automated. Bump `version` in `manifest.json` and `package.json`, commit, then push a matching tag:

```bash
git tag 1.0.3
git push origin 1.0.3
```

The [release workflow](.github/workflows/release.yml) verifies that the tag matches the manifest version, typechecks, builds, and publishes a release with `main.js` and `manifest.json` attached, along with build provenance attestations.

## License

MIT

---

## 简体中文

在 Obsidian 里一键用 VS Code 打开当前笔记 —— 可以定位到光标所在的行列，也可以直接打开整个库。

### 功能

- 在 VS Code 中打开**当前文件**
- 打开当前文件并**跳转到 Obsidian 光标所在的行和列**
- 用 VS Code 打开**整个库文件夹**
- 命令面板、文件树右键菜单、编辑器右键菜单、左侧栏图标均可触发
- 自动探测本机编辑器路径（Windows / macOS / Linux）
- 命令行路径可自定义，填 `cursor` / `trae` / `zed` / `windsurf` 就能换成别的编辑器

### 安装

- **插件市场**：设置 → 第三方插件 → 浏览，搜索 **Open in VSCode**
- **BRAT**：Add Beta Plugin 填 `steelan9199/obsidian-open-in-vscode`
- **手动**：从 Releases 下载 `main.js` 和 `manifest.json`，放进 `<你的库>/.obsidian/plugins/open-in-vscode/`，重启 Obsidian 后启用

### 使用

设置 → 快捷键 搜索 `VSCode`，建议给前两条命令绑快捷键（例如 `Ctrl+Shift+E`）。

| 命令 | 说明 |
| --- | --- |
| 打开当前文件 | 用 VS Code 打开当前激活的笔记 |
| 打开当前文件并跳到光标行 | 传 `-g 文件:行:列`，直接定位到正在编辑的位置 |
| 打开整个库文件夹 | 以文件夹方式打开整个库 |

### 配置

设置 → 第三方插件 → Open in VSCode

| 项 | 说明 |
| --- | --- |
| 编辑器命令行路径 | 留空自动探测，可填 `code` / `cursor` / `trae` / `zed` |
| 复用已打开的窗口 | 默认开启，传 `-r`；关闭则每次新开窗口 |
| 附加参数 | 例如 `--new-window`，一般留空 |
| 测试 | 用当前配置打开文件，验证路径是否正确 |

### 权限说明

插件市场审核会提示两点，都属于功能本身必需，且仅用于启动编辑器：

- **通过 `child_process` 执行命令** —— 插件需要启动编辑器进程，这是打开外部程序的唯一途径
- **通过 `fs`/`path` 访问文件系统** —— 仅在加载时检查编辑器可执行文件是否存在，从不读写笔记内容

插件**不发起任何网络请求**，也不在你的库之外存储任何数据。全部行为都可以在 [`src/main.ts`](src/main.ts) 中逐行查看。

### 开发

```bash
git clone https://github.com/steelan9199/obsidian-open-in-vscode.git
cd obsidian-open-in-vscode
npm install
npm run dev      # 监听模式，保存即重建 main.js
npm run build    # 类型检查 + 生产构建
```

`main.js` 是构建产物，不纳入版本控制。发版流程见上方英文部分的说明。

## License

MIT
