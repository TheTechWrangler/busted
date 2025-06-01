// src/systems/InventorySystem.ts
import { InventoryItem } from "../types/InventoryItems";
import { EventDispatcher } from "three";

interface InventoryEvents {
  changed: { type: "changed" };
}

export class InventorySystem extends EventDispatcher<InventoryEvents> {
  private items: InventoryItem[] = [];

  constructor() {
    super();
    console.log("[InventorySystem] constructor called.");
  }

  addItem(item: InventoryItem) {
    console.log("[InventorySystem] addItem called with:", item);
    console.trace("[InventorySystem] stack trace for addItem");

    const existing = this.items.find((i) => i.id === item.id);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      this.items.push({ ...item });
    }

    console.log("[InventorySystem] items after add:", this.items);
    this.dispatchEvent({ type: "changed" });
  }

  removeItem(id: string, amount = 1) {
    console.log(`[InventorySystem] removeItem('${id}', ${amount})`);
    const item = this.items.find((i) => i.id === id);
    if (item) {
      item.quantity -= amount;
      if (item.quantity <= 0) {
        this.items = this.items.filter((i) => i.id !== id);
      }
      this.dispatchEvent({ type: "changed" });
    }
  }

  getItems() {
    console.log("[InventorySystem] getItems() called, returning:", this.items);
    console.trace("[InventorySystem] stack trace for getItems");
    return this.items;
  }

  clear() {
    console.log("[InventorySystem] clear() called");
    this.items = [];
    this.dispatchEvent({ type: "changed" });
  }
}
