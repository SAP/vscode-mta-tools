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
