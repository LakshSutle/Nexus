import { redirect } from "next/navigation"

export default async function GoalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/goals/${id}/timeline`)
}
