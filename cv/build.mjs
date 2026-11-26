import { execFileSync } from "node:child_process"
import { copyFileSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const sourceDir = fileURLToPath(new URL(".", import.meta.url))
const assetDir = fileURLToPath(new URL("../src/assets/docs/", import.meta.url))
const outputDir = mkdtempSync(join(tmpdir(), "portfolio-cv-"))
const documents = ["david-barragan-cv-en", "david-barragan-cv-es"]

try {
  for (const document of documents) {
    execFileSync("xelatex", [
      "-halt-on-error",
      "-interaction=nonstopmode",
      "-file-line-error",
      `-output-directory=${outputDir}`,
      `${document}.tex`,
    ], { cwd: sourceDir, stdio: "inherit" })
  }

  for (const document of documents) {
    copyFileSync(join(outputDir, `${document}.pdf`), join(assetDir, `${document}.pdf`))
  }
} catch (error) {
  if (error.code === "ENOENT" && error.path === "xelatex") {
    console.error("Install TeX Live or MiKTeX and add xelatex to PATH.")
  } else {
    console.error(error.message)
  }
  process.exitCode = 1
} finally {
  rmSync(outputDir, { recursive: true, force: true })
}
