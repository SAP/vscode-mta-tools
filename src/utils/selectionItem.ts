import * as _ from "lodash";
import * as vscode from "vscode"; // NOSONAR

export class SelectionItem implements vscode.QuickPickItem {
  public static async getSelectionItems(filesPaths: any): Promise<any> {
    return _.map(filesPaths, uri => {
      return new SelectionItem(uri.path, "", "");
    });
  }
  public label: string;
  public description?: string;
  public detail?: string;
  public picked?: boolean;
  public alwaysShow?: boolean;

  constructor(label: string, description?: string, details?: string) {
    this.label = label;
    this.description = description;
    this.detail = details;
  }
}
