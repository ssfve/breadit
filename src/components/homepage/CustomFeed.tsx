import { INFINITE_SCROLL_PAGINATION_RESULTS } from '@/config'
import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import PostFeed from '../PostFeed'
import { notFound } from 'next/navigation'
import { Session } from 'next-auth'; // Replace 'your-session-module' with the actual module name
import { redis } from '@/lib/redis'
import { ExtendedPost } from '@/types/db'
import { Subreddit, Subscription } from '@prisma/client'

type CustomFeedProps = {
  session: Session | null,
};

export default async function CustomFeed({ session }: CustomFeedProps) {
  // already checked outside
  // const session = await getAuthSession()

  // only rendered if session exists, so this will not happen
  // if (!session) return notFound()

  console.log("CustomFeed is called");
  db.subscription.findMany({
    where: {
      userId: session?.user.id,
    },
    include: {
      subreddit: true,
    },
  }).then((o) => {
    redis.set(`customFeed-subscription-${session?.user.id}`, o);
  })

  const followedCommunities = (await redis.get(`customFeed-subscription-${session?.user.id}`));
  console.log("findMany is called", followedCommunities)

  db.post.findMany({
    where: {
      subreddit: {
        name: {
          in: (followedCommunities as { subreddit: { name: string } }[]).map((sub) => sub.subreddit.name),
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      votes: true,
      author: true,
      comments: true,
      subreddit: true,
    },
    take: parseInt(INFINITE_SCROLL_PAGINATION_RESULTS.toString()),
  }).then((o) => {
    redis.set(`customFeed-post-${session?.user.id}`, o);
  })
  
  const posts = (await redis.get(`customFeed-post-${session?.user.id}`)) as ExtendedPost[];
  console.log("posts in CustomFeed is ", posts);

  return <PostFeed initialPosts={posts} />
}

// export default CustomFeed({ session })
