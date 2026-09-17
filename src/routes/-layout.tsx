import {
  ArrowRight,
  Briefcase,
  CalendarBlank,
  ChatCircleDots,
  Clock,
  FileText,
  Lightbulb,
  MapPin,
  UsersThree,
} from "@phosphor-icons/react";
import { Link, Outlet } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EventCategory, EventSummary, Submission } from "@/mocks/types";

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

const categoryDetails: Record<
  EventCategory,
  { label: string; icon: typeof Lightbulb; artClass: string }
> = {
  workshop: {
    label: "Workshop",
    icon: Lightbulb,
    artClass: "event-art-workshop",
  },
  trade: {
    label: "Information trade",
    icon: ChatCircleDots,
    artClass: "event-art-trade",
  },
  collaboration: {
    label: "Collaboration",
    icon: UsersThree,
    artClass: "event-art-collaboration",
  },
};

export function formatEventDate(value: string) {
  return dateFormatter.format(new Date(value));
}

export function Layout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-blue-950/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link
            to="/"
            className="flex items-center gap-3 font-heading text-sm font-bold tracking-tight text-blue-950"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-blue-950 text-sm text-yellow-300 shadow-sm">
              H+
            </span>
            <span className="hidden sm:inline">#HOPAMINE Virtual Events</span>
            <span className="sm:hidden">#HOPAMINE</span>
          </Link>

          <nav aria-label="Primary navigation" className="flex items-center gap-1">
            <a
              className={buttonVariants({ variant: "ghost" })}
              href="mailto:hello@hopamine.community"
            >
              Contact
            </a>
            <a
              className={buttonVariants({ variant: "default" })}
              href="https://discord.com"
              target="_blank"
              rel="noreferrer"
            >
              Discord
              <ArrowRight aria-hidden="true" />
            </a>
          </nav>
        </div>
      </header>

      <Outlet />

      <footer className="mt-20 border-t border-blue-950/10 bg-blue-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-10 lg:px-8">
          <p className="font-heading text-lg font-semibold">
            A community that turns optimism into action.
          </p>
          <p className="text-sm text-blue-200">Hope + Dopamine</p>
        </div>
      </footer>
    </div>
  );
}

export function EventArtwork({ event }: { event: EventSummary }) {
  const details = categoryDetails[event.category];
  const Icon = details.icon;

  return (
    <div
      className={cn(
        "event-art relative grid min-h-44 place-items-center overflow-hidden",
        details.artClass,
        event.status === "past" && "saturate-50",
      )}
      aria-hidden="true"
    >
      <span className="event-art-grid" />
      <div className="relative grid size-20 place-items-center rounded-3xl border border-white/40 bg-white/20 text-white shadow-xl backdrop-blur-sm">
        <Icon size={38} weight="duotone" />
      </div>
      <span className="absolute bottom-4 left-4 font-heading text-xs font-semibold uppercase tracking-[0.18em] text-white/85">
        {details.label}
      </span>
    </div>
  );
}

export function EventCard({ event }: { event: EventSummary }) {
  return (
    <Card
      className={cn(
        "overflow-hidden rounded-3xl border-0 py-0 shadow-[0_16px_50px_-32px_rgba(15,42,90,0.55)] ring-blue-950/10 transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_60px_-30px_rgba(15,42,90,0.5)]",
        event.status === "past" && "bg-slate-50",
      )}
    >
      <EventArtwork event={event} />
      <CardHeader className="gap-3 px-5 pt-5">
        <div className="flex items-center justify-between gap-3">
          <Badge
            variant={event.status === "upcoming" ? "default" : "secondary"}
            className="rounded-full px-2.5 capitalize"
          >
            {event.status}
          </Badge>
          <span className="text-xs font-medium text-muted-foreground">
            Hosted by {event.host}
          </span>
        </div>
        <CardTitle className="font-heading text-xl leading-snug text-blue-950">
          {event.name}
        </CardTitle>
        <CardDescription className="line-clamp-2 text-sm leading-6">
          {event.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 px-5 text-sm text-slate-600">
        <p className="flex items-start gap-2">
          <CalendarBlank className="mt-0.5 shrink-0 text-blue-700" weight="bold" />
          <time dateTime={event.startsAt}>{formatEventDate(event.startsAt)}</time>
        </p>
        <p className="flex items-start gap-2">
          <MapPin className="mt-0.5 shrink-0 text-blue-700" weight="bold" />
          {event.location}
        </p>
      </CardContent>
      <CardFooter className="border-blue-950/10 bg-blue-50/60 px-5 py-4">
        <Link
          to="/events/$eventSlug"
          params={{ eventSlug: event.slug }}
          className="flex w-full items-center justify-between font-heading text-sm font-semibold text-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          View event
          <ArrowRight aria-hidden="true" />
        </Link>
      </CardFooter>
    </Card>
  );
}

export function SubmissionCard({
  submission,
  eventSlug,
}: {
  submission: Submission;
  eventSlug: string;
}) {
  return (
    <Card className="rounded-2xl py-0 ring-blue-950/10 transition-colors hover:bg-blue-50/60">
      <Link
        to="/events/$eventSlug/submissions/$submissionId"
        params={{ eventSlug, submissionId: submission.id }}
        className="grid gap-4 p-5 outline-none focus-visible:ring-2 focus-visible:ring-blue-600 sm:grid-cols-[auto_1fr_auto] sm:items-center"
      >
        <span className="grid size-12 place-items-center rounded-xl bg-blue-100 text-blue-800">
          <FileText size={24} weight="duotone" />
        </span>
        <span>
          <span className="block font-heading text-base font-semibold text-blue-950">
            {submission.title}
          </span>
          <span className="mt-1 block text-sm text-muted-foreground">
            {submission.username} · Posted {formatEventDate(submission.createdAt)}
          </span>
        </span>
        <ArrowRight className="hidden text-blue-700 sm:block" aria-hidden="true" />
      </Link>
    </Card>
  );
}

export function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Clock;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 place-items-center rounded-xl bg-yellow-300 text-blue-950">
        <Icon size={20} weight="bold" />
      </span>
      <span>
        <span className="block font-heading text-lg font-bold text-blue-950">{value}</span>
        <span className="block text-xs text-slate-500">{label}</span>
      </span>
    </div>
  );
}

export const communityStats = [
  { icon: CalendarBlank, value: "3", label: "upcoming events" },
  { icon: FileText, value: "24", label: "shared resources" },
  { icon: Briefcase, value: "8", label: "past sessions" },
];
