import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, Check, ImagePlus, Pencil, Plus, Save, Trash2, Upload, X } from 'lucide-react';
import { categories } from '../data';

const emptyProduct = {
  id: '', category: 'burgers', name: '', description: '', image: '', imagePath: '',
  variant1: 'Simple', price1: '', variant2: 'Doble', price2: '', featured: false, burgerChoiceCount: 0,
};

const slugify = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 64);
const digits = value => String(value || '').replace(/\D/g, '');
const moneyLabel = value => `$${Number(digits(value) || 0).toLocaleString('es-CL')}`;
const readFile = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error('No pudimos leer esta imagen.'));
  reader.readAsDataURL(file);
});
const decodeImage = source => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('El archivo no parece ser una imagen válida.'));
  image.src = source;
});
const canvasBlob = canvas => new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.86));

async function prepareImage(file) {
  if (!file?.type.startsWith('image/')) throw new Error('Selecciona una fotografía o imagen válida.');
  if (file.size > 20 * 1024 * 1024) throw new Error('La imagen no puede superar los 20 MB.');
  const source = await readFile(file);
  const image = await decodeImage(source);
  const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await canvasBlob(canvas);
  if (!blob) return { file, preview: source };
  const filename = `${file.name.replace(/\.[^.]+$/, '') || 'producto'}.webp`;
  const optimized = new File([blob], filename, { type: 'image/webp', lastModified: Date.now() });
  return { file: optimized, preview: await readFile(optimized) };
}

const productToForm = product => ({
  id: product.id,
  category: product.category,
  name: product.name,
  description: product.description || '',
  image: product.image || '',
  imagePath: product.imagePath || '',
  variant1: product.prices?.[0]?.[0] || 'Unidad',
  price1: digits(product.prices?.[0]?.[1]),
  variant2: product.prices?.[1]?.[0] || '',
  price2: digits(product.prices?.[1]?.[1]),
  featured: Boolean(product.featured),
  burgerChoiceCount: Number(product.burgerChoiceCount || 0),
});

