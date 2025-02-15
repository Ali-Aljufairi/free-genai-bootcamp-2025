
import { useQuery } from "@tanstack/react-query";
import { getGroups } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen } from "lucide-react";

const Groups = () => {
  const [page] = useState(1);
  const { data: groups } = useQuery({
    queryKey: ["groups", page],
    queryFn: () => getGroups(page),
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Word Groups</h1>
          <p className="text-muted-foreground">Organize and study words by themes</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Group
        </Button>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {groups?.items.map((group) => (
          <Card key={group.id} className="glass-card animate-in">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {group.name}
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Study
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {group.word_count} words in this group
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Groups;
