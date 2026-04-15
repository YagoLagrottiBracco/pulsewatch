import { Wrench } from 'lucide-react'
import { CardContent } from '@/components/ui/card'

interface AlertDiagnosisCardProps {
  title: string
  items: string[]
}

export function AlertDiagnosisCard({ title, items }: AlertDiagnosisCardProps) {
  return (
    <CardContent className="border-t pt-4">
      <div className="rounded-md bg-orange-500/5 border border-orange-500/20 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Wrench className="h-4 w-4 text-orange-600" />
          <span className="text-sm font-semibold text-orange-700">{title}</span>
        </div>
        <ol className="space-y-1.5 list-decimal list-inside">
          {items.map((item, i) => (
            <li key={i} className="text-sm text-muted-foreground">
              {item}
            </li>
          ))}
        </ol>
      </div>
    </CardContent>
  )
}
