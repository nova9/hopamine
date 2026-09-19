import {
  ArrowLeft,
  CalendarPlus,
  CheckCircle,
  CircleNotch,
  FileArrowUp,
  Info,
  WarningCircle,
} from "@phosphor-icons/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import axios from "axios";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { convertImageToAvif } from "@/lib/image";
import {
  DOCUMENT_ACCEPT,
  DOCUMENT_TYPE_LABEL,
  hasAllowedDocumentExtension,
} from "@/lib/upload-policy";
import type {
  ApiErrorResponse,
  CreatedEvent,
  CreateEventResponse,
} from "@/types/events";

export const Route = createFileRoute("/admin/events/new")({
  component: CreateEventPage,
});

const MAX_PRESENTATION_SIZE = 25 * 1024 * 1024;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg"];

const createEventFormSchema = z.object({
  name: z.string().trim().min(1, "Enter an event name.").max(200),
  host: z.string().trim().min(1, "Enter the event host.").max(100),
  category: z.enum(["workshop", "trade", "collaboration"]),
  startsAt: z
    .string()
    .min(1, "Enter a start date and time.")
    .refine(
      (value) => !Number.isNaN(new Date(value).getTime()),
      "Enter a valid start date and time.",
    ),
  location: z.string().trim().min(1, "Enter the event location.").max(200),
  description: z
    .string()
    .trim()
    .min(50, "Enter at least 50 characters.")
    .max(5_000),
  presentation: z
    .custom<FileList | undefined>()
    .superRefine((files, context) => {
      const presentation = files?.item(0);

      if (!presentation) return;

      if (!hasAllowedDocumentExtension(presentation.name)) {
        context.addIssue({
          code: "custom",
          message: `The event file must be a ${DOCUMENT_TYPE_LABEL} file.`,
        });
      }

      if (presentation.size > MAX_PRESENTATION_SIZE) {
        context.addIssue({
          code: "custom",
          message: "The event file must be 25 MB or smaller.",
        });
      }
    })
    .optional(),
  image: z
    .custom<FileList | undefined>()
    .superRefine((files, context) => {
      const image = files?.item(0);

      if (!image) return;

      const hasAllowedExtension = IMAGE_EXTENSIONS.some((extension) =>
        image.name.toLowerCase().endsWith(extension),
      );

      if (!hasAllowedExtension) {
        context.addIssue({
          code: "custom",
          message: "The event image must be a PNG or JPEG file.",
        });
      }

      if (image.size > MAX_IMAGE_SIZE) {
        context.addIssue({
          code: "custom",
          message: "The event image must be 10 MB or smaller.",
        });
      }
    })
    .optional(),
});

type CreateEventFormValues = z.infer<typeof createEventFormSchema>;

async function createEvent(values: CreateEventFormValues): Promise<CreatedEvent> {
  const formData = new FormData();
  const presentation = values.presentation?.item(0);
  const image = values.image?.item(0);

  formData.set("name", values.name.trim());
  formData.set("host", values.host.trim());
  formData.set("category", values.category);
  formData.set("startsAt", new Date(values.startsAt).toISOString());
  formData.set("location", values.location.trim());
  formData.set("description", values.description.trim());

  if (presentation) {
    formData.set("presentation", presentation);
  }

  if (image) {
    formData.set("image", await convertImageToAvif(image));
  }

  try {
    const { data } = await axios.post<CreateEventResponse>(
      "/api/admin/events",
      formData,
    );

    if (!data.event) {
      throw new Error("The server returned an unexpected response.");
    }

    return data.event;
  } catch (error) {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      const apiError = error.response?.data;
      const issue = apiError?.issues?.[0]?.message;

      throw new Error(
        issue ?? apiError?.error ?? "The event could not be created.",
      );
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("The event could not be created.");
  }
}

