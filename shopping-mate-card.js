/*
 * shopping-mate-card.js — ShoppingMate Card, the shopping card bundle. One file,
 * one dashboard resource, two custom cards that share the shopping list
 * (todo.shopping_list):
 *
 *   custom:shoppingmate-list-card  — kiosk / phone shopping list built around a catalog
 *   custom:shoppingmate-calc-card  — in-store phone calculator that prices the list
 *
 * Section 1 is shoppingmate-list-card, section 2 is shoppingmate-calc-card (each section keeps its
 * own header comment). Bundled 2026-10-11 from shop-list-card.js and
 * shop-calc-card.js, which were removed. Renamed from shop-cards.js and moved into
 * its own folder 2026-10-12; the card types were renamed from shop-* to shoppingmate-* the same day.
 * Both cards have a visual editor in the Home Assistant dashboard editor (built
 * with the static getConfigForm() hook, so it needs no editor element of its own).
 */

/* =====================================================================
 * 1. shoppingmate-list-card
 * ===================================================================== */
/*
 * shoppingmate-list-card — shopping list built around a catalog. Built for the kiosk
 * Shopping page (replaces the Improved Shopping List Card there) and also works on
 * any other dashboard, including phones.
 *
 * Layout: two panes side by side (list left, catalog right). When the card is
 * narrower than 700px (a phone) it switches to one pane at a time with two tabs on
 * top: "Shopping list (n)" and "Add items". Outside the kiosk, where the kiosk
 * viewport height variable does not exist, the card sizes itself to the screen.
 *
 *  Left : the shopping list (todo.shopping_list). Tap a row to tick it off, − / +
 *         change the quantity, ✕ removes it. "Clear done" removes ticked rows.
 *         The header shows "X items on your shopping list": X is the total
 *         quantity of the unticked rows (2 cheese + 3 milk = 5 items).
 *  Right: a live filter, then the catalog (todo.shop_catalog) as one scrollable
 *         list: each category header with its items as wrapping pills underneath.
 *         Categories and the pills inside them are both sorted A–Z. The filter
 *         matches category names and item names as you type (a category match
 *         shows all of its items). Tap an item to put it on the shopping list
 *         (tap again for more). Items already on the list show their quantity.
 *         Long-press an item to edit it: rename it, change its size / type, move
 *         it to another category, or delete it from the catalog (Delete asks for a
 *         second tap).
 *  Catalog entries are written "Category: Item" or, with a size / type, "Category: Item | Size"
 *         (e.g. "Dairy: Milk | 2L", "Pantry: Coffee | Granulated"). An item with a
 *         size / type is shown and put on the shopping list as "Item: Size"
 *         (Milk: 2L, Coffee: Sachets), so each size / type is its own item. The
 *         size / type is freeform text.
 *  "+ Add New Item" (next to the filter) opens a dialog:
 *         Category (a text box, empty to start; matching existing categories are
 *         suggested as you type, and a name that does not exist yet is created;
 *         an eye button beside it, off by default, lists every category when on),
 *         Item, Size / Type (optional, freeform), Quantity, and a "keep for
 *         re-ordering" checkbox (ticked by default). Ticked: the item is saved to
 *         the catalog (new or existing category) and put on the shopping list.
 *         Unticked: it is only put on the shopping list. Quantity can go down to 0:
 *         the item is then only created in the catalog (if it is not there already)
 *         and not put on the list; at quantity 0 the checkbox is forced on and
 *         locked, since that is the only thing the dialog can do then.
 *         Tapping outside the dialog does not close it (the on-screen keyboard
 *         needs that tap on small displays); use Cancel.
 *
 * De-duplication: an item (name plus size / type) exists once in the catalog,
 * whatever its category (case-insensitive). Adding one that is already in the
 * catalog does not create a second entry (it is just put on the shopping list, or,
 * at quantity 0, the user is told where it already is); renaming/moving an item
 * onto an existing one is refused. The shopping list is de-duplicated too: adding
 * an item already on it raises its quantity.
 *
 * Key presses inside the card do not bubble out of it: the button-card that wraps
 * it on the dashboard treats Space/Enter as a tap, which stopped spaces being typed
 * on a PC keyboard.
 *
 * Shopping list rows are stored as "Name" or "Name (3)" (quantity in brackets);
 * an old "@Category@ " prefix from the previous card is ignored.
 * Styled with the kiosk tokens (--kiosk-surface, --kiosk-surface-edge,
 * --kiosk-accent, --kiosk-text-*) and falls back to HA theme colours elsewhere.
 * Config: type: custom:shoppingmate-list-card
 *   entity: todo.shopping_list
 *   catalog_entity: todo.shop_catalog
 *   title: Shopping
 * Added 2026-10-11.
 */
const EYE_OPEN = '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 4.5C7 4.5 2.7 7.6 1 12c1.7 4.4 6 7.5 11 7.5s9.3-3.1 11-7.5c-1.7-4.4-6-7.5-11-7.5zM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></svg>';
const EYE_CLOSED = '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 7c2.8 0 5 2.2 5 5 0 .6-.1 1.2-.4 1.8l2.9 2.9c1.5-1.3 2.7-2.9 3.5-4.7-1.7-4.4-6-7.5-11-7.5-1.4 0-2.7.2-4 .7l2.2 2.2C10.8 7.1 11.4 7 12 7zM2 4.3l2.3 2.3.5.5C3.1 8.4 1.7 10.1 1 12c1.7 4.4 6 7.5 11 7.5 1.5 0 3-.3 4.4-.8l.4.4 2.8 2.8 1.3-1.3L3.3 3 2 4.3zM7.5 9.8l1.5 1.5c-.1.2-.1.5-.1.7 0 1.7 1.3 3 3 3 .2 0 .5 0 .7-.1l1.5 1.5c-.7.3-1.4.5-2.2.5-2.8 0-5-2.2-5-5 0-.8.2-1.5.6-2.1zm4.3-.8l3.1 3.1v-.2c0-1.7-1.3-3-3-3h-.1z"/></svg>';
const AZ = (a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: "base", numeric: true });
// "Milk" + "2L" -> "Milk: 2L"; no size / type -> just the name.
const LABEL = (name, size) => (size ? name + ": " + size : name);
// Strip the characters the catalog format uses as separators from user text.
const SAFE = (s) => String(s || "").replace(/[|]/g, " ").replace(/\s+/g, " ").trim();
// Below this card width the phone layout (tabs, one pane at a time) is used.
const NARROW_PX = 700;

class ShopListCard extends HTMLElement {
  setConfig(config) {
    this._cfg = config || {};
    this._todo = this._cfg.entity || "todo.shopping_list";
    this._catalogEntity = this._cfg.catalog_entity || "todo.shop_catalog";
    this._title = this._cfg.title || "Shopping";
    this._list = [];
    this._catalog = [];
    this._sel = null;
    this._filter = "";
    this._tab = this._tab || "list";
    this._stampList = null;
    this._stampCat = null;
    this._dialog = null;
    if (this.shadowRoot) this._render();
  }

  connectedCallback() {
    if (!this._ro && typeof ResizeObserver !== "undefined") this._ro = new ResizeObserver(() => this._measure());
    if (this._ro) this._ro.observe(this);
    this._measure();
  }

  disconnectedCallback() {
    if (this._ro) this._ro.disconnect();
  }

