import { expect } from "chai";
import * as common from "../../../src/task-providers/utils/common";

describe("common util ", () => {
  describe("execCommand ", () => {
    it("resturns expected stdout when command is valid", async () => {
      const response = await common.execCommand("sh", ["-c", "echo test"], {});
      expect(response.stdout).to.include("test");
    });

    it("resturns exitCode 'ENOENT' when command is not valid", async () => {
      const response = await common.execCommand("bla_123", ["bla_123"], {});
      expect(response.exitCode).to.equal("ENOENT");
    });
  });
});
