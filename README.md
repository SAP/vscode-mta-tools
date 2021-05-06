[![CircleCI](https://circleci.com/gh/SAP/vscode-mta-tools.svg?style=svg)](https://circleci.com/gh/SAP/vscode-mta-tools)
[![Coverage Status](https://coveralls.io/repos/github/SAP/vscode-mta-tools/badge.svg?branch=master)](https://coveralls.io/github/SAP/vscode-mta-tools?branch=master)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/SAP/vscode-mta-tools.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/SAP/vscode-mta-tools/context:javascript)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![dependabot](https://api.dependabot.com/badges/status?host=github&repo=SAP/vscode-mta-tools)](https://dependabot.com/)
[![REUSE status](https://api.reuse.software/badge/github.com/SAP/vscode-mta-tools)](https://api.reuse.software/info/github.com/SAP/vscode-mta-tools)

## Description

The **VS Code Multi-Target Application (MTA) tools** extension is a VS Code extension for development of multi-target applications.
It can be used to build multitarget applications using the [Cloud MTA Build Tool](https://github.com/SAP/cloud-mta-build-tool), to deploy the build result to Cloud Foundry and to create MTA module from template.
The extension is being developed and currently contains limited features.

### Requirements

Make sure that you are familiar with the multi-target application concept and terminology. For background and detailed information, see [Multi-Target Application Model](https://www.sap.com/documents/2016/06/e2f618e4-757c-0010-82c7-eda71af511fa.html).

Make sure the following tools are installed in your environment:

- `GNU Make 4.2.1` or later to build MTA project.
- [Cloud MTA Build Tool](https://github.com/SAP/cloud-mta-build-tool) to build MTA project.
- [Cloud Foundry CLI](https://github.com/cloudfoundry/cli) to work with Cloud Foundry.
- [MultiApps CF CLI Plugin](https://github.com/cloudfoundry-incubator/multiapps-cli-plugin) to deploy MTA archive to Cloud Fountry.
- [MTA tool](https://github.com/SAP/cloud-mta) to add MTA modules.
- [Yeoman-ui extension](https://github.com/SAP/yeoman-ui) to add MTA modules.

### Download and Installation

Import the extension into your Visual Studio Code.
Run `npm install` to install all the needed dependencies.

### Contributing

Contributions are greatly appreciated.
See [CONTRIBUTING.md](https://github.com/SAP/vscode-mta-tools/blob/master/.github/CONTRIBUTING.md) for details.

### Support

Please report [here](https://github.com/SAP/vscode-mta-tools/issues) on any issue.

## Licensing

Please see our [LICENSE](https://github.com/SAP/vscode-mta-tools/LICENSE) for copyright and license information. Detailed information including third-party components and their licensing/copyright information is available via the [REUSE tool](https://api.reuse.software/info/github.com/SAP/vscode-mta-tools).
