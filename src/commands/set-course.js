const { Command, flags } = require("@oclif/command");
const { OXL } = require("../lib/oxl");

class SetCourseCommand extends Command {
  async run() {
    const { flags, args } = this.parse(SetCourseCommand);
    this.oxl = new OXL(args.courseArchivePath);
    this.log(
      `Setting course attributes: ${Object.keys(flags)
        .map((each) => `${each}="${flags[each]}"`)
        .join(", ")}`
    );
    Object.assign(this.oxl, flags);
    if (flags.lti) this.oxl.enablLti();
    if (flags.policyXml) {
      this.oxl._writePolicyXml(flags.policyXml, true);
    }
    this.oxl.save(flags.out);
    this.oxl.cleanup();
  }

  async catch(error) {
    if (this.oxl) {
      this.oxl.cleanup();
    }
    throw error;
  }
}

SetCourseCommand.args = [
  {
    name: "courseArchivePath",
    required: true,
    description: "Path to OXL course archive",
  },
];

SetCourseCommand.description = `Set course attributes

Update course attributes of an existing course archive.
`;

SetCourseCommand.examples = [
  '$ oxl-cli set-course archive.gz --name "New Course Name"',
];

SetCourseCommand.flags = {
  out: flags.string({ description: "path to output archive" }),
  name: flags.string({ description: "course name" }),
  overview: flags.string({ description: "course overview" }),
  shortDescription: flags.string({ description: "course short description" }),
  lti: flags.boolean({ description: "enable lti_consumer module" }),
  ltiPassport: flags.string({
    description:
      "lti consumer key and secret pair, no speical character is allowed. e.g, consumer_key:consumer_secret",
    dependsOn: ["lti"],
  }),
  policyXml: flags.string({
    description: "valid xml string to override course/<url_name>.xml",
  }),
};

module.exports = SetCourseCommand;
