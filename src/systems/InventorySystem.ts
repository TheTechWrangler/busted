import { InventoryItem } from "../types/InventoryItems";
import { EventDispatcher } from 'three';

interface InventoryEvents {
  changed: { type: 'changed' };
}

export class InventorySystem extends EventDispatcher<InventoryEvents> {
  private items: InventoryItem[] = [];

  addItem(item: InventoryItem) {
    const existing = this.items.find(i => i.id === item.id);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      this.items.push({ ...item });
    }
    console.log("[InventorySystem] addItem:", item);
    console.log("[InventorySystem] current items:", this.items);
    this.dispatchEvent({ type: 'changed' }); // ✅ now correctly typed
  }

  removeItem(id: string, amount = 1) {
    const item = this.items.find(i => i.id === id);
    if (item) {
      item.quantity -= amount;
      if (item.quantity <= 0) {
        this.items = this.items.filter(i => i.id !== id);
      }
      this.dispatchEvent({ type: 'changed' }); // ✅ now correctly typed
    }
  }

  getItems() {
    return this.items;
  }

  clear() {
    this.items = [];
    this.dispatchEvent({ type: 'changed' }); // ✅ now correctly typed
  }
}
