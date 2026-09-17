import type { EventSummary, Submission } from "@/mocks/types";

export const events: EventSummary[] = [
  {
    id: "event-1",
    slug: "portfolio-lab",
    name: "Portfolio Lab: Build a Hireable Case Study",
    host: "Nadia & the Hopamine Mods",
    startsAt: "2026-10-10T18:00:00+05:30",
    location: "Hopamine Discord · Stage channel",
    description:
      "A working session on turning unfinished projects into clear portfolio stories. Bring one project, get structured feedback, and leave with a practical case-study outline.",
    status: "upcoming",
    category: "workshop",
  },
  {
    id: "event-2",
    slug: "information-trade-remote-work",
    name: "Information Trade #04: Finding Remote Work",
    host: "Mika",
    startsAt: "2026-11-07T19:00:00+05:30",
    location: "Hopamine Discord · Main voice",
    description:
      "Members exchange practical sources, hiring signals, and lessons learned while looking for remote roles across different industries.",
    status: "upcoming",
    category: "trade",
  },
  {
    id: "event-3",
    slug: "community-cowork-critique",
    name: "Community Co-work & Critique",
    host: "Hopamine Mods",
    startsAt: "2026-12-05T17:30:00+05:30",
    location: "Hopamine Discord · Studio room",
    description:
      "A calm two-hour co-working room followed by short peer critiques for anyone who wants a second pair of eyes on their work.",
    status: "upcoming",
    category: "collaboration",
  },
  {
    id: "event-4",
    slug: "speaking-with-clarity",
    name: "Speaking With Clarity",
    host: "Ari",
    startsAt: "2026-08-22T18:00:00+05:30",
    location: "Hopamine Discord",
    description:
      "A practical session on structuring short talks and making technical ideas easier to follow.",
    status: "past",
    category: "workshop",
  },
  {
    id: "event-5",
    slug: "open-source-first-steps",
    name: "Open Source: First Steps",
    host: "Rin",
    startsAt: "2026-07-18T18:30:00+05:30",
    location: "Hopamine Discord",
    description:
      "Members shared approachable projects, contribution workflows, and their first pull-request lessons.",
    status: "past",
    category: "collaboration",
  },
  {
    id: "event-6",
    slug: "creative-tools-trade",
    name: "Creative Tools Information Trade",
    host: "Zee",
    startsAt: "2026-06-13T19:00:00+05:30",
    location: "Hopamine Discord",
    description:
      "A fast exchange of useful design, writing, research, and automation tools from across the community.",
    status: "past",
    category: "trade",
  },
  {
    id: "event-7",
    slug: "freelance-pricing",
    name: "Freelance Pricing Without Guesswork",
    host: "Samira",
    startsAt: "2026-05-09T18:00:00+05:30",
    location: "Hopamine Discord",
    description:
      "A grounded discussion about project scope, pricing conversations, and protecting your time.",
    status: "past",
    category: "workshop",
  },
  {
    id: "event-8",
    slug: "small-team-collaboration",
    name: "Better Collaboration in Small Teams",
    host: "Dilan",
    startsAt: "2026-04-11T17:00:00+05:30",
    location: "Hopamine Discord",
    description:
      "Shared systems for handoffs, constructive feedback, and keeping volunteer projects moving.",
    status: "past",
    category: "collaboration",
  },
];

export const submissions: Submission[] = [
  {
    id: "submission-1",
    eventId: "event-1",
    username: "pixelmori",
    title: "A case-study outline that starts with the decision",
    description:
      "A compact outline for explaining the situation, the decision you made, and what changed. The linked references are listed at the end of the document.",
    createdAt: "2026-09-14T09:20:00+05:30",
    files: [
      { name: "case-study-outline.pdf", type: "PDF", size: "1.8 MB" },
      { name: "before-after.png", type: "PNG", size: "840 KB" },
    ],
  },
  {
    id: "submission-2",
    eventId: "event-1",
    username: "devonbuilds",
    title: "From side project to portfolio story",
    description:
      "Slides from my short presentation on choosing evidence, cutting unnecessary implementation detail, and writing a useful project reflection.",
    createdAt: "2026-09-12T16:45:00+05:30",
    files: [
      { name: "portfolio-story.pptx", type: "PPTX", size: "4.2 MB" },
    ],
  },
  {
    id: "submission-3",
    eventId: "event-1",
    username: "sena.writes",
    title: "Writing useful project summaries",
    description:
      "A one-page checklist for replacing vague claims with specific constraints, decisions, and outcomes.",
    createdAt: "2026-09-10T11:05:00+05:30",
    files: [
      { name: "project-summary-checklist.docx", type: "DOCX", size: "96 KB" },
    ],
  },
  {
    id: "submission-4",
    eventId: "event-4",
    username: "ari-speaks",
    title: "Three-part talk structure",
    description:
      "The structure demonstrated during the event, with sample openings and transitions.",
    createdAt: "2026-08-23T08:30:00+05:30",
    files: [
      { name: "talk-structure.pdf", type: "PDF", size: "720 KB" },
    ],
  },
];

export function getEventBySlug(slug: string | undefined) {
  return events.find((event) => event.slug === slug);
}

export function getSubmissionById(id: string | undefined) {
  return submissions.find((submission) => submission.id === id);
}

export function getEventSubmissions(eventId: string) {
  return submissions.filter((submission) => submission.eventId === eventId);
}
