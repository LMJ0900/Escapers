export type ReservationStatus = "CONFIRMED" | "COMPLETED";

export interface Reservation {
  id: string;
  themeName: string;
  branchName: string;
  scheduledAt: string;
  headcount: number;
  status: ReservationStatus;
  hasReview: boolean;
}

export type getMyReservationsResponse = Reservation[];
