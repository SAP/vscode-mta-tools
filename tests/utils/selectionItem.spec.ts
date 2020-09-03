import { expect } from "chai";
import { Uri } from "vscode";
import { SelectionItem } from "../../src/utils/selectionItem";

describe("SelectionItem unit tests", () => {
  it("getSelectionItems - create selection items from paths", () => {
    const filePaths = [
      { path: "some/path/to/file1" } as Uri,
      { path: "some/path/to/file2" } as Uri,
    ];
    const expectedItems = [
      { description: "", detail: "", label: "some/path/to/file1" },
      { description: "", detail: "", label: "some/path/to/file2" },
    ];
    const selectionItems: SelectionItem[] = SelectionItem.getSelectionItems(
      filePaths
    );
    expect(selectionItems).to.deep.equal(expectedItems);
  });
});
