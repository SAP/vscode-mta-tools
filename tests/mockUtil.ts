import * as path from "path";

const Module = require("module");
const originalRequire = Module.prototype.require;
const oRegisteredCommands: any = {};
const outputChannel = { show: () => "", append: () => "" };

export const testVscode: any = {
  window: {
    showWarningMessage: (message: string) => message,
    showErrorMessage: (message: string) => message,
    showInformationMessage: (message: string) => message,
    showQuickPick: () => Promise.resolve(),
    createOutputChannel: () => outputChannel
  },
  workspace: {
    findFiles: () => {
      Promise.resolve([]);
    },
    getConfiguration: () => {
      return {
        get: () => {
          Promise.resolve();
        }
      };
    },
    onDidChangeConfiguration: () => Promise.resolve()
  },
  commands: {
    registerCommand: (id: string, cmd: any) => {
      oRegisteredCommands[id] = cmd;
      return Promise.resolve(oRegisteredCommands);
    },
    executeCommand: () => Promise.resolve(),
    getCommands: () => Promise.resolve()
  },
  tasks: {
    executeTask: () => Promise.resolve()
  },
  ShellExecution: class MockShellExecution {},
  Task: class Task {},
  TaskScope: { Workspace: true }
};

export function mockVscode(testModulePath?: string) {
  clearModuleCache(testModulePath);

  Module.prototype.require = function(request: any) {
    if (request === "vscode") {
      return testVscode;
    }

    return originalRequire.apply(this, arguments);
  };
}

export function clearModuleCache(testModulePath?: string) {
  if (testModulePath) {
    const key = path.resolve(testModulePath);
    if (require.cache[key]) {
      delete require.cache[key];
    }
  }
}
