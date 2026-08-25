import { Link } from "wouter";
import { BookOpen, Sparkles, ShieldCheck, Upload } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <header className="border-b border-border bg-background/85 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm">
              <BookOpen className="h-4 w-4" />
            </span>
            <span className="font-serif text-lg font-semibold tracking-tight">Cognivate</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/sign-in"
              data-testid="link-sign-in"
              className="px-3 py-1.5 text-sm rounded-md hover:bg-muted"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              data-testid="link-sign-up"
              className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <section className="text-center max-w-3xl mx-auto">
          <h1 className="font-serif text-4xl md:text-6xl font-semibold tracking-tight">
            Your private AI study workspace
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            Upload your notes, slides, PDFs, or textbook pages. Cognivate builds a
            personalized dashboard, tutor, vocabulary bank, formula library, quizzes,
            and step-by-step practice — all grounded in your own material.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/sign-up"
              data-testid="link-cta-sign-up"
              className="px-5 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90"
            >
              Create your account
            </Link>
            <Link
              href="/sign-in"
              data-testid="link-cta-sign-in"
              className="px-5 py-3 rounded-md border border-border font-medium hover:bg-muted"
            >
              I already have one
            </Link>
          </div>
        </section>

        <section className="mt-20 grid gap-6 md:grid-cols-3">
          <Feature
            icon={<Upload className="h-5 w-5" />}
            title="Upload anything"
            body="PDFs, slides, Word docs, text, images. We extract and analyze it for you."
          />
          <Feature
            icon={<Sparkles className="h-5 w-5" />}
            title="Personalized study"
            body="Sections, vocab, formulas, quizzes, work-it-out problems — generated from your material."
          />
          <Feature
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Private to you"
            body="Each account has its own private workspace. Nobody else can see what you upload or study."
          />
        </section>
      </main>

      <footer className="border-t border-border py-8 mt-16">
        <div className="mx-auto max-w-6xl px-4 text-sm text-muted-foreground text-center">
          © {new Date().getFullYear()} Cognivate
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
