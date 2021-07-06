import { mockVscode, testVscode } from "../mockUtil";
mockVscode("src/utils/utils");
import { expect } from "chai";
import { Uri } from "vscode";
import * as sinon from "sinon";
import { Utils } from "../../src/utils/utils";
import { SelectionItem } from "../../src/utils/selectionItem";
import { IChildLogger } from "@vscode-logging/logger";
import * as cfTools from "@sap/cf-tools";
import * as fsExtra from "fs-extra";

describe("Utils unit tests", () => {
  const path1 = "some/path/to/file1";
  const path2 = "some/path/to/file2";
  let sandbox: sinon.SinonSandbox;
  let windowMock: sinon.SinonMock;
  let utilsMock: sinon.SinonMock;
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

  const apiEndpoint: cfTools.ITarget = {
    user: "a",
    org: "b",
    space: "c",
    "api endpoint": "https://",
    "api version": "1.0",
  };

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(() => {
    windowMock = sandbox.mock(testVscode.window);
    utilsMock = sandbox.mock(Utils);
  });

  afterEach(() => {
    windowMock.verify();
    utilsMock.verify();
    sinon.restore();
  });

  it("displayOptions - display options in QuickPick list", async () => {
    const inputRequest = "request";
    const selectionItems: SelectionItem[] = [
      { description: "", detail: "", label: path1 },
      { description: "", detail: "", label: path2 },
    ];
    const options = {
      placeHolder: inputRequest,
      canPickMany: false,
      matchOnDetail: true,
      ignoreFocusOut: true,
    };
    windowMock
      .expects("showQuickPick")
      .once()
      .withExactArgs(selectionItems, options);
    await Utils.displayOptions(inputRequest, selectionItems);
  });

  it("execCommand - execute command in child process", async () => {
    const response = await Utils.execCommand("sh", ["-c", "echo test"], {});
    expect(response.stdout).to.include("test");
  });

  it("execCommand - execute unsupported command in child process", async () => {
    const response = await Utils.execCommand("bla", ["bla"], {});
    expect(response.exitCode).to.equal("ENOENT");
  });

  it("getConfigFileField - unable to fetch field from non existing config file", async () => {
    utilsMock
      .expects("getConfigFilePath")
      .once()
      .returns("path/to/non/existing/file");

    const response = await Utils.getConfigFileField("field1", loggerImpl);
    expect(response).to.equal(undefined);
  });

  it("getConfigFileField - fetch field from existing config file", async () => {
    utilsMock
      .expects("getConfigFilePath")
      .once()
      .returns("path/to/existing/file");
    // Converting SinonStub because it takes the wrong overload
    ((sinon.stub(fsExtra, "readFile") as unknown) as sinon.SinonStub<
      [string, string],
      Promise<string>
    >)
      .withArgs("path/to/existing/file", "utf8")
      .resolves(`{"field1":"field1_value"}`);

    const response = await Utils.getConfigFileField("field1", loggerImpl);
    expect(response).to.equal("field1_value");
  });

  it("getFilePaths - get paths of a non windows platform", () => {
    const filePaths = [{ path: path1 } as Uri, { path: path2 } as Uri];
    sandbox.stub(Utils, "isWindows").returns(false);
    const paths = Utils.getFilePaths(filePaths);
    expect(paths).to.deep.equal([path1, path2]);
  });

  it("isLoggedInToCf - user is logged in", async () => {
    const cfGetTargetMock = sinon
      .stub(Utils, "getTarget")
      .resolves(apiEndpoint);
    const isLoggedIn = await Utils.isLoggedInToCf();
    expect(cfGetTargetMock.callCount).to.equal(1);
    expect(isLoggedIn).to.be.true;
  });

  it("isLoggedInToCf - user is not logged in", async () => {
    apiEndpoint.org = undefined;
    const cfGetTargetMock = sinon
      .stub(Utils, "getTarget")
      .resolves(apiEndpoint);
    const isLoggedIn = await Utils.isLoggedInToCf();
    expect(cfGetTargetMock.callCount).to.equal(1);
    expect(isLoggedIn).to.be.false;
  });

  it("isLoggedInToCfWithProgress - called", async () => {
    windowMock.expects("withProgress").once();
    await Utils.isLoggedInToCfWithProgress();
  });
});
