import Emitter from "./emitter.js";

class Composition {
  isComposing = false;

  constructor(
    private root: HTMLDivElement,
    private emitter: Emitter
  ) {
    this.setupListeners();
  }

  private setupListeners() {
    this.root.addEventListener("compositionstart", (event) => {
      if (!this.isComposing) {
        this.handleCompositionStart(event);
      }
    });

    this.root.addEventListener("compositionend", (event) => {
      if (this.isComposing) {
        this.handleCompositionEnd(event);
      }
    });
  }

  private handleCompositionStart(event: CompositionEvent) {
    this.emitter.emit(Emitter.events.COMPOSITION_START, event);
    this.isComposing = true;
  }

  private handleCompositionEnd(event: CompositionEvent) {
    this.emitter.emit(Emitter.events.COMPOSITION_END, event);
    this.isComposing = false;
  }
}

export default Composition;
