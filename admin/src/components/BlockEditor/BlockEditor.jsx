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

const TIPOS = [
  { tipo:'parrafo', label:'Párrafo' },
  { tipo:'encabezado', label:'Encabezado' },
  { tipo:'imagen', label:'Imagen' },
  { tipo:'paso', label:'Paso (imagen+texto)' },
  { tipo:'cita', label:'Cita' },
  { tipo:'lista', label:'Lista' },
  { tipo:'separador', label:'Separador' },
]

function SortableItem({ block, children, onDuplicate, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: block.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <div ref={setNodeRef} style={style} className="group relative">
      <div className="absolute -left-1 top-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100">
        <button type="button" {...attributes} {...listeners} className="cursor-grab border border-border bg-card px-1 text-[10px]">⋮⋮</button>
        <button type="button" onClick={onDuplicate} className="border border-border bg-card px-1 text-[10px]">⧉</button>
        <button type="button" onClick={onDelete} className="border border-primary bg-card px-1 text-[10px] text-primary">✕</button>
      </div>
      <div className="ml-6">{children}</div>
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

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={bloques.map(b=>b.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {bloques.map((b, idx) => (
              <SortableItem key={b.id} block={b} onDuplicate={()=>duplicate(b.id)} onDelete={()=>remove(b.id)}>
                {b.tipo==='parrafo' && <ParrafoBlock block={b} onChange={nb=>update(b.id,nb)} />}
                {b.tipo==='encabezado' && <EncabezadoBlock block={b} onChange={nb=>update(b.id,nb)} />}
                {b.tipo==='imagen' && <ImagenBlock block={b} onChange={nb=>update(b.id,nb)} tituloSlug={tituloSlug} />}
                {b.tipo==='paso' && <PasoBlock block={b} onChange={nb=>update(b.id,nb)} tituloSlug={tituloSlug} index={idx} />}
                {b.tipo==='cita' && <CitaBlock block={b} onChange={nb=>update(b.id,nb)} />}
                {b.tipo==='lista' && <ListaBlock block={b} onChange={nb=>update(b.id,nb)} />}
                {b.tipo==='separador' && <div className="border-t-2 border-border py-2 text-center text-xs text-muted-foreground">— separador —</div>}
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="mt-4 flex flex-wrap gap-2">
        {TIPOS.map(t => (
          <button key={t.tipo} type="button" onClick={()=>add(t.tipo)}
            className="border border-border bg-card px-3 py-1.5 text-xs font-semibold uppercase tracking-widest hover:bg-muted">
            + {t.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">Arrastra ⋮⋮ para reordenar · duplica ⧉ · elimina ✕</p>
    </div>
  )
}
