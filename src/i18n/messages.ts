import * as _ from "lodash";

export const messages = {
  ERROR_ACTIVATION_FAILED:
    "Extension activation failed due to Logger configuration failure:",
  BUILD_MTA: "Build MTA",
  DEPLOY_MTAR: "Deploy MTA Archive",
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
  yeoman_ui_title: "Add MTA Module",
  NO_MTA_FILE:
    "Could not find an MTA project. Create an MTA project before creating a module.",
  INSTALL_MTA:
    "The Cloud MTA Tool is not installed in your environment. Go to https://github.com/SAP/cloud-mta to install the tool and try again"
};
