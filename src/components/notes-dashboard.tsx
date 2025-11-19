'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Folder, Plus, Search, Tag, FileText, LogOut, Trash2, Edit, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Note {
  id: string
  title: string
  content: string
  folder_id?: string
  tags: string[]
  created_at: string
  updated_at: string
  user_id: string
}

interface Folder {
  id: string
  name: string
  color: string
  user_id: string
}

export function NotesDashboard() {
  const [notes, setNotes] = useState<Note[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderColor, setNewFolderColor] = useState('#6366f1')
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editTags, setEditTags] = useState('')
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    checkUser()
    fetchNotes()
    fetchFolders()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching notes:', error)
    } else {
      setNotes(data || [])
    }
  }

  const fetchFolders = async () => {
    const { data, error } = await supabase
      .from('folders')
      .select('*')

    if (error) {
      console.error('Error fetching folders:', error)
    } else {
      setFolders(data || [])
    }
  }

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(note => !selectedFolder || note.folder_id === selectedFolder)

  const createNote = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('notes')
      .insert([{ 
        title: 'Nova Nota', 
        content: '', 
        tags: [],
        user_id: user.id,
        folder_id: selectedFolder
      }])
      .select()

    if (error) {
      console.error('Error creating note:', error)
    } else if (data) {
      setNotes([data[0], ...notes])
      openEditDialog(data[0])
    }
  }

  const createFolder = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !newFolderName.trim()) return

    const { data, error } = await supabase
      .from('folders')
      .insert([{ 
        name: newFolderName, 
        color: newFolderColor,
        user_id: user.id
      }])
      .select()

    if (error) {
      console.error('Error creating folder:', error)
    } else if (data) {
      setFolders([...folders, data[0]])
      setNewFolderName('')
      setNewFolderColor('#6366f1')
      setIsNewFolderDialogOpen(false)
    }
  }

  const openEditDialog = (note: Note) => {
    setSelectedNote(note)
    setEditTitle(note.title)
    setEditContent(note.content)
    setEditTags(note.tags.join(', '))
    setIsEditDialogOpen(true)
  }

  const saveNote = async () => {
    if (!selectedNote) return

    const tags = editTags.split(',').map(tag => tag.trim()).filter(tag => tag)

    const { error } = await supabase
      .from('notes')
      .update({ 
        title: editTitle, 
        content: editContent, 
        tags,
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedNote.id)

    if (error) {
      console.error('Error updating note:', error)
    } else {
      fetchNotes()
      setIsEditDialogOpen(false)
    }
  }

  const deleteNote = async (noteId: string) => {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)

    if (error) {
      console.error('Error deleting note:', error)
    } else {
      setNotes(notes.filter(note => note.id !== noteId))
      setIsEditDialogOpen(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-xl p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="h-8 w-8 text-indigo-600" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            BlessedNotes
          </h1>
        </div>

        <Button 
          onClick={createNote} 
          className="w-full mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Nota
        </Button>

        <div className="space-y-2 flex-1 overflow-y-auto">
          <Button
            variant={selectedFolder === null ? "secondary" : "ghost"}
            onClick={() => setSelectedFolder(null)}
            className="w-full justify-start"
          >
            <FileText className="h-4 w-4 mr-2" />
            Todas as Notas ({notes.length})
          </Button>

          <div className="pt-4 pb-2">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase">Pastas</span>
              <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Plus className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova Pasta</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="folderName">Nome da Pasta</Label>
                      <Input
                        id="folderName"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Ex: Estudos, Trabalho..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="folderColor">Cor</Label>
                      <Input
                        id="folderColor"
                        type="color"
                        value={newFolderColor}
                        onChange={(e) => setNewFolderColor(e.target.value)}
                      />
                    </div>
                    <Button onClick={createFolder} className="w-full">
                      Criar Pasta
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {folders.map(folder => (
            <Button
              key={folder.id}
              variant={selectedFolder === folder.id ? "secondary" : "ghost"}
              onClick={() => setSelectedFolder(folder.id)}
              className="w-full justify-start"
            >
              <Folder className="h-4 w-4 mr-2" style={{ color: folder.color }} />
              {folder.name}
            </Button>
          ))}
        </div>

        <div className="pt-4 border-t">
          <div className="text-xs text-gray-500 mb-2 px-2">
            {user?.email}
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white shadow-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredNotes.map(note => (
            <Card 
              key={note.id} 
              className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-indigo-200"
              onClick={() => openEditDialog(note)}
            >
              <CardHeader>
                <CardTitle className="text-lg line-clamp-1">{note.title}</CardTitle>
                {note.tags.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {note.tags.map((tag, idx) => (
                      <span 
                        key={idx}
                        className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {note.content || 'Nota vazia'}
                </p>
                <p className="text-xs text-gray-400 mt-3">
                  {new Date(note.updated_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredNotes.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nenhuma nota encontrada</p>
            <p className="text-gray-400 text-sm mt-2">
              {searchTerm ? 'Tente buscar por outro termo' : 'Crie sua primeira nota para começar'}
            </p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Nota</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Título da nota"
              />
            </div>
            <div>
              <Label htmlFor="content">Conteúdo</Label>
              <Textarea
                id="content"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Escreva suas anotações aqui..."
                rows={10}
                className="resize-none"
              />
            </div>
            <div>
              <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
              <Input
                id="tags"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="Ex: estudo, importante, revisão"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={saveNote} className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600">
                Salvar
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => selectedNote && deleteNote(selectedNote.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
