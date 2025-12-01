/**
 * LEGENDARY Stock Logo Component
 *
 * Displays company logos using Clearbit Logo API
 * Falls back to styled 2-letter abbreviation if logo fails to load
 */

import { useState } from 'react'
import { colors, radius, typography } from '../../styles/tokens'

// Map stock symbols to company domains for Clearbit
const symbolToDomain = {
  // Tech Giants
  AAPL: 'apple.com',
  MSFT: 'microsoft.com',
  GOOGL: 'google.com',
  GOOG: 'google.com',
  AMZN: 'amazon.com',
  META: 'meta.com',
  NVDA: 'nvidia.com',
  TSLA: 'tesla.com',
  AMD: 'amd.com',
  INTC: 'intel.com',

  // More Tech
  CRM: 'salesforce.com',
  ADBE: 'adobe.com',
  NFLX: 'netflix.com',
  PYPL: 'paypal.com',
  SQ: 'squareup.com',
  SHOP: 'shopify.com',
  UBER: 'uber.com',
  LYFT: 'lyft.com',
  SNAP: 'snapchat.com',
  PINS: 'pinterest.com',
  TWTR: 'twitter.com',
  SPOT: 'spotify.com',
  ZM: 'zoom.us',
  DOCU: 'docusign.com',
  OKTA: 'okta.com',
  CRWD: 'crowdstrike.com',
  NET: 'cloudflare.com',
  DDOG: 'datadoghq.com',
  MDB: 'mongodb.com',
  SNOW: 'snowflake.com',
  PLTR: 'palantir.com',

  // Finance
  JPM: 'jpmorganchase.com',
  BAC: 'bankofamerica.com',
  WFC: 'wellsfargo.com',
  GS: 'goldmansachs.com',
  MS: 'morganstanley.com',
  V: 'visa.com',
  MA: 'mastercard.com',
  AXP: 'americanexpress.com',

  // Consumer
  WMT: 'walmart.com',
  TGT: 'target.com',
  COST: 'costco.com',
  HD: 'homedepot.com',
  LOW: 'lowes.com',
  NKE: 'nike.com',
  SBUX: 'starbucks.com',
  MCD: 'mcdonalds.com',
  KO: 'coca-cola.com',
  PEP: 'pepsico.com',
  DIS: 'disney.com',

  // Healthcare
  JNJ: 'jnj.com',
  PFE: 'pfizer.com',
  MRNA: 'modernatx.com',
  UNH: 'unitedhealthgroup.com',

  // ETFs
  SPY: 'spdrs.com',
  QQQ: 'invesco.com',
  IWM: 'ishares.com',
  DIA: 'spdrs.com',
  VTI: 'vanguard.com',
  VOO: 'vanguard.com',
}

export default function StockLogo({
  symbol,
  size = 48,
  borderRadius = 12,
  className = '',
  style = {},
}) {
  const [hasError, setHasError] = useState(false)

  // Get domain for Clearbit, or generate a guess
  const domain = symbolToDomain[symbol?.toUpperCase()] || `${symbol?.toLowerCase()}.com`

  // Clearbit Logo API URL
  const logoUrl = `https://logo.clearbit.com/${domain}`

  // Calculate inner logo size (about 75% of container)
  const logoSize = Math.round(size * 0.75)

  // Get 2-letter fallback
  const fallbackText = symbol?.slice(0, 2).toUpperCase() || '??'

  if (hasError) {
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: borderRadius,
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.32,
          fontWeight: typography.fontWeight.bold,
          color: colors.depth1,
          flexShrink: 0,
          ...style,
        }}
      >
        {fallbackText}
      </div>
    )
  }

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: borderRadius,
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
        ...style,
      }}
    >
      <img
        src={logoUrl}
        alt={`${symbol} logo`}
        width={logoSize}
        height={logoSize}
        style={{
          objectFit: 'contain',
        }}
        onError={() => setHasError(true)}
      />
    </div>
  )
}
