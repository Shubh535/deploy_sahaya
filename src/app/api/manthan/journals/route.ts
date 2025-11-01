import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../utils/auth';
import { saveJournalEntry, getUserJournals, getJournalEntry, updateJournalEntry, deleteJournalEntry } from '../../../manthan/journalService';

/**
 * GET /api/manthan/journals
 * Get all journals for the authenticated user with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;
    const uid = (authResult as any).uid;

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const mood = searchParams.get('mood') || undefined;
    const tags = searchParams.get('tags')?.split(',') || undefined;
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

    const journals = await getUserJournals(uid, { limit, mood, tags, startDate, endDate });
    
    return NextResponse.json({ journals });
  } catch (error: any) {
    console.error('Error fetching journals:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch journals' }, { status: 500 });
  }
}

/**
 * POST /api/manthan/journals
 * Create a new journal entry
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[POST /api/manthan/journals] Request received');
    
    const authResult = await requireAuth(request);
    console.log('[POST /api/manthan/journals] Auth result:', authResult);
    
    if (authResult instanceof Response) {
      console.log('[POST /api/manthan/journals] Auth failed, returning 401');
      return authResult;
    }
    
    const uid = (authResult as any).uid;
    console.log('[POST /api/manthan/journals] User ID:', uid);

    const body = await request.json();
    console.log('[POST /api/manthan/journals] Request body:', body);
    
    const { title, content, mood, tags, insights } = body;

    if (!content || !mood) {
      console.log('[POST /api/manthan/journals] Missing required fields');
      return NextResponse.json({ error: 'Missing required fields: content, mood' }, { status: 400 });
    }

    console.log('[POST /api/manthan/journals] Attempting to save journal entry');
    const id = await saveJournalEntry({
      uid,
      title: title || `Journal - ${new Date().toLocaleDateString()}`,
      content,
      mood,
      tags: tags || [],
      timestamp: new Date(),
      insights: insights || {},
    });

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Error saving journal:', error);
    return NextResponse.json({ error: error.message || 'Failed to save journal' }, { status: 500 });
  }
}

/**
 * PUT /api/manthan/journals/:id
 * Update an existing journal entry
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;
    const uid = (authResult as any).uid;

    const body = await request.json();
    const { id, title, content, mood, tags, insights } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing journal ID' }, { status: 400 });
    }

    // Verify ownership
    const existingJournal = await getJournalEntry(id);
    if (!existingJournal || existingJournal.uid !== uid) {
      return NextResponse.json({ error: 'Journal not found or unauthorized' }, { status: 404 });
    }

    await updateJournalEntry(id, {
      title,
      content,
      mood,
      tags,
      insights,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating journal:', error);
    return NextResponse.json({ error: error.message || 'Failed to update journal' }, { status: 500 });
  }
}

/**
 * DELETE /api/manthan/journals/:id
 * Delete a journal entry
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;
    const uid = (authResult as any).uid;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing journal ID' }, { status: 400 });
    }

    // Verify ownership
    const existingJournal = await getJournalEntry(id);
    if (!existingJournal || existingJournal.uid !== uid) {
      return NextResponse.json({ error: 'Journal not found or unauthorized' }, { status: 404 });
    }

    await deleteJournalEntry(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting journal:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete journal' }, { status: 500 });
  }
}
