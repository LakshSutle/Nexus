"use client";

/**
 * SyllabusUpload — The "camera → 10-second plan" demo moment.
 *
 * User can:
 *   1. Take a photo directly from their phone camera
 *   2. Drag & drop an image or PDF
 *   3. Click to browse files
 *
 * On upload, calls POST /api/agents/syllabus/parse and auto-fills
 * the New Goal form with Gemini's extracted plan.
 */

import { useState, useRef, useCallback } from "react";
import { Camera, Upload, FileText, Loader2, Sparkles, X, CheckCircle2 } from "lucide-react";

interface SyllabusUploadProps {
  onPlanExtracted: (plan: ExtractedPlan, file: File) => void;
  deadline?: string;
  hoursPerDay?: number;
}

export interface ExtractedPlan {
  goal_title: string;
  subject_area: string;
  detected_topics: Topic[];
  total_estimated_hours: number;
  suggested_deadline: string;
  milestones: Milestone[];
  confidence: "high" | "medium" | "low";
  extraction_notes: string;
}

interface Topic {
  name: string;
  subtopics: string[];
  estimated_hours: number;
  priority: "high" | "medium" | "low";
  difficulty: "easy" | "medium" | "hard";
}

interface Milestone {
  title: string;
  topics_covered: string[];
  target_date: string;
  tasks: { title: string; estimated_minutes: number; type: string }[];
}

type UploadState = "idle" | "dragging" | "uploading" | "success" | "error";

