/**
 * api/dashboard.ts — wrappers for dashboard-app endpoints.
 *
 * Endpoints confirmed against apps/dashboard/urls.py (mounted at api/dashboard/):
 *   GET  dashboard/user/summary/          user summary
 *   GET  dashboard/user/tickets/upcoming/ upcoming tickets
 *   GET  dashboard/user/tickets/history/  ticket history
 *   GET  dashboard/user/payments/         payment history
 *   GET  dashboard/user/events/upcoming/  upcoming events for user
 *   GET  dashboard/user/activity/         recent activity
 *   GET  dashboard/notifications/         notifications (shared)
 *   GET  dashboard/organizer/summary/     organizer summary
 *   GET  dashboard/organizer/events/      organizer events list (dashboard view)
 *   GET  dashboard/organizer/statistics/revenue/
 *   GET  dashboard/organizer/statistics/tickets/
 *   GET  dashboard/organizer/orders/recent/
 *
 * There is NO shared /api/dashboard/ route — the existing code calling
 * GET /dashboard/ was wrong. Each role calls its own endpoint.
 */
import client from './client'
import type { UserDashboardSummary, OrganizerDashboardSummary } from '../types/dashboard'

export const getUserSummary = () =>
  client.get<UserDashboardSummary>('/dashboard/user/summary/')

export const getOrganizerSummary = () =>
  client.get<OrganizerDashboardSummary>('/dashboard/organizer/summary/')

export const getUserUpcomingTickets = () =>
  client.get('/dashboard/user/tickets/upcoming/')

export const getUserTicketHistory = () =>
  client.get('/dashboard/user/tickets/history/')

export const getUserPayments = () =>
  client.get('/dashboard/user/payments/')

export const getUserUpcomingEvents = () =>
  client.get('/dashboard/user/events/upcoming/')

export const getRecentActivity = () =>
  client.get('/dashboard/user/activity/')

export const getNotifications = () =>
  client.get('/dashboard/notifications/')

export const getOrganizerEvents = () =>
  client.get('/dashboard/organizer/events/')

export const getRevenueAnalytics = () =>
  client.get('/dashboard/organizer/statistics/revenue/')

export const getTicketSalesSummary = () =>
  client.get('/dashboard/organizer/statistics/tickets/')

export const getRecentOrders = () =>
  client.get('/dashboard/organizer/orders/recent/')
