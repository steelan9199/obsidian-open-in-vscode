import { App, Notice, Plugin, PluginSettingTab, Setting, TFile } from "obsidian";
import { exec, spawn } from "child_process";
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

/**
 * On Windows a user will usually browse to the main application executable,
 * for example Code.exe. That launches the editor but does not reliably accept
 * the CLI flags this plugin relies on, namely -r and -g. When we can find the
 * matching command line entry point next to it, prefer that instead.
 * Returns the input unchanged when no CLI entry point is found.
 */
function normalizeExecutable(exe: string): string {
  if (process.platform !== "win32") return exe;
  if (!nodePath.isAbsolute(exe)) return exe;

  const base = nodePath.basename(exe);
  if (!base.toLowerCase().endsWith(".exe")) return exe;

  const dir = nodePath.dirname(exe);
  const cliName = base.slice(0, -4).toLowerCase() + ".cmd";
  const candidates = [
    nodePath.join(dir, "bin", cliName),
    nodePath.join(dir, "resources", "app", "bin", cliName),
  ];

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) return candidate;
    } catch {
      continue;
    }
  }
  return exe;
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

  /** What the user configured, before any CLI entry point correction. */
  rawExecutable(): string {
    return (this.settings.executable ?? "").trim() || detectExecutable();
  }

  /** What will actually be launched. */
  executable(): string {
    return normalizeExecutable(this.rawExecutable());
  }

  /**
   * Resolves what the configured executable actually points to.
   * Absolute paths are checked on disk, bare command names are looked up
   * on the PATH using the same environment Obsidian itself was launched with.
   * Returns the resolved path, or null when nothing could be found.
   */
  verifyExecutable(exe: string): Promise<string | null> {
    return new Promise((resolve) => {
      if (nodePath.isAbsolute(exe)) {
        try {
          resolve(fs.existsSync(exe) ? exe : null);
        } catch {
          resolve(null);
        }
        return;
      }

      const probe =
        process.platform === "win32"
          ? `where "${exe}" 2>nul`
          : `command -v "${exe}" 2>/dev/null`;

      exec(probe, (_err, stdout) => {
        const first = (stdout ?? "")
          .trim()
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)[0];
        resolve(first ?? null);
      });
    });
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
        "Leave empty to detect the editor automatically. Enter a command name such as cursor, trae, zed or windsurf, or a full absolute path."
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
      .setDesc(
        "Resolves the configured executable and opens the active note with it. Requires a note to be open."
      )
      .addButton((button) =>
        button.setButtonText("Test").onClick(async () => {
          const file = this.plugin.app.workspace.getActiveFile();
          if (!file) {
            new Notice("Open a note first, then run the test.", 8000);
            return;
          }

          const raw = this.plugin.rawExecutable();
          const exe = this.plugin.executable();
          const resolved = await this.plugin.verifyExecutable(exe);

          if (!resolved) {
            new Notice(
              `Cannot resolve "${raw}". It is not on your PATH and no file exists at that path. Enter a full absolute path instead, then restart Obsidian if you just changed PATH.`,
              15000
            );
            return;
          }

          const switched = raw !== exe;
          const note = switched
            ? `Switched from ${nodePath.basename(
                raw
              )} to its command line entry point, so -r and -g work:\n${resolved}\n\nOpening the active note...`
            : `Resolved to:\n${resolved}\n\nOpening the active note...`;

          new Notice(note, 10000);
          this.plugin.launch(this.plugin.absPath(file));
        })
      );

    containerEl.createEl("p", {
      text: `Vault path: ${this.plugin.vaultPath()}`,
      cls: "setting-item-description",
    });

    const editors = Object.entries(SUPPORTED_EDITORS)
      .map(([bin, label]) => `${bin} = ${label}`)
      .join("  ·  ");
    containerEl.createEl("p", {
      text: `Command names you can enter: ${editors}.`,
      cls: "setting-item-description",
    });
  }
}
