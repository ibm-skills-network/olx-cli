const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const stream = require("stream");
const { PassThrough } = require("stream");
const { promisify } = require("util");
const pipeline = promisify(stream.pipeline);

const { Command, flags } = require("@oclif/command");
const got = require("got");
const FileType = require("file-type");

const { OXL } = require("../lib/oxl");

class SetCourseCommand extends Command {
  async run() {
    const { flags, args } = this.parse(SetCourseCommand);
    this.oxl = new OXL(args.courseArchivePath);
    if (flags.courseCard && flags.courseCard.startsWith("http")) {
      const destPath = await downloadRemoteCourseCard(flags.courseCard);
      console.log(`Downloaded image at ${destPath}`);
      flags.courseCard = destPath;
    }
    this.log(
      `Setting course attributes: ${Object.keys(flags)
        .map((each) => `${each}="${flags[each]}"`)
        .join(", ")}`
    );
    Object.assign(this.oxl, flags);
    if (flags.lti) this.oxl.enableLti();
    if (flags.policyXml) {
      this.oxl._writePolicyXml(flags.policyXml, true);
    }
    if (flags.startDate) {
      this.oxl.setStartDate(flags.startDate);
    }
    if (flags.certificate !== undefined)
      this.oxl.toggleCertificate(flags.certificate);
    if (flags.addSignatory && flags.addSignatory.length > 0) {
      const parsedSignatories = flags.addSignatory.map((entry) => {
        const obj = {};
        entry.split(",").forEach((pair) => {
          const [key, value] = pair
            .split("=")
            .map((x) => x.trim().replace(/^"|"$/g, ""));
          obj[key] = value;
        });
        return obj;
      });

      this.oxl.addSignatoryToCertificate(parsedSignatories);
    }
    if (flags.graderMinCount && flags.graderMinCount.length > 0) {
      const parsedMinCounts = flags.graderMinCount.map((entry) => {
        const obj = {};
        entry.split(",").forEach((pair) => {
          const [key, value] = pair
            .split("=")
            .map((x) => x.trim().replace(/^"|"$/g, ""));
          obj[key] = value;
        });
        return obj;
      });

      this.oxl.setMinCount(parsedMinCounts);
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

async function downloadRemoteCourseCard(url) {
  const tmpDir = path.join(
    "/tmp",
    crypto.randomBytes(64).toString("hex").slice(0, 24)
  );
  fs.mkdirSync(tmpDir, { recursive: true });
  const downloadStream = got.stream(url).pipe(new PassThrough());
  const fileTypeStream = await FileType.stream(downloadStream);
  const destPath = path.join(
    tmpDir,
    `course_card.${fileTypeStream.fileType.ext}`
  );
  const writeStream = fs.createWriteStream(destPath);
  await pipeline(fileTypeStream, writeStream);
  return destPath;
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
  '$ olx-cli set-course archive.gz --graderMinCount="value=1,grader=0"',
];

SetCourseCommand.flags = {
  out: flags.string({ description: "path to output archive" }),
  name: flags.string({ description: "course name" }),
  overview: flags.string({ description: "course overview" }),
  shortDescription: flags.string({ description: "course short description" }),
  startDate: flags.string({ description: "course start date" }),
  minPassingGrade: flags.string({
    description: "minimum passing grade as an integer",
  }),
  graderMinCount: flags.string({
    description:
      'set min_count on a GRADER entry (format: value=<non-negative integer>,grader=<0-based index>). grader defaults to 0. Repeatable to target multiple graders, e.g. --graderMinCount="value=3,grader=0"',
    multiple: true,
  }),
  lti: flags.boolean({ description: "enable lti_consumer module" }),
  ltiPassport: flags.string({
    description:
      "lti consumer key and secret pair, no speical character is allowed. e.g, consumer_key:consumer_secret",
    dependsOn: ["lti"],
  }),
  policyXml: flags.string({
    description: "valid xml string to override course/<url_name>.xml",
  }),
  courseCard: flags.string({
    description: "path or url to course card image file. PNG, JPG.",
  }),
  certificate: flags.boolean({
    description: "enable certificate",
    allowNo: true,
  }),
  addSignatory: flags.string({
    description:
      'Add a certificate signatory (format: name="X",title="Y",organization="Z",signature="/path/to/file.png")',
    multiple: true,
  }),
};

module.exports = SetCourseCommand;
