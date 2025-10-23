/**
 * Message Formatter Utility
 * Transforms raw JSON request data into human-readable formatted messages
 * for all request types (Housekeeping, Room Service, Maintenance, Feedback, etc.)
 */

export interface FormattedMessage {
  title: string;
  description: string;
  items: string[];
  notes?: string;
  icon: string;
  color: string;
  emoji: string;
}

export interface QRRequest {
  id: string;
  request_type: string;
  request_data: Record<string, any>;
  room_id?: string;
  room?: { room_number: string };
  status: string;
  priority?: string;
  created_at: string;
  formatted_summary?: string;
}

/**
 * Format a QR request into a human-readable message
 */
export function formatRequestMessage(request: QRRequest): FormattedMessage {
  const roomNumber = request.room?.room_number;
  const requestData = request.request_data || {};

  // If we have a pre-formatted summary from the database, use it as description
  const baseDescription = request.formatted_summary || '';

  switch (request.request_type) {
    case 'HOUSEKEEPING':
      return formatHousekeepingRequest(requestData, roomNumber, baseDescription);
    
    case 'ROOM_SERVICE':
    case 'DIGITAL_MENU':
      return formatRoomServiceRequest(requestData, roomNumber, baseDescription);
    
    case 'MAINTENANCE':
      return formatMaintenanceRequest(requestData, roomNumber, baseDescription);
    
    case 'FEEDBACK':
      return formatFeedbackRequest(requestData, roomNumber, baseDescription);
    
    case 'WIFI_ACCESS':
      return formatWifiRequest(roomNumber, baseDescription);
    
    default:
      return formatGenericRequest(request.request_type, requestData, roomNumber);
  }
}

function formatHousekeepingRequest(
  data: Record<string, any>,
  roomNumber?: string,
  dbSummary?: string
): FormattedMessage {
  const serviceLabels = data.service_labels || data.services || [];
  const specialRequests = data.special_requests || data.notes || '';

  return {
    title: `Housekeeping Request${roomNumber ? ` — Room ${roomNumber}` : ''}`,
    description: dbSummary || `Guest requested housekeeping services${roomNumber ? ` in Room ${roomNumber}` : ''}`,
    items: serviceLabels,
    notes: specialRequests,
    icon: '🧹',
    color: 'blue',
    emoji: '🧹'
  };
}

function formatRoomServiceRequest(
  data: Record<string, any>,
  roomNumber?: string,
  dbSummary?: string
): FormattedMessage {
  const items = data.items || [];
  const totalAmount = data.total_amount || 0;
  const specialInstructions = data.special_instructions || '';

  const itemStrings = items.map((item: any) => 
    `${item.quantity}x ${item.name} (₦${item.price?.toLocaleString()})`
  );

  return {
    title: `Room Service Order${roomNumber ? ` — Room ${roomNumber}` : ''}`,
    description: dbSummary || `Guest placed a room service order${roomNumber ? ` for Room ${roomNumber}` : ''}`,
    items: [...itemStrings, `**Total: ₦${totalAmount.toLocaleString()}**`],
    notes: specialInstructions,
    icon: '🥘',
    color: 'amber',
    emoji: '🥘'
  };
}

function formatMaintenanceRequest(
  data: Record<string, any>,
  roomNumber?: string,
  dbSummary?: string
): FormattedMessage {
  const issueType = data.issue_type || data.issue || 'Not specified';
  const priority = data.priority || 'medium';
  const description = data.description || '';

  return {
    title: `Maintenance Request${roomNumber ? ` — Room ${roomNumber}` : ''}`,
    description: dbSummary || `Guest reported a maintenance issue${roomNumber ? ` in Room ${roomNumber}` : ''}`,
    items: [
      `**Issue:** ${issueType}`,
      `**Priority:** ${priority.charAt(0).toUpperCase() + priority.slice(1)}`
    ],
    notes: description,
    icon: '🔧',
    color: 'orange',
    emoji: '🔧'
  };
}

function formatFeedbackRequest(
  data: Record<string, any>,
  roomNumber?: string,
  dbSummary?: string
): FormattedMessage {
  const rating = data.rating || 0;
  const category = data.category || 'General';
  const comment = data.comment || '';

  return {
    title: `Guest Feedback${roomNumber ? ` — Room ${roomNumber}` : ''}`,
    description: dbSummary || `Guest provided feedback${roomNumber ? ` from Room ${roomNumber}` : ''}`,
    items: [
      `**Rating:** ${'⭐'.repeat(rating)} (${rating}/5)`,
      `**Category:** ${category}`
    ],
    notes: comment,
    icon: '⭐',
    color: 'purple',
    emoji: '⭐'
  };
}

function formatWifiRequest(roomNumber?: string, dbSummary?: string): FormattedMessage {
  return {
    title: `WiFi Access Request${roomNumber ? ` — Room ${roomNumber}` : ''}`,
    description: dbSummary || `Guest requested WiFi credentials${roomNumber ? ` for Room ${roomNumber}` : ''}`,
    items: ['Guest needs WiFi network name and password'],
    icon: '📶',
    color: 'green',
    emoji: '📶'
  };
}

function formatGenericRequest(
  requestType: string,
  data: Record<string, any>,
  roomNumber?: string
): FormattedMessage {
  return {
    title: `${requestType.replace(/_/g, ' ')}${roomNumber ? ` — Room ${roomNumber}` : ''}`,
    description: `Guest submitted a ${requestType.toLowerCase().replace(/_/g, ' ')} request`,
    items: Object.entries(data)
      .filter(([key]) => key !== 'notes' && key !== 'special_requests')
      .map(([key, value]) => `**${key.replace(/_/g, ' ')}:** ${value}`),
    notes: data.notes || data.special_requests,
    icon: '📝',
    color: 'gray',
    emoji: '📝'
  };
}

/**
 * Get status badge color based on request status
 */
export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    pending: 'yellow',
    acknowledged: 'blue',
    in_progress: 'orange',
    completed: 'green',
    cancelled: 'red'
  };
  return statusColors[status.toLowerCase()] || 'gray';
}

/**
 * Get priority color
 */
export function getPriorityColor(priority: string): string {
  const priorityColors: Record<string, string> = {
    low: 'green',
    medium: 'yellow',
    high: 'orange',
    urgent: 'red'
  };
  return priorityColors[priority.toLowerCase()] || 'gray';
}

/**
 * Format timestamp to relative time (e.g., "2 minutes ago")
 */
export function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}
