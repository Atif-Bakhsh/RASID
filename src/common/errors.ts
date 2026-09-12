import { HttpException, HttpStatus } from '@nestjs/common';

export function fail(
  status: HttpStatus,
  code: string,
  message: string,
  messageAr: string,
): never {
  throw new HttpException({ code, message, messageAr }, status);
}
export function notFound(): never {
  return fail(
    404,
    'RESOURCE_NOT_FOUND',
    'Resource not found.',
    'المورد غير موجود.',
  );
}
export function unauthorized(): never {
  return fail(
    401,
    'UNAUTHENTICATED',
    'Sign in again to continue.',
    'يرجى تسجيل الدخول مجدداً.',
  );
}

export function pgCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  if ('code' in error && typeof error.code === 'string') return error.code;
  if ('driverError' in error) return pgCode(error.driverError);
  return undefined;
}
