import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, RouterProvider, createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";

import { Histogram, StackedLights } from "../src/charts";
import {
  ActionBar,
  AppShell,
  Badge,
  Drawer,
  DrawerActions,
  Light,
  Menu,
  PageHeader,
  ThemedFrame,
  RecordLink,
  Tooltip,
  formatDate,
  formatMoney,
  formatNumber,
  rowActionItems,
  useBreadcrumb,
  useConfirm,
  useDirtyGuard,
  Chip,
  ComboBox,
  DataGrid,
  Dialog,
  EmptyState,
  Field,
  Form,
  Help,
  KeyHint,
  KpiCard,
  Panel,
  PercentInput,
  ProgressBar,
  Skeleton,
  SplitPane,
  Stat,
  StatusBar,
  Stepper,
  Table,
  Toolbar,
  applyStoredTheme,
  buttonClass,
  cellClass,
  dangerClass,
  extendMessages,
  inputClass,
  primaryClass,
  submitError,
  t,
  tabBarClass,
  tabClass,
  useAppForm,
  useShortcut,
  useToast,
  type GridColumn,
  type NavSection,
} from "../src/index";
import { ApiError } from "../src/lib/api";
import "./index.css";

// The playground: every component of the kit on a few screens, under the shell, so a skin, mode, density or layout
// chosen in the theme menu shows itself on everything at once. Texts are the kit's plus a handful registered here.

extendMessages("es-CO", {
  "app.name": "Anexa UI",
  "pg.home": "Inicio",
  "pg.sales": "Comercial",
  "pg.quotations": "Cotizaciones",
  "pg.requests": "Solicitudes",
  "pg.messages": "Mensajes",
  "pg.product": "Producto",
  "pg.products": "Productos",
  "pg.catalog": "Catálogo",
  "pg.costs": "Costos y precios",
  "pg.models": "Modelos de costos",
  "pg.simulations": "Simulaciones",
  "pg.admin": "Administración",
  "pg.members": "Miembros",
  "pg.settings": "Configuración",
  "pg.form": "Formulario",
  "pg.panels": "Paneles",
  "pg.patterns": "Patrones",
  "pg.frame": "Marco",
});

applyStoredTheme();

type Quotation = { code: string; customer: string; product: string; quantity: number; price: string; index: string; light: "green" | "yellow" | "red"; status: string; date: string };

const LIGHT_TONE = { green: "ok", yellow: "warn", red: "bad" } as const;
const STATUS_TONE: Record<string, "ok" | "warn" | "bad" | "quiet" | "neutral"> = { Aprobada: "ok", "En aprobación": "warn", Rechazada: "bad", Borrador: "quiet", Enviada: "neutral" };

const customers = ["Cartones del Norte", "Alimentos La Cosecha", "Vidriería Andina", "Lácteos del Valle", "Ferretería Central", "Textiles Sur", "Flores de Exportación", "Químicos Boreal"];
const products = ["Caja RSC 400×300×250", "Bandeja 600×400×120", "Caja RSC 350×350×350", "Separador 580×380", "Caja troquelada 300×200×150", "Caja RSC 600×400×400", "Caja 1000×400×150", "Caja RSC 500×300×300"];
const statuses = ["Aprobada", "En aprobación", "Borrador", "Aprobada", "Enviada", "En aprobación", "Aprobada", "Rechazada"];
const ROWS: Quotation[] = Array.from({ length: 160 }, (_, i) => {
  const index = (0.9 + ((i * 37) % 40) / 100).toFixed(2);
  const light = Number(index) >= 1.1 ? "green" : Number(index) >= 1 ? "yellow" : "red";
  return {
    code: `COT-${1200 - i}`,
    customer: customers[i % customers.length]!,
    product: products[(i * 3) % products.length]!,
    quantity: 1000 + ((i * 731) % 19) * 1000,
    price: String(400 + ((i * 97) % 31) * 100),
    index,
    light,
    status: statuses[(i * 5) % statuses.length]!,
    date: `${String(1 + (i % 28)).padStart(2, "0")} nov`,
  };
});

