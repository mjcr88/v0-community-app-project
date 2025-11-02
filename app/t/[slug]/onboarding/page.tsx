import { redirect } from "next/navigation"

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  // Redirect to first step
  redirect(`/t/${slug}/onboarding/welcome`)
}
