import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import type { ApiRequest } from '../../common/http';

export const PUBLIC_ROUTE = 'rasid:public';
export const Public = () => SetMetadata(PUBLIC_ROUTE, true);
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) =>
    ctx.switchToHttp().getRequest<ApiRequest>().identity.userId,
);
