"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useGenerateQuiz, type QuizQuestion } from "@/hooks/api/useQuiz"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface QuizStudyProps {
  sessionId?: string;
  onComplete?: () => void;
}

export function QuizStudy({ sessionId, onComplete }: QuizStudyProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [level, setLevel] = useState(5) // N5 default
  const [numQuestions, setNumQuestions] = useState(3)
  const [showConfig, setShowConfig] = useState(true)
  const [score, setScore] = useState(0)

  const { mutate: generateQuiz, isPending } = useGenerateQuiz()

  const handleStartQuiz = () => {
    generateQuiz(
      { level, num_questions: numQuestions },
      {
        onSuccess: (data) => {
          setQuestions(data.quiz.questions)
          setCurrentIndex(0)
          setSelectedOption(null)
          setIsCorrect(null)
          setShowExplanation(false)
          setShowConfig(false)
          setScore(0)
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Failed to generate quiz",
            description: error instanceof Error ? error.message : "Please try again",
          })
        }
      }
    )
  }

  const handleOptionSelect = (option: string, correct: boolean) => {
    setSelectedOption(option)
    setIsCorrect(correct)

    if (correct) {
      setScore(prev => prev + 1)
    }

    setShowExplanation(true)
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedOption(null)
      setIsCorrect(null)
      setShowExplanation(false)
    } else {
      // Quiz completed
      setShowConfig(true)

      if (onComplete) {
        onComplete()
      }
    }
  }

  if (showConfig) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <Card className="flex-1 glass-card flex flex-col h-full overflow-hidden border-0 shadow-lg bg-background/60 backdrop-blur-sm">
          <CardContent className="flex-1 p-8">
            <div className="flex flex-col items-center justify-center h-full space-y-8">
              {questions.length > 0 ? (
                <>
                  <h2 className="text-3xl font-bold">Quiz Complete!</h2>
                  <div className="text-center mb-6">
                    <p className="text-2xl font-semibold">Your Score: {score}/{questions.length}</p>
                    <p className="text-xl text-muted-foreground">{Math.round((score / questions.length) * 100)}% Correct</p>
                  </div>
                </>
              ) : (
                <h2 className="text-3xl font-bold">Japanese Grammar Quiz</h2>
              )}

              <div className="space-y-4 w-full max-w-md">
                <div className="space-y-2">
                  <p className="text-muted-foreground">JLPT Level:</p>
                  <Select
                    value={level.toString()}
                    onValueChange={(value) => setLevel(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">N5 (Beginner)</SelectItem>
                      <SelectItem value="4">N4 (Basic)</SelectItem>
                      <SelectItem value="3">N3 (Intermediate)</SelectItem>
                      <SelectItem value="2">N2 (Advanced)</SelectItem>
                      <SelectItem value="1">N1 (Expert)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <p className="text-muted-foreground">Number of Questions:</p>
                  <Select
                    value={numQuestions.toString()}
                    onValueChange={(value) => setNumQuestions(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select number of questions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 questions</SelectItem>
                      <SelectItem value="5">5 questions</SelectItem>
                      <SelectItem value="10">10 questions</SelectItem>
                      <SelectItem value="15">15 questions</SelectItem>
                      <SelectItem value="20">20 questions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6 mt-8"
                  onClick={handleStartQuiz}
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Quiz...
                    </>
                  ) : (
                    questions.length > 0 ? "Start New Quiz" : "Start Quiz"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (questions.length === 0 || isPending) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <p className="mt-4 text-lg">Loading questions...</p>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <Card className="flex-1 glass-card flex flex-col h-full overflow-hidden border-0 shadow-lg bg-background/60 backdrop-blur-sm">
        <CardHeader className="border-b">
          <div className="flex justify-between items-center px-4">
            <p className="text-lg text-muted-foreground">
              Question {currentIndex + 1} of {questions.length}
            </p>
            <p className="text-lg text-muted-foreground">
              Grammar Point: {currentQuestion.grammar_point}
            </p>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-8">
          <div className="flex flex-col h-full">
            <div className="w-full max-w-5xl mx-auto space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold whitespace-pre-wrap">{currentQuestion.question}</h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {currentQuestion.choices.map((choice, idx) => (
                  <Button
                    key={idx}
                    className={`p-6 h-auto text-lg text-left justify-start transition-all duration-200 ${selectedOption !== null
                        ? choice.is_correct
                          ? "bg-green-500 hover:bg-green-600 text-white"
                          : selectedOption === choice.text
                            ? "bg-red-400 hover:bg-red-400 text-white"
                            : "opacity-70"
                        : "hover:scale-102 hover:shadow-md"
                      }`}
                    variant="outline"
                    onClick={() => handleOptionSelect(choice.text, choice.is_correct)}
                    disabled={selectedOption !== null}
                  >
                    {choice.text}
                  </Button>
                ))}
              </div>

              {showExplanation && (
                <div className="mt-8 p-6 bg-muted/50 rounded-lg">
                  <h3 className="font-bold text-lg mb-2">Explanation:</h3>
                  <p>{currentQuestion.explanation}</p>

                  <div className="mt-6 flex justify-end">
                    <Button
                      onClick={handleNext}
                      className="bg-blue-600 hover:bg-blue-700 px-8 py-2"
                    >
                      {currentIndex < questions.length - 1 ? "Next Question" : "Complete Quiz"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}