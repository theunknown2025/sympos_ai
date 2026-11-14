import type { PosterElementKind, PosterLayerRef } from './types';

export function layerKey(ref: PosterLayerRef) {
  return `${ref.kind}:${ref.id}`;
}

export function bringLayerToFront(order: PosterLayerRef[], ref: PosterLayerRef) {
  const key = layerKey(ref);
  const filtered = order.filter((item) => layerKey(item) !== key);
  return [...filtered, ref];
}

export function removeLayer(order: PosterLayerRef[], kind: PosterElementKind, id: string) {
  const key = `${kind}:${id}`;
  return order.filter((item) => layerKey(item) !== key);
}

export function layerZIndex(order: PosterLayerRef[], kind: PosterElementKind, id: string) {
  const index = order.findIndex((item) => item.kind === kind && item.id === id);
  return 10 + (index >= 0 ? index : 0);
}
