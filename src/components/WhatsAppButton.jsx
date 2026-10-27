import { MessageCircle } from 'lucide-react';

const whatsappUrl = 'https://wa.me/56956901911?text=Hola%20SHET%20Burger%2C%20quiero%20hacer%20una%20consulta.';

export default function WhatsAppButton() {
  return <a className="whatsapp-button" href={whatsappUrl} target="_blank" rel="noreferrer" aria-label="Hablar con SHET Burger por WhatsApp al +56 9 5690 1911">
    <MessageCircle aria-hidden="true"/>
    <span>WHATSAPP</span>
  </a>;
}