  _measure() {
    const w = this.getBoundingClientRect().width;
    if (w > 0) this.classList.toggle("narrow", w < NARROW_PX);
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
      for (const t of ["keydown", "keyup", "keypress"]) this.shadowRoot.addEventListener(t, (e) => e.stopPropagation());
      this._render();
      this._measure();
    }
    const a = hass.states[this._todo];
    const b = hass.states[this._catalogEntity];
    const sa = a ? a.last_updated : null;
    const sb = b ? b.last_updated : null;
    if (sa !== this._stampList) { this._stampList = sa; this._loadList(); }
    if (sb !== this._stampCat) { this._stampCat = sb; this._loadCatalog(); }
  }

  getCardSize() { return 8; }

  // Visual editor in the dashboard editor (Home Assistant builds the form from this).
  static getConfigForm() {
    const labels = { title: "Title", entity: "Shopping list", catalog_entity: "Catalog" };
    return {
      schema: [
        { name: "title", selector: { text: {} } },
        { name: "entity", selector: { entity: { domain: "todo" } } },
        { name: "catalog_entity", selector: { entity: { domain: "todo" } } },
      ],
      computeLabel: (s) => labels[s.name] || s.name,
      computeHelper: (s) => ({
        title: "Heading shown above the shopping list.",
        entity: "The to-do list that holds the shopping list.",
        catalog_entity: "The to-do list that holds the catalog of items, written \"Category: Item | Size\".",
      }[s.name] || ""),
    };
  }

  static getStubConfig() {
    return { entity: "todo.shopping_list", catalog_entity: "todo.shop_catalog", title: "Shopping" };
  }

  // ---------- data ----------
  async _items(entity) {
    const res = await this._hass.callWS({
      type: "call_service",
      domain: "todo",
      service: "get_items",
      target: { entity_id: entity },
      return_response: true,
    });
    return res?.response?.[entity]?.items || [];
  }

  _clean(summary) {
    let s = String(summary || "").replace(/^@[^@]*@\s*/, "").trim();
    let qty = 1;
    let m = s.match(/^(\d+)\s*[×x]\s+(.*)$/i);
    if (m) { qty = parseInt(m[1], 10); s = m[2]; }
    else {
      m = s.match(/^(.*\S)\s+\((\d+)\)$/);
      if (m) { qty = parseInt(m[2], 10); s = m[1]; }
    }
    return { name: s, qty: qty > 0 ? qty : 1 };
  }

  _fmtSummary(name, qty) { return qty > 1 ? name + " (" + qty + ")" : name; }

  async _loadList() {
    try {
      const items = await this._items(this._todo);
      this._list = items.map((i) => ({ uid: i.uid, summary: i.summary, done: i.status === "completed", ...this._clean(i.summary) }));
    } catch (e) { /* keep what is showing */ }
    this._renderLeft();
    this._renderRight();
  }

  async _loadCatalog() {
    try {
      const items = await this._items(this._catalogEntity);
      const map = new Map();
      for (const it of items) {
        const text = String(it.summary || "").trim();
        if (!text) continue;
        const i = text.indexOf(":");
        const cat = i > 0 ? text.slice(0, i).trim() : "Other";
        const rest = i > 0 ? text.slice(i + 1).trim() : text;
        // "Item | Size": the size / type is optional and freeform.
        const p = rest.indexOf("|");
        const name = (p >= 0 ? rest.slice(0, p) : rest).trim();
        const size = p >= 0 ? rest.slice(p + 1).trim() : "";
        if (!name) continue;
        if (!map.has(cat)) map.set(cat, []);
        map.get(cat).push({ name, size, label: LABEL(name, size), uid: it.uid });
      }
      // Categories A–Z, and the items inside each one A–Z.
      this._catalog = [...map.keys()].sort(AZ).map((c) => ({ name: c, items: map.get(c).sort((a, b) => AZ(a.label, b.label)) }));
      if (!this._catalog.some((c) => c.name === this._sel)) this._sel = this._catalog.length ? this._catalog[0].name : null;
    } catch (e) { /* keep what is showing */ }
    this._renderRight();
  }

  _call(domain, service, data, entity) {
    return this._hass.callService(domain, service, data, { entity_id: entity });
  }

  _onList(name) {
    return this._list.find((i) => i.name.toLowerCase() === String(name).toLowerCase());
  }

  // Find a catalog entry by its label (name + size / type), in any category (case-insensitive).
  _inCatalog(label, exceptUid) {
    const n = String(label).toLowerCase();
    for (const c of this._catalog) {
      for (const it of c.items) {
        if (it.label.toLowerCase() === n && it.uid !== exceptUid) return { cat: c.name, item: it };
      }
    }
    return null;
  }

  // Put an item on the shopping list: bump the quantity if it is already there.
  async _addToList(name, qty) {
    const have = this._onList(name);
    try {
      if (have) {
        const next = have.done ? qty : have.qty + qty;
        await this._call("todo", "update_item", { item: have.uid, rename: this._fmtSummary(have.name, next), status: "needs_action" }, this._todo);
      } else {
        await this._call("todo", "add_item", { item: this._fmtSummary(name, qty) }, this._todo);
      }
    } catch (e) { /* the list refreshes from the entity */ }
    this._loadList();
  }

  async _setQty(item, qty) {
    if (qty < 1) return;
    try { await this._call("todo", "update_item", { item: item.uid, rename: this._fmtSummary(item.name, qty) }, this._todo); } catch (e) { /* ignore */ }
    this._loadList();
  }

  async _toggle(item) {
    try { await this._call("todo", "update_item", { item: item.uid, status: item.done ? "needs_action" : "completed" }, this._todo); } catch (e) { /* ignore */ }
    this._loadList();
  }

  async _remove(item) {
    try { await this._call("todo", "remove_item", { item: [item.uid] }, this._todo); } catch (e) { /* ignore */ }
    this._loadList();
  }

  async _clearDone() {
    try { await this._call("todo", "remove_completed_items", {}, this._todo); } catch (e) { /* ignore */ }
    this._loadList();
  }

  // ---------- skeleton ----------
  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; height:var(--kiosk-viewport-content-height, calc(100vh - 120px)); min-height:360px; position:relative; --acc:var(--kiosk-accent, var(--primary-color)); --txt:var(--kiosk-text-primary, var(--primary-text-color)); --txt2:var(--kiosk-text-secondary, var(--secondary-text-color)); --surf:var(--kiosk-surface, var(--secondary-background-color)); --edge:var(--kiosk-surface-edge, 0 0 0 1px var(--divider-color)); --bg:var(--kiosk-background, var(--card-background-color)); }
        * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
        .wrap { height:100%; display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1.25fr); gap:12px; padding:0; color:var(--txt); font-size:20px; }
        .pane { min-width:0; min-height:0; display:flex; flex-direction:column; gap:10px; padding:12px; border-radius:12px; background:var(--surf); box-shadow:var(--edge); }
        .head { flex:none; display:flex; flex-wrap:wrap; align-items:center; gap:10px; }
        .head h2 { margin:0; font-size:1.2em; font-weight:700; flex:1; min-width:0; }
        .head .n { font-size:.7em; color:var(--txt2); }
        button { font:inherit; border:none; cursor:pointer; color:var(--txt); background:var(--surf); box-shadow:var(--edge); border-radius:12px; transition:transform .08s, filter .15s; }
        button:active { transform:scale(.96); filter:brightness(1.25); }
        .acc { background:color-mix(in srgb, var(--acc) 40%, transparent); font-weight:600; }
        .danger { background:color-mix(in srgb, #e53935 55%, transparent); font-weight:600; }
        .scroll { flex:1; min-height:0; overflow-y:auto; display:flex; flex-direction:column; gap:8px; }

        .tabs { display:none; flex:none; gap:8px; }
        .tab { flex:1; padding:12px 8px; font-size:.85em; font-weight:600; border-radius:12px; display:flex; align-items:center; justify-content:center; gap:8px; }
        .tab.on { background:color-mix(in srgb, var(--acc) 40%, transparent); }
        .tab .tn { font-size:.8em; padding:1px 8px; border-radius:999px; background:color-mix(in srgb, var(--acc) 45%, transparent); }

        .row { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:12px; background:var(--surf); box-shadow:var(--edge); cursor:pointer; flex:none; }
        .row .tick { flex:none; width:26px; height:26px; border-radius:50%; border:2px solid var(--txt2); display:flex; align-items:center; justify-content:center; font-size:.7em; color:transparent; }
        .row .name { flex:1; min-width:0; overflow-wrap:anywhere; line-height:1.15; }
        .row.done .name { text-decoration:line-through; opacity:.55; }
        .row.done .tick { background:var(--acc); border-color:var(--acc); color:#fff; }
        .qty { flex:none; display:flex; align-items:center; gap:4px; }
        .qty button { width:38px; height:38px; padding:0; font-size:1.1em; line-height:1; }
        .qty .q { min-width:28px; text-align:center; font-weight:700; }
        .x { flex:none; width:38px; height:38px; padding:0; background:transparent !important; box-shadow:none !important; color:var(--txt2); }
        .muted { color:var(--txt2); text-align:center; padding:20px 8px; font-size:.8em; }

        .fbar { flex:none; display:flex; gap:8px; }
        .fbar input { flex:1; min-width:0; font:inherit; font-size:.9em; padding:10px 14px; border:none; border-radius:12px; background:var(--surf); box-shadow:var(--edge); color:var(--txt); outline:none; }
        .fbar input::placeholder { color:var(--txt2); }
        .fbar input:focus { box-shadow:var(--edge), inset 0 0 0 2px var(--acc); }
        .addbtn { flex:none; padding:10px 16px; font-size:.8em; letter-spacing:1px; text-transform:uppercase; border-radius:12px; }
        .catlist { flex:1; min-height:0; overflow-y:auto; display:flex; flex-direction:column; gap:8px; }
        .chead { flex:none; margin-top:6px; padding:8px 12px; border-left:5px solid var(--acc); border-radius:4px; background:var(--surf); box-shadow:var(--edge); text-transform:uppercase; letter-spacing:1px; font-weight:600; font-size:.8em; }
        .chead:first-child { margin-top:0; }
        .pills { flex:none; display:flex; flex-wrap:wrap; gap:8px; padding:0 2px 2px; }
        .irow { flex:none; display:flex; align-items:center; gap:8px; padding:10px 18px; border-radius:999px; line-height:1.1; -webkit-touch-callout:none; -webkit-user-select:none; user-select:none; }
        .irow.has { box-shadow:inset 0 0 0 2px var(--acc), var(--edge); }
        .irow .b { flex:none; font-size:.75em; font-weight:700; padding:1px 8px; border-radius:999px; background:color-mix(in srgb, var(--acc) 45%, transparent); }

        .overlay { position:absolute; inset:0; z-index:5; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,.55); padding:12px; }
        .dlg { width:min(520px, 100%); max-height:100%; overflow-y:auto; display:flex; flex-direction:column; gap:12px; padding:18px; border-radius:16px; background:var(--bg); box-shadow:var(--edge); color:var(--txt); font-size:20px; }
        .dlg h3 { margin:0; font-size:1.1em; }
        .dlg label.cap { font-size:.7em; letter-spacing:.08em; text-transform:uppercase; color:var(--txt2); margin-bottom:-6px; }
        .dlg input[type=text] { font:inherit; font-size:1em; padding:12px; border:none; border-radius:12px; background:var(--surf); box-shadow:var(--edge); color:var(--txt); outline:none; width:100%; }
        .dlg input[type=text]:focus { box-shadow:var(--edge), inset 0 0 0 2px var(--acc); }
        .dlg .catrow { display:flex; gap:8px; align-items:stretch; }
        .dlg .catrow input { flex:1; min-width:0; }
        .dlg .eye { flex:none; width:50px; padding:0; display:flex; align-items:center; justify-content:center; color:var(--txt2); }
        .dlg .eye.on { color:var(--txt); background:color-mix(in srgb, var(--acc) 40%, transparent); }
        .dlg .sug { display:flex; flex-wrap:wrap; gap:6px; margin-top:-4px; }
        .dlg .sug button { padding:8px 16px; border-radius:999px; font-size:.85em; }
        .dlg .sug button.cur { box-shadow:inset 0 0 0 2px var(--acc), var(--edge); }
        .dlg .sug .new { background:transparent; box-shadow:inset 0 0 0 1px var(--txt2); color:var(--txt2); cursor:default; }
        .dlg .qrow { display:flex; align-items:center; gap:12px; }
        .dlg .qrow button { width:48px; height:48px; padding:0; font-size:1.2em; }
        .dlg .qrow .q { min-width:40px; text-align:center; font-weight:700; font-size:1.2em; }
        .dlg .keep { display:flex; align-items:center; gap:12px; padding:10px 12px; border-radius:12px; background:var(--surf); box-shadow:var(--edge); cursor:pointer; font-size:.85em; line-height:1.2; }
        .dlg .keep.locked { opacity:.6; cursor:default; }
        .dlg .keep input { flex:none; width:28px; height:28px; margin:0; accent-color:var(--acc); }
        .dlg .keep small { display:block; color:var(--txt2); font-size:.8em; margin-top:2px; }
        .dlg .btns { display:flex; gap:10px; margin-top:4px; }
        .dlg .btns button { flex:1; padding:14px; }
        .dlg .err { color:#ff6b6b; font-size:.75em; min-height:1em; }

        /* Phone layout: one pane at a time, chosen by the tabs on top. */
        :host(.narrow) .wrap { display:flex; flex-direction:column; gap:8px; font-size:17px; }
        :host(.narrow) .tabs { display:flex; }
        :host(.narrow) .pane { flex:1; padding:10px; }
        :host(.narrow[tab="list"]) .pc { display:none; }
        :host(.narrow[tab="catalog"]) .pl { display:none; }
        :host(.narrow) .head h2 { display:none; }
        :host(.narrow) .head .n { flex:1; font-size:.8em; }
        :host(.narrow) .dlg { font-size:17px; padding:14px; }

        @media (max-height: 600px) {
          .wrap { font-size:15px; gap:8px; }
          .pane { padding:8px; gap:6px; }
          .row { padding:6px 8px; gap:8px; }
          .row .tick { width:20px; height:20px; }
          .qty button, .x { width:30px; height:30px; }
          .fbar input { padding:7px 10px; }
          .addbtn { padding:7px 12px; }
          .chead { padding:5px 10px; margin-top:2px; }
          .pills { gap:6px; }
          .irow { padding:7px 13px; }
          .dlg { font-size:15px; padding:12px; gap:8px; }
          .dlg .qrow button { width:38px; height:38px; }
          .dlg .keep input { width:22px; height:22px; }
          .dlg .sug button { padding:5px 12px; }
          .dlg .eye { width:40px; }
        }
      </style>
      <div class="wrap">
        <div class="tabs">
          <button class="tab on" id="tabl" type="button">Shopping list <span class="tn" id="tabcount" style="display:none"></span></button>
          <button class="tab" id="tabc" type="button">Add items</button>
        </div>
        <div class="pane pl">
          <div class="head"><h2 id="title"></h2><span class="n" id="count"></span><button class="acc" id="clear" style="padding:8px 14px;font-size:.7em">Clear done</button></div>
          <div class="scroll" id="left"></div>
        </div>
        <div class="pane pc">
          <div class="fbar"><input id="filter" type="search" placeholder="Filter categories and items" autocomplete="off" enterkeyhint="search"><button class="addbtn acc" id="addbtn">+ Add New Item</button></div>
          <div class="catlist" id="catlist"></div>
        </div>
      </div>
      <div id="dlgbox"></div>`;
    const $ = (s) => this.shadowRoot.querySelector(s);
    $("#title").textContent = this._title;
    $("#clear").addEventListener("click", () => this._clearDone());
    $("#addbtn").addEventListener("click", () => this._openDialog());
    const f = $("#filter");
    f.value = this._filter;
    f.addEventListener("input", () => { this._filter = f.value; this._renderRight(); });
    // Phone layout tabs (only visible when the card is narrow).
    const setTab = (t) => {
      this._tab = t;
      this.setAttribute("tab", t === "catalog" ? "catalog" : "list");
      $("#tabl").classList.toggle("on", t !== "catalog");
      $("#tabc").classList.toggle("on", t === "catalog");
    };
    $("#tabl").addEventListener("click", () => setTab("list"));
    $("#tabc").addEventListener("click", () => setTab("catalog"));
    setTab(this._tab || "list");
    this._renderLeft();
    this._renderRight();
    this._renderDialog();
  }

  // ---------- left: shopping list ----------
  _renderLeft() {
    const box = this.shadowRoot && this.shadowRoot.querySelector("#left");
    if (!box) return;
    const rows = [...this._list].sort((a, b) => (a.done - b.done) || AZ(a.name, b.name));
    const total = rows.reduce((n, r) => n + (r.done ? 0 : r.qty), 0);
    this.shadowRoot.querySelector("#count").textContent = total ? total + (total === 1 ? " item" : " items") + " on your shopping list" : "";
    const tn = this.shadowRoot.querySelector("#tabcount");
    tn.textContent = total;
    tn.style.display = total ? "" : "none";
    this.shadowRoot.querySelector("#clear").style.display = rows.some((r) => r.done) ? "" : "none";
    box.innerHTML = "";
    if (!rows.length) { box.innerHTML = '<div class="muted">The list is empty. Pick items from the right.</div>'; return; }
    for (const it of rows) {
      const row = document.createElement("div");
      row.className = "row" + (it.done ? " done" : "");
      row.innerHTML = '<span class="tick">✓</span><span class="name"></span>';
      row.querySelector(".name").textContent = it.name;
      if (!it.done) {
        const q = document.createElement("div");
        q.className = "qty";
        const m = document.createElement("button");
        m.textContent = "−";
        m.addEventListener("click", (e) => { e.stopPropagation(); this._setQty(it, it.qty - 1); });
        const n = document.createElement("span");
        n.className = "q";
        n.textContent = it.qty;
        const p = document.createElement("button");
        p.textContent = "+";
        p.addEventListener("click", (e) => { e.stopPropagation(); this._setQty(it, it.qty + 1); });
        q.append(m, n, p);
        row.appendChild(q);
      }
      const x = document.createElement("button");
      x.className = "x";
      x.textContent = "✕";
      x.setAttribute("aria-label", "Remove");
      x.addEventListener("click", (e) => { e.stopPropagation(); this._remove(it); });
      row.appendChild(x);
      row.addEventListener("click", () => this._toggle(it));
      box.appendChild(row);
    }
  }

  // ---------- right: filter + categories with their items as pills ----------
  _renderRight() {
    const box = this.shadowRoot && this.shadowRoot.querySelector("#catlist");
    if (!box) return;
    const q = (this._filter || "").trim().toLowerCase();
    box.innerHTML = "";
    if (!this._catalog.length) { box.innerHTML = '<div class="muted">No catalog yet. Tap “+ Add New Item” to start one.</div>'; return; }
    let shown = 0;
    for (const c of this._catalog) {
      const catMatch = !q || c.name.toLowerCase().includes(q);
      const items = catMatch ? c.items : c.items.filter((n) => n.label.toLowerCase().includes(q));
      if (!items.length) continue;
      shown++;
      const head = document.createElement("div");
      head.className = "chead";
      head.textContent = c.name;
      box.appendChild(head);
      const pills = document.createElement("div");
      pills.className = "pills";
      for (const it of items) {
        const name = it.label;
        const have = this._onList(name);
        const b = document.createElement("button");
        b.className = "irow" + (have && !have.done ? " has" : "");
        const t = document.createElement("span");
        t.textContent = name;
        b.appendChild(t);
        if (have && !have.done) {
          const badge = document.createElement("span");
          badge.className = "b";
          badge.textContent = "×" + have.qty;
          b.appendChild(badge);
        }
        // Tap adds to the shopping list; a long press (without moving) opens the editor.
        let timer = null, sx = 0, sy = 0, fired = false;
        const cancel = () => { if (timer) { clearTimeout(timer); timer = null; } };
        b.addEventListener("pointerdown", (e) => {
          fired = false;
          sx = e.clientX; sy = e.clientY;
          cancel();
          timer = setTimeout(() => { timer = null; fired = true; this._openEdit(c.name, it); }, 550);
        });
        b.addEventListener("pointermove", (e) => { if (timer && Math.hypot(e.clientX - sx, e.clientY - sy) > 10) cancel(); });
        for (const ev of ["pointerup", "pointercancel", "pointerleave"]) b.addEventListener(ev, cancel);
        b.addEventListener("contextmenu", (e) => e.preventDefault());
        b.addEventListener("click", () => {
          if (fired) { fired = false; return; }
          this._sel = c.name;
          this._addToList(name, 1);
        });
        pills.appendChild(b);
      }
      box.appendChild(pills);
    }
    if (!shown) box.innerHTML = '<div class="muted">Nothing matches “' + String(this._filter).replace(/</g, "&lt;") + '”.</div>';
  }

  // ---------- add / edit item dialog ----------
  _openDialog() {
    this._dialog = { cat: "", item: "", size: "", qty: 1, keep: true, openedAt: Date.now() };
    this._renderDialog();
  }

  _openEdit(cat, it) {
    this._dialog = { edit: true, uid: it.uid, cat, item: it.name, size: it.size || "", qty: 1, keep: true, openedAt: Date.now() };
    this._renderDialog();
  }

  _renderDialog() {
    const box = this.shadowRoot && this.shadowRoot.querySelector("#dlgbox");
    if (!box) return;
    box.innerHTML = "";
    const d = this._dialog;
    if (!d) return;
    const overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.innerHTML = `
      <div class="dlg">
        <h3>${d.edit ? "Edit item" : "Add New Item"}</h3>
        <label class="cap" id="dcaplbl">Category</label>
        <div class="catrow">
          <input id="dcat" type="text" placeholder="Start typing, e.g. Dai" autocomplete="off">
          <button class="eye" id="deye" type="button" aria-label="Show all categories" title="Show all categories"></button>
        </div>
        <div class="sug" id="dsug"></div>
        <label class="cap">Item</label>
        <input id="ditem" type="text" placeholder="e.g. Milk" autocomplete="off">
        <label class="cap">Size / Type (optional)</label>
        <input id="dsize" type="text" placeholder="e.g. 2L, Granulated" autocomplete="off">
        <label class="cap" id="dqlbl">Quantity</label>
        <div class="qrow" id="dqrow"><button id="dm">−</button><span class="q" id="dq"></span><button id="dp">+</button></div>
        <label class="keep" id="dkeeprow"><input id="dkeep" type="checkbox"><span>Keep it for next time<small>Saves it to the catalog so you can order it again in future</small></span></label>
        <div class="err" id="derr"></div>
        <div class="btns"><button class="danger" id="ddel" style="display:none">Delete</button><button id="dcancel">Cancel</button><button class="acc" id="dok"></button></div>
      </div>`;
    box.appendChild(overlay);
    const $ = (s) => overlay.querySelector(s);
    const cats = this._catalog.map((c) => c.name);
    const catIn = $("#dcat");
    const sug = $("#dsug");
    const eye = $("#deye");
    // Suggestions narrow to categories matching what is typed (nothing while the box
    // is empty). The eye button, off by default, lists every category instead.
    let showAll = false;
    const sync = () => {
      d.cat = catIn.value;
      const q = d.cat.trim().toLowerCase();
      const exact = cats.find((c) => c.toLowerCase() === q);
      eye.className = "eye" + (showAll ? " on" : "");
      eye.innerHTML = showAll ? EYE_OPEN : EYE_CLOSED;
      sug.innerHTML = "";
      for (const c of cats) {
        if (!showAll && !(q && c.toLowerCase().includes(q))) continue;
        if (!showAll && exact && c === exact) continue;
        const b = document.createElement("button");
        b.textContent = c;
        if (showAll && c === exact) b.className = "cur";
        b.addEventListener("click", () => { catIn.value = c; sync(); });
        sug.appendChild(b);
      }
      if (q && !exact) {
        const n = document.createElement("button");
        n.className = "new";
        n.textContent = "New category: " + d.cat.trim();
        sug.appendChild(n);
      }
    };
    const dok = $("#dok");
    const keepBox = $("#dkeep");
    const keepRow = $("#dkeeprow");
    // The main button says what will happen: quantity 0 only creates the item.
    const syncOk = () => {
      if (d.edit) return;
      dok.textContent = d.qty === 0 ? "Save to Catalog" : d.keep ? "Save & Add to List" : "Add to List";
    };
    const syncKeep = () => {
      d.keep = keepBox.checked;
      syncOk();
      catIn.disabled = !d.keep;
      eye.disabled = !d.keep;
      $("#dcaplbl").style.opacity = d.keep ? "1" : ".4";
      catIn.style.opacity = d.keep ? "1" : ".4";
      eye.style.opacity = d.keep ? "1" : ".4";
      sug.style.display = d.keep ? "" : "none";
    };
    // At quantity 0 the only thing left to do is create the catalog item, so the
    // "keep" box is forced on and locked until the quantity goes back up.
    const showQty = () => {
      $("#dq").textContent = "×" + d.qty;
      const locked = !d.edit && d.qty === 0;
      if (locked) keepBox.checked = true;
      keepBox.disabled = locked;
      keepRow.classList.toggle("locked", locked);
      syncKeep();
    };
    $("#ditem").value = d.item;
    $("#dsize").value = d.size;
    catIn.value = d.cat;
    keepBox.checked = d.keep;
    catIn.addEventListener("input", sync);
    eye.addEventListener("click", () => { showAll = !showAll; sync(); });
    keepBox.addEventListener("change", syncKeep);
    $("#ditem").addEventListener("input", (e) => { d.item = e.target.value; });
    $("#dsize").addEventListener("input", (e) => { d.size = e.target.value; });
    $("#dm").addEventListener("click", () => { d.qty = Math.max(0, d.qty - 1); showQty(); });
    $("#dp").addEventListener("click", () => { d.qty = Math.min(99, d.qty + 1); showQty(); });
    $("#dcancel").addEventListener("click", () => { this._dialog = null; this._renderDialog(); });
    dok.addEventListener("click", () => {
      d.item = $("#ditem").value;
      d.size = $("#dsize").value;
      d.cat = catIn.value;
      if (d.edit) this._saveEdit($("#derr")); else this._submitDialog($("#derr"));
    });
    sync();
    showQty();
    if (d.edit) {
      // Editing a catalog entry: no quantity or "keep" option, but a Delete button.
      for (const id of ["#dqlbl", "#dqrow", "#dkeeprow"]) $(id).style.display = "none";
      dok.textContent = "Save";
      const del = $("#ddel");
      del.style.display = "";
      let armed = false;
      del.addEventListener("click", () => {
        if (!armed) {
          armed = true;
          del.textContent = "Tap again to delete";
          setTimeout(() => { armed = false; del.textContent = "Delete"; }, 3000);
          return;
        }
        this._deleteEdit($("#derr"));
      });
    }
  }

  async _saveEdit(errBox) {
    const d = this._dialog;
    const name = SAFE(d.item);
    const size = SAFE(d.size);
    let cat = (d.cat || "").replace(/:/g, "").replace(/\s+/g, " ").trim();
    if (!cat) { errBox.textContent = "Enter a category."; return; }
    if (!name) { errBox.textContent = "Enter an item name."; return; }
    // Refuse to rename/move onto an item (name + size / type) that another catalog entry already has.
    const dup = this._inCatalog(LABEL(name, size), d.uid);
    if (dup) { errBox.textContent = "“" + dup.item.label + "” already exists in " + dup.cat + "."; return; }
    const existingCat = this._catalog.find((c) => c.name.toLowerCase() === cat.toLowerCase());
    if (existingCat) cat = existingCat.name;
    try {
      await this._call("todo", "update_item", { item: d.uid, rename: cat + ": " + name + (size ? " | " + size : "") }, this._catalogEntity);
    } catch (e) {
      errBox.textContent = "Could not save the change.";
      return;
    }
    this._sel = cat;
    this._dialog = null;
    this._renderDialog();
    this._loadCatalog();
  }

  async _deleteEdit(errBox) {
    const d = this._dialog;
    try {
      await this._call("todo", "remove_item", { item: [d.uid] }, this._catalogEntity);
    } catch (e) {
      errBox.textContent = "Could not delete it.";
      return;
    }
    this._dialog = null;
    this._renderDialog();
    this._loadCatalog();
  }

  async _submitDialog(errBox) {
    const d = this._dialog;
    const name = SAFE(d.item);
    const size = SAFE(d.size);
    const label = LABEL(name, size);
    if (d.keep && !(d.cat || "").replace(/:/g, "").trim()) { errBox.textContent = "Enter a category, or untick “Keep it for next time”."; return; }
    if (!name) { errBox.textContent = "Enter an item name."; return; }
    // Quantity 0 means "just create the item", which only makes sense when it is kept.
    if (d.qty === 0 && !d.keep) { errBox.textContent = "Quantity is 0 and “Keep it for next time” is off, so there is nothing to save."; return; }
    // One catalog entry per item (name + size / type), whatever the category.
    const dup = d.keep ? this._inCatalog(label) : null;
    if (dup && d.qty === 0) { errBox.textContent = "“" + dup.item.label + "” already exists in " + dup.cat + "."; return; }
    // Use the catalog's own spelling when the item already exists.
    const finalName = dup ? dup.item.label : label;
    if (d.keep && !dup) {
      let cat = (d.cat || "").replace(/:/g, "").replace(/\s+/g, " ").trim();
      // Reuse the category's existing spelling.
      const existingCat = this._catalog.find((c) => c.name.toLowerCase() === cat.toLowerCase());
      if (existingCat) cat = existingCat.name;
      try {
        await this._call("todo", "add_item", { item: cat + ": " + name + (size ? " | " + size : "") }, this._catalogEntity);
      } catch (e) {
        errBox.textContent = "Could not save to the catalog.";
        return;
      }
      this._sel = cat;
    } else if (dup) {
      this._sel = dup.cat;
    }
    this._dialog = null;
    this._renderDialog();
    if (d.qty > 0) await this._addToList(finalName, d.qty);
    if (d.keep && !dup) this._loadCatalog();
  }
}

if (!customElements.get("shoppingmate-list-card")) customElements.define("shoppingmate-list-card", ShopListCard);
window.customCards = window.customCards || [];
window.customCards.push({ type: "shoppingmate-list-card", name: "ShoppingMate List Card", description: "Shopping list with a catalog of categories and items" });

/* =====================================================================
 * 2. shoppingmate-calc-card
 * ===================================================================== */
/*
 * shoppingmate-calc-card — Shopping calculator for the in-store phone dashboard.
 * Left: price display, quantity and keypad. Right: an "add item" field and the
 * open shopping-list items, A to Z; tap one to select it, then Add a price for
 * it. Long-press an item to be asked whether to remove it from the shopping list.
 * Adding a price ticks the item off the shopping list
 * (todo.update_item -> completed) and moves it to the "In Cart" list below
 * the calculator. ✕ on an In Cart line removes that price (and un-ticks the item
 * when it has no other prices).
 * The "Add item" field adds a new item to the shopping list (with the current
 * quantity) and selects it, ready for a price.
 * "Finish shop" (above the In Cart list) saves the shop as one event in the
 * history calendar (title "Shop – $total", description = every item with qty and
 * price plus the total), adds the total to the running spend counter (an
 * input_number that a total_increasing template sensor mirrors, so the History
 * view can chart spend per week/month), clears the calculator and removes the
 * ticked-off items from the shopping list. The "Shop - Notify when finished"
 * automation triggers on that spend counter going up and sends the notification
 * from the newest calendar event.
 * The event starts one minute after Finish shop (so it is the newest event the
 * automation's calendar lookup finds).
 * Entries are kept in this browser (localStorage) until the shop is finished.
 * Meant to fill a panel view (fills the page height and scrolls inside).
 * Added 2026-10-11, restyled same day; history moved from a to-do list to a
 * calendar + spend counter the same day. Item labels drop the Improved Shopping
 * List Card's "@Category@ " prefix and its quantity marker ("Name (2)" / "2× Name").
 * Card config: type: custom:shoppingmate-calc-card, entity: todo.shopping_list,
 *   calendar_entity: calendar.shop_history,
 *   spend_entity: input_number.shop_spend_total, currency: "$"
 */
class ShopCalcCard extends HTMLElement {
  setConfig(config) {
    this._cfg = config || {};
    this._todo = this._cfg.entity || "todo.shopping_list";
    this._calendar = this._cfg.calendar_entity || "calendar.shop_history";
    this._spend = this._cfg.spend_entity || "input_number.shop_spend_total";
    this._cur = this._cfg.currency || "$";
    this._key = "shop_calc_" + this._todo;
    this._entries = [];
    try { this._entries = JSON.parse(localStorage.getItem(this._key) || "[]"); } catch (e) { this._entries = []; }
    this._input = "";
    this._qty = 1;
    this._label = "";
    this._all = [];
    this._stamp = null;
    this._busy = false;
    if (this.shadowRoot) this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
      this._render();
    }
    const st = hass.states[this._todo];
    const stamp = st ? st.last_updated : null;
    if (stamp !== this._stamp) {
      this._stamp = stamp;
      this._loadItems();
    }
  }

  getCardSize() { return 11; }

  // Visual editor in the dashboard editor (Home Assistant builds the form from this).
  static getConfigForm() {
    const labels = {
      entity: "Shopping list",
      calendar_entity: "History calendar",
      spend_entity: "Spend counter",
      currency: "Currency symbol",
    };
    return {
      schema: [
        { name: "entity", selector: { entity: { domain: "todo" } } },
        { name: "calendar_entity", selector: { entity: { domain: "calendar" } } },
        { name: "spend_entity", selector: { entity: { domain: "input_number" } } },
        { name: "currency", selector: { text: {} } },
      ],
      computeLabel: (s) => labels[s.name] || s.name,
      computeHelper: (s) => ({
        entity: "The to-do list that holds the shopping list.",
        calendar_entity: "Finish shop saves each shop as an event in this calendar.",
        spend_entity: "Finish shop adds the shop total to this number.",
        currency: "Shown before every price, for example $.",
      }[s.name] || ""),
    };
  }

  static getStubConfig() {
    return { entity: "todo.shopping_list", calendar_entity: "calendar.shop_history", spend_entity: "input_number.shop_spend_total", currency: "$" };
  }

  // "@Food@ Coffee (Granulated) (2)" -> { name: "Coffee (Granulated)", qty: 2 }
  _clean(summary) {
    let s = String(summary || "").replace(/^@[^@]*@\s*/, "").trim();
    let qty = 1;
    let m = s.match(/^(\d+)\s*[×x]\s+(.*)$/i);
    if (m) { qty = parseInt(m[1], 10); s = m[2]; }
    else {
      m = s.match(/^(.*\S)\s+\((\d+)\)$/);
      if (m) { qty = parseInt(m[2], 10); s = m[1]; }
    }
    return { name: s, qty: qty > 0 ? qty : 1 };
  }

  async _loadItems() {
    try {
      const res = await this._hass.callWS({
        type: "call_service",
        domain: "todo",
        service: "get_items",
        target: { entity_id: this._todo },
        return_response: true,
      });
      const items = res?.response?.[this._todo]?.items || [];
      this._all = items.map((i) => ({ uid: i.uid, summary: i.summary, done: i.status === "completed", ...this._clean(i.summary) }));
    } catch (e) {
      this._all = [];
    }
    this._renderList();
  }

  async _setDone(name, done) {
    const item = this._all.find((i) => i.name === name && i.done !== done);
    if (!item) return;
    try {
      await this._hass.callService("todo", "update_item", { item: item.uid || item.summary, status: done ? "completed" : "needs_action" }, { entity_id: this._todo });
    } catch (e) { /* the list is refreshed from the entity state either way */ }
  }

  // Long press on an open item: ask, then remove it from the shopping list.
  async _removeItem(item) {
    if (!confirm("Remove " + item.name + " from the shopping list?")) return;
    try {
      await this._hass.callService("todo", "remove_item", { item: [item.uid || item.summary] }, { entity_id: this._todo });
    } catch (e) {
      alert("Could not remove " + item.name + " from the shopping list.");
      return;
    }
    this._all = this._all.filter((i) => i !== item);
    if (this._label === item.name) this._label = "";
    this._renderDisplay();
    this._renderList();
  }

  // Add a new item to the shopping list from the in-store field and select it.
  async _newItem() {
    const field = this.shadowRoot.querySelector("#new");
    const name = (field.value || "").trim().replace(/\s+/g, " ");
    if (!name) return;
    const existing = this._all.find((i) => !i.done && i.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      this._label = existing.name;
      this._qty = existing.qty;
    } else {
      const qty = this._qty;
      const summary = qty > 1 ? name + " (" + qty + ")" : name;
      // Show it straight away; the state change reloads the real list.
      this._all.push({ uid: null, summary, done: false, name, qty });
      this._label = name;
      try {
        await this._hass.callService("todo", "add_item", { item: summary }, { entity_id: this._todo });
      } catch (e) {
        this._all = this._all.filter((i) => i.summary !== summary || i.uid);
        this._label = "";
        alert("Could not add " + name + " to the shopping list.");
      }
    }
    field.value = "";
    this._renderDisplay();
    this._renderList();
  }

  _save() {
    try { localStorage.setItem(this._key, JSON.stringify(this._entries)); } catch (e) { /* ignore */ }
  }

  _fmt(n) { return this._cur + n.toFixed(2); }

  _total() {
    return this._entries.reduce((s, e) => s + e.price * e.qty, 0);
  }

  _press(k) {
    if (k === "<") this._input = this._input.slice(0, -1);
    else if (k === ".") { if (!this._input.includes(".")) this._input += this._input ? "." : "0."; }
    else {
      const dot = this._input.indexOf(".");
      if (dot >= 0 && this._input.length - dot > 2) return;
      if (this._input.length < 8) this._input += k;
    }
    this._renderDisplay();
  }

  _add() {
    const price = parseFloat(this._input);
    if (!(price > 0)) return;
    const label = this._label || "Item";
    this._entries.push({ label, price, qty: this._qty });
    if (this._label) this._setDone(this._label, true);
    this._input = "";
    this._qty = 1;
    this._label = "";
    this._save();
    this._renderDisplay();
    this._renderList();
  }

  // Local "YYYY-MM-DD HH:MM:SS" for calendar.create_event.
  _stampLocal(d) {
    const p = (n) => String(n).padStart(2, "0");
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
  }

  async _finish() {
    if (this._busy || !this._entries.length) return;
    const total = this._total();
    if (!confirm("Finish this shop (" + this._fmt(total) + ") and save it to history?")) return;
    this._busy = true;
    // One line per item, prices of the same item combined; sorted A to Z.
    const byName = new Map();
    for (const e of this._entries) {
      const cur = byName.get(e.label) || { qty: 0, sum: 0 };
      cur.qty += e.qty;
      cur.sum += e.price * e.qty;
      byName.set(e.label, cur);
    }
    const lines = [...byName.entries()]
      .sort((a, b) => a[0].localeCompare(b[0], undefined, { sensitivity: "base" }))
      .map(([name, v]) => name + (v.qty > 1 ? " ×" + v.qty : "") + " — " + this._fmt(v.sum));
    const description = lines.join("\n") + "\nTotal — " + this._fmt(total);
    // Start a minute from now so the calendar trigger (which fires when an
    // event begins) reliably sees it.
    const start = new Date(Date.now() + 60000);
    try {
      await this._hass.callService("calendar", "create_event", {
        summary: "Shop – " + this._fmt(total),
        description,
        start_date_time: this._stampLocal(start),
        end_date_time: this._stampLocal(new Date(start.getTime() + 30 * 60000)),
      }, { entity_id: this._calendar });
    } catch (e) {
      this._busy = false;
      alert("Could not save the shop to " + this._calendar + ". Nothing was cleared.");
      return;
    }
    try {
      const st = this._hass.states[this._spend];
      const prev = st ? parseFloat(st.state) || 0 : 0;
      await this._hass.callService("input_number", "set_value", { value: Math.round((prev + total) * 100) / 100 }, { entity_id: this._spend });
    } catch (e) { /* the event is saved; the spend counter can be corrected by hand */ }
    try {
      await this._hass.callService("todo", "remove_completed_items", {}, { entity_id: this._todo });
    } catch (e) { /* history is saved; the ticked items can be cleared from the list card */ }
    this._entries = [];
    this._input = "";
    this._qty = 1;
    this._label = "";
    this._save();
    this._busy = false;
    this._renderDisplay();
    this._renderList();
  }

  _render() {
    const keys = ["7", "8", "9", "4", "5", "6", "1", "2", "3", ".", "0", "<"];
    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; height:100%; }
        * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
        ha-card { display:block; height:100%; overflow-y:auto; border-radius:0; padding:14px; color:var(--primary-text-color); --acc:var(--primary-color); --soft:var(--secondary-background-color); --edge:var(--divider-color); }
        button { font:inherit; border:none; cursor:pointer; color:var(--primary-text-color); transition:transform .08s, filter .15s; }
        button:active { transform:scale(.96); filter:brightness(1.25); }

        .hero { display:flex; justify-content:space-between; align-items:center; padding:14px 18px; margin-bottom:12px; border-radius:18px;
          background:linear-gradient(135deg, color-mix(in srgb, var(--acc) 38%, transparent), color-mix(in srgb, var(--acc) 8%, transparent));
          border:1px solid color-mix(in srgb, var(--acc) 45%, transparent); }
        .hero .label { font-size:12px; letter-spacing:.1em; text-transform:uppercase; color:var(--secondary-text-color); }
        .hero .count { font-size:14px; margin-top:2px; color:var(--secondary-text-color); }
        .hero .sum { font-size:38px; font-weight:700; letter-spacing:-.02em; line-height:1; }

        .cols { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:12px; align-items:stretch; }

        .amount { display:flex; align-items:baseline; justify-content:flex-end; gap:4px; padding:10px 16px; margin-bottom:8px; min-height:60px; border-radius:16px; background:var(--soft); border:1px solid var(--edge); overflow:hidden; }
        .amount .cur { font-size:20px; color:var(--secondary-text-color); }
        .amount .val { font-size:34px; font-weight:600; letter-spacing:-.01em; }
        .amount .val.empty { opacity:.35; }

        .qty { display:flex; align-items:center; justify-content:space-between; padding:4px 6px 4px 14px; margin-bottom:10px; border-radius:999px; background:var(--soft); border:1px solid var(--edge); }
        .qty .cap { font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:var(--secondary-text-color); }
        .qty .ctl { display:flex; align-items:center; gap:2px; }
        .qty .n { min-width:38px; text-align:center; font-size:20px; font-weight:700; }
        .qty button { width:38px; height:38px; padding:0; border-radius:50%; font-size:22px; line-height:1; background:color-mix(in srgb, var(--acc) 22%, transparent); }

        .pad { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
        .pad button { height:56px; padding:0; font-size:24px; font-weight:500; border-radius:16px; background:var(--soft); border:1px solid var(--edge); }
        .pad button.back { color:var(--secondary-text-color); }
        .actions { display:grid; grid-template-columns:1fr 2fr; gap:8px; margin-top:8px; }
        .actions button { height:56px; padding:0; font-size:18px; border-radius:16px; }
        .clr { background:transparent; border:1px solid var(--edge); color:var(--secondary-text-color); }
        .add { background:var(--acc); color:var(--text-primary-color,#fff); font-weight:700; letter-spacing:.02em; box-shadow:0 4px 14px color-mix(in srgb, var(--acc) 40%, transparent); }

        .right { position:relative; min-height:360px; }
        .rin { position:absolute; inset:0; display:flex; flex-direction:column; gap:8px; }
        .addrow { display:flex; gap:8px; flex:none; }
        .addrow input { flex:1; min-width:0; font:inherit; font-size:16px; padding:0 14px; height:46px; border-radius:14px; border:1px solid var(--edge); background:var(--soft); color:var(--primary-text-color); outline:none; }
        .addrow input:focus { border-color:var(--acc); }
        .addrow button { flex:none; width:46px; height:46px; padding:0; font-size:26px; line-height:1; border-radius:14px; background:var(--acc); color:var(--text-primary-color,#fff); }
        .list { flex:1; min-height:0; overflow-y:auto; display:flex; flex-direction:column; gap:6px; padding-right:2px; }

        .row { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:14px; background:var(--soft); border:1px solid transparent; font-size:16px; cursor:pointer; flex:none; -webkit-touch-callout:none; -webkit-user-select:none; user-select:none; }
        .row .tick { flex:none; width:22px; height:22px; border-radius:50%; border:2px solid var(--edge); }
        .row .name { flex:1; min-width:0; overflow-wrap:anywhere; line-height:1.2; }
        .row .badge { flex:none; font-size:12px; font-weight:700; padding:2px 7px; border-radius:999px; background:color-mix(in srgb, var(--acc) 28%, transparent); }
        .row.on { border-color:var(--acc); background:color-mix(in srgb, var(--acc) 22%, var(--soft)); }
        .row.on .tick { border-color:var(--acc); box-shadow:inset 0 0 0 4px var(--acc); }
        .muted { color:var(--secondary-text-color); font-size:14px; padding:18px 8px; text-align:center; }

        .finish { width:100%; height:56px; margin-top:14px; font-size:18px; font-weight:700; letter-spacing:.03em; border-radius:16px; background:var(--acc); color:var(--text-primary-color,#fff); box-shadow:0 4px 14px color-mix(in srgb, var(--acc) 35%, transparent); }
        .finish:disabled { background:var(--soft); color:var(--secondary-text-color); box-shadow:none; opacity:.7; cursor:default; }

        .priced { margin-top:16px; }
        .priced .head { display:flex; justify-content:space-between; align-items:baseline; margin:0 4px 8px; font-size:12px; letter-spacing:.1em; text-transform:uppercase; color:var(--secondary-text-color); }
        .plist { display:flex; flex-direction:column; gap:6px; }
        .pline { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:14px; background:var(--soft); border:1px solid var(--edge); }
        .pline .tick { flex:none; width:22px; height:22px; border-radius:50%; background:var(--acc); color:var(--text-primary-color,#fff); display:flex; align-items:center; justify-content:center; font-size:13px; }
        .pline .info { flex:1; min-width:0; }
        .pline .pname { font-size:16px; overflow-wrap:anywhere; line-height:1.2; }
        .pline .psub { font-size:12px; color:var(--secondary-text-color); margin-top:2px; }
        .pline .ptotal { flex:none; font-size:17px; font-weight:700; white-space:nowrap; }
        .pline .x { flex:none; width:30px; height:30px; padding:0; font-size:14px; border-radius:50%; background:transparent; color:var(--secondary-text-color); }
      </style>
      <ha-card>
        <div class="hero">
          <div><div class="label">Total</div><div class="count" id="count"></div></div>
          <span class="sum" id="sum"></span>
        </div>
        <div class="cols">
          <div class="left">
            <div class="amount"><span class="cur" id="cur"></span><span class="val" id="val"></span></div>
            <div class="qty"><span class="cap">Qty</span><div class="ctl"><button id="qm" aria-label="Fewer">−</button><span class="n" id="qty"></span><button id="qp" aria-label="More">+</button></div></div>
            <div class="pad">${keys.map((k) => `<button data-k="${k}"${k === "<" ? ' class="back"' : ""}>${k === "<" ? "⌫" : k}</button>`).join("")}</div>
            <div class="actions"><button class="clr" id="clr">Clear</button><button class="add" id="add">Add</button></div>
          </div>
          <div class="right"><div class="rin">
            <div class="addrow"><input id="new" type="text" placeholder="Add item to list" enterkeyhint="done" autocomplete="off"><button id="newbtn" aria-label="Add item to list">+</button></div>
            <div class="list" id="list"></div>
          </div></div>
        </div>
        <button class="finish" id="finish">Finish shop</button>
        <div class="priced" id="priced"></div>
      </ha-card>`;
    const $ = (s) => this.shadowRoot.querySelector(s);
    this.shadowRoot.querySelectorAll(".pad button").forEach((b) => b.addEventListener("click", () => this._press(b.dataset.k)));
    $("#qm").addEventListener("click", () => { this._qty = Math.max(1, this._qty - 1); this._renderDisplay(); });
    $("#qp").addEventListener("click", () => { this._qty = Math.min(99, this._qty + 1); this._renderDisplay(); });
    $("#add").addEventListener("click", () => this._add());
    $("#finish").addEventListener("click", () => this._finish());
    $("#newbtn").addEventListener("click", () => this._newItem());
    $("#new").addEventListener("keydown", (ev) => { if (ev.key === "Enter") this._newItem(); });
    $("#clr").addEventListener("click", () => {
      if (this._input || this._label) { this._input = ""; this._label = ""; this._renderDisplay(); this._renderList(); return; }
      if (this._entries.length && confirm("Clear all prices? Items stay ticked off.")) { this._entries = []; this._save(); this._renderDisplay(); this._renderList(); }
    });
    this._renderDisplay();
    this._renderList();
  }

  _renderDisplay() {
    const $ = (s) => this.shadowRoot.querySelector(s);
    $("#cur").textContent = this._cur;
    $("#val").textContent = this._input || "0";
    $("#val").classList.toggle("empty", !this._input);
    $("#qty").textContent = "×" + this._qty;
    $("#sum").textContent = this._fmt(this._total());
    $("#count").textContent = this._entries.length + " price" + (this._entries.length === 1 ? "" : "s") + " added";
    $("#finish").disabled = !this._entries.length;
  }

  _renderList() {
    if (!this.shadowRoot || !this.shadowRoot.querySelector("#list")) return;
    this._renderOpen();
    this._renderPriced();
  }

  // Right-hand list: open (unpriced) items only.
  _renderOpen() {
    const box = this.shadowRoot.querySelector("#list");
    box.innerHTML = "";
    const rows = this._all.filter((i) => !i.done);
    rows.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    if (!rows.length) {
      box.innerHTML = '<div class="muted">Nothing left on the list</div>';
      return;
    }
    for (const item of rows) {
      const row = document.createElement("div");
      row.className = "row" + (this._label === item.name ? " on" : "");
      const tick = document.createElement("span");
      tick.className = "tick";
      row.appendChild(tick);
      const nameEl = document.createElement("span");
      nameEl.className = "name";
      nameEl.textContent = item.name;
      row.appendChild(nameEl);
      if (item.qty > 1) {
        const badge = document.createElement("span");
        badge.className = "badge";
        badge.textContent = "×" + item.qty;
        row.appendChild(badge);
      }
      // Tap selects the item; a long press (without moving) asks to remove it from the list.
      let timer = null, sx = 0, sy = 0, fired = false;
      const cancel = () => { if (timer) { clearTimeout(timer); timer = null; } };
      row.addEventListener("pointerdown", (e) => {
        fired = false;
        sx = e.clientX; sy = e.clientY;
        cancel();
        timer = setTimeout(() => { timer = null; fired = true; this._removeItem(item); }, 550);
      });
      row.addEventListener("pointermove", (e) => { if (timer && Math.hypot(e.clientX - sx, e.clientY - sy) > 10) cancel(); });
      for (const ev of ["pointerup", "pointercancel", "pointerleave"]) row.addEventListener(ev, cancel);
      row.addEventListener("contextmenu", (e) => e.preventDefault());
      row.addEventListener("click", () => {
        if (fired) { fired = false; return; }
        if (this._label === item.name) { this._label = ""; }
        else { this._label = item.name; this._qty = item.qty; this._renderDisplay(); }
        this._renderList();
      });
      box.appendChild(row);
    }
  }

  // Below the Finish button: every price added (the cart), newest first.
  _renderPriced() {
    const box = this.shadowRoot.querySelector("#priced");
    box.innerHTML = "";
    if (!this._entries.length) return;
    const head = document.createElement("div");
    head.className = "head";
    head.innerHTML = "<span>In Cart</span><span>" + this._entries.length + "</span>";
    box.appendChild(head);
    const list = document.createElement("div");
    list.className = "plist";
    for (let idx = this._entries.length - 1; idx >= 0; idx--) {
      const e = this._entries[idx];
      const line = document.createElement("div");
      line.className = "pline";
      const tick = document.createElement("span");
      tick.className = "tick";
      tick.textContent = "✓";
      line.appendChild(tick);
      const info = document.createElement("div");
      info.className = "info";
      const nm = document.createElement("div");
      nm.className = "pname";
      nm.textContent = e.label;
      info.appendChild(nm);
      if (e.qty > 1) {
        const sub = document.createElement("div");
        sub.className = "psub";
        sub.textContent = e.qty + " × " + this._fmt(e.price);
        info.appendChild(sub);
      }
      line.appendChild(info);
      const tot = document.createElement("span");
      tot.className = "ptotal";
      tot.textContent = this._fmt(e.price * e.qty);
      line.appendChild(tot);
      const x = document.createElement("button");
      x.className = "x";
      x.textContent = "✕";
      x.setAttribute("aria-label", "Remove price");
      x.addEventListener("click", () => {
        this._entries.splice(idx, 1);
        if (!this._entries.some((o) => o.label === e.label)) this._setDone(e.label, false);
        this._save();
        this._renderDisplay();
        this._renderList();
      });
      line.appendChild(x);
      list.appendChild(line);
    }
    box.appendChild(list);
  }
}

if (!customElements.get("shoppingmate-calc-card")) customElements.define("shoppingmate-calc-card", ShopCalcCard);
window.customCards = window.customCards || [];
window.customCards.push({ type: "shoppingmate-calc-card", name: "ShoppingMate Calculator", description: "Keypad and running total for in-store shopping" });
