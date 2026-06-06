"use client";

import { useState, type KeyboardEvent } from "react";
import { X, Hash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MAX_TAG_LEN = 30;

/** 엔터/쉼표로 태그 칩 추가, 백스페이스로 마지막 칩 삭제. */
export function TagInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function add(raw: string) {
    const tag = raw.trim().replace(/^#/, "").slice(0, MAX_TAG_LEN);
    if (!tag) return;
    if (value.includes(tag)) {
      setDraft("");
      return;
    }
    onChange([...value, tag]);
    setDraft("");
  }

  function remove(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      remove(value[value.length - 1]);
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="tag-input">태그</Label>
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <li key={tag}>
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-text-2">
                <Hash className="size-3" />
                {tag}
                <button
                  type="button"
                  onClick={() => remove(tag)}
                  aria-label={`태그 ${tag} 삭제`}
                  className="-mr-0.5 rounded-full p-0.5 hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <Input
        id="tag-input"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => add(draft)}
        placeholder="태그 입력 후 Enter (예: 집회, 종로)"
        maxLength={MAX_TAG_LEN}
      />
    </div>
  );
}
