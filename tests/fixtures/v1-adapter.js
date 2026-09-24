// Verified against Desktop Beta 2.0.13-beta.1 / ui-chat 0.1.6-alpha.2.
// These structural classes are discovered from the host's OWN CSS module tags,
// never from arbitrary "*_body" descendants or user-authored content.
export const ASSISTANT = '[data-chat-flow-kind="assistant-step"]';
const findClass = (css, local) => css.match(new RegExp('\\.([A-Za-z_][A-Za-z0-9_-]*_' + local + ')(?=[^A-Za-z0-9_-]|$)'))?.[1];
export function discoverAdapter(doc) {
  const tag = doc.querySelector('style[data-plugin-css="@deepseek-ai/dsh-client-ui-chat/AssistantMarkdown.module.css"]');
  if (!tag) return null;
  const body = findClass(tag.textContent, 'body');
  const root = findClass(tag.textContent, 'root');
  if (!body || !root) return null;
  return { body, root, revision: 'dsh-ui-chat-0.1.6-alpha.2' };
}
export function proseInRow(row, adapter) {
  if (!adapter || !row.matches(ASSISTANT)) return [];
  // AssistantMarkdown renders prose as direct DIV children; reasoning has its
  // own wrapper. Require the Markdown CSS class token and reject compact views.
  return [...row.querySelectorAll('.' + adapter.root + ' > .' + adapter.body + ' > div')]
    .filter(el => [...el.classList].some(x => /^[A-Za-z_][A-Za-z0-9_-]*_markdown$/.test(x))
      && !el.hasAttribute('data-markdown-variant')
      && el.closest('[data-chat-flow-kind]') === row);
}
