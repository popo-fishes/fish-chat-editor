import Emitter from "./emitter";

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
    this.isComposing = true;
    this.emitter.emit(Emitter.events.COMPOSITION_START, event);
  }

  private handleCompositionEnd(event: CompositionEvent) {
    this.isComposing = false;
    this.emitter.emit(Emitter.events.COMPOSITION_END, event);
  }
}

export default Composition;
