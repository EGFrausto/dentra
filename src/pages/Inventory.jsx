import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Package, AlertTriangle } from 'lucide-react';
import { inventory as store } from '../lib/store';
import Modal from '../components/Modal';
import Select from '../components/Select';
import ConfirmModal from '../components/ConfirmModal';

const CATEGORIES = ['Materiales de restauración','Anestésicos','EPP','Instrumental','Radiología','Higiene','Otros'];
const UNITS = ['unidades','cajas','jeringas','frascos','tubos','rollos','paquetes','kits'];
const EMPTY = { name:'', category:'', quantity:0, unit:'unidades', min_stock:5, notes:'' };

export default function Inventory() {
  const [list,setList]       = useState([]);
  const [search,setSearch]   = useState('');
  const [modal,setModal]     = useState(false);
  const [editing,setEditing] = useState(null);
  const [form,setForm]       = useState(EMPTY);
  const [filterCat,setFilterCat] = useState('');
  const [confirmDel,setConfirmDel] = useState(null);

  useEffect(()=>{setList(store.get());},[]);
  const reload=()=>setList(store.get());

  const filtered=list.filter(i=>{
    const s=search.toLowerCase();
    return (i.name.toLowerCase().includes(s)||i.category?.toLowerCase().includes(s))&&(!filterCat||i.category===filterCat);
  });

  const lowStock=list.filter(i=>Number(i.quantity)<=Number(i.min_stock));
  const openNew=()=>{setForm(EMPTY);setEditing(null);setModal(true);};
  const openEdit=i=>{setForm(i);setEditing(i.id);setModal(true);};
  const save=()=>{
    if(!form.name)return alert('El nombre es requerido');
    editing?store.update(editing,{...form,quantity:Number(form.quantity),min_stock:Number(form.min_stock)}):store.add({...form,quantity:Number(form.quantity),min_stock:Number(form.min_stock)});
    reload();setModal(false);
  };
  const confirmDelete=()=>{store.remove(confirmDel);reload();setConfirmDel(null);};
  const tf=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  const sf=(k,v)=>setForm(p=>({...p,[k]:v}));

  const stockStatus=(qty,min)=>{
    qty=Number(qty);min=Number(min);
    if(qty===0)return{label:'Sin stock',cls:'badge badge-red'};
    if(qty<=min)return{label:'Stock bajo',cls:'badge badge-amber'};
    return{label:'En stock',cls:'badge badge-green'};
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-7">
        <div><h1 className="text-2xl font-bold text-slate-800">Inventario</h1><p className="text-sm text-slate-400 mt-0.5">{list.length} artículos registrados</p></div>
        <button onClick={openNew} className="btn-primary"><Plus size={16}/> Nuevo Artículo</button>
      </div>

      {lowStock.length>0&&(
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5"/>
          <div><p className="text-sm font-semibold text-amber-800">Stock bajo en {lowStock.length} artículo(s)</p><p className="text-xs text-amber-600 mt-0.5">{lowStock.map(i=>i.name).join(', ')}</p></div>
        </div>
      )}

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1"><Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar artículos..." className="input-field pl-10"/></div>
        <div className="w-56"><Select value={filterCat} onChange={v=>setFilterCat(v)} placeholder="Todas las categorías" options={[{value:'',label:'Todas las categorías'},...CATEGORIES.map(c=>({value:c,label:c}))]}/></div>
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-5 px-5 py-3 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
          <span className="col-span-2">Artículo</span><span>Categoría</span><span>Cantidad</span><span>Estado</span>
        </div>
        {filtered.length===0
          ?<div className="py-16 text-center"><Package size={36} className="text-slate-200 mx-auto mb-3"/><p className="text-sm text-slate-400">No hay artículos registrados</p></div>
          :filtered.map(item=>{
            const st=stockStatus(item.quantity,item.min_stock);
            return(
              <div key={item.id} className="grid grid-cols-5 items-center px-5 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/80 transition-colors">
                <div className="col-span-2"><p className="text-sm font-semibold text-slate-700">{item.name}</p>{item.notes&&<p className="text-xs text-slate-400 mt-0.5">{item.notes}</p>}</div>
                <span className="text-sm text-slate-500">{item.category}</span>
                <span className="text-sm font-semibold text-slate-700">{item.quantity} <span className="font-normal text-slate-400">{item.unit}</span></span>
                <div className="flex items-center justify-between">
                  <span className={st.cls}>{st.label}</span>
                  <div className="flex gap-0.5">
                    <button onClick={()=>openEdit(item)} className="icon-btn"><Edit2 size={14}/></button>
                    <button onClick={()=>setConfirmDel(item.id)} className="icon-btn-danger"><Trash2 size={14}/></button>
                  </div>
                </div>
              </div>
            );
          })
        }
      </div>

      {modal&&(
        <Modal title={editing?'Editar Artículo':'Nuevo Artículo'} onClose={()=>setModal(false)}>
          <div className="p-6 space-y-4">
            <div><label className="label">Nombre *</label><input value={form.name} onChange={tf('name')} placeholder="Nombre del artículo" className="input-field"/></div>
            <div><label className="label">Categoría</label><Select value={form.category} onChange={v=>sf('category',v)} placeholder="Seleccionar..." options={CATEGORIES}/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Cantidad actual</label><input type="number" min="0" value={form.quantity} onChange={tf('quantity')} className="input-field"/></div>
              <div><label className="label">Unidad</label><Select value={form.unit} onChange={v=>sf('unit',v)} options={UNITS}/></div>
            </div>
            <div><label className="label">Stock mínimo</label><input type="number" min="0" value={form.min_stock} onChange={tf('min_stock')} className="input-field"/><p className="text-xs text-slate-400 mt-1">Se mostrará una alerta cuando el stock llegue a este nivel</p></div>
            <div><label className="label">Notas</label><textarea value={form.notes} onChange={tf('notes')} placeholder="Observaciones..." rows={2} className="input-field resize-none"/></div>
          </div>
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
            <button onClick={()=>setModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={save} className="btn-primary">{editing?'Guardar cambios':'Agregar artículo'}</button>
          </div>
        </Modal>
      )}

      {confirmDel&&<ConfirmModal message="¿Eliminar este artículo del inventario? Esta acción no se puede deshacer." onConfirm={confirmDelete} onCancel={()=>setConfirmDel(null)}/>}
    </div>
  );
}