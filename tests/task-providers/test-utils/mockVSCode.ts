import { resolve } from "path";
import { Uri } from "vscode";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Module = require("module");
const originalRequire = Module.prototype.require;

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

export const testVscode: any = {
  commands: {
    executeCommand: (command: string): any => {
      if (command === "cf.login") {
        MockVSCodeInfo.executeCalled = true;
      }
    },
    getCommands: () => {
      return ["cf.login"];
    },
  },
  extensions: {
    all: [],
  },
  Uri: {
    file(...args: string[]): string {
      return args[0];
    },
  },
  workspace: {
    workspaceFolders: undefined,
    foundFiles: undefined,
    findFiles: (): Promise<Uri[]> => {
      return Promise.resolve(testVscode.workspace.foundFiles);
    },
  },
  ConfigurationTarget: {
    WorkspaceFolder: 3,
  },
  window: {
    showErrorMessage: (): undefined => undefined,
  },
  tasks: {
    fetchTasks: async (): Promise<any> => {
      return [];
    },
    executeTask: async (): Promise<void> => {
      return;
    },
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
};

function clearModuleCache(testModulePath?: string): void {
  if (testModulePath) {
    const key = resolve(testModulePath);
    if (require.cache[key]) {
      delete require.cache[key];
    }
  }
}

export function mockVscode(testModulePath?: string): void {
  clearModuleCache(testModulePath);

  Module.prototype.require = function (...args: any): void {
    if (args[0] === "vscode") {
      return testVscode;
    }

    return originalRequire.apply(this, args);
  };
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
