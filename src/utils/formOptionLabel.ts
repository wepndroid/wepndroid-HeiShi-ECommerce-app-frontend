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

export function findOptionKeyByLabel(
  options: FormOptionDto[] | undefined,
  label: string,
  language: string,
): string {
  const trimmed = label.trim();
  if (!trimmed || !options?.length) return '';
  const match = options.find(
    (item) =>
      formOptionLabel(item, language) === trimmed ||
      item.labelEn === trimmed ||
      item.labelZh === trimmed,
  );
  return match?.key ?? '';
}