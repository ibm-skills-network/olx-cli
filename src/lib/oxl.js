const fs = require("fs");
const path = require("path");
const tar = require("tar");
const xml = require("xml-js");
const glob = require("glob");
const mime = require("mime-types");
const crypto = require("crypto");

const CWD = "/tmp/oxl";

class OXL {
  /**
   *
   * @param {string} path - Path to the OXL tar.gz file
   */
  constructor(archivePath) {
    this.path = archivePath;
    const buf = crypto.randomBytes(256);
    this.cwd = path.join(
      CWD,
      buf.toString("hex").slice(0, 12),
      path.basename(this.path)
    );
    this.extracedContentRoot = path.join(this.cwd, "course");
    fs.mkdirSync(this.cwd, { recursive: true });
    tar.extract({
      file: this.path,
      cwd: this.cwd,
      sync: true,
    });
    this._parseCourseInfo();
  }

  /**
   * Get all vertical
   */
  get verticals() {
    const verticalDir = path.join(this.extracedContentRoot, "vertical");
    const verticalXmlPathList = glob.sync(`${verticalDir}/**.xml`);
    const verticalList = verticalXmlPathList.map((each) => {
      const rawContent = fs.readFileSync(each);
      return xml.xml2js(rawContent);
    });
    return verticalList;
  }

  /**
   * Rename the course
   *
   * To rename a course, things below need to be changed
   * - `course/${url_name}.xml` display_name attribute
   * - `policies/${url_name}/policy.json` display_name attribute
   *
   * @param {string} value - New name of the course
   */
  set name(value) {
    const courseCourseUrlNameXmlPath = path.join(
      this.extracedContentRoot,
      "course",
      `${this.courseXml.url_name}.xml`
    );
    const courseCourseUrlNameXmlRawContent = fs.readFileSync(
      courseCourseUrlNameXmlPath
    );
    const courseCourseUrlNameXml = xml.xml2js(courseCourseUrlNameXmlRawContent);
    courseCourseUrlNameXml.elements[0].attributes.display_name = value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
    fs.writeFileSync(
      courseCourseUrlNameXmlPath,
      xml.js2xml(courseCourseUrlNameXml)
    );

    const policyJsonPath = path.join(
      this.extracedContentRoot,
      "policies",
      this.courseXml.url_name,
      "policy.json"
    );
    const policyJsonRawContent = fs.readFileSync(policyJsonPath);
    const policyJson = JSON.parse(policyJsonRawContent);
    policyJson[`course/${this.courseXml.url_name}`].display_name = value;
    fs.writeFileSync(policyJsonPath, JSON.stringify(policyJson, null, 4));
  }

  set overview(value) {
    const overviewHtmlPath = path.join(
      this.extracedContentRoot,
      "about",
      "overview.html"
    );
    fs.writeFileSync(overviewHtmlPath, value);
  }

  set shortDescription(value) {
    const shortDescriptionHtmlPath = path.join(
      this.extracedContentRoot,
      "about",
      "short_description.html"
    );
    fs.writeFileSync(shortDescriptionHtmlPath, value);
  }

  enablLti() {
    const policyJson = this._readPolicyJson();
    const policyXml = this._readPolicyXml();

    if (
      !policyJson[
        `course/${this.courseXml.url_name}`
      ].advanced_modules.includes("lti_consumer")
    ) {
      policyJson[`course/${this.courseXml.url_name}`].advanced_modules.push(
        "lti_consumer"
      );
    }
    if (
      !policyXml.elements[0].attributes.advanced_modules.includes(
        "lti_consumer"
      )
    ) {
      policyXml.elements[0].attributes.advanced_modules.push("lti_consumer");
    }

    this._writePolicyJson(policyJson);
    this._writePolicyXml(policyXml);
  }

