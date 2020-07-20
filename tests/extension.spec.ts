import { expect } from "chai";
import * as sinon from "sinon";
import { resolve } from "path";
import { Utils } from "../src/utils/utils";
import { messages } from "../src/i18n/messages";
import { mockVscode, testVscode } from "./mockUtil";
mockVscode("src/extension");
mockVscode("src/utils/utils");
mockVscode("src/commands/mtaBuildCommand");
import {
  activate,
  mtaBuildCommand,
  mtarDeployCommand,
  addModuleCommand
} from "../src/extension";
import * as configSettings from "../src/logger/settings";
import {
  getLogger,
  ERROR_LOGGER_NOT_INITIALIZED
} from "../src/logger/logger-wrapper";

describe("Extension unit tests", () => {
  const extensionPath: string = resolve(__dirname, "..");
  const currentLogFilePath: string = "/tmp";
  let sandbox: any;
  let commandsMock: any;
  let utilsMock: any;
  let windowMock: any;
  let configSettingsMock: any;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  after(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    commandsMock = sandbox.mock(testVscode.commands);
    utilsMock = sandbox.mock(Utils);
    windowMock = sandbox.mock(testVscode.window);
    configSettingsMock = sandbox.mock(configSettings);
  });

  afterEach(() => {
    commandsMock.verify();
    utilsMock.verify();
    windowMock.verify();
    configSettingsMock.verify();
  });

  it("Call getLogger before logger initialized throws exception", () => {
    expect(() => getLogger()).to.throw(Error, ERROR_LOGGER_NOT_INITIALIZED);
  });

  it("activate - add subscriptions", () => {
    const testContext: any = {
      subscriptions: [],
      extensionPath,
      logPath: currentLogFilePath
    };
    configSettingsMock.expects("getLoggingLevelSetting").returns("off");
    configSettingsMock
      .expects("getSourceLocationTrackingSetting")
      .returns(false);
    commandsMock
      .expects("registerCommand")
      .withExactArgs("extension.mtaBuildCommand", mtaBuildCommand);
    commandsMock
      .expects("registerCommand")
      .withExactArgs("extension.mtarDeployCommand", mtarDeployCommand);
    commandsMock
      .expects("registerCommand")
      .withExactArgs("extension.addModuleCommand", addModuleCommand);
    activate(testContext);
    expect(testContext.subscriptions).to.have.lengthOf(5);
  });

  it("mtaBuildCommand", async () => {
    utilsMock
      .expects("execCommand")
      .once()
      .returns({ exitCode: "ENOENT" });
    windowMock.expects("showErrorMessage").withExactArgs(messages.INSTALL_MBT);
    await mtaBuildCommand(undefined);
  });

  it("mtarDeployCommand", async () => {
    utilsMock
      .expects("execCommand")
      .once()
      .returns("some other plugin");
    windowMock
      .expects("showErrorMessage")
      .withExactArgs(messages.INSTALL_MTA_CF_CLI);
    await mtarDeployCommand(undefined);
  });

  it("addModuleCommand", async () => {
    utilsMock
      .expects("execCommand")
      .once()
      .returns({ exitCode: "ENOENT" });
    windowMock.expects("showErrorMessage").withExactArgs(messages.INSTALL_MTA);
    await addModuleCommand(undefined);
  });
});
