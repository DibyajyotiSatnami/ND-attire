import { site } from "@/config/site";

export const STEPS = [
  {
    title: "Pick your pieces",
    body: "Add mekhela sador, sarees or dupattas to your bag. Ask about any handpainted design.",
  },
  { title: "Send your bag on WhatsApp", body: "One tap sends your list, total and delivery address to us." },
  { title: "Confirm and pay", body: "We confirm availability, delivery charges and payment details on chat." },
  { title: "We pack and dispatch", body: "Your order is packed at our studio and sent your way." },
];

export function HowToOrder() {
  return (
    <section id="how" aria-labelledby="how-title" className="bg-surface py-16 lg:py-24">
      <div className="wrap">
        <h2 id="how-title" className="display text-2xl text-plum md:text-3xl">
          How ordering works
        </h2>
        <p className="measure mt-3 text-muted">
          No account or card needed. Your order goes straight to our WhatsApp, {site.whatsappDisplay}.
        </p>
        <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative">
              <span aria-hidden className="relative grid size-12 place-items-center">
                <span className="absolute inset-[6px] rotate-45 rounded-[4px] bg-rose" />
                <span className="display relative text-lg text-rose-ink">{i + 1}</span>
              </span>
              <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 max-w-[32ch] text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
