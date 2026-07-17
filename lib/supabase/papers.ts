import { createClient } from '@/lib/supabase/client';
import { PaperData, QuestionPaperRecord } from '@/types';

const supabase = () => createClient();

// Strip any base64-encoded logo from paper_data before saving (can be very large)
function sanitizePaperData(paperData: PaperData): PaperData {
  const logo = paperData.header.logo;
  const isBase64 = logo && logo.startsWith('data:');
  return {
    ...paperData,
    header: {
      ...paperData.header,
      logo: isBase64 ? '' : logo,
    },
  };
}

// Create a new paper
export async function createPaper(
  ownerEmail: string,
  paperData: PaperData,
  status: 'draft' | 'saved' = 'draft',
  reviewStatus?: string,
  examCategory?: string | null,
  submittedAt?: string | null
): Promise<QuestionPaperRecord | null> {
  const clean = sanitizePaperData(paperData);
  const title = clean.header.subject || clean.header.examName || 'Untitled Paper';
  
  const insertObj: any = {
    title,
    owner_email: ownerEmail,
    status,
    paper_data: clean,
  };
  if (reviewStatus !== undefined) insertObj.review_status = reviewStatus;
  if (examCategory !== undefined) insertObj.exam_category = examCategory;
  if (submittedAt !== undefined) insertObj.submitted_at = submittedAt;

  const { data, error } = await supabase()
    .from('question_papers')
    .insert(insertObj)
    .select()
    .single();

  if (error) {
    console.error('Error creating paper:', error.message, '| Code:', error.code, '| Details:', error.details, '| Hint:', error.hint);
    return null;
  }
  return data as QuestionPaperRecord;
}

// Update an existing paper
export async function updatePaper(
  paperId: string,
  paperData: PaperData,
  status?: 'draft' | 'saved',
  reviewStatus?: string,
  examCategory?: string | null,
  submittedAt?: string | null,
  reviewedBy?: string | null,
  reviewedAt?: string | null
): Promise<boolean> {
  const clean = sanitizePaperData(paperData);
  const title = clean.header.subject || clean.header.examName || 'Untitled Paper';
  
  const updateObj: Record<string, unknown> = {
    title,
    paper_data: clean,
  };
  if (status) updateObj.status = status;
  if (reviewStatus !== undefined) updateObj.review_status = reviewStatus;
  if (examCategory !== undefined) updateObj.exam_category = examCategory;
  if (submittedAt !== undefined) updateObj.submitted_at = submittedAt;
  
  // Explicitly allow setting reviewedBy / reviewedAt to null to clear them
  if (reviewedBy !== undefined) updateObj.reviewed_by = reviewedBy;
  if (reviewedAt !== undefined) updateObj.reviewed_at = reviewedAt;

  const { error } = await supabase()
    .from('question_papers')
    .update(updateObj)
    .eq('id', paperId);

  if (error) {
    console.error('Error updating paper:', error);
    return false;
  }
  return true;
}

// Rename a paper (title only)
export async function renamePaper(paperId: string, newTitle: string): Promise<boolean> {
  const { error } = await supabase()
    .from('question_papers')
    .update({ title: newTitle.trim() || 'Untitled Paper' })
    .eq('id', paperId);

  if (error) {
    console.error('Error renaming paper:', error.message);
    return false;
  }
  return true;
}

// Delete a paper (owner only — enforced by RLS)
export async function deletePaper(paperId: string): Promise<boolean> {
  const { error } = await supabase()
    .from('question_papers')
    .delete()
    .eq('id', paperId);

  if (error) {
    console.error('Error deleting paper:', error);
    return false;
  }
  return true;
}

// Get all papers owned by the current user
export async function getUserPapers(email: string): Promise<QuestionPaperRecord[]> {
  const { data, error } = await supabase()
    .from('question_papers')
    .select('*')
    .eq('owner_email', email)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching papers:', error);
    return [];
  }
  return (data || []) as QuestionPaperRecord[];
}

// Get papers shared with the current user
export async function getSharedPapers(email: string): Promise<QuestionPaperRecord[]> {
  // First get paper IDs from collaborations
  const { data: collabs, error: collabError } = await supabase()
    .from('collaborations')
    .select('paper_id')
    .eq('collaborator_email', email);

  if (collabError || !collabs?.length) return [];

  const paperIds = collabs.map(c => c.paper_id);

  const { data, error } = await supabase()
    .from('question_papers')
    .select('*')
    .in('id', paperIds)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching shared papers:', error);
    return [];
  }
  return (data || []) as QuestionPaperRecord[];
}

// Get a single paper by ID (RLS ensures access control)
export async function getPaperById(paperId: string): Promise<QuestionPaperRecord | null> {
  const { data, error } = await supabase()
    .from('question_papers')
    .select('*')
    .eq('id', paperId)
    .single();

  if (error) {
    // PGRST116 = "no rows" (not found or RLS filtered) — expected, not a real error
    const isExpected =
      error.code === 'PGRST116' ||
      !error.message ||
      Object.keys(error).length === 0;
    if (!isExpected) {
      console.error('Error fetching paper:', error);
    }
    return null;
  }
  return data as QuestionPaperRecord;
}

// Duplicate a paper
export async function duplicatePaper(
  paperId: string,
  ownerEmail: string
): Promise<QuestionPaperRecord | null> {
  const original = await getPaperById(paperId);
  if (!original) return null;

  const paperData = original.paper_data as PaperData;
  const newTitle = `${original.title} (Copy)`;

  const { data, error } = await supabase()
    .from('question_papers')
    .insert({
      title: newTitle,
      owner_email: ownerEmail,
      status: 'draft',
      paper_data: {
        ...paperData,
        header: {
          ...paperData.header,
          subject: paperData.header.subject ? `${paperData.header.subject} (Copy)` : '',
        },
      },
    })
    .select()
    .single();

  if (error) {
    console.error('Error duplicating paper:', error);
    return null;
  }
  return data as QuestionPaperRecord;
}
