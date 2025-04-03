"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"

interface Choice {
  text: string
  is_correct: boolean
}

interface Question {
  grammar_point: string
  question: string
  choices: Choice[]
  explanation: string
}

interface Quiz {
  level: string
  questions: Question[]
}

interface QuizResponse {
  level: string
  num_questions: number
  quiz: Quiz
}

interface QuizStudyProps {
  sessionId?: string
  onComplete?: () => void
}

export function QuizStudy({ sessionId, onComplete }: QuizStudyProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [level, setLevel] = useState("5")
  const [numQuestions, setNumQuestions] = useState("3")

  const fetchQuiz = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`http://localhost:8000/api/v1/grammar-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level: parseInt(level),
          num_questions: parseInt(numQuestions)
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch quiz data')
      }

      const data: QuizResponse = await response.json()
      setQuiz(data.quiz)
      setCurrentIndex(0)
      setSelectedAnswer(null)
      setIsAnswered(false)
      setScore(0)
      setShowResult(false)
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load quiz. Please try again.",
        variant: "destructive",
      })
      console.error("Failed to fetch quiz:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchQuiz()
  }, [])

  const handleAnswerSelect = (text: string) => {
    setSelectedAnswer(text)
  }

  const handleCheckAnswer = () => {
    if (!selectedAnswer || !quiz) return

    setIsAnswered(true)
    const currentQuestion = quiz.questions[currentIndex]
    const correct = currentQuestion.choices.find(choice => choice.text === selectedAnswer)?.is_correct

    if (correct) {
      setScore(prev => prev + 1)
      toast({
        title: "Correct!",
        description: currentQuestion.explanation,
        variant: "default",
      })
    } else {
      toast({
        title: "Incorrect",
        description: currentQuestion.explanation,
        variant: "destructive",
      })
    }
  }

  const handleNext = () => {
    if (!quiz) return

    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedAnswer(null)
      setIsAnswered(false)
    } else {
      setShowResult(true)
    }
  }

  const handleStartNewQuiz = () => {
    fetchQuiz()
  }

  const handleFinish = () => {
    if (onComplete) {
      onComplete()
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)] items-center justify-center">
        <Card className="w-full max-w-4xl glass-card border-0 shadow-lg bg-background/60 backdrop-blur-sm">
          <CardContent className="flex items-center justify-center p-16">
            <div className="text-center">
              <p className="text-2xl">Loading quiz...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (showResult) {
    const scorePercentage = quiz ? Math.round((score / quiz.questions.length) * 100) : 0
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <Card className="flex-1 glass-card flex flex-col h-full overflow-hidden border-0 shadow-lg bg-background/60 backdrop-blur-sm">
          <CardContent className="flex-1 p-8">
            <div className="flex flex-col items-center justify-center h-full space-y-8">
              <h2 className="text-3xl font-bold">Quiz Complete!</h2>
              <div className="text-center mb-6">
                <p className="text-2xl font-semibold">Your Score: {score}/{quiz?.questions.length}</p>
                <p className="text-xl text-muted-foreground">{scorePercentage}% Correct</p>
              </div>
              <div className="space-y-4 w-full max-w-md">
                <p className="text-center text-muted-foreground">Configure your next quiz:</p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="level">JLPT Level</Label>
                    <Select value={level} onValueChange={setLevel}>
                      <SelectTrigger id="level" className="w-full">
                        <SelectValue placeholder="JLPT Level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">N5 (Beginner)</SelectItem>
                        <SelectItem value="4">N4</SelectItem>
                        <SelectItem value="3">N3</SelectItem>
                        <SelectItem value="2">N2</SelectItem>
                        <SelectItem value="1">N1 (Advanced)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="questions">Number of Questions</Label>
                    <Select value={numQuestions} onValueChange={setNumQuestions}>
                      <SelectTrigger id="questions" className="w-full">
                        <SelectValue placeholder="Number of questions" />
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
                </div>
                <div className="space-y-3">
                  <Button
                    onClick={handleStartNewQuiz}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
                  >
                    Start New Quiz
                  </Button>
                  <Button
                    onClick={handleFinish}
                    variant="outline"
                    className="w-full text-lg py-6"
                  >
                    Return to Dashboard
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!quiz || quiz.questions.length === 0) {
    return <div>Loading...</div>
  }

  const currentQuestion = quiz.questions[currentIndex]

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <Card className="flex-1 glass-card flex flex-col h-full overflow-hidden border-0 shadow-lg bg-background/60 backdrop-blur-sm">
        <CardHeader className="border-b">
          <div className="flex justify-between items-center px-4">
            <p className="text-lg text-muted-foreground">
              Question {currentIndex + 1} of {quiz.questions.length}
            </p>
            <p className="text-lg text-muted-foreground">
              JLPT Level: {quiz.level}
            </p>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-8">
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-full max-w-4xl space-y-8">
              <div className="mb-8">
                <div className="text-lg font-medium text-blue-600 mb-2">Grammar Point: {currentQuestion.grammar_point}</div>
                <div className="text-2xl font-bold whitespace-pre-line">{currentQuestion.question}</div>
              </div>
              
              <RadioGroup 
                value={selectedAnswer || ""} 
                onValueChange={handleAnswerSelect}
                className="space-y-4"
                disabled={isAnswered}
              >
                {currentQuestion.choices.map((choice, index) => {
                  const optionLetters = ['A', 'B', 'C', 'D'];
                  const isCorrectOption = isAnswered && choice.is_correct;
                  const isIncorrectSelected = isAnswered && selectedAnswer === choice.text && !choice.is_correct;

                  return (
                    <div 
                      key={index} 
                      className={`flex items-start space-x-3 p-4 rounded-lg border ${
                        isCorrectOption 
                          ? "border-green-500 bg-green-50 dark:bg-green-950/30" 
                          : isIncorrectSelected 
                            ? "border-red-500 bg-red-50 dark:bg-red-950/30" 
                            : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      } transition-colors`}
                    >
                      <RadioGroupItem 
                        value={choice.text} 
                        id={`option-${index}`} 
                        className="mt-1"
                      />
                      <Label 
                        htmlFor={`option-${index}`} 
                        className={`flex-1 font-normal text-lg cursor-pointer ${
                          isCorrectOption ? "text-green-700 dark:text-green-400" : 
                          isIncorrectSelected ? "text-red-700 dark:text-red-400" : ""
                        }`}
                      >
                        <span className="font-medium mr-2">{optionLetters[index]}.</span>
                        {choice.text}
                      </Label>
                    </div>
                  )
                })}
              </RadioGroup>

              <div className="flex justify-center mt-8 space-x-4">
                {!isAnswered ? (
                  <Button
                    onClick={handleCheckAnswer}
                    className="bg-blue-600 hover:bg-blue-700 text-xl px-10 py-6"
                    disabled={!selectedAnswer}
                  >
                    Check Answer
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    className="bg-blue-600 hover:bg-blue-700 text-xl px-10 py-6"
                  >
                    {currentIndex < quiz.questions.length - 1 ? "Next Question" : "See Results"}
                  </Button>
                )}
              </div>

              {isAnswered && (
                <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60">
                  <h3 className="font-medium text-lg text-blue-700 dark:text-blue-400">Explanation:</h3>
                  <p className="mt-1 text-gray-600 dark:text-gray-300">{currentQuestion.explanation}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}