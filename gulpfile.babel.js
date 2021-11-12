"use strict";

import gulp from "gulp";
import batch from "gulp-batch";
import watch from "gulp-watch";
import plumber from "gulp-plumber";
import notify from "gulp-notify";
import gutil from "gulp-util";
import source from "vinyl-source-stream";
import buffer from "vinyl-buffer";
import pugInheritance from "gulp-pug-inheritance";
import pug from "gulp-pug";
import sass from "gulp-sass";
import postcss from "gulp-postcss";
import autoprefixer from "autoprefixer";
import minifyCSS from "gulp-csso";
import sourcemaps from "gulp-sourcemaps";
import babel from "gulp-babel";
import browserify from "browserify";
import babelify from "babelify";
import es2015 from "babel-preset-es2015";
import uglify from "gulp-uglify";
import browserSync from "browser-sync";
import filter from "gulp-filter";
import changed from "gulp-changed";
import imagemin from "gulp-imagemin";
import clean from "gulp-rimraf";
import purify from "gulp-purifycss";
import merge from "merge-stream";
import glob from "glob-all";
import path from "path";
import concat from "gulp-concat";

// Code Linting
import eslint from "gulp-eslint";
import reporter from "postcss-reporter";
import bemlinter from "postcss-bem-linter";
import syntax_scss from "postcss-scss";
import stylelint from "stylelint";
import gstylelint from "gulp-stylelint";
import stylelintFormatter from "stylelint-formatter-pretty";

browserSync.create();

// PATHS
const dirs = {
	src: "src",
	dest: "dist",
};
const paths = {
	css: {
		source: `${dirs.src}/css/*.scss`,
		watch: `${dirs.src}/css/**/*.scss`,
		dest: `${dirs.dest}/css/`,
	},
	js: {
		source: [`${dirs.src}/js/**/*.js`],
		dest: `${dirs.dest}/js/`,
		// vendor:     `${dirs.src}/assets/js/vendor/*.js`,
		// js    :     [`${dirs.src}/assets/js/vendor.min.js`, `${dirs.src}/assets/js/main.min.js`]
	},
	pug: {
		source: [`${dirs.src}/**/*.pug`, `${dirs.src}/**/**/*.pug`],
		dest: `${dirs.dest}/`,
		watch: [
			`${dirs.src}/pug/**/*.pug`,
			`${dirs.src}/pug/**/**/*.pug`,
			`${dirs.src}/*.pug`,
		],
	},
	images: {
		source: `${dirs.src}/img/**/*.{png,jpg,jpeg,gif,svg}`,
		dest: `${dirs.dest}/img/`,
	},
	fonts: {
		source: `${dirs.src}/fonts/**/*.{eot,woff,woff2}`,
		dest: `${dirs.dest}/fonts/`,
	},
};

// Clean Dist Directory
gulp.task("clean", [], () => {
	console.log("Clean all files in dist folder");

	return gulp.src("dist/*", { read: false }).pipe(clean());
});

const plugins = [autoprefixer({ browsers: ["last 10 version"] })];

// SASS
gulp.task("sass", () =>
	gulp
		.src(paths.css.source)
		.pipe(
			plumber({
				errorHandler: notify.onError({
					message: "<%= error.message %>",
					title: "CSS preprocessing",
				}),
			})
		)
		.pipe(sourcemaps.init())
		.pipe(sass({ outputStyle: "compressed" }).on("error", sass.logError))
		.pipe(postcss(plugins))
		.pipe(minifyCSS())
		.pipe(sourcemaps.write("."))
		.pipe(gulp.dest(paths.css.dest))
		.pipe(browserSync.stream({ match: "**/*.css" }))
);

gulp.task("scss-lint", function () {
	return gulp
		.src(["./src/css/**/*.scss", "!./src/css/1-plugins/**/*.scss"])
		.pipe(
			gstylelint({
				failAfterError: false,
				reporters: [
					{
						formatter: stylelintFormatter,
						console: true,
					},
				],
			})
		);
});

// Eslint
gulp.task("eslint", () =>
	gulp
		// .src('./src/js/**/*.js')
		.src(["./src/js/**/*.js", "!./src/js/plugins/*"])
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failAfterError())
);

