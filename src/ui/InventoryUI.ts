// File: src/ui/InventoryUI.ts
import { InventorySystem } from "../systems/InventorySystem";

export class InventoryUI {
  private container: HTMLElement;

  constructor(private inventory: InventorySystem) {
    this.container = document.createElement("div");
    this.container.id = "inventory-ui";

    // Styling
    this.container.style.position = "absolute";
    this.container.style.top = "200px";
    this.container.style.right = "590px";
    this.container.style.background = "#111";
    this.container.style.color = "#fff";
    this.container.style.padding = "12px 16px";
    this.container.style.borderRadius = "8px";
    this.container.style.display = "none";
    this.container.style.zIndex = "1000";
    this.container.style.fontFamily = "sans-serif";
    this.container.style.minWidth = "180px";

    document.body.appendChild(this.container);

    // ✅ Always update UI when inventory changes
    this.inventory.addEventListener("changed", () => {
      console.log("[InventoryUI] Event received: changed");
      this.update();
    });

    // Toggle UI with "I"
    window.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() === "i") {
        this.toggle();
      }
    });
  }

  update() {
    const items = this.inventory.getItems();
    console.log("[InventoryUI] Rendering items:", items);

    this.container.innerHTML = `
      <h3 style="text-align: center; margin: 0 0 8px 0;">Inventory</h3>
      <ul style="list-style-type: disc; padding-left: 16px; margin: 0;">
        ${
          items.length
            ? items.map(i => `<li>${i.name} x${i.quantity}</li>`).join("")
            : "<li>Empty</li>"
        }
      </ul>
    `;
  }

  toggle() {
    const visible = this.container.style.display === "block";
    this.container.style.display = visible ? "none" : "block";
    if (!visible) this.update();
  }
}
