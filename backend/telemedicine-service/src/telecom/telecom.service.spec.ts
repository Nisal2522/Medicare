import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { RtcTokenBuilder } from 'agora-access-token';
import { Types } from 'mongoose';
import { TelecomService } from './telecom.service';
import { VideoSession } from './video-session.schema';

describe('TelecomService', () => {
  it('issues token for paid + approved appointment participant', async () => {
    const appointmentId = new Types.ObjectId().toHexString();
    const doctorId = new Types.ObjectId();
    const patientId = new Types.ObjectId();

    const updateOne = jest.fn().mockResolvedValue({
      acknowledged: true,
      modifiedCount: 1,
      matchedCount: 1,
    });

    const configGet = jest.fn((key: string) => {
      if (key === 'AGORA_APP_ID') return 'agora-app-id'
      if (key === 'AGORA_APP_CERTIFICATE') return 'agora-cert'
      if (key === 'APPOINTMENT_SERVICE_URL') return 'http://appointment-service:3003'
      if (key === 'INTERNAL_SERVICE_KEY') return 'test-internal-key'
      return undefined
    });

    const tokenSpy = jest
      .spyOn(RtcTokenBuilder, 'buildTokenWithUid')
      .mockReturnValue('mock-rtc-token');
    const fetchSpy = jest.spyOn(global, 'fetch' as never).mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({
        doctorId: doctorId.toHexString(),
        patientId: patientId.toHexString(),
        patientEmail: 'patient@test.com',
        status: 'CONFIRMED',
        doctorApprovalStatus: 'APPROVED',
      }),
    } as Response);

    const moduleRef = await Test.createTestingModule({
      providers: [
        TelecomService,
        {
          provide: getModelToken(VideoSession.name),
          useValue: { updateOne },
        },
        {
          provide: ConfigService,
          useValue: { get: configGet },
        },
      ],
    }).compile();

    const service = moduleRef.get(TelecomService);
    const out = await service.getRtcToken(
      {
        sub: patientId.toHexString(),
        email: 'patient@test.com',
        role: 'PATIENT',
      },
      appointmentId,
    );

    expect(out.token).toBe('mock-rtc-token');
    expect(out.channelName).toBe(appointmentId);
    expect(fetchSpy).toHaveBeenCalled();
    expect(updateOne).toHaveBeenCalled();
    expect(tokenSpy).toHaveBeenCalled();

    fetchSpy.mockRestore();
    tokenSpy.mockRestore();
  });
});

