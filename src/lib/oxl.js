const fs = require("fs");
const path = require("path");
const tar = require("tar");
const xml = require("@ibm-skills-network/xml-js");
const glob = require("glob");
const mime = require("mime-types");
const crypto = require("crypto");
const cheerio = require('cheerio');
const { match } = require("assert");

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

  get htmls() {
    const htmlDir = path.join(this.extracedContentRoot, "html");
    const htmlPathList = glob.sync(`${htmlDir}/**.html`);
    const htmlList = htmlPathList.map((each) => {
      const content = fs.readFileSync(each, 'utf8');
      return content
    });
    return htmlList;
  }

  /**
   * Get all Labs mapped to their tool types
   */
  get labs() {
    const tool_keys = ["sn_labs_tool", "tool"];
    const url_keys = [
            "sn_asset_library_instructions_url",
            "sn_asset_library_notebook_url",
            "url",
            "instruction_url",
    ];
    const path_keys = ["sn_labs_filepath", "path"];
    const verticalList = this.verticals;
    const htmlList = this.htmls;
    let labs = [];

    function findLtiLabs(elements) {
      elements.forEach(e => {
        if (e.name == "lti_consumer" && e.attributes.custom_parameters) {
          let parsedValues = {};
          JSON.parse(e.attributes.custom_parameters).forEach(item => {
            // Split the item into key and value using "=" as the separator
            const index_of_equal = item.indexOf("=");
            const key = item.slice(0, index_of_equal);
            const value = item.slice(index_of_equal + 1);

            // Add the parsed value to the object
            parsedValues[key] = value;
          });
          let labObj = {
            url: parsedValues[url_keys.find(key => Object.keys(parsedValues).includes(key))] || '',
            tool_type: parsedValues[tool_keys.find(key => Object.keys(parsedValues).includes(key))] || '',
            path: parsedValues[path_keys.find(key => Object.keys(parsedValues).includes(key))] || ''
          };
          if (parsedValues["next"]) {
            if (labObj.url === '') {
              let index_of_url = parsedValues["next"].indexOf("md_instructions_url=")
              if (index_of_url !== -1) {
                labObj.url = parsedValues["next"].substring(index_of_url + "md_instructions_url=".length)
              }
            }
            if (labObj.tool_type === '') {
              let tool_match = parsedValues["next"].match(/tools\/([^\/?]+)/)
              if (tool_match) {
                labObj.tool_type = tool_match[1]
              }
            }
          }
          let index_of_url = labObj.url.indexOf("md_instructions_url=")
          if (index_of_url !== -1) {
            labObj.url = labObj.url.substring(index_of_url + "md_instructions_url=".length)
          }
          if (labObj.url !== '' && labObj.tool_type !== '') {
            labs.push(labObj);
          }
        }
        if (e.elements) findLtiLabs(e.elements)
      });
    }
    function findInstructionalLabs(documents) {
      const iframeUrls = [];
      documents.forEach(doc => {
        const $ = cheerio.load(doc);

        $('iframe').each((i, iframe) => {
          const src = $(iframe).attr('src');
          iframeUrls.push(src);
        });
      });
      iframeUrls.forEach(url => {
        labs.push({
          url: url,
          tool_type: "instructional-lab"
        });
      });
    }
    findLtiLabs(verticalList);
    findInstructionalLabs(htmlList)
    return labs;
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
    courseCourseUrlNameXml.elements[0].attributes.display_name = value;
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

  setStartDate(startDate) {
    const policyJson = this._readPolicyJson();
    const policyXml = this._readPolicyXml();

    policyJson[`course/${this.courseXml.url_name}`].start = startDate;
    policyXml.elements[0].attributes.start = startDate;

    this._writePolicyJson(policyJson);
    this._writePolicyXml(policyXml);
  }

  addStaticAsset(file) {
    if (!fs.existsSync(this.staticDirPath)) {
      fs.mkdirSync(this.staticDirPath, { recursive: true });
    }
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
