import { render, screen } from "@testing-library/react";
import Home from "./page";

describe("Home", () => {
  it("renders the site owner's name as the only main heading", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Sunkanmi Olawuwo");
  });
});
