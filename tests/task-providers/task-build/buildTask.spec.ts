import { restore, stub } from "sinon";
import { expect } from "chai";
import {
  mockVscode,
  MockVSCodeInfo,
  resetTestVSCode,
  testVscode,
} from "../../mockUtil";

mockVscode("src/task-build/buildTask");
import { BuildMtaTaskProvider } from "../../../src/task-providers/task-build/buildTask";
import { Utils } from "../../../src/utils/utils";
import {
  BUILD_MODULE_WITH_DEPS,
  BUILD_MTA,
  Build_MTA_Module,
  Build_MTA_Project,
} from "../../../src/task-providers/definitions";

describe("BuildMtaTaskProvider Class", () => {
  let buildMtaTaskProvider: BuildMtaTaskProvider;

  afterEach(() => {
    resetTestVSCode();
  });

  beforeEach(() => {
    buildMtaTaskProvider = new BuildMtaTaskProvider(
      testVscode.ExtensionContext
    );
  });

  describe("`provideTasks` method", () => {
    it("returns a task when workspace folder available and one `mta.yaml` belongs to this workspace folder", async () => {
      testVscode.workspace.workspaceFolders = [
        { uri: { path: "mtaProject1" } },
      ];

      testVscode.workspace.foundFiles = [{ path: "mtaProject1/mta.yaml" }];
      const result = await buildMtaTaskProvider.provideTasks();
      expect(result.length).to.equal(1);
      expect(result[0].definition.mtaFilePath).to.equal(
        testVscode.workspace.foundFiles[0].path
      );
    });

    it("returns 0 provided tasks when no workspace folder available", async () => {
      const result = await buildMtaTaskProvider.provideTasks();
      expect(result.length).to.equal(0);
    });

    it("returns 0 provided tasks when workspace folder available and missing `mta.yaml` files ", async () => {
      testVscode.workspace.workspaceFolders = [{ path: "test" }];
      const result = await buildMtaTaskProvider.provideTasks();
      expect(result.length).to.equal(0);
    });

    it("returns 0 provided tasks when workspace folder available and one `mta.yaml` file found which doesnt belong to this workspace folder", async () => {
      testVscode.workspace.workspaceFolders = [
        { uri: { path: "mtaProject1" } },
      ];

      testVscode.workspace.foundFiles = [{ path: "mtaProject2/mta.yaml" }];
      const result = await buildMtaTaskProvider.provideTasks();
      expect(result.length).to.equal(0);
    });

    it("returns 0 provided tasks when error is thrown in method `getBuildTasks`", async () => {
      testVscode.workspace.workspaceFolders = [
        { uri: { path: "mtaProject1" } },
      ];
      testVscode.workspace.foundFiles = [{ path: "mtaProject1/mta.yaml" }];
      testVscode.ShellExecution = class SomeShellExecution {
        constructor() {
          throw new Error("test");
        }
      };

      const result = await buildMtaTaskProvider.provideTasks();
      expect(result.length).to.equal(0);
    });
  });

  describe("`resolveTask` method", () => {
    afterEach(() => {
      restore();
    });

    it("returns undefined when workspace folder is not available", async () => {
      const myTask = new testVscode.Task();
      const result = await buildMtaTaskProvider.resolveTask(myTask);
      expect(result).is.undefined;
    });

    it("returns undefined when task type is not `BUILD_MTA`", async () => {
      testVscode.workspace.workspaceFolders = [
        { uri: { path: "mtaProject1" } },
      ];

      const taskDefinition = {
        type: "test",
      };
      const myTask = new testVscode.Task(taskDefinition);
      const result = await buildMtaTaskProvider.resolveTask(myTask);
      expect(result).is.undefined;
    });

    it("returns undefined when task definition doesnt have `buildType` property", async () => {
      testVscode.workspace.workspaceFolders = [
        { uri: { path: "mtaProject1" } },
      ];

      const taskDefinition = {
        type: BUILD_MTA,
        mtaFilePath: "mtaProject1",
      };

      const myTask = new testVscode.Task(taskDefinition);
      const result = await buildMtaTaskProvider.resolveTask(myTask);
      expect(result).is.undefined;
    });

    it("returns undefined when task definition doesnt have `mtaFilePath` property", async () => {
      testVscode.workspace.workspaceFolders = [
        { uri: { path: "mtaProject1" } },
      ];

      const taskDefinition = {
        type: BUILD_MTA,
        buildType: Build_MTA_Project,
      };

      const myTask = new testVscode.Task(taskDefinition);
      const result = await buildMtaTaskProvider.resolveTask(myTask);
      expect(result).is.undefined;
    });

    it("returns undefined when mbt cli is not installed", async () => {
      testVscode.workspace.workspaceFolders = [
        { uri: { path: "mtaProject1" } },
      ];

      const taskDefinition = {
        type: BUILD_MTA,
        mtaFilePath: "mtaProject1/mta.yaml",
        buildType: Build_MTA_Project,
      };
      stub(Utils, "isCliToolInstalled").returns(Promise.resolve(false));

      const myTask = new testVscode.Task(taskDefinition);
      const result = await buildMtaTaskProvider.resolveTask(myTask);
      expect(result).is.undefined;
    });

    it("returns undefined when task definition doesnt have `modules` property", async () => {
      testVscode.workspace.workspaceFolders = [
        { uri: { path: "mtaProject1" } },
      ];

      const taskDefinition = {
        type: BUILD_MTA,
        mtaFilePath: "mtaProject1/mta.yaml",
        buildType: Build_MTA_Module,
      };

      const myTask = new testVscode.Task(taskDefinition);
      const result = await buildMtaTaskProvider.resolveTask(myTask);
      expect(result).is.undefined;
    });

    describe("cli tool installed", () => {
      beforeEach(() => {
        testVscode.ShellExecution = class SomeShellExecution {
          constructor(script: any) {
            MockVSCodeInfo.shellExecutionScript = script;
          }
        };
      });

      context("Build MTA Project option selected", () => {
        it("returns the task with expected execution when task definition with required only properties is provided", async () => {
          testVscode.workspace.workspaceFolders = [
            { uri: { path: "mtaProject1" } },
          ];
          stub(Utils, "isCliToolInstalled").returns(Promise.resolve(true));
          const taskDefinition = {
            type: BUILD_MTA,
            mtaFilePath: "mtaProject1/mta.yaml",
            buildType: Build_MTA_Project,
          };
          const myTask = new testVscode.Task(taskDefinition);
          const result = await buildMtaTaskProvider.resolveTask(myTask);
          expect(result).to.exist;
          const expectedScript = `mbt build -s "mtaProject1"; sleep 2;`;
          expect(MockVSCodeInfo.shellExecutionScript).to.equal(expectedScript);
        });

        it("returns the task with expected execution when task definition with all optional properties is provided", async () => {
          testVscode.workspace.workspaceFolders = [
            { uri: { path: "mtaProject1" } },
          ];
          stub(Utils, "isCliToolInstalled").returns(Promise.resolve(true));
          const taskDefinition = {
            type: BUILD_MTA,
            mtaFilePath: "mtaProject1/mta.yaml",
            buildType: Build_MTA_Project,
            mtarTargetPath: "targetProject",
            mtarName: "mtarName",
            extPath: "extPath",
          };
          const myTask1 = new testVscode.Task(taskDefinition);
          const result = await buildMtaTaskProvider.resolveTask(myTask1);
          expect(result).to.exist;
          const expectedScript = `mbt build -s "mtaProject1" -t "targetProject" --mtar "mtarName" -e "extPath"; sleep 2;`;
          expect(MockVSCodeInfo.shellExecutionScript).to.equal(expectedScript);
        });

        it("returns the task with expected execution when task definition with partial optional properties is provided", async () => {
          testVscode.workspace.workspaceFolders = [
            { uri: { path: "mtaProject1" } },
          ];
          stub(Utils, "isCliToolInstalled").returns(Promise.resolve(true));
          const taskDefinition = {
            type: BUILD_MTA,
            mtaFilePath: "mtaProject1/mta.yaml",
            buildType: Build_MTA_Project,
            extPath: "extPath",
          };
          const myTask = new testVscode.Task(taskDefinition);
          const result = await buildMtaTaskProvider.resolveTask(myTask);
          expect(result).to.exist;
          const expectedScript = `mbt build -s "mtaProject1" -e "extPath"; sleep 2;`;
          expect(MockVSCodeInfo.shellExecutionScript).to.equal(expectedScript);
        });
      });

      context("Build MTA Module option selected", () => {
        it("returns the task with expected execution when task definition with required only properties is provided", async () => {
          testVscode.workspace.workspaceFolders = [
            { uri: { path: "mtaProject1" } },
          ];
          stub(Utils, "isCliToolInstalled").returns(Promise.resolve(true));
          const taskDefinition = {
            type: BUILD_MTA,
            mtaFilePath: "mtaProject1/mta.yaml",
            buildType: Build_MTA_Module,
            modules: ["testmodule"],
          };
          const myTask = new testVscode.Task(taskDefinition);
          const result = await buildMtaTaskProvider.resolveTask(myTask);
          expect(result).to.exist;
          const expectedScript = `mbt module-build -m "testmodule" -s "mtaProject1" -g; sleep 2;`;
          expect(MockVSCodeInfo.shellExecutionScript).to.equal(expectedScript);
        });

        it("returns the task with expected execution when task definition with all optional properties is provided", async () => {
          testVscode.workspace.workspaceFolders = [
            { uri: { path: "mtaProject1" } },
          ];
          stub(Utils, "isCliToolInstalled").returns(Promise.resolve(true));
          const taskDefinition = {
            type: BUILD_MTA,
            mtaFilePath: "mtaProject1/mta.yaml",
            buildType: Build_MTA_Module,
            modules: ["testmodule"],
            dependencies: [BUILD_MODULE_WITH_DEPS],
            targetFolderPath: "targetFolder",
            extPath: "extPath",
          };
          const myTask = new testVscode.Task(taskDefinition);
          const result = await buildMtaTaskProvider.resolveTask(myTask);
          expect(result).to.exist;
          const expectedScript = `mbt module-build -m "testmodule" -s "mtaProject1" -g -a -t "targetFolder" -e "extPath"; sleep 2;`;
          expect(MockVSCodeInfo.shellExecutionScript).to.equal(expectedScript);
        });

        it("returns the task with expected execution when task definition with partial optional properties is provided", async () => {
          testVscode.workspace.workspaceFolders = [
            { uri: { path: "mtaProject1" } },
          ];
          stub(Utils, "isCliToolInstalled").returns(Promise.resolve(true));
          const taskDefinition = {
            type: BUILD_MTA,
            mtaFilePath: "mtaProject1/mta.yaml",
            buildType: Build_MTA_Module,
            modules: ["testmodule"],
            extPath: "extPath",
          };
          const myTask = new testVscode.Task(taskDefinition);
          const result = await buildMtaTaskProvider.resolveTask(myTask);
          expect(result).to.exist;
          const expectedScript = `mbt module-build -m "testmodule" -s "mtaProject1" -g -e "extPath"; sleep 2;`;
          expect(MockVSCodeInfo.shellExecutionScript).to.equal(expectedScript);
        });
      });
    });
  });
});
