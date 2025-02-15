
import { Link } from "react-router-dom";
import { Home, Book, BookText, Users, History, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

const Sidebar = () => {
  const menuItems = [
    { label: "Dashboard", icon: Home, path: "/" },
    { label: "Study Activities", icon: Book, path: "/activities" },
    { label: "Words", icon: BookText, path: "/words" },
    { label: "Word Groups", icon: Users, path: "/groups" },
    { label: "Sessions", icon: History, path: "/sessions" },
    { label: "Settings", icon: Settings, path: "/settings" },
  ];

  return (
    <aside className="w-64 h-screen bg-gradient-to-b from-blue-50 to-white border-r border-blue-100">
      <div className="p-4 border-b border-blue-100 bg-blue-50">
        <Link to="/" className="text-xl font-bold text-blue-600">LangPortal</Link>
      </div>
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <Button
            key={item.path}
            variant="ghost"
            className="w-full justify-start gap-3 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
            asChild
          >
            <Link to={item.path}>
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          </Button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