// PUG
gulp.task("pug", () =>
	gulp
		.src(paths.pug.source)
		.pipe(
			plumber({
				errorHandler: notify.onError({
					message: "<%= error.message %>",
					title: "Template compilation",
				}),
			})
		)
		.pipe(changed(dirs.dest, { extension: ".html" }))
		.pipe(
			pugInheritance({
				basedir: "src",
				extension: ".pug",
				skip: "node_modules",
			})
		)
		.pipe(
			filter(
				(file) => !/\/_/.test(file.path) && !/^_/.test(file.relative)
			)
		)
		.pipe(
			pug({
				pretty: true,
			})
		)
		.pipe(gulp.dest(paths.pug.dest))
		.pipe(browserSync.stream())
);

// ES6 Bundles generator
gulp.task("bundle-js", ["vendor-js"], () => {
	const files = glob.sync(["./src/js/*.js", "!./src/js/plugins/*"]);
	return merge(
		files.map((file) =>
			browserify({
				entries: file,
				debug: true,
			})
				.transform(babelify.configure({ presets: [es2015] }))
				.on(
					"error",
					notify.onError({
						message: "<%= error.message %>",
						title: "Babelify JS",
					})
				)
				.bundle()
				.on(
					"error",
					notify.onError({
						message: "<%= error.message %>",
						title: "JS compilation",
					})
				)
				.pipe(source(`${path.basename(file, ".js")}.js`))
				.pipe(buffer())
				.pipe(sourcemaps.init({ loadMaps: true }))
				// .pipe(uglify())
				.pipe(sourcemaps.write("."))
				.pipe(gulp.dest(paths.js.dest))
				.pipe(browserSync.stream())
		)
	);
});

//Vendor Files
gulp.task("vendor-js", function () {
	return gulp
		.src([
			"./src/js/plugins/jquery.min.js",
			"./src/js/plugins/popper.js",
			"./src/js/plugins/bootstrap.min.js",
			"./src/js/plugins/aos.js",
			"./src/js/plugins/parsley.min.js",
			"./src/js/plugins/slick.min.js",
			"./src/js/plugins/magnific-popup.min.js",
			// "https://code.jquery.com/jquery-3.5.1.slim.min.js",
			// "https://cdn.jsdelivr.net/npm/popper.js@1.16.0/dist/umd/popper.min.js",
			// "https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/js/bootstrap.min.js",
			// "https://cdnjs.cloudflare.com/ajax/libs/aos/2.2.0/aos.js",
			// "https://cdnjs.cloudflare.com/ajax/libs/parsley.js/2.8.0/parsley.min.js",
			// "https://cdn.jsdelivr.net/npm/slick-carousel@1.8.1/slick/slick.min.js",
		])
		.pipe(concat("vendors.min.js"))
		.pipe(uglify())
		.pipe(gulp.dest("./dist/js/"));
});

gulp.task("images", () =>
	gulp
		.src(paths.images.source)
		.pipe(
			imagemin([
				imagemin.gifsicle({ interlaced: true }),
				imagemin.jpegtran({ progressive: true }),
				imagemin.optipng({ optimizationLevel: 5 }),
				imagemin.svgo({
					plugins: [{ removeViewBox: true }, { cleanupIDs: false }],
				}),
			])
		)
		.pipe(gulp.dest(paths.images.dest))
);

gulp.task("fonts", () =>
	gulp.src("src/fonts/**/*.*").pipe(gulp.dest("dist/fonts"))
);

gulp.task("js-vendor", () =>
	gulp.src("src/js/plugins/*.js").pipe(gulp.dest("dist/js/plugins"))
);

// SERVE
gulp.task("serve", () => {
	browserSync.init({
		server: {
			baseDir: "./dist",
		},
		open: true,
		port: 8000,
	});

	gulp.watch(paths.css.watch, ["sass"]);
	gulp.watch(paths.js.source, ["bundle-js"]);
	gulp.watch(paths.pug.watch, ["pug"]);
	gulp.watch(paths.images.source, ["images"], browserSync.reload);
	gulp.watch(paths.fonts.source, ["fonts"], browserSync.reload);
});

// TASKS
gulp.task("default", ["build", "serve"]);
gulp.task("build", [
	"pug",
	"sass",
	// "scss-lint",
	"eslint",
	"bundle-js",
	"images",
	"fonts",
	//   'js-vendor',
]);
