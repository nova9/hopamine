import {
  ArrowLeft,
  CalendarPlus,
  CheckCircle,
  CircleNotch,
  WarningCircle,
} from "@phosphor-icons/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/events/create")({
  component: CreateEventPage,
});

type EventCategory = "workshop" | "trade" | "collaboration";

type CreatedEvent = {
  id: string;
  slug: string;
  name: string;
  host: string;
  startsAt: string;
  location: string;
  description: string;
  category: EventCategory;
  status: "upcoming" | "past";
};

type CreateEventResponse = {
  event: CreatedEvent;
};

type ErrorResponse = {
  error?: string;
  issues?: Array<{ message?: string }>;
};

function CreateEventPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdEvent, setCreatedEvent] = useState<CreatedEvent | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setCreatedEvent(null);
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const startsAt = new Date(String(formData.get("startsAt")));

    try {
      if (Number.isNaN(startsAt.getTime())) {
        throw new Error("Enter a valid start date and time.");
      }

      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          host: formData.get("host"),
          startsAt: startsAt.toISOString(),
          location: formData.get("location"),
          description: formData.get("description"),
          category: formData.get("category"),
        }),
      });

      const body = (await response.json()) as CreateEventResponse | ErrorResponse;

      if (!response.ok) {
        const apiError = body as ErrorResponse;
        const issue = apiError.issues?.[0]?.message;
        throw new Error(issue ?? apiError.error ?? "The event could not be created.");
      }

      if (!("event" in body)) {
        throw new Error("The server returned an unexpected response.");
      }

      setCreatedEvent(body.event);
      form.reset();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The event could not be created.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10 lg:px-8 lg:py-16">
      <Link
        to="/"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "mb-6 -ml-2 text-blue-900",
        )}
      >
        <ArrowLeft aria-hidden="true" />
        Back to events
      </Link>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="overflow-hidden rounded-3xl border-blue-950/10 py-0 shadow-[0_24px_70px_-46px_rgba(15,42,90,0.75)]">
          <CardHeader className="border-b border-blue-950/10 bg-[linear-gradient(135deg,#eef6ff_0%,#ffffff_70%,#fff8cc_100%)] px-6 py-7 sm:px-8">
            <div className="mb-3 grid size-11 place-items-center rounded-2xl bg-blue-950 text-yellow-300 shadow-sm">
              <CalendarPlus size={24} weight="duotone" />
            </div>
            <CardTitle className="font-heading text-3xl tracking-tight text-blue-950">
              Create a new event
            </CardTitle>
            <p className="max-w-2xl text-base leading-7 text-slate-600">
              Add the essential details now. You can share the event with the community
              once it has been created.
            </p>
          </CardHeader>

          <CardContent className="px-6 py-7 sm:px-8 sm:py-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-blue-950">
                  Event name
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Portfolio Lab: Build a Hireable Case Study"
                  required
                  maxLength={200}
                  className="h-11 rounded-xl px-3 text-sm md:text-sm"
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="host" className="text-sm font-semibold text-blue-950">
                    Host
                  </Label>
                  <Input
                    id="host"
                    name="host"
                    placeholder="Hopamine Mods"
                    required
                    maxLength={100}
                    className="h-11 rounded-xl px-3 text-sm md:text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="category"
                    className="text-sm font-semibold text-blue-950"
                  >
                    Category
                  </Label>
                  <select
                    id="category"
                    name="category"
                    defaultValue="workshop"
                    className="h-11 w-full rounded-xl border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
                  >
                    <option value="workshop">Workshop</option>
                    <option value="trade">Information trade</option>
                    <option value="collaboration">Collaboration</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="startsAt"
                    className="text-sm font-semibold text-blue-950"
                  >
                    Start date and time
                  </Label>
                  <Input
                    id="startsAt"
                    name="startsAt"
                    type="datetime-local"
                    required
                    className="h-11 rounded-xl px-3 text-sm md:text-sm"
                  />
                  <p className="text-xs leading-5 text-slate-500">
                    Uses your current time zone.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="location"
                    className="text-sm font-semibold text-blue-950"
                  >
                    Location
                  </Label>
                  <Input
                    id="location"
                    name="location"
                    placeholder="Hopamine Discord · Stage channel"
                    required
                    maxLength={200}
                    className="h-11 rounded-xl px-3 text-sm md:text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-sm font-semibold text-blue-950"
                >
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="What will happen during the event, and what should participants bring?"
                  required
                  maxLength={5_000}
                  className="min-h-36 resize-y rounded-xl px-3 py-3 text-sm leading-6 md:text-sm"
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"
                >
                  <WarningCircle className="mt-0.5 shrink-0" size={20} weight="fill" />
                  <span>{error}</span>
                </div>
              )}

              {createdEvent && (
                <div
                  role="status"
                  className="flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900"
                >
                  <CheckCircle className="mt-0.5 shrink-0" size={20} weight="fill" />
                  <span>
                    <strong className="block font-semibold">Event created</strong>
                    {createdEvent.name} was saved with the slug {createdEvent.slug}.
                  </span>
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-blue-950/10 pt-6 sm:flex-row sm:items-center sm:justify-end">
                <Link
                  to="/"
                  className={cn(buttonVariants({ variant: "ghost" }), "h-11 rounded-xl px-5")}
                >
                  Cancel
                </Link>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-11 rounded-xl px-6 text-sm"
                >
                  {isSubmitting ? (
                    <>
                      <CircleNotch className="animate-spin" aria-hidden="true" />
                      Creating event…
                    </>
                  ) : (
                    <>
                      <CalendarPlus aria-hidden="true" />
                      Create event
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <aside className="rounded-3xl bg-blue-950 p-6 text-white shadow-[0_24px_60px_-38px_rgba(15,42,90,0.9)] lg:sticky lg:top-24">
          <p className="font-heading text-xs font-bold uppercase tracking-[0.18em] text-yellow-300">
            Before publishing
          </p>
          <h2 className="mt-3 font-heading text-xl font-semibold">Make it easy to join</h2>
          <ul className="mt-5 space-y-4 text-sm leading-6 text-blue-100">
            <li>Use a specific title that says what participants will do.</li>
            <li>Confirm the date and time in your own time zone.</li>
            <li>Include the exact Discord channel or meeting location.</li>
            <li>Explain what attendees should prepare or bring.</li>
          </ul>
        </aside>
      </div>
    </main>
  );
}
