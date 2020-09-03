import { mockVscode, testVscode } from "../mockUtil";
mockVscode("src/utils/utils");
import { expect } from "chai";
import { resolve } from "path";
import { Uri } from "vscode";
import * as sinon from "sinon";
import { Utils } from "../../src/utils/utils";
import { SelectionItem } from "../../src/utils/selectionItem";

describe("Utils unit tests", () => {
  const path1 = "some/path/to/file1";
  const path2 = "some/path/to/file2";
  let sandbox: sinon.SinonSandbox;
  let windowMock: sinon.SinonMock;
  let utilsMock: sinon.SinonMock;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  after(() => {
    sinon.restore();
  });

  beforeEach(() => {
    windowMock = sandbox.mock(testVscode.window);
    utilsMock = sandbox.mock(Utils);
  });

  afterEach(() => {
    windowMock.verify();
    utilsMock.verify();
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

  it("getConfigFileField - get the values of field from config file", async () => {
    const path = resolve("../vscode-mta-tools/tests/resources/configFile.json");
    utilsMock.expects("getConfigFilePath").once().returns(path);
    const response = await Utils.getConfigFileField("field1", undefined);
    expect(response).to.deep.equal(["a", "b"]);
  });

  it("getConfigFileField - unable to fetch field from non existing config file", async () => {
    utilsMock
      .expects("getConfigFilePath")
      .once()
      .returns("path/to/non/existing/file");
    const response = await Utils.getConfigFileField("field1", undefined);
    expect(response).to.equal(undefined);
  });

  it("getFilePaths - get paths of a non windows platform", () => {
    const filePaths = [{ path: path1 } as Uri, { path: path2 } as Uri];
    sandbox.stub(Utils, "isWindows").returns(false);
    const paths = Utils.getFilePaths(filePaths);
    expect(paths).to.deep.equal([path1, path2]);
  });
});
