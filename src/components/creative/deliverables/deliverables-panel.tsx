"use client";

import React, { useState, useEffect } from "react";
import { Deliverable, StorageProvider, DeliverableVersion } from "@/types/creative-mvp";
import { creativeMVPRepository } from "@/lib/repositories/creative-mvp-repository";
import { DeliverableCard } from "./deliverable-card";
import { UploadPanel } from "./upload-panel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HardDrive, Upload, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DeliverablesPanelProps {
  orderId: string;
  className?: string;
}

export function DeliverablesPanel({ orderId, className }: DeliverablesPanelProps) {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);

  const fetchDeliverables = async () => {
    const list = await creativeMVPRepository.getDeliverables(orderId);
    setDeliverables(list);
  };

  useEffect(() => {
    fetchDeliverables();
  }, [orderId]);

  const handleAddDeliverable = async (input: {
    filename: string;
    size: string;
    url: string;
    provider: StorageProvider;
    version: DeliverableVersion;
    description?: string;
  }) => {
    await creativeMVPRepository.addDeliverable(orderId, input);
    await fetchDeliverables();
  };

  return (
    <Card className={cn("p-6 space-y-4 bg-[#151515] border-white/10", className)}>
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-maroon-400" />
          <div>
            <h4 className="text-xs font-bold font-heading text-white">Deliverables & Version History</h4>
            <p className="text-[11px] text-zinc-400 font-body">Download high-res renders and PSD packages</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setUploadOpen(true)}
          leftIcon={<Upload className="w-3.5 h-3.5" />}
        >
          Upload Asset
        </Button>
      </div>

      <div className="space-y-3">
        {deliverables.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500 font-body">
            No deliverable files uploaded yet.
          </div>
        ) : (
          deliverables.map((del) => <DeliverableCard key={del.id} deliverable={del} />)
        )}
      </div>

      <UploadPanel
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={handleAddDeliverable}
      />
    </Card>
  );
}
