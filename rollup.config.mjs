/*
 * @Date: 2024-05-13 21:48:58
 * @Description: Modify here please
 */
import glob from "fast-glob";
import { babel } from "@rollup/plugin-babel";
import typescript from "@rollup/plugin-typescript";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import esbuild from "rollup-plugin-esbuild";
import { terser } from "rollup-plugin-terser";

const files = glob.sync("**/*.{ts,tsx}", {
  cwd: "./src",
  absolute: true,
  onlyFiles: true
});

const excludeFiles = () => {
  const excludes = ["node_modules", "test", "style", "types", "dist"];
  return files.filter((path) => !excludes.some((exclude) => path.includes(exclude)));
};

const externalConfig = [(id) => /\/__expample__|main.tsx/.test(id), "react", "react-dom", "classnames", "react-is", "antd", "**/node_modules/**"];

export default {
  //  input: excludeFiles(),
  input: "./src/index.ts",
  output: {
    // dir: "dist",
    // format: "es",
    // sourcemap: true,
    // preserveModules: true,
    // preserveModulesRoot: "src"
    file: "dist/index.js",
    format: "es",
    sourcemap: true
  },
  plugins: [
    nodeResolve({
      extensions: [".js", ".jsx", ".ts", ".tsx"]
    }),
    commonjs(),
    babel({
      presets: ["@babel/preset-env"],
      extensions: [".js", ".jsx", ".ts", ".tsx", ".scss"],
      exclude: "**/node_modules/**"
    }),
    esbuild({
      // map compressed or converted code back to the original source code
      sourceMap: true,
      target: "es2018"
    }),
    typescript(),
    terser({
      mangle: false, // Disable variable name obfuscation
      output: {
        beautify: true, // Beautify output
        comments: false // Delete all comments
      }
    })
  ],
  external: externalConfig,
  treeshake: false
};
