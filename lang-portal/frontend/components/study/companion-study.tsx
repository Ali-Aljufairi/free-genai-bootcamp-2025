"use client"
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, PhoneOff, PhoneCall, Volume2, X } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Get Vapi public key from environment variable
const VAPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;

// Assistant configurations
const ASSISTANTS = {
    casual: {
        id: "815decc2-cab8-4907-9472-cbd6f882f232",
        name: "Casual Talk",
        description: "Practice casual conversation"
    },
    interview: {
        id: "709d3490-2dbd-414b-9855-84060073fce9",
        name: "Job Interview",
        description: "Practice job interview scenarios"
    },
    keigo: {
        id: "e1a9b76f-c493-4a09-ad6b-5e123184bad2",
        name: "Keigo",
        description: "Practice Keigo"
    },
    angryCustomer: {
        id: "136fcc43-0ba0-4092-999a-d13b871747db",
        name: "Angry Customer",
        description: "Practice handling difficult customer situations"
    }
};

interface CompanionStudyProps {
    sessionId: string;
    onComplete: () => void;
}

type CallStatus = "idle" | "connecting" | "active" | "speaking" | "listening" | "ended";

interface FluidVisualizationProps {
    isActive: boolean;
    isListening: boolean;
    isSpeaking: boolean;
}

function FluidVisualization({ isActive, isListening, isSpeaking }: FluidVisualizationProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Array<{
            x: number;
            y: number;
            radius: number;
            color: string;
            vx: number;
            vy: number;
            life: number;
            maxLife: number;
        }> = [];

        const createParticles = () => {
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            if (isActive && particles.length < 100) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 30 + 20;
                const speed = Math.random() * 0.5 + 0.2;

                let color;
                if (isSpeaking) {
                    color = `rgba(100, 180, 255, ${Math.random() * 0.3 + 0.2})`;
                } else if (isListening) {
                    color = `rgba(120, 200, 255, ${Math.random() * 0.3 + 0.2})`;
                } else {
                    color = `rgba(150, 220, 255, ${Math.random() * 0.3 + 0.2})`;
                }

                particles.push({
                    x: centerX + Math.cos(angle) * distance,
                    y: centerY + Math.sin(angle) * distance,
                    radius: Math.random() * 8 + 2,
                    color,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 0,
                    maxLife: Math.random() * 100 + 50,
                });
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const gradient = ctx.createRadialGradient(
                canvas.width / 2,
                canvas.height / 2,
                0,
                canvas.width / 2,
                canvas.height / 2,
                canvas.width / 2,
            );

            if (isSpeaking) {
                gradient.addColorStop(0, "rgba(220, 240, 255, 0.8)");
                gradient.addColorStop(0.5, "rgba(100, 180, 255, 0.4)");
                gradient.addColorStop(1, "rgba(50, 120, 220, 0)");
            } else if (isListening) {
                gradient.addColorStop(0, "rgba(230, 245, 255, 0.8)");
                gradient.addColorStop(0.5, "rgba(120, 200, 255, 0.4)");
                gradient.addColorStop(1, "rgba(70, 140, 230, 0)");
            } else {
                gradient.addColorStop(0, "rgba(240, 250, 255, 0.7)");
                gradient.addColorStop(0.5, "rgba(150, 220, 255, 0.3)");
                gradient.addColorStop(1, "rgba(100, 160, 240, 0)");
            }

            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 10, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();

            if (isActive) {
                createParticles();
            }

            particles = particles.filter((p) => p.life < p.maxLife);

            particles.forEach((particle) => {
                particle.life += 1;
                particle.x += particle.vx;
                particle.y += particle.vy;

                const opacity = 1 - particle.life / particle.maxLife;

                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                ctx.fillStyle = particle.color.replace(/[\d.]+\)$/, `${opacity})`);
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        const resizeCanvas = () => {
            const size = Math.min(300, window.innerWidth - 40);
            canvas.width = size;
            canvas.height = size;
        };

        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        animate();

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, [isActive, isListening, isSpeaking]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
                opacity: isActive ? 1 : 0.7,
                scale: isActive ? 1 : 0.9,
            }}
            transition={{ duration: 0.5 }}
            className="relative flex items-center justify-center"
        >
            <canvas
                ref={canvasRef}
                className="rounded-full"
                style={{
                    filter: `blur(${isActive ? 4 : 2}px)`,
                    transition: "filter 0.5s ease",
                }}
            />
        </motion.div>
    );
}

