// src/systems/InventorySystem.ts
import { InventoryItem } from "../types/InventoryItems";

export class InventorySystem {
  private items: InventoryItem[] = [];

  addItem(item: InventoryItem) {
    const existing = this.items.find(i => i.id === item.id);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      this.items.push({ ...item });
    }
  }

  removeItem(id: string, amount = 1) {
    const item = this.items.find(i => i.id === id);
    if (item) {
      item.quantity -= amount;
      if (item.quantity <= 0) {
        this.items = this.items.filter(i => i.id !== id);
      }
    }
  }

  getItems() {
    return this.items;
  }

  clear() {
    this.items = [];
  }
}
