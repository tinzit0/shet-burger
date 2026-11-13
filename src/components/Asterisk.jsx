/** Drawn asterisk: the ✳ character turns into a green emoji on iPhone, so we never use the glyph. */
export default function Asterisk({ className = 'asterisk' }) {
  return <svg className={className} viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false"><path d="M12 2v20M2 12h20M4.9 4.9l14.2 14.2M19.1 4.9 4.9 19.1" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/></svg>;
}
