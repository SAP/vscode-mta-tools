import { expect } from "chai";
import { restore, stub } from "sinon";
import { resolve } from "path";
import Mta from "@sap/mta-lib";
import {
  CheckboxFormProperty,
  ComboboxFormProperty,
} from "../../../src/task-providers/types";
import {
  BuildTaskDefinitionType,
  BUILD_MTA,
  Build_MTA_Project,
  Build_MTA_Module,
} from "../../../src/task-providers/definitions";
import { BuildTaskContributionAPI } from "../../../src/task-providers/task-build/taskExplorerContributer";
import { getSWA, initSWA, ISWATracker } from "../../../src/utils/swa";
import { taskProvidersMessages } from "../../../src/i18n/messages";

describe("taskExplorerContributer class", () => {
  describe("convertTaskToFormInfo method", () => {
    it("returns valid array when build type is `archive` and the task has all properties and", () => {
      const testBuildAPI = new BuildTaskContributionAPI("somePath");
      const testTask: BuildTaskDefinitionType = {
        label: "testlabel",
        taskType: "Build",
        buildType: Build_MTA_Project,
        mtaFilePath: "testmtaPath",
        type: BUILD_MTA,
      };

      const result = testBuildAPI.convertTaskToFormProperties(testTask);

      expect(result.length).to.equal(6);
      expect(result[0].type).to.equal("label");

      expect(result[1].taskProperty).to.equal("mtaFilePath");
      expect(result[1].type).to.equal("input");

      expect(result[2].taskProperty).to.equal("buildType");
      expect(result[2].type).to.equal("combobox");

      expect(result[3].taskProperty).to.equal("mtarTargetPath");
      expect(result[3].type).to.equal("folder");

      expect(result[4].taskProperty).to.equal("mtarName");
      expect(result[4].type).to.equal("input");

      expect(result[5].taskProperty).to.equal("extPath");
      expect(result[5].type).to.equal("file");
    });

    it("returns valid array when build type is `module` and the task has all properties and", () => {
      const testBuildAPI = new BuildTaskContributionAPI("somePath");
      const testTask: BuildTaskDefinitionType = {
        label: "testlabel",
        taskType: "Build",
        buildType: Build_MTA_Module,
        mtaFilePath: "testmtaPath",
        type: BUILD_MTA,
      };

      const result = testBuildAPI.convertTaskToFormProperties(testTask);

      expect(result.length).to.equal(7);
      expect(result[0].type).to.equal("label");

      expect(result[1].taskProperty).to.equal("mtaFilePath");
      expect(result[1].type).to.equal("input");

      expect(result[2].taskProperty).to.equal("buildType");
      expect(result[2].type).to.equal("combobox");

      expect(result[3].taskProperty).to.equal("modules");
      expect(result[3].type).to.equal("checkbox");

      expect(result[4].taskProperty).to.equal("dependencies");
      expect(result[4].type).to.equal("checkbox");

      expect(result[5].taskProperty).to.equal("targetFolderPath");
      expect(result[5].type).to.equal("folder");

      expect(result[6].taskProperty).to.equal("extPath");
      expect(result[6].type).to.equal("file");
    });
  });

  describe("updateTask method", () => {
    it("returns task with new values when a mandatory field value changed ", () => {
      const testBuildAPI = new BuildTaskContributionAPI("somePath");
      const testTask: BuildTaskDefinitionType = {
        label: "testlabel",
        taskType: "Build",
        buildType: Build_MTA_Module,
        mtaFilePath: "testmtaPath",
        type: BUILD_MTA,
      };

      const changedTask = {
        label: "testlabelNew",
      };

      const resultTask = testBuildAPI.updateTask(testTask, changedTask);

      expect(resultTask.label).to.equal("testlabelNew");
      expect(resultTask.targetFolderPath).to.be.undefined;
      expect(resultTask.mtarName).to.be.undefined;
      expect(resultTask.extPath).to.be.undefined;
    });

    it("returns task with optional property when added", () => {
      const testBuildAPI = new BuildTaskContributionAPI("somePath");
      const testTask: BuildTaskDefinitionType = {
        label: "testlabel",
        taskType: "Build",
        buildType: Build_MTA_Module,
        mtaFilePath: "testmtaPath",
        type: BUILD_MTA,
      };

      const changedTask = {
        label: "testlabelNew",
        extPath: "testExtPath",
      };

      const resultTask = testBuildAPI.updateTask(testTask, changedTask);

      expect(resultTask.label).to.equal("testlabelNew");
      expect(resultTask.extPath).to.equal("testExtPath");
    });
  });

  describe("getTaskImage method", () => {
    it("returns undefined when path not valid", () => {
      const testBuildAPI = new BuildTaskContributionAPI("somePath");
      const result = testBuildAPI.getTaskImage();
      expect(result).to.be.undefined;
    });

    it("returns image as string when path is valid", () => {
      const testFolderPath: string = resolve(__dirname, "..", "..", "..", "..");
      const testBuildAPI = new BuildTaskContributionAPI(testFolderPath);
      const result = testBuildAPI.getTaskImage();
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

    it("tracks `MTABuildTaskSaved` event when task build type is `build project` and there is no added property", () => {
      const testTask: BuildTaskDefinitionType = {
        label: "testlabel",
        taskType: "Build",
        buildType: Build_MTA_Project,
        mtaFilePath: "testmtaPath",
        type: BUILD_MTA,
      };

      const testBuildAPI = new BuildTaskContributionAPI("somePath");
      testBuildAPI.onSave(testTask);
      expect(swaEventType).to.equal(taskProvidersMessages.SWA_MTA_BUILD_EVENT);
      expect(swaCustomEvents).to.deep.equal([
        taskProvidersMessages.SWA_MTA_BUILD_PROJECT_PARAM,
        taskProvidersMessages.SWA_MTA_WITHOUT_EXT_PARAM,
        taskProvidersMessages.SWA_DEFAULT_TARGET_PATH_PARAM,
      ]);
    });

    it("tracks `MTABuildTaskSaved` event when task build type is `build module` and there are added properties", () => {
      const testTask: BuildTaskDefinitionType = {
        label: "testlabel",
        taskType: "Build",
        buildType: Build_MTA_Module,
        mtaFilePath: "testmtaPath",
        targetFolderPath: "targetFolder",
        extPath: "extPath",
        type: BUILD_MTA,
      };

      const testBuildAPI = new BuildTaskContributionAPI("somePath");
      testBuildAPI.onSave(testTask);
      expect(swaEventType).to.equal(taskProvidersMessages.SWA_MTA_BUILD_EVENT);
      expect(swaCustomEvents).to.deep.equal([
        taskProvidersMessages.SWA_MTA_BUILD_MODULE_PARAM,
        taskProvidersMessages.SWA_MTA_WITH_EXT_PARAM,
        taskProvidersMessages.SWA_CUSTOM_TARGET_PATH_PARAM,
      ]);
    });

    afterEach(() => {
      initSWA(orgSWATracker);
      swaEventType = "";
      swaCustomEvents = [];
    });
  });

  describe("init method", () => {
    afterEach(() => {
      restore();
    });

    it("causes display of modules field when mta project has modules", async () => {
      const testTask: BuildTaskDefinitionType = {
        label: "testlabel",
        taskType: "Build",
        buildType: Build_MTA_Module,
        mtaFilePath: "testmtaPath",
        type: BUILD_MTA,
      };
      const expModule = { name: "modulea", type: "bb" };
      stub(Mta.prototype, "getModules").returns(Promise.resolve([expModule]));
      const testBuildAPI = new BuildTaskContributionAPI("somePath");
      await testBuildAPI.init("", testTask);
      const result = testBuildAPI.convertTaskToFormProperties(testTask);
      // check modules field
      const listField = result[3] as CheckboxFormProperty;
      expect(listField.taskProperty).to.equal("modules");
      expect(listField.type).to.equal("checkbox");
      expect(listField.list.length).to.equal(1);
      expect(listField.list[0]).to.equal(expModule.name);
      // check buildType field
      const builOptionsField = result[2] as ComboboxFormProperty;
      expect(builOptionsField.taskProperty).to.equal("buildType");
      expect(builOptionsField.type).to.equal("combobox");
      expect(builOptionsField.list.length).to.equal(2);
    });

    it("causes no display of modules field when mta project has no modules", async () => {
      const testTask: BuildTaskDefinitionType = {
        label: "testlabel",
        taskType: "Build",
        buildType: Build_MTA_Module,
        mtaFilePath: "testmtaPath",
        type: BUILD_MTA,
      };

      stub(Mta.prototype, "getModules").returns(Promise.resolve([]));
      const testBuildAPI = new BuildTaskContributionAPI("somePath");
      await testBuildAPI.init("", testTask);
      const result = testBuildAPI.convertTaskToFormProperties(testTask);
      // check buildType field
      const builOptionsField = result[2] as ComboboxFormProperty;
      expect(builOptionsField.taskProperty).to.equal("buildType");
      expect(builOptionsField.type).to.equal("combobox");
      expect(builOptionsField.list.length).to.equal(1);
      expect(builOptionsField.list[0]).to.equal(Build_MTA_Project);
    });
  });
});
