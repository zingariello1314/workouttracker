/** Aperçu statique. Le canvas ne démarre que lorsque ce fond est choisi. */
export default function FormulaStreamThumbnail() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '#0a0a0c' }} aria-hidden="true">
      <div
        className="absolute inset-0 flex items-center justify-center opacity-70"
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontStyle: 'italic',
          color: 'rgba(232,228,220,0.55)',
          fontSize: '13px',
          letterSpacing: '0.02em',
          background:
            'linear-gradient(90deg, transparent, rgba(255,73,0,0.12), transparent), linear-gradient(180deg,#0a0a0c,#050507)'
        }}
      >
        e<sup>iπ</sup> + 1 = 0
      </div>
    </div>
  );
}
