olx-cli
=======

A command line tool for modifying attributes and content of Open Learning XML (OLX)

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@ibm-skills-network/olx-cli.svg)](https://npmjs.org/package/@ibm-skills-network/olx-cli)
[![Downloads/week](https://img.shields.io/npm/dw/@ibm-skills-network/olx-cli.svg)](https://npmjs.org/package/@ibm-skills-network/olx-cli)
[![License](https://img.shields.io/npm/l/@ibm-skills-network/olx-cli.svg)](https://github.com/ibm-skills-network/olx-cli/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @ibm-skills-network/olx-cli
$ olx-cli COMMAND
running command...
$ olx-cli (-v|--version|version)
@ibm-skills-network/olx-cli/0.1.5 darwin-x64 node-v16.2.0
$ olx-cli --help [COMMAND]
USAGE
  $ olx-cli COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`olx-cli help [COMMAND]`](#olx-cli-help-command)
* [`olx-cli set-course COURSEARCHIVEPATH`](#olx-cli-set-course-coursearchivepath)
* [`olx-cli list-labs COURSEARCHIVEPATH`](#olx-cli-list-labs-coursearchivepath)

## `olx-cli help [COMMAND]`

Display help for olx-cli.

```
USAGE
  $ olx-cli help [COMMAND]

ARGUMENTS
  COMMAND  Command to show help for.

OPTIONS
  -n, --nested-commands  Include all nested commands in the output.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.1.12/src/commands/help.ts)_

## `olx-cli set-course COURSEARCHIVEPATH`

Set course attributes

```
USAGE
  $ olx-cli set-course COURSEARCHIVEPATH

ARGUMENTS
  COURSEARCHIVEPATH  Path to OXL course archive

OPTIONS
  --courseCard=courseCard              path or url to course card image file. PNG, JPG.
  --lti                                enable lti_consumer module

  --ltiPassport=ltiPassport            lti consumer key and secret pair, no speical character is allowed. e.g,
                                       consumer_key:consumer_secret

  --name=name                          course name

  --out=out                            path to output archive

  --overview=overview                  course overview

  --policyXml=policyXml                valid xml string to override course/<url_name>.xml

  --shortDescription=shortDescription  course short description

DESCRIPTION
  Update course attributes of an existing course archive.

EXAMPLE
  $ oxl-cli set-course archive.gz --name "New Course Name"
```

_See code: [src/commands/set-course.js](https://github.com/ibm-skills-network/olx-cli/blob/v0.1.6/src/commands/set-course.js)_

## `olx-cli list-labs COURSEARCHIVEPATH`

List labs attributes

```
USAGE
  $ olx-cli list-labs COURSEARCHIVEPATH

ARGUMENTS
  COURSEARCHIVEPATH  Path to OXL course archive

DESCRIPTION
  Lists all labs found in a course along with their tool types. Labs are found either thorugh lti_consumer xml blocks or iframe tags in html. Output format: json

EXAMPLE
  $ oxl-cli list-labs archive.gz

  sample:
  [
    {
      url: 'https://cf-courses-data.s3.us.cloud-object-storage.appdomain.cloud/IBMDeveloperSkillsNetwork-CB0103EN-SkillsNetwork/labs/Module3/Lab_4_Create_Entities.md.html',
      tool_type: 'theia'
    },
    {
      url: 'https://cf-courses-data.s3.us.cloud-object-storage.appdomain.cloud/IBMDeveloperSkillsNetwork-CB0103EN-SkillsNetwork/labs/Module8/New-Watson-Assistant.md.html',
      tool_type: 'instructional-lab'
    }
  ]
```

_See code: [src/commands/list-labs.js](https://github.com/ibm-skills-network/olx-cli/blob/v0.1.6/src/commands/list-labs.js)_

<!-- commandsstop -->
