import { resolve } from "path";
import { OutputChannel, Uri } from "vscode";
import * as Module from "module";

const originalRequire = Module.prototype.require;
const oRegisteredCommands: Record<string, unknown> = {};
const outputChannel = { show: () => "", append: () => "" };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const testVscode: any = {
  window: {
    showWarningMessage: (message: string): string => message,
    showErrorMessage: (message: string): string => message,
    showInformationMessage: (message: string): string => message,
    showQuickPick: (): Promise<void> => Promise.resolve(),
    createOutputChannel: (): Partial<OutputChannel> => outputChannel,
  },
  workspace: {
    findFiles: (): Promise<Uri[]> => {
      return Promise.resolve([]);
    },
    getConfiguration: (): unknown => {
      return {
        get: (): Promise<void> => {
          return Promise.resolve();
        },
      };
    },
    onDidChangeConfiguration: (): Promise<void> => Promise.resolve(),
  },
  commands: {
    registerCommand: (id: string, cmd: unknown): void => {
      oRegisteredCommands[id] = cmd;
    },
    executeCommand: (): Promise<void> => Promise.resolve(),
    getCommands: (): Promise<void> => Promise.resolve(),
  },
  tasks: {
    executeTask: (): Promise<void> => Promise.resolve(),
  },
  ShellExecution: class MockShellExecution {},
  Task: class Task {},
  TaskScope: { Workspace: true },
};

export function mockVscode(testModulePath?: string): void {
  clearModuleCache(testModulePath);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Module.prototype.require = function (this: any, request: string): any {
    if (request === "vscode") {
      return testVscode;
    }

    return originalRequire.apply(this, [request]);
  } as NodeJS.Require;
}

export function clearModuleCache(testModulePath?: string): void {
  if (testModulePath) {
    const key = resolve(testModulePath);
    if (require.cache[key]) {
      delete require.cache[key];
    }
  }
}
