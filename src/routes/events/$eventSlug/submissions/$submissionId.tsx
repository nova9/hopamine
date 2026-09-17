import { createFileRoute, notFound } from '@tanstack/react-router'

import { getEventBySlug, getSubmissionById } from '@/mocks/data'

export const Route = createFileRoute(
  '/events/$eventSlug/submissions/$submissionId',
)({
  loader: ({ params }) => {
    const event = getEventBySlug(params.eventSlug)
    const submission = getSubmissionById(params.submissionId)

    if (!event || !submission || submission.eventId !== event.id) {
      throw notFound()
    }

    return { event, submission }
  },
  component: SubmissionPage,
})

function SubmissionPage() {
  const { event, submission } = Route.useLoaderData()

  return (
    <main className="mx-auto max-w-4xl px-5 py-12 lg:px-8 lg:py-16">
      <p className="text-sm font-medium text-blue-700">{event.name}</p>
      <h1 className="mt-3 font-heading text-4xl font-bold tracking-tight text-blue-950">
        {submission.title}
      </h1>
      <p className="mt-3 text-sm text-slate-500">
        {submission.username} · {formatDate(submission.createdAt)}
      </p>
      <p className="mt-8 text-base leading-7 text-slate-600">
        {submission.description}
      </p>
    </main>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(
    new Date(value),
  )
}
