# AGENTS.md

本文档供 AI 助手和贡献者修改本插件时阅读。读完即可完成「改代码 → 本地验证 → 发布新版本」的完整闭环，不需要额外摸索。

## 一、这个插件是什么

Obsidian 社区插件，作用是把当前笔记用 VS Code 打开。

| 项目 | 值 |
| --- | --- |
| 插件 id | `open-in-vscode` |
| 插件名 | `Open in VSCode` |
| 仓库 | `steelan9199/obsidian-open-in-vscode` |
| 平台 | 仅桌面端（`isDesktopOnly: true`） |
| 语言 | TypeScript，运行时由 esbuild 打包成 CommonJS 单文件 |

## 二、目录结构：哪些能动，哪些不能

```
src/main.ts              源码。这是唯一需要修改的文件
manifest.json            插件元数据，发版时只改 version
package.json             npm 配置，发版时只改 version（必须与 manifest 一致）
esbuild.config.mjs       构建配置，一般不动
tsconfig.json            TypeScript 配置，一般不动
main.js                  构建产物。禁止手改，已被 git 忽略
.github/workflows/       CI/CD 配置，除非改发布流程否则不动
README.md                面向用户的说明，改功能时同步更新
```

## 三、红线：以下行为会导致事故

1. **不要手改 `main.js`** —— 它是 esbuild 产物，每次 `npm run build` 会被覆盖，改动会凭空消失。所有代码改 `src/main.ts`。
2. **不要提交 `main.js`** —— 已被 `.gitignore` 忽略，CI 有专门的步骤检查它是否被误提交。
3. **不要改插件 id** —— 已上架社区市场，改 id 等于变成一个全新插件，老用户会全部丢失。
4. **版本号必须是 `x.y.z` 格式且不带 `v` 前缀** —— `1.0.3` 正确，`v1.0.3` 和 `1.0` 都会被 CI 判为非法。
5. **`manifest.json` 和 `package.json` 的 version 必须一致** —— 不一致会导致 Release workflow 失败。
6. **已推送的 tag 不要删除重建** —— 可能已有用户安装。发现 bug 就升一个新版本号重发。
7. **命令 id 不要加插件 id 前缀** —— Obsidian 会自动加，写成 `open-in-vscode:open-current-file` 是错的，正确写法是 `open-current-file`。
8. **不要试图支持移动端** —— 插件依赖 `child_process`、`fs`、`os`、`path` 这些 Node API，移动端不存在。`isDesktopOnly` 必须为 `true`。

### manifest.json 的 description 约束（社区市场审核项）

- 不超过 **250 字符**
- 必须以英文句号 `.` 结尾
- 不能包含 emoji 或特殊字符
- 不要以 "This is a plugin" 开头
- 专有名词大写要正确：`VS Code`、`Markdown`、`Obsidian`、`PDF`
- `id` 中不能出现 `obsidian`，`name` 不能以 `Obsidian` 开头

CI 会自动校验其中大部分，但最终以社区市场的审核结果为准。

## 四、改代码的正确流程

### 1. 安装依赖（首次）

```bash
npm install
```

### 2. 修改源码

编辑 `src/main.ts`。

### 3. 构建

```bash
npm run build    # 类型检查 + 生产构建，产出 main.js
npm run dev      # 监听模式，改完自动重新构建，开发时用这个
npm run check    # 只做类型检查，不产出文件
```

`npm run build` 内部是 `tsc --noEmit --skipLibCheck && node esbuild.config.mjs production`，类型报错会直接中断。

### 4. 在 Obsidian 里验证

把构建产物复制到 vault 的插件目录：

```bash
cp main.js manifest.json "<你的库路径>/.obsidian/plugins/open-in-vscode/"
```

然后在 Obsidian 中按 `Ctrl+R` 重载，或执行命令 `Reload app without saving`。

> 库路径不写在文档里，需要时向维护者询问，或让用户在 Obsidian 中执行「打开库文件夹」命令查看。

## 五、代码架构

`src/main.ts` 的结构，从上到下：

