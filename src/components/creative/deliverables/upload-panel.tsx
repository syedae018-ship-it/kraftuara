"use client";

import React, { useState } from "react";
import { StorageProvider, DeliverableVersion } from "@/types/creative-mvp";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, HardDrive, Link as LinkIcon, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export interface UploadPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (input: {
    filename: string;
    size: string;
    url: string;
    provider: StorageProvider;
    version: DeliverableVersion;
    description?: string;
  }) => void;
}

export function UploadPanel({ isOpen, onClose, onUpload }: UploadPanelProps) {
  const [filename, setFilename] = useState("");
  const [url, setUrl] = useState("");
  const [provider, setProvider] = useState<StorageProvider>("gdrive");
  const [version, setVersion] = useState<DeliverableVersion>("v1");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!filename.trim() || !url.trim()) {
      toast.error("Filename & URL Required", "Please enter file details.");
      return;
    }

    onUpload({
      filename: filename.trim(),
      size: "6.4 MB",
      url: url.trim(),
      provider,
      version,
      description: description.trim(),
    });

    toast.success("Deliverable Uploaded!", `Added ${filename} (${version.toUpperCase()}).`);
    setFilename("");
    setUrl("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Deliverable Asset"
      description="Add final digital renders or Google Drive links for customer download."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-body">
        <Input
          label="Filename"
          placeholder="e.g. Royal_Oud_Banner_Final.png"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          required
        />

        <Input
          label="Asset URL / Google Drive Link"
          placeholder="https://drive.google.com/... or S3 URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          leftIcon={<LinkIcon className="w-4 h-4 text-zinc-500" />}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 font-heading">Storage Provider</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as StorageProvider)}
              className="w-full h-10 bg-[#111111] border border-white/10 rounded-xl px-3 text-xs text-white outline-none"
            >
              <option value="gdrive">Google Drive Link</option>
              <option value="s3">AWS S3</option>
              <option value="r2">Cloudflare R2</option>
              <option value="supabase">Supabase Storage</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 font-heading">Version Tag</label>
            <select
              value={version}
              onChange={(e) => setVersion(e.target.value as DeliverableVersion)}
              className="w-full h-10 bg-[#111111] border border-white/10 rounded-xl px-3 text-xs text-white outline-none"
            >
              <option value="v1">Version 1 (v1)</option>
              <option value="v2">Version 2 (v2)</option>
              <option value="final">Final Package (Final)</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300 font-heading">Deliverable Notes</label>
          <textarea
            rows={2}
            placeholder="Notes regarding resolution, formats included, or changes made..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-[#111111] border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder:text-zinc-600 outline-none resize-none"
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" leftIcon={<Upload className="w-3.5 h-3.5" />}>
            Upload Deliverable
          </Button>
        </div>
      </form>
    </Modal>
  );
}