export function CompanionStudy({ sessionId, onComplete }: CompanionStudyProps) {
    const [callStatus, setCallStatus] = useState<CallStatus>("idle");
    const [isVapiInitialized, setIsVapiInitialized] = useState(false);
    const [assistantIsSpeaking, setAssistantIsSpeaking] = useState(false);
    const [selectedAssistant, setSelectedAssistant] = useState<string>(ASSISTANTS.casual.id);
    const vapiRef = useRef<any>(null);

    const cleanup = () => {
        if (vapiRef.current) {
            try {
                vapiRef.current.stop();
            } catch (error) { }
            vapiRef.current.removeAllListeners && vapiRef.current.removeAllListeners();
            vapiRef.current = null;
        }
        setCallStatus("ended");
        setAssistantIsSpeaking(false);
    };

    useEffect(() => {
        if (!VAPI_PUBLIC_KEY) {
            setCallStatus("ended");
            return;
        }
        if (!vapiRef.current && typeof window !== "undefined") {
            import("@vapi-ai/web").then((VapiModule) => {
                try {
                    const Vapi = VapiModule.default;
                    vapiRef.current = new Vapi(VAPI_PUBLIC_KEY);
                    vapiRef.current.on("call-start", () => {
                        setCallStatus("active");
                    });
                    vapiRef.current.on("call-end", () => {
                        cleanup();
                        onComplete && onComplete();
                    });
                    vapiRef.current.on("speech-start", () => {
                        setAssistantIsSpeaking(true);
                        setCallStatus("speaking");
                    });
                    vapiRef.current.on("speech-end", () => {
                        setAssistantIsSpeaking(false);
                        setCallStatus("listening");
                    });
                    vapiRef.current.on("error", (err: any) => {
                        setCallStatus("ended");
                        setAssistantIsSpeaking(false);
                        toast.error("Call Error", { description: err?.message || "Unknown error" });
                        cleanup();
                    });
                    setIsVapiInitialized(true);
                } catch (error) {
                    setCallStatus("ended");
                    setAssistantIsSpeaking(false);
                    toast.error("Initialization Error", { description: "Failed to initialize Vapi. Please try again." });
                }
            }).catch(error => {
                setCallStatus("ended");
                setAssistantIsSpeaking(false);
                toast.error("Loading Error", { description: "Failed to load Vapi module. Please try again." });
            });
        }
        return () => {
            cleanup();
        };
    }, [onComplete]);

    const startCall = async () => {
        if (!isVapiInitialized) {
            return;
        }
        if (vapiRef.current) {
            setCallStatus("connecting");
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                stream.getTracks().forEach(track => track.stop());
                vapiRef.current.start(selectedAssistant);
            } catch (error) {
                toast.error("Call Start Failed", { description: "Could not start the call. Please ensure microphone access is granted." });
                setCallStatus("ended");
                setAssistantIsSpeaking(false);
            }
        }
    };

    const endCall = () => {
        cleanup();
        setCallStatus("idle");
    };

    if (!VAPI_PUBLIC_KEY) {
        return (
            <div className="flex flex-col h-[calc(100vh-8rem)]">
                <Card className="flex-1 glass-card flex flex-col h-full overflow-hidden border-0 shadow-lg bg-background/60 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-red-500">Configuration Error</CardTitle>
                        <CardDescription>
                            Missing Vapi configuration. Please check your environment variables.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            <Card className="flex-1 glass-card flex flex-col h-full overflow-hidden border-0 shadow-lg bg-background/60 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mic className="h-5 w-5 text-blue-500" />
                        Voice Companion
                    </CardTitle>
                    <CardDescription>
                        Practice speaking with your AI language companion
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
                    <div className="w-full flex flex-col items-center gap-4">
                        {(callStatus === "idle" || callStatus === "ended") && (
                            <div className="flex flex-col items-center gap-4 w-full max-w-md">
                                <Select
                                    value={selectedAssistant}
                                    onValueChange={setSelectedAssistant}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select an assistant" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(ASSISTANTS).map(([key, assistant]) => (
                                            <SelectItem key={key} value={assistant.id}>
                                                {assistant.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    onClick={startCall}
                                    className="flex items-center gap-2 w-full"
                                    size="lg"
                                >
                                    <PhoneCall className="h-5 w-5" /> Start Call
                                </Button>
                            </div>
                        )}
                        {(callStatus !== "idle" && callStatus !== "ended") && (
                            <>
                                <div className="w-48 h-48">
                                    <FluidVisualization
                                        isActive={true}
                                        isListening={callStatus === "listening"}
                                        isSpeaking={assistantIsSpeaking}
                                    />
                                </div>
                                <div className="text-center text-muted-foreground text-base min-h-[2em]">
                                    {callStatus === "connecting" && "Connecting..."}
                                    {callStatus === "active" && "Connected"}
                                    {callStatus === "listening" && "Listening..."}
                                    {callStatus === "speaking" && "Speaking..."}
                                </div>
                                <div className="mt-8">
                                    <Button
                                        onClick={endCall}
                                        variant="destructive"
                                        className="flex items-center gap-2"
                                        size="lg"
                                    >
                                        <PhoneOff className="h-5 w-5" /> End Call
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </CardContent>
                <CardFooter>
                    <div className="text-xs text-muted-foreground w-full text-center">
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
} 