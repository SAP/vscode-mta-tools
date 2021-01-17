import {
  Disposable,
  mockFileSystemWatcher,
  mockVscode,
  testVscode,
} from "../../mockUtil";
mockVscode("src/validations/mta/mtaValidations");
import * as sinon from "sinon";
import { expect } from "chai";
import {
  DEV_MTA_EXT,
  MTA_YAML,
  updateMtaDiagnostics,
  validateWsMtaYamls,
  watchMtaYamlAndDevExtFiles,
} from "../../../src/validations/mta/mtaValidations";
import { Diagnostic, Range, Uri } from "vscode";
import * as mtaDiagnostic from "../../../src/validations/mta/mtaDiagnostic";
import { resolve } from "path";
import * as fsExtra from "fs-extra";
import Mta, { mta } from "@sap/mta-lib";
import { forEach } from "lodash";

interface stubPathExistsInfo {
  path: string;
  resolvesTo: boolean;
}

describe("mtaValidations", () => {
  const disposables: Disposable[] = [];
  const projectPath = __dirname;
  const mtaYamlPath = resolve(projectPath, MTA_YAML);
  const devMtaExtPath = resolve(projectPath, DEV_MTA_EXT);
  const mtaYamlUri = {
    fsPath: mtaYamlPath,
  } as Uri;

  beforeEach(() => {
    mtaDiagnostic.clearCurrentDiagnosticCollections();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("watchMtaYamlAndDevExtFiles", async () => {
    it("registers to changes in mta.yaml and dev.mtaext files in the workspace", async () => {
      const createFileSystemWatcherSpy = sinon
        .stub(testVscode.workspace, "createFileSystemWatcher")
        .returns(mockFileSystemWatcher);
      const onDidChangeSpy = sinon.stub(mockFileSystemWatcher, "onDidChange");
      const onDidCreateSpy = sinon.stub(mockFileSystemWatcher, "onDidCreate");
      const onDidDeleteSpy = sinon.stub(mockFileSystemWatcher, "onDidDelete");

      watchMtaYamlAndDevExtFiles(disposables);

      // createFileSystemWatcher
      expect(createFileSystemWatcherSpy.callCount).to.equal(1);
      expect(createFileSystemWatcherSpy.firstCall.args).to.deep.equal([
        `**/{mta.yaml,dev.mtaext}`,
      ]);

      // onDidChange
      expect(onDidChangeSpy.callCount).to.equal(1);
      expect(
        onDidChangeSpy.withArgs(sinon.match.func, undefined, disposables).called
      ).to.be.true;

      // onDidCreate
      expect(onDidCreateSpy.callCount).to.equal(1);
      expect(
        onDidCreateSpy.withArgs(sinon.match.func, undefined, disposables).called
      ).to.be.true;

      // onDidDelete
      expect(onDidDeleteSpy.callCount).to.equal(1);
      expect(
        onDidDeleteSpy.withArgs(sinon.match.func, undefined, disposables).called
      ).to.be.true;
    });

    it("registers to workspace folder changes", async () => {
      const onDidChangeWorkspaceFoldersSpy = sinon.stub(
        testVscode.workspace,
        "onDidChangeWorkspaceFolders"
      );

      watchMtaYamlAndDevExtFiles(disposables);

      expect(onDidChangeWorkspaceFoldersSpy.callCount).to.equal(1);
      expect(
        onDidChangeWorkspaceFoldersSpy.withArgs(
          sinon.match.func,
          undefined,
          disposables
        ).called
      ).to.be.true;
    });
  });

  describe("updateMtaDiagnostics", async () => {
    async function testUpdateMtaDiagnostics(
      expectedCollectionEntries: [Uri, Diagnostic[] | undefined][],
      collectionEntries:
        | [Uri, Diagnostic[] | undefined][]
        | undefined = undefined // undefined => no old diagnostics
    ) {
      sinon.stub(testVscode.languages, "createDiagnosticCollection").returns({
        forEach: (
          func: (uri: Uri, diagnostics: Diagnostic[] | undefined) => unknown
        ) => {
          forEach(collectionEntries, (entry) => func(entry[0], entry[1]));
        },
        set: (newCollectionEntries: [Uri, Diagnostic[] | undefined][]) => {
          collectionEntries = newCollectionEntries;
        },
      });

      await updateMtaDiagnostics(mtaYamlUri, disposables);
      expect(collectionEntries).to.deep.equal(expectedCollectionEntries);
    }

    it("returns no diagnostics when mta.yaml does not exist", async () => {
      await testUpdateMtaDiagnostics([]);
    });

    it("returns no diagnostics when mta.yaml and dev.mtaext have no errors", async () => {
      stubPathExists(
        { path: mtaYamlPath, resolvesTo: true },
        { path: devMtaExtPath, resolvesTo: true }
      );
      sinon.stub(Mta.prototype, "validate").resolves({});

      await testUpdateMtaDiagnostics([]);
    });

    it("returns diagnostics when mta.yaml and dev.mtaext have errors", async () => {
      const {
        expectedEntries,
        getValidationSpy,
      } = prepValidationAndDiagnostics();
      await testUpdateMtaDiagnostics(expectedEntries);

      expect(getValidationSpy.callCount).to.equal(1);
      expect(getValidationSpy.firstCall.args).to.deep.equal([
        projectPath,
        [devMtaExtPath],
      ]);
    });

    it("returns diagnostics when mta.yaml have errors and dev.mtaext does not exist", async () => {
      const {
        expectedEntries,
        getValidationSpy,
      } = prepValidationAndDiagnostics(false);
      await testUpdateMtaDiagnostics(expectedEntries);

      expect(getValidationSpy.callCount).to.equal(1);
      expect(getValidationSpy.firstCall.args).to.deep.equal([
        projectPath,
        undefined,
      ]);
    });

    describe("clears current diagnostics", async () => {
      const expectedDiagnostics: [Uri, Diagnostic[] | undefined][] = [
        [
          // when clearing the diagnostic, we add an entry with "undefined" to the collection
          mtaYamlUri,
          undefined,
        ],
      ];

      const currentCollectionEntries: [Uri, Diagnostic[] | undefined][] = [
        [
          mtaYamlUri,
          [
            {
              source: "MTA",
              message: "diagnostic message",
              range: new Range(0, 0, 0, 0),
              severity: 0,
            },
          ],
        ],
      ];

      it("returns no diagnostics when mta.yaml does not exist", async () => {
        await testUpdateMtaDiagnostics(
          expectedDiagnostics,
          currentCollectionEntries
        );
      });

      it("returns diagnostics when mta.yaml exist", async () => {
        const {
          expectedEntries,
          getValidationSpy,
        } = prepValidationAndDiagnostics(false);
        // add the diagnostics that where cleared to the expected entries
        const newExpectedEntries = expectedDiagnostics.concat(expectedEntries);
        await testUpdateMtaDiagnostics(
          newExpectedEntries,
          currentCollectionEntries
        );

        expect(getValidationSpy.callCount).to.equal(1);
        expect(getValidationSpy.firstCall.args).to.deep.equal([
          projectPath,
          undefined,
        ]);
      });
    });
  });
  describe("validateWsMtaYamls", async () => {
    it("clears diagnostic collection and returns no diagnostics when mta.yaml does not exist in the WS", async () => {
      sinon
        .stub(testVscode.workspace, "findFiles")
        .returns(Promise.resolve([]));
      const createDiagnosticCollectionSpy = sinon.stub(
        testVscode.languages,
        "createDiagnosticCollection"
      );
      const clearDiagnosticCollectionsSpy = sinon.stub(
        mtaDiagnostic,
        "clearDiagnosticCollections"
      );

      await validateWsMtaYamls(disposables, true);

      expect(createDiagnosticCollectionSpy.callCount).to.equal(0);
      expect(clearDiagnosticCollectionsSpy.callCount).to.equal(1);
    });

    it("returns no diagnostics when mta.yaml and dev.mtaext have no errors in the WS", async () => {
      stubPathExists(
        { path: mtaYamlPath, resolvesTo: true },
        { path: devMtaExtPath, resolvesTo: true }
      );
      sinon.stub(Mta.prototype, "validate").resolves({});

      await testValidateWsMtaYamls([]);
    });

    it("returns diagnostics when mta.yaml and dev.mtaext have errors in the WS", async () => {
      const {
        expectedEntries,
        getValidationSpy,
      } = prepValidationAndDiagnostics();
      await testValidateWsMtaYamls(expectedEntries);

      expect(getValidationSpy.callCount).to.equal(1);
      expect(getValidationSpy.firstCall.args).to.deep.equal([
        projectPath,
        [devMtaExtPath],
      ]);
    });

    async function testValidateWsMtaYamls(
      expectedCollectionEntries: [Uri, Diagnostic[] | undefined][]
    ) {
      const uri = {
        fsPath: mtaYamlPath,
      } as Uri;
      sinon
        .stub(testVscode.workspace, "findFiles")
        .returns(Promise.resolve([uri]));

      let collectionEntries:
        | [Uri, Diagnostic[] | undefined][]
        | undefined = undefined;
      sinon.stub(testVscode.languages, "createDiagnosticCollection").returns({
        forEach: () => {
          return;
        },
        set: (newCollectionEntries: [Uri, Diagnostic[] | undefined][]) => {
          collectionEntries = newCollectionEntries;
        },
      });

      await validateWsMtaYamls(disposables);
      expect(collectionEntries).to.deep.equal(expectedCollectionEntries);
    }
  });

  function prepValidationAndDiagnostics(
    prepWithDevMtaExt = true
  ): {
    expectedEntries: [Uri, Diagnostic[] | undefined][];
    getValidationSpy: sinon.SinonStub;
  } {
    // mta.yaml
    const validationResult: Record<string, mta.Issue[]> = {
      [mtaYamlPath]: [
        {
          severity: "error",
          message: 'mapping key "_schema-version" already defined at line 1',
          line: 2,
          column: 0,
        },
      ],
    };

    // dev.mtaext
    if (prepWithDevMtaExt) {
      validationResult[devMtaExtPath] = [
        {
          severity: "warning",
          message: 'mapping key "_schema-version" already defined at line 3',
          line: 4,
          column: 0,
        },
      ];
    }

    const getValidationSpy = sinon
      .stub(mtaDiagnostic, "getValidation")
      .resolves(validationResult);

    const firstCallRange = {
      start: {
        line: 1,
        character: 0,
      },
      end: {
        line: 1,
        character: 0,
      },
    } as Range;
    const secondCallRange = {
      start: {
        line: 3,
        character: 0,
      },
      end: {
        line: 3,
        character: 0,
      },
    } as Range;
    const devMtaExtUri = {
      fsPath: devMtaExtPath,
    } as Uri;

    stubPathExists(
      { path: mtaYamlPath, resolvesTo: true },
      { path: devMtaExtPath, resolvesTo: prepWithDevMtaExt }
    );

    sinon
      .stub(testVscode.Uri, "file")
      .withArgs(mtaYamlPath)
      .returns(mtaYamlUri)
      .withArgs(devMtaExtPath)
      .returns(devMtaExtUri);

    //mta.yaml
    const expectedEntries: [Uri, Diagnostic[] | undefined][] = [
      [
        mtaYamlUri,
        [
          {
            source: "MTA",
            message: 'mapping key "_schema-version" already defined at line 1',
            range: firstCallRange,
            severity: 0,
          },
        ],
      ],
    ];

    // dev.mtaext
    if (prepWithDevMtaExt) {
      expectedEntries.push([
        devMtaExtUri,
        [
          {
            source: "MTA",
            message: 'mapping key "_schema-version" already defined at line 3',
            range: secondCallRange,
            severity: 1,
          },
        ],
      ]);
    }

    return { expectedEntries, getValidationSpy };
  }

  function stubPathExists(
    mtaInfo: stubPathExistsInfo,
    devMtaExtInfo: stubPathExistsInfo
  ) {
    ((sinon.stub(fsExtra, "pathExists") as unknown) as sinon.SinonStub<
      [string],
      Promise<boolean>
    >)
      .withArgs(mtaInfo.path)
      .resolves(mtaInfo.resolvesTo)
      .withArgs(devMtaExtInfo.path)
      .resolves(devMtaExtInfo.resolvesTo);
  }
});
