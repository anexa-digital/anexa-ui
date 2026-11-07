# Writing in the interface (Spanish, Colombia)

Words are design content: they exist to make the screen easier to understand and use. Distilled from
`frontend-design` and the `ux-copy` skill of the Design plugin, in the kit's voice (es-CO, «tú», sentence case).

## Rules

- **Active voice, the verb says what happens.** «Guardar cambios», «Enviar a aprobación», «Crear borrador»,
  «Publicar revisión». Never «Aceptar», «OK», «Enviar» alone when something more specific is true, never «Submit».
- **The same name through the whole flow.** Button «Publicar» → confirmation title «Publicar revisión» →
  toast «Revisión publicada». A button «Eliminar» never ends in a toast «Borrado».
- **The user's words, not the system's.** «Modelo de costos» (not «ambiente»), «Empresa» (not «tenant»),
  «Quien aprueba» (not «approver role»), «Cliente», «Solicitud».
- **Sentence case**, no title case, no uppercase text (the skin decides the caption case through CSS).
- **No filler**: no «Por favor», no «¡Listo!», no exclamation marks, no apologies («Lo sentimos»).
- **Each text does one job.** A label names, a help explains the consequence («Las ve el cliente en el
  documento»), an error says what happened and how to fix it.

## Patterns

| Element | Pattern | Example |
| --- | --- | --- |
| Primary button | verb + object | «Nueva cotización», «Guardar cambios» |
| Destructive button | the verb, red, apart | «Eliminar», «Revocar acceso» |
| Confirmation | title = the action; body = what happens and to whom; buttons = Cancelar / the verb | «Enviar a aprobación» / «COT-1040 pasa a quien aprueba en Comercial. Tú no podrás aprobarla: la firma la pone otra persona.» / Cancelar · Enviar |
| Error | what happened + why + how to continue; the interface's voice, no apology | «El margen no puede ser menor que 8 %.» · «El registro cambió mientras lo editabas. Recarga e intenta de nuevo.» |
| Empty state | what this is + why it is empty + how to start, with an action | «Aún no hay cotizaciones. Crea la primera con «Nueva cotización» o la tecla N.» |
| Success toast | past participle of the verb + the record | «Se guardó COT-1040», «Revisión publicada» |
| Undo toast | what left + «Deshacer» | «Se eliminó TAR-12 · Deshacer» |
| Help | the consequence or the rule, one sentence | «Las ve el cliente en el documento.» |
| Placeholder | the format or an example, never the label repeated | «YYYY-MM-DD», «Busca un cliente…» |
| Keys | the key after the label («Nueva cotización N»); Terminal puts it before | — |

## Reviewing a catalog (`es-CO.ts`)

For each text give: the recommended text, one alternative, a note of tone. Flag: generic verbs reused across
domains («pricing.cancel» used by members), duplicates of the same verb under several keys, vague errors
(«Error», «No se pudo»), empty states without an action, titles that are nouns where a verb is expected, English
leaking («Submit», «OK»), and any ` · `, `→` or uppercase baked into the text.
