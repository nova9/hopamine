import type { EventResponse, EventSummary, EventsResponse, Submission, SubmissionResponse, SubmissionsResponse } from "@/types/events";

export async function getEvents(): Promise<EventSummary[]> {
  const response = await fetch("/api/events?pageSize=100");

  if (!response.ok) {
    throw new Error("The events could not be loaded.");
  }

  const data = (await response.json()) as EventsResponse;
  return data.events;
}

export async function getSubmissions(eventSlug: string): Promise<Submission[]> {
  const response = await fetch(`/api/events/${encodeURIComponent(eventSlug)}/submissions`);
  if (!response.ok) throw new Error("The submissions could not be loaded.");
  return ((await response.json()) as SubmissionsResponse).submissions;
}

export async function getSubmission(eventSlug: string, submissionId: string) {
  const response = await fetch(`/api/events/${encodeURIComponent(eventSlug)}/submissions/${encodeURIComponent(submissionId)}`);
  if (response.status === 404) throw new Error("This submission could not be found.");
  if (!response.ok) throw new Error("The submission could not be loaded.");
  return (await response.json()) as SubmissionResponse;
}

export async function getEvent(eventSlug: string) {
  const response = await fetch(`/api/events/${encodeURIComponent(eventSlug)}`);

  if (response.status === 404) {
    throw new Error("This event could not be found.");
  }

  if (!response.ok) {
    throw new Error("The event could not be loaded.");
  }

  const data = (await response.json()) as EventResponse;
  return data.event;
}
