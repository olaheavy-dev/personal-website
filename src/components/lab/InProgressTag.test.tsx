import { render, screen } from "@testing-library/react";
import { InProgressTag } from "./InProgressTag";

describe("InProgressTag", () => {
  it("says In progress in text, with no role or status colour of its own", () => {
    render(<InProgressTag />);
    expect(screen.getByText("In progress")).toBeInTheDocument();
  });
});
