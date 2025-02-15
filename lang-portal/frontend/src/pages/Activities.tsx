
import { useQuery } from "@tanstack/react-query";
import { getActivities } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

const Activities = () => {
  const { data: activities } = useQuery({
    queryKey: ["activities"],
    queryFn: getActivities,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Study Activities</h1>
        <p className="text-muted-foreground">Choose an activity to practice your Japanese</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {activities?.map((activity) => (
          <Card key={activity.id} className="glass-card animate-in">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {activity.name}
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Play className="w-4 h-4 mr-2" />
                  Start
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{activity.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Activities;
