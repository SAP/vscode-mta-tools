import { resolve } from "path";
import {
  DiagnosticCollection,
  FileSystemWatcher,
  OutputChannel,
  Uri,
} from "vscode";
import * as Module from "module";

const originalRequire = Module.prototype.require;
const oRegisteredCommands: Record<string, unknown> = {};
const outputChannel = { show: () => "", append: () => "" };

export interface Disposable {
  dispose(): unknown;
}

class MockPosition {
  constructor(public line: number, public character: number) {}
}

class MockRange {
  constructor(public start: MockPosition, public end: MockPosition) {}
}

export const mockFileSystemWatcher: FileSystemWatcher = {
  ignoreChangeEvents: false,
  ignoreCreateEvents: false,
  ignoreDeleteEvents: false,
  onDidChange: (): Disposable => ({ dispose: () => undefined }),
  onDidCreate: (): Disposable => ({ dispose: () => undefined }),
  onDidDelete: (): Disposable => ({ dispose: () => undefined }),
  dispose: () => ({ dispose: () => undefined }),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const testVscode: any = {
  window: {
    showWarningMessage: (): undefined => undefined,
    showErrorMessage: (): undefined => undefined,
    showInformationMessage: (): undefined => undefined,
    showQuickPick: (): Promise<void> => Promise.resolve(),
    createOutputChannel: (): Partial<OutputChannel> => outputChannel,
  },
  workspace: {
    findFiles: (): Promise<Uri[]> => Promise.resolve([]),
    getConfiguration: (): unknown => {
      return {
        get: (): Promise<void> => {
          return Promise.resolve();
        },
      };
    },
    onDidChangeConfiguration: (): Promise<void> => Promise.resolve(),
    createFileSystemWatcher: (): FileSystemWatcher => mockFileSystemWatcher,
    onDidChangeWorkspaceFolders: (): Disposable => {
      return {
        dispose: () => ({ dispose: () => undefined }),
      };
    },
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
  languages: {
    createDiagnosticCollection: (): DiagnosticCollection => {
      return {
        set: (
          entries: ReadonlyArray<[Uri, ReadonlyArray<unknown> | undefined]>
        ) => {
          entries.toString();
          return;
        },
      } as DiagnosticCollection;
    },
  },
  Position: MockPosition,
  Range: MockRange,
  DiagnosticSeverity: {
    Error: 0,
    Warning: 1,
    Information: 2,
    Hint: 3,
  },
  Uri: {
    file: (): void => undefined,
  },
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
