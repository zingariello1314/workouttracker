/**
 * Fond type « horizon » (inspiré du module Bolt / moduleecrireporujournalgithub.md),
 * recoloré charte Code Momentum : noir + framboise (pas le bleu d’origine).
 */
export default function JournalBoltBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden rounded-2xl">
      <div className="absolute inset-0 bg-[#0a0508]" />
      <div
        className="absolute left-1/2 h-[900px] w-[2800px] -translate-x-1/2 sm:h-[1200px] sm:w-[4200px]"
        style={{
          top: '-10%',
          background:
            'radial-gradient(circle at center 55%, rgba(225, 29, 72, 0.55) 0%, rgba(190, 24, 93, 0.28) 14%, rgba(136, 19, 55, 0.14) 22%, rgba(12, 10, 12, 0.25) 32%)',
        }}
      />
      <div
        className="absolute left-1/2 top-[12%] h-[720px] w-[1200px] -translate-x-1/2 sm:top-[18%] sm:h-[1100px] sm:w-[2200px]"
        style={{ transform: 'translate(-50%) rotate(180deg)' }}
      >
        <div
          className="absolute -mt-[6px] h-full w-full rounded-full"
          style={{
            background: 'radial-gradient(43.89% 25.74% at 50.02% 97.24%, #0c080a 0%, #080608 100%)',
            border: '12px solid rgba(255,255,255,0.06)',
            transform: 'rotate(180deg)',
            zIndex: 5,
          }}
        />
        <div
          className="absolute -mt-[5px] h-full w-full rounded-full bg-[#0a0508]"
          style={{ border: '16px solid rgba(251, 113, 133, 0.35)', transform: 'rotate(180deg)', zIndex: 4 }}
        />
        <div
          className="absolute -mt-[3px] h-full w-full rounded-full bg-[#0a0508]"
          style={{ border: '16px solid rgba(244, 63, 94, 0.45)', transform: 'rotate(180deg)', zIndex: 3 }}
        />
        <div
          className="absolute -mt-[1px] h-full w-full rounded-full bg-[#0a0508]"
          style={{ border: '14px solid rgba(225, 29, 72, 0.55)', transform: 'rotate(180deg)', zIndex: 2 }}
        />
        <div
          className="absolute h-full w-full rounded-full bg-[#0a0508]"
          style={{
            border: '12px solid #be123c',
            boxShadow: '0 -12px 28px rgba(225, 29, 72, 0.35)',
            transform: 'rotate(180deg)',
            zIndex: 1,
          }}
        />
      </div>
    </div>
  );
}
