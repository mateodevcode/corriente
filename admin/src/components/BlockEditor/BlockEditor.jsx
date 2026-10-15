import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { nuevoBloque } from '../../lib/blocks'
import ParrafoBlock from './blocks/ParrafoBlock'
import EncabezadoBlock from './blocks/EncabezadoBlock'
import ImagenBlock from './blocks/ImagenBlock'
import PasoBlock from './blocks/PasoBlock'
import CitaBlock from './blocks/CitaBlock'
import ListaBlock from './blocks/ListaBlock'
import BotonBlock from './blocks/BotonBlock'
import GaleriaBlock from './blocks/GaleriaBlock'
import TablaBlock from './blocks/TablaBlock'

const TIPOS = [
  { tipo:'parrafo', label:'Párrafo', icon:'¶' },
  { tipo:'encabezado', label:'Encabezado', icon:'H' },
  { tipo:'imagen', label:'Imagen', icon:'🖼' },
  { tipo:'galeria', label:'Galería', icon:'▦' },
  { tipo:'paso', label:'Paso', icon:'👣' },
  { tipo:'cita', label:'Cita', icon:'❝' },
  { tipo:'lista', label:'Lista', icon:'☰' },
  { tipo:'tabla', label:'Tabla', icon:'▥' },
  { tipo:'boton', label:'Botón', icon:'▣' },
  { tipo:'separador', label:'Separador', icon:'―' },
]

function SortableItem({ block, index, total, onDuplicate, onDelete, onMove, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }
  return (
    <div ref={setNodeRef} style={style} className={`group relative rounded border ${isDragging ? 'border-primary shadow-lg' : 'border-transparent hover:border-border'} bg-card/50 p-1`}>
      <div className="mb-1 flex items-center gap-1">
        <button type="button" {...attributes} {...listeners} title="Arrastra para reordenar"
          className="cursor-grab rounded border border-border bg-muted px-2 py-0.5 text-xs hover:bg-primary hover:text-white active:cursor-grabbing">⋮⋮ arrastra</button>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">#{index + 1} · {block.tipo}</span>
        <span className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button type="button" disabled={index===0} onClick={()=>onMove(index,-1)} title="Subir" className="border border-border bg-card px-1.5 text-xs disabled:opacity-30">↑</button>
          <button type="button" disabled={index===total-1} onClick={()=>onMove(index,1)} title="Bajar" className="border border-border bg-card px-1.5 text-xs disabled:opacity-30">↓</button>
          <button type="button" onClick={onDuplicate} title="Duplicar" className="border border-border bg-card px-1.5 text-xs">⧉</button>
          <button type="button" onClick={onDelete} title="Eliminar" className="border border-primary bg-card px-1.5 text-xs text-primary">✕</button>
        </span>
      </div>
      <div>{children}</div>
    </div>
  )
}

export default function BlockEditor({ bloques, onChange, tituloSlug }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint:{ distance:8 } }))
  const handleDragEnd = (e) => {
    const { active, over } = e
    if (over && active.id !== over.id) {
      const oldIndex = bloques.findIndex(b=>b.id===active.id)
      const newIndex = bloques.findIndex(b=>b.id===over.id)
      onChange(arrayMove(bloques, oldIndex, newIndex))
    }
  }
  const update = (id, nb) => onChange(bloques.map(b=> b.id===id ? nb : b))
  const add = (tipo) => onChange([...bloques, nuevoBloque(tipo)])
  const duplicate = (id) => {
    const b = bloques.find(x=>x.id===id)
    if (!b) return
    const nb = { ...b, id: `b_${Math.random().toString(36).slice(2,9)}` }
    const idx = bloques.findIndex(x=>x.id===id)
    const arr=[...bloques]; arr.splice(idx+1,0,nb); onChange(arr)
  }
  const remove = (id) => {
    if (bloques.length===1) return
    onChange(bloques.filter(b=>b.id!==id))
  }
  const move = (idx, dir) => {
    const j = idx + dir
    if (j < 0 || j >= bloques.length) return
    onChange(arrayMove(bloques, idx, j))
  }

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={bloques.map(b=>b.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {bloques.map((b, idx) => (
              <SortableItem key={b.id} block={b} index={idx} total={bloques.length} onDuplicate={()=>duplicate(b.id)} onDelete={()=>remove(b.id)} onMove={move}>
                {b.tipo==='parrafo' && <ParrafoBlock block={b} onChange={nb=>update(b.id,nb)} />}
                {b.tipo==='encabezado' && <EncabezadoBlock block={b} onChange={nb=>update(b.id,nb)} />}
                {b.tipo==='imagen' && <ImagenBlock block={b} onChange={nb=>update(b.id,nb)} tituloSlug={tituloSlug} />}
                {b.tipo==='paso' && <PasoBlock block={b} onChange={nb=>update(b.id,nb)} tituloSlug={tituloSlug} index={idx} />}
                {b.tipo==='cita' && <CitaBlock block={b} onChange={nb=>update(b.id,nb)} />}
                {b.tipo==='lista' && <ListaBlock block={b} onChange={nb=>update(b.id,nb)} />}
                {b.tipo==='boton' && <BotonBlock block={b} onChange={nb=>update(b.id,nb)} />}
                {b.tipo==='galeria' && <GaleriaBlock block={b} onChange={nb=>update(b.id,nb)} tituloSlug={tituloSlug} />}
                {b.tipo==='tabla' && <TablaBlock block={b} onChange={nb=>update(b.id,nb)} />}
                {b.tipo==='separador' && <div className="border-t-2 border-border py-2 text-center text-xs text-muted-foreground">— separador —</div>}
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="mt-4 rounded border border-dashed border-border p-3">
        <p className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Añadir bloque</p>
        <div className="flex flex-wrap gap-2">
        {TIPOS.map(t => (
          <button key={t.tipo} type="button" onClick={()=>add(t.tipo)}
            className="border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:border-primary hover:bg-muted">
            {t.icon} + {t.label}
          </button>
        ))}
        </div>
      </div>
      <p className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">Arrastra ⋮⋮ o usa ↑↓ para reordenar · duplica ⧉ · elimina ✕</p>
    </div>
  )
}
