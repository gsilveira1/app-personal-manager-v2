import { Bot } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, Label, Textarea } from '../../atoms'

/**
 * Props for the AiInstructionsSection component.
 */
interface AiInstructionsSectionProps {
  /** The current AI instructions value. */
  value: string
  /** Callback fired when the AI instructions change. */
  onChange: (value: string) => void
}

/**
 * A section for managing AI instructions on the AI configuration page.
 *
 * @param props - The component props.
 * @returns The rendered AI instructions section.
 */
export const AiInstructionsSection = ({ value, onChange }: AiInstructionsSectionProps) => {
  const { t } = useTranslation('ai')

  return (
    <Card>
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center">
          <Bot className="mr-3 h-5 w-5 text-indigo-600" />
          {t('instructions.title')}
        </h2>
        <p className="text-sm text-slate-500 mt-1">{t('instructions.placeholder')}</p>
      </div>
      <div className="p-6">
        <Label htmlFor="ai-instructions">{t('instructions.title')}</Label>
        <Textarea id="ai-instructions" rows={5} className="mt-2" placeholder={t('instructions.placeholder')} value={value} onChange={(e) => onChange(e.target.value)} />
        <p className="text-xs text-slate-400 mt-2">{t('instructions.autoSave')}</p>
      </div>
    </Card>
  )
}
