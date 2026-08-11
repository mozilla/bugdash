import { __ } from "util";

// <multi-select>: a multiple-choice dropdown with tags and type-to-filter,
//
// usage:
//   <multi-select placeholder="Select Team">
//     <option value="1">Frontend</option>
//     <option value="2">DevTools</option>
//   </multi-select>
//
// or set items from js: $multiselect.items = [{value: "1", text: "Frontend"}];

class MultiSelect extends HTMLElement {
    static observedAttributes = ["placeholder", "disabled"];

    connectedCallback() {
        if (this._connected) return;
        this._connected = true;

        this._items = this.parseOptions();
        this._filter = "";
        this._activeIndex = 0;
        this._isOpen = false;

        this.textContent = "";
        this.render();
        this.attachHandlers();
        this.refreshDisabled();
    }

    attributeChangedCallback(name) {
        if (!this._connected) return;
        if (name === "placeholder") this.refreshField();
        if (name === "disabled") this.refreshDisabled();
    }

    get disabled() {
        return this.hasAttribute("disabled");
    }

    set disabled(disabled) {
        this.toggleAttribute("disabled", disabled);
    }

    get items() {
        return this._items.map(({ value, text }) => ({ value, text }));
    }

    set items(items) {
        this._items = items.map((item) => ({
            value: item.value ?? item.text,
            text: item.text,
            selected: false,
        }));
        this.refreshField();
        this.refreshList();
    }

    get value() {
        return this._items.filter((item) => item.selected).map((item) => item.value);
    }

    set value(values) {
        const set = new Set(values);
        for (const item of this._items) {
            item.selected = set.has(item.value);
        }
        this.refreshField();
        this.refreshList();
    }

    parseOptions() {
        const items = [];
        for (const $option of __(this, "option")) {
            items.push({
                value: $option.value || $option.textContent,
                text: $option.textContent,
                selected: $option.selected,
            });
        }
        return items;
    }

    render() {
        this._field = document.createElement("div");
        this._field.className = "multiselect-field";
        this._field.tabIndex = 0;

        this._search = document.createElement("input");
        this._search.type = "search";
        this._search.className = "multiselect-search";
        this._search.placeholder = "Filter…";

        this._list = document.createElement("ul");
        this._list.className = "multiselect-list";

        this._empty = document.createElement("div");
        this._empty.className = "multiselect-empty";
        this._empty.textContent = "No matches";
        this._empty.hidden = true;

        this._popup = document.createElement("div");
        this._popup.className = "multiselect-popup";
        this._popup.hidden = true;
        this._popup.append(this._search, this._list, this._empty);

        this.append(this._field, this._popup);

        this.refreshField();
        this.refreshList();
    }

    attachHandlers() {
        this._field.addEventListener("click", (event) => this.fieldClickHandler(event));
        this._field.addEventListener("keydown", (event) => this.keyDownHandler(event));
        this._search.addEventListener("keydown", (event) => this.keyDownHandler(event));
        this._search.addEventListener("input", () => this.searchInputHandler());
        this._search.addEventListener("change", (event) => event.stopPropagation());
        this._list.addEventListener("click", (event) => this.listClickHandler(event));
        document.addEventListener("click", (event) => this.documentClickHandler(event));
    }

    fieldClickHandler(event) {
        if (this.disabled) return;
        if (event.target.closest(".multiselect-tag-remove")) return;
        this._isOpen ? this.close() : this.open();
    }

    documentClickHandler(event) {
        // refreshList() rebuilds the clicked li's ancestors during the same
        // click, detaching event.target before this listener runs; composedPath()
        // captures the path at dispatch time, so it is unaffected
        if (this._isOpen && !event.composedPath().includes(this)) {
            this.close();
        }
    }

    keyDownHandler(event) {
        if (this.disabled) return;
        switch (event.key) {
            case "Enter":
                if (this._isOpen) {
                    this.toggleActiveItem();
                } else {
                    this.open();
                }
                break;
            case " ":
                if (this._isOpen) return;
                this.open();
                break;
            case "Escape":
                this.close();
                break;
            case "ArrowDown":
                event.altKey ? this.open() : this.moveActive(1);
                break;
            case "ArrowUp":
                event.altKey ? this.close() : this.moveActive(-1);
                break;
            case "Home":
                this.setActiveIndex(0);
                break;
            case "End":
                this.setActiveIndex(this.visibleItems().length - 1);
                break;
            case "Backspace":
                if (this._search.value === "") this.removeLastSelected();
                else return;
                break;
            case "Tab":
                this.close();
                return;
            default:
                return;
        }
        event.preventDefault();
    }

