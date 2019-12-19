import { expect } from "chai";
import * as sinon from "sinon";
import { fail } from "assert";
import { Utils } from "../src/utils/utils";
import { messages } from "../src/i18n/messages";
import { mockVscode, testVscode } from "./mockUtil";
mockVscode("src/extension");
mockVscode("src/utils/utils");
mockVscode("src/commands/mtaBuildCommand");
import { activate, mtaBuildCommand, mtarDeployCommand } from "../src/extension";

describe("Extension unit tests", () => {
  let sandbox: any;
  let commandsMock: any;
  let utilsMock: any;
  let windowMock: any;

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
  });

  afterEach(() => {
    commandsMock.verify();
    utilsMock.verify();
    windowMock.verify();
  });

  it("activate - add subscriptions", () => {
    const testContext: any = { subscriptions: [] };
    commandsMock
      .expects("registerCommand")
      .withExactArgs("extension.mtaBuildCommand", mtaBuildCommand);
    commandsMock
      .expects("registerCommand")
      .withExactArgs("extension.mtarDeployCommand", mtarDeployCommand);
    activate(testContext);
    expect(testContext.subscriptions).to.have.lengthOf(2);
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
});
