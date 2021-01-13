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
import { mta, Mta } from "@sap/mta-lib";

describe("mtaValidations", () => {
  const disposables: Disposable[] = [];

  beforeEach(() => {
    mtaDiagnostic.clearCurrentDiagnosticCollections();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("watchMtaYamlAndDevExtFiles", async () => {
    it("registers to workspace.createFileSystemWatcher and to events with the correct parameters", async () => {
      const createFileSystemWatcherSpy = sinon
        .stub(testVscode.workspace, "createFileSystemWatcher")
        .returns(mockFileSystemWatcher);
      const onDidChangeSpy = sinon.stub(mockFileSystemWatcher, "onDidChange");
      const onDidCreateSpy = sinon.stub(mockFileSystemWatcher, "onDidCreate");
      const onDidDeleteSpy = sinon.stub(mockFileSystemWatcher, "onDidDelete");

      watchMtaYamlAndDevExtFiles(disposables);

      // createFileSystemWatcher
      expect(createFileSystemWatcherSpy.callCount).to.equal(1);
      expect(
        createFileSystemWatcherSpy.withArgs(`**/{mta.yaml,dev.mtaext}`).called
      ).to.be.true;

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

    it("registers to workspace.onDidChangeWorkspaceFolders with the correct parameters", async () => {
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
    it("returns no diagnostics when mta.yaml does not exist", async () => {
      await testUpdateMtaDiagnostics([]);
    });

    it("returns no diagnostics when mta.yaml and dev.mtaext have no errors", async () => {
      sinon.stub(fsExtra, "pathExists").resolves(true);
      sinon.stub(Mta.prototype, "validate").resolves({});

      await testUpdateMtaDiagnostics([]);
    });

    it("returns diagnostics when mta.yaml and dev.mtaext have errors", async () => {
      const expectedEntries: [
        Uri,
        Diagnostic[] | undefined
      ][] = prepDiagnostics();
      await testUpdateMtaDiagnostics(expectedEntries);
    });

    async function testUpdateMtaDiagnostics(
      expectedCollectionEntries: [Uri, Diagnostic[] | undefined][]
    ) {
      const fileName = "mtaValidations.spec.js";
      const uriPath = resolve(__dirname, fileName);
      const uri = {
        fsPath: uriPath,
      } as Uri;

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

      await updateMtaDiagnostics(uri, disposables);
      expect(collectionEntries).to.deep.equal(expectedCollectionEntries);
    }
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
      sinon.stub(fsExtra, "pathExists").resolves(true);
      sinon.stub(Mta.prototype, "validate").resolves({});

      await testValidateWsMtaYamls([]);
    });

    it("returns diagnostics when mta.yaml and dev.mtaext have errors in the WS", async () => {
      const expectedEntries: [
        Uri,
        Diagnostic[] | undefined
      ][] = prepDiagnostics();
      await testValidateWsMtaYamls(expectedEntries);
    });

    async function testValidateWsMtaYamls(
      expectedCollectionEntries: [Uri, Diagnostic[] | undefined][]
    ) {
      const fileName = "mtaValidations.spec.js";
      const uriPath = resolve(__dirname, fileName);
      const uri = {
        fsPath: uriPath,
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

  function prepDiagnostics() {
    const mtaPath = resolve(__dirname, MTA_YAML);
    const devMtaExtPath = resolve(__dirname, DEV_MTA_EXT);

    const validationResult: Record<string, mta.Issue[]> = {
      [mtaPath]: [
        {
          severity: "error",
          message: 'mapping key "_schema-version" already defined at line 1',
          line: 2,
          column: 0,
        },
      ],
      [devMtaExtPath]: [
        {
          severity: "warning",
          message: 'mapping key "_schema-version" already defined at line 3',
          line: 4,
          column: 0,
        },
      ],
    };

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
    const firstCallUri = {
      fsPath: mtaPath,
    } as Uri;
    const secondCallUri = {
      fsPath: devMtaExtPath,
    } as Uri;

    sinon.stub(fsExtra, "pathExists").resolves(true);
    sinon.stub(Mta.prototype, "validate").resolves(validationResult);
    sinon
      .stub(mtaDiagnostic, "mtaIssueToEditorCoordinate")
      .onFirstCall()
      .returns(firstCallRange)
      .onSecondCall()
      .returns(secondCallRange);
    sinon
      .stub(testVscode.Uri, "file")
      .onFirstCall()
      .returns(firstCallUri)
      .onSecondCall()
      .returns(secondCallUri);

    const expectedEntries: [Uri, Diagnostic[] | undefined][] = [
      [
        firstCallUri,
        [
          {
            source: "MTA",
            message: 'mapping key "_schema-version" already defined at line 1',
            range: firstCallRange,
            severity: 0,
          },
        ],
      ],
      [
        secondCallUri,
        [
          {
            source: "MTA",
            message: 'mapping key "_schema-version" already defined at line 3',
            range: secondCallRange,
            severity: 1,
          },
        ],
      ],
    ];
    return expectedEntries;
  }
});
