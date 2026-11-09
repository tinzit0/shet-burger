// Local brand photos: this visual feed does not fetch or impersonate live posts.
const photos = [
  ['/assets/campaign/home-foto-1-640.webp', 'Hamburguesas SHET al aire libre'],
  ['/assets/campaign/mesa-shet.jpg', 'Hamburguesas servidas en platos rosados'],
  ['/assets/campaign/momento-shet.jpg', 'Una clienta disfrutando su SHET'],
  ['/assets/menu/hd/bacon-trip-v2-640.webp', 'Bacon Trip'],
  ['/assets/menu/hd/onion-shet-v2-640.webp', 'Onion Shet'],
  ['/assets/campaign/auto-shet.jpg', 'SHET en movimiento'],
  ['/assets/campaign/burger-playlist.jpg', 'La playlist de SHET'],
  ['/assets/menu/hd/cowboy-smoke-v2-640.webp', 'Cowboy Smoke'],
  ['/assets/campaign/home-foto-3-640.webp', 'Un momento SHET'],
  ['/assets/menu/hd/cheeseburger-bacon-v2-640.webp', 'Cheeseburger Bacon'],
  ['/assets/campaign/shet-al-aire-libre.jpg', 'Una pausa con SHET al aire libre'],
  ['/assets/menu/hd/bbq-beast-v2-640.webp', 'BBQ Beast'],
];

export default function InstagramFeed() {
  return <div className="instagram-feed" role="group" aria-label="Fotos de SHET Burger, estilo Instagram">
    <div className="instagram-feed__track">
      {[false, true].map(duplicate => <div className="instagram-feed__tiles" key={String(duplicate)} aria-hidden={duplicate || undefined}>
        {photos.map(([src, alt]) => <img key={src} src={src} alt={duplicate ? '' : alt} width="320" height="320" loading="lazy" decoding="async"/>)}
      </div>)}
    </div>
  </div>;
}
