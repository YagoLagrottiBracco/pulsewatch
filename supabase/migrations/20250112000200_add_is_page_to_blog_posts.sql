alter table public.blog_posts
  add column if not exists is_page boolean not null default false;

comment on column public.blog_posts.is_page is 'Define se o conteúdo deve ser servido como página (CTA) fora do /blog.';
