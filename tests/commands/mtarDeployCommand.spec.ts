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
import { SWATracker } from "@sap/swa-for-sapbas-vsx";

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
    path: "mta_archives/mtaProject_0.0.1.mtar",
  };
  const CF_CMD = "cf";
  const CF_LOGIN_CMD = "cf.login";
  const expectedPath = "mta Project/mta_archives/mtaProject_0.0.1.mtar";
  const homeDir = os.homedir();

  const execution = new testVscode.ShellExecution(
    CF_CMD + " deploy \"" + expectedPath + "\"",
    { cwd: homeDir }
  );
  const deployTask = new testVscode.Task(
    { type: "shell" },
    testVscode.TaskScope.Workspace,
    messages.DEPLOY_MTAR,
    "MTA",
    execution
  );

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
    swa = new SWATracker("", "");
    swaMock = sandbox.mock(swa);
  });

  afterEach(() => {
    utilsMock.verify();
    windowMock.verify();
    workspaceMock.verify();
    selectionItemMock.verify();
    commandsMock.verify();
    tasksMock.verify();
    swaMock.verify();
  });

  it("mtarDeployCommand - deploy mtar from context menu", async () => {
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(CF_CMD, ["plugins", "--checksum"], { cwd: homeDir })
      .returns({ stdout: "multiapps " });
    utilsMock
      .expects("getConfigFileField")
      .withExactArgs("OrganizationFields", loggerImpl)
      .atLeast(1)
      .resolves({ Name: "org" });
    utilsMock
      .expects("getConfigFileField")
      .withExactArgs("SpaceFields", loggerImpl)
      .atLeast(1)
      .resolves({ Name: "space" });
    tasksMock.expects("executeTask").once().withExactArgs(deployTask);
    swaMock
      .expects("track")
      .once()
      .withExactArgs(messages.EVENT_TYPE_DEPLOY_MTAR, [
        messages.CUSTOM_EVENT_CONTEXT_MENU,
      ])
      .returns({});
    await mtarDeployCommand.mtarDeployCommand(selected as Uri, swa);
  });

  it("mtarDeployCommand - deploy mtar from command when no MTA archive in the project", async () => {
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(CF_CMD, ["plugins", "--checksum"], { cwd: homeDir })
      .returns({ stdout: "multiapps " });
    workspaceMock.expects("findFiles").returns(Promise.resolve([]));
    swaMock
      .expects("track")
      .once()
      .withExactArgs(messages.EVENT_TYPE_DEPLOY_MTAR, [
        messages.CUSTOM_EVENT_COMMAND_PALETTE,
      ])
      .returns({});
    tasksMock.expects("executeTask").never();
    windowMock
      .expects("showErrorMessage")
      .withExactArgs(messages.NO_MTA_ARCHIVE);
    await mtarDeployCommand.mtarDeployCommand(undefined, swa);
  });

  it("mtarDeployCommand - deploy mtar from command with only one MTA archive in the project", async () => {
    workspaceMock.expects("findFiles").returns(Promise.resolve([selected]));
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(CF_CMD, ["plugins", "--checksum"], { cwd: homeDir })
      .returns({ stdout: "multiapps " });
    utilsMock
      .expects("getConfigFileField")
      .withExactArgs("OrganizationFields", loggerImpl)
      .atLeast(1)
      .resolves({ Name: "org" });
    utilsMock
      .expects("getConfigFileField")
      .withExactArgs("SpaceFields", loggerImpl)
      .atLeast(1)
      .resolves({ Name: "space" });
    tasksMock.expects("executeTask").once().withExactArgs(deployTask);
    swaMock
      .expects("track")
      .once()
      .withExactArgs(messages.EVENT_TYPE_DEPLOY_MTAR, [
        messages.CUSTOM_EVENT_COMMAND_PALETTE,
      ])
      .returns({});
    await mtarDeployCommand.mtarDeployCommand(undefined, swa);
  });

  it("mtarDeployCommand - deploy mtar from command with several MTA archives in the project", async () => {
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
      .returns(Promise.resolve({ label: expectedPath }));
    utilsMock
      .expects("getConfigFileField")
      .withExactArgs("OrganizationFields", loggerImpl)
      .atLeast(1)
      .resolves({ Name: "org" });
    utilsMock
      .expects("getConfigFileField")
      .withExactArgs("SpaceFields", loggerImpl)
      .atLeast(1)
      .resolves({ Name: "space" });
    tasksMock.expects("executeTask").once().withExactArgs(deployTask);
    swaMock
      .expects("track")
      .once()
      .withExactArgs(messages.EVENT_TYPE_DEPLOY_MTAR, [
        messages.CUSTOM_EVENT_COMMAND_PALETTE,
      ])
      .returns({});
    await mtarDeployCommand.mtarDeployCommand(undefined, swa);
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
    utilsMock.expects("getConfigFileField").never();
    tasksMock.expects("executeTask").never();
    swaMock
      .expects("track")
      .once()
      .withExactArgs(messages.EVENT_TYPE_DEPLOY_MTAR, [
        messages.CUSTOM_EVENT_COMMAND_PALETTE,
      ])
      .returns({});
    await mtarDeployCommand.mtarDeployCommand(undefined, swa);
  });

  it("mtarDeployCommand - deploy mtar with no mta-cf-cli plugin installed", async () => {
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(CF_CMD, ["plugins", "--checksum"], { cwd: homeDir })
      .returns({ stdout: "some other plugin" });
    tasksMock.expects("executeTask").never();
    swaMock.expects("track").never();
    windowMock
      .expects("showErrorMessage")
      .withExactArgs(messages.INSTALL_MTA_CF_CLI);
    await mtarDeployCommand.mtarDeployCommand(selected as Uri, swa);
  });

  it("mtarDeployCommand - deploy mtar when user needs to login via CF login command", async () => {
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(CF_CMD, ["plugins", "--checksum"], { cwd: homeDir })
      .returns({ stdout: "multiapps " });
    utilsMock
      .expects("getConfigFileField")
      .withExactArgs("OrganizationFields", loggerImpl)
      .atLeast(1)
      .resolves();
    utilsMock
      .expects("getConfigFileField")
      .withExactArgs("SpaceFields", loggerImpl)
      .atLeast(1)
      .resolves();
    commandsMock
      .expects("getCommands")
      .once()
      .withExactArgs(true)
      .returns([CF_LOGIN_CMD]);
    commandsMock
      .expects("executeCommand")
      .once()
      .withExactArgs(CF_LOGIN_CMD)
      .returns(Promise.resolve());
    utilsMock
      .expects("getConfigFileField")
      .withExactArgs("OrganizationFields", loggerImpl)
      .atLeast(1)
      .resolves({ Name: "org" });
    utilsMock
      .expects("getConfigFileField")
      .withExactArgs("SpaceFields", loggerImpl)
      .atLeast(1)
      .resolves({ Name: "space" });
    tasksMock.expects("executeTask").once().withExactArgs(deployTask);
    swaMock.expects("track").once().returns({});
    await mtarDeployCommand.mtarDeployCommand(selected as Uri, swa);
  });

  it("mtarDeployCommand - deploy mtar when user needs to login via CF CLI", async () => {
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(CF_CMD, ["plugins", "--checksum"], { cwd: homeDir })
      .returns({ stdout: "multiapps " });
    utilsMock
      .expects("getConfigFileField")
      .withExactArgs("OrganizationFields", loggerImpl)
      .atLeast(1)
      .resolves();
    utilsMock
      .expects("getConfigFileField")
      .withExactArgs("SpaceFields", loggerImpl)
      .atLeast(1)
      .resolves();
    commandsMock.expects("getCommands").once().withExactArgs(true).returns([]);
    tasksMock.expects("executeTask").never();
    swaMock.expects("track").once().returns({});
    windowMock
      .expects("showErrorMessage")
      .withExactArgs(messages.LOGIN_VIA_CLI);
    await mtarDeployCommand.mtarDeployCommand(selected as Uri, swa);
  });
});
