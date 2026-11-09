export default function PromotionRulesEditor({ count, slots, products, onChange }) {
  const slotCount = Math.min(10, Math.max(0, Number(count) || 0));
  const update = (index, changes) => onChange(Array.from({ length: slotCount }, (_, i) => ({ ...slots[i], ...(i === index ? changes : {}) })));
  const choices = (index, field, category) => products.filter(category).map(product => {
    const selected = slots[index]?.[field] || [];
    return <label className="admin-check" key={product.id}><input type="checkbox" checked={selected.includes(product.id)} onChange={event => update(index, { [field]: event.target.checked ? [...selected, product.id] : selected.filter(id => id !== product.id) })}/><span>{product.name}</span></label>;
  });
  return <div className="wide promo-rules-editor"><h4>Reglas por hamburguesa de la promoción</h4><p>Sin selección se usan las opciones generales. Los precios provienen del catálogo.</p>{Array.from({ length: slotCount }, (_, index) => <details key={index}><summary>Hamburguesa {index + 1}</summary><label className="admin-check"><input type="checkbox" checked={slots[index]?.allowBurgerVariants !== false} onChange={event => update(index, { allowBurgerVariants: event.target.checked })}/><span>Permitir doble en hamburguesa {index + 1}</span></label><fieldset><legend>Tipos de hamburguesa permitidos</legend>{choices(index, 'allowedBurgerIds', product => product.category === 'burgers')}</fieldset><fieldset><legend>Adicionales permitidos para hamburguesa y papas</legend>{choices(index, 'allowedExtraIds', product => ['extras','salsas'].includes(product.category))}</fieldset></details>)}</div>;
}
