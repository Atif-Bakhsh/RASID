import {
  registerDecorator,
  ValidateIf,
  ValidationOptions,
} from 'class-validator';
import { Transform } from 'class-transformer';

/** Unlike IsOptional, this still validates explicit null. */
export const Optional = () =>
  ValidateIf((_object: unknown, value: unknown) => value !== undefined);
export const Trim = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );

export function isCalendarDate(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^(20\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value) &&
    new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value
  );
}

export function CalendarDate(options?: ValidationOptions): PropertyDecorator {
  return (object, propertyName) =>
    registerDecorator({
      name: 'calendarDate',
      target: object.constructor,
      propertyName: String(propertyName),
      options,
      validator: {
        validate: isCalendarDate,
        defaultMessage: () =>
          'must be a real YYYY-MM-DD date between 2000 and 2099',
      },
    });
}

export function Timezone(): PropertyDecorator {
  return (object, propertyName) =>
    registerDecorator({
      name: 'timezone',
      target: object.constructor,
      propertyName: String(propertyName),
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string' || value.length > 100) return false;
          try {
            new Intl.DateTimeFormat('en', { timeZone: value });
            return true;
          } catch {
            return false;
          }
        },
        defaultMessage: () => 'timezone must be a valid IANA timezone',
      },
    });
}
