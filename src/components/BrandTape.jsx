export default function BrandTape() {
  return <div className="brand-tape" aria-hidden="true">{[0, 1].map(track => <div key={track}><span>FAT SMASH</span><i>✳</i><span>PINK BOX</span><i>✳</i><span>NONGUÉN</span><i>✳</i></div>)}</div>;
}