export default function AdminContentEditor({ products, siteContent, onSaveProduct, onDeleteProduct, onSaveContent, onUploadImage }) {
  const [section, setSection] = useState('catalog');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [contentForm, setContentForm] = useState(siteContent);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imagePreparing, setImagePreparing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState({ tone: 'success', text: '' });
  const editorRef = useRef(null);
  const groupedProducts = useMemo(() => categories.map(category => ({ ...category, products: products.filter(product => product.category === category.id) })), [products]);
  const preview = imagePreview || form.image;

  useEffect(() => setContentForm(siteContent), [siteContent]);

  const revealEditor = () => requestAnimationFrame(() => editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  const resetImageSelection = (image = '') => {
    setImageFile(null);
    setImagePreview(image);
    setImagePreparing(false);
  };
  const startNew = () => {
    setEditing('new');
    setForm(emptyProduct);
    resetImageSelection();
    setFormError('');
    setNotice({ tone: 'success', text: '' });
    revealEditor();
  };
  const startEdit = product => {
    setEditing(product.id);
    setForm(productToForm(product));
    resetImageSelection(product.image || '');
    setFormError('');
    setNotice({ tone: 'success', text: '' });
    revealEditor();
  };
  const chooseImage = async file => {
    if (!file) return;
    setImagePreparing(true);
    setFormError('');
    try {
      const prepared = await prepareImage(file);
      setImageFile(prepared.file);
      setImagePreview(prepared.preview);
      setNotice({ tone: 'info', text: 'Imagen lista. Se optimizó automáticamente para que cargue rápido y se vea nítida.' });
    } catch (error) {
      setFormError(error.message);
    } finally {
      setImagePreparing(false);
    }
  };
  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setForm(current => ({ ...current, image: '', imagePath: '' }));
  };
  const submitProduct = async event => {
    event.preventDefault();
    const firstPrice = digits(form.price1);
    if (!form.name.trim()) return setFormError('Escribe el nombre del producto.');
    if (!form.description.trim()) return setFormError('Agrega una descripción para el producto.');
    if (!firstPrice || Number(firstPrice) <= 0) return setFormError('Ingresa un precio válido.');
    const id = form.id || slugify(form.name) || `producto-${Date.now()}`;
    const prices = [[form.variant1.trim() || 'Unidad', moneyLabel(firstPrice)]];
    if (digits(form.price2)) prices.push([form.variant2.trim() || 'Opción 2', moneyLabel(form.price2)]);
    setSaving(true);
    setFormError('');
    let image = form.image.trim() || undefined;
    let imagePath = form.imagePath || undefined;
    let localImageFallback = false;
    try {
      if (imageFile) {
        setNotice({ tone: 'info', text: 'Subiendo y preparando la nueva imagen…' });
        const upload = await onUploadImage?.(imageFile, id);
        if (upload?.url) {
          image = upload.url;
          imagePath = upload.path;
        } else {
          image = imagePreview;
          imagePath = undefined;
          localImageFallback = true;
        }
      }
      const existingProduct = products.find(item => item.id === id);
      const product = {
        ...existingProduct,
        id,
        category: form.category,
        name: form.name.trim(),
        description: form.description.trim(),
        image,
        ...(imagePath ? { imagePath } : {}),
        prices,
        featured: Boolean(form.featured),
        ...(form.category === 'promos' ? { burgerChoiceCount: Math.max(0, Number(form.burgerChoiceCount || 0)) } : {}),
      };
      const result = await onSaveProduct(product);
      if (result === false || result?.ok === false) throw result?.error || new Error('No se pudo guardar el producto.');
      setEditing(null);
      setForm(emptyProduct);
      resetImageSelection();
      if (result?.synced && !localImageFallback) {
        setNotice({ tone: 'success', text: 'Producto publicado. Los cambios ya están visibles en todos los dispositivos.' });
      } else {
        setNotice({ tone: 'warning', text: 'Producto guardado en este dispositivo. Activa el almacenamiento de Supabase para sincronizarlo con los demás equipos.' });
      }
    } catch (error) {
      setFormError(error.message || 'No se pudo guardar el producto.');
    } finally {
      setSaving(false);
    }
  };
  const remove = async product => {
    if (products.length <= 1) {
      setNotice({ tone: 'warning', text: 'La carta debe conservar al menos un producto.' });
      return;
    }
    if (!window.confirm(`¿Eliminar ${product.name} de la carta?`)) return;
    setSaving(true);
    try {
      const result = await onDeleteProduct(product.id);
      if (result !== false) setNotice({ tone: result?.synced ? 'success' : 'warning', text: result?.synced ? 'Producto eliminado de la carta.' : 'Producto eliminado en este dispositivo; la nube no pudo sincronizarse.' });
    } finally {
      setSaving(false);
    }
  };
  const submitContent = async event => {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const result = await onSaveContent(contentForm);
      if (result === false || result?.ok === false) throw result?.error || new Error('No se pudieron publicar los textos.');
      setNotice({ tone: result?.synced ? 'success' : 'warning', text: result?.synced ? 'Textos publicados en el inicio y el menú.' : 'Textos guardados en este dispositivo; la nube no pudo sincronizarse.' });
    } catch (error) {
      setFormError(error.message || 'No se pudieron publicar los textos.');
    } finally {
      setSaving(false);
    }
  };

  return <main className="admin-shell admin-editor-page">
    <header className="admin-topbar"><a href="/admin" className="admin-brand"><ArrowLeft/> VOLVER AL PANEL</a><a href="/" className="admin-brand"><img src="/assets/logo shet burger.png" alt=""/><span>SHET BURGER <small>EDITOR</small></span></a></header>
    <div className="admin-content">
      <div className="admin-heading"><div><p>CONTENIDO DEL SITIO</p><h1>Edita tu<br/><em>SHET.</em></h1></div><span>Cambia textos, imágenes, precios<br/>y productos sin tocar código.</span></div>
      <nav className="admin-editor-tabs" aria-label="Secciones del editor"><button type="button" className={section === 'catalog' ? 'active' : ''} onClick={() => setSection('catalog')}>CARTA Y PRODUCTOS</button><button type="button" className={section === 'texts' ? 'active' : ''} onClick={() => setSection('texts')}>TEXTOS DEL SITIO</button></nav>
      {notice.text && <p className={`admin-editor-message is-${notice.tone}`} role={notice.tone === 'warning' ? 'alert' : 'status'}>{notice.tone === 'warning' ? <AlertCircle/> : <Check/>} {notice.text}</p>}
      {formError && <p className="admin-form-error" role="alert"><AlertCircle/> {formError}</p>}

      {section === 'catalog' && <section className="admin-catalog-editor">
        <header><div><span>CATÁLOGO</span><h2>Hamburguesas, promos, salsas y extras</h2></div><button type="button" onClick={startNew}><Plus/> NUEVO PRODUCTO</button></header>
        {editing && <form className="admin-editor-form" onSubmit={submitProduct} ref={editorRef} aria-busy={saving || imagePreparing}>
          <div className="admin-editor-form__heading"><div><span>{editing === 'new' ? 'NUEVO PRODUCTO' : 'EDITAR PRODUCTO'}</span><h3>{form.name || 'Sin nombre'}</h3></div><button type="button" onClick={() => setEditing(null)} aria-label="Cerrar editor"><X/></button></div>
          <div className="admin-editor-form__grid">
            <label>Nombre<input required maxLength="70" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })}/></label>
            <label>Categoría<select value={form.category} onChange={event => setForm({ ...form, category: event.target.value })}>{categories.map(category => <option key={category.id} value={category.id}>{category.label}</option>)}</select></label>
            <label className="wide">Descripción<textarea required maxLength="320" rows="3" value={form.description} onChange={event => setForm({ ...form, description: event.target.value })}/></label>
            <div className="admin-image-field wide">
              <span>Imagen del producto</span><small>Elige una foto de tu teléfono, tablet o computador. Se ajustará automáticamente a formato web.</small>
              <div className="admin-image-picker">
                <div className={`admin-image-preview${preview ? ' has-image' : ''}`}>{preview ? <img src={preview} alt="Vista previa del producto"/> : <><ImagePlus/><span>SIN IMAGEN</span></>}</div>
                <div className="admin-image-picker__actions">
                  <label className="admin-image-upload"><Upload/> {imagePreparing ? 'PREPARANDO…' : 'ELEGIR IMAGEN'}<input type="file" accept="image/*" disabled={imagePreparing || saving} onChange={event => { chooseImage(event.target.files?.[0]); event.target.value = ''; }}/></label>
                  <small>JPG, PNG, WEBP o fotografía del dispositivo. Máximo 20 MB.</small>
                  {preview && <button type="button" onClick={removeImage}><Trash2/> QUITAR IMAGEN</button>}
                </div>
              </div>
              <details className="admin-image-url"><summary>Usar una URL en vez de subir un archivo</summary><div className="admin-image-input"><ImagePlus/><input value={imageFile ? '' : form.image} placeholder="https://… o /assets/menu/imagen.webp" onChange={event => { setImageFile(null); setImagePreview(event.target.value); setForm({ ...form, image: event.target.value, imagePath: '' }); }}/></div></details>
            </div>
            <label>Nombre de opción 1<input required value={form.variant1} onChange={event => setForm({ ...form, variant1: event.target.value })}/></label>
            <label>Precio opción 1<input required inputMode="numeric" value={form.price1} placeholder="9990" onChange={event => setForm({ ...form, price1: digits(event.target.value) })}/></label>
            <label>Nombre de opción 2 <small>Opcional</small><input value={form.variant2} onChange={event => setForm({ ...form, variant2: event.target.value })}/></label>
            <label>Precio opción 2 <small>Opcional</small><input inputMode="numeric" value={form.price2} placeholder="11990" onChange={event => setForm({ ...form, price2: digits(event.target.value) })}/></label>
            {form.category === 'promos' && <label>Hamburguesas a elegir<input type="number" min="0" max="10" value={form.burgerChoiceCount} onChange={event => setForm({ ...form, burgerChoiceCount: event.target.value })}/></label>}
            <label className="admin-check"><input type="checkbox" checked={form.featured} onChange={event => setForm({ ...form, featured: event.target.checked })}/><span>Mostrar como destacado</span></label>
          </div>
          <div className="admin-editor-actions"><small>Revisa la vista previa antes de publicar.</small><button className="admin-editor-save" type="submit" disabled={saving || imagePreparing}><Save/> {saving ? 'GUARDANDO…' : 'GUARDAR Y PUBLICAR'}</button></div>
        </form>}
        <div className="admin-catalog-groups">{groupedProducts.map(group => <section key={group.id}><header><h3>{group.label}</h3><span>{group.products.length}</span></header>{group.products.length === 0 ? <p>Sin productos en esta categoría.</p> : <div>{group.products.map(product => <article key={product.id}><div className="admin-product-thumb">{product.image ? <img src={product.image} alt=""/> : <span>{product.category}</span>}</div><div><strong>{product.name}</strong><small>{product.description}</small><b>{product.prices.map(price => `${price[0]} ${price[1]}`).join(' · ')}</b></div><div><button type="button" onClick={() => startEdit(product)}><Pencil/> EDITAR</button><button type="button" className="danger" onClick={() => remove(product)} disabled={saving}><Trash2/> ELIMINAR</button></div></article>)}</div>}</section>)}</div>
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
