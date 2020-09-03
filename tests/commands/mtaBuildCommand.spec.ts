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
import { SWATracker } from "@sap/swa-for-sapbas-vsx";

describe("MTA build command unit tests", () => {
  let sandbox: sinon.SinonSandbox;
  let mtaBuildCommand: MtaBuildCommand;
  let utilsMock: sinon.SinonMock;
  let windowMock: sinon.SinonMock;
  let workspaceMock: sinon.SinonMock;
  let selectionItemMock: sinon.SinonMock;
  let tasksMock: sinon.SinonMock;
  let loggerWraperMock: sinon.SinonMock;
  let swa: SWATracker;
  let swaMock: sinon.SinonMock;
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
    swa = new SWATracker("", "");
    swaMock = sandbox.mock(swa);
  });

  afterEach(() => {
    utilsMock.verify();
    windowMock.verify();
    workspaceMock.verify();
    selectionItemMock.verify();
    tasksMock.verify();
    loggerWraperMock.verify();
    swaMock.verify();
    sandbox.restore();
  });

  it("mtaBuildCommand - build MTA from context menu", async () => {
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(MBT_CMD, ["-v"], { cwd: homeDir })
      .returns("v1.2.3");
    tasksMock.expects("executeTask").once().withExactArgs(buildTask);
    swaMock
      .expects("track")
      .once()
      .withExactArgs(messages.EVENT_TYPE_BUILD_MTA, [
        messages.CUSTOM_EVENT_CONTEXT_MENU,
      ])
      .returns({});
    await mtaBuildCommand.mtaBuildCommand(selected as Uri, swa);
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
    swaMock
      .expects("track")
      .once()
      .withExactArgs(messages.EVENT_TYPE_BUILD_MTA, [
        messages.CUSTOM_EVENT_COMMAND_PALETTE,
      ])
      .returns({});
    await mtaBuildCommand.mtaBuildCommand(undefined, swa);
  });

  it("mtaBuildCommand - build MTA from command with only one mta.yaml file in the project", async () => {
    workspaceMock.expects("findFiles").returns(Promise.resolve([selected]));
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(MBT_CMD, ["-v"], { cwd: homeDir })
      .returns("v1.2.3");
    tasksMock.expects("executeTask").once().withExactArgs(buildTask);
    swaMock
      .expects("track")
      .once()
      .withExactArgs(messages.EVENT_TYPE_BUILD_MTA, [
        messages.CUSTOM_EVENT_COMMAND_PALETTE,
      ])
      .returns({});
    await mtaBuildCommand.mtaBuildCommand(undefined, swa);
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
    swaMock
      .expects("track")
      .once()
      .withExactArgs(messages.EVENT_TYPE_BUILD_MTA, [
        messages.CUSTOM_EVENT_COMMAND_PALETTE,
      ])
      .returns({});
    await mtaBuildCommand.mtaBuildCommand(undefined, swa);
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
    swaMock
      .expects("track")
      .once()
      .withExactArgs(messages.EVENT_TYPE_BUILD_MTA, [
        messages.CUSTOM_EVENT_COMMAND_PALETTE,
      ])
      .returns({});
    await mtaBuildCommand.mtaBuildCommand(undefined, swa);
  });

  it("mtaBuildCommand - build MTA with no mbt installed", async () => {
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(MBT_CMD, ["-v"], { cwd: homeDir })
      .returns({ exitCode: "ENOENT" });
    swaMock.expects("track").never();
    tasksMock.expects("executeTask").never();
    windowMock.expects("showErrorMessage").withExactArgs(messages.INSTALL_MBT);
    await mtaBuildCommand.mtaBuildCommand(selected as Uri, swa);
  });

  it("mtaBuildCommand - tracking throws error", async () => {
    sandbox.stub(SWATracker.prototype, "track").throws(new Error("error"));
    tasksMock.expects("executeTask").never();
    await mtaBuildCommand.mtaBuildCommand(selected as Uri, swa);
  });
});
