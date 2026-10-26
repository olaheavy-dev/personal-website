import { LabMiniCard } from "@/components/home/LabMiniCard";
import { SectionLabel } from "@/components/home/SectionLabel";
import { getFlags } from "@/lib/db/queries/flags";
import { getLabProjects } from "@/lib/db/queries/lab";
import { getViewer } from "@/lib/flags/visibility";
import { buildHomeTwoUp, type HomeTwoUpModel } from "@/lib/home/two-up";

// Home section 5: the Lab strip and Latest writing side by side (issue #9). Each half sits
// behind its own page flag. One half hidden means the other spans the full width, both hidden
// means no section at all. The Writing half stays empty until #14 brings posts, so today the
// Lab half spans. The Lab copy lives in the database (lab_projects.summary).

const link = "group inline-flex min-h-11 items-center gap-1.5 font-medium text-lilac-text";

function MoreLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <p className="mt-4">
      <a href={href} className={link}>
        <span className="underline decoration-1 underline-offset-4 group-hover:no-underline">{children}</span>
        <span aria-hidden="true">&rarr;</span>
      </a>
    </p>
  );
}

export function HomeTwoUpView({ model }: { model: HomeTwoUpModel }) {
  const { lab, writing } = model;
  if (!lab && !writing) return null;
  const both = Boolean(lab && writing);

  return (
    <div
      id="lab-writing"
      className={`mx-auto grid w-full max-w-wide gap-(--section-gap) px-(--gutter) ${both ? "lg:grid-cols-2" : ""}`.trim()}
    >
      {lab ? (
        <section id="lab-strip" aria-labelledby="lab-strip-title">
          <SectionLabel id="lab-strip-title">In the lab</SectionLabel>
          <ul role="list" className={`mt-6 grid gap-6 ${both ? "" : "md:grid-cols-2 lg:grid-cols-3"}`.trim()}>
            {lab.cards.map((card, index) => (
              <li
                key={card.slug}
                className={`flex ${both ? "" : "md:odd:last:col-span-2 lg:odd:last:col-span-1"}`.trim()}
              >
                <LabMiniCard card={card} index={index} />
              </li>
            ))}
          </ul>
          {lab.moreLink ? <MoreLink href={lab.moreLink}>See the whole lab</MoreLink> : null}
        </section>
      ) : null}
      {writing ? (
        <section id="latest-writing" aria-labelledby="latest-writing-title">
          <SectionLabel id="latest-writing-title">Latest writing</SectionLabel>
          <ul role="list" className="mt-6 grid gap-2">
            {writing.posts.map((post) => (
              <li key={post.slug}>
                <a href={post.href} className={link}>
                  <span className="underline decoration-1 underline-offset-4 group-hover:no-underline">
                    {post.title}
                  </span>
                </a>
              </li>
            ))}
          </ul>
          {writing.moreLink ? <MoreLink href={writing.moreLink}>All writing</MoreLink> : null}
        </section>
      ) : null}
    </div>
  );
}

export async function HomeTwoUp() {
  const [labProjects, flags, viewer] = await Promise.all([getLabProjects(), getFlags(), getViewer()]);
  return <HomeTwoUpView model={buildHomeTwoUp(labProjects, flags, viewer)} />;
}
