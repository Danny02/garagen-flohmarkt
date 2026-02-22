import { CAT_ICONS } from "./constants.js";

export function getCatIcon(cat) {
  return CAT_ICONS[cat] || "?";
}
