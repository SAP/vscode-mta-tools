import { expect } from "chai";
import { restore, stub } from "sinon";
import * as common from "../../../src/task-providers/utils/common";
import {
  mockVscode,
  MockVSCodeInfo,
  resetTestVSCode,
  testVscode,
} from "../../mockUtil";
mockVscode("src/utils/cfutil");
import {
  isCFPluginInstalled,
  loginToCF,
} from "../../../src/task-providers/utils/cfutil";

describe("test cfutil ", () => {
  afterEach(() => {
    restore();
  });

  it("isCFPluginInstalled - cf plugin installed - should return true", async () => {
    stub(common, "execCommand").returns(
      Promise.resolve({ exitCode: 1, stdout: "multiapps", stderr: "" })
    );
    const result = await isCFPluginInstalled();
    expect(result).to.be.true;
  });

  it("isCFPluginInstalled - cf plugin not installed - should return false", async () => {
    stub(common, "execCommand").returns(
      Promise.resolve({ exitCode: 1, stdout: "other", stderr: "" })
    );
    const result = await isCFPluginInstalled();
    expect(result).to.be.false;
  });

  it("loginToCF - vscode commands include cf.login - should login successfully", async () => {
    await loginToCF();
    expect(MockVSCodeInfo.executeCalled).to.be.true;
    resetTestVSCode();
  });

  it("loginToCF - vscode commands dont include cf.login - should not login successfully", async () => {
    testVscode.commands.getCommands = () => {
      return ["other"];
    };
    await loginToCF();
    expect(MockVSCodeInfo.executeCalled).to.be.false;
    resetTestVSCode();
  });
});
