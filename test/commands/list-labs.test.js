const assert = require("assert");
const { execFileSync } = require("child_process");
const path = require("path");
const test = require("node:test");

const { makeCourseArchive } = require("../helpers/olx-fixture.cjs");

const binPath = path.join(__dirname, "..", "..", "bin", "run");

test("list-labs prints labs from LTI custom parameters and instructional iframes", () => {
  const fixture = makeCourseArchive();

  try {
    const output = execFileSync(
      process.execPath,
      [binPath, "list-labs", fixture.archivePath],
      { encoding: "utf8" }
    );

    assert.deepStrictEqual(JSON.parse(output), [
      {
        url: "https://example.com/lti-lab.md",
        tool_type: "jupyterlab",
        path: "labs/demo.ipynb",
      },
      {
        url: "https://example.com/instructional-lab",
        tool_type: "instructional-lab",
      },
    ]);
  } finally {
    fixture.cleanup();
  }
});
