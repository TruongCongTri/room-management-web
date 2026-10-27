// Regenerates lib/api/generated/schema.d.ts from the API's OpenAPI document.
//   API_SPEC_URL=https://api.example.com/api/docs-json npm run api:types   (default: the local fe-stack API)
import { execFileSync } from "node:child_process";

const spec = process.env.API_SPEC_URL ?? "http://127.0.0.1:5001/api/docs-json";
execFileSync("npx", ["openapi-typescript", spec, "-o", "lib/api/generated/schema.d.ts"], { stdio: "inherit", shell: process.platform === "win32" });
