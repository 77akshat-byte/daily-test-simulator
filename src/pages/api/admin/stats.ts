import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const db = locals.runtime.env.DB;

    const [questionsCount, attemptsCount, dailySetsCount] = await Promise.all([
      db.prepare('SELECT COUNT(*) as count FROM questions').first(),
      db.prepare('SELECT COUNT(*) as count FROM test_attempts').first(),
      db.prepare('SELECT COUNT(*) as count FROM daily_question_sets').first(),
    ]);

    const recentAttempts = await db.prepare(`
      SELECT 
        test_date,
        COUNT(*) as attempts,
        AVG(score) as avg_score,
        MAX(score) as max_score,
        MIN(score) as min_score
      FROM test_attempts
      WHERE completed_at IS NOT NULL
      GROUP BY test_date
      ORDER BY test_date DESC
      LIMIT 10
    `).all();

    // Get detailed user attempts with scores
    const userAttempts = await db.prepare(`
      SELECT 
        user_id,
        test_date,
        score,
        total_questions,
        completed_at,
        started_at
      FROM test_attempts
      WHERE completed_at IS NOT NULL
      ORDER BY completed_at DESC
      LIMIT 100
    `).all();

    // Get top performers
    const topPerformers = await db.prepare(`
      SELECT 
        user_id,
        COUNT(*) as tests_taken,
        AVG(score) as avg_score,
        MAX(score) as best_score,
        MIN(score) as lowest_score
      FROM test_attempts
      WHERE completed_at IS NOT NULL
      GROUP BY user_id
      ORDER BY avg_score DESC, tests_taken DESC
      LIMIT 20
    `).all();

    const subjectBreakdown = await db.prepare(`
      SELECT 
        subject,
        COUNT(*) as count
      FROM questions
      GROUP BY subject
      ORDER BY count DESC
    `).all();

    return new Response(JSON.stringify({
      totalQuestions: questionsCount?.count || 0,
      totalAttempts: attemptsCount?.count || 0,
      totalDailySets: dailySetsCount?.count || 0,
      recentAttempts: recentAttempts.results,
      userAttempts: userAttempts.results,
      topPerformers: topPerformers.results,
      subjectBreakdown: subjectBreakdown.results,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch stats' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

