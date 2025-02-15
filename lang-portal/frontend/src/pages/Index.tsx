
import { useQuery } from "@tanstack/react-query";
import { getDashboardStats, getStudyProgress, getLastStudySession } from "@/lib/api";
import StatCard from "@/components/StatCard";
import ProgressRing from "@/components/ProgressRing";
import { format } from "date-fns";

const Index = () => {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
  });

  const { data: progress } = useQuery({
    queryKey: ["study-progress"],
    queryFn: getStudyProgress,
  });

  const { data: lastSession } = useQuery({
    queryKey: ["last-study-session"],
    queryFn: getLastStudySession,
  });

  const progressPercentage = progress
    ? (progress.total_words_studied / progress.total_available_words) * 100
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Welcome Back</h1>
        <p className="text-muted-foreground">Continue your journey in Japanese language learning</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Success Rate"
          value={`${stats?.success_rate ?? 0}%`}
          description="Your overall performance"
        />
        <StatCard
          title="Study Sessions"
          value={stats?.total_study_sessions ?? 0}
          description="Total completed sessions"
        />
        <StatCard
          title="Active Groups"
          value={stats?.total_active_groups ?? 0}
          description="Groups you're studying"
        />
        <StatCard
          title="Study Streak"
          value={`${stats?.study_streak_days ?? 0} days`}
          description="Keep it going!"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="glass-card p-6 rounded-xl animate-in">
          <h2 className="text-xl font-semibold mb-4">Overall Progress</h2>
          <div className="flex items-center justify-center">
            <ProgressRing progress={progressPercentage} size="lg" />
          </div>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {progress?.total_words_studied} of {progress?.total_available_words} words studied
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl animate-in">
          <h2 className="text-xl font-semibold mb-4">Last Study Session</h2>
          {lastSession ? (
            <div>
              <p className="text-lg font-medium mb-2">{lastSession.group_name}</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(lastSession.created_at), "PPP")}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">No recent study sessions</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