const COLUMNS: GridColumn<Quotation>[] = [
  { id: "code", header: "Código", accessorKey: "code", size: 110, cell: (c) => <span className="num text-[var(--accent)]">{c.getValue<string>()}</span> },
  { id: "customer", header: "Cliente", accessorKey: "customer", size: 200 },
  { id: "product", header: "Producto", accessorKey: "product", size: 220 },
  { id: "quantity", header: "Cantidad", accessorKey: "quantity", size: 100, meta: { align: "right" }, cell: (c) => c.getValue<number>().toLocaleString("es-CO") },
  { id: "price", header: "Precio", accessorKey: "price", size: 100, meta: { align: "right" }, cell: (c) => `$ ${Number(c.getValue<string>()).toLocaleString("es-CO")}` },
  { id: "index", header: "Índice", accessorKey: "index", size: 80, meta: { align: "right" } },
  { id: "light", header: "Semáforo", accessorKey: "light", size: 110, cell: (c) => <Badge tone={LIGHT_TONE[c.getValue<Quotation["light"]>()]}>{t(`charts.light.${c.getValue<string>()}`)}</Badge> },
  { id: "status", header: "Estado", accessorKey: "status", size: 130, cell: (c) => <Badge tone={STATUS_TONE[c.getValue<string>()] ?? "neutral"}>{c.getValue<string>()}</Badge> },
  { id: "date", header: "Fecha", accessorKey: "date", size: 80 },
];

const sections: NavSection[] = [
  {
    id: "sales",
    label: t("pg.sales"),
    icon: "quotes",
    paths: ["/quotations", "/requests", "/messages"],
    count: 3,
    items: [
      { label: t("pg.quotations"), to: "/quotations", icon: "quotes", keys: "g q" },
      { label: t("pg.requests"), to: "/requests", icon: "tasks", count: 3, keys: "g s" },
      { label: t("pg.messages"), to: "/messages", icon: "messages" },
    ],
  },
  { id: "product", label: t("pg.product"), icon: "box", paths: ["/products", "/catalog"], items: [{ label: t("pg.products"), to: "/products", icon: "box" }, { label: t("pg.catalog"), to: "/catalog", icon: "list" }] },
  { id: "costs", label: t("pg.costs"), icon: "chart", paths: ["/models", "/form"], items: [{ label: t("pg.models"), to: "/models", icon: "model" }, { label: t("pg.form"), to: "/form", icon: "draft", keys: "g f" }] },
  { id: "admin", label: t("pg.admin"), icon: "settings", paths: ["/panels", "/members", "/patterns", "/frame"], items: [{ label: t("pg.panels"), to: "/panels", icon: "grid" }, { label: t("pg.members"), to: "/members", icon: "users" }, { label: t("pg.patterns"), to: "/patterns", icon: "draft", keys: "g t" }, { label: t("pg.frame"), to: "/frame", icon: "folder" }] },
];

const CUSTOMERS = customers.map((name, index) => ({ id: String(index + 1), code: `CLI-${100 + index}`, label: name, hint: index % 2 ? "30 días" : "Contado" }));
const searchCustomers = async (text: string) => CUSTOMERS.filter((item) => `${item.code} ${item.label}`.toLowerCase().includes(text.toLowerCase()));

