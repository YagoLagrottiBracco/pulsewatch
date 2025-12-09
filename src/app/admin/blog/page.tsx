'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Eye } from 'lucide-react'

export default function AdminBlogPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/auth/login')
      return
    }

    // Check if user is admin
    const { data: adminData } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!adminData) {
      router.push('/dashboard')
      return
    }

    setIsAdmin(true)
    loadPosts()
  }

  const loadPosts = async () => {
    try {
      const response = await fetch('/api/blog/posts?status=all')
      const data = await response.json()
      
      // Garantir que posts seja sempre um array
      if (Array.isArray(data)) {
        setPosts(data)
      } else {
        console.error('API response is not an array:', data)
        setPosts([])
      }
    } catch (error) {
      console.error('Error loading posts:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este post?')) return

    try {
      await fetch(`/api/blog/posts/${id}`, { method: 'DELETE' })
      loadPosts()
    } catch (error) {
      console.error('Error deleting post:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-600">Publicado</Badge>
      case 'draft':
        return <Badge variant="outline">Rascunho</Badge>
      case 'archived':
        return <Badge variant="secondary">Arquivado</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando...</p>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Blog</h1>
          <p className="text-muted-foreground">Crie e gerencie posts do blog</p>
        </div>
        <Button onClick={() => router.push('/admin/blog/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Post
        </Button>
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">Nenhum post criado ainda</p>
            <Button onClick={() => router.push('/admin/blog/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Post
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-xl">{post.title}</CardTitle>
                      {getStatusBadge(post.status)}
                    </div>
                    <CardDescription>{post.excerpt || 'Sem descrição'}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/admin/blog/${post.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {post.views || 0} visualizações
                  </div>
                  <span>•</span>
                  <span>
                    Criado em {new Date(post.created_at).toLocaleDateString('pt-BR')}
                  </span>
                  {post.published_at && (
                    <>
                      <span>•</span>
                      <span>
                        Publicado em {new Date(post.published_at).toLocaleDateString('pt-BR')}
                      </span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
