import CustomFeed from "@/components/homepage/CustomFeed";
import GeneralFeed from "@/components/homepage/GeneralFeed";
import { buttonVariants } from "@/components/ui/Button";
import { getAuthSession } from "@/lib/auth";
import { Session } from "next-auth";
import { Home as HomeIcon } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
let session: Session | null = null;
let sessionCache: Session | null = null;
let sessionPromise: Promise<Session | null> | null = null;

async function getCachedSession() {
  if (sessionCache) {
    return sessionCache;
  }

  if (!sessionPromise) {
    sessionPromise = getAuthSession();
  }

  sessionCache = await sessionPromise;
  return sessionCache;
}

export default async function Home() {

  console.log("Home is called");
  if (!session) {
    session = await getCachedSession();
  }
  console.log("session is", session);
  return (
    <>
      <h1 className="font-bold text-3xl md:text-4xl">Your feed</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 md:gap-x-4 py-6">
        {/* @ts-expect-error server component */}
        {session ? <CustomFeed session={session}/> : <GeneralFeed />}

        {/* subreddit info */}
        <div className="overflow-hidden h-fit rounded-lg border border-gray-200 order-first md:order-last">
          <div className="bg-emerald-100 px-6 py-4">
            <p className="font-semibold py-3 flex items-center gap-1.5">
              <HomeIcon className="h-4 w-4" />
              Home
            </p>
          </div>
          <dl className="-my-3 divide-y divide-gray-100 px-6 py-4 text-sm leading-6">
            <div className="flex flex-col justify-between gap-x-4 py-2">
              <p className="text-zinc-500">Your personal page curatored by Breadit. </p>
              <p className="text-zinc-500">Change your name in Settings. </p>
              <p className="text-zinc-500">Check in with your favorite communities.</p>
              <p className="text-zinc-500">Vote to influence which post appears.</p>
              <p className="text-zinc-500">Learn and explore more in search bar.</p>
              <p className="text-zinc-300 text-right">-- Elvin Lin</p>
            </div>

            <Link
              className={buttonVariants({
                className: "w-full mt-1 mb-6",
              })}
              href={`/r/create`}
            >
              Create Community
            </Link>
          </dl>
        </div>
      </div>
    </>
  );
}