/** The list + side panel composition of the design: the grid stays, the record opens at the right. */
function PatternsPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<Quotation | null>(null);
  const [creating, setCreating] = useState(false);
  const [rows, setRows] = useState(ROWS.slice(0, 40));
  useBreadcrumb(editing ? { label: editing.code, siblings: rows.slice(0, 5).map((row) => ({ label: row.code, to: "/patterns" })) } : null);
  useShortcut("n", () => setCreating(true), { description: t("shortcuts.listNew"), group: "list" });
  const remove = (row: Quotation) => {
    setRows((all) => all.filter((item) => item.code !== row.code));
    toast({ tone: "info", title: t("ui.deletedName", { name: row.code }), action: { label: t("ui.undo"), run: () => setRows((all) => [row, ...all]) } });
  };
  const columns: GridColumn<Quotation>[] = [
    { id: "code", header: "Código", accessorKey: "code", size: 110, meta: { code: true }, cell: (c) => <RecordLink to="/patterns" code={c.getValue<string>()} /> },
    ...COLUMNS.slice(1, 3),
    { id: "quantity", header: "Cantidad", accessorKey: "quantity", size: 100, meta: { align: "right" }, cell: (c) => formatNumber(c.getValue<number>()) },
    { id: "price", header: "Precio", accessorKey: "price", size: 110, meta: { align: "right" }, cell: (c) => formatMoney(c.getValue<string>()) },
    { id: "light", header: "Semáforo", accessorKey: "light", size: 110, cell: (c) => <Light tone={LIGHT_TONE[c.getValue<Quotation["light"]>()]}>{t(`charts.light.${c.getValue<string>()}`)}</Light> },
    { id: "status", header: "Estado", accessorKey: "status", size: 130, cell: (c) => <Badge dot tone={STATUS_TONE[c.getValue<string>()] ?? "neutral"}>{c.getValue<string>()}</Badge> },
    { id: "date", header: "Fecha", size: 110, accessorFn: (row) => row.date, cell: () => formatDate("2026-11-05") },
  ];
  return (
    <div className="flex h-full flex-col gap-3">
      <PageHeader
        title={t("pg.patterns")}
        subtitle={`${rows.length} este mes · 7 esperan aprobación`}
        actions={
          <ActionBar>
            <Tooltip text="Importa cotizaciones desde un archivo de Excel.">
              <button type="button" className={buttonClass}>
                Importar
              </button>
            </Tooltip>
            <Menu label="Más acciones" items={[{ id: "a", label: "Exportar todo", icon: "download", run: () => undefined }, { id: "b", label: "Archivar aprobadas", icon: "folder", separator: true, danger: true, run: () => undefined }]}>
              {t("ui.more")}
            </Menu>
            <button type="button" onClick={() => setCreating(true)} className={`${primaryClass} flex items-center gap-1.5`}>
              Nueva cotización <KeyHint keys="n" className="kbd-on-accent" />
            </button>
          </ActionBar>
        }
      />
      <div className="flex min-h-0 flex-1 gap-[var(--gap)]">
        <DataGrid
          grid="pg-patterns"
          rows={rows}
          columns={columns}
          getRowId={(row) => row.code}
          empty={{ title: "Aún no hay cotizaciones", body: "Crea la primera desde «Nueva cotización» o con la tecla N.", action: <button type="button" onClick={() => setCreating(true)} className={primaryClass}>Nueva cotización</button> }}
          search
          pageSize={25}
          fill
          createKeys
          onOpen={(row) => setEditing(row)}
          isActive={(row) => editing?.code === row.code}
          rowActions={(row) =>
            rowActionItems({
              onOpen: () => setEditing(row),
              onEdit: () => setEditing(row),
              onDuplicate: () => toast({ tone: "ok", title: `Se duplicó ${row.code}` }),
              onDelete: () => remove(row),
              extra: [{ id: "send", label: "Enviar a aprobación", icon: "send", run: () => void confirm({ title: "Enviar a aprobación", body: `${row.code} pasa a quien aprueba en Comercial. Tú no podrás aprobarla: la firma la pone otra persona.`, confirmLabel: "Enviar" }).then(({ confirmed }) => confirmed && toast({ tone: "ok", title: `Enviada ${row.code}` })) }],
            })
          }
        />
        <Drawer id="pg-quotation" open={Boolean(editing) || creating} title={editing ? `${editing.code} · ${editing.customer}` : "Nueva cotización"} subtitle={editing ? "rev 3" : undefined} onClose={() => (setEditing(null), setCreating(false))}>
          <QuotationForm key={editing?.code ?? "new"} quotation={editing} onClose={() => (setEditing(null), setCreating(false))} />
        </Drawer>
      </div>
    </div>
  );
}

