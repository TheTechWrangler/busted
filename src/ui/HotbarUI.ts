// File: src/ui/HotbarUI.ts
import { InventoryItem } from "../types/InventoryItems";

export class HotbarUI {
  private container: HTMLElement;
  private slots: (InventoryItem | null)[] = new Array(10).fill(null);
  private onSlotAssigned?: (item: InventoryItem) => void;

  constructor() {
    this.container = document.createElement("div");
    this.container.id = "hotbar-ui";

    // Style the hotbar
    this.container.style.position = "absolute";
    this.container.style.bottom = "30px";
    this.container.style.left = "50%";
    this.container.style.transform = "translateX(-50%)";
    this.container.style.display = "flex";
    this.container.style.gap = "6px";
    this.container.style.zIndex = "999";
    this.container.style.pointerEvents = "auto";

    for (let i = 0; i < 10; i++) {
      const slot = document.createElement("div");
      slot.className = "hotbar-slot";
      slot.dataset.index = i.toString();
      slot.style.width = "50px";
      slot.style.height = "50px";
      slot.style.border = "2px solid #555";
      slot.style.background = "#222";
      slot.style.display = "flex";
      slot.style.justifyContent = "center";
      slot.style.alignItems = "center";
      slot.style.color = "#fff";
      slot.innerText = `${(i + 1) % 10}`; // 1–9, 0 for 10

      // ─────────────────────────────────────────────
      // Drag and Drop Support
      // ─────────────────────────────────────────────
      slot.addEventListener("dragover", (e) => {
        e.preventDefault();
        slot.style.borderColor = "yellow";
      });

      slot.addEventListener("dragleave", () => {
        slot.style.borderColor = "#555";
      });

      slot.addEventListener("drop", (e) => {
        e.preventDefault();
        slot.style.borderColor = "#555";

        const data = e.dataTransfer?.getData("text/plain");
        if (data) {
          try {
            const item: InventoryItem = JSON.parse(data);
            this.setSlot(i, {
              id: item.id,
              name: item.name,
              quantity: item.quantity || 1,
              icon: item.icon || "",
            });
          } catch (err) {
            console.error("Failed to parse dropped item:", err);
          }
        }
      });

      this.container.appendChild(slot);
    }

    document.body.appendChild(this.container);
  }

  setSlot(index: number, item: InventoryItem | null) {
    this.slots[index] = item;
    const slot = this.container.children[index] as HTMLElement;
    slot.innerHTML = item ? `<img src="${item.icon}" style="width:80%;">` : `${(index + 1) % 10}`;

    if (item && this.onSlotAssigned) {
      this.onSlotAssigned(item);
    }
  }

  setOnSlotAssigned(callback: (item: InventoryItem) => void) {
    this.onSlotAssigned = callback;
  }

  getSlots() {
    return this.slots;
  }

  clearSlot(index: number) {
    this.setSlot(index, null);
  }
}