function CreateEventPage() {
  const queryClient = useQueryClient();
  const formElementRef = useRef<HTMLFormElement>(null);
  const form = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventFormSchema),
    defaultValues: {
      name: "",
      host: "",
      category: "workshop",
      startsAt: "",
      location: "",
      description: "",
    },
  });
  const createEventMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: async () => {
      form.reset();
      formElementRef.current?.reset();
      await queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    createEventMutation.reset();
    createEventMutation.mutate(values);
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <Link
        to="/admin/events"
        className={`${buttonVariants({ variant: "ghost", size: "sm" })} mb-4`}
      >
        <ArrowLeft data-icon="inline-start" aria-hidden="true" />
        Back to event management
      </Link>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Card>
          <CardHeader className="border-b">
            <Badge variant="secondary" className="mb-2">
              Moderator
            </Badge>
            <CardTitle className="text-2xl">Create an event</CardTitle>
            <CardDescription className="max-w-2xl text-sm">
              Add the schedule, event details, and an optional event file for the
              community.
            </CardDescription>
          </CardHeader>

          <form ref={formElementRef} onSubmit={onSubmit} noValidate>
            <CardContent className="py-1">
              <FieldGroup>
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>Event name</FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        placeholder="Portfolio Lab: Build a Hireable Case Study"
                        maxLength={200}
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <div className="grid gap-5 sm:grid-cols-2">
                  <Controller
                    name="host"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>Host</FieldLabel>
                        <Input
                          {...field}
                          id={field.name}
                          placeholder="Hopamine Mods"
                          maxLength={100}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name="category"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>Category</FieldLabel>
                        <Select
                          name={field.name}
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger
                            ref={field.ref}
                            id={field.name}
                            className="w-full"
                            onBlur={field.onBlur}
                            aria-invalid={fieldState.invalid}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="workshop">Workshop</SelectItem>
                            <SelectItem value="trade">Meeting</SelectItem>
                            <SelectItem value="collaboration">Collaboration</SelectItem>
                          </SelectContent>
                        </Select>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Controller
                    name="startsAt"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>Start date and time</FieldLabel>
                        <Input
                          {...field}
                          id={field.name}
                          type="datetime-local"
                          aria-invalid={fieldState.invalid}
                        />
                        <FieldDescription>
                          The time is interpreted in your current time zone.
                        </FieldDescription>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name="location"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>Location</FieldLabel>
                        <Input
                          {...field}
                          id={field.name}
                          placeholder="Hopamine Discord · Stage channel"
                          maxLength={200}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </div>

                <Controller
                  name="description"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                      <Textarea
                        {...field}
                        id={field.name}
                        placeholder="What will happen during the event, and what should participants bring?"
                        minLength={50}
                        maxLength={5_000}
                        className="min-h-32 resize-y"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldDescription>Enter at least 50 characters.</FieldDescription>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  name="presentation"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>
                        Event file (optional)
                      </FieldLabel>
                      <Input
                        ref={field.ref}
                        id={field.name}
                        name={field.name}
                        type="file"
                        accept={DOCUMENT_ACCEPT}
                        onBlur={field.onBlur}
                        onChange={(event) => field.onChange(event.target.files)}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldDescription>
                        Upload one {DOCUMENT_TYPE_LABEL} file up to 25 MB. Members
                        will be able to access it from the event page.
                      </FieldDescription>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  name="image"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>
                        Event image (optional)
                      </FieldLabel>
                      <Input
                        ref={field.ref}
                        id={field.name}
                        name={field.name}
                        type="file"
                        accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                        onBlur={field.onBlur}
                        onChange={(event) => field.onChange(event.target.files)}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldDescription>
                        Upload one PNG or JPEG image up to 10 MB. It will be
                        converted to AVIF before upload.
                      </FieldDescription>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                {createEventMutation.isError && (
                  <Alert variant="destructive">
                    <WarningCircle aria-hidden="true" />
                    <AlertTitle>Event not created</AlertTitle>
                    <AlertDescription>{createEventMutation.error.message}</AlertDescription>
                  </Alert>
                )}

                {createEventMutation.isSuccess && (
                  <Alert role="status">
                    <CheckCircle aria-hidden="true" />
                    <AlertTitle>Event created</AlertTitle>
                    <AlertDescription>
                      {createEventMutation.data.name} was saved
                      {createEventMutation.data.presentation
                        ? ` with ${createEventMutation.data.presentation.name}.`
                        : "."}
                    </AlertDescription>
                  </Alert>
                )}
              </FieldGroup>
            </CardContent>

            <CardFooter className="justify-end gap-2">
              <Link
                to="/admin/events"
                className={buttonVariants({ variant: "ghost" })}
              >
                Cancel
              </Link>
              <Button type="submit" disabled={createEventMutation.isPending}>
                {createEventMutation.isPending ? (
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
              <li>Upload only the final event file; it becomes publicly available.</li>
            </ul>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            <FileArrowUp className="mr-2 size-4" aria-hidden="true" />
            {DOCUMENT_TYPE_LABEL} · 25 MB maximum
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
