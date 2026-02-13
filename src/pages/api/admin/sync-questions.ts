import type { APIRoute } from 'astro';
import { getSupabaseClientFromEnv } from '../../../lib/supabase';

interface QuestionRow {
  id?: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
  subject: string;
  difficulty: string;
  image_url?: string;
  video_url?: string;
  video_type?: string;
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = getSupabaseClientFromEnv(locals?.runtime?.env);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Check if user is admin
    const db = locals.runtime.env.DB;
    const adminCheck = await db.prepare(`
      SELECT is_admin FROM users WHERE id = ?
    `).bind(user.id).first();

    if (!adminCheck || !adminCheck.is_admin) {
      return new Response(JSON.stringify({ error: 'Access denied. Admin only.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Get Google Sheets credentials from environment
    const googleCredsJson = locals?.runtime?.env?.GOOGLE_SHEETS_CREDENTIALS;
    const spreadsheetId = locals?.runtime?.env?.GOOGLE_SHEET_ID;

    if (!googleCredsJson || !spreadsheetId) {
      return new Response(JSON.stringify({ 
        error: 'Google Sheets not configured. Please add GOOGLE_SHEETS_CREDENTIALS and GOOGLE_SHEET_ID to environment variables.' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. Parse credentials
    let credentials;
    try {
      credentials = JSON.parse(googleCredsJson);
    } catch (e) {
      return new Response(JSON.stringify({ 
        error: 'Invalid Google Sheets credentials format.' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 5. Authenticate with Google Sheets API (dynamic import to avoid bundling)
    const { google } = await import('googleapis');
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 6. Read data from Google Sheet
    const range = 'Sheet1!A2:M'; // Assuming headers in row 1, data starts row 2
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No data found in Google Sheet.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 7. Process and validate data
    const questions: QuestionRow[] = [];
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 because row 1 is headers, array is 0-indexed

      // Skip empty rows
      if (!row || row.length === 0 || !row[1]) continue;

      // Validate required fields
      if (!row[1] || !row[2] || !row[3] || !row[4] || !row[5] || !row[6] || !row[7] || !row[8] || !row[9]) {
        errors.push(`Row ${rowNum}: Missing required fields`);
        continue;
      }

      // Validate correct_answer format
      const correctAnswer = row[6].trim().toUpperCase();
      if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
        errors.push(`Row ${rowNum}: correct_answer must be A, B, C, or D`);
        continue;
      }

      // Validate difficulty
      const difficulty = row[9].trim().toLowerCase();
      if (!['easy', 'medium', 'hard'].includes(difficulty)) {
        errors.push(`Row ${rowNum}: difficulty must be easy, medium, or hard`);
        continue;
      }

      const question: QuestionRow = {
        id: row[0] ? parseInt(row[0]) : undefined,
        question_text: row[1].trim(),
        option_a: row[2].trim(),
        option_b: row[3].trim(),
        option_c: row[4].trim(),
        option_d: row[5].trim(),
        correct_answer: correctAnswer,
        explanation: row[7].trim(),
        subject: row[8].trim(),
        difficulty: difficulty,
        image_url: row[10] ? row[10].trim() : null,
        video_url: row[11] ? row[11].trim() : null,
        video_type: row[12] ? row[12].trim().toLowerCase() : null,
      };

      questions.push(question);
    }

    // 8. Sync to database
    let added = 0;
    let updated = 0;
    const syncErrors: string[] = [];

    for (const question of questions) {
      try {
        if (question.id) {
          // Update existing question
          await db.prepare(`
            UPDATE questions 
            SET 
              question_text = ?,
              option_a = ?,
              option_b = ?,
              option_c = ?,
              option_d = ?,
              correct_answer = ?,
              explanation = ?,
              subject = ?,
              difficulty = ?,
              image_url = ?,
              video_url = ?,
              video_type = ?
            WHERE id = ?
          `).bind(
            question.question_text,
            question.option_a,
            question.option_b,
            question.option_c,
            question.option_d,
            question.correct_answer,
            question.explanation,
            question.subject,
            question.difficulty,
            question.image_url,
            question.video_url,
            question.video_type,
            question.id
          ).run();
          updated++;
        } else {
          // Insert new question
          await db.prepare(`
            INSERT INTO questions (
              question_text, option_a, option_b, option_c, option_d,
              correct_answer, explanation, subject, difficulty,
              image_url, video_url, video_type
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            question.question_text,
            question.option_a,
            question.option_b,
            question.option_c,
            question.option_d,
            question.correct_answer,
            question.explanation,
            question.subject,
            question.difficulty,
            question.image_url,
            question.video_url,
            question.video_type
          ).run();
          added++;
        }
      } catch (err) {
        syncErrors.push(`Failed to sync question: ${question.question_text.substring(0, 50)}... - ${err}`);
      }
    }

    // 9. Log sync activity
    await db.prepare(`
      INSERT INTO sync_logs (user_id, questions_added, questions_updated, errors, synced_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(
      user.id,
      added,
      updated,
      JSON.stringify([...errors, ...syncErrors])
    ).run();

    // 10. Return results
    return new Response(JSON.stringify({
      success: true,
      added,
      updated,
      total: added + updated,
      validationErrors: errors,
      syncErrors,
      message: `Successfully synced ${added + updated} questions (${added} added, ${updated} updated)`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[sync-questions.ts] Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to sync questions',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};




