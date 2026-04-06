export declare class AvailabilitySlotInputDto {
    startTime: string;
    endTime: string;
    maxPatients?: number;
}
export declare class DayAvailabilityInputDto {
    day: string;
    closed: boolean;
    slots: AvailabilitySlotInputDto[];
}
export declare class PatchAvailabilityDto {
    days: DayAvailabilityInputDto[];
}
