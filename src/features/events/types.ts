export interface EventRoom {
  id: string;
  ticketmasterId: string;
  name: string;
  venue: string | null;
  startsAt: string | null;
  url: string | null;
  goingCount: number;
}
