'use client'

import { avatarColor } from '@/components/bc-ui'
import { cn } from '@/lib/utils'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'

interface ArchivedGroup {
  id: string
  name: string
}

interface Props {
  groups: ArchivedGroup[]
  label: string
  archivedLabel: string
}

function GroupGlyph({ name, size = 32 }: { name: string; size?: number }) {
  const ch = (name || '?').trim().charAt(0).toUpperCase()
  const bg = avatarColor(name)
  return (
    <div
      className="flex items-center justify-center font-serif shrink-0 text-white"
      style={{ width: size, height: size, borderRadius: size * 0.32, background: bg, fontSize: size * 0.55, letterSpacing: '-0.02em' }}
    >
      {ch}
    </div>
  )
}

export function ArchivedGroupsRow({ groups, label, archivedLabel }: Props) {
  return (
    <Accordion className="border-t border-(--bc-softhair)">
      <AccordionItem value="archived" className="border-b-0">
        <AccordionTrigger className="px-4.5 py-3.5 hover:no-underline">
          <div className="flex flex-1 items-center mr-1">
            <span className="font-sans text-[15px] text-(--bc-ink)">{label}</span>
            <span className="ml-auto font-sans text-sm text-(--bc-muted)">{groups.length}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="p-0">
          <div className="border-t border-(--bc-softhair)">
            {groups.map((g, i) => (
              <div key={g.id} className={cn('flex items-center gap-3 px-4 py-3', i > 0 && 'border-t border-(--bc-softhair)')}>
                <GroupGlyph name={g.name} size={32} />
                <div className="flex-1 font-sans font-medium text-sm text-(--bc-ink)">{g.name}</div>
                <div className="font-sans text-[11px] text-(--bc-muted) tracking-[0.06em] uppercase whitespace-nowrap">{archivedLabel}</div>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
