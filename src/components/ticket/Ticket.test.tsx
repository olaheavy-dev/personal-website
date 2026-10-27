import { render, screen, within } from "@testing-library/react";
import { Ticket } from "./Ticket";

describe("Ticket", () => {
  it("keeps each part of a string eyebrow on one line, so a wrap only falls between parts", () => {
    const { container } = render(
      <Ticket as="div" eyebrow="Senior Software Engineer · via Deimos · 2022 to 2024" />,
    );
    const label = container.querySelector("p.label-mono")!;
    expect(label.textContent).toBe(
      "Senior\u00a0Software\u00a0Engineer\u00a0· via\u00a0Deimos\u00a0· 2022\u00a0to\u00a02024",
    );
  });

  it("renders every slot in the large stacked layout", () => {
    render(
      <Ticket
        eyebrow="Backend Software Engineer · 2024 to now"
        badge="HBK"
        title="Advantage Insights"
        chips={
          <ul aria-label="Chips">
            <li>RAG</li>
          </ul>
        }
        stub={<p>Stub text</p>}
      >
        <p>Body text</p>
      </Ticket>,
    );
    const ticket = screen.getByRole("article", { name: "Advantage Insights" });
    expect(ticket).toHaveAttribute("data-layout", "stacked");
    expect(ticket).toHaveAttribute("data-size", "large");
    expect(ticket).toHaveAttribute("data-stub");
    expect(within(ticket).getByText("Backend Software Engineer · 2024 to now")).toBeInTheDocument();
    expect(within(ticket).getByText("HBK")).toBeInTheDocument();
    expect(within(ticket).getByRole("heading", { level: 2 })).toHaveTextContent("Advantage Insights");
    expect(within(ticket).getByText("Body text")).toBeInTheDocument();
    expect(within(ticket).getByRole("list", { name: "Chips" })).toBeInTheDocument();
    expect(within(ticket).getByText("Stub text")).toBeInTheDocument();
  });

  it("puts the stub after the body in the pass layout", () => {
    const { container } = render(
      <Ticket as="div" layout="pass" title="Yours?" stub={<p>Stub</p>}>
        <p>Body</p>
      </Ticket>,
    );
    const ticket = container.firstElementChild as HTMLElement;
    expect(ticket.tagName).toBe("DIV");
    expect(ticket).toHaveAttribute("data-layout", "pass");
    expect(ticket.children[0]).toHaveClass("ticket-body");
    expect(ticket.children[1]).toHaveClass("ticket-stub");
  });

  it("does not name a plain div, which would be an invalid label", () => {
    const { container } = render(<Ticket as="div" title="Yours?" />);
    expect(container.firstElementChild).not.toHaveAttribute("aria-labelledby");
  });

  it("uses the given heading level and title id", () => {
    render(<Ticket headingLevel={3} title="Mukuru" titleId="mukuru-title" size="compact" />);
    const heading = screen.getByRole("heading", { level: 3, name: "Mukuru" });
    expect(heading).toHaveAttribute("id", "mukuru-title");
    expect(screen.getByRole("article")).toHaveAttribute("aria-labelledby", "mukuru-title");
  });

  it("drops the stub in the mini size", () => {
    const { container } = render(<Ticket size="mini" title="Galooli" stub={<p>Stub</p>} />);
    expect(screen.queryByText("Stub")).toBeNull();
    expect(container.querySelector(".ticket-stub")).toBeNull();
    expect(container.firstElementChild).not.toHaveAttribute("data-stub");
  });

  it("copes with long and short content without a stub", () => {
    const long = "word ".repeat(400);
    const { rerender } = render(<Ticket title="Long">{long}</Ticket>);
    expect(screen.getByRole("article")).not.toHaveAttribute("data-stub");
    rerender(<Ticket title="Short" stub="Stub" />);
    expect(screen.getByRole("article")).toHaveAttribute("data-stub");
  });

  it("makes exactly one link, named by the title, when href is set", () => {
    render(
      <Ticket title="Optty" href="/work/optty" stub={<a href="https://example.com">Release notes</a>}>
        <p>Body</p>
      </Ticket>,
    );
    expect(screen.getByRole("article")).toHaveAttribute("data-linked");
    const link = screen.getByRole("link", { name: "Optty" });
    expect(link).toHaveAttribute("href", "/work/optty");
    expect(link).toHaveClass("ticket-link");
    // The inner link is separate and still there.
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("has no link without an href", () => {
    render(<Ticket title="Optty" />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByRole("article")).not.toHaveAttribute("data-linked");
  });

  it("records tone and tilt for the styles", () => {
    render(<Ticket as="div" tone="lilac" tilt="back" aria-hidden="true" eyebrow="2022 to 2024" />);
    const ticket = document.querySelector(".ticket");
    expect(ticket).toHaveAttribute("data-tone", "lilac");
    expect(ticket).toHaveAttribute("data-tilt", "back");
  });

  it("does not compile with an href but no title", () => {
    // @ts-expect-error a link needs a title to carry it
    const ticket = <Ticket href="/work/optty" />;
    expect(ticket).toBeTruthy();
  });

  it("marks side notches for a ticket without a stub", () => {
    render(<Ticket as="div" notches="side" eyebrow="2022 to 2024" />);
    expect(document.querySelector(".ticket")).toHaveAttribute("data-notches", "side");
  });
});
