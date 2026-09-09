export type RsvpStatus = 'in' | 'out';

export interface Plan {
  id: string;
  groupId: string;
  createdBy: string;
  title: string;
  details: string | null;
  location: string | null;
  startsAt: string;
}

/** A plan plus the viewer's RSVP and the going count. */
export interface PlanWithRsvp extends Plan {
  goingCount: number;
  myStatus: RsvpStatus | null;
}
