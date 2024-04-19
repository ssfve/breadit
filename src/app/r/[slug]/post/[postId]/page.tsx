import CommentsSection from "@/components/CommentsSection";
import EditorOutput from "@/components/EditorOutput";
import PostVoteServer from "@/components/post-vote/PostVoteServer";
import { buttonVariants } from "@/components/ui/Button";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { formatTimeToNow } from "@/lib/utils";
import { CachedPost } from "@/types/redis";
import { Post, User, Vote } from "@prisma/client";
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
let cachedPost: CachedPost | null = null;
let cachedData: (Post & { votes: Vote[] }) | null = null;
let post: (Post & { votes: Vote[]; author: User }) | null = null;

const SubRedditPostPage = async ({ params }: SubRedditPostPageProps) => {
  console.log("SubRedditPostPage is called");
  if (!cachedPost) {
    db.post
      .findFirst({
        where: {
          id: params.postId,
        },
        include: {
          votes: true,
          author: true,
        },
      })
      .then((post) => {
        cachedPost = {
          authorUsername: post?.author.username ?? "",
          content: JSON.stringify(post?.content),
          id: post?.id ?? "",
          title: post?.title ?? "error loading post title",
          currentVote: null,
          createdAt: post?.createdAt ?? new Date(),
        };

        const cachePayload: CachedPost = {
          authorUsername: post?.author.username ?? "",
          content: JSON.stringify(post?.content),
          id: post?.id ?? "",
          title: post?.title ?? "error loading post title",
          currentVote: null,
          createdAt: post?.createdAt ?? new Date(),
        };

        redis.set(`post-${post?.id}`, cachePayload);
        console.log("return from post.findFirst");
      });
  }

  if (!cachedData) {
    db.post
      .findUnique({
        where: {
          id: params.postId,
        },
        include: {
          votes: true,
        },
      })
      .then((o) => {
        cachedData = o;
        if (cachedData) {
          redis.set(`data-${post?.id}`, cachedData);
        }
        console.log("return from post.findUnique");
      });
  }

  // Store the post data as a hash
  console.log("return from redis.hset");
  if (!cachedPost) {
    // will not block when fetching from redis
    cachedPost = await redis.get(`post-${params.postId}`);
    console.log("cachedPost is ", cachedPost);
  }
  if (!cachedData) {
    // possibly fail on first call
    cachedData = await redis.get(`data-${params.postId}`);
    console.log("cachedData is ", cachedData);
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
            getData={cachedData ? () => Promise.resolve(cachedData) : undefined}
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
