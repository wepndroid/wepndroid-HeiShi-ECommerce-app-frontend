/** Leave Feedback criteria (1–5 stars each). */
export const REVIEW_CRITERION_KEYS = [
  'quality',
  'communication',
  'trustement',
] as const;

export type ReviewCriterionKey = (typeof REVIEW_CRITERION_KEYS)[number];

export interface ReviewCriteriaDto {
  quality: number;
  communication: number;
  trustement: number;
}

export type ReviewCriteriaDraft = Record<ReviewCriterionKey, number>;

export const EMPTY_REVIEW_CRITERIA: ReviewCriteriaDraft = {
  quality: 0,
  communication: 0,
  trustement: 0,
};

export function isReviewCriteriaComplete(criteria: ReviewCriteriaDraft): boolean {
  return REVIEW_CRITERION_KEYS.every((key) => criteria[key] >= 1 && criteria[key] <= 5);
}

export function criteriaOverallRating(criteria: ReviewCriteriaDto): number {
  const sum = REVIEW_CRITERION_KEYS.reduce((acc, key) => acc + criteria[key], 0);
  return Math.round(sum / REVIEW_CRITERION_KEYS.length);
}
