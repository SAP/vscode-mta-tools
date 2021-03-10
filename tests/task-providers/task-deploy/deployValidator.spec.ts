import { expect } from "chai";
import { closeSync, openSync } from "fs";
import { dirSync } from "tmp";
import { sync } from "rimraf";
import { join } from "path";
import { validateExtPath } from "../../../src/task-providers/task-deploy/deployValidator";
import { taskProvidersMessages } from "../../../src/i18n/messages";

describe("deployValidator util ", () => {
  describe("validateExtPath method ", () => {
    let testDirPath: string;
    before(() => {
      testDirPath = dirSync().name;
    });
    after(() => {
      sync(testDirPath, { disableGlob: true });
    });

    it("return true when the extPath is empty string", () => {
      const result = validateExtPath("");
      expect(result).to.be.empty;
    });

    it("returns error message when file doesnt exist at path specified", () => {
      const result = validateExtPath("test.mtaext");
      expect(result).to.eq(taskProvidersMessages.MTAEXT_PATH_VALIDATION_ERR);
    });

    it("returns true when file exists at path specified ", () => {
      closeSync(openSync(join(testDirPath, "myMTAExt.mtaext"), "w"));
      const result = validateExtPath(join(testDirPath, "myMTAExt.mtaext"));
      expect(result).to.be.empty;
    });
  });
});
