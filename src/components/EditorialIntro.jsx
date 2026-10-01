export default function EditorialIntro() {
  return <section className="editorial-intro" id="experiencia" aria-labelledby="intro-title">
    <div className="editorial-meta"><span>01 / EL ANTOJO EMPIEZA ACÁ</span><span>NONGUÉN · CONCEPCIÓN</span></div>
    <div className="intro-composition">
      <h2 id="intro-title" data-reveal>FAT.<br/>JUICY.<br/><span>SHET.</span></h2>
      <figure data-reveal><img data-drift="photo" src="/assets/intro-burger.webp" width="1000" height="1151" loading="lazy" decoding="async" alt="Hamburguesa Shet: pan, carne smash y cheddar fundido"/><figcaption>FAT SMASH BURGERS. <span>SIN ATAJOS. ↗</span></figcaption></figure>
      <p className="intro-note">Bordes crocantes.<br/>Cheddar fundido.<br/>Mucho SHET.</p>
    </div>
    <div className="editorial-ticker" aria-hidden="true"><div>{[0,1].map(i=><span key={i}>FAT SMASH BURGERS ✳ HECHO EN CONCE ✳ SIN ATAJOS ✳&nbsp;</span>)}</div></div>
  </section>;
}
