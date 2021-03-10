const selectTemplateQuestionHint =
  "Select the template that best fits the type of module you want to create";
const selectMtaProjectQuestionHint =
  "The module will be added to the MTA project you define in this wizard";

export const messages = {
  ERROR_ACTIVATION_FAILED:
    "Extension activation failed due to Logger configuration failure:",
  BUILD_MTA: "Build MTA Project",
  DEPLOY_MTAR: "Deploy MTA Archive",
  CHANNEL_NAME: "MTA",
  SELECT_PROJECT_DESCRIPTOR:
    "Select the folder containing the MTA project descriptor file (mta.yaml)",
  NO_PROJECT_DESCRIPTOR:
    "Could not find a folder containing an MTA project descriptor file (mta.yaml).",
  NO_MTA_ARCHIVE: "Could not find an MTA archive.",
  SELECT_MTA_ARCHIVE: "Select MTA Archive",
  LOGIN_VIA_CLI:
    "You must log into Cloud Foundry using the Cloud Foundry CLI to deploy your MTA archive. Go to https://github.com/cloudfoundry/cli to install the CLI and try again",
  INSTALL_MBT:
    "The Cloud MTA Build Tool is not installed in your environment. Go to https://github.com/SAP/cloud-mta-build-tool to install the tool and try again",
  INSTALL_MTA_CF_CLI:
    "The MultiApps CF CLI Plugin is not installed in your environment. Go to https://github.com/cloudfoundry-incubator/multiapps-cli-plugin to install the plugin and try again.",
  NO_MTA_FILE:
    "Could not find an MTA project. Create an MTA project before creating a module.",
  INSTALL_MTA:
    "The Cloud MTA Tool is not installed in your environment. Go to https://github.com/SAP/cloud-mta to install the tool and try again",
  EVENT_TYPE_ADD_MODULE: "Add MTA Module",
  EVENT_TYPE_BUILD_MTA: "Build MTA",
  EVENT_TYPE_DEPLOY_MTAR: "Deploy mtar",
  CUSTOM_EVENT_CONTEXT_MENU: "Context Menu",
  CUSTOM_EVENT_COMMAND_PALETTE: "Command Palette",
};

export const taskProvidersMessages = {
  MTA_TASKS_PROVIDER: "MTA Task Provider",
  SWA_MTA_BUILD_EVENT: "MTABuildTaskSaved",
  SWA_MTA_DEPLOY_EVENT: "MTADeployTaskSaved",
  SWA_MTA_BUILD_PROJECT_PARAM: "build project",
  SWA_MTA_BUILD_MODULE_PARAM: "build module",
  SWA_MTA_WITH_EXT_PARAM: "with extension",
  SWA_MTA_WITHOUT_EXT_PARAM: "without extension",
  SWA_DEFAULT_TARGET_PATH_PARAM: "default target path",
  SWA_CUSTOM_TARGET_PATH_PARAM: "custom target path",
  LOGGER_NOT_AVAILABLE:
    "Logs won't be available for the MTA Task Provider extension: ",
  AUTO_DETECT_MTA_DEPLOY_FAILURE: "Could not auto-detect any MTA Deploy task.",
  AUTO_DETECT_MTA_BUILD_FAILURE: "Could not auto-detect any MTA Build task.",
  MTAR_PATH_VALIDATION_ERR:
    'You must provide the path to the "*.mtar" file to continue.',
  MTAEXT_PATH_VALIDATION_ERR:
    "You must provide a valid path to the MTA extension file to continue.",
  TARGET_FOLDER_PATH_VALIDATION_ERR:
    "You must provide a valid path to the target folder to continue.",
  TASK_NAME_VALIDATION_ERR: "You must provide a task name to continue.",
  MTAR_PATH_HINT: "The path to the MTAR file to be deployed",
  MTAR_FILE_NAME: "The name of the generated archive file (.mtar).",
  MODULES_VALIDATION_ERR: "You must select a module to continue.",
  MTAEXT_PATH_HINT: "The path to the multitarget application extension file.",
  TARGET_FOLDER_PATH_HINT:
    "The folder for the generated MTAR file. If this parameter is not provided, the MTAR file is saved in the mta_archives subfolder.",
  BUILD_WITH_DEPS_HINT:
    "The additional modules on which the selected modules depend will be built.",
  INSTALL_MTA_CF_CLI:
    "The MultiApps CF CLI Plugin is not installed in your environment. Go to https://github.com/cloudfoundry-incubator/multiapps-cli-plugin to install the plugin and try again.",
  LOGIN_VIA_CLI:
    "You must login to Cloud Foundry using the Cloud Foundry CLI to deploy your MTA archive. Go to https://github.com/cloudfoundry/cli to install the CLI and try again.",
  MTAR_PROPERTY_MISSING_LOG: (taskName: string): string =>
    `The "mtarPath" property of the "${taskName}" task is missing or empty`,
  MTA_PROPERTY_MISSING: (taskName: string): string =>
    `The "mtarPath" property of the "${taskName}" task is missing or empty`,
  BUILD_TYPE_PROPERTY_MISSING: (taskName: string): string =>
    `The "buildType" property of the "${taskName}" task is missing or empty`,
  CF_LOGIN_FAIL: "Could not login to Cloud Foundry.",
  FILES_FOUND: (fileType: string, len: number): string =>
    `There were ${len} ${fileType} files found.`,
  NO_WS_LOG: (fileName: string): string =>
    `Could not find a workspace folder for the ${fileName} file.`,
  INSTALL_MBT: (): string =>
    "The Cloud MTA Build Tool is not installed in your environment. Go to https://github.com/SAP/cloud-mta-build-tool to install the tool and try again.",
  MODULES_PROPERTY_MISSING: (taskName: string): string =>
    `The "modules" property of the "${taskName}" task is missing or empty.`,
  MODULE_TARGET_FOLDER_PATH_HINT:
    "The folder where the module build results will be saved. If this parameter is not provided, the module build results are saved in the <path to the folder where mta.yaml is located> folder according to the default configuration of the 'mta module-build' command of the Cloud MTA Build Tool.",
}

export const messagesYeoman = {
  yeoman_ui_title: "New MTA Module From Template",
  panel_title: "MTA Module From Template",
  select_generator_name: "Select Module Template",
  select_generator_question_message: "Templates",
  select_generator_question_hint: selectTemplateQuestionHint,
  select_generator_description: `${selectTemplateQuestionHint}.\n${selectMtaProjectQuestionHint}.`,
  select_mtaFile_hint: "Path to the selected project's 'mta.yaml' file:",
  artifact_generated: "The module has been created.",
};
