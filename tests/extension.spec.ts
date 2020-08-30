import { mockVscode, testVscode } from "./mockUtil";
mockVscode("src/extension");
mockVscode("src/utils/utils");
mockVscode("src/commands/mtaBuildCommand");
mockVscode("src/commands/mtarDeployCommand");
mockVscode("src/commands/addModuleCommand");
import { expect } from "chai";
import * as sinon from "sinon";
import { resolve } from "path";
import { Uri } from "vscode";
import { Utils } from "../src/utils/utils";
import { messages } from "../src/i18n/messages";
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
import { SWATracker } from "@sap/swa-for-sapbas-vsx";

describe("Extension unit tests", () => {
  const extensionPath: string = resolve(__dirname, "..", "..");
  const currentLogFilePath: string = "/tmp";
  let sandbox: any;
  let commandsMock: any;
  let utilsMock: any;
  let windowMock: any;
  let configSettingsMock: any;
  let testContext: any;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  after(() => {
    sandbox.restore();
  });

  describe("negative tests", () => {
    it("Call getLogger before logger initialized throws exception", () => {
      expect(() => getLogger()).to.throw(Error, ERROR_LOGGER_NOT_INITIALIZED);
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
        logPath: currentLogFilePath
      };
      configSettingsMock
        .expects("getLoggingLevelSetting")
        .returns("off")
        .atLeast(1);
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

    it("activate - add subscriptions", () => {
      commandsMock.expects("registerCommand").atLeast(3);
      activate(testContext);
      expect(testContext.subscriptions).to.have.lengthOf(5);
    });

    it("mtaBuildCommand", async () => {
      utilsMock
        .expects("execCommand")
        .once()
        .returns({ exitCode: "ENOENT" });
      windowMock
        .expects("showErrorMessage")
        .withExactArgs(messages.INSTALL_MBT);
      activate(testContext);
      await mtaBuildCommand((undefined as unknown) as SWATracker, undefined);
    });

    it("mtarDeployCommand", async () => {
      utilsMock
        .expects("execCommand")
        .once()
        .returns("some other plugin");
      windowMock
        .expects("showErrorMessage")
        .withExactArgs(messages.INSTALL_MTA_CF_CLI);
      activate(testContext);
      await mtarDeployCommand((undefined as unknown) as SWATracker, undefined);
    });

    it("addModuleCommand", async () => {
      utilsMock
        .expects("execCommand")
        .once()
        .returns({ exitCode: "ENOENT" });
      windowMock
        .expects("showErrorMessage")
        .withExactArgs(messages.INSTALL_MTA);
      activate(testContext);
      await addModuleCommand(
        (undefined as unknown) as SWATracker,
        (undefined as unknown) as Uri
      );
    });
  });
});
