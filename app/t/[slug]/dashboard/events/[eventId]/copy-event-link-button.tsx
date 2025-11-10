import { Button } from "@/components/ui/button"
import { LinkIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function CopyEventLinkButton({ eventUrl }: { eventUrl: string }) {
  const { toast } = useToast()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl)
      toast({
        title: "Link copied!",
        description: "Event link has been copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  return (
    <Button variant="outline" className="w-full bg-transparent" onClick={handleCopy}>
      <LinkIcon className="h-4 w-4 mr-2" />
      Copy Event Link
    </Button>
  )
}