    searchInputHandler() {
        this._filter = this._search.value.trim().toLowerCase();
        this.setActiveIndex(0);
        this.refreshList();
    }

    listClickHandler(event) {
        if (this.disabled) return;
        const $item = event.target.closest("li[data-value]");
        if (!$item) return;
        this.toggleItem(this.itemByValue($item.dataset.value));
    }

    visibleItems() {
        return this._items.filter(
            (item) =>
                this._filter === "" || item.text.toLowerCase().includes(this._filter),
        );
    }

    itemByValue(value) {
        return this._items.find((item) => item.value === value);
    }

    toggleActiveItem() {
        const item = this.visibleItems()[this._activeIndex];
        if (item) this.toggleItem(item);
    }

    toggleItem(item) {
        item.selected = !item.selected;
        this.fireChangeEvent();
        this.refreshField();
        this.refreshList();
    }

    removeLastSelected() {
        const selected = this._items.filter((item) => item.selected);
        const last = selected.at(-1);
        if (!last) return;
        last.selected = false;
        this.fireChangeEvent();
        this.refreshField();
        this.refreshList();
    }

    fireChangeEvent() {
        this.dispatchEvent(new Event("change", { bubbles: true }));
    }

    moveActive(delta) {
        if (!this._isOpen) {
            this.open();
            return;
        }
        const count = this.visibleItems().length;
        if (count === 0) return;
        this.setActiveIndex((this._activeIndex + delta + count) % count);
    }

    setActiveIndex(index) {
        this._activeIndex = index;
        this.refreshList();
    }

    open() {
        if (this.disabled) return;
        this._isOpen = true;
        this._popup.hidden = false;
        this._search.value = "";
        this._filter = "";
        this.setActiveIndex(0);
        this._search.focus();
    }

    close() {
        this._isOpen = false;
        this._popup.hidden = true;
        // pull focus out of the popup we just hid, but only when it's still ours
        // to move; on an outside click the clicked control already has focus, and
        // on becoming disabled the field is no longer focusable
        if (!this.disabled && this.contains(document.activeElement)) {
            this._field.focus();
        }
    }

    refreshDisabled() {
        this._field.tabIndex = this.disabled ? -1 : 0;
        if (this.disabled) this.close();
    }

    refreshField() {
        this._field.textContent = "";

        const selected = this._items.filter((item) => item.selected);
        if (selected.length === 0) {
            const $placeholder = document.createElement("span");
            $placeholder.className = "multiselect-placeholder";
            $placeholder.textContent = this.getAttribute("placeholder") || "";
            this._field.append($placeholder);
        } else {
            for (const item of selected) {
                this._field.append(this.createTag(item));
            }
        }

        const $caret = document.createElement("span");
        $caret.className = "material-icons multiselect-caret";
        $caret.textContent = "arrow_drop_down";
        this._field.append($caret);
    }

    createTag(item) {
        const $tag = document.createElement("span");
        $tag.className = "multiselect-tag";
        $tag.dataset.value = item.value;
        $tag.append(item.text);

        const $remove = document.createElement("span");
        $remove.className = "material-icons multiselect-tag-remove";
        $remove.textContent = "close";
        $remove.addEventListener("click", (event) => {
            event.stopPropagation();
            if (this.disabled) return;
            this.toggleItem(item);
        });
        $tag.append($remove);

        return $tag;
    }

    refreshList() {
        this._list.textContent = "";

        const visible = this.visibleItems();
        this._empty.hidden = visible.length > 0;

        visible.forEach((item, index) => {
            const $li = document.createElement("li");
            $li.dataset.value = item.value;
            $li.classList.toggle("selected", item.selected);
            $li.classList.toggle("active", index === this._activeIndex);
            $li.append(item.text);

            if (item.selected) {
                const $check = document.createElement("span");
                $check.className = "material-icons";
                $check.textContent = "check";
                $li.append($check);
            }

            this._list.append($li);
        });
    }
}

export function initUI() {
    if (!customElements.get("multi-select")) {
        customElements.define("multi-select", MultiSelect);
    }
}
