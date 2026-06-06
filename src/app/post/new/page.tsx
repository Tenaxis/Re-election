import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { PostComposer } from "@/components/post/post-composer";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const { userId } = await getSessionUser();
  if (!userId) redirect("/login?next=/post/new");

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">글쓰기</h1>
      <PostComposer userId={userId} />
    </div>
  );
}
