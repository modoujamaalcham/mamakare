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
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-5xl flex-col px-5 py-8 md:py-16">
        <header className="flex items-center gap-2">
          <Logo />
        </header>
        <section className="mt-16 max-w-2xl md:mt-24">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">
            For midwives, nurses & doctors
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-6xl">
            Care for every mother, <span className="text-primary">visit by visit.</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Mamakare keeps the full story of each patient — from first antenatal visit to delivery
            and postnatal care — on your phone.
          </p>
          <div className="mt-8 flex gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>
        </section>
        <section className="mt-20 grid gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.t} className="card-surface p-5">
              <f.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-semibold">{f.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2 font-display text-lg font-extrabold">
      <img src="/icons/mamakare.svg" alt="" className="h-8 w-8 rounded-lg" />
      Mamakare
    </span>
  );
}
