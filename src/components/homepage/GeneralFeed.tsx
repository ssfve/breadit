import { db } from '@/lib/db'
import PostFeed from '../PostFeed'
import { INFINITE_SCROLL_PAGINATION_RESULTS } from '@/config'
import { Session } from 'next-auth';
import { ExtendedPost } from '@/types/db';
import { redis } from '@/lib/redis';
let session: Session | null = null;

const GeneralFeed = async () => {
  console.log("GeneralFeed is called");
  session = await redis.get(`session`)
  console.log("GeneralFeed session is", session);
  
  db.post.findMany({
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
    // 4 to demonstrate infinite scroll, should be higher in production
  }).then((o) => {
    redis.set(`customFeed-${session?.user.id}`, o);
  })

  const posts = (await redis.get(`customFeed-subscription-${session?.user.id}`)) as ExtendedPost[];
  console.log("posts is ", posts);
  return <PostFeed initialPosts={posts}/>
}

export default GeneralFeed
