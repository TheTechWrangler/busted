// File: src/ui/HotbarUI.ts
import { InventoryItem } from "../types/InventoryItems";

export class HotbarUI {
  private container: HTMLElement;
  private slots: (InventoryItem | null)[] = new Array(10).fill(null);

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

      // ✅ Drag & Drop Events
      slot.addEventListener("dragover", (e) => e.preventDefault());
      slot.addEventListener("drop", (e) => this.handleDrop(e, i));

      this.container.appendChild(slot);
    }

    document.body.appendChild(this.container);
  }

  setSlot(index: number, item: InventoryItem | null) {
    this.slots[index] = item;
    const slot = this.container.children[index] as HTMLElement;
    slot.innerHTML = item ? `<img src="${item.icon}" style="width:80%;">` : `${(index + 1) % 10}`;
  }

  getSlots() {
    return this.slots;
  }

  clearSlot(index: number) {
    this.setSlot(index, null);
  }

  private handleDrop(e: DragEvent, slotIndex: number) {
    e.preventDefault();
    try {
      const data = e.dataTransfer?.getData("text/plain");
      if (!data) return;

      const item: InventoryItem = JSON.parse(data);
      if (!item.id || !item.name) return;

      this.setSlot(slotIndex, item);
      console.log(`[HotbarUI] Assigned ${item.name} to slot ${slotIndex + 1}`);
    } catch (err) {
      console.warn("Invalid drop data", err);
    }
  }
}
