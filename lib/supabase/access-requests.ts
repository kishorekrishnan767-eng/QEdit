import { createClient } from '@/lib/supabase/client';

export interface AccessRequest {
  id: string;
  paper_id: string;
  requester_email: string;
  requester_name?: string;
  message?: string;
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
}

const supabase = () => createClient();

// Submit a request to access a paper
export async function requestAccess(
  paperId: string,
  requesterEmail: string,
  requesterName?: string,
  message?: string
): Promise<AccessRequest | null> {
  const { data, error } = await supabase()
    .from('access_requests')
    .insert({
      paper_id: paperId,
      requester_email: requesterEmail,
      requester_name: requesterName,
      message,
    })
    .select()
    .single();

  if (error) {
    console.error('Error requesting access:', error.message);
    return null;
  }
  return data as AccessRequest;
}

// Get pending requests for papers owned by someone (for the owner to review)
export async function getPendingRequests(paperId: string): Promise<AccessRequest[]> {
  const { data, error } = await supabase()
    .from('access_requests')
    .select('*')
    .eq('paper_id', paperId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching requests:', error.message);
    return [];
  }
  return (data || []) as AccessRequest[];
}

// Approve a request (owner only)
export async function approveRequest(requestId: string): Promise<boolean> {
  const { error } = await supabase()
    .from('access_requests')
    .update({ status: 'approved' })
    .eq('id', requestId);

  if (error) {
    console.error('Error approving request:', error.message);
    return false;
  }
  return true;
}

// Deny a request (owner only)
export async function denyRequest(requestId: string): Promise<boolean> {
  const { error } = await supabase()
    .from('access_requests')
    .update({ status: 'denied' })
    .eq('id', requestId);

  if (error) {
    console.error('Error denying request:', error.message);
    return false;
  }
  return true;
}

// Check if requester already sent a request
export async function getMyRequest(paperId: string, requesterEmail: string): Promise<AccessRequest | null> {
  const { data, error } = await supabase()
    .from('access_requests')
    .select('*')
    .eq('paper_id', paperId)
    .eq('requester_email', requesterEmail)
    .single();

  if (error) return null;
  return data as AccessRequest;
}
