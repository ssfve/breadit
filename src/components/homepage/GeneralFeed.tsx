import { db } from '@/lib/db'
import PostFeed from '../PostFeed'
import { INFINITE_SCROLL_PAGINATION_RESULTS } from '@/config'

const GeneralFeed = async () => {
  const posts = await db.post.findMany({
    // orderBy: {
      // createdAt: 'desc',
    // },
    include: {
      votes: true,
      author: true,
      comments: true,
      subreddit: true,
    },
    take: parseInt(INFINITE_SCROLL_PAGINATION_RESULTS.toString()), 
    // 4 to demonstrate infinite scroll, should be higher in production
  })
  console.log(posts)
  return <PostFeed initialPosts={posts} />
}

export default GeneralFeed