| 部分 | 说明 |
| --- | --- |
| `OpenInVSCodeSettings` | 设置项接口：`executable`、`reuseWindow`、`extraArgs` |
| `DEFAULT_SETTINGS` | 设置默认值 |
| `SUPPORTED_EDITORS` | 已知编辑器命令名映射，用于设置页提示 |
| `detectExecutable()` | 跨平台探测编辑器路径，按 Windows / macOS / Linux 分别列出候选路径，用 `fs.existsSync` 逐个试，都没有就回退到 `code`（依赖 PATH） |
| `quote()` | 给命令参数加引号，用于拼装命令行 |
| `normalizeExecutable()` | Windows 专用。用户填了 `.exe` 主程序时，在其同级目录找 `bin\*.cmd` 或 `resources\app\bin\*.cmd` 并改用之 —— 因为主程序对 `-r`/`-g` 支持不完整。找不到就原样返回 |
| `OpenInVSCodePlugin` | 插件主类 |
| `OpenInVSCodeSettingTab` | 设置页 |

### 插件注册的内容

**两条命令**（`addCommand`）

| id | 名称 | 行为 |
| --- | --- | --- |
| `open-current-file` | Open the current file | 打开当前激活文件 |
| `open-vault-folder` | Open the vault folder | 以文件夹方式打开整个库 |

曾经还有一条 `open-current-file-at-cursor`（传 `-g 文件:行:列` 定位到光标处），2.0.0 已删除：**不要再加回来**。实测在 Windows 上不可靠 —— 定位依赖 CLI 入口对 `-g` 的完整支持，而很多编辑器的 `bin\*.cmd` 在复用窗口场景下不生效，用户点了没反应。

**两个右键菜单**：`file-menu`（文件树）和 `editor-menu`（编辑器内），都只对 `TFile` 生效。

**一个侧边栏图标**：ribbon icon，图标名 `file-code`。

### 核心方法

```ts
vaultPath(): string          // 返回库在磁盘上的绝对路径
absPath(file: TFile): string // 库路径 + 文件相对路径
rawExecutable(): string      // 用户配置的值，未经 CLI 入口纠正
executable(): string         // 实际要启动的值，已过 normalizeExecutable 纠正
launch(target): void       // 拼命令行并 spawn，detached + unref
verifyExecutable(exe): Promise<string | null>  // 解析配置值实际指向哪
```

`verifyExecutable()` 的解析规则：绝对路径用 `fs.existsSync` 查磁盘；命令名用 `where`（Windows）或 `command -v`（macOS / Linux）查 PATH。返回解析到的路径，查不到返回 `null`。设置页的 Test 按钮靠它给出明确的成功/失败反馈 —— 不要把 Test 改回直接 `launch()`，那样启动失败时错误会被 `stdio: "ignore"` 吞掉，用户点完没有任何反应。

`normalizeExecutable()` 存在的意义：Windows 用户第一反应是填他看到的 `Code.exe`，但主程序对 `-r` 支持不完整，会导致复用窗口失效。所以填 `.exe` 时自动改用同级的 `bin\*.cmd` 或 `resources\app\bin\*.cmd`。**改动这块时要保证：找不到 CLI 入口就原样返回，绝不把用户的输入替换成不存在的文件。**

`launch()` 拼出来的命令行形如：

```
"D:\...\code.cmd" -r "F:\vault\note.md"
```

其中 `-r` 来自 `reuseWindow` 设置。插件不再传 `-g`：定位到光标行的命令已在 2.0.0 删除，不要恢复。

## 六、常见改动的代码骨架

### 加一条命令

在 `onload()` 里加：

```ts
this.addCommand({
  id: "my-new-command",            // 不要加 open-in-vscode 前缀
  name: "My new command",
  checkCallback: (checking: boolean) => {
    const file = this.app.workspace.getActiveFile();
    if (!file) return false;       // 没有激活文件时命令不可见
    if (!checking) {
      // 执行动作
    }
    return true;
  },
});
```

需要区分「编辑器内有文件」和「当前激活文件」时用 `editorCheckCallback`（第二、三个参数是 editor 和 view）。目前没有命令用它。

### 加一个设置项

先在 `OpenInVSCodeSettings` 接口加字段，在 `DEFAULT_SETTINGS` 给默认值，然后在 `OpenInVSCodeSettingTab.display()` 里加控件：

```ts
new Setting(containerEl)
  .setName("名称")
  .setDesc("说明文字")
  .addToggle((toggle) =>
    toggle.setValue(this.plugin.settings.myNewOption)
      .onChange(async (value) => {
        this.plugin.settings.myNewOption = value;
        await this.plugin.saveSettings();
      })
  );
```

老用户升级后 `loadSettings()` 会用 `Object.assign` 合并默认值，新增字段不会是 `undefined`，不需要写迁移代码。

### 支持一个新的编辑器

