import { createClient } from '@/lib/supabase/client';
import { Collaboration } from '@/types';

const supabase = () => createClient();

// Add a collaborator to a paper
export async function addCollaborator(
  paperId: string,
  collaboratorEmail: string,
  permission: 'edit' | 'view' = 'edit'
): Promise<Collaboration | null> {
  const { data, error } = await supabase()
    .from('collaborations')
    .insert({
      paper_id: paperId,
      collaborator_email: collaboratorEmail,
      permission,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding collaborator:', error);
    return null;
  }
  return data as Collaboration;
}

// Remove a collaborator
export async function removeCollaborator(collaborationId: string): Promise<boolean> {
  const { error } = await supabase()
    .from('collaborations')
    .delete()
    .eq('id', collaborationId);

  if (error) {
    console.error('Error removing collaborator:', error);
    return false;
  }
  return true;
}

// Update a collaborator's permission
export async function updateCollaboratorPermission(
  collaborationId: string, 
  permission: 'edit' | 'view'
): Promise<boolean> {
  const { error } = await supabase()
    .from('collaborations')
    .update({ permission })
    .eq('id', collaborationId);

  if (error) {
    console.error('Error updating collaborator:', error);
    return false;
  }
  return true;
}

// Get all collaborators for a paper
export async function getCollaborators(paperId: string): Promise<Collaboration[]> {
  const { data, error } = await supabase()
    .from('collaborations')
    .select('*')
    .eq('paper_id', paperId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching collaborators:', error);
    return [];
  }
  return (data || []) as Collaboration[];
}

// Check if a user has access to a paper
export async function checkAccess(
  paperId: string,
  email: string
): Promise<{ hasAccess: boolean; isOwner: boolean; permission?: string }> {
  // Check ownership
  const { data: paper } = await supabase()
    .from('question_papers')
    .select('owner_email')
    .eq('id', paperId)
    .single();

  if (paper?.owner_email === email) {
    return { hasAccess: true, isOwner: true };
  }

  // Check collaboration
  const { data: collab } = await supabase()
    .from('collaborations')
    .select('permission')
    .eq('paper_id', paperId)
    .eq('collaborator_email', email)
    .single();

  if (collab) {
    return { hasAccess: true, isOwner: false, permission: collab.permission };
  }

  return { hasAccess: false, isOwner: false };
}
