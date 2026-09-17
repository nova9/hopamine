# Hopamine Virtual Events — Product and Implementation Plan

## Product overview

Hopamine Virtual Events is a public community event hub for the Hopamine Discord community. It gives members one place to discover upcoming virtual events, revisit past events, and access the useful material shared before, during, or after each session.

The product solves three main problems:

1. Event information is easy to miss or lose inside Discord.
2. People who cannot attend still need access to presentations, notes, speeches, and other resources.
3. Community moderators need a simple way to see participation and maintain an organized event archive.

Instead of treating an event as something that disappears when the live session ends, Hopamine keeps it as a permanent page. Each event page contains its schedule, host, location, description, and community submissions. Upcoming events encourage participation; past events become a read-only knowledge archive.

## Product goals

- Help members quickly understand what events are coming next.
- Preserve event knowledge for attendees and non-attendees.
- Let any community member contribute a submission to an upcoming event.
- Give moderators control over event information and inappropriate submissions.
- Show community participation through event and submission activity.
- Maintain a clear, browsable archive of past events.

## People and permissions

### Community member or visitor

A public visitor can:

- View all upcoming and past events.
- Open an event to see its full details.
- Browse and download public submissions.
- Add a submission to an upcoming event without needing moderator access.

A public visitor cannot:

- Create or edit an event.
- Add submissions to a past event.
- Delete any submission.

### Moderator

A moderator can:

- Create an upcoming event.
- Edit its image, title, host, schedule, location, and description.
- Review all submissions.
- Delete a submission when necessary.

Past events remain read-only, including for moderators, so the archive accurately reflects what was published for the completed event.

## Core product journey

### 1. Discover an event

The homepage immediately introduces Hopamine events and separates them into two groups:

- **Current events:** all upcoming events, ordered by the next event date.
- **Past events:** the five most recently completed events, using more subdued colors.

Each event card includes an image, name, host, date, time, and location. Selecting any part of the card opens the event page. A “See all past events” link opens the complete archive.

### 2. Understand the event

The event page provides a focused view containing:

- Event image
- Event name and host
- Date and time
- Virtual location
- Full description
- Number of community submissions
- Link to browse submissions

For upcoming events, authenticated moderators also see an edit action. For past events, the page is read-only.

### 3. Browse shared knowledge

The submissions page lists everything contributed to that event. Each row shows the submission title, contributor username, and posting date. Selecting a row opens the full submission.

An upcoming event also shows an “Add submission” action. Past events continue to show their existing submissions but do not allow new ones.

### 4. Add a submission

Any member can contribute to an upcoming event by entering:

- Username
- Submission title
- Submission date
- Short description
- One or more files

The form clearly explains that uploaded files must be `.doc`, `.docx`, `.pdf`, or `.png`, and that web links should be placed in the description. After validation and upload, the new submission becomes publicly visible under the event.

### 5. Read or download a submission

The submission detail page shows:

- Parent event name
- Submission title
- Contributor username
- Submission date
- Description
- Downloadable files

Only a moderator sees the delete action.

## Content lifecycle

1. A moderator creates an event.
2. The event appears under Current events.
3. Members view it and add relevant submissions.
4. The event date passes.
5. The event automatically moves to Past events.
6. Its details and submissions remain publicly accessible, but editing and new submissions are disabled.

## Visual direction

The interface will follow the existing shadcn Lyra design system:

- White backgrounds for clarity and readability
- Light blue surfaces for supporting sections
- Deep blue for navigation, headings, and primary actions
- Black or dark slate for body text
- Yellow highlights for important community and action moments
- Muted blue-gray styling for past events
- Left-to-right layouts with strong alignment and readable spacing
- Rounded event cards and panels, without making controls look excessively pill-shaped

The project already includes the Lyra-styled shell, homepage event cards, mock data, a create-event form, and an initial Cloudflare D1 events API. The implementation below completes the routes, permissions, submissions, uploads, and persistent data flows.

## 1. Stabilize the existing foundation

