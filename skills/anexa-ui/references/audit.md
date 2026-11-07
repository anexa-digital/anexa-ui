# Audit: measuring consistency

The `design-system audit` of the Design plugin, made concrete for an app on `@anexa/ui`. Run it at the start of a
UI job and at the end; the difference is the measure of the work. Record both in `docs/DISENO.md` («Medida»).

```bash
cd apps/web/src
echo "hex colors outside i18n";           grep -rnoE "#[0-9a-fA-F]{3,8}\b" --include=*.tsx --include=*.ts . | grep -v i18n/ | wc -l
echo "arbitrary sizes not from tokens";    grep -rnoE "(rounded|p|px|py|gap|text|h|w)-\[[^]]+\]" --include=*.tsx . | grep -v "var(--" | wc -l
echo "window.confirm";                     grep -rn "confirm(" --include=*.tsx . | grep -v useConfirm | wc -l
echo "tables outside the kit grids";       grep -rn "<table\|<Table\b\|tableClass" --include=*.tsx . | wc -l
echo "buttons styled by hand";             grep -rn "<button" --include=*.tsx . | grep -v "buttonClass\|primaryClass\|dangerClass\|iconButtonClass\|tabClass\|ITEM" | wc -l
echo "native date inputs";                 grep -rn 'type="date"\|type="month"' --include=*.tsx . | wc -l
echo "UTC today";                          grep -rn "toISOString().slice(0, 10)" --include=*.ts --include=*.tsx . | wc -l
echo "hardcoded locale";                   grep -rn 'toLocaleString("es-CO"\|"es-CO"' --include=*.tsx --include=*.ts . | grep -v i18n/ | wc -l
echo "title= used as tooltip";             grep -rn "title={" --include=*.tsx . | wc -l
echo "foreign keys as <select>";           grep -rn "<select" --include=*.tsx . | wc -l
echo "generic verbs under domain keys";    grep -oE '"[a-zA-Z.]+\.(cancel|delete|save|edit|remove|add|new)":' i18n/es-CO.ts | grep -v '^"ui\.' | wc -l
echo "link styles";                        grep -rno 'className="[^"]*underline[^"]*"' --include=*.tsx . | sed 's/.*className=//' | sort | uniq -c | sort -rn
echo "→ glued to text";                    grep -rn "→" --include=*.tsx . | grep -v "i18n/" | wc -l
```

Component completeness (the kit): each component has hover, focus-visible, disabled, loading, error and empty
states where they apply; check the playground page «Patrones» shows all of them.

Targets at the end of a job: hex 0 (except the login scene), arbitrary sizes 0, `window.confirm` 0, tables outside
the grids 0 (documents and the 3D viewer excepted), hand-styled buttons 0, native date inputs 0 (the kit's
`DateInput` renders one on phones), UTC today 0, hardcoded locale 0, generic verbs under domain keys 0, one link
style, no `→`.
