import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NicknameForm } from "@/components/auth/nickname-form";
import { getSessionUser } from "@/lib/auth";

export default async function OnboardingPage() {
  const { userId, profile } = await getSessionUser();

  if (!userId) {
    redirect("/login?next=/onboarding");
  }

  // 이미 닉네임이 있으면 온보딩 불필요.
  if (profile?.nickname) {
    redirect("/");
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">닉네임 설정</CardTitle>
          <CardDescription>
            광장에서 사용할 가명을 정해주세요. 실명 대신 닉네임만 노출됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NicknameForm />
        </CardContent>
      </Card>
    </div>
  );
}
