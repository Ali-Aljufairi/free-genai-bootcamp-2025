"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react"

type ToasterProps = React.ComponentProps<typeof Sonner>

const iconClasses = "h-5 w-5"

const icons = {
  success: <CheckCircle2 className={`${iconClasses} text-green-500`} />,
  error: <XCircle className={`${iconClasses} text-red-500`} />,
  warning: <AlertCircle className={`${iconClasses} text-yellow-500`} />,
  info: <AlertCircle className={`${iconClasses} text-blue-500`} />
}

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      icons={icons}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          error: "group-[.toaster]:border-red-500/30",
          success: "group-[.toaster]:border-green-500/30",
          warning: "group-[.toaster]:border-yellow-500/30",
          info: "group-[.toaster]:border-blue-500/30",
        }
      }}
      {...props}
    />
  )
}

export { Toaster }
