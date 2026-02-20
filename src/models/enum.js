// enums.js

export const EVENT_STATUS = {
    DRAFT: "DRAFT",
    UPCOMING: "UPCOMING",
    PUBLISHED: "PUBLISHED",
    CANCELLED: "CANCELLED",
    COMPLETED: "COMPLETED",
  };
  
  export const BOOKING_STATUS = {
    PENDING: "PENDING",
    CONFIRMED: "CONFIRMED",
    CANCELLED: "CANCELLED",
    FAILED: "FAILED",
  };
  
  export const PAYMENT_STATUS = {
    UNPAID: "UNPAID",
    PAID: "PAID",
    REFUNDED: "REFUNDED",
  };
  
  export const SEAT_STATUS = {
    AVAILABLE: "AVAILABLE",
    RESERVED: "RESERVED",
    BOOKED: "BOOKED",
  };
  
  export const NOTIFICATION_TYPE = {
    EMAIL: "EMAIL",
    SMS: "SMS",
    PUSH: "PUSH",
  };
  
  export const TICKET_STATUS = {
    ACTIVE: "ACTIVE",
    USED: "USED",
    CANCELLED: "CANCELLED",
  };
  
  export const USER_ROLE = {
    ADMIN: "ADMIN",
    STUDENT: "STUDENT",
  };