import * as sinon from "sinon";
import { mockVscode, testVscode } from "../mockUtil";
mockVscode("src/commands/mtarDeployCommand");
import { MtarDeployCommand } from "../../src/commands/mtarDeployCommand";
mockVscode("src/utils/utils");
import { Utils } from "../../src/utils/utils";
import { messages } from "../../src/i18n/messages";
import { SelectionItem } from "../../src/utils/selectionItem";
import * as loggerWraper from "../../src/logger/logger-wrapper";
import { IChildLogger } from "@vscode-logging/logger";

describe("Deploy mtar command unit tests", () => {
  let sandbox: any;
  let mtarDeployCommand: MtarDeployCommand;
  let utilsMock: any;
  let windowMock: any;
  let workspaceMock: any;
  let selectionItemMock: any;
  let commandsMock: any;
  let tasksMock: any;
  let errorSpy: any;
  let infoSpy: any;
  let loggerWraperMock: any;
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
    }
  };

  const selected: any = {
    path: "mta_archives/mtaProject_0.0.1.mtar"
  };
  const CF_CMD = "cf";
  const CF_LOGIN_CMD = "cf.login";
  const expectedPath = "mta_archives/mtaProject_0.0.1.mtar";
  const homeDir = require("os").homedir();

  const execution = new testVscode.ShellExecution(
    CF_CMD + " deploy " + expectedPath,
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
    loggerWraperMock
      .expects("getClassLogger")
      .returns(loggerImpl)
      .atLeast(1);
  });

  after(() => {
    loggerWraperMock.verify();
    sandbox = sinon.restore();
  });

  beforeEach(() => {
    mtarDeployCommand = new MtarDeployCommand();
    utilsMock = sandbox.mock(Utils);
    windowMock = sandbox.mock(testVscode.window);
    workspaceMock = sandbox.mock(testVscode.workspace);
    selectionItemMock = sandbox.mock(SelectionItem);
    commandsMock = sandbox.mock(testVscode.commands);
    tasksMock = sandbox.mock(testVscode.tasks);
    errorSpy = sandbox.spy(loggerImpl, "error");
    infoSpy = sandbox.spy(loggerImpl, "info");
  });

  afterEach(() => {
    utilsMock.verify();
    windowMock.verify();
    workspaceMock.verify();
    selectionItemMock.verify();
    commandsMock.verify();
    tasksMock.verify();
    errorSpy.restore();
    infoSpy.restore();
  });

  it("mtarDeployCommand - Deploy mtar from context menu", async () => {
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(CF_CMD, ["plugins", "--checksum"], { cwd: homeDir })
      .returns({ data: "multiapps " });
    utilsMock
      .expects("getConfigFileField")
      .withExactArgs("OrganizationFields")
      .atLeast(1)
      .resolves({ Name: "org" });
    utilsMock
      .expects("getConfigFileField")
      .withExactArgs("SpaceFields")
      .atLeast(1)
      .resolves({ Name: "space" });
    tasksMock
      .expects("executeTask")
      .once()
      .withExactArgs(deployTask);
    await mtarDeployCommand.mtarDeployCommand(selected);
  });

  it("mtarDeployCommand - Deploy mtar from command when no MTA archive in the project", async () => {
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(CF_CMD, ["plugins", "--checksum"], { cwd: homeDir })
      .returns({ data: "multiapps " });
    workspaceMock.expects("findFiles").returns(Promise.resolve([]));
    tasksMock.expects("executeTask").never();
    windowMock
      .expects("showErrorMessage")
      .withExactArgs(messages.NO_MTA_ARCHIVE);
    await mtarDeployCommand.mtarDeployCommand(undefined);
  });

  it("mtarDeployCommand - Deploy mtar from command with only one MTA archive in the project", async () => {
    workspaceMock.expects("findFiles").returns(Promise.resolve([selected]));
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(CF_CMD, ["plugins", "--checksum"], { cwd: homeDir })
      .returns({ data: "multiapps " });
    utilsMock
      .expects("getConfigFileField")
      .withExactArgs("OrganizationFields")
      .atLeast(1)
      .resolves({ Name: "org" });
    utilsMock
      .expects("getConfigFileField")
      .withExactArgs("SpaceFields")
      .atLeast(1)
      .resolves({ Name: "space" });
    tasksMock
      .expects("executeTask")
      .once()
      .withExactArgs(deployTask);
    await mtarDeployCommand.mtarDeployCommand(undefined);
  });

  it("mtarDeployCommand - Deploy mtar from command with several MTA archives in the project", async () => {
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(CF_CMD, ["plugins", "--checksum"], { cwd: homeDir })
      .returns({ data: "multiapps " });
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
      .withExactArgs("OrganizationFields")
      .atLeast(1)
      .resolves({ Name: "org" });
    utilsMock
      .expects("getConfigFileField")
      .withExactArgs("SpaceFields")
      .atLeast(1)
      .resolves({ Name: "space" });
    tasksMock
      .expects("executeTask")
      .once()
      .withExactArgs(deployTask);
    await mtarDeployCommand.mtarDeployCommand(undefined);
  });

  it("mtarDeployCommand - Deploy mtar with no mta-cf-cli plugin installed", async () => {
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(CF_CMD, ["plugins", "--checksum"], { cwd: homeDir })
      .returns({ data: "some other plugin" });
    tasksMock.expects("executeTask").never();
    windowMock
      .expects("showErrorMessage")
      .withExactArgs(messages.INSTALL_MTA_CF_CLI);
    await mtarDeployCommand.mtarDeployCommand(selected);
  });

  it("mtarDeployCommand - Deploy mtar when user needs to login via CF login command", async () => {
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(CF_CMD, ["plugins", "--checksum"], { cwd: homeDir })
      .returns({ data: "multiapps " });
    utilsMock
      .expects("getConfigFileField")
      .withExactArgs("OrganizationFields")
      .atLeast(1)
      .resolves();
    utilsMock
      .expects("getConfigFileField")
      .withExactArgs("SpaceFields")
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
      .withExactArgs("OrganizationFields")
      .atLeast(1)
      .resolves({ Name: "org" });
    utilsMock
      .expects("getConfigFileField")
      .withExactArgs("SpaceFields")
      .atLeast(1)
      .resolves({ Name: "space" });
    tasksMock
      .expects("executeTask")
      .once()
      .withExactArgs(deployTask);
    await mtarDeployCommand.mtarDeployCommand(selected);
  });

  it("mtarDeployCommand - Deploy mtar when user needs to login via CF CLI", async () => {
    utilsMock
      .expects("execCommand")
      .once()
      .withExactArgs(CF_CMD, ["plugins", "--checksum"], { cwd: homeDir })
      .returns({ data: "multiapps " });
    utilsMock
      .expects("getConfigFileField")
      .withExactArgs("OrganizationFields")
      .atLeast(1)
      .resolves();
    utilsMock
      .expects("getConfigFileField")
      .withExactArgs("SpaceFields")
      .atLeast(1)
      .resolves();
    commandsMock
      .expects("getCommands")
      .once()
      .withExactArgs(true)
      .returns([]);
    tasksMock.expects("executeTask").never();
    windowMock
      .expects("showErrorMessage")
      .withExactArgs(messages.LOGIN_VIA_CLI);
    await mtarDeployCommand.mtarDeployCommand(selected);
  });
});
