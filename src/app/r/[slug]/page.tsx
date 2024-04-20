import MiniCreatePost from '@/components/MiniCreatePost'
import PostFeed from '@/components/PostFeed'
import { INFINITE_SCROLL_PAGINATION_RESULTS } from '@/config'
import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { redis } from '@/lib/redis'
import { ExtendedPost } from '@/types/db'
import { Post, Subreddit } from '@prisma/client'
import { Session } from 'next-auth'
import { notFound } from 'next/navigation'

interface PageProps {
  params: {
    slug: string
  }
}
let subreddit : Subreddit & { posts : ExtendedPost[];} | null = null;

const page = async ({ params }: PageProps) => {
  const { slug } = params

  // const session = await getAuthSession()
  console.log("CommentsSection is called");
  let session = (await redis.get(`session`)) as Session;
  console.log("Vote session is ", session);
  
  subreddit = await redis.get(`subreddit-${slug}`)
  db.subreddit.findFirst({
    where: { name: slug },
    include: {
      posts: {
        include: {
          author: true,
          votes: true,
          comments: true,
          subreddit: true,
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: INFINITE_SCROLL_PAGINATION_RESULTS,
      },
    },
  })

  while(!subreddit){
    subreddit = await redis.get(`subreddit-${slug}`)
  }

  if (!subreddit) return notFound()

  return (
    <>
      <h1 className='font-bold text-3xl md:text-4xl h-14'>
        r/{subreddit.name}
      </h1>
      <MiniCreatePost session={session} />
      <PostFeed initialPosts={subreddit.posts} subredditName={subreddit.name} />
    </>
  )
}

export default page
