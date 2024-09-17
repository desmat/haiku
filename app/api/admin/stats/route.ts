import { NextRequest, NextResponse } from 'next/server'
import { getUserStats, userSession } from '@/services/users';
import { getHaikuStats } from '@/services/haikus';

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  console.log('>> app.api.admin.stats.GET', {});

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
    internalUsers: userStats.internalUsers,
    flaggedUsers: userStats.flaggedUsers,
    monthlyNewUsers: userStats.monthlyNewUsers,
    monthlyReturningUsers: userStats.monthlyReturningUsers,
    avgMonthlyReturningUserSessions: userStats.avgMonthlyReturningUserSessions,
    monthlyActiveUsers: userStats.monthlyActiveUsers,
    // avgMonthlyActiveUserSessions: userStats.avgMonthlyActiveUserSessions,
    dailyNewUsers: userStats.dailyNewUsers,
    dailyReturningUser: userStats.dailyReturningUser,
    avgDailyReturningUserSessions: userStats.avgDailyReturningUserSessions,
    dailyActiveUsers: userStats.dailyActiveUsers,
    // avgDailyActiveUserSessions: userStats.avgDailyActiveUserSessions,
    haikus: haikuStats.haikus,
    likedHaikus: haikuStats.likedHaikus,
    flaggedHaikus: haikuStats.flaggedHaikus,
    allFlaggedHaikus: haikuStats.allFlaggedHaikus,
    newHaikus1day: haikuStats.newHaikus1day,
    newHaikus30days: haikuStats.newHaikus30days
  }

  return NextResponse.json(stats);
}
