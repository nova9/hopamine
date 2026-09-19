export const SUBMISSION_CATEGORIES = [
  { value: "educational", label: "Educational" },
  { value: "network-building", label: "Network Building" },
  { value: "collaborative", label: "Collaborative" },
] as const;

export type SubmissionCategory =
  (typeof SUBMISSION_CATEGORIES)[number]["value"];

export function getSubmissionCategoryLabel(category: SubmissionCategory) {
  return SUBMISSION_CATEGORIES.find((option) => option.value === category)!.label;
}
