import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { pinToneClass, RoutePin, type PinTone } from "./RoutePin";

describe("RoutePin", () => {
  it("criterion 5: each tone maps to its own fill and is marked on the pin", () => {
    const tones: PinTone[] = ["start", "default", "current", "end"];
    const classes = new Set<string>();
    for (const tone of tones) {
      const { container, unmount } = render(<RoutePin id={tone} tone={tone} />);
      const pin = container.querySelector<HTMLElement>("[data-route-pin]")!;
      expect(pin.dataset.tone).toBe(tone);
      expect(pin.className).toContain(pinToneClass[tone]);
      classes.add(pinToneClass[tone]);
      unmount();
    }
    expect(classes.size).toBe(4);
    expect(pinToneClass.current).toBe("bg-route-active");
  });

  it("criterion 5: only the end pin has no leg", () => {
    const { container } = render(
      <>
        <RoutePin id="a" />
        <RoutePin id="b" tone="end" />
      </>,
    );
    expect(container.querySelectorAll("[data-route-leg]")).toHaveLength(1);
  });
});
