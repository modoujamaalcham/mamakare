import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useTheme } from "@/lib/theme";
import {
  Building2,
  CheckCircle2,
  LockKeyhole,
  Moon,
  Save,
  ShieldCheck,
  Sun,
  UserRound,
  Wifi,
} from "lucide-react";
import { Section, Empty, Loading } from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import { useCompanySettings, useMe } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/more")({
  head: () => ({ meta: [{ title: "Settings — Mamakare" }] }),
  component: More,
});

function More() {
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const { theme, toggleTheme } = useTheme();
  const { data: company, isLoading: companyLoading } = useCompanySettings();
  const [companyForm, setCompanyForm] = useState({
    name: "Mamakare",
    address: "",
    phone: "",
    email: "",
    logo_url: "",
  });
  const [savingCompany, setSavingCompany] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["profile-settings"],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      return session.session?.user ?? null;
    },
  });

  useEffect(() => {
    if (!company) return;
    setCompanyForm({
      name: company.name,
      address: company.address || "",
      phone: company.phone || "",
      email: company.email || "",
      logo_url: company.logo_url || "",
    });
  }, [company]);

  async function saveCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingCompany(true);
    const { error } = await supabase.from("company_settings").upsert(
      {
        singleton: true,
        name: companyForm.name.trim() || "Mamakare",
        address: companyForm.address.trim() || null,
        phone: companyForm.phone.trim() || null,
        email: companyForm.email.trim() || null,
        logo_url: companyForm.logo_url.trim() || null,
      },
      { onConflict: "singleton" },
    );
    setSavingCompany(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["company-settings"] });
    toast.success("Company information updated");
  }

  return (
    <div className="w-full space-y-6 pb-8">
      <div className="relative overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground shadow-lg shadow-primary/10 md:p-8">
        <div className="relative z-10 flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15">
            <UserRound className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary-foreground/70">Workspace settings</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">More</h1>
            <p className="mt-2 text-sm text-primary-foreground/75">
              Account, appearance, and security information.
            </p>
          </div>
        </div>
        <ShieldCheck
          className="absolute -bottom-8 -right-2 h-44 w-44 text-white/10"
          strokeWidth={1}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Section title="Signed-in account" action={<UserRound className="h-4 w-4 text-primary" />}>
          {isLoading ? (
            <Loading />
          ) : data ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-primary-soft/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  Current account
                </p>
                <p className="mt-2 truncate text-base font-semibold">
                  {data.email || "Not available"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {me?.roles.length ? me.roles.join(", ") : "No staff role assigned"}
                </p>
              </div>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Email</dt>
                  <dd className="mt-1 font-medium">{data.email || "Not available"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Phone</dt>
                  <dd className="mt-1 font-medium">{data.phone || "Not available"}</dd>
                </div>
              </dl>
            </div>
          ) : (
            <Empty>Account information is unavailable.</Empty>
          )}
        </Section>

        <Section
          title="Appearance"
          action={
            theme === "dark" ? (
              <Moon className="h-4 w-4 text-primary" />
            ) : (
              <Sun className="h-4 w-4 text-primary" />
            )
          }
        >
          <button
            type="button"
            onClick={toggleTheme}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4 text-left transition-colors hover:bg-muted/50"
          >
            <span className="flex items-center gap-3">
              <span className="rounded-xl bg-primary-soft p-2 text-primary">
                {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </span>
              <span>
                <span className="block text-sm font-semibold">
                  {theme === "dark" ? "Dark mode" : "Light mode"}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Switch the workspace appearance
                </span>
              </span>
            </span>
            <span className="text-xs font-semibold text-primary">Change</span>
          </button>
        </Section>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <InfoCard
          icon={LockKeyhole}
          title="Protected records"
          text="Clinical information is restricted to authorized staff."
        />
        <InfoCard
          icon={Wifi}
          title="Online workflows"
          text="Clinical changes require a confirmed internet connection."
        />
        <InfoCard
          icon={CheckCircle2}
          title="Mamakare"
          text="Secure maternal and patient care coordination."
        />
      </div>

      {me?.roles.includes("admin") && (
        <div className="space-y-5">
          <Section title="Staff & access" action={<ShieldCheck className="h-4 w-4 text-primary" />}>
            <p className="text-sm leading-6 text-muted-foreground">
              Manage staff access and the shared company profile used in patient reports.
            </p>
            <Button asChild variant="outline" className="mt-4 rounded-xl">
              <Link to="/staff">Manage staff access</Link>
            </Button>
          </Section>

          <Section
            title="Company information"
            action={<Building2 className="h-4 w-4 text-primary" />}
          >
            {companyLoading ? (
              <Loading />
            ) : (
              <form className="grid gap-4 sm:grid-cols-2" onSubmit={saveCompany}>
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company name</Label>
                  <Input
                    id="company-name"
                    value={companyForm.name}
                    onChange={(event) =>
                      setCompanyForm({ ...companyForm, name: event.target.value })
                    }
                    required
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-phone">Phone number</Label>
                  <Input
                    id="company-phone"
                    value={companyForm.phone}
                    onChange={(event) =>
                      setCompanyForm({ ...companyForm, phone: event.target.value })
                    }
                    placeholder="+220 ..."
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="company-address">Address</Label>
                  <Input
                    id="company-address"
                    value={companyForm.address}
                    onChange={(event) =>
                      setCompanyForm({ ...companyForm, address: event.target.value })
                    }
                    placeholder="Clinic address"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-email">Email</Label>
                  <Input
                    id="company-email"
                    type="email"
                    value={companyForm.email}
                    onChange={(event) =>
                      setCompanyForm({ ...companyForm, email: event.target.value })
                    }
                    placeholder="hello@mamakare.com"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-logo">Logo URL (optional)</Label>
                  <Input
                    id="company-logo"
                    type="url"
                    value={companyForm.logo_url}
                    onChange={(event) =>
                      setCompanyForm({ ...companyForm, logo_url: event.target.value })
                    }
                    placeholder="https://..."
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={savingCompany} className="rounded-xl">
                    <Save className="h-4 w-4" />
                    {savingCompany ? "Saving…" : "Save company information"}
                  </Button>
                </div>
              </form>
            )}
          </Section>
        </div>
      )}
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof LockKeyhole;
  title: string;
  text: string;
}) {
  return (
    <div className="card-surface p-5">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-4 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p>
    </div>
  );
}
