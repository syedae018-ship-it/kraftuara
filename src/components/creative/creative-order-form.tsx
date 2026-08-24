"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CreativeService, PriorityLevel, CreateCreativeOrderInput } from "@/types/creative";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/products/image-uploader";
import { Sparkles, Check, ArrowRight, ArrowLeft, Paperclip, Link as LinkIcon, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface CreativeOrderFormProps {
  services: CreativeService[];
  preselectedServiceId?: string;
  onSubmit: (input: CreateCreativeOrderInput) => void;
  isSubmitting?: boolean;
}

export function CreativeOrderForm({
  services,
  preselectedServiceId,
  onSubmit,
  isSubmitting = false,
}: CreativeOrderFormProps) {
  const router = useRouter();

  const [step, setStep] = useState<number>(preselectedServiceId ? 2 : 1);
  const [selectedServiceId, setSelectedServiceId] = useState<string>(preselectedServiceId || services[0]?.id || "");
  const [projectTitle, setProjectTitle] = useState("");
  const [requirements, setRequirements] = useState("");
  const [deadline, setDeadline] = useState("2026-02-20");
  const [priority, setPriority] = useState<PriorityLevel>("high");
  const [referenceLinkInput, setReferenceLinkInput] = useState("");
  const [referenceLinks, setReferenceLinks] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const selectedService = services.find((s) => s.id === selectedServiceId) || services[0];

  const handleAddLink = () => {
    if (referenceLinkInput.trim()) {
      setReferenceLinks([...referenceLinks, referenceLinkInput.trim()]);
      setReferenceLinkInput("");
    }
  };

  const handleNextStep = () => {
    if (step === 1 && !selectedServiceId) {
      toast.error("Service Required", "Please select a service.");
      return;
    }
    if (step === 2 && (!projectTitle.trim() || !requirements.trim())) {
      toast.error("Title & Requirements Required", "Please provide a project title and brief requirements.");
      return;
    }
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    onSubmit({
      serviceId: selectedService.id,
      serviceTitle: selectedService.title,
      projectTitle,
      requirements,
      deadline,
      priority,
      attachments: [],
      referenceLinks,
      notes,
    });
  };

  return (
    <div className="space-y-6">
      {/* Step Progress Bar */}
      <div className="grid grid-cols-4 gap-2 border-b border-white/10 pb-4 text-center font-heading text-xs">
        {["1. Choose Service", "2. Project Brief", "3. References", "4. Review & Order"].map((st, idx) => (
          <div
            key={st}
            className={cn(
              "py-2 rounded-xl transition-all font-semibold",
              step === idx + 1
                ? "bg-maroon-950/80 border border-maroon-600/50 text-white shadow-glow"
                : step > idx + 1
                ? "bg-white/5 text-emerald-400"
                : "text-zinc-500"
            )}
          >
            {st}
          </div>
        ))}
      </div>

      {/* Step 1: Choose Service */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-base font-bold font-heading text-white">Select Creative Service</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {services.map((s) => {
              const isSelected = selectedServiceId === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedServiceId(s.id)}
                  className={cn(
                    "p-4 rounded-2xl border cursor-pointer transition-all flex items-start justify-between",
                    isSelected ? "bg-maroon-950/60 border-maroon-600 shadow-glow" : "bg-[#151515] border-white/10 hover:border-white/20"
                  )}
                >
                  <div className="space-y-1 pr-4">
                    <h4 className="text-sm font-bold font-heading text-white">{s.title}</h4>
                    <p className="text-xs text-zinc-400 font-body leading-relaxed">{s.description}</p>
                    <span className="text-xs font-mono font-semibold text-maroon-400 block pt-1">From ${s.startingPrice}</span>
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-maroon-400 shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2: Project Details */}
      {step === 2 && (
        <Card className="p-6 space-y-4 bg-[#151515] border-white/10">
          <h3 className="text-base font-bold font-heading text-white">Project Requirements & Brief</h3>

          <Input
            label="Project Title"
            placeholder="e.g. Eid Promotion Banners for Royal Amber Oud"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 font-heading tracking-wide">
              Detailed Creative Brief & Requirements
            </label>
            <textarea
              rows={4}
              placeholder="Describe desired style, dimensions, copy text, color palette preferences, and target audience..."
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              className="w-full bg-[#111111] border border-white/10 rounded-xl p-3 text-xs text-white font-body placeholder:text-zinc-600 outline-none hover:border-white/20 focus:border-maroon-700 transition-all resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Target Completion Date"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 font-heading tracking-wide">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full h-10 bg-[#111111] border border-white/10 rounded-xl px-3.5 text-xs text-white font-body outline-none hover:border-white/20 focus:border-maroon-700 cursor-pointer"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent Priority (+Fast Track)</option>
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Step 3: References & Links */}
      {step === 3 && (
        <Card className="p-6 space-y-4 bg-[#151515] border-white/10">
          <h3 className="text-base font-bold font-heading text-white">Reference Links & Files</h3>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Paste Dribbble, Behance, or Pinterest reference link..."
                  value={referenceLinkInput}
                  onChange={(e) => setReferenceLinkInput(e.target.value)}
                  leftIcon={<LinkIcon className="w-4 h-4 text-zinc-500" />}
                />
              </div>
              <Button variant="outline" size="sm" onClick={handleAddLink}>
                Add Link
              </Button>
            </div>

            {referenceLinks.length > 0 && (
              <div className="space-y-1 pt-1">
                {referenceLinks.map((l, i) => (
                  <div key={i} className="text-xs font-mono text-maroon-400 bg-white/5 p-2 rounded-lg truncate">
                    {l}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 font-heading tracking-wide">
              Additional Notes for Designer
            </label>
            <textarea
              rows={2}
              placeholder="Any specific brand guidelines, font choices, or restrictions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#111111] border border-white/10 rounded-xl p-3 text-xs text-white font-body placeholder:text-zinc-600 outline-none hover:border-white/20 focus:border-maroon-700 transition-all resize-none"
            />
          </div>
        </Card>
      )}

      {/* Step 4: Review & Submit */}
      {step === 4 && (
        <Card className="p-6 space-y-4 bg-[#151515] border-white/10">
          <h3 className="text-base font-bold font-heading text-white">Review Creative Order Brief</h3>

          <div className="bg-[#111111] border border-white/10 rounded-xl p-4 space-y-3 font-body text-xs">
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-zinc-400">Selected Service:</span>
              <span className="font-bold text-white font-heading">{selectedService.title}</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-zinc-400">Project Title:</span>
              <span className="font-semibold text-white">{projectTitle}</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-zinc-400">Target Deadline:</span>
              <span className="font-mono text-white">{deadline}</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-zinc-400">Estimated Cost:</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">${selectedService.startingPrice}.00</span>
            </div>
            <div className="space-y-1">
              <span className="text-zinc-400 block">Brief Requirements:</span>
              <p className="text-zinc-200 leading-relaxed bg-black/40 p-2.5 rounded-lg">{requirements}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Step Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        {step > 1 ? (
          <Button variant="outline" size="sm" onClick={handlePrevStep} leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Previous Step
          </Button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <Button variant="primary" size="sm" onClick={handleNextStep} rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
            Next Step
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            onClick={handleSubmitForm}
            isLoading={isSubmitting}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Submit Creative Brief
          </Button>
        )}
      </div>
    </div>
  );
}
