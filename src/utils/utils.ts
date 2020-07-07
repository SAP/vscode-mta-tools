import * as _ from "lodash";
import * as vscode from "vscode"; // NOSONAR
import * as os from "os";
import * as path from "path";
import * as fsextra from "fs-extra";
import { parse } from "comment-json";
import { spawn } from "child_process";

const isWindows = os.platform().indexOf("win") > -1;

export class Utils {
  public static async displayOptions(
    inputRequest: string,
    optionsList: vscode.QuickPickItem[]
  ): Promise<vscode.QuickPickItem> {
    const options = {
      placeHolder: inputRequest,
      canPickMany: false,
      matchOnDetail: true,
      ignoreFocusOut: true
    };
    return vscode.window.showQuickPick(optionsList, options);
  }

  public static async getConfigFileField(field: string): Promise<any> {
    const configFilePath = this.getConfigFilePath();
    try {
      const jsonStr = await fsextra.readFile(configFilePath, "utf8");
      const configJson = parse(jsonStr);
      return configJson[field];
    } catch (error) {
      // empty or non existing file
    }
  }

  public static execTask(
    execution: vscode.ShellExecution,
    taskName: string
  ): void {
    const task = new vscode.Task(
      { type: "shell" },
      vscode.TaskScope.Workspace,
      taskName,
      "MTA",
      execution
    );

    vscode.tasks.executeTask(task);
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
          data = String.fromCharCode.apply(null, new Uint16Array(data));
          output.push(data);
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

  public static getFilePaths(uriPaths: vscode.Uri[]): string[] {
    const filePaths: string[] = [];
    uriPaths.forEach(uriPath => {
      let filePath = uriPath.path;
      filePath = isWindows ? _.trimStart(filePath, "/") : filePath;
      filePaths.push(filePath);
    });
    return filePaths;
  }

  private static resultOnExit(stdout: string, resolve: any, code: any) {
    resolve({ exitCode: code, data: stdout });
  }

  private static getConfigFilePath(): string {
    const cfHome = _.get(
      process,
      "env.CF_HOME",
      path.join(os.homedir(), ".cf")
    );
    return path.join(cfHome, "config.json");
  }
}
