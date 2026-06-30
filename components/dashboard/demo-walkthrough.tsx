"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Sparkles, HelpCircle } from "lucide-react";

interface Step {
  targetId: string;
  title: string;
  description: string;
  position: "bottom" | "top" | "left" | "right";
}

const TOUR_STEPS: Step[] = [
  {
    targetId: "demo-welcome", // Special step with no specific target element
    title: "Welcome to NEXUS! ✦",
    description: "NEXUS is an autonomous execution operating system, not just a task manager. It runs 9 agents in the background to predict deadline failures and keep you on track. Let's take a 60-second tour.",
    position: "bottom"
  },
  {
    targetId: "demo-health-card",
    title: "Execution Health Score",
    description: "This is your aggregate health score. It dynamically calculates how likely you are to hit your deadlines based on your actual task completion velocity vs. the required pace.",
    position: "bottom"
  },
  {
    targetId: "demo-intervention-card",
    title: "Intervention Alert Center",
    description: "When our Failure Prediction Agent determines a goal is at risk, an intervention triggers. You can click 'View Rescue Plan' to see how the AI proposes to adapt your schedule.",
    position: "bottom"
  },
  {
    targetId: "demo-goals-grid",
    title: "Active Goals & Timelines",
    description: "Here are your active goals. Clicking a goal takes you to its timeline, where you can see scheduled tasks and study resources curated by the Resource Curation Agent.",
    position: "top"
  },
  {
    targetId: "demo-neural-net",
    title: "NEXUS Neural Net Canvas",
    description: "This is the heart of the system. You can see all 9 autonomous agents working together. Try clicking on individual agent nodes to inspect their prompt roles.",
    position: "top"
  },
  {
    targetId: "demo-analyze-btn-first", // Highlights the analyze button on the first goal card
    title: "Trigger Agent Pipeline",
    description: "Start a real-time agent run by clicking 'Analyze' on a goal card. You will watch the neural net light up and see actual Gemini reasoning stream live into the terminal console.",
    position: "left"
  }
];

