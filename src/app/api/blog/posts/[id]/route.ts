import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Get single post
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params

    const { data, error} = await supabase
      .from('blog_posts')
      .select(`
        *,
        author:admin_users(id, email)
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    // Increment views
    await supabase
      .from('blog_posts')
      .update({ views: (data.views || 0) + 1 })
      .eq('id', id)

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update post (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params
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
    } = body

    const updateData: any = {
      title,
      slug,
      excerpt,
      content,
      cover_image,
      status,
      tags: tags || [],
      seo_title,
      seo_description,
      seo_og_image,
      seo_keywords,
    }

    // Set published_at if publishing for first time
    if (status === 'published') {
      const { data: existingPost } = await supabase
        .from('blog_posts')
        .select('published_at')
        .eq('id', id)
        .single()

      if (!existingPost?.published_at) {
        updateData.published_at = new Date().toISOString()
      }
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete post (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params

    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ message: 'Post deleted successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