1. 在 `SUPPORTED_EDITORS` 里加一项，例如 `windsurf: "Windsurf"`
2. 如果要自动探测，在 `detectExecutable()` 的候选路径里加。Windows 候选是 `bin` 目录下的 `xxx.cmd`，macOS / Linux 是 `bin` 目录下的可执行文件名

用户也可以不依赖探测，直接在设置里填可执行文件名（如 `cursor`），靠 PATH 解析。

## 七、发布新版本

**关键前提：版本号不变，用户就收不到更新。** Obsidian 只认 `manifest.json` 里那个版本号对应的 Release。

### 步骤

1. 确认 `src/main.ts` 已改完，`npm run build` 通过
2. 如涉及用户可见的变化，同步更新 `README.md`
3. 修改 `manifest.json` 的 `version` 和 `package.json` 的 `version`，**两处必须一致**
4. 提交并推送：

```bash
git add -A
git commit -m "fix: 描述改动"
git push
```

5. 推送同名 tag：

```bash
git tag 1.0.3
git push origin 1.0.3
```

6. 等待约 30 秒，CI 自动完成发布
7. 到 [community.obsidian.md](https://community.obsidian.md) 该插件页面点 **Review branch** 触发重新审核（首次提交后才需要，之后是自动的）

### 版本号怎么定

遵循 [Semantic Versioning](https://semver.org/)：

| 改动类型 | 示例 | 说明 |
| --- | --- | --- |
| 修复 bug | `1.0.2` → `1.0.3` | 改第三位 |
| 新增功能，向后兼容 | `1.0.3` → `1.1.0` | 改第二位 |
| 破坏性变更，不兼容旧版 | `1.1.0` → `2.0.0` | 改第一位 |

## 八、CI/CD 说明

两个 workflow，都在 `.github/workflows/`：

### `ci.yml`

触发时机：推送到 `main`，或任何 Pull Request。

做三件事：装依赖 → 类型检查并构建 → **确认 `main.js` 没有被提交进仓库**。

它只检查，不发布。失败不影响任何用户。

### `release.yml`

触发时机：推送任意 tag。

依次执行：

1. 校验 tag 与 `manifest.json` 的 version 完全一致
2. 校验 manifest 是否符合社区市场规范（必需字段、id 不含 obsidian、name 不以 Obsidian 开头、description 长度与结尾句号、版本号格式）
3. 类型检查并构建
4. 确认 `main.js` 和 `manifest.json` 都已产出
5. 生成构建证明（artifact attestation，上传到 Sigstore）
6. 创建 Release，附上 `main.js` 和 `manifest.json`

任何一步失败都会中断，**不会创建 Release**。

## 九、排错

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| CI 报 `Tag 'x' does not match manifest.json version 'y'` | tag 和 manifest 版本号不一致 | 改 manifest / package 的 version，提交后**删除旧 tag 重新推**（仅限该版本还没发出去的情况） |
| 已发布的版本有 bug | — | **不要删 tag**，升一个新版本号重新发 |
| `npm run build` 报 TS 类型错误 | 类型不匹配 | 看 `tsc` 输出的行号，改 `src/main.ts` |
| Obsidian 里改了没生效 | vault 里的 `main.js` 不是最新的 | 重新复制 `main.js` + `manifest.json`，然后 `Ctrl+R` |
| 插件在 Obsidian 里显示版本不对 | `manifest.json` 没同步过去 | 复制时两个文件都要带，不能只复制 `main.js` |
| 用户反馈装不上 | 用户的 Obsidian 版本低于 `minAppVersion` | 降低 `minAppVersion`，或提示用户升级 Obsidian |

## 十、提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/)，Release 的更新日志由 GitHub 自动生成：

```
feat: 新增支持 Windsurf 编辑器
fix: 修正在 Windows 上启动编辑器失败（退出码 9009）
chore: 1.0.3
docs: 补充 README 权限说明
refactor: 拆分 detectExecutable 逻辑
```

## 十一、设计约束（改动时请保持）

- **不联网**：插件不发起任何网络请求
- **不读写笔记内容**：`fs` 只在 `detectExecutable()` 里用来判断编辑器可执行文件是否存在
- **不存储额外数据**：设置由 Obsidian 自己存在 `data.json`
- **不引入运行时依赖**：`package.json` 里只有 `devDependencies`，打包后是零依赖单文件

保持这些特性，社区市场审核和与用户之间的信任成本都最低。
