const { Plugin, Notice, PluginSettingTab, Setting, TFile } = require("obsidian");
const { spawn } = require("child_process");
const nodePath = require("path");
const fs = require("fs");
const os = require("os");

const DEFAULT_SETTINGS = {
  executable: "",
  reuseWindow: true,
  extraArgs: "",
};

function detectExecutable() {
  const home = os.homedir();
  const candidates = [];

  if (process.platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA || "";
    const programFiles = process.env["ProgramFiles"] || "";
    const programFilesX86 = process.env["ProgramFiles(x86)"] || "";
    candidates.push(
      nodePath.join(localAppData, "Programs", "Microsoft VS Code", "bin", "code.cmd"),
      nodePath.join(programFiles, "Microsoft VS Code", "bin", "code.cmd"),
      nodePath.join(programFilesX86, "Microsoft VS Code", "bin", "code.cmd"),
      nodePath.join(home, "AppData", "Local", "Programs", "Microsoft VS Code", "bin", "code.cmd")
    );
  } else if (process.platform === "darwin") {
    candidates.push(
      "/usr/local/bin/code",
      "/opt/homebrew/bin/code",
      "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code",
      nodePath.join(home, "Applications", "Visual Studio Code.app", "Contents", "Resources", "app", "bin", "code")
    );
  } else {
    candidates.push("/usr/bin/code", "/usr/local/bin/code", "/snap/bin/code", "/usr/share/code/bin/code");
  }

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) return candidate;
  }
  return "code";
}

function quote(value) {
  return `"${String(value).replace(/"/g, '\\"')}"`;
}

module.exports = class OpenInVSCodePlugin extends Plugin {
  async onload() {
    await this.loadSettings();

    this.addCommand({
      id: "open-current-file",
      name: "在 VSCode 中打开当前文件",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file) return false;
        if (!checking) this.launch(this.absPath(file));
        return true;
      },
    });

    this.addCommand({
      id: "open-current-file-at-cursor",
      name: "在 VSCode 中打开当前文件并跳到光标行",
      editorCheckCallback: (checking, editor, view) => {
        if (!view || !view.file) return false;
        if (checking) return true;
        const cursor = editor.getCursor();
        const abs = this.absPath(view.file);
        this.launch(abs, `${abs}:${cursor.line + 1}:${cursor.ch + 1}`);
        return true;
      },
    });

    this.addCommand({
      id: "open-vault-folder",
      name: "在 VSCode 中打开整个库文件夹",
      callback: () => this.launch(this.vaultPath()),
    });

    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (!(file instanceof TFile)) return;
        menu.addItem((item) =>
          item
            .setTitle("在 VSCode 中打开")
            .setIcon("file-code")
            .onClick(() => this.launch(this.absPath(file)))
        );
      })
    );

    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor, view) => {
        if (!view || !view.file) return;
        menu.addItem((item) =>
          item
            .setTitle("在 VSCode 中打开")
            .setIcon("file-code")
            .onClick(() => this.launch(this.absPath(view.file)))
        );
      })
    );

    this.addRibbonIcon("file-code", "在 VSCode 中打开当前文件", () => {
      const file = this.app.workspace.getActiveFile();
      if (!file) {
        new Notice("没有打开的文件");
        return;
      }
      this.launch(this.absPath(file));
    });

    this.addSettingTab(new OpenInVSCodeSettingTab(this.app, this));
  }

  onunload() {}

  vaultPath() {
    return this.app.vault.adapter.getBasePath();
  }

  absPath(file) {
    return nodePath.join(this.vaultPath(), file.path);
  }

  executable() {
    return (this.settings.executable || "").trim() || detectExecutable();
  }

  launch(target, goto) {
    const args = [];
    if (this.settings.reuseWindow) args.push("-r");
    if (goto) args.push("-g");
    args.push(goto || target);

    const extra = (this.settings.extraArgs || "").trim();
    const commandLine = [quote(this.executable()), ...args.map(quote), extra]
      .filter(Boolean)
      .join(" ");

    const child = spawn(commandLine, {
      shell: true,
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    });
    child.on("error", (err) => {
      new Notice("启动 VSCode 失败，请在插件设置里填写正确的命令行路径");
      console.error("[open-in-vscode]", err);
    });
    child.unref();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
};

class OpenInVSCodeSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("编辑器命令行路径")
      .setDesc(
        "留空则自动探测本机 VSCode。也可填 cursor / trae / zed 等命令，用来在其它编辑器中打开。"
      )
      .addText((text) =>
        text
          .setPlaceholder(`自动探测（当前：${this.plugin.executable()}）`)
          .setValue(this.plugin.settings.executable)
          .onChange(async (value) => {
            this.plugin.settings.executable = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("复用已打开的窗口")
      .setDesc("开启后传 -r，不会每次都新开一个编辑器窗口")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.reuseWindow).onChange(async (value) => {
          this.plugin.settings.reuseWindow = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("附加参数")
      .setDesc("可选，例如 --new-window，一般留空")
      .addText((text) =>
        text
          .setPlaceholder("留空")
          .setValue(this.plugin.settings.extraArgs)
          .onChange(async (value) => {
            this.plugin.settings.extraArgs = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("测试")
      .setDesc("用当前配置打开一个文件，验证路径是否正确")
      .addButton((button) =>
        button.setButtonText("打开当前文件").onClick(() => {
          const file = this.plugin.app.workspace.getActiveFile();
          if (!file) {
            new Notice("请先打开一个文件再测试");
            return;
          }
          this.plugin.launch(this.plugin.absPath(file));
        })
      );

    containerEl.createEl("p", {
      text: `当前库路径：${this.plugin.vaultPath()}`,
      cls: "setting-item-description",
    });
  }
}
