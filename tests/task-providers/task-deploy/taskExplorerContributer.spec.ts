import { expect } from "chai";
import { resolve } from "path";
import { DeployTaskContributionAPI } from "../../../src/task-providers/task-deploy/taskExplorerContributer";
import {
  DEPLOY_MTA,
  DeployTaskDefinitionType,
} from "../../../src/task-providers/definitions";
import { ISWATracker, getSWA, initSWA } from "../../../src/utils/swa";
import { taskProvidersMessages } from "../../../src/i18n/messages";

describe("taskExplorerContributer class", () => {
  describe("convertTaskToFormInfo method", () => {
    it("returns valid array when the task has all properties ", () => {
      const testDeployAPI = new DeployTaskContributionAPI("somePath");

      const result = testDeployAPI.convertTaskToFormProperties();

      expect(result.length).to.equal(3);
      expect(result[0].type).to.equal("label");

      expect(result[1].taskProperty).to.equal("mtarPath");
      expect(result[1].type).to.equal("file");

      expect(result[2].taskProperty).to.equal("extPath");
      expect(result[2].type).to.equal("file");
    });
  });

  describe("updateTask method", () => {
    it("returns task with new values when label and mtarPath field values changed ", () => {
      const testDeployAPI = new DeployTaskContributionAPI("somePath");
      const testTask: DeployTaskDefinitionType = {
        label: "testlabel",
        taskType: "Deploy",
        mtarPath: "testmtarPath",
        type: DEPLOY_MTA,
      };
      const changedTask = {
        label: "testlabelNew",
        mtarPath: "testmtarPathNew",
      };
      const resultTask = testDeployAPI.updateTask(testTask, changedTask);

      expect(resultTask.label).to.equal("testlabelNew");
      expect(resultTask.mtarPath).to.equal("testmtarPathNew");
      expect(resultTask.extPath).to.be.undefined;
    });

    it("returns task with extPath property - when extPath added", () => {
      const testDeployAPI = new DeployTaskContributionAPI("somePath");
      const testTask = {
        label: "testlabel",
        taskType: "Deploy",
        mtarPath: "testmtarPath",
        type: DEPLOY_MTA,
      };
      const changedTask = {
        label: "testlabel",
        mtarPath: "testmtarPath",
        extPath: "testExtPath",
      };
      const resultTask = testDeployAPI.updateTask(testTask, changedTask);

      expect(resultTask.label).to.eq("testlabel");
      expect(resultTask.mtarPath).to.eq("testmtarPath");
      expect(resultTask.extPath).to.eq("testExtPath");
    });
  });

  describe("getTaskImage method", () => {
    it("returns undefined when path not valid", () => {
      const testDeployAPI = new DeployTaskContributionAPI("somePath");
      const result = testDeployAPI.getTaskImage();
      expect(result).to.be.undefined;
    });

    it("returns image as string when path is valid", () => {
      const testFolderPath: string = resolve(__dirname, "..", "..", "..", "..");
      const testDeployAPI = new DeployTaskContributionAPI(testFolderPath);
      const result = testDeployAPI.getTaskImage();
      expect(result).to.be.not.empty;
    });
  });

  describe("onSave method", () => {
    let orgSWATracker: ISWATracker;
    let swaEventType = "";
    let swaCustomEvents: string[] = [];
    const testSWATracker: ISWATracker = {
      track(eventType: string, customEvents: string[]) {
        swaEventType = eventType;
        swaCustomEvents = customEvents;
      },
    };

    beforeEach(() => {
      orgSWATracker = getSWA();
      initSWA(testSWATracker);
    });

    it("tracks `MTADeployTaskSaved` event when task has no added propeties", () => {
      const testTask = {
        label: "testlabel",
        taskType: "Deploy",
        mtarPath: "testmtarPath",
        type: DEPLOY_MTA,
      };

      const testBuildAPI = new DeployTaskContributionAPI("somePath");
      testBuildAPI.onSave(testTask);
      expect(swaEventType).to.equal(taskProvidersMessages.SWA_MTA_DEPLOY_EVENT);
      expect(swaCustomEvents).to.deep.equal([
        taskProvidersMessages.SWA_MTA_WITHOUT_EXT_PARAM,
      ]);
    });

    it("tracks `MTADeployTaskSaved` event when task contains extension property", () => {
      const testTask = {
        label: "testlabel",
        taskType: "Deploy",
        mtarPath: "testmtarPath",
        extPath: "testExtPath",
        type: DEPLOY_MTA,
      };

      const testBuildAPI = new DeployTaskContributionAPI("somePath");
      testBuildAPI.onSave(testTask);
      expect(swaEventType).to.equal(taskProvidersMessages.SWA_MTA_DEPLOY_EVENT);
      expect(swaCustomEvents).to.deep.equal([
        taskProvidersMessages.SWA_MTA_WITH_EXT_PARAM,
      ]);
    });

    afterEach(() => {
      initSWA(orgSWATracker);
      swaEventType = "";
      swaCustomEvents = [];
    });
  });

  describe("init method", () => {
    it("returns undefined always", async () => {
      const testDeployAPI = new DeployTaskContributionAPI("somePath");
      const result = await testDeployAPI.init();
      expect(result).to.be.undefined;
    });
  });
});
