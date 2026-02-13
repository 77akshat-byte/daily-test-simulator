
import type { APIRoute } from 'astro';
import { getSupabaseClientFromEnv } from '../../lib/supabase';

interface PlatformStats {
  totalUsers: number;
  totalTestsTaken: number;
  testsToday: number;
  averagePlatformScore: number;
}

interface PersonalStats {
  currentStreak: number;
  longestStreak: number;
  totalTestsCompleted: number;
  averageScore: number;
  bestScore: number;
  lastTestDate: string | null;
}

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Verify authentication
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

    const db = locals.runtime.env.DB;

    // Get platform-wide stats
    const totalUsersQuery = await db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM test_attempts
    `).first();

    const totalTestsQuery = await db.prepare(`
      SELECT COUNT(*) as count
      FROM test_attempts
      WHERE completed_at IS NOT NULL
    `).first();

    const todayStr = new Date().toISOString().split('T')[0];
    const testsTodayQuery = await db.prepare(`
      SELECT COUNT(*) as count
      FROM test_attempts
      WHERE test_date = ?
        AND completed_at IS NOT NULL
    `).bind(todayStr).first();

    const avgScoreQuery = await db.prepare(`
      SELECT AVG(CAST(score AS REAL) / total_questions * 100) as avg
      FROM test_attempts
      WHERE completed_at IS NOT NULL
    `).first();

    const platformStats: PlatformStats = {
      totalUsers: (totalUsersQuery?.count as number) || 0,
      totalTestsTaken: (totalTestsQuery?.count as number) || 0,
      testsToday: (testsTodayQuery?.count as number) || 0,
      averagePlatformScore: Math.round((avgScoreQuery?.avg as number) || 0),
    };

    // Get personal stats
    const userTestsQuery = await db.prepare(`
      SELECT 
        test_date,
        score,
        total_questions,
        completed_at
      FROM test_attempts
      WHERE user_id = ?
        AND completed_at IS NOT NULL
      ORDER BY test_date DESC
    `).bind(user.id).all();

    const userTests = userTestsQuery.results || [];

    // Calculate streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    if (userTests.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      
      // Sort by date ascending for streak calculation
      const sortedTests = [...userTests].sort((a: any, b: any) => 
        new Date(a.test_date).getTime() - new Date(b.test_date).getTime()
      );

      // Remove duplicate dates (if someone took test twice same day)
      const uniqueDates = Array.from(
        new Set(sortedTests.map((t: any) => t.test_date))
      ).sort();

      // Calculate current streak (working backwards from today/yesterday)
      const lastTestDate = uniqueDates[uniqueDates.length - 1];
      const lastTest = new Date(lastTestDate + 'T00:00:00');
      lastTest.setHours(0, 0, 0, 0);
      
      // Calculate days since last test
      const daysSinceLastTest = Math.floor(
        (today.getTime() - lastTest.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Only count current streak if last test was today or yesterday
      if (daysSinceLastTest === 0 || daysSinceLastTest === 1) {
        // Test was taken today or yesterday - streak is active
        let checkDate = new Date(lastTest);
        currentStreak = 1; // Start with the last test
        
        // Work backwards from the last test date
        for (let i = uniqueDates.length - 2; i >= 0; i--) {
          checkDate.setDate(checkDate.getDate() - 1);
          const prevTestDate = new Date(uniqueDates[i] + 'T00:00:00');
          prevTestDate.setHours(0, 0, 0, 0);
          
          if (prevTestDate.getTime() === checkDate.getTime()) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
      // If daysSinceLastTest >= 2, streak is broken (currentStreak stays 0)

      // Calculate longest streak
      if (uniqueDates.length > 0) {
        tempStreak = 1;
        longestStreak = 1;
        
        for (let i = 1; i < uniqueDates.length; i++) {
          const prevDate = new Date(uniqueDates[i - 1] + 'T00:00:00');
          const currDate = new Date(uniqueDates[i] + 'T00:00:00');
          
          const diffDays = Math.floor(
            (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          if (diffDays === 1) {
            tempStreak++;
            longestStreak = Math.max(longestStreak, tempStreak);
          } else {
            tempStreak = 1;
          }
        }
      }
    }

    // Calculate other personal stats
    const totalTestsCompleted = userTests.length;
    const totalScore = userTests.reduce((sum: number, test: any) => sum + test.score, 0);
    const totalQuestions = userTests.reduce((sum: number, test: any) => sum + test.total_questions, 0);
    const averageScore = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
    
    const bestScore = userTests.length > 0 
      ? Math.max(...userTests.map((test: any) => 
          Math.round((test.score / test.total_questions) * 100)
        ))
      : 0;

    const lastTestDate = userTests.length > 0 ? (userTests[0] as any).test_date : null;

    const personalStats: PersonalStats = {
      currentStreak,
      longestStreak,
      totalTestsCompleted,
      averageScore,
      bestScore,
      lastTestDate,
    };

    return new Response(JSON.stringify({ 
      platform: platformStats,
      personal: personalStats
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[platform-stats.ts] Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch stats',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};




