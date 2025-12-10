'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import BlogEditor from '@/components/blog-editor'
import { Save, ArrowLeft } from 'lucide-react'

export default function BlogEditPage() {
  const router = useRouter()
  const params = useParams()
  const isNew = params.id === 'new'

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    cover_image: '',
    status: 'draft',
    tags: [] as string[],
    seo_title: '',
    seo_description: '',
    seo_og_image: '',
    seo_keywords: '',
  })

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

    if (!isNew) {
      loadPost()
    }
  }

  const loadPost = async () => {
    try {
      const response = await fetch(`/api/blog/posts/${params.id}`)
      const data = await response.json()
      
      setFormData({
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt || '',
        content: data.content,
        cover_image: data.cover_image || '',
        status: data.status,
        tags: data.tags || [],
        seo_title: data.seo_title || '',
        seo_description: data.seo_description || '',
        seo_og_image: data.seo_og_image || '',
        seo_keywords: data.seo_keywords || '',
      })
    } catch (error) {
      console.error('Error loading post:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .trim()
  }

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: formData.slug || generateSlug(title),
    })
  }

  const handleSave = async (status: 'draft' | 'published') => {
    setSaving(true)

    try {
      const payload = {
        ...formData,
        status,
      }

      const url = isNew ? '/api/blog/posts' : `/api/blog/posts/${params.id}`
      const method = isNew ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        router.push('/admin/blog')
      } else {
        const error = await response.json()
        alert('Erro ao salvar: ' + error.error)
      }
    } catch (error) {
      console.error('Error saving post:', error)
      alert('Erro ao salvar post')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push('/admin/blog')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isNew ? 'Novo Post' : 'Editar Post'}</CardTitle>
          <CardDescription>
            Preencha as informações do post do blog
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Digite o título do post"
              required
            />
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug">
              Slug * <span className="text-xs text-muted-foreground">(URL amigável)</span>
            </Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="meu-post-incrivel"
              required
            />
            <p className="text-xs text-muted-foreground">
              URL: /blog/{formData.slug || 'slug-do-post'}
            </p>
          </div>

          {/* Excerpt */}
          <div className="space-y-2">
            <Label htmlFor="excerpt">Resumo</Label>
            <Textarea
              id="excerpt"
              value={formData.excerpt}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, excerpt: e.target.value })}
              placeholder="Breve descrição do post (aparece na listagem)"
              rows={3}
            />
          </div>

          {/* Cover Image */}
          <div className="space-y-2">
            <Label htmlFor="cover_image">URL da Imagem de Capa</Label>
            <Input
              id="cover_image"
              type="url"
              value={formData.cover_image}
              onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
              placeholder="https://exemplo.com/imagem.jpg"
            />
            {formData.cover_image && (
              <img
                src={formData.cover_image}
                alt="Preview"
                className="w-full max-w-md rounded-lg border mt-2"
              />
            )}
          </div>

          {/* Content Editor */}
          <div className="space-y-2">
            <Label>Conteúdo *</Label>
            <BlogEditor
              content={formData.content}
              onChange={(content) => setFormData({ ...formData, content })}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">
              Tags <span className="text-xs text-muted-foreground">(separadas por vírgula)</span>
            </Label>
            <Input
              id="tags"
              value={formData.tags.join(', ')}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tags: e.target.value
                    .split(/[,.]/)
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              }
              placeholder="react, typescript, tutorial"
            />
          </div>

          {/* SEO */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-medium text-muted-foreground">SEO</h3>

            <div className="space-y-2">
              <Label htmlFor="seo_title">SEO Title</Label>
              <Input
                id="seo_title"
                value={formData.seo_title}
                onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                placeholder="Título otimizado para SEO (opcional)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seo_description">SEO Description</Label>
              <Textarea
                id="seo_description"
                value={formData.seo_description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData({ ...formData, seo_description: e.target.value })
                }
                placeholder="Descrição que aparecerá nos resultados de busca (opcional)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seo_og_image">SEO OG Image URL</Label>
              <Input
                id="seo_og_image"
                type="url"
                value={formData.seo_og_image}
                onChange={(e) => setFormData({ ...formData, seo_og_image: e.target.value })}
                placeholder="https://exemplo.com/imagem-og.jpg (opcional, fallback para capa)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seo_keywords">SEO Keywords</Label>
              <Input
                id="seo_keywords"
                value={formData.seo_keywords}
                onChange={(e) => setFormData({ ...formData, seo_keywords: e.target.value })}
                placeholder="monitoramento, ecommerce, uptime (separadas por vírgula)"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={() => handleSave('draft')}
              variant="outline"
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Rascunho
            </Button>
            <Button
              onClick={() => handleSave('published')}
              disabled={saving || !formData.title || !formData.slug || !formData.content}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {isNew ? 'Publicar' : 'Atualizar e Publicar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
