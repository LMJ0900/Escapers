import apiClient from "@/api/ApiClient";

import type { getMyReservationsResponse } from "@/api/domain/reservation/getMyReservations/response/getMyReservationsRes";

export class ReservationQuery {
  static readonly getMyReservationsQueryKey = ["reservation", "me"] as const;

  static getMyReservations(): Promise<getMyReservationsResponse> {
    return apiClient<getMyReservationsResponse>({
      urlPath: "/reservation/me",
      method: "GET",
    });
  }
}
