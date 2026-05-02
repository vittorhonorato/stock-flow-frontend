export class BrInputMaskUtil {
  static onlyDigits(value: string): string {
    return value.replace(/\D+/g, '');
  }

  static normalizeSpaces(value: string): string {
    return value.trim().replace(/\s+/g, ' ');
  }

  static normalizeEmail(value: string): string {
    return value.trim().toLowerCase();
  }

  static normalizeUf(value: string): string {
    return value.trim().toUpperCase().slice(0, 2);
  }

  static formatCpfCnpj(value: string): string {
    const digits = this.onlyDigits(value).slice(0, 14);

    if (digits.length <= 11) {
      return this.formatCpfProgressive(digits);
    }

    return this.formatCnpjProgressive(digits);
  }

  static formatPhone(value: string): string {
    const digits = this.onlyDigits(value).slice(0, 11);

    if (digits.length <= 2) {
      return digits;
    }

    const ddd = digits.slice(0, 2);
    const rest = digits.slice(2);

    if (rest.length <= 4) {
      return `(${ddd}) ${rest}`;
    }

    if (rest.length <= 8) {
      return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
    }

    return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
  }

  private static formatCpfProgressive(digits: string): string {
    if (digits.length <= 3) {
      return digits;
    }

    if (digits.length <= 6) {
      return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    }

    if (digits.length <= 9) {
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    }

    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  private static formatCnpjProgressive(digits: string): string {
    if (digits.length <= 2) {
      return digits;
    }

    if (digits.length <= 5) {
      return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    }

    if (digits.length <= 8) {
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    }

    if (digits.length <= 12) {
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    }

    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  }
}
