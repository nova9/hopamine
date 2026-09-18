import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent } from "react";
import { toast } from "sonner";
import { getEvent } from "@/lib/events";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { convertFormDataImages } from "@/lib/image";

export const Route = createFileRoute("/admin/events/$eventSlug/edit")({
  component: EditEventPage,
});
function localDate(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}
function EditEventPage() {
  const { eventSlug } = Route.useParams();
  const nav = useNavigate();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["events", eventSlug],
    queryFn: () => getEvent(eventSlug),
  });
  const mutation = useMutation({
    mutationFn: async (form: HTMLFormElement) => {
      const data = new FormData(form);
      await convertFormDataImages(data, "image");
      data.set(
        "startsAt",
        new Date(String(data.get("startsAt"))).toISOString(),
      );
      const r = await fetch(`/api/admin/events/${eventSlug}`, {
        method: "PUT",
        body: data,
      });
      const body = (await r.json()) as { error?: string };
      if (!r.ok)
        throw new Error(body.error ?? "The event could not be updated.");
    },
    onSuccess: async () => {
      await nav({ to: "/events/$eventSlug", params: { eventSlug } });
      await client.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  if (query.isPending)
    return <main className="mx-auto max-w-3xl px-4 py-12">Loading event…</main>;
  if (query.isError || query.data.status === "past")
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        This event cannot be edited.
      </main>
    );
  const event = query.data;
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <Link
        to="/events/$eventSlug"
        params={{ eventSlug }}
        className={`${buttonVariants({ variant: "ghost" })} mb-4`}
      >
        Back to event
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Edit event</CardTitle>
        </CardHeader>
        <form
          onSubmit={(e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            mutation.mutate(e.currentTarget);
          }}
        >
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Event name</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  defaultValue={event.name}
                  required
                  maxLength={200}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="host">Host</FieldLabel>
                <Input
                  id="host"
                  name="host"
                  defaultValue={event.host}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="category">Category</FieldLabel>
                <select
                  id="category"
                  name="category"
                  defaultValue={event.category}
                  className="h-9 w-full border bg-transparent px-3 text-sm"
                >
                  <option value="workshop">Workshop</option>
                  <option value="trade">Information trade</option>
                  <option value="collaboration">Collaboration</option>
                </select>
              </Field>
              <Field>
                <FieldLabel htmlFor="startsAt">Start date and time</FieldLabel>
                <Input
                  id="startsAt"
                  name="startsAt"
                  type="datetime-local"
                  defaultValue={localDate(event.startsAt)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="location">Location</FieldLabel>
                <Input
                  id="location"
                  name="location"
                  defaultValue={event.location}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={event.description}
                  className="min-h-32"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="image">Replace event image</FieldLabel>
                <Input
                  id="image"
                  name="image"
                  type="file"
                  accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                />
                <FieldDescription>
                  Optional PNG or JPEG, up to 10 MB. It will be converted to
                  AVIF before upload.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="presentation">
                  Replace presentation
                </FieldLabel>
                <Input
                  id="presentation"
                  name="presentation"
                  type="file"
                  accept=".ppt,.pptx,.pdf"
                />
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
