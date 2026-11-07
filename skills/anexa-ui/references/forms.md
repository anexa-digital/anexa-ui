# Forms, dialogs and confirmations

## Where a form opens

| Record | Opens in | URL |
| --- | --- | --- |
| A simple record (customer, catalog entry, tariff, rate, member, plant, task type, API key…) | `Drawer` beside its grid | `?edit=<id>`, `?new=1` |
| A short creation that then needs its own screen (quotation, product) | `Drawer` with the few fields of the header; on save, navigate to the detail | `?new=1` |
| A complex record (quotation, request, product detail) | its own route | `/x/$id`, `/x/new` |
| One to three fields that qualify an action (a reason, a date, a copy name) | `Dialog` (or `useConfirm` with `reason`) | — |
| A confirmation | `useConfirm` | — |

Inline editing in a table row and forms that are always open above or below a list are not patterns of the kit.

## The form

```tsx
const form = useAppForm({
  defaultValues: { customer_id: "", quantity: "", valid_from: todayIso(), notes: "" },
  onSubmit: async ({ value }) => {
    try {
      const saved = await save.mutateAsync(value);
      toast({ tone: "ok", title: t("ui.savedName", { name: saved.code }) });
      onClose();
    } catch (error) {
      submitError(form, error);
    }
  },
});
const close = useDirtyGuard(form, onClose);
return (
  <Form form={form} onCancel={() => void close()} className="flex flex-col gap-3">
    <form.AppField name="customer_id" validators={{ onSubmit: required }} children={(f) => <f.RecordField label={t("quotations.customer")} required noun="cliente" search={findCustomers} resolve={getCustomer} recordLink={(c) => ({ to: "/customers", search: { edit: c.id } })} onCreate={createCustomerInline} more={{ title: t("customers.search"), columns: CUSTOMER_COLUMNS }} />} />
    <div className="grid grid-cols-2 gap-3">
      <form.AppField name="quantity" validators={{ onSubmit: required }} children={(f) => <f.NumberField label={t("quotations.quantity")} unit="und" required />} />
      <form.AppField name="valid_from" children={(f) => <f.DateField label={t("quotations.validFrom")} min={todayIso()} />} />
    </div>
    <form.AppField name="notes" children={(f) => <f.TextareaField label={t("quotations.notes")} help={t("quotations.notesHelp")} />} />
    <form.AppForm>
      <form.FormError />
      <DrawerActions savedAt={record?.updated_at_ms}>
        <form.CancelButton onClick={() => void close()} />
        <form.SubmitButton label={record ? t("ui.saveChanges") : t("quotations.create")} />
      </DrawerActions>
    </form.AppForm>
  </Form>
);
```

- Fields: `TextField`, `TextareaField`, `NumberField` (`unit`, `decimal`), `SelectField` (few fixed options),
  `RadioField`, `CheckboxesField`, `CheckboxField`, `DateField`, `MonthField`, `RecordField` (a related record),
  `ComboField` (several values from a list), `PercentField`, `SchemaField`. A control of the app's own goes through
  `form.Field` with `field.state.value` / `field.handleChange`.
- `required` is a validator and an `aria-required`; the asterisk is drawn by CSS.
- Two columns at most (`grid grid-cols-2 gap-3`); a field spanning both takes `wide`.
- The footer order never changes: `FormError` above, then the autosave text at the left, `CancelButton` (Esc),
  `SubmitButton` (Ctrl/⌘ ⏎, primary, last). In a `Dialog`, `Form id="x"` in the body and `SubmitButton form="x"`
  in the footer.
- A mutation always answers: toast on success with the same verb as the button; `submitError` on failure.
- `useDirtyGuard` asks before closing a changed form («Descartar cambios» / «Seguir editando»).

## Buttons

`primaryClass` for the one primary action, `buttonClass` for the rest, `dangerClass` for the destructive one
(apart, at the left of the `ActionBar`), `iconButtonClass` for a square icon button with `aria-label`. Never a
hand-written class string for a button. Keys show with `KeyHint` (`kbd-on-accent` inside a primary button).

## Confirmations and undo

```tsx
const confirm = useConfirm();
const { confirmed, reason } = await confirm({ title: t("quotations.submit"), body: t("quotations.submitBody", { code }), confirmLabel: t("quotations.submitVerb"), reason: { label: t("ui.reason"), required: false } });
```

Confirm what cannot be undone or reaches others (publish, send, approve, revoke, delete a record with history).
For a cheap deletion: remove, toast `ui.deletedName` with `action: { label: t("ui.undo"), run: restore }`.
