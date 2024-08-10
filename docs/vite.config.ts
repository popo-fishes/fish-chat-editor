/*
 * @Date: 2024-08-10 10:44:01
 * @Description: Modify here please
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()]
});
