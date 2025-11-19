'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TextAlign } from '@tiptap/extension-text-align'
import { Underline } from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import { Link } from '@tiptap/extension-link'
import { Image } from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Highlighter,
  Save,
  ArrowLeft,
  Star,
  Share2,
  Download
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const GUEST_USER_ID = '00000000-0000-0000-0000-000000000000'

interface Note {
  id: string
  title: string
  content: string
  folder_id?: string
  tags: string[]
  created_at: string
  updated_at: string
  user_id: string
  is_favorite: boolean
  shared_with: string[]
}

export default function NoteEditorPage() {
  const params = useParams()
  const router = useRouter()
  const [note, setNote] = useState<Note | null>(null)
  const [title, setTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [useSupabase, setUseSupabase] = useState(false) // Iniciado como false pois Supabase está desabilitado

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Image,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none max-w-none min-h-[calc(100vh-300px)] px-8 py-6',
      },
    },
  })

  useEffect(() => {
    loadNote()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  useEffect(() => {
    if (note && editor && !editor.isDestroyed) {
      editor.commands.setContent(note.content || '')
      setTitle(note.title)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note, editor])

  const loadNote = async () => {
    // Tentar carregar do Supabase primeiro (desabilitado)
    if (useSupabase && supabase) {
      try {
        const { data, error } = await supabase
          .from('notes_v2')
          .select('*')
          .eq('id', params.id)
          .eq('user_id', GUEST_USER_ID)
          .single()

        if (!error && data) {
          setNote(data)
          return
        }
      } catch (e) {
        console.error('Supabase error:', e)
        setUseSupabase(false)
      }
    }

    // Fallback: carregar do localStorage
    const localNotes = localStorage.getItem('notes')
    if (localNotes) {
      const notes = JSON.parse(localNotes)
      const foundNote = notes.find((n: Note) => n.id === params.id)
      if (foundNote) {
        setNote(foundNote)
        return
      }
    }

    // Se não encontrou, criar nota vazia
    const newNote: Note = {
      id: params.id as string,
      title: 'Untitled Note',
      content: '',
      tags: [],
      user_id: GUEST_USER_ID,
      is_favorite: false,
      shared_with: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    setNote(newNote)
  }

  const saveNote = async () => {
    if (!note || !editor) return

    setIsSaving(true)
    const content = editor.getHTML()
    const updatedNote = {
      ...note,
      title,
      content,
      updated_at: new Date().toISOString()
    }

    if (useSupabase && supabase) {
      try {
        const { error } = await supabase
          .from('notes_v2')
          .update({ 
            title, 
            content,
            updated_at: new Date().toISOString()
          })
          .eq('id', note.id)

        if (!error) {
          setLastSaved(new Date())
          setNote(updatedNote)
          setIsSaving(false)
          return
        }
      } catch (e) {
        console.error('Supabase error:', e)
        setUseSupabase(false)
      }
    }

    // Fallback: salvar no localStorage
    const localNotes = localStorage.getItem('notes')
    let notes = localNotes ? JSON.parse(localNotes) : []
    const noteIndex = notes.findIndex((n: Note) => n.id === note.id)
    
    if (noteIndex >= 0) {
      notes[noteIndex] = updatedNote
    } else {
      notes.push(updatedNote)
    }
    
    localStorage.setItem('notes', JSON.stringify(notes))
    setLastSaved(new Date())
    setNote(updatedNote)
    setIsSaving(false)
  }

  const toggleFavorite = async () => {
    if (!note) return

    const updatedNote = { ...note, is_favorite: !note.is_favorite }

    if (useSupabase && supabase) {
      try {
        const { error } = await supabase
          .from('notes_v2')
          .update({ is_favorite: !note.is_favorite })
          .eq('id', note.id)

        if (!error) {
          setNote(updatedNote)
          return
        }
      } catch (e) {
        console.error('Supabase error:', e)
        setUseSupabase(false)
      }
    }

    // Fallback: atualizar localStorage
    const localNotes = localStorage.getItem('notes')
    if (localNotes) {
      const notes = JSON.parse(localNotes)
      const noteIndex = notes.findIndex((n: Note) => n.id === note.id)
      if (noteIndex >= 0) {
        notes[noteIndex] = updatedNote
        localStorage.setItem('notes', JSON.stringify(notes))
      }
    }
    setNote(updatedNote)
  }

  const exportNote = () => {
    if (!note || !editor) return
    const content = `# ${title}\\n\\n${editor.getText()}`
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title}.md`
    a.click()
  }

  if (!editor) return null

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Top Bar */}
      <div className="border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="rounded-lg"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
            className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-2"
          />
        </div>
        <div className="flex items-center gap-2">
          {lastSaved && (
            <span className="text-xs text-gray-500">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFavorite}
            className="rounded-lg"
          >
            <Star className={`h-4 w-4 ${note?.is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={exportNote}
            className="rounded-lg"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-lg"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            onClick={saveNote}
            disabled={isSaving}
            className="bg-[#4a90e2] hover:bg-[#357abd] text-white rounded-lg"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="border-b border-gray-200 px-6 py-2 flex items-center gap-1 flex-wrap bg-gray-50">
        {/* Undo/Redo */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="h-8 w-8 p-0"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="h-8 w-8 p-0"
        >
          <Redo className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Headings */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`h-8 px-2 ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}`}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`h-8 px-2 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}`}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`h-8 px-2 ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''}`}
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Text Formatting */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('underline') ? 'bg-gray-200' : ''}`}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('strike') ? 'bg-gray-200' : ''}`}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('code') ? 'bg-gray-200' : ''}`}
        >
          <Code className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Text Color */}
        <input
          type="color"
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          className="h-8 w-8 rounded cursor-pointer"
          title="Text Color"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('highlight') ? 'bg-gray-200' : ''}`}
        >
          <Highlighter className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Alignment */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''}`}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''}`}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''}`}
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-200' : ''}`}
        >
          <AlignJustify className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Lists */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('orderedList') ? 'bg-gray-200' : ''}`}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('blockquote') ? 'bg-gray-200' : ''}`}
        >
          <Quote className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Table */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          className="h-8 w-8 p-0"
        >
          <TableIcon className="h-4 w-4" />
        </Button>

        {/* Link */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const url = window.prompt('Enter URL:')
            if (url) {
              editor.chain().focus().setLink({ href: url }).run()
            }
          }}
          className={`h-8 w-8 p-0 ${editor.isActive('link') ? 'bg-gray-200' : ''}`}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>

        {/* Image */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const url = window.prompt('Enter image URL:')
            if (url) {
              editor.chain().focus().setImage({ src: url }).run()
            }
          }}
          className="h-8 w-8 p-0"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto bg-white">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}