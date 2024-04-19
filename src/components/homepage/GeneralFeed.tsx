import { db } from '@/lib/db'
import PostFeed from '../PostFeed'
import { INFINITE_SCROLL_PAGINATION_RESULTS } from '@/config'
import { Session } from 'next-auth';

const GeneralFeed = async () => {
  console.log("GeneralFeed is called");
  const posts = await db.post.findMany({
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
  })
  console.log("posts is ", posts);
  return <PostFeed initialPosts={posts}/>
}

export default GeneralFeed
