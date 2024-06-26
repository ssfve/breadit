import type { Vote } from "@prisma/client";
import PostVoteClient from "./PostVoteClient";
import { redis } from "@/lib/redis";
import { Session } from "next-auth";
import { CachedPost } from "@/types/redis";
import { notFound } from "next/navigation";

interface PostVoteServerProps {
  postId: string;
  initialVotesAmt?: number;
  initialVote?: Vote["type"] | null;
  post: (CachedPost & { votes: Vote[] }) | null;
  getData?: () => Promise<(CachedPost & { votes: Vote[] }) | null>;
}

/**
 * We split the PostVotes into a client and a server component to allow for dynamic data
 * fetching inside of this component, allowing for faster page loads via suspense streaming.
 *
 * We also have to option to fetch this info on a page-level and pass it in.
 *
 */
// only used in this one place
const PostVoteServer = async ({
  postId,
  initialVotesAmt,
  initialVote,
  getData,
}: PostVoteServerProps) => {
  console.log("PostVoteServer is called");
  let _votesAmt: number = 0;
  let _currentVote: Vote["type"] | null | undefined = undefined;

  if (getData) {
    // fetch data in component possible after db query
    console.log("wait to getData Vote");
    const post = await getData();
    if (!post) notFound();
    console.log("Vote post is ", post);
    _votesAmt = post.votes.reduce((acc, vote) => {
      if (vote.type === "UP") return acc + 1;
      if (vote.type === "DOWN") return acc - 1;
      return acc;
    }, 0);

    console.log("wait to get Vote session")
    let session = (await redis.get(`session`)) as Session;
    console.log("Vote session is ", session);
    // const session = await getAuthSession()
    // seesion user id is your post
    _currentVote = post.votes.find(
      (vote) => vote.userId === session?.user.id
    )?.type;
  } else {
    // passed as props
    _votesAmt = initialVotesAmt!;
    _currentVote = initialVote;
  }

  return (
    <PostVoteClient
      postId={postId}
      initialVotesAmt={_votesAmt}
      initialVote={_currentVote}
    />
  );
};

export default PostVoteServer;
