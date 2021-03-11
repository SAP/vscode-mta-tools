import * as sinon from "sinon";
import * as os from "os";
import { Uri } from "vscode";
import { mockVscode, testVscode } from "../mockUtil";
mockVscode("src/commands/mtaBuildCommand");
import { MtaBuildCommand } from "../../src/commands/mtaBuildCommand";
mockVscode("src/utils/utils");
import { Utils } from "../../src/utils/utils";
import { messages } from "../../src/i18n/messages";
import { SelectionItem } from "../../src/utils/selectionItem";
import * as loggerWraper from "../../src/logger/logger-wrapper";
import { IChildLogger } from "@vscode-logging/logger";
import { getSWA, initSWA, ISWATracker } from "../../src/utils/swa";
import { expect } from "chai";

describe("MTA build command unit tests", () => {
  let sandbox: sinon.SinonSandbox;
  let mtaBuildCommand: MtaBuildCommand;
  let utilsMock: sinon.SinonMock;
  let windowMock: sinon.SinonMock;
  let workspaceMock: sinon.SinonMock;
  let selectionItemMock: sinon.SinonMock;
  let tasksMock: sinon.SinonMock;
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

  const MBT_CMD = "mbt";
  const BUILD = "build";
  const SOURCE_FLAG = "-s";
  const expectedPath = "mtaProject";
  const homeDir = os.homedir();

  const execution = new testVscode.ShellExecution(MBT_CMD, [
    BUILD,
    SOURCE_FLAG,
    expectedPath,
  ]);
  const buildTask = new testVscode.Task(
    { type: "shell" },
    testVscode.TaskScope.Workspace,
    messages.BUILD_MTA,
    "MTA",
    execution
  );

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    loggerWraperMock = sandbox.mock(loggerWraper);
    loggerWraperMock.expects("getClassLogger").atLeast(1).returns(loggerImpl);
    mtaBuildCommand = new MtaBuildCommand();
    utilsMock = sandbox.mock(Utils);
    windowMock = sandbox.mock(testVscode.window);
    workspaceMock = sandbox.mock(testVscode.workspace);
    selectionItemMock = sandbox.mock(SelectionItem);
    tasksMock = sandbox.mock(testVscode.tasks);
    orgSWATracker = getSWA();
    initSWA(testSWATracker);
  });

  afterEach(() => {
    utilsMock.verify();
    windowMock.verify();
    workspaceMock.verify();
    selectionItemMock.verify();
    tasksMock.verify();
    loggerWraperMock.verify();
    initSWA(orgSWATracker);
    swaEventType = "";
    swaCustomEvents = [];
  });

  it("mtaBuildCommand - build MTA from context menu", async () => {
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(MBT_CMD, ["-v"], { cwd: homeDir })
      .returns("v1.2.3");
    tasksMock.expects("executeTask").once().withExactArgs(buildTask);
    await mtaBuildCommand.mtaBuildCommand(selected as Uri);
    expect(swaEventType).to.equal(messages.EVENT_TYPE_BUILD_MTA);
    expect(swaCustomEvents).to.deep.equal([messages.CUSTOM_EVENT_CONTEXT_MENU]);
  });

  it("mtaBuildCommand - build MTA from command when no mta.yaml file in the project", async () => {
    workspaceMock.expects("findFiles").returns(Promise.resolve([]));
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(MBT_CMD, ["-v"], { cwd: homeDir })
      .returns("v1.2.3");
    windowMock
      .expects("showErrorMessage")
      .withExactArgs(messages.NO_PROJECT_DESCRIPTOR);
    await mtaBuildCommand.mtaBuildCommand(undefined);
    expect(swaEventType).to.equal(messages.EVENT_TYPE_BUILD_MTA);
    expect(swaCustomEvents).to.deep.equal([
      messages.CUSTOM_EVENT_COMMAND_PALETTE,
    ]);
  });

  it("mtaBuildCommand - build MTA from command with only one mta.yaml file in the project", async () => {
    workspaceMock.expects("findFiles").returns(Promise.resolve([selected]));
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(MBT_CMD, ["-v"], { cwd: homeDir })
      .returns("v1.2.3");
    tasksMock.expects("executeTask").once().withExactArgs(buildTask);
    await mtaBuildCommand.mtaBuildCommand(undefined);
    expect(swaEventType).to.equal(messages.EVENT_TYPE_BUILD_MTA);
    expect(swaCustomEvents).to.deep.equal([
      messages.CUSTOM_EVENT_COMMAND_PALETTE,
    ]);
  });

  it("mtaBuildCommand - build MTA from command with several mta.yaml files in the project", async () => {
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(MBT_CMD, ["-v"], { cwd: homeDir })
      .returns("v1.2.3");
    workspaceMock
      .expects("findFiles")
      .returns(Promise.resolve([selected, { path: "mtaProject2/mta.yaml" }]));
    selectionItemMock
      .expects("getSelectionItems")
      .once()
      .returns(Promise.resolve());
    utilsMock
      .expects("displayOptions")
      .once()
      .returns(Promise.resolve({ label: "mtaProject/mta.yaml" }));
    tasksMock.expects("executeTask").once().withExactArgs(buildTask);
    await mtaBuildCommand.mtaBuildCommand(undefined);
    expect(swaEventType).to.equal(messages.EVENT_TYPE_BUILD_MTA);
    expect(swaCustomEvents).to.deep.equal([
      messages.CUSTOM_EVENT_COMMAND_PALETTE,
    ]);
  });

  it("mtaBuildCommand - build MTA from command with several mta.yaml files in the project - cancel selection", async () => {
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(MBT_CMD, ["-v"], { cwd: homeDir })
      .returns("v1.2.3");
    workspaceMock
      .expects("findFiles")
      .returns(Promise.resolve([selected, { path: "mtaProject2/mta.yaml" }]));
    selectionItemMock
      .expects("getSelectionItems")
      .once()
      .returns(Promise.resolve());
    utilsMock
      .expects("displayOptions")
      .once()
      .returns(Promise.resolve(undefined));
    tasksMock.expects("executeTask").never();
    await mtaBuildCommand.mtaBuildCommand(undefined);
    expect(swaEventType).to.equal(messages.EVENT_TYPE_BUILD_MTA);
    expect(swaCustomEvents).to.deep.equal([
      messages.CUSTOM_EVENT_COMMAND_PALETTE,
    ]);
  });

  it("mtaBuildCommand - build MTA with no mbt installed", async () => {
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(MBT_CMD, ["-v"], { cwd: homeDir })
      .returns({ exitCode: "ENOENT" });
    tasksMock.expects("executeTask").never();
    windowMock.expects("showErrorMessage").withExactArgs(messages.INSTALL_MBT);
    await mtaBuildCommand.mtaBuildCommand(selected as Uri);
    expect(swaEventType).to.be.empty;
    expect(swaCustomEvents).to.be.empty;
  });
});
