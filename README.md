[![CircleCI](https://circleci.com/gh/SAP/vscode-mta-tools.svg?style=svg)](https://circleci.com/gh/SAP/vscode-mta-tools)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![dependabot](https://api.dependabot.com/badges/status?host=github&repo=SAP/vscode-mta-tools)](https://dependabot.com/)

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
- [MTA tool](https://github.com/SAP/cloud-mta) for exploring and validating the multitarget application descriptor.
- [Yeoman-ui extension](https://github.com/SAP/yeoman-ui) to work with wizard.

### Download and Installation

Import the extension into your Visual Studio Code.
Run `npm install` to install all the needed dependencies.

### Contributing

Contributions are greatly appreciated.
See [CONTRIBUTING.md](https://github.com/SAP/vscode-mta-tools/blob/master/.github/CONTRIBUTING.md) for details.

### Support

Please report [here](https://github.com/SAP/vscode-mta-tools/issues) on any issue.

### License

Copyright (c) 2019-2020 SAP SE or an SAP affiliate company. All rights reserved.

This file is licensed under the Apache 2.0 License [except as noted otherwise in the LICENSE file](https://github.com/SAP/vscode-mta-tools/blob/master/LICENSE).