export function DemoWalkthrough() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Check URL parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") === "true") {
      setIsOpen(true);
      // Clean up the URL parameter without reloading
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  // Update target element coordinate bounds
  useEffect(() => {
    if (!isOpen) {
      setCoords(null);
      return;
    }

    const step = TOUR_STEPS[currentStep];
    if (step.targetId === "demo-welcome") {
      setCoords(null);
      return;
    }

    let targetEl = document.getElementById(step.targetId);

    // Fallback logic for the first goal analyze button
    if (step.targetId === "demo-analyze-btn-first") {
      const goalsGrid = document.getElementById("demo-goals-grid");
      const analyzeBtns = goalsGrid?.querySelectorAll("button");
      if (analyzeBtns && analyzeBtns.length > 0) {
        targetEl = analyzeBtns[0] as HTMLElement;
      } else {
        // Fallback to the goals grid itself if button is not found
        targetEl = document.getElementById("demo-goals-grid");
      }
    }

    if (!targetEl) {
      setCoords(null);
      return;
    }

    // Scroll into view if needed
    targetEl.scrollIntoView({ behavior: "smooth", block: "center" });

    const updateCoords = () => {
      const rect = targetEl!.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
    };

    // Small delay to let scroll finish
    const timer = setTimeout(updateCoords, 300);

    window.addEventListener("resize", updateCoords);
    window.addEventListener("scroll", updateCoords, { capture: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords, { capture: true });
    };
  }, [isOpen, currentStep]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsOpen(false);
      setCurrentStep(0);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    setIsOpen(false);
    setCurrentStep(0);
  };

  const startTour = () => {
    setIsOpen(true);
    setCurrentStep(0);
  };

  // Determine tooltip style and placement
  const getTooltipStyle = () => {
    if (!coords) {
      // Centered overlay style (Welcome Step)
      return {
        position: "fixed" as const,
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 50
      };
    }

    const step = TOUR_STEPS[currentStep];
    const margin = 16;
    let top = 0;
    let left = 0;

    // Tooltip dimensions fallback or actual (default to 320px width)
    const tooltipWidth = 320;
    const tooltipHeight = 180;

    switch (step.position) {
      case "bottom":
        top = coords.top + coords.height + margin;
        left = coords.left + coords.width / 2 - tooltipWidth / 2;
        break;
      case "top":
        top = coords.top - tooltipHeight - margin;
        left = coords.left + coords.width / 2 - tooltipWidth / 2;
        break;
      case "left":
        top = coords.top + coords.height / 2 - tooltipHeight / 2;
        left = coords.left - tooltipWidth - margin;
        break;
      case "right":
        top = coords.top + coords.height / 2 - tooltipHeight / 2;
        left = coords.left + coords.width + margin;
        break;
    }

    // Keep within bounds of window width
    if (typeof window !== "undefined") {
      left = Math.max(margin, Math.min(window.innerWidth - tooltipWidth - margin, left));
    }

    return {
      position: "fixed" as const,
      top: `${top}px`,
      left: `${left}px`,
      zIndex: 50
    };
  };

  return (
    <>
      {/* Floating Demo Launcher Trigger */}
      <button
        onClick={startTour}
        className="fixed bottom-4 right-4 z-40 bg-gradient-to-r from-primary to-[oklch(0.75_0.18_195)] hover:from-primary/95 hover:to-[oklch(0.75_0.18_195)]/95 text-white size-12 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(79,158,255,0.2)] border border-primary/20 hover:scale-105 transition-all cursor-pointer group animate-bounce"
        title="Start Guided Tour"
      >
        <HelpCircle className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="absolute inset-0 z-50 pointer-events-none">
            {/* Dark Dimmed Backdrop Overlay (with clipping cutout) */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-all pointer-events-auto"
              style={{
                zIndex: 40,
                clipPath: coords
                  ? `polygon(
                      0% 0%, 
                      0% 100%, 
                      ${coords.left}px 100%, 
                      ${coords.left}px ${coords.top}px, 
                      ${coords.left + coords.width}px ${coords.top}px, 
                      ${coords.left + coords.width}px ${coords.top + coords.height}px, 
                      ${coords.left}px ${coords.top + coords.height}px, 
                      ${coords.left}px 100%, 
                      100% 100%, 
                      100% 0%
                    )`
                  : "none"
              }}
              onClick={handleSkip}
            />

            {/* Target Highlight Overlay Border */}
            {coords && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed border-2 border-primary rounded-2xl shadow-[0_0_20px_rgba(79,158,255,0.4)] pointer-events-none"
                style={{
                  top: `${coords.top - 4}px`,
                  left: `${coords.left - 4}px`,
                  width: `${coords.width + 8}px`,
                  height: `${coords.height + 8}px`,
                  zIndex: 45
                }}
              />
            )}

            {/* Walkthrough Tooltip Popover Card */}
            <motion.div
              ref={tooltipRef}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              style={getTooltipStyle()}
              className="w-[320px] glass-card rounded-2xl p-5 border border-primary/20 bg-card/90 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] pointer-events-auto flex flex-col justify-between"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5 text-xs text-primary font-bold tracking-wide uppercase">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>Demo Tour · {currentStep + 1}/{TOUR_STEPS.length}</span>
                </div>
                <button
                  onClick={handleSkip}
                  className="p-1 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-1.5 flex-1 mb-4">
                <h4 className="text-sm font-extrabold text-white">
                  {TOUR_STEPS[currentStep].title}
                </h4>
                <p className="text-xs text-white/70 leading-relaxed font-normal">
                  {TOUR_STEPS[currentStep].description}
                </p>
              </div>

              {/* Navigation Footer */}
              <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.06] text-xs">
                <button
                  onClick={handleSkip}
                  className="text-white/45 hover:text-white/75 font-semibold cursor-pointer"
                >
                  Skip Tour
                </button>

                <div className="flex items-center gap-2">
                  {currentStep > 0 && (
                    <button
                      onClick={handlePrev}
                      className="flex items-center gap-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Back
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-1 bg-primary hover:bg-primary/90 text-primary-foreground px-3.5 py-1.5 rounded-lg font-bold shadow-[0_4px_12px_rgba(79,158,255,0.2)] transition-all cursor-pointer"
                  >
                    <span>
                      {currentStep === TOUR_STEPS.length - 1 ? "Finish" : "Next"}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
