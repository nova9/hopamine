import {
  ArrowLeft,
  CalendarPlus,
  CheckCircle,
  CircleNotch,
  FileArrowUp,
  Info,
  WarningCircle,
} from "@phosphor-icons/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/events/create")({
  component: CreateEventPage,
});

const MAX_PRESENTATION_SIZE = 25 * 1024 * 1024;
const PRESENTATION_EXTENSIONS = [".ppt", ".pptx", ".pdf"];

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
  presentation: {
    name: string;
    type: string;
    size: number;
  } | null;
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
    const presentation = formData.get("presentation");

    try {
      if (Number.isNaN(startsAt.getTime())) {
        throw new Error("Enter a valid start date and time.");
      }

      if (presentation instanceof File && presentation.size > 0) {
        const lowercaseName = presentation.name.toLowerCase();
        const hasAllowedExtension = PRESENTATION_EXTENSIONS.some((extension) =>
          lowercaseName.endsWith(extension),
        );

        if (!hasAllowedExtension) {
          throw new Error("The presentation must be a PPT, PPTX, or PDF file.");
        }

        if (presentation.size > MAX_PRESENTATION_SIZE) {
          throw new Error("The presentation must be 25 MB or smaller.");
        }
      } else {
        formData.delete("presentation");
      }

      formData.set("startsAt", startsAt.toISOString());

      const response = await fetch("/api/events", {
        method: "POST",
        body: formData,
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
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <Link
        to="/"
        className={`${buttonVariants({ variant: "ghost", size: "sm" })} mb-4`}
      >
        <ArrowLeft data-icon="inline-start" aria-hidden="true" />
        Back to events
      </Link>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Card>
          <CardHeader className="border-b">
            <Badge variant="secondary" className="mb-2">
              Moderator
            </Badge>
            <CardTitle className="text-2xl">Create an event</CardTitle>
            <CardDescription className="max-w-2xl text-sm">
              Add the schedule, event details, and an optional presentation for the
              community.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5 py-1">
              <div className="space-y-2">
                <Label htmlFor="name">Event name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Portfolio Lab: Build a Hireable Case Study"
                  required
                  maxLength={200}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="host">Host</Label>
                  <Input
                    id="host"
                    name="host"
                    placeholder="Hopamine Mods"
                    required
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" defaultValue="workshop">
                    <SelectTrigger id="category" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="trade">Information trade</SelectItem>
                      <SelectItem value="collaboration">Collaboration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startsAt">Start date and time</Label>
                  <Input id="startsAt" name="startsAt" type="datetime-local" required />
                  <p className="text-xs text-muted-foreground">
                    The time is interpreted in your current time zone.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    placeholder="Hopamine Discord · Stage channel"
                    required
                    maxLength={200}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="What will happen during the event, and what should participants bring?"
                  required
                  maxLength={5_000}
                  className="min-h-32 resize-y"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="presentation">Presentation file (optional)</Label>
                <Input
                  id="presentation"
                  name="presentation"
                  type="file"
                  accept=".ppt,.pptx,.pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/pdf"
                />
                <p className="text-xs text-muted-foreground">
                  Upload one PPT, PPTX, or PDF file up to 25 MB. Members will be able to
                  access it from the event page.
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <WarningCircle aria-hidden="true" />
                  <AlertTitle>Event not created</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {createdEvent && (
                <Alert role="status">
                  <CheckCircle aria-hidden="true" />
                  <AlertTitle>Event created</AlertTitle>
                  <AlertDescription>
                    {createdEvent.name} was saved
                    {createdEvent.presentation
                      ? ` with ${createdEvent.presentation.name}.`
                      : "."}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>

            <CardFooter className="justify-end gap-2">
              <Link to="/" className={buttonVariants({ variant: "ghost" })}>
                Cancel
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <CircleNotch className="animate-spin" aria-hidden="true" />
                    Creating…
                  </>
                ) : (
                  <>
                    <CalendarPlus aria-hidden="true" />
                    Create event
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card size="sm" className="lg:sticky lg:top-20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="size-4" aria-hidden="true" />
              Before publishing
            </CardTitle>
            <CardDescription>Check these details before creating the event.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-4 text-xs text-muted-foreground">
              <li>Use a title that says what participants will do.</li>
              <li>Confirm the date and time in your own time zone.</li>
              <li>Include the exact Discord channel or meeting location.</li>
              <li>Upload final slides only; the file becomes publicly available.</li>
            </ul>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            <FileArrowUp className="mr-2 size-4" aria-hidden="true" />
            PPT, PPTX, or PDF · 25 MB maximum
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
