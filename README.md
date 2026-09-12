# Open in VSCode

[English](#english) | [简体中文](#简体中文)

Open the current Obsidian note in VS Code with one command: open the active file, or open the whole vault as a folder.

## Features

- Open the **current file** in VS Code
- Open the **entire vault folder** in VS Code
- Available from the command palette, the file explorer context menu, the editor context menu and a ribbon icon
- Detects the editor automatically on Windows, macOS and Linux
- The editor executable can be overridden, so `cursor`, `trae`, `zed` and `windsurf` work too

## How it works

Every command in this plugin ends in the same four steps. Only the target that gets passed along changes.

1. **Work out the target** — the absolute path of the active note, or the vault folder. Obsidian stores note paths relative to the vault, so the plugin prefixes them with the vault's path on disk.
2. **Work out which editor to run** — the interesting part, broken down below.
3. **Build the command line** — `<editor> [-r] <target> [extra arguments]`. `-r` reuses an already open window.
4. **Start it and let go** — the editor is launched detached, so Obsidian does not wait for it and stays responsive while the editor opens.

### How the editor is picked

This single step is behind nearly every "nothing happens" report, so here it is in full.

1. **Start from what you configured.** The value in *Editor executable* is used as is. If you left it empty, the plugin runs its own detection instead.
2. **Detect, when the field is empty.** A list of standard install locations for your platform is checked on disk, in order; the first one that exists wins. If none of them do, it falls back to the bare command name `code`.
3. **Correct `.exe` on Windows.** If the value points at a main application executable such as `Code.exe`, the plugin looks for the command line entry point next to it (`bin\code.cmd` or `resources\app\bin\code.cmd`) and silently uses that instead — only the CLI entry point reliably accepts `-r`.
4. **Resolve command names to a real path.** A bare name like `code`, `cursor` or `trae` is looked up with `where` on Windows and `command -v` on macOS and Linux, using the same `PATH` Obsidian itself was launched with. When several matches come back, a `.cmd`/`.bat` entry point wins.
5. **Only then start the editor.** The plugin never hands a bare command name to the shell — it always spawns the concrete absolute path it ended up with.

Step 5 is deliberate, not incidental. Obsidian runs on Electron, and the environment Electron passes to a child shell on Windows is incomplete: `PATHEXT` is missing. Without it `cmd` cannot expand `code` into `code.cmd`, and the launch fails with **exit code 9009** even though `code` is perfectly on your `PATH`. Resolving the path first sidesteps that entirely.

The practical consequence: **a full absolute path is the most reliable thing you can put in the setting** — there is nothing left to look up. A command name that is genuinely on `PATH` works just as well in practice, exactly because the plugin resolves it before launching. The only setup that cannot work is an editor that is neither at a standard location, nor on `PATH`, nor entered as an absolute path.

## Installation

### From the community plugin browser

Search for **Open in VSCode** in Settings → Community plugins → Browse.

### Manually

Download `main.js` and `manifest.json` from the [latest release](https://github.com/steelan9199/obsidian-open-in-vscode/releases/latest), put them in `<your vault>/.obsidian/plugins/open-in-vscode/`, then restart Obsidian and enable the plugin.

## Usage

Assign hotkeys in Settings → Hotkeys by searching for `VSCode`. Binding the first one to something like `Ctrl+Shift+E` is recommended.

| Command | Description |
| --- | --- |
| Open in VSCode: Open the current file | Opens the active note |
| Open in VSCode: Open the vault folder | Opens the whole vault as a folder |

## Settings

Settings → Community plugins → Open in VSCode

| Setting | Description |
| --- | --- |
| Editor executable | What to launch. Leave empty for automatic detection, or enter a command name or an absolute path |
| Reuse the existing window | Enabled by default, passes `-r`. Disable it to always open a new window |
| Extra arguments | For example `--new-window`. Usually left empty |
| Test | Resolves the configured executable and opens the active note with it |
| Debug logging | Off by default. Logs the resolved command line to the developer console and reports the exit code. Turn it on when the editor does not open |

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

**3. A full absolute path** — the most reliable option, and the one to use when the command is not on `PATH`

| Platform | VS Code | Cursor |
| --- | --- | --- |
| Windows | `C:\Users\<you>\AppData\Local\Programs\Microsoft VS Code\bin\code.cmd` | `C:\Users\<you>\AppData\Local\Programs\cursor\resources\app\bin\cursor.cmd` |
| macOS | `/usr/local/bin/code` | `/usr/local/bin/cursor` |
| Linux | `/usr/bin/code` | `/usr/bin/cursor` |

If you installed VS Code somewhere else — for example `D:\software\vscode\Microsoft VS Code\bin\code.cmd` — that value works as well. Check the placeholder text under the setting to see what the plugin currently resolved to.

### Which file to point at on Windows

Windows ships two executables, and they do not behave the same:

| File | Location | Behaviour |
| --- | --- | --- |
| `code.cmd` | `...\Microsoft VS Code\bin\code.cmd` | **Recommended.** The official command line entry point, fully supports `-r` |
| `Code.exe` | `...\Microsoft VS Code\Code.exe` | Opens the file, but does not reliably accept the CLI flag, so reusing the window may not work |

You can enter either one. When you point at the `.exe`, the plugin looks for the command line entry point next to it and silently uses that instead, so you get the full behaviour either way. The Test button shows a notice whenever it makes this switch.

The same applies to other Electron based editors: if a `bin\*.cmd` or `resources\app\bin\*.cmd` exists beside the executable you picked, it will be preferred.

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

Registering an editor on `PATH` does not break anything — it is one of the two setups that work well. The plugin resolves the executable in this order:

1. **Absolute path you configured** — checked directly on disk
2. **Standard install location** — checked directly on disk, no `PATH` involved (only when you left the setting empty)
3. **Bare command name** — looked up through `PATH` with `where` / `command -v`, then turned into a concrete path before the editor is launched

So an editor installed in a non-standard location still works as long as its command is on `PATH`. The only broken case is an editor that is neither in a standard location nor on `PATH` — in that situation you must supply the absolute path yourself.

Two things worth knowing:

- **Obsidian inherits `PATH` when it starts.** If you add an editor to `PATH` while Obsidian is running, restart Obsidian before testing — otherwise the plugin still cannot see it.
- **The plugin resolves before it launches.** It never lets the shell expand a command name, because the shell environment Obsidian provides on Windows is missing `PATHEXT` and would fail with exit code 9009. See [How it works](#how-it-works).

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

在 Obsidian 里一键用 VS Code 打开当前笔记，或者直接打开整个库。

### 功能

- 在 VS Code 中打开**当前文件**
- 用 VS Code 打开**整个库文件夹**
- 命令面板、文件树右键菜单、编辑器右键菜单、左侧栏图标均可触发
- 自动探测本机编辑器路径（Windows / macOS / Linux）
- 命令行路径可自定义，填 `cursor` / `trae` / `zed` / `windsurf` 就能换成别的编辑器

### 工作原理

插件的每条命令都走同样四步，只有传出去的目标不一样。

1. **确定目标** —— 当前笔记的绝对路径，或者整个库文件夹路径。Obsidian 里的笔记路径是相对库的，所以插件会拼上库在磁盘上的真实路径。
2. **确定用哪个编辑器打开** —— 关键一步，下面单独展开。
3. **拼命令行** —— `<编辑器> [-r] <目标> [附加参数]`。`-r` 复用已打开的窗口。
4. **启动并放手** —— 编辑器以独立进程启动，Obsidian 不等它，界面不会卡住。

### 编辑器是怎么选出来的

几乎所有「点了没反应」都出在这一步，所以完整说一遍。

1. **以你填的值为准。** 取「编辑器命令行路径」里的内容原样使用；留空则进入自动探测。
2. **自动探测（留空时）。** 按平台依次检查一批标准安装位置是否存在，命中第一个就停；都没命中就退回裸命令 `code`。
3. **Windows 上纠正 `.exe`。** 如果填的是主程序 `Code.exe`，插件会在它旁边找命令行入口（`bin\code.cmd` 或 `resources\app\bin\code.cmd`）并改用后者 —— 只有命令行入口能稳定接受 `-r`。
4. **命令名解析成真实路径。** `code` / `cursor` / `trae` 这类裸命令，Windows 上用 `where`、macOS 和 Linux 上用 `command -v` 查询，用的是 Obsidian 启动时继承的那份 `PATH`。查到多个结果时优先取 `.cmd` / `.bat`。
5. **解析完成后才启动。** 插件绝不把裸命令名丢给 shell，它启动的永远是最终拿到的那个完整绝对路径。

第 5 步是特意这么设计的，不是顺手写的。Obsidian 基于 Electron，而 Electron 传给子 shell 的环境在 Windows 上是不完整的 —— 少了 `PATHEXT`。没有它，`cmd` 无法把 `code` 展开成 `code.cmd`，于是启动直接失败，报 **退出码 9009**，哪怕 `code` 明明在 `PATH` 里。先把路径解析出来，就彻底绕开了这个问题。

实际影响只有一句：**填完整绝对路径是最可靠的填法**，因为什么都不用再查。填命令名（只要它真在 `PATH` 里）实践上同样稳，原因也正是插件会先解析再启动。唯一用不了的情况是：既不在标准位置、又没进 `PATH`、你也没手填路径。

### 安装

- **插件市场**：设置 → 第三方插件 → 浏览，搜索 **Open in VSCode**
- **手动**：从 Releases 下载 `main.js` 和 `manifest.json`，放进 `<你的库>/.obsidian/plugins/open-in-vscode/`，重启 Obsidian 后启用

### 使用

设置 → 快捷键 搜索 `VSCode`，建议给第一条命令绑快捷键（例如 `Ctrl+Shift+E`）。

| 命令 | 说明 |
| --- | --- |
| 打开当前文件 | 用 VS Code 打开当前激活的笔记 |
| 打开整个库文件夹 | 以文件夹方式打开整个库 |

### 配置

设置 → 第三方插件 → Open in VSCode

| 项 | 说明 |
| --- | --- |
| 编辑器命令行路径 | 要启动什么。留空自动探测，也可填命令名或绝对路径 |
| 复用已打开的窗口 | 默认开启，传 `-r`；关闭则每次新开窗口 |
| 附加参数 | 例如 `--new-window`，一般留空 |
| 测试 | 解析当前配置并用它打开当前笔记 |
| 调试日志 | 默认关闭。把解析出的命令行打到开发者控制台并回报退出码；编辑器打不开时打开它 |

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

**3. 完整绝对路径** —— 最可靠的填法，命令不在 `PATH` 时就填这个

| 平台 | VS Code | Cursor |
| --- | --- | --- |
| Windows | `C:\Users\<你>\AppData\Local\Programs\Microsoft VS Code\bin\code.cmd` | `C:\Users\<你>\AppData\Local\Programs\cursor\resources\app\bin\cursor.cmd` |
| macOS | `/usr/local/bin/code` | `/usr/local/bin/cursor` |
| Linux | `/usr/bin/code` | `/usr/bin/cursor` |

装在其它位置的也可以直接填，比如 `D:\software\vscode\Microsoft VS Code\bin\code.cmd`。

### Windows 上应该指向哪个文件

Windows 下 VS Code 有两个可执行文件，行为不一样：

| 文件 | 位置 | 表现 |
| --- | --- | --- |
| `code.cmd` | `...\Microsoft VS Code\bin\code.cmd` | **推荐。** 官方命令行入口，完整支持 `-r` |
| `Code.exe` | `...\Microsoft VS Code\Code.exe` | 能打开文件，但对命令行参数支持不完整，复用窗口可能失效 |

填哪个都行。填 `.exe` 时，插件会自动在它旁边找命令行入口并使用，所以最终行为一致。Test 按钮在发生这种切换时会明确提示你。

其它基于 Electron 的编辑器同理：如果所选可执行文件旁边存在 `bin\*.cmd` 或 `resources\app\bin\*.cmd`，会优先使用后者。

### Test 按钮怎么用

**前提条件：**

1. **必须先打开一个笔记** —— Test 打开的是当前激活的笔记，没打开会提示你先开一个
2. **填写的值必须可解析** —— 绝对路径要求文件真实存在，命令名要求能在 `PATH` 中查到
3. **改过 `PATH` 后要重启 Obsidian** —— Obsidian 在启动时才继承 `PATH`，运行中改动它看不到

**你会看到什么：**

- 成功：弹窗显示解析到的具体路径，同时编辑器打开当前笔记
- 失败：弹窗明确告诉你解析不到，并建议改填绝对路径

如果测试成功但编辑器没打开，检查该编辑器是否支持从命令行带文件路径启动（VS Code、Cursor、Trae、Zed、Windsurf 都支持）。再打开**调试日志**，看开发者控制台（`Ctrl+Shift+I`）：里面会打印插件实际拼出的命令行和编辑器的退出码。

### 关于 PATH

把编辑器注册进 `PATH` 不会导致插件失效，这是两种最稳的情况之一。插件按这个顺序解析可执行文件：

1. **你填的绝对路径** —— 直接检查文件是否存在
2. **标准安装位置** —— 直接检查，不涉及 `PATH`（仅在你留空时）
3. **裸命令名** —— 用 `where` / `command -v` 通过 `PATH` 查找，再转成具体路径后才启动

所以装在非标准位置的编辑器，只要命令在 `PATH` 里就照样能用。唯一会失败的情况是：既不在标准位置、又没进 `PATH`，这时必须手动填绝对路径。

还有两点值得知道：

- **Obsidian 在启动时才继承 `PATH`。** 运行中改了 `PATH` 要先重启 Obsidian 再测试，否则插件仍然看不到。
- **插件是先解析再启动。** 它从不让 shell 去展开命令名，因为 Obsidian 在 Windows 上提供的 shell 环境缺 `PATHEXT`，那样会以退出码 9009 失败。详见上面的「工作原理」。

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
