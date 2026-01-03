/**
 * Type generation script for Strava API types
 *
 * Fetches swagger.json from Strava's API and generates TypeScript types
 * with full $ref resolution for external schema references.
 */

const SWAGGER_URL = "https://developers.strava.com/swagger/swagger.json";
const OUTPUT_FILE = "./src/types/generated.ts";

/**
 * Get indentation configuration from deno.json
 */
function getIndentConfig(): { useTabs: boolean; indentWidth: number } {
    try {
        const denoJson = Deno.readTextFileSync("./deno.json");
        const config = JSON.parse(denoJson);
        return {
            useTabs: config.fmt?.useTabs ?? false,
            indentWidth: config.fmt?.indentWidth ?? 4,
        };
    } catch {
        return { useTabs: false, indentWidth: 4 };
    }
}

const INDENT_CONFIG = getIndentConfig();
const INDENT_STRING = INDENT_CONFIG.useTabs ? "\t" : " ".repeat(INDENT_CONFIG.indentWidth);

interface SwaggerSchema {
    type?: string;
    format?: string;
    $ref?: string;
    items?: SwaggerSchema;
    properties?: Record<string, SwaggerSchema>;
    required?: string[];
    enum?: (string | number)[];
    description?: string;
    allOf?: SwaggerSchema[];
    oneOf?: SwaggerSchema[];
    anyOf?: SwaggerSchema[];
}

interface SwaggerSpec {
    definitions?: Record<string, SwaggerSchema>;
    paths?: Record<string, unknown>;
    [key: string]: unknown;
}

// Cache for fetched external schemas
const externalSchemas = new Map<string, Record<string, SwaggerSchema>>();

/**
 * Fetch JSON from URL
 */
async function fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

/**
 * Resolve external $ref URL and cache all schemas from the file
 */
