'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { useEffect } from 'react';

type RichEditorProps = {
  content: string;
  onChange: (html: string) => void;
  editable?: boolean;
};

export function RichEditor({ content, onChange, editable = true }: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-white underline underline-offset-2' },
      }),
    ],
    content,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose-editor focus:outline-none min-h-[500px]',
      },
    },
  });

  // Update editable state when prop changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  // Update content when it changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div>
      {/* Toolbar — only show when editable */}
      {editable && (
        <div className="flex items-center gap-1 mb-8 pb-4 border-b border-minimal-border">
          <ToolbarBtn
            active={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            label="H2"
          />
          <ToolbarBtn
            active={editor.isActive('heading', { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            label="H3"
          />
          <div className="w-px h-4 bg-minimal-border mx-2" />
          <ToolbarBtn
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
            label="B"
            bold
          />
          <ToolbarBtn
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            label="I"
            italic
          />
          <div className="w-px h-4 bg-minimal-border mx-2" />
          <ToolbarBtn
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            label="List"
          />
          <ToolbarBtn
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            label="1."
          />
          <div className="w-px h-4 bg-minimal-border mx-2" />
          <ToolbarBtn
            active={editor.isActive('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            label="Quote"
          />
          <ToolbarBtn
            active={false}
            onClick={() => {
              const url = window.prompt('URL:');
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }}
            label="Link"
          />
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarBtn({ active, onClick, label, bold, italic }: {
  active: boolean;
  onClick: () => void;
  label: string;
  bold?: boolean;
  italic?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 text-[11px] uppercase tracking-wider rounded-sm transition-colors ${
        active
          ? 'bg-white text-black'
          : 'text-minimal-muted hover:text-white'
      } ${bold ? 'font-bold' : ''} ${italic ? 'italic' : ''}`}
    >
      {label}
    </button>
  );
}
