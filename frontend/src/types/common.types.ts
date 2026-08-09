export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface DetailResponse {
  detail: string;
}

export type RoleEnum = 'USER' | 'ORGANIZER' | 'ADMIN';
export type StatusDd4Enum = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PUBLISHED' | 'ARCHIVED';
export type Status390Enum = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
export type TicketStatusEnum = 'VALID' | 'CHECKED_IN' | 'CANCELLED';
export type VisibilityEnum = 'PUBLIC' | 'UNLISTED';
export type ProviderEnum = 'ESEWA' | 'KHALTI';
export type ActionEnum = 'approve' | 'reject';
