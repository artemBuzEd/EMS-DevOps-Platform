// Generates public/silent-check-sso.html at predev/prebuild so the file can't
// drift from the format keycloak-js expects. The document runs inside the
// hidden iframe the SDK creates during check-sso and posts the redirected URL
// back to the app, letting keycloak-js read the auth response WITHOUT a
// full-page redirect on every load.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outFile = join(here, "..", "public", "silent-check-sso.html");

const html = `<!DOCTYPE html>
<html>
  <head><title>Silent SSO check</title></head>
  <body>
    <script>
      parent.postMessage(location.href, location.origin);
    </script>
  </body>
</html>
`;

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, html);
console.log(`[silent-check-sso] generated ${outFile}`);
