import {
  TripStatus,
  MemberRole,
  ActivityIcon,
  ExpenseCategory,
  NotificationType,
  InviteStatus,
  VoteType,
} from '@/constants/enums';

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Trip {
  id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  start_date: string;
  end_date: string;
  status: TripStatus;
  admin_id: string;
  invite_code: string;
  created_at: string;
  updated_at: string;
}

export interface TripDestination {
  id: string;
  trip_id: string;
  name: string;
  place_id: string | null;
  latitude: number | null;
  longitude: number | null;
  order: number;
  created_at: string;
}

export interface TripMember {
  id: string;
  trip_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
  user?: User;
}

export interface TripInvite {
  id: string;
  trip_id: string;
  invited_by: string;
  invited_email: string | null;
  invited_phone: string | null;
  status: InviteStatus;
  created_at: string;
  expires_at: string | null;
}

export interface Day {
  id: string;
  trip_id: string;
  date: string;
  label: string | null;
  order: number;
  created_at: string;
}

export interface Activity {
  id: string;
  trip_id: string;
  day_id: string;
  title: string;
  description: string | null;
  icon: ActivityIcon;
  location_name: string | null;
  place_id: string | null;
  latitude: number | null;
  longitude: number | null;
  start_time: string | null;
  end_time: string | null;
  estimated_cost: number | null;
  currency: string;
  order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  media?: ActivityMedia[];
  links?: ActivityLink[];
}

export interface ActivityMedia {
  id: string;
  activity_id: string;
  url: string;
  type: 'image' | 'video' | 'pdf';
  uploaded_by: string;
  created_at: string;
}

export interface ActivityLink {
  id: string;
  activity_id: string;
  title: string;
  url: string;
  created_at: string;
}

export interface ActivityVote {
  id: string;
  activity_id: string;
  user_id: string;
  vote: VoteType;
  created_at: string;
}

export interface Document {
  id: string;
  trip_id: string;
  name: string;
  url: string;
  type: string;
  size: number | null;
  uploaded_by: string;
  created_at: string;
}

export interface PackingListItem {
  id: string;
  trip_id: string;
  name: string;
  category: string | null;
  quantity: number;
  created_by: string;
  created_at: string;
  checks?: PackingListCheck[];
}

export interface PackingListCheck {
  id: string;
  item_id: string;
  user_id: string;
  checked: boolean;
  updated_at: string;
  user?: User;
}

export interface Message {
  id: string;
  trip_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: User;
}

export interface Expense {
  id: string;
  trip_id: string;
  activity_id: string | null;
  paid_by: string;
  title: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  receipt_url: string | null;
  created_at: string;
  updated_at: string;
  splits?: ExpenseSplit[];
  payer?: User;
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  user_id: string;
  amount: number;
  settled: boolean;
  settled_at: string | null;
  user?: User;
}

export interface TripMemberWithUser extends Omit<TripMember, 'user'> {
  users: Pick<User, 'id' | 'full_name' | 'avatar_url'> | null;
}

export interface TripWithDetails extends Trip {
  trip_destinations: TripDestination[];
  trip_members: TripMemberWithUser[];
}

export interface Notification {
  id: string;
  user_id: string;
  trip_id: string | null;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}
