import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { config } from "@/proxy";
import { toolLogoDir, toolkitGroups, toolkitLogoFiles, toolkitNotices } from "./toolkit";

const tools = toolkitGroups.flatMap((group) => group.tools);

describe("toolkit model", () => {
  it("has the six approved groups, in order", () => {
    expect(toolkitGroups.map((group) => group.name)).toEqual([
      "Languages and frameworks",
      "AI",
      "Data",
      "Cloud and infrastructure",
      "Testing and evaluation",
      "Delivery",
    ]);
  });

  it("lists the 37 approved tools by their official names, group by group", () => {
    expect(toolkitGroups.map((group) => group.tools.map((tool) => tool.name))).toEqual([
      ["C#", ".NET", "Python", "TypeScript", "FastAPI", "React", "Next.js"],
      [
        "Microsoft Foundry",
        "Microsoft Agent Framework",
        "Amazon Bedrock",
        "Claude API",
        "Claude Agent SDK",
        "OpenAI API",
        "LangChain",
        "LangGraph",
        "LangSmith",
      ],
      ["PostgreSQL", "Microsoft SQL Server", "MongoDB", "Redis", "Qdrant"],
      // The AWS chip carries the AWS abbreviation on its plate and the full name as its text.
      ["Microsoft Azure", "Amazon Web Services", "Google Cloud", "Terraform", "Docker", "Cloudflare"],
      ["xUnit", "Reqnroll", "pytest", "Playwright", "Ragas", "Microsoft.Extensions.AI.Evaluation"],
      ["GitHub", "GitHub Actions", "GitLab", "Azure DevOps"],
    ]);
    expect(tools).toHaveLength(37);
  });

  it("never lists a tool, a group or a logo file twice", () => {
    expect(new Set(tools.map((tool) => tool.name)).size).toBe(tools.length);
    expect(new Set(toolkitGroups.map((group) => group.id)).size).toBe(toolkitGroups.length);
    expect(new Set(toolkitLogoFiles).size).toBe(toolkitLogoFiles.length);
  });

  it("gives every tool exactly one plate: an allowed logo, a real abbreviation, or the group icon", () => {
    const logoTools = tools.filter((tool) => tool.plate.kind === "logo").map((tool) => tool.name);
    expect(logoTools).toEqual([
      "C#",
      "Python",
      "TypeScript",
      "FastAPI",
      "React",
      "Next.js",
      "Redis",
      "Qdrant",
      "pytest",
      "GitHub",
    ]);
    const abbreviations = tools.flatMap((tool) =>
      tool.plate.kind === "abbr" ? [[tool.name, tool.plate.text]] : [],
    );
    expect(abbreviations).toEqual([
      ["Amazon Web Services", "AWS"],
      ["Google Cloud", "GCP"],
      ["GitHub Actions", "GHA"],
      ["Azure DevOps", "ADO"],
    ]);
    // .NET's style guide sets a minimum logo size larger than a plate, so it uses the group icon.
    expect(tools.find((tool) => tool.name === ".NET")?.plate).toEqual({ kind: "icon" });
  });

  it("alternates the tint so neighbouring groups differ", () => {
    toolkitGroups.forEach((group, index) => {
      if (index > 0) expect(group.tint).not.toBe(toolkitGroups[index - 1]!.tint);
    });
  });

  it("points every logo at a file that exists, and the proxy matcher lets each one through", () => {
    const pattern = new RegExp(`^${config.matcher[0]}$`);
    expect(toolkitLogoFiles).toHaveLength(10);
    for (const file of toolkitLogoFiles) {
      expect(existsSync(join(process.cwd(), "public", toolLogoDir, file)), file).toBe(true);
      expect(pattern.test(`${toolLogoDir}${file}`), file).toBe(false);
    }
  });

  it("carries every trademark sentence word for word", () => {
    expect(toolkitNotices).toEqual([
      "Logos are trademarks of their owners, shown only to name the tools I use.",
      "Vercel, the Vercel design, Next.js and related marks, designs and logos are trademarks or registered trademarks of Vercel, Inc. or its affiliates in the US and other countries.",
      "Python and the Python logos are trademarks or registered trademarks of the Python Software Foundation.",
      "Redis is a registered trademark of Redis Ltd. Any rights therein are reserved to Redis Ltd.",
    ]);
  });

  it("marks Python with a trademark symbol and Redis with a registered one, and no other tool", () => {
    expect(tools.flatMap((tool) => (tool.mark ? [[tool.name, tool.mark]] : []))).toEqual([
      ["Python", "™"],
      ["Redis", "®"],
    ]);
  });
});
