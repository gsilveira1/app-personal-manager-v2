import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload, Check, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Button, Input, Card, Badge } from '../../../components/ui'
import { useTenantStore } from '../../../states/stores/tenant/tenantStore'

const PRESET_COLORS = [
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Blue', hex: '#2563EB' },
  { name: 'Violet', hex: '#7C3AED' },
  { name: 'Rose', hex: '#E11D48' },
  { name: 'Amber', hex: '#D97706' },
  { name: 'Slate', hex: '#475569' },
]

interface BrandingStepProps {
  onComplete: () => void
}

export const BrandingStep: React.FC<BrandingStepProps> = ({ onComplete }) => {
  const { t } = useTranslation('setupWizard')
  const { tenant, updateBranding, uploadLogo, setPrimaryColorPreview, isLoading } = useTenantStore()

  const [primaryColor, setPrimaryColor] = useState(tenant?.primaryColor || '#10B981')
  const [logoUrl, setLogoUrl] = useState(tenant?.logoUrl || '')
  const [isUploading, setIsUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleColorChange = (hex: string) => {
    setPrimaryColor(hex)
    setPrimaryColorPreview(hex)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setErrorMessage(null)

    // Validation: Max 2MB (2 * 1024 * 1024 bytes)
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage(t('alerts.fileSizeError'))
      return
    }

    // Validation: Allowed MIME types
    const allowedTypes = ['image/png', 'image/svg+xml', 'image/webp', 'image/jpeg']
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage(t('alerts.fileTypeError'))
      return
    }

    try {
      setIsUploading(true)
      const uploadedUrl = await uploadLogo(file)
      setLogoUrl(uploadedUrl)
    } catch (err: any) {
      setErrorMessage(err.message || 'Error uploading file')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSaveAndContinue = async () => {
    try {
      setErrorMessage(null)
      await updateBranding({
        primaryColor,
        logoUrl: logoUrl || undefined,
      })
      onComplete()
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving branding')
    }
  }

  return (
    <div className="space-y-8" data-testid="branding-step">
      <div>
        <span className="inline-block px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-100 rounded-full mb-2">{t('step1.badge')}</span>
        <h2 className="text-2xl font-bold text-slate-800">{t('step1.title')}</h2>
        <p className="mt-1 text-sm text-slate-600">{t('step1.description')}</p>
      </div>

      {errorMessage && <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{errorMessage}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls Column */}
        <div className="space-y-6">
          {/* Logo Upload Section */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('step1.logoLabel')}</label>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden relative">
                {logoUrl ? <img src={logoUrl} alt="Logo Preview" className="h-full w-full object-contain p-1" /> : <ImageIcon className="h-8 w-8 text-slate-400" />}
                {isUploading && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 cursor-pointer transition-colors">
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? t('step1.uploading') : t('step1.uploadButton')}
                  <input
                    type="file"
                    accept="image/png, image/svg+xml, image/webp, image/jpeg"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isUploading || isLoading}
                    data-testid="logo-file-input"
                  />
                </label>
                <p className="mt-1.5 text-xs text-slate-500">{t('step1.logoHelp')}</p>
              </div>
            </div>
          </div>

          {/* Primary Color Section */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">{t('step1.colorLabel')}</label>
            <div>
              <p className="text-xs text-slate-500 mb-2">{t('step1.presetColors')}</p>
              <div className="flex flex-wrap gap-3">
                {PRESET_COLORS.map((color) => {
                  const isSelected = primaryColor.toLowerCase() === color.hex.toLowerCase()
                  return (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => handleColorChange(color.hex)}
                      className="group relative flex items-center justify-center h-10 w-10 rounded-full border-2 transition-transform hover:scale-110 shadow-sm"
                      style={{
                        backgroundColor: color.hex,
                        borderColor: isSelected ? '#000000' : 'transparent',
                      }}
                      title={color.name}
                      data-testid={`color-preset-${color.name.toLowerCase()}`}
                    >
                      {isSelected && <Check className="h-4 w-4 text-white drop-shadow" />}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="pt-2">
              <p className="text-xs text-slate-500 mb-1.5">{t('step1.customColor')}</p>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="h-10 w-12 cursor-pointer rounded border border-slate-300 bg-transparent p-1"
                  data-testid="color-picker-input"
                />
                <Input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  placeholder="#10B981"
                  className="w-32 font-mono uppercase text-sm"
                  data-testid="color-hex-input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview Card */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">{t('step1.previewTitle')}</label>
          <Card className="p-6 border border-slate-200 shadow-sm bg-white rounded-xl space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: primaryColor }}>
                  {logoUrl ? <img src={logoUrl} alt="Logo" className="h-8 w-8 object-contain rounded" /> : 'VP'}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{tenant?.name || 'Vivi Personal Studio'}</h4>
                  <p className="text-xs text-slate-500">App do Aluno</p>
                </div>
              </div>
              <Badge variant="success" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
                {t('step1.previewBadge')}
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-medium text-slate-500">{t('step1.previewCard')}</div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-800">Treino A - Hipertrofia</span>
                  <span className="text-xs text-slate-500">45 min</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-300" style={{ backgroundColor: primaryColor, width: '65%' }} />
                </div>
              </div>

              <button
                type="button"
                className="w-full py-2.5 px-4 rounded-lg text-white font-semibold text-sm shadow transition-opacity hover:opacity-95 flex items-center justify-center"
                style={{ backgroundColor: primaryColor }}
              >
                {t('step1.previewButton')}
              </button>
            </div>
          </Card>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <Button onClick={handleSaveAndContinue} disabled={isLoading || isUploading} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5" data-testid="save-step-1-button">
          {t('step1.nextButton')}
        </Button>
      </div>
    </div>
  )
}
