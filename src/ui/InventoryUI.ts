import { InventorySystem } from "../systems/InventorySystem";
import { hotbar } from "../scene";
import { InventoryItem } from "../types/InventoryItems";

class InventoryUI {
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
    this.inventory.addEventListener(() => {
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
    const hotbarItems = hotbar.getSlots();
    const filteredItems = items.filter(
      invItem => !hotbarItems.some(slot => slot && slot.id === invItem.id)
    );

    console.log("[InventoryUI] Rendering items (filtered):", filteredItems);

    this.container.innerHTML = `
      <h3 style="text-align: center; margin: 0 0 8px 0;">Inventory</h3>
      <ul style="list-style-type: disc; padding-left: 16px; margin: 0;">
        ${
          filteredItems.length
            ? filteredItems
                .map(
                  (i, idx) => `
          <li 
            draggable="true"
            data-id="${i.id}" 
            data-name="${i.name}" 
            data-icon="${i.icon || ''}"
            style="cursor: grab;"
          >
            ${i.name} x${i.quantity}
          </li>`
                )
                .join("")
            : "<li>Empty</li>"
        }
      </ul>
    `;

    this.makeItemsDraggable();
  }

  toggle() {
    const visible = this.container.style.display === "block";
    this.container.style.display = visible ? "none" : "block";
    if (!visible) this.update();
  }

  private makeItemsDraggable() {
    const listItems = this.container.querySelectorAll("li[draggable=true]");
    listItems.forEach((el) => {
      el.addEventListener("dragstart", (e) => {
        const dragEvent = e as DragEvent;
        const target = dragEvent.target as HTMLElement;
        const payload: InventoryItem = {
          id: target.dataset.id || "",
          name: target.dataset.name || "",
          icon: target.dataset.icon || "",
          quantity: 1,
        };
        dragEvent.dataTransfer?.setData("text/plain", JSON.stringify(payload));
      });
    });
  }
}

export default InventoryUI;
