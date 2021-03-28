let preprocessor = "sass", // Preprocessor (sass, less, styl); 'sass' also work with the Scss syntax in blocks/ folder.
  fileswatch = "html,htm,txt,json,md,woff2"; // List of files extensions for watching & hard reload

const { src, dest, parallel, series, watch } = require("gulp");
const gulp = require("gulp");
const browserSync = require("browser-sync").create();
const bssi = require("browsersync-ssi");
const sass = require("gulp-sass");
const sassglob = require("gulp-sass-glob");
const cleancss = require("gulp-clean-css");
const autoprefixer = require("gulp-autoprefixer");
const rename = require("gulp-rename");
const imagemin = require("gulp-imagemin");
const newer = require("gulp-newer");
const svgSprite = require("gulp-svg-sprite");

function browsersync() {
  browserSync.init({
    server: {
      baseDir: "app/",
      middleware: bssi({ baseDir: "app/", ext: ".html" }),
    },
    ghostMode: { clicks: false },
    notify: false,
    online: true,
    // tunnel: 'yousutename', // Attempt to use the URL https://yousutename.loca.lt
  });
}

function styles() {
  return src([
    `app/styles/${preprocessor}/*.*`,
    `!app/styles/${preprocessor}/_*.*`,
  ])
    .pipe(eval(`${preprocessor}glob`)())
    .pipe(eval(preprocessor)())
    .pipe(
      autoprefixer({ overrideBrowserslist: ["last 10 versions"], grid: true })
    )
    .pipe(
      cleancss({
        level: { 1: { specialComments: 0 } } /* format: 'beautify' */,
      })
    )
    .pipe(rename({ suffix: ".min" }))
    .pipe(dest("app/css"))
    .pipe(browserSync.stream());
}

function images() {
  return src(["app/images/src/**/*"])
    .pipe(newer("app/images/dist"))
    .pipe(imagemin())
    .pipe(dest("app/images/dist"))
    .pipe(browserSync.stream());
}

function startwatch() {
  watch(`app/styles/${preprocessor}/**/*`, { usePolling: true }, styles);
  watch(
    "app/images/src/**/*.{jpg,jpeg,png,webp,svg,gif}",
    { usePolling: true },
    images
  );
  watch(`app/**/*.{${fileswatch}}`, { usePolling: true }).on(
    "change",
    browserSync.reload
  );
}

gulp.task("svgSprite", function () {
  return gulp
    .src(["app/images/src/iconsprite/*.svg"])
    .pipe(
      svgSprite({
        mode: {
          stack: {
            sprite: "../icons",
            example: true,
          },
        },
      })
    )
    .pipe(dest("app/images/dist"));
});

exports.styles = styles;
exports.images = images;
exports.assets = series(styles, images);
exports.default = series(styles, images, parallel(browsersync, startwatch));