function QuotationForm({ quotation, onClose }: { quotation: Quotation | null; onClose: () => void }) {
  const toast = useToast();
  const form = useAppForm({
    defaultValues: { customer: quotation ? "2" : "", quantity: quotation ? String(quotation.quantity) : "", term: "30", margin: "12", currency: "COP", validUntil: "", notes: "" },
    onSubmit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      toast({ tone: "ok", title: quotation ? `Se guardó ${quotation.code}` : "Cotización creada" });
      onClose();
    },
  });
  const close = useDirtyGuard(form, onClose);
  return (
    <Form form={form} onCancel={() => void close()} className="flex flex-col gap-3">
      <form.AppField name="customer" children={(f) => <f.RecordField label="Cliente" required noun="cliente" search={searchCustomers} initial={CUSTOMERS[1]} recordLink={() => ({ to: "/patterns" })} onCreate={async (text) => ({ id: "new", code: "CLI-NEW", label: text })} more={{ title: "Buscar cliente", columns: [{ id: "code", header: "Código", accessorKey: "code", size: 110, meta: { code: true } }, { id: "label", header: "Nombre", accessorKey: "label", size: 260 }, { id: "hint", header: "Plazo", accessorKey: "hint", size: 110 }] }} />} />
      <div className="grid grid-cols-2 gap-3">
        <form.AppField name="quantity" children={(f) => <f.NumberField label="Cantidad" unit="und" required />} />
        <form.AppField name="term" children={(f) => <f.SelectField label="Plazo de pago" options={[{ value: "0", label: "Contado" }, { value: "30", label: "30 días" }, { value: "60", label: "60 días" }]} />} />
        <form.AppField name="margin" validators={{ onChange: ({ value }) => (Number(value) < 8 ? "El margen no puede ser menor que 8 %." : undefined) }} children={(f) => <f.NumberField label="Margen" unit="%" required />} />
        <form.AppField name="currency" children={(f) => <f.SelectField label="Moneda" options={[{ value: "COP", label: "COP" }, { value: "USD", label: "USD" }]} />} />
        <form.AppField name="validUntil" children={(f) => <f.DateField label="Válida hasta" />} />
      </div>
      <form.AppField name="notes" children={(f) => <f.TextareaField label="Observaciones" help="Las ve el cliente en el documento." rows={3} />} />
      <form.AppForm>
        <form.FormError />
        <DrawerActions savedAt={quotation ? Date.now() - 120_000 : null}>
          <form.CancelButton onClick={() => void close()} />
          <form.SubmitButton label={quotation ? "Guardar cambios" : "Crear cotización"} />
        </DrawerActions>
      </form.AppForm>
    </Form>
  );
}

const health = {
  liveness: async () => ({ status: "ok", service: "playground", version: "0.4.0", commit: "design/v0.4", environment: "dev" }),
  readiness: async () => ({ status: "ok", database: "ok" as const, schema_revision: "0026" }),
};

