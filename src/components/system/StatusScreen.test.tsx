import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { AvatarIllustration } from "@/components/avatar/AvatarIllustration";
import { StatusScreen } from "./StatusScreen";

describe("StatusScreen", () => {
  it("criterion 3: renders one h1 inside main#main, with the eyebrow and lead", () => {
    const { container } = render(
      <StatusScreen eyebrow="Eyebrow" title="The title" lead="The lead." actions={<a href="/">Go</a>} />,
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("The title");
    expect(container.querySelector("main#main")).toBeInTheDocument();
    expect(screen.getByText("Eyebrow")).toBeInTheDocument();
    expect(screen.getByText("The lead.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go" })).toBeInTheDocument();
  });

  it("makes the heading focusable by script only when it is given a ref", () => {
    const { rerender } = render(<StatusScreen eyebrow="e" title="t" lead="l" />);
    expect(screen.getByRole("heading", { level: 1 })).not.toHaveAttribute("tabindex");
    const ref = createRef<HTMLHeadingElement>();
    rerender(<StatusScreen eyebrow="e" title="t" lead="l" headingRef={ref} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveAttribute("tabindex", "-1");
    expect(ref.current).toBe(screen.getByRole("heading", { level: 1 }));
  });
});

describe("AvatarIllustration", () => {
  it("is decorative, and only the lost pose carries the question mark badge", () => {
    const { container, rerender } = render(<AvatarIllustration pose="lost" />);
    expect(container.querySelector("[data-avatar]")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
    expect(container.querySelector("[data-avatar-badge]")).toHaveTextContent("?");
    rerender(<AvatarIllustration pose="wave" />);
    expect(container.querySelector("[data-avatar-badge]")).toBeNull();
  });
});
