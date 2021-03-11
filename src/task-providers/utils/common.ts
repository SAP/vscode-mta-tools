import { spawn, SpawnOptionsWithoutStdio } from "child_process";
import { platform } from "os";
import { map, trimStart } from "lodash";
import {
  ShellExecution,
  Task,
  TaskDefinition,
  TaskScope,
  Uri,
  workspace,
  WorkspaceFolder,
} from "vscode";
import { taskProvidersMessages } from "../../i18n/messages";
import { getLogger } from "../../logger/logger-wrapper";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const datauri = require("datauri");

type ChildProcessResult = {
  exitCode: number | string;
  stdout: string;
  stderr: string;
};

export function getImage(imagePath: string): string {
  let image;
  try {
    image = datauri.sync(imagePath);
  } catch (error) {
    // image = DEFAULT_IMAGE;
  }
  return image;
}

export async function execCommand(
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

export function getFilePaths(uriPaths: Uri[]): string[] {
  return map(uriPaths, (uri) => {
    return isWindows() ? trimStart(uri.path, "/") : uri.path;
  });
}

export function isWindows(): boolean {
  return platform().indexOf("win") > -1;
}

export function createTask(
  taskDefinition: TaskDefinition,
  taskScope: WorkspaceFolder | TaskScope | undefined,
  taskName: string,
  taskSource: string,
  execution: ShellExecution
): Task {
  const task = new Task(
    taskDefinition,
    taskScope ?? TaskScope.Workspace,
    taskName,
    taskSource,
    execution
  );
  return task;
}

export function getWorkspaceFolders(): WorkspaceFolder[] | undefined {
  const wsFolders = workspace.workspaceFolders;
  if (wsFolders !== undefined) {
    const workSpaceFolders = wsFolders.concat();
    return workSpaceFolders;
  }
  return undefined;
}

export function getWSFolderPath(workspaceFolder: WorkspaceFolder): string {
  return isWindows()
    ? trimStart(workspaceFolder.uri.path, "/")
    : workspaceFolder.uri.path;
}

export async function getFilesInWorkspace(
  fileType: string,
  pattern: string
): Promise<string[]> {
  let normalizedFilesPaths: string[] = [];
  const filePaths = await workspace.findFiles(pattern, "**/node_modules/**");
  const len = filePaths.length;
  getLogger().debug(taskProvidersMessages.FILES_FOUND(fileType, len));
  if (len !== 0) {
    normalizedFilesPaths = getFilePaths(filePaths);
  }

  return normalizedFilesPaths;
}
