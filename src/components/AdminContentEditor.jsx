import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, ImagePlus, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { categories } from '../data';

const emptyProduct = {
  id: '', category: 'burgers', name: '', description: '', image: '',
  variant1: 'Simple', price1: '', variant2: 'Doble', price2: '', featured: false, burgerChoiceCount: 0,
};

const slugify = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 64);
const digits = value => String(value || '').replace(/\D/g, '');
const moneyLabel = value => `$${Number(digits(value) || 0).toLocaleString('es-CL')}`;

const productToForm = product => ({
  id: product.id,
  category: product.category,
  name: product.name,
  description: product.description || '',
  image: product.image || '',
  variant1: product.prices?.[0]?.[0] || 'Unidad',
  price1: digits(product.prices?.[0]?.[1]),
  variant2: product.prices?.[1]?.[0] || '',
  price2: digits(product.prices?.[1]?.[1]),
  featured: Boolean(product.featured),
  burgerChoiceCount: Number(product.burgerChoiceCount || 0),
});

export default function AdminContentEditor({ products, siteContent, onSaveProduct, onDeleteProduct, onSaveContent }) {
  const [section, setSection] = useState('catalog');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [contentForm, setContentForm] = useState(siteContent);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const groupedProducts = useMemo(() => categories.map(category => ({ ...category, products: products.filter(product => product.category === category.id) })), [products]);

  useEffect(() => setContentForm(siteContent), [siteContent]);

  const startNew = () => {
    setEditing('new');
    setForm(emptyProduct);
    setMessage('');
  };
  const startEdit = product => {
    setEditing(product.id);
    setForm(productToForm(product));
    setMessage('');
  };
  const submitProduct = async event => {
    event.preventDefault();
    const firstPrice = digits(form.price1);
    if (!form.name.trim() || !firstPrice) return;
    const id = form.id || slugify(form.name) || `producto-${Date.now()}`;
    const prices = [[form.variant1.trim() || 'Unidad', moneyLabel(firstPrice)]];
    if (digits(form.price2)) prices.push([form.variant2.trim() || 'Opción 2', moneyLabel(form.price2)]);
    const product = {
      id,
      category: form.category,
      name: form.name.trim(),
      description: form.description.trim(),
      image: form.image.trim() || undefined,
      prices,
      featured: Boolean(form.featured),
      ...(form.category === 'promos' ? { burgerChoiceCount: Math.max(0, Number(form.burgerChoiceCount || 0)) } : {}),
    };
    setSaving(true);
    const result = await onSaveProduct(product);
    setSaving(false);
    if (result !== false) {
      setEditing(null);
      setForm(emptyProduct);
      setMessage('Producto guardado. Los cambios ya están visibles en la carta.');
    }
  };
  const remove = async product => {
    if (products.length <= 1) {
      setMessage('La carta debe conservar al menos un producto.');
      return;
    }
    if (!window.confirm(`¿Eliminar ${product.name} de la carta?`)) return;
    setSaving(true);
    const result = await onDeleteProduct(product.id);
    setSaving(false);
    if (result !== false) setMessage('Producto eliminado de la carta.');
  };
  const submitContent = async event => {
    event.preventDefault();
    setSaving(true);
    const result = await onSaveContent(contentForm);
    setSaving(false);
    if (result !== false) setMessage('Textos actualizados en el inicio y el menú.');
  };

  return <main className="admin-shell admin-editor-page">
    <header className="admin-topbar"><a href="/admin" className="admin-brand"><ArrowLeft/> VOLVER AL PANEL</a><a href="/" className="admin-brand"><img src="/assets/logo shet burger.png" alt=""/><span>SHET BURGER <small>EDITOR</small></span></a></header>
    <div className="admin-content">
      <div className="admin-heading"><div><p>CONTENIDO DEL SITIO</p><h1>Edita tu<br/><em>SHET.</em></h1></div><span>Cambia textos, precios<br/>y productos sin tocar código.</span></div>
      <nav className="admin-editor-tabs" aria-label="Secciones del editor"><button type="button" className={section === 'catalog' ? 'active' : ''} onClick={() => setSection('catalog')}>CARTA Y PRODUCTOS</button><button type="button" className={section === 'texts' ? 'active' : ''} onClick={() => setSection('texts')}>TEXTOS DEL SITIO</button></nav>
      {message && <p className="admin-editor-message"><Check/> {message}</p>}

      {section === 'catalog' && <section className="admin-catalog-editor">
        <header><div><span>CATÁLOGO</span><h2>Hamburguesas, promos, salsas y extras</h2></div><button type="button" onClick={startNew}><Plus/> NUEVO PRODUCTO</button></header>
        {editing && <form className="admin-editor-form" onSubmit={submitProduct}>
          <div className="admin-editor-form__heading"><div><span>{editing === 'new' ? 'NUEVO PRODUCTO' : 'EDITAR PRODUCTO'}</span><h3>{form.name || 'Sin nombre'}</h3></div><button type="button" onClick={() => setEditing(null)} aria-label="Cerrar editor"><X/></button></div>
          <div className="admin-editor-form__grid">
            <label>Nombre<input required maxLength="70" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })}/></label>
            <label>Categoría<select value={form.category} onChange={event => setForm({ ...form, category: event.target.value })}>{categories.map(category => <option key={category.id} value={category.id}>{category.label}</option>)}</select></label>
            <label className="wide">Descripción<textarea required maxLength="320" rows="3" value={form.description} onChange={event => setForm({ ...form, description: event.target.value })}/></label>
            <label className="wide">URL de imagen <small>Opcional: usa una imagen dentro de /assets o una URL pública.</small><div className="admin-image-input"><ImagePlus/><input value={form.image} placeholder="/assets/menu/mi-producto.webp" onChange={event => setForm({ ...form, image: event.target.value })}/></div></label>
            <label>Nombre de opción 1<input required value={form.variant1} onChange={event => setForm({ ...form, variant1: event.target.value })}/></label>
            <label>Precio opción 1<input required inputMode="numeric" value={form.price1} placeholder="9990" onChange={event => setForm({ ...form, price1: digits(event.target.value) })}/></label>
            <label>Nombre de opción 2 <small>Opcional</small><input value={form.variant2} onChange={event => setForm({ ...form, variant2: event.target.value })}/></label>
            <label>Precio opción 2 <small>Opcional</small><input inputMode="numeric" value={form.price2} placeholder="11990" onChange={event => setForm({ ...form, price2: digits(event.target.value) })}/></label>
            {form.category === 'promos' && <label>Hamburguesas a elegir<input type="number" min="0" max="10" value={form.burgerChoiceCount} onChange={event => setForm({ ...form, burgerChoiceCount: event.target.value })}/></label>}
            <label className="admin-check"><input type="checkbox" checked={form.featured} onChange={event => setForm({ ...form, featured: event.target.checked })}/><span>Mostrar como destacado</span></label>
          </div>
          <button className="admin-editor-save" type="submit" disabled={saving}><Save/> {saving ? 'GUARDANDO…' : 'GUARDAR PRODUCTO'}</button>
        </form>}
        <div className="admin-catalog-groups">{groupedProducts.map(group => <section key={group.id}><header><h3>{group.label}</h3><span>{group.products.length}</span></header>{group.products.length === 0 ? <p>Sin productos en esta categoría.</p> : <div>{group.products.map(product => <article key={product.id}><div className="admin-product-thumb">{product.image ? <img src={product.image} alt=""/> : <span>{product.category}</span>}</div><div><strong>{product.name}</strong><small>{product.description}</small><b>{product.prices.map(price => `${price[0]} ${price[1]}`).join(' · ')}</b></div><div><button type="button" onClick={() => startEdit(product)}><Pencil/> EDITAR</button><button type="button" className="danger" onClick={() => remove(product)}><Trash2/> ELIMINAR</button></div></article>)}</div>}</section>)}</div>
      </section>}

      {section === 'texts' && <form className="admin-copy-editor" onSubmit={submitContent}>
        <header><span>PORTADA E INICIO DEL MENÚ</span><h2>Edita las palabras públicas</h2><p>Estos cambios aparecen inmediatamente en el inicio y en la carta.</p></header>
        <div className="admin-copy-editor__group"><h3>Portada principal</h3><div className="admin-editor-form__grid">
          <label className="wide">Texto superior<input value={contentForm.heroEyebrow} onChange={event => setContentForm({ ...contentForm, heroEyebrow: event.target.value })}/></label>
          <label>Título principal<input value={contentForm.heroTitle} onChange={event => setContentForm({ ...contentForm, heroTitle: event.target.value })}/></label>
          <label>Texto destacado<input value={contentForm.heroAccent} onChange={event => setContentForm({ ...contentForm, heroAccent: event.target.value })}/></label>
          <label className="wide">Frase descriptiva<input value={contentForm.heroDetail} onChange={event => setContentForm({ ...contentForm, heroDetail: event.target.value })}/></label>
          <label>Botón principal<input value={contentForm.heroPrimaryLabel} onChange={event => setContentForm({ ...contentForm, heroPrimaryLabel: event.target.value })}/></label>
          <label>Botón secundario<input value={contentForm.heroSecondaryLabel} onChange={event => setContentForm({ ...contentForm, heroSecondaryLabel: event.target.value })}/></label>
        </div></div>
        <div className="admin-copy-editor__group"><h3>Encabezado del menú</h3><div className="admin-editor-form__grid">
          <label className="wide">Texto superior<input value={contentForm.menuEyebrow} onChange={event => setContentForm({ ...contentForm, menuEyebrow: event.target.value })}/></label>
          <label>Título<input value={contentForm.menuTitle} onChange={event => setContentForm({ ...contentForm, menuTitle: event.target.value })}/></label>
          <label>Palabra destacada<input value={contentForm.menuAccent} onChange={event => setContentForm({ ...contentForm, menuAccent: event.target.value })}/></label>
          <label className="wide">Nota del menú<input value={contentForm.menuNote} onChange={event => setContentForm({ ...contentForm, menuNote: event.target.value })}/></label>
        </div></div>
        <button className="admin-editor-save" type="submit" disabled={saving}><Save/> {saving ? 'GUARDANDO…' : 'PUBLICAR TEXTOS'}</button>
      </form>}
    </div>
  </main>;
}
