'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  Plus, 
  Search, 
  Star, 
  Share2, 
  Trash2, 
  Folder, 
  Settings,
  Menu,
  Layout,
  Clock,
  BookOpen,
  Sparkles,
  MoreVertical,
  Edit2,
  RotateCcw,
  RotateCw,
  Minus,
  ChevronDown,
  List,
  Image
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
  is_trashed?: boolean
  deleted_at?: string
}

interface Template {
  id: string
  name: string
  description: string
  category: string
  content: string
}

const GUEST_USER_ID = '00000000-0000-0000-0000-000000000000'
const TRASH_STORAGE_KEY = 'folders_trash'
const NOTES_STORAGE_KEY = 'notes_local'
const FOLDERS_STORAGE_KEY = 'folders_local'
const TEMPLATES_STORAGE_KEY = 'templates_local'

export function NotesDashboard() {
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [trashedFolders, setTrashedFolders] = useState<Folder[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false)
  const [isEditFolderDialogOpen, setIsEditFolderDialogOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderColor, setNewFolderColor] = useState('#3b82f6')
  const [activeTab, setActiveTab] = useState<'home' | 'creators' | 'collab'>('home')
  const [sidebarView, setSidebarView] = useState<'documents' | 'favorites' | 'shared' | 'templates' | 'trash'>('documents')
  const [isLoading, setIsLoading] = useState(true)
  const [draggedNote, setDraggedNote] = useState<Note | null>(null)
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null)

  useEffect(() => {
    loadData()
    loadTrashedFolders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadTrashedFolders = () => {
    if (typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem(TRASH_STORAGE_KEY)
      if (stored) {
        const trashed = JSON.parse(stored)
        setTrashedFolders(trashed)
      }
    } catch (e) {
      console.error('Error loading trashed folders:', e)
      setTrashedFolders([])
    }
  }

  const saveTrashedFolders = (trashed: Folder[]) => {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(trashed))
      setTrashedFolders(trashed)
    } catch (e) {
      console.error('Error saving trashed folders:', e)
    }
  }

  const loadData = () => {
    setIsLoading(true)
    fetchNotes()
    fetchFolders()
    fetchTemplates()
    setIsLoading(false)
  }

  const fetchNotes = () => {
    if (typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem(NOTES_STORAGE_KEY)
      if (stored) {
        setNotes(JSON.parse(stored))
      } else {
        setNotes([])
      }
    } catch (e) {
      console.error('Error loading notes:', e)
      setNotes([])
    }
  }

  const fetchFolders = () => {
    if (typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem(FOLDERS_STORAGE_KEY)
      if (stored) {
        setFolders(JSON.parse(stored))
      } else {
        setFolders([])
      }
    } catch (e) {
      console.error('Error loading folders:', e)
      setFolders([])
    }
  }

  const getDefaultTemplates = (): Template[] => {
    return [
      { id: '1', name: 'Meeting Notes', description: 'Template for meeting notes', category: 'Productivity', content: '<h1>Meeting Notes</h1><p>Date: </p><p>Attendees: </p><p>Agenda: </p>' },
      { id: '2', name: 'To-Do List', description: 'Simple to-do list', category: 'Productivity', content: '<h1>To-Do List</h1><ul><li>Task 1</li><li>Task 2</li></ul>' },
      { id: '3', name: 'Project Plan', description: 'Project planning template', category: 'Work', content: '<h1>Project Plan</h1><p>Goals: </p><p>Timeline: </p>' },
      { id: '4', name: 'Study Notes', description: 'Template for study notes', category: 'Education', content: '<h1>Study Notes</h1><p>Subject: </p><p>Key Points: </p>' },
      { id: '5', name: 'Journal Entry', description: 'Daily journal template', category: 'Personal', content: '<h1>Journal Entry</h1><p>Date: </p><p>Today I...</p>' },
    ]
  }

  const fetchTemplates = () => {
    if (typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY)
      if (stored) {
        setTemplates(JSON.parse(stored))
      } else {
        const defaultTemplates = getDefaultTemplates()
        setTemplates(defaultTemplates)
        localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(defaultTemplates))
      }
    } catch (e) {
      console.error('Error loading templates:', e)
      const defaultTemplates = getDefaultTemplates()
      setTemplates(defaultTemplates)
    }
  }

  const getFilteredNotes = () => {
    let filtered = notes

    // Filter by sidebar view
    if (sidebarView === 'favorites') {
      filtered = filtered.filter(note => note.is_favorite)
    } else if (sidebarView === 'shared') {
      filtered = filtered.filter(note => note.shared_with && note.shared_with.length > 0)
    }

    // Filter by search term
    filtered = filtered.filter(note =>
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    // Filter by selected folder
    if (selectedFolder) {
      filtered = filtered.filter(note => note.folder_id === selectedFolder)
    }

    return filtered
  }

  const filteredNotes = getFilteredNotes()

  const createNote = async () => {
    if (typeof window === 'undefined') return
    
    try {
      const newNote = {
        id: `note-${Date.now()}`,
        title: 'Untitled Note',
        content: '',
        tags: [],
        user_id: GUEST_USER_ID,
        folder_id: selectedFolder || undefined,
        is_favorite: false,
        shared_with: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const updatedNotes = [newNote, ...notes]
      setNotes(updatedNotes)
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updatedNotes))
      router.push(`/notes/${newNote.id}`)
    } catch (e) {
      console.error('Error creating note:', e)
    }
  }

  const createNoteFromTemplate = async (template: Template) => {
    if (typeof window === 'undefined') return
    
    try {
      const newNote = {
        id: `note-${Date.now()}`,
        title: template.name,
        content: template.content,
        tags: [template.category],
        user_id: GUEST_USER_ID,
        folder_id: selectedFolder || undefined,
        is_favorite: false,
        shared_with: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const updatedNotes = [newNote, ...notes]
      setNotes(updatedNotes)
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updatedNotes))
      router.push(`/notes/${newNote.id}`)
    } catch (e) {
      console.error('Error creating note from template:', e)
    }
  }

  const createFolder = async () => {
    if (!newFolderName.trim()) return
    if (typeof window === 'undefined') return

    try {
      const newFolder = {
        id: `folder-${Date.now()}`,
        name: newFolderName,
        color: newFolderColor,
        user_id: GUEST_USER_ID
      }

      const updatedFolders = [...folders, newFolder]
      setFolders(updatedFolders)
      localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(updatedFolders))
      setNewFolderName('')
      setNewFolderColor('#3b82f6')
      setIsNewFolderDialogOpen(false)
    } catch (e) {
      console.error('Error creating folder:', e)
    }
  }

  const openEditFolderDialog = (folder: Folder, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingFolder(folder)
    setNewFolderName(folder.name)
    setNewFolderColor(folder.color)
    setIsEditFolderDialogOpen(true)
  }

  const updateFolder = async () => {
    if (!editingFolder || !newFolderName.trim()) return
    if (typeof window === 'undefined') return

    try {
      const updatedFolders = folders.map(f => 
        f.id === editingFolder.id 
          ? { ...f, name: newFolderName, color: newFolderColor }
          : f
      )
      setFolders(updatedFolders)
      localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(updatedFolders))
      setIsEditFolderDialogOpen(false)
      setEditingFolder(null)
      setNewFolderName('')
      setNewFolderColor('#3b82f6')
    } catch (e) {
      console.error('Error updating folder:', e)
    }
  }

  const moveToTrash = async (folder: Folder, e: React.MouseEvent) => {
    e.stopPropagation()
    if (typeof window === 'undefined') return
    
    try {
      const trashedFolder = {
        ...folder,
        is_trashed: true,
        deleted_at: new Date().toISOString()
      }
      
      const newTrashed = [...trashedFolders, trashedFolder]
      saveTrashedFolders(newTrashed)
      
      const updatedFolders = folders.filter(f => f.id !== folder.id)
      setFolders(updatedFolders)
      localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(updatedFolders))
      
      if (selectedFolder === folder.id) {
        setSelectedFolder(null)
      }
    } catch (e) {
      console.error('Error moving folder to trash:', e)
    }
  }

  const restoreFromTrash = async (folder: Folder, e: React.MouseEvent) => {
    e.stopPropagation()
    if (typeof window === 'undefined') return
    
    try {
      const newTrashed = trashedFolders.filter(f => f.id !== folder.id)
      saveTrashedFolders(newTrashed)
      
      const restoredFolder = { ...folder }
      delete restoredFolder.is_trashed
      delete restoredFolder.deleted_at
      
      const updatedFolders = [...folders, restoredFolder]
      setFolders(updatedFolders)
      localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(updatedFolders))
    } catch (e) {
      console.error('Error restoring folder:', e)
    }
  }

  const toggleFavorite = async (note: Note, e: React.MouseEvent) => {
    e.stopPropagation()
    if (typeof window === 'undefined') return
    
    try {
      const updatedNotes = notes.map(n => 
        n.id === note.id ? { ...n, is_favorite: !n.is_favorite } : n
      )
      setNotes(updatedNotes)
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updatedNotes))
    } catch (e) {
      console.error('Error toggling favorite:', e)
    }
  }

  const openNote = (noteId: string) => {
    router.push(`/notes/${noteId}`)
  }

  // Drag and Drop handlers
  const handleDragStart = (note: Note, e: React.DragEvent) => {
    setDraggedNote(note)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setDraggedNote(null)
    setDragOverFolder(null)
  }

  const handleDragOver = (folderId: string, e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverFolder(folderId)
  }

  const handleDragLeave = () => {
    setDragOverFolder(null)
  }

  const handleDrop = async (folderId: string, e: React.DragEvent) => {
    e.preventDefault()
    setDragOverFolder(null)

    if (!draggedNote) return
    if (typeof window === 'undefined') return

    try {
      const updatedNotes = notes.map(n =>
        n.id === draggedNote.id ? { ...n, folder_id: folderId, updated_at: new Date().toISOString() } : n
      )
      setNotes(updatedNotes)
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updatedNotes))
      setDraggedNote(null)
    } catch (e) {
      console.error('Error moving note:', e)
    }
  }

  // Toolbar action handlers
  const handleToolbarAction = (action: string) => {
    console.log(`Toolbar action: ${action}`)
    // Implementação futura: integrar com editor de texto
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f0f4f8]">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-[#4a90e2] mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading your notes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#f0f4f8]">
      {/* Sidebar - Estilo GoodNotes */}
      <div className="w-20 bg-[#4a90e2] flex flex-col items-center py-6 gap-6">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
          <BookOpen className="h-6 w-6 text-[#4a90e2]" />
        </div>

        <div className="flex flex-col gap-4 flex-1">
          <button
            onClick={() => {
              setSidebarView('documents')
              setSelectedFolder(null)
            }}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              sidebarView === 'documents' 
                ? 'bg-white text-[#4a90e2] shadow-lg' 
                : 'text-white hover:bg-white/20'
            }`}
          >
            <FileText className="h-5 w-5" />
          </button>

          <button
            onClick={() => {
              setSidebarView('favorites')
              setSelectedFolder(null)
            }}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              sidebarView === 'favorites' 
                ? 'bg-white text-[#4a90e2] shadow-lg' 
                : 'text-white hover:bg-white/20'
            }`}
          >
            <Star className="h-5 w-5" />
          </button>

          <button
            onClick={() => {
              setSidebarView('shared')
              setSelectedFolder(null)
            }}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              sidebarView === 'shared' 
                ? 'bg-white text-[#4a90e2] shadow-lg' 
                : 'text-white hover:bg-white/20'
            }`}
          >
            <Share2 className="h-5 w-5" />
          </button>

          <button
            onClick={() => {
              setSidebarView('templates')
              setSelectedFolder(null)
            }}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              sidebarView === 'templates' 
                ? 'bg-white text-[#4a90e2] shadow-lg' 
                : 'text-white hover:bg-white/20'
            }`}
          >
            <Layout className="h-5 w-5" />
          </button>

          <button
            onClick={() => {
              setSidebarView('trash')
              setSelectedFolder(null)
            }}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              sidebarView === 'trash' 
                ? 'bg-white text-[#4a90e2] shadow-lg' 
                : 'text-white hover:bg-white/20'
            }`}
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>

        <button className="w-12 h-12 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-all">
          <Settings className="h-5 w-5" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {sidebarView === 'documents' && 'Documents'}
              {sidebarView === 'favorites' && 'Favorites'}
              {sidebarView === 'shared' && 'Shared'}
              {sidebarView === 'templates' && 'Marketplace'}
              {sidebarView === 'trash' && 'Trash'}
            </h1>
            <div className="flex items-center gap-3">
              {sidebarView !== 'trash' && (
                <Button
                  onClick={createNote}
                  className="bg-[#4a90e2] hover:bg-[#357abd] text-white rounded-lg px-6"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Note
                </Button>
              )}
              <Button variant="outline" className="rounded-lg">
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {sidebarView === 'templates' && (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'home' | 'creators' | 'collab')} className="w-full">
              <TabsList className="bg-gray-100 p-1 rounded-lg">
                <TabsTrigger value="home" className="rounded-md px-6">Home</TabsTrigger>
                <TabsTrigger value="creators" className="rounded-md px-6">Creators</TabsTrigger>
                <TabsTrigger value="collab" className="rounded-md px-6">Brand Collab</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>

        {/* Search Bar */}
        {sidebarView !== 'trash' && (
          <div className="bg-white border-b border-gray-200 px-8 py-3">
            <div className="relative max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search notes, folders, and tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-50 border-gray-200 rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {sidebarView === 'trash' ? (
            <div>
              <div className="mb-6">
                <p className="text-sm text-gray-600">
                  Folders in trash will be permanently deleted after 30 days
                </p>
              </div>

              {trashedFolders.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {trashedFolders.map(folder => (
                    <div
                      key={`trash-${folder.id}`}
                      className="relative group p-4 rounded-2xl transition-all bg-white hover:shadow-md"
                    >
                      <Folder className="h-8 w-8 mb-2 opacity-50" style={{ color: folder.color }} />
                      <p className="font-medium text-sm text-gray-900 line-clamp-1 mb-1">{folder.name}</p>
                      <p className="text-xs text-gray-500">
                        Deleted {new Date(folder.deleted_at || '').toLocaleDateString()}
                      </p>
                      
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => restoreFromTrash(folder, e)}
                          className="w-8 h-8 rounded-md bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-sm text-white"
                          title="Restore"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-300">
                  <Trash2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Trash is empty</p>
                  <p className="text-gray-400 text-sm mt-2">Deleted folders will appear here</p>
                </div>
              )}
            </div>
          ) : sidebarView === 'templates' ? (
            <div>
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Productivity Essentials</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {templates.slice(0, 5).map(template => (
                    <Card 
                      key={`template-prod-${template.id}`}
                      className="cursor-pointer hover:shadow-xl transition-all border-2 border-transparent hover:border-[#4a90e2] rounded-2xl overflow-hidden group"
                      onClick={() => createNoteFromTemplate(template)}
                    >
                      <div className="aspect-[3/4] bg-gradient-to-br from-blue-50 to-indigo-50 p-4 flex items-center justify-center">
                        <Layout className="h-16 w-16 text-[#4a90e2] opacity-50 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-semibold text-sm text-gray-900 line-clamp-1">{template.name}</h3>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{template.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Back-to-School Collection</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {templates.slice(5, 10).map(template => (
                    <Card 
                      key={`template-school-${template.id}`}
                      className="cursor-pointer hover:shadow-xl transition-all border-2 border-transparent hover:border-[#4a90e2] rounded-2xl overflow-hidden group"
                      onClick={() => createNoteFromTemplate(template)}
                    >
                      <div className="aspect-[3/4] bg-gradient-to-br from-purple-50 to-pink-50 p-4 flex items-center justify-center">
                        <Sparkles className="h-16 w-16 text-purple-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-semibold text-sm text-gray-900 line-clamp-1">{template.name}</h3>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{template.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Folders Section */}
              {sidebarView === 'documents' && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Folders</h2>
                    <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-[#4a90e2]">
                          <Plus className="h-4 w-4 mr-1" />
                          New Folder
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-2xl">
                        <DialogHeader>
                          <DialogTitle>Create New Folder</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Folder Name</Label>
                            <Input
                              value={newFolderName}
                              onChange={(e) => setNewFolderName(e.target.value)}
                              placeholder="My Folder"
                              className="rounded-lg"
                            />
                          </div>
                          <div>
                            <Label>Color</Label>
                            <Input
                              type="color"
                              value={newFolderColor}
                              onChange={(e) => setNewFolderColor(e.target.value)}
                              className="h-12 rounded-lg"
                            />
                          </div>
                          <Button onClick={createFolder} className="w-full bg-[#4a90e2] hover:bg-[#357abd] rounded-lg">
                            Create Folder
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  {folders.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                      {folders.map(folder => (
                        <div
                          key={`folder-${folder.id}`}
                          className={`relative group p-4 rounded-2xl transition-all text-left ${
                            dragOverFolder === folder.id
                              ? 'bg-[#4a90e2] shadow-2xl scale-105 ring-4 ring-[#4a90e2]/50'
                              : selectedFolder === folder.id
                              ? 'bg-white shadow-lg ring-2 ring-[#4a90e2]'
                              : 'bg-white hover:shadow-md'
                          }`}
                          onDragOver={(e) => handleDragOver(folder.id, e)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(folder.id, e)}
                        >
                          <button
                            onClick={() => router.push(`/folder/${folder.id}`)}
                            className="w-full text-left"
                          >
                            <Folder 
                              className={`h-8 w-8 mb-2 transition-colors ${
                                dragOverFolder === folder.id ? 'text-white' : ''
                              }`} 
                              style={{ color: dragOverFolder === folder.id ? 'white' : folder.color }} 
                            />
                            <p className={`font-medium text-sm line-clamp-1 ${
                              dragOverFolder === folder.id ? 'text-white' : 'text-gray-900'
                            }`}>
                              {folder.name}
                            </p>
                          </button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className="absolute top-2 right-2 w-6 h-6 rounded-md bg-white/80 hover:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                              >
                                <MoreVertical className="h-4 w-4 text-gray-600" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={(e) => openEditFolderDialog(folder, e)}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => openEditFolderDialog(folder, e)}>
                                <Settings className="h-4 w-4 mr-2" />
                                Change Color
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => moveToTrash(folder, e)}
                                className="text-orange-600 focus:text-orange-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Move to Trash
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-white rounded-2xl border-2 border-dashed border-gray-300">
                      <Folder className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No folders yet</p>
                      <p className="text-gray-400 text-xs mt-1">Create folders to organize your notes</p>
                    </div>
                  )}
                </div>
              )}

              {/* Toolbar de Edição - Dentro da seção de notas */}
              {(sidebarView === 'documents' || sidebarView === 'favorites' || sidebarView === 'shared') && (
                <div className="mb-4">
                  <div className="border border-gray-200 rounded-lg px-4 py-2 flex items-center gap-1 flex-wrap bg-white shadow-sm">
                    {/* Undo/Redo */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      title="Undo"
                      onClick={() => handleToolbarAction('undo')}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      title="Redo"
                      onClick={() => handleToolbarAction('redo')}
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                    
                    <div className="w-px h-6 bg-gray-300 mx-1" />

                    {/* Font & Size */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 px-3 text-sm">
                          Arial <ChevronDown className="h-3 w-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleToolbarAction('font-arial')}>Arial</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToolbarAction('font-times')}>Times New Roman</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToolbarAction('font-courier')}>Courier New</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToolbarAction('font-georgia')}>Georgia</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToolbarAction('font-verdana')}>Verdana</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 px-3 text-sm">
                          12 <ChevronDown className="h-3 w-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleToolbarAction('size-8')}>8</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToolbarAction('size-10')}>10</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToolbarAction('size-12')}>12</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToolbarAction('size-14')}>14</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToolbarAction('size-16')}>16</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToolbarAction('size-18')}>18</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToolbarAction('size-24')}>24</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToolbarAction('size-36')}>36</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="w-px h-6 bg-gray-300 mx-1" />

                    {/* Text Formatting */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 font-bold" 
                      title="Bold"
                      onClick={() => handleToolbarAction('bold')}
                    >
                      B
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 italic" 
                      title="Italic"
                      onClick={() => handleToolbarAction('italic')}
                    >
                      I
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 underline" 
                      title="Underline"
                      onClick={() => handleToolbarAction('underline')}
                    >
                      U
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      title="Strikethrough"
                      onClick={() => handleToolbarAction('strikethrough')}
                    >
                      <span className="line-through">S</span>
                    </Button>

                    <div className="w-px h-6 bg-gray-300 mx-1" />

                    {/* Text Color & Highlight */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Text Color">
                          <div className="flex flex-col items-center">
                            <span className="text-sm font-semibold">A</span>
                            <div className="w-4 h-1 bg-black mt-0.5" />
                          </div>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <div className="grid grid-cols-5 gap-1 p-2">
                          {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000'].map(color => (
                            <button
                              key={color}
                              className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                              style={{ backgroundColor: color }}
                              onClick={() => handleToolbarAction(`color-${color}`)}
                            />
                          ))}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Highlight">
                          <div className="flex flex-col items-center">
                            <Minus className="h-3 w-3 rotate-90" />
                            <div className="w-4 h-1 bg-yellow-300 -mt-0.5" />
                          </div>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <div className="grid grid-cols-5 gap-1 p-2">
                          {['#FFFF00', '#00FF00', '#00FFFF', '#FF00FF', '#FFA500', '#FFB6C1', '#90EE90', '#ADD8E6', '#DDA0DD', '#F0E68C'].map(color => (
                            <button
                              key={color}
                              className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                              style={{ backgroundColor: color }}
                              onClick={() => handleToolbarAction(`highlight-${color}`)}
                            />
                          ))}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="w-px h-6 bg-gray-300 mx-1" />

                    {/* Alignment */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      title="Align Left"
                      onClick={() => handleToolbarAction('align-left')}
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="w-4 h-0.5 bg-current" />
                        <div className="w-3 h-0.5 bg-current" />
                        <div className="w-4 h-0.5 bg-current" />
                      </div>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      title="Align Center"
                      onClick={() => handleToolbarAction('align-center')}
                    >
                      <div className="flex flex-col gap-0.5 items-center">
                        <div className="w-4 h-0.5 bg-current" />
                        <div className="w-3 h-0.5 bg-current" />
                        <div className="w-4 h-0.5 bg-current" />
                      </div>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      title="Align Right"
                      onClick={() => handleToolbarAction('align-right')}
                    >
                      <div className="flex flex-col gap-0.5 items-end">
                        <div className="w-4 h-0.5 bg-current" />
                        <div className="w-3 h-0.5 bg-current" />
                        <div className="w-4 h-0.5 bg-current" />
                      </div>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      title="Justify"
                      onClick={() => handleToolbarAction('align-justify')}
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="w-4 h-0.5 bg-current" />
                        <div className="w-4 h-0.5 bg-current" />
                        <div className="w-4 h-0.5 bg-current" />
                      </div>
                    </Button>

                    <div className="w-px h-6 bg-gray-300 mx-1" />

                    {/* Lists */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      title="Bullet List"
                      onClick={() => handleToolbarAction('list-bullet')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      title="Numbered List"
                      onClick={() => handleToolbarAction('list-numbered')}
                    >
                      <div className="flex flex-col text-xs leading-none">
                        <span>1.</span>
                        <span>2.</span>
                      </div>
                    </Button>

                    <div className="w-px h-6 bg-gray-300 mx-1" />

                    {/* Insert */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-3 text-sm" 
                      title="Insert Link"
                      onClick={() => handleToolbarAction('insert-link')}
                    >
                      🔗 Link
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      title="Insert Image"
                      onClick={() => handleToolbarAction('insert-image')}
                    >
                      <Image className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-3 text-sm" 
                      title="Insert Table"
                      onClick={() => handleToolbarAction('insert-table')}
                    >
                      ⊞ Table
                    </Button>

                    <div className="w-px h-6 bg-gray-300 mx-1" />

                    {/* More Options */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleToolbarAction('superscript')}>Superscript</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToolbarAction('subscript')}>Subscript</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleToolbarAction('clear-format')}>Clear Formatting</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleToolbarAction('insert-equation')}>Insert Equation</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToolbarAction('insert-special')}>Insert Special Character</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )}

              {/* Notes Grid */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {selectedFolder ? 'Folder Notes' : sidebarView === 'favorites' ? 'Favorite Notes' : sidebarView === 'shared' ? 'Shared Notes' : 'All Notes'}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredNotes.map(note => (
                    <Card 
                      key={`note-${note.id}`}
                      className={`cursor-pointer hover:shadow-xl transition-all border-2 border-transparent hover:border-[#4a90e2] rounded-2xl overflow-hidden group relative ${
                        draggedNote?.id === note.id ? 'opacity-50' : ''
                      }`}
                      draggable
                      onDragStart={(e) => handleDragStart(note, e)}
                      onDragEnd={handleDragEnd}
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

                {filteredNotes.length === 0 && (
                  <div className="text-center py-16">
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No notes found</p>
                    <p className="text-gray-400 text-sm mt-2">
                      {searchTerm ? 'Try a different search term' : sidebarView === 'favorites' ? 'Star notes to add them to favorites' : sidebarView === 'shared' ? 'No shared notes yet' : 'Create your first note to get started'}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Edit Folder Dialog */}
      <Dialog open={isEditFolderDialogOpen} onOpenChange={setIsEditFolderDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Folder Name</Label>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="My Folder"
                className="rounded-lg"
              />
            </div>
            <div>
              <Label>Color</Label>
              <Input
                type="color"
                value={newFolderColor}
                onChange={(e) => setNewFolderColor(e.target.value)}
                className="h-12 rounded-lg"
              />
            </div>
            <Button onClick={updateFolder} className="w-full bg-[#4a90e2] hover:bg-[#357abd] rounded-lg">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
