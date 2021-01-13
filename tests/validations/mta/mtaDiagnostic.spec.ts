import { Disposable, mockVscode, testVscode } from "../../mockUtil";
mockVscode("src/validations/mta/mtaDiagnostic");
import * as sinon from "sinon";
import { expect } from "chai";
import { mta } from "@sap/mta-lib";
import {
  clearCurrentDiagnosticCollections,
  clearDiagnosticCollections,
  diagnosticCollections,
  getDiagnosticsCollection,
  getSeverity,
  mtaIssueToEditorCoordinate,
} from "../../../src/validations/mta/mtaDiagnostic";
import { keys } from "lodash";
import { resolve } from "path";
import {
  DEV_MTA_EXT,
  MTA_YAML,
} from "../../../src/validations/mta/mtaValidations";
import { DiagnosticSeverity } from "vscode";

describe("mtaDiagnostic", () => {
  const disposables: Disposable[] = [];

  afterEach(() => {
    sinon.restore();
  });

  describe("diagnosticCollections tests", async () => {
    beforeEach(() => {
      clearCurrentDiagnosticCollections();
    });

    it("getDiagnosticsCollection returns cached DiagnosticCollection", async () => {
      const diagnosticsName = "diagnosticsName";
      const createDiagnosticCollectionSpy = sinon
        .stub(testVscode.languages, "createDiagnosticCollection")
        .callsFake(() => ({}));

      // cache is empty
      expect(keys(diagnosticCollections).length).to.equal(0);

      // first call should create the diagnosticCollection
      const firstCallDc = getDiagnosticsCollection(
        diagnosticsName,
        disposables
      );

      // make sure the diagnosticCollection was created and not retrieved from cache
      expect(createDiagnosticCollectionSpy.callCount).to.equal(1);
      // cache is contain 1 diagnosticCollection
      expect(keys(diagnosticCollections).length).to.equal(1);

      // second call will should get the diagnosticCollection from the cache
      const secondCallDc = getDiagnosticsCollection(
        diagnosticsName,
        disposables
      );
      // make sure the diagnosticCollection was cached (callCount as before)
      expect(createDiagnosticCollectionSpy.callCount).to.equal(1);

      // reference comparison. make sure it is the same object
      expect(firstCallDc).to.equal(secondCallDc);
      // cache is contain 1 diagnosticCollection
      expect(keys(diagnosticCollections).length).to.equal(1);
    });

    it("clearDiagnosticCollections clears the cached collections", async () => {
      let clearTriggered = false;
      const diagnosticCollection = {
        clear: () => {
          clearTriggered = true;
        },
      };
      const createDiagnosticCollectionSpy = sinon
        .stub(testVscode.languages, "createDiagnosticCollection")
        .returns(diagnosticCollection);

      // cache is empty
      expect(keys(diagnosticCollections).length).to.equal(0);

      // call should create a new diagnosticCollection
      getDiagnosticsCollection("diagnosticsName1", disposables);

      expect(keys(diagnosticCollections).length).to.equal(1);

      clearDiagnosticCollections();

      expect(clearTriggered).to.be.true;
      expect(createDiagnosticCollectionSpy.callCount).to.equal(1);
    });
  });

  describe("mtaIssueToEditorCoordinate", async () => {
    it("returns the correct range when column and line are zero", async () => {
      const mtaIssue: mta.Issue = {
        severity: "warning",
        message: "",
        line: 0,
        column: 0,
      };

      const expectedPos = {
        line: 0,
        character: 0,
      };
      testMtaIssueToEditorCoordinate(expectedPos, mtaIssue);
    });

    it("returns the correct range when column is zero and line is non-zero", async () => {
      const mtaIssue: mta.Issue = {
        severity: "warning",
        message: "",
        line: 2,
        column: 0,
      };

      const expectedPos = {
        line: 1,
        character: 0,
      };
      testMtaIssueToEditorCoordinate(expectedPos, mtaIssue);
    });

    it("returns the correct range when column and line non-zero", async () => {
      const mtaIssue: mta.Issue = {
        severity: "warning",
        message: "",
        line: 10,
        column: 12,
      };

      const expectedPos = {
        line: 9,
        character: 11,
      };
      testMtaIssueToEditorCoordinate(expectedPos, mtaIssue);
    });

    it("returns the correct range when column and line negative", async () => {
      const mtaIssue: mta.Issue = {
        severity: "warning",
        message: "",
        line: -5,
        column: -1,
      };

      const expectedPos = {
        line: 0,
        character: 0,
      };
      testMtaIssueToEditorCoordinate(expectedPos, mtaIssue);
    });

    function testMtaIssueToEditorCoordinate(
      pos: { line: number; character: number },
      mtaIssue: mta.Issue
    ) {
      const expectedRange = {
        start: pos,
        end: pos,
      };

      const resRange = mtaIssueToEditorCoordinate(mtaIssue);

      expect(resRange).to.deep.equal(expectedRange);
    }
  });

  describe("getSeverity", async () => {
    it("returns warning when dev.mtaext is sent with error", async () => {
      const filePath = resolve(__dirname, DEV_MTA_EXT);
      const diagnosticSeverity = getSeverity(filePath, "error");
      expect(diagnosticSeverity).to.equal(DiagnosticSeverity.Warning);
    });

    it("returns warning when dev.mtaext is sent with warning", async () => {
      const filePath = resolve(__dirname, DEV_MTA_EXT);
      const diagnosticSeverity = getSeverity(filePath, "warning");
      expect(diagnosticSeverity).to.equal(DiagnosticSeverity.Warning);
    });

    it("returns error when mta.yaml is sent with error", async () => {
      const filePath = resolve(__dirname, MTA_YAML);
      const diagnosticSeverity = getSeverity(filePath, "error");
      expect(diagnosticSeverity).to.equal(DiagnosticSeverity.Error);
    });

    it("returns warning when mta.yaml is sent with warning", async () => {
      const filePath = resolve(__dirname, MTA_YAML);
      const diagnosticSeverity = getSeverity(filePath, "warning");
      expect(diagnosticSeverity).to.equal(DiagnosticSeverity.Warning);
    });
  });
});
