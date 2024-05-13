/*
 * @Date: 2024-05-13 20:53:04
 * @Description: Modify here please
 */
import path from "path";
import { dest, parallel, series, src } from "gulp";
import consola from "consola";
import gulpSass from "gulp-sass";
import autoprefixer from "gulp-autoprefixer";
import dartSass from "sass";

const distFolder = path.resolve(__dirname, "dist");

const withTaskName = (name: string, fn: any) => Object.assign(fn, { displayName: name });

/** create theme-chalk */
const buildThemeChalk = () => {
  const sass = gulpSass(dartSass);
  return (
    src(["**/*.scss", "!node_modules/**/*"], {
      cwd: path.resolve("./src", "style")
    })
      .on("data", function (file) {
        consola.log("Processing file:", file.path);
      })
      // not use sass.sync().on('error', sass.logError) to throw exception
      .pipe(sass.sync())

      // https://github.com/sindresorhus/gulp-autoprefixer
      .pipe(autoprefixer({ cascade: false }))
      // https://www.npmjs.com/package/gulp-clean-css
      // .pipe(
      //   cleanCSS({}, (details) => {
      //     consola.success(
      //       `${chalk.cyan(details.name)}: ${chalk.yellow(details.stats.originalSize / 1000)} KB -> ${chalk.green(details.stats.minifiedSize / 1000)} KB`
      //     );
      //   })
      // )
      // output
      .pipe(dest(distFolder))
  );
};

// !!! You should pay attention to this order
const build = series(
  // create theme-chalk
  parallel(withTaskName("buildThemeChalk", buildThemeChalk))
);

export default build;
