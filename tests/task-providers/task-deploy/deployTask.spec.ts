import { expect } from "chai";
import { restore, stub } from "sinon";
import {
  mockVscode,
  MockVSCodeInfo,
  resetTestVSCode,
  testVscode,
} from "../../mockUtil";
import * as cfutil from "../../../src/task-providers/utils/cfutil";

mockVscode("src/task/deployTask");
import { DeployMtaTaskProvider } from "../../../src/task-providers/task-deploy/deployTask";
import { DEPLOY_MTA } from "../../../src/task-providers/definitions";

describe("deployTask ", () => {
  let deployMtaTaskProvider: DeployMtaTaskProvider;

  afterEach(() => {
    resetTestVSCode();
  });

  beforeEach(() => {
    deployMtaTaskProvider = new DeployMtaTaskProvider(
      testVscode.ExtensionContext
    );
  });

  describe(" test provideTasks", () => {
    it("Workspace folder available, one mtar file found which belongs to this workspace folder - number of provided tasks is 1", async () => {
      testVscode.workspace.workspaceFolders = [
        { uri: { path: "mtaProject1" } },
      ];
      testVscode.workspace.foundFiles = [{ path: "mtaProject1/test.mtar" }];
      const result = await deployMtaTaskProvider.provideTasks();
      expect(result.length).eq(1);
      expect(result[0].definition.mtarPath).to.eq(
        testVscode.workspace.foundFiles[0].path
      );
    });

    it("No workspace folder available - number of provided tasks is 0", async () => {
      const result = await deployMtaTaskProvider.provideTasks();
      expect(result.length).to.eq(0);
    });

    it("Workspace folder available, no mtar files found - number of provided tasks is 0", async () => {
      testVscode.workspace.workspaceFolders = [{ path: "test" }];
      const result = await deployMtaTaskProvider.provideTasks();
      expect(result.length).to.eq(0);
    });

    it("Workspace folder available, one mtar file found which doesnt belong to this workspace folder - number of provided tasks is 0", async () => {
      testVscode.workspace.workspaceFolders = [
        { uri: { path: "mtaProject1" } },
      ];
      testVscode.workspace.foundFiles = [{ path: "mtaProject2/test.mtar" }];
      const result = await deployMtaTaskProvider.provideTasks();
      expect(result.length).to.eq(0);
    });

    it("Error is thrown in method getDeployTasks  - number of provided tasks is 0", async () => {
      testVscode.workspace.workspaceFolders = [
        { uri: { path: "mtaProject1" } },
      ];
      testVscode.workspace.foundFiles = [{ path: "mtaProject1/test.mtar" }];
      testVscode.ShellExecution = class SomeShellExecution {
        constructor() {
          throw new Error("test");
        }
      };
      const result = await deployMtaTaskProvider.provideTasks();
      expect(result.length).to.eq(0);
    });
  });

  describe("resolveTask method", () => {
    afterEach(() => {
      restore();
    });

    it("returns undefined when CF plugin is not installed", async () => {
      testVscode.workspace.workspaceFolders = [
        { uri: { path: "mtaProject1" } },
      ];

      const taskDefinition = {
        type: DEPLOY_MTA,
        mtarPath: "somePath",
      };
      const myTask = new testVscode.Task(taskDefinition);

      stub(cfutil, "isCFPluginInstalled").returns(Promise.resolve(false));
      stub(cfutil, "isLoggedInToCF").returns(Promise.resolve(true));

      const result = await deployMtaTaskProvider.resolveTask(myTask);
      expect(result).is.undefined;
    });

    it("returns task when User is not logged in to CF", async () => {
      testVscode.workspace.workspaceFolders = [
        { uri: { path: "mtaProject1" } },
      ];

      const taskDefinition = {
        type: DEPLOY_MTA,
        mtarPath: "somePath",
      };
      const myTask = new testVscode.Task(taskDefinition);

      stub(cfutil, "isCFPluginInstalled").returns(Promise.resolve(true));
      stub(cfutil, "isLoggedInToCF").returns(Promise.resolve(false));
      stub(cfutil, "loginToCF").returns(Promise.resolve());

      const resultTask = await deployMtaTaskProvider.resolveTask(myTask);
      expect(resultTask?.definition.mtarPath).to.eq("somePath");
    });

    it("returns undefined when Workspace folder not available ", async () => {
      const myTask = new testVscode.Task();
      const result = await deployMtaTaskProvider.resolveTask(myTask);
      expect(result).is.undefined;
    });

    it("returns undefined when Task type is not DeployMtaTaskProvider.DeployTaskType", async () => {
      testVscode.workspace.workspaceFolders = [
        { uri: { path: "mtaProject1" } },
      ];

      const taskDefinition = {
        type: "test",
      };
      const myTask = new testVscode.Task(taskDefinition);

      const result = await deployMtaTaskProvider.resolveTask(myTask);
      expect(result).is.undefined;
    });

    it("returns undefined when Task definition doesnt have mtarPath property", async () => {
      testVscode.workspace.workspaceFolders = [
        { uri: { path: "mtaProject1" } },
      ];

      const taskDefinition = {
        type: DEPLOY_MTA,
      };
      const myTask = new testVscode.Task(taskDefinition);

      const result = await deployMtaTaskProvider.resolveTask(myTask);
      expect(result).is.undefined;
    });

    context("cf installed and user is cf logged in", () => {
      beforeEach(() => {
        stub(cfutil, "isCFPluginInstalled").returns(Promise.resolve(true));
        stub(cfutil, "isLoggedInToCF").returns(Promise.resolve(true));

        testVscode.ShellExecution = class SomeShellExecution {
          constructor(script: any) {
            MockVSCodeInfo.shellExecutionScript = script;
          }
        };
      });

      it("returns task when task definition is correct", async () => {
        testVscode.workspace.workspaceFolders = [
          { uri: { path: "mtaProject1" } },
        ];

        const taskDefinition = {
          type: DEPLOY_MTA,
          mtarPath: "somePath",
        };
        const myTask = new testVscode.Task(taskDefinition);

        const resultTask = await deployMtaTaskProvider.resolveTask(myTask);
        expect(resultTask?.definition.mtarPath).to.eq("somePath");
      });

      it("returns the task with expected execution when task definition with required only properties is provided", async () => {
        testVscode.workspace.workspaceFolders = [
          { uri: { path: "mtaProject1" } },
        ];
        const taskDefinition = {
          type: DEPLOY_MTA,
          mtarPath: "somePath",
        };
        const myTask = new testVscode.Task(taskDefinition);
        const result = await deployMtaTaskProvider.resolveTask(myTask);
        expect(result).to.exist;
        const expectedScript = `cf deploy "somePath"; sleep 2;`;
        expect(MockVSCodeInfo.shellExecutionScript).to.equal(expectedScript);
      });

      it("returns the task with expected execution when task definition with optional properties is provided", async () => {
        testVscode.workspace.workspaceFolders = [
          { uri: { path: "mtaProject1" } },
        ];
        const taskDefinition = {
          type: DEPLOY_MTA,
          mtarPath: "somePath",
          extPath: "extPath",
        };
        const myTask = new testVscode.Task(taskDefinition);
        const result = await deployMtaTaskProvider.resolveTask(myTask);
        expect(result).to.exist;
        const expectedScript = `cf deploy "somePath" -e "extPath"; sleep 2;`;
        expect(MockVSCodeInfo.shellExecutionScript).to.equal(expectedScript);
      });
    });
  });
});
