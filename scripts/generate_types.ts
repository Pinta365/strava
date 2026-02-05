/**
 * Type generation script for Strava API types
 *
 * Uses @pinta365/openapi-typegen to generate TypeScript types from Strava's
 * Swagger spec, with full $ref resolution for external schema references.
 */

import { generateTypes } from "@pinta365/openapi-typegen";

const SWAGGER_URL = "https://developers.strava.com/swagger/swagger.json";
const OUTPUT_FILE = "./src/types/generated.ts";

/**
 * Get indentation configuration from deno.json
 */
function getIndentConfig(): { useTabs: boolean; width?: number } {
    try {
        const denoJson = Deno.readTextFileSync("./deno.json");
        const config = JSON.parse(denoJson);
        const useTabs = config.fmt?.useTabs ?? false;
        return useTabs
            ? { useTabs: true }
            : { useTabs: false, width: config.fmt?.indentWidth ?? 4 };
    } catch {
        return { useTabs: false, width: 4 };
    }
}

async function main(): Promise<void> {
    console.log("Generating types from Swagger spec...");
    await generateTypes(SWAGGER_URL, {
        outputPath: OUTPUT_FILE,
        indent: getIndentConfig()
    });
    // Format to match project style (e.g. line width from deno.json)
    const formatProcess = new Deno.Command(Deno.execPath(), {
        args: ["fmt", OUTPUT_FILE],
        stdout: "piped",
        stderr: "piped",
    });
    const formatResult = await formatProcess.output();
    if (!formatResult.success) {
        console.warn(
            "Warning: Failed to format generated types:",
            new TextDecoder().decode(formatResult.stderr),
        );
    }

    console.log(`Types generated successfully: ${OUTPUT_FILE}`);
}

if (import.meta.main) {
    try {
        await main();
        Deno.exit(0);
    } catch (error) {
        console.error("Error generating types:", error);
        Deno.exit(1);
    }
}
