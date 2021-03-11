import { expect } from "chai";
import { closeSync, openSync } from "fs";
import { dirSync } from "tmp";
import { sync } from "rimraf";
import { join } from "path";
import {
  validateExtPath,
  validateModules,
  validateTargetFolder,
} from "../../../src/task-providers/task-build/buildValidator";
import { taskProvidersMessages } from "../../../src/i18n/messages";

describe("MTA Build Validators", () => {
  describe("`validateTargetFolder` method ", () => {
    let testDirPath: string;
    before(() => {
      testDirPath = dirSync().name;
    });
    after(() => {
      sync(testDirPath, { disableGlob: true });
    });

    it("returns error message when file doesnt exist at path specified", async () => {
      const result = await validateTargetFolder("wrongFolder");
      expect(result).to.eq(
        taskProvidersMessages.TARGET_FOLDER_PATH_VALIDATION_ERR
      );
    });

    it("returns true when file exists at path specified ", async () => {
      closeSync(openSync(join(testDirPath, "myMTA"), "w"));
      const result = await validateTargetFolder(join(testDirPath, "myMTA"));
      expect(result).to.be.empty;
    });

    it("returns true when no path specified", async () => {
      const result = await validateTargetFolder("");
      expect(result).to.be.empty;
    });
  });

  describe("`validateExtPath` method ", () => {
    let testDirPath: string;
    before(() => {
      testDirPath = dirSync().name;
    });
    after(() => {
      sync(testDirPath, { disableGlob: true });
    });

    it("returns error message when file doesnt exist at path specified", async () => {
      const result = await validateExtPath("test.mtaext");
      expect(result).to.eq(taskProvidersMessages.MTAEXT_PATH_VALIDATION_ERR);
    });

    it("returns true when file exists at path specified", async () => {
      closeSync(openSync(join(testDirPath, "myMTAExt.mtaext"), "w"));
      const result = await validateExtPath(
        join(testDirPath, "myMTAExt.mtaext")
      );
      expect(result).to.be.empty;
    });

    it("returns true when no path specified", async () => {
      const result = await validateExtPath("");
      expect(result).to.be.empty;
    });
  });

  describe("`validateModules` method ", () => {
    it("returns error message when no modules specified", async () => {
      const modules: string[] = [];
      const result = await validateModules(modules);
      expect(result).to.eq(taskProvidersMessages.MODULES_VALIDATION_ERR);
    });

    it("returns true when a module is specified", async () => {
      const modules = ["Module1"];
      const result = await validateModules(modules);
      expect(result).to.be.empty;
    });
  });
});
