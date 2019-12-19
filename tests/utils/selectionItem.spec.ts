import { assert } from "chai";
import * as sinon from "sinon";
import { SelectionItem } from "../../src/utils/selectionItem";

describe("SelectionItem unit tests", () => {
  let sandbox: any;

  const item1 = {
    path: "some/path/to/file1"
  };
  const item2 = {
    path: "some/path/to/file2"
  };

  before(() => {
    sandbox = sinon.createSandbox();
  });

  after(() => {
    sandbox = sinon.restore();
  });

  it("getSelectionItems - create selection items from paths", async () => {
    const filePaths = { item1, item2 };
    const expectedItems = [
      { description: "", detail: "", label: "some/path/to/file1" },
      { description: "", detail: "", label: "some/path/to/file2" }
    ];
    const selectionItems: SelectionItem[] = await SelectionItem.getSelectionItems(
      filePaths
    );
    assert.deepEqual(
      selectionItems,
      expectedItems,
      "The selected items created are not as expected"
    );
  });
});
