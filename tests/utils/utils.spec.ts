import { assert } from "chai";
import * as sinon from "sinon";
import { Utils } from "../../src/utils/utils";
import { SelectionItem } from "../../src/utils/selectionItem";
import { mockVscode, testVscode } from "../mockUtil";
mockVscode("src/utils/utils");

describe("Utils unit tests", () => {
  let sandbox: any;
  let windowMock: any;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  after(() => {
    sandbox = sinon.restore();
  });

  beforeEach(() => {
    windowMock = sandbox.mock(testVscode.window);
  });

  afterEach(() => {
    windowMock.verify();
  });

  it("displayOptions - display options in QuickPick list", async () => {
    const inputRequest = "request";
    const selectionItems: SelectionItem[] = [
      { description: "", detail: "", label: "some/path/to/file1" },
      { description: "", detail: "", label: "some/path/to/file2" }
    ];
    const options = {
      placeHolder: inputRequest,
      canPickMany: false,
      matchOnDetail: true,
      ignoreFocusOut: true
    };
    windowMock
      .expects("showQuickPick")
      .once()
      .withExactArgs(selectionItems, options);
    await Utils.displayOptions(inputRequest, selectionItems);
  });

  it("execCommand - execute command in child process", async () => {
    const response = await Utils.execCommand("sh", ["-c", "echo test"]);
    assert.include(response.data, "test");
  });

  it("execCommand - execute unsupported command in child process", async () => {
    const response = await Utils.execCommand("bla", ["bla"]);
    assert.equal(response.exitCode, "ENOENT");
  });
});
