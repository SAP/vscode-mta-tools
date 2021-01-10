import { mockVscode, testVscode } from "./mockUtil";
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
import { SWATracker } from "@sap/swa-for-sapbas-vsx";

describe("Extension unit tests", () => {
  const extensionPath: string = resolve(__dirname, "..", "..");
  const currentLogFilePath = "/tmp";
  let sandbox: sinon.SinonSandbox;
  let commandsMock: sinon.SinonMock;
  let utilsMock: sinon.SinonMock;
  let windowMock: sinon.SinonMock;
  let configSettingsMock: sinon.SinonMock;
  let testContext: Partial<ExtensionContext>;

  before(() => {
    sandbox = sinon.createSandbox();
    testContext = {
      subscriptions: [],
      extensionPath,
      logPath: currentLogFilePath,
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("negative tests", () => {
    it("calling getLogger before logger initialized throws exception", () => {
      expect(() => loggerWrapper.getLogger()).to.throw(
        Error,
        loggerWrapper.ERROR_LOGGER_NOT_INITIALIZED
      );
    });

    it("activate - error initializing logger does not subscribe commands", async () => {
      const loggerStub = sandbox
        .stub(
          loggerWrapper,
          "createExtensionLoggerAndSubscribeToLogSettingsChanges"
        )
        .throws(new Error("error"));
      await activate(testContext as ExtensionContext);
      expect(loggerStub.getCalls().length).to.equal(1);
      expect(testContext.subscriptions).to.have.lengthOf(0);
    });
  });

  describe("positive tests", () => {
    beforeEach(() => {
      commandsMock = sandbox.mock(testVscode.commands);
      utilsMock = sandbox.mock(Utils);
      windowMock = sandbox.mock(testVscode.window);
      configSettingsMock = sandbox.mock(configSettings);

      testContext = {
        subscriptions: [],
        extensionPath,
        logPath: currentLogFilePath,
      };
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

    it("activate - add subscriptions", async () => {
      commandsMock.expects("registerCommand").atLeast(3);
      await activate(testContext as ExtensionContext);
      expect(testContext.subscriptions).to.have.lengthOf(5);
    });

    it("mtaBuildCommand", async () => {
      utilsMock.expects("execCommand").once().returns({ exitCode: "ENOENT" });
      windowMock
        .expects("showErrorMessage")
        .withExactArgs(messages.INSTALL_MBT);
      await activate(testContext as ExtensionContext);
      await mtaBuildCommand((undefined as unknown) as SWATracker, undefined);
    });

    it("mtarDeployCommand", async () => {
      utilsMock.expects("execCommand").once().returns("some other plugin");
      windowMock
        .expects("showErrorMessage")
        .withExactArgs(messages.INSTALL_MTA_CF_CLI);
      await activate(testContext as ExtensionContext);
      await mtarDeployCommand((undefined as unknown) as SWATracker, undefined);
    });

    it("addModuleCommand", async () => {
      utilsMock.expects("execCommand").once().returns({ exitCode: "ENOENT" });
      windowMock
        .expects("showErrorMessage")
        .withExactArgs(messages.INSTALL_MTA);
      await activate(testContext as ExtensionContext);
      await addModuleCommand((undefined as unknown) as SWATracker, undefined);
    });
  });
});
