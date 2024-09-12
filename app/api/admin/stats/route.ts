import { NextRequest, NextResponse } from 'next/server'
import { getUserStats, userSession } from '@/services/users';
import { getHaikuStats } from '@/services/haikus';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  console.log('>> app.api.admin.restore.POST', {});

  const { user } = await userSession(request);

  if (!user.isAdmin) {
    return NextResponse.json(
      { success: false, message: 'authorization failed' },
      { status: 403 }
    );
  }

  const [userStats, haikuStats] = await Promise.all([
    getUserStats(),
    getHaikuStats(),
  ])

  const stats = {
    users: userStats.users,
    admins: userStats.admins,
    flaggedUsers: userStats.flagged,
    monthlyNewUsers: userStats.monthlyNewUsers,
    monthlyActiveUsers: userStats.monthlyActiveUsers,
    avgMonthlyActiveUserSessions: userStats.avgMonthlyActiveUserSessions,
    dailyNewUsers: userStats.dailyNewUsers,
    dailyActiveUser: userStats.dailyActiveUser,
    avgDailyActiveUserSessions: userStats.avgDailyActiveUserSessions,
    haikus: haikuStats.haikus,
    likedHaikus: haikuStats.likedHaikus,
    flaggedHaikus: haikuStats.flaggedHaikus,
    allFlaggedHaikus: haikuStats.allFlaggedHaikus,
  }

  return NextResponse.json(stats);
}