async function _resolveExternalRef(ref: string): Promise<SwaggerSchema> {
    // Format: https://developers.strava.com/swagger/file.json#/SchemaName
    const match = ref.match(/^https:\/\/developers\.strava\.com\/swagger\/([^.]+)\.json#\/(.+)$/);
    if (!match) {
        throw new Error(`Invalid external ref format: ${ref}`);
    }

    const [, fileName, schemaName] = match;
    const schemaUrl = `https://developers.strava.com/swagger/${fileName}.json`;

    // Check cache
    if (!externalSchemas.has(schemaUrl)) {
        console.log(`Fetching external schema: ${schemaUrl}`);
        const schema = await fetchJson<Record<string, SwaggerSchema>>(schemaUrl);
        externalSchemas.set(schemaUrl, schema);
    }

    const schema = externalSchemas.get(schemaUrl)!;
    if (!schema[schemaName]) {
        throw new Error(`Schema ${schemaName} not found in ${schemaUrl}`);
    }

    return schema[schemaName];
}

/**
 * Get all external schema files that need to be fetched
 */
function getExternalSchemaUrls(refs: Set<string>): Set<string> {
    const urls = new Set<string>();
    for (const ref of refs) {
        const match = ref.match(/^https:\/\/developers\.strava\.com\/swagger\/([^.]+)\.json/);
        if (match) {
            urls.add(`https://developers.strava.com/swagger/${match[1]}.json`);
        }
    }
    return urls;
}

/**
 * Convert Swagger type to TypeScript type
 */
function swaggerTypeToTS(schema: SwaggerSchema, definitions: Record<string, SwaggerSchema>): string {
    // Handle $ref
    if (schema.$ref) {
        if (schema.$ref.startsWith("https://")) {
            // External ref - will be resolved separately
            const match = schema.$ref.match(/#\/(.+)$/);
            return match ? toPascalCase(match[1]) : "unknown";
        }
        // Internal ref - handle both #/definitions/ and #/ formats
        if (schema.$ref.startsWith("#/definitions/")) {
            const refName = schema.$ref.replace("#/definitions/", "");
            return toPascalCase(refName);
        }
        if (schema.$ref.startsWith("#/")) {
            const refName = schema.$ref.replace("#/", "");
            return toPascalCase(refName);
        }
        return "unknown";
    }

    // Handle allOf, oneOf, anyOf
    if (schema.allOf) {
        return schema.allOf.map((s) => swaggerTypeToTS(s, definitions)).join(" & ");
    }
    if (schema.oneOf || schema.anyOf) {
        return `(${schema.oneOf || schema.anyOf || []}.map(s => swaggerTypeToTS(s, definitions)).join(' | ')})`;
    }

    // Handle enum
    if (schema.enum) {
        return schema.enum.map((v) => typeof v === "string" ? `"${v}"` : String(v)).join(" | ");
    }

    // Handle array
    if (schema.type === "array" && schema.items) {
        return `${swaggerTypeToTS(schema.items, definitions)}[]`;
    }

    // Handle object
    if (schema.type === "object" || schema.properties) {
        return "object"; // Will be expanded separately
    }

    // Handle primitive types
    switch (schema.type) {
        case "string":
            if (schema.format === "date" || schema.format === "date-time") {
                return "string"; // Keep as string, transformers will convert
            }
            return "string";
        case "integer":
        case "number":
            return schema.format === "int64" ? "number" : "number";
        case "boolean":
            return "boolean";
        case "file":
            return "File | Blob";
        default:
            return "unknown";
    }
}

/**
 * Convert snake_case to camelCase
 */
function toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert to PascalCase
 */
function toPascalCase(str: string): string {
    const camel = toCamelCase(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
}

/**
 * Generate TypeScript interface from schema
 */
function generateInterface(
    name: string,
    schema: SwaggerSchema,
    definitions: Record<string, SwaggerSchema>,
    externalRefs: Map<string, SwaggerSchema>,
): string {
    const lines: string[] = [];
    const description = schema.description ? `/** ${schema.description} */\n` : "";

    // Handle array types - generate type alias instead of interface
    if (schema.type === "array" && schema.items) {
        const itemType = swaggerTypeToTS(schema.items, definitions);
        lines.push(description);
        lines.push(`export type ${name} = ${itemType}[];`);
        return lines.join("\n");
    }

    // Handle allOf (inheritance)
    if (schema.allOf && schema.allOf.length > 0) {
        const baseTypes = schema.allOf
            .filter((s) => s.$ref)
            .map((s) => {
                if (s.$ref?.startsWith("https://")) {
                    const match = s.$ref.match(/#\/(.+)$/);
                    return match ? toPascalCase(match[1]) : "unknown";
                }
                return s.$ref ? toPascalCase(s.$ref.replace("#/definitions/", "")) : "";
            })
            .filter(Boolean);

        const properties = schema.allOf.find((s) => s.properties)?.properties || schema.properties || {};
        const required = schema.allOf.find((s) => s.required)?.required || schema.required || [];

        lines.push(description);
        lines.push(`export interface ${name}${baseTypes.length > 0 ? ` extends ${baseTypes.join(", ")}` : ""} {`);
        lines.push(...generateProperties(properties, required, definitions, externalRefs));
        lines.push("}");
        return lines.join("\n");
    }

    // Regular interface
    const properties = schema.properties || {};
    const required = schema.required || [];

    // Skip empty interfaces (no properties and not extending anything)
    if (Object.keys(properties).length === 0 && !schema.allOf) {
        // Return empty string to skip generation, or generate a type alias
        lines.push(description);
        lines.push(`export type ${name} = Record<string, unknown>;`);
        return lines.join("\n");
    }

    lines.push(description);
    lines.push(`export interface ${name} {`);
    lines.push(...generateProperties(properties, required, definitions, externalRefs));
    lines.push("}");
    return lines.join("\n");
}

/**
 * Generate property definitions
 */
function generateProperties(
    properties: Record<string, SwaggerSchema>,
    required: string[],
    definitions: Record<string, SwaggerSchema>,
    externalRefs: Map<string, SwaggerSchema>,
    indentLevel: number = 1,
): string[] {
    const lines: string[] = [];
    const indent = INDENT_STRING.repeat(indentLevel);

    for (const [key, prop] of Object.entries(properties)) {
        const camelKey = toCamelCase(key);
        const isRequired = required.includes(key);
        const optional = isRequired ? "" : "?";
        const propDescription = prop.description ? `${indent}/** ${prop.description} */\n` : "";

        let type = swaggerTypeToTS(prop, definitions);

        if (prop.$ref?.startsWith("https://")) {
            const match = prop.$ref.match(/#\/(.+)$/);
            if (match) {
                const refName = match[1];
                type = toPascalCase(refName);
            }
        }

        if (prop.$ref && prop.$ref.startsWith("#/") && !prop.$ref.startsWith("#/definitions/")) {
            const refName = prop.$ref.replace("#/", "");
            type = toPascalCase(refName);
        }

        if (type === "object" && prop.properties) {
            const inlineProps = generateProperties(prop.properties, prop.required || [], definitions, externalRefs, indentLevel + 1);
            lines.push(propDescription);
            lines.push(`${indent}${camelKey}${optional}: {`);
            lines.push(...inlineProps);
            lines.push(`${indent}};`);
            continue;
        }

        lines.push(propDescription);
        lines.push(`${indent}${camelKey}${optional}: ${type};`);
    }

    return lines;
}

/**
 * Recursively collect all external references from an object
 */
function collectAllExternalRefs(obj: unknown, refs: Set<string>): void {
    if (typeof obj !== "object" || obj === null) return;

    if (Array.isArray(obj)) {
        obj.forEach((item) => collectAllExternalRefs(item, refs));
        return;
    }

    for (const value of Object.values(obj)) {
        if (typeof value === "object" && value !== null) {
            if ("$ref" in value && typeof value.$ref === "string" && value.$ref.startsWith("https://")) {
                refs.add(value.$ref);
            }
            collectAllExternalRefs(value, refs);
        }
    }
}

/**
 * Resolve all external references in the swagger spec (recursively)
 */
async function resolveExternalRefs(spec: SwaggerSpec): Promise<Map<string, SwaggerSchema>> {
    const allExternalTypes = new Map<string, SwaggerSchema>();
    const refsToResolve = new Set<string>();
    const processedUrls = new Set<string>();

    // Collect all external refs from main spec
    collectAllExternalRefs(spec, refsToResolve);

    // Recursively fetch all external schema files and their nested refs
    const urlsToFetch = new Set<string>();
    const schemaUrls = getExternalSchemaUrls(refsToResolve);
    for (const url of schemaUrls) {
        urlsToFetch.add(url);
    }

    // Recursively fetch all external schema files
    while (urlsToFetch.size > 0) {
        const url = Array.from(urlsToFetch)[0];
        urlsToFetch.delete(url);

        if (processedUrls.has(url)) continue;
        processedUrls.add(url);

        try {
            console.log(`Fetching external schema: ${url}`);
            const schema = await fetchJson<Record<string, SwaggerSchema>>(url);
            externalSchemas.set(url, schema);

            // Collect nested external refs from this schema file
            const nestedRefs = new Set<string>();
            collectAllExternalRefs(schema, nestedRefs);
            for (const ref of nestedRefs) {
                refsToResolve.add(ref);
                const nestedUrls = getExternalSchemaUrls(new Set([ref]));
                for (const nestedUrl of nestedUrls) {
                    if (!processedUrls.has(nestedUrl)) {
                        urlsToFetch.add(nestedUrl);
                    }
                }
            }
        } catch (error) {
            console.warn(`Failed to fetch ${url}:`, error);
        }
    }

    console.log(`Found ${refsToResolve.size} external references to resolve`);

    // Now collect ALL types from all fetched external schema files
    for (const [url, schema] of externalSchemas) {
        for (const [typeName, typeSchema] of Object.entries(schema)) {
            const fullRef = `${url}#/${typeName}`;
            if (!allExternalTypes.has(fullRef)) {
                allExternalTypes.set(fullRef, typeSchema);
            }
        }
    }

    return allExternalTypes;
}

/**
 * Main generation function
 */
async function generateTypes(): Promise<void> {
    console.log("Fetching swagger.json...");
    const spec = await fetchJson<SwaggerSpec>(SWAGGER_URL);

    console.log("Resolving external references...");
    const externalRefs = await resolveExternalRefs(spec);

    const definitions = spec.definitions || {};
    const output: string[] = [];

    output.push("/**");
    output.push(" * Auto-generated TypeScript types from Strava API Swagger specification");
    output.push(" * Generated at: " + new Date().toISOString());
    output.push(" * Source: " + SWAGGER_URL);
    output.push(" * DO NOT EDIT THIS FILE MANUALLY");
    output.push(" */");
    output.push("");

    // Generate types for external refs first
    // Collect all unique type names to avoid duplicates
    // We need to generate ALL types from external schemas, not just directly referenced ones
    const externalTypeNames = new Map<string, { ref: string; schema: SwaggerSchema }>();

    // First, add all types from externalRefs (directly referenced)
    for (const [ref, schema] of externalRefs) {
        const match = ref.match(/#\/(.+)$/);
        if (match) {
            const typeName = toPascalCase(match[1]);
            if (!externalTypeNames.has(typeName)) {
                externalTypeNames.set(typeName, { ref, schema });
            }
        }
    }

    // Also add ALL types from external schema files (even if not directly referenced)
    // This ensures types like ActivityTotal, LatLng, etc. are generated
    for (const [url, schemaFile] of externalSchemas) {
        for (const [typeName, typeSchema] of Object.entries(schemaFile)) {
            const pascalName = toPascalCase(typeName);
            const fullRef = `${url}#/${typeName}`;
            if (!externalTypeNames.has(pascalName)) {
                externalTypeNames.set(pascalName, { ref: fullRef, schema: typeSchema });
            }
        }
    }

    // Generate all external types
    for (const [typeName, { schema }] of externalTypeNames) {
        output.push(generateInterface(typeName, schema, definitions, externalRefs));
        output.push("");
    }

    // Generate types for internal definitions (if any exist in main spec)
    for (const [name, schema] of Object.entries(definitions)) {
        const typeName = toPascalCase(name);
        output.push(generateInterface(typeName, schema, definitions, externalRefs));
        output.push("");
    }

    // Write output
    const content = output.join("\n");
    await Deno.writeTextFile(OUTPUT_FILE, content);

    // Format the generated file to match project style
    const formatProcess = new Deno.Command(Deno.execPath(), {
        args: ["fmt", OUTPUT_FILE],
        stdout: "piped",
        stderr: "piped",
    });
    const formatResult = await formatProcess.output();
    if (!formatResult.success) {
        console.warn("Warning: Failed to format generated types file:", new TextDecoder().decode(formatResult.stderr));
    }

    console.log(`Types generated successfully: ${OUTPUT_FILE}`);
    console.log(`Generated ${Object.keys(definitions).length} internal types and ${externalTypeNames.size} external types`);
}

// Run if executed directly
if (import.meta.main) {
    try {
        await generateTypes();
        Deno.exit(0);
    } catch (error) {
        console.error("Error generating types:", error);
        Deno.exit(1);
    }
}
