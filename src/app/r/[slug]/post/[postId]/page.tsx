import CommentsSection from "@/components/CommentsSection";
import EditorOutput from "@/components/EditorOutput";
import PostVoteServer from "@/components/post-vote/PostVoteServer";
import { buttonVariants } from "@/components/ui/Button";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { formatTimeToNow } from "@/lib/utils";
import { CachedPost } from "@/types/redis";
import { Post, User, Vote, VoteType } from "@prisma/client";
import { GetResult } from "@prisma/client/runtime";
import { ArrowBigDown, ArrowBigUp, Loader2 } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface SubRedditPostPageProps {
  params: {
    postId: string;
  };
}

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
let post: (CachedPost & { votes: Vote[]; author: User; }) | null = null;
let cachedPost: (CachedPost & { votes: Vote[]; }) | null = null;
let cachedData: (Post & { votes: Vote[]; }) | null = null;

const SubRedditPostPage = async ({ params }: SubRedditPostPageProps) => {
  console.log("SubRedditPostPage is called");
  // post is null do not use
  if (!cachedPost) {
    db.post
      .findUnique({
        where: {
          id: params.postId,
        },
        include: {
          votes: true,
          author: true,
        },
      })
      .then((o) => {
        cachedData = o;
        cachedPost = {
          authorUsername: o?.author.username ?? "",
          content: JSON.stringify(o?.content),
          id: o?.id ?? "",
          title: o?.title ?? "error loading post title",
          currentVote: null,
          createdAt: o?.createdAt ?? new Date(),
          votes: o?.votes ?? [], // Add nullish coalescing operator to assign an empty array when votes is undefined
        };

        redis.set(`post-${o?.id}`, cachedPost);
        console.log("return from post.findFirst");
      });
  }

  // faster to get cachedPost
  if (!cachedPost) {
    console.log("wait on get CachedPost");
    cachedPost = await redis.get(`post-${params.postId}`);
    console.log("cachedPost is ", cachedPost);
  }
  
  // console.log(cachedPost)
  if (!post && !cachedPost) return notFound();
  console.log("start redenring SubRedditPostPage");
  return (
    <div>
      <div className="h-full flex flex-col sm:flex-row items-center sm:items-start justify-between">
        <Suspense fallback={<PostVoteShell />}>
          {/* @ts-expect-error server component */}
          <PostVoteServer
            postId={post?.id ?? cachedPost?.id ?? ""}
            // pass in a promise
            getData={() => Promise.resolve(cachedData)}
            post={cachedPost}
          />
        </Suspense>

        <div className="sm:w-0 w-full flex-1 bg-white p-4 rounded-sm">
          <p className="max-h-40 mt-1 truncate text-xs text-gray-500">
            Posted by u/{post?.author.username ?? cachedPost?.authorUsername}{" "}
            {formatTimeToNow(
              new Date(post?.createdAt ?? cachedPost?.createdAt ?? "")
            )}
          </p>
          <h1 className="text-xl font-semibold py-2 leading-6 text-gray-900">
            {post?.title ?? cachedPost?.title}
          </h1>

          <EditorOutput content={post?.content ?? cachedPost?.content} />
          <Suspense
            fallback={
              <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
            }
          >
            {/* @ts-expect-error Server Component */}
            <CommentsSection postId={post?.id ?? cachedPost.id} />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

function PostVoteShell() {
  return (
    <div className="flex items-center flex-col pr-6 w-20">
      {/* upvote */}
      <div className={buttonVariants({ variant: "ghost" })}>
        <ArrowBigUp className="h-5 w-5 text-zinc-700" />
      </div>

      {/* score */}
      <div className="text-center py-2 font-medium text-sm text-zinc-900">
        <Loader2 className="h-3 w-3 animate-spin" />
      </div>

      {/* downvote */}
      <div className={buttonVariants({ variant: "ghost" })}>
        <ArrowBigDown className="h-5 w-5 text-zinc-700" />
      </div>
    </div>
  );
}

export default SubRedditPostPage;
