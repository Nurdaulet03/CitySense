"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { communityNotesAPI } from "@/lib/api";
import { MapPin, Loader2 } from "lucide-react";

const NOTE_CATEGORIES = [
  { value: "tip", label: "Tip" },
  { value: "warning", label: "Warning" },
  { value: "recommendation", label: "Recommendation" },
  { value: "info", label: "Info" },
  { value: "question", label: "Question" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: { lat: number; lng: number };
  onCreated: () => void;
}

export function AddNoteDialog({ open, onOpenChange, location, onCreated }: Props) {
  const [text, setText] = useState("");
  const [category, setCategory] = useState("info");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setText("");
    setCategory("info");
    setError("");
  };

  const handleSubmit = async () => {
    if (!text.trim()) {
      setError("Note text is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await communityNotesAPI.create({
        text: text.trim(),
        category,
        location: { lat: location.lat, lng: location.lng },
      });
      resetForm();
      onOpenChange(false);
      onCreated();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      setError(msg || "Failed to create note. Make sure you are logged in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Community Note</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>
              {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note-text">Note *</Label>
            <Textarea
              id="note-text"
              placeholder="Share something useful about this spot..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {text.length}/500
            </p>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOTE_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Post Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
