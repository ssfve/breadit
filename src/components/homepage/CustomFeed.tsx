import { INFINITE_SCROLL_PAGINATION_RESULTS } from '@/config'
import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import PostFeed from '../PostFeed'
import { notFound } from 'next/navigation'
import { Session } from 'next-auth'; // Replace 'your-session-module' with the actual module name

type CustomFeedProps = {
  session: Session | null,
};

export default async function CustomFeed({ session }: CustomFeedProps) {
  // already checked outside
  // const session = await getAuthSession()

  // only rendered if session exists, so this will not happen
  // if (!session) return notFound()

  console.log("CustomFeed is called");
  const followedCommunities = await db.subscription.findMany({
    where: {
      userId: session?.user.id,
    },
    include: {
      subreddit: true,
    },
  })

  console.log("findMany is called")
  const posts = await db.post.findMany({
    where: {
      subreddit: {
        name: {
          in: followedCommunities.map((sub) => sub.subreddit.name),
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
  })
  console.log("posts in CustomFeed is ", posts);
  return <PostFeed initialPosts={posts} />
}

// export default CustomFeed({ session })
