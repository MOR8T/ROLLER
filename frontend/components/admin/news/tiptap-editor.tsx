"use client";

import { useEffect, useState, type ReactNode } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TiptapEditorProps {
  /** Name of the hidden `<input>` that carries the HTML into the surrounding form. */
  name: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * A minimal rich-text editor for the news body: bold/italic/strike,
 * headings, lists, a quote and a link — everything `ArticlePage` renders,
 * nothing it doesn't (see `.rich-text` in `app/globals.css`, shared by both).
 *
 * Tiptap's `EditorContent` is not a form control, so its HTML is mirrored
 * into a hidden `<input name={name}>` on every edit; the surrounding
 * `<form>` picks that up through the plain `FormData(form)` reads
 * `NewsManager` already uses for every other field.
 */
export function TiptapEditor({
  name,
  defaultValue = "",
  placeholder,
  disabled,
}: TiptapEditorProps) {
  const [html, setHtml] = useState(defaultValue);

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({ link: { openOnClick: false, autolink: true } }),
      Placeholder.configure({ placeholder }),
    ],
    content: defaultValue,
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "rich-text min-h-40 px-4 py-3 focus:outline-none",
      },
    },
  });

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  function toggleLink() {
    if (!editor) return;
    const active = editor.isActive("link");
    if (active) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    const url = window.prompt("Ссылка (https://...)");
    if (!url) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-control border border-brand-black/15 bg-surface transition-colors focus-within:border-brand-red",
        disabled && "opacity-60",
      )}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-brand-black/10 p-1.5">
        <ToolbarButton
          label="Жирный"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          active={editor?.isActive("bold")}
          disabled={disabled}
        >
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Курсив"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          active={editor?.isActive("italic")}
          disabled={disabled}
        >
          <Italic className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Зачёркнутый"
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          active={editor?.isActive("strike")}
          disabled={disabled}
        >
          <Strikethrough className="size-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          label="Заголовок"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor?.isActive("heading", { level: 2 })}
          disabled={disabled}
        >
          <Heading2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Подзаголовок"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor?.isActive("heading", { level: 3 })}
          disabled={disabled}
        >
          <Heading3 className="size-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          label="Маркированный список"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          active={editor?.isActive("bulletList")}
          disabled={disabled}
        >
          <List className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Нумерованный список"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          active={editor?.isActive("orderedList")}
          disabled={disabled}
        >
          <ListOrdered className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Цитата"
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          active={editor?.isActive("blockquote")}
          disabled={disabled}
        >
          <Quote className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label={editor?.isActive("link") ? "Убрать ссылку" : "Добавить ссылку"}
          onClick={toggleLink}
          active={editor?.isActive("link")}
          disabled={disabled}
        >
          {editor?.isActive("link") ? (
            <Link2Off className="size-4" />
          ) : (
            <Link2 className="size-4" />
          )}
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          label="Отменить"
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={disabled || !editor?.can().undo()}
        >
          <Undo2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Повторить"
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={disabled || !editor?.can().redo()}
        >
          <Redo2 className="size-4" />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />
      <input type="hidden" name={name} value={html} readOnly />
    </div>
  );
}

function Divider() {
  return <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-brand-black/10" />;
}

function ToolbarButton({
  label,
  onClick,
  active,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-control transition-colors focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40",
        active ? "bg-brand-black text-brand-white" : "text-brand-black hover:bg-brand-black/5",
      )}
    >
      {children}
    </button>
  );
}