function HomePage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">{t("pg.quotations")}</h1>
      <div className="grid gap-3 md:grid-cols-4">
        <KpiCard label="Cotizaciones del mes" value="128" detail="+12 % frente a octubre" icon="quotes" tone="attention" to="/quotations" />
        <KpiCard label="Índice promedio" value="1,12" detail="meta 1,10" icon="index" to="/quotations" />
        <KpiCard label="Esperan aprobación" value="7" detail="2 vencen hoy" icon="approval" tone="risk" to="/requests" />
        <KpiCard label="Semáforo en verde" value="82 %" detail="+4 puntos" icon="running" to="/quotations" />
      </div>
      <div className="flex flex-wrap gap-3">
        <Stat label="Precio promedio" value="2310.5" before="2250" delta="60.5" tone="up-bad" digits={1} suffix="COP" />
        <Stat label="Índice" value="1.12" before="1.10" beforeLabel="target" delta="0.02" tone="up-good" />
        <Stat label="Opciones" value="2800" digits={0} hint="Línea base «Hoy»" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Panel title="Semáforo de las opciones">
          <StackedLights base={{ red: 200, yellow: 420, green: 2180 }} run={{ red: 160, yellow: 340, green: 2300 }} />
        </Panel>
        <Panel title="Índice, últimos 30 días">
          <Histogram buckets={[-3, -2, -1, 0, 1, 2, 3, 4].map((change) => ({ change: String(change), options: [12, 40, 160, 520, 900, 620, 300, 90][change + 3]! }))} />
        </Panel>
      </div>
    </div>
  );
}

function GridPage({ title }: { title: string }) {
  const [tab, setTab] = useState<"all" | "mine">("all");
  const toast = useToast();
  const [open, setOpen] = useState<Quotation | null>(null);
  useShortcut("n", () => toast({ tone: "info", title: "Nueva cotización", body: "Aquí abriría el formulario." }), { description: "Nueva cotización", group: "actions" });
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">{title}</h1>
        <span className="text-[var(--muted)]">128 este mes · 7 esperan aprobación</span>
        <div className="ml-auto flex gap-2">
          <button type="button" className={buttonClass}>
            Importar
          </button>
          <button type="button" onClick={() => toast({ tone: "ok", title: "Terminó «Hoy»", body: "Línea base · 2.800 cotizaciones", action: { label: "Ver resultados", run: () => undefined } })} className={`${primaryClass} flex items-center`}>
            Nueva cotización
            <KeyHint keys="n" />
          </button>
        </div>
      </div>
      <div className={tabBarClass}>
        <button type="button" onClick={() => setTab("all")} className={tabClass(tab === "all")}>
          Todas
        </button>
        <button type="button" onClick={() => setTab("mine")} className={tabClass(tab === "mine")}>
          Mías
        </button>
      </div>
      <DataGrid
        grid="playground-quotations"
        rows={tab === "all" ? ROWS : ROWS.slice(0, 12)}
        columns={COLUMNS}
        getRowId={(row) => row.code}
        empty="Sin cotizaciones"
        search
        pageSize={50}
        exportName="cotizaciones"
        onOpen={setOpen}
        maxHeight="60vh"
        toolbar={
          <>
            <Chip onRemove={() => undefined}>Estado: En aprobación, Aprobada</Chip>
            <Chip>Semáforo: todos</Chip>
          </>
        }
      />
      <Dialog open={open !== null} title={open ? `${open.code} · ${open.customer}` : ""} onClose={() => setOpen(null)} footer={<button type="button" onClick={() => setOpen(null)} className={primaryClass}>Cerrar</button>}>
        {open && (
          <Table head={["Campo", "Valor"]}>
            <tr>
              <td className={cellClass}>Producto</td>
              <td className={cellClass}>{open.product}</td>
            </tr>
            <tr>
              <td className={cellClass}>Cantidad</td>
              <td className={`${cellClass} num`}>{open.quantity.toLocaleString("es-CO")}</td>
            </tr>
            <tr>
              <td className={cellClass}>Índice</td>
              <td className={`${cellClass} num`}>{open.index}</td>
            </tr>
          </Table>
        )}
      </Dialog>
    </div>
  );
}

