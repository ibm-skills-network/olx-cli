const assert = require("assert");
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const test = require("node:test");

const { OXL } = require("../../src/lib/oxl");
const { makeCourseArchive } = require("../helpers/olx-fixture.cjs");

const binPath = path.join(__dirname, "..", "..", "bin", "run");

function runSetCourse(args) {
  return execFileSync(process.execPath, [binPath, "set-course", ...args], {
    encoding: "utf8",
  });
}

function withOxl(archivePath, callback) {
  const course = new OXL(archivePath);

  try {
    callback(course);
  } finally {
    course.cleanup();
  }
}

test("set-course writes course name and start date to a new archive", () => {
  const fixture = makeCourseArchive();
  const outPath = path.join(fixture.tmpDir, "updated-course.tar.gz");

  try {
    runSetCourse(
      [
        fixture.archivePath,
        "--out",
        outPath,
        "--name",
        "Updated Course",
        "--startDate",
        "2030-01-01T00:00:00Z",
      ]
    );

    withOxl(outPath, (updatedCourse) => {
      const policyJson = updatedCourse._readPolicyJson();
      const policyXml = updatedCourse._readPolicyXml();

      assert.strictEqual(
        policyJson["course/test-run"].display_name,
        "Updated Course"
      );
      assert.strictEqual(
        policyJson["course/test-run"].start,
        "2030-01-01T00:00:00Z"
      );
      assert.strictEqual(
        policyXml.elements[0].attributes.display_name,
        "Updated Course"
      );
      assert.strictEqual(
        policyXml.elements[0].attributes.start,
        "2030-01-01T00:00:00Z"
      );
    });
  } finally {
    fixture.cleanup();
  }
});

test("set-course writes overview and short description files", () => {
  const fixture = makeCourseArchive();
  const outPath = path.join(fixture.tmpDir, "updated-content.tar.gz");

  try {
    runSetCourse([
      fixture.archivePath,
      "--out",
      outPath,
      "--overview",
      "<p>Updated overview</p>",
      "--shortDescription",
      "Updated short description",
    ]);

    withOxl(outPath, (updatedCourse) => {
      assert.strictEqual(
        fs.readFileSync(
          path.join(
            updatedCourse.extracedContentRoot,
            "about",
            "overview.html"
          ),
          "utf8"
        ),
        "<p>Updated overview</p>"
      );
      assert.strictEqual(
        fs.readFileSync(
          path.join(
            updatedCourse.extracedContentRoot,
            "about",
            "short_description.html"
          ),
          "utf8"
        ),
        "Updated short description"
      );
    });
  } finally {
    fixture.cleanup();
  }
});

test("set-course updates minimum passing grade", () => {
  const fixture = makeCourseArchive();
  const outPath = path.join(fixture.tmpDir, "updated-grade.tar.gz");

  try {
    runSetCourse([
      fixture.archivePath,
      "--out",
      outPath,
      "--minPassingGrade",
      "75",
    ]);

    withOxl(outPath, (updatedCourse) => {
      const gradingPolicy = JSON.parse(
        fs.readFileSync(
          path.join(
            updatedCourse.extracedContentRoot,
            "policies",
            "test-run",
            "grading_policy.json"
          )
        )
      );

      assert.strictEqual(gradingPolicy.GRADE_CUTOFFS.Pass, 0.75);
    });
  } finally {
    fixture.cleanup();
  }
});

test("set-course writes raw policy XML when policyXml is provided", () => {
  const fixture = makeCourseArchive();
  const outPath = path.join(fixture.tmpDir, "updated-policy.tar.gz");
  const policyXml = `<course display_name="Raw XML Course" start="2040-01-01T00:00:00Z" />`;

  try {
    runSetCourse([
      fixture.archivePath,
      "--out",
      outPath,
      "--policyXml",
      policyXml,
    ]);

    withOxl(outPath, (updatedCourse) => {
      assert.strictEqual(
        fs.readFileSync(updatedCourse.policyXmlPath, "utf8"),
        policyXml
      );
    });
  } finally {
    fixture.cleanup();
  }
});

test("set-course help documents common course update flags", () => {
  const output = execFileSync(
    process.execPath,
    [binPath, "set-course", "--help"],
    { encoding: "utf8" }
  );

  assert.match(output, /--name=name/);
  assert.match(output, /--startDate=startDate/);
  assert.match(output, /--minPassingGrade=minPassingGrade/);
  assert.match(output, /--policyXml=policyXml/);
});
