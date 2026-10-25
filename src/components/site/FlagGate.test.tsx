import { render, screen } from "@testing-library/react";
import { getFlags } from "@/lib/db/queries/flags";
import { FlagGate } from "./FlagGate";

vi.mock("@/lib/db/queries/flags", () => ({ getFlags: vi.fn() }));

// FlagGate is an async server component: await it to get the element it returns.
async function renderGate(flags: Record<string, "on" | "off" | "preview">, fallback?: React.ReactNode) {
  vi.mocked(getFlags).mockResolvedValue(flags);
  const element = await FlagGate({ flag: "page.lab", fallback, children: <p>Lab strip</p> });
  return render(<>{element}</>);
}

describe("FlagGate", () => {
  it("renders its children when the flag is on", async () => {
    await renderGate({ "page.lab": "on" });
    expect(screen.getByText("Lab strip")).toBeInTheDocument();
  });

  it.each([["off"], ["preview"]] as const)(
    "renders nothing, no wrapper, when the flag is %s",
    async (state) => {
      const { container } = await renderGate({ "page.lab": state });
      expect(container).toBeEmptyDOMElement();
    },
  );

  it("renders nothing when the flag is missing", async () => {
    const { container } = await renderGate({});
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the fallback when given one", async () => {
    await renderGate({}, <p>Nothing here yet</p>);
    expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
    expect(screen.queryByText("Lab strip")).toBeNull();
  });
});
