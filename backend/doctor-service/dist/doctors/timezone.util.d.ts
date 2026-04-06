export declare const COLOMBO_TZ = "Asia/Colombo";
export declare function withColomboZone<T extends {
    startTime: string;
    endTime: string;
}>(slot: T): T & {
    timeZone: typeof COLOMBO_TZ;
};
export declare function isSlotOrderValid(startTime: string, endTime: string): boolean;
