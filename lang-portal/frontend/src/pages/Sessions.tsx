
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface StudySession {
  id: number;
  activity_name: string;
  group_name: string;
  start_time: string;
  end_time: string;
  review_items_count: number;
}

const Sessions = () => {
  const { data: sessions } = useQuery({
    queryKey: ["study-sessions"],
    queryFn: async () => {
      const response = await fetch("http://localhost:8080/api/v1/study_sessions");
      return response.json();
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Study Sessions</h1>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Activity Name</TableHead>
              <TableHead>Group Name</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>End Time</TableHead>
              <TableHead className="text-right"># Review Items</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions?.items.map((session: StudySession) => (
              <TableRow key={session.id}>
                <TableCell>{session.id}</TableCell>
                <TableCell>{session.activity_name}</TableCell>
                <TableCell>{session.group_name}</TableCell>
                <TableCell>{format(new Date(session.start_time), "PPp")}</TableCell>
                <TableCell>{format(new Date(session.end_time), "PPp")}</TableCell>
                <TableCell className="text-right">{session.review_items_count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Sessions;
