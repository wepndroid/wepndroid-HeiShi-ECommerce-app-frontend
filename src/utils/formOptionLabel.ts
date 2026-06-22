import type { FormOptionDto } from '../api/types';

export function formOptionLabel(option: FormOptionDto | undefined, language: string): string {
  if (!option) return '';
  return language.startsWith('zh') ? option.labelZh : option.labelEn;
}

export function findOptionLabel(
  options: FormOptionDto[] | undefined,
  key: string,
  language: string,
): string {
  return formOptionLabel(options?.find((item) => item.key === key), language);
}