import { expect } from "chai";
import { restore, stub } from "sinon";
import * as common from "../../../src/task-providers/utils/common";
import * as fsextra from "fs-extra";
import {
  mockVscode,
  MockVSCodeInfo,
  resetTestVSCode,
  testVscode,
} from "../../mockUtil";
mockVscode("src/utils/cfutil");
import {
  isCFPluginInstalled,
  isLoggedInToCF,
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

  it("isLoggedInToCF - cfconfig file includes required fields - should return true", async () => {
    const testFile = {
      OrganizationFields: { Name: "testorg" },
      SpaceFields: { Name: "testspace" },
    };
    const buf = (JSON.stringify(testFile) as unknown) as Buffer;
    stub(fsextra, "readFile").returns(Promise.resolve(buf));
    const result = await isLoggedInToCF();
    expect(result).to.be.true;
  });

  it("isLoggedInToCF - cfconfig file doesnt include required fields - should return false", async () => {
    const testFile = {
      OrganizationFields: [{ Name: "" }],
      SpaceFields: [{ Name: "" }],
    };
    const buf = (JSON.stringify(testFile) as unknown) as Buffer;
    stub(fsextra, "readFile").returns(Promise.resolve(buf));
    const result = await isLoggedInToCF();
    expect(result).to.be.false;
  });

  it("isLoggedInToCF - cfconfig file doesnt exist - should return false", async () => {
    stub(fsextra, "readFile").returns(Promise.reject("aaa"));
    const result = await isLoggedInToCF();
    expect(result).to.be.false;
  });
});