function FormPage() {
  const toast = useToast();
  const form = useAppForm({
    defaultValues: { customer: "Alimentos La Cosecha S.A.S.", quantity: "4500", term: "30", margin: "7.5", currency: "COP", notes: "Entrega parcial la primera semana.", urgent: false, tags: [] as string[] },
    onSubmit: async ({ value }) => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      if (Number(value.margin) < 8) {
        submitError(form, new ApiError(422, "margin_too_low", { field: "margin" }));
        return;
      }
      if (value.customer.toLowerCase().includes("boreal")) {
        submitError(form, new ApiError(409, "stale_value"));
        return;
      }
      toast({ tone: "ok", title: "Cotización guardada", body: `${value.quantity} und · margen ${value.margin} %` });
    },
  });
  return (
    <SplitPane id="playground-form" side={<Panel title="Ayuda"><Help>El margen mínimo es 8 %. Con «Boreal» en el cliente la API responde que el registro cambió.</Help><Help>Ctrl/⌘ ⏎ guarda desde cualquier campo; Esc cancela.</Help></Panel>}>
      <Panel title="COT-1040 · Alimentos La Cosecha">
        <Form form={form} onCancel={() => form.reset()} className="grid gap-3 md:grid-cols-2">
          <form.AppField name="customer" validators={{ onChange: ({ value }) => (value.trim() ? undefined : "Obligatorio") }} children={(field) => <field.TextField label="Cliente" required wide />} />
          <form.AppField name="quantity" validators={{ onChange: ({ value }) => (Number(value) > 0 ? undefined : "Tiene que ser mayor que 0") }} children={(field) => <field.NumberField label="Cantidad" unit="und" required />} />
          <form.AppField name="term" children={(field) => <field.SelectField label="Plazo de pago" options={[{ value: "0", label: "Contado" }, { value: "30", label: "30 días" }, { value: "60", label: "60 días" }]} />} />
          <form.AppField name="margin" validators={{ onChange: ({ value }) => (Number(value) >= 0 ? undefined : "No puede ser negativo") }} children={(field) => <field.NumberField label="Margen" unit="%" required help="Mínimo 8 %" />} />
          <form.AppField name="currency" children={(field) => <field.SelectField label="Moneda" options={[{ value: "COP", label: "COP" }, { value: "USD", label: "USD" }]} />} />
          <form.AppField name="tags" children={(field) => <field.ComboField label="Etiquetas" options={[{ value: "urgente" }, { value: "exportación", hint: "zona franca" }, { value: "muestra" }]} wide />} />
          <form.AppField name="notes" children={(field) => <field.TextareaField label="Observaciones" help="Las ve el cliente en el documento." wide />} />
          <form.AppField name="urgent" children={(field) => <field.CheckboxField label="Prioridad alta" />} />
          <div className="md:col-span-2">
            <form.AppForm>
              <form.FormError />
              <form.FormActions>
                <form.CancelButton onClick={() => form.reset()} />
                <form.SubmitButton />
              </form.FormActions>
            </form.AppForm>
          </div>
        </Form>
      </Panel>
    </SplitPane>
  );
}

function PanelsPage() {
  const [step, setStep] = useState(1);
  const [percent, setPercent] = useState("10");
  const [picked, setPicked] = useState<string[]>(["Cartones del Norte"]);
  const [text, setText] = useState("");
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Panel title="Progreso y pasos">
        <Stepper steps={["Alcance", "Palancas", "Resultados"]} current={step} reached={2} onSelect={setStep} />
        <ProgressBar percent={45} label="Precios" />
        <ProgressBar percent={null} label="En cola" tone="muted" />
        <Skeleton />
      </Panel>
      <Panel title="Controles">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Texto" help="Un campo del kit">
            <input value={text} onChange={(event) => setText(event.target.value)} className={inputClass} />
          </Field>
          <PercentInput label="Ajuste" value={percent} onChange={setPercent} />
          <div className="md:col-span-2">
            <ComboBox label="Clientes" options={customers.map((value) => ({ value }))} selected={picked} onChange={setPicked} />
          </div>
        </div>
        <Toolbar
          right={
            <>
              <button type="button" className={buttonClass}>
                Secundario
              </button>
              <button type="button" className={dangerClass}>
                Borrar
              </button>
              <button type="button" className={primaryClass}>
                Principal
              </button>
            </>
          }
        >
          <Badge tone="ok">Aprobada</Badge>
          <Badge tone="warn">En aprobación</Badge>
          <Badge tone="bad">Rechazada</Badge>
          <Badge tone="info">Nueva</Badge>
          <Badge tone="neutral">Enviada</Badge>
          <Badge tone="quiet">Borrador</Badge>
        </Toolbar>
      </Panel>
      <Panel title="Vacío">
        <EmptyState title="Aún no hay simulaciones" body="Crea una línea base para empezar." action={<button type="button" className={primaryClass}>Nueva línea base</button>} />
      </Panel>
      <Panel title="Tabla">
        <Table head={["Concepto", "Valor"]}>
          {[
            ["Cartón", "1.240"],
            ["Impresión", "180"],
            ["Troquel", "95"],
          ].map(([concept, value]) => (
            <tr key={concept}>
              <td className={cellClass}>{concept}</td>
              <td className={`${cellClass} num text-right`}>{value}</td>
            </tr>
          ))}
        </Table>
      </Panel>
    </div>
  );
}

