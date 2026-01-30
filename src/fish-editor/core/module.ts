/*
 * @Date: 2024-11-04 10:25:25
 * @Description: Modify here please
 */
import type FishEditor from "./fishEditor";

abstract class Module<T extends {} = {}> {
  static DEFAULTS = {};

  constructor(
    public fishEditor: FishEditor,
    protected options: Partial<T> = {}
  ) {}
}

export default Module;
