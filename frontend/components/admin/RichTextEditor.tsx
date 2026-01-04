"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Undo,
  Redo,
  Link as LinkIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxLength?: number;
  className?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Bắt đầu viết nội dung...",
  minHeight = "400px",
  maxLength = 10000,
  className = "",
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount.configure({
        limit: maxLength,
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "prose prose-blue max-w-none focus:outline-none px-6 py-4 " +
          "prose-ul:list-disc prose-ol:list-decimal prose-li:ml-0 " +
          "prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-800",
        style: `min-height: ${minHeight}`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Update editor content khi value thay đổi từ bên ngoài
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // Link dialog state
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");

  if (!editor) {
    return null;
  }

  const openLinkDialog = () => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, "");
    const previousUrl = editor.getAttributes("link").href || "";

    setLinkText(selectedText || "");
    setLinkUrl(previousUrl || "");
    setShowLinkDialog(true);
  };

  const insertLink = () => {
    if (!linkUrl) {
      setShowLinkDialog(false);
      return;
    }

    // If no text provided, use URL as text
    const displayText = linkText.trim() || linkUrl;

    // If there's selected text, just add link
    if (editor.state.selection.empty) {
      // No selection - insert new link with text
      editor
        .chain()
        .focus()
        .insertContent({
          type: "text",
          text: displayText,
          marks: [{ type: "link", attrs: { href: linkUrl } }],
        })
        .run();
    } else {
      // Has selection - add link to selected text
      editor.chain().focus().setLink({ href: linkUrl }).run();
    }

    setShowLinkDialog(false);
    setLinkUrl("");
    setLinkText("");
  };

  const removeLink = () => {
    editor.chain().focus().unsetLink().run();
    setShowLinkDialog(false);
  };

  const characterCount = editor.storage.characterCount.characters();
  const wordCount = editor.storage.characterCount.words();

  return (
    <div
      className={`border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm ${className}`}
    >
      {/* Toolbar */}
      <div className="border-b border-gray-100 bg-gray-50/50 p-2 flex flex-wrap items-center gap-1">
        {/* Text formatting */}
        <div className="flex gap-1 px-1 border-r border-gray-200">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded-lg transition-all hover:bg-white ${
              editor.isActive("bold")
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
            title="Bold"
          >
            <Bold size={18} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded-lg transition-all hover:bg-white ${
              editor.isActive("italic")
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
            title="Italic"
          >
            <Italic size={18} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 rounded-lg transition-all hover:bg-white ${
              editor.isActive("strike")
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
            title="Strikethrough"
          >
            <Strikethrough size={18} />
          </button>
        </div>

        {/* Lists */}
        <div className="flex gap-1 px-1 border-r border-gray-200">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded-lg transition-all hover:bg-white ${
              editor.isActive("bulletList")
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
            title="Bullet List"
          >
            <List size={18} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded-lg transition-all hover:bg-white ${
              editor.isActive("orderedList")
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
            title="Numbered List"
          >
            <ListOrdered size={18} />
          </button>
        </div>

        {/* Link */}
        <div className="flex gap-1 px-1 border-r border-gray-200">
          <button
            type="button"
            onClick={openLinkDialog}
            className={`p-2 rounded-lg transition-all hover:bg-white ${
              editor.isActive("link")
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
            title="Insert Link"
          >
            <LinkIcon size={18} />
          </button>
        </div>

        {/* Undo/Redo */}
        <div className="flex gap-1 px-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-2 rounded-lg transition-all hover:bg-white text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Undo"
          >
            <Undo size={18} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-2 rounded-lg transition-all hover:bg-white text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Redo"
          >
            <Redo size={18} />
          </button>
        </div>

        {/* Stats - Right side */}
        <div className="ml-auto flex gap-3 px-3 text-xs text-gray-500 font-medium">
          <span>{wordCount} words</span>
          <span
            className={
              characterCount > maxLength * 0.9
                ? "text-orange-600 font-bold"
                : ""
            }
          >
            {characterCount}/{maxLength} chars
          </span>
        </div>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-black text-gray-900 mb-4">
              Insert Link
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                  Display Text
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Click here"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                  URL *
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  onKeyDown={(e) => e.key === "Enter" && insertLink()}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowLinkDialog(false)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              {editor.isActive("link") && (
                <button
                  type="button"
                  onClick={removeLink}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-colors"
                >
                  Remove Link
                </button>
              )}
              <button
                type="button"
                onClick={insertLink}
                disabled={!linkUrl}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
