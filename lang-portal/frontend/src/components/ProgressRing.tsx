
import { Progress } from "@/components/ui/progress";

interface ProgressRingProps {
  progress: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const ProgressRing = ({ progress, size = "md", className = "" }: ProgressRingProps) => {
  const sizeClasses = {
    sm: "w-24 h-24",
    md: "w-32 h-32",
    lg: "w-40 h-40",
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <Progress
        value={progress}
        className="absolute inset-0 rounded-full"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold">{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

export default ProgressRing;