- Preserve the current React, TanStack Router, Hono, Cloudflare Worker, and D1 architecture.
- Reconcile the currently deleted event-detail, submissions, and past-events routes before building on them.
- Keep `src/index.css` and `vite.config.ts` unchanged.
- Continue using the installed shadcn Lyra components and Phosphor icons.
- Preserve the white, blue, black, and yellow visual system, with subdued styling for past events.

## 2. Define the data and storage model

Extend D1 with:

- `events`
  - Name, host, date/time, location, description, and category
  - Event image reference
  - Created and updated timestamps
- `submissions`
  - Event ID, username, title, description, and submitted date
  - Created timestamp
- `submission_files`
  - Submission ID, filename, MIME type, size, and storage key
- Optional moderation fields such as deletion timestamp and moderator audit information

Use Cloudflare R2 for uploaded event images and submission files. Enforce the requested formats: `.doc`, `.docx`, `.pdf`, and `.png`, with explicit size and file-count limits.

Calculate event status from its date so an upcoming event automatically becomes a past event.

## 3. Add authentication and permissions

Implement two access levels:

- Public visitors:
  - View every event and submission
  - Add submissions to upcoming events
- Moderators:
  - Create and edit events
  - Upload or replace event images
  - Delete submissions

Enforce permissions in the Worker API, not only by hiding buttons in the interface. Past events must reject event edits and new submissions at the API level.

## 4. Complete the backend API

Add endpoints for:

- Listing upcoming and past events
- Fetching one event by slug
- Creating and updating an event
- Listing submissions for an event
- Fetching one submission
- Creating a submission with files
- Secure file download
- Moderator-only submission deletion

Add schema validation, duplicate and invalid upload handling, useful error responses, upload cleanup when a request fails, and basic public-submission rate limiting.

## 5. Finish the public pages

Build or restore these routes:

- `/` — homepage
- `/events/past` — complete past-event archive
- `/events/:eventSlug` — event details
- `/events/:eventSlug/submissions` — submission list
- `/events/:eventSlug/submissions/new` — add-submission form
- `/events/:eventSlug/submissions/:submissionId` — submission details and downloads

Homepage behavior:

- Show all upcoming events.
- Show the five most recent past events.
- Keep past cards visibly more muted.
- Ensure each complete event card is clickable.
- Retain the requested header, contact link, Discord link, heading, and footer.

## 6. Build the event experience

The event-detail page will include:

- Breadcrumbs
- Event image
- Name, host, date, time, and location
- Description
- Clear link to submissions
- Submission count
- Moderator-only edit action for upcoming events

Past-event pages will use the same structure but expose no editing or submission-creation controls.

## 7. Build the submission workflow

The submissions page will show rows containing:

- File-type icon
- Submission title
- Username
- Posted date
- Link to the detail view
- “Add submission” action only for upcoming events

The submission form will include:

- Username
- Post title
- Date, defaulted to the current date
- Short description
- Multi-file upload
- Notice that links belong in the description
- Notice listing accepted file types

The detail page will show the event name, submission metadata, description, downloadable files, and a moderator-only delete action.

## 8. Cover interface states and accessibility

Add intentional handling for:

- No upcoming events
- No past events
- No submissions yet
- Missing event or submission
- Loading and submission progress
- Upload validation errors
- Failed network requests
- Successful creation or deletion

Ensure keyboard navigation, visible focus styles, accessible labels, readable contrast, responsive mobile layouts, and no horizontal overflow.

## 9. Validate the finished workflow

Verify:

- Public users cannot create or edit events.
- Public users can submit only to upcoming events.
- Past events reject new submissions and edits.
- Only moderators can delete submissions.
- Unsupported files are rejected client- and server-side.
- Direct file URLs cannot bypass intended access rules.
- Homepage ordering and five-event archive preview are correct.
- All routes work after refresh.
- The production build and D1 migrations succeed.

## Requirement decision

The existing mock data includes `.pptx`, while the requested upload rules allow only `doc`, `docx`, `pdf`, and `png`. The implementation should enforce the explicitly listed formats and remove PPTX from the mocks unless presentation files are later approved.
