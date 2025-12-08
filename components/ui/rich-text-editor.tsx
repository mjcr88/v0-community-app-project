"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { Underline } from '@tiptap/extension-underline'
import { TextAlign } from '@tiptap/extension-text-align'
import { Link } from '@tiptap/extension-link'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Table as TableIcon,
  Heading1,
  Heading2,
  Heading3,
  Minus,
  Plus,
  Trash2,
} from "lucide-react"
import { Button } from "./button"
import { useEffect } from "react"
import { cn } from "@/lib/utils"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  editable?: boolean
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
  editable = true
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || '',
    editable,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none focus:outline-none min-h-[200px] px-3 py-2 text-sm border rounded-md border-input bg-background",
          "dark:prose-invert",
          // Table styles
          "[&_table]:border-collapse [&_table]:w-full [&_table]:my-4",
          "[&_table]:border [&_table]:border-border",
          "[&_td]:border [&_td]:border-border [&_td]:p-2 [&_td]:min-w-[100px]",
          "[&_th]:border [&_th]:border-border [&_th]:p-2 [&_th]:font-bold [&_th]:bg-muted [&_th]:min-w-[100px]",
          "[&_tr]:border-b [&_tr]:border-border",
          className
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  useEffect(() => {
    if (editor && value !== undefined && value !== null) {
      const currentContent = editor.getHTML()
      if (value !== currentContent) {
        editor.commands.setContent(value || '')
      }
    }
  }, [value, editor])

  if (!editor) {
    return null
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    if (url === null) return

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      {editable && (
        <div className="flex flex-wrap gap-1 p-2 border rounded-md bg-muted/30">
          {/* Text Formatting */}
          <div className="flex gap-1 border-r pr-2 mr-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={cn("h-8 w-8 p-0", editor.isActive("bold") && "bg-muted")}
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={cn("h-8 w-8 p-0", editor.isActive("italic") && "bg-muted")}
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={cn("h-8 w-8 p-0", editor.isActive("underline") && "bg-muted")}
              title="Underline"
            >
              <UnderlineIcon className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={cn("h-8 w-8 p-0", editor.isActive("strike") && "bg-muted")}
              title="Strikethrough"
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={cn("h-8 w-8 p-0", editor.isActive("code") && "bg-muted")}
              title="Code"
            >
              <Code className="h-4 w-4" />
            </Button>
          </div>

          {/* Headings */}
          <div className="flex gap-1 border-r pr-2 mr-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={cn("h-8 w-8 p-0", editor.isActive("heading", { level: 1 }) && "bg-muted")}
              title="Heading 1"
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={cn("h-8 w-8 p-0", editor.isActive("heading", { level: 2 }) && "bg-muted")}
              title="Heading 2"
            >
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={cn("h-8 w-8 p-0", editor.isActive("heading", { level: 3 }) && "bg-muted")}
              title="Heading 3"
            >
              <Heading3 className="h-4 w-4" />
            </Button>
          </div>

          {/* Lists */}
          <div className="flex gap-1 border-r pr-2 mr-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={cn("h-8 w-8 p-0", editor.isActive("bulletList") && "bg-muted")}
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={cn("h-8 w-8 p-0", editor.isActive("orderedList") && "bg-muted")}
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={cn("h-8 w-8 p-0", editor.isActive("blockquote") && "bg-muted")}
              title="Quote"
            >
              <Quote className="h-4 w-4" />
            </Button>
          </div>

          {/* Alignment */}
          <div className="flex gap-1 border-r pr-2 mr-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className={cn("h-8 w-8 p-0", editor.isActive({ textAlign: 'left' }) && "bg-muted")}
              title="Align Left"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className={cn("h-8 w-8 p-0", editor.isActive({ textAlign: 'center' }) && "bg-muted")}
              title="Align Center"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className={cn("h-8 w-8 p-0", editor.isActive({ textAlign: 'right' }) && "bg-muted")}
              title="Align Right"
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Link & Table */}
          <div className="flex gap-1 border-r pr-2 mr-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={setLink}
              className={cn("h-8 w-8 p-0", editor.isActive("link") && "bg-muted")}
              title="Add Link"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addTable}
              className="h-8 w-8 p-0"
              title="Insert Table"
            >
              <TableIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Table Controls - Only show when inside a table */}
          {editor.isActive('table') && (
            <div className="flex gap-1 border-r pr-2 mr-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().addColumnBefore().run()}
                className="h-8 px-2 text-xs"
                title="Add Column Before"
              >
                <Plus className="h-3 w-3 mr-1" />
                Col
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                className="h-8 px-2 text-xs"
                title="Add Column After"
              >
                Col
                <Plus className="h-3 w-3 ml-1" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().deleteColumn().run()}
                className="h-8 px-2 text-xs"
                title="Delete Column"
              >
                <Minus className="h-3 w-3 mr-1" />
                Col
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().addRowBefore().run()}
                className="h-8 px-2 text-xs"
                title="Add Row Before"
              >
                <Plus className="h-3 w-3 mr-1" />
                Row
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().addRowAfter().run()}
                className="h-8 px-2 text-xs"
                title="Add Row After"
              >
                Row
                <Plus className="h-3 w-3 ml-1" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().deleteRow().run()}
                className="h-8 px-2 text-xs"
                title="Delete Row"
              >
                <Minus className="h-3 w-3 mr-1" />
                Row
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().deleteTable().run()}
                className="h-8 w-8 p-0"
                title="Delete Table"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Undo/Redo */}
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="h-8 w-8 p-0"
              title="Undo"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="h-8 w-8 p-0"
              title="Redo"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  )
}
