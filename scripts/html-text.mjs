import { decodeHTML } from 'entities';

/** The text a browser shows for Spotify's HTML-ish names and descriptions: tags dropped, entities decoded. */
export function htmlToText(html) {
  return decodeHTML(html.replace(/<\/?[a-z][^>]*>/gi, ''));
}
