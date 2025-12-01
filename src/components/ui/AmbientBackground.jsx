/**
 * LEGENDARY Ambient Background
 *
 * Floating orbs and particles that create the signature iAVA atmosphere
 * Based on: iAVA-ULTIMATE-LEGENDARY-MOBILE.html ambient section
 */

import { colors } from '../../styles/tokens'

export default function AmbientBackground({
  showOrbs = true,
  showParticles = false,
  intensity = 'normal', // 'subtle', 'normal', 'intense'
}) {
  const opacityMultiplier = intensity === 'subtle' ? 0.5 : intensity === 'intense' ? 1.5 : 1

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      {showOrbs && (
        <>
          {/* Purple orb - top right */}
          <div
            className="orb orb-1"
            style={{
              position: 'absolute',
              top: '-10%',
              right: '-5%',
              width: 300,
              height: 300,
              background: `radial-gradient(circle, ${colors.purple[500]}30 0%, transparent 70%)`,
              borderRadius: '50%',
              filter: 'blur(60px)',
              opacity: 0.6 * opacityMultiplier,
              animation: 'orbFloat1 20s ease-in-out infinite',
            }}
          />

          {/* Cyan orb - bottom left */}
          <div
            className="orb orb-2"
            style={{
              position: 'absolute',
              bottom: '20%',
              left: '-10%',
              width: 250,
              height: 250,
              background: `radial-gradient(circle, ${colors.cyan[400]}25 0%, transparent 70%)`,
              borderRadius: '50%',
              filter: 'blur(50px)',
              opacity: 0.5 * opacityMultiplier,
              animation: 'orbFloat2 25s ease-in-out infinite',
            }}
          />

          {/* Indigo orb - center */}
          <div
            className="orb orb-3"
            style={{
              position: 'absolute',
              top: '40%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 400,
              height: 400,
              background: `radial-gradient(circle, ${colors.indigo[500]}15 0%, transparent 70%)`,
              borderRadius: '50%',
              filter: 'blur(80px)',
              opacity: 0.4 * opacityMultiplier,
              animation: 'orbFloat3 30s ease-in-out infinite',
            }}
          />
        </>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes orbFloat1 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(-30px, 20px) scale(1.05);
          }
          50% {
            transform: translate(-20px, 40px) scale(0.95);
          }
          75% {
            transform: translate(10px, 20px) scale(1.02);
          }
        }

        @keyframes orbFloat2 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(40px, -30px) scale(1.1);
          }
          66% {
            transform: translate(20px, 20px) scale(0.9);
          }
        }

        @keyframes orbFloat3 {
          0%, 100% {
            transform: translateX(-50%) scale(1);
          }
          50% {
            transform: translateX(-50%) scale(1.15);
          }
        }
      `}</style>
    </div>
  )
}
