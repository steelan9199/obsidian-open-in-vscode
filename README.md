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
| Editor executable | What to launch. Leave empty for automatic detection, or enter a command name or an absolute path |
| Reuse the existing window | Enabled by default, passes `-r`. Disable it to always open a new window |
| Extra arguments | For example `--new-window`. Usually left empty |
| Test | Resolves the configured executable and opens the active note with it |

### What to put in "Editor executable"

Three kinds of values are accepted.

**1. Leave it empty (default)**

The plugin looks for VS Code at the standard install locations on Windows, macOS and Linux. If none of them match, it falls back to the bare command `code`, which your system resolves through `PATH`. This is what `Automatic (currently code)` in the placeholder means.

**2. A command name** — resolved through `PATH`

| Value | Opens |
| --- | --- |
| `code` | VS Code |
| `cursor` | Cursor |
| `trae` | Trae |
| `zed` | Zed |
| `windsurf` | Windsurf |

Any other command line tool that accepts a file path works too. Use this only if the command is actually on your `PATH`.

**3. A full absolute path** — use this when the command is not on `PATH`

| Platform | VS Code | Cursor |
| --- | --- | --- |
| Windows | `C:\Users\<you>\AppData\Local\Programs\Microsoft VS Code\bin\code.cmd` | `C:\Users\<you>\AppData\Local\Programs\cursor\resources\app\bin\cursor.cmd` |
| macOS | `/usr/local/bin/code` | `/usr/local/bin/cursor` |
| Linux | `/usr/bin/code` | `/usr/bin/cursor` |

If you installed VS Code somewhere else — for example `D:\software\vscode\Microsoft VS Code\bin\code.cmd` — that value works as well. Check the placeholder text under the setting to see what the plugin currently resolved to.

### Using the Test button

The **Test** button verifies your configuration before you rely on it.

**Prerequisites:**

1. **A note must be open in Obsidian.** The test opens the active note; with no note open it will tell you to open one first.
2. **The value must be resolvable.** For an absolute path the file must exist. For a command name, the command must be on the `PATH` that Obsidian itself can see.
3. **Obsidian must have been started after you changed `PATH`.** Obsidian inherits `PATH` at launch. If you add an editor to `PATH` while Obsidian is running, restart Obsidian first, otherwise the plugin still cannot see it.

**What you get:**

- On success a notice shows the path the command resolved to, and the editor opens your active note.
- On failure a notice tells you the value could not be resolved and suggests entering an absolute path.

If the test succeeds but nothing opens, check whether the editor itself supports being started from a terminal with a file argument — VS Code, Cursor, Trae, Zed and Windsurf all do.

### About PATH

Registering an editor on `PATH` does not break anything, it is in fact the most reliable setup. The plugin resolves the executable in this order:

1. **Absolute path you configured** — checked directly on disk
2. **Standard install location** — checked directly on disk, no `PATH` involved
3. **Fallback to the bare command `code`** — resolved by the system through `PATH`

So an editor installed in a non-standard location still works as long as its command is on `PATH`. The only broken case is an editor that is neither in a standard location nor on `PATH` — in that situation you must supply the absolute path yourself.

On macOS, an Obsidian launched from Finder or the Dock may not see `PATH` entries defined in `.zshrc`. If the test says the command is unresolvable there, enter the absolute path instead.

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
| 编辑器命令行路径 | 要启动什么。留空自动探测，也可填命令名或绝对路径 |
| 复用已打开的窗口 | 默认开启，传 `-r`；关闭则每次新开窗口 |
| 附加参数 | 例如 `--new-window`，一般留空 |
| 测试 | 解析当前配置并用它打开当前笔记 |

### 命令行路径里能填什么

接受三种填法。

**1. 留空（默认）**

按 Windows / macOS / Linux 的标准安装位置依次查找 VS Code，都没命中就退回裸命令 `code`，由系统的 `PATH` 解析。设置框下方 `Automatic (currently code)` 里的 `code` 就是当前解析到的值。

**2. 命令名** —— 通过 `PATH` 解析

| 填 | 打开 |
| --- | --- |
| `code` | VS Code |
| `cursor` | Cursor |
| `trae` | Trae |
| `zed` | Zed |
| `windsurf` | Windsurf |

其它能接受文件路径参数的命令行工具也行。前提是这些命令确实在 `PATH` 里。

**3. 完整绝对路径** —— 命令不在 `PATH` 时用这个

| 平台 | VS Code | Cursor |
| --- | --- | --- |
| Windows | `C:\Users\<你>\AppData\Local\Programs\Microsoft VS Code\bin\code.cmd` | `C:\Users\<你>\AppData\Local\Programs\cursor\resources\app\bin\cursor.cmd` |
| macOS | `/usr/local/bin/code` | `/usr/local/bin/cursor` |
| Linux | `/usr/bin/code` | `/usr/bin/cursor` |

装在其它位置的也可以直接填，比如 `D:\software\vscode\Microsoft VS Code\bin\code.cmd`。

### Test 按钮怎么用

**前提条件：**

1. **必须先打开一个笔记** —— Test 打开的是当前激活的笔记，没打开会提示你先开一个
2. **填写的值必须可解析** —— 绝对路径要求文件真实存在，命令名要求能在 `PATH` 中查到
3. **改过 `PATH` 后要重启 Obsidian** —— Obsidian 在启动时才继承 `PATH`，运行中改动它看不到

**你会看到什么：**

- 成功：弹窗显示解析到的具体路径，同时编辑器打开当前笔记
- 失败：弹窗明确告诉你解析不到，并建议改填绝对路径

如果测试成功但编辑器没打开，检查该编辑器是否支持从命令行带文件路径启动（VS Code、Cursor、Trae、Zed、Windsurf 都支持）。

### 关于 PATH

把编辑器注册进 `PATH` 不会导致插件失效，反而是最稳的情况。插件按这个顺序解析可执行文件：

1. **你填的绝对路径** —— 直接检查文件是否存在
2. **标准安装位置** —— 直接检查，不涉及 `PATH`
3. **兜底用裸命令 `code`** —— 交给系统通过 `PATH` 解析

所以装在非标准位置的编辑器，只要命令在 `PATH` 里就照样能用。唯一会失败的情况是：既不在标准位置、又没进 `PATH`，这时必须手动填绝对路径。

macOS 上从 Finder 或 Dock 启动的 Obsidian 可能读不到 `.zshrc` 里配置的 `PATH`，遇到解析失败直接填绝对路径即可。

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
