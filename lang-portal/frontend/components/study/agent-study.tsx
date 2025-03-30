"use client"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { Search, BookOpen, BookText, Video, GraduationCap } from "lucide-react"

interface AgentStudyProps {
  sessionId: string;
  onComplete: () => void;
}

export function AgentStudy({ sessionId, onComplete }: AgentStudyProps) {
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState<string>("")

  const handleSearch = async () => {
    if (!query) {
      toast({
        variant: "destructive",
        title: "Query is required",
        description: "Please enter what you want to search for"
      })
      return
    }

    if (!email || !email.includes('@')) {
      toast({
        variant: "destructive",
        title: "Valid email required",
        description: "Please enter a valid email address to receive your results"
      })
      return
    }

    setIsLoading(true)
    try {
      // Use environment variable for the API URL instead of hardcoding it
      const resourceApiUrl = process.env.NEXT_PUBLIC_RESOURCE_API || "http://localhost:8002"
      
      const response = await fetch(`${resourceApiUrl}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "accept": "application/json"
        },
        body: JSON.stringify({
          query: query,
          email: email
        })
      })

      const data = await response.json()
      if (response.ok) {
        // Use environment variable for toast duration instead of hardcoding
        const toastDuration = parseInt(process.env.NEXT_PUBLIC_TOAST_DURATION || "5000")
        
        toast({
          title: "Search request submitted",
          description: `Your search for "${query}" is being processed. Results will be sent to ${email} soon.`,
          duration: toastDuration
        })
        
        // Reset the form after successful submission
        setQuery("")
      } else {
        throw new Error(data.message || "Failed to search for resources")
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to search",
        description: error instanceof Error ? error.message : "Please try again"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xl font-bold">Japanese Learning Resources</h3>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Our AI-powered agent will help you find the best resources for learning Japanese.
              Enter what you're looking for (books, videos, kanji practice, etc.) and we'll email you personalized recommendations.
            </p>
            
            <div className="grid gap-4 pt-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Your Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email to receive results"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <label htmlFor="search-query" className="text-sm font-medium">
                  What are you looking for?
                </label>
                <Input
                  id="search-query"
                  placeholder="e.g., Best books for JLPT N5, Kanji practice apps, Beginner listening resources..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              
              <Button 
                onClick={handleSearch} 
                disabled={isLoading || !query || !email}
                className="w-full"
              >
                {isLoading ? "Searching..." : "Find Resources"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="glass-card">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Popular Japanese Learning Resource Types</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-2">
              <BookOpen className="h-5 w-5 mt-1 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-medium">Textbooks</p>
                <p className="text-sm text-muted-foreground">Structured learning materials like Genki or Minna no Nihongo</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Video className="h-5 w-5 mt-1 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-medium">Video Courses</p>
                <p className="text-sm text-muted-foreground">YouTube channels and online courses for visual learners</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <BookText className="h-5 w-5 mt-1 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-medium">Kanji Resources</p>
                <p className="text-sm text-muted-foreground">Specialized guides for learning Japanese characters</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <GraduationCap className="h-5 w-5 mt-1 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-medium">Practice Materials</p>
                <p className="text-sm text-muted-foreground">Practice exercises and mock tests for various JLPT levels</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}