import * as sinon from "sinon";
import { mockVscode, testVscode } from "../mockUtil";
mockVscode("src/commands/mtaBuildCommand");
import { MtaBuildCommand } from "../../src/commands/mtaBuildCommand";
mockVscode("src/utils/utils");
import { Utils } from "../../src/utils/utils";
import { messages } from '../../src/i18n/messages';
import { SelectionItem } from "../../src/utils/selectionItem";

describe('MTA build command unit tests', () => {
    let sandbox: any;
    let mtaBuildCommand: MtaBuildCommand;
    let utilsMock: any;
    let windowMock: any;
    let workspaceMock: any;
    let selectionItemMock: any;
    let tasksMock: any;
    
    let selected = {
        path: 'mtaProject/mta.yaml'
    };

    const MBT_CMD = 'mbt';
    const BUILD = 'build';
    const SOURCE_FLAG = '-s';
    const expectedPath = 'mtaProject';
    const homeDir = require('os').homedir();
    
    let execution = new testVscode.ShellExecution(MBT_CMD, [BUILD, SOURCE_FLAG, expectedPath]);
    let buildTask = new testVscode.Task(
        { type: 'shell' },
        testVscode.TaskScope.Workspace,
        'MTA',
        'MTA',
        execution);

    before(() => {
        sandbox = sinon.createSandbox();
    });

    after(() => {
        sandbox = sinon.restore();
    });

    beforeEach(() => {
        mtaBuildCommand = new MtaBuildCommand();
        utilsMock = sandbox.mock(Utils);
        windowMock = sandbox.mock(testVscode.window);
        workspaceMock = sandbox.mock(testVscode.workspace);
        selectionItemMock = sandbox.mock(SelectionItem);
        tasksMock = sandbox.mock(testVscode.tasks);

    });

    afterEach(() => {
        utilsMock.verify();
        windowMock.verify();
        workspaceMock.verify();
        selectionItemMock.verify();
        tasksMock.verify();
    });

    it('mtaBuildCommand - Build MTA from context menu', async () => {
        utilsMock.expects("execCommand").once().withExactArgs(MBT_CMD, ["-v"], {cwd: homeDir}).returns("v1.2.3");
        tasksMock.expects("executeTask").once().withExactArgs(buildTask);
        await mtaBuildCommand.mtaBuildCommand(selected);
    });

    it('mtaBuildCommand - Build MTA from command when no mta.yaml file in the project', async () => {
        workspaceMock.expects("findFiles").returns(Promise.resolve([]));
        utilsMock.expects("execCommand").once().withExactArgs(MBT_CMD, ["-v"], {cwd: homeDir}).returns("v1.2.3");
        windowMock.expects("showErrorMessage").withExactArgs(messages.NO_PROJECT_DESCRIPTOR);
        await mtaBuildCommand.mtaBuildCommand(undefined);
    });

    it('mtaBuildCommand - Build MTA from command with only one mta.yaml file in the project', async () => {
        workspaceMock.expects("findFiles").returns(Promise.resolve([selected]));
        utilsMock.expects("execCommand").once().withExactArgs(MBT_CMD, ["-v"], {cwd: homeDir}).returns("v1.2.3");
        tasksMock.expects("executeTask").once().withExactArgs(buildTask);
        await mtaBuildCommand.mtaBuildCommand(undefined);
    });

    it('mtaBuildCommand - Build MTA from command with several mta.yaml files in the project', async () => {
        utilsMock.expects("execCommand").once().withExactArgs(MBT_CMD, ["-v"], {cwd: homeDir}).returns("v1.2.3");
        workspaceMock.expects("findFiles").returns(Promise.resolve([selected, {path: 'mtaProject2/mta.yaml'}]));
        selectionItemMock.expects("getSelectionItems").once().returns(Promise.resolve());
        utilsMock.expects("displayOptions").once().returns(Promise.resolve({label: "mtaProject/mta.yaml"}));
        tasksMock.expects("executeTask").once().withExactArgs(buildTask);
        await mtaBuildCommand.mtaBuildCommand(undefined);
    });

    it('mtaBuildCommand - Build MTA with no mbt installed', async () => {
        utilsMock.expects("execCommand").once().withExactArgs(MBT_CMD, ["-v"], {cwd: homeDir}).returns({exitCode: "ENOENT"});
        tasksMock.expects("executeTask").never();
        windowMock.expects("showErrorMessage").withExactArgs(messages.INSTALL_MBT);
        await mtaBuildCommand.mtaBuildCommand(selected);
    });
});