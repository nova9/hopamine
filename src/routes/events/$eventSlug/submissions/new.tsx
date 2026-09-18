import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { getEvent } from "@/lib/events";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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

export const Route = createFileRoute("/events/$eventSlug/submissions/new")({
  component: NewSubmissionPage,
});
async function submit(slug: string, form: HTMLFormElement) {
  const data = new FormData(form);
  await convertFormDataImages(data, "files");
  const response = await fetch(
    `/api/events/${encodeURIComponent(slug)}/submissions`,
    { method: "POST", body: data },
  );
  const body = (await response.json()) as {
    error?: string;
    submission?: { id: string };
  };
  if (!response.ok || !body.submission)
    throw new Error(body.error ?? "The submission could not be added.");
  return body.submission;
}
function NewSubmissionPage() {
  const { eventSlug } = Route.useParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const event = useQuery({
    queryKey: ["events", eventSlug],
    queryFn: () => getEvent(eventSlug),
  });
  const [error, setError] = useState("");
  const mutation = useMutation({
    mutationFn: (form: HTMLFormElement) => submit(eventSlug, form),
    onSuccess: async (value) => {
      await client.invalidateQueries({ queryKey: ["submissions", eventSlug] });
      toast.success("Submission published");
      navigate({
        to: "/events/$eventSlug/submissions/$submissionId",
        params: { eventSlug, submissionId: value.id },
      });
    },
    onError: (e: Error) => setError(e.message),
  });
  if (event.data?.status === "past")
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <Alert>
          <AlertTitle>Submissions are closed</AlertTitle>
          <AlertDescription>
            Past events are preserved as a read-only archive.
          </AlertDescription>
        </Alert>
      </main>
    );
  const today = new Date().toISOString().slice(0, 10);
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <Link
        to="/events/$eventSlug/submissions"
        params={{ eventSlug }}
        className={`${buttonVariants({ variant: "ghost" })} mb-4`}
      >
        Back to submissions
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Add a submission</CardTitle>
          <CardDescription>
            Share useful material from {event.data?.name ?? "this event"}. Links
            should go in the description.
          </CardDescription>
        </CardHeader>
        <form
          onSubmit={(e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setError("");
            mutation.mutate(e.currentTarget);
          }}
        >
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-5">
                <AlertTitle>Could not publish</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input id="username" name="username" required maxLength={80} />
              </Field>
              <Field>
                <FieldLabel htmlFor="title">Submission title</FieldLabel>
                <Input id="title" name="title" required maxLength={200} />
              </Field>
              <Field>
                <FieldLabel htmlFor="submittedAt">Submission date</FieldLabel>
                <Input
                  id="submittedAt"
                  name="submittedAt"
                  type="date"
                  defaultValue={today}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="description">Short description</FieldLabel>
                <Textarea
                  id="description"
                  name="description"
                  required
                  maxLength={5000}
                  className="min-h-32"
                />
                <FieldDescription>Include any web links here.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="files">Files</FieldLabel>
                <Input
                  id="files"
                  name="files"
                  type="file"
                  multiple
                  required
                  accept=".doc,.docx,.pdf,.png,.jpg,.jpeg,image/png,image/jpeg"
                />
                <FieldDescription>
                  Upload 1–5 DOC, DOCX, PDF, PNG, or JPEG files. Images are
                  converted to AVIF before upload. Maximum 25 MB each.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter className="justify-end">
            <Button disabled={mutation.isPending}>
              {mutation.isPending ? "Publishing…" : "Publish submission"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
