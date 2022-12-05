import * as sinon from "sinon";
import * as os from "os";
import { Uri } from "vscode";
import { mockVscode, testVscode } from "../mockUtil";
mockVscode("src/commands/mtarDeployCommand");
import { MtarDeployCommand } from "../../src/commands/mtarDeployCommand";
mockVscode("src/utils/utils");
import { Utils } from "../../src/utils/utils";
import { messages } from "../../src/i18n/messages";
import { SelectionItem } from "../../src/utils/selectionItem";
import * as loggerWraper from "../../src/logger/logger-wrapper";
import { IChildLogger } from "@vscode-logging/logger";
import { getSWA, initSWA, ISWATracker } from "../../src/utils/swa";
import { expect } from "chai";

describe("Deploy mtar command unit tests", () => {
  let sandbox: sinon.SinonSandbox;
  let mtarDeployCommand: MtarDeployCommand;
  let utilsMock: sinon.SinonMock;
  let windowMock: sinon.SinonMock;
  let workspaceMock: sinon.SinonMock;
  let selectionItemMock: sinon.SinonMock;
  let commandsMock: sinon.SinonMock;
  let tasksMock: sinon.SinonMock;
  let loggerWraperMock: sinon.SinonMock;
  let orgSWATracker: ISWATracker;
  let swaEventType = "";
  let swaCustomEvents: string[] | undefined = [];
  const testSWATracker: ISWATracker = {
    track(eventType: string, customEvents?: string[]) {
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
    path: "mta_archives/mtaProject_0.0.1.mtar",
  };
  const CF_CMD = "cf";
  const CF_LOGIN_CMD = "cf.login.weak";
  const expectedPath = "mta Project/mta_archives/mtaProject_0.0.1.mtar";
  const homeDir = os.homedir();

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
    mtarDeployCommand = new MtarDeployCommand();
    utilsMock = sandbox.mock(Utils);
    windowMock = sandbox.mock(testVscode.window);
    workspaceMock = sandbox.mock(testVscode.workspace);
    selectionItemMock = sandbox.mock(SelectionItem);
    commandsMock = sandbox.mock(testVscode.commands);
    tasksMock = sandbox.mock(testVscode.tasks);
    orgSWATracker = getSWA();
    initSWA(testSWATracker);
  });

  afterEach(() => {
    utilsMock.verify();
    windowMock.verify();
    workspaceMock.verify();
    selectionItemMock.verify();
    commandsMock.verify();
    tasksMock.verify();
    initSWA(orgSWATracker);
    swaEventType = "";
    swaCustomEvents = [];
  });

  it("mtarDeployCommand - deploy mtar from context menu", async () => {
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(CF_CMD, ["plugins", "--checksum"], { cwd: homeDir })
      .returns({ stdout: "multiapps " });
    utilsMock.expects("isWindows").returns(false);
    utilsMock.expects("isLoggedInToCfWithProgress").once().returns(true);
    utilsMock.expects("execTask").once();
    await mtarDeployCommand.mtarDeployCommand(selected as Uri);
    expect(swaEventType).to.equal(messages.EVENT_TYPE_DEPLOY_MTAR);
    expect(swaCustomEvents).to.deep.equal([messages.CUSTOM_EVENT_CONTEXT_MENU]);
  });

  it("mtarDeployCommand - deploy mtar from context menu on Windows", async () => {
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(CF_CMD, ["plugins", "--checksum"], { cwd: homeDir })
      .returns({ stdout: "multiapps " });
    utilsMock.expects("isWindows").returns(true);
    utilsMock.expects("isLoggedInToCfWithProgress").once().returns(true);
    utilsMock.expects("execTask").once();
    await mtarDeployCommand.mtarDeployCommand(selected as Uri);
    expect(swaEventType).to.equal(messages.EVENT_TYPE_DEPLOY_MTAR);
    expect(swaCustomEvents).to.deep.equal([messages.CUSTOM_EVENT_CONTEXT_MENU]);
  });

  it("mtarDeployCommand - deploy mtar from command when no MTA archive in the project", async () => {
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(CF_CMD, ["plugins", "--checksum"], { cwd: homeDir })
      .returns({ stdout: "multiapps " });
    workspaceMock.expects("findFiles").returns(Promise.resolve([]));
    utilsMock.expects("execTask").never();
    windowMock
      .expects("showErrorMessage")
      .withExactArgs(messages.NO_MTA_ARCHIVE);
    await mtarDeployCommand.mtarDeployCommand(undefined);
    expect(swaEventType).to.equal(messages.EVENT_TYPE_DEPLOY_MTAR);
    expect(swaCustomEvents).to.deep.equal([
      messages.CUSTOM_EVENT_COMMAND_PALETTE,
    ]);
  });

  it("mtarDeployCommand - deploy mtar from command with only one MTA archive in the project", async () => {
    workspaceMock.expects("findFiles").returns(Promise.resolve([selected]));
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(CF_CMD, ["plugins", "--checksum"], { cwd: homeDir })
      .returns({ stdout: "multiapps " });
    utilsMock.expects("isLoggedInToCfWithProgress").once().returns(true);
    utilsMock.expects("execTask").once();
    await mtarDeployCommand.mtarDeployCommand(undefined);
    expect(swaEventType).to.equal(messages.EVENT_TYPE_DEPLOY_MTAR);
    expect(swaCustomEvents).to.deep.equal([
      messages.CUSTOM_EVENT_COMMAND_PALETTE,
    ]);
  });

  it("mtarDeployCommand - deploy mtar from command with several MTA archives in the project", async () => {
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(CF_CMD, ["plugins", "--checksum"], { cwd: homeDir })
      .returns({ stdout: "multiapps " });
    utilsMock.expects("isLoggedInToCfWithProgress").once().returns(true);
    workspaceMock
      .expects("findFiles")
      .returns(
        Promise.resolve([selected, { path: "mta_archives/mta_0.0.1.mtar" }])
      );
    selectionItemMock
      .expects("getSelectionItems")
      .once()
      .returns(Promise.resolve());
    utilsMock
      .expects("displayOptions")
      .once()
      .returns(Promise.resolve({ label: expectedPath }));
    utilsMock.expects("execTask").once();
    await mtarDeployCommand.mtarDeployCommand(undefined);
    expect(swaEventType).to.equal(messages.EVENT_TYPE_DEPLOY_MTAR);
    expect(swaCustomEvents).to.deep.equal([
      messages.CUSTOM_EVENT_COMMAND_PALETTE,
    ]);
  });

  it("mtarDeployCommand - deploy mtar from command with several MTA archives in the project - cancel selection", async () => {
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(CF_CMD, ["plugins", "--checksum"], { cwd: homeDir })
      .returns({ stdout: "multiapps " });
    workspaceMock
      .expects("findFiles")
      .returns(
        Promise.resolve([selected, { path: "mta_archives/mta_0.0.1.mtar" }])
      );
    selectionItemMock
      .expects("getSelectionItems")
      .once()
      .returns(Promise.resolve());
    utilsMock
      .expects("displayOptions")
      .once()
      .returns(Promise.resolve(undefined));
    tasksMock.expects("executeTask").never();
    utilsMock.expects("execTask").never();
    await mtarDeployCommand.mtarDeployCommand(undefined);
    expect(swaEventType).to.equal(messages.EVENT_TYPE_DEPLOY_MTAR);
    expect(swaCustomEvents).to.deep.equal([
      messages.CUSTOM_EVENT_COMMAND_PALETTE,
    ]);
  });

  it("mtarDeployCommand - deploy mtar with no mta-cf-cli plugin installed", async () => {
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(CF_CMD, ["plugins", "--checksum"], { cwd: homeDir })
      .returns({ stdout: "some other plugin" });
    tasksMock.expects("executeTask").never();
    utilsMock.expects("execTask").never();
    windowMock
      .expects("showErrorMessage")
      .withExactArgs(messages.INSTALL_MTA_CF_CLI);
    await mtarDeployCommand.mtarDeployCommand(selected as Uri);
    expect(swaEventType).to.be.empty;
    expect(swaCustomEvents).to.be.empty;
  });

  it("mtarDeployCommand - deploy mtar when user cancels login", async () => {
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(CF_CMD, ["plugins", "--checksum"], { cwd: homeDir })
      .returns({ stdout: "multiapps " });
    utilsMock.expects("isLoggedInToCfWithProgress").once().returns(false);
    commandsMock
      .expects("getCommands")
      .once()
      .withExactArgs(true)
      .returns([CF_LOGIN_CMD]);
    commandsMock
      .expects("executeCommand")
      .once()
      .withExactArgs(CF_LOGIN_CMD)
      .returns(undefined);
    tasksMock.expects("executeTask").never();
    await mtarDeployCommand.mtarDeployCommand(selected as Uri);
    expect(swaEventType).to.equal(messages.EVENT_TYPE_DEPLOY_MTAR);
    expect(swaCustomEvents).to.deep.equal([messages.CUSTOM_EVENT_CONTEXT_MENU]);
  });

  it("mtarDeployCommand - deploy mtar when user needs to login via CF login command", async () => {
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(CF_CMD, ["plugins", "--checksum"], { cwd: homeDir })
      .returns({ stdout: "multiapps " });
    utilsMock.expects("isLoggedInToCfWithProgress").once().returns(false);
    commandsMock
      .expects("getCommands")
      .once()
      .withExactArgs(true)
      .returns([CF_LOGIN_CMD]);
    commandsMock
      .expects("executeCommand")
      .once()
      .withExactArgs(CF_LOGIN_CMD)
      .returns(true);
    tasksMock.expects("executeTask").once();
    await mtarDeployCommand.mtarDeployCommand(selected as Uri);
    expect(swaEventType).to.equal(messages.EVENT_TYPE_DEPLOY_MTAR);
    expect(swaCustomEvents).to.deep.equal([messages.CUSTOM_EVENT_CONTEXT_MENU]);
  });

  it("mtarDeployCommand - deploy mtar when user needs to login via CF CLI", async () => {
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(CF_CMD, ["plugins", "--checksum"], { cwd: homeDir })
      .returns({ stdout: "multiapps " });
    utilsMock.expects("isLoggedInToCfWithProgress").once().returns(false);
    commandsMock.expects("getCommands").once().withExactArgs(true).returns([]);
    windowMock
      .expects("showErrorMessage")
      .withExactArgs(messages.LOGIN_VIA_CLI);
    utilsMock.expects("execTask").never();
    await mtarDeployCommand.mtarDeployCommand(selected as Uri);
    expect(swaEventType).to.equal(messages.EVENT_TYPE_DEPLOY_MTAR);
    expect(swaCustomEvents).to.deep.equal([messages.CUSTOM_EVENT_CONTEXT_MENU]);
  });
});
