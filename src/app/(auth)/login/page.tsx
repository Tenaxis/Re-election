import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthForm } from "@/components/auth/auth-form";
import { OAuthButtons } from "@/components/auth/oauth-buttons";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">로그인</CardTitle>
          <CardDescription>재선거에 다시 오신 것을 환영합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <AuthForm mode="login" next={next} />

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">또는</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <OAuthButtons next={next} />

          <p className="text-center text-sm text-muted-foreground">
            계정이 없으신가요?{" "}
            <Link
              href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}
              className="font-medium text-primary hover:underline"
            >
              회원가입
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
