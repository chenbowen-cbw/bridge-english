export const FOOTPRINTS_CHANGED = 'bridge:footprints-changed'

export function notifyFootprintsChanged() {
  window.dispatchEvent(new Event(FOOTPRINTS_CHANGED))
}