export function SyllabusUpload({ onPlanExtracted, deadline, hoursPerDay = 3 }: SyllabusUploadProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<ExtractedPlan | null>(null);
  const [progress, setProgress] = useState<string>("Analyzing syllabus...");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file) return;

    // Validate type
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg", "application/pdf"];
    if (!allowed.includes(file.type)) {
      setError("Please upload an image (JPG, PNG, WebP) or PDF.");
      setState("error");
      return;
    }

    setFileName(file.name);
    setState("uploading");
    setError(null);

    // Show image preview
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    // Upload to backend
    const formData = new FormData();
    formData.append("file", file);
    if (deadline) formData.append("deadline", deadline);
    formData.append("hours_day", String(hoursPerDay));

    const progressSteps = [
      "📸 Processing image...",
      "🧠 Gemini analyzing syllabus...",
      "📋 Extracting topics and chapters...",
      "⏱️ Estimating study hours...",
      "🗓️ Building milestone plan...",
    ];
    let stepIndex = 0;
    const progressInterval = setInterval(() => {
      if (stepIndex < progressSteps.length - 1) {
        setProgress(progressSteps[++stepIndex]);
      }
    }, 1200);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_URL}/api/agents/syllabus/parse`, {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Upload failed");
      }

      const result = await response.json();
      const extracted: ExtractedPlan = result.data;

      setPlan(extracted);
      setState("success");
      onPlanExtracted(extracted, file);
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err.message || "Failed to analyze syllabus. Please try again.");
      setState("error");
    }
  }, [deadline, hoursPerDay, onPlanExtracted]);

  // Drag & drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState("idle");
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setState("dragging");
  };

  const handleDragLeave = () => setState("idle");

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const reset = () => {
    setState("idle");
    setPreview(null);
    setFileName(null);
    setError(null);
    setPlan(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const confidenceColor = {
    high: "text-emerald-400",
    medium: "text-amber-400",
    low: "text-red-400",
  };

  return (
    <div className="space-y-4">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileInput}
        className="hidden"
      />
      {/* Camera capture — mobile only */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Drop zone */}
      {state !== "success" && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative rounded-xl border border-dashed transition-all duration-200 overflow-hidden
            ${state === "dragging"
              ? "border-[var(--accent-blue)] bg-[var(--accent-blue-dim)] scale-[1.01]"
              : state === "uploading"
              ? "border-[var(--accent-blue)]/50 bg-[var(--accent-blue-dim)]/5"
              : state === "error"
              ? "border-[var(--accent-red)]/50 bg-[var(--accent-red-dim)]/5"
              : "border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-[var(--accent-blue)] hover:bg-[var(--bg-overlay)]"
            }
          `}
        >
          {/* Uploading overlay */}
          {state === "uploading" && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center z-10 gap-3">
              <div className="relative">
                <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
                <Sparkles className="w-4 h-4 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <p className="text-sm text-white/70 font-mono">{progress}</p>
              {preview && (
                <div className="mt-2 opacity-30">
                  <img src={preview} alt="Syllabus preview" className="h-24 rounded-lg object-cover" />
                </div>
              )}
            </div>
          )}

          <div className="p-8 flex flex-col items-center gap-4 text-center">
            {preview && state !== "uploading" ? (
              <img src={preview} alt="Syllabus" className="h-32 rounded-lg object-cover shadow-lg" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-[var(--accent-blue-dim)] border border-[rgba(79,158,255,0.2)] flex items-center justify-center">
                <FileText className="w-8 h-8 text-[var(--accent-blue)]" />
              </div>
            )}

            {state === "error" ? (
              <div className="space-y-2">
                <p className="text-sm text-[var(--accent-red)] font-medium">{error}</p>
                <button onClick={reset} className="text-xs text-[var(--text-muted)] hover:text-white underline">
                  Try again
                </button>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-sm font-medium text-white/80">
                    {fileName ? fileName : "Drag and drop or browse"}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    JPG, PNG, WebP, or PDF — Gemini will extract topics automatically
                  </p>
                </div>

                <div className="flex gap-3 flex-wrap justify-center">
                  {/* Camera button — shows on mobile, great for demo */}
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-blue-dim)] border border-blue-500/30 text-[var(--accent-blue)] text-sm font-medium hover:bg-[var(--accent-blue-dim)]/80 transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    Take Photo
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-transparent border border-[var(--border-default)] text-[var(--text-secondary)] text-sm font-medium hover:bg-white/5 transition-all cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    Browse Files
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Success state — extracted plan preview */}
      {state === "success" && plan && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-white">{plan.goal_title}</p>
                <p className="text-xs text-white/40">{plan.subject_area}</p>
              </div>
            </div>
            <button onClick={reset} className="p-1 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/[0.03] rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-white">{plan.detected_topics.length}</p>
              <p className="text-xs text-white/40">topics</p>
            </div>
            <div className="bg-white/[0.03] rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-white">{plan.total_estimated_hours}h</p>
              <p className="text-xs text-white/40">total study</p>
            </div>
            <div className="bg-white/[0.03] rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-white">{plan.milestones.length}</p>
              <p className="text-xs text-white/40">milestones</p>
            </div>
          </div>

          {/* Topics preview */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider">Detected Topics</p>
            <div className="flex flex-wrap gap-2">
              {plan.detected_topics.slice(0, 6).map((topic) => (
                <span
                  key={topic.name}
                  className={`text-xs px-2 py-1 rounded-md font-medium ${
                    topic.priority === "high"
                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                      : topic.priority === "medium"
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "bg-white/5 text-white/50 border border-white/10"
                  }`}
                >
                  {topic.name}
                </span>
              ))}
              {plan.detected_topics.length > 6 && (
                <span className="text-xs px-2 py-1 text-white/30">
                  +{plan.detected_topics.length - 6} more
                </span>
              )}
            </div>
          </div>

          {/* Confidence */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/30">Suggested deadline: {plan.suggested_deadline}</span>
            <span className={`font-medium ${confidenceColor[plan.confidence]}`}>
              {plan.confidence} confidence
            </span>
          </div>

          {plan.extraction_notes && (
            <p className="text-xs text-white/30 italic">{plan.extraction_notes}</p>
          )}
        </div>
      )}
    </div>
  );
}
