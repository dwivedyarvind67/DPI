"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, File, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";
import { usePipelineStore } from "@/store/pipelineStore";

export function UploadCard() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const isRunning = usePipelineStore((state) => state.stats.running);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    await api.pipeline.upload(file);
    setUploading(false);
    setSuccess(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Input PCAP</CardTitle>
        <CardDescription>Upload a network capture file to process.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-center w-full">
            <label htmlFor="dropzone-file" className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg bg-card transition-colors border-border ${isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-secondary/50'}`}>
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-muted-foreground">.pcap or .pcapng (Max 1GB)</p>
              </div>
              <input id="dropzone-file" type="file" className="hidden" accept=".pcap,.pcapng" onChange={handleFileChange} disabled={isRunning} />
            </label>
          </div>
          
          {file && (
            <div className="flex items-center justify-between p-3 bg-secondary rounded-md border border-border">
              <div className="flex items-center gap-3 overflow-hidden">
                <File className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              </div>
              {success ? (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : (
                <Button size="sm" onClick={handleUpload} disabled={uploading}>
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
