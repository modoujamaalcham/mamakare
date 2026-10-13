import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { CalendarCheck, ClipboardList, HeartPulse, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mamakare — Maternal & Patient Care Management" },
      {
        name: "description",
        content:
          "Track pregnancies, antenatal visits, investigations and home visits in one secure place.",
      },
      { property: "og:title", content: "Mamakare — Maternal & Patient Care Management" },
      {
        property: "og:description",
        content:
          "Track pregnancies, antenatal visits, investigations and home visits in one secure place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const features = [
    {
      icon: HeartPulse,
      t: "Pregnancy tracking",
      d: "Gestational age, due dates and risk at a glance.",
    },
    {
      icon: ClipboardList,
      t: "Antenatal checkups",
      d: "Vitals, symptoms and danger-sign alerts on every visit.",
    },
    {
      icon: CalendarCheck,
      t: "Clinic & home visits",
      d: "Know who needs you today and who is overdue.",
    },
    {
      icon: ShieldCheck,
      t: "Secure records",
      d: "Access restricted to authorised staff, every change logged.",
    },
  ];
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col px-5 py-8 md:py-16">
        <header className="flex items-center justify-between">
          <Logo />
          <Button asChild variant="outline" size="sm" className="rounded-xl border-border/80">
            <Link to="/auth">Staff sign in</Link>
          </Button>
        </header>

        <section className="mt-14 max-w-3xl md:mt-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft/80 px-3.5 py-1 text-xs font-semibold text-primary">
            <HeartPulse className="h-3.5 w-3.5" />
            <span>Maternal Health & Clinical EMR · The Gambia</span>
          </div>

          <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl font-display">
            Care for every mother,{" "}
            <span className="bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">
              visit by visit.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg leading-relaxed text-muted-foreground max-w-2xl">
            Mamakare brings the complete clinical journey of each expectant mother — from early antenatal booking to delivery, postnatal care, and home visits — onto your smartphone and tablet with full PWA capability.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="rounded-xl px-7 font-bold shadow-md shadow-primary/20">
              <Link to="/auth">Open workspace</Link>
            </Button>
          </div>
        </section>

        <section className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.t} className="card-interactive p-5 flex flex-col justify-between">
              <div>
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-bold text-base text-foreground font-display">{f.t}</h3>
                <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">{f.d}</p>
              </div>
            </div>
          ))}
        </section>

        <footer className="mt-24 border-t border-border/60 pt-8 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Mamakare. Designed for midwives, nurses, and clinical teams across The Gambia.</p>
        </footer>
      </div>
    </main>
  );
}

export function Logo({ showText = true }: { showText?: boolean }) {
  return (
    <span className="flex items-center gap-2.5 font-display text-lg font-extrabold tracking-tight">
      <img
        src="/branding/mamakare.jpg"
        alt="Mamakare logo"
        className="h-8 w-8 rounded-xl object-cover ring-1 ring-border/80 shadow-xs shrink-0"
      />
      {showText && <span className="text-foreground">Mamakare</span>}
    </span>
  );
}
