olx-cli
=======

A command line tool for Open Learning XML

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
@ibm-skills-network/olx-cli/0.1.0-alpha.6 darwin-x64 node-v14.17.0
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

## `olx-cli help [COMMAND]`

display help for olx-cli

```
USAGE
  $ olx-cli help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.2/src/commands/help.ts)_

## `olx-cli set-course COURSEARCHIVEPATH`

Set course attributes

```
USAGE
  $ olx-cli set-course COURSEARCHIVEPATH

ARGUMENTS
  COURSEARCHIVEPATH  Path to OXL course archive

OPTIONS
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

_See code: [src/commands/set-course.js](https://github.com/ibm-skills-network/olx-cli/blob/v0.1.0-alpha.6/src/commands/set-course.js)_
<!-- commandsstop -->
