import { Tldraw } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'

export default function CanvasWrapper({ store, onEditorReady }) {
  return (
    <div style={{ position: 'absolute', inset: 0, touchAction: 'none' }}>
      <Tldraw
        store={store}
        onMount={(editor) => {
          onEditorReady?.(editor)
        }}
      />
    </div>
  )
}
