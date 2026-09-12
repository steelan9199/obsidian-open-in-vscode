import { App, Notice, Plugin, PluginSettingTab, Setting, TFile } from "obsidian";
import { spawn } from "child_process";
import * as nodePath from "path";
import * as fs from "fs";
import * as os from "os";

interface OpenInVSCodeSettings {
  executable: string;
  reuseWindow: boolean;
  extraArgs: string;
}

const DEFAULT_SETTINGS: OpenInVSCodeSettings = {
  executable: "",
  reuseWindow: true,
  extraArgs: "",
};

const SUPPORTED_EDITORS: Record<string, string> = {
  code: "VS Code",
  cursor: "Cursor",
  trae: "Trae",
  zed: "Zed",
  windsurf: "Windsurf",
};

function detectExecutable(): string {
  const home = os.homedir();
  const candidates: string[] = [];

  if (process.platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA ?? "";
    const programFiles = process.env["ProgramFiles"] ?? "";
    const programFilesX86 = process.env["ProgramFiles(x86)"] ?? "";
    const suffixes = [
      ["Microsoft VS Code", "code.cmd"],
      ["Cursor", "cursor.cmd"],
    ];
    for (const [dir, bin] of suffixes) {
      candidates.push(nodePath.join(localAppData, "Programs", dir, "bin", bin));
      candidates.push(nodePath.join(programFiles, dir, "bin", bin));
      candidates.push(nodePath.join(programFilesX86, dir, "bin", bin));
    }
    candidates.push(
      nodePath.join(localAppData, "Programs", "Microsoft VS Code", "bin", "code.cmd")
    );
  } else if (process.platform === "darwin") {
    candidates.push(
      "/usr/local/bin/code",
      "/opt/homebrew/bin/code",
      "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code",
      nodePath.join(
        home,
        "Applications",
        "Visual Studio Code.app",
        "Contents",
        "Resources",
        "app",
        "bin",
        "code"
      )
    );
  } else {
    candidates.push(
      "/usr/bin/code",
      "/usr/local/bin/code",
      "/snap/bin/code",
      "/usr/share/code/bin/code"
    );
  }

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      if (fs.existsSync(candidate)) return candidate;
    } catch {
      continue;
    }
  }
  return "code";
}

function quote(value: string): string {
  return `"${value.replace(/"/g, '\\"')}"`;
}

export default class OpenInVSCodePlugin extends Plugin {
  settings: OpenInVSCodeSettings = { ...DEFAULT_SETTINGS };

  async onload(): Promise<void> {
    await this.loadSettings();

    this.addCommand({
      id: "open-current-file",
      name: "Open the current file",
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        if (!file) return false;
        if (!checking) this.launch(this.absPath(file));
        return true;
      },
    });

    this.addCommand({
      id: "open-current-file-at-cursor",
      name: "Open the current file at the cursor position",
      editorCheckCallback: (checking: boolean, editor, view: { file?: TFile | null }) => {
        if (!view?.file) return false;
        if (checking) return true;
        const cursor = editor.getCursor();
        const abs = this.absPath(view.file);
        this.launch(abs, `${abs}:${cursor.line + 1}:${cursor.ch + 1}`);
        return true;
      },
    });

    this.addCommand({
      id: "open-vault-folder",
      name: "Open the vault folder",
      callback: () => this.launch(this.vaultPath()),
    });

    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (!(file instanceof TFile)) return;
        menu.addItem((item) =>
          item
            .setTitle("Open in VS Code")
            .setIcon("file-code")
            .onClick(() => this.launch(this.absPath(file)))
        );
      })
    );

    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, _editor, view) => {
        const file = view?.file;
        if (!file) return;
        menu.addItem((item) =>
          item
            .setTitle("Open in VS Code")
            .setIcon("file-code")
            .onClick(() => this.launch(this.absPath(file)))
        );
      })
    );

    this.addRibbonIcon("file-code", "Open the current file in VS Code", () => {
      const file = this.app.workspace.getActiveFile();
      if (!file) {
        new Notice("No active file.");
        return;
      }
      this.launch(this.absPath(file));
    });

    this.addSettingTab(new OpenInVSCodeSettingTab(this.app, this));
  }

  vaultPath(): string {
    const adapter = this.app.vault.adapter as { getBasePath?: () => string };
    return adapter.getBasePath?.() ?? "";
  }

  absPath(file: TFile): string {
    return nodePath.join(this.vaultPath(), file.path);
  }

  executable(): string {
    const configured = (this.settings.executable ?? "").trim();
    return configured || detectExecutable();
  }

  launch(target: string, goto?: string): void {
    const args: string[] = [];
    if (this.settings.reuseWindow) args.push("-r");
    if (goto) args.push("-g");
    args.push(goto ?? target);

    const extra = (this.settings.extraArgs ?? "").trim();
    const commandLine = [quote(this.executable()), ...args.map(quote), extra]
      .filter(Boolean)
      .join(" ");

    const child = spawn(commandLine, {
      shell: true,
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    });
    child.on("error", (err: Error) => {
      new Notice(`Could not start the editor: ${err.message}`);
      console.error("[open-in-vscode]", err);
    });
    child.unref();
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}

class OpenInVSCodeSettingTab extends PluginSettingTab {
  private plugin: OpenInVSCodePlugin;

  constructor(app: App, plugin: OpenInVSCodePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Editor executable")
      .setDesc(
        "Leave empty to detect the editor automatically. Set it to cursor, trae, zed or windsurf to use another editor."
      )
      .addText((text) =>
        text
          .setPlaceholder(`Automatic (currently ${this.plugin.executable()})`)
          .setValue(this.plugin.settings.executable)
          .onChange(async (value) => {
            this.plugin.settings.executable = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Reuse the existing window")
      .setDesc("Passes -r so an already open editor window is reused instead of opening a new one.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.reuseWindow).onChange(async (value) => {
          this.plugin.settings.reuseWindow = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Extra arguments")
      .setDesc("Optional. For example --new-window. Usually left empty.")
      .addText((text) =>
        text
          .setPlaceholder("Empty")
          .setValue(this.plugin.settings.extraArgs)
          .onChange(async (value) => {
            this.plugin.settings.extraArgs = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Test")
      .setDesc("Uses the current settings to open the active file, to verify the path is correct.")
      .addButton((button) =>
        button.setButtonText("Open active file").onClick(() => {
          const file = this.plugin.app.workspace.getActiveFile();
          if (!file) {
            new Notice("Open a file first, then test.");
            return;
          }
          this.plugin.launch(this.plugin.absPath(file));
        })
      );

    containerEl.createEl("p", {
      text: `Vault path: ${this.plugin.vaultPath()}`,
      cls: "setting-item-description",
    });

    const editors = Object.entries(SUPPORTED_EDITORS)
      .map(([bin, label]) => `${bin} (${label})`)
      .join(", ");
    containerEl.createEl("p", {
      text: `Known editor commands: ${editors}.`,
      cls: "setting-item-description",
    });
  }
}
