import * as sinon from "sinon";
import { mockVscode, testVscode } from "../mockUtil";
mockVscode("src/commands/addModuleCommand");
import { AddModuleCommand } from "../../src/commands/addModuleCommand";
mockVscode("src/utils/utils");
import { Utils } from "../../src/utils/utils";
import { messages, messagesYeoman } from "../../src/i18n/messages";
import * as loggerWraper from "../../src/logger/logger-wrapper";
import { IChildLogger } from "@vscode-logging/logger";
import { SWATracker } from "@sap/swa-for-sapbas-vsx";

describe("Add mta module command unit tests", () => {
  let sandbox: any;
  let addModuleCommand: AddModuleCommand;
  let utilsMock: any;
  let windowMock: any;
  let workspaceMock: any;
  let commandsMock: any;
  let errorSpy: any;
  let infoSpy: any;
  let loggerWraperMock: any;
  let swa: SWATracker;
  let swaMock: any;
  const loggerImpl: IChildLogger = {
    fatal: () => {
      "fatal";
    },
    error: () => {
      "error";
    },
    warn: () => {
      "warn";
    },
    info: () => {
      "info";
    },
    debug: () => {
      "debug";
    },
    trace: () => {
      "trace";
    },
    getChildLogger: () => {
      return loggerImpl;
    },
  };

  const selected: any = {
    path: "mtaProject/mta.yaml",
  };

  const MTA_CMD = "mta";
  const homeDir = require("os").homedir();

  const testData = {
    filter: { types: ["mta.module"] },
    messages: messagesYeoman,
    data: {},
  };

  before(() => {
    sandbox = sinon.createSandbox();
    loggerWraperMock = sandbox.mock(loggerWraper);
    loggerWraperMock.expects("getClassLogger").returns(loggerImpl).atLeast(1);
  });

  after(() => {
    loggerWraperMock.verify();
    sandbox = sinon.restore();
  });

  beforeEach(() => {
    addModuleCommand = new AddModuleCommand();
    utilsMock = sandbox.mock(Utils);
    windowMock = sandbox.mock(testVscode.window);
    workspaceMock = sandbox.mock(testVscode.workspace);
    commandsMock = sandbox.mock(testVscode.commands);
    errorSpy = sandbox.spy(loggerImpl, "error");
    infoSpy = sandbox.spy(loggerImpl, "info");
    swa = new SWATracker("", "");
    swaMock = sandbox.mock(swa);
  });

  afterEach(() => {
    utilsMock.verify();
    windowMock.verify();
    workspaceMock.verify();
    commandsMock.verify();
    errorSpy.restore();
    infoSpy.restore();
    testData.data = {};
    swaMock.verify();
  });

  it("addModuleCommand - add MTA module from context menu", async () => {
    testData.data = {
      mtaFilePath: selected.path,
      mtaFilesPathsList: undefined,
    };
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(MTA_CMD, ["-v"], { cwd: homeDir })
      .returns("v1.2.3");
    commandsMock
      .expects("executeCommand")
      .once()
      .withExactArgs("loadYeomanUI", testData)
      .returns(Promise.resolve());
    swaMock
      .expects("track")
      .once()
      .withExactArgs(messages.EVENT_TYPE_ADD_MODULE, [
        messages.CUSTOM_EVENT_CONTEXT_MENU,
      ])
      .returns();
    await addModuleCommand.addModuleCommand(selected, swa);
  });

  it("addModuleCommand - add MTA module from context menu in Windows", async () => {
    testData.data = {
      mtaFilePath: selected.path,
      mtaFilesPathsList: undefined,
    };
    utilsMock.expects("isWindows").once().returns(true);
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(MTA_CMD, ["-v"], { cwd: homeDir })
      .returns("v1.2.3");
    commandsMock
      .expects("executeCommand")
      .once()
      .withExactArgs("loadYeomanUI", testData)
      .returns(Promise.resolve());
    swaMock
      .expects("track")
      .once()
      .withExactArgs(messages.EVENT_TYPE_ADD_MODULE, [
        messages.CUSTOM_EVENT_CONTEXT_MENU,
      ])
      .returns();
    await addModuleCommand.addModuleCommand(selected, swa);
  });

  it("addModuleCommand - add MTA module from context menu not in Windows", async () => {
    testData.data = {
      mtaFilePath: selected.path,
      mtaFilesPathsList: undefined,
    };
    utilsMock.expects("isWindows").once().returns(false);
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(MTA_CMD, ["-v"], { cwd: homeDir })
      .returns("v1.2.3");
    commandsMock
      .expects("executeCommand")
      .once()
      .withExactArgs("loadYeomanUI", testData)
      .returns(Promise.resolve());
    swaMock
      .expects("track")
      .once()
      .withExactArgs(messages.EVENT_TYPE_ADD_MODULE, [
        messages.CUSTOM_EVENT_CONTEXT_MENU,
      ])
      .returns();
    await addModuleCommand.addModuleCommand(selected, swa);
  });

  it("addModuleCommand - add MTA module from command when no mta.yaml file in the project", async () => {
    workspaceMock.expects("findFiles").returns(Promise.resolve([]));
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(MTA_CMD, ["-v"], { cwd: homeDir })
      .returns("v1.2.3");
    swaMock
      .expects("track")
      .once()
      .withExactArgs(messages.EVENT_TYPE_ADD_MODULE, [
        messages.CUSTOM_EVENT_COMMAND_PALETTE,
      ])
      .returns();
    windowMock.expects("showErrorMessage").withExactArgs(messages.NO_MTA_FILE);
    await addModuleCommand.addModuleCommand(undefined, swa);
  });

  it("addModuleCommand - add MTA module command with several mta.yaml files in the project", async () => {
    testData.data = {
      mtaFilePath: undefined,
      mtaFilesPathsList: `${selected.path},mtaProject2/mta.yaml`,
    };
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(MTA_CMD, ["-v"], { cwd: homeDir })
      .returns("v1.2.3");
    workspaceMock
      .expects("findFiles")
      .returns(Promise.resolve([selected, { path: "mtaProject2/mta.yaml" }]));
    commandsMock
      .expects("executeCommand")
      .once()
      .withExactArgs("loadYeomanUI", testData)
      .returns(Promise.resolve());
    swaMock
      .expects("track")
      .once()
      .withExactArgs(messages.EVENT_TYPE_ADD_MODULE, [
        messages.CUSTOM_EVENT_COMMAND_PALETTE,
      ])
      .returns();
    await addModuleCommand.addModuleCommand(undefined, swa);
  });

  it("addModuleCommand - add MTA module with no mta tool installed", async () => {
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(MTA_CMD, ["-v"], { cwd: homeDir })
      .returns({ exitCode: "ENOENT" });
    commandsMock.expects("executeCommand").never();
    swaMock.expects("track").never();
    windowMock.expects("showErrorMessage").withExactArgs(messages.INSTALL_MTA);
    await addModuleCommand.addModuleCommand(selected, swa);
  });

  it("addModuleCommand - add MTA module with no loadYeomanUi command", async () => {
    testData.data = {
      mtaFilePath: undefined,
      mtaFilesPathsList: `${selected.path},mtaProject2/mta.yaml`,
    };
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(MTA_CMD, ["-v"], { cwd: homeDir })
      .returns("v1.2.3");
    workspaceMock
      .expects("findFiles")
      .returns(Promise.resolve([selected, { path: "mtaProject2/mta.yaml" }]));
    commandsMock
      .expects("executeCommand")
      .once()
      .withExactArgs("loadYeomanUI", testData)
      .returns(Promise.reject("error"));
    swaMock.expects("track").once().returns();
    windowMock.expects("showErrorMessage").once();
    await addModuleCommand.addModuleCommand(undefined, swa);
  });
});
