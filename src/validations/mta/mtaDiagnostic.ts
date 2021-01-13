import { mta } from "@sap/mta-lib";
import { forEach } from "lodash";
import path = require("path");
import {
  DiagnosticCollection,
  DiagnosticSeverity,
  Disposable,
  languages,
  Position,
  Range,
} from "vscode";
import { DEV_MTA_EXT } from "./mtaValidations";

export let diagnosticCollections: Record<string, DiagnosticCollection> = {};

export function getDiagnosticsCollection(
  name: string,
  disposables: Disposable[]
): DiagnosticCollection {
  let collection: DiagnosticCollection = diagnosticCollections[name];
  if (collection === undefined) {
    collection = languages.createDiagnosticCollection(name);
    disposables.push(collection);
    diagnosticCollections[name] = collection;
  }
  return collection;
}

// diagnostics changed event is fired then using clear. Use this function only on uncommon scenarios
export function clearDiagnosticCollections(): void {
  forEach(diagnosticCollections, (collection) => collection.clear());
}

// For testing purposes
export function clearCurrentDiagnosticCollections(): void {
  diagnosticCollections = {};
}

export function mtaIssueToEditorCoordinate(mtaIssue: mta.Issue): Range {
  const position = new Position(
    convertMtaIssueCoordinateToEditorCoordinate(mtaIssue.line),
    convertMtaIssueCoordinateToEditorCoordinate(mtaIssue.column)
  );
  return new Range(position, position);
}

export function convertMtaIssueCoordinateToEditorCoordinate(
  coordinate: number
): number {
  const number = coordinate - 1;
  if (number < 0) {
    return 0;
  }
  return number;
}

export function getSeverity(
  filePath: string,
  severity: "warning" | "error"
): DiagnosticSeverity {
  const filename = path.parse(filePath).base;

  if (filename === DEV_MTA_EXT) {
    return DiagnosticSeverity.Warning;
  }

  //mta.yaml
  return severity === "warning"
    ? DiagnosticSeverity.Warning
    : DiagnosticSeverity.Error;
}
