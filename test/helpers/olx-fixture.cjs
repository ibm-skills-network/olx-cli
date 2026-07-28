const fs = require("fs");
const os = require("os");
const path = require("path");

const tar = require("tar");

function makeCourseArchive() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "olx-cli-test-"));
  const courseRoot = path.join(tmpDir, "course");
  const run = "test-run";

  fs.mkdirSync(path.join(courseRoot, "about"), { recursive: true });
  fs.mkdirSync(path.join(courseRoot, "course"), { recursive: true });
  fs.mkdirSync(path.join(courseRoot, "html"), { recursive: true });
  fs.mkdirSync(path.join(courseRoot, "policies", run), { recursive: true });
  fs.mkdirSync(path.join(courseRoot, "vertical"), { recursive: true });

  fs.writeFileSync(
    path.join(courseRoot, "course.xml"),
    `<course org="TEST" course="CLI101" url_name="${run}" />`
  );
  fs.writeFileSync(
    path.join(courseRoot, "course", `${run}.xml`),
    `<course display_name="Original Course" start="2026-01-01T00:00:00Z" advanced_modules="[]" />`
  );
  fs.writeFileSync(
    path.join(courseRoot, "policies", run, "policy.json"),
    JSON.stringify(
      {
        [`course/${run}`]: {
          advanced_modules: [],
          display_name: "Original Course",
          start: "2026-01-01T00:00:00Z",
        },
      },
      null,
      2
    )
  );
  fs.writeFileSync(
    path.join(courseRoot, "policies", run, "grading_policy.json"),
    JSON.stringify({ GRADE_CUTOFFS: { Pass: 0.5 } }, null, 2)
  );
  fs.writeFileSync(
    path.join(courseRoot, "policies", "assets.json"),
    JSON.stringify({}, null, 2)
  );
  fs.writeFileSync(
    path.join(courseRoot, "about", "overview.html"),
    "Original overview"
  );
  fs.writeFileSync(
    path.join(courseRoot, "about", "short_description.html"),
    "Original short description"
  );
  fs.writeFileSync(
    path.join(courseRoot, "vertical", "lab.xml"),
    `<vertical><lti_consumer custom_parameters='["url=https://example.com/lti-lab.md","tool=jupyterlab","path=labs/demo.ipynb"]' /></vertical>`
  );
  fs.writeFileSync(
    path.join(courseRoot, "html", "instructional.html"),
    `<p>Lab</p><iframe src="https://example.com/instructional-lab"></iframe>`
  );

  const archivePath = path.join(tmpDir, "course.tar.gz");
  tar.create({ cwd: tmpDir, file: archivePath, gzip: true, sync: true }, [
    "course",
  ]);

  return {
    archivePath,
    cleanup: () => fs.rmSync(tmpDir, { force: true, recursive: true }),
    tmpDir,
  };
}

module.exports = {
  makeCourseArchive,
};
