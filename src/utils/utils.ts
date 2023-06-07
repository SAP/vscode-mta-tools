import * as os from "os";
import { get, isEmpty, map, trimStart } from "lodash";
import {
  QuickPickItem,
  Uri,
  window,
  ShellExecution,
  Task,
  TaskScope,
  tasks,
  ProgressLocation,
} from "vscode";
import { join } from "path";
import { readFile } from "fs-extra";
import { parse } from "comment-json";
import { spawn, SpawnOptionsWithoutStdio } from "child_process";
import { IChildLogger } from "@vscode-logging/logger";
import { cfGetTarget, ITarget } from "@sap/cf-tools";

type ChildProcessResult = {
  exitCode: number | string;
  stdout: string;
  stderr: string;
};

export class Utils {
  public static async displayOptions(
    inputRequest: string,
    optionsList: QuickPickItem[]
  ): Promise<QuickPickItem | undefined> {
    const options = {
      placeHolder: inputRequest,
      canPickMany: false,
      matchOnDetail: true,
      ignoreFocusOut: true,
    };
    return window.showQuickPick(optionsList, options);
  }

  public static async getConfigFileField(
    field: string,
    logger: IChildLogger
  ): Promise<unknown> {
    const configFilePath = this.getConfigFilePath();
    try {
      const jsonStr = await readFile(configFilePath, "utf8");
      const configJson = parse(jsonStr);
      return configJson[field];
    } catch (error) {
      // empty or non existing file
      logger.error(`Could not fetch field from config file`);
      return;
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

    void tasks.executeTask(task);
  }

  public static async execCommand(
    command: string,
    commandArgs: string[],
    options: SpawnOptionsWithoutStdio
  ): Promise<ChildProcessResult> {
    return new Promise<ChildProcessResult>((resolve) => {
      let output = "";
      let errOutput = "";
      const childProcess = spawn(command, commandArgs, options);
      let exited = false;

      childProcess.stdout.on("data", (data: string | Buffer) => {
        if (!childProcess.killed) {
          output += data.toString();
        }
      });

      childProcess.stderr.on("data", (data: string | Buffer) => {
        /* istanbul ignore next */
        if (!childProcess.killed) {
          errOutput += data.toString();
        }
      });

      childProcess.on("exit", (code: number | null, signal: string | null) => {
        /* istanbul ignore if */
        if (exited) {
          return;
        }
        exited = true;

        resolve({
          // Either code or signal will be non-null
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          exitCode: (code ?? signal)!,
          stdout: output.trim(),
          stderr: errOutput.trim(),
        });
      });

      childProcess.on("error", (err: { code: string }) => {
        /* istanbul ignore if */
        if (exited) {
          return;
        }
        exited = true;
        resolve({
          exitCode: err.code,
          stdout: output.trim(),
          stderr: errOutput.trim(),
        });
      });
    });
  }

  public static getFilePaths(uriPaths: Uri[]): string[] {
    return map(uriPaths, (uri) => {
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
      cwd: homeDir,
      shell: true,
    });
    if (response.exitCode != 0) {
      logger.error(`The ${cliName} Tool is not installed in the environment`);
      void window.showErrorMessage(errMessage);
      return false;
    }
    return true;
  }

  public static getTarget(weak?: boolean): Promise<ITarget> {
    return cfGetTarget(weak);
  }

  public static async isLoggedInToCf(): Promise<boolean> {
    try {
      const target: ITarget = await Utils.getTarget();
      // user is connected to CF
      if (
        !isEmpty(target.user) &&
        !isEmpty(target.org) &&
        !isEmpty(target.space)
      ) {
        return true;
      }
    } catch (e) {
      // User is not logged in to Cloud Foundry
    }
    return false;
  }

  public static async isLoggedInToCfWithProgress(): Promise<boolean> {
    return window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: "Checking your connection to Cloud Foundry...",
        cancellable: false,
      },
      this.isLoggedInToCf
    );
  }

  private static getConfigFilePath(): string {
    const cfHome = get(process, "env.CF_HOME", join(os.homedir(), ".cf"));
    return join(cfHome, "config.json");
  }
}
