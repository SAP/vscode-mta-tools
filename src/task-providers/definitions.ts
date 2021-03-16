import { ConfiguredTask } from "./types";

export const DEPLOY_MTA = "deploy-mta";
export const BUILD_MTA = "build-mta";
export const BUILD_MODULE_WITH_DEPS = "Build with dependencies";
export type BuildTypeOptions = "Build MTA Project" | "Build MTA Module";
export const Build_MTA_Project = "Build MTA Project";
export const Build_MTA_Module = "Build MTA Module";

export interface DeployTaskDefinitionType extends ConfiguredTask {
  taskType: string;
  mtarPath: string;
  extPath?: string;
}

export interface BuildTaskDefinitionType extends ConfiguredTask {
  taskType: string;
  mtaFilePath: string;
  buildType: BuildTypeOptions;
  mtarTargetPath?: string;
  mtarName?: string;
  extPath?: string;
  modules?: string[];
  dependencies?: string[];
  targetFolderPath?: string;
}
