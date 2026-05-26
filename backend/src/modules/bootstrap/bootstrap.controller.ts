import { Controller, Get, Post, Body } from '@nestjs/common';
import { BootstrapService } from './bootstrap.service';
import { SetupDto } from './dto/setup.dto';
import { Public } from '../../common/decorators/public.decorator';

@Controller('bootstrap')
export class BootstrapController {
  constructor(private readonly bootstrapService: BootstrapService) {}

  @Public()
  @Get('status')
  async status() {
    return this.bootstrapService.getStatus();
  }

  @Public()
  @Post('setup')
  async setup(@Body() dto: SetupDto) {
    return this.bootstrapService.setup(dto);
  }
}
