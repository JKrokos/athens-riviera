import { Breadcrumbs } from '../../../components/Breadcrumbs'
import { Pagination } from '../../../components/Pagination'
import { PostCard } from '../../../components/cards/PostCard'
import { getPosts } from '../../../lib/data'
import { site } from '../../../site.config'

export async function BlogIndex({ page }: { page: number }) {
  const { posts, totalPages } = await getPosts(page)

  return (
    <div className="container-site py-10 sm:py-14">
      <Breadcrumbs items={page > 1 ? [{ name: 'Blog', path: '/blog' }, { name: `Page ${page}` }] : [{ name: 'Blog' }]} />
      <h1 className="font-display text-4xl font-bold text-ink sm:text-5xl">
        Stories &amp; guides from {site.place.name}
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-ink-soft">
        News, tips and local insight to make the most of your time in {site.place.name}.
      </p>

      {posts.length === 0 ? (
        <p className="mt-12 rounded-card border border-line bg-surface p-8 text-center text-ink-soft">
          No articles yet — check back soon.
        </p>
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, index) => (
            <PostCard key={post.id} post={post} large={page === 1 && index === 0} />
          ))}
        </div>
      )}

      <Pagination base="/blog" current={page} total={totalPages} />
    </div>
  )
}
