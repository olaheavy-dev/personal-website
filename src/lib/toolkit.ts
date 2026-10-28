// The Toolkit section of /work (#10): six groups of tools, 37 in all, owner approved on 27 Oct 2026.
// A typed constant, not a database table: it changes rarely and its logos are files in the
// repository (public/logos/tools/, sources and usage rules in docs/references/logos.md).
//
// Each tool shows one of three plates beside its name:
//   logo: the official logo, unmodified, only where the brand's rules allow it;
//   abbr: a real, established abbreviation (AWS, GCP, GHA, ADO). The chip name is the full name;
//   icon: our own line icon for the group. Never invented initials.

export type ToolkitGroupId = "languages" | "ai" | "data" | "cloud" | "testing" | "delivery";
export type ToolkitTint = "lilac" | "teal";
export type ToolkitIcon = "code" | "ai" | "data" | "cloud" | "test" | "ship";

export type ToolPlate =
  { kind: "logo"; file: string; wordmark?: boolean } | { kind: "abbr"; text: string } | { kind: "icon" };

export interface ToolkitTool {
  /** The owner's official spelling of the tool, shown in the chip. */
  name: string;
  /** A trademark symbol shown after the name where the owner of the brand asks for one. */
  mark?: "™" | "®";
  plate: ToolPlate;
}

export interface ToolkitGroup {
  id: ToolkitGroupId;
  name: string;
  /** Tint of the abbreviation and icon plates; groups alternate so neighbours differ. */
  tint: ToolkitTint;
  icon: ToolkitIcon;
  tools: readonly ToolkitTool[];
}

// `wordmark` is for a logo that is the name itself (Redis): the chip shows the logo alone, on a pill
// plate, with the name as its alt text, so the word is not written twice.
const logo = (name: string, file: string, wordmark = false): ToolkitTool => ({
  name,
  plate: wordmark ? { kind: "logo", file, wordmark } : { kind: "logo", file },
});
const abbr = (name: string, text: string): ToolkitTool => ({ name, plate: { kind: "abbr", text } });
const icon = (name: string): ToolkitTool => ({ name, plate: { kind: "icon" } });

export const toolkitGroups: readonly ToolkitGroup[] = [
  {
    id: "languages",
    name: "Languages and frameworks",
    tint: "lilac",
    icon: "code",
    tools: [
      logo("C#", "csharp.svg"),
      icon(".NET"), // its style guide sets a 50 px minimum for the square logo, larger than a chip plate
      { ...logo("Python", "python.svg"), mark: "™" },
      logo("TypeScript", "typescript.svg"),
      logo("FastAPI", "fastapi.svg"),
      logo("React", "react.svg"),
      logo("Next.js", "nextjs.svg"),
    ],
  },
  {
    id: "ai",
    name: "AI",
    tint: "teal",
    icon: "ai",
    tools: [
      icon("Microsoft Foundry"),
      icon("Microsoft Agent Framework"),
      icon("Amazon Bedrock"),
      icon("Claude API"),
      icon("Claude Agent SDK"),
      icon("OpenAI API"),
      icon("LangChain"),
      icon("LangGraph"),
      icon("LangSmith"),
    ],
  },
  {
    id: "data",
    name: "Data",
    tint: "lilac",
    icon: "data",
    tools: [
      icon("PostgreSQL"),
      icon("Microsoft SQL Server"),
      icon("MongoDB"),
      { ...logo("Redis", "redis.svg", true), mark: "®" },
      logo("Qdrant", "qdrant.svg"),
    ],
  },
  {
    id: "cloud",
    name: "Cloud and infrastructure",
    tint: "teal",
    icon: "cloud",
    tools: [
      icon("Microsoft Azure"),
      abbr("Amazon Web Services", "AWS"),
      abbr("Google Cloud", "GCP"),
      icon("Terraform"),
      icon("Docker"),
      icon("Cloudflare"),
    ],
  },
  {
    id: "testing",
    name: "Testing and evaluation",
    tint: "lilac",
    icon: "test",
    tools: [
      icon("xUnit"),
      icon("Reqnroll"),
      logo("pytest", "pytest.svg"),
      icon("Playwright"),
      icon("Ragas"),
      icon("Microsoft.Extensions.AI.Evaluation"),
    ],
  },
  {
    id: "delivery",
    name: "Delivery",
    tint: "teal",
    icon: "ship",
    tools: [
      logo("GitHub", "github.svg"),
      abbr("GitHub Actions", "GHA"),
      icon("GitLab"),
      abbr("Azure DevOps", "ADO"),
    ],
  },
];

/** Where the logo files live, under public/. */
export const toolLogoDir = "/logos/tools/";

/** Every logo file the toolkit uses, so tests and the proxy matcher can check them. */
export const toolkitLogoFiles: string[] = toolkitGroups.flatMap((group) =>
  group.tools.flatMap((tool) => (tool.plate.kind === "logo" ? [tool.plate.file] : [])),
);

/**
 * Trademark notices the logos call for. Vercel asks for its sentence word for word wherever
 * its marks appear (vercel.com/geist/brands, read 27 Oct 2026); Redis asks for its sentence on
 * each page that names it (redis.io/legal/trademark-policy); the PSF asks for a legal statement
 * about the Python logos (python.org/psf/trademarks).
 */
export const toolkitNotices = [
  "Names and logos are trademarks of their owners, shown only to name the tools I use.",
  "Vercel, the Vercel design, Next.js and related marks, designs and logos are trademarks or registered trademarks of Vercel, Inc. or its affiliates in the US and other countries.",
  "Python and the Python logos are trademarks or registered trademarks of the Python Software Foundation.",
  "Redis is a registered trademark of Redis Ltd. Any rights therein are reserved to Redis Ltd.",
] as const;
