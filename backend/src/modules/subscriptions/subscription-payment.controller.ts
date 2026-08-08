import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { SubscriptionPaymentService } from './subscription-payment.service';
import {
  CreateSubscriptionPaymentDto,
  ReviewSubscriptionPaymentDto,
} from './subscription-payment.dto';
import {
  MinLevel,
  MinOrgLevel,
  ROLE_LEVEL,
} from '../../common/decorators/min-level.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('subscription-payments')
export class SubscriptionPaymentController {
  constructor(private readonly service: SubscriptionPaymentService) {}

  @Get('config')
  @MinOrgLevel(ROLE_LEVEL.employee)
  getConfig() {
    return this.service.getSystemConfig();
  }

  @Get()
  @MinOrgLevel(ROLE_LEVEL.employee)
  findAll(@Query('status') status?: string) {
    return this.service.findAll(status);
  }

  /** Platform admin: cross-tenant payment queue. */
  @Get('admin')
  @MinLevel(ROLE_LEVEL.admin)
  findAllAdmin(@Query('status') status?: string) {
    return this.service.findAllAdmin(status);
  }

  @Post()
  @MinOrgLevel(ROLE_LEVEL.employee)
  create(
    @Body() dto: CreateSubscriptionPaymentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.create(dto, userId);
  }

  /** Platform admin: approve/reject any org's subscription payment. */
  @Patch(':id/review')
  @MinLevel(ROLE_LEVEL.admin)
  review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewSubscriptionPaymentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.review(id, dto, userId);
  }
}
