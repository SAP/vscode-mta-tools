import * as os from "os";
import { get, map, trimStart } from "lodash";
import {
  QuickPickItem,
  Uri,
  window,
  ShellExecution,
  Task,
  TaskScope,
  tasks
} from "vscode";
import { join } from "path";
import { readFile } from "fs-extra";
import { parse } from "comment-json";
import { spawn } from "child_process";
import { IChildLogger } from "@vscode-logging/logger";

export class Utils {
  public static async displayOptions(
    inputRequest: string,
    optionsList: QuickPickItem[]
  ): Promise<QuickPickItem | undefined> {
    const options = {
      placeHolder: inputRequest,
      canPickMany: false,
      matchOnDetail: true,
      ignoreFocusOut: true
    };
    return window.showQuickPick(optionsList, options);
  }

  public static async getConfigFileField(field: string): Promise<any> {
    const configFilePath = this.getConfigFilePath();
    try {
      const jsonStr = await readFile(configFilePath, "utf8");
      const configJson = parse(jsonStr);
      return configJson[field];
    } catch (error) {
      // empty or non existing file
    }
  }

  public static execTask(execution: ShellExecution, taskName: string): void {
    const task = new Task(
      { type: "shell" },
      TaskScope.Workspace,
      taskName,
      "MTA",
      execution
    );

    tasks.executeTask(task);
  }

  public static async execCommand(
    command: string,
    commandArgs: string[],
    options?: any
  ): Promise<any> {
    return new Promise<string>((resolve, reject) => {
      const output: string[] = [];
      const childProcess = spawn(command, commandArgs, options);

      childProcess.stdout.on("data", data => {
        if (!childProcess.killed) {
          output.push(data.toString());
        }
      });
      childProcess.stderr.on("data", data => {
        resolve(data);
      });
      childProcess.on("exit", (code: number) => {
        const stdout = output.join("").trim();
        this.resultOnExit(stdout, resolve, code);
      });
      childProcess.on("error", (err: any) => {
        const stdout = output.join("").trim();
        this.resultOnExit(stdout, resolve, err.code);
      });
    });
  }

  public static getFilePaths(uriPaths: Uri[]): string[] {
    return map(uriPaths, uri => {
      return Utils.isWindows() ? trimStart(uri.path, "/") : uri.path;
    });
  }

  public static isWindows(): boolean {
    return os.platform().indexOf("win") > -1;
  }

  public static async isCliToolInstalled(
    cliName: string,
    errMessage: string,
    logger: IChildLogger
  ): Promise<boolean> {
    const homeDir = os.homedir();
    const response = await Utils.execCommand(cliName, ["-v"], {
      cwd: homeDir
    });
    if (response.exitCode === "ENOENT") {
      logger.error(`The ${cliName} Tool is not installed in the environment`);
      window.showErrorMessage(errMessage);
      return false;
    }
    return true;
  }

  private static resultOnExit(stdout: string, resolve: any, code: any) {
    resolve({ exitCode: code, data: stdout });
  }

  private static getConfigFilePath(): string {
    const cfHome = get(process, "env.CF_HOME", join(os.homedir(), ".cf"));
    return join(cfHome, "config.json");
  }
}
