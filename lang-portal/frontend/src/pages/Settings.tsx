
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const Settings = () => {
  const [theme, setTheme] = useState("light");

  const handleResetHistory = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/v1/reset_history", {
        method: "POST",
      });
      if (response.ok) {
        toast.success("Study history has been reset");
      }
    } catch (error) {
      toast.error("Failed to reset history");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Settings</h1>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between max-w-md">
          <label className="text-sm font-medium">Theme</label>
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="pt-6 border-t">
          <h2 className="text-lg font-semibold mb-4">Danger Zone</h2>
          <Button 
            variant="destructive" 
            onClick={handleResetHistory}
          >
            Reset History
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
