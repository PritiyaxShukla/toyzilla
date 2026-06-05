export const metadata = {
  title: "Our Story — Toyzilla",
  description:
    "Toyzilla is India's friendliest toy store, on a mission to bring safe, joyful play to every child.",
};

const VALUES = [
  { icon: "🛡️", title: "Safety first", desc: "Every toy is tested and certified kid-safe and non-toxic." },
  { icon: "🌱", title: "Sustainably minded", desc: "We favour wooden and recyclable toys wherever we can." },
  { icon: "💛", title: "Made for joy", desc: "If it doesn't spark a smile, it doesn't make our shelves." },
];

export default function AboutPage() {
  return (
    <div className="container-x py-10 animate-fade-in max-w-4xl">
      <span className="chip">Our Story</span>
      <h1 className="font-display text-3xl font-bold text-ink mt-3">
        Big imaginations start with great toys 🦖
      </h1>
      <p className="text-gray-600 mt-4 leading-relaxed">
        Toyzilla started in 2024 with a simple idea: every child deserves toys that
        are safe, fun, and built to last. What began as a small shelf of wooden
        trains has grown into India&apos;s friendliest online toy store, delivering
        smiles to thousands of homes across the country.
      </p>
      <p className="text-gray-600 mt-4 leading-relaxed">
        We hand-pick every product, test it for safety, and obsess over the little
        details — because play is serious business when you&apos;re three years old.
      </p>

      <div className="grid sm:grid-cols-3 gap-4 mt-10">
        {VALUES.map((v) => (
          <div key={v.title} className="card p-5">
            <span className="text-3xl">{v.icon}</span>
            <h3 className="font-display font-semibold text-ink mt-2">{v.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{v.desc}</p>
          </div>
        ))}
      </div>

      <section id="careers" className="mt-12 card p-8">
        <h2 className="section-title">Careers at Toyzilla</h2>
        <p className="text-gray-600 mt-3 leading-relaxed">
          We&apos;re a small, playful team that takes childhood seriously. We&apos;re
          not actively hiring right now, but we always love meeting curious,
          kind-hearted people. Drop us a line at{" "}
          <a href="mailto:careers@toyzilla.example" className="text-brand-600 font-medium">
            careers@toyzilla.example
          </a>{" "}
          and tell us what you&apos;d build.
        </p>
      </section>
    </div>
  );
}
