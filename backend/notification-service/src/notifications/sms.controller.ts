import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { SmsService } from './sms.service';

type SendSmsDto = {
  phoneNumber?: string;
  message?: string;
};

@Controller('sms')
export class SmsController {
  constructor(private readonly sms: SmsService) {}

  @Post('send')
  async send(@Body() dto: SendSmsDto) {
    const phoneNumber = dto.phoneNumber?.trim();
    const message = dto.message?.trim();
    if (!phoneNumber) {
      throw new BadRequestException('phoneNumber is required');
    }
    if (!message) {
      throw new BadRequestException('message is required');
    }
    const result = await this.sms.send(phoneNumber, message);
    return {
      ok: result.success,
      provider: result.provider,
      to: result.to,
      sid: result.sid,
      code: result.code,
      error: result.error,
    };
  }
}
