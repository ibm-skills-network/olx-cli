const { Command, flags } = require("@oclif/command");

const { OXL } = require("../lib/oxl");

class ListLabsCommand extends Command {
  async run() {
    const { flags, args } = this.parse(ListLabsCommand);
    this.oxl = new OXL(args.courseArchivePath);
    let labs = this.oxl.labs;
    console.log(labs);
    this.oxl.cleanup();
  }

  async catch(error) {
    if (this.oxl) {
      this.oxl.cleanup();
    }
    throw error;
  }
}

ListLabsCommand.args = [
  {
    name: "courseArchivePath",
    required: true,
    description: "Path to OXL course archive",
  },
];

ListLabsCommand.description = `Returns a list of all labs used in the course along with their tool types`;

ListLabsCommand.examples = [
  '$ oxl-cli list-labs archive.gz',
];

ListLabsCommand.flags = {
};

module.exports = ListLabsCommand;
