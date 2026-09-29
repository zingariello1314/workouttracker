/** Aperçu statique. Le WebGL ne démarre que lorsque ce fond est choisi. */
export default function GrassFieldThumbnail() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '#000000' }} aria-hidden="true">
      <div className="absolute inset-x-0 top-0 h-1/2" style={{ background: 'linear-gradient(#000000, #000000)' }} />
      <div
        className="absolute inset-x-0 bottom-0 h-1/2"
        style={{
          background: 'repeating-linear-gradient(95deg, #052000 0 2px, #3fff00 2px 3px, #041400 3px 7px)'
        }}
      />
    </div>
  );
}
