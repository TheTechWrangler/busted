import { InventorySystem } from "../systems/InventorySystem";
import { hotbar } from "../scene";
import { InventoryItem } from "../types/InventoryItems";

class InventoryUI {
  private container: HTMLElement;

  constructor(private inventory: InventorySystem) {
    this.container = document.createElement("div");
    this.container.id = "inventory-ui";

      console.log("[InventoryUI] Listening to inventory instance:", this.inventory); // 🧪 ADD THIS LINE


    // Styling
    Object.assign(this.container.style, {
      position: "absolute",
      top: "200px",
      right: "590px",
      background: "#111",
      color: "#fff",
      padding: "12px 16px",
      borderRadius: "8px",
      display: "none",
      zIndex: "1000",
      fontFamily: "sans-serif",
      minWidth: "180px"
    });

    document.body.appendChild(this.container);

    // ✅ Always update UI when inventory changes
    this.inventory.addEventListener((event: { type: string }) => {
      if (event.type === "changed") {
        console.log("[InventoryUI] Inventory changed.");
        this.update(); // 🔁 Always update, even if hidden
      }
      
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
                  (i) => `
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
    if (!visible) {
      this.update();
    }
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
