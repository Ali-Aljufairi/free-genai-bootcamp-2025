
import { useQuery } from "@tanstack/react-query";
import { getWords } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";

const Words = () => {
  const [page] = useState(1);
  const { data: words } = useQuery({
    queryKey: ["words", page],
    queryFn: () => getWords(page),
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Vocabulary List</h1>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search words..."
            className="pl-9 bg-white/50 backdrop-blur-sm"
          />
        </div>
      </header>

      <div className="rounded-xl border bg-white/50 backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Japanese</TableHead>
              <TableHead>Romaji</TableHead>
              <TableHead>English</TableHead>
              <TableHead className="text-right">Correct</TableHead>
              <TableHead className="text-right">Wrong</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {words?.items.map((word, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{word.japanese}</TableCell>
                <TableCell>{word.romaji}</TableCell>
                <TableCell>{word.english}</TableCell>
                <TableCell className="text-right text-green-600">
                  {word.correct_count}
                </TableCell>
                <TableCell className="text-right text-red-600">
                  {word.wrong_count}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Words;
