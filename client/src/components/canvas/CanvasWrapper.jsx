import { Tldraw } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'

export default function CanvasWrapper({ store, onEditorReady }) {
  return (
    <Tldraw
      store={store}
      onMount={(editor) => {
        onEditorReady?.(editor)
      }}
    />
  )
}
