import { Disposable, mockVscode, testVscode } from "../../mockUtil";
mockVscode("src/validations/mta/mtaDiagnostic");
import * as sinon from "sinon";
import { expect } from "chai";
import { mta } from "@sap/mta-lib";
import {
  clearCurrentDiagnosticCollections,
  clearDiagnosticCollections,
  convertMtaIssueCoordinateToEditorCoordinate,
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
      const diagnosticCollection = {};
      const createDiagnosticCollectionSpy = sinon
        .stub(testVscode.languages, "createDiagnosticCollection")
        .returns(diagnosticCollection);

      // cache is empty
      expect(keys(diagnosticCollections).length).to.equal(0);

      // first call should create the diagnosticCollection
      const firstCallDc = getDiagnosticsCollection(
        diagnosticsName,
        disposables
      );

      // make sure the diagnosticCollection was created and not cached
      expect(createDiagnosticCollectionSpy.callCount).to.equal(1);
      // cache is contain 1 diagnosticCollection
      expect(keys(diagnosticCollections).length).to.equal(1);

      // second call will should get the diagnosticCollection from the cache
      const secondCallDc = getDiagnosticsCollection(
        diagnosticsName,
        disposables
      );

      // reference comparison. make sure it is the same object
      expect(diagnosticCollection === secondCallDc).to.be.true;
      expect(firstCallDc === secondCallDc).to.be.true;
      // cache is contain 1 diagnosticCollection
      expect(keys(diagnosticCollections).length).to.equal(1);
    });

    it("clearDiagnosticCollections clears the collection", async () => {
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

  describe("getDiagnosticsCollection", async () => {
    it("returns the correct range when column and line are zero", async () => {
      const mtaIssue: mta.Issue = {
        severity: "warning",
        message: "",
        line: 0,
        column: 0,
      };

      const pos = {
        line: 0,
        character: 0,
      };
      testGetDiagnosticsCollection(pos, mtaIssue);
    });

    it("returns the correct range when column is zero and line is 2", async () => {
      const mtaIssue: mta.Issue = {
        severity: "warning",
        message: "",
        line: 2,
        column: 0,
      };

      const pos = {
        line: 1,
        character: 0,
      };
      testGetDiagnosticsCollection(pos, mtaIssue);
    });

    it("returns the correct range when column and line are 3", async () => {
      const mtaIssue: mta.Issue = {
        severity: "warning",
        message: "",
        line: 3,
        column: 3,
      };

      const pos = {
        line: 2,
        character: 2,
      };
      testGetDiagnosticsCollection(pos, mtaIssue);
    });

    function testGetDiagnosticsCollection(
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

  describe("convertMtaIssueCoordinateToEditorCoordinate", async () => {
    it("converts to the correct coordinate when coordinate is zero", async () => {
      const coordinate = convertMtaIssueCoordinateToEditorCoordinate(0);
      expect(coordinate).to.equal(0);
    });

    it("converts to the correct coordinate when coordinate is one", async () => {
      const coordinate = convertMtaIssueCoordinateToEditorCoordinate(1);
      expect(coordinate).to.equal(0);
    });

    it("converts to the correct coordinate when coordinate is two", async () => {
      const coordinate = convertMtaIssueCoordinateToEditorCoordinate(2);
      expect(coordinate).to.equal(1);
    });
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
