import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { useStore } from '../../states/stores/store'
import { AiInstructionsSection } from '../../components/organisms/ai'

/**
 * AI configuration page. Each entry of `sections` is one card; a new area
 * (MCP servers, agents) is one more entry.
 */
export const AiSettings = () => {
  const { t } = useTranslation('ai')
  const { aiPromptInstructions, updateAiPromptInstructions } = useStore()

  const sections: Array<{ id: string; content: ReactNode }> = [
    {
      id: 'instructions',
      content: <AiInstructionsSection value={aiPromptInstructions} onChange={updateAiPromptInstructions} />,
    },
  ]

  return (
    <div className="space-y-6" data-testid="ai-settings-page">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('title')}</h1>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">{t('subtitle')}</p>
      </div>

      {sections.map((section) => (
        <section key={section.id} data-testid={`ai-section-${section.id}`}>
          {section.content}
        </section>
      ))}
    </div>
  )
}
export default AiSettings
