import apiClient from './client';

/**
 * GET /api/tickets/stats
 * Response: TicketStats { total, by_status, by_priority, by_category }
 */
export async function getTicketStats() {
  const { data } = await apiClient.get('/api/tickets/stats');
  return data;
}

/**
 * GET /api/tickets
 * Query params: status, priority, category, search, skip, limit
 * Response: TicketListResponse { items: TicketRead[], total, skip, limit }
 */
export async function listTickets({
  status = null,
  priority = null,
  category = null,
  search = '',
  skip = 0,
  limit = 50,
} = {}) {
  const params = { skip, limit };
  if (status) params.status = status;
  if (priority) params.priority = priority;
  if (category) params.category = category;
  if (search && search.trim()) params.search = search.trim();

  const { data } = await apiClient.get('/api/tickets', { params });
  return data;
}

/**
 * GET /api/tickets/{ticket_id}
 * Response: TicketDetail { ...TicketRead, activities: TicketActivityRead[] }
 */
export async function getTicket(ticketId) {
  const { data } = await apiClient.get(`/api/tickets/${ticketId}`);
  return data;
}

/**
 * POST /api/tickets
 * Request: TicketCreate { title, description }
 * Response: TicketDetail
 */
export async function createTicket({ title, description }) {
  const { data } = await apiClient.post('/api/tickets', {
    title: title.trim(),
    description: description.trim(),
  });
  return data;
}

/**
 * PATCH /api/tickets/{ticket_id}
 * Request: TicketUpdate { title?, description?, status?, priority?, category?, assigned_to_id? }
 * Response: TicketDetail
 */
export async function updateTicket(ticketId, payload) {
  const { data } = await apiClient.patch(`/api/tickets/${ticketId}`, payload);
  return data;
}

/**
 * DELETE /api/tickets/{ticket_id}
 * Response: 204 No Content
 */
export async function deleteTicket(ticketId) {
  await apiClient.delete(`/api/tickets/${ticketId}`);
}

/**
 * POST /api/tickets/{ticket_id}/triage
 * Response: TicketDetail
 */
export async function triageTicket(ticketId) {
  const { data } = await apiClient.post(`/api/tickets/${ticketId}/triage`);
  return data;
}
