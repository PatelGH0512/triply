export enum TripStatus {
  Planning = 'planning',
  Active = 'active',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export enum MemberRole {
  Admin = 'admin',
  Member = 'member',
}

export enum InviteStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Declined = 'declined',
  Expired = 'expired',
}

export enum ActivityIcon {
  Flight = 'flight',
  Hotel = 'hotel',
  Restaurant = 'restaurant',
  Activity = 'activity',
  Transport = 'transport',
  Shopping = 'shopping',
  Beach = 'beach',
  Hiking = 'hiking',
  Museum = 'museum',
  Entertainment = 'entertainment',
  Coffee = 'coffee',
  Bar = 'bar',
  Health = 'health',
  Meeting = 'meeting',
  Other = 'other',
}

export enum ExpenseCategory {
  Food = 'food',
  Transport = 'transport',
  Accommodation = 'accommodation',
  Entertainment = 'entertainment',
  Shopping = 'shopping',
  Health = 'health',
  Other = 'other',
}

export enum VoteType {
  Yay = 'yay',
  Nay = 'nay',
}

export enum NotificationType {
  TripInvite = 'trip_invite',
  ActivityAdded = 'activity_added',
  ActivityUpdated = 'activity_updated',
  ExpenseAdded = 'expense_added',
  ExpenseSettled = 'expense_settled',
  Message = 'message',
  TripUpdated = 'trip_updated',
  MemberJoined = 'member_joined',
}
