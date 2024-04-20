import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { Comment, CommentVote, User } from '@prisma/client'
import CreateComment from './CreateComment'
import PostComment from './comments/PostComment'
import { redis } from '@/lib/redis'
import { notFound } from 'next/navigation'
import { Session } from 'next-auth'

type ExtendedComment = Comment & {
  votes: CommentVote[]
  author: User
  replies: ReplyComment[]
}

type ReplyComment = Comment & {
  votes: CommentVote[]
  author: User
}

interface CommentsSectionProps {
  postId: string
  comments: ExtendedComment[]
}
let cachedComments : ExtendedComment[] | null = null;

const CommentsSection = async ({ postId }: CommentsSectionProps) => {
  // const session = await getAuthSession()
  console.log("CommentsSection is called");
  let session = (await redis.get(`session`)) as Session;
  console.log("Vote session is ", session);

  cachedComments = await redis.get(`comments-${postId}`);
  if(!cachedComments){
    db.comment.findMany({
      where: {
        postId: postId,
        replyToId: null, // only fetch top-level comments
      },
      include: {
        author: true,
        votes: true,
        replies: {
          // first level replies
          include: {
            author: true,
            votes: true,
          },
        },
      },
    }).then((o)=>{
        redis.set(`comments-${postId}`, o);
    })
  }

  while(!cachedComments){
    cachedComments = await redis.get(`comments-${postId}`);
  }
  console.log("comments is ", cachedComments);
  if(!cachedComments) notFound();

  return (
    <div className='flex flex-col gap-y-4 mt-4'>
      <hr className='w-full h-px my-6' />

      <CreateComment postId={postId} />

      <div className='flex flex-col gap-y-6 mt-4'>
        {cachedComments
          .filter((comment) => !comment.replyToId)
            .map((topLevelComment) => {
            const topLevelCommentVotesAmt = topLevelComment.votes.reduce(
              (acc, vote) => {
                if (vote.type === 'UP') return acc + 1
                if (vote.type === 'DOWN') return acc - 1
                return acc
              },
              0
            )

            const topLevelCommentVote = topLevelComment.votes.find(
              (vote) => vote.userId === session?.user.id
            )

            return (
              <div key={topLevelComment.id} className='flex flex-col'>
                <div className='mb-2'>
                  <PostComment
                    comment={topLevelComment}
                    currentVote={topLevelCommentVote}
                    votesAmt={topLevelCommentVotesAmt}
                    postId={postId}
                  />
                </div>

                {/* Render replies */}
                {topLevelComment.replies
                  .sort((a, b) => b.votes.length - a.votes.length) // Sort replies by most liked
                  .map((reply) => {
                    const replyVotesAmt = reply.votes.reduce((acc, vote) => {
                      if (vote.type === 'UP') return acc + 1
                      if (vote.type === 'DOWN') return acc - 1
                      return acc
                    }, 0)

                    const replyVote = reply.votes.find(
                      (vote) => vote.userId === session?.user.id
                    )

                    return (
                      <div
                        key={reply.id}
                        className='ml-2 py-2 pl-4 border-l-2 border-zinc-200'>
                        <PostComment
                          comment={reply}
                          currentVote={replyVote}
                          votesAmt={replyVotesAmt}
                          postId={postId}
                        />
                      </div>
                    )
                  })}
              </div>
            )
          })}
      </div>
    </div>
  )
}

export default CommentsSection
