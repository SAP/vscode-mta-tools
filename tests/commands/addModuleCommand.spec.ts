import * as sinon from "sinon";
import * as os from "os";
import { Uri } from "vscode";
import { mockVscode, testVscode } from "../mockUtil";
mockVscode("src/commands/addModuleCommand");
import { AddModuleCommand } from "../../src/commands/addModuleCommand";
mockVscode("src/utils/utils");
import { Utils } from "../../src/utils/utils";
import { messages, messagesYeoman } from "../../src/i18n/messages";
import * as loggerWraper from "../../src/logger/logger-wrapper";
import { IChildLogger } from "@vscode-logging/logger";
import { ISWATracker, getSWA, initSWA } from "../../src/utils/swa";
import { expect } from "chai";

describe("Add mta module command unit tests", () => {
  let sandbox: sinon.SinonSandbox;
  let addModuleCommand: AddModuleCommand;
  let utilsMock: sinon.SinonMock;
  let windowMock: sinon.SinonMock;
  let workspaceMock: sinon.SinonMock;
  let commandsMock: sinon.SinonMock;
  let loggerWraperMock: sinon.SinonMock;
  let orgSWATracker: ISWATracker;
  let swaEventType = "";
  let swaCustomEvents: string[] = [];
  const testSWATracker: ISWATracker = {
    track(eventType: string, customEvents: string[]) {
      swaEventType = eventType;
      swaCustomEvents = customEvents;
    },
  };
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

  const selected: Partial<Uri> = {
    path: "mtaProject/mta.yaml",
  };

  const MTA_CMD = "mta";
  const homeDir = os.homedir();

  const testData = {
    filter: { types: ["mta.module"] },
    messages: messagesYeoman,
    data: {},
  };

  before(() => {
    sandbox = sinon.createSandbox();
    loggerWraperMock = sandbox.mock(loggerWraper);
    loggerWraperMock.expects("getClassLogger").atLeast(1).returns(loggerImpl);
  });

  after(() => {
    loggerWraperMock.verify();
    sinon.restore();
  });

  beforeEach(() => {
    addModuleCommand = new AddModuleCommand();
    utilsMock = sandbox.mock(Utils);
    windowMock = sandbox.mock(testVscode.window);
    workspaceMock = sandbox.mock(testVscode.workspace);
    commandsMock = sandbox.mock(testVscode.commands);
    orgSWATracker = getSWA();
    initSWA(testSWATracker);
  });

  afterEach(() => {
    utilsMock.verify();
    windowMock.verify();
    workspaceMock.verify();
    commandsMock.verify();
    testData.data = {};
    initSWA(orgSWATracker);
    swaEventType = "";
    swaCustomEvents = [];
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
    await addModuleCommand.addModuleCommand(selected as Uri);
    expect(swaEventType).to.equal(messages.EVENT_TYPE_ADD_MODULE);
    expect(swaCustomEvents).to.deep.equal([messages.CUSTOM_EVENT_CONTEXT_MENU]);
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
    await addModuleCommand.addModuleCommand(selected as Uri);
    expect(swaEventType).to.equal(messages.EVENT_TYPE_ADD_MODULE);
    expect(swaCustomEvents).to.deep.equal([messages.CUSTOM_EVENT_CONTEXT_MENU]);
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
    await addModuleCommand.addModuleCommand(selected as Uri);
    expect(swaEventType).to.equal(messages.EVENT_TYPE_ADD_MODULE);
    expect(swaCustomEvents).to.deep.equal([messages.CUSTOM_EVENT_CONTEXT_MENU]);
  });

  it("addModuleCommand - add MTA module from command when no mta.yaml file in the project", async () => {
    workspaceMock.expects("findFiles").returns(Promise.resolve([]));
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(MTA_CMD, ["-v"], { cwd: homeDir })
      .returns("v1.2.3");
    windowMock.expects("showErrorMessage").withExactArgs(messages.NO_MTA_FILE);
    await addModuleCommand.addModuleCommand(undefined);
    expect(swaEventType).to.equal(messages.EVENT_TYPE_ADD_MODULE);
    expect(swaCustomEvents).to.deep.equal([
      messages.CUSTOM_EVENT_COMMAND_PALETTE,
    ]);
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
    await addModuleCommand.addModuleCommand(undefined);
    expect(swaEventType).to.equal(messages.EVENT_TYPE_ADD_MODULE);
    expect(swaCustomEvents).to.deep.equal([
      messages.CUSTOM_EVENT_COMMAND_PALETTE,
    ]);
  });

  it("addModuleCommand - add MTA module with no mta tool installed", async () => {
    loggerWraperMock.expects("getClassLogger").atLeast(1).returns(loggerImpl);
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(MTA_CMD, ["-v"], { cwd: homeDir })
      .returns({ exitCode: "ENOENT" });
    commandsMock.expects("executeCommand").never();
    windowMock.expects("showErrorMessage").withExactArgs(messages.INSTALL_MTA);
    await addModuleCommand.addModuleCommand(selected as Uri);
    expect(swaEventType).to.be.empty;
    expect(swaCustomEvents).be.empty;
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
    windowMock.expects("showErrorMessage").once();
    await addModuleCommand.addModuleCommand(undefined);
    expect(swaEventType).to.equal(messages.EVENT_TYPE_ADD_MODULE);
    expect(swaCustomEvents).to.deep.equal([
      messages.CUSTOM_EVENT_COMMAND_PALETTE,
    ]);
  });
});
