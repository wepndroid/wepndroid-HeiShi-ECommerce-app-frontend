export type NumericInputKind = 'decimal' | 'integer' | 'phone';

/** Strip invalid characters; report whether any input was rejected. */
export function filterNumericInput(
  next: string,
  kind: NumericInputKind,
): { value: string; rejected: boolean } {
  if (next === '') {
    return { value: '', rejected: false };
  }

  let rejected = false;
  let value = '';

  switch (kind) {
    case 'decimal': {
      let dotUsed = false;
      for (const ch of next) {
        if (ch >= '0' && ch <= '9') {
          value += ch;
        } else if (ch === '.' && !dotUsed) {
          value += ch;
          dotUsed = true;
        } else {
          rejected = true;
        }
      }
      break;
    }
    case 'integer': {
      for (const ch of next) {
        if (ch >= '0' && ch <= '9') {
          value += ch;
        } else {
          rejected = true;
        }
      }
      break;
    }
    case 'phone': {
      for (let i = 0; i < next.length; i += 1) {
        const ch = next[i];
        if (ch >= '0' && ch <= '9') {
          value += ch;
        } else if (ch === '+' && value.length === 0) {
          value += ch;
        } else if (ch === ' ' && value.length > 0) {
          value += ch;
        } else {
          rejected = true;
        }
      }
      break;
    }
  }

  return { value, rejected };
}

export function numericKeyboardType(kind: NumericInputKind): 'decimal-pad' | 'number-pad' | 'phone-pad' {
  switch (kind) {
    case 'decimal':
      return 'decimal-pad';
    case 'integer':
      return 'number-pad';
    case 'phone':
      return 'phone-pad';
  }
}