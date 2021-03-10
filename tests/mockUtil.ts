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

export class MockConfigTask {
  constructor(public label: string, public type: string) {}
}

export class MockVSCodeInfo {
  public static allExtensions: any[];
  public static visiblePanel = false;
  public static configTasks: Map<string, MockConfigTask[]> = new Map<
    string,
    MockConfigTask[]
  >();
  public static fired = false;
  public static executeCalled = false;
  public static saveCalled = false;
  public static disposeCalled = false;
  public static webViewCreated = 0;
  public static dialogAnswer = "";
  public static dialogCalled = false;
  public static asWebviewUriCalled = false;
  public static oRegisteredProviders: Record<string, unknown> = {};
  public static shellExecutionScript = "";
}

export class MockUri {
  public path = "path";
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
    workspaceFolders: undefined,
    foundFiles: undefined,
    findFiles: (): Promise<Uri[]> => {
      return Promise.resolve(testVscode.workspace.foundFiles);
    },
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
    executeCommand: (command: string): any => {
      if (command === "cf.login") {
        MockVSCodeInfo.executeCalled = true;
      }
    },
    getCommands: () => {
      return ["cf.login"];
    },
  },
  tasks: {
    fetchTasks: async (): Promise<any> => {
      return [];
    },
    executeTask: (): Promise<void> => Promise.resolve(),
    registerTaskProvider: (type: string, provider: unknown): void => {
      MockVSCodeInfo.oRegisteredProviders[type] = provider;
    },
  },
  ShellExecution: class MockShellExecution {},
  Task: class {
    constructor(p1: any) {
      return { definition: p1 };
    }
  },
  TaskScope: { Workspace: true },
  languages: {
    createDiagnosticCollection: (): DiagnosticCollection => {
      return {
        set: (
          //eslint-disable-next-line @typescript-eslint/no-unused-vars
          entries: ReadonlyArray<[Uri, ReadonlyArray<unknown> | undefined]>
        ) => {
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
  extensions: {
    all: [],
  },
  Uri: {
    file(...args: string[]): string {
      return args[0];
    },
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

export function resetTestVSCode(): void {
  testVscode.extensions.all = [];
  testVscode.workspace.workspaceFolders = undefined;
  testVscode.workspace.foundFiles = [];
  testVscode.ShellExecution = class MockShellExecution {};
  MockVSCodeInfo.oRegisteredProviders = {};
  MockVSCodeInfo.executeCalled = false;
  MockVSCodeInfo.shellExecutionScript = "";
}
