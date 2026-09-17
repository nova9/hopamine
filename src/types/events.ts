export type EventStatus = "upcoming" | "past";

export type EventCategory = "workshop" | "trade" | "collaboration";

export type EventSummary = {
  id: string;
  slug: string;
  name: string;
  host: string;
  startsAt: string;
  location: string;
  description: string;
  status: EventStatus;
  category: EventCategory;
};

export type EventPresentation = {
  name: string;
  type: string;
  size: number;
  downloadUrl: string;
};

export type EventDetail = EventSummary & {
  presentation: EventPresentation | null;
  submissionCount: number;
};

export type CreatedEvent = EventDetail;

export type EventsResponse = {
  events: EventSummary[];
};

export type CreateEventResponse = {
  event: CreatedEvent;
};

export type EventResponse = {
  event: EventDetail;
};

export type ApiErrorResponse = {
  error?: string;
  issues?: Array<{ message?: string }>;
};

export type ModeratorSession = {
  moderator: {
    email: string;
  };
};

export type SubmissionFile = {
  name: string;
  type: "DOCX" | "PDF" | "PNG" | "PPTX";
  size: string;
};

export type Submission = {
  id: string;
  eventId: string;
  username: string;
  title: string;
  description: string;
  createdAt: string;
  files: SubmissionFile[];
};
