import { mockVscode, resetTestVSCode, testVscode } from "./mockUtil";
mockVscode("src/extension");
mockVscode("src/utils/utils");
mockVscode("src/commands/mtaBuildCommand");
mockVscode("src/commands/mtarDeployCommand");
mockVscode("src/commands/addModuleCommand");
import { expect } from "chai";
import * as sinon from "sinon";
import { resolve } from "path";
import { ExtensionContext } from "vscode";
import { Utils } from "../src/utils/utils";
import { messages } from "../src/i18n/messages";
import {
  activate,
  mtaBuildCommand,
  mtarDeployCommand,
  addModuleCommand,
} from "../src/extension";
import * as configSettings from "../src/logger/settings";
import * as loggerWrapper from "../src/logger/logger-wrapper";
import { DEPLOY_MTA, BUILD_MTA } from "../src/task-providers/definitions";

describe("Extension unit tests", () => {
  const extensionPath: string = resolve(__dirname, "..", "..");
  const currentLogFilePath = "/tmp";
  let sandbox: sinon.SinonSandbox;
  let commandsMock: sinon.SinonMock;
  let utilsMock: sinon.SinonMock;
  let windowMock: sinon.SinonMock;
  let configSettingsMock: sinon.SinonMock;
  let testContext: Partial<ExtensionContext>;
  let tasksMock: sinon.SinonMock;
  let loggerWrapperMock: sinon.SinonMock;

  before(() => {
    sandbox = sinon.createSandbox();
    resetTestVSCode();
  });

  beforeEach(() => {
    testContext = {
      subscriptions: [],
      extensionPath,
      logPath: currentLogFilePath,
    };
    loggerWrapperMock = sandbox.mock(loggerWrapper);
  });

  afterEach(() => {
    sinon.restore();
    sandbox.restore();
    loggerWrapperMock.verify();
    resetTestVSCode();
  });

  describe("logger", () => {
    beforeEach(() => {
      tasksMock = sandbox.mock(testVscode.tasks);
      commandsMock = sandbox.mock(testVscode.commands);
    });

    afterEach(() => {
      tasksMock.verify();
      commandsMock.verify();
    });

    it("logger initialization failed, provider and commands registered successfully", async () => {
      tasksMock = sandbox.mock(testVscode.tasks);
      loggerWrapperMock
        .expects("createExtensionLoggerAndSubscribeToLogSettingsChanges")
        .throws(new Error("exception"));
      tasksMock.expects("registerTaskProvider").atLeast(2);
      commandsMock.expects("registerCommand").atLeast(3);
      await activate(testContext as ExtensionContext);
      expect(testContext.subscriptions).to.have.lengthOf(5);
      tasksMock.verify();
    });

    it("logger initialization succeded, provider and commands registered successfully", async () => {
      tasksMock = sandbox.mock(testVscode.tasks);
      loggerWrapperMock.expects(
        "createExtensionLoggerAndSubscribeToLogSettingsChanges"
      );
      tasksMock.expects("registerTaskProvider").atLeast(2);
      commandsMock.expects("registerCommand").atLeast(3);
      await activate(testContext as ExtensionContext);
      expect(testContext.subscriptions).to.have.lengthOf(5);
      tasksMock.verify();
    });
  });

  describe("commands", () => {
    beforeEach(() => {
      commandsMock = sandbox.mock(testVscode.commands);
      utilsMock = sandbox.mock(Utils);
      windowMock = sandbox.mock(testVscode.window);
      configSettingsMock = sandbox.mock(configSettings);

      configSettingsMock
        .expects("getLoggingLevelSetting")
        .atLeast(1)
        .returns("off");
      configSettingsMock
        .expects("getSourceLocationTrackingSetting")
        .atLeast(1)
        .returns(false);
    });

    afterEach(() => {
      commandsMock.verify();
      utilsMock.verify();
      windowMock.verify();
      configSettingsMock.verify();
    });

    it("mtaBuildCommand", async () => {
      utilsMock.expects("execCommand").once().returns({ exitCode: "ENOENT" });
      windowMock
        .expects("showErrorMessage")
        .withExactArgs(messages.INSTALL_MBT);
      await activate(testContext as ExtensionContext);
      await mtaBuildCommand(undefined);
    });

    it("mtarDeployCommand", async () => {
      utilsMock.expects("execCommand").once().returns("some other plugin");
      windowMock
        .expects("showErrorMessage")
        .withExactArgs(messages.INSTALL_MTA_CF_CLI);
      await activate(testContext as ExtensionContext);
      await mtarDeployCommand(undefined);
    });

    it("addModuleCommand", async () => {
      utilsMock.expects("execCommand").once().returns({ exitCode: "ENOENT" });
      windowMock
        .expects("showErrorMessage")
        .withExactArgs(messages.INSTALL_MTA);
      await activate(testContext as ExtensionContext);
      await addModuleCommand(undefined);
    });
  });

  describe("task provider", () => {
    beforeEach(() => {
      tasksMock = sandbox.mock(testVscode.tasks);
      configSettingsMock
        .expects("getLoggingLevelSetting")
        .atLeast(1)
        .returns("off");
      configSettingsMock
        .expects("getSourceLocationTrackingSetting")
        .atLeast(1)
        .returns(false);
    });

    afterEach(() => {
      tasksMock.verify();
    });

    it("check getTaskEditorContributors returns map with deploy-mta entry", async () => {
      loggerWrapperMock.expects(
        "createExtensionLoggerAndSubscribeToLogSettingsChanges"
      );
      tasksMock.expects("registerTaskProvider").atLeast(2);
      const apiRes = await activate(testContext as ExtensionContext);
      const contributersMap = apiRes.getTaskEditorContributors();
      expect(contributersMap.has(DEPLOY_MTA)).to.be.true;
      const deployContributer = contributersMap.get(DEPLOY_MTA);
      expect(deployContributer).to.exist;
      expect(contributersMap.has(BUILD_MTA)).to.be.true;
      const buildContributer = contributersMap.get(BUILD_MTA);
      expect(buildContributer).to.exist;
      loggerWrapperMock.verify();
      tasksMock.verify();
    });
  });
});