  addStaticAsset(file) {
    // save static asset into `static/` dir
    const filename = path.posix.basename(file);
    const normalized_filename = filename.replace(/[^a-zA-Z0-9-_.]/g, "_");
    fs.copyFileSync(file, path.join(this.staticDirPath, normalized_filename));

    // create a new entry in asset policy file
    const static_asset_filename = `asset-v1:${this.organization}+${this.code}+${this.run}+type@asset+block@${normalized_filename}`;
    const assetPolicy = this._readAssetPolicyJson();
    assetPolicy[normalized_filename] = {
      contentType: mime.lookup(normalized_filename),
      displayname: filename,
      filename: static_asset_filename,
      import_path: null,
      locked: false,
    };
    this._writeAssetPolicyJson(assetPolicy);
    return normalized_filename;
  }

  set courseCard(imagePath) {
    // save image
    const assetName = this.addStaticAsset(imagePath);
    // modify `course_image` attribute in `policies/<url_name>/policy.json` and point to the added image
    const policyJson = this._readPolicyJson();
    policyJson[`course/${this.courseXml.url_name}`]["course_image"] = assetName;
    this._writePolicyJson(policyJson);
  }

  set ltiPassport(value) {
    const policyJson = this._readPolicyJson();
    const policyXml = this._readPolicyXml();

    policyJson[`course/${this.courseXml.url_name}`].lti_passports = [
      `sn_lti:${value}`,
    ];
    policyXml.elements[0].attributes.lti_passports = [`sn_lti:${value}`];

    this._writePolicyJson(policyJson);
    this._writePolicyXml(policyXml);
  }

  /**
   * Persist the change
   */
  save(dest = null) {
    if (dest) {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
    }
    tar.create(
      {
        gzip: true,
        file: dest || this.path,
        cwd: this.cwd,
        sync: true,
      },
      ["course"]
    );
  }

  /**
   *
   */
  cleanup() {
    fs.rmSync(this.cwd, { recursive: true, force: true });
  }

  _parseCourseInfo() {
    const courseXmlFileRawContent = fs.readFileSync(
      path.join(this.extracedContentRoot, "course.xml")
    );
    const courseXmlFile = xml.xml2js(courseXmlFileRawContent);
    this.courseXml = courseXmlFile.elements[0].attributes;
  }

  _readPolicyXml() {
    const policyXmlRawContent = fs.readFileSync(this.policyXmlPath);
    return xml.xml2js(policyXmlRawContent);
  }

  _readPolicyJson() {
    const policyJsonRawContent = fs.readFileSync(this.policyJsonPath);
    return JSON.parse(policyJsonRawContent);
  }

  _writePolicyXml(content, raw = false) {
    if (raw) {
      fs.writeFileSync(this.policyXmlPath, content);
    } else {
      fs.writeFileSync(this.policyXmlPath, xml.js2xml(content));
    }
  }

  _writePolicyJson(content) {
    fs.writeFileSync(this.policyJsonPath, JSON.stringify(content, null, 4));
  }

  _readAssetPolicyJson() {
    const assetPolicyJsonRawContent = fs.readFileSync(this.assetPolicyJsonPath);
    return JSON.parse(assetPolicyJsonRawContent);
  }

  _writeAssetPolicyJson(content) {
    fs.writeFileSync(
      this.assetPolicyJsonPath,
      JSON.stringify(content, null, 4)
    );
  }

  get staticDirPath() {
    return path.join(this.extracedContentRoot, "static");
  }

  get policyXmlPath() {
    return path.join(
      this.extracedContentRoot,
      "course",
      `${this.courseXml.url_name}.xml`
    );
  }

  get policyJsonPath() {
    return path.join(
      this.extracedContentRoot,
      "policies",
      this.courseXml.url_name,
      "policy.json"
    );
  }

  get assetPolicyJsonPath() {
    return path.join(this.extracedContentRoot, "policies", "assets.json");
  }

  get organization() {
    return this.courseXml.org;
  }

  get code() {
    return this.courseXml.course;
  }

  get run() {
    return this.courseXml.url_name;
  }
}

module.exports = {
  OXL,
};