const root = createRootRoute({
  component: () => (
    <AppShell
      name={t("app.name")}
      sections={sections}
      commands={[{ id: "new-quotation", label: "Nueva cotización", keys: "n", icon: "quotes", run: () => undefined }]}
      right={
        <>
          <span className="hidden text-[var(--muted)] md:inline">
            Empresa: <span className="text-[var(--ink)]">Cartonera Demo</span>
          </span>
          <a href="#" className="hidden hover:underline md:inline">
            Ana Admin
          </a>
          <button type="button" className="h-[var(--control-h)] px-2 text-[var(--muted)]">
            {t("nav.logout")}
          </button>
        </>
      }
      footer={<StatusBar health={health} code="CARTONERA-DEMO" />}
    >
      <Outlet />
    </AppShell>
  ),
});
const routes = [
  createRoute({ getParentRoute: () => root, path: "/", component: HomePage }),
  createRoute({ getParentRoute: () => root, path: "/quotations", component: () => <GridPage title={t("pg.quotations")} /> }),
  createRoute({ getParentRoute: () => root, path: "/requests", component: () => <GridPage title={t("pg.requests")} /> }),
  createRoute({ getParentRoute: () => root, path: "/messages", component: () => <GridPage title={t("pg.messages")} /> }),
  createRoute({ getParentRoute: () => root, path: "/products", component: () => <GridPage title={t("pg.products")} /> }),
  createRoute({ getParentRoute: () => root, path: "/catalog", component: () => <GridPage title={t("pg.catalog")} /> }),
  createRoute({ getParentRoute: () => root, path: "/models", component: () => <GridPage title={t("pg.models")} /> }),
  createRoute({ getParentRoute: () => root, path: "/members", component: () => <GridPage title={t("pg.members")} /> }),
  createRoute({ getParentRoute: () => root, path: "/form", component: FormPage }),
  createRoute({ getParentRoute: () => root, path: "/panels", component: PanelsPage }),
  createRoute({ getParentRoute: () => root, path: "/patterns", component: PatternsPage }),
  createRoute({
    getParentRoute: () => root,
    path: "/frame",
    component: () => (
      <div className="flex h-full flex-col gap-3">
        <PageHeader title={t("pg.frame")} subtitle="Una página del mismo origen que sigue el skin y el modo" />
        <ThemedFrame title="Página de ejemplo" src="/frame-sample.html" className="min-h-0 w-full flex-1 rounded-[var(--radius-md)] border border-[var(--line)]" map={{ "--bg": "--paper", "--surface": "--surface", "--fg": "--ink", "--muted": "--muted", "--line": "--line", "--accent": "--accent", "--accent-soft": "--accent-soft", "--display": "--font-display", "--body": "--font-ui", "--mono": "--font-num" }} />
      </div>
    ),
  }),
];
const router = createRouter({ routeTree: root.addChildren(routes) });

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
