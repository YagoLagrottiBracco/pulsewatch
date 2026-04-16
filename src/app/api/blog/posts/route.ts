import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { captureError } from '@/lib/sentry'

// GET - List all posts (public: published only, admin: all)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'published'

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    let isAdmin = false

    if (user) {
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', user.id)
        .single()

      isAdmin = !!adminData
    }

    let query = supabase
      .from('blog_posts')
      .select(`
        *,
        author:admin_users(id, email)
      `)
      .order('created_at', { ascending: false })

    // If not admin, only show published posts with proper scheduling
    if (!isAdmin) {
      const now = new Date().toISOString()
      query = query
        .eq('status', 'published')
        .or(`publish_at.is.null,publish_at.lte.${now}`)
        .or(`unpublish_at.is.null,unpublish_at.gt.${now}`)
    } else if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error

    // Garantir que sempre retorne um array
    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('Error fetching posts:', error)
    // Em caso de erro, retornar array vazio ao invés de objeto de erro
    // Isso evita quebrar o frontend
    return NextResponse.json([], { status: 500 })
  }
}

// POST - Create new post (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: adminData } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!adminData) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      slug,
      excerpt,
      content,
      cover_image,
      status,
      tags,
      seo_title,
      seo_description,
      seo_og_image,
      seo_keywords,
      is_page = false,
      publish_at,
      unpublish_at,
    } = body

    // Create post
    const insertData: any = {
      title,
      slug,
      excerpt,
      content,
      cover_image,
      author_id: adminData.id,
      status: status || 'draft',
      tags: tags || [],
      seo_title,
      seo_description,
      seo_og_image,
      seo_keywords,
      is_page,
      publish_at: publish_at || null,
      unpublish_at: unpublish_at || null,
    }

    // Set published_at based on publish_at or current time
    if (status === 'published') {
      insertData.published_at = publish_at || new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
