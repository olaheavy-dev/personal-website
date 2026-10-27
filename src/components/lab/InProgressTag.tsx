// The only status mark a Lab project carries (information architecture: no Live or Coming soon
// badges). A small outlined pill, so it reads in light and dark without a fill.
export function InProgressTag() {
  return (
    <span className="label-mono inline-block rounded-full border border-border-strong px-2.5 py-1 text-text-secondary">
      In progress
    </span>
  );
}
