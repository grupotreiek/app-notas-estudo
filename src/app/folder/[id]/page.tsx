'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  FileText, 
  Clock,
  Star,
  Upload,
  File
} from 'lucide-react'

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

interface Folder {
  id: string
  name: string
  color: string
  user_id: string
}

interface PDFFile {
  id: string
  name: string
  folder_id: string
  url: string
  created_at: string
}

const NOTES_STORAGE_KEY = 'notes_local'
const FOLDERS_STORAGE_KEY = 'folders_local'
const PDFS_STORAGE_KEY = 'pdfs_local'
const GUEST_USER_ID = '00000000-0000-0000-0000-000000000000'

export default function FolderPage() {
  const params = useParams()
  const router = useRouter()
  const folderId = params.id as string

  const [folder, setFolder] = useState<Folder | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [pdfs, setPdfs] = useState<PDFFile[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadFolderData()
  }, [folderId])

  const loadFolderData = () => {
    // Load folder
    const foldersData = localStorage.getItem(FOLDERS_STORAGE_KEY)
    if (foldersData) {
      const folders: Folder[] = JSON.parse(foldersData)
      const currentFolder = folders.find(f => f.id === folderId)
      setFolder(currentFolder || null)
    }

    // Load notes
    const notesData = localStorage.getItem(NOTES_STORAGE_KEY)
    if (notesData) {
      const allNotes: Note[] = JSON.parse(notesData)
      const folderNotes = allNotes.filter(n => n.folder_id === folderId)
      setNotes(folderNotes)
    }

    // Load PDFs
    const pdfsData = localStorage.getItem(PDFS_STORAGE_KEY)
    if (pdfsData) {
      const allPdfs: PDFFile[] = JSON.parse(pdfsData)
      const folderPdfs = allPdfs.filter(p => p.folder_id === folderId)
      setPdfs(folderPdfs)
    }
  }

  const createNote = () => {
    const newNote = {
      id: `note-${Date.now()}`,
      title: 'Untitled Note',
      content: '',
      tags: [],
      user_id: GUEST_USER_ID,
      folder_id: folderId,
      is_favorite: false,
      shared_with: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Update local storage
    const notesData = localStorage.getItem(NOTES_STORAGE_KEY)
    const allNotes = notesData ? JSON.parse(notesData) : []
    const updatedNotes = [newNote, ...allNotes]
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updatedNotes))
    
    router.push(`/notes/${newNote.id}`)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newPdfs: PDFFile[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Create a URL for the file (in production, you'd upload to storage)
      const fileUrl = URL.createObjectURL(file)
      
      const newPdf: PDFFile = {
        id: `pdf-${Date.now()}-${i}`,
        name: file.name,
        folder_id: folderId,
        url: fileUrl,
        created_at: new Date().toISOString()
      }
      
      newPdfs.push(newPdf)
    }

    // Update local storage
    const pdfsData = localStorage.getItem(PDFS_STORAGE_KEY)
    const allPdfs = pdfsData ? JSON.parse(pdfsData) : []
    const updatedPdfs = [...newPdfs, ...allPdfs]
    localStorage.setItem(PDFS_STORAGE_KEY, JSON.stringify(updatedPdfs))
    
    setPdfs([...newPdfs, ...pdfs])
  }

  const toggleFavorite = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation()
    
    const notesData = localStorage.getItem(NOTES_STORAGE_KEY)
    if (!notesData) return
    
    const allNotes: Note[] = JSON.parse(notesData)
    const updatedNotes = allNotes.map(n => 
      n.id === note.id ? { ...n, is_favorite: !n.is_favorite } : n
    )
    
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updatedNotes))
    setNotes(notes.map(n => 
      n.id === note.id ? { ...n, is_favorite: !n.is_favorite } : n
    ))
  }

  const openNote = (noteId: string) => {
    router.push(`/notes/${noteId}`)
  }

  const openPdf = (pdf: PDFFile) => {
    window.open(pdf.url, '_blank')
  }

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredPdfs = pdfs.filter(pdf =>
    pdf.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!folder) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f0f4f8]">
        <div className="text-center">
          <p className="text-gray-600">Folder not found</p>
          <Button 
            onClick={() => router.push('/')}
            className="mt-4 bg-[#4a90e2] hover:bg-[#357abd]"
          >
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push('/')}
              variant="ghost"
              className="rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${folder.color}20` }}
              >
                <FileText className="h-6 w-6" style={{ color: folder.color }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{folder.name}</h1>
                <p className="text-sm text-gray-500">
                  {notes.length} notes • {pdfs.length} files
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="file-upload">
              <Button
                asChild
                variant="outline"
                className="rounded-lg cursor-pointer"
              >
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload PDF
                </span>
              </Button>
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={createNote}
              className="bg-[#4a90e2] hover:bg-[#357abd] text-white rounded-lg px-6"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-2xl">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search in this folder..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-50 border-gray-200 rounded-lg"
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        {/* PDFs Section */}
        {pdfs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">PDF Files</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {filteredPdfs.map(pdf => (
                <Card
                  key={pdf.id}
                  className="cursor-pointer hover:shadow-xl transition-all border-2 border-transparent hover:border-[#4a90e2] rounded-2xl overflow-hidden group"
                  onClick={() => openPdf(pdf)}
                >
                  <div className="aspect-[3/4] bg-gradient-to-br from-red-50 to-orange-50 p-4 flex items-center justify-center">
                    <File className="h-16 w-16 text-red-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-semibold text-sm text-gray-900 line-clamp-2">{pdf.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(pdf.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Notes Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
          {filteredNotes.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredNotes.map(note => (
                <Card 
                  key={note.id}
                  className="cursor-pointer hover:shadow-xl transition-all border-2 border-transparent hover:border-[#4a90e2] rounded-2xl overflow-hidden group relative"
                  onClick={() => openNote(note.id)}
                >
                  <button
                    onClick={(e) => toggleFavorite(note, e)}
                    className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-sm transition-all"
                  >
                    <Star 
                      className={`h-4 w-4 ${note.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`}
                    />
                  </button>
                  <div className="aspect-[3/4] bg-white p-4 border-b border-gray-100">
                    <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(note.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <h3 className="font-semibold text-sm text-gray-900 mb-2 line-clamp-2">{note.title}</h3>
                    <div 
                      className="text-xs text-gray-600 line-clamp-4"
                      dangerouslySetInnerHTML={{ __html: note.content || 'Empty note' }}
                    />
                  </div>
                  <CardContent className="p-3 bg-gray-50">
                    {note.tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {note.tags.slice(0, 2).map((tag, idx) => (
                          <span 
                            key={`${note.id}-tag-${idx}`}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {note.tags.length > 2 && (
                          <span className="text-xs text-gray-500">+{note.tags.length - 2}</span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-300">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No notes in this folder</p>
              <p className="text-gray-400 text-sm mt-2">Create your first note to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
